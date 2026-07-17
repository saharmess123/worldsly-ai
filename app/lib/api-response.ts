import { NextResponse } from "next/server";

type ApiSuccessOptions = {
  status?: number;
  message?: string;
};

type ApiErrorOptions = {
  status?: number;
  code?: string;
  details?: unknown;
};

export function apiSuccess<T>(
  data: T,
  options: ApiSuccessOptions = {}
) {
  const {
    status = 200,
    message,
  } = options;

  return NextResponse.json(
    {
      success: true,
      ...(message ? { message } : {}),
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
  } = options;

  return NextResponse.json(
    {
      success: false,
      error,
      code,
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
  error = "Authentication required."
) {
  return apiError(error, {
    status: 401,
    code: "UNAUTHORIZED",
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
    "Something went wrong. Please try again."
) {
  return apiError(error, {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
  });
}