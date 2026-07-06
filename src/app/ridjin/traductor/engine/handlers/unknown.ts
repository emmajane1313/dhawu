import { LanguageMode } from "@/app/components/types/components.type";
import type { ExplanationPayload, IRSentence } from "../../core/types";
import { isConnectorToken } from "../../logic/connectors";
import { isNegatorToken } from "../../logic/negation";
import {
  buildNounPhraseParts,
  isAblativePrepositionStart,
  isAllativePrepositionStart,
  isComitativePrepositionStart,
  isIndirectPrepositionStart,
  isInstrumentalPrepositionStart,
  isLocativePrepositionStart,
  isOriginPrepositionStart,
  isPurposePrepositionStart,
  isTraversivePrepositionStart,
  matchNounPhraseAfterArticle,
} from "../../logic/objects";
import { finalizePart } from "../../logic/parts";
import { matchAgentNounAt } from "../../logic/lexiconMatch";
import { normalizeToken } from "../../logic/tokenUtils";
import type { TranslateHelpers, TranslateState } from "../types";
import { debugLog } from "../debug";

export function handleUnknown(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean } {
  const { ir, index, sourceLang, state, helpers } = args;
  const token = ir.tokens[index];
  debugLog("[ridjin-debug] unknown", { index, token: token?.source });

  const agentMatch = matchAgentNounAt(ir.tokens, index, sourceLang);
  const normalized = normalizeToken(token?.source ?? "", sourceLang);
  const isDirectObjectA =
    sourceLang === "es" && (normalized === "a" || normalized === "al");
  const isPrepositionToken =
    isLocativePrepositionStart(ir.tokens, index, sourceLang) ||
    isComitativePrepositionStart(ir.tokens, index, sourceLang) ||
    isTraversivePrepositionStart(ir.tokens, index, sourceLang) ||
    isInstrumentalPrepositionStart(ir.tokens, index, sourceLang) ||
    isPurposePrepositionStart(ir.tokens, index, sourceLang) ||
    isIndirectPrepositionStart(ir.tokens, index, sourceLang) ||
    isAllativePrepositionStart(ir.tokens, index, sourceLang) ||
    isAblativePrepositionStart(ir.tokens, index, sourceLang) ||
    isOriginPrepositionStart(ir.tokens, index, sourceLang);
  const canSetAsSubject =
    !isConnectorToken(token, sourceLang) &&
    !isNegatorToken(token, sourceLang) &&
    !isDirectObjectA &&
    !isPrepositionToken;
  if (agentMatch && agentMatch.consumed === 1) {
    const parts = buildNounPhraseParts(
      { adjectives: { pre: [], post: [] }, noun: agentMatch, consumed: 1 },
      sourceLang
    );
    state.combinations = helpers.appendPartsToCombinations(
      state.combinations,
      parts,
      "dropdown"
    );
    if (canSetAsSubject) {
      const previousSubject = state.lastSubject;
      const shouldJoin: boolean =
        state.pendingSubjectJoin && Boolean(previousSubject);
      const nounIndices: number[] = shouldJoin
        ? [...(previousSubject?.nounIndices ?? []), index]
        : [index];
      state.lastSubject = {
        persons: shouldJoin ? previousSubject?.persons : undefined,
        sourceToken: token.source,
        startIndex: shouldJoin ? previousSubject?.startIndex : index,
        endIndex: index,
        kind: "noun",
        nounIndices,
        isHuman: true,
        posture: previousSubject?.posture,
      };
      state.pendingSubjectJoin = false;
    }
    return { handled: true };
  }

  const phrase = matchNounPhraseAfterArticle(ir.tokens, index, sourceLang);
  if (phrase && phrase.consumed > 1) {
    const parts = buildNounPhraseParts(phrase, sourceLang);
    state.combinations = helpers.appendPartsToCombinations(
      state.combinations,
      parts,
      "dropdown"
    );
    for (let offset = 1; offset < phrase.consumed; offset += 1) {
      state.skipIndices.add(index + offset);
    }
    if (canSetAsSubject) {
      const previousSubject = state.lastSubject;
      const shouldJoin: boolean =
        state.pendingSubjectJoin && Boolean(previousSubject);
      const nounIndices: number[] = shouldJoin
        ? [...(previousSubject?.nounIndices ?? []), index]
        : [index];
      const isHuman = phrase.noun.isHuman ?? previousSubject?.isHuman;
      const posture = previousSubject?.posture;
      state.lastSubject = {
        persons: shouldJoin ? previousSubject?.persons : undefined,
        sourceToken: token.source,
        startIndex: shouldJoin ? previousSubject?.startIndex : index,
        endIndex: index + phrase.consumed - 1,
        kind: "noun",
        nounIndices,
        isHuman,
        posture,
      };
      state.pendingSubjectJoin = false;
    }
    return { handled: true };
  }

  const explanations: ExplanationPayload[] = [
    { key: "PIPELINE_PLACEHOLDER" },
    { key: "TOKEN_PASSTHROUGH", data: { token: token.source } },
  ];

  const output = token.normalized || token.source;

  const unknownPart = finalizePart(
    {
      type: "unknown",
      source: token.source,
      gup: output,
      output,
      explanation: "",
      explanations,
      globalIndex: index,
    },
    sourceLang
  );
  state.combinations = helpers.appendPartsToCombinations(
    state.combinations,
    [unknownPart],
    "dropdown"
  );
  if (canSetAsSubject) {
    const previousSubject = state.lastSubject;
    const shouldJoin: boolean =
      state.pendingSubjectJoin && Boolean(previousSubject);
    const nounIndices: number[] = shouldJoin
      ? [...(previousSubject?.nounIndices ?? []), index]
      : [index];
    const isHuman = shouldJoin ? previousSubject?.isHuman : undefined;
    const posture = shouldJoin ? previousSubject?.posture : undefined;
    state.lastSubject = {
      persons: shouldJoin ? previousSubject?.persons : undefined,
      sourceToken: token.source,
      startIndex: shouldJoin ? previousSubject?.startIndex : index,
      endIndex: index,
      kind: "unknown",
      nounIndices,
      isHuman,
      posture,
    };
    state.pendingSubjectJoin = false;
  }
  return { handled: true };
}
