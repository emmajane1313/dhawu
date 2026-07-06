import { LanguageMode } from "@/app/components/types/components.type";
import type {
  ExplanationKey,
  ExplanationPayload,
  FeatureValue,
  IRSentence,
  PersonNumber,
  TranslationPart,
} from "../../core/types";
import {
  buildCoordinatedPronounPart,
  buildEmphaticPronounPart,
  buildPronounPart,
} from "../../rules/pronoun";
import {
  matchArticleAt,
  matchNounAt,
  isOtherGroupPatternAt,
} from "../../logic/lexiconMatch";
import { expandInclusiveExclusive } from "../../logic/subjects";
import { buildDefiniteArticlePart, finalizePart } from "../../logic/parts";
import { matchDemonstrativeToken } from "../../logic/demonstratives";
import { normalizeToken, isStrongPunctuationToken } from "../../logic/tokenUtils";
import { isNegatorToken } from "../../logic/negation";
import { matchModalSpecialAt } from "../../logic/modal";
import { matchVerbAt } from "../../rules/verb";
import { isClauseConnectorToken } from "../../logic/connectors";
import { matchDhiyakuDeterminerAt } from "../../logic/dhiyaku";
import {
  buildPossessivePronounPart,
  buildPossessiveSuffixPart,
  matchPossessiveEmphasisAt,
  matchPossessiveDeterminer,
  matchPossessiveOfPronoun,
  stripEnglishPossessiveSuffix,
} from "../../logic/possession";
import {
  matchNounPhraseAfterArticle,
  buildNounPhraseParts,
  buildNounPhraseVariants,
  buildOriginPossessivePronounPart,
  buildOriginSuffixPart,
} from "../../logic/objects";
import {
  applyPossessiveSuffix,
  applySuffixToGup,
  getPossessiveSuffixes,
  getSourceOriginSuffixes,
} from "../../logic/suffixes";
import type { TranslateHelpers, TranslateState } from "../types";
import { debugLog } from "../debug";
import { matchCopulaAt as matchCopulaToken } from "../../logic/copula";
import { getLanguagePack } from "../../lang";

type SubjectPosture = "lying" | "standing" | undefined;

const mergeHuman = (
  prev?: boolean,
  next?: boolean
): boolean | undefined => {
  if (prev === undefined || next === undefined) return undefined;
  return prev === next ? prev : undefined;
};

const mergePosture = (
  prev?: SubjectPosture,
  next?: SubjectPosture
): SubjectPosture => {
  if (!prev || !next) return undefined;
  return prev === next ? prev : undefined;
};

const resolvePronounHuman = (
  token: string,
  sourceLang: LanguageMode
): boolean => {
  const normalized = normalizeToken(token, sourceLang);
  if (
    (sourceLang === "en" && normalized === "it") ||
    (sourceLang === "es" && normalized === "ello")
  ) {
    return false;
  }
  return true;
};

const matchSubjectEmphasisAt = (
  tokens: IRSentence["tokens"],
  index: number,
  sourceLang: LanguageMode,
  hasDualMarker: boolean
): { token: IRSentence["tokens"][number]; consumed: number } | null => {
  const pack = getLanguagePack(sourceLang);
  const markers = pack.emphasisMarkers ?? [];
  if (markers.length === 0) return null;
  const normalizedMarkers = new Set(
    markers.map((marker) => pack.normalize(marker))
  );
  const offset = hasDualMarker ? 2 : 1;
  const candidate = tokens[index + offset];
  if (!candidate) return null;
  const normalized = pack.normalize(candidate.source);
  if (!normalizedMarkers.has(normalized)) return null;
  return { token: candidate, consumed: 1 };
};

const matchPossessiveSubjectAt = (args: {
  tokens: IRSentence["tokens"];
  index: number;
  sourceLang: LanguageMode;
}): {
  sequences: TranslationPart[][];
  consumed: number;
  hasAlternatives: boolean;
  hasRawAlternative?: boolean;
  nounIndex?: number;
  isHuman?: boolean;
  posture?: SubjectPosture;
} | null => {
  const { tokens, index, sourceLang } = args;
  const token = tokens[index];
  if (!token) return null;

  const getPhraseNounIndex = (
    phrase: ReturnType<typeof matchNounPhraseAfterArticle>,
    startIndex: number
  ): number | null => {
    if (!phrase) return null;
    const preConsumed = phrase.adjectives.pre.reduce(
      (sum, adj) => sum + adj.consumed,
      0
    );
    return startIndex + preConsumed;
  };

  const withPhraseGlobalIndex = (
    parts: TranslationPart[],
    nounIndex: number | null
  ): TranslationPart[] => {
    if (nounIndex === null) return parts;
    return parts.map((part) => {
      if (
        part.type === "noun" ||
        part.type === "adjective" ||
        part.type === "unknown"
      ) {
        return { ...part, globalIndex: nounIndex };
      }
      return part;
    });
  };

  const determiner = matchPossessiveDeterminer(token.source, sourceLang);
  if (determiner) {
    const emphasis = matchPossessiveEmphasisAt(tokens, index, sourceLang);
    const phraseStart = index + 1 + (emphasis?.consumed ?? 0);
    debugLog("[ridjin-debug] poss-subject", {
      index,
      token: token.source,
      determiner: determiner.source,
      emphasis: emphasis?.source ?? null,
      phraseStart,
    });
    const phrase = matchNounPhraseAfterArticle(tokens, phraseStart, sourceLang, {
      allowUnknownHead: true,
    });
    if (!phrase) {
      debugLog("[ridjin-debug] poss-subject:phrase-miss", {
        index,
        phraseStart,
        next: tokens[phraseStart]?.source ?? null,
      });
    }
    if (phrase) {
      const useOriginPossessor =
        Boolean(phrase.noun.verbalVerbForms) && !emphasis;
      const possessor = useOriginPossessor
        ? buildOriginPossessivePronounPart(determiner, sourceLang, {
            emphatic: Boolean(emphasis),
            sourceOverride: (emphasis as any)?.source,
          })
        : buildPossessivePronounPart(determiner, sourceLang, {
            emphatic: Boolean(emphasis),
            sourceOverride: emphasis?.source,
            includeNonEmphatic: Boolean(emphasis),
          });
      debugLog("[ridjin-debug] poss-subject:phrase-hit", {
        index,
        phraseConsumed: phrase.consumed,
        noun: phrase.noun.source,
        unknownHead: !phrase.noun.entry,
      });
      if (!possessor) return null;
      const demoParts =
        determiner.nonHuman === true
          ? [
              finalizePart(
                {
                  type: "pronoun",
                  source: determiner.source,
                  gup: "dhuwala",
                  output: "dhuwala",
                  explanation: "",
                  explanations: [{ key: "PRONOUN_NOTE_NONHUMAN" }],
                },
                sourceLang
              ),
              finalizePart(
                {
                  type: "pronoun",
                  source: determiner.source,
                  gup: "dhuwali",
                  output: "dhuwali",
                  explanation: "",
                  explanations: [{ key: "PRONOUN_NOTE_NONHUMAN" }],
                },
                sourceLang
              ),
            ]
          : [];
      const nounIndex = getPhraseNounIndex(phrase, phraseStart);
      const possessedBuilt = buildNounPhraseVariants(phrase, sourceLang, {
        splitRawAlternative: true,
      });
      const possessedSequences = possessedBuilt.sequences.map((seq) =>
        withPhraseGlobalIndex(seq, nounIndex)
      );
      const possessorSequences = [[possessor], ...demoParts.map((part) => [part])];
      return {
        sequences: possessorSequences.flatMap((seq) =>
          possessedSequences.map((possessedSeq) => [...seq, ...possessedSeq])
        ),
        consumed: 1 + (emphasis?.consumed ?? 0) + phrase.consumed,
        hasAlternatives:
          Boolean(possessor.alternatives?.length) ||
          demoParts.length > 0 ||
          possessedBuilt.hasRawAlternative,
        hasRawAlternative: possessedBuilt.hasRawAlternative,
        nounIndex: nounIndex ?? undefined,
        isHuman: phrase.noun.isHuman,
        posture: phrase.noun.entry?.posture,
      };
    }
  }

  if (sourceLang === "en") {
    const base = stripEnglishPossessiveSuffix(token.source);
    if (base) {
      const phraseStart = index + 1;
      const phrase = matchNounPhraseAfterArticle(tokens, phraseStart, sourceLang);
      if (phrase) {
        const useOriginPossessor = Boolean(phrase.noun.verbalVerbForms);
        const possessor = useOriginPossessor
          ? buildOriginSuffixPart(base, token.source, sourceLang)
          : buildPossessiveSuffixPart(base, token.source, sourceLang);
        const barePossessor = finalizePart(
          {
            type: "noun",
            source: base,
            gup: base,
            output: base,
            explanation: "",
            explanations: [{ key: "TOKEN_PASSTHROUGH", data: { token: base } }],
          },
          sourceLang
        );
        const nounIndex = getPhraseNounIndex(phrase, phraseStart);
        const possessedBuilt = buildNounPhraseVariants(phrase, sourceLang, {
          splitRawAlternative: true,
        });
        const possessedSequences = possessedBuilt.sequences.map((seq) =>
          withPhraseGlobalIndex(seq, nounIndex)
        );
        return {
          sequences: [
            ...possessedSequences.map((seq) => [possessor, ...seq]),
            ...possessedSequences.map((seq) => [barePossessor, ...seq]),
          ],
          consumed: 1 + phrase.consumed,
          hasAlternatives: true || possessedBuilt.hasRawAlternative,
          hasRawAlternative: possessedBuilt.hasRawAlternative,
          nounIndex: nounIndex ?? undefined,
          isHuman: phrase.noun.isHuman,
          posture: phrase.noun.entry?.posture,
        };
      }
    }
  }

  let cursor = index;
  let articleVariants: TranslationPart[][] = [[]];
  let articleHasAlternatives = false;
  const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
  if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
    cursor += articleMatch.consumed;
    if (articleMatch.kind === "definite") {
      const dhuwalaPart = buildDefiniteArticlePart(
        "dhuwala",
        articleMatch.source,
        sourceLang
      );
      const duwaliPart = buildDefiniteArticlePart(
        "duwali",
        articleMatch.source,
        sourceLang
      );
      articleVariants = [[], [dhuwalaPart], [duwaliPart]];
      articleHasAlternatives = true;
    }
  }
  const possessedPhrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang, {
    allowUnknownHead: true,
  });
  if (!possessedPhrase) return null;
  const useOriginPossessor = Boolean(possessedPhrase.noun.verbalVerbForms);
  const possessedNounIndex = getPhraseNounIndex(possessedPhrase, cursor);
  const possessedBuilt = buildNounPhraseVariants(possessedPhrase, sourceLang, {
    splitRawAlternative: true,
  });
  const possessedSequences = possessedBuilt.sequences.map((seq) =>
    withPhraseGlobalIndex(seq, possessedNounIndex)
  );
  const afterIndex = cursor + possessedPhrase.consumed;
  const connector = tokens[afterIndex];
  if (!connector) return null;
  const connectorNorm = normalizeToken(connector.source, sourceLang);
  const isOf =
    (sourceLang === "es" && connectorNorm === "de") ||
    (sourceLang === "en" && connectorNorm === "of");
  if (!isOf) return null;

  const possessorStart = afterIndex + 1;
  const possessorToken = tokens[possessorStart];
  if (!possessorToken) return null;
  const emphasis = matchPossessiveEmphasisAt(
    tokens,
    possessorStart,
    sourceLang
  );
  let pronounMatch = matchPossessiveOfPronoun(
    possessorToken.source,
    sourceLang
  );
  if (!pronounMatch && emphasis) {
    pronounMatch = matchPossessiveDeterminer(
      possessorToken.source,
      sourceLang
    );
  }
  let possessorSequences: TranslationPart[][] | null = null;
  let possessorConsumed = 0;
  let possessorHasAlternatives = false;

  if (pronounMatch) {
    const part = useOriginPossessor
      ? buildOriginPossessivePronounPart(pronounMatch, sourceLang, {
          emphatic: Boolean(emphasis),
          sourceOverride: emphasis?.source,
        })
      : buildPossessivePronounPart(pronounMatch, sourceLang, {
          emphatic: Boolean(emphasis),
          sourceOverride: emphasis?.source,
          includeNonEmphatic: Boolean(emphasis),
        });
    if (part) {
      possessorSequences = [[part]];
      possessorConsumed = 1 + (emphasis?.consumed ?? 0);
      possessorHasAlternatives = Boolean(part.alternatives?.length);
    }
  } else {
    let possessorCursor = possessorStart;
    let possessorPrefixParts: TranslationPart[] = [];
    const possessorDeterminer = matchDhiyakuDeterminerAt(
      tokens,
      possessorCursor,
      sourceLang
    );
    if (possessorDeterminer) {
      if (possessorDeterminer.part) {
        possessorPrefixParts = [possessorDeterminer.part];
      }
      possessorCursor += possessorDeterminer.consumed;
    }
    const possessorPhrase = matchNounPhraseAfterArticle(
      tokens,
      possessorCursor,
      sourceLang,
      { allowUnknownHead: true }
    );
    if (possessorPhrase) {
      const base = possessorPhrase.noun.gup || possessorPhrase.noun.source;
      const suffixes = useOriginPossessor
        ? getSourceOriginSuffixes(base)
        : getPossessiveSuffixes(base);
      const withSuffix = suffixes.map((suffix) => {
        const gup = useOriginPossessor
          ? applySuffixToGup(base, suffix)
          : applyPossessiveSuffix(base, suffix);
        const parts = buildNounPhraseParts(possessorPhrase, sourceLang, {
          suffix,
          nounNote: {
            key: useOriginPossessor ? "ORIGIN_SUFFIX" : "POSSESSION_SUFFIX",
            data: { token: possessorPhrase.noun.source, gup, suffix },
          },
        });
        return possessorPrefixParts.length > 0
          ? [...possessorPrefixParts, ...parts]
          : parts;
      });
      const withoutSuffix = buildNounPhraseParts(possessorPhrase, sourceLang);
      const isHuman = possessorPhrase.noun.isHuman === true;
      const isNonHuman = possessorPhrase.noun.isHuman === false;
      const isAmbiguous = !isHuman && !isNonHuman;
      if (isHuman) {
        possessorSequences = withSuffix;
        possessorHasAlternatives = withSuffix.length > 1;
      } else if (isNonHuman) {
        possessorSequences = [withoutSuffix];
        possessorHasAlternatives = false;
      } else {
        possessorSequences = [withoutSuffix, ...withSuffix];
        possessorHasAlternatives = true;
      }
      possessorConsumed =
        possessorCursor - possessorStart + possessorPhrase.consumed;
    } else if (!isStrongPunctuationToken(possessorToken)) {
      const suffixPart = useOriginPossessor
        ? buildOriginSuffixPart(
            possessorToken.source,
            possessorToken.source,
            sourceLang
          )
        : buildPossessiveSuffixPart(
            possessorToken.source,
            possessorToken.source,
            sourceLang
          );
      const prefix = possessorPrefixParts.length > 0 ? possessorPrefixParts : [];
      const barePart = finalizePart(
        {
          type: "noun",
          source: possessorToken.source,
          gup: possessorToken.source,
          output: possessorToken.source,
          explanation: "",
          explanations: [
            { key: "TOKEN_PASSTHROUGH", data: { token: possessorToken.source } },
          ],
        },
        sourceLang
      );
      possessorSequences = [[...prefix, suffixPart], [barePart]];
      possessorConsumed = 1;
      possessorHasAlternatives = true;
    }
  }

  if (!possessorSequences) return null;
  const sequences = articleVariants.flatMap((variant) =>
    possessedSequences.flatMap((possessedSeq) =>
      possessorSequences.map((possessorSeq) => [
        ...variant,
        ...possessedSeq,
        ...possessorSeq,
      ])
    )
  );
  return {
    sequences,
    consumed: cursor - index + possessedPhrase.consumed + 1 + possessorConsumed,
    hasAlternatives:
      possessorHasAlternatives || articleHasAlternatives || possessedBuilt.hasRawAlternative,
    hasRawAlternative: possessedBuilt.hasRawAlternative,
    nounIndex: possessedNounIndex ?? undefined,
    isHuman: possessedPhrase.noun.isHuman,
    posture: possessedPhrase.noun.entry?.posture,
  };
};

export function handleSubjects(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  hasDualMarker: boolean;
  nextTokenSource?: string;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const {
    ir,
    index,
    sourceLang,
    hasDualMarker,
    nextTokenSource,
    state,
    helpers,
  } = args;
  const token = ir.tokens[index];
  debugLog("[ridjin-debug] subjects", { index, token: token?.source });
  if (token && sourceLang === "es") {
    const normalized = normalizeToken(token.source, sourceLang);
    const prev = normalizeToken(ir.tokens[index - 1]?.source ?? "", sourceLang);
    const next = normalizeToken(ir.tokens[index + 1]?.source ?? "", sourceLang);
    if (normalized === "punto" && prev === "a" && next === "de") {
      if (matchVerbAt(ir.tokens, index + 2, sourceLang).length > 0) {
        return { handled: false };
      }
    }
  }
  const demoMatch = token ? matchDemonstrativeToken(token.source, sourceLang) : null;
  const demoAllowed = Boolean(demoMatch && allowNonHumanPronounHere());
  if (token && matchCopulaToken(ir.tokens, index, sourceLang) && !demoAllowed) {
    return { handled: false };
  }
  if (token && demoMatch) {
    const nextToken = ir.tokens[index + 1];
    if (nextToken) {
      const directCopula = matchCopulaToken(ir.tokens, index + 1, sourceLang);
      if (directCopula) {
        return { handled: false };
      }
      if (isNegatorToken(nextToken, sourceLang)) {
        const negatedCopula = matchCopulaToken(
          ir.tokens,
          index + 2,
          sourceLang
        );
        if (negatedCopula) {
          return { handled: false };
        }
      }
    }
  }
  if (matchModalSpecialAt(ir.tokens, index, sourceLang)) {
    return { handled: false };
  }
  if (matchVerbAt(ir.tokens, index, sourceLang).length > 0) {
    if (!matchPossessiveDeterminer(token.source, sourceLang)) {
      return { handled: false };
    }
  }

  if (demoAllowed && demoMatch) {
    const variants = demoMatch.variants?.length
      ? demoMatch.variants
      : [demoMatch.gup];
    const data: Record<string, FeatureValue> = {
      token: demoMatch.source,
      gup: variants[0],
      person: "3_Sing",
    };
    const explanations: ExplanationPayload[] = [
      { key: "PRONOUN_SUBJECT_BASE", data },
      { key: "PRONOUN_NOTE_NONHUMAN" },
    ];
    const alternatives =
      variants.length > 1
        ? variants.slice(1).map((gup) => ({
            gup,
            notePayload: { key: "PRONOUN_NOTE_NONHUMAN" as ExplanationKey },
          }))
        : undefined;
    const renderedPart = finalizePart(
      {
        type: "pronoun",
        source: demoMatch.source,
        gup: variants[0],
        output: variants[0],
        explanation: "",
        explanations,
        alternatives,
        meaningKey: "pronoun.3_Sing",
        globalIndex: index,
      },
      sourceLang
    );
    state.combinations = helpers.appendPartsToCombinations(
      state.combinations,
      [renderedPart],
      "dropdown"
    );
    const persons = expandInclusiveExclusive(["3_Sing"]);
    const previousSubject = state.lastSubject;
    const shouldJoin: boolean =
      state.pendingSubjectJoin && Boolean(previousSubject);
    const nounIndices: number[] | undefined = shouldJoin
      ? previousSubject?.nounIndices
      : undefined;
    const mergedHuman = shouldJoin
      ? mergeHuman(previousSubject?.isHuman, false)
      : false;
    const mergedPosture = shouldJoin
      ? mergePosture(previousSubject?.posture, undefined)
      : undefined;
    state.lastSubject = {
      persons,
      sourceToken: demoMatch.source,
      startIndex: shouldJoin ? previousSubject?.startIndex : index,
      endIndex: index,
      kind: "pronoun",
      nounIndices,
      isHuman: mergedHuman,
      posture: mergedPosture,
    };
    state.pendingSubjectJoin = false;
    return { handled: true, nextIndex: index };
  }

  const pronounPart = buildPronounPart(token.source, sourceLang, {
    dualize: hasDualMarker,
    dualMarker: hasDualMarker ? nextTokenSource : undefined,
  });
  if (pronounPart) {
    const isHuman = resolvePronounHuman(token.source, sourceLang);
    const emphasisMatch = matchSubjectEmphasisAt(
      ir.tokens,
      index,
      sourceLang,
      hasDualMarker
    );
    const emphasisConsumed = emphasisMatch?.consumed ?? 0;
    const subjectSourceParts = [token.source];
    if (hasDualMarker && nextTokenSource) subjectSourceParts.push(nextTokenSource);
    if (emphasisMatch) subjectSourceParts.push(emphasisMatch.token.source);
    const subjectSource = subjectSourceParts.join(" ");
    if (isHuman === false && !allowNonHumanPronounHere()) {
      const primaryPerson = pronounPart.explanations?.[0]?.data?.person as
        | PersonNumber
        | undefined;
      if (primaryPerson) {
        const persons = expandInclusiveExclusive([primaryPerson]);
        const impliedParts = helpers.buildImpliedSubjectParts(
          persons,
          subjectSource
        );
        if (impliedParts.length > 0) {
          state.combinations = helpers.appendPartsToCombinations(
            state.combinations,
            impliedParts,
            "dropdown"
          );
        }
        state.lastSubject = {
          persons,
          sourceToken: subjectSource,
          startIndex: index,
          endIndex: index + (hasDualMarker ? 1 : 0) + emphasisConsumed,
          kind: "pronoun",
          isHuman: false,
          posture: undefined,
        };
      }
      state.pendingSubjectJoin = false;
      return {
        handled: true,
        nextIndex: index + (hasDualMarker ? 1 : 0) + emphasisConsumed,
      };
    }
    const primaryPerson = pronounPart.explanations?.[0]?.data?.person as
      | PersonNumber
      | undefined;
    if (emphasisMatch && primaryPerson) {
      const emphaticPart =
        isHuman !== false
          ? buildEmphaticPronounPart(primaryPerson, subjectSource)
          : null;
      if (emphaticPart) {
        const renderedEmphatic = finalizePart(
          {
            ...emphaticPart,
            globalIndex: index,
          },
          sourceLang
        );
        const nonEmphatic = finalizePart(
          {
            ...pronounPart,
            source: subjectSource,
            explanations: [
              ...(pronounPart.explanations ?? []),
              { key: "PRONOUN_NOTE_NON_EMPHATIC" },
            ],
            globalIndex: index,
          },
          sourceLang
        );
        const baseCombos = state.combinations;
        const emphaticCombos = helpers.appendPartsToCombinations(
          baseCombos,
          [renderedEmphatic],
          "dropdown"
        );
        const altGroup = helpers.nextVariantGroup("box");
        const altBase = baseCombos.map((combo) => ({
          ...combo,
          variantGroup:
            combo.variantGroup?.scope === "box" ? combo.variantGroup : altGroup,
        }));
        const nonEmphaticCombos = helpers.appendPartsToCombinations(
          altBase,
          [nonEmphatic],
          "dropdown"
        );
        state.combinations = [...emphaticCombos, ...nonEmphaticCombos];
      } else {
        const renderedPart = finalizePart(
          {
            ...pronounPart,
            source: subjectSource,
            explanations: [
              ...(pronounPart.explanations ?? []),
              { key: "PRONOUN_NOTE_EMPHATIC_UNAVAILABLE" },
            ],
            globalIndex: index,
          },
          sourceLang
        );
        state.combinations = helpers.appendPartsToCombinations(
          state.combinations,
          [renderedPart],
          "dropdown"
        );
      }
      if (primaryPerson) {
        const previousSubject = state.lastSubject;
        const shouldJoin: boolean =
          state.pendingSubjectJoin && Boolean(previousSubject);
        const nounIndices: number[] | undefined = shouldJoin
          ? previousSubject?.nounIndices
          : undefined;
        const mergedHuman = shouldJoin
          ? mergeHuman(previousSubject?.isHuman, isHuman)
          : isHuman;
        const mergedPosture = shouldJoin
          ? mergePosture(previousSubject?.posture, undefined)
          : undefined;
        state.lastSubject = {
          persons: expandInclusiveExclusive([primaryPerson]),
          sourceToken: subjectSource,
          startIndex: shouldJoin ? previousSubject?.startIndex : index,
          endIndex: index + (hasDualMarker ? 1 : 0) + emphasisConsumed,
          kind: "pronoun",
          nounIndices,
          isHuman: mergedHuman,
          posture: mergedPosture,
        };
      }
      state.pendingSubjectJoin = false;
      return {
        handled: true,
        nextIndex: index + (hasDualMarker ? 1 : 0) + emphasisConsumed,
      };
    }
    const renderedPart = finalizePart(
      {
        ...pronounPart,
        globalIndex: index,
      },
      sourceLang
    );
    state.combinations = helpers.appendPartsToCombinations(
      state.combinations,
      [renderedPart],
      "dropdown"
    );
    if (!primaryPerson) {
      state.pendingSubjectJoin = false;
      return { handled: true, nextIndex: hasDualMarker ? index + 1 : index };
    }
    const previousSubject = state.lastSubject;
    const shouldJoin: boolean =
      state.pendingSubjectJoin && Boolean(previousSubject);
    const nounIndices: number[] | undefined = shouldJoin
      ? previousSubject?.nounIndices
      : undefined;
    const mergedHuman = shouldJoin
      ? mergeHuman(previousSubject?.isHuman, isHuman)
      : isHuman;
    const mergedPosture = shouldJoin
      ? mergePosture(previousSubject?.posture, undefined)
      : undefined;
    state.lastSubject = {
      persons: expandInclusiveExclusive([primaryPerson]),
      sourceToken: pronounPart.source,
      startIndex: shouldJoin ? previousSubject?.startIndex : index,
      endIndex: hasDualMarker ? index + 1 : index,
      kind: "pronoun",
      nounIndices,
      isHuman: mergedHuman,
      posture: mergedPosture,
    };
    state.pendingSubjectJoin = false;
    return { handled: true, nextIndex: hasDualMarker ? index + 1 : index };
  }

  const buildSubjectFromPhrase = (
    phrase: ReturnType<typeof matchNounPhraseAfterArticle>,
    startIndex: number,
    endIndex: number
  ): { handled: boolean; nextIndex?: number } => {
    if (!phrase) return { handled: false };
    const parts = buildNounPhraseParts(phrase, sourceLang);
    state.combinations = helpers.appendPartsToCombinations(
      state.combinations,
      parts,
      "dropdown"
    );
    const previousSubject = state.lastSubject;
    const shouldJoin: boolean =
      state.pendingSubjectJoin && Boolean(previousSubject);
    const nounIndices: number[] | undefined = shouldJoin
      ? previousSubject?.nounIndices
      : [startIndex];
    const mergedHuman = shouldJoin
      ? mergeHuman(previousSubject?.isHuman, phrase.noun.isHuman)
      : phrase.noun.isHuman;
    const mergedPosture = shouldJoin
      ? mergePosture(previousSubject?.posture, phrase.noun.entry?.posture)
      : phrase.noun.entry?.posture;
    state.lastSubject = {
      persons: shouldJoin ? previousSubject?.persons : undefined,
      sourceToken: phrase.noun.source,
      startIndex: shouldJoin ? previousSubject?.startIndex : startIndex,
      endIndex,
      kind: "noun",
      nounIndices,
      isHuman: mergedHuman,
      posture: mergedPosture,
    };
    state.pendingSubjectJoin = false;
    return { handled: true, nextIndex: endIndex };
  };

  function findCopulaAfter(startIndex: number): number | null {
    const direct = matchCopulaToken(ir.tokens, startIndex, sourceLang);
    if (direct) return startIndex;
    const negatorToken = ir.tokens[startIndex];
    if (negatorToken && isNegatorToken(negatorToken, sourceLang)) {
      const negatedCopula = matchCopulaToken(
        ir.tokens,
        startIndex + 1,
        sourceLang
      );
      if (negatedCopula) return startIndex + 1;
    }
    return null;
  }

  function findNextVerbMatches(startIndex: number) {
    for (let i = startIndex; i < ir.tokens.length; i += 1) {
      const current = ir.tokens[i];
      if (!current) break;
      if (isStrongPunctuationToken(current)) break;
      if (isClauseConnectorToken(ir.tokens, i, sourceLang)) break;
      const matches = matchVerbAt(ir.tokens, i, sourceLang);
      if (matches.length > 0) return matches;
    }
    return null;
  }

  function allowNonHumanPronounHere(): boolean {
    if (findCopulaAfter(index + 1) !== null) return true;
    const verbMatches = findNextVerbMatches(index + 1);
    if (!verbMatches || verbMatches.length === 0) return false;
    const anyTransitive = verbMatches.some((match) => match.entry.isTransitive);
    const anyIntransitive = verbMatches.some((match) => !match.entry.isTransitive);
    return anyIntransitive && !anyTransitive;
  }

  const verbAtIndex = matchVerbAt(ir.tokens, index, sourceLang);
  if (
    verbAtIndex.length > 0 &&
    !matchCopulaToken(ir.tokens, index, sourceLang) &&
    state.lastSubject
  ) {
    debugLog("[ridjin-debug] subjects:skip-verb-after-subject", {
      index,
      token: token.source,
    });
    return { handled: false };
  }

  const lastSubjectEnd = state.lastSubject?.endIndex;
  if (
    lastSubjectEnd !== undefined &&
    index === lastSubjectEnd + 1 &&
    !state.pendingSubjectJoin
  ) {
    const hasArticle = Boolean(matchArticleAt(ir.tokens, index, sourceLang));
    const hasDemo = Boolean(matchDemonstrativeToken(token.source, sourceLang));
    const hasPossessive = Boolean(matchPossessiveDeterminer(token.source, sourceLang));
    const hasDhiyaku = Boolean(
      matchDhiyakuDeterminerAt(ir.tokens, index, sourceLang)
    );
    if (!hasArticle && !hasDemo && !hasPossessive && !hasDhiyaku) {
      debugLog("[ridjin-debug] subjects:skip-after-subject", {
        index,
        token: token.source,
        reason: "adjacent-to-subject",
      });
      return { handled: false };
    }
  }

  const articleMatch = matchArticleAt(ir.tokens, index, sourceLang);
  if (articleMatch && !isOtherGroupPatternAt(ir.tokens, index, sourceLang)) {
    const phrase = matchNounPhraseAfterArticle(
      ir.tokens,
      index + articleMatch.consumed,
      sourceLang
    );
    if (phrase) {
      const afterPhrase = index + articleMatch.consumed + phrase.consumed;
      const copulaIndex = findCopulaAfter(afterPhrase);
      if (copulaIndex !== null) {
        return buildSubjectFromPhrase(phrase, index, afterPhrase - 1);
      }
    }
  }

  const hasPossessiveDeterminer = Boolean(
    matchPossessiveDeterminer(token.source, sourceLang)
  );
  const possiblePhrase = hasPossessiveDeterminer
    ? null
    : matchNounPhraseAfterArticle(ir.tokens, index, sourceLang);
  if (possiblePhrase) {
    const afterPhrase = index + possiblePhrase.consumed;
    const copulaIndex = findCopulaAfter(afterPhrase);
    if (copulaIndex !== null) {
      return buildSubjectFromPhrase(possiblePhrase, index, afterPhrase - 1);
    }
  }

  const coordinated = buildCoordinatedPronounPart(
    ir.tokens,
    index,
    sourceLang
  );
  if (coordinated) {
    const { part, consumed } = coordinated;
    const isHuman = resolvePronounHuman(part.source, sourceLang);
    const renderedPart = finalizePart(
      {
        ...part,
        globalIndex: index,
      },
      sourceLang
    );
    state.combinations = helpers.appendPartsToCombinations(
      state.combinations,
      [renderedPart],
      "dropdown"
    );
    const primaryPerson = part.explanations?.[0]?.data?.person as
      | PersonNumber
      | undefined;
    if (primaryPerson) {
      const previousSubject = state.lastSubject;
      const shouldJoin: boolean =
        state.pendingSubjectJoin && Boolean(previousSubject);
      const nounIndices: number[] | undefined = shouldJoin
        ? previousSubject?.nounIndices
        : undefined;
      const mergedHuman = shouldJoin
        ? mergeHuman(previousSubject?.isHuman, isHuman)
        : isHuman;
      const mergedPosture = shouldJoin
        ? mergePosture(previousSubject?.posture, undefined)
        : undefined;
      state.lastSubject = {
        persons: expandInclusiveExclusive([primaryPerson]),
        sourceToken: part.source,
        startIndex: shouldJoin ? previousSubject?.startIndex : index,
        endIndex: index + consumed - 1,
        kind: "pronoun",
        nounIndices,
        isHuman: mergedHuman,
        posture: mergedPosture,
      };
    }
    state.pendingSubjectJoin = false;
    return { handled: true, nextIndex: index + consumed - 1 };
  }

  const possessiveSubject = matchPossessiveSubjectAt({
    tokens: ir.tokens,
    index,
    sourceLang,
  });
  if (possessiveSubject) {
    const prevToken = ir.tokens[index - 1];
    const isClauseStart =
      index === 0 ||
      (prevToken && isStrongPunctuationToken(prevToken)) ||
      (prevToken && isClauseConnectorToken(ir.tokens, index - 1, sourceLang));
    const hasCopulaAfter =
      findCopulaAfter(index + possessiveSubject.consumed) !== null;
    if (!isClauseStart && !hasCopulaAfter) {
      return { handled: false };
    }
    let expanded: typeof state.combinations = [];
    const scope = possessiveSubject.hasRawAlternative ? "box" : "dropdown";
    for (const seq of possessiveSubject.sequences) {
      expanded = expanded.concat(
        helpers.appendPartsToCombinations(state.combinations, seq, scope)
      );
    }
    if (
      possessiveSubject.hasAlternatives ||
      possessiveSubject.sequences.length > 1
    ) {
      state.hasAmbiguity = true;
    }
    state.combinations = expanded;
    const previousSubject = state.lastSubject;
    const shouldJoin: boolean =
      state.pendingSubjectJoin && Boolean(previousSubject);
    const nounIndices: number[] | undefined = shouldJoin
      ? previousSubject?.nounIndices
      : [
          possessiveSubject.nounIndex !== undefined
            ? possessiveSubject.nounIndex
            : index,
        ];
    const mergedHuman = shouldJoin
      ? mergeHuman(previousSubject?.isHuman, possessiveSubject.isHuman)
      : possessiveSubject.isHuman;
    const mergedPosture = shouldJoin
      ? mergePosture(previousSubject?.posture, possessiveSubject.posture)
      : possessiveSubject.posture;
    state.lastSubject = {
      persons: undefined,
      sourceToken: token.source,
      startIndex: shouldJoin ? previousSubject?.startIndex : index,
      endIndex: index + possessiveSubject.consumed - 1,
      kind: "noun",
      nounIndices,
      isHuman: mergedHuman,
      posture: mergedPosture,
    };
    state.pendingSubjectJoin = false;
    return { handled: true, nextIndex: index + possessiveSubject.consumed - 1 };
  }

  const nounPhrase = matchNounPhraseAfterArticle(ir.tokens, index, sourceLang);
  if (nounPhrase && nounPhrase.consumed > 1) {
    const built = buildNounPhraseVariants(nounPhrase, sourceLang, {
      splitRawAlternative: true,
    });
    const scope = built.hasRawAlternative ? "box" : "dropdown";
    let expanded: typeof state.combinations = [];
    for (const seq of built.sequences) {
      expanded = expanded.concat(
        helpers.appendPartsToCombinations(state.combinations, seq, scope)
      );
    }
    state.combinations = expanded;
    if (built.hasRawAlternative) {
      state.hasAmbiguity = true;
    }
    const previousSubject = state.lastSubject;
    const shouldJoin: boolean =
      state.pendingSubjectJoin && Boolean(previousSubject);
    const nounIndices: number[] = shouldJoin
      ? [...(previousSubject?.nounIndices ?? []), index]
      : [index];
    const mergedHuman = shouldJoin
      ? mergeHuman(previousSubject?.isHuman, nounPhrase.noun.isHuman)
      : nounPhrase.noun.isHuman;
    const mergedPosture = shouldJoin
      ? mergePosture(previousSubject?.posture, nounPhrase.noun.entry?.posture)
      : nounPhrase.noun.entry?.posture;
    const prevToken = ir.tokens[index - 1];
    const hasDemo =
      prevToken && matchDemonstrativeToken(prevToken.source, sourceLang);
    const computedStart = hasDemo ? index - 1 : index;
    state.lastSubject = {
      persons: shouldJoin ? previousSubject?.persons : undefined,
      sourceToken: nounPhrase.noun.source,
      startIndex: shouldJoin ? previousSubject?.startIndex : computedStart,
      endIndex: index + nounPhrase.consumed - 1,
      kind: "noun",
      nounIndices,
      isHuman: mergedHuman,
      posture: mergedPosture,
    };
    state.pendingSubjectJoin = false;
    for (let offset = 1; offset < nounPhrase.consumed; offset += 1) {
      state.skipIndices.add(index + offset);
    }
    return { handled: true, nextIndex: index + nounPhrase.consumed - 1 };
  }

  const nounMatch = matchNounAt(ir.tokens, index, sourceLang);
  if (nounMatch) {
    const isHuman = nounMatch.entry?.isHuman;
    const posture = nounMatch.entry?.posture;
    const phrase = {
      adjectives: { pre: [], post: [] },
      noun: nounMatch,
      consumed: 1,
    };
    const built = buildNounPhraseVariants(phrase, sourceLang, {
      splitRawAlternative: true,
    });
    const scope = built.hasRawAlternative ? "box" : "dropdown";
    let expanded: typeof state.combinations = [];
    for (const seq of built.sequences) {
      const seqWithIndex = seq.map((part) =>
        part.type === "noun" || part.type === "adjective" || part.type === "unknown"
          ? { ...part, globalIndex: index }
          : part
      );
      expanded = expanded.concat(
        helpers.appendPartsToCombinations(state.combinations, seqWithIndex, scope)
      );
    }
    state.combinations = expanded;
    if (built.hasRawAlternative) {
      state.hasAmbiguity = true;
    }
    const previousSubject = state.lastSubject;
    const shouldJoin: boolean =
      state.pendingSubjectJoin && Boolean(previousSubject);
    const nounIndices: number[] = shouldJoin
      ? [...(previousSubject?.nounIndices ?? []), index]
      : [index];
    const mergedHuman = shouldJoin
      ? mergeHuman(previousSubject?.isHuman, isHuman)
      : isHuman;
    const mergedPosture = shouldJoin
      ? mergePosture(previousSubject?.posture, posture)
      : posture;
    const prevToken = ir.tokens[index - 1];
    const hasDemo =
      prevToken && matchDemonstrativeToken(prevToken.source, sourceLang);
    const computedStart = hasDemo ? index - 1 : index;
    state.lastSubject = {
      persons: shouldJoin ? previousSubject?.persons : undefined,
      sourceToken: nounMatch.source,
      startIndex: shouldJoin
        ? previousSubject?.startIndex
        : computedStart,
      endIndex: index + nounMatch.consumed - 1,
      kind: "noun",
      nounIndices,
      isHuman: mergedHuman,
      posture: mergedPosture,
    };
    state.pendingSubjectJoin = false;
    if (nounMatch.consumed > 1) {
      for (let offset = 1; offset < nounMatch.consumed; offset += 1) {
        state.skipIndices.add(index + offset);
      }
    }
    return { handled: true, nextIndex: index + nounMatch.consumed - 1 };
  }

  return { handled: false };
}
