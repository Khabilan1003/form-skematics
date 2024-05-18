import { readdirSync } from "fs-extra";
import { resolve } from "path";

export function readDirSync(dir: string, ext: string) {
  return readdirSync(dir)
    .filter((filePath) => filePath.endsWith(ext))
    .map((filePath) => resolve(dir, filePath));
}
