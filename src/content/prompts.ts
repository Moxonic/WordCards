// Original practice tasks written in the style of the B2 Norskprøve writing part.
// Not copied from any real exam. Two task types: a personal e-post, and a
// drøftingstekst where you argue a case.

export type PromptKind = 'epost' | 'drofting';

export interface Prompt {
  id: string;
  kind: PromptKind;
  title: string;
  /** The task shown to the writer, in Norwegian. */
  no: string;
  /** Short gloss so non-Norwegian speakers can pick. */
  en: string;
  /** Rough word range for a B2 answer. */
  words: [number, number];
}

export const PROMPTS: Prompt[] = [
  {
    id: 'epost-flytte',
    kind: 'epost',
    title: 'E-post: du flytter',
    no: 'Du skal flytte til en ny by. Skriv en e-post til en venn. Fortell hvorfor du flytter, hva du gleder deg til og hva du kommer til å savne. Spør om vennen kan hjelpe deg med flyttingen.',
    en: 'Email a friend about moving to a new city: why, what you look forward to, what you will miss, and ask for help.',
    words: [120, 200],
  },
  {
    id: 'epost-jobb',
    kind: 'epost',
    title: 'E-post: ny jobb',
    no: 'Du har begynt i en ny jobb. Skriv en e-post til en tidligere kollega. Fortell om den nye arbeidsplassen, hva som er bra og hva som er vanskelig. Foreslå at dere møtes snart.',
    en: 'Email a former colleague about your new job: the workplace, what is good, what is hard, and suggest meeting up.',
    words: [120, 200],
  },
  {
    id: 'epost-kurs',
    kind: 'epost',
    title: 'E-post: anbefal et kurs',
    no: 'En venn vurderer å ta det samme kurset som du nettopp har fullført. Skriv en e-post der du forteller om kurset, hva du lærte, hvor mye tid det tok, og om du vil anbefale det.',
    en: 'Email a friend about a course you finished: what you learned, the workload, and whether you recommend it.',
    words: [120, 200],
  },
  {
    id: 'epost-naboklage',
    kind: 'epost',
    title: 'E-post: til styret i borettslaget',
    no: 'Det har vært mye støy i blokka der du bor. Skriv en e-post til styret i borettslaget. Beskriv problemet, forklar hvordan det påvirker deg, og foreslå hva som kan gjøres.',
    en: 'Email your housing association board about noise in the building: the problem, how it affects you, and a suggestion.',
    words: [130, 220],
  },
  {
    id: 'epost-takk',
    kind: 'epost',
    title: 'E-post: takk for hjelpen',
    no: 'Noen har hjulpet deg i en vanskelig periode. Skriv en e-post der du takker for hjelpen. Fortell hva hjelpen betydde for deg, og inviter personen til middag.',
    en: 'Email a thank-you to someone who helped you through a hard time, say what it meant, and invite them to dinner.',
    words: [110, 180],
  },
  {
    id: 'drofting-mobil-skole',
    kind: 'drofting',
    title: 'Drøfting: mobil på skolen',
    no: 'Noen mener at mobiltelefoner bør være forbudt i skoletiden. Skriv en tekst der du drøfter fordeler og ulemper med et slikt forbud. Gjør rede for ulike synspunkter og kom fram til din egen mening.',
    en: 'Discuss the pros and cons of banning phones during school hours, present different views, and give your own opinion.',
    words: [200, 350],
  },
  {
    id: 'drofting-hjemmekontor',
    kind: 'drofting',
    title: 'Drøfting: hjemmekontor',
    no: 'Etter pandemien jobber mange helt eller delvis hjemmefra. Skriv en tekst der du drøfter hva hjemmekontor betyr for arbeidstakere og for samfunnet. Bruk eksempler og begrunn din egen mening.',
    en: 'Discuss what working from home means for employees and for society; use examples and justify your view.',
    words: [200, 350],
  },
  {
    id: 'drofting-kollektivtransport',
    kind: 'drofting',
    title: 'Drøfting: gratis kollektivtransport',
    no: 'Noen politikere vil gjøre buss og bane gratis for alle. Skriv en tekst der du drøfter mulige konsekvenser av et slikt forslag, både positive og negative, og forklar hva du selv mener.',
    en: 'Discuss the possible consequences of making public transport free for everyone, and state your own position.',
    words: [200, 350],
  },
  {
    id: 'drofting-frivillig-arbeid',
    kind: 'drofting',
    title: 'Drøfting: frivillig arbeid',
    no: 'I Norge deltar mange i frivillig arbeid, for eksempel i idrettslag og organisasjoner. Skriv en tekst der du drøfter hvorfor frivillig arbeid er viktig, hvilke utfordringer det har, og hva som skal til for at flere deltar.',
    en: 'Discuss why volunteering matters, its challenges, and what would get more people involved.',
    words: [200, 350],
  },
  {
    id: 'drofting-sosiale-medier',
    kind: 'drofting',
    title: 'Drøfting: sosiale medier og ungdom',
    no: 'Sosiale medier er en stor del av hverdagen til mange ungdommer. Skriv en tekst der du drøfter hvordan sosiale medier påvirker unge mennesker. Se på både gode og dårlige sider, og kom fram til din egen konklusjon.',
    en: 'Discuss how social media affects young people, covering good and bad sides, and reach your own conclusion.',
    words: [200, 350],
  },
];

export function getPrompt(id: string | undefined): Prompt | undefined {
  return PROMPTS.find((p) => p.id === id);
}
