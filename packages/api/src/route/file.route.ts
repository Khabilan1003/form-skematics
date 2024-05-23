import { Hono } from "hono";
import { BodyData } from "hono/utils/body";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "../middlewares";
import { commonImageMimeTypes, nanoid } from "@form/utils";
import { APP_HOST, PORT } from "../environments";
import { FileService } from "../service/file.service";

const router = new Hono().basePath("static");

router.get("/upload/:fileName", async (c) => {
  const fileName = c.req.param("fileName");

  // Read the file
  const file = await FileService.get(fileName);

  // Set headers to prompt a file display
  c.header("Content-Type", file.type);

  // Send the file content
  return c.body(await file.arrayBuffer());
});

router.post("/upload", authMiddleware, async (c) => {
  const data: BodyData = await c.req.parseBody();
  const file = data["image"];

  if (!(file instanceof File))
    throw new HTTPException(406, { message: "Please upload valid image" });

  if (!commonImageMimeTypes.includes(file.type)) {
    throw new HTTPException(406, { message: "Please upload valid image" });
  }

  const fileName = await FileService.upload(file);

  return c.text(`${APP_HOST}:${PORT}/static/upload/${fileName}`);
});

export default router;
