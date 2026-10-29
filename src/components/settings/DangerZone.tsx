import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { DataService } from '@/services'
import { useToastStore } from '@/stores'

/** ناحیه خطر — حذف کامل داده‌ها (از طریق Service، نه db مستقیم) */
export function DangerZone(props: { onDeleted: () => void }) {
  const toast = useToastStore()
  const [busy, setBusy] = useState(false)

  const handleDeleteAll = async () => {
    if (
      !confirm(
        'تمام دروس، جلسات، مرورها، امتحانات، تنظیمات و تاریخچه چت برای همیشه حذف می‌شود. این عمل قابل بازگشت نیست. مطمئن هستید؟'
      )
    )
      return

    setBusy(true)
    try {
      await DataService.clearAll()
      toast.success('تمام داده‌ها حذف شد')
      props.onDeleted()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف داده‌ها')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        borderColor: 'color-mix(in srgb, var(--color-destructive) 32%, transparent)',
        background: 'color-mix(in srgb, var(--color-destructive) 4%, var(--color-card))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div
          className="icon-circle-destructive"
          style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', flexShrink: 0 }}
        >
          <AlertTriangle size={18} />
        </div>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--color-destructive)', margin: 0 }}>ناحیه خطر</h2>
          <p style={{ fontSize: 11.5, color: 'var(--color-muted-foreground)', margin: 0 }}>عملیات غیرقابل بازگشت</p>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--color-muted-foreground)', marginBottom: 16, lineHeight: 1.8 }}>
        با کلیک روی دکمه زیر تمام اطلاعات شما برای همیشه حذف می‌شود. اگر می‌خواهید نسخه پشتیبان بگیرید، قبل از ادامه صبر کنید.
      </p>
      <button onClick={handleDeleteAll} disabled={busy} className="btn btn-destructive" style={{ fontSize: 12.5 }}>
        <Trash2 size={14} /> {busy ? 'در حال حذف...' : 'حذف تمام داده‌ها'}
      </button>
    </div>
  )
}
