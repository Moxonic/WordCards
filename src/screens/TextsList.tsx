import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n, type MsgKey } from '../i18n';
import { subscribeWritings } from '../data/writings';
import type { Writing } from '../types';
import Spinner from '../components/Spinner';

const DATE_LOCALE: Record<string, string> = { nb: 'nb-NO' };

function fmtDate(ms: number, lang: string): string {
  const locale = DATE_LOCALE[lang] ?? lang;
  try {
    return new Date(ms).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return new Date(ms).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

const STATUS_KEY: Record<Writing['status'], MsgKey> = {
  graded: 'texts.status.graded',
  grading: 'texts.status.grading',
  error: 'texts.status.error',
  draft: 'texts.status.draft',
};

export default function TextsList() {
  const { user } = useAuth();
  const { lang, t, tp } = useI18n();
  const nav = useNavigate();
  const [writings, setWritings] = useState<Writing[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeWritings(user.uid, setWritings);
  }, [user]);

  function statusLabel(w: Writing): string {
    if (w.status === 'graded') return w.grade?.cefr ?? t('texts.status.graded');
    return t(STATUS_KEY[w.status]);
  }

  if (writings === null) return <Spinner label={t('common.loading')} />;

  if (writings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center text-slate-500">
        <p>{t('texts.empty')}</p>
        <Link
          to="/new"
          className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-medium text-white"
        >
          {t('texts.writeFirst')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="px-1 text-lg font-semibold text-slate-700">{t('texts.heading')}</h2>
      {writings.map((w) => (
        <div key={w.id} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-700">{w.title}</p>
              <p className="text-xs text-slate-400">
                {fmtDate(w.createdAt, lang)} · {statusLabel(w)}
                {w.status === 'graded' ? ` · ${tp('texts.nMistakes', w.mistakeCount)}` : ''}
                {w.attemptOf ? ` · ${t('texts.newAttempt')}` : ''}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {w.status === 'graded' && (
              <Link
                to={`/results/${w.id}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-200"
              >
                {t('texts.seeFeedback')}
              </Link>
            )}
            {w.status === 'graded' && w.mistakeCount > 0 && (
              <Link
                to={`/review/${w.id}`}
                className="rounded-full bg-slate-800 px-3 py-1 text-white hover:bg-slate-700"
              >
                {t('texts.reviewMistakes')}
              </Link>
            )}
            {(w.status === 'draft' || w.status === 'error') && (
              <Link
                to={`/write/${w.id}`}
                className="rounded-full bg-slate-800 px-3 py-1 text-white hover:bg-slate-700"
              >
                {t('texts.keepWriting')}
              </Link>
            )}
            {w.status === 'grading' && (
              <Link
                to={`/results/${w.id}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-slate-600"
              >
                {t('texts.follow')}
              </Link>
            )}
            <button
              onClick={() => nav(`/new?attemptOf=${w.id}`)}
              className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-200"
            >
              {t('texts.tryAgain')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
