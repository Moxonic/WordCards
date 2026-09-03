import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { subscribeWritings } from '../data/writings';
import type { Writing } from '../types';
import Spinner from '../components/Spinner';

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusLabel(w: Writing): string {
  if (w.status === 'graded') return w.grade?.cefr ?? 'Rettet';
  if (w.status === 'grading') return 'Rettes…';
  if (w.status === 'error') return 'Feil';
  return 'Kladd';
}

export default function TextsList() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [writings, setWritings] = useState<Writing[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeWritings(user.uid, setWritings);
  }, [user]);

  if (writings === null) return <Spinner label="Laster…" />;

  if (writings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center text-slate-500">
        <p>Du har ikke skrevet noen tekster ennå.</p>
        <Link
          to="/new"
          className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-medium text-white"
        >
          Skriv din første tekst
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h2 className="px-1 text-lg font-semibold text-slate-700">Mine tekster</h2>
      {writings.map((w) => (
        <div key={w.id} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-700">{w.title}</p>
              <p className="text-xs text-slate-400">
                {fmtDate(w.createdAt)} · {statusLabel(w)}
                {w.status === 'graded' ? ` · ${w.mistakeCount} feil` : ''}
                {w.attemptOf ? ' · nytt forsøk' : ''}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {w.status === 'graded' && (
              <Link
                to={`/results/${w.id}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-200"
              >
                Se tilbakemelding
              </Link>
            )}
            {w.status === 'graded' && w.mistakeCount > 0 && (
              <Link
                to={`/review/${w.id}`}
                className="rounded-full bg-slate-800 px-3 py-1 text-white hover:bg-slate-700"
              >
                Repeter feil
              </Link>
            )}
            {(w.status === 'draft' || w.status === 'error') && (
              <Link
                to={`/write/${w.id}`}
                className="rounded-full bg-slate-800 px-3 py-1 text-white hover:bg-slate-700"
              >
                Fortsett å skrive
              </Link>
            )}
            {w.status === 'grading' && (
              <Link
                to={`/results/${w.id}`}
                className="rounded-full bg-slate-100 px-3 py-1 text-slate-600"
              >
                Følg med
              </Link>
            )}
            <button
              onClick={() => nav(`/new?attemptOf=${w.id}`)}
              className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-200"
            >
              Prøv på nytt
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
