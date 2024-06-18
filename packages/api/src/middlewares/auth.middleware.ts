import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { AuthService } from "../service/auth.service";
import { UserService } from "../service/user.service";
import { helper } from "@form/utils";

export const authMiddleware = createMiddleware(async (c, next) => {
  const userData = AuthService.getSession(c);

  if (typeof userData !== "object")
    throw new HTTPException(401, { message: "No Session Created" });

  const user = await UserService.findById(userData.id);

  if (helper.isEmpty(user))
    throw new HTTPException(406, { message: "User Id Invalid" });

  c.set("user", user);

  await next();
});
