import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { createWriting, getWriting } from '../data/writings';
import { MOTHER_LANGS, TARGET_LANGS } from '../lib/lang';
import { PROMPTS, getPrompt, type Prompt } from '../content/prompts';

const OWN = '__own__';

export default function NewWriting() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const attemptOf = params.get('attemptOf') ?? undefined;

  const [targetLang, setTargetLang] = useState('nb');
  const [motherLang, setMotherLang] = useState(lang === 'nb' ? 'en' : lang);
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

  const promptText = promptChoice === OWN ? ownPrompt.trim() : (selectedPrompt?.no ?? '');
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
      setError(t('new.createError'));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <h2 className="text-lg font-semibold text-slate-700">
        {attemptOf ? t('new.titleRetry') : t('new.title')}
      </h2>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        {t('new.targetLang')}
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          {TARGET_LANGS.map((l) => (
            <option key={l.code} value={l.code} disabled={!l.available}>
              {l.label}
              {l.available ? '' : t('new.comingSoon')}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        {t('new.motherLang')}
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
        {t('new.textTitle')}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('new.textTitlePlaceholder')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-600">
        {t('new.task')}
        <select
          value={promptChoice}
          onChange={(e) => setPromptChoice(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
        >
          <optgroup label={t('new.taskEmail')}>
            {PROMPTS.filter((p) => p.kind === 'epost').map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </optgroup>
          <optgroup label={t('new.taskEssay')}>
            {PROMPTS.filter((p) => p.kind === 'drofting').map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </optgroup>
          <option value={OWN}>{t('new.ownTask')}</option>
        </select>
      </label>

      {promptChoice === OWN ? (
        <textarea
          value={ownPrompt}
          onChange={(e) => setOwnPrompt(e.target.value)}
          placeholder={t('new.ownTaskPlaceholder')}
          rows={3}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      ) : (
        <div className="rounded-lg bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-200">
          <p>{selectedPrompt?.no}</p>
          {selectedPrompt && lang !== 'nb' && (
            <p className="mt-1 text-xs italic text-slate-400">{selectedPrompt.en}</p>
          )}
          {selectedPrompt && (
            <p className="mt-2 text-xs text-slate-400">
              {t('new.recommendedLength', {
                min: selectedPrompt.words[0],
                max: selectedPrompt.words[1],
              })}
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
        {busy ? t('new.creating') : t('new.start')}
      </button>
    </div>
  );
}
