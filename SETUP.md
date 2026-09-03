# Setup

## 1. Firebase (reuse the existing project)

Same project as before (`wordcards-2b9f0`). You need two things from it:

- **Web config** – Project settings → General → Your apps → SDK setup → Config.
  Put the six values in `.env` as `VITE_FIREBASE_*` (see `.env.example`).
- **Service account key** – Project settings → **Service accounts** → *Generate
  new private key*. This downloads a JSON file. Put its **entire contents on one
  line** as `FIREBASE_SERVICE_ACCOUNT` in `.env` (local) and as a Netlify env var
  (deploy). This is a real secret — never commit it, never prefix it `VITE_`.

Make sure **Authentication → Sign-in method → Google** is enabled, and
**Firestore** exists.

## 2. Firestore rules

`firestore.rules` locks every user to their own `users/{uid}/**`. Publish it:
Firestore → **Rules** → paste → **Publish**. (The grading function writes with the
Admin SDK and bypasses rules; the browser only touches its own data.)

## 3. Anthropic key

Get an API key at <https://console.anthropic.com>. Put it in `.env` as
`ANTHROPIC_API_KEY` and as a Netlify env var. The grading model is
`claude-sonnet-5` (constant `GRADE_MODEL` in
`netlify/functions/grade-background.mts`); there's a per-user cap of 12 gradings
per day (`DAILY_CAP`).

## 4. Local development

```bash
npm install
npm i -g netlify-cli      # once
cp .env.example .env       # fill everything in
npm run netlify-dev        # http://localhost:8888 — serves the app AND the function
```

`npm run dev` alone runs only the Vite UI; "Få tilbakemelding" needs the function,
so use `netlify dev` when testing grading.

## 5. Netlify deploy

- **Build** is configured in `netlify.toml` (`npm run build` → `dist/`, functions
  in `netlify/functions`). Netlify builds on push.
- **Environment variables** (Site settings → Environment variables): the six
  `VITE_FIREBASE_*`, plus `ANTHROPIC_API_KEY` and `FIREBASE_SERVICE_ACCOUNT`.
- **Authorized domain**: Firebase → Authentication → Settings → Authorized
  domains → add the `*.netlify.app` domain (and any custom domain), or Google
  sign-in fails with `auth/unauthorized-domain`.
- This branch is `rewrite`. Point Netlify's production branch at it (Site
  configuration → Build & deploy → Branches) when you're ready to cut over, or
  merge to `main`.
