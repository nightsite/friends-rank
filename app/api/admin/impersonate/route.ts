import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { getSessionOptions, type SessionData } from "@/lib/session-config";
import { isAdminSession } from "@/lib/admin";

export const runtime = "nodejs";

type Body = {
  slug?: unknown;
};

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(request, response, getSessionOptions());
  if (!session.userId || !session.slug || !isAdminSession(session)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const targetSlug = String(body.slug ?? "").trim().toLowerCase();
  if (!targetSlug) return NextResponse.json({ error: "Target slug missing." }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { slug: targetSlug } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (!session.adminUserId) {
    session.adminUserId = session.userId;
    session.adminSlug = session.slug;
    session.adminDisplayName = session.displayName ?? session.slug;
  }

  session.userId = target.id;
  session.slug = target.slug;
  session.displayName = target.displayName;
  session.avatarUrl = target.avatarUrl ?? undefined;
  session.isImpersonating = true;
  await session.save();
  return response;
}

