import { LanguageMode } from "@/app/components/types/components.type";
import type {
  IRSentence,
  TranslationPart,
  TranslationResult,
  VariantGroup,
} from "../../core/types";
import { matchAuxiliaryGerundAt } from "../../logic/verbAux";
import { resolveFutureTimeContext, resolvePastTimeContext } from "../../logic/time";
import {
  PendingObject,
  appendObjectSequences,
  buildObjectSequencesFromPending,
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
  matchPurposePhraseAt,
  shouldAllowAboutLocativeAlt,
  matchLocativePhraseAt,
} from "../../logic/objects";
import {
  buildLocativePart,
  matchLocativeMarkerAt,
  resolveAllativeVerbEntry,
  resolveLocativeVerbEntry,
} from "../../logic/locative";
import {
  buildBranches,
  expandBranchesWithSubject,
  stripTrailingSequences,
} from "../../logic/branching";
import {
  createParticlePart,
  createVerbPart,
} from "../../logic/parts";
import { expandInclusiveExclusive } from "../../logic/subjects";
import { DEFAULT_GERUND_PERSONS } from "../shared";
import type { TranslateHelpers, TranslateState } from "../types";

export function handleAuxGerund(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, state, helpers } = args;
  const auxGerund = matchAuxiliaryGerundAt(ir.tokens, index, sourceLang);
  if (!auxGerund) return { handled: false };

  state.pendingSubjectJoin = false;
  let objectFromPending: PendingObject | null = null;
  if (state.pendingObject && state.pendingObjectIndex === auxGerund.gerundIndex) {
    objectFromPending = state.pendingObject;
    state.pendingObject = null;
    state.pendingObjectIndex = null;
  }
  const hasSubjectImmediate = helpers.hasImmediateSubject(
    state.lastSubject,
    index,
    objectFromPending
  );

  const personsFromAux = auxGerund.auxInfo.persons;
  const lastSubjectPersons = helpers.getSubjectPersons(state.lastSubject);
  const lastVerbPersons = helpers.getSubjectPersons(state.lastVerbSubject);
  const inferredPersons =
    lastSubjectPersons
      ? expandInclusiveExclusive(lastSubjectPersons)
      : personsFromAux.length > 0
        ? personsFromAux
        : lastVerbPersons ?? DEFAULT_GERUND_PERSONS;

  const subjectParts = hasSubjectImmediate
    ? []
    : helpers.buildImpliedSubjectParts(
        inferredPersons,
        state.lastSubject?.sourceToken
      );

  const verbConsumed = auxGerund.gerundIndex - index + 1;
  const objectMatch: PendingObject | null =
    objectFromPending ??
    (auxGerund.attachedObject
      ? { kind: "pronoun", match: auxGerund.attachedObject }
      : null);
  const allowNonHumanDemonstrative = Boolean(auxGerund.gerund.entry.isTransitive);
  const reflexivePersons = auxGerund.gerund.entry.isTransitive
    ? inferredPersons
    : undefined;
  const reflexivePossessivePersons = inferredPersons.length > 0 ? inferredPersons : undefined;
  const reflexivePossessiveOptions = {
    reflexivePersons: reflexivePossessivePersons,
    reflexiveSubjectRepeat: true,
  };
  const preObject = buildObjectSequencesFromPending(objectMatch, sourceLang, {
    allowNonHumanDemonstrative,
    reflexivePersons,
    reflexiveSubjectRepeat: true,
  });
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
    const purposePhrase = matchPurposePhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
    if (purposePhrase) {
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

  resolvedEntry = resolveLocativeVerbEntry(resolvedEntry, locativeMatch);
  const gerundMatch =
    resolvedEntry === auxGerund.gerund.entry
      ? auxGerund.gerund
      : { ...auxGerund.gerund, entry: resolvedEntry };

  helpers.maybeApplyAgentSuffix(
    gerundMatch.entry.isTransitive,
    hasSubjectImmediate
  );

  if (auxGerund.auxInfo.tense === "past") {
    const timeContext = resolvePastTimeContext(
      ir.tokens,
      auxGerund.gerundIndex,
      sourceLang,
      state.skipIndices
    );
    const buildPastParts = (
      kind: "same-day" | "yesterday",
      includeMarker: boolean
    ): TranslationPart[] => {
      const parts: TranslationPart[] = [];
      parts.push(...subjectParts);
      const particle = kind === "same-day" ? "gana" : "ga";
      parts.push(
        createParticlePart(
          particle,
          sourceLang,
          "VERB_PARTICLE_PAST_PROGRESSIVE"
        )
      );
      const gup =
        kind === "same-day"
          ? gerundMatch.entry.gupForms[2] ?? gerundMatch.entry.gup
          : gerundMatch.entry.gupForms[0] ?? gerundMatch.entry.gup;
      const explanationKey =
        kind === "same-day"
          ? "VERB_PAST_SAME_DAY_PROGRESSIVE_POS"
          : "VERB_PAST_YESTERDAY_PROGRESSIVE_POS";
      parts.push(createVerbPart(gerundMatch, sourceLang, gup, explanationKey));
      return parts;
    };
    const sameDayBranches: TranslationPart[][] = [];
    const yesterdayBranches: TranslationPart[][] = [];
    const partsSame = buildPastParts("same-day", false);
    const partsYest = buildPastParts("yesterday", false);
    sameDayBranches.push(...buildBranches(partsSame, objectSequences));
    yesterdayBranches.push(...buildBranches(partsYest, objectSequences));
    const purposeSameDayBranches = purposeSequences
      ? buildBranches(partsSame, purposeSequences)
      : [];
    const purposeYesterdayBranches = purposeSequences
      ? buildBranches(partsYest, purposeSequences)
      : [];
    const belongingPurposeSameDayBranches = belongingPurposeSequences
      ? buildBranches(partsSame, belongingPurposeSequences)
      : [];
    const belongingPurposeYesterdayBranches = belongingPurposeSequences
      ? buildBranches(partsYest, belongingPurposeSequences)
      : [];
    const belongingAboutSameDayBranches = belongingAboutSequences
      ? buildBranches(partsSame, belongingAboutSequences)
      : [];
    const belongingAboutYesterdayBranches = belongingAboutSequences
      ? buildBranches(partsYest, belongingAboutSequences)
      : [];
    const aboutAltSameDayBranches = aboutAltSequences
      ? buildBranches(partsSame, aboutAltSequences)
      : [];
    const aboutAltYesterdayBranches = aboutAltSequences
      ? buildBranches(partsYest, aboutAltSequences)
      : [];
    const indirectSameDayBranches = indirectSequences
      ? buildBranches(partsSame, indirectSequences)
      : [];
    const indirectYesterdayBranches = indirectSequences
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
        hasSubjectInCombos: Boolean(hasSubjectImmediate),
        subjectInsertMode: "after-marker",
        variantGroup,
      });
    };

    if (timeContext === "today") {
      const expanded = expandPastBranches(sameDayBranches);
      const expandedPurpose =
        purposeSameDayBranches.length > 0
          ? expandPastBranches(
              purposeSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedBelongingPurpose =
        belongingPurposeSameDayBranches.length > 0
          ? expandPastBranches(
              belongingPurposeSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedBelongingAbout =
        belongingAboutSameDayBranches.length > 0
          ? expandPastBranches(
              belongingAboutSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedAboutAlt =
        aboutAltSameDayBranches.length > 0
          ? expandPastBranches(
              aboutAltSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedIndirect =
        indirectSameDayBranches.length > 0
          ? expandPastBranches(
              indirectSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      if (expanded.length > 0) {
        state.combinations = [
          ...expanded,
          ...expandedPurpose,
          ...expandedBelongingPurpose,
          ...expandedBelongingAbout,
          ...expandedAboutAlt,
          ...expandedIndirect,
        ];
        if (
          expandedPurpose.length > 0 ||
          expandedBelongingPurpose.length > 0 ||
          expandedBelongingAbout.length > 0 ||
          expandedAboutAlt.length > 0 ||
          expandedIndirect.length > 0 ||
          purposeHasAmbiguity ||
          belongingPurposeHasAmbiguity ||
          belongingAboutHasAmbiguity ||
          aboutAltHasAmbiguity ||
          indirectHasAmbiguity
        ) {
          state.hasAmbiguity = true;
        }
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
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
        purposeYesterdayBranches.length > 0
          ? expandPastBranches(
              purposeYesterdayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedBelongingPurpose =
        belongingPurposeYesterdayBranches.length > 0
          ? expandPastBranches(
              belongingPurposeYesterdayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedBelongingAbout =
        belongingAboutYesterdayBranches.length > 0
          ? expandPastBranches(
              belongingAboutYesterdayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedAboutAlt =
        aboutAltYesterdayBranches.length > 0
          ? expandPastBranches(
              aboutAltYesterdayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedIndirect =
        indirectYesterdayBranches.length > 0
          ? expandPastBranches(
              indirectYesterdayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      if (expanded.length > 0) {
        state.combinations = [
          ...expanded,
          ...expandedPurpose,
          ...expandedBelongingPurpose,
          ...expandedBelongingAbout,
          ...expandedAboutAlt,
          ...expandedIndirect,
        ];
        if (
          expandedPurpose.length > 0 ||
          expandedBelongingPurpose.length > 0 ||
          expandedBelongingAbout.length > 0 ||
          expandedAboutAlt.length > 0 ||
          expandedIndirect.length > 0 ||
          purposeHasAmbiguity ||
          belongingPurposeHasAmbiguity ||
          belongingAboutHasAmbiguity ||
          aboutAltHasAmbiguity ||
          indirectHasAmbiguity
        ) {
          state.hasAmbiguity = true;
        }
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
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
        ...purposeSameDayBranches,
        ...purposeYesterdayBranches,
      ];
      const expandedPurpose =
        purposeAllBranches.length > 0
          ? expandPastBranches(
              purposeAllBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const belongingPurposeAllBranches = [
        ...belongingPurposeSameDayBranches,
        ...belongingPurposeYesterdayBranches,
      ];
      const expandedBelongingPurpose =
        belongingPurposeAllBranches.length > 0
          ? expandPastBranches(
              belongingPurposeAllBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const belongingAboutAllBranches = [
        ...belongingAboutSameDayBranches,
        ...belongingAboutYesterdayBranches,
      ];
      const expandedBelongingAbout =
        belongingAboutAllBranches.length > 0
          ? expandPastBranches(
              belongingAboutAllBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const aboutAltAllBranches = [
        ...aboutAltSameDayBranches,
        ...aboutAltYesterdayBranches,
      ];
      const expandedAboutAlt =
        aboutAltAllBranches.length > 0
          ? expandPastBranches(
              aboutAltAllBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const indirectAllBranches = [
        ...indirectSameDayBranches,
        ...indirectYesterdayBranches,
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
        ...expandedPurpose,
        ...expandedBelongingPurpose,
        ...expandedBelongingAbout,
        ...expandedAboutAlt,
        ...expandedIndirect,
      ];
      if (expandedSame.length > 0 || expandedYesterday.length > 0) {
        state.hasAmbiguity = true;
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
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
    const buildFutureParts = (
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
      const gup =
        kind === "same-day"
          ? gerundMatch.entry.gupForms[0] ?? gerundMatch.entry.gup
          : gerundMatch.entry.gupForms[1] ?? gerundMatch.entry.gup;
      const explanationKey =
        kind === "same-day"
          ? "VERB_FUTURE_SAME_DAY_PROGRESSIVE_POS"
          : "VERB_FUTURE_TOMORROW_PROGRESSIVE_POS";
      parts.push(createVerbPart(gerundMatch, sourceLang, gup, explanationKey));
      return parts;
    };

    const sameDayBranches: TranslationPart[][] = [];
    const tomorrowBranches: TranslationPart[][] = [];
    const partsSame = buildFutureParts("same-day");
    const partsTomorrow = buildFutureParts("tomorrow");
    sameDayBranches.push(...buildBranches(partsSame, objectSequences));
    tomorrowBranches.push(...buildBranches(partsTomorrow, objectSequences));
    const purposeSameDayBranches = purposeSequences
      ? buildBranches(partsSame, purposeSequences)
      : [];
    const purposeTomorrowBranches = purposeSequences
      ? buildBranches(partsTomorrow, purposeSequences)
      : [];
    const belongingPurposeSameDayBranches = belongingPurposeSequences
      ? buildBranches(partsSame, belongingPurposeSequences)
      : [];
    const belongingPurposeTomorrowBranches = belongingPurposeSequences
      ? buildBranches(partsTomorrow, belongingPurposeSequences)
      : [];
    const belongingAboutSameDayBranches = belongingAboutSequences
      ? buildBranches(partsSame, belongingAboutSequences)
      : [];
    const belongingAboutTomorrowBranches = belongingAboutSequences
      ? buildBranches(partsTomorrow, belongingAboutSequences)
      : [];
    const aboutAltSameDayBranches = aboutAltSequences
      ? buildBranches(partsSame, aboutAltSequences)
      : [];
    const aboutAltTomorrowBranches = aboutAltSequences
      ? buildBranches(partsTomorrow, aboutAltSequences)
      : [];
    const indirectSameDayBranches = indirectSequences
      ? buildBranches(partsSame, indirectSequences)
      : [];
    const indirectTomorrowBranches = indirectSequences
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
        hasSubjectInCombos: Boolean(hasSubjectImmediate),
        subjectInsertMode: "start",
        variantGroup,
      });
    };

    if (timeContext === "same-day") {
      const expanded = expandFutureBranches(sameDayBranches);
      const expandedPurpose =
        purposeSameDayBranches.length > 0
          ? expandFutureBranches(
              purposeSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedBelongingPurpose =
        belongingPurposeSameDayBranches.length > 0
          ? expandFutureBranches(
              belongingPurposeSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedBelongingAbout =
        belongingAboutSameDayBranches.length > 0
          ? expandFutureBranches(
              belongingAboutSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedAboutAlt =
        aboutAltSameDayBranches.length > 0
          ? expandFutureBranches(
              aboutAltSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedIndirect =
        indirectSameDayBranches.length > 0
          ? expandFutureBranches(
              indirectSameDayBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      if (expanded.length > 0) {
        state.combinations = [
          ...expanded,
          ...expandedPurpose,
          ...expandedBelongingPurpose,
          ...expandedBelongingAbout,
          ...expandedAboutAlt,
          ...expandedIndirect,
        ];
        if (
          expandedPurpose.length > 0 ||
          expandedBelongingPurpose.length > 0 ||
          expandedBelongingAbout.length > 0 ||
          expandedAboutAlt.length > 0 ||
          expandedIndirect.length > 0 ||
          purposeHasAmbiguity ||
          belongingPurposeHasAmbiguity ||
          belongingAboutHasAmbiguity ||
          aboutAltHasAmbiguity ||
          indirectHasAmbiguity
        ) {
          state.hasAmbiguity = true;
        }
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
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
        purposeTomorrowBranches.length > 0
          ? expandFutureBranches(
              purposeTomorrowBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedBelongingPurpose =
        belongingPurposeTomorrowBranches.length > 0
          ? expandFutureBranches(
              belongingPurposeTomorrowBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedBelongingAbout =
        belongingAboutTomorrowBranches.length > 0
          ? expandFutureBranches(
              belongingAboutTomorrowBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedAboutAlt =
        aboutAltTomorrowBranches.length > 0
          ? expandFutureBranches(
              aboutAltTomorrowBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedIndirect =
        indirectTomorrowBranches.length > 0
          ? expandFutureBranches(
              indirectTomorrowBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      if (expanded.length > 0) {
        state.combinations = [
          ...expanded,
          ...expandedPurpose,
          ...expandedBelongingPurpose,
          ...expandedBelongingAbout,
          ...expandedAboutAlt,
          ...expandedIndirect,
        ];
        if (
          expandedPurpose.length > 0 ||
          expandedBelongingPurpose.length > 0 ||
          expandedBelongingAbout.length > 0 ||
          expandedAboutAlt.length > 0 ||
          expandedIndirect.length > 0 ||
          purposeHasAmbiguity ||
          belongingPurposeHasAmbiguity ||
          belongingAboutHasAmbiguity ||
          aboutAltHasAmbiguity ||
          indirectHasAmbiguity
        ) {
          state.hasAmbiguity = true;
        }
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
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
      const expandedSame = expandFutureBranches(sameDayBranches, sameDayGroup);
      const expandedTomorrow = expandFutureBranches(
        tomorrowBranches,
        tomorrowGroup
      );
      const purposeAllBranches = [
        ...purposeSameDayBranches,
        ...purposeTomorrowBranches,
      ];
      const expandedPurpose =
        purposeAllBranches.length > 0
          ? expandFutureBranches(
              purposeAllBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const belongingPurposeAllBranches = [
        ...belongingPurposeSameDayBranches,
        ...belongingPurposeTomorrowBranches,
      ];
      const expandedBelongingPurpose =
        belongingPurposeAllBranches.length > 0
          ? expandFutureBranches(
              belongingPurposeAllBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const belongingAboutAllBranches = [
        ...belongingAboutSameDayBranches,
        ...belongingAboutTomorrowBranches,
      ];
      const expandedBelongingAbout =
        belongingAboutAllBranches.length > 0
          ? expandFutureBranches(
              belongingAboutAllBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const aboutAltAllBranches = [
        ...aboutAltSameDayBranches,
        ...aboutAltTomorrowBranches,
      ];
      const expandedAboutAlt =
        aboutAltAllBranches.length > 0
          ? expandFutureBranches(
              aboutAltAllBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const indirectAllBranches = [
        ...indirectSameDayBranches,
        ...indirectTomorrowBranches,
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
        ...expandedPurpose,
        ...expandedBelongingPurpose,
        ...expandedBelongingAbout,
        ...expandedAboutAlt,
        ...expandedIndirect,
      ];
      if (expandedSame.length > 0 || expandedTomorrow.length > 0) {
        state.hasAmbiguity = true;
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
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
    ...subjectParts,
    createParticlePart("ga", sourceLang, "VERB_PARTICLE_POS", ["yukurra"]),
    createVerbPart(
      gerundMatch,
      sourceLang,
      gerundMatch.entry.gupForms[0] ?? gerundMatch.entry.gup,
      "VERB_GERUND_POS"
    ),
  ];
  const branches = buildBranches(parts, objectSequences);
  const originBranches = originSequences
    ? buildBranches(parts, originSequences)
    : [];
  const purposeBranches = purposeSequences
    ? buildBranches(parts, purposeSequences)
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
    let expanded: TranslationResult["combinations"] = [];
    const baseGroupId = objectDropAmbiguity
      ? helpers.nextVariantGroup("dropdown")
      : null;
    const baseCombos = baseGroupId
      ? state.combinations.map((combo) => ({
          ...combo,
          variantGroup: baseGroupId,
        }))
      : state.combinations;
    for (const branch of branches) {
      expanded = expanded.concat(
        helpers.appendPartsToCombinations(baseCombos, branch, "dropdown")
      );
    }
    let expandedOrigin: TranslationResult["combinations"] = [];
    if (originBranches.length > 0) {
      const originGroup: VariantGroup = helpers.nextVariantGroup("box");
      const originCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: originGroup,
      }));
      for (const branch of originBranches) {
        expandedOrigin = expandedOrigin.concat(
          helpers.appendPartsToCombinations(originCombos, branch, "dropdown")
        );
      }
    }
    let expandedPurpose: TranslationResult["combinations"] = [];
    if (purposeBranches.length > 0) {
      const purposeGroup: VariantGroup = helpers.nextVariantGroup("box");
      const purposeCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: purposeGroup,
      }));
      for (const branch of purposeBranches) {
        expandedPurpose = expandedPurpose.concat(
          helpers.appendPartsToCombinations(purposeCombos, branch, "dropdown")
        );
      }
    }
    let expandedBelongingPurpose: TranslationResult["combinations"] = [];
    if (belongingPurposeBranches.length > 0) {
      const purposeGroup: VariantGroup = helpers.nextVariantGroup("box");
      const purposeCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: purposeGroup,
      }));
      for (const branch of belongingPurposeBranches) {
        expandedBelongingPurpose = expandedBelongingPurpose.concat(
          helpers.appendPartsToCombinations(purposeCombos, branch, "dropdown")
        );
      }
    }
    let expandedBelongingAbout: TranslationResult["combinations"] = [];
    if (belongingAboutBranches.length > 0) {
      const aboutGroup: VariantGroup = helpers.nextVariantGroup("box");
      const aboutCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: aboutGroup,
      }));
      for (const branch of belongingAboutBranches) {
        expandedBelongingAbout = expandedBelongingAbout.concat(
          helpers.appendPartsToCombinations(aboutCombos, branch, "dropdown")
        );
      }
    }
    let expandedAboutAlt: TranslationResult["combinations"] = [];
    if (aboutAltBranches.length > 0) {
      const altGroup: VariantGroup = helpers.nextVariantGroup("box");
      const altCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: altGroup,
      }));
      for (const branch of aboutAltBranches) {
        expandedAboutAlt = expandedAboutAlt.concat(
          helpers.appendPartsToCombinations(altCombos, branch, "dropdown")
        );
      }
    }
    let expandedIndirect: TranslationResult["combinations"] = [];
    if (indirectBranches.length > 0) {
      const indirectGroup: VariantGroup = helpers.nextVariantGroup("box");
      const indirectCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: indirectGroup,
      }));
      for (const branch of indirectBranches) {
        expandedIndirect = expandedIndirect.concat(
          helpers.appendPartsToCombinations(indirectCombos, branch, "dropdown")
        );
      }
    }
    let expandedInstrumental: TranslationResult["combinations"] = [];
    if (instrumentalBranches.length > 0) {
      const instrumentalGroup: VariantGroup = helpers.nextVariantGroup("box");
    const instrumentalCombos = state.combinations.map((combo) => ({
      ...combo,
      parts: stripTrailingSequences(combo.parts, objectSequences),
      variantGroup: instrumentalGroup,
    }));
      for (const branch of instrumentalBranches) {
        expandedInstrumental = expandedInstrumental.concat(
          helpers.appendPartsToCombinations(instrumentalCombos, branch, "dropdown")
        );
      }
    }
    if (branches.length > 1) {
      state.hasAmbiguity = true;
    }
    if (
      expandedOrigin.length > 0 ||
      expandedPurpose.length > 0 ||
      expandedBelongingPurpose.length > 0 ||
      expandedBelongingAbout.length > 0 ||
      expandedAboutAlt.length > 0 ||
      expandedIndirect.length > 0 ||
      expandedInstrumental.length > 0 ||
      originHasAmbiguity ||
      purposeHasAmbiguity ||
      belongingPurposeHasAmbiguity ||
      belongingAboutHasAmbiguity ||
      aboutAltHasAmbiguity ||
      indirectHasAmbiguity ||
      instrumentalHasAmbiguity
    ) {
      state.hasAmbiguity = true;
    }
    state.combinations = [
      ...expanded,
      ...expandedOrigin,
      ...expandedPurpose,
      ...expandedBelongingPurpose,
      ...expandedBelongingAbout,
      ...expandedAboutAlt,
      ...expandedIndirect,
      ...expandedInstrumental,
    ];
    const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
    state.lastConnectorAnchor = connectorAnchor;
    helpers.updateLastVerbSubject(
      inferredPersons,
      connectorAnchor,
      state.lastSubject?.sourceToken
    );
    return { handled: true, nextIndex: connectorAnchor };
  }

  return { handled: false };
}
