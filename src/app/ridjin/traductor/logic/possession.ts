import { LanguageMode } from "@/app/components/types/components.type";
import {
  ExplanationPayload,
  PersonNumber,
  TranslationAlternative,
  TranslationPart,
} from "../core/types";
import {
  POSSESSIVE_PRONOUNS_EMPHATIC_GUP,
  POSSESSIVE_PRONOUNS_GUP,
} from "../constants";
import { finalizePart } from "./parts";
import { applyPossessiveSuffix, getPossessiveSuffixes } from "./suffixes";
import { normalizeToken, stripSpanishDiacritics } from "./tokenUtils";
import { getLanguagePack } from "../lang";

export type PossessivePersonMatch = {
  person: PersonNumber;
  altPersons?: PersonNumber[];
  source: string;
  nonHuman?: boolean;
};

const POSSESSIVE_DETERMINERS_ES: Record<string, PossessivePersonMatch> = {
  mi: { person: "1_Sing", source: "mi" },
  mis: { person: "1_Sing", source: "mis" },
  tu: { person: "2_Sing", source: "tu" },
  tus: { person: "2_Sing", source: "tus" },
  su: { person: "3_Sing", altPersons: ["3_Plur"], source: "su" },
  sus: { person: "3_Sing", altPersons: ["3_Plur"], source: "sus" },
  nuestro: { person: "1+2_Plur", source: "nuestro" },
  nuestra: { person: "1+2_Plur", source: "nuestra" },
  nuestros: { person: "1+2_Plur", source: "nuestros" },
  nuestras: { person: "1+2_Plur", source: "nuestras" },
  vuestro: { person: "2_Plur", source: "vuestro" },
  vuestra: { person: "2_Plur", source: "vuestra" },
  vuestros: { person: "2_Plur", source: "vuestros" },
  vuestras: { person: "2_Plur", source: "vuestras" },
};

const POSSESSIVE_DETERMINERS_EN: Record<string, PossessivePersonMatch> = {
  my: { person: "1_Sing", source: "my" },
  your: { person: "2_Sing", altPersons: ["2_Plur"], source: "your" },
  his: { person: "3_Sing", source: "his" },
  her: { person: "3_Sing", source: "her" },
  its: { person: "3_Sing", source: "its", nonHuman: true },
  our: { person: "1+2_Plur", source: "our" },
  their: { person: "3_Plur", source: "their" },
};

const POSSESSIVE_PRONOUNS_ES: Record<string, PossessivePersonMatch> = {
  mio: { person: "1_Sing", source: "mio" },
  mia: { person: "1_Sing", source: "mia" },
  mios: { person: "1_Sing", source: "mios" },
  mias: { person: "1_Sing", source: "mias" },
  tuyo: { person: "2_Sing", source: "tuyo" },
  tuya: { person: "2_Sing", source: "tuya" },
  tuyos: { person: "2_Sing", source: "tuyos" },
  tuyas: { person: "2_Sing", source: "tuyas" },
  suyo: { person: "3_Sing", altPersons: ["3_Plur"], source: "suyo" },
  suya: { person: "3_Sing", altPersons: ["3_Plur"], source: "suya" },
  suyos: { person: "3_Plur", source: "suyos" },
  suyas: { person: "3_Plur", source: "suyas" },
  nuestro: { person: "1+2_Plur", source: "nuestro" },
  nuestra: { person: "1+2_Plur", source: "nuestra" },
  nuestros: { person: "1+2_Plur", source: "nuestros" },
  nuestras: { person: "1+2_Plur", source: "nuestras" },
  vuestro: { person: "2_Plur", source: "vuestro" },
  vuestra: { person: "2_Plur", source: "vuestra" },
  vuestros: { person: "2_Plur", source: "vuestros" },
  vuestras: { person: "2_Plur", source: "vuestras" },
};

const POSSESSIVE_PRONOUNS_EN: Record<string, PossessivePersonMatch> = {
  mine: { person: "1_Sing", source: "mine" },
  yours: { person: "2_Sing", altPersons: ["2_Plur"], source: "yours" },
  his: { person: "3_Sing", source: "his" },
  hers: { person: "3_Sing", source: "hers" },
  ours: { person: "1+2_Plur", source: "ours" },
  theirs: { person: "3_Plur", source: "theirs" },
};

const POSSESSIVE_OF_PRONOUNS_ES: Record<string, PossessivePersonMatch> = {
  mi: { person: "1_Sing", source: "mi" },
  ti: { person: "2_Sing", source: "ti" },
  el: { person: "3_Sing", source: "el" },
  ella: { person: "3_Sing", source: "ella" },
  usted: { person: "3_Sing", source: "usted" },
  nosotros: { person: "1+2_Plur", source: "nosotros" },
  nosotras: { person: "1+2_Plur", source: "nosotras" },
  vosotros: { person: "2_Plur", source: "vosotros" },
  vosotras: { person: "2_Plur", source: "vosotras" },
  ellos: { person: "3_Plur", source: "ellos" },
  ellas: { person: "3_Plur", source: "ellas" },
  ustedes: { person: "2_Plur", source: "ustedes" },
  mio: { person: "1_Sing", source: "mio" },
  mia: { person: "1_Sing", source: "mia" },
  mios: { person: "1_Sing", source: "mios" },
  mias: { person: "1_Sing", source: "mias" },
  tuyo: { person: "2_Sing", source: "tuyo" },
  tuya: { person: "2_Sing", source: "tuya" },
  tuyos: { person: "2_Sing", source: "tuyos" },
  tuyas: { person: "2_Sing", source: "tuyas" },
  suyo: { person: "3_Sing", altPersons: ["3_Plur"], source: "suyo" },
  suya: { person: "3_Sing", altPersons: ["3_Plur"], source: "suya" },
  suyos: { person: "3_Plur", source: "suyos" },
  suyas: { person: "3_Plur", source: "suyas" },
};

const POSSESSIVE_OF_PRONOUNS_EN: Record<string, PossessivePersonMatch> = {
  mine: { person: "1_Sing", source: "mine" },
  yours: { person: "2_Sing", altPersons: ["2_Plur"], source: "yours" },
  his: { person: "3_Sing", source: "his" },
  hers: { person: "3_Sing", source: "hers" },
  ours: { person: "1+2_Plur", source: "ours" },
  theirs: { person: "3_Plur", source: "theirs" },
  me: { person: "1_Sing", source: "me" },
  you: { person: "2_Sing", altPersons: ["2_Plur"], source: "you" },
  him: { person: "3_Sing", source: "him" },
  her: { person: "3_Sing", source: "her" },
  us: { person: "1+2_Plur", source: "us" },
  them: { person: "3_Plur", source: "them" },
};

const PERSON_NOTE_KEY: Partial<Record<PersonNumber, ExplanationPayload["key"]>> = {
  "1+2_Dual": "PRONOUN_NOTE_INCLUSIVE_DUAL",
  "1+3_Dual": "PRONOUN_NOTE_EXCLUSIVE_DUAL",
  "1+2_Plur": "PRONOUN_NOTE_INCLUSIVE_PLUR",
  "1+3_Plur": "PRONOUN_NOTE_EXCLUSIVE_PLUR",
  "2_Dual": "PRONOUN_NOTE_DUAL",
  "3_Dual": "PRONOUN_NOTE_DUAL",
  "2_Plur": "PRONOUN_NOTE_PLUR",
  "3_Plur": "PRONOUN_NOTE_PLUR",
};

const normalizePossessiveToken = (token: string, lang: LanguageMode): string => {
  const normalized = normalizeToken(token, lang);
  return lang === "es" ? stripSpanishDiacritics(normalized) : normalized;
};

export function matchPossessiveEmphasisAt(
  tokens: Array<{ source: string }>,
  index: number,
  sourceLang: LanguageMode
): { source: string; consumed: number } | null {
  const pack = getLanguagePack(sourceLang);
  const markers = pack.emphasisMarkers ?? [];
  if (markers.length === 0) return null;
  const normalizedMarkers = new Set(
    markers.map((marker) => pack.normalize(marker))
  );
  const dualMarkers = new Set(
    (pack.dualMarkers ?? []).map((marker) => pack.normalize(marker))
  );
  const base = tokens[index];
  if (!base) return null;
  const next = tokens[index + 1];
  if (!next) return null;
  const nextNormalized = pack.normalize(next.source);
  if (normalizedMarkers.has(nextNormalized)) {
    return { source: `${base.source} ${next.source}`, consumed: 1 };
  }
  const afterDual = tokens[index + 2];
  if (dualMarkers.has(nextNormalized) && afterDual) {
    const afterNormalized = pack.normalize(afterDual.source);
    if (normalizedMarkers.has(afterNormalized)) {
      return {
        source: `${base.source} ${next.source} ${afterDual.source}`,
        consumed: 2,
      };
    }
  }
  return null;
}

export function matchPossessiveDeterminer(
  token: string,
  sourceLang: LanguageMode
): PossessivePersonMatch | null {
  const normalized = normalizePossessiveToken(token, sourceLang);
  const match =
    sourceLang === "es"
      ? POSSESSIVE_DETERMINERS_ES[normalized]
      : POSSESSIVE_DETERMINERS_EN[normalized];
  if (!match) return null;
  return { ...match, source: token };
}

export function matchPossessivePronoun(
  token: string,
  sourceLang: LanguageMode
): PossessivePersonMatch | null {
  const normalized = normalizePossessiveToken(token, sourceLang);
  const match =
    sourceLang === "es"
      ? POSSESSIVE_PRONOUNS_ES[normalized]
      : POSSESSIVE_PRONOUNS_EN[normalized];
  if (!match) return null;
  return { ...match, source: token };
}

export function matchPossessiveOfPronoun(
  token: string,
  sourceLang: LanguageMode
): PossessivePersonMatch | null {
  const normalized = normalizePossessiveToken(token, sourceLang);
  const match =
    sourceLang === "es"
      ? POSSESSIVE_OF_PRONOUNS_ES[normalized]
      : POSSESSIVE_OF_PRONOUNS_EN[normalized];
  if (!match) return null;
  return { ...match, source: token };
}

export function stripEnglishPossessiveSuffix(token: string): string | null {
  const trimmed = token.trim();
  const lower = trimmed.toLowerCase();
  if (lower.endsWith("'s") || lower.endsWith("’s")) {
    return trimmed.slice(0, -2).trim();
  }
  if (lower.endsWith("s'") || lower.endsWith("s’")) {
    return trimmed.slice(0, -2).trim();
  }
  return null;
}

function collectPersons(match: PossessivePersonMatch): PersonNumber[] {
  const persons = new Set<PersonNumber>();
  persons.add(match.person);
  match.altPersons?.forEach((person) => persons.add(person));
  if (match.person === "1+2_Plur") {
    persons.add("1+3_Plur");
  }
  if (match.person === "1+2_Dual") {
    persons.add("1+3_Dual");
  }
  return Array.from(persons);
}

export function buildPossessivePronounPart(
  match: PossessivePersonMatch,
  sourceLang: LanguageMode,
  options?: {
    emphatic?: boolean;
    sourceOverride?: string;
    includeNonEmphatic?: boolean;
  }
): TranslationPart | null {
  const persons = collectPersons(match);
  const useEmphatic = options?.emphatic === true;
  const source = options?.sourceOverride ?? match.source;
  const formMap = useEmphatic
    ? POSSESSIVE_PRONOUNS_EMPHATIC_GUP
    : POSSESSIVE_PRONOUNS_GUP;
  const baseForms = formMap[match.person] ?? [];
  if (baseForms.length === 0) return null;
  const primary = baseForms[0];
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();

  for (const person of persons) {
    const noteKey = PERSON_NOTE_KEY[person];
    const forms = formMap[person] ?? [];
    for (const form of forms) {
      if (person === match.person && form === primary) continue;
      const key = `${form}:${noteKey ?? ""}:${useEmphatic ? "emph" : "base"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      alternatives.push({
        gup: form,
        notePayload: noteKey ? { key: noteKey } : undefined,
      });
    }
  }

  const explanations: ExplanationPayload[] = [
    {
      key: useEmphatic ? "POSSESSION_PRONOUN_EMPHATIC" : "POSSESSION_PRONOUN",
      data: {
        token: source,
        gup: primary,
        person: match.person,
        nonHuman: match.nonHuman === true,
      },
    },
  ];
  if (useEmphatic) explanations.push({ key: "PRONOUN_NOTE_EMPHATIC" });
  const noteKey = PERSON_NOTE_KEY[match.person];
  if (noteKey) explanations.push({ key: noteKey });

  if (useEmphatic && options?.includeNonEmphatic) {
    for (const person of persons) {
      const forms = POSSESSIVE_PRONOUNS_GUP[person] ?? [];
      for (const form of forms) {
        const key = `${form}:non-emph`;
        if (seen.has(key)) continue;
        seen.add(key);
        alternatives.push({
          gup: form,
          notePayload: { key: "PRONOUN_NOTE_NON_EMPHATIC" },
        });
      }
    }
  }

  return finalizePart(
    {
      type: "pronoun",
      source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations,
      alternatives,
    },
    sourceLang
  );
}

export function buildPossessiveSuffixPart(
  base: string,
  source: string,
  sourceLang: LanguageMode
): TranslationPart {
  const suffixes = getPossessiveSuffixes(base);
  const primary = applyPossessiveSuffix(base, suffixes[0]);
  const alternatives: TranslationAlternative[] = suffixes.slice(1).map((suffix) => ({
    gup: applyPossessiveSuffix(base, suffix),
    notePayload: { key: "POSSESSION_SUFFIX", data: { token: source, suffix } },
  }));
  return finalizePart(
    {
      type: "noun",
      source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations: [
        {
          key: "POSSESSION_SUFFIX",
          data: { token: source, gup: primary, suffix: suffixes[0] },
        },
      ],
      alternatives,
    },
    sourceLang
  );
}
