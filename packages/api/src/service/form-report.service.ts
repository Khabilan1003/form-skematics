import { eq } from "drizzle-orm";
import { db } from "../config";
import { FormFieldModel, FormFieldReportModel } from "../model";
import { decodeUUIDToId } from "@form/utils";

export class FormReportService {
  public async findById(formId: string | number) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    return await db
      .select({
        FormFieldReportModel,
      })
      .from(FormFieldReportModel)
      .leftJoin(
        FormFieldModel,
        eq(FormFieldReportModel.fieldId, FormFieldModel.id)
      )
      .where(eq(FormFieldModel.id, formId));
  }

  public async generate(formId: string | number) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
  }

  private async create(fieldId: string | number) {
    if (typeof fieldId === "string") fieldId = decodeUUIDToId(fieldId);

    const field = await db
      .select()
      .from(FormFieldModel)
      .where(eq(FormFieldModel.id, fieldId));

    field[0].kind;
  }

  private async update() {}
}
