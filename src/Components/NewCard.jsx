import React, { useState } from 'react';
import { addManualCard, DEFAULT_COLLECTION_ID } from '../data/cards';

function NewCard({ uid, collections = [], defaultCollectionId = DEFAULT_COLLECTION_ID, onDone }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [collectionId, setCollectionId] = useState(
    defaultCollectionId && defaultCollectionId !== 'all' ? defaultCollectionId : DEFAULT_COLLECTION_ID,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    if (!front.trim() || !back.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addManualCard(uid, { front, back, collectionId });
      setFront('');
      setBack('');
      onDone?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[wordcards] failed to add card:', err);
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="createContainer flex flex-col z-10 h-full w-full items-center justify-center gap-4 px-4">
      <h2 className="text-xl text-slate-700">New card</h2>

      <div className="cardContainer frontSideColor w-52 h-16 flex flex-col justify-center rounded-xl">
        <div className="h-fit self-center">
          <input
            className="h-10 rounded-xl"
            onChange={(e) => setFront(e.target.value)}
            value={front}
            type="text"
            placeholder="Word / phrase…"
            autoFocus
          />
        </div>
      </div>

      <div className="cardContainer backSideColor w-52 h-16 flex flex-col justify-center rounded-xl">
        <div className="h-fit self-center">
          <input
            className="h-10 rounded-xl"
            onChange={(e) => setBack(e.target.value)}
            value={back}
            type="text"
            placeholder="Translation…"
          />
        </div>
      </div>

      <label className="text-sm text-slate-600 flex items-center gap-2">
        Collection
        <select
          title="Which collection to add this card to"
          className="rounded-lg border border-slate-300 px-2 py-1 bg-white"
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
        >
          {collections.length === 0 && <option value={DEFAULT_COLLECTION_ID}>My words</option>}
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-3">
        <button
          className="bg-slate-200 h-12 px-6 rounded-xl disabled:opacity-50"
          onClick={save}
          disabled={saving || !front.trim() || !back.trim()}
          title="Save this card to the chosen collection"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          className="h-12 px-6 rounded-xl text-slate-500"
          onClick={() => onDone?.()}
          title="Discard and go back to reviewing"
        >
          Cancel
        </button>
      </div>

      {error && <p className="text-red-700 text-sm">Couldn&apos;t save: {error.message}</p>}
    </div>
  );
}

export default NewCard;
