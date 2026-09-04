// Original practice tasks in the style of the B2 Norskprøve writing part. Not
// copied from any real exam. Two task types: a personal e-post, and a
// drøftingstekst where you argue a case.
//
// Each task is offered in every menu language. nb and en are authored; es and de
// are AI translations (see src/i18n/locales) — corrections welcome.

export type PromptKind = 'epost' | 'drofting';

/** One string per menu language. */
export interface Localized {
  nb: string;
  en: string;
  es: string;
  de: string;
}

export interface Prompt {
  id: string;
  kind: PromptKind;
  title: Localized;
  /** The task shown to the writer. */
  text: Localized;
  /** Rough word range for a B2 answer. */
  words: [number, number];
}

/** Resolve a localized field for the given language, falling back to en → nb. */
export function localized(l: Localized, lang: string): string {
  return (l as unknown as Record<string, string>)[lang] ?? l.en ?? l.nb;
}

export const PROMPTS: Prompt[] = [
  {
    id: 'epost-flytte',
    kind: 'epost',
    title: {
      nb: 'E-post: du flytter',
      en: 'Email: you are moving',
      es: 'Correo: te mudas',
      de: 'E-Mail: du ziehst um',
    },
    text: {
      nb: 'Du skal flytte til en ny by. Skriv en e-post til en venn. Fortell hvorfor du flytter, hva du gleder deg til og hva du kommer til å savne. Spør om vennen kan hjelpe deg med flyttingen.',
      en: 'You are moving to a new city. Write an email to a friend. Say why you are moving, what you are looking forward to and what you will miss. Ask whether your friend can help you with the move.',
      es: 'Te vas a mudar a una ciudad nueva. Escribe un correo a un amigo. Cuéntale por qué te mudas, qué te hace ilusión y qué vas a echar de menos. Pregúntale si puede ayudarte con la mudanza.',
      de: 'Du ziehst in eine neue Stadt. Schreibe eine E-Mail an eine Freundin oder einen Freund. Erzähle, warum du umziehst, worauf du dich freust und was du vermissen wirst. Frage, ob die Person dir beim Umzug helfen kann.',
    },
    words: [120, 200],
  },
  {
    id: 'epost-jobb',
    kind: 'epost',
    title: {
      nb: 'E-post: ny jobb',
      en: 'Email: a new job',
      es: 'Correo: un trabajo nuevo',
      de: 'E-Mail: neuer Job',
    },
    text: {
      nb: 'Du har begynt i en ny jobb. Skriv en e-post til en tidligere kollega. Fortell om den nye arbeidsplassen, hva som er bra og hva som er vanskelig. Foreslå at dere møtes snart.',
      en: 'You have started a new job. Write an email to a former colleague. Tell them about the new workplace, what is good and what is difficult. Suggest that you meet up soon.',
      es: 'Has empezado un trabajo nuevo. Escribe un correo a un antiguo compañero. Háblale del nuevo puesto, de lo que está bien y de lo que resulta difícil. Propón que quedéis pronto.',
      de: 'Du hast eine neue Stelle angetreten. Schreibe eine E-Mail an eine frühere Kollegin oder einen früheren Kollegen. Berichte über den neuen Arbeitsplatz, was gut ist und was schwierig ist. Schlage vor, dass ihr euch bald trefft.',
    },
    words: [120, 200],
  },
  {
    id: 'epost-kurs',
    kind: 'epost',
    title: {
      nb: 'E-post: anbefal et kurs',
      en: 'Email: recommend a course',
      es: 'Correo: recomendar un curso',
      de: 'E-Mail: einen Kurs empfehlen',
    },
    text: {
      nb: 'En venn vurderer å ta det samme kurset som du nettopp har fullført. Skriv en e-post der du forteller om kurset, hva du lærte, hvor mye tid det tok, og om du vil anbefale det.',
      en: 'A friend is thinking about taking the same course you have just finished. Write an email telling them about the course, what you learned, how much time it took, and whether you would recommend it.',
      es: 'Un amigo está pensando en hacer el mismo curso que tú acabas de terminar. Escribe un correo en el que le hables del curso, de lo que aprendiste, del tiempo que te llevó y de si lo recomendarías.',
      de: 'Eine Freundin oder ein Freund überlegt, denselben Kurs zu belegen, den du gerade abgeschlossen hast. Schreibe eine E-Mail, in der du von dem Kurs erzählst: was du gelernt hast, wie viel Zeit er gekostet hat und ob du ihn empfehlen würdest.',
    },
    words: [120, 200],
  },
  {
    id: 'epost-naboklage',
    kind: 'epost',
    title: {
      nb: 'E-post: til styret i borettslaget',
      en: 'Email: to the housing board',
      es: 'Correo: a la junta de vecinos',
      de: 'E-Mail: an den Vorstand der Hausgemeinschaft',
    },
    text: {
      nb: 'Det har vært mye støy i blokka der du bor. Skriv en e-post til styret i borettslaget. Beskriv problemet, forklar hvordan det påvirker deg, og foreslå hva som kan gjøres.',
      en: 'There has been a lot of noise in the building where you live. Write an email to the housing association board. Describe the problem, explain how it affects you, and suggest what could be done.',
      es: 'Ha habido mucho ruido en el edificio donde vives. Escribe un correo a la junta de la comunidad de vecinos. Describe el problema, explica cómo te afecta y propón qué se podría hacer.',
      de: 'In dem Haus, in dem du wohnst, gab es viel Lärm. Schreibe eine E-Mail an den Vorstand der Hausgemeinschaft. Beschreibe das Problem, erkläre, wie es dich beeinträchtigt, und schlage vor, was man tun könnte.',
    },
    words: [130, 220],
  },
  {
    id: 'epost-takk',
    kind: 'epost',
    title: {
      nb: 'E-post: takk for hjelpen',
      en: 'Email: thanks for the help',
      es: 'Correo: gracias por la ayuda',
      de: 'E-Mail: danke für die Hilfe',
    },
    text: {
      nb: 'Noen har hjulpet deg i en vanskelig periode. Skriv en e-post der du takker for hjelpen. Fortell hva hjelpen betydde for deg, og inviter personen til middag.',
      en: 'Someone helped you through a difficult time. Write an email thanking them for their help. Say what the help meant to you, and invite the person to dinner.',
      es: 'Alguien te ayudó en una época difícil. Escribe un correo para darle las gracias por su ayuda. Cuéntale lo que significó para ti e invítale a cenar.',
      de: 'Jemand hat dir in einer schwierigen Zeit geholfen. Schreibe eine E-Mail, in der du dich für die Hilfe bedankst. Erzähle, was die Hilfe dir bedeutet hat, und lade die Person zum Abendessen ein.',
    },
    words: [110, 180],
  },
  {
    id: 'drofting-mobil-skole',
    kind: 'drofting',
    title: {
      nb: 'Drøfting: mobil på skolen',
      en: 'Discussion: phones at school',
      es: 'Ensayo: móviles en la escuela',
      de: 'Erörterung: Handys in der Schule',
    },
    text: {
      nb: 'Noen mener at mobiltelefoner bør være forbudt i skoletiden. Skriv en tekst der du drøfter fordeler og ulemper med et slikt forbud. Gjør rede for ulike synspunkter og kom fram til din egen mening.',
      en: 'Some people think mobile phones should be banned during school hours. Write a text discussing the advantages and disadvantages of such a ban. Present different points of view and reach your own opinion.',
      es: 'Hay quien opina que los móviles deberían prohibirse durante el horario escolar. Escribe un texto en el que analices las ventajas y los inconvenientes de esa prohibición. Expón distintos puntos de vista y llega a tu propia opinión.',
      de: 'Manche meinen, Handys sollten während der Schulzeit verboten sein. Schreibe einen Text, in dem du die Vor- und Nachteile eines solchen Verbots erörterst. Stelle verschiedene Standpunkte dar und komme zu einer eigenen Meinung.',
    },
    words: [200, 350],
  },
  {
    id: 'drofting-hjemmekontor',
    kind: 'drofting',
    title: {
      nb: 'Drøfting: hjemmekontor',
      en: 'Discussion: working from home',
      es: 'Ensayo: el teletrabajo',
      de: 'Erörterung: Homeoffice',
    },
    text: {
      nb: 'Etter pandemien jobber mange helt eller delvis hjemmefra. Skriv en tekst der du drøfter hva hjemmekontor betyr for arbeidstakere og for samfunnet. Bruk eksempler og begrunn din egen mening.',
      en: 'Since the pandemic, many people work fully or partly from home. Write a text discussing what working from home means for employees and for society. Use examples and justify your own opinion.',
      es: 'Desde la pandemia, mucha gente trabaja total o parcialmente desde casa. Escribe un texto en el que analices lo que el teletrabajo supone para los empleados y para la sociedad. Usa ejemplos y justifica tu propia opinión.',
      de: 'Seit der Pandemie arbeiten viele ganz oder teilweise von zu Hause. Schreibe einen Text, in dem du erörterst, was das Homeoffice für Arbeitnehmer und für die Gesellschaft bedeutet. Verwende Beispiele und begründe deine eigene Meinung.',
    },
    words: [200, 350],
  },
  {
    id: 'drofting-kollektivtransport',
    kind: 'drofting',
    title: {
      nb: 'Drøfting: gratis kollektivtransport',
      en: 'Discussion: free public transport',
      es: 'Ensayo: transporte público gratuito',
      de: 'Erörterung: kostenloser Nahverkehr',
    },
    text: {
      nb: 'Noen politikere vil gjøre buss og bane gratis for alle. Skriv en tekst der du drøfter mulige konsekvenser av et slikt forslag, både positive og negative, og forklar hva du selv mener.',
      en: 'Some politicians want to make buses and trains free for everyone. Write a text discussing the possible consequences of such a proposal, both positive and negative, and explain what you think yourself.',
      es: 'Algunos políticos quieren que el autobús y el metro sean gratuitos para todos. Escribe un texto en el que analices las posibles consecuencias de esa propuesta, tanto positivas como negativas, y explica qué opinas tú.',
      de: 'Manche Politiker wollen Bus und Bahn für alle kostenlos machen. Schreibe einen Text, in dem du die möglichen Folgen eines solchen Vorschlags erörterst – positive wie negative – und erkläre, was du selbst denkst.',
    },
    words: [200, 350],
  },
  {
    id: 'drofting-frivillig-arbeid',
    kind: 'drofting',
    title: {
      nb: 'Drøfting: frivillig arbeid',
      en: 'Discussion: volunteering',
      es: 'Ensayo: el voluntariado',
      de: 'Erörterung: ehrenamtliche Arbeit',
    },
    text: {
      nb: 'I Norge deltar mange i frivillig arbeid, for eksempel i idrettslag og organisasjoner. Skriv en tekst der du drøfter hvorfor frivillig arbeid er viktig, hvilke utfordringer det har, og hva som skal til for at flere deltar.',
      en: 'In Norway, many people take part in volunteer work, for example in sports clubs and organisations. Write a text discussing why volunteering matters, what challenges it faces, and what it would take to get more people involved.',
      es: 'En Noruega, mucha gente participa en el voluntariado, por ejemplo en clubes deportivos y organizaciones. Escribe un texto en el que analices por qué es importante el voluntariado, qué dificultades tiene y qué haría falta para que participara más gente.',
      de: 'In Norwegen engagieren sich viele Menschen ehrenamtlich, zum Beispiel in Sportvereinen und Organisationen. Schreibe einen Text, in dem du erörterst, warum ehrenamtliche Arbeit wichtig ist, welche Herausforderungen es gibt und was nötig wäre, damit sich mehr Menschen beteiligen.',
    },
    words: [200, 350],
  },
  {
    id: 'drofting-sosiale-medier',
    kind: 'drofting',
    title: {
      nb: 'Drøfting: sosiale medier og ungdom',
      en: 'Discussion: social media and young people',
      es: 'Ensayo: redes sociales y juventud',
      de: 'Erörterung: soziale Medien und Jugendliche',
    },
    text: {
      nb: 'Sosiale medier er en stor del av hverdagen til mange ungdommer. Skriv en tekst der du drøfter hvordan sosiale medier påvirker unge mennesker. Se på både gode og dårlige sider, og kom fram til din egen konklusjon.',
      en: 'Social media is a big part of everyday life for many young people. Write a text discussing how social media affects young people. Look at both good and bad sides, and reach your own conclusion.',
      es: 'Las redes sociales son una parte importante del día a día de muchos jóvenes. Escribe un texto en el que analices cómo influyen las redes sociales en los jóvenes. Considera los aspectos buenos y malos y llega a tu propia conclusión.',
      de: 'Soziale Medien sind für viele Jugendliche ein großer Teil des Alltags. Schreibe einen Text, in dem du erörterst, wie soziale Medien junge Menschen beeinflussen. Betrachte gute und schlechte Seiten und komme zu einer eigenen Schlussfolgerung.',
    },
    words: [200, 350],
  },
];

export function getPrompt(id: string | undefined): Prompt | undefined {
  return PROMPTS.find((p) => p.id === id);
}
