import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

/** مودال پایه — با بسته شدن با Escape و کلیک روی بک‌دراپ */
export function Modal(props: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  const { open, title, subtitle, onClose, children, footer, width = 520 } = props

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(8, 11, 20, 0.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 180ms ease-out both',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-scaleIn"
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-card)',
          border: '1px solid var(--color-card-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            padding: '20px 22px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{title}</h2>
            {subtitle && (
              <p style={{ fontSize: 12, color: 'var(--color-muted-foreground)', margin: '3px 0 0' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: 10, flexShrink: 0 }}
          >
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>{children}</div>

        {footer && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '14px 22px',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-muted)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
