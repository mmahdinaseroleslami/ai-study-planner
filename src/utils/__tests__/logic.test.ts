import { describe, it, expect } from 'vitest'
import {
  toLocalDateKey,
  getWeekStart,
  getWeekEnd,
  daysUntil,
  parseLocalDate,
  hasTimeConflict,
} from '@/utils/date'
import { getNextReviewDate } from '@/constants/reviewIntervals'
import { resolveSessionDate, parseAndValidateStudyPlan } from '@/utils/aiSchema'
import { findAllConflicts } from '@/utils/conflict'
import type { StudySession } from '@/types/studySession'

const session = (over: Partial<StudySession>): StudySession => ({
  id: 'x',
  subjectId: 's1',
  date: '2026-10-29',
  startTime: '09:00',
  endTime: '10:00',
  type: 'study',
  status: 'pending',
  source: 'manual',
  createdAt: '2026-10-29T00:00:00.000Z',
  ...over,
})

describe('getWeekStart — شنبه‌محور', () => {
  // 2026-10-29 پنجشنبه است؛ شنبه همان هفته 2026-10-24
  it('پنجشنبه را به شنبه قبل می‌برد', () => {
    expect(toLocalDateKey(getWeekStart(new Date('2026-10-29T12:00:00')))).toBe('2026-10-24')
  })

  it('شنبه را روی خودش نگه می‌دارد', () => {
    expect(toLocalDateKey(getWeekStart(new Date('2026-10-24T12:00:00')))).toBe('2026-10-24')
  })

  it('یکشنبه را به شنبه قبل می‌برد', () => {
    expect(toLocalDateKey(getWeekStart(new Date('2026-10-25T12:00:00')))).toBe('2026-10-24')
  })

  it('جمعه را به شنبه همان هفته می‌برد', () => {
    expect(toLocalDateKey(getWeekStart(new Date('2026-10-30T12:00:00')))).toBe('2026-10-24')
  })

  it('پایان هفته ۶ روز بعد از شروع است', () => {
    expect(toLocalDateKey(getWeekEnd(new Date('2026-10-29T12:00:00')))).toBe('2026-10-30')
  })

  it('هفته ۷ روز کامل است', () => {
    const start = getWeekStart(new Date('2026-10-29T12:00:00'))
    const end = getWeekEnd(new Date('2026-10-29T12:00:00'))
    expect(Math.round((end.getTime() - start.getTime()) / 86400000)).toBe(6)
  })
})

describe('daysUntil — بر مبنای روز تقویمی', () => {
  it('فردا یک روز است', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(daysUntil(toLocalDateKey(tomorrow))).toBe(1)
  })

  it('امروز صفر است', () => {
    expect(daysUntil(toLocalDateKey(new Date()))).toBe(0)
  })

  it('دیروز منفی یک است', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(daysUntil(toLocalDateKey(yesterday))).toBe(-1)
  })
})

describe('parseLocalDate — بدون شیفت UTC', () => {
  it('تاریخ YYYY-MM-DD را در ظهر محلی پارس می‌کند', () => {
    const d = parseLocalDate('2026-03-01')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(2)
    expect(d.getDate()).toBe(1)
  })

  it('روی رشته تاریخ، روز را جابه‌جا نمی‌کند', () => {
    expect(toLocalDateKey(parseLocalDate('2026-01-01'))).toBe('2026-01-01')
    expect(toLocalDateKey(parseLocalDate('2026-12-31'))).toBe('2026-12-31')
  })
})

describe('getNextReviewDate — مرز ماه و سال', () => {
  it('مرور ۱ = فردا', () => {
    expect(getNextReviewDate('2026-10-29', 1)).toBe('2026-10-30')
  })

  it('مرور ۲ = سه روز بعد، با عبور از مرز ماه', () => {
    expect(getNextReviewDate('2026-10-29', 2)).toBe('2026-11-01')
  })

  it('مرور ۵ = سی روز بعد، با عبور از مرز سال', () => {
    expect(getNextReviewDate('2026-12-15', 5)).toBe('2027-01-14')
  })

  it('مرور ۳ در فوریه درست کار می‌کند', () => {
    expect(getNextReviewDate('2026-02-25', 3)).toBe('2026-03-04')
  })

  it('همه فواصل روی یک تاریخ ثابت درست‌اند', () => {
    const base = '2026-06-01'
    expect([
      getNextReviewDate(base, 1),
      getNextReviewDate(base, 2),
      getNextReviewDate(base, 3),
      getNextReviewDate(base, 4),
      getNextReviewDate(base, 5),
    ]).toEqual(['2026-06-02', '2026-06-04', '2026-06-08', '2026-06-15', '2026-07-01'])
  })
})

describe('resolveSessionDate — ریشه باگ Planner', () => {
  it('تاریخ مطلق را همان‌طور برمی‌گرداند', () => {
    expect(resolveSessionDate('2026-11-05', '2026-11-01')).toBe('2026-11-05')
  })

  it('ISO کامل را به تاریخ کوتاه تبدیل می‌کند', () => {
    expect(resolveSessionDate('2026-11-05T09:00:00Z', '2026-11-01')).toBe('2026-11-05')
  })

  it('نام روز فارسی را به تاریخ مطلق تبدیل می‌کند', () => {
    // 2026-11-01 یکشنبه است؛ شنبه بعدی 2026-11-07
    expect(resolveSessionDate('شنبه', '2026-11-01')).toBe('2026-11-07')
  })

  it('نام روزی که همان روز شروع است را به خودش نگاشت می‌کند', () => {
    expect(resolveSessionDate('یکشنبه', '2026-11-01')).toBe('2026-11-01')
  })

  it('نام روز انگلیسی را هم می‌فهمد', () => {
    expect(resolveSessionDate('Saturday', '2026-11-01')).toBe('2026-11-07')
    expect(resolveSessionDate('monday', '2026-11-01')).toBe('2026-11-02')
  })

  it('روز نسبی را از تاریخ شروع می‌شمارد', () => {
    expect(resolveSessionDate('روز 3', '2026-11-01')).toBe('2026-11-04')
  })

  it('مقدار غیرقابل تبدیل را رد می‌کند', () => {
    expect(resolveSessionDate('bla-bla', '2026-11-01')).toBeNull()
    expect(resolveSessionDate('', '2026-11-01')).toBeNull()
    expect(resolveSessionDate(null, '2026-11-01')).toBeNull()
  })
})

describe('parseAndValidateStudyPlan', () => {
  it('پاسخ معتبر با تاریخ مطلق را می‌پذیرد', () => {
    const json = JSON.stringify({
      sessions: [
        { subjectId: 's1', subjectName: 'ریاضی', date: '2026-11-02', startTime: '09:00', endTime: '10:00', type: 'study' },
      ],
      summary: 'برنامه تست',
    })
    const plan = parseAndValidateStudyPlan(json, '2026-11-01')
    expect(plan.sessions).toHaveLength(1)
    expect(plan.sessions[0]?.date).toBe('2026-11-02')
  })

  it('پاسخ با نام روز را به تاریخ مطلق تبدیل می‌کند', () => {
    const json = JSON.stringify({
      sessions: [
        { subjectId: 's1', subjectName: 'ریاضی', day: 'شنبه', startTime: '09:00', endTime: '10:00', type: 'study' },
      ],
      summary: '',
    })
    const plan = parseAndValidateStudyPlan(json, '2026-11-01')
    expect(plan.sessions[0]?.date).toBe('2026-11-07')
  })

  it('بلوک markdown را می‌شکند', () => {
    const text = '```json\n{"sessions":[{"subjectId":"s1","subjectName":"x","date":"2026-11-02","startTime":"09:00","endTime":"10:00","type":"study"}],"summary":""}\n```'
    expect(parseAndValidateStudyPlan(text, '2026-11-01').sessions).toHaveLength(1)
  })

  it('ساعت معکوس را رد می‌کند', () => {
    const json = JSON.stringify({
      sessions: [
        { subjectId: 's1', subjectName: 'x', date: '2026-11-02', startTime: '11:00', endTime: '10:00', type: 'study' },
      ],
      summary: '',
    })
    expect(() => parseAndValidateStudyPlan(json, '2026-11-01')).toThrow()
  })

  it('JSON نامعتبر را رد می‌کند', () => {
    expect(() => parseAndValidateStudyPlan('این JSON نیست', '2026-11-01')).toThrow()
  })

  it('آرایه خالی جلسات را رد می‌کند', () => {
    expect(() => parseAndValidateStudyPlan('{"sessions":[],"summary":""}', '2026-11-01')).toThrow()
  })
})

describe('hasTimeConflict', () => {
  it('همپوشانی را تشخیص می‌دهد', () => {
    expect(hasTimeConflict('09:00', '10:00', '09:30', '10:30')).toBe(true)
  })

  it('بازه‌های چسبیده تداخل ندارند', () => {
    expect(hasTimeConflict('09:00', '10:00', '10:00', '11:00')).toBe(false)
  })

  it('بازه‌های جدا تداخل ندارند', () => {
    expect(hasTimeConflict('09:00', '10:00', '14:00', '15:00')).toBe(false)
  })

  it('بازه کامل درون بازه دیگر را می‌گیرد', () => {
    expect(hasTimeConflict('09:00', '12:00', '10:00', '11:00')).toBe(true)
  })
})

describe('findAllConflicts', () => {
  it('دو جلسه متداخل در یک روز را پیدا می‌کند', () => {
    const conflicts = findAllConflicts([
      session({ id: 'a', startTime: '09:00', endTime: '10:00' }),
      session({ id: 'b', startTime: '09:30', endTime: '10:30' }),
    ])
    expect(conflicts).toHaveLength(1)
  })

  it('جلسات متداخل در روزهای مختلف تداخل ندارند', () => {
    const conflicts = findAllConflicts([
      session({ id: 'a', date: '2026-10-29', startTime: '09:00', endTime: '10:00' }),
      session({ id: 'b', date: '2026-10-30', startTime: '09:00', endTime: '10:00' }),
    ])
    expect(conflicts).toHaveLength(0)
  })

  it('سه جلسه هم‌زمان سه جفت تداخل می‌سازند', () => {
    const conflicts = findAllConflicts([
      session({ id: 'a', startTime: '09:00', endTime: '11:00' }),
      session({ id: 'b', startTime: '09:30', endTime: '11:30' }),
      session({ id: 'c', startTime: '10:00', endTime: '12:00' }),
    ])
    expect(conflicts).toHaveLength(3)
  })
})
