import { ApiClientError } from "./errors";
import type { ApiErrorBody } from "./types";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
  token?: string | null;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

function buildUrl(path: string, query?: ApiRequestOptions["query"]) {
  const base = apiBaseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`, window.location.origin);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  if (!apiBaseUrl) {
    return `${url.pathname}${url.search}`;
  }

  return url.toString();
}

async function readResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  return JSON.parse(text) as unknown;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    const fallback: ApiErrorBody = {
      code: response.status === 401 ? "unauthorized" : "validation_error",
      message: response.statusText || "Request failed",
    };
    const error = typeof data === "object" && data !== null && "error" in data ? data.error : fallback;

    throw new ApiClientError(response.status, error as ApiErrorBody);
  }

  return data as T;
}
