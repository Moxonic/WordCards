// Assembles every locale into one lookup. `en` is complete and authoritative;
// `es` and `de` are Partial and fall through to `en`, then to the raw key.

import nb, { type MsgKey } from './locales/nb';
import en from './locales/en';
import es from './locales/es';
import de from './locales/de';

export type { MsgKey };

type Catalog = Partial<Record<MsgKey, string>>;

export const MESSAGES: Record<string, Catalog> = { nb, en, es, de };

export const FALLBACK_LANG = 'en';

type Vars = Record<string, string | number>;

function interpolate(tpl: string, vars?: Vars): string {
  if (!vars) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Resolve one key for a language, falling back to English then the key itself. */
export function translate(lang: string, key: MsgKey, vars?: Vars): string {
  const raw =
    MESSAGES[lang]?.[key] ?? MESSAGES[FALLBACK_LANG]?.[key] ?? MESSAGES.nb[key] ?? key;
  return interpolate(raw, vars);
}

/** Pick the _one / _other variant by count, then resolve like translate(). */
export function translatePlural(
  lang: string,
  baseKey: string,
  count: number,
  vars?: Vars,
): string {
  const key = `${baseKey}_${count === 1 ? 'one' : 'other'}` as MsgKey;
  return translate(lang, key, { count, n: count, ...vars });
}
