import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { createAppNotification } from "@/lib/app-notifications";

export const runtime = "nodejs";

type Body = { eventId?: unknown };

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventId = String(body.eventId ?? "");
  if (!eventId) return NextResponse.json({ error: "Missing event id." }, { status: 400 });

  const event = await prisma.seasonalEvent.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const now = Date.now();
  if (!event.isActive || event.startsAt.getTime() > now || event.endsAt.getTime() < now) {
    return NextResponse.json({ error: "Event is not currently active." }, { status: 400 });
  }

  await prisma.seasonalEventClaim.upsert({
    where: { userId_eventId: { userId: session.userId, eventId } },
    create: {
      userId: session.userId,
      eventId,
      reason: "Manual claim",
    },
    update: {},
  });

  void createAppNotification({
    userId: session.userId,
    kind: "seasonal_claim",
    title: "Seasonal badge claimed",
    body: `You claimed ${event.badgeLabel || event.title}.`,
    href: "/events",
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
