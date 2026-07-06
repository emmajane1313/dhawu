import {
  ExplanationKey,
  ExplanationPayload,
  LanguageId,
  PersonNumber,
  TranslationAlternative,
  TranslationPart,
} from "../core/types";
import { getLanguagePack } from "../lang";

export type ObjectPronounKey =
  | "1_Sing"
  | "2_Sing"
  | "3_Sing"
  | "1_Dual_Incl"
  | "1_Dual_Excl"
  | "2_Dual"
  | "3_Dual"
  | "1+2_Plur_Incl"
  | "1+2_Plur_Excl"
  | "2_Plur"
  | "3_Plur";

interface ObjectPronounForm {
  gup: string;
  alternatives: string[];
  person: PersonNumber;
}

export interface ObjectPronounMatch {
  source: string;
  primaryKey: ObjectPronounKey | null;
  alternativeKeys?: ObjectPronounKey[];
  allowDrop: boolean;
}

const OBJECT_PRONOUNS_GUP: Record<ObjectPronounKey, ObjectPronounForm> = {
  "1_Sing": { gup: "ŋarranha", alternatives: ["rranha"], person: "1_Sing" },
  "2_Sing": { gup: "nhuna", alternatives: [], person: "2_Sing" },
  "3_Sing": { gup: "ŋanya", alternatives: [], person: "3_Sing" },
  "1_Dual_Incl": {
    gup: "ŋalitjalanha",
    alternatives: ["ŋilitjalanha", "litjalanha"],
    person: "1+2_Dual",
  },
  "1_Dual_Excl": {
    gup: "ŋalinyalanha",
    alternatives: ["linyalanha", "ŋilinyalanha"],
    person: "1+3_Dual",
  },
  "2_Dual": { gup: "nhumalanha", alternatives: [], person: "2_Dual" },
  "3_Dual": { gup: "maṉḏanha", alternatives: [], person: "3_Dual" },
  "1+2_Plur_Incl": {
    gup: "ŋalimurrunha",
    alternatives: ["ŋilimurrunha", "limurrunha"],
    person: "1+2_Plur",
  },
  "1+2_Plur_Excl": {
    gup: "ŋanapurrunha",
    alternatives: ["napurrunha"],
    person: "1+3_Plur",
  },
  "2_Plur": { gup: "nhumalanha", alternatives: [], person: "2_Plur" },
  "3_Plur": { gup: "walalanha", alternatives: [], person: "3_Plur" },
};

const EMPHATIC_OBJECT_PRONOUNS_GUP: Record<ObjectPronounKey, ObjectPronounForm> =
  {
    "1_Sing": { gup: "ŋarrapinya", alternatives: ["rrapinya"], person: "1_Sing" },
    "2_Sing": { gup: "nhunapinya", alternatives: [], person: "2_Sing" },
    "3_Sing": { gup: "ŋanyapinya", alternatives: [], person: "3_Sing" },
    "1_Dual_Incl": {
      gup: "ŋalitjalanhawuynha",
      alternatives: ["ŋilitjalanhawuynha", "litjalanhawuynha"],
      person: "1+2_Dual",
    },
    "1_Dual_Excl": {
      gup: "ŋalinyalanhawuynha",
      alternatives: ["linyalanhawuynha", "ŋilinyalanhawuynha"],
      person: "1+3_Dual",
    },
    "2_Dual": { gup: "nhumalanhawuynha", alternatives: [], person: "2_Dual" },
    "3_Dual": { gup: "maṉḏanhawuynha", alternatives: [], person: "3_Dual" },
    "1+2_Plur_Incl": {
      gup: "ŋalimurrunhawuynha",
      alternatives: ["ŋilimurrunhawuynha", "limurrunhawuynha"],
      person: "1+2_Plur",
    },
    "1+2_Plur_Excl": {
      gup: "ŋanapurrunhawuynha",
      alternatives: ["napurrunhawuynha"],
      person: "1+3_Plur",
    },
    "2_Plur": { gup: "nhumalanhawuynha", alternatives: [], person: "2_Plur" },
    "3_Plur": { gup: "walalanhawuynha", alternatives: [], person: "3_Plur" },
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

const OBJECT_PRONOUN_TRIGGERS_ES: Record<string, ObjectPronounMatch> = {
  me: { source: "me", primaryKey: "1_Sing", allowDrop: false },
  te: { source: "te", primaryKey: "2_Sing", allowDrop: false },
  nos: {
    source: "nos",
    primaryKey: "1+2_Plur_Incl",
    alternativeKeys: ["1+2_Plur_Excl"],
    allowDrop: false,
  },
  os: { source: "os", primaryKey: "2_Plur", allowDrop: false },
  lo: { source: "lo", primaryKey: "3_Sing", allowDrop: true },
  la: { source: "la", primaryKey: "3_Sing", allowDrop: true },
  los: { source: "los", primaryKey: "3_Plur", allowDrop: true },
  las: { source: "las", primaryKey: "3_Plur", allowDrop: true },
};

const OBJECT_PRONOUN_TRIGGERS_EN: Record<string, ObjectPronounMatch> = {
  me: { source: "me", primaryKey: "1_Sing", allowDrop: false },
  you: {
    source: "you",
    primaryKey: "2_Sing",
    alternativeKeys: ["2_Plur"],
    allowDrop: false,
  },
  him: { source: "him", primaryKey: "3_Sing", allowDrop: false },
  her: { source: "her", primaryKey: "3_Sing", allowDrop: false },
  us: {
    source: "us",
    primaryKey: "1+2_Plur_Incl",
    alternativeKeys: ["1+2_Plur_Excl"],
    allowDrop: false,
  },
  them: { source: "them", primaryKey: "3_Plur", allowDrop: false },
  it: { source: "it", primaryKey: null, allowDrop: true },
  myself: { source: "myself", primaryKey: "1_Sing", allowDrop: false },
  yourself: { source: "yourself", primaryKey: "2_Sing", allowDrop: false },
  himself: { source: "himself", primaryKey: "3_Sing", allowDrop: false },
  herself: { source: "herself", primaryKey: "3_Sing", allowDrop: false },
  itself: { source: "itself", primaryKey: "3_Sing", allowDrop: false },
  ourselves: {
    source: "ourselves",
    primaryKey: "1+2_Plur_Incl",
    alternativeKeys: ["1+2_Plur_Excl"],
    allowDrop: false,
  },
  yourselves: { source: "yourselves", primaryKey: "2_Plur", allowDrop: false },
  themselves: { source: "themselves", primaryKey: "3_Plur", allowDrop: false },
};

export function matchObjectPronoun(
  token: string,
  sourceLang: LanguageId
): ObjectPronounMatch | null {
  const pack = getLanguagePack(sourceLang);
  const normalized = pack.normalize(token);
  const match =
    sourceLang === "es"
      ? OBJECT_PRONOUN_TRIGGERS_ES[normalized]
      : OBJECT_PRONOUN_TRIGGERS_EN[normalized];
  if (!match) return null;
  return { ...match, source: token };
}

export function buildObjectPronounPart(
  match: ObjectPronounMatch
): TranslationPart | null {
  if (!match.primaryKey) return null;
  const entry = OBJECT_PRONOUNS_GUP[match.primaryKey];
  if (!entry) return null;

  const explanations: ExplanationPayload[] = [
    {
      key: "PRONOUN_OBJECT" as ExplanationKey,
      data: { token: match.source, gup: entry.gup },
    },
  ];
  const noteKey = PERSON_NOTE_KEY[entry.person];
  if (noteKey) {
    explanations.push({ key: noteKey });
  }

  const alternatives: TranslationAlternative[] = entry.alternatives.map(
    (form) => ({
      gup: form,
      notePayload: noteKey ? { key: noteKey } : undefined,
    })
  );

  if (match.alternativeKeys && match.alternativeKeys.length > 0) {
    for (const altKey of match.alternativeKeys) {
      const altEntry = OBJECT_PRONOUNS_GUP[altKey];
      if (!altEntry) continue;
      const altNoteKey = PERSON_NOTE_KEY[altEntry.person];
      alternatives.push({
        gup: altEntry.gup,
        notePayload: altNoteKey ? { key: altNoteKey } : undefined,
      });
      for (const altForm of altEntry.alternatives) {
        alternatives.push({
          gup: altForm,
          notePayload: altNoteKey ? { key: altNoteKey } : undefined,
        });
      }
    }
  }

  return {
    type: "pronoun",
    source: match.source,
    gup: entry.gup,
    output: entry.gup,
    explanation: "",
    explanations,
    alternatives,
    meaningKey: `pronoun.object.${match.primaryKey}`,
  };
}

const pushAlt = (
  target: TranslationAlternative[],
  gup: string,
  noteKey?: ExplanationKey
) => {
  const dedupeKey = `${gup}:${noteKey ?? ""}`;
  const seen = new Set(target.map((alt) => `${alt.gup}:${alt.notePayload?.key ?? ""}`));
  if (seen.has(dedupeKey)) return;
  target.push({
    gup,
    notePayload: noteKey ? { key: noteKey } : undefined,
  });
};

export function buildEmphaticObjectPronounPart(
  match: ObjectPronounMatch,
  options?: { sourceOverride?: string; includeNonEmphatic?: boolean }
): TranslationPart | null {
  if (!match.primaryKey) return null;
  const entry = EMPHATIC_OBJECT_PRONOUNS_GUP[match.primaryKey];
  if (!entry) return null;

  const source = options?.sourceOverride ?? match.source;
  const explanations: ExplanationPayload[] = [
    {
      key: "PRONOUN_OBJECT_EMPHATIC",
      data: { token: source, gup: entry.gup },
    },
    { key: "PRONOUN_NOTE_EMPHATIC" },
  ];
  const noteKey = PERSON_NOTE_KEY[entry.person];
  if (noteKey) {
    explanations.push({ key: noteKey });
  }

  const alternatives: TranslationAlternative[] = [];
  for (const form of entry.alternatives) {
    pushAlt(alternatives, form, "PRONOUN_NOTE_EMPHATIC");
  }

  if (match.alternativeKeys && match.alternativeKeys.length > 0) {
    for (const altKey of match.alternativeKeys) {
      const altEntry = EMPHATIC_OBJECT_PRONOUNS_GUP[altKey];
      if (!altEntry) continue;
      pushAlt(alternatives, altEntry.gup, "PRONOUN_NOTE_EMPHATIC");
      for (const altForm of altEntry.alternatives) {
        pushAlt(alternatives, altForm, "PRONOUN_NOTE_EMPHATIC");
      }
    }
  }

  if (options?.includeNonEmphatic) {
    const baseEntry = OBJECT_PRONOUNS_GUP[match.primaryKey];
    if (baseEntry) {
      pushAlt(alternatives, baseEntry.gup, "PRONOUN_NOTE_NON_EMPHATIC");
      for (const baseAlt of baseEntry.alternatives) {
        pushAlt(alternatives, baseAlt, "PRONOUN_NOTE_NON_EMPHATIC");
      }
    }
    if (match.alternativeKeys && match.alternativeKeys.length > 0) {
      for (const altKey of match.alternativeKeys) {
        const altBase = OBJECT_PRONOUNS_GUP[altKey];
        if (!altBase) continue;
        pushAlt(alternatives, altBase.gup, "PRONOUN_NOTE_NON_EMPHATIC");
        for (const altForm of altBase.alternatives) {
          pushAlt(alternatives, altForm, "PRONOUN_NOTE_NON_EMPHATIC");
        }
      }
    }
  }

  return {
    type: "pronoun",
    source,
    gup: entry.gup,
    output: entry.gup,
    explanation: "",
    explanations,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    meaningKey: `pronoun.object.${match.primaryKey}`,
  };
}
