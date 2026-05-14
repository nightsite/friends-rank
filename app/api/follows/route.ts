import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { createAppNotification } from "@/lib/app-notifications";
import { notifyUser } from "@/lib/web-push";

export const runtime = "nodejs";

type Body = {
  slug?: unknown;
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

  const slug = String(body.slug ?? "").trim().toLowerCase();
  if (!slug) return NextResponse.json({ error: "Missing target user." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { slug } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.id === session.userId) {
    return NextResponse.json({ error: "You can't follow yourself." }, { status: 400 });
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: session.userId,
        followingId: target.id,
      },
    },
    create: {
      followerId: session.userId,
      followingId: target.id,
    },
    update: {},
  });
  const me = await prisma.user.findUnique({ where: { id: session.userId } });
  if (me) {
    void createAppNotification({
      userId: target.id,
      kind: "follow_received",
      title: `${me.displayName} followed you`,
      body: `Your profile is trending. Keep it fresh.`,
      href: `/u/${me.slug}`,
    }).catch(() => {});
    void notifyUser({
      userId: target.id,
      title: `${me.displayName} followed you`,
      body: "Open your profile to see what changed.",
      url: `/u/${me.slug}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim().toLowerCase();
  if (!slug) return NextResponse.json({ error: "Missing target user." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { slug } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  await prisma.follow
    .delete({
      where: {
        followerId_followingId: {
          followerId: session.userId,
          followingId: target.id,
        },
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true, following: false });
}
