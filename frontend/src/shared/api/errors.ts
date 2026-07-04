import type { ApiErrorBody } from "./types";

export class ApiClientError extends Error {
  readonly status: number;
  readonly error: ApiErrorBody;

  constructor(status: number, error: ApiErrorBody) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = status;
    this.error = error;
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}
