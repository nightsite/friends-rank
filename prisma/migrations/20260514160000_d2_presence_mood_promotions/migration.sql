-- D2: presence (lastSeenAt + mood) and rank promotion tracking

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mood" TEXT;

CREATE TABLE IF NOT EXISTS "RankPromotion" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RankPromotion_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RankPromotion_userId_scope_key"
  ON "RankPromotion"("userId", "scope");

CREATE INDEX IF NOT EXISTS "RankPromotion_userId_idx"
  ON "RankPromotion"("userId");
