"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getDesktopBridge } from "@/lib/desktop-bridge";

type NavItem = {
  key: string;
  label: string;
  path: string;
  href: string;
};

type Props = {
  title: string;
  subtitle: string;
  currentView: string;
  navItems: NavItem[];
  isImpersonating: boolean;
};

export function DesktopWorkspace({
  title,
  subtitle,
  currentView,
  navItems,
  isImpersonating,
}: Props) {
  const [busy, setBusy] = useState<"copy" | "browser" | null>(null);
  const bridge = useMemo(() => getDesktopBridge(), []);
  const active = navItems.find((item) => item.key === currentView) ?? navItems[0];

  async function openInBrowser() {
    if (!active) return;
    setBusy("browser");
    try {
      const origin = window.location.origin;
      await bridge.openExternal(`${origin}${active.path}`);
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    if (!active) return;
    setBusy("copy");
    try {
      const origin = window.location.origin;
      await bridge.copyText(`${origin}${active.path}`);
      await bridge.notify("Link kopiert", active.path);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-700/60 bg-zinc-950/55 p-3 shadow-2xl shadow-black/30">
      <div className="grid min-h-[72vh] grid-cols-[240px_minmax(0,1fr)] gap-3">
        <aside className="rounded-2xl border border-zinc-700/50 bg-zinc-900/55 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Desktop</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{subtitle}</p>

          {isImpersonating ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-200">
              Admin-Impersonation aktiv.
            </p>
          ) : null}

          <nav className="mt-4 grid gap-1.5">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  item.key === currentView
                    ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/30"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 grid gap-2">
            <Button variant="outline" onClick={openInBrowser} disabled={busy !== null}>
              {busy === "browser" ? "Öffnet..." : "Im Browser öffnen"}
            </Button>
            <Button variant="ghost" onClick={copyLink} disabled={busy !== null}>
              {busy === "copy" ? "Kopiert..." : "Link kopieren"}
            </Button>
          </div>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-950/65">
          <iframe
            key={active.path}
            src={active.path}
            title={active.label}
            className="h-full min-h-[72vh] w-full border-0"
            loading="eager"
          />
        </section>
      </div>
    </div>
  );
}
