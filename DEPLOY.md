# 🚀 Wie du deine Website live ins Internet bringst

Ziel: Deine Seite läuft 24/7 auf einer richtigen URL (z. B. `friendsrank.vercel.app`), ohne dass du jedes Mal `npm run dev` starten musst. Jeder, dem du den Link gibst, kann sie öffnen.

**Du brauchst 3 kostenlose Accounts:**

1. **GitHub** — speichert deinen Code
2. **Vercel** — hostet die Website (kostenlos für kleine Projekte)
3. **Supabase** — kostenlose Postgres-Datenbank

Komplette Zeit: **~30 Minuten**. Du kopierst nur Sachen rein.

---

## SCHRITT 1 — Code zu GitHub schieben

### 1.1 GitHub Account & Repo erstellen

1. Geh auf [github.com](https://github.com) und logge dich ein (oder erstell ein Konto).
2. Klicke oben rechts auf **+** → **New repository**.
3. Name: `friends-rank` (oder wie du willst).
4. **Wähle "Private"** (damit deine Datenbank-Passwörter etc. sicher sind).
5. Klick **Create repository**. Lass die Seite offen — du brauchst die URL gleich.

### 1.2 Git auf deinem PC installieren (falls noch nicht)

* Lade [git-scm.com/download/win](https://git-scm.com/download/win) und installier es. Alles auf "Next" klicken.

### 1.3 Code hochladen

Öffne in deinem Projektordner (`C:\Users\depo9\Desktop\cursor_test`) ein Terminal in VS Code / Cursor und tippe nacheinander:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/friends-rank.git
git push -u origin main
```

Ersetze `DEIN-USERNAME` mit deinem GitHub-Namen.

Wenn er nach Login fragt → mit GitHub anmelden. Fertig.

> **Wichtig:** Die `.env` Datei wird **nicht** hochgeladen (steht in `.gitignore`). Das ist gut so — deine Passwörter bleiben geheim.

---

## SCHRITT 2 — Datenbank bei Supabase erstellen

1. Geh auf [supabase.com](https://supabase.com) → **Start your project** → mit GitHub einloggen.
2. **New project** → gib ihm einen Namen (z. B. `friends-rank`), wähl ein Passwort (notier es!) und eine Region nahe Deutschland (z. B. `eu-central-1`).
3. Warte ~2 Minuten bis die DB bereit ist.
4. Links auf **Project Settings (Zahnrad)** → **Database** → runter scrollen zu **Connection string** → **URI** Tab.
5. Kopier den **Connection Pooling**-Link, der so aussieht:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
6. Ersetze `[YOUR-PASSWORD]` mit dem Passwort von oben. **Diesen Text speicher dir kurz lokal**.

---

## SCHRITT 3 — Auf Vercel deployen

### 3.1 Account anlegen

1. [vercel.com](https://vercel.com) → **Sign up with GitHub**.
2. Erlaubnisse erteilen.

### 3.2 Projekt importieren

1. Vercel Dashboard → **Add New** → **Project**.
2. Such dein `friends-rank` Repo aus der Liste → **Import**.
3. Framework Preset wird automatisch erkannt: **Next.js** ✅.

### 3.3 Environment-Variablen setzen (das ist wichtig!)

Auf der Import-Seite gibt es eine Box **Environment Variables**. Trag dort ein (jeweils Name + Value, dann **Add**):

| Name | Value |
|------|-------|
| `DATABASE_URL` | dein Supabase-Connection-Link von oben |
| `SESSION_PASSWORD` | irgendein langer Zufallstext (mind. 32 Zeichen). Tipp: lass dir einen generieren, z. B. mit [1password.com/password-generator](https://1password.com/password-generator/) — Länge 64. |
| `SEED_PIN_DEFAULT` | dein gewünschter Standard-PIN für alle, z. B. `crew2026!` (min. 6 Zeichen) |
| `ADMIN_SLUGS` | `omer` (oder welche slug du als Admin willst, kommagetrennt) |

Optional (Push Notifications):
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Siehe README, kannst du später nachreichen |

### 3.4 Klick **Deploy**

Vercel installiert alles, baut die App, deployed. Dauert ~2 Minuten. Du bekommst eine URL wie `friends-rank-xyz.vercel.app`.

> Beim ersten Build steht die DB noch leer da. Wir setzen sie gleich auf.

---

## SCHRITT 4 — Datenbank initialisieren (Tabellen + Freunde anlegen)

Das machen wir **einmalig** lokal von deinem PC aus, aber gegen die echte DB.

Im VS Code Terminal in `cursor_test`:

```bash
# DATABASE_URL aus Schritt 2 hier verwenden, in EINER Zeile:
$env:DATABASE_URL="postgresql://postgres.xxx:DEIN-PW@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
$env:SEED_PIN_DEFAULT="crew2026!"

npx prisma migrate deploy
npm run db:seed
```

Wenn das durchläuft ✅, hat deine Datenbank jetzt:
- Tabellen (User, Rating, Notification, etc.)
- Alle 5 Freunde + 4 Kategorien
- PINs gesetzt (alle auf dein `SEED_PIN_DEFAULT`)

---

## SCHRITT 5 — Testen

1. Geh auf deine Vercel-URL.
2. Login: Name auswählen + dein PIN.
3. Profile angucken, Ranks vergeben, alles probieren.
4. Schick den Link an die Crew. Done. 🎉

---

## Wie aktualisier ich die Seite später?

Genau das ist das Coole: **automatisch.**

Sobald du im Code was änderst:

```bash
git add .
git commit -m "neue feature"
git push
```

Vercel merkt das in ~5 Sekunden und baut die Seite neu. **Du musst nichts mehr machen.**

---

## Falls was schiefgeht

### "Database connection error" auf der live-Seite
→ Du hast wahrscheinlich Schritt 4 noch nicht gemacht, oder die `DATABASE_URL` in Vercel ist falsch. Check Vercel → Settings → Environment Variables.

### "Cannot find module..."
→ Vercel sollte das selber lösen (`npm install` läuft beim Build). Wenn nicht, push nochmal.

### Login klappt nicht
→ Schritt 4 nochmal: `npm run db:seed` muss durchgelaufen sein, dann nimmt es deinen `SEED_PIN_DEFAULT`.

### Ich will PINs ändern
→ Auf Vercel `SEED_PIN_DEFAULT` ändern (oder einzeln `SEED_PIN_OMER` etc.) → lokal `$env:DATABASE_URL=...; npm run db:seed` nochmal laufen lassen.

---

## TL;DR Kurzfassung

1. GitHub → Code hochladen (`git push`)
2. Supabase → DB anlegen → Connection String kopieren
3. Vercel → Repo importieren → Env-Variablen rein → Deploy
4. Lokal einmalig `prisma migrate deploy` + `db:seed` gegen die echte DB
5. Link teilen
6. Änderungen? Einfach `git push` — Rest macht Vercel.
