import {
  ExplanationKey,
  ExplanationPayload,
  LanguageId,
  PersonNumber,
  TranslationAlternative,
  TranslationPart,
} from "../core/types";
import { matchSequence, splitForm } from "../logic/tokenUtils";

export type HumanAblativePronounMatch = {
  source: string;
  person: PersonNumber;
  consumed: number;
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

const HUMAN_ABLATIVE_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> = {
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
  "desde mí": "1_Sing",
  "desde mi": "1_Sing",
  "desde ti": "2_Sing",
  "desde él": "3_Sing",
  "desde ella": "3_Sing",
  "desde nosotros": "1+2_Plur",
  "desde nosotras": "1+2_Plur",
  "desde vosotros": "2_Plur",
  "desde vosotras": "2_Plur",
  "desde ustedes": "2_Plur",
  "desde ellos": "3_Plur",
  "desde ellas": "3_Plur",
};

const HUMAN_ABLATIVE_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> = {
  "from me": "1_Sing",
  "from you": "2_Sing",
  "from him": "3_Sing",
  "from her": "3_Sing",
  "from us": "1+2_Plur",
  "from them": "3_Plur",
  "away from me": "1_Sing",
  "away from you": "2_Sing",
  "away from him": "3_Sing",
  "away from her": "3_Sing",
  "away from us": "1+2_Plur",
  "away from them": "3_Plur",
  "out of me": "1_Sing",
  "out of you": "2_Sing",
  "out of him": "3_Sing",
  "out of her": "3_Sing",
  "out of us": "1+2_Plur",
  "out of them": "3_Plur",
};

const HUMAN_ABLATIVE_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["rrakalaŋuŋuru", "ŋarrakalaŋuŋuru"],
  "2_Sing": ["nhokalaŋuŋuru"],
  "3_Sing": ["nhanukalaŋuŋuru"],
  "1+2_Dual": [
    "litjalaŋgalaŋuŋuru",
    "ŋalitjalaŋgalaŋuŋuru",
    "ŋilitjalaŋgalaŋuŋuru",
  ],
  "1+3_Dual": [
    "linyalaŋgalaŋuŋuru",
    "ŋalinyalaŋgalaŋuŋuru",
    "ŋilinyalaŋgalaŋuŋuru",
  ],
  "2_Dual": ["nhumalaŋgalaŋuŋuru"],
  "3_Dual": ["maṉdaŋgalaŋuŋuru"],
  "1+2_Plur": [
    "limurruŋgalaŋuŋuru",
    "ŋalimurruŋgalaŋuŋuru",
    "ŋilimurruŋgalaŋuŋuru",
  ],
  "1+3_Plur": ["napurruŋgalaŋuŋuru", "ŋanapurruŋgalaŋuŋuru"],
  "2_Plur": ["nhumalaŋgalaŋuŋuru"],
  "3_Plur": ["walalaŋgalaŋuŋuru"],
};

export function matchHumanAblativePronounAt(
  tokens: { source: string }[],
  index: number,
  sourceLang: LanguageId
): HumanAblativePronounMatch | null {
  const triggers =
    sourceLang === "es"
      ? HUMAN_ABLATIVE_PRONOUN_TRIGGERS_ES
      : HUMAN_ABLATIVE_PRONOUN_TRIGGERS_EN;
  let best: HumanAblativePronounMatch | null = null;
  for (const [phrase, person] of Object.entries(triggers)) {
    const formTokens = splitForm(phrase, sourceLang);
    const seq = matchSequence(tokens, index, formTokens, sourceLang);
    if (!seq.matched) continue;
    const match: HumanAblativePronounMatch = {
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
  return best;
}

export function buildHumanAblativePronounPart(
  match: HumanAblativePronounMatch
): TranslationPart | null {
  const forms = HUMAN_ABLATIVE_PRONOUNS_GUP[match.person];
  if (!forms || forms.length === 0) return null;
  const primary = forms[0];
  const explanations: ExplanationPayload[] = [
    {
      key: "PRONOUN_ABLATIVE",
      data: { token: match.source, gup: primary },
    },
  ];
  const noteKey = PERSON_NOTE_KEY[match.person];
  if (noteKey) {
    explanations.push({ key: noteKey });
  }
  const alternatives: TranslationAlternative[] = forms
    .slice(1)
    .map((gup) => ({
      gup,
      notePayload: noteKey ? { key: noteKey } : undefined,
    }));
  return {
    type: "pronoun",
    source: match.source,
    gup: primary,
    output: primary,
    explanation: "",
    explanations,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    meaningKey: `pronoun.ablative.${match.person}`,
  };
}
