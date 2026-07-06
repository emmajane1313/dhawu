import { LanguageMode } from "@/app/components/types/components.type";
import { normalizeToken } from "./tokenUtils";

type TokenLike = { source: string };

const MIGHT_MARKERS_ES: string[][] = [
  ["quiza"],
  ["quizas"],
  ["quizá"],
  ["quizás"],
  ["tal", "vez"],
  ["talvez"],
  ["posiblemente"],
  ["probablemente"],
  ["acaso"],
];

const MIGHT_MARKERS_EN: string[][] = [
  ["might"],
  ["maybe"],
  ["perhaps"],
  ["possibly"],
];

const MARKERS_BY_LANG: Record<LanguageMode, string[][]> = {
  es: MIGHT_MARKERS_ES,
  en: MIGHT_MARKERS_EN,
};

export function collectMightMarkerIndices(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): number[] {
  const patterns = MARKERS_BY_LANG[sourceLang] ?? [];
  if (patterns.length === 0) return [];
  const normalized = tokens
    .map((token, idx) => ({
      norm: normalizeToken(token.source, sourceLang),
      idx,
    }))
    .filter((entry) => entry.norm);
  const indices = new Set<number>();
  for (const pattern of patterns) {
    if (pattern.length === 0) continue;
    for (let i = 0; i <= normalized.length - pattern.length; i += 1) {
      let match = true;
      for (let j = 0; j < pattern.length; j += 1) {
        if (normalized[i + j].norm !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        for (let j = 0; j < pattern.length; j += 1) {
          indices.add(normalized[i + j].idx);
        }
      }
    }
  }
  return Array.from(indices);
}

export function hasMightMarker(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): boolean {
  return collectMightMarkerIndices(tokens, sourceLang).length > 0;
}
