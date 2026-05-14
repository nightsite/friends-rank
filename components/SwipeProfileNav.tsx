"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  prev: string | null;
  next: string | null;
  hint?: boolean;
};

export function SwipeProfileNav({ prev, next, hint = true }: Props) {
  const router = useRouter();
  const [showHint, setShowHint] = useState(hint);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let active = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      active = true;
    };

    const onEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < 70) return;
      if (dx < 0 && next) router.push(`/u/${next}`);
      else if (dx > 0 && prev) router.push(`/u/${prev}`);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [prev, next, router]);

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), 4200);
    return () => clearTimeout(t);
  }, [showHint]);

  if (!showHint) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center sm:hidden">
      <span className="swipe-hint rounded-full border border-zinc-700/70 bg-zinc-950/85 px-4 py-2 text-[11px] font-medium text-zinc-300 shadow-lg backdrop-blur">
        ← swipe to switch friends →
      </span>
    </div>
  );
}
