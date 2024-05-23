import {
  FieldKindEnum,
  FontSizeEnum,
  FormField,
  FormLogic,
  FormStatusEnum,
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
import { decodeUUIDToId, encodeIdToUUID, helper, timestamp } from "@form/utils";
import { HTTPException } from "hono/http-exception";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { FormTheme, FormSetting } from "@form/shared-type-enums";
import { decode } from "punycode";

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

  private static async isLogicBelongsToForm(formId: number, logicId: number) {
    const logic = await db
      .select()
      .from(FormLogicModel)
      .where(eq(FormLogicModel.id, logicId));

    if (logic.length === 0)
      throw new HTTPException(404, { message: "Logic Not Found" });

    if (logic[0].formId !== formId)
      throw new HTTPException(401, { message: "Logic belongs to other form" });
  }

  private static async isVariableBelongsToForm(
    formId: number,
    variableId: number
  ) {
    const logic = await db
      .select()
      .from(FormVariableModel)
      .where(eq(FormLogicModel.id, variableId));

    if (logic.length === 0)
      throw new HTTPException(404, { message: "Logic Not Found" });

    if (logic[0].formId !== formId)
      throw new HTTPException(401, { message: "Logic belongs to other form" });
  }

  private static async isFieldBelongsToForm(formId: number, fieldId: number) {
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
        formId: encodeIdToUUID(formSetting[0].formId),
      },
      themeSetting: {
        ...formThemeSetting[0],
        formId: encodeIdToUUID(formThemeSetting[0].formId),
      },
      fields: formFields.map((formField) => ({
        ...formField,
        id: encodeIdToUUID(formField.id),
        formId: encodeIdToUUID(formField.formId!),
      })),
      variables: formVariables.map((formVar) => ({
        ...formVar,
        id: encodeIdToUUID(formVar.id),
        formId: encodeIdToUUID(formVar.formId),
      })),
      logics: formLogics.map((logic) => ({
        ...logic,
        id: encodeIdToUUID(logic.id),
        variableid: logic.variableId ? encodeIdToUUID(logic.variableId) : null,
        navigatefieldid: logic.navigateFieldId
          ? encodeIdToUUID(logic.navigateFieldId)
          : null,
        formId: encodeIdToUUID(logic.formId),
      })),
    };
  }

  static async findAll(userId: string | number) {
    if (typeof userId === "string") userId = decodeUUIDToId(userId);

    const normalForm = await db
      .select()
      .from(FormModel)
      .where(
        and(
          eq(FormModel.userId, userId),
          eq(FormModel.status, FormStatusEnum.NORMAL.toString())
        )
      );

    const trashForm = await db
      .select()
      .from(FormModel)
      .where(
        and(
          eq(FormModel.userId, userId),
          eq(FormModel.status, FormStatusEnum.TRASH.toString())
        )
      );

    return {
      normal: normalForm.map((form) => ({
        ...form,
        id: encodeIdToUUID(form.id),
      })),
      trash: trashForm.map((form) => ({
        ...form,
        id: encodeIdToUUID(form.id),
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

  static async update(
    userId: string | number,
    formId: string | number,
    updates: { name?: string; status?: FormStatusEnum; avatar?: string }
  ) {
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    await this.isFormAccessible(userId, formId);

    let updateConfig: Record<string, any> = {};

    if (updates.name) updateConfig.name = updates.name;
    if (updates.avatar) updateConfig.avatar = updates.avatar;
    if (updates.status) {
      updateConfig.status = updates.status.toString();
      if (updates.status === FormStatusEnum.TRASH) {
        updateConfig.retentionAt = timestamp();
      } else {
        updateConfig.retentionAt = 0;
      }
    }
    await db
      .update(FormModel)
      .set(updateConfig)
      .where(eq(FormModel.id, formId));
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

    // Check whether the fieldId belongs to the respective form
    await this.isFieldBelongsToForm(formId, fieldId);

    await db
      .update(FormFieldModel)
      .set(updates)
      .where(eq(FormFieldModel.id, fieldId));
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

    // Check whether the fieldId belongs to the respective form
    await this.isFieldBelongsToForm(formId, fieldId);

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

  static async createFormVariable(
    userId: string | number,
    formId: string | number,
    data: { name: string; kind: "STRING" | "NUMBER"; value: string }
  ) {
    // UserID and FormId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    const formVariable = await db
      .insert(FormVariableModel)
      .values({ ...data, formId: formId })
      .returning();

    return formVariable.map((variable) => ({
      ...variable,
      id: encodeIdToUUID(variable.id),
    }))[0];
  }

  static async updateFormVariable(
    userId: string | number,
    formId: string | number,
    variableId: string | number,
    updates: { name?: string; kind?: "STRING" | "NUMBER"; value?: string }
  ) {
    // UserID, VariableId and FormId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (typeof variableId === "string") variableId = decodeUUIDToId(variableId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    // Check whether the variableid belongs to the respective form or not
    await this.isVariableBelongsToForm(formId, variableId);

    // Update the form
    await db
      .update(FormVariableModel)
      .set(updates)
      .where(eq(FormVariableModel.id, variableId));
  }

  static async deleteFormVariable(
    userId: string | number,
    formId: string | number,
    variableId: string | number
  ) {
    // UserID, VariableId and FormId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (typeof variableId === "string") variableId = decodeUUIDToId(variableId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    // Check whether the variableid belongs to the respective form or not
    await this.isVariableBelongsToForm(formId, variableId);

    // Delete the variable
    const deletedVariableId = (
      await db
        .delete(FormVariableModel)
        .where(eq(FormVariableModel.id, variableId))
        .returning({ id: FormVariableModel.id })
    )[0].id;

    return encodeIdToUUID(deletedVariableId);
  }

  static async createFormLogic(
    userId: string | number,
    formId: string | number,
    data: FormLogic
  ) {
    // UserID and FormId Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    // Create Logic for the form
    const logic = await db
      .insert(FormLogicModel)
      .values({
        formId: formId,
        ...data,
        expected:
          typeof data.expected === "object"
            ? JSON.stringify(data.expected)
            : data.expected,
      })
      .returning();

    return logic.map((l) => ({
      ...l,
      id: encodeIdToUUID(l.id),
      formId: encodeIdToUUID(l.formId),
      fieldId: encodeIdToUUID(l.fieldId),
      navigateFieldId: l.navigateFieldId
        ? encodeIdToUUID(l.navigateFieldId)
        : null,
      variableId: l.variableId ? encodeIdToUUID(l.variableId) : null,
    }))[0];
  }

  static async updateFormLogic(
    userId: string | number,
    formId: string | number,
    logicId: string | number,
    data: FormLogic
  ) {
    // ID Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (typeof logicId === "string") logicId = decodeUUIDToId(logicId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    // Check whether the logicid belongs to the respective form
    await this.isLogicBelongsToForm(formId, logicId);

    // Update Logic
    await db
      .update(FormLogicModel)
      .set({
        formId: formId,
        ...data,
        expected:
          typeof data.expected === "object"
            ? JSON.stringify(data.expected)
            : data.expected,
      })
      .where(eq(FormLogicModel.id, logicId));
  }

  static async deleteFormLogic(
    userId: string | number,
    formId: string | number,
    logicId: string | number
  ) {
    // ID Preprocessing
    if (typeof userId === "string") userId = decodeUUIDToId(userId);
    if (typeof formId === "string") formId = decodeUUIDToId(formId);
    if (typeof logicId === "string") logicId = decodeUUIDToId(logicId);

    // Check whether the formid belongs to the repective user
    await this.isFormAccessible(userId, formId);

    // Check whether the logicid belongs to the respective form
    await this.isLogicBelongsToForm(formId, logicId);

    // Delete Logic
    await db.delete(FormLogicModel).where(eq(FormLogicModel.id, logicId));
  }

  static async findAllInTrash(userId: string) {}
}
