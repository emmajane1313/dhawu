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
} from "../constants";

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
  const normalized = gupWord.replace(/['ʼ`']/g, "'");

  if (hasGlottal) {
    const withoutGlottal = normalized.slice(0, -1);
    const charBeforeGlottal = digraph || char;

    if (NASALS.includes(charBeforeGlottal)) {
      return {
        suffixed: validarFonologia(withoutGlottal + "thu"),
        suffix: "thu",
      };
    }
    return { suffixed: validarFonologia(withoutGlottal + "y'"), suffix: "y" };
  }

  if (ALL_VOWELS.includes(effectiveEnding)) {
    return { suffixed: validarFonologia(normalized + "y"), suffix: "y" };
  }

  if (
    LIQUIDS.includes(effectiveEnding) ||
    SEMIVOWELS.includes(effectiveEnding)
  ) {
    return { suffixed: validarFonologia(normalized + "yu"), suffix: "yu" };
  }

  if (NASALS.includes(effectiveEnding)) {
    return { suffixed: validarFonologia(normalized + "dhu"), suffix: "dhu" };
  }

  if (NON_GLOTTAL_STOPS.includes(effectiveEnding)) {
    return { suffixed: validarFonologia(normalized + "thu"), suffix: "thu" };
  }

  return { suffixed: validarFonologia(normalized + "yu"), suffix: "yu" };
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

  return results;
}

export function getImpliedPersonNumber(
  verbPerson: number
): PersonNumber | null {
  return VERB_PERSON_TO_PERSONNUMBER[verbPerson] || null;
}
