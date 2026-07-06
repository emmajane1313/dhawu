import { LanguageMode } from "@/app/components/types/components.type";
import {
  ExplanationKey,
  ExplanationPayload,
  IRToken,
  PersonNumber,
  TranslationAlternative,
  TranslationPart,
} from "../core/types";
import {
  ObjectPronounKey,
  buildObjectPronounPart,
  buildEmphaticObjectPronounPart,
  matchObjectPronoun,
  ObjectPronounMatch,
} from "../rules/objectPronoun";
import { matchVerbAt } from "../rules/verb";
import type { VerbMatch } from "../rules/verb";
import { matchSubjectPronoun, SUBJECT_PRONOUNS_GUP } from "../rules/pronoun";
import { buildDefiniteArticlePart, createVerbPart, finalizePart } from "./parts";
import { matchCopulaAt } from "./copula";
import { debugLog } from "../engine/debug";
import { getLanguagePack } from "../lang";
import {
  AdjectiveMatch,
  NounMatch,
  matchAdjectiveAt,
  matchArticleAt,
  matchAgentNounAt,
  matchMarkerAt,
  matchNounAt,
  isOtherGroupPatternAt,
} from "./lexiconMatch";
import {
  ConnectorMatch,
  buildConnectorPart,
  isBreakAdverbToken,
  isClauseConnectorToken,
  isListConnectorToken,
  matchConnectorAt,
} from "./connectors";
import { isNegatorToken } from "./negation";
import {
  TokenLike,
  isStrongPunctuationToken,
  normalizeToken,
  stripSpanishDiacritics,
  matchSequence,
  splitForm,
} from "./tokenUtils";
type PossessivePersonMatch = {
  person: PersonNumber;
  altPersons?: PersonNumber[];
  source: string;
  nonHuman?: boolean;
};
import { collectHabitualMarkerIndices, isHabitualMarkerAt } from "./habitual";
import { DemonstrativeKind, matchDemonstrativeToken } from "./demonstratives";
import { matchDhiyakuDeterminerAt } from "./dhiyaku";
import {
  applyPossessiveSuffix,
  applyInstrumentalSuffixToGup,
  applySuffixToGup,
  getBelongingHumanSuffixes,
  getBelongingSuffixes,
  getAblativePossessiveHumanSuffixes,
  getComitativePossessiveHumanSuffixes,
  getComitativePossessiveSuffixes,
  getComitativeSuffixes,
  getHumanAblativeSuffixes,
  getInstrumentalSuffixes,
  getOriginPossessiveHumanSuffixes,
  getPossessiveSuffixes,
  getSourceOriginSuffixes,
  getTraversiveHumanSuffixes,
  getTraversivePossessiveHumanSuffixes,
  getTraversiveSuffixes,
} from "./suffixes";
import { LEXICON } from "../lexicon";
import { matchLocativeMarkerAt } from "./locative";
import {
  buildComitativePronounPart,
  matchComitativePronounAt,
} from "../rules/comitativePronoun";
import {
  buildAllativePronounPart,
  matchAllativePronounAt,
} from "../rules/allativePronoun";
import {
  getComitativePronounForms,
  getComitativePronounEmphaticForms,
  getComitativePronounNoteKey,
} from "../rules/comitativePronoun";
import { matchGerundAfterIndex, matchInfinitiveAt, splitVerbClitic } from "./verbAux";
import {
  ABLATIVE_POSSESSIVE_PRONOUNS_EMPHATIC_GUP,
  ABLATIVE_POSSESSIVE_PRONOUNS_GUP,
  BELONGING_PRONOUNS_EMPHATIC_GUP,
  BELONGING_PRONOUNS_GUP,
  ORIGIN_POSSESSIVE_PRONOUNS_GUP,
  TRAVERSE_POSSESSIVE_PRONOUNS_EMPHATIC_GUP,
} from "../constants";

const addThatVisibilityNote = (
  part: TranslationPart,
  kind?: DemonstrativeKind
): TranslationPart => {
  if (kind !== "that") return part;
  if (!part.alternatives || part.alternatives.length === 0) return part;
  return {
    ...part,
    explanations: [
      ...(part.explanations ?? []),
      { key: "DEMONSTRATIVE_THAT_VISIBILITY" },
    ],
  };
};

const isNonHumanDemoPronoun = (
  token: string,
  sourceLang: LanguageMode
): boolean => {
  const normalized =
    sourceLang === "es"
      ? stripSpanishDiacritics(normalizeToken(token, sourceLang))
      : normalizeToken(token, sourceLang);
  return sourceLang === "es" ? normalized === "ello" : normalized === "it";
};
import {
  buildBelongingPronounPart,
  matchBelongingPronounAt,
} from "../rules/belongingPronoun";
import {
  buildHumanAblativePronounPart,
  matchHumanAblativePronounAt,
} from "../rules/ablativePronoun";
import {
  buildSourceOriginPronounPart,
  matchSourceOriginPronounAt,
  SOURCE_ORIGIN_PRONOUNS_GUP,
  SOURCE_ORIGIN_PRONOUNS_GUP_EMPHATIC,
} from "../rules/sourceOriginPronoun";
import {
  buildPossessivePronounPart,
  buildPossessiveSuffixPart,
  matchPossessiveEmphasisAt,
  matchPossessiveDeterminer,
  matchPossessiveOfPronoun,
  stripEnglishPossessiveSuffix,
} from "./possession";

let objectTraceCollector: ((message: string) => void) | null = null;

export function setObjectTraceCollector(
  collector: ((message: string) => void) | null
) {
  objectTraceCollector = collector;
}

function traceObject(message: string) {
  if (objectTraceCollector) {
    objectTraceCollector(message);
  }
}

export function emitObjectTrace(message: string) {
  traceObject(message);
}

export type PendingObject =
  | {
      kind: "pronoun";
      match: ObjectPronounMatch;
      spanStart?: number;
      spanEnd?: number;
    }
  | {
      kind: "noun";
      match: NounMatch;
      forceHuman?: boolean;
      allowAlternatives?: boolean;
      spanStart?: number;
      spanEnd?: number;
    };

const LOCATIVE_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["en"],
    ["dentro", "de"],
    ["fuera", "de"],
    ["encima", "de"],
    ["sobre"],
    ["debajo", "de"],
    ["cerca", "de"],
    ["al", "lado", "de"],
    ["junto", "a"],
  ],
  en: [
    ["in"],
    ["at"],
    ["inside"],
    ["inside", "of"],
    ["outside", "of"],
    ["on", "top", "of"],
    ["under"],
    ["near"],
    ["beside"],
    ["next", "to"],
  ],
};

const COMITATIVE_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["con"],
    ["junto", "con"],
  ],
  en: [
    ["with"],
    ["by"],
  ],
};

const TRAVERSE_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["a", "traves", "de"],
    ["a", "traves", "del"],
    ["por"],
  ],
  en: [
    ["through"],
    ["along"],
    ["by"],
  ],
};

const INSTRUMENTAL_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["con"],
    ["por"],
    ["mediante"],
    ["usando"],
  ],
  en: [
    ["with"],
    ["by", "means", "of"],
    ["using"],
    ["by"],
  ],
};

const PURPOSE_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["por"],
    ["para"],
    ["a", "proposito", "de"],
    ["por", "razon", "de"],
    ["con", "el", "fin", "de"],
    ["a", "fin", "de"],
    ["por", "motivo", "de"],
    ["por", "causa", "de"],
    ["con", "la", "intencion", "de"],
    ["con", "el", "objetivo", "de"],
    ["con", "la", "finalidad", "de"],
  ],
  en: [
    ["for"],
    ["for", "the", "purpose", "of"],
    ["for", "the", "sake", "of"],
    ["because", "of"],
    ["in", "order", "to"],
    ["so", "as", "to"],
  ],
};

const ACT_VERB_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [["en", "el", "acto", "de"], ["al"], ["mientras"], ["durante"]],
  en: [["in", "the", "act", "of"], ["while"], ["during"]],
};

const TRATARSE_DE_FORMS_ES = [
  "se trata de",
  "se tratan de",
  "se trataba de",
  "se trataban de",
  "se trato de",
  "se trataron de",
  "se tratara de",
  "se trataran de",
  "se tratase de",
  "se tratasen de",
  "se trataria de",
  "se tratarian de",
  "se ha tratado de",
  "se han tratado de",
  "se habia tratado de",
  "se habian tratado de",
  "se habra tratado de",
  "se habran tratado de",
  "se habria tratado de",
  "se habrian tratado de",
  "se haya tratado de",
  "se hayan tratado de",
  "se hubiera tratado de",
  "se hubieran tratado de",
  "se hubiese tratado de",
  "se hubiesen tratado de",
].map((form) => form.split(" "));

const BE_ABOUT_FORMS_EN = [
  "am about",
  "is about",
  "are about",
  "was about",
  "were about",
  "be about",
  "been about",
  "being about",
  "will be about",
  "would be about",
  "has been about",
  "have been about",
  "had been about",
  "will have been about",
  "would have been about",
  "am not about",
  "is not about",
  "are not about",
  "was not about",
  "were not about",
  "will not be about",
  "would not be about",
  "has not been about",
  "have not been about",
  "had not been about",
  "won't be about",
  "wouldn't be about",
  "isn't about",
  "aren't about",
  "wasn't about",
  "weren't about",
  "hasn't been about",
  "haven't been about",
  "hadn't been about",
  "it's about",
  "that's about",
  "this is about",
  "that is about",
  "these are about",
  "those are about",
].map((form) => form.split(" "));

const ABOUT_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["sobre"],
    ["acerca", "de"],
    ["respecto", "a"],
    ["en", "cuanto", "a"],
    ["en", "relacion", "con"],
    ["relativo", "a"],
    ["relacionado", "con"],
    ...TRATARSE_DE_FORMS_ES,
  ],
  en: [
    ["about"],
    ["regarding"],
    ["concerning"],
    ["as", "for"],
    ["in", "regard", "to"],
    ["in", "regards", "to"],
    ["with", "regard", "to"],
    ["with", "regards", "to"],
    ...BE_ABOUT_FORMS_EN,
  ],
};

const ABOUT_LOCATIVE_ALT_PREPOSITIONS: Record<LanguageMode, Set<string>> = {
  es: new Set(["sobre"]),
  en: new Set([]),
};

export function shouldAllowAboutLocativeAlt(
  preposition: { normalized: string },
  sourceLang: LanguageMode
): boolean {
  return ABOUT_LOCATIVE_ALT_PREPOSITIONS[sourceLang]?.has(
    preposition.normalized
  ) ?? false;
}

const INDIRECT_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["a"],
    ["para"],
  ],
  en: [
    ["to"],
    ["for"],
  ],
};

const LOCATIVE_PREPOSITION_MARKERS: Record<LanguageMode, Record<string, string>> = {
  es: {
    "dentro de": "marker.locative.inside",
    "adentro de": "marker.locative.inside",
    "cerca de": "marker.locative.close",
    "fuera de": "marker.locative.outside",
    "encima de": "marker.locative.above",
    sobre: "marker.locative.above",
    "al lado de": "marker.locative.close",
    "junto a": "marker.locative.close",
  },
  en: {
    near: "marker.locative.close",
    "outside of": "marker.locative.outside",
    "on top of": "marker.locative.above",
    beside: "marker.locative.close",
    "next to": "marker.locative.close",
  },
};

const ALLATIVE_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["a"],
    ["al"],
    ["hacia"],
    ["hasta"],
    ["rumbo", "a"],
    ["dentro", "de"],
    ["adentro", "de"],
    ["afuera", "de"],
    ["fuera", "de"],
    ["encima", "de"],
    ["sobre"],
    ["al", "lado", "de"],
    ["junto", "a"],
    ["cerca", "de"],
  ],
  en: [
    ["to"],
    ["toward"],
    ["towards"],
    ["into"],
    ["onto"],
    ["inside"],
    ["inside", "of"],
    ["outside", "of"],
    ["near"],
    ["beside"],
    ["next", "to"],
    ["on", "top", "of"],
    ["over"],
    ["above"],
  ],
};

const ABLATIVE_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["de"],
    ["del"],
    ["desde"],
  ],
  en: [
    ["from"],
    ["away", "from"],
    ["out", "of"],
  ],
};

const ORIGIN_PREPOSITIONS: Record<LanguageMode, string[][]> = {
  es: [
    ["de"],
    ["del"],
    ["por"],
  ],
  en: [
    ["of"],
    ["by"],
    ["from"],
  ],
};

const ALLATIVE_PREPOSITION_MARKERS: Record<LanguageMode, Record<string, string>> = {
  es: {
    "dentro de": "marker.locative.inside",
    "adentro de": "marker.locative.inside",
    "afuera de": "marker.locative.outside",
    "fuera de": "marker.locative.outside",
    "encima de": "marker.locative.above",
    sobre: "marker.locative.above",
    "al lado de": "marker.locative.close",
    "junto a": "marker.locative.close",
    "cerca de": "marker.locative.close",
  },
  en: {
    inside: "marker.locative.inside",
    "inside of": "marker.locative.inside",
    "outside of": "marker.locative.outside",
    "on top of": "marker.locative.above",
    over: "marker.locative.above",
    above: "marker.locative.above",
    near: "marker.locative.close",
    beside: "marker.locative.close",
    "next to": "marker.locative.close",
  },
};

const TIME_UNIT_TOKENS: Record<LanguageMode, string[]> = {
  es: [
    "día",
    "dia",
    "días",
    "dias",
    "semana",
    "semanas",
    "mes",
    "meses",
    "año",
    "ano",
    "años",
    "anos",
    "hora",
    "horas",
    "minuto",
    "minutos",
    "segundo",
    "segundos",
    "momento",
    "momentos",
  ],
  en: [
    "day",
    "days",
    "week",
    "weeks",
    "month",
    "months",
    "year",
    "years",
    "hour",
    "hours",
    "minute",
    "minutes",
    "second",
    "seconds",
    "moment",
    "moments",
  ],
};

const NUMBER_TOKENS: Record<LanguageMode, string[]> = {
  es: ["uno", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"],
  en: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
};

export type NounPhraseMatch = {
  adjectives: { pre: AdjectiveMatch[]; post: AdjectiveMatch[] };
  noun: NounMatch;
  consumed: number;
  participleInstrument?: {
    preposition: { consumed: number; source: string; normalized: string; kind: "instrumental" | "locative" };
    phrase?: NounPhraseMatch;
    pronounParts?: TranslationPart[];
  };
};

type PossessorAfterOfMatch = {
  sequences: TranslationPart[][];
  altSequences?: TranslationPart[][];
  consumed: number;
  hasAlternatives: boolean;
  altHasAlternatives: boolean;
  humanPossessiveSequences?: TranslationPart[][];
  humanPossessiveHasAlternatives?: boolean;
  humanPossessiveIsAmbiguous?: boolean;
  traversiveHumanPossessiveSequences?: TranslationPart[][];
  traversiveHumanPossessiveHasAlternatives?: boolean;
  traversiveHumanPossessiveIsAmbiguous?: boolean;
  belongingHumanPossessiveSequences?: TranslationPart[][];
  belongingHumanPossessiveHasAlternatives?: boolean;
  belongingHumanPossessiveIsAmbiguous?: boolean;
  originHumanPossessiveSequences?: TranslationPart[][];
  originHumanPossessiveHasAlternatives?: boolean;
  originHumanPossessiveIsAmbiguous?: boolean;
  ablativeHumanPossessiveSequences?: TranslationPart[][];
  ablativeHumanPossessiveHasAlternatives?: boolean;
  ablativeHumanPossessiveIsAmbiguous?: boolean;
};

function isNounPhraseBoundary(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  const token = tokens[index];
  if (!token) return true;
  const normalized = normalizeToken(token.source, sourceLang);
  if (
    (sourceLang === "es" && normalized === "de") ||
    (sourceLang === "en" && normalized === "of")
  ) {
    return true;
  }
  if (matchCopulaAt(tokens, index, sourceLang)) return true;
  if (
    (sourceLang === "es" &&
      (normalized === "mientras" || normalized === "al" || normalized === "durante")) ||
    (sourceLang === "en" && (normalized === "while" || normalized === "during"))
  ) {
    const nextIndex = index + 1;
    const nextMatches = matchVerbAt(tokens, nextIndex, sourceLang);
    if (nextMatches.length > 0) return true;
    const infinitiveMatch = matchInfinitiveAt(
      tokens as IRToken[],
      nextIndex,
      sourceLang
    );
    if (infinitiveMatch) return true;
    const gerundMatch = matchGerundAfterIndex(
      tokens as IRToken[],
      nextIndex,
      sourceLang
    );
    if (gerundMatch && gerundMatch.gerundIndex === nextIndex) return true;
  }
  const marker = matchMarkerAt(tokens, index, sourceLang);
  if (marker?.entry.breaksObjectWindow) return true;
  if (matchLocativeMarkerAt(tokens, index, sourceLang)) return true;
  if (isLocativePrepositionStart(tokens, index, sourceLang)) return true;
  if (isComitativePrepositionStart(tokens, index, sourceLang)) return true;
  if (isTraversivePrepositionStart(tokens, index, sourceLang)) return true;
  if (isInstrumentalPrepositionStart(tokens, index, sourceLang)) return true;
  if (isPurposePrepositionStart(tokens, index, sourceLang)) return true;
  if (isAboutPrepositionStart(tokens, index, sourceLang)) return true;
  if (isIndirectPrepositionStart(tokens, index, sourceLang)) return true;
  if (isAllativePrepositionStart(tokens, index, sourceLang)) return true;
  if (isAblativePrepositionStart(tokens, index, sourceLang)) return true;
  if (isOriginPrepositionStart(tokens, index, sourceLang)) return true;
  return false;
}

export function matchNounPhraseAfterArticle(
  tokens: TokenLike[],
  start: number,
  sourceLang: LanguageMode,
  options?: { allowUnknownHead?: boolean }
): NounPhraseMatch | null {
  const allowUnknownHead = options?.allowUnknownHead === true;
  const attachParticipleInstrument = (
    phrase: NounPhraseMatch,
    afterIndex: number
  ): NounPhraseMatch => {
    const hasParticiple = [...phrase.adjectives.pre, ...phrase.adjectives.post].some(
      (adj) => Boolean(adj.participleVerb)
    );
    if (!hasParticiple) return phrase;
    const instrumental = matchInstrumentalPrepositionAt(tokens, afterIndex, sourceLang);
    const locative = instrumental ? null : matchLocativePrepositionAt(tokens, afterIndex, sourceLang);
    const preposition = instrumental ?? locative;
    if (!preposition) return phrase;
    const kind: "instrumental" | "locative" = instrumental ? "instrumental" : "locative";
    const normalized = preposition.normalized;
    const isBy =
      (sourceLang === "es" && normalized === "por") ||
      (sourceLang === "en" && normalized === "by");
    const targetIndex = afterIndex + preposition.consumed;
    if (isBy) {
      const sourceOriginMatch = matchSourceOriginPronounAt(
        tokens,
        afterIndex,
        sourceLang
      );
      if (sourceOriginMatch) {
        const rawPart = buildSourceOriginPronounPart(sourceOriginMatch);
        const part = rawPart ? finalizePart(rawPart, sourceLang) : null;
        if (part) {
          return {
            ...phrase,
            participleInstrument: {
              preposition: { ...preposition, normalized, kind },
              pronounParts: [part],
            },
            consumed: phrase.consumed + sourceOriginMatch.consumed,
          };
        }
      }
    } else {
      const pronounMatch = matchBelongingPronounAt(tokens, targetIndex, sourceLang);
      if (pronounMatch) {
        const rawPart = buildBelongingPronounPart(pronounMatch);
        const part = rawPart ? finalizePart(rawPart, sourceLang) : null;
        if (part) {
          return {
            ...phrase,
            participleInstrument: {
              preposition: { ...preposition, normalized, kind },
              pronounParts: [part],
            },
            consumed: phrase.consumed + preposition.consumed + pronounMatch.consumed,
          };
        }
      }
    }
    const instrumentPhrase = matchNounPhraseAfterArticle(
      tokens,
      targetIndex,
      sourceLang
    );
    if (!instrumentPhrase) return phrase;
    return {
      ...phrase,
      participleInstrument: {
        preposition: { ...preposition, normalized, kind },
        phrase: instrumentPhrase,
      },
      consumed: phrase.consumed + preposition.consumed + instrumentPhrase.consumed,
    };
  };

  let index = start;
  const preAdjectives: AdjectiveMatch[] = [];
  while (true) {
    if (matchNounAt(tokens, index, sourceLang) || matchAgentNounAt(tokens, index, sourceLang)) {
      break;
    }
    const adjMatch = matchAdjectiveAt(tokens, index, sourceLang);
    if (adjMatch) {
      preAdjectives.push(adjMatch);
      index += adjMatch.consumed;
      continue;
    }
    if (isNounPhraseBoundary(tokens, index, sourceLang)) break;
    const maybeUnknown = tokens[index];
    if (maybeUnknown) {
      if (isNounPhraseBoundary(tokens, index, sourceLang)) break;
      const nextIndex = index + 1;
      const nextNoun = matchNounAt(tokens, nextIndex, sourceLang);
      if (
        nextNoun &&
        !isStrongPunctuationToken(maybeUnknown) &&
        !isNegatorToken(maybeUnknown, sourceLang) &&
        !isListConnectorToken(tokens, index, sourceLang) &&
        matchVerbAt(tokens, index, sourceLang).length === 0
      ) {
        preAdjectives.push({
          gup: maybeUnknown.source,
          consumed: 1,
          source: maybeUnknown.source,
        });
        index += 1;
        continue;
      }
    }
    break;
  }
  const nounMatch = matchNounAt(tokens, index, sourceLang);
  if (nounMatch) {
    index += nounMatch.consumed;
    const postAdjectives: AdjectiveMatch[] = [];
    while (true) {
      const postMatch = matchAdjectiveAt(tokens, index, sourceLang);
      if (postMatch) {
        postAdjectives.push(postMatch);
        index += postMatch.consumed;
        continue;
      }
      if (isNounPhraseBoundary(tokens, index, sourceLang)) break;
      const maybeUnknown = tokens[index];
      if (maybeUnknown) {
        if (isNounPhraseBoundary(tokens, index, sourceLang)) break;
        if (
          isStrongPunctuationToken(maybeUnknown) ||
          isNegatorToken(maybeUnknown, sourceLang) ||
          isListConnectorToken(tokens, index, sourceLang) ||
          isClauseConnectorToken(tokens, index, sourceLang) ||
          matchVerbAt(tokens, index, sourceLang).length > 0 ||
          matchNounAt(tokens, index, sourceLang)
        ) {
          break;
        }
        postAdjectives.push({
          gup: maybeUnknown.source,
          consumed: 1,
          source: maybeUnknown.source,
        });
        index += 1;
        continue;
      }
      break;
    }
    const basePhrase: NounPhraseMatch = {
      adjectives: { pre: preAdjectives, post: postAdjectives },
      noun: nounMatch,
      consumed: index - start,
    };
    return attachParticipleInstrument(basePhrase, index);
  }
  if (allowUnknownHead) {
    const unknownToken = tokens[index];
    if (unknownToken && !isNounPhraseBoundary(tokens, index, sourceLang)) {
      const noun: NounMatch = {
        gup: unknownToken.source,
        consumed: 1,
        source: unknownToken.source,
      };
      index += 1;
      const postAdjectives: AdjectiveMatch[] = [];
      while (true) {
        const postMatch = matchAdjectiveAt(tokens, index, sourceLang);
        if (postMatch) {
          postAdjectives.push(postMatch);
          index += postMatch.consumed;
          continue;
        }
        if (isNounPhraseBoundary(tokens, index, sourceLang)) break;
        const maybeUnknown = tokens[index];
        if (maybeUnknown) {
          if (isNounPhraseBoundary(tokens, index, sourceLang)) break;
          if (
            isStrongPunctuationToken(maybeUnknown) ||
            isNegatorToken(maybeUnknown, sourceLang) ||
            isListConnectorToken(tokens, index, sourceLang) ||
            isClauseConnectorToken(tokens, index, sourceLang) ||
            matchVerbAt(tokens, index, sourceLang).length > 0 ||
            matchNounAt(tokens, index, sourceLang)
          ) {
            break;
          }
          postAdjectives.push({
            gup: maybeUnknown.source,
            consumed: 1,
            source: maybeUnknown.source,
          });
          index += 1;
          continue;
        }
        break;
      }
      const basePhrase: NounPhraseMatch = {
        adjectives: { pre: preAdjectives, post: postAdjectives },
        noun,
        consumed: index - start,
      };
      return attachParticipleInstrument(basePhrase, index);
    }
  }
  const agentNounMatch = matchAgentNounAt(tokens, index, sourceLang);
  if (agentNounMatch) {
    index += agentNounMatch.consumed;
    const postAdjectives: AdjectiveMatch[] = [];
    while (true) {
      const postMatch = matchAdjectiveAt(tokens, index, sourceLang);
      if (postMatch) {
        postAdjectives.push(postMatch);
        index += postMatch.consumed;
        continue;
      }
      if (isNounPhraseBoundary(tokens, index, sourceLang)) break;
      const maybeUnknown = tokens[index];
      if (maybeUnknown) {
        if (isNounPhraseBoundary(tokens, index, sourceLang)) break;
        if (
          isStrongPunctuationToken(maybeUnknown) ||
          isNegatorToken(maybeUnknown, sourceLang) ||
          isListConnectorToken(tokens, index, sourceLang) ||
          isClauseConnectorToken(tokens, index, sourceLang) ||
          matchVerbAt(tokens, index, sourceLang).length > 0 ||
          matchNounAt(tokens, index, sourceLang) ||
          matchAgentNounAt(tokens, index, sourceLang)
        ) {
          break;
        }
        postAdjectives.push({
          gup: maybeUnknown.source,
          consumed: 1,
          source: maybeUnknown.source,
        });
        index += 1;
        continue;
      }
      break;
    }
    const basePhrase: NounPhraseMatch = {
      adjectives: { pre: preAdjectives, post: postAdjectives },
      noun: agentNounMatch,
      consumed: index - start,
    };
    return attachParticipleInstrument(basePhrase, index);
  }
  const unknownNounToken = tokens[index];
  if (
    unknownNounToken &&
    !isNounPhraseBoundary(tokens, index, sourceLang) &&
    matchVerbAt(tokens, index, sourceLang).length === 0
  ) {
    let scan = index + 1;
    const postAdjectives: AdjectiveMatch[] = [];
    while (true) {
      if (isNounPhraseBoundary(tokens, scan, sourceLang)) break;
      const postMatch = matchAdjectiveAt(tokens, scan, sourceLang);
      if (postMatch) {
        postAdjectives.push(postMatch);
        scan += postMatch.consumed;
        continue;
      }
      const maybeUnknown = tokens[scan];
      if (maybeUnknown) {
        if (isNounPhraseBoundary(tokens, scan, sourceLang)) break;
        if (
          isStrongPunctuationToken(maybeUnknown) ||
          isNegatorToken(maybeUnknown, sourceLang) ||
          isListConnectorToken(tokens, scan, sourceLang) ||
          isClauseConnectorToken(tokens, scan, sourceLang) ||
          matchVerbAt(tokens, scan, sourceLang).length > 0 ||
          matchNounAt(tokens, scan, sourceLang) ||
          matchAgentNounAt(tokens, scan, sourceLang)
        ) {
          break;
        }
        postAdjectives.push({
          gup: maybeUnknown.source,
          consumed: 1,
          source: maybeUnknown.source,
        });
        scan += 1;
        continue;
      }
      break;
    }
    const basePhrase: NounPhraseMatch = {
      adjectives: { pre: preAdjectives, post: postAdjectives },
      noun: {
        gup: unknownNounToken.source,
        isHuman: undefined,
        consumed: 1,
        source: unknownNounToken.source,
      },
      consumed: scan - start,
    };
    return attachParticipleInstrument(basePhrase, scan);
  }
  const unknownTokens: TokenLike[] = [];
  let scan = index;
  while (true) {
    const current = tokens[scan];
    if (!current) break;
    if (isNounPhraseBoundary(tokens, scan, sourceLang)) break;
    if (matchVerbAt(tokens, scan, sourceLang).length > 0) break;
    if (
      isStrongPunctuationToken(current) ||
      isNegatorToken(current, sourceLang) ||
      isListConnectorToken(tokens, scan, sourceLang) ||
      isClauseConnectorToken(tokens, scan, sourceLang)
    ) {
      break;
    }
    unknownTokens.push(current);
    scan += 1;
  }
  if (unknownTokens.length === 0) return null;
  const nounToken = unknownTokens[unknownTokens.length - 1];
  const extraAdjectives = unknownTokens
    .slice(0, -1)
    .map((unknown) => ({
      gup: unknown.source,
      consumed: 1,
      source: unknown.source,
    }));
  const noun: NounMatch = {
    gup: nounToken.source,
    isHuman: undefined,
    consumed: 1,
    source: nounToken.source,
  };
  return {
    adjectives: { pre: [...preAdjectives, ...extraAdjectives], post: [] },
    noun,
    consumed: scan - start,
  };
}

function isTimeUnitToken(token: string, sourceLang: LanguageMode): boolean {
  const normalized = normalizeToken(token, sourceLang);
  return (TIME_UNIT_TOKENS[sourceLang] ?? []).includes(normalized);
}

function isNumberToken(token: string, sourceLang: LanguageMode): boolean {
  const normalized = normalizeToken(token, sourceLang);
  if (!normalized) return false;
  if (/^\d+$/.test(normalized)) return true;
  return (NUMBER_TOKENS[sourceLang] ?? []).includes(normalized);
}

function isTimeUnitFollowing(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  const token = tokens[index];
  if (!token) return false;
  if (isTimeUnitToken(token.source, sourceLang)) return true;
  if (isNumberToken(token.source, sourceLang)) {
    const next = tokens[index + 1];
    if (next && isTimeUnitToken(next.source, sourceLang)) return true;
  }
  return false;
}

function matchLocativePrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string; normalized: string } | null {
  const candidates = LOCATIVE_PREPOSITIONS[sourceLang] ?? [];
  for (const tokensForm of candidates) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (normalizeToken(token.source, sourceLang) !== tokensForm[offset]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    if (
      sourceLang === "es" &&
      tokensForm[0] === "dentro" &&
      tokensForm[1] === "de" &&
      isTimeUnitFollowing(tokens, index + consumed, sourceLang)
    ) {
      return null;
    }
    if (sourceLang === "es" && tokensForm[0] === "en" && consumed === 1) {
      const next = tokens[index + 1];
      const nextNormalized = next ? normalizeToken(next.source, sourceLang) : "";
      if (
        (nextNormalized === "un" || nextNormalized === "una") &&
        isTimeUnitFollowing(tokens, index + 2, sourceLang)
      ) {
        return null;
      }
    }
    if (
      sourceLang === "en" &&
      tokensForm[0] === "in" &&
      tokensForm.length === 1
    ) {
      const next = tokens[index + 1];
      const nextNormalized = next ? normalizeToken(next.source, sourceLang) : "";
      if (
        (nextNormalized === "a" || nextNormalized === "an") &&
        isTimeUnitFollowing(tokens, index + 2, sourceLang)
      ) {
        return null;
      }
    }
    const normalized = tokensForm.join(" ");
    return { consumed, source, normalized };
  }
  return null;
}

function matchComitativePrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string } | null {
  const motionMarker = matchLocativeMarkerAt(tokens, index, sourceLang);
  if (motionMarker?.entry.locationRole === "motion") return null;
  const candidates = COMITATIVE_PREPOSITIONS[sourceLang] ?? [];
  for (const tokensForm of candidates) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (normalizeToken(token.source, sourceLang) !== tokensForm[offset]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    return { consumed, source };
  }
  return null;
}

function matchTraversivePrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string; normalized: string } | null {
  if (sourceLang === "es") {
    const t0 = normalizeTraversiveToken(tokens[index]?.source ?? "", sourceLang);
    const t1 = normalizeTraversiveToken(
      tokens[index + 1]?.source ?? "",
      sourceLang
    );
    const t2 = normalizeTraversiveToken(
      tokens[index + 2]?.source ?? "",
      sourceLang
    );
    if (t0 === "a" && t1 === "traves" && t2 === "de") {
      const consumed = 3;
      const source = tokens
        .slice(index, index + consumed)
        .map((t) => t.source)
        .join(" ");
      return { consumed, source, normalized: "a traves de" };
    }
    if (t0 === "a" && t1 === "traves" && t2 === "del") {
      const consumed = 3;
      const source = tokens
        .slice(index, index + consumed)
        .map((t) => t.source)
        .join(" ");
      return { consumed, source, normalized: "a traves de" };
    }
  }
  const purpose = matchPurposePrepositionAt(tokens, index, sourceLang);
  if (purpose && purpose.consumed > 1) return null;
  const instrumental = matchInstrumentalPrepositionAt(tokens, index, sourceLang);
  if (instrumental && instrumental.consumed > 1) return null;

  const candidates = TRAVERSE_PREPOSITIONS[sourceLang] ?? [];
  const ordered = [...candidates].sort((a, b) => b.length - a.length);
  for (const tokensForm of ordered) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (
        normalizeTraversiveToken(token.source, sourceLang) !==
        normalizeTraversiveToken(tokensForm[offset], sourceLang)
      ) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    return { consumed, source, normalized: tokensForm.join(" ") };
  }
  return null;
}

const normalizePurposeToken = (token: string, lang: LanguageMode): string => {
  const normalized = normalizeToken(token, lang);
  return lang === "es" ? stripSpanishDiacritics(normalized) : normalized;
};

const normalizeAboutToken = (token: string, lang: LanguageMode): string => {
  const normalized = normalizeToken(token, lang);
  return lang === "es" ? stripSpanishDiacritics(normalized) : normalized;
};

function normalizeTraversiveToken(
  token: string,
  lang: LanguageMode
): string {
  const normalized = normalizeToken(token, lang);
  return lang === "es" ? stripSpanishDiacritics(normalized) : normalized;
}

type TraversivePronounMatch = {
  source: string;
  person: PersonNumber;
  consumed: number;
  emphasis?: { source: string; consumed: number } | null;
};

const TRAVERSE_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> = {
  "mí": "1_Sing",
  "mi": "1_Sing",
  "ti": "2_Sing",
  "él": "3_Sing",
  "ella": "3_Sing",
  "nosotros": "1+2_Plur",
  "nosotras": "1+2_Plur",
  "ustedes": "2_Plur",
  "vosotros": "2_Plur",
  "vosotras": "2_Plur",
  "ellos": "3_Plur",
  "ellas": "3_Plur",
  "nosotros dos": "1+2_Dual",
  "nosotras dos": "1+2_Dual",
  "ustedes dos": "2_Dual",
  "vosotros dos": "2_Dual",
  "vosotras dos": "2_Dual",
  "ellos dos": "3_Dual",
  "ellas dos": "3_Dual",
};

const TRAVERSE_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> = {
  "me": "1_Sing",
  "you": "2_Sing",
  "him": "3_Sing",
  "her": "3_Sing",
  "us": "1+2_Plur",
  "them": "3_Plur",
  "us two": "1+2_Dual",
  "you two": "2_Dual",
  "them two": "3_Dual",
  "both of them": "3_Dual",
};

function matchTraversivePronounAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): TraversivePronounMatch | null {
  const triggers =
    sourceLang === "es"
      ? TRAVERSE_PRONOUN_TRIGGERS_ES
      : TRAVERSE_PRONOUN_TRIGGERS_EN;
  let best: TraversivePronounMatch | null = null;
  for (const [phrase, person] of Object.entries(triggers)) {
    const formTokens = splitForm(phrase, sourceLang);
    const seq = matchSequence(tokens, index, formTokens, sourceLang);
    if (!seq.matched) continue;
    const match: TraversivePronounMatch = {
      source: tokens
        .slice(index, index + seq.consumed)
        .map((t) => t.source)
        .join(" "),
      person,
      consumed: seq.consumed,
    };
    if (!best || match.consumed > best.consumed) {
      best = match;
    }
  }
  if (best) {
    const emphasis = matchPossessiveEmphasisAt(tokens, index, sourceLang);
    if (emphasis) {
      best = {
        ...best,
        emphasis,
        consumed: best.consumed + emphasis.consumed,
      };
    }
  }
  return best;
}

function matchPurposePrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string; normalized: string } | null {
  if (sourceLang === "es") {
    const con = normalizePurposeToken(tokens[index]?.source ?? "", sourceLang);
    const article = normalizePurposeToken(tokens[index + 1]?.source ?? "", sourceLang);
    const fin = normalizePurposeToken(tokens[index + 2]?.source ?? "", sourceLang);
    const de = normalizePurposeToken(tokens[index + 3]?.source ?? "", sourceLang);
    if (
      con === "con" &&
      (article === "el" || article === "la" || article === "los" || article === "las") &&
      fin === "fin" &&
      de === "de"
    ) {
      const consumed = 4;
      const source = tokens
        .slice(index, index + consumed)
        .map((t) => t.source)
        .join(" ");
      return { consumed, source, normalized: "con el fin de" };
    }
  }
  const candidates = PURPOSE_PREPOSITIONS[sourceLang] ?? [];
  const ordered = [...candidates].sort((a, b) => b.length - a.length);
  for (const tokensForm of ordered) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (
        normalizePurposeToken(token.source, sourceLang) !==
        normalizePurposeToken(tokensForm[offset], sourceLang)
      ) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    return { consumed, source, normalized: tokensForm.join(" ") };
  }
  return null;
}

function matchActVerbPrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string; normalized: string } | null {
  const candidates = ACT_VERB_PREPOSITIONS[sourceLang] ?? [];
  const ordered = [...candidates].sort((a, b) => b.length - a.length);
  for (const tokensForm of ordered) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (normalizeToken(token.source, sourceLang) !== tokensForm[offset]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    return { consumed, source, normalized: tokensForm.join(" ") };
  }
  return null;
}

function matchAboutPrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string; normalized: string } | null {
  const candidates = ABOUT_PREPOSITIONS[sourceLang] ?? [];
  const ordered = [...candidates].sort((a, b) => b.length - a.length);
  for (const tokensForm of ordered) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (
        normalizeAboutToken(token.source, sourceLang) !==
        normalizeAboutToken(tokensForm[offset], sourceLang)
      ) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    return { consumed, source, normalized: tokensForm.join(" ") };
  }
  return null;
}

function matchInstrumentalPrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string; normalized: string } | null {
  const purpose = matchPurposePrepositionAt(tokens, index, sourceLang);
  if (purpose && purpose.consumed > 1) {
    return null;
  }
  const candidates = INSTRUMENTAL_PREPOSITIONS[sourceLang] ?? [];
  const ordered = [...candidates].sort((a, b) => b.length - a.length);
  for (const tokensForm of ordered) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (normalizeToken(token.source, sourceLang) !== tokensForm[offset]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    const normalized = tokensForm.join(" ");
    return { consumed, source, normalized };
  }
  return null;
}

export function isLocativePrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchLocativePrepositionAt(tokens, index, sourceLang) !== null;
}

export function isComitativePrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchComitativePrepositionAt(tokens, index, sourceLang) !== null;
}

export function isTraversivePrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchTraversivePrepositionAt(tokens, index, sourceLang) !== null;
}

export function isInstrumentalPrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchInstrumentalPrepositionAt(tokens, index, sourceLang) !== null;
}

export function isPurposePrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchPurposePrepositionAt(tokens, index, sourceLang) !== null;
}

export function isAboutPrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchAboutPrepositionAt(tokens, index, sourceLang) !== null;
}

function matchIndirectPrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string; normalized: string } | null {
  const purpose = matchPurposePrepositionAt(tokens, index, sourceLang);
  if (purpose && purpose.consumed > 1) return null;
  if (
    sourceLang === "es" &&
    normalizeToken(tokens[index]?.source ?? "", sourceLang) === "a" &&
    normalizeTraversiveToken(tokens[index + 1]?.source ?? "", sourceLang) ===
      "traves"
  ) {
    return null;
  }
  const candidates = INDIRECT_PREPOSITIONS[sourceLang] ?? [];
  for (const tokensForm of candidates) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (normalizeToken(token.source, sourceLang) !== tokensForm[offset]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    const normalized = tokensForm.join(" ");
    return { consumed, source, normalized };
  }
  return null;
}

export function isIndirectPrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchIndirectPrepositionAt(tokens, index, sourceLang) !== null;
}

function matchAllativePrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string; normalized: string } | null {
  const motionMarker = matchLocativeMarkerAt(tokens, index, sourceLang);
  if (motionMarker?.entry.locationRole === "motion") return null;
  if (
    sourceLang === "es" &&
    normalizeToken(tokens[index]?.source ?? "", sourceLang) === "a" &&
    normalizeTraversiveToken(tokens[index + 1]?.source ?? "", sourceLang) ===
      "traves"
  ) {
    return null;
  }
  const candidates = ALLATIVE_PREPOSITIONS[sourceLang] ?? [];
  for (const tokensForm of candidates) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (normalizeToken(token.source, sourceLang) !== tokensForm[offset]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    if (
      sourceLang === "es" &&
      tokensForm[0] === "a" &&
      isTimeUnitFollowing(tokens, index + consumed, sourceLang)
    ) {
      return null;
    }
    const normalized = tokensForm.join(" ");
    return { consumed, source, normalized };
  }
  return null;
}

export function isAllativePrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchAllativePrepositionAt(tokens, index, sourceLang) !== null;
}

function matchAblativePrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string } | null {
  const candidates = ABLATIVE_PREPOSITIONS[sourceLang] ?? [];
  for (const tokensForm of candidates) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (normalizeToken(token.source, sourceLang) !== tokensForm[offset]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    return { consumed, source };
  }
  return null;
}

export function isAblativePrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchAblativePrepositionAt(tokens, index, sourceLang) !== null;
}

function matchOriginPrepositionAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { consumed: number; source: string } | null {
  const candidates = ORIGIN_PREPOSITIONS[sourceLang] ?? [];
  for (const tokensForm of candidates) {
    let matched = true;
    for (let offset = 0; offset < tokensForm.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matched = false;
        break;
      }
      if (normalizeToken(token.source, sourceLang) !== tokensForm[offset]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;
    const consumed = tokensForm.length;
    const source = tokens
      .slice(index, index + consumed)
      .map((t) => t.source)
      .join(" ");
    return { consumed, source };
  }
  return null;
}

export function isOriginPrepositionStart(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  return matchOriginPrepositionAt(tokens, index, sourceLang) !== null;
}

function buildAdjectivePart(
  match: AdjectiveMatch,
  sourceLang: LanguageMode,
  suffix?: string
): TranslationPart {
  const base =
    sourceLang === "en" && match.gup === match.source
      ? stripEnglishPossessiveSuffix(match.gup) ?? match.gup
      : match.gup;
  if (match.participleVerb) {
    const verbBase =
      match.participleVerb.gupForms?.[3] ??
      match.participleVerb.gupForms?.[0] ??
      match.participleVerb.gup;
    const suffixes = getBelongingSuffixes(verbBase);
    const primarySuffix = suffixes[0] ?? "";
    const primaryBase = primarySuffix
      ? applySuffixToGup(verbBase, primarySuffix)
      : verbBase;
    const gup = suffix ? applySuffixToGup(primaryBase, suffix) : primaryBase;
    const explanations: ExplanationPayload[] = [
      { key: "PARTICIPLE_ADJECTIVE", data: { token: match.source, gup } },
    ];
    const alternatives: TranslationAlternative[] = [];
    for (const altSuffix of suffixes.slice(1)) {
      const altBase = applySuffixToGup(verbBase, altSuffix);
      const altGup = suffix ? applySuffixToGup(altBase, suffix) : altBase;
      alternatives.push({
        gup: altGup,
        notePayload: { key: "PARTICIPLE_ADJECTIVE_ALT" },
      });
    }
    if (match.rawAlternative) {
      const rawBase = match.rawAlternative.gup;
      const rawGup = suffix ? applySuffixToGup(rawBase, suffix) : rawBase;
      alternatives.push({
        gup: rawGup,
        notePayload: { key: "PARTICIPLE_ADJECTIVE_RAW_ALT" },
      });
    }
    return finalizePart(
      {
        type: "adjective",
        source: match.source,
        gup,
        output: gup,
        explanation: "",
        explanations,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
        meaningKey: match.entry?.meaningKey ?? match.rawAlternative?.meaningKey,
        appliedSuffix: suffix,
      },
      sourceLang
    );
  }
  const gup = suffix ? applySuffixToGup(base, suffix) : base;
  return finalizePart(
    {
      type: "adjective",
      source: match.source,
      gup,
      output: gup,
      explanation: "",
      explanations: [
        { key: "TOKEN_PASSTHROUGH", data: { token: match.source } },
      ],
      meaningKey: match.entry?.meaningKey,
      appliedSuffix: suffix,
    },
    sourceLang
  );
}

function buildNounPhrasePartsBase(
  phrase: NounPhraseMatch,
  sourceLang: LanguageMode,
  options?: { suffix?: string; nounNote?: ExplanationPayload }
): TranslationPart[] {
  const suffix = options?.suffix;
  const parts: TranslationPart[] = [];
  for (const adj of phrase.adjectives.pre) {
    parts.push(buildAdjectivePart(adj, sourceLang, suffix));
  }
  parts.push(
    buildNounPartWithSuffix(phrase.noun, sourceLang, suffix, options?.nounNote)
  );
  for (const adj of phrase.adjectives.post) {
    parts.push(buildAdjectivePart(adj, sourceLang, suffix));
  }
  return parts;
}

export function buildNounPhraseVariants(
  phrase: NounPhraseMatch,
  sourceLang: LanguageMode,
  options?: {
    suffix?: string;
    nounNote?: ExplanationPayload;
    splitRawAlternative?: boolean;
  }
): { sequences: TranslationPart[][]; hasRawAlternative: boolean } {
  const splitRaw = options?.splitRawAlternative && Boolean(phrase.noun.rawAlternative);
  const renderParts = (target: NounPhraseMatch): TranslationPart[] => {
    const parts = buildNounPhrasePartsBase(target, sourceLang, options);
    const instrument = target.participleInstrument;
    if (instrument?.pronounParts?.length) {
      return [...parts, ...instrument.pronounParts];
    }
    if (instrument) {
      const instrumentPart = buildParticipleInstrumentPart(instrument, sourceLang);
      if (instrumentPart) {
        return [...parts, instrumentPart];
      }
    }
    return parts;
  };

  if (!splitRaw || !phrase.noun.rawAlternative) {
    return { sequences: [renderParts(phrase)], hasRawAlternative: false };
  }

  const raw = phrase.noun.rawAlternative;
  const primaryPhrase: NounPhraseMatch = {
    ...phrase,
    noun: { ...phrase.noun, rawAlternative: undefined },
  };
  const rawPhrase: NounPhraseMatch = {
    ...phrase,
    noun: {
      ...phrase.noun,
      gup: raw.gup,
      entry: raw.entry ?? phrase.noun.entry,
      isHuman: raw.isHuman,
      isPlace: raw.isPlace,
      verbalVerbForms: undefined,
      agentVerbForms: undefined,
      rawAlternative: undefined,
    },
  };

  return {
    sequences: [renderParts(primaryPhrase), renderParts(rawPhrase)],
    hasRawAlternative: true,
  };
}

function buildParticipleInstrumentPart(
  instrument: NonNullable<NounPhraseMatch["participleInstrument"]>,
  sourceLang: LanguageMode
): TranslationPart | null {
  if (!instrument.phrase) return null;
  const phrase = instrument.phrase;
  const isBy =
    (sourceLang === "es" && instrument.preposition.normalized === "por") ||
    (sourceLang === "en" && instrument.preposition.normalized === "by");
  const isHuman = phrase.noun.isHuman === true;
  const isPlace = phrase.noun.isPlace === true;
  const ambiguousHuman =
    phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
  const base = phrase.noun.gup || phrase.noun.source;
  const nonHumanSuffixes = getBelongingSuffixes(base);
  const humanSuffixes = isBy
    ? getSourceOriginSuffixes(base)
    : getBelongingHumanSuffixes(base);
  const renderPhrase = (suffix?: string) =>
    buildNounPhrasePartsBase(phrase, sourceLang, { suffix })
      .map((part) => part.gup)
      .join(" ");

  let primaryPhrase = "";
  const alternatives: TranslationAlternative[] = [];
  const prepositionSource = instrument.preposition.source;
  const source = `${prepositionSource} ${phrase.noun.source}`.trim();

  if (isHuman && humanSuffixes.length > 0) {
    primaryPhrase = renderPhrase(humanSuffixes[0]);
    for (const alt of humanSuffixes.slice(1)) {
      alternatives.push({
        gup: renderPhrase(alt),
        notePayload: { key: "PARTICIPLE_INSTRUMENT_ALT_SUFFIX" },
      });
    }
    if (ambiguousHuman && nonHumanSuffixes.length > 0) {
      alternatives.push({
        gup: renderPhrase(nonHumanSuffixes[0]),
        notePayload: { key: "PARTICIPLE_INSTRUMENT_ALT_NONHUMAN" },
      });
    }
  } else {
    if (nonHumanSuffixes.length === 0) return null;
    primaryPhrase = renderPhrase(nonHumanSuffixes[0]);
    for (const alt of nonHumanSuffixes.slice(1)) {
      alternatives.push({
        gup: renderPhrase(alt),
        notePayload: { key: "PARTICIPLE_INSTRUMENT_ALT_SUFFIX" },
      });
    }
    if (ambiguousHuman && humanSuffixes.length > 0) {
      alternatives.push({
        gup: renderPhrase(humanSuffixes[0]),
        notePayload: { key: "PARTICIPLE_INSTRUMENT_ALT_HUMAN" },
      });
    }
  }

  return finalizePart(
    {
      type: "noun",
      source,
      gup: primaryPhrase,
      output: primaryPhrase,
      explanation: "",
      explanations: [
        {
          key: "PARTICIPLE_INSTRUMENT",
          data: { token: source, gup: primaryPhrase },
        },
      ],
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
}

const isOfConnectorToken = (token: TokenLike | undefined, sourceLang: LanguageMode) => {
  if (!token) return false;
  const normalized = normalizeToken(token.source, sourceLang);
  return (
    (sourceLang === "es" && normalized === "de") ||
    (sourceLang === "en" && normalized === "of")
  );
};

const buildComitativeSuffixPart = (
  base: string,
  source: string,
  sourceLang: LanguageMode
): TranslationPart[] => {
  const suffixes = getComitativeSuffixes(base);
  const primary = applySuffixToGup(base, suffixes[0]);
  const alternatives = suffixes.slice(1).map((suffix) => ({
    gup: applySuffixToGup(base, suffix),
    notePayload: {
      key: "COMITATIVE_SUFFIX" as ExplanationKey,
      data: { token: source, gup: suffix },
    },
  }));
  return [
    finalizePart(
      {
        type: "noun",
        source,
        gup: primary,
        output: primary,
        explanation: "",
        explanations: [
          { key: "COMITATIVE_SUFFIX", data: { token: source, gup: suffixes[0] } },
        ],
        alternatives: alternatives.length > 0 ? alternatives : undefined,
      },
      sourceLang
    ),
  ];
};

const collectPossessivePersons = (match: {
  person: PersonNumber;
  altPersons?: PersonNumber[];
}): PersonNumber[] => {
  const persons = new Set<PersonNumber>();
  persons.add(match.person);
  match.altPersons?.forEach((person) => persons.add(person));
  for (const person of Array.from(persons)) {
    if (person === "1+2_Plur") persons.add("1+3_Plur");
    if (person === "1+2_Dual") persons.add("1+3_Dual");
  }
  return Array.from(persons);
};

const buildComitativePossessivePronounPart = (
  match: PossessivePersonMatch,
  sourceLang: LanguageMode
): TranslationPart | null => {
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
  return finalizePart(
    {
      type: "pronoun",
      source: match.source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations: [
        {
          key: "POSSESSION_COMITATIVE_PRONOUN",
          data: { token: match.source, gup: primary },
        },
      ],
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
};

const buildComitativePossessiveHumanPronounPart = (
  match: PossessivePersonMatch,
  sourceLang: LanguageMode
): TranslationPart | null => {
  const persons = collectPossessivePersons(match);
  const primaryForms = getComitativePronounForms(match.person);
  if (primaryForms.length === 0) return null;
  const primary = `${primaryForms[0]}ŋuwala`;
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  for (const person of persons) {
    const noteKey = getComitativePronounNoteKey(person);
    const forms = getComitativePronounForms(person);
    for (const form of forms) {
      if (person === match.person && form === primaryForms[0]) continue;
      const gup = `${form}ŋuwala`;
      const key = `${gup}:${noteKey ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      alternatives.push({
        gup,
        notePayload: noteKey ? { key: noteKey } : undefined,
      });
    }
  }
  return finalizePart(
    {
      type: "pronoun",
      source: match.source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations: [
        {
          key: "POSSESSION_COMITATIVE_HUMAN_PRONOUN",
          data: { token: match.source, gup: primary },
        },
      ],
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
};

const buildEmphaticAllativePossessivePronounPart = (
  match: PossessivePersonMatch,
  sourceLang: LanguageMode,
  sourceOverride?: string
): TranslationPart | null => {
  const persons = collectPossessivePersons(match);
  const source = sourceOverride ?? match.source;
  const primaryForms = getComitativePronounEmphaticForms(match.person);
  if (primaryForms.length === 0) return null;
  const primary = primaryForms[0];
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  for (const person of persons) {
    const noteKey = getComitativePronounNoteKey(person);
    const forms = getComitativePronounEmphaticForms(person);
    for (const form of forms) {
      if (person === match.person && form === primary) continue;
      const key = `${form}:${noteKey ?? ""}:emph`;
      if (seen.has(key)) continue;
      seen.add(key);
      alternatives.push({
        gup: form,
        notePayload: noteKey ? { key: noteKey } : undefined,
      });
    }
    const baseForms = getComitativePronounForms(person);
    for (const form of baseForms) {
      const key = `${form}:non-emph`;
      if (seen.has(key)) continue;
      seen.add(key);
      alternatives.push({
        gup: form,
        notePayload: { key: "PRONOUN_NOTE_NON_EMPHATIC" },
      });
    }
  }
  const explanations: ExplanationPayload[] = [
    {
      key: "POSSESSION_COMITATIVE_HUMAN_PRONOUN",
      data: { token: source, gup: primary },
    },
    { key: "PRONOUN_NOTE_EMPHATIC" },
    {
      key: "POSSESSION_PRONOUN_EMPHATIC",
      data: { token: source, gup: primary, person: match.person },
    },
  ];
  const noteKey = getComitativePronounNoteKey(match.person);
  if (noteKey) explanations.push({ key: noteKey });
  return finalizePart(
    {
      type: "pronoun",
      source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
};

const matchEmphaticHumanPossessorAt = (
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { part: TranslationPart; consumed: number } | null => {
  const determiner = matchPossessiveDeterminer(tokens[index]?.source ?? "", sourceLang);
  if (!determiner) return null;
  const emphasis = matchPossessiveEmphasisAt(tokens, index, sourceLang);
  if (!emphasis) return null;
  const part = buildEmphaticAllativePossessivePronounPart(
    determiner,
    sourceLang,
    emphasis.source
  );
  if (!part) return null;
  return { part, consumed: 1 + emphasis.consumed };
};

export const buildOriginPossessivePronounPart = (
  match: PossessivePersonMatch,
  sourceLang: LanguageMode,
  options?: {
    emphatic?: boolean;
    sourceOverride?: string;
  }
): TranslationPart | null => {
  const hasEmphasis = options?.emphatic === true;
  const source = options?.sourceOverride ?? match.source;
  const forms = hasEmphasis
    ? SOURCE_ORIGIN_PRONOUNS_GUP_EMPHATIC[match.person]
    : SOURCE_ORIGIN_PRONOUNS_GUP[match.person];
  const altForms = hasEmphasis
    ? SOURCE_ORIGIN_PRONOUNS_GUP[match.person]
    : SOURCE_ORIGIN_PRONOUNS_GUP_EMPHATIC[match.person];
  if (!forms || forms.length === 0) return null;
  const primary = forms[0];
  const noteKey = getComitativePronounNoteKey(match.person);
  const explanations: ExplanationPayload[] = [
    {
      key: "ORIGIN_POSSESSION_HUMAN_SUFFIX",
      data: { token: source, gup: primary },
    },
  ];
  if (hasEmphasis) explanations.push({ key: "PRONOUN_NOTE_EMPHATIC" });
  if (noteKey) explanations.push({ key: noteKey });
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  const pushAlt = (gup: string, note?: ExplanationKey) => {
    const key = `${gup}:${note ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    alternatives.push({ gup, notePayload: note ? { key: note } : undefined });
  };
  const baseAltNote = hasEmphasis ? "PRONOUN_NOTE_EMPHATIC" : noteKey;
  forms.slice(1).forEach((gup) => pushAlt(gup, baseAltNote));
  const altNote: ExplanationKey = hasEmphasis
    ? "PRONOUN_NOTE_NON_EMPHATIC"
    : "PRONOUN_NOTE_EMPHATIC";
  (altForms ?? []).forEach((gup) => pushAlt(gup, altNote));
  return finalizePart(
    {
      type: "pronoun",
      source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
};

export const buildOriginSuffixPart = (
  base: string,
  source: string,
  sourceLang: LanguageMode
): TranslationPart => {
  const suffixes = getSourceOriginSuffixes(base);
  const primary = applySuffixToGup(base, suffixes[0]);
  const alternatives: TranslationAlternative[] = suffixes.slice(1).map((suffix) => {
    const gup = applySuffixToGup(base, suffix);
    return {
      gup,
      notePayload: { key: "ORIGIN_SUFFIX", data: { token: source, gup } },
    };
  });
  return finalizePart(
    {
      type: "noun",
      source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations: [
        { key: "ORIGIN_SUFFIX", data: { token: source, gup: primary } },
      ],
      alternatives,
    },
    sourceLang
  );
};

const buildBelongingPossessivePronounPart = (
  match: PossessivePersonMatch,
  sourceLang: LanguageMode,
  options?: {
    emphatic?: boolean;
    sourceOverride?: string;
  }
): TranslationPart | null => {
  const hasEmphasis = options?.emphatic === true;
  const source = options?.sourceOverride ?? match.source;
  const forms = hasEmphasis
    ? BELONGING_PRONOUNS_EMPHATIC_GUP[match.person]
    : BELONGING_PRONOUNS_GUP[match.person];
  const altForms = hasEmphasis
    ? BELONGING_PRONOUNS_GUP[match.person]
    : BELONGING_PRONOUNS_EMPHATIC_GUP[match.person];
  if (!forms || forms.length === 0) return null;
  const primary = forms[0];
  const noteKey = getComitativePronounNoteKey(match.person);
  const explanations: ExplanationPayload[] = [
    {
      key: "BELONGING_POSSESSION_HUMAN_PRONOUN",
      data: { token: source, gup: primary },
    },
  ];
  if (hasEmphasis) explanations.push({ key: "PRONOUN_NOTE_EMPHATIC" });
  if (noteKey) explanations.push({ key: noteKey });
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  const pushAlt = (gup: string, note?: ExplanationKey) => {
    const key = `${gup}:${note ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    alternatives.push({ gup, notePayload: note ? { key: note } : undefined });
  };
  const baseAltNote = hasEmphasis ? "PRONOUN_NOTE_EMPHATIC" : noteKey;
  forms.slice(1).forEach((gup) => pushAlt(gup, baseAltNote));
  const altNote: ExplanationKey = hasEmphasis
    ? "PRONOUN_NOTE_NON_EMPHATIC"
    : "PRONOUN_NOTE_EMPHATIC";
  (altForms ?? []).forEach((gup) => pushAlt(gup, altNote));
  return finalizePart(
    {
      type: "pronoun",
      source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
};

const buildAblativePossessivePronounPart = (
  match: PossessivePersonMatch,
  sourceLang: LanguageMode,
  options?: {
    emphatic?: boolean;
    sourceOverride?: string;
  }
): TranslationPart | null => {
  const hasEmphasis = options?.emphatic === true;
  const source = options?.sourceOverride ?? match.source;
  const forms = hasEmphasis
    ? ABLATIVE_POSSESSIVE_PRONOUNS_EMPHATIC_GUP[match.person]
    : ABLATIVE_POSSESSIVE_PRONOUNS_GUP[match.person];
  const altForms = hasEmphasis
    ? ABLATIVE_POSSESSIVE_PRONOUNS_GUP[match.person]
    : ABLATIVE_POSSESSIVE_PRONOUNS_EMPHATIC_GUP[match.person];
  if (!forms || forms.length === 0) return null;
  const primary = forms[0];
  const noteKey = getComitativePronounNoteKey(match.person);
  const explanations: ExplanationPayload[] = [
    {
      key: "ABLATIVE_POSSESSION_HUMAN_PRONOUN",
      data: { token: source, gup: primary },
    },
  ];
  if (hasEmphasis) explanations.push({ key: "PRONOUN_NOTE_EMPHATIC" });
  if (noteKey) explanations.push({ key: noteKey });
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  const pushAlt = (gup: string, note?: ExplanationKey) => {
    const key = `${gup}:${note ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    alternatives.push({ gup, notePayload: note ? { key: note } : undefined });
  };
  const baseAltNote = hasEmphasis ? "PRONOUN_NOTE_EMPHATIC" : noteKey;
  forms.slice(1).forEach((gup) => pushAlt(gup, baseAltNote));
  const altNote: ExplanationKey = hasEmphasis
    ? "PRONOUN_NOTE_NON_EMPHATIC"
    : "PRONOUN_NOTE_EMPHATIC";
  (altForms ?? []).forEach((gup) => pushAlt(gup, altNote));
  return finalizePart(
    {
      type: "pronoun",
      source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
};

const buildTraversivePossessivePronounPart = (
  match: PossessivePersonMatch,
  sourceLang: LanguageMode,
  options?: {
    emphatic?: boolean;
    sourceOverride?: string;
  }
): TranslationPart | null => {
  const hasEmphasis = options?.emphatic === true;
  const source = options?.sourceOverride ?? match.source;
  const baseForms = hasEmphasis
    ? TRAVERSE_POSSESSIVE_PRONOUNS_EMPHATIC_GUP[match.person]
    : ABLATIVE_POSSESSIVE_PRONOUNS_GUP[match.person];
  const altBaseForms = hasEmphasis
    ? ABLATIVE_POSSESSIVE_PRONOUNS_GUP[match.person]
    : TRAVERSE_POSSESSIVE_PRONOUNS_EMPHATIC_GUP[match.person];
  if (!baseForms || baseForms.length === 0) return null;
  const toWurru = (form: string): string => {
    if (form.endsWith("ŋuwurru")) return form;
    if (form.endsWith("ŋuŋuru")) return form.replace(/ŋuŋuru$/, "ŋuwurru");
    return `${form}wurru`;
  };
  const forms = baseForms.map(toWurru);
  const altForms = (altBaseForms ?? []).map(toWurru);
  const primary = forms[0];
  const noteKey = getComitativePronounNoteKey(match.person);
  const explanations: ExplanationPayload[] = [
    {
      key: "TRAVERSE_POSSESSION_HUMAN_PRONOUN",
      data: { token: source, gup: primary },
    },
  ];
  if (hasEmphasis) explanations.push({ key: "PRONOUN_NOTE_EMPHATIC" });
  if (noteKey) explanations.push({ key: noteKey });
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  const pushAlt = (gup: string, note?: ExplanationKey) => {
    const key = `${gup}:${note ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    alternatives.push({ gup, notePayload: note ? { key: note } : undefined });
  };
  const baseAltNote = hasEmphasis ? "PRONOUN_NOTE_EMPHATIC" : noteKey;
  forms.slice(1).forEach((gup) => pushAlt(gup, baseAltNote));
  const altNote: ExplanationKey = hasEmphasis
    ? "PRONOUN_NOTE_NON_EMPHATIC"
    : "PRONOUN_NOTE_EMPHATIC";
  (altForms ?? []).forEach((gup) => pushAlt(gup, altNote));
  return finalizePart(
    {
      type: "pronoun",
      source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
};

const buildTraversivePronounPart = (
  match: TraversivePronounMatch,
  sourceLang: LanguageMode
): TranslationPart | null => {
  const hasEmphasis = Boolean(match.emphasis);
  const baseForms = hasEmphasis
    ? ABLATIVE_POSSESSIVE_PRONOUNS_EMPHATIC_GUP[match.person]
    : ORIGIN_POSSESSIVE_PRONOUNS_GUP[match.person];
  const altBaseForms = hasEmphasis
    ? ORIGIN_POSSESSIVE_PRONOUNS_GUP[match.person]
    : ABLATIVE_POSSESSIVE_PRONOUNS_EMPHATIC_GUP[match.person];
  if (!baseForms || baseForms.length === 0) return null;
  const forms = baseForms.map((form) =>
    form.endsWith("ŋuwuŋu") ? form.replace(/ŋuwuŋu$/, "ŋuwurru") : `${form}wurru`
  );
  const altForms = (altBaseForms ?? []).map((form) =>
    form.endsWith("ŋuwuŋu") ? form.replace(/ŋuwuŋu$/, "ŋuwurru") : `${form}wurru`
  );
  const primary = forms[0];
  const noteKey = getComitativePronounNoteKey(match.person);
  const explanations: ExplanationPayload[] = [
    {
      key: "TRAVERSE_HUMAN_PRONOUN",
      data: { token: match.source, gup: primary },
    },
  ];
  if (hasEmphasis) explanations.push({ key: "PRONOUN_NOTE_EMPHATIC" });
  if (noteKey) explanations.push({ key: noteKey });
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  const pushAlt = (gup: string, note?: ExplanationKey) => {
    const key = `${gup}:${note ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    alternatives.push({ gup, notePayload: note ? { key: note } : undefined });
  };
  const baseAltNote = hasEmphasis ? "PRONOUN_NOTE_EMPHATIC" : noteKey;
  forms.slice(1).forEach((gup) => pushAlt(gup, baseAltNote));
  const altNote: ExplanationKey = hasEmphasis
    ? "PRONOUN_NOTE_NON_EMPHATIC"
    : "PRONOUN_NOTE_EMPHATIC";
  (altForms ?? []).forEach((gup) => pushAlt(gup, altNote));
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
};

const matchPossessorAfterOf = (
  tokens: TokenLike[],
  startIndex: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): PossessorAfterOfMatch | null => {
  const possessorToken = tokens[startIndex];
  if (!possessorToken) return null;
  const demoMatch = matchDemonstrativeToken(
    possessorToken.source,
    sourceLang
  );
  if (demoMatch || isNonHumanDemoPronoun(possessorToken.source, sourceLang)) {
    const part = buildDefiniteArticlePart(
      "dhiyakuŋu",
      possessorToken.source,
      sourceLang
    );
    return {
      sequences: [[part]],
      consumed: 1,
      hasAlternatives: false,
      altHasAlternatives: false,
    };
  }

  const emphasis = matchPossessiveEmphasisAt(tokens, startIndex, sourceLang);
  let pronounMatch = matchPossessiveOfPronoun(
    possessorToken.source,
    sourceLang
  );
  if (!pronounMatch && emphasis) {
    pronounMatch = matchPossessiveDeterminer(
      possessorToken.source,
      sourceLang
    );
  }
  if (pronounMatch) {
    const isReflexive =
      Boolean(emphasis) && isReflexivePossessive(pronounMatch, options?.reflexivePersons);
    const possPart = buildPossessivePronounPart(pronounMatch, sourceLang);
    const emphaticPossPart = buildPossessivePronounPart(pronounMatch, sourceLang, {
      emphatic: Boolean(emphasis),
      sourceOverride: emphasis?.source,
      includeNonEmphatic: Boolean(emphasis) && !isReflexive,
    });
    const resolvedPossPart = emphasis ? emphaticPossPart : possPart;
    if (!resolvedPossPart) return null;
    const comPart = buildComitativePronounPart({
      source: possessorToken.source,
      person: pronounMatch.person,
      consumed: 1 + (emphasis?.consumed ?? 0),
    });
    const renderedCom = comPart ? finalizePart(comPart, sourceLang) : null;
    const humanComPart = buildComitativePossessiveHumanPronounPart(
      pronounMatch,
      sourceLang
    );
    const emphaticAllativePart =
      emphasis && emphasis.source
        ? buildEmphaticAllativePossessivePronounPart(
            pronounMatch,
            sourceLang,
            emphasis.source
          )
        : null;
    const originPart = buildOriginPossessivePronounPart(
      pronounMatch,
      sourceLang,
      {
        emphatic: Boolean(emphasis),
        sourceOverride: emphasis?.source,
      }
    );
    const belongingPart = buildBelongingPossessivePronounPart(
      pronounMatch,
      sourceLang,
      {
        emphatic: Boolean(emphasis),
        sourceOverride: emphasis?.source,
      }
    );
    const ablativePart = buildAblativePossessivePronounPart(
      pronounMatch,
      sourceLang,
      {
        emphatic: Boolean(emphasis),
        sourceOverride: emphasis?.source,
      }
    );
    const traversivePart = buildTraversivePossessivePronounPart(
      pronounMatch,
      sourceLang,
      {
        emphatic: Boolean(emphasis),
        sourceOverride: emphasis?.source,
      }
    );
    const humanPossessiveSequences: TranslationPart[][] = [];
    if (emphaticAllativePart) {
      humanPossessiveSequences.push([emphaticAllativePart]);
    }
    if (humanComPart) {
      humanPossessiveSequences.push([humanComPart]);
    }
    const built = buildReflexivePossessiveSequences(
      resolvedPossPart,
      sourceLang,
      isReflexive ? options?.reflexivePersons : undefined,
      isReflexive && options?.reflexiveSubjectRepeat
    );
    return {
      sequences: built.sequences,
      altSequences: renderedCom ? [[renderedCom]] : undefined,
      consumed: 1 + (emphasis?.consumed ?? 0),
      hasAlternatives: built.hasAmbiguity,
      altHasAlternatives: Boolean(renderedCom?.alternatives?.length),
      humanPossessiveSequences:
        humanPossessiveSequences.length > 0 ? humanPossessiveSequences : undefined,
      humanPossessiveHasAlternatives: Boolean(
        (humanComPart?.alternatives?.length ?? 0) > 0 || emphaticAllativePart
      ),
      humanPossessiveIsAmbiguous: pronounMatch.nonHuman !== true,
      belongingHumanPossessiveSequences: belongingPart
        ? [[belongingPart]]
        : undefined,
      belongingHumanPossessiveHasAlternatives: Boolean(
        belongingPart?.alternatives?.length
      ),
      belongingHumanPossessiveIsAmbiguous: pronounMatch.nonHuman !== true,
      ablativeHumanPossessiveSequences: ablativePart
        ? [[ablativePart]]
        : undefined,
      ablativeHumanPossessiveHasAlternatives: Boolean(
        ablativePart?.alternatives?.length
      ),
      ablativeHumanPossessiveIsAmbiguous: pronounMatch.nonHuman !== true,
      traversiveHumanPossessiveSequences: traversivePart
        ? [[traversivePart]]
        : undefined,
      traversiveHumanPossessiveHasAlternatives: Boolean(
        traversivePart?.alternatives?.length
      ),
      traversiveHumanPossessiveIsAmbiguous: pronounMatch.nonHuman !== true,
      originHumanPossessiveSequences: originPart ? [[originPart]] : undefined,
      originHumanPossessiveHasAlternatives: Boolean(originPart?.alternatives?.length),
      originHumanPossessiveIsAmbiguous: pronounMatch.nonHuman !== true,
    };
  }

  let cursor = startIndex;
  let possessorPrefixParts: TranslationPart[] = [];
  const possessorDeterminer = matchDhiyakuDeterminerAt(
    tokens,
    cursor,
    sourceLang
  );
  if (possessorDeterminer) {
    if (possessorDeterminer.part) {
      possessorPrefixParts = [possessorDeterminer.part];
    }
    cursor += possessorDeterminer.consumed;
  }
  const possessorPhrase = matchNounPhraseAfterArticle(
    tokens,
    cursor,
    sourceLang
  );
  if (possessorPhrase) {
    const base = possessorPhrase.noun.gup || possessorPhrase.noun.source;
    const suffixes = getPossessiveSuffixes(base);
    const humanPossessiveSuffixes = getComitativePossessiveHumanSuffixes(base);
    const belongingHumanSuffixes = getBelongingHumanSuffixes(base);
    const ablativeHumanSuffixes = getAblativePossessiveHumanSuffixes(base);
    const traversiveHumanSuffixes = getTraversivePossessiveHumanSuffixes(base);
    const withSuffix = suffixes.map((suffix) => {
      const gup = applyPossessiveSuffix(base, suffix);
      const parts = buildNounPhraseParts(possessorPhrase, sourceLang, {
        suffix,
        nounNote: {
          key: "POSSESSION_SUFFIX",
          data: { token: possessorPhrase.noun.source, gup, suffix },
        },
      });
      return possessorPrefixParts.length > 0
        ? [...possessorPrefixParts, ...parts]
        : parts;
    });
    const humanPossessiveSequences = humanPossessiveSuffixes.map((suffix) =>
      buildNounPhraseParts(possessorPhrase, sourceLang, {
        suffix,
        nounNote: {
          key: "POSSESSION_COMITATIVE_HUMAN_SUFFIX",
          data: { token: possessorPhrase.noun.source, gup: suffix },
        },
      })
    );
    const belongingHumanSequences = belongingHumanSuffixes.map((suffix) =>
      buildNounPhraseParts(possessorPhrase, sourceLang, {
        suffix,
        nounNote: {
          key: "BELONGING_POSSESSION_HUMAN_SUFFIX",
          data: { token: possessorPhrase.noun.source, gup: suffix },
        },
      })
    );
    const ablativeHumanSequences = ablativeHumanSuffixes.map((suffix) =>
      buildNounPhraseParts(possessorPhrase, sourceLang, {
        suffix,
        nounNote: {
          key: "ABLATIVE_POSSESSION_HUMAN_SUFFIX",
          data: { token: possessorPhrase.noun.source, gup: suffix },
        },
      })
    );
    const traversiveHumanSequences = traversiveHumanSuffixes.map((suffix) =>
      buildNounPhraseParts(possessorPhrase, sourceLang, {
        suffix,
        nounNote: {
          key: "TRAVERSE_POSSESSION_HUMAN_SUFFIX",
          data: { token: possessorPhrase.noun.source, gup: suffix },
        },
      })
    );
    const withoutSuffix = buildNounPhraseParts(possessorPhrase, sourceLang);
    const isHuman = possessorPhrase.noun.isHuman === true;
    const isNonHuman = possessorPhrase.noun.isHuman === false;
    const sequences = isHuman
      ? withSuffix
      : isNonHuman
        ? [withoutSuffix]
        : [withoutSuffix, ...withSuffix];
    let altSequences: TranslationPart[][] | undefined;
    let altHasAlternatives = false;
    if (!isNonHuman) {
      const comSuffixes = getComitativeSuffixes(base);
      altSequences = comSuffixes.map((suffix) =>
        buildNounPhraseParts(possessorPhrase, sourceLang, {
          suffix,
          nounNote: {
            key: "COMITATIVE_SUFFIX",
            data: { token: possessorPhrase.noun.source, gup: suffix },
          },
        })
      );
      altHasAlternatives = comSuffixes.length > 1;
    }
    return {
      sequences,
      altSequences,
      consumed: cursor - startIndex + possessorPhrase.consumed,
      hasAlternatives: isHuman ? suffixes.length > 1 : !isNonHuman,
      altHasAlternatives,
      humanPossessiveSequences:
        isNonHuman ? undefined : humanPossessiveSequences,
      humanPossessiveHasAlternatives:
        isNonHuman ? undefined : humanPossessiveSuffixes.length > 1,
      humanPossessiveIsAmbiguous: !isHuman && !isNonHuman,
      belongingHumanPossessiveSequences:
        isNonHuman ? undefined : belongingHumanSequences,
      belongingHumanPossessiveHasAlternatives:
        isNonHuman ? undefined : belongingHumanSuffixes.length > 1,
      belongingHumanPossessiveIsAmbiguous: !isHuman && !isNonHuman,
      ablativeHumanPossessiveSequences:
        isNonHuman ? undefined : ablativeHumanSequences,
      ablativeHumanPossessiveHasAlternatives:
        isNonHuman ? undefined : ablativeHumanSuffixes.length > 1,
      ablativeHumanPossessiveIsAmbiguous: !isHuman && !isNonHuman,
      traversiveHumanPossessiveSequences:
        isNonHuman ? undefined : traversiveHumanSequences,
      traversiveHumanPossessiveHasAlternatives:
        isNonHuman ? undefined : traversiveHumanSuffixes.length > 1,
      traversiveHumanPossessiveIsAmbiguous: !isHuman && !isNonHuman,
      originHumanPossessiveSequences:
        isNonHuman
          ? undefined
          : getOriginPossessiveHumanSuffixes(base).map((suffix) =>
              buildNounPhraseParts(possessorPhrase, sourceLang, {
                suffix,
                nounNote: {
                  key: "ORIGIN_POSSESSION_HUMAN_SUFFIX",
                  data: { token: possessorPhrase.noun.source, gup: suffix },
                },
              })
            ),
      originHumanPossessiveHasAlternatives:
        isNonHuman
          ? undefined
          : getOriginPossessiveHumanSuffixes(base).length > 1,
      originHumanPossessiveIsAmbiguous: !isHuman && !isNonHuman,
    };
  }

  if (isStrongPunctuationToken(possessorToken)) return null;
  const suffixPart = buildPossessiveSuffixPart(
    possessorToken.source,
    possessorToken.source,
    sourceLang
  );
  const barePart = finalizePart(
    {
      type: "noun",
      source: possessorToken.source,
      gup: possessorToken.source,
      output: possessorToken.source,
      explanation: "",
      explanations: [
        { key: "TOKEN_PASSTHROUGH", data: { token: possessorToken.source } },
      ],
    },
    sourceLang
  );
  return {
    sequences: [[suffixPart], [barePart]],
    altSequences: [
      buildComitativeSuffixPart(
        possessorToken.source,
        possessorToken.source,
        sourceLang
      ),
    ],
    consumed: 1,
    hasAlternatives: true,
    altHasAlternatives: false,
    humanPossessiveSequences: (() => {
      const suffixes = getComitativePossessiveHumanSuffixes(
        possessorToken.source
      );
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
      return suffixes.map((suffix) =>
        buildNounPhraseParts(fallbackPhrase, sourceLang, {
          suffix,
          nounNote: {
            key: "POSSESSION_COMITATIVE_HUMAN_SUFFIX",
            data: { token: possessorToken.source, gup: suffix },
          },
        })
      );
    })(),
    humanPossessiveHasAlternatives:
      getComitativePossessiveHumanSuffixes(possessorToken.source).length > 1,
    humanPossessiveIsAmbiguous: true,
    belongingHumanPossessiveSequences: (() => {
      const suffixes = getBelongingHumanSuffixes(possessorToken.source);
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
      return suffixes.map((suffix) =>
        buildNounPhraseParts(fallbackPhrase, sourceLang, {
          suffix,
          nounNote: {
            key: "BELONGING_POSSESSION_HUMAN_SUFFIX",
            data: { token: possessorToken.source, gup: suffix },
          },
        })
      );
    })(),
    belongingHumanPossessiveHasAlternatives:
      getBelongingHumanSuffixes(possessorToken.source).length > 1,
    belongingHumanPossessiveIsAmbiguous: true,
    ablativeHumanPossessiveSequences: (() => {
      const suffixes = getAblativePossessiveHumanSuffixes(possessorToken.source);
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
      return suffixes.map((suffix) =>
        buildNounPhraseParts(fallbackPhrase, sourceLang, {
          suffix,
          nounNote: {
            key: "ABLATIVE_POSSESSION_HUMAN_SUFFIX",
            data: { token: possessorToken.source, gup: suffix },
          },
        })
      );
    })(),
    ablativeHumanPossessiveHasAlternatives:
      getAblativePossessiveHumanSuffixes(possessorToken.source).length > 1,
    ablativeHumanPossessiveIsAmbiguous: true,
    originHumanPossessiveSequences: (() => {
      const suffixes = getOriginPossessiveHumanSuffixes(possessorToken.source);
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
      return suffixes.map((suffix) =>
        buildNounPhraseParts(fallbackPhrase, sourceLang, {
          suffix,
          nounNote: {
            key: "ORIGIN_POSSESSION_HUMAN_SUFFIX",
            data: { token: possessorToken.source, gup: suffix },
          },
        })
      );
    })(),
    originHumanPossessiveHasAlternatives:
      getOriginPossessiveHumanSuffixes(possessorToken.source).length > 1,
    originHumanPossessiveIsAmbiguous: true,
    traversiveHumanPossessiveSequences: (() => {
      const suffixes = getTraversivePossessiveHumanSuffixes(
        possessorToken.source
      );
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
      return suffixes.map((suffix) =>
        buildNounPhraseParts(fallbackPhrase, sourceLang, {
          suffix,
          nounNote: {
            key: "TRAVERSE_POSSESSION_HUMAN_SUFFIX",
            data: { token: possessorToken.source, gup: suffix },
          },
        })
      );
    })(),
    traversiveHumanPossessiveHasAlternatives:
      getTraversivePossessiveHumanSuffixes(possessorToken.source).length > 1,
    traversiveHumanPossessiveIsAmbiguous: true,
  };
};

const matchPossessorBeforeNoun = (
  tokens: TokenLike[],
  startIndex: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): PossessorAfterOfMatch | null => {
  const token = tokens[startIndex];
  if (!token) return null;

  const determiner = matchPossessiveDeterminer(token.source, sourceLang);
  if (determiner) {
    const emphasis = matchPossessiveEmphasisAt(tokens, startIndex, sourceLang);
    const isReflexive =
      Boolean(emphasis) && isReflexivePossessive(determiner, options?.reflexivePersons);
    const possPart = buildPossessivePronounPart(determiner, sourceLang, {
      emphatic: Boolean(emphasis),
      sourceOverride: emphasis?.source,
      includeNonEmphatic: Boolean(emphasis) && !isReflexive,
    });
    if (!possPart) return null;
    const built = buildReflexivePossessiveSequences(
      possPart,
      sourceLang,
      isReflexive ? options?.reflexivePersons : undefined,
      isReflexive && options?.reflexiveSubjectRepeat
    );
    const sequences = built.sequences;
    const normalized = normalizeToken(token.source, sourceLang);
    const isNonHuman =
      sourceLang === "en" && normalized === "its";
    const comPart = buildComitativePronounPart({
      source: token.source,
      person: determiner.person,
      consumed: 1,
    });
    const renderedCom = comPart ? finalizePart(comPart, sourceLang) : null;
    const ablativePart = buildAblativePossessivePronounPart(
      determiner,
      sourceLang,
      {
        emphatic: Boolean(emphasis),
        sourceOverride: emphasis?.source,
      }
    );
    const traversivePart = buildTraversivePossessivePronounPart(
      determiner,
      sourceLang,
      {
        emphatic: Boolean(emphasis),
        sourceOverride: emphasis?.source,
      }
    );
    return {
      sequences,
      altSequences: !isNonHuman && renderedCom ? [[renderedCom]] : undefined,
      consumed: 1 + (emphasis?.consumed ?? 0),
      hasAlternatives: built.hasAmbiguity,
      altHasAlternatives: !isNonHuman && Boolean(renderedCom?.alternatives?.length),
      ablativeHumanPossessiveSequences: ablativePart ? [[ablativePart]] : undefined,
      ablativeHumanPossessiveHasAlternatives: Boolean(
        ablativePart?.alternatives?.length
      ),
      ablativeHumanPossessiveIsAmbiguous: determiner.nonHuman !== true,
      traversiveHumanPossessiveSequences: traversivePart
        ? [[traversivePart]]
        : undefined,
      traversiveHumanPossessiveHasAlternatives: Boolean(
        traversivePart?.alternatives?.length
      ),
      traversiveHumanPossessiveIsAmbiguous: determiner.nonHuman !== true,
    };
  }

  if (sourceLang === "en") {
    const base = stripEnglishPossessiveSuffix(token.source);
    if (base) {
      const possPart = buildPossessiveSuffixPart(base, token.source, sourceLang);
      const barePart = finalizePart(
        {
          type: "noun",
          source: base,
          gup: base,
          output: base,
          explanation: "",
          explanations: [{ key: "TOKEN_PASSTHROUGH", data: { token: base } }],
        },
        sourceLang
      );
      return {
        sequences: [[possPart], [barePart]],
        altSequences: [buildComitativeSuffixPart(base, token.source, sourceLang)],
        consumed: 1,
        hasAlternatives: true,
        altHasAlternatives: false,
    humanPossessiveSequences: getComitativePossessiveHumanSuffixes(base).map(
      (suffix) =>
        buildNounPhraseParts(
          {
            adjectives: { pre: [], post: [] },
            noun: {
              gup: base,
              source: base,
              isHuman: undefined,
              consumed: 1,
            },
            consumed: 1,
          },
          sourceLang,
          {
            suffix,
            nounNote: {
              key: "POSSESSION_COMITATIVE_HUMAN_SUFFIX",
              data: { token: token.source, gup: suffix },
            },
          }
        )
    ),
    humanPossessiveHasAlternatives:
      getComitativePossessiveHumanSuffixes(base).length > 1,
    humanPossessiveIsAmbiguous: true,
    belongingHumanPossessiveSequences: getBelongingHumanSuffixes(base).map(
      (suffix) =>
        buildNounPhraseParts(
          {
            adjectives: { pre: [], post: [] },
            noun: {
              gup: base,
              source: base,
              isHuman: undefined,
              consumed: 1,
            },
            consumed: 1,
          },
          sourceLang,
          {
            suffix,
            nounNote: {
              key: "BELONGING_POSSESSION_HUMAN_SUFFIX",
              data: { token: token.source, gup: suffix },
            },
          }
        )
    ),
    belongingHumanPossessiveHasAlternatives:
      getBelongingHumanSuffixes(base).length > 1,
    belongingHumanPossessiveIsAmbiguous: true,
    ablativeHumanPossessiveSequences: getAblativePossessiveHumanSuffixes(base).map(
      (suffix) =>
        buildNounPhraseParts(
          {
            adjectives: { pre: [], post: [] },
            noun: {
              gup: base,
              source: base,
              isHuman: undefined,
              consumed: 1,
            },
            consumed: 1,
          },
          sourceLang,
          {
            suffix,
            nounNote: {
              key: "ABLATIVE_POSSESSION_HUMAN_SUFFIX",
              data: { token: token.source, gup: suffix },
            },
          }
        )
    ),
    ablativeHumanPossessiveHasAlternatives:
      getAblativePossessiveHumanSuffixes(base).length > 1,
    ablativeHumanPossessiveIsAmbiguous: true,
    originHumanPossessiveSequences: getOriginPossessiveHumanSuffixes(base).map(
      (suffix) =>
        buildNounPhraseParts(
          {
            adjectives: { pre: [], post: [] },
            noun: {
                  gup: base,
                  source: base,
                  isHuman: undefined,
                  consumed: 1,
                },
                consumed: 1,
              },
              sourceLang,
              {
                suffix,
                nounNote: {
                  key: "ORIGIN_POSSESSION_HUMAN_SUFFIX",
                  data: { token: token.source, gup: suffix },
            },
          }
        )
    ),
    originHumanPossessiveHasAlternatives:
      getOriginPossessiveHumanSuffixes(base).length > 1,
    originHumanPossessiveIsAmbiguous: true,
    traversiveHumanPossessiveSequences: getTraversivePossessiveHumanSuffixes(base).map(
      (suffix) =>
        buildNounPhraseParts(
          {
            adjectives: { pre: [], post: [] },
            noun: {
              gup: base,
              source: base,
              isHuman: undefined,
              consumed: 1,
            },
            consumed: 1,
          },
          sourceLang,
          {
            suffix,
            nounNote: {
              key: "TRAVERSE_POSSESSION_HUMAN_SUFFIX",
              data: { token: token.source, gup: suffix },
            },
          }
        )
    ),
    traversiveHumanPossessiveHasAlternatives:
      getTraversivePossessiveHumanSuffixes(base).length > 1,
    traversiveHumanPossessiveIsAmbiguous: true,
  };
    }
  }

  return null;
};

function buildAdverbPart(
  sourceLang: LanguageMode,
  source: string,
  gup: string,
  meaningKey?: string,
  suffix?: string
): TranslationPart {
  const output = suffix ? applySuffixToGup(gup, suffix) : gup;
  return finalizePart(
    {
      type: "adverb",
      source,
      gup: output,
      output,
      explanation: "",
      explanations: [{ key: "TOKEN_PASSTHROUGH", data: { token: source } }],
      meaningKey,
    },
    sourceLang
  );
}

export function buildNounPartWithSuffix(
  match: NounMatch,
  sourceLang: LanguageMode,
  suffix?: string,
  extraExplanation?: ExplanationPayload
): TranslationPart {
  const base = match.gup;
  const gup = suffix ? applySuffixToGup(base, suffix) : base;
  const explanations: ExplanationPayload[] = [
    { key: "TOKEN_PASSTHROUGH", data: { token: match.source } },
  ];
  const alternatives: TranslationAlternative[] = [];
  if (match.agentVerbForms && match.agentVerbForms.length > 0) {
    const agentBase = match.agentVerbForms[3];
    const agentAlt = match.agentVerbForms[4];
    const altBases: string[] = [];
    if (agentBase) {
      altBases.push(`${agentBase}mirri`);
      altBases.push(`${agentBase}yŋu`);
    }
    if (agentAlt) {
      altBases.push(`${agentAlt}mirri`);
    }
    const seen = new Set<string>([gup]);
    for (const altBase of altBases) {
      const altGup = suffix ? applySuffixToGup(altBase, suffix) : altBase;
      if (seen.has(altGup)) continue;
      seen.add(altGup);
      alternatives.push({
        gup: altGup,
        notePayload: { key: "AGENT_NOUN_ALTERNATIVE", data: { token: match.source, gup: altGup } },
      });
    }
  }
  if (match.verbalVerbForms && match.verbalVerbForms.length > 0) {
    explanations.push({
      key: "VERBAL_NOUN",
      data: { token: match.source, gup },
    });
    const basePrimary =
      match.verbalVerbForms[3] ?? match.verbalVerbForms[0] ?? "";
    const baseAlt = match.verbalVerbForms[4] ?? "";
    const seen = new Set<string>([gup]);
    const pushAlternativesForBase = (baseForm: string) => {
      if (!baseForm) return;
      const suffixes = getBelongingSuffixes(baseForm);
      for (const suffixForm of suffixes) {
        const derived = applySuffixToGup(baseForm, suffixForm);
        const altGup = suffix ? applySuffixToGup(derived, suffix) : derived;
        if (seen.has(altGup)) continue;
        seen.add(altGup);
        alternatives.push({
          gup: altGup,
          notePayload: {
            key: "VERBAL_NOUN_ALTERNATIVE",
            data: { token: match.source, gup: altGup },
          },
        });
      }
    };
    pushAlternativesForBase(basePrimary);
    pushAlternativesForBase(baseAlt);
  }
  if (match.rawAlternative) {
    const raw = suffix
      ? applySuffixToGup(match.rawAlternative.gup, suffix)
      : match.rawAlternative.gup;
    alternatives.push({
      gup: raw,
      notePayload: {
        key: "VERBAL_NOUN_RAW_ALTERNATIVE",
        data: { token: match.source, gup: raw },
      },
    });
  }
  if (extraExplanation) explanations.push(extraExplanation);
  return finalizePart(
    {
      type: "noun",
      source: match.source,
      gup,
      output: gup,
      explanation: "",
      explanations,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      meaningKey: match.entry?.meaningKey,
      appliedSuffix: suffix,
    },
    sourceLang
  );
}

function buildInstrumentalAdjectivePart(
  match: AdjectiveMatch,
  sourceLang: LanguageMode,
  suffix?: string
): TranslationPart {
  const base =
    sourceLang === "en" && match.gup === match.source
      ? stripEnglishPossessiveSuffix(match.gup) ?? match.gup
      : match.gup;
  const gup = suffix ? applyInstrumentalSuffixToGup(base, suffix) : base;
  return finalizePart(
    {
      type: "adjective",
      source: match.source,
      gup,
      output: gup,
      explanation: "",
      explanations: [
        { key: "TOKEN_PASSTHROUGH", data: { token: match.source } },
      ],
      meaningKey: match.entry?.meaningKey,
      appliedSuffix: suffix,
    },
    sourceLang
  );
}

function buildInstrumentalNounPartWithSuffix(
  match: NounMatch,
  sourceLang: LanguageMode,
  suffix?: string,
  extraExplanation?: ExplanationPayload
): TranslationPart {
  const base = match.gup;
  const gup = suffix ? applyInstrumentalSuffixToGup(base, suffix) : base;
  const explanations: ExplanationPayload[] = [
    { key: "TOKEN_PASSTHROUGH", data: { token: match.source } },
  ];
  if (extraExplanation) explanations.push(extraExplanation);
  return finalizePart(
    {
      type: "noun",
      source: match.source,
      gup,
      output: gup,
      explanation: "",
      explanations,
      meaningKey: match.entry?.meaningKey,
      appliedSuffix: suffix,
    },
    sourceLang
  );
}

function buildInstrumentalNounPhraseParts(
  phrase: NounPhraseMatch,
  sourceLang: LanguageMode,
  options?: { suffix?: string; nounNote?: ExplanationPayload }
): TranslationPart[] {
  const suffix = options?.suffix;
  const parts: TranslationPart[] = [];
  for (const adj of phrase.adjectives.pre) {
    parts.push(buildInstrumentalAdjectivePart(adj, sourceLang, suffix));
  }
  parts.push(
    buildInstrumentalNounPartWithSuffix(
      phrase.noun,
      sourceLang,
      suffix,
      options?.nounNote
    )
  );
  for (const adj of phrase.adjectives.post) {
    parts.push(buildInstrumentalAdjectivePart(adj, sourceLang, suffix));
  }
  return parts;
}

export function buildNounPhraseParts(
  phrase: NounPhraseMatch,
  sourceLang: LanguageMode,
  options?: { suffix?: string; nounNote?: ExplanationPayload }
): TranslationPart[] {
  const parts = buildNounPhrasePartsBase(phrase, sourceLang, options);
  const instrument = phrase.participleInstrument;
  if (instrument?.pronounParts?.length) {
    parts.push(...instrument.pronounParts);
  } else if (instrument) {
    const instrumentPart = buildParticipleInstrumentPart(instrument, sourceLang);
    if (instrumentPart) {
      parts.push(instrumentPart);
    }
  }
  return parts;
}

export function matchLocativePhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAmbiguity: boolean;
  possessiveAltSequences?: TranslationPart[][];
  possessiveAltHasAmbiguity?: boolean;
} | null {
  const preposition = matchLocativePrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;
  const markerKey =
    LOCATIVE_PREPOSITION_MARKERS[sourceLang]?.[preposition.normalized];
  const markerEntry = markerKey ? LEXICON.markers?.[markerKey] : undefined;
  const adverbInfo = markerEntry
    ? {
        source: preposition.source,
        gup: markerEntry.gup,
        meaningKey: markerEntry.meaningKey,
      }
    : null;
  const buildLocativeDeterminerPart = (
    source: string,
    kind: DemonstrativeKind = "this"
  ): TranslationPart => {
    const primary = kind === "that" ? "dhuwali" : "dhuwala";
    const part = buildDefiniteArticlePart(primary, source, sourceLang);
    return {
      ...part,
      slotId: kind === "that" ? "locative-determiner-that" : "locative-determiner",
    };
  };

  const buildPhraseSequences = (
    phrase: NounPhraseMatch,
    determiner: {
      human: TranslationPart[][];
      locative: TranslationPart[][];
      hasAlternatives: boolean;
    } | undefined,
    includeAdverb: boolean,
    possessor?: PossessorAfterOfMatch | null
  ): {
    sequences: TranslationPart[][];
    hasAmbiguity: boolean;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } => {
    const isHuman = phrase.noun.isHuman === true;
    const isPlace = phrase.noun.isPlace === true;
    const ambiguousHuman =
      phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
    const suffixes = getComitativeSuffixes(phrase.noun.gup);

    const buildPrefix = (): TranslationPart[] => {
      const parts: TranslationPart[] = [];
      if (includeAdverb && adverbInfo) {
        parts.push(
          buildAdverbPart(
            sourceLang,
            adverbInfo.source,
            adverbInfo.gup,
            adverbInfo.meaningKey
          )
        );
      }
      return parts;
    };

    const attachPossessor = (
      prefix: TranslationPart[],
      nounParts: TranslationPart[],
      possessorSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!possessorSequences || possessorSequences.length === 0) {
        return [[...prefix, ...nounParts]];
      }
      const sequences: TranslationPart[][] = [];
      for (const possessorSeq of possessorSequences) {
        sequences.push([...prefix, ...possessorSeq, ...nounParts]);
      }
      return sequences;
    };

    const resolveHumanPossessor = (): TranslationPart[][] | undefined => {
      if (!possessor) return undefined;
      if (possessor.humanPossessiveSequences) {
        if (possessor.humanPossessiveIsAmbiguous && possessor.sequences) {
          return [
            ...possessor.humanPossessiveSequences,
            ...possessor.sequences,
          ];
        }
        return possessor.humanPossessiveSequences;
      }
      return possessor.sequences;
    };
    const humanPossessorSequences = resolveHumanPossessor();
    const humanPossessorHasAlt = Boolean(
      possessor?.humanPossessiveHasAlternatives ||
        possessor?.humanPossessiveIsAmbiguous
    );

    const attachDeterminer = (
      nounSequences: TranslationPart[][],
      determinerSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!determinerSequences || determinerSequences.length === 0) return [];
      if (
        determinerSequences.length === 1 &&
        determinerSequences[0].length === 0
      ) {
        return nounSequences;
      }
      const sequences: TranslationPart[][] = [];
      for (const detSeq of determinerSequences) {
        for (const seq of nounSequences) {
          sequences.push([...detSeq, ...seq]);
        }
      }
      return sequences;
    };

    const buildComitativeSequence = (suffix: string): TranslationPart[][] => {
      const prefix = buildPrefix();
      const nounParts = buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: "COMITATIVE_SUFFIX",
          data: { token: phrase.noun.source, gup: suffix },
        },
      });
      const base = attachPossessor(prefix, nounParts, humanPossessorSequences);
      return attachDeterminer(base, determiner?.human);
    };

    const buildLocativeSequence = (): TranslationPart[][] => {
      const prefix = buildPrefix();
      const nounParts = buildNounPhraseParts(phrase, sourceLang, { suffix: "ŋura" });
      const base = attachPossessor(prefix, nounParts, humanPossessorSequences);
      return attachDeterminer(base, determiner?.locative);
    };

    const buildLocativeAltSequence = (): TranslationPart[][] | null => {
      if (!possessor?.altSequences || possessor.altSequences.length === 0) {
        return null;
      }
      const prefix = buildPrefix();
      const nounParts = buildNounPhraseParts(phrase, sourceLang, { suffix: "ŋura" });
      const base = attachPossessor(prefix, nounParts, possessor.altSequences);
      return attachDeterminer(base, determiner?.locative);
    };

    const buildPlaceSequence = (): TranslationPart[][] => {
      const prefix = buildPrefix();
      const nounParts = buildNounPhraseParts(phrase, sourceLang, {
        nounNote: { key: "LOCATIVE_NO_SUFFIX_NOTE" },
      });
      const base = attachPossessor(prefix, nounParts, humanPossessorSequences);
      return attachDeterminer(base, determiner?.locative);
    };

    const phraseSequences: TranslationPart[][] = [];
    let hasAmbiguity = false;
    let possessiveAltSequences: TranslationPart[][] | undefined;
    let possessiveAltHasAmbiguity = false;
    const locativeAlt = buildLocativeAltSequence();
    if (isPlace) {
      phraseSequences.push(...buildPlaceSequence());
    } else if (isHuman) {
      suffixes.forEach((suffix) =>
        phraseSequences.push(...buildComitativeSequence(suffix))
      );
      if (suffixes.length > 1) hasAmbiguity = true;
      if (humanPossessorHasAlt) hasAmbiguity = true;
      if (determiner?.hasAlternatives) hasAmbiguity = true;
    } else if (ambiguousHuman) {
      suffixes.forEach((suffix) =>
        phraseSequences.push(...buildComitativeSequence(suffix))
      );
      phraseSequences.push(...buildLocativeSequence());
      hasAmbiguity = true;
      if (locativeAlt) {
        possessiveAltSequences = locativeAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
      if (humanPossessorHasAlt) possessiveAltHasAmbiguity = true;
      if (determiner?.hasAlternatives) hasAmbiguity = true;
    } else {
      phraseSequences.push(...buildLocativeSequence());
      if (locativeAlt) {
        possessiveAltSequences = locativeAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
      if (determiner?.hasAlternatives) hasAmbiguity = true;
    }

    return {
      sequences: phraseSequences,
      hasAmbiguity: hasAmbiguity || (possessor?.hasAlternatives ?? false),
      possessiveAltSequences,
      possessiveAltHasAmbiguity,
    };
  };

  const parseTarget = (
    start: number,
    includeAdverb: boolean
  ): {
    sequences: TranslationPart[][];
    consumed: number;
    hasAmbiguity: boolean;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } | null => {
    let cursor = start;
    let determinerConsumed = 0;
    let determinerHasAlternatives = false;
    let humanDeterminers: TranslationPart[][] = [[]];
    let locativeDeterminers: TranslationPart[][] = [[]];
    let emphaticPossessor: PossessorAfterOfMatch | null = null;

    const emphaticMatch = matchEmphaticHumanPossessorAt(
      tokens,
      cursor,
      sourceLang
    );
    if (emphaticMatch) {
      determinerConsumed += emphaticMatch.consumed;
      cursor += emphaticMatch.consumed;
      emphaticPossessor = {
        sequences: [[emphaticMatch.part]],
        consumed: 0,
        hasAlternatives: Boolean(emphaticMatch.part.alternatives?.length),
        altSequences: undefined,
        altHasAlternatives: false,
        humanPossessiveSequences: [[emphaticMatch.part]],
        humanPossessiveHasAlternatives: Boolean(
          emphaticMatch.part.alternatives?.length
        ),
        humanPossessiveIsAmbiguous: false,
      };
    }
    const buildComitativeDeterminerPart = (
      source: string,
      kind: DemonstrativeKind = "this"
    ): TranslationPart => {
      const part = buildDefiniteArticlePart("dhiyakala", source, sourceLang);
      if (kind === "that") {
        part.alternatives = [{ gup: "ŋurikala" }, { gup: "ŋurukala" }];
      }
      return addThatVisibilityNote(part, kind);
    };
    const demoMatch = matchDemonstrativeToken(
      tokens[cursor]?.source ?? "",
      sourceLang
    );
    if (demoMatch) {
      determinerConsumed = 1;
      humanDeterminers = [
        [buildComitativeDeterminerPart(demoMatch.source, demoMatch.kind)],
      ];
      locativeDeterminers = [
        [buildLocativeDeterminerPart(demoMatch.source, demoMatch.kind)],
      ];
      if (demoMatch.kind === "that") determinerHasAlternatives = true;
    } else {
      const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
      if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
        determinerConsumed = articleMatch.consumed;
        if (articleMatch.kind === "definite") {
          humanDeterminers = [
            [buildComitativeDeterminerPart(articleMatch.source)],
          ];
          locativeDeterminers = [
            [buildLocativeDeterminerPart(articleMatch.source)],
          ];
          determinerHasAlternatives = true;
        }
      }
    }
    cursor += determinerConsumed;
    if (determinerConsumed > 0) {
      const tokenAfter = tokens[cursor];
      if (!tokenAfter || isNounPhraseBoundary(tokens, cursor, sourceLang)) {
        const sequences =
          locativeDeterminers.length > 0 ? locativeDeterminers : [[]];
        return {
          sequences,
          consumed: determinerConsumed,
          hasAmbiguity: determinerHasAlternatives,
        };
      }
    }
    const demoToken = tokens[cursor];
    if (demoToken && isNonHumanDemoPronoun(demoToken.source, sourceLang)) {
      determinerConsumed += 1;
      locativeDeterminers = [
        [buildLocativeDeterminerPart(demoToken.source, "that")],
      ];
      humanDeterminers = [];
      return {
        sequences: locativeDeterminers,
        consumed: determinerConsumed,
        hasAmbiguity: determinerHasAlternatives,
        possessiveAltSequences: undefined,
        possessiveAltHasAmbiguity: undefined,
      };
    }

    const possessorPrefix = matchPossessorBeforeNoun(
      tokens,
      cursor,
      sourceLang,
      options
    );
    if (possessorPrefix) {
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        cursor + possessorPrefix.consumed,
        sourceLang,
        { allowUnknownHead: true }
      );
      if (!phrase) return null;
      const built = buildPhraseSequences(
        phrase,
        {
          human: humanDeterminers,
          locative: locativeDeterminers,
          hasAlternatives: determinerHasAlternatives,
        },
        includeAdverb,
        possessorPrefix
      );
      return {
        sequences: built.sequences,
        consumed: determinerConsumed + possessorPrefix.consumed + phrase.consumed,
        hasAmbiguity: built.hasAmbiguity,
        possessiveAltSequences: built.possessiveAltSequences,
        possessiveAltHasAmbiguity: built.possessiveAltHasAmbiguity,
      };
    }

    const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang, {
      allowUnknownHead: true,
    });
    if (!phrase) {
      if (determinerConsumed > 0 && locativeDeterminers.length > 0) {
        return {
          sequences: locativeDeterminers,
          consumed: determinerConsumed,
          hasAmbiguity: determinerHasAlternatives,
          possessiveAltSequences: undefined,
          possessiveAltHasAmbiguity: undefined,
        };
      }
      return null;
    }
    const afterIndex = cursor + phrase.consumed;
    let possessor: PossessorAfterOfMatch | null = null;
    let possessorConnectorConsumed = 0;
    if (isOfConnectorToken(tokens[afterIndex], sourceLang)) {
      possessor = matchPossessorAfterOf(
        tokens,
        afterIndex + 1,
        sourceLang,
        options
      );
      possessorConnectorConsumed = 1;
    } else if (emphaticPossessor) {
      possessor = emphaticPossessor;
    }
    const built = buildPhraseSequences(
      phrase,
      {
        human: humanDeterminers,
        locative: locativeDeterminers,
        hasAlternatives: determinerHasAlternatives,
      },
      includeAdverb,
      possessor
    );
    const consumed =
      determinerConsumed +
      phrase.consumed +
      (possessor ? possessorConnectorConsumed + possessor.consumed : 0);
    return {
      sequences: built.sequences,
      consumed,
      hasAmbiguity: built.hasAmbiguity,
      possessiveAltSequences: built.possessiveAltSequences,
      possessiveAltHasAmbiguity: built.possessiveAltHasAmbiguity,
    };
  };

  const initial = parseTarget(index + preposition.consumed, true);
  if (!initial) return null;
  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;
  let possessiveAltSequences = initial.possessiveAltSequences;
  let possessiveAltHasAmbiguity = initial.possessiveAltHasAmbiguity ?? false;

  let cursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(cursor + connector.consumed, false);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    cursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
    if (possessiveAltSequences && next.possessiveAltSequences) {
      const mergedAlt: TranslationPart[][] = [];
      for (const seq of possessiveAltSequences) {
        for (const nextSeq of next.possessiveAltSequences) {
          mergedAlt.push([...seq, connectorPart, ...nextSeq]);
        }
      }
      possessiveAltSequences = mergedAlt;
      possessiveAltHasAmbiguity =
        possessiveAltHasAmbiguity ||
        Boolean(next.possessiveAltHasAmbiguity);
    } else {
      possessiveAltSequences = undefined;
    }
  }

  return {
    sequences,
    consumed,
    hasAmbiguity,
    possessiveAltSequences,
    possessiveAltHasAmbiguity,
  };
}

export function matchComitativePhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): { sequences: TranslationPart[][]; consumed: number; hasAmbiguity: boolean } | null {
  const pronounMatch = matchComitativePronounAt(tokens, index, sourceLang);
  if (pronounMatch) {
    const part = buildComitativePronounPart(pronounMatch);
    if (!part) return null;
    const rendered = finalizePart(part, sourceLang);
    const hasAmbiguity = Boolean(rendered.alternatives?.length);
    return { sequences: [[rendered]], consumed: pronounMatch.consumed, hasAmbiguity };
  }

  const preposition = matchComitativePrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;
  const buildPhraseSequences = (
    phrase: NounPhraseMatch,
    determiners?: {
      human: TranslationPart[][];
      hasAlternatives: boolean;
    }
  ): {
    sequences: TranslationPart[][];
    hasAmbiguity: boolean;
    targetHumanity: InstrumentalTargetHumanity;
  } => {
    const isHuman = phrase.noun.isHuman === true;
    const isPlace = phrase.noun.isPlace === true;
    const ambiguousHuman =
      phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
    const suffixes = getComitativeSuffixes(phrase.noun.gup);

    const buildPlaceSequence = (): TranslationPart[] => {
      return buildNounPhraseParts(phrase, sourceLang, {
        nounNote: { key: "LOCATIVE_NO_SUFFIX_NOTE" },
      });
    };
    const buildComitativeSequence = (suffix: string): TranslationPart[] => {
      return buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: { key: "COMITATIVE_SUFFIX", data: { token: phrase.noun.source, gup: suffix } },
      });
    };

    const buildNonHumanSequence = (): TranslationPart[] => {
      return buildNounPhraseParts(phrase, sourceLang, {
        suffix: "ŋura",
        nounNote: { key: "COMITATIVE_NONHUMAN_ALT" },
      });
    };

    const attachDeterminer = (
      nounSequences: TranslationPart[][],
      determinerSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!determinerSequences || determinerSequences.length === 0) return nounSequences;
      const sequences: TranslationPart[][] = [];
      for (const detSeq of determinerSequences) {
        for (const seq of nounSequences) {
          sequences.push([...detSeq, ...seq]);
        }
      }
      return sequences;
    };

    const sequences: TranslationPart[][] = [];
    let hasAmbiguity = false;
    let targetHumanity: InstrumentalTargetHumanity = "non-human";
    if (isHuman) {
      sequences.push(
        ...attachDeterminer(
          suffixes.map((suffix) => buildComitativeSequence(suffix)),
          determiners?.human
        )
      );
      targetHumanity = "human";
      if (suffixes.length > 1 || determiners?.hasAlternatives) hasAmbiguity = true;
    } else if (isPlace) {
      sequences.push(buildPlaceSequence());
      targetHumanity = "non-human";
    } else if (ambiguousHuman) {
      sequences.push(
        ...attachDeterminer(
          suffixes.map((suffix) => buildComitativeSequence(suffix)),
          determiners?.human
        )
      );
      sequences.push(buildNonHumanSequence());
      hasAmbiguity = true;
      targetHumanity = "ambiguous";
    } else {
      sequences.push(buildNonHumanSequence());
      targetHumanity = "non-human";
    }
    return { sequences, hasAmbiguity, targetHumanity };
  };

  const parseTarget = (
    start: number
  ): { sequences: TranslationPart[][]; consumed: number; hasAmbiguity: boolean } | null => {
    const verbMatches = matchVerbAt(tokens, start, sourceLang);
    const infinitiveMatch = matchInfinitiveAt(tokens as IRToken[], start, sourceLang);
    const gerundMatch = matchGerundAfterIndex(tokens as IRToken[], start, sourceLang);
    if (
      verbMatches.length > 0 ||
      infinitiveMatch ||
      (gerundMatch && gerundMatch.gerundIndex === start)
    ) {
      return null;
    }
    let cursor = start;
    let determinerConsumed = 0;
    let determinerHasAlternatives = false;
    let humanDeterminers: TranslationPart[][] = [[]];
    const buildComitativeDeterminerPart = (
      source: string,
      kind: DemonstrativeKind = "this"
    ): TranslationPart => {
      const part = buildDefiniteArticlePart("dhiyakala", source, sourceLang);
      if (kind === "that") {
        part.alternatives = [{ gup: "ŋurikala" }, { gup: "ŋurukala" }];
      }
      return addThatVisibilityNote(part, kind);
    };
    const demoMatch = matchDemonstrativeToken(
      tokens[cursor]?.source ?? "",
      sourceLang
    );
    if (demoMatch) {
      determinerConsumed = 1;
      humanDeterminers = [
        [buildComitativeDeterminerPart(demoMatch.source, demoMatch.kind)],
      ];
      if (demoMatch.kind === "that") determinerHasAlternatives = true;
    } else {
      const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
      if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
        determinerConsumed = articleMatch.consumed;
        if (articleMatch.kind === "definite") {
          humanDeterminers = [
            [buildComitativeDeterminerPart(articleMatch.source)],
          ];
          determinerHasAlternatives = true;
        }
      }
    }
    cursor += determinerConsumed;
    const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
    if (!phrase) {
      if (determinerConsumed > 0) {
        return {
          sequences: humanDeterminers,
          consumed: determinerConsumed,
          hasAmbiguity: determinerHasAlternatives,
        };
      }
      return null;
    }
    const { sequences, hasAmbiguity } = buildPhraseSequences(phrase, {
      human: humanDeterminers,
      hasAlternatives: determinerHasAlternatives,
    });
    const consumed = determinerConsumed + phrase.consumed;
    return { sequences, consumed, hasAmbiguity };
  };

  const initial = parseTarget(index + preposition.consumed);
  if (!initial) return null;
  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;

  let cursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(cursor + connector.consumed);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    cursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
  }

  return { sequences, consumed, hasAmbiguity };
}

export function filterComitativeHumanSequences(
  sequences: TranslationPart[][]
): TranslationPart[][] {
  return sequences.filter(
    (seq) =>
      !seq.some(
        (part) =>
          part.appliedSuffix === "ŋura" ||
          part.explanations?.some(
            (exp) =>
              exp.key === "COMITATIVE_NONHUMAN_ALT" ||
              exp.key === "LOCATIVE_NO_SUFFIX_NOTE"
          )
      )
  );
}

export function filterInstrumentalNonHumanSequences(
  sequences: TranslationPart[][]
): TranslationPart[][] {
  return sequences.filter((seq) =>
    seq.some((part) =>
      part.explanations?.some((exp) => exp.key === "INSTRUMENTAL_NONHUMAN_ALT")
    )
  );
}

function buildInstrumentalPronounPart(
  match: ReturnType<typeof matchComitativePronounAt>,
  sourceLang: LanguageMode
): TranslationPart | null {
  if (!match) return null;
  const base = buildComitativePronounPart(match);
  if (!base) return null;
  const explanations: ExplanationPayload[] = (base.explanations ?? []).map(
    (exp) =>
      exp.key === "PRONOUN_COMITATIVE"
        ? { ...exp, key: "PRONOUN_INSTRUMENTAL" as ExplanationKey }
        : exp
  );
  return finalizePart(
    {
      ...base,
      explanations,
      meaningKey:
        base.meaningKey?.replace("comitative", "instrumental") ?? base.meaningKey,
    },
    sourceLang
  );
}

const OBJECT_PRONOUN_PERSON_MAP: Record<ObjectPronounKey, PersonNumber> = {
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

const collectObjectPronounPersons = (
  match: ObjectPronounMatch
): PersonNumber[] => {
  const persons = new Set<PersonNumber>();
  if (match.primaryKey) {
    const primary = OBJECT_PRONOUN_PERSON_MAP[match.primaryKey];
    if (primary) persons.add(primary);
  }
  if (match.alternativeKeys) {
    for (const key of match.alternativeKeys) {
      const person = OBJECT_PRONOUN_PERSON_MAP[key];
      if (person) persons.add(person);
    }
  }
  return Array.from(persons);
};

const buildCausePronounPart = (
  source: string,
  persons: PersonNumber[]
): TranslationPart | null => {
  if (!persons || persons.length === 0) return null;
  const primaryPerson = persons[0];
  const primaryForms = getComitativePronounForms(primaryPerson);
  if (primaryForms.length === 0) return null;
  const primary = primaryForms[0];
  const explanations: ExplanationPayload[] = [
    { key: "PRONOUN_CAUSE", data: { token: source, gup: primary } },
  ];
  const primaryNote = getComitativePronounNoteKey(primaryPerson);
  if (primaryNote) {
    explanations.push({ key: primaryNote });
  }
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  for (const person of persons) {
    const noteKey = getComitativePronounNoteKey(person);
    const forms = getComitativePronounForms(person);
    for (const form of forms) {
      if (person === primaryPerson && form === primary) continue;
      const key = `${form}:${noteKey ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      alternatives.push({
        gup: form,
        notePayload: noteKey ? { key: noteKey } : undefined,
      });
    }
  }
  return {
    type: "pronoun",
    source,
    gup: primary,
    output: primary,
    explanation: "",
    explanations,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    meaningKey: `pronoun.cause.${primaryPerson}`,
  };
};

const buildBelongingPronounPartFromPersons = (
  source: string,
  persons: PersonNumber[]
): TranslationPart | null => {
  if (!persons || persons.length === 0) return null;
  const primaryPerson = persons[0];
  const primaryForms = BELONGING_PRONOUNS_GUP[primaryPerson] ?? [];
  if (primaryForms.length === 0) return null;
  const primary = primaryForms[0];
  const explanations: ExplanationPayload[] = [
    { key: "PRONOUN_BELONGING", data: { token: source, gup: primary } },
  ];
  const primaryNote = getComitativePronounNoteKey(primaryPerson);
  if (primaryNote) {
    explanations.push({ key: primaryNote });
  }
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  for (const person of persons) {
    const noteKey = getComitativePronounNoteKey(person);
    const forms = BELONGING_PRONOUNS_GUP[person] ?? [];
    for (const form of forms) {
      if (person === primaryPerson && form === primary) continue;
      const key = `${form}:${noteKey ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      alternatives.push({
        gup: form,
        notePayload: noteKey ? { key: noteKey } : undefined,
      });
    }
    const emphaticForms = BELONGING_PRONOUNS_EMPHATIC_GUP[person] ?? [];
    for (const form of emphaticForms) {
      const key = `${form}:emphatic`;
      if (seen.has(key)) continue;
      seen.add(key);
      alternatives.push({
        gup: form,
        notePayload: { key: "PRONOUN_NOTE_EMPHATIC" },
      });
    }
  }
  return {
    type: "pronoun",
    source,
    gup: primary,
    output: primary,
    explanation: "",
    explanations,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    meaningKey: `pronoun.belonging.${primaryPerson}`,
  };
};

type InstrumentalTargetHumanity = "human" | "non-human" | "ambiguous";

const INSTRUMENTAL_EXCLUSIVE_PREPOSITIONS: Record<LanguageMode, string[]> = {
  es: ["mediante", "usando"],
  en: ["using", "by means of"],
};

function isInstrumentalExclusive(
  normalized: string,
  sourceLang: LanguageMode
): boolean {
  return (INSTRUMENTAL_EXCLUSIVE_PREPOSITIONS[sourceLang] ?? []).includes(
    normalized
  );
}

export function matchInstrumentalPhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAmbiguity: boolean;
  targetHumanity: InstrumentalTargetHumanity;
  isExclusive: boolean;
  preposition: { consumed: number; source: string; normalized: string };
  possessiveAltSequences?: TranslationPart[][];
  possessiveAltHasAmbiguity?: boolean;
} | null {
  const pronounMatch = matchComitativePronounAt(tokens, index, sourceLang);
  if (pronounMatch) {
    const normalized = normalizeToken(pronounMatch.source, sourceLang);
    const lead = normalized.split(" ")[0] ?? normalized;
    const allowed =
      sourceLang === "es"
        ? lead.startsWith("con") || lead === "por"
        : lead === "with" || lead === "by";
    if (!allowed) {
      return null;
    }
    const part = buildInstrumentalPronounPart(pronounMatch, sourceLang);
    if (!part) return null;
    const hasAmbiguity = Boolean(part.alternatives?.length);
    return {
      sequences: [[part]],
      consumed: pronounMatch.consumed,
      hasAmbiguity,
      targetHumanity: "human",
      isExclusive: false,
      preposition: {
        consumed: pronounMatch.consumed,
        source: pronounMatch.source,
        normalized: normalizeToken(pronounMatch.source, sourceLang),
      },
    };
  }

  const preposition = matchInstrumentalPrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;
  const isConWith =
    sourceLang === "es"
      ? preposition.normalized === "con"
      : preposition.normalized === "with";

  const buildPhraseSequences = (
    phrase: NounPhraseMatch,
    possessor?: PossessorAfterOfMatch | null,
    determiners?: {
      human: TranslationPart[][];
      nonHuman: TranslationPart[][];
      hasAlternatives: boolean;
    }
  ): {
    sequences: TranslationPart[][];
    hasAmbiguity: boolean;
    targetHumanity: InstrumentalTargetHumanity;
    nonHumanCount: number;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } => {
    const isHuman = phrase.noun.isHuman === true;
    const isPlace = phrase.noun.isPlace === true;
    const ambiguousHuman =
      phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
    const humanSuffixes = getComitativeSuffixes(phrase.noun.gup);
    const nonHumanSuffixes = getInstrumentalSuffixes(phrase.noun.gup);

    const buildHumanSequence = (suffix: string): TranslationPart[] =>
      buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: "INSTRUMENTAL_SUFFIX",
          data: { token: phrase.noun.source, gup: suffix },
        },
      });

    const buildNonHumanSequence = (
      suffix: string,
      noteKey: ExplanationKey
    ): TranslationPart[] =>
      buildInstrumentalNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: noteKey,
          data: { token: phrase.noun.source, gup: suffix },
        },
      });

    const attachPossessor = (
      nounParts: TranslationPart[],
      possessorSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!possessorSequences || possessorSequences.length === 0) {
        return [[...nounParts]];
      }
      const sequences: TranslationPart[][] = [];
      for (const possessorSeq of possessorSequences) {
        sequences.push([...possessorSeq, ...nounParts]);
      }
      return sequences;
    };
    const attachDeterminer = (
      nounSequences: TranslationPart[][],
      determinerSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!determinerSequences || determinerSequences.length === 0) {
        return nounSequences;
      }
      const sequences: TranslationPart[][] = [];
      for (const determinerSeq of determinerSequences) {
        for (const seq of nounSequences) {
          sequences.push([...determinerSeq, ...seq]);
        }
      }
      return sequences;
    };

    const sequences: TranslationPart[][] = [];
    let hasAmbiguity = false;
    let targetHumanity: InstrumentalTargetHumanity = "ambiguous";
    let possessiveAltSequences: TranslationPart[][] | undefined;
    let possessiveAltHasAmbiguity = false;
    const possessorCount = possessor?.sequences?.length ?? 1;
    const humanPossessorSequences = possessor?.humanPossessiveSequences
      ? possessor.humanPossessiveIsAmbiguous && possessor.sequences
        ? [...possessor.humanPossessiveSequences, ...possessor.sequences]
        : possessor.humanPossessiveSequences
      : possessor?.sequences;
    const humanPossessorHasAlt = Boolean(
      possessor?.humanPossessiveHasAlternatives ||
        possessor?.humanPossessiveIsAmbiguous
    );

    if (isHuman) {
      const humanSequences = humanSuffixes.flatMap((suffix) =>
        attachPossessor(buildHumanSequence(suffix), humanPossessorSequences)
      );
      sequences.push(
        ...attachDeterminer(humanSequences, determiners?.human)
      );
      if (humanSuffixes.length > 1) hasAmbiguity = true;
      if (humanPossessorHasAlt) hasAmbiguity = true;
      if (determiners?.hasAlternatives) hasAmbiguity = true;
      targetHumanity = "human";
      return {
        sequences,
        hasAmbiguity,
        targetHumanity,
        nonHumanCount: 0,
      };
    } else if (isPlace) {
      const nonHumanSequences = nonHumanSuffixes.map((suffix) =>
        buildNonHumanSequence(suffix, "INSTRUMENTAL_SUFFIX")
      );
      sequences.push(
        ...attachDeterminer(
          nonHumanSequences.flatMap((seq) =>
            attachPossessor(seq, humanPossessorSequences)
          ),
          determiners?.nonHuman
        )
      );
      if (nonHumanSuffixes.length > 1) hasAmbiguity = true;
      if (determiners?.hasAlternatives) hasAmbiguity = true;
      targetHumanity = "non-human";
      if (possessor?.altSequences && nonHumanSequences.length > 0) {
        possessiveAltSequences = nonHumanSequences.flatMap((seq) =>
          attachPossessor(seq, possessor.altSequences)
        );
        possessiveAltHasAmbiguity =
          possessor.altHasAlternatives || nonHumanSuffixes.length > 1;
      }
      return {
        sequences,
        hasAmbiguity,
        targetHumanity,
        nonHumanCount: nonHumanSuffixes.length * possessorCount,
        possessiveAltSequences,
        possessiveAltHasAmbiguity,
      };
    } else if (ambiguousHuman) {
      const nonHumanSequences = nonHumanSuffixes.map((suffix) =>
        buildNonHumanSequence(suffix, "INSTRUMENTAL_NONHUMAN_ALT")
      );
      const humanSequences = humanSuffixes.map((suffix) =>
        buildHumanSequence(suffix)
      );
      sequences.push(
        ...attachDeterminer(
          nonHumanSequences.flatMap((seq) =>
            attachPossessor(seq, humanPossessorSequences)
          ),
          determiners?.nonHuman
        ),
        ...attachDeterminer(
          humanSequences.flatMap((seq) =>
            attachPossessor(seq, humanPossessorSequences)
          ),
          determiners?.human
        )
      );
      hasAmbiguity = true;
      if (humanPossessorHasAlt) hasAmbiguity = true;
      if (determiners?.hasAlternatives) hasAmbiguity = true;
      targetHumanity = "ambiguous";
      if (possessor?.altSequences && nonHumanSequences.length > 0) {
        possessiveAltSequences = nonHumanSequences.flatMap((seq) =>
          attachPossessor(seq, possessor.altSequences)
        );
        possessiveAltHasAmbiguity =
          possessor.altHasAlternatives || nonHumanSuffixes.length > 1;
      }
      return {
        sequences,
        hasAmbiguity,
        targetHumanity,
        nonHumanCount: nonHumanSequences.length * possessorCount,
        possessiveAltSequences,
        possessiveAltHasAmbiguity,
      };
    } else {
      const nonHumanSequences = nonHumanSuffixes.map((suffix) =>
        buildNonHumanSequence(suffix, "INSTRUMENTAL_SUFFIX")
      );
      sequences.push(
        ...attachDeterminer(
          nonHumanSequences.flatMap((seq) =>
            attachPossessor(seq, humanPossessorSequences)
          ),
          determiners?.nonHuman
        )
      );
      if (nonHumanSuffixes.length > 1) hasAmbiguity = true;
      if (determiners?.hasAlternatives) hasAmbiguity = true;
      targetHumanity = "non-human";
      if (possessor?.altSequences && nonHumanSequences.length > 0) {
        possessiveAltSequences = nonHumanSequences.flatMap((seq) =>
          attachPossessor(seq, possessor.altSequences)
        );
        possessiveAltHasAmbiguity =
          possessor.altHasAlternatives || nonHumanSuffixes.length > 1;
      }
      return {
        sequences,
        hasAmbiguity,
        targetHumanity,
        nonHumanCount: nonHumanSuffixes.length * possessorCount,
        possessiveAltSequences,
        possessiveAltHasAmbiguity,
      };
    }
  };

  const parseTarget = (
    start: number
  ): {
    sequences: TranslationPart[][];
    consumed: number;
    hasAmbiguity: boolean;
    targetHumanity: InstrumentalTargetHumanity;
    nonHumanCount: number;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } | null => {
    let cursor = start;
    let determinerConsumed = 0;
    let determinerHasAlternatives = false;
    let humanDeterminers: TranslationPart[][] = [[]];
    let nonHumanDeterminers: TranslationPart[][] = [[]];
    let emphaticPossessor: PossessorAfterOfMatch | null = null;
    debugLog("instrumental:parseTarget", {
      start,
      token: tokens[start]?.source,
      next: tokens[start + 1]?.source,
      sourceLang,
    });
    const demoMatch = matchDemonstrativeToken(
      tokens[cursor]?.source ?? "",
      sourceLang
    );
    const buildDhiyaNguDemoPart = (source: string, kind: "this" | "that") => {
      const primary = kind === "that" ? "dhiyaŋi" : "dhiyaŋu";
      const part = buildDefiniteArticlePart(primary, source, sourceLang);
      if (kind === "that") {
        part.alternatives = [{ gup: "ŋuriŋi" }, { gup: "ŋuruŋu" }];
      }
      return addThatVisibilityNote(part, kind);
    };
    const emphaticMatch = matchEmphaticHumanPossessorAt(
      tokens,
      cursor,
      sourceLang
    );
    if (emphaticMatch) {
      determinerConsumed += emphaticMatch.consumed;
      cursor += emphaticMatch.consumed;
      emphaticPossessor = {
        sequences: [[emphaticMatch.part]],
        consumed: 0,
        hasAlternatives: Boolean(emphaticMatch.part.alternatives?.length),
        altSequences: undefined,
        altHasAlternatives: false,
        humanPossessiveSequences: [[emphaticMatch.part]],
        humanPossessiveHasAlternatives: Boolean(
          emphaticMatch.part.alternatives?.length
        ),
        humanPossessiveIsAmbiguous: false,
      };
    }
    if (demoMatch) {
      determinerConsumed = 1;
      humanDeterminers = [
        [buildDefiniteArticlePart("dhiyakala", demoMatch.source, sourceLang)],
      ];
      nonHumanDeterminers = [
        [buildDhiyaNguDemoPart(demoMatch.source, demoMatch.kind)],
      ];
      debugLog("instrumental:demo-determiner", {
        start,
        source: demoMatch.source,
        kind: demoMatch.kind,
      });
    } else {
      const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
      if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
        determinerConsumed = articleMatch.consumed;
        if (articleMatch.kind === "definite") {
          humanDeterminers = [
            [buildDefiniteArticlePart("dhiyakala", articleMatch.source, sourceLang)],
          ];
          nonHumanDeterminers = [
            [buildDefiniteArticlePart("dhiyaŋu", articleMatch.source, sourceLang)],
          ];
          determinerHasAlternatives = true;
        }
        debugLog("instrumental:article-determiner", {
          start,
          source: articleMatch.source,
          kind: articleMatch.kind,
          consumed: articleMatch.consumed,
        });
      }
    }
    cursor += determinerConsumed;
    debugLog("instrumental:after-determiner", {
      start,
      cursor,
      determinerConsumed,
      next: tokens[cursor]?.source,
    });
    if (determinerConsumed > 0 && !tokens[cursor]) {
      debugLog("instrumental:demo-standalone", { start, cursor });
      return {
        sequences: nonHumanDeterminers,
        consumed: determinerConsumed,
        hasAmbiguity: determinerHasAlternatives,
        targetHumanity: "non-human",
        nonHumanCount: nonHumanDeterminers.length,
      };
    }
    const demoToken = tokens[cursor];
    if (demoToken && isNonHumanDemoPronoun(demoToken.source, sourceLang)) {
      const demoMatch = matchDemonstrativeToken(demoToken.source, sourceLang);
      const demoPart = buildDhiyaNguDemoPart(
        demoToken.source,
        demoMatch?.kind === "that" ? "that" : "this"
      );
      const sequences =
        determinerConsumed > 0 && nonHumanDeterminers.length > 0
          ? nonHumanDeterminers
          : [[demoPart]];
      return {
        sequences,
        consumed: determinerConsumed + 1,
        hasAmbiguity: determinerHasAlternatives,
        targetHumanity: "non-human",
        nonHumanCount: sequences.length,
      };
    }

    const possessorPrefix = matchPossessorBeforeNoun(
      tokens,
      cursor,
      sourceLang,
      options
    );
    debugLog("instrumental:possessor-prefix", {
      start,
      cursor,
      hasPrefix: Boolean(possessorPrefix),
      token: tokens[cursor]?.source,
    });
    if (possessorPrefix) {
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        cursor + possessorPrefix.consumed,
        sourceLang
      );
      debugLog("instrumental:possessor-phrase", {
        start,
        cursor,
        consumed: possessorPrefix.consumed,
        hasPhrase: Boolean(phrase),
        next: tokens[cursor + possessorPrefix.consumed]?.source,
      });
      if (!phrase) return null;
      const built = buildPhraseSequences(phrase, possessorPrefix, {
        human: humanDeterminers,
        nonHuman: nonHumanDeterminers,
        hasAlternatives: determinerHasAlternatives,
      });
      return {
        sequences: built.sequences,
        consumed: determinerConsumed + possessorPrefix.consumed + phrase.consumed,
        hasAmbiguity: built.hasAmbiguity,
        targetHumanity: built.targetHumanity,
        nonHumanCount: built.nonHumanCount,
        possessiveAltSequences: built.possessiveAltSequences,
        possessiveAltHasAmbiguity: built.possessiveAltHasAmbiguity,
      };
    }

    const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
    debugLog("instrumental:noun-phrase", {
      start,
      cursor,
      hasPhrase: Boolean(phrase),
      token: tokens[cursor]?.source,
    });
    if (!phrase) return null;
    const afterIndex = cursor + phrase.consumed;
    let possessor: PossessorAfterOfMatch | null = null;
    let possessorConnectorConsumed = 0;
    if (isOfConnectorToken(tokens[afterIndex], sourceLang)) {
      possessor = matchPossessorAfterOf(
        tokens,
        afterIndex + 1,
        sourceLang,
        options
      );
      possessorConnectorConsumed = 1;
    } else if (emphaticPossessor) {
      possessor = emphaticPossessor;
    }
    const {
      sequences,
      hasAmbiguity,
      targetHumanity,
      nonHumanCount,
      possessiveAltSequences,
      possessiveAltHasAmbiguity,
    } = buildPhraseSequences(phrase, possessor, {
      human: humanDeterminers,
      nonHuman: nonHumanDeterminers,
      hasAlternatives: determinerHasAlternatives,
    });
    const consumed =
      determinerConsumed +
      phrase.consumed +
      (possessor ? possessorConnectorConsumed + possessor.consumed : 0);
    return {
      sequences,
      consumed,
      hasAmbiguity,
      targetHumanity,
      nonHumanCount,
      possessiveAltSequences,
      possessiveAltHasAmbiguity,
    };
  };

  const initial = parseTarget(index + preposition.consumed);
  if (!initial) return null;
  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;
  let targetHumanity = initial.targetHumanity;
  let nonHumanCount = initial.nonHumanCount;
  let possessiveAltSequences = initial.possessiveAltSequences;
  let possessiveAltHasAmbiguity =
    initial.possessiveAltHasAmbiguity ?? false;
  const isExclusive = isInstrumentalExclusive(preposition.normalized, sourceLang);
  // Keep both human and non-human alternatives when ambiguity is present.

  let cursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(cursor + connector.consumed);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    cursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
    if (targetHumanity !== next.targetHumanity) {
      targetHumanity = "ambiguous";
    }
    if (isConWith && targetHumanity === "ambiguous") {
      hasAmbiguity = true;
    }
    if (possessiveAltSequences && next.possessiveAltSequences) {
      const mergedAlt: TranslationPart[][] = [];
      for (const seq of possessiveAltSequences) {
        for (const nextSeq of next.possessiveAltSequences) {
          mergedAlt.push([...seq, connectorPart, ...nextSeq]);
        }
      }
      possessiveAltSequences = mergedAlt;
      possessiveAltHasAmbiguity =
        possessiveAltHasAmbiguity ||
        Boolean(next.possessiveAltHasAmbiguity);
    } else {
      possessiveAltSequences = undefined;
    }
  }

  return {
    sequences,
    consumed,
    hasAmbiguity,
    targetHumanity,
    isExclusive,
    preposition,
    possessiveAltSequences,
    possessiveAltHasAmbiguity,
  };
}

type CauseTargetHumanity = "human" | "non-human" | "ambiguous";

export function matchCausePhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAmbiguity: boolean;
  targetHumanity: CauseTargetHumanity;
  preposition: { consumed: number; source: string; normalized: string };
  possessiveAltSequences?: TranslationPart[][];
  possessiveAltHasAmbiguity?: boolean;
} | null {
  const preposition = matchPurposePrepositionAt(tokens, index, sourceLang);
  debugLog("cause:preposition", {
    index,
    token: tokens[index]?.source,
    next: tokens[index + 1]?.source,
    sourceLang,
    matched: Boolean(preposition),
    preposition: preposition?.source,
  });
  if (!preposition) return null;

  const buildPhraseSequences = (
    phrase: NounPhraseMatch,
    possessor?: PossessorAfterOfMatch | null,
    determiners?: {
      human: TranslationPart[][];
      nonHuman: TranslationPart[][];
      hasAlternatives: boolean;
    }
  ): {
    sequences: TranslationPart[][];
    hasAmbiguity: boolean;
    targetHumanity: CauseTargetHumanity;
    nonHumanCount: number;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } => {
    const isHuman = phrase.noun.isHuman === true;
    const isPlace = phrase.noun.isPlace === true;
    const ambiguousHuman =
      phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
    const humanSuffixes = getComitativeSuffixes(phrase.noun.gup);
    const nonHumanSuffixes = getInstrumentalSuffixes(phrase.noun.gup);

    const buildHumanSequence = (suffix: string): TranslationPart[] =>
      buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: "CAUSE_SUFFIX",
          data: { token: phrase.noun.source, gup: suffix },
        },
      });

    const buildNonHumanSequence = (
      suffix: string,
      noteKey: ExplanationKey
    ): TranslationPart[] =>
      buildInstrumentalNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: noteKey,
          data: { token: phrase.noun.source, gup: suffix },
        },
      });

    const attachPossessor = (
      nounParts: TranslationPart[],
      possessorSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!possessorSequences || possessorSequences.length === 0) {
        return [[...nounParts]];
      }
      const sequences: TranslationPart[][] = [];
      for (const possessorSeq of possessorSequences) {
        sequences.push([...possessorSeq, ...nounParts]);
      }
      return sequences;
    };
    const attachDeterminer = (
      nounSequences: TranslationPart[][],
      determinerSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!determinerSequences || determinerSequences.length === 0) {
        return nounSequences;
      }
      const sequences: TranslationPart[][] = [];
      for (const determinerSeq of determinerSequences) {
        for (const seq of nounSequences) {
          sequences.push([...determinerSeq, ...seq]);
        }
      }
      return sequences;
    };

    const sequences: TranslationPart[][] = [];
    let hasAmbiguity = false;
    let targetHumanity: CauseTargetHumanity = "ambiguous";
    let possessiveAltSequences: TranslationPart[][] | undefined;
    let possessiveAltHasAmbiguity = false;
    const possessorCount = possessor?.sequences?.length ?? 1;
    const humanPossessorSequences = possessor?.humanPossessiveSequences
      ? possessor.humanPossessiveIsAmbiguous && possessor.sequences
        ? [...possessor.humanPossessiveSequences, ...possessor.sequences]
        : possessor.humanPossessiveSequences
      : possessor?.sequences;
    const humanPossessorHasAlt = Boolean(
      possessor?.humanPossessiveHasAlternatives ||
        possessor?.humanPossessiveIsAmbiguous
    );

    if (isHuman) {
      const humanSequences = humanSuffixes.flatMap((suffix) =>
        attachPossessor(buildHumanSequence(suffix), humanPossessorSequences)
      );
      sequences.push(
        ...attachDeterminer(humanSequences, determiners?.human)
      );
      if (humanSuffixes.length > 1) hasAmbiguity = true;
      if (humanPossessorHasAlt) hasAmbiguity = true;
      if (determiners?.hasAlternatives) hasAmbiguity = true;
      targetHumanity = "human";
      return {
        sequences,
        hasAmbiguity,
        targetHumanity,
        nonHumanCount: 0,
      };
    } else if (isPlace) {
      const nonHumanSequences = nonHumanSuffixes.map((suffix) =>
        buildNonHumanSequence(suffix, "CAUSE_SUFFIX")
      );
      sequences.push(
        ...attachDeterminer(
          nonHumanSequences.flatMap((seq) =>
            attachPossessor(seq, possessor?.sequences)
          ),
          determiners?.nonHuman
        )
      );
      if (nonHumanSuffixes.length > 1) hasAmbiguity = true;
      if (determiners?.hasAlternatives) hasAmbiguity = true;
      targetHumanity = "non-human";
      if (possessor?.altSequences && nonHumanSequences.length > 0) {
        possessiveAltSequences = nonHumanSequences.flatMap((seq) =>
          attachPossessor(seq, possessor.altSequences)
        );
        possessiveAltHasAmbiguity =
          possessor.altHasAlternatives || nonHumanSuffixes.length > 1;
      }
      return {
        sequences,
        hasAmbiguity,
        targetHumanity,
        nonHumanCount: nonHumanSuffixes.length * possessorCount,
        possessiveAltSequences,
        possessiveAltHasAmbiguity,
      };
    } else if (ambiguousHuman) {
      const nonHumanSequences = nonHumanSuffixes.map((suffix) =>
        buildNonHumanSequence(suffix, "CAUSE_NONHUMAN_ALT")
      );
      const humanSequences = humanSuffixes.map((suffix) =>
        buildHumanSequence(suffix)
      );
      sequences.push(
        ...attachDeterminer(
          nonHumanSequences.flatMap((seq) =>
            attachPossessor(seq, possessor?.sequences)
          ),
          determiners?.nonHuman
        ),
        ...attachDeterminer(
          humanSequences.flatMap((seq) =>
            attachPossessor(seq, humanPossessorSequences)
          ),
          determiners?.human
        )
      );
      hasAmbiguity = true;
      if (humanPossessorHasAlt) hasAmbiguity = true;
      if (determiners?.hasAlternatives) hasAmbiguity = true;
      targetHumanity = "ambiguous";
      if (possessor?.altSequences && nonHumanSequences.length > 0) {
        possessiveAltSequences = nonHumanSequences.flatMap((seq) =>
          attachPossessor(seq, possessor.altSequences)
        );
        possessiveAltHasAmbiguity =
          possessor.altHasAlternatives || nonHumanSuffixes.length > 1;
      }
      return {
        sequences,
        hasAmbiguity,
        targetHumanity,
        nonHumanCount: nonHumanSequences.length * possessorCount,
        possessiveAltSequences,
        possessiveAltHasAmbiguity,
      };
    } else {
      const nonHumanSequences = nonHumanSuffixes.map((suffix) =>
        buildNonHumanSequence(suffix, "CAUSE_SUFFIX")
      );
      sequences.push(
        ...attachDeterminer(
          nonHumanSequences.flatMap((seq) =>
            attachPossessor(seq, possessor?.sequences)
          ),
          determiners?.nonHuman
        )
      );
      if (nonHumanSuffixes.length > 1) hasAmbiguity = true;
      if (determiners?.hasAlternatives) hasAmbiguity = true;
      targetHumanity = "non-human";
      if (possessor?.altSequences && nonHumanSequences.length > 0) {
        possessiveAltSequences = nonHumanSequences.flatMap((seq) =>
          attachPossessor(seq, possessor.altSequences)
        );
        possessiveAltHasAmbiguity =
          possessor.altHasAlternatives || nonHumanSuffixes.length > 1;
      }
      return {
        sequences,
        hasAmbiguity,
        targetHumanity,
        nonHumanCount: nonHumanSequences.length * possessorCount,
        possessiveAltSequences,
        possessiveAltHasAmbiguity,
      };
    }
  };

  const parseTarget = (
    start: number
  ): {
    sequences: TranslationPart[][];
    consumed: number;
    hasAmbiguity: boolean;
    targetHumanity: CauseTargetHumanity;
    nonHumanCount: number;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } | null => {
    const parseVerbObjectAt = (
      cursor: number
    ): {
      sequences: TranslationPart[][];
      consumed: number;
      hasAmbiguity: boolean;
      targetHumanity: CauseTargetHumanity;
    } | null => {
      if (!tokens[cursor]) return null;
      let determinerConsumed = 0;
      let determinerHasAlternatives = false;
      let determinerSequences: TranslationPart[][] = [[]];
      const demoMatch = matchDemonstrativeToken(
        tokens[cursor]?.source ?? "",
        sourceLang
      );
      if (demoMatch) {
        const part = buildDefiniteArticlePart(
          demoMatch.gup,
          demoMatch.source,
          sourceLang
        );
        const alts = demoMatch.variants.filter((gup) => gup !== demoMatch.gup);
        if (alts.length > 0) {
          part.alternatives = alts.map((alt) => ({ gup: alt }));
          determinerHasAlternatives = true;
        }
        determinerSequences = [[part]];
        determinerConsumed = 1;
        cursor += 1;
      } else {
        const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
        if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
          determinerConsumed = articleMatch.consumed;
          cursor += articleMatch.consumed;
          if (articleMatch.kind === "definite") {
            determinerSequences = [
              [buildDefiniteArticlePart("dhuwala", articleMatch.source, sourceLang)],
              [buildDefiniteArticlePart("dhuwali", articleMatch.source, sourceLang)],
            ];
            determinerHasAlternatives = true;
          }
        }
      }
      const attachDeterminer = (
        sequences: TranslationPart[][]
      ): TranslationPart[][] => {
        if (
          determinerSequences.length === 1 &&
          determinerSequences[0].length === 0
        ) {
          return sequences;
        }
        const merged: TranslationPart[][] = [];
        for (const detSeq of determinerSequences) {
          for (const seq of sequences) {
            merged.push([...detSeq, ...seq]);
          }
        }
        return merged;
      };
      const demoToken = tokens[cursor];
      if (isNonHumanDemoPronoun(demoToken.source, sourceLang)) {
        const part = buildDefiniteArticlePart(
          "dhuwalaŋuwuy",
          demoToken.source,
          sourceLang
        );
        return {
          sequences: attachDeterminer([[part]]),
          consumed: determinerConsumed + 1,
          hasAmbiguity: false,
          targetHumanity: "non-human",
        };
      }
      const pronounMatch = matchBelongingPronounAt(
        tokens,
        cursor,
        sourceLang
      );
      if (pronounMatch) {
        const part = buildBelongingPronounPart(pronounMatch);
        if (!part) return null;
        return {
          sequences: attachDeterminer([[part]]),
          consumed: determinerConsumed + pronounMatch.consumed,
          hasAmbiguity:
            Boolean(part.alternatives?.length) || determinerHasAlternatives,
          targetHumanity: "human",
        };
      }
      const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
      if (!phrase) return null;
      const isHuman = phrase.noun.isHuman === true;
      const isNonHuman = phrase.noun.isHuman === false || phrase.noun.isPlace === true;
      const isAmbiguous = !isHuman && !isNonHuman;

      const buildSequencesForSuffixes = (
        suffixes: string[],
        noteKey: ExplanationKey
      ): TranslationPart[][] =>
        suffixes.map((suffix) =>
          buildNounPhraseParts(phrase, sourceLang, {
            suffix,
            nounNote: {
              key: noteKey,
              data: { token: phrase.noun.source, gup: suffix },
            },
          })
        );

      let sequences: TranslationPart[][] = [];
      let hasAmbiguity = false;
      let targetHumanity: CauseTargetHumanity = "ambiguous";

      if (isHuman) {
        const suffixes = getBelongingHumanSuffixes(phrase.noun.gup);
        sequences = attachDeterminer(
          buildSequencesForSuffixes(suffixes, "BELONGING_HUMAN_SUFFIX")
        );
        hasAmbiguity = suffixes.length > 1 || determinerHasAlternatives;
        targetHumanity = "human";
      } else if (isNonHuman) {
        const suffixes = getBelongingSuffixes(phrase.noun.gup);
        sequences = attachDeterminer(
          buildSequencesForSuffixes(suffixes, "BELONGING_SUFFIX")
        );
        hasAmbiguity = suffixes.length > 1 || determinerHasAlternatives;
        targetHumanity = "non-human";
      } else {
        const nonHuman = attachDeterminer(
          buildSequencesForSuffixes(
            getBelongingSuffixes(phrase.noun.gup),
            "BELONGING_SUFFIX"
          )
        );
        const human = attachDeterminer(
          buildSequencesForSuffixes(
            getBelongingHumanSuffixes(phrase.noun.gup),
            "BELONGING_HUMAN_SUFFIX"
          )
        );
        sequences = [...nonHuman, ...human];
        hasAmbiguity = true;
        targetHumanity = "ambiguous";
      }

      return {
        sequences,
        consumed: determinerConsumed + phrase.consumed,
        hasAmbiguity,
        targetHumanity,
      };
    };

    const parseVerbCause = (
      cursor: number
    ): {
      sequences: TranslationPart[][];
      consumed: number;
      hasAmbiguity: boolean;
      targetHumanity: CauseTargetHumanity;
    } | null => {
      let preferred: VerbMatch | null = null;
      let attachedObject: ObjectPronounMatch | null = null;
      const matches = matchVerbAt(tokens, cursor, sourceLang);
      if (matches.length > 0) {
        preferred = matches.reduce((best, match) =>
          match.consumed > best.consumed ? match : best
        );
      } else {
        const infinitiveMatch = matchInfinitiveAt(
          tokens as IRToken[],
          cursor,
          sourceLang
        );
        if (infinitiveMatch) {
          preferred = infinitiveMatch.match;
          attachedObject = infinitiveMatch.attachedObject;
        } else {
          const gerundMatch = matchGerundAfterIndex(
            tokens as IRToken[],
            cursor,
            sourceLang
          );
          if (gerundMatch && gerundMatch.gerundIndex === cursor) {
            preferred = gerundMatch.match;
            attachedObject = gerundMatch.attachedObject;
          } else {
            const split = splitVerbClitic(tokens[cursor]?.source ?? "", sourceLang);
            if (split) {
              const cliticMatch = matchObjectPronoun(split.clitic, sourceLang);
              if (cliticMatch) {
                const syntheticToken: TokenLike = { source: split.verb };
                const infinitiveMatches = matchVerbAt(
                  [syntheticToken],
                  0,
                  sourceLang
                ).filter((match) => match.kind === "infinitive");
                if (infinitiveMatches.length > 0) {
                  preferred = {
                    ...infinitiveMatches[0],
                    consumed: 1,
                    source: tokens[cursor].source,
                  };
                  attachedObject = cliticMatch;
                }
              }
            }
          }
        }
      }
      if (!preferred) return null;

      const baseCandidates = new Set<string>();
      const pushBase = (value?: string) => {
        if (value) baseCandidates.add(value);
      };
      pushBase(preferred.entry.gupForms[3]);
      pushBase(preferred.entry.gupForms[4]);
      pushBase(preferred.altGupForms?.[3]);
      pushBase(preferred.altGupForms?.[4]);
      if (baseCandidates.size === 0) {
        pushBase(preferred.entry.gupForms[0]);
        pushBase(preferred.entry.gup);
      }
      const bases = Array.from(baseCandidates);
      const verbVariants: string[] = [];
      for (const base of bases) {
        for (const suffix of getBelongingSuffixes(base)) {
          verbVariants.push(`${base}${suffix}`);
        }
      }
      if (verbVariants.length === 0) return null;

      let objectSequences: TranslationPart[][] = [[]];
      let objectConsumed = 0;
      let objectHasAmbiguity = false;
      let targetHumanity: CauseTargetHumanity = "ambiguous";

      if (attachedObject) {
        const persons = collectObjectPronounPersons(attachedObject);
        const part = buildBelongingPronounPartFromPersons(
          attachedObject.source,
          persons
        );
        if (part) {
          objectSequences = [[part]];
          objectConsumed = 0;
          objectHasAmbiguity = Boolean(part.alternatives?.length);
          targetHumanity = "human";
        }
      }

      const firstObject = parseVerbObjectAt(cursor + preferred.consumed);
      if (firstObject) {
        objectSequences = firstObject.sequences;
        objectConsumed = firstObject.consumed;
        objectHasAmbiguity = firstObject.hasAmbiguity;
        targetHumanity = firstObject.targetHumanity;

        let scan = cursor + preferred.consumed + objectConsumed;
        while (true) {
          const connector = matchConnectorAt(tokens, scan, sourceLang);
          if (!connector) break;
          const next = parseVerbObjectAt(scan + connector.consumed);
          if (!next) break;
          const connectorPart = buildConnectorPart(connector, sourceLang);
          const merged: TranslationPart[][] = [];
          for (const seq of objectSequences) {
            for (const nextSeq of next.sequences) {
              merged.push([...seq, connectorPart, ...nextSeq]);
            }
          }
          objectSequences = merged;
          objectConsumed += connector.consumed + next.consumed;
          scan += connector.consumed + next.consumed;
          if (next.hasAmbiguity) objectHasAmbiguity = true;
          if (targetHumanity !== next.targetHumanity) {
            targetHumanity = "ambiguous";
          }
        }
      }

      let agentSequences: TranslationPart[][] | null = null;
      let agentConsumed = 0;
      let agentHasAmbiguity = false;
      const agentStart = cursor + preferred.consumed + objectConsumed;
      const agentPhrase = matchOriginPhraseAt(tokens, agentStart, sourceLang);
      if (agentPhrase) {
        agentSequences = agentPhrase.sequences;
        agentConsumed = agentPhrase.consumed;
        agentHasAmbiguity = agentPhrase.hasAmbiguity;
      }

      const sequences: TranslationPart[][] = [];
      for (const variant of verbVariants) {
        const verbPart = createVerbPart(
          preferred,
          sourceLang,
          variant,
          "CAUSE_SUFFIX"
        );
        for (const objectSeq of objectSequences) {
          if (agentSequences) {
            for (const agentSeq of agentSequences) {
              sequences.push([verbPart, ...objectSeq, ...agentSeq]);
            }
          } else {
            sequences.push([verbPart, ...objectSeq]);
          }
        }
      }

      return {
        sequences,
        consumed: preferred.consumed + objectConsumed + agentConsumed,
        hasAmbiguity:
          objectHasAmbiguity || verbVariants.length > 1 || agentHasAmbiguity,
        targetHumanity,
      };
    };

    const verbCause = parseVerbCause(start);
    if (verbCause) {
      return {
        sequences: verbCause.sequences,
        consumed: verbCause.consumed,
        hasAmbiguity: verbCause.hasAmbiguity,
        targetHumanity: verbCause.targetHumanity,
        nonHumanCount: 0,
      };
    }

    let cursor = start;
    debugLog("cause:target-start", {
      start,
      token: tokens[cursor]?.source,
      sourceLang,
    });
    let determinerConsumed = 0;
    let determinerHasAlternatives = false;
    let humanDeterminers: TranslationPart[][] = [[]];
    let nonHumanDeterminers: TranslationPart[][] = [[]];
    const demoMatch = matchDemonstrativeToken(
      tokens[cursor]?.source ?? "",
      sourceLang
    );
    const buildDhiyaNguDemoPart = (source: string, kind: "this" | "that") => {
      const primary = kind === "that" ? "dhiyaŋi" : "dhiyaŋu";
      const part = buildDefiniteArticlePart(primary, source, sourceLang);
      if (kind === "that") {
        part.alternatives = [{ gup: "ŋuriŋi" }, { gup: "ŋuruŋu" }];
      }
      return addThatVisibilityNote(part, kind);
    };
    if (demoMatch) {
      determinerConsumed = 1;
      humanDeterminers = [
        [buildDefiniteArticlePart("dhiyakala", demoMatch.source, sourceLang)],
      ];
      nonHumanDeterminers = [
        [buildDhiyaNguDemoPart(demoMatch.source, demoMatch.kind)],
      ];
    } else {
      const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
      if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
        determinerConsumed = articleMatch.consumed;
        if (articleMatch.kind === "definite") {
          humanDeterminers = [
            [buildDefiniteArticlePart("dhiyakala", articleMatch.source, sourceLang)],
          ];
          nonHumanDeterminers = [
            [buildDefiniteArticlePart("dhiyaŋu", articleMatch.source, sourceLang)],
          ];
          determinerHasAlternatives = true;
        }
      }
    }
    cursor += determinerConsumed;
    if (determinerConsumed > 0 && !tokens[cursor]) {
      return {
        sequences: nonHumanDeterminers,
        consumed: determinerConsumed,
        hasAmbiguity: determinerHasAlternatives,
        targetHumanity: "non-human",
        nonHumanCount: nonHumanDeterminers.length,
      };
    }
    const demoToken = tokens[cursor];
    if (demoToken && isNonHumanDemoPronoun(demoToken.source, sourceLang)) {
      const demoMatch = matchDemonstrativeToken(demoToken.source, sourceLang);
      const demoPart = buildDhiyaNguDemoPart(
        demoToken.source,
        demoMatch?.kind === "that" ? "that" : "this"
      );
      const sequences =
        determinerConsumed > 0 && nonHumanDeterminers.length > 0
          ? nonHumanDeterminers
          : [[demoPart]];
      return {
        sequences,
        consumed: determinerConsumed + 1,
        hasAmbiguity: determinerHasAlternatives,
        targetHumanity: "non-human",
        nonHumanCount: sequences.length,
      };
    }
    const objectPronoun = matchObjectPronoun(
      tokens[cursor]?.source ?? "",
      sourceLang
    );
    if (objectPronoun?.primaryKey) {
      debugLog("cause:object-pronoun", {
        token: tokens[cursor]?.source,
        sourceLang,
      });
      const persons = collectObjectPronounPersons(objectPronoun);
      const part = buildCausePronounPart(objectPronoun.source, persons);
      if (part) {
        return {
          sequences: [[part]],
          consumed: determinerConsumed + 1,
          hasAmbiguity: Boolean(part.alternatives?.length),
          targetHumanity: "human",
          nonHumanCount: 0,
        };
      }
    }
    const possPronoun = matchPossessiveOfPronoun(
      tokens[cursor]?.source ?? "",
      sourceLang
    );
    if (possPronoun) {
      debugLog("cause:possessive-pronoun", {
        token: tokens[cursor]?.source,
        sourceLang,
      });
      const persons = collectPossessivePersons(possPronoun);
      const part = buildCausePronounPart(possPronoun.source, persons);
      if (part) {
        return {
          sequences: [[part]],
          consumed: determinerConsumed + 1,
          hasAmbiguity: Boolean(part.alternatives?.length),
          targetHumanity: "human",
          nonHumanCount: 0,
        };
      }
    }

    const possessorPrefix = matchPossessorBeforeNoun(
      tokens,
      cursor,
      sourceLang,
      // options
    );
    if (possessorPrefix) {
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        cursor + possessorPrefix.consumed,
        sourceLang
      );
      if (!phrase) return null;
      const built = buildPhraseSequences(phrase, possessorPrefix, {
        human: humanDeterminers,
        nonHuman: nonHumanDeterminers,
        hasAlternatives: determinerHasAlternatives,
      });
      return {
        sequences: built.sequences,
        consumed: determinerConsumed + possessorPrefix.consumed + phrase.consumed,
        hasAmbiguity: built.hasAmbiguity,
        targetHumanity: built.targetHumanity,
        nonHumanCount: built.nonHumanCount,
        possessiveAltSequences: built.possessiveAltSequences,
        possessiveAltHasAmbiguity: built.possessiveAltHasAmbiguity,
      };
    }

    const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
    if (!phrase) return null;
    const afterIndex = cursor + phrase.consumed;
    let possessor: PossessorAfterOfMatch | null = null;
    if (isOfConnectorToken(tokens[afterIndex], sourceLang)) {
      possessor = matchPossessorAfterOf(
        tokens,
        afterIndex + 1,
        sourceLang,
        // option
      );
    }
    const {
      sequences,
      hasAmbiguity,
      targetHumanity,
      nonHumanCount,
      possessiveAltSequences,
      possessiveAltHasAmbiguity,
    } = buildPhraseSequences(phrase, possessor, {
      human: humanDeterminers,
      nonHuman: nonHumanDeterminers,
      hasAlternatives: determinerHasAlternatives,
    });
    const consumed =
      determinerConsumed +
      phrase.consumed +
      (possessor ? 1 + possessor.consumed : 0);
    return {
      sequences,
      consumed,
      hasAmbiguity,
      targetHumanity,
      nonHumanCount,
      possessiveAltSequences,
      possessiveAltHasAmbiguity,
    };
  };

  const initial = parseTarget(index + preposition.consumed);
  if (!initial) {
    debugLog("cause:parse-null", {
      index,
      start: index + preposition.consumed,
      token: tokens[index + preposition.consumed]?.source,
      sourceLang,
    });
  }
  if (!initial) return null;
  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;
  let targetHumanity = initial.targetHumanity;
  let possessiveAltSequences = initial.possessiveAltSequences;
  let possessiveAltHasAmbiguity =
    initial.possessiveAltHasAmbiguity ?? false;

  let cursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(cursor + connector.consumed);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    cursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
    if (targetHumanity !== next.targetHumanity) {
      targetHumanity = "ambiguous";
    }
    if (possessiveAltSequences && next.possessiveAltSequences) {
      const mergedAlt: TranslationPart[][] = [];
      for (const seq of possessiveAltSequences) {
        for (const nextSeq of next.possessiveAltSequences) {
          mergedAlt.push([...seq, connectorPart, ...nextSeq]);
        }
      }
      possessiveAltSequences = mergedAlt;
      possessiveAltHasAmbiguity =
        possessiveAltHasAmbiguity ||
        Boolean(next.possessiveAltHasAmbiguity);
    } else {
      possessiveAltSequences = undefined;
    }
  }

  return {
    sequences,
    consumed,
    hasAmbiguity,
    targetHumanity,
    preposition,
    possessiveAltSequences,
    possessiveAltHasAmbiguity,
  };
}

type PurposeTargetHumanity = "human" | "non-human" | "ambiguous";

export function matchPurposePhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAmbiguity: boolean;
  preposition: { consumed: number; source: string; normalized: string };
  targetHumanity: PurposeTargetHumanity;
} | null {
  const preposition = matchPurposePrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;

  const buildPurposePronounPart = (
    match: ReturnType<typeof matchPossessiveOfPronoun>,
    options?: {
      emphatic?: boolean;
      sourceOverride?: string;
      includeNonEmphatic?: boolean;
    }
  ) => {
    if (!match) return null;
    const basePart = buildPossessivePronounPart(match, sourceLang, options);
    if (!basePart) return null;
    const explanations: ExplanationPayload[] = (basePart.explanations ?? []).map(
      (exp) =>
        exp.key === "POSSESSION_PRONOUN"
          ? { ...exp, key: "PURPOSE_PRONOUN" as ExplanationKey }
          : exp.key === "POSSESSION_PRONOUN_EMPHATIC"
          ? { ...exp, key: "PURPOSE_PRONOUN" as ExplanationKey }
          : exp
    );
    return { ...basePart, explanations };
  };

  const buildPhraseSequences = (
    phrase: NounPhraseMatch,
    prefixParts: TranslationPart[] = []
  ): { sequences: TranslationPart[][]; hasAmbiguity: boolean } => {
    const suffixes = getPossessiveSuffixes(phrase.noun.gup);
    const sequences = suffixes.map((suffix) => {
      const parts = buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: "PURPOSE_SUFFIX",
          data: {
            token: phrase.noun.source,
            gup: applyPossessiveSuffix(phrase.noun.gup, suffix),
          },
        },
      });
      return prefixParts.length > 0 ? [...prefixParts, ...parts] : parts;
    });
    return { sequences, hasAmbiguity: suffixes.length > 1 };
  };

  const parseTarget = (
    start: number
  ): {
    sequences: TranslationPart[][];
    consumed: number;
    hasAmbiguity: boolean;
    targetHumanity: PurposeTargetHumanity;
  } | null => {
    const verbMatches = matchVerbAt(tokens, start, sourceLang);
    const infinitiveMatch = matchInfinitiveAt(tokens as IRToken[], start, sourceLang);
    const gerundMatch = matchGerundAfterIndex(tokens as IRToken[], start, sourceLang);
    if (
      verbMatches.length > 0 ||
      infinitiveMatch ||
      (gerundMatch && gerundMatch.gerundIndex === start) ||
      splitVerbClitic(tokens[start]?.source ?? "", sourceLang)
    ) {
      return null;
    }
    let cursor = start;

    const possessorPrefix = matchPossessorBeforeNoun(
      tokens,
      cursor,
      sourceLang,
      options
    );
    if (possessorPrefix) {
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        cursor + possessorPrefix.consumed,
        sourceLang
      );
      if (!phrase) return null;
      const built = buildPhraseSequences(phrase);
      const sequences = possessorPrefix.sequences.flatMap((prefixSeq) =>
        built.sequences.map((nounSeq) => [...prefixSeq, ...nounSeq])
      );
      return {
        sequences,
        consumed: possessorPrefix.consumed + phrase.consumed,
        hasAmbiguity: built.hasAmbiguity || possessorPrefix.hasAlternatives,
        targetHumanity: phrase.noun.isHuman === true
          ? "human"
          : phrase.noun.isHuman === false || phrase.noun.isPlace === true
            ? "non-human"
            : "ambiguous",
      };
    }
    let prefixParts: TranslationPart[] = [];
    const determiner = matchDhiyakuDeterminerAt(tokens, cursor, sourceLang);
    if (determiner) {
      if (determiner.part) prefixParts = [determiner.part];
      cursor += determiner.consumed;
    }
    const token = tokens[cursor];
    if (!token) {
      if (determiner?.part) {
        return {
          sequences: [[determiner.part]],
          consumed: determiner.consumed,
          hasAmbiguity: false,
          targetHumanity: "non-human",
        };
      }
      return null;
    }
    if (isNonHumanDemoPronoun(token.source, sourceLang)) {
      const demoMatch = matchDemonstrativeToken(token.source, sourceLang);
      const demoPart = buildDefiniteArticlePart(
        demoMatch?.kind === "that" ? "dhiyaki" : "dhiyaku",
        token.source,
        sourceLang
      );
      return {
        sequences: [[demoPart]],
        consumed: (determiner?.consumed ?? 0) + 1,
        hasAmbiguity: false,
        targetHumanity: "non-human",
      };
    }
    const pronounMatch = matchPossessiveOfPronoun(token.source, sourceLang);
    const emphasis = pronounMatch
      ? matchPossessiveEmphasisAt(tokens, cursor, sourceLang)
      : null;
    const isReflexive =
      Boolean(emphasis) && isReflexivePossessive(pronounMatch as any, options?.reflexivePersons);
    const pronounPart = buildPurposePronounPart(pronounMatch, {
      emphatic: Boolean(emphasis),
      sourceOverride: emphasis?.source,
      includeNonEmphatic: Boolean(emphasis) && !isReflexive,
    });
    if (pronounPart) {
      const built = isReflexive
        ? buildReflexivePossessiveSequences(
            pronounPart,
            sourceLang,
            options?.reflexivePersons,
            options?.reflexiveSubjectRepeat
          )
        : {
            sequences: [[pronounPart]],
            hasAmbiguity: Boolean(pronounPart.alternatives?.length),
          };
      return {
        sequences: built.sequences,
        consumed: (determiner?.consumed ?? 0) + 1 + (emphasis?.consumed ?? 0),
        hasAmbiguity: built.hasAmbiguity,
        targetHumanity: "human",
      };
    }
    const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
    if (!phrase) {
      if (determiner?.part) {
        return {
          sequences: [[determiner.part]],
          consumed: determiner.consumed,
          hasAmbiguity: false,
          targetHumanity: "non-human",
        };
      }
      return null;
    }
    const { sequences, hasAmbiguity } = buildPhraseSequences(phrase, prefixParts);
    let targetHumanity: PurposeTargetHumanity = "ambiguous";
    if (phrase.noun.isHuman === true) {
      targetHumanity = "human";
    } else if (phrase.noun.isHuman === false || phrase.noun.isPlace === true) {
      targetHumanity = "non-human";
    }
    const consumed = (determiner?.consumed ?? 0) + phrase.consumed;
    return { sequences, consumed, hasAmbiguity, targetHumanity };
  };

  const initial = parseTarget(index + preposition.consumed);
  if (!initial) return null;
  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;
  let targetHumanity = initial.targetHumanity;

  let cursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(cursor + connector.consumed);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    cursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
    if (targetHumanity !== next.targetHumanity) {
      targetHumanity = "ambiguous";
    }
  }

  return { sequences, consumed, hasAmbiguity, preposition, targetHumanity };
}

export function matchActVerbPhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { sequences: TranslationPart[][]; consumed: number; hasAmbiguity: boolean } | null {
  const preposition = matchActVerbPrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;

  const resolveVerbMatch = (
    cursor: number
  ): { match: VerbMatch; attachedObject: ObjectPronounMatch | null } | null => {
    const split = splitVerbClitic(tokens[cursor]?.source ?? "", sourceLang);
    if (split) {
      const cliticMatch = matchObjectPronoun(split.clitic, sourceLang);
      if (cliticMatch) {
        const syntheticToken: TokenLike = { source: split.verb };
        const cliticMatches = matchVerbAt(
          [syntheticToken],
          0,
          sourceLang
        );
        if (cliticMatches.length > 0) {
          const preferred = cliticMatches.reduce((best, match) => {
            if (match.kind === "infinitive" && best.kind !== "infinitive") return match;
            if (match.kind === "gerund" && best.kind !== "infinitive") return match;
            return (match.consumed ?? 1) > (best.consumed ?? 1) ? match : best;
          });
          return {
            match: {
              ...preferred,
              consumed: 1,
              source: tokens[cursor].source,
            },
            attachedObject: cliticMatch,
          };
        }
      }
    }
    const matches = matchVerbAt(tokens, cursor, sourceLang);
    if (matches.length > 0) {
      const preferred = matches.reduce((best, match) =>
        (match.consumed ?? 1) > (best.consumed ?? 1) ? match : best
      );
      return { match: preferred, attachedObject: null };
    }
    const infinitiveMatch = matchInfinitiveAt(
      tokens as IRToken[],
      cursor,
      sourceLang
    );
    if (infinitiveMatch) return infinitiveMatch;
    const gerundMatch = matchGerundAfterIndex(
      tokens as IRToken[],
      cursor,
      sourceLang
    );
    if (gerundMatch && gerundMatch.gerundIndex === cursor) {
      return { match: gerundMatch.match, attachedObject: gerundMatch.attachedObject };
    }
    return null;
  };

  let cursor = index + preposition.consumed;
  let consumed = preposition.consumed;
  let sequences: TranslationPart[][] = [[]];
  let hasAmbiguity = false;
  let matchedVerb = false;

  while (true) {
    const resolved = resolveVerbMatch(cursor);
    if (!resolved) break;
    matchedVerb = true;
    const preferred = resolved.match;
    const attachedObject = resolved.attachedObject;
    const verbConsumed = preferred.consumed ?? 1;

    const baseCandidates = new Set<string>();
    const pushBase = (value?: string) => {
      if (value) baseCandidates.add(value);
    };
    pushBase(preferred.entry.gupForms[3]);
    pushBase(preferred.altGupForms?.[3]);
    if (baseCandidates.size === 0) {
      pushBase(preferred.entry.gupForms[4]);
      pushBase(preferred.altGupForms?.[4]);
    }
    if (baseCandidates.size === 0) {
      pushBase(preferred.entry.gupForms[0]);
      pushBase(preferred.entry.gup);
    }
    const bases = Array.from(baseCandidates);
    const verbParts: TranslationPart[] = [];
    for (const base of bases) {
      const suffixes = getBelongingSuffixes(base);
      if (suffixes.length === 0) continue;
      const primary = `${base}${suffixes[0]}`;
      const alternatives = [
        ...suffixes.slice(1).map((suffix) => `${base}${suffix}`),
        base,
      ];
      verbParts.push(
        createVerbPart(preferred, sourceLang, primary, "VERB_ACT", alternatives)
      );
      if (alternatives.length > 0) hasAmbiguity = true;
    }
    if (verbParts.length === 0) break;
    if (verbParts.length > 1) hasAmbiguity = true;

    const allowNonHumanDemonstrative = Boolean(preferred.entry.isTransitive);
    const preObject = buildObjectSequencesFromMatch(attachedObject, sourceLang, {
      allowNonHumanDemonstrative,
    });
    const afterObjects = collectObjectSequencesAfterVerb(
      tokens,
      cursor + verbConsumed,
      sourceLang,
      { comitativePossessive: true, allowNonHumanDemonstrative }
    );
    if (afterObjects.hasAmbiguity || preObject.hasDrop) {
      hasAmbiguity = true;
    }
    const objectSequences = appendObjectSequences(
      preObject.sequences,
      afterObjects.sequences
    );
    const verbSequences: TranslationPart[][] = [];
    for (const verbPart of verbParts) {
      for (const objSeq of objectSequences) {
        verbSequences.push([verbPart, ...objSeq]);
      }
    }

    sequences = appendObjectSequences(sequences, verbSequences);
    consumed += verbConsumed + afterObjects.consumed;
    cursor = index + consumed;

    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    sequences = sequences.map((seq) => [...seq, connectorPart]);
    consumed += connector.consumed;
    cursor = index + consumed;
    hasAmbiguity = true;
  }

  if (!matchedVerb || sequences.length === 0) return null;
  return { sequences, consumed, hasAmbiguity };
}

type BelongingTargetHumanity = "human" | "non-human" | "ambiguous";

const buildBelongingPhraseSequences = (
  phrase: NounPhraseMatch,
  targetHumanity: BelongingTargetHumanity,
  sourceLang: LanguageMode,
  possessor?: PossessorAfterOfMatch | null
): { sequences: TranslationPart[][]; hasAmbiguity: boolean } => {
  const buildSequences = (
    suffixes: string[],
    noteKey: ExplanationKey,
    possessorSequences?: TranslationPart[][]
  ) => {
    const nounSeqs = suffixes.map((suffix) =>
      buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: noteKey,
          data: {
            token: phrase.noun.source,
            gup: applySuffixToGup(phrase.noun.gup, suffix),
          },
        },
      })
    );
    if (!possessorSequences || possessorSequences.length === 0) return nounSeqs;
    return possessorSequences.flatMap((possSeq) =>
      nounSeqs.map((nounSeq) => [...possSeq, ...nounSeq])
    );
  };

  const possessorSequences = possessor?.sequences;
  const possessorHasAlt = Boolean(possessor?.hasAlternatives);
  const humanPossessorSequences = possessor?.belongingHumanPossessiveSequences
    ? possessor.belongingHumanPossessiveIsAmbiguous && possessor.sequences
      ? [...possessor.belongingHumanPossessiveSequences, ...possessor.sequences]
      : possessor.belongingHumanPossessiveSequences
    : possessor?.sequences;
  const humanPossessorHasAlt = Boolean(
    possessor?.belongingHumanPossessiveHasAlternatives ||
      possessor?.belongingHumanPossessiveIsAmbiguous
  );

  if (targetHumanity === "human") {
    const suffixes = getBelongingHumanSuffixes(phrase.noun.gup);
    return {
      sequences: buildSequences(
        suffixes,
        possessor ? "BELONGING_POSSESSION_HUMAN_SUFFIX" : "BELONGING_HUMAN_SUFFIX",
        humanPossessorSequences
      ),
      hasAmbiguity: suffixes.length > 1 || humanPossessorHasAlt,
    };
  }
  if (targetHumanity === "non-human") {
    const suffixes = getBelongingSuffixes(phrase.noun.gup);
    const baseSequences = buildSequences(
      suffixes,
      "BELONGING_SUFFIX",
      possessorSequences
    );
    const humanPossessorSequences =
      possessor?.belongingHumanPossessiveSequences &&
      possessor.belongingHumanPossessiveIsAmbiguous &&
      possessor.sequences
        ? [
            ...possessor.belongingHumanPossessiveSequences,
            ...possessor.sequences,
          ]
        : possessor?.belongingHumanPossessiveSequences;
    const humanSequences =
      humanPossessorSequences && humanPossessorSequences.length > 0
        ? buildSequences(suffixes, "BELONGING_SUFFIX", humanPossessorSequences)
        : [];
    return {
      sequences:
        humanSequences.length > 0
          ? [...baseSequences, ...humanSequences]
          : baseSequences,
      hasAmbiguity:
        suffixes.length > 1 ||
        possessorHasAlt ||
        Boolean(
          possessor?.belongingHumanPossessiveHasAlternatives ||
            possessor?.belongingHumanPossessiveIsAmbiguous
        ),
    };
  }
  const nonHuman = getBelongingSuffixes(phrase.noun.gup);
  const human = getBelongingHumanSuffixes(phrase.noun.gup);
  const sequences = [
    ...buildSequences(nonHuman, "BELONGING_SUFFIX", possessorSequences),
    ...buildSequences(
      human,
      possessor ? "BELONGING_POSSESSION_HUMAN_SUFFIX" : "BELONGING_HUMAN_SUFFIX",
      humanPossessorSequences
    ),
  ];
  return {
    sequences,
    hasAmbiguity: sequences.length > 1 || possessorHasAlt || humanPossessorHasAlt,
  };
};

function matchBelongingPhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  prepositionMatcher: (
    tokens: TokenLike[],
    index: number,
    sourceLang: LanguageMode
  ) => { consumed: number; source: string; normalized: string } | null
): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAmbiguity: boolean;
  preposition: { consumed: number; source: string; normalized: string };
  targetHumanity: BelongingTargetHumanity;
} | null {
  const preposition = prepositionMatcher(tokens, index, sourceLang);
  if (!preposition) return null;

  const parseTarget = (
    start: number
  ): {
    sequences: TranslationPart[][];
    consumed: number;
    hasAmbiguity: boolean;
    targetHumanity: BelongingTargetHumanity;
  } | null => {
    let cursor = start;
    let determinerConsumed = 0;
    let determinerHasAlternatives = false;
    let humanDeterminers: TranslationPart[][] = [[]];
    let nonHumanDeterminers: TranslationPart[][] = [[]];
    const buildBelongingDeterminerPart = (
      gup: string,
      source: string,
      alternatives?: string[],
      kind?: DemonstrativeKind
    ): TranslationPart => {
      const part = buildDefiniteArticlePart(gup, source, sourceLang);
      if (alternatives && alternatives.length > 0) {
        part.alternatives = alternatives.map((alt) => ({ gup: alt }));
      }
      return addThatVisibilityNote(part, kind);
    };
    const demoToken = tokens[cursor];
    const demoMatch = demoToken
      ? matchDemonstrativeToken(demoToken.source, sourceLang)
      : null;
    if (demoMatch) {
      humanDeterminers = [
        [
          buildBelongingDeterminerPart(
            "dhiyakalaŋuwuy",
            demoToken.source,
            demoMatch.kind === "that"
              ? ["ŋurikalaŋuwuy", "ŋurukalaŋuwuy"]
              : undefined,
            demoMatch.kind
          ),
        ],
      ];
      if (demoMatch.kind === "that") {
        nonHumanDeterminers = [
          [
            buildBelongingDeterminerPart("dhuwaliŋuwuy", demoToken.source, [
              "ŋunhiŋuwuy",
              "ŋunhaŋuwuy",
            ], demoMatch.kind),
          ],
        ];
        determinerHasAlternatives = true;
      } else {
        nonHumanDeterminers = [
          [buildBelongingDeterminerPart("dhuwalaŋuwuy", demoToken.source)],
        ];
      }
      cursor += 1;
      determinerConsumed = 1;
    } else {
      const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
      if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
        cursor += articleMatch.consumed;
        determinerConsumed = articleMatch.consumed;
        if (articleMatch.kind === "definite") {
          humanDeterminers = [
            [
              buildBelongingDeterminerPart("dhiyakalaŋuwuy", articleMatch.source),
            ],
          ];
          nonHumanDeterminers = [
            [
              buildBelongingDeterminerPart("dhuwalaŋuwuy", articleMatch.source),
            ],
          ];
          determinerHasAlternatives = false;
        }
      }
    }
    if (isNonHumanDemoPronoun(tokens[cursor]?.source ?? "", sourceLang)) {
      if (determinerConsumed === 0) {
        nonHumanDeterminers = [
          [
            buildBelongingDeterminerPart(
              "dhuwaliŋuwuy",
              tokens[cursor]?.source ?? "",
              ["ŋunhiŋuwuy", "ŋunhaŋuwuy"],
              "that"
            ),
          ],
        ];
        determinerHasAlternatives = true;
      }
      return {
        sequences: nonHumanDeterminers,
        consumed: determinerConsumed + 1,
        hasAmbiguity: determinerHasAlternatives,
        targetHumanity: "non-human",
      };
    }
    const attachDeterminer = (
      sequences: TranslationPart[][],
      determinerSequences: TranslationPart[][]
    ): TranslationPart[][] => {
      if (determinerSequences.length === 0) return [];
      if (determinerSequences.length === 1 && determinerSequences[0].length === 0) {
        return sequences;
      }
      const merged: TranslationPart[][] = [];
      for (const detSeq of determinerSequences) {
        for (const seq of sequences) {
          merged.push([...detSeq, ...seq]);
        }
      }
      return merged;
    };
    const pronounMatch = matchBelongingPronounAt(tokens, cursor, sourceLang);
    if (pronounMatch) {
      const part = buildBelongingPronounPart(pronounMatch);
      if (!part) return null;
      return {
        sequences: attachDeterminer([[part]], humanDeterminers),
        consumed: determinerConsumed + pronounMatch.consumed,
        hasAmbiguity:
          Boolean(part.alternatives?.length) || determinerHasAlternatives,
        targetHumanity: "human",
      };
    }
    const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
    if (!phrase) {
      if (determinerConsumed > 0) {
        return {
          sequences: nonHumanDeterminers,
          consumed: determinerConsumed,
          hasAmbiguity: determinerHasAlternatives,
          targetHumanity: "non-human",
        };
      }
      return null;
    }
    const afterPhrase = cursor + phrase.consumed;
    const possessor = isOfConnectorToken(tokens[afterPhrase], sourceLang)
      ? matchPossessorAfterOf(tokens, afterPhrase + 1, sourceLang,
        //  options 
        )
      : null;
    let targetHumanity: BelongingTargetHumanity = "ambiguous";
    if (phrase.noun.isHuman === true) {
      targetHumanity = "human";
    } else if (phrase.noun.isHuman === false || phrase.noun.isPlace === true) {
      targetHumanity = "non-human";
    }
    let sequences: TranslationPart[][] = [];
    let hasAmbiguity = determinerHasAlternatives;
    if (targetHumanity === "human") {
      const human = buildBelongingPhraseSequences(
        phrase,
        "human",
        sourceLang,
        possessor
      );
      sequences = attachDeterminer(human.sequences, humanDeterminers);
      hasAmbiguity = hasAmbiguity || human.hasAmbiguity;
    } else if (targetHumanity === "non-human") {
      const nonHuman = buildBelongingPhraseSequences(
        phrase,
        "non-human",
        sourceLang,
        possessor
      );
      sequences = attachDeterminer(nonHuman.sequences, nonHumanDeterminers);
      hasAmbiguity = hasAmbiguity || nonHuman.hasAmbiguity;
    } else {
      const nonHuman = buildBelongingPhraseSequences(
        phrase,
        "non-human",
        sourceLang,
        possessor
      );
      const human = buildBelongingPhraseSequences(
        phrase,
        "human",
        sourceLang,
        possessor
      );
      const nonHumanSeqs = attachDeterminer(
        nonHuman.sequences,
        nonHumanDeterminers
      );
      const humanSeqs = attachDeterminer(human.sequences, humanDeterminers);
      sequences = [...nonHumanSeqs, ...humanSeqs];
      hasAmbiguity = true || nonHuman.hasAmbiguity || human.hasAmbiguity;
    }
    return {
      sequences,
      consumed:
        determinerConsumed +
        phrase.consumed +
        (possessor ? 1 + possessor.consumed : 0),
      hasAmbiguity,
      targetHumanity,
    };
  };

  const initial = parseTarget(index + preposition.consumed);
  if (!initial) return null;
  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;
  let targetHumanity = initial.targetHumanity;

  let cursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(cursor + connector.consumed);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    cursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
    if (targetHumanity !== next.targetHumanity) {
      targetHumanity = "ambiguous";
    }
  }

  return { sequences, consumed, hasAmbiguity, preposition, targetHumanity };
}

export function matchBelongingPurposePhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
) {
  return matchBelongingPhraseAt(
    tokens,
    index,
    sourceLang,
    matchPurposePrepositionAt
  );
}

export function matchBelongingAboutPhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
) {
  return matchBelongingPhraseAt(
    tokens,
    index,
    sourceLang,
    matchAboutPrepositionAt
  );
}

export function matchPurposeAmbiguousAltAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  preposition: { consumed: number; source: string; normalized: string },
  hasMotionVerb: boolean,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): { sequences: TranslationPart[][]; consumed: number; hasAmbiguity: boolean } | null {
  if (sourceLang !== "es") return null;
  if (preposition.normalized !== "por" || preposition.consumed !== 1) return null;
  const replacement = hasMotionVerb ? "de" : "en";
  const swapped = tokens.map((token, idx) =>
    idx === index ? { source: replacement } : token
  );
  const result = hasMotionVerb
    ? matchAblativePhraseAt(swapped, index, sourceLang, options)
    : matchLocativePhraseAt(swapped, index, sourceLang, options);
  if (!result) return null;
  const sequences = result.sequences.filter((sequence) => {
    if (hasMotionVerb) {
      return !sequence.some(
        (part) => part.appliedSuffix?.endsWith("ŋuŋuru") ?? false
      );
    }
    return !sequence.some((part) =>
      part.explanations?.some((exp) => exp.key === "COMITATIVE_SUFFIX")
    );
  });
  return {
    sequences,
    consumed: result.consumed,
    hasAmbiguity: result.hasAmbiguity || sequences.length > 1,
  };
}

type IndirectTargetHumanity = "human" | "non-human" | "ambiguous";

export function matchIndirectPhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAmbiguity: boolean;
  preposition: { consumed: number; source: string; normalized: string };
  targetHumanity: IndirectTargetHumanity;
  directAltSequences?: TranslationPart[][];
} | null {
  const preposition = matchIndirectPrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;

  const buildIndirectPronounPart = (
    match: ReturnType<typeof matchPossessiveOfPronoun>,
    options?: {
      emphatic?: boolean;
      sourceOverride?: string;
      includeNonEmphatic?: boolean;
    }
  ): TranslationPart | null => {
    if (!match) return null;
    const basePart = buildPossessivePronounPart(match, sourceLang, options);
    if (!basePart) return null;
    const explanations: ExplanationPayload[] = (basePart.explanations ?? []).map(
      (exp) =>
        exp.key === "POSSESSION_PRONOUN"
          ? { ...exp, key: "INDIRECT_PRONOUN" as ExplanationKey }
          : exp.key === "POSSESSION_PRONOUN_EMPHATIC"
          ? { ...exp, key: "INDIRECT_PRONOUN" as ExplanationKey }
          : exp
    );
    return { ...basePart, explanations };
  };

  const buildPhraseSequences = (
    phrase: NounPhraseMatch,
    prefixParts: TranslationPart[] = []
  ): { sequences: TranslationPart[][]; hasAmbiguity: boolean } => {
    const suffixes = getPossessiveSuffixes(phrase.noun.gup);
    const sequences = suffixes.map((suffix) => {
      const parts = buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: "INDIRECT_SUFFIX",
          data: {
            token: phrase.noun.source,
            gup: applyPossessiveSuffix(phrase.noun.gup, suffix),
          },
        },
      });
      return prefixParts.length > 0 ? [...prefixParts, ...parts] : parts;
    });
    return { sequences, hasAmbiguity: suffixes.length > 1 };
  };

  const parseTarget = (
    start: number
  ): {
    sequences: TranslationPart[][];
    consumed: number;
    hasAmbiguity: boolean;
    targetHumanity: IndirectTargetHumanity;
    directAltSequences?: TranslationPart[][];
  } | null => {
    let cursor = start;
    const possessorPrefix = matchPossessorBeforeNoun(
      tokens,
      cursor,
      sourceLang,
      options
    );
    if (possessorPrefix) {
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        cursor + possessorPrefix.consumed,
        sourceLang
      );
      if (!phrase) return null;
      const built = buildPhraseSequences(phrase);
      const sequences = possessorPrefix.sequences.flatMap((prefixSeq) =>
        built.sequences.map((nounSeq) => [...prefixSeq, ...nounSeq])
      );
      return {
        sequences,
        consumed: possessorPrefix.consumed + phrase.consumed,
        hasAmbiguity: built.hasAmbiguity || possessorPrefix.hasAlternatives,
        targetHumanity: phrase.noun.isHuman === true
          ? "human"
          : phrase.noun.isHuman === false || phrase.noun.isPlace === true
            ? "non-human"
            : "ambiguous",
        directAltSequences: undefined,
      };
    }
    let prefixParts: TranslationPart[] = [];
    const determiner = matchDhiyakuDeterminerAt(tokens, cursor, sourceLang);
    if (determiner) {
      if (determiner.part) prefixParts = [determiner.part];
      cursor += determiner.consumed;
    }
    const token = tokens[cursor];
    if (!token) {
      if (determiner?.part) {
        return {
          sequences: [[determiner.part]],
          consumed: determiner.consumed,
          hasAmbiguity: false,
          targetHumanity: "non-human",
        };
      }
      return null;
    }
    if (isNonHumanDemoPronoun(token.source, sourceLang)) {
      const demoPart = buildDefiniteArticlePart(
        "dhiyaku",
        token.source,
        sourceLang
      );
      return {
        sequences: [[demoPart]],
        consumed: (determiner?.consumed ?? 0) + 1,
        hasAmbiguity: false,
        targetHumanity: "non-human",
        directAltSequences: undefined,
      };
    }
    const pronounMatch = matchPossessiveOfPronoun(token.source, sourceLang);
    const emphasis = pronounMatch
      ? matchPossessiveEmphasisAt(tokens, cursor, sourceLang)
      : null;
    const isReflexive =
      Boolean(emphasis) && isReflexivePossessive(pronounMatch as any, options?.reflexivePersons);
    const pronounPart = buildIndirectPronounPart(pronounMatch, {
      emphatic: Boolean(emphasis),
      sourceOverride: emphasis?.source,
      includeNonEmphatic: Boolean(emphasis) && !isReflexive,
    });
    if (pronounPart) {
      const built = isReflexive
        ? buildReflexivePossessiveSequences(
            pronounPart,
            sourceLang,
            options?.reflexivePersons,
            options?.reflexiveSubjectRepeat
          )
        : {
            sequences: [[pronounPart]],
            hasAmbiguity: Boolean(pronounPart.alternatives?.length),
          };
      let directAltSequences: TranslationPart[][] | undefined;
      if (sourceLang === "es") {
        const direct = matchObjectPronounAfterA(token.source, sourceLang);
        const directSeq = buildObjectSequencesFromMatch(direct, sourceLang);
        if (directSeq.sequences.length > 0 && directSeq.sequences.some((seq) => seq.length > 0)) {
          directAltSequences = directSeq.sequences;
        }
      } else if (sourceLang === "en") {
        const direct = matchObjectPronoun(token.source, sourceLang);
        const directSeq = buildObjectSequencesFromMatch(direct, sourceLang);
        if (directSeq.sequences.length > 0 && directSeq.sequences.some((seq) => seq.length > 0)) {
          directAltSequences = directSeq.sequences;
        }
      }
      return {
        sequences: built.sequences,
        consumed: (determiner?.consumed ?? 0) + 1 + (emphasis?.consumed ?? 0),
        hasAmbiguity: built.hasAmbiguity,
        targetHumanity: "human",
        directAltSequences,
      };
    }
    const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
    if (!phrase) {
      if (determiner?.part) {
        return {
          sequences: [[determiner.part]],
          consumed: determiner.consumed,
          hasAmbiguity: false,
          targetHumanity: "non-human",
          directAltSequences: undefined,
        };
      }
      return null;
    }
    const { sequences, hasAmbiguity } = buildPhraseSequences(phrase, prefixParts);
    let targetHumanity: IndirectTargetHumanity = "ambiguous";
    if (phrase.noun.isHuman === true) {
      targetHumanity = "human";
    } else if (phrase.noun.isHuman === false || phrase.noun.isPlace === true) {
      targetHumanity = "non-human";
    }
    const directAlt = buildObjectNounPhraseSequences(phrase, sourceLang, {
      forceHuman: true,
      allowAlternatives: false,
    });
    const consumed = (determiner?.consumed ?? 0) + phrase.consumed;
    return {
      sequences,
      consumed,
      hasAmbiguity,
      targetHumanity,
      directAltSequences: directAlt.sequences,
    };
  };

  const initial = parseTarget(index + preposition.consumed);
  if (!initial) return null;
  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;
  let targetHumanity = initial.targetHumanity;
  let directAltSequences = initial.directAltSequences;

  let cursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(cursor + connector.consumed);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    cursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
    if (targetHumanity !== next.targetHumanity) {
      targetHumanity = "ambiguous";
    }
  if (directAltSequences && next.directAltSequences) {
    const mergedAlt: TranslationPart[][] = [];
    for (const seq of directAltSequences) {
      for (const nextSeq of next.directAltSequences) {
        mergedAlt.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    directAltSequences = mergedAlt;
  } else {
    directAltSequences = undefined;
  }
}

  const isForPreposition =
    (sourceLang === "en" && preposition.normalized === "for") ||
    (sourceLang === "es" && preposition.normalized === "para");
  if (isForPreposition && targetHumanity === "non-human") {
    return null;
  }

  return {
    sequences,
    consumed,
    hasAmbiguity,
    preposition,
    targetHumanity,
    directAltSequences,
  };
}

export function matchAllativePhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAmbiguity: boolean;
  possessiveAltSequences?: TranslationPart[][];
  possessiveAltHasAmbiguity?: boolean;
} | null {
  const pronounMatch = matchAllativePronounAt(tokens, index, sourceLang);
  if (pronounMatch) {
    const part = buildAllativePronounPart(pronounMatch);
    if (!part) return null;
    const rendered = finalizePart(part, sourceLang);
    return {
      sequences: [[rendered]],
      consumed: pronounMatch.consumed,
      hasAmbiguity: Boolean(rendered.alternatives?.length),
    };
  }
  const preposition = matchAllativePrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;
  const markerKey =
    ALLATIVE_PREPOSITION_MARKERS[sourceLang]?.[preposition.normalized];
  const markerEntry = markerKey ? LEXICON.markers?.[markerKey] : undefined;
  const adverbInfo = markerEntry
    ? {
        source: preposition.source,
        gup: markerEntry.gup,
        meaningKey: markerEntry.meaningKey,
      }
    : null;

  const buildPhraseSequences = (
    phrase: NounPhraseMatch,
    determiner: {
      human: TranslationPart[][];
      allative: TranslationPart[][];
      hasAlternatives: boolean;
    } | undefined,
    includeAdverb: boolean,
    possessor?: PossessorAfterOfMatch | null
  ): {
    sequences: TranslationPart[][];
    hasAmbiguity: boolean;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } => {
    const isHuman = phrase.noun.isHuman === true;
    const isPlace = phrase.noun.isPlace === true;
    const ambiguousHuman =
      phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
    const suffixes = getComitativeSuffixes(phrase.noun.gup);

    const buildPrefix = (suffix?: string): TranslationPart[] => {
      const parts: TranslationPart[] = [];
      if (includeAdverb && adverbInfo) {
        parts.push(
          buildAdverbPart(
            sourceLang,
            adverbInfo.source,
            adverbInfo.gup,
            adverbInfo.meaningKey,
            suffix
          )
        );
      }
      return parts;
    };

    const attachDeterminer = (
      nounSequences: TranslationPart[][],
      determinerSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!determinerSequences || determinerSequences.length === 0) return [];
      if (
        determinerSequences.length === 1 &&
        determinerSequences[0].length === 0
      ) {
        return nounSequences;
      }
      const sequences: TranslationPart[][] = [];
      for (const detSeq of determinerSequences) {
        for (const seq of nounSequences) {
          sequences.push([...detSeq, ...seq]);
        }
      }
      return sequences;
    };

    const attachPossessor = (
      prefix: TranslationPart[],
      nounParts: TranslationPart[],
      possessorSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!possessorSequences || possessorSequences.length === 0) {
        return [[...prefix, ...nounParts]];
      }
      const sequences: TranslationPart[][] = [];
      for (const possessorSeq of possessorSequences) {
        sequences.push([...prefix, ...possessorSeq, ...nounParts]);
      }
      return sequences;
    };

    const resolveHumanPossessor = (): TranslationPart[][] | undefined => {
      if (!possessor) return undefined;
      if (possessor.traversiveHumanPossessiveSequences) {
        if (
          possessor.traversiveHumanPossessiveIsAmbiguous &&
          possessor.sequences
        ) {
          return [
            ...possessor.traversiveHumanPossessiveSequences,
            ...possessor.sequences,
          ];
        }
        return possessor.traversiveHumanPossessiveSequences;
      }
      return possessor.sequences;
    };
    const humanPossessorSequences = resolveHumanPossessor();
    const humanPossessorHasAlt = Boolean(
      possessor?.traversiveHumanPossessiveHasAlternatives ||
        possessor?.traversiveHumanPossessiveIsAmbiguous
    );

    const buildAllativeSequence = (): TranslationPart[][] => {
      const prefix = buildPrefix("lili");
      const nounParts = buildNounPhraseParts(phrase, sourceLang, {
        suffix: "lili",
        nounNote: {
          key: "ALLATIVE_SUFFIX",
          data: { token: phrase.noun.source, gup: "lili" },
        },
      });
      const base = attachPossessor(prefix, nounParts, humanPossessorSequences);
      return attachDeterminer(base, determiner?.allative);
    };

    const buildAllativeAltSequence = (): TranslationPart[][] | null => {
      if (!possessor?.altSequences || possessor.altSequences.length === 0) {
        return null;
      }
      const prefix = buildPrefix("lili");
      const nounParts = buildNounPhraseParts(phrase, sourceLang, {
        suffix: "lili",
        nounNote: {
          key: "ALLATIVE_SUFFIX",
          data: { token: phrase.noun.source, gup: "lili" },
        },
      });
      const base = attachPossessor(prefix, nounParts, possessor.altSequences);
      return attachDeterminer(base, determiner?.allative);
    };

    const buildComitativeSequence = (suffix: string): TranslationPart[][] => {
      const prefix = buildPrefix(suffix);
      const nounParts = buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: "COMITATIVE_SUFFIX",
          data: { token: phrase.noun.source, gup: suffix },
        },
      });
      const base = attachPossessor(prefix, nounParts, humanPossessorSequences);
      return attachDeterminer(base, determiner?.human);
    };

    const sequences: TranslationPart[][] = [];
    let hasAmbiguity = false;
    let possessiveAltSequences: TranslationPart[][] | undefined;
    let possessiveAltHasAmbiguity = false;
    const allativeAlt = buildAllativeAltSequence();
    if (isHuman) {
      suffixes.forEach((suffix) =>
        sequences.push(...buildComitativeSequence(suffix))
      );
      if (suffixes.length > 1) hasAmbiguity = true;
      if (humanPossessorHasAlt) hasAmbiguity = true;
      if (determiner?.hasAlternatives) hasAmbiguity = true;
    } else if (isPlace) {
      sequences.push(...buildAllativeSequence());
      if (allativeAlt) {
        possessiveAltSequences = allativeAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
      if (determiner?.hasAlternatives) hasAmbiguity = true;
    } else if (ambiguousHuman) {
      sequences.push(...buildAllativeSequence());
      suffixes.forEach((suffix) =>
        sequences.push(...buildComitativeSequence(suffix))
      );
      hasAmbiguity = true;
      if (allativeAlt) {
        possessiveAltSequences = allativeAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
      if (humanPossessorHasAlt) possessiveAltHasAmbiguity = true;
      if (determiner?.hasAlternatives) hasAmbiguity = true;
    } else {
      sequences.push(...buildAllativeSequence());
      if (allativeAlt) {
        possessiveAltSequences = allativeAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
      if (determiner?.hasAlternatives) hasAmbiguity = true;
    }
    return {
      sequences,
      hasAmbiguity: hasAmbiguity || (possessor?.hasAlternatives ?? false),
      possessiveAltSequences,
      possessiveAltHasAmbiguity,
    };
  };

  const parseTarget = (
    start: number,
    includeAdverb: boolean
  ): {
    sequences: TranslationPart[][];
    consumed: number;
    hasAmbiguity: boolean;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } | null => {
    let cursor = start;
    let determinerConsumed = 0;
    let determinerHasAlternatives = false;
    let humanDeterminers: TranslationPart[][] = [[]];
    let allativeDeterminers: TranslationPart[][] = [[]];
    let emphaticPossessor: PossessorAfterOfMatch | null = null;

    const emphaticMatch = matchEmphaticHumanPossessorAt(
      tokens,
      cursor,
      sourceLang
    );
    if (emphaticMatch) {
      determinerConsumed += emphaticMatch.consumed;
      cursor += emphaticMatch.consumed;
      emphaticPossessor = {
        sequences: [[emphaticMatch.part]],
        consumed: 0,
        hasAlternatives: Boolean(emphaticMatch.part.alternatives?.length),
        altSequences: undefined,
        altHasAlternatives: false,
        humanPossessiveSequences: [[emphaticMatch.part]],
        humanPossessiveHasAlternatives: Boolean(
          emphaticMatch.part.alternatives?.length
        ),
        humanPossessiveIsAmbiguous: false,
      };
    }
    const buildAllativeDeterminerPart = (
      source: string,
      kind: DemonstrativeKind = "this"
    ): TranslationPart => {
      const part = buildDefiniteArticlePart("dhipala", source, sourceLang);
      if (kind === "that") {
        part.alternatives = [{ gup: "ŋunhiwili" }, { gup: "ŋunhawala" }];
      }
      return addThatVisibilityNote(part, kind);
    };
    const demoMatch = matchDemonstrativeToken(
      tokens[cursor]?.source ?? "",
      sourceLang
    );
    if (demoMatch) {
      determinerConsumed = 1;
      humanDeterminers = [
        [buildDefiniteArticlePart("dhiyakala", demoMatch.source, sourceLang)],
      ];
      allativeDeterminers = [
        [buildAllativeDeterminerPart(demoMatch.source, demoMatch.kind)],
      ];
      if (demoMatch.kind === "that") determinerHasAlternatives = true;
    } else {
      const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
      if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
        determinerConsumed = articleMatch.consumed;
        if (articleMatch.kind === "definite") {
          humanDeterminers = [
            [buildDefiniteArticlePart("dhiyakala", articleMatch.source, sourceLang)],
          ];
          allativeDeterminers = [
            [buildAllativeDeterminerPart(articleMatch.source)],
          ];
          determinerHasAlternatives = true;
        }
      }
    }
    cursor += determinerConsumed;
    const demoToken = tokens[cursor];
    if (demoToken && isNonHumanDemoPronoun(demoToken.source, sourceLang)) {
      determinerConsumed += 1;
      allativeDeterminers = [
        [buildAllativeDeterminerPart(demoToken.source, "that")],
      ];
      determinerHasAlternatives = true;
      humanDeterminers = [];
      return {
        sequences: allativeDeterminers,
        consumed: determinerConsumed,
        hasAmbiguity: determinerHasAlternatives,
        possessiveAltSequences: undefined,
        possessiveAltHasAmbiguity: undefined,
      };
    }

    const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
    if (!phrase) {
      if (determinerConsumed > 0 && allativeDeterminers.length > 0) {
        return {
          sequences: allativeDeterminers,
          consumed: determinerConsumed,
          hasAmbiguity: determinerHasAlternatives,
          possessiveAltSequences: undefined,
          possessiveAltHasAmbiguity: undefined,
        };
      }
      return null;
    }
    const afterIndex = cursor + phrase.consumed;
    let possessor: PossessorAfterOfMatch | null = null;
    let possessorConnectorConsumed = 0;
    if (isOfConnectorToken(tokens[afterIndex], sourceLang)) {
      possessor = matchPossessorAfterOf(
        tokens,
        afterIndex + 1,
        sourceLang,
        options
      );
      possessorConnectorConsumed = 1;
    } else if (emphaticPossessor) {
      possessor = emphaticPossessor;
    }
    const built = buildPhraseSequences(
      phrase,
      {
        human: humanDeterminers,
        allative: allativeDeterminers,
        hasAlternatives: determinerHasAlternatives,
      },
      includeAdverb,
      possessor
    );
    const consumed =
      determinerConsumed +
      phrase.consumed +
      (possessor ? possessorConnectorConsumed + possessor.consumed : 0);
    return {
      sequences: built.sequences,
      consumed,
      hasAmbiguity: built.hasAmbiguity,
      possessiveAltSequences: built.possessiveAltSequences,
      possessiveAltHasAmbiguity: built.possessiveAltHasAmbiguity,
    };
  };

  const initial = parseTarget(index + preposition.consumed, true);
  if (!initial) return null;
  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;
  let possessiveAltSequences = initial.possessiveAltSequences;
  let possessiveAltHasAmbiguity = initial.possessiveAltHasAmbiguity ?? false;

  let cursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(cursor + connector.consumed, false);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    cursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
    if (possessiveAltSequences && next.possessiveAltSequences) {
      const mergedAlt: TranslationPart[][] = [];
      for (const seq of possessiveAltSequences) {
        for (const nextSeq of next.possessiveAltSequences) {
          mergedAlt.push([...seq, connectorPart, ...nextSeq]);
        }
      }
      possessiveAltSequences = mergedAlt;
      possessiveAltHasAmbiguity =
        possessiveAltHasAmbiguity ||
        Boolean(next.possessiveAltHasAmbiguity);
    } else {
      possessiveAltSequences = undefined;
    }
  }

  return {
    sequences,
    consumed,
    hasAmbiguity,
    possessiveAltSequences,
    possessiveAltHasAmbiguity,
  };
}

export function matchAblativePhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAmbiguity: boolean;
  possessiveAltSequences?: TranslationPart[][];
  possessiveAltHasAmbiguity?: boolean;
} | null {
  const pronounMatch = matchHumanAblativePronounAt(tokens, index, sourceLang);
  if (pronounMatch) {
    const nextIndex = index + pronounMatch.consumed;
    const nextToken = tokens[nextIndex];
    if (nextToken && !isNounPhraseBoundary(tokens, nextIndex, sourceLang)) {
      // Allow possessor-before-noun parsing (e.g. "de mi casa").
    } else {
    const part = buildHumanAblativePronounPart(pronounMatch);
    if (!part) return null;
    const hasAmbiguity = Boolean(part.alternatives?.length);
    return { sequences: [[part]], consumed: pronounMatch.consumed, hasAmbiguity };
    }
  }

  const preposition = matchAblativePrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;

  let cursor = index + preposition.consumed;
  let adverbPart: TranslationPart | null = null;
  let adverbConsumed = 0;

  const locativeMarker = matchLocativeMarkerAt(tokens, cursor, sourceLang);
  if (locativeMarker) {
    adverbPart = buildAdverbPart(
      sourceLang,
      locativeMarker.source,
      locativeMarker.entry.gup,
      locativeMarker.entry.meaningKey,
      "ŋuru"
    );
    cursor += locativeMarker.consumed;
    adverbConsumed += locativeMarker.consumed;
    const maybeConnector = tokens[cursor];
    const normalized = maybeConnector
      ? normalizeToken(maybeConnector.source, sourceLang)
      : "";
    if (sourceLang === "es" && normalized === "de") {
      cursor += 1;
      adverbConsumed += 1;
    }
    if (sourceLang === "en" && normalized === "of") {
      cursor += 1;
      adverbConsumed += 1;
    }
  } else {
    const locativePrep = matchLocativePrepositionAt(tokens, cursor, sourceLang);
    if (locativePrep) {
      const markerKey =
        LOCATIVE_PREPOSITION_MARKERS[sourceLang]?.[locativePrep.normalized] ??
        (sourceLang === "es" && locativePrep.normalized === "dentro de"
          ? "marker.locative.inside"
          : sourceLang === "en" &&
              (locativePrep.normalized === "inside" ||
                locativePrep.normalized === "inside of")
            ? "marker.locative.inside"
            : null);
      const markerEntry = markerKey ? LEXICON.markers?.[markerKey] : undefined;
      if (markerEntry) {
        adverbPart = buildAdverbPart(
          sourceLang,
          locativePrep.source,
          markerEntry.gup,
          markerEntry.meaningKey,
          "ŋuru"
        );
        cursor += locativePrep.consumed;
        adverbConsumed += locativePrep.consumed;
      }
    }
  }

  const buildPhraseSequences = (
    phrase: NounPhraseMatch,
    determiner?: {
      human: TranslationPart[][];
      nonHuman: TranslationPart[][];
      hasAlternatives: boolean;
    },
    possessor?: PossessorAfterOfMatch | null
  ): {
    sequences: TranslationPart[][];
    hasAmbiguity: boolean;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } => {
    const isHuman = phrase.noun.isHuman === true;
    const isPlace = phrase.noun.isPlace === true;
    const ambiguousHuman =
      phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
    const humanSuffixes = getHumanAblativeSuffixes(phrase.noun.gup);
    const humanPossessorSequences = possessor?.ablativeHumanPossessiveSequences
      ? possessor.ablativeHumanPossessiveIsAmbiguous && possessor.sequences
        ? [...possessor.ablativeHumanPossessiveSequences, ...possessor.sequences]
        : possessor.ablativeHumanPossessiveSequences
      : possessor?.sequences;
    const humanPossessorHasAlt = Boolean(
      possessor?.ablativeHumanPossessiveHasAlternatives ||
        possessor?.ablativeHumanPossessiveIsAmbiguous
    );

    const buildPrefix = (): TranslationPart[] =>
      adverbPart ? [adverbPart] : [];

    const attachDeterminer = (
      nounSequences: TranslationPart[][],
      determinerSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!determinerSequences || determinerSequences.length === 0) return [];
      if (
        determinerSequences.length === 1 &&
        determinerSequences[0].length === 0
      ) {
        return nounSequences;
      }
      const sequences: TranslationPart[][] = [];
      for (const detSeq of determinerSequences) {
        for (const seq of nounSequences) {
          sequences.push([...detSeq, ...seq]);
        }
      }
      return sequences;
    };

    const attachPossessor = (
      prefix: TranslationPart[],
      nounParts: TranslationPart[],
      possessorSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!possessorSequences || possessorSequences.length === 0) {
        return [[...prefix, ...nounParts]];
      }
      const sequences: TranslationPart[][] = [];
      for (const possessorSeq of possessorSequences) {
        sequences.push([...prefix, ...possessorSeq, ...nounParts]);
      }
      return sequences;
    };

    const buildAblativeSequence = (
      suffix: string,
      noteKey: ExplanationKey,
      possessorSequences?: TranslationPart[][],
      determinerSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      const prefix = buildPrefix();
      const nounParts = buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: noteKey,
          data: { token: phrase.noun.source, gup: suffix },
        },
      });
      const base = attachPossessor(
        prefix,
        nounParts,
        possessorSequences ?? possessor?.sequences
      );
      return attachDeterminer(base, determinerSequences);
    };

  const buildNonHumanSequence = (
    possessorSequences?: TranslationPart[][]
  ): TranslationPart[][] =>
      buildAblativeSequence(
        "ŋuru",
        "ABLATIVE_SUFFIX",
        possessorSequences,
        determiner?.nonHuman
      );

    const buildNonHumanAltSequence = (
      possessorSequences?: TranslationPart[][]
    ): TranslationPart[][] | null => {
      if (!possessorSequences || possessorSequences.length === 0) {
        return null;
      }
      const prefix = buildPrefix();
      const nounParts = buildNounPhraseParts(phrase, sourceLang, {
        suffix: "ŋuru",
        nounNote: {
          key: "ABLATIVE_SUFFIX",
          data: { token: phrase.noun.source, gup: "ŋuru" },
        },
      });
      const base = attachPossessor(prefix, nounParts, possessorSequences);
      return attachDeterminer(base, determiner?.nonHuman);
    };

    const sequences: TranslationPart[][] = [];
    let hasAmbiguity = false;
    let possessiveAltSequences: TranslationPart[][] | undefined;
    let possessiveAltHasAmbiguity = false;
    const possessorForNonHuman =
      humanPossessorSequences && humanPossessorSequences.length > 0
        ? humanPossessorSequences
        : possessor?.sequences;
    const nonHumanAlt = buildNonHumanAltSequence(possessor?.altSequences);

    if (isHuman) {
      humanSuffixes.forEach((suffix) =>
        sequences.push(
          ...buildAblativeSequence(
            suffix,
            "ABLATIVE_SUFFIX",
            humanPossessorSequences,
            determiner?.human
          )
        )
      );
      if (
        humanSuffixes.length > 1 ||
        humanPossessorHasAlt ||
        determiner?.hasAlternatives
      ) {
        hasAmbiguity = true;
      }
    } else if (isPlace) {
      sequences.push(...buildNonHumanSequence(possessorForNonHuman));
      if (humanPossessorSequences && humanPossessorSequences.length > 0) {
        sequences.push(
          ...buildAblativeSequence(
            "ŋuru",
            "ABLATIVE_SUFFIX",
            humanPossessorSequences,
            determiner?.nonHuman
          )
        );
        hasAmbiguity = true;
      }
      if (nonHumanAlt) {
        possessiveAltSequences = nonHumanAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
      if (determiner?.hasAlternatives) hasAmbiguity = true;
    } else if (ambiguousHuman) {
      humanSuffixes.forEach((suffix) =>
        sequences.push(
          ...buildAblativeSequence(
            suffix,
            "ABLATIVE_SUFFIX",
            humanPossessorSequences,
            determiner?.human
          )
        )
      );
      sequences.push(
        ...buildAblativeSequence(
          "ŋuru",
          "ABLATIVE_NONHUMAN_ALT",
          possessor?.sequences,
          determiner?.nonHuman
        )
      );
      hasAmbiguity = true;
      if (nonHumanAlt) {
        possessiveAltSequences = nonHumanAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
    } else {
      sequences.push(...buildNonHumanSequence(possessorForNonHuman));
      if (humanPossessorSequences && humanPossessorSequences.length > 0) {
        sequences.push(
          ...buildAblativeSequence(
            "ŋuru",
            "ABLATIVE_SUFFIX",
            humanPossessorSequences,
            determiner?.nonHuman
          )
        );
        hasAmbiguity = true;
      }
      if (nonHumanAlt) {
        possessiveAltSequences = nonHumanAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
      if (determiner?.hasAlternatives) hasAmbiguity = true;
    }

    return {
      sequences,
      hasAmbiguity:
        hasAmbiguity || (possessor?.hasAlternatives ?? false) || humanPossessorHasAlt,
      possessiveAltSequences,
      possessiveAltHasAmbiguity,
    };
  };

  const parseTarget = (
    start: number
  ): {
    sequences: TranslationPart[][];
    consumed: number;
    hasAmbiguity: boolean;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } | null => {
    const verbMatches = matchVerbAt(tokens, start, sourceLang);
    const infinitiveMatch = matchInfinitiveAt(tokens as IRToken[], start, sourceLang);
    const gerundMatch = matchGerundAfterIndex(tokens as IRToken[], start, sourceLang);
    if (
      verbMatches.length > 0 ||
      infinitiveMatch ||
      (gerundMatch && gerundMatch.gerundIndex === start)
    ) {
      return null;
    }
    let localCursor = start;
    let determinerConsumed = 0;
    let determinerHasAlternatives = false;
    let humanDeterminers: TranslationPart[][] = [[]];
    let nonHumanDeterminers: TranslationPart[][] = [[]];
    let emphaticPossessor: PossessorAfterOfMatch | null = null;
    const buildNguruDeterminerPart = (
      source: string,
      kind: DemonstrativeKind = "this"
    ): TranslationPart => {
      const part = buildDefiniteArticlePart("dhipuŋuru", source, sourceLang);
      if (kind === "that") {
        part.alternatives = [
          { gup: "ŋuliŋuru" },
          { gup: "ŋulaŋuru" },
          { gup: "beŋuru" },
          { gup: "ŋunhiŋuru" },
        ];
      }
      return addThatVisibilityNote(part, kind);
    };
    const buildNguruHumanDeterminerPart = (
      source: string,
      kind: DemonstrativeKind = "this"
    ): TranslationPart => {
      const part = buildDefiniteArticlePart(
        "dhiyakalaŋuŋuru",
        source,
        sourceLang
      );
      if (kind === "that") {
        part.alternatives = [{ gup: "ŋurikalaŋuŋuru" }, { gup: "ŋurukalaŋuŋuru" }];
      }
      return addThatVisibilityNote(part, kind);
    };
    const emphaticMatch = matchEmphaticHumanPossessorAt(
      tokens,
      localCursor,
      sourceLang
    );
    if (emphaticMatch) {
      determinerConsumed += emphaticMatch.consumed;
      localCursor += emphaticMatch.consumed;
      emphaticPossessor = {
        sequences: [[emphaticMatch.part]],
        consumed: 0,
        hasAlternatives: Boolean(emphaticMatch.part.alternatives?.length),
        altSequences: undefined,
        altHasAlternatives: false,
        humanPossessiveSequences: [[emphaticMatch.part]],
        humanPossessiveHasAlternatives: Boolean(
          emphaticMatch.part.alternatives?.length
        ),
        humanPossessiveIsAmbiguous: false,
      };
    }
    const demoMatch = matchDemonstrativeToken(
      tokens[localCursor]?.source ?? "",
      sourceLang
    );
    if (demoMatch) {
      determinerConsumed = 1;
      humanDeterminers = [
        [buildNguruHumanDeterminerPart(demoMatch.source, demoMatch.kind)],
      ];
      nonHumanDeterminers = [
        [buildNguruDeterminerPart(demoMatch.source, demoMatch.kind)],
      ];
      if (demoMatch.kind === "that") determinerHasAlternatives = true;
    } else {
      const articleMatch = matchArticleAt(tokens, localCursor, sourceLang);
      if (
        articleMatch &&
        !isOtherGroupPatternAt(tokens, localCursor, sourceLang)
      ) {
        determinerConsumed = articleMatch.consumed;
        if (articleMatch.kind === "definite") {
          humanDeterminers = [
            [buildNguruHumanDeterminerPart(articleMatch.source)],
          ];
          nonHumanDeterminers = [
            [buildNguruDeterminerPart(articleMatch.source)],
          ];
          determinerHasAlternatives = false;
        }
      }
    }
    localCursor += determinerConsumed;
    const demoToken = tokens[localCursor];
    if (demoToken && isNonHumanDemoPronoun(demoToken.source, sourceLang)) {
      determinerConsumed += 1;
      nonHumanDeterminers = [
        [buildNguruDeterminerPart(demoToken.source, "that")],
      ];
      determinerHasAlternatives = true;
      humanDeterminers = [];
      return {
        sequences: nonHumanDeterminers,
        consumed: determinerConsumed,
        hasAmbiguity: determinerHasAlternatives,
        possessiveAltSequences: undefined,
        possessiveAltHasAmbiguity: undefined,
      };
    }

    const possessorPrefix = matchPossessorBeforeNoun(
      tokens,
      localCursor,
      sourceLang,
      options
    );
    if (possessorPrefix) {
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        localCursor + possessorPrefix.consumed,
        sourceLang
      );
      if (!phrase) return null;
      const built = buildPhraseSequences(
        phrase,
        {
          human: humanDeterminers,
          nonHuman: nonHumanDeterminers,
          hasAlternatives: determinerHasAlternatives,
        },
        possessorPrefix
      );
      const consumed =
        determinerConsumed + possessorPrefix.consumed + phrase.consumed;
      return {
        sequences: built.sequences,
        consumed,
        hasAmbiguity: built.hasAmbiguity,
        possessiveAltSequences: built.possessiveAltSequences,
        possessiveAltHasAmbiguity: built.possessiveAltHasAmbiguity,
      };
    }

    let phrase = matchNounPhraseAfterArticle(tokens, localCursor, sourceLang);
    if (!phrase) {
      const fallbackToken = tokens[localCursor];
      if (fallbackToken && !isNounPhraseBoundary(tokens, localCursor, sourceLang)) {
        phrase = {
          adjectives: { pre: [], post: [] },
          noun: {
            gup: fallbackToken.source,
            source: fallbackToken.source,
            isHuman: undefined,
            isPlace: undefined,
            consumed: 1,
          },
          consumed: 1,
        };
      } else {
        if (determinerConsumed > 0 && nonHumanDeterminers.length > 0) {
          return {
            sequences: nonHumanDeterminers,
            consumed: determinerConsumed,
            hasAmbiguity: determinerHasAlternatives,
            possessiveAltSequences: undefined,
            possessiveAltHasAmbiguity: undefined,
          };
        }
        return null;
      }
    }
    const afterIndex = localCursor + phrase.consumed;
    let possessor: PossessorAfterOfMatch | null = null;
    let possessorConnectorConsumed = 0;
    if (isOfConnectorToken(tokens[afterIndex], sourceLang)) {
      possessor = matchPossessorAfterOf(
        tokens,
        afterIndex + 1,
        sourceLang,
        options
      );
      possessorConnectorConsumed = 1;
    } else if (emphaticPossessor) {
      possessor = emphaticPossessor;
    }
    const built = buildPhraseSequences(
      phrase,
      {
        human: humanDeterminers,
        nonHuman: nonHumanDeterminers,
        hasAlternatives: determinerHasAlternatives,
      },
      possessor
    );
    const consumed =
      determinerConsumed +
      phrase.consumed +
      (possessor ? possessorConnectorConsumed + possessor.consumed : 0);
    return {
      sequences: built.sequences,
      consumed,
      hasAmbiguity: built.hasAmbiguity,
      possessiveAltSequences: built.possessiveAltSequences,
      possessiveAltHasAmbiguity: built.possessiveAltHasAmbiguity,
    };
  };

  const initial = parseTarget(cursor);
  if (!initial) {
    if (!adverbPart) return null;
    return {
      sequences: [[adverbPart]],
      consumed: preposition.consumed + adverbConsumed,
      hasAmbiguity: false,
    };
  }

  let sequences = initial.sequences;
  let consumed = preposition.consumed + adverbConsumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;
  let possessiveAltSequences = initial.possessiveAltSequences;
  let possessiveAltHasAmbiguity = initial.possessiveAltHasAmbiguity ?? false;
  const firstNormalized = normalizeToken(tokens[index]?.source ?? "", sourceLang);
  const allowPossessiveAlt =
    sourceLang === "es" &&
    adverbConsumed === 0 &&
    (firstNormalized === "de" || firstNormalized === "del");
  if (allowPossessiveAlt) {
    const possAltMatch = matchPossessiveObjectPhraseAt(
      tokens,
      cursor,
      sourceLang,
      { allowAlternatives: true }
    );
    if (possAltMatch && possAltMatch.consumed === initial.consumed) {
      possessiveAltSequences = possessiveAltSequences
        ? [...possessiveAltSequences, ...possAltMatch.sequences]
        : possAltMatch.sequences;
      possessiveAltHasAmbiguity =
        possessiveAltHasAmbiguity || possAltMatch.hasAlternatives;
    }
  }

  let connectorCursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, connectorCursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(connectorCursor + connector.consumed);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    connectorCursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
    if (possessiveAltSequences && next.possessiveAltSequences) {
      const mergedAlt: TranslationPart[][] = [];
      for (const seq of possessiveAltSequences) {
        for (const nextSeq of next.possessiveAltSequences) {
          mergedAlt.push([...seq, connectorPart, ...nextSeq]);
        }
      }
      possessiveAltSequences = mergedAlt;
      possessiveAltHasAmbiguity =
        possessiveAltHasAmbiguity ||
        Boolean(next.possessiveAltHasAmbiguity);
    } else {
      possessiveAltSequences = undefined;
    }
  }

  return {
    sequences,
    consumed,
    hasAmbiguity,
    possessiveAltSequences,
    possessiveAltHasAmbiguity,
  };
}

export function matchTraversivePhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAmbiguity: boolean;
  possessiveAltSequences?: TranslationPart[][];
  possessiveAltHasAmbiguity?: boolean;
} | null {
  const preposition = matchTraversivePrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;

  const pronounMatch = matchTraversivePronounAt(
    tokens,
    index + preposition.consumed,
    sourceLang
  );
  if (pronounMatch) {
    const part = buildTraversivePronounPart(pronounMatch, sourceLang);
    if (!part) return null;
    return {
      sequences: [[part]],
      consumed: preposition.consumed + pronounMatch.consumed,
      hasAmbiguity: Boolean(part.alternatives?.length),
    };
  }

  const buildPhraseSequences = (
    phrase: NounPhraseMatch,
    demoPart: TranslationPart | null,
    possessor?: PossessorAfterOfMatch | null
  ): {
    sequences: TranslationPart[][];
    hasAmbiguity: boolean;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
  } => {
    const isHuman = phrase.noun.isHuman === true;
    const isPlace = phrase.noun.isPlace === true;
    const ambiguousHuman =
      phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
    const nonHumanSuffixes = getTraversiveSuffixes(phrase.noun.gup);
    const humanSuffixes = getTraversiveHumanSuffixes(phrase.noun.gup);

    const resolveHumanPossessor = (): TranslationPart[][] | undefined => {
      if (!possessor) return undefined;
      if (possessor.traversiveHumanPossessiveSequences) {
        if (
          possessor.traversiveHumanPossessiveIsAmbiguous &&
          possessor.sequences
        ) {
          return [
            ...possessor.traversiveHumanPossessiveSequences,
            ...possessor.sequences,
          ];
        }
        return possessor.traversiveHumanPossessiveSequences;
      }
      return possessor.sequences;
    };
    const humanPossessorSequences = resolveHumanPossessor();
    const humanPossessorHasAlt = Boolean(
      possessor?.traversiveHumanPossessiveHasAlternatives ||
        possessor?.traversiveHumanPossessiveIsAmbiguous
    );

    const buildPrefix = (): TranslationPart[] => {
      const parts: TranslationPart[] = [];
      if (demoPart) parts.push(demoPart);
      return parts;
    };

    const attachPossessor = (
      prefix: TranslationPart[],
      nounParts: TranslationPart[],
      possessorSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      if (!possessorSequences || possessorSequences.length === 0) {
        return [[...prefix, ...nounParts]];
      }
      const sequences: TranslationPart[][] = [];
      for (const possessorSeq of possessorSequences) {
        sequences.push([...prefix, ...possessorSeq, ...nounParts]);
      }
      return sequences;
    };

    const buildTraversiveSequence = (
      suffix: string,
      noteKey: ExplanationKey,
      possessorSequences?: TranslationPart[][]
    ): TranslationPart[][] => {
      const prefix = buildPrefix();
      const nounParts = buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: noteKey,
          data: { token: phrase.noun.source, gup: suffix },
        },
      });
      return attachPossessor(prefix, nounParts, possessorSequences ?? possessor?.sequences);
    };

    const buildNonHumanSequences = (): TranslationPart[][] => {
      const sequences: TranslationPart[][] = [];
      nonHumanSuffixes.forEach((suffix) => {
        sequences.push(
          ...buildTraversiveSequence(
            suffix,
            "TRAVERSE_SUFFIX",
            humanPossessorSequences ?? possessor?.sequences
          )
        );
      });
      return sequences;
    };

    const buildNonHumanAltSequence = (): TranslationPart[][] | null => {
      if (!possessor?.altSequences || possessor.altSequences.length === 0) {
        return null;
      }
      const sequences: TranslationPart[][] = [];
      nonHumanSuffixes.forEach((suffix) => {
        sequences.push(
          ...buildTraversiveSequence(
            suffix,
            "TRAVERSE_SUFFIX",
            possessor.altSequences
          )
        );
      });
      return sequences;
    };

    const sequences: TranslationPart[][] = [];
    let hasAmbiguity = false;
    let possessiveAltSequences: TranslationPart[][] | undefined;
    let possessiveAltHasAmbiguity = false;
    const nonHumanAlt = buildNonHumanAltSequence();

    if (isHuman) {
      humanSuffixes.forEach((suffix) =>
        sequences.push(
          ...buildTraversiveSequence(
            suffix,
            "TRAVERSE_HUMAN_SUFFIX",
            humanPossessorSequences
          )
        )
      );
      if (humanSuffixes.length > 1 || humanPossessorHasAlt) hasAmbiguity = true;
    } else if (isPlace) {
      sequences.push(...buildNonHumanSequences());
      if (humanPossessorSequences && humanPossessorSequences.length > 0) {
        nonHumanSuffixes.forEach((suffix) =>
          sequences.push(
            ...buildTraversiveSequence(
              suffix,
              "TRAVERSE_SUFFIX",
              humanPossessorSequences
            )
          )
        );
        hasAmbiguity = true;
      }
      if (nonHumanAlt) {
        possessiveAltSequences = nonHumanAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
    } else if (ambiguousHuman) {
      humanSuffixes.forEach((suffix) =>
        sequences.push(
          ...buildTraversiveSequence(
            suffix,
            "TRAVERSE_HUMAN_SUFFIX",
            humanPossessorSequences
          )
        )
      );
      sequences.push(...buildNonHumanSequences());
      hasAmbiguity = true;
      if (nonHumanAlt) {
        possessiveAltSequences = nonHumanAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
    } else {
      sequences.push(...buildNonHumanSequences());
      if (humanPossessorSequences && humanPossessorSequences.length > 0) {
        nonHumanSuffixes.forEach((suffix) =>
          sequences.push(
            ...buildTraversiveSequence(
              suffix,
              "TRAVERSE_SUFFIX",
              humanPossessorSequences
            )
          )
        );
        hasAmbiguity = true;
      }
      if (nonHumanAlt) {
        possessiveAltSequences = nonHumanAlt;
        possessiveAltHasAmbiguity = possessor?.altHasAlternatives ?? false;
      }
    }

    return {
      sequences,
      hasAmbiguity:
        hasAmbiguity || (possessor?.hasAlternatives ?? false) || humanPossessorHasAlt,
      possessiveAltSequences,
      possessiveAltHasAmbiguity,
    };
  };

  const parseTarget = (
    start: number
  ): {
    sequences: TranslationPart[][];
    consumed: number;
    hasAmbiguity: boolean;
    possessiveAltSequences?: TranslationPart[][];
    possessiveAltHasAmbiguity?: boolean;
    } | null => {
      if (splitVerbClitic(tokens[start]?.source ?? "", sourceLang)) {
        return null;
      }
      let localCursor = start;
    const articleMatch = matchArticleAt(tokens, localCursor, sourceLang);
    if (articleMatch && !isOtherGroupPatternAt(tokens, localCursor, sourceLang)) {
      localCursor += articleMatch.consumed;
    }

    const demoMatch = matchDemonstrativeToken(
      tokens[localCursor]?.source ?? "",
      sourceLang
    );
    if (demoMatch) {
      localCursor += 1;
    }

    const phrase = matchNounPhraseAfterArticle(tokens, localCursor, sourceLang);
    if (!phrase) return null;
    const afterIndex = localCursor + phrase.consumed;
    let possessor: PossessorAfterOfMatch | null = null;
    if (isOfConnectorToken(tokens[afterIndex], sourceLang)) {
      possessor = matchPossessorAfterOf(
        tokens,
        afterIndex + 1,
        sourceLang,
        // options
      );
    }
    const built = buildPhraseSequences(phrase, null, possessor);
    const consumed =
      (articleMatch?.consumed ?? 0) +
      (demoMatch ? 1 : 0) +
      phrase.consumed +
      (possessor ? 1 + possessor.consumed : 0);
    return {
      sequences: built.sequences,
      consumed,
      hasAmbiguity: built.hasAmbiguity,
      possessiveAltSequences: built.possessiveAltSequences,
      possessiveAltHasAmbiguity: built.possessiveAltHasAmbiguity,
    };
  };

  const initial = parseTarget(index + preposition.consumed);
  if (!initial) return null;

  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;
  let possessiveAltSequences = initial.possessiveAltSequences;
  let possessiveAltHasAmbiguity = initial.possessiveAltHasAmbiguity ?? false;

  let connectorCursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, connectorCursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(connectorCursor + connector.consumed);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    connectorCursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
    if (possessiveAltSequences && next.possessiveAltSequences) {
      const mergedAlt: TranslationPart[][] = [];
      for (const seq of possessiveAltSequences) {
        for (const nextSeq of next.possessiveAltSequences) {
          mergedAlt.push([...seq, connectorPart, ...nextSeq]);
        }
      }
      possessiveAltSequences = mergedAlt;
      possessiveAltHasAmbiguity =
        possessiveAltHasAmbiguity ||
        Boolean(next.possessiveAltHasAmbiguity);
    } else {
      possessiveAltSequences = undefined;
    }
  }

  return {
    sequences,
    consumed,
    hasAmbiguity,
    possessiveAltSequences,
    possessiveAltHasAmbiguity,
  };
}

export function matchOriginPhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  options?: {
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): { sequences: TranslationPart[][]; consumed: number; hasAmbiguity: boolean } | null {
  const pronounMatch = matchSourceOriginPronounAt(tokens, index, sourceLang);
  if (pronounMatch) {
    const part = buildSourceOriginPronounPart(pronounMatch);
    if (!part) return null;
    const hasAmbiguity = Boolean(part.alternatives?.length);
    return { sequences: [[part]], consumed: pronounMatch.consumed, hasAmbiguity };
  }

  const preposition = matchOriginPrepositionAt(tokens, index, sourceLang);
  if (!preposition) return null;

  const buildPhraseSequences = (
      phrase: NounPhraseMatch,
      possessor?: PossessorAfterOfMatch | null,
      determiners?: {
        human: TranslationPart[][];
        nonHuman: TranslationPart[][];
        hasAlternatives: boolean;
      }
    ): { sequences: TranslationPart[][]; hasAmbiguity: boolean } => {
    const isHuman = phrase.noun.isHuman === true;
    const isPlace = phrase.noun.isPlace === true;
    const ambiguousHuman =
      phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
    const base = phrase.noun.gup || phrase.noun.source;
    const suffixes = getSourceOriginSuffixes(base);
      const possessorSequences = possessor?.sequences;
      const possessorHasAlt = Boolean(possessor?.hasAlternatives);
    const humanPossessorSequences = possessor?.ablativeHumanPossessiveSequences
      ? possessor.ablativeHumanPossessiveIsAmbiguous && possessor.sequences
        ? [...possessor.ablativeHumanPossessiveSequences, ...possessor.sequences]
        : possessor.ablativeHumanPossessiveSequences
      : possessor?.sequences;
    const humanPossessorHasAlt = Boolean(
      possessor?.ablativeHumanPossessiveHasAlternatives ||
        possessor?.ablativeHumanPossessiveIsAmbiguous
    );

      const attachPossessor = (
        nounParts: TranslationPart[],
        sequences?: TranslationPart[][]
      ): TranslationPart[][] => {
        if (!sequences || sequences.length === 0) return [[...nounParts]];
        return sequences.map((seq) => [...seq, ...nounParts]);
      };
      const attachDeterminer = (
        nounSequences: TranslationPart[][],
        determinerSequences?: TranslationPart[][]
      ): TranslationPart[][] => {
        if (!determinerSequences || determinerSequences.length === 0) return nounSequences;
        if (determinerSequences.length === 1 && determinerSequences[0].length === 0) {
          return nounSequences;
        }
        const merged: TranslationPart[][] = [];
        for (const detSeq of determinerSequences) {
          for (const seq of nounSequences) {
            merged.push([...detSeq, ...seq]);
          }
        }
        return merged;
      };

      const buildOriginSequence = (suffix: string): TranslationPart[] =>
        buildNounPhraseParts(phrase, sourceLang, {
          suffix,
          nounNote: { key: "ORIGIN_SUFFIX", data: { token: phrase.noun.source, gup: suffix } },
        });

    const buildNonHumanSequence = (): TranslationPart[] =>
      buildNounPhraseParts(phrase, sourceLang, {
        suffix: "ŋuru",
        nounNote: { key: "ORIGIN_NONHUMAN_ALT" },
      });

      const sequences: TranslationPart[][] = [];
      let hasAmbiguity = false;
      if (isHuman) {
        sequences.push(
          ...attachDeterminer(
            suffixes.flatMap((suffix) =>
              attachPossessor(buildOriginSequence(suffix), humanPossessorSequences)
            ),
            determiners?.human
          )
        );
        if (suffixes.length > 1) hasAmbiguity = true;
        if (humanPossessorHasAlt) hasAmbiguity = true;
        if (determiners?.hasAlternatives) hasAmbiguity = true;
      } else if (isPlace) {
        sequences.push(
          ...attachDeterminer(
            attachPossessor(buildNonHumanSequence(), possessorSequences),
            determiners?.nonHuman
          )
        );
        if (possessorHasAlt) hasAmbiguity = true;
        if (determiners?.hasAlternatives) hasAmbiguity = true;
      } else if (ambiguousHuman) {
        sequences.push(
          ...attachDeterminer(
            suffixes.flatMap((suffix) =>
              attachPossessor(buildOriginSequence(suffix), humanPossessorSequences)
            ),
            determiners?.human
          )
        );
        sequences.push(
          ...attachDeterminer(
            attachPossessor(buildNonHumanSequence(), possessorSequences),
            determiners?.nonHuman
          )
        );
        hasAmbiguity = true;
        if (humanPossessorHasAlt || possessorHasAlt) hasAmbiguity = true;
        if (determiners?.hasAlternatives) hasAmbiguity = true;
      } else {
        sequences.push(
          ...attachDeterminer(
            attachPossessor(buildNonHumanSequence(), possessorSequences),
            determiners?.nonHuman
          )
        );
        if (possessorHasAlt) hasAmbiguity = true;
        if (determiners?.hasAlternatives) hasAmbiguity = true;
      }
      return { sequences, hasAmbiguity };
    };

  const parseTarget = (
    start: number
  ): { sequences: TranslationPart[][]; consumed: number; hasAmbiguity: boolean } | null => {
    let cursor = start;
    let determinerConsumed = 0;
    let determinerHasAlternatives = false;
    let humanDeterminers: TranslationPart[][] = [[]];
    let nonHumanDeterminers: TranslationPart[][] = [[]];
    const buildOriginDeterminerPart = (
      source: string,
      kind: DemonstrativeKind = "this"
    ): TranslationPart => {
      const part = buildDefiniteArticlePart("dhiyakuŋu", source, sourceLang);
      if (kind === "that") {
        part.alternatives = [{ gup: "ŋurikuŋu" }, { gup: "ŋurukuŋu" }];
      }
      return addThatVisibilityNote(part, kind);
    };
    const demoMatch = matchDemonstrativeToken(tokens[cursor]?.source ?? "", sourceLang);
    if (demoMatch) {
      determinerConsumed = 1;
      humanDeterminers = [
        [buildOriginDeterminerPart(demoMatch.source, demoMatch.kind)],
      ];
      if (demoMatch.kind === "that") determinerHasAlternatives = true;
      cursor += 1;
    } else {
      const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
      if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
        determinerConsumed = articleMatch.consumed;
        cursor += articleMatch.consumed;
        if (articleMatch.kind === "definite") {
          humanDeterminers = [
            [
              buildOriginDeterminerPart(articleMatch.source),
            ],
          ];
          determinerHasAlternatives = false;
        }
      }
    }

    if (isNonHumanDemoPronoun(tokens[cursor]?.source ?? "", sourceLang)) {
      if (determinerConsumed === 0) {
        humanDeterminers = [
          [
            buildOriginDeterminerPart(tokens[cursor]?.source ?? "", "that"),
          ],
        ];
        determinerHasAlternatives = true;
      }
      return {
        sequences: humanDeterminers,
        consumed: determinerConsumed + 1,
        hasAmbiguity: determinerHasAlternatives,
      };
    }

    const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
    if (!phrase) {
      if (determinerConsumed > 0) {
        return {
          sequences: humanDeterminers,
          consumed: determinerConsumed,
          hasAmbiguity: determinerHasAlternatives,
        };
      }
      return null;
    }
    const afterPhrase = cursor + phrase.consumed;
    const possessor = isOfConnectorToken(tokens[afterPhrase], sourceLang)
      ? matchPossessorAfterOf(tokens, afterPhrase + 1, sourceLang, options)
      : null;
    const { sequences: phraseSequences, hasAmbiguity } = buildPhraseSequences(
      phrase,
      possessor,
      {
        human: humanDeterminers,
        nonHuman: nonHumanDeterminers,
        hasAlternatives: determinerHasAlternatives,
      }
    );
    const sequences = phraseSequences;
    const consumed =
      determinerConsumed +
      phrase.consumed +
      (possessor ? 1 + possessor.consumed : 0);
    return { sequences, consumed, hasAmbiguity };
  };

  const initial = parseTarget(index + preposition.consumed);
  if (!initial) return null;
  let sequences = initial.sequences;
  let consumed = preposition.consumed + initial.consumed;
  let hasAmbiguity = initial.hasAmbiguity;

  let cursor = index + consumed;
  while (true) {
    const connector = matchConnectorAt(tokens, cursor, sourceLang);
    if (!connector) break;
    const next = parseTarget(cursor + connector.consumed);
    if (!next) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    const merged: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const nextSeq of next.sequences) {
        merged.push([...seq, connectorPart, ...nextSeq]);
      }
    }
    sequences = merged;
    consumed += connector.consumed + next.consumed;
    cursor += connector.consumed + next.consumed;
    if (next.hasAmbiguity) hasAmbiguity = true;
  }

  return { sequences, consumed, hasAmbiguity };
}

export function matchAllativeMarkerAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): { part: TranslationPart; consumed: number } | null {
  const marker = matchLocativeMarkerAt(tokens, index, sourceLang);
  if (!marker) return null;
  const skipSuffix = marker.entry.tags?.includes("no-allative-suffix") ?? false;
  const part = buildAdverbPart(
    sourceLang,
    marker.source,
    marker.entry.gup,
    marker.entry.meaningKey,
    skipSuffix ? undefined : "lili"
  );
  return { part, consumed: marker.consumed };
}

function applyHumanSuffix(gup: string): string {
  return applySuffixToGup(gup, "nha");
}

export function buildObjectNounPart(
  match: NounMatch,
  sourceLang: LanguageMode,
  options?: { forceHuman?: boolean; forceNonHuman?: boolean; allowAlternatives?: boolean }
): TranslationPart {
  const baseGup = match.gup;
  const explanations: ExplanationPayload[] = [
    { key: "TOKEN_PASSTHROUGH", data: { token: match.source } },
  ];
  const alternatives: TranslationAlternative[] = [];
  let gup = baseGup;
  let appliedSuffix: string | undefined;
  const allowAlternatives = options?.allowAlternatives ?? true;

  const forceHuman = options?.forceHuman === true;
  const forceNonHuman = options?.forceNonHuman === true;

  if (forceHuman || match.isHuman === true) {
    gup = applyHumanSuffix(baseGup);
    appliedSuffix = "nha";
    explanations.push({ key: "OBJECT_HUMAN_SUFFIX" });
  } else if (forceNonHuman || match.isHuman === false) {
    explanations.push({ key: "OBJECT_NONHUMAN" });
  } else if (allowAlternatives) {
    explanations.push({ key: "OBJECT_NONHUMAN" });
    alternatives.push({
      gup: applyHumanSuffix(baseGup),
      notePayload: { key: "OBJECT_HUMAN_SUFFIX" },
    });
  } else {
    explanations.push({ key: "OBJECT_HUMAN_SUFFIX" });
  }

  return {
    type: "noun",
    source: match.source,
    gup,
    output: gup,
    explanation: "",
    explanations,
    alternatives,
    meaningKey: match.entry?.meaningKey,
    appliedSuffix,
  };
}

function buildObjectNounPhraseSequences(
  phrase: { adjectives: { pre: AdjectiveMatch[]; post: AdjectiveMatch[] }; noun: NounMatch },
  sourceLang: LanguageMode,
  options?: { forceHuman?: boolean; forceNonHuman?: boolean; allowAlternatives?: boolean }
): { sequences: TranslationPart[][]; hasAlternatives: boolean } {
  const forceHuman = options?.forceHuman === true;
  const forceNonHuman = options?.forceNonHuman === true;
  const allowAlternatives = options?.allowAlternatives ?? true;
  const isHuman = phrase.noun.isHuman === true;
  const isNonHuman = phrase.noun.isHuman === false;
  const isAmbiguous = !isHuman && !isNonHuman;

  const buildSequence = (
    useSuffix: boolean,
    noteKey?: ExplanationPayload["key"]
  ): { sequences: TranslationPart[][]; hasRawAlternative: boolean } => {
    const notePayload = noteKey ? { key: noteKey } : undefined;
    const phraseWithConsumed: NounPhraseMatch = {
      ...phrase,
      consumed: 0,
    };
    return buildNounPhraseVariants(phraseWithConsumed, sourceLang, {
      suffix: useSuffix ? "nha" : undefined,
      nounNote: notePayload,
      splitRawAlternative: true,
    });
  };

  if (forceHuman || isHuman) {
    const built = buildSequence(true, "OBJECT_HUMAN_SUFFIX");
    return {
      sequences: built.sequences,
      hasAlternatives: built.hasRawAlternative,
    };
  }
  if (forceNonHuman || isNonHuman) {
    const built = buildSequence(false, "OBJECT_NONHUMAN");
    return {
      sequences: built.sequences,
      hasAlternatives: built.hasRawAlternative,
    };
  }
  if (allowAlternatives && isAmbiguous) {
    const nonHuman = buildSequence(false, "OBJECT_NONHUMAN");
    const human = buildSequence(true, "OBJECT_HUMAN_SUFFIX");
    return {
      sequences: [
        ...nonHuman.sequences,
        ...human.sequences,
      ],
      hasAlternatives:
        true || nonHuman.hasRawAlternative || human.hasRawAlternative,
    };
  }
  const built = buildSequence(false, "OBJECT_HUMAN_SUFFIX");
  return {
    sequences: built.sequences,
    hasAlternatives: built.hasRawAlternative,
  };
}

type PossessiveObjectMatch = {
  sequences: TranslationPart[][];
  originSequences?: TranslationPart[][];
  consumed: number;
  hasAlternatives: boolean;
  originHasAlternatives?: boolean;
};

function buildPossessorSequences(
  phrase: NounPhraseMatch,
  sourceLang: LanguageMode,
  prefixParts: TranslationPart[] = []
): { sequences: TranslationPart[][]; hasAlternatives: boolean } {
  const base = phrase.noun.gup || phrase.noun.source;
  const suffixes = getPossessiveSuffixes(base);
  const withSuffix = suffixes.map((suffix) => {
    const gup = applyPossessiveSuffix(base, suffix);
    const parts = buildNounPhraseParts(phrase, sourceLang, {
      suffix,
      nounNote: {
        key: "POSSESSION_SUFFIX",
        data: { token: phrase.noun.source, gup, suffix },
      },
    });
    return prefixParts.length > 0 ? [...prefixParts, ...parts] : parts;
  });
  const withoutSuffix = buildNounPhraseParts(phrase, sourceLang);
  const isHuman = phrase.noun.isHuman === true;
  const isNonHuman = phrase.noun.isHuman === false;
  const isAmbiguous = !isHuman && !isNonHuman;

  if (isHuman) {
    return { sequences: withSuffix, hasAlternatives: withSuffix.length > 1 };
  }
  if (isNonHuman) {
    return { sequences: [withoutSuffix], hasAlternatives: false };
  }
  return {
    sequences: [withoutSuffix, ...withSuffix],
    hasAlternatives: true,
  };
}

function buildComitativePossessorSequences(
  phrase: NounPhraseMatch,
  sourceLang: LanguageMode
): { sequences: TranslationPart[][]; hasAlternatives: boolean } {
  const base = phrase.noun.gup || phrase.noun.source;
  const suffixes = getComitativePossessiveSuffixes(base);
  const withSuffix = suffixes.map((suffix) => {
    const gup = applyPossessiveSuffix(base, suffix);
    return buildNounPhraseParts(phrase, sourceLang, {
      suffix,
      nounNote: {
        key: "POSSESSION_COMITATIVE_SUFFIX",
        data: { token: phrase.noun.source, gup, suffix },
      },
    });
  });
  const withoutSuffix = buildNounPhraseParts(phrase, sourceLang);
  const isHuman = phrase.noun.isHuman === true;
  const isNonHuman = phrase.noun.isHuman === false;
  const isAmbiguous = !isHuman && !isNonHuman;

  if (isHuman) {
    return { sequences: withSuffix, hasAlternatives: withSuffix.length > 1 };
  }
  if (isNonHuman) {
    return { sequences: [withoutSuffix], hasAlternatives: false };
  }
  return {
    sequences: [withoutSuffix, ...withSuffix],
    hasAlternatives: true,
  };
}

export function buildOriginPossessorSequences(
  phrase: NounPhraseMatch,
  sourceLang: LanguageMode,
  prefixParts: TranslationPart[] = []
): { sequences: TranslationPart[][]; hasAlternatives: boolean } {
  const base = phrase.noun.gup || phrase.noun.source;
  const suffixes = getSourceOriginSuffixes(base);
  const withSuffix = suffixes.map((suffix) => {
    const gup = applySuffixToGup(base, suffix);
    const parts = buildNounPhraseParts(phrase, sourceLang, {
      suffix,
      nounNote: {
        key: "ORIGIN_SUFFIX",
        data: { token: phrase.noun.source, gup },
      },
    });
    return prefixParts.length > 0 ? [...prefixParts, ...parts] : parts;
  });
  const withoutSuffix = buildNounPhraseParts(phrase, sourceLang);
  const isHuman = phrase.noun.isHuman === true;
  const isNonHuman = phrase.noun.isHuman === false;
  const isAmbiguous = !isHuman && !isNonHuman;

  if (isHuman) {
    return { sequences: withSuffix, hasAlternatives: withSuffix.length > 1 };
  }
  if (isNonHuman) {
    return { sequences: [withoutSuffix], hasAlternatives: false };
  }
  return {
    sequences: [withoutSuffix, ...withSuffix],
    hasAlternatives: isAmbiguous || withSuffix.length > 1,
  };
}

function matchPossessiveObjectPhraseAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode,
  options?: {
    forceHuman?: boolean;
    allowAlternatives?: boolean;
    comitativePossessive?: boolean;
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): PossessiveObjectMatch | null {
  const token = tokens[index];
  if (!token) return null;

  traceObject(
    `possMatch@${index} token="${token.source}" lang=${sourceLang} forceHuman=${Boolean(
      options?.forceHuman
    )} allowAlt=${options?.allowAlternatives !== false}`
  );

  const determiner = matchPossessiveDeterminer(token.source, sourceLang);
  if (determiner) {
    const emphasis = matchPossessiveEmphasisAt(tokens, index, sourceLang);
    debugLog("[ridjin-debug] poss-object", {
      index,
      token: token.source,
      determiner: determiner.source,
      emphasis: emphasis?.source ?? null,
    });
    const phrase = matchNounPhraseAfterArticle(
      tokens,
      index + 1 + (emphasis?.consumed ?? 0),
      sourceLang,
      { allowUnknownHead: true }
    );
    debugLog("[ridjin-debug] poss-object:phrase", {
      index,
      phraseStart: index + 1 + (emphasis?.consumed ?? 0),
      matched: Boolean(phrase),
      noun: phrase?.noun.source ?? null,
      unknownHead: phrase ? !phrase.noun.entry : null,
    });
    if (phrase) {
      const useOriginPossessor =
        Boolean(phrase.noun.verbalVerbForms) && !emphasis;
      const isReflexive =
        !useOriginPossessor &&
        Boolean(emphasis) &&
        isReflexivePossessive(determiner, options?.reflexivePersons);
      const allowComitativePossessive =
        options?.comitativePossessive && !useOriginPossessor && !emphasis;
      const possessor = allowComitativePossessive
        ? buildComitativePossessivePronounPart(determiner, sourceLang)
        : useOriginPossessor
          ? buildOriginPossessivePronounPart(determiner, sourceLang, {
              emphatic: Boolean(emphasis),
              sourceOverride: (emphasis as any)?.source,
            })
          : buildPossessivePronounPart(determiner, sourceLang, {
              emphatic: Boolean(emphasis),
              sourceOverride: emphasis?.source,
              includeNonEmphatic: Boolean(emphasis) && !isReflexive,
            });
      if (!possessor) return null;
      
      const demoParts =
        determiner.nonHuman === true
          ? [
              finalizePart(
                {
                  type: "pronoun",
                  source: determiner.source,
                  gup: "dhuwala",
                  output: "dhuwala",
                  explanation: "",
                  explanations: [{ key: "PRONOUN_NOTE_NONHUMAN" }],
                },
                sourceLang
              ),
              finalizePart(
                {
                  type: "pronoun",
                  source: determiner.source,
                  gup: "dhuwali",
                  output: "dhuwali",
                  explanation: "",
                  explanations: [{ key: "PRONOUN_NOTE_NONHUMAN" }],
                },
                sourceLang
              ),
            ]
          : [];
      const possessed = buildObjectNounPhraseSequences(phrase, sourceLang, {
        forceHuman: options?.forceHuman,
        allowAlternatives: options?.allowAlternatives,
      });
      const possessorBuilt = isReflexive
        ? buildReflexivePossessiveSequences(
            possessor,
            sourceLang,
            options?.reflexivePersons,
            options?.reflexiveSubjectRepeat
          )
        : { sequences: [[possessor]], hasAmbiguity: Boolean(possessor.alternatives?.length) };
      const possessorSequences = [
        ...possessorBuilt.sequences,
        ...demoParts.map((part) => [part]),
      ];
      const sequences = possessorSequences.flatMap((possessorSeq) =>
        possessed.sequences.map((seq) => [...possessorSeq, ...seq])
      );
      return {
        sequences,
        consumed: 1 + (emphasis?.consumed ?? 0) + phrase.consumed,
        hasAlternatives:
          possessorBuilt.hasAmbiguity ||
          possessed.hasAlternatives ||
          demoParts.length > 0,
      };
    }
    traceObject(`possMatch fail: determiner without noun phrase`);
  }

  if (sourceLang === "en") {
    const base = stripEnglishPossessiveSuffix(token.source);
    if (base) {
      const phrase = matchNounPhraseAfterArticle(tokens, index + 1, sourceLang);
      if (phrase) {
        const useOriginPossessor = Boolean(phrase.noun.verbalVerbForms);
        const possessed = buildObjectNounPhraseSequences(phrase, sourceLang, {
          forceHuman: options?.forceHuman,
          allowAlternatives: options?.allowAlternatives,
        });
        if (options?.comitativePossessive) {
       
          const fallbackPhrase: NounPhraseMatch = {
            adjectives: { pre: [], post: [] },
            noun: { gup: base, source: base, isHuman: undefined, consumed: 1 },
            consumed: 1,
          };
          const built = buildComitativePossessorSequences(
            fallbackPhrase,
            sourceLang
          );
          const sequences = possessed.sequences.flatMap((seq) =>
            built.sequences.map((possessorSeq) => [...possessorSeq, ...seq])
          );
          return {
            sequences,
            consumed: 1 + phrase.consumed,
            hasAlternatives: built.hasAlternatives || possessed.hasAlternatives,
          };
        }
        const possessor = useOriginPossessor
          ? buildOriginSuffixPart(base, token.source, sourceLang)
          : buildPossessiveSuffixPart(base, token.source, sourceLang);
        const barePossessor = finalizePart(
          {
            type: "noun",
            source: base,
            gup: base,
            output: base,
            explanation: "",
            explanations: [{ key: "TOKEN_PASSTHROUGH", data: { token: base } }],
          },
          sourceLang
        );
        const sequences = possessed.sequences.flatMap((seq) => [
          [possessor, ...seq],
          [barePossessor, ...seq],
        ]);
        return {
          sequences,
          consumed: 1 + phrase.consumed,
          hasAlternatives: true,
        };
      }
      traceObject(`possMatch fail: english 's without noun phrase`);
    }
  }

  let cursor = index;
  const articleVariants: TranslationPart[][] = [[]];
  let articleHasAlternatives = false;
  const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
  if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
    cursor += articleMatch.consumed;
    if (articleMatch.kind === "definite") {
      const dhuwalaPart = buildDefiniteArticlePart(
        "dhuwala",
        articleMatch.source,
        sourceLang
      );
      const duwaliPart = buildDefiniteArticlePart(
        "duwali",
        articleMatch.source,
        sourceLang
      );
      articleVariants.push([dhuwalaPart], [duwaliPart]);
      articleHasAlternatives = true;
    }
  }
  const possessedPhrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
  if (!possessedPhrase) {
    traceObject(`possMatch fail: no possessed phrase`);
    return null;
  }
  const useOriginPossessor = Boolean(possessedPhrase.noun.verbalVerbForms);
  const afterIndex = cursor + possessedPhrase.consumed;
  const connector = tokens[afterIndex];
  if (!connector) {
    traceObject(`possMatch fail: no connector after possessed`);
    return null;
  }
  const connectorNorm = normalizeToken(connector.source, sourceLang);
  const isOf =
    (sourceLang === "es" && connectorNorm === "de") ||
    (sourceLang === "en" && connectorNorm === "of");
  if (!isOf) {
    traceObject(`possMatch fail: connector "${connector.source}" not de/of`);
    return null;
  }

  const possessorStart = afterIndex + 1;
  const possessorToken = tokens[possessorStart];
  if (!possessorToken) return null;
  const pronounMatch = matchPossessiveOfPronoun(
    possessorToken.source,
    sourceLang
  );
  let possessorSequences: TranslationPart[][] | null = null;
  let possessorConsumed = 0;
  let possessorHasAlternatives = false;
  let possessorPhrase: NounPhraseMatch | null = null;
  if (pronounMatch) {
    const emphasis = matchPossessiveEmphasisAt(
      tokens,
      possessorStart,
      sourceLang
    );
    const isReflexive =
      !useOriginPossessor &&
      Boolean(emphasis) &&
      isReflexivePossessive(pronounMatch, options?.reflexivePersons);
    const allowComitativePossessive =
      options?.comitativePossessive && !useOriginPossessor && !emphasis;
    const part =
      allowComitativePossessive
        ? buildComitativePossessivePronounPart(pronounMatch, sourceLang)
        : useOriginPossessor
          ? buildOriginPossessivePronounPart(pronounMatch, sourceLang, {
              emphatic: Boolean(emphasis),
              sourceOverride: emphasis?.source,
            })
          : buildPossessivePronounPart(pronounMatch, sourceLang, {
              emphatic: Boolean(emphasis),
              sourceOverride: emphasis?.source,
              includeNonEmphatic: Boolean(emphasis) && !isReflexive,
            });
    if (part) {
      const built = isReflexive
        ? buildReflexivePossessiveSequences(
            part,
            sourceLang,
            options?.reflexivePersons,
            options?.reflexiveSubjectRepeat
          )
        : { sequences: [[part]], hasAmbiguity: Boolean(part.alternatives?.length) };
      possessorSequences = built.sequences;
      possessorConsumed = 1 + (emphasis?.consumed ?? 0);
      possessorHasAlternatives = built.hasAmbiguity;
      
    }
  } else {
    let possessorCursor = possessorStart;
    let possessorPrefixParts: TranslationPart[] = [];
    const possessorDeterminer = matchDhiyakuDeterminerAt(
      tokens,
      possessorCursor,
      sourceLang
    );
    if (possessorDeterminer) {
      if (possessorDeterminer.part) {
        possessorPrefixParts = [possessorDeterminer.part];
      }
      possessorCursor += possessorDeterminer.consumed;
    }
    const possessorPhraseMatch = matchNounPhraseAfterArticle(
      tokens,
      possessorCursor,
      sourceLang,
      { allowUnknownHead: true }
    );
    if (possessorPhraseMatch) {
      possessorPhrase = possessorPhraseMatch;
      const built =
        options?.comitativePossessive && !useOriginPossessor
          ? buildComitativePossessorSequences(possessorPhraseMatch, sourceLang)
          : useOriginPossessor
            ? buildOriginPossessorSequences(
                possessorPhraseMatch,
                sourceLang,
                possessorPrefixParts
              )
            : buildPossessorSequences(
                possessorPhraseMatch,
                sourceLang,
                possessorPrefixParts
              );
      possessorSequences = built.sequences;
      possessorConsumed =
        possessorCursor - possessorStart + possessorPhraseMatch.consumed;
      possessorHasAlternatives = built.hasAlternatives;
      
    } else if (!isStrongPunctuationToken(possessorToken)) {
      if (options?.comitativePossessive) {
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
        const built = buildComitativePossessorSequences(fallbackPhrase, sourceLang);
        possessorSequences = built.sequences;
        possessorConsumed = 1;
        possessorHasAlternatives = built.hasAlternatives;
      
      } else {
        const suffixPart = useOriginPossessor
          ? buildOriginSuffixPart(
              possessorToken.source,
              possessorToken.source,
              sourceLang
            )
          : buildPossessiveSuffixPart(
              possessorToken.source,
              possessorToken.source,
              sourceLang
            );
        const prefix =
          possessorPrefixParts.length > 0 ? possessorPrefixParts : [];
        const barePart = finalizePart(
          {
            type: "noun",
            source: possessorToken.source,
            gup: possessorToken.source,
            output: possessorToken.source,
            explanation: "",
            explanations: [
              {
                key: "TOKEN_PASSTHROUGH",
                data: { token: possessorToken.source },
              },
            ],
          },
          sourceLang
        );
        possessorSequences = [
          [...prefix, suffixPart],
          [barePart],
        ];
        possessorConsumed = 1;
        possessorHasAlternatives = true;
      }
    }
  }
  if (!possessorSequences) {
    traceObject(`possMatch fail: no possessor sequences`);
    return null;
  }
  traceObject(
    `possMatch success: possessedConsumed=${possessedPhrase.consumed} possessorConsumed=${possessorConsumed} article=${articleMatch?.source ?? ""}`
  );

  const possessed = buildObjectNounPhraseSequences(possessedPhrase, sourceLang, {
    forceHuman: options?.forceHuman,
    allowAlternatives: options?.allowAlternatives,
  });
  const sequences = articleVariants.flatMap((variant) =>
    possessed.sequences.flatMap((possessedSeq) =>
      possessorSequences.map((possessorSeq) => [
        ...variant,
        ...possessedSeq,
        ...possessorSeq,
      ])
    )
  );

  let originSequences: TranslationPart[][] | undefined;
  let originHasAlternatives = false;
  const buildOriginFromPhrase = (
    phrase: NounPhraseMatch
  ): { sequences: TranslationPart[][]; hasAlternatives: boolean } => {
    const isHuman = phrase.noun.isHuman === true;
    const isPlace = phrase.noun.isPlace === true;
    const ambiguousHuman =
      phrase.noun.isHuman === undefined && phrase.noun.isPlace === undefined;
    const suffixes = getSourceOriginSuffixes(phrase.noun.gup);

    const buildOriginSequence = (suffix: string): TranslationPart[] =>
      buildNounPhraseParts(phrase, sourceLang, {
        suffix,
        nounNote: {
          key: "ORIGIN_SUFFIX",
          data: { token: phrase.noun.source, gup: suffix },
        },
      });
    const buildNonHumanSequence = (): TranslationPart[] =>
      buildNounPhraseParts(phrase, sourceLang, {
        suffix: "ŋuru",
        nounNote: { key: "ORIGIN_NONHUMAN_ALT" },
      });

    const sequences: TranslationPart[][] = [];
    let hasAlternatives = false;
    if (isHuman) {
      sequences.push(...suffixes.map((suffix) => buildOriginSequence(suffix)));
      if (suffixes.length > 1) hasAlternatives = true;
    } else if (isPlace) {
      sequences.push(buildNonHumanSequence());
    } else if (ambiguousHuman) {
      sequences.push(...suffixes.map((suffix) => buildOriginSequence(suffix)));
      sequences.push(buildNonHumanSequence());
      hasAlternatives = true;
    } else {
      sequences.push(buildNonHumanSequence());
    }
    return { sequences, hasAlternatives };
  };

  let originPossessorSequences: TranslationPart[][] | null = null;
  let originPossessorHasAlternatives = false;
  const originPronounMatch = matchSourceOriginPronounAt(
    tokens,
    afterIndex,
    sourceLang
  );
  if (
    originPronounMatch &&
    originPronounMatch.consumed === 1 + possessorConsumed
  ) {
    const part = buildSourceOriginPronounPart(originPronounMatch);
    if (part) {
      originPossessorSequences = [[part]];
      originPossessorHasAlternatives = Boolean(part.alternatives?.length);
    }
  } else if (possessorPhrase) {
    const built = buildOriginFromPhrase(possessorPhrase);
    originPossessorSequences = built.sequences;
    originPossessorHasAlternatives = built.hasAlternatives;
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
    const built = buildOriginFromPhrase(fallbackPhrase);
    originPossessorSequences = built.sequences;
    originPossessorHasAlternatives = built.hasAlternatives;
  }

  if (originPossessorSequences) {
    originSequences = articleVariants.flatMap((variant) =>
      possessed.sequences.flatMap((possessedSeq) =>
        originPossessorSequences.map((originSeq) => [
          ...variant,
          ...possessedSeq,
          ...originSeq,
        ])
      )
    );
    originHasAlternatives =
      articleHasAlternatives ||
      possessed.hasAlternatives ||
      originPossessorHasAlternatives;
  }
  return {
    sequences,
    consumed:
      cursor - index + possessedPhrase.consumed + 1 + possessorConsumed,
    hasAlternatives:
      possessorHasAlternatives ||
      articleHasAlternatives ||
      possessed.hasAlternatives,
    originSequences,
    originHasAlternatives: originSequences ? originHasAlternatives : undefined,
  };
}

export function buildObjectSequencesFromMatch(
  match: ObjectPronounMatch | null,
  sourceLang: LanguageMode,
  options?: {
    comitativePossessive?: boolean;
    allowNonHumanDemonstrative?: boolean;
  }
): { sequences: TranslationPart[][]; hasDrop: boolean } {
  if (!match) return { sequences: [[]], hasDrop: false };
  const normalized = normalizeToken(match.source, sourceLang);
  const isNonHumanPronoun =
    (sourceLang === "en" && normalized === "it") ||
    (sourceLang === "es" && normalized === "ello");
  if (!match.primaryKey && isNonHumanPronoun) {
    if (options?.allowNonHumanDemonstrative) {
      const sequences: TranslationPart[][] = ["dhuwala", "dhuwali"].map(
        (gup) => [
          finalizePart(
            {
              type: "pronoun",
              source: match.source,
              gup,
              output: gup,
              explanation: "",
              explanations: [
                { key: "PRONOUN_OBJECT", data: { token: match.source, gup } },
                { key: "PRONOUN_OBJECT_NONHUMAN_DEMONSTRATIVE" },
              ],
            },
            sourceLang
          ),
        ]
      );
      return { sequences, hasDrop: false };
    }
    return { sequences: [[]], hasDrop: true };
  }
  const part = buildObjectPronounPart(match);
  if (!part) {
    return { sequences: [[]], hasDrop: false };
  }
  const rendered = finalizePart(part, sourceLang);
  if (match.allowDrop) {
    return { sequences: [[rendered], []], hasDrop: true };
  }
  return { sequences: [[rendered]], hasDrop: false };
}

function objectMatchFromPerson(
  person: PersonNumber,
  source: string
): ObjectPronounMatch | null {
  let primaryKey: ObjectPronounKey | null = null;
  let alternativeKeys: ObjectPronounKey[] | undefined;
  switch (person) {
    case "1_Sing":
      primaryKey = "1_Sing";
      break;
    case "2_Sing":
      primaryKey = "2_Sing";
      break;
    case "3_Sing":
      primaryKey = "3_Sing";
      break;
    case "1+2_Plur":
      primaryKey = "1+2_Plur_Incl";
      alternativeKeys = ["1+2_Plur_Excl"];
      break;
    case "1+3_Plur":
      primaryKey = "1+2_Plur_Excl";
      break;
    case "2_Plur":
      primaryKey = "2_Plur";
      break;
    case "3_Plur":
      primaryKey = "3_Plur";
      break;
    default:
      return null;
  }
  return {
    source,
    primaryKey,
    alternativeKeys,
    allowDrop: false,
  };
}

const isReflexivePossessive = (
  match: PossessivePersonMatch,
  reflexivePersons?: PersonNumber[]
): boolean => {
  if (!reflexivePersons || reflexivePersons.length === 0) return false;
  const persons = collectPossessivePersons(match);
  return persons.some((person) => reflexivePersons.includes(person));
};

const buildReflexivePossessiveSequences = (
  part: TranslationPart,
  sourceLang: LanguageMode,
  reflexivePersons?: PersonNumber[],
  repeatSubject?: boolean
): { sequences: TranslationPart[][]; hasAmbiguity: boolean } => {
  const sequences: TranslationPart[][] = [[part]];
  let hasAmbiguity = Boolean(part.alternatives?.length);
  if (repeatSubject && reflexivePersons && reflexivePersons.length > 0) {
    const subjectPart = buildSubjectRepeatPart(
      reflexivePersons[0],
      sourceLang
    );
    if (subjectPart) {
      sequences.push([part, subjectPart]);
      hasAmbiguity = true;
    }
  }
  return { sequences, hasAmbiguity };
};

function objectPersonFromKey(key: ObjectPronounKey): PersonNumber {
  switch (key) {
    case "1_Sing":
      return "1_Sing";
    case "2_Sing":
      return "2_Sing";
    case "3_Sing":
      return "3_Sing";
    case "1_Dual_Incl":
      return "1+2_Dual";
    case "1_Dual_Excl":
      return "1+3_Dual";
    case "2_Dual":
      return "2_Dual";
    case "3_Dual":
      return "3_Dual";
    case "1+2_Plur_Incl":
      return "1+2_Plur";
    case "1+2_Plur_Excl":
      return "1+3_Plur";
    case "2_Plur":
      return "2_Plur";
    case "3_Plur":
      return "3_Plur";
  }
}

function buildSubjectRepeatPart(
  person: PersonNumber,
  sourceLang: LanguageMode
): TranslationPart | null {
  const forms = SUBJECT_PRONOUNS_GUP[person] ?? [];
  const gup = forms[0] ?? "";
  if (!gup) return null;
  const explanations: ExplanationPayload[] = [
    {
      key: "PRONOUN_SUBJECT_BASE",
      data: { token: gup, gup, person },
    },
  ];
  const alternatives =
    forms.length > 1 ? forms.slice(1).map((form) => ({ gup: form })) : undefined;
  return finalizePart(
    {
      type: "pronoun",
      source: gup,
      gup,
      output: gup,
      explanation: "",
      explanations,
      alternatives,
      meaningKey: `pronoun.${person}`,
    },
    sourceLang
  );
}

export function buildObjectSequencesFromPending(
  pending: PendingObject | null,
  sourceLang: LanguageMode,
  options?: {
    allowNonHumanDemonstrative?: boolean;
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): { sequences: TranslationPart[][]; hasDrop: boolean } {
  if (!pending) return { sequences: [[]], hasDrop: false };
  if (pending.kind === "pronoun") {
    const reflexivePersons = options?.reflexivePersons ?? [];
    if (reflexivePersons.length > 0) {
      const objectPersons = new Set<PersonNumber>();
      if (pending.match.primaryKey) {
        objectPersons.add(objectPersonFromKey(pending.match.primaryKey));
      }
      if (pending.match.alternativeKeys) {
        for (const key of pending.match.alternativeKeys) {
          objectPersons.add(objectPersonFromKey(key));
        }
      }
      const isReflexive = [...objectPersons].some((person) =>
        reflexivePersons.includes(person)
      );
      if (isReflexive) {
        const emphaticPart = buildEmphaticObjectPronounPart(pending.match);
        if (emphaticPart) {
          const rendered = finalizePart(emphaticPart, sourceLang);
          const sequences: TranslationPart[][] = [[rendered]];
          if (options?.reflexiveSubjectRepeat) {
            const subjectPart = buildSubjectRepeatPart(
              reflexivePersons[0],
              sourceLang
            );
            if (subjectPart) {
              sequences.push([rendered, subjectPart]);
            }
          }
          return { sequences, hasDrop: false };
        }
      }
    }
    return buildObjectSequencesFromMatch(pending.match, sourceLang, {
      allowNonHumanDemonstrative: options?.allowNonHumanDemonstrative,
    });
  }
  const part = finalizePart(
    buildObjectNounPart(pending.match, sourceLang, {
      forceHuman: pending.forceHuman,
      allowAlternatives: pending.allowAlternatives,
    }),
    sourceLang
  );
  return { sequences: [[part]], hasDrop: false };
}

const matchObjectEmphasisAt = (
  tokens: TokenLike[],
  pronounIndex: number,
  sourceLang: LanguageMode
): { source: string; consumed: number; hasDualMarker: boolean } | null => {
  const pack = getLanguagePack(sourceLang);
  const markers = pack.emphasisMarkers ?? [];
  if (markers.length === 0) return null;
  const normalizedMarkers = new Set(
    markers.map((marker) => pack.normalize(marker))
  );
  const dualMarkers = new Set(
    (pack.dualMarkers ?? []).map((marker) => pack.normalize(marker))
  );
  const token = tokens[pronounIndex];
  if (!token) return null;
  const normalized = pack.normalize(token.source);
  if (normalizedMarkers.has(normalized)) {
    return { source: token.source, consumed: 0, hasDualMarker: false };
  }
  const next = tokens[pronounIndex + 1];
  if (!next) return null;
  const nextNormalized = pack.normalize(next.source);
  if (normalizedMarkers.has(nextNormalized)) {
    return {
      source: `${token.source} ${next.source}`,
      consumed: 1,
      hasDualMarker: false,
    };
  }
  const afterDual = tokens[pronounIndex + 2];
  if (dualMarkers.has(nextNormalized) && afterDual) {
    const afterNormalized = pack.normalize(afterDual.source);
    if (normalizedMarkers.has(afterNormalized)) {
      return {
        source: `${token.source} ${next.source} ${afterDual.source}`,
        consumed: 2,
        hasDualMarker: true,
      };
    }
  }
  return null;
};

const applyDualMarkerToObjectMatch = (
  match: ObjectPronounMatch
): ObjectPronounMatch => {
  switch (match.primaryKey) {
    case "1+2_Plur_Incl":
    case "1+2_Plur_Excl":
      return {
        ...match,
        primaryKey: "1_Dual_Incl",
        alternativeKeys: ["1_Dual_Excl"],
      };
    case "2_Plur":
    case "2_Sing":
      return { ...match, primaryKey: "2_Dual", alternativeKeys: undefined };
    case "3_Plur":
      return { ...match, primaryKey: "3_Dual", alternativeKeys: undefined };
    default:
      return match;
  }
};

export function matchObjectPronounAfterA(
  token: string,
  sourceLang: LanguageMode
): ObjectPronounMatch | null {
  const direct = matchObjectPronoun(token, sourceLang);
  if (direct) return direct;
  if (sourceLang === "es") {
    const normalized = normalizeToken(token, sourceLang);
    if (normalized === "mi" || normalized === "mí") {
      return {
        source: token,
        primaryKey: "1_Sing",
        allowDrop: false,
      };
    }
    if (normalized === "ti") {
      return {
        source: token,
        primaryKey: "2_Sing",
        allowDrop: false,
      };
    }
    const subjectMatch = matchSubjectPronoun(token, sourceLang);
    if (subjectMatch) {
      return objectMatchFromPerson(subjectMatch.person, token);
    }
  }
  return null;
}

export function appendObjectSequences(
  base: TranslationPart[][],
  addition: TranslationPart[][]
): TranslationPart[][] {
  const next: TranslationPart[][] = [];
  for (const seq of base) {
    for (const add of addition) {
      next.push([...seq, ...add]);
    }
  }
  return next;
}

export function collectObjectSequencesAfterVerb(
  tokens: TokenLike[],
  startIndex: number,
  sourceLang: LanguageMode,
  options?: {
    comitativePossessive?: boolean;
    allowNonHumanDemonstrative?: boolean;
    reflexivePersons?: PersonNumber[];
    reflexiveSubjectRepeat?: boolean;
  }
): {
  sequences: TranslationPart[][];
  originSequences?: TranslationPart[][];
  consumed: number;
  hasDrop: boolean;
  hasAmbiguity: boolean;
  originHasAmbiguity?: boolean;
} {
  traceObject(
    `collectObjects startIndex=${startIndex} token="${tokens[startIndex]?.source ?? ""}"`
  );
  let sequences: TranslationPart[][] = [[]];
  let seqHasObject: boolean[] = [false];
  let seqPendingConnector: (ConnectorMatch | null)[] = [null];
  let consumed = 0;
  let hasDrop = false;
  let hasAmbiguity = false;
  let originSequences: TranslationPart[][] | null = null;
  let originHasAmbiguity = false;
  let index = startIndex;
  let seenObject = false;
  let pendingArticleAlternatives: TranslationPart[][] | null = null;
  const habitualMarkerIndices = new Set(
    collectHabitualMarkerIndices(tokens, sourceLang)
  );
  if (
    isHabitualMarkerAt(tokens, startIndex, sourceLang) ||
    habitualMarkerIndices.has(startIndex) ||
    habitualMarkerIndices.has(startIndex + 1)
  ) {
    traceObject(
      `collectObjects early-exit habitual startIndex=${startIndex} token="${
        tokens[startIndex]?.source ?? ""
      }"`
    );
   
    return {
      sequences: [[]],
      consumed: 0,
      hasDrop: false,
      hasAmbiguity: false,
    };
  }

const prepositionLeadTokens = new Set(
    [
      ...(LOCATIVE_PREPOSITIONS[sourceLang] ?? []),
      ...(COMITATIVE_PREPOSITIONS[sourceLang] ?? []),
      ...(TRAVERSE_PREPOSITIONS[sourceLang] ?? []),
      ...(INSTRUMENTAL_PREPOSITIONS[sourceLang] ?? []),
      ...(PURPOSE_PREPOSITIONS[sourceLang] ?? []),
      ...(ABOUT_PREPOSITIONS[sourceLang] ?? []),
      ...(INDIRECT_PREPOSITIONS[sourceLang] ?? []),
      ...(ALLATIVE_PREPOSITIONS[sourceLang] ?? []),
      ...(ABLATIVE_PREPOSITIONS[sourceLang] ?? []),
      ...(ORIGIN_PREPOSITIONS[sourceLang] ?? []),
    ].map((entry) => entry[0])
  );
  const locativeAdverbTokens = new Set(
    Object.values(LEXICON.markers ?? {})
      .filter((entry) => entry.locationRole)
      .flatMap((entry) => entry.formsByLang?.[sourceLang] ?? [])
      .map((form) => normalizeToken(form, sourceLang))
  );

  const simultaneousMarkers: Record<LanguageMode, string[]> = {
    es: ["mientras", "al", "durante"],
    en: ["while", "during"],
  };

  const isSimultaneousMarkerAt = (idx: number): boolean => {
    const token = tokens[idx];
    if (!token) return false;
    const normalized = normalizeToken(token.source, sourceLang);
    if (!(simultaneousMarkers[sourceLang] ?? []).includes(normalized)) return false;
    const nextIndex = idx + 1;
    const nextMatches = matchVerbAt(tokens, nextIndex, sourceLang);
    if (nextMatches.length > 0) return true;
    const infinitiveMatch = matchInfinitiveAt(
      tokens as IRToken[],
      nextIndex,
      sourceLang
    );
    if (infinitiveMatch) return true;
    const gerundMatch = matchGerundAfterIndex(
      tokens as IRToken[],
      nextIndex,
      sourceLang
    );
    if (gerundMatch && gerundMatch.gerundIndex === nextIndex) return true;
    return false;
  };

  const isPrepositionLeadToken = (idx: number): boolean => {
    const token = tokens[idx];
    if (!token) return false;
    const normalized = normalizeToken(token.source, sourceLang);
    if (sourceLang === "es" && normalized === "a") {
      return false;
    }
    if (locativeAdverbTokens.has(normalized)) return true;
    return prepositionLeadTokens.has(normalized);
  };

  const isDirectObjectMarkerA = (idx: number): boolean => {
    if (sourceLang !== "es") return false;
    const token = tokens[idx];
    if (!token) return false;
    if (habitualMarkerIndices.has(idx) || habitualMarkerIndices.has(idx + 1)) {
      return false;
    }
    const normalized = normalizeToken(token.source, sourceLang);
    if (normalized !== "a" && normalized !== "al") return false;
    const nextToken = tokens[idx + 1];
    if (nextToken) {
      if (isNonHumanDemoPronoun(nextToken.source, sourceLang)) {
        return false;
      }
      const demoMatch = matchDemonstrativeToken(nextToken.source, sourceLang);
      if (demoMatch) {
        const phraseAfterDemo = matchNounPhraseAfterArticle(
          tokens,
          idx + 2,
          sourceLang
        );
        if (!phraseAfterDemo) {
          return false;
        }
      }
    }
    const nextNorm = normalizeTraversiveToken(
      tokens[idx + 1]?.source ?? "",
      sourceLang
    );
    const nextNextNorm = normalizeTraversiveToken(
      tokens[idx + 2]?.source ?? "",
      sourceLang
    );
    if (nextNorm === "traves" && (nextNextNorm === "de" || nextNextNorm === "del")) {
      return false;
    }
    const purpose = matchPurposePrepositionAt(tokens, idx, sourceLang);
    if (purpose && purpose.consumed > 1) return false;
    const allative = matchAllativePrepositionAt(tokens, idx, sourceLang);
    if (allative && allative.consumed > 1) return false;
    const locative = matchLocativePrepositionAt(tokens, idx, sourceLang);
    if (locative && locative.consumed > 1) return false;
    const comitative = matchComitativePrepositionAt(tokens, idx, sourceLang);
    if (comitative && comitative.consumed > 1) return false;
    const traversive = matchTraversivePrepositionAt(tokens, idx, sourceLang);
    if (traversive && traversive.consumed > 1) return false;
    const instrumental = matchInstrumentalPrepositionAt(tokens, idx, sourceLang);
    if (instrumental && instrumental.consumed > 1) return false;
    const ablative = matchAblativePrepositionAt(tokens, idx, sourceLang);
    if (ablative && ablative.consumed > 1) return false;
    const origin = matchOriginPrepositionAt(tokens, idx, sourceLang);
    if (origin && origin.consumed > 1) return false;
    const phrase = matchNounPhraseAfterArticle(tokens, idx + 1, sourceLang);
    if (phrase?.noun.isPlace) return false;
    return true;
  };

  const isBreakToken = (idx: number): boolean => {
    const token = tokens[idx];
    if (!token) return true;
    if (sourceLang === "en") {
      const normalized = normalizeToken(token.source, sourceLang);
      const nextNorm = normalizeToken(tokens[idx + 1]?.source ?? "", sourceLang);
      if (normalized === "because" && nextNorm === "of") return true;
    }
    if (isSimultaneousMarkerAt(idx)) return true;
    if (sourceLang === "es") {
      const normalized = normalizeToken(token.source, sourceLang);
      if (normalized === "a" || normalized === "al") {
        const nextNorm = normalizeTraversiveToken(
          tokens[idx + 1]?.source ?? "",
          sourceLang
        );
        const nextNextNorm = normalizeTraversiveToken(
          tokens[idx + 2]?.source ?? "",
          sourceLang
        );
        if (
          nextNorm === "traves" &&
          (nextNextNorm === "de" || nextNextNorm === "del")
        ) {
          return true;
        }
        const purpose = matchPurposePrepositionAt(tokens, idx, sourceLang);
        if (purpose && purpose.consumed > 1) return true;
        const allative = matchAllativePrepositionAt(tokens, idx, sourceLang);
        if (allative && allative.consumed > 1) return true;
        const locative = matchLocativePrepositionAt(tokens, idx, sourceLang);
        if (locative && locative.consumed > 1) return true;
        const comitative = matchComitativePrepositionAt(tokens, idx, sourceLang);
        if (comitative && comitative.consumed > 1) return true;
        const traversive = matchTraversivePrepositionAt(tokens, idx, sourceLang);
        if (traversive && traversive.consumed > 1) return true;
        const instrumental = matchInstrumentalPrepositionAt(
          tokens,
          idx,
          sourceLang
        );
        if (instrumental && instrumental.consumed > 1) return true;
        const ablative = matchAblativePrepositionAt(tokens, idx, sourceLang);
        if (ablative && ablative.consumed > 1) return true;
        const origin = matchOriginPrepositionAt(tokens, idx, sourceLang);
        if (origin && origin.consumed > 1) return true;
        const phrase = matchNounPhraseAfterArticle(tokens, idx + 1, sourceLang);
        if (phrase?.noun.isPlace) return true;
        return false;
      }
    }
    const marker = matchMarkerAt(tokens, idx, sourceLang);
    if (marker?.entry.pos === "punctuation") return true;
    if (isStrongPunctuationToken(token)) return true;
    if (matchLocativeMarkerAt(tokens, idx, sourceLang)) return true;
    if (locativeAdverbTokens.has(normalizeToken(token.source, sourceLang))) return true;
    if (!isDirectObjectMarkerA(idx)) {
      if (matchLocativePrepositionAt(tokens, idx, sourceLang)) return true;
      if (matchComitativePrepositionAt(tokens, idx, sourceLang)) return true;
      if (matchTraversivePrepositionAt(tokens, idx, sourceLang)) return true;
      if (matchInstrumentalPrepositionAt(tokens, idx, sourceLang)) return true;
      if (matchPurposePrepositionAt(tokens, idx, sourceLang)) return true;
      if (matchIndirectPrepositionAt(tokens, idx, sourceLang)) return true;
      if (matchAllativePrepositionAt(tokens, idx, sourceLang)) return true;
      if (matchAblativePrepositionAt(tokens, idx, sourceLang)) return true;
    }
    if (matchComitativePronounAt(tokens, idx, sourceLang)) return true;
    if (matchOriginPrepositionAt(tokens, idx, sourceLang)) {
      const originMatch = matchOriginPrepositionAt(tokens, idx, sourceLang);
        if (originMatch && originMatch.consumed === 1) {
          const possPhrase = matchPossessiveObjectPhraseAt(
            tokens,
            idx + originMatch.consumed,
            sourceLang,
            {
              comitativePossessive: options?.comitativePossessive,
              reflexivePersons: options?.reflexivePersons,
              reflexiveSubjectRepeat: options?.reflexiveSubjectRepeat,
            }
          );
          if (possPhrase) return false;
        }
      return true;
    }
    if (!isDirectObjectMarkerA(idx)) {
      if (isLocativePrepositionStart(tokens, idx, sourceLang)) return true;
      if (isComitativePrepositionStart(tokens, idx, sourceLang)) return true;
      if (isTraversivePrepositionStart(tokens, idx, sourceLang)) return true;
      if (isInstrumentalPrepositionStart(tokens, idx, sourceLang)) return true;
      if (isPurposePrepositionStart(tokens, idx, sourceLang)) return true;
      if (isIndirectPrepositionStart(tokens, idx, sourceLang)) return true;
      if (isAllativePrepositionStart(tokens, idx, sourceLang)) return true;
      if (isAblativePrepositionStart(tokens, idx, sourceLang)) return true;
      if (isOriginPrepositionStart(tokens, idx, sourceLang)) return true;
    }
    if (matchComitativePronounAt(tokens, idx, sourceLang)) return true;
    if (isPrepositionLeadToken(idx)) return true;
    if (isNegatorToken(token, sourceLang)) return true;
    if (isClauseConnectorToken(tokens, idx, sourceLang)) return true;
    if (isBreakAdverbToken(tokens, idx, sourceLang)) return true;
    if (matchVerbAt(tokens, idx, sourceLang).length > 0) return true;
    return false;
  };

  const isObjectCandidate = (idx: number): boolean => {
    if (!tokens[idx]) return false;
    if (sourceLang === "en") {
      const normalized = normalizeToken(tokens[idx].source, sourceLang);
      const nextNorm = normalizeToken(tokens[idx + 1]?.source ?? "", sourceLang);
      if (normalized === "because" && nextNorm === "of") return false;
    }
    if (sourceLang === "es") {
      const normalized = normalizeToken(tokens[idx].source, sourceLang);
      if (normalized === "a" || normalized === "al") {
        const nextVerb = matchVerbAt(tokens, idx + 1, sourceLang);
        if (nextVerb.length > 0) return false;
        const nextNorm = normalizeToken(tokens[idx + 1]?.source ?? "", sourceLang);
        const nextNextNorm = normalizeToken(tokens[idx + 2]?.source ?? "", sourceLang);
        if (
          normalized === "a" &&
          nextNorm === "punto" &&
          nextNextNorm === "de" &&
          matchVerbAt(tokens, idx + 3, sourceLang).length > 0
        ) {
          return false;
        }
        const purpose = matchPurposePrepositionAt(tokens, idx, sourceLang);
        if (purpose && purpose.consumed > 1) return false;
        const allative = matchAllativePrepositionAt(tokens, idx, sourceLang);
        if (allative && allative.consumed > 1) return false;
        const locative = matchLocativePrepositionAt(tokens, idx, sourceLang);
        if (locative && locative.consumed > 1) return false;
        const comitative = matchComitativePrepositionAt(tokens, idx, sourceLang);
        if (comitative && comitative.consumed > 1) return false;
        const instrumental = matchInstrumentalPrepositionAt(
          tokens,
          idx,
          sourceLang
        );
        if (instrumental && instrumental.consumed > 1) return false;
        const ablative = matchAblativePrepositionAt(tokens, idx, sourceLang);
        if (ablative && ablative.consumed > 1) return false;
        const origin = matchOriginPrepositionAt(tokens, idx, sourceLang);
        if (origin && origin.consumed > 1) return false;
        const phrase = matchNounPhraseAfterArticle(tokens, idx + 1, sourceLang);
        if (phrase?.noun.isPlace) return false;
        return true;
      }
    }
    if (isBreakToken(idx)) return false;
    if (matchLocativePrepositionAt(tokens, idx, sourceLang)) return false;
    if (matchComitativePrepositionAt(tokens, idx, sourceLang)) return false;
    if (matchTraversivePrepositionAt(tokens, idx, sourceLang)) return false;
    if (matchPurposePrepositionAt(tokens, idx, sourceLang)) return false;
    if (matchIndirectPrepositionAt(tokens, idx, sourceLang)) return false;
    if (matchAllativePrepositionAt(tokens, idx, sourceLang)) return false;
    if (matchAblativePrepositionAt(tokens, idx, sourceLang)) return false;
    if (matchOriginPrepositionAt(tokens, idx, sourceLang)) {
      const originMatch = matchOriginPrepositionAt(tokens, idx, sourceLang);
      if (originMatch && originMatch.consumed === 1) {
        const possPhrase = matchPossessiveObjectPhraseAt(
          tokens,
          idx + originMatch.consumed,
          sourceLang,
          {
            comitativePossessive: options?.comitativePossessive,
            reflexivePersons: options?.reflexivePersons,
            reflexiveSubjectRepeat: options?.reflexiveSubjectRepeat,
          }
        );
        if (possPhrase) return true;
      }
      return false;
    }
    if (matchComitativePronounAt(tokens, idx, sourceLang)) return false;
    if (isPrepositionLeadToken(idx)) return false;
    if (matchLocativeMarkerAt(tokens, idx, sourceLang)) return false;
    if (locativeAdverbTokens.has(normalizeToken(tokens[idx].source, sourceLang))) {
      return false;
    }
    const normalized = normalizeToken(tokens[idx].source, sourceLang);
    if (matchObjectPronoun(tokens[idx].source, sourceLang)) return true;
    if (matchNounAt(tokens, idx, sourceLang)) return true;
    return true;
  };

  while (index < tokens.length) {
    traceObject(`collectObjects loop index=${index} token="${tokens[index]?.source ?? ""}"`);
    if (isHabitualMarkerAt(tokens, index, sourceLang)) {
      traceObject(
        `collectObjects break habitual pattern at index=${index} token="${
          tokens[index]?.source ?? ""
        }"`
      );
      break;
    }
    if (habitualMarkerIndices.has(index) || habitualMarkerIndices.has(index + 1)) {
      traceObject(
        `collectObjects break habitual index=${index} token="${
          tokens[index]?.source ?? ""
        }"`
      );
      break;
    }
    if (isBreakToken(index)) break;
    if (
      matchLocativeMarkerAt(tokens, index, sourceLang) ||
      (!isDirectObjectMarkerA(index) &&
        (matchLocativePrepositionAt(tokens, index, sourceLang) ||
          matchComitativePrepositionAt(tokens, index, sourceLang) ||
          matchTraversivePrepositionAt(tokens, index, sourceLang) ||
          matchPurposePrepositionAt(tokens, index, sourceLang) ||
          matchAllativePrepositionAt(tokens, index, sourceLang) ||
          matchAblativePrepositionAt(tokens, index, sourceLang) ||
          matchOriginPrepositionAt(tokens, index, sourceLang)))
    ) {
      break;
    }
    const connector = matchConnectorAt(tokens, index, sourceLang);
    if (connector) {
      const newSequences: TranslationPart[][] = [];
      const newHasObject: boolean[] = [];
      const nextPending: (ConnectorMatch | null)[] = [];
      for (let idx = 0; idx < sequences.length; idx += 1) {
        if (seqPendingConnector[idx]) {
          newSequences.push(sequences[idx]);
          newHasObject.push(seqHasObject[idx]);
          nextPending.push(seqPendingConnector[idx]);
        } else {
          newSequences.push(sequences[idx]);
          newHasObject.push(seqHasObject[idx]);
          nextPending.push(connector);
        }
      }
      sequences = newSequences;
      seqHasObject = newHasObject;
      seqPendingConnector = nextPending;
      if (seenObject) {
        consumed += connector.consumed;
      }
      index += connector.consumed;
      continue;
    }

    const token = tokens[index];
    let phraseStart = index;
    let prefixConsumed = 0;
    let extraConsumed = 0;
    let forceHuman = false;
    let allowAlternatives = true;
    let dePrepositionIndex: number | null = null;

    if (sourceLang === "es") {
      const normalized = normalizeToken(token?.source ?? "", sourceLang);
      if (normalized === "a") {
        const nextToken = tokens[index + 1];
        if (nextToken) {
          prefixConsumed = 1;
          phraseStart = index + 1;
          forceHuman = true;
          allowAlternatives = false;
          dePrepositionIndex = index;
        }
      } else if (normalized === "al") {
        prefixConsumed = 1;
        phraseStart = index + 1;
        forceHuman = true;
        allowAlternatives = false;
        dePrepositionIndex = index;
      }
    }

    const partSequences: TranslationPart[][] = [];
    let originPartSequences: TranslationPart[][] | null = null;

    const expandWithPending = (
      baseSequences: TranslationPart[][],
      parts: TranslationPart[][]
    ): TranslationPart[][] => {
      const expanded: TranslationPart[][] = [];
      for (let idx = 0; idx < baseSequences.length; idx += 1) {
        const seq = baseSequences[idx];
        const pending = seqPendingConnector[idx % seqPendingConnector.length];
        const connectorPart = pending
          ? buildConnectorPart(pending, sourceLang)
          : null;
        for (const partSeq of parts) {
          if (connectorPart) {
            expanded.push([...seq, connectorPart, ...partSeq]);
          } else {
            expanded.push([...seq, ...partSeq]);
          }
        }
      }
      return expanded;
    };

    const pushSequences = (
      parts: TranslationPart[][],
      originParts?: TranslationPart[][]
    ) => {
      partSequences.push(...expandWithPending(sequences, parts));
      if (originParts) {
        const originBase = originSequences ?? sequences;
        originPartSequences = expandWithPending(originBase, originParts);
      } else if (originSequences) {
        originPartSequences = expandWithPending(originSequences, parts);
      }
    };
    const commitSequences = () => {
      sequences = partSequences;
      if (originPartSequences) {
        originSequences = originPartSequences;
      }
      seqHasObject = seqHasObject.map(() => true);
      seqPendingConnector = seqHasObject.map(() => null);
    };

    if (sourceLang === "es") {
      const normalized = normalizeToken(token?.source ?? "", sourceLang);
      if ((normalized === "a" || normalized === "al") && tokens[index + 1]) {
        const nextToken = tokens[index + 1];
        const directPronoun = nextToken
          ? matchObjectPronounAfterA(nextToken.source, sourceLang)
          : null;
        const emphasis = directPronoun
          ? matchObjectEmphasisAt(tokens, index + 1, sourceLang)
          : null;
        if (!emphasis) {
          traceObject(`objLoop@${index} saw "${normalized}" -> directPossessive`);
          const directPossessive = matchPossessiveObjectPhraseAt(
            tokens,
            index + 1,
            sourceLang,
            {
              forceHuman: true,
              allowAlternatives: false,
              comitativePossessive: options?.comitativePossessive,
              reflexivePersons: options?.reflexivePersons,
              reflexiveSubjectRepeat: options?.reflexiveSubjectRepeat,
            }
          );
          traceObject(
            `directPossessive ${directPossessive ? "matched" : "missed"}`
          );
          if (directPossessive) {
            if (directPossessive.hasAlternatives) {
              hasAmbiguity = true;
            }
            let expanded = directPossessive.sequences;
            let originExpanded = directPossessive.originSequences ?? null;
            if (pendingArticleAlternatives) {
              const withArticles: TranslationPart[][] = [];
              const withOrigin: TranslationPart[][] = [];
              for (const articleSeq of pendingArticleAlternatives) {
                for (const seq of expanded) {
                  withArticles.push([...articleSeq, ...seq]);
                }
                if (originExpanded) {
                  for (const seq of originExpanded) {
                    withOrigin.push([...articleSeq, ...seq]);
                  }
                }
              }
              expanded = withArticles;
              originExpanded = originExpanded ? withOrigin : null;
              pendingArticleAlternatives = null;
            }
            if (originExpanded && originExpanded.length > 0) {
              pushSequences(expanded, originExpanded);
              originHasAmbiguity =
                originHasAmbiguity ||
                Boolean(directPossessive.originHasAlternatives);
              hasAmbiguity = true;
            } else {
              pushSequences(expanded);
            }
            const consumedHere = 1 + directPossessive.consumed;
            consumed += consumedHere;
            index += consumedHere;
            seenObject = true;
            commitSequences();
            continue;
          }
        }
      }
    }

    let skipPossessiveMatch = false;
    if (sourceLang === "es") {
      const normalized = normalizeToken(token?.source ?? "", sourceLang);
      if ((normalized === "a" || normalized === "al") && tokens[index + 1]) {
        const directPronoun = matchObjectPronounAfterA(
          tokens[index + 1].source,
          sourceLang
        );
        const emphasis = directPronoun
          ? matchObjectEmphasisAt(tokens, index + 1, sourceLang)
          : null;
        if (emphasis) {
          skipPossessiveMatch = true;
        }
      }
    }
    const possessiveMatch = skipPossessiveMatch
      ? null
      : matchPossessiveObjectPhraseAt(tokens, phraseStart, sourceLang, {
          forceHuman,
          allowAlternatives,
          comitativePossessive: options?.comitativePossessive,
          reflexivePersons: options?.reflexivePersons,
          reflexiveSubjectRepeat: options?.reflexiveSubjectRepeat,
        });
    traceObject(
      `possessiveMatch@${phraseStart} ${possessiveMatch ? "matched" : "missed"}`
    );
    if (!possessiveMatch && dePrepositionIndex !== null) {
      const afterPossessive = matchPossessiveObjectPhraseAt(
        tokens,
        phraseStart + 1,
        sourceLang,
        {
          forceHuman,
          allowAlternatives,
          comitativePossessive: options?.comitativePossessive,
          reflexivePersons: options?.reflexivePersons,
          reflexiveSubjectRepeat: options?.reflexiveSubjectRepeat,
        }
      );
      if (afterPossessive) {
        const consumedHere = prefixConsumed + 1 + afterPossessive.consumed;
        prefixConsumed = 0;
        const expanded = afterPossessive.sequences;
        let originExpanded = afterPossessive.originSequences ?? null;
        if (pendingArticleAlternatives) {
          const withArticles: TranslationPart[][] = [];
          const withOrigin: TranslationPart[][] = [];
          for (const articleSeq of pendingArticleAlternatives) {
            for (const seq of expanded) {
              withArticles.push([...articleSeq, ...seq]);
            }
            if (originExpanded) {
              for (const seq of originExpanded) {
                withOrigin.push([...articleSeq, ...seq]);
              }
            }
          }
          pendingArticleAlternatives = null;
          if (withArticles.length > 0) {
            expanded.length = 0;
            expanded.push(...withArticles);
          }
          originExpanded = originExpanded ? withOrigin : null;
        }
        if (originExpanded && originExpanded.length > 0) {
          pushSequences(expanded, originExpanded);
          originHasAmbiguity =
            originHasAmbiguity ||
            Boolean(afterPossessive.originHasAlternatives);
          hasAmbiguity = true;
        } else {
          pushSequences(expanded);
        }
        consumed += consumedHere;
        index += consumedHere;
        seenObject = true;
        commitSequences();
        continue;
      }
    }
    if (possessiveMatch) {
      if (possessiveMatch.hasAlternatives) {
        hasAmbiguity = true;
      }
      let expanded = possessiveMatch.sequences;
      let originExpanded = possessiveMatch.originSequences ?? null;
      if (pendingArticleAlternatives) {
        const withArticles: TranslationPart[][] = [];
        const withOrigin: TranslationPart[][] = [];
        for (const articleSeq of pendingArticleAlternatives) {
          for (const seq of expanded) {
            withArticles.push([...articleSeq, ...seq]);
          }
          if (originExpanded) {
            for (const seq of originExpanded) {
              withOrigin.push([...articleSeq, ...seq]);
            }
          }
        }
        expanded = withArticles;
        originExpanded = originExpanded ? withOrigin : null;
        pendingArticleAlternatives = null;
      }
      if (originExpanded && originExpanded.length > 0) {
        pushSequences(expanded, originExpanded);
        originHasAmbiguity =
          originHasAmbiguity || Boolean(possessiveMatch.originHasAlternatives);
        hasAmbiguity = true;
      } else {
        pushSequences(expanded);
      }
      const consumedHere = prefixConsumed + possessiveMatch.consumed;
      consumed += consumedHere;
      index += consumedHere;
      seenObject = true;
      commitSequences();
      continue;
    }

    const articleMatch = matchArticleAt(tokens, index, sourceLang);
    if (articleMatch && !isOtherGroupPatternAt(tokens, index, sourceLang)) {
      const phrase = matchNounPhraseAfterArticle(
        tokens,
        index + articleMatch.consumed,
        sourceLang
      );
      if (phrase) {
        if (articleMatch.kind === "indefinite") {
          traceObject(
            `articleMatch@${index} kind=indefinite consumed=${articleMatch.consumed}`
          );
          consumed += articleMatch.consumed;
          index += articleMatch.consumed;
          continue;
        }
        traceObject(
          `articleMatch@${index} kind=definite consumed=${articleMatch.consumed}`
        );
        const dhuwalaPart = buildDefiniteArticlePart(
          "dhuwala",
          articleMatch.source,
          sourceLang
        );
        const duwaliPart = buildDefiniteArticlePart(
          "duwali",
          articleMatch.source,
          sourceLang
        );
        pendingArticleAlternatives = [
          [dhuwalaPart],
          [duwaliPart],
          [],
        ];
        hasAmbiguity = true;
        consumed += articleMatch.consumed;
        index += articleMatch.consumed;
        continue;
      }
    }

    const demoMatch = matchDemonstrativeToken(token.source, sourceLang);
    if (demoMatch) {
      const demoVariants = demoMatch.variants?.length
        ? demoMatch.variants
        : [demoMatch.gup];
      const phraseAfterDemo = matchNounPhraseAfterArticle(
        tokens,
        index + 1,
        sourceLang
      );
      if (phraseAfterDemo) {
        const demoParts: TranslationPart[][] = demoVariants.map((gup) => [
          finalizePart(
            {
              type: "particle",
              source: demoMatch.source,
              gup,
              output: gup,
              explanation: "",
              explanations: [
                { key: "TOKEN_PASSTHROUGH", data: { token: demoMatch.source } },
              ],
              meaningKey: "article.demonstrative",
            },
            sourceLang
          ),
        ]);
        pendingArticleAlternatives = demoParts;
        hasAmbiguity = hasAmbiguity || demoParts.length > 1;
        consumed += 1;
        index += 1;
        continue;
      }
      const primary = demoVariants[0];
      const demoPart = finalizePart(
        {
          type: "pronoun",
          source: demoMatch.source,
          gup: primary,
          output: primary,
          explanation: "",
          explanations: [
            { key: "PRONOUN_OBJECT", data: { token: demoMatch.source, gup: primary } },
            { key: "PRONOUN_OBJECT_NONHUMAN_DEMONSTRATIVE" },
          ],
          alternatives:
            demoVariants.length > 1
              ? demoVariants.slice(1).map((gup) => ({
                  gup,
                  notePayload: { key: "PRONOUN_OBJECT_NONHUMAN_DEMONSTRATIVE" },
                }))
              : undefined,
        },
        sourceLang
      );
      const objectSeq = [[demoPart]];
      if (pendingArticleAlternatives) {
        const expanded: TranslationPart[][] = [];
        for (const articleSeq of pendingArticleAlternatives) {
          for (const objSeq of objectSeq) {
            expanded.push([...articleSeq, ...objSeq]);
          }
        }
        pushSequences(expanded);
        pendingArticleAlternatives = null;
      } else {
        pushSequences(objectSeq);
      }
      commitSequences();
      const consumedHere = prefixConsumed + 1;
      consumed += consumedHere;
      index += consumedHere;
      seenObject = true;
      continue;
    }

    if (!isObjectCandidate(index)) break;
    let objectMatch: ObjectPronounMatch | null = null;
    if (sourceLang === "es" && token) {
      const normalized = normalizeToken(token.source, sourceLang);
      if (normalized === "a") {
        const nextToken = tokens[index + 1];
        if (nextToken) {
          objectMatch = matchObjectPronounAfterA(nextToken.source, sourceLang);
        }
      }
    }

    if (!objectMatch) {
      objectMatch = matchObjectPronoun(token.source, sourceLang);
    }

    const phrase = !objectMatch
      ? matchNounPhraseAfterArticle(tokens, phraseStart, sourceLang)
      : null;

    if (objectMatch) {
      const pronounIndex = index + prefixConsumed;
      const emphasis = matchObjectEmphasisAt(tokens, pronounIndex, sourceLang);
      const reflexivePersons = options?.reflexivePersons ?? [];
      const objectPersons = new Set<PersonNumber>();
      if (objectMatch.primaryKey) {
        objectPersons.add(objectPersonFromKey(objectMatch.primaryKey));
      }
      if (objectMatch.alternativeKeys) {
        for (const key of objectMatch.alternativeKeys) {
          objectPersons.add(objectPersonFromKey(key));
        }
      }
      const isReflexive =
        !emphasis &&
        reflexivePersons.length > 0 &&
        [...objectPersons].some((person) => reflexivePersons.includes(person));
      let objectSeq: TranslationPart[][];
      let drop = false;
      if (isReflexive) {
        const emphaticPart = buildEmphaticObjectPronounPart(objectMatch);
        if (emphaticPart) {
          const rendered = finalizePart(emphaticPart, sourceLang);
          objectSeq = [[rendered]];
          if (options?.reflexiveSubjectRepeat) {
            const subjectPart = buildSubjectRepeatPart(
              reflexivePersons[0],
              sourceLang
            );
            if (subjectPart) {
              objectSeq.push([rendered, subjectPart]);
            }
          }
          if (rendered.alternatives?.length || options?.reflexiveSubjectRepeat) {
            hasAmbiguity = true;
          }
        } else {
          const built = buildObjectSequencesFromMatch(objectMatch, sourceLang, {
            allowNonHumanDemonstrative: options?.allowNonHumanDemonstrative,
          });
          objectSeq = built.sequences;
          drop = built.hasDrop;
        }
      } else if (emphasis) {
        extraConsumed = emphasis.consumed;
        const isEmphaticReflexive =
          reflexivePersons.length > 0 &&
          [...objectPersons].some((person) => reflexivePersons.includes(person));
        const emphaticMatch = emphasis.hasDualMarker
          ? applyDualMarkerToObjectMatch(objectMatch)
          : objectMatch;
        const emphaticPart = buildEmphaticObjectPronounPart(emphaticMatch, {
          sourceOverride: emphasis.source,
          includeNonEmphatic: !isEmphaticReflexive,
        });
        if (emphaticPart) {
          const rendered = finalizePart(emphaticPart, sourceLang);
          objectSeq = [[rendered]];
          if (isEmphaticReflexive && options?.reflexiveSubjectRepeat) {
            const subjectPart = buildSubjectRepeatPart(
              reflexivePersons[0],
              sourceLang
            );
            if (subjectPart) {
              objectSeq.push([rendered, subjectPart]);
            }
          }
          if (
            rendered.alternatives?.length ||
            (isEmphaticReflexive && options?.reflexiveSubjectRepeat)
          ) {
            hasAmbiguity = true;
          }
        } else {
          const fallback = buildObjectSequencesFromMatch(objectMatch, sourceLang, {
            allowNonHumanDemonstrative: options?.allowNonHumanDemonstrative,
          });
          objectSeq = fallback.sequences;
          drop = fallback.hasDrop;
        }
      } else {
        const built = buildObjectSequencesFromMatch(objectMatch, sourceLang, {
          allowNonHumanDemonstrative: options?.allowNonHumanDemonstrative,
        });
        objectSeq = built.sequences;
        drop = built.hasDrop;
      }
      if (drop) hasDrop = true;
      if (pendingArticleAlternatives) {
        const expanded: TranslationPart[][] = [];
        for (const articleSeq of pendingArticleAlternatives) {
          for (const objSeq of objectSeq) {
            expanded.push([...articleSeq, ...objSeq]);
          }
        }
        pushSequences(expanded);
        pendingArticleAlternatives = null;
      } else {
        pushSequences(objectSeq);
      }
    } else if (phrase) {
      const { sequences: nounSequences, hasAlternatives } = buildObjectNounPhraseSequences(
        phrase,
        sourceLang,
        { forceHuman, allowAlternatives }
      );
      if (hasAlternatives) {
        hasAmbiguity = true;
      }
      let expanded = nounSequences;
      if (pendingArticleAlternatives) {
        const withArticles: TranslationPart[][] = [];
        for (const articleSeq of pendingArticleAlternatives) {
          for (const nounSeq of nounSequences) {
            withArticles.push([...articleSeq, ...nounSeq]);
          }
        }
        expanded = withArticles;
        pendingArticleAlternatives = null;
      }
      pushSequences(expanded);
    }

    commitSequences();

    if (pendingArticleAlternatives) {
      const noArticle: TranslationPart[][] = [];
      for (const seq of sequences) {
        noArticle.push([...seq]);
      }
      sequences = noArticle;
      pendingArticleAlternatives = null;
    }

    if (seenObject && connector) {
      seqPendingConnector = seqPendingConnector.map((_pending, idx) =>
        seqHasObject[idx] ? connector : null
      );
    }
    const consumedHere =
      prefixConsumed + (phrase?.consumed ?? 1) + extraConsumed;
    consumed += consumedHere;
    index += consumedHere;
    seenObject = true;
  }
  traceObject(`collectObjects done consumed=${consumed}`);

  return {
    sequences,
    originSequences: originSequences ?? undefined,
    consumed,
    hasDrop,
    hasAmbiguity,
    originHasAmbiguity: originSequences ? originHasAmbiguity : undefined,
  };
}
