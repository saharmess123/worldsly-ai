-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIRuntimeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operation" TEXT NOT NULL DEFAULT 'generate',
    "primaryProvider" TEXT NOT NULL,
    "resolvedProvider" TEXT NOT NULL,
    "fallbackProvider" TEXT,
    "model" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "retryUsed" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "latencyMs" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AIRuntimeEvent" ("attemptCount", "createdAt", "error", "fallbackProvider", "id", "latencyMs", "model", "operation", "primaryProvider", "resolvedProvider", "success", "usedFallback") SELECT "attemptCount", "createdAt", "error", "fallbackProvider", "id", "latencyMs", "model", "operation", "primaryProvider", "resolvedProvider", "success", "usedFallback" FROM "AIRuntimeEvent";
DROP TABLE "AIRuntimeEvent";
ALTER TABLE "new_AIRuntimeEvent" RENAME TO "AIRuntimeEvent";
CREATE INDEX "AIRuntimeEvent_operation_idx" ON "AIRuntimeEvent"("operation");
CREATE INDEX "AIRuntimeEvent_primaryProvider_idx" ON "AIRuntimeEvent"("primaryProvider");
CREATE INDEX "AIRuntimeEvent_resolvedProvider_idx" ON "AIRuntimeEvent"("resolvedProvider");
CREATE INDEX "AIRuntimeEvent_success_idx" ON "AIRuntimeEvent"("success");
CREATE INDEX "AIRuntimeEvent_createdAt_idx" ON "AIRuntimeEvent"("createdAt");
CREATE TABLE "new_ProviderBenchmarkResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "benchmarkRunId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "promptTitle" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "resolvedProvider" TEXT NOT NULL,
    "fallbackProvider" TEXT,
    "model" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "retryUsed" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "latencyMs" INTEGER NOT NULL,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "outputLength" INTEGER NOT NULL DEFAULT 0,
    "outputExcerpt" TEXT,
    "error" TEXT,
    "errorType" TEXT,
    "estimatedCostUsd" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderBenchmarkResult_benchmarkRunId_fkey" FOREIGN KEY ("benchmarkRunId") REFERENCES "ProviderBenchmarkRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProviderBenchmarkResult" ("attemptCount", "benchmarkRunId", "category", "createdAt", "error", "estimatedCostUsd", "id", "latencyMs", "model", "outputExcerpt", "outputLength", "promptTitle", "provider", "qualityScore", "resolvedProvider", "success", "testCaseId", "usedFallback") SELECT "attemptCount", "benchmarkRunId", "category", "createdAt", "error", "estimatedCostUsd", "id", "latencyMs", "model", "outputExcerpt", "outputLength", "promptTitle", "provider", "qualityScore", "resolvedProvider", "success", "testCaseId", "usedFallback" FROM "ProviderBenchmarkResult";
DROP TABLE "ProviderBenchmarkResult";
ALTER TABLE "new_ProviderBenchmarkResult" RENAME TO "ProviderBenchmarkResult";
CREATE INDEX "ProviderBenchmarkResult_benchmarkRunId_idx" ON "ProviderBenchmarkResult"("benchmarkRunId");
CREATE INDEX "ProviderBenchmarkResult_provider_idx" ON "ProviderBenchmarkResult"("provider");
CREATE INDEX "ProviderBenchmarkResult_success_idx" ON "ProviderBenchmarkResult"("success");
CREATE INDEX "ProviderBenchmarkResult_errorType_idx" ON "ProviderBenchmarkResult"("errorType");
CREATE INDEX "ProviderBenchmarkResult_qualityScore_idx" ON "ProviderBenchmarkResult"("qualityScore");
CREATE INDEX "ProviderBenchmarkResult_createdAt_idx" ON "ProviderBenchmarkResult"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
