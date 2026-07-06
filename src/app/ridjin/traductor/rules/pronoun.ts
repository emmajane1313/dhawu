import {
  ExplanationKey,
  ExplanationPayload,
  FeatureValue,
  IRToken,
  LanguageId,
  PersonNumber,
  TranslationAlternative,
  TranslationPart,
} from "../core/types";
import { getLanguagePack } from "../lang";

export const SUBJECT_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["ŋarra", "rra"],
  "2_Sing": ["nhe"],
  "3_Sing": ["ŋayi"],
  "1+2_Dual": ["ŋali"],
  "1+3_Dual": ["ŋilinyu", "linyu", "ŋalinyu"],
  "2_Dual": ["nhuma"],
  "3_Dual": ["maṉḏa"],
  "1+2_Plur": ["ŋilimurru", "ŋalimurru", "limurru"],
  "1+3_Plur": ["ŋanapurru", "napurru"],
  "2_Plur": ["nhuma"],
  "3_Plur": ["walala"],
};

export const EMPHATIC_SUBJECT_PRONOUNS_GUP: Partial<
  Record<PersonNumber, string[]>
> = {
  "1_Sing": ["ŋarrapi", "rrapi"],
  "2_Sing": ["nhepi"],
  "3_Sing": ["ŋayipi"],
  "1+2_Dual": ["ŋalipi"],
  "1+3_Dual": ["ŋilinyupi", "linyupi", "ŋalinyupi"],
  "2_Dual": ["nhumapi"],
  "3_Dual": ["maṉḏapi"],
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

interface PronounMatch {
  person: PersonNumber;
  gup: string;
  alternatives: string[];
}

interface PronounBuildOptions {
  dualize?: boolean;
  dualMarker?: string;
}

interface CoordinatedPronounResult {
  part: TranslationPart;
  consumed: number;
}

export function matchSubjectPronoun(
  token: string,
  sourceLang: LanguageId
): PronounMatch | null {
  const pack = getLanguagePack(sourceLang);
  const normalized = pack.normalize(token);
  const triggers = pack.pronounTriggers;
  if (!triggers) return null;

  const person = triggers[normalized];
  if (!person) return null;

  const forms = SUBJECT_PRONOUNS_GUP[person];
  const gup = forms?.[0] ?? "";

  return {
    person,
    gup,
    alternatives: forms ?? [],
  };
}

function resolveDualPersons(person: PersonNumber): PersonNumber[] | null {
  switch (person) {
    case "1+2_Plur":
    case "1+3_Plur":
      return ["1+2_Dual", "1+3_Dual"];
    case "2_Plur":
    case "2_Sing":
      return ["2_Dual"];
    case "3_Plur":
      return ["3_Dual"];
    default:
      return null;
  }
}

function buildAlternativesForPersons(
  persons: PersonNumber[],
  primaryGup: string
): TranslationAlternative[] {
  const alternatives: TranslationAlternative[] = [];
  const seen = new Set<string>();

  for (const person of persons) {
    const noteKey = PERSON_NOTE_KEY[person];
    const forms = SUBJECT_PRONOUNS_GUP[person] ?? [];

    for (const form of forms) {
      if (form === primaryGup) continue;
      const dedupeKey = `${form}:${noteKey ?? ""}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      alternatives.push({
        gup: form,
        notePayload: noteKey ? { key: noteKey } : undefined,
      });
    }
  }

  return alternatives;
}

function buildPronounPartForPersons(
  person: PersonNumber,
  source: string,
  explanationKey: ExplanationKey,
  marker?: string,
  alternativePersons?: PersonNumber[]
): TranslationPart {
  const forms = SUBJECT_PRONOUNS_GUP[person] ?? [];
  const gup = forms[0] ?? "";
  const persons = alternativePersons && alternativePersons.length > 0
    ? alternativePersons
    : [person];

  const data: Record<string, FeatureValue> = {
    token: source,
    gup,
    person,
  };
  if (marker) {
    data.marker = marker;
  }
  const explanations: ExplanationPayload[] = [
    {
      key: explanationKey,
      data,
    },
  ];
  const noteKey = PERSON_NOTE_KEY[person];
  if (noteKey) {
    explanations.push({ key: noteKey });
  }

  let alternatives = buildAlternativesForPersons(persons, gup);

  if (alternatives.length === 0 && forms.length > 1) {
    alternatives = forms.slice(1).map((form) => ({
      gup: form,
      notePayload: noteKey ? { key: noteKey } : undefined,
    }));
  }

  return {
    type: "pronoun",
    source,
    gup,
    output: gup,
    explanation: "",
    explanations,
    alternatives,
    meaningKey: `pronoun.${person}`,
  };
}

function buildPronounPartWithForms(args: {
  person: PersonNumber;
  source: string;
  forms: string[];
  explanationKey: ExplanationKey;
  noteKey?: ExplanationKey;
}): TranslationPart | null {
  const { person, source, forms, explanationKey, noteKey } = args;
  const gup = forms[0] ?? "";
  if (!gup) return null;

  const data: Record<string, FeatureValue> = {
    token: source,
    gup,
    person,
  };
  const explanations: ExplanationPayload[] = [
    {
      key: explanationKey,
      data,
    },
  ];
  const personNote = PERSON_NOTE_KEY[person];
  if (personNote) {
    explanations.push({ key: personNote });
  }
  if (noteKey) {
    explanations.push({ key: noteKey });
  }

  const alternatives =
    forms.length > 1
      ? forms.slice(1).map((form) => ({
          gup: form,
          notePayload: noteKey ? { key: noteKey } : undefined,
        }))
      : undefined;

  return {
    type: "pronoun",
    source,
    gup,
    output: gup,
    explanation: "",
    explanations,
    alternatives,
    meaningKey: `pronoun.${person}`,
  };
}

export function hasEmphaticSubjectForm(person: PersonNumber): boolean {
  return Boolean(EMPHATIC_SUBJECT_PRONOUNS_GUP[person]?.length);
}

export function buildEmphaticPronounPart(
  person: PersonNumber,
  source: string
): TranslationPart | null {
  const forms = EMPHATIC_SUBJECT_PRONOUNS_GUP[person] ?? [];
  return buildPronounPartWithForms({
    person,
    source,
    forms,
    explanationKey: "PRONOUN_SUBJECT_EMPHATIC",
    noteKey: "PRONOUN_NOTE_EMPHATIC",
  });
}

function buildNonHumanSubjectPart(source: string): TranslationPart {
  const gup = "dhuwala";
  const data: Record<string, FeatureValue> = {
    token: source,
    gup,
    person: "3_Sing",
  };
  const explanations: ExplanationPayload[] = [
    { key: "PRONOUN_SUBJECT_BASE", data },
    { key: "PRONOUN_NOTE_NONHUMAN" },
  ];
  return {
    type: "pronoun",
    source,
    gup,
    output: gup,
    explanation: "",
    explanations,
    alternatives: [
      { gup: "dhuwali", notePayload: { key: "PRONOUN_NOTE_NONHUMAN" } },
    ],
    meaningKey: "pronoun.3_Sing",
  };
}

export function buildPronounPart(
  token: string,
  sourceLang: LanguageId,
  options?: PronounBuildOptions
): TranslationPart | null {
  const pack = getLanguagePack(sourceLang);
  const normalized = pack.normalize(token);
  if (
    (sourceLang === "en" && normalized === "it") ||
    (sourceLang === "es" && normalized === "ello")
  ) {
    return buildNonHumanSubjectPart(token);
  }

  const match = matchSubjectPronoun(token, sourceLang);
  if (!match) return null;

  if (options?.dualize) {
    const dualPersons = resolveDualPersons(match.person);
    if (dualPersons && dualPersons.length > 0) {
      return buildPronounPartForPersons(
        dualPersons[0],
        token,
        "PRONOUN_SUBJECT_DUAL",
        options?.dualMarker,
        dualPersons
      );
    }
  }

  if (match.person === "1+2_Plur" || match.person === "1+3_Plur") {
    return buildPronounPartForPersons(
      "1+2_Plur",
      token,
      "PRONOUN_SUBJECT_BASE",
      undefined,
      ["1+2_Plur", "1+3_Plur"]
    );
  }

  return buildPronounPartForPersons(
    match.person,
    token,
    "PRONOUN_SUBJECT_BASE",
    undefined,
    [match.person]
  );
}

function accumulatePersonFlags(
  person: PersonNumber,
  flags: {
    hasFirst: boolean;
    hasSecond: boolean;
    hasThird: boolean;
    hasThirdPlural: boolean;
  }
): void {
  switch (person) {
    case "1_Sing":
      flags.hasFirst = true;
      break;
    case "2_Sing":
    case "2_Dual":
    case "2_Plur":
      flags.hasSecond = true;
      break;
    case "3_Sing":
    case "3_Dual":
      flags.hasThird = true;
      break;
    case "3_Plur":
      flags.hasThird = true;
      flags.hasThirdPlural = true;
      break;
    case "1+2_Dual":
    case "1+2_Plur":
      flags.hasFirst = true;
      flags.hasSecond = true;
      break;
    case "1+3_Dual":
      flags.hasFirst = true;
      flags.hasThird = true;
      break;
    case "1+3_Plur":
      flags.hasFirst = true;
      flags.hasThird = true;
      flags.hasThirdPlural = true;
      break;
    default:
      break;
  }
}

function resolveCoordinationPerson(
  persons: PersonNumber[],
  hasOthers: boolean,
  hasExplicitSecond: boolean,
  participantCount: number
): PersonNumber | null {
  const isPlural = participantCount >= 3;
  const flags = {
    hasFirst: false,
    hasSecond: false,
    hasThird: false,
    hasThirdPlural: false,
  };

  for (const person of persons) {
    accumulatePersonFlags(person, flags);
  }

  if (hasOthers) {
    flags.hasThird = true;
    flags.hasThirdPlural = true;
  }

  if (flags.hasFirst) {
    if (hasExplicitSecond) {
      return isPlural ? "1+2_Plur" : "1+2_Dual";
    }
    if (flags.hasThird || hasOthers) {
      return isPlural ? "1+3_Plur" : "1+3_Dual";
    }
    return null;
  }

  if (!flags.hasFirst && hasExplicitSecond) {
    return isPlural ? "2_Plur" : "2_Dual";
  }

  if (!flags.hasFirst && flags.hasThird) {
    return isPlural ? "3_Plur" : "3_Dual";
  }

  return null;
}

function isDualPerson(person: PersonNumber): boolean {
  return person.endsWith("_Dual");
}

function countParticipants(person: PersonNumber): number {
  if (person.endsWith("_Dual")) return 2;
  if (person.endsWith("_Plur")) return 3;
  return 1;
}

function getInclusiveExclusiveAlternatives(
  person: PersonNumber
): PersonNumber[] {
  if (person === "1+2_Dual" || person === "1+3_Dual") {
    return ["1+2_Dual", "1+3_Dual"];
  }
  if (person === "1+2_Plur" || person === "1+3_Plur") {
    return ["1+2_Plur", "1+3_Plur"];
  }
  return [person];
}

function matchOtherGroup(
  tokens: IRToken[],
  startIndex: number,
  sourceLang: LanguageId
): { length: number; isDual: boolean } | null {
  const pack = getLanguagePack(sourceLang);
  const dualMarkers = new Set(
    (pack.dualMarkers ?? []).map((marker) => pack.normalize(marker))
  );
  const patterns = (pack.otherGroupPatterns ?? []).map((pattern) =>
    pattern.map((token) => pack.normalize(token))
  );
  patterns.sort((a, b) => b.length - a.length);

  for (const pattern of patterns) {
    let matches = true;
    for (let offset = 0; offset < pattern.length; offset += 1) {
      const token = tokens[startIndex + offset];
      if (!token) {
        matches = false;
        break;
      }
      const normalized = pack.normalize(token.source);
      if (normalized !== pattern[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      const isDual = pattern.some((token) => dualMarkers.has(token));
      return { length: pattern.length, isDual };
    }
  }

  return null;
}

function isConjunctionToken(
  token: IRToken | undefined,
  sourceLang: LanguageId
): boolean {
  if (!token) return false;
  const pack = getLanguagePack(sourceLang);
  const normalized = pack.normalize(token.source);
  const conjunctions = (pack.conjunctions ?? []).map((word) => pack.normalize(word));
  return conjunctions.includes(normalized);
}

export function buildCoordinatedPronounPart(
  tokens: IRToken[],
  index: number,
  sourceLang: LanguageId
): CoordinatedPronounResult | null {
  const firstToken = tokens[index];
  if (!firstToken) return null;

  const startOther = matchOtherGroup(tokens, index, sourceLang);
  if (startOther) {
    const afterGroup = index + startOther.length;
    if (isConjunctionToken(tokens[afterGroup], sourceLang)) {
      const startIndex = afterGroup + 1;
      const sequence = readPronounSequence(tokens, startIndex, sourceLang);
      if (!sequence) return null;

      const totalParticipants =
        sequence.participantCount + (startOther.isDual ? 2 : 3);
      const resolvedPerson = resolveCoordinationPerson(
        sequence.persons,
        true,
        sequence.explicitSecond,
        totalParticipants
      );
      if (!resolvedPerson) return null;

      const source = tokens
        .slice(index, startIndex + sequence.consumed)
        .map((token) => token.source)
        .join(" ");

      const alternatives = getCoordinationAlternatives(
        resolvedPerson,
        sequence.hasExplicitAmbiguous
      );
      return buildCoordinationResult(
        resolvedPerson,
        source,
        startIndex + sequence.consumed - index,
        alternatives
      );
    }

    const resolvedPerson = startOther.isDual ? "3_Dual" : "3_Plur";
    const source = tokens
      .slice(index, afterGroup)
      .map((token) => token.source)
      .join(" ");

    const alternatives = getCoordinationAlternatives(resolvedPerson, false);
    return buildCoordinationResult(
      resolvedPerson,
      source,
      startOther.length,
      alternatives
    );
  }

  const firstMatch = matchSubjectPronoun(firstToken.source, sourceLang);
  if (!firstMatch) return null;

  const sequence = readPronounSequence(tokens, index, sourceLang);
  if (!sequence) return null;

  if (sequence.persons.length < 2 && !sequence.hasOthers) return null;

  const resolvedPerson = resolveCoordinationPerson(
    sequence.persons,
    sequence.hasOthers,
    sequence.explicitSecond,
    sequence.participantCount
  );
  if (!resolvedPerson) return null;

  const source = tokens
    .slice(index, index + sequence.consumed)
    .map((token) => token.source)
    .join(" ");

  const alternatives = getCoordinationAlternatives(
    resolvedPerson,
    sequence.hasExplicitAmbiguous
  );
  return buildCoordinationResult(
    resolvedPerson,
    source,
    sequence.consumed,
    alternatives
  );
}

function readPronounSequence(
  tokens: IRToken[],
  startIndex: number,
  sourceLang: LanguageId
): {
  persons: PersonNumber[];
  consumed: number;
  hasOthers: boolean;
  explicitSecond: boolean;
  participantCount: number;
  hasExplicitAmbiguous: boolean;
} | null {
  const firstToken = tokens[startIndex];
  if (!firstToken) return null;

  const firstMatch = matchSubjectPronoun(firstToken.source, sourceLang);
  if (!firstMatch) return null;

  const persons: PersonNumber[] = [firstMatch.person];
  let consumed = 1;
  let hasOthers = false;
  let explicitSecond =
    firstMatch.person === "2_Sing" ||
    firstMatch.person === "2_Dual" ||
    firstMatch.person === "2_Plur" ||
    firstMatch.person === "1+2_Dual" ||
    firstMatch.person === "1+2_Plur";
  let hasExplicitAmbiguous =
    firstMatch.person === "1+2_Dual" || firstMatch.person === "1+2_Plur";
  let participantCount = countParticipants(firstMatch.person);

  while (true) {
    const conjToken = tokens[startIndex + consumed];
    if (!isConjunctionToken(conjToken, sourceLang)) break;

    const otherMatch = matchOtherGroup(tokens, startIndex + consumed + 1, sourceLang);
    if (otherMatch) {
      hasOthers = true;
      participantCount += otherMatch.isDual ? 2 : 3;
      consumed += 1 + otherMatch.length;
      continue;
    }

    const nextToken = tokens[startIndex + consumed + 1];
    const nextMatch = nextToken
      ? matchSubjectPronoun(nextToken.source, sourceLang)
      : null;
    if (!nextMatch) break;

    persons.push(nextMatch.person);
    explicitSecond =
      explicitSecond ||
      nextMatch.person === "2_Sing" ||
      nextMatch.person === "2_Dual" ||
      nextMatch.person === "2_Plur" ||
      nextMatch.person === "1+2_Dual" ||
      nextMatch.person === "1+2_Plur";
    hasExplicitAmbiguous =
      hasExplicitAmbiguous ||
      nextMatch.person === "1+2_Dual" ||
      nextMatch.person === "1+2_Plur";
    participantCount += countParticipants(nextMatch.person);
    consumed += 2;
  }

  return {
    persons,
    consumed,
    hasOthers,
    explicitSecond,
    participantCount,
    hasExplicitAmbiguous,
  };
}

function buildCoordinationResult(
  resolvedPerson: PersonNumber,
  source: string,
  consumed: number,
  alternativePersons: PersonNumber[]
): CoordinatedPronounResult {
  const explanationKey = isDualPerson(resolvedPerson)
    ? "PRONOUN_SUBJECT_DUAL"
    : "PRONOUN_SUBJECT_BASE";

  return {
    part: buildPronounPartForPersons(
      resolvedPerson,
      source,
      explanationKey,
      undefined,
      alternativePersons
    ),
    consumed,
  };
}

function getCoordinationAlternatives(
  resolvedPerson: PersonNumber,
  hasExplicitAmbiguous: boolean
): PersonNumber[] {
  if (
    resolvedPerson === "1+2_Dual" ||
    resolvedPerson === "1+3_Dual" ||
    resolvedPerson === "1+2_Plur" ||
    resolvedPerson === "1+3_Plur"
  ) {
    if (hasExplicitAmbiguous) {
      return getInclusiveExclusiveAlternatives(resolvedPerson);
    }
    return [resolvedPerson];
  }
  return [resolvedPerson];
}

export function buildImpliedSubjectPart(
  persons: PersonNumber[],
  sourceToken?: string
): TranslationPart | null {
  const primary = persons[0];
  if (!primary) return null;
  const alternatives = persons.length > 0 ? persons : [primary];
  return buildPronounPartForPersons(
    primary,
    sourceToken ?? "",
    "SUBJECT_IMPLIED",
    undefined,
    alternatives
  );
}
