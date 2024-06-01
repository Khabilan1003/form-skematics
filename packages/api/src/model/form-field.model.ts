import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { FieldKindEnum } from "@form/shared-type-enums";
import { Property } from "@form/shared-type-enums";
import { FormFieldGroupModel } from "./form-field-group.model";

export const FormFieldModel = sqliteTable("formfield", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  fieldGroupId: integer("fieldGroupId")
    .references(() => FormFieldGroupModel.id, {
      onDelete: "cascade",
    })
    .notNull(),

  position: integer("position").notNull().default(0),

  title: text("title").default(""),

  description: text("description").default(""),

  kind: text("kind", {
    enum: Object.values(FieldKindEnum) as [string, ...string[]],
  }).notNull(),

  required: integer("required", { mode: "boolean" }).notNull().default(false),

  property: text("property", { mode: "json" }).$type<Property>(),
});
