import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastKind } from '@/stores/useToastStore'

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const TONE: Record<ToastKind, { bg: string; border: string; color: string; accent: string }> = {
  success: {
    bg: 'var(--color-success-light)',
    border: 'color-mix(in srgb, var(--color-success) 35%, transparent)',
    color: 'var(--color-success)',
    accent: 'var(--color-success)',
  },
  error: {
    bg: 'var(--color-destructive-light)',
    border: 'color-mix(in srgb, var(--color-destructive) 35%, transparent)',
    color: 'var(--color-destructive)',
    accent: 'var(--color-destructive)',
  },
  info: {
    bg: 'var(--color-primary-light)',
    border: 'color-mix(in srgb, var(--color-primary) 35%, transparent)',
    color: 'var(--color-primary)',
    accent: 'var(--color-primary)',
  },
}

/** نمایش‌دهنده Toast — در Layout سوار می‌شود */
export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        pointerEvents: 'none',
        width: 'min(440px, calc(100vw - 32px))',
      }}
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.kind]
        const c = TONE[t.kind]
        return (
          <div
            key={t.id}
            className="animate-scaleIn"
            style={{
              pointerEvents: 'auto',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--color-card)',
              border: `1px solid ${c.border}`,
              color: 'var(--color-foreground)',
              boxShadow: 'var(--shadow-lg)',
              borderRight: `3px solid ${c.accent}`,
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                background: c.bg,
                color: c.color,
                flexShrink: 0,
              }}
            >
              <Icon size={15} />
            </span>
            <span style={{ flex: 1, lineHeight: 1.6 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="بستن"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted-foreground)',
                display: 'flex',
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
