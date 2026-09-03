import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { translate, translatePlural, type MsgKey } from './messages';
import { DEFAULT_UI_LANG, isRtl } from './config';

type Vars = Record<string, string | number>;

interface I18nValue {
  lang: string;
  t: (key: MsgKey, vars?: Vars) => string;
  tp: (baseKey: string, count: number, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: DEFAULT_UI_LANG,
  t: (k) => k,
  tp: (k) => k,
});

export function I18nProvider({ lang, children }: { lang: string; children: ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({
      lang,
      t: (key, vars) => translate(lang, key, vars),
      tp: (baseKey, count, vars) => translatePlural(lang, baseKey, count, vars),
    }),
    [lang],
  );

  // Reflect the language on <html> so the browser and CSS know direction/lang.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** Shorthand: const t = useT(); t('home.heading'). */
export function useT() {
  return useContext(I18nContext).t;
}

export { UI_LANGS, uiLangNative, guessUiLang } from './config';
export type { MsgKey };
