import { Hono } from "hono";
import { authMiddleware } from "../middlewares";
import { FormService } from "../service/form.service";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { decodeUUIDToId } from "@form/utils";
import {
  createFormBodySchema,
  updateFormBodySchema,
  createFormFieldBodySchema,
  updateFormFieldBodySchema,
  updateFormSettingBodySchema,
  updateFieldGroupBodySchema,
  deleteFormFieldBodySchema,
} from "./schema/form.schema";
import { FieldKindEnum } from "@form/shared-type-enums";
import { removeNestedNullUndefined } from "../utils";
import { trace, Span } from "@opentelemetry/api";

// Tracer
const tracer = trace.getTracer("form-route", "1.0.0");

// Routes
const router = new Hono().basePath("form");

router.get(":formId", authMiddleware, async (c) => {
  return tracer.startActiveSpan("get-form-data-by-id", async (span: Span) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId: number = decodeUUIDToId(c.req.param("formId"));
    const userId: number = decodeUUIDToId(user.id);

    await FormService.isFormAccessible(userId, formId);

    const result = await FormService.findById(formId);

    span.end();
    return c.json(result);
  });
});

router.get("/", authMiddleware, async (c) => {
  return tracer.startActiveSpan(
    "get-all-form-by-userid",
    async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      const result = await FormService.findAll(user.id);

      span.end();
      return c.json(result);
    }
  );
});

router.post(
  "/",
  authMiddleware,
  zValidator("json", createFormBodySchema),
  async (c) => {
    return tracer.startActiveSpan("create-form", async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      const input = c.req.valid("json");

      const formId = await FormService.create(user.id, input.title);

      // Create Field Group
      const fieldGroupId = await FormService.createGroup(formId);

      // Inside this group add SHORT_TEXT field
      await FormService.createField(fieldGroupId, FieldKindEnum.SHORT_TEXT);

      span.end();
      return c.json({
        success: true,
        formId: formId,
      });
    });
  }
);

router.put(
  ":formId",
  authMiddleware,
  zValidator("json", updateFormBodySchema),
  async (c) => {
    return tracer.startActiveSpan("update-form", async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      const formId: string = c.req.param("formId");

      const input = c.req.valid("json");

      await FormService.update(user.id, formId, input);

      span.end();
      return c.json({ success: true });
    });
  }
);

router.delete(":formId", authMiddleware, async (c) => {
  return tracer.startActiveSpan("delete-form", async (span: Span) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId: string = c.req.param("formId");
    const userId: string = user.id;

    const ids = await FormService.delete(userId, formId, false);

    if (ids.length === 0)
      throw new HTTPException(404, { message: "Form is not found" });

    span.end();
    return c.json({ success: true, formId: ids });
  });
});

router.put(
  ":formId/setting",
  authMiddleware,
  zValidator("json", updateFormSettingBodySchema),
  async (c) => {
    return tracer.startActiveSpan("update-form-setting", async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      const formId: string = c.req.param("formId");
      const userId: string = user.id;

      const input = c.req.valid("json");

      await FormService.updateFormSetting(userId, formId, input);

      span.end();
      return c.json({ success: true });
    });
  }
);

router.post(":formId/form-field-group", authMiddleware, async (c) => {
  return tracer.startActiveSpan(
    "create-form-field-group",
    async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      const userId: number = decodeUUIDToId(user.id);
      const formId: number = decodeUUIDToId(c.req.param("formId"));

      await FormService.isFormAccessible(userId, formId);

      const fieldGroupId = await FormService.createGroup(formId);

      span.end();
      return c.json({ success: true, fieldGroupId });
    }
  );
});

router.put(
  ":formId/form-field-group/:fieldGroupId",
  authMiddleware,
  zValidator("json", updateFieldGroupBodySchema),
  async (c) => {
    return tracer.startActiveSpan(
      "update-form-field-group",
      async (span: Span) => {
        const user: Record<string, any> = c.get("user" as never);

        const userId: number = decodeUUIDToId(user.id);
        const formId: number = decodeUUIDToId(c.req.param("formId"));
        const fieldGroupId: number = decodeUUIDToId(
          c.req.param("fieldGroupId")
        );

        const updates = c.req.valid("json");

        await FormService.isFormAccessible(userId, formId);
        await FormService.isGroupAccessibe(formId, fieldGroupId);

        const isUpdated = await FormService.updateGroup(fieldGroupId, updates);

        if (!isUpdated)
          throw new HTTPException(404, { message: "Field group not found" });

        span.end();
        return c.json({ success: true });
      }
    );
  }
);

router.delete(
  ":formId/form-field-group/:fieldGroupId",
  authMiddleware,
  async (c) => {
    return tracer.startActiveSpan(
      "delete-form-field-group",
      async (span: Span) => {
        const user: Record<string, any> = c.get("user" as never);

        const userId: number = decodeUUIDToId(user.id);
        const formId: number = decodeUUIDToId(c.req.param("formId"));
        const fieldGroupId: number = decodeUUIDToId(
          c.req.param("fieldGroupId")
        );

        await FormService.isFormAccessible(userId, formId);
        await FormService.isGroupAccessibe(formId, fieldGroupId);

        const isDeleted = await FormService.deleteGroup(fieldGroupId);

        if (!isDeleted)
          throw new HTTPException(404, { message: "Field group not found" });

        span.end();
        return c.json({ success: true });
      }
    );
  }
);

router.post(
  ":formId/form-field",
  authMiddleware,
  zValidator("json", createFormFieldBodySchema),
  async (c) => {
    return tracer.startActiveSpan("create-form-field", async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);
      const input = c.req.valid("json");

      const formId: number = decodeUUIDToId(c.req.param("formId"));
      const userId: number = decodeUUIDToId(user.id);
      const fieldGroupId: number = decodeUUIDToId(input.fieldGroupId);

      await FormService.isFormAccessible(userId, formId);
      await FormService.isGroupAccessibe(formId, fieldGroupId);

      const fieldId = await FormService.createField(fieldGroupId, input.kind);

      span.end();
      return c.json({ success: true, fieldId: fieldId });
    });
  }
);

router.put(
  ":formId/form-field/:fieldId",
  authMiddleware,
  zValidator("json", updateFormFieldBodySchema),
  async (c) => {
    return tracer.startActiveSpan("update-form-field", async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);

      const userId: number = decodeUUIDToId(user.id);
      const formId: number = decodeUUIDToId(c.req.param("formId"));
      const fieldId: number = decodeUUIDToId(c.req.param("fieldId"));

      const input = c.req.valid("json");
      let updates = {
        ...input,
        fieldGroupId: input.fieldGroupId
          ? decodeUUIDToId(input.fieldGroupId)
          : undefined,
      };
      removeNestedNullUndefined(updates);

      await FormService.isFormAccessible(userId, formId);
      await FormService.updateField(fieldId, updates);

      span.end();
      return c.json({ success: true });
    });
  }
);

router.delete(
  ":formId/form-field/:fieldId",
  authMiddleware,
  zValidator("json", deleteFormFieldBodySchema),
  async (c) => {
    return tracer.startActiveSpan("delete-form-field", async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);
      const input = c.req.valid("json");

      const userId = decodeUUIDToId(user.id);
      const formId = decodeUUIDToId(c.req.param("formId"));
      const fieldId = decodeUUIDToId(c.req.param("fieldId"));
      const fieldGroupId = decodeUUIDToId(input.fieldGroupId);

      await FormService.isFormAccessible(userId, formId);
      await FormService.isGroupAccessibe(formId, fieldGroupId);
      await FormService.isFieldAccessible(fieldGroupId, fieldId);

      const isDeleted = await FormService.deleteField(fieldId);

      if (!isDeleted)
        throw new HTTPException(404, { message: "Field Not Deleted" });

      span.end();
      return c.json({ success: true });
    });
  }
);

export default router;
