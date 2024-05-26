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

const router = new Hono().basePath("form-analytic");

router.get(
  ":formId",
  authMiddleware,
  zValidator("query", formAnalyticBodySchema),
  async (c) => {
    const formId = decodeUUIDToId(c.req.param("formId"));

    const { range } = c.req.valid("query");

    const endAt = date().endOf("day");

    const params = {
      formId: formId,
      endAt: endAt.toDate(),
      range: range,
    };

    const result = await FormAnalyticService.summary(params);

    return c.json(result);
  }
);

router.put(":formId/visit", async (c) => {
  const formId = c.req.param("formId");

  await FormAnalyticService.updateTotalVisits(formId);

  return c.json({ success: true });
});

router.put(
  ":formId/submission",
  zValidator("json", updateCountAndAverageBodySchema),
  async (c) => {
    const formId = c.req.param("formId");

    const input = c.req.valid("json");

    await FormAnalyticService.updateCountAndAverageTime(formId, input.duration);

    return c.json({ success: true });
  }
);

export default router;
