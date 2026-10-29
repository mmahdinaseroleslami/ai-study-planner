import type { AIProvider, StudyPlanInput, StudyPlanProposal, ChatMessage, StudyContext, AIProviderType } from '@/types/ai'
import { parseAndValidateStudyPlan } from '@/utils/aiSchema'
import { buildStudyPlanPrompt } from '@/utils/studyPlanPrompt'

/** ساختار پاسخ OpenAI-Compatible — تایپ‌شده، بدون any */
interface ChatChoiceMessage {
  content?: string | null
  reasoning_content?: string | null
}
interface ChatChoice {
  message?: ChatChoiceMessage
}
interface ChatCompletionResponse {
  choices?: ChatChoice[]
}

/**
 * Provider هوش مصنوعی سازگار با OpenAI (Groq / OpenRouter / Custom)
 * درخواست مستقیم به API زده می‌شود (CORS توسط این Providerها پشتیبانی می‌شود)
 * و در dev از Vite proxy صرفاً به‌عنوان fallback استفاده می‌شود.
 */
export class OpenAICompatibleProvider implements AIProvider {
  name: string
  type: AIProviderType
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor(name: string, type: AIProviderType, apiKey: string, baseUrl: string, model: string) {
    this.name = name
    this.type = type
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.model = model
  }

  private extractContent(message: ChatChoiceMessage | undefined): string {
    if (!message) return ''
    if (typeof message.content === 'string' && message.content) return message.content
    if (typeof message.reasoning_content === 'string' && message.reasoning_content) return message.reasoning_content
    return ''
  }

  /**
   * استخراج JSON امن از متن خام (پشتیبانی از SSE trailing data)
   */
  private parseJsonResponse(responseText: string): ChatCompletionResponse {
    const cleaned = responseText.replace(/data:\s*\[DONE\]\s*$/i, '').trim()
    try {
      return JSON.parse(cleaned) as ChatCompletionResponse
    } catch {
      throw new Error(`پاسخ ${this.name} قابل پردازش نیست`)
    }
  }

  private async apiRequest(path: string, body: Record<string, unknown>): Promise<ChatCompletionResponse> {
    return this.apiRequestWithKey(path, this.apiKey, body)
  }

  async generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanProposal> {
    const prompt = buildStudyPlanPrompt(input)
    const data = await this.apiRequest('/chat/completions', {
      model: this.model,
      messages: [
        { role: 'system', content: 'شما یک برنامه‌ریز مطالعه هستید. فقط JSON برگردانید.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    })

    const text = this.extractContent(data.choices?.[0]?.message)

    if (!text) throw new Error(`پاسخ ${this.name} خالی است`)
    // Parse → Validate (Zod) — مسیر اجباری
    return parseAndValidateStudyPlan(text, input.startDate)
  }

  async chat(messages: ChatMessage[], context: StudyContext): Promise<string> {
    const systemPrompt = this.buildChatSystemPrompt(context)
    const userMessages = messages.map((m) => ({ role: m.role, content: m.content }))

    const data = await this.apiRequest('/chat/completions', {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...userMessages,
      ],
      temperature: 0.7,
    })

    return this.extractContent(data.choices?.[0]?.message) || '(پاسخ خالی)'
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      await this.apiRequestWithKey('/chat/completions', apiKey, {
        model: this.model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      })
      return true
    } catch {
      return false
    }
  }

  private async apiRequestWithKey(path: string, key: string, body: Record<string, unknown>): Promise<ChatCompletionResponse> {
    const targetUrl = `${this.baseUrl}${path}`

    // تلاش اول: درخواست مستقیم (در production و بیشتر محیط‌های dev جواب می‌دهد)
    try {
      const direct = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      })
      if (direct.ok) {
        return this.parseJsonResponse(await direct.text())
      }
      // اگر خطای CORS/شبکه نبود بلکه خطای API بود، همان را گزارش کن
      if (direct.status !== 0) {
        const text = await direct.text().catch(() => '')
        throw new Error(`خطای ${direct.status} از ${this.name}: ${text.substring(0, 200)}`)
      }
    } catch (err) {
      // اگر خطای TypeError (احتمال CORS در dev) بود، fallback به proxy
      if (!(err instanceof TypeError)) throw err
    }

    // Fallback: Vite dev proxy (فقط localhost)
    const response = await fetch(`/api-proxy${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'X-Target-URL': targetUrl,
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()

    if (!response.ok) {
      throw new Error(`خطای ${response.status} از ${this.name}: ${text.substring(0, 200)}`)
    }

    return this.parseJsonResponse(text)
  }

  private buildChatSystemPrompt(context: StudyContext): string {
    return `شما یک دستیار مطالعه هوشمند هستید. با کاربر به فارسی صحبت کنید.
امروز: ${context.todaySchedule}
هفته: ${context.weekSchedule}
دروس: ${context.subjects}
امتحانات: ${context.exams}
مرورها: ${context.reviews}`
  }
}

export function createGroqProvider(apiKey: string): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider('Groq', 'groq', apiKey, 'https://api.groq.com/openai/v1', 'llama-3.1-70b-versatile')
}
export function createOpenRouterProvider(apiKey: string): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider('OpenRouter', 'openrouter', apiKey, 'https://openrouter.ai/api/v1', 'anthropic/claude-3-haiku')
}
export function createCustomProvider(apiKey: string, baseUrl: string, model: string): OpenAICompatibleProvider {
  // پاک‌سازی: برخی نسخه‌های قبلی مقدار را با کوتیشن ذخیره می‌کردند و
  // نتیجه‌اش URL نامعتبر مثل "https://api.example.com/v1" بود.
  const cleanUrl = baseUrl.trim().replace(/^["']+|["']+$/g, '').replace(/\/+$/, '')
  return new OpenAICompatibleProvider('Custom', 'custom', apiKey, cleanUrl, model.trim())
}
