import * as fs from "fs";
import { commonImageMimeTypes, helper, nanoid } from "@form/utils";
import { HTTPException } from "hono/http-exception";
import { ExceptionSchema } from "./schema/error.schema";

export class FileService {
  static async upload(file: File): Promise<string | ExceptionSchema> {
    const buffer = await file.arrayBuffer();
    const extension = file.name.split(".")[file.name.split(".").length - 1];

    let fileName: string = "";
    let path: string = "";

    try {
      while (
        helper.isEmpty(fileName) ||
        helper.isEmpty(path) ||
        fs.existsSync(path)
      ) {
        fileName = `${nanoid(32)}.${extension}`;
        path = `${__dirname.replace(
          "/src/service",
          ""
        )}/static/upload/${fileName}`;
      }

      console.log(path);

      fs.writeFileSync(path, Buffer.from(buffer));
    } catch (e) {
      const exception: ExceptionSchema = {
        statusCode: 500,
        message: "Server cannot upload the file",
      };
      return exception;
    }

    return fileName;
  }

  static async getImage(fileName: string): Promise<File | ExceptionSchema> {
    const filePath = `${__dirname.replace(
      "/src/service",
      ""
    )}/static/upload/${fileName}`;

    if (!fs.existsSync(filePath)) {
      const exception: ExceptionSchema = {
        statusCode: 404,
        message: "File not found",
      };
      return exception;
    }

    // Read the file
    const buffer = fs.readFileSync(filePath);

    let extention = fileName.split(".")[fileName.split(".").length - 1];
    for (let i = 0; i < commonImageMimeTypes.length; i++) {
      const ext = commonImageMimeTypes[i].split("/")[1];
      if (ext === extention) {
        extention = commonImageMimeTypes[i];
        break;
      }
    }

    const blob = new Blob([buffer], { type: extention });
    const file = new File([blob], fileName, { type: extention });

    return file;
  }
}
