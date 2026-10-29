/** نام پروژه */
export const APP_NAME = 'برنامه‌ریز مطالعه هوشمند'

/** توضیحات پروژه */
export const APP_DESCRIPTION = 'برنامه مطالعه خود را با کمک هوش مصنوعی بسازید'

/** رنگ‌های پیش‌فرض دروس */
export const SUBJECT_COLORS = [
  '#3B82F6', // آبی
  '#EF4444', // قرمز
  '#10B981', // سبز
  '#F59E0B', // نارنجی
  '#8B5CF6', // بنفش
  '#EC4899', // صورتی
  '#06B6D4', // فیروزه‌ای
  '#84CC16', // سبز روشن
  '#F97316', // نارنجی تیره
  '#6366F1', // نیلی
]

/** بریک‌پوینت‌ها */
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
} as const

/** روزهای هفته */
export const WEEK_DAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
] as const

/** شماره روزهای هفته (0-6) */
export const WEEK_DAY_NUMBERS = [0, 1, 2, 3, 4, 5, 6] as const
