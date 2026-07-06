import { LanguageMode } from "@/app/components/types/components.type";
import type { ExplanationKey, TranslationPart } from "../core/types";
import { LEXICON } from "../lexicon";
import type { MarkerEntry, VerbEntry } from "../lexicon/types";
import { matchSequence, splitForm } from "./tokenUtils";
import { finalizePart } from "./parts";

export type LocativeMarkerMatch = {
  entry: MarkerEntry;
  consumed: number;
  source: string;
};

export function matchLocativeMarkerAt(
  tokens: { source: string }[],
  index: number,
  sourceLang: LanguageMode
): LocativeMarkerMatch | null {
  const entries = Object.values(LEXICON.markers ?? {}).filter(
    (entry) => entry.locationRole
  );
  if (entries.length === 0) return null;
  let best: { entry: MarkerEntry; consumed: number } | null = null;
  for (const entry of entries) {
    const forms = entry.formsByLang?.[sourceLang] ?? [];
    for (const form of forms) {
      const formTokens = splitForm(form, sourceLang);
      const seq = matchSequence(tokens, index, formTokens, sourceLang);
      if (!seq.matched) continue;
      if (!best || seq.consumed > best.consumed) {
        best = { entry, consumed: seq.consumed };
      }
    }
  }
  if (!best) return null;
  const source = tokens
    .slice(index, index + best.consumed)
    .map((token) => token.source)
    .join(" ");
  return { entry: best.entry, consumed: best.consumed, source };
}

export function buildLocativePart(
  match: LocativeMarkerMatch,
  sourceLang: LanguageMode
): TranslationPart {
  return finalizePart(
    {
      type: "adverb",
      source: match.source,
      gup: match.entry.gup,
      output: match.entry.gup,
      explanation: "",
      explanations: [{ key: "TOKEN_PASSTHROUGH", data: { token: match.source } }],
      meaningKey: match.entry.meaningKey,
    },
    sourceLang
  );
}

export function getLocativeFallbackVerb(
  role: "stationary" | "motion"
): VerbEntry | null {
  if (role === "stationary") {
    return LEXICON.verbs["nhina"] ?? null;
  }
  return null;
}

export function resolveLocativeVerbEntry(
  entry: VerbEntry,
  locative: LocativeMarkerMatch | null
): VerbEntry {
  if (!locative?.entry.locationRole) return entry;
  if (!entry.motionType) return entry;
  if (entry.motionType === locative.entry.locationRole) return entry;
  const fallback = getLocativeFallbackVerb(locative.entry.locationRole);
  return fallback ?? entry;
}

export function resolveAllativeVerbEntry(entry: VerbEntry): VerbEntry {
  if (entry.motionType === "motion") return entry;
  return LEXICON.verbs["marrtji"] ?? entry;
}

export type LocativeSubjectProfile = {
  isHuman?: boolean;
  posture?: "lying" | "standing";
};

export type LocativeVerbOption = {
  entry: VerbEntry;
  noteKey?: ExplanationKey;
};

export function resolveLocativeCopulaVerbOptions(
  profile: LocativeSubjectProfile
): LocativeVerbOption[] {
  const options: LocativeVerbOption[] = [];
  const human = LEXICON.verbs["nhina"];
  const lying = LEXICON.verbs["ŋorra"];
  const standing = LEXICON.verbs["dhärra"];
  const includeHuman = profile.isHuman !== false;
  const includeNonHuman = profile.isHuman !== true;

  if (includeHuman && human) {
    options.push({ entry: human, noteKey: "LOCATIVE_SUBJECT_HUMAN" });
  }

  if (includeNonHuman) {
    if (profile.posture === "standing") {
      if (standing) {
        options.push({
          entry: standing,
          noteKey: "LOCATIVE_SUBJECT_NONHUMAN_STANDING",
        });
      }
    } else if (profile.posture === "lying") {
      if (lying) {
        options.push({
          entry: lying,
          noteKey: "LOCATIVE_SUBJECT_NONHUMAN_LYING",
        });
      }
    } else {
      if (lying) {
        options.push({
          entry: lying,
          noteKey: "LOCATIVE_SUBJECT_NONHUMAN_LYING",
        });
      }
      if (standing) {
        options.push({
          entry: standing,
          noteKey: "LOCATIVE_SUBJECT_NONHUMAN_STANDING",
        });
      }
    }
  }

  return options;
}
