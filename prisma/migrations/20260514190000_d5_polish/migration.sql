-- D5: polish — optional per-profile theme song

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themeAudioUrl" TEXT;
