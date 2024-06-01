import type { FieldKindEnum } from "./enums/form";

export interface Answer {
  id: string;
  kind: FieldKindEnum;
  value: any;
}

export interface SubmissionModel {
  formId: string;
  answers: Answer[];
  startAt?: number;
  endAt?: number;
}
