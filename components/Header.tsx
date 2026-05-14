import Link from "next/link";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import { NavLink } from "@/components/NavLink";
import { Avatar } from "@/components/Avatar";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { StopImpersonationButton } from "@/components/StopImpersonationButton";

export async function Header() {
  let authed = false;
  let displayName: string | undefined;
  let avatarUrl: string | undefined;
  let isAdmin = false;
  let isImpersonating = false;
  let unreadCount = 0;
  try {
    const session = await getSession();
    authed = Boolean(session.userId);
    displayName = session.displayName;
    avatarUrl = session.avatarUrl;
    isAdmin = isAdminSession(session);
    isImpersonating = Boolean(session.isImpersonating);
    if (session.userId) {
      try {
        unreadCount = await prisma.appNotification.count({
          where: { userId: session.userId, readAt: null },
        });
      } catch {
        unreadCount = 0;
      }
    }
  } catch {
    authed = false;
  }

  return (
    <header className="sticky top-0 z-50 -mx-4 mb-2 border-b border-white/5 bg-zinc-950/80 px-4 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/70 sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={authed ? "/" : "/login"}
          className="group flex min-w-0 items-center gap-2 font-display text-lg font-semibold tracking-tight text-white"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-lg shadow-lg shadow-amber-900/30 transition group-hover:scale-[1.02]"
            aria-hidden
          >
            ⚡
          </span>
          <span className="min-w-0">
            Friends Rank
            <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-widest text-zinc-500">
              Crew Ranking
            </span>
          </span>
        </Link>
        {authed ? (
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-2 py-1.5 sm:hidden">
              <Avatar name={displayName ?? "Du"} url={avatarUrl} size="sm" />
              <span className="truncate text-sm font-medium text-zinc-200">{displayName}</span>
            </div>
            {isImpersonating ? (
              <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <span>Temporär als {displayName} eingeloggt</span>
                <StopImpersonationButton />
              </div>
            ) : null}
            <nav className="flex max-w-[100vw] flex-nowrap items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:max-w-none sm:pb-0 [&::-webkit-scrollbar]:hidden">
                  <NavLink href="/">Start</NavLink>
                  <NavLink href="/discover">Crew</NavLink>
                  <NavLink href="/compare">Vergleich</NavLink>
                  <NavLink href="/u/me">Ich</NavLink>
                  <NavLink href="/inbox">
                    <span className="inline-flex items-center gap-1.5">
                      Inbox
                      {unreadCount > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold leading-4 text-zinc-950">
                          {Math.min(unreadCount, 99)}
                        </span>
                      ) : null}
                    </span>
                  </NavLink>
                  {isAdmin ? <NavLink href="/admin">Admin</NavLink> : null}
                  <NavLink href="/settings">Einstellungen</NavLink>
            </nav>
            <div className="flex items-center justify-end gap-2">
              <span className="hidden items-center gap-2 sm:flex">
                <Avatar name={displayName ?? "Du"} url={avatarUrl} size="sm" />
              </span>
              <LogoutButton />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
