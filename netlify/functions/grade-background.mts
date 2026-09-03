import Anthropic from '@anthropic-ai/sdk';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const GRADE_MODEL = 'claude-sonnet-5'; // one-line switch to claude-opus-5 / claude-haiku-4-5
const DAILY_CAP = 12;
const MAX_MISTAKES = 25;

// --- Firebase Admin (init once) ---
if (!getApps().length) {
  const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  initializeApp({ credential: cert(svc) });
}
const db = getFirestore();
const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY

const LANG_NAMES: Record<string, string> = {
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
const langName = (c: string) => LANG_NAMES[c] || c;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// small stable hash for deterministic mistake doc ids
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
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI-svaret var ikke gyldig JSON.');
    return JSON.parse(m[0]);
  }
}

export default async (req: Request): Promise<Response> => {
  let uid = '';
  let writingId = '';
  const writingPath = () => db.doc(`users/${uid}/writings/${writingId}`);

  try {
    const body = (await req.json()) as { writingId?: string; idToken?: string };
    writingId = String(body.writingId || '');
    const idToken = String(body.idToken || '');
    if (!writingId || !idToken) return new Response('bad request', { status: 400 });

    const decoded = await getAuth().verifyIdToken(idToken);
    uid = decoded.uid;

    const snap = await writingPath().get();
    if (!snap.exists) return new Response('no writing', { status: 404 });
    const w = snap.data() as Record<string, unknown>;
    if (w.status === 'graded') return new Response('already graded', { status: 200 });

    // --- daily cap ---
    const usageRef = db.doc(`users/${uid}/meta/usage`);
    const usage = (await usageRef.get()).data() as { day?: string; grades?: number } | undefined;
    const usedToday = usage?.day === today() ? usage?.grades ?? 0 : 0;
    if (usedToday >= DAILY_CAP) {
      await writingPath().update({
        status: 'error',
        errorMessage: `Du har brukt dagens ${DAILY_CAP} rettinger. Kom tilbake i morgen.`,
        updatedAt: Date.now(),
      });
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
    const batch = db.batch();

    batch.update(writingPath(), {
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
    });

    for (const m of mistakes) {
      const dedupeKey = `${m.original.trim().toLowerCase()}=>${m.corrected.trim().toLowerCase()}`;
      const docId = `${writingId}__${fnv1a(dedupeKey)}`;
      batch.set(db.doc(`users/${uid}/mistakes/${docId}`), {
        writingId,
        type: m.type === 'spelling' ? 'spelling' : 'grammar',
        original: m.original.trim(),
        corrected: m.corrected.trim(),
        translation: m.translation.trim(),
        note: (m.note || '').trim() || null,
        dedupeKey,
        ...newCardState(now),
      });
    }

    batch.set(
      usageRef,
      { day: today(), grades: usedToday + 1, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

    await batch.commit();
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('[grade] failed:', err);
    if (uid && writingId) {
      await writingPath()
        .update({
          status: 'error',
          errorMessage: 'Rettingen feilet. Prøv igjen om litt.',
          updatedAt: Date.now(),
        })
        .catch(() => {});
    }
    return new Response('error', { status: 500 });
  }
};
