"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  token: string;
};

export function InviteRedeemButton({ token }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function redeem() {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/invites/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; eventAwarded?: boolean };
      if (!res.ok) {
        setErr(data.error || "Could not redeem invite.");
        return;
      }
      setMsg(data.eventAwarded ? "Invite redeemed + seasonal badge awarded." : "Invite redeemed.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={redeem} disabled={loading}>
        {loading ? "Redeeming..." : "Redeem invite"}
      </Button>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-300">{msg}</p> : null}
    </div>
  );
}
