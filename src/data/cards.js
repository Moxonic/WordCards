import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { applyReview, newCardState } from '../lib/leitner';

// Firestore layout: users/{uid}/cards/{cardId}
// Card document shape:
//   front, back            strings shown on the flashcard
//   sourceLang, targetLang BCP-47-ish codes or null
//   collectionId           which collection the card belongs to (always set)
//   box, dueDate, createdAt, lastReviewed, reviewCount, correctCount  (see leitner.js)
//   source                 "manual" | "extension" | "imported"
//   dedupeKey              `${front}=>${back}` lowercased - lets the extension
//                          re-scan the same page without creating duplicates

// Well-known collection ids so the extension and migration don't need a query.
export const DEFAULT_COLLECTION_ID = 'default';
export const EXTENSION_COLLECTION_ID = 'google-translate';

function cardsCol(uid) {
  return collection(db, 'users', uid, 'cards');
}

export function makeDedupeKey(front, back) {
  return `${(front || '').trim().toLowerCase()}=>${(back || '').trim().toLowerCase()}`;
}

/**
 * Live subscription to a user's cards.
 * @returns unsubscribe function
 */
export function subscribeToCards(uid, onChange, onError) {
  return onSnapshot(
    cardsCol(uid),
    (snap) => {
      const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(cards);
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error('[wordcards] cards subscription failed:', err);
      if (onError) onError(err);
    },
  );
}

/** Add one card the user typed by hand. Returns the new doc id. */
export async function addManualCard(
  uid,
  { front, back, sourceLang = null, targetLang = null, collectionId = DEFAULT_COLLECTION_ID },
) {
  const ref = await addDoc(cardsCol(uid), {
    front: front.trim(),
    back: back.trim(),
    sourceLang,
    targetLang,
    collectionId: collectionId || DEFAULT_COLLECTION_ID,
    source: 'manual',
    dedupeKey: makeDedupeKey(front, back),
    ...newCardState(),
  });
  return ref.id;
}

/** Persist the outcome of a review swipe. */
export async function recordReview(uid, cardId, card, remembered) {
  await updateDoc(doc(db, 'users', uid, 'cards', cardId), applyReview(card, remembered));
}

/** Delete a single card. */
export async function deleteCard(uid, cardId) {
  await deleteDoc(doc(db, 'users', uid, 'cards', cardId));
}

/** Move a card to another collection. */
export async function moveCard(uid, cardId, collectionId) {
  await updateDoc(doc(db, 'users', uid, 'cards', cardId), { collectionId });
}

/** Batch-delete a known set of cards ({ id } objects or id strings). */
export async function deleteCards(uid, cards) {
  const ids = cards.map((c) => (typeof c === 'string' ? c : c.id));
  for (let i = 0; i < ids.length; i += 450) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + 450)) batch.delete(doc(db, 'users', uid, 'cards', id));
    await batch.commit();
  }
}

/** Give any card that predates collections a home. Returns how many were fixed. */
export async function assignOrphanCards(uid, cards, collectionId = DEFAULT_COLLECTION_ID) {
  const orphans = cards.filter((c) => !c.collectionId);
  for (let i = 0; i < orphans.length; i += 450) {
    const batch = writeBatch(db);
    for (const c of orphans.slice(i, i + 450)) {
      batch.update(doc(db, 'users', uid, 'cards', c.id), { collectionId });
    }
    await batch.commit();
  }
  return orphans.length;
}

/**
 * Insert scraped translations, skipping any whose dedupeKey already exists.
 * `rows` = [{ front, back, sourceLang?, targetLang? }]
 * Returns { added, skipped }.
 */
export async function upsertScrapedCards(uid, rows, collectionId = EXTENSION_COLLECTION_ID) {
  const existing = await getDocs(cardsCol(uid));
  const seen = new Set(existing.docs.map((d) => d.data().dedupeKey).filter(Boolean));

  const fresh = [];
  for (const row of rows) {
    const front = (row.front || '').trim();
    const back = (row.back || '').trim();
    if (!front || !back) continue;
    const key = makeDedupeKey(front, back);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push({ front, back, key, sourceLang: row.sourceLang || null, targetLang: row.targetLang || null });
  }

  for (let i = 0; i < fresh.length; i += 450) {
    const batch = writeBatch(db);
    for (const row of fresh.slice(i, i + 450)) {
      batch.set(doc(cardsCol(uid)), {
        front: row.front,
        back: row.back,
        sourceLang: row.sourceLang,
        targetLang: row.targetLang,
        collectionId,
        source: 'extension',
        dedupeKey: row.key,
        ...newCardState(),
      });
    }
    await batch.commit();
  }

  return { added: fresh.length, skipped: rows.length - fresh.length };
}

/** One-off import of legacy localStorage cards ({ cardFront:{wordA}, cardBack:{wordB} }). */
export async function importLegacyCards(uid, legacyCards) {
  const rows = legacyCards
    .map((c) => ({ front: c?.cardFront?.wordA, back: c?.cardBack?.wordB }))
    .filter((r) => r.front && r.back);
  if (rows.length === 0) return { added: 0, skipped: 0 };

  const batch = writeBatch(db);
  for (const row of rows) {
    batch.set(doc(cardsCol(uid)), {
      front: String(row.front).trim(),
      back: String(row.back).trim(),
      sourceLang: null,
      targetLang: null,
      collectionId: DEFAULT_COLLECTION_ID,
      source: 'manual',
      dedupeKey: makeDedupeKey(row.front, row.back),
      ...newCardState(),
    });
  }
  await batch.commit();
  return { added: rows.length, skipped: legacyCards.length - rows.length };
}

// Small helper for tests / debugging.
export async function countCards(uid) {
  const snap = await getDocs(query(cardsCol(uid), where('source', 'in', ['manual', 'extension', 'imported'])));
  return snap.size;
}
