import { eq } from "drizzle-orm";
import { db } from "../config";
import {
  FormFieldGroupModel,
  FormFieldModel,
  FormFieldReportModel,
  FormModel,
} from "../model";
import { decodeUUIDToId, encodeIdToUUID, helper } from "@form/utils";
import { FormService } from "./form.service";
import { SubmissionService } from "./submission.service";
import {
  Choice,
  FieldKindEnum,
  SubmissionFieldValue,
} from "@form/shared-type-enums";

interface FormFieldReportResponse {
  id: number | string;
  total: number;
  count: number;
  average: number;
  chooses: any[];
}

export class FormReportService {
  public static async findById(formId: string | number) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    const data = await db
      .select({
        fieldId: FormFieldReportModel.fieldId,
        total: FormFieldReportModel.total,
        count: FormFieldReportModel.count,
        average: FormFieldReportModel.average,
        chooses: FormFieldReportModel.chooses,
      })
      .from(FormFieldReportModel)
      .innerJoin(
        FormFieldModel,
        eq(FormFieldReportModel.fieldId, FormFieldModel.id)
      )
      .innerJoin(
        FormFieldGroupModel,
        eq(FormFieldModel.fieldGroupId, FormFieldGroupModel.id)
      )
      .where(eq(FormFieldGroupModel.formId, formId));

    return data.map((d) => ({ ...d, fieldId: encodeIdToUUID(d.fieldId) }));
  }

  public static async generate(formId: string | number) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    const form = await FormService.findById(formId);
    if (!form || form.groups.length < 1) return;

    const submissionCount = await SubmissionService.countInForm(formId);
    const submissions = await SubmissionService.findAll({
      formId,
      limit: submissionCount,
    });
    if (submissions.totalSubmissions < 1) return;

    const responses: FormFieldReportResponse[] = [];

    for (const group of form.groups) {
      for (const field of group.fields) {
        const answers: SubmissionFieldValue[] = [];

        for (const submission of submissions.submissions)
          for (const g of submission.groups)
            for (const f of g.fields)
              if (f.id === field.id) answers.push(f.value);

        console.log(field.kind);
        console.log(answers.length);
        
        if (field.kind === FieldKindEnum.RATING) {
          for (let i = 0; i < answers.length; i++) {
            console.log(`${i} : ${answers[i]}`);
          }
        }
        const count = answers.length;

        if (count < 1) continue;

        const response: FormFieldReportResponse = {
          id: field.id,
          total: submissions.submissions.length,
          count,
          average: 0,
          chooses: [],
        };
        if (
          [
            FieldKindEnum.RATING.toString(),
            FieldKindEnum.OPINION_SCALE.toString(),
          ].includes(field.kind)
        ) {
          let total = field.property?.total || 5;
          for (let i = 0; i < total; i++) response.chooses.push(0);
        }

        for (const answer of answers) {
          if (helper.isNil(answer)) continue;
          switch (field.kind) {
            case FieldKindEnum.YES_NO:
            case FieldKindEnum.MULTIPLE_CHOICE:
              const choices = field.property?.choices as Choice[];

              if (helper.isValidArray(choices)) {
                let values: SubmissionFieldValue = answer;

                if (field.kind === FieldKindEnum.YES_NO) {
                  values = [answer as number];
                }

                response.chooses = choices!.map((choice) => {
                  const count = (values as number[]).includes(choice.id)
                    ? 1
                    : 0;
                  const prevChoice = response.chooses.find(
                    (row) => row.id === choice.id
                  );
                  const prevCount = prevChoice?.count ?? 0;

                  return {
                    id: choice.id,
                    label: choice.label,
                    count: prevCount + count,
                  } as any;
                });
              }

              break;
            case FieldKindEnum.OPINION_SCALE:
            case FieldKindEnum.RATING:
              const value = answer as number;
              if (value === 0) break;

              response.average += value;
              response.chooses[value - 1] += 1;
              break;
          }
        }
        response.average = parseFloat(
          (response.average / response.count).toFixed(1)
        );
        responses.push(response);
      }
    }

    await this.add(responses);
  }

  private static async add(responses: FormFieldReportResponse[]) {
    for (const response of responses) {
      const fieldReport = await db
        .select()
        .from(FormFieldReportModel)
        .where(
          eq(
            FormFieldReportModel.fieldId,
            decodeUUIDToId(response.id as string)
          )
        );

      if (fieldReport.length < 1) {
        await db.insert(FormFieldReportModel).values({
          fieldId: decodeUUIDToId(response.id as string),
          count: response.count,
          total: response.total,
          average: response.average,
          chooses: response.chooses,
        });
      } else {
        await db
          .update(FormFieldReportModel)
          .set({
            count: response.count,
            total: response.total,
            average: response.average,
            chooses: response.chooses,
          })
          .where(
            eq(
              FormFieldReportModel.fieldId,
              decodeUUIDToId(response.id as string)
            )
          );
      }
    }
  }
}
