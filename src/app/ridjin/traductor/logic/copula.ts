import { LanguageMode } from "@/app/components/types/components.type";
import { PersonNumber } from "../core/types";
import { AuxTense, getAuxGerundInfo } from "./verbAux";
import { normalizeToken, stripSpanishDiacritics } from "./tokenUtils";

export type CopulaMatch = {
  persons: PersonNumber[];
  consumed: number;
  source: string;
  negated?: boolean;
  negatorSource?: string;
  tense: AuxTense;
};

const SER_FORMS_ES: Record<string, PersonNumber[]> = {
  soy: ["1_Sing"],
  eres: ["2_Sing"],
  es: ["3_Sing"],
  somos: ["1+2_Plur"],
  sois: ["2_Plur"],
  son: ["3_Plur"],
  fui: ["1_Sing"],
  fuiste: ["2_Sing"],
  fue: ["3_Sing"],
  fuimos: ["1+2_Plur"],
  fuisteis: ["2_Plur"],
  fueron: ["3_Plur"],
  era: ["1_Sing", "3_Sing"],
  eras: ["2_Sing"],
  eramos: ["1+2_Plur"],
  éramos: ["1+2_Plur"],
  erais: ["2_Plur"],
  eran: ["3_Plur"],
  sere: ["1_Sing"],
  seré: ["1_Sing"],
  seras: ["2_Sing"],
  serás: ["2_Sing"],
  sera: ["3_Sing"],
  será: ["3_Sing"],
  seremos: ["1+2_Plur"],
  sereis: ["2_Plur"],
  seréis: ["2_Plur"],
  seran: ["3_Plur"],
  serán: ["3_Plur"],
  seria: ["1_Sing", "3_Sing"],
  sería: ["1_Sing", "3_Sing"],
  serias: ["2_Sing"],
  serías: ["2_Sing"],
  seriamos: ["1+2_Plur"],
  seríamos: ["1+2_Plur"],
  seriais: ["2_Plur"],
  seríais: ["2_Plur"],
  serian: ["3_Plur"],
  serían: ["3_Plur"],
  sea: ["3_Sing"],
  seas: ["2_Sing"],
  seamos: ["1+2_Plur"],
  seais: ["2_Plur"],
  sean: ["3_Plur"],
};
const ESTAR_FORMS_ES: Record<string, PersonNumber[]> = {
  estoy: ["1_Sing"],
  estas: ["2_Sing"],
  estás: ["2_Sing"],
  esta: ["3_Sing"],
  está: ["3_Sing"],
  estamos: ["1+2_Plur"],
  estais: ["2_Plur"],
  estáis: ["2_Plur"],
  estan: ["3_Plur"],
  están: ["3_Plur"],
};

const COPULA_NEG_EN: Record<string, PersonNumber[]> = {
  "isn't": ["3_Sing"],
  isnt: ["3_Sing"],
  "aren't": ["2_Sing", "1+2_Plur", "2_Plur", "3_Plur"],
  arent: ["2_Sing", "1+2_Plur", "2_Plur", "3_Plur"],
  "wasn't": ["1_Sing", "3_Sing"],
  wasnt: ["1_Sing", "3_Sing"],
  "weren't": ["2_Sing", "1+2_Plur", "2_Plur", "3_Plur"],
  werent: ["2_Sing", "1+2_Plur", "2_Plur", "3_Plur"],
  "ain't": ["1_Sing", "2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"],
  aint: ["1_Sing", "2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"],
};

const COPULA_NEUTRAL_EN = new Set(["be", "been", "being"]);

const SER_PRESENT_ES = new Set(["soy", "eres", "es", "somos", "sois", "son"]);
const SER_PAST_ES = new Set([
  "fui",
  "fuiste",
  "fue",
  "fuimos",
  "fuisteis",
  "fueron",
  "era",
  "eras",
  "eramos",
  "erais",
  "eran",
  "eramos",
]);
const SER_FUTURE_ES = new Set([
  "sere",
  "seras",
  "sera",
  "seremos",
  "sereis",
  "seran",
]);

const COPULA_TENSE_EN: Record<string, AuxTense> = {
  am: "present",
  "i'm": "present",
  im: "present",
  is: "present",
  "he's": "present",
  "she's": "present",
  "it's": "present",
  are: "present",
  "you're": "present",
  youre: "present",
  "we're": "present",
  "they're": "present",
  was: "past",
  were: "past",
  "wasn't": "past",
  wasnt: "past",
  "weren't": "past",
  werent: "past",
  "isn't": "present",
  isnt: "present",
  "aren't": "present",
  arent: "present",
  "ain't": "unknown",
  aint: "unknown",
};

export function matchCopulaAt(
  tokens: { source: string }[],
  index: number,
  sourceLang: LanguageMode
): CopulaMatch | null {
  const token = tokens[index];
  if (!token) return null;

  if (sourceLang === "en") {
    const normalized = normalizeToken(token.source, sourceLang);
    const next = tokens[index + 1];
    if (normalized === "will" && next) {
      const nextNormalized = normalizeToken(next.source, sourceLang);
      if (nextNormalized === "be") {
        return {
          persons: [],
          consumed: 2,
          source: `${token.source} ${next.source}`,
          tense: "future",
        };
      }
      const afterNext = tokens[index + 2];
      if (nextNormalized === "not" && afterNext) {
        const afterNormalized = normalizeToken(afterNext.source, sourceLang);
        if (afterNormalized === "be") {
          return {
            persons: [],
            consumed: 3,
            source: `${token.source} ${next.source} ${afterNext.source}`,
            negated: true,
            negatorSource: next.source,
            tense: "future",
          };
        }
      }
    }
    if ((normalized === "won't" || normalized === "wont") && next) {
      const nextNormalized = normalizeToken(next.source, sourceLang);
      if (nextNormalized === "be") {
        return {
          persons: [],
          consumed: 2,
          source: `${token.source} ${next.source}`,
          negated: true,
          negatorSource: token.source,
          tense: "future",
        };
      }
    }
    const negatedPersons = COPULA_NEG_EN[normalized];
    if (negatedPersons) {
      return {
        persons: negatedPersons,
        consumed: 1,
        source: token.source,
        negated: true,
        negatorSource: token.source,
        tense: COPULA_TENSE_EN[normalized] ?? "unknown",
      };
    }
    const auxInfo = getAuxGerundInfo(token.source, sourceLang);
    if (auxInfo) {
      return {
        persons: auxInfo.persons,
        consumed: 1,
        source: token.source,
        tense: auxInfo.tense,
      };
    }
    if (COPULA_NEUTRAL_EN.has(normalized)) {
      return {
        persons: [],
        consumed: 1,
        source: token.source,
        tense: "unknown",
      };
    }
    return null;
  }

  const normalized = stripSpanishDiacritics(
    normalizeToken(token.source, sourceLang)
  );
  const serPersons = SER_FORMS_ES[normalized];
  if (serPersons) {
    let tense: AuxTense = "unknown";
    if (SER_PRESENT_ES.has(normalized)) {
      tense = "present";
    } else if (SER_PAST_ES.has(normalized)) {
      tense = "past";
    } else if (SER_FUTURE_ES.has(normalized)) {
      tense = "future";
    }
    return {
      persons: serPersons,
      consumed: 1,
      source: token.source,
      tense,
    };
  }
  const estarPersons = ESTAR_FORMS_ES[normalized];
  if (estarPersons) {
    return {
      persons: estarPersons,
      consumed: 1,
      source: token.source,
      tense: "present",
    };
  }
  const auxInfo = getAuxGerundInfo(token.source, sourceLang);
  if (auxInfo) {
    return {
      persons: auxInfo.persons,
      consumed: 1,
      source: token.source,
      tense: auxInfo.tense,
    };
  }
  return null;
}
