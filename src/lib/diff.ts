// Tiny word-level diff, used for:
//  - the "write it" check in Review (did the typed answer match the correction?)
//  - showing the corrected text with changes highlighted

export type DiffOp = { type: 'same' | 'add' | 'del'; value: string };

/** Loose normalisation for comparing a typed answer to the target. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[\s"'«»(–—-]+|[\s"'«».,!?;:)–—-]+$/g, '')
    .trim();
}

export function looseMatch(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

function tokenize(s: string): string[] {
  // keep words and punctuation as separate tokens, drop pure whitespace
  return s.match(/[\p{L}\p{N}’'-]+|[^\s\p{L}\p{N}]/gu) ?? [];
}

/** Classic LCS word diff between `from` and `to`. */
export function wordDiff(from: string, to: string): DiffOp[] {
  const a = tokenize(from);
  const b = tokenize(to);
  const n = a.length;
  const m = b.length;

  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i][j] =
        a[i].toLowerCase() === b[j].toLowerCase()
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  const push = (type: DiffOp['type'], value: string) => {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.value += (value.match(/^[.,!?;:)]/) ? '' : ' ') + value;
    else ops.push({ type, value });
  };
  while (i < n && j < m) {
    if (a[i].toLowerCase() === b[j].toLowerCase()) {
      push('same', b[j]);
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push('del', a[i]);
      i += 1;
    } else {
      push('add', b[j]);
      j += 1;
    }
  }
  while (i < n) {
    push('del', a[i]);
    i += 1;
  }
  while (j < m) {
    push('add', b[j]);
    j += 1;
  }
  return ops;
}
