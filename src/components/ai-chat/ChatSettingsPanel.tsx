import { Check, Loader2, Zap } from 'lucide-react'
import type { AIProviderType } from '@/types/ai'

/** Props پنل تنظیمات AI */
export interface ChatSettingsPanelProps {
  aiProvider: AIProviderType | ''
  apiKey: string
  customBaseUrl: string
  customModel: string
  testing: boolean
  testResult: 'success' | 'error' | null
  testMessage: string
  isConfigured: boolean
  onProviderChange: (v: AIProviderType | '') => void
  onApiKeyChange: (v: string) => void
  onBaseUrlChange: (v: string) => void
  onModelChange: (v: string) => void
  onSave: () => void
  onTest: () => void
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 6,
}

/** پنل تنظیمات اتصال AI — فقط presentational، بدون دسترسی به db */
export function ChatSettingsPanel(props: ChatSettingsPanelProps) {
  const {
    aiProvider,
    apiKey,
    customBaseUrl,
    customModel,
    testing,
    testResult,
    testMessage,
    isConfigured,
    onProviderChange,
    onApiKeyChange,
    onBaseUrlChange,
    onModelChange,
    onSave,
    onTest,
  } = props

  return (
    <div className="card animate-scaleIn" style={{ marginBottom: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>تنظیمات اتصال AI</h3>
        {isConfigured && (
          <span className="badge badge-success">
            <Check size={11} /> پیکربندی شده
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div>
          <label style={labelStyle}>ارائه‌دهنده</label>
          <select
            className="input"
            value={aiProvider}
            onChange={(e) => onProviderChange(e.target.value as AIProviderType | '')}
          >
            <option value="">انتخاب...</option>
            <option value="gemini">Google Gemini</option>
            <option value="groq">Groq</option>
            <option value="openrouter">OpenRouter</option>
            <option value="custom">سفارشی (OpenAI Compatible)</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>API Key</label>
          <input
            type="password"
            className="input"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
        </div>
        {aiProvider === 'custom' && (
          <>
            <div>
              <label style={labelStyle}>Base URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://api.example.com/v1"
                value={customBaseUrl}
                onChange={(e) => onBaseUrlChange(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Model</label>
              <input
                type="text"
                className="input"
                placeholder="gpt-4o-mini"
                value={customModel}
                onChange={(e) => onModelChange(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {testMessage && (
        <div
          style={{
            marginTop: 14,
            padding: '11px 14px',
            borderRadius: 11,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.7,
            background: testResult === 'success' ? 'var(--color-success-light)' : 'var(--color-destructive-light)',
            color: testResult === 'success' ? 'var(--color-success)' : 'var(--color-destructive)',
            border: `1px solid ${
              testResult === 'success'
                ? 'color-mix(in srgb, var(--color-success) 30%, transparent)'
                : 'color-mix(in srgb, var(--color-destructive) 30%, transparent)'
            }`,
          }}
        >
          {testMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onSave} className="btn btn-primary" style={{ fontSize: 12.5 }}>
          <Check size={14} /> ذخیره تنظیمات
        </button>
        <button onClick={onTest} disabled={testing || !isConfigured} className="btn btn-secondary" style={{ fontSize: 12.5 }}>
          {testing ? (
            <>
              <Loader2 size={14} className="animate-spin-slow" /> در حال تست...
            </>
          ) : (
            <>
              <Zap size={14} /> تست اتصال
            </>
          )}
        </button>
      </div>
    </div>
  )
}
