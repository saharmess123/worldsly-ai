import type {
  AIHealthStatus,
  AIProviderName,
  AIRequest,
  AIResponse,
} from "./types";

export interface AIProvider {
  readonly name: AIProviderName;

  generate(request: AIRequest): Promise<AIResponse>;

  healthCheck(): Promise<AIHealthStatus>;
}