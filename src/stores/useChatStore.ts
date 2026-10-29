import { create } from 'zustand'
import type { ChatMessage } from '@/types/ai'
import { db } from '@/db/schema'

/** State چت — پیام‌ها در IndexedDB persist می‌شوند */
interface ChatState {
  messages: ChatMessage[]
  isTyping: boolean
  loaded: boolean
  addMessage: (message: ChatMessage) => void
  setTyping: (typing: boolean) => void
  clearMessages: () => void
  loadMessages: () => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  loaded: false,

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
    // ذخیره async در IndexedDB (بدون بلاک کردن UI)
    db.chatMessages.add(message).catch(() => undefined)
  },

  setTyping: (typing) => set({ isTyping: typing }),

  clearMessages: () => {
    set({ messages: [] })
    db.chatMessages.clear().catch(() => undefined)
  },

  loadMessages: async () => {
    if (get().loaded) return
    try {
      const stored = await db.chatMessages.orderBy('timestamp').toArray()
      set({ messages: stored.slice(-100), loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
}))
