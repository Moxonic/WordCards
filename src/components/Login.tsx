import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../auth/AuthContext';
import { useT } from '../i18n';

export default function Login() {
  const { signInWithGoogle, configured, error } = useAuth();
  const t = useT();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-gradient-to-b from-white to-slate-200 px-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">Skrivetrening B2</h1>
      <p className="max-w-xs text-sm text-slate-500">{t('login.tagline')}</p>

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
