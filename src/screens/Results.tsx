import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n, type MsgKey } from '../i18n';
import { subscribeWriting, retryGrading, markWritingError } from '../data/writings';
import type { Writing } from '../types';
import Spinner from '../components/Spinner';
import DiffText from '../components/DiffText';

const CAT_KEYS: Record<string, MsgKey> = {
  content: 'results.cat.content',
  grammar: 'results.cat.grammar',
  vocabulary: 'results.cat.vocabulary',
  spelling: 'results.cat.spelling',
};

export default function Results() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { t, tp } = useI18n();
  const nav = useNavigate();
  const [writing, setWriting] = useState<Writing | null | undefined>(undefined);
  const [view, setView] = useState<'corrected' | 'yours'>('corrected');
  const [slow, setSlow] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const graceStart = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeWriting(user.uid, id, setWriting);
  }, [user, id]);

  // Watchdog: if grading hasn't finished after 2 min, stop waiting so the user
  // isn't stuck on a spinner forever (e.g. the function never ran).
  useEffect(() => {
    if (writing?.status !== 'grading') {
      graceStart.current = null;
      setSlow(false);
      return;
    }
    if (graceStart.current == null) graceStart.current = Date.now();
    const softId = window.setTimeout(() => setSlow(true), 25_000);
    const hardId = window.setTimeout(() => {
      if (user) markWritingError(user.uid, id, t('results.watchdogError'));
    }, 120_000);
    return () => {
      window.clearTimeout(softId);
      window.clearTimeout(hardId);
    };
  }, [writing?.status, user, id, t]);

  async function doRetry() {
    if (!user) return;
    setRetrying(true);
    try {
      await retryGrading(user.uid, id, await user.getIdToken());
    } finally {
      setRetrying(false);
    }
  }

  if (writing === undefined) return <Spinner label={t('common.loading')} />;
  if (writing === null)
    return <p className="p-6 text-center text-slate-500">{t('common.notFound')}</p>;

  if (writing.status === 'grading') {
    return (
      <div className="flex flex-col items-center p-6 text-center">
        <h2 className="mb-1 text-lg font-semibold text-slate-700">{writing.title}</h2>
        <Spinner label={t('results.gradingTitle')} />
        {slow && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500">{t('results.tooLong')}</p>
            <div className="flex gap-2">
              <button
                onClick={doRetry}
                disabled={retrying}
                className="rounded-none bg-slate-800 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {retrying ? t('common.sending') : t('common.retry')}
              </button>
              <button
                onClick={() =>
                  user &&
                  markWritingError(user.uid, id, t('results.cancelled')).then(() =>
                    nav(`/write/${id}`),
                  )
                }
                className="rounded-none bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200"
              >
                {t('common.cancel')}
              </button>
            </div>
            <p className="mt-1 max-w-xs text-xs text-slate-400">{t('results.devHint')}</p>
          </div>
        )}
      </div>
    );
  }

  if (writing.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-slate-700">{writing.errorMessage || t('results.genericError')}</p>
        <div className="flex gap-2">
          <button
            onClick={doRetry}
            disabled={retrying}
            className="rounded-none bg-slate-800 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {retrying ? t('common.sending') : t('common.retry')}
          </button>
          <Link
            to={`/write/${id}`}
            className="rounded-none bg-white px-5 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200"
          >
            {t('results.backToText')}
          </Link>
        </div>
      </div>
    );
  }

  if (writing.status === 'draft' || !writing.grade) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center text-slate-500">
        <p>{t('results.notSubmitted')}</p>
        <Link
          to={`/write/${id}`}
          className="rounded-none bg-slate-800 px-5 py-2.5 text-sm font-medium text-white"
        >
          {t('results.openInEditor')}
        </Link>
      </div>
    );
  }

  const g = writing.grade;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-700">{writing.title}</h2>
        <p className="text-xs text-slate-400">{t('results.subtitle')}</p>
      </div>

      <div className="rounded-2xl bg-slate-800 p-5 text-center text-white shadow-lg">
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {t('results.estimatedLevel')}
        </p>
        <p className="text-3xl font-bold">{g.cefr}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(CAT_KEYS) as (keyof typeof g.categories)[]).map((k) => (
          <div key={k} className="rounded-xl bg-white p-3 text-sm ring-1 ring-slate-200">
            <span className="font-semibold text-slate-700">{t(CAT_KEYS[k])}: </span>
            <span className="text-slate-600">{g.categories[k]}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
        <p className="mb-1 text-sm font-semibold text-emerald-800">{t('results.didWell')}</p>
        <ul className="list-disc pl-5 text-sm text-emerald-900">
          {g.positives.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
        <p className="mb-1 text-sm font-semibold text-amber-800">{t('results.checkThis')}</p>
        <ul className="list-disc pl-5 text-sm text-amber-900">
          {g.improve.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
        <div className="mb-2 flex gap-2 text-xs">
          <button
            onClick={() => setView('corrected')}
            className={`rounded-none px-3 py-1 ${
              view === 'corrected' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t('results.viewCorrected')}
          </button>
          <button
            onClick={() => setView('yours')}
            className={`rounded-none px-3 py-1 ${
              view === 'yours' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {t('results.viewYours')}
          </button>
        </div>
        {view === 'corrected' ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            <DiffText from={writing.text} to={g.correctedText} />
          </p>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {writing.text}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {writing.mistakeCount > 0 ? (
          <Link
            to={`/review/${id}`}
            className="rounded-none bg-slate-800 px-5 py-3 text-center font-medium text-white shadow-lg active:scale-95 hover:bg-slate-700"
          >
            {tp('results.reviewN', writing.mistakeCount)}
          </Link>
        ) : (
          <p className="text-center text-sm text-slate-500">{t('results.noMistakes')}</p>
        )}
        <button
          onClick={() => nav(`/new?attemptOf=${id}`)}
          className="rounded-none bg-white px-5 py-3 text-center font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {t('results.tryAgain')}
        </button>
      </div>
    </div>
  );
}
