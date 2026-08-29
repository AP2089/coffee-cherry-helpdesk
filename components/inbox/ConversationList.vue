<template>
  <aside class="flex h-full min-h-0 flex-col overflow-hidden border-b border-bone/10 md:border-b-0">
    <div class="shrink-0 border-b border-bone/10 px-4 py-3">
      <p class="text-xs uppercase tracking-[0.12em] text-bone/45">Диалоги</p>
    </div>

    <div
      ref="listEl"
      class="inbox-list min-h-0 flex-1 overflow-y-auto"
      @scroll="listScroll.onScroll"
    >
      <p v-if="loading" class="px-4 py-6 text-sm text-bone/45">Загрузка…</p>

      <template v-if="!loading">
        <button
          v-for="conversation in conversations"
          :key="conversation.sessionId"
          type="button"
          class="inbox-list__item w-full border-b border-bone/10 px-4 py-3 text-left transition-colors"
          :class="{ 'is-active': conversation.sessionId === activeSessionId }"
          @click="$emit('select', conversation.sessionId)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="truncate text-sm font-medium">
              {{ conversation.guestName || 'Гость' }}
            </p>
            <span
              v-if="unreadBySession[conversation.sessionId]"
              class="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-bronze px-1 text-[10px] font-semibold text-ink"
            >
              {{ unreadBySession[conversation.sessionId] }}
            </span>
          </div>

          <p class="mt-0.5 truncate text-xs text-bone/45">
            {{ conversation.guestEmail || conversation.sessionId.slice(0, 8) }}
          </p>

          <p v-if="conversation.lastMessage" class="mt-2 line-clamp-2 text-xs text-bone/55">
            {{ conversation.lastMessage.text }}
          </p>

          <p class="mt-2 text-[10px] uppercase tracking-[0.08em] text-bone/30">
            {{ formatTime(conversation.updatedAt) }}
          </p>
        </button>

        <p v-if="!conversations.length" class="px-4 py-6 text-sm text-bone/45">
          Пока нет обращений
        </p>

        <p
          v-if="conversations.length && loadingMore"
          class="px-4 py-3 text-center text-xs text-bone/40"
        >
          Загрузка…
        </p>

        <p
          v-else-if="conversations.length && !hasMore"
          class="px-4 py-3 text-center text-[10px] uppercase tracking-[0.08em] text-bone/25"
        >
          Все диалоги загружены
        </p>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { ConversationListItem } from '~/types/chat'

const props = defineProps<{
  conversations: ConversationListItem[]
  activeSessionId: string | null
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  unreadBySession: Record<string, number>
}>()

defineEmits<{
  select: [sessionId: string]
}>()

const inbox = useInboxStore()
const listEl = ref<HTMLElement | null>(null)

const listScroll = useScrollLoad(
  () => listEl.value,
  () => inbox.loadMoreConversations(),
  {
    canLoadMore: () =>
      inbox.conversationsHasMore && !inbox.loadingConversations && !inbox.loadingMoreConversations,
    isScrollTrigger: isNearScrollBottom,
  },
)

const isUnderfilled = (element: HTMLElement) => element.scrollHeight <= element.clientHeight + 1

async function ensureListFilled() {
  if (!props.hasMore || props.loading) return
  await listScroll.ensureFilled(isUnderfilled)
}

watch(
  () => [props.loading, props.hasMore, props.conversations.length] as const,
  async ([loading, hasMore]) => {
    if (loading || !hasMore) return
    await ensureListFilled()
  },
)

onMounted(async () => {
  await ensureListFilled()
})

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.inbox-list {
  scrollbar-width: thin;
  scrollbar-color: rgba($bone, 0.18) transparent;
}

.inbox-list__item {
  &:hover,
  &.is-active {
    background: rgba($bone, 0.04);
  }

  &.is-active {
    border-left: 2px solid rgba($bronze, 0.8);
    padding-left: calc(1rem - 2px);
  }
}
</style>
