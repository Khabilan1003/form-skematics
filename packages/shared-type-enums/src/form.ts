import type {
  ActionEnum,
  CalculateEnum,
  CaptchaKindEnum,
  ComparisonEnum,
  FieldKindEnum,
  FieldLayoutAlignEnum,
  FormKindEnum,
  FormStatusEnum,
} from "./enums/form";

export interface FormSettings {
  captchaKind?: CaptchaKindEnum;

  active?: boolean;

  enableExpirationDate?: boolean;
  expirationTimeZone?: string;

  enabledAt?: number;
  closedAt?: number;

  published?: boolean;
  allowArchive?: boolean;

  password?: string;
  requirePassword?: boolean;

  enableQuotaLimit?: boolean;
  quotaLimit?: number;

  enableIpLimit?: boolean;
  ipLimitCount?: number;
  enableProgress?: boolean;
}

export interface Choice {
  id: string;
  label: string;

  // Picture choice
  image?: string;
  icon?: {
    name: string;
    color: string;
    background: string;
  };

  // HeySheet custom columns
  color?: string;

  // Quiz
  score?: number;
  isExpected?: boolean;
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
  other?: string;

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
  format?: string;
  // Allow input time
  allowTime?: boolean;
  // Time
  timeFormat?: string;
}

export interface Validation {
  required?: boolean;
  min?: number;
  max?: number;
  matchExpected?: boolean;
}

export interface FormField {
  id: string;
  title?: string | any[];
  description?: string | any[];
  kind: FieldKindEnum;
  validations?: Validation;
  properties?: Property;

  // Label for short title
  label?: string;

  layout?: Layout;

  // HeyForm question number
  number?: number;

  index?: number;

  hide?: boolean;
}

export interface FormTheme {
  fontFamily?: string;
  
  screenFontSize?: "small" | "normal" | "large";
  fieldFontSize?: "small" | "normal" | "large";
  
  questionTextColor?: string;
  answerTextColor?: string;
  
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  
  backgroundColor?: string;

  backgroundImage?: string;
  backgroundBrightness?: number;
}

export interface ThemeSettings {
  themeId?: string;
  theme?: FormTheme;
}

export interface FormModel {
  id: string;
  teamId: string;
  projectId: string;
  memberId: string;
  name: string;
  kind: FormKindEnum;

  settings?: FormSettings;
  themeSettings?: ThemeSettings;
  
  fields?: FormField[];
  variables?: Variable[];
  logics?: Logic[];

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

export interface LogicPayload {
  id: string;
  condition: LogicCondition;
  action: LogicAction;
}

export interface Logic {
  fieldId: string;
  payloads: LogicPayload[];
}
