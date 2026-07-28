-- CreateTable
CREATE TABLE "AIRuntimeDailyAggregate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucketStart" DATETIME NOT NULL,
    "operation" TEXT NOT NULL,
    "resolvedProvider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "fallbackCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalLatencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SourceScanDailyAggregate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucketStart" DATETIME NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "runningCount" INTEGER NOT NULL DEFAULT 0,
    "createdPromptCount" INTEGER NOT NULL DEFAULT 0,
    "generatedPromptCount" INTEGER NOT NULL DEFAULT 0,
    "skippedDuplicateCount" INTEGER NOT NULL DEFAULT 0,
    "retrievedCharacterCount" INTEGER NOT NULL DEFAULT 0,
    "totalDurationMs" INTEGER NOT NULL DEFAULT 0,
    "credibilityScoreTotal" INTEGER NOT NULL DEFAULT 0,
    "credibilityScoreCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AIRuntimeDailyAggregate_bucketStart_idx" ON "AIRuntimeDailyAggregate"("bucketStart");

-- CreateIndex
CREATE INDEX "AIRuntimeDailyAggregate_resolvedProvider_idx" ON "AIRuntimeDailyAggregate"("resolvedProvider");

-- CreateIndex
CREATE INDEX "AIRuntimeDailyAggregate_operation_idx" ON "AIRuntimeDailyAggregate"("operation");

-- CreateIndex
CREATE UNIQUE INDEX "AIRuntimeDailyAggregate_bucketStart_operation_resolvedProvider_model_key" ON "AIRuntimeDailyAggregate"("bucketStart", "operation", "resolvedProvider", "model");

-- CreateIndex
CREATE INDEX "SourceScanDailyAggregate_bucketStart_idx" ON "SourceScanDailyAggregate"("bucketStart");

-- CreateIndex
CREATE INDEX "SourceScanDailyAggregate_sourceId_idx" ON "SourceScanDailyAggregate"("sourceId");

-- CreateIndex
CREATE INDEX "SourceScanDailyAggregate_trigger_idx" ON "SourceScanDailyAggregate"("trigger");

-- CreateIndex
CREATE INDEX "SourceScanDailyAggregate_provider_idx" ON "SourceScanDailyAggregate"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "SourceScanDailyAggregate_bucketStart_sourceId_trigger_provider_key" ON "SourceScanDailyAggregate"("bucketStart", "sourceId", "trigger", "provider");
