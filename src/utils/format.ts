import type { Priority, Status } from '@/types/common'
import type { StudyMethod } from '@/types/studySession'
import { STUDY_METHOD_LABELS } from '@/constants/studyMethods'

/**
 * فرمت اولویت به فارسی
 */
export function formatPriority(priority: Priority): string {
  const map: Record<Priority, string> = {
    high: 'بالا',
    medium: 'متوسط',
    low: 'پایین',
  }
  return map[priority]
}

/**
 * فرمت وضعیت به فارسی
 */
export function formatStatus(status: Status): string {
  const map: Record<Status, string> = {
    pending: 'در انتظار',
    completed: 'تکمیل شده',
    missed: 'از دست رفته',
    skipped: 'رد شده',
    overdue: 'سررسید گذشته',
  }
  return map[status]
}

/**
 * رنگ وضعیت
 */
export function getStatusColor(status: Status): string {
  const map: Record<Status, string> = {
    pending: 'badge-warning',
    completed: 'badge-success',
    missed: 'badge-destructive',
    skipped: 'badge-primary',
    overdue: 'badge-destructive',
  }
  return map[status]
}

/**
 * فرمت ساعت
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} دقیقه`
  if (mins === 0) return `${hours} ساعت`
  return `${hours} ساعت و ${mins} دقیقه`
}

/**
 * برچسب فارسی روش مطالعه
 */
export function formatStudyMethod(method?: StudyMethod): string {
  if (!method) return ''
  return STUDY_METHOD_LABELS[method] ?? 'مطالعه'
}

/**
 * تبدیل ارقام لاتین به فارسی — برای نمایش هماهنگ در تقویم و آمار
 */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit)
}

/**
 * مخفی کردن API Key
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****'
  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`
}
