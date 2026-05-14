import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { AdminInviteForm } from "@/components/admin/AdminInviteForm";
import { AdminEventForm } from "@/components/admin/AdminEventForm";
import { AdminEventToggleButton } from "@/components/admin/AdminEventToggleButton";
import { AdminImpersonateButton } from "@/components/admin/AdminImpersonateButton";

export default async function AdminPage() {
  const session = await requireSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/");

  const [users, ratings, profileRatings, invites, events, notifications, people] = await Promise.all([
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
    prisma.user.findMany({ orderBy: { displayName: "asc" } }),
  ]);

  return (
    <PageShell
      title="Admin Dashboard"
      description="Verwalte Einladungen, Seasonal-Events und Moderation."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-xs text-zinc-500">User</p>
          <p className="mt-1 text-2xl font-semibold text-white">{users}</p>
        </Card>
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-xs text-zinc-500">Kategorie-Ratings</p>
          <p className="mt-1 text-2xl font-semibold text-white">{ratings}</p>
        </Card>
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-xs text-zinc-500">Profil-Ratings</p>
          <p className="mt-1 text-2xl font-semibold text-white">{profileRatings}</p>
        </Card>
        <Card hover={false} className="border-zinc-700/50">
          <p className="text-xs text-zinc-500">Gesendete Notifications</p>
          <p className="mt-1 text-2xl font-semibold text-white">{notifications}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card hover={false} className="border-zinc-700/50">
          <h2 className="font-display text-lg font-semibold text-white">Invite-Token erstellen</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Erzeugt Onboarding-Links. Beim Einlösen können aktive Seasonal-Badges vergeben werden.
          </p>
          <div className="mt-4">
            <AdminInviteForm />
          </div>
        </Card>

        <Card hover={false} className="border-zinc-700/50">
          <h2 className="font-display text-lg font-semibold text-white">Seasonal-Event erstellen</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Events erscheinen unter /events und können von Usern geclaimt werden.
          </p>
          <div className="mt-4">
            <AdminEventForm />
          </div>
        </Card>
      </div>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-lg font-semibold text-white">Letzte Invite-Tokens</h2>
        <ul className="mt-3 space-y-2">
          {invites.length === 0 ? (
            <li className="text-sm text-zinc-500">Noch keine Invites erstellt.</li>
          ) : (
            invites.map((i) => (
              <li key={i.id} className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-zinc-200">
                    <span className="font-mono text-xs">{i.token.slice(0, 10)}…</span>{" "}
                    {i.note ? `· ${i.note}` : ""}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {i.redeemedBy ? `Eingelöst von ${i.redeemedBy.displayName}` : "Noch nicht eingelöst"}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-lg font-semibold text-white">Temporär in User-Accounts einloggen</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Für Support/Moderation kannst du ohne PIN als beliebiger User rein. Danach im Header auf
          &quot;Impersonation beenden&quot; klicken.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {people.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2"
            >
              <span className="text-sm text-zinc-200">{u.displayName}</span>
              <AdminImpersonateButton slug={u.slug} label={u.displayName} />
            </li>
          ))}
        </ul>
      </Card>

      <Card hover={false} className="border-zinc-700/50">
        <h2 className="font-display text-lg font-semibold text-white">Seasonal-Events</h2>
        <ul className="mt-3 space-y-2">
          {events.length === 0 ? (
            <li className="text-sm text-zinc-500">Noch keine Events.</li>
          ) : (
            events.map((e) => (
              <li key={e.id} className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{e.title}</p>
                    <p className="text-xs text-zinc-500">
                      {e.slug} · Claims {e._count.claims} · {e.isActive ? "aktiv" : "inaktiv"}
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
