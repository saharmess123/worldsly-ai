import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "../../lib/prisma";

type OptimizationItem = {
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

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();

  const role =
    cookieStore.get("wordsly_user_role")?.value ||
    "admin";

  return role === "admin";
}

function formatOptimizationItem(
  item: OptimizationItem
) {
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
    scoreGain:
      item.improvedScore -
      item.originalScore,
    engineStatus: item.engineStatus,
    mode:
      item.engineStatus === "real_ai"
        ? "real"
        : "mock",
    aiProvider:
      item.engineStatus === "real_ai"
        ? "openai"
        : "mock",
    storageMode: "sqlite_prisma",
    createdAt:
      item.createdAt.toISOString(),
  };
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
    storageMode: "sqlite_prisma",
    createdAt:
      item.createdAt.toISOString(),
  };
}

function calculateAverage(
  values: number[]
): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  );
}

function calculateRate(
  numerator: number,
  denominator: number
): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (numerator / denominator) *
          100
      )
    )
  );
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
        }
      );
    }

    const [
      latestOptimizationsRaw,
      latestFeedbackRaw,

      totalOptimizations,
      totalFeedback,
      usefulFeedback,
      needsWorkFeedback,
      allOptimizationScores,

      sourceRecords,

      totalDiscoveredPrompts,
      pendingDiscoveredPrompts,
      curationQueueCount,
      approvedDiscoveredPrompts,
      rejectedDiscoveredPrompts,

      totalCurationReviews,
      approvedCurationReviews,
      rejectedCurationReviews,
      riskyCurationReviews,

      totalCorpusPrompts,
      totalTrainingSignals,
      corpusTrainingSignals,
    ] = await Promise.all([
      prisma.optimization.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),

      prisma.feedback.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),

      prisma.optimization.count(),

      prisma.feedback.count(),

      prisma.feedback.count({
        where: {
          rating: "useful",
        },
      }),

      prisma.feedback.count({
        where: {
          rating: "needs_work",
        },
      }),

      prisma.optimization.findMany({
        select: {
          originalScore: true,
          improvedScore: true,
        },
      }),

      prisma.source.findMany({
        select: {
          id: true,
          status: true,
          lastScanAt: true,
          credibilityScore: true,
          _count: {
            select: {
              discoveredPrompts: true,
            },
          },
        },
      }),

      prisma.discoveredPrompt.count(),

      prisma.discoveredPrompt.count({
        where: {
          status: "pending",
        },
      }),

      prisma.discoveredPrompt.count({
        where: {
          status:
            "sent_to_curation",
        },
      }),

      prisma.discoveredPrompt.count({
        where: {
          status: "approved",
        },
      }),

      prisma.discoveredPrompt.count({
        where: {
          status: "rejected",
        },
      }),

      prisma.curationReview.count(),

      prisma.curationReview.count({
        where: {
          status: "approved",
        },
      }),

      prisma.curationReview.count({
        where: {
          status: "rejected",
        },
      }),

      prisma.curationReview.count({
        where: {
          status: "risky",
        },
      }),

      prisma.corpusPrompt.count(),

      prisma.trainingSignal.count(),

      prisma.trainingSignal.findMany({
        where: {
          sourceType: "corpus",
          corpusId: {
            not: null,
          },
        },
        select: {
          corpusId: true,
        },
        distinct: ["corpusId"],
      }),
    ]);

    const totalSources =
      sourceRecords.length;

    const activeSources =
      sourceRecords.filter(
        (source) =>
          source.status === "active"
      ).length;

    const pausedSources =
      sourceRecords.filter(
        (source) =>
          source.status === "paused"
      ).length;

    const archivedSources =
      sourceRecords.filter(
        (source) =>
          source.status === "archived"
      ).length;

    const scannedSources =
      sourceRecords.filter(
        (source) =>
          source.lastScanAt !== null
      ).length;

    const productiveSources =
      sourceRecords.filter(
        (source) =>
          source._count
            .discoveredPrompts > 0
      ).length;

    const totalPromptsFromSources =
      sourceRecords.reduce(
        (total, source) =>
          total +
          source._count
            .discoveredPrompts,
        0
      );

    const averageCredibility =
      calculateAverage(
        sourceRecords.map(
          (source) =>
            source.credibilityScore
        )
      );

    const averagePromptsPerSource =
      totalSources === 0
        ? 0
        : Number(
            (
              totalPromptsFromSources /
              totalSources
            ).toFixed(1)
          );

    const originalScores =
      allOptimizationScores.map(
        (item) =>
          item.originalScore
      );

    const improvedScores =
      allOptimizationScores.map(
        (item) =>
          item.improvedScore
      );

    const scoreGains =
      allOptimizationScores.map(
        (item) =>
          item.improvedScore -
          item.originalScore
      );

    const averageOriginalScore =
      calculateAverage(
        originalScores
      );

    const averageImprovedScore =
      calculateAverage(
        improvedScores
      );

    const averageScoreGain =
      calculateAverage(
        scoreGains
      );

    const usefulRate =
      calculateRate(
        usefulFeedback,
        totalFeedback
      );

    const reviewedDiscoveryCount =
      approvedDiscoveredPrompts +
      rejectedDiscoveredPrompts;

    const enteredCurationCount =
      curationQueueCount +
      reviewedDiscoveryCount;

    const corpusLinkedSignalCount =
      corpusTrainingSignals.length;

    const discoveryApprovalRate =
      calculateRate(
        approvedDiscoveredPrompts,
        reviewedDiscoveryCount
      );

    const discoveryRejectionRate =
      calculateRate(
        rejectedDiscoveredPrompts,
        reviewedDiscoveryCount
      );

    const sourceScanningRate =
      calculateRate(
        scannedSources,
        totalSources
      );

    const productiveSourceRate =
      calculateRate(
        productiveSources,
        totalSources
      );

    const discoveryToCurationRate =
      calculateRate(
        enteredCurationCount,
        totalDiscoveredPrompts
      );

    const curationToCorpusRate =
      calculateRate(
        totalCorpusPrompts,
        reviewedDiscoveryCount
      );

    const corpusToTrainingRate =
      calculateRate(
        corpusLinkedSignalCount,
        totalCorpusPrompts
      );

    const endToEndConversionRate =
      calculateRate(
        corpusLinkedSignalCount,
        totalDiscoveredPrompts
      );

    const pendingReviewCount =
      curationQueueCount;

    const latestOptimizations =
      latestOptimizationsRaw.map(
        formatOptimizationItem
      );

    const latestFeedback =
      latestFeedbackRaw.map(
        formatFeedbackItem
      );

    return NextResponse.json({
      success: true,
      storageMode:
        "sqlite_prisma",
      message:
        "Pipeline analytics loaded successfully from SQLite using Prisma.",

      totalOptimizations,
      totalFeedback,
      usefulFeedback,
      needsWorkFeedback,
      usefulRate,

      averageOriginalScore,
      averageImprovedScore,
      averageScoreGain,

      totalSources,
      activeSources,
      pausedSources,
      archivedSources,
      scannedSources,
      productiveSources,
      averageCredibility,
      averagePromptsPerSource,

      totalDiscoveredPrompts,
      pendingDiscoveredPrompts,
      curationQueueCount,
      pendingReviewCount,
      approvedDiscoveredPrompts,
      rejectedDiscoveredPrompts,

      totalCurationReviews,
      approvedCurationReviews,
      rejectedCurationReviews,
      riskyCurationReviews,

      totalCorpusPrompts,
      totalTrainingSignals,
      corpusLinkedSignalCount,

      discoveryApprovalRate,
      discoveryRejectionRate,

      sourceScanningRate,
      productiveSourceRate,
      discoveryToCurationRate,
      curationToCorpusRate,
      corpusToTrainingRate,
      endToEndConversionRate,

      totals: {
        optimizations:
          totalOptimizations,
        feedback:
          totalFeedback,
        sources:
          totalSources,
        discovery:
          totalDiscoveredPrompts,
        pendingReviews:
          pendingReviewCount,
        corpus:
          totalCorpusPrompts,
        trainingSignals:
          totalTrainingSignals,
      },

      scores: {
        averageOriginalScore,
        averageImprovedScore,
        averageScoreGain,
      },

      sources: {
        total: totalSources,
        active: activeSources,
        paused: pausedSources,
        archived:
          archivedSources,
        scanned:
          scannedSources,
        productive:
          productiveSources,
        averageCredibility,
        averagePromptsPerSource,
        scanningRate:
          sourceScanningRate,
        productiveRate:
          productiveSourceRate,
      },

      discovery: {
        total:
          totalDiscoveredPrompts,
        pending:
          pendingDiscoveredPrompts,
        sentToCuration:
          curationQueueCount,
        enteredCuration:
          enteredCurationCount,
        approved:
          approvedDiscoveredPrompts,
        rejected:
          rejectedDiscoveredPrompts,
        reviewed:
          reviewedDiscoveryCount,
        approvalRate:
          discoveryApprovalRate,
        rejectionRate:
          discoveryRejectionRate,
      },

      curation: {
        pending:
          pendingReviewCount,
        totalReviews:
          totalCurationReviews,
        approvedReviews:
          approvedCurationReviews,
        rejectedReviews:
          rejectedCurationReviews,
        riskyReviews:
          riskyCurationReviews,
      },

      corpus: {
        total:
          totalCorpusPrompts,
      },

      training: {
        totalSignals:
          totalTrainingSignals,
        corpusLinkedSignals:
          corpusLinkedSignalCount,
      },

      pipeline: {
        stages: [
          {
            key: "sources",
            label: "Sources",
            count: totalSources,
          },
          {
            key: "discovery",
            label: "Discovery",
            count:
              totalDiscoveredPrompts,
          },
          {
            key: "curation",
            label: "Curation",
            count:
              enteredCurationCount,
          },
          {
            key: "corpus",
            label: "Corpus",
            count:
              totalCorpusPrompts,
          },
          {
            key: "training",
            label: "Training",
            count:
              corpusLinkedSignalCount,
          },
        ],

        conversions: {
          sourceScanning:
            sourceScanningRate,
          productiveSources:
            productiveSourceRate,
          discoveryToCuration:
            discoveryToCurationRate,
          curationToCorpus:
            curationToCorpusRate,
          corpusToTraining:
            corpusToTrainingRate,
          endToEnd:
            endToEndConversionRate,
        },
      },

      latestOptimizations,
      latestFeedback,

      summary: {
        hasOptimizations:
          totalOptimizations > 0,
        hasFeedback:
          totalFeedback > 0,
        hasSources:
          totalSources > 0,
        hasDiscoveredPrompts:
          totalDiscoveredPrompts >
          0,
        hasPendingReviews:
          pendingReviewCount > 0,
        hasCurationReviews:
          totalCurationReviews > 0,
        hasCorpusPrompts:
          totalCorpusPrompts > 0,
        hasTrainingSignals:
          totalTrainingSignals > 0,
        fullPipelineActive:
          totalSources > 0 &&
          totalDiscoveredPrompts >
            0 &&
          totalCorpusPrompts > 0 &&
          corpusLinkedSignalCount >
            0,
        latestOptimizationCount:
          latestOptimizations.length,
        latestFeedbackCount:
          latestFeedback.length,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/analytics error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong while loading pipeline analytics.",
        storageMode:
          "sqlite_prisma",
      },
      {
        status: 500,
      }
    );
  }
}