import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
} from "../../../lib/api-response";
import { verifyToken } from "../../../lib/auth";
import {
  buildOptimizerSystemPrompt,
  buildOptimizerUserPrompt,
} from "../../../lib/ai/prompts";
import {
  generateWithAIRuntimeDetailed,
} from "../../../lib/ai/runtime";
import type {
  AIProviderName,
} from "../../../lib/ai/types";
import { prisma } from "../../../lib/prisma";

const PROVIDERS = [
  "mock",
  "ollama",
  "openai",
] as const;

const DATASET_VERSION =
  "provider-benchmark-v1";

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RETRIES = 1;
const MAX_HISTORY_LIMIT = 50;

type BenchmarkItem = {
  id: string;
  title: string;
  category: string;
  prompt: string;
  model: string;
  goal: string;
  depth: string;
  outputFormat: string;
  personalStyle: string;
};

type BenchmarkRequest = {
  providers?: unknown;
  fallbackProvider?: unknown;
  timeoutMs?: unknown;
  maxRetries?: unknown;
};

type OptimizationPayload = {
  improvedPrompt?: unknown;
  explanation?: unknown;
  variants?: unknown;
  patterns?: unknown;
};

const benchmarkDataset: BenchmarkItem[] = [
  {
    id: "benchmark-coding-01",
    title: "React Component Optimization",
    category: "Coding",
    prompt:
      "Create a React component for a searchable product list.",
    model: "General",
    goal: "Improve clarity and implementation quality",
    depth: "Detailed",
    outputFormat: "Structured prompt",
    personalStyle:
      "Professional, precise, and implementation-focused",
  },
  {
    id: "benchmark-marketing-01",
    title: "Fitness App Campaign",
    category: "Marketing",
    prompt:
      "Create a marketing campaign for a fitness application targeting busy professionals.",
    model: "General",
    goal: "Improve audience targeting and campaign structure",
    depth: "Detailed",
    outputFormat: "Structured prompt",
    personalStyle:
      "Professional, persuasive, and actionable",
  },
  {
    id: "benchmark-image-01",
    title: "Cyberpunk Detective Cat",
    category: "Image Generation",
    prompt:
      "A detective cat standing in a futuristic cyberpunk alley.",
    model: "General",
    goal: "Improve visual specificity and generation consistency",
    depth: "Detailed",
    outputFormat: "Structured image prompt",
    personalStyle:
      "Cinematic, realistic, and visually detailed",
  },
];

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("wordsly_session")?.value || "";
  const session = verifyToken(token);

  return session?.role === "admin";
}

function isProviderName(
  value: unknown,
): value is AIProviderName {
  return (
    typeof value === "string" &&
    PROVIDERS.includes(
      value.trim().toLowerCase() as AIProviderName,
    )
  );
}

function parseProviders(
  value: unknown,
): AIProviderName[] | null {
  if (value === undefined) {
    return [...PROVIDERS];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const providers = Array.from(
    new Set(
      value
        .filter(isProviderName)
        .map(
          (provider) =>
            provider
              .trim()
              .toLowerCase() as AIProviderName,
        ),
    ),
  );

  if (
    providers.length === 0 ||
    providers.length !== value.length
  ) {
    return null;
  }

  return providers;
}

function parseFallbackProvider(
  value: unknown,
): AIProviderName | null | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (!isProviderName(value)) {
    return undefined;
  }

  return value
    .trim()
    .toLowerCase() as AIProviderName;
}

function parseBoundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number | null {
  if (value === undefined) {
    return fallback;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    return null;
  }

  return value;
}

function parseOptimizationPayload(
  content: string,
): OptimizationPayload | null {
  try {
    const parsed = JSON.parse(content) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as OptimizationPayload;
    }
  } catch {
    const match =
      content.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      const parsed =
        JSON.parse(match[0]) as unknown;

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as OptimizationPayload;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeWords(
  value: string,
): Set<string> {
  const ignoredWords = new Set([
    "a",
    "an",
    "and",
    "for",
    "in",
    "of",
    "on",
    "the",
    "to",
    "with",
  ]);

  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2 &&
          !ignoredWords.has(word),
      ),
  );
}

function calculateIntentOverlap(
  originalPrompt: string,
  improvedPrompt: string,
): number {
  const originalWords =
    normalizeWords(originalPrompt);

  if (originalWords.size === 0) {
    return 0;
  }

  const improvedWords =
    normalizeWords(improvedPrompt);

  let matchingWords = 0;

  for (const word of originalWords) {
    if (improvedWords.has(word)) {
      matchingWords += 1;
    }
  }

  return matchingWords /
    originalWords.size;
}

function isStringArray(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0,
    )
  );
}

function calculateQualityScore(
  originalPrompt: string,
  content: string,
): number {
  const parsed =
    parseOptimizationPayload(content);

  if (!parsed) {
    return 10;
  }

  const improvedPrompt =
    typeof parsed.improvedPrompt === "string"
      ? parsed.improvedPrompt.trim()
      : "";

  if (!improvedPrompt) {
    return 20;
  }

  let score = 35;

  const originalLength =
    originalPrompt.trim().length;

  if (
    improvedPrompt.length >
    originalLength
  ) {
    score += 15;
  }

  if (
    improvedPrompt.length >=
    Math.min(200, originalLength * 2)
  ) {
    score += 10;
  }

  const intentOverlap =
    calculateIntentOverlap(
      originalPrompt,
      improvedPrompt,
    );

  score += Math.round(
    Math.min(1, intentOverlap) * 15,
  );

  if (
    isStringArray(parsed.explanation)
  ) {
    score += 10;
  }

  if (
    isStringArray(parsed.variants)
  ) {
    score += 8;
  }

  if (
    isStringArray(parsed.patterns)
  ) {
    score += 7;
  }

  return Math.max(
    0,
    Math.min(100, score),
  );
}

function classifyError(
  error: string | undefined,
): string | null {
  const normalized =
    error?.trim().toLowerCase() || "";

  if (!normalized) {
    return null;
  }

  if (
    normalized.includes("timed out") ||
    normalized.includes("timeout")
  ) {
    return "timeout";
  }

  if (
    normalized.includes("api key") ||
    normalized.includes("authentication")
  ) {
    return "authentication";
  }

  if (
    normalized.includes("quota") ||
    normalized.includes("rate limit")
  ) {
    return "rate_limit";
  }

  if (
    normalized.includes("not running") ||
    normalized.includes("connect")
  ) {
    return "connection";
  }

  if (
    normalized.includes("empty response")
  ) {
    return "empty_response";
  }

  if (
    normalized.includes("invalid")
  ) {
    return "invalid_response";
  }

  return "provider_error";
}

function createProviderSummary(
  results: Array<{
    provider: string;
    success: boolean;
    qualityScore: number;
    latencyMs: number;
    attemptCount: number;
    usedFallback: boolean;
  }>,
) {
  return PROVIDERS.map((provider) => {
    const providerResults =
      results.filter(
        (result) =>
          result.provider === provider,
      );

    const successfulResults =
      providerResults.filter(
        (result) => result.success,
      );

    const totalLatency =
      providerResults.reduce(
        (total, result) =>
          total + result.latencyMs,
        0,
      );

    const totalQuality =
      providerResults.reduce(
        (total, result) =>
          total + result.qualityScore,
        0,
      );

    const totalAttempts =
      providerResults.reduce(
        (total, result) =>
          total + result.attemptCount,
        0,
      );

    const fallbackCount =
      providerResults.filter(
        (result) =>
          result.usedFallback,
      ).length;

    return {
      provider,
      testCount:
        providerResults.length,
      successfulTests:
        successfulResults.length,
      failedTests:
        providerResults.length -
        successfulResults.length,
      successRate:
        providerResults.length === 0
          ? 0
          : Math.round(
              (successfulResults.length /
                providerResults.length) *
                100,
            ),
      averageQualityScore:
        providerResults.length === 0
          ? 0
          : Math.round(
              totalQuality /
                providerResults.length,
            ),
      averageLatencyMs:
        providerResults.length === 0
          ? 0
          : Math.round(
              totalLatency /
                providerResults.length,
            ),
      averageAttempts:
        providerResults.length === 0
          ? 0
          : Number(
              (
                totalAttempts /
                providerResults.length
              ).toFixed(2),
            ),
      fallbackCount,
    };
  }).filter(
    (summary) =>
      summary.testCount > 0,
  );
}

function parseHistoryInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
): number | null {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    return null;
  }

  return parsed;
}

export async function GET(
  request: NextRequest,
) {
  try {
    if (!(await requireAdmin())) {
      return forbidden();
    }

    const runId =
      request.nextUrl.searchParams
        .get("runId")
        ?.trim() || "";

    if (runId) {
      const run =
        await prisma.providerBenchmarkRun.findUnique({
          where: {
            id: runId,
          },
          include: {
            results: {
              orderBy: [
                {
                  provider: "asc",
                },
                {
                  testCaseId: "asc",
                },
              ],
            },
          },
        });

      if (!run) {
        return notFound(
          "Benchmark run not found.",
        );
      }

      return NextResponse.json({
        success: true,
        run,
        providerSummary:
          createProviderSummary(
            run.results,
          ),
      });
    }

    const page =
      parseHistoryInteger(
        request.nextUrl.searchParams.get(
          "page",
        ),
        1,
        1,
        100000,
      );

    if (page === null) {
      return badRequest(
        "The page parameter must be a positive integer.",
      );
    }

    const limit =
      parseHistoryInteger(
        request.nextUrl.searchParams.get(
          "limit",
        ),
        10,
        1,
        MAX_HISTORY_LIMIT,
      );

    if (limit === null) {
      return badRequest(
        `The limit parameter must be between 1 and ${MAX_HISTORY_LIMIT}.`,
      );
    }

    const skip =
      (page - 1) * limit;

    const [runs, totalCount] =
      await Promise.all([
        prisma.providerBenchmarkRun.findMany({
          orderBy: {
            startedAt: "desc",
          },
          skip,
          take: limit,
          include: {
            results: {
              select: {
                provider: true,
                success: true,
                qualityScore: true,
                latencyMs: true,
                attemptCount: true,
                usedFallback: true,
              },
            },
          },
        }),
        prisma.providerBenchmarkRun.count(),
      ]);

    const totalPages =
      totalCount === 0
        ? 0
        : Math.ceil(
            totalCount / limit,
          );

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      },
      runs: runs.map((run) => ({
        ...run,
        providerSummary:
          createProviderSummary(
            run.results,
          ),
      })),
    });
  } catch (error) {
    console.error(
      "Provider benchmark GET error:",
      error,
    );

    return internalServerError(
      "Something went wrong while loading benchmark history.",
    );
  }
}

export async function POST(
  request: Request,
) {
  let runId: string | null = null;

  try {
    if (!(await requireAdmin())) {
      return forbidden();
    }

    let body: BenchmarkRequest = {};

    try {
      const text =
        await request.text();

      body = text.trim()
        ? (JSON.parse(
            text,
          ) as BenchmarkRequest)
        : {};
    } catch {
      return badRequest(
        "Invalid JSON body.",
      );
    }

    const providers =
      parseProviders(body.providers);

    if (!providers) {
      return badRequest(
        "Providers must be a non-empty array containing only mock, ollama, or openai.",
      );
    }

    const fallbackProvider =
      parseFallbackProvider(
        body.fallbackProvider,
      );

    if (fallbackProvider === undefined) {
      return badRequest(
        "Fallback provider must be mock, ollama, openai, or null.",
      );
    }

    const timeoutMs =
      parseBoundedInteger(
        body.timeoutMs,
        DEFAULT_TIMEOUT_MS,
        1000,
        120000,
      );

    if (timeoutMs === null) {
      return badRequest(
        "Timeout must be an integer between 1000 and 120000 milliseconds.",
      );
    }

    const maxRetries =
      parseBoundedInteger(
        body.maxRetries,
        DEFAULT_MAX_RETRIES,
        0,
        3,
      );

    if (maxRetries === null) {
      return badRequest(
        "Maximum retries must be an integer between 0 and 3.",
      );
    }

    const run =
      await prisma.providerBenchmarkRun.create({
        data: {
          status: "running",
          datasetVersion:
            DATASET_VERSION,
          testedProviders:
            providers.length,
          testCaseCount:
            benchmarkDataset.length,
          timeoutMs,
          maxRetries,
          fallbackEnabled:
            fallbackProvider !== null,
        },
      });

    runId = run.id;

    for (const provider of providers) {
      for (const item of benchmarkDataset) {
        const result =
          await generateWithAIRuntimeDetailed(
            {
              messages: [
                {
                  role: "system",
                  content:
                    buildOptimizerSystemPrompt(
                      item.category,
                    ),
                },
                {
                  role: "user",
                  content:
                    buildOptimizerUserPrompt({
                      prompt:
                        item.prompt,
                      category:
                        item.category,
                      model:
                        item.model,
                      goal:
                        item.goal,
                      depth:
                        item.depth,
                      outputFormat:
                        item.outputFormat,
                      personalStyle:
                        item.personalStyle,
                    }),
                },
              ],
              temperature: 0.2,
              maxTokens: 700,
              timeoutMs,
            },
            {
              providerName: provider,
              fallbackProviderName:
                fallbackProvider,
              timeoutMs,
              maxRetries,
              retryDelayMs: 250,
              operation:
                "provider_benchmark",
            },
          );

        const response =
          result.response;

        const metadata =
          result.metadata;

        await prisma.providerBenchmarkResult.create({
          data: {
            benchmarkRunId:
              run.id,
            testCaseId:
              item.id,
            promptTitle:
              item.title,
            category:
              item.category,
            provider,
            resolvedProvider:
              metadata.resolvedProvider,
            fallbackProvider:
              metadata.fallbackProvider,
            model:
              response.model,
            success:
              response.success,
            usedFallback:
              metadata.usedFallback,
            retryUsed:
              metadata.retryUsed,
            attemptCount:
              metadata.attemptCount,
            latencyMs:
              metadata.latencyMs,
            qualityScore:
              response.success
                ? calculateQualityScore(
                    item.prompt,
                    response.content,
                  )
                : 0,
            outputLength:
              response.content.length,
            outputExcerpt:
              response.content
                .trim()
                .slice(0, 500) ||
              null,
            error:
              response.error?.trim() ||
              null,
            errorType:
              classifyError(
                response.error,
              ),
            estimatedCostUsd:
              null,
          },
        });
      }
    }

    const completedRun =
      await prisma.providerBenchmarkRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: "completed",
          completedAt:
            new Date(),
        },
        include: {
          results: {
            orderBy: [
              {
                provider: "asc",
              },
              {
                testCaseId: "asc",
              },
            ],
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        run: completedRun,
        providerSummary:
          createProviderSummary(
            completedRun.results,
          ),
        notes: [
          "All selected providers were tested with the same repeatable dataset.",
          "Quality scores use deterministic structural and intent-preservation checks.",
          "Estimated cost remains unavailable because provider token usage is not currently exposed.",
        ],
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Provider benchmark POST error:",
      error,
    );

    if (runId) {
      try {
        await prisma.providerBenchmarkRun.update({
          where: {
            id: runId,
          },
          data: {
            status: "failed",
            completedAt:
              new Date(),
          },
        });
      } catch (updateError) {
        console.error(
          "Failed to mark benchmark run as failed:",
          updateError,
        );
      }
    }

    return internalServerError(
      "Provider benchmark execution failed.",
    );
  }
}
