# WordCards setup

The app now needs a Firebase project (Google sign-in + Firestore sync). The
companion Chrome extension needs one extra OAuth client. None of this can be done
for you — follow the steps below once.

---

## 1. Firebase project

1. <https://console.firebase.google.com> → **Add project** (Analytics optional).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
   Set a support email. Save.
3. **Build → Firestore Database → Create database → Production mode.** Pick a region.
4. **Project settings (gear) → General → Your apps → Web app (`</>`)**. Register it.
   Copy the `firebaseConfig` values.

## 2. Web app env

```bash
cp .env.example .env
```

Fill `.env` with the values from step 1.4:

| .env key | firebaseConfig field |
|---|---|
| `REACT_APP_FIREBASE_API_KEY` | `apiKey` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `REACT_APP_FIREBASE_PROJECT_ID` | `projectId` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `REACT_APP_FIREBASE_APP_ID` | `appId` |

Then:

```bash
npm install
npm start
```

`npm start` must be restarted whenever `.env` changes.

## 3. Security rules

`firestore.rules` in this repo restricts every user to `users/{uid}/**`, plus a
`sharedDecks/{code}` area that any signed-in user can read but only the owner can
write — that's what powers "share a collection with a friend". Publish it:

- **Console:** Firestore → **Rules** tab → paste the file contents → **Publish**.
- **CLI:** `npm i -g firebase-tools && firebase login && firebase deploy --only firestore:rules`
  (needs a `firebase.json` pointing at `firestore.rules`).

> Re-publish whenever `firestore.rules` changes. If sharing/importing a
> collection fails with "Missing or insufficient permissions", the deployed rules
> are stale.

## 4. Authorized domains

Authentication → **Settings → Authorized domains** → make sure `localhost` is
listed (it is by default). Add your production domain when you deploy.

---

## 5. Chrome extension (`extension/`)

The extension writes to the **same** Firebase project as the web app. It signs in
with `chrome.identity`, so it needs its own OAuth client.

### 5a. Config file

```bash
cp extension/config.example.js extension/config.js
```

Set `FIREBASE_API_KEY` (same `apiKey` as the web app) and `FIREBASE_PROJECT_ID`.

### 5b. Load it once to get its ID

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   select the `extension/` folder.
2. Copy the **extension ID** shown on the card.

### 5c. Pin the ID (`key`)

So the ID does not change every reload:

1. In `chrome://extensions`, **Pack extension** (leave key blank the first time)
   → this creates an `extension.pem` next to the folder.
2. Get the public key:
   `openssl rsa -in extension.pem -pubout -outform DER | openssl base64 -A`
3. Put that string as `"key"` in `extension/manifest.json`. Reload — the ID is
   now stable. Keep `extension.pem` out of git.

### 5d. OAuth client for the extension

1. <https://console.cloud.google.com> → same project → **APIs & Services →
   Credentials → Create credentials → OAuth client ID**.
2. Application type: **Chrome extension**. Enter the extension ID from 5b/5c.
3. Copy the client ID into `"oauth2".client_id` in `extension/manifest.json`.
4. On the **OAuth consent screen**, add your Google account as a **Test user**
   (or publish the app). Scopes needed: `openid`, `email`, `profile` — already
   in the manifest.

### 5e. Use it

- Click the extension icon → **Sign in with Google** (same account as the web app).
- Translate something on <https://translate.google.com>. With **Auto-sync** on it
  is pushed within ~2 s; it shows up in the web app's review deck.
- Or open the **History** panel / <https://translate.google.com/saved> and click
  **Scan this page now** in the popup.

> Google Translate's page markup has no stable selectors and changes without
> notice. Auto-sync and scanning are best-effort; if a scan reports "no rows",
> the `content.js` `parseListRows()` selectors need updating.
