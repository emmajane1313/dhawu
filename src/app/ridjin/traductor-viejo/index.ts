import { LanguageMode } from "@/app/components/types/components.type";
import { tokenize, TokenizerResult, Token, Frase } from "./tokenizer";
import { LEXICON, VerbEntry } from "./lexicon";
import { applyVerbRules, VerbRuleResult } from "./rules/verb";
import {
  analyzeFraseContext,
  FraseContext,
  PossessionMatch,
  PossessivePronounMatch,
  MirriMiriwMatch,
  detectMirriMiriwPattern,
  LocativeMatch,
  CausativeAgentMatch,
  ConWithMatch,
  InstrumentalMatch,
  BelongingMatch,
  BecomeAdjectiveMatch,
  MakeAdjectiveMatch,
  LetUsMatch,
  NgarraMatch,
  TransportMatch,
  ComitativePronounMatch,
  PronounMatch,
  HumanAllativePronounMatch,
  HumanAblativePronounMatch,
  HumanPerlativePronounMatch,
  SourceOriginPronounMatch,
  CausePronounMatch,
  PurposePronounMatch,
  LocativeCopulaMatch,
  IndirectObjectMatch,
  TimesMatch,
  detectTimesPattern,
  AgentNounMatch,
  detectAgentNoun,
  RelativeClauseMatch,
  detectRelativeClausePattern,
  detectDjalVerbPattern,
  detectPurposeInfinitive,
  detectLocativeVerbPattern,
  detectInfinitiveAgent,
  detectBecomeAdjectivePattern,
  detectMakeAdjectivePattern,
  detectLetUsPattern,
  detectNgarraPattern,
  detectMindIfPattern,
  detectHabitualPattern,
  detectPastHabitualAuxPattern,
  detectMightPattern,
  detectShouldPattern,
  detectThatTimePattern,
  MindIfMatch,
  HabitualMatch,
  PastHabitualAuxMatch,
  MightMatch,
  ShouldMatch,
  ThatTimeMatch,
} from "./patternMatcher";
import { AnswerInfo } from "./rules/question/index";
import {
  determinePossessiveSuffix,
  applyPossessiveSuffix,
} from "./rules/possession";
import {
  determineBelongingSuffix,
  applyBelongingSuffix,
} from "./rules/belonging";
import { getNegationWords } from "./patterns";
import {
  processSubjects,
  SubjectResult,
  getPronounOptions,
  SubjectOption,
  applyErgativeSuffix,
  applyErgativeSuffixWithOverride,
  getImpliedPersonNumber,
  detectEmphaticSubjectTriggers,
} from "./rules/subject";
import {
  detectObjectEmphasisTriggers,
  processObjects,
  ObjectResult,
} from "./rules/object";
import {
  applyPluralToPhrase,
  PluralTranslation,
  GrammaticalRole,
  applyPluralRuleToAnswer,
  addWurruPlural,
  buildMalaPlural,
} from "./rules/plural";
import {
  applyDefiniteDemonstratives,
  DefiniteTranslation,
  DefinitePart,
  applyDemonstrativeToGup,
} from "./rules/definite";
import {
  detectModalVerb,
  collectModalVerbObjects,
  generateModalSuffixCombinations,
  buildModalVerbParts,
  ModalVerbInfo,
} from "./rules/modalVerbs";
import {
  generateLocativeVerbResults,
  LocativeVerbResult,
} from "./rules/locativeVerb";
import {
  CONNECTOR_WORDS_ES,
  CONNECTOR_WORDS_EN,
  OBJECT_PRONOUNS_GUP,
  OBJECT_PRONOUN_TRIGGERS_ES,
  SUBJECT_PRONOUNS_GUP,
  BELONGING_PRONOUNS_GUP,
  PersonNumber,
  DjalSuffixType,
  filterTypesByDual,
  POSSESSIVE_PRONOUNS_GUP,
  SOURCE_ORIGIN_PRONOUNS_GUP,
  COMITATIVE_PRONOUNS_GUP,
  HUMAN_ALLATIVE_PRONOUNS_GUP,
  HUMAN_ABLATIVE_PRONOUNS_GUP_EMPHATIC,
  HUMAN_ALLATIVE_PRONOUNS_GUP_EMPHATIC,
  MirriMiriwType,
  LANG_CONFIG,
  LOCATIVE_SUFFIX,
  ALLATIVE_SUFFIX,
  ABLATIVE_SUFFIX,
  applyLocativeSuffix,
  applyAllativeSuffix,
  applyAblativeSuffix,
  BECOME_ADJ_EXCEPTIONS,
  determineBecomeAdjSuffix,
  applyBecomeAdjSuffix,
  MAKE_ADJ_EXCEPTIONS,
  determineMakeAdjSuffix,
  applyMakeAdjSuffix,
  determineHumanAssociativeSuffix,
  applyHumanAssociativeSuffix,
  HumanAssociativeSuffixType,
  determineHumanCausativeSuffix,
  applyHumanCausativeSuffix,
  HumanCausativeSuffixType,
  determineHumanAblativeSuffix,
  applyHumanAblativeSuffix,
  HumanAblativeSuffixType,
  determinePerlativeSuffix,
  applyPerlativeSuffix,
  ALL_VOWELS,
  HABER_AUXILIARY_FORMS_ES,
  getWordEnding,
  validarFonologia,
  MotionDirection,
  MOTION_DIRECTION_GUP,
  MotionGoalDirection,
  determineDjalSuffix,
  applyDjalSuffix,
  normalizeToken,
  DjalVerbMatch,
  PurposeInfinitiveMatch,
  InfinitiveAgentMatch,
  LocativeVerbMatch,
  ObjectPronounType,
} from "./constants";
import {
  findAllFixedMatches,
  getFixedIndices,
  FixedMatch,
} from "./fixedTranslations";
import { generateCombinations } from "./utils";
import {
  AdjectiveNounGroup,
  detectAdjectiveNounGroups,
  applyAdjectiveSuffixes,
} from "./rules/adjective";

export interface TranslationPart {
  type:
    | "subject"
    | "verb"
    | "object"
    | "noun"
    | "adjective"
    | "adverb"
    | "particle"
    | "connector"
    | "unknown";
  source: string;
  gup: string;
  baseGup?: string;
  appliedSuffix?: string;
  explanation: string;
  meaningKey?: string;
  verbOptions?: VerbRuleResult[];
  objectOptions?: { gup: string; explanation: string }[];
  suffixAlternatives?: { gup: string; suffix: string; explanation: string }[];
  isOptionalDirection?: boolean;
  globalIndex?: number;
  irregularPlurals?: string[];
  isHuman?: boolean;
  isKnownNoun?: boolean;
  isPlural?: boolean;
  role?: GrammaticalRole;
  [key: string]: unknown;
}

export interface TranslatedFrase {
  tokenIndices: number[];
  parts: TranslationPart[];
  answerInfo?: AnswerInfo;
  isQuestionPattern?: boolean;
  causativeRoute?: "cause" | "agent";
}

export interface TranslationCombination {
  frases: TranslatedFrase[];
  parts: TranslationPart[];
  output: string;
}

export interface TranslationResult {
  input: string;
  mode: LanguageMode;
  tokens: Token[];
  connectorPositions: number[];
  combinations: TranslationCombination[];
  hasAmbiguity: boolean;
}

function findGlobalVerbContext(
  frases: Frase[],
  tokens: Token[],
): GlobalVerbContext {
  let isTransitive = false;
  let verbPerson: number | null = null;

  for (const frase of frases) {
    const fraseTokens = frase.tokenIndices.map((idx) => tokens[idx]);
    for (const token of fraseTokens) {
      if (token.type === "verb" && token.verbMatch) {
        if (token.verbMatch.entry?.vtr) {
          isTransitive = true;
        }
        if (
          token.verbMatch.person !== undefined &&
          token.verbMatch.person >= 0 &&
          verbPerson === null
        ) {
          verbPerson = token.verbMatch.person;
        }
      }
    }
  }

  return { isTransitive, verbPerson };
}

function detectEmotionMatch(
  fraseTokens: Token[],
  copulaMatch: FraseContext["copulaMatch"],
  becomeAdjectiveMatch: BecomeAdjectiveMatch | null,
): EmotionMatch | null {
  const getEmotionVerbKey = (index: number): string | null => {
    const token = fraseTokens[index];
    if (!token || token.type !== "adjective" || !token.gupKey) return null;
    const entry = LEXICON.adjectives[token.gupKey];
    const verbKey = entry?.emotionVerbKey || null;

    if (!verbKey || !LEXICON.verbs[verbKey]) return null;
    return verbKey;
  };

  if (becomeAdjectiveMatch) {
    const verbKey = getEmotionVerbKey(becomeAdjectiveMatch.adjectiveIndex);
    if (verbKey) {
      const token = fraseTokens[becomeAdjectiveMatch.adjectiveIndex];
      return {
        adjectiveIndex: becomeAdjectiveMatch.adjectiveIndex,
        adjectiveWord: token?.original || "",
        verbKey,
      };
    }
  }

  if (copulaMatch) {
    for (let i = copulaMatch.copulaIndex + 1; i < fraseTokens.length; i++) {
      const verbKey = getEmotionVerbKey(i);
      if (verbKey) {
        const token = fraseTokens[i];

        return {
          adjectiveIndex: i,
          adjectiveWord: token?.original || "",
          verbKey,
        };
      }
    }
  }

  return null;
}

export const translate = (
  text: string,
  mode: LanguageMode,
): TranslationResult => {
  const tokenization = tokenize(text, mode);

  const adjNounGroups = detectAdjectiveNounGroups(tokenization.tokens, mode);

  let allCombinations: TranslationCombination[] = [];

  for (const [comboIdx, combo] of tokenization.combinations.entries()) {
    let inheritedMirriMiriw: MirriMiriwMatch | null = null;
    const fraseVariants: TranslatedFrase[][] = [];

    const globalVerbContext = findGlobalVerbContext(
      combo.frases,
      tokenization.tokens,
    );

    for (const [fraseIdx, frase] of combo.frases.entries()) {
      const fraseTokens = frase.tokenIndices.map((i) => tokenization.tokens[i]);
      const hasVerbInFrase = fraseTokens.some((t) => t.type === "verb");

      const detected = detectMirriMiriwPattern(fraseTokens, mode);
      if (detected) {
        inheritedMirriMiriw = detected;
      } else if (hasVerbInFrase) {
        inheritedMirriMiriw = null;
      }

      const variants = applyRulesWithAlternatives(
        frase,
        tokenization.tokens,
        mode,
        text,
        inheritedMirriMiriw,
        globalVerbContext,
      );

      fraseVariants.push(variants);
    }

    const expandedCombinations = expandFraseVariants(
      fraseVariants,
      tokenization.tokens,
      mode,
      tokenization.punctuation,
      adjNounGroups,
    );

    allCombinations = allCombinations.concat(expandedCombinations);
  }

  const seenOutputs = new Set<string>();
  const uniqueCombinations: TranslationCombination[] = [];
  for (const combo of allCombinations) {
    if (!seenOutputs.has(combo.output)) {
      seenOutputs.add(combo.output);
      uniqueCombinations.push(combo);
    }
  }

  const hasSubjectAlternatives =
    uniqueCombinations.length > tokenization.combinations.length;

  return {
    input: text,
    mode,
    tokens: tokenization.tokens,
    connectorPositions: tokenization.connectorPositions,
    combinations: uniqueCombinations,
    hasAmbiguity: tokenization.hasAmbiguity || hasSubjectAlternatives,
  };
};

function generateAnswerVariants(
  answerInfo: AnswerInfo,
  mode: LanguageMode,
): string[] {
  const {
    baseGup,
    rawBaseGup,
    appliedSuffix,
    allSuffixes,
    alternatives,
    determinerType,
    hasDefiniteArticle,
    isPlural,
    isHuman,
    answerTokens,
    additionalAnswers,
  } = answerInfo;

  let baseVariants: string[] =
    alternatives && alternatives.length > 0
      ? [...new Set([baseGup, ...alternatives])]
      : [baseGup];

  if (isPlural && rawBaseGup) {
    const pluralVariants: string[] = [];
    const pluralBase = addWurruPlural(rawBaseGup);
    const suffixesToApply =
      allSuffixes && allSuffixes.length > 0
        ? allSuffixes
        : appliedSuffix
          ? [appliedSuffix]
          : [];

    if (suffixesToApply.length > 0) {
      for (const suffix of suffixesToApply) {
        const pluralWithSuffix = validarFonologia(pluralBase + suffix);
        pluralVariants.push(pluralWithSuffix);
      }
      const malaResults = buildMalaPlural(
        rawBaseGup,
        isHuman ?? false,
        suffixesToApply[0],
      );
      for (const malaResult of malaResults) {
        pluralVariants.push(malaResult.full);
      }
      baseVariants = [...new Set(pluralVariants)];
    } else {
      baseVariants = [pluralBase];
      const malaResults = buildMalaPlural(rawBaseGup, isHuman ?? false, null);
      for (const malaResult of malaResults) {
        baseVariants.push(malaResult.full);
      }
      baseVariants = [...new Set(baseVariants)];
    }
  } else if (isPlural) {
    const allPluralVariants: string[] = [];
    for (const variant of baseVariants) {
      const pluralVariants = applyPluralRuleToAnswer(
        variant,
        answerTokens,
        mode,
        isHuman,
        isPlural,
      );
      if (pluralVariants.length > 0) {
        allPluralVariants.push(...pluralVariants);
      }
    }
    if (allPluralVariants.length > 0) {
      baseVariants = [...new Set(allPluralVariants)];
    }
  }

  let finalVariants = baseVariants;

  if (!hasDefiniteArticle || determinerType === null) {
    finalVariants = baseVariants;
  } else {
    const results: string[] = [];
    for (const variant of baseVariants) {
      const demoVariants = applyDemonstrativeToGup(variant, determinerType);
      results.push(...demoVariants);
    }
    finalVariants = [...new Set(results)];
  }

  if (additionalAnswers && additionalAnswers.length > 0) {
    const additionalOptions: { options: string[]; isPossessor: boolean }[] =
      additionalAnswers.map((a) => {
        if (a.alternatives && a.alternatives.length > 0) {
          return {
            options: [a.baseGup, ...a.alternatives],
            isPossessor: a.isPossessor === true,
          };
        }
        return { options: [a.baseGup], isPossessor: a.isPossessor === true };
      });

    const additionalCombinations: {
      parts: string[];
      isPossessorFlags: boolean[];
    }[] = additionalOptions.reduce<
      { parts: string[]; isPossessorFlags: boolean[] }[]
    >((acc, item) => {
      if (acc.length === 0)
        return item.options.map((o) => ({
          parts: [o],
          isPossessorFlags: [item.isPossessor],
        }));
      const result: { parts: string[]; isPossessorFlags: boolean[] }[] = [];
      for (const existing of acc) {
        for (const option of item.options) {
          result.push({
            parts: [...existing.parts, option],
            isPossessorFlags: [...existing.isPossessorFlags, item.isPossessor],
          });
        }
      }
      return result;
    }, []);

    const results: string[] = [];
    for (const baseVariant of finalVariants) {
      for (const combo of additionalCombinations) {
        let result = baseVariant;
        for (let i = 0; i < combo.parts.length; i++) {
          if (combo.isPossessorFlags[i]) {
            result = combo.parts[i] + " " + result;
          } else {
            result = result + " ga " + combo.parts[i];
          }
        }
        results.push(result);
      }
    }
    return results;
  }

  return finalVariants;
}

function generateAnswerParts(
  answerInfo: AnswerInfo,
  answerGup: string,
  mode: LanguageMode,
): TranslationPart[] {
  const parts: TranslationPart[] = [];
  const config = LANG_CONFIG[mode];

  const answerWords = answerGup.split(" ga ");

  for (let i = 0; i < answerWords.length; i++) {
    if (i > 0) {
      parts.push({
        type: "connector",
        source: config.connectors?.[0] || "y",
        gup: "ga",
        explanation: config.connector,
        globalIndex: -1,
      });
    }

    const word = answerWords[i];
    let rawSource: string;
    let partExplanation: string | undefined;

    if (i === 0) {
      rawSource = answerInfo.answerTokens?.[0] || word;
      partExplanation = answerInfo.baseExplanation;
    } else if (
      answerInfo.additionalAnswers &&
      answerInfo.additionalAnswers[i - 1]
    ) {
      const addAnswer = answerInfo.additionalAnswers[i - 1];
      rawSource = addAnswer.sourceWord || word;
      partExplanation = addAnswer.explanation;
    } else {
      rawSource = word;
    }

    let baseGup: string | undefined;
    let appliedSuffix: string | undefined;
    let suffixAlternatives:
      | { gup: string; suffix: string; explanation: string }[]
      | undefined;
    let isHuman: boolean | undefined;
    let isPlace: boolean | undefined;

    if (i === 0) {
      baseGup = answerInfo.rawBaseGup;
      appliedSuffix = answerInfo.appliedSuffix;
      isHuman = answerInfo.isHuman;
      isPlace = answerInfo.isPlace;

      if (answerInfo.suffixType === "djal") {
        if (
          answerInfo.allSuffixes &&
          answerInfo.allSuffixes.length > 1 &&
          baseGup
        ) {
          suffixAlternatives = [];
          for (const suffix of answerInfo.allSuffixes) {
            const altGup = applyDjalSuffix(baseGup, suffix as DjalSuffixType);
            if (altGup === word) continue;
            suffixAlternatives.push({
              gup: altGup,
              suffix,
              explanation: `${baseGup} + -${suffix}`,
            });
          }
          if (suffixAlternatives.length === 0) suffixAlternatives = undefined;
        }
      } else if (
        answerInfo.alternatives &&
        answerInfo.alternatives.length > 0
      ) {
        const allOptions = [answerInfo.baseGup, ...answerInfo.alternatives];
        suffixAlternatives = [];
        for (const alt of allOptions) {
          if (alt === word) continue;
          let suffix = "";
          if (baseGup && alt.startsWith(baseGup)) {
            suffix = alt.slice(baseGup.length);
          }
          const isPronounAlt = !suffix && baseGup && !alt.startsWith(baseGup);
          suffixAlternatives.push({
            gup: alt,
            suffix: suffix || "∅",
            explanation: isPronounAlt
              ? `${alt} (pronombre)`
              : suffix
                ? `${baseGup} + -${suffix}`
                : `${baseGup} (lugar)`,
          });
        }
        if (suffixAlternatives.length === 0) suffixAlternatives = undefined;
      } else if (
        answerInfo.allSuffixes &&
        answerInfo.allSuffixes.length > 1 &&
        baseGup
      ) {
        suffixAlternatives = [];
        for (const suffix of answerInfo.allSuffixes) {
          const altGup = validarFonologia(baseGup + suffix);
          if (altGup === word) continue;
          suffixAlternatives.push({
            gup: altGup,
            suffix,
            explanation: `${baseGup} + -${suffix}`,
          });
        }
        if (suffixAlternatives.length === 0) suffixAlternatives = undefined;
      } else if (isHuman === true && baseGup) {
        const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
        if (humanSuffixes.length > 1) {
          suffixAlternatives = [];
          for (const s of humanSuffixes) {
            const altGup = applyHumanAssociativeSuffix(baseGup, s);
            if (altGup === word) continue;
            suffixAlternatives.push({
              gup: altGup,
              suffix: s,
              explanation: `${baseGup} + -${s}`,
            });
          }
          if (suffixAlternatives.length === 0) suffixAlternatives = undefined;
        }
      }
    } else if (
      answerInfo.additionalAnswers &&
      answerInfo.additionalAnswers[i - 1]
    ) {
      const addAnswer = answerInfo.additionalAnswers[i - 1];
      baseGup = addAnswer.rawBaseGup;
      appliedSuffix = addAnswer.appliedSuffix;
      isHuman = addAnswer.isHuman;
      isPlace = addAnswer.isPlace;

      if (
        addAnswer.suffixType === "locative" &&
        addAnswer.isHuman === undefined &&
        addAnswer.isPlace === undefined &&
        baseGup
      ) {
        suffixAlternatives = [];
        const placeAlt = baseGup;
        const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
        const humanAlts = humanSuffixes.map((s) =>
          applyHumanAssociativeSuffix(baseGup!, s),
        );
        const nonhumanAlt = applyLocativeSuffix(baseGup);
        for (const alt of [placeAlt, ...humanAlts, nonhumanAlt]) {
          if (alt === word) continue;
          let suffix = "";
          if (alt === placeAlt) {
            suffix = "∅";
          } else if (humanAlts.includes(alt)) {
            const idx = humanAlts.indexOf(alt);
            suffix = humanSuffixes[idx];
          } else {
            suffix = "ŋura";
          }
          suffixAlternatives.push({
            gup: alt,
            suffix,
            explanation:
              suffix === "∅" ? `${baseGup} (lugar)` : `${baseGup} + -${suffix}`,
          });
        }
        if (suffixAlternatives.length === 0) suffixAlternatives = undefined;
      } else if (addAnswer.alternatives && addAnswer.alternatives.length > 0) {
        const allOptions = [addAnswer.baseGup, ...addAnswer.alternatives];
        suffixAlternatives = [];
        for (const alt of allOptions) {
          if (alt === word) continue;
          suffixAlternatives.push({
            gup: alt,
            suffix: "∅",
            explanation: `${alt} (pronombre)`,
          });
        }
        if (suffixAlternatives.length === 0) suffixAlternatives = undefined;
      } else if (addAnswer.isHuman === true && baseGup) {
        const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
        if (humanSuffixes.length > 1) {
          suffixAlternatives = [];
          for (const s of humanSuffixes) {
            const altGup = applyHumanAssociativeSuffix(baseGup, s);
            if (altGup === word) continue;
            suffixAlternatives.push({
              gup: altGup,
              suffix: s,
              explanation: `${baseGup} + -${s}`,
            });
          }
          if (suffixAlternatives.length === 0) suffixAlternatives = undefined;
        }
      }
    }

    parts.push({
      type: "noun",
      source: rawSource,
      gup: word,
      baseGup,
      appliedSuffix,
      explanation: partExplanation || `${rawSource} → ${word}`,
      globalIndex: -1,
      suffixAlternatives,
      isHuman,
      isKnownNoun: isHuman !== undefined || isPlace !== undefined,
    });
  }

  return parts;
}

function expandSuffixAlternatives(
  frases: TranslatedFrase[],
): TranslatedFrase[][] {
  const partsWithAlts: {
    fraseIdx: number;
    partIdx: number;
    part: TranslationPart;
  }[] = [];

  for (let fi = 0; fi < frases.length; fi++) {
    const frase = frases[fi];
    for (let pi = 0; pi < frase.parts.length; pi++) {
      const part = frase.parts[pi];
      if (
        (part.suffixAlternatives && part.suffixAlternatives.length > 0) ||
        (part.verbOptions && part.verbOptions.length > 1)
      ) {
        partsWithAlts.push({ fraseIdx: fi, partIdx: pi, part });
      }
    }
  }

  if (partsWithAlts.length === 0) return [frases];

  const optionsPerPart: {
    gup: string;
    suffix: string;
    explanation: string;
    meaningKey?: string;
  }[][] = partsWithAlts.map(({ part }) => {
    if (part.verbOptions && part.verbOptions.length > 1) {
      return part.verbOptions.map((vo) => ({
        gup: vo.gup,
        suffix: "",
        explanation: vo.explanation,
        meaningKey: getVerbMeaningKey(vo),
      }));
    }
    const isSuffixAlt = !!(
      part.suffixAlternatives && part.suffixAlternatives.length > 0
    );
    const baseMeaningKey = isSuffixAlt ? "suffix" : part.meaningKey;
    return [
      {
        gup: part.gup,
        suffix: part.appliedSuffix || "",
        explanation: part.explanation,
        meaningKey: baseMeaningKey,
      },
      ...part.suffixAlternatives!.map((alt) => ({
        ...alt,
        meaningKey: "suffix",
      })),
    ];
  });

  let combinations: {
    gup: string;
    suffix: string;
    explanation: string;
    meaningKey?: string;
  }[][] = [
    [],
  ];
  for (const options of optionsPerPart) {
    const newCombos: {
      gup: string;
      suffix: string;
      explanation: string;
      meaningKey?: string;
    }[][] = [];
    for (const combo of combinations) {
      for (const opt of options) {
        newCombos.push([...combo, opt]);
      }
    }
    combinations = newCombos;
  }

  const results: TranslatedFrase[][] = [];

  for (const combo of combinations) {
    const newFrases = frases.map((f, fi) => ({
      ...f,
      parts: f.parts.map((p, pi) => {
        const altIdx = partsWithAlts.findIndex(
          (pa) => pa.fraseIdx === fi && pa.partIdx === pi,
        );
        if (altIdx >= 0) {
          const chosen = combo[altIdx];
          return {
            ...p,
            gup: chosen.gup,
            appliedSuffix: chosen.suffix || undefined,
            explanation: chosen.explanation,
            meaningKey: chosen.meaningKey ?? p.meaningKey,
            suffixAlternatives: undefined,
            verbOptions: undefined,
          };
        }
        return p;
      }),
    }));
    results.push(newFrases);
  }

  return results;
}

function expandSuffixAlternativesFromParts(
  parts: TranslationPart[],
): TranslationPart[][] {
  const partsWithAlts: { partIdx: number; part: TranslationPart }[] = [];

  for (let pi = 0; pi < parts.length; pi++) {
    const part = parts[pi];
    if (
      (part.suffixAlternatives && part.suffixAlternatives.length > 0) ||
      (part.verbOptions && part.verbOptions.length > 1)
    ) {
      partsWithAlts.push({ partIdx: pi, part });
    }
  }

  if (partsWithAlts.length === 0) return [parts];

  const optionsPerPart: {
    gup: string;
    suffix: string;
    explanation: string;
    meaningKey?: string;
  }[][] = partsWithAlts.map(({ part }) => {
    if (part.verbOptions && part.verbOptions.length > 1) {
      return part.verbOptions.map((vo) => ({
        gup: vo.gup,
        suffix: "",
        explanation: vo.explanation,
        meaningKey: getVerbMeaningKey(vo),
      }));
    }
    const isSuffixAlt = !!(
      part.suffixAlternatives && part.suffixAlternatives.length > 0
    );
    const baseMeaningKey = isSuffixAlt ? "suffix" : part.meaningKey;
    return [
      {
        gup: part.gup,
        suffix: part.appliedSuffix || "",
        explanation: part.explanation,
        meaningKey: baseMeaningKey,
      },
      ...part.suffixAlternatives!.map((alt) => ({
        ...alt,
        meaningKey: "suffix",
      })),
    ];
  });

  let combinations: {
    gup: string;
    suffix: string;
    explanation: string;
    meaningKey?: string;
  }[][] = [
    [],
  ];
  for (const options of optionsPerPart) {
    const newCombos: {
      gup: string;
      suffix: string;
      explanation: string;
      meaningKey?: string;
    }[][] = [];
    for (const combo of combinations) {
      for (const opt of options) {
        newCombos.push([...combo, opt]);
      }
    }
    combinations = newCombos;
  }

  const results: TranslationPart[][] = [];
  for (const combo of combinations) {
    const newParts = parts.map((p, pi) => {
      const altIdx = partsWithAlts.findIndex((pa) => pa.partIdx === pi);
      if (altIdx >= 0) {
        const chosen = combo[altIdx];
        return {
          ...p,
          gup: chosen.gup,
          appliedSuffix: chosen.suffix || undefined,
          explanation: chosen.explanation,
          meaningKey: chosen.meaningKey ?? p.meaningKey,
          suffixAlternatives: undefined,
          verbOptions: undefined,
        };
      }
      return p;
    });
    results.push(newParts);
  }

  return results;
}

function expandOptionalDirections(
  frases: TranslatedFrase[],
): TranslatedFrase[][] {
  const hasOptionalDir = frases.some((f) =>
    f.parts.some((p) => p.isOptionalDirection === true),
  );
  if (!hasOptionalDir) return [frases];

  const withDirection = frases;
  const withoutDirection = frases.map((f) => ({
    ...f,
    parts: f.parts.filter((p) => p.isOptionalDirection !== true),
  }));

  return [withDirection, withoutDirection];
}

function expandFraseVariants(
  fraseVariants: TranslatedFrase[][],
  tokens: Token[],
  mode: LanguageMode,
  punctuation: string | null,
  adjNounGroups: AdjectiveNounGroup[],
): TranslationCombination[] {
  if (fraseVariants.length === 0) return [];

  const combinations = generateCombinations(fraseVariants);
  const results: TranslationCombination[] = [];

  for (const frases of combinations) {
    const directionExpandedVariants = expandOptionalDirections(frases);

    for (const expandedFrases of directionExpandedVariants) {
      const { parts } = buildOutput(
        tokens,
        expandedFrases,
        mode,
        adjNounGroups,
      );
      const partsVariants = expandSuffixAlternativesFromParts(parts);
      const answerInfo = expandedFrases.find((f) => f.answerInfo)?.answerInfo;

      for (const variantParts of partsVariants) {
        const output = variantParts.map((p) => p.gup).join(" ");
        if (answerInfo) {
          const answerVariants = generateAnswerVariants(answerInfo, mode);
          for (const answerGup of answerVariants) {
            const finalOutput = output + "? " + answerGup;
            const answerParts = generateAnswerParts(
              answerInfo,
              answerGup,
              mode,
            );
            results.push({
              frases: expandedFrases,
              parts: [...variantParts, ...answerParts],
              output: finalOutput,
            });
          }
        } else {
          let finalOutput = output;
          const hasQuestionPattern = expandedFrases.some(
            (f) => f.isQuestionPattern,
          );
          if (hasQuestionPattern && !finalOutput.includes("?")) {
            finalOutput += "?";
          } else if (punctuation) {
            finalOutput += punctuation;
          }
          results.push({
            frases: expandedFrases,
            parts: variantParts,
            output: finalOutput,
          });
        }
      }
    }
  }

  return results;
}

type UnknownConWithChoice =
  | { type: "human"; suffix: "wala" | "kala" | "gala" }
  | { type: "nonhuman" }
  | { type: "instrumental" }
  | null;

type UnknownLocativeChoice =
  | { type: "place" }
  | { type: "notPlace" }
  | { type: "human"; suffix: string }
  | { type: "nonhuman" }
  | null;

interface CopulaSubjectChoice {
  gup: string;
  explanation: string;
  personNumber?: PersonNumber;
}

interface GlobalVerbContext {
  isTransitive: boolean;
  verbPerson: number | null;
}

interface ObjectActionMatch {
  objectIndex: number;
  verbIndex: number;
  triggerPhrase?: string;
  triggerIndices: number[];
  isInfinitive: boolean;
  isGerund: boolean;
}

interface MotionDestination {
  triggerIdx: number;
  nounIdx: number;
  isHuman?: boolean;
  goalDirection: MotionGoalDirection;
}

interface EmotionMatch {
  adjectiveIndex: number;
  adjectiveWord: string;
  verbKey: string;
}

interface PointingInfo {
  triggerPhrase: string;
  triggerIndices: number[];
  pointType: "here" | "there";
  gup: string;
  explanation: string;
  isPast: boolean;
}

interface VerbalNounPossessionMatch {
  type: "possessivePronoun" | "possession";
  possessedIndex: number;
  possessorIndex: number;
  possessorIsPronoun: boolean;
  possessorIsHuman?: boolean;
  personNumber?: PersonNumber;
  verbalNounOptions: { gup: string; suffix: string; explanation: string }[];
}

interface FraseProcessingContext {
  fraseTokens: Token[];
  globalIndices: number[];
  context: FraseContext;
  skipLocalIndices: Set<number>;
  mode: LanguageMode;
  verbResult: { results: VerbRuleResult[]; localIndex: number } | null;
  subjectResults: SubjectResult[];
  objectResults: ObjectResult[];
  hasDualMarker: boolean;
  isTransitive: boolean;
  verbMotionType?: "motion" | "stationary";
  modalVerbInfo: ModalVerbInfo | null;
  standaloneCopulaOptions: SubjectOption[];
  possessionMatch: PossessionMatch | null;
  possessivePronounMatch: PossessivePronounMatch | null;
  mirriMiriwMatch: MirriMiriwMatch | null;
  locativeMatch: LocativeMatch | null;
  causativeAgentMatch: CausativeAgentMatch | null;
  conWithMatch: ConWithMatch | null;
  instrumentalMatch: InstrumentalMatch | null;
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
  timesMatch: TimesMatch | null;
  habitualMatch: HabitualMatch | null;
  pastHabitualAuxMatch: PastHabitualAuxMatch | null;
  mightMatch: MightMatch | null;
  shouldMatch: ShouldMatch | null;
  thatTimeMatch: ThatTimeMatch | null;
  relativeClauseMatch: RelativeClauseMatch | null;
  djalVerbMatch: DjalVerbMatch | null;
  purposeInfinitiveMatch: PurposeInfinitiveMatch | null;
  infinitiveAgentMatch: InfinitiveAgentMatch | null;
  locativeVerbMatch: LocativeVerbMatch | null;
  locativeVerbMatchAlternative?: "use" | "ignore";
  becomeAdjectiveMatch: BecomeAdjectiveMatch | null;
  makeAdjectiveMatch: MakeAdjectiveMatch | null;
  letUsMatch: LetUsMatch | null;
  ngarraMatch: NgarraMatch | null;
  mindIfMatch: MindIfMatch | null;
  locativeVerbResults: LocativeVerbResult[];
  motionDestinations: MotionDestination[];
  motionDirection: MotionDirection;
  directionTriggerIndices: number[];
  emotionMatch: EmotionMatch | null;
  pointingInfo: PointingInfo | null;
  unknownConWithChoice?: UnknownConWithChoice;
  unknownLocativeChoice?: UnknownLocativeChoice;
  copulaSubjectChoice?: CopulaSubjectChoice;
  motionDestinationChoice?: UnknownConWithChoice;
  objectActionMatch?: ObjectActionMatch | null;
  objectActionAlternative?: "use" | "ignore";
  causativeRoute?: "cause" | "agent";
  mirriAlternative?:
    | { type: "object-mirri" }
    | {
        type: "subject-possessive";
        possessiveForm: string;
        subjectLocalIndex: number;
      };
  purposeInfinitiveAlternative?:
    | { type: "with-main-verb" }
    | { type: "conjugated-only"; conjugatedForm: string }
    | { type: "future-simple"; verbAlt: VerbRuleResult };
  irPatternAlternative?: "use-pattern" | "use-literal";
  hasIrPatternWithPurpose?: boolean;
  makeAdjectiveAlternative?: "use-pattern" | "use-literal" | "none";
  infinitiveAgentAlternative?: "ambiguous" | "explicit";
  isAmbiguousIrSer: boolean;
  locativeSuffixChoice?: {
    suffixType:
      | "ngura"
      | "lili"
      | "nguru"
      | "ergative"
      | "belonging"
      | "perlative";
    explanation: string;
  } | null;
  verbalNounPossession?: VerbalNounPossessionMatch | null;
  verbalNounPossessionAlternative?: "normal" | "source";
}

function normalizeRouteToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getVerbMeaningKey(result?: VerbRuleResult | null): string | undefined {
  if (!result) return undefined;
  const f = result.features;
  if (
    f.mood === "imperative" &&
    f.polarity === "negative" &&
    result.gup.endsWith("miriw")
  ) {
    return "suffix:miriw";
  }
  return [
    "verb",
    result.formName,
    String(result.formUsed),
    f.tense,
    f.mood,
    f.polarity,
    f.isGerund ? "gerund" : "nonGerund",
    f.isFuture ? "future" : "nonFuture",
    f.isContinuousFuture ? "contFuture" : "nonContFuture",
    f.isSameDayPast ? "sameDayPast" : "nonSameDayPast",
    f.isYesterdayPast ? "yesterdayPast" : "nonYesterdayPast",
    f.hasToday ? "hasToday" : "noToday",
    f.hasSpecifiedFutureTime ? "hasSpecifiedFuture" : "noSpecifiedFuture",
    f.hasAlready ? "hasAlready" : "noAlready",
  ].join("|");
}

const OBJECT_ACTION_TRIGGERS_ES = ["en el acto de", "en acto de"];
const OBJECT_ACTION_TRIGGERS_EN = ["in the act of", "in act of"];

function detectObjectActionPattern(
  tokens: Token[],
  objectResults: ObjectResult[],
  mode: LanguageMode,
  mainVerbIndex: number | null,
  skipIndices: Set<number>,
): ObjectActionMatch | null {
  const normalizedTokens = tokens.map((t) => normalizeRouteToken(t.original));
  const triggers =
    mode === "es" ? OBJECT_ACTION_TRIGGERS_ES : OBJECT_ACTION_TRIGGERS_EN;

  const hasStopWordBetween = (start: number, end: number) => {
    const stopWords = new Set([
      "para",
      "a",
      "de",
      "del",
      "al",
      "por",
      "en",
      "con",
      "sin",
      "que",
      "to",
      "for",
      "of",
      "in",
      "on",
      "at",
      "by",
      "with",
      "without",
      "that",
    ]);
    for (let i = start; i <= end; i++) {
      if (stopWords.has(normalizedTokens[i])) return true;
    }
    return false;
  };

  const isSkippableWord = (word: string) =>
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
    ].includes(word);

  const sortedTriggers = [...triggers].sort(
    (a, b) => b.split(" ").length - a.split(" ").length,
  );

  for (const trigger of sortedTriggers) {
    const words = trigger.split(" ").map(normalizeRouteToken);
    for (let i = 0; i <= normalizedTokens.length - words.length; i++) {
      let matches = true;
      for (let j = 0; j < words.length; j++) {
        if (normalizedTokens[i + j] !== words[j]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;

      const triggerIndices: number[] = [];
      for (let j = 0; j < words.length; j++) {
        triggerIndices.push(i + j);
      }

      const objectCandidates = objectResults
        .map((o) => o.localIndex)
        .filter((idx) => idx < i && idx >= 0)
        .filter((idx) => (mainVerbIndex === null ? true : idx > mainVerbIndex))
        .sort((a, b) => b - a);
      const objectIndex = objectCandidates[0];
      if (objectIndex === undefined) continue;

      let verbIndex: number | null = null;
      for (let k = i + words.length; k < tokens.length; k++) {
        if (skipIndices.has(k)) continue;
        const t = tokens[k];
        const norm = normalizedTokens[k];
        if (isSkippableWord(norm)) continue;
        if (t.type === "connector") continue;
        if (t.type === "verb" && t.verbMatch) {
          verbIndex = k;
          break;
        }
        break;
      }
      if (verbIndex === null) continue;

      const verbToken = tokens[verbIndex];
      const verbTense = verbToken.verbMatch?.tense;
      const isInfinitive = verbTense === "infinitive";
      const isGerund = verbTense === "gerund";
      return {
        objectIndex,
        verbIndex,
        triggerPhrase: trigger,
        triggerIndices,
        isInfinitive,
        isGerund,
      };
    }
  }

  const objectCandidates = objectResults
    .map((o) => o.localIndex)
    .filter((idx) => idx >= 0)
    .filter((idx) => (mainVerbIndex === null ? true : idx > mainVerbIndex))
    .sort((a, b) => a - b);

  for (const objectIndex of objectCandidates) {
    let verbIndex: number | null = null;
    for (let k = objectIndex + 1; k < tokens.length; k++) {
      if (skipIndices.has(k)) continue;
      const t = tokens[k];
      const norm = normalizedTokens[k];
      if (t.type === "connector") break;
      if (t.type === "verb" && t.verbMatch) {
        if (mainVerbIndex !== null && k === mainVerbIndex) continue;
        if (hasStopWordBetween(objectIndex + 1, k - 1)) break;
        verbIndex = k;
        break;
      }
      if (t.type === "noun" || t.type === "pronoun") break;
      if (t.type === "unknown" && isSkippableWord(norm)) continue;
    }
    if (verbIndex === null) continue;
    const verbToken = tokens[verbIndex];
    const verbTense = verbToken.verbMatch?.tense;
    const isInfinitive = verbTense === "infinitive";
    const isGerund = verbTense === "gerund";
    return {
      objectIndex,
      verbIndex,
      triggerIndices: [],
      isInfinitive,
      isGerund,
    };
  }

  return null;
}

function detectAmbiguousCausativeAgentTrigger(
  tokens: Token[],
  mode: LanguageMode,
): { triggerPhrase: string; triggerIndices: number[] } | null {
  const config = LANG_CONFIG[mode];
  const agentTriggers = config.causativeAgentTriggers || [];
  if (agentTriggers.length === 0) return null;

  const causeTriggerSet = new Set(
    (config.causeTriggers || []).map((t) => normalizeRouteToken(t)),
  );
  if (causeTriggerSet.size === 0) return null;

  const normalizedTokens = tokens.map((t) => normalizeRouteToken(t.original));
  const sortedTriggers = agentTriggers
    .map((phrase) => ({
      phrase,
      words: phrase.split(" ").map((w) => normalizeRouteToken(w)),
    }))
    .sort((a, b) => b.words.length - a.words.length);

  const hasPastParticipleBefore = (idx: number) =>
    tokens
      .slice(0, idx)
      .some(
        (t) => t.type === "verb" && t.verbMatch?.tense === "pastParticiple",
      );

  const isSkippable = (word: string) =>
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
    ].includes(word);

  const hasAgentCandidateAfter = (startIdx: number) => {
    for (let k = startIdx; k < tokens.length; k++) {
      const token = tokens[k];
      const norm = normalizedTokens[k];
      if (isSkippable(norm)) continue;
      if (token.type === "connector") continue;
      if (token.type === "pronoun") return true;
      if (token.type === "noun" || token.type === "unknown") return true;
      if (token.type === "verb") break;
      break;
    }
    return false;
  };

  for (let i = 0; i < normalizedTokens.length; i++) {
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

      if (!causeTriggerSet.has(normalizeRouteToken(trigger.phrase))) continue;

      if (!hasPastParticipleBefore(i)) continue;

      const triggerIndices: number[] = [];
      for (let j = 0; j < trigger.words.length; j++) {
        triggerIndices.push(i + j);
      }
      const afterTriggerIdx = i + trigger.words.length;
      if (!hasAgentCandidateAfter(afterTriggerIdx)) continue;

      return { triggerPhrase: trigger.phrase, triggerIndices };
    }
  }

  return null;
}

function suppressCauseLocativeMatch(
  locativeMatch: LocativeMatch | null,
  mode: LanguageMode,
): LocativeMatch | null {
  if (!locativeMatch) return null;
  const causeTriggerSet = new Set(
    (LANG_CONFIG[mode].causeTriggers || []).map((t) => normalizeRouteToken(t)),
  );
  if (!causeTriggerSet.has(normalizeRouteToken(locativeMatch.triggerPhrase))) {
    return locativeMatch;
  }
  return {
    ...locativeMatch,
    nounIndices: [],
    verbIndices: [],
  };
}

function applyRulesWithAlternatives(
  frase: Frase,
  tokens: Token[],
  mode: LanguageMode,
  originalText: string,
  inheritedMirriMiriw: MirriMiriwMatch | null = null,
  globalVerbContext: GlobalVerbContext | null = null,
): TranslatedFrase[] {
  const baseCtx = buildFraseContext(
    frase,
    tokens,
    mode,
    originalText,
    inheritedMirriMiriw,
    globalVerbContext,
  );

  const contexts: FraseProcessingContext[] = [baseCtx];
  if (baseCtx.letUsMatch && !baseCtx.letUsMatch.isStandalone) {
    contexts.push(
      buildFraseContext(
        frase,
        tokens,
        mode,
        originalText,
        inheritedMirriMiriw,
        globalVerbContext,
        true,
      ),
    );
  }

  const contextsWithObjectAction: FraseProcessingContext[] = [];
  for (const ctx of contexts) {
    if (
      ctx.objectActionMatch &&
      ctx.objectActionMatch.triggerIndices.length === 0 &&
      (ctx.objectActionMatch.isInfinitive || ctx.objectActionMatch.isGerund)
    ) {
      contextsWithObjectAction.push({
        ...ctx,
        objectActionAlternative: "use",
      });
    } else {
      contextsWithObjectAction.push(ctx);
    }
  }

  const contextsWithVerbalNounPossession: FraseProcessingContext[] = [];
  for (const ctx of contextsWithObjectAction) {
    if (ctx.verbalNounPossession) {
      contextsWithVerbalNounPossession.push({
        ...ctx,
        verbalNounPossessionAlternative: "normal",
      });
      contextsWithVerbalNounPossession.push({
        ...ctx,
        verbalNounPossessionAlternative: "source",
      });
    } else {
      contextsWithVerbalNounPossession.push(ctx);
    }
  }

  const expandedContexts: FraseProcessingContext[] = [];
  for (const ctx of contextsWithVerbalNounPossession) {
    const ambiguous = detectAmbiguousCausativeAgentTrigger(
      ctx.fraseTokens,
      mode,
    );
    if (!ambiguous) {
      expandedContexts.push(ctx);
      continue;
    }

    expandedContexts.push({
      ...ctx,
      causativeRoute: "cause",
    });

    const strippedLocative = suppressCauseLocativeMatch(
      ctx.locativeMatch,
      mode,
    );
    const strippedContextLocative = suppressCauseLocativeMatch(
      ctx.context.locativeMatch,
      mode,
    );
    expandedContexts.push({
      ...ctx,
      context: {
        ...ctx.context,
        locativeMatch: strippedContextLocative,
        causePronounMatch: null,
      },
      skipLocalIndices: new Set(ctx.skipLocalIndices),
      locativeMatch: strippedLocative,
      causePronounMatch: null,
      causativeRoute: "agent",
    });
  }

  const allResults: TranslatedFrase[] = [];
  for (const ctx of expandedContexts) {
    const ctxResults = applyRulesWithAlternativesForContext(
      ctx,
      frase,
      mode,
      originalText,
    );
    if (ctx.causativeRoute) {
      for (const result of ctxResults) {
        result.causativeRoute = ctx.causativeRoute;
      }
    }
    allResults.push(...ctxResults);
  }

  const seen = new Set<string>();
  const uniqueResults: TranslatedFrase[] = [];
  for (const result of allResults) {
    const routeKey = result.causativeRoute ? `|${result.causativeRoute}` : "";
    const gupKey = result.parts.map((p) => p.gup).join(" ") + routeKey;
    if (!seen.has(gupKey)) {
      seen.add(gupKey);
      uniqueResults.push(result);
    }
  }

  return uniqueResults;
}

function applyRulesWithAlternativesForContext(
  ctx: FraseProcessingContext,
  frase: Frase,
  mode: LanguageMode,
  originalText: string,
): TranslatedFrase[] {
  const answerInfo = ctx.context.questionMatch?.answerInfo;

  if (ctx.standaloneCopulaOptions.length > 0) {
    const results: TranslatedFrase[] = [];
    for (const option of ctx.standaloneCopulaOptions) {
      const copulaMatch = ctx.context.copulaMatch!;
      const parts: TranslationPart[] = [];

      if (ctx.context.questionMatch) {
        const qm = ctx.context.questionMatch;
        let gupOutput =
          qm.isComplexPattern && qm.patternOutput ? qm.patternOutput : qm.gup;
        if (qm.isComplexPattern && option.gup && !qm.hasExplicitSubject) {
          const outputParts = gupOutput.split(" ");
          outputParts.splice(1, 0, option.gup);
          gupOutput = outputParts.join(" ");
        }
        parts.push({
          type: "particle",
          source: ctx.fraseTokens[qm.questionWordIndex]?.original || qm.type,
          gup: gupOutput.replace(/\s*\?\s*$/, ""),
          explanation: qm.explanation,
          globalIndex: ctx.globalIndices[qm.questionWordIndex] ?? -1,
        });
        if (qm.subjectInfo) {
          parts.push({
            type: "subject",
            source: qm.subjectInfo.source,
            gup: qm.subjectInfo.gup,
            explanation: `${qm.subjectInfo.source} → ${qm.subjectInfo.gup}`,
            globalIndex: -1,
            isPlural: qm.subjectInfo.isPlural,
            isHuman: qm.subjectInfo.isHuman,
            isKnownNoun: qm.subjectInfo.isKnownNoun,
          });
        }
        if (qm.isComplexPattern) {
          results.push({
            tokenIndices: frase.tokenIndices,
            parts,
            answerInfo,
            isQuestionPattern: true,
          });
          continue;
        }
      }

      parts.push({
        type: "subject",
        source: copulaMatch.copulaWord,
        gup: option.gup,
        explanation: `"${copulaMatch.copulaWord}" → ${option.gup} (${option.explanation})`,
        globalIndex: ctx.globalIndices[copulaMatch.copulaIndex],
        meaningKey: `pronoun:${option.personNumber ?? "unknown"}`,
      });
      results.push({
        tokenIndices: frase.tokenIndices,
        parts,
        answerInfo,
        isQuestionPattern: !!ctx.context.questionMatch,
      });
    }
    return results;
  }

  const subjectAlternatives = generateSubjectAlternatives(ctx.subjectResults);
  const objectAlternatives = generateObjectAlternatives(ctx.objectResults);

  let verbAlternatives: (VerbRuleResult | null)[] =
    ctx.letUsMatch && ctx.verbResult && ctx.verbResult.results.length > 0
      ? ctx.verbResult.results
      : [null];

  if (ctx.ngarraMatch) {
    const ngarraAlternatives: VerbRuleResult[] = [];
    const verbToken = ctx.fraseTokens[ctx.ngarraMatch.verbIndex];

    if (verbToken?.verbMatch?.gupKey) {
      const verbGupKey = verbToken.verbMatch.gupKey;
      const verbEntry = LEXICON.verbs[verbGupKey];

      if (verbEntry) {
        const primaryForm = verbEntry.forms[0] || verbGupKey;

        ngarraAlternatives.push({
          gup: `ŋarra ${primaryForm}`,
          baseGup: primaryForm,
          particles: [],
          formUsed: 1,
          formName: "primary",
          explanation: `Ŋarra pattern: ŋarra + ${primaryForm} (I'm about to/going to)`,
          features: {} as any,
          options: [],
          hasAmbiguity: false,
        });

        ngarraAlternatives.push({
          gup: `ŋarra ${primaryForm}na`,
          baseGup: `${primaryForm}na`,
          particles: [],
          formUsed: 1,
          formName: "primary",
          explanation: `Ŋarra pattern: ŋarra + ${primaryForm}na (I'm about to/going to + -na)`,
          features: {} as any,
          options: [],
          hasAmbiguity: false,
        });

        verbAlternatives.push(...ngarraAlternatives);
      }
    }
  }

  if (ctx.mindIfMatch?.isFirstPerson) {
    const mindIfAlternatives: VerbRuleResult[] = [];
    const verbToken = ctx.fraseTokens[ctx.mindIfMatch.verbIndex];

    if (verbToken?.verbMatch?.gupKey) {
      const verbGupKey = verbToken.verbMatch.gupKey;
      const verbEntry = LEXICON.verbs[verbGupKey];

      if (verbEntry) {
        const primaryForm = verbEntry.forms[0] || verbGupKey;

        mindIfAlternatives.push({
          gup: `ŋarra ${primaryForm}`,
          baseGup: primaryForm,
          particles: [],
          formUsed: 1,
          formName: "primary",
          explanation: `Mind-if pattern: ŋarra + ${primaryForm} (first person only)`,
          features: {} as any,
          options: [],
          hasAmbiguity: false,
        });

        mindIfAlternatives.push({
          gup: `ŋarra ${primaryForm}na`,
          baseGup: `${primaryForm}na`,
          particles: [],
          formUsed: 1,
          formName: "primary",
          explanation: `Mind-if pattern: ŋarra + ${primaryForm}na (first person + -na)`,
          features: {} as any,
          options: [],
          hasAmbiguity: false,
        });

        verbAlternatives.push(...mindIfAlternatives);
      }
    }
  }

  if (ctx.habitualMatch || ctx.pastHabitualAuxMatch) {
    const habitualAlternatives: VerbRuleResult[] = [];
    const sameDayPastAlternatives: VerbRuleResult[] = [];
    const verbIndex =
      ctx.pastHabitualAuxMatch?.verbIndex ??
      ctx.verbResult?.localIndex ??
      ctx.context.matchedPattern?.mainVerbIndex ??
      ctx.fraseTokens.findIndex((t) => t.type === "verb");
    const verbToken = ctx.fraseTokens[verbIndex];
    const allTheTime = "bitjan bili";
    const baseFeatures = ctx.verbResult?.results?.[0]?.features || ({} as any);

    if (verbToken?.verbMatch?.gupKey) {
      const verbEntry = LEXICON.verbs[verbToken.verbMatch.gupKey];
      if (verbEntry) {
        const isNeg = ctx.context.hasNegation;
        const negParticles = isNeg ? ["yaka", "bäyŋu"] : [""];
        const markers = ["ŋuli", "li"];
        const isPastTense =
          verbToken.verbMatch?.tense === "preterite" ||
          verbToken.verbMatch?.tense === "imperfect";
        const isPastHabitual =
          !!ctx.pastHabitualAuxMatch || (ctx.habitualMatch && isPastTense);

        if (isPastHabitual) {
          const quaternaryForms = [
            verbEntry.forms[3],
            verbEntry.forms[4],
          ].filter((form): form is string => !!form);
          const uniqueForms = Array.from(new Set(quaternaryForms));
          const fallbackForm =
            verbEntry.forms[3] ||
            verbEntry.forms[2] ||
            verbEntry.forms[0] ||
            verbToken.verbMatch.gupKey;
          const formsToUse =
            uniqueForms.length > 0 ? uniqueForms : [fallbackForm];

          for (const neg of negParticles) {
            for (const marker of markers) {
              for (const withGanha of [false, true]) {
                for (const verbForm of formsToUse) {
                  const particles: string[] = [];
                  if (neg) particles.push(neg);
                  particles.push(marker);
                  if (withGanha) particles.push("ganha");
                  const particlesStr =
                    particles.length > 0 ? particles.join(" ") + " " : "";
                  const gupBase = particlesStr + verbForm;
                  const baseExplanation = isNeg
                    ? `Habitual past (neg): ${particles.join(" ")} + ${verbForm}`
                    : `Habitual past: ${particles.join(" ")} + ${verbForm}`;

                  habitualAlternatives.push({
                    gup: gupBase,
                    baseGup: verbForm,
                    particles,
                    formUsed: 4,
                    formName: "quaternary",
                    explanation: baseExplanation,
                    features: baseFeatures,
                    options: [],
                    hasAmbiguity: true,
                  });

                  habitualAlternatives.push({
                    gup: `${gupBase} ${allTheTime}`,
                    baseGup: verbForm,
                    particles,
                    formUsed: 4,
                    formName: "quaternary",
                    explanation: `${baseExplanation} + ${allTheTime}`,
                    features: baseFeatures,
                    options: [],
                    hasAmbiguity: true,
                  });
                }
              }
            }
          }

          if (ctx.pastHabitualAuxMatch) {
            const posForm =
              verbEntry.forms[2] ||
              verbEntry.forms[0] ||
              verbToken.verbMatch.gupKey;
            const negForm =
              verbEntry.forms[3] ||
              verbEntry.forms[2] ||
              verbEntry.forms[0] ||
              verbToken.verbMatch.gupKey;
            const pastForm = isNeg ? negForm : posForm;
            const pastFormUsed = isNeg ? 4 : 3;
            const pastFormName = isNeg ? "quaternary" : "tertiary";

            for (const neg of negParticles) {
              const particles = neg ? [neg] : [];
              const particlesStr =
                particles.length > 0 ? particles.join(" ") + " " : "";
              const gupBase = particlesStr + pastForm;
              const baseExplanation = isNeg
                ? `Past (same-day, neg): ${particles.join(" ")} + ${pastForm}`
                : `Past (same-day): ${pastForm}`;

              sameDayPastAlternatives.push({
                gup: gupBase,
                baseGup: pastForm,
                particles,
                formUsed: pastFormUsed,
                formName: pastFormName,
                explanation: baseExplanation,
                features: baseFeatures,
                options: [],
                hasAmbiguity: true,
              });
            }
          }
        } else {
          const primaryForm = verbEntry.forms[0] || verbToken.verbMatch.gupKey;
          const secondaryForm = verbEntry.forms[1] || primaryForm;
          const verbForm = isNeg ? secondaryForm : primaryForm;
          const formUsed = isNeg ? 2 : 1;
          const formName = isNeg ? "secondary" : "primary";

          for (const neg of negParticles) {
            for (const marker of markers) {
              for (const withGa of [false, true]) {
                const particles: string[] = [];
                if (neg) particles.push(neg);
                particles.push(marker);
                if (withGa) particles.push("ga");
                const particlesStr =
                  particles.length > 0 ? particles.join(" ") + " " : "";
                const gupBase = particlesStr + verbForm;
                const baseExplanation = isNeg
                  ? `Habitual (neg): ${particles.join(" ")} + ${verbForm}`
                  : `Habitual: ${particles.join(" ")} + ${verbForm}`;

                habitualAlternatives.push({
                  gup: gupBase,
                  baseGup: verbForm,
                  particles,
                  formUsed,
                  formName,
                  explanation: baseExplanation,
                  features: baseFeatures,
                  options: [],
                  hasAmbiguity: true,
                });

                habitualAlternatives.push({
                  gup: `${gupBase} ${allTheTime}`,
                  baseGup: verbForm,
                  particles,
                  formUsed,
                  formName,
                  explanation: `${baseExplanation} + ${allTheTime}`,
                  features: baseFeatures,
                  options: [],
                  hasAmbiguity: true,
                });
              }
            }
          }
        }
      }
    }

    if (habitualAlternatives.length > 0) {
      if (ctx.pastHabitualAuxMatch) {
        verbAlternatives = [...habitualAlternatives];
        if (sameDayPastAlternatives.length > 0) {
          verbAlternatives.push(...sameDayPastAlternatives);
        }
      } else {
        verbAlternatives = habitualAlternatives;
      }
    }
  }

  if (ctx.mightMatch) {
    const mightAlternatives: VerbRuleResult[] = [];
    const verbIndex = ctx.mightMatch.verbIndex;
    const verbToken = ctx.fraseTokens[verbIndex];
    const baseFeatures = ctx.verbResult?.results?.[0]?.features || ({} as any);

    if (verbToken?.verbMatch?.gupKey) {
      const verbEntry = LEXICON.verbs[verbToken.verbMatch.gupKey];
      if (verbEntry) {
        const isPast = ctx.mightMatch.isPast;

        if (isPast) {
          const forms = [verbEntry.forms[3], verbEntry.forms[4]].filter(
            (form): form is string => !!form,
          );
          const uniqueForms = Array.from(new Set(forms));
          const fallback =
            verbEntry.forms[3] ||
            verbEntry.forms[2] ||
            verbEntry.forms[0] ||
            verbToken.verbMatch.gupKey;
          const formsToUse = uniqueForms.length > 0 ? uniqueForms : [fallback];

          for (const form of formsToUse) {
            mightAlternatives.push({
              gup: `balaŋu ${form}`,
              baseGup: form,
              particles: ["balaŋu"],
              formUsed: 4,
              formName: "quaternary",
              explanation: `Might (past): balaŋu + ${form}`,
              features: baseFeatures,
              options: [],
              hasAmbiguity: true,
            });
            mightAlternatives.push({
              gup: `bäna balaŋu ${form}`,
              baseGup: form,
              particles: ["bäna", "balaŋu"],
              formUsed: 4,
              formName: "quaternary",
              explanation: `Might (past): bäna balaŋu + ${form}`,
              features: baseFeatures,
              options: [],
              hasAmbiguity: true,
            });
          }
        } else {
          const primaryForm = verbEntry.forms[0] || verbToken.verbMatch.gupKey;
          const secondaryForm = verbEntry.forms[1] || primaryForm;

          for (const withGi of [false, true]) {
            const giPart = withGi ? " gi" : "";
            mightAlternatives.push({
              gup: `balaŋu${giPart} ${secondaryForm}`,
              baseGup: secondaryForm,
              particles: withGi ? ["balaŋu", "gi"] : ["balaŋu"],
              formUsed: 2,
              formName: "secondary",
              explanation: withGi
                ? `Might: balaŋu gi + ${secondaryForm}`
                : `Might: balaŋu + ${secondaryForm}`,
              features: baseFeatures,
              options: [],
              hasAmbiguity: true,
            });
            mightAlternatives.push({
              gup: `bäna balaŋu${giPart} ${secondaryForm}`,
              baseGup: secondaryForm,
              particles: withGi ? ["bäna", "balaŋu", "gi"] : ["bäna", "balaŋu"],
              formUsed: 2,
              formName: "secondary",
              explanation: withGi
                ? `Might: bäna balaŋu gi + ${secondaryForm}`
                : `Might: bäna balaŋu + ${secondaryForm}`,
              features: baseFeatures,
              options: [],
              hasAmbiguity: true,
            });
          }

          mightAlternatives.push({
            gup: `balaŋu yurru ${primaryForm}`,
            baseGup: primaryForm,
            particles: ["balaŋu", "yurru"],
            formUsed: 1,
            formName: "primary",
            explanation: `Might: balaŋu yurru + ${primaryForm}`,
            features: baseFeatures,
            options: [],
            hasAmbiguity: true,
          });
          mightAlternatives.push({
            gup: `balaŋu dhu ${primaryForm}`,
            baseGup: primaryForm,
            particles: ["balaŋu", "dhu"],
            formUsed: 1,
            formName: "primary",
            explanation: `Might: balaŋu dhu + ${primaryForm}`,
            features: baseFeatures,
            options: [],
            hasAmbiguity: true,
          });
        }
      }
    }

    if (mightAlternatives.length > 0) {
      verbAlternatives = mightAlternatives;
    }
  }

  if (ctx.shouldMatch) {
    const shouldAlternatives: VerbRuleResult[] = [];
    const verbIndex = ctx.shouldMatch.verbIndex;
    const verbToken = ctx.fraseTokens[verbIndex];
    const baseFeatures = ctx.verbResult?.results?.[0]?.features || ({} as any);

    if (verbToken?.verbMatch?.gupKey) {
      const verbEntry = LEXICON.verbs[verbToken.verbMatch.gupKey];
      if (verbEntry) {
        const hasNegation = ctx.context.hasNegation;

        if (ctx.shouldMatch.isPast) {
          const forms = [verbEntry.forms[3], verbEntry.forms[4]].filter(
            (form): form is string => !!form,
          );
          const uniqueForms = Array.from(new Set(forms));
          const fallback =
            verbEntry.forms[3] ||
            verbEntry.forms[2] ||
            verbEntry.forms[0] ||
            verbToken.verbMatch.gupKey;
          const formsToUse = uniqueForms.length > 0 ? uniqueForms : [fallback];

          for (const form of formsToUse) {
            for (const withGanha of [false, true]) {
              const particles: string[] = ["balaŋu"];
              if (hasNegation) particles.push("yaka");
              if (withGanha) particles.push("ganha");
              const gup =
                particles.length > 0 ? `${particles.join(" ")} ${form}` : form;
              const baseExplanation = `Should/Must/Would (past): ${particles.join(
                " ",
              )} + ${form}`;
              shouldAlternatives.push({
                gup,
                baseGup: form,
                particles,
                formUsed: 4,
                formName: "quaternary",
                explanation: baseExplanation,
                features: baseFeatures,
                options: [],
                hasAmbiguity: true,
              });
            }
          }
        } else {
          const primaryForm = verbEntry.forms[0] || verbToken.verbMatch.gupKey;
          const secondaryForm = verbEntry.forms[1] || primaryForm;
          const markerOptions: string[][] = [
            ["balaŋu"],
            ["ŋuli"],
            ["li"],
            ["balaŋu", "ŋuli"],
            ["balaŋu", "li"],
          ];

          for (const markers of markerOptions) {
            for (const withGi of [false, true]) {
              const particles: string[] = [...markers];
              if (hasNegation) particles.push("yaka");
              if (withGi) particles.push("gi");
              const gup =
                particles.length > 0
                  ? `${particles.join(" ")} ${secondaryForm}`
                  : secondaryForm;
              const baseExplanation = `Should/Must/Would (future): ${particles.join(
                " ",
              )} + ${secondaryForm}`;
              shouldAlternatives.push({
                gup,
                baseGup: secondaryForm,
                particles,
                formUsed: 2,
                formName: "secondary",
                explanation: baseExplanation,
                features: baseFeatures,
                options: [],
                hasAmbiguity: true,
              });
            }
          }
        }
      }
    }

    if (shouldAlternatives.length > 0) {
      verbAlternatives = shouldAlternatives;
    }
  }

  if (ctx.ngarraMatch) {
    const verbToken = ctx.fraseTokens[ctx.ngarraMatch.verbIndex];
    if (verbToken?.verbMatch) {
      const hasExplicitSubject = ctx.subjectResults.some(
        (s) => s.type !== "implied",
      );
      const futureSimpleResults = applyVerbRules(
        verbToken.verbMatch,
        ctx.fraseTokens.map((t) => t.original),
        originalText,
        mode,
        "future",
        false,
        hasExplicitSubject,
        false,
        true,
      );
      if (futureSimpleResults.length > 0) {
        verbAlternatives.push(...futureSimpleResults);
      }
    }
  }
  if (ctx.ngarraMatch) {
    verbAlternatives = verbAlternatives.filter(
      (alt): alt is VerbRuleResult => !!alt,
    );
  }

  if (
    !ctx.letUsMatch &&
    ctx.context.matchedPattern?.patternName === "ir_present_a_infinitive" &&
    ctx.verbResult
  ) {
    const verbToken = ctx.fraseTokens[ctx.verbResult.localIndex];
    if (verbToken?.verbMatch?.tense === "infinitive") {
      const hasExplicitSubject = ctx.subjectResults.some(
        (s) => s.type !== "implied",
      );
      const futureSimpleResults = applyVerbRules(
        verbToken.verbMatch,
        ctx.fraseTokens.map((t) => t.original),
        originalText,
        mode,
        ctx.context.matchedPattern?.tense ?? null,
        ctx.context.matchedPattern?.isContinuous ?? false,
        hasExplicitSubject,
        false,
        true,
      );
      if (futureSimpleResults.length > 0) {
        verbAlternatives = futureSimpleResults;
      }
    }
  }
  if (
    !ctx.letUsMatch &&
    ctx.context.matchedPattern?.patternName === "ir_past_a_infinitive" &&
    ctx.verbResult
  ) {
    const verbToken = ctx.fraseTokens[ctx.verbResult.localIndex];
    if (verbToken?.verbMatch?.tense === "infinitive") {
      const hasExplicitSubject = ctx.subjectResults.some(
        (s) => s.type !== "implied",
      );
      const pastSimpleResults = applyVerbRules(
        verbToken.verbMatch,
        ctx.fraseTokens.map((t) => t.original),
        originalText,
        mode,
        ctx.context.matchedPattern?.tense ?? null,
        ctx.context.matchedPattern?.isContinuous ?? false,
        hasExplicitSubject,
        false,
        true,
      );
      if (pastSimpleResults.length > 0) {
        verbAlternatives = pastSimpleResults;
      }
    }
  }
  if (
    ctx.fraseTokens.some((t) =>
      (LANG_CONFIG[mode].possessiveOwnTriggers || []).some((w) =>
        t.original
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(
            w
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase(),
          ),
      ),
    )
  ) {
    // Debug log removed.
  }

  const conWithAlternatives = generateConWithAlternatives(ctx);
  const locativeAlternatives = generateLocativeAlternatives(ctx);
  const copulaSubjectAlternatives = generateCopulaSubjectAlternatives(ctx);
  const motionDestAlternatives = generateMotionDestinationAlternatives(ctx);

  let questionOutputAlternatives: (string | null)[] = [null];
  const qm = ctx.context.questionMatch;
  if (
    qm?.isComplexPattern &&
    qm.patternOptions &&
    qm.patternOptions.length > 0
  ) {
    questionOutputAlternatives = [
      null,
      ...qm.patternOptions.map((opt) => opt.gup),
    ];
  }

  let modalSuffixAlternatives: DjalSuffixType[][] = [[]];
  if (ctx.modalVerbInfo) {
    const objectGupWords = collectModalVerbObjects(
      ctx.fraseTokens,
      ctx.objectResults,
      ctx.subjectResults,
      ctx.skipLocalIndices,
    );
    if (ctx.djalVerbMatch) {
      objectGupWords.push(ctx.djalVerbMatch.verbGupBase);
    }
    if (objectGupWords.length > 0) {
      modalSuffixAlternatives = generateModalSuffixCombinations(objectGupWords);
    }
  }

  const locativeVerbAlternatives: (LocativeVerbResult | null)[] = (() => {
    if (ctx.isAmbiguousIrSer) {
      return [null, ...ctx.locativeVerbResults];
    }
    return ctx.locativeVerbResults.length > 0
      ? ctx.locativeVerbResults
      : [null];
  })();

  type LocativeVerbMatchAlternative = "use" | "ignore";
  const locativeVerbMatchAlternatives: LocativeVerbMatchAlternative[] = (() => {
    if (ctx.locativeVerbMatch && ctx.purposeInfinitiveMatch) {
      return ["use", "ignore"];
    }
    if (ctx.locativeVerbMatch && ctx.context.matchedPattern?.patternName) {
      const isIrPattern = [
        "ir_present_a_infinitive",
        "ir_past_a_infinitive",
      ].includes(ctx.context.matchedPattern.patternName);
      if (isIrPattern) {
        return ["use", "ignore"];
      }
    }
    if (ctx.locativeVerbMatch && ctx.hasIrPatternWithPurpose) {
      return ["use", "ignore"];
    }
    return ["use"];
  })();

  type PurposeInfinitiveAlternative =
    | { type: "with-main-verb" }
    | { type: "conjugated-only"; conjugatedForm: string }
    | { type: "future-simple"; verbAlt: VerbRuleResult };
  const purposeInfinitiveAlternatives: PurposeInfinitiveAlternative[] = (() => {
    const buildFutureSimpleAlternatives =
      (): PurposeInfinitiveAlternative[] => {
        const pim = ctx.purposeInfinitiveMatch;
        if (!pim) return [];
        const infinitiveToken = ctx.fraseTokens[pim.infinitiveIndex];
        const infinitiveMatch = infinitiveToken?.verbMatch;
        if (!infinitiveMatch) return [];
        const tokenWords = ctx.fraseTokens.map((t) => t.original);
        const fraseText = tokenWords.join(" ");
        const hasExplicitSubject = ctx.subjectResults.some(
          (s) => s.type !== "implied",
        );
        const futureResults = applyVerbRules(
          infinitiveMatch,
          tokenWords,
          fraseText,
          ctx.mode,
          "future",
          false,
          hasExplicitSubject,
          false,
        );
        return futureResults.map((verbAlt) => ({
          type: "future-simple",
          verbAlt,
        }));
      };

    const getConjugatedForm = (
      forms: string[],
      tense: string | null | undefined,
    ) => {
      if (tense === "future" || tense === "conditional") return forms[0];
      if (tense === "past") return forms[2];
      if (tense === "preterite" || tense === "imperfect") return forms[2];
      return forms[1];
    };

    if (
      ctx.hasIrPatternWithPurpose &&
      ctx.purposeInfinitiveMatch?.infinitiveEntry
    ) {
      return [{ type: "with-main-verb" }];
    }
    if (
      ctx.purposeInfinitiveMatch?.hasAlternativePattern &&
      ctx.purposeInfinitiveMatch.infinitiveEntry
    ) {
      const pim = ctx.purposeInfinitiveMatch;
      if (pim.mainVerbTense === "imperative") {
        return [{ type: "with-main-verb" }];
      }
      if (pim.mainVerbEntry?.noInfinitiveSuffix) {
        return [{ type: "with-main-verb" }];
      }
      const forms = pim.infinitiveEntry.forms;
      const conjugatedForm = getConjugatedForm(forms, pim.mainVerbTense);
      const futureSimple = buildFutureSimpleAlternatives();
      return [
        { type: "with-main-verb" },
        { type: "conjugated-only", conjugatedForm },
        ...futureSimple,
      ];
    }
    return [{ type: "with-main-verb" }];
  })();

  type IrPatternAlternative = "use-pattern" | "use-literal";
  const irPatternAlternatives: IrPatternAlternative[] = (() => {
    if (ctx.hasIrPatternWithPurpose) {
      return ["use-pattern", "use-literal"];
    }
    return ["use-pattern"];
  })();

  type MakeAdjectiveAlternative = "use-pattern" | "use-literal" | "none";
  const makeAdjectiveAlternatives: MakeAdjectiveAlternative[] = (() => {
    if (ctx.makeAdjectiveMatch) {
      return ["use-pattern", "use-literal"];
    }
    return ["none"];
  })();

  type InfinitiveAgentAlternative = "ambiguous" | "explicit";
  const infinitiveAgentAlternatives: InfinitiveAgentAlternative[] = (() => {
    if (ctx.djalVerbMatch) {
      return ["ambiguous", "explicit"];
    }
    return ["ambiguous"];
  })();

  type MirriAlternativeType =
    | { type: "object-mirri" }
    | {
        type: "subject-possessive";
        possessiveForm: string;
        subjectLocalIndex: number;
      };
  const mirriAlternatives: MirriAlternativeType[] = (() => {
    const alts: MirriAlternativeType[] = [{ type: "object-mirri" }];
    if (ctx.mirriMiriwMatch?.suffixType === "mirri") {
      const explicitSubjects = ctx.subjectResults.filter(
        (s) => s.type === "noun" || s.type === "name",
      );
      if (explicitSubjects.length > 0) {
        for (const subj of explicitSubjects) {
          const baseGup = subj.baseGup || subj.gup;
          const suffixResult = determinePossessiveSuffix(baseGup, ctx.mode);
          for (const suffix of suffixResult.suffixes) {
            const possessiveForm = applyPossessiveSuffix(baseGup, suffix);
            alts.push({
              type: "subject-possessive",
              possessiveForm,
              subjectLocalIndex: subj.localIndex,
            });
          }
        }
      } else if (ctx.mirriMiriwMatch.personNumber) {
        const possessiveForms =
          POSSESSIVE_PRONOUNS_GUP[ctx.mirriMiriwMatch.personNumber];
        if (possessiveForms) {
          for (const form of possessiveForms) {
            alts.push({
              type: "subject-possessive",
              possessiveForm: form,
              subjectLocalIndex: -1,
            });
          }
        }
      }
    }
    return alts;
  })();

  type LocaliveSuffixChoice = {
    suffixType: "ngura" | "lili" | "nguru" | "ergative" | "belonging" | "perlative";
    explanation: string;
  } | null;

  const locativeSuffixAlternatives: LocaliveSuffixChoice[] = (() => {
    const locMatch = ctx.context.locativeMatch;
    if (locMatch && locMatch.verbIndices && locMatch.verbIndices.length > 0) {
      const alts: LocaliveSuffixChoice[] = [
        {
          suffixType: locMatch.suffixType,
          explanation: locMatch.explanation,
        },
      ];
      if (locMatch.alternativeSuffixTypes) {
        alts.push(...locMatch.alternativeSuffixTypes);
      }
      return alts;
    }
    return [null];
  })();

  const emotionVerbAlternatives: (VerbRuleResult | null)[] = (() => {
    if (!ctx.emotionMatch) return [null];
    const verbEntry = LEXICON.verbs[ctx.emotionMatch.verbKey];
    if (!verbEntry) return [null];

    const tertiaryForm =
      verbEntry.forms[2] ||
      verbEntry.forms[1] ||
      verbEntry.forms[0] ||
      ctx.emotionMatch.verbKey;
    const primaryForm = verbEntry.forms[0] || tertiaryForm;
    const baseFeatures = ctx.verbResult?.results?.[0]?.features || ({} as any);
    const baseExplanation = `Emotion: ${ctx.emotionMatch.adjectiveWord} → ${tertiaryForm}`;

    const options: VerbRuleResult[] = [
      {
        gup: tertiaryForm,
        baseGup: tertiaryForm,
        particles: [],
        formUsed: 3,
        formName: "tertiary",
        explanation: baseExplanation,
        features: baseFeatures,
        options: [],
        hasAmbiguity: true,
      },
      {
        gup: `dhuwala ${tertiaryForm}`,
        baseGup: tertiaryForm,
        particles: ["dhuwala"],
        formUsed: 3,
        formName: "tertiary",
        explanation: `Emotion: dhuwala + ${tertiaryForm}`,
        features: baseFeatures,
        options: [],
        hasAmbiguity: true,
      },
      {
        gup: `ga ${primaryForm}`,
        baseGup: primaryForm,
        particles: ["ga"],
        formUsed: 1,
        formName: "primary",
        explanation: `Emotion: ga + ${primaryForm}`,
        features: baseFeatures,
        options: [],
        hasAmbiguity: true,
      },
    ];

    return options;
  })();

  const results: TranslatedFrase[] = [];
  const fraseTokenStrings = ctx.fraseTokens.map((t) => t.original);
  const hasVerb =
    ctx.fraseTokens.some((t) => t.type === "verb") ||
    ctx.locativeCopulaMatch !== null;
  const determinerMatches = ctx.context.determinerMatches;

  for (const questionOutputAlt of questionOutputAlternatives) {
    for (const verbAlt of verbAlternatives) {
      const isNgarraVerbAlt = verbAlt?.gup.startsWith("ŋarra ") || false;
      for (const emotionVerbAlt of emotionVerbAlternatives) {
        for (const altSubjects of subjectAlternatives) {
          if (isNgarraVerbAlt) {
            const hasFirstSing = altSubjects.some(
              (s) => s.personNumber === "1_Sing",
            );
            const hasExplicitSubject = altSubjects.some(
              (s) => s.type !== "implied",
            );
            if (hasExplicitSubject && !hasFirstSing) {
              continue;
            }
          }
          for (const altObjects of objectAlternatives) {
            for (const conWithAlt of conWithAlternatives) {
              for (const locativeAlt of locativeAlternatives) {
                for (const copulaAlt of copulaSubjectAlternatives) {
                  for (const motionDestAlt of motionDestAlternatives) {
                    for (const suffixCombo of modalSuffixAlternatives) {
                      for (const locVerbAlt of locativeVerbAlternatives) {
                        for (const locVerbMatchAlt of locativeVerbMatchAlternatives) {
                          for (const locSuffixAlt of locativeSuffixAlternatives) {
                            for (const mirriAlt of mirriAlternatives) {
                              for (const purposeInfAlt of purposeInfinitiveAlternatives) {
                                for (const irPatternAlt of irPatternAlternatives) {
                                  for (const makeAdjAlt of makeAdjectiveAlternatives) {
                                    for (const infAgentAlt of infinitiveAgentAlternatives) {
                                      if (
                                        purposeInfAlt.type ===
                                          "future-simple" &&
                                        locVerbMatchAlt === "use"
                                      ) {
                                        continue;
                                      }
                                      if (
                                        purposeInfAlt.type ===
                                          "future-simple" &&
                                        verbAlt
                                      ) {
                                        continue;
                                      }
                                      const effectiveVerbAlt =
                                        purposeInfAlt.type === "future-simple"
                                          ? purposeInfAlt.verbAlt
                                          : verbAlt;
                                      const parts = buildParts(
                                        {
                                          ...ctx,
                                          subjectResults: altSubjects,
                                          objectResults: altObjects,
                                          unknownConWithChoice: conWithAlt,
                                          unknownLocativeChoice: locativeAlt,
                                          mirriAlternative: mirriAlt,
                                          copulaSubjectChoice: copulaAlt,
                                          motionDestinationChoice:
                                            motionDestAlt,
                                          purposeInfinitiveAlternative:
                                            purposeInfAlt,
                                          irPatternAlternative: irPatternAlt,
                                          makeAdjectiveAlternative: makeAdjAlt,
                                          infinitiveAgentAlternative:
                                            infAgentAlt,
                                          locativeSuffixChoice: locSuffixAlt,
                                          locativeVerbMatchAlternative:
                                            locVerbMatchAlt,
                                        },
                                        suffixCombo,
                                        locVerbAlt,
                                        questionOutputAlt,
                                        effectiveVerbAlt,
                                        emotionVerbAlt,
                                      );
                                      if (
                                        ctx.fraseTokens.some((t) =>
                                          (LANG_CONFIG[ctx.mode]
                                            .possessiveOwnTriggers || []
                                          ).some((w) =>
                                            t.original
                                              .normalize("NFD")
                                              .replace(/[\u0300-\u036f]/g, "")
                                              .toLowerCase()
                                              .includes(
                                                w
                                                  .normalize("NFD")
                                                  .replace(
                                                    /[\u0300-\u036f]/g,
                                                    "",
                                                  )
                                                  .toLowerCase(),
                                              ),
                                          ),
                                        )
                                      ) {
                                        const hasVerbPart = parts.some(
                                          (p) => p.type === "verb",
                                        );
                                        if (!hasVerbPart) {
                                          // Debug log removed.
                                        }
                                      }

                                      const baseTranslation: DefiniteTranslation =
                                        {
                                          gup: parts
                                            .map((p) => p.gup)
                                            .join(" "),
                                          parts: parts as DefinitePart[],
                                          explanation: "",
                                        };

                                      const definiteVariants =
                                        applyDefiniteDemonstratives(
                                          [baseTranslation],
                                          fraseTokenStrings,
                                          mode,
                                          determinerMatches,
                                        );

                                      for (const defVariant of definiteVariants) {
                                        const pluralVariants =
                                          applyPluralToPhrase(
                                            [defVariant as PluralTranslation],
                                            fraseTokenStrings,
                                            mode,
                                            hasVerb,
                                            determinerMatches,
                                          );
                                        for (const variant of pluralVariants) {
                                          results.push({
                                            tokenIndices: frase.tokenIndices,
                                            parts:
                                              variant.parts as TranslationPart[],
                                            answerInfo,
                                            isQuestionPattern:
                                              !!ctx.context.questionMatch,
                                          });
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  const seen = new Set<string>();
  const uniqueResults: TranslatedFrase[] = [];
  for (const result of results) {
    const gupKey = result.parts.map((p) => p.gup).join(" ");
    if (!seen.has(gupKey)) {
      seen.add(gupKey);
      uniqueResults.push(result);
    }
  }

  return uniqueResults;
}

function buildFraseContext(
  frase: Frase,
  tokens: Token[],
  mode: LanguageMode,
  originalText: string,
  inheritedMirriMiriw: MirriMiriwMatch | null = null,
  globalVerbContext: GlobalVerbContext | null = null,
  ignoreLetUs: boolean = false,
): FraseProcessingContext {
  const fraseTokens: Token[] = frase.tokenIndices.map((idx) => tokens[idx]);
  const globalIndices = frase.tokenIndices;
  const context = analyzeFraseContext(fraseTokens, originalText, mode);

  const normalizeCause = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const causeTriggerSet = new Set(
    (LANG_CONFIG[mode].causeTriggers || []).map((t) => normalizeCause(t)),
  );
  if (
    context.locativeMatch &&
    context.copulaMatch &&
    context.locativeMatch.triggerIndices.length > 0 &&
    causeTriggerSet.has(normalizeCause(context.locativeMatch.triggerPhrase))
  ) {
    const lastTriggerIdx = Math.max(...context.locativeMatch.triggerIndices);
    if (context.copulaMatch.copulaIndex > lastTriggerIdx) {
      context.copulaMatch = null;
    }
  }

  const skipLocalIndices = new Set<number>(
    context.matchedPattern?.skipIndices || [],
  );
  const emphaticSkip = detectEmphaticSubjectTriggers(fraseTokens, mode);
  for (const idx of emphaticSkip.skipIndices) {
    skipLocalIndices.add(idx);
  }
  const emphaticObjectSkip = detectObjectEmphasisTriggers(fraseTokens, mode);
  for (const idx of emphaticObjectSkip.skipIndices) {
    skipLocalIndices.add(idx);
  }

  const normalizeEmphasis = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const emphasisWords = (LANG_CONFIG[mode].pronounEmphasisWords || []).map(
    normalizeEmphasis,
  );
  const buildEmphaticPronounForms = (
    map: Record<PersonNumber, string[]>,
    personNumber: PersonNumber,
  ): string[] => {
    let forms = map[personNumber] || [];
    if (personNumber === "1+2_Plur") {
      const excl = map["1+3_Plur"];
      if (excl) forms = [...forms, ...excl];
    } else if (personNumber === "1+2_Dual") {
      const excl = map["1+3_Dual"];
      if (excl) forms = [...forms, ...excl];
    }
    return forms;
  };
  const applyEmphaticPronounMatch = (
    match: PronounMatch | null,
    label: string,
    emphaticMap: Record<PersonNumber, string[]>,
  ): PronounMatch | null => {
    if (!match || emphasisWords.length === 0) return match;
    const lastIdx = Math.max(...match.triggerIndices);
    let idx = lastIdx + 1;
    while (idx < fraseTokens.length && fraseTokens[idx].type === "connector") {
      idx += 1;
    }
    const nextToken = fraseTokens[idx];
    if (!nextToken) return match;
    const nextNorm = normalizeEmphasis(nextToken.original);
    if (!emphasisWords.includes(nextNorm)) return match;
    skipLocalIndices.add(idx);
    const emphaticForms = buildEmphaticPronounForms(
      emphaticMap,
      match.personNumber,
    );
    if (emphaticForms.length === 0) return match;
    return {
      ...match,
      gupForms: emphaticForms,
      explanation: `"${match.triggerPhrase} ${nextToken.original}" → ${emphaticForms[0]} (${label} + énfasis)`,
    };
  };
  context.comitativePronounMatch = applyEmphaticPronounMatch(
    context.comitativePronounMatch,
    "comitative pronoun",
    HUMAN_ALLATIVE_PRONOUNS_GUP_EMPHATIC,
  );
  context.humanAllativePronounMatch = applyEmphaticPronounMatch(
    context.humanAllativePronounMatch,
    "human allative pronoun",
    HUMAN_ALLATIVE_PRONOUNS_GUP_EMPHATIC,
  );
  context.humanAblativePronounMatch = applyEmphaticPronounMatch(
    context.humanAblativePronounMatch,
    "human ablative pronoun",
    HUMAN_ABLATIVE_PRONOUNS_GUP_EMPHATIC,
  );

  for (const dm of context.determinerMatches) {
    skipLocalIndices.add(dm.determinerIndex);
  }

  const isCopula = context.copulaMatch !== null;
  const { ambiguousIrSerForms } = LANG_CONFIG[mode];
  const copulaWord = context.copulaMatch?.copulaWord?.toLowerCase() ?? "";
  const isAmbiguousIrSer = isCopula && ambiguousIrSerForms.includes(copulaWord);

  if (isCopula && !isAmbiguousIrSer) {
    skipLocalIndices.add(context.copulaMatch!.copulaIndex);
    if (context.copulaMatch!.subjectIndex !== null) {
      skipLocalIndices.add(context.copulaMatch!.subjectIndex);
    }
  }

  const mindIfMatch = detectMindIfPattern(fraseTokens, mode);
  const defaultVerbIdx = fraseTokens.findIndex((t) => t.type === "verb");
  let verbIdx =
    mindIfMatch?.verbIndex ??
    context.matchedPattern?.mainVerbIndex ??
    defaultVerbIdx;
  if (verbIdx === defaultVerbIdx) {
    const verbWithMatch = fraseTokens.findIndex(
      (t) => t.type === "verb" && t.verbMatch,
    );
    if (verbWithMatch !== -1) {
      verbIdx = verbWithMatch;
    }
  }
  const hasSubjectBeforeVerb =
    verbIdx > 0 &&
    fraseTokens.slice(0, verbIdx).some((t) => t.type === "pronoun");
  const hasVerbInFrase = verbIdx !== -1;

  const modalVerbInfo = detectModalVerb(fraseTokens, verbIdx);

  const irPatternNames = ["ir_present_a_infinitive", "ir_past_a_infinitive"];
  const hasIrPattern = irPatternNames.includes(
    context.matchedPattern?.patternName ?? "",
  );
  const detectedPurposeInfinitiveMatch = detectPurposeInfinitive(
    fraseTokens,
    mode,
  );
  let earlyPurposeInfinitiveMatch = detectedPurposeInfinitiveMatch;
  if (
    earlyPurposeInfinitiveMatch &&
    context.locativeMatch &&
    causeTriggerSet.has(normalizeCause(context.locativeMatch.triggerPhrase))
  ) {
    const triggerIdxs = context.locativeMatch.triggerIndices;
    const minTrigger = Math.min(...triggerIdxs);
    const maxTrigger = Math.max(...triggerIdxs);
    const mainIdx = earlyPurposeInfinitiveMatch.mainVerbIndex;
    const infIdx = earlyPurposeInfinitiveMatch.infinitiveIndex;
    const mainVerbWord = earlyPurposeInfinitiveMatch.mainVerbWord;
    const spanStart = Math.min(mainIdx, infIdx);
    const spanEnd = Math.max(mainIdx, infIdx);
    const triggerOverlapsSpan =
      maxTrigger >= spanStart && minTrigger <= spanEnd;
    const mainVerbIsCopula = LANG_CONFIG[mode].copulaVerbs.some(
      (w) => normalizeCause(w) === normalizeCause(mainVerbWord),
    );
    const causeBeforeMain = minTrigger < mainIdx;
    if (triggerOverlapsSpan || (mainVerbIsCopula && causeBeforeMain)) {
      earlyPurposeInfinitiveMatch = null;
    }
  }
  if (!earlyPurposeInfinitiveMatch && hasIrPattern && context.matchedPattern) {
    const auxIndex = context.matchedPattern.skipIndices[0];
    const infinitiveIndex = context.matchedPattern.mainVerbIndex;
    const auxToken = fraseTokens[auxIndex];
    const infinitiveToken = fraseTokens[infinitiveIndex];
    const auxMatch = auxToken?.verbMatch;
    const infinitiveMatch = infinitiveToken?.verbMatch;
    if (auxMatch && infinitiveMatch) {
      const verbEntry = infinitiveMatch.entry;
      const verbGupBase = verbEntry.forms[4] ?? verbEntry.forms[3];
      const suffixResult = determineDjalSuffix(verbGupBase);
      const primarySuffix = suffixResult.suffixes[0];
      const verbGupWithSuffix = applyDjalSuffix(verbGupBase, primarySuffix);
      const allOptions = suffixResult.suffixes.map((s) =>
        applyDjalSuffix(verbGupBase, s),
      );
      earlyPurposeInfinitiveMatch = {
        mainVerbIndex: auxIndex,
        mainVerbWord: auxToken.original,
        mainVerbGupKey: auxMatch.gupKey,
        mainVerbEntry: auxMatch.entry,
        mainVerbTense: auxMatch.tense,
        mainVerbPerson: auxMatch.person ?? 0,
        infinitiveIndex,
        infinitiveWord: infinitiveToken.original,
        infinitiveEntry: verbEntry,
        infinitiveGupBase: verbGupBase,
        infinitiveGupWithSuffix: verbGupWithSuffix,
        suffixOptions: allOptions,
        consumedIndices: context.matchedPattern.skipIndices,
        explanation: `${infinitiveToken.original} → ${verbGupBase} + -${primarySuffix} = ${verbGupWithSuffix} (infinitivo -${primarySuffix})`,
        hasAlternativePattern: true,
      };
    }
  }
  const hasIrPatternWithPurpose =
    hasIrPattern && earlyPurposeInfinitiveMatch?.hasAlternativePattern;
  const ownDebugWords = new Set(
    (LANG_CONFIG[mode].possessiveOwnTriggers || []).map((w) =>
      w
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    ),
  );
  const hasOwnDebug = fraseTokens.some((t) =>
    ownDebugWords.has(
      t.original
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    ),
  );
  if (hasOwnDebug) {
    // Debug log removed.
  }
  const infinitiveAgentMatch = detectInfinitiveAgent(fraseTokens, mode);
  let locativeVerbMatch = detectLocativeVerbPattern(fraseTokens, mode);
  if (
    context.matchedPattern &&
    ["ir_present_a_infinitive", "ir_past_a_infinitive"].includes(
      context.matchedPattern.patternName,
    )
  ) {
    locativeVerbMatch = null;
  }
  const becomeAdjectiveMatch = detectBecomeAdjectivePattern(fraseTokens, mode);
  const makeAdjectiveMatch = detectMakeAdjectivePattern(fraseTokens, mode);
  const emotionMatch = detectEmotionMatch(
    fraseTokens,
    context.copulaMatch,
    becomeAdjectiveMatch,
  );
  const letUsMatch = ignoreLetUs ? null : detectLetUsPattern(fraseTokens, mode);
  let ngarraMatch = detectNgarraPattern(fraseTokens, mode);
  if (
    ngarraMatch &&
    ["ir_present_a_infinitive", "ir_past_a_infinitive"].includes(
      context.matchedPattern?.patternName ?? "",
    )
  ) {
    ngarraMatch = null;
  }
  const habitualMatch = detectHabitualPattern(fraseTokens, mode);
  const pastHabitualAuxMatch = detectPastHabitualAuxPattern(fraseTokens, mode);
  const mightMatch = detectMightPattern(fraseTokens, mode);
  const shouldMatch = detectShouldPattern(fraseTokens, mode);
  const thatTimeMatch = detectThatTimePattern(fraseTokens, mode);
  const pointingInfo: PointingInfo | null = (() => {
    const pointingMatch = context.pointingMatch;
    if (!pointingMatch) return null;

    if (
      context.mirriMiriwMatch &&
      pointingMatch.triggerIndices.some((idx) =>
        context.mirriMiriwMatch?.triggerIndices.includes(idx),
      )
    ) {
      return null;
    }

    const pastTenses = new Set([
      "preterite",
      "imperfect",
      "imperfectSubjunctive",
      "pastParticiple",
    ]);
    const hasPastVerbToken = fraseTokens.some(
      (t) =>
        t.type === "verb" && t.verbMatch && pastTenses.has(t.verbMatch.tense),
    );
    const copulaWord = context.copulaMatch?.copulaWord?.toLowerCase() || "";
    const cfg = LANG_CONFIG[mode];
    const hasPastCopula =
      !!copulaWord &&
      (cfg.copulaPastForms.includes(copulaWord) ||
        cfg.copulaImperfectForms.includes(copulaWord));
    const hasPastPattern = context.matchedPattern?.tense === "past";
    const isPast =
      hasPastPattern ||
      hasPastVerbToken ||
      hasPastCopula ||
      !!pastHabitualAuxMatch ||
      !!thatTimeMatch ||
      shouldMatch?.isPast ||
      mightMatch?.isPast ||
      false;

    const gup = isPast
      ? "ŋunhi"
      : pointingMatch.pointType === "here"
        ? "dhuwala"
        : "dhuwali";
    const explanation = isPast
      ? `"${pointingMatch.triggerPhrase}" → ŋunhi (señalar en pasado)`
      : `"${pointingMatch.triggerPhrase}" → ${gup} (señalar aquí/allí)`;

    return { ...pointingMatch, gup, explanation, isPast };
  })();
  if (mightMatch) {
    for (const idx of mightMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }
  if (shouldMatch) {
    for (const idx of shouldMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
    if (context.hasNegation) {
      const negationWords = getNegationWords(mode);
      for (let i = 0; i < fraseTokens.length; i++) {
        if (negationWords.includes(fraseTokens[i].original.toLowerCase())) {
          skipLocalIndices.add(i);
        }
      }
    }
  }
  if (pointingInfo) {
    for (const idx of pointingInfo.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }
  if (emotionMatch) {
    skipLocalIndices.add(emotionMatch.adjectiveIndex);
    if (
      becomeAdjectiveMatch &&
      becomeAdjectiveMatch.adjectiveIndex === emotionMatch.adjectiveIndex
    ) {
      skipLocalIndices.add(becomeAdjectiveMatch.verbIndex);
      if (
        becomeAdjectiveMatch.adjectiveIndex - becomeAdjectiveMatch.verbIndex ===
        2
      ) {
        skipLocalIndices.add(becomeAdjectiveMatch.verbIndex + 1);
      }
    }
  }
  const treatInfinitiveAsFinitePattern =
    [
      "estar_present_a_punto_de_infinitive",
      "estar_present_por_infinitive",
      "estar_past_a_punto_de_infinitive",
      "estar_past_por_infinitive",
      "estar_future_a_punto_de_infinitive",
      "estar_future_por_infinitive",
      "ir_present_a_infinitive",
      "ir_past_a_infinitive",
    ].includes(context.matchedPattern?.patternName ?? "") ||
    !!pastHabitualAuxMatch;
  const forceSameDayFuturePattern = [
    "estar_present_a_punto_de_infinitive",
    "estar_present_por_infinitive",
    "estar_future_a_punto_de_infinitive",
    "estar_future_por_infinitive",
  ].includes(context.matchedPattern?.patternName ?? "");

  const effectiveBecomeAdjectiveMatch =
    emotionMatch &&
    becomeAdjectiveMatch &&
    becomeAdjectiveMatch.adjectiveIndex === emotionMatch.adjectiveIndex
      ? null
      : becomeAdjectiveMatch;

  const verbOverrideIndex =
    mindIfMatch?.verbIndex ??
    pastHabitualAuxMatch?.verbIndex ??
    mightMatch?.verbIndex ??
    shouldMatch?.verbIndex;
  const allowVerbWithCopula = !!context.matchedPattern?.isContinuous;
  let verbResult =
    (isCopula && !isAmbiguousIrSer && !allowVerbWithCopula) ||
    modalVerbInfo ||
    context.questionMatch?.answerInfo
      ? null
      : processVerb(
          fraseTokens,
          context,
          originalText,
          mode,
          hasSubjectBeforeVerb,
          verbOverrideIndex,
          letUsMatch,
          treatInfinitiveAsFinitePattern,
          forceSameDayFuturePattern,
        );

  if (
    ngarraMatch &&
    verbResult &&
    fraseTokens[verbResult.localIndex]?.verbMatch?.tense === "infinitive"
  ) {
    verbResult = null;
  }

  if (letUsMatch?.isStandalone) {
    const marrtjiWithLili = applyAllativeSuffix("marrtjingu");

    const standaloneVerbs: VerbRuleResult[] = [
      {
        gup: "ga marrtji",
        baseGup: "marrtji",
        particles: ["ga"],
        formUsed: 1,
        formName: "primary",
        explanation: "Let's (standalone): ga + marrtji (we are going)",
        features: {} as any,
        options: [],
        hasAmbiguity: false,
      },
      {
        gup: "ga marrtjina",
        baseGup: "marrtjina",
        particles: ["ga"],
        formUsed: 1,
        formName: "primary",
        explanation: "Let's (standalone): ga + marrtjina (we are going + -na)",
        features: {} as any,
        options: [],
        hasAmbiguity: false,
      },
      {
        gup: "marrtji",
        baseGup: "marrtji",
        particles: [],
        formUsed: 1,
        formName: "primary",
        explanation: "Let's (standalone): marrtji (imperative - let's go)",
        features: {} as any,
        options: [],
        hasAmbiguity: false,
      },
      {
        gup: "marrtjina",
        baseGup: "marrtjina",
        particles: [],
        formUsed: 1,
        formName: "primary",
        explanation: "Let's (standalone): marrtjina (imperative + -na)",
        features: {} as any,
        options: [],
        hasAmbiguity: false,
      },
      {
        gup: marrtjiWithLili,
        baseGup: marrtjiWithLili,
        particles: [],
        formUsed: 4,
        formName: "quaternary",
        explanation: `Let's (standalone): marrtjingu + -lili = ${marrtjiWithLili}`,
        features: {} as any,
        options: [],
        hasAmbiguity: false,
      },
    ];
    verbResult = {
      results: standaloneVerbs,
      localIndex: letUsMatch.verbIndex,
    };

    skipLocalIndices.add(letUsMatch.verbIndex);
  } else if (letUsMatch) {
    skipLocalIndices.add(letUsMatch.verbIndex);
  }

  if (ngarraMatch) {
    for (const idx of ngarraMatch.phraseIndices) {
      skipLocalIndices.add(idx);
    }
    skipLocalIndices.delete(ngarraMatch.verbIndex);
  }

  if (mindIfMatch) {
    for (const idx of mindIfMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  let verbPerson: number | null = null;
  let isTransitive = false;
  let verbMotionType: "motion" | "stationary" | undefined;
  if (earlyPurposeInfinitiveMatch?.hasAlternativePattern) {
    verbPerson = earlyPurposeInfinitiveMatch.mainVerbPerson;
    isTransitive = earlyPurposeInfinitiveMatch.mainVerbEntry?.vtr ?? false;
    verbMotionType = earlyPurposeInfinitiveMatch.mainVerbEntry?.motionType;
  }
  if (verbResult) {
    const vToken = fraseTokens[verbResult.localIndex];
    const mainVerbPerson = vToken?.verbMatch?.person;

    const verbIsInNounPattern =
      context.locativeMatch?.nounIndices.includes(verbResult.localIndex) ||
      context.belongingMatch?.belongsToNounIndices.includes(
        verbResult.localIndex,
      ) ||
      context.conWithMatch?.nounIndices.includes(verbResult.localIndex) ||
      context.instrumentalMatch?.nounIndices.includes(verbResult.localIndex) ||
      context.transportMatch?.nounIndices.includes(verbResult.localIndex);

    if (
      verbPerson === null &&
      mainVerbPerson !== undefined &&
      mainVerbPerson >= 0 &&
      !verbIsInNounPattern
    ) {
      verbPerson = mainVerbPerson;
    } else if (
      verbPerson === null &&
      context.matchedPattern?.auxiliaryPerson !== null &&
      context.matchedPattern?.auxiliaryPerson !== undefined
    ) {
      verbPerson = context.matchedPattern.auxiliaryPerson;
    }
    if (!isTransitive) isTransitive = vToken?.verbMatch?.entry?.vtr ?? false;
    if (!verbMotionType) verbMotionType = vToken?.verbMatch?.entry?.motionType;
  } else if (modalVerbInfo) {
    const verbToken = fraseTokens[verbIdx];
    const mainVerbPerson = verbToken?.verbMatch?.person;
    if (mainVerbPerson !== undefined && mainVerbPerson >= 0) {
      verbPerson = mainVerbPerson;
    }
    const infinitiveToken = fraseTokens.find(
      (t) => t.type === "verb" && t.verbMatch?.tense === "infinitive",
    );
    if (infinitiveToken?.verbMatch?.entry?.motionType) {
      verbMotionType = infinitiveToken.verbMatch.entry.motionType;
    }
    isTransitive = true;
  } else if (
    !hasVerbInFrase &&
    globalVerbContext &&
    !context.questionMatch?.isComplexPattern
  ) {
    isTransitive = globalVerbContext.isTransitive;
    verbPerson = globalVerbContext.verbPerson;
  }
  if (modalVerbInfo) {
    isTransitive = true;
  }
  if (verbPerson === null && ngarraMatch) {
    verbPerson = 0;
  }
  if (context.copulaMatch && !verbMotionType) {
    verbMotionType = "stationary";
  }

  const isImperative = verbResult?.results[0]?.features?.mood === "imperative";
  const { dualMarkers } = LANG_CONFIG[mode];
  const allWords = fraseTokens.map((t) => t.original.toLowerCase());
  const hasDualMarker = dualMarkers.some((m) => allWords.includes(m));

  const mirriMiriwMatch = context.mirriMiriwMatch || inheritedMirriMiriw;
  const skipErgative = !!mirriMiriwMatch || !!modalVerbInfo;
  if (context.mirriMiriwMatch) {
    for (const idx of context.mirriMiriwMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  if (modalVerbInfo) {
    const negationWords = getNegationWords(mode);
    for (let i = 0; i < fraseTokens.length; i++) {
      if (negationWords.includes(fraseTokens[i].original.toLowerCase())) {
        skipLocalIndices.add(i);
      }
    }
  }

  const conWithAllIndices = new Set<number>([
    ...(context.conWithMatch?.nounIndices || []),
    ...(context.conWithMatch?.triggerIndices || []),
  ]);

  const comitativePronounIndices = new Set<number>(
    context.comitativePronounMatch?.triggerIndices || [],
  );

  const humanAllativePronounIndices = new Set<number>(
    context.humanAllativePronounMatch?.triggerIndices || [],
  );

  const humanAblativePronounIndices = new Set<number>(
    context.humanAblativePronounMatch?.triggerIndices || [],
  );
  const humanPerlativePronounIndices = new Set<number>(
    context.humanPerlativePronounMatch?.triggerIndices || [],
  );

  let motionDestinationIndices: MotionDestination[] = [];
  const config = LANG_CONFIG[mode];
  const { directionWord, fromTriggers, toTriggers } = config;
  const lowerTokens = fraseTokens.map((t) => t.original.toLowerCase());

  const questionConsumedSet = new Set(
    context.questionMatch?.consumedIndices || [],
  );
  const locativeTriggerSet = new Set(
    context.locativeMatch?.triggerIndices || [],
  );
  const locativeNounSet = new Set(context.locativeMatch?.nounIndices || []);
  const knownVehicleNounSet = new Set(
    context.transportMatch?.isKnownVehicle
      ? context.transportMatch.nounIndices
      : [],
  );
  const personalATriggers = config.hasPersonalA
    ? new Set(["a", ...config.contractionWords])
    : null;

  for (let i = 0; i < fraseTokens.length - 1; i++) {
    if (questionConsumedSet.has(i)) continue;
    if (locativeTriggerSet.has(i)) {
      continue;
    }

    const token = fraseTokens[i];
    const tokenLower = token.original.toLowerCase();

    let goalDirection: MotionGoalDirection = "unknown";
    let isDirectionTrigger = false;

    const textFromHere = lowerTokens.slice(i).join(" ");

    for (const fromTrigger of fromTriggers) {
      if (
        textFromHere.startsWith(fromTrigger + " ") ||
        textFromHere === fromTrigger
      ) {
        goalDirection = "away";
        isDirectionTrigger = true;
        break;
      }
    }
    if (!isDirectionTrigger) {
      for (const toTrigger of toTriggers) {
        if (
          textFromHere.startsWith(toTrigger + " ") ||
          textFromHere === toTrigger
        ) {
          goalDirection = "towards";
          isDirectionTrigger = true;
          break;
        }
      }
    }
    if (!isDirectionTrigger && tokenLower === directionWord) {
      goalDirection = "towards";
      isDirectionTrigger = true;
    }

    if (isDirectionTrigger) {
      const { definiteArticles, pluralArticles } = LANG_CONFIG[mode];
      const allArticles = new Set([...definiteArticles, ...pluralArticles]);

      for (let j = i + 1; j < fraseTokens.length; j++) {
        const t = fraseTokens[j];
        const tLower = t.original.toLowerCase();

        if (allArticles.has(tLower)) {
          continue;
        }
        if (
          t.type === "noun" ||
          t.type === "pronoun" ||
          (t.type === "unknown" && !allArticles.has(tLower))
        ) {
          const alreadyInLocative = locativeNounSet.has(j);
          const alreadyInQuestion = questionConsumedSet.has(j);
          const isKnownVehicle = knownVehicleNounSet.has(j);
          const isPersonalADirection = personalATriggers
            ? personalATriggers.has(tokenLower)
            : false;
          const isHumanObjectAfterTransitiveVerb =
            isTransitive &&
            verbMotionType !== "motion" &&
            verbIdx >= 0 &&
            i > verbIdx &&
            (t.nounMatch?.isHuman === true ||
              (isPersonalADirection && t.type === "unknown"));

          if (
            !alreadyInLocative &&
            !alreadyInQuestion &&
            !isKnownVehicle &&
            !isHumanObjectAfterTransitiveVerb
          ) {
            motionDestinationIndices.push({
              triggerIdx: i,
              nounIdx: j,
              isHuman: t.nounMatch?.isHuman,
              goalDirection,
            });
          }
          break;
        } else if (t.type === "verb") {
          break;
        } else if (t.type === "connector") {
          continue;
        }
      }
    }
  }

  const nonHumanDestinations = motionDestinationIndices.filter(
    (x) => x.isHuman !== true,
  );
  const baseLocativeNounIndices = (
    context.locativeMatch?.nounIndices || []
  ).filter((idx) => {
    const token = fraseTokens[idx];
    return token?.nounMatch?.isHuman !== true;
  });
  const allLocativeNounIndices = [
    ...baseLocativeNounIndices,
    ...nonHumanDestinations.map((x) => x.nounIdx),
  ];
  const allLocativeTriggerIndices = [
    ...(context.locativeMatch?.triggerIndices || []),
    ...nonHumanDestinations.map((x) => x.triggerIdx),
  ];
  const locativeAllIndices = new Set<number>([
    ...allLocativeNounIndices,
    ...allLocativeTriggerIndices,
  ]);
  if (config.hasPersonalA && isTransitive && verbMotionType !== "motion") {
    const personalATriggersSet = new Set(["a", ...config.contractionWords]);
    const mainVerbIdx =
      verbResult?.localIndex ?? fraseTokens.findIndex((t) => t.type === "verb");
    if (mainVerbIdx >= 0) {
      for (let i = mainVerbIdx + 1; i < fraseTokens.length - 1; i++) {
        const token = fraseTokens[i];
        const word = token.original.toLowerCase();
        if (!personalATriggersSet.has(word)) continue;
        const next = fraseTokens[i + 1];
        const isHumanNoun =
          next.type === "noun" && next.nounMatch?.isHuman === true;
        const isUnknownName = next.type === "unknown";
        if (isHumanNoun || isUnknownName) {
          locativeAllIndices.delete(i);
          locativeAllIndices.delete(i + 1);
        }
      }
    }
  }
  const questionIndices = new Set<number>();
  if (context.questionMatch) {
    questionIndices.add(context.questionMatch.questionWordIndex);
    skipLocalIndices.add(context.questionMatch.questionWordIndex);
    if (context.questionMatch.questionWordEndIndex !== undefined) {
      questionIndices.add(context.questionMatch.questionWordEndIndex);
      skipLocalIndices.add(context.questionMatch.questionWordEndIndex);
    }
    if (context.questionMatch.consumedIndices) {
      for (const idx of context.questionMatch.consumedIndices) {
        questionIndices.add(idx);
        skipLocalIndices.add(idx);
      }
    }
  }
  const possessionAllIndices = new Set<number>();
  if (context.possessionMatch) {
    possessionAllIndices.add(context.possessionMatch.possessorIndex);
    possessionAllIndices.add(context.possessionMatch.possessedIndex);
    if (context.possessionMatch.deIndex !== undefined) {
      possessionAllIndices.add(context.possessionMatch.deIndex);
    }
  }
  if (context.possessivePronounMatch) {
    possessionAllIndices.add(context.possessivePronounMatch.pronounIndex);
    possessionAllIndices.add(context.possessivePronounMatch.possessedIndex);
    if (context.possessivePronounMatch.deIndex !== undefined) {
      possessionAllIndices.add(context.possessivePronounMatch.deIndex);
    }
  }
  const allMotionDestIndices = new Set<number>();
  for (const dest of motionDestinationIndices) {
    allMotionDestIndices.add(dest.triggerIdx);
    allMotionDestIndices.add(dest.nounIdx);
  }

  const skipForSubjectsObjects = new Set([
    ...skipLocalIndices,
    ...conWithAllIndices,
    ...comitativePronounIndices,
    ...humanAllativePronounIndices,
    ...humanPerlativePronounIndices,
    ...locativeAllIndices,
    ...possessionAllIndices,
    ...questionIndices,
    ...allMotionDestIndices,
  ]);

  // If an indirect object is explicitly marked with a preposition (e.g. "a mí"),
  // skip clitic OI pronouns ("me/te/le...") to avoid duplicating the same role.
  if (context.indirectObjectMatch?.type === "preposition") {
    const targetPerson = context.indirectObjectMatch.personNumber;
    if (targetPerson) {
      const { indirectObjectClitics } = LANG_CONFIG[mode];
      for (let i = 0; i < fraseTokens.length; i++) {
        const t = fraseTokens[i];
        const word = t.original.toLowerCase();
        if (indirectObjectClitics[word] === targetPerson) {
          skipForSubjectsObjects.add(i);
        }
      }
    }
  }

  const subjectResults = processSubjects(
    fraseTokens,
    mode,
    verbPerson,
    isImperative,
    skipForSubjectsObjects,
    isTransitive,
    skipErgative,
    !!letUsMatch,
  );
  if (mightMatch) {
    const hasExplicitSubject = subjectResults.some((s) => s.type !== "implied");
    const hasImpliedSubject = subjectResults.some((s) => s.type === "implied");
    if (!hasExplicitSubject && !hasImpliedSubject) {
      const personOrder: PersonNumber[] = [
        "1_Sing",
        "2_Sing",
        "3_Sing",
        "1+2_Dual",
        "1+3_Dual",
        "2_Dual",
        "3_Dual",
        "1+2_Plur",
        "1+3_Plur",
        "2_Plur",
        "3_Plur",
      ];
      const targetPersons =
        mightMatch.personNumbers && mightMatch.personNumbers.length > 0
          ? mightMatch.personNumbers
          : personOrder;
      const optionsMap = new Map<string, SubjectOption>();
      for (const personNumber of targetPersons) {
        const pronounOptions = getPronounOptions(
          personNumber,
          hasDualMarker,
          mode,
        );
        for (const option of pronounOptions) {
          const key = `${option.gup}|${option.personNumber}`;
          if (!optionsMap.has(key)) {
            optionsMap.set(key, option);
          }
        }
      }
      const options = Array.from(optionsMap.values());
      if (options.length > 0) {
        const gup = options[0].gup;
        subjectResults.push({
          type: "implied",
          source: `[implied from might]`,
          gup,
          options,
          personNumber: options[0].personNumber,
          explanation: `${LANG_CONFIG[mode].impliedSubjectConjugation} → ${gup}`,
          localIndex: -1,
        });
      }
    }
  }
  if (shouldMatch) {
    const hasExplicitSubject = subjectResults.some((s) => s.type !== "implied");
    const hasImpliedSubject = subjectResults.some((s) => s.type === "implied");
    if (!hasExplicitSubject && !hasImpliedSubject) {
      const personOrder: PersonNumber[] = [
        "1_Sing",
        "2_Sing",
        "3_Sing",
        "1+2_Dual",
        "1+3_Dual",
        "2_Dual",
        "3_Dual",
        "1+2_Plur",
        "1+3_Plur",
        "2_Plur",
        "3_Plur",
      ];
      const targetPersons =
        shouldMatch.personNumbers && shouldMatch.personNumbers.length > 0
          ? shouldMatch.personNumbers
          : personOrder;
      const optionsMap = new Map<string, SubjectOption>();
      for (const personNumber of targetPersons) {
        const pronounOptions = getPronounOptions(
          personNumber,
          hasDualMarker,
          mode,
        );
        for (const option of pronounOptions) {
          const key = `${option.gup}|${option.personNumber}`;
          if (!optionsMap.has(key)) {
            optionsMap.set(key, option);
          }
        }
      }
      const options = Array.from(optionsMap.values());
      if (options.length > 0) {
        const gup = options[0].gup;
        subjectResults.push({
          type: "implied",
          source: `[implied from should]`,
          gup,
          options,
          personNumber: options[0].personNumber,
          explanation: `${LANG_CONFIG[mode].impliedSubjectConjugation} → ${gup}`,
          localIndex: -1,
        });
      }
    }
  }
  const treatAllAsObjects = !hasVerbInFrase && isTransitive;
  const { objects: objectResults, personalAIndices } = processObjects(
    fraseTokens,
    mode,
    skipForSubjectsObjects,
    treatAllAsObjects,
    verbMotionType,
    isTransitive,
    !!modalVerbInfo,
  );

  if (modalVerbInfo) {
    for (const obj of objectResults) {
      if (obj.type === "pronoun") continue;
      if (obj.hasNha) {
        const base = obj.baseGup || obj.source;
        obj.gup = base;
        obj.baseGup = base;
        obj.hasNha = false;
      }
      obj.options = [];
    }
  }

  for (const idx of personalAIndices) {
    skipLocalIndices.add(idx);
  }

  if (modalVerbInfo) {
    skipLocalIndices.add(modalVerbInfo.verbLocalIndex);
  }

  let purposeInfinitiveMatch = earlyPurposeInfinitiveMatch;
  if (purposeInfinitiveMatch && ngarraMatch) {
    purposeInfinitiveMatch = null;
  }

  let objectActionMatch: ObjectActionMatch | null = null;

  let standaloneCopulaOptions: SubjectOption[] = [];
  if (context.copulaMatch?.isStandalone && context.copulaMatch.impliedPerson) {
    standaloneCopulaOptions = getPronounOptions(
      context.copulaMatch.impliedPerson,
      hasDualMarker,
      mode,
    );
  }

  const possessionMatch = context.possessionMatch;
  if (possessionMatch) {
    if (possessionMatch.deIndex !== undefined) {
      skipLocalIndices.add(possessionMatch.deIndex);
    }
  }

  const possessivePronounMatch = context.possessivePronounMatch;
  if (possessivePronounMatch) {
    skipLocalIndices.add(possessivePronounMatch.pronounIndex);
    if (possessivePronounMatch.deIndex !== undefined) {
      skipLocalIndices.add(possessivePronounMatch.deIndex);
    }
  }

  const getVerbalNounOptionsForIndex = (idx: number) => {
    const token = fraseTokens[idx];
    if (!token) return [];
    const matches = findVerbalNounVerbs(token.original, mode);
    return matches.length > 0 ? buildVerbalNounOptions(matches, mode) : [];
  };

  let verbalNounPossession: VerbalNounPossessionMatch | null = null;
  if (possessivePronounMatch) {
    const options = getVerbalNounOptionsForIndex(
      possessivePronounMatch.possessedIndex,
    );
    if (options.length > 0) {
      verbalNounPossession = {
        type: "possessivePronoun",
        possessedIndex: possessivePronounMatch.possessedIndex,
        possessorIndex: possessivePronounMatch.pronounIndex,
        possessorIsPronoun: true,
        possessorIsHuman: true,
        personNumber: possessivePronounMatch.personNumber,
        verbalNounOptions: options,
      };
    }
  } else if (possessionMatch) {
    const options = getVerbalNounOptionsForIndex(
      possessionMatch.possessedIndex,
    );
    if (options.length > 0) {
      const possessorToken = fraseTokens[possessionMatch.possessorIndex];
      let possessorIsHuman: boolean | undefined = undefined;
      if (possessorToken?.type === "noun") {
        possessorIsHuman = possessorToken.nounMatch?.isHuman;
      }
      if (possessorIsHuman !== false) {
        verbalNounPossession = {
          type: "possession",
          possessedIndex: possessionMatch.possessedIndex,
          possessorIndex: possessionMatch.possessorIndex,
          possessorIsPronoun: possessorToken?.type === "pronoun",
          possessorIsHuman,
          verbalNounOptions: options,
        };
      }
    }
  }

  let locativeMatch = context.locativeMatch;
  if (
    locativeMatch &&
    locativeMatch.triggerPhrase === "a" &&
    context.matchedPattern &&
    ["ir_present_a_infinitive", "ir_past_a_infinitive"].includes(
      context.matchedPattern.patternName,
    ) &&
    context.matchedPattern.skipIndices.some((idx) =>
      locativeMatch?.triggerIndices.includes(idx),
    )
  ) {
    locativeMatch = null;
  }
  if (nonHumanDestinations.length > 0) {
    locativeMatch = {
      triggerPhrase: locativeMatch?.triggerPhrase || "a",
      triggerIndices: allLocativeTriggerIndices,
      nounIndices: allLocativeNounIndices,
      verbIndices: locativeMatch?.verbIndices,
      reinforcer: locativeMatch?.reinforcer || null,
      explanation: locativeMatch?.explanation || "",
      suffixType: locativeMatch?.suffixType || "ngura",
    };
  }
  if (
    locativeMatch &&
    locativeMatch.triggerPhrase === "a" &&
    personalAIndices.length > 0
  ) {
    const personalASet = new Set(personalAIndices);
    const keptTriggers = locativeMatch.triggerIndices.filter(
      (idx) => !personalASet.has(idx),
    );
    if (keptTriggers.length === 0) {
      locativeMatch = null;
    } else {
      let keptNouns = locativeMatch.nounIndices;
      if (keptNouns && keptNouns.length > 0) {
        const removedNouns = new Set(
          locativeMatch.triggerIndices
            .filter((idx) => personalASet.has(idx))
            .map((idx) => idx + 1),
        );
        keptNouns = keptNouns.filter((idx) => !removedNouns.has(idx));
      }
      locativeMatch = {
        ...locativeMatch,
        triggerIndices: keptTriggers,
        nounIndices: keptNouns,
      };
    }
  }

  const objectActionSkipIndices = new Set(skipLocalIndices);
  if (locativeMatch?.verbIndices) {
    for (const idx of locativeMatch.verbIndices) {
      objectActionSkipIndices.add(idx);
    }
  }
  if (purposeInfinitiveMatch?.infinitiveIndex !== undefined) {
    objectActionSkipIndices.add(purposeInfinitiveMatch.infinitiveIndex);
  }
  objectActionMatch = detectObjectActionPattern(
    fraseTokens,
    objectResults,
    mode,
    verbResult?.localIndex ?? null,
    objectActionSkipIndices,
  );
  for (const dest of motionDestinationIndices) {
    skipLocalIndices.add(dest.triggerIdx);
  }
  if (locativeMatch) {
    for (const idx of locativeMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
    if (locativeMatch.verbIndices) {
      const config = LANG_CONFIG[mode];
      const isCauseTrigger = causeTriggerSet.has(
        normalizeCause(locativeMatch.triggerPhrase),
      );
      for (const idx of locativeMatch.verbIndices) {
        skipLocalIndices.add(idx);
      }
      if (isCauseTrigger && locativeMatch.triggerIndices.length > 0) {
        const auxiliarySet = new Set(
          config.copulaVerbs.map((w) => normalizeCause(w)),
        );
        if (mode === "es") {
          for (const w of [...HABER_AUXILIARY_FORMS_ES, "haber", "sido"]) {
            auxiliarySet.add(normalizeCause(w));
          }
        } else {
          for (const w of ["have", "has", "had", "having"]) {
            auxiliarySet.add(normalizeCause(w));
          }
        }
        const lastTriggerIdx = Math.max(...locativeMatch.triggerIndices);
        for (let i = lastTriggerIdx + 1; i < fraseTokens.length; i++) {
          const token = fraseTokens[i];
          if (token?.type !== "verb") continue;
          const tokenWord = token.original ?? "";
          if (auxiliarySet.has(normalizeCause(tokenWord))) {
            skipLocalIndices.add(i);
          }
        }
      }
    }
    if (locativeMatch.nounIndices && locativeMatch.nounIndices.length > 0) {
      const articleLike = new Set([
        "de",
        "del",
        "al",
        "of",
        "the",
        "a",
        "an",
        "el",
        "la",
        "los",
        "las",
      ]);
      for (const nounIdx of locativeMatch.nounIndices) {
        const prevIdx = nounIdx - 1;
        if (prevIdx >= 0) {
          const prev = fraseTokens[prevIdx].original.toLowerCase();
          if (articleLike.has(prev)) {
            skipLocalIndices.add(prevIdx);
          }
        }
      }
    }
  }

  const conWithMatch = context.conWithMatch;
  if (conWithMatch) {
    for (const idx of conWithMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const instrumentalMatch = context.instrumentalMatch;
  if (instrumentalMatch) {
    for (const idx of instrumentalMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const belongingMatch = context.belongingMatch;
  if (belongingMatch) {
    for (const idx of belongingMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const transportMatch = context.transportMatch;
  if (transportMatch) {
    for (const idx of transportMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const comitativePronounMatch = context.comitativePronounMatch;
  if (comitativePronounMatch) {
    for (const idx of comitativePronounMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const humanAllativePronounMatch = context.humanAllativePronounMatch;
  if (humanAllativePronounMatch) {
    for (const idx of humanAllativePronounMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const humanAblativePronounMatch = context.humanAblativePronounMatch;
  if (humanAblativePronounMatch) {
    for (const idx of humanAblativePronounMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }
  const humanPerlativePronounMatch = context.humanPerlativePronounMatch;
  if (humanPerlativePronounMatch) {
    for (const idx of humanPerlativePronounMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const sourceOriginPronounMatch = context.sourceOriginPronounMatch;
  if (sourceOriginPronounMatch) {
    for (const idx of sourceOriginPronounMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const causePronounMatch = context.causePronounMatch;
  if (causePronounMatch) {
    for (const idx of causePronounMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const causativeAgentMatch = context.causativeAgentMatch;
  if (causativeAgentMatch) {
    for (const idx of causativeAgentMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const purposePronounMatch = context.purposePronounMatch;
  if (purposePronounMatch) {
    for (const idx of purposePronounMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const locativeCopulaMatch = context.locativeCopulaMatch;
  const indirectObjectMatch = context.indirectObjectMatch;
  if (indirectObjectMatch) {
    skipLocalIndices.add(indirectObjectMatch.triggerIndex);
    if (indirectObjectMatch.nounIndex !== null) {
      skipLocalIndices.add(indirectObjectMatch.nounIndex);
    }
  }

  const timesMatch = detectTimesPattern(fraseTokens, mode);
  if (timesMatch) {
    for (const idx of timesMatch.consumedIndices) {
      skipLocalIndices.add(idx);
    }
  }

  if (habitualMatch) {
    for (const idx of habitualMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  if (pastHabitualAuxMatch) {
    for (const idx of pastHabitualAuxMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  if (thatTimeMatch) {
    for (const idx of thatTimeMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const relativeClauseMatch = detectRelativeClausePattern(fraseTokens, mode);
  if (relativeClauseMatch) {
    for (const idx of relativeClauseMatch.consumedIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const djalVerbMatch = detectDjalVerbPattern(fraseTokens, mode);
  if (djalVerbMatch) {
    for (const idx of djalVerbMatch.consumedIndices) {
      skipLocalIndices.add(idx);
    }
  }

  let locativeVerbResults: LocativeVerbResult[] = [];
  if (locativeCopulaMatch) {
    const fraseTokenStrings = fraseTokens.map((t) => t.original);
    locativeVerbResults = generateLocativeVerbResults(
      locativeCopulaMatch,
      fraseTokenStrings,
      mode,
    );
  }

  let motionDirection: MotionDirection = null;
  const directionTriggerIndices: number[] = [];
  const {
    directionAwayTriggers,
    directionTowardsTriggers,
    directionAwayVerbs,
    directionTowardsVerbs,
  } = LANG_CONFIG[mode];

  const tokenLowers = fraseTokens.map((t) => t.original.toLowerCase());

  const findTriggerIndices = (triggers: string[]): number[] => {
    const sortedTriggers = [...triggers].sort(
      (a, b) => b.split(" ").length - a.split(" ").length,
    );
    for (const trigger of sortedTriggers) {
      const triggerWords = trigger.split(" ");
      for (let i = 0; i <= tokenLowers.length - triggerWords.length; i++) {
        let matches = true;
        for (let j = 0; j < triggerWords.length; j++) {
          if (tokenLowers[i + j] !== triggerWords[j]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const indices: number[] = [];
          for (let j = 0; j < triggerWords.length; j++) {
            indices.push(i + j);
          }
          return indices;
        }
      }
    }
    return [];
  };

  const towardsIndices = findTriggerIndices(directionTowardsTriggers);
  if (towardsIndices.length > 0) {
    motionDirection = "towards";
    directionTriggerIndices.push(...towardsIndices);
  }

  if (!motionDirection) {
    const awayIndices = findTriggerIndices(directionAwayTriggers);
    if (awayIndices.length > 0) {
      motionDirection = "away";
      directionTriggerIndices.push(...awayIndices);
    }
  }

  if (!motionDirection) {
    for (let i = 0; i < fraseTokens.length; i++) {
      const tokenWord = fraseTokens[i].original.toLowerCase();
      if (directionTowardsVerbs.includes(tokenWord)) {
        motionDirection = "towards";
        break;
      }
      if (directionAwayVerbs.includes(tokenWord)) {
        motionDirection = "away";
        break;
      }
    }
  }

  const qType = context.questionMatch?.type;
  if (qType === "where_to" || qType === "where_from") {
    motionDirection = null;
  }

  if (purposeInfinitiveMatch?.hasAlternativePattern) {
    motionDirection = null;
  }

  for (const idx of directionTriggerIndices) {
    skipLocalIndices.add(idx);
  }

  return {
    fraseTokens,
    globalIndices,
    context,
    skipLocalIndices,
    mode,
    verbResult,
    subjectResults,
    objectResults,
    hasDualMarker,
    isTransitive,
    verbMotionType,
    modalVerbInfo,
    standaloneCopulaOptions,
    possessionMatch,
    possessivePronounMatch,
    mirriMiriwMatch,
    locativeMatch,
    causativeAgentMatch: context.causativeAgentMatch,
    conWithMatch,
    instrumentalMatch: context.instrumentalMatch,
    transportMatch: context.transportMatch,
    comitativePronounMatch,
    humanAllativePronounMatch,
    humanAblativePronounMatch,
    humanPerlativePronounMatch,
    sourceOriginPronounMatch,
    causePronounMatch,
    purposePronounMatch,
    locativeCopulaMatch,
    indirectObjectMatch,
    timesMatch,
    habitualMatch,
    pastHabitualAuxMatch,
    mightMatch,
    shouldMatch,
    thatTimeMatch,
    relativeClauseMatch,
    djalVerbMatch,
    purposeInfinitiveMatch,
    infinitiveAgentMatch,
    locativeVerbMatch,
    becomeAdjectiveMatch: effectiveBecomeAdjectiveMatch,
    makeAdjectiveMatch,
    letUsMatch,
    ngarraMatch,
    mindIfMatch,
    locativeVerbResults,
    motionDestinations: motionDestinationIndices,
    motionDirection,
    directionTriggerIndices,
    hasIrPatternWithPurpose,
    isAmbiguousIrSer,
    emotionMatch,
    pointingInfo,
    objectActionMatch,
    verbalNounPossession,
  };
}

function generateSubjectAlternatives(
  subjectResults: SubjectResult[],
): SubjectResult[][] {
  if (subjectResults.length === 0) return [[]];

  const hasAlternatives = subjectResults.some((s) => s.options.length > 1);
  if (!hasAlternatives) return [subjectResults];

  let alternatives: SubjectResult[][] = [[]];

  for (const subject of subjectResults) {
    const newAlternatives: SubjectResult[][] = [];

    if (subject.options.length > 1) {
      for (const alt of alternatives) {
        for (const option of subject.options) {
          newAlternatives.push([
            ...alt,
            {
              ...subject,
              gup: option.gup,
              explanation: option.explanation || subject.explanation,
              personNumber: option.personNumber || subject.personNumber,
            },
          ]);
        }
      }
    } else {
      for (const alt of alternatives) {
        newAlternatives.push([...alt, subject]);
      }
    }

    alternatives = newAlternatives;
  }

  return alternatives;
}

function generateObjectAlternatives(
  objectResults: ObjectResult[],
): ObjectResult[][] {
  if (objectResults.length === 0) return [[]];

  const hasAlternatives = objectResults.some((o) => o.options.length > 1);
  if (!hasAlternatives) return [objectResults];

  let alternatives: ObjectResult[][] = [[]];

  for (const obj of objectResults) {
    const newAlternatives: ObjectResult[][] = [];

    if (obj.options.length > 1) {
      for (const alt of alternatives) {
        for (const option of obj.options) {
          newAlternatives.push([
            ...alt,
            {
              ...obj,
              gup: option.gup,
              explanation: option.explanation || obj.explanation,
              pronounTypes: option.pronounType
                ? [option.pronounType]
                : obj.pronounTypes,
            },
          ]);
        }
      }
    } else {
      for (const alt of alternatives) {
        newAlternatives.push([...alt, obj]);
      }
    }

    alternatives = newAlternatives;
  }

  return alternatives;
}

function generateCopulaSubjectAlternatives(
  ctx: FraseProcessingContext,
): CopulaSubjectChoice[] {
  const { context, subjectResults, fraseTokens, mode, hasDualMarker } = ctx;
  const copulaMatch = context.copulaMatch;

  if (!copulaMatch || copulaMatch.impliedPerson === null)
    return [{ gup: "", explanation: "" }];

  if (context.questionMatch && context.questionMatch.type === "where") {
    const consumedByPattern = new Set(
      context.questionMatch.consumedIndices || [],
    );
    const hasNounAfterCopula = fraseTokens.some(
      (t, i) =>
        i > copulaMatch.copulaIndex &&
        !consumedByPattern.has(i) &&
        (t.type === "noun" || t.type === "unknown"),
    );
    if (hasNounAfterCopula) {
      return [{ gup: "", explanation: "" }];
    }
  }

  const hasMatchingSubject = subjectResults.some(
    (s) => s.personNumber === copulaMatch.impliedPerson,
  );
  if (hasMatchingSubject) return [{ gup: "", explanation: "" }];

  const options = getPronounOptions(
    copulaMatch.impliedPerson,
    hasDualMarker,
    mode,
  );
  if (options.length === 0) return [{ gup: "", explanation: "" }];

  const config = LANG_CONFIG[mode];
  return options.map((opt) => ({
    gup: opt.gup,
    explanation: `${config.impliedSubjectFrom} "${copulaMatch.copulaWord}" → ${opt.gup} (${opt.explanation})`,
    personNumber: opt.personNumber,
  }));
}

function generateConWithAlternatives(
  ctx: FraseProcessingContext,
): UnknownConWithChoice[] {
  const {
    conWithMatch,
    fraseTokens,
    subjectResults,
    objectResults,
    skipLocalIndices,
  } = ctx;

  if (!conWithMatch) return [null];

  const subjectIndices = new Set(subjectResults.map((s) => s.localIndex));
  const objectIndices = new Set(objectResults.map((o) => o.localIndex));

  for (const localIdx of conWithMatch.nounIndices) {
    if (skipLocalIndices.has(localIdx)) continue;
    const token = fraseTokens[localIdx];
    if (subjectIndices.has(localIdx)) continue;
    if (objectIndices.has(localIdx)) continue;

    const gupWord = token.gupKey || token.original;
    const humanSuffixes = determineHumanAssociativeSuffix(gupWord);

    if (token.type === "unknown") {
      const alternatives: UnknownConWithChoice[] = [];
      for (const suffix of humanSuffixes) {
        alternatives.push({ type: "human", suffix });
      }
      alternatives.push({ type: "nonhuman" });
      alternatives.push({ type: "instrumental" });
      return alternatives;
    }

    if (token.type === "noun" && token.nounMatch?.isHuman === true) {
      if (humanSuffixes.length > 1) {
        const alternatives: UnknownConWithChoice[] = [];
        for (const suffix of humanSuffixes) {
          alternatives.push({ type: "human", suffix });
        }
        return alternatives;
      }
      return [null];
    }

    if (token.type === "noun") {
      return [null];
    }
  }

  return [null];
}

function generateLocativeAlternatives(
  ctx: FraseProcessingContext,
): UnknownLocativeChoice[] {
  const {
    locativeMatch,
    fraseTokens,
    subjectResults,
    objectResults,
    skipLocalIndices,
  } = ctx;

  if (!locativeMatch) return [null];

  const subjectSources = new Set(
    subjectResults.map((s) => s.source.toLowerCase()),
  );
  const objectSources = new Set(
    objectResults.map((o) => o.source.toLowerCase()),
  );

  for (const localIdx of locativeMatch.nounIndices) {
    if (skipLocalIndices.has(localIdx)) continue;
    const token = fraseTokens[localIdx];
    if (subjectSources.has(token.original.toLowerCase())) continue;
    if (objectSources.has(token.original.toLowerCase())) continue;

    const gupWord = token.gupKey || token.original;
    const humanSuffixes = determineHumanAssociativeSuffix(gupWord);

    if (token.type === "noun" && token.nounMatch?.isPlace === true) {
      return [null];
    }

    if (token.type === "noun" && token.nounMatch?.isHuman === true) {
      const suffixes = determineHumanAssociativeSuffix(gupWord);
      if (suffixes.length > 1) {
        return suffixes.map((suffix) => ({ type: "human" as const, suffix }));
      }
      return [null];
    }

    if (token.type === "noun") {
      return [null];
    }

    if (token.type === "unknown") {
      const alternatives: UnknownLocativeChoice[] = [];
      alternatives.push({ type: "place" });
      for (const suffix of humanSuffixes) {
        alternatives.push({ type: "human", suffix });
      }
      alternatives.push({ type: "nonhuman" });
      return alternatives;
    }
  }

  return [null];
}

function generateMotionDestinationAlternatives(
  ctx: FraseProcessingContext,
): UnknownConWithChoice[] {
  const { motionDestinations, fraseTokens } = ctx;

  if (!motionDestinations || motionDestinations.length === 0) return [null];

  for (const dest of motionDestinations) {
    const token = fraseTokens[dest.nounIdx];
    if (!token) continue;

    if (token.nounMatch?.isPlace === true) {
      return [null];
    }

    if (dest.isHuman === true) {
      const gupWord = token.gupKey || token.original;
      const humanSuffixes = determineHumanAssociativeSuffix(gupWord);
      if (humanSuffixes.length > 1) {
        return humanSuffixes.map((suffix) => ({
          type: "human" as const,
          suffix,
        }));
      }
      return [null];
    }

    if (token.type === "noun") {
      return [null];
    }

    if (token.type === "unknown") {
      const gupWord = token.gupKey || token.original;
      const humanSuffixes = determineHumanAssociativeSuffix(gupWord);
      const alternatives: UnknownConWithChoice[] = [];
      for (const suffix of humanSuffixes) {
        alternatives.push({ type: "human", suffix });
      }
      alternatives.push({ type: "nonhuman" });
      return alternatives;
    }
  }

  return [null];
}

function processVerb(
  fraseTokens: Token[],
  context: FraseContext,
  originalText: string,
  mode: LanguageMode,
  hasSubject: boolean,
  overrideVerbIndex?: number,
  letUsMatch?: LetUsMatch | null,
  treatInfinitiveAsFinite: boolean = false,
  forceSameDayFuture: boolean = false,
): { results: VerbRuleResult[]; localIndex: number } | null {
  const matchedVerbLocalIdx =
    overrideVerbIndex ?? context.matchedPattern?.mainVerbIndex;
  const firstVerbWithMatch = fraseTokens.findIndex(
    (t) => t.type === "verb" && !!t.verbMatch,
  );
  const firstVerb = fraseTokens.findIndex((t) => t.type === "verb");
  const mainVerbLocalIdx =
    matchedVerbLocalIdx ??
    (firstVerbWithMatch !== -1 ? firstVerbWithMatch : firstVerb);

  if (mainVerbLocalIdx === -1) return null;

  if (context.questionMatch?.consumedIndices?.includes(mainVerbLocalIdx)) {
    return null;
  }

  const verbToken = fraseTokens[mainVerbLocalIdx];
  if (!verbToken.verbMatch) return null;

  const patternTense = context.matchedPattern?.tense || null;
  const patternContinuous = context.matchedPattern?.isContinuous || false;

  const results = applyVerbRules(
    verbToken.verbMatch,
    fraseTokens.map((t) => t.original),
    originalText,
    mode,
    patternTense,
    patternContinuous,
    hasSubject,
    !!letUsMatch,
    treatInfinitiveAsFinite,
    forceSameDayFuture,
  );

  return { results, localIndex: mainVerbLocalIdx };
}

function buildParts(
  ctx: FraseProcessingContext,
  modalSuffixCombo: DjalSuffixType[] = [],
  locativeVerbChoice: LocativeVerbResult | null = null,
  questionOutputOverride: string | null = null,
  verbAltOverride: VerbRuleResult | null = null,
  emotionVerbOverride: VerbRuleResult | null = null,
): TranslationPart[] {
  const parts: TranslationPart[] = [];
  const skipLocalIndices = new Set(ctx.skipLocalIndices);
  ctx = { ...ctx, skipLocalIndices };
  const emphaticSkip = detectEmphaticSubjectTriggers(
    ctx.fraseTokens,
    ctx.mode,
  );
  for (const idx of emphaticSkip.skipIndices) {
    skipLocalIndices.add(idx);
  }
  const questionConsumedSet = new Set(
    ctx.context.questionMatch?.consumedIndices || [],
  );
  const isIrPattern =
    ctx.context.matchedPattern?.patternName === "ir_present_a_infinitive" ||
    ctx.context.matchedPattern?.patternName === "ir_past_a_infinitive";
  const shouldUseIrLiteral =
    isIrPattern && ctx.irPatternAlternative === "use-literal";
  const verbAltOverrideForStandard = shouldUseIrLiteral
    ? null
    : verbAltOverride;
  let objectActionPart: TranslationPart | null = null;
  const applyPerlativeIfMissing = () => {
    const effectiveLocative = ctx.locativeMatch || ctx.context.locativeMatch;
    if (!effectiveLocative || effectiveLocative.suffixType !== "perlative")
      return;

    const config = LANG_CONFIG[ctx.mode];
    const negationWords = getNegationWords(ctx.mode);
    const hasNegation = ctx.fraseTokens.some((t) =>
      negationWords.includes(t.original.toLowerCase()),
    );

    const alreadyApplied = new Set<number>();
    for (const part of parts) {
      if (
        part.globalIndex !== undefined &&
        part.globalIndex >= 0 &&
        typeof part.explanation === "string" &&
        part.explanation.includes(config.perlativeLabel)
      ) {
        alreadyApplied.add(part.globalIndex);
      }
    }

    const applyPerlativeToIndex = (
      localIdx: number,
      forceHuman?: boolean,
      forceNonHuman?: boolean,
    ) => {
      const globalIdx = ctx.globalIndices[localIdx] ?? -1;
      if (globalIdx < 0 || alreadyApplied.has(globalIdx)) return;

      const token = ctx.fraseTokens[localIdx];
      if (!token || token.type === "pronoun") return;

      const baseGup = token.gupKey || token.original;
      const forcedLocative: LocativeMatch = {
        ...effectiveLocative,
        nounIndices: [localIdx],
      };
      const suffixResult = applySuffixBasedOnContext({
        baseGup,
        localIdx,
        mode: ctx.mode,
        mirriMiriwMatch: ctx.mirriMiriwMatch,
        locativeMatch: forcedLocative,
        causativeAgentMatch: ctx.causativeAgentMatch,
        conWithMatch: ctx.conWithMatch,
        instrumentalMatch: ctx.instrumentalMatch,
        belongingMatch: ctx.context.belongingMatch || null,
        transportMatch: ctx.transportMatch,
        isHuman: forceHuman
          ? true
          : forceNonHuman
            ? false
            : token.nounMatch?.isHuman,
        isCause: token.nounMatch?.isCause,
        isPlace: token.nounMatch?.isPlace,
        unknownConWithChoice: ctx.unknownConWithChoice,
        unknownLocativeChoice: ctx.unknownLocativeChoice,
        hasNegation,
        verbMotionType: ctx.verbMotionType,
        motionDestinations: ctx.motionDestinations,
        motionDestinationChoice: ctx.motionDestinationChoice,
        mirriAlternative: ctx.mirriAlternative,
      });

      if (
        suffixResult.gup === baseGup &&
        !suffixResult.suffix &&
        (!suffixResult.alternatives || suffixResult.alternatives.length === 0)
      ) {
        return;
      }

      const existingPart = parts.find((p) => p.globalIndex === globalIdx);
      if (existingPart) {
        existingPart.gup = suffixResult.gup;
        existingPart.baseGup = baseGup;
        existingPart.appliedSuffix = suffixResult.suffix;
        existingPart.explanation = suffixResult.explanation;
        existingPart.suffixAlternatives = suffixResult.alternatives;
        existingPart.isHuman = forceHuman ? true : token.nounMatch?.isHuman;
      } else {
        parts.push({
          type:
            token.type === "adjective"
              ? "adjective"
              : token.type === "noun"
                ? "noun"
                : "unknown",
          source: token.original,
          gup: suffixResult.gup,
          baseGup,
          appliedSuffix: suffixResult.suffix,
          explanation: suffixResult.explanation,
          suffixAlternatives: suffixResult.alternatives,
          globalIndex: globalIdx,
          isHuman: forceHuman ? true : token.nounMatch?.isHuman,
          isKnownNoun: token.type === "noun",
          isPlural: token.nounMatch?.isPlural,
          irregularPlurals: token.nounMatch?.irregularPlurals,
        });
      }
    };

    for (const localIdx of effectiveLocative.nounIndices || []) {
      applyPerlativeToIndex(localIdx);
    }

    if (ctx.possessionMatch) {
      const lastTrigger = effectiveLocative.triggerIndices.length
        ? Math.max(...effectiveLocative.triggerIndices)
        : -1;
      const { possessorIndex, possessedIndex } = ctx.possessionMatch;
      if (possessorIndex > lastTrigger && possessedIndex > lastTrigger) {
        applyPerlativeToIndex(possessedIndex, false, true);
        applyPerlativeToIndex(possessorIndex, true, false);
      }
    }
  };

  const effectiveLocativeMatch =
    ctx.locativeMatch || ctx.context.locativeMatch;
  const hasCauseTriggerForPossession =
    effectiveLocativeMatch?.suffixType === "ergative" &&
    LANG_CONFIG[ctx.mode].causeTriggers.some(
      (t) =>
        normalizeToken(t) ===
        normalizeToken(effectiveLocativeMatch.triggerPhrase),
    );
  const hasLiteralDhuwala = ctx.fraseTokens.some((t) => {
    const original = normalizeToken(t.original);
    const gup = t.gupKey ? normalizeToken(t.gupKey) : "";
    return (
      original === "dhuwala" ||
      original === "dhuwali" ||
      gup === "dhuwala" ||
      gup === "dhuwali"
    );
  });
  const hasSpecialPossessiveNguContext =
    !!ctx.djalVerbMatch ||
    !!ctx.context.copulaMatch ||
    hasLiteralDhuwala ||
    hasCauseTriggerForPossession;

  const buildNguPossessiveOptionsFromBase = (baseGup: string) => {
    const options: { gup: string; suffix: string; explanation: string }[] = [];
    const seen = new Set<string>();
    const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
    for (const hs of humanSuffixes) {
      const humanBase = applyHumanAssociativeSuffix(baseGup, hs) + "ŋu";
      const possSuffixes = determinePossessiveSuffix(
        humanBase,
        ctx.mode,
      ).suffixes;
      for (const ps of possSuffixes) {
        const gup = applyPossessiveSuffix(humanBase, ps);
        if (seen.has(gup)) continue;
        seen.add(gup);
        options.push({
          gup,
          suffix: `${hs}ŋu${ps}`,
          explanation: `${baseGup} + -${hs}ŋu + -${ps} = ${gup} (${LANG_CONFIG[ctx.mode].possessor})`,
        });
      }
    }
    return options;
  };

  const buildNguPossessiveFormsFromPronouns = (forms: string[]) => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const form of forms) {
      const base = `${form}ŋu`;
      const possSuffixes = determinePossessiveSuffix(base, ctx.mode).suffixes;
      for (const ps of possSuffixes) {
        const gup = applyPossessiveSuffix(base, ps);
        if (seen.has(gup)) continue;
        seen.add(gup);
        out.push(gup);
      }
    }
    return out;
  };

  const normalizeWord = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const nonSubjectWords = (() => {
    const words: string[] = [
      ...LANG_CONFIG[ctx.mode].connectors,
      ...LANG_CONFIG[ctx.mode].skipWords,
      ...LANG_CONFIG[ctx.mode].definiteArticles,
      ...LANG_CONFIG[ctx.mode].pluralArticles,
      ...(LANG_CONFIG[ctx.mode].locativeTriggers || []),
      ...(LANG_CONFIG[ctx.mode].locativeVerbTriggers || []),
      ...(LANG_CONFIG[ctx.mode].allativeVerbTriggers || []),
      ...(LANG_CONFIG[ctx.mode].ablativeVerbTriggers || []),
      ...(LANG_CONFIG[ctx.mode].perlativeVerbTriggers || []),
      ...(LANG_CONFIG[ctx.mode].perlativeTimeTriggers || []),
      ...(LANG_CONFIG[ctx.mode].causeTriggers || []),
      ...(LANG_CONFIG[ctx.mode].causativeAgentTriggers || []),
      ...(LANG_CONFIG[ctx.mode].conWithTriggers || []),
      ...(LANG_CONFIG[ctx.mode].instrumentalTriggers || []),
      ...(LANG_CONFIG[ctx.mode].belongingTriggers || []),
      ...(LANG_CONFIG[ctx.mode].transportTriggers || []),
      ...(LANG_CONFIG[ctx.mode].aboutTriggers || []),
      ...(LANG_CONFIG[ctx.mode].purposeConnectors || []),
      ...Object.keys(LANG_CONFIG[ctx.mode].questionWordMap || {}),
    ];
    return new Set(words.map(normalizeWord));
  })();
  const isSubjectLikeToken = (token?: Token): boolean => {
    if (!token) return false;
    if (token.type === "noun" || token.type === "pronoun") return true;
    if (token.type === "unknown") {
      const norm = normalizeWord(token.original);
      return !nonSubjectWords.has(norm);
    }
    return false;
  };
  const buildImpliedSubjectPartForVerb = (
    verbIdx: number,
  ): TranslationPart | null => {
    const verbToken = ctx.fraseTokens[verbIdx];
    const verbPerson = verbToken?.verbMatch?.person;
    if (verbPerson === undefined || verbPerson === null) return null;
    const impliedPersonNumber = getImpliedPersonNumber(verbPerson);
    if (!impliedPersonNumber) return null;
    const options = getPronounOptions(
      impliedPersonNumber,
      ctx.hasDualMarker,
      ctx.mode,
    );
    if (!options || options.length === 0) return null;
    const gup = options[0].gup;
    const isVerbTransitive = verbToken?.verbMatch?.entry?.vtr ?? false;
    const role: GrammaticalRole = isVerbTransitive
      ? "subject_transitive"
      : "subject_intransitive";
    const globalIndex = ctx.globalIndices[verbIdx] ?? -1;
    const alreadyInserted = parts.some(
      (p) =>
        p.type === "subject" &&
        typeof p.source === "string" &&
        p.source.startsWith("[implied") &&
        p.globalIndex === globalIndex,
    );
    if (alreadyInserted) return null;
    return {
      type: "subject",
      source: "[implied from verb]",
      gup,
      explanation: `${LANG_CONFIG[ctx.mode].impliedSubjectConjugation} → ${gup}`,
      globalIndex,
      role,
    };
  };
  const hasSubjectLikeBeforeVerb = (verbIdx: number): boolean => {
    for (let i = verbIdx - 1; i >= 0; i--) {
      if (skipLocalIndices.has(i)) continue;
      if (isSubjectLikeToken(ctx.fraseTokens[i])) return true;
    }
    return false;
  };
  const maybeInsertImpliedSubjectForVerb = (verbIdx: number) => {
    if (hasSubjectLikeBeforeVerb(verbIdx)) return;
    const impliedPart = buildImpliedSubjectPartForVerb(verbIdx);
    if (impliedPart) parts.push(impliedPart);
  };

  if (ctx.objectActionMatch && ctx.objectActionAlternative !== "ignore") {
    const verbToken = ctx.fraseTokens[ctx.objectActionMatch.verbIndex];
    const verbEntry = verbToken?.verbMatch?.entry;
    if (verbEntry) {
      for (const idx of ctx.objectActionMatch.triggerIndices) {
        skipLocalIndices.add(idx);
      }
      skipLocalIndices.add(ctx.objectActionMatch.verbIndex);
    }
  }

  if (
    ctx.makeAdjectiveMatch &&
    ctx.makeAdjectiveAlternative === "use-pattern"
  ) {
    const mam = ctx.makeAdjectiveMatch;
    const exceptionForm = MAKE_ADJ_EXCEPTIONS[mam.adjectiveGup];

    if (exceptionForm) {
      const suffixes = determineMakeAdjSuffix(mam.adjectiveGup);
      const regularAlternatives = suffixes.map((s) => ({
        gup: applyMakeAdjSuffix(mam.adjectiveGup, s),
        suffix: s,
        explanation: `${mam.adjectiveGup} + -${s} (forma regular)`,
      }));

      const resultParts: TranslationPart[] = [
        {
          type: "verb",
          source: `${mam.verbWord} ${mam.adjectiveWord}`,
          gup: exceptionForm,
          explanation: `"${mam.verbWord} ${mam.adjectiveWord}" → ${exceptionForm} (excepción)`,
          globalIndex: -1,
          suffixAlternatives: regularAlternatives,
        },
      ];
      applyPerlativeIfMissing();
      return resultParts;
    } else {
      const suffixes = determineMakeAdjSuffix(mam.adjectiveGup);
      const primarySuffix = suffixes[0];
      const gupWithSuffix = applyMakeAdjSuffix(mam.adjectiveGup, primarySuffix);

      const alternatives =
        suffixes.length > 1
          ? suffixes.slice(1).map((s) => ({
              gup: applyMakeAdjSuffix(mam.adjectiveGup, s),
              suffix: s,
              explanation: `${mam.adjectiveGup} + -${s}`,
            }))
          : undefined;

      const resultParts: TranslationPart[] = [
        {
          type: "verb",
          source: `${mam.verbWord} ${mam.adjectiveWord}`,
          gup: gupWithSuffix,
          explanation: `"${mam.verbWord} ${mam.adjectiveWord}" → ${gupWithSuffix} (make + adj)`,
          globalIndex: -1,
          suffixAlternatives: alternatives,
        },
      ];
      applyPerlativeIfMissing();
      return resultParts;
    }
  }

  if (ctx.mirriAlternative?.type === "subject-possessive") {
    const possessiveGup = ctx.mirriAlternative.possessiveForm;
    const subjectLocalIndex = ctx.mirriAlternative.subjectLocalIndex;

    if (subjectLocalIndex === -1 && ctx.mirriMiriwMatch?.personNumber) {
      parts.push({
        type: "subject",
        source: ctx.mirriMiriwMatch.triggerPhrase,
        gup: possessiveGup,
        explanation: `"${
          ctx.mirriMiriwMatch.triggerPhrase
        }" → ${possessiveGup} (${LANG_CONFIG[ctx.mode].possessive})`,
        globalIndex:
          ctx.globalIndices[ctx.mirriMiriwMatch.triggerIndices[0]] || 0,
        role: "subject_intransitive" as GrammaticalRole,
        isHuman: true,
      });
    } else if (subjectLocalIndex >= 0) {
      const originalSubject = ctx.subjectResults.find(
        (s) => s.localIndex === subjectLocalIndex,
      );
      if (originalSubject) {
        parts.push({
          type: "subject",
          source: originalSubject.source,
          gup: possessiveGup,
          explanation: `"${originalSubject.source}" → ${possessiveGup} (${
            LANG_CONFIG[ctx.mode].possessive
          })`,
          globalIndex: ctx.globalIndices[subjectLocalIndex] || 0,
          role: "subject_intransitive" as GrammaticalRole,
          isHuman: originalSubject.isHuman,
        });
      }
    }
  }

  if (ctx.context.questionMatch) {
    const qm = ctx.context.questionMatch;
    let gupOutput =
      questionOutputOverride ||
      (qm.isComplexPattern && qm.patternOutput ? qm.patternOutput : qm.gup);
    if (
      qm.isComplexPattern &&
      ctx.copulaSubjectChoice?.gup &&
      !questionOutputOverride &&
      !qm.hasExplicitSubject
    ) {
      const outputParts = gupOutput.split(" ");
      outputParts.splice(1, 0, ctx.copulaSubjectChoice.gup);
      gupOutput = outputParts.join(" ");
    }
    const finalGup = gupOutput.replace(/\s*\?\s*$/, "");
    parts.push({
      type: "particle",
      source: ctx.fraseTokens[qm.questionWordIndex]?.original || qm.type,
      gup: finalGup,
      explanation: qm.explanation,
      globalIndex: ctx.globalIndices[qm.questionWordIndex] ?? -1,
    });
    if (qm.subjectInfo) {
      parts.push({
        type: "subject",
        source: qm.subjectInfo.source,
        gup: qm.subjectInfo.gup,
        explanation: `${qm.subjectInfo.source} → ${qm.subjectInfo.gup}`,
        globalIndex: -1,
        isPlural: qm.subjectInfo.isPlural,
        isHuman: qm.subjectInfo.isHuman,
        isKnownNoun: qm.subjectInfo.isKnownNoun,
      });
    }
  }

  buildCopulaParts(ctx, parts);

  if (ctx.objectActionMatch && ctx.objectActionAlternative !== "ignore") {
    const match = ctx.objectActionMatch;
    const verbToken = ctx.fraseTokens[match.verbIndex];
    const verbEntry = verbToken?.verbMatch?.entry;
    const verbKey = verbToken?.verbMatch?.gupKey;
    if (verbEntry && verbKey) {
      const form3 =
        verbEntry.forms[3] ||
        verbEntry.forms[2] ||
        verbEntry.forms[0] ||
        verbKey;
      const form4 = verbEntry.forms.length > 4 ? verbEntry.forms[4] : undefined;
      const bases = [form3, ...(form4 && form4 !== form3 ? [form4] : [])];

      const options: {
        gup: string;
        suffix: string;
        explanation: string;
        base: string;
      }[] = [];
      for (const base of bases) {
        const suffixResult = determineBelongingSuffix(base, ctx.mode);
        for (const s of suffixResult.suffixes) {
          options.push({
            gup: applyBelongingSuffix(base, s),
            suffix: s,
            explanation: `${base} + -${s}`,
            base,
          });
        }
        options.push({
          gup: base,
          suffix: "∅",
          explanation: `${base} (sin sufijo)`,
          base,
        });
      }

      const seen = new Set<string>();
      const uniqueOptions = options.filter((opt) => {
        if (seen.has(opt.gup)) return false;
        seen.add(opt.gup);
        return true;
      });

      if (uniqueOptions.length > 0) {
        const primary = uniqueOptions[0];
        const alternatives = uniqueOptions
          .slice(1)
          .map(({ gup, suffix, explanation }) => ({
            gup,
            suffix,
            explanation,
          }));

        parts.push({
          type: "noun",
          source: verbToken.original,
          gup: primary.gup,
          baseGup: primary.base,
          appliedSuffix: primary.suffix === "∅" ? undefined : primary.suffix,
          explanation: `${verbToken.original} → ${primary.explanation} (${LANG_CONFIG[ctx.mode].belongingLabel})`,
          suffixAlternatives:
            alternatives.length > 0 ? alternatives : undefined,
          globalIndex: ctx.globalIndices[match.verbIndex] ?? -1,
        });
      }
      objectActionPart = parts[parts.length - 1] || null;
    }
  }

  if (ctx.infinitiveAgentAlternative !== "explicit" && !shouldUseIrLiteral) {
    buildImpliedSubjectParts(ctx, parts, verbAltOverrideForStandard);
  }

  if (ctx.infinitiveAgentAlternative === "explicit" && ctx.djalVerbMatch) {
    const dvm = ctx.djalVerbMatch;
    const verbEntry = ctx.fraseTokens[dvm.verbIndex]?.verbMatch?.entry;
    const verbBaseForms = verbEntry?.forms || [];
    const verbGupBase = verbBaseForms[0] || dvm.verbGupBase;
    const config = LANG_CONFIG[ctx.mode];

    const impliedSubject = ctx.subjectResults.find((s) => s.type === "implied");
    const subjectGup = impliedSubject?.gup || "ŋarra";

    if (dvm.subjunctivePerson !== undefined && dvm.subjunctivePerson > 0) {
      const personMap: Record<number, PersonNumber> = {
        0: "1_Sing",
        1: "2_Sing",
        2: "3_Sing",
        3: "1+3_Plur",
        4: "2_Plur",
        5: "3_Plur",
      };
      const agentPersonKey = personMap[dvm.subjunctivePerson];
      const agentPronouns = SUBJECT_PRONOUNS_GUP[agentPersonKey];
      const agentGup = agentPronouns[0];
      const possessiveForms = POSSESSIVE_PRONOUNS_GUP[agentPersonKey];
      const possessiveGup = possessiveForms?.[0] || agentGup;

      parts.push({
        type: "subject",
        source: impliedSubject?.source || "I",
        gup: subjectGup,
        explanation: `sujeito → ${subjectGup}`,
        globalIndex: -1,
      });
      parts.push({
        type: "object",
        source: dvm.verbWord,
        gup: possessiveGup,
        explanation: `${agentPersonKey} → ${possessiveGup} (${config.possessive})`,
        globalIndex: -1,
      });
      parts.push({
        type: "verb",
        source: dvm.djalWord,
        gup: "djäl",
        explanation: `${dvm.djalWord} → djäl`,
        globalIndex: -1,
      });
      parts.push({
        type: "subject",
        source: "[agent]",
        gup: agentGup,
        explanation: `agente → ${agentGup}`,
        globalIndex: -1,
      });
      parts.push({
        type: "particle",
        source: "will",
        gup: "dhu",
        explanation: "dhu (futuro)",
        globalIndex: -1,
      });
      parts.push({
        type: "verb",
        source: dvm.verbWord,
        gup: verbGupBase,
        explanation: `${dvm.verbWord} → ${verbGupBase}`,
        globalIndex: -1,
      });
    } else if (dvm.attachedCliticPerson) {
      const objectPronounInfo =
        OBJECT_PRONOUNS_GUP[
          dvm.attachedCliticPerson as keyof typeof OBJECT_PRONOUNS_GUP
        ];
      const accusativeGup = objectPronounInfo?.gup;

      parts.push({
        type: "subject",
        source: impliedSubject?.source || "I",
        gup: subjectGup,
        explanation: `sujeito → ${subjectGup}`,
        globalIndex: -1,
      });
      parts.push({
        type: "verb",
        source: dvm.djalWord,
        gup: "djäl",
        explanation: `${dvm.djalWord} → djäl`,
        globalIndex: -1,
      });
      parts.push({
        type: "subject",
        source: impliedSubject?.source || "I",
        gup: subjectGup,
        explanation: `sujeito → ${subjectGup}`,
        globalIndex: -1,
      });
      parts.push({
        type: "particle",
        source: "will",
        gup: "dhu",
        explanation: "dhu (futuro)",
        globalIndex: -1,
      });
      if (accusativeGup) {
        const cliticSource = dvm.attachedClitic || "";
        parts.push({
          type: "object",
          source: cliticSource,
          gup: accusativeGup,
          explanation: `${cliticSource} → ${accusativeGup} (acusativo)`,
          globalIndex: -1,
        });
      }
      parts.push({
        type: "verb",
        source: dvm.verbWord,
        gup: verbGupBase,
        explanation: `${dvm.verbWord} → ${verbGupBase}`,
        globalIndex: -1,
      });
    }

    applyPerlativeIfMissing();
    return parts;
  }

  if (locativeVerbChoice) {
    parts.push({
      type: "verb",
      source: `[${locativeVerbChoice.verbType}]`,
      gup: locativeVerbChoice.gup,
      baseGup: locativeVerbChoice.baseGup,
      explanation: locativeVerbChoice.explanation,
      globalIndex:
        ctx.locativeCopulaMatch?.copulaIndex !== undefined
          ? ctx.globalIndices[ctx.locativeCopulaMatch.copulaIndex]
          : -1,
    });

    const reinforcer = ctx.locativeMatch?.reinforcer;
    if (reinforcer) {
      parts.push({
        type: "adverb",
        source: reinforcer.prefix,
        gup: reinforcer.gup,
        explanation: reinforcer[LANG_CONFIG[ctx.mode].explainKey],
        globalIndex: -1,
      });
    }
  }

  if (ctx.modalVerbInfo && !ctx.context.questionMatch?.isComplexPattern) {
    const modalParts = buildModalVerbParts({
      fraseTokens: ctx.fraseTokens,
      globalIndices: ctx.globalIndices,
      modalVerbInfo: ctx.modalVerbInfo,
      objectResults: ctx.objectResults,
      subjectResults: ctx.subjectResults,
      skipLocalIndices: ctx.skipLocalIndices,
      suffixCombo: modalSuffixCombo,
      mode: ctx.mode,
      djalVerbMatch: ctx.djalVerbMatch,
    });
    parts.push(...modalParts);

    applyPerlativeIfMissing();
    return parts;
  }

  if (ctx.timesMatch) {
    parts.push({
      type: "adverb",
      source: `${ctx.timesMatch.quantifierWord} ${ctx.timesMatch.timesWord}`,
      gup: ctx.timesMatch.gupWithMirri,
      explanation: ctx.timesMatch.explanation,
      globalIndex: ctx.globalIndices[ctx.timesMatch.quantifierIndex] ?? -1,
    });
  }

  if (ctx.thatTimeMatch) {
    const triggerIdx = ctx.thatTimeMatch.triggerIndices[0] ?? -1;
    const globalIdx = triggerIdx >= 0 ? ctx.globalIndices[triggerIdx] : -1;
    parts.push({
      type: "adverb",
      source: ctx.thatTimeMatch.triggerPhrase,
      gup: "ŋuli",
      explanation: `${ctx.thatTimeMatch.triggerPhrase} → ŋuli (that time)`,
      suffixAlternatives: [
        {
          gup: "li",
          suffix: "",
          explanation: `${ctx.thatTimeMatch.triggerPhrase} → li (that time)`,
        },
      ],
      globalIndex: globalIdx,
    });
  }

  if (ctx.relativeClauseMatch) {
    const rcm = ctx.relativeClauseMatch;
    parts.push({
      type: "noun",
      source: rcm.verbWord,
      gup: rcm.agentGup,
      explanation: `${rcm.verbWord} → ${rcm.agentGup} (-mirri)`,
      globalIndex: ctx.globalIndices[rcm.verbIndex] ?? -1,
    });
    parts.push({
      type: "noun",
      source: rcm.nounWord,
      gup: rcm.nounGup,
      explanation: `${rcm.nounWord} → ${rcm.nounGup}`,
      globalIndex: ctx.globalIndices[rcm.nounIndex] ?? -1,
    });
  }

  const skipDjalVerb =
    ctx.context.questionMatch?.answerInfo !== undefined ||
    questionConsumedSet.has(ctx.djalVerbMatch?.verbIndex ?? -1);

  if (ctx.djalVerbMatch && !skipDjalVerb) {
    const dvm = ctx.djalVerbMatch;

    if (dvm.verbIndex >= 0) {
      maybeInsertImpliedSubjectForVerb(dvm.verbIndex);
    }

    if (dvm.attachedClitic && dvm.attachedCliticPerson) {
      const cliticInfo = getCliticGup(
        dvm.attachedClitic,
        ctx.hasDualMarker,
        ctx.mode,
      );
      if (cliticInfo) {
        parts.push({
          type: "object",
          source: dvm.attachedClitic,
          gup: cliticInfo.gup,
          explanation: cliticInfo.explanation,
          globalIndex: ctx.globalIndices[dvm.verbIndex] ?? -1,
        });
      }
    }

    const alternatives =
      dvm.suffixOptions.length > 1
        ? dvm.suffixOptions.map((opt) => ({
            gup: opt,
            suffix: "",
            explanation: `${dvm.verbWord} → ${opt}`,
          }))
        : undefined;
    parts.push({
      type: "verb",
      source: dvm.verbWord,
      gup: dvm.verbGupWithSuffix,
      explanation: dvm.explanation,
      globalIndex: ctx.globalIndices[dvm.verbIndex] ?? -1,
      alternatives,
    });
  }

  const shouldUseLocativeVerbMatch =
    ctx.locativeVerbMatchAlternative !== "ignore";
  const isVerbAlreadyInNewSystem =
    ctx.locativeVerbMatch &&
    ctx.context.locativeMatch?.verbIndices?.includes(
      ctx.locativeVerbMatch.verbIndex,
    );
  const shouldUseLocativeVerb =
    ctx.locativeVerbMatch &&
    shouldUseLocativeVerbMatch &&
    !questionConsumedSet.has(ctx.locativeVerbMatch.verbIndex) &&
    !isVerbAlreadyInNewSystem;

  if (shouldUseLocativeVerb && ctx.locativeVerbMatch) {
    const lvm = ctx.locativeVerbMatch;

    ctx.skipLocalIndices.add(lvm.triggerIndex);
    ctx.skipLocalIndices.add(lvm.verbIndex);

    if (lvm.verbIndex >= 0) {
      maybeInsertImpliedSubjectForVerb(lvm.verbIndex);
    }

    parts.push({
      type: "verb",
      source: lvm.verbWord,
      gup: lvm.verbWithSuffix,
      explanation: lvm.explanation,
      globalIndex: ctx.globalIndices[lvm.verbIndex] ?? -1,
    });
  }

  if (ctx.becomeAdjectiveMatch) {
    const bam = ctx.becomeAdjectiveMatch;

    const exceptionForm = BECOME_ADJ_EXCEPTIONS[bam.adjectiveGup];

    ctx.skipLocalIndices.add(bam.verbIndex);
    ctx.skipLocalIndices.add(bam.adjectiveIndex);
    if (bam.adjectiveIndex - bam.verbIndex === 2) {
      ctx.skipLocalIndices.add(bam.verbIndex + 1);
    }

    if (exceptionForm) {
      const suffixes = determineBecomeAdjSuffix(bam.adjectiveGup);
      const regularAlternatives = suffixes.map((s) => ({
        gup: applyBecomeAdjSuffix(bam.adjectiveGup, s),
        suffix: s,
        explanation: `${bam.adjectiveGup} + -${s} (forma regular)`,
      }));

      parts.push({
        type: "verb",
        source: `${bam.verbWord} ${bam.adjectiveWord}`,
        gup: exceptionForm,
        explanation: `"${bam.verbWord} ${bam.adjectiveWord}" → ${exceptionForm} (excepción)`,
        globalIndex: ctx.globalIndices[bam.verbIndex] ?? -1,
        alternatives: regularAlternatives,
      });
    } else {
      const suffixes = determineBecomeAdjSuffix(bam.adjectiveGup);
      const primarySuffix = suffixes[0];
      const gupWithSuffix = applyBecomeAdjSuffix(
        bam.adjectiveGup,
        primarySuffix,
      );

      const alternatives =
        suffixes.length > 1
          ? suffixes.slice(1).map((s) => ({
              gup: applyBecomeAdjSuffix(bam.adjectiveGup, s),
              suffix: s,
              explanation: `${bam.adjectiveGup} + -${s}`,
            }))
          : undefined;

      parts.push({
        type: "verb",
        source: `${bam.verbWord} ${bam.adjectiveWord}`,
        gup: gupWithSuffix,
        explanation: `"${bam.verbWord} ${bam.adjectiveWord}" → ${gupWithSuffix} (become + adj)`,
        globalIndex: ctx.globalIndices[bam.verbIndex] ?? -1,
        alternatives,
      });
    }
  }

  const isNgarraVerbAlt = verbAltOverride?.gup.startsWith("ŋarra ") || false;
  const hasLocativeVerbIndices = !!(
    ctx.context.locativeMatch?.verbIndices &&
    ctx.context.locativeMatch.verbIndices.length > 0
  );
  if (
    ctx.fraseTokens.some((t) =>
      (LANG_CONFIG[ctx.mode].possessiveOwnTriggers || []).some((w) =>
        t.original
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(
            w
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase(),
          ),
      ),
    )
  ) {
    // Debug log removed.
  }
  const shouldUsePurposeInfinitive =
    ctx.purposeInfinitiveMatch &&
    ctx.purposeInfinitiveAlternative?.type !== "future-simple" &&
    (!ctx.hasIrPatternWithPurpose ||
      ctx.irPatternAlternative === "use-literal") &&
    !questionConsumedSet.has(ctx.purposeInfinitiveMatch.infinitiveIndex) &&
    !(ctx.locativeVerbMatch && shouldUseLocativeVerbMatch) &&
    !(
      hasLocativeVerbIndices && ctx.locativeVerbMatchAlternative !== "ignore"
    ) &&
    !ctx.letUsMatch &&
    !ctx.ngarraMatch &&
    !isNgarraVerbAlt &&
    !shouldUseIrLiteral;

  if (shouldUsePurposeInfinitive && ctx.purposeInfinitiveMatch) {
    const pim = ctx.purposeInfinitiveMatch;
    const purposeAlt = ctx.purposeInfinitiveAlternative;

    if (purposeAlt?.type === "conjugated-only") {
      parts.push({
        type: "verb",
        source: pim.infinitiveWord,
        gup: purposeAlt.conjugatedForm,
        explanation: `${pim.infinitiveWord} → ${purposeAlt.conjugatedForm} (verbo conjugado)`,
        globalIndex: ctx.globalIndices[pim.infinitiveIndex] ?? -1,
      });
    } else {
      if (pim.hasAlternativePattern && pim.mainVerbEntry) {
        const mainVerbForms = pim.mainVerbEntry.forms;
        let mainVerbGup = mainVerbForms[1];
        if (
          pim.mainVerbTense === "preterite" ||
          pim.mainVerbTense === "imperfect"
        ) {
          mainVerbGup = mainVerbForms[2];
        } else if (
          pim.mainVerbTense === "future" ||
          pim.mainVerbTense === "conditional"
        ) {
          mainVerbGup = mainVerbForms[0];
        }
        parts.push({
          type: "verb",
          source: pim.mainVerbWord,
          gup: mainVerbGup,
          explanation: `${pim.mainVerbWord} → ${mainVerbGup}`,
          globalIndex: ctx.globalIndices[pim.mainVerbIndex] ?? -1,
        });

        const mainVerbToken = ctx.fraseTokens[pim.mainVerbIndex];
        const attachedClitic = mainVerbToken?.verbMatch?.attachedClitic;
        if (attachedClitic) {
          const cliticInfo = getCliticGup(
            attachedClitic,
            ctx.hasDualMarker,
            ctx.mode,
          );
          if (cliticInfo) {
            const cliticAlts = cliticInfo.options
              .filter((opt) => opt.gup !== cliticInfo.gup)
              .map((opt) => ({
                gup: opt.gup,
                suffix: "",
                explanation: opt.explanation,
              }));
            parts.push({
              type: "object",
              source: attachedClitic,
              gup: cliticInfo.gup,
              explanation: cliticInfo.explanation,
              globalIndex: ctx.globalIndices[pim.mainVerbIndex] ?? -1,
              suffixAlternatives:
                cliticAlts.length > 0 ? cliticAlts : undefined,
            });
          }
        }
      }

      const suffixAlts = pim.suffixOptions.map((opt) => ({
        gup: opt,
        suffix: "",
        explanation: `${pim.infinitiveWord} → ${opt} (infinitivo + sufixo)`,
      }));

      parts.push({
        type: "verb",
        source: pim.infinitiveWord,
        gup: pim.infinitiveGupWithSuffix,
        explanation: pim.explanation,
        globalIndex: ctx.globalIndices[pim.infinitiveIndex] ?? -1,
        suffixAlternatives: suffixAlts.length > 0 ? suffixAlts : undefined,
      });
    }
  }

  buildStandardParts(
    ctx,
    parts,
    locativeVerbChoice,
    verbAltOverrideForStandard,
    emotionVerbOverride,
  );

  if (
    objectActionPart &&
    objectActionPart.globalIndex !== undefined &&
    objectActionPart.globalIndex >= 0 &&
    ctx.objectActionAlternative !== "ignore"
  ) {
    const targetIndex = objectActionPart.globalIndex;
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const part = parts[i];
      if (part === objectActionPart) continue;
      if (part.globalIndex === targetIndex) {
        parts.splice(i, 1);
      }
    }
  }

  if (ctx.objectActionMatch && ctx.objectActionAlternative !== "ignore") {
    const objIdx = ctx.objectActionMatch.objectIndex;
    const objToken = ctx.fraseTokens[objIdx];
    if (objToken && (objToken.type === "noun" || objToken.type === "unknown")) {
      const personalATriggers = new Set([
        "a",
        ...LANG_CONFIG[ctx.mode].contractionWords,
      ]);
      const hasPersonalABefore =
        (objIdx - 1 >= 0 &&
          personalATriggers.has(
            ctx.fraseTokens[objIdx - 1].original.toLowerCase(),
          )) ||
        (objIdx - 2 >= 0 &&
          personalATriggers.has(
            ctx.fraseTokens[objIdx - 2].original.toLowerCase(),
          ));
      const isHuman =
        objToken.type === "noun" && objToken.nounMatch?.isHuman === true;
      const shouldApplyNha =
        isHuman || (objToken.type === "unknown" && hasPersonalABefore);

      if (shouldApplyNha) {
        const baseGup = objToken.gupKey || objToken.original;
        const withNha = validarFonologia(baseGup + "nha");
        const targetGlobal = ctx.globalIndices[objIdx] ?? -1;
        let updated = false;
        for (const part of parts) {
          if (part.globalIndex !== targetGlobal) continue;
          if (
            part.type !== "object" &&
            part.type !== "noun" &&
            part.type !== "unknown"
          )
            continue;
          part.baseGup = baseGup;
          part.gup = withNha;
          part.appliedSuffix = "nha";
          if (!part.explanation || !part.explanation.includes("nha")) {
            part.explanation = `${baseGup} + -nha = ${withNha} (${LANG_CONFIG[ctx.mode].nhaPerson})`;
          }
          updated = true;
          break;
        }
        if (!updated) {
          parts.push({
            type: "object",
            source: objToken.original,
            gup: withNha,
            baseGup,
            appliedSuffix: "nha",
            explanation: `${baseGup} + -nha = ${withNha} (${LANG_CONFIG[ctx.mode].nhaPerson})`,
            globalIndex: targetGlobal,
            role: "object",
            isHuman,
            isKnownNoun: objToken.type === "noun",
          });
        }
      }
    }
  }

  applyPointingParticle(ctx, parts);

  return parts;
}

function applyPointingParticle(
  ctx: FraseProcessingContext,
  parts: TranslationPart[],
): void {
  const pointingInfo = ctx.pointingInfo;
  if (!pointingInfo) return;

  const alreadyInserted = parts.some(
    (p) =>
      p.type === "particle" &&
      p.gup === pointingInfo.gup &&
      p.source === pointingInfo.triggerPhrase,
  );
  if (alreadyInserted) return;

  const subjectIdx = parts.findIndex((p) => p.type === "subject");
  if (subjectIdx === -1) return;

  const localIdx = pointingInfo.triggerIndices[0];
  const globalIndex =
    typeof localIdx === "number" && localIdx >= 0
      ? (ctx.globalIndices[localIdx] ?? -1)
      : -1;

  parts.splice(subjectIdx + 1, 0, {
    type: "particle",
    source: pointingInfo.triggerPhrase,
    gup: pointingInfo.gup,
    explanation: pointingInfo.explanation,
    globalIndex,
  });
}

function buildCopulaParts(
  ctx: FraseProcessingContext,
  parts: TranslationPart[],
): void {
  const {
    context,
    fraseTokens,
    globalIndices,
    mode,
    subjectResults,
    copulaSubjectChoice,
  } = ctx;
  const copulaMatch = context.copulaMatch;

  const config = LANG_CONFIG[mode];
  if (copulaMatch && copulaMatch.subjectType !== null) {
    const gup = copulaMatch.subjectType === "this" ? "dhuwala" : "dhuwali";
    const sourceWord =
      copulaMatch.subjectIndex !== null
        ? fraseTokens[copulaMatch.subjectIndex].original
        : copulaMatch.subjectType;
    parts.push({
      type: "subject",
      source: sourceWord,
      gup,
      explanation: `"${sourceWord}" → ${gup} (${config.copulaVerbless})`,
      globalIndex:
        copulaMatch.subjectIndex !== null
          ? globalIndices[copulaMatch.subjectIndex]
          : -1,
      role: "verbless" as GrammaticalRole,
    });
  } else if (
    copulaMatch &&
    copulaMatch.impliedPerson !== null &&
    copulaSubjectChoice &&
    copulaSubjectChoice.gup &&
    !context.questionMatch?.isComplexPattern
  ) {
    const hasMatchingSubject = subjectResults.some(
      (s) => s.personNumber === copulaMatch.impliedPerson,
    );
    if (!hasMatchingSubject) {
      parts.push({
        type: "subject",
        source: `[${copulaMatch.copulaWord}]`,
        gup: copulaSubjectChoice.gup,
        explanation: copulaSubjectChoice.explanation,
        globalIndex: globalIndices[copulaMatch.copulaIndex],
        role: "verbless" as GrammaticalRole,
        meaningKey: copulaSubjectChoice.personNumber
          ? `pronoun:${copulaSubjectChoice.personNumber}`
          : undefined,
      });
    }
  }
}

function buildImpliedSubjectParts(
  ctx: FraseProcessingContext,
  parts: TranslationPart[],
  verbAltOverride: VerbRuleResult | null = null,
): void {
  const {
    context,
    subjectResults,
    verbResult,
    modalVerbInfo,
    globalIndices,
    mirriAlternative,
  } = ctx;

  if (context.questionMatch?.isComplexPattern) {
    return;
  }

  if (mirriAlternative?.type === "subject-possessive") {
    return;
  }

  const letUsSubject = subjectResults.find(
    (s) => s.source === "[let's]" && s.localIndex === -1,
  );
  if (letUsSubject && ctx.letUsMatch) {
    parts.push({
      type: "subject",
      source: letUsSubject.source,
      gup: letUsSubject.gup,
      explanation: letUsSubject.explanation,
      globalIndex: -1,
      role: "subject_intransitive" as GrammaticalRole,
      meaningKey:
        letUsSubject.options.length > 1
          ? `pronoun:${
              letUsSubject.personNumber ??
              letUsSubject.options[0]?.personNumber ??
              "unknown"
            }`
          : undefined,
    });

    if (ctx.letUsMatch.isStandalone) {
      const verbToUse = verbAltOverride;
      if (verbToUse) {
        parts.push({
          type: "verb",
          source: ctx.letUsMatch.verbWord,
          gup: verbToUse.gup,
          baseGup: verbToUse.baseGup,
          explanation: `Let's (standalone): ${verbToUse.gup}`,
          globalIndex: -1,
        });
      }
    } else {
      const verbToUse = verbAltOverride || verbResult?.results[0];
      if (verbToUse) {
        parts.push({
          type: "verb",
          source: ctx.letUsMatch.verbWord,
          gup: verbToUse.gup,
          baseGup: verbToUse.baseGup,
          explanation: verbToUse.explanation,
          globalIndex: -1,
        });
      }
    }
  }

  const impliedSubject = subjectResults.find((s) => s.type === "implied");
  const hasExplicitSubject = subjectResults.some((s) => s.type !== "implied");
  const allowImpliedWithCopula = !!ctx.pointingInfo;

  const { possessionMatch, isTransitive, fraseTokens } = ctx;
  const verbLocalIndex =
    ctx.verbResult?.localIndex ?? ctx.modalVerbInfo?.verbLocalIndex ?? -1;
  let possessedIsAgentOfTransitive = false;
  if (possessionMatch && isTransitive && verbLocalIndex >= 0) {
    const possessedToken = fraseTokens[possessionMatch.possessedIndex];
    const possessedIsHuman = possessedToken?.nounMatch?.isHuman === true;
    const possessedIsBeforeVerb =
      possessionMatch.possessedIndex < verbLocalIndex;
    possessedIsAgentOfTransitive = possessedIsHuman && possessedIsBeforeVerb;
  }

  if (
    impliedSubject &&
    (!context.copulaMatch ||
      ctx.purposeInfinitiveMatch ||
      ctx.isAmbiguousIrSer ||
      allowImpliedWithCopula) &&
    !hasExplicitSubject &&
    !possessedIsAgentOfTransitive
  ) {
    if (verbAltOverride?.gup.startsWith("ŋarra ")) {
      return;
    }
    const verbLocalIndex =
      verbResult?.localIndex ?? modalVerbInfo?.verbLocalIndex ?? -1;
    const verbGlobalIndex =
      verbLocalIndex >= 0 ? globalIndices[verbLocalIndex] : -1;
    const effectiveGlobalIndex =
      ctx.irPatternAlternative === "use-literal" ? -1 : verbGlobalIndex;
    parts.push({
      type: "subject",
      source: impliedSubject.source,
      gup: impliedSubject.gup,
      explanation: impliedSubject.explanation,
      globalIndex: effectiveGlobalIndex,
      meaningKey:
        impliedSubject.options.length > 1
          ? `pronoun:${
              impliedSubject.personNumber ??
              impliedSubject.options[0]?.personNumber ??
              "unknown"
            }`
          : undefined,
    });
  }
}

function applyMirriMiriwSuffix(
  gupWord: string,
  suffixType: MirriMiriwType,
): string {
  const normalized = gupWord.replace(/['ʼ`']/g, "'");
  return normalized + suffixType;
}

interface SuffixApplicationContext {
  baseGup: string;
  localIdx: number;
  mode: LanguageMode;
  mirriMiriwMatch: MirriMiriwMatch | null;
  locativeMatch: LocativeMatch | null;
  causativeAgentMatch: CausativeAgentMatch | null;
  conWithMatch: ConWithMatch | null;
  instrumentalMatch: InstrumentalMatch | null;
  belongingMatch: BelongingMatch | null;
  transportMatch: TransportMatch | null;
  isObject?: boolean;
  isHuman?: boolean;
  isCause?: boolean;
  isPlace?: boolean;
  unknownConWithChoice?: UnknownConWithChoice;
  unknownLocativeChoice?: UnknownLocativeChoice;
  hasNegation: boolean;
  verbMotionType?: "motion" | "stationary";
  motionDestinations?: MotionDestination[];
  motionDestinationChoice?: UnknownConWithChoice;
  mirriAlternative?:
    | { type: "object-mirri" }
    | {
        type: "subject-possessive";
        possessiveForm: string;
        subjectLocalIndex: number;
      };
}

interface SuffixApplicationResult {
  gup: string;
  suffix?: string;
  explanation: string;
  alternatives?: { gup: string; suffix: string; explanation: string }[];
}

function applySuffixBasedOnContext(
  ctx: SuffixApplicationContext,
): SuffixApplicationResult {
  const {
    baseGup,
    localIdx,
    mode,
    mirriMiriwMatch,
    locativeMatch,
    causativeAgentMatch,
    conWithMatch,
    instrumentalMatch,
    belongingMatch,
    transportMatch,
    isObject,
    isHuman,
    isCause,
    isPlace,
    unknownConWithChoice,
    unknownLocativeChoice,
    hasNegation,
    verbMotionType,
    motionDestinations,
    motionDestinationChoice,
    mirriAlternative,
  } = ctx;

  const config = LANG_CONFIG[mode];

  if (
    mirriMiriwMatch &&
    mirriAlternative?.type !== "subject-possessive" &&
    isObject
  ) {
    const finalGup = applyMirriMiriwSuffix(baseGup, mirriMiriwMatch.suffixType);
    const suffixMeaning =
      mirriMiriwMatch.suffixType === "mirri"
        ? config.withWord
        : config.withoutLacking;
    return {
      gup: finalGup,
      suffix: mirriMiriwMatch.suffixType,
      explanation: `${baseGup} + -${mirriMiriwMatch.suffixType} = ${finalGup} (${suffixMeaning})`,
    };
  }

  if (
    causativeAgentMatch &&
    causativeAgentMatch.agentIndex === localIdx &&
    isHuman === true
  ) {
    const suffixes = determineHumanCausativeSuffix(baseGup);
    const suffix = suffixes[0];
    const finalGup = applyHumanCausativeSuffix(baseGup, suffix);
    const alternatives =
      suffixes.length > 1
        ? suffixes.slice(1).map((s) => ({
            gup: applyHumanCausativeSuffix(baseGup, s),
            suffix: s,
            explanation: `${baseGup} + -${s} = ${applyHumanCausativeSuffix(
              baseGup,
              s,
            )} (${config.causativeAgentLabel})`,
          }))
        : undefined;
    return {
      gup: finalGup,
      suffix,
      explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.causativeAgentLabel})`,
      alternatives,
    };
  }

  if (
    transportMatch &&
    transportMatch.nounIndices.includes(localIdx) &&
    transportMatch.isKnownVehicle
  ) {
    const { suffixed, suffix } = applyErgativeSuffix(baseGup);
    return {
      gup: suffixed,
      suffix: suffix || "y",
      explanation: `${baseGup} + -${suffix} = ${suffixed} (${config.transportLabel})`,
    };
  }

  if (locativeMatch && locativeMatch.nounIndices.includes(localIdx)) {
    if (locativeMatch.suffixType === "lili") {
      const finalGup = applyAllativeSuffix(baseGup);
      return {
        gup: finalGup,
        suffix: "lili",
        explanation: `${baseGup} + -lili = ${finalGup} (${config.allativeSuffixLabel || "allative"})`,
      };
    } else if (locativeMatch.suffixType === "nguru") {
      const finalGup = applyAblativeSuffix(baseGup);
      return {
        gup: finalGup,
        suffix: "ŋuru",
        explanation: `${baseGup} + -ŋuru = ${finalGup} (${config.ablativeSuffixLabel})`,
      };
    } else if (locativeMatch.suffixType === "perlative") {
      const nonHumanSuffixes = determinePerlativeSuffix(baseGup);
      const nonHumanSuffix = nonHumanSuffixes[0];
      const nonHumanGup = applyPerlativeSuffix(baseGup, nonHumanSuffix);
      const nonHumanAlternatives =
        nonHumanSuffixes.length > 1
          ? nonHumanSuffixes.slice(1).map((s) => ({
              gup: applyPerlativeSuffix(baseGup, s),
              suffix: s,
              explanation: `${baseGup} + -${s} = ${applyPerlativeSuffix(
                baseGup,
                s,
              )} (${config.perlativeLabel})`,
            }))
          : [];

      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const humanOptions: {
        gup: string;
        suffix: string;
        explanation: string;
      }[] = [];
      for (const hs of humanSuffixes) {
        const humanBase = applyHumanAssociativeSuffix(baseGup, hs) + "ŋu";
        const wurruGup = applyPerlativeSuffix(humanBase, "wurru");
        const kurruGup = applyPerlativeSuffix(humanBase, "kurru");
        humanOptions.push({
          gup: wurruGup,
          suffix: `${hs}ŋuwurru`,
          explanation: `${baseGup} + -${hs}ŋuwurru = ${wurruGup} (${config.perlativeLabel})`,
        });
        humanOptions.push({
          gup: kurruGup,
          suffix: `${hs}ŋukurru`,
          explanation: `${baseGup} + -${hs}ŋukurru = ${kurruGup} (${config.perlativeLabel})`,
        });
      }

      if (isHuman === true && humanOptions.length > 0) {
        const primary = humanOptions[0];
        const alternatives =
          humanOptions.length > 1 ? humanOptions.slice(1) : undefined;
        return {
          gup: primary.gup,
          suffix: primary.suffix,
          explanation: primary.explanation,
          alternatives,
        };
      }

      if (isHuman === false) {
        return {
          gup: nonHumanGup,
          suffix: nonHumanSuffix,
          explanation: `${baseGup} + -${nonHumanSuffix} = ${nonHumanGup} (${config.perlativeLabel})`,
          alternatives:
            nonHumanAlternatives.length > 0 ? nonHumanAlternatives : undefined,
        };
      }

      const allAlternatives = [...nonHumanAlternatives, ...humanOptions];
      return {
        gup: nonHumanGup,
        suffix: nonHumanSuffix,
        explanation: `${baseGup} + -${nonHumanSuffix} = ${nonHumanGup} (${config.perlativeLabel})`,
        alternatives: allAlternatives.length > 0 ? allAlternatives : undefined,
      };
    } else if (locativeMatch.suffixType === "ngura") {
      const finalGup = applyLocativeSuffix(baseGup);
      return {
        gup: finalGup,
        suffix: "ŋura",
        explanation: `${baseGup} + -ŋura = ${finalGup} (${config.locativeExplanation})`,
      };
    } else if (locativeMatch.suffixType === "ergative") {
      const triggerLower = locativeMatch.triggerPhrase.toLowerCase();
      const isCauseTrigger = config.causeTriggers.some(
        (t) => t.toLowerCase() === triggerLower,
      );
      const ending = getWordEnding(baseGup);
      const isVowelEnding = ALL_VOWELS.includes(ending.digraph || ending.char);
      const shouldShowVowelAlt = isVowelEnding;

      if (isCauseTrigger && isHuman === true) {
        const suffixes = determineHumanAssociativeSuffix(baseGup);
        const suffix = suffixes[0];
        const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
        const alternatives: {
          gup: string;
          suffix: string;
          explanation: string;
        }[] = [];
        if (suffixes.length > 1) {
          for (const s of suffixes.slice(1)) {
            alternatives.push({
              gup: applyHumanAssociativeSuffix(baseGup, s),
              suffix: s,
              explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
                baseGup,
                s,
              )} (${config.withPerson})`,
            });
          }
        }
        for (const s of suffixes) {
          const humanGup = applyHumanAssociativeSuffix(baseGup, s);
          const humanNguWuy = validarFonologia(humanGup + "ŋuwuy");
          alternatives.push({
            gup: humanNguWuy,
            suffix: `${s}ŋuwuy`,
            explanation: `${baseGup} + -${s}ŋuwuy = ${humanNguWuy} (${config.withPerson})`,
          });
        }
        const possSuffixes = determinePossessiveSuffix(baseGup, mode).suffixes;
        for (const ps of possSuffixes) {
          const possGup = applyPossessiveSuffix(baseGup, ps);
          alternatives.push({
            gup: possGup,
            suffix: ps,
            explanation: `${baseGup} + -${ps} = ${possGup} (${config.belongingLabel})`,
          });
        }
        return {
          gup: finalGup,
          suffix,
          explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.withPerson})`,
          alternatives: alternatives.length > 0 ? alternatives : undefined,
        };
      }

      if (isCauseTrigger && isHuman === undefined && isCause !== true) {
        const ergResult = applyErgativeSuffix(baseGup);
        const ergSuffix = ergResult.suffix || "ergative";
        const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
        const alternatives: {
          gup: string;
          suffix: string;
          explanation: string;
        }[] = [];
        for (const s of humanSuffixes) {
          alternatives.push({
            gup: applyHumanAssociativeSuffix(baseGup, s),
            suffix: s,
            explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
              baseGup,
              s,
            )} (${config.withPerson})`,
          });
        }
        for (const s of humanSuffixes) {
          const humanGup = applyHumanAssociativeSuffix(baseGup, s);
          const humanNguWuy = validarFonologia(humanGup + "ŋuwuy");
          alternatives.push({
            gup: humanNguWuy,
            suffix: `${s}ŋuwuy`,
            explanation: `${baseGup} + -${s}ŋuwuy = ${humanNguWuy} (${config.withPerson})`,
          });
        }
        const possSuffixes = determinePossessiveSuffix(baseGup, mode).suffixes;
        for (const ps of possSuffixes) {
          const possGup = applyPossessiveSuffix(baseGup, ps);
          alternatives.push({
            gup: possGup,
            suffix: ps,
            explanation: `${baseGup} + -${ps} = ${possGup} (${config.belongingLabel})`,
          });
        }
        if (shouldShowVowelAlt) {
          const altGup = applyErgativeSuffixWithOverride(baseGup, "yu");
          if (altGup !== ergResult.suffixed) {
            alternatives.push({
              gup: altGup,
              suffix: "yu",
              explanation: `${baseGup} + -yu = ${altGup} (instrumental)`,
            });
          }
        }
        const belongingSuffixResult = determineBelongingSuffix(baseGup, mode);
        for (const b of belongingSuffixResult.suffixes) {
          const bGup = applyBelongingSuffix(baseGup, b);
          alternatives.push({
            gup: bGup,
            suffix: b,
            explanation: `${baseGup} + -${b} = ${bGup} (${config.belongingLabel})`,
          });
        }
        return {
          gup: ergResult.suffixed,
          suffix: ergSuffix,
          explanation: `${baseGup} + -${ergSuffix} = ${ergResult.suffixed} (instrumental)`,
          alternatives: alternatives.length > 0 ? alternatives : undefined,
        };
      }

      const result = applyErgativeSuffix(baseGup);
      const ergSuffix = result.suffix || "y";
      const ergAlternatives: {
        gup: string;
        suffix: string;
        explanation: string;
      }[] = [];
      if (shouldShowVowelAlt) {
        const altGup = applyErgativeSuffixWithOverride(baseGup, "yu");
        if (altGup !== result.suffixed) {
          ergAlternatives.push({
            gup: altGup,
            suffix: "yu",
            explanation: `${baseGup} + -yu = ${altGup} (instrumental)`,
          });
        }
      }
      if (isCauseTrigger) {
        const belongingSuffixResult = determineBelongingSuffix(baseGup, mode);
        for (const b of belongingSuffixResult.suffixes) {
          const bGup = applyBelongingSuffix(baseGup, b);
          ergAlternatives.push({
            gup: bGup,
            suffix: b,
            explanation: `${baseGup} + -${b} = ${bGup} (${config.belongingLabel})`,
          });
        }
        const possSuffixes = determinePossessiveSuffix(baseGup, mode).suffixes;
        for (const ps of possSuffixes) {
          const possGup = applyPossessiveSuffix(baseGup, ps);
          ergAlternatives.push({
            gup: possGup,
            suffix: ps,
            explanation: `${baseGup} + -${ps} = ${possGup} (${config.belongingLabel})`,
          });
        }
      }
      return {
        gup: result.suffixed,
        suffix: ergSuffix,
        explanation: `${baseGup} + -${ergSuffix} = ${result.suffixed} (instrumental)`,
        alternatives: ergAlternatives.length > 0 ? ergAlternatives : undefined,
      };
    } else if (locativeMatch.suffixType === "belonging") {
      const suffixResult = determineBelongingSuffix(baseGup, mode);
      const alternatives = suffixResult.suffixes.map((s) => ({
        gup: applyBelongingSuffix(baseGup, s),
        suffix: s,
        explanation: `${baseGup} + -${s} (belonging)`,
      }));
      const finalGup = alternatives[0].gup;
      return {
        gup: finalGup,
        suffix: "belonging",
        explanation: `${baseGup} + belonging = ${alternatives.map((a) => a.gup).join(" / ")} (-wuy/-puy/-buy)`,
        alternatives: alternatives.length > 1 ? alternatives : undefined,
      };
    }
  }

  const motionDest = motionDestinations?.find((d) => d.nounIdx === localIdx);
  const hasMotion = motionDest && !isObject;

  if (hasMotion) {
    const goalDir = motionDest.goalDirection;

    if (motionDest.isHuman === true) {
      if (goalDir === "away") {
        const suffixes = determineHumanAblativeSuffix(baseGup);
        const suffix = suffixes[0];
        const finalGup = applyHumanAblativeSuffix(baseGup, suffix);
        const alternatives =
          suffixes.length > 1
            ? suffixes.slice(1).map((s) => ({
                gup: applyHumanAblativeSuffix(baseGup, s),
                suffix: s,
                explanation: `${baseGup} + -${s} = ${applyHumanAblativeSuffix(
                  baseGup,
                  s,
                )} (${config.ablativeSuffixLabel})`,
              }))
            : undefined;
        return {
          gup: finalGup,
          suffix,
          explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.ablativeSuffixLabel})`,
          alternatives:
            alternatives && alternatives.length > 0 ? alternatives : undefined,
        };
      }
      if (
        verbMotionType === "motion" ||
        motionDestinationChoice?.type === "human"
      ) {
        const suffixes = determineHumanAssociativeSuffix(baseGup);
        const suffix =
          motionDestinationChoice?.type === "human"
            ? motionDestinationChoice.suffix
            : suffixes[0];
        const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
        const alternatives =
          suffixes.length > 1
            ? suffixes
                .filter((s) => s !== suffix)
                .map((s) => ({
                  gup: applyHumanAssociativeSuffix(baseGup, s),
                  suffix: s,
                  explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
                    baseGup,
                    s,
                  )} (${config.withPerson})`,
                }))
            : undefined;
        return {
          gup: finalGup,
          suffix,
          explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.withPerson})`,
          alternatives:
            alternatives && alternatives.length > 0 ? alternatives : undefined,
        };
      }
    } else if (motionDest.isHuman === false || isPlace === true) {
      if (goalDir === "towards" || goalDir === "unknown") {
        const finalGup = applyAllativeSuffix(baseGup);
        return {
          gup: finalGup,
          suffix: "lili",
          explanation: `${baseGup} + -lili = ${finalGup} (${config.allativeSuffixLabel})`,
        };
      }
      if (goalDir === "away") {
        const finalGup = applyAblativeSuffix(baseGup);
        return {
          gup: finalGup,
          suffix: "ŋuru",
          explanation: `${baseGup} + -ŋuru = ${finalGup} (${config.ablativeSuffixLabel})`,
        };
      }
    } else {
      if (goalDir === "towards" || goalDir === "unknown") {
        const liliGup = applyAllativeSuffix(baseGup);
        const suffixes = determineHumanAssociativeSuffix(baseGup);
        const humanOptions = suffixes.map((s) => ({
          gup: applyHumanAssociativeSuffix(baseGup, s),
          suffix: s as string,
          explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
            baseGup,
            s,
          )} (${config.withPerson})`,
        }));
        const allAlternatives: {
          gup: string;
          suffix: string;
          explanation: string;
        }[] = [...humanOptions];
        if (
          transportMatch &&
          transportMatch.nounIndices.includes(localIdx) &&
          !transportMatch.isKnownVehicle
        ) {
          const { suffixed: transportGup, suffix: transportSuffix } =
            applyErgativeSuffix(baseGup);
          allAlternatives.push({
            gup: transportGup,
            suffix: transportSuffix || "y",
            explanation: `${baseGup} + -${transportSuffix} = ${transportGup} (${config.transportOption})`,
          });
        }
        return {
          gup: liliGup,
          suffix: "lili",
          explanation: `${baseGup} + -lili = ${liliGup} (${config.allativeSuffixLabel})`,
          alternatives:
            allAlternatives.length > 0 ? allAlternatives : undefined,
        };
      }
      if (goalDir === "away") {
        const nguruGup = applyAblativeSuffix(baseGup);
        const suffixes = determineHumanAblativeSuffix(baseGup);
        const humanOptions = suffixes.map((s) => ({
          gup: applyHumanAblativeSuffix(baseGup, s),
          suffix: s,
          explanation: `${baseGup} + -${s} = ${applyHumanAblativeSuffix(
            baseGup,
            s,
          )} (${config.ablativeSuffixLabel})`,
        }));
        return {
          gup: nguruGup,
          suffix: "ŋuru",
          explanation: `${baseGup} + -ŋuru = ${nguruGup} (${config.ablativeSuffixLabel})`,
          alternatives: humanOptions,
        };
      }
    }
  }

  if (locativeMatch && locativeMatch.nounIndices.includes(localIdx)) {
    const motionDest = motionDestinations?.find((d) => d.nounIdx === localIdx);
    const goalDirection = motionDest?.goalDirection;

    if (verbMotionType === "motion") {
      if (goalDirection === "away") {
        const finalGup = applyAblativeSuffix(baseGup);
        return {
          gup: finalGup,
          suffix: "ŋuru",
          explanation: `${baseGup} + -ŋuru = ${finalGup} (${config.ablativeSuffixLabel})`,
        };
      }
      const finalGup = applyAllativeSuffix(baseGup);
      return {
        gup: finalGup,
        suffix: "lili",
        explanation: `${baseGup} + -lili = ${finalGup} (${config.allativeSuffix})`,
      };
    }

    if (isHuman === true) {
      const suffixes = determineHumanAssociativeSuffix(baseGup);
      const suffix = suffixes[0];
      const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
      const alternatives =
        suffixes.length > 1
          ? suffixes.slice(1).map((s) => ({
              gup: applyHumanAssociativeSuffix(baseGup, s),
              suffix: s,
              explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
                baseGup,
                s,
              )} (${config.withPerson})`,
            }))
          : undefined;
      return {
        gup: finalGup,
        suffix,
        explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.withPerson})`,
        alternatives,
      };
    }

    if (isPlace === true) {
      return {
        gup: baseGup,
        explanation: `${baseGup} → ${config.placeNamesNoNgura}`,
      };
    }

    if (unknownLocativeChoice?.type === "place") {
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const alternatives: {
        gup: string;
        suffix: string;
        explanation: string;
      }[] = [
        ...humanSuffixes.map((s) => ({
          gup: applyHumanAssociativeSuffix(baseGup, s),
          suffix: s,
          explanation: `${baseGup} + -${s} (${config.withPerson})`,
        })),
        {
          gup: applyLocativeSuffix(baseGup),
          suffix: "ŋura",
          explanation: `${baseGup} + -ŋura (${config.locativeSuffix})`,
        },
      ];
      if (
        belongingMatch &&
        belongingMatch.belongsToNounIndices.includes(localIdx)
      ) {
        const belongingSuffixResult = determineBelongingSuffix(baseGup, mode);
        for (const s of belongingSuffixResult.suffixes) {
          alternatives.push({
            gup: applyBelongingSuffix(baseGup, s),
            suffix: s,
            explanation: `${baseGup} + -${s} = ${applyBelongingSuffix(
              baseGup,
              s,
            )} (${config.belongingLabel})`,
          });
        }
        if (belongingMatch.isAboutTrigger) {
          const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
          for (const hs of humanSuffixes) {
            const humanGup = applyHumanAssociativeSuffix(baseGup, hs);
            const finalGup = humanGup + "puy";
            alternatives.push({
              gup: finalGup,
              suffix: hs + "+puy",
              explanation: `${baseGup} + -${hs} + -puy = ${finalGup} (${config.belongingLabel} humano)`,
            });
          }
        }
      }
      return {
        gup: baseGup,
        explanation: `${baseGup} → ${config.ifPlaceNameNoNgura}`,
        alternatives,
      };
    }

    if (unknownLocativeChoice?.type === "human") {
      const suffix = unknownLocativeChoice.suffix as HumanAssociativeSuffixType;
      const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const alternatives: {
        gup: string;
        suffix: string;
        explanation: string;
      }[] = [
        {
          gup: baseGup,
          suffix: "∅",
          explanation: `${baseGup} (${config.ifPlaceNameNoNgura})`,
        },
        ...humanSuffixes
          .filter((s) => s !== suffix)
          .map((s) => ({
            gup: applyHumanAssociativeSuffix(baseGup, s),
            suffix: s,
            explanation: `${baseGup} + -${s} (${config.withPerson})`,
          })),
        {
          gup: applyLocativeSuffix(baseGup),
          suffix: "ŋura",
          explanation: `${baseGup} + -ŋura (${config.locativeSuffix})`,
        },
      ];
      return {
        gup: finalGup,
        suffix,
        explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.withPerson})`,
        alternatives,
      };
    }

    if (unknownLocativeChoice?.type === "nonhuman") {
      const finalGup = applyLocativeSuffix(baseGup);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const alternatives: {
        gup: string;
        suffix: string;
        explanation: string;
      }[] = [
        {
          gup: baseGup,
          suffix: "∅",
          explanation: `${baseGup} (${config.ifPlaceNameNoNgura})`,
        },
        ...humanSuffixes.map((s) => ({
          gup: applyHumanAssociativeSuffix(baseGup, s),
          suffix: s,
          explanation: `${baseGup} + -${s} (${config.withPerson})`,
        })),
      ];
      if (
        belongingMatch &&
        belongingMatch.belongsToNounIndices.includes(localIdx)
      ) {
        const belongingSuffixResult = determineBelongingSuffix(baseGup, mode);
        for (const s of belongingSuffixResult.suffixes) {
          alternatives.push({
            gup: applyBelongingSuffix(baseGup, s),
            suffix: s,
            explanation: `${baseGup} + -${s} = ${applyBelongingSuffix(
              baseGup,
              s,
            )} (${config.belongingLabel})`,
          });
        }
      }
      return {
        gup: finalGup,
        suffix: "ŋura",
        explanation: `${baseGup} + -ŋura = ${finalGup} (${config.locativeSuffix})`,
        alternatives,
      };
    }

    if (isHuman === false) {
      const finalGup = applyLocativeSuffix(baseGup);
      return {
        gup: finalGup,
        suffix: "ŋura",
        explanation: `${baseGup} + -ŋura = ${finalGup} (${config.locativeSuffix})`,
      };
    }

    if (
      isHuman === undefined &&
      isPlace === undefined &&
      !unknownLocativeChoice
    ) {
      const nguraGup = applyLocativeSuffix(baseGup);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const alternatives: {
        gup: string;
        suffix: string;
        explanation: string;
      }[] = [
        {
          gup: baseGup,
          suffix: "∅",
          explanation: `${baseGup} (${config.ifPlaceNameNoNgura})`,
        },
        ...humanSuffixes.map((s) => ({
          gup: applyHumanAssociativeSuffix(baseGup, s),
          suffix: s,
          explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
            baseGup,
            s,
          )} (${config.withPerson})`,
        })),
      ];
      if (
        belongingMatch &&
        belongingMatch.belongsToNounIndices.includes(localIdx)
      ) {
        const belongingSuffixResult = determineBelongingSuffix(baseGup, mode);
        for (const s of belongingSuffixResult.suffixes) {
          alternatives.push({
            gup: applyBelongingSuffix(baseGup, s),
            suffix: s,
            explanation: `${baseGup} + -${s} = ${applyBelongingSuffix(
              baseGup,
              s,
            )} (${config.belongingLabel})`,
          });
        }
        if (belongingMatch.isAboutTrigger) {
          const aboutHumanSuffixes = determineHumanAssociativeSuffix(baseGup);
          for (const hs of aboutHumanSuffixes) {
            const humanGup = applyHumanAssociativeSuffix(baseGup, hs);
            const aboutFinalGup = humanGup + "puy";
            alternatives.push({
              gup: aboutFinalGup,
              suffix: hs + "+puy",
              explanation: `${baseGup} + -${hs} + -puy = ${aboutFinalGup} (${config.belongingLabel} humano)`,
            });
          }
        }
      }
      return {
        gup: nguraGup,
        suffix: "ŋura",
        explanation: `${baseGup} + -ŋura = ${nguraGup} (${config.locativeSuffix})`,
        alternatives,
      };
    }

    if (unknownConWithChoice?.type === "human") {
      const suffix = unknownConWithChoice.suffix;
      const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const alternatives = [
        ...humanSuffixes
          .filter((s) => s !== suffix)
          .map((s) => ({
            gup: applyHumanAssociativeSuffix(baseGup, s),
            suffix: s,
            explanation: `${baseGup} + -${s} (${config.withPerson})`,
          })),
        {
          gup: applyLocativeSuffix(baseGup),
          suffix: "ŋura",
          explanation: `${baseGup} + -ŋura (${config.locativeSuffix})`,
        },
      ];
      return {
        gup: finalGup,
        suffix,
        explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.person})`,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
      };
    }

    if (unknownConWithChoice?.type === "nonhuman") {
      const finalGup = applyLocativeSuffix(baseGup);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const alternatives = humanSuffixes.map((s) => ({
        gup: applyHumanAssociativeSuffix(baseGup, s),
        suffix: s,
        explanation: `${baseGup} + -${s} (${config.withPerson})`,
      }));
      return {
        gup: finalGup,
        suffix: "ŋura",
        explanation: `${baseGup} + -ŋura = ${finalGup} (${config.locativeSuffix})`,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
      };
    }

    const finalGup = applyLocativeSuffix(baseGup);
    return {
      gup: finalGup,
      suffix: "ŋura",
      explanation: `${baseGup} + -ŋura = ${finalGup} (${config.locativeSuffix})`,
    };
  }

  if (conWithMatch && conWithMatch.nounIndices.includes(localIdx)) {
    if (isHuman === true) {
      const suffixes = determineHumanAssociativeSuffix(baseGup);
      const suffix = suffixes[0];
      const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
      const alternatives =
        suffixes.length > 1
          ? suffixes.slice(1).map((s) => ({
              gup: applyHumanAssociativeSuffix(baseGup, s),
              suffix: s,
              explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
                baseGup,
                s,
              )} (${config.withPerson})`,
            }))
          : undefined;
      return {
        gup: finalGup,
        suffix,
        explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.withPerson})`,
        alternatives,
      };
    }
    if (isHuman === false || isCause === true) {
      const { suffixed, suffix } = applyErgativeSuffix(baseGup);
      return {
        gup: suffixed,
        suffix: suffix || "y",
        explanation: `${baseGup} + -${suffix} = ${suffixed} (${config.instrumentalThing})`,
      };
    }
    if (isHuman === undefined && !unknownConWithChoice) {
      const { suffixed, suffix } = applyErgativeSuffix(baseGup);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const humanOptions = humanSuffixes.map((s) => ({
        gup: applyHumanAssociativeSuffix(baseGup, s),
        suffix: s,
        explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
          baseGup,
          s,
        )} (${config.withPerson})`,
      }));
      return {
        gup: suffixed,
        suffix: suffix || "y",
        explanation: `${baseGup} + -${suffix} = ${suffixed} (${config.instrumentalThing})`,
        alternatives: humanOptions.length > 0 ? humanOptions : undefined,
      };
    }
    if (unknownConWithChoice?.type === "human") {
      const suffix = unknownConWithChoice.suffix;
      const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const alternatives = [
        ...humanSuffixes
          .filter((s) => s !== suffix)
          .map((s) => ({
            gup: applyHumanAssociativeSuffix(baseGup, s),
            suffix: s,
            explanation: `${baseGup} + -${s} (${config.withPerson})`,
          })),
      ];
      return {
        gup: finalGup,
        suffix,
        explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.person})`,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
      };
    }
    if (
      unknownConWithChoice?.type === "nonhuman" ||
      unknownConWithChoice?.type === "instrumental"
    ) {
      const { suffixed: instrumentalGup, suffix: instrumentalSuffix } =
        applyErgativeSuffix(baseGup);
      return {
        gup: instrumentalGup,
        suffix: instrumentalSuffix || "y",
        explanation: `${baseGup} + -${instrumentalSuffix} = ${instrumentalGup} (${config.instrumentalThing})`,
      };
    }
  }

  if (instrumentalMatch && instrumentalMatch.nounIndices.includes(localIdx)) {
    if (isHuman === true) {
      const suffixes = determineHumanAssociativeSuffix(baseGup);
      const suffix = suffixes[0];
      const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
      const alternatives =
        suffixes.length > 1
          ? suffixes.slice(1).map((s) => ({
              gup: applyHumanAssociativeSuffix(baseGup, s),
              suffix: s,
              explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
                baseGup,
                s,
              )} (${config.instrumentalPerson})`,
            }))
          : undefined;
      return {
        gup: finalGup,
        suffix,
        explanation: `${baseGup} + -${suffix} = ${finalGup} (${config.instrumentalPerson})`,
        alternatives,
      };
    }
    if (isHuman === false) {
      const { suffixed, suffix } = applyErgativeSuffix(baseGup);
      return {
        gup: suffixed,
        suffix: suffix || "y",
        explanation: `${baseGup} + -${suffix} = ${suffixed} (${config.instrumentalThing})`,
      };
    }
    if (isHuman === undefined) {
      const { suffixed, suffix } = applyErgativeSuffix(baseGup);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const humanOptions = humanSuffixes.map((s) => ({
        gup: applyHumanAssociativeSuffix(baseGup, s),
        suffix: s,
        explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
          baseGup,
          s,
        )} (${config.instrumentalPerson})`,
      }));
      return {
        gup: suffixed,
        suffix: suffix || "y",
        explanation: `${baseGup} + -${suffix} = ${suffixed} (${config.instrumentalThing})`,
        alternatives: humanOptions,
      };
    }
  }

  if (transportMatch && transportMatch.nounIndices.includes(localIdx)) {
    const { suffixed, suffix } = applyErgativeSuffix(baseGup);
    if (transportMatch.isKnownVehicle) {
      return {
        gup: suffixed,
        suffix: suffix || "y",
        explanation: `${baseGup} + -${suffix} = ${suffixed} (${config.transportLabel})`,
      };
    }
    if (transportMatch.hasMovementVerb && !transportMatch.isKnownVehicle) {
      return {
        gup: baseGup,
        explanation: `${baseGup}`,
        alternatives: [
          {
            gup: suffixed,
            suffix: suffix || "y",
            explanation: `${baseGup} + -${suffix} = ${suffixed} (${config.transportOption})`,
          },
        ],
      };
    }
  }

  if (
    belongingMatch &&
    belongingMatch.isPronoun &&
    belongingMatch.pronounPersonNumber &&
    belongingMatch.belongsToNounIndices.includes(localIdx)
  ) {
    const pronounForms =
      BELONGING_PRONOUNS_GUP[belongingMatch.pronounPersonNumber];
    const alternatives = pronounForms.map((form) => ({
      gup: form,
      suffix: "",
      explanation: `${belongingMatch.pronounWord} → ${form} (${config.pronounBelonging})`,
    }));
    return {
      gup: pronounForms[0],
      explanation: `${belongingMatch.pronounWord} → ${pronounForms[0]}`,
      alternatives: alternatives.length > 1 ? alternatives : undefined,
    };
  }

  if (
    belongingMatch &&
    belongingMatch.belongsToNounIndices.includes(localIdx)
  ) {
    const belongingAlternatives: {
      gup: string;
      suffix: string;
      explanation: string;
    }[] = [];

    if (isHuman !== true) {
      const belongingSuffixResult = determineBelongingSuffix(baseGup, mode);
      for (const s of belongingSuffixResult.suffixes) {
        belongingAlternatives.push({
          gup: applyBelongingSuffix(baseGup, s),
          suffix: s,
          explanation: `${baseGup} + -${s} = ${applyBelongingSuffix(
            baseGup,
            s,
          )} (${config.belongingLabel})`,
        });
      }
    }

    if (belongingMatch.isAboutTrigger && isHuman !== false) {
      const aboutHumanSuffixes = determineHumanAssociativeSuffix(baseGup);
      for (const hs of aboutHumanSuffixes) {
        const humanGup = applyHumanAssociativeSuffix(baseGup, hs);
        const humanGupWithNgu = humanGup + "ŋu";
        const belongingOptions = ["puy", "wuy"];
        for (const bSuffix of belongingOptions) {
          const aboutFinalGup = humanGupWithNgu + bSuffix;
          const fullSuffix = hs + "ŋu" + bSuffix;
          belongingAlternatives.push({
            gup: aboutFinalGup,
            suffix: fullSuffix,
            explanation: `${baseGup} + -${hs}ŋu + -${bSuffix} = ${aboutFinalGup} (${config.belongingLabel} humano)`,
          });
        }
      }
    }

    if (belongingAlternatives.length > 0) {
      return {
        gup: baseGup,
        explanation: "",
        alternatives: belongingAlternatives,
      };
    }
  }

  return { gup: baseGup, explanation: "" };
}

function buildStandardParts(
  ctx: FraseProcessingContext,
  parts: TranslationPart[],
  locativeVerbChoice: LocativeVerbResult | null = null,
  verbAltOverride: VerbRuleResult | null = null,
  emotionVerbOverride: VerbRuleResult | null = null,
): void {
  const {
    fraseTokens,
    globalIndices,
    skipLocalIndices: baseSkipLocalIndices,
    mode,
    verbResult,
    subjectResults,
    objectResults,
    hasDualMarker,
    isTransitive,
    verbMotionType,
    possessionMatch,
    possessivePronounMatch,
    mirriMiriwMatch,
    locativeMatch,
    causativeAgentMatch,
    conWithMatch,
    comitativePronounMatch,
    humanAllativePronounMatch,
    humanAblativePronounMatch,
    humanPerlativePronounMatch,
    sourceOriginPronounMatch,
    causePronounMatch,
    purposePronounMatch,
    indirectObjectMatch,
    unknownConWithChoice,
    unknownLocativeChoice,
    motionDestinations,
    motionDestinationChoice,
    motionDirection,
    context,
    mirriAlternative,
    purposeInfinitiveAlternative,
    purposeInfinitiveMatch,
    irPatternAlternative,
    hasIrPatternWithPurpose,
  } = ctx;

  const useIrLiteral =
    hasIrPatternWithPurpose &&
    irPatternAlternative === "use-literal" &&
    !!context.matchedPattern &&
    (context.matchedPattern.patternName === "ir_present_a_infinitive" ||
      context.matchedPattern.patternName === "ir_past_a_infinitive");
  const irAuxIndex = useIrLiteral
    ? context.matchedPattern?.skipIndices[0] ?? null
    : null;
  const irInfIndex = useIrLiteral
    ? context.matchedPattern?.mainVerbIndex ?? null
    : null;
  const purposeInfMatch = useIrLiteral ? null : purposeInfinitiveMatch;
  const purposeInfAlt = useIrLiteral ? null : purposeInfinitiveAlternative;
  const verbAltOverrideEffective = useIrLiteral ? null : verbAltOverride;
  const tokenStrings = fraseTokens.map((t) => t.original);
  const fraseText = tokenStrings.join(" ");
  const hasExplicitSubject = subjectResults.some((s) => s.type !== "implied");
  const effectiveLocativeMatch = locativeMatch || context.locativeMatch;
  const hasCauseTriggerForPossession =
    effectiveLocativeMatch?.suffixType === "ergative" &&
    LANG_CONFIG[mode].causeTriggers.some(
      (t) =>
        normalizeToken(t) ===
        normalizeToken(effectiveLocativeMatch.triggerPhrase),
    );
  const hasLiteralDhuwala = fraseTokens.some((t) => {
    const original = normalizeToken(t.original);
    const gup = t.gupKey ? normalizeToken(t.gupKey) : "";
    return (
      original === "dhuwala" ||
      original === "dhuwali" ||
      gup === "dhuwala" ||
      gup === "dhuwali"
    );
  });
  const hasSpecialPossessiveNguContext =
    !!ctx.djalVerbMatch ||
    !!context.copulaMatch ||
    hasLiteralDhuwala ||
    hasCauseTriggerForPossession;
  const buildNguPossessiveOptionsFromBase = (baseGup: string) => {
    const options: { gup: string; suffix: string; explanation: string }[] = [];
    const seen = new Set<string>();
    const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
    for (const hs of humanSuffixes) {
      const humanBase = applyHumanAssociativeSuffix(baseGup, hs) + "ŋu";
      const possSuffixes = determinePossessiveSuffix(humanBase, mode).suffixes;
      for (const ps of possSuffixes) {
        const gup = applyPossessiveSuffix(humanBase, ps);
        if (seen.has(gup)) continue;
        seen.add(gup);
        options.push({
          gup,
          suffix: `${hs}ŋu${ps}`,
          explanation: `${baseGup} + -${hs}ŋu + -${ps} = ${gup} (${LANG_CONFIG[mode].possessor})`,
        });
      }
    }
    return options;
  };
  const buildNguPossessiveFormsFromPronouns = (forms: string[]) => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const form of forms) {
      const base = `${form}ŋu`;
      const possSuffixes = determinePossessiveSuffix(base, mode).suffixes;
      for (const ps of possSuffixes) {
        const gup = applyPossessiveSuffix(base, ps);
        if (seen.has(gup)) continue;
        seen.add(gup);
        out.push(gup);
      }
    }
    return out;
  };

  const shouldUseLocativeVerbMatch =
    ctx.locativeVerbMatchAlternative !== "ignore";
  const skipLocalIndices = new Set(baseSkipLocalIndices);
  if (ctx.objectActionMatch && ctx.objectActionAlternative !== "ignore") {
    skipLocalIndices.add(ctx.objectActionMatch.verbIndex);
    for (const idx of ctx.objectActionMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
  }
  if (!shouldUseLocativeVerbMatch && locativeMatch?.verbIndices) {
    for (const idx of locativeMatch.verbIndices) {
      skipLocalIndices.delete(idx);
    }
  }
  if (ctx.letUsMatch) {
    const letUsVerbIdx = ctx.verbResult?.localIndex ?? ctx.letUsMatch.verbIndex;
    if (typeof letUsVerbIdx === "number" && letUsVerbIdx >= 0) {
      skipLocalIndices.add(letUsVerbIdx);
    }
  }

  if (ctx.locativeVerbMatch && shouldUseLocativeVerbMatch) {
    for (const idx of ctx.locativeVerbMatch.consumedIndices) {
      skipLocalIndices.add(idx);
    }
  }

  if (
    hasIrPatternWithPurpose &&
    irPatternAlternative === "use-literal" &&
    purposeInfMatch
  ) {
    skipLocalIndices.add(purposeInfMatch.mainVerbIndex);
    for (const idx of purposeInfMatch.consumedIndices) {
      if (
        purposeInfAlt?.type === "future-simple" &&
        idx === purposeInfMatch.infinitiveIndex
      ) {
        continue;
      }
      skipLocalIndices.add(idx);
    }
  }

  if (purposeInfAlt?.type === "conjugated-only" && purposeInfMatch) {
    skipLocalIndices.add(purposeInfMatch.mainVerbIndex);
  }

  const isNgarraVerbAlt =
    verbAltOverrideEffective?.gup.startsWith("ŋarra ") || false;
  const shouldUsePurposeInf =
    !!purposeInfMatch &&
    purposeInfAlt?.type !== "future-simple" &&
    (!hasIrPatternWithPurpose || irPatternAlternative === "use-literal") &&
    !(ctx.locativeVerbMatch && shouldUseLocativeVerbMatch) &&
    !ctx.ngarraMatch;
  const effectiveShouldUsePurposeInf = shouldUsePurposeInf && !isNgarraVerbAlt;
  if (effectiveShouldUsePurposeInf && purposeInfMatch) {
    skipLocalIndices.add(purposeInfMatch.infinitiveIndex);
    if (purposeInfMatch.hasAlternativePattern) {
      skipLocalIndices.add(purposeInfMatch.mainVerbIndex);
    }
    for (const idx of purposeInfMatch.consumedIndices) {
      skipLocalIndices.add(idx);
    }
  }
  if (!effectiveShouldUsePurposeInf && purposeInfMatch) {
    for (const idx of purposeInfMatch.consumedIndices) {
      if (idx === purposeInfMatch.infinitiveIndex) continue;
      skipLocalIndices.add(idx);
    }
    if (
      purposeInfMatch.mainVerbIndex !== undefined &&
      purposeInfMatch.mainVerbIndex !== purposeInfMatch.infinitiveIndex
    ) {
      skipLocalIndices.add(purposeInfMatch.mainVerbIndex);
    }
  }

  const negationWords = getNegationWords(mode);
  const verbHasYaka =
    verbResult?.results[0]?.particles.includes("yaka") || false;
  const hasNegation = context.hasNegation;
  const hasRelatedAdjectiveMatch = fraseTokens.some((t) => {
    if (t.type !== "adjective" && t.type !== "unknown") return false;
    return findRelatedAdjectiveVerbs(t.original, mode).length > 0;
  });
  const shouldConsumeNegationWord =
    hasNegation && (!!ctx.emotionMatch || hasRelatedAdjectiveMatch);

  const normalizeWord = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const nonSubjectWords = (() => {
    const words: string[] = [
      ...LANG_CONFIG[mode].connectors,
      ...LANG_CONFIG[mode].skipWords,
      ...LANG_CONFIG[mode].definiteArticles,
      ...LANG_CONFIG[mode].pluralArticles,
      ...(LANG_CONFIG[mode].locativeTriggers || []),
      ...(LANG_CONFIG[mode].locativeVerbTriggers || []),
      ...(LANG_CONFIG[mode].allativeVerbTriggers || []),
      ...(LANG_CONFIG[mode].ablativeVerbTriggers || []),
      ...(LANG_CONFIG[mode].perlativeVerbTriggers || []),
      ...(LANG_CONFIG[mode].perlativeTimeTriggers || []),
      ...(LANG_CONFIG[mode].causeTriggers || []),
      ...(LANG_CONFIG[mode].causativeAgentTriggers || []),
      ...(LANG_CONFIG[mode].conWithTriggers || []),
      ...(LANG_CONFIG[mode].instrumentalTriggers || []),
      ...(LANG_CONFIG[mode].belongingTriggers || []),
      ...(LANG_CONFIG[mode].transportTriggers || []),
      ...(LANG_CONFIG[mode].aboutTriggers || []),
      ...(LANG_CONFIG[mode].purposeConnectors || []),
      ...Object.keys(LANG_CONFIG[mode].questionWordMap || {}),
    ];
    return new Set(words.map(normalizeWord));
  })();
  const isSubjectLikeToken = (token?: Token): boolean => {
    if (!token) return false;
    if (token.type === "noun" || token.type === "pronoun") return true;
    if (token.type === "unknown") {
      const norm = normalizeWord(token.original);
      return !nonSubjectWords.has(norm);
    }
    return false;
  };
  const buildImpliedSubjectPartForVerb = (
    verbIdx: number,
  ): TranslationPart | null => {
    const verbToken = fraseTokens[verbIdx];
    const verbPerson = verbToken?.verbMatch?.person;
    if (verbPerson === undefined || verbPerson === null) return null;
    const impliedPersonNumber = getImpliedPersonNumber(verbPerson);
    if (!impliedPersonNumber) return null;
    const options = getPronounOptions(impliedPersonNumber, hasDualMarker, mode);
    if (!options || options.length === 0) return null;
    const gup = options[0].gup;
    const isVerbTransitive = verbToken?.verbMatch?.entry?.vtr ?? false;
    const role: GrammaticalRole = isVerbTransitive
      ? "subject_transitive"
      : "subject_intransitive";
    const globalIndex = globalIndices[verbIdx] ?? -1;
    const alreadyInserted = parts.some(
      (p) =>
        p.type === "subject" &&
        typeof p.source === "string" &&
        p.source.startsWith("[implied") &&
        p.globalIndex === globalIndex,
    );
    if (alreadyInserted) return null;
    return {
      type: "subject",
      source: "[implied from verb]",
      gup,
      explanation: `${LANG_CONFIG[mode].impliedSubjectConjugation} → ${gup}`,
      globalIndex,
      role,
    };
  };
  const hasSubjectLikeBeforeVerb = (verbIdx: number): boolean => {
    for (let i = verbIdx - 1; i >= 0; i--) {
      if (skipLocalIndices.has(i)) continue;
      if (isSubjectLikeToken(fraseTokens[i])) return true;
    }
    return false;
  };
  const maybeInsertImpliedSubjectForVerb = (verbIdx: number) => {
    if (hasSubjectLikeBeforeVerb(verbIdx)) return;
    const impliedPart = buildImpliedSubjectPartForVerb(verbIdx);
    if (impliedPart) parts.push(impliedPart);
  };

  const fixedMatches = findAllFixedMatches(tokenStrings, mode);
  const fixedIndices = getFixedIndices(fixedMatches);
  const possessiveOwnTriggerSet = new Set(
    (LANG_CONFIG[mode].possessiveOwnTriggers || []).map((w) =>
      normalizeToken(w),
    ),
  );
  if (possessivePronounMatch && possessiveOwnTriggerSet.size > 0) {
    const findOwnAfter = (startIdx: number): number | null => {
      let idx = startIdx + 1;
      while (idx < fraseTokens.length && fraseTokens[idx].type === "connector") {
        idx += 1;
      }
      if (idx >= fraseTokens.length) return null;
      const nextNorm = normalizeToken(fraseTokens[idx].original);
      return possessiveOwnTriggerSet.has(nextNorm) ? idx : null;
    };
    const preOwnIdx =
      findOwnAfter(possessivePronounMatch.pronounIndex) ??
      findOwnAfter(possessivePronounMatch.possessedIndex);
    if (preOwnIdx !== null) {
      skipLocalIndices.add(preOwnIdx);
    }
  }

  const fixedMatchByStartIndex = new Map<number, FixedMatch>();
  for (const match of fixedMatches) {
    fixedMatchByStartIndex.set(match.startIndex, match);
  }

  const subjectByIndex = new Map<number, SubjectResult>();
  for (const subj of subjectResults) {
    if (subj.type !== "implied" && subj.localIndex >= 0) {
      subjectByIndex.set(subj.localIndex, subj);
    }
  }

  const objectByIndex = new Map<number, ObjectResult>();
  for (const obj of objectResults) {
    if (obj.localIndex >= 0) {
      objectByIndex.set(obj.localIndex, obj);
    }
  }

  const possessionHandled = new Set<number>();

  const questionConsumed = new Set(
    context.questionMatch?.consumedIndices || [],
  );

  const shouldApplyLocativeVerbIndices =
    !!locativeMatch?.verbIndices &&
    !ctx.letUsMatch &&
    (ctx.locativeVerbMatchAlternative === undefined ||
      ctx.locativeVerbMatchAlternative === "use");

  if (shouldApplyLocativeVerbIndices && locativeMatch?.verbIndices) {
    const activeSuffixType =
      ctx.locativeSuffixChoice?.suffixType || locativeMatch.suffixType;
    const triggerLower = locativeMatch.triggerPhrase.toLowerCase();
    const isPerlativeTimeTrigger =
      activeSuffixType === "perlative" &&
      (LANG_CONFIG[mode].perlativeTimeTriggers || []).some(
        (t) => t.toLowerCase() === triggerLower,
      );
    if (activeSuffixType !== "perlative" || isPerlativeTimeTrigger) {
      const isCauseTrigger = LANG_CONFIG[mode].causeTriggers.some(
        (t) => t.toLowerCase() === triggerLower,
      );
      const onlyBelongingForVerbs =
        isCauseTrigger && (triggerLower === "por" || triggerLower === "for");

      for (const verbIdx of locativeMatch.verbIndices) {
        if (questionConsumed.has(verbIdx)) {
          continue;
        }

        const verbToken = fraseTokens[verbIdx];
        const verbGlobalIdx = globalIndices[verbIdx];

        if (verbToken.type === "verb" && verbToken.verbMatch) {
          maybeInsertImpliedSubjectForVerb(verbIdx);
          const verbEntry = verbToken.verbMatch.entry;
          const verbQuaternary = verbEntry.forms[3];

          let verbWithSuffix: string;
          let suffixName: string;
          let suffixExplanation: string;
          let suffixAlternatives:
            | { gup: string; suffix: string; explanation: string }[]
            | undefined;

          if (activeSuffixType === "lili") {
            verbWithSuffix = applyAllativeSuffix(verbQuaternary);
            suffixName = ALLATIVE_SUFFIX;
            suffixExplanation =
              LANG_CONFIG[mode].allativeSuffixLabel || "allative";
          } else if (activeSuffixType === "nguru") {
            verbWithSuffix = applyAblativeSuffix(verbQuaternary);
            suffixName = ABLATIVE_SUFFIX;
            suffixExplanation =
              LANG_CONFIG[mode].ablativeSuffixLabel || "ablative";
          } else if (
            activeSuffixType === "perlative" &&
            isPerlativeTimeTrigger
          ) {
            const kurruGup = applyPerlativeSuffix(verbQuaternary, "kurru");
            const wurruGup = applyPerlativeSuffix(verbQuaternary, "wurru");
            verbWithSuffix = kurruGup;
            suffixName = "kurru";
            suffixExplanation = LANG_CONFIG[mode].perlativeLabel;
            suffixAlternatives = [
              {
                gup: wurruGup,
                suffix: "wurru",
                explanation: `${verbQuaternary} + -wurru (${LANG_CONFIG[mode].perlativeLabel})`,
              },
            ];
          } else if (activeSuffixType === "ergative") {
            if (onlyBelongingForVerbs) {
              const bRes = determineBelongingSuffix(verbQuaternary, mode);
              const bSuffix = bRes.suffixes[0];
              verbWithSuffix = applyBelongingSuffix(verbQuaternary, bSuffix);
              suffixName = bSuffix;
              suffixExplanation = LANG_CONFIG[mode].belongingLabel;
              if (bRes.suffixes.length > 1) {
                suffixAlternatives = bRes.suffixes.slice(1).map((s) => ({
                  gup: applyBelongingSuffix(verbQuaternary, s),
                  suffix: s,
                  explanation: `${verbQuaternary} + -${s} (${LANG_CONFIG[mode].belongingLabel})`,
                }));
              }
            } else {
              const result = applyErgativeSuffix(verbQuaternary);
              verbWithSuffix = result.suffixed;
              suffixName = result.suffix || "ergative";
              suffixExplanation = "instrumental suffix";
              if (isCauseTrigger) {
                const bRes = determineBelongingSuffix(verbQuaternary, mode);
                const bAlts = bRes.suffixes.map((s) => ({
                  gup: applyBelongingSuffix(verbQuaternary, s),
                  suffix: s,
                  explanation: `${verbQuaternary} + -${s} (${LANG_CONFIG[mode].belongingLabel})`,
                }));
                suffixAlternatives = bAlts.length > 0 ? bAlts : undefined;
              }
            }
          } else if (activeSuffixType === "belonging") {
            const suffixResult = determineBelongingSuffix(verbQuaternary, mode);
            const alternatives = suffixResult.suffixes.map((s) => ({
              gup: applyBelongingSuffix(verbQuaternary, s),
              suffix: s,
              explanation: `${verbQuaternary} + -${s}`,
            }));
            verbWithSuffix = alternatives[0].gup;
            suffixName = alternatives[0].suffix;
            suffixExplanation = "belonging/associative suffix";
            suffixAlternatives =
              alternatives.length > 1 ? alternatives : undefined;
          } else {
            verbWithSuffix = applyLocativeSuffix(verbQuaternary);
            suffixName = LOCATIVE_SUFFIX;
            suffixExplanation = LANG_CONFIG[mode].locativeExplanation;
          }

          parts.push({
            type: "verb",
            source: verbToken.original,
            gup: verbWithSuffix,
            explanation: `${verbToken.original} → ${verbQuaternary} + -${suffixName} = ${verbWithSuffix} (${suffixExplanation})`,
            globalIndex: verbGlobalIdx,
            suffixAlternatives,
          });
        }
      }
    }
  }

  for (let localIdx = 0; localIdx < fraseTokens.length; localIdx++) {
    const token = fraseTokens[localIdx];
    const globalIdx = globalIndices[localIdx];
    if (possessiveOwnTriggerSet.size > 0) {
      const ownNorm = normalizeToken(token.original);
      if (possessiveOwnTriggerSet.has(ownNorm)) {
        // Debug log removed.
      }
    }

    if (
      ctx.emotionMatch &&
      emotionVerbOverride &&
      localIdx === ctx.emotionMatch.adjectiveIndex
    ) {
      const emotionAdjWord = ctx.emotionMatch.adjectiveWord;
      const relatedMatches = findRelatedAdjectiveVerbs(
        emotionAdjWord,
        mode,
      );
      const relatedOptions =
        relatedMatches.length > 0
          ? buildRelatedAdjectiveOptions(
              relatedMatches,
              hasNegation ? "miriw" : "mirri",
            )
          : [];

      const relatedAlternatives =
        relatedOptions.length > 0
          ? relatedOptions.map((opt) => ({
              gup: opt.gup,
              suffix: opt.suffix,
              explanation: `${emotionAdjWord} → ${opt.explanation}`,
            }))
          : undefined;
      parts.push({
        type: "verb",
        source: emotionAdjWord,
        gup: emotionVerbOverride.gup,
        baseGup: emotionVerbOverride.baseGup,
        explanation: emotionVerbOverride.explanation,
        suffixAlternatives: relatedAlternatives,
        globalIndex: globalIdx,
      });
      continue;
    }

    if (useIrLiteral && (localIdx === irAuxIndex || localIdx === irInfIndex)) {
      if (token.type === "verb" && token.verbMatch) {
        maybeInsertImpliedSubjectForVerb(localIdx);
        const verbResults = applyVerbRules(
          token.verbMatch,
          tokenStrings,
          fraseText,
          mode,
          null,
          false,
          hasExplicitSubject,
          false,
        );
        if (localIdx === irAuxIndex) {
          // Debug log removed.
        } else {
          // Debug log removed.
        }
        const primary = verbResults[0];
        if (primary) {
          const alternatives =
            verbResults.length > 1
              ? verbResults.slice(1).map((opt) => ({
                  gup: opt.gup,
                  suffix: "",
                  explanation: opt.explanation,
                }))
              : undefined;
          parts.push({
            type: "verb",
            source: token.original,
            gup: primary.gup,
            explanation:
              localIdx === irAuxIndex
                ? `${token.original} → ${primary.gup}`
                : primary.explanation,
            globalIndex: globalIdx,
            suffixAlternatives: alternatives,
          });
        }
        continue;
      }
    }

    if (skipLocalIndices.has(localIdx)) {
      continue;
    }

    if (questionConsumed.has(localIdx)) {
      continue;
    }
    if (possessionHandled.has(localIdx)) continue;
    if (
      (verbHasYaka || shouldConsumeNegationWord) &&
      negationWords.includes(token.original.toLowerCase())
    )
      continue;

    if (
      possessivePronounMatch &&
      localIdx === possessivePronounMatch.possessedIndex &&
      !mirriMiriwMatch
    ) {
      const verbalNounPossession =
        ctx.verbalNounPossession &&
        ctx.verbalNounPossession.type === "possessivePronoun" &&
        ctx.verbalNounPossessionAlternative === "source"
          ? ctx.verbalNounPossession
          : null;
      if (verbalNounPossession) {
        const pronounForms =
          SOURCE_ORIGIN_PRONOUNS_GUP[verbalNounPossession.personNumber!];
        const possessorGup = pronounForms[0];
        const possessorAlternatives =
          pronounForms.length > 1
            ? pronounForms.slice(1).map((g) => ({
                gup: g,
                suffix: "",
                explanation: `${possessivePronounMatch.pronounWord} → ${g}`,
              }))
            : undefined;

        const verbalOptions = verbalNounPossession.verbalNounOptions;
        const primary = verbalOptions[0];
        const altSuffixes =
          verbalOptions.length > 1
            ? verbalOptions.slice(1).map((opt) => ({
                gup: opt.gup,
                suffix: opt.suffix,
                explanation: `${possessivePronounMatch.possessedWord} → ${opt.explanation}`,
              }))
            : undefined;

        parts.push({
          type: "noun",
          source: `${possessivePronounMatch.pronounWord} (possessor)`,
          sourceWord: possessivePronounMatch.pronounWord,
          gup: possessorGup,
          explanation: `"${possessivePronounMatch.pronounWord}" → ${possessorGup} (source/origin pronoun)`,
          suffixAlternatives: possessorAlternatives,
          globalIndex: globalIndices[possessivePronounMatch.pronounIndex],
          role: "possessor" as GrammaticalRole,
          isHuman: true,
          meaningKey: `pronoun:${verbalNounPossession.personNumber ?? "unknown"}`,
        });

        parts.push({
          type: "noun",
          source: `${possessivePronounMatch.possessedWord} (possessed)`,
          sourceWord: possessivePronounMatch.possessedWord,
          gup: primary.gup,
          baseGup: primary.gup,
          appliedSuffix: primary.suffix,
          explanation: `${possessivePronounMatch.possessedWord} → ${primary.explanation}`,
          suffixAlternatives: altSuffixes,
          globalIndex: globalIndices[possessivePronounMatch.possessedIndex],
          role: "possessed" as GrammaticalRole,
          isKnownNoun: false,
        });

        possessionHandled.add(possessivePronounMatch.pronounIndex);
        possessionHandled.add(possessivePronounMatch.possessedIndex);
        continue;
      }

      const possessedToken = fraseTokens[possessivePronounMatch.possessedIndex];
      const possessedGup = possessedToken.gupKey || possessedToken.original;
      const gupForms =
        POSSESSIVE_PRONOUNS_GUP[possessivePronounMatch.personNumber];
      const normalizeEmphasisToken = (value: string) =>
        value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      const emphasisWords = (LANG_CONFIG[mode].pronounEmphasisWords || []).map(
        normalizeEmphasisToken,
      );
      const ownTriggers = (LANG_CONFIG[mode].possessiveOwnTriggers || []).map(
        normalizeEmphasisToken,
      );
      const findEmphasisAfter = (startIdx: number): number | null => {
        let idx = startIdx + 1;
        while (idx < fraseTokens.length && fraseTokens[idx].type === "connector") {
          idx += 1;
        }
        if (idx >= fraseTokens.length) return null;
        const nextNorm = normalizeEmphasisToken(fraseTokens[idx].original);
        return emphasisWords.includes(nextNorm) ? idx : null;
      };
      const findOwnAfter = (startIdx: number): number | null => {
        let idx = startIdx + 1;
        while (idx < fraseTokens.length && fraseTokens[idx].type === "connector") {
          idx += 1;
        }
        if (idx >= fraseTokens.length) return null;
        const nextNorm = normalizeEmphasisToken(fraseTokens[idx].original);
        return ownTriggers.includes(nextNorm) ? idx : null;
      };
      const emphasisIdx =
        findEmphasisAfter(possessivePronounMatch.pronounIndex) ??
        findEmphasisAfter(possessivePronounMatch.possessedIndex);
      const ownIdx =
        findOwnAfter(possessivePronounMatch.pronounIndex) ??
        findOwnAfter(possessivePronounMatch.possessedIndex);
      const subjectPerson = (() => {
        const explicit = ctx.subjectResults.find(
          (s) => s.personNumber && s.type !== "implied",
        );
        if (explicit?.personNumber) return explicit.personNumber;
        const implied = ctx.subjectResults.find((s) => s.personNumber);
        if (implied?.personNumber) return implied.personNumber;
        const verbToken = ctx.verbResult
          ? ctx.fraseTokens[ctx.verbResult.localIndex]
          : null;
        const verbPerson = verbToken?.verbMatch?.person;
        return verbPerson !== undefined && verbPerson !== null
          ? getImpliedPersonNumber(verbPerson)
          : null;
      })();
      const ownMatchesSubject =
        ownIdx !== null &&
        subjectPerson &&
        subjectPerson === possessivePronounMatch.personNumber;
      // Debug log removed.
      const hasPossessiveEmphasis = emphasisIdx !== null || ownMatchesSubject;
      if (emphasisIdx !== null) {
        skipLocalIndices.add(emphasisIdx);
      }
      if (ownIdx !== null) {
        skipLocalIndices.add(ownIdx);
      }
      const buildEmphaticPossessiveForms = (forms: string[]) => {
        const out: string[] = [];
        const seen = new Set<string>();
        const suffixes = ["wuy", "way"];
        for (const g of forms) {
          for (const suffix of suffixes) {
            const form = suffix === "way" ? `${g}way` : validarFonologia(g + suffix);
            if (seen.has(form)) continue;
            seen.add(form);
            out.push(form);
          }
        }
        return out;
      };
      const useNguPossessive = hasSpecialPossessiveNguContext;
      let possessiveFormsBase = hasPossessiveEmphasis
        ? buildEmphaticPossessiveForms(gupForms)
        : gupForms;
      if (useNguPossessive) {
        const allativeBaseForms =
          ownMatchesSubject || emphasisIdx !== null
            ? HUMAN_ALLATIVE_PRONOUNS_GUP_EMPHATIC[
                possessivePronounMatch.personNumber
              ]
            : HUMAN_ALLATIVE_PRONOUNS_GUP[possessivePronounMatch.personNumber];
        const nguForms = buildNguPossessiveFormsFromPronouns(allativeBaseForms);
        if (nguForms.length > 0) {
          possessiveFormsBase = nguForms;
        }
      }
      let possessiveForms = possessiveFormsBase;
      if (ownMatchesSubject && subjectPerson) {
        const pronounOptions = getPronounOptions(
          subjectPerson,
          ctx.hasDualMarker,
          ctx.mode,
        );
        if (pronounOptions.length > 0) {
          const withSubject: string[] = [];
          const seen = new Set<string>();
          for (const base of possessiveFormsBase) {
            for (const opt of pronounOptions) {
              const form = `${base} ${opt.gup}`;
              if (seen.has(form)) continue;
              seen.add(form);
              withSubject.push(form);
            }
          }
          possessiveForms = [...possessiveFormsBase, ...withSubject];
        }
      }
      const verbLocalIdx = verbResult?.localIndex ?? -1;
      const possessedIsAfterVerb =
        verbLocalIdx >= 0 &&
        possessivePronounMatch.possessedIndex > verbLocalIdx;
      const possessedLexiconEntry = LEXICON.nouns[possessedGup];
      const possessedIsHumanFromToken =
        possessedToken.nounMatch?.isHuman === true;
      const possessedIsHumanFromLexicon =
        possessedLexiconEntry?.isHuman === true;
      const possessedIsHuman =
        possessedIsHumanFromToken || possessedIsHumanFromLexicon;
      const possessedIsUnknownType = possessedToken.type === "unknown";
      const possessedShowOptions =
        possessedIsUnknownType && !possessedIsHumanFromToken;
      const possessedIsPlace = possessedToken.nounMatch?.isPlace === true;
      const possessedIsCause = possessedToken.nounMatch?.isCause;
      const possessedHumanForSuffix = possessedIsUnknownType
        ? undefined
        : possessedIsHuman;
      const possessedNeedsNha =
        isTransitive &&
        possessedIsAfterVerb &&
        (possessedIsHuman || possessedIsUnknownType);
      const possessedIdx = possessivePronounMatch.possessedIndex;
      const pronounIdx = possessivePronounMatch.pronounIndex;

      let finalPossessedGup = possessedGup;
      let possessedSuffix: string | undefined;
      let possessedExplanation = `${possessedGup} (${LANG_CONFIG[mode].possessed})`;
      let possessedNhaOptions:
        | { gup: string; explanation: string }[]
        | undefined;

      let possessedSuffixAlternatives:
        | { gup: string; suffix: string; explanation: string }[]
        | undefined;

      const possessedLocativeOnSelf =
        locativeMatch?.nounIndices.includes(possessedIdx) ?? false;
      const possessedHasLocative =
        possessedLocativeOnSelf ||
        (locativeMatch?.nounIndices.includes(pronounIdx) ?? false);
      const possessedHasInstrumentalSelf =
        context.instrumentalMatch?.nounIndices.includes(possessedIdx) ?? false;
      const possessedHasInstrumental =
        possessedHasInstrumentalSelf ||
        (context.instrumentalMatch?.nounIndices.includes(pronounIdx) ?? false);
      const possessedHasTransportSelf =
        context.transportMatch?.nounIndices.includes(possessedIdx) ?? false;
      const possessedHasTransport =
        possessedHasTransportSelf ||
        (context.transportMatch?.nounIndices.includes(pronounIdx) ?? false);
      const possessedHasAllative =
        motionDestinations?.some(
          (d) => d.nounIdx === possessedIdx || d.nounIdx === pronounIdx,
        ) ?? false;
      const possessedHasContextSuffix =
        possessedLocativeOnSelf ||
        possessedHasInstrumentalSelf ||
        possessedHasTransportSelf ||
        possessedHasAllative;

      let hasContextSuffix = false;
      if (possessedHasContextSuffix) {
        const suffixResult = applySuffixBasedOnContext({
          baseGup: possessedGup,
          localIdx: possessedIdx,
          mode,
          mirriMiriwMatch,
          locativeMatch,
          causativeAgentMatch,
          conWithMatch,
          instrumentalMatch: context.instrumentalMatch,
          belongingMatch: context.belongingMatch,
          transportMatch: context.transportMatch,
          isHuman: possessedHumanForSuffix,
          isCause: possessedIsCause,
          isPlace: possessedIsPlace,
          unknownConWithChoice,
          unknownLocativeChoice,
          hasNegation,
          verbMotionType,
          motionDestinations,
          motionDestinationChoice,
          mirriAlternative,
        });
        if (
          suffixResult.suffix ||
          suffixResult.gup !== possessedGup ||
          (suffixResult.alternatives && suffixResult.alternatives.length > 0)
        ) {
          finalPossessedGup = suffixResult.gup;
          possessedSuffix = suffixResult.suffix;
          possessedExplanation =
            suffixResult.explanation || possessedExplanation;
          possessedSuffixAlternatives = suffixResult.alternatives;
          hasContextSuffix = true;
        }
      }

      if (!hasContextSuffix && possessedNeedsNha) {
        finalPossessedGup = validarFonologia(possessedGup + "nha");
        possessedSuffix = "nha";
        const humanLabel = LANG_CONFIG[mode].nhaPerson;
        possessedExplanation = `${possessedGup} + -nha = ${finalPossessedGup} (${LANG_CONFIG[mode].possessed} + ${humanLabel})`;

        if (possessedShowOptions) {
          possessedSuffixAlternatives = [
            {
              gup: possessedGup,
              suffix: "",
              explanation: `${possessedGup} (${LANG_CONFIG[mode].possessed}, ${LANG_CONFIG[mode].nonHuman})`,
            },
          ];
        }
      }
      const possessedIsAgentTransitive =
        isTransitive && possessedIsHuman && possessedIdx < verbLocalIdx;

      const possessedHasGrammaticalSuffix =
        possessedHasLocative ||
        possessedHasInstrumental ||
        possessedHasTransport ||
        possessedHasAllative ||
        possessedIsAgentTransitive;

      let pronounLabel = useNguPossessive
        ? LANG_CONFIG[mode].possessor
        : LANG_CONFIG[mode].possessive;
      const useAllativePronounForms =
        possessedHasGrammaticalSuffix ||
        (!isTransitive && hasPossessiveEmphasis);
      if (useAllativePronounForms && !useNguPossessive) {
        const useEmphaticAllative = ownMatchesSubject || emphasisIdx !== null;
        const allativeForms = useEmphaticAllative
          ? HUMAN_ALLATIVE_PRONOUNS_GUP_EMPHATIC[possessivePronounMatch.personNumber]
          : HUMAN_ALLATIVE_PRONOUNS_GUP[possessivePronounMatch.personNumber];
        if (allativeForms && allativeForms.length > 0) {
          const baseForms = allativeForms;
          let altForms = baseForms;
          if (ownMatchesSubject && subjectPerson) {
            const pronounOptions = getPronounOptions(
              subjectPerson,
              ctx.hasDualMarker,
              ctx.mode,
            );
            if (pronounOptions.length > 0) {
              const withSubject: string[] = [];
              const seen = new Set<string>();
              for (const base of baseForms) {
                for (const opt of pronounOptions) {
                  const form = `${base} ${opt.gup}`;
                  if (seen.has(form)) continue;
                  seen.add(form);
                  withSubject.push(form);
                }
              }
              altForms = [...baseForms, ...withSubject];
            }
          }
          possessiveForms = altForms;
        }
        pronounLabel = LANG_CONFIG[mode].withPerson;
      }

      const possessiveGup = possessiveForms[0];

      const pronounSuffixAlternatives: {
        gup: string;
        suffix: string;
        explanation: string;
      }[] = [];

      if (possessiveForms.length > 1) {
        for (const form of possessiveForms.slice(1)) {
          const hasSubjectSuffix = form.includes(" ");
          pronounSuffixAlternatives.push({
            gup: form,
            suffix: "",
            explanation: `${possessivePronounMatch.pronounWord} = ${form} (${pronounLabel}${
              hasPossessiveEmphasis ? " + énfasis" : ""
            }${hasSubjectSuffix ? " + sujeto" : ""})`,
          });
        }
      }

      if (
        !possessedHasGrammaticalSuffix &&
        !hasPossessiveEmphasis &&
        !useNguPossessive
      ) {
        const comitativeForms =
          COMITATIVE_PRONOUNS_GUP[possessivePronounMatch.personNumber];
        if (comitativeForms && comitativeForms.length > 0) {
          for (const form of comitativeForms) {
            pronounSuffixAlternatives.push({
              gup: form,
              suffix: "",
              explanation: `${possessivePronounMatch.pronounWord} = ${form} (${LANG_CONFIG[mode].withPerson})`,
            });
          }
        }
      }

      parts.push({
        type: "noun",
        source: `${possessivePronounMatch.pronounWord} (possessive)`,
        sourceWord: possessivePronounMatch.pronounWord,
        gup: possessiveGup,
        explanation: `${possessivePronounMatch.pronounWord} = ${possessiveGup} (${pronounLabel}${
          hasPossessiveEmphasis ? " + énfasis" : ""
        })`,
        suffixAlternatives:
          pronounSuffixAlternatives.length > 0
            ? pronounSuffixAlternatives
            : undefined,
        globalIndex: globalIndices[possessivePronounMatch.pronounIndex],
        role: "possessor" as GrammaticalRole,
        isKnownNoun: false,
      });

      parts.push({
        type: "noun",
        source: `${possessivePronounMatch.possessedWord} (possessed)`,
        sourceWord: possessivePronounMatch.possessedWord,
        gup: finalPossessedGup,
        baseGup: possessedGup,
        appliedSuffix: possessedSuffix,
        explanation: possessedExplanation,
        suffixAlternatives: possessedSuffixAlternatives,
        globalIndex: globalIndices[possessivePronounMatch.possessedIndex],
        role: "possessed" as GrammaticalRole,
        isKnownNoun: possessedToken.type === "noun",
        isHuman: possessedIsHuman || possessedIsUnknownType,
      });

      continue;
    }

    if (possessionMatch && localIdx === possessionMatch.possessorIndex) {
      const verbalNounPossession =
        ctx.verbalNounPossession &&
        ctx.verbalNounPossession.type === "possession" &&
        ctx.verbalNounPossessionAlternative === "source"
          ? ctx.verbalNounPossession
          : null;
      if (verbalNounPossession) {
        const possessorToken = fraseTokens[possessionMatch.possessorIndex];
        const possessorGup = possessorToken.gupKey || possessorToken.original;
        const suffixes = determineHumanCausativeSuffix(possessorGup);
        const possessorSuffix = suffixes[0];
        const possessorWithSuffix = applyHumanCausativeSuffix(
          possessorGup,
          possessorSuffix,
        );
        const possessorAlternatives =
          suffixes.length > 1
            ? suffixes.slice(1).map((s) => ({
                gup: applyHumanCausativeSuffix(possessorGup, s),
                suffix: s,
                explanation: `${possessorGup} + -${s} = ${applyHumanCausativeSuffix(
                  possessorGup,
                  s,
                )} (source/origin)`,
              }))
            : undefined;

        const verbalOptions = verbalNounPossession.verbalNounOptions;
        const primary = verbalOptions[0];
        const altSuffixes =
          verbalOptions.length > 1
            ? verbalOptions.slice(1).map((opt) => ({
                gup: opt.gup,
                suffix: opt.suffix,
                explanation: `${possessionMatch.possessedWord} → ${opt.explanation}`,
              }))
            : undefined;

        parts.push({
          type: "noun",
          source: `${possessionMatch.possessorWord} (possessor)`,
          sourceWord: possessionMatch.possessorWord,
          gup: possessorWithSuffix,
          baseGup: possessorGup,
          appliedSuffix: possessorSuffix,
          explanation: `${possessorGup} + -${possessorSuffix} = ${possessorWithSuffix} (source/origin)`,
          suffixAlternatives: possessorAlternatives,
          globalIndex: globalIndices[possessionMatch.possessorIndex],
          role: "possessor" as GrammaticalRole,
          isKnownNoun: possessorToken.type === "noun",
          isHuman: true,
        });

        parts.push({
          type: "noun",
          source: `${possessionMatch.possessedWord} (possessed)`,
          sourceWord: possessionMatch.possessedWord,
          gup: primary.gup,
          baseGup: primary.gup,
          appliedSuffix: primary.suffix,
          explanation: `${possessionMatch.possessedWord} → ${primary.explanation}`,
          suffixAlternatives: altSuffixes,
          globalIndex: globalIndices[possessionMatch.possessedIndex],
          role: "possessed" as GrammaticalRole,
          isKnownNoun: false,
        });

        possessionHandled.add(possessionMatch.possessorIndex);
        possessionHandled.add(possessionMatch.possessedIndex);
        if (possessionMatch.deIndex !== undefined) {
          possessionHandled.add(possessionMatch.deIndex);
        }
        continue;
      }

      const possessorToken = fraseTokens[possessionMatch.possessorIndex];
      const possessedToken = fraseTokens[possessionMatch.possessedIndex];

      const possessorGup = possessorToken.gupKey || possessorToken.original;
      const possessedGup = possessedToken.gupKey || possessedToken.original;
      let possessorSuffix = "";
      let possessorWithSuffix = possessorGup;
      let possessorExplanation = `${possessorGup} (${LANG_CONFIG[mode].possessor})`;

      const verbLocalIdx = verbResult?.localIndex ?? -1;
      const possessedIsAfterVerb =
        verbLocalIdx >= 0 && possessionMatch.possessedIndex > verbLocalIdx;
      const possessedLexiconEntry = LEXICON.nouns[possessedGup];
      const possessedIsHumanFromToken =
        possessedToken.nounMatch?.isHuman === true;
      const possessedIsHumanFromLexicon =
        possessedLexiconEntry?.isHuman === true;
      const possessedIsHuman =
        possessedIsHumanFromToken || possessedIsHumanFromLexicon;
      const possessedIsUnknownType = possessedToken.type === "unknown";
      const possessedShowOptions =
        possessedIsUnknownType && !possessedIsHumanFromToken;
      const possessedIsPlace = possessedToken.nounMatch?.isPlace === true;
      const possessedIsCause = possessedToken.nounMatch?.isCause;
      const possessedHumanForSuffix = possessedIsUnknownType
        ? undefined
        : possessedIsHuman;
      const possessedNeedsNha =
        isTransitive &&
        possessedIsAfterVerb &&
        (possessedIsHuman || possessedIsUnknownType);
      const possessedNeedsErgative =
        isTransitive &&
        !possessedIsAfterVerb &&
        verbLocalIdx >= 0 &&
        possessedIsHuman;

      let finalPossessedGup = possessedGup;
      let possessedSuffix: string | undefined;
      let possessedExplanation = `${possessedGup} (${LANG_CONFIG[mode].possessed})`;
      let possessedSuffixAlternatives:
        | { gup: string; suffix: string; explanation: string }[]
        | undefined;

      const lastPerlativeTrigger = locativeMatch?.triggerIndices?.length
        ? Math.max(...locativeMatch.triggerIndices)
        : -1;
      const isPerlativePossession =
        locativeMatch?.suffixType === "perlative" &&
        lastPerlativeTrigger >= 0 &&
        possessionMatch.possessedIndex > lastPerlativeTrigger &&
        possessionMatch.possessorIndex > lastPerlativeTrigger;

      const possessedIdx = possessionMatch.possessedIndex;
      const possessedHasLocative =
        locativeMatch?.nounIndices.includes(possessedIdx) ?? false;
      const possessedHasInstrumental =
        context.instrumentalMatch?.nounIndices.includes(possessedIdx) ?? false;
      const possessedHasTransport =
        context.transportMatch?.nounIndices.includes(possessedIdx) ?? false;
      const possessedIsKnownVehicle =
        possessedHasTransport && context.transportMatch?.isKnownVehicle;
      const possessedMotionDest = motionDestinations?.find(
        (d) => d.nounIdx === possessedIdx,
      );
      const possessedHasAllative = !!possessedMotionDest;

      if (isPerlativePossession) {
        const perlativeSuffixes = determinePerlativeSuffix(possessedGup);
        const nonHumanSuffix = perlativeSuffixes[0];
        finalPossessedGup = applyPerlativeSuffix(possessedGup, nonHumanSuffix);
        possessedSuffix = nonHumanSuffix;
        possessedExplanation = `${possessedGup} + -${nonHumanSuffix} = ${finalPossessedGup} (${LANG_CONFIG[mode].perlativeLabel})`;
        possessedSuffixAlternatives =
          perlativeSuffixes.length > 1
            ? perlativeSuffixes.slice(1).map((s) => ({
                gup: applyPerlativeSuffix(possessedGup, s),
                suffix: s,
                explanation: `${possessedGup} + -${s} = ${applyPerlativeSuffix(
                  possessedGup,
                  s,
                )} (${LANG_CONFIG[mode].perlativeLabel})`,
              }))
            : undefined;
      } else if (possessedIsKnownVehicle) {
        const ergResult = applyErgativeSuffix(possessedGup);
        finalPossessedGup = ergResult.suffixed;
        possessedSuffix = ergResult.suffix || "y";
        possessedExplanation = `${possessedGup} + -${possessedSuffix} = ${finalPossessedGup} (${LANG_CONFIG[mode].possessed} + ${LANG_CONFIG[mode].transportLabel})`;
      } else if (possessedHasAllative && possessedMotionDest) {
        const goalDir = possessedMotionDest.goalDirection;
        if (goalDir === "away") {
          finalPossessedGup = applyAblativeSuffix(possessedGup);
          possessedSuffix = "ŋuru";
          possessedExplanation = `${possessedGup} + -ŋuru = ${finalPossessedGup} (${LANG_CONFIG[mode].possessed} + ${LANG_CONFIG[mode].ablativeSuffixLabel})`;
        } else {
          finalPossessedGup = applyAllativeSuffix(possessedGup);
          possessedSuffix = "lili";
          possessedExplanation = `${possessedGup} + -lili = ${finalPossessedGup} (${LANG_CONFIG[mode].possessed} + ${LANG_CONFIG[mode].allativeSuffixLabel})`;
        }
      } else if (possessedHasLocative) {
        const suffixResult = applySuffixBasedOnContext({
          baseGup: possessedGup,
          localIdx: possessedIdx,
          mode,
          mirriMiriwMatch,
          locativeMatch,
          causativeAgentMatch,
          conWithMatch,
          instrumentalMatch: context.instrumentalMatch,
          belongingMatch: context.belongingMatch,
          transportMatch: context.transportMatch,
          isHuman: possessedHumanForSuffix,
          isCause: possessedIsCause,
          isPlace: possessedIsPlace,
          unknownConWithChoice,
          unknownLocativeChoice,
          hasNegation,
          verbMotionType,
          motionDestinations,
          motionDestinationChoice,
          mirriAlternative,
        });
        if (
          suffixResult.suffix ||
          suffixResult.gup !== possessedGup ||
          (suffixResult.alternatives && suffixResult.alternatives.length > 0)
        ) {
          finalPossessedGup = suffixResult.gup;
          possessedSuffix = suffixResult.suffix;
          possessedExplanation =
            suffixResult.explanation || possessedExplanation;
          possessedSuffixAlternatives = suffixResult.alternatives;
        } else {
          finalPossessedGup = applyLocativeSuffix(possessedGup);
          possessedSuffix = "ŋura";
          possessedExplanation = `${possessedGup} + -ŋura = ${finalPossessedGup} (${LANG_CONFIG[mode].possessed} + ${LANG_CONFIG[mode].locativeSuffix})`;
        }
      } else if (possessedNeedsErgative) {
        const ergResult = applyErgativeSuffix(possessedGup);
        finalPossessedGup = ergResult.suffixed;
        possessedSuffix = ergResult.suffix || "thu";
        possessedExplanation = `${possessedGup} + -${possessedSuffix} = ${finalPossessedGup} (${LANG_CONFIG[mode].possessed} + ${LANG_CONFIG[mode].ergative})`;
      } else if (possessedNeedsNha) {
        finalPossessedGup = validarFonologia(possessedGup + "nha");
        possessedSuffix = "nha";
        const humanLabel = LANG_CONFIG[mode].nhaPerson;
        possessedExplanation = `${possessedGup} + -nha = ${finalPossessedGup} (${LANG_CONFIG[mode].possessed} + ${humanLabel})`;

        if (possessedShowOptions) {
          possessedSuffixAlternatives = [
            {
              gup: possessedGup,
              suffix: "",
              explanation: `${possessedGup} (${LANG_CONFIG[mode].possessed}, ${LANG_CONFIG[mode].nonHuman})`,
            },
          ];
        }
      }
      const possessedIsAgentTransitive =
        isTransitive &&
        possessedIsHuman &&
        possessionMatch.possessedIndex < verbLocalIdx;

      const possessedHasGrammaticalSuffix =
        possessedHasLocative ||
        possessedHasInstrumental ||
        possessedHasTransport ||
        possessedHasAllative ||
        possessedIsAgentTransitive;

      const possessorAlternatives: {
        gup: string;
        suffix: string;
        explanation: string;
      }[] = [];

      if (hasSpecialPossessiveNguContext) {
        const nguOptions = buildNguPossessiveOptionsFromBase(possessorGup);
        if (nguOptions.length > 0) {
          const primary = nguOptions[0];
          possessorWithSuffix = primary.gup;
          possessorSuffix = primary.suffix;
          possessorExplanation = primary.explanation;
          possessorAlternatives.push(...nguOptions.slice(1));
        }
      } else {
        const suffixResult = determinePossessiveSuffix(possessorGup, mode);
        possessorSuffix = suffixResult.suffixes[0];
        possessorWithSuffix =
          suffixResult.suffixes.length > 0
            ? applyPossessiveSuffix(
                possessorGup,
                possessorSuffix as "wa" | "wu" | "ku" | "gu",
              )
            : possessorGup;
        possessorExplanation = `${possessorGup} + -${possessorSuffix} = ${possessorWithSuffix} (${LANG_CONFIG[mode].possessor})`;

        if (isPerlativePossession) {
          const humanAssocSuffixes =
            determineHumanAssociativeSuffix(possessorGup);
          const humanOptions: {
            gup: string;
            suffix: string;
            explanation: string;
          }[] = [];
          for (const hs of humanAssocSuffixes) {
            const humanBase =
              applyHumanAssociativeSuffix(possessorGup, hs) + "ŋu";
            const wurruGup = applyPerlativeSuffix(humanBase, "wurru");
            const kurruGup = applyPerlativeSuffix(humanBase, "kurru");
            humanOptions.push({
              gup: wurruGup,
              suffix: `${hs}ŋuwurru`,
              explanation: `${possessorGup} + -${hs}ŋuwurru = ${wurruGup} (${LANG_CONFIG[mode].perlativeLabel})`,
            });
            humanOptions.push({
              gup: kurruGup,
              suffix: `${hs}ŋukurru`,
              explanation: `${possessorGup} + -${hs}ŋukurru = ${kurruGup} (${LANG_CONFIG[mode].perlativeLabel})`,
            });
          }
          if (humanOptions.length > 0) {
            const primary = humanOptions[0];
            possessorWithSuffix = primary.gup;
            possessorSuffix = primary.suffix;
            possessorExplanation = primary.explanation;
            possessorAlternatives.push(...humanOptions.slice(1));
          }
        } else if (possessedHasGrammaticalSuffix) {
          const humanAssocSuffixes =
            determineHumanAssociativeSuffix(possessorGup);
          const humanOptions: {
            gup: string;
            suffix: string;
            explanation: string;
          }[] = humanAssocSuffixes.map((s) => {
            const assocGup = applyHumanAssociativeSuffix(possessorGup, s);
            return {
              gup: assocGup,
              suffix: s,
              explanation: `${possessorGup} + -${s} = ${assocGup} (${LANG_CONFIG[mode].withPerson})`,
            };
          });
          if (humanOptions.length > 0) {
            const primary = humanOptions[0];
            possessorWithSuffix = primary.gup;
            possessorSuffix = primary.suffix;
            possessorExplanation = primary.explanation;
            possessorAlternatives.push(...humanOptions.slice(1));
          }
        } else {
          if (suffixResult.suffixes.length > 1) {
            for (const s of suffixResult.suffixes.slice(1)) {
              possessorAlternatives.push({
                gup: applyPossessiveSuffix(possessorGup, s),
                suffix: s,
                explanation: `${possessorGup} + -${s} = ${applyPossessiveSuffix(
                  possessorGup,
                  s,
                )} (${LANG_CONFIG[mode].possessor})`,
              });
            }
          }

          const possessorIsHuman = possessorToken.nounMatch?.isHuman === true;
          if (!possessorIsHuman) {
            const belongingSuffixResult = determineBelongingSuffix(
              possessorGup,
              mode,
            );
            for (const s of belongingSuffixResult.suffixes) {
              const belongingGup = applyBelongingSuffix(possessorGup, s);
              possessorAlternatives.push({
                gup: belongingGup,
                suffix: s,
                explanation: `${possessorGup} + -${s} = ${belongingGup} (${LANG_CONFIG[mode].belongingLabel})`,
              });
            }
          }
        }
      }

      parts.push({
        type: "noun",
        source: `${possessionMatch.possessorWord} (possessor)`,
        sourceWord: possessionMatch.possessorWord,
        gup: possessorWithSuffix,
        baseGup: possessorGup,
        appliedSuffix: possessorSuffix,
        explanation: possessorExplanation,
        suffixAlternatives:
          possessorAlternatives.length > 0 ? possessorAlternatives : undefined,
        globalIndex: globalIndices[possessionMatch.possessorIndex],
        role: "possessor" as GrammaticalRole,
        isKnownNoun: possessorToken.type === "noun",
      });

      parts.push({
        type: "noun",
        source: `${possessionMatch.possessedWord} (possessed)`,
        sourceWord: possessionMatch.possessedWord,
        gup: finalPossessedGup,
        baseGup: possessedGup,
        appliedSuffix: possessedSuffix,
        explanation: possessedExplanation,
        suffixAlternatives: possessedSuffixAlternatives,
        globalIndex: globalIndices[possessionMatch.possessedIndex],
        role: "possessed" as GrammaticalRole,
        isKnownNoun: possessedToken.type === "noun",
        isHuman: possessedIsHuman || possessedIsUnknownType,
      });

      possessionHandled.add(possessionMatch.possessorIndex);
      possessionHandled.add(possessionMatch.possessedIndex);
      continue;
    }

    if (possessionMatch && localIdx === possessionMatch.possessedIndex) {
      continue;
    }

    const fixedMatch = fixedMatchByStartIndex.get(localIdx);
    if (fixedMatch) {
      parts.push({
        type: fixedMatch.entry.type === "phrase" ? "particle" : "adjective",
        source: fixedMatch.source,
        gup: fixedMatch.entry.gup,
        explanation: fixedMatch.entry[LANG_CONFIG[mode].explainKey],
        globalIndex: globalIdx,
      });
      continue;
    }

    if (fixedIndices.has(localIdx)) {
      continue;
    }

    const subjectResult = subjectByIndex.get(localIdx);
    if (subjectResult) {
      if (
        verbAltOverrideEffective?.gup.startsWith("ŋarra ") &&
        subjectResult.personNumber === "1_Sing"
      ) {
        continue;
      }
      if (
        mirriAlternative?.type === "subject-possessive" &&
        mirriAlternative.subjectLocalIndex === localIdx
      ) {
        continue;
      }
      const hasVerb = verbResult !== null;
      const subjectRole: GrammaticalRole = !hasVerb
        ? "verbless"
        : isTransitive
          ? "subject_transitive"
          : "subject_intransitive";

      const baseGup = subjectResult.baseGup || subjectResult.gup;
      const subjectToken =
        subjectResult.localIndex >= 0
          ? fraseTokens[subjectResult.localIndex]
          : null;
      const suffixResult = applySuffixBasedOnContext({
        baseGup,
        localIdx,
        mode,
        mirriMiriwMatch,
        locativeMatch,
        causativeAgentMatch,
        conWithMatch,
        instrumentalMatch: context.instrumentalMatch,
        belongingMatch: context.belongingMatch,
        transportMatch: context.transportMatch,
        isHuman: subjectResult.isHuman,
        isCause: subjectToken?.nounMatch?.isCause,
        unknownConWithChoice,
        unknownLocativeChoice,
        hasNegation,
        verbMotionType,
        motionDestinations,
        motionDestinationChoice,
        mirriAlternative,
      });

      const finalGup =
        suffixResult.gup !== baseGup ? suffixResult.gup : subjectResult.gup;
      const appliedSuffix =
        suffixResult.suffix || subjectResult.ergativeSuffix || undefined;
      const finalExplanation =
        suffixResult.explanation || subjectResult.explanation;
      let suffixAlternatives = suffixResult.alternatives;
      if (subjectResult.type === "noun") {
        const relatedMatches = findRelatedNounVerbs(subjectResult.source, mode);
        const relatedOptions =
          relatedMatches.length > 0
            ? buildRelatedNounOptions(relatedMatches)
            : [];
        if (relatedOptions.length > 0) {
          const relatedAlternatives = relatedOptions.map((opt) => ({
            gup: opt.gup,
            suffix: opt.suffix,
            explanation: `${subjectResult.source} → ${opt.explanation}`,
          }));
          suffixAlternatives = mergeSuffixAlternatives(
            suffixAlternatives,
            relatedAlternatives,
          );
        }
        const verbalMatches = findVerbalNounVerbs(subjectResult.source, mode);
        const verbalOptions =
          verbalMatches.length > 0
            ? buildVerbalNounOptions(verbalMatches, mode)
            : [];
        if (verbalOptions.length > 0) {
          const verbalAlternatives = verbalOptions.map((opt) => ({
            gup: opt.gup,
            suffix: opt.suffix,
            explanation: `${subjectResult.source} → ${opt.explanation}`,
          }));
          suffixAlternatives = mergeSuffixAlternatives(
            suffixAlternatives,
            verbalAlternatives,
          );
        }
      }

      parts.push({
        type: "subject",
        source: subjectResult.source,
        gup: finalGup,
        baseGup: subjectResult.baseGup,
        appliedSuffix,
        explanation: finalExplanation,
        meaningKey:
          subjectResult.options.length > 1
            ? `pronoun:${
                subjectResult.personNumber ??
                subjectResult.options[0]?.personNumber ??
                "unknown"
              }`
            : undefined,
        suffixAlternatives,
        globalIndex: globalIdx,
        role: subjectRole,
        isKnownNoun: subjectResult.type === "noun",
        isHuman: subjectResult.isHuman,
        irregularPlurals: subjectResult.irregularPlurals,
        isPlural: subjectResult.isPlural,
      });
      continue;
    }

    if (normalizeToken(token.original) === "casa") {
      const obj = objectByIndex.get(localIdx);
    }

    const objectResult = objectByIndex.get(localIdx);
    if (objectResult) {
      const objectSourceLower = objectResult.source.toLowerCase();
      const { definiteArticles, pluralArticles, skipWords } = LANG_CONFIG[mode];
      const allArticles = new Set([
        ...definiteArticles,
        ...pluralArticles,
        ...skipWords,
      ]);
      if (
        allArticles.has(objectSourceLower) &&
        objectResult.type !== "pronoun"
      ) {
        continue;
      }

      const baseGup = objectResult.baseGup || objectResult.gup;
      const objectToken =
        objectResult.localIndex >= 0
          ? fraseTokens[objectResult.localIndex]
          : null;
      const suffixResult = applySuffixBasedOnContext({
        baseGup,
        localIdx,
        mode,
        mirriMiriwMatch,
        locativeMatch,
        causativeAgentMatch,
        conWithMatch,
        instrumentalMatch: context.instrumentalMatch,
        belongingMatch: context.belongingMatch,
        transportMatch: context.transportMatch,
        isObject: true,
        isHuman: objectResult.isHuman ?? undefined,
        isCause: objectToken?.nounMatch?.isCause,
        unknownConWithChoice,
        unknownLocativeChoice,
        hasNegation,
        verbMotionType,
        motionDestinations,
        motionDestinationChoice,
        mirriAlternative,
      });

      let finalGup: string;
      let appliedSuffix: string | undefined;
      if (mirriAlternative?.type === "subject-possessive") {
        finalGup = baseGup;
        appliedSuffix = undefined;
      } else {
        finalGup =
          suffixResult.gup !== baseGup ? suffixResult.gup : objectResult.gup;
        appliedSuffix =
          suffixResult.suffix || (objectResult.hasNha ? "nha" : undefined);
      }
      const finalExplanation =
        suffixResult.explanation || objectResult.explanation;
      let suffixAlternatives = suffixResult.alternatives;
      const relatedMatches = findRelatedNounVerbs(objectResult.source, mode);
      const relatedOptions =
        relatedMatches.length > 0
          ? buildRelatedNounOptions(relatedMatches)
          : [];

      if (relatedOptions.length > 0) {
        const relatedAlternatives = relatedOptions.map((opt) => ({
          gup: opt.gup,
          suffix: opt.suffix,
          explanation: `${objectResult.source} → ${opt.explanation}`,
        }));
        suffixAlternatives = mergeSuffixAlternatives(
          suffixAlternatives,
          relatedAlternatives,
        );
      }
      const verbalMatches = findVerbalNounVerbs(objectResult.source, mode);
      const verbalOptions =
        verbalMatches.length > 0
          ? buildVerbalNounOptions(verbalMatches, mode)
          : [];
      if (verbalOptions.length > 0) {
        const verbalAlternatives = verbalOptions.map((opt) => ({
          gup: opt.gup,
          suffix: opt.suffix,
          explanation: `${objectResult.source} → ${opt.explanation}`,
        }));
        suffixAlternatives = mergeSuffixAlternatives(
          suffixAlternatives,
          verbalAlternatives,
        );
      }

      const shouldGroupObjectPronoun =
        objectResult.options.length > 1 && objectResult.gup !== "";
      parts.push({
        type: "object",
        source: objectResult.source,
        gup: finalGup,
        baseGup: objectResult.baseGup || objectResult.gup,
        appliedSuffix,
        explanation: finalExplanation,
        meaningKey: shouldGroupObjectPronoun
          ? `pronoun:${(objectResult.pronounTypes || ["unknown"]).join("|")}`
          : undefined,
        objectOptions:
          objectResult.options.length > 0 ? objectResult.options : undefined,
        suffixAlternatives,
        globalIndex: globalIdx,
        role: "object",
        isHuman: objectResult.isHuman ?? undefined,
        isKnownNoun: objectResult.type === "noun",
        irregularPlurals: objectResult.irregularPlurals,
        isPlural: objectResult.isPlural,
      });
      continue;
    }

    const questionType = context.questionMatch?.type;
    const skipOptionalDirection =
      questionType === "where_to" || questionType === "where_from";
    const effectiveVerbResult = useIrLiteral ? null : verbResult;
    if (
      ctx.fraseTokens.some((t) =>
        (LANG_CONFIG[ctx.mode].possessiveOwnTriggers || []).some((w) =>
          t.original
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .includes(
              w
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase(),
            ),
        ),
      )
    ) {
      // Debug log removed.
    }
    const verbAltIndex =
      effectiveVerbResult?.localIndex ??
      ctx.ngarraMatch?.verbIndex ??
      ctx.mindIfMatch?.verbIndex ??
      ctx.mightMatch?.verbIndex ??
      -1;
    const effectiveLocativeMatch =
      !shouldUseLocativeVerbMatch && locativeMatch?.verbIndices
        ? { ...locativeMatch, verbIndices: [] }
        : locativeMatch;

    const isInLocativeVerbIndices =
      locativeMatch?.verbIndices?.includes(localIdx) || false;
    const willOutputVerb =
      token.type === "verb" &&
      token.verbMatch &&
      ((effectiveVerbResult &&
        localIdx === effectiveVerbResult.localIndex &&
        !locativeVerbChoice &&
        !isInLocativeVerbIndices) ||
        (!effectiveVerbResult &&
          verbAltOverrideEffective &&
          verbAltIndex !== null &&
          verbAltIndex >= 0 &&
          localIdx === verbAltIndex &&
          !locativeVerbChoice &&
          !isInLocativeVerbIndices));
    if (willOutputVerb) {
      maybeInsertImpliedSubjectForVerb(localIdx);
    }

    const tokenParts = tokenToParts(
      token,
      localIdx,
      effectiveVerbResult,
      globalIdx,
      hasDualMarker,
      mirriMiriwMatch,
      mode,
      effectiveLocativeMatch,
      context.causativeAgentMatch,
      conWithMatch,
      context.instrumentalMatch,
      context.belongingMatch,
      context.transportMatch,
      unknownConWithChoice,
      unknownLocativeChoice,
      hasNegation,
      verbMotionType,
      motionDestinations,
      motionDestinationChoice,
      skipOptionalDirection ? null : motionDirection,
      mirriAlternative,
      locativeVerbChoice,
      verbAltIndex,
      verbAltOverrideEffective,
    );

    parts.push(...tokenParts);
  }

  if (comitativePronounMatch) {
    const gupForms = comitativePronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx =
      globalIndices[comitativePronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms.slice(1).map((g) => ({
            gup: g,
            suffix: "",
            explanation: `${comitativePronounMatch.triggerPhrase} → ${g}`,
          }))
        : undefined;

    parts.push({
      type: "noun",
      source: comitativePronounMatch.triggerPhrase,
      gup: firstGup,
      explanation: `"${comitativePronounMatch.triggerPhrase}" → ${firstGup} (comitative pronoun)`,
      suffixAlternatives: suffixAlts,
      globalIndex: globalIdx,
      role: "comitative" as GrammaticalRole,
      isHuman: true,
    });
  }

  if (humanAllativePronounMatch) {
    const gupForms = humanAllativePronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx =
      globalIndices[humanAllativePronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms.slice(1).map((g) => ({
            gup: g,
            suffix: "",
            explanation: `${humanAllativePronounMatch.triggerPhrase} → ${g}`,
          }))
        : undefined;

    parts.push({
      type: "noun",
      source: humanAllativePronounMatch.triggerPhrase,
      gup: firstGup,
      explanation: `"${humanAllativePronounMatch.triggerPhrase}" → ${firstGup} (human allative pronoun)`,
      suffixAlternatives: suffixAlts,
      globalIndex: globalIdx,
      role: "humanAllative" as GrammaticalRole,
      isHuman: true,
    });
  }

  if (humanAblativePronounMatch) {
    const gupForms = humanAblativePronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx =
      globalIndices[humanAblativePronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms.slice(1).map((g) => ({
            gup: g,
            suffix: "",
            explanation: `${humanAblativePronounMatch.triggerPhrase} → ${g}`,
          }))
        : undefined;

    parts.push({
      type: "noun",
      source: humanAblativePronounMatch.triggerPhrase,
      gup: firstGup,
      explanation: `"${humanAblativePronounMatch.triggerPhrase}" → ${firstGup} (human ablative pronoun)`,
      suffixAlternatives: suffixAlts,
      globalIndex: globalIdx,
      role: "humanAblative" as GrammaticalRole,
      isHuman: true,
    });
  }

  if (humanPerlativePronounMatch) {
    const gupForms = humanPerlativePronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx =
      globalIndices[humanPerlativePronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms.slice(1).map((g) => ({
            gup: g,
            suffix: "",
            explanation: `${humanPerlativePronounMatch.triggerPhrase} → ${g}`,
          }))
        : undefined;

    parts.push({
      type: "noun",
      source: humanPerlativePronounMatch.triggerPhrase,
      gup: firstGup,
      explanation: `"${humanPerlativePronounMatch.triggerPhrase}" → ${firstGup} (human perlative pronoun)`,
      suffixAlternatives: suffixAlts,
      globalIndex: globalIdx,
      role: "humanPerlative" as GrammaticalRole,
      isHuman: true,
    });
  }

  if (sourceOriginPronounMatch && verbResult) {
    const gupForms = sourceOriginPronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx =
      globalIndices[sourceOriginPronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms.slice(1).map((g) => ({
            gup: g,
            suffix: "",
            explanation: `${sourceOriginPronounMatch.triggerPhrase} → ${g}`,
          }))
        : undefined;

    parts.push({
      type: "noun",
      source: sourceOriginPronounMatch.triggerPhrase,
      gup: firstGup,
      explanation: `"${sourceOriginPronounMatch.triggerPhrase}" → ${firstGup} (source/origin pronoun)`,
      suffixAlternatives: suffixAlts,
      globalIndex: globalIdx,
      role: "sourceOrigin" as GrammaticalRole,
      isHuman: true,
    });
  }

  if (causePronounMatch) {
    const gupForms = causePronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx = globalIndices[causePronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms.slice(1).map((g) => ({
            gup: g,
            suffix: "",
            explanation: `${causePronounMatch.triggerPhrase} → ${g}`,
          }))
        : undefined;

    parts.push({
      type: "noun",
      source: causePronounMatch.triggerPhrase,
      gup: firstGup,
      explanation: `"${causePronounMatch.triggerPhrase}" → ${firstGup} (cause pronoun)`,
      suffixAlternatives: suffixAlts,
      globalIndex: globalIdx,
      role: "cause" as GrammaticalRole,
      isHuman: true,
    });
  }

  if (purposePronounMatch && !indirectObjectMatch) {
    const gupForms = purposePronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx = globalIndices[purposePronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms.slice(1).map((g) => ({
            gup: g,
            suffix: "",
            explanation: `${purposePronounMatch.triggerPhrase} → ${g}`,
          }))
        : undefined;

    parts.push({
      type: "noun",
      source: purposePronounMatch.triggerPhrase,
      gup: firstGup,
      explanation: `"${purposePronounMatch.triggerPhrase}" → ${firstGup} (purpose pronoun)`,
      suffixAlternatives: suffixAlts,
      globalIndex: globalIdx,
      role: "purpose" as GrammaticalRole,
      isHuman: true,
    });
  }

  if (indirectObjectMatch) {
    const { personNumber, nounWord, triggerWord, triggerIndex, nounIndex } =
      indirectObjectMatch;
    const globalIdx = globalIndices[triggerIndex] || 0;
    const { indirectObjectLabel } = LANG_CONFIG[mode];
    const objectEmphasis = detectObjectEmphasisTriggers(fraseTokens, mode);
    const objectTypeToPerson: Record<ObjectPronounType, PersonNumber> = {
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

    if (personNumber) {
      const possessiveForms = POSSESSIVE_PRONOUNS_GUP[personNumber];
      if (possessiveForms && possessiveForms.length > 0) {
        const shouldEmphasize =
          objectEmphasis.hasGenericEmphasis ||
          Array.from(objectEmphasis.emphaticTypes).some(
            (t) => objectTypeToPerson[t] === personNumber,
          );
        const resolvedForms = shouldEmphasize
          ? (() => {
              const out: string[] = [];
              const seen = new Set<string>();
              const suffixes = ["wuy", "way"];
              for (const g of possessiveForms) {
                for (const suffix of suffixes) {
                  const form =
                    suffix === "way" ? `${g}way` : validarFonologia(g + suffix);
                  if (seen.has(form)) continue;
                  seen.add(form);
                  out.push(form);
                }
              }
              return out;
            })()
          : possessiveForms;
        const firstGup = resolvedForms[0];
        const suffixAlts =
          resolvedForms.length > 1
            ? resolvedForms.slice(1).map((g) => ({
                gup: g,
                suffix: "",
                explanation: `${triggerWord} → ${g}`,
              }))
            : undefined;

        parts.push({
          type: "noun",
          source: nounWord || triggerWord,
          gup: firstGup,
          explanation: `"${
            nounWord || triggerWord
          }" → ${firstGup} (${indirectObjectLabel}${
            shouldEmphasize ? " + énfasis" : ""
          })`,
          suffixAlternatives: suffixAlts,
          globalIndex:
            nounIndex !== null
              ? globalIndices[nounIndex] || globalIdx
              : globalIdx,
          role: "indirectObject" as GrammaticalRole,
          isHuman: true,
        });
      }
    } else if (nounWord) {
      const nounToken = fraseTokens.find(
        (t) => t.original.toLowerCase() === nounWord.toLowerCase(),
      );
      let baseGup = nounWord;
      if (nounToken?.nounMatch) {
        baseGup = nounToken.nounMatch.gupKey;
      }
      const suffixResult = determinePossessiveSuffix(baseGup, mode);
      const suffix = suffixResult.suffixes[0];
      const suffixedGup = applyPossessiveSuffix(baseGup, suffix);

      parts.push({
        type: "noun",
        source: nounWord,
        gup: suffixedGup,
        explanation: `"${nounWord}" → ${baseGup} + -${suffix} = ${suffixedGup} (${indirectObjectLabel})`,
        globalIndex:
          nounIndex !== null
            ? globalIndices[nounIndex] || globalIdx
            : globalIdx,
        role: "indirectObject" as GrammaticalRole,
        isHuman: true,
      });
    }
  }
}

function getCliticGup(
  clitic: string,
  hasDualMarker: boolean = false,
  mode: LanguageMode,
): {
  gup: string;
  explanation: string;
  options: { gup: string; explanation: string }[];
} | null {
  let cliticKey = clitic;
  if (clitic.length > 2) {
    const lastTwo = clitic.slice(-2);
    if (OBJECT_PRONOUN_TRIGGERS_ES[lastTwo]) {
      cliticKey = lastTwo;
    } else {
      const lastThree = clitic.slice(-3);
      if (OBJECT_PRONOUN_TRIGGERS_ES[lastThree]) {
        cliticKey = lastThree;
      }
    }
  }
  const rawTypes = OBJECT_PRONOUN_TRIGGERS_ES[cliticKey];
  if (!rawTypes || rawTypes.length === 0) return null;

  const types = filterTypesByDual(rawTypes, hasDualMarker);
  const firstInfo = OBJECT_PRONOUNS_GUP[types[0]];
  if (!firstInfo) return null;

  const options: { gup: string; explanation: string }[] = [];
  for (const t of types) {
    const info = OBJECT_PRONOUNS_GUP[t];
    if (info) {
      options.push({
        gup: info.gup,
        explanation: info.explanation,
      });
      for (const alt of info.alternatives) {
        options.push({
          gup: alt,
          explanation: `${alt} (${LANG_CONFIG[mode].alternative})`,
        });
      }
    }
  }

  options.push({
    gup: "",
    explanation: LANG_CONFIG[mode].noPronounForThings,
  });

  return {
    gup: firstInfo.gup,
    explanation: firstInfo.explanation,
    options,
  };
}

function getVerbalNounBases(entry: VerbEntry, verbKey: string): string[] {
  const forms = entry.forms || [];
  const base3 = forms[3] || forms[2] || forms[0] || verbKey;
  const base4 = forms.length > 4 ? forms[4] : undefined;
  const bases = [base3];
  if (base4 && base4 !== base3) bases.push(base4);
  return bases;
}

function findRelatedNounVerbs(
  word: string,
  mode: LanguageMode,
): { verbKey: string; entry: VerbEntry }[] {
  const normalized = normalizeToken(word);

  const matches: { verbKey: string; entry: VerbEntry }[] = [];
  for (const [verbKey, entry] of Object.entries(LEXICON.verbs)) {
    const list = entry.relatedNouns?.[mode] || [];
    for (const form of list) {
      if (normalizeToken(form) === normalized) {
        matches.push({ verbKey, entry });
        break;
      }
    }
  }

  return matches;
}

function buildRelatedNounOptions(
  matches: { verbKey: string; entry: VerbEntry }[],
): { gup: string; suffix: string; explanation: string }[] {
  const options: { gup: string; suffix: string; explanation: string }[] = [];
  for (const { verbKey, entry } of matches) {
    const bases = getVerbalNounBases(entry, verbKey);
    for (const base of bases) {
      const gup = `${base}mirri`;
      options.push({
        gup,
        suffix: "mirri",
        explanation: `${base} + -mirri`,
      });
    }
  }
  const seen = new Set<string>();
  return options.filter((opt) => {
    const key = `${opt.gup}|${opt.suffix}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findRelatedAdjectiveVerbs(
  word: string,
  mode: LanguageMode,
): { verbKey: string; entry: VerbEntry }[] {
  const normalized = normalizeToken(word);
  const matches: { verbKey: string; entry: VerbEntry }[] = [];
  for (const [verbKey, entry] of Object.entries(LEXICON.verbs)) {
    const list = entry.relatedAdjectives?.[mode] || [];
    for (const form of list) {
      if (normalizeToken(form) === normalized) {
        matches.push({ verbKey, entry });
        break;
      }
    }
  }
  return matches;
}

function buildRelatedAdjectiveOptions(
  matches: { verbKey: string; entry: VerbEntry }[],
  suffixType: "mirri" | "miriw",
): { gup: string; suffix: string; explanation: string }[] {
  const options: { gup: string; suffix: string; explanation: string }[] = [];
  for (const { verbKey, entry } of matches) {
    const bases = getVerbalNounBases(entry, verbKey);
    for (const base of bases) {
      const gup = `${base}${suffixType}`;
      options.push({
        gup,
        suffix: suffixType,
        explanation: `${base} + -${suffixType}`,
      });
    }
  }
  const seen = new Set<string>();
  return options.filter((opt) => {
    const key = `${opt.gup}|${opt.suffix}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeSuffixAlternatives(
  primary: { gup: string; suffix: string; explanation: string }[] | undefined,
  extras: { gup: string; suffix: string; explanation: string }[],
): { gup: string; suffix: string; explanation: string }[] | undefined {
  if (!extras.length && (!primary || primary.length === 0)) return primary;
  const combined = [...(primary || []), ...extras];
  const seen = new Set<string>();
  const out: { gup: string; suffix: string; explanation: string }[] = [];
  for (const item of combined) {
    const key = `${item.gup}|${item.suffix}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

function findVerbalNounVerbs(
  word: string,
  mode: LanguageMode,
): { verbKey: string; entry: VerbEntry }[] {
  const normalized = normalizeToken(word);

  const matches: { verbKey: string; entry: VerbEntry }[] = [];
  for (const [verbKey, entry] of Object.entries(LEXICON.verbs)) {
    const list = entry.verbalNouns?.[mode] || [];
    for (const form of list) {
      if (normalizeToken(form) === normalized) {
        matches.push({ verbKey, entry });
        break;
      }
    }
  }

  return matches;
}

function buildVerbalNounOptions(
  matches: { verbKey: string; entry: VerbEntry }[],
  mode: LanguageMode,
): { gup: string; suffix: string; explanation: string }[] {
  const options: { gup: string; suffix: string; explanation: string }[] = [];
  for (const { verbKey, entry } of matches) {
    const bases = getVerbalNounBases(entry, verbKey);
    for (const base of bases) {
      const suffixRes = determineBelongingSuffix(base, mode);
      for (const s of suffixRes.suffixes) {
        const gup = applyBelongingSuffix(base, s);
        options.push({
          gup,
          suffix: s,
          explanation: `${base} + -${s}`,
        });
      }
      options.push({
        gup: base,
        suffix: "∅",
        explanation: `${base} (sin sufijo)`,
      });
    }
  }
  const seen = new Set<string>();
  return options.filter((opt) => {
    if (seen.has(opt.gup)) return false;
    seen.add(opt.gup);
    return true;
  });
}

function tokenToParts(
  token: Token,
  localIdx: number,
  verbResult: { results: VerbRuleResult[]; localIndex: number } | null,
  globalIdx: number,
  hasDualMarker: boolean = false,
  mirriMiriwMatch: MirriMiriwMatch | null = null,
  mode: LanguageMode,
  locativeMatch: LocativeMatch | null = null,
  causativeAgentMatch: CausativeAgentMatch | null = null,
  conWithMatch: ConWithMatch | null = null,
  instrumentalMatch: InstrumentalMatch | null = null,
  belongingMatch: BelongingMatch | null = null,
  transportMatch: TransportMatch | null = null,
  unknownConWithChoice: UnknownConWithChoice = null,
  unknownLocativeChoice: UnknownLocativeChoice = null,
  hasNegation: boolean = false,
  verbMotionType?: "motion" | "stationary",
  motionDestinations?: MotionDestination[],
  motionDestinationChoice?: UnknownConWithChoice,
  motionDirection: MotionDirection = null,
  mirriAlternative?:
    | { type: "object-mirri" }
    | {
        type: "subject-possessive";
        possessiveForm: string;
        subjectLocalIndex: number;
      },
  locativeVerbChoice: LocativeVerbResult | null = null,
  verbAltOverrideIndex: number | null = null,
  verbAltOverride: VerbRuleResult | null = null,
): TranslationPart[] {
  const { definiteArticles, pluralArticles, skipWords } = LANG_CONFIG[mode];
  const tokenLower = token.original.toLowerCase();
  const allArticles = new Set([
    ...definiteArticles,
    ...pluralArticles,
    ...skipWords,
  ]);
  if (token.type === "unknown" && allArticles.has(tokenLower)) {
    return [];
  }

  const verbalNounMatches =
    token.type === "noun" || token.type === "unknown"
      ? findVerbalNounVerbs(token.original, mode)
      : [];
  const verbalNounOptions =
    verbalNounMatches.length > 0
      ? buildVerbalNounOptions(verbalNounMatches, mode)
      : [];
  const relatedNounMatches =
    token.type === "noun" || token.type === "unknown"
      ? findRelatedNounVerbs(token.original, mode)
      : [];
  const relatedNounOptions =
    relatedNounMatches.length > 0
      ? buildRelatedNounOptions(relatedNounMatches)
      : [];
  const relatedAdjectiveMatches =
    token.type === "adjective" || token.type === "unknown"
      ? findRelatedAdjectiveVerbs(token.original, mode)
      : [];
  const relatedAdjectiveOptions =
    relatedAdjectiveMatches.length > 0
      ? buildRelatedAdjectiveOptions(
          relatedAdjectiveMatches,
          hasNegation ? "miriw" : "mirri",
        )
      : [];

  if (token.type === "verb") {
    const isInLocativeNouns = locativeMatch?.nounIndices.includes(localIdx);
    const isInBelongingNouns =
      belongingMatch?.belongsToNounIndices.includes(localIdx);
    const isInConWithNouns = conWithMatch?.nounIndices.includes(localIdx);
    const isInInstrumentalNouns =
      instrumentalMatch?.nounIndices.includes(localIdx);
    const isInTransportNouns = transportMatch?.nounIndices.includes(localIdx);

    if (
      isInLocativeNouns ||
      isInBelongingNouns ||
      isInConWithNouns ||
      isInInstrumentalNouns ||
      isInTransportNouns
    ) {
      const suffixResult = applySuffixBasedOnContext({
        baseGup: token.original,
        localIdx,
        mode,
        mirriMiriwMatch,
        locativeMatch,
        causativeAgentMatch,
        conWithMatch,
        instrumentalMatch,
        belongingMatch,
        transportMatch,
        isObject: true,
        isHuman: undefined,
        isPlace: undefined,
        unknownConWithChoice,
        unknownLocativeChoice,
        hasNegation,
        verbMotionType,
        motionDestinations,
        motionDestinationChoice,
        mirriAlternative,
      });

      return [
        {
          type: "noun",
          source: token.original,
          gup: suffixResult.gup,
          baseGup: token.original,
          appliedSuffix: suffixResult.suffix,
          explanation: suffixResult.explanation,
          suffixAlternatives: suffixResult.alternatives,
          globalIndex: globalIdx,
        },
      ];
    }
  }

  if (
    token.type === "verb" &&
    locativeVerbChoice &&
    verbResult &&
    localIdx === verbResult.localIndex
  ) {
  
    return [];
  }

  const isInLocativeVerbIndices =
    locativeMatch?.verbIndices?.includes(localIdx) || false;

  if (
    token.type === "verb" &&
    !verbResult &&
    verbAltOverride &&
    verbAltOverrideIndex !== null &&
    verbAltOverrideIndex >= 0 &&
    localIdx === verbAltOverrideIndex &&
    !locativeVerbChoice &&
    !isInLocativeVerbIndices
  ) {
 
    const parts: TranslationPart[] = [
      {
        type: "verb",
        source: token.original,
        gup: verbAltOverride.gup,
        baseGup: verbAltOverride.baseGup,
        explanation: verbAltOverride.explanation,
        meaningKey: getVerbMeaningKey(verbAltOverride),
        globalIndex: globalIdx,
      },
    ];

    const attachedClitic = token.verbMatch?.attachedClitic;
    if (attachedClitic) {
      const cliticInfo = getCliticGup(attachedClitic, hasDualMarker, mode);
      if (cliticInfo) {
        const cliticAlts =
          cliticInfo.options.length > 1
            ? cliticInfo.options.slice(1).map((o) => ({
                gup: o.gup,
                suffix: "",
                explanation: o.explanation,
              }))
            : undefined;
        parts.push({
          type: "object",
          source: attachedClitic,
          gup: cliticInfo.gup,
          explanation: cliticInfo.explanation,
          suffixAlternatives: cliticAlts,
          globalIndex: globalIdx,
        });
      }
    }

    return parts;
  }

  if (
    token.type === "verb" &&
    verbResult &&
    localIdx === verbResult.localIndex &&
    !locativeVerbChoice &&
    !isInLocativeVerbIndices
  ) {
 

    const first = verbAltOverride || verbResult.results[0];

    const parts: TranslationPart[] = [
      {
        type: "verb",
        source: token.original,
        gup: first.gup,
        baseGup: first.baseGup,
        explanation: first.explanation,
        meaningKey: getVerbMeaningKey(first),
        verbOptions:
          !verbAltOverride && verbResult.results.length > 1
            ? verbResult.results
            : undefined,
        globalIndex: globalIdx,
      },
    ];

    const verbGupHasDirection =
      first.gup.includes("bala") || first.gup.includes("räli");
    if (
      motionDirection &&
      verbMotionType === "motion" &&
      !verbGupHasDirection
    ) {
      const directionGup = MOTION_DIRECTION_GUP[motionDirection];
      const directionLabel =
        LANG_CONFIG[mode][
          motionDirection === "away"
            ? "directionAwayLabel"
            : "directionTowardsLabel"
        ];
      parts.push({
        type: "particle",
        source: motionDirection === "away" ? "→" : "←",
        gup: directionGup,
        explanation: directionLabel,
        isOptionalDirection: true,
        globalIndex: globalIdx,
      });
    }

    const attachedClitic = token.verbMatch?.attachedClitic;
    if (attachedClitic) {
      const cliticInfo = getCliticGup(attachedClitic, hasDualMarker, mode);
      if (cliticInfo) {
        const cliticAlts =
          cliticInfo.options.length > 1
            ? cliticInfo.options.slice(1).map((o) => ({
                gup: o.gup,
                suffix: "",
                explanation: o.explanation,
              }))
            : undefined;
        parts.push({
          type: "object",
          source: attachedClitic,
          gup: cliticInfo.gup,
          explanation: cliticInfo.explanation,
          suffixAlternatives: cliticAlts,
          globalIndex: globalIdx,
        });
      }
    }

    return parts;
  }



  if (token.type === "noun" && token.gupKey) {
    const suffixResult = applySuffixBasedOnContext({
      baseGup: token.gupKey,
      localIdx,
      mode,
      mirriMiriwMatch,
      locativeMatch,
      causativeAgentMatch,
      conWithMatch,
      instrumentalMatch,
      belongingMatch,
      transportMatch,
      isObject: true,
      isHuman: token.nounMatch?.isHuman,
      isCause: token.nounMatch?.isCause,
      isPlace: token.nounMatch?.isPlace,
      unknownConWithChoice,
      unknownLocativeChoice,
      hasNegation,
      verbMotionType,
      motionDestinations,
      motionDestinationChoice,
      mirriAlternative,
    });

    const finalGup = suffixResult.gup;
    const appliedSuffix = suffixResult.suffix;
    const explanation = suffixResult.explanation || LANG_CONFIG[mode].nounKey;
    let suffixAlternatives = suffixResult.alternatives;
    if (relatedNounOptions.length > 0) {
      const relatedAlternatives = relatedNounOptions.map((opt) => ({
        gup: opt.gup,
        suffix: opt.suffix,
        explanation: `${token.original} → ${opt.explanation}`,
      }));
      suffixAlternatives = mergeSuffixAlternatives(
        suffixAlternatives,
        relatedAlternatives,
      );
    }
    if (
      !appliedSuffix &&
      (!suffixAlternatives || suffixAlternatives.length === 0) &&
      verbalNounOptions.length > 0
    ) {
      const verbalAlternatives = verbalNounOptions.map((opt) => ({
        gup: opt.gup,
        suffix: opt.suffix,
        explanation: `${token.original} → ${opt.explanation}`,
      }));
      suffixAlternatives = verbalAlternatives;
    } else if (verbalNounOptions.length > 0) {
      const verbalAlternatives = verbalNounOptions.map((opt) => ({
        gup: opt.gup,
        suffix: opt.suffix,
        explanation: `${token.original} → ${opt.explanation}`,
      }));
      suffixAlternatives = mergeSuffixAlternatives(
        suffixAlternatives,
        verbalAlternatives,
      );
    }

    return [
      {
        type: "noun",
        source: token.original,
        gup: finalGup,
        baseGup: token.gupKey,
        appliedSuffix,
        explanation,
        suffixAlternatives,
        globalIndex: globalIdx,
        isHuman: token.nounMatch?.isHuman,
        irregularPlurals: token.nounMatch?.irregularPlurals,
        isKnownNoun: true,
        isPlural: token.nounMatch?.isPlural,
      },
    ];
  }

  if (token.type === "adjective" && token.gupKey) {
    const baseGup = token.gupKey;
    const suffixResult = applySuffixBasedOnContext({
      baseGup,
      localIdx,
      mode,
      mirriMiriwMatch,
      locativeMatch,
      causativeAgentMatch,
      conWithMatch,
      instrumentalMatch,
      belongingMatch,
      transportMatch,
      isObject: false,
      isHuman: false,
      isPlace: false,
      hasNegation,
      verbMotionType,
      motionDestinations,
    });
    let adjectiveAlternatives = suffixResult.alternatives;
    if (relatedAdjectiveOptions.length > 0) {
      const relatedAlternatives = relatedAdjectiveOptions.map((opt) => ({
        gup: opt.gup,
        suffix: opt.suffix,
        explanation: `${token.original} → ${opt.explanation}`,
      }));
      adjectiveAlternatives = mergeSuffixAlternatives(
        adjectiveAlternatives,
        relatedAlternatives,
      );
    }

    return [
      {
        type: "adjective",
        source: token.original,
        gup: suffixResult.gup,
        baseGup,
        explanation: suffixResult.explanation || LANG_CONFIG[mode].adjective,
        globalIndex: globalIdx,
        isPlural: token.adjectiveMatch?.isPlural,
        irregularPlurals: token.adjectiveMatch?.irregularPlurals,
        suffixAlternatives: adjectiveAlternatives,
      },
    ];
  }

  if (token.type === "adverb" && token.gupKey) {
    const baseGup = token.gupKey;
    let finalGup = baseGup;
    let explanation = LANG_CONFIG[mode].adverb;

    if (verbMotionType === "motion" && token.isLocational) {
      finalGup = applyAllativeSuffix(baseGup);
      explanation = `${baseGup} + -lili = ${finalGup} (${LANG_CONFIG[mode].allativeSuffix})`;
    }

    return [
      {
        type: "adverb",
        source: token.original,
        gup: finalGup,
        explanation,
        globalIndex: globalIdx,
      },
    ];
  }

  if (token.type === "particle" && token.gupKey) {
    return [
      {
        type: "particle",
        source: token.original,
        gup: token.gupKey,
        explanation: LANG_CONFIG[mode].particle,
        globalIndex: globalIdx,
      },
    ];
  }

  if (token.type === "connector") {
    return [];
  }

  if (token.type === "pronoun") {
    const lower = token.original.toLowerCase();
    const { pronounTriggers, comitativePronounsGup } = LANG_CONFIG[mode];
    const personNumber = pronounTriggers[lower];

    if (personNumber) {
      const isInLocative = locativeMatch?.nounIndices.includes(localIdx);
      const isInConWith = conWithMatch?.nounIndices.includes(localIdx);

      if (isInLocative || isInConWith) {
        const comitativeForms = comitativePronounsGup[personNumber];
        if (comitativeForms && comitativeForms.length > 0) {
          const gup = comitativeForms[0];
          const comitativeAlts =
            comitativeForms.length > 1
              ? comitativeForms.slice(1).map((g) => ({
                  gup: g,
                  suffix: "",
                  explanation: `${token.original} → ${g}`,
                }))
              : undefined;
          return [
            {
              type: "noun",
              source: token.original,
              gup,
              explanation: `${LANG_CONFIG[mode].pronoun} "${
                token.original
              }" → ${gup} (${
                isInLocative
                  ? LANG_CONFIG[mode].locativeExplanation
                  : LANG_CONFIG[mode].conWithExplanation
              })`,
              suffixAlternatives: comitativeAlts,
              globalIndex: globalIdx,
              isHuman: true,
            },
          ];
        }
      }

      const options = getPronounOptions(personNumber, hasDualMarker, mode);
      const allForms = SUBJECT_PRONOUNS_GUP[personNumber];
      const gup = options.length > 0 ? options[0].gup : allForms[0];
      const verblessAlts =
        options.length > 1
          ? options.slice(1).map((o) => ({
              gup: o.gup,
              suffix: "",
              explanation: `${token.original} → ${o.gup}`,
            }))
          : undefined;
      return [
        {
          type: "subject",
          source: token.original,
          gup,
          explanation: `${LANG_CONFIG[mode].pronoun} "${token.original}" → ${gup}`,
          suffixAlternatives: verblessAlts,
          globalIndex: globalIdx,
          role: "verbless" as GrammaticalRole,
        },
      ];
    }
    return [];
  }

  const agentNounMatch = detectAgentNoun(token.original, mode);
  if (agentNounMatch) {
   
    return [
      {
        type: "noun",
        source: token.original,
        gup: agentNounMatch.agentGup,
        baseGup: agentNounMatch.verbGup,
        appliedSuffix: "mirri",
        explanation: agentNounMatch.explanation,
        globalIndex: globalIdx,
      },
    ];
  }

  const suffixResult = applySuffixBasedOnContext({
    baseGup: token.original,
    localIdx,
    mode,
    mirriMiriwMatch,
    locativeMatch,
    causativeAgentMatch,
    conWithMatch,
    instrumentalMatch,
    belongingMatch,
    transportMatch,
    isObject: true,
    isHuman: undefined,
    unknownConWithChoice,
    unknownLocativeChoice,
    hasNegation,
    verbMotionType,
    motionDestinations,
    motionDestinationChoice,
    mirriAlternative,
  });

  if (suffixResult.suffix || suffixResult.explanation) {
    let suffixAlternatives = suffixResult.alternatives;
    if (relatedNounOptions.length > 0) {
      const relatedAlternatives = relatedNounOptions.map((opt) => ({
        gup: opt.gup,
        suffix: opt.suffix,
        explanation: `${token.original} → ${opt.explanation}`,
      }));
      suffixAlternatives = mergeSuffixAlternatives(
        suffixAlternatives,
        relatedAlternatives,
      );
    }
    if (verbalNounOptions.length > 0) {
      const verbalAlternatives = verbalNounOptions.map((opt) => ({
        gup: opt.gup,
        suffix: opt.suffix,
        explanation: `${token.original} → ${opt.explanation}`,
      }));
      suffixAlternatives = mergeSuffixAlternatives(
        suffixAlternatives,
        verbalAlternatives,
      );
    }
    if (relatedAdjectiveOptions.length > 0) {
      const relatedAlternatives = relatedAdjectiveOptions.map((opt) => ({
        gup: opt.gup,
        suffix: opt.suffix,
        explanation: `${token.original} → ${opt.explanation}`,
      }));
      suffixAlternatives = mergeSuffixAlternatives(
        suffixAlternatives,
        relatedAlternatives,
      );
    }
    return [
      {
        type: "unknown",
        source: token.original,
        gup: suffixResult.gup,
        baseGup: token.original,
        appliedSuffix: suffixResult.suffix,
        explanation: suffixResult.explanation || LANG_CONFIG[mode].unknownKey,
        suffixAlternatives,
        globalIndex: globalIdx,
      },
    ];
  }

  if (verbalNounOptions.length > 0 || relatedNounOptions.length > 0) {
    const combinedPrimary =
      relatedNounOptions.length > 0
        ? relatedNounOptions[0]
        : verbalNounOptions[0];
    const combinedAlternatives = [
      ...relatedNounOptions.slice(1),
      ...verbalNounOptions,
    ]
      .filter((opt) => opt.gup !== combinedPrimary.gup)
      .map((opt) => ({
        gup: opt.gup,
        suffix: opt.suffix,
        explanation: `${token.original} → ${opt.explanation}`,
      }));
    return [
      {
        type: "noun",
        source: token.original,
        gup: combinedPrimary.gup,
        baseGup: token.original,
        appliedSuffix: combinedPrimary.suffix,
        explanation: `${token.original} → ${combinedPrimary.explanation}`,
        suffixAlternatives:
          combinedAlternatives.length > 0 ? combinedAlternatives : undefined,
        globalIndex: globalIdx,
      },
    ];
  }

  return [
    {
      type: "unknown",
      source: token.original,
      gup: token.original,
      explanation: LANG_CONFIG[mode].unknownKey,
      globalIndex: globalIdx,
    },
  ];
}

function connectorToGup(connector: string): string {
  const normalized = connector.toLowerCase().trim();
  if (normalized === ",") return ",";
  if (normalized === ".") return ".";
  if (
    CONNECTOR_WORDS_ES.includes(normalized) ||
    CONNECTOR_WORDS_EN.includes(normalized)
  ) {
    return "ga";
  }
  return connector;
}

function buildOutput(
  tokens: Token[],
  translatedFrases: TranslatedFrase[],
  mode: LanguageMode,
  adjNounGroups: AdjectiveNounGroup[],
): { output: string; parts: TranslationPart[] } {
  const outputParts: string[] = [];
  const allParts: TranslationPart[] = [];

  const answerConsumedSet = new Set<number>();
  for (const frase of translatedFrases) {
    if (frase.answerInfo?.answerConsumedIndices) {
      for (const idx of frase.answerInfo.answerConsumedIndices) {
        answerConsumedSet.add(idx);
      }
    }
  }

  const partsByTokenIndex: Map<number, TranslationPart[]> = new Map();
  for (const frase of translatedFrases) {
    for (const part of frase.parts) {
      if (part.globalIndex !== undefined && part.globalIndex >= 0) {
        const existing = partsByTokenIndex.get(part.globalIndex) || [];
        existing.push(part);
        partsByTokenIndex.set(part.globalIndex, existing);
      }
    }
  }

  const impliedPartsByFraseStart: Map<number, TranslationPart[]> = new Map();
  for (const frase of translatedFrases) {
    const fraseStart =
      frase.tokenIndices.length > 0 ? frase.tokenIndices[0] : -1;
    for (const part of frase.parts) {
      if (part.globalIndex === -1) {
        const existing = impliedPartsByFraseStart.get(fraseStart) || [];
        existing.push(part);
        impliedPartsByFraseStart.set(fraseStart, existing);
      }
    }
  }

  const fraseStartIndices = new Set<number>();
  for (const frase of translatedFrases) {
    if (frase.tokenIndices.length > 0) {
      fraseStartIndices.add(frase.tokenIndices[0]);
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (fraseStartIndices.has(i)) {
      const impliedParts = impliedPartsByFraseStart.get(i);
      if (impliedParts) {
        for (const implied of impliedParts) {
          outputParts.push(implied.gup);
          allParts.push(implied);
        }
      }
    }

    if (answerConsumedSet.has(i)) continue;

    if (token.type === "connector") {
      const gup = connectorToGup(token.original);
      outputParts.push(gup);
      allParts.push({
        type: "connector",
        source: token.original,
        gup,
        explanation: LANG_CONFIG[mode].connector,
        globalIndex: i,
      });
    } else {
      const parts = partsByTokenIndex.get(i);
      if (parts) {
        for (const part of parts) {
          outputParts.push(part.gup);
          allParts.push(part);
        }
      }
    }
  }

  const hasCauseRoute = translatedFrases.some(
    (frase) => frase.causativeRoute === "cause",
  );
  const allowAgentSuffix = hasCauseRoute ? false : true;



  applyAdjectiveSuffixes(
    allParts,
    adjNounGroups,
    tokens,
    mode,
    allowAgentSuffix,
  );

  const finalOutputParts: string[] = [];
  for (const part of allParts) {
    finalOutputParts.push(part.gup);
  }

  return {
    output: finalOutputParts.join(" "),
    parts: allParts,
  };
}
