import { z } from "zod";

export const updateEmailBodySchema = z.object({
  email: z.string().min(1).email("Invalid Email Address Format"),
  code: z.string().min(6).max(6),
});

export const emailBodySchema = updateEmailBodySchema.pick({ email: true });

export const verifyEmailBodySchema = updateEmailBodySchema.pick({ code: true });

export const updateUserPasswordBodySchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(8)
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[!#$%&()*+\-,.\/\\:<=>?@\[\]^_{|}~0-9a-zA-Z]{8,}$/
    ),
});

export const updateUserBodySchema = z.object({
  name: z.string().optional(),
  avatar: z.string().optional(),
  restoreGravatar: z.boolean().optional(),
});
