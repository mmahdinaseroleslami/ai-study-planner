import { useState, useEffect } from 'react'
import { Save, RotateCcw, Shield, Palette, Clock, Check, Settings2, Sun, Moon, Monitor } from 'lucide-react'
import { useSettings } from '@/hooks'
import { AIConfigService } from '@/services'
import type { Theme } from '@/types'
import type { AIProviderType } from '@/types/ai'
import { DangerZone } from '@/components/settings/DangerZone'
import { PageHeader, Loading } from '@/components/common/PageHeader'
import { useToastStore, useThemeStore } from '@/stores'

/** صفحه تنظیمات — API Key از طریق AIConfigService در IndexedDB ذخیره می‌شود */
export default function Settings() {
  const { settings, loading, updateSettings, resetSettings } = useSettings()
  const toast = useToastStore()
  const { theme: liveTheme, setTheme: setLiveTheme } = useThemeStore()
  const [formData, setFormData] = useState({
    theme: 'system' as Theme,
    defaultStudyDuration: 60,
    breakDuration: 10,
    availableHoursStart: '08:00',
    availableHoursEnd: '20:00',
    aiProvider: '' as AIProviderType | '',
    apiKey: '',
    baseUrl: '',
    model: '',
  })
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setFormData((p) => ({
        ...p,
        theme: settings.theme,
        defaultStudyDuration: settings.defaultStudyDuration,
        breakDuration: settings.breakDuration,
        availableHoursStart: settings.availableHours.start,
        availableHoursEnd: settings.availableHours.end,
        aiProvider: settings.activeAiProvider as AIProviderType | '',
      }))
    }
    AIConfigService.load()
      .then((s) => {
        if (s.type) {
          setFormData((p) => ({
            ...p,
            aiProvider: s.type as AIProviderType | '',
            baseUrl: s.baseUrl,
            model: s.model,
          }))
        }
      })
      .catch(() => undefined)
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      let aiProviderSaved = false

      if (formData.aiProvider) {
        if (formData.apiKey.trim()) {
          // کلید جدید → ذخیره و فعال‌سازی همین ارائه‌دهنده
          await AIConfigService.save({
            type: formData.aiProvider,
            apiKey: formData.apiKey.trim(),
            baseUrl: formData.baseUrl,
            model: formData.model,
          })
          aiProviderSaved = true
        } else {
          // بدون کلید جدید → فقط اگر قبلاً برای همین ارائه‌دهنده کلید ذخیره شده باشد
          aiProviderSaved = await AIConfigService.activate(formData.aiProvider)
          if (!aiProviderSaved) {
            throw new Error('برای این ارائه‌دهنده، API Key را وارد کنید')
          }
        }
      }

      await updateSettings({
        theme: liveTheme,
        defaultStudyDuration: formData.defaultStudyDuration,
        breakDuration: formData.breakDuration,
        availableHours: { start: formData.availableHoursStart, end: formData.availableHoursEnd },
        // فقط وقتی یک ارائه‌دهنده واقعاً فعال شد، مرجع تنظیمات را عوض کن
        ...(aiProviderSaved ? { activeAiProvider: formData.aiProvider } : {}),
      })

      if (formData.apiKey.trim()) {
        setFormData((p) => ({ ...p, apiKey: '' }))
      }

      setSaved(true)
      toast.success('تنظیمات ذخیره شد')
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ذخیره'
      setSaveError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleProviderChange = async (value: AIProviderType | '') => {
    setFormData((p) => ({ ...p, aiProvider: value, apiKey: '' }))
    setSaveError(null)
    if (!value) return

    // Base URL و Model همان ارائه‌دهنده بارگذاری شوند؛ API Key عمداً نمایش داده نمی‌شود.
    const stored = await AIConfigService.loadFor(value)
    setFormData((p) => ({
      ...p,
      baseUrl: stored?.baseUrl ?? '',
      model: stored?.model ?? '',
    }))
  }

  const handleReset = async () => {
    if (!confirm('آیا از بازنشانی تنظیمات اطمینان دارید؟')) return
    try {
      await resetSettings()
      toast.success('تنظیمات بازنشانی شد')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در بازنشانی')
    }
  }

  if (loading) return <Loading label="در حال بارگذاری تنظیمات..." />

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 780, margin: '0 auto' }}>
      <PageHeader title="تنظیمات" subtitle="برنامه خود را شخصی‌سازی کنید" icon={Settings2} />

      {saveError && (
        <div
          style={{
            padding: '11px 15px',
            borderRadius: 12,
            background: 'var(--color-destructive-light)',
            border: '1px solid color-mix(in srgb, var(--color-destructive) 30%, transparent)',
            fontSize: 12.5,
            color: 'var(--color-destructive)',
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {saveError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ظاهر */}
        <Section icon={Palette} tone="primary" title="ظاهر" subtitle="تنظیمات تم و نمای برنامه">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { value: 'light' as const, icon: Sun, label: 'روشن' },
              { value: 'dark' as const, icon: Moon, label: 'تاریک' },
              { value: 'system' as const, icon: Monitor, label: 'سیستم' },
            ].map((opt) => {
              const Icon = opt.icon
              const active = liveTheme === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLiveTheme(opt.value)}
                  style={{
                    padding: '16px 10px',
                    borderRadius: 13,
                    border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-primary-light)' : 'var(--color-card)',
                    color: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 7,
                    transition: 'all 180ms var(--ease-out-quint)',
                  }}
                >
                  <Icon size={19} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* مطالعه */}
        <Section icon={Clock} tone="success" title="مطالعه" subtitle="تنظیمات جلسات مطالعه">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="مدت پیش‌فرض جلسه (دقیقه)">
              <input
                type="number"
                className="input"
                min={15}
                max={180}
                value={formData.defaultStudyDuration}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, defaultStudyDuration: parseInt(e.target.value) || 60 }))
                }
              />
            </Field>
            <Field label="مدت استراحت (دقیقه)">
              <input
                type="number"
                className="input"
                min={5}
                max={60}
                value={formData.breakDuration}
                onChange={(e) => setFormData((p) => ({ ...p, breakDuration: parseInt(e.target.value) || 10 }))}
              />
            </Field>
            <Field label="ساعت شروع مطالعه">
              <input
                type="time"
                className="input"
                value={formData.availableHoursStart}
                onChange={(e) => setFormData((p) => ({ ...p, availableHoursStart: e.target.value }))}
              />
            </Field>
            <Field label="ساعت پایان مطالعه">
              <input
                type="time"
                className="input"
                value={formData.availableHoursEnd}
                onChange={(e) => setFormData((p) => ({ ...p, availableHoursEnd: e.target.value }))}
              />
            </Field>
          </div>
        </Section>

        {/* AI */}
        <Section icon={Shield} tone="destructive" title="هوش مصنوعی" subtitle="تنظیمات ارائه‌دهنده AI">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="ارائه‌دهنده">
              <select
                className="input"
                value={formData.aiProvider}
                onChange={(e) => void handleProviderChange(e.target.value as AIProviderType | '')}
              >
                <option value="">انتخاب کنید...</option>
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
                <option value="custom">سفارشی (OpenAI Compatible)</option>
              </select>
            </Field>

            {formData.aiProvider === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Base URL">
                  <input
                    type="url"
                    className="input"
                    placeholder="https://api.example.com/v1"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData((p) => ({ ...p, baseUrl: e.target.value }))}
                  />
                </Field>
                <Field label="Model">
                  <input
                    type="text"
                    className="input"
                    placeholder="gpt-4o-mini"
                    value={formData.model}
                    onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
                  />
                </Field>
              </div>
            )}

            {formData.aiProvider && (
              <Field label="API Key جدید">
                <input
                  type="password"
                  className="input"
                  placeholder="برای تغییر، کلید جدید وارد کنید"
                  value={formData.apiKey}
                  onChange={(e) => setFormData((p) => ({ ...p, apiKey: e.target.value }))}
                />
                <p style={{ fontSize: 10.5, color: 'var(--color-muted-foreground)', marginTop: 6, lineHeight: 1.7 }}>
                  API Key فقط در IndexedDB همین مرورگر ذخیره می‌شود و به هیچ سروری ارسال نمی‌شود.
                </p>
              </Field>
            )}
          </div>
        </Section>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={handleReset} className="btn btn-secondary" style={{ fontSize: 12.5 }}>
            <RotateCcw size={14} /> بازنشانی
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {saved && (
              <span className="badge badge-success animate-scaleIn">
                <Check size={11} /> ذخیره شد
              </span>
            )}
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              <Save size={14} /> {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </div>

        <DangerZone onDeleted={() => window.location.reload()} />
      </div>
    </div>
  )
}

const TONES = {
  primary: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  success: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  destructive: { bg: 'var(--color-destructive-light)', color: 'var(--color-destructive)' },
} as const

function Section(props: {
  icon: typeof Palette
  tone: keyof typeof TONES
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const Icon = props.icon
  const tone = TONES[props.tone]
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: tone.bg,
            color: tone.color,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 13.5, margin: 0 }}>{props.title}</h2>
          <p style={{ fontSize: 11.5, color: 'var(--color-muted-foreground)', margin: 0 }}>{props.subtitle}</p>
        </div>
      </div>
      {props.children}
    </div>
  )
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{props.label}</label>
      {props.children}
    </div>
  )
}
