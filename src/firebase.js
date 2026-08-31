import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config comes from environment variables (CRA inlines any REACT_APP_* var at
// build time). Copy .env.example to .env and fill these in from the Firebase
// console -> Project settings -> Your apps -> SDK setup and configuration.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

if (!isFirebaseConfigured) {
  // Fail loud in the console rather than throwing an opaque error later.
  // eslint-disable-next-line no-console
  console.warn(
    '[wordcards] Firebase is not configured. Create a .env file (see .env.example) ' +
      'and restart `npm start`. Sign-in and sync will not work until then.',
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
