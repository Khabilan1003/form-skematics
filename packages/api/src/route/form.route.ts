import { Hono } from "hono";
import { authMiddleware } from "../middlewares";
import { FormService } from "../service/form.service";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  FieldKindEnum,
  FieldLayoutAlignEnum,
  FontSizeEnum,
} from "@form/shared-type-enums";
import { HTTPException } from "hono/http-exception";

const router = new Hono().basePath("form");

const createFormBodySchema = z.object({
  title: z.string().min(1),
});

const updateFormThemeBodySchema = z.object({
  fontFamily: z.string().optional(),
  screenFontSize: z.nativeEnum(FontSizeEnum).optional(),
  fieldFontSize: z.nativeEnum(FontSizeEnum).optional(),
  questionTextColor: z.string().optional(),
  answerTextColor: z.string().optional(),
  buttonTextColor: z.string().optional(),
  buttonBackgroundColor: z.string().optional(),
  backgroundColor: z.string().optional(),
});

const updateFormSettingBodySchema = z.object({
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

const createFormFieldBodySchema = z.object({
  kind: z.nativeEnum(FieldKindEnum),
});

const updateFormFieldBodySchema = z.object({
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

router.post(
  "/",
  authMiddleware,
  zValidator("json", createFormBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const input = c.req.valid("json");

    const formId = await FormService.create(user.id, input.title);

    return c.json({
      success: true,
      formId: formId,
    });
  }
);

router.get(":formId", authMiddleware, async (c) => {
  const formId: string = c.req.param("formId");

  const user: Record<string, any> = c.get("user" as never);

  const result = await FormService.findById(user.id, formId);

  return c.json(result);
});

router.delete(":formId", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);

  const formId: string = c.req.param("formId");

  const ids = await FormService.delete(user.id, formId);

  if (ids.length === 0)
    throw new HTTPException(404, { message: "Form is not found" });

  return c.json({ success: true, formId: ids[0] });
});

router.put(
  ":formId/theme",
  authMiddleware,
  zValidator("json", updateFormThemeBodySchema),
  async (c) => {
    const formId: string = c.req.param("formId");

    const user: Record<string, any> = c.get("user" as never);

    const input = c.req.valid("json");

    await FormService.updateFormThemeSetting(user.id, formId, input);

    return c.json({ success: true });
  }
);

router.put(
  ":formId/setting",
  authMiddleware,
  zValidator("json", updateFormSettingBodySchema),
  async (c) => {
    const formId: string = c.req.param("formId");

    const user: Record<string, any> = c.get("user" as never);

    const input = c.req.valid("json");

    await FormService.updateFormSetting(user.id, formId, input);

    return c.json({ success: true });
  }
);

router.post(
  ":formId/form-field",
  authMiddleware,
  zValidator("json", createFormFieldBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId = c.req.param("formId");

    const input = c.req.valid("json");

    const fieldId = await FormService.createField(user.id, formId, input.kind);

    return c.json({ success: true, fieldId: fieldId });
  }
);

router.delete(":formId/form-field/:fieldId", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);

  const formId = c.req.param("formId");
  const fieldId = c.req.param("fieldId");

  const deletedFieldId = await FormService.deleteField(
    user.id,
    formId,
    fieldId
  );

  return c.json({ success: true, fieldId: deletedFieldId });
});

router.put(
  ":formId/form-field/:fieldId",
  authMiddleware,
  zValidator("json", updateFormFieldBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId = c.req.param("formId");
    const fieldId = c.req.param("fieldId");

    const updates = c.req.valid("json");

    await FormService.updateField(user.id, formId, fieldId, updates);

    return c.json({ success: true });
  }
);

export default router;
