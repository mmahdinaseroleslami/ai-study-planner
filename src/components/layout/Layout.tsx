import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from '@/components/common/Toaster'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useUIStore, useThemeStore } from '@/stores'
import { applyTheme } from '@/utils/theme'
import { useEffect } from 'react'

export function Layout() {
  const { sidebarOpen, isMobile, setIsMobile, setSidebarOpen } = useUIStore()
  const { hydrate } = useThemeStore()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [setIsMobile])

  // در موبایل سایدبار باید بسته شروع شود، نه روی کل صفحه بیفتد.
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile, setSidebarOpen])

  // اعمال تم ذخیره‌شده هنگام بالا آمدن اپ — منبع واحد: useThemeStore
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // دنبال کردن تغییر تم سیستم
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (useThemeStore.getState().theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const sidebarWidth = !isMobile && sidebarOpen ? 268 : 0

  return (
    <div className="app-shell" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div
        style={{
          marginRight: sidebarWidth,
          transition: 'margin-right 340ms var(--ease-out-quint)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header />
        <main
          style={{
            flex: 1,
            padding: isMobile ? '18px 16px 40px' : '26px 30px 48px',
            maxWidth: 1440,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
