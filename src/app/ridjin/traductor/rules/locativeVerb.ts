import { LanguageMode } from "@/app/components/types/components.type";
import { LocativeCopulaMatch, PositionType } from "../patternMatcher";
import {
  LocativeVerbType,
  LOCATIVE_VERBS,
  LocativeVerbInfo,
  LANG_CONFIG,
} from "../constants";
import {
  VerbFeatures,
  VerbConjugationType,
  determineVerbForms,
  detectVerbFeatures,
  VerbFormNumber,
} from "./verb";

export interface LocativeVerbResult {
  gup: string;
  baseGup: string;
  particles: string[];
  formUsed: VerbFormNumber;
  verbType: LocativeVerbType;
  label: string;
  explanation: string;
  features: VerbFeatures;
}

function getLocativeVerbInfo(
  verbType: LocativeVerbType
): LocativeVerbInfo | null {
  return LOCATIVE_VERBS.find((v) => v.gupKey === verbType) || null;
}

function getLocativeVerbForm(
  verbType: LocativeVerbType,
  formNumber: VerbFormNumber
): string | null {
  const info = getLocativeVerbInfo(verbType);
  if (!info) return null;
  return info.forms[formNumber - 1] || null;
}

function getVerbLabel(verbInfo: LocativeVerbInfo, mode: LanguageMode): string {
  const labelKey = LANG_CONFIG[mode].labelKey as keyof LocativeVerbInfo;
  return verbInfo[labelKey] as string;
}

function mapCopulaTenseToFeatures(
  tense: "present" | "past" | "future",
  isContinuous: boolean,
  fraseTokens: string[],
  mode: LanguageMode
): VerbFeatures {
  let conjugationType: VerbConjugationType;
  if (tense === "past") {
    conjugationType = isContinuous ? "imperfect" : "preterite";
  } else if (tense === "future") {
    conjugationType = "future";
  } else {
    conjugationType = "presentIndicative";
  }

  const features = detectVerbFeatures(
    fraseTokens,
    false,
    conjugationType,
    mode
  );

  return {
    ...features,
    tense,
    isFuture: tense === "future",
    isSameDayPast: tense === "past",
    isYesterdayPast: tense === "past",
    isGerund: isContinuous,
    isContinuousFuture: tense === "future" && isContinuous,
  };
}

export function generateLocativeVerbResults(
  locativeCopulaMatch: LocativeCopulaMatch,
  fraseTokens: string[],
  mode: LanguageMode
): LocativeVerbResult[] {
  const config = LANG_CONFIG[mode];
  const results: LocativeVerbResult[] = [];

  const features = mapCopulaTenseToFeatures(
    locativeCopulaMatch.tense,
    locativeCopulaMatch.isContinuous,
    fraseTokens,
    mode
  );

  const options = determineVerbForms(features, mode);

  for (const verbType of locativeCopulaMatch.suggestedVerbs) {
    const verbInfo = getLocativeVerbInfo(verbType);
    if (!verbInfo) continue;

    const label = getVerbLabel(verbInfo, mode);

    for (const option of options) {
      const baseGup = getLocativeVerbForm(verbType, option.form);
      if (!baseGup) continue;

      const particlesStr =
        option.particles.length > 0 ? option.particles.join(" ") + " " : "";
      const gup = particlesStr + baseGup;

      results.push({
        gup,
        baseGup,
        particles: option.particles,
        formUsed: option.form,
        verbType,
        label,
        explanation: `${config.pos} "${label}": ${option.explanation}`,
        features,
      });
    }
  }

  if (results.length === 0 && locativeCopulaMatch.suggestedVerbs.length > 0) {
    const defaultVerbType = locativeCopulaMatch.suggestedVerbs[0];
    const verbInfo = getLocativeVerbInfo(defaultVerbType);
    if (verbInfo) {
      const label = getVerbLabel(verbInfo, mode);
      const baseGup = verbInfo.forms[0];
      const particles =
        features.tense === "future"
          ? ["dhu"]
          : features.polarity === "negative"
          ? ["yaka", "ga"]
          : ["ga"];
      const particlesStr = particles.join(" ") + " ";
      const gup = particlesStr + baseGup;

      results.push({
        gup,
        baseGup,
        particles,
        formUsed: 1,
        verbType: defaultVerbType,
        label,
        explanation: `${config.pos} "${label}" (${config.base})`,
        features,
      });
    }
  }

  return results;
}

export function getLocativeVerbsForSubject(
  isHuman: boolean | null,
  positionType: PositionType
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

export function getLocativeVerbExplanations(
  verbTypes: LocativeVerbType[],
  mode: LanguageMode
): string[] {
  return verbTypes.map((vt) => {
    const info = getLocativeVerbInfo(vt);
    if (!info) return vt;
    return `${vt} (${getVerbLabel(info, mode)})`;
  });
}
