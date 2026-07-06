import { LanguageMode } from "@/app/components/types/components.type";
import type { PersonNumber } from "../core/types";
import { normalizeToken } from "./tokenUtils";

type TokenLike = { source: string };

const HABITUAL_MARKERS_ES: string[][] = [
  ["siempre"],
  ["todos", "los", "dias"],
  ["cada", "dia"],
  ["cada", "vez"],
  ["a", "menudo"],
  ["muy", "a", "menudo"],
  ["a", "veces"],
  ["nunca"],
  ["ninguno"],
  ["ninguna"],
  ["ningun"],
  ["cualquier"],
  ["cualquiera"],
  ["esa", "vez"],
];

const HABITUAL_MARKERS_EN: string[][] = [
  ["always"],
  ["every", "day"],
  ["each", "time"],
  ["often"],
  ["very", "often"],
  ["sometimes"],
  ["never"],
  ["none"],
  ["any"],
  ["that", "time"],
];

const PAST_HABITUAL_EXTRA_ES: string[][] = [
  ["solia"],
  ["solía"],
  ["solias"],
  ["solías"],
  ["soliamos"],
  ["solíamos"],
  ["soliais"],
  ["solíais"],
  ["solian"],
  ["solían"],
];

const PAST_HABITUAL_PERSONS_ES: Record<string, PersonNumber> = {
  solia: "1_Sing",
  "solía": "1_Sing",
  solias: "2_Sing",
  "solías": "2_Sing",
  soliamos: "1+2_Plur",
  "solíamos": "1+2_Plur",
  soliais: "2_Plur",
  "solíais": "2_Plur",
  solian: "3_Plur",
  "solían": "3_Plur",
};

const PAST_HABITUAL_EXTRA_EN: string[][] = [
  ["used", "to"],
  ["use", "to"],
  ["would"],
];

const MARKERS_BY_LANG: Record<LanguageMode, string[][]> = {
  es: HABITUAL_MARKERS_ES,
  en: HABITUAL_MARKERS_EN,
};

const PAST_MARKERS_BY_LANG: Record<LanguageMode, string[][]> = {
  es: [...HABITUAL_MARKERS_ES, ...PAST_HABITUAL_EXTRA_ES],
  en: [...HABITUAL_MARKERS_EN, ...PAST_HABITUAL_EXTRA_EN],
};

export function collectHabitualMarkerIndices(
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

export function isHabitualMarkerAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  const patterns = MARKERS_BY_LANG[sourceLang] ?? [];
  if (patterns.length === 0) return false;
  for (const pattern of patterns) {
    if (pattern.length === 0) continue;
    let match = true;
    for (let offset = 0; offset < pattern.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        match = false;
        break;
      }
      const normalized = normalizeToken(token.source, sourceLang);
      if (normalized !== pattern[offset]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

export function hasHabitualMarker(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): boolean {
  return collectHabitualMarkerIndices(tokens, sourceLang).length > 0;
}

export function collectPastHabitualMarkerIndices(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): number[] {
  const patterns = PAST_MARKERS_BY_LANG[sourceLang] ?? [];
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

export function isPastHabitualMarkerAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  const patterns = PAST_MARKERS_BY_LANG[sourceLang] ?? [];
  if (patterns.length === 0) return false;
  for (const pattern of patterns) {
    if (pattern.length === 0) continue;
    let match = true;
    for (let offset = 0; offset < pattern.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        match = false;
        break;
      }
      const normalized = normalizeToken(token.source, sourceLang);
      if (normalized !== pattern[offset]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

export function hasPastHabitualMarker(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): boolean {
  return collectPastHabitualMarkerIndices(tokens, sourceLang).length > 0;
}

export function resolvePastHabitualPersons(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): PersonNumber[] | null {
  if (sourceLang !== "es") return null;
  for (const token of tokens) {
    const normalized = normalizeToken(token.source, sourceLang);
    const person = PAST_HABITUAL_PERSONS_ES[normalized];
    if (person) return [person];
  }
  return null;
}
