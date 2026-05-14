import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { USER_SLUGS } from "@/lib/constants";
import { getSessionOptions } from "@/lib/session-config";
import type { SessionData } from "@/lib/session-config";
import { rateLimitLogin } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { slug?: string; pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = String(body.slug || "").toLowerCase();
  const pin = String(body.pin || "");

  if (!USER_SLUGS.includes(slug as (typeof USER_SLUGS)[number])) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rl = rateLimitLogin(`${ip}:${slug}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts", retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { slug } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const match = await bcrypt.compare(pin, user.pinHash);
  if (!match) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions(),
  );
  session.userId = user.id;
  session.slug = user.slug;
  session.displayName = user.displayName;
  session.avatarUrl = user.avatarUrl ?? undefined;
  session.adminUserId = undefined;
  session.adminSlug = undefined;
  session.adminDisplayName = undefined;
  session.isImpersonating = false;
  await session.save();
  return response;
}
