import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../auth/AuthContext';
import { useT } from '../i18n';

// The concept pitch is intentionally always in English, whatever the browser
// language — it's the one place a first-time visitor meets the app.
const STEPS: [string, string][] = [
  ['Write', 'a short email or discussion essay in Norwegian, English, Spanish or German.'],
  [
    'Get feedback',
    'an AI teacher estimates your CEFR level, comments on content, grammar, vocabulary and spelling, and rewrites your text correctly.',
  ],
  [
    'Review',
    'every correction becomes a flashcard you drill with spaced repetition. Retry the task whenever you like.',
  ],
];

export default function Login() {
  const { signInWithGoogle, configured, error } = useAuth();
  const t = useT();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-9 bg-slate-50 px-9 py-12 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-medium uppercase tracking-[0.32em] text-slate-800">Emenda</h1>
        <span className="h-px w-10 bg-slate-300" />
        <p className="max-w-xs text-sm leading-relaxed text-slate-500">
          Practise writing in a new language and learn from every mistake.
        </p>
      </div>

      <ol className="flex max-w-xs flex-col gap-4 text-left text-sm leading-relaxed text-slate-600">
        {STEPS.map(([name, rest], i) => (
          <li key={name} className="flex gap-3">
            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center border border-slate-300 text-[11px] font-medium text-slate-500">
              {i + 1}
            </span>
            <span>
              <span className="font-semibold text-slate-800">{name}</span> — {rest}
            </span>
          </li>
        ))}
      </ol>

      <button
        onClick={signInWithGoogle}
        disabled={!configured}
        title={t('login.googleTitle')}
        className="flex items-center gap-3 rounded-none border border-slate-300 bg-white px-6 py-3 font-medium text-slate-800 shadow-sm transition active:scale-[0.98] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FcGoogle className="h-5 w-5" />
        {t('login.google')}
      </button>

      {!configured && <p className="max-w-xs text-sm text-red-700">{t('login.notConfigured')}</p>}
      {error && (
        <p className="max-w-xs text-sm text-red-700">{t('login.failed', { message: error.message })}</p>
      )}
    </div>
  );
}
