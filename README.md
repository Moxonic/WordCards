# WordCards

[![Netlify Status](https://api.netlify.com/api/v1/badges/c6eb9abe-658d-4b0f-87ae-e4f94185274c/deploy-status)](https://app.netlify.com/projects/mywordcards/deploys)

A vocabulary trainer: flip cards, swipe to grade yourself, and let spaced
repetition decide when each word comes back.

- **Google sign-in + cloud sync** (Firebase Auth + Firestore) — cards and review
  progress follow your account across devices.
- **Swipe review** — tap a card to flip, swipe **right** if you knew it, **left**
  to keep practising. A round isn't done until every card has been answered
  right enough times; weak/lapsed cards need more, and no card repeats
  back-to-back (`src/lib/session.js`). Between rounds, day-scale spacing uses
  **Leitner boxes** (`src/lib/leitner.js`, 1 / 2 / 4 / 7 / 14 days).
- **Collections** — group cards, review one at a time, and **share a collection**
  with a friend via a code they import as their own copy.
- **Starter packs** — 100-card decks: common Norwegian, sophisticated Norwegian,
  technical theatre jargon (`src/data/starterDecks.js`).
- **Manual entry** — the `+` button adds a card by hand.
- **Companion Chrome extension** (`extension/`) — pushes words you translate on
  `translate.google.com` into your account (best-effort; Google's markup is
  unstable).

## First-time setup

You must create a Firebase project and (for the extension) one OAuth client.
**See [`SETUP.md`](./SETUP.md).** Then:

```bash
cp .env.example .env      # fill in your Firebase web config
npm install
npm start
npm test                  # runs the Leitner + session unit tests
```

## Deploy (Netlify)

Netlify builds on every push — build settings live in [`netlify.toml`](./netlify.toml)
(`npm run build` → `build/`, with an SPA redirect). You don't build locally.

Two one-time steps in the dashboards:

1. **Netlify → Site settings → Environment variables** — add all six
   `REACT_APP_FIREBASE_*` values (`.env` is gitignored, so the build has none).
2. **Firebase → Authentication → Settings → Authorized domains** — add the
   `*.netlify.app` domain (and any custom domain) or Google sign-in fails with
   `auth/unauthorized-domain`.

---

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

#### `npm test`

Launches the test runner in the interactive watch mode.

#### `npm run build`

Builds the app for production to the `build` folder.

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**
