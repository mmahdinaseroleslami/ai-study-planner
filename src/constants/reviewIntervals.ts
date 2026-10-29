import type { ReviewNumber } from '@/types/review'
import { parseLocalDate, toLocalDateKey } from '@/utils/date'

/** فواصل زمانی مرور (بر حسب روز) */
export const REVIEW_INTERVALS: Record<ReviewNumber, number> = {
  1: 1,    // +۱ روز
  2: 3,    // +۳ روز
  3: 7,    // +۷ روز
  4: 14,   // +۱۴ روز
  5: 30,   // +۳۰ روز
}

/** حداکثر تعداد مرور */
export const MAX_REVIEW_NUMBER: ReviewNumber = 5

/**
 * محاسبه تاریخ مرور بعدی.
 * از parseLocalDate/toLocalDateKey استفاده می‌کند تا شیفت تایم‌زون UTC
 * تاریخ را یک روز جابه‌جا نکند (باگ کلاسیک `new Date('YYYY-MM-DD')`).
 */
export function getNextReviewDate(studyDate: string, reviewNumber: ReviewNumber): string {
  const date = parseLocalDate(studyDate)
  date.setDate(date.getDate() + REVIEW_INTERVALS[reviewNumber])
  return toLocalDateKey(date)
}
