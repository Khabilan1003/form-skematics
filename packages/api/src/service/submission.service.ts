import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../config";
import {
  FormFieldModel,
  FormVariableModel,
  SubmissionFieldModel,
  SubmissionModel,
} from "../model";
import { decodeUUIDToId, encodeIdToUUID, helper } from "@form/utils";
import { HTTPException } from "hono/http-exception";
import { start } from "repl";
import { FieldKindEnum, Property } from "@form/shared-type-enums";

interface FindSubmissionOptions {
  formId: string | number;
  page?: number;
  limit?: number;
}

interface SubmissionType {
  formId: string;
  id: string;
  startAt: number;
  endAt: number;
  createdAt: number | null;
  updatedAt: number | null;
  ip: string;
  variable: {
    fieldId: string;
    name: string | null;
    kind: "NUMBER" | "STRING" | null;
    value: any | any[];
  }[];
  answer: {
    fieldId: string;
    kind: string | null;
    property: Property | null;
    value: any | any[];
  }[];
}

interface Submission {
  formId: string | number;
  answers: { id: string | number; kind: FieldKindEnum; value?: any }[];
  variables: {
    id: string | number;
    name: string;
    kind: "STRING" | "NUMBER";
    value: string;
  }[];
  startAt: number;
  endAt: number;
}

export class SubmissionService {
  private static async isValidSubmission(formId: number, submissionId: number) {
    const submission = await db
      .select()
      .from(SubmissionModel)
      .where(eq(SubmissionModel.id, submissionId));

    if (submission.length === 0)
      throw new HTTPException(404, { message: "Submission Not Found" });

    if (submission[0].formId !== formId)
      throw new HTTPException(401, {
        message: "Submission does not belong to this form",
      });
  }

  public static async findById(
    formId: string | number,
    submissionId: string | number
  ) {
    if (typeof submissionId === "string")
      submissionId = decodeUUIDToId(submissionId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    this.isValidSubmission(formId, submissionId);

    const submissionAnswer = await db
      .select({
        fieldId: SubmissionFieldModel.fieldId,
        kind: FormFieldModel.kind,
        property: FormFieldModel.property,
        value: SubmissionFieldModel.value,
      })
      .from(SubmissionFieldModel)
      .leftJoin(
        FormFieldModel,
        eq(FormFieldModel.id, SubmissionFieldModel.fieldId)
      )
      .where(
        and(
          eq(SubmissionFieldModel.submissionId, submissionId),
          eq(SubmissionFieldModel.kind, "FORM_FIELD")
        )
      );

    const submissionVariable = await db
      .select({
        fieldId: SubmissionFieldModel.fieldId,
        name: FormVariableModel.name,
        kind: FormVariableModel.kind,
        value: SubmissionFieldModel.value,
      })
      .from(SubmissionFieldModel)
      .leftJoin(
        FormVariableModel,
        eq(FormVariableModel.id, SubmissionFieldModel.fieldId)
      )
      .where(
        and(
          eq(SubmissionFieldModel.submissionId, submissionId),
          eq(SubmissionFieldModel.kind, "FORM_VARIABLE")
        )
      );

    const submission = (
      await db
        .select()
        .from(SubmissionModel)
        .where(eq(SubmissionModel.id, submissionId))
    )[0];

    {
    }

    return {
      ...submission,
      id: encodeIdToUUID(submission.id),
      formId: encodeIdToUUID(submission.formId as number),

      variable: submissionVariable.map((variable) => ({
        ...variable,
        fieldId: encodeIdToUUID(variable.fieldId as number),
      })),
      answer: submissionAnswer.map((answer) => ({
        ...answer,
        fieldId: encodeIdToUUID(answer.fieldId as number),
      })),
    };
  }

  public static async findAll({
    formId,
    page = 1,
    limit = 30,
  }: FindSubmissionOptions) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    const submissionIds = await db
      .select({ id: SubmissionModel.id })
      .from(SubmissionModel)
      .where(eq(SubmissionModel.formId, formId))
      .offset((page - 1) * limit)
      .limit(limit)
      .orderBy(desc(SubmissionModel.createdAt));

    let submissions: SubmissionType[] = [];

    for (let i = 0; i < submissionIds.length; i++) {
      const submission = await this.findById(formId, submissionIds[i].id);
      submissions.push(submission);
    }

    const totalSubmissions = await this.countInForm(formId);

    return {
      formId: encodeIdToUUID(formId),
      totalSubmissions,
      submissions,
    };
  }

  public static async countAllWithFieldId(
    formId: string | number,
    fieldId: string | number
  ) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (typeof fieldId === "string") fieldId = decodeUUIDToId(fieldId);

    const records = await db
      .select({
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(SubmissionModel)
      .leftJoin(
        SubmissionFieldModel,
        eq(SubmissionFieldModel.submissionId, SubmissionModel.id)
      )
      .where(
        and(
          eq(SubmissionModel.formId, formId),
          eq(SubmissionFieldModel.fieldId, fieldId)
        )
      );

    return records[0].count;
  }

  public static async findAllWithFieldId(
    formId: string | number,
    fieldId: string | number,
    page = 1,
    limit = 30
  ) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (typeof fieldId === "string") fieldId = decodeUUIDToId(fieldId);

    return await db
      .select({
        id: SubmissionModel.id,
        answers: SubmissionFieldModel,
        endAt: SubmissionModel.endAt,
      })
      .from(SubmissionModel)
      .leftJoin(
        SubmissionFieldModel,
        eq(SubmissionFieldModel.submissionId, SubmissionModel.id)
      )
      .where(
        and(
          eq(SubmissionModel.formId, formId),
          eq(SubmissionFieldModel.fieldId, fieldId)
        )
      )
      .offset((page - 1) * limit)
      .limit(limit)
      .orderBy(desc(SubmissionModel.endAt));
  }

  public static async findAllGroupInFieldIds(
    formId: string | number,
    fieldIds: string[] | number[],
    limit = 5
  ) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (helper.isEmpty(fieldIds)) return [];
    if (typeof fieldIds[0] === "string")
      fieldIds = fieldIds.map((fieldId) => decodeUUIDToId(fieldId as string));

    const data = await Promise.all(
      fieldIds.map(async (fieldId) => {
        const answers = await db
          .select({
            submissionId: SubmissionFieldModel.submissionId,
            kind: FormFieldModel.kind,
            value: SubmissionFieldModel.value,
            endAt: SubmissionModel.endAt,
          })
          .from(SubmissionFieldModel)
          .innerJoin(
            SubmissionModel,
            eq(SubmissionModel.id, SubmissionFieldModel.submissionId)
          )
          .innerJoin(
            FormFieldModel,
            eq(FormFieldModel.id, SubmissionFieldModel.fieldId)
          )
          .where(eq(SubmissionFieldModel.fieldId, fieldId as number))
          .limit(limit)
          .orderBy(desc(SubmissionModel.endAt));

        return {
          fieldId: encodeIdToUUID(fieldId as number),
          answers,
        };
      })
    );

    return data;
  }

  public static async countInForm(formId: string | number): Promise<number> {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    const data = await db
      .select({ id: SubmissionModel.id })
      .from(SubmissionModel)
      .where(eq(SubmissionModel.formId, formId));

    return data.length;
  }

  public static async countAll(formIds: string[] | number[]) {
    if (helper.isEmpty(formIds)) return [];

    if (typeof formIds[0] === "string")
      formIds = formIds.map((formId) => decodeUUIDToId(formId as string));

    return await db
      .select({
        formId: SubmissionModel.formId,
        submissionCount: sql<number>`cast(count(${SubmissionModel.id}) as int)`,
      })
      .from(SubmissionModel)
      .where(inArray(SubmissionModel.formId, formIds as number[]))
      .groupBy(SubmissionModel.formId);
  }

  public static async deleteByIds(
    formId: string | number,
    submissionIds?: (string | number)[]
  ) {
    if (!submissionIds || submissionIds?.length === 0) return false;

    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (typeof submissionIds[0] === "string")
      submissionIds = submissionIds.map((id) => decodeUUIDToId(id as string));

    await db
      .delete(SubmissionModel)
      .where(
        and(
          eq(SubmissionModel.formId, formId),
          inArray(SubmissionModel.id, submissionIds as number[])
        )
      );

    return true;
  }

  public static async deleteAll(formId: string | string[] | number | number[]) {
    if (typeof formId === "object") {
      if (formId.length === 0) return false;

      if (typeof formId[0] === "string")
        formId = formId.map((id) => decodeUUIDToId(id as string));
    } else if (typeof formId === "string") {
      formId = decodeUUIDToId(formId);
    }

    let condition: any;
    if (typeof formId === "object")
      condition = inArray(SubmissionModel.id, formId as number[]);
    else condition = eq(SubmissionModel.id, formId as number);

    await db.delete(SubmissionModel).where(condition);

    return true;
  }

  public static async create(_submission: Submission, ip: string) {
    const submission = (
      await db
        .insert(SubmissionModel)
        .values({
          formId: decodeUUIDToId(_submission.formId as string),
          ip: ip,
          startAt: _submission.startAt,
          endAt: _submission.endAt,
        })
        .returning({ id: SubmissionModel.id })
    )[0];

    for (const answer of _submission.answers) {
      await db.insert(SubmissionFieldModel).values({
        submissionId: submission.id,
        fieldId:
          typeof answer.id === "string" ? decodeUUIDToId(answer.id) : answer.id,
        kind: "FORM_FIELD",
        value: answer.value,
      });
    }

    for (const variable of _submission.variables) {
      await db.insert(SubmissionFieldModel).values({
        submissionId: submission.id,
        fieldId:
          typeof variable.id === "string"
            ? decodeUUIDToId(variable.id)
            : variable.id,
        kind: "FORM_VARIABLE",
        value: variable.value,
      });
    }

    return encodeIdToUUID(submission.id);
  }
}
