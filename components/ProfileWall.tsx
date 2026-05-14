"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { formatRelative } from "@/lib/format-time";

type WallReaction = {
  id: string;
  emoji: string;
  userId: string;
};

type WallPost = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  reactions: WallReaction[];
};

type Props = {
  targetSlug: string;
  viewerId: string;
  posts: WallPost[];
};

const EMOJIS = ["🔥", "😂", "💀", "👀", "❤️"] as const;

export function ProfileWall({ targetSlug, viewerId, posts }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();
  const [list, setList] = useState(posts);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const text = body.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await fetch("/api/profile-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSlug, body: text }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok || !data.id) {
        setErr(data.error || "Could not post message.");
        return;
      }
      setList((prev) => [
        {
          id: data.id!,
          body: text,
          createdAt: new Date().toISOString(),
          authorId: viewerId,
          authorName: "You",
          authorAvatarUrl: null,
          reactions: [],
        },
        ...prev,
      ]);
      setBody("");
      router.refresh();
    });
  }

  async function remove(id: string) {
    const prev = list;
    setList((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/profile-posts/${id}`, { method: "DELETE" });
    if (!res.ok) setList(prev);
    router.refresh();
  }

  async function react(postId: string, emoji: string) {
    await fetch(`/api/profile-posts/${postId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-xl border border-zinc-700/70 bg-zinc-950/50 p-3">
        <textarea
          className="min-h-[78px] w-full resize-y rounded-lg border border-zinc-700/70 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
          maxLength={500}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Leave a message on this profile..."
        />
        {err ? <p className="mt-2 text-sm text-red-400">{err}</p> : null}
        <div className="mt-2 flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>

      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">No wall posts yet.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((post) => (
            <li key={post.id} className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-3">
              <div className="flex items-start gap-3">
                <Avatar name={post.authorName} url={post.authorAvatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-200">{post.authorName}</p>
                    <p className="text-xs text-zinc-500">{formatRelative(new Date(post.createdAt))}</p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{post.body}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {EMOJIS.map((emoji) => {
                      const count = post.reactions.filter((r) => r.emoji === emoji).length;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => react(post.id, emoji)}
                          className="rounded-full border border-zinc-700/70 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                        >
                          {emoji} {count}
                        </button>
                      );
                    })}
                  </div>
                  {post.authorId === viewerId ? (
                    <button
                      type="button"
                      onClick={() => remove(post.id)}
                      className="mt-2 text-xs text-zinc-500 hover:text-red-300"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
