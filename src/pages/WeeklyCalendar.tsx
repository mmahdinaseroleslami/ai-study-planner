import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Edit3, Calendar, Check, X, Clock } from 'lucide-react'
import { StudySessionService, SubjectService } from '@/services'
import type { StudySession } from '@/types/studySession'
import type { Subject } from '@/types/subject'
import type { CreateStudySessionInput } from '@/types'
import { WEEK_DAYS } from '@/constants/ui'
import { getWeekStart, getWeekEnd, toPersianShortDate, toLocalDateKey, getToday, calculateDuration } from '@/utils/date'
import { validateStudySession } from '@/utils/validation'
import { findConflicts } from '@/utils/conflict'
import { formatStudyMethod } from '@/utils/format'
import { useToastStore } from '@/stores'
import { PageHeader, Loading } from '@/components/common/PageHeader'
import { Modal } from '@/components/common/Modal'

export default function WeeklyCalendar() {
  const toast = useToastStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<StudySession | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CreateStudySessionInput>({
    subjectId: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'study',
  })

  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate])
  const weekEnd = useMemo(() => getWeekEnd(currentDate), [currentDate])
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return d
      }),
    [weekStart]
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sess, sub] = await Promise.all([
        StudySessionService.getByDateRange(toLocalDateKey(weekStart), toLocalDateKey(weekEnd)),
        SubjectService.getAll(),
      ])
      setSessions(sess)
      setSubjects(sub)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در بارگذاری تقویم')
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const prevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }
  const nextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }
  const goToday = () => setCurrentDate(new Date())

  const today = getToday()
  const getSessionsForDate = (date: Date) => {
    const ds = toLocalDateKey(date)
    return sessions.filter((s) => s.date === ds).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  const subjectOf = (id: string) => subjects.find((s) => s.id === id)

  const openForm = (date?: Date, session?: StudySession) => {
    setFormError(null)
    if (session) {
      setEditingSession(session)
      setFormData({
        subjectId: session.subjectId,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        type: session.type,
      })
    } else {
      setEditingSession(null)
      setFormData({
        subjectId: subjects[0]?.id ?? '',
        date: date ? toLocalDateKey(date) : today,
        startTime: '09:00',
        endTime: '10:00',
        type: 'study',
      })
    }
    setShowForm(true)
  }

  const saveForm = async () => {
    setFormError(null)
    const validation = validateStudySession(formData)
    if (!validation.isValid) {
      setFormError(validation.errors[0]?.message ?? 'ورودی نامعتبر است')
      return
    }

    const candidate = {
      id: editingSession?.id ?? 'new',
      ...formData,
      status: 'pending',
      source: editingSession?.source ?? 'manual',
      createdAt: new Date().toISOString(),
    } as StudySession

    setSaving(true)
    try {
      // فرم اجازه انتخاب هر تاریخی را می‌دهد، نه فقط روزهای همین هفته؛
      // پس تداخل باید با جلسات همان روزِ انتخاب‌شده بررسی شود.
      const sameDaySessions = await StudySessionService.getByDate(formData.date)
      const conflicts = findConflicts(candidate, sameDaySessions)
      if (conflicts.length > 0) {
        const proceed = confirm(
          `این جلسه با ${conflicts.length} جلسه دیگر تداخل زمانی دارد. باز هم ذخیره شود؟`
        )
        if (!proceed) return
      }

      if (editingSession) {
        await StudySessionService.update(editingSession.id, formData)
        toast.success('جلسه ویرایش شد')
      } else {
        await StudySessionService.create(formData)
        toast.success('جلسه جدید اضافه شد')
      }
      setShowForm(false)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ذخیره جلسه'
      setFormError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const deleteSession = async (id: string) => {
    if (!confirm('این جلسه حذف شود؟')) return
    try {
      await StudySessionService.delete(id)
      toast.success('جلسه حذف شد')
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف جلسه')
    }
  }

  const completeSession = async (id: string) => {
    try {
      await StudySessionService.complete(id)
      toast.success('جلسه تکمیل شد و مرورهای آن ساخته شدند')
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در تکمیل جلسه')
    }
  }

  const weekMinutes = sessions.reduce((acc, s) => acc + Math.max(0, calculateDuration(s.startTime, s.endTime)), 0)

  if (loading) return <Loading label="در حال بارگذاری تقویم..." />

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="تقویم هفتگی"
        subtitle={`${toPersianShortDate(weekStart)} تا ${toPersianShortDate(weekEnd)} · ${Math.round((weekMinutes / 60) * 10) / 10} ساعت`}
        icon={Calendar}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={goToday} className="btn btn-secondary" style={{ fontSize: 12 }}>
              امروز
            </button>
            <button onClick={prevWeek} className="btn btn-ghost" style={{ padding: 8 }} aria-label="هفته قبل">
              <ChevronRight size={18} />
            </button>
            <button onClick={nextWeek} className="btn btn-ghost" style={{ padding: 8 }} aria-label="هفته بعد">
              <ChevronLeft size={18} />
            </button>
          </div>
        }
      />

      <div style={{ overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(132px, 1fr))', gap: 8, minWidth: 940 }}>
          {/* سرستون‌ها */}
          {WEEK_DAYS.map((day, i) => {
            const date = weekDays[i]
            const isToday = date ? toLocalDateKey(date) === today : false
            return (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  padding: '10px 6px',
                  borderRadius: 12,
                  background: isToday ? 'var(--color-primary-light)' : 'var(--color-card)',
                  border: `1px solid ${isToday ? 'var(--color-primary)' : 'var(--color-border)'}`,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: isToday ? 800 : 600,
                    margin: 0,
                    color: isToday ? 'var(--color-primary)' : 'var(--color-foreground)',
                  }}
                >
                  {day}
                </p>
                <p
                  className="tnum"
                  style={{
                    fontSize: 10.5,
                    margin: '2px 0 0',
                    color: isToday ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                    opacity: isToday ? 0.85 : 1,
                  }}
                >
                  {date ? toPersianShortDate(date) : ''}
                </p>
              </div>
            )
          })}

          {/* ستون‌های روز */}
          {weekDays.map((date, di) => {
            const daySessions = getSessionsForDate(date)
            const isToday = toLocalDateKey(date) === today
            return (
              <div
                key={di}
                style={{
                  background: isToday ? 'var(--color-primary-light)' : 'var(--color-card)',
                  border: `1px solid ${isToday ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'var(--color-border)'}`,
                  borderRadius: 12,
                  padding: 8,
                  minHeight: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <button
                  onClick={() => openForm(date)}
                  style={{
                    width: '100%',
                    padding: 7,
                    borderRadius: 9,
                    border: '1px dashed var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-muted-foreground)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontFamily: 'inherit',
                    transition: 'all 160ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)'
                    e.currentTarget.style.color = 'var(--color-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.color = 'var(--color-muted-foreground)'
                  }}
                >
                  <Plus size={12} /> افزودن
                </button>

                {daySessions.map((session) => {
                  const subject = subjectOf(session.subjectId)
                  const color = subject?.color ?? 'var(--color-border-strong)'
                  return (
                    <div
                      key={session.id}
                      className="group"
                      style={{
                        padding: '8px 9px',
                        borderRadius: 9,
                        background: color,
                        color: 'white',
                        fontSize: 11,
                        position: 'relative',
                        opacity: session.status === 'completed' ? 0.55 : 1,
                        boxShadow: `0 3px 10px -4px ${color}`,
                      }}
                    >
                      <p className="tnum" style={{ fontWeight: 700, margin: 0, fontSize: 10.5 }}>
                        {session.startTime} - {session.endTime}
                      </p>
                      <p
                        style={{
                          margin: '1px 0 0',
                          opacity: 0.92,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {subject?.name ?? 'نامشخص'}
                      </p>
                      {(session.type === 'review' || session.method) && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                          {session.type === 'review' && (
                            <span
                              style={{
                                fontSize: 9,
                                background: 'rgba(255,255,255,0.24)',
                                padding: '0 5px',
                                borderRadius: 4,
                                display: 'inline-block',
                              }}
                            >
                              مرور
                            </span>
                          )}
                          {session.method && (
                            <span
                              style={{
                                fontSize: 9,
                                background: 'rgba(255,255,255,0.18)',
                                padding: '0 5px',
                                borderRadius: 4,
                                display: 'inline-block',
                              }}
                            >
                              {formatStudyMethod(session.method)}
                            </span>
                          )}
                        </div>
                      )}
                      {session.status === 'completed' && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.3)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Check size={9} />
                        </span>
                      )}

                      <div
                        className="group-actions"
                        style={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          display: 'flex',
                          gap: 3,
                          opacity: 0,
                          transition: 'opacity 160ms ease',
                        }}
                      >
                        {session.status !== 'completed' && (
                          <IconBtn label="تکمیل" onClick={() => completeSession(session.id)}>
                            <Check size={10} />
                          </IconBtn>
                        )}
                        <IconBtn label="ویرایش" onClick={() => openForm(date, session)}>
                          <Edit3 size={10} />
                        </IconBtn>
                        <IconBtn label="حذف" danger onClick={() => deleteSession(session.id)}>
                          <X size={10} />
                        </IconBtn>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        open={showForm}
        title={editingSession ? 'ویرایش جلسه' : 'جلسه جدید'}
        subtitle={editingSession ? 'زمان یا درس جلسه را تغییر دهید' : 'یک جلسه مطالعه به تقویم اضافه کنید'}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <button onClick={saveForm} className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              <Check size={15} /> ذخیره
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">
              انصراف
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {formError && (
            <div
              style={{
                padding: '10px 13px',
                borderRadius: 10,
                background: 'var(--color-destructive-light)',
                color: 'var(--color-destructive)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {formError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>درس</label>
            <select
              className="input"
              value={formData.subjectId}
              onChange={(e) => setFormData((p) => ({ ...p, subjectId: e.target.value }))}
            >
              <option value="">انتخاب درس</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>تاریخ</label>
            <input
              type="date"
              className="input"
              value={formData.date}
              onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                <Clock size={12} /> شروع
              </label>
              <input
                type="time"
                className="input"
                value={formData.startTime}
                onChange={(e) => setFormData((p) => ({ ...p, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                <Clock size={12} /> پایان
              </label>
              <input
                type="time"
                className="input"
                value={formData.endTime}
                onChange={(e) => setFormData((p) => ({ ...p, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>نوع</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: 'study' as const, l: 'مطالعه' },
                { v: 'review' as const, l: 'مرور' },
              ].map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, type: t.v }))}
                  className={`btn ${formData.type === t.v ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        .group:hover .group-actions { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

function IconBtn(props: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      title={props.label}
      aria-label={props.label}
      style={{
        width: 18,
        height: 18,
        borderRadius: 5,
        border: 'none',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        background: props.danger ? 'rgba(239,68,68,0.75)' : 'rgba(255,255,255,0.28)',
        color: 'white',
      }}
    >
      {props.children}
    </button>
  )
}
