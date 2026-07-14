-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CorpusPrompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discoveredPromptId" TEXT,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "improvedVersion" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "model" TEXT NOT NULL DEFAULT 'General',
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "patterns" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CorpusPrompt_discoveredPromptId_fkey" FOREIGN KEY ("discoveredPromptId") REFERENCES "DiscoveredPrompt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CorpusPrompt" ("category", "createdAt", "id", "improvedVersion", "metadata", "model", "patterns", "prompt", "qualityScore", "title", "updatedAt") SELECT "category", "createdAt", "id", "improvedVersion", "metadata", "model", "patterns", "prompt", "qualityScore", "title", "updatedAt" FROM "CorpusPrompt";
DROP TABLE "CorpusPrompt";
ALTER TABLE "new_CorpusPrompt" RENAME TO "CorpusPrompt";
CREATE UNIQUE INDEX "CorpusPrompt_discoveredPromptId_key" ON "CorpusPrompt"("discoveredPromptId");
CREATE INDEX "CorpusPrompt_category_idx" ON "CorpusPrompt"("category");
CREATE INDEX "CorpusPrompt_model_idx" ON "CorpusPrompt"("model");
CREATE INDEX "CorpusPrompt_qualityScore_idx" ON "CorpusPrompt"("qualityScore");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
