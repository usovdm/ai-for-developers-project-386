import { Link, Outlet, createRootRoute, createRoute, createRouter, redirect, useRouterState } from "@tanstack/react-router";
import { AdminAvailabilityPage } from "@/pages/admin-availability";
import { AdminBookingsPage } from "@/pages/admin-bookings";
import { AdminEventTypesPage } from "@/pages/admin-event-types";
import { AdminLoginPage } from "@/pages/admin-login";
import { DevEmailsPage } from "@/pages/dev-emails";
import { GuestCalendarPage } from "@/pages/guest-calendar";
import { hasAdminToken } from "@/shared/lib/admin-session";

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdminSection = pathname.startsWith("/admin/") && hasAdminToken();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4 text-sm">
          <Link to="/" className="font-semibold text-slate-950">
            Meeting Booking
          </Link>
          <Link to="/admin" activeProps={{ className: "text-blue-600" }}>
            Admin
          </Link>
          {isAdminSection ? (
            <>
              <Link to="/admin/event-types" activeProps={{ className: "text-blue-600" }}>
                Event types
              </Link>
              <Link to="/admin/availability" activeProps={{ className: "text-blue-600" }}>
                Availability
              </Link>
              <Link to="/admin/bookings" activeProps={{ className: "text-blue-600" }}>
                Bookings
              </Link>
            </>
          ) : null}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const guestCalendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GuestCalendarPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLoginPage,
});

function requireAdminToken() {
  if (!hasAdminToken()) {
    throw redirect({ to: "/admin" });
  }
}

const adminEventTypesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/event-types",
  beforeLoad: requireAdminToken,
  component: AdminEventTypesPage,
});

const adminAvailabilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/availability",
  beforeLoad: requireAdminToken,
  component: AdminAvailabilityPage,
});

const adminBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/bookings",
  beforeLoad: requireAdminToken,
  component: AdminBookingsPage,
});

const devEmailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dev/emails",
  component: DevEmailsPage,
});

const routeTree = rootRoute.addChildren([
  guestCalendarRoute,
  adminLoginRoute,
  adminEventTypesRoute,
  adminAvailabilityRoute,
  adminBookingsRoute,
  devEmailsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
