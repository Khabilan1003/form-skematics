import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";

export const FormVariableModel = sqliteTable("formvariable", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),

  formId: integer("formId")
    .notNull()
    .references(() => FormModel.id, { onDelete: "cascade" }),

  name: text("name").notNull(),

  kind: text("kind", { enum: ["STRING", "NUMBER"] }).notNull(),

  value: text("value").notNull(),
});
