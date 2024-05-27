import { eq } from "drizzle-orm";
import { db } from "../config";
import { FormFieldModel, FormFieldReportModel } from "../model";
import { decodeUUIDToId, helper } from "@form/utils";
import { FormService } from "./form.service";
import { SubmissionService } from "./submission.service";
import { FieldKindEnum } from "@form/shared-type-enums";

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

    return await db
      .select({
        fieldId: FormFieldReportModel.fieldId,
        total: FormFieldReportModel.total,
        count: FormFieldReportModel.count,
        average: FormFieldReportModel.average,
        chooses: FormFieldReportModel.chooses,
      })
      .from(FormFieldReportModel)
      .leftJoin(
        FormFieldModel,
        eq(FormFieldReportModel.fieldId, FormFieldModel.id)
      )
      .where(eq(FormFieldModel.id, formId));
  }

  public static async generate(formId: string | number) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    const form = await FormService.findById(formId);
    if (!form || form.fields.length < 1) return;

    const submissions = await SubmissionService.findAll({ formId });
    if (submissions.totalSubmissions < 1) return;

    const responses: FormFieldReportResponse[] = [];
    const fields = form.fields;

    for (const field of fields) {
      const answers = submissions.submissions
        .map((submission) => {
          return submission.answer.find((ans) => ans.fieldId === field.id);
        })
        .filter(Boolean);

      const count = answers.length;

      if (count < 1) continue;

      const response: FormFieldReportResponse = {
        id: field.id,
        total: submissions.submissions.length,
        count,
        average: 0,
        chooses: [],
      };

      for (const answer of answers) {
        if (helper.isNil(answer?.value)) continue;
        switch (field.kind) {
          case FieldKindEnum.YES_NO:
          case FieldKindEnum.MULTIPLE_CHOICE:
          case FieldKindEnum.PICTURE_CHOICE:
            const choices = field.property?.choices;

            if (helper.isValidArray(choices)) {
              let values = answer?.value;

              if (answer!.kind === FieldKindEnum.YES_NO) {
                values = [answer!.value];
              }

              response.chooses = choices!.map((choice) => {
                const count = values.includes(choice.id) ? 1 : 0;
                const prevChoice = response.chooses.find(
                  (row) => row.id === choice.id
                );
                const prevCount = prevChoice?.count ?? 0;

                console.log(choice, prevCount);
                return {
                  id: choice.id,
                  label: choice.label,
                  count: prevCount + count,
                } as any;
              });
            }

            console.log("Choices : " + JSON.stringify(response.chooses));
            break;
          case FieldKindEnum.OPINION_SCALE:
          case FieldKindEnum.RATING:
            const value = Number(answer!.value);

            response.average += value;
            response.chooses[value] = (response.chooses[value] || 0) + 1;
            break;
        }
      }

      // console.log(response);

      response.average = parseFloat(
        (response.average / response.count).toFixed(1)
      );
      responses.push(response);
    }

    console.log("Responses : ", JSON.stringify(responses));

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
