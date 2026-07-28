import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  badRequest,
  forbidden,
  internalServerError,
} from "../../../lib/api-response";
import { verifyToken } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const PROVIDER_NAMES = [
  "mock",
  "ollama",
  "openai",
] as const;

const DEFAULT_RAW_RETENTION_DAYS = 30;
const MAX_RAW_RETENTION_DAYS = 3650;
const MAX_ERROR_SAMPLE_SIZE = 1000;

type ProviderName =
  (typeof PROVIDER_NAMES)[number];

type RuntimeEventExportRow = {
  id: string;
  operation: string;
  primaryProvider: string;
  resolvedProvider: string;
  fallbackProvider: string;
  model: string;
  success: boolean;
  usedFallback: boolean;
  attemptCount: number;
  latencyMs: number;
  error: string;
  createdAt: string;
};

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("wordsly_session")?.value || "";
  const session = verifyToken(token);

  return session?.role === "admin";
}

function parseBoundedInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
): number | null {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    return null;
  }

  return parsed;
}

function parseEnvironmentInteger(
  value: string | undefined,
  fallback: number,
  maximum: number,
): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

function startOfUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ),
  );
}

function startOfNextCompleteUtcDay(
  value: Date,
): Date {
  const dayStart = startOfUtcDay(value);

  if (
    dayStart.getTime() ===
    value.getTime()
  ) {
    return dayStart;
  }

  return new Date(
    dayStart.getTime() +
      24 * 60 * 60 * 1000,
  );
}

function subtractDays(
  value: Date,
  days: number,
): Date {
  return new Date(
    value.getTime() -
      days * 24 * 60 * 60 * 1000,
  );
}

function isProviderName(
  value: string,
): value is ProviderName {
  return PROVIDER_NAMES.includes(
    value as ProviderName,
  );
}

function normalizeErrorMessage(
  value: string | null,
): string {
  if (!value?.trim()) {
    return "Unknown error";
  }

  return value
    .replace(/\b\d{3,}\b/g, "{number}")
    .replace(
      /https?:\/\/[^\s]+/gi,
      "{url}",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

export async function GET(
  request: NextRequest,
) {
  try {
    const isAdmin = await requireAdmin();

    if (!isAdmin) {
      return forbidden();
    }

    const searchParams =
      request.nextUrl.searchParams;

    const hours = parseBoundedInteger(
      searchParams.get("hours"),
      24,
      1,
      8760,
    );

    if (hours === null) {
      return badRequest(
        "The hours parameter must be an integer between 1 and 8760.",
      );
    }

    const page = parseBoundedInteger(
      searchParams.get("page"),
      1,
      1,
      100000,
    );

    if (page === null) {
      return badRequest(
        "The page parameter must be a positive integer.",
      );
    }

    const limit = parseBoundedInteger(
      searchParams.get("limit"),
      50,
      1,
      200,
    );

    if (limit === null) {
      return badRequest(
        "The limit parameter must be an integer between 1 and 200.",
      );
    }

    const provider =
      searchParams
        .get("provider")
        ?.trim()
        .toLowerCase() || "";

    if (
      provider &&
      !isProviderName(provider)
    ) {
      return badRequest(
        "Invalid AI provider filter.",
        {
          allowedProviders:
            PROVIDER_NAMES,
        },
      );
    }

    const successValue =
      searchParams
        .get("success")
        ?.trim()
        .toLowerCase();

    if (
      successValue &&
      successValue !== "true" &&
      successValue !== "false"
    ) {
      return badRequest(
        "The success filter must be true or false.",
      );
    }

    const operation =
      searchParams
        .get("operation")
        ?.trim()
        .slice(0, 100) || "";

    const now = new Date();

    const since = new Date(
      now.getTime() -
        hours * 60 * 60 * 1000,
    );

    const rawRetentionDays =
      parseEnvironmentInteger(
        process.env
          .MONITORING_RAW_RETENTION_DAYS,
        DEFAULT_RAW_RETENTION_DAYS,
        MAX_RAW_RETENTION_DAYS,
      );

    const rawCutoff =
      startOfUtcDay(
        subtractDays(
          now,
          rawRetentionDays,
        ),
      );

    const rawSince =
      since > rawCutoff
        ? since
        : rawCutoff;

    const aggregateSince =
      startOfNextCompleteUtcDay(since);

    const rawWhere: Prisma.AIRuntimeEventWhereInput = {
      createdAt: {
        gte: rawSince,
      },
      ...(provider
        ? {
            resolvedProvider:
              provider,
          }
        : {}),
      ...(successValue
        ? {
            success:
              successValue === "true",
          }
        : {}),
      ...(operation
        ? {
            operation: {
              contains: operation,
            },
          }
        : {}),
    };

    const aggregateWhere: Prisma.AIRuntimeDailyAggregateWhereInput = {
      bucketStart: {
        gte: aggregateSince,
        lt: rawCutoff,
      },
      ...(provider
        ? {
            resolvedProvider:
              provider,
          }
        : {}),
      ...(successValue
        ? {
            success:
              successValue === "true",
          }
        : {}),
      ...(operation
        ? {
            operation: {
              contains: operation,
            },
          }
        : {}),
    };

    const skip =
      (page - 1) * limit;

    const failedWhere: Prisma.AIRuntimeEventWhereInput = {
      ...rawWhere,
      success: false,
    };

    const [
      events,
      rawTotalCount,
      rawFallbackCount,
      rawTotals,
      rawSuccessGroups,
      rawProviderGroups,
      rawProviderSuccessGroups,
      errorSample,
      aggregateTotals,
      aggregateProviderGroups,
    ] = await Promise.all([
      prisma.aIRuntimeEvent.findMany({
        where: rawWhere,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.aIRuntimeEvent.count({
        where: rawWhere,
      }),
      prisma.aIRuntimeEvent.count({
        where: {
          ...rawWhere,
          usedFallback: true,
        },
      }),
      prisma.aIRuntimeEvent.aggregate({
        where: rawWhere,
        _sum: {
          latencyMs: true,
          attemptCount: true,
        },
      }),
      prisma.aIRuntimeEvent.groupBy({
        by: ["success"],
        where: rawWhere,
        _count: {
          _all: true,
        },
      }),
      prisma.aIRuntimeEvent.groupBy({
        by: ["resolvedProvider"],
        where: rawWhere,
        _count: {
          _all: true,
        },
        _sum: {
          latencyMs: true,
        },
      }),
      prisma.aIRuntimeEvent.groupBy({
        by: [
          "resolvedProvider",
          "success",
        ],
        where: rawWhere,
        _count: {
          _all: true,
        },
      }),
      prisma.aIRuntimeEvent.findMany({
        where: {
          ...failedWhere,
          error: {
            not: null,
          },
        },
        select: {
          error: true,
          resolvedProvider: true,
          model: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take:
          MAX_ERROR_SAMPLE_SIZE,
      }),
      prisma.aIRuntimeDailyAggregate.aggregate({
        where: aggregateWhere,
        _sum: {
          requestCount: true,
          successCount: true,
          failureCount: true,
          fallbackCount: true,
          totalAttempts: true,
          totalLatencyMs: true,
        },
      }),
      prisma.aIRuntimeDailyAggregate.groupBy({
        by: ["resolvedProvider"],
        where: aggregateWhere,
        _sum: {
          requestCount: true,
          successCount: true,
          failureCount: true,
          totalLatencyMs: true,
        },
      }),
    ]);

    const rawSuccessfulRequests =
      rawSuccessGroups.find(
        (group) => group.success,
      )?._count._all || 0;

    const rawFailedRequests =
      rawSuccessGroups.find(
        (group) => !group.success,
      )?._count._all || 0;

    const aggregateRequestCount =
      aggregateTotals._sum.requestCount || 0;

    const aggregateSuccessfulRequests =
      aggregateTotals._sum.successCount || 0;

    const aggregateFailedRequests =
      aggregateTotals._sum.failureCount || 0;

    const aggregateFallbackCount =
      aggregateTotals._sum.fallbackCount || 0;

    const totalCount =
      rawTotalCount +
      aggregateRequestCount;

    const successfulRequests =
      rawSuccessfulRequests +
      aggregateSuccessfulRequests;

    const failedRequests =
      rawFailedRequests +
      aggregateFailedRequests;

    const fallbackCount =
      rawFallbackCount +
      aggregateFallbackCount;

    const totalLatency =
      (rawTotals._sum.latencyMs || 0) +
      (aggregateTotals._sum.totalLatencyMs || 0);

    const totalAttempts =
      (rawTotals._sum.attemptCount || 0) +
      (aggregateTotals._sum.totalAttempts || 0);

    const providerBreakdown =
      PROVIDER_NAMES.map(
        (providerName) => {
          const rawTotalsForProvider =
            rawProviderGroups.find(
              (item) =>
                item.resolvedProvider ===
                providerName,
            );

          const aggregateTotalsForProvider =
            aggregateProviderGroups.find(
              (item) =>
                item.resolvedProvider ===
                providerName,
            );

          const rawProviderRequestCount =
            rawTotalsForProvider?._count._all ||
            0;

          const aggregateProviderRequestCount =
            aggregateTotalsForProvider?._sum
              .requestCount || 0;

          const requestCount =
            rawProviderRequestCount +
            aggregateProviderRequestCount;

          const rawSuccessfulForProvider =
            rawProviderSuccessGroups.find(
              (item) =>
                item.resolvedProvider ===
                  providerName &&
                item.success,
            )?._count._all || 0;

          const aggregateSuccessfulForProvider =
            aggregateTotalsForProvider?._sum
              .successCount || 0;

          const successfulForProvider =
            rawSuccessfulForProvider +
            aggregateSuccessfulForProvider;

          const rawFailedForProvider =
            rawProviderRequestCount -
            rawSuccessfulForProvider;

          const aggregateFailedForProvider =
            aggregateTotalsForProvider?._sum
              .failureCount || 0;

          const failedForProvider =
            rawFailedForProvider +
            aggregateFailedForProvider;

          const providerLatency =
            (rawTotalsForProvider?._sum
              .latencyMs || 0) +
            (aggregateTotalsForProvider?._sum
              .totalLatencyMs || 0);

          return {
            provider:
              providerName,
            requestCount,
            successfulRequests:
              successfulForProvider,
            failedRequests:
              failedForProvider,
            successRate:
              requestCount === 0
                ? 0
                : Math.round(
                    (successfulForProvider /
                      requestCount) *
                      100,
                  ),
            averageLatencyMs:
              requestCount === 0
                ? 0
                : Math.round(
                    providerLatency /
                      requestCount,
                  ),
          };
        },
      );

    const groupedErrors = new Map<
      string,
      {
        error: string;
        provider: string;
        model: string;
        count: number;
        latestOccurrence: Date;
      }
    >();

    for (const event of errorSample) {
      const normalizedError =
        normalizeErrorMessage(
          event.error,
        );

      const key = [
        event.resolvedProvider,
        event.model,
        normalizedError,
      ].join("::");

      const existing =
        groupedErrors.get(key);

      if (existing) {
        existing.count += 1;

        if (
          event.createdAt >
          existing.latestOccurrence
        ) {
          existing.latestOccurrence =
            event.createdAt;
        }

        continue;
      }

      groupedErrors.set(key, {
        error: normalizedError,
        provider:
          event.resolvedProvider,
        model: event.model,
        count: 1,
        latestOccurrence:
          event.createdAt,
      });
    }

    const errorGroups = Array.from(
      groupedErrors.values(),
    )
      .sort(
        (first, second) =>
          second.count -
            first.count ||
          second.latestOccurrence.getTime() -
            first.latestOccurrence.getTime(),
      )
      .slice(0, 25)
      .map((group) => ({
        ...group,
        latestOccurrence:
          group.latestOccurrence.toISOString(),
      }));

    const recentEvents =
      events.map((event) => ({
        id: event.id,
        operation:
          event.operation,
        primaryProvider:
          event.primaryProvider,
        resolvedProvider:
          event.resolvedProvider,
        fallbackProvider:
          event.fallbackProvider,
        model: event.model,
        success:
          event.success,
        usedFallback:
          event.usedFallback,
        attemptCount:
          event.attemptCount,
        latencyMs:
          event.latencyMs,
        error: event.error,
        createdAt:
          event.createdAt.toISOString(),
      }));

    const exportRows: RuntimeEventExportRow[] =
      recentEvents.map((event) => ({
        id: event.id,
        operation:
          event.operation,
        primaryProvider:
          event.primaryProvider,
        resolvedProvider:
          event.resolvedProvider,
        fallbackProvider:
          event.fallbackProvider || "",
        model: event.model,
        success:
          event.success,
        usedFallback:
          event.usedFallback,
        attemptCount:
          event.attemptCount,
        latencyMs:
          event.latencyMs,
        error:
          event.error || "",
        createdAt:
          event.createdAt,
      }));

    const totalPages =
      rawTotalCount === 0
        ? 0
        : Math.ceil(
            rawTotalCount / limit,
          );

    return NextResponse.json({
      success: true,
      filters: {
        hours,
        page,
        limit,
        provider:
          provider || null,
        success:
          successValue
            ? successValue === "true"
            : null,
        operation:
          operation || null,
        since:
          since.toISOString(),
        rawRetentionDays,
        rawCutoff:
          rawCutoff.toISOString(),
        aggregateSince:
          aggregateSince.toISOString(),
      },
      summary: {
        totalMatchingEvents:
          totalCount,
        rawMatchingEvents:
          rawTotalCount,
        aggregatedMatchingEvents:
          aggregateRequestCount,
        returnedEvents:
          events.length,
        successfulRequests,
        failedRequests,
        successRate:
          totalCount === 0
            ? 0
            : Math.round(
                (successfulRequests /
                  totalCount) *
                  100,
              ),
        fallbackCount,
        fallbackRate:
          totalCount === 0
            ? 0
            : Math.round(
                (fallbackCount /
                  totalCount) *
                  100,
              ),
        averageLatencyMs:
          totalCount === 0
            ? 0
            : Math.round(
                totalLatency /
                  totalCount,
              ),
        averageAttempts:
          totalCount === 0
            ? 0
            : Number(
                (
                  totalAttempts /
                  totalCount
                ).toFixed(2),
              ),
      },
      pagination: {
        page,
        limit,
        totalItems:
          rawTotalCount,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      },
      providers:
        providerBreakdown,
      errorGroups: {
        groups:
          errorGroups,
        sampledFailedEvents:
          errorSample.length,
        maximumSampleSize:
          MAX_ERROR_SAMPLE_SIZE,
        isSampleLimited:
          errorSample.length ===
          MAX_ERROR_SAMPLE_SIZE,
      },
      recentEvents,
      exportData: {
        format: "tabular-json",
        scope: "current-page",
        columns: [
          "id",
          "operation",
          "primaryProvider",
          "resolvedProvider",
          "fallbackProvider",
          "model",
          "success",
          "usedFallback",
          "attemptCount",
          "latencyMs",
          "error",
          "createdAt",
        ],
        rows:
          exportRows,
      },
      generatedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "AI monitoring GET error:",
      error,
    );

    return internalServerError(
      "Something went wrong while loading AI monitoring data.",
    );
  }
}