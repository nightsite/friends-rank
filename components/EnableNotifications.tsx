"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  vapidPublicKey: string | null;
  className?: string;
};

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
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
        "Push notifications are not configured on the server (missing VAPID keys). See README.",
      );
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setErr("Permission was not granted.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        setErr("Could not save subscription on server.");
        return;
      }
      setSubscribed(true);
      setMsg("Notifications enabled. We'll ping you when someone rates you.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not enable notifications.");
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
      setMsg("Notifications turned off.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className={`text-sm text-zinc-500 ${className}`.trim()}>
        Your browser doesn&apos;t support push notifications.
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      <p className="text-xs text-zinc-500">
        Status: <span className="text-zinc-300">{permission}</span> ·{" "}
        {subscribed ? "subscribed" : "not subscribed"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {!subscribed ? (
          <Button onClick={enable} disabled={busy}>
            {busy ? "Enabling…" : "Enable notifications"}
          </Button>
        ) : (
          <Button variant="ghost" onClick={disable} disabled={busy}>
            {busy ? "Turning off…" : "Turn off notifications"}
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
