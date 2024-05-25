import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { FormFieldModel } from "./form-field.model";

export const FormFieldReportModel = sqliteTable("formfieldreport", {
  fieldId: integer("fieldId")
    .primaryKey()
    .references(() => FormFieldModel.id),

  count: integer("count", { mode: "number" }).default(0),

  average: integer("average", { mode: "number" }).default(0),

  chooses: text("chooses", { mode: "json" }).$type<any[]>(),

  createdAt: integer("createdAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),

  updatedAt: integer("updatedAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
