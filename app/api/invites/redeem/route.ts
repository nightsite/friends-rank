import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { createAppNotification } from "@/lib/app-notifications";

export const runtime = "nodejs";

type Body = { token?: unknown };

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const token = String(body.token ?? "").trim().toLowerCase();
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { createdBy: true },
  });
  if (!invite) return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  if (invite.redeemedById) {
    return NextResponse.json({ error: "Invite already redeemed." }, { status: 409 });
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite expired." }, { status: 410 });
  }

  await prisma.inviteToken.update({
    where: { id: invite.id },
    data: {
      redeemedById: session.userId,
      redeemedAt: new Date(),
    },
  });

  const activeEvent = await prisma.seasonalEvent.findFirst({
    where: {
      isActive: true,
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "desc" },
  });
  if (activeEvent) {
    await prisma.seasonalEventClaim
      .upsert({
        where: { userId_eventId: { userId: session.userId, eventId: activeEvent.id } },
        create: {
          userId: session.userId,
          eventId: activeEvent.id,
          reason: `Invite token ${invite.token.slice(0, 8)} redeemed`,
        },
        update: {},
      })
      .catch(() => {});
  }

  void createAppNotification({
    userId: session.userId,
    kind: "invite_redeemed",
    title: "Invite redeemed",
    body: `You redeemed an invite from ${invite.createdBy.displayName}.`,
    href: "/events",
  }).catch(() => {});

  return NextResponse.json({ ok: true, eventAwarded: Boolean(activeEvent) });
}
