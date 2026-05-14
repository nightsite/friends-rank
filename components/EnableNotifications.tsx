"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  vapidPublicKey: string | null;
  className?: string;
};

function urlBase64ToArrayBuffer(b64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
}

export function EnableNotifications({ vapidPublicKey, className = "" }: Props) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "default">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(Boolean(sub));
      })
      .catch(() => {});
  }, []);

  async function enable() {
    setErr(null);
    setMsg(null);
    if (!vapidPublicKey) {
      setErr(
        "Push-Notifications sind auf dem Server nicht konfiguriert (fehlende VAPID-Keys). Siehe README.",
      );
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setErr("Berechtigung wurde nicht erteilt.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        setErr("Subscription konnte auf dem Server nicht gespeichert werden.");
        return;
      }
      setSubscribed(true);
      setMsg("Notifications aktiviert. Wir geben dir Bescheid, wenn dich jemand bewertet.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Notifications konnten nicht aktiviert werden.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Notifications ausgeschaltet.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Notifications konnten nicht deaktiviert werden.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className={`text-sm text-zinc-500 ${className}`.trim()}>
        Dein Browser unterstützt keine Push-Notifications.
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <p className="text-xs text-zinc-500">
        Status: <span className="text-zinc-300">{permission}</span> ·{" "}
        {subscribed ? "abonniert" : "nicht abonniert"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {!subscribed ? (
          <Button onClick={enable} disabled={busy}>
            {busy ? "Aktiviere…" : "Notifications aktivieren"}
          </Button>
        ) : (
          <Button variant="ghost" onClick={disable} disabled={busy}>
            {busy ? "Deaktiviere…" : "Notifications ausschalten"}
          </Button>
        )}
      </div>
      {err ? (
        <p className="text-sm text-red-400" role="alert">
          {err}
        </p>
      ) : null}
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
    </div>
  );
}
