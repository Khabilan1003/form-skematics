import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";
import { FormFieldModel } from "./form-field.model";
import { FormVariableModel } from "./form-variable.model";
import {
  ComparisonEnum,
  ActionEnum,
  CalculateEnum,
} from "@form/shared-type-enums";

export const FormLogicModel = sqliteTable("formlogic", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  formId: integer("formId")
    .notNull()
    .references(() => FormModel.id, { onDelete: "cascade" }),

  fieldId: integer("fieldId")
    .notNull()
    .references(() => FormFieldModel.id),

  // Get the Comparision Enum from the shared-enums
  comparison: text("comparision", {
    enum: Object.values(ComparisonEnum) as [string, ...string[]],
  }),

  expected: text("expected"),

  // Get the action enum from the shared-enums
  kind: text("kind", {
    enum: Object.values(ActionEnum) as [string, ...string[]],
  }),

  navigateFieldId: integer("navigateFieldId").references(
    () => FormFieldModel.id
  ),

  variableId: integer("variableId").references(() => FormVariableModel.id),

  // Get the operator from the shared-enums
  operator: text("operator", {
    enum: Object.values(CalculateEnum) as [string, ...string[]],
  }),

  value: text("value"),
});
