import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { UserModel } from "./user.model";
import { FormStatusEnum } from "@form/shared-type-enums";

export const FormModel = sqliteTable("form", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  userId: integer("userId")
    .notNull()
    .references(() => UserModel.id, { onDelete: "cascade" }),

  name: text("name").notNull(),

  description: text("description"),

  status: text("status", {
    enum: Object.values(FormStatusEnum) as [string, ...string[]],
  }),

  retentionAt: integer("retentionAt", { mode: "number" }).default(0),

  createdAt: integer("createdAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),

  updatedAt: integer("updatedAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
