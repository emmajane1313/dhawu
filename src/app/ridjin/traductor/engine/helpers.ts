import { LanguageMode } from "@/app/components/types/components.type";
import type {
  PersonNumber,
  TranslationPart,
  TranslationResult,
  VariantGroup,
  VariantScope,
} from "../core/types";
import { buildImpliedSubjectPart } from "../rules/pronoun";
import { applyAgentSuffixToCombinations } from "../logic/agentSuffix";
import { buildBranches } from "../logic/branching";
import {
  createParticlePart,
  finalizePart,
  expandPartSequence,
} from "../logic/parts";
import { buildModalVerbPart } from "../logic/modal";
import type { ModalMatch } from "../logic/modal";
import type { PendingObject } from "../logic/objects";
import type { TokenLike } from "../logic/tokenUtils";
import type { SubjectContext, TranslateHelpers, TranslateState } from "./types";

export function createTranslateHelpers(args: {
  sourceLang: LanguageMode;
  state: TranslateState;
  nextDropdownId: () => string;
  nextBoxId: () => string;
  hasExclamation: (tokens: TokenLike[], start: number, consumed: number) => boolean;
}): TranslateHelpers {
  const { sourceLang, state, nextDropdownId, nextBoxId, hasExclamation } = args;

  const appendPartsToCombinations = (
    combos: TranslationResult["combinations"],
    parts: TranslationPart[],
    scope?: VariantScope
  ): TranslationResult["combinations"] => {
    const sequences = expandPartSequence(parts);
    const hasAlternatives = parts.some(
      (part) => part.alternatives && part.alternatives.length > 0
    );
    const expanded: TranslationResult["combinations"] = [];
    for (const combo of combos) {
      const canAssignDropdown =
        scope === "dropdown" &&
        hasAlternatives &&
        combo.variantGroup?.scope !== "box";
      const groupId = canAssignDropdown
        ? combo.variantGroup?.scope === "dropdown"
          ? combo.variantGroup.id
          : nextDropdownId()
        : undefined;
      for (const seq of sequences) {
        const nextCombo = {
          ...combo,
          parts: [...combo.parts, ...seq],
        } as TranslationResult["combinations"][number];
        if (scope === "box") {
          nextCombo.variantGroup = {
            scope: "box",
            id: nextBoxId(),
          };
        } else if (canAssignDropdown && groupId) {
          nextCombo.variantGroup = {
            scope: "dropdown",
            id: groupId,
          };
        }
        expanded.push(nextCombo);
      }
    }
    return expanded;
  };

  const buildImpliedSubjectParts = (
    persons: PersonNumber[] | null,
    sourceToken?: string
  ): TranslationPart[] => {
    if (!persons || persons.length === 0) return [];
    const implied = buildImpliedSubjectPart(persons, sourceToken);
    return implied ? [finalizePart(implied, sourceLang)] : [];
  };

  const maybeApplyAgentSuffix = (
    isTransitive: boolean,
    hasExplicitSubject: boolean
  ): void => {
    if (!isTransitive || !hasExplicitSubject) return;
    const lastSubject = state.lastSubject;
    if (!lastSubject) return;
    if (!lastSubject.nounIndices || lastSubject.nounIndices.length === 0) {
      return;
    }
    state.combinations = applyAgentSuffixToCombinations(
      state.combinations,
      lastSubject.nounIndices,
      sourceLang
    );
  };

  const updateLastVerbSubject = (
    persons: PersonNumber[] | null,
    endIndex: number,
    sourceToken?: string
  ): void => {
    if (!persons || persons.length === 0) return;
    state.lastVerbSubject = {
      persons,
      sourceToken,
      endIndex,
    };
  };

  const getSubjectPersons = (
    subject?: SubjectContext | null
  ): PersonNumber[] | null => {
    if (!subject?.persons || subject.persons.length === 0) return null;
    return subject.persons;
  };

  const getSubjectEndIndex = (
    subject?: SubjectContext | null
  ): number | null => {
    if (!subject) return null;
    return subject.endIndex;
  };

  const hasImmediateSubject = (
    subject: SubjectContext | null,
    verbIndex: number,
    pending?: PendingObject | null
  ): boolean => {
    if (!subject) return false;
    if (subject.endIndex === verbIndex - 1) return true;
    if (
      pending?.spanStart !== undefined &&
      subject.endIndex === pending.spanStart - 1
    ) {
      return true;
    }
    if (pending && pending.spanStart === undefined) {
      return subject.endIndex === verbIndex - 2;
    }
    if (subject.endIndex < verbIndex - 1) {
      let gapOnlySkipped = true;
      for (let i = subject.endIndex + 1; i < verbIndex; i += 1) {
        if (!state.skipIndices.has(i)) {
          gapOnlySkipped = false;
          break;
        }
      }
      if (gapOnlySkipped) return true;
    }
    return false;
  };

  const buildModalBranches = (
    modal: ModalMatch,
    subjectParts: TranslationPart[],
    objectSequences: TranslationPart[][],
    negated: boolean,
    negatorSource?: string
  ): TranslationPart[][] => {
    const parts: TranslationPart[] = [];
    const useNegation = negated || modal.negated;
    const negSource = negatorSource ?? modal.negatorSource;
    if (useNegation) {
      parts.push(
        createParticlePart(
          "yaka",
          sourceLang,
          "VERB_NEGATOR",
          ["bäyŋu"],
          negSource
        )
      );
    }
    parts.push(...subjectParts);
    parts.push(buildModalVerbPart(modal, sourceLang));
    return buildBranches(parts, objectSequences);
  };

  const nextVariantGroup = (scope: VariantScope): VariantGroup => ({
    scope,
    id: scope === "dropdown" ? nextDropdownId() : nextBoxId(),
  });

  return {
    appendPartsToCombinations,
    buildImpliedSubjectParts,
    updateLastVerbSubject,
    getSubjectPersons,
    getSubjectEndIndex,
    hasImmediateSubject,
    buildModalBranches,
    maybeApplyAgentSuffix,
    hasExclamation,
    nextVariantGroup,
  };
}
