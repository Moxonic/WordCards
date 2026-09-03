import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Writing } from '../types';

function writingsCol(uid: string) {
  return collection(db, 'users', uid, 'writings');
}
function writingRef(uid: string, id: string) {
  return doc(db, 'users', uid, 'writings', id);
}

export interface NewWritingInput {
  title: string;
  targetLang: string;
  motherLang: string;
  promptId?: string;
  promptText?: string;
  attemptOf?: string;
}

export async function createWriting(uid: string, input: NewWritingInput): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(writingsCol(uid), {
    title: input.title.trim() || 'Uten tittel',
    targetLang: input.targetLang,
    motherLang: input.motherLang,
    promptId: input.promptId ?? null,
    promptText: input.promptText ?? null,
    attemptOf: input.attemptOf ?? null,
    draft: '',
    text: '',
    status: 'draft',
    mistakeCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

function toWriting(id: string, data: Record<string, unknown>): Writing {
  return {
    id,
    title: (data.title as string) ?? '',
    targetLang: (data.targetLang as string) ?? 'nb',
    motherLang: (data.motherLang as string) ?? 'en',
    promptId: (data.promptId as string) ?? undefined,
    promptText: (data.promptText as string) ?? undefined,
    attemptOf: (data.attemptOf as string) ?? undefined,
    draft: (data.draft as string) ?? '',
    text: (data.text as string) ?? '',
    status: (data.status as Writing['status']) ?? 'draft',
    errorMessage: (data.errorMessage as string) ?? undefined,
    mistakeCount: (data.mistakeCount as number) ?? 0,
    createdAt: (data.createdAt as number) ?? 0,
    updatedAt: (data.updatedAt as number) ?? 0,
    submittedAt: (data.submittedAt as number) ?? undefined,
    grade: (data.grade as Writing['grade']) ?? undefined,
  };
}

export function subscribeWritings(
  uid: string,
  onChange: (list: Writing[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const q = query(writingsCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => toWriting(d.id, d.data()))),
    (err) => {
      console.error('[skrivetrening] writings subscription failed:', err);
      onError?.(err);
    },
  );
}

export function subscribeWriting(
  uid: string,
  id: string,
  onChange: (w: Writing | null) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    writingRef(uid, id),
    (snap) => onChange(snap.exists() ? toWriting(snap.id, snap.data()) : null),
    (err) => {
      console.error('[skrivetrening] writing subscription failed:', err);
      onError?.(err);
    },
  );
}

export async function getWriting(uid: string, id: string): Promise<Writing | null> {
  const snap = await getDoc(writingRef(uid, id));
  return snap.exists() ? toWriting(snap.id, snap.data()) : null;
}

export async function saveDraft(uid: string, id: string, draft: string): Promise<void> {
  await updateDoc(writingRef(uid, id), { draft, updatedAt: Date.now() });
}

/**
 * Mark the writing as submitted and kick off the grading background function.
 * The function writes the grade + mistakes and flips status to 'graded' / 'error'.
 */
export async function submitForGrading(
  uid: string,
  id: string,
  text: string,
  idToken: string,
): Promise<void> {
  const now = Date.now();
  await updateDoc(writingRef(uid, id), {
    text,
    draft: text,
    status: 'grading',
    errorMessage: null,
    submittedAt: now,
    updatedAt: now,
  });

  try {
    const res = await fetch('/.netlify/functions/grade-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, writingId: id, idToken }),
    });
    // Background functions answer 202 with no useful body; only a transport
    // failure matters here.
    if (!res.ok && res.status !== 202) {
      throw new Error(`Kunne ikke starte retting (${res.status})`);
    }
  } catch (err) {
    await updateDoc(writingRef(uid, id), {
      status: 'error',
      errorMessage:
        'Fikk ikke kontakt med retteren. Sjekk nettforbindelsen og prøv igjen.',
      updatedAt: Date.now(),
    });
    throw err;
  }
}
