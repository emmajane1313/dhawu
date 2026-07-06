import { LanguageMode } from "@/app/components/types/components.type";
import { PersonNumber } from "../core/types";
import { normalizeToken, stripSpanishDiacritics } from "./tokenUtils";

type TokenLike = { source: string };

type ShouldHaveMarker = {
  pattern: string[];
  persons?: PersonNumber[];
};

const normalizeShouldHave = (value: string, lang: LanguageMode): string => {
  const normalized = normalizeToken(value, lang);
  return lang === "es" ? stripSpanishDiacritics(normalized) : normalized;
};

const SHOULD_HAVE_MARKERS_ES: ShouldHaveMarker[] = [
  // debería haber...
  { pattern: ["deberia", "haber"], persons: ["1_Sing"] },
  { pattern: ["deberias", "haber"], persons: ["2_Sing"] },
  { pattern: ["deberia", "haber"], persons: ["3_Sing"] },
  { pattern: ["deberiamos", "haber"], persons: ["1+2_Plur"] },
  { pattern: ["deberiais", "haber"], persons: ["2_Plur"] },
  { pattern: ["deberian", "haber"], persons: ["3_Plur"] },
  // habría...
  { pattern: ["habria"], persons: ["1_Sing"] },
  { pattern: ["habrias"], persons: ["2_Sing"] },
  { pattern: ["habria"], persons: ["3_Sing"] },
  { pattern: ["habriamos"], persons: ["1+2_Plur"] },
  { pattern: ["habriais"], persons: ["2_Plur"] },
  { pattern: ["habrian"], persons: ["3_Plur"] },
  // hubiera...
  { pattern: ["hubiera"], persons: ["1_Sing"] },
  { pattern: ["hubieras"], persons: ["2_Sing"] },
  { pattern: ["hubiera"], persons: ["3_Sing"] },
  { pattern: ["hubieramos"], persons: ["1+2_Plur"] },
  { pattern: ["hubierais"], persons: ["2_Plur"] },
  { pattern: ["hubieran"], persons: ["3_Plur"] },
  // hubiese...
  { pattern: ["hubiese"], persons: ["1_Sing"] },
  { pattern: ["hubieses"], persons: ["2_Sing"] },
  { pattern: ["hubiese"], persons: ["3_Sing"] },
  { pattern: ["hubiesemos"], persons: ["1+2_Plur"] },
  { pattern: ["hubieseis"], persons: ["2_Plur"] },
  { pattern: ["hubiesen"], persons: ["3_Plur"] },
];

const SHOULD_HAVE_MARKERS_EN: ShouldHaveMarker[] = [
  { pattern: ["should", "have"] },
  { pattern: ["should", "not", "have"] },
  { pattern: ["would", "have"] },
  { pattern: ["would", "not", "have"] },
  { pattern: ["ought", "to", "have"] },
  { pattern: ["ought", "not", "to", "have"] },
];

const MARKERS_BY_LANG: Record<LanguageMode, ShouldHaveMarker[]> = {
  es: SHOULD_HAVE_MARKERS_ES,
  en: SHOULD_HAVE_MARKERS_EN,
};

const collectShouldHaveMatches = (
  tokens: TokenLike[],
  sourceLang: LanguageMode
): { indices: number[]; persons: PersonNumber[] } => {
  const patterns = MARKERS_BY_LANG[sourceLang] ?? [];
  if (patterns.length === 0) return { indices: [], persons: [] };
  const normalized = tokens
    .map((token, idx) => ({
      norm: normalizeShouldHave(token.source, sourceLang),
      idx,
    }))
    .filter((entry) => entry.norm);
  const indices = new Set<number>();
  const persons = new Set<PersonNumber>();
  for (const marker of patterns) {
    const pattern = marker.pattern.map((item) =>
      normalizeShouldHave(item, sourceLang)
    );
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
        if (marker.persons) {
          marker.persons.forEach((person) => persons.add(person));
        }
      }
    }
  }
  return { indices: Array.from(indices), persons: Array.from(persons) };
};

export function collectShouldHaveMarkerIndices(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): number[] {
  return collectShouldHaveMatches(tokens, sourceLang).indices;
}

export function resolveShouldHavePersons(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): PersonNumber[] | null {
  const persons = collectShouldHaveMatches(tokens, sourceLang).persons;
  return persons.length > 0 ? persons : null;
}

export function hasShouldHaveMarker(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): boolean {
  return collectShouldHaveMarkerIndices(tokens, sourceLang).length > 0;
}
