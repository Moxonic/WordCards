import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { signInWithGoogle, configured, error } = useAuth();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-gradient-to-b from-white to-slate-200 px-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">Skrivetrening B2</h1>
      <p className="max-w-xs text-sm text-slate-500">
        Skriv en tekst på norsk, få tilbakemelding fra en AI-lærer, og repeter feilene
        dine med flippkort.
      </p>

      <button
        onClick={signInWithGoogle}
        disabled={!configured}
        title="Logg inn med Google-kontoen din"
        className="mt-1 flex items-center gap-3 rounded-full bg-white px-6 py-3 font-medium text-slate-800 shadow-lg ring-1 ring-slate-200 transition active:scale-95 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FcGoogle className="h-5 w-5" />
        Logg inn med Google
      </button>

      {!configured && (
        <p className="max-w-xs text-sm text-red-700">
          Firebase er ikke satt opp ennå. Kopier <code>.env.example</code> til{' '}
          <code>.env</code>, fyll inn <code>VITE_FIREBASE_*</code> og start dev-serveren
          på nytt.
        </p>
      )}
      {error && (
        <p className="max-w-xs text-sm text-red-700">Innlogging feilet: {error.message}</p>
      )}
    </div>
  );
}
