import type { ApiResponse, FetchOptions } from '~/types/api'
import type {
  ChatMessage,
  ConversationListItem,
  ConversationMeta,
  PaginatedList,
} from '~/types/chat'

export const apiGetConversations = (
  query: { limit: number; offset: number },
  options: FetchOptions = {},
) => {
  const { $apiContent } = useNuxtApp()

  return $apiContent<ApiResponse<PaginatedList<ConversationListItem> | ConversationListItem[]>>(
    '/conversations',
    {
      query,
      ...options,
    },
  )
}

export const apiGetConversationMessages = (
  sessionId: string,
  query: { limit: number; before?: string },
  options: FetchOptions = {},
) => {
  const { $apiContent } = useNuxtApp()

  return $apiContent<
    ApiResponse<{ meta: ConversationMeta; messages: ChatMessage[]; hasMore?: boolean }>
  >(`/conversations/${sessionId}/messages`, {
    query,
    ...options,
  })
}

export const apiDeleteConversation = (sessionId: string, options: FetchOptions = {}) => {
  const { $apiContent } = useNuxtApp()

  return $apiContent<ApiResponse<{ sessionId: string }>>(`/conversations/${sessionId}`, {
    method: 'DELETE',
    ...options,
  })
}
