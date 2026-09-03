// Languages offered as "mother tongue". Codes are BCP-47-ish; the display name is
// what the AI is told to translate into and what the UI shows.

export interface Lang {
  code: string;
  label: string; // English label for the picker
  name: string; // name handed to the AI ("translate into <name>")
}

export const MOTHER_LANGS: Lang[] = [
  { code: 'en', label: 'English', name: 'English' },
  { code: 'es', label: 'Español', name: 'Spanish' },
  { code: 'de', label: 'Deutsch', name: 'German' },
  { code: 'nb', label: 'Norsk (bokmål)', name: 'Norwegian Bokmål' },
];

export const TARGET_LANGS: (Lang & { available: boolean })[] = [
  { code: 'nb', label: 'Norsk (bokmål)', name: 'Norwegian Bokmål', available: true },
  { code: 'en', label: 'English', name: 'English', available: true },
  { code: 'es', label: 'Español', name: 'Spanish', available: true },
  { code: 'de', label: 'Deutsch', name: 'German', available: true },
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
