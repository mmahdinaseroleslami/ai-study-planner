import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/** سربرگ صفحه — تیتر، زیرتیتر و اکشن‌ها */
export function PageHeader(props: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  actions?: ReactNode
}) {
  const { title, subtitle, icon: Icon, actions } = props
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {Icon && (
          <div
            className="gradient-primary"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              color: 'white',
              boxShadow: 'var(--shadow-glow)',
              flexShrink: 0,
            }}
          >
            <Icon size={21} />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>{title}</h1>
          {subtitle && (
            <p style={{ fontSize: 12.5, color: 'var(--color-muted-foreground)', margin: '2px 0 0' }}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
    </div>
  )
}

/** حالت خالی — آیکون، عنوان، توضیح و اکشن */
export function EmptyState(props: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  const { icon: Icon, title, description, action } = props
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: 20,
          background: 'var(--color-muted)',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 18px',
          color: 'var(--color-muted-foreground)',
        }}
      >
        <Icon size={30} strokeWidth={1.6} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{title}</h3>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--color-muted-foreground)',
            marginBottom: action ? 20 : 0,
            maxWidth: 340,
            marginInline: 'auto',
            lineHeight: 1.8,
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

/** اسپینر بارگذاری */
export function Loading(props: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 14 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 800ms linear infinite',
        }}
      />
      {props.label && <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)' }}>{props.label}</p>}
    </div>
  )
}

/** نوار پیشرفت */
export function ProgressBar(props: { value: number; color?: string; height?: number }) {
  const { value, color, height = 6 } = props
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 999,
        background: 'var(--color-muted)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          background: color ?? 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          transition: 'width 600ms var(--ease-out-quint)',
        }}
      />
    </div>
  )
}
