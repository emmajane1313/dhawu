import { LanguageMode } from "@/app/components/types/components.type";
import {
  findMultiWordMarker,
  GUP_WORDS_NO_WURRU,
  validarFonologia,
  endsInStop,
  LANG_CONFIG,
} from "../constants";
import { DeterminerMatch } from "../patternMatcher";

export type GrammaticalNumber = "singular" | "dual" | "plural";
export type PluralMarkerType = "many" | "all" | "generic" | null;
export type GrammaticalRole =
  | "subject_intransitive"
  | "subject_transitive"
  | "object"
  | "verbless"
  | "basic"
  | "possessor"
  | "possessed"
  | "comitative"
  | "humanAllative"
  | "humanAblative"
  | "sourceOrigin"
  | "purpose"
  | "indirectObject";

function isNumberTwo(token: string): boolean {
  const num = parseInt(token, 10);
  return !isNaN(num) && num === 2;
}

function isNumberThreeOrMore(token: string): boolean {
  const num = parseInt(token, 10);
  return !isNaN(num) && num >= 3;
}

export interface NumberDetectionResult {
  number: GrammaticalNumber;
  markerFound: string | null;
  markerType: PluralMarkerType;
  confidence: "high" | "medium" | "low";
  explanation: string;
  isExplicitNounPlural?: boolean;
}

export function detectNumber(
  tokens: string[],
  mode: LanguageMode
): NumberDetectionResult {
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const config = LANG_CONFIG[mode];
  const { dualMarkers, manyMarkers, allMarkers, otherPluralMarkers } = config;

  for (const token of lowerTokens) {
    if (isNumberTwo(token)) {
      return {
        number: "dual",
        markerFound: token,
        markerType: null,
        confidence: "high",
        explanation: config.detectedDual.replace("→", `"${token}" →`),
      };
    }
  }

  for (const marker of dualMarkers) {
    if (lowerTokens.includes(marker)) {
      return {
        number: "dual",
        markerFound: marker,
        markerType: null,
        confidence: "high",
        explanation: config.detectedDual.replace("→", `"${marker}" →`),
      };
    }
  }

  for (const token of lowerTokens) {
    if (isNumberThreeOrMore(token)) {
      return {
        number: "plural",
        markerFound: token,
        markerType: "generic",
        confidence: "high",
        explanation: config.detectedPlural3Plus.replace("→", `"${token}" →`),
      };
    }
  }

  const manyMatch = findMultiWordMarker(lowerTokens, manyMarkers);
  if (manyMatch) {
    return {
      number: "plural",
      markerFound: manyMatch,
      markerType: "many",
      confidence: "high",
      explanation: config.detectedPluralMany.replace("→", `"${manyMatch}" →`),
    };
  }

  const allMatch = findMultiWordMarker(lowerTokens, allMarkers);
  if (allMatch) {
    return {
      number: "plural",
      markerFound: allMatch,
      markerType: "all",
      confidence: "high",
      explanation: config.detectedPluralAll.replace("→", `"${allMatch}" →`),
    };
  }

  const otherMatch = findMultiWordMarker(lowerTokens, otherPluralMarkers);
  if (otherMatch) {
    return {
      number: "plural",
      markerFound: otherMatch,
      markerType: "generic",
      confidence: "high",
      explanation: config.detectedPlural3Plus.replace("→", `"${otherMatch}" →`),
    };
  }

  return {
    number: "singular",
    markerFound: null,
    markerType: null,
    confidence: "low",
    explanation: config.noNumberMarkerSingular,
  };
}

function isExplicitPluralNoun(part: PluralPart): boolean {
  if (GUP_WORDS_NO_WURRU.includes(part.gup.toLowerCase())) return false;
  return part.isKnownNoun === true && part.isPlural === true;
}

function canTakeWurru(gup: string): boolean {
  return !GUP_WORDS_NO_WURRU.includes(gup.toLowerCase());
}

export interface DualResult {
  noun: string;
  marker: string;
  full: string;
}

export function buildMandaDual(
  noun: string,
  role: GrammaticalRole = "basic"
): DualResult[] {
  const results: DualResult[] = [];

  if (role === "subject_intransitive" || role === "verbless") {
    results.push({ noun, marker: "maṉḏany", full: `${noun} maṉḏany` });
    results.push({ noun, marker: "maṉḏanynha", full: `${noun} maṉḏanynha` });
  } else if (role === "object") {
    results.push({ noun, marker: "maṉḏaŋunha", full: `${noun} maṉḏaŋunha` });
    results.push({ noun, marker: "maṉḏanha", full: `${noun} maṉḏanha` });
  } else {
    results.push({ noun, marker: "maṉḏa", full: `${noun} maṉḏa` });
  }

  return results;
}

export function buildMandaDualWithSuffix(
  noun: string,
  role: GrammaticalRole = "basic",
  suffix: string | null = null
): DualResult[] {
  if (!suffix) return buildMandaDual(noun, role);

  const results: DualResult[] = [];
  const suffixedNoun = validarFonologia(`${noun}${suffix}`);

  if (role === "subject_intransitive" || role === "verbless") {
    const marker = validarFonologia(`maṉḏaŋu${suffix}`);
    results.push({
      noun: suffixedNoun,
      marker,
      full: validarFonologia(`${suffixedNoun} ${marker}`),
    });
  } else if (role === "object") {
    const marker1 = validarFonologia(`maṉḏaŋunha${suffix}`);
    const marker2 = validarFonologia(`maṉḏanha${suffix}`);
    results.push({
      noun: suffixedNoun,
      marker: marker1,
      full: validarFonologia(`${suffixedNoun} ${marker1}`),
    });
    results.push({
      noun: suffixedNoun,
      marker: marker2,
      full: validarFonologia(`${suffixedNoun} ${marker2}`),
    });
  } else {
    const marker = validarFonologia(`maṉḏaŋu${suffix}`);
    results.push({
      noun: suffixedNoun,
      marker,
      full: validarFonologia(`${suffixedNoun} ${marker}`),
    });
  }

  return results;
}

export function addWurruPlural(word: string): string {
  if (endsInStop(word)) {
    return validarFonologia(word + "urruwurru");
  }
  return validarFonologia(word + "wurru");
}

export function applyPluralRuleToAnswer(
  baseGup: string,
  answerTokens: string[],
  mode: LanguageMode,
  isHuman?: boolean,
  isExplicitPlural: boolean = false
): string[] {
  const translation: PluralTranslation = {
    gup: baseGup,
    parts: [
      {
        type: "noun",
        source: answerTokens.join(" "),
        gup: baseGup,
        explanation: "",
        isHuman,
        isKnownNoun: true,
        isPlural: isExplicitPlural,
        role: "basic",
      },
    ],
    explanation: "",
  };

  const results = applyPluralToPhrase([translation], answerTokens, mode, false);
  return [...new Set(results.map((r) => r.gup))];
}

export interface MalaPluralResult {
  noun: string;
  marker: string;
  full: string;
}

export function buildMalaPlural(
  noun: string,
  isHuman: boolean,
  suffix: string | null = null
): MalaPluralResult[] {
  const results: MalaPluralResult[] = [];

  if (suffix) {
    const suffixedNoun = validarFonologia(`${noun}${suffix}`);
    if (isHuman) {
      const marker = validarFonologia(`mala${suffix}`);
      results.push({
        noun: suffixedNoun,
        marker,
        full: validarFonologia(`${marker} ${suffixedNoun}`),
      });
    } else {
      const marker = validarFonologia(`malaŋu${suffix}`);
      results.push({
        noun: suffixedNoun,
        marker,
        full: validarFonologia(`${marker} ${suffixedNoun}`),
      });
    }
  } else {
    results.push({ noun, marker: "mala", full: `mala ${noun}` });
  }

  return results;
}

export interface PluralPart {
  type:
    | "subject"
    | "verb"
    | "object"
    | "noun"
    | "adjective"
    | "adverb"
    | "particle"
    | "connector"
    | "unknown";
  source: string;
  sourceWord?: string;
  gup: string;
  baseGup?: string;
  appliedSuffix?: string;
  explanation: string;
  irregularPlurals?: string[];
  isHuman?: boolean;
  isKnownNoun?: boolean;
  isPlural?: boolean;
  isDual?: boolean;
  isAdjectiveMarker?: boolean;
  globalIndex?: number;
  role?: GrammaticalRole;
  suffixAlternatives?: { gup: string; suffix: string; explanation: string }[];
}

export interface PluralTranslation {
  gup: string;
  parts: PluralPart[];
  explanation: string;
}

function buildDualOptions(
  translation: PluralTranslation,
  nounParts: PluralPart[],
  mode: LanguageMode
): PluralTranslation[] {
  const results: PluralTranslation[] = [];
  const config = LANG_CONFIG[mode];

  for (const nounPart of nounParts) {
    const role: GrammaticalRole =
      nounPart.role ||
      (nounPart.type === "subject"
        ? "subject_intransitive"
        : nounPart.type === "object"
        ? "object"
        : "basic");
    const baseNoun = nounPart.baseGup || nounPart.gup;
    const suffix = nounPart.appliedSuffix || null;
    const dualForms = buildMandaDualWithSuffix(baseNoun, role, suffix);

    for (const dualForm of dualForms) {
      const newParts = translation.parts.map((p) => {
        if (p === nounPart) {
          return {
            ...p,
            gup: dualForm.full,
            explanation: `${p.explanation} + ${dualForm.marker} (${config.dual})`,
          };
        }
        return p;
      });

      const newGup = newParts
        .map((p) => p.gup)
        .filter((g) => g)
        .join(" ");
      results.push({
        gup: newGup,
        parts: newParts,
        explanation: `${translation.explanation} (${config.dual})`,
      });
    }
  }

  return results;
}

function buildWurruOption(
  translation: PluralTranslation,
  explicitPluralParts: PluralPart[],
  mode: LanguageMode
): PluralTranslation | null {
  if (explicitPluralParts.length === 0) return null;

  const config = LANG_CONFIG[mode];

  const newParts = translation.parts.map((p) => {
    if (explicitPluralParts.includes(p) && canTakeWurru(p.gup)) {
      let wurruForm: string;
      if (p.baseGup && p.appliedSuffix) {
        const pluralBase = addWurruPlural(p.baseGup);
        wurruForm = validarFonologia(pluralBase + p.appliedSuffix);
      } else {
        wurruForm = addWurruPlural(p.gup);
      }
      return {
        ...p,
        gup: wurruForm,
        explanation: `${p.explanation} + -wurru (${config.pluralWurru})`,
      };
    }
    return p;
  });

  const newGup = newParts
    .map((p) => p.gup)
    .filter((g) => g)
    .join(" ");
  return {
    gup: newGup,
    parts: newParts,
    explanation: `${translation.explanation} (${config.pluralWurru})`,
  };
}

function buildIrregularOptions(
  translation: PluralTranslation,
  part: PluralPart,
  mode: LanguageMode
): PluralTranslation[] {
  const results: PluralTranslation[] = [];
  if (!part.irregularPlurals) return results;

  const config = LANG_CONFIG[mode];

  for (const irregularForm of part.irregularPlurals) {
    const newParts = translation.parts.map((p) => {
      if (p === part) {
        return {
          ...p,
          gup: irregularForm,
          explanation: `${p.explanation} → ${irregularForm} (${config.irregularPlural})`,
        };
      }
      return p;
    });

    const newGup = newParts
      .map((p) => p.gup)
      .filter((g) => g)
      .join(" ");
    results.push({
      gup: newGup,
      parts: newParts,
      explanation: `${translation.explanation} (${config.irregularPlural})`,
    });
  }

  return results;
}

function buildMalaOption(
  translation: PluralTranslation,
  mode: LanguageMode,
  targetPluralParts: PluralPart[] = []
): PluralTranslation[] {
  const results: PluralTranslation[] = [];
  const config = LANG_CONFIG[mode];

  let firstNounIdx: number;
  let nounPart: PluralPart;

  if (targetPluralParts.length > 0) {
    firstNounIdx = translation.parts.findIndex((p) =>
      targetPluralParts.includes(p)
    );
    if (firstNounIdx === -1) return results;
    nounPart = translation.parts[firstNounIdx];
  } else {
    firstNounIdx = translation.parts.findIndex(
      (p) => p.type === "noun" || p.type === "subject" || p.type === "object"
    );
    if (firstNounIdx === -1) return results;
    nounPart = translation.parts[firstNounIdx];
  }
  const suffix = nounPart.appliedSuffix || null;
  const isHuman = nounPart.isHuman ?? false;
  const isKnownNoun = nounPart.isKnownNoun !== false;

  if (!suffix) {
    const newParts = [...translation.parts];
    newParts.splice(firstNounIdx, 0, {
      type: "particle",
      source: "(plural)",
      gup: "mala",
      explanation: config.pluralMarker3Plus,
      globalIndex: nounPart.globalIndex,
    });
    const newGup = newParts
      .map((p) => p.gup)
      .filter((g) => g)
      .join(" ");
    results.push({
      gup: newGup,
      parts: newParts,
      explanation: `${translation.explanation} (${config.pluralMala})`,
    });
    return results;
  }

  if (isKnownNoun) {
    const malaForm = isHuman
      ? validarFonologia(`mala${suffix}`)
      : validarFonologia(`malaŋu${suffix}`);
    const newParts = [...translation.parts];
    newParts.splice(firstNounIdx, 0, {
      type: "particle",
      source: "(plural)",
      gup: malaForm,
      explanation: isHuman
        ? `mala + ${suffix} = ${malaForm} (${config.pluralHuman})`
        : `mala + ŋu + ${suffix} = ${malaForm} (${config.pluralNonHuman})`,

      globalIndex: nounPart.globalIndex,
    });
    const newGup = newParts
      .map((p) => p.gup)
      .filter((g) => g)
      .join(" ");
    results.push({
      gup: newGup,
      parts: newParts,
      explanation: `${translation.explanation} (${config.pluralMala})`,
    });
  } else {
    const malaFormHuman = validarFonologia(`mala${suffix}`);
    const newPartsHuman = [...translation.parts];
    newPartsHuman.splice(firstNounIdx, 0, {
      type: "particle",
      source: "(plural)",
      gup: malaFormHuman,
      explanation: `mala + ${suffix} = ${malaFormHuman} (${config.pluralHuman})`,
      globalIndex: nounPart.globalIndex,
    });
    const newGupHuman = newPartsHuman
      .map((p) => p.gup)
      .filter((g) => g)
      .join(" ");
    results.push({
      gup: newGupHuman,
      parts: newPartsHuman,
      explanation: `${translation.explanation} (${config.pluralMalaHuman})`,
    });

    const malaFormNonHuman = validarFonologia(`malaŋu${suffix}`);
    const newPartsNonHuman = [...translation.parts];
    newPartsNonHuman.splice(firstNounIdx, 0, {
      type: "particle",
      source: "(plural)",
      gup: malaFormNonHuman,
      explanation: `mala + ŋu + ${suffix} = ${malaFormNonHuman} (${config.pluralNonHuman})`,
      globalIndex: nounPart.globalIndex,
    });
    const newGupNonHuman = newPartsNonHuman
      .map((p) => p.gup)
      .filter((g) => g)
      .join(" ");
    results.push({
      gup: newGupNonHuman,
      parts: newPartsNonHuman,
      explanation: `${translation.explanation} (${config.pluralMalaNonHuman})`,
    });
  }

  return results;
}

function buildDharrwaOption(
  translation: PluralTranslation,
  mode: LanguageMode
): PluralTranslation | null {
  const firstNounIdx = translation.parts.findIndex(
    (p) => p.type === "noun" || p.type === "subject" || p.type === "object"
  );
  if (firstNounIdx === -1) return null;

  const config = LANG_CONFIG[mode];
  const nounPart = translation.parts[firstNounIdx];
  const newParts = [...translation.parts];
  newParts.splice(firstNounIdx, 0, {
    type: "particle",
    source: "(many)",
    gup: "dharrwa",
    explanation: config.dharrwaMany,
    globalIndex: nounPart.globalIndex,
  });

  const newGup = newParts
    .map((p) => p.gup)
    .filter((g) => g)
    .join(" ");
  return {
    gup: newGup,
    parts: newParts,
    explanation: `${translation.explanation} (${config.pluralDharrwaMany})`,
  };
}

function buildBukmakOption(
  translation: PluralTranslation,
  mode: LanguageMode
): PluralTranslation | null {
  const firstNounIdx = translation.parts.findIndex(
    (p) => p.type === "noun" || p.type === "subject" || p.type === "object"
  );
  if (firstNounIdx === -1) return null;

  const config = LANG_CONFIG[mode];
  const nounPart = translation.parts[firstNounIdx];
  const newParts = [...translation.parts];
  newParts.splice(firstNounIdx, 0, {
    type: "particle",
    source: "(all)",
    gup: "bukmak",
    explanation: config.bukmakAll,
    globalIndex: nounPart.globalIndex,
  });

  const newGup = newParts
    .map((p) => p.gup)
    .filter((g) => g)
    .join(" ");
  return {
    gup: newGup,
    parts: newParts,
    explanation: `${translation.explanation} (${config.pluralBukmakAll})`,
  };
}

function buildWarrpamOption(
  translation: PluralTranslation,
  mode: LanguageMode
): PluralTranslation | null {
  const firstNounIdx = translation.parts.findIndex(
    (p) => p.type === "noun" || p.type === "subject" || p.type === "object"
  );
  if (firstNounIdx === -1) return null;

  const config = LANG_CONFIG[mode];
  const nounPart = translation.parts[firstNounIdx];
  const newParts = [...translation.parts];
  newParts.splice(firstNounIdx, 0, {
    type: "particle",
    source: "(all)",
    gup: "warrpam'",
    explanation: config.warrpamAll,
    globalIndex: nounPart.globalIndex,
  });

  const newGup = newParts
    .map((p) => p.gup)
    .filter((g) => g)
    .join(" ");
  return {
    gup: newGup,
    parts: newParts,
    explanation: `${translation.explanation} (${config.pluralWarrpamAll})`,
  };
}

function buildAdjectiveIrregularOptions(
  translation: PluralTranslation,
  adjPart: PluralPart,
  mode: LanguageMode
): PluralTranslation[] {
  if (!adjPart.irregularPlurals || adjPart.irregularPlurals.length === 0) {
    return [];
  }

  const config = LANG_CONFIG[mode];
  const results: PluralTranslation[] = [];
  const adjIdx = translation.parts.findIndex((p) => p === adjPart);
  if (adjIdx === -1) return [];

  for (const pluralForm of adjPart.irregularPlurals) {
    const newParts = translation.parts.map((p, i) => {
      if (i === adjIdx) {
        const finalGup = adjPart.appliedSuffix
          ? validarFonologia(pluralForm + adjPart.appliedSuffix)
          : pluralForm;
        return {
          ...p,
          gup: finalGup,
          baseGup: pluralForm,
          explanation: `${p.baseGup || p.gup} → ${finalGup} (${
            config.irregularPlural
          })`,
        };
      }
      return p;
    });

    const newGup = newParts
      .map((p) => p.gup)
      .filter((g) => g)
      .join(" ");
    results.push({
      gup: newGup,
      parts: newParts,
      explanation: `${translation.explanation} (${config.irregularPlural})`,
    });
  }

  return results;
}

function buildAdjectiveMalaOption(
  translation: PluralTranslation,
  adjPart: PluralPart,
  mode: LanguageMode
): PluralTranslation {
  const config = LANG_CONFIG[mode];
  const adjIdx = translation.parts.findIndex((p) => p === adjPart);

  const newParts = [...translation.parts];
  newParts.splice(adjIdx, 0, {
    type: "particle",
    source: "(plural adj)",
    gup: "mala",
    explanation: `mala (${config.pluralMala})`,
    globalIndex: adjPart.globalIndex,
    isAdjectiveMarker: true,
  });

  const newGup = newParts
    .map((p) => p.gup)
    .filter((g) => g)
    .join(" ");
  return {
    gup: newGup,
    parts: newParts,
    explanation: `${translation.explanation} (mala + adj)`,
  };
}

function buildAdjectiveDualOption(
  translation: PluralTranslation,
  adjPart: PluralPart,
  mode: LanguageMode
): PluralTranslation {
  const config = LANG_CONFIG[mode];
  const adjIdx = translation.parts.findIndex((p) => p === adjPart);

  const newParts = [...translation.parts];
  newParts.splice(adjIdx, 0, {
    type: "particle",
    source: "(dual adj)",
    gup: "maṉḏa",
    explanation: `maṉḏa (${config.dual})`,
    globalIndex: adjPart.globalIndex,
    isAdjectiveMarker: true,
  });

  const newGup = newParts
    .map((p) => p.gup)
    .filter((g) => g)
    .join(" ");
  return {
    gup: newGup,
    parts: newParts,
    explanation: `${translation.explanation} (maṉḏa + adj)`,
  };
}

export function applyPluralToPhrase(
  translations: PluralTranslation[],
  tokens: string[],
  mode: LanguageMode,
  hasVerb: boolean = true,
  determinerMatches: DeterminerMatch[] = []
): PluralTranslation[] {
  const numberResult = detectNumber(tokens, mode);
  const results: PluralTranslation[] = [];

  const pluralNounWords = new Set(
    determinerMatches
      .filter((m) => m.isPlural)
      .map((m) => m.nounWord.toLowerCase())
  );

  for (const translation of translations) {
    const nounParts = translation.parts.filter(
      (p) => p.type === "noun" || p.type === "subject" || p.type === "object"
    );

    for (const part of nounParts) {
      if (!part.role) {
        if (part.type === "subject") {
          part.role = hasVerb ? "subject_intransitive" : "verbless";
        } else if (part.type === "object") {
          part.role = "object";
        } else {
          part.role = "basic";
        }
      }
    }

    const explicitPluralParts = nounParts.filter((p) =>
      isExplicitPluralNoun(p)
    );

    const determinerPluralParts =
      determinerMatches.length > 0
        ? nounParts.filter((p) => pluralNounWords.has((p.sourceWord || p.source).toLowerCase()))
        : [];

    const allPluralParts = [
      ...new Set([...explicitPluralParts, ...determinerPluralParts]),
    ];

    const hasExplicitPlural = allPluralParts.length > 0;
    const hasGlobalMarkerPlural =
      determinerMatches.length === 0 &&
      (numberResult.number === "plural" || numberResult.number === "dual");

    if (!hasExplicitPlural && !hasGlobalMarkerPlural) {
      results.push(translation);
      continue;
    }

    if (numberResult.number === "dual") {
      const dualParts =
        determinerMatches.length > 0 ? allPluralParts : nounParts;
      for (const part of dualParts.length > 0 ? dualParts : nounParts) {
        part.isDual = true;
      }
      for (const part of translation.parts) {
        if (part.type === "adjective") {
          part.isDual = true;
        }
      }
      const dualOptions = buildDualOptions(
        translation,
        dualParts.length > 0 ? dualParts : nounParts,
        mode
      );
      results.push(...dualOptions);
      continue;
    }

    if (hasExplicitPlural) {
      const wurruOption = buildWurruOption(translation, allPluralParts, mode);
      if (wurruOption) results.push(wurruOption);

      for (const part of allPluralParts) {
        if (part.irregularPlurals && part.irregularPlurals.length > 0) {
          const irregularOptions = buildIrregularOptions(
            translation,
            part,
            mode
          );
          results.push(...irregularOptions);
        }
      }

      const malaOptions = buildMalaOption(translation, mode, allPluralParts);
      results.push(...malaOptions);
    }

    if (hasGlobalMarkerPlural && !hasExplicitPlural) {
      results.push(translation);

      if (numberResult.markerType === "many") {
        const dharrwaOption = buildDharrwaOption(translation, mode);
        if (dharrwaOption) results.push(dharrwaOption);
      } else if (numberResult.markerType === "all") {
        const bukmakOption = buildBukmakOption(translation, mode);
        if (bukmakOption) results.push(bukmakOption);
        const warrpamOption = buildWarrpamOption(translation, mode);
        if (warrpamOption) results.push(warrpamOption);
      } else {
        const malaOptions = buildMalaOption(translation, mode);
        results.push(...malaOptions);
      }
    }
  }

  const hasMalaMarker = (parts: PluralPart[]) => {
    const fullGup = parts
      .map((p) => p.gup || "")
      .join(" ")
      .normalize("NFC");
    return fullGup.includes("mala");
  };

  const hasMandaMarker = (parts: PluralPart[]) => {
    const fullGup = parts
      .map((p) => p.gup || "")
      .join(" ")
      .normalize("NFC");
    const mandaNorm = "maṉḏa".normalize("NFC");
    return fullGup.includes(mandaNorm) || /ma.{1,2}d.{0,1}a/i.test(fullGup);
  };

  const finalResults: PluralTranslation[] = [];
  for (const translation of results.length > 0 ? results : translations) {
    const pluralOrDualAdjParts = translation.parts.filter(
      (p) =>
        p.type === "adjective" && (p.isPlural === true || p.isDual === true)
    );

    if (pluralOrDualAdjParts.length === 0) {
      finalResults.push(translation);
      continue;
    }

    const alreadyHasMala = hasMalaMarker(translation.parts);
    const alreadyHasManda = hasMandaMarker(translation.parts);

    let currentVariants: PluralTranslation[] = [translation];

    for (const adjPart of pluralOrDualAdjParts) {
      const newVariants: PluralTranslation[] = [];

      for (const variant of currentVariants) {
        const variantAdjPart = variant.parts.find(
          (p) => p.globalIndex === adjPart.globalIndex && p.type === "adjective"
        );
        if (!variantAdjPart) {
          newVariants.push(variant);
          continue;
        }

        if (variantAdjPart.isDual) {
          if (alreadyHasManda) {
            newVariants.push(variant);
          } else {
            const dualOption = buildAdjectiveDualOption(
              variant,
              variantAdjPart,
              mode
            );
            newVariants.push(dualOption);
          }
        } else {
          if (
            variantAdjPart.irregularPlurals &&
            variantAdjPart.irregularPlurals.length > 0
          ) {
            const irregularOptions = buildAdjectiveIrregularOptions(
              variant,
              variantAdjPart,
              mode
            );
            newVariants.push(...irregularOptions);
          }

          if (alreadyHasMala) {
            newVariants.push(variant);
          } else {
            const malaOption = buildAdjectiveMalaOption(
              variant,
              variantAdjPart,
              mode
            );
            newVariants.push(malaOption);
          }
        }
      }

      currentVariants = newVariants;
    }

    finalResults.push(...currentVariants);
  }

  const deduplicatedResults: PluralTranslation[] = [];

  const isMandaLike = (w: string) => {
    const lower = w.toLowerCase();
    return (
      lower.startsWith("ma") &&
      (lower.includes("ṉḏ") ||
        lower.includes("nd") ||
        lower.includes("ṉd") ||
        lower.includes("nḏ") ||
        lower.includes("ñḏ") ||
        lower.includes("ñd"))
    );
  };

  const isMalaLike = (w: string) => w.toLowerCase().startsWith("mala");

  for (const translation of finalResults) {
    const allWords: string[] = [];
    for (const part of translation.parts) {
      if (part.gup) {
        allWords.push(...part.gup.split(/\s+/));
      }
    }

    const mandaWords = allWords.filter(isMandaLike);
    const malaWords = allWords.filter(isMalaLike);

    const indicesToRemove = new Set<number>();

    if (mandaWords.length >= 2) {
      const maxLen = Math.max(...mandaWords.map((w) => w.length));
      const minLen = Math.min(...mandaWords.map((w) => w.length));

      if (maxLen > minLen) {
        for (let i = 0; i < translation.parts.length; i++) {
          const part = translation.parts[i];
          if (part.isAdjectiveMarker) continue;
          const gup = (part.gup || "").trim();
          const gupWords = gup.split(/\s+/);
          const mandaWordsInPart = gupWords.filter(isMandaLike);

          if (
            mandaWordsInPart.length === 1 &&
            mandaWordsInPart[0].length === minLen
          ) {
            indicesToRemove.add(i);
          } else if (mandaWordsInPart.length > 1) {
            const hasShort = mandaWordsInPart.some((w) => w.length === minLen);
            const hasLong = mandaWordsInPart.some((w) => w.length > minLen);
            if (hasShort && hasLong) {
              const newGupWords = gupWords.filter(
                (w) => !isMandaLike(w) || w.length > minLen
              );
              part.gup = newGupWords.join(" ");
            }
          }
        }
      }
    }

    if (malaWords.length >= 2) {
      const maxLen = Math.max(...malaWords.map((w) => w.length));
      const minLen = Math.min(...malaWords.map((w) => w.length));

      if (maxLen > minLen) {
        for (let i = 0; i < translation.parts.length; i++) {
          const part = translation.parts[i];
          if (part.isAdjectiveMarker) continue;
          const gup = (part.gup || "").trim();
          const gupWords = gup.split(/\s+/);
          const malaWordsInPart = gupWords.filter(isMalaLike);

          if (
            malaWordsInPart.length === 1 &&
            malaWordsInPart[0].length === minLen
          ) {
            indicesToRemove.add(i);
          } else if (malaWordsInPart.length > 1) {
            const hasShort = malaWordsInPart.some((w) => w.length === minLen);
            const hasLong = malaWordsInPart.some((w) => w.length > minLen);
            if (hasShort && hasLong) {
              const newGupWords = gupWords.filter(
                (w) => !isMalaLike(w) || w.length > minLen
              );
              part.gup = newGupWords.join(" ");
            }
          }
        }
      }
    }

    if (indicesToRemove.size === 0) {
      deduplicatedResults.push(translation);
      continue;
    }

    const newParts = translation.parts.filter(
      (_, i) => !indicesToRemove.has(i)
    );
    const newGup = newParts
      .map((p) => p.gup)
      .filter((g) => g)
      .join(" ");
    deduplicatedResults.push({
      ...translation,
      gup: newGup,
      parts: newParts,
    });
  }

  return deduplicatedResults;
}
