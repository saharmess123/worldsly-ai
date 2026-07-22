-- CreateTable
CREATE TABLE "SourceCredibilityAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "SourceCredibilityAlert_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SourceCredibilityAlert_scanEventId_fkey" FOREIGN KEY ("scanEventId") REFERENCES "SourceScanEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
