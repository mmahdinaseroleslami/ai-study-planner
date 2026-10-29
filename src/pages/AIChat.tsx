import { useState, useEffect, useRef } from 'react'
import { Sparkles, Trash2, Settings2, Send, Loader2, Bot, User } from 'lucide-react'
import { useChatStore } from '@/stores'
import { AIService, AIConfigService, StudySessionService, SubjectService, ExamService, ReviewService } from '@/services'
import type { ChatMessage, StudyContext, AIProviderType } from '@/types/ai'
import { getToday } from '@/utils/date'
import { ChatSettingsPanel } from '@/components/ai-chat/ChatSettingsPanel'
import { PageHeader } from '@/components/common/PageHeader'

const SUGGESTIONS = [
  'برنامه امروز من چیست؟',
  'امتحانات پیش رو را چطور اولویت‌بندی کنم؟',
  'مرورهای امروز کدام‌اند؟',
  'چطور بهتر و عمیق‌تر مطالعه کنم؟',
]

/** صفحه چت — فقط از Service Layer استفاده می‌کند، بدون دسترسی مستقیم به db */
export default function AIChat() {
  const { messages, isTyping, addMessage, setTyping, clearMessages, loadMessages } = useChatStore()
  const [input, setInput] = useState('')
  const [aiProvider, setAiProvider] = useState<AIProviderType | ''>('')
  const [apiKey, setApiKey] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testMessage, setTestMessage] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    AIConfigService.load()
      .then((s) => {
        setAiProvider(s.type)
        setApiKey(s.apiKey)
        setCustomBaseUrl(s.baseUrl)
        setCustomModel(s.model)
      })
      .catch(() => undefined)
  }, [])

  const isConfigured = Boolean(
    aiProvider && apiKey && (aiProvider !== 'custom' || (customBaseUrl && customModel))
  )

  const saveSettings = async () => {
    try {
      if (!aiProvider) throw new Error('ارائه‌دهنده را انتخاب کنید')
      await AIConfigService.save({ type: aiProvider, apiKey, baseUrl: customBaseUrl, model: customModel })
      AIService.registerFromConfig({ type: aiProvider, apiKey, baseUrl: customBaseUrl, model: customModel })
      setTestResult('success')
      setTestMessage('تنظیمات با موفقیت ذخیره شد')
    } catch (err) {
      setTestResult('error')
      setTestMessage(err instanceof Error ? err.message : 'خطا در ذخیره تنظیمات')
    }
  }

  const testConnection = async () => {
    if (!aiProvider || !apiKey) {
      setTestResult('error')
      setTestMessage('API Key و ارائه‌دهنده را وارد کنید')
      return
    }
    setTesting(true)
    setTestResult(null)
    setTestMessage('')
    try {
      const reply = await AIService.testConnection({
        type: aiProvider,
        apiKey,
        baseUrl: customBaseUrl,
        model: customModel,
      })
      setTestResult('success')
      setTestMessage(`اتصال موفق — پاسخ: "${reply}"`)
    } catch (err) {
      setTestResult('error')
      setTestMessage(`خطا در اتصال: ${err instanceof Error ? err.message : 'خطای ناشناخته'}`)
    } finally {
      setTesting(false)
    }
  }

  const buildContext = async (): Promise<StudyContext> => {
    const today = getToday()
    const [sess, sub, ex, rev] = await Promise.all([
      StudySessionService.getAll(),
      SubjectService.getAll(),
      ExamService.getAll(),
      ReviewService.getToday(),
    ])
    const name = (id: string) => sub.find((x) => x.id === id)?.name ?? '?'
    return {
      todaySchedule:
        sess
          .filter((s) => s.date === today)
          .map((s) => `${s.startTime}-${s.endTime} ${name(s.subjectId)}`)
          .join('\n') || 'ثبت نشده',
      weekSchedule:
        sess
          .slice(0, 40)
          .map((s) => `${s.date} ${s.startTime}-${s.endTime} ${name(s.subjectId)}`)
          .join('\n') || 'ثبت نشده',
      subjects: sub.map((s) => `${s.name} (${s.weeklyHours} ساعت در هفته)`).join('\n') || 'ثبت نشده',
      exams: ex.map((e) => `${name(e.subjectId)} - ${e.date}`).join('\n') || 'ثبت نشده',
      reviews: rev.map((r) => `${name(r.subjectId)} - مرور ${r.reviewNumber}`).join('\n') || 'ثبت نشده',
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isTyping) return
    if (!isConfigured || !aiProvider) {
      setShowSettings(true)
      return
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    addMessage(userMsg)
    setInput('')
    setTyping(true)

    try {
      AIService.registerFromConfig({ type: aiProvider, apiKey, baseUrl: customBaseUrl, model: customModel })
      const context = await buildContext()
      const recent = messages.slice(-10)
      const response = await AIService.chat([...recent, userMsg], context)
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `خطا: ${err instanceof Error ? err.message : 'نامشخص'}`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
    } finally {
      setTyping(false)
      inputRef.current?.focus()
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const applySuggestion = (text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }

  return (
    <div
      className="animate-fadeIn"
      style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', minHeight: 480 }}
    >
      <PageHeader
        title="چت با AI"
        subtitle={isConfigured ? 'دستیار مطالعه‌ات آماده است' : 'برای شروع، اتصال AI را تنظیم کن'}
        icon={Sparkles}
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`btn ${showSettings ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12 }}
            >
              <Settings2 size={14} /> تنظیمات
            </button>
            <button
              onClick={() => {
                if (messages.length === 0 || confirm('تمام تاریخچه چت پاک شود؟')) clearMessages()
              }}
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
            >
              <Trash2 size={14} /> پاک کردن
            </button>
          </div>
        }
      />

      {showSettings && (
        <ChatSettingsPanel
          aiProvider={aiProvider}
          apiKey={apiKey}
          customBaseUrl={customBaseUrl}
          customModel={customModel}
          testing={testing}
          testResult={testResult}
          testMessage={testMessage}
          isConfigured={isConfigured}
          onProviderChange={(v) => {
            setAiProvider(v)
            setTestResult(null)
            setTestMessage('')
            if (!v) {
              setApiKey('')
              setCustomBaseUrl('')
              setCustomModel('')
              return
            }
            // کلید مربوط به همان ارائه‌دهنده بارگذاری می‌شود، نه کلید قبلی
            void AIConfigService.loadFor(v).then((stored) => {
              setApiKey(stored?.apiKey ?? '')
              setCustomBaseUrl(stored?.baseUrl ?? '')
              setCustomModel(stored?.model ?? '')
            })
          }}
          onApiKeyChange={(v) => {
            setApiKey(v)
            setTestResult(null)
            setTestMessage('')
          }}
          onBaseUrlChange={(v) => {
            setCustomBaseUrl(v)
            setTestResult(null)
            setTestMessage('')
          }}
          onModelChange={(v) => {
            setCustomModel(v)
            setTestResult(null)
            setTestMessage('')
          }}
          onSave={saveSettings}
          onTest={testConnection}
        />
      )}

      {/* پیام‌ها */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: '4px 4px 16px',
        }}
      >
        {messages.length === 0 && !isTyping ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 24,
            }}
          >
            <div
              className="gradient-primary animate-float"
              style={{
                width: 62,
                height: 62,
                borderRadius: 20,
                display: 'grid',
                placeItems: 'center',
                marginBottom: 18,
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Sparkles size={28} color="white" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>چطور می‌توانم کمکت کنم؟</h3>
            <p
              style={{
                fontSize: 12.5,
                color: 'var(--color-muted-foreground)',
                marginBottom: 24,
                maxWidth: 380,
                lineHeight: 1.9,
              }}
            >
              درباره برنامه مطالعه، اولویت‌بندی دروس، یا روش‌های یادگیری بپرس. من برنامه‌ات را می‌بینم.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 520 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => applySuggestion(s)}
                  className="lift"
                  style={{
                    padding: '9px 15px',
                    borderRadius: 11,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-muted-foreground)',
                    fontFamily: 'inherit',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={m.id}
                className="animate-fadeIn"
                style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end', gap: 9 }}
              >
                {!isUser && (
                  <div
                    className="gradient-primary"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      alignSelf: 'flex-end',
                    }}
                  >
                    <Bot size={15} color="white" />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '78%',
                    padding: '11px 15px',
                    borderRadius: 16,
                    fontSize: 13,
                    lineHeight: 1.85,
                    background: isUser ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--color-card)',
                    color: isUser ? 'white' : 'var(--color-foreground)',
                    border: isUser ? 'none' : '1px solid var(--color-border)',
                    borderBottomRightRadius: isUser ? 5 : 16,
                    borderBottomLeftRadius: isUser ? 16 : 5,
                    boxShadow: isUser ? '0 4px 16px -6px rgba(99,102,241,0.5)' : 'var(--shadow-xs)',
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</p>
                  <p
                    style={{
                      fontSize: 9.5,
                      marginTop: 5,
                      margin: '5px 0 0',
                      opacity: 0.55,
                      textAlign: isUser ? 'left' : 'right',
                    }}
                  >
                    {new Date(m.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {isUser && (
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      background: 'var(--color-muted)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      alignSelf: 'flex-end',
                      color: 'var(--color-muted-foreground)',
                    }}
                  >
                    <User size={15} />
                  </div>
                )}
              </div>
            )
          })
        )}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
            <div
              className="gradient-primary"
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                alignSelf: 'flex-end',
              }}
            >
              <Bot size={15} color="white" />
            </div>
            <div
              style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                padding: '14px 18px',
                borderRadius: 16,
                borderBottomLeftRadius: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ورودی */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 14,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          placeholder={!isConfigured ? 'ابتدا تنظیمات AI را تکمیل کنید...' : 'پیام خود را بنویسید... (Enter برای ارسال)'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isTyping}
          style={{
            flex: 1,
            padding: '12px 15px',
            borderRadius: 14,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-card)',
            color: 'var(--color-foreground)',
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'none',
            maxHeight: 130,
            lineHeight: 1.7,
            transition: 'border-color 180ms ease, box-shadow 180ms ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)'
            e.currentTarget.style.boxShadow = '0 0 0 3.5px color-mix(in srgb, var(--color-primary) 14%, transparent)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          aria-label="ارسال"
          className="btn btn-primary"
          style={{ width: 46, height: 46, padding: 0, borderRadius: 14, flexShrink: 0 }}
        >
          {isTyping ? <Loader2 size={17} className="animate-spin-slow" /> : <Send size={17} />}
        </button>
      </div>
    </div>
  )
}
