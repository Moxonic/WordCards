import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// One small per-user settings doc. `uiLang` null means "not chosen yet" — the
// app shows the language picker on first sign-in.
export interface Prefs {
  uiLang: string | null;
}

function prefsRef(uid: string) {
  return doc(db, 'users', uid, 'meta', 'prefs');
}

/** Streams the user's prefs. Calls back with { uiLang: null } until one is set. */
export function subscribePrefs(
  uid: string,
  onChange: (p: Prefs) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    prefsRef(uid),
    (snap) => {
      const data = snap.data() as Partial<Prefs> | undefined;
      onChange({ uiLang: data?.uiLang ?? null });
    },
    (err) => {
      console.error('[remenda] prefs subscription failed:', err);
      onError?.(err);
    },
  );
}

export async function saveUiLang(uid: string, uiLang: string): Promise<void> {
  await setDoc(prefsRef(uid), { uiLang, updatedAt: Date.now() }, { merge: true });
}
