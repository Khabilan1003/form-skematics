import { z } from "zod";
import {
  FontSizeEnum,
  FieldKindEnum,
  FieldLayoutAlignEnum,
  ComparisonEnum,
  CalculateEnum,
  ActionEnum,
  FormStatusEnum,
} from "@form/shared-type-enums";

export const createFormBodySchema = z.object({
  title: z.string().min(1),
});

export const updateFormBodySchema = z.object({
  name: z.string().min(1).optional(),
  status: z.nativeEnum(FormStatusEnum).optional(),
  avatar: z.string().url().optional(),
});

export const updateFormThemeBodySchema = z.object({
  fontFamily: z.string().optional(),
  screenFontSize: z.nativeEnum(FontSizeEnum).optional(),
  fieldFontSize: z.nativeEnum(FontSizeEnum).optional(),
  questionTextColor: z.string().optional(),
  answerTextColor: z.string().optional(),
  buttonTextColor: z.string().optional(),
  buttonBackgroundColor: z.string().optional(),
  backgroundColor: z.string().optional(),
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
  kind: z.nativeEnum(FieldKindEnum),
});

export const updateFormFieldBodySchema = z.object({
  position: z.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  kind: z.nativeEnum(FieldKindEnum).optional(),
  required: z.boolean().optional(),
  layoutMediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
  layoutMediaUrl: z.string().optional(),
  layoutBrightness: z.number().min(1).max(100).optional(),
  layoutAlign: z.nativeEnum(FieldLayoutAlignEnum).optional(),
  property: z
    .object({
      buttonText: z.string().optional(),
      allowOther: z.boolean().optional(),
      allowMultiple: z.boolean().optional(),
      choices: z
        .object({
          id: z.number().optional(),
          label: z.string().optional(),
          image: z.string().optional(),
        })
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

export const createFormVariableBodySchema = z.object({
  name: z.string(),
  kind: z.enum(["STRING", "NUMBER"]),
  value: z.string(),
});

export const updateFormVariableBodySchema = z.object({
  name: z.string().optional(),
  kind: z.enum(["STRING", "NUMBER"]).optional(),
  value: z.string().optional(),
});

export const formLogicBodySchema = z.object({
  fieldId: z.string(),
  comparision: z.nativeEnum(ComparisonEnum),
  expected: z.union([z.string(), z.array(z.string())]).optional(),
  kind: z.nativeEnum(ActionEnum),
  navigateFieldId: z.string().optional(),
  variableId: z.string().optional(),
  operator: z.nativeEnum(CalculateEnum).optional(),
  value: z.string().optional(),
});

export const formAnalyticBodySchema = z.object({
  range: z.number().min(7).max(365),
});
