// The Emenda wordmark: the brand mark stands in for the leading "E", followed by
// "menda" in the surrounding type. Sizes to the current font-size (em units), so
// the same component works in the nav and on the sign-in screen.
export default function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span role="img" aria-label="Emenda" className={`inline-flex items-center ${className}`}>
      <img
        src="/logos/emenda-mark-black_1.svg"
        alt=""
        aria-hidden="true"
        className="mr-[0.38em] inline-block h-[0.9em] w-auto"
      />
      <span aria-hidden="true">menda</span>
    </span>
  );
}
