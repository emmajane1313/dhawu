import { LanguageMode } from "@/app/components/types/components.type";
import {
  NASALS,
  LIQUIDS,
  SEMIVOWELS,
  ALL_VOWELS,
  VOICELESS_STOPS,
  getWordEnding,
  validarFonologia,
  LANG_CONFIG,
} from "../constants";

export type BelongingSuffixType = "buy" | "puy" | "wuy";

export interface BelongingSuffixResult {
  suffixes: BelongingSuffixType[];
  explanation: string;
}

export function determineBelongingSuffix(
  gupWord: string,
  mode: LanguageMode
): BelongingSuffixResult {
  const config = LANG_CONFIG[mode];
  const ending = getWordEnding(gupWord);
  const { char, hasGlottal, digraph } = ending;
  const effectiveEnding = digraph || char;

  if (NASALS.includes(effectiveEnding)) {
    return {
      suffixes: ["buy"],
      explanation: `"${gupWord}" ${config.endsInNasal} -buy`,
    };
  }

  if (VOICELESS_STOPS.includes(effectiveEnding)) {
    return {
      suffixes: ["puy"],
      explanation: `"${gupWord}" ${config.endsInStop} -puy`,
    };
  }

  if (ALL_VOWELS.includes(effectiveEnding)) {
    return {
      suffixes: ["puy", "wuy"],
      explanation: `"${gupWord}" ${config.endsInVowel} -puy / -wuy`,
    };
  }

  if (LIQUIDS.includes(effectiveEnding) || (hasGlottal && LIQUIDS.includes(char))) {
    return {
      suffixes: ["puy", "wuy"],
      explanation: `"${gupWord}" ${config.endsInLiquid} -puy / -wuy`,
    };
  }

  if (SEMIVOWELS.includes(effectiveEnding) || (hasGlottal && SEMIVOWELS.includes(char))) {
    return {
      suffixes: ["puy", "wuy"],
      explanation: `"${gupWord}" ${config.endsInSemivowel} -puy / -wuy`,
    };
  }

  return {
    suffixes: ["puy"],
    explanation: `"${gupWord}" → -puy`,
  };
}

export function applyBelongingSuffix(gupWord: string, suffix: BelongingSuffixType): string {
  const normalized = gupWord.replace(/['ʼ`']/g, "'");
  const withoutGlottal = normalized.endsWith("'") ? normalized.slice(0, -1) : normalized;
  return validarFonologia(withoutGlottal + suffix);
}

export function isBelongingTriggerES(tokens: string[], index: number): boolean {
  const lowerTokens = tokens.map(t => t.toLowerCase());
  const word = lowerTokens[index];

  if (["para", "de", "del"].includes(word)) {
    return true;
  }

  if (word === "de" && index + 1 < tokens.length) {
    const next = lowerTokens[index + 1];
    if (["la", "el", "los", "las"].includes(next)) {
      return true;
    }
  }

  if (word === "para" && index + 1 < tokens.length) {
    const next = lowerTokens[index + 1];
    if (["la", "el", "los", "las"].includes(next)) {
      return true;
    }
  }

  return false;
}

export function isBelongingTriggerEN(tokens: string[], index: number): boolean {
  const lowerTokens = tokens.map(t => t.toLowerCase());
  const word = lowerTokens[index];

  if (["of", "for"].includes(word)) {
    return true;
  }

  if (word === "of" && index + 1 < tokens.length) {
    const next = lowerTokens[index + 1];
    if (next === "the") {
      return true;
    }
  }

  if (word === "for" && index + 1 < tokens.length) {
    const next = lowerTokens[index + 1];
    if (next === "the") {
      return true;
    }
  }

  return false;
}

