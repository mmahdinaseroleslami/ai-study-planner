import type { CreateSubjectInput, CreateStudySessionInput, CreateExamInput } from '@/types'

/** خطای اعتبارسنجی */
export interface ValidationError {
  field: string
  message: string
}

/** نتیجه اعتبارسنجی */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * اعتبارسنجی فرم درس
 */
export function validateSubject(data: CreateSubjectInput): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.name || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'نام درس باید حداقل ۲ کاراکتر باشد' })
  }

  if (!data.color) {
    errors.push({ field: 'color', message: 'رنگ درس الزامی است' })
  }

  if (data.weeklyHours < 1 || data.weeklyHours > 40) {
    errors.push({ field: 'weeklyHours', message: 'ساعت مطالعه هفتگی باید بین ۱ تا ۴۰ ساعت باشد' })
  }

  if (data.difficulty < 1 || data.difficulty > 5) {
    errors.push({ field: 'difficulty', message: 'سختی باید بین ۱ تا ۵ باشد' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * اعتبارسنجی فرم جلسه مطالعه
 */
export function validateStudySession(data: CreateStudySessionInput): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.subjectId) {
    errors.push({ field: 'subjectId', message: 'انتخاب درس الزامی است' })
  }

  if (!data.date) {
    errors.push({ field: 'date', message: 'تاریخ الزامی است' })
  }

  if (!data.startTime) {
    errors.push({ field: 'startTime', message: 'ساعت شروع الزامی است' })
  }

  if (!data.endTime) {
    errors.push({ field: 'endTime', message: 'ساعت پایان الزامی است' })
  }

  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    errors.push({ field: 'endTime', message: 'ساعت پایان باید بعد از ساعت شروع باشد' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * اعتبارسنجی فرم امتحان
 */
export function validateExam(data: CreateExamInput): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.subjectId) {
    errors.push({ field: 'subjectId', message: 'انتخاب درس الزامی است' })
  }

  if (!data.date) {
    errors.push({ field: 'date', message: 'تاریخ امتحان الزامی است' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * اعتبارسنجی API Key
 */
export function validateApiKey(apiKey: string): ValidationResult {
  const errors: ValidationError[] = []

  if (!apiKey || apiKey.trim().length < 10) {
    errors.push({ field: 'apiKey', message: 'API Key نامعتبر است' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
