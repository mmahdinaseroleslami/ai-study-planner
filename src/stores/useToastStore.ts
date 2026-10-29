import { create } from 'zustand'

/** نوع پیام */
export type ToastKind = 'success' | 'error' | 'info'

/** یک پیام Toast */
export interface ToastItem {
  id: string
  kind: ToastKind
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  push: (kind: ToastKind, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  dismiss: (id: string) => void
  clear: () => void
}

/** Store پیام‌های Toast — نمایش خطا/موفقیت طبق AGENTS.md */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (kind, message) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, kind, message }] }))
    // حذف خودکار بعد از ۴ ثانیه
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  success: (message) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, kind: 'success' as const, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  error: (message) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, kind: 'error' as const, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  info: (message) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, kind: 'info' as const, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))
