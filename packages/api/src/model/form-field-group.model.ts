import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";

export const FormFieldGroupModel = sqliteTable("formfieldgroup", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  formId: integer("formId").references(() => FormModel.id, {
    onDelete: "cascade",
  }).notNull(),

  position: integer("position").notNull().default(0),

  title: text("title"),

  description: text("description"),
});
