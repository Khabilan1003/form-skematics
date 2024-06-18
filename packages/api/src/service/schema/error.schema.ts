import { StatusCode } from "hono/utils/http-status";

export type ExceptionSchema = {
  statusCode: StatusCode;
  message: string;
};

export function isExceptionSchema(value: any): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.statusCode === "number" &&
    typeof value.message === "string"
  );
}
