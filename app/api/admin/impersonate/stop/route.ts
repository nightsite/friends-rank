import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { getSessionOptions, type SessionData } from "@/lib/session-config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(request, response, getSessionOptions());
  if (!session.adminUserId || !session.adminSlug) {
    return NextResponse.json({ error: "Not impersonating." }, { status: 400 });
  }
  session.userId = session.adminUserId;
  session.slug = session.adminSlug;
  session.displayName = session.adminDisplayName ?? session.adminSlug;
  session.isImpersonating = false;
  session.adminUserId = undefined;
  session.adminSlug = undefined;
  session.adminDisplayName = undefined;
  await session.save();
  return response;
}

