import type { Status } from './common'

/** شماره مرور */
export type ReviewNumber = 1 | 2 | 3 | 4 | 5

/** رکورد مرور */
export interface Review {
  id: string
  subjectId: string
  sessionId: string
  scheduledDate: string
  completedDate?: string
  status: Status
  reviewNumber: ReviewNumber
  createdAt: string
}

/** فرم ایجاد مرور */
export interface CreateReviewInput {
  subjectId: string
  sessionId: string
  scheduledDate: string
  reviewNumber: ReviewNumber
}

/** فرم ویرایش مرور */
export interface UpdateReviewInput {
  scheduledDate?: string
  completedDate?: string
  status?: Status
}
