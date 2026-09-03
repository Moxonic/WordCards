import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { subscribeWriting } from '../data/writings';
import type { Writing } from '../types';
import Spinner from '../components/Spinner';
import DiffText from '../components/DiffText';

const CAT_LABELS: Record<string, string> = {
  content: 'Innhold',
  grammar: 'Grammatikk',
  vocabulary: 'Ordforråd',
  spelling: 'Rettskriving',
};

export default function Results() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [writing, setWriting] = useState<Writing | null | undefined>(undefined);
  const [view, setView] = useState<'corrected' | 'yours'>('corrected');

  useEffect(() => {
    if (!user) return;
    return subscribeWriting(user.uid, id, setWriting);
  }, [user, id]);

  if (writing === undefined) return <Spinner label="Laster…" />;
  if (writing === null)
    return <p className="p-6 text-center text-slate-500">Fant ikke teksten.</p>;

  if (writing.status === 'grading') {
    return (
      <div className="p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-700">{writing.title}</h2>
        <Spinner label="Læreren leser teksten din… dette tar et halvt minutt." />
      </div>
    );
  }

  if (writing.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-slate-700">{writing.errorMessage || 'Noe gikk galt under rettingen.'}</p>
        <Link
          to={`/write/${id}`}
          className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-medium text-white"
        >
          Tilbake til teksten
        </Link>
      </div>
    );
  }

  if (writing.status === 'draft' || !writing.grade) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center text-slate-500">
        <p>Denne teksten er ikke sendt til retting ennå.</p>
        <Link
          to={`/write/${id}`}
          className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-medium text-white"
        >
          Åpne i skriveren
        </Link>
      </div>
    );
  }

  const g = writing.grade;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-700">{writing.title}</h2>
        <p className="text-xs text-slate-400">Vurdert av AI-lærer</p>
      </div>

      <div className="rounded-2xl bg-slate-800 p-5 text-center text-white shadow-lg">
        <p className="text-xs uppercase tracking-widest text-slate-400">Estimert nivå</p>
        <p className="text-3xl font-bold">{g.cefr}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(CAT_LABELS) as (keyof typeof g.categories)[]).map((k) => (
          <div key={k} className="rounded-xl bg-white p-3 text-sm ring-1 ring-slate-200">
            <span className="font-semibold text-slate-700">{CAT_LABELS[k]}: </span>
            <span className="text-slate-600">{g.categories[k]}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
        <p className="mb-1 text-sm font-semibold text-emerald-800">Dette gjorde du bra</p>
        <ul className="list-disc pl-5 text-sm text-emerald-900">
          {g.positives.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
        <p className="mb-1 text-sm font-semibold text-amber-800">Sjekk dette</p>
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
            className={`rounded-full px-3 py-1 ${
              view === 'corrected' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Rettet
          </button>
          <button
            onClick={() => setView('yours')}
            className={`rounded-full px-3 py-1 ${
              view === 'yours' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Din tekst
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
            className="rounded-full bg-slate-800 px-5 py-3 text-center font-medium text-white shadow-lg active:scale-95 hover:bg-slate-700"
          >
            Repeter {writing.mistakeCount} feil →
          </Link>
        ) : (
          <p className="text-center text-sm text-slate-500">Ingen feil å repetere. Bra jobba!</p>
        )}
        <button
          onClick={() => nav(`/new?attemptOf=${id}`)}
          className="rounded-full bg-white px-5 py-3 text-center font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Prøv oppgaven på nytt
        </button>
      </div>
    </div>
  );
}
