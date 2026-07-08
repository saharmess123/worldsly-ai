-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "preferredModel" TEXT NOT NULL DEFAULT 'GPT-4.1 / GPT-5 style',
    "optimizationDepth" TEXT NOT NULL DEFAULT 'Balanced',
    "defaultGoal" TEXT NOT NULL DEFAULT 'More structured',
    "outputFormat" TEXT NOT NULL DEFAULT 'Detailed explanation',
    "personalStyle" TEXT,
    "discoveryFocus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Optimization" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Optimization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_optimizationId_fkey" FOREIGN KEY ("optimizationId") REFERENCES "Optimization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "credibilityScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastScanAt" DATETIME,
    "scanFrequency" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DiscoveredPrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "model" TEXT NOT NULL DEFAULT 'General',
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscoveredPrompt_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CurationReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discoveredPromptId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "reviewReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CurationReview_discoveredPromptId_fkey" FOREIGN KEY ("discoveredPromptId") REFERENCES "DiscoveredPrompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CurationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CorpusPrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "improvedVersion" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "model" TEXT NOT NULL DEFAULT 'General',
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "patterns" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrainingSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "corpusId" TEXT,
    "signalType" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingSignal_corpusId_fkey" FOREIGN KEY ("corpusId") REFERENCES "CorpusPrompt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "label" TEXT,
    "usageLimit" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE INDEX "CorpusPrompt_category_idx" ON "CorpusPrompt"("category");

-- CreateIndex
CREATE INDEX "CorpusPrompt_model_idx" ON "CorpusPrompt"("model");

-- CreateIndex
CREATE INDEX "CorpusPrompt_qualityScore_idx" ON "CorpusPrompt"("qualityScore");

-- CreateIndex
CREATE INDEX "TrainingSignal_sourceType_idx" ON "TrainingSignal"("sourceType");

-- CreateIndex
CREATE INDEX "TrainingSignal_signalType_idx" ON "TrainingSignal"("signalType");

-- CreateIndex
CREATE INDEX "TrainingSignal_corpusId_idx" ON "TrainingSignal"("corpusId");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");
