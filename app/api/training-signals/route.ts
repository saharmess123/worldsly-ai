import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../lib/prisma";

export async function GET(request: Request) {
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
    const sourceType = url.searchParams.get("sourceType");
    const signalType = url.searchParams.get("signalType");
    const minScore = url.searchParams.get("minScore");

    const where: {
      sourceType?: string;
      signalType?: string;
      score?: { gte: number };
    } = {};

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

    const seenPairs = new Set<string>();

    const formatted = signals.map((s) => {
      let metadataObj: {
        originalPrompt?: string;
        improvedPrompt?: string;
        prompt?: string;
        improvedVersion?: string;
        category?: string;
        [key: string]: unknown;
      } = {};

      try {
        metadataObj = s.metadata ? JSON.parse(s.metadata) : {};
      } catch {
        // Fallback
      }

      // 1. Generate training pairs (input / output)
      let input = "";
      let output = "";
      let categoryVal = "General";

      if (s.sourceType === "feedback") {
        input = metadataObj.originalPrompt || "";
        output = metadataObj.improvedPrompt || "";
        categoryVal = metadataObj.category || "General";
      } else if (s.sourceType === "history") {
        input = metadataObj.originalPrompt || "";
        output = metadataObj.improvedPrompt || "";
        categoryVal = metadataObj.category || "General";
      } else if (s.sourceType === "corpus") {
        input = metadataObj.prompt || s.corpus?.prompt || "";
        output = metadataObj.improvedVersion || s.corpus?.improvedVersion || "";
        categoryVal = metadataObj.category || s.corpus?.category || "General";
      }

      const cleanInput = input.trim();
      const cleanOutput = output.trim();

      // 2. Add dataset validation
      let isValid = true;
      let validationError: string | null = null;

      if (!cleanInput) {
        isValid = false;
        validationError = "Empty original prompt (input)";
      } else if (!cleanOutput) {
        isValid = false;
        validationError = "Empty optimized prompt (output)";
      } else if (cleanInput === cleanOutput) {
        isValid = false;
        validationError = "Original and optimized prompts are identical";
      }

      // 3. Prevent duplicates (deduplication check)
      let isDuplicate = false;
      if (isValid) {
        const pairKey = `${cleanInput}|||${cleanOutput}`;
        if (seenPairs.has(pairKey)) {
          isDuplicate = true;
        } else {
          seenPairs.add(pairKey);
        }
      }

      return {
        id: s.id,
        sourceType: s.sourceType,
        sourceId: s.sourceId,
        corpusId: s.corpusId,
        signalType: s.signalType,
        score: s.score,
        createdAt: s.createdAt,
        input: cleanInput,
        output: cleanOutput,
        category: categoryVal,
        isValid,
        validationError,
        isDuplicate,
        metadata: metadataObj,
      };
    });

    // Calculate quality metrics
    let totalRecords = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    let duplicateRecords = 0;

    formatted.forEach((item) => {
      totalRecords++;
      if (!item.isValid) {
        invalidRecords++;
      } else if (item.isDuplicate) {
        duplicateRecords++;
      } else {
        validRecords++;
      }
    });

    return NextResponse.json({
      success: true,
      items: formatted,
      summary: {
        totalRecords,
        validRecords,
        invalidRecords,
        duplicateRecords,
      },
    });
  } catch (error) {
    console.error("Training signals GET error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch training signals: " + message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("wordsly_user_role")?.value || "admin";
    if (role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }
    // Retrieve all existing training signals to seed the duplicate checking cache
    const existingSignals = await prisma.trainingSignal.findMany();
    const seenPairKeys = new Set<string>();

    existingSignals.forEach((es) => {
      try {
        const meta: {
          originalPrompt?: string;
          prompt?: string;
          improvedPrompt?: string;
          improvedVersion?: string;
        } = es.metadata ? JSON.parse(es.metadata) : {};

        const inp = (meta.originalPrompt || meta.prompt || "").trim();
        const out = (meta.improvedPrompt || meta.improvedVersion || "").trim();
        if (inp && out) {
          seenPairKeys.add(`${inp}|||${out}`);
        }
      } catch {
        // ignore
      }
    });

    // 1. Process feedback records
    const feedbacks = await prisma.feedback.findMany();
    let feedbackCreated = 0;

    for (const f of feedbacks) {
      // Base deduplication on source table ID
      const existing = await prisma.trainingSignal.findFirst({
        where: {
          sourceType: "feedback",
          sourceId: f.id,
        },
      });

      if (!existing) {
        const cleanOrig = f.originalPrompt.trim();
        const cleanImp = f.improvedPrompt.trim();
        const pairKey = `${cleanOrig}|||${cleanImp}`;

        // Skip if this exact training pair already exists in the cache
        if (!seenPairKeys.has(pairKey)) {
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
          seenPairKeys.add(pairKey);
          feedbackCreated++;
        }
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
        const cleanOrig = opt.originalPrompt.trim();
        const cleanImp = opt.improvedPrompt.trim();
        const pairKey = `${cleanOrig}|||${cleanImp}`;

        if (!seenPairKeys.has(pairKey)) {
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
          seenPairKeys.add(pairKey);
          optimizationsCreated++;
        }
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
        const cleanOrig = cp.prompt.trim();
        const cleanImp = (cp.improvedVersion || "").trim();
        const pairKey = `${cleanOrig}|||${cleanImp}`;

        if (!seenPairKeys.has(pairKey)) {
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
          seenPairKeys.add(pairKey);
          corpusCreated++;
        }
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
  } catch (error) {
    console.error("Training signals POST error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to generate training signals: " + message },
      { status: 500 }
    );
  }
}
