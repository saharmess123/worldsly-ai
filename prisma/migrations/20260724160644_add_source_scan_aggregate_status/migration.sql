/*
  Warnings:

  - Added the required column `status` to the `SourceScanDailyAggregate` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SourceScanDailyAggregate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucketStart" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SourceScanDailyAggregate" ("bucketStart", "completedCount", "createdAt", "createdPromptCount", "credibilityScoreCount", "credibilityScoreTotal", "failedCount", "generatedPromptCount", "id", "provider", "retrievedCharacterCount", "runningCount", "scanCount", "skippedDuplicateCount", "sourceId", "sourceName", "totalDurationMs", "trigger", "updatedAt") SELECT "bucketStart", "completedCount", "createdAt", "createdPromptCount", "credibilityScoreCount", "credibilityScoreTotal", "failedCount", "generatedPromptCount", "id", "provider", "retrievedCharacterCount", "runningCount", "scanCount", "skippedDuplicateCount", "sourceId", "sourceName", "totalDurationMs", "trigger", "updatedAt" FROM "SourceScanDailyAggregate";
DROP TABLE "SourceScanDailyAggregate";
ALTER TABLE "new_SourceScanDailyAggregate" RENAME TO "SourceScanDailyAggregate";
CREATE INDEX "SourceScanDailyAggregate_bucketStart_idx" ON "SourceScanDailyAggregate"("bucketStart");
CREATE INDEX "SourceScanDailyAggregate_sourceId_idx" ON "SourceScanDailyAggregate"("sourceId");
CREATE INDEX "SourceScanDailyAggregate_trigger_idx" ON "SourceScanDailyAggregate"("trigger");
CREATE INDEX "SourceScanDailyAggregate_provider_idx" ON "SourceScanDailyAggregate"("provider");
CREATE UNIQUE INDEX "SourceScanDailyAggregate_bucketStart_sourceId_trigger_status_provider_key" ON "SourceScanDailyAggregate"("bucketStart", "sourceId", "trigger", "status", "provider");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
