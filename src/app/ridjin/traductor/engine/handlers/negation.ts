import { LanguageMode } from "@/app/components/types/components.type";
import type {
  IRSentence,
  PersonNumber,
  TranslationPart,
  TranslationResult,
  VariantGroup,
} from "../../core/types";
import {
  matchObjectPronoun,
  ObjectPronounMatch,
} from "../../rules/objectPronoun";
import { matchVerbAt, matchPastParticipleAt, VerbMatch } from "../../rules/verb";
import { matchBecomeAt } from "../../logic/become";
import { matchMakeAdjAt } from "../../logic/makeAdj";
import { matchSubjectPronoun } from "../../rules/pronoun";
import { expandInclusiveExclusive } from "../../logic/subjects";
import { debugLog } from "../debug";
import {
  collectPastHabitualMarkerIndices,
  hasHabitualMarker,
  hasPastHabitualMarker,
  resolvePastHabitualPersons,
} from "../../logic/habitual";
import { hasMightMarker } from "../../logic/might";
import { hasShouldMarker, resolveShouldPersons } from "../../logic/should";
import {
  hasShouldHaveMarker,
  resolveShouldHavePersons,
} from "../../logic/shouldHave";
import {
  buildBranches,
  expandBranchesWithSubject,
  stripTrailingSequences,
} from "../../logic/branching";
import {
  appendObjectSequences,
  buildObjectSequencesFromPending,
  buildObjectSequencesFromMatch,
  collectObjectSequencesAfterVerb,
  filterComitativeHumanSequences,
  filterInstrumentalNonHumanSequences,
  matchAllativeMarkerAt,
  matchAllativePhraseAt,
  matchAblativePhraseAt,
  matchComitativePhraseAt,
  matchInstrumentalPhraseAt,
  matchIndirectPhraseAt,
  matchOriginPhraseAt,
  matchBelongingAboutPhraseAt,
  matchBelongingPurposePhraseAt,
  matchPurposeAmbiguousAltAt,
  matchCausePhraseAt,
  matchPurposePhraseAt,
  matchActVerbPhraseAt,
  matchTraversivePhraseAt,
  shouldAllowAboutLocativeAlt,
  matchLocativePhraseAt,
} from "../../logic/objects";
import {
  buildLocativePart,
  matchLocativeMarkerAt,
  resolveAllativeVerbEntry,
  resolveLocativeVerbEntry,
} from "../../logic/locative";
import { applySuffixToGup } from "../../logic/suffixes";
import { resolveFutureTimeContext, resolvePastTimeContext } from "../../logic/time";
import {
  createParticlePart,
  createVerbPart,
  finalizePart,
} from "../../logic/parts";
import {
  buildModalObjectSequencesFromPending,
  collectModalObjectSequences,
  matchModalSpecialAt,
} from "../../logic/modal";
import { matchAuxiliaryGerundAt, matchForcedAuxGerundAt } from "../../logic/verbAux";
import { DEFAULT_GERUND_PERSONS } from "../shared";
import type { TranslateHelpers, TranslateState } from "../types";
import type { NegationPattern } from "../../logic/negation";
import { matchNegationPattern } from "../../logic/negation";

export function handleNegation(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  negationPatterns: NegationPattern[];
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, negationPatterns, state, helpers } = args;
  let haveMirriStripSequences: TranslationPart[][] | null = null;
  const recordMirriStripSequences = (
    sequences: TranslationPart[][] | null
  ) => {
    if (!sequences || sequences.length === 0) return;
    if (!haveMirriStripSequences) {
      haveMirriStripSequences = [...sequences];
      return;
    }
    haveMirriStripSequences = [
      ...haveMirriStripSequences,
      ...sequences,
    ];
  };

  const negationMatch = matchNegationPattern(
    ir.tokens,
    index,
    sourceLang,
    negationPatterns
  );
  if (!negationMatch) return { handled: false };
  debugLog("negation:enter", {
    index,
    token: ir.tokens[index]?.source,
    sourceLang,
  });

  state.pendingSubjectJoin = false;
  const negatorSource = ir.tokens
    .slice(index, index + negationMatch.tokens.length)
    .map((token) => token.source)
    .join(" ");
  const pastHabitualIndices = new Set(
    collectPastHabitualMarkerIndices(ir.tokens, sourceLang)
  );
  const pastHabitualPersons = resolvePastHabitualPersons(ir.tokens, sourceLang);
  const hasShouldMarkerInSentence = hasShouldMarker(ir.tokens, sourceLang);
  const hasShouldHaveMarkerInSentence = hasShouldHaveMarker(
    ir.tokens,
    sourceLang
  );
  const isSubjectBeforeNegator = (negatorIndex: number): boolean => {
    if (!state.lastSubject) return false;
    const start = state.lastSubject.endIndex + 1;
    const end = negatorIndex - 1;
    if (start > end) return true;
    for (let i = start; i <= end; i += 1) {
      if (!state.skipIndices.has(i)) return false;
    }
    return true;
  };
  let verbIndex = index + negationMatch.tokens.length;
  debugLog("negation:verb-index", {
    verbIndex,
    verbToken: ir.tokens[verbIndex]?.source,
    sourceLang,
  });
  let objectBetween: ObjectPronounMatch | null = null;
  if (sourceLang === "es") {
    const candidate = ir.tokens[verbIndex];
    const possibleObject = candidate
      ? matchObjectPronoun(candidate.source, sourceLang)
      : null;
    if (possibleObject) {
      const verbAfter = matchVerbAt(ir.tokens, verbIndex + 1, sourceLang);
      const auxAfter = matchAuxiliaryGerundAt(
        ir.tokens,
        verbIndex + 1,
        sourceLang
      );
      if (verbAfter.length > 0 || auxAfter) {
        objectBetween = possibleObject;
        verbIndex += 1;
      }
    }
  }
  while (pastHabitualIndices.has(verbIndex)) {
    verbIndex += 1;
  }
  if (hasShouldMarkerInSentence || hasShouldHaveMarkerInSentence) {
    const hasVerbAtIndex =
      matchVerbAt(ir.tokens, verbIndex, sourceLang).length > 0 ||
      matchPastParticipleAt(ir.tokens, verbIndex, sourceLang).length > 0;
    if (!hasVerbAtIndex || state.skipIndices.has(verbIndex)) {
      for (let scan = verbIndex + 1; scan < ir.tokens.length; scan += 1) {
        if (state.skipIndices.has(scan)) continue;
        if (
          matchVerbAt(ir.tokens, scan, sourceLang).length > 0 ||
          matchPastParticipleAt(ir.tokens, scan, sourceLang).length > 0
        ) {
          verbIndex = scan;
          break;
        }
      }
    }
  }
  const auxGerund = negationMatch.forceAux
    ? matchForcedAuxGerundAt(
        ir.tokens,
        verbIndex,
        sourceLang,
        negationMatch.forceAux
      )
    : matchAuxiliaryGerundAt(ir.tokens, verbIndex, sourceLang);
  if (auxGerund) {
    const verbConsumed = auxGerund.gerundIndex - verbIndex + 1;
    const objectMatch = objectBetween ?? auxGerund.attachedObject;
    const allowNonHumanDemonstrative = Boolean(auxGerund.gerund.entry.isTransitive);
    const reflexivePersons = auxGerund.gerund.entry.isTransitive
      ? state.lastSubject?.persons
      : undefined;
    const reflexivePossessivePersons = state.lastSubject?.persons;
    const reflexivePossessiveOptions = {
      reflexivePersons: reflexivePossessivePersons,
      reflexiveSubjectRepeat: true,
    };
    const preObject = buildObjectSequencesFromPending(
      objectMatch ? { kind: "pronoun", match: objectMatch } : null,
      sourceLang,
      {
        allowNonHumanDemonstrative,
        reflexivePersons,
        reflexiveSubjectRepeat: true,
      }
    );
    const afterObjects = collectObjectSequencesAfterVerb(
      ir.tokens,
      auxGerund.gerundIndex + 1,
      sourceLang,
      {
        allowNonHumanDemonstrative,
        reflexivePersons,
        reflexiveSubjectRepeat: true,
      }
    );
    if (afterObjects.hasAmbiguity) {
      state.hasAmbiguity = true;
    }
    let objectSequences = appendObjectSequences(
      preObject.sequences,
      afterObjects.sequences
    );
    const originSequences = afterObjects.originSequences
      ? appendObjectSequences(preObject.sequences, afterObjects.originSequences)
      : null;
    const originHasAmbiguity = Boolean(afterObjects.originHasAmbiguity);
    let purposeSequences: TranslationPart[][] | null = null;
    let purposeHasAmbiguity = false;
    let causeSequences: TranslationPart[][] | null = null;
    let causeHasAmbiguity = false;
    let actVerbSequences: TranslationPart[][] | null = null;
    let actVerbHasAmbiguity = false;
    let belongingPurposeSequences: TranslationPart[][] | null = null;
    let belongingPurposeHasAmbiguity = false;
    let belongingAboutSequences: TranslationPart[][] | null = null;
    let belongingAboutHasAmbiguity = false;
    let aboutAltSequences: TranslationPart[][] | null = null;
    let aboutAltHasAmbiguity = false;
    let indirectSequences: TranslationPart[][] | null = null;
    let indirectHasAmbiguity = false;
    let instrumentalSequences: TranslationPart[][] | null = null;
    let instrumentalHasAmbiguity = false;
    const objectDropAmbiguity = preObject.hasDrop || afterObjects.hasDrop;
    let objectConsumed = afterObjects.consumed;
    let resolvedEntry = auxGerund.gerund.entry;
    let locativeMatch: ReturnType<typeof matchLocativeMarkerAt> | null = null;

    let modifierConsumed = 0;
    let searching = true;
    while (searching) {
      searching = false;
      let appliedInstrumental = false;
      const modifierIndex =
        auxGerund.gerundIndex + 1 + objectConsumed + modifierConsumed;
      const instrumentalPhrase = matchInstrumentalPhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      const instrumentalLead = instrumentalPhrase?.preposition.normalized
        .split(" ")
        .shift();
      const isConWithPrep =
        sourceLang === "es"
          ? instrumentalLead === "con"
          : instrumentalLead === "with";
      const applyInstrumentalPossessiveAlt = (baseSequences: TranslationPart[][]) => {
        if (!instrumentalPhrase?.possessiveAltSequences) return;
        const newSequences = appendObjectSequences(
          baseSequences,
          instrumentalPhrase.possessiveAltSequences
        );
        if (!instrumentalSequences) {
          instrumentalSequences = newSequences;
        } else {
          instrumentalSequences = [...instrumentalSequences, ...newSequences];
        }
        if (instrumentalPhrase.possessiveAltHasAmbiguity) {
          instrumentalHasAmbiguity = true;
        }
      };
      const applyInstrumentalAlt = (baseSequences: TranslationPart[][]) => {
        if (!instrumentalPhrase || instrumentalPhrase.isExclusive) return;
        if (isConWithPrep) return;
        if (appliedInstrumental) return;
        if (!instrumentalSequences) {
          instrumentalSequences = appendObjectSequences(
            baseSequences,
            instrumentalPhrase.sequences
          );
        } else {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            instrumentalPhrase.sequences
          );
        }
        if (instrumentalPhrase.hasAmbiguity) {
          instrumentalHasAmbiguity = true;
        }
        appliedInstrumental = true;
      };
      applyInstrumentalPossessiveAlt(objectSequences);
      if (instrumentalPhrase?.isExclusive) {
        objectSequences = appendObjectSequences(
          objectSequences,
          instrumentalPhrase.sequences
        );
        if (purposeSequences) {
          purposeSequences = appendObjectSequences(
            purposeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            instrumentalPhrase.sequences
          );
        }
        modifierConsumed += instrumentalPhrase.consumed;
        if (instrumentalPhrase.hasAmbiguity) {
          instrumentalHasAmbiguity = true;
        }
        searching = true;
        continue;
      }
      const indirectPhrase = matchIndirectPhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (indirectPhrase) {
        const baseSequences = objectSequences;
        const hasDirectObject = baseSequences.some((seq) => seq.length > 0);
        const normalized = indirectPhrase.preposition.normalized;
        const isToPreposition =
          (sourceLang === "es" && normalized === "a") ||
          (sourceLang === "en" && normalized === "to");
        const isForPreposition =
          (sourceLang === "es" && normalized === "para") ||
          (sourceLang === "en" && normalized === "for");
      if (isToPreposition && indirectPhrase.targetHumanity === "non-human") {
        // Non-human "a/to" should be handled as locative/allative, not IO.
      } else {
        applyInstrumentalAlt(baseSequences);
        const ioSequences = appendObjectSequences(
          baseSequences,
          indirectPhrase.sequences
        );

        if (
          isToPreposition &&
          !hasDirectObject &&
          indirectPhrase.directAltSequences
        ) {
          objectSequences = appendObjectSequences(
            baseSequences,
            indirectPhrase.directAltSequences
          );
          indirectSequences = ioSequences;
          indirectHasAmbiguity = true;
        } else {
          objectSequences = ioSequences;
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            indirectPhrase.sequences
          );
        }

        if (isForPreposition) {
          const purposePhrase = matchPurposePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang,
            reflexivePossessiveOptions
          );
          if (purposePhrase) {
            if (!purposeSequences) {
              purposeSequences = appendObjectSequences(
                baseSequences,
                purposePhrase.sequences
              );
            } else {
              purposeSequences = appendObjectSequences(
                purposeSequences,
                purposePhrase.sequences
              );
            }
            if (purposePhrase.hasAmbiguity) purposeHasAmbiguity = true;
          }
          const causePhrase = matchCausePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang
          );
          if (causePhrase) {
            if (!causeSequences) {
              causeSequences = appendObjectSequences(
                baseSequences,
                causePhrase.sequences
              );
            } else {
              causeSequences = appendObjectSequences(
                causeSequences,
                causePhrase.sequences
              );
            }
            if (causePhrase.hasAmbiguity) causeHasAmbiguity = true;
          }
          const belongingPurposePhrase = matchBelongingPurposePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang
          );
          if (belongingPurposePhrase) {
            if (!belongingPurposeSequences) {
              belongingPurposeSequences = appendObjectSequences(
                baseSequences,
                belongingPurposePhrase.sequences
              );
            } else {
              belongingPurposeSequences = appendObjectSequences(
                belongingPurposeSequences,
                belongingPurposePhrase.sequences
              );
            }
            if (belongingPurposePhrase.hasAmbiguity) {
              belongingPurposeHasAmbiguity = true;
            }
          }
        }

        modifierConsumed += indirectPhrase.consumed;
        if (indirectPhrase.hasAmbiguity) {
          indirectHasAmbiguity = true;
        }
        searching = true;
        continue;
      }
    }
    const hasMotionVerb = resolvedEntry.motionType === "motion";
    if (hasMotionVerb) {
      const traversivePhrase = matchTraversivePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      if (traversivePhrase) {
        const baseSequences = objectSequences;
        const purposeAlt = matchPurposePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (purposeAlt) {
          if (!purposeSequences) {
            purposeSequences = appendObjectSequences(
              baseSequences,
              purposeAlt.sequences
            );
          } else {
            purposeSequences = appendObjectSequences(
              purposeSequences,
              purposeAlt.sequences
            );
          }
          if (purposeAlt.hasAmbiguity) {
            purposeHasAmbiguity = true;
          }
        }
        const causeAlt = matchCausePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang
        );
        if (causeAlt) {
          if (!causeSequences) {
            causeSequences = appendObjectSequences(
              baseSequences,
              causeAlt.sequences
            );
          } else {
            causeSequences = appendObjectSequences(
              causeSequences,
              causeAlt.sequences
            );
          }
          if (causeAlt.hasAmbiguity) {
            causeHasAmbiguity = true;
          }
        }
        applyInstrumentalAlt(baseSequences);
        objectSequences = appendObjectSequences(
          baseSequences,
          traversivePhrase.sequences
        );
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            traversivePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            traversivePhrase.sequences
          );
        }
        modifierConsumed += traversivePhrase.consumed;
        if (traversivePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }
    }
    const purposePhrase = matchPurposePhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
    const causePhrase = matchCausePhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang
    );
    debugLog("cause:scan", {
      index: modifierIndex,
      token: ir.tokens[modifierIndex]?.source,
      next: ir.tokens[modifierIndex + 1]?.source,
      purpose: Boolean(purposePhrase),
      cause: Boolean(causePhrase),
      sourceLang,
    });
    if (!purposePhrase && causePhrase) {
      objectSequences = appendObjectSequences(
        objectSequences,
        causePhrase.sequences
      );
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(
          indirectSequences,
          causePhrase.sequences
        );
      }
      if (instrumentalSequences && !instrumentalPhrase) {
        instrumentalSequences = appendObjectSequences(
          instrumentalSequences,
          causePhrase.sequences
        );
      }
      modifierConsumed += causePhrase.consumed;
      if (causePhrase.hasAmbiguity) {
        causeHasAmbiguity = true;
      }
      searching = true;
      continue;
    }
    if (purposePhrase) {
      if (causePhrase) {
        if (!causeSequences) {
          causeSequences = appendObjectSequences(
            objectSequences,
            causePhrase.sequences
          );
        } else {
          causeSequences = appendObjectSequences(
            causeSequences,
            causePhrase.sequences
          );
        }
        if (causePhrase.hasAmbiguity) {
          causeHasAmbiguity = true;
        }
      }
      const belongingPurposePhrase = matchBelongingPurposePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      if (belongingPurposePhrase) {
        if (!belongingPurposeSequences) {
          belongingPurposeSequences = appendObjectSequences(
            objectSequences,
            belongingPurposePhrase.sequences
          );
        } else {
          belongingPurposeSequences = appendObjectSequences(
            belongingPurposeSequences,
            belongingPurposePhrase.sequences
          );
        }
        if (belongingPurposePhrase.hasAmbiguity) {
          belongingPurposeHasAmbiguity = true;
        }
      }
      applyInstrumentalAlt(objectSequences);
      const hasMotionVerb = resolvedEntry.motionType === "motion";
      const purposeAlt =
        purposePhrase.targetHumanity !== "human"
          ? matchPurposeAmbiguousAltAt(
              ir.tokens,
              modifierIndex,
              sourceLang,
              purposePhrase.preposition,
              hasMotionVerb,
              reflexivePossessiveOptions
            )
          : null;
      if (purposeAlt) {
        if (!purposeSequences) {
          purposeSequences = appendObjectSequences(
            objectSequences,
            purposeAlt.sequences
          );
        }
        objectSequences = appendObjectSequences(
          objectSequences,
          purposePhrase.sequences
        );
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            purposePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            purposePhrase.sequences
          );
        }
        modifierConsumed += purposePhrase.consumed;
        if (purposePhrase.hasAmbiguity) {
          purposeHasAmbiguity = true;
        }
        if (purposeAlt.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }
      applyInstrumentalAlt(objectSequences);
      const originPhrase =
        resolvedEntry.motionType !== "motion"
          ? matchOriginPhraseAt(
              ir.tokens,
              modifierIndex,
              sourceLang,
              reflexivePossessiveOptions
            )
          : null;
      if (originPhrase) {
        if (!purposeSequences) {
          purposeSequences = appendObjectSequences(
            objectSequences,
            originPhrase.sequences
          );
        } else {
          purposeSequences = appendObjectSequences(
            purposeSequences,
            originPhrase.sequences
          );
        }
        objectSequences = appendObjectSequences(
          objectSequences,
          purposePhrase.sequences
        );
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            purposePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            purposePhrase.sequences
          );
        }
        if (purposePhrase.hasAmbiguity) purposeHasAmbiguity = true;
        modifierConsumed += originPhrase.consumed;
        if (originPhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }
      const comitativePhrase = matchComitativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (comitativePhrase) {
        if (!purposeSequences) {
          purposeSequences = appendObjectSequences(
            objectSequences,
            purposePhrase.sequences
          );
          if (purposePhrase.hasAmbiguity) purposeHasAmbiguity = true;
        }
        objectSequences = appendObjectSequences(
          objectSequences,
          comitativePhrase.sequences
        );
      if (purposeSequences) {
        purposeSequences = appendObjectSequences(
          purposeSequences,
          comitativePhrase.sequences
        );
      }
      if (causeSequences) {
        causeSequences = appendObjectSequences(
          causeSequences,
          comitativePhrase.sequences
        );
      }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            comitativePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            comitativePhrase.sequences
          );
        }
        modifierConsumed += comitativePhrase.consumed;
        if (comitativePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }
      objectSequences = appendObjectSequences(
        objectSequences,
        purposePhrase.sequences
      );
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(
          indirectSequences,
          purposePhrase.sequences
        );
      }
      if (instrumentalSequences && !instrumentalPhrase) {
        instrumentalSequences = appendObjectSequences(
          instrumentalSequences,
          purposePhrase.sequences
        );
      }
      modifierConsumed += purposePhrase.consumed;
      if (purposePhrase.hasAmbiguity) {
        state.hasAmbiguity = true;
      }
      searching = true;
      continue;
    }

    const belongingAboutPhrase = matchBelongingAboutPhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang
    );
    if (belongingAboutPhrase) {
      if (!belongingAboutSequences) {
        belongingAboutSequences = appendObjectSequences(
          objectSequences,
          belongingAboutPhrase.sequences
        );
      } else {
        belongingAboutSequences = appendObjectSequences(
          belongingAboutSequences,
          belongingAboutPhrase.sequences
        );
      }
      if (belongingAboutPhrase.hasAmbiguity) {
        belongingAboutHasAmbiguity = true;
      }
      if (shouldAllowAboutLocativeAlt(belongingAboutPhrase.preposition, sourceLang)) {
        const locativeAlt = matchLocativePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (locativeAlt) {
          const altSeq = appendObjectSequences(objectSequences, locativeAlt.sequences);
          aboutAltSequences = aboutAltSequences
            ? [...aboutAltSequences, ...altSeq]
            : altSeq;
          if (locativeAlt.hasAmbiguity) {
            aboutAltHasAmbiguity = true;
          }
        }
        const ablativeAlt = matchAblativePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (ablativeAlt) {
          const altSeq = appendObjectSequences(objectSequences, ablativeAlt.sequences);
          aboutAltSequences = aboutAltSequences
            ? [...aboutAltSequences, ...altSeq]
            : altSeq;
          if (ablativeAlt.hasAmbiguity) {
            aboutAltHasAmbiguity = true;
          }
        }
      }
      modifierConsumed += belongingAboutPhrase.consumed;
      searching = true;
      continue;
    }

      if (resolvedEntry.motionType !== "motion") {
        const originPhrase = matchOriginPhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (originPhrase) {
          objectSequences = appendObjectSequences(
            objectSequences,
            originPhrase.sequences
          );
          if (purposeSequences) {
            purposeSequences = appendObjectSequences(
              purposeSequences,
              originPhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              originPhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              originPhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              originPhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              originPhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              originPhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              originPhrase.sequences
            );
          }
          if (indirectSequences) {
            indirectSequences = appendObjectSequences(
              indirectSequences,
              originPhrase.sequences
            );
          }
          if (instrumentalSequences && !instrumentalPhrase) {
            instrumentalSequences = appendObjectSequences(
              instrumentalSequences,
              originPhrase.sequences
            );
          }
          modifierConsumed += originPhrase.consumed;
          if (originPhrase.hasAmbiguity) {
            state.hasAmbiguity = true;
          }
        searching = true;
        continue;
      }
    }
    if (instrumentalPhrase && isConWithPrep) {
      const baseSequences = objectSequences;
      const comitativeAlt = matchComitativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      let mainSequences = instrumentalPhrase.sequences;
      if (instrumentalPhrase.targetHumanity === "human" && comitativeAlt) {
        objectSequences = appendObjectSequences(baseSequences, comitativeAlt.sequences);
        const newSequences = appendObjectSequences(
          baseSequences,
          instrumentalPhrase.sequences
        );
        if (!instrumentalSequences) {
          instrumentalSequences = newSequences;
        } else {
          instrumentalSequences = [...instrumentalSequences, ...newSequences];
        }
        if (instrumentalPhrase.hasAmbiguity) {
          instrumentalHasAmbiguity = true;
        }
        mainSequences = comitativeAlt.sequences;
      } else {
        if (instrumentalPhrase.targetHumanity === "ambiguous" && comitativeAlt) {
          const comitativeHumanSequences = filterComitativeHumanSequences(
            comitativeAlt.sequences
          );
          if (comitativeHumanSequences.length > 0) {
            const newSequences = appendObjectSequences(
              baseSequences,
              comitativeHumanSequences
            );
            if (!instrumentalSequences) {
              instrumentalSequences = newSequences;
            } else {
              instrumentalSequences = [...instrumentalSequences, ...newSequences];
            }
          }
          if (comitativeAlt.hasAmbiguity) {
            instrumentalHasAmbiguity = true;
          }
        }
        if (instrumentalPhrase.targetHumanity === "ambiguous") {
          const nonHumanMain = filterInstrumentalNonHumanSequences(
            instrumentalPhrase.sequences
          );
          if (nonHumanMain.length > 0) {
            mainSequences = nonHumanMain;
          }
        }
        objectSequences = appendObjectSequences(baseSequences, mainSequences);
      }
      if (purposeSequences) {
        purposeSequences = appendObjectSequences(purposeSequences, mainSequences);
      }
      if (causeSequences) {
        causeSequences = appendObjectSequences(causeSequences, mainSequences);
      }
      if (causeSequences) {
        causeSequences = appendObjectSequences(causeSequences, mainSequences);
      }
      if (causeSequences) {
        causeSequences = appendObjectSequences(causeSequences, mainSequences);
      }
      if (causeSequences) {
        causeSequences = appendObjectSequences(causeSequences, mainSequences);
      }
      if (causeSequences) {
        causeSequences = appendObjectSequences(causeSequences, mainSequences);
      }
      if (causeSequences) {
        causeSequences = appendObjectSequences(causeSequences, mainSequences);
      }
      if (causeSequences) {
        causeSequences = appendObjectSequences(causeSequences, mainSequences);
      }
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(indirectSequences, mainSequences);
      }
      modifierConsumed += instrumentalPhrase.consumed;
      if (instrumentalPhrase.hasAmbiguity) {
        instrumentalHasAmbiguity = true;
      }
      searching = true;
      continue;
    }
    applyInstrumentalAlt(objectSequences);
    const comitativePhrase = matchComitativePhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
      if (comitativePhrase) {
        objectSequences = appendObjectSequences(
          objectSequences,
          comitativePhrase.sequences
        );
        if (purposeSequences) {
          purposeSequences = appendObjectSequences(
            purposeSequences,
            comitativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            comitativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            comitativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            comitativePhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            comitativePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            comitativePhrase.sequences
          );
        }
        modifierConsumed += comitativePhrase.consumed;
        if (comitativePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }

      const allativePhrase = matchAllativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (allativePhrase) {
        objectSequences = appendObjectSequences(
          objectSequences,
          allativePhrase.sequences
        );
        if (purposeSequences) {
          purposeSequences = appendObjectSequences(
            purposeSequences,
            allativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            allativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            allativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            allativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            allativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            allativePhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            allativePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            allativePhrase.sequences
          );
        }
        modifierConsumed += allativePhrase.consumed;
        if (allativePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        resolvedEntry = resolveAllativeVerbEntry(resolvedEntry);
        searching = true;
        continue;
      }

      if (resolvedEntry.motionType === "motion") {
        const ablativePhrase = matchAblativePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (ablativePhrase) {
          objectSequences = appendObjectSequences(
            objectSequences,
            ablativePhrase.sequences
          );
          if (purposeSequences) {
            purposeSequences = appendObjectSequences(
              purposeSequences,
              ablativePhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              ablativePhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              ablativePhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              ablativePhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              ablativePhrase.sequences
            );
          }
          if (indirectSequences) {
            indirectSequences = appendObjectSequences(
              indirectSequences,
              ablativePhrase.sequences
            );
          }
          if (instrumentalSequences && !instrumentalPhrase) {
            instrumentalSequences = appendObjectSequences(
              instrumentalSequences,
              ablativePhrase.sequences
            );
          }
          modifierConsumed += ablativePhrase.consumed;
          if (ablativePhrase.hasAmbiguity) {
            state.hasAmbiguity = true;
          }
          searching = true;
          continue;
      }
    }

      const actVerbPhrase = matchActVerbPhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      if (actVerbPhrase) {
        const baseSequences = objectSequences;
        if (!actVerbSequences) {
          actVerbSequences = appendObjectSequences(
            baseSequences,
            actVerbPhrase.sequences
          );
        } else {
          actVerbSequences = appendObjectSequences(
            actVerbSequences,
            actVerbPhrase.sequences
          );
        }
        if (actVerbPhrase.hasAmbiguity) {
          actVerbHasAmbiguity = true;
        }
        modifierConsumed += actVerbPhrase.consumed;
        searching = true;
        continue;
      }

      const locativePhrase = matchLocativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (locativePhrase) {
        recordMirriStripSequences(locativePhrase.sequences);
        objectSequences = appendObjectSequences(
          objectSequences,
          locativePhrase.sequences
        );
        if (purposeSequences) {
          purposeSequences = appendObjectSequences(
            purposeSequences,
            locativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            locativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            locativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            locativePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            locativePhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            locativePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            locativePhrase.sequences
          );
        }
        modifierConsumed += locativePhrase.consumed;
        if (locativePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }

      locativeMatch = matchLocativeMarkerAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      if (locativeMatch) {
        if (resolvedEntry.motionType === "motion") {
          const allativeMarker = matchAllativeMarkerAt(
            ir.tokens,
            modifierIndex,
            sourceLang
          );
          if (allativeMarker) {
            objectSequences = objectSequences.map((seq) => [
              ...seq,
              allativeMarker.part,
            ]);
            if (purposeSequences) {
              purposeSequences = purposeSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
            if (causeSequences) {
              causeSequences = causeSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
            if (causeSequences) {
              causeSequences = causeSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
            if (causeSequences) {
              causeSequences = causeSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
            if (indirectSequences) {
              indirectSequences = indirectSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
            if (instrumentalSequences) {
              instrumentalSequences = instrumentalSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
            modifierConsumed += allativeMarker.consumed;
            resolvedEntry = resolveAllativeVerbEntry(resolvedEntry);
            searching = true;
            continue;
          }
        }
        const locativePart = buildLocativePart(locativeMatch, sourceLang);
        objectSequences = objectSequences.map((seq) => [...seq, locativePart]);
        if (purposeSequences) {
          purposeSequences = purposeSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
        if (causeSequences) {
          causeSequences = causeSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
        if (causeSequences) {
          causeSequences = causeSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
        if (causeSequences) {
          causeSequences = causeSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
        if (indirectSequences) {
          indirectSequences = indirectSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
        if (instrumentalSequences) {
          instrumentalSequences = instrumentalSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
        modifierConsumed += locativeMatch.consumed;
        searching = true;
      }
    if (!searching && instrumentalPhrase && !instrumentalPhrase.isExclusive) {
      objectSequences = appendObjectSequences(
        objectSequences,
        instrumentalPhrase.sequences
      );
        if (purposeSequences) {
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
          purposeSequences = appendObjectSequences(
            purposeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            instrumentalPhrase.sequences
          );
        }
        modifierConsumed += instrumentalPhrase.consumed;
      if (instrumentalPhrase.hasAmbiguity) {
        instrumentalHasAmbiguity = true;
      }
      searching = true;
    }
  }
  objectConsumed += modifierConsumed;
    objectConsumed += modifierConsumed;

    resolvedEntry = resolveLocativeVerbEntry(resolvedEntry, locativeMatch);
    const gerundMatch =
      resolvedEntry === auxGerund.gerund.entry
        ? auxGerund.gerund
        : { ...auxGerund.gerund, entry: resolvedEntry };

    const hasSubjectBeforeNegator = isSubjectBeforeNegator(index);
    helpers.maybeApplyAgentSuffix(
      gerundMatch.entry.isTransitive,
      Boolean(hasSubjectBeforeNegator)
    );

    const modalMatch =
      negationMatch.allowsPresent
        ? matchModalSpecialAt(ir.tokens, verbIndex, sourceLang)
        : null;
    let modalBranches: TranslationPart[][] = [];
    let modalObjectConsumed = 0;

    if (modalMatch) {
      const modalPre = buildModalObjectSequencesFromPending(
        objectBetween ? { kind: "pronoun", match: objectBetween } : null,
        sourceLang
      );
      const modalPersons =
        state.lastSubject?.persons ?? expandInclusiveExclusive(modalMatch.persons);
      const modalAfter = collectModalObjectSequences(
        ir.tokens,
        verbIndex + modalMatch.consumed,
        sourceLang,
        { reflexivePersons: modalPersons, reflexiveSubjectRepeat: true }
      );
      modalObjectConsumed = modalAfter.consumed;
      const modalObjectSequences = appendObjectSequences(
        modalPre.sequences,
        modalAfter.sequences
      );
      const modalSubjectParts = hasSubjectBeforeNegator
        ? []
        : helpers.buildImpliedSubjectParts(
            modalPersons,
            state.lastSubject?.sourceToken
          );
      modalBranches = helpers.buildModalBranches(
        modalMatch,
        modalSubjectParts,
        modalObjectSequences,
        true,
        negatorSource
      );
    }

    const personsFromAux = auxGerund.auxInfo.persons;
    const lastSubjectPersons = helpers.getSubjectPersons(state.lastSubject);
    const lastVerbPersons = helpers.getSubjectPersons(state.lastVerbSubject);
    const inferredPersons =
      lastSubjectPersons
        ? expandInclusiveExclusive(lastSubjectPersons)
        : personsFromAux.length > 0
          ? personsFromAux
          : lastVerbPersons ?? DEFAULT_GERUND_PERSONS;
    const subjectParts = hasSubjectBeforeNegator
      ? []
      : helpers.buildImpliedSubjectParts(
          inferredPersons,
          state.lastSubject?.sourceToken
        );

    if (auxGerund.auxInfo.tense === "past") {
      const timeContext = resolvePastTimeContext(
        ir.tokens,
        auxGerund.gerundIndex,
        sourceLang,
        state.skipIndices
      );
      const buildPastNegParts = (
        kind: "same-day" | "yesterday",
        includeMarker: boolean
      ): TranslationPart[] => {
        const parts: TranslationPart[] = [];
        parts.push(...subjectParts);
        if (kind === "same-day") {
          parts.push(
            createParticlePart(
              "gana",
              sourceLang,
              "VERB_PARTICLE_PAST_PROGRESSIVE"
            )
          );
        }
        parts.push(
          createParticlePart(
            "yaka",
            sourceLang,
            "VERB_NEGATOR",
            ["bäyŋu"],
            negatorSource
          )
        );
        if (kind === "yesterday") {
          parts.push(
            createParticlePart("gi", sourceLang, "VERB_PARTICLE_NEG")
          );
        }
        const gup =
          kind === "same-day"
            ? gerundMatch.entry.gupForms[2] ?? gerundMatch.entry.gup
            : gerundMatch.entry.gupForms[1] ?? gerundMatch.entry.gup;
        const explanationKey =
          kind === "same-day"
            ? "VERB_PAST_SAME_DAY_PROGRESSIVE_NEG"
            : "VERB_PAST_YESTERDAY_PROGRESSIVE_NEG";
        parts.push(createVerbPart(gerundMatch, sourceLang, gup, explanationKey));
        return parts;
      };

      const sameDayBranches: TranslationPart[][] = [];
      const yesterdayBranches: TranslationPart[][] = [];
      const pastHabitualBranches: TranslationPart[][] = [];
      const pastHabitualTrigger = hasPastHabitualMarker(ir.tokens, sourceLang);
      const buildPastHabitualNegBranches = (match: VerbMatch) => {
        const basePersons =
          state.lastSubject?.persons ??
          pastHabitualPersons ??
          match.personNumbers;
        const persons =
          basePersons.length > 0 ? expandInclusiveExclusive(basePersons) : [];
        const subjectParts = hasSubjectBeforeNegator
          ? []
          : helpers.buildImpliedSubjectParts(
              state.lastSubject?.persons ?? persons,
              state.lastSubject?.sourceToken
            );
        const negatorPart = createParticlePart(
          "yaka",
          sourceLang,
          "VERB_NEGATOR",
          ["bäyŋu"],
          negatorSource
        );
        const habitualPart = createParticlePart(
          "ŋuli",
          sourceLang,
          "VERB_PARTICLE_HABITUAL"
        );
        const ganhaPart = createParticlePart(
          "ganha",
          sourceLang,
          "VERB_PARTICLE_PAST_HABITUAL"
        );
        const verbForms: Array<{ gup: string; alt?: string }> = [];
        const gup3 = match.entry.gupForms[3];
        const gup4 = match.entry.gupForms[4];
        if (gup3) {
          verbForms.push({ gup: gup3, alt: match.altGupForms?.[3] });
        }
        if (gup4) {
          verbForms.push({ gup: gup4, alt: match.altGupForms?.[4] });
        }
        for (const form of verbForms) {
          const verbPart = createVerbPart(
            match,
            sourceLang,
            form.gup,
            "VERB_PAST_HABITUAL_NEG",
            form.alt ? [form.alt] : undefined
          );
          const baseParts: TranslationPart[] = [
            ...subjectParts,
            negatorPart,
            habitualPart,
            verbPart,
          ];
          const ganaParts: TranslationPart[] = [
            ...subjectParts,
            negatorPart,
            habitualPart,
            ganhaPart,
            verbPart,
          ];
          pastHabitualBranches.push(
            ...buildBranches(baseParts, objectSequences)
          );
          pastHabitualBranches.push(
            ...buildBranches(ganaParts, objectSequences)
          );
        }
      };
      const partsSame = buildPastNegParts("same-day", false);
      const partsYest = buildPastNegParts("yesterday", false);
      sameDayBranches.push(...buildBranches(partsSame, objectSequences));
      yesterdayBranches.push(...buildBranches(partsYest, objectSequences));
      const purposeSameDayPastBranches = purposeSequences
        ? buildBranches(partsSame, purposeSequences)
        : [];
      const purposeYesterdayPastBranches = purposeSequences
        ? buildBranches(partsYest, purposeSequences)
        : [];
      const causeSameDayPastBranches = causeSequences
        ? buildBranches(partsSame, causeSequences)
        : [];
      const causeYesterdayPastBranches = causeSequences
        ? buildBranches(partsYest, causeSequences)
        : [];
      const actVerbSameDayPastBranches = actVerbSequences
        ? buildBranches(partsSame, actVerbSequences)
        : [];
      const actVerbYesterdayPastBranches = actVerbSequences
        ? buildBranches(partsYest, actVerbSequences)
        : [];
      const indirectSameDayPastBranches = indirectSequences
        ? buildBranches(partsSame, indirectSequences)
        : [];
      const indirectYesterdayPastBranches = indirectSequences
        ? buildBranches(partsYest, indirectSequences)
        : [];

      const expandPastBranches = (
        branchList: TranslationPart[][],
        groupId?: VariantGroup
      ): TranslationResult["combinations"] => {
        const baseGroupId = objectDropAmbiguity
          ? helpers.nextVariantGroup("dropdown")
          : null;
        const variantGroup = groupId ?? baseGroupId ?? null;
        return expandBranchesWithSubject(branchList, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-marker",
          variantGroup,
        });
      };

      if (timeContext === "today") {
        const expanded = expandPastBranches(sameDayBranches);
        const expandedPurpose =
          purposeSameDayPastBranches.length > 0
            ? expandPastBranches(
                purposeSameDayPastBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeSameDayPastBranches.length > 0
            ? expandPastBranches(
                causeSameDayPastBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbSameDayPastBranches.length > 0
            ? expandPastBranches(
                actVerbSameDayPastBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedIndirect =
          indirectSameDayPastBranches.length > 0
            ? expandPastBranches(
                indirectSameDayPastBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        if (expanded.length > 0) {
          state.combinations = [
            ...expanded,
            ...expandedCause,
            ...expandedPurpose,
            ...expandedActVerb,
            ...expandedIndirect,
          ];
          if (
            expandedPurpose.length > 0 ||
            expandedCause.length > 0 ||
            expandedActVerb.length > 0 ||
            expandedIndirect.length > 0 ||
            purposeHasAmbiguity ||
            causeHasAmbiguity ||
            actVerbHasAmbiguity ||
            indirectHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          const connectorAnchor = verbIndex + verbConsumed - 1 + objectConsumed;
          state.lastConnectorAnchor = connectorAnchor;
          helpers.updateLastVerbSubject(
            inferredPersons,
            connectorAnchor,
            state.lastSubject?.sourceToken
          );
          return { handled: true, nextIndex: connectorAnchor };
        }
      } else if (timeContext === "yesterday") {
        const expanded = expandPastBranches(yesterdayBranches);
        const expandedPurpose =
          purposeYesterdayPastBranches.length > 0
            ? expandPastBranches(
                purposeYesterdayPastBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeYesterdayPastBranches.length > 0
            ? expandPastBranches(
                causeYesterdayPastBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbYesterdayPastBranches.length > 0
            ? expandPastBranches(
                actVerbYesterdayPastBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedIndirect =
          indirectYesterdayPastBranches.length > 0
            ? expandPastBranches(
                indirectYesterdayPastBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        if (expanded.length > 0) {
          state.combinations = [
            ...expanded,
            ...expandedCause,
            ...expandedPurpose,
            ...expandedActVerb,
            ...expandedIndirect,
          ];
          if (
            expandedPurpose.length > 0 ||
            expandedCause.length > 0 ||
            expandedActVerb.length > 0 ||
            expandedIndirect.length > 0 ||
            purposeHasAmbiguity ||
            causeHasAmbiguity ||
            actVerbHasAmbiguity ||
            indirectHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          const connectorAnchor = verbIndex + verbConsumed - 1 + objectConsumed;
          state.lastConnectorAnchor = connectorAnchor;
          helpers.updateLastVerbSubject(
            inferredPersons,
            connectorAnchor,
            state.lastSubject?.sourceToken
          );
          return { handled: true, nextIndex: connectorAnchor };
        }
      } else {
        const sameDayGroup: VariantGroup = helpers.nextVariantGroup("box");
        const yesterdayGroup: VariantGroup = helpers.nextVariantGroup("box");
        const expandedSame = expandPastBranches(sameDayBranches, sameDayGroup);
        const expandedYesterday = expandPastBranches(
          yesterdayBranches,
          yesterdayGroup
        );
        const purposeAllBranches = [
          ...purposeSameDayPastBranches,
          ...purposeYesterdayPastBranches,
        ];
        const causeAllBranches = [
          ...causeSameDayPastBranches,
          ...causeYesterdayPastBranches,
        ];
        const actVerbAllBranches = [
          ...actVerbSameDayPastBranches,
          ...actVerbYesterdayPastBranches,
        ];
        const expandedPurpose =
          purposeAllBranches.length > 0
            ? expandPastBranches(
                purposeAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeAllBranches.length > 0
            ? expandPastBranches(causeAllBranches, helpers.nextVariantGroup("box"))
            : [];
        const expandedActVerb =
          actVerbAllBranches.length > 0
            ? expandPastBranches(
                actVerbAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const indirectAllBranches = [
          ...indirectSameDayPastBranches,
          ...indirectYesterdayPastBranches,
        ];
        const expandedIndirect =
          indirectAllBranches.length > 0
            ? expandPastBranches(
                indirectAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        state.combinations = [
          ...expandedSame,
          ...expandedYesterday,
          ...expandedCause,
          ...expandedPurpose,
          ...expandedActVerb,
          ...expandedIndirect,
        ];
        if (expandedSame.length > 0 || expandedYesterday.length > 0) {
          state.hasAmbiguity = true;
          const connectorAnchor = verbIndex + verbConsumed - 1 + objectConsumed;
          state.lastConnectorAnchor = connectorAnchor;
          helpers.updateLastVerbSubject(
            inferredPersons,
            connectorAnchor,
            state.lastSubject?.sourceToken
          );
          return { handled: true, nextIndex: connectorAnchor };
        }
      }
    }
    if (auxGerund.auxInfo.tense === "future") {
      const timeContext = resolveFutureTimeContext(
        ir.tokens,
        auxGerund.gerundIndex,
        sourceLang,
        state.skipIndices
      );
      const buildFutureNegParts = (
        kind: "same-day" | "tomorrow"
      ): TranslationPart[] => {
        const parts: TranslationPart[] = [];
        parts.push(...subjectParts);
        parts.push(
          createParticlePart("dhu", sourceLang, "VERB_PARTICLE_FUTURE", [
            "yurru",
          ])
        );
        const progressiveParticle = kind === "same-day" ? "ga" : "gi";
        parts.push(
          createParticlePart(
            progressiveParticle,
            sourceLang,
            "VERB_PARTICLE_FUTURE_PROGRESSIVE"
          )
        );
        parts.push(
          createParticlePart(
            "yaka",
            sourceLang,
            "VERB_NEGATOR",
            ["bäyŋu"],
            negatorSource
          )
        );
        const gup =
          kind === "same-day"
            ? gerundMatch.entry.gupForms[0] ?? gerundMatch.entry.gup
            : gerundMatch.entry.gupForms[1] ?? gerundMatch.entry.gup;
        const explanationKey =
          kind === "same-day"
            ? "VERB_FUTURE_SAME_DAY_PROGRESSIVE_NEG"
            : "VERB_FUTURE_TOMORROW_PROGRESSIVE_NEG";
        parts.push(createVerbPart(gerundMatch, sourceLang, gup, explanationKey));
        return parts;
      };

      const sameDayBranches: TranslationPart[][] = [];
      const tomorrowBranches: TranslationPart[][] = [];
      const partsSame = buildFutureNegParts("same-day");
      const partsTomorrow = buildFutureNegParts("tomorrow");
      sameDayBranches.push(...buildBranches(partsSame, objectSequences));
      tomorrowBranches.push(...buildBranches(partsTomorrow, objectSequences));
      const purposeSameDayFutureBranches = purposeSequences
        ? buildBranches(partsSame, purposeSequences)
        : [];
      const purposeTomorrowFutureBranches = purposeSequences
        ? buildBranches(partsTomorrow, purposeSequences)
        : [];
      const causeSameDayFutureBranches = causeSequences
        ? buildBranches(partsSame, causeSequences)
        : [];
      const causeTomorrowFutureBranches = causeSequences
        ? buildBranches(partsTomorrow, causeSequences)
        : [];
      const actVerbSameDayFutureBranches = actVerbSequences
        ? buildBranches(partsSame, actVerbSequences)
        : [];
      const actVerbTomorrowFutureBranches = actVerbSequences
        ? buildBranches(partsTomorrow, actVerbSequences)
        : [];
      const indirectSameDayFutureBranches = indirectSequences
        ? buildBranches(partsSame, indirectSequences)
        : [];
      const indirectTomorrowFutureBranches = indirectSequences
        ? buildBranches(partsTomorrow, indirectSequences)
        : [];

      const expandFutureBranches = (
        branchList: TranslationPart[][],
        groupId?: VariantGroup
      ): TranslationResult["combinations"] => {
        const baseGroupId = objectDropAmbiguity
          ? helpers.nextVariantGroup("dropdown")
          : null;
        const variantGroup = groupId ?? baseGroupId ?? null;
        return expandBranchesWithSubject(branchList, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "start",
          variantGroup,
        });
      };

      if (timeContext === "same-day") {
        const expanded = expandFutureBranches(sameDayBranches);
        const expandedPurpose =
          purposeSameDayFutureBranches.length > 0
            ? expandFutureBranches(
                purposeSameDayFutureBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeSameDayFutureBranches.length > 0
            ? expandFutureBranches(
                causeSameDayFutureBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbSameDayFutureBranches.length > 0
            ? expandFutureBranches(
                actVerbSameDayFutureBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedIndirect =
          indirectSameDayFutureBranches.length > 0
            ? expandFutureBranches(
                indirectSameDayFutureBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        if (expanded.length > 0) {
          state.combinations = [
            ...expanded,
            ...expandedCause,
            ...expandedPurpose,
            ...expandedActVerb,
            ...expandedIndirect,
          ];
          if (
            expandedPurpose.length > 0 ||
            expandedCause.length > 0 ||
            expandedActVerb.length > 0 ||
            expandedIndirect.length > 0 ||
            purposeHasAmbiguity ||
            causeHasAmbiguity ||
            actVerbHasAmbiguity ||
            indirectHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          const connectorAnchor = verbIndex + verbConsumed - 1 + objectConsumed;
          state.lastConnectorAnchor = connectorAnchor;
          helpers.updateLastVerbSubject(
            inferredPersons,
            connectorAnchor,
            state.lastSubject?.sourceToken
          );
          return { handled: true, nextIndex: connectorAnchor };
        }
      } else if (timeContext === "tomorrow") {
        const expanded = expandFutureBranches(tomorrowBranches);
        const expandedPurpose =
          purposeTomorrowFutureBranches.length > 0
            ? expandFutureBranches(
                purposeTomorrowFutureBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeTomorrowFutureBranches.length > 0
            ? expandFutureBranches(
                causeTomorrowFutureBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbTomorrowFutureBranches.length > 0
            ? expandFutureBranches(
                actVerbTomorrowFutureBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedIndirect =
          indirectTomorrowFutureBranches.length > 0
            ? expandFutureBranches(
                indirectTomorrowFutureBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        if (expanded.length > 0) {
          state.combinations = [
            ...expanded,
            ...expandedCause,
            ...expandedPurpose,
            ...expandedActVerb,
            ...expandedIndirect,
          ];
          if (
            expandedPurpose.length > 0 ||
            expandedCause.length > 0 ||
            expandedActVerb.length > 0 ||
            expandedIndirect.length > 0 ||
            purposeHasAmbiguity ||
            causeHasAmbiguity ||
            actVerbHasAmbiguity ||
            indirectHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          const connectorAnchor = verbIndex + verbConsumed - 1 + objectConsumed;
          state.lastConnectorAnchor = connectorAnchor;
          helpers.updateLastVerbSubject(
            inferredPersons,
            connectorAnchor,
            state.lastSubject?.sourceToken
          );
          return { handled: true, nextIndex: connectorAnchor };
        }
      } else {
        const sameDayGroup: VariantGroup = helpers.nextVariantGroup("box");
        const tomorrowGroup: VariantGroup = helpers.nextVariantGroup("box");
        const expandedSame = expandFutureBranches(
          sameDayBranches,
          sameDayGroup
        );
        const expandedTomorrow = expandFutureBranches(
          tomorrowBranches,
          tomorrowGroup
        );
        const purposeAllBranches = [
          ...purposeSameDayFutureBranches,
          ...purposeTomorrowFutureBranches,
        ];
        const causeAllBranches = [
          ...causeSameDayFutureBranches,
          ...causeTomorrowFutureBranches,
        ];
        const actVerbAllBranches = [
          ...actVerbSameDayFutureBranches,
          ...actVerbTomorrowFutureBranches,
        ];
        const expandedPurpose =
          purposeAllBranches.length > 0
            ? expandFutureBranches(
                purposeAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeAllBranches.length > 0
            ? expandFutureBranches(
                causeAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbAllBranches.length > 0
            ? expandFutureBranches(
                actVerbAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const indirectAllBranches = [
          ...indirectSameDayFutureBranches,
          ...indirectTomorrowFutureBranches,
        ];
        const expandedIndirect =
          indirectAllBranches.length > 0
            ? expandFutureBranches(
                indirectAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        state.combinations = [
          ...expandedSame,
          ...expandedTomorrow,
          ...expandedCause,
          ...expandedPurpose,
          ...expandedActVerb,
          ...expandedIndirect,
        ];
        if (expandedSame.length > 0 || expandedTomorrow.length > 0) {
          state.hasAmbiguity = true;
          const connectorAnchor = verbIndex + verbConsumed - 1 + objectConsumed;
          state.lastConnectorAnchor = connectorAnchor;
          helpers.updateLastVerbSubject(
            inferredPersons,
            connectorAnchor,
            state.lastSubject?.sourceToken
          );
          return { handled: true, nextIndex: connectorAnchor };
        }
      }
    }

    const parts: TranslationPart[] = [
      createParticlePart(
        "yaka",
        sourceLang,
        "VERB_NEGATOR",
        ["bäyŋu"],
        negatorSource
      ),
      ...subjectParts,
      createParticlePart("gi", sourceLang, "VERB_PARTICLE_NEG"),
      createVerbPart(
        gerundMatch,
        sourceLang,
        gerundMatch.entry.gupForms[1] ?? gerundMatch.entry.gup,
        "VERB_GERUND_NEG"
      ),
    ];
    const branches = buildBranches(parts, objectSequences);
    const originBranches = originSequences
      ? buildBranches(parts, originSequences)
      : [];
    const purposeBranches = purposeSequences
      ? buildBranches(parts, purposeSequences)
      : [];
    const causeBranches = causeSequences
      ? buildBranches(parts, causeSequences)
      : [];
    const actVerbBranches = actVerbSequences
      ? buildBranches(parts, actVerbSequences)
      : [];
    const belongingPurposeBranches = belongingPurposeSequences
      ? buildBranches(parts, belongingPurposeSequences)
      : [];
    const belongingAboutBranches = belongingAboutSequences
      ? buildBranches(parts, belongingAboutSequences)
      : [];
    const aboutAltBranches = aboutAltSequences
      ? buildBranches(parts, aboutAltSequences)
      : [];
    const indirectBranches = indirectSequences
      ? buildBranches(parts, indirectSequences)
      : [];
    const instrumentalBranches = instrumentalSequences
      ? buildBranches(parts, instrumentalSequences)
      : [];

    if (branches.length > 0) {
      const baseGroupId = objectDropAmbiguity
        ? helpers.nextVariantGroup("dropdown")
        : null;
      const expanded = expandBranchesWithSubject(branches, {
        append: helpers.appendPartsToCombinations,
        combos: state.combinations,
        hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
        subjectInsertMode: "after-first",
        variantGroup: baseGroupId,
      });
      let expandedPurpose: TranslationResult["combinations"] = [];
      if (purposeBranches.length > 0) {
        const purposeGroup = helpers.nextVariantGroup("box");
        expandedPurpose = expandBranchesWithSubject(purposeBranches, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-first",
          variantGroup: purposeGroup,
        });
      }
      let expandedCause: TranslationResult["combinations"] = [];
      if (causeBranches.length > 0) {
        const causeGroup = helpers.nextVariantGroup("box");
        expandedCause = expandBranchesWithSubject(causeBranches, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-first",
          variantGroup: causeGroup,
        });
      }
      let expandedActVerb: TranslationResult["combinations"] = [];
      if (actVerbBranches.length > 0) {
        const actGroup = helpers.nextVariantGroup("box");
        expandedActVerb = expandBranchesWithSubject(actVerbBranches, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-first",
          variantGroup: actGroup,
        });
      }
      let expandedImperativeMirri: TranslationResult["combinations"] = [];
      // if (imperativeMirriBranches.length > 0) {
      //   const mirriGroup = helpers.nextVariantGroup("box");
      //   expandedImperativeMirri = expandBranchesWithSubject(
      //     imperativeMirriBranches,
      //     {
      //       append: helpers.appendPartsToCombinations,
      //       combos: state.combinations,
      //       hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
      //       subjectInsertMode: "after-first",
      //       variantGroup: mirriGroup,
      //     }
      //   );
      // }
      let expandedBelongingPurpose: TranslationResult["combinations"] = [];
      if (belongingPurposeBranches.length > 0) {
        const purposeGroup = helpers.nextVariantGroup("box");
        expandedBelongingPurpose = expandBranchesWithSubject(
          belongingPurposeBranches,
          {
            append: helpers.appendPartsToCombinations,
            combos: state.combinations,
            hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
            subjectInsertMode: "after-first",
            variantGroup: purposeGroup,
          }
        );
      }
      let expandedBelongingAbout: TranslationResult["combinations"] = [];
      if (belongingAboutBranches.length > 0) {
        const aboutGroup = helpers.nextVariantGroup("box");
        expandedBelongingAbout = expandBranchesWithSubject(
          belongingAboutBranches,
          {
            append: helpers.appendPartsToCombinations,
            combos: state.combinations,
            hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
            subjectInsertMode: "after-first",
            variantGroup: aboutGroup,
          }
        );
      }
      let expandedAboutAlt: TranslationResult["combinations"] = [];
      if (aboutAltBranches.length > 0) {
        const altGroup = helpers.nextVariantGroup("box");
        expandedAboutAlt = expandBranchesWithSubject(aboutAltBranches, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-first",
          variantGroup: altGroup,
        });
      }
      let expandedIndirect: TranslationResult["combinations"] = [];
      if (indirectBranches.length > 0) {
        const indirectGroup = helpers.nextVariantGroup("box");
        expandedIndirect = expandBranchesWithSubject(indirectBranches, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-first",
          variantGroup: indirectGroup,
        });
      }
      let expandedInstrumental: TranslationResult["combinations"] = [];
      if (instrumentalBranches.length > 0) {
        const instrumentalGroup = helpers.nextVariantGroup("box");
        const instrumentalCombos = state.combinations.map((combo) => ({
          ...combo,
          parts: stripTrailingSequences(combo.parts, objectSequences),
        }));
        expandedInstrumental = expandBranchesWithSubject(instrumentalBranches, {
          append: helpers.appendPartsToCombinations,
          combos: instrumentalCombos,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-first",
          variantGroup: instrumentalGroup,
        });
      }
      let expandedOrigin: TranslationResult["combinations"] = [];
      if (originBranches.length > 0) {
        const originGroup = helpers.nextVariantGroup("box");
        expandedOrigin = expandBranchesWithSubject(originBranches, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-first",
          variantGroup: originGroup,
        });
      }
      if (branches.length > 1) {
        state.hasAmbiguity = true;
      }
      if (
        expandedPurpose.length > 0 ||
        expandedCause.length > 0 ||
        expandedActVerb.length > 0 ||
        expandedImperativeMirri.length > 0 ||
        expandedIndirect.length > 0 ||
        expandedInstrumental.length > 0 ||
        expandedOrigin.length > 0 ||
        expandedBelongingPurpose.length > 0 ||
        expandedBelongingAbout.length > 0 ||
        expandedAboutAlt.length > 0 ||
        purposeHasAmbiguity ||
        causeHasAmbiguity ||
        actVerbHasAmbiguity ||
        belongingPurposeHasAmbiguity ||
        belongingAboutHasAmbiguity ||
        aboutAltHasAmbiguity ||
        indirectHasAmbiguity ||
        instrumentalHasAmbiguity ||
        originHasAmbiguity
      ) {
        state.hasAmbiguity = true;
      }
      state.combinations = [
        ...expanded,
        ...expandedOrigin,
        ...expandedCause,
        ...expandedPurpose,
        ...expandedActVerb,
        ...expandedImperativeMirri,
        ...expandedBelongingPurpose,
        ...expandedBelongingAbout,
        ...expandedAboutAlt,
        ...expandedIndirect,
        ...expandedInstrumental,
      ];
      const connectorAnchor = verbIndex + verbConsumed - 1 + objectConsumed;
      state.lastConnectorAnchor = connectorAnchor;
      helpers.updateLastVerbSubject(
        inferredPersons,
        connectorAnchor,
        state.lastSubject?.sourceToken
      );
      return { handled: true, nextIndex: connectorAnchor };
    }
  }

  const hasSubjectBeforeNegator =
    isSubjectBeforeNegator(index) ||
    (index > 0 &&
      Boolean(matchSubjectPronoun(ir.tokens[index - 1]?.source, sourceLang)));
  const modalMatch =
    negationMatch.allowsPresent
      ? matchModalSpecialAt(ir.tokens, verbIndex, sourceLang)
      : null;
  let modalBranches: TranslationPart[][] = [];
  let modalObjectConsumed = 0;

  if (modalMatch) {
    const modalPre = buildModalObjectSequencesFromPending(
      objectBetween ? { kind: "pronoun", match: objectBetween } : null,
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
    modalObjectConsumed = modalAfter.consumed;
    const modalObjectSequences = appendObjectSequences(
      modalPre.sequences,
      modalAfter.sequences
    );
    const modalSubjectParts = hasSubjectBeforeNegator
      ? []
      : helpers.buildImpliedSubjectParts(
          modalPersons,
          state.lastSubject?.sourceToken
        );
    modalBranches = helpers.buildModalBranches(
      modalMatch,
      modalSubjectParts,
      modalObjectSequences,
      true,
      negatorSource
    );
  }

  const becomeMatch = matchBecomeAt(ir.tokens, verbIndex, sourceLang);
  let verbMatches =
    becomeMatch && becomeMatch.matches.length > 0
      ? becomeMatch.matches
      : matchVerbAt(ir.tokens, verbIndex, sourceLang);
  if (verbMatches.length === 0 && hasShouldHaveMarkerInSentence) {
    verbMatches = matchPastParticipleAt(ir.tokens, verbIndex, sourceLang);
  }
  debugLog("negation:verb-matches", {
    verbIndex,
    verbToken: ir.tokens[verbIndex]?.source,
    count: verbMatches.length,
    sourceLang,
  });
  if (verbMatches.length === 0 && modalBranches.length > 0) {
    let expanded = expandBranchesWithSubject(modalBranches, {
      append: helpers.appendPartsToCombinations,
      combos: state.combinations,
      hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
      subjectInsertMode: "after-first",
    });
    if (expanded.length > 1) {
      const modalGroup = helpers.nextVariantGroup("dropdown");
      expanded = expanded.map((combo) => ({
        ...combo,
        variantGroup:
          combo.variantGroup?.scope === "box" ? combo.variantGroup : modalGroup,
      }));
    }
    if (modalBranches.length > 1) {
      state.hasAmbiguity = true;
    }
    state.combinations = expanded;
    const connectorAnchor =
      verbIndex + (modalMatch?.consumed ?? 1) - 1 + modalObjectConsumed;
    state.lastConnectorAnchor = connectorAnchor;
    if (modalMatch) {
      const subjectPersons =
        hasSubjectBeforeNegator && state.lastSubject?.persons
          ? state.lastSubject.persons
          : expandInclusiveExclusive(modalMatch.persons);
      helpers.updateLastVerbSubject(
        subjectPersons.length > 0 ? subjectPersons : null,
        connectorAnchor,
        state.lastSubject?.sourceToken
      );
    }
    return { handled: true, nextIndex: connectorAnchor };
  }
  if (verbMatches.length > 0) {
    const verbConsumed = verbMatches[0]?.consumed ?? 1;
    const allowNonHumanDemonstrative = verbMatches.some(
      (match) => match.entry.isTransitive
    );
    const reflexivePersons = verbMatches.some((match) => match.entry.isTransitive)
      ? state.lastSubject?.persons
      : undefined;
    const reflexivePossessivePersons = state.lastSubject?.persons;
    const reflexivePossessiveOptions = {
      reflexivePersons: reflexivePossessivePersons,
      reflexiveSubjectRepeat: true,
    };
    const preObject = buildObjectSequencesFromPending(
      objectBetween ? { kind: "pronoun", match: objectBetween } : null,
      sourceLang,
      {
        allowNonHumanDemonstrative,
        reflexivePersons,
        reflexiveSubjectRepeat: true,
      }
    );
    const afterObjects = collectObjectSequencesAfterVerb(
      ir.tokens,
      verbIndex + verbConsumed,
      sourceLang,
      {
        allowNonHumanDemonstrative,
        reflexivePersons,
        reflexiveSubjectRepeat: true,
      }
    );
    debugLog("negation:after-objects", {
      verbIndex,
      verb: ir.tokens[verbIndex]?.source,
      consumed: afterObjects.consumed,
      next: ir.tokens[verbIndex + verbConsumed + afterObjects.consumed]?.source,
      sourceLang,
    });
    if (afterObjects.hasAmbiguity) {
      state.hasAmbiguity = true;
    }
    let objectSequences = appendObjectSequences(
      preObject.sequences,
      afterObjects.sequences
    );
    const originSequences = afterObjects.originSequences
      ? appendObjectSequences(preObject.sequences, afterObjects.originSequences)
      : null;
    const originHasAmbiguity = Boolean(afterObjects.originHasAmbiguity);
    let haveMirriSequences: TranslationPart[][] = [];
    let haveMirriHasAmbiguity = false;
    let haveMirriStripSequences: TranslationPart[][] | null = null;
    let purposeSequences: TranslationPart[][] | null = null;
    let purposeHasAmbiguity = false;
    let causeSequences: TranslationPart[][] | null = null;
    let causeHasAmbiguity = false;
    let actVerbSequences: TranslationPart[][] | null = null;
    let actVerbHasAmbiguity = false;
    let belongingPurposeSequences: TranslationPart[][] | null = null;
    let belongingPurposeHasAmbiguity = false;
    let belongingAboutSequences: TranslationPart[][] | null = null;
    let belongingAboutHasAmbiguity = false;
    let aboutAltSequences: TranslationPart[][] | null = null;
    let aboutAltHasAmbiguity = false;
    let indirectSequences: TranslationPart[][] | null = null;
    let indirectHasAmbiguity = false;
    const objectDropAmbiguity = preObject.hasDrop || afterObjects.hasDrop;
    let objectConsumed = afterObjects.consumed;

    const recordMirriStripSequences = (
      sequences: TranslationPart[][] | null
    ) => {
      if (!sequences || sequences.length === 0) return;
      if (!haveMirriStripSequences) {
        haveMirriStripSequences = [...sequences];
        return;
      }
      haveMirriStripSequences = [
        ...haveMirriStripSequences,
        ...sequences,
      ];
    };

    const applyMirriSuffix = (
      sequence: TranslationPart[],
      suffix: string,
      noteKey: "HAVE_MIRRI" | "HAVE_MIRIW"
    ): TranslationPart[] | null => {
      if (sequence.some((part) => part.type === "pronoun")) return null;
      const trimmed = haveMirriStripSequences
        ? stripTrailingSequences(sequence, haveMirriStripSequences)
        : sequence;
      if (trimmed.length === 0) return null;
      const updated = trimmed.map((part) => {
        if (
          part.type !== "noun" &&
          part.type !== "adjective" &&
          part.type !== "unknown"
        ) {
          return part;
        }
        const gup = applySuffixToGup(part.gup, suffix);
        const alternatives = part.alternatives?.map((alt) => ({
          ...alt,
          gup: applySuffixToGup(alt.gup, suffix),
        }));
        const explanations = [
          ...(part.explanations ?? []),
          { key: noteKey },
        ];
        return finalizePart(
          {
            ...part,
            gup,
            output: gup,
            alternatives,
            explanations,
          },
          sourceLang
        );
      });
      return updated.length > 0 ? updated : null;
    };

    let modifierConsumed = 0;
    let searching = true;
    let locativeMatch: ReturnType<typeof matchLocativeMarkerAt> | null = null;
    let instrumentalSequences: TranslationPart[][] | null = null;
    let instrumentalHasAmbiguity = false;
    let hasAllative = false;
    while (searching) {
      searching = false;
      let appliedInstrumental = false;
      const modifierIndex = verbIndex + verbConsumed + objectConsumed + modifierConsumed;
      debugLog("negation:modifier-loop", {
        modifierIndex,
        token: ir.tokens[modifierIndex]?.source,
        sourceLang,
      });
      const instrumentalPhrase = matchInstrumentalPhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      const instrumentalLead = instrumentalPhrase?.preposition.normalized
        .split(" ")
        .shift();
      const isConWithPrep =
        sourceLang === "es"
          ? instrumentalLead === "con"
          : instrumentalLead === "with";
      const applyInstrumentalPossessiveAlt = (baseSequences: TranslationPart[][]) => {
        if (!instrumentalPhrase?.possessiveAltSequences) return;
        const newSequences = appendObjectSequences(
          baseSequences,
          instrumentalPhrase.possessiveAltSequences
        );
        if (!instrumentalSequences) {
          instrumentalSequences = newSequences;
        } else {
          instrumentalSequences = [...instrumentalSequences, ...newSequences];
        }
        if (instrumentalPhrase.possessiveAltHasAmbiguity) {
          instrumentalHasAmbiguity = true;
        }
      };
      const applyInstrumentalAlt = (baseSequences: TranslationPart[][]) => {
        if (!instrumentalPhrase || instrumentalPhrase.isExclusive) return;
        if (isConWithPrep) return;
        if (appliedInstrumental) return;
        if (!instrumentalSequences) {
          instrumentalSequences = appendObjectSequences(
            baseSequences,
            instrumentalPhrase.sequences
          );
        } else {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            instrumentalPhrase.sequences
          );
        }
        if (instrumentalPhrase.hasAmbiguity) {
          instrumentalHasAmbiguity = true;
        }
        appliedInstrumental = true;
      };
      applyInstrumentalPossessiveAlt(objectSequences);
      if (instrumentalPhrase?.isExclusive) {
        objectSequences = appendObjectSequences(
          objectSequences,
          instrumentalPhrase.sequences
        );
        if (purposeSequences) {
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
          purposeSequences = appendObjectSequences(
            purposeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            instrumentalPhrase.sequences
          );
        }
        modifierConsumed += instrumentalPhrase.consumed;
        if (instrumentalPhrase.hasAmbiguity) {
          instrumentalHasAmbiguity = true;
        }
        searching = true;
        continue;
      }
      const hasMotionVerb = verbMatches.some(
        (match) => match.entry.motionType === "motion"
      );
      const indirectPhrase = matchIndirectPhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (indirectPhrase) {
        const baseSequences = objectSequences;
        const hasDirectObject = baseSequences.some((seq) => seq.length > 0);
        const normalized = indirectPhrase.preposition.normalized;
        const isToPreposition =
          (sourceLang === "es" && normalized === "a") ||
          (sourceLang === "en" && normalized === "to");
        const isForPreposition =
          (sourceLang === "es" && normalized === "para") ||
          (sourceLang === "en" && normalized === "for");
      if (isToPreposition && indirectPhrase.targetHumanity === "non-human") {
        // Non-human "a/to" should be handled as locative/allative, not IO.
      } else {
        applyInstrumentalAlt(baseSequences);
        const ioSequences = appendObjectSequences(
          baseSequences,
          indirectPhrase.sequences
        );

        if (
          isToPreposition &&
          !hasDirectObject &&
          indirectPhrase.directAltSequences
        ) {
          objectSequences = appendObjectSequences(
            baseSequences,
            indirectPhrase.directAltSequences
          );
          indirectSequences = ioSequences;
          indirectHasAmbiguity = true;
        } else {
          objectSequences = ioSequences;
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            indirectPhrase.sequences
          );
        }

        if (isForPreposition) {
          const purposePhrase = matchPurposePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang,
            reflexivePossessiveOptions
          );
          if (purposePhrase) {
            if (!purposeSequences) {
              purposeSequences = appendObjectSequences(
                baseSequences,
                purposePhrase.sequences
              );
            } else {
              purposeSequences = appendObjectSequences(
                purposeSequences,
                purposePhrase.sequences
              );
            }
            if (purposePhrase.hasAmbiguity) purposeHasAmbiguity = true;
          }
          const causePhrase = matchCausePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang
          );
          if (causePhrase) {
            if (!causeSequences) {
              causeSequences = appendObjectSequences(
                baseSequences,
                causePhrase.sequences
              );
            } else {
              causeSequences = appendObjectSequences(
                causeSequences,
                causePhrase.sequences
              );
            }
            if (causePhrase.hasAmbiguity) causeHasAmbiguity = true;
          }
          const belongingPurposePhrase = matchBelongingPurposePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang
          );
          if (belongingPurposePhrase) {
            if (!belongingPurposeSequences) {
              belongingPurposeSequences = appendObjectSequences(
                baseSequences,
                belongingPurposePhrase.sequences
              );
            } else {
              belongingPurposeSequences = appendObjectSequences(
                belongingPurposeSequences,
                belongingPurposePhrase.sequences
              );
            }
            if (belongingPurposePhrase.hasAmbiguity) {
              belongingPurposeHasAmbiguity = true;
            }
          }
        }

        modifierConsumed += indirectPhrase.consumed;
        if (indirectPhrase.hasAmbiguity) {
          indirectHasAmbiguity = true;
        }
        searching = true;
        continue;
      }
    }
      if (hasMotionVerb) {
        const traversivePhrase = matchTraversivePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang
        );
        if (traversivePhrase) {
          const baseSequences = objectSequences;
          const purposeAlt = matchPurposePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang,
            reflexivePossessiveOptions
          );
          if (purposeAlt) {
            if (!purposeSequences) {
              purposeSequences = appendObjectSequences(
                baseSequences,
                purposeAlt.sequences
              );
            } else {
              purposeSequences = appendObjectSequences(
                purposeSequences,
                purposeAlt.sequences
              );
            }
            if (purposeAlt.hasAmbiguity) {
              purposeHasAmbiguity = true;
            }
          }
          const causeAlt = matchCausePhraseAt(
            ir.tokens,
            modifierIndex,
            sourceLang
          );
          if (causeAlt) {
            if (!causeSequences) {
              causeSequences = appendObjectSequences(
                baseSequences,
                causeAlt.sequences
              );
            } else {
              causeSequences = appendObjectSequences(
                causeSequences,
                causeAlt.sequences
              );
            }
            if (causeAlt.hasAmbiguity) {
              causeHasAmbiguity = true;
            }
          }
          applyInstrumentalAlt(baseSequences);
          objectSequences = appendObjectSequences(
            baseSequences,
            traversivePhrase.sequences
          );
          if (indirectSequences) {
            indirectSequences = appendObjectSequences(
              indirectSequences,
              traversivePhrase.sequences
            );
          }
          if (instrumentalSequences && !instrumentalPhrase) {
            instrumentalSequences = appendObjectSequences(
              instrumentalSequences,
              traversivePhrase.sequences
            );
          }
          modifierConsumed += traversivePhrase.consumed;
          if (traversivePhrase.hasAmbiguity) {
            state.hasAmbiguity = true;
          }
          searching = true;
          continue;
        }
      }
      const purposePhrase = matchPurposePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      const causePhrase = matchCausePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      debugLog("cause:scan", {
        index: modifierIndex,
        token: ir.tokens[modifierIndex]?.source,
        next: ir.tokens[modifierIndex + 1]?.source,
        purpose: Boolean(purposePhrase),
        cause: Boolean(causePhrase),
        sourceLang,
      });
      if (!purposePhrase && causePhrase) {
        objectSequences = appendObjectSequences(
          objectSequences,
          causePhrase.sequences
        );
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            causePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            causePhrase.sequences
          );
        }
        modifierConsumed += causePhrase.consumed;
        if (causePhrase.hasAmbiguity) {
          causeHasAmbiguity = true;
        }
        searching = true;
        continue;
      }
      if (purposePhrase) {
        if (causePhrase) {
          if (!causeSequences) {
            causeSequences = appendObjectSequences(
              objectSequences,
              causePhrase.sequences
            );
          } else {
            causeSequences = appendObjectSequences(
              causeSequences,
              causePhrase.sequences
            );
          }
          if (causePhrase.hasAmbiguity) {
            causeHasAmbiguity = true;
          }
        }
        const belongingPurposePhrase = matchBelongingPurposePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang
        );
        if (belongingPurposePhrase) {
          if (!belongingPurposeSequences) {
            belongingPurposeSequences = appendObjectSequences(
              objectSequences,
              belongingPurposePhrase.sequences
            );
          } else {
            belongingPurposeSequences = appendObjectSequences(
              belongingPurposeSequences,
              belongingPurposePhrase.sequences
            );
          }
          if (belongingPurposePhrase.hasAmbiguity) {
            belongingPurposeHasAmbiguity = true;
          }
        }
        applyInstrumentalAlt(objectSequences);
        const purposeAlt =
          purposePhrase.targetHumanity !== "human"
            ? matchPurposeAmbiguousAltAt(
                ir.tokens,
                modifierIndex,
                sourceLang,
                purposePhrase.preposition,
                hasMotionVerb,
                reflexivePossessiveOptions
              )
            : null;
        if (purposeAlt) {
          if (!purposeSequences) {
            purposeSequences = appendObjectSequences(
              objectSequences,
              purposeAlt.sequences
            );
          }
          objectSequences = appendObjectSequences(
            objectSequences,
            purposePhrase.sequences
          );
          if (indirectSequences) {
            indirectSequences = appendObjectSequences(
              indirectSequences,
              purposePhrase.sequences
            );
          }
          if (instrumentalSequences && !instrumentalPhrase) {
            instrumentalSequences = appendObjectSequences(
              instrumentalSequences,
              purposePhrase.sequences
            );
          }
          modifierConsumed += purposePhrase.consumed;
          if (purposePhrase.hasAmbiguity) {
            purposeHasAmbiguity = true;
          }
          if (purposeAlt.hasAmbiguity) {
            state.hasAmbiguity = true;
          }
          searching = true;
          continue;
        }
        const originPhrase = !hasMotionVerb
          ? matchOriginPhraseAt(
              ir.tokens,
              modifierIndex,
              sourceLang,
              reflexivePossessiveOptions
            )
          : null;
        if (originPhrase) {
          if (!purposeSequences) {
            purposeSequences = appendObjectSequences(
              objectSequences,
              originPhrase.sequences
            );
          } else {
            purposeSequences = appendObjectSequences(
              purposeSequences,
              originPhrase.sequences
            );
          }
          objectSequences = appendObjectSequences(
            objectSequences,
            purposePhrase.sequences
          );
          if (indirectSequences) {
            indirectSequences = appendObjectSequences(
              indirectSequences,
              purposePhrase.sequences
            );
          }
          if (instrumentalSequences && !instrumentalPhrase) {
            instrumentalSequences = appendObjectSequences(
              instrumentalSequences,
              purposePhrase.sequences
            );
          }
          if (purposePhrase.hasAmbiguity) purposeHasAmbiguity = true;
          modifierConsumed += originPhrase.consumed;
          if (originPhrase.hasAmbiguity) {
            state.hasAmbiguity = true;
          }
          searching = true;
          continue;
        }
        const allowComitative =
          !(sourceLang === "es" && purposePhrase.preposition.normalized.startsWith("con "));
        const comitativePhrase = allowComitative
          ? matchComitativePhraseAt(
              ir.tokens,
              modifierIndex,
              sourceLang,
              reflexivePossessiveOptions
            )
          : null;
        if (comitativePhrase) {
          if (!purposeSequences) {
            purposeSequences = appendObjectSequences(
              objectSequences,
              purposePhrase.sequences
            );
            if (purposePhrase.hasAmbiguity) purposeHasAmbiguity = true;
          }
          objectSequences = appendObjectSequences(
            objectSequences,
            comitativePhrase.sequences
          );
          if (purposeSequences) {
            purposeSequences = appendObjectSequences(
              purposeSequences,
              comitativePhrase.sequences
            );
          }
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              comitativePhrase.sequences
            );
          }
          if (indirectSequences) {
            indirectSequences = appendObjectSequences(
              indirectSequences,
              comitativePhrase.sequences
            );
          }
          if (instrumentalSequences && !instrumentalPhrase) {
            instrumentalSequences = appendObjectSequences(
              instrumentalSequences,
              comitativePhrase.sequences
            );
          }
          modifierConsumed += comitativePhrase.consumed;
          if (comitativePhrase.hasAmbiguity) {
            state.hasAmbiguity = true;
          }
          searching = true;
          continue;
        }
        objectSequences = appendObjectSequences(
          objectSequences,
          purposePhrase.sequences
        );
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            purposePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            purposePhrase.sequences
          );
        }
        modifierConsumed += purposePhrase.consumed;
      if (purposePhrase.hasAmbiguity) {
        state.hasAmbiguity = true;
      }
      searching = true;
      continue;
    }

    const belongingAboutPhrase = matchBelongingAboutPhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang
    );
    if (belongingAboutPhrase) {
      if (!belongingAboutSequences) {
        belongingAboutSequences = appendObjectSequences(
          objectSequences,
          belongingAboutPhrase.sequences
        );
      } else {
        belongingAboutSequences = appendObjectSequences(
          belongingAboutSequences,
          belongingAboutPhrase.sequences
        );
      }
      if (belongingAboutPhrase.hasAmbiguity) {
        belongingAboutHasAmbiguity = true;
      }
      if (shouldAllowAboutLocativeAlt(belongingAboutPhrase.preposition, sourceLang)) {
        const locativeAlt = matchLocativePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (locativeAlt) {
          const altSeq = appendObjectSequences(objectSequences, locativeAlt.sequences);
          aboutAltSequences = aboutAltSequences
            ? [...aboutAltSequences, ...altSeq]
            : altSeq;
          if (locativeAlt.hasAmbiguity) {
            aboutAltHasAmbiguity = true;
          }
        }
        const ablativeAlt = matchAblativePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (ablativeAlt) {
          const altSeq = appendObjectSequences(objectSequences, ablativeAlt.sequences);
          aboutAltSequences = aboutAltSequences
            ? [...aboutAltSequences, ...altSeq]
            : altSeq;
          if (ablativeAlt.hasAmbiguity) {
            aboutAltHasAmbiguity = true;
          }
        }
      }
      modifierConsumed += belongingAboutPhrase.consumed;
      searching = true;
      continue;
    }

    if (!hasMotionVerb) {
      applyInstrumentalAlt(objectSequences);
      const originPhrase = matchOriginPhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
        if (originPhrase) {
          objectSequences = appendObjectSequences(
            objectSequences,
            originPhrase.sequences
          );
          if (purposeSequences) {
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              originPhrase.sequences
            );
          }
            purposeSequences = appendObjectSequences(
              purposeSequences,
              originPhrase.sequences
            );
          }
          if (indirectSequences) {
            indirectSequences = appendObjectSequences(
              indirectSequences,
              originPhrase.sequences
            );
          }
          if (instrumentalSequences && !instrumentalPhrase) {
            instrumentalSequences = appendObjectSequences(
              instrumentalSequences,
              originPhrase.sequences
            );
          }
          modifierConsumed += originPhrase.consumed;
          if (originPhrase.hasAmbiguity) {
            state.hasAmbiguity = true;
          }
          searching = true;
          continue;
        }
      }
    if (instrumentalPhrase && isConWithPrep) {
      const baseSequences = objectSequences;
      const comitativeAlt = matchComitativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      let mainSequences = instrumentalPhrase.sequences;
      if (instrumentalPhrase.targetHumanity === "human" && comitativeAlt) {
        objectSequences = appendObjectSequences(baseSequences, comitativeAlt.sequences);
        const newSequences = appendObjectSequences(
          baseSequences,
          instrumentalPhrase.sequences
        );
        if (!instrumentalSequences) {
          instrumentalSequences = newSequences;
        } else {
          instrumentalSequences = [...instrumentalSequences, ...newSequences];
        }
        if (instrumentalPhrase.hasAmbiguity) {
          instrumentalHasAmbiguity = true;
        }
        mainSequences = comitativeAlt.sequences;
      } else {
        if (instrumentalPhrase.targetHumanity === "ambiguous" && comitativeAlt) {
          const comitativeHumanSequences = filterComitativeHumanSequences(
            comitativeAlt.sequences
          );
          if (comitativeHumanSequences.length > 0) {
            const newSequences = appendObjectSequences(
              baseSequences,
              comitativeHumanSequences
            );
            if (!instrumentalSequences) {
              instrumentalSequences = newSequences;
            } else {
              instrumentalSequences = [...instrumentalSequences, ...newSequences];
            }
          }
          if (comitativeAlt.hasAmbiguity) {
            instrumentalHasAmbiguity = true;
          }
        }
        if (instrumentalPhrase.targetHumanity === "ambiguous") {
          const nonHumanMain = filterInstrumentalNonHumanSequences(
            instrumentalPhrase.sequences
          );
          if (nonHumanMain.length > 0) {
            mainSequences = nonHumanMain;
          }
        }
        objectSequences = appendObjectSequences(baseSequences, mainSequences);
      }
      if (purposeSequences) {
      if (causeSequences) {
        causeSequences = appendObjectSequences(causeSequences, mainSequences);
      }
        purposeSequences = appendObjectSequences(purposeSequences, mainSequences);
      }
      if (indirectSequences) {
        indirectSequences = appendObjectSequences(indirectSequences, mainSequences);
      }
      modifierConsumed += instrumentalPhrase.consumed;
      if (instrumentalPhrase.hasAmbiguity) {
        instrumentalHasAmbiguity = true;
      }
      searching = true;
      continue;
    }
      applyInstrumentalAlt(objectSequences);
      const comitativePhrase = matchComitativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (comitativePhrase) {
        objectSequences = appendObjectSequences(
          objectSequences,
          comitativePhrase.sequences
        );
        if (purposeSequences) {
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            comitativePhrase.sequences
          );
        }
          purposeSequences = appendObjectSequences(
            purposeSequences,
            comitativePhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            comitativePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            comitativePhrase.sequences
          );
        }
        modifierConsumed += comitativePhrase.consumed;
        if (comitativePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }

      const allativePhrase = matchAllativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (allativePhrase) {
        objectSequences = appendObjectSequences(
          objectSequences,
          allativePhrase.sequences
        );
        if (purposeSequences) {
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            allativePhrase.sequences
          );
        }
          purposeSequences = appendObjectSequences(
            purposeSequences,
            allativePhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            allativePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            allativePhrase.sequences
          );
        }
        modifierConsumed += allativePhrase.consumed;
        if (allativePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        hasAllative = true;
        searching = true;
        continue;
      }

      if (hasMotionVerb) {
        const ablativePhrase = matchAblativePhraseAt(
          ir.tokens,
          modifierIndex,
          sourceLang,
          reflexivePossessiveOptions
        );
        if (ablativePhrase) {
          objectSequences = appendObjectSequences(
            objectSequences,
            ablativePhrase.sequences
          );
          if (purposeSequences) {
          if (causeSequences) {
            causeSequences = appendObjectSequences(
              causeSequences,
              ablativePhrase.sequences
            );
          }
            purposeSequences = appendObjectSequences(
              purposeSequences,
              ablativePhrase.sequences
            );
          }
          if (indirectSequences) {
            indirectSequences = appendObjectSequences(
              indirectSequences,
              ablativePhrase.sequences
            );
          }
          if (instrumentalSequences && !instrumentalPhrase) {
            instrumentalSequences = appendObjectSequences(
              instrumentalSequences,
              ablativePhrase.sequences
            );
          }
          modifierConsumed += ablativePhrase.consumed;
          if (ablativePhrase.hasAmbiguity) {
            state.hasAmbiguity = true;
          }
          searching = true;
          continue;
        }
      }

      const actVerbPhrase = matchActVerbPhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      if (actVerbPhrase) {
        const baseSequences = objectSequences;
        if (!actVerbSequences) {
          actVerbSequences = appendObjectSequences(
            baseSequences,
            actVerbPhrase.sequences
          );
        } else {
          actVerbSequences = appendObjectSequences(
            actVerbSequences,
            actVerbPhrase.sequences
          );
        }
        if (actVerbPhrase.hasAmbiguity) {
          actVerbHasAmbiguity = true;
        }
        modifierConsumed += actVerbPhrase.consumed;
        searching = true;
        continue;
      }

      const locativePhrase = matchLocativePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang,
        reflexivePossessiveOptions
      );
      if (locativePhrase) {
        objectSequences = appendObjectSequences(
          objectSequences,
          locativePhrase.sequences
        );
        if (purposeSequences) {
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            locativePhrase.sequences
          );
        }
          purposeSequences = appendObjectSequences(
            purposeSequences,
            locativePhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            locativePhrase.sequences
          );
        }
        if (instrumentalSequences && !instrumentalPhrase) {
          instrumentalSequences = appendObjectSequences(
            instrumentalSequences,
            locativePhrase.sequences
          );
        }
        modifierConsumed += locativePhrase.consumed;
        if (locativePhrase.hasAmbiguity) {
          state.hasAmbiguity = true;
        }
        searching = true;
        continue;
      }

      const foundLocative = matchLocativeMarkerAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      if (foundLocative) {
        const hasMotionVerb = verbMatches.some(
          (match) => match.entry.motionType === "motion"
        );
        if (hasMotionVerb) {
          const allativeMarker = matchAllativeMarkerAt(
            ir.tokens,
            modifierIndex,
            sourceLang
          );
          if (allativeMarker) {
            objectSequences = objectSequences.map((seq) => [
              ...seq,
              allativeMarker.part,
            ]);
            if (purposeSequences) {
            if (causeSequences) {
              causeSequences = causeSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
              purposeSequences = purposeSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
            if (indirectSequences) {
              indirectSequences = indirectSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
            if (instrumentalSequences) {
              instrumentalSequences = instrumentalSequences.map((seq) => [
                ...seq,
                allativeMarker.part,
              ]);
            }
            modifierConsumed += allativeMarker.consumed;
            hasAllative = true;
            searching = true;
            continue;
          }
        }
        const locativePart = buildLocativePart(foundLocative, sourceLang);
        recordMirriStripSequences([[locativePart]]);
        objectSequences = objectSequences.map((seq) => [...seq, locativePart]);
        if (purposeSequences) {
        if (causeSequences) {
          causeSequences = causeSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
          purposeSequences = purposeSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
        if (indirectSequences) {
          indirectSequences = indirectSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
        if (instrumentalSequences) {
          instrumentalSequences = instrumentalSequences.map((seq) => [
            ...seq,
            locativePart,
          ]);
        }
        modifierConsumed += foundLocative.consumed;
        locativeMatch = foundLocative;
        searching = true;
      }
    if (!searching && instrumentalPhrase && !instrumentalPhrase.isExclusive) {
      objectSequences = appendObjectSequences(
        objectSequences,
        instrumentalPhrase.sequences
      );
        if (purposeSequences) {
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            instrumentalPhrase.sequences
          );
        }
          purposeSequences = appendObjectSequences(
            purposeSequences,
            instrumentalPhrase.sequences
          );
        }
        if (indirectSequences) {
          indirectSequences = appendObjectSequences(
            indirectSequences,
            instrumentalPhrase.sequences
          );
        }
        modifierConsumed += instrumentalPhrase.consumed;
      if (instrumentalPhrase.hasAmbiguity) {
        instrumentalHasAmbiguity = true;
      }
      searching = true;
    }
  }
  objectConsumed += modifierConsumed;
    objectConsumed += modifierConsumed;

    const resolvedMatches = verbMatches.map((match) => {
      let entry = match.entry;
      if (hasAllative) {
        entry = resolveAllativeVerbEntry(entry);
      }
      if (locativeMatch) {
        entry = resolveLocativeVerbEntry(entry, locativeMatch);
      }
      return entry === match.entry ? match : { ...match, entry };
    });

    const makeAdjMatch = matchMakeAdjAt(ir.tokens, verbIndex, sourceLang);
    const makeAdjResolvedMatches = makeAdjMatch ? makeAdjMatch.matches : [];

    const isHaveVerb = resolvedMatches.some((match) => match.entry.isHaveVerb);
    const canUseMirri =
      isHaveVerb &&
      hasSubjectBeforeNegator &&
      state.lastSubject &&
      state.lastSubject.kind !== "pronoun";
    if (canUseMirri) {
      for (const sequence of objectSequences) {
        const mirriSeq = applyMirriSuffix(sequence, "miriw", "HAVE_MIRIW");
        if (!mirriSeq) continue;
        if (
          mirriSeq.some(
            (part) => part.alternatives && part.alternatives.length > 0
          )
        ) {
          haveMirriHasAmbiguity = true;
        }
        haveMirriSequences.push(mirriSeq);
      }
      if (haveMirriSequences.length > 1) {
        haveMirriHasAmbiguity = true;
      }
    }

    let expandedHaveMirri: TranslationResult["combinations"] = [];
    if (haveMirriSequences.length > 0) {
      const mirriGroup: VariantGroup = helpers.nextVariantGroup("box");
      const mirriBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: mirriGroup,
      }));
      for (const seq of haveMirriSequences) {
        expandedHaveMirri = expandedHaveMirri.concat(
          helpers.appendPartsToCombinations(mirriBaseCombos, seq, "dropdown")
        );
      }
    }

    const appendHaveMirri = (
      combos: TranslationResult["combinations"]
    ): TranslationResult["combinations"] =>
      expandedHaveMirri.length > 0 ? [...combos, ...expandedHaveMirri] : combos;

    let presentMatches = resolvedMatches.filter(
      (match) => match.kind === "present"
    );
    let pastSimpleMatches = resolvedMatches.filter(
      (match) => match.kind === "past_simple"
    );
    let pastContinuousMatches = resolvedMatches.filter(
      (match) => match.kind === "past_continuous"
    );
    let futureMatches = resolvedMatches.filter(
      (match) => match.kind === "future"
    );
    const subjMatches = resolvedMatches.filter(
      (match) => match.kind === "subjunctive"
    );
    const imperativeMatches = resolvedMatches.filter(
      (match) => match.kind === "imperative"
    );
    const infinitiveMatches = resolvedMatches.filter(
      (match) => match.kind === "infinitive"
    );
    const pastHabitualTrigger = hasPastHabitualMarker(ir.tokens, sourceLang);
    if (
      pastHabitualTrigger &&
      pastSimpleMatches.length === 0 &&
      pastContinuousMatches.length === 0
    ) {
      const fallback = presentMatches.length > 0 ? presentMatches : infinitiveMatches;
      if (fallback.length > 0) {
        pastContinuousMatches = fallback.map((match) => ({
          ...match,
          kind: "past_continuous",
        }));
        presentMatches = [];
      }
    }

    const hasTransitiveMatch = resolvedMatches.some(
      (match) => match.entry.isTransitive
    );
    helpers.maybeApplyAgentSuffix(
      hasTransitiveMatch,
      Boolean(hasSubjectBeforeNegator)
    );

    const branches: TranslationPart[][] = [];
    const habitualBranches: TranslationPart[][] = [];
    const mightBranches: TranslationPart[][] = [];
    const shouldBranches: TranslationPart[][] = [];
    const shouldHaveBranches: TranslationPart[][] = [];
    const originBranches: TranslationPart[][] = [];
    const purposeBranches: TranslationPart[][] = [];
    const causeBranches: TranslationPart[][] = [];
    const actVerbBranches: TranslationPart[][] = [];
    const imperativeMirriBranches: TranslationPart[][] = [];
    const belongingPurposeBranches: TranslationPart[][] = [];
    const belongingAboutBranches: TranslationPart[][] = [];
    const aboutAltBranches: TranslationPart[][] = [];
    const indirectBranches: TranslationPart[][] = [];
    const instrumentalBranches: TranslationPart[][] = [];
    const negationPersons = new Set<PersonNumber>();
    let hasPresentNegation = false;
    let hasPastNegation = false;
    let hasFutureNegation = false;
    const hasMightMarkerInSentence = hasMightMarker(ir.tokens, sourceLang);

    const buildMightNegBranches = (match: VerbMatch) => {
      if (!hasMightMarkerInSentence) return;
      const persons = expandInclusiveExclusive(match.personNumbers);
      const subjectParts = hasSubjectBeforeNegator
        ? []
        : helpers.buildImpliedSubjectParts(
            state.lastSubject?.persons ?? persons,
            state.lastSubject?.sourceToken
          );
      const negatorPart = createParticlePart(
        "yaka",
        sourceLang,
        "VERB_NEGATOR",
        ["bäyŋu"],
        negatorSource
      );
      const balaŋuPart = createParticlePart(
        "balaŋu",
        sourceLang,
        "VERB_PARTICLE_MIGHT"
      );
      const banaPart = createParticlePart(
        "bäna",
        sourceLang,
        "VERB_PARTICLE_MIGHT_BANA"
      );
      if (match.kind.startsWith("past")) {
        const pastGup =
          match.entry.gupForms[3] ??
          match.entry.gupForms[0] ??
          match.entry.gup;
        const pastAlt = new Set<string>();
        if (match.entry.gupForms[4]) pastAlt.add(match.entry.gupForms[4]);
        if (match.altGupForms?.[3]) pastAlt.add(match.altGupForms[3]);
        if (match.altGupForms?.[4]) pastAlt.add(match.altGupForms[4]);
        const pastPart = createVerbPart(
          match,
          sourceLang,
          pastGup,
          "VERB_MIGHT_PAST",
          pastAlt.size > 0 ? Array.from(pastAlt) : undefined
        );
        const pastParts: TranslationPart[] = [
          negatorPart,
          ...subjectParts,
          banaPart,
          balaŋuPart,
          pastPart,
        ];
        mightBranches.push(...buildBranches(pastParts, objectSequences));
        return;
      }
      const giPart = createParticlePart(
        "gi",
        sourceLang,
        "VERB_PARTICLE_MIGHT_CONTINUOUS"
      );
      const futurePart = createParticlePart(
        "yurru",
        sourceLang,
        "VERB_PARTICLE_FUTURE",
        ["dhu"]
      );
      const secondaryGup = match.entry.gupForms[1] ?? match.entry.gup;
      const primaryGup = match.entry.gupForms[0] ?? match.entry.gup;
      const secondaryPart = createVerbPart(
        match,
        sourceLang,
        secondaryGup,
        "VERB_MIGHT_SEC",
        match.altGupForms?.[1] ? [match.altGupForms[1]] : undefined
      );
      const primaryPart = createVerbPart(
        match,
        sourceLang,
        primaryGup,
        "VERB_MIGHT_FUTURE",
        match.altGupForms?.[0] ? [match.altGupForms[0]] : undefined
      );
      const baseParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        balaŋuPart,
        secondaryPart,
      ];
      const baseGiParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        balaŋuPart,
        giPart,
        secondaryPart,
      ];
      const banaParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        banaPart,
        balaŋuPart,
        secondaryPart,
      ];
      const banaGiParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        banaPart,
        balaŋuPart,
        giPart,
        secondaryPart,
      ];
      const futureParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        balaŋuPart,
        futurePart,
        primaryPart,
      ];
      mightBranches.push(...buildBranches(baseParts, objectSequences));
      mightBranches.push(...buildBranches(baseGiParts, objectSequences));
      mightBranches.push(...buildBranches(banaParts, objectSequences));
      mightBranches.push(...buildBranches(banaGiParts, objectSequences));
      mightBranches.push(...buildBranches(futureParts, objectSequences));
    };

    const buildShouldNegBranches = (match: VerbMatch) => {
      if (!hasShouldMarkerInSentence) return;
      const shouldPersons =
        resolveShouldPersons(ir.tokens, sourceLang) ??
        (match.personNumbers.length > 0 ? match.personNumbers : null) ??
        ["3_Sing"];
      const persons = expandInclusiveExclusive(shouldPersons);
      const subjectParts = hasSubjectBeforeNegator
        ? []
        : helpers.buildImpliedSubjectParts(
            state.lastSubject?.persons ?? persons,
            state.lastSubject?.sourceToken
          );
      const negatorPart = createParticlePart(
        "yaka",
        sourceLang,
        "VERB_NEGATOR",
        ["bäyŋu"],
        negatorSource
      );
      const balaŋuPart = createParticlePart(
        "balaŋu",
        sourceLang,
        "VERB_PARTICLE_SHOULD"
      );
      const nguliPart = createParticlePart(
        "ŋuli",
        sourceLang,
        "VERB_PARTICLE_SHOULD_NGULI"
      );
      const giPart = createParticlePart(
        "gi",
        sourceLang,
        "VERB_PARTICLE_SHOULD_CONTINUOUS"
      );
      const secondaryGup = match.entry.gupForms[1] ?? match.entry.gup;
      const verbPart = createVerbPart(
        match,
        sourceLang,
        secondaryGup,
        "VERB_SHOULD_SEC",
        match.altGupForms?.[1] ? [match.altGupForms[1]] : undefined
      );
      const balaŋuParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        balaŋuPart,
        verbPart,
      ];
      const balaŋuGiParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        balaŋuPart,
        giPart,
        verbPart,
      ];
      const nguliParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        nguliPart,
        verbPart,
      ];
      const nguliGiParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        nguliPart,
        giPart,
        verbPart,
      ];
      const balaŋuNguliParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        balaŋuPart,
        nguliPart,
        verbPart,
      ];
      const balaŋuNguliGiParts: TranslationPart[] = [
        negatorPart,
        ...subjectParts,
        balaŋuPart,
        nguliPart,
        giPart,
        verbPart,
      ];
      shouldBranches.push(...buildBranches(balaŋuParts, objectSequences));
      shouldBranches.push(...buildBranches(balaŋuGiParts, objectSequences));
      shouldBranches.push(...buildBranches(nguliParts, objectSequences));
      shouldBranches.push(...buildBranches(nguliGiParts, objectSequences));
      shouldBranches.push(...buildBranches(balaŋuNguliParts, objectSequences));
      shouldBranches.push(...buildBranches(balaŋuNguliGiParts, objectSequences));
    };

    const buildShouldHaveNegBranches = (match: VerbMatch) => {
      if (!hasShouldHaveMarkerInSentence) return;
      const shouldPersons =
        resolveShouldHavePersons(ir.tokens, sourceLang) ??
        (match.personNumbers.length > 0 ? match.personNumbers : null) ??
        ["3_Sing"];
      const persons = expandInclusiveExclusive(shouldPersons);
      const subjectParts = hasSubjectBeforeNegator
        ? []
        : helpers.buildImpliedSubjectParts(
            state.lastSubject?.persons ?? persons,
            state.lastSubject?.sourceToken
          );
      const negatorPart = createParticlePart(
        "yaka",
        sourceLang,
        "VERB_NEGATOR",
        ["bäyŋu"],
        negatorSource
      );
      const balaŋuPart = createParticlePart(
        "balaŋu",
        sourceLang,
        "VERB_PARTICLE_SHOULD_HAVE"
      );
      const pastForms: Array<{ gup: string; alt?: string }> = [];
      const gup3 = match.entry.gupForms[3];
      const gup4 = match.entry.gupForms[4];
      if (gup3) {
        pastForms.push({ gup: gup3, alt: match.altGupForms?.[3] });
      }
      if (gup4) {
        pastForms.push({ gup: gup4, alt: match.altGupForms?.[4] });
      }
      for (const form of pastForms) {
        const verbPart = createVerbPart(
          match,
          sourceLang,
          form.gup,
          "VERB_SHOULD_HAVE_PAST",
          form.alt ? [form.alt] : undefined
        );
        const parts: TranslationPart[] = [
          negatorPart,
          ...subjectParts,
          balaŋuPart,
          verbPart,
        ];
        shouldHaveBranches.push(...buildBranches(parts, objectSequences));
      }
    };

    if (negationMatch.forcePastSimple) {
      if (pastSimpleMatches.length === 0 && presentMatches.length > 0) {
        pastSimpleMatches = presentMatches.map((match) => ({
          ...match,
          kind: "past_simple",
        }));
      }
      presentMatches = [];
    }
    if (negationMatch.forceFuture) {
      if (futureMatches.length === 0 && presentMatches.length > 0) {
        futureMatches = presentMatches.map((match) => ({
          ...match,
          kind: "future",
        }));
      }
      presentMatches = [];
    }

    if (negationMatch.allowsPresent && presentMatches.length > 0) {
      const hasHabitualMarkerInSentence = hasHabitualMarker(
        ir.tokens,
        sourceLang
      );
      for (const match of presentMatches) {
        const persons = negationMatch.presentPersonsOverride
          ? negationMatch.presentPersonsOverride
          : expandInclusiveExclusive(match.personNumbers);
        persons.forEach((person) => negationPersons.add(person));
        const subjectParts = hasSubjectBeforeNegator
          ? []
          : helpers.buildImpliedSubjectParts(
              state.lastSubject?.persons ?? persons,
              state.lastSubject?.sourceToken
            );
        const negatorPart = createParticlePart(
          "yaka",
          sourceLang,
          "VERB_NEGATOR",
          ["bäyŋu"],
          negatorSource
        );
        const verbPart = createVerbPart(
          match,
          sourceLang,
          match.entry.gupForms[1] ?? match.entry.gup,
          "VERB_PRESENT_NEG"
        );
        const giPart = createParticlePart(
          "gi",
          sourceLang,
          "VERB_PARTICLE_NEG"
        );
        const habitualPart = createParticlePart(
          "ŋuli",
          sourceLang,
          "VERB_PARTICLE_HABITUAL"
        );
        const parts: TranslationPart[] = [
          negatorPart,
          ...subjectParts,
          giPart,
          verbPart,
        ];
        const habitualWithParticle: TranslationPart[] = [
          negatorPart,
          ...subjectParts,
          habitualPart,
          giPart,
          verbPart,
        ];
        const habitualNoParticle: TranslationPart[] = [
          negatorPart,
          ...subjectParts,
          habitualPart,
          verbPart,
        ];
        if (hasHabitualMarkerInSentence) {
          branches.push(
            ...buildBranches(habitualWithParticle, objectSequences),
            ...buildBranches(habitualNoParticle, objectSequences)
          );
          if (originSequences) {
            originBranches.push(
              ...buildBranches(habitualWithParticle, originSequences),
              ...buildBranches(habitualNoParticle, originSequences)
            );
          }
          if (causeSequences) {
            causeBranches.push(
              ...buildBranches(habitualWithParticle, causeSequences),
              ...buildBranches(habitualNoParticle, causeSequences)
            );
          }
          if (actVerbSequences) {
            actVerbBranches.push(
              ...buildBranches(habitualWithParticle, actVerbSequences),
              ...buildBranches(habitualNoParticle, actVerbSequences)
            );
          }
          if (purposeSequences) {
            purposeBranches.push(
              ...buildBranches(habitualWithParticle, purposeSequences),
              ...buildBranches(habitualNoParticle, purposeSequences)
            );
          }
          if (belongingPurposeSequences) {
            belongingPurposeBranches.push(
              ...buildBranches(habitualWithParticle, belongingPurposeSequences),
              ...buildBranches(habitualNoParticle, belongingPurposeSequences)
            );
          }
          if (belongingAboutSequences) {
            belongingAboutBranches.push(
              ...buildBranches(habitualWithParticle, belongingAboutSequences),
              ...buildBranches(habitualNoParticle, belongingAboutSequences)
            );
          }
          if (aboutAltSequences) {
            aboutAltBranches.push(
              ...buildBranches(habitualWithParticle, aboutAltSequences),
              ...buildBranches(habitualNoParticle, aboutAltSequences)
            );
          }
          if (indirectSequences) {
            indirectBranches.push(
              ...buildBranches(habitualWithParticle, indirectSequences),
              ...buildBranches(habitualNoParticle, indirectSequences)
            );
          }
          if (instrumentalSequences) {
            instrumentalBranches.push(
              ...buildBranches(habitualWithParticle, instrumentalSequences),
              ...buildBranches(habitualNoParticle, instrumentalSequences)
            );
          }
        } else {
          branches.push(...buildBranches(parts, objectSequences));
          habitualBranches.push(
            ...buildBranches(habitualWithParticle, objectSequences),
            ...buildBranches(habitualNoParticle, objectSequences)
          );
          if (originSequences) {
            originBranches.push(...buildBranches(parts, originSequences));
          }
          if (causeSequences) {
            causeBranches.push(...buildBranches(parts, causeSequences));
          }
          if (actVerbSequences) {
            actVerbBranches.push(...buildBranches(parts, actVerbSequences));
          }
          if (purposeSequences) {
            purposeBranches.push(...buildBranches(parts, purposeSequences));
          }
          if (belongingPurposeSequences) {
            belongingPurposeBranches.push(
              ...buildBranches(parts, belongingPurposeSequences)
            );
          }
          if (belongingAboutSequences) {
            belongingAboutBranches.push(
              ...buildBranches(parts, belongingAboutSequences)
            );
          }
          if (aboutAltSequences) {
            aboutAltBranches.push(...buildBranches(parts, aboutAltSequences));
          }
          if (indirectSequences) {
            indirectBranches.push(...buildBranches(parts, indirectSequences));
          }
          if (instrumentalSequences) {
            instrumentalBranches.push(
              ...buildBranches(parts, instrumentalSequences)
            );
          }
        }
        hasPresentNegation = true;
      }
    }

    if (
      !hasShouldHaveMarkerInSentence &&
      (pastSimpleMatches.length > 0 || pastContinuousMatches.length > 0)
    ) {
      const timeContext = resolvePastTimeContext(
        ir.tokens,
        verbIndex,
        sourceLang,
        state.skipIndices
      );
      const buildPastNegBranches = (
        kind: "same-day" | "yesterday",
        match: VerbMatch,
        isProgressive: boolean,
        includeMarker: boolean
      ): TranslationPart[] => {
        const parts: TranslationPart[] = [];
        const basePersons =
          state.lastSubject?.persons ??
          (pastHabitualTrigger ? pastHabitualPersons : null) ??
          match.personNumbers;
        const persons =
          basePersons.length > 0 ? expandInclusiveExclusive(basePersons) : [];
        const subjectParts = hasSubjectBeforeNegator
          ? []
          : helpers.buildImpliedSubjectParts(
              state.lastSubject?.persons ?? persons,
              state.lastSubject?.sourceToken
            );
        parts.push(...subjectParts);
        if (isProgressive) {
          if (kind === "same-day") {
            parts.push(
              createParticlePart(
                "gana",
                sourceLang,
                "VERB_PARTICLE_PAST_PROGRESSIVE"
              )
            );
          }
        }
        parts.push(
          createParticlePart(
            "yaka",
            sourceLang,
            "VERB_NEGATOR",
            ["bäyŋu"],
            negatorSource
          )
        );
        if (isProgressive && kind === "yesterday") {
          parts.push(
            createParticlePart("gi", sourceLang, "VERB_PARTICLE_NEG")
          );
        }
        const gup =
          kind === "same-day"
            ? match.entry.gupForms[2] ?? match.entry.gup
            : match.entry.gupForms[1] ?? match.entry.gup;
        const explanationKey =
          kind === "same-day"
            ? isProgressive
              ? "VERB_PAST_SAME_DAY_PROGRESSIVE_NEG"
              : "VERB_PAST_SAME_DAY_NEG"
            : isProgressive
              ? "VERB_PAST_YESTERDAY_PROGRESSIVE_NEG"
              : "VERB_PAST_YESTERDAY_NEG";
        parts.push(createVerbPart(match, sourceLang, gup, explanationKey));
        return parts;
      };

      const sameDayBranches: TranslationPart[][] = [];
      const yesterdayBranches: TranslationPart[][] = [];
      const purposeSameDayPastNegBranches: TranslationPart[][] = [];
      const purposeYesterdayPastNegBranches: TranslationPart[][] = [];
      const causeSameDayPastNegBranches: TranslationPart[][] = [];
      const causeYesterdayPastNegBranches: TranslationPart[][] = [];
      const actVerbSameDayPastNegBranches: TranslationPart[][] = [];
      const actVerbYesterdayPastNegBranches: TranslationPart[][] = [];
      const belongingPurposeSameDayPastNegBranches: TranslationPart[][] = [];
      const belongingPurposeYesterdayPastNegBranches: TranslationPart[][] = [];
      const belongingAboutSameDayPastNegBranches: TranslationPart[][] = [];
      const belongingAboutYesterdayPastNegBranches: TranslationPart[][] = [];
      const aboutAltSameDayPastNegBranches: TranslationPart[][] = [];
      const aboutAltYesterdayPastNegBranches: TranslationPart[][] = [];
      const indirectSameDayPastNegBranches: TranslationPart[][] = [];
      const indirectYesterdayPastNegBranches: TranslationPart[][] = [];
      const pastHabitualBranches: TranslationPart[][] = [];
      const pastMightNegBranches: TranslationPart[][] = [];
      const buildPastHabitualNegBranches = (match: VerbMatch) => {
        const subjectParts = hasSubjectBeforeNegator
          ? []
          : helpers.buildImpliedSubjectParts(
              state.lastSubject?.persons ??
                expandInclusiveExclusive(match.personNumbers),
              state.lastSubject?.sourceToken
            );
        const negatorPart = createParticlePart(
          "yaka",
          sourceLang,
          "VERB_NEGATOR",
          ["bäyŋu"],
          negatorSource
        );
        const habitualPart = createParticlePart(
          "ŋuli",
          sourceLang,
          "VERB_PARTICLE_HABITUAL"
        );
        const ganhaPart = createParticlePart(
          "ganha",
          sourceLang,
          "VERB_PARTICLE_PAST_HABITUAL"
        );
        const verbForms: Array<{ gup: string; alt?: string }> = [];
        const gup3 = match.entry.gupForms[3];
        const gup4 = match.entry.gupForms[4];
        if (gup3) {
          verbForms.push({ gup: gup3, alt: match.altGupForms?.[3] });
        }
        if (gup4) {
          verbForms.push({ gup: gup4, alt: match.altGupForms?.[4] });
        }
        for (const form of verbForms) {
          const verbPart = createVerbPart(
            match,
            sourceLang,
            form.gup,
            "VERB_PAST_HABITUAL_NEG",
            form.alt ? [form.alt] : undefined
          );
          const baseParts: TranslationPart[] = [
            ...subjectParts,
            negatorPart,
            habitualPart,
            verbPart,
          ];
          const ganaParts: TranslationPart[] = [
            ...subjectParts,
            negatorPart,
            habitualPart,
            ganhaPart,
            verbPart,
          ];
          pastHabitualBranches.push(
            ...buildBranches(baseParts, objectSequences)
          );
          pastHabitualBranches.push(
            ...buildBranches(ganaParts, objectSequences)
          );
        }
      };

      for (const match of pastSimpleMatches) {
        expandInclusiveExclusive(match.personNumbers).forEach((person) =>
          negationPersons.add(person)
        );
        const partsSame = buildPastNegBranches("same-day", match, false, false);
        const partsYest = buildPastNegBranches("yesterday", match, false, false);
        sameDayBranches.push(...buildBranches(partsSame, objectSequences));
        yesterdayBranches.push(...buildBranches(partsYest, objectSequences));
        if (pastHabitualTrigger) {
          buildPastHabitualNegBranches(match);
        }
        if (causeSequences) {
          causeSameDayPastNegBranches.push(
            ...buildBranches(partsSame, causeSequences)
          );
          causeYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, causeSequences)
          );
        }
        if (actVerbSequences) {
          actVerbSameDayPastNegBranches.push(
            ...buildBranches(partsSame, actVerbSequences)
          );
          actVerbYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, actVerbSequences)
          );
        }
        if (purposeSequences) {
          purposeSameDayPastNegBranches.push(
            ...buildBranches(partsSame, purposeSequences)
          );
          purposeYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, purposeSequences)
          );
        }
        if (belongingPurposeSequences) {
          belongingPurposeSameDayPastNegBranches.push(
            ...buildBranches(partsSame, belongingPurposeSequences)
          );
          belongingPurposeYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, belongingPurposeSequences)
          );
        }
        if (belongingAboutSequences) {
          belongingAboutSameDayPastNegBranches.push(
            ...buildBranches(partsSame, belongingAboutSequences)
          );
          belongingAboutYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, belongingAboutSequences)
          );
        }
        if (aboutAltSequences) {
          aboutAltSameDayPastNegBranches.push(
            ...buildBranches(partsSame, aboutAltSequences)
          );
          aboutAltYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, aboutAltSequences)
          );
        }
        if (indirectSequences) {
          indirectSameDayPastNegBranches.push(
            ...buildBranches(partsSame, indirectSequences)
          );
          indirectYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, indirectSequences)
          );
        }
      }
      for (const match of pastContinuousMatches) {
        expandInclusiveExclusive(match.personNumbers).forEach((person) =>
          negationPersons.add(person)
        );
        const partsSame = buildPastNegBranches("same-day", match, true, false);
        const partsYest = buildPastNegBranches("yesterday", match, true, false);
        sameDayBranches.push(...buildBranches(partsSame, objectSequences));
        yesterdayBranches.push(...buildBranches(partsYest, objectSequences));
        if (pastHabitualTrigger) {
          buildPastHabitualNegBranches(match);
        }
        if (causeSequences) {
          causeSameDayPastNegBranches.push(
            ...buildBranches(partsSame, causeSequences)
          );
          causeYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, causeSequences)
          );
        }
        if (actVerbSequences) {
          actVerbSameDayPastNegBranches.push(
            ...buildBranches(partsSame, actVerbSequences)
          );
          actVerbYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, actVerbSequences)
          );
        }
        if (purposeSequences) {
          purposeSameDayPastNegBranches.push(
            ...buildBranches(partsSame, purposeSequences)
          );
          purposeYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, purposeSequences)
          );
        }
        if (belongingPurposeSequences) {
          belongingPurposeSameDayPastNegBranches.push(
            ...buildBranches(partsSame, belongingPurposeSequences)
          );
          belongingPurposeYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, belongingPurposeSequences)
          );
        }
        if (belongingAboutSequences) {
          belongingAboutSameDayPastNegBranches.push(
            ...buildBranches(partsSame, belongingAboutSequences)
          );
          belongingAboutYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, belongingAboutSequences)
          );
        }
        if (aboutAltSequences) {
          aboutAltSameDayPastNegBranches.push(
            ...buildBranches(partsSame, aboutAltSequences)
          );
          aboutAltYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, aboutAltSequences)
          );
        }
        if (indirectSequences) {
          indirectSameDayPastNegBranches.push(
            ...buildBranches(partsSame, indirectSequences)
          );
          indirectYesterdayPastNegBranches.push(
            ...buildBranches(partsYest, indirectSequences)
          );
        }
      }

      if (hasMightMarkerInSentence) {
        const pastMatches = [...pastSimpleMatches, ...pastContinuousMatches];
        for (const match of pastMatches) {
          const persons = expandInclusiveExclusive(match.personNumbers);
          const subjectParts = hasSubjectBeforeNegator
            ? []
            : helpers.buildImpliedSubjectParts(
                state.lastSubject?.persons ?? persons,
                state.lastSubject?.sourceToken
              );
          const negatorPart = createParticlePart(
            "yaka",
            sourceLang,
            "VERB_NEGATOR",
            ["bäyŋu"],
            negatorSource
          );
          const balaŋuPart = createParticlePart(
            "balaŋu",
            sourceLang,
            "VERB_PARTICLE_MIGHT"
          );
          const banaPart = createParticlePart(
            "bäna",
            sourceLang,
            "VERB_PARTICLE_MIGHT_BANA"
          );
          const pastGup =
            match.entry.gupForms[3] ??
            match.entry.gupForms[0] ??
            match.entry.gup;
          const pastAlt = new Set<string>();
          if (match.entry.gupForms[4]) pastAlt.add(match.entry.gupForms[4]);
          if (match.altGupForms?.[3]) pastAlt.add(match.altGupForms[3]);
          if (match.altGupForms?.[4]) pastAlt.add(match.altGupForms[4]);
          const pastPart = createVerbPart(
            match,
            sourceLang,
            pastGup,
            "VERB_MIGHT_PAST",
            pastAlt.size > 0 ? Array.from(pastAlt) : undefined
          );
          const parts: TranslationPart[] = [
            ...subjectParts,
            negatorPart,
            banaPart,
            balaŋuPart,
            pastPart,
          ];
          pastMightNegBranches.push(...buildBranches(parts, objectSequences));
        }
      }

      const expandWithSubjectReorder = (
        branchList: TranslationPart[][],
        groupId?: VariantGroup
      ): TranslationResult["combinations"] => {
        return expandBranchesWithSubject(branchList, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-marker",
          variantGroup: groupId ?? null,
        });
      };

      if (timeContext === "today") {
        const expanded = expandWithSubjectReorder(sameDayBranches);
        const expandedHabitual =
          pastHabitualBranches.length > 0
            ? expandWithSubjectReorder(
                pastHabitualBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedMight =
          pastMightNegBranches.length > 0
            ? expandWithSubjectReorder(
                pastMightNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedPurpose =
          purposeSameDayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                purposeSameDayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeSameDayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                causeSameDayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbSameDayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                actVerbSameDayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedBelongingPurpose =
          belongingPurposeSameDayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                belongingPurposeSameDayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedBelongingAbout =
          belongingAboutSameDayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                belongingAboutSameDayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedAboutAlt =
          aboutAltSameDayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                aboutAltSameDayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedIndirect =
          indirectSameDayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                indirectSameDayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        if (expanded.length > 0) {
          state.combinations = appendHaveMirri([
            ...expanded,
            ...expandedHabitual,
            ...expandedMight,
            ...expandedCause,
            ...expandedPurpose,
            ...expandedActVerb,
            ...expandedBelongingPurpose,
            ...expandedBelongingAbout,
            ...expandedAboutAlt,
            ...expandedIndirect,
          ]);
          if (
            expandedPurpose.length > 0 ||
            expandedCause.length > 0 ||
            expandedActVerb.length > 0 ||
            expandedBelongingPurpose.length > 0 ||
            expandedBelongingAbout.length > 0 ||
            expandedAboutAlt.length > 0 ||
            expandedIndirect.length > 0 ||
            expandedHabitual.length > 0 ||
            expandedMight.length > 0 ||
            purposeHasAmbiguity ||
            causeHasAmbiguity ||
            actVerbHasAmbiguity ||
            belongingPurposeHasAmbiguity ||
            belongingAboutHasAmbiguity ||
            aboutAltHasAmbiguity ||
            indirectHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          if (expandedHaveMirri.length > 0 || haveMirriHasAmbiguity) {
            state.hasAmbiguity = true;
          }
          hasPastNegation = true;
        }
      } else if (timeContext === "yesterday") {
        const expanded = expandWithSubjectReorder(yesterdayBranches);
        const expandedHabitual =
          pastHabitualBranches.length > 0
            ? expandWithSubjectReorder(
                pastHabitualBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedMight =
          pastMightNegBranches.length > 0
            ? expandWithSubjectReorder(
                pastMightNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedPurpose =
          purposeYesterdayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                purposeYesterdayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeYesterdayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                causeYesterdayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbYesterdayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                actVerbYesterdayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedBelongingPurpose =
          belongingPurposeYesterdayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                belongingPurposeYesterdayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedBelongingAbout =
          belongingAboutYesterdayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                belongingAboutYesterdayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedAboutAlt =
          aboutAltYesterdayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                aboutAltYesterdayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedIndirect =
          indirectYesterdayPastNegBranches.length > 0
            ? expandWithSubjectReorder(
                indirectYesterdayPastNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        if (expanded.length > 0) {
          state.combinations = appendHaveMirri([
            ...expanded,
            ...expandedHabitual,
            ...expandedMight,
            ...expandedCause,
            ...expandedPurpose,
            ...expandedActVerb,
            ...expandedBelongingPurpose,
            ...expandedBelongingAbout,
            ...expandedAboutAlt,
            ...expandedIndirect,
          ]);
          if (
            expandedPurpose.length > 0 ||
            expandedCause.length > 0 ||
            expandedActVerb.length > 0 ||
            expandedBelongingPurpose.length > 0 ||
            expandedBelongingAbout.length > 0 ||
            expandedAboutAlt.length > 0 ||
            expandedIndirect.length > 0 ||
            expandedHabitual.length > 0 ||
            expandedMight.length > 0 ||
            purposeHasAmbiguity ||
            causeHasAmbiguity ||
            actVerbHasAmbiguity ||
            belongingPurposeHasAmbiguity ||
            belongingAboutHasAmbiguity ||
            aboutAltHasAmbiguity ||
            indirectHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          if (expandedHaveMirri.length > 0 || haveMirriHasAmbiguity) {
            state.hasAmbiguity = true;
          }
          hasPastNegation = true;
        }
      } else {
        const sameDayGroup: VariantGroup = helpers.nextVariantGroup("box");
        const yesterdayGroup: VariantGroup = helpers.nextVariantGroup("box");
        const expandedSame = expandWithSubjectReorder(
          sameDayBranches,
          sameDayGroup
        );
        const expandedYesterday = expandWithSubjectReorder(
          yesterdayBranches,
          yesterdayGroup
        );
        const expandedHabitual =
          pastHabitualBranches.length > 0
            ? expandWithSubjectReorder(
                pastHabitualBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedMight =
          pastMightNegBranches.length > 0
            ? expandWithSubjectReorder(
                pastMightNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const purposeAllBranches = [
          ...purposeSameDayPastNegBranches,
          ...purposeYesterdayPastNegBranches,
        ];
        const causeAllBranches = [
          ...causeSameDayPastNegBranches,
          ...causeYesterdayPastNegBranches,
        ];
        const actVerbAllBranches = [
          ...actVerbSameDayPastNegBranches,
          ...actVerbYesterdayPastNegBranches,
        ];
        const expandedPurpose =
          purposeAllBranches.length > 0
            ? expandWithSubjectReorder(
                purposeAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeAllBranches.length > 0
            ? expandWithSubjectReorder(
                causeAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbAllBranches.length > 0
            ? expandWithSubjectReorder(
                actVerbAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const belongingPurposeAllBranches = [
          ...belongingPurposeSameDayPastNegBranches,
          ...belongingPurposeYesterdayPastNegBranches,
        ];
        const expandedBelongingPurpose =
          belongingPurposeAllBranches.length > 0
            ? expandWithSubjectReorder(
                belongingPurposeAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const belongingAboutAllBranches = [
          ...belongingAboutSameDayPastNegBranches,
          ...belongingAboutYesterdayPastNegBranches,
        ];
        const expandedBelongingAbout =
          belongingAboutAllBranches.length > 0
            ? expandWithSubjectReorder(
                belongingAboutAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const aboutAltAllBranches = [
          ...aboutAltSameDayPastNegBranches,
          ...aboutAltYesterdayPastNegBranches,
        ];
        const expandedAboutAlt =
          aboutAltAllBranches.length > 0
            ? expandWithSubjectReorder(
                aboutAltAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const indirectAllBranches = [
          ...indirectSameDayPastNegBranches,
          ...indirectYesterdayPastNegBranches,
        ];
        const expandedIndirect =
          indirectAllBranches.length > 0
            ? expandWithSubjectReorder(
                indirectAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        state.combinations = appendHaveMirri([
          ...expandedSame,
          ...expandedYesterday,
          ...expandedHabitual,
          ...expandedMight,
          ...expandedCause,
          ...expandedPurpose,
          ...expandedActVerb,
          ...expandedBelongingPurpose,
          ...expandedBelongingAbout,
          ...expandedAboutAlt,
          ...expandedIndirect,
        ]);
        if (
          expandedSame.length > 0 ||
          expandedYesterday.length > 0 ||
          expandedMight.length > 0
        ) {
          hasPastNegation = true;
          state.hasAmbiguity = true;
          if (
            expandedBelongingPurpose.length > 0 ||
            expandedBelongingAbout.length > 0 ||
            expandedAboutAlt.length > 0 ||
            expandedHabitual.length > 0 ||
            expandedMight.length > 0 ||
            belongingPurposeHasAmbiguity ||
            belongingAboutHasAmbiguity ||
            aboutAltHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          if (expandedHaveMirri.length > 0 || haveMirriHasAmbiguity) {
            state.hasAmbiguity = true;
          }
        }
      }
    }

    if (hasPastNegation) {
      const connectorAnchor = verbIndex + verbConsumed - 1 + objectConsumed;
      state.lastConnectorAnchor = connectorAnchor;
      const subjectPersons =
        hasSubjectBeforeNegator && state.lastSubject?.persons
          ? state.lastSubject.persons
          : Array.from(negationPersons);
      helpers.updateLastVerbSubject(
        subjectPersons.length > 0 ? subjectPersons : null,
        connectorAnchor,
        state.lastSubject?.sourceToken
      );
      return { handled: true, nextIndex: connectorAnchor };
    }

    if (futureMatches.length > 0) {
      const timeContext = resolveFutureTimeContext(
        ir.tokens,
        verbIndex,
        sourceLang,
        state.skipIndices
      );
      const buildFutureNegBranches = (
        kind: "same-day" | "tomorrow",
        match: VerbMatch
      ): TranslationPart[] => {
        const parts: TranslationPart[] = [];
        const subjectParts = hasSubjectBeforeNegator
          ? []
          : helpers.buildImpliedSubjectParts(
              state.lastSubject?.persons ??
                expandInclusiveExclusive(match.personNumbers),
              state.lastSubject?.sourceToken
            );
        parts.push(...subjectParts);
        parts.push(
          createParticlePart("dhu", sourceLang, "VERB_PARTICLE_FUTURE", [
            "yurru",
          ])
        );
        parts.push(
          createParticlePart(
            "yaka",
            sourceLang,
            "VERB_NEGATOR",
            ["bäyŋu"],
            negatorSource
          )
        );
        const gup =
          kind === "same-day"
            ? match.entry.gupForms[0] ?? match.entry.gup
            : match.entry.gupForms[1] ?? match.entry.gup;
        const explanationKey =
          kind === "same-day"
            ? "VERB_FUTURE_SAME_DAY_NEG"
            : "VERB_FUTURE_TOMORROW_NEG";
        parts.push(createVerbPart(match, sourceLang, gup, explanationKey));
        return parts;
      };

      const sameDayBranches: TranslationPart[][] = [];
      const tomorrowBranches: TranslationPart[][] = [];
      const purposeSameDayFutureNegBranches: TranslationPart[][] = [];
      const purposeTomorrowFutureNegBranches: TranslationPart[][] = [];
      const causeSameDayFutureNegBranches: TranslationPart[][] = [];
      const causeTomorrowFutureNegBranches: TranslationPart[][] = [];
      const actVerbSameDayFutureNegBranches: TranslationPart[][] = [];
      const actVerbTomorrowFutureNegBranches: TranslationPart[][] = [];
      const belongingPurposeSameDayFutureNegBranches: TranslationPart[][] = [];
      const belongingPurposeTomorrowFutureNegBranches: TranslationPart[][] = [];
      const belongingAboutSameDayFutureNegBranches: TranslationPart[][] = [];
      const belongingAboutTomorrowFutureNegBranches: TranslationPart[][] = [];
      const aboutAltSameDayFutureNegBranches: TranslationPart[][] = [];
      const aboutAltTomorrowFutureNegBranches: TranslationPart[][] = [];
      const indirectSameDayFutureNegBranches: TranslationPart[][] = [];
      const indirectTomorrowFutureNegBranches: TranslationPart[][] = [];
      for (const match of futureMatches) {
        const persons = expandInclusiveExclusive(match.personNumbers);
        persons.forEach((person) => negationPersons.add(person));
        const partsSame = buildFutureNegBranches("same-day", match);
        const partsTomorrow = buildFutureNegBranches("tomorrow", match);
        sameDayBranches.push(...buildBranches(partsSame, objectSequences));
        tomorrowBranches.push(...buildBranches(partsTomorrow, objectSequences));
        if (causeSequences) {
          causeSameDayFutureNegBranches.push(
            ...buildBranches(partsSame, causeSequences)
          );
          causeTomorrowFutureNegBranches.push(
            ...buildBranches(partsTomorrow, causeSequences)
          );
        }
        if (actVerbSequences) {
          actVerbSameDayFutureNegBranches.push(
            ...buildBranches(partsSame, actVerbSequences)
          );
          actVerbTomorrowFutureNegBranches.push(
            ...buildBranches(partsTomorrow, actVerbSequences)
          );
        }
        if (purposeSequences) {
          purposeSameDayFutureNegBranches.push(
            ...buildBranches(partsSame, purposeSequences)
          );
          purposeTomorrowFutureNegBranches.push(
            ...buildBranches(partsTomorrow, purposeSequences)
          );
        }
        if (belongingPurposeSequences) {
          belongingPurposeSameDayFutureNegBranches.push(
            ...buildBranches(partsSame, belongingPurposeSequences)
          );
          belongingPurposeTomorrowFutureNegBranches.push(
            ...buildBranches(partsTomorrow, belongingPurposeSequences)
          );
        }
        if (belongingAboutSequences) {
          belongingAboutSameDayFutureNegBranches.push(
            ...buildBranches(partsSame, belongingAboutSequences)
          );
          belongingAboutTomorrowFutureNegBranches.push(
            ...buildBranches(partsTomorrow, belongingAboutSequences)
          );
        }
        if (aboutAltSequences) {
          aboutAltSameDayFutureNegBranches.push(
            ...buildBranches(partsSame, aboutAltSequences)
          );
          aboutAltTomorrowFutureNegBranches.push(
            ...buildBranches(partsTomorrow, aboutAltSequences)
          );
        }
        if (indirectSequences) {
          indirectSameDayFutureNegBranches.push(
            ...buildBranches(partsSame, indirectSequences)
          );
          indirectTomorrowFutureNegBranches.push(
            ...buildBranches(partsTomorrow, indirectSequences)
          );
        }
      }

      const expandWithSubjectReorder = (
        branchList: TranslationPart[][],
        groupId?: VariantGroup
      ): TranslationResult["combinations"] => {
        return expandBranchesWithSubject(branchList, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "start",
          variantGroup: groupId ?? null,
        });
      };

      if (timeContext === "same-day") {
        const expanded = expandWithSubjectReorder(sameDayBranches);
        const expandedPurpose =
          purposeSameDayFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                purposeSameDayFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeSameDayFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                causeSameDayFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbSameDayFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                actVerbSameDayFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedBelongingPurpose =
          belongingPurposeSameDayFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                belongingPurposeSameDayFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedBelongingAbout =
          belongingAboutSameDayFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                belongingAboutSameDayFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedAboutAlt =
          aboutAltSameDayFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                aboutAltSameDayFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedIndirect =
          indirectSameDayFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                indirectSameDayFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        if (expanded.length > 0) {
          state.combinations = appendHaveMirri([
            ...expanded,
            ...expandedCause,
            ...expandedPurpose,
            ...expandedActVerb,
            ...expandedBelongingPurpose,
            ...expandedBelongingAbout,
            ...expandedAboutAlt,
            ...expandedIndirect,
          ]);
          if (
            expandedPurpose.length > 0 ||
            expandedCause.length > 0 ||
            expandedActVerb.length > 0 ||
            expandedBelongingPurpose.length > 0 ||
            expandedBelongingAbout.length > 0 ||
            expandedAboutAlt.length > 0 ||
            expandedIndirect.length > 0 ||
            purposeHasAmbiguity ||
            causeHasAmbiguity ||
            actVerbHasAmbiguity ||
            belongingPurposeHasAmbiguity ||
            belongingAboutHasAmbiguity ||
            aboutAltHasAmbiguity ||
            indirectHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          if (expandedHaveMirri.length > 0 || haveMirriHasAmbiguity) {
            state.hasAmbiguity = true;
          }
          hasFutureNegation = true;
        }
      } else if (timeContext === "tomorrow") {
        const expanded = expandWithSubjectReorder(tomorrowBranches);
        const expandedPurpose =
          purposeTomorrowFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                purposeTomorrowFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeTomorrowFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                causeTomorrowFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbTomorrowFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                actVerbTomorrowFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedBelongingPurpose =
          belongingPurposeTomorrowFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                belongingPurposeTomorrowFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedBelongingAbout =
          belongingAboutTomorrowFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                belongingAboutTomorrowFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedAboutAlt =
          aboutAltTomorrowFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                aboutAltTomorrowFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedIndirect =
          indirectTomorrowFutureNegBranches.length > 0
            ? expandWithSubjectReorder(
                indirectTomorrowFutureNegBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        if (expanded.length > 0) {
          state.combinations = appendHaveMirri([
            ...expanded,
            ...expandedCause,
            ...expandedPurpose,
            ...expandedActVerb,
            ...expandedBelongingPurpose,
            ...expandedBelongingAbout,
            ...expandedAboutAlt,
            ...expandedIndirect,
          ]);
          if (
            expandedPurpose.length > 0 ||
            expandedCause.length > 0 ||
            expandedActVerb.length > 0 ||
            expandedBelongingPurpose.length > 0 ||
            expandedBelongingAbout.length > 0 ||
            expandedAboutAlt.length > 0 ||
            expandedIndirect.length > 0 ||
            purposeHasAmbiguity ||
            causeHasAmbiguity ||
            actVerbHasAmbiguity ||
            belongingPurposeHasAmbiguity ||
            belongingAboutHasAmbiguity ||
            aboutAltHasAmbiguity ||
            indirectHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          if (expandedHaveMirri.length > 0 || haveMirriHasAmbiguity) {
            state.hasAmbiguity = true;
          }
          hasFutureNegation = true;
        }
      } else {
        const sameDayGroup: VariantGroup = helpers.nextVariantGroup("box");
        const tomorrowGroup: VariantGroup = helpers.nextVariantGroup("box");
        const expandedSame = expandWithSubjectReorder(
          sameDayBranches,
          sameDayGroup
        );
        const expandedTomorrow = expandWithSubjectReorder(
          tomorrowBranches,
          tomorrowGroup
        );
        const purposeAllBranches = [
          ...purposeSameDayFutureNegBranches,
          ...purposeTomorrowFutureNegBranches,
        ];
        const causeAllBranches = [
          ...causeSameDayFutureNegBranches,
          ...causeTomorrowFutureNegBranches,
        ];
        const actVerbAllBranches = [
          ...actVerbSameDayFutureNegBranches,
          ...actVerbTomorrowFutureNegBranches,
        ];
        const expandedPurpose =
          purposeAllBranches.length > 0
            ? expandWithSubjectReorder(
                purposeAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedCause =
          causeAllBranches.length > 0
            ? expandWithSubjectReorder(
                causeAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const expandedActVerb =
          actVerbAllBranches.length > 0
            ? expandWithSubjectReorder(
                actVerbAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const belongingPurposeAllBranches = [
          ...belongingPurposeSameDayFutureNegBranches,
          ...belongingPurposeTomorrowFutureNegBranches,
        ];
        const expandedBelongingPurpose =
          belongingPurposeAllBranches.length > 0
            ? expandWithSubjectReorder(
                belongingPurposeAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const belongingAboutAllBranches = [
          ...belongingAboutSameDayFutureNegBranches,
          ...belongingAboutTomorrowFutureNegBranches,
        ];
        const expandedBelongingAbout =
          belongingAboutAllBranches.length > 0
            ? expandWithSubjectReorder(
                belongingAboutAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const aboutAltAllBranches = [
          ...aboutAltSameDayFutureNegBranches,
          ...aboutAltTomorrowFutureNegBranches,
        ];
        const expandedAboutAlt =
          aboutAltAllBranches.length > 0
            ? expandWithSubjectReorder(
                aboutAltAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        const indirectAllBranches = [
          ...indirectSameDayFutureNegBranches,
          ...indirectTomorrowFutureNegBranches,
        ];
        const expandedIndirect =
          indirectAllBranches.length > 0
            ? expandWithSubjectReorder(
                indirectAllBranches,
                helpers.nextVariantGroup("box")
              )
            : [];
        state.combinations = appendHaveMirri([
          ...expandedSame,
          ...expandedTomorrow,
          ...expandedCause,
          ...expandedPurpose,
          ...expandedActVerb,
          ...expandedBelongingPurpose,
          ...expandedBelongingAbout,
          ...expandedAboutAlt,
          ...expandedIndirect,
        ]);
        if (expandedSame.length > 0 || expandedTomorrow.length > 0) {
          hasFutureNegation = true;
          state.hasAmbiguity = true;
          if (
            expandedActVerb.length > 0 ||
            expandedBelongingPurpose.length > 0 ||
            expandedBelongingAbout.length > 0 ||
            expandedAboutAlt.length > 0 ||
            actVerbHasAmbiguity ||
            belongingPurposeHasAmbiguity ||
            belongingAboutHasAmbiguity ||
            aboutAltHasAmbiguity
          ) {
            state.hasAmbiguity = true;
          }
          if (expandedHaveMirri.length > 0 || haveMirriHasAmbiguity) {
            state.hasAmbiguity = true;
          }
        }
      }
    }

    if (hasFutureNegation) {
      const connectorAnchor = verbIndex + verbConsumed - 1 + objectConsumed;
      state.lastConnectorAnchor = connectorAnchor;
      const subjectPersons =
        hasSubjectBeforeNegator && state.lastSubject?.persons
          ? state.lastSubject.persons
          : Array.from(negationPersons);
      helpers.updateLastVerbSubject(
        subjectPersons.length > 0 ? subjectPersons : null,
        connectorAnchor,
        state.lastSubject?.sourceToken
      );
      return { handled: true, nextIndex: connectorAnchor };
    }

    const allowImperative =
      negationMatch.allowsImperative &&
      (!hasSubjectBeforeNegator ||
        (sourceLang === "es" && subjMatches.length > 0));
    if (allowImperative) {
      const negImperativeMatches =
        sourceLang === "es" ? subjMatches : imperativeMatches;
      if (negImperativeMatches.length > 0) {
        for (const match of negImperativeMatches) {
          const parts: TranslationPart[] = [
            createParticlePart(
              "yaka",
              sourceLang,
              "VERB_NEGATOR",
              undefined,
              negatorSource
            ),
            createVerbPart(
              match,
              sourceLang,
              match.entry.gupForms[1] ?? match.entry.gup,
              "VERB_IMPERATIVE_NEG"
            ),
          ];
          branches.push(...buildBranches(parts, objectSequences));
          if (originSequences) {
            originBranches.push(...buildBranches(parts, originSequences));
          }
          if (causeSequences) {
            causeBranches.push(...buildBranches(parts, causeSequences));
          }
          if (actVerbSequences) {
            actVerbBranches.push(...buildBranches(parts, actVerbSequences));
          }
          if (purposeSequences) {
            purposeBranches.push(...buildBranches(parts, purposeSequences));
          }
          if (belongingPurposeSequences) {
            belongingPurposeBranches.push(
              ...buildBranches(parts, belongingPurposeSequences)
            );
          }
          if (belongingAboutSequences) {
            belongingAboutBranches.push(
              ...buildBranches(parts, belongingAboutSequences)
            );
          }
          if (aboutAltSequences) {
            aboutAltBranches.push(...buildBranches(parts, aboutAltSequences));
          }
          if (indirectSequences) {
            indirectBranches.push(...buildBranches(parts, indirectSequences));
          }
          if (instrumentalSequences) {
            instrumentalBranches.push(...buildBranches(parts, instrumentalSequences));
          }

          const base =
            match.entry.gupForms[3] ??
            match.entry.gupForms[1] ??
            match.entry.gup;
          const altBase =
            match.altGupForms?.[3] ?? match.altGupForms?.[1];
          const mirriVerb = createVerbPart(
            match,
            sourceLang,
            applySuffixToGup(base, "miriw"),
            "VERB_IMPERATIVE_NEG_MIRIW",
            altBase ? [applySuffixToGup(altBase, "miriw")] : undefined
          );
          const mirriParts: TranslationPart[] = [
            createParticlePart(
              "yaka",
              sourceLang,
              "VERB_NEGATOR",
              undefined,
              negatorSource
            ),
            mirriVerb,
          ];
          imperativeMirriBranches.push(
            ...buildBranches(mirriParts, objectSequences)
          );
          if (originSequences) {
            imperativeMirriBranches.push(
              ...buildBranches(mirriParts, originSequences)
            );
          }
          if (causeSequences) {
            imperativeMirriBranches.push(
              ...buildBranches(mirriParts, causeSequences)
            );
          }
          if (actVerbSequences) {
            imperativeMirriBranches.push(
              ...buildBranches(mirriParts, actVerbSequences)
            );
          }
          if (purposeSequences) {
            imperativeMirriBranches.push(
              ...buildBranches(mirriParts, purposeSequences)
            );
          }
          if (belongingPurposeSequences) {
            imperativeMirriBranches.push(
              ...buildBranches(mirriParts, belongingPurposeSequences)
            );
          }
          if (belongingAboutSequences) {
            imperativeMirriBranches.push(
              ...buildBranches(mirriParts, belongingAboutSequences)
            );
          }
          if (aboutAltSequences) {
            imperativeMirriBranches.push(
              ...buildBranches(mirriParts, aboutAltSequences)
            );
          }
          if (indirectSequences) {
            imperativeMirriBranches.push(
              ...buildBranches(mirriParts, indirectSequences)
            );
          }
          if (instrumentalSequences) {
            imperativeMirriBranches.push(
              ...buildBranches(mirriParts, instrumentalSequences)
            );
          }
        }
      }
    }

    if (hasMightMarkerInSentence) {
      const seen = new Set<string>();
      const candidates = [
        ...presentMatches,
        ...pastSimpleMatches,
        ...pastContinuousMatches,
        ...subjMatches,
        ...futureMatches,
        ...infinitiveMatches,
      ];
      for (const match of candidates) {
        const key = `${match.entry.gup}|${match.kind}`;
        if (seen.has(key)) continue;
        seen.add(key);
        buildMightNegBranches(match);
      }
      if (mightBranches.length === 0) {
        const pastMatches = [...pastSimpleMatches, ...pastContinuousMatches];
        for (const match of pastMatches) {
          buildMightNegBranches(match);
        }
      }
    }

    if (hasShouldHaveMarkerInSentence) {
      const seen = new Set<string>();
      const candidates = [
        ...presentMatches,
        ...pastSimpleMatches,
        ...pastContinuousMatches,
        ...futureMatches,
        ...infinitiveMatches,
        ...subjMatches,
      ];
      for (const match of candidates) {
        const key = `${match.entry.gup}|${match.kind}`;
        if (seen.has(key)) continue;
        seen.add(key);
        buildShouldHaveNegBranches(match);
      }
    }

    if (hasShouldMarkerInSentence) {
      const seen = new Set<string>();
      const candidates = [
        ...presentMatches,
        ...futureMatches,
        ...infinitiveMatches,
        ...subjMatches,
      ];
      for (const match of candidates) {
        const key = `${match.entry.gup}|${match.kind}`;
        if (seen.has(key)) continue;
        seen.add(key);
        buildShouldNegBranches(match);
      }
    }

    if (
      branches.length > 0 ||
      modalBranches.length > 0 ||
      mightBranches.length > 0 ||
      shouldBranches.length > 0 ||
      shouldHaveBranches.length > 0 ||
      originBranches.length > 0 ||
      causeBranches.length > 0 ||
      purposeBranches.length > 0 ||
      imperativeMirriBranches.length > 0 ||
      indirectBranches.length > 0 ||
      instrumentalBranches.length > 0
    ) {
      const baseGroupId = objectDropAmbiguity
        ? helpers.nextVariantGroup("dropdown")
        : null;

      const expandNegationBranches = (
        branchList: TranslationPart[][],
        groupId?: VariantGroup,
        combosOverride?: TranslationResult["combinations"]
      ): TranslationResult["combinations"] => {
        const variantGroup = groupId ?? baseGroupId ?? null;
        const combos = combosOverride ?? state.combinations;
        return expandBranchesWithSubject(branchList, {
          append: helpers.appendPartsToCombinations,
          combos,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-first",
          variantGroup,
          skipInsertWhen: (branch) =>
            branch.some((part) =>
              (part.explanations ?? []).some(
                (exp) =>
                  exp.key.startsWith("PRONOUN_SUBJECT") ||
                  exp.key === "SUBJECT_IMPLIED"
              )
            ),
        });
      };

      const expandModalBranches = (
        branchList: TranslationPart[][],
        groupId?: VariantGroup
      ): TranslationResult["combinations"] => {
        return expandBranchesWithSubject(branchList, {
          append: helpers.appendPartsToCombinations,
          combos: state.combinations,
          hasSubjectInCombos: Boolean(hasSubjectBeforeNegator),
          subjectInsertMode: "after-first",
          variantGroup: groupId ?? null,
        });
      };

      const expandedNormal =
        branches.length > 0 ? expandNegationBranches(branches) : [];
      const habitualGroup: VariantGroup | null =
        habitualBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedHabitual =
        habitualBranches.length > 0 && habitualGroup
          ? expandNegationBranches(habitualBranches, habitualGroup)
          : [];
      const mightGroup: VariantGroup | null =
        mightBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedMight =
        mightBranches.length > 0 && mightGroup
          ? expandNegationBranches(mightBranches, mightGroup)
          : [];
      const shouldGroup: VariantGroup | null =
        shouldBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedShould =
        shouldBranches.length > 0 && shouldGroup
          ? expandNegationBranches(shouldBranches, shouldGroup)
          : [];
      const shouldHaveGroup: VariantGroup | null =
        shouldHaveBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedShouldHave =
        shouldHaveBranches.length > 0 && shouldHaveGroup
          ? expandNegationBranches(shouldHaveBranches, shouldHaveGroup)
          : [];
      const originGroup: VariantGroup | null =
        originBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedOrigin =
        originBranches.length > 0 && originGroup
          ? expandNegationBranches(originBranches, originGroup)
          : [];
      const purposeGroup: VariantGroup | null =
        purposeBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedPurpose =
        purposeBranches.length > 0 && purposeGroup
          ? expandNegationBranches(purposeBranches, purposeGroup)
          : [];
      const causeGroup: VariantGroup | null =
        causeBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedCause =
        causeBranches.length > 0 && causeGroup
          ? expandNegationBranches(causeBranches, causeGroup)
          : [];
      const actVerbGroup: VariantGroup | null =
        actVerbBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedActVerb =
        actVerbBranches.length > 0 && actVerbGroup
          ? expandNegationBranches(actVerbBranches, actVerbGroup)
          : [];
      const imperativeMirriGroup: VariantGroup | null =
        imperativeMirriBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedImperativeMirri =
        imperativeMirriBranches.length > 0 && imperativeMirriGroup
          ? expandNegationBranches(imperativeMirriBranches, imperativeMirriGroup)
          : [];
      const belongingPurposeGroup: VariantGroup | null =
        belongingPurposeBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedBelongingPurpose =
        belongingPurposeBranches.length > 0 && belongingPurposeGroup
          ? expandNegationBranches(belongingPurposeBranches, belongingPurposeGroup)
          : [];
      const belongingAboutGroup: VariantGroup | null =
        belongingAboutBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedBelongingAbout =
        belongingAboutBranches.length > 0 && belongingAboutGroup
          ? expandNegationBranches(belongingAboutBranches, belongingAboutGroup)
          : [];
      const aboutAltGroup: VariantGroup | null =
        aboutAltBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedAboutAlt =
        aboutAltBranches.length > 0 && aboutAltGroup
          ? expandNegationBranches(aboutAltBranches, aboutAltGroup)
          : [];
      const indirectGroup: VariantGroup | null =
        indirectBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedIndirect =
        indirectBranches.length > 0 && indirectGroup
          ? expandNegationBranches(indirectBranches, indirectGroup)
          : [];
      const instrumentalGroup: VariantGroup | null =
        instrumentalBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedInstrumental =
        instrumentalBranches.length > 0 && instrumentalGroup
          ? expandNegationBranches(
              instrumentalBranches,
              instrumentalGroup,
              state.combinations.map((combo) => ({
                ...combo,
                parts: stripTrailingSequences(combo.parts, objectSequences),
              }))
            )
          : [];
      const modalGroup: VariantGroup | null =
        modalBranches.length > 0 ? helpers.nextVariantGroup("box") : null;
      const expandedModal =
        modalBranches.length > 0 && modalGroup
          ? expandModalBranches(modalBranches, modalGroup)
          : [];

      const shouldHaveOnly =
        hasShouldHaveMarkerInSentence && shouldHaveBranches.length > 0;
      const shouldOnly =
        !shouldHaveOnly && hasShouldMarkerInSentence && shouldBranches.length > 0;
      if (shouldOnly) {
        expandedNormal.length = 0;
        expandedHabitual.length = 0;
        expandedMight.length = 0;
        expandedModal.length = 0;
      }
      if (shouldHaveOnly) {
        expandedNormal.length = 0;
        expandedHabitual.length = 0;
        expandedMight.length = 0;
        expandedModal.length = 0;
        expandedShould.length = 0;
      }
      if (
        (!shouldOnly && !shouldHaveOnly && branches.length > 1) ||
        (!shouldOnly && !shouldHaveOnly && habitualBranches.length > 0) ||
        (!shouldOnly && !shouldHaveOnly && mightBranches.length > 0) ||
        shouldBranches.length > 0 ||
        shouldHaveBranches.length > 0 ||
        (!shouldOnly && !shouldHaveOnly && modalBranches.length > 0) ||
        originBranches.length > 0 ||
        causeBranches.length > 0 ||
        purposeBranches.length > 0 ||
        actVerbBranches.length > 0 ||
        imperativeMirriBranches.length > 0 ||
        belongingPurposeBranches.length > 0 ||
        belongingAboutBranches.length > 0 ||
        aboutAltBranches.length > 0 ||
        indirectBranches.length > 0 ||
        instrumentalBranches.length > 0 ||
        originHasAmbiguity ||
        causeHasAmbiguity ||
        purposeHasAmbiguity ||
        actVerbHasAmbiguity ||
        belongingPurposeHasAmbiguity ||
        belongingAboutHasAmbiguity ||
        aboutAltHasAmbiguity ||
        indirectHasAmbiguity ||
        instrumentalHasAmbiguity ||
        expandedHaveMirri.length > 0 ||
        haveMirriHasAmbiguity
      ) {
        state.hasAmbiguity = true;
      }

      if (shouldHaveOnly) {
        state.combinations = appendHaveMirri([
          ...expandedShouldHave,
          ...expandedOrigin,
          ...expandedCause,
          ...expandedPurpose,
          ...expandedActVerb,
          ...expandedImperativeMirri,
          ...expandedBelongingPurpose,
          ...expandedBelongingAbout,
          ...expandedAboutAlt,
          ...expandedIndirect,
          ...expandedInstrumental,
        ]);
      } else if (shouldOnly) {
        state.combinations = appendHaveMirri([
          ...expandedShould,
          ...expandedOrigin,
          ...expandedCause,
          ...expandedPurpose,
          ...expandedActVerb,
          ...expandedImperativeMirri,
          ...expandedBelongingPurpose,
          ...expandedBelongingAbout,
          ...expandedAboutAlt,
          ...expandedIndirect,
          ...expandedInstrumental,
        ]);
      } else {
        state.combinations = appendHaveMirri([
          ...expandedNormal,
          ...expandedHabitual,
          ...expandedMight,
          ...expandedShould,
          ...expandedShouldHave,
          ...expandedOrigin,
          ...expandedCause,
          ...expandedPurpose,
          ...expandedActVerb,
          ...expandedImperativeMirri,
          ...expandedBelongingPurpose,
          ...expandedBelongingAbout,
          ...expandedAboutAlt,
          ...expandedIndirect,
          ...expandedInstrumental,
          ...expandedModal,
        ]);
      }

      const verbSpan =
        branches.length > 0 ? verbConsumed : modalMatch?.consumed ?? verbConsumed;
      const objectSpan =
        branches.length > 0 ? objectConsumed : modalObjectConsumed;
      const connectorAnchor = verbIndex + verbSpan - 1 + objectSpan;
      state.lastConnectorAnchor = connectorAnchor;
      if (
        hasPresentNegation ||
        hasPastNegation ||
        hasFutureNegation ||
        modalBranches.length > 0
      ) {
        const subjectPersons =
          hasSubjectBeforeNegator && state.lastSubject?.persons
            ? state.lastSubject.persons
            : negationPersons.size > 0
              ? Array.from(negationPersons)
              : modalMatch
                ? expandInclusiveExclusive(modalMatch.persons)
                : [];
        helpers.updateLastVerbSubject(
          subjectPersons.length > 0 ? subjectPersons : null,
          connectorAnchor,
          state.lastSubject?.sourceToken
        );
      }
      return { handled: true, nextIndex: connectorAnchor };
    }
  }

  return { handled: false };
}
