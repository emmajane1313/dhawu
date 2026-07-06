import { PersonNumber } from "../core/types";
import { LEXICON } from "../lexicon";
import { LexiconLanguage, VerbEntry, VerbForms } from "../lexicon/types";
import { getLanguagePack } from "../lang";

export type VerbMatchKind =
  | "present"
  | "past_simple"
  | "past_continuous"
  | "future"
  | "imperative"
  | "subjunctive"
  | "gerund"
  | "infinitive";

export interface VerbMatch {
  entry: VerbEntry;
  forms: VerbForms;
  kind: VerbMatchKind;
  personNumbers: PersonNumber[];
  consumed: number;
  source: string;
  surface: string;
  altGupForms?: string[];
}

const PERSON_BY_INDEX: PersonNumber[] = [
  "1_Sing",
  "2_Sing",
  "3_Sing",
  "1+2_Plur",
  "2_Plur",
  "3_Plur",
];

const IMPERATIVE_PERSON: Record<
  keyof VerbForms["imperative"],
  PersonNumber | null
> = {
  yo: "1_Sing",
  tu: "2_Sing",
  usted: "3_Sing",
  nosotros: "1+2_Plur",
  vosotros: "2_Plur",
  ustedes: "3_Plur",
};

const PUNCTUATION_EDGE = /^[¡!¿?.,]+|[¡!¿?.,]+$/g;

type TokenLike = { source: string };

function normalizeToken(token: string, lang: LexiconLanguage): string {
  const pack = getLanguagePack(lang);
  const normalized = pack.normalize(token);
  return normalized.replace(PUNCTUATION_EDGE, "");
}

function splitForm(form: string, lang: LexiconLanguage): string[] {
  return form
    .split(/\s+/)
    .map((part) => normalizeToken(part, lang))
    .filter(Boolean);
}

function matchSequence(
  tokens: TokenLike[],
  start: number,
  formTokens: string[],
  lang: LexiconLanguage
): { matched: boolean; consumed: number } {
  if (formTokens.length === 0) return { matched: false, consumed: 0 };
  for (let offset = 0; offset < formTokens.length; offset += 1) {
    const token = tokens[start + offset];
    if (!token) return { matched: false, consumed: 0 };
    const normalized = normalizeToken(token.source, lang);
    if (normalized !== formTokens[offset]) {
      return { matched: false, consumed: 0 };
    }
  }
  return { matched: true, consumed: formTokens.length };
}

function pushMatch(
  matches: VerbMatch[],
  match: VerbMatch
): void {
  const dedupeKey = [
    match.entry.meaningKey,
    match.kind,
    match.personNumbers.join("|"),
    match.consumed,
    match.surface,
  ].join(":");
  if (matches.some((m) => [
    m.entry.meaningKey,
    m.kind,
    m.personNumbers.join("|"),
    m.consumed,
    m.surface,
  ].join(":") === dedupeKey)) {
    return;
  }
  matches.push(match);
}

export function matchVerbAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LexiconLanguage
): VerbMatch[] {
  const matches: VerbMatch[] = [];
  const entries = Object.values(LEXICON.verbs);
  if (entries.length === 0) return matches;

  for (const entry of entries) {
    const formsList = entry.conjugations[sourceLang] ?? [];
    for (const forms of formsList) {
      forms.presentIndicative.forEach((form: string, idx: number) => {
        const formTokens = splitForm(form, sourceLang);
        const seq = matchSequence(tokens, index, formTokens, sourceLang);
        if (!seq.matched) return;
        pushMatch(matches, {
          entry,
          forms,
          kind: "present",
          personNumbers: [PERSON_BY_INDEX[idx]],
          consumed: seq.consumed,
          source: tokens
            .slice(index, index + seq.consumed)
            .map((t) => t.source)
            .join(" "),
          surface: form,
        });
      });

      forms.preterite.forEach((form: string, idx: number) => {
        const formTokens = splitForm(form, sourceLang);
        const seq = matchSequence(tokens, index, formTokens, sourceLang);
        if (!seq.matched) return;
        pushMatch(matches, {
          entry,
          forms,
          kind: "past_simple",
          personNumbers: [PERSON_BY_INDEX[idx]],
          consumed: seq.consumed,
          source: tokens
            .slice(index, index + seq.consumed)
            .map((t) => t.source)
            .join(" "),
          surface: form,
        });
      });

      forms.imperfect.forEach((form: string, idx: number) => {
        const formTokens = splitForm(form, sourceLang);
        const seq = matchSequence(tokens, index, formTokens, sourceLang);
        if (!seq.matched) return;
        pushMatch(matches, {
          entry,
          forms,
          kind: "past_continuous",
          personNumbers: [PERSON_BY_INDEX[idx]],
          consumed: seq.consumed,
          source: tokens
            .slice(index, index + seq.consumed)
            .map((t) => t.source)
            .join(" "),
          surface: form,
        });
      });

      forms.future.forEach((form: string, idx: number) => {
        const formTokens = splitForm(form, sourceLang);
        const seq = matchSequence(tokens, index, formTokens, sourceLang);
        if (!seq.matched) return;
        pushMatch(matches, {
          entry,
          forms,
          kind: "future",
          personNumbers: [PERSON_BY_INDEX[idx]],
          consumed: seq.consumed,
          source: tokens
            .slice(index, index + seq.consumed)
            .map((t) => t.source)
            .join(" "),
          surface: form,
        });
      });

      forms.presentSubjunctive.forEach((form: string, idx: number) => {
        const formTokens = splitForm(form, sourceLang);
        const seq = matchSequence(tokens, index, formTokens, sourceLang);
        if (!seq.matched) return;
        pushMatch(matches, {
          entry,
          forms,
          kind: "subjunctive",
          personNumbers: [PERSON_BY_INDEX[idx]],
          consumed: seq.consumed,
          source: tokens
            .slice(index, index + seq.consumed)
            .map((t) => t.source)
            .join(" "),
          surface: form,
        });
      });

      const imperativeEntries = Object.entries(
        forms.imperative
      ) as [keyof VerbForms["imperative"], string | undefined][];
      imperativeEntries.forEach(([key, form]) => {
        if (!form) return;
        const variants = form.includes("|")
          ? form.split("|").map((item) => item.trim()).filter(Boolean)
          : [form];
        for (const variant of variants) {
          const formTokens = splitForm(variant, sourceLang);
          const seq = matchSequence(tokens, index, formTokens, sourceLang);
          if (!seq.matched) continue;
          const person = IMPERATIVE_PERSON[key as keyof VerbForms["imperative"]];
          pushMatch(matches, {
            entry,
            forms,
            kind: "imperative",
            personNumbers: person ? [person] : [],
            consumed: seq.consumed,
            source: tokens
              .slice(index, index + seq.consumed)
              .map((t) => t.source)
              .join(" "),
            surface: variant,
          });
        }
      });

      if (forms.gerund) {
        const formTokens = splitForm(forms.gerund, sourceLang);
        const seq = matchSequence(tokens, index, formTokens, sourceLang);
        if (seq.matched) {
          pushMatch(matches, {
            entry,
            forms,
            kind: "gerund",
            personNumbers: [],
            consumed: seq.consumed,
            source: tokens
              .slice(index, index + seq.consumed)
              .map((t) => t.source)
              .join(" "),
            surface: forms.gerund,
          });
        }
      }

      if (forms.infinitive) {
        const formTokens = splitForm(forms.infinitive, sourceLang);
        const seq = matchSequence(tokens, index, formTokens, sourceLang);
        if (seq.matched) {
          pushMatch(matches, {
            entry,
            forms,
            kind: "infinitive",
            personNumbers: [],
            consumed: seq.consumed,
            source: tokens
              .slice(index, index + seq.consumed)
              .map((t) => t.source)
              .join(" "),
            surface: forms.infinitive,
          });
        }
      }
    }
  }

  return matches;
}

export function matchPastParticipleAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LexiconLanguage
): VerbMatch[] {
  const matches: VerbMatch[] = [];
  const entries = Object.values(LEXICON.verbs);
  if (entries.length === 0) return matches;

  for (const entry of entries) {
    const formsList = entry.conjugations[sourceLang] ?? [];
    for (const forms of formsList) {
      const formTokens = splitForm(forms.pastParticiple, sourceLang);
      const seq = matchSequence(tokens, index, formTokens, sourceLang);
      if (!seq.matched) continue;
      pushMatch(matches, {
        entry,
        forms,
        kind: "past_simple",
        personNumbers: [],
        consumed: seq.consumed,
        source: tokens
          .slice(index, index + seq.consumed)
          .map((t) => t.source)
          .join(" "),
        surface: forms.pastParticiple,
      });
    }
  }

  return matches;
}
