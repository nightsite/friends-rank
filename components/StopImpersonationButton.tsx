"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function StopImpersonationButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      className="!px-3 !py-1.5 text-xs"
      onClick={async () => {
        setBusy(true);
        await fetch("/api/admin/impersonate/stop", {
          method: "POST",
          credentials: "same-origin",
        });
        window.location.href = "/admin";
      }}
      disabled={busy}
    >
      {busy ? "Zurück..." : "Impersonation beenden"}
    </Button>
  );
}

