import { LanguageMode } from "@/app/components/types/components.type";
import { getNegationWords, getAuxiliaryPerson, LANG_CONFIG } from "./constants";

export { getNegationWords, getAuxiliaryPerson };

export type PatternTense = "present" | "past" | "future";

export interface VerbPattern {
  name: string;
  match: PatternMatcher[];
  result: {
    tense: PatternTense;
    isContinuous: boolean;
  };
}

type PatternMatcher =
  | { type: "wordList"; words: string[] }
  | { type: "verbForm"; forms: string[] }
  | { type: "literal"; word: string };

export function getPatterns(mode: LanguageMode): VerbPattern[] {
  const { patterns } = LANG_CONFIG[mode];
  return patterns;
}
