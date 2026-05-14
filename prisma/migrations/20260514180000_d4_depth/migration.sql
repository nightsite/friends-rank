-- D4: reason tags on ratings, daily challenge progress, private vault notes

ALTER TABLE "Rating" ADD COLUMN IF NOT EXISTS "reasons" TEXT;

CREATE TABLE IF NOT EXISTS "DailyChallengeClaim" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "dayKey" TEXT NOT NULL,
  "challengeKind" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyChallengeClaim_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailyChallengeClaim_user_day_kind_key"
  ON "DailyChallengeClaim"("userId", "dayKey", "challengeKind");

CREATE INDEX IF NOT EXISTS "DailyChallengeClaim_userId_completedAt_idx"
  ON "DailyChallengeClaim"("userId", "completedAt");

CREATE TABLE IF NOT EXISTS "VaultNote" (
  "id" TEXT PRIMARY KEY,
  "ownerId" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "body" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VaultNote_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VaultNote_targetId_fkey" FOREIGN KEY ("targetId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "VaultNote_owner_target_key"
  ON "VaultNote"("ownerId", "targetId");

CREATE INDEX IF NOT EXISTS "VaultNote_ownerId_idx" ON "VaultNote"("ownerId");
CREATE INDEX IF NOT EXISTS "VaultNote_targetId_idx" ON "VaultNote"("targetId");
