-- CreateTable Follow
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");
CREATE INDEX "Follow_followingId_createdAt_idx" ON "Follow"("followingId", "createdAt");

ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey"
FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey"
FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ProfilePost
CREATE TABLE "ProfilePost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfilePost_targetId_createdAt_idx" ON "ProfilePost"("targetId", "createdAt");

ALTER TABLE "ProfilePost" ADD CONSTRAINT "ProfilePost_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfilePost" ADD CONSTRAINT "ProfilePost_targetId_fkey"
FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ProfilePostReaction
CREATE TABLE "ProfilePostReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePostReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfilePostReaction_postId_userId_emoji_key" ON "ProfilePostReaction"("postId", "userId", "emoji");
CREATE INDEX "ProfilePostReaction_postId_idx" ON "ProfilePostReaction"("postId");

ALTER TABLE "ProfilePostReaction" ADD CONSTRAINT "ProfilePostReaction_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "ProfilePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfilePostReaction" ADD CONSTRAINT "ProfilePostReaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
