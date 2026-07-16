import type { AIProvider } from "../provider";
import type {
  AIHealthStatus,
  AIRequest,
  AIResponse,
} from "../types";
import {
  chatWithOllama,
  getOllamaModels,
} from "../ollama";

export class OllamaAIProvider implements AIProvider {
  readonly name = "ollama" as const;

  async generate(request: AIRequest): Promise<AIResponse> {
    const startedAt = Date.now();
    const model = request.model ?? "llama3.2";

    const systemPrompt =
      request.messages.find((message) => message.role === "system")?.content ??
      "You are a helpful AI assistant.";

    const userPrompt =
      [...request.messages]
        .reverse()
        .find((message) => message.role === "user")
        ?.content ?? "";

    if (!userPrompt.trim()) {
      return {
        provider: this.name,
        model,
        content: "",
        latencyMs: Date.now() - startedAt,
        success: false,
        error: "A user message is required.",
      };
    }

    try {
      const content = await chatWithOllama(
        systemPrompt,
        userPrompt,
        model,
      );

      if (!content) {
        return {
          provider: this.name,
          model,
          content: "",
          latencyMs: Date.now() - startedAt,
          success: false,
          error: "Ollama is unavailable or returned an empty response.",
        };
      }

      return {
        provider: this.name,
        model,
        content,
        latencyMs: Date.now() - startedAt,
        success: true,
      };
    } catch (error) {
      return {
        provider: this.name,
        model,
        content: "",
        latencyMs: Date.now() - startedAt,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Ollama provider error.",
      };
    }
  }

  async healthCheck(): Promise<AIHealthStatus> {
    const startedAt = Date.now();

    try {
      const models = await getOllamaModels();

      return {
        provider: this.name,
        available: models.length > 0,
        latencyMs: Date.now() - startedAt,
        error:
          models.length === 0
            ? "Ollama is not running or no models are installed."
            : undefined,
      };
    } catch (error) {
      return {
        provider: this.name,
        available: false,
        latencyMs: Date.now() - startedAt,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Ollama health-check error.",
      };
    }
  }
}