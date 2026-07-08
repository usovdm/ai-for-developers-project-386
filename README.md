# Meeting Booking

[![Hexlet Check](https://github.com/usovdm/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/usovdm/ai-for-developers-project-386/actions)
[![Tests](https://github.com/usovdm/ai-for-developers-project-386/actions/workflows/tests.yml/badge.svg)](https://github.com/usovdm/ai-for-developers-project-386/actions/workflows/tests.yml)

Meeting Booking - MVP-приложение для бронирования встреч у одного владельца календаря. Владелец настраивает типы событий и доступность, а гости без регистрации выбирают свободный слот и создают бронирование.

Production: https://ai-for-developers-project-386-production-18f1.up.railway.app/

## Что Умеет Приложение

- Админ создает, редактирует и удаляет типы событий.
- Админ настраивает общие рабочие дни и рабочее время.
- Гость видит недельный календарь со свободными и занятыми слотами.
- Гость бронирует свободный слот для выбранного типа события.
- Гость удаляет свое бронирование через код подтверждения по email.
- Админ видит и удаляет будущие бронирования по всем типам событий.

## Роли

- Админ: один заранее заданный владелец календаря, который входит через `/admin`.
- Гость: публичный пользователь, который бронирует слоты без аккаунта.

## Ключевые Правила

- Все даты и время в бизнес-логике считаются в `Europe/Moscow`.
- Гость может бронировать только в окне ближайших 14 дней.
- Длительность события ограничена значениями `15`, `30` или `45` минут.
- Время доступности задается с шагом 15 минут.
- Бронирования не могут пересекаться между любыми типами событий.
- Тип события нельзя удалить, если по нему есть будущие бронирования.
- Dev-код подтверждения удаления бронирования: `000000`.

## Технологии

- Backend: FastAPI, Pydantic v2, SQLModel, SQLite, pytest.
- Frontend: React, Vite, TypeScript, TanStack Router, TanStack Query, Tailwind CSS, Vitest.
- API contract: TypeSpec в `typespec/main.tsp`.
- CI: GitHub Actions для backend-тестов, frontend typecheck, frontend-тестов и сборки.
- Releases: release-please на основе Conventional Commits.

## Структура Проекта

```text
backend/    FastAPI-приложение, сервисы, SQLite-хранилище, backend-тесты
frontend/   React SPA, UI-фичи, API-клиент, frontend-тесты
typespec/   HTTP API contract, источник правды для API
docs/       Продуктовая, архитектурная и тестовая документация
```

Репозиторий не является root-managed monorepo. Backend-команды нужно запускать из `backend/`, frontend-команды - из `frontend/`.

## Локальный Запуск

Запуск backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --reload --app-dir src --host 127.0.0.1 --port 3000
```

Запуск frontend с локальным backend:

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:3000 npm run dev
```

Запуск frontend с mock API handlers:

```bash
cd frontend
VITE_ENABLE_MSW=true npm run dev
```

Локальные URL по умолчанию:

```text
frontend: http://localhost:5173
backend:  http://localhost:3000
```

## Проверка

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
npm run typecheck
npm run test
npm run build
```

## API Contract

`typespec/main.tsp` - источник правды для HTTP API. Backend Pydantic schemas/routes, frontend API types и MSW handlers должны оставаться синхронизированными с контрактом.

## Документация

- `docs/product.md` - краткое продуктовое описание.
- `docs/product-spec.md` - роли, страницы, сущности, правила и границы MVP.
- `docs/test-cases.md` - пользовательские и API-сценарии для автоматизации.
- `backend/README.md` - настройка, конфигурация и архитектура backend.
- `frontend/README.md` - настройка, скрипты и архитектура frontend.

## Формат Коммитов

Используйте Conventional Commits для всех коммитов, включая коммиты, которые делает агент.

Формат: `<type>[optional scope][!]: <description>`.

- `feat:` добавляет пользовательскую возможность и выпускает minor release.
- `fix:` исправляет ошибку и выпускает patch release.
- `feat!:` или footer `BREAKING CHANGE:` обозначает breaking change и выпускает major release.
- `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, `build:` и `style:` используются для нерелизных изменений.

Примеры: `feat(frontend): add booking calendar`, `fix(backend): reject overlapping bookings`, `ci: add release-please workflow`.

Коммиты агента должны использовать тот же формат. Не используйте расплывчатые сообщения вроде `Update files`, `Fix stuff` или `WIP`.
