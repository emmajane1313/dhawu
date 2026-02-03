import { LanguageMode } from "@/app/components/types/components.type";
import { tokenize, TokenizerResult, Token, Frase } from "./tokenizer";
import { LEXICON } from "./lexicon";
import { applyVerbRules, VerbRuleResult } from "./rules/verb";
import {
  analyzeFraseContext,
  FraseContext,
  PossessionMatch,
  PossessivePronounMatch,
  MirriMiriwMatch,
  detectMirriMiriwPattern,
  LocativeMatch,
  ConWithMatch,
  InstrumentalMatch,
  BelongingMatch,
  BecomeAdjectiveMatch,
  MakeAdjectiveMatch,
  LetUsMatch,
  NgarraMatch,
  TransportMatch,
  ComitativePronounMatch,
  HumanAllativePronounMatch,
  HumanAblativePronounMatch,
  SourceOriginPronounMatch,
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
} from "./rules/subject";
import { processObjects, ObjectResult } from "./rules/object";
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
  COMITATIVE_PRONOUNS_GUP,
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
  determineHumanAblativeSuffix,
  applyHumanAblativeSuffix,
  HumanAblativeSuffixType,
  validarFonologia,
  MotionDirection,
  MOTION_DIRECTION_GUP,
  MotionGoalDirection,
  determineDjalSuffix,
  applyDjalSuffix,
  DjalVerbMatch,
  PurposeInfinitiveMatch,
  InfinitiveAgentMatch,
  LocativeVerbMatch,
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
  debug: {
    tokenization: TokenizerResult;
  };
}

function findGlobalVerbContext(
  frases: Frase[],
  tokens: Token[]
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

export const translate = (
  text: string,
  mode: LanguageMode
): TranslationResult => {
  const tokenization = tokenize(text, mode);
  const adjNounGroups = detectAdjectiveNounGroups(tokenization.tokens, mode);

  let allCombinations: TranslationCombination[] = [];

  for (const combo of tokenization.combinations) {
    let inheritedMirriMiriw: MirriMiriwMatch | null = null;
    const fraseVariants: TranslatedFrase[][] = [];

    const globalVerbContext = findGlobalVerbContext(
      combo.frases,
      tokenization.tokens
    );

    for (const frase of combo.frases) {
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
        globalVerbContext
      );
      fraseVariants.push(variants);
    }

    const expandedCombinations = expandFraseVariants(
      fraseVariants,
      tokenization.tokens,
      mode,
      tokenization.punctuation,
      adjNounGroups
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
    debug: {
      tokenization,
    },
  };
};

function generateAnswerVariants(
  answerInfo: AnswerInfo,
  mode: LanguageMode
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
        suffixesToApply[0]
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
        isPlural
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
  mode: LanguageMode
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
          applyHumanAssociativeSuffix(baseGup!, s)
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
  frases: TranslatedFrase[]
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
  }[][] = partsWithAlts.map(({ part }) => {
    if (part.verbOptions && part.verbOptions.length > 1) {
      return part.verbOptions.map((vo) => ({
        gup: vo.gup,
        suffix: "",
        explanation: vo.explanation,
      }));
    }
    return [
      {
        gup: part.gup,
        suffix: part.appliedSuffix || "",
        explanation: part.explanation,
      },
      ...part.suffixAlternatives!,
    ];
  });

  let combinations: { gup: string; suffix: string; explanation: string }[][] = [
    [],
  ];
  for (const options of optionsPerPart) {
    const newCombos: { gup: string; suffix: string; explanation: string }[][] =
      [];
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
          (pa) => pa.fraseIdx === fi && pa.partIdx === pi
        );
        if (altIdx >= 0) {
          const chosen = combo[altIdx];
          return {
            ...p,
            gup: chosen.gup,
            appliedSuffix: chosen.suffix || undefined,
            explanation: chosen.explanation,
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

function expandOptionalDirections(
  frases: TranslatedFrase[]
): TranslatedFrase[][] {
  const hasOptionalDir = frases.some((f) =>
    f.parts.some((p) => p.isOptionalDirection === true)
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
  adjNounGroups: AdjectiveNounGroup[]
): TranslationCombination[] {
  if (fraseVariants.length === 0) return [];

  const combinations = generateCombinations(fraseVariants);
  const results: TranslationCombination[] = [];

  for (const frases of combinations) {
    const suffixExpandedVariants = expandSuffixAlternatives(frases);

    for (const suffixExpanded of suffixExpandedVariants) {
      const directionExpandedVariants =
        expandOptionalDirections(suffixExpanded);

      for (const expandedFrases of directionExpandedVariants) {
        const { output, parts } = buildOutput(
          tokens,
          expandedFrases,
          mode,
          adjNounGroups
        );
        const answerInfo = expandedFrases.find((f) => f.answerInfo)?.answerInfo;

        if (answerInfo) {
          const answerVariants = generateAnswerVariants(answerInfo, mode);
          for (const answerGup of answerVariants) {
            const finalOutput = output + "? " + answerGup;
            const answerParts = generateAnswerParts(
              answerInfo,
              answerGup,
              mode
            );
            results.push({
              frases: expandedFrases,
              parts: [...parts, ...answerParts],
              output: finalOutput,
            });
          }
        } else {
          let finalOutput = output;
          const hasQuestionPattern = expandedFrases.some(
            (f) => f.isQuestionPattern
          );
          if (hasQuestionPattern && !finalOutput.includes("?")) {
            finalOutput += "?";
          } else if (punctuation) {
            finalOutput += punctuation;
          }
          results.push({
            frases: expandedFrases,
            parts,
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
}

interface GlobalVerbContext {
  isTransitive: boolean;
  verbPerson: number | null;
}

interface MotionDestination {
  triggerIdx: number;
  nounIdx: number;
  isHuman?: boolean;
  goalDirection: MotionGoalDirection;
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
  conWithMatch: ConWithMatch | null;
  instrumentalMatch: InstrumentalMatch | null;
  transportMatch: TransportMatch | null;
  comitativePronounMatch: ComitativePronounMatch | null;
  humanAllativePronounMatch: HumanAllativePronounMatch | null;
  humanAblativePronounMatch: HumanAblativePronounMatch | null;
  sourceOriginPronounMatch: SourceOriginPronounMatch | null;
  purposePronounMatch: PurposePronounMatch | null;
  locativeCopulaMatch: LocativeCopulaMatch | null;
  indirectObjectMatch: IndirectObjectMatch | null;
  timesMatch: TimesMatch | null;
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
  locativeVerbResults: LocativeVerbResult[];
  motionDestinations: MotionDestination[];
  motionDirection: MotionDirection;
  directionTriggerIndices: number[];
  unknownConWithChoice?: UnknownConWithChoice;
  unknownLocativeChoice?: UnknownLocativeChoice;
  copulaSubjectChoice?: CopulaSubjectChoice;
  motionDestinationChoice?: UnknownConWithChoice;
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
    suffixType: "ngura" | "lili" | "nguru" | "ergative" | "belonging";
    explanation: string;
  } | null;
}

function applyRulesWithAlternatives(
  frase: Frase,
  tokens: Token[],
  mode: LanguageMode,
  originalText: string,
  inheritedMirriMiriw: MirriMiriwMatch | null = null,
  globalVerbContext: GlobalVerbContext | null = null
): TranslatedFrase[] {
  const ctx = buildFraseContext(
    frase,
    tokens,
    mode,
    originalText,
    inheritedMirriMiriw,
    globalVerbContext
  );

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

  const verbAlternatives: (VerbRuleResult | null)[] =
    ctx.letUsMatch && ctx.verbResult && ctx.verbResult.results.length > 0
      ? ctx.verbResult.results
      : [null];

  console.log("letUsMatch:", ctx.letUsMatch);
  console.log("verbResult:", ctx.verbResult?.results);
  console.log("verbAlternatives:", verbAlternatives);
  console.log("subjectAlternatives:", subjectAlternatives);

  if (
    ctx.ngarraMatch &&
    ctx.subjectResults.some((s) => s.personNumber === "1_Sing")
  ) {
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
      ctx.skipLocalIndices
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
      const isIrPattern = ["ir_present_a_infinitive", "ir_past_a_infinitive"].includes(
        ctx.context.matchedPattern.patternName
      );
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
    const buildFutureSimpleAlternatives = (): PurposeInfinitiveAlternative[] => {
      const pim = ctx.purposeInfinitiveMatch;
      if (!pim) return [];
      const infinitiveToken = ctx.fraseTokens[pim.infinitiveIndex];
      const infinitiveMatch = infinitiveToken?.verbMatch;
      if (!infinitiveMatch) return [];
      const tokenWords = ctx.fraseTokens.map((t) => t.original);
      const fraseText = tokenWords.join(" ");
      const hasExplicitSubject = ctx.subjectResults.some((s) => s.type !== "implied");
      const futureResults = applyVerbRules(
        infinitiveMatch,
        tokenWords,
        fraseText,
        ctx.mode,
        "future",
        false,
        hasExplicitSubject,
        false
      );
      return futureResults.map((verbAlt) => ({
        type: "future-simple",
        verbAlt,
      }));
    };

    const getConjugatedForm = (
      forms: string[],
      tense: string | null | undefined
    ) => {
      if (tense === "future" || tense === "conditional") return forms[0];
      if (tense === "past") return forms[2];
      if (tense === "preterite" || tense === "imperfect") return forms[2];
      return forms[1];
    };

    if (ctx.hasIrPatternWithPurpose && ctx.purposeInfinitiveMatch?.infinitiveEntry) {
      const forms = ctx.purposeInfinitiveMatch.infinitiveEntry.forms;
      const patternTense = ctx.context.matchedPattern?.tense || "present";
      const conjugatedForm = getConjugatedForm(forms, patternTense);
      const futureSimple = buildFutureSimpleAlternatives();
      return [
        { type: "with-main-verb" },
        { type: "conjugated-only", conjugatedForm },
        ...futureSimple,
      ];
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
        (s) => s.type === "noun" || s.type === "name"
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
    suffixType: "ngura" | "lili" | "nguru" | "ergative" | "belonging";
    explanation: string;
  } | null;

  const locativeSuffixAlternatives: LocaliveSuffixChoice[] = (() => {
    const locMatch = ctx.context.locativeMatch;
    if (locMatch && (locMatch.verbIndices && locMatch.verbIndices.length > 0)) {
      const alts: LocaliveSuffixChoice[] = [{
        suffixType: locMatch.suffixType,
        explanation: locMatch.explanation,
      }];
      if (locMatch.alternativeSuffixTypes) {
        alts.push(...locMatch.alternativeSuffixTypes);
      }
      return alts;
    }
    return [null];
  })();

  const results: TranslatedFrase[] = [];
  const fraseTokenStrings = ctx.fraseTokens.map((t) => t.original);
  const hasVerb =
    ctx.fraseTokens.some((t) => t.type === "verb") ||
    ctx.locativeCopulaMatch !== null;
  const determinerMatches = ctx.context.determinerMatches;

  for (const questionOutputAlt of questionOutputAlternatives) {
    for (const verbAlt of verbAlternatives) {
      console.log("Loop iteration - verbAlt:", verbAlt?.gup);
      const isNgarraVerbAlt = verbAlt?.gup.startsWith("ŋarra ") || false;
      for (const altSubjects of subjectAlternatives) {
        console.log("Loop iteration - altSubjects:", altSubjects.map(s => s.gup));
        if (isNgarraVerbAlt) {
          const hasFirstSing =
            altSubjects.some((s) => s.personNumber === "1_Sing");
          if (!hasFirstSing) {
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
                                      purposeInfAlt.type === "future-simple" &&
                                      locVerbMatchAlt === "use"
                                    ) {
                                      continue;
                                    }
                                    if (
                                      purposeInfAlt.type === "future-simple" &&
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
                                        motionDestinationChoice: motionDestAlt,
                                        purposeInfinitiveAlternative: purposeInfAlt,
                                        irPatternAlternative: irPatternAlt,
                                        makeAdjectiveAlternative: makeAdjAlt,
                                        infinitiveAgentAlternative: infAgentAlt,
                                        locativeSuffixChoice: locSuffixAlt,
                                        locativeVerbMatchAlternative: locVerbMatchAlt,
                                      },
                                      suffixCombo,
                                      locVerbAlt,
                                      questionOutputAlt,
                                      effectiveVerbAlt
                                    );

                                    if (ctx.letUsMatch) {
                                      console.log("Parts before join:", parts);
                                    }

                                    const baseTranslation: DefiniteTranslation = {
                                      gup: parts.map((p) => p.gup).join(" "),
                                      parts: parts as DefinitePart[],
                                      explanation: "",
                                    };

                                    console.log("Generated translation:", baseTranslation.gup);

                                    const definiteVariants = applyDefiniteDemonstratives(
                                      [baseTranslation],
                                      fraseTokenStrings,
                                      mode,
                                      determinerMatches
                                    );

                                    for (const defVariant of definiteVariants) {
                                      const pluralVariants = applyPluralToPhrase(
                                        [defVariant as PluralTranslation],
                                        fraseTokenStrings,
                                        mode,
                                        hasVerb,
                                        determinerMatches
                                      );
                                      for (const variant of pluralVariants) {
                                        results.push({
                                          tokenIndices: frase.tokenIndices,
                                          parts: variant.parts as TranslationPart[],
                                          answerInfo,
                                          isQuestionPattern: !!ctx.context.questionMatch,
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
  globalVerbContext: GlobalVerbContext | null = null
): FraseProcessingContext {
  const fraseTokens: Token[] = frase.tokenIndices.map((idx) => tokens[idx]);
  const globalIndices = frase.tokenIndices;
  const context = analyzeFraseContext(fraseTokens, originalText, mode);

  const skipLocalIndices = new Set<number>(
    context.matchedPattern?.skipIndices || []
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

  const verbIdx =
    context.matchedPattern?.mainVerbIndex ??
    fraseTokens.findIndex((t) => t.type === "verb");
  const hasSubjectBeforeVerb =
    verbIdx > 0 &&
    fraseTokens.slice(0, verbIdx).some((t) => t.type === "pronoun");
  const hasVerbInFrase = verbIdx !== -1;

  const modalVerbInfo = detectModalVerb(fraseTokens, verbIdx);

  const irPatternNames = ["ir_present_a_infinitive", "ir_past_a_infinitive"];
  const hasIrPattern = irPatternNames.includes(
    context.matchedPattern?.patternName ?? ""
  );
  const detectedPurposeInfinitiveMatch = detectPurposeInfinitive(
    fraseTokens,
    mode
  );
  let earlyPurposeInfinitiveMatch = detectedPurposeInfinitiveMatch;
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
        applyDjalSuffix(verbGupBase, s)
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
  const hasIrPatternWithPurpose = hasIrPattern && earlyPurposeInfinitiveMatch?.hasAlternativePattern;
  const infinitiveAgentMatch = detectInfinitiveAgent(fraseTokens, mode);
  const locativeVerbMatch = detectLocativeVerbPattern(fraseTokens, mode);
  const becomeAdjectiveMatch = detectBecomeAdjectivePattern(fraseTokens, mode);
  const makeAdjectiveMatch = detectMakeAdjectivePattern(fraseTokens, mode);
  const letUsMatch = detectLetUsPattern(fraseTokens, mode);
  const ngarraMatch = detectNgarraPattern(fraseTokens, mode);

  let verbResult =
    (isCopula && !isAmbiguousIrSer) || modalVerbInfo || context.questionMatch?.answerInfo
      ? null
      : processVerb(
          fraseTokens,
          context,
          originalText,
          mode,
          hasSubjectBeforeVerb,
          undefined,
          letUsMatch
        );

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
    console.log("ŊARRA MATCH DETECTED - verbIndex:", ngarraMatch.verbIndex);
    console.log("skipLocalIndices BEFORE delete:", Array.from(skipLocalIndices));
    for (const idx of ngarraMatch.phraseIndices) {
      skipLocalIndices.add(idx);
    }
    skipLocalIndices.delete(ngarraMatch.verbIndex);
    console.log("skipLocalIndices AFTER delete:", Array.from(skipLocalIndices));
    console.log("Has verbIndex after delete?", skipLocalIndices.has(ngarraMatch.verbIndex));
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
      context.belongingMatch?.belongsToNounIndices.includes(verbResult.localIndex) ||
      context.conWithMatch?.nounIndices.includes(verbResult.localIndex) ||
      context.instrumentalMatch?.nounIndices.includes(verbResult.localIndex) ||
      context.transportMatch?.nounIndices.includes(verbResult.localIndex);

    if (verbPerson === null && mainVerbPerson !== undefined && mainVerbPerson >= 0 && !verbIsInNounPattern) {
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
      (t) => t.type === "verb" && t.verbMatch?.tense === "infinitive"
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
    context.comitativePronounMatch?.triggerIndices || []
  );

  const humanAllativePronounIndices = new Set<number>(
    context.humanAllativePronounMatch?.triggerIndices || []
  );

  const humanAblativePronounIndices = new Set<number>(
    context.humanAblativePronounMatch?.triggerIndices || []
  );

  let motionDestinationIndices: MotionDestination[] = [];
  const { directionWord, fromTriggers, toTriggers } = LANG_CONFIG[mode];
  const lowerTokens = fraseTokens.map((t) => t.original.toLowerCase());

  const questionConsumedSet = new Set(
    context.questionMatch?.consumedIndices || []
  );
  const locativeTriggerSet = new Set(
    context.locativeMatch?.triggerIndices || []
  );
  const locativeNounSet = new Set(context.locativeMatch?.nounIndices || []);
  const knownVehicleNounSet = new Set(
    context.transportMatch?.isKnownVehicle
      ? context.transportMatch.nounIndices
      : []
  );

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
          const isHumanObjectAfterTransitiveVerb =
            isTransitive &&
            verbMotionType !== "motion" &&
            verbIdx >= 0 &&
            i > verbIdx &&
            t.nounMatch?.isHuman === true;
       
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
    (x) => x.isHuman !== true
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
    ...locativeAllIndices,
    ...possessionAllIndices,
    ...questionIndices,
    ...allMotionDestIndices,
  ]);

  const subjectResults = processSubjects(
    fraseTokens,
    mode,
    verbPerson,
    isImperative,
    skipForSubjectsObjects,
    isTransitive,
    skipErgative,
    !!letUsMatch
  );
  const treatAllAsObjects = !hasVerbInFrase && isTransitive;
  const { objects: objectResults, personalAIndices } = processObjects(
    fraseTokens,
    mode,
    skipForSubjectsObjects,
    treatAllAsObjects,
    verbMotionType,
    isTransitive
  );

  for (const idx of personalAIndices) {
    skipLocalIndices.add(idx);
  }

  if (modalVerbInfo) {
    skipLocalIndices.add(modalVerbInfo.verbLocalIndex);
  }

  let standaloneCopulaOptions: SubjectOption[] = [];
  if (context.copulaMatch?.isStandalone && context.copulaMatch.impliedPerson) {
    standaloneCopulaOptions = getPronounOptions(
      context.copulaMatch.impliedPerson,
      hasDualMarker,
      mode
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

  let locativeMatch = context.locativeMatch;
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
  for (const dest of motionDestinationIndices) {
    skipLocalIndices.add(dest.triggerIdx);
  }
  if (locativeMatch) {
    for (const idx of locativeMatch.triggerIndices) {
      skipLocalIndices.add(idx);
    }
    if (locativeMatch.verbIndices) {
      for (const idx of locativeMatch.verbIndices) {
        skipLocalIndices.add(idx);
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

  const sourceOriginPronounMatch = context.sourceOriginPronounMatch;
  if (sourceOriginPronounMatch) {
    for (const idx of sourceOriginPronounMatch.triggerIndices) {
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

  const relativeClauseMatch = detectRelativeClausePattern(fraseTokens, mode);
  if (relativeClauseMatch) {
    for (const idx of relativeClauseMatch.consumedIndices) {
      skipLocalIndices.add(idx);
    }
  }

  const djalVerbMatch = detectDjalVerbPattern(fraseTokens, mode);
  if (djalVerbMatch) {
    console.log("djalVerbMatch.consumedIndices:", djalVerbMatch.consumedIndices);
    for (const idx of djalVerbMatch.consumedIndices) {
      skipLocalIndices.add(idx);
    }
    console.log("skipLocalIndices after djalVerbMatch:", Array.from(skipLocalIndices));
  }

  const purposeInfinitiveMatch = earlyPurposeInfinitiveMatch;
  if (purposeInfinitiveMatch) {
    console.log("purposeInfinitiveMatch.consumedIndices:", purposeInfinitiveMatch.consumedIndices);
    console.log("purposeInfinitiveMatch.infinitiveIndex:", purposeInfinitiveMatch.infinitiveIndex);
  }

  let locativeVerbResults: LocativeVerbResult[] = [];
  if (locativeCopulaMatch) {
    const fraseTokenStrings = fraseTokens.map((t) => t.original);
    locativeVerbResults = generateLocativeVerbResults(
      locativeCopulaMatch,
      fraseTokenStrings,
      mode
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
      (a, b) => b.split(" ").length - a.split(" ").length
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

  console.log("directionTriggerIndices BEFORE adding to skipLocalIndices:", directionTriggerIndices);
  for (const idx of directionTriggerIndices) {
    skipLocalIndices.add(idx);
  }
  console.log("skipLocalIndices AFTER adding directionTriggerIndices:", Array.from(skipLocalIndices));

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
    conWithMatch,
    instrumentalMatch: context.instrumentalMatch,
    transportMatch: context.transportMatch,
    comitativePronounMatch,
    humanAllativePronounMatch,
    humanAblativePronounMatch,
    sourceOriginPronounMatch,
    purposePronounMatch,
    locativeCopulaMatch,
    indirectObjectMatch,
    timesMatch,
    relativeClauseMatch,
    djalVerbMatch,
    purposeInfinitiveMatch,
    infinitiveAgentMatch,
    locativeVerbMatch,
    becomeAdjectiveMatch,
    makeAdjectiveMatch,
    letUsMatch,
    ngarraMatch,
    locativeVerbResults,
    motionDestinations: motionDestinationIndices,
    motionDirection,
    directionTriggerIndices,
    hasIrPatternWithPurpose,
    isAmbiguousIrSer,
  };
}

function generateSubjectAlternatives(
  subjectResults: SubjectResult[]
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
  objectResults: ObjectResult[]
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
  ctx: FraseProcessingContext
): CopulaSubjectChoice[] {
  const { context, subjectResults, fraseTokens, mode, hasDualMarker } = ctx;
  const copulaMatch = context.copulaMatch;

  if (!copulaMatch || copulaMatch.impliedPerson === null)
    return [{ gup: "", explanation: "" }];

  if (context.questionMatch && context.questionMatch.type === "where") {
    const consumedByPattern = new Set(
      context.questionMatch.consumedIndices || []
    );
    const hasNounAfterCopula = fraseTokens.some(
      (t, i) =>
        i > copulaMatch.copulaIndex &&
        !consumedByPattern.has(i) &&
        (t.type === "noun" || t.type === "unknown")
    );
    if (hasNounAfterCopula) {
      return [{ gup: "", explanation: "" }];
    }
  }

  const hasMatchingSubject = subjectResults.some(
    (s) => s.personNumber === copulaMatch.impliedPerson
  );
  if (hasMatchingSubject) return [{ gup: "", explanation: "" }];

  const options = getPronounOptions(
    copulaMatch.impliedPerson,
    hasDualMarker,
    mode
  );
  if (options.length === 0) return [{ gup: "", explanation: "" }];

  const config = LANG_CONFIG[mode];
  return options.map((opt) => ({
    gup: opt.gup,
    explanation: `${config.impliedSubjectFrom} "${copulaMatch.copulaWord}" → ${opt.gup} (${opt.explanation})`,
  }));
}

function generateConWithAlternatives(
  ctx: FraseProcessingContext
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
  ctx: FraseProcessingContext
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
    subjectResults.map((s) => s.source.toLowerCase())
  );
  const objectSources = new Set(
    objectResults.map((o) => o.source.toLowerCase())
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
  ctx: FraseProcessingContext
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
  letUsMatch?: LetUsMatch | null
): { results: VerbRuleResult[]; localIndex: number } | null {
  const mainVerbLocalIdx =
    overrideVerbIndex ??
    context.matchedPattern?.mainVerbIndex ??
    fraseTokens.findIndex((t) => t.type === "verb");

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
    !!letUsMatch
  );

  return { results, localIndex: mainVerbLocalIdx };
}

function buildParts(
  ctx: FraseProcessingContext,
  modalSuffixCombo: DjalSuffixType[] = [],
  locativeVerbChoice: LocativeVerbResult | null = null,
  questionOutputOverride: string | null = null,
  verbAltOverride: VerbRuleResult | null = null
): TranslationPart[] {
  const parts: TranslationPart[] = [];
  const questionConsumedSet = new Set(ctx.context.questionMatch?.consumedIndices || []);

  if (ctx.makeAdjectiveMatch && ctx.makeAdjectiveAlternative === "use-pattern") {
    const mam = ctx.makeAdjectiveMatch;
    const exceptionForm = MAKE_ADJ_EXCEPTIONS[mam.adjectiveGup];

    if (exceptionForm) {
      const suffixes = determineMakeAdjSuffix(mam.adjectiveGup);
      const regularAlternatives = suffixes.map(s => ({
        gup: applyMakeAdjSuffix(mam.adjectiveGup, s),
        suffix: s,
        explanation: `${mam.adjectiveGup} + -${s} (forma regular)`
      }));

      return [{
        type: "verb",
        source: `${mam.verbWord} ${mam.adjectiveWord}`,
        gup: exceptionForm,
        explanation: `"${mam.verbWord} ${mam.adjectiveWord}" → ${exceptionForm} (excepción)`,
        globalIndex: -1,
        alternatives: regularAlternatives,
      }];
    } else {
      const suffixes = determineMakeAdjSuffix(mam.adjectiveGup);
      const primarySuffix = suffixes[0];
      const gupWithSuffix = applyMakeAdjSuffix(mam.adjectiveGup, primarySuffix);

      const alternatives = suffixes.length > 1
        ? suffixes.slice(1).map(s => ({
            gup: applyMakeAdjSuffix(mam.adjectiveGup, s),
            suffix: s,
            explanation: `${mam.adjectiveGup} + -${s}`
          }))
        : undefined;

      return [{
        type: "verb",
        source: `${mam.verbWord} ${mam.adjectiveWord}`,
        gup: gupWithSuffix,
        explanation: `"${mam.verbWord} ${mam.adjectiveWord}" → ${gupWithSuffix} (make + adj)`,
        globalIndex: -1,
        alternatives,
      }];
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
        (s) => s.localIndex === subjectLocalIndex
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

  if (ctx.infinitiveAgentAlternative !== "explicit") {
    buildImpliedSubjectParts(ctx, parts, verbAltOverride);
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
        0: "1_Sing", 1: "2_Sing", 2: "3_Sing",
        3: "1+3_Plur", 4: "2_Plur", 5: "3_Plur",
      };
      const agentPersonKey = personMap[dvm.subjunctivePerson];
      const agentPronouns = SUBJECT_PRONOUNS_GUP[agentPersonKey];
      const agentGup = agentPronouns[0];
      const possessiveForms = POSSESSIVE_PRONOUNS_GUP[agentPersonKey];
      const possessiveGup = possessiveForms?.[0] || agentGup;

      parts.push({ type: "subject", source: impliedSubject?.source || "I", gup: subjectGup, explanation: `sujeito → ${subjectGup}`, globalIndex: -1 });
      parts.push({ type: "object", source: dvm.verbWord, gup: possessiveGup, explanation: `${agentPersonKey} → ${possessiveGup} (${config.possessive})`, globalIndex: -1 });
      parts.push({ type: "verb", source: dvm.djalWord, gup: "djäl", explanation: `${dvm.djalWord} → djäl`, globalIndex: -1 });
      parts.push({ type: "subject", source: "[agent]", gup: agentGup, explanation: `agente → ${agentGup}`, globalIndex: -1 });
      parts.push({ type: "particle", source: "will", gup: "dhu", explanation: "dhu (futuro)", globalIndex: -1 });
      parts.push({ type: "verb", source: dvm.verbWord, gup: verbGupBase, explanation: `${dvm.verbWord} → ${verbGupBase}`, globalIndex: -1 });
    } else if (dvm.attachedCliticPerson) {
      const objectPronounInfo = OBJECT_PRONOUNS_GUP[dvm.attachedCliticPerson as keyof typeof OBJECT_PRONOUNS_GUP];
      const accusativeGup = objectPronounInfo?.gup;

      parts.push({ type: "subject", source: impliedSubject?.source || "I", gup: subjectGup, explanation: `sujeito → ${subjectGup}`, globalIndex: -1 });
      parts.push({ type: "verb", source: dvm.djalWord, gup: "djäl", explanation: `${dvm.djalWord} → djäl`, globalIndex: -1 });
      parts.push({ type: "subject", source: impliedSubject?.source || "I", gup: subjectGup, explanation: `sujeito → ${subjectGup}`, globalIndex: -1 });
      parts.push({ type: "particle", source: "will", gup: "dhu", explanation: "dhu (futuro)", globalIndex: -1 });
      if (accusativeGup) {
        const cliticSource = dvm.attachedClitic || "";
        parts.push({ type: "object", source: cliticSource, gup: accusativeGup, explanation: `${cliticSource} → ${accusativeGup} (acusativo)`, globalIndex: -1 });
      }
      parts.push({ type: "verb", source: dvm.verbWord, gup: verbGupBase, explanation: `${dvm.verbWord} → ${verbGupBase}`, globalIndex: -1 });
    }

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

  const skipDjalVerb = ctx.context.questionMatch?.answerInfo !== undefined ||
    questionConsumedSet.has(ctx.djalVerbMatch?.verbIndex ?? -1);

  if (ctx.djalVerbMatch && !skipDjalVerb) {
    const dvm = ctx.djalVerbMatch;

    if (dvm.attachedClitic && dvm.attachedCliticPerson) {
      const cliticInfo = getCliticGup(dvm.attachedClitic, ctx.hasDualMarker, ctx.mode);
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

  const shouldUseLocativeVerbMatch = ctx.locativeVerbMatchAlternative !== "ignore";
  const isVerbAlreadyInNewSystem = ctx.locativeVerbMatch && ctx.context.locativeMatch?.verbIndices?.includes(ctx.locativeVerbMatch.verbIndex);
  const shouldUseLocativeVerb =
    ctx.locativeVerbMatch &&
    shouldUseLocativeVerbMatch &&
    !questionConsumedSet.has(ctx.locativeVerbMatch.verbIndex) &&
    !isVerbAlreadyInNewSystem;

  if (shouldUseLocativeVerb && ctx.locativeVerbMatch) {
    const lvm = ctx.locativeVerbMatch;

    ctx.skipLocalIndices.add(lvm.triggerIndex);
    ctx.skipLocalIndices.add(lvm.verbIndex);

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
      const regularAlternatives = suffixes.map(s => ({
        gup: applyBecomeAdjSuffix(bam.adjectiveGup, s),
        suffix: s,
        explanation: `${bam.adjectiveGup} + -${s} (forma regular)`
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
      const gupWithSuffix = applyBecomeAdjSuffix(bam.adjectiveGup, primarySuffix);

      const alternatives = suffixes.length > 1
        ? suffixes.slice(1).map(s => ({
            gup: applyBecomeAdjSuffix(bam.adjectiveGup, s),
            suffix: s,
            explanation: `${bam.adjectiveGup} + -${s}`
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


  const hasLocativeVerbIndices = !!(
    ctx.context.locativeMatch?.verbIndices &&
    ctx.context.locativeMatch.verbIndices.length > 0
  );
  const shouldUsePurposeInfinitive =
    ctx.purposeInfinitiveMatch &&
    ctx.purposeInfinitiveAlternative?.type !== "future-simple" &&
    (!ctx.hasIrPatternWithPurpose || ctx.irPatternAlternative === "use-literal") &&
    !questionConsumedSet.has(ctx.purposeInfinitiveMatch.infinitiveIndex) &&
    !(ctx.locativeVerbMatch && shouldUseLocativeVerbMatch) &&
    !(hasLocativeVerbIndices && ctx.locativeVerbMatchAlternative !== "ignore") &&
    !ctx.letUsMatch;

  if (ctx.letUsMatch) {
    console.log("shouldUsePurposeInfinitive:", shouldUsePurposeInfinitive, "ctx.letUsMatch:", !!ctx.letUsMatch);
  }

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
        if (pim.mainVerbTense === "preterite" || pim.mainVerbTense === "imperfect") {
          mainVerbGup = mainVerbForms[2];
        } else if (pim.mainVerbTense === "future" || pim.mainVerbTense === "conditional") {
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
          const cliticInfo = getCliticGup(attachedClitic, ctx.hasDualMarker, ctx.mode);
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
              suffixAlternatives: cliticAlts.length > 0 ? cliticAlts : undefined,
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

  buildStandardParts(ctx, parts, locativeVerbChoice, verbAltOverride);

  return parts;
}

function buildCopulaParts(
  ctx: FraseProcessingContext,
  parts: TranslationPart[]
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
      (s) => s.personNumber === copulaMatch.impliedPerson
    );
    if (!hasMatchingSubject) {
      parts.push({
        type: "subject",
        source: `[${copulaMatch.copulaWord}]`,
        gup: copulaSubjectChoice.gup,
        explanation: copulaSubjectChoice.explanation,
        globalIndex: globalIndices[copulaMatch.copulaIndex],
        role: "verbless" as GrammaticalRole,
      });
    }
  }
}

function buildImpliedSubjectParts(
  ctx: FraseProcessingContext,
  parts: TranslationPart[],
  verbAltOverride: VerbRuleResult | null = null
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

  const letUsSubject = subjectResults.find((s) => s.source === "[let's]" && s.localIndex === -1);
  if (letUsSubject && ctx.letUsMatch) {
    parts.push({
      type: "subject",
      source: letUsSubject.source,
      gup: letUsSubject.gup,
      explanation: letUsSubject.explanation,
      globalIndex: -1,
      role: "subject_intransitive" as GrammaticalRole,
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
    (!context.copulaMatch || ctx.purposeInfinitiveMatch || ctx.isAmbiguousIrSer) &&
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
    });
  } 
}

function applyMirriMiriwSuffix(
  gupWord: string,
  suffixType: MirriMiriwType
): string {
  const normalized = gupWord.replace(/['ʼ`']/g, "'");
  const withoutGlottal = normalized.endsWith("'")
    ? normalized.slice(0, -1)
    : normalized;
  return withoutGlottal + suffixType;
}

interface SuffixApplicationContext {
  baseGup: string;
  localIdx: number;
  mode: LanguageMode;
  mirriMiriwMatch: MirriMiriwMatch | null;
  locativeMatch: LocativeMatch | null;
  conWithMatch: ConWithMatch | null;
  instrumentalMatch: InstrumentalMatch | null;
  belongingMatch: BelongingMatch | null;
  transportMatch: TransportMatch | null;
  isObject?: boolean;
  isHuman?: boolean;
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
  ctx: SuffixApplicationContext
): SuffixApplicationResult {
  const {
    baseGup,
    localIdx,
    mode,
    mirriMiriwMatch,
    locativeMatch,
    conWithMatch,
    instrumentalMatch,
    belongingMatch,
    transportMatch,
    isObject,
    isHuman,
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
    } else if (locativeMatch.suffixType === "ngura") {
      const finalGup = applyLocativeSuffix(baseGup);
      return {
        gup: finalGup,
        suffix: "ŋura",
        explanation: `${baseGup} + -ŋura = ${finalGup} (${config.locativeExplanation})`,
      };
    } else if (locativeMatch.suffixType === "ergative") {
      const result = applyErgativeSuffix(baseGup);
      return {
        gup: result.suffixed,
        suffix: "ergative",
        explanation: `${baseGup} + -${result.suffix} = ${result.suffixed} (instrumental)`,
      };
    } else if (locativeMatch.suffixType === "belonging") {
      const suffixResult = determineBelongingSuffix(baseGup, mode);
      const alternatives = suffixResult.suffixes.map(s => ({
        gup: applyBelongingSuffix(baseGup, s),
        suffix: s,
        explanation: `${baseGup} + -${s} (belonging)`
      }));
      const finalGup = alternatives[0].gup;
      return {
        gup: finalGup,
        suffix: "belonging",
        explanation: `${baseGup} + belonging = ${alternatives.map(a => a.gup).join(" / ")} (-wuy/-puy/-buy)`,
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
                  s
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
                    s
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
            s
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
            s
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
                s
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
              s
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
              s
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
            s
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
              s
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
                s
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
    if (isHuman === false) {
      const thingSuffix = hasNegation ? "miriw" : "mirri";
      const finalGup = applyMirriMiriwSuffix(baseGup, thingSuffix);
      const { suffixed: instrumentalGup, suffix: instrumentalSuffix } =
        applyErgativeSuffix(baseGup);
      return {
        gup: finalGup,
        suffix: thingSuffix,
        explanation: `${baseGup} + -${thingSuffix} = ${finalGup} (${config.withThing})`,
        alternatives: [
          {
            gup: instrumentalGup,
            suffix: instrumentalSuffix || "y",
            explanation: `${baseGup} + -${instrumentalSuffix} = ${instrumentalGup} (${config.instrumentalThing})`,
          },
        ],
      };
    }
    if (isHuman === undefined && !unknownConWithChoice) {
      const thingSuffix = hasNegation ? "miriw" : "mirri";
      const thingGup = applyMirriMiriwSuffix(baseGup, thingSuffix);
      const { suffixed: instrumentalGup, suffix: instrumentalSuffix } =
        applyErgativeSuffix(baseGup);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const humanOptions = humanSuffixes.map((s) => ({
        gup: applyHumanAssociativeSuffix(baseGup, s),
        suffix: s,
        explanation: `${baseGup} + -${s} = ${applyHumanAssociativeSuffix(
          baseGup,
          s
        )} (${config.withPerson})`,
      }));
      return {
        gup: thingGup,
        suffix: thingSuffix,
        explanation: `${baseGup} + -${thingSuffix} = ${thingGup} (${config.withThing})`,
        alternatives: [
          {
            gup: instrumentalGup,
            suffix: instrumentalSuffix || "y",
            explanation: `${baseGup} + -${instrumentalSuffix} = ${instrumentalGup} (${config.instrumentalThing})`,
          },
          ...humanOptions,
        ],
      };
    }
    if (unknownConWithChoice?.type === "human") {
      const suffix = unknownConWithChoice.suffix;
      const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
      const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
      const thingSuffix = hasNegation ? "miriw" : "mirri";
      const { suffixed: instrumentalGup, suffix: instrumentalSuffix } =
        applyErgativeSuffix(baseGup);
      const alternatives = [
        ...humanSuffixes
          .filter((s) => s !== suffix)
          .map((s) => ({
            gup: applyHumanAssociativeSuffix(baseGup, s),
            suffix: s,
            explanation: `${baseGup} + -${s} (${config.withPerson})`,
          })),
        {
          gup: applyMirriMiriwSuffix(baseGup, thingSuffix),
          suffix: thingSuffix,
          explanation: `${baseGup} + -${thingSuffix} (${config.withThing})`,
        },
        {
          gup: instrumentalGup,
          suffix: instrumentalSuffix || "y",
          explanation: `${baseGup} + -${instrumentalSuffix} (${config.instrumentalThing})`,
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
      const thingSuffix = hasNegation ? "miriw" : "mirri";
      const finalGup = applyMirriMiriwSuffix(baseGup, thingSuffix);
      return {
        gup: finalGup,
        suffix: thingSuffix,
        explanation: `${baseGup} + -${thingSuffix} = ${finalGup} (${config.withThing})`,
      };
    }
    if (unknownConWithChoice?.type === "instrumental") {
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
                s
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
          s
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
    const pronounForms = BELONGING_PRONOUNS_GUP[belongingMatch.pronounPersonNumber];
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
            s
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
  verbAltOverride: VerbRuleResult | null = null
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
    conWithMatch,
    comitativePronounMatch,
    humanAllativePronounMatch,
    humanAblativePronounMatch,
    sourceOriginPronounMatch,
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

  const shouldUseLocativeVerbMatch = ctx.locativeVerbMatchAlternative !== "ignore";
  const skipLocalIndices = new Set(baseSkipLocalIndices);
  if (!shouldUseLocativeVerbMatch && locativeMatch?.verbIndices) {
    for (const idx of locativeMatch.verbIndices) {
      skipLocalIndices.delete(idx);
    }
  }

  console.log("buildStandardParts - baseSkipLocalIndices:", Array.from(baseSkipLocalIndices));
  console.log("buildStandardParts - ŋarraMatch:", !!ctx.ngarraMatch, "verbIndex:", ctx.ngarraMatch?.verbIndex);

  if (ctx.locativeVerbMatch && shouldUseLocativeVerbMatch) {
    for (const idx of ctx.locativeVerbMatch.consumedIndices) {
      skipLocalIndices.add(idx);
    }
  }

  if (
    hasIrPatternWithPurpose &&
    irPatternAlternative === "use-literal" &&
    purposeInfinitiveMatch
  ) {
    skipLocalIndices.add(purposeInfinitiveMatch.mainVerbIndex);
    for (const idx of purposeInfinitiveMatch.consumedIndices) {
      if (
        purposeInfinitiveAlternative?.type === "future-simple" &&
        idx === purposeInfinitiveMatch.infinitiveIndex
      ) {
        continue;
      }
      skipLocalIndices.add(idx);
    }
  }

  if (
    purposeInfinitiveAlternative?.type === "conjugated-only" &&
    purposeInfinitiveMatch
  ) {
    skipLocalIndices.add(purposeInfinitiveMatch.mainVerbIndex);
  }

  const shouldUsePurposeInf =
    purposeInfinitiveMatch &&
    purposeInfinitiveAlternative?.type !== "future-simple" &&
    (!hasIrPatternWithPurpose || irPatternAlternative === "use-literal") &&
    !(ctx.locativeVerbMatch && shouldUseLocativeVerbMatch);
  if (shouldUsePurposeInf && purposeInfinitiveMatch) {
    skipLocalIndices.add(purposeInfinitiveMatch.infinitiveIndex);
    if (purposeInfinitiveMatch.hasAlternativePattern) {
      skipLocalIndices.add(purposeInfinitiveMatch.mainVerbIndex);
    }
    for (const idx of purposeInfinitiveMatch.consumedIndices) {
      skipLocalIndices.add(idx);
    }
  }
  if (!shouldUsePurposeInf && purposeInfinitiveMatch) {
    for (const idx of purposeInfinitiveMatch.consumedIndices) {
      if (idx === purposeInfinitiveMatch.infinitiveIndex) continue;
      skipLocalIndices.add(idx);
    }
    if (
      purposeInfinitiveMatch.mainVerbIndex !== undefined &&
      purposeInfinitiveMatch.mainVerbIndex !== purposeInfinitiveMatch.infinitiveIndex
    ) {
      skipLocalIndices.add(purposeInfinitiveMatch.mainVerbIndex);
    }
  }

  const negationWords = getNegationWords(mode);
  const verbHasYaka =
    verbResult?.results[0]?.particles.includes("yaka") || false;
  const hasNegation = context.hasNegation;

  const tokenStrings = fraseTokens.map((t) => t.original);
  const fixedMatches = findAllFixedMatches(tokenStrings, mode);
  const fixedIndices = getFixedIndices(fixedMatches);

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
    context.questionMatch?.consumedIndices || []
  );

  const shouldApplyLocativeVerbIndices =
    !!locativeMatch?.verbIndices &&
    !ctx.letUsMatch &&
    (ctx.locativeVerbMatchAlternative === undefined ||
      ctx.locativeVerbMatchAlternative === "use");

  if (shouldApplyLocativeVerbIndices && locativeMatch?.verbIndices) {
    const activeSuffixType = ctx.locativeSuffixChoice?.suffixType || locativeMatch.suffixType;

    for (const verbIdx of locativeMatch.verbIndices) {

      if (questionConsumed.has(verbIdx)) {
        continue;
      }

      const verbToken = fraseTokens[verbIdx];
      const verbGlobalIdx = globalIndices[verbIdx];


      if (verbToken.type === "verb" && verbToken.verbMatch) {
        const verbEntry = verbToken.verbMatch.entry;
        const verbQuaternary = verbEntry.forms[3];

        let verbWithSuffix: string;
        let suffixName: string;
        let suffixExplanation: string;
        let suffixAlternatives: { gup: string; suffix: string; explanation: string }[] | undefined;

        if (activeSuffixType === "lili") {
          verbWithSuffix = applyAllativeSuffix(verbQuaternary);
          suffixName = ALLATIVE_SUFFIX;
          suffixExplanation = LANG_CONFIG[mode].allativeSuffixLabel || "allative";
        } else if (activeSuffixType === "nguru") {
          verbWithSuffix = applyAblativeSuffix(verbQuaternary);
          suffixName = ABLATIVE_SUFFIX;
          suffixExplanation = LANG_CONFIG[mode].ablativeSuffixLabel || "ablative";
        } else if (activeSuffixType === "ergative") {
          const result = applyErgativeSuffix(verbQuaternary);
          verbWithSuffix = result.suffixed;
          suffixName = result.suffix || "ergative";
          suffixExplanation = "instrumental suffix";
        } else if (activeSuffixType === "belonging") {
          const suffixResult = determineBelongingSuffix(verbQuaternary, mode);
          const alternatives = suffixResult.suffixes.map(s => ({
            gup: applyBelongingSuffix(verbQuaternary, s),
            suffix: s,
            explanation: `${verbQuaternary} + -${s}`
          }));
          verbWithSuffix = alternatives[0].gup;
          suffixName = alternatives[0].suffix;
          suffixExplanation = "belonging/associative suffix";
          suffixAlternatives = alternatives.length > 1 ? alternatives : undefined;
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

  for (let localIdx = 0; localIdx < fraseTokens.length; localIdx++) {
    const token = fraseTokens[localIdx];
    const globalIdx = globalIndices[localIdx];

    if (token.type === "verb") {
      console.log("Token loop - found verb at localIdx:", localIdx, "token:", token.original, "verbResult?.localIndex:", verbResult?.localIndex);
      console.log("skipLocalIndices at this point:", Array.from(skipLocalIndices));
    }

    if (skipLocalIndices.has(localIdx)) {
      console.log("Skipping localIdx:", localIdx, "reason: in skipLocalIndices");
      continue;
    }
    if (questionConsumed.has(localIdx)) {
      continue;
    }
    if (possessionHandled.has(localIdx)) continue;
    if (verbHasYaka && negationWords.includes(token.original.toLowerCase()))
      continue;

    if (
      possessivePronounMatch &&
      localIdx === possessivePronounMatch.possessedIndex &&
      !mirriMiriwMatch
    ) {
      const possessedToken = fraseTokens[possessivePronounMatch.possessedIndex];
      const possessedGup = possessedToken.gupKey || possessedToken.original;
      const gupForms =
        POSSESSIVE_PRONOUNS_GUP[possessivePronounMatch.personNumber];
      const possessiveGup = gupForms[0];

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
      const possessedNeedsNha =
        isTransitive &&
        possessedIsAfterVerb &&
        (possessedIsHuman || possessedIsUnknownType);

      let finalPossessedGup = possessedGup;
      let possessedSuffix: string | undefined;
      let possessedExplanation = `${possessedGup} (${LANG_CONFIG[mode].possessed})`;
      let possessedNhaOptions:
        | { gup: string; explanation: string }[]
        | undefined;

      let possessedSuffixAlternatives:
        | { gup: string; suffix: string; explanation: string }[]
        | undefined;

      if (possessedNeedsNha) {
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

      const possessedIdx = possessivePronounMatch.possessedIndex;
      const pronounIdx = possessivePronounMatch.pronounIndex;
      const possessedHasLocative =
        (locativeMatch?.nounIndices.includes(possessedIdx) ||
          locativeMatch?.nounIndices.includes(pronounIdx)) ??
        false;
      const possessedHasInstrumental =
        (context.instrumentalMatch?.nounIndices.includes(possessedIdx) ||
          context.instrumentalMatch?.nounIndices.includes(pronounIdx)) ??
        false;
      const possessedHasTransport =
        (context.transportMatch?.nounIndices.includes(possessedIdx) ||
          context.transportMatch?.nounIndices.includes(pronounIdx)) ??
        false;
      const possessedHasAllative =
        motionDestinations?.some(
          (d) => d.nounIdx === possessedIdx || d.nounIdx === pronounIdx
        ) ?? false;
      const possessedIsAgentTransitive =
        isTransitive && possessedIsHuman && possessedIdx < verbLocalIdx;

      const possessedHasGrammaticalSuffix =
        possessedHasLocative ||
        possessedHasInstrumental ||
        possessedHasTransport ||
        possessedHasAllative ||
        possessedIsAgentTransitive;

      const pronounSuffixAlternatives: {
        gup: string;
        suffix: string;
        explanation: string;
      }[] = [];

      if (gupForms.length > 1) {
        for (const form of gupForms.slice(1)) {
          pronounSuffixAlternatives.push({
            gup: form,
            suffix: "",
            explanation: `${possessivePronounMatch.pronounWord} = ${form} (${LANG_CONFIG[mode].possessive})`,
          });
        }
      }

      if (possessedHasGrammaticalSuffix) {
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
        explanation: `${possessivePronounMatch.pronounWord} = ${possessiveGup} (${LANG_CONFIG[mode].possessive})`,
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
      const possessorToken = fraseTokens[possessionMatch.possessorIndex];
      const possessedToken = fraseTokens[possessionMatch.possessedIndex];

      const possessorGup = possessorToken.gupKey || possessorToken.original;
      const possessedGup = possessedToken.gupKey || possessedToken.original;

      const suffixResult = determinePossessiveSuffix(possessorGup, mode);
      const suffix = suffixResult.suffixes[0];
      const possessorWithSuffix = applyPossessiveSuffix(possessorGup, suffix);

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
        (d) => d.nounIdx === possessedIdx
      );
      const possessedHasAllative = !!possessedMotionDest;
     

      if (possessedIsKnownVehicle) {
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
        finalPossessedGup = applyLocativeSuffix(possessedGup);
        possessedSuffix = "ŋura";
        possessedExplanation = `${possessedGup} + -ŋura = ${finalPossessedGup} (${LANG_CONFIG[mode].possessed} + ${LANG_CONFIG[mode].locativeSuffix})`;
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

      if (suffixResult.suffixes.length > 1) {
        for (const s of suffixResult.suffixes.slice(1)) {
          possessorAlternatives.push({
            gup: applyPossessiveSuffix(possessorGup, s),
            suffix: s,
            explanation: `${possessorGup} + -${s} = ${applyPossessiveSuffix(
              possessorGup,
              s
            )} (${LANG_CONFIG[mode].possessor})`,
          });
        }
      }

      if (possessedHasGrammaticalSuffix) {
        const humanAssocSuffixes =
          determineHumanAssociativeSuffix(possessorGup);
        for (const s of humanAssocSuffixes) {
          const assocGup = applyHumanAssociativeSuffix(possessorGup, s);
          possessorAlternatives.push({
            gup: assocGup,
            suffix: s,
            explanation: `${possessorGup} + -${s} = ${assocGup} (${LANG_CONFIG[mode].withPerson})`,
          });
        }
      }

      const possessorIsHuman = possessorToken.nounMatch?.isHuman === true;
      if (!possessorIsHuman) {
        const belongingSuffixResult = determineBelongingSuffix(
          possessorGup,
          mode
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

      parts.push({
        type: "noun",
        source: `${possessionMatch.possessorWord} (possessor)`,
        sourceWord: possessionMatch.possessorWord,
        gup: possessorWithSuffix,
        baseGup: possessorGup,
        appliedSuffix: suffix,
        explanation: `${possessorGup} + -${suffix} = ${possessorWithSuffix} (${LANG_CONFIG[mode].possessor})`,
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
      const suffixResult = applySuffixBasedOnContext({
        baseGup,
        localIdx,
        mode,
        mirriMiriwMatch,
        locativeMatch,
        conWithMatch,
        instrumentalMatch: context.instrumentalMatch,
        belongingMatch: context.belongingMatch,
        transportMatch: context.transportMatch,
        isHuman: subjectResult.isHuman,
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

      parts.push({
        type: "subject",
        source: subjectResult.source,
        gup: finalGup,
        baseGup: subjectResult.baseGup,
        appliedSuffix,
        explanation: finalExplanation,
        suffixAlternatives: suffixResult.alternatives,
        globalIndex: globalIdx,
        role: subjectRole,
        isKnownNoun: subjectResult.type === "noun",
        isHuman: subjectResult.isHuman,
        irregularPlurals: subjectResult.irregularPlurals,
        isPlural: subjectResult.isPlural,
      });
      continue;
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
      const suffixResult = applySuffixBasedOnContext({
        baseGup,
        localIdx,
        mode,
        mirriMiriwMatch,
        locativeMatch,
        conWithMatch,
        instrumentalMatch: context.instrumentalMatch,
        belongingMatch: context.belongingMatch,
        transportMatch: context.transportMatch,
        isObject: true,
        isHuman: objectResult.isHuman ?? undefined,
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

      parts.push({
        type: "object",
        source: objectResult.source,
        gup: finalGup,
        baseGup: objectResult.baseGup || objectResult.gup,
        appliedSuffix,
        explanation: finalExplanation,
        objectOptions:
          objectResult.options.length > 0 ? objectResult.options : undefined,
        suffixAlternatives: suffixResult.alternatives,
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
    const effectiveVerbResult =
      hasIrPatternWithPurpose && irPatternAlternative === "use-literal"
        ? null
        : verbResult;
    const effectiveLocativeMatch =
      !shouldUseLocativeVerbMatch && locativeMatch?.verbIndices
        ? { ...locativeMatch, verbIndices: [] }
        : locativeMatch;
    const tokenParts = tokenToParts(
      token,
      localIdx,
      effectiveVerbResult,
      globalIdx,
      hasDualMarker,
      mirriMiriwMatch,
      mode,
      effectiveLocativeMatch,
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
      verbAltOverride
    );
    if (token.type === "verb" && tokenParts.length > 0) {
      console.log("Added verb parts:", tokenParts.map(p => ({type: p.type, gup: p.gup})));
    }
    parts.push(...tokenParts);
  }

  if (comitativePronounMatch) {
    const gupForms = comitativePronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx =
      globalIndices[comitativePronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms
            .slice(1)
            .map((g) => ({
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
        ? gupForms
            .slice(1)
            .map((g) => ({
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
        ? gupForms
            .slice(1)
            .map((g) => ({
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

  if (sourceOriginPronounMatch && verbResult) {
    const gupForms = sourceOriginPronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx =
      globalIndices[sourceOriginPronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms
            .slice(1)
            .map((g) => ({
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

  if (purposePronounMatch && !indirectObjectMatch) {
    const gupForms = purposePronounMatch.gupForms;
    const firstGup = gupForms[0];
    const globalIdx = globalIndices[purposePronounMatch.triggerIndices[0]] || 0;

    const suffixAlts =
      gupForms.length > 1
        ? gupForms
            .slice(1)
            .map((g) => ({
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

    if (personNumber) {
      const possessiveForms = POSSESSIVE_PRONOUNS_GUP[personNumber];
      if (possessiveForms && possessiveForms.length > 0) {
        const firstGup = possessiveForms[0];
        const suffixAlts =
          possessiveForms.length > 1
            ? possessiveForms
                .slice(1)
                .map((g) => ({
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
          }" → ${firstGup} (${indirectObjectLabel})`,
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
        (t) => t.original.toLowerCase() === nounWord.toLowerCase()
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
  mode: LanguageMode
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

function tokenToParts(
  token: Token,
  localIdx: number,
  verbResult: { results: VerbRuleResult[]; localIndex: number } | null,
  globalIdx: number,
  hasDualMarker: boolean = false,
  mirriMiriwMatch: MirriMiriwMatch | null = null,
  mode: LanguageMode,
  locativeMatch: LocativeMatch | null = null,
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
  verbAltOverride: VerbRuleResult | null = null
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

  if (token.type === "verb") {
    const isInLocativeNouns = locativeMatch?.nounIndices.includes(localIdx);
    const isInBelongingNouns = belongingMatch?.belongsToNounIndices.includes(localIdx);
    const isInConWithNouns = conWithMatch?.nounIndices.includes(localIdx);
    const isInInstrumentalNouns = instrumentalMatch?.nounIndices.includes(localIdx);
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


  const isInLocativeVerbIndices = locativeMatch?.verbIndices?.includes(localIdx) || false;

  if (
    token.type === "verb" &&
    verbResult &&
    localIdx === verbResult.localIndex &&
    !locativeVerbChoice &&
    !isInLocativeVerbIndices
  ) {

    const first = verbAltOverride || verbResult.results[0];
    console.log("Verb processing - verbAltOverride:", verbAltOverride?.gup, "first.gup:", first.gup);
    const parts: TranslationPart[] = [
      {
        type: "verb",
        source: token.original,
        gup: first.gup,
        baseGup: first.baseGup,
        explanation: first.explanation,
        verbOptions:
          !verbAltOverride && verbResult.results.length > 1 ? verbResult.results : undefined,
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
            ? cliticInfo.options
                .slice(1)
                .map((o) => ({
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
      conWithMatch,
      instrumentalMatch,
      belongingMatch,
      transportMatch,
      isObject: true,
      isHuman: token.nounMatch?.isHuman,
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

    return [
      {
        type: "noun",
        source: token.original,
        gup: finalGup,
        baseGup: token.gupKey,
        appliedSuffix,
        explanation,
        suffixAlternatives: suffixResult.alternatives,
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
        alternatives: suffixResult.alternatives,
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
              ? comitativeForms
                  .slice(1)
                  .map((g) => ({
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
          ? options
              .slice(1)
              .map((o) => ({
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
    return [
      {
        type: "unknown",
        source: token.original,
        gup: suffixResult.gup,
        baseGup: token.original,
        appliedSuffix: suffixResult.suffix,
        explanation: suffixResult.explanation || LANG_CONFIG[mode].unknownKey,
        suffixAlternatives: suffixResult.alternatives,
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
  adjNounGroups: AdjectiveNounGroup[]
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

  applyAdjectiveSuffixes(allParts, adjNounGroups, mode);

  const finalOutputParts: string[] = [];
  for (const part of allParts) {
    finalOutputParts.push(part.gup);
  }


  return {
    output: finalOutputParts.join(" "),
    parts: allParts,
  };
}
