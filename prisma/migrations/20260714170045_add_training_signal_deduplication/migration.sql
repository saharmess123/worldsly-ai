/*
  Warnings:

  - Added the required column `updatedAt` to the `TrainingSignal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrainingSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deduplicationKey" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "corpusId" TEXT,
    "signalType" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingSignal_corpusId_fkey" FOREIGN KEY ("corpusId") REFERENCES "CorpusPrompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TrainingSignal" ("corpusId", "createdAt", "id", "metadata", "score", "signalType", "sourceId", "sourceType") SELECT "corpusId", "createdAt", "id", "metadata", "score", "signalType", "sourceId", "sourceType" FROM "TrainingSignal";
DROP TABLE "TrainingSignal";
ALTER TABLE "new_TrainingSignal" RENAME TO "TrainingSignal";
CREATE UNIQUE INDEX "TrainingSignal_deduplicationKey_key" ON "TrainingSignal"("deduplicationKey");
CREATE INDEX "TrainingSignal_sourceType_idx" ON "TrainingSignal"("sourceType");
CREATE INDEX "TrainingSignal_signalType_idx" ON "TrainingSignal"("signalType");
CREATE INDEX "TrainingSignal_corpusId_idx" ON "TrainingSignal"("corpusId");
CREATE INDEX "TrainingSignal_sourceId_idx" ON "TrainingSignal"("sourceId");
CREATE INDEX "TrainingSignal_createdAt_idx" ON "TrainingSignal"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
