// Runs on translate.google.com. Two jobs:
//   * auto: notice each completed translation and push it to the service worker
//   * scan: on demand, walk the History / Saved lists and push everything found
//
// Google's markup is obfuscated and unversioned, so every selector here has
// fallbacks and the parser logs when it comes up empty. Treat this as best-effort.

const DEBOUNCE_MS = 1500;
let lastEmitted = '';

// ---------------------------------------------------------------- active pane

function langsFromUrl() {
  const p = new URLSearchParams(location.search);
  const sl = p.get('sl');
  const tl = p.get('tl');
  return {
    sourceLang: sl && sl !== 'auto' ? sl : null,
    targetLang: tl || null,
    urlText: p.get('text') ? decodeURIComponent(p.get('text')) : '',
  };
}

function firstText(selectors) {
  for (const sel of selectors) {
    const nodes = document.querySelectorAll(sel);
    if (!nodes.length) continue;
    const text = Array.from(nodes)
      .map((n) => n.textContent || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) return text;
  }
  return '';
}

function readActiveTranslation() {
  const { sourceLang, targetLang, urlText } = langsFromUrl();

  const sourceEl = document.querySelector('textarea[aria-label], textarea');
  const front = (sourceEl?.value || urlText || '').replace(/\s+/g, ' ').trim();

  const back = firstText([
    'span[jsname="W297wb"]',
    '[jsname="jqKxS"] span',
    '[jsname="jqKxS"]',
    'c-wiz[role="region"] [aria-live="polite"]',
    'div[aria-live="polite"] span',
  ]);

  if (!front || !back) return null;
  if (front.toLowerCase() === back.toLowerCase()) return null;
  if (front.length > 200 || back.length > 200) return null; // full-sentence dumps, skip
  return { front, back, sourceLang, targetLang };
}

// ---------------------------------------------------------------- list scan

const UI_NOISE = new Set([
  'translate', 'more', 'copy', 'share', 'save', 'saved', 'history',
  'listen', 'rate this translation', 'suggest an edit', 'star',
  // Material-icon ligature text that leaks in from icon buttons.
  'star_border', 'star_outline', 'content_copy', 'volume_up', 'swap_horiz',
  'swap_horizontal', 'more_vert', 'arrow_forward', 'delete', 'delete_outline',
  'edit', 'close', 'favorite', 'favorite_border', 'bookmark', 'bookmark_border',
]);

// Icon ligatures render as a single snake_case token; real phrases don't.
function looksLikeIcon(t) {
  return /^[a-z]+(_[a-z]+)+$/.test(t);
}

function meaningfulStrings(root) {
  const out = [];
  const seen = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = (node.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length < 2 || t.length > 200) continue;
    if (UI_NOISE.has(t.toLowerCase())) continue;
    if (looksLikeIcon(t.toLowerCase())) continue;
    if (/^[\p{P}\p{S}]+$/u.test(t)) continue; // punctuation / icons only
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function txt(el) {
  return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
}

// translate.google.com/saved (and the History panel, which reuses the same
// hooks): each entry is a [jsname="QIoUdf"] block with
//   [jsname="eTqL4e"] / [jsname="diQUje"]  -> source text  (+ lang attr)
//   [jsname="WHdkge"]                      -> translation   (+ lang attr)
//   [data-sl] / [data-tl]                  -> language codes
//   [data-text][data-language-code]        -> fallback: both texts as attributes
function parseSavedRows() {
  const rows = [];
  const seen = new Set();

  for (const row of document.querySelectorAll('[jsname="QIoUdf"], .qlhwWb')) {
    let front = txt(row.querySelector('[jsname="eTqL4e"]')) || txt(row.querySelector('[jsname="diQUje"]'));
    let back = txt(row.querySelector('[jsname="WHdkge"]'));
    let sourceLang = row.querySelector('[data-sl]')?.getAttribute('data-sl') || null;
    let targetLang = row.querySelector('[data-tl]')?.getAttribute('data-tl') || null;

    if (!front || !back) {
      const dt = row.querySelectorAll('[data-text][data-language-code]');
      if (dt.length >= 2) {
        front = front || dt[0].getAttribute('data-text');
        back = back || dt[1].getAttribute('data-text');
        sourceLang = sourceLang || dt[0].getAttribute('data-language-code');
        targetLang = targetLang || dt[1].getAttribute('data-language-code');
      }
    }

    front = (front || '').replace(/\s+/g, ' ').trim();
    back = (back || '').replace(/\s+/g, ' ').trim();
    if (!front || !back) continue;
    if (front.toLowerCase() === back.toLowerCase()) continue;
    if (front.length > 300 || back.length > 300) continue;

    const key = `${front.toLowerCase()}=>${back.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ front, back, sourceLang, targetLang });
  }
  return rows;
}

function parseListRows() {
  const rows = [];
  const seenPairs = new Set();

  const candidates = document.querySelectorAll(
    '[role="listitem"], li, [data-phrase], c-wiz [jsaction] [lang]',
  );

  for (const el of candidates) {
    // Prefer explicit lang-tagged children if present.
    const langged = el.querySelectorAll('[lang]');
    let front = '';
    let back = '';
    let sourceLang = null;
    let targetLang = null;

    if (langged.length >= 2) {
      front = (langged[0].textContent || '').replace(/\s+/g, ' ').trim();
      back = (langged[1].textContent || '').replace(/\s+/g, ' ').trim();
      sourceLang = langged[0].getAttribute('lang') || null;
      targetLang = langged[1].getAttribute('lang') || null;
    } else {
      const strings = meaningfulStrings(el);
      if (strings.length === 2) {
        [front, back] = strings;
      }
    }

    if (!front || !back || front.toLowerCase() === back.toLowerCase()) continue;
    const key = `${front.toLowerCase()}=>${back.toLowerCase()}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    rows.push({ front, back, sourceLang, targetLang });
  }
  return rows;
}

// ---------------------------------------------------------------- emit

function emit(rows, reason) {
  const clean = (rows || []).filter((r) => r && r.front && r.back);
  if (!clean.length) {
    if (reason === 'scan') {
      console.warn(
        '[wordcards] Scan found no translation rows on this page. ' +
          'Open the History panel or translate.google.com/saved and try again.',
      );
    }
    return { count: 0 };
  }
  chrome.runtime.sendMessage({
    type: reason === 'scan' ? 'SCAN_ROWS' : 'SCRAPED_ROWS',
    reason,
    rows: clean,
  });
  return { count: clean.length };
}

let timer = null;
function scheduleAutoEmit() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const row = readActiveTranslation();
    if (!row) return;
    const sig = `${row.front}=>${row.back}`;
    if (sig === lastEmitted) return;
    lastEmitted = sig;
    emit([row], 'auto');
  }, DEBOUNCE_MS);
}

const observer = new MutationObserver(scheduleAutoEmit);
observer.observe(document.body, { childList: true, subtree: true, characterData: true });
scheduleAutoEmit();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'SCAN_PAGE') {
    // Try the structured saved/history parser first; fall back to the generic
    // two-strings-per-row heuristic for anything it doesn't recognise.
    let rows = parseSavedRows();
    if (rows.length === 0) rows = parseListRows();
    const active = readActiveTranslation();
    if (active) rows.push(active);
    const { count } = emit(rows, 'scan');
    sendResponse({ ok: true, found: count });
  }
  return true;
});
