import { NextRequest, NextResponse } from "next/server";
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

type ReviewStatus =
  (typeof ALLOWED_REVIEW_STATUSES)[number];

type RiskLevel =
  (typeof ALLOWED_RISK_LEVELS)[number];

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

export async function GET() {
  try {
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

      if (latestReview.status === "approved") {
        approvedCount += 1;
      }

      if (latestReview.status === "rejected") {
        rejectedCount += 1;
      }

      if (latestReview.status === "risky") {
        riskyCount += 1;
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
    const body = await request.json();

    const discoveredPromptId =
      typeof body.discoveredPromptId ===
        "string"
        ? body.discoveredPromptId.trim()
        : "";

    const reviewerId =
      typeof body.reviewerId === "string" &&
      body.reviewerId.trim()
        ? body.reviewerId.trim()
        : null;

    const status =
      typeof body.status === "string"
        ? body.status.trim()
        : "";

    const riskLevel =
      typeof body.riskLevel === "string"
        ? body.riskLevel.trim()
        : "";

    const reviewReason =
      typeof body.reviewReason === "string"
        ? body.reviewReason.trim()
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

    const allowedPromptStatuses = [
      "sent_to_curation",
      "approved",
      "rejected",
    ];

    if (
      !allowedPromptStatuses.includes(
        discoveredPrompt.status
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

          let discoveryStatus =
            "sent_to_curation";

          if (status === "approved") {
            discoveryStatus = "approved";
          }

          if (status === "rejected") {
            discoveryStatus = "rejected";
          }

          if (status === "risky") {
            discoveryStatus =
              "sent_to_curation";
          }

          const updatedPrompt =
            await transaction.discoveredPrompt.update({
              where: {
                id: discoveredPromptId,
              },
              data: {
                status: discoveryStatus,
              },
              include: {
                source: true,
                curationReviews: {
                  orderBy: {
                    createdAt: "desc",
                  },
                },
              },
            });

          return {
            review,
            updatedPrompt,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Curation review saved successfully.",
        review: result.review,
        item: result.updatedPrompt,
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

    await prisma.$transaction(
      async (transaction) => {
        await transaction.curationReview.delete({
          where: {
            id,
          },
        });

        const remainingReviews =
          await transaction.curationReview.findMany({
            where: {
              discoveredPromptId:
                review.discoveredPromptId,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

        const latestReview =
          remainingReviews[0];

        let nextStatus =
          "sent_to_curation";

        if (
          latestReview?.status ===
          "approved"
        ) {
          nextStatus = "approved";
        }

        if (
          latestReview?.status ===
          "rejected"
        ) {
          nextStatus = "rejected";
        }

        if (
          latestReview?.status ===
          "risky"
        ) {
          nextStatus =
            "sent_to_curation";
        }

        await transaction.discoveredPrompt.update({
          where: {
            id:
              review.discoveredPromptId,
          },
          data: {
            status: nextStatus,
          },
        });
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "Curation review deleted successfully.",
      deletedId: id,
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