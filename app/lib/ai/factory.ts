import type { AIProvider } from "./provider";
import type { AIProviderName } from "./types";
import { MockAIProvider } from "./providers/mock-provider";
import { OllamaAIProvider } from "./providers/ollama-provider";
import { OpenAIProvider } from "./providers/openai-provider";

export function createAIProvider(
  providerName: AIProviderName = "mock",
): AIProvider {
  switch (providerName) {
    case "mock":
      return new MockAIProvider();

    case "ollama":
      return new OllamaAIProvider();

    case "openai":
      return new OpenAIProvider();
  }
}