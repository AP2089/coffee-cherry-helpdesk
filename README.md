# coffee cherry · helpdesk

Панель операторов поддержки для проекта **coffee-cherry**. Inbox диалогов, переписка с клиентами в реальном времени, роли admin/manager.

## Требования

- Node.js ≥ 20
- Запущенный [backend](../backend) на порту `3001`

## Быстрый старт

```bash
npm install
cp .env.example .env
npm run dev
```

Приложение: [http://localhost:3002](http://localhost:3002)

## Переменные окружения

| Переменная               | Описание            | По умолчанию                |
| ------------------------ | ------------------- | --------------------------- |
| `NUXT_PUBLIC_API_URL`    | REST API backend    | `http://127.0.0.1:3001/api` |
| `NUXT_PUBLIC_SOCKET_URL` | Socket.IO backend   | `http://127.0.0.1:3001`     |
| `NUXT_API_URL`           | Server-side API URL | `http://127.0.0.1:3001/api` |

Backend должен разрешать origin helpdesk в `CORS_ORIGIN` (например `http://localhost:3002`).

## Учётные записи (seed backend)

| Логин     | Пароль    | Роль                               |
| --------- | --------- | ---------------------------------- |
| `admin`   | `admin`   | Admin — удаление диалогов          |
| `manager` | `manager` | Manager — только просмотр и ответы |

## Скрипты

| Команда                | Описание              |
| ---------------------- | --------------------- |
| `npm run dev`          | Dev-сервер на `:3002` |
| `npm run build`        | Production-сборка     |
| `npm run preview`      | Preview сборки        |
| `npm run lint`         | ESLint                |
| `npm run lint:fix`     | ESLint с автофиксом   |
| `npm run format`       | Prettier              |
| `npm run format:check` | Проверка Prettier     |

Pre-commit hook (Husky + lint-staged): ESLint и Prettier для staged-файлов.
