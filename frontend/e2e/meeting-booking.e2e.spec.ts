import { expect, test, type APIRequestContext, type Locator, type Page } from "@playwright/test";

const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:3100";
const adminToken = "dev-admin-token";
const adminTokenStorageKey = "meeting-booking.admin-token";
const eventTypeColors = ["blue", "green", "yellow", "orange", "purple", "red"];

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

test.describe.configure({ mode: "serial" });

test("TC-EVENT-005: guest sees booking unavailable state when no event types exist", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Book a meeting" })).toBeVisible();
  await expect(page.getByText("Booking is not available yet.")).toBeVisible();
  await expect(page.getByLabel("Event type")).toHaveValue("");
});

test("TC-AUTH-002: admin login rejects invalid credentials", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Login").fill("wrong-admin");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Invalid admin credentials")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("TC-AUTH-001, TC-EVENT-001/002/008: admin signs in, validates, creates and deletes event type", async ({ page }) => {
  const title = uniqueName("E2E Strategy Call");
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

  await card.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(title)).toBeHidden();
});

test("TC-EVENT-004: guest sees public event type details", async ({ page, request }) => {
  const eventType = await createEventType(request, {
    title: uniqueName("E2E Discovery"),
    description: "Public event type description",
    durationMinutes: 30,
  });

  await page.goto("/");

  await expect(page.getByLabel("Event type")).toContainText(`${eventType.title} - 30 min`);
  await expect(page.getByText("Booking is not available yet.")).toBeHidden();
});

test("TC-AVAIL-001: admin sees default availability settings", async ({ page }) => {
  await authorizeAdmin(page);
  await page.goto("/admin/availability");

  await expect(page.getByRole("heading", { name: "Availability" })).toBeVisible();
  await expect(page.getByText("monday, tuesday, wednesday, thursday, friday")).toBeVisible();
  await expect(page.getByText("09:00")).toBeVisible();
  await expect(page.getByText("18:00")).toBeVisible();
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
  return page.locator("div.rounded-xl").filter({ hasText: title }).first();
}

function bookingCard(page: Page, title: string): Locator {
  return page.locator("div.rounded-xl").filter({ hasText: title }).first();
}

function calendarSlotCard(page: Page, title: string): Locator {
  return page.locator("div.rounded-xl").filter({ hasText: title }).first();
}

function adminHeaders() {
  return { Authorization: `Bearer ${adminToken}` };
}

function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nextBookableStartAt(hour: 10 | 11 | 12) {
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
