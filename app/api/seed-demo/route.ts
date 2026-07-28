import { NextResponse } from "next/server";
import { forbidden, internalServerError } from "../../lib/api-response";
import { prisma } from "../../lib/prisma";

const demoSources = [
  {
    id: "src_github",
    name: "GitHub Awesome Prompts",
    type: "github",
    credibilityScore: 92,
  },
  {
    id: "src_reddit",
    name: "r/PromptDesign",
    type: "reddit",
    credibilityScore: 85,
  },
];

const demoDiscovered = [
  {
    sourceId: "src_github",
    title: "SQL Query Generator Helper",
    prompt:
      "Act as an expert SQL database administrator. Write an optimized SQL query based on this description: [description]. Check table relationships and use appropriate JOIN statements.",
    category: "Coding",
    model: "Coding Assistant",
    qualityScore: 84,
    status: "pending",
    sourceUrl: "https://github.com/prompts/sql-helper",
  },
  {
    sourceId: "src_reddit",
    title: "SEO Article Brief Writer",
    prompt:
      "Generate a detailed SEO content brief for the topic: [topic]. Include suggested title tags, meta description constraints, head keyword density targets, and secondary bullet points.",
    category: "Marketing",
    model: "Claude style",
    qualityScore: 78,
    status: "pending",
    sourceUrl:
      "https://reddit.com/r/PromptDesign/seo-brief",
  },
];

const demoCorpus = [
  {
    title: "JavaScript Component Maker",
    prompt:
      "Write a modern React component in TypeScript. Props: [props]. Ensure accessibility using ARIA attributes and type safety.",
    improvedVersion:
      "Act as a senior frontend engineer. Build a highly optimized React component in TypeScript using the following props: [props]. Requirements: 1. Ensure absolute type safety. 2. Implement full ARIA accessibility standards. 3. Structure imports neatly. 4. Write inline JSDoc comments.",
    category: "Coding",
    model: "Coding Assistant",
    qualityScore: 89,
    patterns: JSON.stringify([
      "Persona",
      "Structured Guidelines",
    ]),
    isArchived: false,
    version: 1,
    metadata: JSON.stringify({
      approvedDate: new Date().toISOString(),
      tags: [
        "react",
        "frontend",
        "typescript",
      ],
      source: {
        name: "GitHub",
      },
      curation: {
        reviewer: "Ines",
        reason:
          "Highly reusable structural prompt template",
      },
    }),
  },
];

const demoOptimizations = [
  {
    originalPrompt:
      "Write a good prompt for an image of AI helping people write better prompts.",
    improvedPrompt:
      "Create a high-quality futuristic image showing an AI assistant helping creators improve their prompts. The scene should include a clean digital workspace, glowing prompt cards, structured text blocks, and a visual transformation from weak prompts to optimized prompts. Use a modern SaaS style, blue and cyan lighting, professional composition, and a polished product-marketing look.",
    category: "Image Generation",
    model: "Midjourney",
    goal: "More visual and structured",
    depth: "Detailed",
    outputFormat: "Image prompt",
    originalScore: 34,
    improvedScore: 88,
    engineStatus: "mock_api",
  },
];

async function handleSeed() {
  // Guard 1: Keep production data separate and prevent seeding in production
  if (process.env.NODE_ENV === "production") {
    return forbidden("Database seeding is disabled in production environments to protect live data.");
  }

  try {
    let createdSources = 0;
    let createdDiscovered = 0;
    let createdCorpus = 0;
    let createdOptimizations = 0;

    // 1. Guarded seeding for Sources: upsert to prevent duplicates
    for (const source of demoSources) {
      await prisma.source.upsert({
        where: { id: source.id },
        update: {
          name: source.name,
          type: source.type,
          credibilityScore: source.credibilityScore,
        },
        create: source,
      });
      createdSources++;
    }

    // 2. Guarded seeding for Discovered Prompts: check if already exists by title
    for (const discoveredPrompt of demoDiscovered) {
      const existing = await prisma.discoveredPrompt.findFirst({
        where: {
          title: discoveredPrompt.title,
          prompt: discoveredPrompt.prompt,
        },
      });

      if (!existing) {
        await prisma.discoveredPrompt.create({
          data: discoveredPrompt,
        });
        createdDiscovered++;
      }
    }

    // 3. Guarded seeding for Corpus Prompts: check if already exists by title
    for (const corpusPrompt of demoCorpus) {
      const existing = await prisma.corpusPrompt.findFirst({
        where: {
          title: corpusPrompt.title,
        },
      });

      if (!existing) {
        await prisma.corpusPrompt.create({
          data: corpusPrompt,
        });
        createdCorpus++;
      }
    }

    // 4. Guarded seeding for Optimizations & Feedback: check if already exists
    for (const record of demoOptimizations) {
      const existing = await prisma.optimization.findFirst({
        where: {
          originalPrompt: record.originalPrompt,
        },
      });

      if (!existing) {
        const optimization = await prisma.optimization.create({
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
            optimizationId: optimization.id,
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
        createdOptimizations++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded or synchronized successfully. Existing records preserved.",
      seeded: {
        sources: createdSources,
        discovered: createdDiscovered,
        corpus: createdCorpus,
        optimizations: createdOptimizations,
      },
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return internalServerError("Something went wrong while seeding the demo database.");
  }
}

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}

export async function DELETE() {
  // Guard 2: Prevent clearing DB in production
  if (process.env.NODE_ENV === "production") {
    return forbidden("Database clearing is disabled in production environments.");
  }

  try {
    await prisma.feedback.deleteMany();
    await prisma.optimization.deleteMany();
    await prisma.trainingSignal.deleteMany();
    await prisma.corpusPrompt.deleteMany();
    await prisma.curationReview.deleteMany();
    await prisma.discoveredPrompt.deleteMany();
    await prisma.source.deleteMany();
    await prisma.evaluationResult.deleteMany();
    await prisma.evaluationRun.deleteMany();

    return NextResponse.json({
      success: true,
      message: "All database playground and calibration records cleared successfully.",
    });
  } catch (error) {
    console.error("Clear demo data error:", error);
    return internalServerError("Something went wrong while clearing the demo database.");
  }
}