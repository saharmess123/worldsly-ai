import { prisma } from "../prisma";
import type { AIProviderName } from "./types";

export interface AIRuntimeEventInput {
  operation?: string;
  primaryProvider: AIProviderName;
  resolvedProvider: AIProviderName;
  fallbackProvider?: AIProviderName | null;
  model: string;
  success: boolean;
  usedFallback: boolean;
  attemptCount: number;
  latencyMs: number;
  error?: string;
}

export async function recordAIRuntimeEvent(
  event: AIRuntimeEventInput,
): Promise<void> {
  try {
    await prisma.aIRuntimeEvent.create({
      data: {
        operation: event.operation ?? "generate",
        primaryProvider: event.primaryProvider,
        resolvedProvider: event.resolvedProvider,
        fallbackProvider: event.fallbackProvider ?? null,
        model: event.model,
        success: event.success,
        usedFallback: event.usedFallback,
        attemptCount: Math.max(1, event.attemptCount),
        latencyMs: Math.max(0, event.latencyMs),
        error: event.error?.trim() || null,
      },
    });
  } catch (error) {
    console.error(
      "Failed to record AI runtime monitoring event:",
      error,
    );
  }
}
