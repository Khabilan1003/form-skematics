import type { FieldKindEnum, FormStatusEnum } from "./enums/form";

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
  id: number;
  label: string;
}

export interface Column {
  id: string;
  label: string;
  type?: string;
}

export interface Property {
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
  allowTime?: boolean;
}

export type SubmissionFieldValue =
  | string // This type is for SHORT_TEXT, LONG_TEXT, EMAIL, URL, YES_NO, DATE, COUNTRY
  | number // This type is for NUMBER, RATING, OPINION_SCALE.
  | number[] // This type is for multiple choice ids , 0 - other , remaining ids will be greater than 1
  | { filename: string; size: number; url: string } // This type is for FILE_UPLOAD
  | { countryCode: string; phoneNumber: string } // This type is for PHONE_NUMBER
  | { startDate: number; endDate: number }; // This type is for DATE_RANGE

export interface Validation {
  required?: boolean;
  min?: number;
  max?: number;
  matchExpected?: boolean;
}

export interface FormField {
  fieldGroupId?: number;
  title?: string;
  description?: string;
  position?: number;
  kind?: FieldKindEnum;
  required?: boolean;
  properties?: Property;
}

export interface FormModel {
  id: string;
  name: string;

  settings?: FormSetting;

  fields?: FormField[];

  retentionAt: number;
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

export interface DateRangeValue {
  start?: string;
  end?: string;
}

export type AnswerValue =
  | ChoiceValue
  | FileUploadValue
  | AddressValue
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
