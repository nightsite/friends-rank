import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { isAdminSlug } from "@/lib/admin";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { AdminInviteForm } from "@/components/admin/AdminInviteForm";
import { AdminEventForm } from "@/components/admin/AdminEventForm";
import { AdminEventToggleButton } from "@/components/admin/AdminEventToggleButton";

export default async function AdminPage() {
  const session = await requireSession();
  if (!session) redirect("/login");
  if (!isAdminSlug(session.slug)) redirect("/");

  const [users, ratings, profileRatings, invites, events, notifications] = await Promise.all([
    prisma.user.count(),
    prisma.rating.count(),
    prisma.profileRating.count(),
    prisma.inviteToken.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { createdBy: true, redeemedBy: true },
    }),
    prisma.seasonalEvent.findMany({
      orderBy: { startsAt: "desc" },
      include: { _count: { select: { claims: true } } },
      take: 30,
    }),
    prisma.appNotification.count(),
  ]);

  return (
    <PageShell
      title="Admin dashboard"
      description="Manage invite onboarding, seasonal events, and monitor usage."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-xs text-zinc-500">Users</p>
          <p className="mt-1 text-2xl font-semibold text-white">{users}</p>
        </Card>
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-xs text-zinc-500">Category ratings</p>
          <p className="mt-1 text-2xl font-semibold text-white">{ratings}</p>
        </Card>
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-xs text-zinc-500">Profile ratings</p>
          <p className="mt-1 text-2xl font-semibold text-white">{profileRatings}</p>
        </Card>
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-xs text-zinc-500">Notifications sent</p>
          <p className="mt-1 text-2xl font-semibold text-white">{notifications}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card hover={false} className="border-zinc-700/50">
          <h2 className="font-display text-lg font-semibold text-white">Create invite token</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Generate onboarding links. Redeeming can auto-award active seasonal badges.
          </p>
          <div className="mt-4">
            <AdminInviteForm />
          </div>
        </Card>

        <Card hover={false} className="border-zinc-700/50">
          <h2 className="font-display text-lg font-semibold text-white">Create seasonal event</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Seasonal events appear in /events and can be claimed by users.
          </p>
          <div className="mt-4">
            <AdminEventForm />
          </div>
        </Card>
      </div>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-lg font-semibold text-white">Recent invite tokens</h2>
        <ul className="mt-3 space-y-2">
          {invites.length === 0 ? (
            <li className="text-sm text-zinc-500">No invites created yet.</li>
          ) : (
            invites.map((i) => (
              <li key={i.id} className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-zinc-200">
                    <span className="font-mono text-xs">{i.token.slice(0, 10)}…</span>{" "}
                    {i.note ? `· ${i.note}` : ""}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {i.redeemedBy ? `Redeemed by ${i.redeemedBy.displayName}` : "Not redeemed"}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-lg font-semibold text-white">Seasonal events</h2>
        <ul className="mt-3 space-y-2">
          {events.length === 0 ? (
            <li className="text-sm text-zinc-500">No events yet.</li>
          ) : (
            events.map((e) => (
              <li key={e.id} className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{e.title}</p>
                    <p className="text-xs text-zinc-500">
                      {e.slug} · claims {e._count.claims} · {e.isActive ? "active" : "inactive"}
                    </p>
                  </div>
                  <AdminEventToggleButton eventId={e.id} active={e.isActive} />
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </PageShell>
  );
}
