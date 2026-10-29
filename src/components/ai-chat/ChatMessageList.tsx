import { Loader2, Sparkles, BookOpen, Calendar, RotateCcw } from 'lucide-react'
import type { ChatMessage } from '@/types/ai'

/** لیست پیام‌های چت + empty state با پیشنهادهای سریع */
export function ChatMessageList(props: {
  messages: ChatMessage[]
  isTyping: boolean
  onSuggestion: (text: string) => void
  endRef: React.RefObject<HTMLDivElement | null>
}) {
  const { messages, isTyping, onSuggestion, endRef } = props

  const quickSuggestions = [
    { icon: BookOpen, text: 'برنامه امروز من چیست؟' },
    { icon: Calendar, text: 'امتحانات پیش رو' },
    { icon: RotateCcw, text: 'مرورهای امروز' },
    { icon: Sparkles, text: 'چطور بهتر مطالعه کنم؟' },
  ]

  if (messages.length === 0 && !isTyping) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Sparkles className="w-14 h-14" style={{ color: '#e2e8f0' }} />
          <h3 style={{ fontWeight: 700, margin: '12px 0 4px' }}>شروع چت</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>سوال خود را بپرسید</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {quickSuggestions.map((s) => (
              <button
                key={s.text}
                onClick={() => onSuggestion(s.text)}
                style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#64748b' }}
              >
                <s.icon className="w-4 h-4" /> {s.text}
              </button>
            ))}
          </div>
        </div>
        <div ref={endRef} />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
      {messages.map((m) => (
        <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end' }}>
          <div style={{
            maxWidth: '80%', padding: '12px 16px', borderRadius: 16, fontSize: 13, lineHeight: 1.6,
            background: m.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f1f5f9',
            color: m.role === 'user' ? 'white' : '#1e293b',
            borderBottomRightRadius: m.role === 'user' ? 4 : 16,
            borderBottomLeftRadius: m.role === 'user' ? 16 : 4,
          }}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.content}</p>
            <p style={{ fontSize: 10, marginTop: 4, opacity: 0.6, margin: '4px 0 0' }}>
              {new Date(m.timestamp).toLocaleTimeString('fa-IR')}
            </p>
          </div>
        </div>
      ))}
      {isTyping && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>در حال تایپ...</span>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
