import type { StudyPlanInput } from '@/types/ai'
import { STUDY_METHOD_LABELS } from '@/constants/studyMethods'

/**
 * پرامپت مشترک تولید برنامه برای همه Providerها.
 * ساختار آن عمداً صریح است: تفکیک مراحل یادگیری، روش‌های شواهدمحور،
 * و استفاده از نقاط قوت/ضعف یادگیرنده.
 */
export function buildStudyPlanPrompt(input: StudyPlanInput): string {
  const subjectLines = input.subjectIds
    .map((id) => `- ${input.subjectNames[id] ?? id} (subjectId: ${id})`)
    .join('\n')

  const examLines =
    input.exams.length > 0
      ? input.exams
          .map((exam) => `- ${input.subjectNames[exam.subjectId] ?? exam.subjectId}: ${exam.date}`)
          .join('\n')
      : 'ثبت نشده'

  const selectedMethods = (input.studyMethods ?? []).length
    ? (input.studyMethods ?? [])
        .map((method) => `${STUDY_METHOD_LABELS[method] ?? method} (${method})`)
        .join('، ')
    : 'آزاد — خودت بهترین ترکیب شواهدمحور را انتخاب کن'

  const methodNote = (input.methodNote ?? '').trim() || 'ثبت نشده'
  const strengths = (input.strengths ?? '').trim() || 'ثبت نشده'
  const weaknesses = (input.weaknesses ?? '').trim() || 'ثبت نشده'
  const preferenceLabel =
    input.preferences.type === 'focused' ? 'تمرکزی (جلسات بلندتر و کمتر)' : 'پراکنده (جلسات کوتاه‌تر و بیشتر)'

  return `
شما یک برنامه‌ریز مطالعه حرفه‌ای و متخصص روان‌شناسی یادگیری هستید.
هدف: طراحی یک برنامه واقع‌بینانه، قابل اجرا و مبتنی بر شواهد علمی روز.

## دروس:
${subjectLines}

## بازه برنامه:
از ${input.startDate} تا ${input.endDate}

## ساعات آزاد روزانه:
از ${input.availableHours.start} تا ${input.availableHours.end}

## امتحانات:
${examLines}

## پروفایل یادگیرنده:
- سبک مطالعه: ${preferenceLabel}
- مدت هر جلسه: بین ${input.preferences.minSessionDuration} و ${input.preferences.maxSessionDuration} دقیقه
- استراحت بین جلسات: ${input.preferences.breakDuration} دقیقه
- روش‌های موردعلاقه: ${selectedMethods}
- ترتیب یا توضیح دلخواه: ${methodNote}
- نقاط قوت: ${strengths}
- نقاط ضعف: ${weaknesses}

## اصول علمی اجباری:
1. چرخه یادگیری: هر جلسه را در یکی از این مراحل قرار بده و method را دقیق انتخاب کن:
   - ورودی: video یا reading
   - پردازش: summary
   - تثبیت: practice یا flashcards
   - بازیابی: recall، teaching یا mock_exam
2. Retrieval practice: بعد از جلسات ورودی/پردازش، حتماً یک جلسه بازیابی یا تمرین در همان روز یا روز بعد بگذار.
3. Spaced repetition: مرورها را با فاصله توزیع کن و از تجمع چند مرور پشت‌سرهم در یک روز پرهیز کن.
4. Interleaving: بین دروس جابه‌جایی داشته باش؛ یک درس را در چند روز پخش کن، نه همه در یک روز.
5. Elaboration: برای مفاهیم سخت، summary و teaching را بیشتر کن.
6. Dual coding: ترکیب video/reading با خلاصه، نمودار یا فلش‌کارت را در نظر بگیر.
7. Deliberate practice: روی نقاط ضعف، تمرین هدفمند و جلسات بیشتر یا کوتاه‌تر بگذار.
8. نقاط قوت: مرور کوتاه‌تر و چالشی‌تر (mock_exam) کافی است و زمان آزادشده را به نقاط ضعف بده.
9. Cognitive load: جلسات سنگین را پشت‌سرهم نگذار و بین پایان هر جلسه و شروع جلسه بعد حداقل ${input.preferences.breakDuration} دقیقه فاصله بگذار.
10. ترتیب دلخواه کاربر را رعایت کن؛ اگر با اصول بالا تضاد داشت، سازگارترین گزینه را انتخاب کن و در summary دلیل را بنویس.
11. هر جلسه فقط یک method داشته باشد و method حتماً از لیست مجاز باشد.
12. هر درس انتخاب‌شده حداقل یک جلسه در بازه داشته باشد.
13. مجموع زمان جلسات هر روز از ساعات آزاد روزانه بیشتر نشود.
14. برای درس‌هایی که امتحان نزدیک دارند، mock_exam و recall را در روزهای آخر بیشتر کن.
15. هیچ دو جلسه‌ای در یک روز هم‌پوشانی زمانی نداشته باشد.
16. تاریخ هر جلسه باید بین ${input.startDate} و ${input.endDate} و به شکل YYYY-MM-DD باشد.
17. اگر روش انتخابی کاربر برای یک درس منطقی نیست، نزدیک‌ترین روش از لیست مجاز را انتخاب کن.
18. summary به فارسی، حداکثر ۲۰۰۰ کاراکتر، شامل منطق چینش، نحوه پوشش نقاط ضعف و استفاده از نقاط قوت.

## روش‌های مجاز (مقدار دقیق method):
- video: تماشای ویدیو
- reading: مطالعه و خواندن
- summary: خلاصه‌نویسی یا نقشه ذهنی
- practice: حل تمرین و مسئله
- flashcards: فلش‌کارت
- recall: بازیابی فعال بدون نگاه به منبع
- teaching: تدریس یا توضیح برای شخص دیگر
- mock_exam: آزمون آزمایشی

## خروجی مورد انتظار:
فقط یک شیء JSON با این ساختار، بدون هیچ متن یا markdown اضافی:
{
  "sessions": [
    {
      "subjectId": "شناسه دقیق درس از لیست بالا",
      "subjectName": "نام دقیق همان درس از لیست بالا",
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "type": "study" | "review",
      "method": "video" | "reading" | "summary" | "practice" | "flashcards" | "recall" | "teaching" | "mock_exam"
    }
  ],
  "summary": "توضیح کوتاه فارسی"
}

⚠️ قواعد فنی:
- فیلد date باید تاریخ مطلق میلادی باشد، نه نام روز هفته.
- فیلد subjectName باید دقیقاً همان نامی باشد که در لیست دروس آمده است.
- فیلد type فقط study یا review است.
- فیلد method اجباری است و باید یکی از مقادیر لیست مجاز باشد.
- هیچ متن اضافی خارج از JSON ننویس.
`
}
