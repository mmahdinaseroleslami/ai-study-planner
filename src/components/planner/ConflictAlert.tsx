import { AlertTriangle } from 'lucide-react'
import type { ConflictInfo } from '@/utils/conflict'

/** هشدار تداخل زمانی */
export function ConflictAlert(props: { conflicts: ConflictInfo[] }) {
  const { conflicts } = props
  if (conflicts.length === 0) return null

  return (
    <div
      style={{
        padding: '13px 16px',
        borderRadius: 13,
        background: 'var(--color-warning-light)',
        border: '1px solid color-mix(in srgb, var(--color-warning) 32%, transparent)',
        fontSize: 12.5,
        color: 'var(--color-warning)',
      }}
    >
      <p style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7, margin: '0 0 8px' }}>
        <AlertTriangle size={15} /> {conflicts.length} تداخل زمانی تشخیص داده شد
      </p>
      <ul style={{ margin: 0, paddingRight: 18, display: 'flex', flexDirection: 'column', gap: 5, lineHeight: 1.7 }}>
        {conflicts.slice(0, 5).map((c, i) => (
          <li key={i}>{c.message}</li>
        ))}
      </ul>
      {conflicts.length > 5 && (
        <p style={{ margin: '8px 0 0', fontSize: 11.5, opacity: 0.85 }}>و {conflicts.length - 5} تداخل دیگر...</p>
      )}
    </div>
  )
}
