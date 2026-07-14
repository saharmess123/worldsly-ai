import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const prompts = await prisma.corpusPrompt.findMany({
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
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      items: formatted,
    });
  } catch (error: any) {
    console.error("Corpus GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch corpus prompts: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, prompt, improvedVersion, category, model, qualityScore, patterns, metadata } = body;

    if (!title || !prompt) {
      return NextResponse.json(
        { success: false, error: "Title and prompt are required." },
        { status: 400 }
      );
    }

    const patternsString = Array.isArray(patterns) ? JSON.stringify(patterns) : patterns || "[]";
    const metadataString = typeof metadata === "object" ? JSON.stringify(metadata) : metadata || "{}";

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
      },
    });

    return NextResponse.json({
      success: true,
      item: newPrompt,
    });
  } catch (error: any) {
    console.error("Corpus POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create corpus prompt: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
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
  } catch (error: any) {
    console.error("Corpus DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete corpus prompt: " + error.message },
      { status: 500 }
    );
  }
}
