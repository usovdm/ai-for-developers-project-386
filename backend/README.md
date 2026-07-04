# Backend

Standalone FastAPI backend for the meeting booking MVP.

The backend exposes a JSON HTTP API for the separate frontend client in `../frontend`. It must not import frontend code, and the frontend must not import backend code.

The API contract source of truth is `../typespec/main.tsp`.

## Stack

- FastAPI
- Uvicorn
- Pydantic v2
- SQLModel
- SQLite file storage
- pytest
- Python `zoneinfo`

## Local setup

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]'
```

Run the API:

```bash
uvicorn app.main:app --reload --app-dir src --host 127.0.0.1 --port 3000
```

Run tests:

```bash
pytest
```

## Configuration

Environment variables use the `APP_` prefix.

```bash
APP_DATABASE_URL=sqlite:///./.data/app.db
APP_FRONTEND_ORIGIN=http://localhost:5173
APP_ADMIN_LOGIN=admin
APP_ADMIN_PASSWORD=admin
APP_ADMIN_TOKEN=dev-admin-token
APP_TIMEZONE=Europe/Moscow
APP_BOOKING_WINDOW_DAYS=14
```

## Frontend integration

Expected local setup:

```text
frontend: http://localhost:5173
backend:  http://localhost:3000
```

The frontend should point to the backend with:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Architecture

```text
api route -> Pydantic schema -> service -> repository -> SQLite
```

- `src/app/api` contains HTTP routes and dependencies.
- `src/app/schemas` mirrors the TypeSpec request and response DTOs.
- `src/app/services` owns business rules.
- `src/app/storage` owns SQLite models, sessions, and repository helpers.
- `tests` covers API and business flows.

## Business rules owned by backend

- Date and time logic uses `Europe/Moscow`.
- Booking window is the nearest 14 days.
- Event duration is limited to `15`, `30`, or `45` minutes.
- Booking creation rechecks actual slot availability.
- Booking intervals cannot intersect across any event type.
- Event type deletion is blocked when future bookings exist.
- Guest booking deletion requires an email code.
- Admin booking deletion does not require an email code.

## Dev email

Real email providers are outside the MVP.

Deletion codes are stored locally in SQLite. The current dev confirmation code is `000000`.
