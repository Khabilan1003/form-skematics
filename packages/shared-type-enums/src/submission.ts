import type { FieldKindEnum } from "./enums/form";
import type { Variable } from "./form";

export interface Answer {
  id: string;
  kind: FieldKindEnum;
  value: any;
}

export interface SubmissionModel {
  formId: string;
  answers: Answer[];
  variables?: Variable[];
  startAt?: number;
  endAt?: number;
}