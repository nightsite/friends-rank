import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { SeasonalClaimButton } from "@/components/SeasonalClaimButton";
import { EmptyState } from "@/components/EmptyState";

export default async function EventsPage() {
  const session = await requireSession();
  if (!session) redirect("/login");

  const events = await prisma.seasonalEvent.findMany({
    orderBy: { startsAt: "desc" },
    include: {
      claims: {
        where: { userId: session.userId },
        select: { id: true },
      },
      _count: { select: { claims: true } },
    },
    take: 40,
  });

  const now = Date.now();

  return (
    <PageShell
      title="Seasonal events"
      description="Join live events, claim badges, and track participation."
      actions={<Link href="/admin" className="text-sm font-medium text-amber-300">Admin</Link>}
    >
      {events.length === 0 ? (
        <EmptyState
          variant="events"
          title="No seasonal events yet"
          hint="When admins launch a season, it shows up here with badges to claim."
        />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const active = e.isActive && e.startsAt.getTime() <= now && e.endsAt.getTime() >= now;
            return (
              <li key={e.id}>
                <Card hover={false} className={`border ${active ? "border-amber-500/60" : "border-zinc-700/50"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold text-white">{e.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {e.startsAt.toLocaleString()} - {e.endsAt.toLocaleString()}
                      </p>
                      {e.description ? <p className="mt-2 text-sm text-zinc-300">{e.description}</p> : null}
                      <p className="mt-2 text-xs text-zinc-500">
                        {e.badgeLabel ? `Badge: ${e.badgeLabel}` : "Badge: Seasonal participant"} · claims{" "}
                        {e._count.claims}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${
                          active
                            ? "border-emerald-500/40 text-emerald-300"
                            : "border-zinc-700/70 text-zinc-400"
                        }`}
                      >
                        {active ? "Active" : e.isActive ? "Scheduled/Expired" : "Disabled"}
                      </span>
                      {active ? (
                        <SeasonalClaimButton eventId={e.id} alreadyClaimed={e.claims.length > 0} />
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
