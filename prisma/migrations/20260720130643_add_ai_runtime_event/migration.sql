-- CreateTable
CREATE TABLE "AIRuntimeEvent" (
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
