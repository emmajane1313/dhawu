import {
  ExplanationKey,
  ExplanationPayload,
  LanguageId,
  PersonNumber,
  TranslationAlternative,
  TranslationPart,
} from "../core/types";
import { matchSequence, splitForm } from "../logic/tokenUtils";
import { getLanguagePack } from "../lang";

export type SourceOriginPronounMatch = {
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

const SOURCE_ORIGIN_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> = {
  "de mí": "1_Sing",
  "de mi": "1_Sing",
  "de ti": "2_Sing",
  "de él": "3_Sing",
  "de ella": "3_Sing",
  "de nosotros": "1+2_Plur",
  "de nosotras": "1+2_Plur",
  "de vosotros": "2_Plur",
  "de vosotras": "2_Plur",
  "de ustedes": "2_Plur",
  "de ellos": "3_Plur",
  "de ellas": "3_Plur",
  "por mí": "1_Sing",
  "por mi": "1_Sing",
  "por ti": "2_Sing",
  "por él": "3_Sing",
  "por ella": "3_Sing",
  "por nosotros": "1+2_Plur",
  "por nosotras": "1+2_Plur",
  "por vosotros": "2_Plur",
  "por vosotras": "2_Plur",
  "por ustedes": "2_Plur",
  "por ellos": "3_Plur",
  "por ellas": "3_Plur",
};

const SOURCE_ORIGIN_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> = {
  "of me": "1_Sing",
  "of myself": "1_Sing",
  "of you": "2_Sing",
  "of yourself": "2_Sing",
  "of him": "3_Sing",
  "of himself": "3_Sing",
  "of her": "3_Sing",
  "of herself": "3_Sing",
  "of itself": "3_Sing",
  "of us": "1+2_Plur",
  "of ourselves": "1+2_Plur",
  "of yourselves": "2_Plur",
  "of them": "3_Plur",
  "of themselves": "3_Plur",
  "by me": "1_Sing",
  "by myself": "1_Sing",
  "by you": "2_Sing",
  "by yourself": "2_Sing",
  "by him": "3_Sing",
  "by himself": "3_Sing",
  "by her": "3_Sing",
  "by herself": "3_Sing",
  "by itself": "3_Sing",
  "by us": "1+2_Plur",
  "by ourselves": "1+2_Plur",
  "by yourselves": "2_Plur",
  "by them": "3_Plur",
  "by themselves": "3_Plur",
  "from me": "1_Sing",
  "from myself": "1_Sing",
  "from you": "2_Sing",
  "from yourself": "2_Sing",
  "from him": "3_Sing",
  "from himself": "3_Sing",
  "from her": "3_Sing",
  "from herself": "3_Sing",
  "from itself": "3_Sing",
  "from us": "1+2_Plur",
  "from ourselves": "1+2_Plur",
  "from yourselves": "2_Plur",
  "from them": "3_Plur",
  "from themselves": "3_Plur",
};

export const SOURCE_ORIGIN_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["rrakuŋu", "ŋarrakuŋu"],
  "2_Sing": ["nhokuŋu"],
  "3_Sing": ["nhanukuŋu"],
  "1+2_Dual": ["litjalaŋguŋu", "ŋalitjalaŋguŋu", "ŋilitjalaŋguŋu"],
  "1+3_Dual": ["linyalaŋguŋu", "ŋalinyalaŋguŋu", "ŋilinyalaŋguŋu"],
  "2_Dual": ["nhumalaŋguŋu"],
  "3_Dual": ["maṉdaŋguŋu"],
  "1+2_Plur": ["limurruŋguŋu", "ŋalimurruŋguŋu", "ŋilimurruŋguŋu"],
  "1+3_Plur": ["napurruŋguŋu", "ŋanapurruŋguŋu"],
  "2_Plur": ["nhumalaŋguŋu"],
  "3_Plur": ["walalaŋguŋu"],
};

export const SOURCE_ORIGIN_PRONOUNS_GUP_EMPHATIC: Record<PersonNumber, string[]> = {
  "1_Sing": ["rrakiyinguŋu", "ŋarrakiyinguŋu"],
  "2_Sing": ["nhokiyinguŋu"],
  "3_Sing": ["nhanukiyinguŋu"],
  "1+2_Dual": ["litjalaŋgiyinguŋu", "ŋalitjalaŋgiyinguŋu", "ŋilitjalaŋgiyinguŋu"],
  "1+3_Dual": ["linyalaŋgiyinguŋu", "ŋalinyalaŋgiyinguŋu", "ŋilinyalaŋgiyinguŋu"],
  "2_Dual": ["nhumalaŋgiyinguŋu"],
  "3_Dual": ["maṉdaŋgiyinguŋu"],
  "1+2_Plur": ["limurruŋgiyinguŋu", "ŋalimurruŋgiyinguŋu", "ŋilimurruŋgiyinguŋu"],
  "1+3_Plur": ["napurruŋgiyinguŋu", "ŋanapurruŋgiyinguŋu"],
  "2_Plur": ["nhumalaŋgiyinguŋu"],
  "3_Plur": ["walalaŋgiyinguŋu"],
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

export function matchSourceOriginPronounAt(
  tokens: { source: string }[],
  index: number,
  sourceLang: LanguageId
): SourceOriginPronounMatch | null {
  const triggers =
    sourceLang === "es"
      ? SOURCE_ORIGIN_PRONOUN_TRIGGERS_ES
      : SOURCE_ORIGIN_PRONOUN_TRIGGERS_EN;
  let best: SourceOriginPronounMatch | null = null;
  for (const [phrase, person] of Object.entries(triggers)) {
    const formTokens = splitForm(phrase, sourceLang);
    const seq = matchSequence(tokens, index, formTokens, sourceLang);
    if (!seq.matched) continue;
    const match: SourceOriginPronounMatch = {
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

export function buildSourceOriginPronounPart(
  match: SourceOriginPronounMatch
): TranslationPart | null {
  const hasEmphasis = Boolean(match.emphasis);
  const forms = hasEmphasis
    ? SOURCE_ORIGIN_PRONOUNS_GUP_EMPHATIC[match.person]
    : SOURCE_ORIGIN_PRONOUNS_GUP[match.person];
  const altForms = hasEmphasis
    ? SOURCE_ORIGIN_PRONOUNS_GUP[match.person]
    : SOURCE_ORIGIN_PRONOUNS_GUP_EMPHATIC[match.person];
  if (!forms || forms.length === 0) return null;
  const primary = forms[0];
  const explanations: ExplanationPayload[] = [
    {
      key: "PRONOUN_ORIGIN",
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
    meaningKey: `pronoun.origin.${match.person}`,
  };
}
