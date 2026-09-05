export type ChatSender = 'user' | 'agent'

export interface ChatMessage {
  id: string
  sessionId: string
  sender: ChatSender
  text: string
  createdAt: string
}

export interface ConversationListItem {
  sessionId: string
  guestName: string
  guestEmail: string
  status: 'open' | 'closed'
  updatedAt: string
  lastMessage?: {
    text: string
    sender: ChatSender
    createdAt: string
  }
}

export interface PaginatedList<T> {
  items: T[]
  total: number
  hasMore: boolean
}

export interface MessagesPage {
  meta: ConversationMeta
  messages: ChatMessage[]
  hasMore: boolean
}

export interface ConversationMeta {
  sessionId: string
  guestName: string
  guestEmail: string
  status: 'open' | 'closed'
}

export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Guest = 'guest',
}

export interface AuthUser {
  username: string
  role: UserRole
}
