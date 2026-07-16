import type { AIProvider } from "./provider";
import type { AIProviderName } from "./types";
import { MockAIProvider } from "./providers/mock-provider";
import { OllamaAIProvider } from "./providers/ollama-provider";

export function createAIProvider(
  providerName: AIProviderName = "mock",
): AIProvider {
  switch (providerName) {
    case "mock":
      return new MockAIProvider();

    case "ollama":
      return new OllamaAIProvider();

    case "openai":
      throw new Error("OpenAI provider is not implemented yet.");
  }
}