import { z } from "zod";
import { FieldKindEnum, FormStatusEnum } from "@form/shared-type-enums";
import { title } from "process";

export const createFormBodySchema = z.object({
  title: z.string().min(1),
});

export const updateFormBodySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.nativeEnum(FormStatusEnum).optional(),
  avatar: z.string().url().optional(),
});

export const updateFormSettingBodySchema = z.object({
  allowArchive: z.boolean().optional(),
  requirePassword: z.boolean().optional(),
  password: z.string().min(1).optional(),
  enableIpLimit: z.boolean().optional(),
  ipLimitCount: z.number().optional(),
  published: z.boolean().optional(),
  enableExpirationDate: z.boolean().optional(),
  enabledAt: z.number().optional(),
  closedAt: z.number().optional(),
  enableQuotaLimit: z.boolean().optional(),
  quotaLimit: z.number().optional(),
  closedFormTitle: z.string().optional(),
  closedFormDescription: z.string().optional(),
});

export const createFormFieldBodySchema = z.object({
  fieldGroupId: z.string().uuid(),
  kind: z.nativeEnum(FieldKindEnum),
});

export const updateFormFieldBodySchema = z.object({
  fieldGroupId: z.string().uuid().optional(),
  position: z.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  kind: z.nativeEnum(FieldKindEnum).optional(),
  required: z.boolean().optional(),
  property: z
    .object({
      buttonText: z.string().optional(),
      allowOther: z.boolean().optional(),
      allowMultiple: z.boolean().optional(),
      choices: z
        .array(
          z.object({
            id: z.number().optional(),
            label: z.string().optional(),
            image: z.string().optional(),
          })
        )
        .optional(),
      randomize: z.boolean().optional(),
      shape: z.string().optional(),
      total: z.number().min(1).max(10).optional(),
      leftLabel: z.string().optional(),
      centerLabel: z.string().optional(),
      rightLabel: z.string().optional(),
      defaultCountryCode: z.string().optional(),
      dateFormat: z.string().optional(),
      allowTime: z.boolean().optional(),
    })
    .optional(),
});

export const deleteFormFieldBodySchema = z.object({
  fieldGroupId: z.string().uuid(),
});

export const updateFieldGroupBodySchema = z.object({
  position: z.number().positive().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});
