import { db } from '@/db/schema'
import type { Review, ReviewNumber } from '@/types/review'
import { getNextReviewDate, MAX_REVIEW_NUMBER } from '@/constants/reviewIntervals'
import { getToday } from '@/utils/date'

/**
 * سرویس مدیریت مرورها (Spaced Repetition)
 */
export const ReviewService = {
  /**
   * دریافت تمام مرورها
   */
  async getAll(): Promise<Review[]> {
    return db.reviews.toArray()
  },

  /**
   * دریافت مرورهای یک درس
   */
  async getBySubject(subjectId: string): Promise<Review[]> {
    return db.reviews.where('subjectId').equals(subjectId).toArray()
  },

  /**
   * دریافت مرورهای یک جلسه
   */
  async getBySession(sessionId: string): Promise<Review[]> {
    return db.reviews.where('sessionId').equals(sessionId).toArray()
  },

  /**
   * دریافت مرورهای امروز
   */
  async getToday(): Promise<Review[]> {
    const today = getToday()
    return db.reviews
      .where('scheduledDate')
      .equals(today)
      .and((review) => review.status === 'pending')
      .toArray()
  },

  /**
   * دریافت مرورهای آینده (شامل امروز)
   */
  async getUpcoming(): Promise<Review[]> {
    const today = getToday()
    return db.reviews
      .where('scheduledDate')
      .aboveOrEqual(today)
      .and((review) => review.status === 'pending')
      .toArray()
  },

  /**
   * ایجاد مرورهای جدید برای یک جلسه مطالعه
   */
  async createReviewsForSession(sessionId: string, subjectId: string, studyDate: string): Promise<Review[]> {
    const reviews: Review[] = []
    const now = new Date().toISOString()

    for (let i = 1; i <= MAX_REVIEW_NUMBER; i++) {
      const reviewNumber = i as ReviewNumber
      const review: Review = {
        id: crypto.randomUUID(),
        subjectId,
        sessionId,
        scheduledDate: getNextReviewDate(studyDate, reviewNumber),
        status: 'pending',
        reviewNumber,
        createdAt: now,
      }
      reviews.push(review)
    }

    await db.reviews.bulkAdd(reviews)
    return reviews
  },

  /**
   * تکمیل مرور
   */
  async complete(id: string): Promise<void> {
    await db.reviews.update(id, {
      status: 'completed',
      completedDate: getToday(),
    })
  },

  /**
   * تعویق مرور
   */
  async postpone(id: string, newDate: string): Promise<void> {
    const review = await db.reviews.get(id)
    if (!review) return

    // مرور سررسیدشده بعد از تعویق به آینده باید دوباره «در انتظار» شود،
    // وگرنه برای همیشه overdue می‌ماند و در فیلترهای امروز/آینده دیده نمی‌شود.
    await db.reviews.update(id, {
      scheduledDate: newDate,
      ...(review.status === 'overdue' && newDate >= getToday()
        ? { status: 'pending' as const }
        : {}),
    })
  },

  /**
   * حذف مرور
   */
  async delete(id: string): Promise<void> {
    await db.reviews.delete(id)
  },

  /**
   * بررسی مرورهای سررسید گذشته
   */
  async checkOverdue(): Promise<Review[]> {
    const today = getToday()
    const overdue = await db.reviews
      .where('scheduledDate')
      .below(today)
      .and((review) => review.status === 'pending')
      .toArray()

    // به‌روزرسانی وضعیت مرورهای سررسید گذشته
    for (const review of overdue) {
      await db.reviews.update(review.id, { status: 'overdue' })
    }

    return overdue
  },
}
