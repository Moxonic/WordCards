import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { signInWithGoogle, configured, error } = useAuth();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-200 gap-5 px-8 text-center">
      <div className="flex gap-2 mb-2">
        {['hsl(20 78% 80%)', 'hsl(150 64% 72%)', 'hsl(260 70% 82%)'].map((c, i) => (
          <span
            key={i}
            className="w-10 h-14 rounded-xl shadow-md rotate-[-6deg]"
            style={{ background: c, transform: `rotate(${(i - 1) * 8}deg)` }}
          />
        ))}
      </div>

      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">WordCards</h1>
      <p className="text-slate-500 max-w-xs text-sm">
        Sign in to sync your vocabulary and drill it with a swipe.
      </p>

      <button
        onClick={signInWithGoogle}
        disabled={!configured}
        title="Sign in with your Google account to sync your cards"
        className="mt-1 flex items-center gap-3 bg-white text-slate-800 font-medium rounded-full px-6 py-3 shadow-lg ring-1 ring-slate-200 hover:bg-slate-50 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FcGoogle className="h-5 w-5" />
        Sign in with Google
      </button>

      {!configured && (
        <p className="text-red-700 text-sm max-w-xs">
          Firebase isn&apos;t configured yet. Copy <code>.env.example</code> to{' '}
          <code>.env</code>, fill in your project keys, and restart the dev server.
          See <code>SETUP.md</code>.
        </p>
      )}
      {error && (
        <p className="text-red-700 text-sm max-w-xs">Sign-in failed: {error.message}</p>
      )}
    </div>
  );
}

export default Login;
