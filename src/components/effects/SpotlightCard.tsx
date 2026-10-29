import { useRef, type ReactNode, type CSSProperties } from 'react'

/**
 * کارت اسپات‌لایت به سبک Aceternity (Card Spotlight)
 * موقعیت موس را در CSS vars می‌نویسد — بدون هیچ dependency.
 */
export function SpotlightCard(props: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      style={props.style}
      className={`spotlight-card lift ${props.className ?? ''}`}
    >
      {props.children}
    </div>
  )
}
