import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

type Body = {
  note?: unknown;
  expiresDays?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  let body: Body = {};
  try {
    body = await request.json();
  } catch {}

  const note = String(body.note ?? "").trim().slice(0, 160);
  const days = Math.max(1, Math.min(90, Number(body.expiresDays || 14)));
  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const row = await prisma.inviteToken.create({
    data: {
      token,
      note: note || null,
      createdById: session.userId,
      expiresAt,
    },
  });

  return NextResponse.json({ ok: true, token: row.token, expiresAt: row.expiresAt });
}
