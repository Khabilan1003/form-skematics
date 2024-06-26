import { Hono } from "hono";
import { FieldKindEnum } from "@form/shared-type-enums";
import { authMiddleware } from "../middlewares";
import { FormService } from "../service/form.service";
import { FormReportService } from "../service/form-report.service";
import { SubmissionService } from "../service/submission.service";
import { trace, Span } from "@opentelemetry/api";
import { decodeUUIDToId } from "@form/utils";
import {
  ExceptionSchema,
  isExceptionSchema,
} from "../service/schema/error.schema";
import { HTTPException } from "hono/http-exception";

const EXCLUDE_KINDS = [
  // Choice
  FieldKindEnum.YES_NO,
  FieldKindEnum.MULTIPLE_CHOICE,

  // Rating
  FieldKindEnum.RATING,
  FieldKindEnum.OPINION_SCALE,
];

// Tracer
const tracer = trace.getTracer("form-report-route", "1.0.0");

// Routes
const router = new Hono().basePath("form-report");

router.get(":formId", authMiddleware, async (c) => {
  return tracer.startActiveSpan(
    "get-form-report-by-formid",
    async (span: Span) => {
      const user: Record<string, any> = c.get("user" as never);
      const formId = c.req.param("formId");

      const isValid = await FormService.isFormAccessible(
        decodeUUIDToId(user.id),
        decodeUUIDToId(formId)
      );
      if (isExceptionSchema(isValid)) {
        span.end();
        throw new HTTPException((isValid as ExceptionSchema).statusCode, {
          message: (isValid as ExceptionSchema).message,
        });
      }
      
      const form = await FormService.findById(formId);

      let fieldIds: string[] = [];
      form.groups.forEach((group) => {
        const ids = group.fields
          .filter(
            (field) => !EXCLUDE_KINDS.includes(field.kind as FieldKindEnum)
          )
          .map((field) => field.id);
        ids.forEach((id) => fieldIds.push(id));
      });

      await FormReportService.generate(formId);

      const [result, submissions] = await Promise.all([
        FormReportService.findById(formId),
        SubmissionService.findAllGroupInFieldIds(formId, fieldIds),
      ]);

      span.end();
      return c.json({
        responses: result,
        submissions,
      });
    }
  );
});

export default router;
