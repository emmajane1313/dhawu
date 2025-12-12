import { LEXICON, VerbEntry, VerbForms } from "./lexicon";
import { LanguageMode } from "@/app/components/types/components.type";
import {
  CONNECTOR_WORDS_ES,
  CONNECTOR_WORDS_EN,
  PRONOUNS_ES,
  PRONOUNS_EN,
  normalizeToken,
  LANG_CONFIG,
} from "./constants";

export { CONNECTOR_WORDS_ES, CONNECTOR_WORDS_EN, PRONOUNS_ES, PRONOUNS_EN };

export type TokenType =
  | "verb"
  | "noun"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "connector"
  | "particle"
  | "unknown";

export interface VerbMatch {
  gupKey: string;
  entry: VerbEntry;
  tense: string;
  person: number;
  formIndex: number;
  attachedClitic?: string;
  isDjal?: boolean;
  isMarnggi?: boolean;
}

export interface NounMatch {
  gupKey: string;
  isPlural: boolean;
  isHuman?: boolean;
  isPlace?: boolean;
  irregularPlurals?: string[];
}

export interface AdjectiveMatch {
  gupKey: string;
  isPlural: boolean;
  irregularPlurals?: string[];
}

export interface Token {
  original: string;
  normalized: string;
  type: TokenType;
  verbMatch?: VerbMatch;
  nounMatch?: NounMatch;
  adjectiveMatch?: AdjectiveMatch;
  gupKey?: string;
  isLocational?: boolean;
}

export interface Frase {
  tokenIndices: number[];
}

export interface FraseCombination {
  frases: Frase[];
}

export interface TokenizerResult {
  tokens: Token[];
  verbPositions: number[];
  connectorPositions: number[];
  combinations: FraseCombination[];
  hasAmbiguity: boolean;
  punctuation: string | null;
}

function isConnector(word: string, mode: LanguageMode): boolean {
  const normalized = normalizeToken(word);
  return LANG_CONFIG[mode].connectors.includes(normalized);
}

function isPronoun(word: string, mode: LanguageMode): boolean {
  const normalized = normalizeToken(word);
  return LANG_CONFIG[mode].pronouns.includes(normalized);
}

function isCopulaVerb(word: string, mode: LanguageMode): boolean {
  const normalized = normalizeToken(word);
  return LANG_CONFIG[mode].copulaVerbs.includes(normalized);
}

function tryMatchVerb(
  normalized: string,
  mode: LanguageMode
): Omit<VerbMatch, "attachedClitic"> | null {
  for (const [gupKey, entry] of Object.entries(LEXICON.verbs)) {
    for (let formIndex = 0; formIndex < entry[mode].length; formIndex++) {
      const forms: VerbForms = entry[mode][formIndex];
      const baseMatch = {
        gupKey,
        entry,
        isDjal: entry.isDjal,
        isMarnggi: entry.isMarnggi,
      };

      if (forms.infinitive === normalized) {
        return { ...baseMatch, tense: "infinitive", person: -1, formIndex };
      }
      if (forms.gerund === normalized) {
        return { ...baseMatch, tense: "gerund", person: -1, formIndex };
      }
      if (forms.pastParticiple === normalized) {
        return { ...baseMatch, tense: "pastParticiple", person: -1, formIndex };
      }

      const tenses: (keyof VerbForms)[] = [
        "presentIndicative",
        "preterite",
        "imperfect",
        "future",
        "conditional",
        "presentSubjunctive",
      ];

      for (const tense of tenses) {
        const conjugations = forms[tense] as string[];
        const personIndex = conjugations.indexOf(normalized);
        if (personIndex !== -1) {
          return { ...baseMatch, tense, person: personIndex, formIndex };
        }
      }

      const imperativeKeys: (keyof typeof forms.imperative)[] = [
        "tu",
        "usted",
        "nosotros",
        "vosotros",
        "ustedes",
      ];
      for (let i = 0; i < imperativeKeys.length; i++) {
        if (forms.imperative[imperativeKeys[i]] === normalized) {
          return { ...baseMatch, tense: "imperative", person: i, formIndex };
        }
      }
    }
  }
  return null;
}

function tryMatchVerbClitic(
  normalized: string,
  mode: LanguageMode
): Omit<VerbMatch, "attachedClitic"> | null {
  for (const [gupKey, entry] of Object.entries(LEXICON.verbs)) {
    for (let formIndex = 0; formIndex < entry[mode].length; formIndex++) {
      const forms: VerbForms = entry[mode][formIndex];
      const baseMatch = {
        gupKey,
        entry,
        isDjal: entry.isDjal,
        isMarnggi: entry.isMarnggi,
      };

      const imperativeKeys: (keyof typeof forms.imperative)[] = [
        "tu",
        "usted",
        "nosotros",
        "vosotros",
        "ustedes",
      ];
      for (let i = 0; i < imperativeKeys.length; i++) {
        if (forms.imperative[imperativeKeys[i]] === normalized) {
          return { ...baseMatch, tense: "imperative", person: i, formIndex };
        }
      }

      if (forms.infinitive === normalized) {
        return { ...baseMatch, tense: "infinitive", person: -1, formIndex };
      }
      if (forms.gerund === normalized) {
        return { ...baseMatch, tense: "gerund", person: -1, formIndex };
      }
    }
  }
  return null;
}

function findVerbMatch(word: string, mode: LanguageMode): VerbMatch | null {
  const normalized = normalizeToken(word);
  const config = LANG_CONFIG[mode];

  const directMatch = tryMatchVerb(normalized, mode);
  if (directMatch) {
    return { ...directMatch, attachedClitic: undefined };
  }

  if (config.clitics.length > 0) {
    const removeAccentMap: Record<string, string> = {
      á: "a",
      é: "e",
      í: "i",
      ó: "o",
      ú: "u",
    };
    for (const clitic of config.clitics) {
      if (normalized.endsWith(clitic) && normalized.length > clitic.length) {
        const stem = normalized.slice(0, -clitic.length);
        const stemMatch = tryMatchVerbClitic(stem, mode);
        if (stemMatch) {
          return { ...stemMatch, attachedClitic: clitic };
        }
        let unaccentedStem = stem;
        for (const [accented, plain] of Object.entries(removeAccentMap)) {
          unaccentedStem = unaccentedStem.replace(accented, plain);
        }
        if (unaccentedStem !== stem) {
          const unaccentedMatch = tryMatchVerbClitic(unaccentedStem, mode);
          if (unaccentedMatch) {
            return { ...unaccentedMatch, attachedClitic: clitic };
          }
        }
      }
    }
  }

  return null;
}

function findNounMatch(word: string, mode: LanguageMode): NounMatch | null {
  const normalized = normalizeToken(word);
  const { pluralKey } = LANG_CONFIG[mode];

  for (const [gupKey, entry] of Object.entries(LEXICON.nouns)) {
    const irregularPlurals =
      entry.plurals && entry.plurals.length > 0 ? entry.plurals : undefined;

    if (entry[mode].map((n) => n.toLowerCase()).includes(normalized)) {
      return {
        gupKey,
        isPlural: false,
        isHuman: entry.isHuman,
        isPlace: entry.isPlace,
        irregularPlurals,
      };
    }

    const pluralForms = entry[pluralKey];
    if (
      pluralForms &&
      pluralForms.map((n) => n.toLowerCase()).includes(normalized)
    ) {
      return {
        gupKey,
        isPlural: true,
        isHuman: entry.isHuman,
        isPlace: entry.isPlace,
        irregularPlurals,
      };
    }
  }

  return null;
}

interface MultiWordNounMatch {
  nounMatch: NounMatch;
  wordCount: number;
  original: string;
}

function findMultiWordNounMatch(
  words: string[],
  startIndex: number,
  mode: LanguageMode
): MultiWordNounMatch | null {
  const { pluralKey } = LANG_CONFIG[mode];

  for (let len = Math.min(4, words.length - startIndex); len >= 2; len--) {
    const phrase = words.slice(startIndex, startIndex + len).join(" ");
    const normalized = phrase.toLowerCase();

    for (const [gupKey, entry] of Object.entries(LEXICON.nouns)) {
      const irregularPlurals =
        entry.plurals && entry.plurals.length > 0 ? entry.plurals : undefined;

      if (entry[mode].map((n) => n.toLowerCase()).includes(normalized)) {
        return {
          nounMatch: {
            gupKey,
            isPlural: false,
            isHuman: entry.isHuman,
            isPlace: entry.isPlace,
            irregularPlurals,
          },
          wordCount: len,
          original: phrase,
        };
      }

      const pluralForms = entry[pluralKey];
      if (
        pluralForms &&
        pluralForms.map((n) => n.toLowerCase()).includes(normalized)
      ) {
        return {
          nounMatch: {
            gupKey,
            isPlural: true,
            isHuman: entry.isHuman,
            isPlace: entry.isPlace,
            irregularPlurals,
          },
          wordCount: len,
          original: phrase,
        };
      }
    }
  }

  return null;
}

interface MultiWordAdverbMatch {
  gupKey: string;
  isLocational?: boolean;
  wordCount: number;
  original: string;
}

function findMultiWordAdverbMatch(
  words: string[],
  startIndex: number,
  mode: LanguageMode
): MultiWordAdverbMatch | null {
  for (let len = Math.min(4, words.length - startIndex); len >= 2; len--) {
    const phrase = words.slice(startIndex, startIndex + len).join(" ");
    const normalized = phrase.toLowerCase();

    for (const [gupKey, entry] of Object.entries(LEXICON.adverbs)) {
      if (entry[mode].map((a) => a.toLowerCase()).includes(normalized)) {
        return {
          gupKey,
          isLocational: entry.isLocational,
          wordCount: len,
          original: phrase,
        };
      }
    }
  }

  return null;
}

function findAdjectiveMatch(word: string, mode: LanguageMode): AdjectiveMatch | null {
  const normalized = normalizeToken(word);
  const { pluralKey } = LANG_CONFIG[mode];

  for (const [gupKey, entry] of Object.entries(LEXICON.adjectives)) {
    const irregularPlurals =
      entry.plurals && entry.plurals.length > 0 ? entry.plurals : undefined;

    if (entry[mode].map((a) => a.toLowerCase()).includes(normalized)) {
      return {
        gupKey,
        isPlural: false,
        irregularPlurals,
      };
    }
    const pluralForms = entry[pluralKey];
    if (
      pluralForms &&
      pluralForms.map((a) => a.toLowerCase()).includes(normalized)
    ) {
      return {
        gupKey,
        isPlural: true,
        irregularPlurals,
      };
    }
  }

  return null;
}

function findAdverbMatch(
  word: string,
  mode: LanguageMode
): { gupKey: string; isLocational?: boolean } | null {
  const normalized = normalizeToken(word);
  const { pluralKey } = LANG_CONFIG[mode];

  for (const [gupKey, entry] of Object.entries(LEXICON.adverbs)) {
    if (entry[mode].map((a) => a.toLowerCase()).includes(normalized)) {
      return { gupKey, isLocational: entry.isLocational };
    }
    const pluralForms = entry[pluralKey];
    if (
      pluralForms &&
      pluralForms.map((a) => a.toLowerCase()).includes(normalized)
    ) {
      return { gupKey, isLocational: entry.isLocational };
    }
  }

  return null;
}

function findParticleMatch(word: string, mode: LanguageMode): string | null {
  const normalized = normalizeToken(word);

  for (const [gupKey, entry] of Object.entries(LEXICON.particles)) {
    if (entry[mode].map((p) => p.toLowerCase()).includes(normalized)) {
      return gupKey;
    }
  }

  return null;
}

function classifyToken(word: string, mode: LanguageMode): Token {
  const normalized = normalizeToken(word);

  if (isConnector(word, mode)) {
    return { original: word, normalized, type: "connector" };
  }

  if (isPronoun(word, mode)) {
    return { original: word, normalized, type: "pronoun" };
  }

  const verbMatch = findVerbMatch(word, mode);
  if (verbMatch) {
    return {
      original: word,
      normalized,
      type: "verb",
      verbMatch,
      gupKey: verbMatch.gupKey,
    };
  }

  if (isCopulaVerb(word, mode)) {
    return { original: word, normalized, type: "verb" };
  }

  const nounMatch = findNounMatch(word, mode);
  if (nounMatch) {
    return {
      original: word,
      normalized,
      type: "noun",
      nounMatch,
      gupKey: nounMatch.gupKey,
    };
  }

  const adjMatch = findAdjectiveMatch(word, mode);
  if (adjMatch) {
    return {
      original: word,
      normalized,
      type: "adjective",
      adjectiveMatch: adjMatch,
      gupKey: adjMatch.gupKey,
    };
  }

  const advMatch = findAdverbMatch(word, mode);
  if (advMatch) {
    return {
      original: word,
      normalized,
      type: "adverb",
      gupKey: advMatch.gupKey,
      isLocational: advMatch.isLocational,
    };
  }

  const particleKey = findParticleMatch(word, mode);
  if (particleKey) {
    return {
      original: word,
      normalized,
      type: "particle",
      gupKey: particleKey,
    };
  }

  return { original: word, normalized, type: "unknown" };
}

function splitIntoWords(text: string): string[] {
  return text
    .replace(/,/g, " , ")
    .replace(/\./g, " . ")
    .replace(/[!?¡¿;:()"""'']/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function findPositions(tokens: Token[], type: TokenType): number[] {
  const positions: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === type) {
      positions.push(i);
    }
  }
  return positions;
}

function findConnectorsBetweenVerbs(
  verbPositions: number[],
  connectorPositions: number[]
): number[][] {
  const result: number[][] = [];

  for (let i = 0; i < verbPositions.length - 1; i++) {
    const currentVerb = verbPositions[i];
    const nextVerb = verbPositions[i + 1];
    const connectorsBetween = connectorPositions.filter(
      (c) => c > currentVerb && c < nextVerb
    );
    result.push(connectorsBetween);
  }

  return result;
}

function generateBoundaryCombinations(
  connectorsBetweenVerbs: number[][]
): number[][] {
  if (connectorsBetweenVerbs.length === 0) return [[]];

  const result: number[][] = [];

  function recurse(index: number, currentBoundaries: number[]) {
    if (index >= connectorsBetweenVerbs.length) {
      result.push([...currentBoundaries]);
      return;
    }

    const connectorsForThisPair = connectorsBetweenVerbs[index];

    if (connectorsForThisPair.length === 0) {
      recurse(index + 1, currentBoundaries);
    } else {
      for (const connector of connectorsForThisPair) {
        recurse(index + 1, [...currentBoundaries, connector]);
      }
    }
  }

  recurse(0, []);
  return result;
}

function buildFrasesFromBoundaries(
  tokens: Token[],
  boundaries: number[]
): Frase[] {
  const frases: Frase[] = [];
  const sortedBoundaries = [...boundaries].sort((a, b) => a - b);

  let start = 0;

  for (const boundary of sortedBoundaries) {
    const indices: number[] = [];
    for (let i = start; i <= boundary; i++) {
      indices.push(i);
    }
    if (indices.length > 0) {
      frases.push({ tokenIndices: indices });
    }
    start = boundary + 1;
  }

  const lastIndices: number[] = [];
  for (let i = start; i < tokens.length; i++) {
    lastIndices.push(i);
  }
  if (lastIndices.length > 0) {
    frases.push({ tokenIndices: lastIndices });
  }

  return frases;
}

export function tokenize(text: string, mode: LanguageMode): TokenizerResult {
  let punctuation: string | null = null;
  const trimmed = text.trim();
  const punctMatch = trimmed.match(/([!?¿¡]+)$/);
  if (punctMatch) {
    punctuation = punctMatch[1];
  }

  const words = splitIntoWords(text);
  const tokens: Token[] = [];

  let i = 0;
  while (i < words.length) {
    const multiNounMatch = findMultiWordNounMatch(words, i, mode);
    if (multiNounMatch) {
      tokens.push({
        original: multiNounMatch.original,
        normalized: multiNounMatch.original.toLowerCase(),
        type: "noun",
        nounMatch: multiNounMatch.nounMatch,
        gupKey: multiNounMatch.nounMatch.gupKey,
      });
      i += multiNounMatch.wordCount;
      continue;
    }

    const multiAdvMatch = findMultiWordAdverbMatch(words, i, mode);
    if (multiAdvMatch) {
      tokens.push({
        original: multiAdvMatch.original,
        normalized: multiAdvMatch.original.toLowerCase(),
        type: "adverb",
        gupKey: multiAdvMatch.gupKey,
        isLocational: multiAdvMatch.isLocational,
      });
      i += multiAdvMatch.wordCount;
      continue;
    }

    tokens.push(classifyToken(words[i], mode));
    i++;
  }

  const verbPositions = findPositions(tokens, "verb");
  const connectorPositions = findPositions(tokens, "connector");
  const allIndices: number[] = tokens.map((_, i) => i);

  const hardBoundaryPositions = tokens
    .map((t, i) => (t.original === "." ? i : -1))
    .filter((i) => i !== -1);

  const softConnectorPositions = connectorPositions.filter(
    (i) => tokens[i].original !== "."
  );

  if (connectorPositions.length === 0) {
    return {
      tokens,
      verbPositions,
      connectorPositions,
      combinations: [{ frases: [{ tokenIndices: allIndices }] }],
      hasAmbiguity: false,
      punctuation,
    };
  }

  if (hardBoundaryPositions.length > 0) {
    const connectorsBetweenVerbs = findConnectorsBetweenVerbs(
      verbPositions,
      softConnectorPositions
    );
    const softBoundaryCombinations = generateBoundaryCombinations(
      connectorsBetweenVerbs
    );
    const hasAmbiguity = connectorsBetweenVerbs.some((c) => c.length > 1);

    const combinations: FraseCombination[] = softBoundaryCombinations.map(
      (softBoundaries) => ({
        frases: buildFrasesFromBoundaries(tokens, [
          ...hardBoundaryPositions,
          ...softBoundaries,
        ]),
      })
    );

    return {
      tokens,
      verbPositions,
      connectorPositions,
      combinations,
      hasAmbiguity,
      punctuation,
    };
  }

  if (verbPositions.length <= 1) {
    return {
      tokens,
      verbPositions,
      connectorPositions,
      combinations: [{ frases: [{ tokenIndices: allIndices }] }],
      hasAmbiguity: false,
      punctuation,
    };
  }

  const connectorsBetweenVerbs = findConnectorsBetweenVerbs(
    verbPositions,
    connectorPositions
  );
  const boundaryCombinations = generateBoundaryCombinations(
    connectorsBetweenVerbs
  );
  const hasAmbiguity = connectorsBetweenVerbs.some((c) => c.length > 1);
  const combinations: FraseCombination[] = boundaryCombinations.map(
    (boundaries) => ({
      frases: buildFrasesFromBoundaries(tokens, boundaries),
    })
  );

  return {
    tokens,
    verbPositions,
    connectorPositions,
    combinations,
    hasAmbiguity,
    punctuation,
  };
}
