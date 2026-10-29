import { create } from 'zustand'
import type { StudyPreference } from '@/types/ai'
import type { StudyMethod } from '@/types/studySession'

/** State فرم برنامه‌ریز — مطابق DESIGN.md §۱۴.۲ */
interface PlannerState {
  selectedSubjects: string[]
  availableHours: { start: string; end: string }
  startDate: string
  endDate: string
  preference: StudyPreference
  studyMethods: StudyMethod[]
  methodNote: string
  strengths: string
  weaknesses: string
  setSelectedSubjects: (ids: string[]) => void
  toggleSubject: (id: string) => void
  setAvailableHours: (hours: { start: string; end: string }) => void
  setStartDate: (date: string) => void
  setEndDate: (date: string) => void
  setPreference: (preference: StudyPreference) => void
  toggleMethod: (method: StudyMethod) => void
  setMethodNote: (note: string) => void
  setStrengths: (value: string) => void
  setWeaknesses: (value: string) => void
  reset: () => void
}

const initialState = {
  selectedSubjects: [] as string[],
  availableHours: { start: '08:00', end: '20:00' },
  startDate: '',
  endDate: '',
  preference: 'distributed' as StudyPreference,
  studyMethods: ['reading', 'practice', 'recall'] as StudyMethod[],
  methodNote: '',
  strengths: '',
  weaknesses: '',
}

export const usePlannerStore = create<PlannerState>((set) => ({
  ...initialState,

  setSelectedSubjects: (ids) => set({ selectedSubjects: ids }),

  toggleSubject: (id) =>
    set((state) => ({
      selectedSubjects: state.selectedSubjects.includes(id)
        ? state.selectedSubjects.filter((s) => s !== id)
        : [...state.selectedSubjects, id],
    })),

  setAvailableHours: (hours) => set({ availableHours: hours }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setPreference: (preference) => set({ preference }),

  toggleMethod: (method) =>
    set((state) => ({
      studyMethods: state.studyMethods.includes(method)
        ? state.studyMethods.filter((m) => m !== method)
        : [...state.studyMethods, method],
    })),

  setMethodNote: (note) => set({ methodNote: note }),
  setStrengths: (value) => set({ strengths: value }),
  setWeaknesses: (value) => set({ weaknesses: value }),

  reset: () => set(initialState),
}))
