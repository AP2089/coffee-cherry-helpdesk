<template>
  <div class="flex h-full min-h-0 flex-col">
    <header
      class="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 md:px-6"
    >
      <div>
        <BrandLogo />
        <p class="mt-1 text-xs text-muted-foreground">
          Helpdesk · {{ auth.user?.username }} · {{ auth.user?.role }}
        </p>
      </div>

      <div class="flex items-center gap-4">
        <Badge variant="status" :title="inbox.isConnected ? 'Онлайн' : 'Оффлайн'">
          <span
            class="h-2 w-2 rounded-full"
            :class="inbox.isConnected ? 'bg-success' : 'bg-destructive/80'"
          />
          {{ inbox.isConnected ? 'Подключено' : 'Нет связи' }}
        </Badge>

        <Button type="button" variant="magnetic" size="sm" @click="logout">Выйти</Button>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <InboxConversationList
        class="min-h-0 flex-1 md:h-full md:w-80 md:shrink-0 md:flex-none md:border-r md:border-border"
        :conversations="inbox.conversations"
        :active-session-id="inbox.activeSessionId"
        :loading="inbox.loadingConversations"
        :loading-more="inbox.loadingMoreConversations"
        :has-more="inbox.conversationsHasMore"
        :unread-by-session="inbox.unreadBySession"
        @select="selectConversation"
      />

      <InboxChatPanel
        class="min-h-0 flex-1 overflow-hidden"
        :meta="inbox.activeMeta"
        :messages="inbox.messages"
        :loading="inbox.loadingMessages"
        :loading-more="inbox.loadingMoreMessages"
        :has-more="inbox.messagesHasMore"
        :can-send="inbox.isConnected && Boolean(inbox.activeSessionId)"
        :can-delete="auth.user?.role === UserRole.Admin"
        :deleting="inbox.deletingConversation"
        @send="sendReply"
        @delete="deleteConversation"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserRole } from '~/types/chat'

definePageMeta({
  ssr: false,
})

const auth = useAuthStore()
const inbox = useInboxStore()
const { assertCanEdit } = useCanEdit()

async function selectConversation(sessionId: string) {
  await inbox.selectConversation(sessionId)
}

function sendReply(text: string) {
  if (!assertCanEdit()) return
  inbox.sendReply(text)
}

async function deleteConversation() {
  const sessionId = inbox.activeSessionId
  if (!sessionId || auth.user?.role !== UserRole.Admin) return

  await inbox.deleteConversation(sessionId)
}

async function logout() {
  inbox.disconnectSocket()
  auth.logout()
  await navigateTo('/login')
}

onMounted(async () => {
  auth.hydrate()

  if (!auth.user && auth.token) {
    await auth.fetchMe()
  }

  await inbox.fetchConversations()
  await inbox.connectSocket()
})

onBeforeUnmount(() => {
  inbox.disconnectSocket()
})
</script>
