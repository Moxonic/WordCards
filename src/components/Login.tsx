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
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-white to-slate-200 px-8 py-10 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Emenda</h1>
        <p className="mt-1 text-sm text-slate-500">
          Practise writing in a new language and learn from every mistake.
        </p>
      </div>

      <ol className="flex max-w-xs flex-col gap-3 text-left text-sm text-slate-600">
        {STEPS.map(([name, rest], i) => (
          <li key={name} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
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
        className="mt-1 flex items-center gap-3 rounded-full bg-white px-6 py-3 font-medium text-slate-800 shadow-lg ring-1 ring-slate-200 transition active:scale-95 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
