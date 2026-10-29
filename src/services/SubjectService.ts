import { db } from '@/db/schema'
import type { Subject, CreateSubjectInput, UpdateSubjectInput } from '@/types/subject'

/**
 * سرویس مدیریت دروس
 */
export const SubjectService = {
  /**
   * دریافت تمام دروس
   */
  async getAll(): Promise<Subject[]> {
    return db.subjects.toArray()
  },

  /**
   * دریافت درس با ID
   */
  async getById(id: string): Promise<Subject | undefined> {
    return db.subjects.get(id)
  },

  /**
   * ایجاد درس جدید + ثبت خودکار امتحان (اگر تاریخ امتحان داشته باشد)
   */
  async create(input: CreateSubjectInput): Promise<Subject> {
    const now = new Date().toISOString()
    const subject: Subject = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    }
    await db.transaction('rw', db.subjects, db.exams, async () => {
      await db.subjects.add(subject)
      await syncExamForSubject(subject.id, input.examDate)
    })
    return subject
  },

  /**
   * ویرایش درس + همگام‌سازی رکورد امتحان.
   * همیشه با مقدارِ نهاییِ درس همگام می‌شود تا پاک‌کردن تاریخ امتحان هم
   * رکورد قدیمی exams را حذف کند.
   */
  async update(id: string, input: UpdateSubjectInput): Promise<void> {
    const now = new Date().toISOString()
    await db.transaction('rw', db.subjects, db.exams, async () => {
      await db.subjects.update(id, { ...input, updatedAt: now })
      const updated = await db.subjects.get(id)
      if (updated) await syncExamForSubject(id, updated.examDate)
    })
  },

  /**
   * حذف درس + حذف آبشاری جلسات، مرورها و امتحان‌های مرتبط
   * (جلوگیری از داده‌های یتیم)
   */
  async delete(id: string): Promise<void> {
    await db.transaction(
      'rw',
      db.subjects,
      db.studySessions,
      db.reviews,
      db.exams,
      async () => {
        const sessions = await db.studySessions.where('subjectId').equals(id).toArray()
        for (const s of sessions) {
          await db.reviews.where('sessionId').equals(s.id).delete()
        }
        await db.studySessions.where('subjectId').equals(id).delete()
        await db.reviews.where('subjectId').equals(id).delete()
        await db.exams.where('subjectId').equals(id).delete()
        await db.subjects.delete(id)
      }
    )
  },

  /**
   * جستجوی دروس
   */
  async search(query: string): Promise<Subject[]> {
    const lowerQuery = query.toLowerCase()
    return db.subjects
      .filter((subject) => subject.name.toLowerCase().includes(lowerQuery))
      .toArray()
  },
}

/**
 * همگام‌سازی رکورد امتحان با تاریخ امتحان درس.
 * هر درس حداکثر یک رکورد امتحان دارد.
 */
async function syncExamForSubject(subjectId: string, examDate: string | undefined): Promise<void> {
  const existing = await db.exams.where('subjectId').equals(subjectId).toArray()
  if (!examDate) {
    for (const e of existing) await db.exams.delete(e.id)
    return
  }
  if (existing.length === 0) {
    await db.exams.add({
      id: crypto.randomUUID(),
      subjectId,
      date: examDate,
      createdAt: new Date().toISOString(),
    })
  } else {
    for (const e of existing) {
      await db.exams.update(e.id, { date: examDate })
    }
  }
}
