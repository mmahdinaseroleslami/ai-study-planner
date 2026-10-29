import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarDays,
  RotateCcw,
  MessageCircle,
  Settings,
  Sparkles,
  X,
  GraduationCap,
} from 'lucide-react'
import { useUIStore } from '@/stores'

const menuItems = [
  { path: '/', label: 'داشبورد', icon: LayoutDashboard },
  { path: '/subjects', label: 'دروس', icon: BookOpen },
  { path: '/planner', label: 'برنامه‌ریز', icon: Sparkles },
  { path: '/weekly', label: 'تقویم هفتگی', icon: Calendar },
  { path: '/monthly', label: 'تقویم ماهانه', icon: CalendarDays },
  { path: '/reviews', label: 'مرورها', icon: RotateCcw },
  { path: '/chat', label: 'چت با AI', icon: MessageCircle },
]

const bottomItems = [{ path: '/settings', label: 'تنظیمات', icon: Settings }]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, isMobile } = useUIStore()

  return (
    <>
      {/* بک‌دراپ موبایل */}
      <div
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(8, 11, 20, 0.45)',
          backdropFilter: 'blur(3px)',
          opacity: isMobile && sidebarOpen ? 1 : 0,
          pointerEvents: isMobile && sidebarOpen ? 'auto' : 'none',
          transition: 'opacity 260ms ease',
        }}
      />

      <aside
        className="app-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: 268,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 340ms var(--ease-out-quint)',
          boxShadow: sidebarOpen ? '-8px 0 40px rgba(8, 11, 20, 0.12)' : 'none',
        }}
      >
        {/* لوگو */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 18px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div
              className="gradient-primary shine-btn"
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                display: 'grid',
                placeItems: 'center',
                boxShadow: 'var(--shadow-glow)',
                flexShrink: 0,
              }}
            >
              <GraduationCap size={21} color="white" />
            </div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 14.5, margin: 0, lineHeight: 1.3 }}>برنامه‌ریز</h1>
              <p style={{ fontSize: 10.5, color: 'var(--color-muted-foreground)', margin: 0 }}>مطالعه هوشمند</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="بستن منو"
              className="btn btn-ghost"
              style={{ padding: 6, borderRadius: 9 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ناوبری */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }} className="no-scrollbar">
          <p
            style={{
              padding: '0 10px',
              marginBottom: 8,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--color-muted-foreground)',
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
            }}
          >
            منوی اصلی
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {menuItems.map((item) => (
              <SidebarLink key={item.path} item={item} onMobileClick={() => isMobile && setSidebarOpen(false)} />
            ))}
          </div>
        </nav>

        {/* پایین */}
        <div style={{ padding: 12, borderTop: '1px solid var(--color-border)' }}>
          {bottomItems.map((item) => (
            <SidebarLink key={item.path} item={item} onMobileClick={() => isMobile && setSidebarOpen(false)} />
          ))}
          <p
            style={{
              padding: '10px 10px 2px',
              fontSize: 10,
              color: 'var(--color-muted-foreground)',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            نسخه ۲.۰.۰
          </p>
        </div>
      </aside>
    </>
  )
}

function SidebarLink({
  item,
  onMobileClick,
}: {
  item: { path: string; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }
  onMobileClick: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onMobileClick}
      className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  )
}
