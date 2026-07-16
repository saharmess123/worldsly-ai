export type AIProviderName = "mock" | "ollama" | "openai";

export type AIMessageRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AIResponse {
  provider: AIProviderName;
  model: string;
  content: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface AIHealthStatus {
  provider: AIProviderName;
  available: boolean;
  latencyMs?: number;
  error?: string;
}