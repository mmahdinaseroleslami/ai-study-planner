import { useState, useEffect } from 'react'
import { SettingsService } from '@/services'
import type { UserSettings } from '@/types/settings'
import { applyTheme } from '@/utils/theme'

/**
 * Hook مدیریت تنظیمات
 */
export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // بارگذاری تنظیمات
  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await SettingsService.get()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری تنظیمات')
    } finally {
      setLoading(false)
    }
  }

  // به‌روزرسانی تنظیمات
  const updateSettings = async (input: Partial<UserSettings>) => {
    try {
      await SettingsService.update(input)
      setSettings((prev) => (prev ? { ...prev, ...input } : null))
      // اعمال فوری تم روی document
      if (input.theme) applyTheme(input.theme)
    } catch (err) {
      throw err instanceof Error ? err : new Error('خطا در به‌روزرسانی تنظیمات')
    }
  }

  // بازنشانی تنظیمات
  const resetSettings = async () => {
    try {
      await SettingsService.reset()
      await loadSettings()
    } catch (err) {
      throw err instanceof Error ? err : new Error('خطا در بازنشانی تنظیمات')
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    refresh: loadSettings,
  }
}
