import { LanguageMode } from "@/app/components/types/components.type";
import {
  ExplanationPayload,
  PersonNumber,
  TranslationAlternative,
  TranslationPart,
} from "../core/types";
import {
  POSSESSIVE_PRONOUNS_EMPHATIC_GUP,
  POSSESSIVE_PRONOUNS_GUP,
} from "../constants";
import { SUBJECT_PRONOUNS_GUP } from "../rules/pronoun";
import { getComitativePronounForms, getComitativePronounNoteKey } from "../rules/comitativePronoun";
import {
  ObjectPronounKey,
  ObjectPronounMatch,
  matchObjectPronoun,
} from "../rules/objectPronoun";
import { matchVerbAt } from "../rules/verb";
import {
  matchArticleAt,
  matchMarkerAt,
  matchNounAt,
  isOtherGroupPatternAt,
  NounMatch,
} from "./lexiconMatch";
import {
  ConnectorMatch,
  buildConnectorPart,
  isBreakAdverbToken,
  isClauseConnectorToken,
  matchConnectorAt,
} from "./connectors";
import { matchDhiyakuDeterminerAt } from "./dhiyaku";
import { matchDemonstrativeToken } from "./demonstratives";
import { isNegatorToken } from "./negation";
import { buildDefiniteArticlePart, finalizePart } from "./parts";
import {
  buildNounPhraseParts,
  isAllativePrepositionStart,
  isComitativePrepositionStart,
  isLocativePrepositionStart,
  matchNounPhraseAfterArticle,
  NounPhraseMatch,
} from "./objects";
import {
  TokenLike,
  isStrongPunctuationToken,
  normalizeToken,
  stripSpanishDiacritics,
  matchSequence,
} from "./tokenUtils";
import {
  applyPossessiveSuffix,
  getComitativePossessiveSuffixes,
  getPossessiveSuffixes,
} from "./suffixes";
import {
  buildPossessivePronounPart,
  matchPossessiveDeterminer,
  matchPossessiveEmphasisAt,
  matchPossessiveOfPronoun,
  PossessivePersonMatch,
} from "./possession";

export type ModalKind = "djal" | "marnggi";

export type ModalMatch = {
  kind: ModalKind;
  consumed: number;
  objectStart: number;
  source: string;
  persons: PersonNumber[];
  negated?: boolean;
  negatorSource?: string;
};

export type ModalPendingObject =
  | { kind: "pronoun"; match: ObjectPronounMatch }
  | { kind: "noun"; match: NounMatch }
  | null;

const PERSON_BY_INDEX: PersonNumber[] = [
  "1_Sing",
  "2_Sing",
  "3_Sing",
  "1+2_Plur",
  "2_Plur",
  "3_Plur",
];

const normalizeModal = (value: string, lang: LanguageMode): string => {
  const normalized = normalizeToken(value, lang);
  return lang === "es" ? stripSpanishDiacritics(normalized) : normalized;
};

const buildFormMap = (
  lang: LanguageMode,
  entries: Array<{ kind: ModalKind; forms: string[] }>
): Record<string, { kind: ModalKind; persons: PersonNumber[] }> => {
  const map: Record<string, { kind: ModalKind; persons: PersonNumber[] }> = {};
  for (const entry of entries) {
    entry.forms.forEach((form, idx) => {
      const key = normalizeModal(form, lang);
      map[key] = { kind: entry.kind, persons: [PERSON_BY_INDEX[idx]] };
    });
  }
  return map;
};

const MODAL_VERBS_ES = buildFormMap("es", [
  {
    kind: "djal",
    forms: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
  },
  {
    kind: "djal",
    forms: [
      "necesito",
      "necesitas",
      "necesita",
      "necesitamos",
      "necesitáis",
      "necesitan",
    ],
  },
  {
    kind: "djal",
    forms: ["deseo", "deseas", "desea", "deseamos", "deseáis", "desean"],
  },
  {
    kind: "djal",
    forms: ["anhelo", "anhelas", "anhela", "anhelamos", "anheláis", "anhelan"],
  },
  {
    kind: "marnggi",
    forms: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
  },
  {
    kind: "marnggi",
    forms: [
      "conozco",
      "conoces",
      "conoce",
      "conocemos",
      "conocéis",
      "conocen",
    ],
  },
  {
    kind: "marnggi",
    forms: [
      "entiendo",
      "entiendes",
      "entiende",
      "entendemos",
      "entendéis",
      "entienden",
    ],
  },
  {
    kind: "marnggi",
    forms: [
      "comprendo",
      "comprendes",
      "comprende",
      "comprendemos",
      "comprendéis",
      "comprenden",
    ],
  },
  {
    kind: "marnggi",
    forms: [
      "acostumbro",
      "acostumbras",
      "acostumbra",
      "acostumbramos",
      "acostumbráis",
      "acostumbran",
    ],
  },
]);

const MODAL_VERBS_EN: Record<string, { kind: ModalKind; persons: PersonNumber[] }> = {
  want: { kind: "djal", persons: ["1_Sing", "2_Sing", "1+2_Plur", "2_Plur", "3_Plur"] },
  wants: { kind: "djal", persons: ["3_Sing"] },
  need: { kind: "djal", persons: ["1_Sing", "2_Sing", "1+2_Plur", "2_Plur", "3_Plur"] },
  needs: { kind: "djal", persons: ["3_Sing"] },
  desire: { kind: "djal", persons: ["1_Sing", "2_Sing", "1+2_Plur", "2_Plur", "3_Plur"] },
  desires: { kind: "djal", persons: ["3_Sing"] },
  know: { kind: "marnggi", persons: ["1_Sing", "2_Sing", "1+2_Plur", "2_Plur", "3_Plur"] },
  knows: { kind: "marnggi", persons: ["3_Sing"] },
  understand: { kind: "marnggi", persons: ["1_Sing", "2_Sing", "1+2_Plur", "2_Plur", "3_Plur"] },
  understands: { kind: "marnggi", persons: ["3_Sing"] },
};

const COPULA_FORMS_ES: Record<string, PersonNumber[]> = {
  estoy: ["1_Sing"],
  estas: ["2_Sing"],
  está: ["3_Sing"],
  esta: ["3_Sing"],
  estamos: ["1+2_Plur"],
  estáis: ["2_Plur"],
  estais: ["2_Plur"],
  están: ["3_Plur"],
  estan: ["3_Plur"],
  soy: ["1_Sing"],
  eres: ["2_Sing"],
  es: ["3_Sing"],
  somos: ["1+2_Plur"],
  sois: ["2_Plur"],
  son: ["3_Plur"],
};

const COPULA_FORMS_EN: Record<string, PersonNumber[]> = {
  am: ["1_Sing"],
  is: ["3_Sing"],
  are: ["2_Sing", "1+2_Plur", "2_Plur", "3_Plur"],
};

const MODAL_ADJECTIVES_ES = new Set(
  [
    "acostumbrado",
    "acostumbrada",
    "acostumbrados",
    "acostumbradas",
    "habituado",
    "habituada",
    "habituados",
    "habituadas",
    "experimentado",
    "experimentada",
    "experimentados",
    "experimentadas",
  ].map((item) => normalizeModal(item, "es"))
);

const MODAL_ADJECTIVES_EN = new Set(
  ["accustomed", "experienced"].map((item) => normalizeModal(item, "en"))
);

const EXPERIENCE_FORMS_ES: Record<string, PersonNumber[]> = {
  tengo: ["1_Sing"],
  tienes: ["2_Sing"],
  tiene: ["3_Sing"],
  tenemos: ["1+2_Plur"],
  tenéis: ["2_Plur"],
  teneis: ["2_Plur"],
  tienen: ["3_Plur"],
};

const EXPERIENCE_FORMS_EN: Record<string, PersonNumber[]> = {
  have: ["1_Sing", "2_Sing", "1+2_Plur", "2_Plur", "3_Plur"],
  has: ["3_Sing"],
};

const REFLEXIVE_ES = new Set(["me", "te", "se", "nos", "os"]);

const MODAL_OBJECT_PRONOUNS_ES: Record<string, ObjectPronounMatch> = {
  "él": { source: "él", primaryKey: "3_Sing", allowDrop: false },
  ella: { source: "ella", primaryKey: "3_Sing", allowDrop: false },
  ellos: { source: "ellos", primaryKey: "3_Plur", allowDrop: false },
  ellas: { source: "ellas", primaryKey: "3_Plur", allowDrop: false },
  usted: { source: "usted", primaryKey: "3_Sing", allowDrop: false },
  ustedes: { source: "ustedes", primaryKey: "2_Plur", allowDrop: false },
  nosotros: {
    source: "nosotros",
    primaryKey: "1+2_Plur_Incl",
    alternativeKeys: ["1+2_Plur_Excl"],
    allowDrop: false,
  },
  nosotras: {
    source: "nosotras",
    primaryKey: "1+2_Plur_Incl",
    alternativeKeys: ["1+2_Plur_Excl"],
    allowDrop: false,
  },
  vosotros: { source: "vosotros", primaryKey: "2_Plur", allowDrop: false },
  vosotras: { source: "vosotras", primaryKey: "2_Plur", allowDrop: false },
  ti: { source: "ti", primaryKey: "2_Sing", allowDrop: false },
  "mí": { source: "mí", primaryKey: "1_Sing", allowDrop: false },
  mi: { source: "mi", primaryKey: "1_Sing", allowDrop: false },
};

function matchModalObjectPronoun(
  token: string,
  sourceLang: LanguageMode
): ObjectPronounMatch | null {
  const base = matchObjectPronoun(token, sourceLang);
  if (base) return base;
  if (sourceLang !== "es") return null;
  const normalized = normalizeToken(token, sourceLang);
  const match = MODAL_OBJECT_PRONOUNS_ES[normalized];
  if (!match) return null;
  return { ...match, source: token };
}

function resolveVerbMatch(
  token: string,
  lang: LanguageMode
): { kind: ModalKind; persons: PersonNumber[] } | null {
  const normalized = normalizeModal(token, lang);
  if (lang === "es") {
    const rawNormalized = normalizeToken(token, lang);
    if (normalized === "se" && rawNormalized === "se") {
      return null;
    }
    return MODAL_VERBS_ES[normalized] ?? null;
  }
  return MODAL_VERBS_EN[normalized] ?? null;
}

export function matchModalVerbAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): ModalMatch | null {
  const token = tokens[index];
  if (!token) return null;
  const resolved = resolveVerbMatch(token.source, sourceLang);
  if (!resolved) return null;
  return {
    kind: resolved.kind,
    consumed: 1,
    objectStart: index + 1,
    source: token.source,
    persons: resolved.persons,
  };
}

export function matchModalReflexiveAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): ModalMatch | null {
  if (sourceLang !== "es") return null;
  const token = tokens[index];
  const next = tokens[index + 1];
  if (!token || !next) return null;
  const normalized = normalizeModal(token.source, sourceLang);
  if (!REFLEXIVE_ES.has(normalized)) return null;
  const resolved = resolveVerbMatch(next.source, sourceLang);
  if (!resolved || resolved.kind !== "marnggi") return null;
  return {
    kind: resolved.kind,
    consumed: 2,
    objectStart: index + 2,
    source: next.source,
    persons: resolved.persons,
  };
}

export function matchModalCopulaAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): ModalMatch | null {
  const token = tokens[index];
  const next = tokens[index + 1];
  if (!token || !next) return null;
  const normalized = normalizeModal(token.source, sourceLang);
  const nextNormalized = normalizeModal(next.source, sourceLang);
  const persons =
    sourceLang === "es"
      ? COPULA_FORMS_ES[normalized]
      : COPULA_FORMS_EN[normalized];
  if (!persons) return null;
  const adjectives = sourceLang === "es" ? MODAL_ADJECTIVES_ES : MODAL_ADJECTIVES_EN;
  let adjectiveToken = next;
  let adjectiveNormalized = nextNormalized;
  let consumed = 2;
  let objectStart = index + 2;
  let negated = false;
  let negatorSource: string | undefined;

  if (sourceLang === "en" && nextNormalized === "not") {
    const adjToken = tokens[index + 2];
    if (!adjToken) return null;
    const adjNormalized = normalizeModal(adjToken.source, sourceLang);
    if (!adjectives.has(adjNormalized)) return null;
    adjectiveToken = adjToken;
    adjectiveNormalized = adjNormalized;
    consumed = 3;
    objectStart = index + 3;
    negated = true;
    negatorSource = next.source;
  } else if (!adjectives.has(adjectiveNormalized)) {
    return null;
  }

  if (sourceLang === "en") {
    if (adjectiveNormalized === "accustomed") {
      const maybeTo = tokens[index + consumed];
      if (maybeTo && normalizeModal(maybeTo.source, sourceLang) === "to") {
        consumed += 1;
        objectStart = index + consumed;
      }
    }
    if (adjectiveNormalized === "experienced") {
      const maybeWith = tokens[index + consumed];
      if (maybeWith && normalizeModal(maybeWith.source, sourceLang) === "with") {
        consumed += 1;
        objectStart = index + consumed;
      }
    }
  }
  return {
    kind: "marnggi",
    consumed,
    objectStart,
    source: adjectiveToken.source,
    persons,
    negated,
    negatorSource,
  };
}

export function matchModalExperienceAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): ModalMatch | null {
  const token = tokens[index];
  if (!token) return null;
  const normalized = normalizeModal(token.source, sourceLang);
  const persons =
    sourceLang === "es"
      ? EXPERIENCE_FORMS_ES[normalized]
      : EXPERIENCE_FORMS_EN[normalized];
  if (!persons) return null;
  const expected = sourceLang === "es" ? ["experiencia", "con"] : ["experience", "with"];
  const formTokens = expected.map((item) => normalizeModal(item, sourceLang));
  const seq = matchSequence(tokens, index + 1, formTokens, sourceLang);
  if (!seq.matched) return null;
  const consumed = 1 + seq.consumed;
  return {
    kind: "marnggi",
    consumed,
    objectStart: index + consumed,
    source: expected[0],
    persons,
  };
}

export function matchModalSpecialAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): ModalMatch | null {
  const reflexive = matchModalReflexiveAt(tokens, index, sourceLang);
  if (reflexive) return reflexive;
  const copula = matchModalCopulaAt(tokens, index, sourceLang);
  if (copula) return copula;
  const experience = matchModalExperienceAt(tokens, index, sourceLang);
  if (experience) return experience;
  const direct = matchModalVerbAt(tokens, index, sourceLang);
  if (direct) return direct;
  return null;
}

const OBJECT_TO_PERSON: Record<ObjectPronounKey, PersonNumber> = {
  "1_Sing": "1_Sing",
  "2_Sing": "2_Sing",
  "3_Sing": "3_Sing",
  "1_Dual_Incl": "1+2_Dual",
  "1_Dual_Excl": "1+3_Dual",
  "2_Dual": "2_Dual",
  "3_Dual": "3_Dual",
  "1+2_Plur_Incl": "1+2_Plur",
  "1+2_Plur_Excl": "1+3_Plur",
  "2_Plur": "2_Plur",
  "3_Plur": "3_Plur",
};

const collectObjectPersons = (match: ObjectPronounMatch): PersonNumber[] => {
  const persons = new Set<PersonNumber>();
  if (match.primaryKey) {
    persons.add(OBJECT_TO_PERSON[match.primaryKey]);
  }
  if (match.alternativeKeys) {
    for (const key of match.alternativeKeys) {
      persons.add(OBJECT_TO_PERSON[key]);
    }
  }
  return Array.from(persons);
};

const buildSubjectRepeatPart = (
  person: PersonNumber,
  sourceLang: LanguageMode
): TranslationPart | null => {
  const forms = SUBJECT_PRONOUNS_GUP[person] ?? [];
  const gup = forms[0] ?? "";
  if (!gup) return null;
  return finalizePart(
    {
      type: "pronoun",
      source: gup,
      gup,
      output: gup,
      explanation: "",
      explanations: [
        {
          key: "PRONOUN_SUBJECT_BASE",
          data: { token: gup, gup, person },
        },
      ],
      alternatives: forms.length > 1 ? forms.slice(1).map((form) => ({ gup: form })) : undefined,
      meaningKey: `pronoun.${person}`,
    },
    sourceLang
  );
};

const PERSON_NOTE_KEY: Partial<Record<PersonNumber, ExplanationPayload["key"]>> = {
  "1+2_Dual": "PRONOUN_NOTE_INCLUSIVE_DUAL",
  "1+3_Dual": "PRONOUN_NOTE_EXCLUSIVE_DUAL",
  "1+2_Plur": "PRONOUN_NOTE_INCLUSIVE_PLUR",
  "1+3_Plur": "PRONOUN_NOTE_EXCLUSIVE_PLUR",
  "2_Dual": "PRONOUN_NOTE_DUAL",
  "3_Dual": "PRONOUN_NOTE_DUAL",
  "2_Plur": "PRONOUN_NOTE_PLUR",
  "3_Plur": "PRONOUN_NOTE_PLUR",
};

function buildModalObjectPronounPart(
  match: ObjectPronounMatch,
  sourceLang: LanguageMode,
  options?: {
    emphatic?: boolean;
    sourceOverride?: string;
    includeNonEmphatic?: boolean;
  }
): TranslationPart | null {
  const normalized = normalizeModal(match.source, sourceLang);
  const isAmbiguousIt =
    sourceLang === "es"
      ? ["lo", "la", "los", "las"].includes(normalized)
      : normalized === "it";

  if (!match.primaryKey) {
    if (!isAmbiguousIt) return null;
    const suffixes = getPossessiveSuffixes("waŋgany");
    const primary = applyPossessiveSuffix("waŋgany", suffixes[0]);
    const alternatives: TranslationAlternative[] = suffixes
      .slice(1)
      .map((suffix) => ({
        gup: applyPossessiveSuffix("waŋgany", suffix),
        notePayload: { key: "MODAL_OBJECT_ONE" },
      }));
    return finalizePart(
      {
        type: "noun",
        source: match.source,
        gup: primary,
        output: primary,
        explanation: "",
        explanations: [
          { key: "MODAL_OBJECT_ONE", data: { token: match.source, gup: primary } },
        ],
        alternatives,
      },
      sourceLang
    );
  }

  const basePerson = OBJECT_TO_PERSON[match.primaryKey];
  const useEmphatic = options?.emphatic === true;
  const formMap = useEmphatic
    ? POSSESSIVE_PRONOUNS_EMPHATIC_GUP
    : POSSESSIVE_PRONOUNS_GUP;
  const source = options?.sourceOverride ?? match.source;
  const forms = formMap[basePerson] ?? [];
  if (forms.length === 0) return null;

  const primary = forms[0];
  const alternatives: TranslationAlternative[] = [];
  const noteKey = PERSON_NOTE_KEY[basePerson];

  for (const form of forms.slice(1)) {
    alternatives.push({
      gup: form,
      notePayload: noteKey ? { key: noteKey } : undefined,
    });
  }

  if (match.alternativeKeys && match.alternativeKeys.length > 0) {
    for (const altKey of match.alternativeKeys) {
      const person = OBJECT_TO_PERSON[altKey];
      const altForms = formMap[person] ?? [];
      const altNote = PERSON_NOTE_KEY[person];
      for (const form of altForms) {
        if (form === primary) continue;
        alternatives.push({
          gup: form,
          notePayload: altNote ? { key: altNote } : undefined,
        });
      }
    }
  }

  if (isAmbiguousIt) {
    const suffixes = getPossessiveSuffixes("waŋgany");
    const primaryOne = applyPossessiveSuffix("waŋgany", suffixes[0]);
    alternatives.push({
      gup: primaryOne,
      notePayload: { key: "MODAL_OBJECT_ONE" },
    });
    for (const suffix of suffixes.slice(1)) {
      alternatives.push({
        gup: applyPossessiveSuffix("waŋgany", suffix),
        notePayload: { key: "MODAL_OBJECT_ONE" },
      });
    }
  }

  if (useEmphatic && options?.includeNonEmphatic) {
    const nonEmphMap = POSSESSIVE_PRONOUNS_GUP;
    const persons = collectObjectPersons(match);
    for (const person of persons) {
      const nonEmphForms = nonEmphMap[person] ?? [];
      for (const form of nonEmphForms) {
        if (form === primary) continue;
        alternatives.push({
          gup: form,
          notePayload: { key: "PRONOUN_NOTE_NON_EMPHATIC" },
        });
      }
    }
  }

  const explanations: ExplanationPayload[] = [
    {
      key: "MODAL_OBJECT_PRONOUN",
      data: { token: source, gup: primary },
    },
  ];
  if (useEmphatic) {
    explanations.push({ key: "PRONOUN_NOTE_EMPHATIC" });
  }
  if (noteKey) {
    explanations.push({ key: noteKey });
  }

  return finalizePart(
    {
      type: "pronoun",
      source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations,
      alternatives,
    },
    sourceLang
  );
}

function buildModalObjectNounPart(
  match: NounMatch,
  sourceLang: LanguageMode
): TranslationPart {
  const base = match.gup || match.source;
  const suffixes = getPossessiveSuffixes(base);
  const primary = applyPossessiveSuffix(base, suffixes[0]);
  const alternatives: TranslationAlternative[] = suffixes.slice(1).map((suffix) => {
    const gup = applyPossessiveSuffix(base, suffix);
    return {
      gup,
      notePayload: {
        key: "MODAL_OBJECT_SUFFIX",
        data: { token: match.source, gup, suffix },
      },
    };
  });
  return finalizePart(
    {
      type: "noun",
      source: match.source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations: [
        {
          key: "MODAL_OBJECT_SUFFIX",
          data: { token: match.source, gup: primary, suffix: suffixes[0] },
        },
      ],
      alternatives,
      meaningKey: match.entry?.meaningKey,
      appliedSuffix: suffixes[0],
    },
    sourceLang
  );
}

const collectPossessivePersons = (
  match: PossessivePersonMatch
): PersonNumber[] => {
  const persons = new Set<PersonNumber>();
  persons.add(match.person);
  match.altPersons?.forEach((person) => persons.add(person));
  for (const person of Array.from(persons)) {
    if (person === "1+2_Plur") persons.add("1+3_Plur");
    if (person === "1+2_Dual") persons.add("1+3_Dual");
  }
  return Array.from(persons);
};

const isReflexivePossessive = (
  match: PossessivePersonMatch,
  reflexivePersons?: PersonNumber[]
): boolean => {
  if (!reflexivePersons || reflexivePersons.length === 0) return false;
  const persons = collectPossessivePersons(match);
  return persons.some((person) => reflexivePersons.includes(person));
};

function buildModalPossessorPronounPart(
  match: PossessivePersonMatch,
  sourceLang: LanguageMode
): TranslationPart | null {
  const persons = collectPossessivePersons(match);
  const primaryForms = getComitativePronounForms(match.person);
  if (primaryForms.length === 0) return null;
  const primary = `${primaryForms[0]}ŋuwa`;
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();

  for (const person of persons) {
    const noteKey = getComitativePronounNoteKey(person);
    const forms = getComitativePronounForms(person);
    for (const form of forms) {
      if (person === match.person && form === primaryForms[0]) continue;
      const gup = `${form}ŋuwa`;
      const key = `${gup}:${noteKey ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      alternatives.push({
        gup,
        notePayload: noteKey ? { key: noteKey } : undefined,
      });
    }
  }

  const explanations: ExplanationPayload[] = [
    {
      key: "MODAL_POSSESSOR_PRONOUN",
      data: { token: match.source, gup: primary },
    },
  ];
  const noteKey = getComitativePronounNoteKey(match.person);
  if (noteKey) explanations.push({ key: noteKey });

  return finalizePart(
    {
      type: "pronoun",
      source: match.source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
}

function buildModalPossessorNounSequences(
  phrase: NounPhraseMatch,
  sourceLang: LanguageMode
): { sequences: TranslationPart[][]; hasAlternatives: boolean } {
  const base = phrase.noun.gup || phrase.noun.source;
  const suffixes = getComitativePossessiveSuffixes(base);
  const isHuman = phrase.noun.isHuman === true;
  const isNonHuman = phrase.noun.isHuman === false;
  const isAmbiguous = !isHuman && !isNonHuman;

  const buildSuffixed = (suffix: string): TranslationPart[] => {
    const gup = applyPossessiveSuffix(base, suffix);
    return buildNounPhraseParts(phrase, sourceLang, {
      suffix,
      nounNote: {
        key: "MODAL_POSSESSOR_SUFFIX",
        data: { token: phrase.noun.source, gup, suffix },
      },
    });
  };

  const buildBare = (): TranslationPart[] =>
    buildNounPhraseParts(phrase, sourceLang, {
      nounNote: { key: "MODAL_POSSESSOR_NONHUMAN_ALT" },
    });

  if (isHuman) {
    return {
      sequences: suffixes.map((suffix) => buildSuffixed(suffix)),
      hasAlternatives: suffixes.length > 1,
    };
  }
  if (isNonHuman) {
    return { sequences: [buildBare()], hasAlternatives: false };
  }
  if (isAmbiguous) {
    return {
      sequences: [buildBare(), ...suffixes.map((suffix) => buildSuffixed(suffix))],
      hasAlternatives: true,
    };
  }
  return { sequences: [buildBare()], hasAlternatives: false };
}

export function buildModalObjectSequencesFromPending(
  pending: ModalPendingObject,
  sourceLang: LanguageMode
): { sequences: TranslationPart[][] } {
  if (!pending) return { sequences: [[]] };
  if (pending.kind === "pronoun") {
    const part = buildModalObjectPronounPart(pending.match, sourceLang);
    if (!part) return { sequences: [[]] };
    return { sequences: [[part]] };
  }
  const part = buildModalObjectNounPart(pending.match, sourceLang);
  return { sequences: [[part]] };
}

export function collectModalObjectSequences(
  tokens: TokenLike[],
  startIndex: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): { sequences: TranslationPart[][]; consumed: number } {
  let sequences: TranslationPart[][] = [[]];
  let consumed = 0;
  let index = startIndex;
  let seenObject = false;
  let pendingConnector: ConnectorMatch | null = null;
  let pendingArticleAlternatives: TranslationPart[][] | null = null;

  const isBreakToken = (idx: number): boolean => {
    const token = tokens[idx];
    if (!token) return true;
    if (sourceLang === "es") {
      const normalized = normalizeToken(token.source, sourceLang);
      if (normalized === "a") return false;
    }
    const marker = matchMarkerAt(tokens, idx, sourceLang);
    if (marker?.entry.pos === "punctuation") return true;
    if (isStrongPunctuationToken(token)) return true;
    if (isLocativePrepositionStart(tokens, idx, sourceLang)) return true;
    if (isComitativePrepositionStart(tokens, idx, sourceLang)) return true;
    if (isAllativePrepositionStart(tokens, idx, sourceLang)) return true;
    if (isNegatorToken(token, sourceLang)) return true;
    if (isClauseConnectorToken(tokens, idx, sourceLang)) return true;
    if (isBreakAdverbToken(tokens, idx, sourceLang)) return true;
    if (matchVerbAt(tokens, idx, sourceLang).length > 0) return true;
    return false;
  };

  while (index < tokens.length) {
    if (isBreakToken(index)) break;

    const connector = matchConnectorAt(tokens, index, sourceLang);
    if (connector) {
      if (!pendingConnector) {
        pendingConnector = connector;
      }
      if (seenObject) {
        consumed += connector.consumed;
      }
      index += connector.consumed;
      continue;
    }

    const preToken = tokens[index];
    if (preToken && sourceLang === "es") {
      const normalized = normalizeToken(preToken.source, sourceLang);
      if (normalized === "sobre") {
        consumed += 1;
        index += 1;
        continue;
      }
    }

    const demoToken = tokens[index];
    const demoMatch = demoToken
      ? matchDemonstrativeToken(demoToken.source, sourceLang)
      : null;
    if (demoMatch) {
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        index + 1,
        sourceLang
      );
      if (phrase) {
        const dhiyakuMatch = matchDhiyakuDeterminerAt(
          tokens,
          index,
          sourceLang
        );
        const demoPart =
          dhiyakuMatch?.part ??
          buildDefiniteArticlePart(
            demoMatch.kind === "that" ? "dhiyaki" : "dhiyaku",
            demoToken!.source,
            sourceLang
          );
        pendingArticleAlternatives = [[demoPart], []];
        consumed += 1;
        index += 1;
        continue;
      }
    }

    const dhiyakuMatch = matchDhiyakuDeterminerAt(tokens, index, sourceLang);
    if (dhiyakuMatch) {
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        index + dhiyakuMatch.consumed,
        sourceLang
      );
      if (phrase) {
        if (dhiyakuMatch.part) {
          pendingArticleAlternatives = [[dhiyakuMatch.part], []];
        }
        consumed += dhiyakuMatch.consumed;
        index += dhiyakuMatch.consumed;
        continue;
      }
      if (dhiyakuMatch.part) {
        const connectorPart = pendingConnector
          ? buildConnectorPart(pendingConnector, sourceLang)
          : null;
        const nextSequences: TranslationPart[][] = [];
        for (const seq of sequences) {
          const parts: TranslationPart[] = [...seq];
          if (connectorPart) {
            parts.push(connectorPart);
          }
          parts.push(dhiyakuMatch.part);
          nextSequences.push(parts);
        }
        sequences = nextSequences;
        pendingConnector = null;
        pendingArticleAlternatives = null;
        seenObject = true;
        consumed += dhiyakuMatch.consumed;
        index += dhiyakuMatch.consumed;
        continue;
      }
    }

    const token = tokens[index];
    if (!token) break;

    let objectToken = token;
    if (sourceLang === "es") {
      const normalized = normalizeToken(token.source, sourceLang);
      if (normalized === "a") {
        const next = tokens[index + 1];
        if (!next) break;
        consumed += 1;
        index += 1;
        continue;
      }
    }

    if (isBreakToken(index)) break;

    const phrase = matchNounPhraseAfterArticle(tokens, index, sourceLang);
    const connectorToken = phrase ? tokens[index + phrase.consumed] : null;
    const connectorNorm = connectorToken
      ? normalizeToken(connectorToken.source, sourceLang)
      : null;
    const isPossessiveOf =
      phrase &&
      connectorToken &&
      ((sourceLang === "es" && connectorNorm === "de") ||
        (sourceLang === "en" && connectorNorm === "of"));

    if (isPossessiveOf && phrase) {
      const possessorStart = index + phrase.consumed + 1;
      const possessorToken = tokens[possessorStart];
      let possessorSequences: TranslationPart[][] | null = null;
      let possessorConsumed = 0;

      if (possessorToken) {
        const pronounMatch = matchPossessiveOfPronoun(
          possessorToken.source,
          sourceLang
        );
        if (pronounMatch) {
          const part = buildModalPossessorPronounPart(pronounMatch, sourceLang);
          if (part) {
            possessorSequences = [[part]];
            possessorConsumed = 1;
          }
        } else {
          let possessorCursor = possessorStart;
          const possessorArticle = matchArticleAt(
            tokens,
            possessorCursor,
            sourceLang
          );
          if (
            possessorArticle &&
            !isOtherGroupPatternAt(tokens, possessorCursor, sourceLang)
          ) {
            possessorCursor += possessorArticle.consumed;
          }
          const possessorPhrase = matchNounPhraseAfterArticle(
            tokens,
            possessorCursor,
            sourceLang
          );
          if (possessorPhrase) {
            const built = buildModalPossessorNounSequences(
              possessorPhrase,
              sourceLang
            );
            possessorSequences = built.sequences;
            possessorConsumed =
              possessorCursor - possessorStart + possessorPhrase.consumed;
          } else if (!isStrongPunctuationToken(possessorToken)) {
            const fallbackPhrase: NounPhraseMatch = {
              adjectives: { pre: [], post: [] },
              noun: {
                gup: possessorToken.source,
                source: possessorToken.source,
                isHuman: undefined,
                consumed: 1,
              },
              consumed: 1,
            };
            const built = buildModalPossessorNounSequences(
              fallbackPhrase,
              sourceLang
            );
            possessorSequences = built.sequences;
            possessorConsumed = 1;
          }
        }
      }

      if (possessorSequences && possessorSequences.length > 0) {
        const base = phrase.noun.gup || phrase.noun.source;
        const suffixes = getPossessiveSuffixes(base);
        const possessedSequences = suffixes.map((suffix) => {
          const gup = applyPossessiveSuffix(base, suffix);
          return buildNounPhraseParts(phrase, sourceLang, {
            suffix,
            nounNote: {
              key: "MODAL_OBJECT_SUFFIX",
              data: { token: phrase.noun.source, gup, suffix },
            },
          });
        });

        const combinedSequences = possessedSequences.flatMap((possessedSeq) =>
          possessorSequences!.map((possessorSeq) => [
            ...possessedSeq,
            ...possessorSeq,
          ])
        );

        const connectorPart = pendingConnector
          ? buildConnectorPart(pendingConnector, sourceLang)
          : null;
        const prefixSequences = pendingArticleAlternatives ?? [[]];
        const nextSequences: TranslationPart[][] = [];
        for (const seq of sequences) {
          for (const prefix of prefixSequences) {
            for (const combo of combinedSequences) {
              const parts: TranslationPart[] = [...seq];
              if (connectorPart) {
                parts.push(connectorPart);
              }
              if (prefix.length > 0) {
                parts.push(...prefix);
              }
              parts.push(...combo);
              nextSequences.push(parts);
            }
          }
        }

        sequences = nextSequences;
        pendingConnector = null;
        pendingArticleAlternatives = null;
        seenObject = true;
        const consumedHere = phrase.consumed + 1 + possessorConsumed;
        consumed += consumedHere;
        index += consumedHere;
        continue;
      }
    }

    const possDeterminer = matchPossessiveDeterminer(
      objectToken.source,
      sourceLang
    );
    if (possDeterminer) {
      const emphasis = matchPossessiveEmphasisAt(tokens, index, sourceLang);
      const isReflexive =
        Boolean(emphasis) &&
        isReflexivePossessive(possDeterminer, options?.reflexivePersons);
      const possessorPart = buildPossessivePronounPart(possDeterminer, sourceLang, {
        emphatic: Boolean(emphasis),
        sourceOverride: emphasis?.source,
        includeNonEmphatic: Boolean(emphasis) && !isReflexive,
      });
      const possessorSequences: TranslationPart[][] = [];
      if (possessorPart) {
        possessorSequences.push([possessorPart]);
        if (isReflexive && options?.reflexiveSubjectRepeat) {
          const subjectPart = buildSubjectRepeatPart(
            options?.reflexivePersons?.[0] ?? "3_Sing",
            sourceLang
          );
          if (subjectPart) {
            possessorSequences.push([possessorPart, subjectPart]);
          }
        }
      }
      const consumedPrefix = 1 + (emphasis?.consumed ?? 0);
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        index + consumedPrefix,
        sourceLang,
        { allowUnknownHead: true }
      );
      if (phrase && possessorSequences.length > 0) {
        const base = phrase.noun.gup || phrase.noun.source;
        const suffixes = getPossessiveSuffixes(base);
        const nounSequences = suffixes.map((suffix) => {
          const gup = applyPossessiveSuffix(base, suffix);
          return buildNounPhraseParts(phrase, sourceLang, {
            suffix,
            nounNote: {
              key: "MODAL_OBJECT_SUFFIX",
              data: { token: phrase.noun.source, gup, suffix },
            },
          });
        });
        const combinedSequences = possessorSequences.flatMap((possessorSeq) =>
          nounSequences.map((nounSeq) => [...possessorSeq, ...nounSeq])
        );
        const connectorPart = pendingConnector
          ? buildConnectorPart(pendingConnector, sourceLang)
          : null;
        const prefixSequences = pendingArticleAlternatives ?? [[]];
        const nextSequences: TranslationPart[][] = [];
        for (const seq of sequences) {
          for (const prefix of prefixSequences) {
            for (const combo of combinedSequences) {
              const parts: TranslationPart[] = [...seq];
              if (connectorPart) parts.push(connectorPart);
              if (prefix.length > 0) parts.push(...prefix);
              parts.push(...combo);
              nextSequences.push(parts);
            }
          }
        }
        sequences = nextSequences;
        pendingConnector = null;
        pendingArticleAlternatives = null;
        seenObject = true;
        const consumedHere = consumedPrefix + phrase.consumed;
        consumed += consumedHere;
        index += consumedHere;
        continue;
      }
    }

    let objectPart: TranslationPart | null = null;
    let objectParts: TranslationPart[][] | null = null;
    const pronounMatch = matchModalObjectPronoun(objectToken.source, sourceLang);
    if (pronounMatch) {
      const emphasis = matchPossessiveEmphasisAt(tokens, index, sourceLang);
      const isReflexive =
        Boolean(emphasis) &&
        Boolean(options?.reflexivePersons?.length) &&
        collectObjectPersons(pronounMatch).some((person) =>
          options?.reflexivePersons?.includes(person)
        );
      objectPart = buildModalObjectPronounPart(pronounMatch, sourceLang, {
        emphatic: Boolean(emphasis),
        sourceOverride: emphasis?.source,
        includeNonEmphatic: Boolean(emphasis) && !isReflexive,
      });
      if (objectPart) {
        objectParts = [[objectPart]];
        if (isReflexive && options?.reflexiveSubjectRepeat) {
          const subjectPart = buildSubjectRepeatPart(
            options?.reflexivePersons?.[0] ?? "3_Sing",
            sourceLang
          );
          if (subjectPart) {
            objectParts.push([objectPart, subjectPart]);
          }
        }
      }
    } else {
      const nounMatch = matchNounAt(tokens, index, sourceLang) ?? {
        gup: objectToken.source,
        isHuman: undefined,
        consumed: 1,
        source: objectToken.source,
      };
      objectPart = buildModalObjectNounPart(nounMatch, sourceLang);
    }

    const connectorPart = pendingConnector
      ? buildConnectorPart(pendingConnector, sourceLang)
      : null;
    const prefixSequences = pendingArticleAlternatives ?? [[]];

    const nextSequences: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const prefix of prefixSequences) {
        const parts: TranslationPart[] = [...seq];
        if (connectorPart) {
          parts.push(connectorPart);
        }
        if (prefix.length > 0) {
          parts.push(...prefix);
        }
        if (objectParts) {
          for (const objSeq of objectParts) {
            nextSequences.push([...parts, ...objSeq]);
          }
        } else if (objectPart) {
          parts.push(objectPart);
          nextSequences.push(parts);
        } else {
          nextSequences.push(parts);
        }
      }
    }

    sequences = nextSequences;
    pendingConnector = null;
    pendingArticleAlternatives = null;
    seenObject = true;
    const extraConsumed = pronounMatch
      ? matchPossessiveEmphasisAt(tokens, index, sourceLang)?.consumed ?? 0
      : 0;
    consumed += 1 + extraConsumed;
    index += 1 + extraConsumed;
  }

  return { sequences, consumed };
}

export function buildModalVerbPart(
  match: ModalMatch,
  sourceLang: LanguageMode
): TranslationPart {
  const gup = match.kind === "djal" ? "djäl" : "marŋgi";
  return finalizePart(
    {
      type: "verb",
      source: match.source,
      gup,
      output: gup,
      explanation: "",
      explanations: [
        {
          key: match.kind === "djal" ? "MODAL_DJAL" : "MODAL_MARNGI",
          data: { token: match.source, gup },
        },
      ],
    },
    sourceLang
  );
}
