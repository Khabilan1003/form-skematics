import { Hono } from "hono";
import { authMiddleware } from "../middlewares";

const router = new Hono().basePath("user");

router.post("cancel-user-deletion", (c) => {
  return c.text("Cancel User Deletion");
});

router.post("change-email-code", (c) => {
  return c.text("Change Email Code");
});

router.post("email-verification-code", (c) => {
  return c.text("Email Verification Code");
});

router.post("update-email", (c) => {
  return c.text("Update Email");
});

router.post("update-user-password", (c) => {
  return c.text("Update User Password");
});

router.post("update-user", (c) => {
  return c.text("Update User");
});

router.post("user-deletion-code", (c) => {
  return c.text("User Deletion Code");
});

router.post("user-detail", authMiddleware, async (c) => {
  const data: Record<string, any> = c.get("user" as never);
  return c.json({ ...data });
});

router.post("verify-email", (c) => {
  return c.text("Verify Email");
});

router.post("verify-user-deletion", (c) => {
  return c.text("Verify User Deletion");
});

export default router;
