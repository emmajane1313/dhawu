import { LanguageMode } from "@/app/components/types/components.type";
import { Token } from "../tokenizer";
import {
  ObjectPronounType,
  ObjectPronounOption,
  OBJECT_PRONOUNS_GUP,
  OBJECT_PRONOUNS_EMPHATIC_GUP,
  validarFonologia,
  filterTypesByDual,
  LANG_CONFIG,
} from "../constants";

export type { ObjectPronounType, ObjectPronounOption };
export { OBJECT_PRONOUNS_GUP };

export interface ObjectOption {
  gup: string;
  explanation: string;
  pronounType?: ObjectPronounType;
}

export interface ObjectResult {
  type: "pronoun" | "noun" | "name";
  source: string;
  gup: string;
  baseGup?: string;
  hasNha?: boolean;
  options: ObjectOption[];
  isHuman: boolean | null;
  explanation: string;
  irregularPlurals?: string[];
  isPlural?: boolean;
  localIndex: number;
  pronounTypes?: ObjectPronounType[];
}

function normalizeEmphasisToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function detectObjectEmphasisTriggers(
  tokens: Token[],
  mode: LanguageMode
): {
  emphaticTypes: Set<ObjectPronounType>;
  hasGenericEmphasis: boolean;
  skipIndices: Set<number>;
} {
  const config = LANG_CONFIG[mode];
  const triggerMap = config.objectEmphaticTriggers || {};
  const normalizedTokens = tokens.map((t) => normalizeEmphasisToken(t.original));

  const emphaticTypes = new Set<ObjectPronounType>();
  let hasGenericEmphasis = false;
  const skipIndices = new Set<number>();

  for (const [phrase, types] of Object.entries(triggerMap)) {
    const phraseWords = phrase.split(" ").map((w) => normalizeEmphasisToken(w));
    if (phraseWords.length === 0) continue;
    for (let i = 0; i <= normalizedTokens.length - phraseWords.length; i++) {
      let matches = true;
      for (let j = 0; j < phraseWords.length; j++) {
        if (normalizedTokens[i + j] !== phraseWords[j]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;

      if (types && types.length > 0) {
        for (const t of types) emphaticTypes.add(t);
      } else {
        hasGenericEmphasis = true;
      }

      for (let j = 0; j < phraseWords.length; j++) {
        skipIndices.add(i + j);
      }
    }
  }

  return { emphaticTypes, hasGenericEmphasis, skipIndices };
}

function applyNha(gupWord: string): string {
  return validarFonologia(gupWord + "nha");
}

function detectObjectPronoun(
  word: string,
  mode: LanguageMode,
  hasDualMarker: boolean = false
): { types: ObjectPronounType[]; options: ObjectPronounOption[] } | null {
  const lower = word.toLowerCase();
  const { objectPronounTriggers } = LANG_CONFIG[mode];
  const rawTypes = objectPronounTriggers[lower];

  if (!rawTypes || rawTypes.length === 0) return null;

  const types = filterTypesByDual(rawTypes, hasDualMarker);
  const options = types.map((t) => OBJECT_PRONOUNS_GUP[t]);
  return { types, options };
}

function buildPronounOptions(
  options: ObjectPronounOption[],
  types: ObjectPronounType[],
  mode: LanguageMode
): ObjectOption[] {
  const result: ObjectOption[] = [];

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const pronounType = types[i];
    result.push({
      gup: opt.gup,
      explanation: opt.explanation,
      pronounType,
    });
    for (const alt of opt.alternatives) {
      result.push({
        gup: alt,
        explanation: `${alt} (${LANG_CONFIG[mode].alternative})`,
        pronounType,
      });
    }
  }

  return result;
}

export interface ProcessObjectsResult {
  objects: ObjectResult[];
  personalAIndices: number[];
}

export function processObjects(
  tokens: Token[],
  mode: LanguageMode,
  skipIndices: Set<number> = new Set(),
  treatAllAsObjects: boolean = false,
  verbMotionType?: "motion" | "stationary",
  isTransitive: boolean = true,
  suppressNha: boolean = false
): ProcessObjectsResult {
  const results: ObjectResult[] = [];
  const personalAIndices: number[] = [];
  const verbIdx = tokens.findIndex((t) => t.type === "verb");
  const config = LANG_CONFIG[mode];
  const { dualMarkers } = config;
  const emphasis = detectObjectEmphasisTriggers(tokens, mode);
  for (const idx of emphasis.skipIndices) {
    skipIndices.add(idx);
  }
  const emphasisLabel = mode === "es" ? "énfasis" : "emphasis";

  const allWords = tokens.map((t) => t.original.toLowerCase());
  const hasDualMarker = dualMarkers.some((m) => allWords.includes(m));

  const personalAPositions = new Set<number>();
  if (config.hasPersonalA && !treatAllAsObjects) {
    for (let i = 0; i < tokens.length - 1; i++) {
      if (skipIndices.has(i)) continue;
      if (skipIndices.has(i + 1)) continue;
      const isAfterVerb = verbIdx !== -1 && i > verbIdx;
      if (!isAfterVerb) continue;

      const word = tokens[i].original.toLowerCase();
      const nextToken = tokens[i + 1];

      const personalATriggers = ["a", ...config.contractionWords];
      if (
        personalATriggers.includes(word) &&
        (nextToken.type === "noun" || nextToken.type === "unknown")
      ) {
        if (verbMotionType === "motion") {
          continue;
        }
        personalAPositions.add(i);
        personalAIndices.push(i);
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const word = token.original.toLowerCase();

    if (skipIndices.has(i)) continue;
    if (token.type === "connector") continue;
    if (personalAPositions.has(i)) continue;
    if (dualMarkers.includes(word)) continue;

    const isAfterVerb = treatAllAsObjects || (verbIdx !== -1 && i > verbIdx);
    
    const hasPersonalABefore =
      config.hasPersonalA && i > 0 && personalAPositions.has(i - 1);

    const detected = detectObjectPronoun(word, mode, hasDualMarker);

    if (detected) {
      const shouldEmphasize =
        emphasis.hasGenericEmphasis ||
        detected.types.some((t) => emphasis.emphaticTypes.has(t));
      if (shouldEmphasize) {
        const emphaticTypes = emphasis.hasGenericEmphasis
          ? detected.types
          : detected.types.filter((t) => emphasis.emphaticTypes.has(t));
        const emphaticOptions = emphaticTypes.map(
          (t) => OBJECT_PRONOUNS_EMPHATIC_GUP[t]
        );
        const pronounOptions = buildPronounOptions(
          emphaticOptions,
          emphaticTypes,
          mode
        );
        const mainOption = emphaticOptions[0];
        results.push({
          type: "pronoun",
          source: token.original,
          gup: mainOption.gup,
          options: pronounOptions,
          isHuman: null,
          explanation: `${config.objectPronoun} "${token.original}" → ${mainOption.gup} (${emphasisLabel})`,
          localIndex: i,
          pronounTypes: emphaticTypes,
        });
        continue;
      }

      const pronounOptions = buildPronounOptions(
        detected.options,
        detected.types,
        mode
      );
      const mainOption = detected.options[0];
      const options: ObjectOption[] = [
        ...pronounOptions,
        {
          gup: "",
          explanation: config.noPronounForThings,
        },
      ];
      results.push({
        type: "pronoun",
        source: token.original,
        gup: mainOption.gup,
        options,
        isHuman: null,
        explanation: `${config.objectPronoun} "${token.original}" → ${mainOption.gup}`,
        localIndex: i,
        pronounTypes: detected.types,
      });
    } else if (isAfterVerb && token.type === "noun" && token.gupKey && isTransitive) {
      const isHuman = token.nounMatch?.isHuman;
      const isDefinitelyHuman = isHuman === true || hasPersonalABefore;

      const irregularPlurals = token.nounMatch?.irregularPlurals;
      if (isDefinitelyHuman && !suppressNha) {
        const withNha = applyNha(token.gupKey);
        results.push({
          type: "noun",
          source: token.original,
          gup: withNha,
          baseGup: token.gupKey,
          hasNha: true,
          options: [],
          isHuman: true,
          explanation: `${config.noun} "${token.original}" → ${token.gupKey} + ${config.nhaPerson} → ${withNha}`,
          irregularPlurals,
          isPlural: token.nounMatch?.isPlural,
          localIndex: i,
        });
       
      } else {
        results.push({
          type: "noun",
          source: token.original,
          gup: token.gupKey,
          hasNha: false,
          options: [],
          isHuman: isDefinitelyHuman ? true : false,
          explanation: `${config.noun} "${token.original}" → ${token.gupKey} (${config.notPersonNoNha})`,
          irregularPlurals,
          isPlural: token.nounMatch?.isPlural,
          localIndex: i,
        });
    
      }
    } else if (isAfterVerb && token.type === "unknown" && isTransitive) {
      const withNha = applyNha(token.original);
      if (suppressNha) {
        results.push({
          type: "name",
          source: token.original,
          gup: token.original,
          baseGup: token.original,
          hasNha: false,
          options: [],
          isHuman: null,
          explanation: `"${token.original}" → ${token.original} (${config.notPersonNoNha})`,
          localIndex: i,
        });
      } else if (hasPersonalABefore) {
        results.push({
          type: "name",
          source: token.original,
          gup: withNha,
          baseGup: token.original,
          hasNha: true,
          options: [
            {
              gup: withNha,
              explanation: `${withNha} (${config.ifPerson})`,
            },
            {
              gup: token.original,
              explanation: `${token.original} (${config.ifNotPerson})`,
            },
          ],
          isHuman: null,
          explanation: `"${token.original}" + -nha (${config.personMarkedWithA}) → ${withNha}`,
          localIndex: i,
        });
      } else {
        results.push({
          type: "name",
          source: token.original,
          gup: withNha,
          baseGup: token.original,
          hasNha: true,
          options: [
            {
              gup: withNha,
              explanation: `${withNha} (${config.ifPerson})`,
            },
            {
              gup: token.original,
              explanation: `${token.original} (${config.ifNotPerson})`,
            },
          ],
          isHuman: null,
          explanation: `"${token.original}" → ${withNha}`,
          localIndex: i,
        });
      }
    }
  }

  return { objects: results, personalAIndices };
}
