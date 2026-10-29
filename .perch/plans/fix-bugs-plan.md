# فیکس باگ‌های ai-study-planner

بررسی کامل ۷۶ فایل انجام شد. بیلد در حال حاضر کامپایل نمی‌شود. این پلن به ترتیب اولویت پیش می‌رود: اول بیلد را سالم می‌کند، بعد باگ‌هایی که داده کاربر را خراب می‌کنند، بعد معماری و UX.

---

## P0 — بیلد را سالم کن (۴ خطای سینتکس)

هر چهار مورد `import` بدون `from` هستند. پارسر TypeScript قبل از تایپ‌چک روی این‌ها می‌میرد، پس `pnpm build` هیچ خروجی‌ای نمی‌دهد.

| فایل | خط | وضعیت فعلی | اصلاح |
|---|---|---|---|
| `src/services/StudySessionService.ts` | 4 | `import { toLocalDateKey }` | `import { toLocalDateKey } from '@/utils/date'` |
| `src/services/ExamService.ts` | 3 | `import { getToday }` | `import { getToday } from '@/utils/date'` |
| `src/hooks/useSettings.ts` | 4 | `import { applyTheme }` | `import { applyTheme } from '@/utils/theme'` |
| `src/pages/MonthlyCalendar.tsx` | 8 | `import { toLocalDateKey, getToday, calculateDuration }` | `from '@/utils/date'` |

**تأیید:** `pnpm build` بدون خطا تمام شود.

---

## P1 — باگ‌هایی که داده کاربر را خراب می‌کنند

### ۱. Planner تاریخ جلسه را با نام روز ذخیره می‌کند
`src/pages/Planner.tsx:65` و `:86` مقدار `date: s.day` می‌گذارند، در حالی که `day` از AI یک نام روز است («شنبه»، «Saturday»، یا هرچه مدل تولید کند) نه تاریخ.

نتیجه: جلسات ذخیره می‌شوند ولی در تقویم هفتگی و ماهانه هرگز ظاهر نمی‌شوند، چون `getByDateRange` روی `YYYY-MM-DD` فیلتر می‌کند.

**اصلاح:** `AISessionProposal.day` را به تاریخ واقعی تبدیل کن. بهترین مسیر: در `aiSchema.ts` فیلد `day` را به `date` با regex `YYYY-MM-DD` تغییر بده و پرامپت هر دو Provider را طوری بازنویسی کن که تاریخ مطلق بدهد (به مدل `startDate`/`endDate` را بده و بخواه تاریخ دقیق برگرداند). اگر مدل نام روز داد، در یک helper نگاشت نام روز + `startDate` → تاریخ.

### ۲. تشخیص تداخل Planner همیشه صفر برمی‌گرداند
`findAllConflicts` در `src/utils/conflict.ts:23` اول `session1.date !== session2.date` را چک می‌کند. با نام روز، این شرط هیچ‌وقت برابر نمی‌شود، پس هیچ تداخلی گزارش نمی‌شود و کاربر برنامه متداخل را بدون هشدار ذخیره می‌کند.

**اصلاح:** با فیکس بند ۱ خودبه‌خود حل می‌شود. بعدش یک تست روی `findAllConflicts` بگذار.

### ۳. `savePlan` تمام جلسات قبلی کاربر را پاک می‌کند
`src/pages/Planner.tsx:82-83`:
```ts
const old = await StudySessionService.getAll()
for (const s of old) await StudySessionService.delete(s.id)
```
این همه جلسات را حذف می‌کند — از جمله جلساتی که کاربر دستی در تقویم ساخته — و مرورهای وابسته را یتیم می‌گذارد.

**اصلاح:** فقط جلساتی را جایگزین کن که از AI آمده‌اند. یا یک فیلد `source: 'ai' | 'manual'` به `StudySession` اضافه کن (نیازمند migration به `db.version(3)`)، یا حداقل قبل از حذف یک دیالوگ صریح بگذار که بگوید چند جلسه دستی حذف می‌شود. پیشنهاد من: فیلد `source` — تمیزتر و قابل بازگشت.

### ۴. تقویم هفتگی ستون‌ها را جابه‌جا نشان می‌دهد
`getWeekStart` در `src/utils/date.ts:111` دوشنبه‌محور است (`day === 0 ? -6 : 1`)، ولی `WEEK_DAYS` در `src/constants/ui.ts:29` از شنبه شروع می‌شود. سرستون «شنبه» بالای تاریخ دوشنبه قرار می‌گیرد.

**اصلاح:** `getWeekStart` را شنبه‌محور کن: `(day + 1) % 7` روز از شنبه گذشته. توجه: `MonthlyCalendar` از فرمول درست شنبه‌محور استفاده می‌کند (`(first.getDay() + 1) % 7`)، پس همان الگو را در `date.ts` پیاده کن تا دو تقویم هم‌رفتار شوند.

### ۵. باگ UTC در تشخیص «امروز»
`src/pages/WeeklyCalendar.tsx:127`:
```ts
date?.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
```
این دقیقاً همان باگی است که `toLocalDateKey` برای جلوگیری از آن نوشته شده. در تهران بعد از ۳:۳۰ بامداد روز عوض می‌شود و ستون اشتباه هایلایت می‌شود.

**اصلاح:** `toLocalDateKey(date) === getToday()`.

### ۶. فرمت ناسازگار `completedDate`
`src/services/ReviewService.ts:86` مقدار `completedDate` را `new Date().toISOString()` می‌گذارد (datetime کامل)، در حالی که بقیه تاریخ‌ها در کل پروژه `YYYY-MM-DD` محلی هستند. هر جای دیگری که این فیلد رندر شود، `toPersianDate` روی آن ساعت هم چاپ می‌کند.

**اصلاح:** `completedDate: getToday()`.

### ۷. `getNextReviewDate` شکننده است
`src/constants/reviewIntervals.ts:19-22` از `new Date(studyDate)` + `toISOString()` استفاده می‌کند. با رشته `YYYY-MM-DD` در UTC پارس می‌شود و در تایم‌زون‌های منفی می‌تواند یک روز عقب بیفتد. فعلاً برای ایران درست کار می‌کند، ولی همان کلاس باگ است.

**اصلاح:** `new Date(`${studyDate}T12:00:00`)` و بعد `toLocalDateKey` — همان ترفندی که `Reviews.tsx:42` استفاده می‌کند.

---

## P2 — معماری و UX

### ۸. `DangerZone` قاعده لایه‌بندی را می‌شکند
`src/components/settings/DangerZone.tsx:2` مستقیم `db` را import می‌کند، در حالی که `AIConfigService` صریحاً مستند کرده «هیچ Component نباید مستقیم به db دسترسی داشته باشد». ضمناً `userSettings` را پاک نمی‌کند، پس بعد از «حذف تمام داده‌ها» تنظیمات باقی می‌ماند.

**اصلاح:** یک `DataService.clearAll()` در `src/services/` بساز که همه هفت store را پاک کند، و `DangerZone` آن را صدا بزند.

### ۹. `Toaster` ساخته شده ولی هیچ‌جا استفاده نمی‌شود
`useToastStore` کامل پیاده شده، `Toaster` در Layout سوار است، ولی هیچ کامپوننتی `success`/`error` صدا نمی‌زند. خطاها فقط `console.error` می‌شوند — کاربر هیچ بازخوردی نمی‌گیرد.

**اصلاح:** در `Subjects.tsx` (`handleSubmit`، `handleDelete`)، `WeeklyCalendar.tsx` (`saveForm`، `deleteSession`)، `Planner.tsx` و `Settings.tsx` فراخوانی toast اضافه کن. `console.error` را نگه دار ولی به‌عنوان مکمل، نه جایگزین.

### ۱۰. تنظیمات provider سفارشی ناقص است
`src/pages/Settings.tsx:52-54` هنگام ذخیره `baseUrl` و `model` را پاس نمی‌دهد و اصلاً فیلدی برایشان ندارد. `AIConfigService.save` هم اعتبارسنجی نمی‌کند که برای `type === 'custom'` این دو الزامی‌اند. نتیجه: رکورد ذخیره می‌شود ولی `createCustomProvider` بعداً `false` برمی‌گرداند و کاربر نمی‌فهمد چرا.

**اصلاح:** دو فیلد شرطی برای `custom` در Settings، و اعتبارسنجی در `AIConfigService.save` با پیام خطای فارسی.

### ۱۱. `validateSubject` هرگز صدا زده نمی‌شود
`src/utils/validation.ts:18` نوشته شده و `Subjects.tsx` از آن استفاده نمی‌کند. کاربر می‌تواند درس با نام یک‌حرفی و `weeklyHours` خارج از بازه ثبت کند.

**اصلاح:** در `handleSubmit` صدا بزن و اولین خطا را با toast نشان بده.

### ۱۲. Error Boundary وجود ندارد
هر خطای رندر در هر صفحه کل اپ را سفید می‌کند.

**اصلاح:** یک `ErrorBoundary` ساده در `src/components/common/` و پیچیدن `<Outlet />` در Layout.

### ۱۳. سایدبار روی موبایل پیش‌فرض باز است
`useUIStore` مقدار `sidebarOpen: true` دارد. در موبایل، اولین رندر با `isMobile: false` شروع می‌شود و افکت بعد از mount آن را true می‌کند — سایدبار روی کل صفحه می‌افتد.

**اصلاح:** در `Layout`، وقتی `isMobile` شد و کاربر هنوز دستی toggle نکرده، `setSidebarOpen(false)`.

---

## P3 — کیفیت

### ۱۴. تم تاریک عملاً کار نمی‌کند
`index.css` متغیرهای `[data-theme="dark"]` را درست تعریف کرده، ولی بیشتر صفحات رنگ را هاردکد می‌کنند: `background: 'white'`، `#f8fafc`، `#1e293b`، `#94a3b8`. در `Dashboard.tsx`، `Planner.tsx`، `AIChat.tsx`، `WeeklyCalendar.tsx`، `MonthlyCalendar.tsx` و `PlannerForm.tsx` ده‌ها مورد وجود دارد.

**اصلاح:** رنگ‌های هاردکد را به `var(--color-card)`، `var(--color-muted)`، `var(--color-foreground)`، `var(--color-muted-foreground)` تبدیل کن. کار مکانیکی است ولی حجم دارد.

### ۱۵. کد مرده
حذف یا استفاده: `ApiResponse`، `Pagination` (`types/common.ts`)، `formatDuration`، `maskApiKey`، `getStatusColor` (`utils/format.ts`)، `formatTime` (`utils/date.ts`)، `BREAKPOINTS`، `WEEK_DAY_NUMBERS`، `APP_NAME`، `APP_DESCRIPTION` (`constants/ui.ts`)، وضعیت‌های `missed` و `skipped` در `Status`.

### ۱۶. `README.md` متن پیش‌فرض Vite است
با مستندات واقعی پروژه جایگزین کن: نصب، اسکریپت‌ها، معماری لایه‌ها (Component → Hook → Service → Dexie)، مدل داده، و نحوه تنظیم provider.

### ۱۷. صفر تست
هیچ اسکریپت `test` در `package.json` نیست. حداقل تست‌های واحد برای منطق خالص که ریسک بالا دارند:
- `getNextReviewDate` (مرزهای ماه و سال)
- `hasTimeConflict` و `findAllConflicts`
- `getWeekStart` / `getWeekEnd` (شنبه‌محور بعد از فیکس)
- `parseAndValidateStudyPlan` (JSON نامعتبر، markdown fence، ساعت معکوس)

`vitest` اضافه کن، `pnpm test` را در scripts بگذار.

### ۱۸. تمیزکاری جزئی
- `vite.config.ts:5` کامنت eslint بی‌ربط به خط ۵ چسبیده — حذف.
- `OpenAICompatibleProvider.ts:123` شرط `direct.status !== 0` همیشه true است (Response واقعی هیچ‌وقت status صفر ندارد) — منطق fallback را روشن کن یا شرط را حذف کن.
- `GeminiProvider` مدل را هاردکد `gemini-2.0-flash` گذاشته و `config.model` را نادیده می‌گیرد؛ ضمناً برای `generateStudyPlan` پارامتر `responseMimeType: 'application/json'` نگذاشته که پایداری پارس را پایین می‌آورد.
- `MonthlyCalendar.tsx:152` آرایه memoized را با `.sort()` درجا تغییر می‌دهد — یک کپی بگیر.
- `ExamService.getUpcoming` و `ReviewService.getUpcoming` با `.above(today)` امتحان و مرور امروز را حذف می‌کنند — `.aboveOrEqual` احتمالاً منظور بوده.

---

## ترتیب اجرا

1. **P0** — چهار import را درست کن، `pnpm build` را سبز کن.
2. **P1.5 و P1.6 و P1.7** — فیکس‌های کوچک تاریخ (UTC، `completedDate`، `getNextReviewDate`).
3. **P1.4** — `getWeekStart` را شنبه‌محور کن (هر دو تقویم را با هم چک کن).
4. **P1.1 و P1.2** — تاریخ مطلق در پرامپت و schema، بازنویسی `Planner.tsx`.
5. **P1.3** — فیلد `source` + `db.version(3)` + بازنویسی `savePlan`.
6. **P2** — DataService، toast، فیلدهای custom، validation، ErrorBoundary، سایدبار موبایل.
7. **P3** — تم تاریک، کد مرده، README، تست‌ها، تمیزکاری.

بعد از هر مرحله `pnpm build` و `pnpm lint` اجرا می‌شود. مرحله ۱ تا ۵ بدون تغییر رفتار ظاهری است، پس اگر چیزی خراب شد، مقصر مشخص است.

---

## چیزهایی که عمداً در این پلن نیستند

- **مهاجرت به تقویم شمسی برای ورودی تاریخ.** الان `input type="date"` میلادی است و فقط نمایش شمسی است. تبدیل کامل به date picker شمسی یک قابلیت است، نه باگ.
- **جابه‌جایی API Key از IndexedDB به جای امن‌تر.** برای یک اپ محلی مرورگری این انتخاب قابل دفاع است؛ تغییرش معماری را عوض می‌کند.
- **افزودن قابلیت جدید.** درخواست «بهتر کردن» را به فیکس و تمیزکاری محدود کردم. اگر قابلیت مشخصی می‌خواهی، جدا بگو.