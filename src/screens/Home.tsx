import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit3, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import { subscribeWritings } from '../data/writings';
import type { Writing } from '../types';

export default function Home() {
  const { user } = useAuth();
  const [writings, setWritings] = useState<Writing[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeWritings(user.uid, setWritings);
  }, [user]);

  const reviewable = (writings ?? []).filter((w) => w.status === 'graded' && w.mistakeCount > 0);
  const canReview = reviewable.length > 0;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10">
      <h1 className="mb-2 text-center text-xl font-semibold text-slate-700">
        Hva vil du gjøre?
      </h1>

      <Link
        to="/new"
        className="flex w-full max-w-sm items-center gap-4 rounded-2xl bg-slate-800 px-5 py-5 text-white shadow-lg transition active:scale-[0.98] hover:bg-slate-700"
      >
        <FiEdit3 className="h-7 w-7 shrink-0" />
        <span>
          <span className="block text-lg font-semibold">Skriv ny tekst</span>
          <span className="block text-sm text-slate-300">
            E-post eller drøftingstekst, med retting og tilbakemelding
          </span>
        </span>
      </Link>

      <Link
        to={canReview ? '/texts' : '#'}
        aria-disabled={!canReview}
        onClick={(e) => !canReview && e.preventDefault()}
        className={`flex w-full max-w-sm items-center gap-4 rounded-2xl px-5 py-5 shadow-lg transition ${
          canReview
            ? 'bg-white text-slate-800 active:scale-[0.98] hover:bg-slate-50 ring-1 ring-slate-200'
            : 'cursor-not-allowed bg-white/60 text-slate-400 ring-1 ring-slate-200'
        }`}
      >
        <FiRefreshCw className="h-7 w-7 shrink-0" />
        <span>
          <span className="block text-lg font-semibold">Repeter en tekst</span>
          <span className="block text-sm">
            {canReview
              ? `${reviewable.length} tekst${reviewable.length === 1 ? '' : 'er'} klar til repetisjon`
              : 'Blir tilgjengelig når du har fått rettet en tekst'}
          </span>
        </span>
      </Link>
    </div>
  );
}
