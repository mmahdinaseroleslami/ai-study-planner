import {
  Calendar,
  BookOpen,
  Clock,
  RotateCcw,
  Sparkles,
  Plus,
  ArrowLeft,
  TrendingUp,
  Target,
  Zap,
  Flame,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSubjects, useStudySessions, useReviews } from '@/hooks'
import { daysUntil, getToday, toPersianDate } from '@/utils/date'
import { formatPriority, formatStudyMethod } from '@/utils/format'
import { SpotlightCard } from '@/components/effects/SpotlightCard'
import { ProgressBar } from '@/components/common/PageHeader'

export default function Dashboard() {
  const { subjects } = useSubjects()
  const { sessions } = useStudySessions()
  const { reviews } = useReviews()

  const today = getToday()
  const upcomingExams = subjects
    .filter((s) => s.examDate && daysUntil(s.examDate) >= 0)
    .sort((a, b) => (a.examDate ?? '').localeCompare(b.examDate ?? ''))

  const weeklyHours = subjects.reduce((a, s) => a + s.weeklyHours, 0)
  const completedCount = sessions.filter((s) => s.status === 'completed').length
  const progress = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0
  const openReviews = reviews.filter((r) => r.status === 'pending' || r.status === 'overdue').length
  const todaySessions = sessions
    .filter((s) => s.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const todayMinutes = todaySessions.reduce((acc, s) => {
    const [sh = '0', sm = '0'] = s.startTime.split(':')
    const [eh = '0', em = '0'] = s.endTime.split(':')
    return acc + (Number(eh) * 60 + Number(em)) - (Number(sh) * 60 + Number(sm))
  }, 0)

  const stats = [
    {
      label: 'دروس فعال',
      value: subjects.length,
      icon: BookOpen,
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      to: '/subjects',
    },
    {
      label: 'امتحانات پیش رو',
      value: upcomingExams.length,
      icon: Target,
      gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
      to: '/subjects',
    },
    {
      label: 'ساعت مطالعه هفتگی',
      value: weeklyHours,
      suffix: 'س',
      icon: Clock,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      to: '/weekly',
    },
    {
      label: 'مرورهای باز',
      value: openReviews,
      icon: RotateCcw,
      gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      to: '/reviews',
    },
  ]

  const quickActions = [
    { to: '/subjects', label: 'دروس', icon: BookOpen, bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
    { to: '/weekly', label: 'تقویم', icon: Calendar, bg: 'var(--color-success-light)', color: 'var(--color-success)' },
    { to: '/reviews', label: 'مرورها', icon: RotateCcw, bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
    { to: '/chat', label: 'چت AI', icon: Sparkles, bg: 'var(--color-destructive-light)', color: 'var(--color-destructive)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }} className="animate-fadeIn">
      {/* ---------- Hero ---------- */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 45%, #6d28d9 100%)',
          padding: 'clamp(26px, 4vw, 44px)',
          color: 'white',
          boxShadow: '0 20px 60px -20px rgba(76, 29, 149, 0.6)',
        }}
      >
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.55 }} />
        <div
          className="aurora-blob"
          style={{ top: -70, right: -50, width: 300, height: 300, background: 'rgba(139,92,246,0.55)' }}
        />
        <div
          className="aurora-blob"
          style={{ bottom: -100, left: '28%', width: 260, height: 260, background: 'rgba(59,130,246,0.45)', animationDelay: '-5s' }}
        />
        <div
          className="aurora-blob"
          style={{ top: '15%', left: -50, width: 190, height: 190, background: 'rgba(236,72,153,0.4)', animationDelay: '-9s' }}
        />
        <span className="meteor" style={{ top: 12, left: '68%' }} />
        <span className="meteor" style={{ top: 34, left: '86%', animationDelay: '-2.5s' }} />
        <span className="meteor" style={{ top: 4, left: '44%', animationDelay: '-5s' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 620 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.22)',
              fontSize: 11.5,
              fontWeight: 600,
              marginBottom: 16,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Sparkles size={13} />
            برنامه‌ریز هوشمند مطالعه
          </div>

          <h1
            style={{
              fontSize: 'clamp(23px, 3.4vw, 33px)',
              fontWeight: 900,
              margin: '0 0 10px',
              lineHeight: 1.35,
              letterSpacing: '-0.02em',
            }}
          >
            امروز چه چیزی یاد می‌گیری؟
          </h1>
          <p style={{ fontSize: 13.5, opacity: 0.82, lineHeight: 1.9, marginBottom: 26, maxWidth: 480 }}>
            {todaySessions.length > 0
              ? `${todaySessions.length} جلسه برای امروز داری — مجموعاً ${Math.round(todayMinutes / 60 * 10) / 10} ساعت. با تمرکز شروع کن.`
              : 'برنامه‌ات را با کمک هوش مصنوعی بساز و مسیر مطالعه‌ات را دقیق و منظم نگه دار.'}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/planner"
              className="shine-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 22px',
                background: 'white',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                color: '#4c1d95',
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                transition: 'transform 200ms var(--ease-out-quint)',
              }}
            >
              <Sparkles size={16} /> ساخت برنامه <ArrowLeft size={15} />
            </Link>
            <Link
              to="/weekly"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 20px',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.28)',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CalendarDays size={16} /> تقویم هفته
            </Link>
          </div>
        </div>

        {/* حلقه پیشرفت شناور */}
        {sessions.length > 0 && (
          <div
            className="animate-float"
            style={{
              position: 'absolute',
              bottom: 28,
              left: 28,
              display: 'none',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900 }} className="tnum">{progress}%</div>
            <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.5 }}>
              پیشرفت
              <br />
              جلسات
            </div>
          </div>
        )}
      </div>

      {/* ---------- آمار ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <Link key={s.label} to={s.to} style={{ textDecoration: 'none', color: 'inherit' }}>
              <SpotlightCard
                className="animate-fadeInUp"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-card-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 18,
                  boxShadow: 'var(--shadow-sm)',
                  animationDelay: `${i * 70}ms`,
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 13,
                      background: s.gradient,
                      display: 'grid',
                      placeItems: 'center',
                      color: 'white',
                      boxShadow: '0 6px 18px -4px rgba(15,23,42,0.28)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      className="tnum"
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: 'var(--color-foreground)',
                        margin: 0,
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {s.value}
                      {s.suffix && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted-foreground)', marginRight: 3 }}>
                          {s.suffix}
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: 11.5, color: 'var(--color-muted-foreground)', margin: 0 }}>{s.label}</p>
                  </div>
                </div>
              </SpotlightCard>
            </Link>
          )
        })}
      </div>

      {/* ---------- محتوای اصلی ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 18 }} className="dash-grid">
        {/* دروس */}
        <div
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-card-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 22,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <BookOpen size={16} style={{ color: 'var(--color-primary)' }} /> دروس شما
            </h2>
            <Link
              to="/subjects"
              style={{
                fontSize: 12,
                color: 'var(--color-primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 600,
              }}
            >
              مشاهده همه <ArrowLeft size={13} />
            </Link>
          </div>

          {subjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px 0' }}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 18,
                  background: 'var(--color-muted)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                <BookOpen size={28} strokeWidth={1.6} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', marginBottom: 18 }}>
                هنوز درسی اضافه نکرده‌اید
              </p>
              <Link to="/subjects" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                <Plus size={15} /> اضافه کردن درس
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subjects.slice(0, 5).map((s) => {
                const days = s.examDate ? daysUntil(s.examDate) : null
                return (
                  <div
                    key={s.id}
                    className="lift"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 13,
                      background: 'var(--color-muted)',
                      border: '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 11,
                          background: s.color,
                          display: 'grid',
                          placeItems: 'center',
                          color: 'white',
                          fontSize: 14,
                          fontWeight: 800,
                          flexShrink: 0,
                          boxShadow: `0 4px 14px -4px ${s.color}`,
                        }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: 'var(--color-foreground)',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {s.name}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)' }}>
                            {s.weeklyHours} ساعت/هفته
                          </span>
                          <span style={{ color: 'var(--color-border-strong)' }}>•</span>
                          <span style={{ fontSize: 11, color: 'var(--color-muted-foreground)' }}>
                            {formatPriority(s.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {days !== null && days >= 0 && (
                      <span
                        className={`badge ${days <= 3 ? 'badge-destructive' : days <= 7 ? 'badge-warning' : 'badge-primary'}`}
                      >
                        {days === 0 ? 'امروز' : `${days} روز`}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ستون کنار */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* دسترسی سریع */}
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-card-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 22,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
              <Zap size={16} style={{ color: 'var(--color-warning)' }} /> دسترسی سریع
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {quickActions.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="lift"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '16px 10px',
                      borderRadius: 13,
                      background: item.bg,
                      color: item.color,
                      textDecoration: 'none',
                    }}
                  >
                    <Icon size={19} />
                    <span style={{ fontSize: 11.5, fontWeight: 700 }}>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* پیشرفت */}
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-card-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 22,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 14px' }}>
              <TrendingUp size={16} style={{ color: 'var(--color-success)' }} /> پیشرفت جلسات
            </h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <span className="tnum" style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em' }}>
                {progress}%
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--color-muted-foreground)' }}>
                {completedCount} از {sessions.length} جلسه
              </span>
            </div>
            <ProgressBar value={progress} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 11.5, color: 'var(--color-muted-foreground)' }}>
              <Flame size={13} style={{ color: 'var(--color-warning)' }} />
              {completedCount === 0
                ? 'اولین جلسه را کامل کن تا شمارش شروع شود'
                : `${completedCount} جلسه تکمیل‌شده`}
            </div>
          </div>

          {/* امتحانات */}
          <div
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-card-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 22,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
              <Target size={16} style={{ color: 'var(--color-destructive)' }} /> امتحانات پیش رو
            </h2>
            {upcomingExams.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--color-muted-foreground)', textAlign: 'center', padding: '18px 0' }}>
                امتحانی ثبت نشده
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingExams.slice(0, 4).map((s) => {
                  const days = daysUntil(s.examDate!)
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 11,
                        background: 'var(--color-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              margin: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {s.name}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--color-muted-foreground)', margin: 0 }}>
                            {toPersianDate(s.examDate!)}
                          </p>
                        </div>
                      </div>
                      <span className={`badge ${days <= 3 ? 'badge-destructive' : 'badge-warning'}`}>
                        {days === 0 ? 'امروز' : `${days} روز`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* امروز */}
      {todaySessions.length > 0 && (
        <div
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-card-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 22,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} /> برنامه امروز
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {todaySessions.map((s) => {
              const subject = subjects.find((x) => x.id === s.subjectId)
              return (
                <div
                  key={s.id}
                  className="lift"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 13,
                    background: 'var(--color-muted)',
                    borderRight: `3px solid ${subject?.color ?? 'var(--color-border-strong)'}`,
                    opacity: s.status === 'completed' ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>
                      {subject?.name ?? 'نامشخص'}
                    </p>
                    {s.status === 'completed' && (
                      <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
                    )}
                  </div>
                  <p className="tnum" style={{ fontSize: 11, color: 'var(--color-muted-foreground)', margin: '3px 0 0' }}>
                    {s.startTime} — {s.endTime}
                    {s.method ? ` · ${formatStudyMethod(s.method)}` : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1080px) {
          .dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
