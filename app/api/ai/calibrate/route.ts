import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

type ScoreBreakdown = {
  clarity: number;
  specificity: number;
  context: number;
  constraints: number;
  outputFormat: number;
};

type EvaluationItem = {
  id: string;
  title: string;
  category: string;
  prompt: string;
  targetScore: number;
  targetBreakdown: ScoreBreakdown;
  difficulty: "Low" | "Medium" | "High";
  criteria: string[];
  notes: string;
};

// Repeatable Golden Evaluation Dataset
const evaluationDataset: EvaluationItem[] = [
  {
    id: "eval-01",
    title: "Short Coding Request (Low Quality)",
    category: "Coding",
    prompt: "write react code for a list",
    targetScore: 28,
    targetBreakdown: {
      clarity: 8,
      specificity: 5,
      context: 5,
      constraints: 5,
      outputFormat: 5,
    },
    difficulty: "Low",
    criteria: [
      "Only specifies a brief request",
      "No programming language version or environment details",
      "No custom features, styling, or error handling mentioned"
    ],
    notes: "Extremely vague prompt that forces the AI to make a large number of layout and framework assumptions."
  },
  {
    id: "eval-02",
    title: "Basic Marketing Query (Medium Quality)",
    category: "Marketing",
    prompt: "Create a marketing campaign for a fitness app targeting busy professionals.",
    targetScore: 58,
    targetBreakdown: {
      clarity: 13,
      specificity: 11,
      context: 12,
      constraints: 11,
      outputFormat: 11,
    },
    difficulty: "Medium",
    criteria: [
      "Specifies product category (fitness app)",
      "Identifies target demographic (busy professionals)",
      "Lacks specific brand constraints, channel selections, or copy length limitations"
    ],
    notes: "A decent high-level campaign template, but lacks explicit guardrails, platforms, and formatting rules."
  },
  {
    id: "eval-03",
    title: "Detailed Expert Specification (High Quality)",
    category: "Coding",
    prompt: "Act as a senior security specialist. Audit this Node.js authentication function for vulnerabilities. Context: The function handles password hashes and user logins. Rules: 1. Identify at least 3 security risks. 2. Offer fixed code. 3. Format output in structured sections.",
    targetScore: 92,
    targetBreakdown: {
      clarity: 19,
      specificity: 18,
      context: 19,
      constraints: 18,
      outputFormat: 18,
    },
    difficulty: "High",
    criteria: [
      "Assigns a clear role (senior security specialist)",
      "Gives precise context about function environment",
      "Lists distinct numbered rules and structural formatting rules"
    ],
    notes: "Highly optimized prompt. Provides comprehensive guidance, structured output keys, and removes ambiguity."
  },
  {
    id: "eval-04",
    title: "Vague Image Prompt (Low Quality)",
    category: "Image Generation",
    prompt: "cool cat in space",
    targetScore: 32,
    targetBreakdown: {
      clarity: 8,
      specificity: 6,
      context: 6,
      constraints: 6,
      outputFormat: 6,
    },
    difficulty: "Low",
    criteria: [
      "Extremely short description",
      "Lacks medium, art style, camera angle, and aspect ratio details",
      "No color palette or lighting parameters specified"
    ],
    notes: "Vague text. Will result in highly unpredictable images depending on the generative model seed."
  },
  {
    id: "eval-05",
    title: "Detailed Scene Prompt (High Quality)",
    category: "Image Generation",
    prompt: "A realistic portrait of a detective cat in a futuristic cyberpunk alley. Style: cinematic lighting, natural neon reflections, shot on 35mm lens, high fidelity textures. Avoid: blurry, low quality elements, cartoon features.",
    targetScore: 90,
    targetBreakdown: {
      clarity: 18,
      specificity: 18,
      context: 18,
      constraints: 18,
      outputFormat: 18,
    },
    difficulty: "High",
    criteria: [
      "Clearly describes subject and cinematic cyberpunk alley background",
      "Specifies precise lighting and camera lens details (35mm, neon reflections)",
      "Employs negative prompt guidelines to exclude blur and low quality"
    ],
    notes: "High quality prompt. Captures style, camera perspective, lighting, and negative exclusions for professional image gen."
  },
  {
    id: "eval-06",
    title: "Vague General Request (Low Quality)",
    category: "General",
    prompt: "make a presentation about space",
    targetScore: 22,
    targetBreakdown: {
      clarity: 6,
      specificity: 4,
      context: 4,
      constraints: 4,
      outputFormat: 4,
    },
    difficulty: "Low",
    criteria: [
      "Extremely brief single sentence",
      "No audience, depth, or formatting guidelines",
      "Lacks slide-by-slide structure rules"
    ],
    notes: "Requires the model to guess everything. Lacks purpose, context, and structural limits."
  },
  {
    id: "eval-07",
    title: "Structured Academic Summary (Medium Quality)",
    category: "Research",
    prompt: "Summarize the attached research paper on artificial neural networks. The summary should focus on the history, architectures, and main challenges. Keep it accurate and neutral.",
    targetScore: 68,
    targetBreakdown: {
      clarity: 15,
      specificity: 13,
      context: 14,
      constraints: 13,
      outputFormat: 13,
    },
    difficulty: "Medium",
    criteria: [
      "States task goal (summarize a research paper)",
      "Outlines the primary summary focus points (history, architecture, challenges)",
      "Lacks specific constraints on length, key terms, or section structures"
    ],
    notes: "Clear objectives, but benefits from layout rules, target word counts, and language rules."
  },
  {
    id: "eval-08",
    title: "Autonomous Agent Workflow (High Quality)",
    category: "Agents",
    prompt: "You are an autonomous customer support agent. Your goal is to resolve billing complaints. Available tools: search_invoices(id), refund_transaction(id). Process: 1. Fetch the invoice history. 2. Verify the charge date. 3. If within 30 days, refund the transaction. Otherwise, explain the policy. Rules: NEVER refund more than $100. Format the response as JSON with keys 'action_taken' and 'response_text'.",
    targetScore: 95,
    targetBreakdown: {
      clarity: 20,
      specificity: 19,
      context: 19,
      constraints: 19,
      outputFormat: 18,
    },
    difficulty: "High",
    criteria: [
      "Specifies precise role and list of available tools",
      "Enforces a rigid step-by-step logic workflow",
      "Defines clear boundary rules ($100 cap) and strict JSON output schema formatting"
    ],
    notes: "Outstanding systems engineering prompt. Leaves zero room for model deviation and ensures predictable JSON returns."
  }
];

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

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    const results = [];
    let totalScoreDeviation = 0;

    for (const item of evaluationDataset) {
      let calculatedScore = 0;
      let calculatedBreakdown: ScoreBreakdown = {
        clarity: 0,
        specificity: 0,
        context: 0,
        constraints: 0,
        outputFormat: 0,
      };
      let mode = "fallback";

      try {
        // Trigger real scoring endpoint internally or via http fetch
        const res = await fetch(`${protocol}://${host}/api/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: item.prompt,
            category: item.category,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          calculatedScore = data.score || 0;
          calculatedBreakdown = data.breakdown || calculatedBreakdown;
          mode = data.scoringMode || "rules";
        }
      } catch (err) {
        console.warn(`Scoring failed during calibration run for prompt ${item.id}`, err);
      }

      const scoreDeviation = calculatedScore - item.targetScore;
      totalScoreDeviation += Math.abs(scoreDeviation);

      // Metric deviations
      const clarityDev = calculatedBreakdown.clarity - item.targetBreakdown.clarity;
      const specificityDev = calculatedBreakdown.specificity - item.targetBreakdown.specificity;
      const contextDev = calculatedBreakdown.context - item.targetBreakdown.context;
      const constraintsDev = calculatedBreakdown.constraints - item.targetBreakdown.constraints;
      const outputFormatDev = calculatedBreakdown.outputFormat - item.targetBreakdown.outputFormat;

      results.push({
        id: item.id,
        title: item.title,
        prompt: item.prompt,
        targetScore: item.targetScore,
        calculatedScore,
        scoreDeviation,
        mode,
        breakdown: {
          target: item.targetBreakdown,
          calculated: calculatedBreakdown,
          deviations: {
            clarity: clarityDev,
            specificity: specificityDev,
            context: contextDev,
            constraints: constraintsDev,
            outputFormat: outputFormatDev,
          },
        },
      });
    }

    const meanAbsoluteError = Math.round((totalScoreDeviation / evaluationDataset.length) * 10) / 10;

    let status = "Miscalibrated";
    let statusColor = "text-red-500 border-red-500/20 bg-red-500/10";
    if (meanAbsoluteError <= 8) {
      status = "Well Calibrated";
      statusColor = "text-emerald-500 border-emerald-500/20 bg-emerald-500/10";
    } else if (meanAbsoluteError <= 15) {
      status = "Slightly Misaligned";
      statusColor = "text-amber-500 border-amber-500/20 bg-amber-500/10";
    }

    // Save calibration run and results directly to SQLite database using Prisma
    let dbRunId = null;
    try {
      const dbRun = await prisma.evaluationRun.create({
        data: {
          meanAbsoluteError,
          status,
          testedCount: evaluationDataset.length,
          runType: "quality_calibration",
          provider: results.map((r) => r.mode).includes("openai") ? "openai" : "mixed",
          results: {
            create: results.map((run) => ({
              promptTitle: run.title,
              promptContent: run.prompt,
              targetScore: run.targetScore,
              calculatedScore: run.calculatedScore,
              scoreDeviation: run.scoreDeviation,
              scoringMode: run.mode,
              clarityTarget: run.breakdown.target.clarity,
              clarityCalculated: run.breakdown.calculated.clarity,
              specificityTarget: run.breakdown.target.specificity,
              specificityCalculated: run.breakdown.calculated.specificity,
              contextTarget: run.breakdown.target.context,
              contextCalculated: run.breakdown.calculated.context,
              constraintsTarget: run.breakdown.target.constraints,
              constraintsCalculated: run.breakdown.calculated.constraints,
              outputFormatTarget: run.breakdown.target.outputFormat,
              outputFormatCalculated: run.breakdown.calculated.outputFormat,
            })),
          },
        },
      });
      dbRunId = dbRun.id;
    } catch (err) {
      console.error("Failed to save evaluation run to SQLite:", err);
    }

    return NextResponse.json({
      success: true,
      meanAbsoluteError,
      status,
      statusColor,
      testedCount: evaluationDataset.length,
      runs: results,
      evaluationRunId: dbRunId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI calibration engine error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Calibration run failed: " + message },
      { status: 500 }
    );
  }
}
