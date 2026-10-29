import type { Priority } from './common'

/** رکورد درس */
export interface Subject {
  id: string
  name: string
  color: string
  priority: Priority
  difficulty: 1 | 2 | 3 | 4 | 5
  weeklyHours: number
  examDate?: string
  createdAt: string
  updatedAt: string
}

/** فرم ایجاد درس */
export interface CreateSubjectInput {
  name: string
  color: string
  priority: Priority
  difficulty: 1 | 2 | 3 | 4 | 5
  weeklyHours: number
  examDate?: string
}

/** فرم ویرایش درس */
export interface UpdateSubjectInput extends Partial<CreateSubjectInput> {}
