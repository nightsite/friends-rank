"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  href: string;
  label: string;
  icon: string;
};

const ITEMS: Item[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/discover", label: "Crew", icon: "👥" },
  { href: "/u/me", label: "Me", icon: "👤" },
  { href: "/inbox", label: "Inbox", icon: "📬" },
];

type Props = {
  unreadCount?: number;
};

export function MobileBottomNav({ unreadCount = 0 }: Props) {
  const pathname = usePathname() || "/";

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-lg sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {ITEMS.map((it) => {
          const active =
            pathname === it.href ||
            (it.href !== "/" && pathname.startsWith(it.href));
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition ${
                  active ? "text-amber-300" : "text-zinc-400"
                }`}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {it.icon}
                </span>
                <span>{it.label}</span>
                {it.href === "/inbox" && unreadCount > 0 ? (
                  <span className="absolute right-[28%] top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold leading-4 text-zinc-950">
                    {Math.min(unreadCount, 99)}
                  </span>
                ) : null}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-amber-400"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
