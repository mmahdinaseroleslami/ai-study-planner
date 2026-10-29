import { db } from '@/db/schema'

/**
 * سرویس عملیات سطح داده — تنها مسیر مجاز برای پاک‌سازی کامل.
 * هیچ Component نباید مستقیم به db دسترسی داشته باشد.
 */
export const DataService = {
  /** پاک‌سازی کامل تمام storeها (شامل تنظیمات) */
  async clearAll(): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.subjects,
        db.studySessions,
        db.reviews,
        db.exams,
        db.userSettings,
        db.aiProviders,
        db.chatMessages,
      ],
      async () => {
        await Promise.all([
          db.subjects.clear(),
          db.studySessions.clear(),
          db.reviews.clear(),
          db.exams.clear(),
          db.userSettings.clear(),
          db.aiProviders.clear(),
          db.chatMessages.clear(),
        ])
      }
    )
  },

  /** شمارش رکوردهای هر store — برای نمایش خلاصه قبل از حذف */
  async stats(): Promise<{
    subjects: number
    sessions: number
    reviews: number
    exams: number
    messages: number
  }> {
    const [subjects, sessions, reviews, exams, messages] = await Promise.all([
      db.subjects.count(),
      db.studySessions.count(),
      db.reviews.count(),
      db.exams.count(),
      db.chatMessages.count(),
    ])
    return { subjects, sessions, reviews, exams, messages }
  },
}
