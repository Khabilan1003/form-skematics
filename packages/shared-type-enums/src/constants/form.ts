import { FieldKindEnum } from "../enums/form";

export const QUESTION_FIELD_KINDS = [
  // Input
  FieldKindEnum.SHORT_TEXT,
  FieldKindEnum.LONG_TEXT,
  FieldKindEnum.NUMBER,

  // Select
  FieldKindEnum.YES_NO,
  FieldKindEnum.MULTIPLE_CHOICE,

  // File
  FieldKindEnum.FILE_UPLOAD,

  // Rating
  FieldKindEnum.OPINION_SCALE,
  FieldKindEnum.RATING,

  // Date & Time
  FieldKindEnum.DATE,
  FieldKindEnum.DATE_RANGE,

  // Fieldset
  FieldKindEnum.EMAIL,
  FieldKindEnum.URL,
  FieldKindEnum.PHONE_NUMBER,
];

export const INPUT_FIELD_KINDS = [
  FieldKindEnum.SHORT_TEXT,
  FieldKindEnum.LONG_TEXT,
  FieldKindEnum.NUMBER,
  FieldKindEnum.EMAIL,
  FieldKindEnum.URL,
];

export const CHOICES_FIELD_KINDS = [FieldKindEnum.MULTIPLE_CHOICE];

export const FORM_FIELD_KINDS = [...QUESTION_FIELD_KINDS];
