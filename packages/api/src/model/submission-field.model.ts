import {
  sqliteTable,
  integer,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { SubmissionModel } from "./submission.model";
import { FormFieldModel } from "./form-field.model";
import { FieldKindEnum, SubmissionFieldValue } from "@form/shared-type-enums";

export const SubmissionFieldModel = sqliteTable(
  "submissionfield",
  {
    submissionId: integer("submissionId").references(() => SubmissionModel.id, {
      onDelete: "cascade",
    }),

    fieldId: integer("fieldId").references(() => FormFieldModel.id),

    kind: text("kind", {
      enum: Object.values(FieldKindEnum) as [string, ...string[]],
    }),

    value: text("value", { mode: "json" })
      .$type<SubmissionFieldValue>()
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.submissionId, table.fieldId] }),
    };
  }
);
