import { describe, expect, it } from 'vitest'
import {
  constrainProposalToPlan,
  parseAndValidateStudyPlan,
  resolveSessionDate,
  type ValidatedStudyPlanProposal,
} from '@/utils/aiSchema'

const proposal: ValidatedStudyPlanProposal = {
  summary: '',
  sessions: [
    {
      subjectId: 's1',
      subjectName: 'ریاضی',
      date: '2026-11-02',
      startTime: '09:00',
      endTime: '10:00',
      type: 'study',
      method: 'reading',
    },
    {
      subjectId: 'unknown',
      subjectName: 'درس خیالی',
      date: '2026-11-03',
      startTime: '11:00',
      endTime: '12:00',
      type: 'study',
      method: 'practice',
    },
    {
      subjectId: 's1',
      subjectName: 'ریاضی',
      date: '2026-10-30',
      startTime: '09:00',
      endTime: '10:00',
      type: 'study',
      method: 'summary',
    },
    {
      subjectId: 's1',
      subjectName: 'ریاضی',
      date: '2026-11-10',
      startTime: '09:00',
      endTime: '10:00',
      type: 'study',
      method: 'practice',
    },
  ],
}

describe('constrainProposalToPlan', () => {
  it('جلسات نامعتبر از نظر درس و بازه را حذف می‌کند', () => {
    const result = constrainProposalToPlan(proposal, {
      subjectIds: ['s1'],
      startDate: '2026-11-01',
      endDate: '2026-11-05',
    })

    expect(result.proposal.sessions).toHaveLength(1)
    expect(result.proposal.sessions[0]?.date).toBe('2026-11-02')
    expect(result.proposal.sessions[0]?.method).toBe('reading')
    expect(result.dropped).toBe(3)
  })

  it('مرزهای بازه را معتبر می‌داند', () => {
    const result = constrainProposalToPlan(
      {
        summary: '',
        sessions: [
          {
            subjectId: 's1',
            subjectName: 'ریاضی',
            date: '2026-11-01',
            startTime: '09:00',
            endTime: '10:00',
            type: 'study',
            method: 'video',
          },
          {
            subjectId: 's1',
            subjectName: 'ریاضی',
            date: '2026-11-05',
            startTime: '09:00',
            endTime: '10:00',
            type: 'study',
            method: 'mock_exam',
          },
        ],
      },
      { subjectIds: ['s1'], startDate: '2026-11-01', endDate: '2026-11-05' }
    )

    expect(result.proposal.sessions).toHaveLength(2)
    expect(result.dropped).toBe(0)
  })
})

describe('ارقام فارسی در خروجی AI', () => {
  it('روز نسبی با رقم فارسی را می‌فهمد', () => {
    expect(resolveSessionDate('روز ۳', '2026-11-01')).toBe('2026-11-04')
  })

  it('تاریخ مطلق با رقم فارسی را به تاریخ استاندارد تبدیل می‌کند', () => {
    expect(resolveSessionDate('۲۰۲۶-۱۱-۰۵', '2026-11-01')).toBe('2026-11-05')
  })

  it('تاریخ فارسی را در مسیر کامل parse/validate هم می‌پذیرد', () => {
    const json = JSON.stringify({
      sessions: [
        {
          subjectId: 's1',
          subjectName: 'ریاضی',
          date: '۲۰۲۶-۱۱-۰۲',
          startTime: '09:00',
          endTime: '10:00',
          type: 'study',
          method: 'practice',
        },
      ],
      summary: '',
    })

    expect(parseAndValidateStudyPlan(json, '2026-11-01').sessions[0]?.date).toBe('2026-11-02')
  })
})

describe('روش مطالعه در خروجی AI', () => {
  const planWithMethod = (method?: string) =>
    JSON.stringify({
      sessions: [
        {
          subjectId: 's1',
          subjectName: 'ریاضی',
          date: '2026-11-02',
          startTime: '09:00',
          endTime: '10:00',
          type: 'study',
          ...(method === undefined ? {} : { method }),
        },
      ],
      summary: '',
    })

  it('روش معتبر را حفظ می‌کند', () => {
    expect(parseAndValidateStudyPlan(planWithMethod('practice'), '2026-11-01').sessions[0]?.method).toBe(
      'practice'
    )
  })

  it('اگر روش جا بیفتد، پیش‌فرض مطالعه می‌گذارد', () => {
    expect(parseAndValidateStudyPlan(planWithMethod(), '2026-11-01').sessions[0]?.method).toBe('reading')
  })

  it('روش ناشناخته را به پیش‌فرض تبدیل می‌کند و کل برنامه را رد نمی‌کند', () => {
    expect(
      parseAndValidateStudyPlan(planWithMethod('something_unknown'), '2026-11-01').sessions[0]?.method
    ).toBe('reading')
  })

  it('برچسب فارسی روش را به مقدار مجاز تبدیل می‌کند', () => {
    expect(parseAndValidateStudyPlan(planWithMethod('ویدیو'), '2026-11-01').sessions[0]?.method).toBe(
      'video'
    )
  })
})
