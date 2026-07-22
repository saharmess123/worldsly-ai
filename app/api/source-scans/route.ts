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

    const since = new Date(
      Date.now() -
        hours * 60 * 60 * 1000,
    );

    const where: Prisma.SourceScanEventWhereInput = {
      startedAt: {
        gte: since,
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
      totalCount,
      aggregate,
      sourceBreakdown,
    ] = await Promise.all([
      prisma.sourceScanEvent.findMany({
        where,
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
        where,
      }),
      prisma.sourceScanEvent.aggregate({
        where,
        _sum: {
          createdCount: true,
          generatedCount: true,
          skippedDuplicateCount: true,
          retrievedCharacterCount: true,
          durationMs: true,
        },
        _avg: {
          durationMs: true,
        },
      }),
      prisma.sourceScanEvent.groupBy({
        by: [
          "sourceId",
          "status",
        ],
        where,
        _count: {
          _all: true,
        },
        _sum: {
          createdCount: true,
        },
      }),
    ]);

    const completedCount =
      events.filter(
        (event) =>
          event.status === "completed",
      ).length;

    const failedCount =
      events.filter(
        (event) =>
          event.status === "failed",
      ).length;

    const runningCount =
      events.filter(
        (event) =>
          event.status === "running",
      ).length;

    const manualCount =
      events.filter(
        (event) =>
          event.trigger === "manual",
      ).length;

    const scheduledCount =
      events.filter(
        (event) =>
          event.trigger === "scheduled",
      ).length;

    const successRate =
      completedCount + failedCount === 0
        ? 0
        : Math.round(
            (completedCount /
              (completedCount + failedCount)) *
              100,
          );

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
      },
      summary: {
        totalCount,
        returnedCount:
          events.length,
        completedCount,
        failedCount,
        runningCount,
        manualCount,
        scheduledCount,
        successRate,
        totalCreatedPrompts:
          aggregate._sum.createdCount || 0,
        totalGeneratedPrompts:
          aggregate._sum.generatedCount || 0,
        totalSkippedDuplicates:
          aggregate._sum
            .skippedDuplicateCount || 0,
        totalRetrievedCharacters:
          aggregate._sum
            .retrievedCharacterCount || 0,
        averageDurationMs:
          Math.round(
            aggregate._avg.durationMs || 0,
          ),
        totalDurationMs:
          aggregate._sum.durationMs || 0,
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
