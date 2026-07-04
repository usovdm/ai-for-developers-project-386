# Backend stack

## Decision

The backend is implemented as a standalone Python application in `backend/`.

Recommended stack:

- FastAPI
- Uvicorn
- Pydantic v2
- SQLModel
- SQLite file storage
- pytest
- httpx or FastAPI TestClient
- uv
- pydantic-settings
- Python `zoneinfo`

The API contract source of truth is `typespec/main.tsp`.

## Why this stack

The project needs a small API backend with clear request/response models, simple local persistence, and strong testability. FastAPI fits this well because routes, schemas, validation, and OpenAPI behavior are explicit and easy for AI agents to inspect and modify.

SQLite is preferred over a JSON file for local storage. It still requires no separate database server, but it gives safer persistence, sorting, filtering, and interval-conflict checks for bookings.

## Storage

Use a local SQLite database file, for example:

```text
backend/.data/app.db
```

No external database service is required for the MVP.

SQLite should store:

- event types;
- availability settings;
- bookings;
- email confirmation codes or dev-email records.

## Libraries

### FastAPI

FastAPI provides the HTTP API layer. It should expose endpoints matching `typespec/main.tsp`.

### Pydantic v2

Pydantic models should define request and response DTOs. These schemas should mirror the TypeSpec contract.

### SQLModel

SQLModel is used for local persistence models and database access on top of SQLite. It keeps database models typed and close to Pydantic-style data structures.

### pytest

pytest covers domain behavior and API scenarios:

- admin login;
- event type CRUD;
- availability update;
- calendar slot generation;
- booking creation;
- booking interval conflict checks;
- guest deletion through email code;
- admin deletion without email code.

### zoneinfo

All date and time logic must use the product timezone:

```text
Europe/Moscow
```

Use Python's standard `zoneinfo` module. Do not introduce a third-party timezone library unless a concrete need appears.

## Suggested structure

```text
backend/
  pyproject.toml
  README.md
  src/
    app/
      main.py
      config.py
      api/
        router.py
        guest.py
        admin.py
      domain/
        event_types.py
        availability.py
        bookings.py
        email_codes.py
      schemas/
        auth.py
        event_types.py
        availability.py
        bookings.py
        errors.py
      services/
        auth_service.py
        calendar_service.py
        booking_service.py
        email_service.py
      storage/
        database.py
        models.py
        repositories.py
  tests/
    test_admin_auth.py
    test_event_types.py
    test_availability.py
    test_calendar.py
    test_bookings.py
```

## Architecture rules

- Backend lives in `backend/` as a separate app.
- Frontend lives in `frontend/` as a separate app.
- Frontend and backend communicate only through HTTP API calls.
- Backend must not import frontend code.
- Frontend must not import backend code.
- API behavior must follow `typespec/main.tsp`.
- Backend owns all business validation, including slot availability and booking interval conflicts.
- Dev-email can be implemented with local logs, SQLite records, or a simple local dev endpoint/interface.

## API implementation approach

Implement endpoints from the TypeSpec contract first, then build internals behind them:

```text
api route -> Pydantic schema -> service -> repository -> SQLite
```

Routes should stay thin. Business rules belong in services. Database access belongs in repositories.

## Non-goals

Avoid these choices for the MVP unless requirements change:

- Django;
- Flask;
- Celery or RQ;
- PostgreSQL or MySQL;
- external email providers;
- JSON file as the primary booking storage;
- direct coupling between backend and frontend source code.
