// Within-session mastery loop.
//
// Rules the deck follows during one sitting:
//  * You keep going until every card has been answered "known" enough times.
//  * A card you just answered never comes back as the very next card.
//  * A missed card goes to the back and needs one MORE "known" hit than before.
//  * A card with a poor real history needs more "known" hits to start with;
//    a genuinely new card just needs one.

export const MAX_NEEDED = 4;

/** How many consecutive "known" answers this card needs before it's done. */
export function requiredHits(card) {
  const reviews = card.reviewCount || 0;
  const correct = card.correctCount || 0;
  const lapses = Math.max(0, reviews - correct); // times you've forgotten it before
  let n = 1; // a new card is "known" on the first correct answer
  if (lapses >= 1) n = 2;
  if (lapses >= 4) n = 3;
  return Math.min(n, MAX_NEEDED);
}

export function initSession(cards) {
  const states = {};
  for (const c of cards) {
    states[c.id] = { needed: requiredHits(c), got: 0, missed: false, promoted: false };
  }
  return {
    queue: cards.map((c) => c.id),
    states,
    lastShownId: null,
    masteredCount: 0,
    total: cards.length,
  };
}

export function currentId(session) {
  return session && session.queue.length ? session.queue[0] : null;
}

export function peekNextId(session) {
  return session && session.queue.length > 1 ? session.queue[1] : null;
}

export function isComplete(session) {
  return session != null && session.queue.length === 0;
}

export function cardState(session, id) {
  return session?.states?.[id] || null;
}

/**
 * Answer the current card.
 * @returns {{ session, persist: 'promote' | 'lapse' | null }}
 *          `persist` tells the caller whether to write a Leitner update:
 *          'promote' once, when the card is finally mastered this session;
 *          'lapse' once, the first time it is missed this session.
 */
export function answer(session, known) {
  const id = currentId(session);
  if (id == null) return { session, persist: null };

  const st = session.states[id];
  const states = { ...session.states };
  let queue = session.queue.slice(1); // remove current from the front
  let persist = null;
  let masteredCount = session.masteredCount;

  if (known) {
    const got = st.got + 1;
    if (got >= st.needed) {
      states[id] = { ...st, got, mastered: true, promoted: true };
      if (!st.promoted) persist = 'promote';
      masteredCount += 1;
      // card leaves the queue for good
    } else {
      states[id] = { ...st, got };
      queue = requeue(queue, id);
    }
  } else {
    states[id] = {
      ...st,
      got: 0,
      needed: Math.min(st.needed + 1, MAX_NEEDED),
      missed: true,
    };
    if (!st.missed) persist = 'lapse';
    queue = requeue(queue, id);
  }

  return {
    session: { ...session, states, queue, lastShownId: id, masteredCount },
    persist,
  };
}

// Back of the queue, so it is never the immediate next card (unless it is the
// only card left).
function requeue(queue, id) {
  return queue.length === 0 ? [id] : [...queue, id];
}

/** Remove a card from the session (e.g. it was deleted). */
export function dropCard(session, id) {
  if (!session) return session;
  const wasQueued = session.queue.includes(id);
  const states = { ...session.states };
  delete states[id];
  return {
    ...session,
    states,
    queue: session.queue.filter((q) => q !== id),
    total: Math.max(0, session.total - (wasQueued ? 1 : 0)),
  };
}
