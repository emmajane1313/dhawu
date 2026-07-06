import {
  ExplanationKey,
  ExplanationPayload,
  LanguageId,
  PersonNumber,
  TranslationAlternative,
  TranslationPart,
} from "../core/types";
import {
  BELONGING_PRONOUNS_EMPHATIC_GUP,
  BELONGING_PRONOUNS_GUP,
} from "../constants";
import { matchSequence, splitForm } from "../logic/tokenUtils";
import { getLanguagePack } from "../lang";

export type BelongingPronounMatch = {
  source: string;
  person: PersonNumber;
  consumed: number;
  emphasis?: { source: string; consumed: number } | null;
};

const PERSON_NOTE_KEY: Partial<Record<PersonNumber, ExplanationKey>> = {
  "1+2_Dual": "PRONOUN_NOTE_INCLUSIVE_DUAL",
  "1+3_Dual": "PRONOUN_NOTE_EXCLUSIVE_DUAL",
  "1+2_Plur": "PRONOUN_NOTE_INCLUSIVE_PLUR",
  "1+3_Plur": "PRONOUN_NOTE_EXCLUSIVE_PLUR",
  "2_Dual": "PRONOUN_NOTE_DUAL",
  "3_Dual": "PRONOUN_NOTE_DUAL",
  "2_Plur": "PRONOUN_NOTE_PLUR",
  "3_Plur": "PRONOUN_NOTE_PLUR",
};

const BELONGING_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> = {
  "mí": "1_Sing",
  "mi": "1_Sing",
  "yo": "1_Sing",
  "ti": "2_Sing",
  "tú": "2_Sing",
  "tu": "2_Sing",
  "él": "3_Sing",
  "ella": "3_Sing",
  "nosotros dos": "1+2_Dual",
  "nosotras dos": "1+2_Dual",
  "ustedes dos": "2_Dual",
  "vosotros dos": "2_Dual",
  "ellos dos": "3_Dual",
  "ellas dos": "3_Dual",
  "nosotros": "1+2_Plur",
  "nosotras": "1+2_Plur",
  "ustedes": "2_Plur",
  "vosotros": "2_Plur",
  "vosotras": "2_Plur",
  "ellos": "3_Plur",
  "ellas": "3_Plur",
};

const BELONGING_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> = {
  "me": "1_Sing",
  "myself": "1_Sing",
  "you": "2_Sing",
  "yourself": "2_Sing",
  "him": "3_Sing",
  "her": "3_Sing",
  "himself": "3_Sing",
  "herself": "3_Sing",
  "us two": "1+2_Dual",
  "both of us": "1+2_Dual",
  "you two": "2_Dual",
  "both of you": "2_Dual",
  "them two": "3_Dual",
  "both of them": "3_Dual",
  "us": "1+2_Plur",
  "ourselves": "1+2_Plur",
  "yourselves": "2_Plur",
  "them": "3_Plur",
  "themselves": "3_Plur",
};

const matchEmphasisAfter = (
  tokens: { source: string }[],
  index: number,
  sourceLang: LanguageId
): { source: string; consumed: number } | null => {
  const pack = getLanguagePack(sourceLang);
  const markers = pack.emphasisMarkers ?? [];
  if (markers.length === 0) return null;
  const normalizedMarkers = new Set(markers.map((marker) => pack.normalize(marker)));
  const candidate = tokens[index];
  if (!candidate) return null;
  const normalized = pack.normalize(candidate.source);
  if (!normalizedMarkers.has(normalized)) return null;
  return { source: candidate.source, consumed: 1 };
};

const hasEmphasisInMatch = (
  tokens: { source: string }[],
  index: number,
  consumed: number,
  sourceLang: LanguageId
): boolean => {
  const pack = getLanguagePack(sourceLang);
  const markers = pack.emphasisMarkers ?? [];
  if (markers.length === 0) return false;
  const normalizedMarkers = new Set(markers.map((marker) => pack.normalize(marker)));
  for (let offset = 0; offset < consumed; offset += 1) {
    const token = tokens[index + offset];
    if (!token) continue;
    const normalized = pack.normalize(token.source);
    if (normalizedMarkers.has(normalized)) return true;
  }
  return false;
};

export function matchBelongingPronounAt(
  tokens: { source: string }[],
  index: number,
  sourceLang: LanguageId
): BelongingPronounMatch | null {
  const triggers =
    sourceLang === "es"
      ? BELONGING_PRONOUN_TRIGGERS_ES
      : BELONGING_PRONOUN_TRIGGERS_EN;
  let best: BelongingPronounMatch | null = null;
  for (const [phrase, person] of Object.entries(triggers)) {
    const formTokens = splitForm(phrase, sourceLang);
    const seq = matchSequence(tokens, index, formTokens, sourceLang);
    if (!seq.matched) continue;
    const match: BelongingPronounMatch = {
      source: tokens
        .slice(index, index + seq.consumed)
        .map((t) => t.source)
        .join(" "),
      person,
      consumed: seq.consumed,
    };
    if (!best || match.consumed > best.consumed) {
      best = match;
    }
  }
  if (best) {
    const emphasisAfter = matchEmphasisAfter(tokens, index + best.consumed, sourceLang);
    const emphasisInMatch = hasEmphasisInMatch(tokens, index, best.consumed, sourceLang);
    if (emphasisAfter) {
      best = {
        ...best,
        emphasis: emphasisAfter,
        consumed: best.consumed + emphasisAfter.consumed,
      };
    } else if (emphasisInMatch) {
      best = {
        ...best,
        emphasis: { source: best.source, consumed: 0 },
      };
    }
  }
  return best;
}

export function buildBelongingPronounPart(
  match: BelongingPronounMatch
): TranslationPart | null {
  const hasEmphasis = Boolean(match.emphasis);
  const forms = hasEmphasis
    ? BELONGING_PRONOUNS_EMPHATIC_GUP[match.person]
    : BELONGING_PRONOUNS_GUP[match.person];
  const altForms = hasEmphasis
    ? BELONGING_PRONOUNS_GUP[match.person]
    : BELONGING_PRONOUNS_EMPHATIC_GUP[match.person];
  if (!forms || forms.length === 0) return null;
  const primary = forms[0];
  const explanations: ExplanationPayload[] = [
    {
      key: "PRONOUN_BELONGING",
      data: { token: match.source, gup: primary },
    },
  ];
  if (hasEmphasis) {
    explanations.push({ key: "PRONOUN_NOTE_EMPHATIC" });
  }
  const noteKey = PERSON_NOTE_KEY[match.person];
  if (noteKey) {
    explanations.push({ key: noteKey });
  }
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();
  const pushAlt = (gup: string, note?: ExplanationKey) => {
    const key = `${gup}:${note ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    alternatives.push({ gup, notePayload: note ? { key: note } : undefined });
  };
  const baseAltNote = hasEmphasis ? "PRONOUN_NOTE_EMPHATIC" : noteKey;
  forms.slice(1).forEach((gup) => pushAlt(gup, baseAltNote));
  const altNote: ExplanationKey = hasEmphasis
    ? "PRONOUN_NOTE_NON_EMPHATIC"
    : "PRONOUN_NOTE_EMPHATIC";
  (altForms ?? []).forEach((gup) => pushAlt(gup, altNote));
  return {
    type: "pronoun",
    source: match.source,
    gup: primary,
    output: primary,
    explanation: "",
    explanations,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    meaningKey: `pronoun.belonging.${match.person}`,
  };
}
