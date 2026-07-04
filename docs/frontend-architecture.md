# Frontend architecture

## Decision

The frontend is implemented as a standalone SPA in `frontend/`.

The backend will be implemented later as a sibling directory inside the same project folder:

```text
project-root/
  frontend/
  backend/
  typespec/
```

## Boundary rules

- The frontend must not import backend code directly.
- The frontend must not read backend storage directly.
- The frontend can only read data and execute actions through HTTP API calls.
- API calls must follow the contract in `typespec/main.tsp`.
- The API base URL is configured with `VITE_API_BASE_URL`.
- Until the backend exists, frontend development uses MSW mocks aligned with the TypeSpec contract.

## Internal frontend layers

```text
pages -> features -> shared/api -> HTTP API
```

- `pages/` compose screens and route-level UI.
- `features/` own feature-specific hooks, schemas, and behavior.
- `shared/api/` is the only place for low-level HTTP calls.
- `shared/ui/` contains reusable UI primitives.
- `test/mocks/` contains MSW handlers and fixtures.

Direct `fetch` calls outside `shared/api/` are not allowed.

## Backend integration

When `backend/` is added, the frontend should continue to run independently.

Expected local setup:

```text
frontend: http://localhost:5173
backend:  http://localhost:3000
```

The frontend points to the backend through:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

No source import from `backend/` should be introduced.
