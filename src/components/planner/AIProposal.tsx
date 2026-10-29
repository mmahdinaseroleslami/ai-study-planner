import { CheckCircle2, Loader2, ArrowRight, CalendarDays, Clock } from 'lucide-react'
import type { StudyPlanProposal } from '@/types/ai'
import type { Subject } from '@/types/subject'
import { toPersianDate, getDayName, calculateDuration } from '@/utils/date'
import { formatStudyMethod } from '@/utils/format'

/** نمایش برنامه پیشنهادی AI + تأیید کاربر */
export function AIProposal(props: {
  proposal: StudyPlanProposal
  loading: boolean
  subjects: Subject[]
  onBack: () => void
  onSave: () => void
  onReject: () => void
}) {
  const { proposal, loading, subjects } = props

  const colorOf = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.color ?? 'var(--color-primary)'

  const totalMinutes = proposal.sessions.reduce(
    (acc, s) => acc + Math.max(0, calculateDuration(s.startTime, s.endTime)),
    0
  )

  // گروه‌بندی بر اساس تاریخ
  const byDate = new Map<string, typeof proposal.sessions>()
  for (const s of proposal.sessions) {
    const list = byDate.get(s.date) ?? []
    list.push(s)
    byDate.set(s.date, list)
  }
  const dates = [...byDate.keys()].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-card-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 22,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>برنامه پیشنهادی</h2>
            <p style={{ fontSize: 11.5, color: 'var(--color-muted-foreground)', margin: '3px 0 0' }}>
              {proposal.sessions.length} جلسه در {dates.length} روز — مجموع {Math.round((totalMinutes / 60) * 10) / 10} ساعت
            </p>
          </div>
          <button onClick={props.onBack} className="btn btn-secondary" style={{ fontSize: 12 }}>
            <ArrowRight size={14} /> بازگشت
          </button>
        </div>

        {proposal.summary && (
          <div
            style={{
              padding: 13,
              borderRadius: 12,
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              marginBottom: 18,
              fontSize: 12.5,
              lineHeight: 1.85,
              fontWeight: 500,
            }}
          >
            {proposal.summary}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dates.map((date) => {
            const daySessions = (byDate.get(date) ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime))
            return (
              <div key={date}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  <CalendarDays size={14} />
                  {getDayName(date)}
                  <span style={{ opacity: 0.6 }}>·</span>
                  <span style={{ fontWeight: 500 }}>{toPersianDate(date)}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {daySessions.map((s, i) => {
                    const color = colorOf(s.subjectId)
                    const mins = calculateDuration(s.startTime, s.endTime)
                    return (
                      <div
                        key={`${date}-${i}`}
                        className="lift"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '11px 14px',
                          borderRadius: 12,
                          background: 'var(--color-muted)',
                          borderRight: `3px solid ${color}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 9,
                              background: color,
                              display: 'grid',
                              placeItems: 'center',
                              color: 'white',
                              fontSize: 11,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={{
                                fontWeight: 700,
                                fontSize: 12.5,
                                margin: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {s.subjectName}
                            </p>
                            <p
                              className="tnum"
                              style={{
                                fontSize: 11,
                                color: 'var(--color-muted-foreground)',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                              }}
                            >
                              <Clock size={10} /> {s.startTime} — {s.endTime}
                              <span style={{ opacity: 0.6 }}>·</span>
                              {mins} دقیقه
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <span className={`badge ${s.type === 'review' ? 'badge-warning' : 'badge-primary'}`}>
                            {s.type === 'review' ? 'مرور' : 'مطالعه'}
                          </span>
                          <span className="badge badge-muted">{formatStudyMethod(s.method)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={props.onSave}
          disabled={loading}
          className="btn btn-primary"
          style={{
            flex: 1,
            padding: '13px',
            fontSize: 14,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 6px 22px -6px rgba(16, 185, 129, 0.5)',
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin-slow" /> ذخیره...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} /> تأیید و ذخیره برنامه
            </>
          )}
        </button>
        <button onClick={props.onReject} className="btn btn-secondary" style={{ padding: '13px 26px', fontSize: 14 }}>
          رد کردن
        </button>
      </div>
    </div>
  )
}
