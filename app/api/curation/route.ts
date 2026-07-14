import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "../../lib/prisma";

const ALLOWED_REVIEW_STATUSES = [
  "approved",
  "rejected",
  "risky",
] as const;

const ALLOWED_RISK_LEVELS = [
  "low",
  "medium",
  "high",
] as const;

const CURATION_PROMPT_STATUSES = [
  "sent_to_curation",
  "approved",
  "rejected",
] as const;

type ReviewStatus =
  (typeof ALLOWED_REVIEW_STATUSES)[number];

type RiskLevel =
  (typeof ALLOWED_RISK_LEVELS)[number];

async function requireAdmin() {
  const cookieStore = await cookies();

  const role =
    cookieStore.get("wordsly_user_role")
      ?.value || "admin";

  return role === "admin";
}

function isValidReviewStatus(
  value: string
): value is ReviewStatus {
  return ALLOWED_REVIEW_STATUSES.includes(
    value as ReviewStatus
  );
}

function isValidRiskLevel(
  value: string
): value is RiskLevel {
  return ALLOWED_RISK_LEVELS.includes(
    value as RiskLevel
  );
}

function getDiscoveryStatus(
  reviewStatus?: string
) {
  if (reviewStatus === "approved") {
    return "approved";
  }

  if (reviewStatus === "rejected") {
    return "rejected";
  }

  return "sent_to_curation";
}

async function syncApprovedPromptPipeline(
  transaction: Prisma.TransactionClient,
  discoveredPromptId: string,
  review: {
    id: string;
    reviewerId: string | null;
    status: string;
    riskLevel: string;
    reviewReason: string | null;
    createdAt: Date;
  } | null
) {
  const discoveredPrompt =
    await transaction.discoveredPrompt.findUnique({
      where: {
        id: discoveredPromptId,
      },
      include: {
        source: true,
      },
    });

  if (!discoveredPrompt) {
    throw new Error(
      "Discovered prompt could not be loaded."
    );
  }

  /*
   * A prompt remains in Corpus and Training Signals
   * only when its latest Curation review is approved.
   *
   * TrainingSignal uses onDelete: Cascade, so deleting
   * the CorpusPrompt also removes its linked signal.
   */
  if (review?.status !== "approved") {
    await transaction.corpusPrompt.deleteMany({
      where: {
        discoveredPromptId,
      },
    });

    return {
      corpusPrompt: null,
      trainingSignal: null,
    };
  }

  const corpusMetadata = {
    pipelineSource: "curation",
    discoveredPromptId:
      discoveredPrompt.id,
    curationReviewId: review.id,
    reviewerId: review.reviewerId,
    reviewStatus: review.status,
    reviewReason: review.reviewReason,
    riskLevel: review.riskLevel,
    sourceUrl:
      discoveredPrompt.sourceUrl,
    source: discoveredPrompt.source
      ? {
          id: discoveredPrompt.source.id,
          name: discoveredPrompt.source.name,
          type: discoveredPrompt.source.type,
          url: discoveredPrompt.source.url,
          credibilityScore:
            discoveredPrompt.source
              .credibilityScore,
        }
      : null,
    discoveredAt:
      discoveredPrompt.discoveredAt,
    approvedAt: review.createdAt,
  };

  /*
   * discoveredPromptId is unique in CorpusPrompt.
   * This prevents duplicate Corpus records.
   */
  const corpusPrompt =
    await transaction.corpusPrompt.upsert({
      where: {
        discoveredPromptId,
      },
      create: {
        discoveredPromptId,
        title: discoveredPrompt.title,
        prompt: discoveredPrompt.prompt,
        improvedVersion: null,
        category:
          discoveredPrompt.category ||
          "General",
        model:
          discoveredPrompt.model ||
          "General",
        qualityScore:
          discoveredPrompt.qualityScore,
        patterns: JSON.stringify([]),
        metadata:
          JSON.stringify(corpusMetadata),
      },
      update: {
        title: discoveredPrompt.title,
        prompt: discoveredPrompt.prompt,
        category:
          discoveredPrompt.category ||
          "General",
        model:
          discoveredPrompt.model ||
          "General",
        qualityScore:
          discoveredPrompt.qualityScore,
        metadata:
          JSON.stringify(corpusMetadata),
      },
    });

  const deduplicationKey =
    `corpus:${corpusPrompt.id}:curated`;

  const trainingMetadata = {
    pipelineSource:
      "curation_to_corpus",
    discoveredPromptId:
      discoveredPrompt.id,
    corpusPromptId:
      corpusPrompt.id,
    curationReviewId: review.id,
    reviewerId: review.reviewerId,
    reviewReason: review.reviewReason,
    riskLevel: review.riskLevel,
    title: corpusPrompt.title,
    prompt: corpusPrompt.prompt,
    improvedVersion:
      corpusPrompt.improvedVersion,
    category: corpusPrompt.category,
    model: corpusPrompt.model,
    qualityScore:
      corpusPrompt.qualityScore,
    approvedAt: review.createdAt,
  };

  /*
   * deduplicationKey is unique in TrainingSignal.
   * Repeated approval updates the existing signal.
   */
  const trainingSignal =
    await transaction.trainingSignal.upsert({
      where: {
        deduplicationKey,
      },
      create: {
        deduplicationKey,
        sourceType: "corpus",
        sourceId: discoveredPrompt.id,
        corpusId: corpusPrompt.id,
        signalType: "curated",
        score: corpusPrompt.qualityScore,
        metadata:
          JSON.stringify(trainingMetadata),
      },
      update: {
        sourceType: "corpus",
        sourceId: discoveredPrompt.id,
        corpusId: corpusPrompt.id,
        signalType: "curated",
        score: corpusPrompt.qualityScore,
        metadata:
          JSON.stringify(trainingMetadata),
      },
    });

  return {
    corpusPrompt,
    trainingSignal,
  };
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
        }
      );
    }

    const items =
      await prisma.discoveredPrompt.findMany({
        where: {
          status: {
            in: [
              "sent_to_curation",
              "approved",
              "rejected",
            ],
          },
        },
        include: {
          source: true,
          corpusPrompt: {
            include: {
              trainingSignals: true,
            },
          },
          curationReviews: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          discoveredAt: "desc",
        },
      });

    let approvedCount = 0;
    let rejectedCount = 0;
    let riskyCount = 0;
    let pendingCount = 0;

    for (const item of items) {
      const latestReview =
        item.curationReviews[0];

      if (!latestReview) {
        pendingCount += 1;
        continue;
      }

      if (
        latestReview.status === "approved"
      ) {
        approvedCount += 1;
      } else if (
        latestReview.status === "rejected"
      ) {
        rejectedCount += 1;
      } else if (
        latestReview.status === "risky"
      ) {
        riskyCount += 1;
      } else {
        pendingCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
      approvedCount,
      rejectedCount,
      riskyCount,
      pendingCount,
    });
  } catch (error) {
    console.error(
      "GET /api/curation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load the Curation queue.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
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
        }
      );
    }

    const body: unknown =
      await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid request body is required.",
        },
        {
          status: 400,
        }
      );
    }

    const input =
      body as Record<string, unknown>;

    const discoveredPromptId =
      typeof input.discoveredPromptId ===
      "string"
        ? input.discoveredPromptId.trim()
        : "";

    const reviewerId =
      typeof input.reviewerId ===
        "string" &&
      input.reviewerId.trim()
        ? input.reviewerId.trim()
        : null;

    const status =
      typeof input.status === "string"
        ? input.status.trim()
        : "";

    const riskLevel =
      typeof input.riskLevel === "string"
        ? input.riskLevel.trim()
        : "";

    const reviewReason =
      typeof input.reviewReason ===
      "string"
        ? input.reviewReason.trim()
        : "";

    if (!discoveredPromptId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Discovered prompt ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidReviewStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid review status.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidRiskLevel(riskLevel)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid risk level.",
        },
        {
          status: 400,
        }
      );
    }

    if (!reviewReason) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Review reason is required.",
        },
        {
          status: 400,
        }
      );
    }

    const discoveredPrompt =
      await prisma.discoveredPrompt.findUnique({
        where: {
          id: discoveredPromptId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!discoveredPrompt) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Discovered prompt not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !CURATION_PROMPT_STATUSES.includes(
        discoveredPrompt.status as
          (typeof CURATION_PROMPT_STATUSES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This prompt is not available for Curation review.",
        },
        {
          status: 400,
        }
      );
    }

    if (reviewerId) {
      const reviewer =
        await prisma.user.findUnique({
          where: {
            id: reviewerId,
          },
          select: {
            id: true,
          },
        });

      if (!reviewer) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Reviewer not found.",
          },
          {
            status: 404,
          }
        );
      }
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const review =
            await transaction.curationReview.create({
              data: {
                discoveredPromptId,
                reviewerId,
                status,
                riskLevel,
                reviewReason,
              },
            });

          const discoveryStatus =
            getDiscoveryStatus(status);

          await transaction.discoveredPrompt.update({
            where: {
              id: discoveredPromptId,
            },
            data: {
              status: discoveryStatus,
            },
          });

          const pipelineResult =
            await syncApprovedPromptPipeline(
              transaction,
              discoveredPromptId,
              review
            );

          const updatedPrompt =
            await transaction.discoveredPrompt.findUniqueOrThrow(
              {
                where: {
                  id: discoveredPromptId,
                },
                include: {
                  source: true,
                  corpusPrompt: {
                    include: {
                      trainingSignals: true,
                    },
                  },
                  curationReviews: {
                    orderBy: {
                      createdAt: "desc",
                    },
                  },
                },
              }
            );

          return {
            review,
            updatedPrompt,
            corpusPrompt:
              pipelineResult.corpusPrompt,
            trainingSignal:
              pipelineResult.trainingSignal,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,
        message:
          status === "approved"
            ? "Approved and added to Corpus. A Training Signal was also created."
            : status === "rejected"
              ? "Prompt rejected and removed from the Corpus and Training Signals."
              : "Prompt marked as risky and kept in the Curation queue.",
        review: result.review,
        item: result.updatedPrompt,
        corpusPrompt:
          result.corpusPrompt,
        trainingSignal:
          result.trainingSignal,
        addedToCorpus:
          result.corpusPrompt !== null,
        addedToTraining:
          result.trainingSignal !== null,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/curation error:",
      error
    );

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The request body contains invalid JSON.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to save the Curation review.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest
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
        }
      );
    }

    const id =
      request.nextUrl.searchParams
        .get("id")
        ?.trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Curation review ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const review =
      await prisma.curationReview.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          discoveredPromptId: true,
        },
      });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Curation review not found.",
        },
        {
          status: 404,
        }
      );
    }

    const result =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.curationReview.delete({
            where: {
              id,
            },
          });

          const latestReview =
            await transaction.curationReview.findFirst({
              where: {
                discoveredPromptId:
                  review.discoveredPromptId,
              },
              orderBy: {
                createdAt: "desc",
              },
            });

          const nextStatus =
            getDiscoveryStatus(
              latestReview?.status
            );

          await transaction.discoveredPrompt.update({
            where: {
              id:
                review.discoveredPromptId,
            },
            data: {
              status: nextStatus,
            },
          });

          const pipelineResult =
            await syncApprovedPromptPipeline(
              transaction,
              review.discoveredPromptId,
              latestReview
            );

          const updatedPrompt =
            await transaction.discoveredPrompt.findUniqueOrThrow(
              {
                where: {
                  id:
                    review.discoveredPromptId,
                },
                include: {
                  source: true,
                  corpusPrompt: {
                    include: {
                      trainingSignals: true,
                    },
                  },
                  curationReviews: {
                    orderBy: {
                      createdAt: "desc",
                    },
                  },
                },
              }
            );

          return {
            latestReview,
            corpusPrompt:
              pipelineResult.corpusPrompt,
            trainingSignal:
              pipelineResult.trainingSignal,
            updatedPrompt,
          };
        }
      );

    return NextResponse.json({
      success: true,
      message:
        "Curation review deleted and the full pipeline was synchronized successfully.",
      deletedId: id,
      latestReview:
        result.latestReview,
      item: result.updatedPrompt,
      corpusPrompt:
        result.corpusPrompt,
      trainingSignal:
        result.trainingSignal,
      addedToCorpus:
        result.corpusPrompt !== null,
      addedToTraining:
        result.trainingSignal !== null,
    });
  } catch (error) {
    console.error(
      "DELETE /api/curation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to delete the Curation review.",
      },
      {
        status: 500,
      }
    );
  }
}