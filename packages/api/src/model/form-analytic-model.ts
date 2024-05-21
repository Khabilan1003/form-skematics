import { sql } from "drizzle-orm";
import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";

export const FormAnalyticModel = sqliteTable("formanalytic", {
  formId: integer("formId")
    .primaryKey()
    .references(() => FormModel.id),

  totalVisits: integer("totalVisits", { mode: "number" }).default(0),

  submissionCount: integer("submissionCount", { mode: "number" }).default(0),

  averageTime: integer("averageTime", { mode: "number" }).default(0),

  createdAt: integer("createdAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),

  updatedAt: integer("updatedAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
