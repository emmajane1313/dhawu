import { LanguageMode } from "@/app/components/types/components.type";
import {
  NASALS,
  LIQUIDS,
  SEMIVOWELS,
  ALL_VOWELS,
  NON_GLOTTAL_STOPS,
  getWordEnding,
  validarFonologia,
  LANG_CONFIG,
} from "../constants";

export type PossessiveSuffixType = "wa" | "wu" | "ku" | "gu";

export interface PossessiveSuffixResult {
  suffixes: PossessiveSuffixType[];
  explanation: string;
}

export function determinePossessiveSuffix(
  gupWord: string,
  mode: LanguageMode
): PossessiveSuffixResult {
  const config = LANG_CONFIG[mode];
  const ending = getWordEnding(gupWord);
  const { char, hasGlottal, digraph } = ending;
  const effectiveEnding = digraph || char;

  if (ALL_VOWELS.includes(effectiveEnding)) {
    return {
      suffixes: ["wa", "wu"],
      explanation: `"${gupWord}" ${config.endsInVowel} -wa / -wu`,
    };
  }

  if (NON_GLOTTAL_STOPS.includes(effectiveEnding)) {
    return {
      suffixes: ["ku"],
      explanation: `"${gupWord}" ${config.endsInStop} -ku`,
    };
  }

  if (LIQUIDS.includes(effectiveEnding) || (hasGlottal && LIQUIDS.includes(char))) {
    return {
      suffixes: ["gu", "wu"],
      explanation: `"${gupWord}" ${config.endsInLiquid} -gu / -wu`,
    };
  }

  if (SEMIVOWELS.includes(effectiveEnding) || (hasGlottal && SEMIVOWELS.includes(char))) {
    return {
      suffixes: ["gu", "wu"],
      explanation: `"${gupWord}" ${config.endsInSemivowel} -gu / -wu`,
    };
  }

  if (NASALS.includes(effectiveEnding)) {
    return {
      suffixes: ["gu"],
      explanation: `"${gupWord}" ${config.endsInNasal} -gu`,
    };
  }

  return {
    suffixes: ["gu"],
    explanation: `"${gupWord}" → ${config.defaultSuffix} -gu`,
  };
}

export function applyPossessiveSuffix(gupWord: string, suffix: PossessiveSuffixType): string {
  const normalized = gupWord.replace(/['ʼ`']/g, "'");
  return validarFonologia(normalized + suffix);
}
