import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import {
  compactAvatarForSession,
  getSessionOptions,
  type SessionData,
} from "@/lib/session-config";
import { isAdminSession } from "@/lib/admin";

export const runtime = "nodejs";

type Body = {
  slug?: unknown;
};

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  try {
    const session = await getIronSession<SessionData>(
      request,
      response,
      getSessionOptions(),
    );
    if (!session.userId || !session.slug || !isAdminSession(session)) {
      return NextResponse.json({ error: "Nur für Admins." }, { status: 403 });
    }

    let body: Body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Ungültiges JSON." }, { status: 400 });
    }

    const targetSlug = String(body.slug ?? "").trim().toLowerCase();
    if (!targetSlug)
      return NextResponse.json({ error: "Ziel-Slug fehlt." }, { status: 400 });
    const target = await prisma.user.findUnique({
      where: { slug: targetSlug },
      select: {
        id: true,
        slug: true,
        displayName: true,
        avatarUrl: true,
      },
    });
    if (!target) {
      return NextResponse.json({ error: "Nutzer nicht gefunden." }, { status: 404 });
    }

    if (!session.adminUserId) {
      session.adminUserId = session.userId;
      session.adminSlug = session.slug;
      session.adminDisplayName = session.displayName ?? session.slug;
    }

    session.userId = target.id;
    session.slug = target.slug;
    session.displayName = target.displayName;
    session.avatarUrl = compactAvatarForSession(target.avatarUrl);
    session.isImpersonating = true;
    await session.save();
    return response;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    const cookieTooLarge =
      msg.includes("Cookie length") || msg.includes("too big") || msg.includes("4 KB");
    if (cookieTooLarge) {
      return NextResponse.json(
        {
          error:
            "Session ist zu groß (z.B. sehr langer Avatar-Link). Avatar ggf. verkürzen oder als URL speichern, dann nochmal versuchen.",
        },
        { status: 413 },
      );
    }
    console.error("[impersonate]", e);
    return NextResponse.json(
      { error: "Konnte nicht wechseln (Serverfehler)." },
      { status: 500 },
    );
  }
}
