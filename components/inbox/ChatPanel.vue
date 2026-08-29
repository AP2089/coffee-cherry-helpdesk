<template>
  <section class="relative flex h-full min-h-0 flex-col overflow-hidden">
    <template v-if="meta">
      <div class="shrink-0 border-b border-bone/10 px-4 py-3 md:px-6">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ meta.guestName || 'Гость' }}</p>
            <p class="text-xs text-bone/45">{{ meta.guestEmail }}</p>
          </div>

          <button
            v-if="canDelete"
            type="button"
            class="magnetic-btn shrink-0 px-3 py-1.5 text-xs text-ember/90 hover:text-ember disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="deleting"
            @click="openDeleteConfirm"
          >
            {{ deleting ? 'Удаление…' : 'Удалить' }}
          </button>
        </div>
      </div>

      <div
        ref="messagesEl"
        class="inbox-messages min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6"
        @scroll="messagesScroll.onScroll"
      >
        <p v-if="loadingMore" class="text-center text-xs text-bone/40">Загрузка…</p>

        <p v-if="loading" class="text-sm text-bone/45">Загрузка сообщений…</p>

        <article
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.sender === 'agent' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] border px-3 py-2 text-sm leading-relaxed"
            :class="
              message.sender === 'agent'
                ? 'border-bronze/25 bg-bronze/20 text-bone'
                : 'border-bone/10 bg-bone/5 text-bone/80'
            "
          >
            <p class="whitespace-pre-wrap break-words">{{ message.text }}</p>
            <p class="mt-1 text-[10px] uppercase tracking-[0.08em] text-bone/35">
              {{ formatTime(message.createdAt) }}
            </p>
          </div>
        </article>
      </div>

      <form class="shrink-0 border-t border-bone/10 p-3 md:px-6" @submit.prevent="submit">
        <div class="flex items-stretch gap-2">
          <textarea
            v-model="draft"
            rows="2"
            class="inbox-textarea min-h-[44px] max-h-28 flex-1 resize-none px-3 py-2 text-sm outline-none"
            placeholder="Ответ клиенту…"
            :disabled="!canSend"
            @keydown.enter.exact.prevent="submit"
          />
          <button
            type="submit"
            class="inbox-send magnetic-btn magnetic-btn--filled shrink-0 flex w-11 items-center justify-center"
            :disabled="!canSend || !draft.trim()"
            aria-label="Отправить"
          >
            <svg
              viewBox="0 0 24 24"
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12l14-7-7 14-2-5-5-2z" />
            </svg>
          </button>
        </div>
      </form>
    </template>

    <div v-else class="flex min-h-0 flex-1 items-center justify-center px-4 md:px-6">
      <p class="text-sm text-bone/45">Выберите диалог слева</p>
    </div>

    <Transition name="inbox-confirm">
      <div
        v-if="showDeleteConfirm"
        class="inbox-confirm absolute inset-0 z-10 flex items-center justify-center bg-ink/75 px-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inbox-delete-title"
        @click.self="cancelDelete"
      >
        <div
          class="inbox-confirm__panel w-full max-w-sm border border-bone/15 bg-ink p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        >
          <p id="inbox-delete-title" class="text-sm leading-relaxed text-bone/85">
            Удалить диалог и все сообщения?
          </p>
          <p v-if="meta" class="mt-2 text-xs text-bone/45">
            {{ meta.guestName || 'Гость' }} · {{ meta.guestEmail || meta.sessionId.slice(0, 8) }}
          </p>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="magnetic-btn px-4 py-2 text-xs"
              :disabled="deleting"
              @click="cancelDelete"
            >
              Отмена
            </button>
            <button
              type="button"
              class="magnetic-btn px-4 py-2 text-xs text-ember/90 hover:text-ember"
              :disabled="deleting"
              @click="confirmDelete"
            >
              {{ deleting ? 'Удаление…' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import type { ChatMessage, ConversationMeta } from '~/types/chat'

const props = defineProps<{
  meta: ConversationMeta | null
  messages: ChatMessage[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  canSend: boolean
  canDelete: boolean
  deleting: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
  delete: []
}>()

const inbox = useInboxStore()
const draft = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const showDeleteConfirm = ref(false)

function openDeleteConfirm() {
  if (props.deleting) return
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
}

function confirmDelete() {
  showDeleteConfirm.value = false
  emit('delete')
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function scrollToBottom() {
  nextTick(() => {
    if (!messagesEl.value) return
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

async function loadOlderMessages() {
  const el = messagesEl.value
  if (!el || inbox.loadingMessages || inbox.loadingMoreMessages || !inbox.messagesHasMore) return

  const previousHeight = el.scrollHeight
  await inbox.loadOlderMessages()

  await nextTick()
  if (!messagesEl.value) return
  messagesEl.value.scrollTop = messagesEl.value.scrollHeight - previousHeight
}

const messagesScroll = useScrollLoad(() => messagesEl.value, loadOlderMessages, {
  canLoadMore: () =>
    inbox.messagesHasMore &&
    !inbox.loadingMessages &&
    !inbox.loadingMoreMessages &&
    inbox.messages.length > 0,
  isScrollTrigger: isNearScrollTop,
})

function submit() {
  const text = draft.value.trim()
  if (!text || !props.canSend) return

  emit('send', text)
  draft.value = ''
}

watch(
  () => props.messages.at(-1)?.id,
  () => {
    scrollToBottom()
  },
)

watch(
  () => props.meta?.sessionId,
  async () => {
    showDeleteConfirm.value = false
    draft.value = ''
    scrollToBottom()
    await messagesScroll.ensureFilled((element) => element.scrollHeight <= element.clientHeight + 1)
  },
)

watch(
  () => [props.loading, props.hasMore] as const,
  async ([loading, hasMore]) => {
    if (loading || !hasMore) return
    await messagesScroll.ensureFilled((element) => element.scrollHeight <= element.clientHeight + 1)
  },
)
</script>

<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.inbox-messages {
  scrollbar-width: thin;
  scrollbar-color: rgba($bone, 0.18) transparent;
}

.inbox-textarea {
  border: 1px solid rgba($bone, 0.12);
  background: transparent;
  color: $bone;

  &:focus {
    border-color: rgba($bronze, 0.45);
  }

  &::placeholder {
    color: rgba($bone, 0.35);
  }
}

.inbox-send {
  padding: 0;
}

.inbox-confirm-enter-active {
  transition: opacity 0.3s $ease-premium;

  .inbox-confirm__panel {
    transition:
      opacity 0.3s $ease-premium,
      transform 0.3s $ease-premium;
  }
}

.inbox-confirm-leave-active {
  transition: opacity 0.2s $ease-premium;

  .inbox-confirm__panel {
    transition:
      opacity 0.2s $ease-premium,
      transform 0.2s $ease-premium;
  }
}

.inbox-confirm-enter-from,
.inbox-confirm-leave-to {
  opacity: 0;

  .inbox-confirm__panel {
    opacity: 0;
    transform: translateY(0.75rem) scale(0.95);
  }
}
</style>
