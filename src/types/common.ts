/** نوع وضعیت کلی */
export type Status = 'pending' | 'completed' | 'missed' | 'skipped' | 'overdue'

/** نوع اولویت */
export type Priority = 'high' | 'medium' | 'low'

/** نوع تم */
export type Theme = 'light' | 'dark' | 'system'

/** نوع زبان */
export type Language = 'fa' | 'en'

/** روز هفته */
export type WeekDay = 'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه' | 'پنجشنبه' | 'جمعه'

/** نوع جلسه مطالعه */
export type SessionType = 'study' | 'review'

/** پاسخ API */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

/** صفحه‌بندی */
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}
