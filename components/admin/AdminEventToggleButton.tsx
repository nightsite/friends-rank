"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  eventId: string;
  active: boolean;
};

export function AdminEventToggleButton({ eventId, active }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, isActive: !active }),
      });
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" onClick={toggle} disabled={pending}>
      {pending ? "..." : active ? "Disable" : "Enable"}
    </Button>
  );
}
