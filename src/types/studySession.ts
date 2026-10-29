import type { SessionType, Status } from './common'

/** منبع ساخت جلسه — برای اینکه بازتولید برنامه، جلسات دستی کاربر را پاک نکند */
export type SessionSource = 'manual' | 'ai'

/**
 * روش یادگیری هر جلسه — ورودی، پردازش، تثبیت یا بازیابی.
 * به AI اجازه می‌دهد صرفاً «مطالعه» را تکرار نکند و چرخه یادگیری بسازد.
 */
export type StudyMethod =
  | 'video'
  | 'reading'
  | 'summary'
  | 'practice'
  | 'flashcards'
  | 'recall'
  | 'teaching'
  | 'mock_exam'

/** رکورد جلسه مطالعه */
export interface StudySession {
  id: string
  subjectId: string
  date: string
  startTime: string
  endTime: string
  type: SessionType
  /** روش یادگیری — برای جلسات ساخته‌شده توسط AI پر می‌شود */
  method?: StudyMethod
  status: Status
  source: SessionSource
  notes?: string
  createdAt: string
}

/** فرم ایجاد جلسه */
export interface CreateStudySessionInput {
  subjectId: string
  date: string
  startTime: string
  endTime: string
  type: SessionType
  method?: StudyMethod
  source?: SessionSource
  notes?: string
}

/** فرم ویرایش جلسه */
export interface UpdateStudySessionInput extends Partial<CreateStudySessionInput> {
  status?: Status
}
