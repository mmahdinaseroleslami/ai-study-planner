import { describe, expect, it } from 'vitest'
import type { StudyPlanInput } from '@/types/ai'
import { buildStudyPlanPrompt } from '@/utils/studyPlanPrompt'

const input: StudyPlanInput = {
  subjectIds: ['s1', 's2'],
  subjectNames: { s1: 'ریاضی', s2: 'زیست' },
  availableHours: { start: '08:00', end: '20:00' },
  startDate: '2026-11-01',
  endDate: '2026-11-14',
  preferences: {
    type: 'distributed',
    minSessionDuration: 30,
    maxSessionDuration: 90,
    breakDuration: 10,
  },
  exams: [{ subjectId: 's2', date: '2026-11-12' }],
  studyMethods: ['video', 'practice', 'recall'],
  methodNote: 'اول ویدیو، بعد تمرین',
  strengths: 'ریاضی پایه قوی',
  weaknesses: 'حل مسئله کند',
}

describe('buildStudyPlanPrompt', () => {
  it('روش‌ها، ترتیب دلخواه و نقاط قوت/ضعف را صریح به مدل می‌دهد', () => {
    const prompt = buildStudyPlanPrompt(input)

    expect(prompt).toContain('ویدیو (video)')
    expect(prompt).toContain('تمرین (practice)')
    expect(prompt).toContain('بازیابی فعال (recall)')
    expect(prompt).toContain('اول ویدیو، بعد تمرین')
    expect(prompt).toContain('ریاضی پایه قوی')
    expect(prompt).toContain('حل مسئله کند')
  })

  it('اصول شواهدمحور و فیلد method را در خروجی الزامی می‌کند', () => {
    const prompt = buildStudyPlanPrompt(input)

    expect(prompt).toContain('Retrieval practice')
    expect(prompt).toContain('Spaced repetition')
    expect(prompt).toContain('Interleaving')
    expect(prompt).toContain('Deliberate practice')
    expect(prompt).toContain('"method"')
    expect(prompt).toContain('mock_exam')
  })

  it('شناسه دروس، بازه و امتحان را در پرامپت می‌آورد', () => {
    const prompt = buildStudyPlanPrompt(input)

    expect(prompt).toContain('(subjectId: s1)')
    expect(prompt).toContain('از 2026-11-01 تا 2026-11-14')
    expect(prompt).toContain('زیست: 2026-11-12')
  })
})
