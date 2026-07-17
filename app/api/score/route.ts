import { NextResponse } from "next/server";
import {
  buildScorerSystemPrompt,
  buildScorerUserPrompt,
} from "../../lib/ai/prompts";
import { generateWithAIRuntime } from "../../lib/ai/runtime";

type ScoreRequest = {
  prompt?: string;
  category?: string;
};

type ScoreBreakdown = {
  clarity: number;
  specificity: number;
  context: number;
  constraints: number;
  outputFormat: number;
};

type ScoringMode =
  | "mock_rule_based"
  | "real_ai_scorer"
  | "local_ai_scorer";

function normalizePrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ");
}

function hasAny(text: string, keywords: string[]) {
  const lowerText = text.toLowerCase();

  return keywords.some((keyword) =>
    lowerText.includes(keyword),
  );
}

function calculatePromptScore(
  prompt: string,
  category = "General",
) {
  const cleanPrompt = normalizePrompt(prompt);
  const lowerPrompt = cleanPrompt.toLowerCase();

  if (!cleanPrompt) {
    return 0;
  }

  let score = 20;

  if (cleanPrompt.length > 40) score += 8;
  if (cleanPrompt.length > 90) score += 8;
  if (cleanPrompt.length > 160) score += 8;
  if (cleanPrompt.length > 280) score += 6;

  if (hasAny(lowerPrompt, ["act as", "you are", "role"])) {
    score += 8;
  }

  if (
    hasAny(lowerPrompt, [
      "goal",
      "objective",
      "task",
      "purpose",
    ])
  ) {
    score += 7;
  }

  if (
    hasAny(lowerPrompt, [
      "context",
      "background",
      "audience",
    ])
  ) {
    score += 7;
  }

  if (
    hasAny(lowerPrompt, [
      "format",
      "structure",
      "sections",
      "table",
    ])
  ) {
    score += 8;
  }

  if (
    hasAny(lowerPrompt, [
      "example",
      "examples",
      "sample",
    ])
  ) {
    score += 7;
  }

  if (
    hasAny(lowerPrompt, [
      "step",
      "steps",
      "process",
      "workflow",
    ])
  ) {
    score += 7;
  }

  if (hasAny(lowerPrompt, ["tone", "style", "voice"])) {
    score += 6;
  }

  if (
    hasAny(lowerPrompt, [
      "constraints",
      "rules",
      "avoid",
      "must",
    ])
  ) {
    score += 8;
  }

  if (
    hasAny(lowerPrompt, [
      "specific",
      "detailed",
      "clear",
      "professional",
    ])
  ) {
    score += 5;
  }

  if (category === "Image Generation") {
    if (
      hasAny(lowerPrompt, [
        "lighting",
        "composition",
        "style",
        "camera",
      ])
    ) {
      score += 8;
    }

    if (
      hasAny(lowerPrompt, [
        "background",
        "colors",
        "neon",
        "cinematic",
      ])
    ) {
      score += 6;
    }

    if (
      hasAny(lowerPrompt, [
        "negative prompt",
        "avoid",
        "no blurry",
      ])
    ) {
      score += 8;
    }
  }

  return Math.min(score, 100);
}

function createFallbackBreakdown(
  score: number,
): ScoreBreakdown {
  return {
    clarity: score >= 80 ? 18 : score >= 50 ? 12 : 8,
    specificity:
      score >= 80 ? 18 : score >= 50 ? 12 : 8,
    context: score >= 80 ? 16 : score >= 50 ? 10 : 6,
    constraints:
      score >= 80 ? 17 : score >= 50 ? 11 : 7,
    outputFormat:
      score >= 80 ? 16 : score >= 50 ? 10 : 6,
  };
}

function parseAIJson(
  content: string,
): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeBreakdownValue(
  value: unknown,
  fallback: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(0, Math.min(20, value));
}

function mergeBreakdown(
  value: unknown,
  fallback: ScoreBreakdown,
): ScoreBreakdown {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return fallback;
  }

  const breakdown = value as Record<string, unknown>;

  return {
    clarity: normalizeBreakdownValue(
      breakdown.clarity,
      fallback.clarity,
    ),
    specificity: normalizeBreakdownValue(
      breakdown.specificity,
      fallback.specificity,
    ),
    context: normalizeBreakdownValue(
      breakdown.context,
      fallback.context,
    ),
    constraints: normalizeBreakdownValue(
      breakdown.constraints,
      fallback.constraints,
    ),
    outputFormat: normalizeBreakdownValue(
      breakdown.outputFormat,
      fallback.outputFormat,
    ),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScoreRequest;

    const prompt = normalizePrompt(body.prompt || "");
    const category = body.category || "General";

    if (!prompt) {
      return NextResponse.json(
        {
          error: "Prompt is required.",
        },
        {
          status: 400,
        },
      );
    }

    let score = calculatePromptScore(prompt, category);

    let reasoning =
      "This fallback rule-based score checks clarity, length, structure, context, constraints, and use-case-specific signals.";

    let breakdown = createFallbackBreakdown(score);

    let scoringMode: ScoringMode =
      "mock_rule_based";

    let aiProvider: "mock" | "ollama" | "openai" | null =
      null;

    let aiModel: string | null = null;

    let aiError = "";

    const aiResponse = await generateWithAIRuntime({
      messages: [
        {
          role: "system",
          content: buildScorerSystemPrompt(),
        },
        {
          role: "user",
          content: buildScorerUserPrompt(
            prompt,
            category,
          ),
        },
      ],
      temperature: 0.2,
    });

    aiProvider = aiResponse.provider;
    aiModel = aiResponse.model;

    if (aiResponse.success) {
      const parsed = parseAIJson(aiResponse.content);
      const parsedScore = parsed?.score;

      if (
        typeof parsedScore === "number" &&
        Number.isFinite(parsedScore)
      ) {
        score = Math.max(
          0,
          Math.min(100, parsedScore),
        );

        breakdown = mergeBreakdown(
          parsed?.breakdown,
          breakdown,
        );

        if (typeof parsed?.reasoning === "string") {
          reasoning = parsed.reasoning.trim() || reasoning;
        }

        scoringMode =
          aiResponse.provider === "ollama"
            ? "local_ai_scorer"
            : aiResponse.provider === "openai"
              ? "real_ai_scorer"
              : "mock_rule_based";
      } else {
        aiError =
          "AI returned an invalid scoring response.";
      }
    } else {
      aiError =
        aiResponse.error || "AI scoring failed.";
    }

    return NextResponse.json({
      score,
      category,
      scoringMode,
      aiProvider,
      aiModel,
      aiError,
      breakdown,
      reasoning,
      notes: [
        "Score is calculated out of 100.",
        scoringMode === "real_ai_scorer"
          ? `Scored dynamically using OpenAI model ${aiModel}.`
          : scoringMode === "local_ai_scorer"
            ? `Scored dynamically using local Ollama model ${aiModel}.`
            : "Rule-based scoring is active because a valid AI scoring result was not available.",
      ],
    });
  } catch (error) {
    console.error("Scoring handler error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while scoring the prompt.",
      },
      {
        status: 500,
      },
    );
  }
}