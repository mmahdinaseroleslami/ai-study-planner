import { useState } from 'react'
import { Plus, Edit3, Trash2, BookOpen, Check, Palette, CalendarClock, Gauge } from 'lucide-react'
import { useSubjects } from '@/hooks'
import { formatPriority } from '@/utils/format'
import { toPersianDate, daysUntil } from '@/utils/date'
import type { CreateSubjectInput, Priority } from '@/types'
import { SUBJECT_COLORS } from '@/constants/ui'
import { validateSubject } from '@/utils/validation'
import { useToastStore } from '@/stores'
import { PageHeader, EmptyState, Loading } from '@/components/common/PageHeader'
import { Modal } from '@/components/common/Modal'

const emptyForm = (): CreateSubjectInput => ({
  name: '',
  color: SUBJECT_COLORS[0]!,
  priority: 'medium',
  difficulty: 3,
  weeklyHours: 5,
  examDate: undefined,
})

export default function Subjects() {
  const { subjects, loading, createSubject, updateSubject, deleteSubject } = useSubjects()
  const toast = useToastStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateSubjectInput>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setFormData(emptyForm())
    setEditingId(null)
    setFormError(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const validation = validateSubject(formData)
    if (!validation.isValid) {
      setFormError(validation.errors[0]?.message ?? 'ورودی نامعتبر است')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateSubject(editingId, formData)
        toast.success('درس با موفقیت ویرایش شد')
      } else {
        await createSubject(formData)
        toast.success('درس جدید اضافه شد')
      }
      resetForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ذخیره درس'
      setFormError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (id: string) => {
    const subject = subjects.find((s) => s.id === id)
    if (!subject) return
    setFormData({
      name: subject.name,
      color: subject.color,
      priority: subject.priority,
      difficulty: subject.difficulty,
      weeklyHours: subject.weeklyHours,
      examDate: subject.examDate,
    })
    setEditingId(id)
    setFormError(null)
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`درس «${name}» و تمام جلسات، مرورها و امتحان‌های مرتبط با آن حذف می‌شود. مطمئن هستید؟`)) return
    try {
      await deleteSubject(id)
      toast.success('درس و داده‌های مرتبط حذف شد')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف درس')
    }
  }

  if (loading) return <Loading label="در حال بارگذاری دروس..." />

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 1180, margin: '0 auto' }}>
      <PageHeader
        title="دروس"
        subtitle={`${subjects.length} درس ثبت شده`}
        icon={BookOpen}
        actions={
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> درس جدید
          </button>
        }
      />

      {subjects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="هنوز درسی ندارید"
            description="اولین درس خود را اضافه کنید تا برنامه‌ریزی را شروع کنیم."
            action={
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={15} /> اضافه کردن درس
              </button>
            }
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {subjects.map((subject, index) => {
            const days = subject.examDate ? daysUntil(subject.examDate) : null
            return (
              <div
                key={subject.id}
                className="card card-hover animate-fadeInUp group"
                style={{ animationDelay: `${index * 45}ms`, padding: 0, overflow: 'hidden', position: 'relative' }}
              >
                <div style={{ height: 4, background: subject.color }} />
                <div style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: subject.color,
                          display: 'grid',
                          placeItems: 'center',
                          color: 'white',
                          fontSize: 15,
                          fontWeight: 800,
                          flexShrink: 0,
                          boxShadow: `0 5px 16px -5px ${subject.color}`,
                        }}
                      >
                        {subject.name.charAt(0)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3
                          style={{
                            fontWeight: 800,
                            fontSize: 13.5,
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {subject.name}
                        </h3>
                        <p style={{ fontSize: 11, color: 'var(--color-muted-foreground)', margin: 0 }}>
                          {subject.weeklyHours} ساعت در هفته
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button
                        onClick={() => startEdit(subject.id)}
                        aria-label="ویرایش"
                        className="btn btn-ghost"
                        style={{ padding: 6, borderRadius: 8 }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id, subject.name)}
                        aria-label="حذف"
                        className="btn btn-ghost"
                        style={{ padding: 6, borderRadius: 8, color: 'var(--color-destructive)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 7,
                      paddingTop: 12,
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <Row label="اولویت">
                      <span
                        className={`badge ${
                          subject.priority === 'high'
                            ? 'badge-destructive'
                            : subject.priority === 'medium'
                              ? 'badge-warning'
                              : 'badge-success'
                        }`}
                      >
                        {formatPriority(subject.priority)}
                      </span>
                    </Row>
                    <Row label="سختی">
                      <span style={{ display: 'flex', gap: 2.5 }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: i < subject.difficulty ? subject.color : 'var(--color-border)',
                            }}
                          />
                        ))}
                      </span>
                    </Row>
                    {subject.examDate && (
                      <Row label="امتحان">
                        <span style={{ fontSize: 11.5, fontWeight: 600 }}>{toPersianDate(subject.examDate)}</span>
                      </Row>
                    )}
                  </div>

                  {days !== null && days >= 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div
                        className={`badge ${days <= 3 ? 'badge-destructive' : days <= 7 ? 'badge-warning' : 'badge-primary'}`}
                        style={{ width: '100%', justifyContent: 'center', padding: '5px 10px' }}
                      >
                        <CalendarClock size={11} />
                        {days === 0 ? 'امتحان امروز است' : `${days} روز تا امتحان`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <button
            onClick={() => setShowForm(true)}
            style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              minHeight: 190,
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: 'var(--color-muted-foreground)',
              transition: 'all 200ms var(--ease-out-quint)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)'
              e.currentTarget.style.color = 'var(--color-primary)'
              e.currentTarget.style.background = 'var(--color-primary-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.color = 'var(--color-muted-foreground)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Plus size={22} />
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>درس جدید</span>
          </button>
        </div>
      )}

      <Modal
        open={showForm}
        title={editingId ? 'ویرایش درس' : 'درس جدید'}
        subtitle={editingId ? 'اطلاعات درس را به‌روز کنید' : 'یک درس تازه به برنامه اضافه کنید'}
        onClose={resetForm}
        footer={
          <>
            <button type="submit" form="subject-form" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              <Check size={15} /> {editingId ? 'ذخیره تغییرات' : 'اضافه کردن'}
            </button>
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              انصراف
            </button>
          </>
        }
      >
        <form id="subject-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>نام درس</label>
            <input
              type="text"
              className="input"
              placeholder="مثال: ریاضی"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                ساعت هفتگی
              </label>
              <input
                type="number"
                className="input"
                min={1}
                max={40}
                value={formData.weeklyHours}
                onChange={(e) => setFormData((p) => ({ ...p, weeklyHours: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>اولویت</label>
              <select
                className="input"
                value={formData.priority}
                onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value as Priority }))}
              >
                <option value="high">بالا</option>
                <option value="medium">متوسط</option>
                <option value="low">پایین</option>
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <Gauge size={13} /> سختی: {formData.difficulty} از ۵
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={formData.difficulty}
              onChange={(e) =>
                setFormData((p) => ({ ...p, difficulty: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 }))
              }
              style={{ width: '100%', accentColor: 'var(--color-primary)' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--color-muted-foreground)',
                marginTop: 4,
              }}
            >
              <span>آسان</span>
              <span>سخت</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
              تاریخ امتحان (اختیاری)
            </label>
            <input
              type="date"
              className="input"
              value={formData.examDate || ''}
              onChange={(e) => setFormData((p) => ({ ...p, examDate: e.target.value || undefined }))}
            />
          </div>

          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <Palette size={13} /> رنگ
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SUBJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`رنگ ${color}`}
                  onClick={() => setFormData((p) => ({ ...p, color }))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: color,
                    border: 'none',
                    cursor: 'pointer',
                    transform: formData.color === color ? 'scale(1.12)' : 'scale(1)',
                    boxShadow:
                      formData.color === color
                        ? `0 0 0 2px var(--color-card), 0 0 0 4px ${color}`
                        : 'none',
                    transition: 'all 180ms var(--ease-spring)',
                  }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
      <span style={{ color: 'var(--color-muted-foreground)' }}>{label}</span>
      {children}
    </div>
  )
}
