import { Hono } from "hono";
import { z } from "zod";
import { UserService } from "../service/user.service";
import { encodeIdToUUID, helper } from "@form/utils";
import { HTTPException } from "hono/http-exception";
import { comparePassword, passwordHash } from "../utils/crypto";
import { BCRYPT_SALT } from "../environments";
import { gravatar } from "../utils";
import MailService from "../service/mail.service";
import { AuthService } from "../service/auth.service";

// Zod Validation
const signUpBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const sendResetPasswordEmailBodySchema = z.object({
  email: z.string().min(1).email("Not a valid email address"),
});

const resetPasswordBodySchema = z.object({
  email: z.string().min(1).email("Not a valid email address"),
  code: z.string().min(6).max(6),
  password: z.string().min(8),
});

// Auth Routes
const router = new Hono().basePath("auth");

router.post("login", async (c) => {
  // Parsing Data from the Request Body
  const data = await c.req.json();
  const user = loginBodySchema.parse(data);

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

router.post("sign-up", async (c) => {
  // Parsing Data from Body of the Request Object
  const data = await c.req.json();
  const user = signUpBodySchema.parse(data);

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

router.put("reset-password", async (c) => {
  // Parsing Data from Body of the Request Object
  const data = await c.req.json();
  const input = resetPasswordBodySchema.parse(data);

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
});

router.post("send-reset-password-email", async (c) => {
  // Parsing Data from Body of the Request Object
  const data = await c.req.json();
  const input = sendResetPasswordEmailBodySchema.parse(data);

  const user = await UserService.findByEmail(input.email);

  if (helper.isEmpty(user))
    throw new HTTPException(400, { message: "The EMAIL ID doesn't exist" });

  // Add a code of reset password to cache
  const key = `reset_password:${user!.id}`;
  const code = await AuthService.getVerificationCode(key);
  
  MailService.emailVerificationRequest(user!.email, code);

  return c.json({ success: true });
});

export default router;
