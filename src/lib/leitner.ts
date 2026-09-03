// Leitner-box spaced repetition.
//
// A card lives in one of 5 boxes. Answering "known" (swipe right) promotes it one
// box and schedules it further out; answering "again" (swipe left) sends it back
// to box 1 so it comes round soon.

import type { ReviewState } from '../types';

export const BOX_INTERVALS_DAYS = [1, 2, 4, 7, 14]; // index = box - 1
export const MAX_BOX = BOX_INTERVALS_DAYS.length;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** Fresh scheduling fields for a brand new card (due immediately). */
export function newCardState(now = Date.now()): ReviewState {
  return {
    box: 1,
    dueDate: now,
    createdAt: now,
    lastReviewed: null,
    reviewCount: 0,
    correctCount: 0,
  };
}

type CardLike = Pick<ReviewState, 'box' | 'reviewCount' | 'correctCount'>;

/** Given a review outcome, return only the fields that change (for updateDoc). */
export function applyReview(
  card: Partial<CardLike>,
  remembered: boolean,
  now = Date.now(),
): Pick<ReviewState, 'box' | 'dueDate' | 'lastReviewed' | 'reviewCount' | 'correctCount'> {
  const currentBox = clampBox(card.box || 1);
  const nextBox = remembered ? Math.min(currentBox + 1, MAX_BOX) : 1;
  const intervalDays = BOX_INTERVALS_DAYS[nextBox - 1];

  return {
    box: nextBox,
    dueDate: now + intervalDays * DAY_MS,
    lastReviewed: now,
    reviewCount: (card.reviewCount || 0) + 1,
    correctCount: (card.correctCount || 0) + (remembered ? 1 : 0),
  };
}

/** Is this card ready to be shown again? */
export function isDue(card: { dueDate?: number } | null | undefined, now = Date.now()): boolean {
  return (card?.dueDate ?? 0) <= now;
}

function clampBox(box: number): number {
  if (!Number.isFinite(box)) return 1;
  return Math.min(Math.max(Math.round(box), 1), MAX_BOX);
}
