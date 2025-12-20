import { LanguageMode } from "@/app/components/types/components.type";
import { Token } from "./tokenizer";
import {
  getPatterns,
  getNegationWords,
  VerbPattern,
  PatternTense,
  getAuxiliaryPerson,
} from "./patterns";
import {
  PersonNumber,
  LANG_CONFIG,
  MirriMiriwType,
  HABER_AUXILIARY_FORMS_ES,
  LOCATIVE_REINFORCERS,
  LocativeReinforcerInfo,
  LocativeVerbType,
  LOCATIVE_VERBS,
  QUESTION_GUP,
  AgentNounSuffix,
} from "./constants";
import { LEXICON } from "./lexicon";
import {
  detectQuestionPattern as detectQuestionPatternFromRules,
  AnswerInfo,
} from "./rules/question/index";

export interface MatchedPattern {
  patternName: string;
  skipIndices: number[];
  mainVerbIndex: number;
  tense: PatternTense;
  isContinuous: boolean;
  auxiliaryPerson: number | null;
}

export type DeterminerType = "definite" | "this" | "that";

export interface DeterminerMatch {
  determinerIndex: number;
  nounIndex: number;
  type: DeterminerType;
  determinerWord: string;
  nounWord: string;
  isPlural: boolean;
}

export interface CopulaMatch {
  copulaIndex: number;
  copulaWord: string;
  subjectType: "this" | "that" | null;
  subjectIndex: number | null;
  impliedPerson: PersonNumber | null;
  isStandalone: boolean;
}

export interface PossessionMatch {
  pattern: "apostrophe_s" | "de" | "del";
  possessorIndex: number;
  possessedIndex: number;
  possessorWord: string;
  possessedWord: string;
  deIndex?: number;
}

export interface PossessivePronounMatch {
  pronounIndex: number;
  pronounWord: string;
  possessedIndex: number;
  possessedWord: string;
  personNumber: PersonNumber;
  deIndex?: number;
}

export interface MirriMiriwMatch {
  suffixType: MirriMiriwType;
  triggerPhrase: string;
  triggerIndices: number[];
  personNumber: PersonNumber | null;
  isLessSuffix: boolean;
  lessBase: string | null;
  isFulSuffix: boolean;
  fulBase: string | null;
  explanation: string;
}

export interface LocativeMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  nounIndices: number[];
  reinforcer: LocativeReinforcerInfo | null;
  explanation: string;
}

export interface ConWithMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  nounIndices: number[];
  explanation: string;
}

export interface InstrumentalMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  nounIndices: number[];
  explanation: string;
}

export interface BelongingMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  belongsToNounIndices: number[];
  mainNounIndices: number[];
  explanation: string;
  isAboutTrigger: boolean;
  isPronoun?: boolean;
  pronounPersonNumber?: PersonNumber;
  pronounWord?: string;
}

export interface TimesMatch {
  quantifierWord: string;
  quantifierIndex: number;
  timesWord: string;
  timesIndex: number;
  consumedIndices: number[];
  gupBase: string;
  gupWithMirri: string;
  explanation: string;
  isQuestion: boolean;
  isFixedPhrase: boolean;
}

export interface TransportMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  nounIndices: number[];
  isKnownVehicle: boolean;
  hasMovementVerb: boolean;
  explanation: string;
}

export interface PronounMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  personNumber: PersonNumber;
  gupForms: string[];
  explanation: string;
}

export type ComitativePronounMatch = PronounMatch;
export type HumanAllativePronounMatch = PronounMatch;
export type HumanAblativePronounMatch = PronounMatch;
export type SourceOriginPronounMatch = PronounMatch;
export type PurposePronounMatch = PronounMatch;

export interface IndirectObjectMatch {
  type: "clitic" | "preposition" | "position";
  triggerWord: string;
  triggerIndex: number;
  personNumber: PersonNumber | null;
  nounIndex: number | null;
  nounWord: string | null;
  explanation: string;
}

export type PronounPatternType =
  | "comitative"
  | "humanAllative"
  | "humanAblative"
  | "sourceOrigin"
  | "purpose";

export type PositionType = "up" | "lying" | "default";

export interface LocativeCopulaMatch {
  copulaIndex: number;
  copulaWord: string;
  tense: "present" | "past" | "future";
  isContinuous: boolean;
  person: PersonNumber | null;
  positionType: PositionType;
  suggestedVerbs: LocativeVerbType[];
  isHumanSubject: boolean | null;
  explanation: string;
}

export interface QuestionMatch {
  type:
    | "where"
    | "where_to"
    | "where_from"
    | "what"
    | "what_purpose"
    | "whom"
    | "to_whom"
    | "whose"
    | "whom_for"
    | "how"
    | "when"
    | "why"
    | "with_what"
    | "by_whom"
    | "what_about"
    | "where_belong";
  questionWordIndex: number;
  questionWordEndIndex?: number;
  gup: string;
  explanation: string;
  isComplexPattern?: boolean;
  patternOutput?: string;
  consumedIndices?: number[];
  patternOptions?: { gup: string; explanation: string }[];
  answerInfo?: AnswerInfo;
  hasExplicitSubject?: boolean;
  subjectInfo?: {
    gup: string;
    source: string;
    isPlural?: boolean;
    isHuman?: boolean;
    isKnownNoun?: boolean;
  };
}

export interface FraseContext {
  hasNegation: boolean;
  hasSubject: boolean;
  hasExclamation: boolean;
  isQuestion: boolean;
  questionMatch: QuestionMatch | null;
  matchedPattern: MatchedPattern | null;
  determinerMatches: DeterminerMatch[];
  copulaMatch: CopulaMatch | null;
  possessionMatch: PossessionMatch | null;
  possessivePronounMatch: PossessivePronounMatch | null;
  mirriMiriwMatch: MirriMiriwMatch | null;
  locativeMatch: LocativeMatch | null;
  conWithMatch: ConWithMatch | null;
  instrumentalMatch: InstrumentalMatch | null;
  belongingMatch: BelongingMatch | null;
  transportMatch: TransportMatch | null;
  comitativePronounMatch: ComitativePronounMatch | null;
  humanAllativePronounMatch: HumanAllativePronounMatch | null;
  humanAblativePronounMatch: HumanAblativePronounMatch | null;
  sourceOriginPronounMatch: SourceOriginPronounMatch | null;
  purposePronounMatch: PurposePronounMatch | null;
  locativeCopulaMatch: LocativeCopulaMatch | null;
  indirectObjectMatch: IndirectObjectMatch | null;
}

function matchSinglePattern(
  tokens: Token[],
  startIdx: number,
  pattern: VerbPattern
): { matched: boolean; endIdx: number; mainVerbIdx: number } | null {
  let tokenIdx = startIdx;

  for (let matcherIdx = 0; matcherIdx < pattern.match.length; matcherIdx++) {
    if (tokenIdx >= tokens.length) return null;

    const matcher = pattern.match[matcherIdx];
    const token = tokens[tokenIdx];
    const word = token.original.toLowerCase();

    switch (matcher.type) {
      case "wordList":
        if (!matcher.words.includes(word)) return null;
        tokenIdx++;
        break;

      case "literal":
        if (word !== matcher.word) return null;
        tokenIdx++;
        break;

      case "verbForm":
        if (token.type !== "verb") return null;
        const tense = token.verbMatch?.tense;
        if (!tense || !matcher.forms.includes(tense)) return null;
        return { matched: true, endIdx: tokenIdx, mainVerbIdx: tokenIdx };

      default:
        return null;
    }
  }

  return null;
}

export function matchPatterns(
  tokens: Token[],
  mode: LanguageMode
): MatchedPattern | null {
  const patterns = getPatterns(mode);

  for (let startIdx = 0; startIdx < tokens.length; startIdx++) {
    for (const pattern of patterns) {
      const result = matchSinglePattern(tokens, startIdx, pattern);

      if (result) {
        const skipIndices: number[] = [];
        for (let i = startIdx; i < result.mainVerbIdx; i++) {
          skipIndices.push(i);
        }

        const auxiliaryWord = tokens[startIdx].original;
        const auxiliaryPerson = getAuxiliaryPerson(auxiliaryWord, mode);

        return {
          patternName: pattern.name,
          skipIndices,
          mainVerbIndex: result.mainVerbIdx,
          tense: pattern.result.tense,
          isContinuous: pattern.result.isContinuous,
          auxiliaryPerson,
        };
      }
    }
  }

  return null;
}

export function detectDeterminerPatterns(
  tokens: Token[],
  mode: LanguageMode
): DeterminerMatch[] {
  const matches: DeterminerMatch[] = [];
  const config = LANG_CONFIG[mode];
  const { definiteArticles, thisWords, thatWords, pluralArticles } = config;

  for (let i = 0; i < tokens.length - 1; i++) {
    const word = tokens[i].original.toLowerCase();
    const nextToken = tokens[i + 1];
    const nextType = nextToken.type;
    const isNextNounLike =
      nextType === "noun" || nextType === "unknown" || nextType === "adjective";

    if (!isNextNounLike) continue;

    let type: DeterminerType | null = null;

    if (definiteArticles.includes(word)) {
      type = "definite";
    } else if (thisWords.includes(word)) {
      type = "this";
    } else if (thatWords.includes(word)) {
      type = "that";
    }

    if (type) {
      const isArticlePlural = pluralArticles.includes(word);
      const isNounPlural = nextToken.nounMatch?.isPlural === true;
      matches.push({
        determinerIndex: i,
        nounIndex: i + 1,
        type,
        determinerWord: tokens[i].original,
        nounWord: nextToken.original,
        isPlural: isArticlePlural || isNounPlural,
      });
    }
  }

  return matches;
}

function isGerund(word: string): boolean {
  const lower = word.toLowerCase();
  return (
    lower.endsWith("ing") ||
    lower.endsWith("ando") ||
    lower.endsWith("iendo") ||
    lower.endsWith("endo")
  );
}

function isInfinitive(token: Token): boolean {
  return token.type === "verb" && token.verbMatch?.tense === "infinitive";
}

export function detectCopulaPattern(
  tokens: Token[],
  mode: LanguageMode
): CopulaMatch | null {
  const config = LANG_CONFIG[mode];
  const {
    copulaVerbs,
    copulaPersonMap,
    thisWords,
    thatWords,
    pronouns,
    questionWordMap,
  } = config;
  const questionWords = Object.keys(questionWordMap);

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i].original.toLowerCase();

    if (copulaVerbs.includes(word)) {
      const afterCopula = tokens.slice(i + 1);
      const beforeCopula = tokens.slice(0, i);

      const onlyPronounsBefore = beforeCopula.every((t) =>
        pronouns.includes(t.original.toLowerCase())
      );

      const hasQuestionWordBefore = beforeCopula.some((t) =>
        questionWords.includes(t.original.toLowerCase())
      );

      const isStandalone =
        afterCopula.length === 0 &&
        (onlyPronounsBefore || hasQuestionWordBefore);

      if (isStandalone) {
        const impliedPerson = copulaPersonMap[word] || null;
        return {
          copulaIndex: i,
          copulaWord: tokens[i].original,
          subjectType: null,
          subjectIndex: null,
          impliedPerson,
          isStandalone: true,
        };
      }

      if (afterCopula.length === 0) {
        return null;
      }

      const firstAfter = afterCopula[0];
      if (isGerund(firstAfter.original) || isInfinitive(firstAfter)) {
        return null;
      }

      const hasPredicateAfter = afterCopula.some(
        (t) =>
          t.type === "noun" || t.type === "adjective" || t.type === "unknown"
      );

      if (!hasPredicateAfter) {
        return null;
      }

      let subjectType: "this" | "that" | null = null;
      let subjectIndex: number | null = null;

      if (i > 0) {
        const beforeCopulaWord = tokens[i - 1].original.toLowerCase();
        if (thisWords.includes(beforeCopulaWord)) {
          subjectType = "this";
          subjectIndex = i - 1;
        } else if (thatWords.includes(beforeCopulaWord)) {
          subjectType = "that";
          subjectIndex = i - 1;
        }
      }

      const impliedPerson = copulaPersonMap[word] || null;

      return {
        copulaIndex: i,
        copulaWord: tokens[i].original,
        subjectType,
        subjectIndex,
        impliedPerson,
        isStandalone: false,
      };
    }
  }

  return null;
}

export function detectPossessionPattern(
  tokens: Token[],
  mode: LanguageMode
): PossessionMatch | null {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const word = token.original;

    if (word.endsWith("'s") || word.endsWith("'s") || word.endsWith("ʼs")) {
      const possessorWord = word.slice(0, -2);
      if (i + 1 < tokens.length) {
        const nextToken = tokens[i + 1];
        if (
          nextToken.type === "noun" ||
          nextToken.type === "unknown" ||
          nextToken.type === "adjective"
        ) {
          return {
            pattern: "apostrophe_s",
            possessorIndex: i,
            possessedIndex: i + 1,
            possessorWord,
            possessedWord: nextToken.original,
          };
        }
      }
    }

    if (i + 1 < tokens.length) {
      const nextWord = tokens[i + 1].original;
      if (nextWord === "'s" || nextWord === "'s" || nextWord === "ʼs") {
        if (i + 2 < tokens.length) {
          const possessedToken = tokens[i + 2];
          if (
            possessedToken.type === "noun" ||
            possessedToken.type === "unknown" ||
            possessedToken.type === "adjective"
          ) {
            return {
              pattern: "apostrophe_s",
              possessorIndex: i,
              possessedIndex: i + 2,
              possessorWord: word,
              possessedWord: possessedToken.original,
              deIndex: i + 1,
            };
          }
        }
      }
    }
  }

  const { locativePrefixes } = LANG_CONFIG[mode];
  if (locativePrefixes.length > 0) {
    const maxPrefixWords = Math.max(
      ...locativePrefixes.map((lp) => lp.split(" ").length)
    );

    for (let i = 1; i < tokens.length - 1; i++) {
      const word = tokens[i].original.toLowerCase();
      if (word === "de" || word === "del") {
        const prevToken = tokens[i - 1];
        const nextToken = tokens[i + 1];

        let isLocativePrefix = false;
        for (
          let lookback = 1;
          lookback <= maxPrefixWords && i - lookback >= 0;
          lookback++
        ) {
          const candidatePrefix = tokens
            .slice(i - lookback, i)
            .map((t) => t.original.toLowerCase())
            .join(" ");
          if (locativePrefixes.some((lp) => candidatePrefix === lp)) {
            isLocativePrefix = true;
            break;
          }
        }
        if (isLocativePrefix) continue;

        const isPrevNounLike =
          prevToken.type === "noun" ||
          prevToken.type === "unknown" ||
          prevToken.type === "adjective";
        const isNextNounLike =
          nextToken.type === "noun" ||
          nextToken.type === "unknown" ||
          nextToken.type === "pronoun";

        if (isPrevNounLike && isNextNounLike) {
          return {
            pattern: word === "del" ? "del" : "de",
            possessorIndex: i + 1,
            possessedIndex: i - 1,
            possessorWord: nextToken.original,
            possessedWord: prevToken.original,
            deIndex: i,
          };
        }
      }
    }
  }

  return null;
}

export function detectPossessivePronounPattern(
  tokens: Token[],
  mode: LanguageMode
): PossessivePronounMatch | null {
  const { possessiveTriggers, possessiveOfDeTriggers } = LANG_CONFIG[mode];

  for (let i = 0; i < tokens.length - 1; i++) {
    const word = tokens[i].original.toLowerCase();
    const personNumber = possessiveTriggers[word];

    if (personNumber) {
      const nextToken = tokens[i + 1];
      const isNextNounLike =
        nextToken.type === "noun" ||
        nextToken.type === "unknown" ||
        nextToken.type === "adjective";

      if (isNextNounLike) {
        return {
          pronounIndex: i,
          pronounWord: tokens[i].original,
          possessedIndex: i + 1,
          possessedWord: nextToken.original,
          personNumber,
        };
      }
    }
  }

  for (let i = 1; i < tokens.length - 1; i++) {
    const word = tokens[i].original.toLowerCase();
    if (word === "de" || word === "del" || word === "of") {
      const prevToken = tokens[i - 1];
      const nextToken = tokens[i + 1];
      const nextWord = nextToken.original.toLowerCase();

      const isPrevNounLike =
        prevToken.type === "noun" ||
        prevToken.type === "unknown" ||
        prevToken.type === "adjective";
      const personNumber = possessiveOfDeTriggers[nextWord];

      if (isPrevNounLike && personNumber) {
        return {
          pronounIndex: i + 1,
          pronounWord: nextToken.original,
          possessedIndex: i - 1,
          possessedWord: prevToken.original,
          personNumber,
          deIndex: i,
        };
      }
    }
  }

  return null;
}

function normalizeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isPastParticipleES(word: string): boolean {
  const lower = normalizeAccents(word.toLowerCase());
  return (
    lower.endsWith("ado") ||
    lower.endsWith("ido") ||
    lower.endsWith("cho") ||
    lower.endsWith("to") ||
    lower.endsWith("so")
  );
}

function isCompoundTenseES(tokens: Token[]): boolean {
  const normalized = tokens.map((t) =>
    normalizeAccents(t.original.toLowerCase())
  );
  const haberNormalized = HABER_AUXILIARY_FORMS_ES.map((h) =>
    normalizeAccents(h)
  );
  for (let i = 0; i < normalized.length; i++) {
    if (haberNormalized.includes(normalized[i])) {
      for (let j = i + 1; j < Math.min(i + 4, normalized.length); j++) {
        if (isPastParticipleES(tokens[j].original)) {
          return true;
        }
      }
    }
  }
  return false;
}

function hasPhrase(
  tokens: Token[],
  phrase: string
): { found: boolean; indices: number[] } {
  const phraseParts = phrase.toLowerCase().split(" ");
  const normalizedTokens = tokens.map((t) =>
    normalizeAccents(t.original.toLowerCase())
  );

  if (phraseParts.length === 1) {
    const idx = normalizedTokens.indexOf(normalizeAccents(phraseParts[0]));
    if (idx !== -1) {
      return { found: true, indices: [idx] };
    }
    return { found: false, indices: [] };
  }

  for (let i = 0; i <= normalizedTokens.length - phraseParts.length; i++) {
    let match = true;
    for (let j = 0; j < phraseParts.length; j++) {
      if (normalizedTokens[i + j] !== normalizeAccents(phraseParts[j])) {
        match = false;
        break;
      }
    }
    if (match) {
      const indices: number[] = [];
      for (let j = 0; j < phraseParts.length; j++) {
        indices.push(i + j);
      }
      return { found: true, indices };
    }
  }
  return { found: false, indices: [] };
}

const LESS_SUFFIX_PATTERN = /(\w+)less$/i;
const FUL_SUFFIX_PATTERN = /(\w+)ful$/i;

export function detectMirriMiriwPattern(
  tokens: Token[],
  mode: LanguageMode
): MirriMiriwMatch | null {
  const config = LANG_CONFIG[mode];
  if (config.hasCompoundTense && isCompoundTenseES(tokens)) {
    return null;
  }
  const {
    thereIsNoPhrases,
    hasNoPhrases,
    without: sinWithout,
    mirriConjugations,
    miriwConjugations,
    thereIsPhrases,
    fullOfPhrases,
    negation: negationTokens,
  } = config;

  const lowerTokens = tokens.map((t) =>
    normalizeAccents(t.original.toLowerCase())
  );
  const hasNegation = negationTokens.some((neg) => lowerTokens.includes(neg));

  for (const [phrase, person] of thereIsNoPhrases) {
    const result = hasPhrase(tokens, phrase);
    if (result.found) {
      return {
        suffixType: "miriw",
        triggerPhrase: phrase,
        triggerIndices: result.indices,
        personNumber: person,
        isLessSuffix: false,
        lessBase: null,
        isFulSuffix: false,
        fulBase: null,
        explanation: `"${phrase}" → ${config.miriwWithoutSimple}`,
      };
    }
  }

  for (const [phrase, person] of hasNoPhrases) {
    const result = hasPhrase(tokens, phrase);
    if (result.found) {
      return {
        suffixType: "miriw",
        triggerPhrase: phrase,
        triggerIndices: result.indices,
        personNumber: person,
        isLessSuffix: false,
        lessBase: null,
        isFulSuffix: false,
        fulBase: null,
        explanation: `"${phrase}" → ${config.miriwNoHave}`,
      };
    }
  }

  for (const phrase of sinWithout) {
    const result = hasPhrase(tokens, phrase);
    if (result.found) {
      return {
        suffixType: "miriw",
        triggerPhrase: phrase,
        triggerIndices: result.indices,
        personNumber: null,
        isLessSuffix: false,
        lessBase: null,
        isFulSuffix: false,
        fulBase: null,
        explanation: `"${phrase}" → ${config.miriwWithout}`,
      };
    }
  }

  if (hasNegation) {
    const { defaultNegationWord } = config;
    for (const entry of mirriConjugations) {
      const normalizedWord = normalizeAccents(entry.word.toLowerCase());
      const tokenIdx = lowerTokens.indexOf(normalizedWord);
      if (tokenIdx !== -1) {
        const negIdx = lowerTokens.findIndex((t) => negationTokens.includes(t));
        const negWord =
          negIdx !== -1 ? tokens[negIdx].original : defaultNegationWord;
        return {
          suffixType: "miriw",
          triggerPhrase: `${negWord} ${entry.word}`,
          triggerIndices: negIdx !== -1 ? [negIdx, tokenIdx] : [tokenIdx],
          personNumber: entry.person,
          isLessSuffix: false,
          lessBase: null,
          isFulSuffix: false,
          fulBase: null,
          explanation: `"${negWord} ${entry.word}" → ${config.miriwNegationHave}`,
        };
      }
    }

    for (const entry of miriwConjugations) {
      const normalizedWord = normalizeAccents(entry.word.toLowerCase());
      const tokenIdx = lowerTokens.indexOf(normalizedWord);
      if (tokenIdx !== -1) {
        const negIdx = lowerTokens.findIndex((t) => negationTokens.includes(t));
        const negWord =
          negIdx !== -1 ? tokens[negIdx].original : defaultNegationWord;
        return {
          suffixType: "mirri",
          triggerPhrase: `${negWord} ${entry.word}`,
          triggerIndices: negIdx !== -1 ? [negIdx, tokenIdx] : [tokenIdx],
          personNumber: entry.person,
          isLessSuffix: false,
          lessBase: null,
          isFulSuffix: false,
          fulBase: null,
          explanation: `"${negWord} ${entry.word}" → ${config.mirriNegationLack}`,
        };
      }
    }
  }

  for (const entry of miriwConjugations) {
    const normalizedWord = normalizeAccents(entry.word.toLowerCase());
    const tokenIdx = lowerTokens.indexOf(normalizedWord);
    if (tokenIdx !== -1) {
      return {
        suffixType: "miriw",
        triggerPhrase: entry.word,
        triggerIndices: [tokenIdx],
        personNumber: entry.person,
        isLessSuffix: false,
        lessBase: null,
        isFulSuffix: false,
        fulBase: null,
        explanation: `"${entry.word}" → ${config.miriwLackMiss}`,
      };
    }
  }

  if (config.hasLessFulSuffixes) {
    for (let i = 0; i < tokens.length; i++) {
      const token = lowerTokens[i];
      const lessMatch = token.match(LESS_SUFFIX_PATTERN);
      if (lessMatch) {
        return {
          suffixType: "miriw",
          triggerPhrase: tokens[i].original,
          triggerIndices: [i],
          personNumber: null,
          isLessSuffix: true,
          lessBase: lessMatch[1],
          isFulSuffix: false,
          fulBase: null,
          explanation: `"-less" ${config.miriwLessSuffix} "${tokens[i].original}"`,
        };
      }
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = lowerTokens[i];
      const fulMatch = token.match(FUL_SUFFIX_PATTERN);
      if (fulMatch) {
        return {
          suffixType: "mirri",
          triggerPhrase: tokens[i].original,
          triggerIndices: [i],
          personNumber: null,
          isLessSuffix: false,
          lessBase: null,
          isFulSuffix: true,
          fulBase: fulMatch[1],
          explanation: `"-ful" ${config.mirriFulSuffix} "${tokens[i].original}"`,
        };
      }
    }
  }

  for (const [phrase, person] of thereIsPhrases) {
    const result = hasPhrase(tokens, phrase);
    if (result.found) {
      return {
        suffixType: "mirri",
        triggerPhrase: phrase,
        triggerIndices: result.indices,
        personNumber: person,
        isLessSuffix: false,
        lessBase: null,
        isFulSuffix: false,
        fulBase: null,
        explanation: `"${phrase}" → ${config.mirriThereIs}`,
      };
    }
  }

  for (const [phrase] of fullOfPhrases) {
    const result = hasPhrase(tokens, phrase);
    if (result.found) {
      return {
        suffixType: "mirri",
        triggerPhrase: phrase,
        triggerIndices: result.indices,
        personNumber: null,
        isLessSuffix: false,
        lessBase: null,
        isFulSuffix: false,
        fulBase: null,
        explanation: `"${phrase}" → ${config.mirriFullOf}`,
      };
    }
  }

  for (const entry of mirriConjugations) {
    const normalizedWord = normalizeAccents(entry.word.toLowerCase());
    const tokenIdx = lowerTokens.indexOf(normalizedWord);
    if (tokenIdx !== -1) {
      return {
        suffixType: "mirri",
        triggerPhrase: entry.word,
        triggerIndices: [tokenIdx],
        personNumber: entry.person,
        isLessSuffix: false,
        lessBase: null,
        isFulSuffix: false,
        fulBase: null,
        explanation: `"${entry.word}" → ${config.mirriHavePossess}`,
      };
    }
  }

  return null;
}

function getQuestionLabel(
  type: QuestionMatch["type"],
  mode: LanguageMode
): string {
  const info = QUESTION_GUP[type];
  return info[mode];
}

function detectQuestionPattern(
  tokens: Token[],
  mode: LanguageMode,
  originalText?: string
): QuestionMatch | null {
  const tokenStrings = tokens.map((t) => t.original);
  const text = originalText || tokenStrings.join(" ");

  const patternResult = detectQuestionPatternFromRules(
    tokenStrings,
    mode,
    text
  );
  if (patternResult?.detected) {
    const firstIdx = patternResult.consumedIndices[0] ?? 0;
    const info = QUESTION_GUP[patternResult.questionType];
    return {
      type: patternResult.questionType,
      questionWordIndex: firstIdx,
      gup: info.gup,
      explanation: patternResult.explanation,
      isComplexPattern: patternResult.isComplexPattern ?? false,
      patternOutput: patternResult.gupOutput,
      consumedIndices: patternResult.consumedIndices,
      patternOptions: patternResult.options,
      answerInfo: patternResult.answerInfo,
      hasExplicitSubject: patternResult.hasExplicitSubject,
      subjectInfo: patternResult.subjectInfo,
    };
  }

  const { questionWordMap, whoseCompoundPattern } = LANG_CONFIG[mode];

  if (whoseCompoundPattern) {
    for (let i = 0; i < tokens.length - 1; i++) {
      const word = tokens[i].original.toLowerCase();
      const nextWord = tokens[i + 1].original.toLowerCase();
      if (
        word === whoseCompoundPattern.preposition &&
        whoseCompoundPattern.words.includes(nextWord)
      ) {
        const info = QUESTION_GUP["whose"];
        const label = getQuestionLabel("whose", mode);
        return {
          type: "whose",
          questionWordIndex: i,
          questionWordEndIndex: i + 1,
          gup: info.gup,
          explanation: `${word} ${nextWord} → ${info.gup} (${label})`,
        };
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i].original.toLowerCase();
    const questionType = questionWordMap[word];

    if (questionType) {
      const info = QUESTION_GUP[questionType];
      const label = getQuestionLabel(questionType, mode);
      return {
        type: questionType,
        questionWordIndex: i,
        gup: info.gup,
        explanation: `${word} → ${info.gup} (${label})`,
      };
    }
  }

  return null;
}

export function analyzeFraseContext(
  tokens: Token[],
  originalText: string,
  mode: LanguageMode
): FraseContext {
  const negationWords = getNegationWords(mode);
  const { pronouns } = LANG_CONFIG[mode];

  const hasNegation = tokens.some((t) =>
    negationWords.includes(t.original.toLowerCase())
  );
  const hasSubject = tokens.some((t) =>
    pronouns.includes(t.original.toLowerCase())
  );
  const hasExclamation = originalText.includes("!");
  const isQuestion = originalText.includes("?") || originalText.startsWith("¿");
  const questionMatch = detectQuestionPattern(tokens, mode, originalText);
  const matchedPattern = matchPatterns(tokens, mode);
  const determinerMatches = detectDeterminerPatterns(tokens, mode);
  const copulaMatch = detectCopulaPattern(tokens, mode);
  const possessionMatch = detectPossessionPattern(tokens, mode);
  const possessivePronounMatch = detectPossessivePronounPattern(tokens, mode);
  const mirriMiriwMatch = detectMirriMiriwPattern(tokens, mode);

  const locativeMatch = detectLocativePattern(tokens, mode);
  const humanAllativePronounMatch = detectHumanAllativePronounPattern(
    tokens,
    mode
  );
  const humanAblativePronounMatch = humanAllativePronounMatch
    ? null
    : detectHumanAblativePronounPattern(tokens, mode);
  const sourceOriginPronounMatch =
    humanAllativePronounMatch || humanAblativePronounMatch
      ? null
      : detectSourceOriginPronounPattern(tokens, mode);
  const purposePronounMatch =
    humanAllativePronounMatch ||
    humanAblativePronounMatch ||
    sourceOriginPronounMatch
      ? null
      : detectPurposePronounPattern(tokens, mode);
  const comitativePronounMatch =
    humanAllativePronounMatch ||
    humanAblativePronounMatch ||
    sourceOriginPronounMatch ||
    purposePronounMatch
      ? null
      : detectComitativePronounPattern(tokens, mode);
  const conWithMatch = detectConWithPattern(tokens, mode);
  const instrumentalMatch = detectInstrumentalPattern(tokens, mode);
  const belongingMatch = detectBelongingPattern(tokens, mode);
  const transportMatch = detectTransportPattern(tokens, mode);
  const locativeCopulaMatch = detectLocativeCopulaPattern(
    tokens,
    mode,
    copulaMatch,
    locativeMatch,
    conWithMatch
  );
  const indirectObjectMatch = detectIndirectObjectPattern(tokens, mode);

  return {
    hasNegation,
    hasSubject,
    hasExclamation,
    isQuestion,
    questionMatch,
    matchedPattern,
    determinerMatches,
    copulaMatch,
    possessionMatch,
    possessivePronounMatch,
    mirriMiriwMatch,
    locativeMatch,
    conWithMatch,
    instrumentalMatch,
    belongingMatch,
    transportMatch,
    comitativePronounMatch,
    humanAllativePronounMatch,
    humanAblativePronounMatch,
    sourceOriginPronounMatch,
    purposePronounMatch,
    locativeCopulaMatch,
    indirectObjectMatch,
  };
}

function getReinforcerForTrigger(
  trigger: string
): LocativeReinforcerInfo | null {
  const lower = trigger.toLowerCase();
  for (const r of LOCATIVE_REINFORCERS) {
    if (lower.startsWith(r.prefix)) {
      return r;
    }
  }
  return null;
}

function isOtherPatternTrigger(
  tokens: Token[],
  startIdx: number,
  mode: LanguageMode,
  excludeTriggers?: string[]
): boolean {
  const config = LANG_CONFIG[mode];
  const {
    conWithTriggers,
    locativeTriggers,
    definiteArticles,
    pluralArticles,
  } = config;
  const allArticles = new Set([...definiteArticles, ...pluralArticles]);
  const excludeSet = new Set(
    (excludeTriggers || []).map((t) => t.split(" ")[0].toLowerCase())
  );
  const otherTriggerWords = new Set<string>();
  for (const trigger of [...conWithTriggers, ...locativeTriggers]) {
    const firstWord = trigger.split(" ")[0].toLowerCase();
    if (!excludeSet.has(firstWord)) {
      otherTriggerWords.add(firstWord);
    }
  }
  for (let i = startIdx; i < tokens.length; i++) {
    const tLower = tokens[i].original.toLowerCase();
    if (allArticles.has(tLower)) continue;
    return otherTriggerWords.has(tLower);
  }
  return false;
}

export function detectLocativePattern(
  tokens: Token[],
  mode: LanguageMode
): LocativeMatch | null {
  const config = LANG_CONFIG[mode];
  const { locativeTriggers } = config;
  const sortedTriggers = [...locativeTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (result.found) {
      const lastTriggerIdx = Math.max(...result.indices);
      const nounIndices: number[] = [];
      for (let i = lastTriggerIdx + 1; i < tokens.length; i++) {
        const t = tokens[i];
        if (
          t.type === "noun" ||
          t.type === "unknown" ||
          t.type === "adjective" ||
          t.type === "pronoun"
        ) {
          nounIndices.push(i);
        } else if (t.type === "verb") {
          break;
        } else if (t.type === "connector") {
          if (isOtherPatternTrigger(tokens, i + 1, mode, locativeTriggers)) {
            break;
          }
          continue;
        }
      }

      if (nounIndices.length > 0) {
        const reinforcer = getReinforcerForTrigger(trigger);
        return {
          triggerPhrase: trigger,
          triggerIndices: result.indices,
          nounIndices,
          reinforcer,
          explanation: `"${trigger}" → ${config.locativeExplanation}`,
        };
      }
    }
  }

  return null;
}

export function detectConWithPattern(
  tokens: Token[],
  mode: LanguageMode
): ConWithMatch | null {
  const config = LANG_CONFIG[mode];
  const { conWithTriggers } = config;
  const sortedTriggers = [...conWithTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (result.found) {
      const lastTriggerIdx = Math.max(...result.indices);
      const nounIndices: number[] = [];
      for (let i = lastTriggerIdx + 1; i < tokens.length; i++) {
        const t = tokens[i];
        if (
          t.type === "noun" ||
          t.type === "unknown" ||
          t.type === "adjective" ||
          t.type === "pronoun"
        ) {
          nounIndices.push(i);
        } else if (t.type === "verb") {
          break;
        } else if (t.type === "connector") {
          if (isOtherPatternTrigger(tokens, i + 1, mode, conWithTriggers)) {
            break;
          }
          continue;
        }
      }

      if (nounIndices.length > 0) {
        return {
          triggerPhrase: trigger,
          triggerIndices: result.indices,
          nounIndices,
          explanation: `"${trigger}" → ${config.conWithExplanation}`,
        };
      }
    }
  }

  return null;
}

export function detectInstrumentalPattern(
  tokens: Token[],
  mode: LanguageMode
): InstrumentalMatch | null {
  const config = LANG_CONFIG[mode];
  const { instrumentalTriggers } = config;
  const sortedTriggers = [...instrumentalTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (result.found) {
      const lastTriggerIdx = Math.max(...result.indices);
      const nounIndices: number[] = [];
      for (let i = lastTriggerIdx + 1; i < tokens.length; i++) {
        const t = tokens[i];
        if (
          t.type === "noun" ||
          t.type === "unknown" ||
          t.type === "adjective"
        ) {
          nounIndices.push(i);
        } else if (t.type === "verb") {
          break;
        } else if (t.type === "connector") {
          continue;
        }
      }

      if (nounIndices.length > 0) {
        return {
          triggerPhrase: trigger,
          triggerIndices: result.indices,
          nounIndices,
          explanation: `"${trigger}" → instrumental`,
        };
      }
    }
  }

  return null;
}

export function detectBelongingPattern(
  tokens: Token[],
  mode: LanguageMode
): BelongingMatch | null {
  const config = LANG_CONFIG[mode];
  const {
    belongingTriggers,
    aboutTriggers,
    purposePronounTriggers,
    possessiveOfDeTriggers,
    belongingPronounTriggers,
  } = config;

  const sortedTriggers = [...belongingTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (result.found) {
      const triggerIdx = result.indices[0];
      const lastTriggerIdx = Math.max(...result.indices);

      const nextIdx = lastTriggerIdx + 1;
      if (nextIdx >= tokens.length) continue;

      const nextToken = tokens[nextIdx];
      const nextWord = nextToken.original.toLowerCase();

      const belongingPronounPN = belongingPronounTriggers?.[nextWord] as PersonNumber | undefined;
      if (belongingPronounPN) {
        const isAboutTrigger = aboutTriggers.some(
          (t) => t.toLowerCase() === trigger.toLowerCase()
        );
        return {
          triggerPhrase: trigger,
          triggerIndices: result.indices,
          belongsToNounIndices: [nextIdx],
          mainNounIndices: triggerIdx > 0 ? [triggerIdx - 1] : [],
          explanation: `"${trigger}" + ${nextWord} → ${config.pronounBelonging}`,
          isAboutTrigger,
          isPronoun: true,
          pronounPersonNumber: belongingPronounPN,
          pronounWord: nextWord,
        };
      }

      const isPronoun = !!(
        purposePronounTriggers?.[nextWord] ||
        possessiveOfDeTriggers?.[nextWord] ||
        config.pronouns.includes(nextWord)
      );
      if (isPronoun) continue;

      const isNextNounLike =
        nextToken.type === "noun" ||
        nextToken.type === "unknown" ||
        nextToken.type === "adjective";

      if (!isNextNounLike) continue;

      if (triggerIdx > 0) {
        const prevToken = tokens[triggerIdx - 1];
        const isPrevNounLike =
          prevToken.type === "noun" ||
          prevToken.type === "unknown" ||
          prevToken.type === "adjective";

        if (!isPrevNounLike) continue;

        const belongsToNounIndices: number[] = [nextIdx];
        const mainNounIndices: number[] = [triggerIdx - 1];

        const isAboutTrigger = aboutTriggers.some(
          (t) => t.toLowerCase() === trigger.toLowerCase()
        );

        return {
          triggerPhrase: trigger,
          triggerIndices: result.indices,
          belongsToNounIndices,
          mainNounIndices,
          explanation: `"${trigger}" → ${config.belongingLabel}`,
          isAboutTrigger,
        };
      } else {
        const belongsToNounIndices: number[] = [nextIdx];
        const mainNounIndices: number[] = [];

        const isAboutTrigger = aboutTriggers.some(
          (t) => t.toLowerCase() === trigger.toLowerCase()
        );

        return {
          triggerPhrase: trigger,
          triggerIndices: result.indices,
          belongsToNounIndices,
          mainNounIndices,
          explanation: `"${trigger}" → ${config.belongingLabel}`,
          isAboutTrigger,
        };
      }
    }
  }

  return null;
}

export function detectTransportPattern(
  tokens: Token[],
  mode: LanguageMode
): TransportMatch | null {
  const config = LANG_CONFIG[mode];
  const { transportTriggers, vehicles } = config;

  const hasMovementVerb = tokens.some(
    (t) => t.type === "verb" && t.verbMatch?.entry.motionType === "motion"
  );

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const lower = token.original.toLowerCase();

    if (transportTriggers.includes(lower)) {
      const nounIndices: number[] = [];
      let isKnownVehicle = false;

      const { definiteArticles, pluralArticles } = config;
      const allArticles = new Set([...definiteArticles, ...pluralArticles]);

      for (let j = i + 1; j < tokens.length; j++) {
        const t = tokens[j];
        const tLower = t.original.toLowerCase();
        if (allArticles.has(tLower)) {
          continue;
        }
        if (
          t.type === "noun" ||
          t.type === "unknown" ||
          t.type === "adjective"
        ) {
          nounIndices.push(j);
          const nounLower = t.original.toLowerCase();
          if (vehicles.includes(nounLower)) {
            isKnownVehicle = true;
          }
          break;
        } else if (t.type === "verb") {
          break;
        } else if (t.type === "connector" || t.type === "pronoun") {
          continue;
        }
      }

      if (nounIndices.length > 0 && (isKnownVehicle || hasMovementVerb)) {
        return {
          triggerPhrase: lower,
          triggerIndices: [i],
          nounIndices,
          isKnownVehicle,
          hasMovementVerb,
          explanation: `"${lower}" + ${
            isKnownVehicle ? config.transportLabel : config.transportOption
          }`,
        };
      }
    }
  }

  return null;
}

const PRONOUN_PATTERN_CONFIG: Record<
  PronounPatternType,
  {
    triggersKey: keyof typeof LANG_CONFIG.es;
    gupKey: keyof typeof LANG_CONFIG.es;
    label: string;
  }
> = {
  comitative: {
    triggersKey: "comitativePronounTriggers",
    gupKey: "comitativePronounsGup",
    label: "comitative pronoun",
  },
  humanAllative: {
    triggersKey: "humanAllativePronounTriggers",
    gupKey: "humanAllativePronounsGup",
    label: "human allative pronoun",
  },
  humanAblative: {
    triggersKey: "humanAblativePronounTriggers",
    gupKey: "humanAblativePronounsGup",
    label: "human ablative pronoun",
  },
  sourceOrigin: {
    triggersKey: "sourceOriginPronounTriggers",
    gupKey: "sourceOriginPronounsGup",
    label: "source/origin pronoun",
  },
  purpose: {
    triggersKey: "purposePronounTriggers",
    gupKey: "purposePronounsGup",
    label: "purpose pronoun",
  },
};

function normalizeText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function detectPronounPattern(
  tokens: Token[],
  mode: LanguageMode,
  patternType: PronounPatternType
): PronounMatch | null {
  const config = LANG_CONFIG[mode];
  const { triggersKey, gupKey, label } = PRONOUN_PATTERN_CONFIG[patternType];
  const triggers = config[triggersKey] as Record<string, PersonNumber>;
  const gupMap = config[gupKey] as Record<PersonNumber, string[]>;

  const text = tokens.map((t) => t.original.toLowerCase()).join(" ");
  const normalizedText = normalizeText(text);

  const sortedTriggers = Object.keys(triggers).sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const normalizedTrigger = normalizeText(trigger);

    if (normalizedText.includes(normalizedTrigger)) {
      const personNumber = triggers[trigger];
      const gupForms = gupMap[personNumber];

      const triggerWords = trigger.split(" ");
      const triggerIndices: number[] = [];

      for (let i = 0; i <= tokens.length - triggerWords.length; i++) {
        let matches = true;
        for (let j = 0; j < triggerWords.length; j++) {
          const tokenNorm = normalizeText(tokens[i + j].original);
          const triggerWordNorm = normalizeText(triggerWords[j]);
          if (tokenNorm !== triggerWordNorm) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const lastTriggerWord =
            triggerWords[triggerWords.length - 1].toLowerCase();
          const nextTokenIdx = i + triggerWords.length;
          const nextToken = tokens[nextTokenIdx];

          const normalizedLastWord = normalizeText(lastTriggerWord);
          if (
            normalizedLastWord === "el" &&
            nextToken &&
            (nextToken.type === "noun" || nextToken.type === "unknown")
          ) {
            continue;
          }

          for (let j = 0; j < triggerWords.length; j++) {
            triggerIndices.push(i + j);
          }
          break;
        }
      }

      if (triggerIndices.length > 0) {
        let allGupForms = [...gupForms];

        if (personNumber === "1+2_Plur") {
          const exclusiveForms = gupMap["1+3_Plur"];
          if (exclusiveForms) {
            allGupForms = [...allGupForms, ...exclusiveForms];
          }
        } else if (personNumber === "1+2_Dual") {
          const exclusiveForms = gupMap["1+3_Dual"];
          if (exclusiveForms) {
            allGupForms = [...allGupForms, ...exclusiveForms];
          }
        }

        return {
          triggerPhrase: trigger,
          triggerIndices,
          personNumber,
          gupForms: allGupForms,
          explanation: `"${trigger}" → ${allGupForms[0]} (${label})`,
        };
      }
    }
  }

  return null;
}

export function detectComitativePronounPattern(
  tokens: Token[],
  mode: LanguageMode
): ComitativePronounMatch | null {
  return detectPronounPattern(tokens, mode, "comitative");
}

export function detectHumanAllativePronounPattern(
  tokens: Token[],
  mode: LanguageMode
): HumanAllativePronounMatch | null {
  return detectPronounPattern(tokens, mode, "humanAllative");
}

export function detectHumanAblativePronounPattern(
  tokens: Token[],
  mode: LanguageMode
): HumanAblativePronounMatch | null {
  return detectPronounPattern(tokens, mode, "humanAblative");
}

export function detectSourceOriginPronounPattern(
  tokens: Token[],
  mode: LanguageMode
): SourceOriginPronounMatch | null {
  return detectPronounPattern(tokens, mode, "sourceOrigin");
}

export function detectPurposePronounPattern(
  tokens: Token[],
  mode: LanguageMode
): PurposePronounMatch | null {
  return detectPronounPattern(tokens, mode, "purpose");
}

function normalizeAccentsSimple(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectPositionType(tokens: Token[], mode: LanguageMode): PositionType {
  const { upPositionTriggers, lyingPositionTriggers } = LANG_CONFIG[mode];

  const text = tokens.map((t) => t.original.toLowerCase()).join(" ");
  const normalizedText = normalizeAccentsSimple(text);

  for (const trigger of upPositionTriggers) {
    if (normalizedText.includes(normalizeAccentsSimple(trigger))) {
      return "up";
    }
  }

  for (const trigger of lyingPositionTriggers) {
    if (normalizedText.includes(normalizeAccentsSimple(trigger))) {
      return "lying";
    }
  }

  return "default";
}

function getSuggestedVerbs(
  positionType: PositionType,
  isHuman: boolean | null
): LocativeVerbType[] {
  if (positionType === "up") {
    return ["gorruma"];
  }
  if (positionType === "lying") {
    return ["ŋorra"];
  }

  if (isHuman === true) {
    return ["nhina"];
  }
  if (isHuman === false) {
    return ["dhärra", "ŋorra"];
  }
  return ["nhina", "dhärra", "gorruma", "ŋorra"];
}

function getCopulaTense(
  copulaWord: string,
  mode: LanguageMode
): "present" | "past" | "future" {
  const lower = normalizeAccentsSimple(copulaWord);
  const { copulaPastForms, copulaFutureForms } = LANG_CONFIG[mode];

  const normalizedPastForms = copulaPastForms.map((f) =>
    normalizeAccentsSimple(f)
  );
  const normalizedFutureForms = copulaFutureForms.map((f) =>
    normalizeAccentsSimple(f)
  );

  if (normalizedPastForms.includes(lower)) return "past";
  if (normalizedFutureForms.includes(lower)) return "future";
  if (lower.includes("will")) return "future";
  return "present";
}

function isCopulaContinuous(copulaWord: string, mode: LanguageMode): boolean {
  const lower = normalizeAccentsSimple(copulaWord);
  const { copulaImperfectForms } = LANG_CONFIG[mode];

  const normalizedImperfectForms = copulaImperfectForms.map((f) =>
    normalizeAccentsSimple(f)
  );
  return normalizedImperfectForms.includes(lower);
}

function getCopulaPerson(
  copulaWord: string,
  mode: LanguageMode
): PersonNumber | null {
  const { copulaPersonMap } = LANG_CONFIG[mode];
  const lower = normalizeAccentsSimple(copulaWord);

  for (const [form, person] of Object.entries(copulaPersonMap)) {
    if (normalizeAccentsSimple(form) === lower) {
      return person;
    }
  }

  return null;
}

function getVerbLabel(gupKey: LocativeVerbType, mode: LanguageMode): string {
  const info = LOCATIVE_VERBS.find((lv) => lv.gupKey === gupKey);
  if (!info) return gupKey;
  const labelKey = LANG_CONFIG[mode].labelKey;
  return info[labelKey];
}

export function detectLocativeCopulaPattern(
  tokens: Token[],
  mode: LanguageMode,
  copulaMatch: CopulaMatch | null,
  locativeMatch: LocativeMatch | null,
  conWithMatch: ConWithMatch | null
): LocativeCopulaMatch | null {
  if (!copulaMatch) return null;
  if (!locativeMatch && !conWithMatch) return null;

  const config = LANG_CONFIG[mode];
  const copulaWord = copulaMatch.copulaWord;
  const copulaIndex = copulaMatch.copulaIndex;

  const tense = getCopulaTense(copulaWord, mode);
  const person = copulaMatch.impliedPerson || getCopulaPerson(copulaWord, mode);

  const positionType = detectPositionType(tokens, mode);

  let isHumanSubject: boolean | null = null;
  const impliedPerson = copulaMatch.impliedPerson;
  if (impliedPerson !== null) {
    const isThirdPerson =
      impliedPerson === "3_Sing" || impliedPerson === "3_Plur";
    if (!isThirdPerson) {
      isHumanSubject = true;
    }
  }
  for (const token of tokens) {
    if (token.type === "pronoun") {
      const lower = token.original.toLowerCase();
      const nonHumanPronouns = ["it", "ello"];
      const humanPronouns = [
        "él",
        "el",
        "ella",
        "ellos",
        "ellas",
        "he",
        "she",
        "they",
        "him",
        "her",
        "them",
      ];
      if (nonHumanPronouns.includes(lower)) {
        isHumanSubject = false;
        break;
      }
      if (humanPronouns.includes(lower)) {
        isHumanSubject = true;
        break;
      }
    }
    if (token.type === "noun" && token.nounMatch?.isHuman !== undefined) {
      isHumanSubject = token.nounMatch.isHuman;
      break;
    }
  }

  const suggestedVerbs = getSuggestedVerbs(positionType, isHumanSubject);
  const isContinuous = isCopulaContinuous(copulaWord, mode);

  const verbLabels = suggestedVerbs.map((v) => getVerbLabel(v, mode));

  return {
    copulaIndex,
    copulaWord,
    tense,
    isContinuous,
    person,
    positionType,
    suggestedVerbs,
    isHumanSubject,
    explanation: `${config.copulaPositionalExplanation}: ${verbLabels.join(
      " / "
    )}`,
  };
}

export function detectIndirectObjectPattern(
  tokens: Token[],
  mode: LanguageMode
): IndirectObjectMatch | null {
  const config = LANG_CONFIG[mode];
  const {
    indirectObjectClitics,
    indirectObjectPrepositions,
    indirectObjectLabel,
  } = config;

  const verbIdx = tokens.findIndex((t) => t.type === "verb");
  if (verbIdx === -1) return null;

  const verbToken = tokens[verbIdx];
  if (!verbToken.verbMatch?.entry?.ditrans) return null;

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i].original.toLowerCase();
    const personNumber = indirectObjectClitics[word];

    if (personNumber) {
      return {
        type: "clitic",
        triggerWord: tokens[i].original,
        triggerIndex: i,
        personNumber,
        nounIndex: null,
        nounWord: null,
        explanation: `"${tokens[i].original}" → ${indirectObjectLabel}`,
      };
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const word = tokens[i].original.toLowerCase();

    if (indirectObjectPrepositions.includes(word)) {
      const nextToken = tokens[i + 1];
      if (
        nextToken.type === "pronoun" ||
        nextToken.type === "noun" ||
        nextToken.type === "unknown"
      ) {
        const nextWordLower = nextToken.original.toLowerCase();
        let personNumber: PersonNumber | null =
          config.pronounTriggers[nextWordLower] || null;

        if (!personNumber && config.objectPronounTriggers) {
          const objTypes = config.objectPronounTriggers[nextWordLower];
          if (objTypes && objTypes.length > 0) {
            personNumber = objTypes[0] as PersonNumber;
          }
        }

        return {
          type: "preposition",
          triggerWord: tokens[i].original,
          triggerIndex: i,
          personNumber,
          nounIndex: i + 1,
          nounWord: nextToken.original,
          explanation: `"${tokens[i].original} ${nextToken.original}" → ${indirectObjectLabel}`,
        };
      }
    }
  }

  return null;
}

export function detectTimesPattern(
  tokens: Token[],
  mode: LanguageMode
): TimesMatch | null {
  const config = LANG_CONFIG[mode];
  const { timesTriggers, timesQuantifiers, fixedTimesPhrases, timesLabel } = config;
  const lowerTokens = tokens.map((t) => t.original.toLowerCase());

  const sortedPhrases = Object.keys(fixedTimesPhrases).sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const phrase of sortedPhrases) {
    const phraseWords = phrase.split(" ");
    for (let i = 0; i <= lowerTokens.length - phraseWords.length; i++) {
      let matches = true;
      for (let j = 0; j < phraseWords.length; j++) {
        if (lowerTokens[i + j] !== phraseWords[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        const fixedInfo = fixedTimesPhrases[phrase];
        const consumedIndices: number[] = [];
        for (let j = 0; j < phraseWords.length; j++) {
          consumedIndices.push(i + j);
        }
        const sourcePhrase = tokens
          .slice(i, i + phraseWords.length)
          .map((t) => t.original)
          .join(" ");

        return {
          quantifierWord: sourcePhrase,
          quantifierIndex: i,
          timesWord: sourcePhrase,
          timesIndex: i + phraseWords.length - 1,
          consumedIndices,
          gupBase: fixedInfo.gup.replace(/mirri$/, ""),
          gupWithMirri: fixedInfo.gup,
          explanation: `${sourcePhrase} → ${fixedInfo.gup} (${timesLabel})`,
          isQuestion: fixedInfo.isQuestion,
          isFixedPhrase: true,
        };
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const word = lowerTokens[i];

    if (timesTriggers.includes(word)) {
      if (i > 0) {
        const prevWord = lowerTokens[i - 1];
        const gupBase = timesQuantifiers[prevWord];

        if (gupBase) {
          const gupWithMirri = gupBase + "mirri";
          const isQuestion = prevWord.startsWith("cuánt") ||
                            prevWord.startsWith("cuant") ||
                            prevWord === "how many" ||
                            prevWord.includes("nhämunha");

          return {
            quantifierWord: tokens[i - 1].original,
            quantifierIndex: i - 1,
            timesWord: tokens[i].original,
            timesIndex: i,
            consumedIndices: [i - 1, i],
            gupBase,
            gupWithMirri,
            explanation: `${tokens[i - 1].original} ${tokens[i].original} → ${gupWithMirri} (${timesLabel})`,
            isQuestion,
            isFixedPhrase: false,
          };
        }

        const unknownGup = prevWord + "mirri";
        return {
          quantifierWord: tokens[i - 1].original,
          quantifierIndex: i - 1,
          timesWord: tokens[i].original,
          timesIndex: i,
          consumedIndices: [i - 1, i],
          gupBase: prevWord,
          gupWithMirri: unknownGup,
          explanation: `${tokens[i - 1].original} ${tokens[i].original} → ${unknownGup} (${timesLabel})`,
          isQuestion: false,
          isFixedPhrase: false,
        };
      }
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const word = lowerTokens[i];
    const nextWord = lowerTokens[i + 1];
    const twoWordPhrase = `${word} ${nextWord}`;

    if (timesQuantifiers[twoWordPhrase]) {
      const gupBase = timesQuantifiers[twoWordPhrase];

      for (let j = i + 2; j < tokens.length; j++) {
        if (timesTriggers.includes(lowerTokens[j])) {
          const gupWithMirri = gupBase + "mirri";
          const isQuestion = twoWordPhrase === "how many" ||
                            twoWordPhrase.startsWith("cuánt") ||
                            twoWordPhrase.startsWith("cuant");

          return {
            quantifierWord: `${tokens[i].original} ${tokens[i + 1].original}`,
            quantifierIndex: i,
            timesWord: tokens[j].original,
            timesIndex: j,
            consumedIndices: [i, i + 1, j],
            gupBase,
            gupWithMirri,
            explanation: `${tokens[i].original} ${tokens[i + 1].original} ${tokens[j].original} → ${gupWithMirri} (${timesLabel})`,
            isQuestion,
            isFixedPhrase: false,
          };
        }
      }
    }
  }

  return null;
}

export interface AgentNounMatch {
  originalWord: string;
  derivedVerb: string;
  verbGup: string;
  agentGup: string;
  explanation: string;
}

export function detectAgentNoun(
  word: string,
  mode: LanguageMode
): AgentNounMatch | null {
  const config = LANG_CONFIG[mode];
  const { agentNounSuffixes, agentNounLabel } = config;
  const wordLower = word.toLowerCase();

  const sortedSuffixes = [...agentNounSuffixes].sort(
    (a, b) => b.suffix.length - a.suffix.length
  );

  for (const suffixInfo of sortedSuffixes) {
    if (wordLower.endsWith(suffixInfo.suffix)) {
      const stem = wordLower.slice(0, -suffixInfo.suffix.length);
      if (stem.length < 2) continue;

      const derivedVerb = stem + suffixInfo.verbEnding;
      const stemOnly = stem;

      for (const entry of Object.values(LEXICON.verbs)) {
        const verbForms = mode === "es" ? entry.es : entry.en;
        for (const form of verbForms) {
          const infinitiveLower = form.infinitive.toLowerCase();
          if (
            infinitiveLower === derivedVerb ||
            infinitiveLower === stemOnly ||
            infinitiveLower === stemOnly + "e"
          ) {
            const baseGup = entry.forms[3];
            const agentGup = baseGup + "mirri";
            return {
              originalWord: word,
              derivedVerb: form.infinitive,
              verbGup: baseGup,
              agentGup,
              explanation: `${word} → ${form.infinitive} → ${baseGup} + -mirri = ${agentGup} (${agentNounLabel})`,
            };
          }
        }
      }

      const fallbackGup = derivedVerb + "mirri";
      return {
        originalWord: word,
        derivedVerb,
        verbGup: derivedVerb,
        agentGup: fallbackGup,
        explanation: `${word} → ${derivedVerb} → ${fallbackGup} (${agentNounLabel})`,
      };
    }
  }

  return null;
}
