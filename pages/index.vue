<template>
  <div class="flex h-full min-h-0 flex-col">
    <header
      class="flex shrink-0 items-center justify-between border-b border-bone/10 px-4 py-3 md:px-6"
    >
      <div>
        <UiLogo />
        <p class="mt-1 text-xs text-bone/45">
          Helpdesk · {{ auth.user?.username }} · {{ auth.user?.role }}
        </p>
      </div>

      <div class="flex items-center gap-4">
        <span
          class="inline-flex items-center gap-2 text-xs text-bone/45"
          :title="inbox.isConnected ? 'Онлайн' : 'Оффлайн'"
        >
          <span
            class="h-2 w-2 rounded-full"
            :class="inbox.isConnected ? 'bg-emerald-400/90' : 'bg-ember/80'"
          />
          {{ inbox.isConnected ? 'Подключено' : 'Нет связи' }}
        </span>

        <button type="button" class="magnetic-btn px-4 py-2 text-xs" @click="logout">Выйти</button>
      </div>
    </header>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <InboxConversationList
        class="min-h-0 flex-1 md:h-full md:w-80 md:shrink-0 md:flex-none md:border-r md:border-bone/10"
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

async function selectConversation(sessionId: string) {
  await inbox.selectConversation(sessionId)
}

function sendReply(text: string) {
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
