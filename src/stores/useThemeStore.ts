import { create } from 'zustand'
import type { Theme } from '@/types'
import { applyTheme, readStoredTheme } from '@/utils/theme'
import { SettingsService } from '@/services'

/**
 * منبع واحد حقیقت برای تم.
 * قبلاً Header، useSettings و SettingsService هر سه نسخه خودشان را داشتند
 * و روی هم می‌نوشتند؛ نتیجه این بود که انتخاب کاربر ذخیره نمی‌شد.
 */
interface ThemeState {
  theme: Theme
  hydrated: boolean
  hydrate: () => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
  cycleTheme: () => Promise<void>
}

const CYCLE: Theme[] = ['light', 'dark', 'system']

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return
    try {
      const settings = await SettingsService.get()
      set({ theme: settings.theme, hydrated: true })
      applyTheme(settings.theme)
    } catch {
      const fallback = readStoredTheme() ?? 'system'
      set({ theme: fallback, hydrated: true })
      applyTheme(fallback)
    }
  },

  setTheme: async (theme) => {
    set({ theme })
    applyTheme(theme)
    try {
      await SettingsService.update({ theme })
    } catch {
      /* تم ظاهری است؛ شکست ذخیره نباید UI را بشکند */
    }
  },

  cycleTheme: async () => {
    const current = get().theme
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length] ?? 'system'
    await get().setTheme(next)
  },
}))
