import OpenAI from "openai";
import type { AIProvider } from "../provider";
import type {
  AIHealthStatus,
  AIRequest,
  AIResponse,
} from "../types";

const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-4o-mini";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;

  private readonly client: OpenAI | null;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    this.client = apiKey?.trim()
      ? new OpenAI({
          apiKey,
        })
      : null;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startedAt = Date.now();
    const model = request.model?.trim() || DEFAULT_OPENAI_MODEL;

    const hasUserMessage = request.messages.some(
      (message) =>
        message.role === "user" && message.content.trim().length > 0,
    );

    if (!hasUserMessage) {
      return {
        provider: this.name,
        model,
        content: "",
        latencyMs: Date.now() - startedAt,
        success: false,
        error: "A user message is required.",
      };
    }

    if (!this.client) {
      return {
        provider: this.name,
        model,
        content: "",
        latencyMs: Date.now() - startedAt,
        success: false,
        error: "OPENAI_API_KEY is not configured.",
      };
    }

    try {
      const completion = await this.client.chat.completions.create(
        {
          model,
          messages: request.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          temperature: request.temperature ?? 0.4,
          ...(request.maxTokens
            ? {
                max_completion_tokens: request.maxTokens,
              }
            : {}),
        },
        request.timeoutMs
          ? {
              timeout: request.timeoutMs,
            }
          : undefined,
      );

      const content =
        completion.choices[0]?.message?.content?.trim() || "";

      if (!content) {
        return {
          provider: this.name,
          model,
          content: "",
          latencyMs: Date.now() - startedAt,
          success: false,
          error: "OpenAI returned an empty response.",
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
        error: getErrorMessage(
          error,
          "Unknown OpenAI provider error.",
        ),
      };
    }
  }

  async healthCheck(): Promise<AIHealthStatus> {
    const startedAt = Date.now();

    if (!this.client) {
      return {
        provider: this.name,
        available: false,
        latencyMs: Date.now() - startedAt,
        error: "OPENAI_API_KEY is not configured.",
      };
    }

    try {
      await this.client.models.list();

      return {
        provider: this.name,
        available: true,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        provider: this.name,
        available: false,
        latencyMs: Date.now() - startedAt,
        error: getErrorMessage(
          error,
          "Unknown OpenAI health-check error.",
        ),
      };
    }
  }
}