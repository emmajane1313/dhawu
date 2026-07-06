import { LanguageMode } from "@/app/components/types/components.type";
import {
  ExplanationPayload,
  TranslationPart,
} from "../core/types";
import { renderExplanationList } from "../explanations";
import { VerbMatch } from "../rules/verb";

export function finalizePart(
  part: TranslationPart,
  sourceLang: LanguageMode
): TranslationPart {
  const alternatives = part.alternatives?.map((alt) => ({
    ...alt,
    note: alt.notePayload
      ? renderExplanationList([alt.notePayload], sourceLang)
      : alt.note ?? "",
  }));
  const baseSource = part.source || part.gup;
  const slotId =
    part.slotId ??
    (part.globalIndex !== undefined
      ? `idx:${part.globalIndex}:${part.type}`
      : `src:${part.type}:${baseSource}`);

  return {
    ...part,
    slotId,
    explanation: renderExplanationList(part.explanations, sourceLang),
    alternatives,
  };
}

export function expandPartVariants(part: TranslationPart): TranslationPart[] {
  const variants: TranslationPart[] = [
    {
      ...part,
      output: part.gup,
    },
  ];
  if (!part.alternatives || part.alternatives.length === 0) {
    return variants;
  }
  for (const alt of part.alternatives) {
    variants.push({
      ...part,
      gup: alt.gup,
      output: alt.gup,
      alternatives: part.alternatives.filter((item) => item.gup !== alt.gup),
    });
  }
  return variants;
}

export function expandPartSequence(parts: TranslationPart[]): TranslationPart[][] {
  let sequences: TranslationPart[][] = [[]];
  for (const part of parts) {
    const next: TranslationPart[][] = [];
    for (const seq of sequences) {
      for (const variant of expandPartVariants(part)) {
        next.push([...seq, variant]);
      }
    }
    sequences = next;
  }
  return sequences;
}

export function createParticlePart(
  gup: string,
  sourceLang: LanguageMode,
  explanationKey: ExplanationPayload["key"],
  alternatives?: string[],
  sourceToken?: string
): TranslationPart {
  const particle = sourceToken ?? gup;
  return finalizePart(
    {
      type: "particle",
      source: sourceToken ?? "",
      gup,
      output: gup,
      explanation: "",
      explanations: [{ key: explanationKey, data: { particle } }],
      alternatives: alternatives?.map((alt) => ({
        gup: alt,
      })),
    },
    sourceLang
  );
}

export function createYesterdayMarkerPart(sourceLang: LanguageMode): TranslationPart {
  return finalizePart(
    {
      type: "adverb",
      source: "",
      gup: "barpuru",
      output: "barpuru",
      explanation: "",
      explanations: [{ key: "PAST_MARKER_YESTERDAY" }],
      meaningKey: "marker.time.yesterday",
    },
    sourceLang
  );
}

export function createVerbPart(
  match: VerbMatch,
  sourceLang: LanguageMode,
  gup: string,
  explanationKey: ExplanationPayload["key"],
  alternatives?: string[]
): TranslationPart {
  return finalizePart(
    {
      type: "verb",
      source: match.source,
      gup,
      output: gup,
      explanation: "",
      explanations: [{ key: explanationKey, data: { token: match.source, gup } }],
      meaningKey: match.entry.meaningKey,
      alternatives: alternatives?.length
        ? alternatives.map((alt) => ({ gup: alt }))
        : undefined,
    },
    sourceLang
  );
}

export function createInfinitivePart(
  match: VerbMatch,
  sourceLang: LanguageMode
): TranslationPart {
  const base = match.entry.gupForms[4] ?? match.entry.gup;
  const altBase = match.altGupForms?.[4];
  const primary = `${base}wu`;
  const alternative = `${base}wa`;
  const altPrimary = altBase ? `${altBase}wu` : null;
  const altAlternative = altBase ? `${altBase}wa` : null;
  const alternatives: string[] = [alternative];
  if (altPrimary && altPrimary !== primary) alternatives.push(altPrimary);
  if (altAlternative && altAlternative !== alternative) alternatives.push(altAlternative);
  return finalizePart(
    {
      type: "verb",
      source: match.source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations: [
        { key: "VERB_INFINITIVE", data: { token: match.source, gup: primary } },
      ],
      alternatives: alternatives.map((alt) => ({ gup: alt })),
      meaningKey: match.entry.meaningKey,
    },
    sourceLang
  );
}

export function buildDefiniteArticlePart(
  gup: string,
  source: string,
  sourceLang: LanguageMode
): TranslationPart {
  return finalizePart(
    {
      type: "particle",
      source,
      gup,
      output: gup,
      explanation: "",
      explanations: [{ key: "ARTICLE_DEFINITE", data: { token: source, gup } }],
      meaningKey: "article.definite",
    },
    sourceLang
  );
}
