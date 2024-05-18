import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";

export const FormThemeSettingModel = sqliteTable("formthemesetting", {
  formid: integer("formid")
    .primaryKey()
    .references(() => FormModel.id),

  fontfamily: text("fontfamily").notNull(),

  screenfontsize: text("screenfontsize", {
    enum: ["SMALL", "NORMAL", "LARGE"],
  }),

  fieldfontsize: text("fieldfontsize", { enum: ["SMALL", "NORMAL", "LARGE"] }),

  questiontextcolor: text("questiontextcolor").notNull(),

  answertextcolor: text("answertextcolor").notNull(),

  buttontextcolor: text("buttontextcolor").notNull(),

  buttonbackgroundcolor: text("buttonbackgroundcolor").notNull(),

  backgroundcolor: text("backgroundcolor").notNull(),

  createdAt: integer("createdAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),

  updatedAt: integer("updatedAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
