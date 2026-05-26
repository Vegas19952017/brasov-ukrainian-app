# Brasov Ukrainian App

**Telegram Mini App** — каталог специалистов и услуг для русскоязычной экспат-экосистемы Брашова (Румыния).

## Технологии

- **Frontend:** React 18 + TypeScript + Vite
- **Стили:** Tailwind CSS
- **Состояние:** Zustand
- **БД (опционально):** Supabase (PostgreSQL)
- **Роутинг:** React Router v6
- **i18n:** react-i18next (UK / RO / EN)

## Функции MVP

- Каталог специалистов с карточками (фото, услуги, языки, районы, рейтинг)
- Поиск и фильтры (язык, район, рейтинг)
- Сортировка: Premium → Basic → Free → рейтинг → дата
- Отзывы с премодерацией, ответ владельца, жалоба
- Самозаявка специалиста (форма + статусы)
- Уведомления: одобрение/отклонение, новый отзыв
- Карпулинг (отдельный тип объявления)
- Чат сообщества
- Карта специалистов (Leaflet)
- Панель администратора (модерация, аналитика, управление продвижением)

## Запуск локально

```bash
npm install
cp .env.example .env
npm run dev
```

## Переменные окружения

| Переменная | Описание |
|---|---|
| `VITE_DEMO_ADMIN` | `true` — демо-режим с правами админа |
| `VITE_ADMIN_TELEGRAM_IDS` | Telegram ID через запятую для автоадмина |
| `VITE_ADMIN_USERNAME` | Telegram username админа |
| `VITE_SUPABASE_URL` | URL Supabase проекта (опционально) |
| `VITE_SUPABASE_ANON_KEY` | Anon Key Supabase (опционально) |

## Деплой

При пуше в `main` GitHub Actions автоматически собирает и публикует на GitHub Pages.

**Live demo:** https://Vegas19952017.github.io/brasov-ukrainian-app/

## База данных

Схема PostgreSQL: [`schema.sql`](./schema.sql)  
Запустите в Supabase SQL Editor для создания всех таблиц, RLS-политик и сид-данных.

## Структура проекта

```
src/
├── components/     # UI-компоненты
├── pages/          # Страницы (роуты)
├── store/          # Zustand state management
├── lib/            # Утилиты, Supabase, уведомления
├── types/          # TypeScript типы
└── i18n/           # Переводы (UK/RO/EN)
```
