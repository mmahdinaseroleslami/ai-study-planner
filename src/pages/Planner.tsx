import { useState, useEffect } from 'react'
import { Sparkles, AlertCircle, AlertTriangle, CheckCircle2, Wand2 } from 'lucide-react'
import { useSubjects } from '@/hooks'
import { usePlannerStore } from '@/stores'
import { AIService, StudySessionService, SettingsService } from '@/services'
import type { StudyPlanInput, StudyPlanProposal } from '@/types/ai'
import type { CreateStudySessionInput, StudySession } from '@/types'
import { findAllConflicts, type ConflictInfo } from '@/utils/conflict'
import { constrainProposalToPlan } from '@/utils/aiSchema'
import { PlannerForm } from '@/components/planner/PlannerForm'
import { AIProposal } from '@/components/planner/AIProposal'
import { ConflictAlert } from '@/components/planner/ConflictAlert'
import { PageHeader } from '@/components/common/PageHeader'

/** صفحه برنامه‌ریز — جریان: AI → Validate(Zod در Provider) → ConflictCheck → Confirm → Save */
export default function Planner() {
  const { subjects } = useSubjects()
  const {
    selectedSubjects,
    availableHours,
    startDate,
    endDate,
    preference,
    studyMethods,
    methodNote,
    strengths,
    weaknesses,
    toggleSubject,
    setAvailableHours,
    setStartDate,
    setEndDate,
    setPreference,
    toggleMethod,
    setMethodNote,
    setStrengths,
    setWeaknesses,
  } = usePlannerStore()

  const [minDuration, setMinDuration] = useState(30)
  const [maxDuration, setMaxDuration] = useState(120)
  const [breakDuration, setBreakDuration] = useState(10)
  const [aiReady, setAiReady] = useState(false)
  const [proposal, setProposal] = useState<StudyPlanProposal | null>(null)
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setAiReady(await AIService.initProvider())
      const s = await SettingsService.get()
      if (s) {
        setAvailableHours(s.availableHours)
        setBreakDuration(s.breakDuration)
        setMinDuration(s.defaultStudyDuration)
      }
    }
    load()
  }, [setAvailableHours])

  const generatePlan = async () => {
    if (selectedSubjects.length === 0) {
      setError('لطفاً حداقل یک درس انتخاب کنید')
      return
    }
    if (!startDate || !endDate) {
      setError('لطفاً تاریخ شروع و پایان را مشخص کنید')
      return
    }
    if (startDate > endDate) {
      setError('تاریخ پایان باید بعد از تاریخ شروع باشد')
      return
    }
    if (minDuration > maxDuration) {
      setError('حداقل مدت جلسه نباید بیشتر از حداکثر مدت باشد')
      return
    }
    if (availableHours.start >= availableHours.end) {
      setError('ساعت پایان ساعات آزاد باید بعد از ساعت شروع باشد')
      return
    }
    if (!aiReady) {
      setError('AI متصل نیست. لطفاً ابتدا از صفحه چت یا تنظیمات، اتصال AI را انجام دهید.')
      return
    }

    setLoading(true)
    setError(null)
    setWarning(null)
    setProposal(null)
    setConflicts([])
    try {
      const input: StudyPlanInput = {
        subjectIds: selectedSubjects,
        subjectNames: Object.fromEntries(subjects.map((s) => [s.id, s.name])),
        availableHours,
        startDate,
        endDate,
        preferences: {
          type: preference,
          minSessionDuration: minDuration,
          maxSessionDuration: maxDuration,
          breakDuration,
        },
        studyMethods,
        methodNote,
        strengths,
        weaknesses,
        exams: subjects
          .filter((s) => s.examDate && selectedSubjects.includes(s.id))
          .map((s) => ({ subjectId: s.id, date: s.examDate as string })),
      }
      // خروجی همین‌جا توسط Zod اعتبارسنجی می‌شود (داخل Provider)
      const result = await AIService.generateStudyPlan(input)

      // اعتبارسنجی دامنه‌ای: فقط دروس انتخاب‌شده و فقط داخل بازه هدف
      const constrained = constrainProposalToPlan(result, {
        subjectIds: selectedSubjects,
        startDate,
        endDate,
      })
      if (constrained.proposal.sessions.length === 0) {
        throw new Error('AI هیچ جلسه معتبری برای دروس انتخاب‌شده و بازه مشخص‌شده برنگرداند. دوباره تلاش کنید.')
      }
      if (constrained.dropped > 0) {
        setWarning(
          `${constrained.dropped} جلسه از پیشنهاد AI به دلیل درس نامعتبر یا تاریخ خارج از بازه نادیده گرفته شد.`
        )
      }
      const feasible = constrained.proposal

      // Conflict Detection: تداخل داخلی proposal + تداخل با جلسات موجود
      const existing = await StudySessionService.getAll()
      const asSessions = feasible.sessions.map(
        (s, i) =>
          ({
            id: `proposal-${i}`,
            subjectId: s.subjectId,
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime,
            type: s.type,
            status: 'pending',
            source: 'ai',
            createdAt: new Date().toISOString(),
          }) as StudySession
      )
      setConflicts(findAllConflicts([...existing, ...asSessions]))
      setProposal(feasible)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تولید برنامه')
    } finally {
      setLoading(false)
    }
  }

  const savePlan = async () => {
    if (!proposal) return
    const message =
      conflicts.length > 0
        ? `${conflicts.length} تداخل زمانی تشخیص داده شد. باز هم ذخیره شود؟`
        : 'برنامه پیشنهادی ذخیره شود؟'
    if (!confirm(message)) return

    setLoading(true)
    setError(null)
    try {
      const inputs: CreateStudySessionInput[] = proposal.sessions.map((session) => ({
        subjectId: session.subjectId,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        type: session.type,
        method: session.method,
        source: 'ai',
      }))

      // فقط جلسات AI در همین بازه جایگزین می‌شوند؛ جلسات دستی کاربر دست‌نخورده می‌مانند.
      const { removed, created } = await StudySessionService.replaceAiSessionsInRange(
        startDate,
        endDate,
        inputs
      )

      setSuccess(
        removed > 0
          ? `${created} جلسه ذخیره شد و ${removed} جلسه قبلی AI جایگزین شد. جلسات دستی شما حفظ شدند.`
          : `${created} جلسه با موفقیت ذخیره شد.`
      )
      setProposal(null)
      setConflicts([])
      setWarning(null)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 860, margin: '0 auto' }}>
      <PageHeader title="برنامه‌ریز مطالعه" subtitle="با کمک هوش مصنوعی، برنامه مطالعه دقیق بسازید" icon={Wand2} />

      <div
        style={{
          padding: '12px 16px',
          borderRadius: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          background: aiReady ? 'var(--color-success-light)' : 'var(--color-warning-light)',
          border: `1px solid color-mix(in srgb, ${aiReady ? 'var(--color-success)' : 'var(--color-warning)'} 30%, transparent)`,
          fontSize: 12.5,
          fontWeight: 600,
          color: aiReady ? 'var(--color-success)' : 'var(--color-warning)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: aiReady ? 'var(--color-success)' : 'var(--color-warning)',
            flexShrink: 0,
          }}
          className={aiReady ? '' : 'pulse-ring'}
        />
        {aiReady ? 'AI متصل است و آماده تولید برنامه' : 'AI متصل نیست — ابتدا از صفحه چت یا تنظیمات، اتصال را انجام دهید'}
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 13,
            background: 'var(--color-destructive-light)',
            border: '1px solid color-mix(in srgb, var(--color-destructive) 30%, transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 12.5,
            color: 'var(--color-destructive)',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              textDecoration: 'underline',
              fontSize: 11.5,
              fontFamily: 'inherit',
            }}
          >
            بستن
          </button>
        </div>
      )}

      {warning && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 13,
            background: 'var(--color-warning-light)',
            border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 12.5,
            color: 'var(--color-warning)',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{warning}</span>
          <button
            onClick={() => setWarning(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              textDecoration: 'underline',
              fontSize: 11.5,
              fontFamily: 'inherit',
            }}
          >
            بستن
          </button>
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 13,
            background: 'var(--color-success-light)',
            border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 12.5,
            color: 'var(--color-success)',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> {success}
        </div>
      )}

      {!proposal ? (
        <PlannerForm
          subjects={subjects}
          selectedSubjectIds={selectedSubjects}
          startDate={startDate}
          endDate={endDate}
          availableStart={availableHours.start}
          availableEnd={availableHours.end}
          preference={preference}
          minDuration={minDuration}
          maxDuration={maxDuration}
          breakDuration={breakDuration}
          loading={loading}
          aiReady={aiReady}
          onToggleSubject={toggleSubject}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
          onAvailableStart={(v) => setAvailableHours({ ...availableHours, start: v })}
          onAvailableEnd={(v) => setAvailableHours({ ...availableHours, end: v })}
          onPreference={setPreference}
          studyMethods={studyMethods}
          methodNote={methodNote}
          strengths={strengths}
          weaknesses={weaknesses}
          onToggleMethod={toggleMethod}
          onMethodNote={setMethodNote}
          onStrengths={setStrengths}
          onWeaknesses={setWeaknesses}
          onMinDuration={setMinDuration}
          onMaxDuration={setMaxDuration}
          onBreakDuration={setBreakDuration}
          onGenerate={generatePlan}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ConflictAlert conflicts={conflicts} />
          <AIProposal
            proposal={proposal}
            loading={loading}
            subjects={subjects}
            onBack={() => {
              setProposal(null)
              setConflicts([])
              setWarning(null)
            }}
            onSave={savePlan}
            onReject={() => {
              setProposal(null)
              setConflicts([])
              setWarning(null)
            }}
          />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11.5,
          color: 'var(--color-muted-foreground)',
          padding: '0 4px',
        }}
      >
        <Sparkles size={13} />
        برنامه تولیدشده فقط جلسات AI قبلی در همین بازه را جایگزین می‌کند؛ جلساتی که خودت ساختی دست‌نخورده می‌مانند.
      </div>
    </div>
  )
}
