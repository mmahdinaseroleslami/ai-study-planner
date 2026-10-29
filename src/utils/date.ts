/**
 * تبدیل تاریخ میلادی به شمسی
 */
export function toPersianDate(date: Date | string): string {
  const d = parseLocalDate(date)
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * تبدیل تاریخ میلادی به فرمت کوتاه شمسی
 */
export function toPersianShortDate(date: Date | string): string {
  const d = parseLocalDate(date)
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * دریافت نام روز هفته
 */
export function getDayName(date: Date | string): string {
  const d = parseLocalDate(date)
  return new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(d)
}

/**
 * محاسبه تعداد روزهای باقی‌مانده تا تاریخ (بر مبنای روز تقویمی محلی).
 * از اختلاف کامل timestamp استفاده نمی‌کند، چون آن باعث می‌شود
 * «فردا ساعت ۰۹:۰۰» در ساعت ۱۰ امروز عدد ۰ برگرداند.
 */
export function daysUntil(date: Date | string): number {
  const target = typeof date === 'string' ? parseLocalDate(date) : new Date(date)
  const today = new Date()
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const b = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

/**
 * پارس امن رشته تاریخ.
 * `new Date('2026-03-01')` در UTC پارس می‌شود و در تایم‌زون‌های منفی
 * یک روز عقب می‌افتد. برای رشته YYYY-MM-DD از ظهر محلی استفاده می‌کنیم.
 */
export function parseLocalDate(value: string | Date): Date {
  if (value instanceof Date) return new Date(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`)
  return new Date(value)
}

/**
 * فرمت ساعت
 */
export function formatTime(time: string): string {
  const parts = time.split(':')
  const hours = parts[0] ?? '00'
  const minutes = parts[1] ?? '00'
  return `${parseInt(hours, 10)}:${minutes}`
}

/**
 * محاسبه مدت زمان
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startParts = startTime.split(':')
  const endParts = endTime.split(':')
  const startH = Number(startParts[0] ?? 0)
  const startM = Number(startParts[1] ?? 0)
  const endH = Number(endParts[0] ?? 0)
  const endM = Number(endParts[1] ?? 0)
  return (endH * 60 + endM) - (startH * 60 + startM)
}

/**
 * بررسی همپوشانی دو بازه زمانی
 */
export function hasTimeConflict(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = toMinutes(start1)
  const e1 = toMinutes(end1)
  const s2 = toMinutes(start2)
  const e2 = toMinutes(end2)
  return s1 < e2 && s2 < e1
}

function toMinutes(time: string): number {
  const parts = time.split(':')
  const h = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 0)
  return h * 60 + m
}

/**
 * کلید تاریخ محلی YYYY-MM-DD — بدون شیفت تایم‌زون UTC.
 * نکته: toISOString بر اساس UTC است و در تایم‌زون ایران (‎+3:30‎)
 * نیمه‌شب‌ها روز اشتباه برمی‌گرداند؛ همیشه از این helper استفاده کنید.
 */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * دریافت تاریخ امروز (محلی)
 */
export function getToday(): string {
  return toLocalDateKey(new Date())
}

/**
 * دریافت شروع هفته — شنبه‌محور.
 * هفته ایرانی از شنبه شروع می‌شود. getDay() شنبه=۶ و یکشنبه=۰ برمی‌گرداند،
 * پس (day + 1) % 7 تعداد روزهای گذشته از شنبه است.
 * این همان فرمولی است که MonthlyCalendar برای چیدمان شبکه ماه استفاده می‌کند،
 * تا هر دو تقویم هم‌رفتار بمانند.
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const daysSinceSaturday = (d.getDay() + 1) % 7
  d.setDate(d.getDate() - daysSinceSaturday)
  return d
}

/**
 * دریافت پایان هفته
 */
export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}
