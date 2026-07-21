-- CreateTable
CREATE TABLE "SourceScanEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "SourceScanEvent_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SourceScanEvent_sourceId_idx" ON "SourceScanEvent"("sourceId");

-- CreateIndex
CREATE INDEX "SourceScanEvent_trigger_idx" ON "SourceScanEvent"("trigger");

-- CreateIndex
CREATE INDEX "SourceScanEvent_status_idx" ON "SourceScanEvent"("status");

-- CreateIndex
CREATE INDEX "SourceScanEvent_startedAt_idx" ON "SourceScanEvent"("startedAt");
