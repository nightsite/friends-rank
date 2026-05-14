"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  eventId: string;
  alreadyClaimed: boolean;
};

export function SeasonalClaimButton({ eventId, alreadyClaimed }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (alreadyClaimed) {
    return (
      <span className="rounded-full border border-emerald-500/40 px-2 py-1 text-xs text-emerald-300">
        Claimed
      </span>
    );
  }

  function claim() {
    startTransition(async () => {
      await fetch("/api/seasonal/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" onClick={claim} disabled={pending}>
      {pending ? "..." : "Claim badge"}
    </Button>
  );
}
