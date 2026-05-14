"use client";

import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      className="!px-3 !py-1.5 text-xs"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      Ausloggen
    </Button>
  );
}
