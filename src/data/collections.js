import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { newCardState } from '../lib/leitner';
import { makeDedupeKey, DEFAULT_COLLECTION_ID } from './cards';
import { STARTER_DECKS } from './starterDecks';

// Firestore: users/{uid}/collections/{collectionId}
//   { name, source: 'default'|'manual'|'extension'|'imported', createdAt, shareCode? }
//
// Sharing snapshot: sharedDecks/{CODE}
//   { ownerUid, name, createdAt, cards: [{ front, back, sourceLang, targetLang }] }
// Any signed-in user can read a sharedDecks doc (that's the point); only the
// owner can create/change one (see firestore.rules).

function collsCol(uid) {
  return collection(db, 'users', uid, 'collections');
}

export function subscribeCollections(uid, onChange, onError) {
  return onSnapshot(
    collsCol(uid),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      // eslint-disable-next-line no-console
      console.error('[wordcards] collections subscription failed:', err);
      if (onError) onError(err);
    },
  );
}

/** Make sure the built-in "My words" collection exists (without clobbering a rename). */
export async function ensureDefaultCollection(uid) {
  const ref = doc(db, 'users', uid, 'collections', DEFAULT_COLLECTION_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { name: 'My words', source: 'default', createdAt: Date.now() });
  }
}

export async function createCollection(uid, name) {
  const ref = doc(collsCol(uid));
  await setDoc(ref, {
    name: (name || '').trim() || 'Untitled',
    source: 'manual',
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function renameCollection(uid, id, name) {
  await updateDoc(doc(db, 'users', uid, 'collections', id), {
    name: (name || '').trim() || 'Untitled',
  });
}

/** Delete a collection and every card in it. `cardsInIt` = the cards you already have. */
export async function deleteCollection(uid, id, cardsInIt) {
  for (let i = 0; i < cardsInIt.length; i += 450) {
    const batch = writeBatch(db);
    for (const c of cardsInIt.slice(i, i + 450)) {
      batch.delete(doc(db, 'users', uid, 'cards', c.id));
    }
    await batch.commit();
  }
  await deleteDoc(doc(db, 'users', uid, 'collections', id));
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

function randomCode(len = 7) {
  const bytes = new Uint32Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i += 1) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

/**
 * Publish a point-in-time snapshot of a collection and return its share code.
 * Re-sharing generates a fresh code and snapshot.
 */
export async function shareCollection(uid, coll, cards) {
  const payload = {
    ownerUid: uid,
    name: coll.name || 'Shared collection',
    createdAt: Date.now(),
    cards: cards.slice(0, 500).map((c) => ({
      front: c.front,
      back: c.back,
      sourceLang: c.sourceLang ?? null,
      targetLang: c.targetLang ?? null,
    })),
  };

  let code = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const candidate = randomCode();
    try {
      // Fails the rules' `update` check if the code is already taken by someone else.
      await setDoc(doc(db, 'sharedDecks', candidate), payload);
      code = candidate;
      break;
    } catch (err) {
      if (attempt === 3) throw err;
    }
  }

  await updateDoc(doc(db, 'users', uid, 'collections', coll.id), { shareCode: code });
  return code;
}

/**
 * Add one bundled starter deck. The deck's `id` is used as the collection doc id
 * so it is the same on every device and re-adding after a delete restores it.
 * No-op (returns added: 0) if that collection already exists.
 */
export async function addStarterDeck(uid, deck) {
  const ref = doc(db, 'users', uid, 'collections', deck.id);
  const existing = await getDoc(ref);
  if (existing.exists()) return { count: 0, collectionId: deck.id, skipped: true };

  // Also skip if a same-named collection exists from an older version that used
  // a random id, so nobody ends up with two copies.
  const all = await getDocs(collection(db, 'users', uid, 'collections'));
  if (all.docs.some((d) => (d.data().name || '') === deck.name)) {
    return { count: 0, collectionId: null, skipped: true };
  }

  await setDoc(ref, { name: deck.name, source: 'starter', createdAt: Date.now() });

  let count = 0;
  const rows = deck.cards || [];
  for (let i = 0; i < rows.length; i += 450) {
    const batch = writeBatch(db);
    for (const r of rows.slice(i, i + 450)) {
      if (!r.front || !r.back) continue;
      batch.set(doc(collection(db, 'users', uid, 'cards')), {
        front: String(r.front).trim(),
        back: String(r.back).trim(),
        sourceLang: r.sourceLang ?? null,
        targetLang: r.targetLang ?? null,
        collectionId: deck.id,
        source: 'starter',
        dedupeKey: makeDedupeKey(r.front, r.back),
        ...newCardState(),
      });
      count += 1;
    }
    await batch.commit();
  }
  return { count, collectionId: deck.id };
}

/**
 * Give a new account the three built-in collections, once. Tracked by a flag so
 * that decks the user later deletes stay deleted. Safe to call on every sign-in.
 * @returns true if it seeded this time, false if already done.
 */
export async function seedStarterDecksOnce(uid) {
  const flagRef = doc(db, 'users', uid, 'meta', 'seed');
  const flag = await getDoc(flagRef);
  if (flag.exists() && flag.data().starters) return false;

  for (const deck of STARTER_DECKS) {
    // eslint-disable-next-line no-await-in-loop
    await addStarterDeck(uid, deck);
  }
  await setDoc(flagRef, { starters: true, at: Date.now() });
  return true;
}

/** Copy a shared collection (by code) into this account as a new collection. */
export async function importSharedCollection(uid, rawCode) {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) throw new Error('Enter a share code.');

  const snap = await getDoc(doc(db, 'sharedDecks', code));
  if (!snap.exists()) throw new Error('No collection found for that code.');
  const data = snap.data();
  const rows = Array.isArray(data.cards) ? data.cards : [];

  const collectionId = await createCollection(uid, `${data.name || 'Shared'} (shared)`);

  let count = 0;
  for (let i = 0; i < rows.length; i += 450) {
    const batch = writeBatch(db);
    for (const r of rows.slice(i, i + 450)) {
      if (!r.front || !r.back) continue;
      batch.set(doc(collection(db, 'users', uid, 'cards')), {
        front: String(r.front).trim(),
        back: String(r.back).trim(),
        sourceLang: r.sourceLang ?? null,
        targetLang: r.targetLang ?? null,
        collectionId,
        source: 'imported',
        dedupeKey: makeDedupeKey(r.front, r.back),
        ...newCardState(),
      });
      count += 1;
    }
    await batch.commit();
  }

  return { name: data.name, count, collectionId };
}
