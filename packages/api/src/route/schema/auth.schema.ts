import { z } from "zod";

export const signUpBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const sendResetPasswordEmailBodySchema = z.object({
  email: z.string().min(1).email("Not a valid email address"),
});

export const resetPasswordBodySchema = z.object({
  email: z.string().min(1).email("Not a valid email address"),
  code: z.string().min(6).max(6),
  password: z.string().min(8),
});
