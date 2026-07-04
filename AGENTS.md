# Repository Instructions

## Project Shape
- This is not a root-managed monorepo: run backend commands from `backend/` and frontend commands from `frontend/`.
- `typespec/main.tsp` is the API contract source of truth. Keep backend Pydantic schemas/routes and frontend `src/shared/api/types.ts` plus MSW handlers aligned with it.
- Frontend and backend are standalone siblings. Do not import code across `frontend/` and `backend/`; all integration goes through HTTP.
- Backend flow is `api route -> Pydantic schema -> service -> repository -> SQLite`; keep routes thin and business rules in `backend/src/app/services`.
- Frontend flow is `pages -> features -> shared/api -> HTTP API`; low-level HTTP calls belong only in `frontend/src/shared/api`.

## Backend
- Setup from `backend/`: `python3 -m venv .venv`, `. .venv/bin/activate`, `pip install -e '.[dev]'`.
- Run the API from `backend/`: `uvicorn app.main:app --reload --app-dir src --host 127.0.0.1 --port 3000`.
- Run all backend tests from `backend/`: `pytest`.
- Run one backend test from `backend/`: `pytest tests/test_api.py::test_name`.
- Backend settings use `APP_` env vars and load `.env` from the backend working directory; default SQLite storage is `backend/.data/app.db`.
- Tests monkeypatch `APP_DATABASE_URL` to a temp SQLite DB and clear the cached settings/engine in `tests/conftest.py`.

## Frontend
- Install dependencies from `frontend/`: `npm install`.
- Run dev server from `frontend/`: `npm run dev`.
- Point the SPA at the local backend with `VITE_API_BASE_URL=http://localhost:3000 npm run dev`.
- Develop without a backend with MSW: `VITE_ENABLE_MSW=true npm run dev`; handlers live in `src/test/mocks/handlers.ts` and use `demo-admin-token` after mock login.
- Verify frontend from `frontend/`: `npm run typecheck`, `npm run test`, `npm run build`.
- Run a focused Vitest file from `frontend/`: `npm run test -- src/shared/ui/button.test.tsx`.
- `npm run test:e2e` exists, but no Playwright config or e2e tests are currently present.

## Domain Gotchas
- All date/time business logic is in `Europe/Moscow`; the booking window is the nearest 14 days.
- Event durations are only `15`, `30`, or `45` minutes; availability times use a 15-minute step.
- Booking creation must re-check availability and reject any overlapping interval across all event types, not just equal start times.
- Guest booking deletion requires an email code; the dev code is `000000`. Admin deletion does not require the code.
- The generated Hexlet workflow `.github/workflows/hexlet-check.yml` explicitly says not to edit or delete it.
