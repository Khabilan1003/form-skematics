import { Hono } from "hono";
import { authMiddleware, ipMiddleware } from "../middlewares";
import { zValidator } from "@hono/zod-validator";
import {
  createSubmissionBodySchema,
  deleteSubmissionsBodySchema,
} from "./schema/submission.schema";
import { SubmissionService } from "../service/submission.service";
import { FormService } from "../service/form.service";
import { decodeUUIDToId } from "@form/utils";
import { trace, Span } from "@opentelemetry/api";

// Tracer
const tracer = trace.getTracer("submission-route", "1.0.0");

// Routes
const router = new Hono().basePath("submission");

router.get("/:formId", authMiddleware, async (c) => {
  return tracer.startActiveSpan("get-form-submission", async (span: Span) => {
    const user: Record<string, any> = c.get("user" as never);

    const formId = c.req.param("formId");

    await FormService.isFormAccessible(
      decodeUUIDToId(user.id),
      decodeUUIDToId(formId)
    );

    const submissions = await SubmissionService.findAll({ formId });

    span.end();
    return c.json(submissions);
  });
});

router.post(
  "/",
  ipMiddleware,
  zValidator("json", createSubmissionBodySchema),
  async (c) => {
    return tracer.startActiveSpan("create-submission", async (span: Span) => {
      const ip: string = c.get("ip" as never);

      const input = c.req.valid("json");

      const submissionId = await SubmissionService.create(input, ip);

      span.end();
      return c.json({ success: true, submissionId });
    });
  }
);

router.delete(
  "/",
  authMiddleware,
  zValidator("json", deleteSubmissionsBodySchema),
  async (c) => {
    return tracer.startActiveSpan(
      "delete-submission-by-id",
      async (span: Span) => {
        const input = c.req.valid("json");

        const isDeleted = await SubmissionService.deleteByIds(
          input.formId,
          input.submissionIds
        );

        span.end();
        return c.json({ success: isDeleted });
      }
    );
  }
);

export default router;
