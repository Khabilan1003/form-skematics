import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { FormFieldModel } from "./form-field.model";

export const FormFieldReportModel = sqliteTable("formfieldreport", {
  fieldId: integer("fieldId")
    .primaryKey()
    .references(() => FormFieldModel.id, { onDelete: "cascade" }),

  total: integer("total", { mode: "number" }),

  count: integer("count", { mode: "number" }),

  average: integer("average", { mode: "number" }),

  chooses: text("chooses", { mode: "json" }).$type<
    { id: number; label: string }[] | number[]
  >(),

  createdAt: integer("createdAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),

  updatedAt: integer("updatedAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
