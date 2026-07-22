import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { verifyToken } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

const ALLOWED_STATUSES = [
  "open",
  "resolved",
] as const;

const ALLOWED_SEVERITIES = [
  "medium",
  "high",
  "critical",
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
    if (!(await requireAdmin())) {
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
      720,
      1,
      8760,
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

    const severity =
      searchParams
        .get("severity")
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
            "Invalid credibility alert status.",
          allowedStatuses:
            ALLOWED_STATUSES,
        },
        {
          status: 400,
        },
      );
    }

    if (
      severity &&
      !ALLOWED_SEVERITIES.includes(
        severity as
          (typeof ALLOWED_SEVERITIES)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid credibility alert severity.",
          allowedSeverities:
            ALLOWED_SEVERITIES,
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

    const where: Prisma.SourceCredibilityAlertWhereInput = {
      createdAt: {
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
      ...(severity
        ? {
            severity,
          }
        : {}),
    };

    const [
      alerts,
      totalCount,
      openCount,
      resolvedCount,
      severityBreakdown,
    ] = await Promise.all([
      prisma.sourceCredibilityAlert.findMany({
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
          scanEvent: {
            select: {
              id: true,
              trigger: true,
              provider: true,
              startedAt: true,
              completedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      }),
      prisma.sourceCredibilityAlert.count({
        where,
      }),
      prisma.sourceCredibilityAlert.count({
        where: {
          ...where,
          status: "open",
        },
      }),
      prisma.sourceCredibilityAlert.count({
        where: {
          ...where,
          status: "resolved",
        },
      }),
      prisma.sourceCredibilityAlert.groupBy({
        by: ["severity"],
        where,
        _count: {
          _all: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      filters: {
        hours,
        limit,
        sourceId:
          sourceId || null,
        status:
          status || null,
        severity:
          severity || null,
      },
      summary: {
        totalCount,
        returnedCount:
          alerts.length,
        openCount,
        resolvedCount,
        criticalCount:
          severityBreakdown.find(
            (item) =>
              item.severity === "critical",
          )?._count._all || 0,
        highCount:
          severityBreakdown.find(
            (item) =>
              item.severity === "high",
          )?._count._all || 0,
        mediumCount:
          severityBreakdown.find(
            (item) =>
              item.severity === "medium",
          )?._count._all || 0,
      },
      alerts: alerts.map((alert) => ({
        id: alert.id,
        sourceId: alert.sourceId,
        source: alert.source,
        scanEventId: alert.scanEventId,
        scanEvent: alert.scanEvent
          ? {
              ...alert.scanEvent,
              startedAt:
                alert.scanEvent.startedAt.toISOString(),
              completedAt:
                alert.scanEvent.completedAt?.toISOString() ||
                null,
            }
          : null,
        severity: alert.severity,
        status: alert.status,
        alertType: alert.alertType,
        currentScore: alert.currentScore,
        previousScore: alert.previousScore,
        scoreDrop: alert.scoreDrop,
        threshold: alert.threshold,
        message: alert.message,
        createdAt:
          alert.createdAt.toISOString(),
        resolvedAt:
          alert.resolvedAt?.toISOString() ||
          null,
      })),
    });
  } catch (error) {
    console.error(
      "GET /api/source-credibility-alerts error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load source credibility alerts.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
) {
  try {
    if (!(await requireAdmin())) {
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

    const body =
      (await request.json()) as {
        id?: unknown;
        status?: unknown;
      };

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    const status =
      typeof body.status === "string"
        ? body.status.trim().toLowerCase()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Credibility alert id is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !ALLOWED_STATUSES.includes(
        status as
          (typeof ALLOWED_STATUSES)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Status must be open or resolved.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.sourceCredibilityAlert.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Credibility alert not found.",
        },
        {
          status: 404,
        },
      );
    }

    const updated =
      await prisma.sourceCredibilityAlert.update({
        where: {
          id,
        },
        data: {
          status,
          resolvedAt:
            status === "resolved"
              ? new Date()
              : null,
        },
      });

    return NextResponse.json({
      success: true,
      alert: {
        ...updated,
        createdAt:
          updated.createdAt.toISOString(),
        resolvedAt:
          updated.resolvedAt?.toISOString() ||
          null,
      },
      message:
        status === "resolved"
          ? "Credibility alert resolved."
          : "Credibility alert reopened.",
    });
  } catch (error) {
    console.error(
      "PATCH /api/source-credibility-alerts error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update source credibility alert.",
      },
      {
        status: 500,
      },
    );
  }
}
