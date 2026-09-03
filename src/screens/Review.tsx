import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { subscribeWriting } from '../data/writings';
import { subscribeMistakesForWriting, recordReview } from '../data/mistakes';
import { isDue } from '../lib/leitner';
import {
  initSession,
  answer,
  currentId,
  peekNextId,
  isComplete,
  cardState,
  type Session,
} from '../lib/session';
import { looseMatch } from '../lib/diff';
import type { Mistake, Writing } from '../types';
import SwipeCard from '../components/SwipeCard';
import FlipCard from '../components/FlipCard';
import DiffText from '../components/DiffText';
import Spinner from '../components/Spinner';

function byDue(a: Mistake, b: Mistake) {
  return (a.dueDate ?? 0) - (b.dueDate ?? 0);
}

export default function Review() {
  const { writingId = '' } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();

  const [writing, setWriting] = useState<Writing | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [flip, setFlip] = useState<{ id: string | null; on: boolean }>({ id: null, on: false });
  const [mode, setMode] = useState<'flip' | 'write'>('flip');
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);
  const built = useRef(false);

  useEffect(() => {
    if (!user) return;
    return subscribeWriting(user.uid, writingId, setWriting);
  }, [user, writingId]);

  useEffect(() => {
    if (!user) return;
    return subscribeMistakesForWriting(user.uid, writingId, setMistakes);
  }, [user, writingId]);

  function build(all: boolean) {
    const list = mistakes ?? [];
    const due = list.filter((m) => isDue(m));
    const start = (all || due.length === 0 ? [...list] : [...due]).sort(byDue);
    setSession(initSession(start));
    setFlip({ id: null, on: false });
    setMode('flip');
    setTyped('');
    setChecked(null);
  }

  // Build the first session once mistakes have loaded.
  useEffect(() => {
    if (built.current || !mistakes || mistakes.length === 0) return;
    built.current = true;
    build(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mistakes]);

  const byId = useMemo(() => {
    const m = new Map<string, Mistake>();
    for (const x of mistakes ?? []) m.set(x.id, x);
    return m;
  }, [mistakes]);

  const curId = session ? currentId(session) : null;
  const cur = curId ? byId.get(curId) : undefined;
  const behind = session ? byId.get(peekNextId(session) ?? '') : undefined;
  const topFlipped = flip.id === curId && flip.on;

  async function handleAnswer(known: boolean) {
    if (!session || !cur) return;
    const { session: next, persist } = answer(session, known);
    setSession(next);
    setFlip({ id: null, on: false });
    setMode('flip');
    setTyped('');
    setChecked(null);
    if (persist) {
      try {
        await recordReview(user!.uid, cur, persist === 'promote');
      } catch (e) {
        console.error('[skrivetrening] recordReview failed', e);
      }
    }
  }

  function checkTyped() {
    if (!cur) return;
    setChecked(looseMatch(typed, cur.corrected));
    setFlip({ id: curId, on: true });
  }

  if (!mistakes || writing === null) return <Spinner label={t('common.loading')} />;

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center text-slate-500">
        <p>{t('review.noMistakes')}</p>
        <Link to="/texts" className="text-sm text-slate-600 underline">
          {t('review.backToTexts')}
        </Link>
      </div>
    );
  }

  if (session && isComplete(session)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-4xl">🎉</p>
        <p className="text-lg font-medium text-slate-700">
          {t('review.allKnown', { n: session.total })}
        </p>
        <button
          onClick={() => build(true)}
          className="mt-2 rounded-full bg-slate-800 px-6 py-2.5 font-medium text-white shadow-lg hover:bg-slate-700"
        >
          {t('review.goAgain')}
        </button>
        <Link to="/texts" className="text-sm text-slate-500 underline">
          {t('common.done')}
        </Link>
      </div>
    );
  }

  if (!session || !curId || !cur) return <Spinner label={t('common.loading')} />;

  // Smooth progress: mastered = 1, others count got/needed.
  let partial = 0;
  for (const s of Object.values(session.states)) {
    if (!s.mastered && s.needed) partial += Math.min(s.got / s.needed, 1);
  }
  const progress = session.total ? (session.masteredCount + partial) / session.total : 0;
  const st = cardState(session, curId);

  const frontNode = (
    <span className="text-[1.5rem] font-semibold leading-snug text-slate-800">
      {cur.translation}
    </span>
  );
  const backNode = (
    <>
      <span className="text-[1.4rem] font-semibold leading-snug text-slate-900">
        {cur.corrected}
      </span>
      <span className="text-sm text-slate-700/80 line-through">{cur.original}</span>
      {cur.note && <span className="mt-1 text-xs text-slate-800/70">{cur.note}</span>}
    </>
  );

  return (
    <div className="flex h-full w-full select-none flex-col bg-slate-100 px-5 pb-5 pt-3">
      <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span>{t('review.knownCount', { n: session.masteredCount, total: session.total })}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="my-3 flex justify-center gap-2 text-xs">
        <button
          onClick={() => setMode('flip')}
          className={`rounded-full px-3 py-1 ${mode === 'flip' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
        >
          {t('review.modeFlip')}
        </button>
        <button
          onClick={() => {
            setMode('write');
            setChecked(null);
            setTyped('');
            setFlip({ id: null, on: false });
          }}
          className={`rounded-full px-3 py-1 ${mode === 'write' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
        >
          {t('review.modeWrite')}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative h-full max-h-[24rem] w-full max-w-[20rem]">
          {behind && (
            <div className="pointer-events-none absolute inset-0 -translate-y-1.5 scale-[0.95] brightness-95">
              <FlipCard
                seed={behind.id}
                front={<span className="text-[1.4rem] font-semibold text-slate-800">{behind.translation}</span>}
                back={<span />}
                flipped={false}
                flipHint={t('flip.hint')}
              />
            </div>
          )}
          <div className="absolute inset-0">
            <SwipeCard
              key={curId}
              onSwipe={(d) => handleAnswer(d === 'right')}
              onTap={() => setFlip((f) => ({ id: curId, on: !(f.id === curId && f.on) }))}
              hintYes={t('swipe.hintYes')}
              hintNo={t('swipe.hintNo')}
            >
              <FlipCard
                seed={curId}
                front={frontNode}
                back={backNode}
                flipped={topFlipped}
                flipHint={t('flip.hint')}
              />
            </SwipeCard>
          </div>
        </div>
      </div>

      {mode === 'write' && (
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkTyped()}
            placeholder={t('review.writePlaceholder')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            autoFocus
          />
          {checked === null ? (
            <button
              onClick={checkTyped}
              disabled={!typed.trim()}
              className="self-center rounded-full bg-slate-800 px-5 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {t('review.check')}
            </button>
          ) : (
            <p className="text-center text-sm">
              {checked ? (
                <span className="text-emerald-600">{t('review.correct')}</span>
              ) : (
                <span className="text-red-600">
                  ✗ <DiffText from={typed} to={cur.corrected} />
                </span>
              )}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-center gap-14">
        <button
          onClick={() => handleAnswer(false)}
          aria-label={t('review.cantDo')}
          title={t('review.cantDoTitle')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 transition active:scale-95 hover:ring-red-300"
        >
          <AiOutlineClose className="h-6 w-6 text-red-500" />
        </button>
        <button
          onClick={() => handleAnswer(true)}
          aria-label={t('review.canDo')}
          title={t('review.canDoTitle')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200 transition active:scale-95 hover:ring-emerald-300"
        >
          <AiOutlineCheck className="h-6 w-6 text-emerald-500" />
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-400">
        {st && st.needed > 1 ? t('review.needsN', { n: st.needed, got: st.got }) : ''}
        {t('review.hint')}
      </p>
    </div>
  );
}
