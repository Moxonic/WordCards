// The Remenda wordmark: the brand mark (an "E" of three bars) stands in for the
// E in R·E·MENDA, with the rest of the name set in the surrounding type. Sizes to
// the current font-size (em units), so the same component works in the nav and on
// the sign-in screen.
export default function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span role="img" aria-label="Remenda" className={`inline-flex items-center ${className}`}>
      <span aria-hidden="true">R</span>
      <img
        src="/logos/emenda-mark-black_1.svg"
        alt=""
        aria-hidden="true"
        className="mx-[0.08em] inline-block h-[0.9em] w-auto"
      />
      <span aria-hidden="true">menda</span>
    </span>
  );
}
