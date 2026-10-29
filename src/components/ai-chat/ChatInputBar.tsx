import { Send, Loader2 } from 'lucide-react'

/** نوار ورودی چت */
export function ChatInputBar(props: {
  input: string
  isTyping: boolean
  isConfigured: boolean
  onChange: (v: string) => void
  onSend: () => void
}) {
  const { input, isTyping, isConfigured, onChange, onSend } = props

  return (
    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder={!isConfigured ? 'ابتدا تنظیمات AI را تکمیل کنید...' : 'پیام خود را بنویسید...'}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
          disabled={isTyping}
          style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || isTyping}
          style={{
            width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !input.trim() || isTyping ? 0.5 : 1,
          }}
        >
          {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
