import { db } from '@/db/schema'
import type { UserSettings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'

/**
 * سرویس مدیریت تنظیمات
 */
export const SettingsService = {
  /**
   * دریافت تنظیمات
   */
  async get(): Promise<UserSettings> {
    const settings = await db.userSettings.get('main')
    return settings ?? { ...DEFAULT_SETTINGS }
  },

  /**
   * به‌روزرسانی تنظیمات
   */
  async update(input: Partial<UserSettings>): Promise<void> {
    const current = await this.get()
    const updated: UserSettings = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    }
    await db.userSettings.put(updated)
  },

  /**
   * بازنشانی تنظیمات
   */
  async reset(): Promise<void> {
    await db.userSettings.clear()
    await db.userSettings.add({
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString(),
    })
  },
}
