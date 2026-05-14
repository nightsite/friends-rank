import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { createAppNotification } from "@/lib/app-notifications";
import { notifyUser } from "@/lib/web-push";

export const runtime = "nodejs";

const BODY_MAX = 500;

type Body = {
  targetSlug?: unknown;
  body?: unknown;
};

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetSlug = String(body.targetSlug ?? "").trim().toLowerCase();
  const text = String(body.body ?? "").trim().slice(0, BODY_MAX);
  if (!targetSlug) return NextResponse.json({ error: "Missing target user." }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Write something first." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { slug: targetSlug } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const row = await prisma.profilePost.create({
    data: {
      authorId: session.userId,
      targetId: target.id,
      body: text,
    },
  });
  const author = await prisma.user.findUnique({ where: { id: session.userId } });
  if (author && target.id !== session.userId) {
    void createAppNotification({
      userId: target.id,
      kind: "profile_wall_post",
      title: `${author.displayName} posted on your wall`,
      body: text.slice(0, 120),
      href: `/u/${target.slug}`,
    }).catch(() => {});
    void notifyUser({
      userId: target.id,
      title: `${author.displayName} posted on your wall`,
      body: text.slice(0, 120),
      url: `/u/${target.slug}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: row.id });
}
