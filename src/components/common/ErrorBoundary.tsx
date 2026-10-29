import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * مرز خطا — یک خطای رندر در یک صفحه نباید کل اپ را سفید کند.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private reset = () => this.setState({ error: null })

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 520, margin: '40px auto' }}>
        <div
          className="icon-circle-destructive"
          style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}
        >
          <AlertTriangle size={26} />
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>مشکلی پیش آمد</h2>
        <p style={{ fontSize: 13, color: 'var(--color-muted-foreground)', marginBottom: 20, lineHeight: 1.8 }}>
          این صفحه نتوانست نمایش داده شود. داده‌های شما دست‌نخورده باقی مانده است.
        </p>
        <pre
          style={{
            textAlign: 'left',
            direction: 'ltr',
            fontSize: 11,
            padding: 12,
            borderRadius: 10,
            background: 'var(--color-muted)',
            color: 'var(--color-muted-foreground)',
            overflowX: 'auto',
            marginBottom: 20,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {error.message}
        </pre>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={this.reset}>
            <RotateCcw size={15} /> تلاش دوباره
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            بارگذاری مجدد
          </button>
        </div>
      </div>
    )
  }
}
