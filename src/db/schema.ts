import type { Table } from 'dexie'
import Dexie from 'dexie'
import type { Subject } from '@/types/subject'
import type { StudySession } from '@/types/studySession'
import type { Review } from '@/types/review'
import type { Exam } from '@/types/exam'
import type { UserSettings } from '@/types/settings'
import type { AIProviderConfig, ChatMessage } from '@/types/ai'

/**
 * Database Schema for AI Study Planner
 * تمام داده‌های کاربر در IndexedDB ذخیره می‌شود
 */
export class StudyPlannerDB extends Dexie {
  subjects!: Table<Subject>
  studySessions!: Table<StudySession>
  reviews!: Table<Review>
  exams!: Table<Exam>
  userSettings!: Table<UserSettings>
  aiProviders!: Table<AIProviderConfig>
  chatMessages!: Table<ChatMessage>

  constructor() {
    super('AIStudyPlanner')

    this.version(1).stores({
      // Store: subjects
      // Primary Key: id
      // Indexes: name, priority, examDate
      subjects: 'id, name, priority, examDate',

      // Store: studySessions
      // Primary Key: id
      // Indexes: subjectId, date, status
      studySessions: 'id, subjectId, date, status',

      // Store: reviews (v1 — بدون sessionId)
      reviews: 'id, subjectId, scheduledDate, status',

      // Store: exams
      // Primary Key: id
      // Indexes: subjectId, date
      exams: 'id, subjectId, date',

      // Store: userSettings
      // Primary Key: id (always 'main')
      // No additional indexes (single record)
      userSettings: 'id',

      // Store: aiProviders
      // Primary Key: id
      // Indexes: type, isActive
      aiProviders: 'id, type, isActive',

      // Store: chatMessages
      // Primary Key: id
      // Indexes: timestamp
      chatMessages: 'id, timestamp',
    })

    // v2: اضافه شدن ایندکس sessionId برای کوئری getBySession
    this.version(2).stores({
      subjects: 'id, name, priority, examDate',
      studySessions: 'id, subjectId, date, status',
      reviews: 'id, subjectId, sessionId, scheduledDate, status',
      exams: 'id, subjectId, date',
      userSettings: 'id',
      aiProviders: 'id, type, isActive',
      chatMessages: 'id, timestamp',
    })

    // v3: فیلد source روی جلسات — جلسات قدیمی «manual» در نظر گرفته می‌شوند
    // تا بازتولید برنامه AI آن‌ها را پاک نکند.
    this.version(3)
      .stores({
        subjects: 'id, name, priority, examDate',
        studySessions: 'id, subjectId, date, status, source',
        reviews: 'id, subjectId, sessionId, scheduledDate, status',
        exams: 'id, subjectId, date',
        userSettings: 'id',
        aiProviders: 'id, type, isActive',
        chatMessages: 'id, timestamp',
      })
      .upgrade(async (tx) => {
        await tx
          .table('studySessions')
          .toCollection()
          .modify((session: { source?: string }) => {
            if (!session.source) session.source = 'manual'
          })
      })
  }
}

/** نمونه singleton از Database */
export const db = new StudyPlannerDB()
