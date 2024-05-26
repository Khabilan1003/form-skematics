import { Hono } from "hono";
import { authMiddleware, ipMiddleware } from "../middlewares";
import { zValidator } from "@hono/zod-validator";
import {
  createSubmissionBodySchema,
  deleteSubmissionsBodySchema,
} from "./schema/submission.schema";
import { SubmissionService } from "../service/submission.service";
import { FormService } from "../service/form.service";

const router = new Hono().basePath("submission");

router.get("/:formId", authMiddleware, async (c) => {
  const user: Record<string, any> = c.get("user" as never);

  const formId = c.req.param("formId");

  await FormService.findById(user.id, formId);

  const submissions = await SubmissionService.findAll({ formId });

  return c.json(submissions);
});

router.post(
  "/",
  authMiddleware,
  ipMiddleware,
  zValidator("json", createSubmissionBodySchema),
  async (c) => {
    const ip: string = c.get("ip" as never);

    const input = c.req.valid("json");

    const submissionId = await SubmissionService.create(input, ip);

    return c.json({ success: true, submissionId });
  }
);

router.delete(
  "/",
  authMiddleware,
  zValidator("json", deleteSubmissionsBodySchema),
  async (c) => {
    const input = c.req.valid("json");

    const isDeleted = await SubmissionService.deleteByIds(
      input.formId,
      input.submissionIds
    );

    return c.json({ success: isDeleted });
  }
);

export default router;