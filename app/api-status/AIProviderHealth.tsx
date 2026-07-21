"use client";

import { useCallback, useEffect, useState } from "react";

type ProviderHealth = {
  provider: string;
  available: boolean;
  model?: string;
  latencyMs?: number;
  error?: string;
};

type HealthResponse = {
  success: boolean;
  configuredProvider: string;
  configuredProviderAvailable: boolean;
  checkMode: string;
  providers: ProviderHealth[];
  checkedAt: string;
  error?: string | { message?: string };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function providerLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function readError(data: HealthResponse | null) {
  if (!data?.error) return "Could not check AI provider health.";
  if (typeof data.error === "string") return data.error;
  return data.error.message || "Could not check AI provider health.";
}

export default function AIProviderHealth() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const checkHealth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/ai/health?all=true", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as HealthResponse;

      if (
        !response.ok &&
        !Array.isArray(result.providers)
      ) {
        throw new Error(readError(result));
      }

      setData(result);
    } catch (healthError) {
      setError(
        healthError instanceof Error
          ? healthError.message
          : "Could not check AI provider health.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  return (
    <section className="mb-8 rounded-[2.5rem] border border-slate-200 bg-white/80 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-black text-fuchsia-500">
            <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
            AI Provider Health
          </div>

          <h2 className="mt-5 text-3xl font-black">
            Live provider availability
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
            Check the configured provider and compare Mock, Ollama and OpenAI
            availability, response latency and health errors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void checkHealth()}
          disabled={isLoading}
          className="rounded-2xl bg-fuchsia-500 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Checking..." : "Refresh Providers"}
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-bold text-red-500">
          {error}
        </div>
      )}

      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        {(data?.providers ?? []).map((provider) => {
          const isConfigured =
            provider.provider === data?.configuredProvider;

          return (
            <article
              key={provider.provider}
              className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-2xl font-black">
                  {providerLabel(provider.provider)}
                </h3>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    provider.available
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {provider.available ? "Available" : "Unavailable"}
                </span>
              </div>

              {isConfigured && (
                <div className="mt-4 inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                  Configured provider
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white p-4 dark:bg-slate-950">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Latency
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {provider.latencyMs !== undefined
                      ? `${provider.latencyMs} ms`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 dark:bg-slate-950">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Model
                  </p>
                  <p className="mt-2 break-words text-sm font-black">
                    {provider.model || "Not reported"}
                  </p>
                </div>
              </div>

              {provider.error && (
                <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-bold leading-6 text-amber-600 dark:text-amber-300">
                  {provider.error}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!isLoading && !error && !data?.providers.length && (
        <div className="mt-7 rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-white/20">
          <h3 className="text-xl font-black">No provider results</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The provider health endpoint returned no health information.
          </p>
        </div>
      )}

      {data?.checkedAt && (
        <p className="mt-6 text-sm font-bold text-slate-500 dark:text-slate-400">
          Last provider check: {formatDate(data.checkedAt)}
        </p>
      )}
    </section>
  );
}
