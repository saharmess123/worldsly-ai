import OpenAI from "openai";
import type { AIProvider } from "../provider";
import type {
  AIHealthStatus,
  AIRequest,
  AIResponse,
} from "../types";

const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-4o-mini";

interface OpenAIErrorLike {
  status?: unknown;
  code?: unknown;
  name?: unknown;
}

function getSafeOpenAIErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const openAIError =
    typeof error === "object" && error !== null
      ? (error as OpenAIErrorLike)
      : null;

  const status =
    typeof openAIError?.status === "number"
      ? openAIError.status
      : undefined;

  const code =
    typeof openAIError?.code === "string"
      ? openAIError.code
      : undefined;

  const name =
    typeof openAIError?.name === "string"
      ? openAIError.name
      : undefined;

  if (status === 401) {
    return "OpenAI authentication failed. Check OPENAI_API_KEY.";
  }

  if (status === 403) {
    return "OpenAI access was denied for the configured API key.";
  }

  if (status === 429) {
    return "OpenAI quota or rate limit was exceeded.";
  }

  if (status && status >= 500) {
    return "OpenAI is temporarily unavailable.";
  }

  if (
    code === "ETIMEDOUT" ||
    name === "APIConnectionTimeoutError"
  ) {
    return "OpenAI request timed out.";
  }

  if (
    name === "APIConnectionError" ||
    code === "ECONNREFUSED"
  ) {
    return "Unable to connect to OpenAI.";
  }

  return fallback;
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
        message.role === "user" &&
        message.content.trim().length > 0,
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
      const completion =
        await this.client.chat.completions.create(
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
        error: getSafeOpenAIErrorMessage(
          error,
          "OpenAI request failed.",
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
        error: getSafeOpenAIErrorMessage(
          error,
          "OpenAI health check failed.",
        ),
      };
    }
  }
}