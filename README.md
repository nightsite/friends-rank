# Friends Rank

Private site for five friends: sign in with your name + personal PIN, rate each other in fixed categories (Gym, Gaming, Face Card, Status) with 1–5 stars and optional comments, photos, voice notes, reactions, replies, view leaderboards, climb a weekly digest, and check yourself in the glow-up chart.

**This copy lives at:** `C:\Users\depo9\Desktop\cursor_test`

## Stack

- [Next.js](https://nextjs.org/) App Router
- [Prisma](https://www.prisma.io/) + PostgreSQL (e.g. [Supabase](https://supabase.com/) free tier)
- [iron-session](https://github.com/vvo/iron-session) (signed httpOnly cookie)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) for PIN hashes
- [web-push](https://www.npmjs.com/package/web-push) for PWA push notifications (optional)
- In-memory rate limit on login attempts (per IP + username)

## Local setup

1. Open this folder in VS Code or Cursor: `C:\Users\depo9\Desktop\cursor_test`

2. Copy [`.env.example`](.env.example) to `.env` and fill values:

   - `DATABASE_URL` — Postgres connection string (SSL for Supabase).
   - `SESSION_PASSWORD` — at least **32 characters** (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   - Optional: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` for push notifications.

3. Install dependencies:

   ```bash
   npm install
   ```

4. Apply schema and seed users + categories:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

   For local development without migration history you can instead run:

   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000/login`. After seeding, default PIN is **`changeme`** for everyone until you set `SEED_PIN_DEFAULT` or per-user `SEED_PIN_OMER`, `SEED_PIN_TUGRAHAN`, etc. (minimum 6 characters), then run `npm run db:seed` again.

## Why the site might not open

The two most common causes are:

1. **You haven't started the dev server yet.** Run `npm run dev` in `C:\Users\depo9\Desktop\cursor_test`.
2. **Your database is missing the new columns/tables.** Whenever the schema changes (e.g. avatars, bios, reactions), run:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   npm run dev
   ```

If it still won't start, check the dev server terminal — Prisma will print the exact missing column or env error.

## Settings

`/settings` lets you:

- Upload a profile picture or **animated GIF** (512px square, ≤ 2 MB; GIFs are stored as-is and play everywhere your avatar appears).
- Edit your display name, short bio, pinned post, tags, banner, and anime-style profile background controls.
- Enable push notifications (requires VAPID keys, see below).
- Change your PIN (keeps you logged in).

## Social + discovery (Batch B)

- Public profiles: `/u/[slug]` (and `/u/me`)
- Profile ratings (1 per rater/target every 7 days)
- Follow/unfollow
- Profile wall posts + emoji reactions
- Discover page (`/discover`) with search, trending profiles, weekly profile leaderboard, and most improved

## Inbox + admin + seasonal events (Batch C)

- In-app notifications: `/inbox`
- Admin dashboard: `/admin` (requires `ADMIN_SLUGS` env, comma-separated slugs)
- Invite onboarding links: `/invite/[token]`
- Seasonal events + claims: `/events`

## Push notifications (optional)

1. One time only, generate VAPID keys:

   ```bash
   npx web-push generate-vapid-keys
   ```

2. Paste them into `.env` as `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
3. Restart the dev server, open **Settings**, and click **Enable notifications**.

When someone rates you, the server pings every active subscription (`Ömer rated you in Gaming ★★★★★`) using your VAPID identity. Subscriptions that come back `404`/`410` are auto-deleted.

## Deploy (e.g. Vercel + Supabase)

1. Create a Supabase project, copy the **URI** database connection string into `DATABASE_URL` on Vercel (use the **pooled** or **direct** URL per Supabase docs; include `?sslmode=require` if required).
2. Set `SESSION_PASSWORD` (same rules as local — 32+ chars, keep it secret).
3. Optionally set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` for notifications.
4. Set `ADMIN_SLUGS` if you want access to `/admin` (example: `omer,tugrahan`).
5. Build command: `npm run build` (already runs `prisma generate` via the `build` script).
6. Run migrations against production once:

   ```bash
   DATABASE_URL="your-prod-url" npx prisma migrate deploy
   DATABASE_URL="your-prod-url" npm run db:seed
   ```

7. **PIN reset:** set new values in env (`SEED_PIN_*` or `SEED_PIN_DEFAULT`) and run `npm run db:seed` again against that database (seed uses `upsert` and replaces `pinHash`). Alternatively update `pinHash` in Prisma Studio / SQL with a freshly generated bcrypt hash.

## Security notes

- Use HTTPS in production (Vercel provides this).
- Replace default seed PINs before sharing the URL.
- Login is rate-limited in-process; for multi-instance production consider Redis (e.g. Upstash) for shared counters.
- Profile pictures, photo attachments, and voice notes are stored as base64 inline in Postgres (≤ 2–4 MB each). Move to object storage (S3/Supabase Storage) once the crew gets photo-happy.

## Project layout

- [`prisma/schema.prisma`](prisma/schema.prisma) — core models + social/discovery (`ProfileRating`, `Follow`, `ProfilePost`, `ProfilePostReaction`) + Batch C models (`AppNotification`, `InviteToken`, `SeasonalEvent`, `SeasonalEventClaim`)
- [`prisma/seed.ts`](prisma/seed.ts) — five users + four categories
- [`middleware.ts`](middleware.ts) — session gate + `/login`/PWA static exceptions
- [`app/api/auth/login/route.ts`](app/api/auth/login/route.ts) — PIN check + session
- [`app/api/ratings/route.ts`](app/api/ratings/route.ts) — upsert rating, push notify
- [`app/api/ratings/[id]/reactions/route.ts`](app/api/ratings/[id]/reactions/route.ts) — toggle emoji reactions
- [`app/api/ratings/[id]/replies/route.ts`](app/api/ratings/[id]/replies/route.ts) — post reply with media
- [`app/api/me/settings/route.ts`](app/api/me/settings/route.ts) — profile + PIN updates
- [`app/api/push/subscribe/route.ts`](app/api/push/subscribe/route.ts) — store browser push subscription
- [`app/api/follows/route.ts`](app/api/follows/route.ts), [`app/api/profile-posts/route.ts`](app/api/profile-posts/route.ts), [`app/api/profile-posts/[id]/reactions/route.ts`](app/api/profile-posts/[id]/reactions/route.ts) — social layer
- [`app/api/notifications/read/route.ts`](app/api/notifications/read/route.ts) — inbox read state
- [`app/api/admin/invites/route.ts`](app/api/admin/invites/route.ts), [`app/api/admin/events/route.ts`](app/api/admin/events/route.ts), [`app/api/invites/redeem/route.ts`](app/api/invites/redeem/route.ts), [`app/api/seasonal/claim/route.ts`](app/api/seasonal/claim/route.ts) — admin/onboarding/events
- [`app/digest/page.tsx`](app/digest/page.tsx) — weekly climbers/sliders + quote of the week
- [`app/u/[slug]/page.tsx`](app/u/[slug]/page.tsx), [`app/discover/page.tsx`](app/discover/page.tsx), [`app/inbox/page.tsx`](app/inbox/page.tsx), [`app/admin/page.tsx`](app/admin/page.tsx), [`app/events/page.tsx`](app/events/page.tsx) — public profiles + discovery + inbox + admin + seasonal events
- [`components/Avatar.tsx`](components/Avatar.tsx), [`components/MediaComposer.tsx`](components/MediaComposer.tsx), [`components/GlowUpChart.tsx`](components/GlowUpChart.tsx), [`components/ReactionBar.tsx`](components/ReactionBar.tsx), [`components/ReplyThread.tsx`](components/ReplyThread.tsx), [`components/EnableNotifications.tsx`](components/EnableNotifications.tsx)
- [`lib/streak.ts`](lib/streak.ts), [`lib/badges.ts`](lib/badges.ts), [`lib/digest.ts`](lib/digest.ts), [`lib/confetti.ts`](lib/confetti.ts), [`lib/web-push.ts`](lib/web-push.ts), [`lib/image-process.ts`](lib/image-process.ts), [`lib/media-validation.ts`](lib/media-validation.ts)
- [`public/manifest.webmanifest`](public/manifest.webmanifest), [`public/sw.js`](public/sw.js), [`public/icons/icon.svg`](public/icons/icon.svg) — PWA install + push handlers
