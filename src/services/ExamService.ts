import { db } from '@/db/schema'
import type { Exam, CreateExamInput, UpdateExamInput } from '@/types/exam'
import { getToday } from '@/utils/date'

/**
 * سرویس مدیریت امتحانات
 */
export const ExamService = {
  /**
   * دریافت تمام امتحانات
   */
  async getAll(): Promise<Exam[]> {
    return db.exams.toArray()
  },

  /**
   * دریافت امتحانات یک درس
   */
  async getBySubject(subjectId: string): Promise<Exam[]> {
    return db.exams.where('subjectId').equals(subjectId).toArray()
  },

  /**
   * دریافت امتحانات آینده (شامل امروز)
   */
  async getUpcoming(): Promise<Exam[]> {
    const today = getToday()
    return db.exams
      .where('date')
      .aboveOrEqual(today)
      .toArray()
  },

  /**
   * دریافت امتحان با ID
   */
  async getById(id: string): Promise<Exam | undefined> {
    return db.exams.get(id)
  },

  /**
   * ایجاد امتحان جدید
   */
  async create(input: CreateExamInput): Promise<Exam> {
    const now = new Date().toISOString()
    const exam: Exam = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
    }
    await db.exams.add(exam)
    return exam
  },

  /**
   * ویرایش امتحان
   */
  async update(id: string, input: UpdateExamInput): Promise<void> {
    await db.exams.update(id, input)
  },

  /**
   * حذف امتحان
   */
  async delete(id: string): Promise<void> {
    await db.exams.delete(id)
  },
}
