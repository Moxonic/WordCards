// Assembles every locale into one lookup. `en` is complete and authoritative;
// the rest are Partial and fall through to `en`, then to the raw key.

import nb, { type MsgKey } from './locales/nb';
import en from './locales/en';
import enSimple from './locales/en-simple';
import de from './locales/de';
import pl from './locales/pl';
import lt from './locales/lt';
import es from './locales/es';
import pt from './locales/pt';
import fr from './locales/fr';
import it from './locales/it';
import uk from './locales/uk';
import ru from './locales/ru';
import ar from './locales/ar';
import fa from './locales/fa';
import ti from './locales/ti';
import so from './locales/so';
import th from './locales/th';
import vi from './locales/vi';
import tr from './locales/tr';

export type { MsgKey };

type Catalog = Partial<Record<MsgKey, string>>;

export const MESSAGES: Record<string, Catalog> = {
  nb,
  en,
  'en-simple': enSimple,
  de,
  pl,
  lt,
  es,
  pt,
  fr,
  it,
  uk,
  ru,
  ar,
  fa,
  ti,
  so,
  th,
  vi,
  tr,
};

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
