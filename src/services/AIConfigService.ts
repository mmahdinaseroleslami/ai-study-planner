import { db } from '@/db/schema'
import type { AIProviderType } from '@/types/ai'

/** ورودی ذخیره تنظیمات AI */
export interface SaveAIConfigInput {
  type: AIProviderType
  apiKey: string
  baseUrl?: string
  model?: string
}

/** خروجی خواندن تنظیمات AI */
export interface AIConfigState {
  type: AIProviderType | ''
  apiKey: string
  baseUrl: string
  model: string
}

/**
 * سرویس persistence تنظیمات AI — تنها مسیر مجاز UI برای خواندن/نوشتن
 * API Key و Provider. هیچ Component نباید مستقیم به db دسترسی داشته باشد.
 * مسیر: Component → Service → Dexie → IndexedDB
 */
export const AIConfigService = {
  async load(): Promise<AIConfigState> {
    const empty: AIConfigState = { type: '', apiKey: '', baseUrl: '', model: '' }
    try {
      const providers = await db.aiProviders.toArray()
      const active = providers.find((p) => p.isActive)
      if (active) {
        return {
          type: active.type,
          apiKey: active.apiKey,
          baseUrl: active.baseUrl ?? '',
          model: active.model ?? '',
        }
      }
      const settings = await db.userSettings.get('main')
      if (settings?.activeAiProvider) {
        // فقط اگر رکورد واقعی همان ارائه‌دهنده وجود داشته باشد؛ وگرنه وضعیت
        // stale قدیمی نباید در UI به‌عنوان یک اتصال معتبر نشان داده شود.
        const stored = providers.find((p) => p.type === settings.activeAiProvider)
        if (stored) {
          return {
            type: stored.type,
            apiKey: stored.apiKey,
            baseUrl: stored.baseUrl ?? '',
            model: stored.model ?? '',
          }
        }
      }
      return empty
    } catch {
      return empty
    }
  },

  /** خواندن تنظیمات ذخیره‌شده یک ارائه‌دهنده خاص (بدون فعال‌کردن آن) */
  async loadFor(type: AIProviderType): Promise<AIConfigState | null> {
    try {
      const provider = await db.aiProviders.where('type').equals(type).first()
      if (!provider) return null
      return {
        type: provider.type,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl ?? '',
        model: provider.model ?? '',
      }
    } catch {
      return null
    }
  },

  /**
   * فعال‌کردن یک ارائه‌دهنده ذخیره‌شده بدون نیاز به وارد کردن مجدد API Key.
   * اگر برای آن نوع کلیدی ذخیره نشده باشد false برمی‌گرداند.
   */
  async activate(type: AIProviderType): Promise<boolean> {
    const target = await db.aiProviders.where('type').equals(type).first()
    if (!target) return false

    await db.transaction('rw', db.aiProviders, db.userSettings, async () => {
      const all = await db.aiProviders.toArray()
      for (const p of all) {
        if (p.id === target.id) {
          if (!p.isActive) await db.aiProviders.update(p.id, { isActive: true })
        } else if (p.isActive) {
          await db.aiProviders.update(p.id, { isActive: false })
        }
      }

      const settings = await db.userSettings.get('main')
      if (settings) {
        await db.userSettings.update('main', { activeAiProvider: type })
      }
    })

    return true
  },

  async save(input: SaveAIConfigInput): Promise<void> {
    if (!input.type) throw new Error('ارائه‌دهنده انتخاب نشده است')
    if (!input.apiKey || input.apiKey.trim().length < 10) {
      throw new Error('API Key نامعتبر است')
    }

    // پاک‌سازی ورودی — کوتیشن و اسلش انتهایی نباید ذخیره شود
    const cleanBaseUrl = (input.baseUrl ?? '').trim().replace(/^["']+|["']+$/g, '').replace(/\/+$/, '')
    const cleanModel = (input.model ?? '').trim()

    if (input.type === 'custom') {
      if (!cleanBaseUrl) throw new Error('برای ارائه‌دهنده سفارشی، Base URL الزامی است')
      if (!cleanModel) throw new Error('برای ارائه‌دهنده سفارشی، نام Model الزامی است')
      if (!/^https?:\/\/.+/i.test(cleanBaseUrl)) {
        throw new Error('Base URL باید با http:// یا https:// شروع شود')
      }
    }

    const existing = await db.aiProviders.where('type').equals(input.type).first()

    if (existing) {
      await db.aiProviders.update(existing.id, {
        apiKey: input.apiKey.trim(),
        baseUrl: cleanBaseUrl,
        model: cleanModel,
        isActive: true,
      })
    } else {
      await db.aiProviders.add({
        id: crypto.randomUUID(),
        name: input.type,
        type: input.type,
        apiKey: input.apiKey.trim(),
        baseUrl: cleanBaseUrl,
        model: cleanModel,
        isActive: true,
        createdAt: new Date().toISOString(),
      })
    }

    // غیرفعال کردن سایر Providerها
    const all = await db.aiProviders.toArray()
    for (const p of all) {
      if (p.type !== input.type && p.isActive) {
        await db.aiProviders.update(p.id, { isActive: false })
      }
    }

    // همگام‌سازی با userSettings
    const settings = await db.userSettings.get('main')
    if (settings) {
      await db.userSettings.update('main', { activeAiProvider: input.type })
    }
  },
}
