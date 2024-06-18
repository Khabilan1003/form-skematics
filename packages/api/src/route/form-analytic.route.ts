import { Hono } from "hono";
import { authMiddleware } from "../middlewares";
import { zValidator } from "@hono/zod-validator";
import {
  formAnalyticBodySchema,
  updateCountAndAverageBodySchema,
} from "./schema/form-analytic.route";
import { decodeUUIDToId } from "@form/utils";
import { FormAnalyticService } from "../service/form-analytic.service";
import { date } from "@form/utils";
import { trace, Span } from "@opentelemetry/api";

// Tracer
const tracer = trace.getTracer("form-analytic-route", "1.0.0");

// Routes
const router = new Hono().basePath("form-analytic");

router.get(
  ":formId",
  authMiddleware,
  zValidator("query", formAnalyticBodySchema),
  async (c) => {
    return tracer.startActiveSpan(
      "get-form-analytic-by-formid",
      async (span: Span) => {
        const formId = decodeUUIDToId(c.req.param("formId"));

        const { range } = c.req.valid("query");

        const endAt = date().endOf("day");

        const params = {
          formId: formId,
          endAt: endAt.toDate(),
          range: range,
        };

        const result = await FormAnalyticService.summary(params);
        span.end();
        return c.json(result);
      }
    );
  }
);

router.put(":formId/visit", async (c) => {
  return tracer.startActiveSpan(
    "update-form-analytic-visit",
    async (span: Span) => {
      const formId = c.req.param("formId");

      await FormAnalyticService.updateTotalVisits(formId);

      span.end();
      return c.json({ success: true });
    }
  );
});

router.put(
  ":formId/submission",
  zValidator("json", updateCountAndAverageBodySchema),
  async (c) => {
    return tracer.startActiveSpan(
      "update-form-analytic-submission",
      async (span: Span) => {
        const formId = c.req.param("formId");

        const input = c.req.valid("json");

        await FormAnalyticService.updateCountAndAverageTime(
          formId,
          input.duration
        );

        span.end();
        return c.json({ success: true });
      }
    );
  }
);

export default router;
