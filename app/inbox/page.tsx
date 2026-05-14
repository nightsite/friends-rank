import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { NotificationActions } from "@/components/NotificationActions";
import { formatRelative } from "@/lib/format-time";
import { EmptyState } from "@/components/EmptyState";

export default async function InboxPage() {
  const session = await requireSession();
  if (!session) redirect("/login");

  const rows = await prisma.appNotification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 120,
  });
  const unread = rows.filter((r) => !r.readAt).length;

  return (
    <PageShell
      title="Inbox"
      description="Alle In-App-Notifications. Bleib bei Follows, Wall-Aktivität und Ratings auf dem Laufenden."
      actions={rows.length > 0 ? <NotificationActions mode="all" /> : undefined}
    >
      <Card hover={false} className="border-zinc-700/50">
        <p className="text-sm text-zinc-400">
          {rows.length} gesamt · <span className="text-amber-300">{unread} ungelesen</span>
        </p>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          variant="inbox"
          title="Deine Inbox ist leer"
          hint="Neue Ratings, Follows, Wall-Posts, Promotions und Challenges landen genau hier."
          actionLabel="Jemanden ranken"
          actionHref="/"
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => (
            <li key={n.id}>
              <Card
                hover={false}
                className={`border ${n.readAt ? "border-zinc-800/70" : "border-amber-500/50 bg-amber-500/5"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-zinc-100">{n.title}</p>
                  <p className="text-xs text-zinc-500">{formatRelative(new Date(n.createdAt))}</p>
                </div>
                <p className="mt-1 text-sm text-zinc-300">{n.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.href ? (
                    <Link
                      href={n.href}
                      className="inline-flex min-h-10 items-center rounded-lg border border-zinc-600/80 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-200 hover:border-zinc-500"
                    >
                      Öffnen
                    </Link>
                  ) : null}
                  {!n.readAt ? <NotificationActions mode="single" notificationId={n.id} /> : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
