import { z } from "zod";
import { FieldKindEnum } from "@form/shared-type-enums";

export const createSubmissionBodySchema = z.object({
  formId: z.union([z.string(), z.number()]),
  groups: z.array(
    z.object({
      groupId: z.union([z.string(), z.number()]),
      fields: z.array(
        z.object({
          id: z.union([z.string(), z.number()]),
          kind: z.nativeEnum(FieldKindEnum),
          value: z.any(),
        })
      ),
    })
  ),
  startAt: z.number(),
  endAt: z.number(),
});

export const deleteSubmissionsBodySchema = z.object({
  formId: z.union([z.string(), z.number()]),
  submissionIds: z.array(z.union([z.string(), z.number()])),
});
