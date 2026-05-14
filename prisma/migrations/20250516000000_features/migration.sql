-- AlterTable User
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "streakCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "streakLastDay" TEXT;

-- AlterTable Rating
ALTER TABLE "Rating" ADD COLUMN "imageData" TEXT;
ALTER TABLE "Rating" ADD COLUMN "imageMime" TEXT;
ALTER TABLE "Rating" ADD COLUMN "audioData" TEXT;
ALTER TABLE "Rating" ADD COLUMN "audioMime" TEXT;
ALTER TABLE "Rating" ADD COLUMN "audioMs" INTEGER;

-- CreateTable Reaction
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "ratingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable Reply
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "ratingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "imageData" TEXT,
    "imageMime" TEXT,
    "audioData" TEXT,
    "audioMime" TEXT,
    "audioMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable WebPushSubscription
CREATE TABLE "WebPushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebPushSubscription_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Reaction_ratingId_userId_emoji_key" ON "Reaction"("ratingId", "userId", "emoji");
CREATE INDEX "Reaction_ratingId_idx" ON "Reaction"("ratingId");
CREATE INDEX "Reply_ratingId_idx" ON "Reply"("ratingId");
CREATE UNIQUE INDEX "WebPushSubscription_endpoint_key" ON "WebPushSubscription"("endpoint");
CREATE INDEX "WebPushSubscription_userId_idx" ON "WebPushSubscription"("userId");

-- Foreign keys
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey"  FOREIGN KEY ("userId")  REFERENCES "User"("id")   ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reply"    ADD CONSTRAINT "Reply_ratingId_fkey"   FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reply"    ADD CONSTRAINT "Reply_authorId_fkey"   FOREIGN KEY ("authorId") REFERENCES "User"("id")   ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebPushSubscription" ADD CONSTRAINT "WebPushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
