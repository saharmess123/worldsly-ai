import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sourceType = url.searchParams.get("sourceType");
    const signalType = url.searchParams.get("signalType");
    const minScore = url.searchParams.get("minScore");

    const where: any = {};
    if (sourceType && sourceType !== "All") {
      where.sourceType = sourceType;
    }
    if (signalType && signalType !== "All") {
      where.signalType = signalType;
    }
    if (minScore) {
      where.score = { gte: Number(minScore) };
    }

    const signals = await prisma.trainingSignal.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        corpus: true,
      },
    });

    const formatted = signals.map((s) => {
      let metadataObj = {};
      try {
        metadataObj = s.metadata ? JSON.parse(s.metadata) : {};
      } catch {
        // Fallback
      }
      return {
        id: s.id,
        sourceType: s.sourceType,
        sourceId: s.sourceId,
        corpusId: s.corpusId,
        signalType: s.signalType,
        score: s.score,
        metadata: metadataObj,
        createdAt: s.createdAt,
        corpus: s.corpus ? { title: s.corpus.title } : null,
      };
    });

    return NextResponse.json({
      success: true,
      items: formatted,
    });
  } catch (error: any) {
    console.error("Training signals GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch training signals: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // 1. Process feedback records
    const feedbacks = await prisma.feedback.findMany();
    let feedbackCreated = 0;

    for (const f of feedbacks) {
      const existing = await prisma.trainingSignal.findFirst({
        where: {
          sourceType: "feedback",
          sourceId: f.id,
        },
      });

      if (!existing) {
        await prisma.trainingSignal.create({
          data: {
            sourceType: "feedback",
            sourceId: f.id,
            signalType: "preference",
            score: f.rating === "useful" ? 100 : 0,
            metadata: JSON.stringify({
              rating: f.rating,
              originalPrompt: f.originalPrompt,
              improvedPrompt: f.improvedPrompt,
              category: f.category,
              model: f.model,
            }),
          },
        });
        feedbackCreated++;
      }
    }

    // 2. Process optimization history
    const optimizations = await prisma.optimization.findMany();
    let optimizationsCreated = 0;

    for (const opt of optimizations) {
      const existing = await prisma.trainingSignal.findFirst({
        where: {
          sourceType: "history",
          sourceId: opt.id,
        },
      });

      if (!existing) {
        await prisma.trainingSignal.create({
          data: {
            sourceType: "history",
            sourceId: opt.id,
            signalType: "demonstration",
            score: opt.improvedScore,
            metadata: JSON.stringify({
              originalPrompt: opt.originalPrompt,
              improvedPrompt: opt.improvedPrompt,
              category: opt.category,
              model: opt.model,
              originalScore: opt.originalScore,
              improvedScore: opt.improvedScore,
            }),
          },
        });
        optimizationsCreated++;
      }
    }

    // 3. Process corpus prompts
    const corpusPrompts = await prisma.corpusPrompt.findMany();
    let corpusCreated = 0;

    for (const cp of corpusPrompts) {
      const existing = await prisma.trainingSignal.findFirst({
        where: {
          sourceType: "corpus",
          corpusId: cp.id,
        },
      });

      if (!existing) {
        await prisma.trainingSignal.create({
          data: {
            sourceType: "corpus",
            corpusId: cp.id,
            signalType: "curated",
            score: cp.qualityScore,
            metadata: JSON.stringify({
              title: cp.title,
              prompt: cp.prompt,
              improvedVersion: cp.improvedVersion,
              category: cp.category,
              model: cp.model,
            }),
          },
        });
        corpusCreated++;
      }
    }

    const total = feedbackCreated + optimizationsCreated + corpusCreated;
    return NextResponse.json({
      success: true,
      message: `Generated ${total} training signals successfully.`,
      details: {
        feedbackSignals: feedbackCreated,
        optimizationSignals: optimizationsCreated,
        corpusSignals: corpusCreated,
      },
    });
  } catch (error: any) {
    console.error("Training signals POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate training signals: " + error.message },
      { status: 500 }
    );
  }
}
