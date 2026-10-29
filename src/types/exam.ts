/** رکورد امتحان */
export interface Exam {
  id: string
  subjectId: string
  date: string
  time?: string
  location?: string
  notes?: string
  createdAt: string
}

/** فرم ایجاد امتحان */
export interface CreateExamInput {
  subjectId: string
  date: string
  time?: string
  location?: string
  notes?: string
}

/** فرم ویرایش امتحان */
export interface UpdateExamInput extends Partial<CreateExamInput> {}
