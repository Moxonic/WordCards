import React, { useState } from 'react';
import ReactCardFlip from 'react-card-flip';

// Deterministic per-card colour: same card -> same hue every time.
function hueFromSeed(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function cardFaces(seed) {
  const hue = hueFromSeed(String(seed || ''));
  const backHue = (hue + 14) % 360;
  // Solid colour + gradient image. The solid colour guarantees the card is
  // fully opaque even if a browser ignores the gradient string.
  return {
    frontColor: `hsl(${hue}, 68%, 76%)`,
    frontImage: `linear-gradient(160deg, hsl(${hue}, 80%, 84%), hsl(${hue}, 62%, 66%))`,
    backColor: `hsl(${backHue}, 58%, 64%)`,
    backImage: `linear-gradient(160deg, hsl(${backHue}, 64%, 72%), hsl(${backHue}, 50%, 52%))`,
  };
}

/**
 * A single flippable flashcard.
 *
 * Controlled if `flipped` + `onFlip` are supplied (the review deck drives this so
 * it can reset the flip when a new card reaches the top). Uncontrolled otherwise.
 * `seed` picks the card's colour (defaults to the front text).
 */
function Card({ front, back, frontSide, backSide, flipped, onFlip, globalFlipState, seed }) {
  const frontText = front ?? frontSide;
  const backText = back ?? backSide;
  const faces = cardFaces(seed ?? frontText);

  const isControlled = flipped !== undefined;
  const [selfFlipped, setSelfFlipped] = useState(false);
  const isFlipped = isControlled ? flipped : selfFlipped;

  // Legacy: a parent "flip all" toggle forces the uncontrolled state.
  React.useEffect(() => {
    if (!isControlled && globalFlipState !== undefined) {
      setSelfFlipped(Boolean(globalFlipState));
    }
  }, [globalFlipState, isControlled]);

  function flip() {
    if (isControlled) onFlip?.();
    else setSelfFlipped((v) => !v);
  }

  const face =
    'appearance-none border-0 h-full w-full rounded-[1.75rem] shadow-2xl ring-1 ring-black/10 ' +
    'flex items-center justify-center text-center overflow-hidden relative isolate';

  return (
    <div className="wordCardButtonContainer h-full w-full m-auto select-none rounded-[1.75rem]">
      <ReactCardFlip
        isFlipped={isFlipped}
        flipDirection="horizontal"
        containerStyle={{ height: '100%', width: '100%' }}
      >
        <button
          className={face}
          style={{ backgroundColor: faces.frontColor, backgroundImage: faces.frontImage }}
          onClick={flip}
          title="Flip the card"
        >
          <span className="px-8 text-[1.6rem] leading-snug font-semibold text-slate-800 break-words">
            {frontText}
          </span>
        </button>

        <button
          className={face}
          style={{ backgroundColor: faces.backColor, backgroundImage: faces.backImage }}
          onClick={flip}
          title="Flip the card"
        >
          <span className="px-8 text-[1.6rem] leading-snug font-semibold text-slate-900 break-words">
            {backText}
          </span>
        </button>
      </ReactCardFlip>
    </div>
  );
}

export default Card;
