import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { getSessionOptions, type SessionData } from "@/lib/session-config";
import { isAdminSession } from "@/lib/admin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let options;
  try {
    options = getSessionOptions();
  } catch {
    if (pathname === "/login") {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("setup", "1");
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(request, res, options);

  if (pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (session.userId) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session.userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const needsAdmin = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
  if (needsAdmin && !isAdminSession(session)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/.*|.*\\.(?:ico|png|jpg|jpeg|svg|webp|gif)$).*)",
  ],
};
