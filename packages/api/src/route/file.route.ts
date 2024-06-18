import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { commonFileMimeTypes, commonImageMimeTypes } from "@form/utils";
import { APP_HOST, PORT } from "../environments";
import { FileService } from "../service/file.service";
import { zValidator } from "@hono/zod-validator";
import { fileUploadBodySchema } from "./schema/file.schema";
import { trace, Span } from "@opentelemetry/api";
import {
  ExceptionSchema,
  isExceptionSchema,
} from "../service/schema/error.schema";

// Tracer
const tracer = trace.getTracer("file-route", "1.0.0");

// File Routes
const router = new Hono().basePath("static");

router.get("/upload/:fileName", async (c) => {
  return tracer.startActiveSpan("Get Uploaded File", async (span: Span) => {
    const fileName = c.req.param("fileName");

    // Read the file
    const file = await FileService.getImage(fileName);

    if (!(file instanceof File) && isExceptionSchema(file)) {
      span.end();
      throw new HTTPException(file.statusCode, {
        message: file.message,
      });
    }

    // Set headers to prompt a file display
    if (commonImageMimeTypes.includes((file as File).type))
      c.header("Content-Type", (file as File).type);

    const buffer = await (file as File).arrayBuffer();

    span.end();
    return c.body(buffer);
  });
});

router.post("/upload", zValidator("form", fileUploadBodySchema), async (c) => {
  return tracer.startActiveSpan("Post File", async (span: Span) => {
    const input = c.req.valid("form");
    const { file, type } = input;

    if (!(file instanceof File)) {
      span.end();
      throw new HTTPException(406, { message: "Please upload valid image" });
    }

    if (
      type === "image"
        ? !commonImageMimeTypes.includes(file.type)
        : !commonFileMimeTypes.includes(file.type)
    ) {
      span.end();
      throw new HTTPException(406, {
        message: `Please upload valid ${type === "image" ? "image" : "file"}`,
      });
    }

    const fileName = await FileService.upload(file);

    if (isExceptionSchema(fileName)) {
      span.end();
      throw new HTTPException((fileName as ExceptionSchema).statusCode, {
        message: (fileName as ExceptionSchema).message,
      });
    }

    span.end();
    return c.json({
      fileName: file.name,
      size: file.size,
      url: `${APP_HOST}:${PORT}/api/v1/static/upload/${fileName}`,
    });
  });
});

export default router;
