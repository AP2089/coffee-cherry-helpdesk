<template>
  <div class="flex min-h-dvh items-center justify-center px-4">
    <form class="w-full max-w-sm border border-bone/15 bg-ink-soft p-6" @submit.prevent="submit">
      <UiLogo size="lg" />
      <p class="mt-1 text-sm text-bone/50">Helpdesk</p>

      <label class="mt-6 block text-xs uppercase tracking-[0.12em] text-bone/45">
        Логин
        <input
          v-model="username"
          type="text"
          autocomplete="username"
          class="helpdesk-input mt-2 w-full"
          required
        />
      </label>

      <label class="mt-4 block text-xs uppercase tracking-[0.12em] text-bone/45">
        Пароль
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="helpdesk-input mt-2 w-full"
          required
        />
      </label>

      <p v-if="auth.error" class="mt-4 text-sm text-ember">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        class="magnetic-btn magnetic-btn--filled mt-6 w-full px-4 py-3 text-xs"
        :disabled="auth.loading"
      >
        {{ auth.loading ? 'Вход…' : 'Войти' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  ssr: false,
})

const auth = useAuthStore()
const username = ref('')
const password = ref('')

const errorMessage = computed(() => {
  if (auth.error === 'Invalid credentials' || auth.error === 'Unauthorized') {
    return 'Неверный логин или пароль'
  }

  if (auth.error === 'Route not found') {
    return 'Backend недоступен — проверьте, что сервер запущен на порту 3001'
  }

  return auth.error || 'Не удалось войти'
})

async function submit() {
  try {
    await auth.login(username.value, password.value)
    await navigateTo('/')
  } catch {
    // error in store
  }
}
</script>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.helpdesk-input {
  border: 1px solid rgba($bone, 0.12);
  background: transparent;
  color: $bone;
  padding: 0.625rem 0.75rem;
  outline: none;

  &:focus {
    border-color: rgba($bronze, 0.45);
  }
}
</style>
