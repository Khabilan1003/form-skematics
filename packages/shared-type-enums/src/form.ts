import type {
  ActionEnum,
  CalculateEnum,
  ComparisonEnum,
  FieldKindEnum,
  FieldLayoutAlignEnum,
  FontSizeEnum,
  FormKindEnum,
  FormStatusEnum,
} from "./enums/form";

export interface FormSetting {
  allowArchive?: boolean;

  requirePassword?: boolean;
  password?: string;

  enableIpLimit?: boolean;
  ipLimitCount?: number;

  published?: boolean;

  enableExpirationDate?: boolean;

  enabledAt?: number;
  closedAt?: number;

  enableQuotaLimit?: boolean;
  quotaLimit?: number;

  closedFormTitle?: string;
  closedFormDescription?: string;
}

export interface Choice {
  id: string;
  label: string;
  image?: string;
}

export interface Column {
  id: string;
  label: string;
  type?: string;
}

export interface Layout {
  mediaType?: "image" | "video";
  mediaUrl?: string;
  backgroundColor?: string;
  brightness?: number;
  align?: FieldLayoutAlignEnum;
}

export interface NumberPrice {
  type: "number";
  value: number;
}

export interface VariablePrice {
  type: "variable";
  ref: string;
}

export interface Property {
  // Statement
  buttonText?: string;

  // Choice
  allowOther?: boolean;
  allowMultiple?: boolean;
  choices?: Choice[];
  randomize?: boolean;

  // Rating
  shape?: string;
  total?: number;

  // Opinion Scale
  leftLabel?: string;
  centerLabel?: string;
  rightLabel?: string;

  // PhoneNumber
  defaultCountryCode?: string;

  // Date
  dateFormat?: string;
  allowTime?: boolean;
}

export interface Validation {
  required?: boolean;
  min?: number;
  max?: number;
  matchExpected?: boolean;
}

export interface FormField {
  position?: number;
  title?: string;
  description?: string;
  kind?: FieldKindEnum;
  required?: boolean;
  layoutMediaType?: "IMAGE" | "VIDEO";
  layoutMediaUrl?: string;
  layoutBrightness?: number;
  layoutAlign?: FieldLayoutAlignEnum;
  properties?: Property;
}

export interface FormTheme {
  fontFamily?: string;

  screenFontSize?: FontSizeEnum;
  fieldFontSize?: FontSizeEnum;

  questionTextColor?: string;
  answerTextColor?: string;
  buttonTextColor?: string;

  buttonBackgroundColor?: string;
  backgroundColor?: string;
}

export interface ThemeSettings {
  themeId?: string;
  theme?: FormTheme;
}

export interface FormModel {
  id: string;
  memberId: string;
  name: string;
  kind: FormKindEnum;

  settings?: FormSetting;
  themeSettings?: ThemeSettings;

  fields?: FormField[];
  variables?: Variable[];
  logics?: FormLogic[];

  fieldUpdateAt?: number;
  submissionCount?: number;
  retentionAt: number;
  suspended?: boolean;
  status: FormStatusEnum;
}

export interface ChoiceValue {
  value: string[];
  other: string;
}

export interface FileUploadValue {
  filename: string;
  url: string;
  size: number;
}

export interface AddressValue {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface FullNameValue {
  firstName: string;
  lastName: string;
}

export interface DateRangeValue {
  start?: string;
  end?: string;
}

export type AnswerValue =
  | ChoiceValue
  | FileUploadValue
  | AddressValue
  | FullNameValue
  | DateRangeValue
  | any;

export interface StringVariable {
  id: string;
  name: string;
  kind: "string";
  value: string;
}

export interface NumberVariable {
  id: string;
  name: string;
  kind: "number";
  value: number;
}

export type Variable = StringVariable | NumberVariable;

export interface TextCondition {
  comparison:
    | ComparisonEnum.IS
    | ComparisonEnum.IS_NOT
    | ComparisonEnum.CONTAINS
    | ComparisonEnum.DOES_NOT_CONTAIN
    | ComparisonEnum.STARTS_WITH
    | ComparisonEnum.ENDS_WITH;
  expected?: string;
}

export interface SingleChoiceCondition {
  comparison: ComparisonEnum.IS | ComparisonEnum.IS_NOT;
  expected?: string;
}

export interface MultipleChoiceCondition {
  comparison:
    | ComparisonEnum.IS
    | ComparisonEnum.IS_NOT
    | ComparisonEnum.CONTAINS
    | ComparisonEnum.DOES_NOT_CONTAIN;
  // IS and IS_NOT should be used with array
  expected?: string | string[];
}

export interface DateCondition {
  comparison:
    | ComparisonEnum.IS
    | ComparisonEnum.IS_NOT
    | ComparisonEnum.IS_BEFORE
    | ComparisonEnum.IS_AFTER;
  expected?: string;
}

export interface NumberCondition {
  comparison:
    | ComparisonEnum.EQUAL
    | ComparisonEnum.NOT_EQUAL
    | ComparisonEnum.GREATER_THAN
    | ComparisonEnum.LESS_THAN
    | ComparisonEnum.GREATER_OR_EQUAL_THAN
    | ComparisonEnum.LESS_OR_EQUAL_THAN;
  expected?: number;
}

export interface OtherCondition {
  comparison: ComparisonEnum.IS_EMPTY | ComparisonEnum.IS_NOT_EMPTY;
}

export interface StringVariableCondition extends TextCondition {
  ref?: string;
}

export interface NumberVariableCondition extends NumberCondition {
  ref?: string;
}

export type LogicCondition =
  | TextCondition
  | SingleChoiceCondition
  | MultipleChoiceCondition
  | DateCondition
  | NumberCondition
  | StringVariableCondition
  | NumberVariableCondition
  | OtherCondition;

export interface NavigateAction {
  kind: ActionEnum.NAVIGATE;
  fieldId: string;
}

export interface NumberCalculateAction {
  kind: ActionEnum.CALCULATE;
  variable: string;
  operator:
    | CalculateEnum.ADDITION
    | CalculateEnum.SUBTRACTION
    | CalculateEnum.MULTIPLICATION
    | CalculateEnum.DIVISION
    | CalculateEnum.ASSIGNMENT;
  value?: number | string;
  ref?: string;
}

export interface StringCalculateAction
  extends Omit<NumberCalculateAction, "operator"> {
  operator: CalculateEnum.ADDITION | CalculateEnum.ASSIGNMENT;
}

export type LogicAction =
  | NavigateAction
  | NumberCalculateAction
  | StringCalculateAction;

export interface FormLogic {
  fieldId: number;
  comparision: ComparisonEnum;
  expected?: string | string[];
  kind: ActionEnum;
  navigateFieldId?: number;
  variableId?: number;
  operator?: CalculateEnum;
  value?: string;
}
