import { NextRequest, NextResponse } from "next/server";
import { internalServerError } from "../../../lib/api-response";
import {
  createAIProvider,
  getConfiguredAIProviderName,
} from "../../../lib/ai/factory";
import type {
  AIHealthStatus,
  AIProviderName,
} from "../../../lib/ai/types";

const PROVIDER_NAMES: AIProviderName[] = [
  "mock",
  "ollama",
  "openai",
];

async function checkProvider(
  providerName: AIProviderName,
): Promise<AIHealthStatus> {
  try {
    const provider = createAIProvider(providerName);
    return await provider.healthCheck();
  } catch {
    return {
      provider: providerName,
      available: false,
      error: `${providerName} health check failed.`,
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const configuredProvider =
      getConfiguredAIProviderName();

    const checkAllProviders =
      request.nextUrl.searchParams.get("all") === "true";

    const providersToCheck = checkAllProviders
      ? PROVIDER_NAMES
      : [configuredProvider];

    const healthResults = await Promise.all(
      providersToCheck.map(checkProvider),
    );

    const configuredProviderHealth =
      healthResults.find(
        (health) =>
          health.provider === configuredProvider,
      );

    const configuredProviderAvailable =
      configuredProviderHealth?.available ?? false;

    return NextResponse.json(
      {
        success: configuredProviderAvailable,
        configuredProvider,
        configuredProviderAvailable,
        checkMode: checkAllProviders
          ? "all_providers"
          : "configured_provider_only",
        providers: healthResults,
        checkedAt: new Date().toISOString(),
      },
      {
        status: configuredProviderAvailable ? 200 : 503,
      },
    );
  } catch (error) {
    console.error("AI health GET error:", error);

    return internalServerError(
      "Something went wrong while checking AI provider health.",
    );
  }
}