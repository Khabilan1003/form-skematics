import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { UserModel } from "./user.model";
import { FormStatusEnum } from "@form/shared-type-enums";

export const FormModel = sqliteTable("form", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  userid: integer("userid")
    .notNull()
    .references(() => UserModel.id),

  name: text("name").notNull(),

  description: text("description"),

  // Don't use ["NORMAL" , "TRASH"] - directly. Create a shared-enum-package then use that to get this value
  status: text("status", {
    enum: Object.values(FormStatusEnum) as [string, ...string[]],
  }),

  retentionAt: integer("retentionAt", { mode: "number" }).default(0),

  createdAt: integer("createdAt", { mode: "number" }).default(sql`unixepoch()`),

  updatedAt: integer("updatedAt", { mode: "number" }).default(sql`unixepoch()`),
});
