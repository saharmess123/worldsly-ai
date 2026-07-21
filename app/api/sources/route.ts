import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  internalServerError,
} from "../../lib/api-response";
import { prisma } from "../../lib/prisma";
import { scanSourceById, SourceScanError } from "../../lib/source-scanner";

const ALLOWED_SOURCE_STATUSES = [
  "active",
  "paused",
  "archived",
] as const;

const ALLOWED_SCAN_FREQUENCIES = [
  "manual",
  "daily",
  "weekly",
  "monthly",
] as const;

type SourceStatus =
  (typeof ALLOWED_SOURCE_STATUSES)[number];

type ScanFrequency =
  (typeof ALLOWED_SCAN_FREQUENCIES)[number];

type CreateSourceBody = {
  action?: "create";
  name?: unknown;
  type?: unknown;
  url?: unknown;
  credibilityScore?: unknown;
  status?: unknown;
  scanFrequency?: unknown;
};

type ScanSourceBody = {
  action: "scan";
  sourceId?: unknown;
};

type SourcePostBody =
  | CreateSourceBody
  | ScanSourceBody;

type SourceWithCount =
  Prisma.SourceGetPayload<{
    include: {
      _count: {
        select: {
          discoveredPrompts: true;
        };
      };
    };
  }>;

async function requireAdmin(): Promise<boolean> {
  const cookieStore =
    await cookies();

  const role =
    cookieStore.get(
      "wordsly_user_role",
    )?.value || "admin";

  return role === "admin";
}

function normalizeText(
  value: unknown,
  fallback = "",
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function normalizeNumber(
  value: unknown,
  fallback = 0,
): number {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(numberValue)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(numberValue),
    ),
  );
}

function isSourceStatus(
  value: string,
): value is SourceStatus {
  return ALLOWED_SOURCE_STATUSES.includes(
    value as SourceStatus,
  );
}

function isScanFrequency(
  value: string,
): value is ScanFrequency {
  return ALLOWED_SCAN_FREQUENCIES.includes(
    value as ScanFrequency,
  );
}

function formatDate(
  value: Date | null,
): string | null {
  return value
    ? value.toISOString()
    : null;
}

function formatSourceItem(
  item: SourceWithCount,
) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    url: item.url,
    credibilityScore:
      item.credibilityScore,
    status: item.status,

    lastScanAt:
      formatDate(item.lastScanAt),

    lastScanLabel:
      item.lastScanAt
        ? item.lastScanAt.toLocaleString()
        : "Never scanned",

    scanFrequency:
      item.scanFrequency,

    discoveredPromptCount:
      item._count.discoveredPrompts,

    createdAt:
      item.createdAt.toISOString(),

    updatedAt:
      item.updatedAt.toISOString(),

    storageMode:
      "sqlite_prisma",
  };
}

export async function GET() {
  try {
    const isAdmin =
      await requireAdmin();

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

    const items =
      await prisma.source.findMany({
        include: {
          _count: {
            select: {
              discoveredPrompts:
                true,
            },
          },
        },
        orderBy: {
          createdAt:
            "desc",
        },
      });

    const activeCount =
      items.filter(
        (item) =>
          item.status ===
          "active",
      ).length;

    const pausedCount =
      items.filter(
        (item) =>
          item.status ===
          "paused",
      ).length;

    const archivedCount =
      items.filter(
        (item) =>
          item.status ===
          "archived",
      ).length;

    const totalDiscoveredPrompts =
      items.reduce(
        (total, item) =>
          total +
          item._count
            .discoveredPrompts,
        0,
      );

    const averageCredibility =
      items.length === 0
        ? 0
        : Math.round(
            items.reduce(
              (sum, item) =>
                sum +
                item.credibilityScore,
              0,
            ) /
              items.length,
          );

    return NextResponse.json({
      success: true,
      items:
        items.map(
          formatSourceItem,
        ),
      count:
        items.length,
      activeCount,
      pausedCount,
      archivedCount,
      averageCredibility,
      totalDiscoveredPrompts,
      storageMode:
        "sqlite_prisma",
      message:
        "Sources loaded successfully.",
    });
  } catch (error) {
    console.error(
      "GET /api/sources error:",
      error,
    );

    return internalServerError(
      "Something went wrong while loading sources.",
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const isAdmin =
      await requireAdmin();

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

    let body: SourcePostBody;

    try {
      body =
        (await request.json()) as SourcePostBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid JSON body.",
          storageMode:
            "sqlite_prisma",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * MODULE 8:
     * Scan an existing source and create discovered prompts
     * linked to the source.
     */
    if (
      body.action === "scan"
    ) {
      const sourceId =
        normalizeText(
          body.sourceId,
        );

      if (!sourceId) {
        return NextResponse.json(
          {
            success: false,
            scanStatus: "failed",
            error:
              "Source ID is required for scanning.",
          },
          {
            status: 400,
          },
        );
      }

      try {
        const result =
          await scanSourceById(
            sourceId,
            {
              enforceCooldown: true,
            },
          );

        const duplicateMessage =
          result.skippedDuplicateCount > 0
            ? ` ${result.skippedDuplicateCount} duplicate prompt(s) were skipped.`
            : "";

        return NextResponse.json(
          {
            success: true,
            scanStatus: "completed",
            message:
              `${result.createdCount} discovered prompt(s) were created via ${result.provider} using ${result.retrievedCharacterCount} retrieved characters.${duplicateMessage}`,
            createdCount:
              result.createdCount,
            skippedDuplicateCount:
              result.skippedDuplicateCount,
            createdPrompts:
              result.createdPrompts,
            item:
              formatSourceItem(
                result.updatedSource,
              ),
          },
          {
            status: 201,
          },
        );
      } catch (error) {
        if (
          error instanceof
          SourceScanError
        ) {
          return NextResponse.json(
            {
              success: false,
              scanStatus: "failed",
              code: error.code,
              error: error.message,
            },
            {
              status: error.status,
            },
          );
        }

        throw error;
      }
    }
    const name =
      normalizeText(
        body.name,
      );

    const type =
      normalizeText(
        body.type,
        "Website",
      );

    const url =
      normalizeText(
        body.url,
      );

    const status =
      normalizeText(
        body.status,
        "active",
      );

    const scanFrequency =
      normalizeText(
        body.scanFrequency,
        "manual",
      );

    const credibilityScore =
      normalizeNumber(
        body.credibilityScore,
        70,
      );

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Source name is required.",
          storageMode:
            "sqlite_prisma",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isSourceStatus(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid source status.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isScanFrequency(
        scanFrequency,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid scan frequency.",
        },
        {
          status: 400,
        },
      );
    }

    const item =
      await prisma.source.create({
        data: {
          name,
          type,
          url:
            url || null,
          credibilityScore,
          status,
          scanFrequency,
        },
        include: {
          _count: {
            select: {
              discoveredPrompts:
                true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        item:
          formatSourceItem(
            item,
          ),
        storageMode:
          "sqlite_prisma",
        message:
          "Source created successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/sources error:",
      error,
    );

    return internalServerError(
      "Something went wrong while processing the source request.",
    );
  }
}

export async function DELETE(
  request: NextRequest,
) {
  try {
    const isAdmin =
      await requireAdmin();

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

    const id =
      request.nextUrl.searchParams
        .get("id")
        ?.trim();

    if (id) {
      const existingSource =
        await prisma.source.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
          },
        });

      if (!existingSource) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Source not found.",
            deletedId:
              id,
            storageMode:
              "sqlite_prisma",
          },
          {
            status: 404,
          },
        );
      }

      await prisma.source.delete({
        where: {
          id,
        },
      });

      return NextResponse.json({
        success: true,
        message:
          "Source deleted successfully.",
        deletedId:
          id,
        storageMode:
          "sqlite_prisma",
      });
    }

    const result =
      await prisma.source.deleteMany();

    return NextResponse.json({
      success: true,
      message:
        "All sources deleted successfully.",
      deletedCount:
        result.count,
      count:
        0,
      storageMode:
        "sqlite_prisma",
    });
  } catch (error) {
    console.error(
      "DELETE /api/sources error:",
      error,
    );

    return internalServerError(
      "Something went wrong while deleting sources.",
    );
  }
}