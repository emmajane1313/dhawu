import { LanguageMode } from "@/app/components/types/components.type";
import { getLanguagePack } from "../lang";
import { LEXICON } from "../lexicon";
import { AdjectiveEntry, MarkerEntry, NounEntry, VerbEntry } from "../lexicon/types";
import { TokenLike, matchSequence, normalizeToken, splitForm } from "./tokenUtils";
import { applySuffixToGup, getBelongingSuffixes } from "./suffixes";

export type NounMatch = {
  entry?: NounEntry;
  gup: string;
  isHuman?: boolean;
  isPlace?: boolean;
  agentVerbForms?: string[];
  verbalVerbForms?: string[];
  rawAlternative?: {
    gup: string;
    meaningKey?: string;
    isHuman?: boolean;
    isPlace?: boolean;
    entry?: NounEntry;
  };
  consumed: number;
  source: string;
};

export type AdjectiveMatch = {
  entry?: AdjectiveEntry;
  gup: string;
  consumed: number;
  source: string;
  participleVerb?: VerbEntry;
  rawAlternative?: { gup: string; meaningKey?: string };
};

export type MarkerMatch = {
  entry: MarkerEntry;
  consumed: number;
};

export type ArticleMatch = {
  kind: "definite" | "indefinite";
  consumed: number;
  source: string;
};

export type TimeMarkerMatch = {
  kind: "today" | "yesterday" | "future";
  consumed: number;
  entry: MarkerEntry;
};

const DEFINITE_ARTICLES: Record<LanguageMode, string[]> = {
  es: ["el", "la", "los", "las"],
  en: ["the"],
};

const INDEFINITE_ARTICLES: Record<LanguageMode, string[]> = {
  es: ["un", "una", "unos", "unas"],
  en: ["a", "an"],
};

const AMBIGUOUS_FUTURE_FORMS: Record<LanguageMode, Set<string>> = {
  es: new Set(["dentro de", "en un", "en una"]),
  en: new Set(["in a", "in an"]),
};

const TIME_UNIT_TOKENS: Record<LanguageMode, string[]> = {
  es: [
    "día",
    "dia",
    "días",
    "dias",
    "semana",
    "semanas",
    "mes",
    "meses",
    "año",
    "ano",
    "años",
    "anos",
    "hora",
    "horas",
    "minuto",
    "minutos",
    "segundo",
    "segundos",
    "momento",
    "momentos",
  ],
  en: [
    "day",
    "days",
    "week",
    "weeks",
    "month",
    "months",
    "year",
    "years",
    "hour",
    "hours",
    "minute",
    "minutes",
    "second",
    "seconds",
    "moment",
    "moments",
  ],
};

const NUMBER_TOKENS: Record<LanguageMode, string[]> = {
  es: ["uno", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"],
  en: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
};

function isTimeUnitToken(token: string, sourceLang: LanguageMode): boolean {
  const normalized = normalizeToken(token, sourceLang);
  return (TIME_UNIT_TOKENS[sourceLang] ?? []).includes(normalized);
}

function isNumberToken(token: string, sourceLang: LanguageMode): boolean {
  const normalized = normalizeToken(token, sourceLang);
  if (!normalized) return false;
  if (/^\d+$/.test(normalized)) return true;
  return (NUMBER_TOKENS[sourceLang] ?? []).includes(normalized);
}

function isTimeUnitFollowing(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  const token = tokens[index];
  if (!token) return false;
  if (isTimeUnitToken(token.source, sourceLang)) return true;
  if (isNumberToken(token.source, sourceLang)) {
    const next = tokens[index + 1];
    if (next && isTimeUnitToken(next.source, sourceLang)) return true;
  }
  return false;
}

export function matchNounAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): NounMatch | null {
  const entries = Object.values(LEXICON.nouns);
  if (entries.length === 0) return null;
  let best: NounMatch | null = null;
  for (const entry of entries) {
    const forms = entry.formsByLang?.[sourceLang] ?? [];
    const pluralForms = entry.pluralFormsByLang?.[sourceLang] ?? [];
    const allForms = [...forms, ...pluralForms];
    for (const form of allForms) {
      const formTokens = splitForm(form, sourceLang);
      const seq = matchSequence(tokens, index, formTokens, sourceLang);
      if (!seq.matched) continue;
      const match: NounMatch = {
        entry,
        gup: entry.gup,
        isHuman: entry.isHuman,
        isPlace: entry.isPlace,
        consumed: seq.consumed,
        source: tokens
          .slice(index, index + seq.consumed)
          .map((t) => t.source)
          .join(" "),
      };
      if (!best || match.consumed > best.consumed) {
        best = match;
      }
    }
  }
  const derivedEntries = Object.values(LEXICON.verbs);
  let bestDerived: NounMatch | null = null;
  for (const entry of derivedEntries) {
    const derived = entry.derived ?? {};
    const verbalForms = derived.verbalNouns?.[sourceLang] ?? [];
    const relatedForms = derived.relatedNouns?.[sourceLang] ?? [];
    const allForms = [...verbalForms, ...relatedForms];
    if (allForms.length === 0) continue;
    for (const form of allForms) {
      const formTokens = splitForm(form, sourceLang);
      const seq = matchSequence(tokens, index, formTokens, sourceLang);
      if (!seq.matched) continue;
      const base = entry.gupForms?.[3] ?? entry.gupForms?.[0] ?? entry.gup;
      if (!base) continue;
      const suffixes = getBelongingSuffixes(base);
      const primary = suffixes.length > 0 ? applySuffixToGup(base, suffixes[0]) : base;
      const match: NounMatch = {
        gup: primary,
        isHuman: false,
        consumed: seq.consumed,
        source: tokens
          .slice(index, index + seq.consumed)
          .map((t) => t.source)
          .join(" "),
        verbalVerbForms: entry.gupForms,
      };
      if (!bestDerived || match.consumed > bestDerived.consumed) {
        bestDerived = match;
      }
    }
  }
  if (bestDerived) {
    if (best && best.consumed === bestDerived.consumed && best.source === bestDerived.source) {
      bestDerived.rawAlternative = {
        gup: best.gup,
        meaningKey: best.entry?.meaningKey,
        isHuman: best.isHuman,
        isPlace: best.isPlace,
        entry: best.entry,
      };
    }
    return bestDerived;
  }
  return best;
}

export function matchAgentNounAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): NounMatch | null {
  const entries = Object.values(LEXICON.verbs);
  if (entries.length === 0) return null;
  let best: NounMatch | null = null;
  for (const entry of entries) {
    const forms = entry.derived?.agentNouns?.[sourceLang] ?? [];
    if (forms.length === 0) continue;
    for (const form of forms) {
      const formTokens = splitForm(form, sourceLang);
      const seq = matchSequence(tokens, index, formTokens, sourceLang);
      if (!seq.matched) continue;
      const base = entry.gupForms?.[3] ?? entry.gupForms?.[0] ?? entry.gup;
      const agentBase = base ? `${base}mirri` : form;
      const match: NounMatch = {
        gup: agentBase,
        isHuman: true,
        consumed: seq.consumed,
        source: tokens
          .slice(index, index + seq.consumed)
          .map((t) => t.source)
          .join(" "),
        agentVerbForms: entry.gupForms,
      };
      if (!best || match.consumed > best.consumed) {
        best = match;
      }
    }
  }
  return best;
}

export function matchAdjectiveAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): AdjectiveMatch | null {
  const adjectiveEntries = Object.values(LEXICON.adjectives);
  const verbEntries = Object.values(LEXICON.verbs);
  let bestAdj: AdjectiveMatch | null = null;
  for (const entry of adjectiveEntries) {
    const forms = entry.formsByLang?.[sourceLang] ?? [];
    const pluralForms = entry.pluralFormsByLang?.[sourceLang] ?? [];
    const allForms = [...forms, ...pluralForms];
    for (const form of allForms) {
      const formTokens = splitForm(form, sourceLang);
      const seq = matchSequence(tokens, index, formTokens, sourceLang);
      if (!seq.matched) continue;
      const match: AdjectiveMatch = {
        entry,
        gup: entry.gup,
        consumed: seq.consumed,
        source: tokens
          .slice(index, index + seq.consumed)
          .map((t) => t.source)
          .join(" "),
      };
      if (!bestAdj || match.consumed > bestAdj.consumed) {
        bestAdj = match;
      }
    }
  }

  let bestParticiple: AdjectiveMatch | null = null;
  for (const entry of verbEntries) {
    const base =
      entry.gupForms?.[3] ?? entry.gupForms?.[0] ?? entry.gup;
    if (!base) continue;
    const derivedForms =
      entry.derived?.pastParticipleAdjectives?.[sourceLang] ?? [];
    const forms: string[] = [...derivedForms];
    for (const form of forms) {
      const formTokens = splitForm(form, sourceLang);
      const seq = matchSequence(tokens, index, formTokens, sourceLang);
      if (!seq.matched) continue;
      const match: AdjectiveMatch = {
        gup: base,
        consumed: seq.consumed,
        source: tokens
          .slice(index, index + seq.consumed)
          .map((t) => t.source)
          .join(" "),
        participleVerb: entry,
      };
      if (!bestParticiple || match.consumed > bestParticiple.consumed) {
        bestParticiple = match;
      }
    }
  }

  if (bestParticiple) {
    if (bestAdj && bestAdj.consumed === bestParticiple.consumed) {
      bestParticiple.rawAlternative = {
        gup: bestAdj.gup,
        meaningKey: bestAdj.entry?.meaningKey,
      };
    }
    if (!bestAdj || bestParticiple.consumed >= bestAdj.consumed) {
      return bestParticiple;
    }
  }
  return bestAdj;
}

export function matchMarkerAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): MarkerMatch | null {
  const markers = LEXICON.markers ?? {};
  const entries = Object.values(markers);
  if (entries.length === 0) return null;
  let best: MarkerMatch | null = null;
  for (const entry of entries) {
    const forms = entry.formsByLang?.[sourceLang] ?? [];
    for (const form of forms) {
      const formTokens = splitForm(form, sourceLang);
      const seq = matchSequence(tokens, index, formTokens, sourceLang);
      if (!seq.matched) continue;
      const match: MarkerMatch = { entry, consumed: seq.consumed };
      const hasGup = Boolean(entry.gup);
      const bestHasGup = Boolean(best?.entry.gup);
      if (
        !best ||
        match.consumed > best.consumed ||
        (match.consumed === best.consumed && hasGup && !bestHasGup)
      ) {
        best = match;
      }
    }
  }
  return best;
}

export function matchArticleAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): ArticleMatch | null {
  const token = tokens[index];
  if (!token) return null;
  const normalized = normalizeToken(token.source, sourceLang);
  if ((DEFINITE_ARTICLES[sourceLang] ?? []).includes(normalized)) {
    return { kind: "definite", consumed: 1, source: token.source };
  }
  if ((INDEFINITE_ARTICLES[sourceLang] ?? []).includes(normalized)) {
    return { kind: "indefinite", consumed: 1, source: token.source };
  }
  return null;
}

export function matchTimeMarkerAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): TimeMarkerMatch | null {
  const token = tokens[index];
  if (!token) return null;
  const entries = Object.values(LEXICON.markers ?? {}).filter(
    (entry) => entry.timeRole
  );
  if (entries.length === 0) return null;
  let best: TimeMarkerMatch | null = null;
  for (const entry of entries) {
    const forms = entry.formsByLang?.[sourceLang] ?? [];
    for (const form of forms) {
      const formTokens = splitForm(form, sourceLang);
      const seq = matchSequence(tokens, index, formTokens, sourceLang);
      if (!seq.matched) continue;
      if (
        entry.timeRole === "future" &&
        AMBIGUOUS_FUTURE_FORMS[sourceLang]?.has(formTokens.join(" ")) &&
        !isTimeUnitFollowing(tokens, index + seq.consumed, sourceLang)
      ) {
        continue;
      }
      const kind = entry.timeRole as TimeMarkerMatch["kind"];
      const hasGup = Boolean(entry.gup);
      const bestHasGup = Boolean(best?.entry.gup);
      if (
        !best ||
        seq.consumed > best.consumed ||
        (seq.consumed === best.consumed && hasGup && !bestHasGup)
      ) {
        best = { kind, consumed: seq.consumed, entry };
      }
    }
  }
  return best;
}

export function isOtherGroupPatternAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  const pack = getLanguagePack(sourceLang);
  const patterns = (pack.otherGroupPatterns ?? []).map((pattern) =>
    pattern.map((token) => normalizeToken(token, sourceLang))
  );
  for (const pattern of patterns) {
    if (pattern.length === 0) continue;
    let matches = true;
    for (let offset = 0; offset < pattern.length; offset += 1) {
      const token = tokens[index + offset];
      if (!token) {
        matches = false;
        break;
      }
      if (normalizeToken(token.source, sourceLang) !== pattern[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}
