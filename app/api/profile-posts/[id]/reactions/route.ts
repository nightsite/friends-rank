import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { createAppNotification } from "@/lib/app-notifications";
import { notifyUser } from "@/lib/web-push";

export const runtime = "nodejs";

const ALLOWED = ["🔥", "😂", "💀", "👀", "❤️"] as const;

type Body = {
  emoji?: unknown;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: postId } = await params;

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const emoji = String(body.emoji ?? "");
  if (!ALLOWED.includes(emoji as (typeof ALLOWED)[number])) {
    return NextResponse.json({ error: "Unsupported reaction." }, { status: 400 });
  }

  const post = await prisma.profilePost.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const existing = await prisma.profilePostReaction.findUnique({
    where: {
      postId_userId_emoji: {
        postId,
        userId: session.userId,
        emoji,
      },
    },
  });
  if (existing) {
    await prisma.profilePostReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, removed: true });
  }

  await prisma.profilePostReaction.create({
    data: {
      postId,
      userId: session.userId,
      emoji,
    },
  });
  if (post.authorId !== session.userId) {
    const actor = await prisma.user.findUnique({ where: { id: session.userId } });
    const targetUser = await prisma.user.findUnique({ where: { id: post.targetId } });
    if (actor) {
      const bodyText = `${emoji} on your profile wall`;
      void createAppNotification({
        userId: post.authorId,
        kind: "profile_wall_reaction",
        title: `${actor.displayName} reacted to your wall post`,
        body: bodyText,
        href: targetUser ? `/u/${targetUser.slug}` : "/u/me",
      }).catch(() => {});
      void notifyUser({
        userId: post.authorId,
        title: `${actor.displayName} reacted to your wall post`,
        body: bodyText,
        url: targetUser ? `/u/${targetUser.slug}` : "/u/me",
      }).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true, added: true });
}
