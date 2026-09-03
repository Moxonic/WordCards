import { collection, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { applyReview } from '../lib/leitner';
import type { Mistake } from '../types';

function mistakesCol(uid: string) {
  return collection(db, 'users', uid, 'mistakes');
}

function toMistake(id: string, data: Record<string, unknown>): Mistake {
  return {
    id,
    writingId: (data.writingId as string) ?? '',
    type: (data.type as Mistake['type']) ?? 'grammar',
    original: (data.original as string) ?? '',
    corrected: (data.corrected as string) ?? '',
    translation: (data.translation as string) ?? '',
    note: (data.note as string) ?? undefined,
    dedupeKey: (data.dedupeKey as string) ?? '',
    box: (data.box as number) ?? 1,
    dueDate: (data.dueDate as number) ?? 0,
    createdAt: (data.createdAt as number) ?? 0,
    lastReviewed: (data.lastReviewed as number) ?? null,
    reviewCount: (data.reviewCount as number) ?? 0,
    correctCount: (data.correctCount as number) ?? 0,
  };
}

export function subscribeMistakesForWriting(
  uid: string,
  writingId: string,
  onChange: (list: Mistake[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const q = query(mistakesCol(uid), where('writingId', '==', writingId));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => toMistake(d.id, d.data()))),
    (err) => {
      console.error('[skrivetrening] mistakes subscription failed:', err);
      onError?.(err);
    },
  );
}

export async function recordReview(
  uid: string,
  mistake: Mistake,
  remembered: boolean,
): Promise<void> {
  await updateDoc(doc(mistakesCol(uid), mistake.id), applyReview(mistake, remembered));
}
