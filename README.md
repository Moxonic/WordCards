# Mendo

[![Netlify Status](https://api.netlify.com/api/v1/badges/c6eb9abe-658d-4b0f-87ae-e4f94185274c/deploy-status)](https://app.netlify.com/projects/mywordcards/deploys)

An AI writing tutor for language learners. Write an email or a discussion essay
in Norwegian, English, Spanish or German, get a teacher-style assessment from
Claude, then drill your own mistakes with flashcards.

- **Sign in with Google** (Firebase Auth).
- **Write** – pick the writing language, your mother tongue and a title; choose
  an example task in the style of the Norskprøve B2 exam, or write your own.
- **Get feedback** – Claude returns a CEFR-level estimate, a one-line note per
  category (content / grammar / vocabulary / spelling), short "what went well /
  what to check" feedback, and a fully corrected version. Every grammar and
  spelling fix is saved with a translation in your mother tongue.
- **Review** – per text, repeatable. Flashcards show the meaning in your mother
  tongue; flip to the correct sentence (with your original struck through + a
  note). Type it or just flip; swipe left to repeat, right into the known pile.
  Same Leitner + mastery-loop engine as before (`src/lib/leitner.ts`,
  `src/lib/session.ts`).
- **Try again** – any task can be re-attempted from a blank page; old attempts
  stay in *My texts*.
- **Menu language** – chosen on first sign-in (Norwegian Bokmål, English,
  Spanish, German), switchable later from the account menu.

## Stack

Vite + React + TypeScript · Tailwind · Firebase (Auth + Firestore) · one Netlify
background function (`netlify/functions/grade-background.mts`) that calls the
Anthropic API and writes the result back to Firestore.

## Develop

```bash
cp .env.example .env      # fill in VITE_FIREBASE_*, ANTHROPIC_API_KEY, FIREBASE_SERVICE_ACCOUNT
npm install
npm run netlify-dev       # Vite + the grading function together (needs `netlify-cli`)
# or `npm run dev` for the UI only (grading calls will 404)
npm test                  # Vitest: leitner + session
```

Full setup (Firebase project, service account, Netlify env vars, authorized
domains) is in [`SETUP.md`](./SETUP.md).
