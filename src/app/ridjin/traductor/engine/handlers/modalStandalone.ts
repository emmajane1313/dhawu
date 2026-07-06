import { LanguageMode } from "@/app/components/types/components.type";
import type { IRSentence, TranslationResult } from "../../core/types";
import { expandInclusiveExclusive } from "../../logic/subjects";
import { buildModalObjectSequencesFromPending, collectModalObjectSequences } from "../../logic/modal";
import { matchModalSpecialAt } from "../../logic/modal";
import type { ModalPendingObject } from "../../logic/modal";
import type { PendingObject } from "../../logic/objects";
import { appendObjectSequences } from "../../logic/objects";
import type { TranslateHelpers, TranslateState } from "../types";
import { debugLog } from "../debug";

export function handleModalStandalone(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, state, helpers } = args;
  const modalMatch = matchModalSpecialAt(ir.tokens, index, sourceLang);
  debugLog("[ridjin-debug] modalStandalone", {
    index,
    token: ir.tokens[index]?.source,
    modalMatch,
  });
  if (!modalMatch) return { handled: false };

  let objectFromPending: PendingObject | null = null;
  if (state.pendingObject && state.pendingObjectIndex === index) {
    objectFromPending = state.pendingObject;
    state.pendingObject = null;
    state.pendingObjectIndex = null;
  }
  const hasSubjectImmediate = helpers.hasImmediateSubject(
    state.lastSubject,
    index,
    objectFromPending
  );
  let pendingModal: ModalPendingObject = null;
  if (objectFromPending) {
    pendingModal =
      objectFromPending.kind === "pronoun"
        ? { kind: "pronoun", match: objectFromPending.match }
        : { kind: "noun", match: objectFromPending.match };
  }
  const modalPre = buildModalObjectSequencesFromPending(
    pendingModal,
    sourceLang
  );
  const modalPersons =
    state.lastSubject?.persons ?? expandInclusiveExclusive(modalMatch.persons);
  const modalAfter = collectModalObjectSequences(
    ir.tokens,
    modalMatch.objectStart,
    sourceLang,
    { reflexivePersons: modalPersons, reflexiveSubjectRepeat: true }
  );
  debugLog("[ridjin-debug] modalStandalone objects", {
    index,
    objectStart: modalMatch.objectStart,
    modalAfterConsumed: modalAfter.consumed,
    modalAfterSequences: modalAfter.sequences.map((seq) =>
      seq.map((part) => part.gup)
    ),
  });
  const modalObjectSequences = appendObjectSequences(
    modalPre.sequences,
    modalAfter.sequences
  );
  const modalSubjectParts = hasSubjectImmediate
    ? []
    : helpers.buildImpliedSubjectParts(
        modalPersons,
        state.lastSubject?.sourceToken
      );
  const modalBranches = helpers.buildModalBranches(
    modalMatch,
    modalSubjectParts,
    modalObjectSequences,
    false
  );
  if (modalBranches.length === 0) return { handled: false };

  let expanded: TranslationResult["combinations"] = [];
  for (const branch of modalBranches) {
    expanded = expanded.concat(
      helpers.appendPartsToCombinations(state.combinations, branch, "dropdown")
    );
  }
  if (expanded.length > 1) {
    const modalGroup = helpers.nextVariantGroup("dropdown");
    expanded = expanded.map((combo) => ({
      ...combo,
      variantGroup: combo.variantGroup?.scope === "box" ? combo.variantGroup : modalGroup,
    }));
  }
  if (modalBranches.length > 1) {
    state.hasAmbiguity = true;
  }
  state.combinations = expanded;
  const connectorAnchor = index + modalMatch.consumed - 1 + modalAfter.consumed;
  state.lastConnectorAnchor = connectorAnchor;
  const updatedPersons = expandInclusiveExclusive(modalMatch.persons);
  helpers.updateLastVerbSubject(
    updatedPersons.length > 0 ? updatedPersons : null,
    connectorAnchor,
    state.lastSubject?.sourceToken
  );
  return { handled: true, nextIndex: connectorAnchor };
}
