# Frontend stack

## Decision

The frontend is a client-side SPA. SSR is not required for this project.

Recommended stack:

- Vite
- React
- TypeScript with strict mode
- TanStack Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui
- date-fns
- MSW
- Vitest
- React Testing Library
- Playwright

The API contract source of truth is `typespec/main.tsp`.

## Why this stack

This product does not need SSR, SEO-specific rendering, server actions, or framework-level backend features. A Vite SPA keeps the application simple and predictable.

The stack is optimized for development with AI agents:

- explicit project structure instead of framework magic;
- strong TypeScript boundaries between pages, features, API, and shared code;
- generated or typed API access based on the TypeSpec contract;
- isolated feature folders that can be changed independently;
- testable user flows with MSW, Vitest, and Playwright;
- UI components that are copied into the codebase and remain easy to inspect and modify.

## Libraries

### Vite

Vite provides a minimal SPA setup with fast local development and little framework-specific behavior.

### React

React is the UI runtime for pages, forms, modals, and the weekly calendar.

### TanStack Router

TanStack Router gives type-safe routing for guest and admin pages without requiring SSR.

Expected routes:

- `/` - guest calendar;
- `/admin` - admin login or admin layout;
- `/admin/event-types` - event type management;
- `/admin/availability` - availability settings;
- `/admin/bookings` - upcoming bookings.

### TanStack Query

TanStack Query owns server state:

- event types;
- calendar slots;
- bookings;
- availability settings;
- admin mutations.

Local component state should stay local. Do not add Redux for this MVP unless a concrete need appears.

### React Hook Form and Zod

Forms should use React Hook Form with Zod schemas:

- admin login;
- create and edit event type;
- availability settings;
- create booking;
- request deletion code;
- confirm booking deletion.

### Tailwind CSS and shadcn/ui

Tailwind CSS provides styling primitives. shadcn/ui provides accessible UI components that live directly in the repository and can be modified by agents without hidden framework behavior.

### date-fns

date-fns is used for date arithmetic and formatting. All product rules must be implemented with the project timezone `Europe/Moscow` in mind.

### MSW, Vitest, React Testing Library, Playwright

MSW should mock API responses from the TypeSpec contract during frontend development.

Vitest and React Testing Library cover unit and component behavior.

Playwright covers critical user flows:

- admin creates an event type;
- guest creates a booking;
- occupied slots block intersections;
- guest deletes a booking with an email code;
- admin deletes a booking without an email code.

## Suggested structure

```text
src/
  app/
    router.tsx
    query-client.ts
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
    ui/
    lib/
    types/
```

## API client approach

Use `typespec/main.tsp` as the source of truth for the backend contract.

Preferred flow:

```text
TypeSpec -> OpenAPI -> typed TypeScript API client -> handwritten TanStack Query hooks
```

The generated client should stay focused on HTTP calls and DTO types. Query and mutation hooks should be handwritten near the relevant feature code, because this keeps business flows readable and easier for agents to edit.

## Non-goals

Avoid these choices for the MVP unless requirements change:

- Next.js, Remix, or other SSR-first frameworks;
- Redux for server state;
- Moment.js;
- heavy calendar frameworks before proving that the custom weekly calendar is insufficient;
- full UI generation from schemas.
