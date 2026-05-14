"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  slug: string;
  initialFollowing: boolean;
};

export function FollowButton({ slug, initialFollowing }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    const method = following ? "DELETE" : "POST";
    const prev = following;
    setFollowing(!prev);
    try {
      const res = await fetch("/api/follows", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        setFollowing(prev);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={following ? "ghost" : "primary"} onClick={toggle} disabled={loading}>
      {loading ? "..." : following ? "Following" : "Follow"}
    </Button>
  );
}
