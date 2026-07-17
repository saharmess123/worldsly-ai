import { NextResponse } from "next/server";

type ApiSuccessOptions = {
  status?: number;
  message?: string;
  extra?: Record<string, unknown>;
};

type ApiErrorOptions = {
  status?: number;
  code?: string;
  details?: unknown;
  extra?: Record<string, unknown>;
};

export function apiSuccess<T>(
  data: T,
  options: ApiSuccessOptions = {}
) {
  const {
    status = 200,
    message,
    extra,
  } = options;

  return NextResponse.json(
    {
      success: true,
      ...(message ? { message } : {}),
      ...(extra ?? {}),
      data,
    },
    {
      status,
    }
  );
}

export function apiError(
  error: string,
  options: ApiErrorOptions = {}
) {
  const {
    status = 500,
    code = "INTERNAL_SERVER_ERROR",
    details,
    extra,
  } = options;

  return NextResponse.json(
    {
      success: false,
      error,
      code,
      ...(extra ?? {}),
      ...(details !== undefined
        ? { details }
        : {}),
    },
    {
      status,
    }
  );
}

export function getErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred."
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error;
  }

  return fallbackMessage;
}

export function badRequest(
  error: string,
  details?: unknown
) {
  return apiError(error, {
    status: 400,
    code: "BAD_REQUEST",
    details,
  });
}

export function unauthorized(
  error = "Authentication required.",
  extra?: Record<string, unknown>
) {
  return apiError(error, {
    status: 401,
    code: "UNAUTHORIZED",
    extra,
  });
}

export function forbidden(
  error =
    "Access denied. Admin privileges required."
) {
  return apiError(error, {
    status: 403,
    code: "FORBIDDEN",
  });
}

export function notFound(
  error = "Resource not found."
) {
  return apiError(error, {
    status: 404,
    code: "NOT_FOUND",
  });
}

export function conflict(
  error: string,
  details?: unknown
) {
  return apiError(error, {
    status: 409,
    code: "CONFLICT",
    details,
  });
}

export function internalServerError(
  error =
    "Something went wrong. Please try again.",
  extra?: Record<string, unknown>
) {
  return apiError(error, {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    extra,
  });
}