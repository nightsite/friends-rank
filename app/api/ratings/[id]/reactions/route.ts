import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { isAllowedEmoji } from "@/lib/reactions";

export const runtime = "nodejs";

type Body = { emoji?: unknown };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: ratingId } = await params;
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isAllowedEmoji(body.emoji)) {
    return NextResponse.json({ error: "Unsupported reaction" }, { status: 400 });
  }
  const emoji = body.emoji;

  const rating = await prisma.rating.findUnique({ where: { id: ratingId } });
  if (!rating) return NextResponse.json({ error: "Rating not found" }, { status: 404 });

  const existing = await prisma.reaction.findUnique({
    where: { ratingId_userId_emoji: { ratingId, userId: session.userId, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, removed: true });
  }

  await prisma.reaction.create({
    data: { ratingId, userId: session.userId, emoji },
  });
  return NextResponse.json({ ok: true, added: true });
}
