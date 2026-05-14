"use client";

import { useEffect } from "react";
import { fireConfetti, fireSparkles } from "@/lib/confetti";

type Props = {
  weekKey: string;
  viewerIsChampion: boolean;
};

const COOKIE_NAME = "lastSeenChampionWeek";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const tail = parts.pop();
    if (tail) return decodeURIComponent(tail.split(";")[0] ?? "") || null;
  }
  return null;
}

export function WeeklyChampionConfetti({ weekKey, viewerIsChampion }: Props) {
  useEffect(() => {
    const last = readCookie(COOKIE_NAME);
    if (last === weekKey) return;
    const t = setTimeout(() => {
      fireSparkles({ count: 70, tint: "#fbbf24" });
      if (viewerIsChampion) fireConfetti({ count: 160 });
      try {
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(weekKey)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      } catch {
        /* ignore */
      }
    }, 350);
    return () => clearTimeout(t);
  }, [weekKey, viewerIsChampion]);
  return null;
}
