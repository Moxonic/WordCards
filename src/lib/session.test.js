import {
  requiredHits,
  initSession,
  answer,
  currentId,
  peekNextId,
  isComplete,
  dropCard,
  MAX_NEEDED,
} from './session';

const card = (id, extra = {}) => ({ id, box: 1, reviewCount: 0, correctCount: 0, ...extra });

test('requiredHits: new card needs 1, previously-forgotten cards need more', () => {
  expect(requiredHits(card('a'))).toBe(1); // brand new
  expect(requiredHits(card('b', { box: 3 }))).toBe(1); // mature, never lapsed
  expect(requiredHits(card('c', { reviewCount: 2, correctCount: 1 }))).toBe(2); // 1 lapse
  expect(requiredHits(card('d', { reviewCount: 9, correctCount: 2 }))).toBe(3); // 7 lapses, capped at 3
  expect(requiredHits(card('e'))).toBeLessThanOrEqual(MAX_NEEDED);
});

test('a new card is mastered on the first "knew it", and promote persists once', () => {
  let s = initSession([card('a'), card('b')]); // needed = 1 each
  let persist;
  ({ session: s, persist } = answer(s, true)); // a mastered immediately
  expect(persist).toBe('promote');
  expect(s.masteredCount).toBe(1);
  expect(currentId(s)).toBe('b');
  ({ session: s, persist } = answer(s, true)); // b mastered
  expect(persist).toBe('promote');
  expect(isComplete(s)).toBe(true);
  expect(s.masteredCount).toBe(2);
});

test('a card that needs 2 hits stays until it gets both', () => {
  let s = initSession([card('a', { reviewCount: 2, correctCount: 1 }), card('b', { box: 3 })]); // a needs 2
  let persist;
  ({ session: s, persist } = answer(s, true)); // a: 1/2 -> back of queue
  expect(persist).toBe(null);
  expect(currentId(s)).toBe('b'); // not shown twice in a row
  ({ session: s, persist } = answer(s, true)); // b mastered
  ({ session: s, persist } = answer(s, true)); // a: 2/2 mastered
  expect(persist).toBe('promote');
  expect(isComplete(s)).toBe(true);
});

test('a miss resets the streak, raises the bar, and requeues to the back', () => {
  let s = initSession([card('a', { box: 3 }), card('b', { box: 3 })]);
  let persist;
  ({ session: s, persist } = answer(s, false)); // miss a
  expect(persist).toBe('lapse');
  expect(s.states.a.got).toBe(0);
  expect(s.states.a.needed).toBe(2); // was 1, bumped
  expect(currentId(s)).toBe('b'); // a went to the back
  ({ session: s, persist } = answer(s, false)); // miss b (lapse once)
  ({ session: s, persist } = answer(s, false)); // miss a again -> no second lapse write
  expect(persist).toBe(null);
  expect(s.states.a.needed).toBe(3);
});

test('missed card must be mastered before the session completes', () => {
  let s = initSession([card('a', { box: 3 })]); // needed 1, only card
  ({ session: s } = answer(s, false)); // miss -> needed 2, still queued
  expect(isComplete(s)).toBe(false);
  ({ session: s } = answer(s, true)); // 1/2
  expect(isComplete(s)).toBe(false);
  ({ session: s } = answer(s, true)); // 2/2 -> done
  expect(isComplete(s)).toBe(true);
});

test('dropCard removes a card and shrinks the total', () => {
  let s = initSession([card('a'), card('b')]);
  s = dropCard(s, 'a');
  expect(s.total).toBe(1);
  expect(currentId(s)).toBe('b');
  expect(peekNextId(s)).toBe(null);
});
