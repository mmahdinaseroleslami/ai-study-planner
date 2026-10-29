import { useState, useEffect, useCallback } from 'react'
import { ReviewService } from '@/services'
import type { Review } from '@/types/review'

/** Hook مرورها (Spaced Repetition) */
export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await ReviewService.checkOverdue()
      setReviews(await ReviewService.getAll())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری مرورها')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { reviews, loading, error, refresh: load }
}
