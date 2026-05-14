import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions, type SessionData } from "./session-config";
import { touchStreak } from "./streak";
import { touchLastSeen } from "./presence";

export type AuthedSession = {
  userId: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function requireSession(): Promise<AuthedSession | null> {
  try {
    const session = await getSession();
    if (!session.userId || !session.slug) {
      return null;
    }
    // Bump streak once per UTC day + lastSeenAt throttled to 1/min. Non-fatal.
    void touchStreak(session.userId).catch(() => {});
    void touchLastSeen(session.userId).catch(() => {});
    return {
      userId: session.userId,
      slug: session.slug,
      displayName: session.displayName ?? session.slug,
      avatarUrl: session.avatarUrl ?? null,
    };
  } catch {
    return null;
  }
}
