-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredModel" TEXT NOT NULL DEFAULT 'GPT-4.1 / GPT-5 style',
    "optimizationDepth" TEXT NOT NULL DEFAULT 'Balanced',
    "defaultGoal" TEXT NOT NULL DEFAULT 'More structured',
    "outputFormat" TEXT NOT NULL DEFAULT 'Detailed explanation',
    "personalStyle" TEXT,
    "discoveryFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Optimization" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "originalPrompt" TEXT NOT NULL,
    "improvedPrompt" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "model" TEXT NOT NULL DEFAULT 'GPT-4.1 / GPT-5 style',
    "goal" TEXT NOT NULL DEFAULT 'More structured',
    "depth" TEXT NOT NULL DEFAULT 'Balanced',
    "outputFormat" TEXT NOT NULL DEFAULT 'Detailed explanation',
    "originalScore" INTEGER NOT NULL DEFAULT 0,
    "improvedScore" INTEGER NOT NULL DEFAULT 0,
    "engineStatus" TEXT NOT NULL DEFAULT 'mock_api',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Optimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "optimizationId" TEXT,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "originalPrompt" TEXT NOT NULL,
    "improvedPrompt" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "model" TEXT NOT NULL DEFAULT 'GPT-4.1 / GPT-5 style',
    "goal" TEXT NOT NULL DEFAULT 'More structured',
    "depth" TEXT NOT NULL DEFAULT 'Balanced',
    "outputFormat" TEXT NOT NULL DEFAULT 'Detailed explanation',
    "engineStatus" TEXT NOT NULL DEFAULT 'mock_api',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "credibilityScore" INTEGER NOT NULL DEFAULT 0,
    "credibilityMethod" TEXT NOT NULL DEFAULT 'manual',
    "credibilityConfidence" INTEGER NOT NULL DEFAULT 0,
    "credibilityReason" TEXT,
    "credibilityUpdatedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastScanAt" TIMESTAMP(3),
    "scanFrequency" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceScanEvent" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "generatedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedDuplicateCount" INTEGER NOT NULL DEFAULT 0,
    "retrievedCharacterCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "credibilityScore" INTEGER,
    "credibilityConfidence" INTEGER,
    "credibilityReason" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SourceScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceCredibilityAlert" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "scanEventId" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "alertType" TEXT NOT NULL,
    "currentScore" INTEGER NOT NULL,
    "previousScore" INTEGER,
    "scoreDrop" INTEGER,
    "threshold" INTEGER,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SourceCredibilityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveredPrompt" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "model" TEXT NOT NULL DEFAULT 'General',
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveredPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurationReview" (
    "id" TEXT NOT NULL,
    "discoveredPromptId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorpusPrompt" (
    "id" TEXT NOT NULL,
    "discoveredPromptId" TEXT,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "improvedVersion" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "model" TEXT NOT NULL DEFAULT 'General',
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "patterns" TEXT,
    "metadata" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorpusPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSignal" (
    "id" TEXT NOT NULL,
    "deduplicationKey" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "corpusId" TEXT,
    "signalType" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "label" TEXT,
    "usageLimit" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRuntimeEvent" (
    "id" TEXT NOT NULL,
    "operation" TEXT NOT NULL DEFAULT 'generate',
    "primaryProvider" TEXT NOT NULL,
    "resolvedProvider" TEXT NOT NULL,
    "fallbackProvider" TEXT,
    "model" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "latencyMs" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRuntimeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationRun" (
    "id" TEXT NOT NULL,
    "meanAbsoluteError" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "testedCount" INTEGER NOT NULL,
    "runType" TEXT NOT NULL DEFAULT 'quality_calibration',
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationResult" (
    "id" TEXT NOT NULL,
    "evaluationRunId" TEXT NOT NULL,
    "corpusPromptId" TEXT,
    "feedbackId" TEXT,
    "promptTitle" TEXT NOT NULL,
    "promptContent" TEXT NOT NULL,
    "targetScore" INTEGER NOT NULL,
    "calculatedScore" INTEGER NOT NULL,
    "scoreDeviation" INTEGER NOT NULL,
    "scoringMode" TEXT NOT NULL,
    "clarityTarget" INTEGER NOT NULL DEFAULT 0,
    "clarityCalculated" INTEGER NOT NULL DEFAULT 0,
    "specificityTarget" INTEGER NOT NULL DEFAULT 0,
    "specificityCalculated" INTEGER NOT NULL DEFAULT 0,
    "contextTarget" INTEGER NOT NULL DEFAULT 0,
    "contextCalculated" INTEGER NOT NULL DEFAULT 0,
    "constraintsTarget" INTEGER NOT NULL DEFAULT 0,
    "constraintsCalculated" INTEGER NOT NULL DEFAULT 0,
    "outputFormatTarget" INTEGER NOT NULL DEFAULT 0,
    "outputFormatCalculated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderBenchmarkRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "datasetVersion" TEXT NOT NULL DEFAULT 'v1',
    "testedProviders" INTEGER NOT NULL,
    "testCaseCount" INTEGER NOT NULL,
    "timeoutMs" INTEGER NOT NULL,
    "maxRetries" INTEGER NOT NULL,
    "fallbackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderBenchmarkRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderBenchmarkResult" (
    "id" TEXT NOT NULL,
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
    "estimatedCostUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderBenchmarkResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRuntimeDailyAggregate" (
    "id" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "operation" TEXT NOT NULL,
    "resolvedProvider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "fallbackCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalLatencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRuntimeDailyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceScanDailyAggregate" (
    "id" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceScanDailyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "Optimization_userId_idx" ON "Optimization"("userId");

-- CreateIndex
CREATE INDEX "Optimization_category_idx" ON "Optimization"("category");

-- CreateIndex
CREATE INDEX "Optimization_createdAt_idx" ON "Optimization"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_optimizationId_idx" ON "Feedback"("optimizationId");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "Source_type_idx" ON "Source"("type");

-- CreateIndex
CREATE INDEX "Source_status_idx" ON "Source"("status");

-- CreateIndex
CREATE INDEX "SourceScanEvent_sourceId_idx" ON "SourceScanEvent"("sourceId");

-- CreateIndex
CREATE INDEX "SourceScanEvent_trigger_idx" ON "SourceScanEvent"("trigger");

-- CreateIndex
CREATE INDEX "SourceScanEvent_status_idx" ON "SourceScanEvent"("status");

-- CreateIndex
CREATE INDEX "SourceScanEvent_startedAt_idx" ON "SourceScanEvent"("startedAt");

-- CreateIndex
CREATE INDEX "SourceCredibilityAlert_sourceId_idx" ON "SourceCredibilityAlert"("sourceId");

-- CreateIndex
CREATE INDEX "SourceCredibilityAlert_scanEventId_idx" ON "SourceCredibilityAlert"("scanEventId");

-- CreateIndex
CREATE INDEX "SourceCredibilityAlert_severity_idx" ON "SourceCredibilityAlert"("severity");

-- CreateIndex
CREATE INDEX "SourceCredibilityAlert_status_idx" ON "SourceCredibilityAlert"("status");

-- CreateIndex
CREATE INDEX "SourceCredibilityAlert_createdAt_idx" ON "SourceCredibilityAlert"("createdAt");

-- CreateIndex
CREATE INDEX "DiscoveredPrompt_sourceId_idx" ON "DiscoveredPrompt"("sourceId");

-- CreateIndex
CREATE INDEX "DiscoveredPrompt_category_idx" ON "DiscoveredPrompt"("category");

-- CreateIndex
CREATE INDEX "DiscoveredPrompt_status_idx" ON "DiscoveredPrompt"("status");

-- CreateIndex
CREATE INDEX "DiscoveredPrompt_discoveredAt_idx" ON "DiscoveredPrompt"("discoveredAt");

-- CreateIndex
CREATE INDEX "CurationReview_discoveredPromptId_idx" ON "CurationReview"("discoveredPromptId");

-- CreateIndex
CREATE INDEX "CurationReview_reviewerId_idx" ON "CurationReview"("reviewerId");

-- CreateIndex
CREATE INDEX "CurationReview_status_idx" ON "CurationReview"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CorpusPrompt_discoveredPromptId_key" ON "CorpusPrompt"("discoveredPromptId");

-- CreateIndex
CREATE INDEX "CorpusPrompt_category_idx" ON "CorpusPrompt"("category");

-- CreateIndex
CREATE INDEX "CorpusPrompt_model_idx" ON "CorpusPrompt"("model");

-- CreateIndex
CREATE INDEX "CorpusPrompt_qualityScore_idx" ON "CorpusPrompt"("qualityScore");

-- CreateIndex
CREATE INDEX "CorpusPrompt_isArchived_idx" ON "CorpusPrompt"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSignal_deduplicationKey_key" ON "TrainingSignal"("deduplicationKey");

-- CreateIndex
CREATE INDEX "TrainingSignal_sourceType_idx" ON "TrainingSignal"("sourceType");

-- CreateIndex
CREATE INDEX "TrainingSignal_signalType_idx" ON "TrainingSignal"("signalType");

-- CreateIndex
CREATE INDEX "TrainingSignal_corpusId_idx" ON "TrainingSignal"("corpusId");

-- CreateIndex
CREATE INDEX "TrainingSignal_sourceId_idx" ON "TrainingSignal"("sourceId");

-- CreateIndex
CREATE INDEX "TrainingSignal_createdAt_idx" ON "TrainingSignal"("createdAt");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "AIRuntimeEvent_operation_idx" ON "AIRuntimeEvent"("operation");

-- CreateIndex
CREATE INDEX "AIRuntimeEvent_primaryProvider_idx" ON "AIRuntimeEvent"("primaryProvider");

-- CreateIndex
CREATE INDEX "AIRuntimeEvent_resolvedProvider_idx" ON "AIRuntimeEvent"("resolvedProvider");

-- CreateIndex
CREATE INDEX "AIRuntimeEvent_success_idx" ON "AIRuntimeEvent"("success");

-- CreateIndex
CREATE INDEX "AIRuntimeEvent_createdAt_idx" ON "AIRuntimeEvent"("createdAt");

-- CreateIndex
CREATE INDEX "EvaluationResult_evaluationRunId_idx" ON "EvaluationResult"("evaluationRunId");

-- CreateIndex
CREATE INDEX "EvaluationResult_corpusPromptId_idx" ON "EvaluationResult"("corpusPromptId");

-- CreateIndex
CREATE INDEX "EvaluationResult_feedbackId_idx" ON "EvaluationResult"("feedbackId");

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
CREATE INDEX "ProviderBenchmarkResult_errorType_idx" ON "ProviderBenchmarkResult"("errorType");

-- CreateIndex
CREATE INDEX "ProviderBenchmarkResult_qualityScore_idx" ON "ProviderBenchmarkResult"("qualityScore");

-- CreateIndex
CREATE INDEX "ProviderBenchmarkResult_createdAt_idx" ON "ProviderBenchmarkResult"("createdAt");

-- CreateIndex
CREATE INDEX "AIRuntimeDailyAggregate_bucketStart_idx" ON "AIRuntimeDailyAggregate"("bucketStart");

-- CreateIndex
CREATE INDEX "AIRuntimeDailyAggregate_resolvedProvider_idx" ON "AIRuntimeDailyAggregate"("resolvedProvider");

-- CreateIndex
CREATE INDEX "AIRuntimeDailyAggregate_operation_idx" ON "AIRuntimeDailyAggregate"("operation");

-- CreateIndex
CREATE UNIQUE INDEX "AIRuntimeDailyAggregate_bucketStart_operation_resolvedProvi_key" ON "AIRuntimeDailyAggregate"("bucketStart", "operation", "resolvedProvider", "model", "success");

-- CreateIndex
CREATE INDEX "SourceScanDailyAggregate_bucketStart_idx" ON "SourceScanDailyAggregate"("bucketStart");

-- CreateIndex
CREATE INDEX "SourceScanDailyAggregate_sourceId_idx" ON "SourceScanDailyAggregate"("sourceId");

-- CreateIndex
CREATE INDEX "SourceScanDailyAggregate_trigger_idx" ON "SourceScanDailyAggregate"("trigger");

-- CreateIndex
CREATE INDEX "SourceScanDailyAggregate_provider_idx" ON "SourceScanDailyAggregate"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "SourceScanDailyAggregate_bucketStart_sourceId_trigger_statu_key" ON "SourceScanDailyAggregate"("bucketStart", "sourceId", "trigger", "status", "provider");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Optimization" ADD CONSTRAINT "Optimization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_optimizationId_fkey" FOREIGN KEY ("optimizationId") REFERENCES "Optimization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceScanEvent" ADD CONSTRAINT "SourceScanEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceCredibilityAlert" ADD CONSTRAINT "SourceCredibilityAlert_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceCredibilityAlert" ADD CONSTRAINT "SourceCredibilityAlert_scanEventId_fkey" FOREIGN KEY ("scanEventId") REFERENCES "SourceScanEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredPrompt" ADD CONSTRAINT "DiscoveredPrompt_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurationReview" ADD CONSTRAINT "CurationReview_discoveredPromptId_fkey" FOREIGN KEY ("discoveredPromptId") REFERENCES "DiscoveredPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurationReview" ADD CONSTRAINT "CurationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorpusPrompt" ADD CONSTRAINT "CorpusPrompt_discoveredPromptId_fkey" FOREIGN KEY ("discoveredPromptId") REFERENCES "DiscoveredPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSignal" ADD CONSTRAINT "TrainingSignal_corpusId_fkey" FOREIGN KEY ("corpusId") REFERENCES "CorpusPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_evaluationRunId_fkey" FOREIGN KEY ("evaluationRunId") REFERENCES "EvaluationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_corpusPromptId_fkey" FOREIGN KEY ("corpusPromptId") REFERENCES "CorpusPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderBenchmarkResult" ADD CONSTRAINT "ProviderBenchmarkResult_benchmarkRunId_fkey" FOREIGN KEY ("benchmarkRunId") REFERENCES "ProviderBenchmarkRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
