import { X509Certificate, verify as cryptoVerify } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'wordcards-2b9f0';
const GRADE_MODEL = 'claude-sonnet-5'; // one-line switch: claude-opus-5 / claude-haiku-4-5
const DAILY_CAP = 12;
const MAX_MISTAKES = 25;

const FS_ROOT = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY

// ---------------------------------------------------------------- token verify

async function verifyIdToken(idToken: string): Promise<string> {
  const [h, p, s] = idToken.split('.');
  if (!h || !p || !s) throw new Error('malformed token');
  let header: { kid?: string };
  let payload: { aud?: string; iss?: string; exp?: number; sub?: string };
  try {
    header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  } catch {
    throw new Error('malformed token');
  }

  if (!header.kid) throw new Error('token has no key id');
  const certs = (await (await fetch(CERTS_URL)).json()) as Record<string, string>;
  const cert = certs[header.kid];
  if (!cert) throw new Error('unknown token key');

  const ok = cryptoVerify(
    'RSA-SHA256',
    Buffer.from(`${h}.${p}`),
    new X509Certificate(cert).publicKey,
    Buffer.from(s, 'base64url'),
  );
  if (!ok) throw new Error('bad token signature');
  if (payload.aud !== PROJECT_ID) throw new Error('wrong audience');
  if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`) throw new Error('wrong issuer');
  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) throw new Error('expired');
  if (!payload.sub) throw new Error('no subject');
  return payload.sub as string;
}

// ------------------------------------------------------------- Firestore REST

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFs(v: any): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number')
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
  return {
    mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toFs(x)])) },
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFs(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFs);
  if ('mapValue' in val) return fromFsFields(val.mapValue.fields || {});
  return undefined;
}
function fromFsFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromFs(v)]));
}
function docFields(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFs(v)]));
}

async function fsGet(token: string, path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${FS_ROOT}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET ${path} -> ${res.status}`);
  const data = (await res.json()) as { fields?: Record<string, unknown> };
  return fromFsFields(data.fields || {});
}

interface FsWrite {
  path: string;
  fields: Record<string, unknown>;
  updateMask?: string[];
}
async function fsCommit(token: string, writes: FsWrite[]): Promise<void> {
  const body = {
    writes: writes.map((w) => ({
      update: { name: `${FS_ROOT}/${w.path}`, fields: w.fields },
      ...(w.updateMask ? { updateMask: { fieldPaths: w.updateMask } } : {}),
    })),
  };
  const res = await fetch(`${FS_ROOT}:commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Firestore commit -> ${res.status}: ${await res.text()}`);
}

// --------------------------------------------------------------------- helpers

const today = () => new Date().toISOString().slice(0, 10);

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function newCardState(now: number) {
  return {
    box: 1,
    dueDate: now,
    createdAt: now,
    lastReviewed: null,
    reviewCount: 0,
    correctCount: 0,
  };
}

const LANG: Record<string, string> = {
  nb: 'Norwegian Bokmål',
  nn: 'Norwegian Nynorsk',
  en: 'English',
  'en-simple': 'simple, plain English',
  de: 'German',
  pl: 'Polish',
  lt: 'Lithuanian',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  it: 'Italian',
  uk: 'Ukrainian',
  ru: 'Russian',
  ar: 'Arabic',
  fa: 'Persian',
  ti: 'Tigrinya',
  so: 'Somali',
  th: 'Thai',
  vi: 'Vietnamese',
  tr: 'Turkish',
};
const langName = (c: string) => LANG[c] || c;

interface RawMistake {
  type: 'grammar' | 'spelling';
  original: string;
  corrected: string;
  translation: string;
  note?: string;
}
interface GradeJson {
  cefr: string;
  categories: { content: string; grammar: string; vocabulary: string; spelling: string };
  positives: string[];
  improve: string[];
  correctedText: string;
  mistakes: RawMistake[];
}

function extractJson(text: string): GradeJson {
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI-svaret var ikke gyldig JSON.');
    return JSON.parse(m[0]);
  }
}

// --------------------------------------------------------------------- handler

export default async (req: Request): Promise<Response> => {
  let token = '';
  let uid = '';
  let writingId = '';
  const writingPath = () => `users/${uid}/writings/${writingId}`;

  try {
    const body = (await req.json()) as { writingId?: string; idToken?: string };
    writingId = String(body.writingId || '');
    token = String(body.idToken || '');
    if (!writingId || !token) return new Response('bad request', { status: 400 });

    uid = await verifyIdToken(token);

    const w = await fsGet(token, writingPath());
    if (!w) return new Response('no writing', { status: 404 });
    if (w.status === 'graded') return new Response('already graded', { status: 200 });

    // --- daily cap (soft: enforced with the user's own token) ---
    const usage = (await fsGet(token, `users/${uid}/meta/usage`)) as
      | { day?: string; grades?: number }
      | null;
    const usedToday = usage?.day === today() ? usage?.grades ?? 0 : 0;
    if (usedToday >= DAILY_CAP) {
      await fsCommit(token, [
        {
          path: writingPath(),
          fields: docFields({
            status: 'error',
            errorMessage: `Du har brukt dagens ${DAILY_CAP} rettinger. Kom tilbake i morgen.`,
            updatedAt: Date.now(),
          }),
          updateMask: ['status', 'errorMessage', 'updatedAt'],
        },
      ]);
      return new Response('rate limited', { status: 429 });
    }

    const targetName = langName(String(w.targetLang || 'nb'));
    const motherName = langName(String(w.motherLang || 'en'));
    const promptText = String(w.promptText || '(ingen oppgavetekst)');
    const text = String(w.text || '');

    const system =
      'Du er en erfaren sensor for Norskprøven og en språklærer. Du vurderer en tekst ' +
      'skrevet av en kandidat som øver til nivå B2. Vær vennlig, konkret og oppmuntrende, ' +
      'slik en god lærer er. Svar KUN med gyldig JSON – ingen tekst utenfor JSON-objektet.';

    const userMsg =
      `Skrivespråk: ${targetName}\n` +
      `Kandidatens morsmål: ${motherName}\n\n` +
      `Oppgave:\n${promptText}\n\n` +
      `Kandidatens tekst:\n"""\n${text}\n"""\n\n` +
      'Gi tilbakemelding som JSON med nøyaktig denne strukturen:\n' +
      `{
  "cefr": "kort nivåestimat, f.eks. \\"B2\\", \\"Rett under B2\\", \\"B1\\"",
  "categories": {
    "content": "én kort norsk setning om innhold og oppgavesvar",
    "grammar": "én kort norsk setning om grammatikk",
    "vocabulary": "én kort norsk setning om ordforråd",
    "spelling": "én kort norsk setning om rettskriving og tegnsetting"
  },
  "positives": ["2-4 korte norske punkter om hva kandidaten gjør bra"],
  "improve": ["2-4 korte norske punkter om hva kandidaten bør se nærmere på"],
  "correctedText": "hele teksten rettet til korrekt, naturlig norsk. Behold kandidatens innhold og stil.",
  "mistakes": [
    {
      "type": "grammar eller spelling",
      "original": "den korte feilaktige delen slik kandidaten skrev den (noen få ord, ikke hele setninger)",
      "corrected": "den samme delen rettet til korrekt norsk",
      "translation": "den RETTEDE delen oversatt til ${motherName}",
      "note": "kort forklaring paa ${motherName}, maks 8 ord"
    }
  ]
}\n` +
      `Ikke ta med rene stil-/preferansevalg. Maks ${MAX_MISTAKES} elementer i "mistakes".`;

    const msg = await anthropic.messages.create({
      model: GRADE_MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });

    const rawText =
      msg.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '';
    const grade = extractJson(rawText);

    const mistakes = (grade.mistakes || [])
      .filter((m) => m && m.original && m.corrected && m.translation)
      .slice(0, MAX_MISTAKES);

    const now = Date.now();
    const writes: FsWrite[] = [
      {
        path: writingPath(),
        fields: docFields({
          status: 'graded',
          updatedAt: now,
          mistakeCount: mistakes.length,
          grade: {
            cefr: grade.cefr || 'Ukjent',
            categories: {
              content: grade.categories?.content || '',
              grammar: grade.categories?.grammar || '',
              vocabulary: grade.categories?.vocabulary || '',
              spelling: grade.categories?.spelling || '',
            },
            positives: (grade.positives || []).slice(0, 6),
            improve: (grade.improve || []).slice(0, 6),
            correctedText: grade.correctedText || text,
          },
        }),
        updateMask: ['status', 'updatedAt', 'mistakeCount', 'grade'],
      },
    ];

    for (const m of mistakes) {
      const dedupeKey = `${m.original.trim().toLowerCase()}=>${m.corrected.trim().toLowerCase()}`;
      writes.push({
        path: `users/${uid}/mistakes/${writingId}__${fnv1a(dedupeKey)}`,
        fields: docFields({
          writingId,
          type: m.type === 'spelling' ? 'spelling' : 'grammar',
          original: m.original.trim(),
          corrected: m.corrected.trim(),
          translation: m.translation.trim(),
          note: (m.note || '').trim() || null,
          dedupeKey,
          ...newCardState(now),
        }),
      });
    }

    writes.push({
      path: `users/${uid}/meta/usage`,
      fields: docFields({ day: today(), grades: usedToday + 1, updatedAt: now }),
    });

    await fsCommit(token, writes);
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('[grade] failed:', err);
    if (token && uid && writingId) {
      await fsCommit(token, [
        {
          path: writingPath(),
          fields: docFields({
            status: 'error',
            errorMessage: 'Rettingen feilet. Prøv igjen om litt.',
            updatedAt: Date.now(),
          }),
          updateMask: ['status', 'errorMessage', 'updatedAt'],
        },
      ]).catch(() => {});
    }
    return new Response('error', { status: 500 });
  }
};
