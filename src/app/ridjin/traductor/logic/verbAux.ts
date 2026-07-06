import { LanguageMode } from "@/app/components/types/components.type";
import { IRToken, PersonNumber } from "../core/types";
import { matchObjectPronoun, ObjectPronounMatch } from "../rules/objectPronoun";
import { matchVerbAt, VerbMatch } from "../rules/verb";
import { normalizeToken, stripSpanishDiacritics } from "./tokenUtils";

const OBJECT_CLITICS_ES = ["los", "las", "lo", "la", "me", "te", "nos", "os"];

export type AuxTense = "present" | "past" | "future" | "unknown";
export type AuxInfo = {
  persons: PersonNumber[];
  tense: AuxTense;
};

const AUX_GERUND_ES: Record<string, AuxInfo> = {
  estoy: { persons: ["1_Sing"], tense: "present" },
  estás: { persons: ["2_Sing"], tense: "present" },
  estas: { persons: ["2_Sing"], tense: "present" },
  está: { persons: ["3_Sing"], tense: "present" },
  esta: { persons: ["3_Sing"], tense: "present" },
  estamos: { persons: ["1+2_Plur"], tense: "present" },
  estáis: { persons: ["2_Plur"], tense: "present" },
  estais: { persons: ["2_Plur"], tense: "present" },
  están: { persons: ["3_Plur"], tense: "present" },
  estan: { persons: ["3_Plur"], tense: "present" },
  estaba: { persons: ["1_Sing", "3_Sing"], tense: "past" },
  estabas: { persons: ["2_Sing"], tense: "past" },
  estábamos: { persons: ["1+2_Plur"], tense: "past" },
  estabamos: { persons: ["1+2_Plur"], tense: "past" },
  estabais: { persons: ["2_Plur"], tense: "past" },
  estaban: { persons: ["3_Plur"], tense: "past" },
  estuve: { persons: ["1_Sing"], tense: "past" },
  estuviste: { persons: ["2_Sing"], tense: "past" },
  estuvo: { persons: ["3_Sing"], tense: "past" },
  estuvimos: { persons: ["1+2_Plur"], tense: "past" },
  estuvisteis: { persons: ["2_Plur"], tense: "past" },
  estuvieron: { persons: ["3_Plur"], tense: "past" },
  estaré: { persons: ["1_Sing"], tense: "future" },
  estare: { persons: ["1_Sing"], tense: "future" },
  estarás: { persons: ["2_Sing"], tense: "future" },
  estaras: { persons: ["2_Sing"], tense: "future" },
  estará: { persons: ["3_Sing"], tense: "future" },
  estara: { persons: ["3_Sing"], tense: "future" },
  estaremos: { persons: ["1+2_Plur"], tense: "future" },
  estaréis: { persons: ["2_Plur"], tense: "future" },
  estareis: { persons: ["2_Plur"], tense: "future" },
  estarán: { persons: ["3_Plur"], tense: "future" },
  estaran: { persons: ["3_Plur"], tense: "future" },
};

const AUX_GERUND_EN: Record<string, AuxInfo> = {
  am: { persons: ["1_Sing"], tense: "present" },
  "i'm": { persons: ["1_Sing"], tense: "present" },
  im: { persons: ["1_Sing"], tense: "present" },
  is: { persons: ["3_Sing"], tense: "present" },
  "he's": { persons: ["3_Sing"], tense: "present" },
  "she's": { persons: ["3_Sing"], tense: "present" },
  "it's": { persons: ["3_Sing"], tense: "present" },
  are: {
    persons: ["2_Sing", "2_Plur", "1+2_Plur", "3_Plur"],
    tense: "present",
  },
  "you're": { persons: ["2_Sing", "2_Plur"], tense: "present" },
  youre: { persons: ["2_Sing", "2_Plur"], tense: "present" },
  "we're": { persons: ["1+2_Plur"], tense: "present" },
  were: {
    persons: ["2_Sing", "2_Plur", "1+2_Plur", "3_Plur"],
    tense: "past",
  },
  was: { persons: ["1_Sing", "3_Sing"], tense: "past" },
  "they're": { persons: ["3_Plur"], tense: "present" },
};

export function getAuxGerundInfo(
  token: string,
  sourceLang: LanguageMode
): AuxInfo | null {
  const normalized = normalizeToken(token, sourceLang);
  if (sourceLang === "es") {
    return AUX_GERUND_ES[normalized] ?? null;
  }
  return AUX_GERUND_EN[normalized] ?? null;
}

export function splitVerbClitic(
  token: string,
  sourceLang: LanguageMode
): { verb: string; clitic: string } | null {
  if (sourceLang !== "es") return null;
  const normalized = normalizeToken(token, sourceLang);
  const normalizedForMatch = stripSpanishDiacritics(normalized);
  for (const clitic of OBJECT_CLITICS_ES) {
    if (normalizedForMatch.length <= clitic.length) continue;
    if (normalizedForMatch.endsWith(clitic)) {
      return {
        verb: normalizedForMatch.slice(0, -clitic.length),
        clitic,
      };
    }
  }
  return null;
}

function findGerundMatchAt(
  tokens: IRToken[],
  index: number,
  sourceLang: LanguageMode
): { match: VerbMatch; attachedObject: ObjectPronounMatch | null } | null {
  const directMatches = matchVerbAt(tokens, index, sourceLang).filter(
    (match) => match.kind === "gerund"
  );
  if (directMatches.length > 0) {
    return { match: directMatches[0], attachedObject: null };
  }
  const split = splitVerbClitic(tokens[index]?.source ?? "", sourceLang);
  if (split) {
    const cliticMatch = matchObjectPronoun(split.clitic, sourceLang);
    if (!cliticMatch) return null;
    const syntheticToken: IRToken = {
      id: tokens[index]?.id ?? "",
      source: split.verb,
      normalized: split.verb,
      pos: "unknown",
    };
    const gerundMatches = matchVerbAt([syntheticToken], 0, sourceLang).filter(
      (match) => match.kind === "gerund"
    );
    if (gerundMatches.length > 0) {
      return {
        match: { ...gerundMatches[0], consumed: 1, source: tokens[index].source },
        attachedObject: cliticMatch,
      };
    }
  }
  return null;
}

export function matchGerundAfterIndex(
  tokens: IRToken[],
  index: number,
  sourceLang: LanguageMode
): { match: VerbMatch; attachedObject: ObjectPronounMatch | null; gerundIndex: number } | null {
  if (!tokens[index]) return null;
  const directMatch = findGerundMatchAt(tokens, index, sourceLang);
  if (directMatch) {
    return {
      match: directMatch.match,
      attachedObject: directMatch.attachedObject,
      gerundIndex: index,
    };
  }
  let objectBetween = matchObjectPronoun(
    tokens[index]?.source ?? "",
    sourceLang
  );
  if (objectBetween && sourceLang === "en") {
    const betweenNormalized = normalizeToken(
      tokens[index]?.source ?? "",
      sourceLang
    );
    if (betweenNormalized === "you" || betweenNormalized === "it") {
      objectBetween = null;
    }
  }
  if (objectBetween && tokens[index + 1]) {
    const afterIndex = index + 1;
    const afterMatch = findGerundMatchAt(tokens, afterIndex, sourceLang);
    if (afterMatch) {
      return {
        match: afterMatch.match,
        attachedObject: objectBetween,
        gerundIndex: afterIndex,
      };
    }
  }
  return null;
}

function findInfinitiveMatchAt(
  tokens: IRToken[],
  index: number,
  sourceLang: LanguageMode
): { match: VerbMatch; attachedObject: ObjectPronounMatch | null } | null {
  const directMatches = matchVerbAt(tokens, index, sourceLang).filter(
    (match) => match.kind === "infinitive"
  );
  if (directMatches.length > 0) {
    return { match: directMatches[0], attachedObject: null };
  }
  const split = splitVerbClitic(tokens[index]?.source ?? "", sourceLang);
  if (split) {
    const cliticMatch = matchObjectPronoun(split.clitic, sourceLang);
    if (!cliticMatch) return null;
    const syntheticToken: IRToken = {
      id: tokens[index]?.id ?? "",
      source: split.verb,
      normalized: split.verb,
      pos: "unknown",
    };
    const infinitiveMatches = matchVerbAt([syntheticToken], 0, sourceLang).filter(
      (match) => match.kind === "infinitive"
    );
    if (infinitiveMatches.length > 0) {
      return {
        match: {
          ...infinitiveMatches[0],
          consumed: 1,
          source: tokens[index].source,
        },
        attachedObject: cliticMatch,
      };
    }
  }
  return null;
}

export function matchAuxiliaryGerundAt(
  tokens: IRToken[],
  index: number,
  sourceLang: LanguageMode
): {
  auxInfo: AuxInfo;
  gerund: VerbMatch;
  attachedObject: ObjectPronounMatch | null;
  gerundIndex: number;
} | null {
  if (sourceLang === "en") {
    const normalized = normalizeToken(tokens[index]?.source ?? "", sourceLang);
    const willMap: Record<string, PersonNumber[] | undefined> = {
      i: ["1_Sing"],
      you: ["2_Sing", "2_Plur"],
      he: ["3_Sing"],
      she: ["3_Sing"],
      it: ["3_Sing"],
      we: ["1+2_Plur"],
      they: ["3_Plur"],
    };
    let willPersons: PersonNumber[] | null = null;
    if (normalized === "will") {
      willPersons = [
        "1_Sing",
        "2_Sing",
        "3_Sing",
        "1+2_Plur",
        "2_Plur",
        "3_Plur",
      ];
    } else if (normalized === "ll") {
      const prev = tokens[index - 1];
      if (prev) {
        const prevNorm = normalizeToken(prev.source, sourceLang);
        willPersons = willMap[prevNorm] ?? null;
      }
    } else if (normalized.endsWith("'ll")) {
      const prefix = normalized.replace(/'ll$/, "");
      willPersons = willMap[prefix] ?? null;
    }

    if (willPersons && tokens[index + 1]) {
      let beIndex = index + 1;
      if (normalizeToken(tokens[beIndex]?.source ?? "", sourceLang) === "be") {
        const afterBe = matchGerundAfterIndex(tokens, beIndex + 1, sourceLang);
        if (afterBe) {
          return {
            auxInfo: { persons: willPersons, tense: "future" },
            gerund: afterBe.match,
            attachedObject: afterBe.attachedObject,
            gerundIndex: afterBe.gerundIndex,
          };
        }
      }
    }
  }

  const auxInfo = getAuxGerundInfo(tokens[index]?.source ?? "", sourceLang);
  if (!auxInfo) return null;
  const gerundIndex = index + 1;
  if (sourceLang === "en") {
    const beMatch = tokens[gerundIndex];
    if (beMatch && normalizeToken(beMatch.source, sourceLang) === "be") {
      const afterBe = matchGerundAfterIndex(tokens, gerundIndex + 1, sourceLang);
      if (afterBe) {
        return {
          auxInfo,
          gerund: afterBe.match,
          attachedObject: afterBe.attachedObject,
          gerundIndex: afterBe.gerundIndex,
        };
      }
    }
  }
  const directMatch = findGerundMatchAt(tokens, gerundIndex, sourceLang);
  if (directMatch) {
    return {
      auxInfo,
      gerund: directMatch.match,
      attachedObject: directMatch.attachedObject,
      gerundIndex,
    };
  }
  let objectBetween = matchObjectPronoun(
    tokens[gerundIndex]?.source ?? "",
    sourceLang
  );
  if (objectBetween && sourceLang === "en") {
    const betweenNormalized = normalizeToken(
      tokens[gerundIndex]?.source ?? "",
      sourceLang
    );
    if (betweenNormalized === "you" || betweenNormalized === "it") {
      objectBetween = null;
    }
  }
  if (objectBetween && tokens[gerundIndex + 1]) {
    const afterIndex = gerundIndex + 1;
    const afterMatch = findGerundMatchAt(tokens, afterIndex, sourceLang);
    if (afterMatch) {
      return {
        auxInfo,
        gerund: afterMatch.match,
        attachedObject: objectBetween,
        gerundIndex: afterIndex,
      };
    }
  }
  return null;
}

export function matchForcedAuxGerundAt(
  tokens: IRToken[],
  index: number,
  sourceLang: LanguageMode,
  auxInfo: AuxInfo
): {
  auxInfo: AuxInfo;
  gerund: VerbMatch;
  attachedObject: ObjectPronounMatch | null;
  gerundIndex: number;
} | null {
  const gerundIndex = index + 1;
  if (sourceLang === "en") {
    const beMatch = tokens[gerundIndex];
    if (beMatch && normalizeToken(beMatch.source, sourceLang) === "be") {
      const afterBe = matchGerundAfterIndex(tokens, gerundIndex + 1, sourceLang);
      if (afterBe) {
        return {
          auxInfo,
          gerund: afterBe.match,
          attachedObject: afterBe.attachedObject,
          gerundIndex: afterBe.gerundIndex,
        };
      }
    }
  }
  const directMatch = findGerundMatchAt(tokens, gerundIndex, sourceLang);
  if (directMatch) {
    return {
      auxInfo,
      gerund: directMatch.match,
      attachedObject: directMatch.attachedObject,
      gerundIndex,
    };
  }
  let objectBetween = matchObjectPronoun(
    tokens[gerundIndex]?.source ?? "",
    sourceLang
  );
  if (objectBetween && sourceLang === "en") {
    const betweenNormalized = normalizeToken(
      tokens[gerundIndex]?.source ?? "",
      sourceLang
    );
    if (betweenNormalized === "you" || betweenNormalized === "it") {
      objectBetween = null;
    }
  }
  if (objectBetween && tokens[gerundIndex + 1]) {
    const afterIndex = gerundIndex + 1;
    const afterMatch = findGerundMatchAt(tokens, afterIndex, sourceLang);
    if (afterMatch) {
      return {
        auxInfo,
        gerund: afterMatch.match,
        attachedObject: objectBetween,
        gerundIndex: afterIndex,
      };
    }
  }
  return null;
}

export function matchInfinitiveAt(
  tokens: IRToken[],
  index: number,
  sourceLang: LanguageMode
): { match: VerbMatch; attachedObject: ObjectPronounMatch | null } | null {
  return findInfinitiveMatchAt(tokens, index, sourceLang);
}
