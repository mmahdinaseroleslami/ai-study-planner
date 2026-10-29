import { Menu, Moon, Sun, Monitor, Search } from 'lucide-react'
import { useUIStore, useThemeStore } from '@/stores'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Theme } from '@/types'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'داشبورد', subtitle: 'نمای کلی برنامه مطالعه' },
  '/subjects': { title: 'دروس', subtitle: 'مدیریت دروس و اطلاعات' },
  '/planner': { title: 'برنامه‌ریز', subtitle: 'تولید برنامه با هوش مصنوعی' },
  '/weekly': { title: 'تقویم هفتگی', subtitle: 'برنامه هفتگی مطالعه' },
  '/monthly': { title: 'تقویم ماهانه', subtitle: 'نمای کلی ماهانه' },
  '/reviews': { title: 'مرورها', subtitle: 'مدیریت مرورها' },
  '/chat': { title: 'چت با AI', subtitle: 'گفتگو با دستیار هوشمند' },
  '/settings': { title: 'تنظیمات', subtitle: 'پیکربندی برنامه' },
}

const THEME_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }
const THEME_LABEL: Record<Theme, string> = { light: 'روشن', dark: 'تاریک', system: 'سیستم' }

export function Header() {
  const { toggleSidebar, isMobile } = useUIStore()
  const { theme, cycleTheme } = useThemeStore()
  const location = useLocation()
  const navigate = useNavigate()
  const pageInfo = pageTitles[location.pathname] ?? { title: '', subtitle: '' }

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return Object.entries(pageTitles)
      .filter(
        ([, info]) =>
          info.title.toLowerCase().includes(q) || info.subtitle.toLowerCase().includes(q)
      )
      .slice(0, 5)
  }, [query])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const goTo = (path: string) => {
    navigate(path)
    setQuery('')
    setSearchOpen(false)
  }

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && results[0]) {
      event.preventDefault()
      goTo(results[0][0])
    }
    if (event.key === 'Escape') {
      setSearchOpen(false)
      setQuery('')
      inputRef.current?.blur()
    }
  }

  const ThemeIcon = THEME_ICON[theme]
  const themeLabel = THEME_LABEL[theme]

  return (
    <header
      className="app-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: '0 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            onClick={toggleSidebar}
            aria-label="منو"
            className="btn btn-ghost"
            style={{ padding: 8, borderRadius: 10, flexShrink: 0 }}
          >
            <Menu size={19} />
          </button>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: 'var(--color-foreground)',
                margin: 0,
                lineHeight: 1.35,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {pageInfo.title}
            </h1>
            {!isMobile && (
              <p style={{ fontSize: 11.5, color: 'var(--color-muted-foreground)', margin: 0 }}>{pageInfo.subtitle}</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isMobile && (
            <div ref={searchRef} className="header-search">
              <Search size={14} style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={onSearchKeyDown}
                placeholder="جستجوی صفحه..."
                aria-label="جستجوی صفحه"
              />
              {searchOpen && query.trim() && (
                <div className="header-search-popover">
                  {results.length === 0 ? (
                    <p className="header-search-empty">صفحه‌ای پیدا نشد</p>
                  ) : (
                    results.map(([path, info]) => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => goTo(path)}
                        className={`header-search-item${location.pathname === path ? ' active' : ''}`}
                      >
                        <span className="header-search-item-title">{info.title}</span>
                        <span className="header-search-item-subtitle">{info.subtitle}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={cycleTheme}
            aria-label={`تم: ${themeLabel}`}
            title={`تم: ${themeLabel}`}
            className="btn btn-ghost"
            style={{ padding: 8, borderRadius: 10 }}
          >
            <ThemeIcon size={17} />
          </button>

          <div
            className="gradient-primary"
            style={{
              width: 33,
              height: 33,
              borderRadius: 11,
              display: 'grid',
              placeItems: 'center',
              color: 'white',
              fontSize: 12,
              fontWeight: 800,
              boxShadow: 'var(--shadow-glow)',
              flexShrink: 0,
            }}
          >
            م
          </div>
        </div>
      </div>
    </header>
  )
}
