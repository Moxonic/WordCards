import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { I18nProvider } from './i18n';
import { guessUiLang } from './i18n/config';
import { translate } from './i18n/messages';
import { subscribePrefs, saveUiLang, type Prefs } from './data/prefs';
import Shell from './components/Shell';
import Login from './components/Login';
import LangGate from './components/LangGate';
import Spinner from './components/Spinner';
import Home from './screens/Home';
import NewWriting from './screens/NewWriting';
import Editor from './screens/Editor';
import Results from './screens/Results';
import TextsList from './screens/TextsList';
import Review from './screens/Review';

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full justify-center bg-slate-200">
      <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-slate-50 ring-1 ring-slate-200">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  // Before sign-in there is no account to read a preference from, so the menu
  // language lives here: guessed from the browser, overridable with the flags on
  // the login screen.
  const [preLang, setPreLang] = useState(guessUiLang);
  const [langChosen, setLangChosen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs | undefined>(undefined);
  const [savingLang, setSavingLang] = useState(false);

  const pickLang = useCallback((code: string) => {
    setPreLang(code);
    setLangChosen(true);
  }, []);

  useEffect(() => {
    if (!user) {
      setPrefs(undefined);
      return;
    }
    return subscribePrefs(user.uid, setPrefs);
  }, [user]);

  // Picked a flag before signing in? Keep it, and skip the language gate.
  useEffect(() => {
    if (!user || !prefs || prefs.uiLang || !langChosen) return;
    saveUiLang(user.uid, preLang).catch((e) =>
      console.error('[remenda] saving the menu language failed', e),
    );
  }, [user, prefs, langChosen, preLang]);

  const loadingView = (
    <I18nProvider lang={preLang}>
      <Frame>
        <div className="flex h-full items-center justify-center">
          <Spinner label={translate(preLang, 'common.loading')} />
        </div>
      </Frame>
    </I18nProvider>
  );

  if (loading) return loadingView;

  if (!user) {
    return (
      <I18nProvider lang={preLang}>
        <Frame>
          <Login lang={preLang} onPickLang={pickLang} />
        </Frame>
      </I18nProvider>
    );
  }

  if (prefs === undefined) return loadingView;

  // First sign-in and no language chosen on the way in: ask.
  if (!prefs.uiLang) {
    if (langChosen) return loadingView; // the effect above is persisting it
    return (
      <I18nProvider lang={preLang}>
        <Frame>
          <LangGate
            guessed={preLang}
            busy={savingLang}
            onPick={async (code) => {
              setSavingLang(true);
              try {
                await saveUiLang(user.uid, code);
              } finally {
                setSavingLang(false);
              }
            }}
          />
        </Frame>
      </I18nProvider>
    );
  }

  return (
    <I18nProvider lang={prefs.uiLang}>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<NewWriting />} />
            <Route path="/write/:id" element={<Editor />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/texts" element={<TextsList />} />
            <Route path="/review/:writingId" element={<Review />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
