"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { USER_SLUGS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

const labels: Record<string, string> = {
  omer: "Ömer",
  tugrahan: "Tugrahan",
  efe: "Efe",
  talha: "Talha",
  cano: "Cano",
};

export function LoginForm() {
  const router = useRouter();
  const [slug, setSlug] = useState<string>(USER_SLUGS[0]);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pin }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        retryAfter?: number;
      };
      if (!res.ok) {
        if (res.status === 429) {
          setError(
            `Too many attempts. Try again in ${data.retryAfter ?? 60} seconds.`,
          );
        } else {
          setError(data.error || "Could not sign in");
        }
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-zinc-300">
        Name
        <select
          className="mt-2 w-full cursor-pointer rounded-xl border border-zinc-600/80 bg-zinc-950/80 px-4 py-3 text-base text-white shadow-inner shadow-black/20 transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/25"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        >
          {USER_SLUGS.map((s) => (
            <option key={s} value={s}>
              {labels[s] ?? s}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-zinc-300">
        PIN
        <input
          type="password"
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-zinc-600/80 bg-zinc-950/80 px-4 py-3 text-base text-white shadow-inner shadow-black/20 transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/25"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          minLength={4}
          required
        />
      </label>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading} className="w-full !py-3.5 text-base">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
