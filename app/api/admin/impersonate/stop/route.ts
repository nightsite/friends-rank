import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import {
  compactAvatarForSession,
  getSessionOptions,
  type SessionData,
} from "@/lib/session-config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions(),
  );
  if (!session.adminUserId || !session.adminSlug) {
    return NextResponse.json(
      { error: "Es läuft gerade keine Admin-Session als jemand anderer." },
      { status: 400 },
    );
  }

  let adminAvatar: string | null = null;
  try {
    const admin = await prisma.user.findUnique({
      where: { id: session.adminUserId },
      select: { avatarUrl: true },
    });
    adminAvatar = admin?.avatarUrl ?? null;
  } catch {
    adminAvatar = null;
  }

  session.userId = session.adminUserId;
  session.slug = session.adminSlug;
  session.displayName = session.adminDisplayName ?? session.adminSlug;
  session.avatarUrl = compactAvatarForSession(adminAvatar);
  session.isImpersonating = false;
  session.adminUserId = undefined;
  session.adminSlug = undefined;
  session.adminDisplayName = undefined;

  try {
    await session.save();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Cookie length") || msg.includes("too big")) {
      return NextResponse.json(
        {
          error:
            "Session-Cookie zu groß. Bitte in den Einstellungen einen kürzeren Avatar (URL ohne riesiges data:-Bild) setzen.",
        },
        { status: 413 },
      );
    }
    throw e;
  }
  return response;
}
