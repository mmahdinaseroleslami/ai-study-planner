import type { StudyMethod } from '@/types/studySession'

/** مقادیر مجاز روش مطالعه — همین‌ها در اسکیمای AI و پرامپت استفاده می‌شوند */
export const STUDY_METHOD_VALUES = [
  'video',
  'reading',
  'summary',
  'practice',
  'flashcards',
  'recall',
  'teaching',
  'mock_exam',
] as const satisfies readonly StudyMethod[]

/** گزینه‌های قابل انتخاب در فرم برنامه‌ریز */
export const STUDY_METHODS: ReadonlyArray<{
  value: StudyMethod
  label: string
  hint: string
}> = [
  { value: 'video', label: 'ویدیو', hint: 'تماشای ویدیو یا درس آنلاین' },
  { value: 'reading', label: 'مطالعه', hint: 'خواندن کتاب یا جزوه' },
  { value: 'summary', label: 'خلاصه‌نویسی', hint: 'خلاصه، نقشه ذهنی یا بازنویسی با کلمات خود' },
  { value: 'practice', label: 'تمرین', hint: 'حل مسئله و تمرین هدفمند' },
  { value: 'flashcards', label: 'فلش‌کارت', hint: 'مرور فعال با کارت‌های پرسش و پاسخ' },
  { value: 'recall', label: 'بازیابی فعال', hint: 'یادآوری مطلب بدون نگاه‌کردن به منبع' },
  { value: 'teaching', label: 'تدریس', hint: 'توضیح دادن مطلب برای یک شخص دیگر' },
  { value: 'mock_exam', label: 'آزمون آزمایشی', hint: 'شبیه‌سازی شرایط امتحان' },
]

/** برچسب فارسی هر روش */
export const STUDY_METHOD_LABELS: Record<StudyMethod, string> = {
  video: 'ویدیو',
  reading: 'مطالعه',
  summary: 'خلاصه‌نویسی',
  practice: 'تمرین',
  flashcards: 'فلش‌کارت',
  recall: 'بازیابی فعال',
  teaching: 'تدریس',
  mock_exam: 'آزمون آزمایشی',
}
