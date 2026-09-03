import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { subscribeWriting, saveDraft, submitForGrading } from '../data/writings';
import { getPrompt } from '../content/prompts';
import type { Writing } from '../types';
import Spinner from '../components/Spinner';

const AUTOSAVE_MS = 1200;

function countWords(s: string): number {
  const m = s.trim().match(/\S+/g);
  return m ? m.length : 0;
}

export default function Editor() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const [writing, setWriting] = useState<Writing | null | undefined>(undefined);
  const [text, setText] = useState('');
  const [showPrompt, setShowPrompt] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<'saved' | 'saving' | null>(null);
  const seeded = useRef(false);
  const timer = useRef<number>();

  useEffect(() => {
    if (!user) return;
    return subscribeWriting(user.uid, id, (w) => {
      setWriting(w);
      if (w && !seeded.current) {
        setText(w.draft || w.text || '');
        seeded.current = true;
      }
    });
  }, [user, id]);

  // If it's already graded / grading, the editor isn't the place to be.
  useEffect(() => {
    if (writing && (writing.status === 'grading' || writing.status === 'graded')) {
      nav(`/results/${id}`, { replace: true });
    }
  }, [writing, id, nav]);

  function onChange(v: string) {
    setText(v);
    setSaved('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      if (user) {
        await saveDraft(user.uid, id, v);
        setSaved('saved');
      }
    }, AUTOSAVE_MS);
  }

  async function submit() {
    if (!user || !writing || countWords(text) < 20) return;
    setSubmitting(true);
    window.clearTimeout(timer.current);
    try {
      const token = await user.getIdToken();
      await submitForGrading(user.uid, id, text, token);
      nav(`/results/${id}`);
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  }

  if (writing === undefined) return <Spinner label="Laster…" />;
  if (writing === null)
    return <p className="p-6 text-center text-slate-500">Fant ikke teksten.</p>;

  const prompt = getPrompt(writing.promptId);
  const words = countWords(text);
  const range = prompt?.words;
  const enough = words >= 20;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="truncate text-base font-semibold text-slate-700">{writing.title}</h2>
          <button
            onClick={() => setShowPrompt((v) => !v)}
            className="shrink-0 text-xs text-slate-500 underline"
          >
            {showPrompt ? 'skjul oppgave' : 'vis oppgave'}
          </button>
        </div>
        {showPrompt && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
            {writing.promptText}
          </p>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Skriv teksten din her…"
        className="min-h-0 flex-1 resize-none bg-white p-4 text-[15px] leading-relaxed text-slate-800 outline-none"
        autoFocus
      />

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
        <span className="text-xs text-slate-400">
          {words} ord
          {range ? ` · mål ${range[0]}–${range[1]}` : ''}
          {saved === 'saved' ? ' · lagret' : saved === 'saving' ? ' · lagrer…' : ''}
        </span>
        <button
          onClick={submit}
          disabled={!enough || submitting}
          title={enough ? 'Send teksten til retting' : 'Skriv litt mer først'}
          className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-medium text-white shadow transition active:scale-95 hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Sender…' : 'Få tilbakemelding'}
        </button>
      </div>
    </div>
  );
}
