"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  notificationId?: string;
  mode: "single" | "all";
};

export function NotificationActions({ notificationId, mode }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "all" ? { all: true } : { id: notificationId }),
      });
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" onClick={run} disabled={pending}>
      {pending ? "..." : mode === "all" ? "Mark all read" : "Mark read"}
    </Button>
  );
}
