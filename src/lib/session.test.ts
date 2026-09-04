import { describe, it, expect } from 'vitest';
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

const card = (id: string, extra: Record<string, number> = {}) => ({
  id,
  reviewCount: 0,
  correctCount: 0,
  ...extra,
});

describe('session', () => {
  it('new card needs 1, previously-forgotten cards need more', () => {
    expect(requiredHits(card('a'))).toBe(1);
    expect(requiredHits(card('c', { reviewCount: 2, correctCount: 1 }))).toBe(2);
    expect(requiredHits(card('d', { reviewCount: 9, correctCount: 2 }))).toBe(3);
    expect(requiredHits(card('e'))).toBeLessThanOrEqual(MAX_NEEDED);
  });

  it('a new card is mastered on the first "known", promote persists once', () => {
    let s = initSession([card('a'), card('b')]);
    let r = answer(s, true);
    s = r.session;
    expect(r.persist).toBe('promote');
    expect(s.masteredCount).toBe(1);
    expect(currentId(s)).toBe('b');
    r = answer(s, true);
    s = r.session;
    expect(isComplete(s)).toBe(true);
  });

  it('a card needing 2 hits stays until it gets both', () => {
    let s = initSession([card('a', { reviewCount: 2, correctCount: 1 }), card('b')]);
    let r = answer(s, true); // a -> 1/2, back of queue
    s = r.session;
    expect(r.persist).toBe(null);
    expect(currentId(s)).toBe('b');
    r = answer(s, true); // b mastered
    s = r.session;
    r = answer(s, true); // a -> 2/2 mastered
    s = r.session;
    expect(r.persist).toBe('promote');
    expect(isComplete(s)).toBe(true);
  });

  it('a miss resets the streak, raises the bar, requeues to the back', () => {
    let s = initSession([card('a'), card('b')]);
    let r = answer(s, false); // miss a
    s = r.session;
    expect(r.persist).toBe('lapse');
    expect(s.states.a.needed).toBe(2);
    expect(currentId(s)).toBe('b');
    r = answer(s, false); // miss b
    s = r.session;
    r = answer(s, false); // miss a again -> no second lapse
    s = r.session;
    expect(r.persist).toBe(null);
    expect(s.states.a.needed).toBe(3);
  });

  it('re-answering an already-mastered card does not double-count', () => {
    let s = initSession([card('a'), card('b')]);
    s = answer(s, true).session; // a mastered, removed from queue
    expect(s.masteredCount).toBe(1);
    // Force a stale re-answer of 'a' (a delayed swipe callback could do this).
    const stale = answer({ ...s, queue: ['a', ...s.queue] }, true);
    expect(stale.persist).toBe(null);
    expect(stale.session.masteredCount).toBe(1);
  });

  it('dropCard removes a card and shrinks the total', () => {
    let s = initSession([card('a'), card('b')]);
    s = dropCard(s, 'a')!;
    expect(s.total).toBe(1);
    expect(currentId(s)).toBe('b');
    expect(peekNextId(s)).toBe(null);
  });
});
