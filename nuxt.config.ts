export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  srcDir: '.',
  devtools: { enabled: false },

  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss', '@pinia/nuxt', '@vueuse/nuxt'],

  eslint: {
    config: {
      stylistic: false,
    },
  },

  css: ['~/assets/scss/main.scss'],

  runtimeConfig: {
    apiUrl: process.env.NUXT_API_URL || 'http://127.0.0.1:3001/api',
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:3001',
    },
  },

  app: {
    head: {
      title: 'coffee cherry · helpdesk',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0E0C0A' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
