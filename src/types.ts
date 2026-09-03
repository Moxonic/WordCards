export type WritingStatus = 'draft' | 'grading' | 'graded' | 'error';

export type MistakeType = 'grammar' | 'spelling';

export interface GradeCategories {
  content: string;
  grammar: string;
  vocabulary: string;
  spelling: string;
}

/** The AI teacher's assessment, stored on the writing doc. */
export interface Grade {
  cefr: string; // "B2", "Rett under B2", "B1", ...
  categories: GradeCategories;
  positives: string[];
  improve: string[];
  correctedText: string;
}

/** One correction the AI made — becomes a review flashcard. */
export interface RawMistake {
  type: MistakeType;
  original: string; // what the student wrote
  corrected: string; // the fixed Norwegian
  translation: string; // corrected version in the mother tongue
  note?: string; // one-line reason
}

/** Full shape the grading function returns and writes. */
export interface GradeResult extends Grade {
  mistakes: RawMistake[];
}

export interface Writing {
  id: string;
  title: string;
  targetLang: string; // 'nb'
  motherLang: string; // 'en', 'de', ...
  promptId?: string;
  promptText?: string;
  draft: string;
  text: string;
  status: WritingStatus;
  errorMessage?: string;
  attemptOf?: string;
  mistakeCount: number;
  createdAt: number;
  updatedAt: number;
  submittedAt?: number;
  grade?: Grade;
}

/** Leitner review state carried on every mistake card. */
export interface ReviewState {
  box: number;
  dueDate: number;
  createdAt: number;
  lastReviewed: number | null;
  reviewCount: number;
  correctCount: number;
}

export interface Mistake extends ReviewState {
  id: string;
  writingId: string;
  type: MistakeType;
  original: string;
  corrected: string;
  translation: string;
  note?: string;
  dedupeKey: string;
}
