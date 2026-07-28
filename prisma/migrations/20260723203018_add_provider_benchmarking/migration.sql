-- CreateTable
CREATE TABLE "ProviderBenchmarkRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'running',
    "datasetVersion" TEXT NOT NULL DEFAULT 'v1',
    "testedProviders" INTEGER NOT NULL,
    "testCaseCount" INTEGER NOT NULL,
    "timeoutMs" INTEGER NOT NULL,
    "maxRetries" INTEGER NOT NULL,
    "fallbackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ProviderBenchmarkResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "benchmarkRunId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "promptTitle" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "resolvedProvider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "latencyMs" INTEGER NOT NULL,
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "outputLength" INTEGER NOT NULL DEFAULT 0,
    "outputExcerpt" TEXT,
    "error" TEXT,
    "estimatedCostUsd" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderBenchmarkResult_benchmarkRunId_fkey" FOREIGN KEY ("benchmarkRunId") REFERENCES "ProviderBenchmarkRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProviderBenchmarkRun_status_idx" ON "ProviderBenchmarkRun"("status");

-- CreateIndex
CREATE INDEX "ProviderBenchmarkRun_startedAt_idx" ON "ProviderBenchmarkRun"("startedAt");

-- CreateIndex
CREATE INDEX "ProviderBenchmarkResult_benchmarkRunId_idx" ON "ProviderBenchmarkResult"("benchmarkRunId");

-- CreateIndex
CREATE INDEX "ProviderBenchmarkResult_provider_idx" ON "ProviderBenchmarkResult"("provider");

-- CreateIndex
CREATE INDEX "ProviderBenchmarkResult_success_idx" ON "ProviderBenchmarkResult"("success");

-- CreateIndex
CREATE INDEX "ProviderBenchmarkResult_qualityScore_idx" ON "ProviderBenchmarkResult"("qualityScore");

-- CreateIndex
CREATE INDEX "ProviderBenchmarkResult_createdAt_idx" ON "ProviderBenchmarkResult"("createdAt");
