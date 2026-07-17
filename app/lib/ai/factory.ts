import type { AIProvider } from "./provider";
import type { AIProviderName } from "./types";
import { MockAIProvider } from "./providers/mock-provider";
import { OllamaAIProvider } from "./providers/ollama-provider";
import { OpenAIProvider } from "./providers/openai-provider";

const DEFAULT_AI_PROVIDER: AIProviderName = "mock";

function isAIProviderName(value: string): value is AIProviderName {
  return value === "mock" || value === "ollama" || value === "openai";
}

export function getConfiguredAIProviderName(): AIProviderName {
  const configuredProvider = process.env.AI_PROVIDER
    ?.trim()
    .toLowerCase();

  if (
    configuredProvider &&
    isAIProviderName(configuredProvider)
  ) {
    return configuredProvider;
  }

  return DEFAULT_AI_PROVIDER;
}

export function createAIProvider(
  providerName: AIProviderName = getConfiguredAIProviderName(),
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