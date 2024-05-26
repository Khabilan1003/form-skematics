import { Hono } from "hono";
import { authMiddleware } from "../middlewares";
import { FormService } from "../service/form.service";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { date, decodeUUIDToId } from "@form/utils";
import {
  createFormBodySchema,
  updateFormBodySchema,
  createFormFieldBodySchema,
  createFormVariableBodySchema,
  updateFormFieldBodySchema,
  updateFormSettingBodySchema,
  updateFormThemeBodySchema,
  updateFormVariableBodySchema,
  formLogicBodySchema,
} from "./schema/form.schema";
import { FormAnalyticService } from "../service/form-analytic.service";

const router = new Hono().basePath("form");

router.get(":formId", authMiddleware, async (c) => {
  const formId: string = c.req.param("formId");

  const user: Record<string, any> = c.get("user" as never);

  const result = await FormService.findById(user.id, formId);

  return c.json(result);
});

router.get("/", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);

  const result = await FormService.findAll(user.id);

  return c.json(result);
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

router.put(
  ":formId",
  authMiddleware,
  zValidator("json", updateFormBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId: string = c.req.param("formId");

    const input = c.req.valid("json");

    await FormService.update(user.id, formId, input);

    return c.json({ success: true });
  }
);

router.delete(":formId", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);

  const formId: string = c.req.param("formId");

  const ids = await FormService.delete(user.id, formId, false);

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

router.post(
  ":formId/form-variable",
  authMiddleware,
  zValidator("json", createFormVariableBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId = c.req.param("formId");

    const input = c.req.valid("json");

    const fieldVariable = await FormService.createFormVariable(
      user.id,
      formId,
      input
    );

    return c.json(fieldVariable);
  }
);

router.put(
  ":formId/form-variable/:variableId",
  authMiddleware,
  zValidator("json", updateFormVariableBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId = c.req.param("formId");
    const variableId = c.req.param("variableId");

    const input = c.req.valid("json");

    await FormService.updateFormVariable(user.id, formId, variableId, input);

    return c.json({ success: true });
  }
);

router.delete(
  ":formId/form-variable/:variableId",
  authMiddleware,
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId = c.req.param("formId");
    const variableId = c.req.param("variableId");

    await FormService.deleteFormVariable(user.id, formId, variableId);

    return c.json({ success: true });
  }
);

router.post(
  ":formId/form-logic",
  authMiddleware,
  zValidator("json", formLogicBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId = c.req.param("formId");

    const input = c.req.valid("json");

    const fieldLogic = await FormService.createFormLogic(user.id, formId, {
      ...input,
      fieldId: decodeUUIDToId(input.fieldId),
      navigateFieldId: input.navigateFieldId
        ? decodeUUIDToId(input.navigateFieldId)
        : undefined,
      variableId: input.variableId
        ? decodeUUIDToId(input.variableId)
        : undefined,
    });

    return c.json(fieldLogic);
  }
);

router.put(
  ":formId/form-logic/:logicId",
  authMiddleware,
  zValidator("json", formLogicBodySchema),
  async (c) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId = c.req.param("formId");
    const logicId = c.req.param("logicId");

    const input = c.req.valid("json");

    await FormService.updateFormLogic(user.id, formId, logicId, {
      ...input,
      fieldId: decodeUUIDToId(input.fieldId),
      navigateFieldId: input.navigateFieldId
        ? decodeUUIDToId(input.navigateFieldId)
        : undefined,
      variableId: input.variableId
        ? decodeUUIDToId(input.variableId)
        : undefined,
    });

    return c.json({ success: true });
  }
);

router.delete(":formId/form-logic/:logicId", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);

  const formId = c.req.param("formId");
  const logicId = c.req.param("logicId");

  await FormService.deleteFormLogic(user.id, formId, logicId);

  return c.json({ success: true });
});

export default router;
