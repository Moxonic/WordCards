import {
  applyReview,
  isDue,
  newCardState,
  boxDistribution,
  BOX_INTERVALS_DAYS,
  MAX_BOX,
  DAY_MS,
} from './leitner';

const NOW = 1_700_000_000_000;

test('newCardState starts in box 1 and is due immediately', () => {
  const s = newCardState(NOW);
  expect(s.box).toBe(1);
  expect(s.dueDate).toBe(NOW);
  expect(isDue(s, NOW)).toBe(true);
  expect(s.reviewCount).toBe(0);
  expect(s.correctCount).toBe(0);
});

test('swipe right promotes one box and schedules further out', () => {
  const next = applyReview({ box: 1, reviewCount: 0, correctCount: 0 }, true, NOW);
  expect(next.box).toBe(2);
  expect(next.dueDate).toBe(NOW + BOX_INTERVALS_DAYS[1] * DAY_MS);
  expect(next.reviewCount).toBe(1);
  expect(next.correctCount).toBe(1);
  expect(next.lastReviewed).toBe(NOW);
});

test('swipe right is capped at the last box', () => {
  const next = applyReview({ box: MAX_BOX, reviewCount: 9, correctCount: 9 }, true, NOW);
  expect(next.box).toBe(MAX_BOX);
  expect(next.dueDate).toBe(NOW + BOX_INTERVALS_DAYS[MAX_BOX - 1] * DAY_MS);
});

test('swipe left drops straight back to box 1 regardless of current box', () => {
  const next = applyReview({ box: 4, reviewCount: 5, correctCount: 4 }, false, NOW);
  expect(next.box).toBe(1);
  expect(next.dueDate).toBe(NOW + BOX_INTERVALS_DAYS[0] * DAY_MS);
  expect(next.reviewCount).toBe(6);
  expect(next.correctCount).toBe(4); // unchanged on a wrong answer
});

test('isDue is inclusive of the exact due moment', () => {
  expect(isDue({ dueDate: NOW }, NOW)).toBe(true);
  expect(isDue({ dueDate: NOW + 1 }, NOW)).toBe(false);
  expect(isDue({ dueDate: NOW - 1 }, NOW)).toBe(true);
});

test('boxDistribution buckets cards and clamps out-of-range boxes', () => {
  const dist = boxDistribution([
    { box: 1 },
    { box: 1 },
    { box: 3 },
    { box: 99 }, // clamps to MAX_BOX
    { box: undefined }, // treated as box 1
  ]);
  expect(dist[0]).toBe(3);
  expect(dist[2]).toBe(1);
  expect(dist[MAX_BOX - 1]).toBe(1);
});
