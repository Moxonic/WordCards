// WordCards sync – service worker.
//
// No Firebase SDK (MV3 blocks remote code): we talk to Google's Identity Toolkit
// and Firestore REST APIs with plain fetch.
//
//   1. chrome.identity.getAuthToken  -> Google OAuth access token for the profile
//   2. accounts:signInWithIdp        -> Firebase ID token + refresh token (uid)
//   3. Firestore REST                -> write users/{uid}/cards, ID token as Bearer
//
// The uid is derived from the Google account, so it matches whatever the web app
// gets for the same account and the security rules (request.auth.uid == uid) pass.

import { FIREBASE_API_KEY, FIREBASE_PROJECT_ID } from './config.js';

const IDP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`;
const REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const DAY_MS = 24 * 60 * 60 * 1000;
const SEEN_CAP = 5000;

// ---------------------------------------------------------------- storage helpers

const store = {
  get: (keys) => chrome.storage.local.get(keys),
  set: (obj) => chrome.storage.local.set(obj),
};

async function getStatus() {
  const s = await store.get([
    'email',
    'uid',
    'lastSyncAt',
    'lastAddedCount',
    'totalSynced',
    'autoSync',
    'pendingRows',
    'lastError',
  ]);
  return {
    email: s.email || null,
    uid: s.uid || null,
    signedIn: Boolean(s.uid),
    lastSyncAt: s.lastSyncAt || null,
    lastAddedCount: s.lastAddedCount || 0,
    totalSynced: s.totalSynced || 0,
    autoSync: s.autoSync !== false, // default on
    pending: (s.pendingRows || []).length,
    lastError: s.lastError || null,
  };
}

// ------------------------------------------------------------------------- auth

function getGoogleToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message || 'no google token'));
      } else {
        resolve(token);
      }
    });
  });
}

async function firebaseSignIn(interactive) {
  const googleToken = await getGoogleToken(interactive);
  const res = await fetch(IDP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postBody: `access_token=${googleToken}&providerId=google.com`,
      requestUri: 'http://localhost',
      returnSecureToken: true,
      returnIdpCredential: true,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'signInWithIdp failed');

  await store.set({
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    tokenExpiry: Date.now() + Number(data.expiresIn) * 1000,
    uid: data.localId,
    email: data.email || null,
    lastError: null,
  });
  return data.idToken;
}

async function refreshIdToken(refreshToken) {
  const res = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'token refresh failed');
  await store.set({
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    tokenExpiry: Date.now() + Number(data.expires_in) * 1000,
    uid: data.user_id,
  });
  return data.id_token;
}

async function ensureIdToken({ interactive = false } = {}) {
  const s = await store.get(['idToken', 'refreshToken', 'tokenExpiry']);
  if (s.idToken && s.tokenExpiry && s.tokenExpiry - Date.now() > 60_000) {
    return s.idToken;
  }
  if (s.refreshToken) {
    try {
      return await refreshIdToken(s.refreshToken);
    } catch (err) {
      // fall through to a full sign-in
      console.warn('[wordcards] refresh failed, re-authing:', err.message);
    }
  }
  return firebaseSignIn(interactive);
}

async function signOut() {
  const s = await store.get(['idToken']);
  // Best effort: drop the cached Google token so the next sign-in re-prompts.
  try {
    const gt = await getGoogleToken(false).catch(() => null);
    if (gt) {
      await chrome.identity.removeCachedAuthToken({ token: gt });
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${gt}`).catch(() => {});
    }
  } catch {}
  void s;
  await chrome.storage.local.remove([
    'idToken',
    'refreshToken',
    'tokenExpiry',
    'uid',
    'email',
    'seenSeeded',
    'seen',
    'gtCollectionEnsured',
  ]);
}

// -------------------------------------------------------------- firestore writes

function fsVal(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  return { stringValue: String(v) };
}

function dedupeKey(front, back) {
  return `${(front || '').trim().toLowerCase()}=>${(back || '').trim().toLowerCase()}`;
}

const EXTENSION_COLLECTION_ID = 'google-translate';

function cardFields(row) {
  const now = Date.now();
  return {
    fields: {
      front: fsVal(row.front.trim()),
      back: fsVal(row.back.trim()),
      sourceLang: fsVal(row.sourceLang || null),
      targetLang: fsVal(row.targetLang || null),
      collectionId: fsVal(EXTENSION_COLLECTION_ID),
      source: fsVal('extension'),
      dedupeKey: fsVal(dedupeKey(row.front, row.back)),
      box: fsVal(1),
      dueDate: fsVal(now),
      createdAt: fsVal(now),
      lastReviewed: fsVal(null),
      reviewCount: fsVal(0),
      correctCount: fsVal(0),
    },
  };
}

// Create the "Google Translate" collection doc once, so the web app's picker
// shows it. Fixed id => no query needed. PATCH creates the doc if missing.
async function ensureExtensionCollection(idToken, uid) {
  const s = await store.get(['gtCollectionEnsured']);
  if (s.gtCollectionEnsured) return;
  const res = await fetch(
    `${FIRESTORE_BASE}/users/${uid}/collections/${EXTENSION_COLLECTION_ID}` +
      '?updateMask.fieldPaths=name&updateMask.fieldPaths=source',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        fields: { name: fsVal('Google Translate'), source: fsVal('extension') },
      }),
    },
  );
  if (res.ok) await store.set({ gtCollectionEnsured: true });
}

async function createCard(idToken, uid, row) {
  const res = await fetch(`${FIRESTORE_BASE}/users/${uid}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(cardFields(row)),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `Firestore write ${res.status}`);
  }
}

async function loadServerDedupeKeys(idToken, uid) {
  const keys = new Set();
  let pageToken = '';
  do {
    const url = new URL(`${FIRESTORE_BASE}/users/${uid}/cards`);
    url.searchParams.set('pageSize', '300');
    url.searchParams.append('mask.fieldPaths', 'dedupeKey');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
    if (!res.ok) break;
    const data = await res.json();
    for (const doc of data.documents || []) {
      const k = doc.fields?.dedupeKey?.stringValue;
      if (k) keys.add(k);
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return keys;
}

async function getSeenSet(idToken, uid) {
  const s = await store.get(['seenSeeded', 'seen']);
  if (s.seenSeeded && Array.isArray(s.seen)) return new Set(s.seen);
  const seeded = await loadServerDedupeKeys(idToken, uid);
  await store.set({ seenSeeded: true, seen: [...seeded].slice(-SEEN_CAP) });
  return seeded;
}

async function persistSeenSet(set) {
  await store.set({ seen: [...set].slice(-SEEN_CAP) });
}

// ------------------------------------------------------------------- sync core

let syncing = false;

async function syncRows(incoming, { interactive = false } = {}) {
  const rows = (incoming || [])
    .map((r) => ({
      front: (r.front || '').trim(),
      back: (r.back || '').trim(),
      sourceLang: r.sourceLang || null,
      targetLang: r.targetLang || null,
    }))
    .filter((r) => r.front && r.back && r.front.toLowerCase() !== r.back.toLowerCase());

  if (rows.length === 0) return { added: 0, skipped: 0 };
  if (syncing) {
    await queuePending(rows);
    return { added: 0, skipped: 0, queued: rows.length };
  }
  syncing = true;
  try {
    let idToken;
    let uid;
    try {
      idToken = await ensureIdToken({ interactive });
      ({ uid } = await store.get(['uid']));
    } catch (err) {
      await queuePending(rows);
      await store.set({ lastError: 'Not signed in – queued for later' });
      return { added: 0, skipped: 0, queued: rows.length, error: 'not-signed-in' };
    }

    await ensureExtensionCollection(idToken, uid).catch(() => {});

    const seen = await getSeenSet(idToken, uid);
    let added = 0;
    let skipped = 0;
    for (const row of rows) {
      const key = dedupeKey(row.front, row.back);
      if (seen.has(key)) {
        skipped += 1;
        continue;
      }
      try {
        await createCard(idToken, uid, row);
        seen.add(key);
        added += 1;
      } catch (err) {
        console.warn('[wordcards] card write failed:', err.message);
        await queuePending([row]);
      }
    }
    await persistSeenSet(seen);

    const prev = await store.get(['totalSynced']);
    await store.set({
      lastSyncAt: Date.now(),
      lastAddedCount: added,
      totalSynced: (prev.totalSynced || 0) + added,
      lastError: null,
    });
    return { added, skipped };
  } finally {
    syncing = false;
  }
}

async function queuePending(rows) {
  const s = await store.get(['pendingRows']);
  const merged = [...(s.pendingRows || []), ...rows].slice(-1000);
  await store.set({ pendingRows: merged });
}

async function flushPending() {
  const s = await store.get(['pendingRows', 'uid']);
  if (!s.uid || !(s.pendingRows || []).length) return;
  const rows = s.pendingRows;
  await store.set({ pendingRows: [] });
  const result = await syncRows(rows, { interactive: false });
  if (result.error) {
    // syncRows re-queues on failure; nothing else to do.
  }
}

// --------------------------------------------------------------------- wiring

chrome.runtime.onInstalled.addListener(async () => {
  chrome.alarms.create('flush', { periodInMinutes: 30 });
  const { autoSync } = await store.get(['autoSync']);
  if (autoSync === undefined) await store.set({ autoSync: true });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'flush') flushPending();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg?.type) {
        case 'SCRAPED_ROWS': {
          const { autoSync } = await store.get(['autoSync']);
          if (autoSync === false && msg.reason === 'auto') {
            sendResponse({ ok: true, skipped: 'auto-sync off' });
            return;
          }
          const result = await syncRows(msg.rows, { interactive: false });
          sendResponse({ ok: true, ...result });
          return;
        }
        case 'SCAN_ROWS': {
          const result = await syncRows(msg.rows, { interactive: true });
          sendResponse({ ok: true, ...result });
          return;
        }
        case 'GET_STATUS':
          sendResponse(await getStatus());
          return;
        case 'SIGN_IN':
          await firebaseSignIn(true);
          await flushPending();
          sendResponse(await getStatus());
          return;
        case 'SIGN_OUT':
          await signOut();
          sendResponse(await getStatus());
          return;
        case 'SET_AUTOSYNC':
          await store.set({ autoSync: Boolean(msg.value) });
          sendResponse(await getStatus());
          return;
        default:
          sendResponse({ ok: false, error: 'unknown message' });
      }
    } catch (err) {
      console.error('[wordcards] message handler error:', err);
      sendResponse({ ok: false, error: err.message });
    }
  })();
  return true; // async sendResponse
});
