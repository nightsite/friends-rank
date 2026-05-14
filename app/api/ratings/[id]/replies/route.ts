import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { REPLY_BODY_MAX, validateMediaDataUrl } from "@/lib/media-validation";

export const runtime = "nodejs";

type Body = {
  body?: unknown;
  imageData?: unknown;
  audioData?: unknown;
  audioMs?: unknown;
};

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

  const text = String(body.body ?? "").trim().slice(0, REPLY_BODY_MAX);

  let imageData: string | null = null;
  let imageMime: string | null = null;
  if (body.imageData) {
    const v = validateMediaDataUrl(body.imageData, "comment-image");
    if (v && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    if (v) {
      imageData = String(body.imageData);
      imageMime = v.mime;
    }
  }

  let audioData: string | null = null;
  let audioMime: string | null = null;
  let audioMs: number | null = null;
  if (body.audioData) {
    const v = validateMediaDataUrl(body.audioData, "comment-audio");
    if (v && "error" in v) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }
    if (v) {
      audioData = String(body.audioData);
      audioMime = v.mime;
      const ms = Number(body.audioMs);
      audioMs = Number.isFinite(ms) && ms > 0 ? Math.min(60_000, Math.round(ms)) : null;
    }
  }

  if (!text && !imageData && !audioData) {
    return NextResponse.json(
      { error: "Add some text, a photo, or a voice note." },
      { status: 400 },
    );
  }

  const rating = await prisma.rating.findUnique({ where: { id: ratingId } });
  if (!rating) return NextResponse.json({ error: "Rating not found" }, { status: 404 });

  const reply = await prisma.reply.create({
    data: {
      ratingId,
      authorId: session.userId,
      body: text,
      imageData,
      imageMime,
      audioData,
      audioMime,
      audioMs,
    },
  });

  return NextResponse.json({ ok: true, id: reply.id });
}
