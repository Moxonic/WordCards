import { describe, it, expect } from 'vitest';
import { applyReview, isDue, newCardState, BOX_INTERVALS_DAYS, MAX_BOX, DAY_MS } from './leitner';

const NOW = 1_700_000_000_000;

describe('leitner', () => {
  it('newCardState starts in box 1 and is due immediately', () => {
    const s = newCardState(NOW);
    expect(s.box).toBe(1);
    expect(s.dueDate).toBe(NOW);
    expect(isDue(s, NOW)).toBe(true);
  });

  it('swipe right promotes one box and schedules further out', () => {
    const next = applyReview({ box: 1, reviewCount: 0, correctCount: 0 }, true, NOW);
    expect(next.box).toBe(2);
    expect(next.dueDate).toBe(NOW + BOX_INTERVALS_DAYS[1] * DAY_MS);
    expect(next.reviewCount).toBe(1);
    expect(next.correctCount).toBe(1);
  });

  it('swipe right is capped at the last box', () => {
    const next = applyReview({ box: MAX_BOX, reviewCount: 9, correctCount: 9 }, true, NOW);
    expect(next.box).toBe(MAX_BOX);
  });

  it('swipe left drops straight back to box 1', () => {
    const next = applyReview({ box: 4, reviewCount: 5, correctCount: 4 }, false, NOW);
    expect(next.box).toBe(1);
    expect(next.correctCount).toBe(4);
  });

  it('isDue is inclusive of the exact due moment', () => {
    expect(isDue({ dueDate: NOW }, NOW)).toBe(true);
    expect(isDue({ dueDate: NOW + 1 }, NOW)).toBe(false);
  });
});
