import { z } from "zod";
import { FieldKindEnum } from "@form/shared-type-enums";

export const createSubmissionBodySchema = z.object({
  formId: z.union([z.string(), z.number()]),
  answers: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      kind: z.nativeEnum(FieldKindEnum),
      value: z.any(),
    })
  ),
  variables: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      name: z.string(),
      kind: z.enum(["STRING", "NUMBER"]),
      value: z.string(),
    })
  ),
  startAt: z.number(),
  endAt: z.number(),
});

export const deleteSubmissionsBodySchema = z.object({
  formId: z.union([z.string(), z.number()]),
  submissionIds: z.array(z.union([z.string(), z.number()])),
});
