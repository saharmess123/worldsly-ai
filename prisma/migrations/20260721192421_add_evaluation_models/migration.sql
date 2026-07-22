-- CreateTable
CREATE TABLE "EvaluationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meanAbsoluteError" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "testedCount" INTEGER NOT NULL,
    "runType" TEXT NOT NULL DEFAULT 'quality_calibration',
    "provider" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EvaluationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationResult_evaluationRunId_fkey" FOREIGN KEY ("evaluationRunId") REFERENCES "EvaluationRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvaluationResult_corpusPromptId_fkey" FOREIGN KEY ("corpusPromptId") REFERENCES "CorpusPrompt" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EvaluationResult_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EvaluationResult_evaluationRunId_idx" ON "EvaluationResult"("evaluationRunId");

-- CreateIndex
CREATE INDEX "EvaluationResult_corpusPromptId_idx" ON "EvaluationResult"("corpusPromptId");

-- CreateIndex
CREATE INDEX "EvaluationResult_feedbackId_idx" ON "EvaluationResult"("feedbackId");
