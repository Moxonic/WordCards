import React, { useEffect, useRef, useState } from 'react';
import { MdFlipCameraAndroid } from 'react-icons/md';
import { FiLogOut } from 'react-icons/fi';
import { AiOutlineFolderOpen } from 'react-icons/ai';
import NewCard from './NewCard';
import ReviewDeck from './ReviewDeck';
import ManageView from './ManageView';
import { useAuth } from '../context/AuthContext';
import { subscribeToCards, importLegacyCards, assignOrphanCards } from '../data/cards';
import {
  subscribeCollections,
  ensureDefaultCollection,
  seedStarterDecksOnce,
} from '../data/collections';

const MIGRATION_FLAG = 'wordcards_migrated_v1';

function readLegacyCards() {
  try {
    const raw = localStorage.getItem('WORDCARDS_DB');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Wordcard() {
  const { user, signOutUser } = useAuth();
  const uid = user.uid;

  const [cards, setCards] = useState([]);
  const [collections, setCollections] = useState([]);
  const [view, setView] = useState('review'); // 'review' | 'create' | 'manage'
  const [collectionId, setCollectionId] = useState('all');
  const [showAnswers, setShowAnswers] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG) === 'true';
  const [legacy, setLegacy] = useState(alreadyMigrated ? [] : readLegacyCards());
  const [migrating, setMigrating] = useState(false);
  const orphanFixDone = useRef(false);
  const setupDone = useRef(false);

  useEffect(() => {
    if (!setupDone.current) {
      setupDone.current = true;
      (async () => {
        try {
          await ensureDefaultCollection(uid);
          // Everyone gets the three built-in collections on first sign-in.
          await seedStarterDecksOnce(uid);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[wordcards] initial collection setup failed:', e);
        }
      })();
    }
    const unsubCards = subscribeToCards(uid, setCards);
    const unsubColls = subscribeCollections(uid, setCollections);
    return () => {
      unsubCards();
      unsubColls();
    };
  }, [uid]);

  // Close the account menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // One-time: cards created before collections existed get moved into "My words".
  useEffect(() => {
    if (orphanFixDone.current) return;
    if (cards.length === 0) return;
    if (!cards.some((c) => !c.collectionId)) {
      orphanFixDone.current = true;
      return;
    }
    orphanFixDone.current = true;
    assignOrphanCards(uid, cards).catch((e) =>
      // eslint-disable-next-line no-console
      console.error('[wordcards] orphan card fix failed:', e),
    );
  }, [cards, uid]);

  async function migrateLegacy() {
    setMigrating(true);
    try {
      await importLegacyCards(uid, legacy);
      localStorage.setItem(MIGRATION_FLAG, 'true');
      setLegacy([]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[wordcards] legacy import failed:', err);
    } finally {
      setMigrating(false);
    }
  }

  function dismissLegacy() {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    setLegacy([]);
  }

  return (
    <div className="flex h-full w-full flex-col bg-slate-100">
      <nav className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-slate-200 gap-2">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title="Account menu"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-1 rounded-full pr-1 hover:bg-slate-300/60"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-8 h-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-white text-sm">
                {(user?.displayName || user?.email || '?').slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-slate-500 text-xs">▾</span>
          </button>

          {menuOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-30 overflow-hidden">
              <div className="px-3 py-2 text-xs text-slate-500 truncate border-b border-slate-100">
                {user?.displayName || user?.email}
              </div>
              <button
                onClick={() => {
                  setView('manage');
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <AiOutlineFolderOpen className="h-4 w-4" />
                Manage collections
              </button>
              <button
                onClick={signOutUser}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600"
              >
                <FiLogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            title="Choose which collection to review"
            className="text-sm rounded-full ring-1 ring-slate-200 px-3 py-1.5 bg-white max-w-[9rem] text-slate-600 focus:outline-none"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
          >
            <option value="all">All collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAnswers((v) => !v)}
            aria-label="Flip all cards"
            title={showAnswers ? 'Show the fronts again' : 'Flip every card to show the answer'}
            className={`rounded-full w-9 h-9 p-2 ring-1 ring-slate-200 transition ${
              showAnswers ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <MdFlipCameraAndroid className="h-5 w-5 m-auto" />
          </button>
        </div>
      </nav>

      {legacy.length > 0 && (
        <div className="bg-amber-100 text-amber-900 text-xs px-3 py-2 flex flex-wrap items-center gap-2 justify-center">
          <span>
            {legacy.length} card{legacy.length === 1 ? '' : 's'} saved in this browser.
          </span>
          <button
            onClick={migrateLegacy}
            disabled={migrating}
            title="Copy the cards saved in this browser into your synced account"
            className="underline font-medium disabled:opacity-50"
          >
            {migrating ? 'Importing…' : 'Import'}
          </button>
          <button
            onClick={dismissLegacy}
            title="Hide this notice and don't import"
            className="text-amber-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {view === 'create' && (
          <NewCard
            uid={uid}
            collections={collections}
            defaultCollectionId={collectionId}
            onDone={() => setView('review')}
          />
        )}
        {view === 'manage' && (
          <ManageView uid={uid} cards={cards} collections={collections} />
        )}
        {view === 'review' && (
          <ReviewDeck
            uid={uid}
            cards={cards}
            collectionId={collectionId}
            showAnswers={showAnswers}
            onAddCard={() => setView('create')}
          />
        )}
      </div>
    </div>
  );
}

export default Wordcard;
