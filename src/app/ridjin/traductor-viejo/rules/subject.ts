import { LanguageMode } from "@/app/components/types/components.type";
import { Token } from "../tokenizer";
import {
  PersonNumber,
  SUBJECT_PRONOUNS_GUP,
  PRONOUN_TRIGGERS_ES,
  PRONOUN_TRIGGERS_EN,
  VERB_PERSON_TO_PERSONNUMBER,
  NASALS,
  LIQUIDS,
  SEMIVOWELS,
  ALL_VOWELS,
  NON_GLOTTAL_STOPS,
  getWordEnding,
  validarFonologia,
  LANG_CONFIG,
  normalizeToken,
} from "../constants";
import { LEXICON } from "../lexicon";

export type { PersonNumber };
export { SUBJECT_PRONOUNS_GUP, PRONOUN_TRIGGERS_ES, PRONOUN_TRIGGERS_EN };

export type ErgativeSuffixType = "y" | "yu" | "dhu" | "thu" | null;

export interface SubjectOption {
  gup: string;
  personNumber: PersonNumber;
  explanation: string;
}

export interface SubjectResult {
  type: "pronoun" | "noun" | "name" | "implied";
  source: string;
  gup: string;
  baseGup?: string;
  ergativeSuffix?: ErgativeSuffixType;
  options: SubjectOption[];
  personNumber: PersonNumber | null;
  explanation: string;
  isHuman?: boolean;
  irregularPlurals?: string[];
  isPlural?: boolean;
  localIndex: number;
}

export function detectEmphaticSubjectTriggers(
  tokens: Token[],
  mode: LanguageMode
): {
  emphaticPersons: Set<PersonNumber>;
  hasGenericEmphasis: boolean;
  skipIndices: Set<number>;
} {
  const config = LANG_CONFIG[mode];
  const triggerMap = config.emphaticSubjectTriggers || {};
  const pronounMap = config.pronounTriggers || {};
  const normalizedTokens = tokens.map((t) => normalizeToken(t.original));

  const emphaticPersons = new Set<PersonNumber>();
  let hasGenericEmphasis = false;
  const skipIndices = new Set<number>();

  for (const [phrase, personNumber] of Object.entries(triggerMap)) {
    const phraseWords = phrase.split(" ").map((w) => normalizeToken(w));
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

      if (personNumber) {
        emphaticPersons.add(personNumber);
      } else {
        hasGenericEmphasis = true;
      }

      for (let j = 0; j < phraseWords.length; j++) {
        const idx = i + j;
        if (!pronounMap[normalizedTokens[idx]]) {
          skipIndices.add(idx);
        }
      }
    }
  }

  return { emphaticPersons, hasGenericEmphasis, skipIndices };
}

function isDerivedLexiconWord(word: string, mode: LanguageMode): boolean {
  const normalized = normalizeToken(word);
  for (const entry of Object.values(LEXICON.verbs)) {
    const verbalList = entry.verbalNouns?.[mode] || [];
    if (verbalList.some((form) => normalizeToken(form) === normalized)) {
      return true;
    }
    const adjectiveList = entry.pastParticipleAdjectives?.[mode] || [];
    if (adjectiveList.some((form) => normalizeToken(form) === normalized)) {
      return true;
    }
    const agentList = entry.agentNouns?.[mode] || [];
    if (agentList.some((form) => normalizeToken(form) === normalized)) {
      return true;
    }
    const relatedList = entry.relatedNouns?.[mode] || [];
    if (relatedList.some((form) => normalizeToken(form) === normalized)) {
      return true;
    }
    const relatedAdjList = entry.relatedAdjectives?.[mode] || [];
    if (relatedAdjList.some((form) => normalizeToken(form) === normalized)) {
      return true;
    }
  }
  return false;
}

function addPronounOptionsForPersonNumber(
  options: SubjectOption[],
  personNumber: PersonNumber,
  explanation: string
): void {
  const forms = SUBJECT_PRONOUNS_GUP[personNumber];
  if (forms.length === 1) {
    options.push({ gup: forms[0], personNumber, explanation });
  } else {
    for (const form of forms) {
      options.push({
        gup: form,
        personNumber,
        explanation: `${explanation} (${form})`,
      });
    }
  }
}

export function applyErgativeSuffix(gupWord: string): {
  suffixed: string;
  suffix: ErgativeSuffixType;
} {
  const ending = getWordEnding(gupWord);
  const { char, hasGlottal, digraph } = ending;
  const effectiveEnding = digraph || char;
  let suffix: ErgativeSuffixType = null;

  if (ALL_VOWELS.includes(effectiveEnding)) {
    suffix = "y";
  } else if (
    LIQUIDS.includes(effectiveEnding) ||
    SEMIVOWELS.includes(effectiveEnding)
  ) {
    suffix = "yu";
  } else if (NASALS.includes(effectiveEnding)) {
    suffix = hasGlottal ? "thu" : "dhu";
  } else if (NON_GLOTTAL_STOPS.includes(effectiveEnding)) {
    suffix = "thu";
  } else {
    suffix = "yu";
  }

  return { suffixed: applyErgativeSuffixWithOverride(gupWord, suffix), suffix };
}

export function applyErgativeSuffixWithOverride(
  gupWord: string,
  suffix: "y" | "yu" | "dhu" | "thu"
): string {
  const normalized = gupWord.replace(/['ʼ`']/g, "'");
  const ending = getWordEnding(normalized);
  const base = ending.hasGlottal ? normalized.slice(0, -1) : normalized;

  if (ending.hasGlottal && (suffix === "y" || suffix === "yu")) {
    if (suffix === "y") {
      return validarFonologia(base + "y'");
    }
    return validarFonologia(normalized + "yu");
  }

  return validarFonologia(base + suffix);
}

export function getPronounOptions(
  personNumber: PersonNumber,
  hasDualMarker: boolean = false,
  mode: LanguageMode
): SubjectOption[] {
  const options: SubjectOption[] = [];
  const cfg = LANG_CONFIG[mode];

  if (personNumber === "1+2_Plur" || personNumber === "1+3_Plur") {
    if (!hasDualMarker) {
      addPronounOptionsForPersonNumber(options, "1+2_Dual", cfg.weInclusive2);
      addPronounOptionsForPersonNumber(options, "1+3_Dual", cfg.weExclusive2);
      addPronounOptionsForPersonNumber(options, "1+2_Plur", cfg.weInclusive3Plus);
      addPronounOptionsForPersonNumber(options, "1+3_Plur", cfg.weExclusive3Plus);
    } else {
      addPronounOptionsForPersonNumber(options, "1+2_Dual", cfg.weInclusive2);
      addPronounOptionsForPersonNumber(options, "1+3_Dual", cfg.weExclusive2);
    }
    return options;
  }

  if (personNumber === "2_Plur") {
    if (!hasDualMarker) {
      addPronounOptionsForPersonNumber(options, "2_Dual", cfg.youTwo);
      addPronounOptionsForPersonNumber(options, "2_Plur", cfg.you3Plus);
    } else {
      addPronounOptionsForPersonNumber(options, "2_Dual", cfg.youTwo);
    }
    return options;
  }

  if (personNumber === "3_Plur") {
    if (!hasDualMarker) {
      addPronounOptionsForPersonNumber(options, "3_Dual", cfg.theyTwo);
      addPronounOptionsForPersonNumber(options, "3_Plur", cfg.they3Plus);
    } else {
      addPronounOptionsForPersonNumber(options, "3_Dual", cfg.theyTwo);
    }
    return options;
  }

  const forms = SUBJECT_PRONOUNS_GUP[personNumber];
  for (const form of forms) {
    options.push({
      gup: form,
      personNumber,
      explanation: `${form}`,
    });
  }

  return options;
}

function detectPronoun(
  word: string,
  mode: LanguageMode
): { personNumber: PersonNumber; gup: string; allGup: string[] } | null {
  const lower = word.toLowerCase();
  const { pronounTriggers } = LANG_CONFIG[mode];
  const personNumber = pronounTriggers[lower];

  if (!personNumber) return null;

  const allGup = SUBJECT_PRONOUNS_GUP[personNumber];
  return { personNumber, gup: allGup[0], allGup };
}

export function processSubjects(
  tokens: Token[],
  mode: LanguageMode,
  verbPerson: number | null,
  isImperative: boolean,
  skipIndices: Set<number> = new Set(),
  isTransitive: boolean = false,
  skipErgative: boolean = false,
  isLetUs: boolean = false
): SubjectResult[] {
  const results: SubjectResult[] = [];
  const verbIdx = tokens.findIndex((t) => t.type === "verb");
  const config = LANG_CONFIG[mode];
  const { skipWords, dualMarkers, dualSubjectPatterns } = config;
  const {
    emphaticPersons,
    hasGenericEmphasis,
    skipIndices: emphaticSkipIndices,
  } = detectEmphaticSubjectTriggers(tokens, mode);
  for (const idx of emphaticSkipIndices) {
    if (idx >= 0 && idx < tokens.length) {
      const token = tokens[idx];
      token.type = "unknown";
      token.gupKey = undefined;
      token.verbMatch = undefined;
      token.nounMatch = undefined;
      token.adjectiveMatch = undefined;
    }
  }

  const allWords = tokens.map((t) => t.original.toLowerCase());
  const hasDualMarker = dualMarkers.some((m) => allWords.includes(m));
  const isVerb1stOr2ndSingular = verbPerson === 0 || verbPerson === 1;

  if (isLetUs) {
    const letUsOptions: SubjectOption[] = [];
    addPronounOptionsForPersonNumber(
      letUsOptions,
      "1+2_Dual",
      config.weInclusive2
    );
    addPronounOptionsForPersonNumber(
      letUsOptions,
      "1+2_Plur",
      config.weInclusive3Plus
    );

    results.push({
      type: "pronoun",
      source: "[let's]",
      gup: letUsOptions[0].gup,
      options: letUsOptions,
      personNumber: letUsOptions[0].personNumber,
      explanation: `Let's → ${letUsOptions[0].gup}`,
      localIndex: -1,
    });

    return results;
  }

  const processedIndices = new Set<number>();
  for (const [pattern, personNumber] of Object.entries(dualSubjectPatterns)) {
    const patternWords = pattern.split(" ");
    for (let i = 0; i <= tokens.length - patternWords.length; i++) {
      const isBeforeVerb = verbIdx === -1 || i < verbIdx;
      if (!isBeforeVerb) continue;

      let matches = true;
      for (let j = 0; j < patternWords.length; j++) {
        if (tokens[i + j].original.toLowerCase() !== patternWords[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        const source = patternWords.join(" ");
        const options = getPronounOptions(personNumber, true, mode);
        results.push({
          type: "pronoun",
          source,
          gup: options[0].gup,
          options,
          personNumber,
          explanation: `"${source}" → ${options[0].gup} (${config.dualMarkerLabel})`,
          localIndex: i,
        });
        for (let j = 0; j < patternWords.length; j++) {
          processedIndices.add(i + j);
        }
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isBeforeVerb = verbIdx === -1 || i < verbIdx;
    const isAfterVerb = verbIdx !== -1 && i > verbIdx;
    const word = token.original.toLowerCase();

    const canBeSubject = isBeforeVerb || (isAfterVerb && !isTransitive);
    if (!canBeSubject) continue;
    if (skipIndices.has(i)) continue;
    if (emphaticSkipIndices.has(i)) continue;
    if (processedIndices.has(i)) continue;
    if (token.type === "connector") continue;
    if (skipWords.includes(word)) continue;
    if (dualMarkers.includes(word)) continue;

    if (token.type === "pronoun") {
      const detected = detectPronoun(token.original, mode);
      if (detected) {
        const options = getPronounOptions(
          detected.personNumber,
          hasDualMarker,
          mode
        );
        results.push({
          type: "pronoun",
          source: token.original,
          gup: detected.gup,
          options,
          personNumber: detected.personNumber,
          explanation: `${config.pronounArrow} "${token.original}" → ${detected.gup}`,
          localIndex: i,
        });
      }
    } else if (
      token.type === "noun" &&
      token.gupKey &&
      (isBeforeVerb || !isVerb1stOr2ndSingular)
    ) {
      if (isTransitive && token.nounMatch?.isHuman === true && !skipErgative) {
        const { suffixed, suffix } = applyErgativeSuffix(token.gupKey);
        results.push({
          type: "noun",
          source: token.original,
          gup: suffixed,
          baseGup: token.gupKey,
          ergativeSuffix: suffix,
          options: [],
          personNumber: "3_Sing",
          explanation: `${config.nounArrow} "${token.original}" → ${token.gupKey} + -${suffix} (${config.nounErgative}) → ${suffixed}`,
          isHuman: token.nounMatch?.isHuman,
          irregularPlurals: token.nounMatch?.irregularPlurals,
          isPlural: token.nounMatch?.isPlural,
          localIndex: i,
        });
      } else {
        results.push({
          type: "noun",
          source: token.original,
          gup: token.gupKey,
          options: [],
          personNumber: "3_Sing",
          explanation: `${config.nounArrow} "${token.original}" → ${token.gupKey}`,
          isHuman: token.nounMatch?.isHuman,
          irregularPlurals: token.nounMatch?.irregularPlurals,
          isPlural: token.nounMatch?.isPlural,
          localIndex: i,
        });
      }
    } else if (token.type === "unknown" && (isBeforeVerb || !isVerb1stOr2ndSingular)) {
      const negationWords = LANG_CONFIG[mode].negation;
      const isNegationWord = negationWords.includes(token.original.toLowerCase());

      if (isNegationWord) {
        continue;
      }
      if (isDerivedLexiconWord(token.original, mode)) {
        continue;
      }

      if (isTransitive && !skipErgative) {
        const { suffixed, suffix } = applyErgativeSuffix(token.original);
        const options: SubjectOption[] = [
          { gup: suffixed, personNumber: "3_Sing", explanation: `${suffixed} (${config.ifPersonShort})` },
          { gup: token.original, personNumber: "3_Sing", explanation: `${token.original} (${config.ifNotShort})` },
        ];
        results.push({
          type: "name",
          source: token.original,
          gup: suffixed,
          baseGup: token.original,
          ergativeSuffix: suffix,
          options,
          personNumber: "3_Sing",
          explanation: `"${token.original}" + -${suffix} (${config.nameErgative}) → ${suffixed}`,
          localIndex: i,
        });
      } else {
        results.push({
          type: "name",
          source: token.original,
          gup: token.original,
          options: [],
          personNumber: "3_Sing",
          explanation: `"${token.original}" (${config.nameNoTranslation})`,
          localIndex: i,
        });
      }
    }
  }

  if (
    results.length === 0 &&
    !isImperative &&
    verbPerson !== null &&
    verbPerson >= 0
  ) {
    const impliedPersonNumber = VERB_PERSON_TO_PERSONNUMBER[verbPerson];

    if (impliedPersonNumber) {
      const options = getPronounOptions(
        impliedPersonNumber,
        hasDualMarker,
        mode
      );
      const allForms = SUBJECT_PRONOUNS_GUP[impliedPersonNumber];
      const gup = options.length > 0 ? options[0].gup : allForms[0];

      results.push({
        type: "implied",
        source: `[implied from verb]`,
        gup,
        options,
        personNumber: impliedPersonNumber,
        explanation: `${config.impliedSubjectConjugation} → ${gup}`,
        localIndex: -1,
      });
    }
  }

  if (emphaticPersons.size > 0 || hasGenericEmphasis) {
    const emphasisLabel = mode === "es" ? "énfasis" : "emphasis";
    for (const result of results) {
      if (result.type !== "pronoun" && result.type !== "implied") continue;
      if (!result.personNumber) continue;
      if (!hasGenericEmphasis && !emphaticPersons.has(result.personNumber)) {
        continue;
      }

      const baseOptions =
        result.options.length > 0
          ? result.options
          : [
              {
                gup: result.gup,
                personNumber: result.personNumber,
                explanation: result.explanation,
              },
            ];
      const seen = new Set<string>();
      const piOptions: SubjectOption[] = [];
      for (const opt of baseOptions) {
        const gupPi = opt.gup.endsWith("pi") ? opt.gup : `${opt.gup}pi`;
        if (seen.has(gupPi)) continue;
        seen.add(gupPi);
        piOptions.push({
          gup: gupPi,
          personNumber: opt.personNumber,
          explanation: opt.gup.endsWith("pi")
            ? opt.explanation
            : `${opt.gup} + -pi (${emphasisLabel})`,
        });
      }
      if (piOptions.length > 0) {
        result.options = piOptions;
        result.gup = piOptions[0].gup;
        result.explanation = piOptions[0].explanation;
      }
    }
  }

  return results;
}

export function getImpliedPersonNumber(
  verbPerson: number
): PersonNumber | null {
  return VERB_PERSON_TO_PERSONNUMBER[verbPerson] || null;
}
