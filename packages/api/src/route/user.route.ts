import { Hono } from "hono";
import { authMiddleware } from "../middlewares";
import { HTTPException } from "hono/http-exception";
import { AuthService } from "../service/auth.service";
import MailService from "../service/mail.service";
import { UserService } from "../service/user.service";
import { comparePassword, isDisposableEmail, passwordHash } from "../utils";
import {
  ACCOUNT_DELETION_SCHEDULE_INTERVAL,
  BCRYPT_SALT,
} from "../environments";
import { helper, hs, timestamp } from "@form/utils";
import { RedisService } from "../service/redis.service";
import { zValidator } from "@hono/zod-validator";
import {
  verifyEmailBodySchema,
  emailBodySchema,
  updateEmailBodySchema,
  updateUserBodySchema,
  updateUserPasswordBodySchema,
} from "./schema/user.schema";
import {
  isExceptionSchema,
  ExceptionSchema,
} from "../service/schema/error.schema";
import { trace, Span } from "@opentelemetry/api";

// Tracer
const tracer = trace.getTracer("user-route", "1.0.0");

// Routes
const router = new Hono().basePath("user");

router.get("/", authMiddleware, async (c) => {
  return tracer.startActiveSpan("user-detail", async (span: Span) => {
    const user: Record<string, any> = c.get("user" as never);
    span.end();
    return c.json({ ...user });
  });
});

router.post("email-verification", authMiddleware, async (c) => {
  return tracer.startActiveSpan(
    "email-verification-code",
    async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      if (user.isEmailVerified) {
        span.end();
        throw new HTTPException(400, { message: "Email is already verified" });
      }

      // Add a code of verify email address to cache
      const key = `verify_email:${user.id}`;
      const code = await AuthService.getVerificationCode(key);

      MailService.emailVerificationRequest(user.email, code);

      span.end();
      return c.json({ success: true });
    }
  );
});

router.put(
  "email-verification",
  authMiddleware,
  zValidator("json", verifyEmailBodySchema),
  async (c) => {
    return tracer.startActiveSpan("verify-email", async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      const input = c.req.valid("json");

      if (user.isEmailVerified) {
        span.end();
        throw new HTTPException(400, { message: "Email is already verified" });
      }

      const key = `verify_email:${user.id}`;

      let isValid = await AuthService.checkVerificationCode(key, input.code);
      if (isExceptionSchema(isValid)) {
        span.end();
        throw new HTTPException((isValid as ExceptionSchema).statusCode, {
          message: (isValid as ExceptionSchema).message,
        });
      }

      await UserService.update(user.id, {
        isEmailVerified: true,
      });

      span.end();
      return c.json({ success: true });
    });
  }
);

router.put(
  "/",
  authMiddleware,
  zValidator("json", updateUserPasswordBodySchema),
  async (c) => {
    return tracer.startActiveSpan(
      "update-user-password",
      async (span: Span) => {
        const user: Record<string, any> = c.get("user" as never);

        const input = c.req.valid("json");

        const verified = await comparePassword(
          input.currentPassword,
          user.password
        );

        if (!verified) {
          span.end();
          throw new HTTPException(400, {
            message: "The password does not match",
          });
        }

        await UserService.update(user.id, {
          password: await passwordHash(input.newPassword, BCRYPT_SALT),
        });

        MailService.passwordChangeAlert(user.email);

        span.end();
        return c.json({ success: true });
      }
    );
  }
);

router.post("account-delete", authMiddleware, async (c) => {
  return tracer.startActiveSpan("user-deletion-code", async (span: Span) => {
    const user: Record<string, any> = c.get("user" as never);

    if (user.isDeletionScheduled) {
      span.end();
      throw new HTTPException(400, {
        message: "Account is already scheduled for deletion",
      });
    }

    const key = `user_deletion:${user.id}`;
    const code = await AuthService.getVerificationCode(key);

    MailService.accountDeletionRequest(user.email, code);

    span.end();
    return c.json({ success: true });
  });
});

router.delete(
  "account-delete",
  authMiddleware,
  zValidator("json", verifyEmailBodySchema),
  async (c) => {
    return tracer.startActiveSpan(
      "verify-user-deletion",
      async (span: Span) => {
        const user: Record<string, any> = c.get("user" as never);

        const input = c.req.valid("json");

        const key = `user_deletion:${user.id}`;
        let isValid = await AuthService.checkVerificationCode(key, input.code);
        if (isExceptionSchema(isValid)) {
          span.end();
          throw new HTTPException((isValid as ExceptionSchema).statusCode, {
            message: (isValid as ExceptionSchema).message,
          });
        }

        await UserService.update(user.id, {
          isDeletionScheduled: true,
          deletionScheduledAt:
            timestamp() + hs(ACCOUNT_DELETION_SCHEDULE_INTERVAL)!,
        });

        MailService.scheduleAccountDeletionAlert(user.email, user.name);

        span.end();
        return c.json({ success: true });
      }
    );
  }
);

router.put("account-delete", authMiddleware, async (c) => {
  return tracer.startActiveSpan("cancel-user-deletion", async (span: Span) => {
    const user: Record<string, any> = c.get("user" as never);

    const key = `user_deletion:${user.id}`;

    await UserService.update(user.id, {
      isDeletionScheduled: false,
      deletionScheduledAt: 0,
    });

    await RedisService.del(key);
    span.end();
    return c.json({ success: true });
  });
});

router.post(
  "email-update",
  authMiddleware,
  zValidator("json", emailBodySchema),
  async (c) => {
    return tracer.startActiveSpan("change-email-code", async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      const input = c.req.valid("json");

      if (isDisposableEmail(input.email)) {
        span.end();
        throw new HTTPException(400, {
          message:
            "Error: Disposable email address detected, please use a work email to create the account",
        });
      }

      const existUser = await UserService.findByEmail(input.email);

      if (existUser) {
        span.end();
        throw new HTTPException(400, {
          message: "The email address is already exists",
        });
      }

      // Add a code of new email address to cache
      const key = `verify_email:${user.id}:${input.email}`;
      const code = await AuthService.getVerificationCode(key);

      MailService.emailVerificationRequest(input.email, code);

      span.end();
      return c.json({ success: true });
    });
  }
);

router.put(
  "email-update",
  authMiddleware,
  zValidator("json", updateEmailBodySchema),
  async (c) => {
    return tracer.startActiveSpan("update-email", async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      const input = c.req.valid("json");

      const existUser = await UserService.findByEmail(input.email);
      if (existUser) {
        span.end();
        throw new HTTPException(400, {
          message: "The email address is already exists",
        });
      }

      const key = `verify_email:${user.id}:${input.email}`;
      let isValid = await AuthService.checkVerificationCode(key, input.code);
      if (isExceptionSchema(isValid)) {
        span.end();
        throw new HTTPException((isValid as ExceptionSchema).statusCode, {
          message: (isValid as ExceptionSchema).message,
        });
      }

      await UserService.update(user.id, {
        email: input.email,
        isEmailVerified: true,
      });

      span.end();
      return c.json({ success: true });
    });
  }
);

router.put(
  "/account",
  authMiddleware,
  zValidator("json", updateUserBodySchema),
  async (c) => {
    return tracer.startActiveSpan("update-user", async (span: Span) => {
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
        span.end();
        throw new HTTPException(400, { message: "Invalid Arguements" });
      }

      await UserService.update(user.id!, updates);
      span.end();
      return c.json({ success: true });
    });
  }
);

export default router;
