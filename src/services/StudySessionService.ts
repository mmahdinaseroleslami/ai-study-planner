import { db } from '@/db/schema'
import type { StudySession, CreateStudySessionInput, UpdateStudySessionInput } from '@/types/studySession'
import { ReviewService } from './ReviewService'
import { getNextReviewDate } from '@/constants/reviewIntervals'
import { toLocalDateKey, getWeekStart, getWeekEnd, getToday } from '@/utils/date'

/**
 * سرویس مدیریت جلسات مطالعه
 */
export const StudySessionService = {
  /**
   * دریافت تمام جلسات
   */
  async getAll(): Promise<StudySession[]> {
    return db.studySessions.toArray()
  },

  /**
   * دریافت جلسات یک درس
   */
  async getBySubject(subjectId: string): Promise<StudySession[]> {
    return db.studySessions.where('subjectId').equals(subjectId).toArray()
  },

  /**
   * دریافت جلسات یک تاریخ
   */
  async getByDate(date: string): Promise<StudySession[]> {
    return db.studySessions.where('date').equals(date).toArray()
  },

  /**
   * دریافت جلسات یک بازه زمانی
   */
  async getByDateRange(startDate: string, endDate: string): Promise<StudySession[]> {
    return db.studySessions
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray()
  },

  /**
   * دریافت جلسه با ID
   */
  async getById(id: string): Promise<StudySession | undefined> {
    return db.studySessions.get(id)
  },

  /**
   * ایجاد جلسه جدید
   */
  async create(input: CreateStudySessionInput): Promise<StudySession> {
    const now = new Date().toISOString()
    const session: StudySession = {
      id: crypto.randomUUID(),
      ...input,
      source: input.source ?? 'manual',
      status: 'pending',
      createdAt: now,
    }
    await db.studySessions.add(session)
    return session
  },

  /**
   * جایگزینی اتمیک جلسات یک بازه با جلسات جدید AI.
   * فقط جلسات با source === 'ai' حذف می‌شوند؛ جلسات دستی کاربر دست‌نخورده می‌مانند.
   * مرورهای جلسات حذف‌شده هم پاک می‌شوند تا داده یتیم نماند.
   */
  async replaceAiSessionsInRange(
    startDate: string,
    endDate: string,
    inputs: CreateStudySessionInput[]
  ): Promise<{ removed: number; created: number }> {
    return db.transaction('rw', db.studySessions, db.reviews, async () => {
      const existing = await db.studySessions
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray()
      const aiSessions = existing.filter((s) => s.source === 'ai')

      for (const s of aiSessions) {
        await db.reviews.where('sessionId').equals(s.id).delete()
        await db.studySessions.delete(s.id)
      }

      const now = new Date().toISOString()
      const rows: StudySession[] = inputs.map((input) => ({
        id: crypto.randomUUID(),
        ...input,
        source: 'ai',
        status: 'pending',
        createdAt: now,
      }))
      if (rows.length > 0) await db.studySessions.bulkAdd(rows)

      return { removed: aiSessions.length, created: rows.length }
    })
  },

  /**
   * ویرایش جلسه
   */
  async update(id: string, input: UpdateStudySessionInput): Promise<void> {
    await db.transaction('rw', db.studySessions, db.reviews, async () => {
      const existing = await db.studySessions.get(id)
      await db.studySessions.update(id, input)

      // اگر تاریخ جلسه عوض شده، تاریخ مرورهای آینده هم باید جابه‌جا شود
      if (!existing || !input.date || input.date === existing.date) return

      const today = getToday()
      const reviews = await db.reviews.where('sessionId').equals(id).toArray()
      for (const review of reviews) {
        if (review.status === 'completed') continue
        const scheduledDate = getNextReviewDate(input.date, review.reviewNumber)
        await db.reviews.update(review.id, {
          scheduledDate,
          // اگر مرور قبلاً overdue شده و تاریخ جدید در آینده است، دوباره pending شود
          ...(review.status === 'overdue' && scheduledDate >= today
            ? { status: 'pending' as const }
            : {}),
        })
      }
    })
  },

  /**
   * حذف جلسه + مرورهای مرتبط (بدون داده یتیم)
   */
  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.studySessions, db.reviews, async () => {
      await db.reviews.where('sessionId').equals(id).delete()
      await db.studySessions.delete(id)
    })
  },

  /**
   * تکمیل جلسه + ساخت خودکار مرورهای Spaced Repetition (۱-۳-۷-۱۴-۳۰)
   */
  async complete(id: string): Promise<void> {
    await db.transaction('rw', db.studySessions, db.reviews, async () => {
      const session = await db.studySessions.get(id)
      await db.studySessions.update(id, { status: 'completed' })
      if (session) {
        // جلوگیری از ساخت تکراری مرور
        const existing = await db.reviews.where('sessionId').equals(id).count()
        if (existing === 0) {
          await ReviewService.createReviewsForSession(id, session.subjectId, session.date)
        }
      }
    })
  },

  /**
   * دریافت جلسات امروز
   */
  async getToday(): Promise<StudySession[]> {
    return this.getByDate(toLocalDateKey(new Date()))
  },

  /**
   * دریافت جلسات این هفته
   */
  async getThisWeek(): Promise<StudySession[]> {
    return this.getByDateRange(
      toLocalDateKey(getWeekStart()),
      toLocalDateKey(getWeekEnd())
    )
  },
}
