"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { MediaComposer, type MediaPayload } from "@/components/MediaComposer";
import { REPLY_BODY_MAX } from "@/lib/media-validation";
import { formatRelative } from "@/lib/format-time";

export type ReplyItem = {
  id: string;
  body: string;
  createdAt: string;
  imageData: string | null;
  audioData: string | null;
  audioMs: number | null;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
};

type Props = {
  ratingId: string;
  viewerId: string;
  replies: ReplyItem[];
};

export function ReplyThread({ ratingId, viewerId, replies }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaPayload>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [list, setList] = useState<ReplyItem[]>(replies);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed && !media.imageData && !media.audioData) {
      setError("Add some text, a photo, or a voice note.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/ratings/${ratingId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: trimmed,
          imageData: media.imageData ?? null,
          audioData: media.audioData ?? null,
          audioMs: media.audioMs ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok || !data.id) {
        setError(data.error || "Could not post reply");
        return;
      }
      setText("");
      setMedia({});
      setList((prev) => [
        ...prev,
        {
          id: data.id!,
          body: trimmed,
          createdAt: new Date().toISOString(),
          imageData: media.imageData ?? null,
          audioData: media.audioData ?? null,
          audioMs: media.audioMs ?? null,
          authorId: viewerId,
          authorName: "You",
          authorAvatarUrl: null,
        },
      ]);
      router.refresh();
    });
  }

  async function remove(id: string) {
    const prev = list;
    setList((p) => p.filter((r) => r.id !== id));
    const res = await fetch(`/api/replies/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setList(prev);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {list.length > 0 ? (
        <ul className="space-y-3">
          {list.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 sm:p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar name={r.authorName} url={r.authorAvatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-200">{r.authorName}</p>
                    <span className="text-[11px] text-zinc-500">
                      {formatRelative(new Date(r.createdAt))}
                    </span>
                  </div>
                  {r.body ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                      {r.body}
                    </p>
                  ) : null}
                  {r.imageData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.imageData}
                      alt="Reply attachment"
                      className="mt-2 max-h-72 rounded-lg border border-zinc-800/70 object-cover"
                    />
                  ) : null}
                  {r.audioData ? (
                    <audio controls src={r.audioData} className="mt-2 w-full max-w-sm" />
                  ) : null}
                  {r.authorId === viewerId ? (
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="mt-2 text-[11px] font-medium text-zinc-500 hover:text-red-300"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        onSubmit={send}
        className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 sm:p-4"
      >
        <textarea
          className="min-h-[72px] w-full resize-y rounded-lg border border-zinc-700/70 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
          maxLength={REPLY_BODY_MAX}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply with text, a meme, or a voice note…"
        />
        <div className="mt-2">
          <MediaComposer value={media} onChange={setMedia} disabled={pending} />
        </div>
        {error ? (
          <p className="mt-2 text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-end">
          <Button type="submit" disabled={pending} className="min-h-10 px-4 py-2 text-xs">
            {pending ? "Posting…" : "Post reply"}
          </Button>
        </div>
      </form>
    </div>
  );
}
