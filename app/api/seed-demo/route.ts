import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

const demoSources = [
  { id: "src_github", name: "GitHub Awesome Prompts", type: "github", credibilityScore: 92 },
  { id: "src_reddit", name: "r/PromptDesign", type: "reddit", credibilityScore: 85 }
];

const demoDiscovered = [
  {
    sourceId: "src_github",
    title: "SQL Query Generator Helper",
    prompt: "Act as an expert SQL database administrator. Write an optimized SQL query based on this description: [description]. Check table relationships and use appropriate JOIN statements.",
    category: "Coding",
    model: "Coding Assistant",
    qualityScore: 84,
    status: "pending",
    sourceUrl: "https://github.com/prompts/sql-helper"
  },
  {
    sourceId: "src_reddit",
    title: "SEO Article Brief Writer",
    prompt: "Generate a detailed SEO content brief for the topic: [topic]. Include suggested title tags, meta description constraints, head keyword density targets, and secondary bullet points.",
    category: "Marketing",
    model: "Claude style",
    qualityScore: 78,
    status: "pending",
    sourceUrl: "https://reddit.com/r/PromptDesign/seo-brief"
  }
];

const demoCorpus = [
  {
    title: "JavaScript Component Maker",
    prompt: "Write a modern React component in TypeScript. Props: [props]. Ensure accessibility using ARIA attributes and type safety.",
    improvedVersion: "Act as a senior frontend engineer. Build a highly optimized React component in TypeScript using the following props: [props]. Requirements: 1. Ensure absolute type safety. 2. Implement full ARIA accessibility standards. 3. Structure imports neatly. 4. Write inline JSDoc comments.",
    category: "Coding",
    model: "Coding Assistant",
    qualityScore: 89,
    patterns: JSON.stringify(["Persona", "Structured Guidelines"]),
    isArchived: false,
    version: 1,
    metadata: JSON.stringify({
      approvedDate: new Date().toISOString(),
      tags: ["react", "frontend", "typescript"],
      source: { name: "GitHub" },
      curation: { reviewer: "Ines", reason: "Highly reusable structural prompt template" }
    })
  }
];

const demoOptimizations = [
  {
    originalPrompt: "Write a good prompt for an image of AI helping people write better prompts.",
    improvedPrompt: "Create a high-quality futuristic image showing an AI assistant helping creators improve their prompts. The scene should include a clean digital workspace, glowing prompt cards, structured text blocks, and a visual transformation from weak prompts to optimized prompts. Use a modern SaaS style, blue and cyan lighting, professional composition, and a polished product-marketing look.",
    category: "Image Generation",
    model: "Midjourney",
    goal: "More visual and structured",
    depth: "Detailed",
    outputFormat: "Image prompt",
    originalScore: 34,
    improvedScore: 88,
    engineStatus: "mock_api"
  }
];

async function handleSeed() {
  try {
    // Clear existing tables
    await prisma.feedback.deleteMany();
    await prisma.optimization.deleteMany();
    await prisma.trainingSignal.deleteMany();
    await prisma.corpusPrompt.deleteMany();
    await prisma.curationReview.deleteMany();
    await prisma.discoveredPrompt.deleteMany();
    await prisma.source.deleteMany();

    // 1. Seed Sources
    for (const src of demoSources) {
      await prisma.source.create({ data: src });
    }

    // 2. Seed Discovered Prompts
    for (const disc of demoDiscovered) {
      await prisma.discoveredPrompt.create({ data: disc });
    }

    // 3. Seed Corpus Prompts
    for (const cp of demoCorpus) {
      await prisma.corpusPrompt.create({ data: cp });
    }

    // 4. Seed Optimizations & Feedbacks
    for (const record of demoOptimizations) {
      const opt = await prisma.optimization.create({
        data: {
          originalPrompt: record.originalPrompt,
          improvedPrompt: record.improvedPrompt,
          category: record.category,
          model: record.model,
          goal: record.goal,
          depth: record.depth,
          outputFormat: record.outputFormat,
          originalScore: record.originalScore,
          improvedScore: record.improvedScore,
          engineStatus: record.engineStatus,
        },
      });

      await prisma.feedback.create({
        data: {
          optimizationId: opt.id,
          rating: "useful",
          originalPrompt: record.originalPrompt,
          improvedPrompt: record.improvedPrompt,
          category: record.category,
          model: record.model,
          goal: record.goal,
          depth: record.depth,
          outputFormat: record.outputFormat,
          engineStatus: record.engineStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded with rich demo playground successfully.",
      seeded: {
        sources: demoSources.length,
        discovered: demoDiscovered.length,
        corpus: demoCorpus.length,
        optimizations: demoOptimizations.length
      }
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to seed demo database: " + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}