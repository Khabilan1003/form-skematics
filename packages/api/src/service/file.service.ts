import * as fs from "fs";
import { commonImageMimeTypes, helper, nanoid } from "@form/utils";
import { HTTPException } from "hono/http-exception";

export class FileService {
  static async upload(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();

    let fileName: string = "";
    let path: string = "";

    try {
      while (
        helper.isEmpty(fileName) ||
        helper.isEmpty(path) ||
        fs.existsSync(path)
      ) {
        fileName = `${nanoid(32)}.${file.type.split("/")[1]}`;
        path = `${__dirname.replace(
          "/src/route",
          ""
        )}/static/upload/${fileName}`;
      }

      fs.writeFileSync(path, Buffer.from(buffer));
    } catch (exception) {
      throw new HTTPException(500, {
        message: "Server cannot upload the file",
      });
    }

    return fileName;
  }

  static async get(fileName: string): Promise<File> {
    const filePath = `${__dirname.replace(
      "/src/service",
      ""
    )}/static/upload/${fileName}`;

    if (!fs.existsSync(filePath))
      throw new HTTPException(404, { message: "File not found" });

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
