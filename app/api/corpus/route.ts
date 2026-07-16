import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../lib/prisma";
import { verifyToken } from "../../lib/auth";

export async function GET(request: Request) {
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
    const showArchived = url.searchParams.get("archived") === "true";

    const prompts = await prisma.corpusPrompt.findMany({
      where: {
        isArchived: showArchived,
      },
      orderBy: {
        createdAt: "desc",
      },
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
            patternsList = p.patterns.split(",").map(s => s.trim()).filter(Boolean);
          }
        } catch {
          patternsList = p.patterns.split(",").map(s => s.trim()).filter(Boolean);
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
      };
    });

    return NextResponse.json({
      success: true,
      items: formatted,
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
    const { id, title, prompt, improvedVersion, category, model, qualityScore, patterns, metadata, isArchived } = body;

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

      // Log previous version
      history.push({
        version: currentVersion,
        prompt: currentPrompt.prompt,
        improvedVersion: currentPrompt.improvedVersion || "",
        updatedAt: currentPrompt.updatedAt || new Date(),
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
