import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyToken } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wordsly_session")?.value || "";
    const session = verifyToken(token);

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action parameter is required." },
        { status: 400 }
      );
    }

    if (action === "trigger-scan") {
      // 1. Get all active sources
      const activeSources = await prisma.source.findMany({
        where: { status: "active" },
      });

      if (activeSources.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Scan completed. No active sources found to scan.",
          scannedSources: 0,
          addedPrompts: 0,
        });
      }

      // Update lastScanAt timestamp for all active sources
      const now = new Date();
      await prisma.source.updateMany({
        where: { status: "active" },
        data: { lastScanAt: now },
      });

      // Simulate discovering a new prompt for each active source
      let addedPrompts = 0;
      for (const source of activeSources) {
        const title = `Scan Discovered - ${source.name} Prompt`;
        const existing = await prisma.discoveredPrompt.findFirst({
          where: { title },
        });

        if (!existing) {
          await prisma.discoveredPrompt.create({
            data: {
              sourceId: source.id,
              title,
              prompt: `Act as a specialized assistant for ${source.name}. Analyze inputs and deliver optimized outputs structure.`,
              category: "General",
              model: "General",
              qualityScore: Math.floor(Math.random() * 20) + 75, // score between 75 and 95
              status: "pending",
            },
          });
          addedPrompts++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Triggered scanning for ${activeSources.length} sources. Discovered ${addedPrompts} new prompts.`,
        scannedSources: activeSources.length,
        addedPrompts,
      });
    }

    if (action === "flush-curation") {
      // 2. Fetch pending curation items (status: "sent_to_curation")
      const pendingReviews = await prisma.discoveredPrompt.findMany({
        where: { status: "sent_to_curation" },
      });

      if (pendingReviews.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Curation flush completed. Curation queue is empty.",
          processed: 0,
          approved: 0,
        });
      }

      let approvedCount = 0;
      let rejectedCount = 0;

      for (const prompt of pendingReviews) {
        const reviewStatus = prompt.qualityScore >= 80 ? "approved" : "rejected";
        
        // Create curation review record
        await prisma.curationReview.create({
          data: {
            discoveredPromptId: prompt.id,
            status: reviewStatus,
            reviewerId: session.userId,
            riskLevel: prompt.qualityScore >= 90 ? "low" : "medium",
            reviewReason: `Automated curation flush: score is ${prompt.qualityScore}`,
          },
        });

        // Update discovered prompt status
        await prisma.discoveredPrompt.update({
          where: { id: prompt.id },
          data: { status: reviewStatus },
        });

        if (reviewStatus === "approved") {
          approvedCount++;
          // Add to corpus
          await prisma.corpusPrompt.create({
            data: {
              discoveredPromptId: prompt.id,
              title: prompt.title,
              prompt: prompt.prompt,
              category: prompt.category,
              model: prompt.model,
              qualityScore: prompt.qualityScore,
              patterns: "[]",
              version: 1,
              isArchived: false,
            },
          });
        } else {
          rejectedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Flushed curation queue. Processed ${pendingReviews.length} prompts: ${approvedCount} approved, ${rejectedCount} rejected.`,
        processed: pendingReviews.length,
        approved: approvedCount,
      });
    }

    if (action === "generate-signals") {
      // 3. Find corpus items that don't have training signals
      const corpusItems = await prisma.corpusPrompt.findMany({
        include: { trainingSignals: true },
      });

      const unstagedItems = corpusItems.filter(item => item.trainingSignals.length === 0);

      if (unstagedItems.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Training dataset is fully sync'd. No new signals needed.",
          generated: 0,
        });
      }

      let generatedCount = 0;
      for (const item of unstagedItems) {
        await prisma.trainingSignal.create({
          data: {
            deduplicationKey: `sig-${item.id}`,
            sourceType: "corpus",
            corpusId: item.id,
            signalType: "curated_learning",
            score: item.qualityScore,
            metadata: JSON.stringify({ version: item.version, title: item.title }),
          },
        });
        generatedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Dataset sync complete. Generated ${generatedCount} new learning signals from approved corpus items.`,
        generated: generatedCount,
      });
    }

    if (action === "purge-archived") {
      // 4. Purge archived corpus prompts
      const archivedItems = await prisma.corpusPrompt.findMany({
        where: { isArchived: true },
      });

      if (archivedItems.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Purge complete. No archived corpus items found.",
          purged: 0,
        });
      }

      const ids = archivedItems.map(p => p.id);
      
      // Delete any associated training signals first
      await prisma.trainingSignal.deleteMany({
        where: { corpusId: { in: ids } },
      });

      const result = await prisma.corpusPrompt.deleteMany({
        where: { isArchived: true },
      });

      return NextResponse.json({
        success: true,
        message: `Database purged. Deleted ${result.count} archived corpus prompts and their matching learning signals.`,
        purged: result.count,
      });
    }

    return NextResponse.json(
      { success: false, error: `Action '${action}' is not supported.` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Pipeline action POST error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to perform admin pipeline action: " + message },
      { status: 500 }
    );
  }
}
