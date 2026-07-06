import { LanguageMode } from "@/app/components/types/components.type";
import { PersonNumber } from "../core/types";
import { normalizeToken, stripSpanishDiacritics } from "./tokenUtils";

type TokenLike = { source: string };

type ShouldMarker = {
  pattern: string[];
  persons?: PersonNumber[];
};

const normalizeShould = (value: string, lang: LanguageMode): string => {
  const normalized = normalizeToken(value, lang);
  return lang === "es" ? stripSpanishDiacritics(normalized) : normalized;
};

const SHOULD_MARKERS_ES: ShouldMarker[] = [
  // deber (present)
  { pattern: ["debo"], persons: ["1_Sing"] },
  { pattern: ["debes"], persons: ["2_Sing"] },
  { pattern: ["debe"], persons: ["3_Sing"] },
  { pattern: ["debemos"], persons: ["1+2_Plur"] },
  { pattern: ["debeis"], persons: ["2_Plur"] },
  { pattern: ["deben"], persons: ["3_Plur"] },
  // deber (future)
  { pattern: ["debere"], persons: ["1_Sing"] },
  { pattern: ["deberas"], persons: ["2_Sing"] },
  { pattern: ["debera"], persons: ["3_Sing"] },
  { pattern: ["deberemos"], persons: ["1+2_Plur"] },
  { pattern: ["debereis"], persons: ["2_Plur"] },
  { pattern: ["deberan"], persons: ["3_Plur"] },
  // deber (conditional) -> should
  { pattern: ["deberia"], persons: ["1_Sing"] },
  { pattern: ["deberias"], persons: ["2_Sing"] },
  { pattern: ["deberia"], persons: ["3_Sing"] },
  { pattern: ["deberiamos"], persons: ["1+2_Plur"] },
  { pattern: ["deberiais"], persons: ["2_Plur"] },
  { pattern: ["deberian"], persons: ["3_Plur"] },
  // tener que (present)
  { pattern: ["tengo", "que"], persons: ["1_Sing"] },
  { pattern: ["tienes", "que"], persons: ["2_Sing"] },
  { pattern: ["tiene", "que"], persons: ["3_Sing"] },
  { pattern: ["tenemos", "que"], persons: ["1+2_Plur"] },
  { pattern: ["teneis", "que"], persons: ["2_Plur"] },
  { pattern: ["tienen", "que"], persons: ["3_Plur"] },
  // tener que (future)
  { pattern: ["tendre", "que"], persons: ["1_Sing"] },
  { pattern: ["tendras", "que"], persons: ["2_Sing"] },
  { pattern: ["tendra", "que"], persons: ["3_Sing"] },
  { pattern: ["tendremos", "que"], persons: ["1+2_Plur"] },
  { pattern: ["tendreis", "que"], persons: ["2_Plur"] },
  { pattern: ["tendran", "que"], persons: ["3_Plur"] },
  // necesitar (present)
  { pattern: ["necesito"], persons: ["1_Sing"] },
  { pattern: ["necesitas"], persons: ["2_Sing"] },
  { pattern: ["necesita"], persons: ["3_Sing"] },
  { pattern: ["necesitamos"], persons: ["1+2_Plur"] },
  { pattern: ["necesitais"], persons: ["2_Plur"] },
  { pattern: ["necesitan"], persons: ["3_Plur"] },
  // necesitar (future)
  { pattern: ["necesitare"], persons: ["1_Sing"] },
  { pattern: ["necesitaras"], persons: ["2_Sing"] },
  { pattern: ["necesitara"], persons: ["3_Sing"] },
  { pattern: ["necesitaremos"], persons: ["1+2_Plur"] },
  { pattern: ["necesitareis"], persons: ["2_Plur"] },
  { pattern: ["necesitaran"], persons: ["3_Plur"] },
  // impersonal
  { pattern: ["hay", "que"], persons: ["3_Sing"] },
  { pattern: ["es", "necesario"], persons: ["3_Sing"] },
];

const SHOULD_MARKERS_EN: ShouldMarker[] = [
  { pattern: ["should"] },
  { pattern: ["must"] },
  { pattern: ["ought", "to"] },
  { pattern: ["have", "to"] },
  { pattern: ["has", "to"] },
  { pattern: ["need", "to"] },
  { pattern: ["needs", "to"] },
  { pattern: ["will", "have", "to"] },
  { pattern: ["will", "need", "to"] },
];

const MARKERS_BY_LANG: Record<LanguageMode, ShouldMarker[]> = {
  es: SHOULD_MARKERS_ES,
  en: SHOULD_MARKERS_EN,
};

const collectShouldMatches = (
  tokens: TokenLike[],
  sourceLang: LanguageMode
): { indices: number[]; persons: PersonNumber[] } => {
  const patterns = MARKERS_BY_LANG[sourceLang] ?? [];
  if (patterns.length === 0) return { indices: [], persons: [] };
  const normalized = tokens
    .map((token, idx) => ({
      norm: normalizeShould(token.source, sourceLang),
      idx,
    }))
    .filter((entry) => entry.norm);
  const indices = new Set<number>();
  const persons = new Set<PersonNumber>();
  for (const marker of patterns) {
    const pattern = marker.pattern.map((item) => normalizeShould(item, sourceLang));
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

export function collectShouldMarkerIndices(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): number[] {
  return collectShouldMatches(tokens, sourceLang).indices;
}

export function resolveShouldPersons(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): PersonNumber[] | null {
  const persons = collectShouldMatches(tokens, sourceLang).persons;
  return persons.length > 0 ? persons : null;
}

export function hasShouldMarker(
  tokens: TokenLike[],
  sourceLang: LanguageMode
): boolean {
  return collectShouldMarkerIndices(tokens, sourceLang).length > 0;
}
