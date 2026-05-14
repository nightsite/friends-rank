-- D3: gamification (XP/level), achievements, weekly champion

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "Achievement" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" TEXT,
  CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_userId_slug_key"
  ON "Achievement"("userId", "slug");

CREATE INDEX IF NOT EXISTS "Achievement_userId_unlockedAt_idx"
  ON "Achievement"("userId", "unlockedAt");

CREATE TABLE IF NOT EXISTS "WeeklyChampion" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "weekKey" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "votes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeeklyChampion_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyChampion_weekKey_key"
  ON "WeeklyChampion"("weekKey");

CREATE INDEX IF NOT EXISTS "WeeklyChampion_userId_idx"
  ON "WeeklyChampion"("userId");
