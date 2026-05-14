"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMMENT_MAX } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { ReviewTimestamp } from "@/components/ReviewTimestamp";
import { Avatar } from "@/components/Avatar";
import { MediaComposer, type MediaPayload } from "@/components/MediaComposer";
import { fireConfetti, fireSparkles } from "@/lib/confetti";
import { RANK_MAX, RANK_MIN, RANK_OPTIONS } from "@/lib/ranks";
import { RankBadge } from "@/components/RankBadge";
import { ReasonTagPicker } from "@/components/ReasonTagPicker";
import { parseReasons } from "@/lib/reason-tags";

type Props = {
  initialRatingId?: string | null;
  rateeSlug: string;
  displayName: string;
  avatarUrl?: string | null;
  categorySlug: string;
  initialStars: number | null;
  initialComment: string;
  savedCreatedAt: string | null;
  savedUpdatedAt: string | null;
  initialImage?: string | null;
  initialAudio?: string | null;
  initialReasons?: string | null;
};

export function RateCard({
  initialRatingId = null,
  rateeSlug,
  displayName,
  avatarUrl,
  categorySlug,
  initialStars,
  initialComment,
  savedCreatedAt,
  savedUpdatedAt,
  initialImage = null,
  initialAudio = null,
  initialReasons = null,
}: Props) {
  const router = useRouter();
  const [rank, setRank] = useState<number>(initialStars ?? 0);
  const [comment, setComment] = useState(initialComment);
  const [reasons, setReasons] = useState<string[]>(
    parseReasons(initialReasons).map((t) => t.slug),
  );
  const [media, setMedia] = useState<MediaPayload>({
    imageData: initialImage,
    audioData: initialAudio,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasSaved = Boolean(savedCreatedAt && savedUpdatedAt);

  async function save() {
    setError(null);
    if (rank < RANK_MIN || rank > RANK_MAX) {
      setError("Wähle einen gültigen Rank.");
      return;
    }
    setStatus("saving");
    const res = await fetch("/api/ratings", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rateeSlug,
        categorySlug,
        rank,
        comment,
        reasons,
        imageData: media.imageData ?? null,
        audioData: media.audioData ?? null,
        audioMs: media.audioMs ?? null,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setStatus("error");
      setError(data.error || "Speichern fehlgeschlagen.");
      return;
    }
    setStatus("saved");
    if (rank === RANK_MAX) {
      fireConfetti();
      fireSparkles({ count: 60, tint: "#fbbf24" });
    }
    await router.refresh();
    setTimeout(() => setStatus("idle"), 1600);
  }

  async function remove() {
    if (!initialRatingId) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/ratings/${initialRatingId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Löschen fehlgeschlagen.");
        return;
      }
      await router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="glass-panel card-hover rounded-2xl border border-zinc-700/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <Avatar name={displayName} url={avatarUrl} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-semibold text-white">{displayName}</h3>
            <div className="w-full sm:w-auto">
              <label className="sr-only" htmlFor={`rank-${rateeSlug}-${categorySlug}`}>
                Rank auswählen
              </label>
              <select
                id={`rank-${rateeSlug}-${categorySlug}`}
                value={rank || ""}
                onChange={(e) => setRank(Number(e.target.value))}
                className="h-11 min-w-[170px] rounded-xl border border-zinc-700/80 bg-zinc-950/60 px-3 text-sm font-medium text-zinc-100"
              >
                <option value="">Rank wählen...</option>
                {RANK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {rank ? (
                <div className="mt-2 flex justify-end">
                  <RankBadge value={rank} size="sm" />
                </div>
              ) : null}
            </div>
          </div>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Kommentar (optional)
            <textarea
              className="mt-2 min-h-[88px] w-full resize-y rounded-xl border border-zinc-600/80 bg-zinc-950/70 px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-inner shadow-black/20 transition focus:border-amber-500/45 focus:ring-2 focus:ring-amber-500/20"
              maxLength={COMMENT_MAX}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was sollte die Person wissen?"
            />
          </label>

          <div className="mt-4">
            <ReasonTagPicker
              categorySlug={categorySlug}
              value={reasons}
              onChange={setReasons}
            />
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Anhang (optional)
            </p>
            <div className="mt-2">
              <MediaComposer value={media} onChange={setMedia} disabled={status === "saving"} />
            </div>
          </div>

          {hasSaved ? (
            <ReviewTimestamp
              createdAt={savedCreatedAt!}
              updatedAt={savedUpdatedAt!}
              className="mt-4 border-t border-zinc-800/80 pt-4"
            />
          ) : (
            <p className="mt-4 border-t border-zinc-800/80 pt-4 text-xs text-zinc-500">
              Noch nicht gespeichert - nach dem ersten Speichern erscheinen Zeitstempel.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={status === "saving"}>
              {status === "saving" ? "Speichert..." : "Rating speichern"}
            </Button>
            {initialRatingId ? (
              <Button variant="ghost" onClick={remove} disabled={deleting || status === "saving"}>
                {deleting ? "Löscht..." : "Rating löschen"}
              </Button>
            ) : null}
            {status === "saved" ? (
              <span className="text-sm font-medium text-emerald-400/95">
                Gespeichert{rank === RANK_MAX ? " - Challenger confetti 🎉" : ""}
              </span>
            ) : null}
            {error ? (
              <span className="text-sm text-red-400" role="alert">
                {error}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
