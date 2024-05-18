import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";

import { PORT } from "./environments";
import AuthRouter from "./route/auth.route";
import UserRouter from "./route/user.route";

// Initialize the Hono App
const app = new Hono().basePath("/api/v1");

// Middleware
app.use("*", logger(), prettyJSON());
app.use(
  "*",
  cors({
    origin: "*",
  })
);

// Routes
app.route("/", UserRouter);
app.route("/", AuthRouter);

// Start Server
export default {
  PORT,
  fetch: app.fetch,
};
