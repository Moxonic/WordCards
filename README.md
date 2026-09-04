# Emendo

[![Netlify Status](https://api.netlify.com/api/v1/badges/c6eb9abe-658d-4b0f-87ae-e4f94185274c/deploy-status)](https://app.netlify.com/projects/mywordcards/deploys)

An AI writing tutor for language learners. Write an email or a discussion essay,
get a teacher-style assessment from Claude, then drill your own mistakes with
flashcards until you know them.

## How it works

1. **Sign in with Google** (Firebase Auth). On first sign-in you pick a menu
   language — Norwegian Bokmål, English, Spanish or German — switchable later
   from the account menu.
2. **Write** — from Home, start a new text: pick the writing language, your
   mother tongue and a title, then choose one of the built-in B2-style tasks
   (an e-post or a drøftingstekst) or write your own. The editor autosaves as
   you type.
3. **Get feedback** — Claude grades the text and returns a CEFR-level estimate,
   a one-line note per category (content / grammar / vocabulary / spelling),
   short "what went well / what to check" feedback, and a fully corrected
   version. Every grammar and spelling fix is saved as a flashcard with a
   translation into your mother tongue.
4. **Review** — per text, repeatable any time. Flashcards show the meaning in
   your mother tongue; flip to see the corrected sentence, with your original
   struck through and a short note. Type the answer or just flip; swipe left
   to repeat it, right once you know it. A Leitner-style mastery loop
   (`src/lib/leitner.ts`, `src/lib/session.ts`) spaces cards out and tracks
   progress across sessions.
5. **Try again** — re-attempt any task from a blank page; older attempts stay
   in *My texts*, where you can also delete a text (and its flashcards).

Writing language, mother tongue and menu language are each one of **Norwegian
Bokmål, English, Spanish, German** — mix and match freely (e.g. menu in
Spanish, writing in German, mother tongue Norwegian).

## Design

Minimal, warm, low-contrast — a washi-paper palette shading into sumi ink,
Noto Sans, sharp corners, hairline borders instead of shadows. See
`tailwind.config.js` for the palette and `src/components/Wordmark.tsx` for the
logo treatment.

## Stack

Vite + React + TypeScript · Tailwind · Firebase (Auth + Firestore) · one Netlify
**background function** (`netlify/functions/grade-background.mts`) that verifies
the caller's Firebase ID token, calls the Anthropic API (`claude-sonnet-5`,
capped at 12 gradings/user/day), and writes the result back to Firestore over
the REST API using that same token — no Firebase service account needed.

## Develop

```bash
cp .env.example .env      # fill in VITE_FIREBASE_* and ANTHROPIC_API_KEY
npm install
npm run netlify-dev       # Vite + the grading function together (needs `netlify-cli`)
# or `npm run dev` for the UI only (grading calls will 404)
npm test                  # Vitest: leitner + session
```

Full setup (Firebase project, Firestore rules, Anthropic key, Netlify env vars,
authorized domains) is in [`SETUP.md`](./SETUP.md).
