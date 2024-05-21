import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";
import { FontSizeEnum } from "@form/shared-type-enums";

export const FormThemeSettingModel = sqliteTable("formthemesetting", {
  formId: integer("formId")
    .primaryKey()
    .references(() => FormModel.id, { onDelete: "cascade" }),

  fontFamily: text("fontFamily").notNull(),

  screenFontSize: text("screenFontSize", {
    enum: Object.values(FontSizeEnum) as [string, ...string[]],
  }),

  fieldFontSize: text("fieldFontSize", {
    enum: Object.values(FontSizeEnum) as [string, ...string[]],
  }),

  questionTextColor: text("questionTextColor").notNull(),

  answerTextColor: text("answerTextColor").notNull(),

  buttonTextColor: text("buttonTextColor").notNull(),

  buttonBackgroundColor: text("buttonBackgroundColor").notNull(),

  backgroundColor: text("backgroundColor").notNull(),

  createdAt: integer("createdAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),

  updatedAt: integer("updatedAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
