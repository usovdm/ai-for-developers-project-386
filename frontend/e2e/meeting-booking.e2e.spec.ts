import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:3100";
const frontendUrl = process.env.E2E_FRONTEND_BASE_URL ?? "http://127.0.0.1:4174";
const adminToken = "dev-admin-token";
const adminTokenStorageKey = "meeting-booking.admin-token";
const eventTypeColors = ["blue", "green", "yellow", "orange", "purple", "red"];
const protectedAdminPaths = ["/admin/event-types", "/admin/availability", "/admin/bookings"] as const;

type EventType = {
  id: string;
  title: string;
  description: string;
  durationMinutes: 15 | 30 | 45;
  color: string;
};

type Booking = {
  id: string;
  title: string;
  guestName: string;
  guestEmail: string;
  comment?: string;
  startAt: string;
  endAt: string;
  eventTypeTitle: string;
};

type DevEmail = {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  createdAt: string;
};

test.describe.configure({ mode: "serial" });

test("TC-EVENT-005: guest sees booking unavailable state when no event types exist", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Book a meeting" })).toBeVisible();
  await expect(page.getByText("Booking is not available yet.")).toBeVisible();
  await expect(page.getByLabel("Event type")).toHaveValue("");
});

test("TC-NAV-001: guest navigation hides admin and dev sections", async ({ page }) => {
  await page.goto("/");

  const navigation = page.getByRole("navigation");
  await expect(navigation.getByRole("link", { name: "Meeting Booking" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Admin" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Event types" })).toBeHidden();
  await expect(navigation.getByRole("link", { name: "Availability" })).toBeHidden();
  await expect(navigation.getByRole("link", { name: "Bookings" })).toBeHidden();
  await expect(navigation.getByRole("link", { name: "Dev emails" })).toBeHidden();
});

test("TC-AUTH-004: protected admin pages redirect unauthenticated users to login", async ({ page }) => {
  for (const path of protectedAdminPaths) {
    await page.goto(path);

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create event type" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Save availability" })).toBeHidden();
    await expect(page.getByRole("heading", { name: "Upcoming bookings" })).toBeHidden();
  }
});

test("TC-CORS-001: backend allows localhost and 127.0.0.1 frontend origins", async ({ request }) => {
  for (const origin of frontendCorsOrigins()) {
    const response = await request.fetch(`${apiBaseUrl}/event-types`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["access-control-allow-origin"]).toBe(origin);
  }
});

test("TC-AUTH-002: admin login rejects invalid credentials", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Login").fill("wrong-admin");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Invalid admin credentials")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("TC-NAV-002: admin navigation appears after successful sign in", async ({ page }) => {
  await signInAsAdmin(page);

  const navigation = page.getByRole("navigation");
  await expect(navigation.getByRole("link", { name: "Event types" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Availability" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Bookings" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Dev emails" })).toBeHidden();
});

test("TC-AUTH-001, TC-EVENT-001/002/006/008: admin signs in, validates, creates, edits and deletes event type", async ({ page }) => {
  const title = uniqueName("E2E Strategy Call");
  const updatedTitle = uniqueName("E2E Updated Strategy Call");
  const description = "Automation-created event type";

  await signInAsAdmin(page);

  await page.getByRole("button", { name: "Create event type" }).click();
  await expect(page.getByText("Title is required")).toBeVisible();
  await expect(page.getByText("Description is required")).toBeVisible();

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill(description);
  await page.getByLabel("Duration").selectOption("45");
  await page.getByRole("button", { name: "Create event type" }).click();

  const card = eventTypeCard(page, title);
  await expect(card).toContainText(description);
  await expect(card).toContainText(/45 min \/ (blue|green|yellow|orange|purple|red)/);

  await card.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Title").fill(updatedTitle);
  await page.getByLabel("Duration").selectOption("15");
  await page.getByRole("button", { name: "Save event type" }).click();

  const updatedCard = eventTypeCard(page, updatedTitle);
  await expect(updatedCard).toContainText(description);
  await expect(updatedCard).toContainText(/15 min \/ (blue|green|yellow|orange|purple|red)/);

  await updatedCard.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(updatedTitle)).toBeHidden();
});

test("TC-EVENT-004: guest sees public event type details", async ({ page, request }) => {
  const eventType = await createEventType(request, {
    title: uniqueName("E2E Discovery"),
    description: "Public event type description",
    durationMinutes: 30,
  });

  await page.goto("/");

  await expect(page.getByLabel("Event type")).toContainText(`${eventType.title} - 30 min`);
  await page.getByLabel("Event type").selectOption(eventType.id);
  await expect(page.getByText("Public event type description")).toBeVisible();
  await expect(page.getByText("Booking is not available yet.")).toBeHidden();
});

test("TC-AVAIL-001: admin sees default availability settings", async ({ page }) => {
  await authorizeAdmin(page);
  await page.goto("/admin/availability");

  await expect(page.getByRole("heading", { name: "Availability" })).toBeVisible();
  for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday"]) {
    await expect(page.getByLabel(day)).toBeChecked();
  }
  await expect(page.getByLabel("Start")).toHaveValue("09:00");
  await expect(page.getByLabel("End")).toHaveValue("18:00");
});

test("TC-AVAIL-002/003: admin validates and updates availability", async ({ page }) => {
  await authorizeAdmin(page);
  await page.goto("/admin/availability");

  await page.getByLabel("End").selectOption("09:00");
  await page.getByRole("button", { name: "Save availability" }).click();
  await expect(page.getByText("End time must be later than start time")).toBeVisible();

  await page.getByLabel("saturday").check();
  await page.getByLabel("Start").selectOption("10:00");
  await page.getByLabel("End").selectOption("17:00");
  await page.getByRole("button", { name: "Save availability" }).click();
  await expect(page.getByText("Availability saved")).toBeVisible();

  await page.getByLabel("saturday").uncheck();
  await page.getByLabel("Start").selectOption("09:00");
  await page.getByLabel("End").selectOption("18:00");
  await page.getByRole("button", { name: "Save availability" }).click();
});

test("TC-ADMIN-BOOK-001/002/005: admin sees booking details and deletes booking without email code", async ({ page, request }) => {
  const eventType = await createEventType(request, { title: uniqueName("E2E Admin Booking") });
  const booking = await createBooking(request, eventType.id, nextBookableStartAt(10), {
    title: uniqueName("E2E Upcoming Meeting"),
    guestName: "Admin Visible Guest",
    guestEmail: "admin-visible@example.com",
    comment: "Comment visible in admin booking list",
  });

  await authorizeAdmin(page);
  await page.goto("/admin/bookings");

  const card = bookingCard(page, booking.title);
  await expect(card).toContainText(eventType.title);
  await expect(card).toContainText(booking.guestName);
  await expect(card).toContainText(booking.guestEmail);
  await expect(card).toContainText(booking.comment!);

  await card.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(booking.title)).toBeHidden();
});

test("TC-CAL-005/007: guest overview shows occupied slots without private guest data", async ({ page, request }) => {
  const eventType = await createEventType(request, { title: uniqueName("E2E Public Slot") });
  const booking = await createBooking(request, eventType.id, nextBookableStartAt(11), {
    title: uniqueName("E2E Public Booking"),
    guestName: "Hidden Guest Name",
    guestEmail: "hidden-guest@example.com",
    comment: "Private guest comment",
  });

  await page.goto("/");

  await expect(page.getByLabel("Event type")).toHaveValue("");
  const card = calendarSlotCard(page, booking.title);
  await expect(card).toContainText("occupied");
  await expect(card).toContainText(booking.title);
  await expect(card).toContainText(eventType.title);
  await expect(page.getByText(booking.guestName)).toBeHidden();
  await expect(page.getByText(booking.guestEmail)).toBeHidden();
  await expect(page.getByText(booking.comment!)).toBeHidden();
});

test("TC-CAL-002/006, TC-BOOK-001/002, TC-EMAIL-001: guest navigates calendar and creates booking", async ({ page, request }) => {
  const eventType = await createEventType(request, {
    title: uniqueName("E2E Bookable Event"),
    description: "Bookable event description",
    durationMinutes: 30,
  });
  const bookingTitle = uniqueName("E2E Guest Booking");

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Previous week" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next week" })).toBeEnabled();
  await page.getByRole("button", { name: "Next week" }).click();
  await expect(page.getByRole("button", { name: "Next week" })).toBeDisabled();
  await page.getByRole("button", { name: "Previous week" }).click();

  await page.getByLabel("Event type").selectOption(eventType.id);
  await page.getByRole("button").filter({ hasText: "free" }).first().click();
  await page.getByLabel("Booking title").fill(bookingTitle);
  await page.getByLabel("Guest name").fill("E2E Guest Creator");
  await page.getByLabel("Guest email").fill("creator@example.com");
  await page.getByRole("button", { name: "Create booking" }).click();

  await expect(calendarSlotCard(page, bookingTitle)).toContainText("occupied");

  await page.goto("/dev/emails");
  await expect(page.getByText(`Booking confirmed: ${bookingTitle}`)).toBeVisible();
  await expect(page.getByText("creator@example.com")).toBeVisible();
});

test("TC-DEL-001/002/003/004/005, TC-EMAIL-002: guest requests code and deletes booking", async ({ page, request }) => {
  const eventType = await createEventType(request, { title: uniqueName("E2E Deletable Event") });
  const booking = await createBooking(request, eventType.id, nextBookableStartAt(13), {
    title: uniqueName("E2E Guest Delete Booking"),
    guestEmail: "delete-me@example.com",
  });

  await page.goto("/");
  await calendarSlotCard(page, booking.title).click();
  await page.getByLabel("Booking email").fill("other@example.com");
  await page.getByRole("button", { name: "Request deletion code" }).click();
  await expect(page.getByText("If booking exists, a deletion code was sent")).toBeVisible();

  await page.getByLabel("Booking email").fill("delete-me@example.com");
  await page.getByRole("button", { name: "Request deletion code" }).click();
  await expect(page.getByText("If booking exists, a deletion code was sent")).toBeVisible();

  await page.getByLabel("Deletion code").fill("111111");
  await page.getByRole("button", { name: "Delete booking", exact: true }).click();
  await expect(page.getByText("Invalid deletion code")).toBeVisible();

  await page.getByLabel("Booking email").fill("other@example.com");
  await page.getByLabel("Deletion code").fill("000000");
  await page.getByRole("button", { name: "Delete booking", exact: true }).click();
  await expect(page.getByText("Invalid deletion code")).toBeVisible();

  await page.getByLabel("Booking email").fill("delete-me@example.com");
  await page.getByLabel("Deletion code").fill("000000");
  await page.getByRole("button", { name: "Delete booking", exact: true }).click();
  await page.reload();
  await expect(page.getByText(booking.title)).toBeHidden();

  await page.goto("/dev/emails");
  await expect(page.getByRole("heading", { name: "Booking deletion code" }).first()).toBeVisible();
  await expect(page.getByText("Your booking deletion code is 000000")).toBeVisible();
});

test("TC-EVENT-009: admin cannot delete event type with a future booking", async ({ page, request }) => {
  const eventType = await createEventType(request, { title: uniqueName("E2E Locked Event") });
  await createBooking(request, eventType.id, nextBookableStartAt(12), {
    title: uniqueName("E2E Blocking Booking"),
  });

  await authorizeAdmin(page);
  await page.goto("/admin/event-types");

  const deleteResponsePromise = page.waitForResponse(
    (response) => response.url().includes(`/admin/event-types/${eventType.id}`) && response.request().method() === "DELETE",
  );
  await eventTypeCard(page, eventType.title).getByRole("button", { name: "Delete" }).click();
  const deleteResponse = await deleteResponsePromise;

  expect(deleteResponse.status()).toBe(409);
  await expect(page.getByText("Event type has future bookings")).toBeVisible();
  await expect(eventTypeCard(page, eventType.title)).toBeVisible();
});

async function signInAsAdmin(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Login").fill("admin");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Event types" })).toBeVisible();
}

async function authorizeAdmin(page: Page) {
  await page.addInitScript(
    ([key, token]) => window.localStorage.setItem(key, token),
    [adminTokenStorageKey, adminToken],
  );
}

async function createEventType(
  request: APIRequestContext,
  overrides: Partial<Pick<EventType, "title" | "description" | "durationMinutes">> = {},
) {
  const response = await request.post(`${apiBaseUrl}/admin/event-types`, {
    headers: adminHeaders(),
    data: {
      title: overrides.title ?? uniqueName("E2E Event Type"),
      description: overrides.description ?? "Created by Playwright e2e setup",
      durationMinutes: overrides.durationMinutes ?? 30,
    },
  });

  expect(response.status()).toBe(201);
  const eventType = (await response.json()) as EventType;
  expect(eventTypeColors).toContain(eventType.color);
  return eventType;
}

async function createBooking(
  request: APIRequestContext,
  eventTypeId: string,
  startAt: string,
  overrides: Partial<Pick<Booking, "title" | "guestName" | "guestEmail" | "comment">> = {},
) {
  const response = await request.post(`${apiBaseUrl}/bookings`, {
    data: {
      eventTypeId,
      startAt,
      title: overrides.title ?? uniqueName("E2E Booking"),
      guestName: overrides.guestName ?? "E2E Guest",
      guestEmail: overrides.guestEmail ?? "guest@example.com",
      comment: overrides.comment,
    },
  });

  expect(response.status()).toBe(201);
  return (await response.json()) as Booking;
}

function eventTypeCard(page: Page, title: string): Locator {
  return page.locator(".rounded-xl").filter({ hasText: title }).first();
}

function bookingCard(page: Page, title: string): Locator {
  return page.locator(".rounded-xl").filter({ hasText: title }).first();
}

function calendarSlotCard(page: Page, title: string): Locator {
  return page.locator(".rounded-xl").filter({ hasText: title }).first();
}

function adminHeaders() {
  return { Authorization: `Bearer ${adminToken}` };
}

function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function frontendCorsOrigins() {
  const url = new URL(frontendUrl);
  return [`http://127.0.0.1:${url.port}`, `http://localhost:${url.port}`];
}

function nextBookableStartAt(hour: number) {
  const now = moscowNowParts();

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(Date.UTC(now.year, now.month - 1, now.day + offset, 12));
    const dayOfWeek = candidate.getUTCDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const hasTimePassedToday = offset === 0 && (now.hour > hour || (now.hour === hour && now.minute >= 0));

    if (isWeekday && !hasTimePassedToday) {
      return `${candidate.getUTCFullYear()}-${pad(candidate.getUTCMonth() + 1)}-${pad(candidate.getUTCDate())}T${pad(
        hour,
      )}:00:00`;
    }
  }

  throw new Error("No bookable weekday found in the next 14 days");
}

function moscowNowParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
