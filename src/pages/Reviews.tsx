import { useState, useEffect, useCallback, useMemo } from 'react'
import { RotateCcw, Check, Clock, Calendar, BookOpen, AlertCircle, Layers } from 'lucide-react'
import { ReviewService, SubjectService } from '@/services'
import type { Review } from '@/types/review'
import type { Subject } from '@/types/subject'
import { toPersianDate, daysUntil, getToday, toLocalDateKey } from '@/utils/date'
import { formatStatus } from '@/utils/format'
import { useToastStore } from '@/stores'
import { PageHeader, EmptyState, Loading } from '@/components/common/PageHeader'

type Filter = 'all' | 'today' | 'upcoming' | 'overdue'

export default function Reviews() {
  const toast = useToastStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      await ReviewService.checkOverdue()
      const [r, s] = await Promise.all([ReviewService.getAll(), SubjectService.getAll()])
      setReviews(r)
      setSubjects(s)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در بارگذاری مرورها')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const today = getToday()

  const filtered = useMemo(
    () =>
      reviews
        .filter((r) => {
          if (filter === 'all') return true
          if (filter === 'today') return r.scheduledDate === today && r.status === 'pending'
          if (filter === 'upcoming') return r.scheduledDate > today && r.status === 'pending'
          return r.status === 'overdue'
        })
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
    [reviews, filter, today]
  )

  const subjectOf = (id: string) => subjects.find((s) => s.id === id)

  const completeReview = async (id: string) => {
    try {
      await ReviewService.complete(id)
      toast.success('مرور تکمیل شد')
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در تکمیل مرور')
    }
  }

  const postponeReview = async (id: string) => {
    const r = reviews.find((x) => x.id === id)
    if (!r) return
    const d = new Date(`${r.scheduledDate}T12:00:00`)
    d.setDate(d.getDate() + 1)
    try {
      await ReviewService.postpone(id, toLocalDateKey(d))
      toast.info('مرور یک روز به تعویق افتاد')
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در تعویق مرور')
    }
  }

  const stats = useMemo(
    () => ({
      total: reviews.length,
      pending: reviews.filter((r) => r.status === 'pending').length,
      completed: reviews.filter((r) => r.status === 'completed').length,
      overdue: reviews.filter((r) => r.status === 'overdue').length,
      today: reviews.filter((r) => r.scheduledDate === today && r.status === 'pending').length,
    }),
    [reviews, today]
  )

  const statCards = [
    { v: stats.total, l: 'کل مرورها', tone: 'badge-primary', icon: Layers },
    { v: stats.pending, l: 'در انتظار', tone: 'badge-warning', icon: Clock },
    { v: stats.overdue, l: 'سررسید گذشته', tone: 'badge-destructive', icon: AlertCircle },
    { v: stats.completed, l: 'تکمیل‌شده', tone: 'badge-success', icon: Check },
    { v: stats.today, l: 'امروز', tone: 'badge-muted', icon: Calendar },
  ]

  const filters: { v: Filter; l: string; i: typeof BookOpen }[] = [
    { v: 'all', l: 'همه', i: BookOpen },
    { v: 'today', l: 'امروز', i: Clock },
    { v: 'upcoming', l: 'آینده', i: Calendar },
    { v: 'overdue', l: 'سررسید گذشته', i: AlertCircle },
  ]

  if (loading) return <Loading label="در حال بارگذاری مرورها..." />

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <PageHeader
        title="مرورها"
        subtitle="مرور فاصله‌دار (۱، ۳، ۷، ۱۴، ۳۰ روز) برای تثبیت مطالب"
        icon={RotateCcw}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={s.l}
              className="card animate-fadeInUp"
              style={{ padding: 16, textAlign: 'center', animationDelay: `${i * 50}ms` }}
            >
              <div
                className={`badge ${s.tone}`}
                style={{ width: 30, height: 30, borderRadius: 10, padding: 0, justifyContent: 'center', margin: '0 auto 8px' }}
              >
                <Icon size={14} />
              </div>
              <p className="tnum" style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                {s.v}
              </p>
              <p style={{ fontSize: 10.5, color: 'var(--color-muted-foreground)', margin: '2px 0 0' }}>{s.l}</p>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {filters.map((f) => {
          const Icon = f.i
          return (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`btn ${filter === f.v ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12 }}
            >
              <Icon size={13} /> {f.l}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={RotateCcw}
            title="مروری یافت نشد"
            description={
              filter === 'all'
                ? 'با تکمیل یک جلسه مطالعه، مرورهای فاصله‌دار آن به‌صورت خودکار ساخته می‌شوند.'
                : 'مروری در این دسته وجود ندارد.'
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((r, i) => {
            const subject = subjectOf(r.subjectId)
            const isToday = r.scheduledDate === today
            const isPast = r.scheduledDate < today
            const days = daysUntil(r.scheduledDate)
            const isDone = r.status === 'completed'
            const isOverdue = r.status === 'overdue'

            return (
              <div
                key={r.id}
                className="card animate-fadeInUp"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: 16,
                  animationDelay: `${Math.min(i, 8) * 35}ms`,
                  borderRight: `3px solid ${
                    isDone ? 'var(--color-success)' : isOverdue ? 'var(--color-destructive)' : subject?.color ?? 'var(--color-border)'
                  }`,
                  opacity: isDone ? 0.65 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      background: subject?.color ?? 'var(--color-muted)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {subject?.name.charAt(0) ?? '؟'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 800, fontSize: 13, margin: 0 }}>{subject?.name ?? 'نامشخص'}</p>
                      <span className="badge badge-primary">مرور {r.reviewNumber}</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--color-muted-foreground)', margin: '2px 0 0' }}>
                      {toPersianDate(r.scheduledDate)}
                      {!isDone && (
                        <span style={{ marginRight: 6 }}>
                          {isToday ? '(امروز)' : isPast ? `(${Math.abs(days)} روز پیش)` : `(${days} روز دیگر)`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className={`badge ${
                      isDone ? 'badge-success' : isOverdue ? 'badge-destructive' : isToday ? 'badge-warning' : 'badge-primary'
                    }`}
                  >
                    {formatStatus(r.status)}
                  </span>
                  {!isDone && (
                    <>
                      <button
                        onClick={() => completeReview(r.id)}
                        className="btn btn-primary"
                        style={{ fontSize: 11.5, padding: '6px 12px' }}
                      >
                        <Check size={12} /> تکمیل
                      </button>
                      <button
                        onClick={() => postponeReview(r.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: 11.5, padding: '6px 12px' }}
                      >
                        <Clock size={12} /> تعویق
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
