import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/schema'
import { getNextReviewDate } from '@/constants/reviewIntervals'
import { getToday, toLocalDateKey } from '@/utils/date'
import { SubjectService } from '@/services/SubjectService'
import { StudySessionService } from '@/services/StudySessionService'
import { ReviewService } from '@/services/ReviewService'
import { AIConfigService } from '@/services/AIConfigService'
import { SettingsService } from '@/services/SettingsService'

const dayKey = (offset: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return toLocalDateKey(date)
}

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()))
})

async function createSubject(examDate?: string) {
  return SubjectService.create({
    name: 'ریاضی',
    color: '#3B82F6',
    priority: 'medium',
    difficulty: 3,
    weeklyHours: 5,
    examDate,
  })
}

async function createSession(subjectId: string, date: string) {
  return StudySessionService.create({
    subjectId,
    date,
    startTime: '09:00',
    endTime: '10:00',
    type: 'study',
  })
}

describe('روش مطالعه جلسه', () => {
  it('method را روی جلسه ذخیره و بازخوانی می‌کند', async () => {
    const subject = await createSubject()
    const session = await StudySessionService.create({
      subjectId: subject.id,
      date: dayKey(3),
      startTime: '09:00',
      endTime: '10:00',
      type: 'study',
      method: 'video',
    })

    expect((await db.studySessions.get(session.id))?.method).toBe('video')
  })
})

describe('حذف جلسه', () => {
  it('مرورهای جلسه حذف‌شده را هم پاک می‌کند', async () => {
    const subject = await createSubject()
    const session = await createSession(subject.id, dayKey(3))

    await StudySessionService.complete(session.id)
    expect(await db.reviews.where('sessionId').equals(session.id).count()).toBe(5)

    await StudySessionService.delete(session.id)

    expect(await db.studySessions.get(session.id)).toBeUndefined()
    expect(await db.reviews.where('sessionId').equals(session.id).count()).toBe(0)
  })
})

describe('تعویق مرور', () => {
  it('مرور overdue را بعد از تعویق به آینده، pending می‌کند', async () => {
    const subject = await createSubject()
    const session = await createSession(subject.id, dayKey(-2))
    await StudySessionService.complete(session.id)

    await ReviewService.checkOverdue()
    const overdue = await db.reviews
      .where('sessionId')
      .equals(session.id)
      .filter((review) => review.status === 'overdue')
      .first()

    if (!overdue) throw new Error('مرور سررسیدشده پیدا نشد')
    expect(overdue.scheduledDate < getToday()).toBe(true)

    const tomorrow = dayKey(1)
    await ReviewService.postpone(overdue.id, tomorrow)

    const updated = await db.reviews.get(overdue.id)
    expect(updated?.scheduledDate).toBe(tomorrow)
    expect(updated?.status).toBe('pending')
  })
})

describe('همگام‌سازی امتحان درس', () => {
  it('با پاک‌کردن تاریخ امتحان، رکورد exams هم حذف می‌شود', async () => {
    const subject = await createSubject('2026-12-01')
    expect(await db.exams.where('subjectId').equals(subject.id).count()).toBe(1)

    await SubjectService.update(subject.id, { examDate: undefined })

    const updated = await db.subjects.get(subject.id)
    expect(updated?.examDate).toBeUndefined()
    expect(await db.exams.where('subjectId').equals(subject.id).count()).toBe(0)
  })

  it('با تغییر تاریخ امتحان، همان رکورد به‌روزرسانی می‌شود', async () => {
    const subject = await createSubject('2026-12-01')

    await SubjectService.update(subject.id, { examDate: '2026-12-20' })

    const exams = await db.exams.where('subjectId').equals(subject.id).toArray()
    expect(exams).toHaveLength(1)
    expect(exams[0]?.date).toBe('2026-12-20')
  })
})

describe('تنظیمات ارائه‌دهنده AI', () => {
  it('فعال‌کردن ارائه‌دهنده ذخیره‌شده بقیه را غیرفعال می‌کند', async () => {
    await AIConfigService.save({ type: 'gemini', apiKey: 'gemini-key-123' })
    await AIConfigService.save({ type: 'groq', apiKey: 'groq-key-12345' })

    expect((await AIConfigService.load())?.type).toBe('groq')

    expect(await AIConfigService.activate('gemini')).toBe(true)
    expect((await AIConfigService.load())?.type).toBe('gemini')
  })

  it('برای ارائه‌دهنده بدون رکورد، activate مقدار false برمی‌گرداند', async () => {
    expect(await AIConfigService.activate('openrouter')).toBe(false)
  })

  it('وضعیت stale در تنظیمات بدون رکورد ارائه‌دهنده نادیده گرفته می‌شود', async () => {
    await SettingsService.update({ activeAiProvider: 'openrouter' })

    const loaded = await AIConfigService.load()
    expect(loaded.type).toBe('')
    expect(loaded.apiKey).toBe('')
  })
})

describe('ویرایش تاریخ جلسه', () => {
  it('تاریخ مرورهای تکمیل‌نشده را بر اساس تاریخ جدید بازمحاسبه می‌کند', async () => {
    const subject = await createSubject()
    const oldDate = dayKey(5)
    const newDate = dayKey(10)
    const session = await createSession(subject.id, oldDate)
    await StudySessionService.complete(session.id)

    await StudySessionService.update(session.id, { date: newDate })

    const reviews = await ReviewService.getBySession(session.id)
    expect(reviews).toHaveLength(5)
    for (const review of reviews) {
      expect(review.scheduledDate).toBe(getNextReviewDate(newDate, review.reviewNumber))
    }
  })

  it('مرور overdue را بعد از جابه‌جایی جلسه به آینده pending می‌کند', async () => {
    const subject = await createSubject()
    const session = await createSession(subject.id, dayKey(-10))
    await StudySessionService.complete(session.id)
    await ReviewService.checkOverdue()

    const overdue = await db.reviews
      .where('sessionId')
      .equals(session.id)
      .filter((review) => review.status === 'overdue')
      .first()
    if (!overdue) throw new Error('مرور سررسیدشده پیدا نشد')

    await StudySessionService.update(session.id, { date: dayKey(3) })

    const updated = await db.reviews.get(overdue.id)
    expect(updated?.status).toBe('pending')
    expect(updated!.scheduledDate >= getToday()).toBe(true)
  })

  it('مرورهای تکمیل‌شده را دست‌نخورده نگه می‌دارد', async () => {
    const subject = await createSubject()
    const oldDate = dayKey(5)
    const session = await createSession(subject.id, oldDate)
    await StudySessionService.complete(session.id)

    const first = await db.reviews
      .where('sessionId')
      .equals(session.id)
      .filter((review) => review.reviewNumber === 1)
      .first()
    await ReviewService.complete(first!.id)
    const completedDate = first!.scheduledDate

    await StudySessionService.update(session.id, { date: dayKey(10) })

    const completed = await db.reviews.get(first!.id)
    expect(completed?.status).toBe('completed')
    expect(completed?.scheduledDate).toBe(completedDate)
  })
})
