import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0E0C0A',
          soft: '#1A1714',
        },
        bone: {
          DEFAULT: '#EDE8DF',
          mute: '#C9C2B6',
        },
        bronze: {
          DEFAULT: '#A67C52',
        },
        ember: {
          DEFAULT: '#C45C26',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
