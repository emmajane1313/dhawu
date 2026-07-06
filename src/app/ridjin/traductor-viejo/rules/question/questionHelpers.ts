import { LanguageMode } from "@/app/components/types/components.type";
import { VerbMatch } from "./types";
import { LANG_CONFIG, PersonNumber, validarFonologia } from "../../constants";
import { LEXICON } from "../../lexicon";

export function applyNha(gupWord: string): string {
  return validarFonologia(gupWord + "nha");
}

export const VERB_INDEX_TO_PERSON: PersonNumber[] = [
  "1_Sing",
  "2_Sing",
  "3_Sing",
  "1+2_Plur",
  "2_Plur",
  "3_Plur",
];

export interface VerbMatchWithPerson extends VerbMatch {
  personNumber?: PersonNumber;
  isMotion?: boolean;
}

export function findVerbGupWithPerson(word: string, mode: LanguageMode): VerbMatchWithPerson | null {
  const normalized = word.toLowerCase();

  for (const [gupKey, entry] of Object.entries(LEXICON.verbs)) {
    const verbFormsList = entry[mode];
    if (!verbFormsList) continue;

    const isMotion = entry.motionType === "motion";

    for (const verbForms of verbFormsList) {
      if (verbForms.infinitive.toLowerCase() === normalized) {
        return { gup: gupKey, isTransitive: entry.vtr, source: word, isMotion };
      }
      if (verbForms.gerund.toLowerCase() === normalized) {
        return { gup: gupKey, isTransitive: entry.vtr, source: word, isMotion };
      }
      for (let idx = 0; idx < verbForms.presentIndicative.length; idx++) {
        if (verbForms.presentIndicative[idx].toLowerCase() === normalized) {
          return {
            gup: gupKey,
            isTransitive: entry.vtr,
            source: word,
            personNumber: VERB_INDEX_TO_PERSON[idx],
            isMotion,
          };
        }
      }
      for (let idx = 0; idx < verbForms.preterite.length; idx++) {
        if (verbForms.preterite[idx].toLowerCase() === normalized) {
          return {
            gup: gupKey,
            isTransitive: entry.vtr,
            source: word,
            personNumber: VERB_INDEX_TO_PERSON[idx],
            isMotion,
          };
        }
      }
    }
  }
  return null;
}

export function findVerbGupSimple(word: string, mode: LanguageMode): string | null {
  const result = findVerbGupWithPerson(word, mode);
  return result ? result.gup : null;
}

export interface NounInfo {
  gupKey: string;
  isPlural: boolean;
  isHuman?: boolean;
  isPlace?: boolean;
}

export function findNounInfo(word: string, mode: LanguageMode): NounInfo | null {
  const normalized = word.toLowerCase();
  const { pluralKey } = LANG_CONFIG[mode];

  for (const [gupKey, entry] of Object.entries(LEXICON.nouns)) {
    if (entry[mode].map((n: string) => n.toLowerCase()).includes(normalized)) {
      return { gupKey, isPlural: false, isHuman: entry.isHuman, isPlace: entry.isPlace };
    }
    const plurals = entry[pluralKey as keyof typeof entry] as string[] | undefined;
    if (plurals && plurals.map((n: string) => n.toLowerCase()).includes(normalized)) {
      return { gupKey, isPlural: true, isHuman: entry.isHuman, isPlace: entry.isPlace };
    }
  }
  return null;
}

export function findNounGup(word: string, mode: LanguageMode): string | null {
  const info = findNounInfo(word, mode);
  return info ? info.gupKey : null;
}
