import type {
  ChatMessage,
  ConversationListItem,
  ConversationMeta,
  PaginatedList,
} from '~/types/chat'

export function normalizeConversationPage(data: unknown): {
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

export function normalizeMessagesPage(data: unknown): {
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

export function prependOlderMessages(current: ChatMessage[], older: ChatMessage[]): ChatMessage[] {
  const existingIds = new Set(current.map((item) => item.id))
  const uniqueOlder = older.filter((item) => !existingIds.has(item.id))

  if (!uniqueOlder.length) return current

  return [...uniqueOlder, ...current]
}
