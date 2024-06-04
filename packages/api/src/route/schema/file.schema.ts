import { z } from "zod";
import { commonFileMimeTypes } from "@form/utils";

export const fileUploadBodySchema = z.object({
  type: z.enum(["file", "image"], { message: "Type mistake" }),
  file: z
    .any()
    .refine((file) => {
      return file?.size <= 5000000;
    }, "Max file size is 5MB")
    .refine((file) => {
      return commonFileMimeTypes.includes(file.type);
    }, "Invalid file type"),
});
