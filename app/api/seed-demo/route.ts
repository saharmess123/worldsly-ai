import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

const demoRecords = [
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
    rating: "useful",
  },
  {
    originalPrompt: "Make my email better.",
    improvedPrompt:
      "Rewrite the following email in a professional, warm, and clear tone. Keep the message concise, respectful, and easy to understand. Improve grammar, sentence flow, and structure without changing the main meaning. Return only the improved email.",
    category: "Writing",
    model: "GPT-4.1 / GPT-5 style",
    goal: "More professional",
    depth: "Balanced",
    outputFormat: "Final answer only",
    originalScore: 22,
    improvedScore: 81,
    engineStatus: "mock_api",
    rating: "useful",
  },
  {
    originalPrompt: "Explain my project.",
    improvedPrompt:
      "Explain the project as a clear startup pitch. Include the problem, solution, target users, main features, technical architecture, current MVP status, business value, and next development steps. Use simple language, confident tone, and structured sections.",
    category: "Business",
    model: "GPT-4.1 / GPT-5 style",
    goal: "More structured",
    depth: "Deep",
    outputFormat: "Detailed explanation",
    originalScore: 28,
    improvedScore: 84,
    engineStatus: "mock_api",
    rating: "useful",
  },
  {
    originalPrompt: "Give me code for login.",
    improvedPrompt:
      "Create a secure login page using Next.js, React, TypeScript, and Tailwind CSS. Include email and password inputs, validation states, loading state, error handling, accessible labels, responsive design, and clean UI. Do not connect to a real authentication provider yet; use a placeholder submit function with clear comments showing where the backend call should be added.",
    category: "Code",
    model: "GPT-4.1 / GPT-5 style",
    goal: "Production-style code",
    depth: "Detailed",
    outputFormat: "Code with explanation",
    originalScore: 31,
    improvedScore: 86,
    engineStatus: "mock_api",
    rating: "needs_work",
  },
];

export async function POST() {
  try {
    const createdOptimizations = [];
    const createdFeedback = [];

    for (const record of demoRecords) {
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

      const feedback = await prisma.feedback.create({
        data: {
          optimizationId: optimization.id,
          rating: record.rating,
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

      createdOptimizations.push(optimization);
      createdFeedback.push(feedback);
    }

    return NextResponse.json({
      success: true,
      message: "Demo data inserted successfully.",
      storageMode: "sqlite_prisma",
      created: {
        optimizations: createdOptimizations.length,
        feedback: createdFeedback.length,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while inserting demo data.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await prisma.feedback.deleteMany();
    await prisma.optimization.deleteMany();

    return NextResponse.json({
      success: true,
      message: "Demo data cleared successfully.",
      storageMode: "sqlite_prisma",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while clearing demo data.",
      },
      { status: 500 }
    );
  }
}