import { NextResponse } from "next/server";
import {
  createAIProvider,
  getConfiguredAIProviderName,
} from "../../lib/ai/factory";
import {
  buildOptimizerSystemPrompt,
  buildOptimizerUserPrompt,
} from "../../lib/ai/prompts";
import { generateWithAIRuntime } from "../../lib/ai/runtime";
import { prisma } from "../../lib/prisma";

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
type AiProvider = "mock" | "openai" | "ollama";

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

function getConfiguredApiMode(): ApiMode {
  return getConfiguredAIProviderName() === "mock"
    ? "mock"
    : "real_ai";
}

function getProviderModel(
  provider: AiProvider,
): string | null {
  if (provider === "openai") {
    return (
      process.env.OPENAI_MODEL?.trim() ||
      "gpt-4o-mini"
    );
  }

  if (provider === "ollama") {
    return (
      process.env.OLLAMA_MODEL?.trim() ||
      "llama3.2"
    );
  }

  return null;
}

function normalizeText(
  value: unknown,
  fallback = "",
) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().replace(/\s+/g, " ");
}

function normalizeMultilineText(
  value: unknown,
  fallback = "",
) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function createErrorResponse(
  error: string,
  status = 400,
  details?: string,
  mode: ApiMode = getConfiguredApiMode(),
  aiProvider: AiProvider =
    getConfiguredAIProviderName(),
) {
  const payload: ApiErrorResponse = {
    success: false,
    error,
    details,
    mode,
    aiProvider,
    storageMode: "sqlite_prisma_ready",
  };

  return NextResponse.json(payload, {
    status,
  });
}

function hasAny(
  text: string,
  keywords: string[],
) {
  const lowerText = text.toLowerCase();

  return keywords.some((keyword) =>
    lowerText.includes(keyword),
  );
}

function detectCategory(
  prompt: string,
  selectedCategory = "General",
) {
  if (
    selectedCategory &&
    selectedCategory !== "General"
  ) {
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

function calculatePromptScore(
  prompt: string,
  category = "General",
) {
  const cleanPrompt = normalizeText(prompt);
  const lowerPrompt =
    cleanPrompt.toLowerCase();

  if (!cleanPrompt) {
    return 0;
  }

  let score = 20;

  if (cleanPrompt.length > 40) {
    score += 8;
  }

  if (cleanPrompt.length > 90) {
    score += 8;
  }

  if (cleanPrompt.length > 160) {
    score += 8;
  }

  if (cleanPrompt.length > 280) {
    score += 6;
  }

  if (
    hasAny(lowerPrompt, [
      "act as",
      "you are",
      "role",
    ])
  ) {
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

  if (
    hasAny(lowerPrompt, [
      "tone",
      "style",
      "voice",
    ])
  ) {
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

  if (category === "Video") {
    if (
      hasAny(lowerPrompt, [
        "scene",
        "camera",
        "motion",
        "transition",
      ])
    ) {
      score += 8;
    }

    if (
      hasAny(lowerPrompt, [
        "hook",
        "pacing",
        "storyboard",
      ])
    ) {
      score += 6;
    }
  }

  if (category === "Coding") {
    if (
      hasAny(lowerPrompt, [
        "code",
        "bug",
        "error",
        "function",
        "component",
      ])
    ) {
      score += 7;
    }

    if (
      hasAny(lowerPrompt, [
        "typescript",
        "react",
        "next.js",
        "api",
      ])
    ) {
      score += 7;
    }
  }

  if (category === "Agents") {
    if (
      hasAny(lowerPrompt, [
        "tools",
        "workflow",
        "memory",
        "steps",
        "agent",
      ])
    ) {
      score += 8;
    }
  }

  return Math.min(score, 100);
}

function calculateImprovedScore(
  originalScore: number,
  category: string,
  goal: string,
  depth: string,
  outputFormat: string,
  mode: ApiMode,
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
        : outputFormat === "JSON format" ||
            outputFormat === "Agent YAML format"
          ? 5
          : 4;

  const goalBoost =
    goal === "Better output format" ||
    goal === "More structured"
      ? 5
      : 3;

  const realAiBoost =
    mode === "real_ai" ? 3 : 0;

  return Math.min(
    originalScore +
      depthBoost +
      categoryBoost +
      formatBoost +
      goalBoost +
      realAiBoost,
    99,
  );
}

function getImageGoalInstruction(
  goal: string,
) {
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
  personalStyle: string,
) {
  const styleBlock =
    personalStyle.trim()
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
  personalStyle: string,
) {
  const styleBlock =
    personalStyle.trim()
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
  goal: string,
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

function buildPatterns(
  category: string,
) {
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

function safeStringArray(
  value: unknown,
  fallback: string[],
) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned.length > 0
    ? cleaned
    : fallback;
}

function parseAiJson(
  text: string,
): AiOptimizationJson | null {
  try {
    const parsed = JSON.parse(text) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed as AiOptimizationJson;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      const parsed = JSON.parse(
        match[0],
      ) as unknown;

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return null;
      }

      return parsed as AiOptimizationJson;
    } catch {
      return null;
    }
  }
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
          params.personalStyle,
        )
      : buildGeneralPrompt(
          params.prompt,
          params.category,
          params.model,
          params.goal,
          params.depth,
          params.outputFormat,
          params.personalStyle,
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
      params.goal,
    ),
    patterns: buildPatterns(params.category),
  };
}

export async function GET() {
  const configuredProvider =
    getConfiguredAIProviderName();

  const provider = createAIProvider(
    configuredProvider,
  );

  let providerAvailable =
    configuredProvider === "mock";

  try {
    const health =
      await provider.healthCheck();

    providerAvailable =
      configuredProvider === "mock" ||
      health.available;
  } catch (error) {
    console.error(
      "Optimize provider health check failed:",
      error,
    );

    providerAvailable = false;
  }

  const mode: ApiMode =
    configuredProvider !== "mock" &&
    providerAvailable
      ? "real_ai"
      : "mock";

  const aiProvider: AiProvider =
    mode === "real_ai"
      ? configuredProvider
      : "mock";

  const providerModel =
    mode === "real_ai"
      ? getProviderModel(
          configuredProvider,
        )
      : null;

  let message =
    "Optimize API is available. Mock mode is active.";

  if (mode === "real_ai") {
    message =
      configuredProvider === "openai"
        ? `Optimize API is available. Real AI mode is enabled with OpenAI model ${providerModel}.`
        : `Optimize API is available. Local AI mode is enabled with Ollama model ${providerModel}.`;
  } else if (
    configuredProvider !== "mock" &&
    !providerAvailable
  ) {
    message =
      `Optimize API is available. Configured provider ${configuredProvider} is unavailable, so mock optimization will be used.`;
  }

  return NextResponse.json({
    name: "Optimize API",
    route: "/api/optimize",
    status: "online",
    mode,
    aiProvider,
    openAiModel: providerModel,
    storageMode: "sqlite_prisma_ready",
    message,
    supportedMethods: [
      "GET",
      "POST",
    ],
  });
}

export async function POST(
  request: Request,
) {
  try {
    let body: OptimizeRequest;

    try {
      body =
        (await request.json()) as OptimizeRequest;
    } catch {
      return createErrorResponse(
        "Invalid JSON body.",
        400,
        "Send a valid JSON object with at least a prompt field.",
      );
    }

    const prompt =
      normalizeText(body.prompt);

    const selectedCategory =
      normalizeText(
        body.category,
        "General",
      );

    const category = detectCategory(
      prompt,
      selectedCategory,
    );

    const model = normalizeText(
      body.model,
      "GPT-4.1 / GPT-5 style",
    );

    const goal = normalizeText(
      body.goal,
      "More structured",
    );

    const depth = normalizeText(
      body.depth,
      "Balanced",
    );

    const outputFormat =
      normalizeText(
        body.outputFormat,
        "Detailed explanation",
      );

    const personalStyle =
      normalizeMultilineText(
        body.personalStyle,
      );

    if (!prompt) {
      return createErrorResponse(
        "Prompt is required.",
        400,
        "The prompt field cannot be empty.",
      );
    }

    if (
      prompt.length >
      MAX_PROMPT_LENGTH
    ) {
      return createErrorResponse(
        "Prompt is too long.",
        400,
        `Maximum allowed prompt length is ${MAX_PROMPT_LENGTH} characters.`,
      );
    }

    const originalScore =
      calculatePromptScore(
        prompt,
        category,
      );

    let mode: ApiMode = "mock";

    let aiProvider: AiProvider =
      "mock";

    let aiModel: string | null =
      null;

    let fallbackReason = "";

    let optimization =
      buildMockOptimization({
        prompt,
        category,
        model,
        goal,
        depth,
        outputFormat,
        personalStyle,
      });

    // Fetch high-scoring curated examples from Corpus to act as few-shot demonstrations
    let fewShots = "";
    let fewShotsCount = 0;
    try {
      const examples = await prisma.corpusPrompt.findMany({
        where: {
          category: category,
          isArchived: false,
        },
        orderBy: {
          qualityScore: "desc",
        },
        take: 2,
      });

      fewShotsCount = examples.length;
      if (examples.length > 0) {
        fewShots = examples
          .map(
            (ex: any, idx: number) => `
### Example ${idx + 1}:
Original Input Prompt:
"${ex.prompt}"

Optimized Target Output:
"${ex.improvedVersion || ex.prompt}"
`
          )
          .join("\n");
      }
    } catch (err) {
      console.warn("Few-shot example selection failed:", err);
    }

    const aiResponse =
      await generateWithAIRuntime({
        messages: [
          {
            role: "system",
            content:
              buildOptimizerSystemPrompt(
                category,
                fewShots,
              ),
          },
          {
            role: "user",
            content:
              buildOptimizerUserPrompt({
                prompt,
                category,
                model,
                goal,
                depth,
                outputFormat,
                personalStyle,
              }),
          },
        ],
        temperature: 0.4,
      });

    if (aiResponse.success) {
      const parsed = parseAiJson(
        aiResponse.content,
      );

      const improvedPrompt =
        normalizeMultilineText(
          parsed?.improvedPrompt,
        );

      if (improvedPrompt) {
        optimization = {
          improvedPrompt,
          explanation:
            safeStringArray(
              parsed?.explanation,
              optimization.explanation,
            ),
          variants:
            safeStringArray(
              parsed?.variants,
              optimization.variants,
            ),
          patterns:
            safeStringArray(
              parsed?.patterns,
              optimization.patterns,
            ),
        };

        if (
          aiResponse.provider !==
          "mock"
        ) {
          mode = "real_ai";
          aiProvider =
            aiResponse.provider;
          aiModel =
            aiResponse.model;
        }
      } else {
        fallbackReason =
          `${aiResponse.provider} returned an invalid optimization response.`;
      }
    } else {
      fallbackReason =
        aiResponse.error ||
        `${aiResponse.provider} optimization failed.`;
    }

    const improvedScore =
      calculateImprovedScore(
        originalScore,
        category,
        goal,
        depth,
        outputFormat,
        mode,
      );

    const scoreGain =
      improvedScore -
      originalScore;

    return NextResponse.json({
      success: true,

      mode,
      aiProvider,
      openAiModel: aiModel,
      fewShotsCount,
      storageMode:
        "sqlite_prisma_ready",
      engineStatus:
        mode === "real_ai"
          ? "real_ai"
          : "mock_api",
      fallbackReason,

      originalPrompt: prompt,
      originalScore,
      improvedScore,
      scoreGain,
      improvedPrompt:
        optimization.improvedPrompt,

      explanation:
        optimization.explanation,

      variants:
        optimization.variants,

      patterns:
        optimization.patterns,

      scoringNotes: [
        `Original quality is ${originalScore}%. It measures clarity, length, context, structure, constraints, and use-case-specific signals.`,
        `Improved quality is ${improvedScore}%. It adds selected depth, category-specific improvements, output format quality, goal alignment, and real AI enhancement when available.`,
        `Score gain is +${scoreGain} points.`,
        `Detected use case: ${category}.`,
        mode === "real_ai"
          ? `Real AI mode is active using ${aiProvider} model ${aiModel}.`
          : fallbackReason
            ? `Mock optimizer mode is active because ${fallbackReason}`
            : "Mock optimizer mode is active.",
      ],

      request: {
        category:
          selectedCategory,
        detectedCategory:
          category,
        model,
        goal,
        depth,
        outputFormat,
        hasPersonalStyle:
          Boolean(personalStyle),
      },

      detectedCategory:
        category,

      nextStep:
        "Save this optimization to SQLite history, collect feedback, and use the feedback later as PromptMaster training data.",
    });
  } catch (error) {
    console.error(
      "Optimize API error:",
      error,
    );

    return createErrorResponse(
      "Something went wrong while optimizing the prompt.",
      500,
      error instanceof Error
        ? error.message
        : "Unknown server error.",
    );
  }
}