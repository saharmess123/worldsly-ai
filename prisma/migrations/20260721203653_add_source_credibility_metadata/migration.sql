-- AlterTable
ALTER TABLE "SourceScanEvent" ADD COLUMN "credibilityConfidence" INTEGER;
ALTER TABLE "SourceScanEvent" ADD COLUMN "credibilityReason" TEXT;
ALTER TABLE "SourceScanEvent" ADD COLUMN "credibilityScore" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "credibilityScore" INTEGER NOT NULL DEFAULT 0,
    "credibilityMethod" TEXT NOT NULL DEFAULT 'manual',
    "credibilityConfidence" INTEGER NOT NULL DEFAULT 0,
    "credibilityReason" TEXT,
    "credibilityUpdatedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastScanAt" DATETIME,
    "scanFrequency" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Source" ("createdAt", "credibilityScore", "id", "lastScanAt", "name", "scanFrequency", "status", "type", "updatedAt", "url") SELECT "createdAt", "credibilityScore", "id", "lastScanAt", "name", "scanFrequency", "status", "type", "updatedAt", "url" FROM "Source";
DROP TABLE "Source";
ALTER TABLE "new_Source" RENAME TO "Source";
CREATE INDEX "Source_type_idx" ON "Source"("type");
CREATE INDEX "Source_status_idx" ON "Source"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
