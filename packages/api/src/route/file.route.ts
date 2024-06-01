import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "../middlewares";
import { commonFileMimeTypes, commonImageMimeTypes } from "@form/utils";
import { APP_HOST, PORT } from "../environments";
import { FileService } from "../service/file.service";
import { zValidator } from "@hono/zod-validator";
import { fileUploadBodySchema } from "./schema/file.schema";

const router = new Hono().basePath("static");

router.get("/upload/:fileName", async (c) => {
  const fileName = c.req.param("fileName");

  // Read the file
  const file = await FileService.getImage(fileName);

  // Set headers to prompt a file display
  if (commonImageMimeTypes.includes(file.type))
    c.header("Content-Type", file.type);

  // Send the file content
  return c.body(await file.arrayBuffer());
});

router.post(
  "/upload",
  authMiddleware,
  zValidator("form", fileUploadBodySchema),
  async (c) => {
    const input = c.req.valid("form");
    const { file, type } = input;

    if (!(file instanceof File))
      throw new HTTPException(406, { message: "Please upload valid image" });

    if (
      type === "image"
        ? !commonImageMimeTypes.includes(file.type)
        : !commonFileMimeTypes.includes(file.type)
    )
      throw new HTTPException(406, {
        message: `Please upload valid ${type === "image" ? "image" : "file"}`,
      });

    const fileName = await FileService.upload(file);

    return c.json({
      fileName: file.name,
      size: file.size,
      url: `${APP_HOST}:${PORT}/static/upload/${fileName}`,
    });
  }
);

export default router;
