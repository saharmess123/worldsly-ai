import { NextResponse } from "next/server";

import {
  apiError,
  internalServerError,
  notFound,
} from "../../lib/api-response";
import { prisma } from "../../lib/prisma";

type FeedbackRating = "useful" | "needs_work";

type FeedbackPostBody = {
  rating?: FeedbackRating;
  originalPrompt?: string;
  improvedPrompt?: string;
  category?: string;
  model?: string;
  goal?: string;
  depth?: string;
  outputFormat?: string;
  engineStatus?: string;
  mode?: string;
  aiProvider?: string;
  storageMode?: string;
};

type FeedbackItem = {
  id: string;
  rating: string;
  originalPrompt: string;
  improvedPrompt: string;
  category: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  engineStatus: string;
  createdAt: Date;
};

function normalizeText(
  value: unknown,
  fallback = ""
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
}

function isValidRating(
  value: unknown
): value is FeedbackRating {
  return (
    value === "useful" ||
    value === "needs_work"
  );
}

function formatFeedbackItem(
  item: FeedbackItem
) {
  return {
    id: item.id,
    rating: item.rating,
    originalPrompt:
      item.originalPrompt,
    improvedPrompt:
      item.improvedPrompt,
    category: item.category,
    model: item.model,
    goal: item.goal,
    depth: item.depth,
    outputFormat:
      item.outputFormat,
    engineStatus:
      item.engineStatus,
    mode:
      item.engineStatus === "real_ai"
        ? "real"
        : "mock",
    aiProvider:
      item.engineStatus === "real_ai"
        ? "openai"
        : "mock",
    storageMode:
      "sqlite_prisma",
    createdAt:
      item.createdAt.toLocaleString(),
  };
}

export async function GET() {
  try {
    const items =
      await prisma.feedback.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    const usefulCount =
      items.filter(
        (item) =>
          item.rating === "useful"
      ).length;

    const needsWorkCount =
      items.filter(
        (item) =>
          item.rating === "needs_work"
      ).length;

    const usefulRate =
      items.length > 0
        ? Math.round(
            (usefulCount /
              items.length) *
              100
          )
        : 0;

    return NextResponse.json({
      success: true,
      items:
        items.map(
          formatFeedbackItem
        ),
      count: items.length,
      usefulCount,
      needsWorkCount,
      usefulRate,
      storageMode:
        "sqlite_prisma",
      message:
        "Feedback loaded successfully from SQLite using Prisma.",
      note:
        "This data is stored in SQLite using Prisma. It stays after server restart.",
    });
  } catch (error) {
    console.error(
      "Feedback GET error:",
      error
    );

    return internalServerError(
      "Something went wrong while loading feedback.",
      {
        storageMode:
          "sqlite_prisma",
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    let body: FeedbackPostBody;

    try {
      body =
        (await request.json()) as FeedbackPostBody;
    } catch {
      return apiError(
        "Invalid JSON body.",
        {
          status: 400,
          code:
            "INVALID_JSON_BODY",
          extra: {
            storageMode:
              "sqlite_prisma",
          },
        }
      );
    }

    if (
      !isValidRating(
        body.rating
      )
    ) {
      return apiError(
        "Rating must be useful or needs_work.",
        {
          status: 400,
          code:
            "INVALID_FEEDBACK_RATING",
          extra: {
            storageMode:
              "sqlite_prisma",
          },
        }
      );
    }

    const improvedPrompt =
      normalizeText(
        body.improvedPrompt
      );

    if (!improvedPrompt) {
      return apiError(
        "Improved prompt is required.",
        {
          status: 400,
          code:
            "IMPROVED_PROMPT_REQUIRED",
          extra: {
            storageMode:
              "sqlite_prisma",
          },
        }
      );
    }

    const item =
      await prisma.feedback.create({
        data: {
          rating: body.rating,
          originalPrompt:
            normalizeText(
              body.originalPrompt
            ),
          improvedPrompt,
          category:
            normalizeText(
              body.category,
              "General"
            ),
          model:
            normalizeText(
              body.model,
              "GPT-4.1 / GPT-5 style"
            ),
          goal:
            normalizeText(
              body.goal,
              "More structured"
            ),
          depth:
            normalizeText(
              body.depth,
              "Balanced"
            ),
          outputFormat:
            normalizeText(
              body.outputFormat,
              "Detailed explanation"
            ),
          engineStatus:
            normalizeText(
              body.engineStatus,
              "mock_api"
            ),
        },
      });

    return NextResponse.json({
      success: true,
      item:
        formatFeedbackItem(
          item
        ),
      storageMode:
        "sqlite_prisma",
      message:
        "Feedback saved successfully to SQLite.",
    });
  } catch (error) {
    console.error(
      "Feedback POST error:",
      error
    );

    return internalServerError(
      "Something went wrong while saving feedback.",
      {
        storageMode:
          "sqlite_prisma",
      }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const id =
      url.searchParams.get(
        "id"
      );

    if (id) {
      try {
        await prisma.feedback.delete({
          where: {
            id,
          },
        });

        return NextResponse.json({
          success: true,
          message:
            "Feedback record deleted.",
          deletedId: id,
          storageMode:
            "sqlite_prisma",
        });
      } catch {
       return apiError(
  "Feedback record not found.",
  {
    status: 404,
    code: "FEEDBACK_NOT_FOUND",
    extra: {
      deletedId: id,
      storageMode: "sqlite_prisma",
    },
  }
);
      }
    }

    const result =
      await prisma.feedback.deleteMany();

    return NextResponse.json({
      success: true,
      message:
        "All database feedback cleared.",
      deletedCount:
        result.count,
      count: 0,
      storageMode:
        "sqlite_prisma",
    });
  } catch (error) {
    console.error(
      "Feedback DELETE error:",
      error
    );

    return internalServerError(
      "Something went wrong while deleting feedback.",
      {
        storageMode:
          "sqlite_prisma",
      }
    );
  }
}