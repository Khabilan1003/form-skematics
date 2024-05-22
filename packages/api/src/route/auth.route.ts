import { Hono } from "hono";
import { UserService } from "../service/user.service";
import { encodeIdToUUID, helper } from "@form/utils";
import { HTTPException } from "hono/http-exception";
import { comparePassword, passwordHash } from "../utils/crypto";
import { BCRYPT_SALT } from "../environments";
import { gravatar } from "../utils";
import MailService from "../service/mail.service";
import { AuthService } from "../service/auth.service";
import { zValidator } from "@hono/zod-validator";
import {
  loginBodySchema,
  sendResetPasswordEmailBodySchema,
  signUpBodySchema,
  resetPasswordBodySchema,
} from "./schema/auth.schema";

// Auth Routes
const router = new Hono().basePath("auth");

router.post("login", zValidator("json", loginBodySchema), async (c) => {
  // Parsing Data from the Request Body
  const user = c.req.valid("json");

  // Check User Exist or Not
  const existUser = await UserService.findByEmail(user.email);
  if (!existUser) {
    throw new HTTPException(404, { message: "Email Not Found" });
  }

  // Check The Password
  if (!(await comparePassword(user.password, existUser.password!))) {
    throw new HTTPException(401, { message: "Incorrect Password" });
  }

  // Create Auth Token
  await AuthService.login({ c, userId: encodeIdToUUID(existUser.id) });

  return c.json({ success: true });
});

router.post("sign-up", zValidator("json", signUpBodySchema), async (c) => {
  // Parsing Data from Body of the Request Object
  const user = c.req.valid("json");

  // Check user already exists
  const existUser = await UserService.findByEmail(user.email);
  if (helper.isValid(existUser)) {
    throw new HTTPException(400, {
      message: "The email address already exist",
    });
  }

  // Add User Data in Database
  const userId = await UserService.create({
    name: user.name,
    email: user.email,
    password: await passwordHash(user.password, BCRYPT_SALT),
    avatar: gravatar(user.email),
  });

  // Create Auth Token
  if (userId) {
    await AuthService.login({ c, userId });
  }

  return c.json({ success: true });
});

router.put(
  "reset-password",
  zValidator("json", resetPasswordBodySchema),
  async (c) => {
    // Parsing Data from Body of the Request Object
    const input = c.req.valid("json");

    const user = await UserService.findByEmail(input.email);

    if (helper.isEmpty(user))
      throw new HTTPException(400, {
        message: "The email address does not exist",
      });

    const key = `reset_password:${user!.id}`;
    await AuthService.checkVerificationCode(key, input.code);

    await UserService.update(user!.id, {
      password: await passwordHash(input.password, BCRYPT_SALT),
    });

    MailService.passwordChangeAlert(user!.email);

    return c.json({ success: true });
  }
);

router.post(
  "send-reset-password-email",
  zValidator("json", sendResetPasswordEmailBodySchema),
  async (c) => {
    // Parsing Data from Body of the Request Object
    const input = c.req.valid("json");

    const user = await UserService.findByEmail(input.email);

    if (helper.isEmpty(user))
      throw new HTTPException(400, { message: "The EMAIL ID doesn't exist" });

    // Add a code of reset password to cache
    const key = `reset_password:${user!.id}`;
    const code = await AuthService.getVerificationCode(key);

    MailService.emailVerificationRequest(user!.email, code);

    return c.json({ success: true });
  }
);

export default router;
