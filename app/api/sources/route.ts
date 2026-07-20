import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  internalServerError,
} from "../../lib/api-response";
import { prisma } from "../../lib/prisma";
import { generateWithAIRuntime } from "../../lib/ai/runtime";

const ALLOWED_SOURCE_STATUSES = [
  "active",
  "paused",
  "archived",
] as const;

const ALLOWED_SCAN_FREQUENCIES = [
  "manual",
  "daily",
  "weekly",
  "monthly",
] as const;

const SCAN_COOLDOWN_MS = 10_000;

type SourceStatus =
  (typeof ALLOWED_SOURCE_STATUSES)[number];

type ScanFrequency =
  (typeof ALLOWED_SCAN_FREQUENCIES)[number];

type CreateSourceBody = {
  action?: "create";
  name?: unknown;
  type?: unknown;
  url?: unknown;
  credibilityScore?: unknown;
  status?: unknown;
  scanFrequency?: unknown;
};

type ScanSourceBody = {
  action: "scan";
  sourceId?: unknown;
};

type SourcePostBody =
  | CreateSourceBody
  | ScanSourceBody;

type SourceWithCount =
  Prisma.SourceGetPayload<{
    include: {
      _count: {
        select: {
          discoveredPrompts: true;
        };
      };
    };
  }>;

async function requireAdmin(): Promise<boolean> {
  const cookieStore =
    await cookies();

  const role =
    cookieStore.get(
      "wordsly_user_role",
    )?.value || "admin";

  return role === "admin";
}

function normalizeText(
  value: unknown,
  fallback = "",
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function normalizeNumber(
  value: unknown,
  fallback = 0,
): number {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(numberValue)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(numberValue),
    ),
  );
}

function isSourceStatus(
  value: string,
): value is SourceStatus {
  return ALLOWED_SOURCE_STATUSES.includes(
    value as SourceStatus,
  );
}

function isScanFrequency(
  value: string,
): value is ScanFrequency {
  return ALLOWED_SCAN_FREQUENCIES.includes(
    value as ScanFrequency,
  );
}

function formatDate(
  value: Date | null,
): string | null {
  return value
    ? value.toISOString()
    : null;
}

function formatSourceItem(
  item: SourceWithCount,
) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    url: item.url,
    credibilityScore:
      item.credibilityScore,
    status: item.status,

    lastScanAt:
      formatDate(item.lastScanAt),

    lastScanLabel:
      item.lastScanAt
        ? item.lastScanAt.toLocaleString()
        : "Never scanned",

    scanFrequency:
      item.scanFrequency,

    discoveredPromptCount:
      item._count.discoveredPrompts,

    createdAt:
      item.createdAt.toISOString(),

    updatedAt:
      item.updatedAt.toISOString(),

    storageMode:
      "sqlite_prisma",
  };
}

function buildMockPrompts(
  source: {
    id: string;
    name: string;
    type: string;
    url: string | null;
    credibilityScore: number;
  },
) {
  const timestamp =
    new Date().toISOString();

  const baseQuality =
    Math.max(
      50,
      Math.min(
        95,
        source.credibilityScore,
      ),
    );

  return [
    {
      sourceId:
        source.id,
      title:
        `${source.name} — Structured Research Prompt`,
      prompt:
        `Analyze the most useful information available from ${source.name}. ` +
        `Organize the response into key findings, supporting evidence, ` +
        `limitations, and practical recommendations.`,
      category:
        "Research",
      model:
        "General",
      qualityScore:
        baseQuality,
      sourceUrl:
        source.url,
      status:
        "pending",
      discoveredAt:
        new Date(timestamp),
    },
    {
      sourceId:
        source.id,
      title:
        `${source.name} — Content Improvement Prompt`,
      prompt:
        `Review content originating from ${source.name} and rewrite it ` +
        `to improve clarity, structure, accuracy, and usefulness while ` +
        `preserving the original meaning.`,
      category:
        "Writing",
      model:
        "General",
      qualityScore:
        Math.max(
          50,
          baseQuality - 5,
        ),
      sourceUrl:
        source.url,
      status:
        "pending",
      discoveredAt:
        new Date(timestamp),
    },
    {
      sourceId:
        source.id,
      title:
        `${source.name} — Expert Summary Prompt`,
      prompt:
        `Create an expert-level summary of information collected from ` +
        `${source.name}. Highlight essential concepts, important details, ` +
        `risks, and recommended next actions.`,
      category:
        "Summarization",
      model:
        "General",
      qualityScore:
        Math.max(
          50,
          baseQuality - 10,
        ),
      sourceUrl:
        source.url,
      status:
        "pending",
      discoveredAt:
        new Date(timestamp),
    },
  ];
}

function buildSourceScannerSystemPrompt(sourceName: string, sourceType: string): string {
  return `You are PromptMaster Ingestion Agent.
Your job is to simulate crawling the source "${sourceName}" (Type: "${sourceType}") and extract exactly 3 high-quality, realistic prompt engineering templates that are representative of what users share on this platform.

For each prompt, determine:
1. A descriptive title.
2. The complete prompt template content.
3. The prompt category (e.g. Coding, Writing, Image Generation, Research, General, etc.).
4. A qualityScore between 50 and 100 based on how well-structured and useful the prompt is.

Output the result in valid JSON only, conforming to the exact schema defined below. Do not wrap the JSON in markdown code blocks (\`\`\`), do not write explanations before or after the JSON.

Expected JSON output format:
{
  "prompts": [
    {
      "title": "Descriptive title 1",
      "prompt": "Full prompt template content 1",
      "category": "Category 1",
      "qualityScore": 85
    },
    {
      "title": "Descriptive title 2",
      "prompt": "Full prompt template content 2",
      "category": "Category 2",
      "qualityScore": 75
    },
    {
      "title": "Descriptive title 3",
      "prompt": "Full prompt template content 3",
      "category": "Category 3",
      "qualityScore": 90
    }
  ]
}`;
}

function buildSourceScannerUserPrompt(sourceName: string, sourceType: string, sourceUrl: string | null): string {
  const urlPart = sourceUrl ? ` located at URL: ${sourceUrl}` : "";
  return `Simulate crawling the source: "${sourceName}" (Type: ${sourceType})${urlPart}.
Generate exactly 3 high-quality prompt templates found on this source and return them in the expected JSON schema.`;
}

type ScannedPrompt = {
  title: string;
  prompt: string;
  category: string;
  qualityScore: number;
};

type ScannedResponseJson = {
  prompts?: ScannedPrompt[];
};

function parseSourceScanJson(text: string): ScannedResponseJson | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as ScannedResponseJson;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      const parsed = JSON.parse(match[0]) as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return null;
      }
      return parsed as ScannedResponseJson;
    } catch {
      return null;
    }
  }
}


export async function GET() {
  try {
    const isAdmin =
      await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access denied. Admin privileges required.",
        },
        {
          status: 403,
        },
      );
    }

    const items =
      await prisma.source.findMany({
        include: {
          _count: {
            select: {
              discoveredPrompts:
                true,
            },
          },
        },
        orderBy: {
          createdAt:
            "desc",
        },
      });

    const activeCount =
      items.filter(
        (item) =>
          item.status ===
          "active",
      ).length;

    const pausedCount =
      items.filter(
        (item) =>
          item.status ===
          "paused",
      ).length;

    const archivedCount =
      items.filter(
        (item) =>
          item.status ===
          "archived",
      ).length;

    const totalDiscoveredPrompts =
      items.reduce(
        (total, item) =>
          total +
          item._count
            .discoveredPrompts,
        0,
      );

    const averageCredibility =
      items.length === 0
        ? 0
        : Math.round(
            items.reduce(
              (sum, item) =>
                sum +
                item.credibilityScore,
              0,
            ) /
              items.length,
          );

    return NextResponse.json({
      success: true,
      items:
        items.map(
          formatSourceItem,
        ),
      count:
        items.length,
      activeCount,
      pausedCount,
      archivedCount,
      averageCredibility,
      totalDiscoveredPrompts,
      storageMode:
        "sqlite_prisma",
      message:
        "Sources loaded successfully.",
    });
  } catch (error) {
    console.error(
      "GET /api/sources error:",
      error,
    );

    return internalServerError(
      "Something went wrong while loading sources.",
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const isAdmin =
      await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access denied. Admin privileges required.",
        },
        {
          status: 403,
        },
      );
    }

    let body: SourcePostBody;

    try {
      body =
        (await request.json()) as SourcePostBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid JSON body.",
          storageMode:
            "sqlite_prisma",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * MODULE 8:
     * Scan an existing source and create discovered prompts
     * linked to the source.
     */
    if (
      body.action === "scan"
    ) {
      const sourceId =
        normalizeText(
          body.sourceId,
        );

      if (!sourceId) {
        return NextResponse.json(
          {
            success: false,
            scanStatus:
              "failed",
            error:
              "Source ID is required for scanning.",
          },
          {
            status: 400,
          },
        );
      }

      // 1. Fetch the source before calling the AI runtime.
      const source =
        await prisma.source.findUnique({
          where: {
            id: sourceId,
          },
        });

      if (!source) {
        return NextResponse.json(
          {
            success: false,
            scanStatus:
              "failed",
            error:
              "Source not found.",
          },
          {
            status: 404,
          },
        );
      }

      if (
        source.status !==
        "active"
      ) {
        return NextResponse.json(
          {
            success: false,
            scanStatus:
              "failed",
            error:
              `Only active sources can be scanned. Current status: ${source.status}.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        source.lastScanAt &&
        Date.now() -
          source.lastScanAt.getTime() <
          SCAN_COOLDOWN_MS
      ) {
        return NextResponse.json(
          {
            success: false,
            scanStatus:
              "failed",
            error:
              "This source was scanned recently. Please wait a few seconds before scanning again.",
            lastScanAt:
              source.lastScanAt.toISOString(),
          },
          {
            status: 409,
          },
        );
      }

      // 2. Use the AI runtime, with mock prompts as a safe fallback.
      let promptsToInsert =
        buildMockPrompts(
          source,
        );

      let scanProvider =
        "mock";

      try {
        const aiResponse =
          await generateWithAIRuntime({
            messages: [
              {
                role:
                  "system",
                content:
                  buildSourceScannerSystemPrompt(
                    source.name,
                    source.type,
                  ),
              },
              {
                role:
                  "user",
                content:
                  buildSourceScannerUserPrompt(
                    source.name,
                    source.type,
                    source.url,
                  ),
              },
            ],
            temperature:
              0.6,
          });

        if (aiResponse.success) {
          const parsed =
            parseSourceScanJson(
              aiResponse.content,
            );

          if (
            parsed?.prompts &&
            Array.isArray(
              parsed.prompts,
            )
          ) {
            const timestamp =
              new Date();

            const generatedPrompts =
              parsed.prompts
                .map(
                  (prompt) => ({
                    sourceId:
                      source.id,
                    title:
                      normalizeText(
                        prompt.title,
                      ) ||
                      `${source.name} prompt candidate`,
                    prompt:
                      normalizeText(
                        prompt.prompt,
                      ),
                    category:
                      normalizeText(
                        prompt.category,
                      ) ||
                      "General",
                    model:
                      "General",
                    qualityScore:
                      Math.max(
                        50,
                        Math.min(
                          100,
                          Math.round(
                            Number(
                              prompt.qualityScore,
                            ) ||
                              75,
                          ),
                        ),
                      ),
                    sourceUrl:
                      source.url,
                    status:
                      "pending",
                    discoveredAt:
                      timestamp,
                  }),
                )
                .filter(
                  (prompt) =>
                    Boolean(
                      prompt.prompt,
                    ),
                );

            if (
              generatedPrompts.length >
              0
            ) {
              promptsToInsert =
                generatedPrompts;

              scanProvider =
                aiResponse.provider;
            }
          }
        }
      } catch (error) {
        console.error(
          "AI scanning error, falling back to mock prompts:",
          error,
        );
      }

      // 3. Save the prompts and update the source timestamp atomically.
      const scanCompletedAt =
        new Date();

      const updatedSource =
        await prisma.$transaction(
          async (
            transaction,
          ) => {
            if (
              promptsToInsert.length >
              0
            ) {
              await transaction.discoveredPrompt.createMany({
                data:
                  promptsToInsert,
              });
            }

            return transaction.source.update({
              where: {
                id: sourceId,
              },
              data: {
                lastScanAt:
                  scanCompletedAt,
              },
              include: {
                _count: {
                  select: {
                    discoveredPrompts:
                      true,
                  },
                },
              },
            });
          },
        );

      const messageSuffix =
        scanProvider === "mock"
          ? "(mock generation fallback)"
          : `via ${scanProvider} engine`;

      return NextResponse.json(
        {
          success: true,
          scanStatus:
            "completed",
          message:
            `${promptsToInsert.length} discovered prompts were generated successfully ${messageSuffix}.`,
          createdCount:
            promptsToInsert.length,
          createdPrompts:
            promptsToInsert,
          item:
            formatSourceItem(
              updatedSource,
            ),
        },
        {
          status: 201,
        },
      );
    }

    const name =
      normalizeText(
        body.name,
      );

    const type =
      normalizeText(
        body.type,
        "Website",
      );

    const url =
      normalizeText(
        body.url,
      );

    const status =
      normalizeText(
        body.status,
        "active",
      );

    const scanFrequency =
      normalizeText(
        body.scanFrequency,
        "manual",
      );

    const credibilityScore =
      normalizeNumber(
        body.credibilityScore,
        70,
      );

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Source name is required.",
          storageMode:
            "sqlite_prisma",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isSourceStatus(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid source status.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isScanFrequency(
        scanFrequency,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid scan frequency.",
        },
        {
          status: 400,
        },
      );
    }

    const item =
      await prisma.source.create({
        data: {
          name,
          type,
          url:
            url || null,
          credibilityScore,
          status,
          scanFrequency,
        },
        include: {
          _count: {
            select: {
              discoveredPrompts:
                true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        success: true,
        item:
          formatSourceItem(
            item,
          ),
        storageMode:
          "sqlite_prisma",
        message:
          "Source created successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/sources error:",
      error,
    );

    return internalServerError(
      "Something went wrong while processing the source request.",
    );
  }
}

export async function DELETE(
  request: NextRequest,
) {
  try {
    const isAdmin =
      await requireAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Access denied. Admin privileges required.",
        },
        {
          status: 403,
        },
      );
    }

    const id =
      request.nextUrl.searchParams
        .get("id")
        ?.trim();

    if (id) {
      const existingSource =
        await prisma.source.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
          },
        });

      if (!existingSource) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Source not found.",
            deletedId:
              id,
            storageMode:
              "sqlite_prisma",
          },
          {
            status: 404,
          },
        );
      }

      await prisma.source.delete({
        where: {
          id,
        },
      });

      return NextResponse.json({
        success: true,
        message:
          "Source deleted successfully.",
        deletedId:
          id,
        storageMode:
          "sqlite_prisma",
      });
    }

    const result =
      await prisma.source.deleteMany();

    return NextResponse.json({
      success: true,
      message:
        "All sources deleted successfully.",
      deletedCount:
        result.count,
      count:
        0,
      storageMode:
        "sqlite_prisma",
    });
  } catch (error) {
    console.error(
      "DELETE /api/sources error:",
      error,
    );

    return internalServerError(
      "Something went wrong while deleting sources.",
    );
  }
}