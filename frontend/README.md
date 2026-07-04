# Frontend

The frontend is a standalone client-side SPA.

It must not import backend code directly. All reads and writes must go through HTTP API calls that match `../typespec/main.tsp`.

## Project boundary

Expected repository layout:

```text
project-root/
  typespec/
    main.tsp
  frontend/
    package.json
    src/
  backend/
    # added later as a sibling directory
```

The future backend will live in `../backend`. The frontend must communicate with it through `VITE_API_BASE_URL` only.

## Stack

- Vite
- React
- TypeScript strict mode
- TanStack Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui-compatible local components
- date-fns
- MSW
- Vitest
- React Testing Library
- Playwright

## Scripts

```bash
npm install
npm run dev
npm run build
npm run test
```

## API configuration

By default, API requests use relative paths like `/event-types` and `/admin/login`.

To point the frontend to a backend server, set:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

To develop without a backend, enable MSW:

```bash
VITE_ENABLE_MSW=true npm run dev
```

MSW handlers live in `src/test/mocks/handlers.ts` and should stay aligned with `../typespec/main.tsp`.

## Architecture rules

- Pages live in `src/pages` and compose feature hooks/components.
- Feature-level server state lives in `src/features/*/queries.ts`.
- Low-level HTTP calls live only in `src/shared/api`.
- Components must not call `fetch` directly.
- Frontend code must not import files from `../backend`.
- Generated or handwritten API DTOs must follow `../typespec/main.tsp`.

## Directory structure

```text
src/
  app/
    app.tsx
    providers.tsx
    query-client.ts
    router.tsx
  pages/
    guest-calendar/
    admin-login/
    admin-event-types/
    admin-availability/
    admin-bookings/
  features/
    auth/
    event-types/
    availability/
    calendar/
    bookings/
  shared/
    api/
    lib/
    types/
    ui/
  test/
    mocks/
```

## API client flow

Preferred long-term flow:

```text
TypeSpec -> OpenAPI -> typed TypeScript API client -> handwritten TanStack Query hooks
```

For now, `src/shared/api/types.ts` mirrors the TypeSpec models manually. When backend/API generation is added, keep the public feature hooks stable and replace only the low-level API client implementation.
