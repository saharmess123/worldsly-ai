import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "../../lib/prisma";

const SOURCE_TYPES = [
  "feedback",
  "history",
  "corpus",
] as const;

const SIGNAL_TYPES = [
  "preference",
  "demonstration",
  "curated",
] as const;

type SourceType =
  (typeof SOURCE_TYPES)[number];

type SignalType =
  (typeof SIGNAL_TYPES)[number];

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();

  const role =
    cookieStore.get("wordsly_user_role")
      ?.value || "admin";

  return role === "admin";
}

function isValidSourceType(
  value: string
): value is SourceType {
  return SOURCE_TYPES.includes(
    value as SourceType
  );
}

function isValidSignalType(
  value: string
): value is SignalType {
  return SIGNAL_TYPES.includes(
    value as SignalType
  );
}

function parseObjectMetadata(
  metadata: string | null
): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  try {
    const parsed: unknown =
      JSON.parse(metadata);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<
        string,
        unknown
      >;
    }

    return {};
  } catch {
    return {};
  }
}

function parsePatterns(
  patterns: string | null
): string[] {
  if (!patterns) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(patterns);

    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (value): value is string =>
            typeof value === "string"
        )
        .map((value) => value.trim())
        .filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated values.
  }

  return patterns
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseMinimumScore(
  value: string | null
): number | null {
  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    parsed > 100
  ) {
    return null;
  }

  return Math.round(parsed);
}

function createDeduplicationKey(
  sourceType: SourceType,
  sourceId: string,
  signalType: SignalType
): string {
  return `${sourceType}:${sourceId}:${signalType}`;
}

function getFeedbackScore(
  rating: string
): number {
  return rating === "useful"
    ? 100
    : 0;
}

async function upsertFeedbackSignals(
  transaction: Prisma.TransactionClient
) {
  const feedbacks =
    await transaction.feedback.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

  let created = 0;
  let updated = 0;

  for (const feedback of feedbacks) {
    const deduplicationKey =
      createDeduplicationKey(
        "feedback",
        feedback.id,
        "preference"
      );

    const existing =
      await transaction.trainingSignal.findUnique({
        where: {
          deduplicationKey,
        },
        select: {
          id: true,
        },
      });

    const metadata = JSON.stringify({
      pipelineSource:
        "manual_signal_generation",
      feedbackId: feedback.id,
      rating: feedback.rating,
      comment: feedback.comment,
      originalPrompt:
        feedback.originalPrompt,
      improvedPrompt:
        feedback.improvedPrompt,
      category: feedback.category,
      model: feedback.model,
      goal: feedback.goal,
      depth: feedback.depth,
      outputFormat:
        feedback.outputFormat,
      engineStatus:
        feedback.engineStatus,
      createdAt:
        feedback.createdAt,
    });

    await transaction.trainingSignal.upsert({
      where: {
        deduplicationKey,
      },
      create: {
        deduplicationKey,
        sourceType: "feedback",
        sourceId: feedback.id,
        corpusId: null,
        signalType: "preference",
        score: getFeedbackScore(
          feedback.rating
        ),
        metadata,
      },
      update: {
        sourceType: "feedback",
        sourceId: feedback.id,
        corpusId: null,
        signalType: "preference",
        score: getFeedbackScore(
          feedback.rating
        ),
        metadata,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return {
    processed: feedbacks.length,
    created,
    updated,
  };
}

async function upsertOptimizationSignals(
  transaction: Prisma.TransactionClient
) {
  const optimizations =
    await transaction.optimization.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

  let created = 0;
  let updated = 0;

  for (const optimization of optimizations) {
    const deduplicationKey =
      createDeduplicationKey(
        "history",
        optimization.id,
        "demonstration"
      );

    const existing =
      await transaction.trainingSignal.findUnique({
        where: {
          deduplicationKey,
        },
        select: {
          id: true,
        },
      });

    const metadata = JSON.stringify({
      pipelineSource:
        "manual_signal_generation",
      optimizationId:
        optimization.id,
      originalPrompt:
        optimization.originalPrompt,
      improvedPrompt:
        optimization.improvedPrompt,
      category:
        optimization.category,
      model: optimization.model,
      goal: optimization.goal,
      depth: optimization.depth,
      outputFormat:
        optimization.outputFormat,
      originalScore:
        optimization.originalScore,
      improvedScore:
        optimization.improvedScore,
      engineStatus:
        optimization.engineStatus,
      createdAt:
        optimization.createdAt,
    });

    await transaction.trainingSignal.upsert({
      where: {
        deduplicationKey,
      },
      create: {
        deduplicationKey,
        sourceType: "history",
        sourceId: optimization.id,
        corpusId: null,
        signalType: "demonstration",
        score:
          optimization.improvedScore,
        metadata,
      },
      update: {
        sourceType: "history",
        sourceId: optimization.id,
        corpusId: null,
        signalType: "demonstration",
        score:
          optimization.improvedScore,
        metadata,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return {
    processed: optimizations.length,
    created,
    updated,
  };
}

async function upsertCorpusSignals(
  transaction: Prisma.TransactionClient
) {
  const corpusPrompts =
    await transaction.corpusPrompt.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

  let created = 0;
  let updated = 0;

  for (const corpusPrompt of corpusPrompts) {
    const deduplicationKey =
      createDeduplicationKey(
        "corpus",
        corpusPrompt.id,
        "curated"
      );

    const existing =
      await transaction.trainingSignal.findUnique({
        where: {
          deduplicationKey,
        },
        select: {
          id: true,
        },
      });

    const corpusMetadata =
      parseObjectMetadata(
        corpusPrompt.metadata
      );

    const patterns =
      parsePatterns(
        corpusPrompt.patterns
      );

    const metadata = JSON.stringify({
      pipelineSource:
        "corpus_signal_sync",
      corpusPromptId:
        corpusPrompt.id,
      discoveredPromptId:
        corpusPrompt.discoveredPromptId,
      title: corpusPrompt.title,
      prompt: corpusPrompt.prompt,
      improvedVersion:
        corpusPrompt.improvedVersion,
      category:
        corpusPrompt.category,
      model: corpusPrompt.model,
      qualityScore:
        corpusPrompt.qualityScore,
      patterns,
      corpusMetadata,
      createdAt:
        corpusPrompt.createdAt,
      updatedAt:
        corpusPrompt.updatedAt,
    });

    await transaction.trainingSignal.upsert({
      where: {
        deduplicationKey,
      },
      create: {
        deduplicationKey,
        sourceType: "corpus",
        sourceId:
          corpusPrompt.discoveredPromptId,
        corpusId:
          corpusPrompt.id,
        signalType: "curated",
        score:
          corpusPrompt.qualityScore,
        metadata,
      },
      update: {
        sourceType: "corpus",
        sourceId:
          corpusPrompt.discoveredPromptId,
        corpusId:
          corpusPrompt.id,
        signalType: "curated",
        score:
          corpusPrompt.qualityScore,
        metadata,
      },
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return {
    processed:
      corpusPrompts.length,
    created,
    updated,
  };
}

export async function GET(
  request: NextRequest
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
        }
      );
    }

    const sourceType =
      request.nextUrl.searchParams
        .get("sourceType")
        ?.trim();

    const signalType =
      request.nextUrl.searchParams
        .get("signalType")
        ?.trim();

    const minScoreValue =
      request.nextUrl.searchParams.get(
        "minScore"
      );

    const minimumScore =
      parseMinimumScore(
        minScoreValue
      );

    if (
      minScoreValue !== null &&
      minScoreValue !== "" &&
      minimumScore === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Minimum score must be a number between 0 and 100.",
        },
        {
          status: 400,
        }
      );
    }

    const where: Prisma.TrainingSignalWhereInput =
      {};

    if (
      sourceType &&
      sourceType !== "All"
    ) {
      if (
        !isValidSourceType(sourceType)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid source type filter.",
          },
          {
            status: 400,
          }
        );
      }

      where.sourceType =
        sourceType;
    }

    if (
      signalType &&
      signalType !== "All"
    ) {
      if (
        !isValidSignalType(signalType)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid signal type filter.",
          },
          {
            status: 400,
          }
        );
      }

      where.signalType =
        signalType;
    }

    if (minimumScore !== null) {
      where.score = {
        gte: minimumScore,
      };
    }

    const signals =
      await prisma.trainingSignal.findMany({
        where,
        include: {
          corpus: {
            select: {
              id: true,
              title: true,
              category: true,
              model: true,
              qualityScore: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    const items = signals.map(
      (signal) => ({
        id: signal.id,
        deduplicationKey:
          signal.deduplicationKey,
        sourceType:
          signal.sourceType,
        sourceId:
          signal.sourceId,
        corpusId:
          signal.corpusId,
        signalType:
          signal.signalType,
        score:
          signal.score,
        metadata:
          parseObjectMetadata(
            signal.metadata
          ),
        createdAt:
          signal.createdAt,
        updatedAt:
          signal.updatedAt,
        corpus:
          signal.corpus,
      })
    );

    const averageScore =
      items.length > 0
        ? Math.round(
            items.reduce(
              (total, item) =>
                total + item.score,
              0
            ) / items.length
          )
        : 0;

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
      averageScore,
      counts: {
        feedback: items.filter(
          (item) =>
            item.sourceType ===
            "feedback"
        ).length,
        history: items.filter(
          (item) =>
            item.sourceType ===
            "history"
        ).length,
        corpus: items.filter(
          (item) =>
            item.sourceType ===
            "corpus"
        ).length,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/training-signals error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load training signals.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST() {
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
        }
      );
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const feedback =
            await upsertFeedbackSignals(
              transaction
            );

          const history =
            await upsertOptimizationSignals(
              transaction
            );

          const corpus =
            await upsertCorpusSignals(
              transaction
            );

          return {
            feedback,
            history,
            corpus,
          };
        }
      );

    const totalProcessed =
      result.feedback.processed +
      result.history.processed +
      result.corpus.processed;

    const totalCreated =
      result.feedback.created +
      result.history.created +
      result.corpus.created;

    const totalUpdated =
      result.feedback.updated +
      result.history.updated +
      result.corpus.updated;

    return NextResponse.json({
      success: true,
      message:
        `Training signal synchronization completed. ` +
        `${totalCreated} created, ` +
        `${totalUpdated} updated.`,
      totals: {
        processed:
          totalProcessed,
        created:
          totalCreated,
        updated:
          totalUpdated,
      },
      details:
        result,
    });
  } catch (error) {
    console.error(
      "POST /api/training-signals error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to synchronize training signals.",
      },
      {
        status: 500,
      }
    );
  }
}