import { NextResponse } from "next/server";

type ScoreRequest = {
  prompt?: string;
  category?: string;
};

function normalizePrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ");
}

function hasAny(text: string, keywords: string[]) {
  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword));
}

function calculatePromptScore(prompt: string, category = "General") {
  const cleanPrompt = normalizePrompt(prompt);
  const lowerPrompt = cleanPrompt.toLowerCase();

  if (!cleanPrompt) return 0;

  let score = 20;

  if (cleanPrompt.length > 40) score += 8;
  if (cleanPrompt.length > 90) score += 8;
  if (cleanPrompt.length > 160) score += 8;
  if (cleanPrompt.length > 280) score += 6;

  if (hasAny(lowerPrompt, ["act as", "you are", "role"])) score += 8;
  if (hasAny(lowerPrompt, ["goal", "objective", "task", "purpose"])) score += 7;
  if (hasAny(lowerPrompt, ["context", "background", "audience"])) score += 7;
  if (hasAny(lowerPrompt, ["format", "structure", "sections", "table"])) score += 8;
  if (hasAny(lowerPrompt, ["example", "examples", "sample"])) score += 7;
  if (hasAny(lowerPrompt, ["step", "steps", "process", "workflow"])) score += 7;
  if (hasAny(lowerPrompt, ["tone", "style", "voice"])) score += 6;
  if (hasAny(lowerPrompt, ["constraints", "rules", "avoid, must"])) score += 8;
  if (hasAny(lowerPrompt, ["specific", "detailed", "clear", "professional"])) score += 5;

  if (category === "Image Generation") {
    if (hasAny(lowerPrompt, ["lighting", "composition", "style", "camera"])) score += 8;
    if (hasAny(lowerPrompt, ["background", "colors", "neon", "cinematic"])) score += 6;
    if (hasAny(lowerPrompt, ["negative prompt", "avoid", "no blurry"])) score += 8;
  }

  return Math.min(score, 100);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScoreRequest;

    const prompt = normalizePrompt(body.prompt || "");
    const category = body.category || "General";

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 }
      );
    }

    const score = calculatePromptScore(prompt, category);

    return NextResponse.json({
      score,
      category,
      scoringMode: "mock_rule_based",
      notes: [
        "Score is calculated out of 100.",
        "This mock score checks clarity, length, structure, context, constraints, and use-case-specific signals.",
        "Later this can be replaced with AI-based evaluation.",
      ],
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while scoring the prompt." },
      { status: 500 }
    );
  }
}