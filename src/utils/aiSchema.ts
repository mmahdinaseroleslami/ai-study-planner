import { z } from 'zod'
import { STUDY_METHOD_VALUES } from '@/constants/studyMethods'
import type { StudyMethod } from '@/types/studySession'
import { getToday, parseLocalDate, toLocalDateKey } from './date'

/** Schema یک جلسه پیشنهادی AI */
export const AISessionProposalSchema = z.object({
  subjectId: z.string().min(1, 'subjectId الزامی است'),
  subjectName: z.string().min(1, 'subjectName الزامی است'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date باید به شکل YYYY-MM-DD باشد'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'startTime باید HH:mm باشد'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'endTime باید HH:mm باشد'),
  type: z.enum(['study', 'review']),
  // اگر مدل روش را جا بیندازد یا مقدار ناشناخته بدهد، «مطالعه» پیش‌فرض است
  method: z.enum(STUDY_METHOD_VALUES).catch('reading'),
})

/** Schema برنامه پیشنهادی AI — اعتبارسنجی اجباری خروجی AI */
export const StudyPlanProposalSchema = z
  .object({
    sessions: z.array(AISessionProposalSchema).min(1, 'حداقل یک جلسه لازم است').max(200, 'تعداد جلسات بیش از حد است'),
    summary: z.string().max(2000).default(''),
  })
  .refine(
    (data) => data.sessions.every((s) => s.startTime < s.endTime),
    { message: 'ساعت پایان باید بعد از ساعت شروع باشد' }
  )

export type ValidatedStudyPlanProposal = z.infer<typeof StudyPlanProposalSchema>

/**
 * تبدیل ارقام فارسی/عربی به ASCII.
 * مدل‌ها گاهی «روز ۳» یا «۲۰۲۶-۱۱-۰۲» برمی‌گردانند و regexهای تاریخ فقط
 * ارقام ASCII را می‌شناسند.
 */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/** محدودیت‌های واقعی برنامه — فراتر از اعتبارسنجی ساختاری Zod */
export interface ProposalConstraints {
  subjectIds: string[]
  startDate: string
  endDate: string
}

/**
 * حذف جلساتی که به درس انتخاب‌شده یا بازه هدف تعلق ندارند.
 * خروجی AI فقط از نظر شکل معتبر است؛ تعلق آن به دروس/بازه باید جداگانه
 * بررسی شود تا جلسه یتیم یا خارج از بازه ذخیره نشود.
 */
export function constrainProposalToPlan(
  proposal: ValidatedStudyPlanProposal,
  constraints: ProposalConstraints
): { proposal: ValidatedStudyPlanProposal; dropped: number } {
  const allowedSubjects = new Set(constraints.subjectIds)
  const sessions = proposal.sessions.filter(
    (session) =>
      allowedSubjects.has(session.subjectId) &&
      session.date >= constraints.startDate &&
      session.date <= constraints.endDate
  )

  return {
    proposal: { ...proposal, sessions },
    dropped: proposal.sessions.length - sessions.length,
  }
}

/**
 * استخراج JSON از متن خام AI (حذف markdown و SSE trailing data)
 */
export function extractJsonFromText(text: string): string {
  // حذف بلاک markdown ```json ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() ?? text.replace(/data:\s*\[DONE\]\s*$/i, '').trim()
  const jsonMatch = candidate.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('پاسخ AI شامل JSON معتبر نیست')
  return jsonMatch[0]
}

/* ------------------------------------------------------------------ */
/* نرمال‌سازی تاریخ — مدل‌ها همیشه به «تاریخ مطلق» پایبند نیستند        */
/* ------------------------------------------------------------------ */

/** نام روزهای هفته ایرانی به شماره از شنبه (۰ = شنبه) */
const PERSIAN_DAY_INDEX: Record<string, number> = {
  'شنبه': 0,
  'یکشنبه': 1,
  'یک‌شنبه': 1,
  'دوشنبه': 2,
  'دو‌شنبه': 2,
  'سه‌شنبه': 3,
  'سه شنبه': 3,
  'چهارشنبه': 4,
  'چهار‌شنبه': 4,
  'پنجشنبه': 5,
  'پنج‌شنبه': 5,
  'جمعه': 6,
}

/** نام روزهای هفته انگلیسی به شماره از شنبه */
const ENGLISH_DAY_INDEX: Record<string, number> = {
  saturday: 0, sat: 0,
  sunday: 1, sun: 1,
  monday: 2, mon: 2,
  tuesday: 3, tue: 3, tues: 3,
  wednesday: 4, wed: 4,
  thursday: 5, thu: 5, thur: 5, thurs: 5,
  friday: 6, fri: 6,
}

/** نام‌های فارسی/انگلیسی رایج روش‌ها که مدل ممکن است برگرداند */
const METHOD_ALIASES: Record<string, StudyMethod> = {
  'ویدیو': 'video',
  'تماشای ویدیو': 'video',
  watch: 'video',
  'مطالعه': 'reading',
  'خواندن': 'reading',
  read: 'reading',
  'خلاصه': 'summary',
  'خلاصه‌نویسی': 'summary',
  'خلاصه نویسی': 'summary',
  summarize: 'summary',
  'تمرین': 'practice',
  'حل تمرین': 'practice',
  'حل مسئله': 'practice',
  problem: 'practice',
  'فلش‌کارت': 'flashcards',
  'فلش کارت': 'flashcards',
  flashcard: 'flashcards',
  'بازیابی': 'recall',
  'بازیابی فعال': 'recall',
  recall: 'recall',
  'تدریس': 'teaching',
  'توضیح': 'teaching',
  teach: 'teaching',
  'آزمون': 'mock_exam',
  'آزمون آزمایشی': 'mock_exam',
  'امتحان آزمایشی': 'mock_exam',
  exam: 'mock_exam',
}

function normalizeMethod(raw: unknown): StudyMethod | undefined {
  if (typeof raw !== 'string') return undefined
  const key = raw.trim().toLowerCase()
  if ((STUDY_METHOD_VALUES as readonly string[]).includes(key)) {
    return key as StudyMethod
  }
  return METHOD_ALIASES[key]
}

function dayIndexFromName(raw: string): number | null {
  const key = raw.trim().toLowerCase().replace(/\u200c/g, '')
  if (key in ENGLISH_DAY_INDEX) return ENGLISH_DAY_INDEX[key] ?? null
  for (const [name, idx] of Object.entries(PERSIAN_DAY_INDEX)) {
    if (name.replace(/\u200c/g, '') === key) return idx
  }
  return null
}

/**
 * تبدیل هر چیزی که مدل به‌عنوان «روز» برگردانده به تاریخ مطلق YYYY-MM-DD.
 * پشتیبانی: تاریخ کامل، نام روز فارسی/انگلیسی، و اعداد نسبی مثل «روز ۳».
 */
export function resolveSessionDate(raw: unknown, startDate?: string): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const value = normalizeDigits(raw.trim())

  // ۱) تاریخ مطلق
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  // ۲) تاریخ ISO کامل
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10)

  const anchor = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : getToday()

  // ۳) نام روز هفته — نزدیک‌ترین وقوع از تاریخ شروع به بعد
  const dayIdx = dayIndexFromName(value)
  if (dayIdx !== null) {
    const base = parseLocalDate(anchor)
    const baseIdx = (base.getDay() + 1) % 7
    let delta = dayIdx - baseIdx
    if (delta < 0) delta += 7
    const target = new Date(base)
    target.setDate(target.getDate() + delta)
    return toLocalDateKey(target)
  }

  // ۴) «روز ۳» / «day 3» — شماره روز نسبی از تاریخ شروع
  const rel = value.match(/(\d+)/)
  if (rel?.[1]) {
    const offset = Number(rel[1])
    if (Number.isFinite(offset) && offset >= 0 && offset < 400) {
      const target = parseLocalDate(anchor)
      target.setDate(target.getDate() + offset)
      return toLocalDateKey(target)
    }
  }

  return null
}

/**
 * اصلاح خروجی خام مدل پیش از اعتبارسنجی:
 * فیلد `day` را به `date` تبدیل می‌کند و مقادیر غیرقابل تبدیل را حذف می‌کند.
 */
function normalizeRawPlan(raw: unknown, startDate?: string): unknown {
  if (typeof raw !== 'object' || raw === null) return raw
  const obj = raw as Record<string, unknown>
  const sessions = obj.sessions
  if (!Array.isArray(sessions)) return raw

  const normalized = sessions
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const s = { ...(item as Record<string, unknown>) }
      const date = resolveSessionDate(s.date ?? s.day, startDate)
      if (!date) return null
      s.date = date
      delete s.day

      // method را به مقدار مجاز نرمال کن؛ مقدار ناشناخته حذف می‌شود تا
      // Zod مقدار پیش‌فرض را بگذارد و کل برنامه رد نشود.
      const method = normalizeMethod(s.method)
      if (method) s.method = method
      else delete s.method
      return s
    })
    .filter((s): s is Record<string, unknown> => s !== null)

  return { ...obj, sessions: normalized }
}

/**
 * Parse + Validate خروجی AI — تنها مسیر مجاز تبدیل پاسخ خام به Proposal.
 * `startDate` برای تبدیل نام روز به تاریخ مطلق استفاده می‌شود.
 */
export function parseAndValidateStudyPlan(text: string, startDate?: string): ValidatedStudyPlanProposal {
  let raw: unknown
  try {
    raw = JSON.parse(extractJsonFromText(text))
  } catch {
    throw new Error('پاسخ AI قابل پردازش نیست (JSON نامعتبر)')
  }
  const result = StudyPlanProposalSchema.safeParse(normalizeRawPlan(raw, startDate))
  if (!result.success) {
    const first = result.error.issues[0]
    throw new Error(`پاسخ AI نامعتبر است: ${first?.message ?? 'خطای اعتبارسنجی'}`)
  }
  return result.data
}
