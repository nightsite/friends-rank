# Windows Desktop Release Guide

This project ships a Windows Electron app while keeping the Next.js web app live.

## 1) Prerequisites

- Node 20+
- Existing web deployment (Vercel) and valid `DESKTOP_WEB_URL`
- Project dependencies installed in root and `desktop`

## 2) Local smoke test

From repo root:

```bash
npm run desktop:install
npm run desktop:dev
```

This starts web dev server + desktop shell and opens `/desktop`.

## 3) Build installer artifacts

From repo root:

```bash
npm run desktop:dist
```

If your Windows machine blocks symlink extraction in `%LOCALAPPDATA%\\electron-builder\\Cache`, run once with elevated rights or enable **Developer Mode** in Windows.

Artifacts are generated in:

- `desktop/release/*.exe` (NSIS installer and portable exe)

## 4) Point desktop app to production web

Packaged app loads:

1. `DESKTOP_WEB_URL` (if provided at build/runtime)
2. Fallback hardcoded URL in `desktop/src/main.ts`

Example:

```bash
cross-env DESKTOP_WEB_URL=https://your-domain.com/desktop npm run desktop:dist
```

## 5) Suggested GitHub release flow

1. Push changes to GitHub.
2. Let Vercel deploy latest web build.
3. Build desktop artifacts with `DESKTOP_WEB_URL` pointing to live web.
4. Upload `.exe` artifacts to a GitHub Release.
5. Share installer link with users.

## 6) Verification checklist

- Login works from desktop app.
- Rating save/delete works.
- Admin impersonation works.
- Session persists after app restart.
- "Im Browser öffnen" opens the same route on production website.
