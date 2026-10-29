import type { Theme } from '@/types'

const THEME_KEY = 'ai-study-planner-theme'

/**
 * اعمال تم روی document.
 * تم فقط preference ظاهری است و طبق AGENTS.md مجاز است در localStorage باشد.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  let effective: 'light' | 'dark' = 'light'
  if (theme === 'dark') effective = 'dark'
  else if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  root.dataset.theme = effective
  root.style.colorScheme = effective
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // localStorage در دسترس نیست — نادیده بگیر
  }
}

/** خواندن تم ذخیره‌شده (فقط preference ظاهری) */
export function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
    return null
  } catch {
    return null
  }
}
