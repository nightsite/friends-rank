-- AlterTable User
ALTER TABLE "User" ADD COLUMN "bannerUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "bgImageUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "bgPreset" TEXT;
ALTER TABLE "User" ADD COLUMN "bgBlur" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "bgBrightness" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "User" ADD COLUMN "accentColor" TEXT;
ALTER TABLE "User" ADD COLUMN "profileLayout" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "User" ADD COLUMN "cardStyle" TEXT NOT NULL DEFAULT 'glass';
ALTER TABLE "User" ADD COLUMN "pinnedPost" TEXT;
ALTER TABLE "User" ADD COLUMN "favoriteTags" TEXT;

-- CreateTable ProfileRating
CREATE TABLE "ProfileRating" (
    "id" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "rateeId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileRating_raterId_rateeId_key" ON "ProfileRating"("raterId", "rateeId");
CREATE INDEX "ProfileRating_rateeId_updatedAt_idx" ON "ProfileRating"("rateeId", "updatedAt");

ALTER TABLE "ProfileRating" ADD CONSTRAINT "ProfileRating_raterId_fkey"
FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileRating" ADD CONSTRAINT "ProfileRating_rateeId_fkey"
FOREIGN KEY ("rateeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
