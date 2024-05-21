import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { FormModel } from "./form.model";

export const FormSettingModel = sqliteTable("formsetting", {
  formId: integer("formId")
    .primaryKey()
    .references(() => FormModel.id, { onDelete: "cascade" }),

  // Allow to store submissions
  allowArchive: integer("allowArchive", { mode: "boolean" }).default(true),

  // Password to open the form for submission
  requirePassword: integer("requirePassword", { mode: "boolean" }).default(
    false
  ),
  password: text("password"),

  // IP Limit
  enableIpLimit: integer("enableIpLimit", { mode: "boolean" }).default(false),
  ipLimitCount: integer("ipLimitCount", { mode: "number" }).default(1),

  // Is Form Published
  published: integer("published", { mode: "boolean" }).default(false),

  // Expiration Date
  enableExpirationDate: integer("enableExpirationDate", {
    mode: "boolean",
  }).default(false),
  enabledAt: integer("enabledAt", { mode: "number" }).default(0),
  closedAt: integer("closedAt", { mode: "number" }).default(0),

  // Submission Limit
  enableQuotaLimit: integer("enableQuotaLimit", { mode: "boolean" }).default(
    false
  ),
  quotaLimit: integer("quotaLimit").default(0),

  // Closed Form - Display Text
  closedFormTitle: text("closedFormTitle"),
  closedFormDescription: text("closedFormDescription"),

  createdAt: integer("createdAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),

  updatedAt: integer("updatedAt", { mode: "number" }).default(
    sql`(strftime('%s', 'now'))`
  ),
});
