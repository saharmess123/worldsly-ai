import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../lib/prisma";

type SourcePostBody = {
  name?: string;
  type?: string;
  url?: string;
  credibilityScore?: number | string;
  status?: string;
  scanFrequency?: string;
};

function normalizeText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function normalizeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function formatSourceItem(item: {
  id: string;
  name: string;
  type: string;
  url: string | null;
  credibilityScore: number;
  status: string;
  lastScanAt: Date | null;
  scanFrequency: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    url: item.url,
    credibilityScore: item.credibilityScore,
    status: item.status,
    lastScanAt: item.lastScanAt
      ? item.lastScanAt.toLocaleString()
      : "Never scanned",
    scanFrequency: item.scanFrequency,
    createdAt: item.createdAt.toLocaleString(),
    updatedAt: item.updatedAt.toLocaleString(),
    storageMode: "sqlite_prisma",
  };
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("wordsly_user_role")?.value || "admin";
    if (role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }
    const items = await prisma.source.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const activeCount = items.filter((item) => item.status === "active").length;
    const pausedCount = items.filter((item) => item.status === "paused").length;
    const archivedCount = items.filter(
      (item) => item.status === "archived"
    ).length;

    const averageCredibility =
      items.length === 0
        ? 0
        : Math.round(
            items.reduce((sum, item) => sum + item.credibilityScore, 0) /
              items.length
          );

    return NextResponse.json({
      success: true,
      items: items.map(formatSourceItem),
      count: items.length,
      activeCount,
      pausedCount,
      archivedCount,
      averageCredibility,
      storageMode: "sqlite_prisma",
      message: "Sources loaded successfully from SQLite using Prisma.",
    });
  } catch (error) {
    console.error("Sources GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while loading sources.",
        storageMode: "sqlite_prisma",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("wordsly_user_role")?.value || "admin";
    if (role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }
    let body: SourcePostBody;

    try {
      body = (await request.json()) as SourcePostBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON body.",
          storageMode: "sqlite_prisma",
        },
        { status: 400 }
      );
    }

    const name = normalizeText(body.name);
    const type = normalizeText(body.type, "Website");
    const url = normalizeText(body.url);
    const status = normalizeText(body.status, "active");
    const scanFrequency = normalizeText(body.scanFrequency, "manual");
    const credibilityScore = normalizeNumber(body.credibilityScore, 70);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Source name is required.",
          storageMode: "sqlite_prisma",
        },
        { status: 400 }
      );
    }

    const item = await prisma.source.create({
      data: {
        name,
        type,
        url: url || null,
        credibilityScore,
        status,
        scanFrequency,
      },
    });

    return NextResponse.json({
      success: true,
      item: formatSourceItem(item),
      storageMode: "sqlite_prisma",
      message: "Source created successfully.",
    });
  } catch (error) {
    console.error("Sources POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while creating the source.",
        storageMode: "sqlite_prisma",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("wordsly_user_role")?.value || "admin";
    if (role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      try {
        await prisma.source.delete({
          where: {
            id,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Source deleted successfully.",
          deletedId: id,
          storageMode: "sqlite_prisma",
        });
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Source not found.",
            deletedId: id,
            storageMode: "sqlite_prisma",
          },
          { status: 404 }
        );
      }
    }

    const result = await prisma.source.deleteMany();

    return NextResponse.json({
      success: true,
      message: "All sources deleted successfully.",
      deletedCount: result.count,
      count: 0,
      storageMode: "sqlite_prisma",
    });
  } catch (error) {
    console.error("Sources DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while deleting sources.",
        storageMode: "sqlite_prisma",
      },
      { status: 500 }
    );
  }
}