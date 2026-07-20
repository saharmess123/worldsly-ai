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

    const mockJson = {
      improvedPrompt: `Act as an expert assistant. Address the user's task with precision:\n\n${userMessage}\n\nConstraints:\n- Be clear, structured, and actionable.\n- Provide step-by-step reasoning where necessary.`,
      explanation: [
        "Defined a clear role and explicit task objective.",
        "Added structural constraints for clarity and consistency.",
        "Enforced step-by-step output format requirements."
      ],
      variants: [
        `Direct Version: Act as an expert. Execute: ${userMessage}`,
        `Detailed Version: You are a senior specialist. Solve: ${userMessage} with full step-by-step breakdown.`,
        `Short Version: Solve: ${userMessage} concisely.`
      ],
      patterns: ["Role Definition", "Task Context", "Output Constraints"]
    };

    return {
      provider: this.name,
      model: request.model ?? "mock-v1",
      content: JSON.stringify(mockJson),
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