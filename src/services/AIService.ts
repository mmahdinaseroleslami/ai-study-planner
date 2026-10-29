import type { AIProvider, StudyPlanInput, StudyPlanProposal, ChatMessage, StudyContext, AIProviderType } from '@/types/ai'
import { db } from '@/db/schema'
import { GeminiProvider } from './providers/GeminiProvider'
import { createGroqProvider, createOpenRouterProvider, createCustomProvider } from './providers/OpenAICompatibleProvider'

/**
 * سرویس اصلی هوش مصنوعی
 * خودکار Provider را از IndexedDB بارگذاری می‌کند
 */
export const AIService = {
  currentProvider: null as AIProvider | null,

  /**
   * بارگذاری خودکار Provider از IndexedDB
   */
  async initProvider(): Promise<boolean> {
    try {
      const config = await db.aiProviders.filter((p) => p.isActive === true).first()
      if (!config) {
        // اگر aiProviders خالی بود، از userSettings بخوان
        const settings = await db.userSettings.get('main')
        if (!settings?.activeAiProvider) return false

        const providers = await db.aiProviders.toArray()
        const found = providers.find((p) => p.type === settings.activeAiProvider)
        if (!found) return false
        return this.createAndRegister(found)
      }
      return this.createAndRegister(config)
    } catch {
      return false
    }
  },

  /**
   * ایجاد Provider از تنظیمات ذخیره شده
   */
  createAndRegister(config: { type: AIProviderType; apiKey: string; baseUrl?: string; model?: string }): boolean {
    let provider: AIProvider | null = null

    switch (config.type) {
      case 'gemini':
        provider = new GeminiProvider(config.apiKey)
        break
      case 'groq':
        provider = createGroqProvider(config.apiKey)
        break
      case 'openrouter':
        provider = createOpenRouterProvider(config.apiKey)
        break
      case 'custom':
        if (config.baseUrl && config.model) {
          provider = createCustomProvider(config.apiKey, config.baseUrl, config.model)
        }
        break
    }

    if (provider) {
      this.currentProvider = provider
      return true
    }
    return false
  },

  /**
   * ثبت Provider جدید
   */
  registerProvider(provider: AIProvider): void {
    this.currentProvider = provider
  },

  /**
   * تولید برنامه مطالعه
   */
  async generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanProposal> {
    // اگر Provider نیست، سعی کن بارگذاری کنی
    if (!this.currentProvider) {
      await this.initProvider()
    }
    if (!this.currentProvider) {
      throw new Error('AI Provider فعال نیست. لطفاً ابتدا تنظیمات AI را در صفحه چت یا تنظیمات تکمیل کنید.')
    }
    return this.currentProvider.generateStudyPlan(input)
  },

  /**
   * چت با AI
   */
  async chat(messages: ChatMessage[], context: StudyContext): Promise<string> {
    if (!this.currentProvider) {
      await this.initProvider()
    }
    if (!this.currentProvider) {
      throw new Error('AI Provider فعال نیست.')
    }
    return this.currentProvider.chat(messages, context)
  },

  /**
   * اعتبارسنجی API Key
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!this.currentProvider) {
      await this.initProvider()
    }
    if (!this.currentProvider) return false
    return this.currentProvider.validateApiKey(apiKey)
  },

  /**
   * تست اتصال با یک کانفیگ موقت — بدون دست‌کاری Provider فعال.
   * UI باید از این متد استفاده کند، نه fetch مستقیم.
   */
  async testConnection(config: { type: AIProviderType; apiKey: string; baseUrl?: string; model?: string }): Promise<string> {
    let provider: AIProvider | null = null
    switch (config.type) {
      case 'gemini':
        provider = new GeminiProvider(config.apiKey)
        break
      case 'groq':
        provider = createGroqProvider(config.apiKey)
        break
      case 'openrouter':
        provider = createOpenRouterProvider(config.apiKey)
        break
      case 'custom':
        if (!config.baseUrl || !config.model) throw new Error('Base URL و Model الزامی است')
        provider = createCustomProvider(config.apiKey, config.baseUrl, config.model)
        break
    }
    if (!provider) throw new Error('Provider فعال نیست')

    const ok = await provider.validateApiKey(config.apiKey)
    if (!ok) throw new Error('اتصال ناموفق بود — API Key یا تنظیمات را بررسی کنید')

    // یک چت کوتاه برای اطمینان از سلامت واقعی
    const reply = await provider.chat(
      [{ id: 'test', role: 'user', content: 'سلام', timestamp: new Date().toISOString(), createdAt: new Date().toISOString() }],
      { todaySchedule: '-', weekSchedule: '-', subjects: '-', exams: '-', reviews: '-' }
    )
    return reply.substring(0, 120) || 'پاسخ دریافت شد'
  },

  /**
   * ساخت و ثبت Provider موقت از کانفیگ فرم (برای ارسال پیام)
   */
  registerFromConfig(config: { type: AIProviderType; apiKey: string; baseUrl?: string; model?: string }): boolean {
    return this.createAndRegister(config)
  },

  /**
   * دریافت Provider فعال
   */
  getActiveProvider(): AIProvider | null {
    return this.currentProvider
  },
}
