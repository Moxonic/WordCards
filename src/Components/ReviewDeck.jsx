import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AiOutlineCheck, AiOutlineClose, AiOutlineDelete, AiOutlinePlus } from 'react-icons/ai';
import Card from './Card';
import SwipeCard from './SwipeCard';
import { recordReview, deleteCard } from '../data/cards';
import { isDue } from '../lib/leitner';
import { initSession, answer, currentId, isComplete, dropCard } from '../lib/session';

function byDue(a, b) {
  return (a.dueDate ?? 0) - (b.dueDate ?? 0);
}

/**
 * @param cards         all of the user's cards (Wordcard owns the subscription)
 * @param collectionId  'all' or a specific collection id to review
 */
function ReviewDeck({ uid, cards, collectionId = 'all', showAnswers, onAddCard }) {
  const [session, setSession] = useState(null);
  const [flip, setFlip] = useState({ id: null, on: false });
  const builtFor = useRef(null); // collection key the current session was built for

  const cardsById = useMemo(() => {
    const m = new Map();
    for (const c of cards) m.set(c.id, c);
    return m;
  }, [cards]);

  const scoped = useMemo(
    () =>
      collectionId === 'all' ? cards : cards.filter((c) => c.collectionId === collectionId),
    [cards, collectionId],
  );

  function buildSession(list) {
    const due = list.filter((c) => isDue(c)).sort(byDue);
    const start = due.length ? due : [...list].sort(byDue);
    setSession(initSession(start));
    setFlip({ id: null, on: false });
  }

  // Fresh session when the collection changes, or once cards first load for it.
  useEffect(() => {
    if (builtFor.current === collectionId && session) return;
    if (scoped.length === 0) {
      builtFor.current = collectionId;
      setSession(null);
      return;
    }
    builtFor.current = collectionId;
    buildSession(scoped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId, scoped, session]);

  // Heal a session that references cards deleted elsewhere.
  useEffect(() => {
    if (!session) return;
    const stale = session.queue.find((id) => !cardsById.has(id));
    if (stale) setSession((s) => dropCard(s, stale));
  }, [session, cardsById]);

  const queue = session?.queue ?? [];
  const curId = session ? currentId(session) : null;
  const topCard = curId ? cardsById.get(curId) : null;
  const behind1 = cardsById.get(queue[1]);
  const behind2 = cardsById.get(queue[2]);
  const topFlipped = flip.id === curId && flip.on;

  async function handleAnswer(known) {
    if (!session || !curId) return;
    const card = cardsById.get(curId);
    const { session: next, persist } = answer(session, known);
    setSession(next);
    if (persist && card) {
      try {
        await recordReview(uid, curId, card, persist === 'promote');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[wordcards] failed to save review:', err);
      }
    }
  }

  async function handleDelete() {
    if (!curId) return;
    const card = cardsById.get(curId);
    // eslint-disable-next-line no-alert
    if (card && !window.confirm(`Delete this card?\n\n${card.front} → ${card.back}`)) return;
    setSession((s) => dropCard(s, curId));
    try {
      await deleteCard(uid, curId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[wordcards] failed to delete card:', err);
    }
  }

  if (!session && scoped.length === 0) {
    return (
      <Centered>
        <p className="text-lg font-medium text-slate-700">No cards here yet</p>
        <button
          onClick={() => onAddCard?.()}
          title="Add a new card"
          className="mt-3 rounded-full bg-slate-800 text-white px-6 py-2.5 shadow-lg hover:bg-slate-700 flex items-center gap-2"
        >
          <AiOutlinePlus className="h-4 w-4" /> Add a card
        </button>
        <p className="text-sm text-slate-400 mt-3 max-w-[16rem]">
          …or import a friend&apos;s collection, add a starter pack from the account
          menu, or translate something with the extension.
        </p>
      </Centered>
    );
  }

  if (session && isComplete(session)) {
    return (
      <Centered>
        <p className="text-4xl">🎉</p>
        <p className="text-lg font-medium text-slate-700">
          You knew all {session.total} card{session.total === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => buildSession(scoped)}
          title="Start another round with these cards"
          className="mt-3 rounded-full bg-slate-800 text-white px-6 py-2.5 shadow-lg hover:bg-slate-700"
        >
          Go again
        </button>
      </Centered>
    );
  }

  if (!topCard) return <Centered>Loading…</Centered>;

  // Smooth progress: fully-mastered cards count 1, the rest count got/needed so
  // the bar moves on every "knew it", not only when a card is finished.
  let partial = 0;
  for (const s of Object.values(session.states)) {
    if (!s.mastered && s.needed) partial += Math.min(s.got / s.needed, 1);
  }
  const progress = session.total ? (session.masteredCount + partial) / session.total : 0;

  return (
    <div className="flex flex-col h-full w-full select-none px-5 pt-3 pb-5 bg-slate-100">
      {/* progress */}
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1.5">
        <span>known {session.masteredCount}/{session.total}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* utility row above the card */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => onAddCard?.()}
          aria-label="Add a new card"
          title="Add a new card"
          className="rounded-full w-10 h-10 bg-white shadow-sm ring-1 ring-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition"
        >
          <AiOutlinePlus className="h-4 w-4 text-slate-500" />
        </button>

        <button
          onClick={handleDelete}
          aria-label="Delete this card"
          title="Delete this card permanently"
          className="rounded-full w-10 h-10 bg-white shadow-sm ring-1 ring-slate-200 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition"
        >
          <AiOutlineDelete className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* card stack */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-3">
        <div className="relative w-full max-w-[20rem] h-full max-h-[26rem]">
          {behind2 && (
            <div className="absolute inset-0 scale-[0.9] -translate-y-3 brightness-90 pointer-events-none">
              <Card seed={behind2.id} front={behind2.front} back={behind2.back} flipped={false} />
            </div>
          )}
          {behind1 && (
            <div className="absolute inset-0 scale-[0.95] -translate-y-1.5 brightness-95 pointer-events-none">
              <Card seed={behind1.id} front={behind1.front} back={behind1.back} flipped={false} />
            </div>
          )}
          <div className="absolute inset-0">
            <SwipeCard
              key={curId}
              onSwipe={(dir) => handleAnswer(dir === 'right')}
              onTap={() => setFlip((f) => ({ id: curId, on: !(f.id === curId && f.on) }))}
            >
              <Card
                seed={curId}
                front={topCard.front}
                back={topCard.back}
                flipped={topFlipped || Boolean(showAnswers)}
              />
            </SwipeCard>
          </div>
        </div>
      </div>

      {/* action buttons */}
      <div className="flex items-center justify-center gap-16 pt-2">
        <button
          onClick={() => handleAnswer(false)}
          aria-label="I did not know this"
          title="Didn't know it — resets the streak and brings it back later this round (or swipe left)"
          className="rounded-full w-16 h-16 bg-white shadow-lg ring-1 ring-slate-200 flex items-center justify-center hover:ring-red-300 hover:text-red-600 active:scale-95 transition"
        >
          <AiOutlineClose className="h-7 w-7 text-red-500" />
        </button>
        <button
          onClick={() => handleAnswer(true)}
          aria-label="I knew this"
          title="Knew it — counts toward mastering this card (or swipe right)"
          className="rounded-full w-16 h-16 bg-white shadow-lg ring-1 ring-slate-200 flex items-center justify-center hover:ring-emerald-300 active:scale-95 transition"
        >
          <AiOutlineCheck className="h-7 w-7 text-emerald-500" />
        </button>
      </div>

      <p className="text-slate-400 text-[11px] text-center mt-3">
        Tap to flip · swipe right if you knew it · left to keep practising
      </p>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-slate-600 gap-1 text-center px-6 bg-slate-100">
      {children}
    </div>
  );
}

export default ReviewDeck;
