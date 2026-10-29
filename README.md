# برنامه‌ریز مطالعه هوشمند

یک اپلیکیشن محلی برای برنامه‌ریزی مطالعه، با تولید برنامه توسط هوش مصنوعی، تقویم هفتگی و ماهانه، و مرور فاصله‌دار (Spaced Repetition).

همه داده‌ها در IndexedDB مرورگر خودتان ذخیره می‌شوند. هیچ سروری در کار نیست.

---

## شروع سریع

```bash
pnpm install
pnpm dev
```

اپ روی `http://localhost:5173` بالا می‌آید.

### اسکریپت‌ها

| دستور | کار |
|---|---|
| `pnpm dev` | سرور توسعه با HMR |
| `pnpm build` | تایپ‌چک + بیلد تولید |
| `pnpm preview` | پیش‌نمایش بیلد |
| `pnpm lint` | لینت با Oxlint |
| `pnpm test` | اجرای تست‌ها (Vitest) |
| `pnpm test:watch` | تست در حالت watch |

---

## معماری

جریان داده یک‌طرفه و لایه‌بندی‌شده است. هیچ کامپوننتی مستقیم به دیتابیس دسترسی ندارد:

```
Component  →  Hook / Store  →  Service  →  Dexie  →  IndexedDB
```

```
src/
├── components/     کامپوننت‌های UI (layout, planner, ai-chat, common, effects)
├── pages/          صفحه‌های مسیر‌ها
├── hooks/          هوک‌های داده (useSubjects, useStudySessions, ...)
├── stores/         state سراسری با Zustand (theme, chat, planner, toast, UI)
├── services/       منطق دامنه و دسترسی به داده
│   └── providers/  پیاده‌سازی‌های AI (Gemini, OpenAI-Compatible)
├── db/             اسکیمای Dexie و migrationها
├── types/          تایپ‌های دامنه
├── utils/          توابع خالص (date, conflict, validation, aiSchema)
└── constants/      مقادیر ثابت
```

### قواعدی که رعایت می‌شوند

- **Component → Service، هرگز Component → db.** تنها استثنا `db/schema.ts` است که خودِ دیتابیس را می‌سازد.
- **تاریخ‌ها همیشه `YYYY-MM-DD` محلی‌اند.** هرگز از `toISOString().split('T')[0]` استفاده نکنید؛ در تایم‌زون ایران روز را جابه‌جا می‌کند. از `toLocalDateKey` و `parseLocalDate` استفاده کنید.
- **خروجی AI قبل از استفاده اعتبارسنجی می‌شود.** مسیر اجباری: `parseAndValidateStudyPlan` با Zod.
- **هفته از شنبه شروع می‌شود.** `getWeekStart` شنبه‌محور است و هر دو تقویم از آن استفاده می‌کنند.

---

## مدل داده

| Store | کلید | ایندکس‌ها |
|---|---|---|
| `subjects` | `id` | `name`, `priority`, `examDate` |
| `studySessions` | `id` | `subjectId`, `date`, `status`, `source` |
| `reviews` | `id` | `subjectId`, `sessionId`, `scheduledDate`, `status` |
| `exams` | `id` | `subjectId`, `date` |
| `userSettings` | `id` (`'main'`) | — |
| `aiProviders` | `id` | `type`, `isActive` |
| `chatMessages` | `id` | `timestamp` |

نسخه ۳ یک فیلد `source: 'manual' | 'ai'` به جلسات اضافه کرد. بازتولید برنامه AI فقط جلسات `ai` را در بازه هدف جایگزین می‌کند و جلسات دستی شما را دست‌نخورده می‌گذارد.

### مرور فاصله‌دار

با تکمیل یک جلسه مطالعه، پنج مرور خودکار ساخته می‌شود: **۱، ۳، ۷، ۱۴ و ۳۰ روز** بعد از تاریخ جلسه.

### روش‌های یادگیری

در صفحه برنامه‌ریز می‌توانید روش‌های موردعلاقه (ویدیو، مطالعه، خلاصه‌نویسی، تمرین، فلش‌کارت، بازیابی فعال، تدریس، آزمون آزمایشی)، ترتیب دلخواه فعالیت‌ها و نقاط قوت/ضعف خود را وارد کنید. هر جلسه پیشنهادی AI یک فیلد `method` دارد و برنامه بر اساس چرخه **ورودی ← پردازش ← تثبیت ← بازیابی** و اصول شواهدمحور (Retrieval Practice، Spaced Repetition، Interleaving، Deliberate Practice) ساخته می‌شود. روش هر جلسه در پیشنهاد AI و تقویم نمایش داده می‌شود.

---

## تنظیم هوش مصنوعی

از صفحه **چت با AI** یا **تنظیمات**، یکی از ارائه‌دهنده‌ها را انتخاب کنید:

| ارائه‌دهنده | نیاز به |
|---|---|
| Google Gemini | API Key |
| Groq | API Key |
| OpenRouter | API Key |
| سفارشی (OpenAI Compatible) | API Key + Base URL + Model |

API Key فقط در IndexedDB همین مرورگر ذخیره می‌شود و به هیچ سروری ارسال نمی‌شود. در حالت توسعه، اگر درخواست مستقیم با CORS رد شود، یک Vite proxy محلی (`/api-proxy`) به‌عنوان fallback استفاده می‌شود.

---

## تست

```bash
pnpm test
```

۳۶ تست روی منطق پرریسک: محاسبه هفته شنبه‌محور، مرزهای ماه و سال در مرور فاصله‌دار، پارس تاریخ بدون شیفت UTC، نرمال‌سازی خروجی AI (نام روز → تاریخ مطلق)، و تشخیص تداخل زمانی.

---

## پشته فنی

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · Dexie 4 · Zustand 5 · Zod 4 · React Router 7 · Vitest 5
