import { useState, useEffect, useCallback } from 'react'
import { ExamService } from '@/services'
import type { Exam } from '@/types/exam'

/** Hook امتحانات */
export function useExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setExams(await ExamService.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری امتحانات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { exams, loading, error, refresh: load }
}
