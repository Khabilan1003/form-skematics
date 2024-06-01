import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";

export const SubmissionModel = sqliteTable("submission", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),

  formId: integer("formId", { mode: "number" }).references(() => FormModel.id, {
    onDelete: "cascade",
  }).notNull(),

  ip: text("ip", { mode: "text" }).notNull(),

  startAt: integer("startAt", { mode: "number" }).notNull(),

  endAt: integer("endAt", { mode: "number" }).notNull(),

  createdAt: integer("createdAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),

  updatedAt: integer("updatedAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
