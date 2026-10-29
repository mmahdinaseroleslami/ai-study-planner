import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, AlertCircle, Clock } from 'lucide-react'
import { StudySessionService, SubjectService, ExamService } from '@/services'
import type { StudySession } from '@/types/studySession'
import type { Subject } from '@/types/subject'
import type { Exam } from '@/types/exam'
import { WEEK_DAYS } from '@/constants/ui'
import { toLocalDateKey, getToday, calculateDuration, toPersianDate } from '@/utils/date'
import { formatStudyMethod, toPersianDigits } from '@/utils/format'
import { useToastStore } from '@/stores'
import { PageHeader, Loading } from '@/components/common/PageHeader'

export default function MonthlyCalendar() {
  const toast = useToastStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear()
    const m = currentMonth.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const startDay = (first.getDay() + 1) % 7 // شنبه‌محور
    const days: (Date | null)[] = []
    for (let i = 0; i < startDay; i++) days.push(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d))
    return days
  }, [currentMonth])

  // شبکه تقویم میلادی است، پس عنوان هم باید ماه میلادی باشد (نه شمسی)،
  // وگرنه عنوان و روزهای داخل شبکه با هم نمی‌خوانند.
  const monthName = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', {
    month: 'long',
    year: 'numeric',
  }).format(currentMonth)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const y = currentMonth.getFullYear()
      const m = currentMonth.getMonth()
      const start = toLocalDateKey(new Date(y, m, 1))
      const end = toLocalDateKey(new Date(y, m + 1, 0))
      const [sess, sub, ex] = await Promise.all([
        StudySessionService.getByDateRange(start, end),
        SubjectService.getAll(),
        ExamService.getAll(),
      ])
      setSessions(sess)
      setSubjects(sub)
      setExams(ex)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در بارگذاری تقویم')
    } finally {
      setLoading(false)
    }
  }, [currentMonth, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // تغییر ماه از روز اول انجام می‌شود تا روزهای ۲۹–۳۱ باعث پرش ماه نشوند
  // (مثلاً ۳۱ مارس + یک ماه نباید به ۳۱ آوریل/مه بپرد).
  const shiftMonth = (delta: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
    setSelectedDate(null)
  }
  const prevMonth = () => shiftMonth(-1)
  const nextMonth = () => shiftMonth(1)
  const goToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(null)
  }

  const today = getToday()
  const subjectOf = (id: string) => subjects.find((s) => s.id === id)

  const daySessions = (ds: string) => sessions.filter((s) => s.date === ds)
  const dayExams = (ds: string) => exams.filter((e) => e.date === ds)

  const dayHours = (ds: string) => {
    const total = daySessions(ds).reduce((acc, s) => acc + Math.max(0, calculateDuration(s.startTime, s.endTime)), 0)
    return Math.round((total / 60) * 10) / 10
  }

  const selectedSessions = useMemo(
    () =>
      selectedDate ? sessions.filter((s) => s.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime)) : [],
    [sessions, selectedDate]
  )
  const selectedExams = useMemo(
    () => (selectedDate ? exams.filter((e) => e.date === selectedDate) : []),
    [exams, selectedDate]
  )

  const monthMinutes = sessions.reduce((acc, s) => acc + Math.max(0, calculateDuration(s.startTime, s.endTime)), 0)

  if (loading) return <Loading label="در حال بارگذاری تقویم..." />

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="تقویم ماهانه"
        subtitle={`${monthName} · ${toPersianDigits(Math.round((monthMinutes / 60) * 10) / 10)} ساعت مطالعه`}
        icon={Calendar}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={goToday} className="btn btn-secondary" style={{ fontSize: 12 }}>
              امروز
            </button>
            <button onClick={prevMonth} className="btn btn-ghost" style={{ padding: 8 }} aria-label="ماه قبل">
              <ChevronRight size={18} />
            </button>
            <button onClick={nextMonth} className="btn btn-ghost" style={{ padding: 8 }} aria-label="ماه بعد">
              <ChevronLeft size={18} />
            </button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16 }} className="month-grid">
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {WEEK_DAYS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  padding: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-muted-foreground)',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`e-${i}`} style={{ minHeight: 78 }} />
              const ds = toLocalDateKey(date)
              const isToday = ds === today
              const isSel = ds === selectedDate
              const sess = daySessions(ds)
              const ex = dayExams(ds)
              const hours = dayHours(ds)
              const hasReview = sess.some((s) => s.type === 'review')
              const hasStudy = sess.some((s) => s.type === 'study')

              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  className="day-cell"
                  style={{
                    padding: 7,
                    minHeight: 78,
                    borderRadius: 11,
                    border: `1px solid ${
                      isSel
                        ? 'var(--color-primary)'
                        : isToday
                          ? 'color-mix(in srgb, var(--color-primary) 35%, transparent)'
                          : 'var(--color-border)'
                    }`,
                    background: isSel
                      ? 'var(--color-primary-light)'
                      : isToday
                        ? 'color-mix(in srgb, var(--color-primary) 6%, var(--color-card))'
                        : 'var(--color-card)',
                    textAlign: 'right',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 160ms var(--ease-out-quint)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      className="tnum"
                      style={{
                        fontSize: 12,
                        fontWeight: isToday ? 900 : 600,
                        color: isToday ? 'var(--color-primary)' : 'var(--color-foreground)',
                      }}
                    >
                      {toPersianDigits(date.getDate())}
                    </span>
                    {hours > 0 && (
                      <span className="tnum" style={{ fontSize: 9, color: 'var(--color-muted-foreground)' }}>
                        {toPersianDigits(hours)}س
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {ex.length > 0 && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-destructive)' }} />
                    )}
                    {hasReview && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-warning)' }} />
                    )}
                    {hasStudy && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-primary)' }} />
                    )}
                  </div>

                  {sess.length > 0 && (
                    <span style={{ fontSize: 9.5, color: 'var(--color-muted-foreground)', marginTop: 'auto' }}>
                      {toPersianDigits(sess.length)} جلسه
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {[
              { c: 'var(--color-primary)', l: 'مطالعه' },
              { c: 'var(--color-warning)', l: 'مرور' },
              { c: 'var(--color-destructive)', l: 'امتحان' },
            ].map((item) => (
              <div
                key={item.l}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: 'var(--color-muted-foreground)',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.c }} />
                {item.l}
              </div>
            ))}
          </div>
        </div>

        {/* پنل روز */}
        <div className="card" style={{ position: 'sticky', top: 84, alignSelf: 'start' }}>
          {selectedDate ? (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>{toPersianDate(selectedDate)}</h3>

              {selectedExams.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <h4
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      color: 'var(--color-destructive)',
                    }}
                  >
                    <AlertCircle size={12} /> امتحانات
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {selectedExams.map((ex) => (
                      <div
                        key={ex.id}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 9,
                          background: 'var(--color-destructive-light)',
                          color: 'var(--color-destructive)',
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        {subjectOf(ex.subjectId)?.name ?? 'نامشخص'}
                        {ex.time ? ` — ${ex.time}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSessions.length > 0 ? (
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 800, marginBottom: 8 }}>جلسات</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedSessions.map((s) => {
                      const subject = subjectOf(s.subjectId)
                      return (
                        <div
                          key={s.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                            padding: '8px 10px',
                            borderRadius: 9,
                            background: 'var(--color-muted)',
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: subject?.color ?? 'var(--color-border-strong)',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 11.5,
                                fontWeight: 600,
                                margin: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {subject?.name ?? 'نامشخص'}
                            </p>
                            <p
                              className="tnum"
                              style={{ fontSize: 10, color: 'var(--color-muted-foreground)', margin: 0 }}
                            >
                              {s.startTime} - {s.endTime}
                              {s.method ? ` · ${formatStudyMethod(s.method)}` : ''}
                            </p>
                          </div>
                          {s.type === 'review' && (
                            <RotateCcw size={11} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 11.5, color: 'var(--color-muted-foreground)' }}>جلسه‌ای ثبت نشده</p>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-muted-foreground)' }}>
              <Calendar size={34} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
              <p style={{ fontSize: 11.5 }}>روزی را انتخاب کنید</p>
              <p style={{ fontSize: 10.5, opacity: 0.7, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Clock size={10} /> جزئیات روز اینجا نمایش داده می‌شود
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .month-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
