import { Hono } from "hono";
import { authMiddleware } from "../middlewares";
import { HTTPException } from "hono/http-exception";
import { AuthService } from "../service/auth.service";
import MailService from "../service/mail.service";
import { z } from "zod";
import { UserService } from "../service/user.service";
import { comparePassword, isDisposableEmail, passwordHash } from "../utils";
import {
  ACCOUNT_DELETION_SCHEDULE_INTERVAL,
  BCRYPT_SALT,
} from "../environments";
import { helper, hs, timestamp } from "@form/utils";
import { RedisService } from "../service/redis.service";
import { zValidator } from "@hono/zod-validator";

// Request Body Schema
const updateEmailBodySchema = z.object({
  email: z.string().min(1).email("Invalid Email Address Format"),
  code: z.string().min(6).max(6),
});

const emailBodySchema = updateEmailBodySchema.pick({ email: true });

const verifyEmailBodySchema = updateEmailBodySchema.pick({ code: true });

const updateUserPasswordBodySchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(8)
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!#$%&()*+\-,.\/\\:<=>?@\[\]^_{|}~0-9a-zA-Z]{8,}$/
    ),
});

const updateUserBodySchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional(),
  restoreGravatar: z.boolean().optional(),
});

// Routes
const router = new Hono().basePath("user");

router.get("user-detail", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);
  return c.json({ ...user });
});

router.post("email-verification-code", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);

  if (user.isEmailVerified)
    throw new HTTPException(400, { message: "Email is already verified" });

  // Add a code of verify email address to cache
  const key = `verify_email:${user.id}`;
  const code = await AuthService.getVerificationCode(key);

  MailService.emailVerificationRequest(user.email, code);

  return c.json({ success: true });
});

router.post(
  "verify-email",
  authMiddleware,
  zValidator("json", verifyEmailBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const input = c.req.valid("json");

    if (user.isEmailVerified)
      throw new HTTPException(400, { message: "Email is already verified" });

    const key = `verify_email:${user.id}`;
    await AuthService.checkVerificationCode(key, input.code);

    await UserService.update(user.id, {
      isEmailVerified: true,
    });

    return c.json({ success: true });
  }
);

router.post(
  "update-user-password",
  authMiddleware,
  zValidator("json", updateUserPasswordBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const input = c.req.valid("json");

    const verified = await comparePassword(
      input.currentPassword,
      user.password
    );

    if (!verified)
      throw new HTTPException(400, { message: "The password does not match" });

    const result = await UserService.update(user.id, {
      password: await passwordHash(input.newPassword, BCRYPT_SALT),
    });

    MailService.passwordChangeAlert(user.email);

    return c.json({ success: true });
  }
);

router.post("user-deletion-code", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);

  const key = `user_deletion:${user.id}`;
  const code = await AuthService.getVerificationCode(key);

  await MailService.accountDeletionRequest(user.email, code);

  return c.json({ success: true });
});

router.post(
  "verify-user-deletion",
  authMiddleware,
  zValidator("json", verifyEmailBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const input = c.req.valid("json");

    const key = `user_deletion:${user.id}`;
    await AuthService.checkVerificationCode(key, input.code);

    await UserService.update(user.id, {
      isDeletionScheduled: true,
      deletionScheduledAt:
        timestamp() + hs(ACCOUNT_DELETION_SCHEDULE_INTERVAL)!,
    });

    await MailService.scheduleAccountDeletionAlert(user.email, user.name);

    return c.json({ success: true });
  }
);

router.post("cancel-user-deletion", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);

  const key = `user_deletion:${user.id}`;

  await UserService.update(user.id, {
    isDeletionScheduled: false,
    deletionScheduledAt: 0,
  });

  await RedisService.del(key);

  return c.json({ success: true });
});

router.post(
  "change-email-code",
  authMiddleware,
  zValidator("json", emailBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const input = c.req.valid("json");

    if (isDisposableEmail(input.email)) {
      throw new HTTPException(400, {
        message:
          "Error: Disposable email address detected, please use a work email to create the account",
      });
    }

    const existUser = await UserService.findByEmail(input.email);

    if (existUser) {
      throw new HTTPException(400, {
        message: "The email address is already exists",
      });
    }

    // Add a code of new email address to cache
    const key = `verify_email:${user.id}:${input.email}`;
    const code = await AuthService.getVerificationCode(key);

    MailService.emailVerificationRequest(input.email, code);

    return c.json({ success: true });
  }
);

router.post(
  "update-email",
  authMiddleware,
  zValidator("json", updateEmailBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const input = c.req.valid("json");

    const existUser = await UserService.findByEmail(input.email);
    if (existUser) {
      throw new HTTPException(400, {
        message: "The email address is already exists",
      });
    }

    const key = `verify_email:${user.id}:${input.email}`;
    await AuthService.checkVerificationCode(key, input.code);

    await UserService.update(user.id, {
      email: input.email,
      isEmailVerified: true,
    });

    return c.json({ success: true });
  }
);

router.post(
  "update-user",
  authMiddleware,
  zValidator("json", updateUserBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const input = c.req.valid("json");

    const updates: Record<string, string> = {};

    if (helper.isValid(input.name)) {
      updates.name = input.name!;
    }

    if (helper.isValid(input.avatar)) {
      updates.avatar = input.avatar!;
    }

    if (helper.isEmpty(updates)) {
      throw new HTTPException(400, { message: "Invalid Arguements" });
    }

    await UserService.update(user.id!, updates);

    return c.json({ success: true });
  }
);

export default router;
