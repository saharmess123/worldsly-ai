import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../lib/prisma";
import { verifyToken } from "../../lib/auth";

// GET: Extended search, filters, sorting, versioning, and pagination
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wordsly_session")?.value || "";
    const session = verifyToken(token);

    // Read queries allowed for authenticated users or admins; optional public fallback
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q") || url.searchParams.get("search") || "";
    const categoryParam = url.searchParams.get("category");
    const modelParam = url.searchParams.get("model");
    const minScoreParam = url.searchParams.get("minScore");
    const versionParam = url.searchParams.get("version");
    const archivedParam = url.searchParams.get("archived");

    const sortByParam = url.searchParams.get("sortBy") || "createdAt";
    const sortOrderParam = (url.searchParams.get("sortOrder") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    const pageParam = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limitParam = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

    // Construct Prisma where conditions
    const whereClause: any = {};

    if (archivedParam === "true") {
      whereClause.isArchived = true;
    } else if (archivedParam === "all") {
      // Return both archived and active
    } else {
      whereClause.isArchived = false;
    }

    if (categoryParam && categoryParam !== "All") {
      whereClause.category = categoryParam;
    }

    if (modelParam && modelParam !== "All Models" && modelParam !== "All") {
      whereClause.model = { contains: modelParam };
    }

    if (minScoreParam && !isNaN(Number(minScoreParam))) {
      whereClause.qualityScore = { gte: Number(minScoreParam) };
    }

    if (versionParam && !isNaN(Number(versionParam))) {
      whereClause.version = Number(versionParam);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      whereClause.OR = [
        { title: { contains: q } },
        { prompt: { contains: q } },
        { category: { contains: q } },
        { patterns: { contains: q } },
        { improvedVersion: { contains: q } },
      ];
    }

    // Determine allowed sorting field
    const allowedSortFields = ["createdAt", "updatedAt", "qualityScore", "title", "version"];
    const sortByField = allowedSortFields.includes(sortByParam) ? sortByParam : "createdAt";

    // Count total matching items
    const totalItems = await prisma.corpusPrompt.count({
      where: whereClause,
    });

    // Fetch paginated items
    const prompts = await prisma.corpusPrompt.findMany({
      where: whereClause,
      orderBy: {
        [sortByField]: sortOrderParam,
      },
      skip: (pageParam - 1) * limitParam,
      take: limitParam,
    });

    const formatted = prompts.map((p) => {
      let metadataObj = {};
      try {
        metadataObj = p.metadata ? JSON.parse(p.metadata) : {};
      } catch (e) {
        console.error("Failed to parse metadata JSON", e);
      }

      let patternsList: string[] = [];
      if (p.patterns) {
        try {
          patternsList = JSON.parse(p.patterns);
          if (!Array.isArray(patternsList)) {
            patternsList = p.patterns.split(",").map((s) => s.trim()).filter(Boolean);
          }
        } catch {
          patternsList = p.patterns.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }

      return {
        id: p.id,
        title: p.title,
        prompt: p.prompt,
        improvedVersion: p.improvedVersion || "",
        category: p.category,
        model: p.model,
        qualityScore: p.qualityScore,
        patterns: patternsList,
        metadata: metadataObj,
        isArchived: p.isArchived,
        version: p.version,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    const totalPages = Math.ceil(totalItems / limitParam);

    return NextResponse.json({
      success: true,
      items: formatted,
      pagination: {
        total: totalItems,
        page: pageParam,
        limit: limitParam,
        totalPages,
        hasMore: pageParam < totalPages,
      },
      filters: {
        search: searchQuery,
        category: categoryParam || "All",
        model: modelParam || "All",
        minScore: minScoreParam ? Number(minScoreParam) : 0,
        archived: archivedParam || "false",
        sortBy: sortByField,
        sortOrder: sortOrderParam,
      },
    });
  } catch (error) {
    console.error("Corpus GET error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch corpus prompts: " + message },
      { status: 500 }
    );
  }
}

// POST: Create a new Corpus prompt (Admin restricted)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wordsly_session")?.value || "";
    const session = verifyToken(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { title, prompt, improvedVersion, category, model, qualityScore, patterns, metadata, force } = body;

    if (!title || !prompt) {
      return NextResponse.json(
        { success: false, error: "Title and prompt are required." },
        { status: 400 }
      );
    }

    if (!force) {
      const existing = await prisma.corpusPrompt.findFirst({
        where: {
          prompt: prompt.trim(),
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: "A prompt with this exact content already exists in the Corpus.",
            duplicateId: existing.id,
          },
          { status: 409 }
        );
      }
    }

    const patternsString = Array.isArray(patterns) ? JSON.stringify(patterns) : patterns || "[]";
    const metadataObj = typeof metadata === "object" ? (metadata || {}) : {};

    if (!metadataObj.approvedDate) {
      metadataObj.approvedDate = new Date().toISOString();
    }
    const metadataString = JSON.stringify(metadataObj);

    const newPrompt = await prisma.corpusPrompt.create({
      data: {
        title,
        prompt,
        improvedVersion: improvedVersion || "",
        category: category || "General",
        model: model || "General",
        qualityScore: Number(qualityScore) || 0,
        patterns: patternsString,
        metadata: metadataString,
        isArchived: false,
        version: 1,
      },
    });

    return NextResponse.json({
      success: true,
      item: newPrompt,
    });
  } catch (error) {
    console.error("Corpus POST error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to create corpus prompt: " + message },
      { status: 500 }
    );
  }
}

// PUT: Full update with version increment & history logging (Admin restricted)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wordsly_session")?.value || "";
    const session = verifyToken(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { id, title, prompt, improvedVersion, category, model, qualityScore, patterns, metadata, isArchived, changeNote } = body;

    if (!id || !title || !prompt) {
      return NextResponse.json(
        { success: false, error: "ID, title, and prompt are required." },
        { status: 400 }
      );
    }

    const currentPrompt = await prisma.corpusPrompt.findUnique({
      where: { id },
    });

    if (!currentPrompt) {
      return NextResponse.json(
        { success: false, error: "Corpus prompt not found." },
        { status: 404 }
      );
    }

    let existingMetadata: {
      versionHistory?: Array<{
        version: number;
        prompt: string;
        improvedVersion: string;
        updatedAt: Date | string;
        changeNote?: string;
      }>;
      version?: number;
      [key: string]: unknown;
    } = {};
    try {
      existingMetadata = currentPrompt.metadata ? JSON.parse(currentPrompt.metadata) : {};
    } catch {
      existingMetadata = {};
    }

    // Check if prompt or improvedVersion has changed
    const hasPromptChanged = currentPrompt.prompt !== prompt;
    const hasImprovedChanged = (currentPrompt.improvedVersion || "") !== (improvedVersion || "");
    let nextVersion = currentPrompt.version;

    if (hasPromptChanged || hasImprovedChanged) {
      const history = Array.isArray(existingMetadata.versionHistory) ? existingMetadata.versionHistory : [];
      const currentVersion = currentPrompt.version;

      // Log previous version in versionHistory array
      history.push({
        version: currentVersion,
        prompt: currentPrompt.prompt,
        improvedVersion: currentPrompt.improvedVersion || "",
        updatedAt: currentPrompt.updatedAt || new Date(),
        changeNote: changeNote || "Updated prompt structure and content.",
      });

      existingMetadata.versionHistory = history;
      nextVersion = currentVersion + 1;
    }

    const incomingMetadata = typeof metadata === "object" ? metadata : {};
    const mergedMetadata = {
      ...existingMetadata,
      ...incomingMetadata,
      versionHistory: existingMetadata.versionHistory || [],
      version: nextVersion,
    };

    const patternsString = Array.isArray(patterns) ? JSON.stringify(patterns) : patterns || "[]";
    const metadataString = JSON.stringify(mergedMetadata);

    const updatedPrompt = await prisma.corpusPrompt.update({
      where: { id },
      data: {
        title,
        prompt,
        improvedVersion: improvedVersion || "",
        category: category || "General",
        model: model || "General",
        qualityScore: Number(qualityScore) || 0,
        patterns: patternsString,
        metadata: metadataString,
        isArchived: isArchived !== undefined ? Boolean(isArchived) : currentPrompt.isArchived,
        version: nextVersion,
      },
    });

    return NextResponse.json({
      success: true,
      item: updatedPrompt,
    });
  } catch (error) {
    console.error("Corpus PUT error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to update corpus prompt: " + message },
      { status: 500 }
    );
  }
}

// PATCH: Quick archive / unarchive or status toggle (Admin restricted)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wordsly_session")?.value || "";
    const session = verifyToken(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { id, isArchived, qualityScore, category } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID parameter is required." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (isArchived !== undefined) updateData.isArchived = Boolean(isArchived);
    if (qualityScore !== undefined) updateData.qualityScore = Number(qualityScore);
    if (category !== undefined) updateData.category = category;

    const updated = await prisma.corpusPrompt.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      item: updated,
      message: `Corpus prompt ${updated.isArchived ? "archived" : "unarchived"} successfully.`,
    });
  } catch (error) {
    console.error("Corpus PATCH error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to patch corpus prompt: " + message },
      { status: 500 }
    );
  }
}

// DELETE: Delete Corpus prompt (Admin restricted)
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("wordsly_session")?.value || "";
    const session = verifyToken(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID parameter is required." },
        { status: 400 }
      );
    }

    await prisma.corpusPrompt.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Corpus prompt deleted successfully.",
    });
  } catch (error) {
    console.error("Corpus DELETE error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to delete corpus prompt: " + message },
      { status: 500 }
    );
  }
}
