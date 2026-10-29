import { useState, useEffect } from 'react'
import { SubjectService } from '@/services'
import type { Subject, CreateSubjectInput, UpdateSubjectInput } from '@/types/subject'

/**
 * Hook مدیریت دروس
 */
export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // بارگذاری دروس
  const loadSubjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await SubjectService.getAll()
      setSubjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری دروس')
    } finally {
      setLoading(false)
    }
  }

  // ایجاد درس جدید
  const createSubject = async (input: CreateSubjectInput) => {
    try {
      const subject = await SubjectService.create(input)
      setSubjects((prev) => [...prev, subject])
      return subject
    } catch (err) {
      throw err instanceof Error ? err : new Error('خطا در ایجاد درس')
    }
  }

  // ویرایش درس
  const updateSubject = async (id: string, input: UpdateSubjectInput) => {
    try {
      await SubjectService.update(id, input)
      setSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...input } : s))
      )
    } catch (err) {
      throw err instanceof Error ? err : new Error('خطا در ویرایش درس')
    }
  }

  // حذف درس
  const deleteSubject = async (id: string) => {
    try {
      await SubjectService.delete(id)
      setSubjects((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      throw err instanceof Error ? err : new Error('خطا در حذف درس')
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  return {
    subjects,
    loading,
    error,
    createSubject,
    updateSubject,
    deleteSubject,
    refresh: loadSubjects,
  }
}
