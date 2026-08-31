// Leitner-box spaced repetition.
//
// A card lives in one of 5 boxes. Answering correctly ("I remember it" / swipe
// right) promotes it one box and schedules it further into the future; answering
// wrong ("repeat" / swipe left) sends it straight back to box 1 so it comes
// round again soon.

export const BOX_INTERVALS_DAYS = [1, 2, 4, 7, 14]; // index = box - 1
export const MAX_BOX = BOX_INTERVALS_DAYS.length;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** Fresh scheduling fields for a brand new card (due immediately). */
export function newCardState(now = Date.now()) {
  return {
    box: 1,
    dueDate: now,
    createdAt: now,
    lastReviewed: null,
    reviewCount: 0,
    correctCount: 0,
  };
}

/**
 * Given a card and the outcome of a review, return ONLY the fields that change.
 * Shape is suitable to hand straight to a Firestore updateDoc().
 *
 * @param {{box?: number, reviewCount?: number, correctCount?: number}} card
 * @param {boolean} remembered  true = swipe right, false = swipe left
 * @param {number} now  epoch ms
 */
export function applyReview(card, remembered, now = Date.now()) {
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
export function isDue(card, now = Date.now()) {
  return (card?.dueDate ?? 0) <= now;
}

/** Count of cards per box, 1-indexed array of length MAX_BOX. */
export function boxDistribution(cards) {
  const dist = new Array(MAX_BOX).fill(0);
  for (const card of cards) {
    const b = clampBox(card.box || 1);
    dist[b - 1] += 1;
  }
  return dist;
}

function clampBox(box) {
  if (!Number.isFinite(box)) return 1;
  return Math.min(Math.max(Math.round(box), 1), MAX_BOX);
}
