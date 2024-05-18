import { sql } from "drizzle-orm";
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";

export const FormAnalyticModel = sqliteTable("formanalytic", {
  formid: integer("formid")
    .primaryKey()
    .references(() => FormModel.id),

  totalvisits: integer("totalvisits", { mode: "number" }).default(0),

  submissioncount: integer("submissioncount", { mode: "number" }).default(0),

  averagetime: integer("averagetime", { mode: "number" }).default(0),

  createdAt: integer("createdAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),

  updatedAt: integer("updatedAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
