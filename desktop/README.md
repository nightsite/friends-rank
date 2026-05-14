# Friends Rank Desktop (Electron)

## Development

From the project root:

```bash
npm run desktop:install
npm run desktop:dev
```

This starts Next.js (`http://localhost:3000`) and opens Electron at `/desktop`.

## Build desktop app

```bash
npm run desktop:dist
```

Windows artifacts are written to `desktop/release`.

## Production URL

Packaged builds load `DESKTOP_WEB_URL` or fallback to:

- `https://friends-rank.vercel.app/desktop`

You can override during local tests:

```bash
cross-env DESKTOP_WEB_URL=https://your-domain.com/desktop npm run desktop:pack
```
