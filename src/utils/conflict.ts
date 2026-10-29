import type { StudySession } from '@/types/studySession'
import { hasTimeConflict } from './date'

/** نوع تداخل */
export type ConflictType = 'time' | 'subject'

/** اطلاعات تداخل */
export interface ConflictInfo {
  type: ConflictType
  session1: StudySession
  session2: StudySession
  message: string
}

/**
 * بررسی تداخل زمانی بین دو جلسه
 */
export function checkTimeConflict(
  session1: StudySession,
  session2: StudySession
): ConflictInfo | null {
  // اگر تاریخ‌ها متفاوت باشند، تداخلی وجود ندارد
  if (session1.date !== session2.date) return null

  // بررسی همپوشانی زمانی
  if (
    hasTimeConflict(
      session1.startTime,
      session1.endTime,
      session2.startTime,
      session2.endTime
    )
  ) {
    return {
      type: 'time',
      session1,
      session2,
      message: `تداخل زمانی: جلسه ${session1.startTime} تا ${session1.endTime} با جلسه ${session2.startTime} تا ${session2.endTime} در تاریخ ${session1.date}`,
    }
  }

  return null
}

/**
 * بررسی تداخل بین یک جلسه جدید و جلسات موجود
 */
export function findConflicts(
  newSession: StudySession,
  existingSessions: StudySession[]
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = []

  for (const existing of existingSessions) {
    // خود جلسه را بررسی نکن
    if (existing.id === newSession.id) continue

    const conflict = checkTimeConflict(newSession, existing)
    if (conflict) {
      conflicts.push(conflict)
    }
  }

  return conflicts
}

/**
 * بررسی تداخل در لیست جلسات
 */
export function findAllConflicts(sessions: StudySession[]): ConflictInfo[] {
  const conflicts: ConflictInfo[] = []

  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const conflict = checkTimeConflict(sessions[i]!, sessions[j]!)
      if (conflict) {
        conflicts.push(conflict)
      }
    }
  }

  return conflicts
}
