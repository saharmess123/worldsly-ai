import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildScorerSystemPrompt, buildScorerUserPrompt } from "../../lib/ai/prompts";
import { chatWithOllama, getOllamaModels } from "../../lib/ai/ollama";

type ScoreRequest = {
  prompt?: string;
  category?: string;
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  : null;

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

    // Default to mock scoring first
    let score = calculatePromptScore(prompt, category);
    let reasoning = "This fallback mock score checks clarity, length, structure, context, constraints, and use-case-specific signals.";
    let breakdown = {
      clarity: score >= 80 ? 18 : score >= 50 ? 12 : 8,
      specificity: score >= 80 ? 18 : score >= 50 ? 12 : 8,
      context: score >= 80 ? 16 : score >= 50 ? 10 : 6,
      constraints: score >= 80 ? 17 : score >= 50 ? 11 : 7,
      outputFormat: score >= 80 ? 16 : score >= 50 ? 10 : 6,
    };
    let scoringMode = "mock_rule_based";

    const ollamaModels = await getOllamaModels();
    const hasOllama = ollamaModels.length > 0;

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          temperature: 0.2,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: buildScorerSystemPrompt(),
            },
            {
              role: "user",
              content: buildScorerUserPrompt(prompt, category),
            },
          ],
        });

        const content = completion.choices[0]?.message?.content || "";
        const parsed = JSON.parse(content);
        if (typeof parsed.score === "number") {
          score = parsed.score;
          breakdown = parsed.breakdown || breakdown;
          reasoning = parsed.reasoning || reasoning;
          scoringMode = "real_ai_scorer";
        }
      } catch (e) {
        console.error("AI scoring failed, falling back to local/mock scorer:", e);

        // Si OpenAI échoue, on tente le modèle local Ollama
        if (hasOllama) {
          try {
            const systemPrompt = buildScorerSystemPrompt();
            const userPrompt = buildScorerUserPrompt(prompt, category);
            const content = await chatWithOllama(systemPrompt, userPrompt, "llama3.2");
            if (content) {
              const parsed = JSON.parse(content);
              if (typeof parsed.score === "number") {
                score = parsed.score;
                breakdown = parsed.breakdown || breakdown;
                reasoning = parsed.reasoning || reasoning;
                scoringMode = "local_ai_scorer";
              }
            }
          } catch (ollamaErr) {
            console.error("Ollama fallback scoring failed too:", ollamaErr);
          }
        }
      }
    } else if (hasOllama) {
      try {
        const systemPrompt = buildScorerSystemPrompt();
        const userPrompt = buildScorerUserPrompt(prompt, category);
        const content = await chatWithOllama(systemPrompt, userPrompt, "llama3.2");
        if (content) {
          const parsed = JSON.parse(content);
          if (typeof parsed.score === "number") {
            score = parsed.score;
            breakdown = parsed.breakdown || breakdown;
            reasoning = parsed.reasoning || reasoning;
            scoringMode = "local_ai_scorer";
          }
        }
      } catch (e) {
        console.error("Ollama scoring failed, falling back to rule-based scorer:", e);
      }
    }


    return NextResponse.json({
      score,
      category,
      scoringMode,
      breakdown,
      reasoning,
      notes: [
        "Score is calculated out of 100.",
        scoringMode === "real_ai_scorer"
          ? "Scored dynamically using real AI (OpenAI) according to prompt templates rubric instructions."
          : scoringMode === "local_ai_scorer"
            ? `Scored dynamically using local AI (Ollama: ${ollamaModels[0] || "llama3.2"}) according to prompt templates rubric.`
            : "Fallback mock scoring checks clarity, length, structure, context, constraints, and signals."
      ],

    });
  } catch (error) {
    console.error("Scoring handler error:", error);
    return NextResponse.json(
      { error: "Something went wrong while scoring the prompt." },
      { status: 500 }
    );
  }
}