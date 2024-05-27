import { Hono } from "hono";
import { FieldKindEnum } from "@form/shared-type-enums";
import { STATEMENT_FIELD_KINDS } from "@form/shared-type-enums";
import { authMiddleware } from "../middlewares";
import { FormService } from "../service/form.service";
import { FormReportService } from "../service/form-report.service";
import { SubmissionService } from "../service/submission.service";

const EXCLUDE_KINDS = [
  // Not question
  ...STATEMENT_FIELD_KINDS,

  // Choice
  FieldKindEnum.YES_NO,
  FieldKindEnum.MULTIPLE_CHOICE,
  FieldKindEnum.PICTURE_CHOICE,

  // Rating
  FieldKindEnum.RATING,
  FieldKindEnum.OPINION_SCALE,
];

const router = new Hono().basePath("form-report");

router.get(":formId", authMiddleware, async (c) => {
  const formId = c.req.param("formId");

  const form = await FormService.findById(formId);

  const fieldIds = form.fields
    .filter((field) => !EXCLUDE_KINDS.includes(field.kind as FieldKindEnum))
    .map((field) => field.id);

    
  await FormReportService.generate(formId);
    
  const [result, submissions] = await Promise.all([
    FormReportService.findById(formId),
    SubmissionService.findAllGroupInFieldIds(formId, fieldIds),
  ]);

  return c.json({
    responses: result,
    submissions,
  });
});

export default router;
