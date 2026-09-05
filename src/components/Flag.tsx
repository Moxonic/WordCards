// Flags drawn inline rather than with emoji: Chrome and Edge on Windows do not
// render regional-indicator sequences, so 🇳🇴 shows up as the letters "NO".
// Each flag is drawn in its own official ratio and scaled to a common box.

const FLAGS: Record<string, { viewBox: string; body: React.ReactNode }> = {
  nb: {
    viewBox: '0 0 22 16',
    body: (
      <>
        <rect width="22" height="16" fill="#BA0C2F" />
        <rect x="6" width="4" height="16" fill="#fff" />
        <rect y="6" width="22" height="4" fill="#fff" />
        <rect x="7" width="2" height="16" fill="#00205B" />
        <rect y="7" width="22" height="2" fill="#00205B" />
      </>
    ),
  },
  en: {
    viewBox: '0 0 60 30',
    body: (
      <>
        <clipPath id="flag-uk-clip">
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath="url(#flag-uk-clip)"
          stroke="#C8102E"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </>
    ),
  },
  es: {
    viewBox: '0 0 3 2',
    body: (
      <>
        <rect width="3" height="2" fill="#AA151B" />
        <rect y="0.5" width="3" height="1" fill="#F1BF00" />
      </>
    ),
  },
  de: {
    viewBox: '0 0 5 3',
    body: (
      <>
        <rect width="5" height="3" fill="#000" />
        <rect y="1" width="5" height="2" fill="#DD0000" />
        <rect y="2" width="5" height="1" fill="#FFCE00" />
      </>
    ),
  },
};

export default function Flag({ code, className = '' }: { code: string; className?: string }) {
  const flag = FLAGS[code];
  if (!flag) return null;
  return (
    <svg
      viewBox={flag.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {flag.body}
    </svg>
  );
}
