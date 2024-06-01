export enum FormStatusEnum {
  NORMAL = 1,
  TRASH,
}

export enum FieldKindEnum {
  // Statement
  STATEMENT = "statement",

  // Input
  SHORT_TEXT = "short_text",
  LONG_TEXT = "long_text",
  NUMBER = "number",

  // Select
  YES_NO = "yes_no",
  MULTIPLE_CHOICE = "multiple_choice",

  // File
  FILE_UPLOAD = "file_upload",

  // Rating
  OPINION_SCALE = "opinion_scale",
  RATING = "rating",

  // Picker
  DATE = "date",
  DATE_RANGE = "date_range",

  // Fieldset
  EMAIL = "email",
  URL = "url",
  PHONE_NUMBER = "phone_number",
}
