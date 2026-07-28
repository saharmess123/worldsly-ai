import { prisma } from "./prisma";

const DEFAULT_RAW_RETENTION_DAYS = 30;
const DEFAULT_AGGREGATE_RETENTION_DAYS = 730;
const DEFAULT_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 5000;

type RetentionOptions = {
  rawRetentionDays?: number;
  aggregateRetentionDays?: number;
  batchSize?: number;
};

type AggregateKey = string;

type AIRuntimeAggregateValues = {
  bucketStart: Date;
  operation: string;
  resolvedProvider: string;
  model: string;
  success: boolean;
  requestCount: number;
  successCount: number;
  failureCount: number;
  fallbackCount: number;
  errorCount: number;
  totalAttempts: number;
  totalLatencyMs: number;
};

type SourceScanAggregateValues = {
  bucketStart: Date;
  sourceId: string;
  sourceName: string;
  trigger: string;
  status: string;
  provider: string;
  scanCount: number;
  completedCount: number;
  failedCount: number;
  runningCount: number;
  createdPromptCount: number;
  generatedPromptCount: number;
  skippedDuplicateCount: number;
  retrievedCharacterCount: number;
  totalDurationMs: number;
  credibilityScoreTotal: number;
  credibilityScoreCount: number;
};

export type MonitoringRetentionResult = {
  rawRetentionDays: number;
  aggregateRetentionDays: number;
  batchSize: number;
  rawCutoff: string;
  aggregateCutoff: string;
  aiRuntimeEventsAggregated: number;
  sourceScanEventsAggregated: number;
  aiRuntimeAggregatesDeleted: number;
  sourceScanAggregatesDeleted: number;
  completedAt: string;
};

function parsePositiveInteger(
  value: number | undefined,
  fallback: number,
  maximum: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return fallback;
  }

  return Math.min(value, maximum);
}

function parseEnvironmentInteger(
  value: string | undefined,
): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed)
    ? parsed
    : undefined;
}

function startOfUtcDay(value: Date): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ),
  );
}

function subtractDays(
  value: Date,
  days: number,
): Date {
  return new Date(
    value.getTime() -
      days * 24 * 60 * 60 * 1000,
  );
}

function createAggregateKey(
  values: Array<string | Date>,
): AggregateKey {
  return values
    .map((value) =>
      value instanceof Date
        ? value.toISOString()
        : value,
    )
    .join("::");
}

function resolveOptions(
  options: RetentionOptions,
) {
  const rawRetentionDays =
    parsePositiveInteger(
      options.rawRetentionDays ??
        parseEnvironmentInteger(
          process.env
            .MONITORING_RAW_RETENTION_DAYS,
        ),
      DEFAULT_RAW_RETENTION_DAYS,
      3650,
    );

  const aggregateRetentionDays =
    parsePositiveInteger(
      options.aggregateRetentionDays ??
        parseEnvironmentInteger(
          process.env
            .MONITORING_AGGREGATE_RETENTION_DAYS,
        ),
      DEFAULT_AGGREGATE_RETENTION_DAYS,
      36500,
    );

  const batchSize =
    parsePositiveInteger(
      options.batchSize ??
        parseEnvironmentInteger(
          process.env
            .MONITORING_RETENTION_BATCH_SIZE,
        ),
      DEFAULT_BATCH_SIZE,
      MAX_BATCH_SIZE,
    );

  return {
    rawRetentionDays,
    aggregateRetentionDays,
    batchSize,
  };
}

async function aggregateAIRuntimeEvents(
  cutoff: Date,
  batchSize: number,
): Promise<number> {
  let processedCount = 0;

  while (true) {
    const events =
      await prisma.aIRuntimeEvent.findMany({
        where: {
          createdAt: {
            lt: cutoff,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: batchSize,
      });

    if (events.length === 0) {
      break;
    }

    const grouped =
      new Map<
        AggregateKey,
        AIRuntimeAggregateValues
      >();

    for (const event of events) {
      const bucketStart =
        startOfUtcDay(event.createdAt);

      const operation =
        event.operation.trim() || "generate";

      const resolvedProvider =
        event.resolvedProvider.trim() ||
        "unknown";

      const model =
        event.model.trim() || "unknown";

      const key =
        createAggregateKey([
          bucketStart,
          operation,
          resolvedProvider,
          model,
          String(event.success),
        ]);

      const existing =
        grouped.get(key);

      if (existing) {
        existing.requestCount += 1;
        existing.successCount +=
          event.success ? 1 : 0;
        existing.failureCount +=
          event.success ? 0 : 1;
        existing.fallbackCount +=
          event.usedFallback ? 1 : 0;
        existing.errorCount +=
          event.error?.trim() ? 1 : 0;
        existing.totalAttempts +=
          Math.max(1, event.attemptCount);
        existing.totalLatencyMs +=
          Math.max(0, event.latencyMs);

        continue;
      }

      grouped.set(key, {
        bucketStart,
        operation,
        resolvedProvider,
        model,
        success: event.success,
        requestCount: 1,
        successCount:
          event.success ? 1 : 0,
        failureCount:
          event.success ? 0 : 1,
        fallbackCount:
          event.usedFallback ? 1 : 0,
        errorCount:
          event.error?.trim() ? 1 : 0,
        totalAttempts:
          Math.max(1, event.attemptCount),
        totalLatencyMs:
          Math.max(0, event.latencyMs),
      });
    }

    const eventIds =
      events.map((event) => event.id);

    await prisma.$transaction(
      async (transaction) => {
        for (const aggregate of grouped.values()) {
          await transaction.aIRuntimeDailyAggregate.upsert({
            where: {
              bucketStart_operation_resolvedProvider_model_success: {
                bucketStart:
                  aggregate.bucketStart,
                operation:
                  aggregate.operation,
                resolvedProvider:
                  aggregate.resolvedProvider,
                model:
                  aggregate.model,
                success:
                  aggregate.success,
              },
            },
            create: aggregate,
            update: {
              requestCount: {
                increment:
                  aggregate.requestCount,
              },
              successCount: {
                increment:
                  aggregate.successCount,
              },
              failureCount: {
                increment:
                  aggregate.failureCount,
              },
              fallbackCount: {
                increment:
                  aggregate.fallbackCount,
              },
              errorCount: {
                increment:
                  aggregate.errorCount,
              },
              totalAttempts: {
                increment:
                  aggregate.totalAttempts,
              },
              totalLatencyMs: {
                increment:
                  aggregate.totalLatencyMs,
              },
            },
          });
        }

        await transaction.aIRuntimeEvent.deleteMany({
          where: {
            id: {
              in: eventIds,
            },
          },
        });
      },
    );

    processedCount += events.length;
  }

  return processedCount;
}

async function aggregateSourceScanEvents(
  cutoff: Date,
  batchSize: number,
): Promise<number> {
  let processedCount = 0;

  while (true) {
    const events =
      await prisma.sourceScanEvent.findMany({
        where: {
          startedAt: {
            lt: cutoff,
          },
          status: {
            in: ["completed", "failed"],
          },
        },
        include: {
          source: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startedAt: "asc",
        },
        take: batchSize,
      });

    if (events.length === 0) {
      break;
    }

    const grouped =
      new Map<
        AggregateKey,
        SourceScanAggregateValues
      >();

    for (const event of events) {
      const bucketStart =
        startOfUtcDay(event.startedAt);

      const sourceName =
        event.source.name.trim() ||
        "Unknown source";

      const trigger =
        event.trigger.trim() || "unknown";

      const provider =
        event.provider?.trim() || "unknown";

      const key =
        createAggregateKey([
          bucketStart,
          event.sourceId,
          trigger,
          event.status,
          provider,
        ]);

      const credibilityScore =
        typeof event.credibilityScore ===
          "number"
          ? event.credibilityScore
          : null;

      const existing =
        grouped.get(key);

      if (existing) {
        existing.scanCount += 1;
        existing.completedCount +=
          event.status === "completed" ? 1 : 0;
        existing.failedCount +=
          event.status === "failed" ? 1 : 0;
        existing.runningCount +=
          event.status === "running" ? 1 : 0;
        existing.createdPromptCount +=
          Math.max(0, event.createdCount);
        existing.generatedPromptCount +=
          Math.max(0, event.generatedCount);
        existing.skippedDuplicateCount +=
          Math.max(
            0,
            event.skippedDuplicateCount,
          );
        existing.retrievedCharacterCount +=
          Math.max(
            0,
            event.retrievedCharacterCount,
          );
        existing.totalDurationMs +=
          Math.max(0, event.durationMs);

        if (credibilityScore !== null) {
          existing.credibilityScoreTotal +=
            credibilityScore;
          existing.credibilityScoreCount += 1;
        }

        continue;
      }

      grouped.set(key, {
        bucketStart,
        sourceId: event.sourceId,
        sourceName,
        trigger,
        status: event.status,
        provider,
        scanCount: 1,
        completedCount:
          event.status === "completed" ? 1 : 0,
        failedCount:
          event.status === "failed" ? 1 : 0,
        runningCount:
          event.status === "running" ? 1 : 0,
        createdPromptCount:
          Math.max(0, event.createdCount),
        generatedPromptCount:
          Math.max(0, event.generatedCount),
        skippedDuplicateCount:
          Math.max(
            0,
            event.skippedDuplicateCount,
          ),
        retrievedCharacterCount:
          Math.max(
            0,
            event.retrievedCharacterCount,
          ),
        totalDurationMs:
          Math.max(0, event.durationMs),
        credibilityScoreTotal:
          credibilityScore ?? 0,
        credibilityScoreCount:
          credibilityScore === null ? 0 : 1,
      });
    }

    const eventIds =
      events.map((event) => event.id);

    await prisma.$transaction(
      async (transaction) => {
        for (const aggregate of grouped.values()) {
          await transaction.sourceScanDailyAggregate.upsert({
            where: {
              bucketStart_sourceId_trigger_status_provider: {
                bucketStart:
                  aggregate.bucketStart,
                sourceId:
                  aggregate.sourceId,
                trigger:
                  aggregate.trigger,
                status:
                  aggregate.status,
                provider:
                  aggregate.provider,
              },
            },
            create: aggregate,
            update: {
              sourceName:
                aggregate.sourceName,
              scanCount: {
                increment:
                  aggregate.scanCount,
              },
              completedCount: {
                increment:
                  aggregate.completedCount,
              },
              failedCount: {
                increment:
                  aggregate.failedCount,
              },
              runningCount: {
                increment:
                  aggregate.runningCount,
              },
              createdPromptCount: {
                increment:
                  aggregate.createdPromptCount,
              },
              generatedPromptCount: {
                increment:
                  aggregate.generatedPromptCount,
              },
              skippedDuplicateCount: {
                increment:
                  aggregate.skippedDuplicateCount,
              },
              retrievedCharacterCount: {
                increment:
                  aggregate.retrievedCharacterCount,
              },
              totalDurationMs: {
                increment:
                  aggregate.totalDurationMs,
              },
              credibilityScoreTotal: {
                increment:
                  aggregate.credibilityScoreTotal,
              },
              credibilityScoreCount: {
                increment:
                  aggregate.credibilityScoreCount,
              },
            },
          });
        }

        await transaction.sourceScanEvent.deleteMany({
          where: {
            id: {
              in: eventIds,
            },
          },
        });
      },
    );

    processedCount += events.length;
  }

  return processedCount;
}

export async function runMonitoringRetention(
  options: RetentionOptions = {},
): Promise<MonitoringRetentionResult> {
  const {
    rawRetentionDays,
    aggregateRetentionDays,
    batchSize,
  } = resolveOptions(options);

  const now = new Date();

  const rawCutoff =
    startOfUtcDay(
      subtractDays(
        now,
        rawRetentionDays,
      ),
    );

  const aggregateCutoff =
    startOfUtcDay(
      subtractDays(
        now,
        aggregateRetentionDays,
      ),
    );

  const aiRuntimeEventsAggregated =
    await aggregateAIRuntimeEvents(
      rawCutoff,
      batchSize,
    );

  const sourceScanEventsAggregated =
    await aggregateSourceScanEvents(
      rawCutoff,
      batchSize,
    );

  const [
    deletedAIRuntimeAggregates,
    deletedSourceScanAggregates,
  ] = await prisma.$transaction([
    prisma.aIRuntimeDailyAggregate.deleteMany({
      where: {
        bucketStart: {
          lt: aggregateCutoff,
        },
      },
    }),
    prisma.sourceScanDailyAggregate.deleteMany({
      where: {
        bucketStart: {
          lt: aggregateCutoff,
        },
      },
    }),
  ]);

  return {
    rawRetentionDays,
    aggregateRetentionDays,
    batchSize,
    rawCutoff:
      rawCutoff.toISOString(),
    aggregateCutoff:
      aggregateCutoff.toISOString(),
    aiRuntimeEventsAggregated,
    sourceScanEventsAggregated,
    aiRuntimeAggregatesDeleted:
      deletedAIRuntimeAggregates.count,
    sourceScanAggregatesDeleted:
      deletedSourceScanAggregates.count,
    completedAt:
      new Date().toISOString(),
  };
}
