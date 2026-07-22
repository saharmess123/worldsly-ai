import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyToken } from "../../../lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wordsly_session")?.value || "";
    const session = verifyToken(token);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Access denied. Authentication required." },
        { status: 401 }
      );
    }

    // Query stats for each stage
    const [
      totalSources,
      activeSources,
      totalDiscovered,
      pendingDiscovered,
      curationQueue,
      approvedDiscovered,
      rejectedDiscovered,
      totalCurationReviews,
      approvedReviews,
      rejectedReviews,
      riskyReviews,
      totalCorpus,
      archivedCorpus,
      totalTrainingSignals,
      allSources,
    ] = await Promise.all([
      prisma.source.count(),
      prisma.source.count({ where: { status: "active" } }),
      prisma.discoveredPrompt.count(),
      prisma.discoveredPrompt.count({ where: { status: "pending" } }),
      prisma.discoveredPrompt.count({ where: { status: "sent_to_curation" } }),
      prisma.discoveredPrompt.count({ where: { status: "approved" } }),
      prisma.discoveredPrompt.count({ where: { status: "rejected" } }),
      prisma.curationReview.count(),
      prisma.curationReview.count({ where: { status: "approved" } }),
      prisma.curationReview.count({ where: { status: "rejected" } }),
      prisma.curationReview.count({ where: { status: "risky" } }),
      prisma.corpusPrompt.count(),
      prisma.corpusPrompt.count({ where: { isArchived: true } }),
      prisma.trainingSignal.count(),
      prisma.source.findMany({ select: { credibilityScore: true } }),
    ]);

    // Calculate averages & rates
    const avgCredibility = allSources.length > 0
      ? Math.round(allSources.reduce((acc, s) => acc + s.credibilityScore, 0) / allSources.length)
      : 0;

    const discoveryToCuration = totalDiscovered > 0
      ? Math.round(((curationQueue + approvedDiscovered + rejectedDiscovered) / totalDiscovered) * 100)
      : 0;

    const curationToCorpus = (approvedDiscovered + rejectedDiscovered) > 0
      ? Math.round((approvedDiscovered / (approvedDiscovered + rejectedDiscovered)) * 100)
      : 0;

    const corpusToTraining = totalCorpus > 0
      ? Math.round((totalTrainingSignals / totalCorpus) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      summary: {
        sources: {
          total: totalSources,
          active: activeSources,
          avgCredibility,
        },
        discovery: {
          total: totalDiscovered,
          pending: pendingDiscovered,
          sentToCuration: curationQueue,
          approved: approvedDiscovered,
          rejected: rejectedDiscovered,
        },
        curation: {
          totalReviews: totalCurationReviews,
          approved: approvedReviews,
          rejected: rejectedReviews,
          risky: riskyReviews,
        },
        corpus: {
          total: totalCorpus,
          active: totalCorpus - archivedCorpus,
          archived: archivedCorpus,
        },
        training: {
          totalSignals: totalTrainingSignals,
        },
      },
      health: {
        status: activeSources > 0 ? "healthy" : "warning",
        message: activeSources > 0 ? "Pipeline is operational and scan-ready." : "No active prompt sources found.",
      },
      conversions: {
        discoveryToCuration,
        curationToCorpus,
        corpusToTraining,
        endToEnd: totalDiscovered > 0 ? Math.round((totalTrainingSignals / totalDiscovered) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Pipeline summary GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load pipeline summary." },
      { status: 500 }
    );
  }
}
