import { LanguageMode } from "@/app/components/types/components.type";
import { VerbMatch } from "../tokenizer";
import { LEXICON } from "../lexicon";
import {
  hasMultiWordMarker,
  normalizeApostrophes,
  LANG_CONFIG,
  determineDjalSuffix,
  applyDjalSuffix,
} from "../constants";

export type VerbFormNumber = 1 | 2 | 3 | 4;
export type VerbFormName = "primary" | "secondary" | "tertiary" | "quaternary";

export const FORM_NAMES: Record<VerbFormNumber, VerbFormName> = {
  1: "primary",
  2: "secondary",
  3: "tertiary",
  4: "quaternary",
};

export const CONTINUOUS_PARTICLES: Record<
  VerbFormNumber,
  { main: string; alternatives?: string[] }
> = {
  1: { main: "ga", alternatives: ["yukurra"] },
  2: { main: "gi", alternatives: ["yukurri"] },
  3: { main: "gana", alternatives: ["yukurrana"] },
  4: { main: "gana", alternatives: ["ganha"] },
};

export type VerbMood = "indicative" | "imperative" | "subjunctive";
export type VerbConjugationType =
  | "presentIndicative"
  | "preterite"
  | "imperfect"
  | "future"
  | "conditional"
  | "presentSubjunctive"
  | "imperative"
  | "infinitive"
  | "gerund"
  | "pastParticiple"
  | null;

export interface VerbFeatures {
  tense: "present" | "past" | "future" | "unknown";
  polarity: "positive" | "negative";
  isGerund: boolean;
  mood: VerbMood;
  isContinuousImperative: boolean;
  isFuture: boolean;
  isContinuousFuture: boolean;
  hasToday: boolean;
  hasSpecifiedFutureTime: boolean;
  hasAlready: boolean;
  isSameDayPast: boolean;
  isYesterdayPast: boolean;
  hasYesterday: boolean;
}

export interface ContinuousInfo {
  particle: string;
  alternatives?: string[];
  isActive: boolean;
}

export interface VerbFormOption {
  form: VerbFormNumber;
  formName: VerbFormName;
  particles: string[];
  continuous?: ContinuousInfo;
  explanation: string;
}

export interface VerbRuleResult {
  gup: string;
  baseGup: string;
  particles: string[];
  formUsed: VerbFormNumber;
  formName: VerbFormName;
  explanation: string;
  features: VerbFeatures;
  options: VerbFormOption[];
  hasAmbiguity: boolean;
}

export function detectVerbFeatures(
  tokens: string[],
  isImperativeMood: boolean = false,
  conjugationType: VerbConjugationType = null,
  mode: LanguageMode
): VerbFeatures {
  const lowerTokens = tokens.map((t) => normalizeApostrophes(t.toLowerCase()));

  const {
    negation,
    alreadyMarkers,
    continuousImperativeMarkers,
    todayMarkers,
    yesterdayMarkers,
    specifiedFutureMarkers,
  } = LANG_CONFIG[mode];

  let polarity: VerbFeatures["polarity"] = "positive";
  if (negation.some((w) => lowerTokens.includes(w))) {
    polarity = "negative";
  }

  const config = LANG_CONFIG[mode];
  let isGerund = false;
  if (conjugationType === "gerund") {
    isGerund = true;
  } else if (
    lowerTokens.some((t) => config.gerundEndings.some((e) => t.endsWith(e)))
  ) {
    isGerund = true;
  }

  if (!isGerund && conjugationType === "imperfect") {
    isGerund = true;
  }

  const isFutureConjugation =
    conjugationType === "future" || conjugationType === "conditional";
  const isFuture = isFutureConjugation;

  const hasToday = hasMultiWordMarker(lowerTokens, todayMarkers);
  const hasYesterday = hasMultiWordMarker(lowerTokens, yesterdayMarkers);
  const hasSpecifiedFutureTime = hasMultiWordMarker(
    lowerTokens,
    specifiedFutureMarkers
  );
  const hasAlready = hasMultiWordMarker(lowerTokens, alreadyMarkers);

  const isPastConjugation =
    conjugationType === "preterite" || conjugationType === "imperfect";
  const isPast = isPastConjugation;
  let isSameDayPast = false;
  let isYesterdayPast = false;

  if (isPast && !isFuture) {
    if (hasYesterday) {
      isYesterdayPast = true;
    } else if (hasToday) {
      isSameDayPast = true;
    } else {
      isSameDayPast = true;
      isYesterdayPast = true;
    }
  }

  let isContinuousFuture = false;
  if (isFuture && isGerund) {
    isContinuousFuture = true;
  }

  let tense: VerbFeatures["tense"] = "present";
  if (isPast) {
    tense = "past";
  } else if (isFuture) {
    tense = "future";
  } else if (
    conjugationType === "presentIndicative" ||
    conjugationType === "presentSubjunctive" ||
    conjugationType === "gerund"
  ) {
    tense = "present";
  }

  let mood: VerbMood = "indicative";
  let isContinuousImperative = false;

  if (isImperativeMood) {
    mood = "imperative";
    isContinuousImperative = hasMultiWordMarker(
      lowerTokens,
      continuousImperativeMarkers
    );
  } else if (conjugationType === "presentSubjunctive") {
    mood = "subjunctive";
  }

  return {
    tense,
    polarity,
    isGerund,
    mood,
    isContinuousImperative,
    isFuture,
    isContinuousFuture,
    hasToday,
    hasSpecifiedFutureTime,
    hasAlready,
    isSameDayPast,
    isYesterdayPast,
    hasYesterday,
  };
}

export function determineVerbForms(
  features: VerbFeatures,
  mode: LanguageMode,
  conjugationType?: VerbConjugationType
): VerbFormOption[] {
  const config = LANG_CONFIG[mode];
  const futureParticles = config.futureParticles ?? ["dhu"];
  const options: VerbFormOption[] = [];

  if (conjugationType === "infinitive" && !features.isGerund) {
    options.push({
      form: 4,
      formName: "quaternary",
      particles: [],
      continuous: {
        particle: "",
        isActive: false,
      },
      explanation: config.infinitive,
    });
    return options;
  }

  if (features.mood === "imperative") {
    const isNegative = features.polarity === "negative";

    if (features.isContinuousImperative) {
      options.push({
        form: 2,
        formName: "secondary",
        particles: isNegative ? ["yaka", "gi"] : ["gi"],
        continuous: {
          particle: "gi",
          alternatives: ["yukurri"],
          isActive: true,
        },
        explanation: isNegative
          ? config.negContinuousImperative
          : config.continuousImperative,
      });
    } else {
      options.push({
        form: 2,
        formName: "secondary",
        particles: isNegative ? ["yaka"] : [],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: isNegative ? config.negImperative : config.imperative,
      });
    }
    return options;
  }

  if (features.isFuture && features.hasToday) {
    const isNegative = features.polarity === "negative";
    if (features.isContinuousFuture) {
      options.push({
        form: 1,
        formName: "primary",
        particles: isNegative ? ["yaka", "dhu", "ga"] : ["dhu", "ga"],
        continuous: {
          particle: "ga",
          alternatives: ["yukurra"],
          isActive: true,
        },
        explanation: isNegative
          ? `${config.negContinuousFuture}: yaka + dhu + ga + ${config.primaryForm}`
          : `${config.continuousFuture}: dhu + ga + ${config.primaryForm}`,
      });
    } else {
      options.push({
        form: 1,
        formName: "primary",
        particles: isNegative ? ["yaka", "dhu"] : ["dhu"],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: isNegative
          ? `${config.negFuture}: yaka + dhu + ${config.primaryForm}`
          : `${config.future}: dhu + ${config.primaryForm}`,
      });
    }
  }

  if (
    features.isFuture &&
    features.hasSpecifiedFutureTime &&
    !features.hasToday
  ) {
    const isNegative = features.polarity === "negative";
    if (features.isContinuousFuture) {
      options.push({
        form: 2,
        formName: "secondary",
        particles: isNegative ? ["yaka", "dhu", "gi"] : ["dhu", "gi"],
        continuous: {
          particle: "gi",
          alternatives: ["yukurri"],
          isActive: true,
        },
        explanation: isNegative
          ? `${config.negContinuousFuture}: yaka + dhu + gi + ${config.secondaryForm} ${config.tomorrowNext}`
          : `${config.continuousFuture}: dhu + gi + ${config.secondaryForm} ${config.tomorrowNext}`,
      });
    } else {
      options.push({
        form: 2,
        formName: "secondary",
        particles: isNegative ? ["yaka", "dhu"] : ["dhu"],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: isNegative
          ? `${config.negFuture}: yaka + dhu + ${config.secondaryForm} ${config.tomorrowNext}`
          : `${config.future}: dhu + ${config.secondaryForm} ${config.tomorrowNext}`,
      });
    }
  }

  if (
    features.isFuture &&
    !features.hasToday &&
    !features.hasSpecifiedFutureTime
  ) {
    const isNegative = features.polarity === "negative";

    if (features.isContinuousFuture) {
      options.push({
        form: 1,
        formName: "primary",
        particles: isNegative ? ["yaka", "dhu", "ga"] : ["dhu", "ga"],
        continuous: {
          particle: "ga",
          alternatives: ["yukurra"],
          isActive: true,
        },
        explanation: isNegative
          ? `${config.todayUnspecified} ${config.negContinuousFuture}: yaka + dhu + ga + ${config.primaryForm}`
          : `${config.todayUnspecified} ${config.continuousFuture}: dhu + ga + ${config.primaryForm}`,
      });
      options.push({
        form: 2,
        formName: "secondary",
        particles: isNegative ? ["yaka", "dhu", "gi"] : ["dhu", "gi"],
        continuous: {
          particle: "gi",
          alternatives: ["yukurri"],
          isActive: true,
        },
        explanation: isNegative
          ? `${config.notTodaySpecified} ${config.negContinuousFuture}: yaka + dhu + gi + ${config.secondaryForm}`
          : `${config.notTodaySpecified} ${config.continuousFuture}: dhu + gi + ${config.secondaryForm}`,
      });
    } else {
      options.push({
        form: 1,
        formName: "primary",
        particles: isNegative ? ["yaka", "dhu"] : ["dhu"],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: isNegative
          ? `${config.todayUnspecified} ${config.negFuture}: yaka + dhu + ${config.primaryForm}`
          : `${config.todayUnspecified} ${config.future}: dhu + ${config.primaryForm}`,
      });
      options.push({
        form: 2,
        formName: "secondary",
        particles: isNegative ? ["yaka", "dhu"] : ["dhu"],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: isNegative
          ? `${config.notTodaySpecified} ${config.negFuture}: yaka + dhu + ${config.secondaryForm}`
          : `${config.notTodaySpecified} ${config.future}: dhu + ${config.secondaryForm}`,
      });
    }
  }

  if (
    features.isSameDayPast &&
    features.hasToday &&
    features.polarity === "positive"
  ) {
    if (features.isGerund) {
      options.push({
        form: 3,
        formName: "tertiary",
        particles: ["gana"],
        continuous: {
          particle: "gana",
          alternatives: ["yukurrana"],
          isActive: true,
        },
        explanation: `${config.continuousPastToday}: gana + ${config.tertiaryForm}`,
      });
    } else {
      options.push({
        form: 3,
        formName: "tertiary",
        particles: [],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: `${config.pastToday}: ${config.tertiaryForm}`,
      });
    }
  }

  if (
    features.isSameDayPast &&
    features.hasToday &&
    features.polarity === "negative"
  ) {
    if (features.isGerund) {
      options.push({
        form: 4,
        formName: "quaternary",
        particles: ["yaka", "gana"],
        continuous: {
          particle: "gana",
          alternatives: ["ganha"],
          isActive: true,
        },
        explanation: `${config.negContinuousPastToday}: yaka + gana + ${config.quaternaryForm}`,
      });
    } else {
      options.push({
        form: 4,
        formName: "quaternary",
        particles: ["yaka"],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: `${config.negPastToday}: yaka + ${config.quaternaryForm}`,
      });
    }
  }

  if (
    features.isYesterdayPast &&
    features.hasYesterday &&
    features.polarity === "positive"
  ) {
    if (features.isGerund) {
      options.push({
        form: 1,
        formName: "primary",
        particles: ["ga"],
        continuous: {
          particle: "ga",
          alternatives: ["yukurra"],
          isActive: true,
        },
        explanation: `${config.continuousPastYesterday}: ga + ${config.primaryForm}`,
      });
    } else {
      options.push({
        form: 1,
        formName: "primary",
        particles: [],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: `${config.pastYesterday}: ${config.primaryForm}`,
      });
    }
  }

  if (
    features.isYesterdayPast &&
    features.hasYesterday &&
    features.polarity === "negative"
  ) {
    if (features.isGerund) {
      options.push({
        form: 2,
        formName: "secondary",
        particles: ["yaka", "gi"],
        continuous: {
          particle: "gi",
          alternatives: ["yukurri"],
          isActive: true,
        },
        explanation: `${config.negContinuousPastYesterday}: yaka + gi + ${config.secondaryForm}`,
      });
    } else {
      options.push({
        form: 2,
        formName: "secondary",
        particles: ["yaka"],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: `${config.negPastYesterday}: yaka + ${config.secondaryForm}`,
      });
    }
  }

  if (
    features.isSameDayPast &&
    features.isYesterdayPast &&
    !features.hasToday &&
    !features.hasYesterday &&
    features.polarity === "positive"
  ) {
    if (features.isGerund) {
      options.push({
        form: 3,
        formName: "tertiary",
        particles: ["gana"],
        continuous: {
          particle: "gana",
          alternatives: ["yukurrana"],
          isActive: true,
        },
        explanation: `${config.todayUnspecified} ${config.continuousPastToday}: gana + ${config.tertiaryForm}`,
      });
      options.push({
        form: 1,
        formName: "primary",
        particles: ["ga"],
        continuous: {
          particle: "ga",
          alternatives: ["yukurra"],
          isActive: true,
        },
        explanation: `${config.yesterdaySpecified} ${config.continuousPastYesterday}: ga + ${config.primaryForm}`,
      });
    } else {
      options.push({
        form: 3,
        formName: "tertiary",
        particles: [],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: `${config.todayUnspecified} ${config.pastToday}: ${config.tertiaryForm}`,
      });
      options.push({
        form: 1,
        formName: "primary",
        particles: [],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: `${config.yesterdaySpecified} ${config.pastYesterday}: ${config.primaryForm}`,
      });
    }
  }

  if (
    features.isSameDayPast &&
    features.isYesterdayPast &&
    !features.hasToday &&
    !features.hasYesterday &&
    features.polarity === "negative"
  ) {
    if (features.isGerund) {
      options.push({
        form: 4,
        formName: "quaternary",
        particles: ["yaka", "gana"],
        continuous: {
          particle: "gana",
          alternatives: ["ganha"],
          isActive: true,
        },
        explanation: `${config.todayUnspecified} ${config.negContinuousPastToday}: yaka + gana + ${config.quaternaryForm}`,
      });
      options.push({
        form: 1,
        formName: "primary",
        particles: ["yaka", "ga"],
        continuous: {
          particle: "ga",
          alternatives: ["yukurra"],
          isActive: true,
        },
        explanation: `${config.yesterdaySpecified} ${config.negContinuousPastToday}: yaka + ga + ${config.primaryForm}`,
      });
    } else {
      options.push({
        form: 4,
        formName: "quaternary",
        particles: ["yaka"],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: `${config.todayUnspecified} ${config.negPastToday}: yaka + ${config.quaternaryForm}`,
      });
      options.push({
        form: 1,
        formName: "primary",
        particles: ["yaka"],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: `${config.yesterdaySpecified} ${config.negPastToday}: yaka + ${config.primaryForm}`,
      });
    }
  }

  if (
    features.tense === "present" &&
    features.polarity === "positive" &&
    options.length === 0
  ) {
    options.push({
      form: 1,
      formName: "primary",
      particles: ["ga"],
      continuous: {
        particle: "ga",
        alternatives: ["yukurra"],
        isActive: true,
      },
      explanation: `${config.present}: ga + ${config.primaryForm}`,
    });
  }

  if (
    features.tense === "present" &&
    features.polarity === "negative"
  ) {
    if (features.isGerund) {
      options.push({
        form: 2,
        formName: "secondary",
        particles: ["gi", "yaka"],
        continuous: {
          particle: "gi",
          alternatives: ["yukurri"],
          isActive: true,
        },
        explanation: `${config.negContinuousPresent}: gi + yaka + ${config.secondaryForm}`,
      });
    } else {
      options.push({
        form: 2,
        formName: "secondary",
        particles: ["yaka"],
        continuous: {
          particle: "",
          isActive: false,
        },
        explanation: `${config.negPresent}: yaka + ${config.secondaryForm}`,
      });
    }
  }

  const optionsWithYaka = options.filter((opt) =>
    opt.particles.includes("yaka")
  );
  for (const opt of optionsWithYaka) {
    const bayŋuParticles = opt.particles.map((p) =>
      p === "yaka" ? "bäyŋu" : p
    );
    const bayŋuExplanation = opt.explanation.replace(/yaka/g, "bäyŋu");
    options.push({
      ...opt,
      particles: bayŋuParticles,
      explanation: bayŋuExplanation,
    });
  }

  const expandedOptions: VerbFormOption[] = [];
  for (const option of options) {
    if (!option.particles.includes("dhu") || futureParticles.length <= 1) {
      expandedOptions.push(option);
      continue;
    }
    for (const particle of futureParticles) {
      const particles = option.particles.map((p) => (p === "dhu" ? particle : p));
      const explanation = option.explanation.replace("dhu", particle);
      expandedOptions.push({
        ...option,
        particles,
        explanation,
      });
    }
  }

  return expandedOptions;
}

export function getVerbGupForm(
  gupKey: string,
  formNumber: VerbFormNumber
): string | null {
  const entry = LEXICON.verbs[gupKey];
  if (!entry) return null;
  return entry.forms[formNumber - 1] || null;
}

function detectHasNegation(fraseTokens: string[], mode: LanguageMode): boolean {
  const { negation } = LANG_CONFIG[mode];
  const lowerTokens = fraseTokens.map((t) => t.toLowerCase());
  return lowerTokens.some((t) => negation.includes(t));
}

export function applyVerbRules(
  verbMatch: VerbMatch,
  fraseTokens: string[],
  fraseText: string,
  mode: LanguageMode,
  auxiliaryTense: "present" | "past" | "future" | null = null,
  auxiliaryIsContinuous: boolean = false,
  hasSubject: boolean = false,
  isLetUs: boolean = false
): VerbRuleResult[] {
  const config = LANG_CONFIG[mode];
  const conjugationType = verbMatch.tense as VerbConjugationType;

  const isImperativeForm = conjugationType === "imperative";
  const isSubjunctiveForm = conjugationType === "presentSubjunctive";
  const isInfinitiveForm = conjugationType === "infinitive";
  const isPresentIndicative = conjugationType === "presentIndicative";
  const hasExclamation = fraseText.includes("!");
  const hasNegation = detectHasNegation(fraseTokens, mode);

  const isImperativeMood =
    (hasNegation && isSubjunctiveForm && !hasSubject && hasExclamation) ||
    (isImperativeForm && !hasSubject) ||
    (!hasSubject &&
      hasExclamation &&
      (isPresentIndicative || isSubjunctiveForm || isInfinitiveForm));

  let features = detectVerbFeatures(
    fraseTokens,
    isImperativeMood,
    conjugationType,
    mode
  );

  if (auxiliaryTense) {
    features = {
      ...features,
      tense: auxiliaryTense,
      isFuture: auxiliaryTense === "future",
      isGerund: auxiliaryIsContinuous || features.isGerund,
      isContinuousFuture: auxiliaryTense === "future" && auxiliaryIsContinuous,
      isSameDayPast: auxiliaryTense === "past" ? true : features.isSameDayPast,
      isYesterdayPast:
        auxiliaryTense === "past" ? true : features.isYesterdayPast,
    };
  }

  const { continuousImperativeMarkers } = LANG_CONFIG[mode];

  const lowerTokens = fraseTokens.map((t) => t.toLowerCase());
  const hasContinuousImperativeMarker = continuousImperativeMarkers.some((m) =>
    lowerTokens.includes(m)
  );

  if (
    hasContinuousImperativeMarker &&
    hasExclamation &&
    auxiliaryIsContinuous
  ) {
    features = {
      ...features,
      mood: "imperative",
      isContinuousImperative: true,
    };
  }

  let verbOptions = determineVerbForms(features, mode, conjugationType);

  if (isLetUs) {
    verbOptions = [{
      form: 1,
      formName: "primary",
      particles: [],
      explanation: "Let's: primary form, no particles",
      continuous: undefined,
    }];
  }

  const results: VerbRuleResult[] = [];

  for (const option of verbOptions) {
    const baseGup = getVerbGupForm(verbMatch.gupKey, option.form);
    if (!baseGup) continue;

    if (
      isInfinitiveForm &&
      !features.isGerund &&
      !verbMatch.entry?.noInfinitiveSuffix &&
      !isLetUs
    ) {
      const suffixResult = determineDjalSuffix(baseGup);

      for (const suffix of suffixResult.suffixes) {
        const finalGup = applyDjalSuffix(baseGup, suffix);
        const finalExplanation = `${config.infinitive}: ${baseGup} + -${suffix} = ${finalGup}`;

        const particlesStr =
          option.particles.length > 0 ? option.particles.join(" ") + " " : "";
        const gup = particlesStr + finalGup;

        results.push({
          gup,
          baseGup: finalGup,
          particles: option.particles,
          formUsed: option.form,
          formName: option.formName,
          explanation: finalExplanation,
          features,
          options: verbOptions,
          hasAmbiguity:
            verbOptions.length > 1 || suffixResult.suffixes.length > 1,
        });
      }
    } else {
      const particlesStr =
        option.particles.length > 0 ? option.particles.join(" ") + " " : "";
      const gup = particlesStr + baseGup;

      results.push({
        gup,
        baseGup,
        particles: option.particles,
        formUsed: option.form,
        formName: option.formName,
        explanation: option.explanation,
        features,
        options: verbOptions,
        hasAmbiguity: verbOptions.length > 1,
      });
    }
  }

  if (results.length === 0) {
    const baseGup = getVerbGupForm(verbMatch.gupKey, 1) || verbMatch.gupKey;
    results.push({
      gup: baseGup,
      baseGup,
      particles: [],
      formUsed: 1,
      formName: "primary",
      explanation: config.baseFormNoRule,
      features,
      options: [],
      hasAmbiguity: false,
    });
  }

  if (isLetUs) {
    const letUsResults: VerbRuleResult[] = [];
    const quaternaryForm = getVerbGupForm(verbMatch.gupKey, 4);

    for (const result of results) {
      if (result.formUsed === 1 && result.particles.length === 0) {
        letUsResults.push({
          ...result,
          gup: result.baseGup,
          explanation: `Let's: ${result.baseGup} (primary form, no particles)`,
        });
        letUsResults.push({
          ...result,
          gup: result.baseGup + "na",
          baseGup: result.baseGup + "na",
          explanation: `Let's: ${result.baseGup}na (primary form + -na)`,
        });

        if (quaternaryForm) {
          const { applyAllativeSuffix } = require("../constants");
          const withAllative = applyAllativeSuffix(quaternaryForm);
          letUsResults.push({
            ...result,
            gup: withAllative,
            baseGup: withAllative,
            explanation: `Let's: ${quaternaryForm} + -lili = ${withAllative} (quaternary + allative)`,
          });
        }
      }
    }
    if (letUsResults.length > 0) {
      return letUsResults;
    }
  }

  return results;
}
