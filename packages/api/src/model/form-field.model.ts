import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";
import { FieldKindEnum, FieldLayoutAlignEnum } from "@form/shared-type-enums";

export const FormFieldModel = sqliteTable("formfield", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  formid: integer("formid").references(() => FormModel.id),

  position: integer("position").notNull().default(0),

  title: text("title"),

  description: text("description"),

  kind: text("kind", {
    enum: Object.values(FieldKindEnum) as [string, ...string[]],
  }),

  required: integer("required", { mode: "boolean" }).default(false),

  layoutmediatype: text("layoutmediatype", { enum: ["IMAGE", "VIDEO"] }),

  layoutmediaurl: text("layoutmediaurl"),

  layoutbrightness: integer("layoutbrightness"),

  layoutalign: text("layoutalign", {
    enum: Object.values(FieldLayoutAlignEnum) as [string, ...string[]],
  }),

  property: text("property", { mode: "json" }).$type<{
    buttonText?: string;
    allowOther?: boolean;
    allowMultiple?: boolean;
    choices?: any[];
    randomize?: boolean;
    step?: number;
    shape?: string;
    leftLabel?: string;
    centerLabel?: string;
    rightLabel?: string;
    defaultCountryCode?: string;
    dateFormat?: string;
    allowTime?: boolean;
  }>(),
});
