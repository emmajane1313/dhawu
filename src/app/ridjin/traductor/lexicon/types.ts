export type MeaningKey = string;
export type LexiconLanguage = "es" | "en";
export type MarkerPos = "adverb" | "connector" | "punctuation";
export type ConnectorRole = "list" | "clause";

export interface LexemeBase {
  meaningKey: MeaningKey;
  gup: string;
  tags?: string[];
}

export interface RelatedLexemes {
  nouns?: MeaningKey[];
  adjectives?: MeaningKey[];
  verbs?: MeaningKey[];
}

export interface NounEntry extends LexemeBase {
  pos: "noun";
  plurals: string[];
  isHuman?: boolean;
  posture?: "lying" | "standing";
  isPlace?: boolean;
  isCause?: boolean;
  related?: RelatedLexemes;
  formsByLang?: Record<LexiconLanguage, string[]>;
  pluralFormsByLang?: Record<LexiconLanguage, string[]>;
}

export interface VerbForms {
  infinitive: string;
  presentIndicative: [string, string, string, string, string, string];
  preterite: [string, string, string, string, string, string];
  imperfect: [string, string, string, string, string, string];
  future: [string, string, string, string, string, string];
  conditional: [string, string, string, string, string, string];
  presentSubjunctive: [string, string, string, string, string, string];
  imperfectSubjunctive?: [string, string, string, string, string, string];
  imperative: {
    yo?: string;
    tu: string;
    usted: string;
    nosotros: string;
    vosotros: string;
    ustedes: string;
  };
  negativeImperative?: {
    yo?: string;
    tu: string;
    usted: string;
    nosotros: string;
    vosotros: string;
    ustedes: string;
  };
  gerund: string;
  pastParticiple: string;
}

export interface VerbDerivedForms {
  pastParticipleAdjectives?: Record<LexiconLanguage, string[]>;
  verbalNouns?: Record<LexiconLanguage, string[]>;
  agentNouns?: Record<LexiconLanguage, string[]>;
  relatedNouns?: Record<LexiconLanguage, string[]>;
  relatedAdjectives?: Record<LexiconLanguage, string[]>;
}

export interface VerbEntry extends LexemeBase {
  pos: "verb";
  verbGroup: number;
  gupForms: string[];
  plurals: string[];
  isTransitive: boolean;
  isPlural: boolean;
  isDjal?: boolean;
  isMarnggi?: boolean;
  isBecomeVerb?: boolean;
  isMakeVerb?: boolean;
  isEmotion?: boolean;
  isDitransitive?: boolean;
  isHaveVerb?: boolean;
  motionType?: "motion" | "stationary";
  noInfinitiveSuffix?: boolean;
  related?: RelatedLexemes;
  conjugations: Record<LexiconLanguage, VerbForms[]>;
  derived?: VerbDerivedForms;
}

export interface AdjectiveEntry extends LexemeBase {
  pos: "adjective";
  related?: RelatedLexemes;
  formsByLang?: Record<LexiconLanguage, string[]>;
  pluralFormsByLang?: Record<LexiconLanguage, string[]>;
}

export interface MarkerEntry extends LexemeBase {
  pos: MarkerPos;
  formsByLang?: Record<LexiconLanguage, string[]>;
  breaksObjectWindow?: boolean;
  connectorRole?: ConnectorRole;
  timeRole?: "today" | "yesterday" | "future";
  locationRole?: "stationary" | "motion";
}

export interface Lexicon {
  nouns: Record<string, NounEntry>;
  verbs: Record<string, VerbEntry>;
  adjectives: Record<string, AdjectiveEntry>;
  markers?: Record<string, MarkerEntry>;
}
