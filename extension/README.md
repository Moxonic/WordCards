# WordCards – Translate History Sync (Chrome extension, MV3)

Pushes words you translate on `translate.google.com` into your WordCards
(Firebase) account so they show up in the spaced-repetition review deck.

## How it works

```
content.js   scrapes translate.google.com (active pane + History/Saved lists)
     │  chrome.runtime message {front, back, sourceLang, targetLang}
     ▼
background.js (service worker)
     │  1. chrome.identity.getAuthToken     -> Google OAuth access token
     │  2. identitytoolkit signInWithIdp    -> Firebase ID token + uid
     │  3. Firestore REST                   -> POST users/{uid}/cards
     ▼
Firestore  (same project as the web app; uid matches the web login)
```

No Firebase SDK is bundled — MV3 forbids remote code, so everything is plain
`fetch` against Google's REST APIs.

- **Dedupe:** `dedupeKey = front=>back` (lowercased). The worker seeds a seen-set
  from the server once, then keeps it in `chrome.storage.local`. Re-scanning a
  page never creates duplicates.
- **Offline / signed-out:** rows are queued in `chrome.storage.local` and flushed
  by a 30-minute alarm and after the next sign-in.
- **New cards** land in Leitner box 1, due immediately, `source: "extension"`.

## Files

| file | role |
|---|---|
| `manifest.json` | MV3 manifest; fill in `oauth2.client_id` and `key` (see `../SETUP.md` §5) |
| `config.js` | your `FIREBASE_API_KEY` + `FIREBASE_PROJECT_ID` (gitignored; copy from `config.example.js`) |
| `background.js` | auth + Firestore writes + queue |
| `content.js` | scraping (`readActiveTranslation`, `parseListRows`) |
| `popup.html` / `popup.js` | sign in/out, status, auto-sync toggle, "Scan this page" |

## Install

See [`../SETUP.md`](../SETUP.md) section 5. Short version:

1. `cp config.example.js config.js` and fill it in.
2. `chrome://extensions` → Developer mode → Load unpacked → this folder.
3. Create a **Chrome extension** OAuth client for the extension ID, put it in
   `manifest.json`, add yourself as a test user, reload.
4. Popup → Sign in → translate something.

## Maintenance

`content.js` `parseListRows()` / `readActiveTranslation()` hold every brittle
selector. If a scan says "no rows found" or auto-sync stops, open the page,
inspect the History/result DOM, and update those selector lists. Each function
already tries several fallbacks and logs `[wordcards]` warnings when it extracts
nothing.
