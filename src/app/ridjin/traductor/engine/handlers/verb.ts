import { LanguageMode } from "@/app/components/types/components.type";
import type {
  FeatureValue,
  IRSentence,
  IRToken,
  ExplanationPayload,
  PersonNumber,
  TranslationPart,
  TranslationResult,
  VariantGroup,
} from "../../core/types";
import type { VerbMatch } from "../../rules/verb";
import { matchVerbAt, matchPastParticipleAt } from "../../rules/verb";
import { matchObjectPronoun, ObjectPronounMatch } from "../../rules/objectPronoun";
import { SUBJECT_PRONOUNS_GUP } from "../../rules/pronoun";
import { expandInclusiveExclusive } from "../../logic/subjects";
import {
  buildBranches,
  expandBranchesWithSubject,
  stripTrailingSequences,
  setLocativeDeterminerMode,
} from "../../logic/branching";
import { matchArticleAt, matchNounAt } from "../../logic/lexiconMatch";
import { matchDemonstrativeToken } from "../../logic/demonstratives";
import {
  PendingObject,
  appendObjectSequences,
  buildObjectSequencesFromPending,
  buildObjectSequencesFromMatch,
  collectObjectSequencesAfterVerb,
  filterComitativeHumanSequences,
  filterInstrumentalNonHumanSequences,
  matchAllativeMarkerAt,
  matchAllativePhraseAt,
  matchAblativePhraseAt,
  matchTraversivePhraseAt,
  matchComitativePhraseAt,
  matchInstrumentalPhraseAt,
  matchIndirectPhraseAt,
  matchOriginPhraseAt,
  matchBelongingAboutPhraseAt,
  matchBelongingPurposePhraseAt,
  matchPurposeAmbiguousAltAt,
  matchCausePhraseAt,
  matchActVerbPhraseAt,
  matchPurposePhraseAt,
  matchNounPhraseAfterArticle,
  buildNounPhraseParts,
  shouldAllowAboutLocativeAlt,
  matchLocativePhraseAt,
} from "../../logic/objects";
import {
  buildLocativePart,
  matchLocativeMarkerAt,
  resolveAllativeVerbEntry,
  resolveLocativeVerbEntry,
} from "../../logic/locative";
import { matchDhiyakuDeterminerAt } from "../../logic/dhiyaku";
import { resolveFutureTimeContext, resolvePastTimeContext } from "../../logic/time";
import {
  createInfinitivePart,
  createParticlePart,
  createVerbPart,
  finalizePart,
} from "../../logic/parts";
import {
  buildPossessivePronounPart,
  buildPossessiveSuffixPart,
} from "../../logic/possession";
import {
  applyPossessiveSuffix,
  applySuffixToGup,
  getBelongingHumanSuffixes,
  getBelongingSuffixes,
  getComitativeSuffixes,
  getPossessiveSuffixes,
} from "../../logic/suffixes";
import {
  buildModalObjectSequencesFromPending,
  collectModalObjectSequences,
  matchModalVerbAt,
} from "../../logic/modal";
import { matchInfinitiveAt, splitVerbClitic } from "../../logic/verbAux";
import type { ModalPendingObject } from "../../logic/modal";
import { DEFAULT_GERUND_PERSONS, hasExclamation } from "../shared";
import type { TranslateHelpers, TranslateState, VerbHandlerResult } from "../types";
import { buildComitativePronounPart } from "../../rules/comitativePronoun";
import { LEXICON } from "../../lexicon";
import { matchBecomeAt } from "../../logic/become";
import { matchMakeAdjAt } from "../../logic/makeAdj";
import { debugLog } from "../debug";
import { normalizeToken } from "../../logic/tokenUtils";
import {
  hasHabitualMarker,
  hasPastHabitualMarker,
  resolvePastHabitualPersons,
  isHabitualMarkerAt,
} from "../../logic/habitual";
import { hasMightMarker } from "../../logic/might";
import { hasShouldMarker, resolveShouldPersons } from "../../logic/should";
import {
  hasShouldHaveMarker,
  resolveShouldHavePersons,
} from "../../logic/shouldHave";

export function handleVerbMatches(args: {
  ir: IRSentence;
  token: IRToken;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): VerbHandlerResult {
  const { ir, token, index, sourceLang, state, helpers } = args;
  debugLog("[ridjin-debug] verb handler", {
    index,
    token: token.source,
  });

  const hasShouldHaveMarkerInSentence = hasShouldHaveMarker(
    ir.tokens,
    sourceLang
  );
  let attachedObject: ObjectPronounMatch | null = null;
  let verbMatches: VerbMatch[] = [];
  const becomeMatch = matchBecomeAt(ir.tokens, index, sourceLang);
  const makeAdjMatch = matchMakeAdjAt(ir.tokens, index, sourceLang);
  if (becomeMatch) {
    verbMatches = becomeMatch.matches;
  } else {
    verbMatches = matchVerbAt(ir.tokens, index, sourceLang);
  }
  if (verbMatches.length === 0 && hasShouldHaveMarkerInSentence) {
    verbMatches = matchPastParticipleAt(ir.tokens, index, sourceLang);
  }
  if (verbMatches.length === 0) {
    const split = splitVerbClitic(token.source, sourceLang);
    if (split) {
      const cliticMatch = matchObjectPronoun(split.clitic, sourceLang);
      if (cliticMatch) {
        attachedObject = cliticMatch;
        const syntheticToken = {
          id: token.id,
          source: split.verb,
          normalized: split.verb,
          pos: "unknown" as const,
        };
        verbMatches = matchVerbAt([syntheticToken], 0, sourceLang).map(
          (match) => ({
            ...match,
            consumed: 1,
            source: token.source,
          })
        );
      }
    }
  }

  if (verbMatches.length === 0 && (!makeAdjMatch || makeAdjMatch.matches.length === 0)) {
    const modalMatch = matchModalVerbAt(ir.tokens, index, sourceLang);
    debugLog("[ridjin-debug] verb modal fallback", {
      index,
      token: token.source,
      modalMatch,
    });
    if (modalMatch) {
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
        index + modalMatch.consumed,
        sourceLang,
        { reflexivePersons: modalPersons, reflexiveSubjectRepeat: true }
      );
      debugLog("[ridjin-debug] verb modal objects", {
        index,
        objectStart: index + modalMatch.consumed,
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
      if (modalBranches.length === 0) {
        return { handled: false, hasVerbMatch: false };
      }
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
          variantGroup:
            combo.variantGroup?.scope === "box" ? combo.variantGroup : modalGroup,
        }));
      }
      if (modalBranches.length > 1) state.hasAmbiguity = true;
      state.combinations = expanded;
      const connectorAnchor = index + modalMatch.consumed - 1 + modalAfter.consumed;
      state.lastConnectorAnchor = connectorAnchor;
      helpers.updateLastVerbSubject(
        expandInclusiveExclusive(modalMatch.persons),
        connectorAnchor,
        state.lastSubject?.sourceToken
      );
      return { handled: true, hasVerbMatch: true, nextIndex: connectorAnchor };
    }
    return { handled: false, hasVerbMatch: false };
  }

  state.pendingSubjectJoin = false;
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
  const exclamation = hasExclamation(
    ir.tokens,
    index,
    verbMatches[0]?.consumed ?? makeAdjMatch?.consumed ?? 1
  );
  const verbConsumed =
    verbMatches[0]?.consumed ?? makeAdjMatch?.consumed ?? 1;
  const objectMatch: PendingObject | null =
    objectFromPending ??
    (attachedObject ? { kind: "pronoun", match: attachedObject } : null);
  const allowNonHumanDemonstrative = Boolean(
    verbMatches.some((match) => match.entry.isTransitive) ||
      makeAdjMatch?.matches.some((match) => match.entry.isTransitive)
  );
  const reflexivePersons = verbMatches.some((match) => match.entry.isTransitive)
    ? state.lastSubject?.persons
    : undefined;
  const reflexivePossessivePersons = state.lastSubject?.persons;
  const reflexivePossessiveOptions = {
    reflexivePersons: reflexivePossessivePersons,
    reflexiveSubjectRepeat: true,
  };
  const preObject = buildObjectSequencesFromPending(objectMatch, sourceLang, {
    allowNonHumanDemonstrative,
    reflexivePersons,
    reflexiveSubjectRepeat: true,
  });
  const isInfinitiveOnly =
    verbMatches.length > 0 &&
    verbMatches.every((match) => match.kind === "infinitive");
  const habitualAfterVerb = isHabitualMarkerAt(
    ir.tokens,
    index + verbConsumed,
    sourceLang
  );
  debugLog("habitual:after-verb", {
    index,
    verb: ir.tokens[index]?.source,
    verbConsumed,
    next: ir.tokens[index + verbConsumed]?.source,
    habitualAfterVerb,
  });
  const afterObjects = habitualAfterVerb
    ? {
        sequences: [[]],
        consumed: 0,
        hasDrop: false,
        hasAmbiguity: false,
      }
    : collectObjectSequencesAfterVerb(
        ir.tokens,
        index + verbConsumed,
        sourceLang,
        isInfinitiveOnly
          ? {
              comitativePossessive: true,
              allowNonHumanDemonstrative,
              reflexivePersons,
              reflexiveSubjectRepeat: true,
            }
          : {
              allowNonHumanDemonstrative,
              reflexivePersons,
              reflexiveSubjectRepeat: true,
            }
      );
  debugLog("[ridjin-debug] objects:after-verb", {
    index,
    verb: ir.tokens[index]?.source,
    start: index + verbConsumed,
    consumed: afterObjects.consumed,
    seqCount: afterObjects.sequences.length,
    seqLens: afterObjects.sequences.map((seq) => seq.length),
  });
  if (habitualAfterVerb) {
    debugLog("habitual:after-objects", {
      index,
      verb: ir.tokens[index]?.source,
      consumed: afterObjects.consumed,
      seqCount: afterObjects.sequences.length,
      seqLens: afterObjects.sequences.map((seq) => seq.length),
    });
  }
  if (afterObjects.hasAmbiguity) {
    state.hasAmbiguity = true;
  }
  const hasMotionVerb = verbMatches.some(
    (match) => match.entry.motionType === "motion"
  );
  const immediateTraversive = hasMotionVerb
    ? matchTraversivePhraseAt(
        ir.tokens,
        index + verbConsumed + afterObjects.consumed,
        sourceLang
      )
    : null;
  let immediateTraversivePurposeAlt: {
    sequences: TranslationPart[][];
    hasAmbiguity: boolean;
  } | null = null;
  let immediateTraversiveCauseAlt: {
    sequences: TranslationPart[][];
    hasAmbiguity: boolean;
  } | null = null;
  let objectSequences = appendObjectSequences(
    preObject.sequences,
    afterObjects.sequences
  );
  const baseObjectSequences = objectSequences;
  let originSequences = afterObjects.originSequences
    ? appendObjectSequences(preObject.sequences, afterObjects.originSequences)
    : null;
  const originHasAmbiguity = Boolean(afterObjects.originHasAmbiguity);
  let objectConsumed = afterObjects.consumed;
  if (immediateTraversive && objectConsumed === 0) {
    const purposeAlt = matchPurposePhraseAt(
      ir.tokens,
      index + verbConsumed + afterObjects.consumed,
      sourceLang,
      reflexivePossessiveOptions
    );
    if (purposeAlt) {
      immediateTraversivePurposeAlt = {
        sequences: purposeAlt.sequences,
        hasAmbiguity: purposeAlt.hasAmbiguity,
      };
    }
    const causeAlt = matchCausePhraseAt(
      ir.tokens,
      index + verbConsumed + afterObjects.consumed,
      sourceLang
    );
    if (causeAlt) {
      immediateTraversiveCauseAlt = {
        sequences: causeAlt.sequences,
        hasAmbiguity: causeAlt.hasAmbiguity,
      };
    }
    objectSequences = appendObjectSequences(
      preObject.sequences,
      immediateTraversive.sequences
    );
    objectConsumed = immediateTraversive.consumed;
    if (immediateTraversive.hasAmbiguity) {
      state.hasAmbiguity = true;
    }
  }
  const isHaveVerb = verbMatches.some((match) => match.entry.isHaveVerb);
  let haveBranches: TranslationPart[][] = [];
  let haveHasAmbiguity = false;
  let haveStripSequences: TranslationPart[][] | null = null;
  let haveBelongingSequences: TranslationPart[][] = [];
  let haveBelongingHasAmbiguity = false;
  let haveMirriSequences: TranslationPart[][] = [];
  let haveMirriHasAmbiguity = false;
  let haveMirriStripSequences: TranslationPart[][] | null = null;

  const buildPronounPossessorSequences = (
    persons: PersonNumber[],
    source: string
  ): { sequences: TranslationPart[][]; hasAmbiguity: boolean } | null => {
    if (!persons || persons.length === 0) return null;
    const primary = persons[0];
    const alternatives = persons.slice(1);
    const part = buildPossessivePronounPart(
      { person: primary, altPersons: alternatives, source },
      sourceLang
    );
    if (!part) return null;
    return {
      sequences: [[part]],
      hasAmbiguity: Boolean(part.alternatives && part.alternatives.length > 0),
    };
  };

  const buildNounPossessorSequences = (
    startIndex: number,
    sourceToken: string
  ): { sequences: TranslationPart[][]; hasAmbiguity: boolean } | null => {
    let cursor = startIndex;
    let prefixParts: TranslationPart[] = [];
    const determiner = matchDhiyakuDeterminerAt(ir.tokens, cursor, sourceLang);
    if (determiner) {
      if (determiner.part) prefixParts = [determiner.part];
      cursor += determiner.consumed;
    }
    const phrase = matchNounPhraseAfterArticle(ir.tokens, cursor, sourceLang);
    if (phrase) {
      const suffixes = getPossessiveSuffixes(phrase.noun.gup);
      const sequences = suffixes.map((suffix) => {
        const parts = buildNounPhraseParts(phrase, sourceLang, {
          suffix,
          nounNote: {
            key: "POSSESSION_SUFFIX",
            data: {
              token: phrase.noun.source,
              gup: applyPossessiveSuffix(phrase.noun.gup, suffix),
            },
          },
        });
        return prefixParts.length > 0 ? [...prefixParts, ...parts] : parts;
      });
      return { sequences, hasAmbiguity: suffixes.length > 1 };
    }
    const nounMatch = matchNounAt(ir.tokens, cursor, sourceLang);
    const base = nounMatch?.gup ?? sourceToken;
    if (!base) return null;
    const part = buildPossessiveSuffixPart(base, sourceToken, sourceLang);
    const prefixed = prefixParts.length > 0 ? [...prefixParts, part] : [part];
    return {
      sequences: [prefixed],
      hasAmbiguity: Boolean(part.alternatives && part.alternatives.length > 0),
    };
  };

  const recordMirriStripSequences = (sequences: TranslationPart[][] | null) => {
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

  const stripSuffixFromGup = (gup: string, suffix: string): string => {
    const trimmed = gup.trim();
    if (!trimmed) return gup;
    const parts = trimmed.split(/\s+/);
    const last = parts.pop() ?? "";
    if (last.endsWith(suffix)) {
      parts.push(last.slice(0, -suffix.length));
    } else {
      parts.push(last);
    }
    return parts.join(" ").trim();
  };

  const buildAgentPossessiveComitativeCombos = (
    combos: TranslationResult["combinations"]
  ): { combos: TranslationResult["combinations"]; hasAmbiguity: boolean } | null => {
    let changedAny = false;
    let hasAmbiguity = false;
    const updated = combos.map((combo) => {
      const verbIndex = combo.parts.findIndex((part) => part.type === "verb");
      const limit = verbIndex === -1 ? combo.parts.length : verbIndex;
      let changed = false;
      const parts = combo.parts.map((part, idx) => {
        if (idx >= limit) return part;
        const explanations = part.explanations ?? [];
        if (
          explanations.some((exp) => exp.key === "POSSESSION_AGENT_COMITATIVE")
        ) {
          return part;
        }
        const possExp = explanations.find(
          (exp) =>
            exp.key === "POSSESSION_SUFFIX" ||
            exp.key === "POSSESSION_PRONOUN" ||
            exp.key === "POSSESSION_PRONOUN_EMPHATIC"
        );
        if (!possExp) return part;
        if (
          possExp.key === "POSSESSION_PRONOUN" ||
          possExp.key === "POSSESSION_PRONOUN_EMPHATIC"
        ) {
          if (possExp.data?.nonHuman === true) return part;
          const person = possExp.data?.person as PersonNumber | undefined;
          if (!person) return part;
          const comPart = buildComitativePronounPart({
            source: part.source,
            person,
            consumed: 1,
            emphasis:
              possExp.key === "POSSESSION_PRONOUN_EMPHATIC"
                ? { source: part.source, consumed: 1 }
                : undefined,
          });
          if (!comPart) return part;
          const rendered = finalizePart(
            possExp.key === "POSSESSION_PRONOUN_EMPHATIC"
              ? {
                  ...comPart,
                  explanations: [
                    ...(comPart.explanations ?? []),
                    {
                      key: "POSSESSION_PRONOUN_EMPHATIC",
                      data: {
                        token: part.source,
                        gup: comPart.gup,
                        person,
                      },
                    },
                  ],
                }
              : comPart,
            sourceLang
          );
          changed = true;
          if (rendered.alternatives && rendered.alternatives.length > 0) {
            hasAmbiguity = true;
          }
          return rendered;
        }
        const suffix =
          typeof possExp.data?.suffix === "string" ? possExp.data.suffix : "";
        const base = suffix ? stripSuffixFromGup(part.gup, suffix) : part.gup;
        const suffixes = getComitativeSuffixes(base);
        if (suffixes.length === 0) return part;
        const primary = suffixes[0];
        const gup = applySuffixToGup(base, primary);
        const alternatives = suffixes.slice(1).map((alt) => ({
          gup: applySuffixToGup(base, alt),
        }));
        const newPart = finalizePart(
          {
            ...part,
            gup,
            output: gup,
            explanations: [
              ...explanations.filter((exp) => exp.key !== "POSSESSION_SUFFIX"),
              {
                key: "POSSESSION_AGENT_COMITATIVE",
                data: { token: part.source, gup, suffix: primary },
              },
            ],
            alternatives: alternatives.length > 0 ? alternatives : undefined,
            appliedSuffix: primary,
          },
          sourceLang
        );
        changed = true;
        if (alternatives.length > 0) hasAmbiguity = true;
        return newPart;
      });
      if (!changed) return combo;
      changedAny = true;
      return { ...combo, parts };
    });
    if (!changedAny) return null;
    return { combos: updated, hasAmbiguity };
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

  const nounByMeaningKey = new Map(
    Object.values(LEXICON.nouns ?? {}).map((entry) => [
      entry.meaningKey,
      entry,
    ])
  );

  const inferSequenceHumanity = (
    sequence: TranslationPart[]
  ): "human" | "non-human" | "ambiguous" => {
    let hasHuman = false;
    let hasNonHuman = false;
    for (const part of sequence) {
      if (part.type !== "noun" && part.type !== "adjective" && part.type !== "unknown") {
        continue;
      }
      if (!part.meaningKey) {
        hasHuman = true;
        hasNonHuman = true;
        continue;
      }
      const entry = nounByMeaningKey.get(part.meaningKey);
      if (entry?.isHuman === true) {
        hasHuman = true;
      } else if (entry?.isHuman === false || entry?.isPlace === true) {
        hasNonHuman = true;
      } else {
        hasHuman = true;
        hasNonHuman = true;
      }
    }
    if (hasHuman && !hasNonHuman) return "human";
    if (hasNonHuman && !hasHuman) return "non-human";
    return "ambiguous";
  };

  const applyBelongingSuffix = (
    sequence: TranslationPart[],
    suffix: string,
    noteKey: "BELONGING_SUFFIX" | "BELONGING_HUMAN_SUFFIX"
  ): TranslationPart[] | null => {
    if (sequence.some((part) => part.type === "pronoun")) return null;
    const stripHumanSuffix = (part: TranslationPart): string => {
      if (part.appliedSuffix === "nha" && part.gup.endsWith("nha")) {
        return part.gup.slice(0, -3);
      }
      return part.gup;
    };
    const updated = sequence.map((part) => {
      if (
        part.type !== "noun" &&
        part.type !== "adjective" &&
        part.type !== "unknown"
      ) {
        return part;
      }
      const base = stripHumanSuffix(part);
      const gup = applySuffixToGup(base, suffix);
      const alternatives = undefined;
      const explanations = [
        ...(part.explanations ?? []).filter(
          (exp) =>
            exp.key !== "OBJECT_HUMAN_SUFFIX" &&
            exp.key !== "OBJECT_NONHUMAN"
        ),
        { key: noteKey },
      ];
      return finalizePart(
        {
          ...part,
          gup,
          output: gup,
          alternatives,
          explanations,
          appliedSuffix: suffix,
        },
        sourceLang
      );
    });
    return updated.length > 0 ? updated : null;
  };

  const buildBelongingSequences = (
    sequence: TranslationPart[]
  ): { sequences: TranslationPart[][]; hasAmbiguity: boolean } => {
    const humanity = inferSequenceHumanity(sequence);
    const basePart =
      sequence.find((part) => part.type === "noun") ??
      sequence.find((part) => part.type === "unknown") ??
      sequence[sequence.length - 1];
    const base = basePart?.gup ?? "";
    const groups: { suffixes: string[]; noteKey: "BELONGING_SUFFIX" | "BELONGING_HUMAN_SUFFIX" }[] =
      [];
    if (humanity === "human") {
      groups.push({
        suffixes: getBelongingHumanSuffixes(base),
        noteKey: "BELONGING_HUMAN_SUFFIX",
      });
    } else if (humanity === "non-human") {
      groups.push({
        suffixes: getBelongingSuffixes(base),
        noteKey: "BELONGING_SUFFIX",
      });
    } else {
      groups.push({
        suffixes: getBelongingSuffixes(base),
        noteKey: "BELONGING_SUFFIX",
      });
      groups.push({
        suffixes: getBelongingHumanSuffixes(base),
        noteKey: "BELONGING_HUMAN_SUFFIX",
      });
    }
    const sequences: TranslationPart[][] = [];
    for (const group of groups) {
      for (const suffix of group.suffixes) {
        const seq = applyBelongingSuffix(sequence, suffix, group.noteKey);
        if (seq) sequences.push(seq);
      }
    }
    return { sequences, hasAmbiguity: sequences.length > 1 };
  };

  const addHaveNote = (sequence: TranslationPart[]): TranslationPart[] => {
    if (sequence.length === 0) return sequence;
    const [first, ...rest] = sequence;
    const explanations: ExplanationPayload[] = [
      ...(first.explanations ?? []),
      { key: "HAVE_POSSESSION" },
    ];
    return [finalizePart({ ...first, explanations }, sourceLang), ...rest];
  };

  const buildSubjectStripSequences = (): TranslationPart[][] | null => {
    const subject = state.lastSubject;
    if (!subject) return null;
    if (subject.kind === "pronoun" && subject.persons?.length) {
      const sequences: TranslationPart[][] = [];
      const meaningKey = `pronoun.${subject.persons[0]}`;
      if (subject.isHuman === false) {
        const demoMatch = subject.sourceToken
          ? matchDemonstrativeToken(subject.sourceToken, sourceLang)
          : null;
        const variants =
          demoMatch?.variants?.length
            ? demoMatch.variants
            : ["dhuwala", "dhuwali"];
        for (const gup of variants) {
          sequences.push([
            {
              type: "pronoun",
              source: subject.sourceToken ?? "",
              gup,
              output: gup,
              explanation: "",
              meaningKey,
            },
          ]);
        }
        return sequences;
      }
      const seen = new Set<string>();
      for (const person of subject.persons) {
        const forms = SUBJECT_PRONOUNS_GUP[person] ?? [];
        for (const gup of forms) {
          const key = `${person}:${gup}`;
          if (seen.has(key)) continue;
          seen.add(key);
          sequences.push([
            {
              type: "pronoun",
              source: subject.sourceToken ?? "",
              gup,
              output: gup,
              explanation: "",
              meaningKey: `pronoun.${person}`,
            },
          ]);
        }
      }
      return sequences.length > 0 ? sequences : null;
    }
    if (subject.kind === "noun") {
      const nounMatch = matchNounAt(
        ir.tokens,
        subject.endIndex ?? index - 1,
        sourceLang
      );
      if (nounMatch) {
        return [
          [
            {
              type: "noun",
              source: nounMatch.source,
              gup: nounMatch.gup,
              output: nounMatch.gup,
              explanation: "",
              meaningKey: nounMatch.entry?.meaningKey,
            },
          ],
        ];
      }
    }
    if (subject.kind === "unknown") {
      return [
        [
          {
            type: "unknown",
            source: subject.sourceToken ?? "",
            gup: subject.sourceToken ?? "",
            output: subject.sourceToken ?? "",
            explanation: "",
          },
        ],
      ];
    }
    return null;
  };
  let purposeSequences: TranslationPart[][] | null = null;
  let purposeHasAmbiguity = false;
  let causeSequences: TranslationPart[][] | null = null;
  let causeHasAmbiguity = false;
  let actVerbSequences: TranslationPart[][] | null = null;
  let actVerbHasAmbiguity = false;
  if (immediateTraversivePurposeAlt) {
    purposeSequences = appendObjectSequences(
      baseObjectSequences,
      immediateTraversivePurposeAlt.sequences
    );
    if (immediateTraversivePurposeAlt.hasAmbiguity) {
      purposeHasAmbiguity = true;
    }
  }
  if (immediateTraversiveCauseAlt) {
    causeSequences = appendObjectSequences(
      baseObjectSequences,
      immediateTraversiveCauseAlt.sequences
    );
    if (immediateTraversiveCauseAlt.hasAmbiguity) {
      causeHasAmbiguity = true;
    }
  }
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
  let locativePossessiveSequences: TranslationPart[][] | null = null;
  let locativePossessiveHasAmbiguity = false;
  const objectDropAmbiguity = preObject.hasDrop || afterObjects.hasDrop;
  const appendLocativePossessive = (seqs: TranslationPart[][]) => {
    if (!locativePossessiveSequences) return;
    locativePossessiveSequences = appendObjectSequences(
      locativePossessiveSequences,
      seqs
    );
  };

  let modifierConsumed = 0;
  let searching = true;
  while (searching) {
    searching = false;
    let appliedInstrumental = false;
    const modifierIndex = index + verbConsumed + objectConsumed + modifierConsumed;
    if (
      isHabitualMarkerAt(ir.tokens, modifierIndex, sourceLang) ||
      isHabitualMarkerAt(ir.tokens, modifierIndex + 1, sourceLang)
    ) {
      break;
    }
    const instrumentalPhrase = matchInstrumentalPhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang
    );
    const instrumentalLead = instrumentalPhrase?.preposition.normalized
      .split(" ")
      .shift();
    const isConWithPrep =
      sourceLang === "es" ? instrumentalLead === "con" : instrumentalLead === "with";
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
    if (instrumentalPhrase?.isExclusive) {
      applyInstrumentalPossessiveAlt(objectSequences);
      objectSequences = appendObjectSequences(
        objectSequences,
        instrumentalPhrase.sequences
      );
      if (locativePossessiveSequences) {
        locativePossessiveSequences = appendObjectSequences(
          locativePossessiveSequences,
          instrumentalPhrase.sequences
        );
      }
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
        if (locativePossessiveSequences) {
          const appendSeqs =
            traversivePhrase.possessiveAltSequences ?? traversivePhrase.sequences;
          locativePossessiveSequences = appendObjectSequences(
            locativePossessiveSequences,
            appendSeqs
          );
        } else if (traversivePhrase.possessiveAltSequences) {
          locativePossessiveSequences = appendObjectSequences(
            baseSequences,
            traversivePhrase.possessiveAltSequences
          );
        }
        if (traversivePhrase.possessiveAltHasAmbiguity) {
          locativePossessiveHasAmbiguity = true;
        }
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
          if (locativePossessiveSequences) {
            locativePossessiveSequences = appendObjectSequences(
              locativePossessiveSequences,
              indirectPhrase.directAltSequences
            );
          }
          indirectSequences = ioSequences;
          indirectHasAmbiguity = true;
        } else {
          objectSequences = ioSequences;
          appendLocativePossessive(indirectPhrase.sequences);
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
        objectSequences = appendObjectSequences(
          baseSequences,
          traversivePhrase.sequences
        );
        appendLocativePossessive(traversivePhrase.sequences);
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
        appendLocativePossessive(purposePhrase.sequences);
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
        appendLocativePossessive(purposePhrase.sequences);
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
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            comitativePhrase.sequences
          );
        }
        appendLocativePossessive(comitativePhrase.sequences);
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
        appendLocativePossessive(originPhrase.sequences);
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
    if (hasMotionVerb) {
      const traversivePhrase = matchTraversivePhraseAt(
        ir.tokens,
        modifierIndex,
        sourceLang
      );
      if (traversivePhrase) {
        const baseSequences = objectSequences;
        objectSequences = appendObjectSequences(
          baseSequences,
          traversivePhrase.sequences
        );
        if (locativePossessiveSequences) {
          const appendSeqs =
            traversivePhrase.possessiveAltSequences ?? traversivePhrase.sequences;
          locativePossessiveSequences = appendObjectSequences(
            locativePossessiveSequences,
            appendSeqs
          );
        } else if (traversivePhrase.possessiveAltSequences) {
          locativePossessiveSequences = appendObjectSequences(
            baseSequences,
            traversivePhrase.possessiveAltSequences
          );
        }
        if (traversivePhrase.possessiveAltHasAmbiguity) {
          locativePossessiveHasAmbiguity = true;
        }
        if (purposeSequences) {
          purposeSequences = appendObjectSequences(
            purposeSequences,
            traversivePhrase.sequences
          );
        }
        if (causeSequences) {
          causeSequences = appendObjectSequences(
            causeSequences,
            traversivePhrase.sequences
          );
        }
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
    if (instrumentalPhrase && isConWithPrep) {
      applyInstrumentalPossessiveAlt(objectSequences);
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
        appendLocativePossessive(comitativeAlt.sequences);
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
        objectSequences = appendObjectSequences(baseSequences, mainSequences);
        appendLocativePossessive(mainSequences);
      }
      if (purposeSequences) {
        purposeSequences = appendObjectSequences(purposeSequences, mainSequences);
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
      if (locativePossessiveSequences) {
        locativePossessiveSequences = appendObjectSequences(
          locativePossessiveSequences,
          comitativePhrase.sequences
        );
      }
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
    if (instrumentalPhrase && !instrumentalPhrase.isExclusive) {
      applyInstrumentalPossessiveAlt(objectSequences);
      objectSequences = appendObjectSequences(
        objectSequences,
        instrumentalPhrase.sequences
      );
      if (locativePossessiveSequences) {
        locativePossessiveSequences = appendObjectSequences(
          locativePossessiveSequences,
          instrumentalPhrase.sequences
        );
      }
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

    const allativePhrase = matchAllativePhraseAt(
      ir.tokens,
      modifierIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
    if (allativePhrase) {
      const baseSequences = objectSequences;
      objectSequences = appendObjectSequences(
        baseSequences,
        allativePhrase.sequences
      );
      if (locativePossessiveSequences) {
        const appendSeqs =
          allativePhrase.possessiveAltSequences ?? allativePhrase.sequences;
        locativePossessiveSequences = appendObjectSequences(
          locativePossessiveSequences,
          appendSeqs
        );
      } else if (allativePhrase.possessiveAltSequences) {
        locativePossessiveSequences = appendObjectSequences(
          baseSequences,
          allativePhrase.possessiveAltSequences
        );
      }
      if (allativePhrase.possessiveAltHasAmbiguity) {
        locativePossessiveHasAmbiguity = true;
      }
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
      verbMatches = verbMatches.map((match) => ({
        ...match,
        entry: resolveAllativeVerbEntry(match.entry),
      }));
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
        const baseSequences = objectSequences;
        objectSequences = appendObjectSequences(
          baseSequences,
          ablativePhrase.sequences
        );
        if (locativePossessiveSequences) {
          const appendSeqs =
            ablativePhrase.possessiveAltSequences ?? ablativePhrase.sequences;
          locativePossessiveSequences = appendObjectSequences(
            locativePossessiveSequences,
            appendSeqs
          );
        } else if (ablativePhrase.possessiveAltSequences) {
          locativePossessiveSequences = appendObjectSequences(
            baseSequences,
            ablativePhrase.possessiveAltSequences
          );
        }
        if (ablativePhrase.possessiveAltHasAmbiguity) {
          locativePossessiveHasAmbiguity = true;
        }
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
      const baseSequences = objectSequences;
      objectSequences = appendObjectSequences(
        baseSequences,
        locativePhrase.sequences
      );
      if (locativePossessiveSequences) {
        const appendSeqs =
          locativePhrase.possessiveAltSequences ?? locativePhrase.sequences;
        locativePossessiveSequences = appendObjectSequences(
          locativePossessiveSequences,
          appendSeqs
        );
      } else if (locativePhrase.possessiveAltSequences) {
        locativePossessiveSequences = appendObjectSequences(
          baseSequences,
          locativePhrase.possessiveAltSequences
        );
      }
      if (locativePhrase.possessiveAltHasAmbiguity) {
        locativePossessiveHasAmbiguity = true;
      }
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

    const locativeMatch = matchLocativeMarkerAt(
      ir.tokens,
      modifierIndex,
      sourceLang
    );
    if (locativeMatch) {
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
          verbMatches = verbMatches.map((match) => ({
            ...match,
            entry: resolveAllativeVerbEntry(match.entry),
          }));
          searching = true;
          continue;
        }
      }
      const locativePart = buildLocativePart(locativeMatch, sourceLang);
      recordMirriStripSequences([[locativePart]]);
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
      verbMatches = verbMatches.map((match) => {
        const resolvedEntry = resolveLocativeVerbEntry(
          match.entry,
          locativeMatch
        );
        return resolvedEntry === match.entry
          ? match
          : { ...match, entry: resolvedEntry };
      });
      searching = true;
    }
    if (!searching && instrumentalPhrase) {
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

  const subject = state.lastSubject;
  const subjectPersons =
    hasSubjectImmediate && subject?.kind === "pronoun" && subject.persons?.length
      ? subject.persons
      : null;
  const subjectTailSequences = subjectPersons ? buildSubjectStripSequences() : null;
  const endsWithSequence = (
    sequence: TranslationPart[],
    tail: TranslationPart[]
  ): boolean => {
    if (tail.length === 0 || sequence.length < tail.length) return false;
    for (let offset = 0; offset < tail.length; offset += 1) {
      const seqPart = sequence[sequence.length - tail.length + offset];
      const tailPart = tail[offset];
      if (seqPart?.gup !== tailPart?.gup) return false;
    }
    return true;
  };
  const hasEmphaticPossessiveForSubject = (
    sequence: TranslationPart[]
  ): boolean => {
    if (!subjectPersons) return false;
    return sequence.some((part) =>
      (part.explanations ?? []).some(
        (exp) =>
          exp.key === "POSSESSION_PRONOUN_EMPHATIC" &&
          typeof exp.data?.person === "string" &&
          subjectPersons.includes(exp.data.person as PersonNumber)
      )
    );
  };
  const appendReflexiveSubject = (
    sequences: TranslationPart[][] | null
  ): TranslationPart[][] | null => {
    if (!sequences || !subjectPersons || !subjectTailSequences) return sequences;
    let added = false;
    const expanded: TranslationPart[][] = [...sequences];
    for (const seq of sequences) {
      if (!hasEmphaticPossessiveForSubject(seq)) continue;
      for (const tail of subjectTailSequences) {
        if (endsWithSequence(seq, tail)) continue;
        expanded.push([...seq, ...tail]);
        added = true;
      }
    }
    if (added) state.hasAmbiguity = true;
    return expanded;
  };
  objectSequences = appendReflexiveSubject(objectSequences) ?? objectSequences;
  if (originSequences) {
    const expandedOrigin = appendReflexiveSubject(originSequences);
    if (expandedOrigin) originSequences = expandedOrigin;
  }
  if (purposeSequences) {
    purposeSequences = appendReflexiveSubject(purposeSequences) ?? purposeSequences;
  }
  if (causeSequences) {
    causeSequences = appendReflexiveSubject(causeSequences) ?? causeSequences;
  }
  if (indirectSequences) {
    indirectSequences = appendReflexiveSubject(indirectSequences) ?? indirectSequences;
  }
  if (instrumentalSequences) {
    instrumentalSequences =
      appendReflexiveSubject(instrumentalSequences) ?? instrumentalSequences;
  }
  if (locativePossessiveSequences) {
    locativePossessiveSequences =
      appendReflexiveSubject(locativePossessiveSequences) ??
      locativePossessiveSequences;
  }

  const canUseMirri =
    isHaveVerb &&
    hasSubjectImmediate &&
    state.lastSubject &&
    state.lastSubject.kind !== "pronoun";
  if (canUseMirri) {
    for (const sequence of objectSequences) {
      const mirriSeq = applyMirriSuffix(sequence, "mirri", "HAVE_MIRRI");
      if (!mirriSeq) continue;
      if (
        mirriSeq.some((part) => part.alternatives && part.alternatives.length > 0)
      ) {
        haveMirriHasAmbiguity = true;
      }
      haveMirriSequences.push(mirriSeq);
    }
    if (haveMirriSequences.length > 1) {
      haveMirriHasAmbiguity = true;
    }
  }

  if (isHaveVerb && objectSequences.length > 0) {
    for (const sequence of objectSequences) {
      const built = buildBelongingSequences(sequence);
      if (built.sequences.length === 0) continue;
      if (built.hasAmbiguity) haveBelongingHasAmbiguity = true;
      haveBelongingSequences.push(...built.sequences);
    }
    if (haveBelongingSequences.length > 1) {
      haveBelongingHasAmbiguity = true;
    }
  }

  if (isHaveVerb && objectSequences.length > 0) {
    const subject = state.lastSubject;
    const explicitSubject = hasSubjectImmediate && subject;
    if (explicitSubject && !haveStripSequences) {
      haveStripSequences = buildSubjectStripSequences();
    }
    const explicitPossessor =
      explicitSubject && subject
        ? subject.kind === "pronoun" && subject.persons?.length
          ? buildPronounPossessorSequences(
              subject.persons,
              subject.sourceToken ?? ""
            )
          : subject.startIndex !== undefined
            ? buildNounPossessorSequences(
                subject.startIndex,
                subject.sourceToken ?? ""
              )
            : null
        : null;

    const pushHaveBranches = (
      sequences: TranslationPart[][],
      hasAmbiguity: boolean
    ) => {
      if (hasAmbiguity) haveHasAmbiguity = true;
      const branchKeys = new Set<string>();
      for (const rawSeq of sequences) {
        const seq = addHaveNote(rawSeq);
        for (const branch of buildBranches(seq, objectSequences)) {
          const key = branch
            .map((part) => `${part.type}:${part.gup}:${part.meaningKey ?? ""}`)
            .join("|");
          if (branchKeys.has(key)) continue;
          branchKeys.add(key);
          haveBranches.push(branch);
        }
      }
    };

    if (explicitPossessor && explicitPossessor.sequences.length > 0) {
      pushHaveBranches(
        explicitPossessor.sequences,
        explicitPossessor.hasAmbiguity
      );
    } else if (!explicitSubject) {
      for (const match of verbMatches) {
        const persons = expandInclusiveExclusive(match.personNumbers);
        const possessor = buildPronounPossessorSequences(
          persons,
          match.source
        );
        if (!possessor || possessor.sequences.length === 0) continue;
        pushHaveBranches(possessor.sequences, possessor.hasAmbiguity);
      }
    }
  }

  const hasTransitiveMatch = verbMatches.some(
    (match) => match.entry.isTransitive
  );
  helpers.maybeApplyAgentSuffix(hasTransitiveMatch, hasSubjectImmediate);
  const agentPossessiveAlt = hasTransitiveMatch
    ? buildAgentPossessiveComitativeCombos(state.combinations)
    : null;

  let presentMatches = verbMatches.filter(
    (match) => match.kind === "present"
  );
  let pastSimpleMatches = verbMatches.filter(
    (match) => match.kind === "past_simple"
  );
  let pastContinuousMatches = verbMatches.filter(
    (match) => match.kind === "past_continuous"
  );
  const futureMatches = verbMatches.filter(
    (match) => match.kind === "future"
  );
  const imperativeMatches = verbMatches.filter(
    (match) => match.kind === "imperative"
  );
  const subjunctiveMatches = verbMatches.filter(
    (match) => match.kind === "subjunctive"
  );
  const gerundMatches = verbMatches.filter(
    (match) => match.kind === "gerund"
  );
  let infinitiveMatches = verbMatches.filter(
    (match) => match.kind === "infinitive"
  );
  const pastHabitualTrigger = hasPastHabitualMarker(ir.tokens, sourceLang);
  const pastHabitualPersons = resolvePastHabitualPersons(ir.tokens, sourceLang);
  let pastHabitualBaseMatches: VerbMatch[] = [];
  if (
    pastHabitualTrigger &&
    pastSimpleMatches.length === 0 &&
    pastContinuousMatches.length === 0
  ) {
    const fallback = presentMatches.length > 0 ? presentMatches : infinitiveMatches;
    if (fallback.length > 0) {
      pastHabitualBaseMatches = fallback.map((match) => ({
        ...match,
        kind: "past_continuous",
      }));
      pastContinuousMatches = pastHabitualBaseMatches;
      presentMatches = [];
      infinitiveMatches = [];
    }
  }
  const presentPersons = new Set<PersonNumber>();
  let gerundContextPersons: PersonNumber[] | null = null;

  const imperativeBranches: TranslationPart[][] = [];
  const imperativeLetsBranches: TranslationPart[][] = [];
  const nearFutureBranches: TranslationPart[][] = [];
  let nearFutureStripSequences: TranslationPart[][] | null = null;
  const presentBranches: TranslationPart[][] = [];
  const habitualPresentBranches: TranslationPart[][] = [];
  const habitualPastBranches: TranslationPart[][] = [];
  const mightBranches: TranslationPart[][] = [];
  const shouldBranches: TranslationPart[][] = [];
  const shouldHaveBranches: TranslationPart[][] = [];
  const pastBranches: TranslationPart[][] = [];
  const futureBranches: TranslationPart[][] = [];
  const gerundBranches: TranslationPart[][] = [];
  const infinitiveBranches: TranslationPart[][] = [];
  const makeAdjBranches: TranslationPart[][] = [];
  const makeAdjPresentBranches: TranslationPart[][] = [];
  const makeAdjPastBranches: TranslationPart[][] = [];
  const makeAdjFutureBranches: TranslationPart[][] = [];
  const makeAdjGerundBranches: TranslationPart[][] = [];
  const makeAdjInfinitiveBranches: TranslationPart[][] = [];
  let makeAdjGerundContextPersons: PersonNumber[] | null = null;
  let makeAdjVerbConsumed = 0;
  let makeAdjObjectConsumed = 0;
  const purposeBranches: TranslationPart[][] = [];
  const causeBranches: TranslationPart[][] = [];
  const actVerbBranches: TranslationPart[][] = [];
  const belongingPurposeBranches: TranslationPart[][] = [];
  const belongingAboutBranches: TranslationPart[][] = [];
  const aboutAltBranches: TranslationPart[][] = [];
  const indirectBranches: TranslationPart[][] = [];
  const instrumentalBranches: TranslationPart[][] = [];
  const originBranches: TranslationPart[][] = [];
  const locativePossessiveBranches: TranslationPart[][] = [];
  const pastPersons = new Set<PersonNumber>();
  const futurePersons = new Set<PersonNumber>();
  const appendBranches = (
    parts: TranslationPart[],
    target: TranslationPart[][]
  ) => {
    target.push(...buildBranches(parts, objectSequences));
    if (locativePossessiveSequences) {
      locativePossessiveBranches.push(
        ...buildBranches(parts, locativePossessiveSequences)
      );
    }
    if (originSequences) {
      originBranches.push(...buildBranches(parts, originSequences));
    }
    if (purposeSequences) {
      purposeBranches.push(...buildBranches(parts, purposeSequences));
    }
    if (causeSequences) {
      causeBranches.push(...buildBranches(parts, causeSequences));
    }
    if (actVerbSequences) {
      actVerbBranches.push(...buildBranches(parts, actVerbSequences));
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
  };
  const buildPastPosBranches = (
    kind: "same-day" | "yesterday",
    match: VerbMatch,
    isProgressive: boolean
  ): TranslationPart[] => {
    const parts: TranslationPart[] = [];
    const basePersons =
      state.lastSubject?.persons ??
      (pastHabitualTrigger ? pastHabitualPersons : null) ??
      match.personNumbers;
    const persons =
      basePersons.length > 0 ? expandInclusiveExclusive(basePersons) : [];
    const subjectParts = hasSubjectImmediate
      ? []
      : helpers.buildImpliedSubjectParts(
          state.lastSubject?.persons ?? persons,
          state.lastSubject?.sourceToken
        );
    parts.push(...subjectParts);
    if (isProgressive) {
      const particle = kind === "same-day" ? "gana" : "ga";
      parts.push(
        createParticlePart(
          particle,
          sourceLang,
          "VERB_PARTICLE_PAST_PROGRESSIVE"
        )
      );
    }
    const gup =
      kind === "same-day"
        ? match.entry.gupForms[2] ?? match.entry.gup
        : match.entry.gupForms[0] ?? match.entry.gup;
    const altGup =
      kind === "same-day" ? match.altGupForms?.[2] : match.altGupForms?.[0];
    const explanationKey =
      kind === "same-day"
        ? isProgressive
          ? "VERB_PAST_SAME_DAY_PROGRESSIVE_POS"
          : "VERB_PAST_SAME_DAY_POS"
        : isProgressive
          ? "VERB_PAST_YESTERDAY_PROGRESSIVE_POS"
          : "VERB_PAST_YESTERDAY_POS";
    parts.push(
      createVerbPart(
        match,
        sourceLang,
        gup,
        explanationKey,
        altGup ? [altGup] : undefined
      )
    );
    return parts;
  };
  const buildFuturePosBranches = (
    kind: "same-day" | "tomorrow",
    match: VerbMatch
  ): TranslationPart[] => {
    const parts: TranslationPart[] = [];
    const subjectParts = hasSubjectImmediate
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
    const gup =
      kind === "same-day"
        ? match.entry.gupForms[0] ?? match.entry.gup
        : match.entry.gupForms[1] ?? match.entry.gup;
    const altGup =
      kind === "same-day" ? match.altGupForms?.[0] : match.altGupForms?.[1];
    const explanationKey =
      kind === "same-day"
        ? "VERB_FUTURE_SAME_DAY_POS"
        : "VERB_FUTURE_TOMORROW_POS";
    parts.push(
      createVerbPart(
        match,
        sourceLang,
        gup,
        explanationKey,
        altGup ? [altGup] : undefined
      )
    );
    return parts;
  };
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

  const buildLetsSubjectPart = (source: string): TranslationPart => {
    const data: Record<string, FeatureValue> = {
      token: source,
      gup: "ŋali",
      person: "1+2_Dual",
    };
    const explanations: ExplanationPayload[] = [
      { key: "PRONOUN_SUBJECT_DUAL", data },
      { key: "PRONOUN_NOTE_INCLUSIVE_DUAL" },
    ];
    return finalizePart(
      {
        type: "pronoun",
        source,
        gup: "ŋali",
        output: "ŋali",
        explanation: "",
        explanations,
        meaningKey: "pronoun.1+2_Dual",
      },
      sourceLang
    );
  };

  const buildLetsVerbAlternatives = (match: VerbMatch): string[] => {
    const base = match.entry.gupForms[0] ?? match.entry.gup;
    const altBase = match.altGupForms?.[0];
    const alts = new Set<string>();
    alts.add(`${base}na`);
    if (altBase && altBase !== base) {
      alts.add(altBase);
      alts.add(`${altBase}na`);
    }
    return Array.from(alts).filter((alt) => alt !== base);
  };

  const buildUnknownStripPart = (source: string): TranslationPart =>
    finalizePart(
      {
        type: "unknown",
        source,
        gup: source,
        output: source,
        explanation: "",
        explanations: [
          { key: "PIPELINE_PLACEHOLDER" },
          { key: "TOKEN_PASSTHROUGH", data: { token: source } },
        ],
      },
      sourceLang
    );

  const buildAuxStripSequences = (
    auxMatch: VerbMatch | null,
    trailingUnknowns: string[] = []
  ): TranslationPart[][] => {
    const suffixParts = trailingUnknowns.map(buildUnknownStripPart);
    const sequences: TranslationPart[][] = [];
    if (!auxMatch) {
      if (suffixParts.length > 0) sequences.push(suffixParts);
      return sequences;
    }
    const gup = auxMatch.entry.gupForms[0] ?? auxMatch.entry.gup;
    const verbPart = createVerbPart(
      auxMatch,
      sourceLang,
      gup,
      "VERB_PRESENT_POS"
    );
    const gaPart = createParticlePart(
      "ga",
      sourceLang,
      "VERB_PARTICLE_POS",
      ["yukurra"]
    );
    const yukurraPart = createParticlePart(
      "yukurra",
      sourceLang,
      "VERB_PARTICLE_POS"
    );
    sequences.push([gaPart, verbPart, ...suffixParts]);
    sequences.push([yukurraPart, verbPart, ...suffixParts]);
    if (suffixParts.length === 0) {
      sequences.push([gaPart, verbPart]);
      sequences.push([yukurraPart, verbPart]);
    }
    return sequences;
  };

  const isAllowedNearFuturePersons = (persons: PersonNumber[]): boolean => {
    if (persons.length === 0) return false;
    const allowed = new Set<PersonNumber>([
      "1_Sing",
      "1+2_Dual",
      "1+2_Plur",
    ]);
    return persons.every((person) => allowed.has(person));
  };

  const isVamosInfinitive =
    sourceLang === "es" &&
    ["vamos", "vayamos", "vamonos", "vámonos"].includes(
      normalizeToken(token.source, sourceLang)
    ) &&
    normalizeToken(ir.tokens[index + 1]?.source ?? "", sourceLang) === "a" &&
    matchVerbAt(ir.tokens, index + 2, sourceLang).some(
      (match) => match.kind === "infinitive"
    );
  const isIrPresentToken =
    sourceLang === "es" &&
    verbMatches.some(
      (match) =>
        match.entry.gup === "marrtji" &&
        (match.kind === "present" || match.kind === "subjunctive")
    );
  const isIrAInfinitive =
    isIrPresentToken &&
    normalizeToken(ir.tokens[index + 1]?.source ?? "", sourceLang) === "a" &&
    matchVerbAt(ir.tokens, index + 2, sourceLang).some(
      (match) => match.kind === "infinitive"
    );
  let irInfinitiveBranches: TranslationPart[][] = [];
  let irMainVerbBranches: TranslationPart[][] = [];
  let irImperativeBranches: TranslationPart[][] = [];
  let irLetsBranches: TranslationPart[][] = [];
  let irInfinitiveConsumed = 0;

  const filterNearFutureCombos = (
    combos: TranslationResult["combinations"]
  ): TranslationResult["combinations"] => {
    const allowedGups = new Set([
      "ŋarra",
      "rra",
      "ŋali",
      "ŋilimurru",
      "ŋalimurru",
      "limurru",
    ]);
    return combos.filter((combo) => {
      const hasPronoun = combo.parts.some((part) => part.type === "pronoun");
      if (!hasPronoun) return true;
      return combo.parts.some(
        (part) => part.type === "pronoun" && allowedGups.has(part.gup)
      );
    });
  };

  const hasSubjectPronounInCombos = (
    combos: TranslationResult["combinations"]
  ): boolean =>
    combos.some((combo) =>
      combo.parts.some(
        (part) =>
          part.type === "pronoun" &&
          (part.explanations ?? []).some((exp) =>
            exp.key.startsWith("PRONOUN_SUBJECT") ||
            exp.key === "SUBJECT_IMPLIED"
          )
      )
    );

  const detectNearFutureEs = (
    tokens: IRToken[],
    infinitiveIndex: number
  ): { stripSequences: TranslationPart[][]; personsHint?: PersonNumber[] } | null => {
    const prev = normalizeToken(tokens[infinitiveIndex - 1]?.source ?? "", sourceLang);
    const prev2 = normalizeToken(tokens[infinitiveIndex - 2]?.source ?? "", sourceLang);
    const prev3 = normalizeToken(tokens[infinitiveIndex - 3]?.source ?? "", sourceLang);
    const prev4 = normalizeToken(tokens[infinitiveIndex - 4]?.source ?? "", sourceLang);
    if (prev === "a" && ["voy", "vamos", "vayamos"].includes(prev2)) {
      const auxMatch =
        matchVerbAt(tokens, infinitiveIndex - 2, sourceLang).find(
          (match) => match.kind === "present"
        ) ?? null;
      return {
        stripSequences: buildAuxStripSequences(auxMatch, [
          tokens[infinitiveIndex - 1]?.source ?? "a",
        ]),
        personsHint: auxMatch?.personNumbers,
      };
    }
    if (prev === "por" && ["estoy", "estamos"].includes(prev2)) {
      const personsHint =
        prev2 === "estoy" ? (["1_Sing"] as PersonNumber[]) : (["1+2_Plur"] as PersonNumber[]);
      return {
        stripSequences: buildAuxStripSequences(null, [
          tokens[infinitiveIndex - 2]?.source ?? "estoy",
          tokens[infinitiveIndex - 1]?.source ?? "por",
        ]),
        personsHint,
      };
    }
    if (
      prev === "de" &&
      prev2 === "punto" &&
      prev3 === "a" &&
      ["estoy", "estamos"].includes(prev4)
    ) {
      const personsHint =
        prev4 === "estoy" ? (["1_Sing"] as PersonNumber[]) : (["1+2_Plur"] as PersonNumber[]);
      return {
        stripSequences: buildAuxStripSequences(null, [
          tokens[infinitiveIndex - 4]?.source ?? "estoy",
          tokens[infinitiveIndex - 3]?.source ?? "a",
          tokens[infinitiveIndex - 2]?.source ?? "punto",
          tokens[infinitiveIndex - 1]?.source ?? "de",
        ]),
        personsHint,
      };
    }
    return null;
  };
  const hasHabitualMarkerInSentence = hasHabitualMarker(ir.tokens, sourceLang);
  const hasMightMarkerInSentence = hasMightMarker(ir.tokens, sourceLang);
  const hasShouldMarkerInSentence = hasShouldMarker(ir.tokens, sourceLang);

  if (
    !hasSubjectImmediate &&
    !exclamation &&
    imperativeMatches.length > 0 &&
    !hasMightMarkerInSentence &&
    !hasShouldMarkerInSentence &&
    !hasShouldHaveMarkerInSentence
  ) {
    setLocativeDeterminerMode("non-present");
    for (const match of imperativeMatches) {
      const parts: TranslationPart[] = [
        createVerbPart(
          match,
          sourceLang,
          match.entry.gupForms[1] ?? match.entry.gup,
          "VERB_IMPERATIVE_POS",
          match.altGupForms?.[1] ? [match.altGupForms[1]] : undefined
        ),
      ];
      appendBranches(parts, imperativeBranches);
      if (match.personNumbers.includes("1+2_Plur")) {
        const letsParts: TranslationPart[] = [
          buildLetsSubjectPart(match.source),
          createVerbPart(
            match,
            sourceLang,
            match.entry.gupForms[0] ?? match.entry.gup,
            "VERB_IMPERATIVE_POS",
            buildLetsVerbAlternatives(match)
          ),
        ];
        appendBranches(letsParts, imperativeLetsBranches);
      }
    }
    setLocativeDeterminerMode(null);
  }

  const presentCandidates =
    sourceLang === "es" && subjunctiveMatches.length > 0
      ? [...presentMatches, ...subjunctiveMatches]
      : presentMatches;

  if (presentCandidates.length > 0) {
    setLocativeDeterminerMode("present");
    for (const match of presentCandidates) {
      const persons = expandInclusiveExclusive(match.personNumbers);
      persons.forEach((person) => presentPersons.add(person));
      const subjectParts = hasSubjectImmediate
        ? []
        : helpers.buildImpliedSubjectParts(
            state.lastSubject?.persons ?? persons,
            state.lastSubject?.sourceToken
          );
      const verbPart = createVerbPart(
        match,
        sourceLang,
        match.entry.gupForms[0] ?? match.entry.gup,
        "VERB_PRESENT_POS",
        match.altGupForms?.[0] ? [match.altGupForms[0]] : undefined
      );
      const gaPart = createParticlePart("ga", sourceLang, "VERB_PARTICLE_POS", [
        "yukurra",
      ]);
      const habitualPart = createParticlePart(
        "ŋuli",
        sourceLang,
        "VERB_PARTICLE_HABITUAL"
      );
      const parts: TranslationPart[] = [
        ...subjectParts,
        gaPart,
        verbPart,
      ];
      const habitualWithParticle: TranslationPart[] = [
        ...subjectParts,
        habitualPart,
        gaPart,
        verbPart,
      ];
      const habitualNoParticle: TranslationPart[] = [
        ...subjectParts,
        habitualPart,
        verbPart,
      ];
      if (hasHabitualMarkerInSentence) {
        appendBranches(habitualWithParticle, presentBranches);
        appendBranches(habitualNoParticle, presentBranches);
      } else {
        appendBranches(parts, presentBranches);
        appendBranches(habitualWithParticle, habitualPresentBranches);
        appendBranches(habitualNoParticle, habitualPresentBranches);
      }
    }
    setLocativeDeterminerMode(null);
  }

  if (isIrAInfinitive && presentCandidates.length > 0) {
    const infIndex = index + 2;
    const infinitiveMatch = matchInfinitiveAt(ir.tokens, infIndex, sourceLang);
    if (infinitiveMatch) {
      const infConsumed = infinitiveMatch.match.consumed ?? 1;
      const allowInfNonHuman = Boolean(infinitiveMatch.match.entry.isTransitive);
      const infSubjectPersons =
        state.lastSubject?.persons ??
        expandInclusiveExclusive(presentCandidates[0]?.personNumbers ?? []);
      const infPreObject = buildObjectSequencesFromPending(
        infinitiveMatch.attachedObject
          ? { kind: "pronoun", match: infinitiveMatch.attachedObject }
          : null,
        sourceLang,
        {
          allowNonHumanDemonstrative: allowInfNonHuman,
          reflexivePersons: allowInfNonHuman ? infSubjectPersons : undefined,
          reflexiveSubjectRepeat: true,
        }
      );
      const infAfterObjects = collectObjectSequencesAfterVerb(
        ir.tokens,
        infIndex + infConsumed,
        sourceLang,
        { allowNonHumanDemonstrative: allowInfNonHuman }
      );
      if (infAfterObjects.hasAmbiguity) {
        state.hasAmbiguity = true;
      }
      const infObjectSequences = appendObjectSequences(
        infPreObject.sequences,
        infAfterObjects.sequences
      );
      const subjectPersons = infSubjectPersons;
      for (const match of presentCandidates) {
        const subjectParts = hasSubjectImmediate
          ? []
          : helpers.buildImpliedSubjectParts(
              subjectPersons.length > 0
                ? subjectPersons
                : expandInclusiveExclusive(match.personNumbers),
              state.lastSubject?.sourceToken
            );
        const parts: TranslationPart[] = [
          ...subjectParts,
          createParticlePart("ga", sourceLang, "VERB_PARTICLE_POS", [
            "yukurra",
          ]),
          createVerbPart(
            match,
            sourceLang,
            match.entry.gupForms[0] ?? match.entry.gup,
            "VERB_PRESENT_POS",
            match.altGupForms?.[0] ? [match.altGupForms[0]] : undefined
          ),
          createInfinitivePart(infinitiveMatch.match, sourceLang),
        ];
        irInfinitiveBranches.push(
          ...buildBranches(parts, infObjectSequences, {
            locativeDeterminerMode: "present",
          })
        );
      }
      const hasSubjectInCombos = hasSubjectPronounInCombos(state.combinations);
      const nearFutureSubjectParts = hasSubjectInCombos
        ? []
        : helpers.buildImpliedSubjectParts(
            subjectPersons,
            state.lastSubject?.sourceToken
          );
      const nearFutureParts: TranslationPart[] = [
        ...nearFutureSubjectParts,
        createVerbPart(
          infinitiveMatch.match,
          sourceLang,
          infinitiveMatch.match.entry.gupForms[0] ??
            infinitiveMatch.match.entry.gup,
          "VERB_NEAR_FUTURE_POS",
          infinitiveMatch.match.altGupForms?.[0]
            ? [infinitiveMatch.match.altGupForms[0]]
            : undefined
        ),
      ];
      irMainVerbBranches.push(
        ...buildBranches(nearFutureParts, infObjectSequences, {
          locativeDeterminerMode: "present",
        })
      );
      if (isVamosInfinitive) {
        const imperativePart = createVerbPart(
          infinitiveMatch.match,
          sourceLang,
          infinitiveMatch.match.entry.gupForms[1] ??
            infinitiveMatch.match.entry.gup,
          "VERB_IMPERATIVE_POS",
          infinitiveMatch.match.altGupForms?.[1]
            ? [infinitiveMatch.match.altGupForms[1]]
            : undefined
        );
        irImperativeBranches.push(
          ...buildBranches([imperativePart], infObjectSequences, {
            locativeDeterminerMode: "non-present",
          })
        );
        const letsParts: TranslationPart[] = [
          buildLetsSubjectPart(token.source),
          createVerbPart(
            infinitiveMatch.match,
            sourceLang,
            infinitiveMatch.match.entry.gupForms[0] ??
              infinitiveMatch.match.entry.gup,
            "VERB_IMPERATIVE_POS",
            buildLetsVerbAlternatives(infinitiveMatch.match)
          ),
        ];
        irLetsBranches.push(
          ...buildBranches(letsParts, infObjectSequences, {
            locativeDeterminerMode: "non-present",
          })
        );
      }
      irInfinitiveConsumed = 1 + infConsumed + infAfterObjects.consumed;
    }
  }

  const buildMightBranches = (match: VerbMatch) => {
    if (!hasMightMarkerInSentence) return;
    const persons = expandInclusiveExclusive(match.personNumbers);
    const subjectParts = hasSubjectImmediate
      ? []
      : helpers.buildImpliedSubjectParts(
          state.lastSubject?.persons ?? persons,
          state.lastSubject?.sourceToken
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
      ...subjectParts,
      balaŋuPart,
      secondaryPart,
    ];
    const baseGiParts: TranslationPart[] = [
      ...subjectParts,
      balaŋuPart,
      giPart,
      secondaryPart,
    ];
    const banaParts: TranslationPart[] = [
      ...subjectParts,
      banaPart,
      balaŋuPart,
      secondaryPart,
    ];
    const banaGiParts: TranslationPart[] = [
      ...subjectParts,
      banaPart,
      balaŋuPart,
      giPart,
      secondaryPart,
    ];
    const futureParts: TranslationPart[] = [
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

  const buildShouldBranches = (match: VerbMatch) => {
    if (!hasShouldMarkerInSentence) return;
    const shouldPersons =
      resolveShouldPersons(ir.tokens, sourceLang) ??
      (match.personNumbers.length > 0 ? match.personNumbers : null) ??
      ["3_Sing"];
    const persons = expandInclusiveExclusive(shouldPersons);
    const subjectParts = hasSubjectImmediate
      ? []
      : helpers.buildImpliedSubjectParts(
          state.lastSubject?.persons ?? persons,
          state.lastSubject?.sourceToken
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
      ...subjectParts,
      balaŋuPart,
      verbPart,
    ];
    const balaŋuGiParts: TranslationPart[] = [
      ...subjectParts,
      balaŋuPart,
      giPart,
      verbPart,
    ];
    const nguliParts: TranslationPart[] = [
      ...subjectParts,
      nguliPart,
      verbPart,
    ];
    const nguliGiParts: TranslationPart[] = [
      ...subjectParts,
      nguliPart,
      giPart,
      verbPart,
    ];
    const balaŋuNguliParts: TranslationPart[] = [
      ...subjectParts,
      balaŋuPart,
      nguliPart,
      verbPart,
    ];
    const balaŋuNguliGiParts: TranslationPart[] = [
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

  const buildShouldHaveBranches = (match: VerbMatch) => {
    if (!hasShouldHaveMarkerInSentence) return;
    const shouldPersons =
      resolveShouldHavePersons(ir.tokens, sourceLang) ??
      (match.personNumbers.length > 0 ? match.personNumbers : null) ??
      ["3_Sing"];
    const persons = expandInclusiveExclusive(shouldPersons);
    const subjectParts = hasSubjectImmediate
      ? []
      : helpers.buildImpliedSubjectParts(
          state.lastSubject?.persons ?? persons,
          state.lastSubject?.sourceToken
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
        balaŋuPart,
        ...subjectParts,
        verbPart,
      ];
      shouldHaveBranches.push(...buildBranches(parts, objectSequences));
    }
  };

  if (exclamation && imperativeMatches.length > 0) {
    setLocativeDeterminerMode("non-present");
    const imperativeOnly: TranslationPart[][] = [];
    const imperativeLetsOnly: TranslationPart[][] = [];
    for (const match of imperativeMatches) {
      const parts: TranslationPart[] = [
        createVerbPart(
          match,
          sourceLang,
          match.entry.gupForms[1] ?? match.entry.gup,
          "VERB_IMPERATIVE_POS",
          match.altGupForms?.[1] ? [match.altGupForms[1]] : undefined
        ),
      ];
      appendBranches(parts, imperativeOnly);
      if (match.personNumbers.includes("1+2_Plur")) {
        const letsParts: TranslationPart[] = [
          buildLetsSubjectPart(match.source),
          createVerbPart(
            match,
            sourceLang,
            match.entry.gupForms[0] ?? match.entry.gup,
            "VERB_IMPERATIVE_POS",
            buildLetsVerbAlternatives(match)
          ),
        ];
        appendBranches(letsParts, imperativeLetsOnly);
      }
    }
    imperativeBranches.splice(0, imperativeBranches.length, ...imperativeOnly);
    imperativeLetsBranches.splice(
      0,
      imperativeLetsBranches.length,
      ...imperativeLetsOnly
    );
    presentBranches.splice(0, presentBranches.length);
    setLocativeDeterminerMode(null);
  }

  if (hasSubjectImmediate && presentMatches.length > 0) {
    setLocativeDeterminerMode("present");
    const presentOnly: TranslationPart[][] = [];
    const habitualOnly: TranslationPart[][] = [];
    for (const match of presentMatches) {
      const verbPart = createVerbPart(
        match,
        sourceLang,
        match.entry.gupForms[0] ?? match.entry.gup,
        "VERB_PRESENT_POS",
        match.altGupForms?.[0] ? [match.altGupForms[0]] : undefined
      );
      const gaPart = createParticlePart("ga", sourceLang, "VERB_PARTICLE_POS", [
        "yukurra",
      ]);
      const habitualPart = createParticlePart(
        "ŋuli",
        sourceLang,
        "VERB_PARTICLE_HABITUAL"
      );
      const normalParts: TranslationPart[] = [gaPart, verbPart];
      const habitualWithParticle: TranslationPart[] = [
        habitualPart,
        gaPart,
        verbPart,
      ];
      const habitualNoParticle: TranslationPart[] = [habitualPart, verbPart];
      if (hasHabitualMarkerInSentence) {
        appendBranches(habitualWithParticle, presentOnly);
        appendBranches(habitualNoParticle, presentOnly);
      } else {
        appendBranches(normalParts, presentOnly);
        appendBranches(habitualWithParticle, habitualOnly);
        appendBranches(habitualNoParticle, habitualOnly);
      }
    }
    presentBranches.splice(0, presentBranches.length, ...presentOnly);
    if (hasHabitualMarkerInSentence) {
      habitualPresentBranches.splice(0, habitualPresentBranches.length);
    } else {
      habitualPresentBranches.splice(0, habitualPresentBranches.length, ...habitualOnly);
    }
    imperativeBranches.splice(0, imperativeBranches.length);
    imperativeLetsBranches.splice(0, imperativeLetsBranches.length);
    setLocativeDeterminerMode(null);
  }

  if (
    !hasShouldHaveMarkerInSentence &&
    (pastSimpleMatches.length > 0 || pastContinuousMatches.length > 0)
  ) {
    setLocativeDeterminerMode("non-present");
    const timeContext = resolvePastTimeContext(
      ir.tokens,
      index,
      sourceLang,
      state.skipIndices
    );
    const sameDayBranches: TranslationPart[][] = [];
    const yesterdayBranches: TranslationPart[][] = [];
    const buildPastHabitualBranches = (match: VerbMatch) => {
      const basePersons =
        state.lastSubject?.persons ??
        pastHabitualPersons ??
        match.personNumbers;
      const persons =
        basePersons.length > 0 ? expandInclusiveExclusive(basePersons) : [];
      const subjectParts = hasSubjectImmediate
        ? []
        : helpers.buildImpliedSubjectParts(
            state.lastSubject?.persons ?? persons,
            state.lastSubject?.sourceToken
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
          "VERB_PAST_HABITUAL_POS",
          form.alt ? [form.alt] : undefined
        );
        const baseParts: TranslationPart[] = [
          ...subjectParts,
          habitualPart,
          verbPart,
        ];
        const ganaParts: TranslationPart[] = [
          ...subjectParts,
          habitualPart,
          ganhaPart,
          verbPart,
        ];
        habitualPastBranches.push(...buildBranches(baseParts, objectSequences));
        habitualPastBranches.push(...buildBranches(ganaParts, objectSequences));
      }
    };
    const habitualSourceMatches =
      pastHabitualBaseMatches.length > 0
        ? pastHabitualBaseMatches
        : [...pastSimpleMatches, ...pastContinuousMatches];
    for (const match of pastSimpleMatches) {
      const persons = expandInclusiveExclusive(match.personNumbers);
      persons.forEach((person) => pastPersons.add(person));
      const partsSame = buildPastPosBranches("same-day", match, false);
      const partsYest = buildPastPosBranches("yesterday", match, false);
      sameDayBranches.push(...buildBranches(partsSame, objectSequences));
      yesterdayBranches.push(...buildBranches(partsYest, objectSequences));
    }
    for (const match of pastContinuousMatches) {
      const persons = expandInclusiveExclusive(match.personNumbers);
      persons.forEach((person) => pastPersons.add(person));
      const partsSame = buildPastPosBranches("same-day", match, true);
      const partsYest = buildPastPosBranches("yesterday", match, true);
      sameDayBranches.push(...buildBranches(partsSame, objectSequences));
      yesterdayBranches.push(...buildBranches(partsYest, objectSequences));
    }
    if (pastHabitualTrigger) {
      for (const match of habitualSourceMatches) {
        buildPastHabitualBranches(match);
      }
    }
    let pastMightBranches: TranslationPart[][] = [];
    if (hasMightMarkerInSentence) {
      const pastMatches = [...pastSimpleMatches, ...pastContinuousMatches];
      for (const match of pastMatches) {
        const persons = expandInclusiveExclusive(match.personNumbers);
        const subjectParts = hasSubjectImmediate
          ? []
          : helpers.buildImpliedSubjectParts(
              state.lastSubject?.persons ?? persons,
              state.lastSubject?.sourceToken
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
        const pastParts: TranslationPart[] = [
          ...subjectParts,
          banaPart,
          balaŋuPart,
          pastPart,
        ];
        pastMightBranches.push(...buildBranches(pastParts, objectSequences));
      }
    }

    if (timeContext === "today") {
      const expanded = expandPastBranches(sameDayBranches);
      const expandedHabitual =
        habitualPastBranches.length > 0
          ? expandPastBranches(
              habitualPastBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedMight =
        pastMightBranches.length > 0
          ? expandPastBranches(pastMightBranches, helpers.nextVariantGroup("box"))
          : [];
      if (expanded.length > 0) {
        state.combinations = [
          ...expanded,
          ...expandedHabitual,
          ...expandedMight,
        ];
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
        state.lastConnectorAnchor = connectorAnchor;
        const contextPersons = new Set<PersonNumber>();
        if (hasSubjectImmediate && state.lastSubject?.persons) {
          state.lastSubject.persons.forEach((person) => contextPersons.add(person));
        } else {
          pastPersons.forEach((person) => contextPersons.add(person));
        }
        helpers.updateLastVerbSubject(
          contextPersons.size > 0 ? Array.from(contextPersons) : null,
          connectorAnchor,
          state.lastSubject?.sourceToken
        );
        if (expandedHabitual.length > 0 || expandedMight.length > 0) {
          state.hasAmbiguity = true;
        }
        return { handled: true, hasVerbMatch: true, nextIndex: connectorAnchor };
      }
    } else if (timeContext === "yesterday") {
      const expanded = expandPastBranches(yesterdayBranches);
      const expandedHabitual =
        habitualPastBranches.length > 0
          ? expandPastBranches(
              habitualPastBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedMight =
        pastMightBranches.length > 0
          ? expandPastBranches(pastMightBranches, helpers.nextVariantGroup("box"))
          : [];
      if (expanded.length > 0) {
        state.combinations = [
          ...expanded,
          ...expandedHabitual,
          ...expandedMight,
        ];
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
        state.lastConnectorAnchor = connectorAnchor;
        const contextPersons = new Set<PersonNumber>();
        if (hasSubjectImmediate && state.lastSubject?.persons) {
          state.lastSubject.persons.forEach((person) => contextPersons.add(person));
        } else {
          pastPersons.forEach((person) => contextPersons.add(person));
        }
        helpers.updateLastVerbSubject(
          contextPersons.size > 0 ? Array.from(contextPersons) : null,
          connectorAnchor,
          state.lastSubject?.sourceToken
        );
        if (expandedHabitual.length > 0 || expandedMight.length > 0) {
          state.hasAmbiguity = true;
        }
        return { handled: true, hasVerbMatch: true, nextIndex: connectorAnchor };
      }
    } else {
      const sameDayGroup: VariantGroup = helpers.nextVariantGroup("box");
      const yesterdayGroup: VariantGroup = helpers.nextVariantGroup("box");
      const expandedSame = expandPastBranches(sameDayBranches, sameDayGroup);
      const expandedYesterday = expandPastBranches(
        yesterdayBranches,
        yesterdayGroup
      );
      const expandedHabitual =
        habitualPastBranches.length > 0
          ? expandPastBranches(
              habitualPastBranches,
              helpers.nextVariantGroup("box")
            )
          : [];
      const expandedMight =
        pastMightBranches.length > 0
          ? expandPastBranches(pastMightBranches, helpers.nextVariantGroup("box"))
          : [];
      state.combinations = [
        ...expandedSame,
        ...expandedYesterday,
        ...expandedHabitual,
        ...expandedMight,
      ];
      if (
        expandedSame.length > 0 ||
        expandedYesterday.length > 0 ||
        expandedMight.length > 0
      ) {
        state.hasAmbiguity = true;
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
        state.lastConnectorAnchor = connectorAnchor;
        const contextPersons = new Set<PersonNumber>();
        if (hasSubjectImmediate && state.lastSubject?.persons) {
          state.lastSubject.persons.forEach((person) => contextPersons.add(person));
        } else {
          pastPersons.forEach((person) => contextPersons.add(person));
        }
        helpers.updateLastVerbSubject(
          contextPersons.size > 0 ? Array.from(contextPersons) : null,
          connectorAnchor,
          state.lastSubject?.sourceToken
        );
        return { handled: true, hasVerbMatch: true, nextIndex: connectorAnchor };
      }
    }
    setLocativeDeterminerMode(null);
  }

  if (futureMatches.length > 0) {
    setLocativeDeterminerMode("non-present");
    const timeContext = resolveFutureTimeContext(
      ir.tokens,
      index,
      sourceLang,
      state.skipIndices
    );
    const sameDayBranches: TranslationPart[][] = [];
    const tomorrowBranches: TranslationPart[][] = [];
    for (const match of futureMatches) {
      const persons = expandInclusiveExclusive(match.personNumbers);
      persons.forEach((person) => futurePersons.add(person));
      const partsSame = buildFuturePosBranches("same-day", match);
      const partsTomorrow = buildFuturePosBranches("tomorrow", match);
      sameDayBranches.push(...buildBranches(partsSame, objectSequences));
      tomorrowBranches.push(...buildBranches(partsTomorrow, objectSequences));
    }

    if (timeContext === "same-day") {
      futureBranches.push(...sameDayBranches);
    } else if (timeContext === "tomorrow") {
      futureBranches.push(...tomorrowBranches);
    } else {
      const sameDayGroup: VariantGroup = helpers.nextVariantGroup("box");
      const tomorrowGroup: VariantGroup = helpers.nextVariantGroup("box");
      const expandedSame = expandPastBranches(sameDayBranches, sameDayGroup);
      const expandedTomorrow = expandPastBranches(
        tomorrowBranches,
        tomorrowGroup
      );
      state.combinations = [...expandedSame, ...expandedTomorrow];
      if (expandedSame.length > 0 || expandedTomorrow.length > 0) {
        state.hasAmbiguity = true;
        const connectorAnchor = index + verbConsumed - 1 + objectConsumed;
        state.lastConnectorAnchor = connectorAnchor;
        const contextPersons = new Set<PersonNumber>();
        if (hasSubjectImmediate && state.lastSubject?.persons) {
          state.lastSubject.persons.forEach((person) => contextPersons.add(person));
        } else {
          futurePersons.forEach((person) => contextPersons.add(person));
        }
        helpers.updateLastVerbSubject(
          contextPersons.size > 0 ? Array.from(contextPersons) : null,
          connectorAnchor,
          state.lastSubject?.sourceToken
        );
        return { handled: true, hasVerbMatch: true, nextIndex: connectorAnchor };
      }
    }
    setLocativeDeterminerMode(null);
  }

  if (gerundMatches.length > 0) {
    setLocativeDeterminerMode("present");
    const lastSubjectPersons = helpers.getSubjectPersons(state.lastSubject);
    const lastVerbPersons = helpers.getSubjectPersons(state.lastVerbSubject);
    const gerundPersons = expandInclusiveExclusive(
      lastSubjectPersons ?? lastVerbPersons ?? DEFAULT_GERUND_PERSONS
    );
    gerundContextPersons = gerundPersons;
    const subjectParts = hasSubjectImmediate
      ? []
      : helpers.buildImpliedSubjectParts(
          gerundPersons,
          state.lastSubject?.sourceToken
        );
    for (const match of gerundMatches) {
      const parts: TranslationPart[] = [
        ...subjectParts,
        createParticlePart("ga", sourceLang, "VERB_PARTICLE_POS", [
          "yukurra",
        ]),
        createVerbPart(
          match,
          sourceLang,
          match.entry.gupForms[0] ?? match.entry.gup,
          "VERB_GERUND_POS",
          match.altGupForms?.[0] ? [match.altGupForms[0]] : undefined
        ),
      ];
      appendBranches(parts, gerundBranches);
    }
    setLocativeDeterminerMode(null);
  }

  if (infinitiveMatches.length > 0 && !hasSubjectImmediate) {
    setLocativeDeterminerMode("non-present");
    const lastVerbEndIndex = helpers.getSubjectEndIndex(state.lastVerbSubject);
    const hasVerbBridge =
      lastVerbEndIndex !== null &&
      lastVerbEndIndex < index &&
      sourceLang === "es" &&
      ir.tokens
        .slice(lastVerbEndIndex + 1, index)
        .every((bridgeToken) => {
          const normalized = normalizeToken(bridgeToken.source, sourceLang);
          return normalized === "a" || normalized === "por" || normalized === "de" || normalized === "punto";
        });
    const hasVerbContext =
      lastVerbEndIndex !== null &&
      (lastVerbEndIndex >= index - 1 || hasVerbBridge);
    const lastSubjectPersons = helpers.getSubjectPersons(state.lastSubject);
    const lastVerbPersons = helpers.getSubjectPersons(state.lastVerbSubject);
    const infinitivePersons = expandInclusiveExclusive(
      lastSubjectPersons ?? lastVerbPersons ?? []
    );
    const nearFutureInfo =
      sourceLang === "es" ? detectNearFutureEs(ir.tokens, index) : null;
    const nearFuturePersons =
      nearFutureInfo?.personsHint ?? lastSubjectPersons ?? lastVerbPersons ?? [];
    const subjectParts =
      !hasSubjectImmediate &&
      infinitivePersons.length > 0 &&
      !hasVerbContext
        ? helpers.buildImpliedSubjectParts(
            infinitivePersons,
            state.lastSubject?.sourceToken
          )
        : [];
    const shouldNearFuture =
      Boolean(nearFutureInfo) && isAllowedNearFuturePersons(nearFuturePersons);
    if (shouldNearFuture && !nearFutureStripSequences) {
      nearFutureStripSequences = nearFutureInfo?.stripSequences ?? null;
    }
    for (const match of infinitiveMatches) {
      const parts: TranslationPart[] = [
        ...subjectParts,
        createInfinitivePart(match, sourceLang),
      ];
      appendBranches(parts, infinitiveBranches);
      if (shouldNearFuture) {
        const hasSubjectInCombos = hasSubjectPronounInCombos(state.combinations);
        const nearFutureSubjectParts = hasSubjectInCombos
          ? []
          : helpers.buildImpliedSubjectParts(
              nearFuturePersons,
              state.lastSubject?.sourceToken
            );
        const nearFutureParts: TranslationPart[] = [
          ...nearFutureSubjectParts,
          createVerbPart(
            match,
            sourceLang,
            match.entry.gupForms[0] ?? match.entry.gup,
            "VERB_NEAR_FUTURE_POS",
            match.altGupForms?.[0] ? [match.altGupForms[0]] : undefined
          ),
        ];
        nearFutureBranches.push(...buildBranches(nearFutureParts, objectSequences));
      }
    }
    setLocativeDeterminerMode(null);
  }

  if (makeAdjMatch && makeAdjMatch.matches.length > 0) {
    makeAdjVerbConsumed = makeAdjMatch.consumed;
    const makeAdjReflexivePersons = makeAdjMatch.matches.some(
      (match) => match.entry.isTransitive
    )
      ? state.lastSubject?.persons
      : undefined;
    const makeAdjPre = buildObjectSequencesFromPending(
      objectFromPending,
      sourceLang,
      {
        allowNonHumanDemonstrative,
        reflexivePersons: makeAdjReflexivePersons,
        reflexiveSubjectRepeat: true,
      }
    );
    const makeAdjAttached = buildObjectSequencesFromPending(
      attachedObject ? { kind: "pronoun", match: attachedObject } : null,
      sourceLang,
      {
        allowNonHumanDemonstrative,
        reflexivePersons: makeAdjReflexivePersons,
        reflexiveSubjectRepeat: true,
      }
    );
    const makeAdjBetween = buildObjectSequencesFromPending(
      makeAdjMatch.objectBetween
        ? { kind: "pronoun", match: makeAdjMatch.objectBetween }
        : null,
      sourceLang,
      {
        allowNonHumanDemonstrative,
        reflexivePersons: makeAdjReflexivePersons,
        reflexiveSubjectRepeat: true,
      }
    );
    let makeAdjObjectSequences = appendObjectSequences(
      makeAdjPre.sequences,
      makeAdjAttached.sequences
    );
    makeAdjObjectSequences = appendObjectSequences(
      makeAdjObjectSequences,
      makeAdjBetween.sequences
    );
    const makeAdjAfterObjects = collectObjectSequencesAfterVerb(
      ir.tokens,
      index + makeAdjVerbConsumed,
      sourceLang,
      { allowNonHumanDemonstrative }
    );
    makeAdjObjectConsumed = makeAdjAfterObjects.consumed;
    if (makeAdjAfterObjects.hasAmbiguity) {
      state.hasAmbiguity = true;
    }
    makeAdjObjectSequences = appendObjectSequences(
      makeAdjObjectSequences,
      makeAdjAfterObjects.sequences
    );

    const makeAdjPresentMatches = makeAdjMatch.matches.filter(
      (match) => match.kind === "present"
    );
    const makeAdjSubjMatches = makeAdjMatch.matches.filter(
      (match) => match.kind === "subjunctive"
    );
    const makeAdjPastSimpleMatches = makeAdjMatch.matches.filter(
      (match) => match.kind === "past_simple"
    );
    const makeAdjPastContinuousMatches = makeAdjMatch.matches.filter(
      (match) => match.kind === "past_continuous"
    );
    const makeAdjFutureMatches = makeAdjMatch.matches.filter(
      (match) => match.kind === "future"
    );
    const makeAdjImperativeMatches = makeAdjMatch.matches.filter(
      (match) => match.kind === "imperative"
    );
    const makeAdjGerundMatches = makeAdjMatch.matches.filter(
      (match) => match.kind === "gerund"
    );
    const makeAdjInfinitiveMatches = makeAdjMatch.matches.filter(
      (match) => match.kind === "infinitive"
    );

    const makeAdjPresentCandidates =
      sourceLang === "es" && makeAdjSubjMatches.length > 0
        ? [...makeAdjPresentMatches, ...makeAdjSubjMatches]
        : makeAdjPresentMatches;

    if (!hasSubjectImmediate && !exclamation && makeAdjImperativeMatches.length > 0) {
      setLocativeDeterminerMode("non-present");
      for (const match of makeAdjImperativeMatches) {
        const parts: TranslationPart[] = [
          createVerbPart(
            match,
            sourceLang,
            match.entry.gupForms[1] ?? match.entry.gup,
            "VERB_IMPERATIVE_POS",
            match.altGupForms?.[1] ? [match.altGupForms[1]] : undefined
          ),
        ];
        makeAdjBranches.push(...buildBranches(parts, makeAdjObjectSequences));
      }
      setLocativeDeterminerMode(null);
    }

    if (makeAdjPresentCandidates.length > 0) {
      setLocativeDeterminerMode("present");
      for (const match of makeAdjPresentCandidates) {
        const persons = expandInclusiveExclusive(match.personNumbers);
        persons.forEach((person) => presentPersons.add(person));
        const subjectParts = hasSubjectImmediate
          ? []
          : helpers.buildImpliedSubjectParts(
              state.lastSubject?.persons ?? persons,
              state.lastSubject?.sourceToken
            );
        const parts: TranslationPart[] = [
          ...subjectParts,
          createParticlePart("ga", sourceLang, "VERB_PARTICLE_POS", [
            "yukurra",
          ]),
          createVerbPart(
            match,
            sourceLang,
            match.entry.gupForms[0] ?? match.entry.gup,
            "VERB_PRESENT_POS",
            match.altGupForms?.[0] ? [match.altGupForms[0]] : undefined
          ),
        ];
        makeAdjPresentBranches.push(
          ...buildBranches(parts, makeAdjObjectSequences)
        );
      }
      setLocativeDeterminerMode(null);
    }

    if (makeAdjPastSimpleMatches.length > 0 || makeAdjPastContinuousMatches.length > 0) {
      setLocativeDeterminerMode("non-present");
      const timeContext = resolvePastTimeContext(
        ir.tokens,
        index,
        sourceLang,
        state.skipIndices
      );
      const sameDayBranches: TranslationPart[][] = [];
      const yesterdayBranches: TranslationPart[][] = [];
      for (const match of makeAdjPastSimpleMatches) {
        const persons = expandInclusiveExclusive(match.personNumbers);
        persons.forEach((person) => pastPersons.add(person));
        const partsSame = buildPastPosBranches("same-day", match, false);
        const partsYest = buildPastPosBranches("yesterday", match, false);
        sameDayBranches.push(...buildBranches(partsSame, makeAdjObjectSequences));
        yesterdayBranches.push(...buildBranches(partsYest, makeAdjObjectSequences));
      }
      for (const match of makeAdjPastContinuousMatches) {
        const persons = expandInclusiveExclusive(match.personNumbers);
        persons.forEach((person) => pastPersons.add(person));
        const partsSame = buildPastPosBranches("same-day", match, true);
        const partsYest = buildPastPosBranches("yesterday", match, true);
        sameDayBranches.push(...buildBranches(partsSame, makeAdjObjectSequences));
        yesterdayBranches.push(...buildBranches(partsYest, makeAdjObjectSequences));
      }
      if (timeContext === "today") {
        makeAdjPastBranches.push(...sameDayBranches);
      } else if (timeContext === "yesterday") {
        makeAdjPastBranches.push(...yesterdayBranches);
      } else {
        makeAdjPastBranches.push(...sameDayBranches, ...yesterdayBranches);
      }
      setLocativeDeterminerMode(null);
    }

    if (makeAdjFutureMatches.length > 0) {
      setLocativeDeterminerMode("non-present");
      const timeContext = resolveFutureTimeContext(
        ir.tokens,
        index,
        sourceLang,
        state.skipIndices
      );
      const sameDayBranches: TranslationPart[][] = [];
      const tomorrowBranches: TranslationPart[][] = [];
      for (const match of makeAdjFutureMatches) {
        const persons = expandInclusiveExclusive(match.personNumbers);
        persons.forEach((person) => futurePersons.add(person));
        const partsSame = buildFuturePosBranches("same-day", match);
        const partsTomorrow = buildFuturePosBranches("tomorrow", match);
        sameDayBranches.push(...buildBranches(partsSame, makeAdjObjectSequences));
        tomorrowBranches.push(...buildBranches(partsTomorrow, makeAdjObjectSequences));
      }
      if (timeContext === "same-day") {
        makeAdjFutureBranches.push(...sameDayBranches);
      } else if (timeContext === "tomorrow") {
        makeAdjFutureBranches.push(...tomorrowBranches);
      } else {
        makeAdjFutureBranches.push(...sameDayBranches, ...tomorrowBranches);
      }
      setLocativeDeterminerMode(null);
    }

    if (makeAdjGerundMatches.length > 0) {
      setLocativeDeterminerMode("present");
      const lastSubjectPersons = helpers.getSubjectPersons(state.lastSubject);
      const lastVerbPersons = helpers.getSubjectPersons(state.lastVerbSubject);
      const gerundPersons = expandInclusiveExclusive(
        lastSubjectPersons ?? lastVerbPersons ?? DEFAULT_GERUND_PERSONS
      );
      makeAdjGerundContextPersons = gerundPersons;
      const subjectParts = hasSubjectImmediate
        ? []
        : helpers.buildImpliedSubjectParts(
            gerundPersons,
            state.lastSubject?.sourceToken
          );
      for (const match of makeAdjGerundMatches) {
        const parts: TranslationPart[] = [
          ...subjectParts,
          createParticlePart("ga", sourceLang, "VERB_PARTICLE_POS", [
            "yukurra",
          ]),
          createVerbPart(
            match,
            sourceLang,
            match.entry.gupForms[0] ?? match.entry.gup,
            "VERB_GERUND_POS",
            match.altGupForms?.[0] ? [match.altGupForms[0]] : undefined
          ),
        ];
        makeAdjGerundBranches.push(
          ...buildBranches(parts, makeAdjObjectSequences)
        );
      }
      setLocativeDeterminerMode(null);
    }

    if (makeAdjInfinitiveMatches.length > 0) {
      setLocativeDeterminerMode("non-present");
      const lastVerbEndIndex = helpers.getSubjectEndIndex(state.lastVerbSubject);
      const hasVerbContext =
        lastVerbEndIndex !== null && lastVerbEndIndex >= index - 1;
      const lastSubjectPersons = helpers.getSubjectPersons(state.lastSubject);
      const lastVerbPersons = helpers.getSubjectPersons(state.lastVerbSubject);
      const infinitivePersons = expandInclusiveExclusive(
        lastSubjectPersons ?? lastVerbPersons ?? []
      );
      const subjectParts =
        !hasSubjectImmediate &&
        infinitivePersons.length > 0 &&
        !hasVerbContext
          ? helpers.buildImpliedSubjectParts(
              infinitivePersons,
              state.lastSubject?.sourceToken
            )
          : [];
      for (const match of makeAdjInfinitiveMatches) {
        const parts: TranslationPart[] = [
          ...subjectParts,
          createInfinitivePart(match, sourceLang),
        ];
        makeAdjInfinitiveBranches.push(
          ...buildBranches(parts, makeAdjObjectSequences)
        );
      }
      setLocativeDeterminerMode(null);
    }

    makeAdjBranches.push(
      ...makeAdjPresentBranches,
      ...makeAdjPastBranches,
      ...makeAdjFutureBranches,
      ...makeAdjGerundBranches,
      ...makeAdjInfinitiveBranches
    );
  }

  if (hasMightMarkerInSentence) {
    const seen = new Set<string>();
    const candidates = [
      ...presentCandidates,
      ...pastSimpleMatches,
      ...pastContinuousMatches,
      ...subjunctiveMatches,
      ...futureMatches,
      ...infinitiveMatches,
    ];
    for (const match of candidates) {
      const key = `${match.entry.gup}|${match.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      buildMightBranches(match);
    }
    if (mightBranches.length === 0) {
      const pastMatches = [...pastSimpleMatches, ...pastContinuousMatches];
      for (const match of pastMatches) {
        const persons = expandInclusiveExclusive(match.personNumbers);
        const subjectParts = hasSubjectImmediate
          ? []
          : helpers.buildImpliedSubjectParts(
              state.lastSubject?.persons ?? persons,
              state.lastSubject?.sourceToken
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
        const pastParts: TranslationPart[] = [
          ...subjectParts,
          banaPart,
          balaŋuPart,
          pastPart,
        ];
        mightBranches.push(...buildBranches(pastParts, objectSequences));
      }
    }
  }

  if (hasShouldHaveMarkerInSentence) {
    const seen = new Set<string>();
    const candidates = [
      ...presentCandidates,
      ...pastSimpleMatches,
      ...pastContinuousMatches,
      ...futureMatches,
      ...infinitiveMatches,
      ...subjunctiveMatches,
    ];
    for (const match of candidates) {
      const key = `${match.entry.gup}|${match.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      buildShouldHaveBranches(match);
    }
  }

  if (hasShouldMarkerInSentence) {
    const seen = new Set<string>();
    const candidates = [
      ...presentCandidates,
      ...futureMatches,
      ...infinitiveMatches,
      ...subjunctiveMatches,
    ];
    for (const match of candidates) {
      const key = `${match.entry.gup}|${match.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      buildShouldBranches(match);
    }
  }

  const modalMatch = matchModalVerbAt(ir.tokens, index, sourceLang);
  let modalBranches: TranslationPart[][] = [];
  let modalObjectConsumed = 0;
  if (modalMatch) {
    let pendingModal: ModalPendingObject = null;
    if (objectFromPending) {
      pendingModal =
        objectFromPending.kind === "pronoun"
          ? { kind: "pronoun", match: objectFromPending.match }
          : { kind: "noun", match: objectFromPending.match };
    } else if (attachedObject) {
      pendingModal = { kind: "pronoun", match: attachedObject };
    }
    const modalPre = buildModalObjectSequencesFromPending(
      pendingModal,
      sourceLang
    );
    const modalPersons =
      state.lastSubject?.persons ?? expandInclusiveExclusive(modalMatch.persons);
    const modalAfter = collectModalObjectSequences(
      ir.tokens,
      index + modalMatch.consumed,
      sourceLang,
      { reflexivePersons: modalPersons, reflexiveSubjectRepeat: true }
    );
    modalObjectConsumed = modalAfter.consumed;
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
    modalBranches = helpers.buildModalBranches(
      modalMatch,
      modalSubjectParts,
      modalObjectSequences,
      false
    );
  }

  const branches = [
    ...imperativeBranches,
    ...presentBranches,
    ...pastBranches,
    ...futureBranches,
    ...gerundBranches,
    ...infinitiveBranches,
  ];
  const normalBranches =
    isIrAInfinitive && irMainVerbBranches.length > 0
      ? irMainVerbBranches
      : branches;
  const hasIrBoxes = isIrAInfinitive && irInfinitiveBranches.length > 0;
  const hasVamosBoxes =
    isVamosInfinitive &&
    (irImperativeBranches.length > 0 || irLetsBranches.length > 0);
  const hasMakeAdjBranches = makeAdjBranches.length > 0;

  if (
    normalBranches.length > 0 ||
    hasIrBoxes ||
    hasVamosBoxes ||
    hasMakeAdjBranches ||
    modalBranches.length > 0 ||
    haveBranches.length > 0 ||
    haveMirriSequences.length > 0 ||
    originBranches.length > 0 ||
    purposeBranches.length > 0 ||
    causeBranches.length > 0 ||
    indirectBranches.length > 0 ||
    instrumentalBranches.length > 0 ||
    shouldBranches.length > 0 ||
    shouldHaveBranches.length > 0
  ) {
    let expandedNormal: TranslationResult["combinations"] = [];
    const baseGroupId = objectDropAmbiguity
      ? helpers.nextVariantGroup("dropdown")
      : null;
    const baseCombos = baseGroupId
      ? state.combinations.map((combo) => ({
          ...combo,
          variantGroup: baseGroupId,
        }))
      : state.combinations;
    if (normalBranches.length > 0) {
      for (const branch of normalBranches) {
        expandedNormal = expandedNormal.concat(
          helpers.appendPartsToCombinations(baseCombos, branch, "dropdown")
        );
      }
    }

    let expandedIrInfinitive: TranslationResult["combinations"] = [];
    if (hasIrBoxes) {
      const irGroup: VariantGroup = helpers.nextVariantGroup("box");
      const irBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: irGroup,
      }));
      for (const branch of irInfinitiveBranches) {
        expandedIrInfinitive = expandedIrInfinitive.concat(
          helpers.appendPartsToCombinations(irBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedVamosImperative: TranslationResult["combinations"] = [];
    if (irImperativeBranches.length > 0) {
      const imperativeGroup: VariantGroup = helpers.nextVariantGroup("box");
      const imperativeBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: imperativeGroup,
      }));
      for (const branch of irImperativeBranches) {
        expandedVamosImperative = expandedVamosImperative.concat(
          helpers.appendPartsToCombinations(
            imperativeBaseCombos,
            branch,
            "dropdown"
          )
        );
      }
    }

    let expandedVamosLets: TranslationResult["combinations"] = [];
    if (irLetsBranches.length > 0) {
      const letsGroup: VariantGroup = helpers.nextVariantGroup("box");
      const letsBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: letsGroup,
      }));
      for (const branch of irLetsBranches) {
        expandedVamosLets = expandedVamosLets.concat(
          helpers.appendPartsToCombinations(letsBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedNearFuture: TranslationResult["combinations"] = [];
    if (nearFutureBranches.length > 0 && !isIrAInfinitive) {
      const nearFutureGroup: VariantGroup = helpers.nextVariantGroup("box");
      const nearFutureBaseCombos = filterNearFutureCombos(
        state.combinations
      ).map((combo) => ({
        ...combo,
        parts: stripTrailingSequences(combo.parts, nearFutureStripSequences),
        variantGroup: nearFutureGroup,
      }));
      for (const branch of nearFutureBranches) {
        expandedNearFuture = expandedNearFuture.concat(
          helpers.appendPartsToCombinations(nearFutureBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedLetsImperative: TranslationResult["combinations"] = [];
    if (imperativeLetsBranches.length > 0 && !hasVamosBoxes) {
      const letsGroup: VariantGroup = helpers.nextVariantGroup("box");
      const letsBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: letsGroup,
      }));
      for (const branch of imperativeLetsBranches) {
        expandedLetsImperative = expandedLetsImperative.concat(
          helpers.appendPartsToCombinations(letsBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedHabitual: TranslationResult["combinations"] = [];
    if (habitualPresentBranches.length > 0) {
      const habitualGroup: VariantGroup = helpers.nextVariantGroup("box");
      const habitualBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: habitualGroup,
      }));
      for (const branch of habitualPresentBranches) {
        expandedHabitual = expandedHabitual.concat(
          helpers.appendPartsToCombinations(
            habitualBaseCombos,
            branch,
            "dropdown"
          )
        );
      }
    }

    let expandedMakeAdj: TranslationResult["combinations"] = [];
    if (hasMakeAdjBranches) {
      const makeAdjGroup: VariantGroup = helpers.nextVariantGroup("box");
      const makeAdjBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: makeAdjGroup,
      }));
      for (const branch of makeAdjBranches) {
        expandedMakeAdj = expandedMakeAdj.concat(
          helpers.appendPartsToCombinations(makeAdjBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedAgentPossessive: TranslationResult["combinations"] = [];
    if (agentPossessiveAlt && normalBranches.length > 0) {
      const agentGroup: VariantGroup = helpers.nextVariantGroup("box");
      const agentBaseCombos = agentPossessiveAlt.combos.map((combo) => ({
        ...combo,
        variantGroup: agentGroup,
      }));
      for (const branch of normalBranches) {
        expandedAgentPossessive = expandedAgentPossessive.concat(
          helpers.appendPartsToCombinations(agentBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedOrigin: TranslationResult["combinations"] = [];
    if (originBranches.length > 0) {
      const originGroup: VariantGroup = helpers.nextVariantGroup("box");
      const originBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: originGroup,
      }));
      for (const branch of originBranches) {
        expandedOrigin = expandedOrigin.concat(
          helpers.appendPartsToCombinations(originBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedLocativePossessive: TranslationResult["combinations"] = [];
    if (locativePossessiveBranches.length > 0) {
      const locativeGroup: VariantGroup = helpers.nextVariantGroup("box");
      const locativeBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: locativeGroup,
      }));
      for (const branch of locativePossessiveBranches) {
        expandedLocativePossessive = expandedLocativePossessive.concat(
          helpers.appendPartsToCombinations(locativeBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedPurpose: TranslationResult["combinations"] = [];
    if (purposeBranches.length > 0) {
      const purposeGroup: VariantGroup = helpers.nextVariantGroup("box");
      const purposeBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: purposeGroup,
      }));
      for (const branch of purposeBranches) {
        expandedPurpose = expandedPurpose.concat(
          helpers.appendPartsToCombinations(purposeBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedCause: TranslationResult["combinations"] = [];
    if (causeBranches.length > 0) {
      const causeGroup: VariantGroup = helpers.nextVariantGroup("box");
      const causeBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: causeGroup,
      }));
      for (const branch of causeBranches) {
        expandedCause = expandedCause.concat(
          helpers.appendPartsToCombinations(causeBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedActVerb: TranslationResult["combinations"] = [];
    if (actVerbBranches.length > 0) {
      const actGroup: VariantGroup = helpers.nextVariantGroup("box");
      const actBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: actGroup,
      }));
      for (const branch of actVerbBranches) {
        expandedActVerb = expandedActVerb.concat(
          helpers.appendPartsToCombinations(actBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedBelongingPurpose: TranslationResult["combinations"] = [];
    if (belongingPurposeBranches.length > 0) {
      const belongingGroup: VariantGroup = helpers.nextVariantGroup("box");
      const belongingBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: belongingGroup,
      }));
      for (const branch of belongingPurposeBranches) {
        expandedBelongingPurpose = expandedBelongingPurpose.concat(
          helpers.appendPartsToCombinations(
            belongingBaseCombos,
            branch,
            "dropdown"
          )
        );
      }
    }

    let expandedBelongingAbout: TranslationResult["combinations"] = [];
    if (belongingAboutBranches.length > 0) {
      const belongingGroup: VariantGroup = helpers.nextVariantGroup("box");
      const belongingBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: belongingGroup,
      }));
      for (const branch of belongingAboutBranches) {
        expandedBelongingAbout = expandedBelongingAbout.concat(
          helpers.appendPartsToCombinations(
            belongingBaseCombos,
            branch,
            "dropdown"
          )
        );
      }
    }

    let expandedAboutAlt: TranslationResult["combinations"] = [];
    if (aboutAltBranches.length > 0) {
      const altGroup: VariantGroup = helpers.nextVariantGroup("box");
      const altBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: altGroup,
      }));
      for (const branch of aboutAltBranches) {
        expandedAboutAlt = expandedAboutAlt.concat(
          helpers.appendPartsToCombinations(altBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedIndirect: TranslationResult["combinations"] = [];
    if (indirectBranches.length > 0) {
      const indirectGroup: VariantGroup = helpers.nextVariantGroup("box");
      const indirectBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: indirectGroup,
      }));
      for (const branch of indirectBranches) {
        expandedIndirect = expandedIndirect.concat(
          helpers.appendPartsToCombinations(indirectBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedInstrumental: TranslationResult["combinations"] = [];
    if (instrumentalBranches.length > 0) {
      const instrumentalGroup: VariantGroup = helpers.nextVariantGroup("box");
      const instrumentalBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        parts: stripTrailingSequences(combo.parts, objectSequences),
        variantGroup: instrumentalGroup,
      }));
      for (const branch of instrumentalBranches) {
        expandedInstrumental = expandedInstrumental.concat(
          helpers.appendPartsToCombinations(
            instrumentalBaseCombos,
            branch,
            "dropdown"
          )
        );
      }
    }

    let expandedHave: TranslationResult["combinations"] = [];
    if (haveBranches.length > 0) {
      const haveGroup: VariantGroup = helpers.nextVariantGroup("box");
      const haveBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        parts: stripTrailingSequences(combo.parts, haveStripSequences),
        variantGroup: haveGroup,
      }));
      for (const branch of haveBranches) {
        expandedHave = expandedHave.concat(
          helpers.appendPartsToCombinations(haveBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedHaveBelonging: TranslationResult["combinations"] = [];
    if (haveBelongingSequences.length > 0) {
      const belongingGroup: VariantGroup = helpers.nextVariantGroup("box");
      const belongingBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: belongingGroup,
      }));
      for (const seq of haveBelongingSequences) {
        expandedHaveBelonging = expandedHaveBelonging.concat(
          helpers.appendPartsToCombinations(belongingBaseCombos, seq, "dropdown")
        );
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

    let expandedModal: TranslationResult["combinations"] = [];
    if (modalBranches.length > 0) {
      const modalGroup: VariantGroup = helpers.nextVariantGroup("box");
      const modalBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: modalGroup,
      }));
      for (const branch of modalBranches) {
        expandedModal = expandedModal.concat(
          helpers.appendPartsToCombinations(modalBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedMight: TranslationResult["combinations"] = [];
    if (mightBranches.length > 0) {
      const mightGroup: VariantGroup = helpers.nextVariantGroup("box");
      const mightBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: mightGroup,
      }));
      for (const branch of mightBranches) {
        expandedMight = expandedMight.concat(
          helpers.appendPartsToCombinations(mightBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedShould: TranslationResult["combinations"] = [];
    if (shouldBranches.length > 0) {
      const shouldGroup: VariantGroup = helpers.nextVariantGroup("box");
      const shouldBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: shouldGroup,
      }));
      for (const branch of shouldBranches) {
        expandedShould = expandedShould.concat(
          helpers.appendPartsToCombinations(shouldBaseCombos, branch, "dropdown")
        );
      }
    }

    let expandedShouldHave: TranslationResult["combinations"] = [];
    if (shouldHaveBranches.length > 0) {
      const shouldHaveGroup: VariantGroup = helpers.nextVariantGroup("box");
      const shouldHaveBaseCombos = state.combinations.map((combo) => ({
        ...combo,
        variantGroup: shouldHaveGroup,
      }));
      for (const branch of shouldHaveBranches) {
        expandedShouldHave = expandedShouldHave.concat(
          helpers.appendPartsToCombinations(
            shouldHaveBaseCombos,
            branch,
            "dropdown"
          )
        );
      }
    }

    const shouldHaveOnly =
      hasShouldHaveMarkerInSentence && shouldHaveBranches.length > 0;
    const shouldOnly =
      !shouldHaveOnly && hasShouldMarkerInSentence && shouldBranches.length > 0;
    if (shouldOnly) {
      expandedNormal = [];
      expandedIrInfinitive = [];
      expandedVamosImperative = [];
      expandedVamosLets = [];
      expandedHabitual = [];
      expandedNearFuture = [];
      expandedLetsImperative = [];
      expandedModal = [];
      expandedMight = [];
    }
    if (shouldHaveOnly) {
      expandedNormal = [];
      expandedIrInfinitive = [];
      expandedVamosImperative = [];
      expandedVamosLets = [];
      expandedHabitual = [];
      expandedNearFuture = [];
      expandedLetsImperative = [];
      expandedModal = [];
      expandedMight = [];
      expandedShould = [];
    }

    if (
      (!shouldOnly && !shouldHaveOnly && normalBranches.length > 1) ||
      (!shouldOnly && !shouldHaveOnly && expandedIrInfinitive.length > 0) ||
      (!shouldOnly && !shouldHaveOnly && expandedVamosImperative.length > 0) ||
      (!shouldOnly && !shouldHaveOnly && expandedVamosLets.length > 0) ||
      (!shouldOnly && !shouldHaveOnly && expandedHabitual.length > 0) ||
      (!shouldOnly && !shouldHaveOnly && modalBranches.length > 0) ||
      (!shouldOnly && !shouldHaveOnly && mightBranches.length > 0) ||
      shouldBranches.length > 0 ||
      shouldHaveBranches.length > 0 ||
      haveBranches.length > 0 ||
      haveHasAmbiguity ||
      haveBelongingSequences.length > 0 ||
      haveBelongingHasAmbiguity ||
      haveMirriSequences.length > 0 ||
      haveMirriHasAmbiguity ||
      (agentPossessiveAlt &&
        (agentPossessiveAlt.hasAmbiguity || expandedAgentPossessive.length > 0)) ||
      (!shouldOnly &&
        !shouldHaveOnly &&
        nearFutureBranches.length > 0 &&
        !isIrAInfinitive) ||
      (!shouldOnly && !shouldHaveOnly && imperativeLetsBranches.length > 0) ||
      originBranches.length > 0 ||
      originHasAmbiguity ||
      locativePossessiveBranches.length > 0 ||
      locativePossessiveHasAmbiguity ||
      purposeBranches.length > 0 ||
      purposeHasAmbiguity ||
      causeBranches.length > 0 ||
      causeHasAmbiguity ||
      actVerbBranches.length > 0 ||
      actVerbHasAmbiguity ||
      belongingPurposeBranches.length > 0 ||
      belongingPurposeHasAmbiguity ||
      belongingAboutBranches.length > 0 ||
      belongingAboutHasAmbiguity ||
      aboutAltBranches.length > 0 ||
      aboutAltHasAmbiguity ||
      indirectBranches.length > 0 ||
      indirectHasAmbiguity ||
      instrumentalBranches.length > 0 ||
      instrumentalHasAmbiguity ||
      expandedMakeAdj.length > 0
    ) {
      state.hasAmbiguity = true;
    }

    if (shouldHaveOnly) {
      state.combinations = [
        ...expandedShouldHave,
        ...expandedOrigin,
        ...expandedLocativePossessive,
        ...expandedPurpose,
        ...expandedCause,
        ...expandedActVerb,
        ...expandedBelongingPurpose,
        ...expandedBelongingAbout,
        ...expandedAboutAlt,
        ...expandedIndirect,
        ...expandedInstrumental,
        ...expandedHave,
        ...expandedHaveBelonging,
        ...expandedHaveMirri,
        ...expandedAgentPossessive,
        ...expandedMakeAdj,
      ];
    } else if (shouldOnly) {
      state.combinations = [
        ...expandedShould,
        ...expandedOrigin,
        ...expandedLocativePossessive,
        ...expandedPurpose,
        ...expandedCause,
        ...expandedActVerb,
        ...expandedBelongingPurpose,
        ...expandedBelongingAbout,
        ...expandedAboutAlt,
        ...expandedIndirect,
        ...expandedInstrumental,
        ...expandedHave,
        ...expandedHaveBelonging,
        ...expandedHaveMirri,
        ...expandedAgentPossessive,
        ...expandedMakeAdj,
      ];
    } else {
      state.combinations = [
        ...expandedNormal,
        ...expandedIrInfinitive,
        ...expandedVamosImperative,
        ...expandedVamosLets,
        ...expandedHabitual,
        ...expandedNearFuture,
        ...expandedLetsImperative,
        ...expandedAgentPossessive,
        ...expandedHave,
        ...expandedHaveBelonging,
        ...expandedHaveMirri,
        ...expandedOrigin,
        ...expandedLocativePossessive,
        ...expandedPurpose,
        ...expandedCause,
        ...expandedActVerb,
        ...expandedBelongingPurpose,
        ...expandedBelongingAbout,
        ...expandedAboutAlt,
        ...expandedIndirect,
        ...expandedInstrumental,
        ...expandedMakeAdj,
        ...expandedModal,
        ...expandedMight,
        ...expandedShould,
        ...expandedShouldHave,
      ];
    }

    if (hasIrBoxes && irInfinitiveConsumed > 0) {
      for (let offset = 1; offset <= irInfinitiveConsumed; offset += 1) {
        state.skipIndices.add(index + offset);
      }
    }

    const verbSpan =
      normalBranches.length > 0
        ? verbConsumed
        : hasMakeAdjBranches
          ? makeAdjVerbConsumed
          : modalMatch?.consumed ?? verbConsumed;
    const objectSpan =
      normalBranches.length > 0
        ? objectConsumed
        : hasMakeAdjBranches
          ? makeAdjObjectConsumed
          : modalObjectConsumed;
    const extraConsumed =
      hasIrBoxes && irInfinitiveConsumed > 0 ? irInfinitiveConsumed : 0;
    const connectorAnchor = index + verbSpan - 1 + objectSpan + extraConsumed;
    state.lastConnectorAnchor = connectorAnchor;
    const contextPersons = new Set<PersonNumber>();
    if (hasSubjectImmediate && state.lastSubject?.persons) {
      state.lastSubject.persons.forEach((person) => contextPersons.add(person));
    } else {
      if (presentBranches.length > 0 || makeAdjPresentBranches.length > 0) {
        presentPersons.forEach((person) => contextPersons.add(person));
      }
      if (pastBranches.length > 0 || makeAdjPastBranches.length > 0) {
        pastPersons.forEach((person) => contextPersons.add(person));
      }
      if (futureBranches.length > 0 || makeAdjFutureBranches.length > 0) {
        futurePersons.forEach((person) => contextPersons.add(person));
      }
      if (gerundBranches.length > 0 && gerundContextPersons) {
        gerundContextPersons.forEach((person) => contextPersons.add(person));
      }
      if (makeAdjGerundBranches.length > 0 && makeAdjGerundContextPersons) {
        makeAdjGerundContextPersons.forEach((person) =>
          contextPersons.add(person)
        );
      }
      if (!branches.length && !hasMakeAdjBranches && modalMatch?.persons?.length) {
        expandInclusiveExclusive(modalMatch.persons).forEach((person) =>
          contextPersons.add(person)
        );
      }
    }
    helpers.updateLastVerbSubject(
      contextPersons.size > 0 ? Array.from(contextPersons) : null,
      connectorAnchor,
      state.lastSubject?.sourceToken
    );
    return { handled: true, hasVerbMatch: true, nextIndex: connectorAnchor };
  }

  return { handled: false, hasVerbMatch: true };
}
