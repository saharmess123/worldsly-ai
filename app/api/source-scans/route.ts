import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { verifyToken } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

const ALLOWED_STATUSES = [
  "running",
  "completed",
  "failed",
] as const;

const ALLOWED_TRIGGERS = [
  "manual",
  "scheduled",
] as const;

const DEFAULT_RAW_RETENTION_DAYS = 30;
const MAX_RAW_RETENTION_DAYS = 3650;

function parseInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(maximum, parsed),
  );
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

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("wordsly_session")?.value || "";
  const session = verifyToken(token);

  return session?.role === "admin";
}

export async function GET(
  request: NextRequest,
) {
  try {
    const isAdmin = await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access denied. Admin privileges required.",
        },
        {
          status: 403,
        },
      );
    }

    const searchParams =
      request.nextUrl.searchParams;

    const hours = parseInteger(
      searchParams.get("hours"),
      168,
      1,
      2160,
    );

    const limit = parseInteger(
      searchParams.get("limit"),
      100,
      1,
      500,
    );

    const sourceId =
      searchParams.get("sourceId")?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim()
        .toLowerCase() || "";

    const trigger =
      searchParams
        .get("trigger")
        ?.trim()
        .toLowerCase() || "";

    if (
      status &&
      !ALLOWED_STATUSES.includes(
        status as
          (typeof ALLOWED_STATUSES)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid source scan status filter.",
          allowedStatuses:
            ALLOWED_STATUSES,
        },
        {
          status: 400,
        },
      );
    }

    if (
      trigger &&
      !ALLOWED_TRIGGERS.includes(
        trigger as
          (typeof ALLOWED_TRIGGERS)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid source scan trigger filter.",
          allowedTriggers:
            ALLOWED_TRIGGERS,
        },
        {
          status: 400,
        },
      );
    }

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

    const rawWhere: Prisma.SourceScanEventWhereInput = {
      OR: [
        {
          startedAt: {
            gte: rawSince,
          },
        },
        {
          startedAt: {
            gte: since,
            lt: rawCutoff,
          },
          status: "running",
        },
      ],
      ...(sourceId
        ? {
            sourceId,
          }
        : {}),
      ...(status
        ? {
            status,
          }
        : {}),
      ...(trigger
        ? {
            trigger,
          }
        : {}),
    };

    const aggregateWhere: Prisma.SourceScanDailyAggregateWhereInput = {
      bucketStart: {
        gte: aggregateSince,
        lt: rawCutoff,
      },
      ...(sourceId
        ? {
            sourceId,
          }
        : {}),
      ...(status
        ? {
            status,
          }
        : {}),
      ...(trigger
        ? {
            trigger,
          }
        : {}),
    };

    const [
      events,
      rawTotalCount,
      rawTotals,
      rawStatusGroups,
      rawTriggerGroups,
      rawSourceGroups,
      aggregateTotals,
      aggregateTriggerGroups,
      aggregateSourceGroups,
    ] = await Promise.all([
      prisma.sourceScanEvent.findMany({
        where: rawWhere,
        include: {
          source: {
            select: {
              id: true,
              name: true,
              type: true,
              url: true,
            },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
        take: limit,
      }),
      prisma.sourceScanEvent.count({
        where: rawWhere,
      }),
      prisma.sourceScanEvent.aggregate({
        where: rawWhere,
        _sum: {
          createdCount: true,
          generatedCount: true,
          skippedDuplicateCount: true,
          retrievedCharacterCount: true,
          durationMs: true,
        },
      }),
      prisma.sourceScanEvent.groupBy({
        by: ["status"],
        where: rawWhere,
        _count: {
          _all: true,
        },
      }),
      prisma.sourceScanEvent.groupBy({
        by: ["trigger"],
        where: rawWhere,
        _count: {
          _all: true,
        },
      }),
      prisma.sourceScanEvent.groupBy({
        by: [
          "sourceId",
          "status",
        ],
        where: rawWhere,
        _count: {
          _all: true,
        },
        _sum: {
          createdCount: true,
        },
      }),
      prisma.sourceScanDailyAggregate.aggregate({
        where: aggregateWhere,
        _sum: {
          scanCount: true,
          completedCount: true,
          failedCount: true,
          runningCount: true,
          createdPromptCount: true,
          generatedPromptCount: true,
          skippedDuplicateCount: true,
          retrievedCharacterCount: true,
          totalDurationMs: true,
        },
      }),
      prisma.sourceScanDailyAggregate.groupBy({
        by: ["trigger"],
        where: aggregateWhere,
        _sum: {
          scanCount: true,
        },
      }),
      prisma.sourceScanDailyAggregate.groupBy({
        by: [
          "sourceId",
          "status",
        ],
        where: aggregateWhere,
        _sum: {
          scanCount: true,
          createdPromptCount: true,
        },
      }),
    ]);

    const aggregateTotalCount =
      aggregateTotals._sum.scanCount || 0;

    const totalCount =
      rawTotalCount +
      aggregateTotalCount;

    const rawCompletedCount =
      rawStatusGroups.find(
        (group) =>
          group.status === "completed",
      )?._count._all || 0;

    const rawFailedCount =
      rawStatusGroups.find(
        (group) =>
          group.status === "failed",
      )?._count._all || 0;

    const rawRunningCount =
      rawStatusGroups.find(
        (group) =>
          group.status === "running",
      )?._count._all || 0;

    const completedCount =
      rawCompletedCount +
      (aggregateTotals._sum
        .completedCount || 0);

    const failedCount =
      rawFailedCount +
      (aggregateTotals._sum
        .failedCount || 0);

    const runningCount =
      rawRunningCount +
      (aggregateTotals._sum
        .runningCount || 0);

    const rawManualCount =
      rawTriggerGroups.find(
        (group) =>
          group.trigger === "manual",
      )?._count._all || 0;

    const rawScheduledCount =
      rawTriggerGroups.find(
        (group) =>
          group.trigger === "scheduled",
      )?._count._all || 0;

    const aggregateManualCount =
      aggregateTriggerGroups.find(
        (group) =>
          group.trigger === "manual",
      )?._sum.scanCount || 0;

    const aggregateScheduledCount =
      aggregateTriggerGroups.find(
        (group) =>
          group.trigger === "scheduled",
      )?._sum.scanCount || 0;

    const manualCount =
      rawManualCount +
      aggregateManualCount;

    const scheduledCount =
      rawScheduledCount +
      aggregateScheduledCount;

    const successRate =
      completedCount + failedCount === 0
        ? 0
        : Math.round(
            (completedCount /
              (completedCount + failedCount)) *
              100,
          );

    const totalCreatedPrompts =
      (rawTotals._sum.createdCount || 0) +
      (aggregateTotals._sum
        .createdPromptCount || 0);

    const totalGeneratedPrompts =
      (rawTotals._sum.generatedCount || 0) +
      (aggregateTotals._sum
        .generatedPromptCount || 0);

    const totalSkippedDuplicates =
      (rawTotals._sum
        .skippedDuplicateCount || 0) +
      (aggregateTotals._sum
        .skippedDuplicateCount || 0);

    const totalRetrievedCharacters =
      (rawTotals._sum
        .retrievedCharacterCount || 0) +
      (aggregateTotals._sum
        .retrievedCharacterCount || 0);

    const totalDurationMs =
      (rawTotals._sum.durationMs || 0) +
      (aggregateTotals._sum
        .totalDurationMs || 0);

    const averageDurationMs =
      totalCount === 0
        ? 0
        : Math.round(
            totalDurationMs /
              totalCount,
          );

    const sourceBreakdownMap =
      new Map<
        string,
        {
          sourceId: string;
          status: string;
          count: number;
          createdCount: number;
        }
      >();

    for (const group of rawSourceGroups) {
      const key = [
        group.sourceId,
        group.status,
      ].join("::");

      sourceBreakdownMap.set(key, {
        sourceId: group.sourceId,
        status: group.status,
        count:
          group._count._all,
        createdCount:
          group._sum.createdCount || 0,
      });
    }

    for (
      const group of aggregateSourceGroups
    ) {
      const key = [
        group.sourceId,
        group.status,
      ].join("::");

      const existing =
        sourceBreakdownMap.get(key);

      if (existing) {
        existing.count +=
          group._sum.scanCount || 0;

        existing.createdCount +=
          group._sum
            .createdPromptCount || 0;

        continue;
      }

      sourceBreakdownMap.set(key, {
        sourceId: group.sourceId,
        status: group.status,
        count:
          group._sum.scanCount || 0,
        createdCount:
          group._sum
            .createdPromptCount || 0,
      });
    }

    const sourceBreakdown =
      Array.from(
        sourceBreakdownMap.values(),
      )
        .sort(
          (first, second) =>
            first.sourceId.localeCompare(
              second.sourceId,
            ) ||
            first.status.localeCompare(
              second.status,
            ),
        )
        .map((group) => ({
          sourceId: group.sourceId,
          status: group.status,
          _count: {
            _all: group.count,
          },
          _sum: {
            createdCount:
              group.createdCount,
          },
        }));

    return NextResponse.json({
      success: true,
      filters: {
        hours,
        limit,
        sourceId:
          sourceId || null,
        status:
          status || null,
        trigger:
          trigger || null,
        since:
          since.toISOString(),
        rawRetentionDays,
        rawCutoff:
          rawCutoff.toISOString(),
        aggregateSince:
          aggregateSince.toISOString(),
      },
      summary: {
        totalCount,
        rawCount:
          rawTotalCount,
        aggregatedCount:
          aggregateTotalCount,
        returnedCount:
          events.length,
        completedCount,
        failedCount,
        runningCount,
        manualCount,
        scheduledCount,
        successRate,
        totalCreatedPrompts,
        totalGeneratedPrompts,
        totalSkippedDuplicates,
        totalRetrievedCharacters,
        averageDurationMs,
        totalDurationMs,
      },
      sourceBreakdown,
      events: events.map((event) => ({
        id: event.id,
        sourceId: event.sourceId,
        source: event.source,
        trigger: event.trigger,
        status: event.status,
        provider: event.provider,
        credibilityScore:
          event.credibilityScore,
        credibilityConfidence:
          event.credibilityConfidence,
        credibilityReason:
          event.credibilityReason,
        createdCount:
          event.createdCount,
        generatedCount:
          event.generatedCount,
        skippedDuplicateCount:
          event.skippedDuplicateCount,
        retrievedCharacterCount:
          event.retrievedCharacterCount,
        durationMs:
          event.durationMs,
        errorCode:
          event.errorCode,
        errorMessage:
          event.errorMessage,
        startedAt:
          event.startedAt.toISOString(),
        completedAt:
          event.completedAt?.toISOString() ||
          null,
      })),
    });
  } catch (error) {
    console.error(
      "GET /api/source-scans error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load source scan history.",
      },
      {
        status: 500,
      },
    );
  }
}