import type { AIProvider } from "../provider";
import type {
  AIHealthStatus,
  AIRequest,
  AIResponse,
} from "../types";
import { getOllamaModels } from "../ollama";

type OllamaChatResponse = {
  model?: string;
  message?: {
    content?: string;
  };
  error?: string;
};

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL?.trim().replace(/\/+$/, "") ||
  "http://localhost:11434";

const DEFAULT_OLLAMA_MODEL =
  process.env.OLLAMA_MODEL?.trim() ||
  "qwen2.5:3b";

const DEFAULT_TIMEOUT_MS = 60_000;

function getRequestTimeout(timeoutMs?: number): number {
  if (
    typeof timeoutMs === "number" &&
    Number.isFinite(timeoutMs) &&
    timeoutMs > 0
  ) {
    return timeoutMs;
  }

  return DEFAULT_TIMEOUT_MS;
}

function selectAvailableModel(
  requestedModel: string,
  availableModels: string[],
): string {
  if (availableModels.includes(requestedModel)) {
    return requestedModel;
  }

  const partialMatch = availableModels.find(
    (model) =>
      model.startsWith(requestedModel) ||
      requestedModel.startsWith(model),
  );

  return partialMatch || availableModels[0];
}

export class OllamaAIProvider implements AIProvider {
  readonly name = "ollama" as const;

  async generate(request: AIRequest): Promise<AIResponse> {
    const startedAt = Date.now();

    const requestedModel =
      request.model?.trim() ||
      DEFAULT_OLLAMA_MODEL;

    const systemPrompt =
      request.messages.find(
        (message) => message.role === "system",
      )?.content ||
      "You are a helpful AI assistant.";

    const userPrompt =
      [...request.messages]
        .reverse()
        .find(
          (message) => message.role === "user",
        )
        ?.content ||
      "";

    if (!userPrompt.trim()) {
      return {
        provider: this.name,
        model: requestedModel,
        content: "",
        latencyMs: Date.now() - startedAt,
        success: false,
        error: "A user message is required.",
      };
    }

    const timeoutMs = getRequestTimeout(
      request.timeoutMs,
    );

    try {
      const availableModels =
        await getOllamaModels();

      if (availableModels.length === 0) {
        return {
          provider: this.name,
          model: requestedModel,
          content: "",
          latencyMs: Date.now() - startedAt,
          success: false,
          error:
            "Ollama is not running or no models are installed.",
        };
      }

      const model = selectAvailableModel(
        requestedModel,
        availableModels,
      );

      const options: {
        temperature: number;
        num_predict?: number;
      } = {
        temperature:
          request.temperature ?? 0.1,
      };

      if (
        typeof request.maxTokens === "number" &&
        Number.isFinite(request.maxTokens) &&
        request.maxTokens > 0
      ) {
        options.num_predict =
          request.maxTokens;
      }

      const response = await fetch(
        `${OLLAMA_BASE_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
            stream: false,
            format: "json",
            options,
          }),
          signal:
            AbortSignal.timeout(timeoutMs),
        },
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        return {
          provider: this.name,
          model,
          content: "",
          latencyMs: Date.now() - startedAt,
          success: false,
          error:
            `Ollama API error ${response.status}: ${errorText}`,
        };
      }

      const data =
        (await response.json()) as OllamaChatResponse;

      const content =
        data.message?.content?.trim() ||
        "";

      if (!content) {
        return {
          provider: this.name,
          model:
            data.model?.trim() || model,
          content: "",
          latencyMs: Date.now() - startedAt,
          success: false,
          error:
            data.error ||
            "Ollama returned an empty response.",
        };
      }

      return {
        provider: this.name,
        model:
          data.model?.trim() || model,
        content,
        latencyMs: Date.now() - startedAt,
        success: true,
      };
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (
          error.name === "TimeoutError" ||
          error.message
            .toLowerCase()
            .includes("timeout")
        );

      return {
        provider: this.name,
        model: requestedModel,
        content: "",
        latencyMs: Date.now() - startedAt,
        success: false,
        error: isTimeout
          ? `Ollama request timed out after ${timeoutMs}ms.`
          : error instanceof Error
            ? error.message
            : "Unknown Ollama provider error.",
      };
    }
  }

  async healthCheck(): Promise<AIHealthStatus> {
    const startedAt = Date.now();

    try {
      const models =
        await getOllamaModels();

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