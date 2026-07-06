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

export type ComitativePronounMatch = {
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

const COMITATIVE_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> = {
  conmigo: "1_Sing",
  contigo: "2_Sing",
  "con él": "3_Sing",
  "con ella": "3_Sing",
  "con nosotros dos": "1+2_Dual",
  "con nosotras dos": "1+2_Dual",
  "con ustedes dos": "2_Dual",
  "con vosotros dos": "2_Dual",
  "con ellos dos": "3_Dual",
  "con ellas dos": "3_Dual",
  "con nosotros": "1+2_Plur",
  "con nosotras": "1+2_Plur",
  "con vosotros": "2_Plur",
  "con vosotras": "2_Plur",
  "con ustedes": "2_Plur",
  "con ellos": "3_Plur",
  "con ellas": "3_Plur",
  "en él": "3_Sing",
  "en ella": "3_Sing",
  "en ellos": "3_Plur",
  "en ellas": "3_Plur",
};

const COMITATIVE_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> = {
  "with me": "1_Sing",
  "with you": "2_Sing",
  "with him": "3_Sing",
  "with her": "3_Sing",
  "with us two": "1+2_Dual",
  "with you two": "2_Dual",
  "with them two": "3_Dual",
  "with both of them": "3_Dual",
  "with us": "1+2_Plur",
  "with them": "3_Plur",
};

const COMITATIVE_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["rrakala", "ŋarrakala"],
  "2_Sing": ["nhokala"],
  "3_Sing": ["nhanukala"],
  "1+2_Dual": ["litjalaŋgala", "ŋalitjalaŋgala", "ŋilitjalaŋgala"],
  "1+3_Dual": ["linyalaŋgala", "ŋalinyalaŋgala", "ŋilinyalaŋgala"],
  "2_Dual": ["nhumalaŋgala"],
  "3_Dual": ["maṉdaŋgala"],
  "1+2_Plur": ["limurruŋgala", "ŋalimurruŋgala", "ŋilimurruŋgala"],
  "1+3_Plur": ["napurruŋgala", "ŋanapurruŋgala"],
  "2_Plur": ["nhumalaŋgala"],
  "3_Plur": ["walalaŋgala"],
};

const COMITATIVE_PRONOUNS_GUP_EMPHATIC: Record<PersonNumber, string[]> = {
  "1_Sing": ["ŋarrakiyingala", "rrakiyingala"],
  "2_Sing": ["nhokiyingala"],
  "3_Sing": ["nhanukiyingala"],
  "1+2_Dual": ["litjalaŋgiyingala", "ŋalitjalaŋgiyingala", "ŋilitjalaŋgiyingala"],
  "1+3_Dual": ["linyalaŋgiyingala", "ŋalinyalaŋgiyingala", "ŋilinyalaŋgiyingala"],
  "2_Dual": ["nhumalaŋgiyingala"],
  "3_Dual": ["maṉdaŋgiyingala"],
  "1+2_Plur": ["limurruŋgiyingala", "ŋalimurruŋgiyingala", "ŋilimurruŋgiyingala"],
  "1+3_Plur": ["napurruŋgiyingala", "ŋanapurruŋgiyingala"],
  "2_Plur": ["nhumalaŋgiyingala"],
  "3_Plur": ["walalaŋgiyingala"],
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

export function matchComitativePronounAt(
  tokens: { source: string }[],
  index: number,
  sourceLang: LanguageId
): ComitativePronounMatch | null {
  const triggers =
    sourceLang === "es"
      ? COMITATIVE_PRONOUN_TRIGGERS_ES
      : COMITATIVE_PRONOUN_TRIGGERS_EN;
  let best: ComitativePronounMatch | null = null;
  for (const [phrase, person] of Object.entries(triggers)) {
    const formTokens = splitForm(phrase, sourceLang);
    const seq = matchSequence(tokens, index, formTokens, sourceLang);
    if (!seq.matched) continue;
    const match: ComitativePronounMatch = {
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
    const emphasis = matchEmphasisAfter(tokens, index + best.consumed, sourceLang);
    if (emphasis) {
      best = {
        ...best,
        emphasis,
        consumed: best.consumed + emphasis.consumed,
      };
    }
  }
  return best;
}

export function buildComitativePronounPart(
  match: ComitativePronounMatch
): TranslationPart | null {
  const hasEmphasis = Boolean(match.emphasis);
  const forms = hasEmphasis
    ? COMITATIVE_PRONOUNS_GUP_EMPHATIC[match.person]
    : COMITATIVE_PRONOUNS_GUP[match.person];
  const altForms = hasEmphasis
    ? COMITATIVE_PRONOUNS_GUP[match.person]
    : COMITATIVE_PRONOUNS_GUP_EMPHATIC[match.person];
  if (!forms || forms.length === 0) return null;
  const primary = forms[0];
  const explanations: ExplanationPayload[] = [
    {
      key: "PRONOUN_COMITATIVE",
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

  const baseAltNote = hasEmphasis
    ? "PRONOUN_NOTE_EMPHATIC"
    : noteKey;
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
    meaningKey: `pronoun.comitative.${match.person}`,
  };
}

export function getComitativePronounForms(
  person: PersonNumber
): string[] {
  return COMITATIVE_PRONOUNS_GUP[person] ?? [];
}

export function getComitativePronounEmphaticForms(
  person: PersonNumber
): string[] {
  return COMITATIVE_PRONOUNS_GUP_EMPHATIC[person] ?? [];
}

export function getComitativePronounNoteKey(
  person: PersonNumber
): ExplanationKey | undefined {
  return PERSON_NOTE_KEY[person];
}
