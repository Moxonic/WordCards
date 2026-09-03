import { useState } from 'react';
import { UI_LANGS } from '../i18n/config';
import { translate } from '../i18n/messages';

// Shown once, right after the first sign-in, before any menu language is known.
// The heading is rendered in the browser-guessed language; each option shows its
// own native name so it's recognisable whatever the guess was.
export default function LangGate({
  guessed,
  busy,
  onPick,
}: {
  guessed: string;
  busy?: boolean;
  onPick: (code: string) => void;
}) {
  const [sel, setSel] = useState(guessed);

  return (
    <div className="flex h-full w-full flex-col bg-slate-50">
      <div className="px-6 pb-4 pt-10 text-center">
        <h1 className="text-lg font-medium tracking-wide text-slate-800">
          {translate(sel, 'langGate.title')}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
          {translate(sel, 'langGate.subtitle')}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <ul className="mx-auto flex max-w-sm flex-col py-2">
          {UI_LANGS.map((l) => (
            <li key={l.code}>
              <button
                onClick={() => setSel(l.code)}
                dir={l.rtl ? 'rtl' : 'ltr'}
                className={`flex w-full items-center justify-between border-b border-slate-200 px-4 py-3.5 text-left transition ${
                  sel === l.code
                    ? 'bg-slate-800 text-white'
                    : 'bg-transparent text-slate-700 hover:bg-white'
                }`}
              >
                <span className="text-base font-medium">{l.native}</span>
                <span className={`text-xs ${sel === l.code ? 'text-slate-300' : 'text-slate-400'}`}>
                  {l.english}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-200 bg-white px-6 py-4">
        <button
          onClick={() => onPick(sel)}
          disabled={busy}
          className="w-full rounded-none bg-slate-800 px-6 py-3 font-medium tracking-wide text-white transition active:scale-[0.99] hover:bg-slate-700 disabled:opacity-50"
        >
          {translate(sel, busy ? 'common.sending' : 'langGate.save')}
        </button>
      </div>
    </div>
  );
}
