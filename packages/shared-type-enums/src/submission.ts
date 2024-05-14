import type { FieldKindEnum } from './enums/form'
import type {
  SubmissionCategoryEnum,
  SubmissionStatusEnum
} from './enums/submission'
import type { Property, Variable } from './form'

export interface SharedColumns {
  id: string
  kind: FieldKindEnum
  properties?: Property
  value: any
}

export interface Answer extends SharedColumns {
  title: string
  description?: string
}

export interface SubmissionModel {
  id: string
  formId: string
  category: SubmissionCategoryEnum
  title: string
  answers: Answer[]
  columns?: SharedColumns[]
  variables?: Variable[]
  startAt?: number
  endAt?: number
  status: SubmissionStatusEnum
}
