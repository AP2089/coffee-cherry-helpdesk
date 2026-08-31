# coffee cherry · helpdesk

Панель операторов поддержки для проекта **coffee-cherry**. Inbox диалогов, переписка с клиентами в реальном времени, роли admin/manager.

## Требования

- Node.js ≥ 20
- Запущенный [backend](../backend) на порту `3001`

## Быстрый старт

```bash
npm install
npm run dev
```

Приложение: [http://localhost:3002](http://localhost:3002)

## Docker

Сначала запустите backend, затем:

```bash
docker compose up -d --build
```

## Переменные окружения

Файл `.env` в корне проекта.

| Переменная   | Описание                                     |
| ------------ | -------------------------------------------- |
| `PORT`       | Порт приложения                              |
| `NODE_ENV`   | Режим работы: `development` или `production` |
| `API_URL`    | URL REST API backend для браузера и SSR      |
| `SOCKET_URL` | URL Socket.IO backend                        |

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
