import { BookOpen, Clock, Sparkles, Loader2, CalendarRange, Timer, Brain, Target } from 'lucide-react'
import type { Subject } from '@/types/subject'
import type { StudyPreference } from '@/types/ai'
import type { StudyMethod } from '@/types/studySession'
import { STUDY_METHODS } from '@/constants/studyMethods'

/** Props فرم برنامه‌ریز */
export interface PlannerFormProps {
  subjects: Subject[]
  selectedSubjectIds: string[]
  startDate: string
  endDate: string
  availableStart: string
  availableEnd: string
  preference: StudyPreference
  minDuration: number
  maxDuration: number
  breakDuration: number
  studyMethods: StudyMethod[]
  methodNote: string
  strengths: string
  weaknesses: string
  loading: boolean
  aiReady: boolean
  onToggleSubject: (id: string) => void
  onStartDate: (v: string) => void
  onEndDate: (v: string) => void
  onAvailableStart: (v: string) => void
  onAvailableEnd: (v: string) => void
  onPreference: (v: StudyPreference) => void
  onToggleMethod: (method: StudyMethod) => void
  onMethodNote: (v: string) => void
  onStrengths: (v: string) => void
  onWeaknesses: (v: string) => void
  onMinDuration: (v: number) => void
  onMaxDuration: (v: number) => void
  onBreakDuration: (v: number) => void
  onGenerate: () => void
}

const labelStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  marginBottom: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  color: 'var(--color-foreground)',
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-muted-foreground)',
  display: 'block',
  marginBottom: 5,
}

const helperTextStyle: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--color-muted-foreground)',
  marginTop: 6,
  lineHeight: 1.8,
}

/** فرم ورودی برنامه — presentational */
export function PlannerForm(props: PlannerFormProps) {
  const { subjects, selectedSubjectIds: sel } = props

  return (
    <div
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-card-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* دروس */}
      <div>
        <label style={labelStyle}>
          <BookOpen size={14} style={{ color: 'var(--color-primary)' }} /> دروس
          {sel.length > 0 && (
            <span className="badge badge-primary" style={{ marginRight: 'auto' }}>
              {sel.length} انتخاب‌شده
            </span>
          )}
        </label>
        {subjects.length === 0 ? (
          <p style={{ fontSize: 12.5, color: 'var(--color-muted-foreground)' }}>
            ابتدا از صفحه دروس، درس اضافه کنید.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {subjects.map((s) => {
              const active = sel.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => props.onToggleSubject(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 15px',
                    borderRadius: 11,
                    border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-primary-light)' : 'var(--color-card)',
                    color: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                    fontWeight: active ? 700 : 500,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 180ms var(--ease-out-quint)',
                    transform: active ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  {s.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* بازه */}
      <div>
        <label style={labelStyle}>
          <CalendarRange size={14} style={{ color: 'var(--color-primary)' }} /> بازه برنامه
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', display: 'block', marginBottom: 5 }}>
              از تاریخ
            </span>
            <input
              type="date"
              className="input"
              value={props.startDate}
              onChange={(e) => props.onStartDate(e.target.value)}
            />
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', display: 'block', marginBottom: 5 }}>
              تا تاریخ
            </span>
            <input
              type="date"
              className="input"
              value={props.endDate}
              onChange={(e) => props.onEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ساعات آزاد */}
      <div>
        <label style={labelStyle}>
          <Clock size={14} style={{ color: 'var(--color-success)' }} /> ساعات آزاد روزانه
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', display: 'block', marginBottom: 5 }}>
              از ساعت
            </span>
            <input
              type="time"
              className="input"
              value={props.availableStart}
              onChange={(e) => props.onAvailableStart(e.target.value)}
            />
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', display: 'block', marginBottom: 5 }}>
              تا ساعت
            </span>
            <input
              type="time"
              className="input"
              value={props.availableEnd}
              onChange={(e) => props.onAvailableEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ترجیح */}
      <div>
        <label style={labelStyle}>سبک مطالعه</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { v: 'focused' as const, l: 'تمرکزی', d: 'جلسات بلندتر و کمتر' },
            { v: 'distributed' as const, l: 'پراکنده', d: 'جلسات کوتاه‌تر و بیشتر' },
          ].map((p) => {
            const active = props.preference === p.v
            return (
              <button
                key={p.v}
                type="button"
                onClick={() => props.onPreference(p.v)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: active ? 'var(--color-primary-light)' : 'var(--color-card)',
                  color: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'right',
                  transition: 'all 180ms var(--ease-out-quint)',
                }}
              >
                <span style={{ display: 'block', fontWeight: 700, fontSize: 12.5 }}>{p.l}</span>
                <span style={{ display: 'block', fontSize: 10.5, opacity: 0.8, marginTop: 2 }}>{p.d}</span>
              </button>
            )
          })}
        </div>
      </div>

      <hr className="divider" />

      {/* روش‌های یادگیری */}
      <div>
        <label style={labelStyle}>
          <Brain size={14} style={{ color: 'var(--color-primary)' }} /> روش‌های یادگیری
          <span
            style={{
              marginRight: 'auto',
              fontSize: 10.5,
              fontWeight: 500,
              color: 'var(--color-muted-foreground)',
            }}
          >
            چند مورد را انتخاب کن
          </span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {STUDY_METHODS.map((method) => {
            const active = props.studyMethods.includes(method.value)
            return (
              <button
                key={method.value}
                type="button"
                title={method.hint}
                aria-pressed={active}
                onClick={() => props.onToggleMethod(method.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 11,
                  border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: active ? 'var(--color-primary-light)' : 'var(--color-card)',
                  color: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 180ms var(--ease-out-quint)',
                  transform: active ? 'translateY(-1px)' : 'none',
                }}
              >
                {method.label}
              </button>
            )
          })}
        </div>
        <span style={fieldLabelStyle}>ترتیب یا توضیح دلخواه (اختیاری)</span>
        <textarea
          className="input"
          rows={2}
          placeholder="مثلاً: اول ویدیو ببینم، بعد خلاصه بنویسم و در آخر تست بزنم"
          value={props.methodNote}
          onChange={(e) => props.onMethodNote(e.target.value)}
          style={{ minHeight: 68, resize: 'vertical', lineHeight: 1.9 }}
        />
        <p style={helperTextStyle}>
          AI بر اساس این انتخاب‌ها چرخه ورودی ← پردازش ← تثبیت ← بازیابی را می‌چیند.
        </p>
      </div>

      {/* نقاط قوت و ضعف */}
      <div>
        <label style={labelStyle}>
          <Target size={14} style={{ color: 'var(--color-warning)' }} /> نقاط قوت و ضعف
          <span
            style={{
              marginRight: 'auto',
              fontSize: 10.5,
              fontWeight: 500,
              color: 'var(--color-muted-foreground)',
            }}
          >
            برای هدف‌مندکردن تمرین‌ها
          </span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <span style={fieldLabelStyle}>نقاط قوت</span>
            <textarea
              className="input"
              rows={2}
              placeholder="مثلاً: در ریاضی پایه قوی‌ام و سریع یاد می‌گیرم"
              value={props.strengths}
              onChange={(e) => props.onStrengths(e.target.value)}
              style={{ minHeight: 68, resize: 'vertical', lineHeight: 1.9 }}
            />
          </div>
          <div>
            <span style={fieldLabelStyle}>نقاط ضعف</span>
            <textarea
              className="input"
              rows={2}
              placeholder="مثلاً: در حل مسئله کند هستم یا حفظیات ضعیف دارم"
              value={props.weaknesses}
              onChange={(e) => props.onWeaknesses(e.target.value)}
              style={{ minHeight: 68, resize: 'vertical', lineHeight: 1.9 }}
            />
          </div>
        </div>
        <p style={helperTextStyle}>
          AI برای نقاط ضعف تمرین فعال‌تر و زمان بیشتری در نظر می‌گیرد و نقاط قوت را با مرور چالشی‌تر پوشش می‌دهد.
        </p>
      </div>

      <hr className="divider" />

      {/* مدت‌ها */}
      <div>
        <label style={labelStyle}>
          <Timer size={14} style={{ color: 'var(--color-warning)' }} /> مدت جلسات
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', display: 'block', marginBottom: 5 }}>
              حداقل (دقیقه)
            </span>
            <input
              type="number"
              className="input"
              min={15}
              max={120}
              value={props.minDuration}
              onChange={(e) => props.onMinDuration(parseInt(e.target.value) || 30)}
            />
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', display: 'block', marginBottom: 5 }}>
              حداکثر (دقیقه)
            </span>
            <input
              type="number"
              className="input"
              min={30}
              max={240}
              value={props.maxDuration}
              onChange={(e) => props.onMaxDuration(parseInt(e.target.value) || 120)}
            />
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)', display: 'block', marginBottom: 5 }}>
              استراحت (دقیقه)
            </span>
            <input
              type="number"
              className="input"
              min={5}
              max={60}
              value={props.breakDuration}
              onChange={(e) => props.onBreakDuration(parseInt(e.target.value) || 10)}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={props.onGenerate}
        disabled={props.loading || !props.aiReady}
        className="btn btn-primary shine-btn"
        style={{
          width: '100%',
          padding: '13px',
          fontSize: 14,
          background: props.aiReady ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--color-muted)',
          color: props.aiReady ? 'white' : 'var(--color-muted-foreground)',
          boxShadow: props.aiReady ? '0 6px 24px -6px rgba(99,102,241,0.55)' : 'none',
        }}
      >
        {props.loading ? (
          <>
            <Loader2 size={16} className="animate-spin-slow" /> در حال تولید برنامه...
          </>
        ) : (
          <>
            <Sparkles size={16} /> تولید برنامه مطالعه
          </>
        )}
      </button>
    </div>
  )
}
