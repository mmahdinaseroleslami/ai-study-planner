import type { Theme, Language } from './common'
import type { StudyPreference } from './ai'

/** تنظیمات کاربر */
export interface UserSettings {
  id: string
  theme: Theme
  language: Language
  defaultStudyDuration: number
  breakDuration: number
  activeAiProvider: string
  availableHours: {
    start: string
    end: string
  }
  weekDaysOff: number[]
  studyPreference: StudyPreference
  updatedAt: string
}

/** تنظیمات پیش‌فرض */
export const DEFAULT_SETTINGS: UserSettings = {
  id: 'main',
  theme: 'system',
  language: 'fa',
  defaultStudyDuration: 60,
  breakDuration: 10,
  activeAiProvider: '',
  availableHours: {
    start: '08:00',
    end: '20:00',
  },
  weekDaysOff: [6], // جمعه
  studyPreference: 'distributed',
  updatedAt: new Date().toISOString(),
}
