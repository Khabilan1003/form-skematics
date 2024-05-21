import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/model/index.ts",
  out: "./migrations",
  dialect: "sqlite",
  verbose: true,
  strict: true,
});