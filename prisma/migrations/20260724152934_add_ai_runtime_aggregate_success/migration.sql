/*
  Warnings:

  - Added the required column `success` to the `AIRuntimeDailyAggregate` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIRuntimeDailyAggregate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucketStart" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AIRuntimeDailyAggregate" ("bucketStart", "createdAt", "errorCount", "failureCount", "fallbackCount", "id", "model", "operation", "requestCount", "resolvedProvider", "successCount", "totalAttempts", "totalLatencyMs", "updatedAt") SELECT "bucketStart", "createdAt", "errorCount", "failureCount", "fallbackCount", "id", "model", "operation", "requestCount", "resolvedProvider", "successCount", "totalAttempts", "totalLatencyMs", "updatedAt" FROM "AIRuntimeDailyAggregate";
DROP TABLE "AIRuntimeDailyAggregate";
ALTER TABLE "new_AIRuntimeDailyAggregate" RENAME TO "AIRuntimeDailyAggregate";
CREATE INDEX "AIRuntimeDailyAggregate_bucketStart_idx" ON "AIRuntimeDailyAggregate"("bucketStart");
CREATE INDEX "AIRuntimeDailyAggregate_resolvedProvider_idx" ON "AIRuntimeDailyAggregate"("resolvedProvider");
CREATE INDEX "AIRuntimeDailyAggregate_operation_idx" ON "AIRuntimeDailyAggregate"("operation");
CREATE UNIQUE INDEX "AIRuntimeDailyAggregate_bucketStart_operation_resolvedProvider_model_success_key" ON "AIRuntimeDailyAggregate"("bucketStart", "operation", "resolvedProvider", "model", "success");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
