import { LanguageMode } from "@/app/components/types/components.type";
import { Token } from "../tokenizer";
import { TranslationPart } from "../index";
import { ObjectResult } from "./object";
import { SubjectResult } from "./subject";
import { GrammaticalRole } from "./plural";
import {
  DjalSuffixType,
  determineDjalSuffix,
  applyDjalSuffix,
  LANG_CONFIG,
  POSSESSIVE_PRONOUNS_GUP,
  ObjectPronounType,
  PersonNumber,
  DjalVerbMatch,
} from "../constants";

const OBJECT_TO_PERSON_MAP: Record<ObjectPronounType, PersonNumber> = {
  "1_Sing": "1_Sing",
  "2_Sing": "2_Sing",
  "3_Sing": "3_Sing",
  "1_Dual_Incl": "1+2_Dual",
  "1_Dual_Excl": "1+3_Dual",
  "2_Dual": "2_Dual",
  "3_Dual": "3_Dual",
  "1+2_Plur_Incl": "1+2_Plur",
  "1+2_Plur_Excl": "1+3_Plur",
  "2_Plur": "2_Plur",
  "3_Plur": "3_Plur",
};
import { getNegationWords } from "../patterns";

export interface ModalVerbInfo {
  type: "djal" | "marnggi";
  verbLocalIndex: number;
  verbWord: string;
  gupWord: string;
}

export function detectModalVerb(
  fraseTokens: Token[],
  verbIdx: number
): ModalVerbInfo | null {
 
  const indicesToCheck =
    verbIdx >= 0
      ? [verbIdx, ...fraseTokens.map((_, i) => i).filter((i) => i !== verbIdx)]
      : fraseTokens.map((_, i) => i);

  for (const idx of indicesToCheck) {
    const verbToken = fraseTokens[idx];
    if (!verbToken || verbToken.type !== "verb" || !verbToken.verbMatch)
      continue;

    if (verbToken.verbMatch.isDjal) {
      return {
        type: "djal",
        verbLocalIndex: idx,
        verbWord: verbToken.original,
        gupWord: "djäl",
      };
    }

    if (verbToken.verbMatch.isMarnggi) {
      return {
        type: "marnggi",
        verbLocalIndex: idx,
        verbWord: verbToken.original,
        gupWord: "marŋgi",
      };
    }
  }
  return null;
}

export function collectModalVerbObjects(
  fraseTokens: Token[],
  objectResults: ObjectResult[],
  subjectResults: SubjectResult[],
  skipLocalIndices: Set<number>
): string[] {
  const objectGupWords: string[] = [];

  for (const obj of objectResults) {
    objectGupWords.push(obj.gup);
  }

  for (let i = 0; i < fraseTokens.length; i++) {
    const token = fraseTokens[i];
    if (skipLocalIndices.has(i)) continue;
    if (objectResults.some((o) => o.localIndex === i)) continue;
    if (subjectResults.some((s) => s.localIndex === i)) continue;
    if (token.type === "noun" && token.gupKey) {
      objectGupWords.push(token.gupKey);
    }
  }

  return objectGupWords;
}

export function generateModalSuffixCombinations(
  objectGupWords: string[]
): DjalSuffixType[][] {
  if (objectGupWords.length === 0) return [[]];

  const allSuffixOptions: DjalSuffixType[][] = objectGupWords.map(
    (gup) => determineDjalSuffix(gup).suffixes
  );

  let combinations: DjalSuffixType[][] = [[]];
  for (const options of allSuffixOptions) {
    const newCombinations: DjalSuffixType[][] = [];
    for (const combo of combinations) {
      for (const suffix of options) {
        newCombinations.push([...combo, suffix]);
      }
    }
    combinations = newCombinations;
  }

  return combinations;
}

export interface BuildModalVerbPartsParams {
  fraseTokens: Token[];
  globalIndices: number[];
  modalVerbInfo: ModalVerbInfo;
  objectResults: ObjectResult[];
  subjectResults: SubjectResult[];
  skipLocalIndices: Set<number>;
  suffixCombo: DjalSuffixType[];
  mode: LanguageMode;
  djalVerbMatch?: DjalVerbMatch | null;
}

export function buildModalVerbParts(
  params: BuildModalVerbPartsParams
): TranslationPart[] {
  const {
    fraseTokens,
    globalIndices,
    modalVerbInfo,
    objectResults,
    subjectResults,
    skipLocalIndices,
    suffixCombo,
    mode,
    djalVerbMatch,
  } = params;

  const parts: TranslationPart[] = [];
  const negationWords = getNegationWords(mode);
  const hasNegation = fraseTokens.some((t) =>
    negationWords.includes(t.original.toLowerCase())
  );

  const config = LANG_CONFIG[mode];

  if (hasNegation) {
    parts.push({
      type: "particle",
      source: config.defaultNegationWord,
      gup: "yaka",
      explanation: config.djalNeg,
      globalIndex: -1,
    });
  }

  for (const subj of subjectResults) {
    if (subj.type === "implied") continue;
    const subjGlobalIdx = subj.localIndex >= 0 ? globalIndices[subj.localIndex] : -1;
    parts.push({
      type: "subject",
      source: subj.source,
      gup: subj.gup,
      explanation: subj.explanation,
      globalIndex: subjGlobalIdx,
    });
  }

  parts.push({
    type: "verb",
    source: modalVerbInfo.verbWord,
    gup: modalVerbInfo.gupWord,
    explanation: `"${modalVerbInfo.verbWord}" → ${modalVerbInfo.gupWord} (${config.verbModal})`,
    globalIndex: globalIndices[modalVerbInfo.verbLocalIndex],
  });

  let suffixIdx = 0;

  for (const obj of objectResults) {
    const objGlobalIdx = obj.localIndex >= 0 ? globalIndices[obj.localIndex] : -1;

    if (obj.type === "pronoun" && obj.pronounTypes && obj.pronounTypes.length > 0) {
      const personNumber = OBJECT_TO_PERSON_MAP[obj.pronounTypes[0]];
      const possessiveForms = POSSESSIVE_PRONOUNS_GUP[personNumber];
      const pronounGup = possessiveForms[0];

      parts.push({
        type: "object",
        source: obj.source,
        gup: pronounGup,
        explanation: `"${obj.source}" → ${pronounGup} (${config.objectPronoun})`,
        globalIndex: objGlobalIdx,
        isHuman: true,
        isKnownNoun: false,
        role: "object" as GrammaticalRole,
        alternatives: possessiveForms.length > 1 ? possessiveForms.slice(1) : undefined,
      });
    } else {
      const suffix =
        suffixCombo[suffixIdx] || determineDjalSuffix(obj.gup).suffixes[0];
      suffixIdx++;
      const suffixedGup = applyDjalSuffix(obj.gup, suffix);

      parts.push({
        type: "object",
        source: obj.source,
        gup: suffixedGup,
        baseGup: obj.gup,
        appliedSuffix: suffix,
        explanation: `"${obj.source}" → ${suffixedGup} (${config.objecto} -${suffix})`,
        globalIndex: objGlobalIdx,
        isHuman: obj.isHuman ?? undefined,
        isKnownNoun: obj.type === "noun",
        irregularPlurals: obj.irregularPlurals,
        isPlural: obj.isPlural,
        role: "object" as GrammaticalRole,
      });
    }
  }

  for (let localIdx = 0; localIdx < fraseTokens.length; localIdx++) {
    const token = fraseTokens[localIdx];
    const globalIdx = globalIndices[localIdx];

    if (skipLocalIndices.has(localIdx)) continue;
    if (negationWords.includes(token.original.toLowerCase())) continue;
    if (objectResults.some((o) => o.localIndex === localIdx)) continue;
    if (subjectResults.some((s) => s.localIndex === localIdx)) continue;

    if (token.type === "noun" && token.gupKey) {
      const suffix =
        suffixCombo[suffixIdx] || determineDjalSuffix(token.gupKey).suffixes[0];
      suffixIdx++;
      const suffixedGup = applyDjalSuffix(token.gupKey, suffix);

      parts.push({
        type: "noun",
        source: token.original,
        gup: suffixedGup,
        baseGup: token.gupKey,
        appliedSuffix: suffix,
        explanation: `"${token.original}" → ${suffixedGup} (${config.sustantivo} -${suffix})`,
        globalIndex: globalIdx,
        isHuman: token.nounMatch?.isHuman,
        irregularPlurals: token.nounMatch?.irregularPlurals,
        isKnownNoun: true,
        isPlural: token.nounMatch?.isPlural,
      });
    } else if (token.type === "adjective" && token.gupKey) {
      parts.push({
        type: "adjective",
        source: token.original,
        gup: token.gupKey,
        baseGup: token.gupKey,
        explanation: config.adjective,
        globalIndex: globalIdx,
        isPlural: token.adjectiveMatch?.isPlural,
      });
    } else if (token.type === "adverb" && token.gupKey) {
      parts.push({
        type: "adverb",
        source: token.original,
        gup: token.gupKey,
        explanation: config.adverb,
        globalIndex: globalIdx,
      });
    } else if (token.type === "unknown") {
      parts.push({
        type: "unknown",
        source: token.original,
        gup: token.original,
        baseGup: token.original,
        explanation: config.unknownKey,
        globalIndex: globalIdx,
      });
    }
  }

  if (djalVerbMatch) {
    if (djalVerbMatch.attachedClitic && djalVerbMatch.attachedCliticPerson) {
      const possessiveForms = POSSESSIVE_PRONOUNS_GUP[djalVerbMatch.attachedCliticPerson];
      if (possessiveForms && possessiveForms.length > 0) {
        const pronounGup = possessiveForms[0];
        parts.push({
          type: "object",
          source: djalVerbMatch.attachedClitic,
          gup: pronounGup,
          explanation: `"${djalVerbMatch.attachedClitic}" → ${pronounGup} (${config.objectPronoun})`,
          globalIndex: globalIndices[djalVerbMatch.verbIndex] ?? -1,
          isHuman: true,
          isKnownNoun: false,
          role: "object" as GrammaticalRole,
          alternatives: possessiveForms.length > 1 ? possessiveForms.slice(1) : undefined,
        });
      }
    } else if (djalVerbMatch.subjunctivePerson !== undefined && djalVerbMatch.subjunctivePerson > 0) {
      const personMap: Record<number, PersonNumber> = {
        0: "1_Sing",
        1: "2_Sing",
        2: "3_Sing",
        3: "1+3_Plur",
        4: "2_Plur",
        5: "3_Plur",
      };
      const personKey = personMap[djalVerbMatch.subjunctivePerson];
      if (personKey) {
        const possessiveForms = POSSESSIVE_PRONOUNS_GUP[personKey];
        if (possessiveForms && possessiveForms.length > 0) {
          const pronounGup = possessiveForms[0];
          parts.push({
            type: "object",
            source: djalVerbMatch.verbWord,
            gup: pronounGup,
            explanation: `"${djalVerbMatch.verbWord}" (${personKey}) → ${pronounGup} (${config.objectPronoun})`,
            globalIndex: globalIndices[djalVerbMatch.verbIndex] ?? -1,
            isHuman: true,
            isKnownNoun: false,
            role: "object" as GrammaticalRole,
            alternatives: possessiveForms.length > 1 ? possessiveForms.slice(1) : undefined,
          });
        }
      }
    }

    const suffix =
      suffixCombo[suffixIdx] || determineDjalSuffix(djalVerbMatch.verbGupBase).suffixes[0];
    const suffixedGup = applyDjalSuffix(djalVerbMatch.verbGupBase, suffix);
    const djalLabel = djalVerbMatch.djalType === "djal" ? "djäl" : "marŋgi";

    parts.push({
      type: "verb",
      source: djalVerbMatch.verbWord,
      gup: suffixedGup,
      baseGup: djalVerbMatch.verbGupBase,
      appliedSuffix: suffix,
      explanation: `"${djalVerbMatch.verbWord}" → ${suffixedGup} (${djalLabel} + verbo -${suffix})`,
      globalIndex: globalIndices[djalVerbMatch.verbIndex] ?? -1,
    });
  }

  return parts;
}
