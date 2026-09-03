// Languages offered as "mother tongue". Codes are BCP-47-ish; the display name is
// what the AI is told to translate into and what the UI shows.

export interface Lang {
  code: string;
  label: string; // English label for the picker
  name: string; // name handed to the AI ("translate into <name>")
}

export const MOTHER_LANGS: Lang[] = [
  { code: 'en', label: 'English', name: 'English' },
  { code: 'de', label: 'German (Deutsch)', name: 'German' },
  { code: 'pl', label: 'Polish (Polski)', name: 'Polish' },
  { code: 'lt', label: 'Lithuanian (Lietuvių)', name: 'Lithuanian' },
  { code: 'es', label: 'Spanish (Español)', name: 'Spanish' },
  { code: 'pt', label: 'Portuguese (Português)', name: 'Portuguese' },
  { code: 'fr', label: 'French (Français)', name: 'French' },
  { code: 'it', label: 'Italian (Italiano)', name: 'Italian' },
  { code: 'uk', label: 'Ukrainian (Українська)', name: 'Ukrainian' },
  { code: 'ru', label: 'Russian (Русский)', name: 'Russian' },
  { code: 'ar', label: 'Arabic (العربية)', name: 'Arabic' },
  { code: 'fa', label: 'Persian / Dari (فارسی)', name: 'Persian' },
  { code: 'ti', label: 'Tigrinya (ትግርኛ)', name: 'Tigrinya' },
  { code: 'so', label: 'Somali (Soomaali)', name: 'Somali' },
  { code: 'th', label: 'Thai (ไทย)', name: 'Thai' },
  { code: 'vi', label: 'Vietnamese (Tiếng Việt)', name: 'Vietnamese' },
  { code: 'tr', label: 'Turkish (Türkçe)', name: 'Turkish' },
  { code: 'en-simple', label: 'Simple English', name: 'simple, plain English' },
];

export const TARGET_LANGS: (Lang & { available: boolean })[] = [
  { code: 'nb', label: 'Norsk (bokmål)', name: 'Norwegian Bokmål', available: true },
  { code: 'nn', label: 'Norsk (nynorsk)', name: 'Norwegian Nynorsk', available: false },
];

export function motherLangName(code: string): string {
  return MOTHER_LANGS.find((l) => l.code === code)?.name ?? code;
}

export function motherLangLabel(code: string): string {
  return MOTHER_LANGS.find((l) => l.code === code)?.label ?? code;
}

export function targetLangName(code: string): string {
  return TARGET_LANGS.find((l) => l.code === code)?.name ?? code;
}
