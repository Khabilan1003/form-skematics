import { helper } from "@form/utils";
import { createMiddleware } from "hono/factory";

export const ipMiddleware = createMiddleware(async (c, next) => {
  //Must update this in future(IMPORTANT)
  const ip = c.req.header("ip");

  if (helper.isEmpty(ip)) c.set("ip", "localhost");
  else c.set("ip", ip);

  await next();
});
