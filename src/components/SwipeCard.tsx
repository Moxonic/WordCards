import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';

const THRESHOLD = 90; // px of horizontal travel to count as a swipe
const TAP_SLOP = 8; // movement under this on release counts as a tap
const FLY_MS = 280;
const ENTER_MS = 260;

interface Props {
  onSwipe: (dir: 'left' | 'right') => void;
  onTap?: () => void;
  disabled?: boolean;
  hintYes?: string;
  hintNo?: string;
  children: ReactNode;
}

/**
 * Dependency-free swipe wrapper. Drag left/right; releasing past the threshold
 * flies the card off screen and calls onSwipe after a short delay. A near-still
 * release calls onTap.
 *
 * The delayed onSwipe used to misfire: if the parent replaced this card in the
 * meantime (the on-screen +/- buttons advance the deck too), the pending
 * callback still ran against a stale session and the mastery counter skipped.
 * Now the timer is cancelled on unmount, and fly() can only be armed once, so a
 * swipe answers exactly the card it was made on — or nothing.
 */
export default function SwipeCard({
  onSwipe,
  onTap,
  disabled = false,
  hintYes = 'KAN DET',
  hintNo = 'IGJEN',
  children,
}: Props) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const [entered, setEntered] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef({ x: 0, y: 0 });
  const flyTimer = useRef<number>();
  const flying = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // A fly() armed just before this card is replaced must not fire.
  useEffect(() => () => window.clearTimeout(flyTimer.current), []);

  function down(e: PointerEvent<HTMLDivElement>) {
    if (disabled || leaving) return;
    start.current = { x: e.clientX, y: e.clientY };
    dragRef.current = { x: 0, y: 0 };
    setDrag({ x: 0, y: 0, active: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const d = { x: e.clientX - start.current.x, y: e.clientY - start.current.y };
    dragRef.current = d;
    setDrag({ ...d, active: true });
  }

  function up() {
    if (!start.current) return;
    const { x, y } = dragRef.current;
    start.current = null;
    if (x > THRESHOLD) fly('right');
    else if (x < -THRESHOLD) fly('left');
    else {
      dragRef.current = { x: 0, y: 0 };
      setDrag({ x: 0, y: 0, active: false });
      if (!disabled && Math.abs(x) < TAP_SLOP && Math.abs(y) < TAP_SLOP) onTap?.();
    }
  }

  function fly(dir: 'left' | 'right') {
    if (flying.current) return;
    flying.current = true;
    setLeaving(dir);
    flyTimer.current = window.setTimeout(() => onSwipe(dir), FLY_MS);
  }

  const offX = leaving === 'right' ? 600 : leaving === 'left' ? -600 : drag.x;
  const offY = leaving ? 0 : drag.y;
  const rot = offX / 18;
  const strength = Math.min(1, Math.abs(drag.x) / THRESHOLD);
  const hint = !leaving && Math.abs(drag.x) > 20 ? (drag.x > 0 ? 'yes' : 'no') : null;

  const enterT = entered ? 'scale(1)' : 'scale(0.95) translateY(-6px)';
  const transition = drag.active
    ? 'none'
    : entered
      ? `transform ${FLY_MS}ms ease-out, opacity ${FLY_MS}ms ease-out`
      : `transform ${ENTER_MS}ms ease-out`;

  return (
    <div
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{
        transform: `translate(${offX}px, ${offY}px) rotate(${rot}deg) ${enterT}`,
        transition,
        opacity: leaving ? 0 : 1,
        touchAction: 'none',
        cursor: disabled ? 'default' : 'grab',
        willChange: 'transform',
      }}
      className="relative h-full w-full rounded-[3px]"
    >
      {children}
      {hint && (
        <div
          style={{ opacity: 0.35 + strength * 0.65 }}
          className={`pointer-events-none absolute top-6 rounded-none border bg-white/50 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] backdrop-blur-sm ${
            hint === 'yes'
              ? 'right-6 -rotate-6 border-emerald-600 text-emerald-700'
              : 'left-6 rotate-6 border-red-600 text-red-700'
          }`}
        >
          {hint === 'yes' ? hintYes : hintNo}
        </div>
      )}
    </div>
  );
}
