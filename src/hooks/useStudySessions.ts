import { useState, useEffect, useCallback } from 'react'
import { StudySessionService } from '@/services'
import type { StudySession } from '@/types/studySession'

/** Hook جلسات مطالعه — لایه واسط بین Component و Service */
export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setSessions(await StudySessionService.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری جلسات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { sessions, loading, error, refresh: load }
}
