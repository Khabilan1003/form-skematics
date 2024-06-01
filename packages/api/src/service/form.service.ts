import {
  FieldKindEnum,
  FormField,
  FormStatusEnum,
  Property,
} from "@form/shared-type-enums";
import { db } from "../config";
import {
  FormModel,
  FormSettingModel,
  FormFieldModel,
  FormFieldGroupModel,
} from "../model";
import {
  decodeUUIDToId,
  encodeIdToUUID,
  helper,
  hs,
  timestamp,
} from "@form/utils";
import { HTTPException } from "hono/http-exception";
import { and, desc, eq, gt, inArray, lte, sql } from "drizzle-orm";
import { FormSetting } from "@form/shared-type-enums";
import { FORM_TRASH_INTERVAL } from "../environments";

export class FormService {
  public static async isFormAccessible(userId: number, formId: number) {
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

  public static async isGroupAccessibe(formId: number, fieldGroupId: number) {
    // Check whether the fieldGroupId belongs to the repective Form
    const fieldGroup = await db
      .select()
      .from(FormFieldGroupModel)
      .where(eq(FormFieldGroupModel.id, fieldGroupId));

    if (fieldGroup.length === 0)
      throw new HTTPException(404, { message: "Form Field Group not found" });

    if (fieldGroup[0].formId !== formId)
      throw new HTTPException(401, {
        message: "You do not have access to this field group",
      });
  }

  static async isFieldAccessible(fieldGroupId: number, fieldId: number) {
    const fields = await db
      .select()
      .from(FormFieldModel)
      .where(eq(FormFieldModel.id, fieldId));

    if (fields.length === 0)
      throw new HTTPException(404, { message: "Form Field not found" });

    if (fields[0].fieldGroupId !== fieldGroupId)
      throw new HTTPException(401, {
        message: "You do not have access to this field",
      });
  }

  static async findById(formId: string | number) {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    const form = await db
      .select()
      .from(FormModel)
      .where(eq(FormModel.id, formId));

    const formSetting = await db
      .select()
      .from(FormSettingModel)
      .where(eq(FormSettingModel.formId, formId));

    const formFieldGroup = await db
      .select()
      .from(FormFieldGroupModel)
      .where(eq(FormFieldGroupModel.formId, formId))
      .orderBy(FormFieldGroupModel.position);

    const groupField = await Promise.all(
      formFieldGroup.map(async (group) => {
        let fields = await db
          .select()
          .from(FormFieldModel)
          .where(eq(FormFieldModel.fieldGroupId, group.id));

        return {
          groupId: encodeIdToUUID(group.id),
          title: group.title,
          description: group.description,
          position: group.position,
          fields: fields.map((field) => ({
            ...field,
            id: encodeIdToUUID(field.id),
            fieldGroupId: encodeIdToUUID(field.fieldGroupId),
          })),
        };
      })
    );

    return {
      ...form[0],
      id: encodeIdToUUID(form[0].id),
      setting: {
        ...formSetting[0],
        formId: encodeIdToUUID(formSetting[0].formId),
      },
      groups: groupField,
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

    const formId = newForm[0].id;

    // Create Form Settings
    await db.insert(FormSettingModel).values({
      formId: formId,
    });

    return encodeIdToUUID(formId);
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
        updateConfig.retentionAt = timestamp() + hs(FORM_TRASH_INTERVAL)!;
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
    formId: string | string[] | number | number[],
    isScheduler: boolean
  ): Promise<string[]> {
    // UserId Preprocessing
    if (!isScheduler && typeof userId === "string")
      userId = decodeUUIDToId(userId);

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
      if (!isScheduler && forms[i].userId !== userId)
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

  static async createGroup(formId: string | number): Promise<string> {
    if (typeof formId === "string") formId = decodeUUIDToId(formId);

    // Find Position
    let position: number;
    const groups = await db
      .select()
      .from(FormFieldGroupModel)
      .where(eq(FormFieldGroupModel.formId, formId))
      .orderBy(desc(FormFieldGroupModel.position));
    if (groups.length === 0) position = 1;
    else position = groups[0].position + 1;

    // Create New Group
    const group = await db
      .insert(FormFieldGroupModel)
      .values({
        formId: formId,
        position,
      })
      .returning({ id: FormFieldGroupModel.id });

    return encodeIdToUUID(group[0].id);
  }

  static async updateGroup(
    groupId: string | number,
    updates: { position?: number; title?: string; description?: string }
  ): Promise<boolean> {
    if (typeof groupId === "string") groupId = decodeUUIDToId(groupId);

    const updatedGroup = await db
      .update(FormFieldGroupModel)
      .set(updates)
      .where(eq(FormFieldGroupModel.id, groupId))
      .returning({ id: FormFieldGroupModel.id });

    if (updatedGroup.length === 0) return false;

    return true;
  }

  static async deleteGroup(groupId: string | number) {
    if (typeof groupId === "string") groupId = decodeUUIDToId(groupId);

    const deletedGroup = await db
      .delete(FormFieldGroupModel)
      .where(eq(FormFieldGroupModel.id, groupId))
      .returning({ id: FormFieldGroupModel.id });

    if (deletedGroup.length === 0) return false;

    return true;
  }

  static async createField(
    groupId: string | number,
    fieldKindEnum: FieldKindEnum
  ) {
    if (typeof groupId === "string") groupId = decodeUUIDToId(groupId);

    // Determine position of new field
    let position: number = 0;
    const fields = await db
      .select()
      .from(FormFieldModel)
      .where(eq(FormFieldModel.fieldGroupId, groupId))
      .orderBy(desc(FormFieldModel.position));
    if (fields.length === 0) position = 1;
    else position = fields[0].position + 1;

    let property: Property = {};
    if (fieldKindEnum === FieldKindEnum.YES_NO) {
      property = {
        choices: [
          {
            id: 1,
            label: "yes",
          },
          {
            id: 2,
            label: "no",
          },
        ],
      };
    } else if (fieldKindEnum === FieldKindEnum.MULTIPLE_CHOICE) {
      property = {
        allowOther: false,
        allowMultiple: false,
        randomize: false,
        choices: [],
      };
    } else if (fieldKindEnum === FieldKindEnum.RATING) {
      property = {
        shape: "star",
        total: 5,
      };
    } else if (fieldKindEnum === FieldKindEnum.OPINION_SCALE) {
      property = {
        total: 5,
        leftLabel: "",
        centerLabel: "",
        rightLabel: "",
      };
    } else if (fieldKindEnum === FieldKindEnum.PHONE_NUMBER) {
      property = {
        defaultCountryCode: "+91",
      };
    } else if (
      fieldKindEnum in [FieldKindEnum.DATE, FieldKindEnum.DATE_RANGE]
    ) {
      property = {
        allowTime: false,
      };
    }

    // Create Field
    const newField = await db
      .insert(FormFieldModel)
      .values({
        fieldGroupId: groupId,
        kind: fieldKindEnum,
        position,
        property,
      })
      .returning({ id: FormFieldModel.id });

    return encodeIdToUUID(newField[0].id);
  }

  static async updateField(
    fieldId: string | number,
    updates: FormField
  ): Promise<boolean> {
    if (typeof fieldId === "string") fieldId = decodeUUIDToId(fieldId);

    const updatedField = await db
      .update(FormFieldModel)
      .set(updates)
      .where(eq(FormFieldModel.id, fieldId))
      .returning({ id: FormFieldModel.id });

    if (updatedField.length === 0) return false;

    return true;
  }

  static async deleteField(fieldId: string | number) {
    if (typeof fieldId === "string") fieldId = decodeUUIDToId(fieldId);

    // Delete the Form Field
    const deletedField = await db
      .delete(FormFieldModel)
      .where(eq(FormFieldModel.id, fieldId))
      .returning({
        id: FormFieldModel.id,
        fieldGroupId: FormFieldModel.fieldGroupId,
        position: FormFieldModel.position,
      });
    if (deletedField.length === 0) return false;
    const fieldGroupId = deletedField[0].fieldGroupId;

    // Update the position of other field by -1 i.e., position > deletedField.postion
    await db
      .update(FormFieldModel)
      .set({ position: sql`position - 1` })
      .where(
        and(
          eq(FormFieldModel.fieldGroupId, fieldGroupId),
          gt(FormFieldModel.position, deletedField[0].position)
        )
      );

    return true;
  }

  static async findAllInTrash() {
    const forms = await db
      .select()
      .from(FormModel)
      .where(
        and(
          eq(FormModel.status, FormStatusEnum.TRASH.toString()),
          gt(FormModel.retentionAt, 0),
          lte(FormModel.retentionAt, timestamp())
        )
      );

    return forms;
  }
}