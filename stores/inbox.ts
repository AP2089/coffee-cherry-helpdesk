import { defineStore } from 'pinia'
import type { Socket } from 'socket.io-client'
import type { ApiResponse } from '~/types/api'
import type {
  ChatMessage,
  ConversationListItem,
  ConversationMeta,
  PaginatedList,
} from '~/types/chat'
import { useApiBase, useSocketUrl } from '~/composables/useApiBase'
import { useAuthStore } from '~/stores/auth'

const PAGE_SIZE = 20

let socket: Socket | null = null

function normalizeConversationPage(data: unknown): {
  items: ConversationListItem[]
  hasMore: boolean
} {
  if (Array.isArray(data)) {
    return { items: data, hasMore: false }
  }

  const page = data as PaginatedList<ConversationListItem>
  return {
    items: page?.items ?? [],
    hasMore: Boolean(page?.hasMore),
  }
}

function normalizeMessagesPage(data: unknown): {
  meta: ConversationMeta | null
  messages: ChatMessage[]
  hasMore: boolean
} {
  const payload = data as {
    meta?: ConversationMeta
    messages?: ChatMessage[]
    hasMore?: boolean
  }

  return {
    meta: payload?.meta ?? null,
    messages: payload?.messages ?? [],
    hasMore: Boolean(payload?.hasMore),
  }
}

export const useInboxStore = defineStore('inbox', {
  state: () => ({
    isConnected: false,
    isConnecting: false,
    conversations: [] as ConversationListItem[],
    conversationsHasMore: false,
    loadingConversations: false,
    loadingMoreConversations: false,
    activeSessionId: null as string | null,
    activeMeta: null as ConversationMeta | null,
    messages: [] as ChatMessage[],
    messagesHasMore: false,
    loadingMessages: false,
    loadingMoreMessages: false,
    deletingConversation: false,
    error: null as string | null,
    unreadBySession: {} as Record<string, number>,
  }),

  getters: {
    activeConversation(state) {
      return state.conversations.find((item) => item.sessionId === state.activeSessionId) ?? null
    },

    totalUnread(state) {
      return Object.values(state.unreadBySession).reduce((sum, count) => sum + count, 0)
    },
  },

  actions: {
    authHeaders() {
      const auth = useAuthStore()
      return {
        Authorization: `Bearer ${auth.token}`,
      }
    },

    async fetchConversations() {
      this.loadingConversations = true
      this.error = null

      try {
        const response = await $fetch<
          ApiResponse<PaginatedList<ConversationListItem> | ConversationListItem[]>
        >(`${useApiBase()}/conversations`, {
          headers: this.authHeaders(),
          query: { limit: PAGE_SIZE, offset: 0 },
        })

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load conversations')
        }

        const page = normalizeConversationPage(response.data)
        this.conversations = page.items
        this.conversationsHasMore = page.hasMore
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load conversations'
        throw error
      } finally {
        this.loadingConversations = false
      }
    },

    async loadMoreConversations() {
      if (this.loadingMoreConversations || !this.conversationsHasMore) return

      this.loadingMoreConversations = true
      this.error = null

      try {
        const response = await $fetch<
          ApiResponse<PaginatedList<ConversationListItem> | ConversationListItem[]>
        >(`${useApiBase()}/conversations`, {
          headers: this.authHeaders(),
          query: {
            limit: PAGE_SIZE,
            offset: this.conversations.length,
          },
        })

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load conversations')
        }

        if (Array.isArray(response.data)) {
          this.conversationsHasMore = false
          return
        }

        const page = normalizeConversationPage(response.data)

        const existingIds = new Set(this.conversations.map((item) => item.sessionId))

        for (const item of page.items) {
          if (existingIds.has(item.sessionId)) continue
          this.conversations.push(item)
        }

        this.conversationsHasMore = page.hasMore
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load conversations'
      } finally {
        this.loadingMoreConversations = false
      }
    },

    async fetchMessages(sessionId: string) {
      this.loadingMessages = true
      this.error = null
      this.messages = []
      this.messagesHasMore = false

      try {
        const response = await $fetch<
          ApiResponse<{ meta: ConversationMeta; messages: ChatMessage[]; hasMore?: boolean }>
        >(`${useApiBase()}/conversations/${sessionId}/messages`, {
          headers: this.authHeaders(),
          query: { limit: PAGE_SIZE },
        })

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load messages')
        }

        const page = normalizeMessagesPage(response.data)

        this.activeSessionId = sessionId
        this.activeMeta = page.meta
        this.messages = page.messages
        this.messagesHasMore = page.hasMore
        this.unreadBySession[sessionId] = 0
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load messages'
        throw error
      } finally {
        this.loadingMessages = false
      }
    },

    async loadOlderMessages() {
      if (
        this.loadingMoreMessages ||
        !this.messagesHasMore ||
        !this.activeSessionId ||
        !this.messages.length
      ) {
        return
      }

      this.loadingMoreMessages = true
      this.error = null

      const sessionId = this.activeSessionId
      const before = this.messages[0]?.id

      try {
        const response = await $fetch<
          ApiResponse<{ meta: ConversationMeta; messages: ChatMessage[]; hasMore?: boolean }>
        >(`${useApiBase()}/conversations/${sessionId}/messages`, {
          headers: this.authHeaders(),
          query: {
            limit: PAGE_SIZE,
            before,
          },
        })

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load messages')
        }

        if (this.activeSessionId !== sessionId) return

        const page = normalizeMessagesPage(response.data)

        const existingIds = new Set(this.messages.map((item) => item.id))
        const older = page.messages.filter((item) => !existingIds.has(item.id))

        if (!older.length) {
          this.messagesHasMore = false
          return
        }

        this.messages = [...older, ...this.messages]
        this.messagesHasMore = page.hasMore
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load messages'
      } finally {
        this.loadingMoreMessages = false
      }
    },

    async selectConversation(sessionId: string) {
      await this.fetchMessages(sessionId)

      if (socket?.connected) {
        socket.emit('support:agent:select', { sessionId })
      }
    },

    async deleteConversation(sessionId: string) {
      if (this.deletingConversation) return

      this.deletingConversation = true
      this.error = null

      try {
        const response = await $fetch<ApiResponse<{ sessionId: string }>>(
          `${useApiBase()}/conversations/${sessionId}`,
          {
            method: 'DELETE',
            headers: this.authHeaders(),
          },
        )

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete conversation')
        }

        this.conversations = this.conversations.filter((item) => item.sessionId !== sessionId)

        if (sessionId in this.unreadBySession) {
          const { [sessionId]: _removed, ...rest } = this.unreadBySession
          this.unreadBySession = rest
        }

        if (this.activeSessionId === sessionId) {
          this.activeSessionId = null
          this.activeMeta = null
          this.messages = []
          this.messagesHasMore = false
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete conversation'
        throw error
      } finally {
        this.deletingConversation = false
      }
    },

    upsertConversationFromMessage(message: ChatMessage, meta?: ConversationMeta | null) {
      const existingIndex = this.conversations.findIndex(
        (item) => item.sessionId === message.sessionId,
      )

      const nextItem: ConversationListItem = {
        sessionId: message.sessionId,
        guestName: meta?.guestName ?? this.conversations[existingIndex]?.guestName ?? '',
        guestEmail: meta?.guestEmail ?? this.conversations[existingIndex]?.guestEmail ?? '',
        status: meta?.status ?? this.conversations[existingIndex]?.status ?? 'open',
        updatedAt: message.createdAt,
        lastMessage: {
          text: message.text,
          sender: message.sender,
          createdAt: message.createdAt,
        },
      }

      if (existingIndex === -1) {
        this.conversations.unshift(nextItem)
        return
      }

      this.conversations.splice(existingIndex, 1)
      this.conversations.unshift(nextItem)
    },

    appendMessage(message: ChatMessage) {
      if (message.sessionId !== this.activeSessionId) return
      if (this.messages.some((item) => item.id === message.id)) return
      this.messages.push(message)
    },

    async connectSocket() {
      if (!import.meta.client || this.isConnecting || socket?.connected) return

      const auth = useAuthStore()
      if (!auth.token) return

      this.isConnecting = true
      this.error = null

      const { io } = await import('socket.io-client')

      if (socket) {
        socket.removeAllListeners()
        socket.disconnect()
      }

      socket = io(useSocketUrl(), {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
      })

      socket.on('connect', () => {
        this.isConnected = true
        this.isConnecting = false
        socket?.emit('support:agent:join', { token: auth.token })
      })

      socket.on('disconnect', () => {
        this.isConnected = false
      })

      socket.on('support:agent:joined', () => {
        if (this.activeSessionId) {
          socket?.emit('support:agent:select', { sessionId: this.activeSessionId })
        }
      })

      socket.on(
        'support:user-message',
        (payload: {
          sessionId?: string
          message?: ChatMessage
          meta?: ConversationMeta | null
        }) => {
          if (!payload.message || !payload.sessionId) return

          this.upsertConversationFromMessage(payload.message, payload.meta)

          if (payload.sessionId !== this.activeSessionId) {
            this.unreadBySession[payload.sessionId] =
              (this.unreadBySession[payload.sessionId] ?? 0) + 1
            return
          }

          this.appendMessage(payload.message)
        },
      )

      socket.on('support:message', (payload: { message?: ChatMessage }) => {
        if (!payload.message) return

        this.upsertConversationFromMessage(payload.message, this.activeMeta)

        if (payload.message.sessionId === this.activeSessionId) {
          this.appendMessage(payload.message)
        }
      })

      socket.on(
        'support:agent:history',
        (payload: { sessionId?: string; meta?: ConversationMeta }) => {
          if (!payload.sessionId || payload.sessionId !== this.activeSessionId) return

          this.activeMeta = payload.meta ?? this.activeMeta
          this.unreadBySession[payload.sessionId] = 0
        },
      )

      socket.on('support:error', (payload: { message?: string }) => {
        this.error = payload.message ?? 'Socket error'
      })

      socket.on('connect_error', () => {
        this.isConnected = false
        this.isConnecting = false
        this.error = 'connection'
      })
    },

    sendReply(text: string) {
      const trimmed = text.trim()
      if (!trimmed || !this.activeSessionId || !socket?.connected) return false

      socket.emit('support:agent:reply', {
        sessionId: this.activeSessionId,
        text: trimmed,
      })

      return true
    },

    disconnectSocket() {
      if (socket) {
        socket.removeAllListeners()
        socket.disconnect()
        socket = null
      }

      this.isConnected = false
      this.isConnecting = false
    },
  },
})
