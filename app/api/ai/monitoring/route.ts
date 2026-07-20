import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  badRequest,
  forbidden,
  internalServerError,
} from "../../../lib/api-response";
import { verifyToken } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const PROVIDER_NAMES = [
  "mock",
  "ollama",
  "openai",
] as const;

type ProviderName =
  (typeof PROVIDER_NAMES)[number];

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("wordsly_session")?.value || "";
  const session = verifyToken(token);

  return session?.role === "admin";
}

function parseInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(maximum, parsed),
  );
}

function isProviderName(
  value: string,
): value is ProviderName {
  return PROVIDER_NAMES.includes(
    value as ProviderName,
  );
}

export async function GET(
  request: NextRequest,
) {
  try {
    const isAdmin = await requireAdmin();

    if (!isAdmin) {
      return forbidden();
    }

    const searchParams =
      request.nextUrl.searchParams;

    const hours = parseInteger(
      searchParams.get("hours"),
      24,
      1,
      720,
    );

    const limit = parseInteger(
      searchParams.get("limit"),
      50,
      1,
      200,
    );

    const provider =
      searchParams
        .get("provider")
        ?.trim()
        .toLowerCase() || "";

    if (
      provider &&
      !isProviderName(provider)
    ) {
      return badRequest(
        "Invalid AI provider filter.",
        {
          allowedProviders:
            PROVIDER_NAMES,
        },
      );
    }

    const successValue =
      searchParams
        .get("success")
        ?.trim()
        .toLowerCase();

    if (
      successValue &&
      successValue !== "true" &&
      successValue !== "false"
    ) {
      return badRequest(
        "The success filter must be true or false.",
      );
    }

    const since = new Date(
      Date.now() -
        hours * 60 * 60 * 1000,
    );

    const where: Prisma.AIRuntimeEventWhereInput = {
      createdAt: {
        gte: since,
      },
      ...(provider
        ? {
            resolvedProvider:
              provider,
          }
        : {}),
      ...(successValue
        ? {
            success:
              successValue === "true",
          }
        : {}),
    };

    const [events, totalCount] =
      await Promise.all([
        prisma.aIRuntimeEvent.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
        }),
        prisma.aIRuntimeEvent.count({
          where,
        }),
      ]);

    const successfulRequests =
      events.filter(
        (event) => event.success,
      ).length;

    const failedRequests =
      events.length -
      successfulRequests;

    const fallbackCount =
      events.filter(
        (event) =>
          event.usedFallback,
      ).length;

    const totalLatency =
      events.reduce(
        (sum, event) =>
          sum + event.latencyMs,
        0,
      );

    const totalAttempts =
      events.reduce(
        (sum, event) =>
          sum + event.attemptCount,
        0,
      );

    const providerBreakdown =
      PROVIDER_NAMES.map(
        (providerName) => {
          const providerEvents =
            events.filter(
              (event) =>
                event.resolvedProvider ===
                providerName,
            );

          const providerSuccesses =
            providerEvents.filter(
              (event) =>
                event.success,
            ).length;

          const providerLatency =
            providerEvents.reduce(
              (sum, event) =>
                sum +
                event.latencyMs,
              0,
            );

          return {
            provider:
              providerName,
            requestCount:
              providerEvents.length,
            successfulRequests:
              providerSuccesses,
            failedRequests:
              providerEvents.length -
              providerSuccesses,
            successRate:
              providerEvents.length === 0
                ? 0
                : Math.round(
                    (providerSuccesses /
                      providerEvents.length) *
                      100,
                  ),
            averageLatencyMs:
              providerEvents.length === 0
                ? 0
                : Math.round(
                    providerLatency /
                      providerEvents.length,
                  ),
          };
        },
      );

    return NextResponse.json({
      success: true,
      filters: {
        hours,
        limit,
        provider:
          provider || null,
        success:
          successValue
            ? successValue === "true"
            : null,
        since:
          since.toISOString(),
      },
      summary: {
        totalMatchingEvents:
          totalCount,
        returnedEvents:
          events.length,
        successfulRequests,
        failedRequests,
        successRate:
          events.length === 0
            ? 0
            : Math.round(
                (successfulRequests /
                  events.length) *
                  100,
              ),
        fallbackCount,
        fallbackRate:
          events.length === 0
            ? 0
            : Math.round(
                (fallbackCount /
                  events.length) *
                  100,
              ),
        averageLatencyMs:
          events.length === 0
            ? 0
            : Math.round(
                totalLatency /
                  events.length,
              ),
        averageAttempts:
          events.length === 0
            ? 0
            : Number(
                (
                  totalAttempts /
                  events.length
                ).toFixed(2),
              ),
      },
      providers:
        providerBreakdown,
      recentEvents:
        events.map((event) => ({
          id: event.id,
          operation:
            event.operation,
          primaryProvider:
            event.primaryProvider,
          resolvedProvider:
            event.resolvedProvider,
          fallbackProvider:
            event.fallbackProvider,
          model: event.model,
          success:
            event.success,
          usedFallback:
            event.usedFallback,
          attemptCount:
            event.attemptCount,
          latencyMs:
            event.latencyMs,
          error: event.error,
          createdAt:
            event.createdAt.toISOString(),
        })),
      generatedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "AI monitoring GET error:",
      error,
    );

    return internalServerError(
      "Something went wrong while loading AI monitoring data.",
    );
  }
}
