import { LanguageMode } from "@/app/components/types/components.type";
import type { IRSentence, TranslationPart, TranslationResult } from "../../core/types";
import { matchVerbAt } from "../../rules/verb";
import { expandInclusiveExclusive } from "../../logic/subjects";
import {
  appendObjectSequences,
  collectObjectSequencesAfterVerb,
} from "../../logic/objects";
import { buildConnectorPart, matchConnectorAt } from "../../logic/connectors";
import { createVerbPart } from "../../logic/parts";
import { normalizeToken } from "../../logic/tokenUtils";
import type { TranslateHelpers, TranslateState } from "../types";

const SIMULTANEOUS_MARKERS: Record<LanguageMode, string[]> = {
  es: ["mientras", "al", "durante"],
  en: ["while", "during"],
};

export function handleSimultaneousVerb(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, state, helpers } = args;
  const marker = normalizeToken(ir.tokens[index]?.source ?? "", sourceLang);
  const markers = SIMULTANEOUS_MARKERS[sourceLang] ?? [];
  if (!markers.includes(marker)) return { handled: false };

  const startIndex = index + 1;
  let initialMatches = matchVerbAt(ir.tokens, startIndex, sourceLang);
  if (initialMatches.length === 0) return { handled: false };

  const hasSubjectImmediate = helpers.hasImmediateSubject(
    state.lastSubject,
    index,
    null
  );
  const lastVerbEndIndex = helpers.getSubjectEndIndex(state.lastVerbSubject);
  const hasVerbContext = lastVerbEndIndex !== null && lastVerbEndIndex >= index - 1;
  const lastSubjectPersons = helpers.getSubjectPersons(state.lastSubject);
  const lastVerbPersons = helpers.getSubjectPersons(state.lastVerbSubject);
  const initialPreferred =
    initialMatches.find((match) => match.kind === "present") ??
    initialMatches[0];
  let inferredPersons = expandInclusiveExclusive(initialPreferred.personNumbers);
  if (inferredPersons.length === 0) {
    inferredPersons = expandInclusiveExclusive(
      lastSubjectPersons ?? lastVerbPersons ?? []
    );
  }
  const subjectParts =
    !hasSubjectImmediate && !hasVerbContext && inferredPersons.length > 0
      ? helpers.buildImpliedSubjectParts(
          inferredPersons,
          state.lastSubject?.sourceToken
        )
      : [];

  let sequences: TranslationPart[][] = [subjectParts];
  let cursor = startIndex;
  let consumedTotal = 0;
  let hasAmbiguity = false;

  const buildVerbPart = (match = initialPreferred) => {
    const base =
      match.entry.gupForms[3] ??
      match.entry.gupForms[0] ??
      match.entry.gupForms[2] ??
      match.entry.gup;
    const primary = `${base}wurru`;
    const alternative = `${base}kurru`;
    return createVerbPart(
      match,
      sourceLang,
      primary,
      "VERB_SIMULTANEOUS",
      [alternative]
    );
  };

  while (true) {
    const matches = cursor === startIndex ? initialMatches : matchVerbAt(ir.tokens, cursor, sourceLang);
    if (matches.length === 0) break;
    const preferred =
      matches.find((match) => match.kind === "present") ?? matches[0];
    const verbPart = buildVerbPart(preferred);
    if (verbPart.alternatives?.length) {
      hasAmbiguity = true;
    }
    const verbConsumed = preferred.consumed ?? 1;
    const afterObjects = collectObjectSequencesAfterVerb(
      ir.tokens,
      cursor + verbConsumed,
      sourceLang,
      {
        comitativePossessive: true,
        allowNonHumanDemonstrative: preferred.entry.isTransitive,
      }
    );
    if (afterObjects.hasAmbiguity) {
      state.hasAmbiguity = true;
    }
    const verbSequences = afterObjects.sequences.map((seq) => [
      verbPart,
      ...seq,
    ]);
    sequences = appendObjectSequences(sequences, verbSequences);
    consumedTotal += verbConsumed + afterObjects.consumed;
    cursor = startIndex + consumedTotal;

    const connector = matchConnectorAt(ir.tokens, cursor, sourceLang);
    if (!connector) break;
    const connectorPart = buildConnectorPart(connector, sourceLang);
    sequences = sequences.map((seq) => [...seq, connectorPart]);
    consumedTotal += connector.consumed;
    cursor = startIndex + consumedTotal;
    hasAmbiguity = true;
  }

  if (sequences.length === 0) return { handled: false };

  let expanded: TranslationResult["combinations"] = [];
  for (const seq of sequences) {
    expanded = expanded.concat(
      helpers.appendPartsToCombinations(state.combinations, seq, "dropdown")
    );
  }
  if (expanded.length > 1 || hasAmbiguity) {
    const group = helpers.nextVariantGroup("dropdown");
    expanded = expanded.map((combo) => ({
      ...combo,
      variantGroup:
        combo.variantGroup?.scope === "box" ? combo.variantGroup : group,
    }));
    state.hasAmbiguity = true;
  }
  state.combinations = expanded;
  const endIndex = startIndex + consumedTotal - 1;
  if (endIndex >= startIndex) {
    state.lastConnectorAnchor = endIndex;
    if (inferredPersons.length > 0) {
      helpers.updateLastVerbSubject(
        inferredPersons,
        endIndex,
        state.lastSubject?.sourceToken
      );
    }
  }
  return { handled: true, nextIndex: endIndex };
}
