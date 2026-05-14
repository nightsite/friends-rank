"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fileToProcessedImage } from "@/lib/image-process";

export type MediaPayload = {
  imageData?: string | null;
  audioData?: string | null;
  audioMs?: number | null;
};

type Props = {
  value: MediaPayload;
  onChange: (next: MediaPayload) => void;
  /** Disable the recorder UI (e.g. during save). */
  disabled?: boolean;
  className?: string;
};

const MAX_AUDIO_MS = 60_000;

export function MediaComposer({ value, onChange, disabled, className = "" }: Props) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {}
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    setPickError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const out = await fileToProcessedImage(f, {
        maxSize: 1080,
        outputMime: "image/webp",
        quality: 0.82,
        square: false,
      });
      onChange({ ...value, imageData: out.dataUrl });
    } catch (err) {
      setPickError(err instanceof Error ? err.message : "Could not read that image.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clearImage() {
    onChange({ ...value, imageData: null });
  }

  async function startRecording() {
    setPickError(null);
    if (recording) return;
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPickError("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mime });
        const ms = Math.min(MAX_AUDIO_MS, Date.now() - startedAtRef.current);
        const fr = new FileReader();
        fr.onload = () => {
          onChange({
            ...value,
            audioData: String(fr.result),
            audioMs: ms,
          });
        };
        fr.readAsDataURL(blob);
        setRecording(false);
      };
      rec.start();
      startedAtRef.current = Date.now();
      setRecording(true);
      setElapsedMs(0);
      tickRef.current = setInterval(() => {
        const e = Date.now() - startedAtRef.current;
        setElapsedMs(e);
        if (e >= MAX_AUDIO_MS) {
          stopRecording();
        }
      }, 100);
    } catch (err) {
      setPickError(err instanceof Error ? err.message : "Microphone access was denied.");
    }
  }

  function stopRecording() {
    try {
      recRef.current?.stop();
    } catch {}
  }

  function clearAudio() {
    onChange({ ...value, audioData: null, audioMs: null });
  }

  const seconds = (elapsedMs / 1000).toFixed(1);

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-950/50 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 ${
            disabled ? "pointer-events-none opacity-50" : ""
          }`}
          htmlFor={fileInputId}
        >
          📷 Photo / GIF
          <input
            id={fileInputId}
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={onPickImage}
            disabled={disabled}
          />
        </label>
        {value.imageData ? (
          <button
            type="button"
            onClick={clearImage}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-950/50 px-2 py-2 text-xs text-zinc-400 hover:border-zinc-500"
          >
            Remove photo
          </button>
        ) : null}

        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-950/50 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
          >
            🎙 Voice note
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-red-500/50 bg-red-500/15 px-3 py-2 text-xs font-medium text-red-200"
          >
            ◼ Stop ({seconds}s)
          </button>
        )}
        {value.audioData ? (
          <button
            type="button"
            onClick={clearAudio}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-950/50 px-2 py-2 text-xs text-zinc-400 hover:border-zinc-500"
          >
            Remove voice
          </button>
        ) : null}
      </div>

      {value.imageData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.imageData}
          alt="Attachment preview"
          className="max-h-48 rounded-xl border border-zinc-700/70 object-cover"
        />
      ) : null}

      {value.audioData ? (
        <audio controls src={value.audioData} className="w-full max-w-sm" />
      ) : null}

      {pickError ? (
        <p className="text-xs text-red-400" role="alert">
          {pickError}
        </p>
      ) : null}
      <p className="text-[11px] text-zinc-500">
        Photos auto-shrink. GIFs play. Voice notes max 60s. Everything stays inside this app.
      </p>
    </div>
  );
}
