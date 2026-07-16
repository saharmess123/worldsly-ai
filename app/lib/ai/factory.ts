import type { AIProvider } from "./provider";
import type { AIProviderName } from "./types";
import { MockAIProvider } from "./providers/mock-provider";

export function createAIProvider(
  providerName: AIProviderName = "mock",
): AIProvider {
  switch (providerName) {
    case "mock":
      return new MockAIProvider();

    case "ollama":
      throw new Error(
        "Ollama provider is not connected to the provider engine yet.",
      );

    case "openai":
      throw new Error("OpenAI provider is not implemented yet.");
  }
}