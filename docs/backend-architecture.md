# Backend architecture

## Decision

The backend is implemented as a standalone Python API application in `backend/`.

It provides the HTTP API described by `typespec/main.tsp` and is designed for a separate frontend client in `frontend/`.

Expected project layout:

```text
project-root/
  frontend/
  backend/
  typespec/
```

## Boundary rules

- Backend exposes JSON HTTP endpoints only.
- Backend does not serve frontend HTML or frontend assets.
- Backend must not import code from `frontend/`.
- Frontend must not import code from `backend/`.
- Frontend and backend communicate only through HTTP API calls.
- API behavior must follow `typespec/main.tsp`.
- CORS is configured for the frontend origin, default `http://localhost:5173`.

## Internal backend layers

```text
api route -> Pydantic schema -> service -> repository -> SQLite
```

- `api/` contains FastAPI routes and HTTP dependencies.
- `schemas/` contains request and response DTOs matching TypeSpec.
- `services/` contains business rules and orchestration.
- `storage/` contains SQLModel tables, database session setup, and repository helpers.
- `tests/` covers contract-level API behavior and key business scenarios.

Routes should stay thin. Business validation belongs in services. Database queries belong in storage/repositories.

## API surface

Guest endpoints:

- `GET /event-types`
- `GET /calendar/slots`
- `POST /bookings`
- `POST /bookings/{bookingId}/deletion-code`
- `DELETE /bookings/{bookingId}`

Admin endpoints:

- `POST /admin/login`
- `GET /admin/event-types`
- `POST /admin/event-types`
- `PATCH /admin/event-types/{eventTypeId}`
- `DELETE /admin/event-types/{eventTypeId}`
- `GET /admin/availability`
- `PUT /admin/availability`
- `GET /admin/bookings/upcoming`
- `DELETE /admin/bookings/{bookingId}`

## Local storage

The backend uses a local SQLite file by default:

```text
backend/.data/app.db
```

No external database server is required for the MVP.

## Frontend integration

Expected local ports:

```text
frontend: http://localhost:5173
backend:  http://localhost:3000
```

The frontend points to the backend with:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

The backend allows this origin with:

```bash
APP_FRONTEND_ORIGIN=http://localhost:5173
```
