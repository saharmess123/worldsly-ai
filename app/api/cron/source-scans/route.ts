import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "../../../lib/prisma";
import {
  scanSourceById,
  SourceScanError,
} from "../../../lib/source-scanner";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FREQUENCY_INTERVALS_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
} as const;

type ScheduledFrequency =
  keyof typeof FREQUENCY_INTERVALS_MS;

function isScheduledFrequency(
  value: string,
): value is ScheduledFrequency {
  return value in FREQUENCY_INTERVALS_MS;
}

function isSourceDue(
  frequency: ScheduledFrequency,
  lastScanAt: Date | null,
  currentTime: number,
): boolean {
  if (!lastScanAt) {
    return true;
  }

  return (
    currentTime -
      lastScanAt.getTime() >=
    FREQUENCY_INTERVALS_MS[frequency]
  );
}

function getBatchSize(): number {
  const configuredValue = Number(
    process.env.SOURCE_SCAN_BATCH_SIZE || "3",
  );

  if (
    !Number.isInteger(configuredValue) ||
    configuredValue < 1
  ) {
    return 3;
  }

  return Math.min(configuredValue, 10);
}

export async function GET(
  request: NextRequest,
) {
  const cronSecret =
    process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        success: false,
        error:
          "CRON_SECRET is not configured.",
      },
      {
        status: 503,
      },
    );
  }

  const authorization =
    request.headers.get("authorization");

  if (
    authorization !==
    `Bearer ${cronSecret}`
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized cron request.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const now = Date.now();
    const batchSize = getBatchSize();

    const scheduledSources =
      await prisma.source.findMany({
        where: {
          status: "active",
          url: {
            not: null,
          },
          scanFrequency: {
            in: [
              "daily",
              "weekly",
              "monthly",
            ],
          },
        },
        orderBy: [
          {
            lastScanAt: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      });

    const dueSources =
      scheduledSources
        .filter((source) => {
          if (
            !isScheduledFrequency(
              source.scanFrequency,
            )
          ) {
            return false;
          }

          return isSourceDue(
            source.scanFrequency,
            source.lastScanAt,
            now,
          );
        })
        .slice(0, batchSize);

    const results: Array<{
      sourceId: string;
      sourceName: string;
      success: boolean;
      createdCount?: number;
      skippedDuplicateCount?: number;
      provider?: string;
      error?: string;
      code?: string;
    }> = [];

    for (const source of dueSources) {
      try {
        const result =
          await scanSourceById(
            source.id,
            {
              enforceCooldown: false,
            },
          );

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          success: true,
          createdCount:
            result.createdCount,
          skippedDuplicateCount:
            result.skippedDuplicateCount,
          provider:
            result.provider,
        });
      } catch (error) {
        if (
          error instanceof
          SourceScanError
        ) {
          results.push({
            sourceId: source.id,
            sourceName: source.name,
            success: false,
            error: error.message,
            code: error.code,
          });

          continue;
        }

        results.push({
          sourceId: source.id,
          sourceName: source.name,
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown scheduled scan error.",
          code:
            "SOURCE_SCAN_UNEXPECTED_ERROR",
        });
      }
    }

    const successfulScans =
      results.filter(
        (result) => result.success,
      ).length;

    const failedScans =
      results.length -
      successfulScans;

    const createdPrompts =
      results.reduce(
        (total, result) =>
          total +
          (result.createdCount || 0),
        0,
      );

    return NextResponse.json({
      success: failedScans === 0,
      message:
        dueSources.length === 0
          ? "No scheduled sources are currently due."
          : "Scheduled source scan completed.",
      evaluatedCount:
        scheduledSources.length,
      dueCount:
        dueSources.length,
      successfulScans,
      failedScans,
      createdPrompts,
      batchSize,
      executedAt:
        new Date(now).toISOString(),
      results,
    });
  } catch (error) {
    console.error(
      "GET /api/cron/source-scans error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "The scheduled source scan could not be completed.",
      },
      {
        status: 500,
      },
    );
  }
}