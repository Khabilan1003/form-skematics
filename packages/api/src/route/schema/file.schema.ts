import { z } from "zod";
import { commonFileMimeTypes } from "@form/utils";

export const fileUploadBodySchema = z.object({
  type: z.enum(["file", "image"]),
  file: z
    .any()
    .refine((file) => file?.size <= 5000000, "Max image size is 5MB")
    .refine(
      (file) => commonFileMimeTypes.includes(file.type),
      "Invalid file type"
    ),
});
