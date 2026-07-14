import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

const ALLOWED_STATUSES = [
  "pending",
  "sent_to_curation",
  "approved",
  "rejected",
] as const;

type DiscoveryStatus = (typeof ALLOWED_STATUSES)[number];

function isValidStatus(status: string): status is DiscoveryStatus {
  return ALLOWED_STATUSES.includes(status as DiscoveryStatus);
}

function parseScore(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search")?.trim() ?? "";
    const sourceId = searchParams.get("sourceId")?.trim() ?? "";
    const category = searchParams.get("category")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const minimumScore = searchParams.get("minScore");

    if (status && status !== "all" && !isValidStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status.",
        },
        { status: 400 }
      );
    }

    const items = await prisma.discoveredPrompt.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                  },
                },
                {
                  prompt: {
                    contains: search,
                  },
                },
                {
                  category: {
                    contains: search,
                  },
                },
                {
                  model: {
                    contains: search,
                  },
                },
              ],
            }
          : {}),
        ...(sourceId && sourceId !== "all"
          ? {
              sourceId,
            }
          : {}),
        ...(category && category !== "all"
          ? {
              category,
            }
          : {}),
        ...(status && status !== "all"
          ? {
              status,
            }
          : {}),
        ...(minimumScore !== null
          ? {
              qualityScore: {
                gte: parseScore(minimumScore),
              },
            }
          : {}),
      },
      include: {
        source: true,
      },
      orderBy: {
        discoveredAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error("GET /api/discovery error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load discovered prompts.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";

    const category =
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : "General";

    const model =
      typeof body.model === "string" && body.model.trim()
        ? body.model.trim()
        : "General";

    const sourceUrl =
      typeof body.sourceUrl === "string" && body.sourceUrl.trim()
        ? body.sourceUrl.trim()
        : null;

    const sourceId =
      typeof body.sourceId === "string" && body.sourceId.trim()
        ? body.sourceId.trim()
        : null;

    const status =
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : "pending";

    const qualityScore = parseScore(body.qualityScore);

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required.",
        },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status.",
        },
        { status: 400 }
      );
    }

    if (sourceId) {
      const source = await prisma.source.findUnique({
        where: {
          id: sourceId,
        },
      });

      if (!source) {
        return NextResponse.json(
          {
            success: false,
            error: "Selected source does not exist.",
          },
          { status: 404 }
        );
      }
    }

    const item = await prisma.discoveredPrompt.create({
      data: {
        title,
        prompt,
        category,
        model,
        qualityScore,
        sourceUrl,
        sourceId,
        status,
      },
      include: {
        source: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Discovered prompt created successfully.",
        item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/discovery error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create discovered prompt.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id =
      typeof body.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt ID is required.",
        },
        { status: 400 }
      );
    }

    const existingItem = await prisma.discoveredPrompt.findUnique({
      where: {
        id,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Discovered prompt not found.",
        },
        { status: 404 }
      );
    }

    const updateData: {
      title?: string;
      prompt?: string;
      category?: string;
      model?: string;
      qualityScore?: number;
      sourceUrl?: string | null;
      sourceId?: string | null;
      status?: DiscoveryStatus;
    } = {};

    if (body.title !== undefined) {
      const title =
        typeof body.title === "string" ? body.title.trim() : "";

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            error: "Title cannot be empty.",
          },
          { status: 400 }
        );
      }

      updateData.title = title;
    }

    if (body.prompt !== undefined) {
      const prompt =
        typeof body.prompt === "string" ? body.prompt.trim() : "";

      if (!prompt) {
        return NextResponse.json(
          {
            success: false,
            error: "Prompt cannot be empty.",
          },
          { status: 400 }
        );
      }

      updateData.prompt = prompt;
    }

    if (body.category !== undefined) {
      updateData.category =
        typeof body.category === "string" && body.category.trim()
          ? body.category.trim()
          : "General";
    }

    if (body.model !== undefined) {
      updateData.model =
        typeof body.model === "string" && body.model.trim()
          ? body.model.trim()
          : "General";
    }

    if (body.qualityScore !== undefined) {
      updateData.qualityScore = parseScore(body.qualityScore);
    }

    if (body.sourceUrl !== undefined) {
      updateData.sourceUrl =
        typeof body.sourceUrl === "string" && body.sourceUrl.trim()
          ? body.sourceUrl.trim()
          : null;
    }

    if (body.sourceId !== undefined) {
      const sourceId =
        typeof body.sourceId === "string" && body.sourceId.trim()
          ? body.sourceId.trim()
          : null;

      if (sourceId) {
        const source = await prisma.source.findUnique({
          where: {
            id: sourceId,
          },
        });

        if (!source) {
          return NextResponse.json(
            {
              success: false,
              error: "Selected source does not exist.",
            },
            { status: 404 }
          );
        }
      }

      updateData.sourceId = sourceId;
    }

    if (body.status !== undefined) {
      const status =
        typeof body.status === "string" ? body.status.trim() : "";

      if (!isValidStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid status.",
          },
          { status: 400 }
        );
      }

      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid fields were provided.",
        },
        { status: 400 }
      );
    }

    const item = await prisma.discoveredPrompt.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        source: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Discovered prompt updated successfully.",
      item,
    });
  } catch (error) {
    console.error("PATCH /api/discovery error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update discovered prompt.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt ID is required.",
        },
        { status: 400 }
      );
    }

    const existingItem = await prisma.discoveredPrompt.findUnique({
      where: {
        id,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Discovered prompt not found.",
        },
        { status: 404 }
      );
    }

    await prisma.discoveredPrompt.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Discovered prompt deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("DELETE /api/discovery error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to delete discovered prompt.",
      },
      { status: 500 }
    );
  }
}