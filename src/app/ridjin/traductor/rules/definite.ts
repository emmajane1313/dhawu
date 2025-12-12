import { LanguageMode } from "@/app/components/types/components.type";
import { DeterminerMatch, DeterminerType } from "../patternMatcher";
import { LANG_CONFIG } from "../constants";
import { generateCombinations } from "../utils";

export interface DefinitePart {
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
  globalIndex?: number;
  determinerType?: DeterminerType;
  [key: string]: unknown;
}

export interface DefiniteTranslation {
  gup: string;
  parts: DefinitePart[];
  explanation: string;
}

export type DemoOption = "none" | "dhuwala" | "dhuwali";

export function getDemonstrativeOptionsForType(
  determinerType: "this" | "that" | "definite" | null
): DemoOption[] {
  if (determinerType === "this") return ["dhuwala"];
  if (determinerType === "that") return ["dhuwali"];
  if (determinerType === "definite") return ["none", "dhuwala", "dhuwali"];
  return ["none"];
}

export function applyDemonstrativeToGup(
  baseGup: string,
  determinerType: "this" | "that" | "definite" | null,
  includeBase: boolean = true
): string[] {
  const options = getDemonstrativeOptionsForType(determinerType);
  const results: string[] = [];

  for (const opt of options) {
    if (opt === "none") {
      if (includeBase) results.push(baseGup);
    } else {
      results.push(`${opt} ${baseGup}`);
    }
  }

  return results;
}

function hasCopulaVerb(tokens: string[], mode: LanguageMode): boolean {
  const { copulaVerbs, thatWords, thisWords } = LANG_CONFIG[mode];
  const demonstratives = [...thisWords, ...thatWords];
  return tokens.some((t) => {
    const lower = t.toLowerCase();
    return copulaVerbs.includes(lower) && !demonstratives.includes(lower);
  });
}

export function applyDefiniteDemonstratives(
  translations: DefiniteTranslation[],
  tokens: string[],
  mode: LanguageMode,
  determinerMatches: DeterminerMatch[]
): DefiniteTranslation[] {
  if (determinerMatches.length === 0) return translations;

  const hasCopula = hasCopulaVerb(tokens, mode);
  const hasThisOrThat = determinerMatches.some(
    (m) => m.type === "this" || m.type === "that"
  );

  if (hasCopula && hasThisOrThat) return translations;

  const results: DefiniteTranslation[] = [];

  for (const tr of translations) {
    const nounParts = tr.parts.filter(
      (p) =>
        p.type === "noun" ||
        p.type === "subject" ||
        p.type === "object" ||
        p.type === "unknown"
    );

    const matchedParts: { part: DefinitePart; match: DeterminerMatch }[] = [];

    for (const part of nounParts) {
      const match = determinerMatches.find(
        (m) => m.nounWord.toLowerCase() === part.source.toLowerCase()
      );
      if (match) {
        matchedParts.push({ part, match });
      }
    }

    if (matchedParts.length === 0) {
      results.push(tr);
      continue;
    }

    const allExplicitDemonstratives = matchedParts.every(
      ({ match }) => match.type === "this" || match.type === "that"
    );

    if (!allExplicitDemonstratives) {
      results.push(tr);
    }

    const optionsPerPart: DemoOption[][] = matchedParts.map(({ match }) =>
      getDemonstrativeOptionsForType(match.type as "this" | "that" | "definite")
    );

    const allCombos = generateCombinations(optionsPerPart);

    for (const combo of allCombos) {
      const allNone = combo.every((c) => c === "none");
      if (allNone) continue;

      let newParts = [...tr.parts];
      for (let i = 0; i < matchedParts.length; i++) {
        const { part } = matchedParts[i];
        const demo = combo[i];
        if (demo === "none") continue;

        const base = part.gup;
        const demoEs = demo === "dhuwala" ? "este/esta" : "ese/esa";
        const demoEn = demo === "dhuwala" ? "this" : "that";

        const newPart: DefinitePart = {
          ...part,
          gup: `${demo} ${base}`,
          explanation: `${demo} (${demoEs}) + ${
            part[LANG_CONFIG[mode].explainKey]
          }`,
          determinerType: demo === "dhuwala" ? "this" : "that",
        };

        newParts = newParts.map((p) => (p === part ? newPart : p));
      }

      const newGup = newParts
        .map((p) => p.gup)
        .filter((g) => g)
        .join(" ");
      results.push({
        gup: newGup,
        parts: newParts,
        explanation: `${tr.explanation} (${LANG_CONFIG[mode].definido})`,
      });
    }
  }

  return results;
}
