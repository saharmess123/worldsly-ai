import { NextResponse } from "next/server";
import {
  apiError,
  internalServerError,
} from "../../lib/api-response";
import { prisma } from "../../lib/prisma";

type HistoryPostBody = {
  originalPrompt?: string;
  output?: string;
  improvedPrompt?: string;
  category?: string;
  model?: string;
  goal?: string;
  depth?: string;
  outputFormat?: string;
  originalScore?: number | string;
  improvedScore?: number | string;
  engineStatus?: string;
  mode?: string;
  aiProvider?: string;
  storageMode?: string;
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

  return numberValue;
}

function formatHistoryItem(item: {
  id: string;
  originalPrompt: string;
  improvedPrompt: string;
  category: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  originalScore: number;
  improvedScore: number;
  engineStatus: string;
  createdAt: Date;
}) {
  return {
    id: item.id,
    tool: "Prompt Optimizer",
    originalPrompt: item.originalPrompt,
    output: item.improvedPrompt,
    improvedPrompt: item.improvedPrompt,
    category: item.category,
    model: item.model,
    goal: item.goal,
    depth: item.depth,
    outputFormat: item.outputFormat,
    originalScore: item.originalScore,
    improvedScore: item.improvedScore,
    scoreGain: item.improvedScore - item.originalScore,
    engineStatus: item.engineStatus,
    mode: item.engineStatus === "real_ai" ? "real" : "mock",
    aiProvider: item.engineStatus === "real_ai" ? "openai" : "mock",
    storageMode: "postgres_prisma",
    createdAt: item.createdAt.toLocaleString(),
  };
}

export async function GET() {
  try {
    const items = await prisma.optimization.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      items: items.map(formatHistoryItem),
      count: items.length,
      storageMode: "postgres_prisma",
      message: "History loaded successfully from SQLite using Prisma.",
      note: "This data is stored in SQLite using Prisma. It stays after server restart.",
    });
  } catch (error) {
    console.error("History GET error:", error);

    return internalServerError(
      "Something went wrong while loading history.",
      {
        storageMode: "postgres_prisma",
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: HistoryPostBody;

    try {
      body = (await request.json()) as HistoryPostBody;
    } catch {
      return apiError("Invalid JSON body.", {
        status: 400,
        code: "INVALID_JSON_BODY",
        extra: {
          storageMode: "postgres_prisma",
        },
      });
    }

    const originalPrompt = normalizeText(body.originalPrompt);
    const improvedPrompt = normalizeText(
      body.output || body.improvedPrompt
    );

    if (!improvedPrompt) {
      return apiError("Output is required.", {
        status: 400,
        code: "OUTPUT_REQUIRED",
        extra: {
          storageMode: "postgres_prisma",
        },
      });
    }

    const item = await prisma.optimization.create({
      data: {
        originalPrompt,
        improvedPrompt,
        category: normalizeText(body.category, "General"),
        model: normalizeText(
          body.model,
          "GPT-4.1 / GPT-5 style"
        ),
        goal: normalizeText(body.goal, "More structured"),
        depth: normalizeText(body.depth, "Balanced"),
        outputFormat: normalizeText(
          body.outputFormat,
          "Detailed explanation"
        ),
        originalScore: normalizeNumber(body.originalScore),
        improvedScore: normalizeNumber(body.improvedScore),
        engineStatus: normalizeText(
          body.engineStatus,
          "mock_api"
        ),
      },
    });

    return NextResponse.json({
      success: true,
      item: formatHistoryItem(item),
      storageMode: "postgres_prisma",
      message:
        "Optimization saved successfully to SQLite history.",
    });
  } catch (error) {
    console.error("History POST error:", error);

    return internalServerError(
      "Something went wrong while saving history.",
      {
        storageMode: "postgres_prisma",
      }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      try {
        await prisma.optimization.delete({
          where: {
            id,
          },
        });

        return NextResponse.json({
          success: true,
          message: "History record deleted.",
          deletedId: id,
          storageMode: "postgres_prisma",
        });
      } catch {
        return apiError("History record not found.", {
          status: 404,
          code: "HISTORY_RECORD_NOT_FOUND",
          extra: {
            deletedId: id,
            storageMode: "postgres_prisma",
          },
        });
      }
    }

    const result = await prisma.optimization.deleteMany();

    return NextResponse.json({
      success: true,
      message: "All database history cleared.",
      deletedCount: result.count,
      count: 0,
      storageMode: "postgres_prisma",
    });
  } catch (error) {
    console.error("History DELETE error:", error);

    return internalServerError(
      "Something went wrong while deleting history.",
      {
        storageMode: "postgres_prisma",
      }
    );
  }
}