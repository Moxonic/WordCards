import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// One small per-user settings doc.
//
//  * `motherLang` is the language you speak — chosen with the flags on the login
//    screen. It seeds the mother tongue on every new text, i.e. the language your
//    mistakes get translated into.
//  * `uiLang` is the language of the menus, changed later from the header.
//
// Both null means "not chosen yet", which is what makes the language gate appear.
export interface Prefs {
  uiLang: string | null;
  motherLang: string | null;
}

function prefsRef(uid: string) {
  return doc(db, 'users', uid, 'meta', 'prefs');
}

/** Streams the user's prefs. Calls back with nulls until something is set. */
export function subscribePrefs(
  uid: string,
  onChange: (p: Prefs) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    prefsRef(uid),
    (snap) => {
      const data = snap.data() as Partial<Prefs> | undefined;
      onChange({ uiLang: data?.uiLang ?? null, motherLang: data?.motherLang ?? null });
    },
    (err) => {
      console.error('[remenda] prefs subscription failed:', err);
      onError?.(err);
    },
  );
}

export async function savePrefs(uid: string, patch: Partial<Prefs>): Promise<void> {
  await setDoc(prefsRef(uid), { ...patch, updatedAt: Date.now() }, { merge: true });
}

/** Menu language only — the header dropdown. */
export function saveUiLang(uid: string, uiLang: string): Promise<void> {
  return savePrefs(uid, { uiLang });
}

/** The login-screen choice: it's your language, so it sets both. */
export function saveMotherLang(uid: string, motherLang: string): Promise<void> {
  return savePrefs(uid, { motherLang, uiLang: motherLang });
}
