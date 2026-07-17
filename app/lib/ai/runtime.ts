import {
  createAIProvider,
  getConfiguredAIProviderName,
} from "./factory";
import type { AIProvider } from "./provider";
import type {
  AIProviderName,
  AIRequest,
  AIResponse,
} from "./types";

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 500;

export interface AIRuntimeOptions {
  providerName?: AIProviderName;
  fallbackProviderName?: AIProviderName | null;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

function isAIProviderName(
  value: string,
): value is AIProviderName {
  return (
    value === "mock" ||
    value === "ollama" ||
    value === "openai"
  );
}

function getPositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  return Number.isInteger(value) && Number(value) > 0
    ? Number(value)
    : fallback;
}

function getNonNegativeInteger(
  value: number | undefined,
  fallback: number,
): number {
  return Number.isInteger(value) && Number(value) >= 0
    ? Number(value)
    : fallback;
}

function getEnvironmentNumber(
  value: string | undefined,
): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function getConfiguredFallbackProviderName():
  | AIProviderName
  | null {
  const configuredFallback = process.env.AI_FALLBACK_PROVIDER
    ?.trim()
    .toLowerCase();

  if (
    !configuredFallback ||
    configuredFallback === "none"
  ) {
    return null;
  }

  return isAIProviderName(configuredFallback)
    ? configuredFallback
    : null;
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  providerName: AIProviderName,
): Promise<T> {
  let timeoutHandle:
    | ReturnType<typeof setTimeout>
    | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new Error(
          `${providerName} request timed out after ${timeoutMs}ms.`,
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      operation,
      timeoutPromise,
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function createRuntimeErrorResponse(
  providerName: AIProviderName,
  request: AIRequest,
  startedAt: number,
  error: unknown,
): AIResponse {
  const message =
    error instanceof Error
      ? error.message
      : `${providerName} request failed.`;

  return {
    provider: providerName,
    model:
      request.model?.trim() ||
      `${providerName}-default`,
    content: "",
    latencyMs: Date.now() - startedAt,
    success: false,
    error: message.includes("timed out")
      ? message
      : `${providerName} request failed.`,
  };
}

function shouldRetry(response: AIResponse): boolean {
  if (response.success) {
    return false;
  }

  const error = response.error?.toLowerCase() || "";

  const nonRetryableErrors = [
    "a user message is required",
    "api key is not configured",
    "authentication failed",
    "access was denied",
  ];

  return !nonRetryableErrors.some((message) =>
    error.includes(message),
  );
}

async function executeProviderWithRetry(
  provider: AIProvider,
  request: AIRequest,
  timeoutMs: number,
  maxRetries: number,
  retryDelayMs: number,
): Promise<AIResponse> {
  let lastResponse: AIResponse | null = null;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt += 1
  ) {
    const startedAt = Date.now();

    try {
      const response = await withTimeout(
        provider.generate({
          ...request,
          timeoutMs,
        }),
        timeoutMs,
        provider.name,
      );

      lastResponse = response;

      if (
        response.success ||
        !shouldRetry(response)
      ) {
        return response;
      }
    } catch (error) {
      lastResponse = createRuntimeErrorResponse(
        provider.name,
        request,
        startedAt,
        error,
      );
    }

    if (attempt < maxRetries) {
      await sleep(retryDelayMs);
    }
  }

  return (
    lastResponse ?? {
      provider: provider.name,
      model:
        request.model?.trim() ||
        `${provider.name}-default`,
      content: "",
      latencyMs: 0,
      success: false,
      error: `${provider.name} request failed.`,
    }
  );
}

export async function generateWithAIRuntime(
  request: AIRequest,
  options: AIRuntimeOptions = {},
): Promise<AIResponse> {
  const providerName =
    options.providerName ??
    getConfiguredAIProviderName();

  const fallbackProviderName =
    options.fallbackProviderName === undefined
      ? getConfiguredFallbackProviderName()
      : options.fallbackProviderName;

  const timeoutMs = getPositiveInteger(
    options.timeoutMs ??
      request.timeoutMs ??
      getEnvironmentNumber(process.env.AI_TIMEOUT_MS),
    DEFAULT_TIMEOUT_MS,
  );

  const maxRetries = getNonNegativeInteger(
    options.maxRetries ??
      getEnvironmentNumber(process.env.AI_MAX_RETRIES),
    DEFAULT_MAX_RETRIES,
  );

  const retryDelayMs = getNonNegativeInteger(
    options.retryDelayMs ??
      getEnvironmentNumber(
        process.env.AI_RETRY_DELAY_MS,
      ),
    DEFAULT_RETRY_DELAY_MS,
  );

  const primaryProvider =
    createAIProvider(providerName);

  const primaryResponse =
    await executeProviderWithRetry(
      primaryProvider,
      request,
      timeoutMs,
      maxRetries,
      retryDelayMs,
    );

  if (primaryResponse.success) {
    return primaryResponse;
  }

  if (
    !fallbackProviderName ||
    fallbackProviderName === providerName
  ) {
    return primaryResponse;
  }

  const fallbackProvider = createAIProvider(
    fallbackProviderName,
  );

  const fallbackResponse =
    await executeProviderWithRetry(
      fallbackProvider,
      {
        ...request,
        model:
          fallbackProviderName === "mock"
            ? undefined
            : request.model,
        timeoutMs,
      },
      timeoutMs,
      0,
      retryDelayMs,
    );

  return fallbackResponse.success
    ? fallbackResponse
    : primaryResponse;
}