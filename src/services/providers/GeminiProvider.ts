import type { AIProvider, StudyPlanInput, StudyPlanProposal, ChatMessage, StudyContext } from '@/types/ai'
import { parseAndValidateStudyPlan } from '@/utils/aiSchema'
import { buildStudyPlanPrompt } from '@/utils/studyPlanPrompt'

/** ساختار پاسخ Gemini — تایپ‌شده، بدون any */
interface GeminiPart {
  text?: string
}
interface GeminiContent {
  parts?: GeminiPart[]
}
interface GeminiCandidate {
  content?: GeminiContent
}
interface GeminiResponse {
  candidates?: GeminiCandidate[]
}

/**
 * Provider هوش مصنوعی Gemini (Google)
 * نکته امنیتی: API Key هرگز در URL قرار نمی‌گیرد؛
 * طبق مستندات Google از هدر x-goog-api-key استفاده می‌شود.
 */
export class GeminiProvider implements AIProvider {
  name = 'Gemini'
  type = 'gemini' as const

  private apiKey: string
  private model: string
  private baseUrl: string

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey
    this.model = model
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.apiKey,
    }
  }

  private extractText(data: GeminiResponse): string {
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  async generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanProposal> {
    const prompt = buildStudyPlanPrompt(input)

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!response.ok) {
      throw new Error('خطا در ارتباط با Gemini')
    }

    const data = (await response.json()) as GeminiResponse
    const text = this.extractText(data)

    if (!text) {
      throw new Error('پاسخ Gemini نامعتبر است')
    }

    // Parse → Validate (Zod) — مسیر اجباری
    return parseAndValidateStudyPlan(text, input.startDate)
  }

  async chat(messages: ChatMessage[], context: StudyContext): Promise<string> {
    const prompt = this.buildChatPrompt(messages, context)

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!response.ok) {
      throw new Error('خطا در ارتباط با Gemini')
    }

    const data = (await response.json()) as GeminiResponse
    return this.extractText(data)
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }

  private buildChatPrompt(messages: ChatMessage[], context: StudyContext): string {
    const contextText = `
## Context برنامه فعلی:
برنامه امروز: ${context.todaySchedule}
برنامه هفته: ${context.weekSchedule}
درس‌ها: ${context.subjects}
امتحانات: ${context.exams}
مرورها: ${context.reviews}
`
    const messagesText = messages
      .map((m) => `${m.role === 'user' ? 'کاربر' : 'AI'}: ${m.content}`)
      .join('\n')

    return `
شما یک دستیار مطالعه هوشمند هستید. با کاربر به فارسی صحبت کنید.

${contextText}

## مکالمه:
${messagesText}

## پاسخ:
`
  }
}
