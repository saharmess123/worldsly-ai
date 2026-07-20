import type { AIProvider } from "../provider";
import type { AIHealthStatus, AIRequest, AIResponse } from "../types";

export class MockAIProvider implements AIProvider {
  readonly name = "mock" as const;

  async generate(request: AIRequest): Promise<AIResponse> {
    const startedAt = Date.now();

    const userMessage =
      [...request.messages]
        .reverse()
        .find((message) => message.role === "user")
        ?.content ?? "";

    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      provider: this.name,
      model: request.model ?? "mock-v1",
      content: `Mock AI response for: ${userMessage}`,
      latencyMs: Date.now() - startedAt,
      success: true,
    };
  }

  async healthCheck(): Promise<AIHealthStatus> {
    const startedAt = Date.now();

    return {
      provider: this.name,
      available: true,
      latencyMs: Date.now() - startedAt,
    };
  }
}