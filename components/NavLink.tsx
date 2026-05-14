"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function NavLink({ href, children, className = "" }: Props) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium touch-manipulation transition ${
        active
          ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/35"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
      } ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
