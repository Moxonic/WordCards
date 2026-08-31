import React, { useEffect, useRef, useState } from 'react';

const THRESHOLD = 90; // px of horizontal travel to count as a swipe
const TAP_SLOP = 8; // movement under this on release counts as a click, not a drag
const FLY_MS = 280;
const ENTER_MS = 260; // grow-in when this card becomes the top of the stack

/**
 * Dependency-free swipe wrapper. Drag the child left/right; releasing past the
 * threshold flies it off screen and calls onSwipe('left' | 'right'). A release
 * that barely moved calls onTap (used to flip the card) — the pointer capture
 * would otherwise swallow the click before it reached the card.
 */
function SwipeCard({ onSwipe, onTap, disabled = false, children }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState(null); // 'left' | 'right' | null
  // Starts slightly small (like the card behind it) and grows to full size, so
  // promotion from the stack reads as one smooth motion. Keyed remount per card
  // in the parent means this runs for every new top card.
  const [entered, setEntered] = useState(false);
  const start = useRef(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function down(e) {
    if (disabled || leaving) return;
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }

  function move(e) {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  }

  function up() {
    if (!start.current) return;
    const { x, y } = drag;
    start.current = null;
    if (x > THRESHOLD) fly('right');
    else if (x < -THRESHOLD) fly('left');
    else {
      setDrag({ x: 0, y: 0, active: false });
      if (!disabled && Math.abs(x) < TAP_SLOP && Math.abs(y) < TAP_SLOP) onTap?.();
    }
  }

  function fly(dir) {
    setLeaving(dir);
    window.setTimeout(() => onSwipe(dir), FLY_MS);
  }

  const offX = leaving === 'right' ? 600 : leaving === 'left' ? -600 : drag.x;
  const offY = leaving ? 0 : drag.y;
  const rot = offX / 18;
  const strength = Math.min(1, Math.abs(drag.x) / THRESHOLD);
  const hint = !leaving && Math.abs(drag.x) > 20 ? (drag.x > 0 ? 'yes' : 'no') : null;

  // Before the enter frame: sit where the card behind was (a bit small, nudged up).
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
      className="relative h-full w-full rounded-[1.75rem]"
    >
      {children}
      {hint && (
        <div
          style={{ opacity: 0.35 + strength * 0.65 }}
          className={`absolute top-6 px-4 py-1.5 rounded-xl border-[3px] font-extrabold text-lg tracking-wide backdrop-blur-sm bg-white/40 ${
            hint === 'yes'
              ? 'right-6 border-emerald-500 text-emerald-600 -rotate-12'
              : 'left-6 border-red-500 text-red-600 rotate-12'
          }`}
        >
          {hint === 'yes' ? 'KNEW IT' : 'AGAIN'}
        </div>
      )}
    </div>
  );
}

export default SwipeCard;
