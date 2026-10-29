import type { StudyMethod } from './studySession'

/** نوع AI Provider */
export type AIProviderType = 'gemini' | 'groq' | 'openrouter' | 'custom'

/** تنظیمات AI Provider */
export interface AIProviderConfig {
  id: string
  name: string
  type: AIProviderType
  apiKey: string
  baseUrl?: string
  model?: string
  isActive: boolean
  createdAt: string
}

/** ورودی تولید برنامه */
export interface StudyPlanInput {
  subjectIds: string[]
  /** نگاشت شناسه به نام — بدون این، مدل نام درس را نمی‌داند */
  subjectNames: Record<string, string>
  availableHours: {
    start: string
    end: string
  }
  startDate: string
  endDate: string
  preferences: StudyPreferences
  exams: ExamInput[]
  /** روش‌هایی که کاربر می‌خواهد AI از آن‌ها استفاده کند */
  studyMethods: StudyMethod[]
  /** ترتیب یا توضیح دلخواه کاربر درباره چیدمان فعالیت‌ها */
  methodNote: string
  /** نقاط قوت یادگیرنده — برای صرفه‌جویی در زمان و چالش بیشتر */
  strengths: string
  /** نقاط ضعف یادگیرنده — برای تمرین هدفمندتر */
  weaknesses: string
}

/** ترجیحات مطالعه */
export type StudyPreference = 'focused' | 'distributed'
export interface StudyPreferences {
  type: StudyPreference
  minSessionDuration: number
  maxSessionDuration: number
  breakDuration: number
}

/** ورودی امتحان */
export interface ExamInput {
  subjectId: string
  date: string
}

/** جلسه پیشنهادی AI */
export interface AISessionProposal {
  subjectId: string
  subjectName: string
  /** تاریخ مطلق YYYY-MM-DD — نه نام روز */
  date: string
  startTime: string
  endTime: string
  type: 'study' | 'review'
  /** ورودی، پردازش، تثبیت یا بازیابی — AI باید هر جلسه را تفکیک کند */
  method: StudyMethod
}

/** برنامه پیشنهادی AI */
export interface StudyPlanProposal {
  sessions: AISessionProposal[]
  summary: string
}

/** Interface مشترک Provider */
export interface AIProvider {
  name: string
  type: AIProviderType
  generateStudyPlan(data: StudyPlanInput): Promise<StudyPlanProposal>
  chat(messages: ChatMessage[], context: StudyContext): Promise<string>
  validateApiKey(apiKey: string): Promise<boolean>
}

/** پیام چت */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  createdAt: string
}

/** Context چت */
export interface StudyContext {
  todaySchedule: string
  weekSchedule: string
  subjects: string
  exams: string
  reviews: string
}
