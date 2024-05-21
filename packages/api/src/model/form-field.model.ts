import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";
import { FieldKindEnum, FieldLayoutAlignEnum } from "@form/shared-type-enums";
import { Property } from "@form/shared-type-enums";

export const FormFieldModel = sqliteTable("formfield", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  formId: integer("formId").references(() => FormModel.id, {
    onDelete: "cascade",
  }),

  position: integer("position").notNull().default(0),

  title: text("title"),

  description: text("description"),

  kind: text("kind", {
    enum: Object.values(FieldKindEnum) as [string, ...string[]],
  }),

  required: integer("required", { mode: "boolean" }).default(false),

  layoutMediaType: text("layoutMediaType", { enum: ["IMAGE", "VIDEO"] }),

  layoutMediaUrl: text("layoutMediaUrl"),

  layoutBrightness: integer("layoutBrightness"),

  layoutAlign: text("layoutAlign", {
    enum: Object.values(FieldLayoutAlignEnum) as [string, ...string[]],
  }),

  property: text("property", { mode: "json" }).$type<Property>(),
});
