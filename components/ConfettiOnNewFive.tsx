"use client";

import { useEffect } from "react";
import { fireConfetti } from "@/lib/confetti";

type Props = { ratingId: string; cookieName?: string };

export function ConfettiOnNewFive({ ratingId, cookieName = "lastSeenFiveId" }: Props) {
  useEffect(() => {
    const t = setTimeout(() => {
      fireConfetti();
      try {
        document.cookie = `${cookieName}=${encodeURIComponent(ratingId)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [cookieName, ratingId]);
  return null;
}
