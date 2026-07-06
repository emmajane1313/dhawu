import { LanguageMode } from "@/app/components/types/components.type";
import { Token, VerbMatch } from "./tokenizer";
import { LEXICON } from "./lexicon";
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
  determineDjalSuffix,
  applyDjalSuffix,
  DjalVerbMatch,
  PurposeInfinitiveMatch,
  InfinitiveAgentMatch,
  InfinitiveAgentType,
  LocativeVerbMatch,
  LOCATIVE_SUFFIX,
  ALLATIVE_SUFFIX,
  ABLATIVE_SUFFIX,
  applyLocativeSuffix,
  applyAllativeSuffix,
  applyAblativeSuffix,
  normalizeToken,
} from "./constants";
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

export interface PointingMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  pointType: "here" | "there";
}

export interface LocativeMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  nounIndices: number[];
  verbIndices?: number[];
  reinforcer: LocativeReinforcerInfo | null;
  explanation: string;
  suffixType: "ngura" | "lili" | "nguru" | "ergative" | "belonging" | "perlative";
  alternativeSuffixTypes?: Array<{
    suffixType: "ngura" | "lili" | "nguru" | "ergative" | "belonging" | "perlative";
    explanation: string;
  }>;
}

export interface CausativeAgentMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  agentIndex: number;
  agentWord: string;
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

export interface BecomeAdjectiveMatch {
  verbIndex: number;
  adjectiveIndex: number;
  verbWord: string;
  adjectiveWord: string;
  adjectiveGup: string;
  explanation: string;
}

export interface MakeAdjectiveMatch {
  verbIndex: number;
  adjectiveIndex: number;
  verbWord: string;
  adjectiveWord: string;
  adjectiveGup: string;
  explanation: string;
}

export interface LetUsMatch {
  verbIndex: number;
  verbWord: string;
  explanation: string;
  isStandalone?: boolean;
}

export interface NgarraMatch {
  verbIndex: number;
  verbWord: string;
  phraseIndices: number[];
  explanation: string;
}

export interface MindIfMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  verbIndex: number;
  isFirstPerson: boolean;
  explanation: string;
}

export interface HabitualMatch {
  triggerPhrase: string;
  triggerIndices: number[];
}

export interface PastHabitualAuxMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  verbIndex: number;
  verbWord: string;
}

export interface MightMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  verbIndex: number;
  verbWord: string;
  isPast: boolean;
  personNumbers?: PersonNumber[] | null;
}

export interface ShouldMatch {
  triggerPhrase: string;
  triggerIndices: number[];
  verbIndex: number;
  verbWord: string;
  isPast: boolean;
  personNumbers?: PersonNumber[] | null;
}

export interface ThatTimeMatch {
  triggerPhrase: string;
  triggerIndices: number[];
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
export type HumanPerlativePronounMatch = PronounMatch;
export type SourceOriginPronounMatch = PronounMatch;
export type CausePronounMatch = PronounMatch;
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
  | "humanPerlative"
  | "sourceOrigin"
  | "cause"
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
  pointingMatch: PointingMatch | null;
  locativeMatch: LocativeMatch | null;
  causativeAgentMatch: CausativeAgentMatch | null;
  conWithMatch: ConWithMatch | null;
  instrumentalMatch: InstrumentalMatch | null;
  belongingMatch: BelongingMatch | null;
  transportMatch: TransportMatch | null;
  comitativePronounMatch: ComitativePronounMatch | null;
  humanAllativePronounMatch: HumanAllativePronounMatch | null;
  humanAblativePronounMatch: HumanAblativePronounMatch | null;
  humanPerlativePronounMatch: HumanPerlativePronounMatch | null;
  sourceOriginPronounMatch: SourceOriginPronounMatch | null;
  causePronounMatch: CausePronounMatch | null;
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

        const match = {
          patternName: pattern.name,
          skipIndices,
          mainVerbIndex: result.mainVerbIdx,
          tense: pattern.result.tense,
          isContinuous: pattern.result.isContinuous,
          auxiliaryPerson,
        };
        return match;
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
    aboutToTriggers,
  } = config;
  const questionWords = Object.keys(questionWordMap);

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i].original.toLowerCase();

    if (copulaVerbs.includes(word)) {
  
      if (
        aboutToTriggers.some((trigger) => {
          const triggerWords = trigger.toLowerCase().split(" ");
          if (i + triggerWords.length > tokens.length) return false;
          for (let j = 0; j < triggerWords.length; j++) {
            const tokenWord = normalizeAccents(
              tokens[i + j]?.original.toLowerCase() || ""
            );
            if (tokenWord !== normalizeAccents(triggerWords[j])) {
              return false;
            }
          }
          return true;
        })
      ) {
      
        continue;
      }
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

      for (let k = i - 1; k >= 0; k--) {
        const beforeWord = tokens[k].original.toLowerCase();
        if (thisWords.includes(beforeWord)) {
          subjectType = "this";
          subjectIndex = k;
          break;
        } else if (thatWords.includes(beforeWord)) {
          subjectType = "that";
          subjectIndex = k;
          break;
        }
        const allowedTypes = ["noun", "adjective", "unknown"];
        if (!allowedTypes.includes(tokens[k].type)) {
          break;
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
  mode: LanguageMode,
  blockedDeIndices: Set<number> = new Set()
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
        if (blockedDeIndices.has(i)) continue;
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
  mode: LanguageMode,
  blockedDeIndices: Set<number> = new Set()
): PossessivePronounMatch | null {
  const { possessiveTriggers, possessiveOfDeTriggers } = LANG_CONFIG[mode];
  const ownTriggers = new Set(
    (LANG_CONFIG[mode].possessiveOwnTriggers || []).map((t) =>
      normalizeAccents(t.toLowerCase())
    )
  );

  for (let i = 0; i < tokens.length - 1; i++) {
    const word = tokens[i].original.toLowerCase();
    const personNumber = possessiveTriggers[word];

    if (personNumber) {
      const nextToken = tokens[i + 1];
      const nextNorm = normalizeAccents(nextToken.original.toLowerCase());
      const isOwnTrigger = ownTriggers.has(nextNorm);
      const isNextNounLike =
        nextToken.type === "noun" ||
        nextToken.type === "unknown" ||
        nextToken.type === "adjective";

      if (isNextNounLike) {
        let possessedIndex = i + 1;
        let possessedWord = nextToken.original;
        if (nextToken.type === "adjective" || isOwnTrigger) {
          const afterAdj = tokens[i + 2];
          if (afterAdj && (afterAdj.type === "noun" || afterAdj.type === "unknown")) {
            possessedIndex = i + 2;
            possessedWord = afterAdj.original;
          }
        }
        return {
          pronounIndex: i,
          pronounWord: tokens[i].original,
          possessedIndex,
          possessedWord,
          personNumber,
        };
      }
    }
  }

  for (let i = 1; i < tokens.length - 1; i++) {
    const word = tokens[i].original.toLowerCase();
    if (word === "de" || word === "del" || word === "of") {
      if (blockedDeIndices.has(i)) continue;
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
  const isQuestion = text.includes("?") || text.startsWith("¿");
  if (!isQuestion) {
    const howWords = LANG_CONFIG[mode].howWords || [];
    const normalizedHow = new Set(
      howWords.map((w) => normalizeAccents(w.toLowerCase()))
    );
    const hasAmbiguousHowVerb = tokens.some(
      (t) =>
        t.type === "verb" &&
        !!t.verbMatch &&
        normalizedHow.has(normalizeAccents(t.original.toLowerCase()))
    );
    if (hasAmbiguousHowVerb) {
      return null;
    }
  }

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
    const token = tokens[i];
    const word = token.original.toLowerCase();
    const questionType = questionWordMap[word];

    if (questionType) {
      if (!isQuestion && token.type === "verb" && token.verbMatch) {
        continue;
      }
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
  let copulaMatch = detectCopulaPattern(tokens, mode);
  const locativeMatch = detectLocativePattern(tokens, mode);
  const causativeAgentMatch = detectCausativeAgentPattern(
    tokens,
    mode,
    locativeMatch
  );
  
  const blockedCauseDeIndices = new Set<number>();
  if (locativeMatch) {
    const causeTriggers = LANG_CONFIG[mode].causeTriggers || [];
    const triggerLower = normalizeText(locativeMatch.triggerPhrase);
    const isCauseTrigger = causeTriggers.some(
      (t) => normalizeText(t) === triggerLower
    );
    const perlativeTriggers = LANG_CONFIG[mode].perlativeVerbTriggers || [];
    const isPerlativeTrigger = perlativeTriggers.some(
      (t) => normalizeText(t) === triggerLower
    );
    if (
      isCauseTrigger &&
      copulaMatch &&
      locativeMatch.triggerIndices.length > 0
    ) {
      const lastTriggerIdx = Math.max(...locativeMatch.triggerIndices);
      if (copulaMatch.copulaIndex > lastTriggerIdx) {
        copulaMatch = null;
      }
    }
    if (isCauseTrigger) {
      for (const idx of locativeMatch.triggerIndices) {
        const lower = tokens[idx]?.original.toLowerCase();
        if (lower === "de" || lower === "del" || lower === "of") {
          blockedCauseDeIndices.add(idx);
        }
      }
    }
    if (isPerlativeTrigger) {
      for (const idx of locativeMatch.triggerIndices) {
        const lower = tokens[idx]?.original.toLowerCase();
        if (lower === "de" || lower === "del" || lower === "of") {
          blockedCauseDeIndices.add(idx);
        }
      }
    }
  }
  if (causativeAgentMatch) {
    for (const idx of causativeAgentMatch.triggerIndices) {
      const lower = tokens[idx]?.original.toLowerCase();
      if (lower === "de" || lower === "del" || lower === "of") {
        blockedCauseDeIndices.add(idx);
      }
    }
  }
  const possessionMatch = detectPossessionPattern(
    tokens,
    mode,
    blockedCauseDeIndices
  );

  const possessivePronounMatch = detectPossessivePronounPattern(
    tokens,
    mode,
    blockedCauseDeIndices
  );
  const mirriMiriwMatch = detectMirriMiriwPattern(tokens, mode);
  const pointingMatch = detectPointingPattern(tokens, mode);
  const humanAllativePronounMatch = detectHumanAllativePronounPattern(
    tokens,
    mode
  );
  const humanPerlativePronounMatch = humanAllativePronounMatch
    ? null
    : detectHumanPerlativePronounPattern(tokens, mode);
  const humanAblativePronounMatch =
    humanAllativePronounMatch || humanPerlativePronounMatch
      ? null
      : detectHumanAblativePronounPattern(tokens, mode);
  const sourceOriginPronounMatch =
    humanAllativePronounMatch ||
    humanPerlativePronounMatch ||
    humanAblativePronounMatch
      ? null
      : detectSourceOriginPronounPattern(tokens, mode);
  const causePronounMatch =
    humanAllativePronounMatch ||
    humanPerlativePronounMatch ||
    humanAblativePronounMatch ||
    sourceOriginPronounMatch
      ? null
      : detectCausePronounPattern(tokens, mode);
  const purposePronounMatch =
    humanAllativePronounMatch ||
    humanPerlativePronounMatch ||
    humanAblativePronounMatch ||
    sourceOriginPronounMatch ||
    causePronounMatch
      ? null
      : detectPurposePronounPattern(tokens, mode);
  const comitativePronounMatch =
    humanAllativePronounMatch ||
    humanPerlativePronounMatch ||
    humanAblativePronounMatch ||
    sourceOriginPronounMatch ||
    causePronounMatch ||
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

  const ctx = {
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
    pointingMatch,
    locativeMatch,
    causativeAgentMatch,
    conWithMatch,
    instrumentalMatch,
    belongingMatch,
    transportMatch,
    comitativePronounMatch,
    humanAllativePronounMatch,
    humanAblativePronounMatch,
    humanPerlativePronounMatch,
    sourceOriginPronounMatch,
    causePronounMatch,
    purposePronounMatch,
    locativeCopulaMatch,
    indirectObjectMatch,
  };
  return ctx;
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
  const {
    locativeTriggers,
    locativeVerbTriggers,
    allativeVerbTriggers,
    ablativeVerbTriggers,
    perlativeVerbTriggers,
    perlativeTimeTriggers,
    instrumentalVerbTriggers,
    belongingVerbTriggers,
    aboutToTriggers,
  } = config;
  const normalizedTokens = tokens.map((t) => normalizeText(t.original));
  const causeTriggerSet = new Set(
    (config.causeTriggers || []).map((t) => normalizeText(t))
  );
  const causativeAgentTriggers = (config.causativeAgentTriggers || [])
    .map((phrase) => ({
      phrase,
      words: phrase.split(" ").map(normalizeText),
    }))
    .sort((a, b) => b.words.length - a.words.length);
  const auxiliarySet = new Set<string>(
    config.copulaVerbs.map((w) => normalizeText(w))
  );
  if (mode === "es") {
    for (const w of [...HABER_AUXILIARY_FORMS_ES, "haber", "sido"]) {
      auxiliarySet.add(normalizeText(w));
    }
  } else {
    for (const w of ["have", "has", "had", "having"]) {
      auxiliarySet.add(normalizeText(w));
    }
  }

  const blockedIndices = new Set<number>();
  for (const trigger of aboutToTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (result.found) {
      for (const idx of result.indices) blockedIndices.add(idx);
    }
  }

  const triggerGroups: Array<{
    triggers: string[];
    suffixType: "ngura" | "lili" | "nguru" | "ergative" | "belonging" | "perlative";
    explanation: string;
  }> = [
    {
      triggers: locativeVerbTriggers,
      suffixType: "ngura",
      explanation: config.locativeExplanation,
    },
    {
      triggers: allativeVerbTriggers,
      suffixType: "lili",
      explanation: config.allativeSuffixLabel || "allative",
    },
    {
      triggers: ablativeVerbTriggers,
      suffixType: "nguru",
      explanation: config.ablativeSuffixLabel || "ablative",
    },
    {
      triggers: perlativeVerbTriggers,
      suffixType: "perlative",
      explanation: config.perlativeLabel || "through/along",
    },
    {
      triggers: instrumentalVerbTriggers,
      suffixType: "ergative",
      explanation: "instrumental suffix (-y/-yu/-dhu/-thu)",
    },
    {
      triggers: belongingVerbTriggers,
      suffixType: "belonging",
      explanation: "belonging/associative suffix (-wuy/-puy/-buy)",
    },
  ];

  let firstMatch: LocativeMatch | null = null;
  const allMatches: Array<{
    trigger: string;
    group: typeof triggerGroups[0];
    result: any;
    nounIndices: number[];
    verbIndices: number[];
    isCauseTrigger: boolean;
    wordCount: number;
    startIndex: number;
    groupOrder: number;
  }> = [];

  for (const [groupOrder, group] of triggerGroups.entries()) {
    const sortedVerbTriggers = [...group.triggers].sort(
      (a, b) => b.split(" ").length - a.split(" ").length
    );

    const perlativeTimeSet = new Set(
      (perlativeTimeTriggers || []).map((t) => normalizeText(t))
    );
    for (const trigger of sortedVerbTriggers) {
      const result = hasPhrase(tokens, trigger);
      if (result.found) {
        if (result.indices.some((idx) => blockedIndices.has(idx))) {
          continue;
        }
        const isCauseTrigger = causeTriggerSet.has(normalizeText(trigger));
        const lastTriggerIdx = Math.max(...result.indices);
        const nounIndices: number[] = [];
        const verbIndices: number[] = [];

        const isPerlative = group.suffixType === "perlative";
        const isPerlativeTimeTrigger =
          isPerlative && perlativeTimeSet.has(normalizeText(trigger));
        for (let i = lastTriggerIdx + 1; i < tokens.length; i++) {
          const t = tokens[i];
          const normalized = normalizedTokens[i];

          if (isCauseTrigger && causativeAgentTriggers.length > 0) {
            let matchedAgentTrigger = false;
            for (const agentTrigger of causativeAgentTriggers) {
              if (i + agentTrigger.words.length > normalizedTokens.length) {
                continue;
              }
              let matches = true;
              for (let j = 0; j < agentTrigger.words.length; j++) {
                if (normalizedTokens[i + j] !== agentTrigger.words[j]) {
                  matches = false;
                  break;
                }
              }
              if (matches) {
                i += agentTrigger.words.length - 1;
                matchedAgentTrigger = true;
                break;
              }
            }
            if (matchedAgentTrigger) {
              continue;
            }
          }

          if (isCauseTrigger && auxiliarySet.has(normalized)) {
            continue;
          }

          if (
            ["el", "la", "los", "las", "lo", "the", "a", "an", "de", "del", "al", "of"].includes(
              normalized
            )
          ) {
            continue;
          }

          if (
            t.type === "noun" ||
            t.type === "unknown" ||
            t.type === "adjective" ||
            t.type === "pronoun"
          ) {
            if (isPerlativeTimeTrigger && t.type === "pronoun") {
              continue;
            }
            nounIndices.push(i);
          } else if (t.type === "verb") {
            if (isPerlative) {
              if (isPerlativeTimeTrigger) {
                if (t.verbMatch) {
                  verbIndices.push(i);
                  break;
                }
                nounIndices.push(i);
                break;
              }
              const prevNorm = normalizedTokens[i - 1] || "";
              if (
                ["el", "la", "los", "las", "lo", "the", "a", "an", "de", "del", "al", "of"].includes(
                  prevNorm
                )
              ) {
                nounIndices.push(i);
                continue;
              }
              break;
            }
            if (isCauseTrigger && !t.verbMatch) {
              continue;
            }
            if (isCauseTrigger && t.verbMatch) {
              verbIndices.push(i);
              continue;
            }
            if (t.verbMatch?.tense === "infinitive" || t.verbMatch?.tense === "gerund") {
              verbIndices.push(i);
              continue;
            }
            break;
          } else if (t.type === "connector") {
            if (isOtherPatternTrigger(tokens, i + 1, mode, group.triggers)) {
              break;
            }
            continue;
          }
        }


        if (verbIndices.length > 0 || nounIndices.length > 0) {
          allMatches.push({
            trigger,
            group,
            result,
            nounIndices,
            verbIndices,
            isCauseTrigger,
            wordCount: trigger.split(" ").length,
            startIndex: result.indices[0] ?? 0,
            groupOrder,
          });
        }
      }
    }
  }

  if (allMatches.length > 0) {
    const hasCauseMatch = allMatches.some((m) => m.isCauseTrigger);
    const matchesToSort = hasCauseMatch
      ? allMatches.filter((m) => m.isCauseTrigger)
      : allMatches;
    matchesToSort.sort((a, b) => {
      if (b.wordCount !== a.wordCount) return b.wordCount - a.wordCount;
      if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
      return a.groupOrder - b.groupOrder;
    });
    const first = matchesToSort[0];
    const reinforcer = getReinforcerForTrigger(first.trigger);

    firstMatch = {
      triggerPhrase: first.trigger,
      triggerIndices: first.result.indices,
      nounIndices: first.nounIndices,
      verbIndices: first.verbIndices,
      reinforcer,
      explanation: `"${first.trigger}" → ${first.group.explanation}`,
      suffixType: first.group.suffixType,
    };

    if (allMatches.length > 1) {
      const alternatives = allMatches.slice(1).map(m => ({
        suffixType: m.group.suffixType,
        explanation: `"${m.trigger}" → ${m.group.explanation}`,
      }));
      firstMatch.alternativeSuffixTypes = alternatives;
    }

    return firstMatch;
  }

  const sortedTriggers = [...locativeTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (result.found) {
      if (result.indices.some((idx) => blockedIndices.has(idx))) {
        continue;
      }
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
          suffixType: "ngura",
        };
      }
    }
  }

  return null;
}

function isPastParticipleToken(token: Token): boolean {
  if (token.type === "verb" && token.verbMatch?.tense === "pastParticiple") {
    return true;
  }
  if (token.type === "adjective") {
    return isPastParticipleES(token.original);
  }
  return false;
}

function findPassiveParticipleIndex(
  tokens: Token[],
  startIdx: number,
  mode: LanguageMode
): number | null {
  const config = LANG_CONFIG[mode];
  const copulaSet = new Set(
    config.copulaVerbs.map((w) => normalizeText(w))
  );
  const haberSet =
    mode === "es"
      ? new Set([...HABER_AUXILIARY_FORMS_ES, "haber"].map((w) => normalizeText(w)))
      : null;

  for (let i = startIdx; i < tokens.length; i++) {
    const wordNorm = normalizeText(tokens[i].original);

    if (mode === "es" && haberSet && haberSet.has(wordNorm)) {
      const next = tokens[i + 1];
      if (next && normalizeText(next.original) === "sido") {
        for (let j = i + 2; j < tokens.length; j++) {
          if (isPastParticipleToken(tokens[j])) return j;
          if (tokens[j].type === "connector") break;
        }
      }
    }

    if (copulaSet.has(wordNorm)) {
      for (let j = i + 1; j < tokens.length; j++) {
        if (isPastParticipleToken(tokens[j])) return j;
        if (tokens[j].type === "connector") break;
      }
    }

    if (mode === "en" && wordNorm === "being") {
      for (let j = i + 1; j < tokens.length; j++) {
        if (isPastParticipleToken(tokens[j])) return j;
        if (tokens[j].type === "connector") break;
      }
    }
    if (mode === "en" && wordNorm === "having") {
      const next = tokens[i + 1];
      if (next && normalizeText(next.original) === "been") {
        for (let j = i + 2; j < tokens.length; j++) {
          if (isPastParticipleToken(tokens[j])) return j;
          if (tokens[j].type === "connector") break;
        }
      }
    }
  }

  return null;
}

export function detectCausativeAgentPattern(
  tokens: Token[],
  mode: LanguageMode,
  locativeMatch: LocativeMatch | null
): CausativeAgentMatch | null {
  if (!locativeMatch) return null;
  const config = LANG_CONFIG[mode];
  const triggerNorm = normalizeText(locativeMatch.triggerPhrase);
  const isCauseTrigger = config.causeTriggers.some(
    (t) => normalizeText(t) === triggerNorm
  );
  if (!isCauseTrigger) return null;

  const startIdx = Math.max(...locativeMatch.triggerIndices) + 1;
  const participleIdx = findPassiveParticipleIndex(tokens, startIdx, mode);
  if (participleIdx === null) return null;

  const agentTriggers = config.causativeAgentTriggers || [];
  if (agentTriggers.length === 0) return null;

  const normalizedTokens = tokens.map((t) => normalizeText(t.original));
  const sortedTriggers = agentTriggers
    .map((phrase) => ({
      phrase,
      words: phrase.split(" ").map(normalizeText),
    }))
    .sort((a, b) => b.words.length - a.words.length);

  for (let i = participleIdx + 1; i < tokens.length; i++) {
    for (const trigger of sortedTriggers) {
      if (i + trigger.words.length > normalizedTokens.length) continue;
      let matches = true;
      for (let j = 0; j < trigger.words.length; j++) {
        if (normalizedTokens[i + j] !== trigger.words[j]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;

      const triggerIndices: number[] = [];
      for (let j = 0; j < trigger.words.length; j++) {
        triggerIndices.push(i + j);
      }

      for (let k = i + trigger.words.length; k < tokens.length; k++) {
        const t = tokens[k];
        const norm = normalizedTokens[k];
        if (
          [
            "el",
            "la",
            "los",
            "las",
            "the",
            "a",
            "an",
            "de",
            "del",
            "al",
            "of",
          ].includes(norm)
        ) {
          continue;
        }
        if (t.type === "connector") continue;
        if (t.type === "pronoun") continue;
        if (t.type === "noun" && t.nounMatch?.isHuman === true) {
          return {
            triggerPhrase: trigger.phrase,
            triggerIndices,
            agentIndex: k,
            agentWord: t.original,
            explanation: `"${trigger.phrase}" → ${config.causativeAgentLabel}`,
          };
        }
        if (t.type === "unknown") continue;
        break;
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
          if (t.verbMatch?.tense === "infinitive" || t.verbMatch?.tense === "gerund") {
            break;
          }
          nounIndices.push(i);
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
          if (t.verbMatch?.tense === "infinitive" || t.verbMatch?.tense === "gerund") {
            break;
          }
          nounIndices.push(i);
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

      const isNextVerbAsNoun =
        nextToken.type === "verb" &&
        nextToken.verbMatch?.tense !== "infinitive" &&
        nextToken.verbMatch?.tense !== "gerund";

      if (!isNextNounLike && !isNextVerbAsNoun) continue;

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

export function detectBecomeAdjectivePattern(
  tokens: Token[],
  mode: LanguageMode
): BecomeAdjectiveMatch | null {
  const reflexivePronouns = ["me", "te", "se", "nos", "os"];

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];

    if (
      token.type === "verb" &&
      token.verbMatch?.isBecomeVerb &&
      nextToken.type === "adjective" &&
      nextToken.gupKey
    ) {
      return {
        verbIndex: i,
        adjectiveIndex: i + 1,
        verbWord: token.original,
        adjectiveWord: nextToken.original,
        adjectiveGup: nextToken.gupKey,
        explanation: `"${token.original} ${nextToken.original}" → become + adjective`,
      };
    }

    if (i < tokens.length - 2) {
      const thirdToken = tokens[i + 2];
      const pronounWord = token.original.toLowerCase();
      const verbWord = nextToken.original.toLowerCase();
      const combinedVerb = `${pronounWord} ${verbWord}`;

      if (
        reflexivePronouns.includes(pronounWord) &&
        thirdToken.type === "adjective" &&
        thirdToken.gupKey
      ) {
        const becomeVerbEntry = LEXICON.verbs["ŋama-dhirri"];
        if (becomeVerbEntry && becomeVerbEntry.isBecomeVerb) {
          let foundMatch = false;
          for (const forms of becomeVerbEntry[mode]) {
            const allConjugations = [
              ...forms.presentIndicative,
              ...forms.preterite,
              ...forms.imperfect,
              ...forms.future,
              ...forms.conditional,
              ...forms.presentSubjunctive,
            ];
            if (allConjugations.some(conj => conj.toLowerCase() === combinedVerb)) {
              foundMatch = true;
              break;
            }
          }

          if (foundMatch) {
            return {
              verbIndex: i,
              adjectiveIndex: i + 2,
              verbWord: combinedVerb,
              adjectiveWord: thirdToken.original,
              adjectiveGup: thirdToken.gupKey,
              explanation: `"${combinedVerb} ${thirdToken.original}" → become + adjective`,
            };
          }
        }
      }
    }
  }

  return null;
}

export function detectMakeAdjectivePattern(
  tokens: Token[],
  mode: LanguageMode
): MakeAdjectiveMatch | null {
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];

    if (
      token.type === "verb" &&
      nextToken.type === "adjective" &&
      nextToken.gupKey
    ) {
      let hasMakeVerb = token.verbMatch?.isMakeVerb || false;

      if (!hasMakeVerb && token.verbMatch) {
        const verbWord = token.original.toLowerCase();
        for (const entry of Object.values(LEXICON.verbs)) {
          if (entry.isMakeVerb) {
            for (const forms of entry[mode]) {
              const allConjugations = [
                forms.infinitive,
                ...forms.presentIndicative,
                ...forms.preterite,
                ...forms.imperfect,
                ...forms.future,
                ...forms.conditional,
                ...forms.presentSubjunctive,
                forms.gerund,
                forms.pastParticiple,
              ];
              if (allConjugations.some(conj => conj.toLowerCase() === verbWord)) {
                hasMakeVerb = true;
                break;
              }
            }
            if (hasMakeVerb) break;
          }
        }
      }

      if (hasMakeVerb) {
        return {
          verbIndex: i,
          adjectiveIndex: i + 1,
          verbWord: token.original,
          adjectiveWord: nextToken.original,
          adjectiveGup: nextToken.gupKey,
          explanation: `"${token.original} ${nextToken.original}" → make + adjective`,
        };
      }
    }
  }

  return null;
}

export function detectLetUsPattern(
  tokens: Token[],
  mode: LanguageMode
): LetUsMatch | null {
  const config = LANG_CONFIG[mode];
  const { letsTriggers, letUsVerbWord, letUsPreposition } = config;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === "verb" && token.verbMatch) {
      const verbWord = token.original.toLowerCase();

      if (letsTriggers.length > 0 && i > 0) {
        const prevToken = tokens[i - 1];
        const prevWord = prevToken.original.toLowerCase();
        if (letsTriggers.includes(prevWord)) {
          return {
            verbIndex: i,
            verbWord: token.original,
            explanation: `"${prevWord} ${token.original}" → let us + verb`,
          };
        }
      }

      if (letUsVerbWord && token.verbMatch.tense === "presentSubjunctive" && token.verbMatch.person === 3) {
        return {
          verbIndex: i,
          verbWord: token.original,
          explanation: `"${token.original}" → subjuntivo 1ª plural (let's)`,
        };
      }

      if (letUsVerbWord && letUsPreposition && i > 1 && verbWord !== letUsVerbWord) {
        const prev1 = tokens[i - 1]?.original.toLowerCase();
        const prev2 = tokens[i - 2]?.original.toLowerCase();
        if (prev2 === letUsVerbWord && prev1 === letUsPreposition) {
          return {
            verbIndex: i,
            verbWord: token.original,
            explanation: `"${letUsVerbWord} ${letUsPreposition} ${token.original}" → let's + verb`,
          };
        }
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const word = token.original.toLowerCase();

    if (letUsVerbWord && word === letUsVerbWord && token.type === "verb") {
      const nextToken = tokens[i + 1];
      if (!nextToken || (nextToken.original.toLowerCase() !== letUsPreposition && nextToken.type !== "verb")) {
        return {
          verbIndex: i,
          verbWord: letUsVerbWord,
          explanation: `"${letUsVerbWord}" → let's (standalone)`,
          isStandalone: true,
        };
      }
    }

    if (letsTriggers.includes(word)) {
      const nextToken = tokens[i + 1];
      if (!nextToken || nextToken.type !== "verb") {
        return {
          verbIndex: i,
          verbWord: word,
          explanation: `"${word}" → let's (standalone)`,
          isStandalone: true,
        };
      }
    }
  }

  return null;
}

export function detectNgarraPattern(
  tokens: Token[],
  mode: LanguageMode
): NgarraMatch | null {
  const config = LANG_CONFIG[mode];
  const { ngarraAboutToTriggers, ngarraGoingToTriggers } = config;
  const allTriggers = [...ngarraAboutToTriggers, ...ngarraGoingToTriggers];
  if (allTriggers.length === 0) return null;

  const sortedTriggers = [...allTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (!result.found) continue;

    const lastTriggerIdx = Math.max(...result.indices);
    let verbIndex = -1;

    for (let i = lastTriggerIdx + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === "verb" && token.verbMatch) {
        verbIndex = i;
        break;
      }
    }

    if (verbIndex === -1) continue;

    const match = {
      verbIndex,
      verbWord: tokens[verbIndex].original,
      phraseIndices: result.indices,
      explanation: `"${trigger} ${tokens[verbIndex].original}" → ŋarra + verb (first person singular only)`,
    };
    return match;
  }

  return null;
}

export function detectMindIfPattern(
  tokens: Token[],
  mode: LanguageMode
): MindIfMatch | null {
  const config = LANG_CONFIG[mode];
  const { mindIfTriggers, pronounTriggers } = config;

  if (!mindIfTriggers || mindIfTriggers.length === 0) return null;

  const sortedTriggers = [...mindIfTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (!result.found) continue;

    const lastTriggerIdx = Math.max(...result.indices);
    let verbIndex = -1;

    for (let i = lastTriggerIdx + 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === "verb" && token.verbMatch) {
        verbIndex = i;
        break;
      }
    }

    if (verbIndex === -1) continue;

    let isFirstPerson = false;
    for (let i = lastTriggerIdx + 1; i < verbIndex; i++) {
      const word = tokens[i]?.original?.toLowerCase();
      if (!word) continue;
      if (pronounTriggers[word] === "1_Sing") {
        isFirstPerson = true;
        break;
      }
    }

    if (!isFirstPerson && mode === "es") {
      const verbPerson = tokens[verbIndex]?.verbMatch?.person;
      if (verbPerson === 0) {
        isFirstPerson = true;
      }
    }

    return {
      triggerPhrase: trigger,
      triggerIndices: result.indices,
      verbIndex,
      isFirstPerson,
      explanation: `"${trigger}" → do you mind if`,
    };
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
          if (t.verbMatch?.tense === "infinitive" || t.verbMatch?.tense === "gerund") {
            break;
          }
          nounIndices.push(j);
          const nounLower = t.original.toLowerCase();
          if (vehicles.includes(nounLower)) {
            isKnownVehicle = true;
          }
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
  humanPerlative: {
    triggersKey: "humanPerlativePronounTriggers",
    gupKey: "humanPerlativePronounsGup",
    label: "human perlative pronoun",
  },
  sourceOrigin: {
    triggersKey: "sourceOriginPronounTriggers",
    gupKey: "sourceOriginPronounsGup",
    label: "source/origin pronoun",
  },
  cause: {
    triggersKey: "causePronounTriggers",
    gupKey: "causePronounsGup",
    label: "cause pronoun",
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


export function detectPointingPattern(
  tokens: Token[],
  mode: LanguageMode
): PointingMatch | null {
  const config = LANG_CONFIG[mode];
  const { pointingHereTriggers, pointingThereTriggers } = config;

  const triggers = [
    ...pointingHereTriggers.map((phrase) => ({
      phrase,
      pointType: "here" as const,
      words: phrase.split(" ").map(normalizeText),
    })),
    ...pointingThereTriggers.map((phrase) => ({
      phrase,
      pointType: "there" as const,
      words: phrase.split(" ").map(normalizeText),
    })),
  ].sort((a, b) => b.words.length - a.words.length);

  if (triggers.length === 0) return null;

  const normalizedTokens = tokens.map((t) => normalizeText(t.original));

  for (let i = 0; i < normalizedTokens.length; i++) {
    for (const trigger of triggers) {
      if (i + trigger.words.length > normalizedTokens.length) continue;
      let matches = true;
      for (let j = 0; j < trigger.words.length; j++) {
        if (normalizedTokens[i + j] !== trigger.words[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        const triggerIndices: number[] = [];
        for (let j = 0; j < trigger.words.length; j++) {
          triggerIndices.push(i + j);
        }
        return {
          triggerPhrase: trigger.phrase,
          triggerIndices,
          pointType: trigger.pointType,
        };
      }
    }
  }

  return null;
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
          const nextTokenIdx = i + triggerWords.length;
          const nextToken = tokens[nextTokenIdx];

          const lastMatchedTokenIdx = i + triggerWords.length - 1;
          const lastMatchedToken = tokens[lastMatchedTokenIdx];
          const lastMatchedTokenLower = lastMatchedToken.original.toLowerCase();

          if (lastMatchedTokenLower === "el" && nextToken) {
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

export function detectHumanPerlativePronounPattern(
  tokens: Token[],
  mode: LanguageMode
): HumanPerlativePronounMatch | null {
  return detectPronounPattern(tokens, mode, "humanPerlative");
}

export function detectSourceOriginPronounPattern(
  tokens: Token[],
  mode: LanguageMode
): SourceOriginPronounMatch | null {
  return detectPronounPattern(tokens, mode, "sourceOrigin");
}

export function detectCausePronounPattern(
  tokens: Token[],
  mode: LanguageMode
): CausePronounMatch | null {
  const match = detectPronounPattern(tokens, mode, "cause");
  if (!match) return null;
  const lastIdx = Math.max(...match.triggerIndices);
  let nextIdx = lastIdx + 1;
  while (nextIdx < tokens.length && tokens[nextIdx].type === "connector") {
    nextIdx += 1;
  }
  const nextToken = tokens[nextIdx];
  if (
    nextToken &&
    (nextToken.type === "noun" ||
      nextToken.type === "adjective" ||
      nextToken.type === "unknown" ||
      nextToken.type === "pronoun")
  ) {
    return null;
  }
  return match;
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
  if (
    locativeMatch?.suffixType === "ergative" ||
    locativeMatch?.suffixType === "perlative"
  ) {
    return null;
  }

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

  // Allow preposition + pronoun indirect objects even if verb isn't marked ditransitive.
  const possessiveDeterminers = new Set([
    "mi",
    "mis",
    "tu",
    "tus",
    "su",
    "sus",
    "nuestro",
    "nuestra",
    "nuestros",
    "nuestras",
    "vuestro",
    "vuestra",
    "vuestros",
    "vuestras",
  ]);
  for (let i = 0; i < tokens.length - 1; i++) {
    const word = tokens[i].original.toLowerCase();
    if (!indirectObjectPrepositions.includes(word)) continue;
    const nextToken = tokens[i + 1];
    const nextWordLower = nextToken.original.toLowerCase();
    const objTypes = config.objectPronounTriggers?.[nextWordLower];
    const isPronounLike =
      nextToken.type === "pronoun" ||
      (objTypes && objTypes.length > 0 && nextToken.type !== "verb");
    if (!isPronounLike) continue;

    // Skip possessive determiners when they introduce a noun ("a mi casa").
    if (
      objTypes &&
      nextToken.type !== "pronoun" &&
      possessiveDeterminers.has(nextWordLower)
    ) {
      const afterNext = tokens[i + 2];
      if (afterNext && (afterNext.type === "noun" || afterNext.type === "unknown")) {
        continue;
      }
    }

    let personNumber: PersonNumber | null =
      config.pronounTriggers[nextWordLower] || null;

    if (!personNumber && objTypes && objTypes.length > 0) {
      personNumber = objTypes[0] as PersonNumber;
    }

    if (personNumber) {
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

export function detectHabitualPattern(
  tokens: Token[],
  mode: LanguageMode
): HabitualMatch | null {
  const config = LANG_CONFIG[mode];
  const { habitualTriggers } = config;
  if (!habitualTriggers || habitualTriggers.length === 0) return null;

  const sortedTriggers = [...habitualTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (result.found) {
      return {
        triggerPhrase: trigger,
        triggerIndices: result.indices,
      };
    }
  }

  return null;
}

export function detectPastHabitualAuxPattern(
  tokens: Token[],
  mode: LanguageMode
): PastHabitualAuxMatch | null {
  const config = LANG_CONFIG[mode];
  const { habitualPastAuxTriggers } = config;
  if (!habitualPastAuxTriggers || habitualPastAuxTriggers.length === 0) return null;

  const sortedTriggers = [...habitualPastAuxTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (!result.found) continue;

    const startIndex =
      result.indices.length > 0 ? result.indices[result.indices.length - 1] + 1 : 0;
    let verbIndex = -1;
    for (let i = startIndex; i < tokens.length; i++) {
      if (tokens[i].type === "verb") {
        verbIndex = i;
        if (tokens[i].verbMatch?.tense === "infinitive") break;
      }
    }

    if (verbIndex !== -1) {
      return {
        triggerPhrase: trigger,
        triggerIndices: result.indices,
        verbIndex,
        verbWord: tokens[verbIndex].original,
      };
    }
  }

  return null;
}

export function detectMightPattern(
  tokens: Token[],
  mode: LanguageMode
): MightMatch | null {
  const config = LANG_CONFIG[mode];
  const { mightTriggers, mightPastTriggers } = config;
  if (!mightTriggers || !mightPastTriggers) return null;

  const poderPersonMap: Record<string, PersonNumber[]> = {
    "podría": ["1_Sing", "3_Sing"],
    "podria": ["1_Sing", "3_Sing"],
    "podrías": ["2_Sing"],
    "podrias": ["2_Sing"],
    "podríamos": ["1+2_Plur"],
    "podriamos": ["1+2_Plur"],
    "podríais": ["2_Plur"],
    "podriais": ["2_Plur"],
    "podrían": ["3_Plur"],
    "podrian": ["3_Plur"],
  };

  const findVerbAfter = (indices: number[]): number => {
    const startIndex =
      indices.length > 0 ? Math.max(...indices) + 1 : 0;
    for (let i = startIndex; i < tokens.length; i++) {
      if (tokens[i].type === "verb") {
        return i;
      }
    }
    return tokens.findIndex((t) => t.type === "verb");
  };

  const sortedPast = [...mightPastTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );
  for (const trigger of sortedPast) {
    const result = hasPhrase(tokens, trigger);
    if (!result.found) continue;
    const verbIndex = findVerbAfter(result.indices);
    if (verbIndex === -1) continue;
    const firstWord = trigger.split(" ")[0];
    const personNumbers =
      mode === "es" ? poderPersonMap[firstWord] || null : null;
    return {
      triggerPhrase: trigger,
      triggerIndices: result.indices,
      verbIndex,
      verbWord: tokens[verbIndex].original,
      isPast: true,
      personNumbers,
    };
  }

  const sortedPresent = [...mightTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );
  for (const trigger of sortedPresent) {
    const result = hasPhrase(tokens, trigger);
    if (!result.found) continue;
    const verbIndex = findVerbAfter(result.indices);
    if (verbIndex === -1) continue;
    let isPast = false;
    const firstWord = trigger.split(" ")[0];
    const personNumbers =
      mode === "es" ? poderPersonMap[firstWord] || null : null;
    if (
      mode === "es" &&
      (trigger === "podría ser que" || trigger === "podria ser que")
    ) {
      const tense = tokens[verbIndex].verbMatch?.tense;
      if (
        tense === "imperfectSubjunctive" ||
        tense === "imperfect" ||
        tense === "preterite" ||
        tense === "pastParticiple"
      ) {
        isPast = true;
      }
    }
    return {
      triggerPhrase: trigger,
      triggerIndices: result.indices,
      verbIndex,
      verbWord: tokens[verbIndex].original,
      isPast,
      personNumbers,
    };
  }

  return null;
}

export function detectShouldPattern(
  tokens: Token[],
  mode: LanguageMode
): ShouldMatch | null {
  const config = LANG_CONFIG[mode];
  const { shouldTriggers, shouldPastTriggers } = config;
  if (!shouldTriggers || !shouldPastTriggers) return null;

  const shouldPersonMapEs: Record<string, PersonNumber[]> = {
    "debería": ["1_Sing", "3_Sing"],
    "deberia": ["1_Sing", "3_Sing"],
    "deberías": ["2_Sing"],
    "deberias": ["2_Sing"],
    "deberíamos": ["1+2_Plur"],
    "deberiamos": ["1+2_Plur"],
    "deberíais": ["2_Plur"],
    "deberiais": ["2_Plur"],
    "deberían": ["3_Plur"],
    "deberian": ["3_Plur"],
    "tendría": ["1_Sing", "3_Sing"],
    "tendria": ["1_Sing", "3_Sing"],
    "tendrías": ["2_Sing"],
    "tendrias": ["2_Sing"],
    "tendríamos": ["1+2_Plur"],
    "tendriamos": ["1+2_Plur"],
    "tendríais": ["2_Plur"],
    "tendriais": ["2_Plur"],
    "tendrían": ["3_Plur"],
    "tendrian": ["3_Plur"],
    "habría": ["1_Sing", "3_Sing"],
    "habria": ["1_Sing", "3_Sing"],
    "habrías": ["2_Sing"],
    "habrias": ["2_Sing"],
    "habríamos": ["1+2_Plur"],
    "habriamos": ["1+2_Plur"],
    "habríais": ["2_Plur"],
    "habriais": ["2_Plur"],
    "habrían": ["3_Plur"],
    "habrian": ["3_Plur"],
  };

  const findVerbAfter = (indices: number[]): number => {
    const startIndex =
      indices.length > 0 ? Math.max(...indices) + 1 : 0;
    for (let i = startIndex; i < tokens.length; i++) {
      if (tokens[i].type === "verb") {
        return i;
      }
    }
    return tokens.findIndex((t) => t.type === "verb");
  };

  const sortedPast = [...shouldPastTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );
  for (const trigger of sortedPast) {
    const result = hasPhrase(tokens, trigger);
    if (!result.found) continue;
    const verbIndex = findVerbAfter(result.indices);
    if (verbIndex === -1) continue;
    const firstWord = trigger.split(" ")[0];
    const personNumbers =
      mode === "es" ? shouldPersonMapEs[firstWord] || null : null;
    return {
      triggerPhrase: trigger,
      triggerIndices: result.indices,
      verbIndex,
      verbWord: tokens[verbIndex].original,
      isPast: true,
      personNumbers,
    };
  }

  const sortedPresent = [...shouldTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );
  for (const trigger of sortedPresent) {
    const result = hasPhrase(tokens, trigger);
    if (!result.found) continue;
    const verbIndex = findVerbAfter(result.indices);
    if (verbIndex === -1) continue;
    const firstWord = trigger.split(" ")[0];
    const personNumbers =
      mode === "es" ? shouldPersonMapEs[firstWord] || null : null;
    return {
      triggerPhrase: trigger,
      triggerIndices: result.indices,
      verbIndex,
      verbWord: tokens[verbIndex].original,
      isPast: false,
      personNumbers,
    };
  }

  return null;
}

export function detectThatTimePattern(
  tokens: Token[],
  mode: LanguageMode
): ThatTimeMatch | null {
  const config = LANG_CONFIG[mode];
  const { thatTimeTriggers } = config;
  if (!thatTimeTriggers || thatTimeTriggers.length === 0) return null;

  const sortedTriggers = [...thatTimeTriggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const trigger of sortedTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (result.found) {
      return {
        triggerPhrase: trigger,
        triggerIndices: result.indices,
      };
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
  const { agentNounLabel } = config;
  const normalized = normalizeToken(word);

  for (const [verbKey, entry] of Object.entries(LEXICON.verbs)) {
    const list = entry.agentNouns?.[mode] || [];
    for (const form of list) {
      if (normalizeToken(form) === normalized) {
        const baseGup = entry.forms[3] || entry.forms[2] || entry.forms[0] || verbKey;
        const agentGup = baseGup + "mirri";
        const derivedVerb = entry[mode]?.[0]?.infinitive || verbKey;
        return {
          originalWord: word,
          derivedVerb,
          verbGup: baseGup,
          agentGup,
          explanation: `${word} → ${derivedVerb} → ${baseGup} + -mirri = ${agentGup} (${agentNounLabel})`,
        };
      }
    }
  }

  return null;
}

export interface RelativeClauseMatch {
  nounIndex: number;
  nounWord: string;
  nounGup: string;
  triggerIndex: number;
  triggerWord: string;
  verbIndex: number;
  verbWord: string;
  verbGup: string;
  agentGup: string;
  consumedIndices: number[];
  explanation: string;
  isParticiple: boolean;
}

export function detectRelativeClausePattern(
  tokens: Token[],
  mode: LanguageMode
): RelativeClauseMatch | null {
  const config = LANG_CONFIG[mode];
  const { relativeClauseTriggers, participleEnding, relativeClauseLabel } = config;

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    if (token.type !== "noun" || !token.nounMatch) continue;

    const nounGup = token.gupKey || token.nounMatch.gupKey;
    if (!nounGup) continue;

    if (i + 1 < tokens.length) {
      const nextToken = tokens[i + 1];
      const nextWordLower = nextToken.original.toLowerCase();

      if (nextWordLower.endsWith(participleEnding)) {
        const stem = nextWordLower.slice(0, -participleEnding.length);
        if (stem.length < 2) continue;

        let foundVerb: { gup: string; infinitive: string } | null = null;
        for (const entry of Object.values(LEXICON.verbs)) {
          const verbForms = entry[mode];
          for (const form of verbForms) {
            const infLower = form.infinitive.toLowerCase();
            if (infLower === stem || infLower === stem + "e" || infLower.startsWith(stem)) {
              foundVerb = { gup: entry.forms[3], infinitive: form.infinitive };
              break;
            }
          }
          if (foundVerb) break;
        }

        const verbGup = foundVerb ? foundVerb.gup : stem;
        const agentGup = verbGup + "mirri";

        return {
          nounIndex: i,
          nounWord: token.original,
          nounGup,
          triggerIndex: -1,
          triggerWord: "",
          verbIndex: i + 1,
          verbWord: nextToken.original,
          verbGup,
          agentGup,
          consumedIndices: [i, i + 1],
          explanation: `${nextToken.original} ${token.original} → ${agentGup} ${nounGup} (${relativeClauseLabel})`,
          isParticiple: true,
        };
      }
    }

    const sortedTriggers = [...relativeClauseTriggers].sort(
      (a, b) => b.split(" ").length - a.split(" ").length
    );

    for (const trigger of sortedTriggers) {
      const triggerWords = trigger.split(" ");
      const triggerLen = triggerWords.length;

      if (i + triggerLen + 1 >= tokens.length) continue;

      let triggerMatches = true;
      for (let t = 0; t < triggerLen; t++) {
        if (tokens[i + 1 + t].original.toLowerCase() !== triggerWords[t]) {
          triggerMatches = false;
          break;
        }
      }

      if (!triggerMatches) continue;

      const verbToken = tokens[i + 1 + triggerLen];
      const verbLower = verbToken.original.toLowerCase();

      let foundVerb: { gup: string; infinitive: string } | null = null;
      for (const entry of Object.values(LEXICON.verbs)) {
        const verbForms = entry[mode];
        for (const form of verbForms) {
          const infLower = form.infinitive.toLowerCase();
          if (
            infLower === verbLower ||
            verbLower.startsWith(infLower.slice(0, -2)) ||
            verbLower.startsWith(infLower.slice(0, -1))
          ) {
            foundVerb = { gup: entry.forms[3], infinitive: form.infinitive };
            break;
          }
        }
        if (foundVerb) break;
      }

      const triggerPhrase = tokens
        .slice(i + 1, i + 1 + triggerLen)
        .map((t) => t.original)
        .join(" ");

      const consumedIndices: number[] = [i];
      for (let t = 0; t < triggerLen; t++) {
        consumedIndices.push(i + 1 + t);
      }
      consumedIndices.push(i + 1 + triggerLen);

      if (foundVerb) {
        const agentGup = foundVerb.gup + "mirri";
        return {
          nounIndex: i,
          nounWord: token.original,
          nounGup,
          triggerIndex: i + 1,
          triggerWord: triggerPhrase,
          verbIndex: i + 1 + triggerLen,
          verbWord: verbToken.original,
          verbGup: foundVerb.gup,
          agentGup,
          consumedIndices,
          explanation: `${token.original} ${triggerPhrase} ${verbToken.original} → ${agentGup} ${nounGup} (${relativeClauseLabel})`,
          isParticiple: false,
        };
      }

      const fallbackGup = verbLower + "mirri";
      return {
        nounIndex: i,
        nounWord: token.original,
        nounGup,
        triggerIndex: i + 1,
        triggerWord: triggerPhrase,
        verbIndex: i + 1 + triggerLen,
        verbWord: verbToken.original,
        verbGup: verbLower,
        agentGup: fallbackGup,
        consumedIndices,
        explanation: `${token.original} ${triggerPhrase} ${verbToken.original} → ${fallbackGup} ${nounGup} (${relativeClauseLabel})`,
        isParticiple: false,
      };
    }
  }

  return null;
}

export function detectDjalVerbPattern(
  tokens: Token[],
  mode: LanguageMode
): DjalVerbMatch | null {
  const config = LANG_CONFIG[mode];
  const skipWords = [
    ...config.skipWords,
    ...config.connectors,
    "a",
    "de",
    "to",
    "how",
    "cómo",
    "como",
    "que",
    "that",
  ];

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    if (token.type !== "verb" || !token.verbMatch) continue;

    const isDjal = token.verbMatch.isDjal;
    const isMarnggi = token.verbMatch.isMarnggi;

    if (!isDjal && !isMarnggi) continue;

    const consumedIndices: number[] = [];

    for (let j = i + 1; j < tokens.length; j++) {
      const nextToken = tokens[j];
      const nextWordLower = nextToken.original.toLowerCase();

      if (skipWords.includes(nextWordLower)) {
        consumedIndices.push(j);
        continue;
      }

      if (nextToken.type === "verb" && nextToken.verbMatch && !nextToken.verbMatch.isDjal && !nextToken.verbMatch.isMarnggi) {
        const verbEntry = nextToken.verbMatch.entry;
        const verbGupBase = verbEntry.forms[4] ?? verbEntry.forms[3];

        const suffixResult = determineDjalSuffix(verbGupBase);
        const primarySuffix = suffixResult.suffixes[0];
        const verbGupWithSuffix = applyDjalSuffix(verbGupBase, primarySuffix);

        const allOptions = suffixResult.suffixes.map((s) =>
          applyDjalSuffix(verbGupBase, s)
        );

        const djalType = isDjal ? "djal" : "marnggi";
        const djalLabel = isDjal ? "djäl" : "marŋgi";

        consumedIndices.push(j);

        const attachedClitic = nextToken.verbMatch.attachedClitic;
        const attachedCliticPerson = attachedClitic
          ? config.indirectObjectClitics[attachedClitic]
          : undefined;

        const verbTense = nextToken.verbMatch.tense;
        const isSubjunctive = verbTense === "presentSubjunctive" || verbTense === "imperfectSubjunctive";
        const verbPerson = nextToken.verbMatch.person;
        const subjunctivePerson = (verbPerson !== undefined && verbPerson !== null) ? verbPerson : undefined;

        return {
          djalIndex: i,
          djalWord: token.original,
          djalType,
          verbIndex: j,
          verbWord: nextToken.original,
          verbGupBase,
          verbGupWithSuffix,
          suffixOptions: allOptions,
          consumedIndices,
          explanation: `${nextToken.original} → ${verbGupBase} + -${primarySuffix} = ${verbGupWithSuffix} (${djalLabel} + verbo)`,
          attachedClitic,
          attachedCliticPerson,
          isSubjunctive,
          subjunctivePerson,
        };
      }

      if (nextToken.type !== "unknown") {
        consumedIndices.push(j);
        continue;
      }

      break;
    }
  }

  return null;
}

export function detectLocativeVerbPattern(
  tokens: Token[],
  mode: LanguageMode
): LocativeVerbMatch | null {
  const config = LANG_CONFIG[mode];
  const {
    locativeVerbTriggers,
    allativeVerbTriggers,
    ablativeVerbTriggers,
    aboutToTriggers,
  } = config;

  const blockedIndices = new Set<number>();
  for (const trigger of aboutToTriggers) {
    const result = hasPhrase(tokens, trigger);
    if (result.found) {
      for (const idx of result.indices) blockedIndices.add(idx);
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    if (blockedIndices.has(i)) continue;
    const tokenLower = token.original.toLowerCase();

    let suffixType: "ngura" | "lili" | "nguru" | null = null;
    let applySuffixFn: ((word: string) => string) | null = null;
    let suffixName: string = "";

    if (locativeVerbTriggers.includes(tokenLower)) {
      suffixType = "ngura";
      applySuffixFn = applyLocativeSuffix;
      suffixName = LOCATIVE_SUFFIX;
    } else if (allativeVerbTriggers.includes(tokenLower)) {
      suffixType = "lili";
      applySuffixFn = applyAllativeSuffix;
      suffixName = ALLATIVE_SUFFIX;
    } else if (ablativeVerbTriggers.includes(tokenLower)) {
      suffixType = "nguru";
      applySuffixFn = applyAblativeSuffix;
      suffixName = ABLATIVE_SUFFIX;
    }

    if (!suffixType || !applySuffixFn) continue;

    const nextToken = tokens[i + 1];
    if (nextToken.type !== "verb" || !nextToken.verbMatch) continue;

    const verbMatch = nextToken.verbMatch;
    const verbEntry = LEXICON.verbs[verbMatch.gupKey];

    if (!verbEntry || !verbEntry.forms || !verbEntry.forms[3]) continue;

    const verbQuaternary = verbEntry.forms[3];
    const verbWithSuffix = applySuffixFn(verbQuaternary);

    const consumedIndices = [i, i + 1];

    const explanation = `${tokenLower} ${nextToken.original} → ${verbQuaternary} + -${suffixName} = ${verbWithSuffix}`;

    return {
      suffixType,
      triggerIndex: i,
      triggerWord: token.original,
      verbIndex: i + 1,
      verbWord: nextToken.original,
      verbGup: verbMatch.gupKey,
      verbQuaternary,
      verbWithSuffix,
      consumedIndices,
      explanation,
    };
  }

  return null;
}

export function detectPurposeInfinitive(
  tokens: Token[],
  mode: LanguageMode
): PurposeInfinitiveMatch | null {
  const config = LANG_CONFIG[mode];
  const { aboutToTriggers } = config;

  if (
    aboutToTriggers.some((trigger) => hasPhrase(tokens, trigger).found)
  ) {
    return null;
  }
  const normalizedTokens = tokens.map((t) =>
    normalizeAccents(t.original.toLowerCase())
  );
  const isAboutToAtIndex = (startIdx: number): boolean => {
    for (const trigger of aboutToTriggers) {
      const triggerWords = trigger.toLowerCase().split(" ");
      if (startIdx + triggerWords.length > normalizedTokens.length) {
        continue;
      }
      let match = true;
      for (let j = 0; j < triggerWords.length; j++) {
        if (
          normalizedTokens[startIdx + j] !==
          normalizeAccents(triggerWords[j])
        ) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  };
  const skipWords = [
    ...config.skipWords,
    ...config.connectors,
    ...config.purposeConnectors,
  ];
  const perlativeTimeTriggers = config.perlativeTimeTriggers || [];
  const isPerlativeTimeAtIndex = (startIdx: number): boolean => {
    for (const trigger of perlativeTimeTriggers) {
      const triggerWords = trigger.toLowerCase().split(" ");
      if (startIdx + triggerWords.length > normalizedTokens.length) {
        continue;
      }
      let match = true;
      for (let j = 0; j < triggerWords.length; j++) {
        if (
          normalizedTokens[startIdx + j] !==
          normalizeAccents(triggerWords[j])
        ) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  };

  const irVerbEntry = LEXICON.verbs["marrtji"];
  const irForms = irVerbEntry?.[mode]?.[0];
  const irConjugations = irForms
    ? [
        ...irForms.preterite,
        ...irForms.imperfect,
        ...irForms.presentIndicative,
        ...irForms.future,
        ...irForms.conditional,
      ]
    : [];

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];

    let effectiveVerbMatch: VerbMatch | undefined = token.verbMatch;
    if (token.type === "verb" && !token.verbMatch && irVerbEntry && irForms) {
      const normalizedWord = token.original.toLowerCase();
      if (irConjugations.includes(normalizedWord)) {
        let tense: string = "present";
        let person = 0;
        const tenseArrays: [string, string[]][] = [
          ["preterite", irForms.preterite],
          ["imperfect", irForms.imperfect],
          ["presentIndicative", irForms.presentIndicative],
          ["future", irForms.future],
          ["conditional", irForms.conditional],
        ];
        for (const [tenseName, arr] of tenseArrays) {
          const idx = arr.indexOf(normalizedWord);
          if (idx !== -1) {
            tense = tenseName;
            person = idx;
            break;
          }
        }
        effectiveVerbMatch = {
          gupKey: "marrtji",
          entry: irVerbEntry,
          tense,
          person,
          formIndex: 0,
          isDjal: false,
          isMarnggi: false,
          attachedClitic: undefined,
        };
      }
    }

    const { copulaVerbs } = LANG_CONFIG[mode];
    const isCopulaToken = copulaVerbs.includes(token.original.toLowerCase());
    if (isCopulaToken && isAboutToAtIndex(i)) {
   
      continue;
    }

    if (token.type !== "verb") continue;
    if (!effectiveVerbMatch && !isCopulaToken) continue;
    if (effectiveVerbMatch?.isDjal || effectiveVerbMatch?.isMarnggi) continue;



    const consumedIndices: number[] = [];

    for (let j = i + 1; j < tokens.length; j++) {
      const nextToken = tokens[j];
      const nextWordLower = nextToken.original.toLowerCase();

      if (isPerlativeTimeAtIndex(j)) {
        break;
      }

      if (skipWords.includes(nextWordLower)) {
        consumedIndices.push(j);
        continue;
      }

      if (nextToken.type === "verb" && nextToken.verbMatch) {
        if (nextToken.verbMatch.isDjal || nextToken.verbMatch.isMarnggi) break;
        if (nextToken.verbMatch.tense === "gerund") break;

        const verbEntry = nextToken.verbMatch.entry;
        const verbGupBase = verbEntry.forms[4] ?? verbEntry.forms[3];

        const mainVerbSkipsSuffix = effectiveVerbMatch?.entry?.noInfinitiveSuffix === true;

        const suffixResult = determineDjalSuffix(verbGupBase);
        const primarySuffix = suffixResult.suffixes[0];
        const verbGupWithSuffix = mainVerbSkipsSuffix
          ? verbGupBase
          : applyDjalSuffix(verbGupBase, primarySuffix);

        const allOptions = mainVerbSkipsSuffix
          ? [verbGupBase]
          : suffixResult.suffixes.map((s) => applyDjalSuffix(verbGupBase, s));

        consumedIndices.push(j);

        const mainVerbTense = effectiveVerbMatch?.tense || "present";
        const mainVerbPerson = effectiveVerbMatch?.person ?? 0;

        const match = {
          mainVerbIndex: i,
          mainVerbWord: token.original,
          mainVerbGupKey: effectiveVerbMatch?.gupKey,
          mainVerbEntry: effectiveVerbMatch?.entry,
          mainVerbTense: mainVerbTense as string,
          mainVerbPerson,
          infinitiveIndex: j,
          infinitiveWord: nextToken.original,
          infinitiveEntry: verbEntry,
          infinitiveGupBase: verbGupBase,
          infinitiveGupWithSuffix: verbGupWithSuffix,
          suffixOptions: allOptions,
          consumedIndices,
          explanation: mainVerbSkipsSuffix
            ? `${nextToken.original} → ${verbGupBase} (infinitivo sin sufijo)`
            : `${nextToken.original} → ${verbGupBase} + -${primarySuffix} = ${verbGupWithSuffix} (infinitivo -${primarySuffix})`,
          hasAlternativePattern: !isCopulaToken,
        };
        return match;
      }

      if (nextToken.type === "noun") {
        break;
      }

      if (nextToken.type === "adjective") {
        if (isCopulaToken) {
          continue;
        }
        break;
      }

      if (nextToken.type === "unknown") {
        consumedIndices.push(j);
        continue;
      }
    }
  }

  return null;
}

export function detectInfinitiveAgent(
  tokens: Token[],
  mode: LanguageMode
): InfinitiveAgentMatch | null {
  const config = LANG_CONFIG[mode];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== "verb" || !token.verbMatch) continue;

    const mainVerbEntry = token.verbMatch.entry;
    const mainVerbTense = token.verbMatch.tense || "present";
    const mainVerbPerson = token.verbMatch.person ?? 0;

    const subjunctiveConnector = config.relativeClauseTriggers[0];

    const queIndex = tokens.findIndex(
      (t, idx) => idx > i && t.original.toLowerCase() === subjunctiveConnector.toLowerCase()
    );

    if (queIndex !== -1 && queIndex === i + 1) {
      for (let j = queIndex + 1; j < tokens.length; j++) {
        const nextToken = tokens[j];
        if (nextToken.type === "verb" && nextToken.verbMatch) {
          const subjTense = nextToken.verbMatch.tense;
          if (subjTense === "presentSubjunctive" || subjTense === "imperfectSubjunctive") {
            const subjPerson = nextToken.verbMatch.person ?? 0;
            const consumedIndices = [queIndex, j];

            let objectIndex = -1;
            let objectWord = "";
            let objectPersonNumber: PersonNumber | null = null;
            let objectGup: string | null = null;

            for (let k = i + 1; k < queIndex; k++) {
              const objToken = tokens[k];
              if (objToken.type === "pronoun") {
                objectIndex = k;
                objectWord = objToken.original;
                const pronounInfo = config.indirectObjectClitics[objToken.original.toLowerCase()];
                if (pronounInfo) {
                  objectPersonNumber = pronounInfo;
                }
                consumedIndices.push(k);
                break;
              }
            }

            return {
              type: "object-is-agent",
              mainVerbIndex: i,
              mainVerbWord: token.original,
              mainVerbEntry,
              mainVerbTense,
              mainVerbPerson,
              infinitiveIndex: j,
              infinitiveWord: nextToken.original,
              infinitiveEntry: nextToken.verbMatch.entry,
              objectIndex,
              objectWord,
              objectPersonNumber,
              objectGup,
              consumedIndices,
              isSubjunctive: true,
              subjunctivePerson: subjPerson,
            };
          }
        }
      }
    }

    for (let j = i + 1; j < tokens.length; j++) {
      const nextToken = tokens[j];
      if (nextToken.type === "verb" && nextToken.verbMatch) {
        const attachedClitic = nextToken.verbMatch.attachedClitic;
        if (attachedClitic) {
          const cliticPerson = config.indirectObjectClitics[attachedClitic];
          return {
            type: "subject-is-agent",
            mainVerbIndex: i,
            mainVerbWord: token.original,
            mainVerbEntry,
            mainVerbTense,
            mainVerbPerson,
            infinitiveIndex: j,
            infinitiveWord: nextToken.original,
            infinitiveEntry: nextToken.verbMatch.entry,
            objectIndex: j,
            objectWord: attachedClitic,
            objectPersonNumber: cliticPerson || null,
            objectGup: null,
            consumedIndices: [j],
            isSubjunctive: false,
          };
        }

        const verbForms = nextToken.verbMatch.entry.es || [];
        const isInfinitive = verbForms.some(
          (f) => f.infinitive.toLowerCase() === nextToken.original.toLowerCase()
        );

        if (isInfinitive) {
          for (let k = j + 1; k < tokens.length; k++) {
            const objToken = tokens[k];
            if (objToken.original.toLowerCase() === "a") continue;
            if (objToken.type === "pronoun" || objToken.type === "noun" || objToken.type === "unknown") {
              return {
                type: "subject-is-agent",
                mainVerbIndex: i,
                mainVerbWord: token.original,
                mainVerbEntry,
                mainVerbTense,
                mainVerbPerson,
                infinitiveIndex: j,
                infinitiveWord: nextToken.original,
                infinitiveEntry: nextToken.verbMatch.entry,
                objectIndex: k,
                objectWord: objToken.original,
                objectPersonNumber: null,
                objectGup: objToken.gupKey || null,
                consumedIndices: [j],
                isSubjunctive: false,
              };
            }
            break;
          }
        }
      }
    }

    const infinitiveMarker = config.infinitiveMarker;
    if (infinitiveMarker) {
      for (let j = i + 1; j < tokens.length; j++) {
        const nextToken = tokens[j];

        if (nextToken.type === "pronoun" || nextToken.type === "noun" || nextToken.type === "unknown") {
          const toIndex = tokens.findIndex(
            (t, idx) => idx > j && t.original.toLowerCase() === infinitiveMarker.toLowerCase()
          );

          if (toIndex !== -1 && toIndex === j + 1) {
            for (let k = toIndex + 1; k < tokens.length; k++) {
              const verbToken = tokens[k];
              if (verbToken.type === "verb" && verbToken.verbMatch) {
                return {
                  type: "object-is-agent",
                  mainVerbIndex: i,
                  mainVerbWord: token.original,
                  mainVerbEntry,
                  mainVerbTense,
                  mainVerbPerson,
                  infinitiveIndex: k,
                  infinitiveWord: verbToken.original,
                  infinitiveEntry: verbToken.verbMatch.entry,
                  objectIndex: j,
                  objectWord: nextToken.original,
                  objectPersonNumber: null,
                  objectGup: nextToken.gupKey || null,
                  consumedIndices: [toIndex],
                  isSubjunctive: false,
                };
              }
              if (verbToken.type !== "unknown") break;
            }
          }
        }

        if (nextToken.original.toLowerCase() === "to") {
          for (let k = j + 1; k < tokens.length; k++) {
            const verbToken = tokens[k];
            if (verbToken.type === "verb" && verbToken.verbMatch) {
              for (let m = k + 1; m < tokens.length; m++) {
                const objToken = tokens[m];
                if (objToken.type === "pronoun" || objToken.type === "noun" || objToken.type === "unknown") {
                  return {
                    type: "subject-is-agent",
                    mainVerbIndex: i,
                    mainVerbWord: token.original,
                    mainVerbEntry,
                    mainVerbTense,
                    mainVerbPerson,
                    infinitiveIndex: k,
                    infinitiveWord: verbToken.original,
                    infinitiveEntry: verbToken.verbMatch.entry,
                    objectIndex: m,
                    objectWord: objToken.original,
                    objectPersonNumber: null,
                    objectGup: objToken.gupKey || null,
                    consumedIndices: [j],
                    isSubjunctive: false,
                  };
                }
                break;
              }
              break;
            }
            if (verbToken.type !== "unknown") break;
          }
        }

        break;
      }
    }
  }

  return null;
}
