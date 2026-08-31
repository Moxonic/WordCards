import React, { useMemo, useState } from 'react';
import { AiOutlineDelete, AiOutlineShareAlt, AiOutlineEdit } from 'react-icons/ai';
import { moveCard, deleteCard, DEFAULT_COLLECTION_ID } from '../data/cards';
import {
  createCollection,
  renameCollection,
  deleteCollection,
  shareCollection,
  importSharedCollection,
  addStarterDeck,
} from '../data/collections';
import { STARTER_DECKS } from '../data/starterDecks';

function ManageView({ uid, cards, collections }) {
  const [newName, setNewName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [shareCodes, setShareCodes] = useState({}); // collectionId -> code
  const [renaming, setRenaming] = useState(null); // { id, value }

  const byCollection = useMemo(() => {
    const map = new Map();
    for (const c of cards) {
      const key = c.collectionId || DEFAULT_COLLECTION_ID;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }
    return map;
  }, [cards]);

  async function run(fn, okMsg) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      if (okMsg) setMsg(typeof okMsg === 'function' ? okMsg(r) : okMsg);
      return r;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[wordcards] manage action failed:', err);
      setMsg(`Error: ${err.message}`);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function addCollection() {
    if (!newName.trim()) return;
    await run(() => createCollection(uid, newName), 'Collection created.');
    setNewName('');
  }

  async function importByCode() {
    if (!code.trim()) return;
    const r = await run(
      () => importSharedCollection(uid, code),
      (res) => `Imported ${res.count} card${res.count === 1 ? '' : 's'} from "${res.name}".`,
    );
    if (r) setCode('');
  }

  async function addStarter(deck) {
    await run(
      () => addStarterDeck(uid, deck),
      (res) =>
        res.skipped
          ? `"${deck.name}" is already in your collections.`
          : `Added "${deck.name}" — ${res.count} cards.`,
    );
  }

  async function share(coll) {
    const cardsInIt = byCollection.get(coll.id) || [];
    const c = await run(
      () => shareCollection(uid, coll, cardsInIt),
      'Share code ready — send it to a friend.',
    );
    if (c) setShareCodes((s) => ({ ...s, [coll.id]: c }));
  }

  async function removeCollection(coll) {
    const cardsInIt = byCollection.get(coll.id) || [];
    // eslint-disable-next-line no-alert
    if (
      !window.confirm(
        `Delete "${coll.name}" and its ${cardsInIt.length} card${
          cardsInIt.length === 1 ? '' : 's'
        }? This cannot be undone.`,
      )
    ) {
      return;
    }
    await run(() => deleteCollection(uid, coll.id, cardsInIt), 'Collection deleted.');
    if (expanded === coll.id) setExpanded(null);
  }

  async function saveRename() {
    if (!renaming) return;
    await run(() => renameCollection(uid, renaming.id, renaming.value), 'Renamed.');
    setRenaming(null);
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-100 p-4">
      <div className="max-w-xl mx-auto flex flex-col gap-4">
        <h2 className="text-xl text-slate-700">Collections</h2>

        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 flex-1 min-w-[10rem] bg-white"
            placeholder="New collection name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            onClick={addCollection}
            disabled={busy || !newName.trim()}
            title="Create a new empty collection"
            className="rounded-lg bg-slate-700 text-white px-4 py-2 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <input
            title="Paste the share code a friend gave you"
            className="rounded-lg border border-slate-300 px-3 py-2 flex-1 min-w-[10rem] bg-white uppercase tracking-wide"
            placeholder="Friend's share code…"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            onClick={importByCode}
            disabled={busy || !code.trim()}
            title="Import a copy of a friend's collection from their share code"
            className="rounded-lg bg-slate-700 text-white px-4 py-2 disabled:opacity-50"
          >
            Import
          </button>
        </div>

        {msg && <p className="text-sm text-slate-600 bg-white rounded-lg px-3 py-2">{msg}</p>}

        {STARTER_DECKS.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-3 flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">Starter packs</p>
            {STARTER_DECKS.map((deck) => {
              const already = collections.some((c) => c.id === deck.id);
              return (
                <div key={deck.id} className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">
                      {deck.name}{' '}
                      <span className="text-slate-400">· {deck.cards.length} cards</span>
                    </p>
                    <p className="text-xs text-slate-500">{deck.description}</p>
                  </div>
                  <button
                    onClick={() => addStarter(deck)}
                    disabled={busy || already}
                    title={
                      already
                        ? 'A collection with this name already exists'
                        : `Add the "${deck.name}" pack as a new collection`
                    }
                    className="rounded-lg bg-slate-700 text-white px-3 py-1.5 text-sm disabled:opacity-50 shrink-0"
                  >
                    {already ? 'Added' : 'Add'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {collections.map((coll) => {
            const list = byCollection.get(coll.id) || [];
            const isOpen = expanded === coll.id;
            return (
              <li key={coll.id} className="bg-white rounded-xl shadow-sm">
                <div className="flex items-center gap-2 p-3">
                  {renaming?.id === coll.id ? (
                    <>
                      <input
                        className="rounded border border-slate-300 px-2 py-1 flex-1"
                        value={renaming.value}
                        autoFocus
                        onChange={(e) => setRenaming({ id: coll.id, value: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                      />
                      <button
                        className="text-sm text-slate-600"
                        onClick={saveRename}
                        title="Save the new name"
                      >
                        Save
                      </button>
                      <button
                        className="text-sm text-slate-400"
                        onClick={() => setRenaming(null)}
                        title="Discard the name change"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="flex-1 text-left font-medium text-slate-700"
                        onClick={() => setExpanded(isOpen ? null : coll.id)}
                        title={isOpen ? 'Hide the cards in this collection' : 'Show the cards in this collection'}
                      >
                        {coll.name}{' '}
                        <span className="text-slate-400 font-normal">
                          · {list.length} card{list.length === 1 ? '' : 's'}
                        </span>
                      </button>
                      <button
                        aria-label="Rename"
                        title="Rename this collection"
                        className="p-1 text-slate-400 hover:text-slate-600"
                        onClick={() => setRenaming({ id: coll.id, value: coll.name })}
                      >
                        <AiOutlineEdit />
                      </button>
                      <button
                        aria-label="Share"
                        title="Create a share code so a friend can copy this collection"
                        className="p-1 text-slate-400 hover:text-slate-600"
                        onClick={() => share(coll)}
                        disabled={busy}
                      >
                        <AiOutlineShareAlt />
                      </button>
                      {coll.id !== DEFAULT_COLLECTION_ID && (
                        <button
                          aria-label="Delete collection"
                          title="Delete this collection and every card in it"
                          className="p-1 text-slate-400 hover:text-red-600"
                          onClick={() => removeCollection(coll)}
                          disabled={busy}
                        >
                          <AiOutlineDelete />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {(shareCodes[coll.id] || coll.shareCode) && (
                  <div className="px-3 pb-2 -mt-1 text-sm flex items-center gap-2">
                    <span className="text-slate-500">Share code:</span>
                    <code className="bg-slate-100 rounded px-2 py-0.5 tracking-widest">
                      {shareCodes[coll.id] || coll.shareCode}
                    </code>
                    <button
                      className="text-slate-500 underline"
                      title="Copy the share code to the clipboard"
                      onClick={() => {
                        const value = shareCodes[coll.id] || coll.shareCode;
                        if (navigator.clipboard?.writeText) {
                          navigator.clipboard.writeText(value).then(
                            () => setMsg('Copied.'),
                            () => setMsg(`Share code: ${value}`),
                          );
                        } else {
                          setMsg(`Share code: ${value}`);
                        }
                      }}
                    >
                      copy
                    </button>
                  </div>
                )}

                {isOpen && (
                  <ul className="border-t border-slate-100 divide-y divide-slate-100">
                    {list.length === 0 && (
                      <li className="px-3 py-2 text-sm text-slate-400">No cards.</li>
                    )}
                    {list.map((card) => (
                      <li key={card.id} className="px-3 py-2 flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">
                          <span className="text-slate-700">{card.front}</span>
                          <span className="text-slate-400"> → {card.back}</span>
                        </span>
                        <select
                          title="Move this card to another collection"
                          className="rounded border border-slate-200 px-1 py-0.5 text-xs bg-white max-w-[8rem]"
                          value={card.collectionId || DEFAULT_COLLECTION_ID}
                          onChange={(e) => moveCard(uid, card.id, e.target.value)}
                        >
                          {collections.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          aria-label="Delete card"
                          title="Delete this card permanently"
                          className="p-1 text-slate-300 hover:text-red-600"
                          onClick={() => deleteCard(uid, card.id)}
                        >
                          <AiOutlineDelete />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default ManageView;
