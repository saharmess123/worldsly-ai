import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  forbidden,
  internalServerError,
} from "../../../lib/api-response";
import { verifyToken } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

type StageStatus =
  | "healthy"
  | "attention"
  | "blocked"
  | "empty";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("wordsly_session")?.value || "";
  const session = verifyToken(token);

  return session?.role === "admin";
}

function calculateRate(
  numerator: number,
  denominator: number,
): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (numerator / denominator) * 100,
      ),
    ),
  );
}

export async function GET() {
  try {
    const isAdmin = await requireAdmin();

    if (!isAdmin) {
      return forbidden();
    }

    const [
      totalSources,
      activeSources,
      scannedSources,
      totalDiscovery,
      pendingDiscovery,
      curationQueue,
      approvedDiscovery,
      rejectedDiscovery,
      totalReviews,
      approvedReviews,
      riskyReviews,
      totalCorpus,
      totalTrainingSignals,
      corpusLinkedSignals,
    ] = await Promise.all([
      prisma.source.count(),

      prisma.source.count({
        where: {
          status: "active",
        },
      }),

      prisma.source.count({
        where: {
          lastScanAt: {
            not: null,
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
          status: "sent_to_curation",
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
          status: "risky",
        },
      }),

      prisma.corpusPrompt.count(),

      prisma.trainingSignal.count(),

      prisma.trainingSignal.count({
        where: {
          sourceType: "corpus",
          corpusId: {
            not: null,
          },
        },
      }),
    ]);

    const reviewedDiscovery =
      approvedDiscovery + rejectedDiscovery;

    const enteredCuration =
      curationQueue + reviewedDiscovery;

    const warnings: string[] = [];

    if (totalSources === 0) {
      warnings.push(
        "No sources are configured.",
      );
    } else if (activeSources === 0) {
      warnings.push(
        "No active sources are available for scanning.",
      );
    }

    if (
      activeSources > 0 &&
      scannedSources === 0
    ) {
      warnings.push(
        "Active sources exist, but none have been scanned.",
      );
    }

    if (
      scannedSources > 0 &&
      totalDiscovery === 0
    ) {
      warnings.push(
        "Sources were scanned, but no prompts were discovered.",
      );
    }

    if (curationQueue > 0) {
      warnings.push(
        `${curationQueue} prompt(s) are waiting for human review.`,
      );
    }

    if (
      approvedReviews > 0 &&
      totalCorpus === 0
    ) {
      warnings.push(
        "Approved reviews exist, but the Corpus is empty.",
      );
    }

    if (
      totalCorpus > 0 &&
      corpusLinkedSignals < totalCorpus
    ) {
      warnings.push(
        "Some Corpus prompts do not yet have linked Training Signals.",
      );
    }

    if (riskyReviews > 0) {
      warnings.push(
        `${riskyReviews} risky review(s) require attention.`,
      );
    }

    const sourceStatus: StageStatus =
      totalSources === 0
        ? "empty"
        : activeSources === 0 ||
            scannedSources === 0
          ? "attention"
          : "healthy";

    const discoveryStatus: StageStatus =
      totalDiscovery === 0
        ? scannedSources > 0
          ? "blocked"
          : "empty"
        : "healthy";

    const curationStatus: StageStatus =
      enteredCuration === 0
        ? "empty"
        : riskyReviews > 0 ||
            curationQueue > 0
          ? "attention"
          : "healthy";

    const corpusStatus: StageStatus =
      totalCorpus === 0
        ? approvedReviews > 0
          ? "blocked"
          : "empty"
        : "healthy";

    const trainingStatus: StageStatus =
      totalTrainingSignals === 0
        ? totalCorpus > 0
          ? "blocked"
          : "empty"
        : corpusLinkedSignals < totalCorpus
          ? "attention"
          : "healthy";

    const stageStatuses = [
      sourceStatus,
      discoveryStatus,
      curationStatus,
      corpusStatus,
      trainingStatus,
    ];

    let overallStatus: StageStatus =
      "healthy";

    if (
      stageStatuses.includes("blocked")
    ) {
      overallStatus = "blocked";
    } else if (
      stageStatuses.includes("attention")
    ) {
      overallStatus = "attention";
    } else if (
      stageStatuses.every(
        (status) => status === "empty",
      )
    ) {
      overallStatus = "empty";
    }

    const stages = [
      {
        key: "sources",
        label: "Sources",
        route: "/sources",
        count: totalSources,
        status: sourceStatus,
        details: {
          active: activeSources,
          scanned: scannedSources,
        },
      },
      {
        key: "discovery",
        label: "Discovery",
        route: "/discovery",
        count: totalDiscovery,
        status: discoveryStatus,
        details: {
          pending: pendingDiscovery,
          sentToCuration: curationQueue,
          approved: approvedDiscovery,
          rejected: rejectedDiscovery,
        },
      },
      {
        key: "curation",
        label: "Curation",
        route: "/curation",
        count: enteredCuration,
        status: curationStatus,
        details: {
          queue: curationQueue,
          totalReviews,
          approvedReviews,
          riskyReviews,
        },
      },
      {
        key: "corpus",
        label: "Corpus",
        route: "/corpus",
        count: totalCorpus,
        status: corpusStatus,
        details: {
          approvedReviews,
        },
      },
      {
        key: "training",
        label: "Training Signals",
        route: "/training",
        count: totalTrainingSignals,
        status: trainingStatus,
        details: {
          corpusLinkedSignals,
        },
      },
    ];

    return NextResponse.json({
      success: true,
      overallStatus,
      warnings,
      summary: {
        healthyStages:
          stageStatuses.filter(
            (status) =>
              status === "healthy",
          ).length,
        attentionStages:
          stageStatuses.filter(
            (status) =>
              status === "attention",
          ).length,
        blockedStages:
          stageStatuses.filter(
            (status) =>
              status === "blocked",
          ).length,
        emptyStages:
          stageStatuses.filter(
            (status) =>
              status === "empty",
          ).length,
        totalWarnings:
          warnings.length,
        fullPipelineActive:
          totalSources > 0 &&
          totalDiscovery > 0 &&
          totalCorpus > 0 &&
          corpusLinkedSignals > 0,
      },
      conversions: {
        sourceScanning:
          calculateRate(
            scannedSources,
            totalSources,
          ),
        discoveryToCuration:
          calculateRate(
            enteredCuration,
            totalDiscovery,
          ),
        curationToCorpus:
          calculateRate(
            totalCorpus,
            reviewedDiscovery,
          ),
        corpusToTraining:
          calculateRate(
            corpusLinkedSignals,
            totalCorpus,
          ),
        endToEnd:
          calculateRate(
            corpusLinkedSignals,
            totalDiscovery,
          ),
      },
      stages,
      generatedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Pipeline health GET error:",
      error,
    );

    return internalServerError(
      "Something went wrong while checking pipeline health.",
    );
  }
}
