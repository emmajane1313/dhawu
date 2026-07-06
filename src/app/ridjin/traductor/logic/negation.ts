import { LanguageId, PersonNumber } from "../core/types";
import { AuxInfo } from "./verbAux";
import { TokenLike, normalizeToken } from "./tokenUtils";

export type NegationPattern = {
  tokens: string[];
  allowsPresent: boolean;
  allowsImperative: boolean;
  presentPersonsOverride?: PersonNumber[];
  forcePastSimple?: boolean;
  forceAux?: AuxInfo;
  forceFuture?: boolean;
};

export function getNegationPatterns(lang: LanguageId): NegationPattern[] {
  if (lang === "es") {
    return [
      {
        tokens: ["no"],
        allowsPresent: true,
        allowsImperative: true,
      },
      {
        tokens: ["nunca"],
        allowsPresent: true,
        allowsImperative: false,
      },
      {
        tokens: ["jamás"],
        allowsPresent: true,
        allowsImperative: false,
      },
      {
        tokens: ["jamas"],
        allowsPresent: true,
        allowsImperative: false,
      },
      {
        tokens: ["no", "nunca"],
        allowsPresent: true,
        allowsImperative: false,
      },
    ];
  }

  return [
    {
      tokens: ["not"],
      allowsPresent: true,
      allowsImperative: false,
    },
    {
      tokens: ["never"],
      allowsPresent: true,
      allowsImperative: false,
    },
    {
      tokens: ["didn't"],
      allowsPresent: false,
      allowsImperative: false,
      forcePastSimple: true,
    },
    {
      tokens: ["didnt"],
      allowsPresent: false,
      allowsImperative: false,
      forcePastSimple: true,
    },
    {
      tokens: ["did", "not"],
      allowsPresent: false,
      allowsImperative: false,
      forcePastSimple: true,
    },
    {
      tokens: ["wasn't"],
      allowsPresent: false,
      allowsImperative: false,
      forceAux: {
        persons: ["1_Sing", "3_Sing"],
        tense: "past",
      },
    },
    {
      tokens: ["wasnt"],
      allowsPresent: false,
      allowsImperative: false,
      forceAux: {
        persons: ["1_Sing", "3_Sing"],
        tense: "past",
      },
    },
    {
      tokens: ["was", "not"],
      allowsPresent: false,
      allowsImperative: false,
      forceAux: {
        persons: ["1_Sing", "3_Sing"],
        tense: "past",
      },
    },
    {
      tokens: ["weren't"],
      allowsPresent: false,
      allowsImperative: false,
      forceAux: {
        persons: ["2_Sing", "2_Plur", "1+2_Plur", "3_Plur"],
        tense: "past",
      },
    },
    {
      tokens: ["werent"],
      allowsPresent: false,
      allowsImperative: false,
      forceAux: {
        persons: ["2_Sing", "2_Plur", "1+2_Plur", "3_Plur"],
        tense: "past",
      },
    },
    {
      tokens: ["were", "not"],
      allowsPresent: false,
      allowsImperative: false,
      forceAux: {
        persons: ["2_Sing", "2_Plur", "1+2_Plur", "3_Plur"],
        tense: "past",
      },
    },
    {
      tokens: ["will", "not"],
      allowsPresent: false,
      allowsImperative: false,
      forceFuture: true,
    },
    {
      tokens: ["won't"],
      allowsPresent: false,
      allowsImperative: false,
      forceFuture: true,
    },
    {
      tokens: ["wont"],
      allowsPresent: false,
      allowsImperative: false,
      forceFuture: true,
    },
    {
      tokens: ["don't"],
      allowsPresent: true,
      allowsImperative: true,
    },
    {
      tokens: ["dont"],
      allowsPresent: true,
      allowsImperative: true,
    },
    {
      tokens: ["do", "not"],
      allowsPresent: true,
      allowsImperative: true,
    },
    {
      tokens: ["doesn't"],
      allowsPresent: true,
      allowsImperative: false,
      presentPersonsOverride: ["3_Sing"],
    },
    {
      tokens: ["doesnt"],
      allowsPresent: true,
      allowsImperative: false,
      presentPersonsOverride: ["3_Sing"],
    },
    {
      tokens: ["does", "not"],
      allowsPresent: true,
      allowsImperative: false,
      presentPersonsOverride: ["3_Sing"],
    },
    {
      tokens: ["let's", "not"],
      allowsPresent: false,
      allowsImperative: true,
    },
    {
      tokens: ["lets", "not"],
      allowsPresent: false,
      allowsImperative: true,
    },
  ];
}

export function matchNegationPattern(
  tokens: TokenLike[],
  start: number,
  lang: LanguageId,
  patterns: NegationPattern[]
): NegationPattern | null {
  for (const pattern of patterns) {
    let matched = true;
    for (let offset = 0; offset < pattern.tokens.length; offset += 1) {
      const token = tokens[start + offset];
      if (!token) {
        matched = false;
        break;
      }
      const normalized = normalizeToken(token.source, lang);
      if (normalized !== pattern.tokens[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return pattern;
  }
  return null;
}

export function isNegatorToken(
  token: TokenLike | undefined,
  lang: LanguageId
): boolean {
  if (!token) return false;
  const normalized = normalizeToken(token.source, lang);
  const patterns = getNegationPatterns(lang);
  return patterns.some(
    (pattern) => pattern.tokens.length === 1 && pattern.tokens[0] === normalized
  );
}
