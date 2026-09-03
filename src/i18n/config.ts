// The languages the app menu can be shown in. `code` matches the mother-tongue
// codes in src/lib/lang.ts (plus `nb`, the app's original language). `native` is
// what the first-run picker shows; `english` is a fallback label.

export interface UiLang {
  code: string;
  native: string;
  english: string;
  rtl?: boolean;
}

export const UI_LANGS: UiLang[] = [
  { code: 'nb', native: 'Norsk (bokmål)', english: 'Norwegian' },
  { code: 'en', native: 'English', english: 'English' },
  { code: 'en-simple', native: 'Simple English', english: 'Simple English' },
  { code: 'de', native: 'Deutsch', english: 'German' },
  { code: 'pl', native: 'Polski', english: 'Polish' },
  { code: 'lt', native: 'Lietuvių', english: 'Lithuanian' },
  { code: 'es', native: 'Español', english: 'Spanish' },
  { code: 'pt', native: 'Português', english: 'Portuguese' },
  { code: 'fr', native: 'Français', english: 'French' },
  { code: 'it', native: 'Italiano', english: 'Italian' },
  { code: 'uk', native: 'Українська', english: 'Ukrainian' },
  { code: 'ru', native: 'Русский', english: 'Russian' },
  { code: 'ar', native: 'العربية', english: 'Arabic', rtl: true },
  { code: 'fa', native: 'فارسی', english: 'Persian / Dari', rtl: true },
  { code: 'ti', native: 'ትግርኛ', english: 'Tigrinya' },
  { code: 'so', native: 'Soomaali', english: 'Somali' },
  { code: 'th', native: 'ไทย', english: 'Thai' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'tr', native: 'Türkçe', english: 'Turkish' },
];

export const UI_LANG_CODES = UI_LANGS.map((l) => l.code);
export const DEFAULT_UI_LANG = 'nb';

export function isRtl(code: string): boolean {
  return Boolean(UI_LANGS.find((l) => l.code === code)?.rtl);
}

export function uiLangNative(code: string): string {
  return UI_LANGS.find((l) => l.code === code)?.native ?? code;
}

/** Best guess from the browser locale, used until the saved preference loads. */
export function guessUiLang(): string {
  const cands = (typeof navigator !== 'undefined' ? navigator.languages : null) ?? [
    typeof navigator !== 'undefined' ? navigator.language : '',
  ];
  for (const raw of cands) {
    if (!raw) continue;
    const lc = raw.toLowerCase();
    if (lc.startsWith('nb') || lc.startsWith('nn') || lc === 'no') return 'nb';
    const base = lc.split('-')[0];
    const hit = UI_LANG_CODES.find((c) => c === lc || c === base);
    if (hit) return hit;
  }
  return DEFAULT_UI_LANG;
}
