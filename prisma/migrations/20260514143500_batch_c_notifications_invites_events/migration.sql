-- CreateTable AppNotification
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AppNotification_userId_createdAt_idx" ON "AppNotification"("userId", "createdAt");
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable InviteToken
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "redeemedById" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");
CREATE INDEX "InviteToken_createdById_createdAt_idx" ON "InviteToken"("createdById", "createdAt");

ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_redeemedById_fkey"
FOREIGN KEY ("redeemedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable SeasonalEvent
CREATE TABLE "SeasonalEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "themePreset" TEXT,
    "badgeLabel" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonalEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeasonalEvent_slug_key" ON "SeasonalEvent"("slug");

-- CreateTable SeasonalEventClaim
CREATE TABLE "SeasonalEventClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonalEventClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeasonalEventClaim_userId_eventId_key" ON "SeasonalEventClaim"("userId", "eventId");
CREATE INDEX "SeasonalEventClaim_eventId_createdAt_idx" ON "SeasonalEventClaim"("eventId", "createdAt");

ALTER TABLE "SeasonalEventClaim" ADD CONSTRAINT "SeasonalEventClaim_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SeasonalEventClaim" ADD CONSTRAINT "SeasonalEventClaim_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "SeasonalEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
