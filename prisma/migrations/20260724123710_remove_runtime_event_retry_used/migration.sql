/*
  Warnings:

  - You are about to drop the column `retryUsed` on the `AIRuntimeEvent` table. All the data in the column will be lost.

*/
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
