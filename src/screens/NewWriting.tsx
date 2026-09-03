import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { createWriting, getWriting } from '../data/writings';
import { MOTHER_LANGS, TARGET_LANGS } from '../lib/lang';
import { PROMPTS, getPrompt, type Prompt } from '../content/prompts';

const OWN = '__own__';

export default function NewWriting() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const attemptOf = params.get('attemptOf') ?? undefined;

  const [targetLang, setTargetLang] = useState('nb');
  const [motherLang, setMotherLang] = useState('en');
  const [title, setTitle] = useState('');
  const [promptChoice, setPromptChoice] = useState<string>(PROMPTS[0].id);
  const [ownPrompt, setOwnPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPrompt: Prompt | undefined = useMemo(
    () => (promptChoice === OWN ? undefined : getPrompt(promptChoice)),
    [promptChoice],
  );

  // Prefill from the task being re-attempted (blank editor, same setup).
  useEffect(() => {
    if (!attemptOf || !user) return;
    let cancelled = false;
    getWriting(user.uid, attemptOf).then((w) => {
      if (!w || cancelled) return;
      setMotherLang(w.motherLang);
      setTargetLang(w.targetLang);
      setTitle(w.title);
      if (w.promptId && getPrompt(w.promptId)) {
        setPromptChoice(w.promptId);
      } else if (w.promptText) {
        setPromptChoice(OWN);
        setOwnPrompt(w.promptText);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [attemptOf, user]);

  const promptText =
    promptChoice === OWN ? ownPrompt.trim() : (selectedPrompt?.no ?? '');
  const canStart = Boolean(title.trim()) && Boolean(promptText);

  async function start() {
    if (!user || !canStart) return;
    setBusy(true);
    setError(null);
    try {
      const id = await createWriting(user.uid, {
        title,
        targetLang,
        motherLang,
        promptId: promptChoice === OWN ? undefined : promptChoice,
        promptText,
        attemptOf,
      });
      nav(`/write/${id}`);
    } catch (e) {
      console.error(e);
      setError('Kunne ikke opprette teksten. Prøv igjen.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <h2 className="text-lg font-semibold text-slate-700">
        {attemptOf ? 'Prøv oppgaven på nytt' : 'Ny tekst'}
      </h2>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Skrivespråk
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          {TARGET_LANGS.map((l) => (
            <option key={l.code} value={l.code} disabled={!l.available}>
              {l.label}
              {l.available ? '' : ' (kommer)'}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Morsmål (feilene oversettes til dette)
        <select
          value={motherLang}
          onChange={(e) => setMotherLang(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          {MOTHER_LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Tittel
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="F.eks. «E-post om flytting»"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Oppgave
        <select
          value={promptChoice}
          onChange={(e) => setPromptChoice(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <optgroup label="E-post">
            {PROMPTS.filter((p) => p.kind === 'epost').map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="Drøftingstekst">
            {PROMPTS.filter((p) => p.kind === 'drofting').map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </optgroup>
          <option value={OWN}>Skriv min egen oppgave…</option>
        </select>
      </label>

      {promptChoice === OWN ? (
        <textarea
          value={ownPrompt}
          onChange={(e) => setOwnPrompt(e.target.value)}
          placeholder="Skriv oppgaveteksten her."
          rows={3}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      ) : (
        <div className="rounded-lg bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-200">
          <p>{selectedPrompt?.no}</p>
          {selectedPrompt && (
            <p className="mt-2 text-xs text-slate-400">
              Anbefalt lengde: {selectedPrompt.words[0]}–{selectedPrompt.words[1]} ord
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        onClick={start}
        disabled={!canStart || busy}
        className="rounded-full bg-slate-800 px-6 py-3 font-medium text-white shadow-lg transition active:scale-95 hover:bg-slate-700 disabled:opacity-50"
      >
        {busy ? 'Oppretter…' : 'Begynn å skrive'}
      </button>
    </div>
  );
}
