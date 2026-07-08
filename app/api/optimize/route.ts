import OpenAI from "openai";
import { NextResponse } from "next/server";

type OptimizeRequest = {
  prompt?: string;
  category?: string;
  model?: string;
  goal?: string;
  depth?: string;
  outputFormat?: string;
  personalStyle?: string;
};

type ApiMode = "mock" | "real_ai";
type AiProvider = "mock" | "openai";

type ApiErrorResponse = {
  success: false;
  error: string;
  details?: string;
  mode: ApiMode;
  aiProvider: AiProvider;
  storageMode: "sqlite_prisma_ready";
};

type AiOptimizationJson = {
  improvedPrompt?: string;
  explanation?: string[];
  variants?: string[];
  patterns?: string[];
};

const MAX_PROMPT_LENGTH = 8000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

function normalizeText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().replace(/\s+/g, " ");
}

function normalizeMultilineText(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function createErrorResponse(
  error: string,
  status = 400,
  details?: string,
  mode: ApiMode = openai ? "real_ai" : "mock",
  aiProvider: AiProvider = openai ? "openai" : "mock"
) {
  const payload: ApiErrorResponse = {
    success: false,
    error,
    details,
    mode,
    aiProvider,
    storageMode: "sqlite_prisma_ready",
  };

  return NextResponse.json(payload, { status });
}

function hasAny(text: string, keywords: string[]) {
  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword));
}

function detectCategory(prompt: string, selectedCategory = "General") {
  if (selectedCategory && selectedCategory !== "General") {
    return selectedCategory;
  }

  const lowerPrompt = prompt.toLowerCase();

  if (
    hasAny(lowerPrompt, [
      "image",
      "picture",
      "photo",
      "visual",
      "poster",
      "banner",
      "hero image",
      "logo",
      "thumbnail",
      "illustration",
      "midjourney",
      "stable diffusion",
      "dall-e",
      "dalle",
      "flux",
    ])
  ) {
    return "Image Generation";
  }

  if (
    hasAny(lowerPrompt, [
      "video",
      "reel",
      "animation",
      "scene",
      "shot",
      "camera movement",
      "storyboard",
      "tiktok",
      "youtube shorts",
    ])
  ) {
    return "Video";
  }

  if (
    hasAny(lowerPrompt, [
      "code",
      "bug",
      "error",
      "component",
      "function",
      "api",
      "typescript",
      "react",
      "next.js",
      "nextjs",
      "database",
      "prisma",
      "tailwind",
    ])
  ) {
    return "Coding";
  }

  if (
    hasAny(lowerPrompt, [
      "agent",
      "workflow",
      "tools",
      "automation",
      "system prompt",
      "memory",
      "tool use",
      "multi-agent",
    ])
  ) {
    return "Agents";
  }

  return "General";
}

function calculatePromptScore(prompt: string, category = "General") {
  const cleanPrompt = normalizeText(prompt);
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
  if (hasAny(lowerPrompt, ["constraints", "rules", "avoid", "must"])) score += 8;
  if (hasAny(lowerPrompt, ["specific", "detailed", "clear", "professional"])) score += 5;

  if (category === "Image Generation") {
    if (hasAny(lowerPrompt, ["lighting", "composition", "style", "camera"])) score += 8;
    if (hasAny(lowerPrompt, ["background", "colors", "neon", "cinematic"])) score += 6;
    if (hasAny(lowerPrompt, ["negative prompt", "avoid", "no blurry"])) score += 8;
  }

  if (category === "Video") {
    if (hasAny(lowerPrompt, ["scene", "camera", "motion", "transition"])) score += 8;
    if (hasAny(lowerPrompt, ["hook", "pacing", "storyboard"])) score += 6;
  }

  if (category === "Coding") {
    if (hasAny(lowerPrompt, ["code", "bug", "error", "function", "component"])) score += 7;
    if (hasAny(lowerPrompt, ["typescript", "react", "next.js", "api"])) score += 7;
  }

  if (category === "Agents") {
    if (hasAny(lowerPrompt, ["tools", "workflow", "memory", "steps", "agent"])) score += 8;
  }

  return Math.min(score, 100);
}

function calculateImprovedScore(
  originalScore: number,
  category: string,
  goal: string,
  depth: string,
  outputFormat: string,
  mode: ApiMode
) {
  const depthBoost =
    depth === "Basic"
      ? 22
      : depth === "Balanced"
        ? 35
        : depth === "Deep analysis"
          ? 42
          : 48;

  const categoryBoost =
    category === "Image Generation"
      ? 8
      : category === "Video"
        ? 7
        : category === "Coding"
          ? 6
          : category === "Agents"
            ? 6
            : 4;

  const formatBoost =
    outputFormat === "Prompt only"
      ? 2
      : outputFormat === "Prompt + variants"
        ? 6
        : outputFormat === "JSON format" || outputFormat === "Agent YAML format"
          ? 5
          : 4;

  const goalBoost =
    goal === "Better output format" || goal === "More structured" ? 5 : 3;

  const realAiBoost = mode === "real_ai" ? 3 : 0;

  return Math.min(
    originalScore +
      depthBoost +
      categoryBoost +
      formatBoost +
      goalBoost +
      realAiBoost,
    99
  );
}

function getImageGoalInstruction(goal: string) {
  if (goal === "More detailed") {
    return "Add richer visual details, subject description, environment, texture, depth, and atmosphere.";
  }

  if (goal === "More structured") {
    return "Separate the image prompt into visual sections such as style, composition, lighting, colors, details, and negative prompt.";
  }

  if (goal === "More creative") {
    return "Add more imaginative visual direction, stronger mood, unique design elements, and creative composition.";
  }

  if (goal === "More professional") {
    return "Make the image direction polished, premium, brand-ready, and suitable for a serious SaaS product.";
  }

  if (goal === "More concise") {
    return "Keep the image prompt compact while preserving the most important visual details.";
  }

  if (goal === "Better output format") {
    return "Make the image prompt easy to paste into an image model with clear visual sections.";
  }

  return "Improve the visual prompt while preserving the original concept.";
}

function buildImagePrompt(
  prompt: string,
  model: string,
  goal: string,
  depth: string,
  outputFormat: string,
  personalStyle: string
) {
  const styleBlock = personalStyle.trim()
    ? `

Personal Style Preference:
${personalStyle.trim()}`
    : "";

  if (outputFormat === "Prompt only") {
    return `A premium, high-quality image based on this concept: ${prompt}. Use a modern professional visual style, strong composition, clear focal point, polished lighting, rich detail, clean background, balanced spacing, and a refined color palette. Add visual depth and a premium brand-ready aesthetic. Avoid blurry details, distorted objects, random text, messy layout, low-quality design, and clutter.`;
  }

  return `Final Image Prompt:

Create a premium, high-quality visual based on the following concept:

"${prompt}"

Style Direction:
- Modern, polished, professional visual design
- Premium SaaS / AI startup aesthetic when relevant
- Clean futuristic look without becoming messy
- High-detail visual quality with balanced spacing
- Strong visual hierarchy and clear focal point
- ${getImageGoalInstruction(goal)}

Composition:
- Place the main subject in the center or slightly off-center
- Use depth, layers, and spacing to make the image feel premium
- Keep the composition clean, readable, and visually balanced
- Add supporting visual elements only when they strengthen the concept
- Leave clean negative space if the image is intended for a landing page, ad, thumbnail, or hero section

Lighting and Colors:
- Use cinematic lighting with soft highlights and strong contrast
- Use a coherent color palette that fits the concept
- For technology or AI visuals, use dark navy, blue, cyan, violet, and subtle neon accents
- Avoid overexposed lighting, muddy colors, and random color choices

Details to Include:
- Clear visual storytelling based on the original concept
- Professional design quality
- Sharp details
- Clean background
- Realistic or premium stylized elements depending on the subject
- Visual elements that communicate purpose, intelligence, quality, and trust

Negative Prompt:
Avoid low-quality design, blurry details, messy composition, distorted objects, random text, unreadable UI, fake typography, cluttered layout, cheap stock-photo look, excessive icons, bad anatomy, duplicated objects, low resolution, harsh noise, and unprofessional styling.

Target Image Model:
${model}

Optimization Goal:
${goal}

Optimization Depth:
${depth}

Image Prompting Notes:
- This is optimized as a visual prompt, not a normal text-answer prompt
- Make the prompt image-model-ready
- Describe visible elements, not hidden reasoning
- Prioritize style, composition, lighting, colors, subject, and negative prompt${styleBlock}`;
}

function buildGeneralPrompt(
  prompt: string,
  category: string,
  model: string,
  goal: string,
  depth: string,
  outputFormat: string,
  personalStyle: string
) {
  const styleBlock = personalStyle.trim()
    ? `

Personal style preference:
${personalStyle.trim()}`
    : "";

  return `Act as an expert ${category.toLowerCase()} prompt engineer.

Your task is to help me achieve the following goal:

"${prompt}"

Target model style:
${model}

Optimization goal:
${goal}

Optimization depth:
${depth}

Output format:
${outputFormat}

Instructions:
- Preserve the original intent
- Add missing context and assumptions when useful
- Improve clarity, specificity, and structure
- Add constraints that reduce generic output
- Define the expected output format clearly
- Include examples when useful
- Avoid vague or unsupported answers${styleBlock}

Please produce the best possible result using this structure:

1. Clarified objective
2. Key requirements
3. Optimized final prompt
4. Why this prompt works better
5. Suggested variants if useful

Quality rules:
- Be specific
- Be practical
- Be well structured
- Make the prompt model-ready
- Keep the final prompt easy to reuse`;
}

function buildVariants(
  prompt: string,
  category: string,
  model: string,
  goal: string
) {
  if (category === "Image Generation") {
    return [
      `Cinematic premium image prompt: ${prompt}. Use dramatic lighting, strong composition, sharp details, professional visual storytelling, clean background, and a polished high-end aesthetic. Avoid blurry details, clutter, random text, and low-quality design.`,
      `Minimal premium image prompt: ${prompt}. Use clean composition, elegant spacing, soft lighting, refined colors, modern design, clear subject focus, and a professional landing-page-ready style.`,
      `Futuristic tech image prompt: ${prompt}. Use dark background, blue and violet glow, floating UI elements, data streams, glassmorphism, depth, cinematic lighting, and a premium AI startup aesthetic.`,
    ];
  }

  return [
    `Act as a senior ${category.toLowerCase()} strategist. Improve this request into a high-performing prompt: "${prompt}". Use a ${goal.toLowerCase()} style and structure the output for ${model}.`,
    `Rewrite this prompt so it becomes clearer, more specific, and more useful: "${prompt}". Add role instructions, missing context, constraints, examples, and final output format.`,
    `You are PromptMaster, an advanced prompt optimization assistant. Analyze this prompt: "${prompt}". Score it, identify weaknesses, and generate a stronger version optimized for ${model}.`,
  ];
}

function buildPatterns(category: string) {
  if (category === "Image Generation") {
    return [
      "Visual style",
      "Composition",
      "Lighting",
      "Color palette",
      "Negative prompt",
      "Model-ready image prompt",
    ];
  }

  if (category === "Coding") {
    return [
      "Technical context",
      "Framework details",
      "Error boundaries",
      "Expected behavior",
      "Copy-paste-ready output",
      "Debugging clarity",
    ];
  }

  if (category === "Agents") {
    return [
      "Role definition",
      "Tool instructions",
      "Workflow planning",
      "Memory boundaries",
      "Step-by-step execution",
      "Success criteria",
    ];
  }

  return [
    "Role definition",
    "Context enrichment",
    "Output formatting",
    "Specific constraints",
    "Model-aware optimization",
    "Personal style memory",
  ];
}

function safeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function parseAiJson(text: string): AiOptimizationJson | null {
  try {
    return JSON.parse(text) as AiOptimizationJson;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as AiOptimizationJson;
    } catch {
      return null;
    }
  }
}

function buildRealAiSystemPrompt(category: string) {
  return `You are PromptMaster, the real AI optimization engine inside Wordsly.Ai.

You improve user prompts with expert prompt engineering.

Rules:
- Preserve the user's original intent.
- Make the prompt clearer, more specific, and more useful.
- Add missing context only when helpful.
- Add constraints that reduce weak or generic answers.
- Make the final prompt ready to paste into the selected AI model.
- Do not include hidden reasoning.
- Do not mention that you are an AI unless the prompt needs it.
- Return valid JSON only.

The user prompt category is: ${category}.`;
}

function buildRealAiUserPrompt(params: {
  prompt: string;
  category: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  personalStyle: string;
}) {
  const styleBlock = params.personalStyle
    ? `\nPersonal style preference:\n${params.personalStyle}\n`
    : "";

  return `Optimize this prompt for Wordsly.Ai.

Original prompt:
${params.prompt}

Use case:
${params.category}

Target model style:
${params.model}

Optimization goal:
${params.goal}

Optimization depth:
${params.depth}

Requested output format:
${params.outputFormat}
${styleBlock}

Return only valid JSON with this exact shape:
{
  "improvedPrompt": "string",
  "explanation": ["string", "string", "string", "string"],
  "variants": ["string", "string", "string"],
  "patterns": ["string", "string", "string", "string", "string", "string"]
}

Important:
- improvedPrompt must be the final optimized prompt.
- explanation must explain practical improvements.
- variants must be alternative optimized prompt versions.
- patterns must be short labels describing the prompt engineering patterns used.
- For image prompts, include visual style, composition, lighting, color palette, details, and negative prompt.
- For coding prompts, include technical context, expected behavior, constraints, and copy-paste output expectations.
- For agent prompts, include role, tools, workflow, rules, memory boundaries, and success criteria.`;
}

async function buildRealAiOptimization(params: {
  prompt: string;
  category: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  personalStyle: string;
}) {
  if (!openai) {
    return null;
  }

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.4,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: buildRealAiSystemPrompt(params.category),
      },
      {
        role: "user",
        content: buildRealAiUserPrompt(params),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content || "";
  const parsed = parseAiJson(content);

  if (!parsed?.improvedPrompt) {
    throw new Error("OpenAI returned an invalid optimization response.");
  }

  return parsed;
}

function buildMockOptimization(params: {
  prompt: string;
  category: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  personalStyle: string;
}) {
  const improvedPrompt =
    params.category === "Image Generation"
      ? buildImagePrompt(
          params.prompt,
          params.model,
          params.goal,
          params.depth,
          params.outputFormat,
          params.personalStyle
        )
      : buildGeneralPrompt(
          params.prompt,
          params.category,
          params.model,
          params.goal,
          params.depth,
          params.outputFormat,
          params.personalStyle
        );

  return {
    improvedPrompt,
    explanation: [
      `Optimized for the detected use case: ${params.category}.`,
      `Applied target model style: ${params.model}.`,
      `Used optimization goal: ${params.goal}.`,
      `Used optimization depth: ${params.depth}.`,
      `Matched output format: ${params.outputFormat}.`,
      params.category === "Image Generation"
        ? "Converted the prompt into an image-model-ready prompt with style, composition, lighting, colors, details, and negative prompt."
        : "Added role definition, clearer context, constraints, output format, and reusable prompt structure.",
    ],
    variants: buildVariants(
      params.prompt,
      params.category,
      params.model,
      params.goal
    ),
    patterns: buildPatterns(params.category),
  };
}

export async function GET() {
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);

  return NextResponse.json({
    name: "Optimize API",
    route: "/api/optimize",
    status: "online",
    mode: hasOpenAiKey ? "real_ai" : "mock",
    aiProvider: hasOpenAiKey ? "openai" : "mock",
    openAiModel: hasOpenAiKey ? OPENAI_MODEL : null,
    storageMode: "sqlite_prisma_ready",
    message: hasOpenAiKey
      ? "Optimize API is available. Real AI mode is enabled with OpenAI."
      : "Optimize API is available. Mock mode is active because OPENAI_API_KEY is missing.",
    supportedMethods: ["GET", "POST"],
  });
}

export async function POST(request: Request) {
  try {
    let body: OptimizeRequest;

    try {
      body = (await request.json()) as OptimizeRequest;
    } catch {
      return createErrorResponse(
        "Invalid JSON body.",
        400,
        "Send a valid JSON object with at least a prompt field."
      );
    }

    const prompt = normalizeText(body.prompt);
    const selectedCategory = normalizeText(body.category, "General");
    const category = detectCategory(prompt, selectedCategory);
    const model = normalizeText(body.model, "GPT-4.1 / GPT-5 style");
    const goal = normalizeText(body.goal, "More structured");
    const depth = normalizeText(body.depth, "Balanced");
    const outputFormat = normalizeText(
      body.outputFormat,
      "Detailed explanation"
    );
    const personalStyle = normalizeMultilineText(body.personalStyle);

    if (!prompt) {
      return createErrorResponse(
        "Prompt is required.",
        400,
        "The prompt field cannot be empty."
      );
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return createErrorResponse(
        "Prompt is too long.",
        400,
        `Maximum allowed prompt length is ${MAX_PROMPT_LENGTH} characters.`
      );
    }

    const originalScore = calculatePromptScore(prompt, category);

    let mode: ApiMode = openai ? "real_ai" : "mock";
    let aiProvider: AiProvider = openai ? "openai" : "mock";
    let fallbackReason = "";

    let optimization = buildMockOptimization({
      prompt,
      category,
      model,
      goal,
      depth,
      outputFormat,
      personalStyle,
    });

    if (openai) {
      try {
        const realAiOptimization = await buildRealAiOptimization({
          prompt,
          category,
          model,
          goal,
          depth,
          outputFormat,
          personalStyle,
        });

        if (realAiOptimization) {
          optimization = {
            improvedPrompt: realAiOptimization.improvedPrompt || optimization.improvedPrompt,
            explanation: safeStringArray(
              realAiOptimization.explanation,
              optimization.explanation
            ),
            variants: safeStringArray(
              realAiOptimization.variants,
              optimization.variants
            ),
            patterns: safeStringArray(
              realAiOptimization.patterns,
              optimization.patterns
            ),
          };
        }
      } catch (error) {
        console.error("OpenAI optimization failed. Falling back to mock:", error);

        mode = "mock";
        aiProvider = "mock";
        fallbackReason =
          error instanceof Error
            ? error.message
            : "OpenAI request failed, so mock optimizer was used.";
      }
    }

    const improvedScore = calculateImprovedScore(
      originalScore,
      category,
      goal,
      depth,
      outputFormat,
      mode
    );

    const scoreGain = improvedScore - originalScore;

    return NextResponse.json({
      success: true,

      mode,
      aiProvider,
      openAiModel: mode === "real_ai" ? OPENAI_MODEL : null,
      storageMode: "sqlite_prisma_ready",
      engineStatus: mode === "real_ai" ? "real_ai" : "mock_api",
      fallbackReason,

      originalPrompt: prompt,
      originalScore,
      improvedScore,
      scoreGain,
      improvedPrompt: optimization.improvedPrompt,

      explanation: optimization.explanation,

      variants: optimization.variants,
      patterns: optimization.patterns,

      scoringNotes: [
        `Original quality is ${originalScore}%. It measures clarity, length, context, structure, constraints, and use-case-specific signals.`,
        `Improved quality is ${improvedScore}%. It adds selected depth, category-specific improvements, output format quality, goal alignment, and real AI enhancement when available.`,
        `Score gain is +${scoreGain} points.`,
        `Detected use case: ${category}.`,
        mode === "real_ai"
          ? `Real AI mode is active using OpenAI model: ${OPENAI_MODEL}.`
          : "Mock optimizer mode is active.",
      ],

      request: {
        category: selectedCategory,
        detectedCategory: category,
        model,
        goal,
        depth,
        outputFormat,
        hasPersonalStyle: Boolean(personalStyle),
      },

      detectedCategory: category,

      nextStep:
        "Save this optimization to SQLite history, collect feedback, and use the feedback later as PromptMaster training data.",
    });
  } catch (error) {
    console.error("Optimize API error:", error);

    return createErrorResponse(
      "Something went wrong while optimizing the prompt.",
      500,
      error instanceof Error ? error.message : "Unknown server error."
    );
  }
}