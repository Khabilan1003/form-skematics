import {
  FieldKindEnum,
  FontSizeEnum,
  FormField,
  FormStatusEnum,
  Property,
} from "@form/shared-type-enums";
import { db } from "../config";
import {
  FormModel,
  FormSettingModel,
  FormThemeSettingModel,
  FormFieldModel,
  FormVariableModel,
  FormLogicModel,
} from "../model";
import { decodeUUIDToId, encodeIdToUUID, helper } from "@form/utils";
import { HTTPException } from "hono/http-exception";
import { and, eq, gt, inArray, or, sql } from "drizzle-orm";
import { FormTheme, FormSetting } from "@form/shared-type-enums";

export class FormService {
  private static async isFormAccessible(userId: number, formId: number) {
    // Check whether the formid belongs to the repective user
    const form = await db
      .select()
      .from(FormModel)
      .where(eq(FormModel.id, formId));

    if (form.length === 0)
      throw new HTTPException(404, { message: "Form not found" });

    if (form[0].userId !== userId)
      throw new HTTPException(401, {
        message: "You do not have access to this form",
      });
  }

  static async findById(userid: string | number, formid: string | number) {
    if (typeof formid === "string") formid = decodeUUIDToId(formid);
    if (typeof userid === "string") userid = decodeUUIDToId(userid);

    // Check whether the user have access to this formId
    await this.isFormAccessible(userid, formid);

    const form = await db
      .select()
      .from(FormModel)
      .where(eq(FormModel.id, formid));

    const formSetting = await db
      .select()
      .from(FormSettingModel)
      .where(eq(FormSettingModel.formId, formid));

    const formThemeSetting = await db
      .select()
      .from(FormThemeSettingModel)
      .where(eq(FormThemeSettingModel.formId, formid));

    const formFields = await db
      .select()
      .from(FormFieldModel)
      .where(eq(FormFieldModel.formId, formid));

    const formVariables = await db
      .select()
      .from(FormVariableModel)
      .where(eq(FormVariableModel.formId, formid));

    const formLogics = await db
      .select()
      .from(FormLogicModel)
      .where(eq(FormLogicModel.formId, formid));

    return {
      ...form[0],
      id: encodeIdToUUID(form[0].id),
      setting: {
        ...formSetting[0],
        formid: encodeIdToUUID(formSetting[0].formId),
      },
      themeSetting: {
        ...formThemeSetting[0],
        formid: encodeIdToUUID(formThemeSetting[0].formId),
      },
      fields: formFields.map((formField) => ({
        ...formField,
        id: encodeIdToUUID(formField.id),
        formid: encodeIdToUUID(formField.formId!),
      })),
      variables: formVariables.map((formVar) => ({
        ...formVar,
        id: encodeIdToUUID(formVar.id),
        formid: encodeIdToUUID(formVar.formId),
      })),
      logics: formLogics.map((logic) => ({
        ...logic,
        id: encodeIdToUUID(logic.id),
        variableid: logic.variableId ? encodeIdToUUID(logic.variableId) : null,
        navigatefieldid: logic.navigateFieldId
          ? encodeIdToUUID(logic.navigateFieldId)
          : null,
        formid: encodeIdToUUID(logic.formId),
      })),
    };
  }

  static async create(userId: string | number, formName: string) {
    if (typeof userId === "string") userId = decodeUUIDToId(userId);

    // Create Form
    const newForm = await db
      .insert(FormModel)
      .values({
        userId: userId as number,
        name: formName,
        status: FormStatusEnum.NORMAL.toString(),
      })
      .returning({ id: FormModel.id });

    if (newForm.length === 0)
      throw new HTTPException(500, {
        message:
          "Form Not Created. There is an issue here. Please wait until it get fixed",
      });

    // Create Form Settings
    await db.insert(FormSettingModel).values({
      formId: newForm[0].id,
    });

    // Create Form Theme Settings
    await db.insert(FormThemeSettingModel).values({
      formId: newForm[0].id as number,
      fontFamily: "Public Sans",
      screenFontSize: FontSizeEnum.NORMAL.toString(),
      questionTextColor: "#000",
      answerTextColor: "#0445AF",
      buttonTextColor: "#fff",
      buttonBackgroundColor: "#0445AF",
      backgroundColor: "#fff",
      fieldFontSize: FontSizeEnum.NORMAL.toString(),
    });

    // Create Two Form Fields - SHORT_TEXT and THANKYOU

    // 1. SHORT_TEXT
    await db.insert(FormFieldModel).values({
      formId: newForm[0].id,
      title: "",
      description: "",
      position: 1,
      kind: FieldKindEnum.SHORT_TEXT,
      required: false,
      property: {
        buttonText: "Next",
      },
    });

    // 2. THANK_YOU
    await db.insert(FormFieldModel).values({
      formId: newForm[0].id,
      title: "Thank you!",
      description: "Thanks for completing this form. Now create your own form.",
      kind: FieldKindEnum.THANK_YOU,
    });

    return encodeIdToUUID(newForm[0].id);
  }

  static async delete(
    userId: string | number,
    formId: string | string[] | number | number[]
  ): Promise<string[]> {
    // UserId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);

    // FormId Preprocessing
    if (typeof formId === "object") {
      if (formId.length > 1) {
        if (typeof formId[0] === "string") {
          formId.map((id) => decodeUUIDToId(id as string));
        }
      }
    } else if (typeof formId === "string") {
      formId = decodeUUIDToId(formId as string);
    }
    if (typeof formId === "number") formId = [formId];

    // Check whether the given formId belong to userId
    const forms = await db
      .select()
      .from(FormModel)
      .where(inArray(FormModel.id, formId as number[]));

    for (let i = 0; i < forms.length; i++)
      if (forms[i].userId !== userId)
        throw new HTTPException(401, {
          message: "Unauthorized access of other users form",
        });

    // Delete Forms
    const ids = await db
      .delete(FormModel)
      .where(inArray(FormModel.id, formId as number[]))
      .returning({ id: FormModel.id });

    return ids.map((id) => encodeIdToUUID(id.id));
  }

  static async updateFormThemeSetting(
    userId: string | number,
    formId: string | number,
    updates: FormTheme
  ): Promise<boolean> {
    // UserID and FormId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    // Check updates are empty or not
    if (helper.isEmpty(updates))
      throw new HTTPException(404, { message: "Nothing to Update" });

    // Update Form Theme Setting
    const updatedThemeSettingIds = await db
      .update(FormThemeSettingModel)
      .set(updates)
      .where(eq(FormThemeSettingModel.formId, formId))
      .returning({ updatedId: FormThemeSettingModel.formId });

    if (updatedThemeSettingIds.length === 0) return false;

    return true;
  }

  static async updateFormSetting(
    userId: string | number,
    formId: string | number,
    updates: FormSetting
  ) {
    // UserID and FormId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    // Check updates are empty or not
    if (helper.isEmpty(updates))
      throw new HTTPException(404, { message: "Nothing to Update" });

    // Update Form Setting
    const updatedSettingsId = await db
      .update(FormSettingModel)
      .set(updates)
      .where(eq(FormSettingModel.formId, formId))
      .returning({ updatedId: FormSettingModel.formId });

    if (updatedSettingsId.length === 0) return false;

    return true;
  }

  static async createField(
    userId: string | number,
    formId: string | number,
    fieldKindEnum: FieldKindEnum
  ) {
    // UserID and FormId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    // If FieldKindEnum is WELCOME or THANK_YOU Then we don't have to add position
    let position: number = 0;
    if (
      fieldKindEnum === FieldKindEnum.WELCOME ||
      fieldKindEnum === FieldKindEnum.THANK_YOU
    ) {
      const fields = await db
        .select()
        .from(FormFieldModel)
        .where(
          and(
            eq(FormFieldModel.formId, formId),
            eq(FormFieldModel.kind, fieldKindEnum)
          )
        );

      if (fields.length > 0)
        throw new HTTPException(401, {
          message: "This field already has been added",
        });
    } else {
      // If it is not THANK_YOU or WELCOME then we have to find its position and increment it for new field
      const fields = await db
        .select()
        .from(FormFieldModel)
        .where(
          and(eq(FormFieldModel.formId, formId), gt(FormFieldModel.position, 0))
        );

      position = fields.length + 1;
    }

    // Insert the field in the form
    const insertedFieldId = await db
      .insert(FormFieldModel)
      .values({
        formId: formId,
        kind: fieldKindEnum,
        position: position,
      })
      .returning({ fieldId: FormFieldModel.id });

    return encodeIdToUUID(insertedFieldId[0].fieldId);
  }

  static async deleteField(
    userId: string | number,
    formId: string | number,
    fieldId: string | number
  ) {
    // UserID, FieldId and FormId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (typeof fieldId === "string") fieldId = decodeUUIDToId(fieldId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    // Delete the Form Field
    const deletedField = await db
      .delete(FormFieldModel)
      .where(eq(FormFieldModel.id, fieldId))
      .returning({ id: FormFieldModel.id, position: FormFieldModel.position });

    // Update the position of other field by -1 i.e., position > dele
    await db
      .update(FormFieldModel)
      .set({ position: sql`position - 1` })
      .where(
        and(
          eq(FormFieldModel.formId, formId),
          gt(FormFieldModel.position, deletedField[0].position)
        )
      );

    return encodeIdToUUID(deletedField[0].id);
  }

  static async updateField(
    userId: string | number,
    formId: string | number,
    fieldId: string | number,
    updates: FormField
  ) {
    // UserID, FieldId and FormId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (typeof fieldId === "string") fieldId = decodeUUIDToId(fieldId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    const field = await db
      .select()
      .from(FormFieldModel)
      .where(eq(FormFieldModel.id, fieldId));

    if (field.length === 0)
      throw new HTTPException(404, { message: "The field does not exist" });

    if (field[0].formId !== formId)
      throw new HTTPException(401, {
        message: "This field does not belong to this form",
      });

    await db
      .update(FormFieldModel)
      .set(updates)
      .where(eq(FormFieldModel.id, fieldId));
  }

  static async findAllInTrash(userId: string) {}
}
