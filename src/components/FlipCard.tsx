import { useState, type ReactNode } from 'react';
import ReactCardFlip from 'react-card-flip';

// Deterministic per-card colour: same seed -> same hue every time.
function hueFromSeed(seed = ''): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function cardFaces(seed: string) {
  const hue = hueFromSeed(String(seed || ''));
  const backHue = (hue + 14) % 360;
  return {
    frontColor: `hsl(${hue}, 68%, 76%)`,
    frontImage: `linear-gradient(160deg, hsl(${hue}, 80%, 84%), hsl(${hue}, 62%, 66%))`,
    backColor: `hsl(${backHue}, 58%, 64%)`,
    backImage: `linear-gradient(160deg, hsl(${backHue}, 64%, 72%), hsl(${backHue}, 50%, 52%))`,
  };
}

interface Props {
  seed: string;
  front: ReactNode;
  back: ReactNode;
  flipped?: boolean;
  onFlip?: () => void;
  flipHint?: string;
}

const faceClass =
  'appearance-none border-0 h-full w-full rounded-[1.75rem] shadow-2xl ring-1 ring-black/10 ' +
  'flex flex-col items-center justify-center gap-2 text-center overflow-hidden relative isolate p-8';

export default function FlipCard({
  seed,
  front,
  back,
  flipped,
  onFlip,
  flipHint = 'Snu kortet',
}: Props) {
  const faces = cardFaces(seed);
  const controlled = flipped !== undefined;
  const [selfFlipped, setSelfFlipped] = useState(false);
  const isFlipped = controlled ? flipped : selfFlipped;

  const flip = () => (controlled ? onFlip?.() : setSelfFlipped((v) => !v));

  return (
    <div className="m-auto h-full w-full select-none rounded-[1.75rem]">
      <ReactCardFlip
        isFlipped={isFlipped}
        flipDirection="horizontal"
        containerStyle={{ height: '100%', width: '100%' }}
      >
        <button
          type="button"
          className={faceClass}
          style={{ backgroundColor: faces.frontColor, backgroundImage: faces.frontImage }}
          onClick={flip}
          title={flipHint}
        >
          {front}
        </button>

        <button
          type="button"
          className={faceClass}
          style={{ backgroundColor: faces.backColor, backgroundImage: faces.backImage }}
          onClick={flip}
          title={flipHint}
        >
          {back}
        </button>
      </ReactCardFlip>
    </div>
  );
}
