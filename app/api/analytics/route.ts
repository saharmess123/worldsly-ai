import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

function formatOptimizationItem(item: {
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
    storageMode: "sqlite_prisma",
    createdAt: item.createdAt.toLocaleString(),
  };
}

function formatFeedbackItem(item: {
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
}) {
  return {
    id: item.id,
    rating: item.rating,
    originalPrompt: item.originalPrompt,
    improvedPrompt: item.improvedPrompt,
    category: item.category,
    model: item.model,
    goal: item.goal,
    depth: item.depth,
    outputFormat: item.outputFormat,
    engineStatus: item.engineStatus,
    mode: item.engineStatus === "real_ai" ? "real" : "mock",
    aiProvider: item.engineStatus === "real_ai" ? "openai" : "mock",
    storageMode: "sqlite_prisma",
    createdAt: item.createdAt.toLocaleString(),
  };
}

function calculateAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function GET() {
  try {
    const [
      latestOptimizationsRaw,
      latestFeedbackRaw,
      totalOptimizations,
      totalFeedback,
      usefulFeedback,
      needsWorkFeedback,
      allOptimizationScores,
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
    ]);

    const originalScores = allOptimizationScores.map(
      (item) => item.originalScore
    );

    const improvedScores = allOptimizationScores.map(
      (item) => item.improvedScore
    );

    const scoreGains = allOptimizationScores.map(
      (item) => item.improvedScore - item.originalScore
    );

    const averageOriginalScore = calculateAverage(originalScores);
    const averageImprovedScore = calculateAverage(improvedScores);
    const averageScoreGain = calculateAverage(scoreGains);

    const usefulRate =
      totalFeedback === 0
        ? 0
        : Math.round((usefulFeedback / totalFeedback) * 100);

    const latestOptimizations = latestOptimizationsRaw.map(
      formatOptimizationItem
    );

    const latestFeedback = latestFeedbackRaw.map(formatFeedbackItem);

    return NextResponse.json({
      success: true,
      storageMode: "sqlite_prisma",
      message: "Analytics loaded successfully from SQLite using Prisma.",

      totalOptimizations,
      totalFeedback,
      usefulFeedback,
      needsWorkFeedback,
      usefulRate,

      averageOriginalScore,
      averageImprovedScore,
      averageScoreGain,

      totals: {
        totalOptimizations,
        totalFeedback,
        usefulFeedback,
        needsWorkFeedback,
        usefulRate,
      },

      scores: {
        averageOriginalScore,
        averageImprovedScore,
        averageScoreGain,
      },

      latestOptimizations,
      latestFeedback,

      summary: {
        hasOptimizations: totalOptimizations > 0,
        hasFeedback: totalFeedback > 0,
        latestOptimizationCount: latestOptimizations.length,
        latestFeedbackCount: latestFeedback.length,
      },
    });
  } catch (error) {
    console.error("Analytics GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while loading analytics.",
        storageMode: "sqlite_prisma",
      },
      { status: 500 }
    );
  }
}