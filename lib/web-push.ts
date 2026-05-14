import { prisma } from "./prisma";
import { rankLabel } from "./ranks";

type WebPushLike = {
  setVapidDetails: (subject: string, pub: string, priv: string) => void;
  sendNotification: (
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload?: string,
  ) => Promise<unknown>;
};

let cached: { mod: WebPushLike | null; configured: boolean } | null = null;

async function loadWebPush(): Promise<{ mod: WebPushLike | null; configured: boolean }> {
  if (cached) return cached;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:friends-rank@example.com";

  let mod: WebPushLike | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imported: any = await import("web-push");
    mod = (imported.default ?? imported) as WebPushLike;
  } catch {
    cached = { mod: null, configured: false };
    return cached;
  }

  if (!pub || !priv || !mod) {
    cached = { mod, configured: false };
    return cached;
  }
  try {
    mod.setVapidDetails(subject, pub, priv);
    cached = { mod, configured: true };
  } catch {
    cached = { mod, configured: false };
  }
  return cached;
}

export async function notifyUser(args: {
  userId: string;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  const { mod, configured } = await loadWebPush();
  if (!configured || !mod) return;

  const subs = await prisma.webPushSubscription.findMany({
    where: { userId: args.userId },
  });
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: args.title,
    body: args.body,
    url: args.url ?? "/",
  });

  await Promise.all(
    subs.map(async (s) => {
      try {
        await mod.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          payload,
        );
      } catch (err: unknown) {
        const status =
          err && typeof err === "object" && "statusCode" in err
            ? Number((err as { statusCode?: number }).statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await prisma.webPushSubscription
            .delete({ where: { endpoint: s.endpoint } })
            .catch(() => {});
        }
      }
    }),
  );
}

export async function notifyRated(args: {
  rateeId: string;
  fromName: string;
  categoryName: string;
  rank: number;
}): Promise<void> {
  return notifyUser({
    userId: args.rateeId,
    title: `${args.fromName} rated you`,
    body: `${args.categoryName} · ${rankLabel(args.rank)}`,
    url: "/me",
  });
}
