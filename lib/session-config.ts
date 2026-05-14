import type { SessionOptions } from "iron-session";

export type SessionData = {
  userId?: string;
  slug?: string;
  displayName?: string;
  avatarUrl?: string;
};

function getSessionPassword(): string {
  const p = process.env.SESSION_PASSWORD;
  if (!p || p.length < 32) {
    throw new Error(
      "SESSION_PASSWORD must be set and at least 32 characters (see .env.example).",
    );
  }
  return p;
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: "friends_rank_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 14,
      path: "/",
    },
  };
}
