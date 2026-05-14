import { prisma } from "./prisma";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const TOUCH_THROTTLE_MS = 60 * 1000;

const lastWriteByUser = new Map<string, number>();

/** Updates `User.lastSeenAt` at most once per minute per user, fire-and-forget safe. */
export async function touchLastSeen(userId: string, now: Date = new Date()): Promise<void> {
  const cached = lastWriteByUser.get(userId) ?? 0;
  const nowMs = now.getTime();
  if (nowMs - cached < TOUCH_THROTTLE_MS) return;
  lastWriteByUser.set(userId, nowMs);
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: now },
    });
  } catch {
    lastWriteByUser.delete(userId);
  }
}

export function isOnline(lastSeenAt: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!lastSeenAt) return false;
  const t = typeof lastSeenAt === "string" ? new Date(lastSeenAt).getTime() : lastSeenAt.getTime();
  if (!Number.isFinite(t)) return false;
  return now.getTime() - t <= ONLINE_WINDOW_MS;
}

export { ONLINE_WINDOW_MS };
