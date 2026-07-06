import { LanguageMode } from "@/app/components/types/components.type";
import type {
  ExplanationPayload,
  TranslationPart,
  TranslationResult,
} from "../../core/types";
import { matchObjectPronoun, buildObjectPronounPart } from "../../rules/objectPronoun";
import { matchSubjectPronoun } from "../../rules/pronoun";
import { matchVerbAt } from "../../rules/verb";
import {
  matchAdjectiveAt,
  matchArticleAt,
  matchMarkerAt,
  matchNounAt,
  isOtherGroupPatternAt,
} from "../../logic/lexiconMatch";
import { matchCopulaAt } from "../../logic/copula";
import { matchGerundAfterIndex, matchInfinitiveAt } from "../../logic/verbAux";
import {
  buildDefiniteArticlePart,
  createParticlePart,
  createVerbPart,
  expandPartVariants,
  finalizePart,
} from "../../logic/parts";
import {
  isStrongPunctuationToken,
  normalizeToken,
  stripSpanishDiacritics,
} from "../../logic/tokenUtils";
import { matchDemonstrativeToken } from "../../logic/demonstratives";
import { buildBranches, expandBranchesWithSubject } from "../../logic/branching";
import { resolveFutureTimeContext, resolvePastTimeContext } from "../../logic/time";
import { isNegatorToken } from "../../logic/negation";
import {
  buildLocativePart,
  getLocativeFallbackVerb,
  matchLocativeMarkerAt,
  resolveLocativeCopulaVerbOptions,
} from "../../logic/locative";
import {
  matchComitativePhraseAt,
  matchLocativePhraseAt,
  matchOriginPhraseAt,
  matchNounPhraseAfterArticle,
  buildNounPhraseParts,
  buildNounPhraseVariants,
  buildOriginPossessivePronounPart,
  buildOriginSuffixPart,
  buildOriginPossessorSequences,
  buildNounPartWithSuffix,
} from "../../logic/objects";
import {
  buildPossessivePronounPart,
  buildPossessiveSuffixPart,
  matchPossessiveEmphasisAt,
  matchPossessiveDeterminer,
  matchPossessiveOfPronoun,
  matchPossessivePronoun,
  stripEnglishPossessiveSuffix,
} from "../../logic/possession";
import { applyPossessiveSuffix, applySuffixToGup, getPossessiveSuffixes } from "../../logic/suffixes";
import { matchDhiyakuDeterminerAt } from "../../logic/dhiyaku";
import {
  getComitativePronounForms,
  getComitativePronounNoteKey,
} from "../../rules/comitativePronoun";
import type { TranslateHelpers, TranslateState } from "../types";
import type { IRSentence, PersonNumber } from "../../core/types";
import type { PossessivePersonMatch } from "../../logic/possession";
import type { LocativeSubjectProfile } from "../../logic/locative";

type CopulaParse = {
  copula: ReturnType<typeof matchCopulaAt>;
  predicateIndex: number;
  negated: boolean;
  negatorSource?: string;
  copulaIndex: number;
  demo?: { gup: string; source: string; variants?: string[] };
};

type PossessionPredicate = {
  sequences: TranslationPart[][];
  consumed: number;
  hasAlternatives: boolean;
};

const matchDemonstrative = matchDemonstrativeToken;
const isNonHumanDemoPronoun = (token: string, sourceLang: LanguageMode): boolean => {
  const normalized =
    sourceLang === "es"
      ? stripSpanishDiacritics(normalizeToken(token, sourceLang))
      : normalizeToken(token, sourceLang);
  return sourceLang === "es" ? normalized === "ello" : normalized === "it";
};

function mapPersonToObjectKey(
  person: PersonNumber
): { primaryKey: string; alternativeKeys?: string[] } {
  switch (person) {
    case "1_Sing":
      return { primaryKey: "1_Sing" };
    case "2_Sing":
      return { primaryKey: "2_Sing" };
    case "3_Sing":
      return { primaryKey: "3_Sing" };
    case "1+2_Dual":
    case "1+3_Dual":
      return {
        primaryKey: "1_Dual_Incl",
        alternativeKeys: ["1_Dual_Excl"],
      };
    case "2_Dual":
      return { primaryKey: "2_Dual" };
    case "3_Dual":
      return { primaryKey: "3_Dual" };
    case "1+2_Plur":
    case "1+3_Plur":
      return {
        primaryKey: "1+2_Plur_Incl",
        alternativeKeys: ["1+2_Plur_Excl"],
      };
    case "2_Plur":
      return { primaryKey: "2_Plur" };
    case "3_Plur":
      return { primaryKey: "3_Plur" };
    default:
      return { primaryKey: "3_Sing" };
  }
}

function collectPossessivePersons(match: PossessivePersonMatch): PersonNumber[] {
  const persons = new Set<PersonNumber>();
  persons.add(match.person);
  match.altPersons?.forEach((person) => persons.add(person));
  for (const person of Array.from(persons)) {
    if (person === "1+2_Plur") persons.add("1+3_Plur");
    if (person === "1+2_Dual") persons.add("1+3_Dual");
  }
  return Array.from(persons);
}

function buildComitativePossessorPronounPart(
  match: PossessivePersonMatch,
  sourceLang: LanguageMode
): TranslationPart | null {
  const persons = collectPossessivePersons(match);
  const primaryForms = getComitativePronounForms(match.person);
  if (primaryForms.length === 0) return null;
  const primary = `${primaryForms[0]}ŋuwa`;
  const alternatives: TranslationPart["alternatives"] = [];
  const seen = new Set<string>();
  for (const person of persons) {
    const noteKey = getComitativePronounNoteKey(person);
    const forms = getComitativePronounForms(person);
    for (const form of forms) {
      if (person === match.person && form === primaryForms[0]) continue;
      const gup = `${form}ŋuwa`;
      const key = `${gup}:${noteKey ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      alternatives.push({
        gup,
        notePayload: noteKey ? { key: noteKey } : undefined,
      });
    }
  }
  return finalizePart(
    {
      type: "pronoun",
      source: match.source,
      gup: primary,
      output: primary,
      explanation: "",
      explanations: [
        {
          key: "POSSESSION_COMITATIVE_PRONOUN",
          data: { token: match.source, gup: primary },
        },
      ],
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
}

function buildPossessorNounSequences(
  phrase: ReturnType<typeof matchNounPhraseAfterArticle>,
  sourceLang: LanguageMode,
  prefixParts: TranslationPart[] = []
): { sequences: TranslationPart[][]; hasAlternatives: boolean } {
  if (!phrase) return { sequences: [], hasAlternatives: false };
  const base = phrase.noun.gup || phrase.noun.source;
  const suffixes = getPossessiveSuffixes(base);
  const sequences: TranslationPart[][] = [];
  for (const suffix of suffixes) {
    const parts: TranslationPart[] = [];
    if (prefixParts.length > 0) parts.push(...prefixParts);
    for (const adj of phrase.adjectives.pre) {
      parts.push(buildAdjectivePart(adj, sourceLang, suffix));
    }
    const gup = applyPossessiveSuffix(base, suffix);
    parts.push(
      finalizePart(
        {
          type: "noun",
          source: phrase.noun.source,
          gup,
          output: gup,
          explanation: "",
          explanations: [
            {
              key: "POSSESSION_SUFFIX",
              data: { token: phrase.noun.source, gup, suffix },
            },
          ],
          meaningKey: phrase.noun.entry?.meaningKey,
          appliedSuffix: suffix,
        },
        sourceLang
      )
    );
    for (const adj of phrase.adjectives.post) {
      parts.push(buildAdjectivePart(adj, sourceLang, suffix));
    }
    sequences.push(parts);
  }
  return { sequences, hasAlternatives: suffixes.length > 1 };
}

function buildAdjectivePart(
  match: ReturnType<typeof matchAdjectiveAt>,
  sourceLang: LanguageMode,
  suffix?: string
): TranslationPart {
  const base = match?.gup ?? "";
  const gup = suffix ? applySuffixToGup(base, suffix) : base;
  return finalizePart(
    {
      type: "adjective",
      source: match?.source ?? "",
      gup,
      output: gup,
      explanation: "",
      explanations: [
        { key: "TOKEN_PASSTHROUGH", data: { token: match?.source ?? "" } },
      ],
      meaningKey: match?.entry?.meaningKey,
      appliedSuffix: suffix,
    },
    sourceLang
  );
}

function buildNounPart(
  match: ReturnType<typeof matchNounAt>,
  sourceLang: LanguageMode
): TranslationPart {
  return finalizePart(
    {
      type: "noun",
      source: match?.source ?? "",
      gup: match?.gup ?? "",
      output: match?.gup ?? "",
      explanation: "",
      explanations: [
        { key: "TOKEN_PASSTHROUGH", data: { token: match?.source ?? "" } },
      ],
      meaningKey: match?.entry?.meaningKey,
    },
    sourceLang
  );
}

function matchPossessedNounPhrase(args: {
  tokens: IRSentence["tokens"];
  index: number;
  sourceLang: LanguageMode;
  suppressDefiniteArticleVariants?: boolean;
}): {
  sequences: TranslationPart[][];
  consumed: number;
  articleVariants: TranslationPart[][];
  hasAlternatives: boolean;
  useOriginPossessor: boolean;
} | null {
  const { tokens, index, sourceLang } = args;
  const suppressDefiniteArticleVariants =
    args.suppressDefiniteArticleVariants === true;
  let cursor = index;
  let articleVariants: TranslationPart[][] = [[]];
  let hasAlternatives = false;

  const articleMatch = matchArticleAt(tokens, cursor, sourceLang);
  if (articleMatch && !isOtherGroupPatternAt(tokens, cursor, sourceLang)) {
    cursor += articleMatch.consumed;
    if (articleMatch.kind === "definite" && !suppressDefiniteArticleVariants) {
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
      hasAlternatives = true;
    }
  }

  const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang);
  if (!phrase) return null;
  const built = buildNounPhraseVariants(phrase, sourceLang, {
    splitRawAlternative: true,
  });
  return {
    sequences: built.sequences,
    consumed: cursor - index + phrase.consumed,
    articleVariants,
    hasAlternatives: hasAlternatives || built.hasRawAlternative,
    useOriginPossessor: Boolean(phrase.noun.verbalVerbForms),
  };
}

function matchPossessorAfterOf(args: {
  tokens: IRSentence["tokens"];
  index: number;
  sourceLang: LanguageMode;
  useOriginPossessor?: boolean;
}): { sequences: TranslationPart[][]; consumed: number; hasAlternatives: boolean } | null {
  const { tokens, index, sourceLang, useOriginPossessor } = args;
  const token = tokens[index];
  if (!token) return null;
  const determinerMatch = matchPossessiveDeterminer(token.source, sourceLang);
  if (determinerMatch) {
    const emphasis = matchPossessiveEmphasisAt(tokens, index, sourceLang);
    const originForPossessor = Boolean(useOriginPossessor) && !emphasis;
    const phrase = matchNounPhraseAfterArticle(
      tokens,
      index + 1 + (emphasis?.consumed ?? 0),
      sourceLang,
      { allowUnknownHead: true }
    );
    if (phrase) {
      const nounBuilt = originForPossessor
        ? buildOriginPossessorSequences(phrase, sourceLang)
        : buildPossessorNounSequences(phrase, sourceLang);
      const comitativePart = originForPossessor
        ? null
        : buildComitativePossessorPronounPart(determinerMatch, sourceLang);
      const isHuman = phrase.noun.isHuman === true;
      const isNonHuman = phrase.noun.isHuman === false;
      const isAmbiguous = !isHuman && !isNonHuman;
      const allowComitative =
        !determinerMatch.nonHuman && !originForPossessor;

      const prefixed =
        comitativePart && allowComitative
          ? nounBuilt.sequences.map((seq) => [comitativePart, ...seq])
          : [];
      let sequences = nounBuilt.sequences;
      let hasAlternatives = nounBuilt.hasAlternatives;
      if (prefixed.length > 0 && isHuman) {
        sequences = prefixed;
        hasAlternatives =
          hasAlternatives || Boolean(comitativePart?.alternatives?.length);
      } else if (prefixed.length > 0 && isAmbiguous) {
        sequences = [...nounBuilt.sequences, ...prefixed];
        hasAlternatives = true;
      }
      return {
        sequences,
        consumed: 1 + (emphasis?.consumed ?? 0) + phrase.consumed,
        hasAlternatives,
      };
    }
  }

  const pronounMatch = matchPossessiveOfPronoun(token.source, sourceLang);
  if (pronounMatch) {
    const emphasis = matchPossessiveEmphasisAt(tokens, index, sourceLang);
    const part = useOriginPossessor && !emphasis
      ? buildOriginPossessivePronounPart(pronounMatch, sourceLang, {
          emphatic: Boolean(emphasis),
          sourceOverride: (emphasis as any)?.source,
        })
      : buildPossessivePronounPart(pronounMatch, sourceLang, {
          emphatic: Boolean(emphasis),
          sourceOverride: emphasis?.source,
          includeNonEmphatic: Boolean(emphasis),
        });
    if (!part) return null;
    return {
      sequences: [[part]],
      consumed: 1 + (emphasis?.consumed ?? 0),
      hasAlternatives: Boolean(part.alternatives?.length),
    };
  }

  let cursor = index;
  let prefixParts: TranslationPart[] = [];
  const determiner = matchDhiyakuDeterminerAt(tokens, cursor, sourceLang);
  if (determiner) {
    if (determiner.part) prefixParts = [determiner.part];
    cursor += determiner.consumed;
  }

  const phrase = matchNounPhraseAfterArticle(tokens, cursor, sourceLang, {
    allowUnknownHead: true,
  });
  if (phrase) {
    const built = useOriginPossessor
      ? buildOriginPossessorSequences(phrase, sourceLang, prefixParts)
      : buildPossessorNounSequences(phrase, sourceLang, prefixParts);
    return {
      sequences: built.sequences,
      consumed: cursor - index + phrase.consumed,
      hasAlternatives: built.hasAlternatives,
    };
  }
  if (prefixParts.length > 0) {
    return {
      sequences: [prefixParts],
      consumed: cursor - index,
      hasAlternatives: prefixParts.some(
        (part) => Boolean(part.alternatives?.length)
      ),
    };
  }

  if (isStrongPunctuationToken(token)) return null;
  const possessorPart = useOriginPossessor
    ? buildOriginSuffixPart(token.source, token.source, sourceLang)
    : buildPossessiveSuffixPart(token.source, token.source, sourceLang);
  return {
    sequences: [[possessorPart]],
    consumed: 1,
    hasAlternatives: Boolean(possessorPart.alternatives?.length),
  };
}

function matchPossessivePredicate(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  suppressDefiniteArticleVariants?: boolean;
}): PossessionPredicate | null {
  const { ir, index, sourceLang } = args;
  const token = ir.tokens[index];
  if (!token) return null;

  const determinerMatch = matchPossessiveDeterminer(token.source, sourceLang);
  if (determinerMatch) {
    const emphasis = matchPossessiveEmphasisAt(ir.tokens, index, sourceLang);
    const phrase = matchNounPhraseAfterArticle(
      ir.tokens,
      index + 1 + (emphasis?.consumed ?? 0),
      sourceLang,
      { allowUnknownHead: true }
    );
    if (phrase) {
      const useOriginPossessor =
        Boolean(phrase.noun.verbalVerbForms) && !emphasis;
      const possessor = useOriginPossessor
        ? buildOriginPossessivePronounPart(determinerMatch, sourceLang, {
            emphatic: Boolean(emphasis),
            sourceOverride: (emphasis as any)?.source,
          })
        : buildPossessivePronounPart(determinerMatch, sourceLang, {
            emphatic: Boolean(emphasis),
            sourceOverride: (emphasis as any)?.source,
            includeNonEmphatic: Boolean(emphasis),
          });
      if (possessor) {
        const built = buildNounPhraseVariants(phrase, sourceLang, {
          splitRawAlternative: true,
        });
        const sequences = built.sequences.map((seq) => [possessor, ...seq]);
        return {
          sequences,
          consumed: 1 + (emphasis?.consumed ?? 0) + phrase.consumed,
          hasAlternatives:
            Boolean(possessor.alternatives?.length) || built.hasRawAlternative,
        };
      }
    }
  }

  const pronounMatch = matchPossessivePronoun(token.source, sourceLang);
  if (pronounMatch) {
    const emphasis = matchPossessiveEmphasisAt(ir.tokens, index, sourceLang);
    const part = buildPossessivePronounPart(pronounMatch, sourceLang, {
      emphatic: Boolean(emphasis),
      sourceOverride: emphasis?.source,
      includeNonEmphatic: Boolean(emphasis),
    });
    if (!part) return null;
    return {
      sequences: [[part]],
      consumed: 1 + (emphasis?.consumed ?? 0),
      hasAlternatives: Boolean(part.alternatives?.length),
    };
  }

  if (sourceLang === "en") {
    const base = stripEnglishPossessiveSuffix(token.source);
    if (base) {
      const possessed = matchPossessedNounPhrase({
        tokens: ir.tokens,
        index: index + 1,
        sourceLang,
        suppressDefiniteArticleVariants: args.suppressDefiniteArticleVariants,
      });
      if (!possessed) {
        const possessorPart = buildPossessiveSuffixPart(
          base,
          token.source,
          sourceLang
        );
        return {
          sequences: [[possessorPart]],
          consumed: 1,
          hasAlternatives: Boolean(possessorPart.alternatives?.length),
        };
      }
      const possessorPart = possessed.useOriginPossessor
        ? buildOriginSuffixPart(base, token.source, sourceLang)
        : buildPossessiveSuffixPart(base, token.source, sourceLang);
      const sequences = possessed.articleVariants.flatMap((variant) =>
        possessed.sequences.map((seq) => [...variant, ...seq, possessorPart])
      );
      return {
        sequences,
        consumed: 1 + possessed.consumed,
        hasAlternatives:
          possessed.hasAlternatives ||
          Boolean(possessorPart.alternatives?.length),
      };
    }
  }

  const normalized = normalizeToken(token.source, sourceLang);
  const isOf =
    (sourceLang === "es" && normalized === "de") ||
    (sourceLang === "en" && normalized === "of");
  if (isOf) {
    const marker = matchMarkerAt(ir.tokens, index, sourceLang);
    if (marker && marker.consumed > 1) return null;
    const possessor = matchPossessorAfterOf({
      tokens: ir.tokens,
      index: index + 1,
      sourceLang,
    });
    if (!possessor) return null;
    return {
      sequences: possessor.sequences,
      consumed: 1 + possessor.consumed,
      hasAlternatives: possessor.hasAlternatives,
    };
  }

  const possessed = matchPossessedNounPhrase({
    tokens: ir.tokens,
    index,
    sourceLang,
    suppressDefiniteArticleVariants: args.suppressDefiniteArticleVariants,
  });
  if (possessed) {
    const afterIndex = index + possessed.consumed;
    const connector = ir.tokens[afterIndex];
    if (connector) {
      const connectorNorm = normalizeToken(connector.source, sourceLang);
      const connectorIsOf =
        (sourceLang === "es" && connectorNorm === "de") ||
        (sourceLang === "en" && connectorNorm === "of");
      if (connectorIsOf) {
        const marker = matchMarkerAt(ir.tokens, afterIndex, sourceLang);
        if (marker && marker.consumed > 1) return null;
        const possessor = matchPossessorAfterOf({
          tokens: ir.tokens,
          index: afterIndex + 1,
          sourceLang,
          useOriginPossessor: possessed.useOriginPossessor,
        });
        if (!possessor) return null;
        const sequences = possessed.articleVariants.flatMap((variant) =>
          possessor.sequences.flatMap((possessorSeq) =>
            possessed.sequences.map((seq) => [
              ...variant,
              ...seq,
              ...possessorSeq,
            ])
          )
        );
        return {
          sequences,
          consumed: possessed.consumed + 1 + possessor.consumed,
          hasAlternatives: possessed.hasAlternatives || possessor.hasAlternatives,
        };
      }
    }
  }

  return null;
}

function buildPredicatePart(
  ir: IRSentence,
  index: number,
  sourceLang: LanguageMode
): { parts: TranslationPart[]; consumed: number } | null {
  const verbMatches = matchVerbAt(ir.tokens, index, sourceLang);
  if (verbMatches.length > 0) return null;

  const demo = matchDemonstrative(ir.tokens[index]?.source ?? "", sourceLang);
  if (demo) {
    const variants = demo.variants?.length ? demo.variants : [demo.gup];
    const part = finalizePart(
      {
        type: "pronoun",
        source: demo.source,
        gup: variants[0],
        output: variants[0],
        explanation: "",
        explanations: [
          { key: "TOKEN_PASSTHROUGH", data: { token: demo.source } },
        ],
        alternatives:
          variants.length > 1
            ? variants.slice(1).map((gup) => ({ gup }))
            : undefined,
        globalIndex: index,
      },
      sourceLang
    );
    return { parts: [part], consumed: 1 };
  }

  const adjMatch = matchAdjectiveAt(ir.tokens, index, sourceLang);
  if (adjMatch) {
    const part = finalizePart(
      {
        type: "adjective",
        source: adjMatch.source,
        gup: adjMatch.gup,
        output: adjMatch.gup,
        explanation: "",
        explanations: [
          { key: "TOKEN_PASSTHROUGH", data: { token: adjMatch.source } },
        ],
        meaningKey: adjMatch.entry?.meaningKey,
        globalIndex: index,
      },
      sourceLang
    );
    return { parts: [part], consumed: adjMatch.consumed };
  }

  const nounMatch = matchNounAt(ir.tokens, index, sourceLang);
  if (nounMatch) {
    const part = buildNounPartWithSuffix(nounMatch, sourceLang);
    const withIndex: TranslationPart = { ...part, globalIndex: index };
    return { parts: [withIndex], consumed: nounMatch.consumed };
  }

  const objectMatch = matchObjectPronoun(ir.tokens[index]?.source ?? "", sourceLang);
  if (objectMatch) {
    const part = buildObjectPronounPart(objectMatch);
    if (part) {
      return {
        parts: [finalizePart({ ...part, globalIndex: index }, sourceLang)],
        consumed: 1,
      };
    }
  }

  const subjectMatch = matchSubjectPronoun(
    ir.tokens[index]?.source ?? "",
    sourceLang
  );
  if (subjectMatch) {
    const mapping = mapPersonToObjectKey(subjectMatch.person);
    const part = buildObjectPronounPart({
      source: ir.tokens[index]?.source ?? "",
      primaryKey: mapping.primaryKey as any,
      alternativeKeys: mapping.alternativeKeys as any,
      allowDrop: false,
    });
    if (part) {
      return {
        parts: [finalizePart({ ...part, globalIndex: index }, sourceLang)],
        consumed: 1,
      };
    }
  }

  const token = ir.tokens[index];
  if (!token) return null;
  const explanations: ExplanationPayload[] = [
    { key: "PIPELINE_PLACEHOLDER" },
    { key: "TOKEN_PASSTHROUGH", data: { token: token.source } },
  ];
  const part = finalizePart(
    {
      type: "unknown",
      source: token.source,
      gup: token.source,
      output: token.source,
      explanation: "",
      explanations,
      globalIndex: index,
    },
    sourceLang
  );
  return { parts: [part], consumed: 1 };
}

function parseCopula(
  ir: IRSentence,
  index: number,
  sourceLang: LanguageMode
): CopulaParse | null {
  const token = ir.tokens[index];
  if (!token) return null;
  const demo = matchDemonstrative(token.source, sourceLang);

  if (demo) {
    let copula = matchCopulaAt(ir.tokens, index + 1, sourceLang);
    let negated = Boolean(copula?.negated);
    let negatorSource = copula?.negatorSource;
    let copulaIndex = index + 1;

    if (!copula) {
      const negatorToken = ir.tokens[index + 1];
      if (negatorToken && isNegatorToken(negatorToken, sourceLang)) {
        copula = matchCopulaAt(ir.tokens, index + 2, sourceLang);
        if (copula) {
          negated = true;
          negatorSource = negatorToken.source;
          copulaIndex = index + 2;
        }
      }
    }

    if (copula) {
      let predicateIndex = copulaIndex + copula.consumed;
      if (!negated) {
        const negatorToken = ir.tokens[predicateIndex];
        if (negatorToken && isNegatorToken(negatorToken, sourceLang)) {
          negated = true;
          negatorSource = negatorToken.source;
          predicateIndex += 1;
        }
      }
      return {
        copula,
        predicateIndex,
        negated,
        negatorSource,
        copulaIndex,
        demo,
      };
    }
  }

  if (isNegatorToken(token, sourceLang)) {
    const copulaAtNegator = matchCopulaAt(ir.tokens, index, sourceLang);
    if (copulaAtNegator) {
      return {
        copula: copulaAtNegator,
        predicateIndex: index + copulaAtNegator.consumed,
        negated: Boolean(copulaAtNegator.negated),
        negatorSource: copulaAtNegator.negatorSource ?? token.source,
        copulaIndex: index,
      };
    }
    const copula = matchCopulaAt(ir.tokens, index + 1, sourceLang);
    if (!copula) return null;
    return {
      copula,
      predicateIndex: index + 1 + copula.consumed,
      negated: true,
      negatorSource: token.source,
      copulaIndex: index + 1,
    };
  }

  const copula = matchCopulaAt(ir.tokens, index, sourceLang);
  if (!copula) return null;
  let negated = Boolean(copula.negated);
  let negatorSource = copula.negatorSource;
  let predicateIndex = index + copula.consumed;
  if (!negated) {
    const negatorToken = ir.tokens[predicateIndex];
    if (negatorToken && isNegatorToken(negatorToken, sourceLang)) {
      negated = true;
      negatorSource = negatorToken.source;
      predicateIndex += 1;
    }
  }
  return {
    copula,
    predicateIndex,
    negated,
    negatorSource,
    copulaIndex: index,
  };
}

function shouldSuppressDefiniteArticleVariants(
  parsed: CopulaParse,
  subjectToken: string | undefined,
  sourceLang: LanguageMode
): boolean {
  if (parsed.demo) return true;
  if (!subjectToken) return false;
  const normalized = normalizeToken(subjectToken, sourceLang);
  if (sourceLang === "en") return normalized === "it";
  if (sourceLang === "es") return normalized === "ello";
  return false;
}

function insertNegatorBeforeSubjectCombos(
  combos: TranslationResult["combinations"],
  negatorPart: TranslationPart,
  subject: { startIndex?: number; endIndex: number } | null,
  nextDropdownId?: () => string
): TranslationResult["combinations"] {
  const variants = expandPartVariants(negatorPart);
  const hasAlternatives = variants.length > 1;
  const start =
    subject?.startIndex !== undefined ? subject.startIndex : subject?.endIndex ?? -1;
  const end = subject?.endIndex ?? -1;
  const expanded: TranslationResult["combinations"] = [];
  for (const combo of combos) {
    const canAssignDropdown =
      hasAlternatives && combo.variantGroup?.scope !== "box";
    const groupId =
      canAssignDropdown && nextDropdownId
        ? combo.variantGroup?.scope === "dropdown"
          ? combo.variantGroup.id
          : nextDropdownId()
        : undefined;
    for (const variant of variants) {
      if (start < 0 || end < 0) {
        const nextCombo: TranslationResult["combinations"][number] = {
          ...combo,
          parts: [variant, ...combo.parts],
        };
        if (canAssignDropdown && groupId) {
          nextCombo.variantGroup = { scope: "dropdown", id: groupId };
        }
        expanded.push(nextCombo);
        continue;
      }
      const before: TranslationPart[] = [];
      const subjectParts: TranslationPart[] = [];
      const after: TranslationPart[] = [];
      let subjectSeen = false;
      for (const part of combo.parts) {
        const idx = part.globalIndex;
        const isSubject = idx !== undefined && idx >= start && idx <= end;
        if (isSubject) {
          subjectSeen = true;
          subjectParts.push(part);
          continue;
        }
        if (!subjectSeen) {
          before.push(part);
        } else {
          after.push(part);
        }
      }
      const nextCombo: TranslationResult["combinations"][number] =
        subjectParts.length === 0
          ? { ...combo, parts: [variant, ...combo.parts] }
          : {
              ...combo,
              parts: [...before, variant, ...subjectParts, ...after],
            };
      if (canAssignDropdown && groupId) {
        nextCombo.variantGroup = { scope: "dropdown", id: groupId };
      }
      expanded.push(nextCombo);
    }
  }
  return expanded;
}

function resolveLocativeSubjectProfile(args: {
  hasExplicitSubject: boolean;
  lastSubject: TranslateState["lastSubject"];
  hasDemonstrative: boolean;
}): LocativeSubjectProfile {
  const { hasExplicitSubject, lastSubject, hasDemonstrative } = args;
  if (hasExplicitSubject && lastSubject) {
    return {
      isHuman: lastSubject.isHuman,
      posture: lastSubject.posture,
    };
  }
  if (hasDemonstrative) {
    return { isHuman: undefined, posture: undefined };
  }
  return { isHuman: true };
}

export function handleCopula(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, state, helpers } = args;
  const token = ir.tokens[index];

  const parsed = parseCopula(ir, index, sourceLang);
  if (!parsed) {
   
    return { handled: false };
  }
  const copula = parsed?.copula ?? null;
  if (!copula) {
  
    return { handled: false };
  }
  const isVerbLikeAt = (idx: number): boolean => {
    if (matchVerbAt(ir.tokens, idx, sourceLang).length > 0) return true;
    if (matchInfinitiveAt(ir.tokens, idx, sourceLang)) return true;
    const gerund = matchGerundAfterIndex(ir.tokens, idx, sourceLang);
    return Boolean(gerund && gerund.gerundIndex === idx);
  };
  const predicateToken = ir.tokens[parsed.predicateIndex];
  if (predicateToken) {
    const normalizedPredicate = normalizeToken(predicateToken.source, sourceLang);
    if (sourceLang === "es") {
      const nextNorm = normalizeToken(
        ir.tokens[parsed.predicateIndex + 1]?.source ?? "",
        sourceLang
      );
      const nextNextNorm = normalizeToken(
        ir.tokens[parsed.predicateIndex + 2]?.source ?? "",
        sourceLang
      );
      if (
        normalizedPredicate === "por" &&
        isVerbLikeAt(parsed.predicateIndex + 1)
      ) {
        return { handled: false };
      }
      if (normalizedPredicate === "a") {
        if (isVerbLikeAt(parsed.predicateIndex + 1)) {
          return { handled: false };
        }
        if (
          nextNorm === "punto" &&
          nextNextNorm === "de" &&
          isVerbLikeAt(parsed.predicateIndex + 3)
        ) {
          return { handled: false };
        }
      }
    }
    if (sourceLang === "en") {
      const nextNorm = normalizeToken(
        ir.tokens[parsed.predicateIndex + 1]?.source ?? "",
        sourceLang
      );
      if (
        normalizedPredicate === "about" &&
        nextNorm === "to" &&
        isVerbLikeAt(parsed.predicateIndex + 2)
      ) {
        return { handled: false };
      }
      if (
        normalizedPredicate === "going" &&
        nextNorm === "to" &&
        isVerbLikeAt(parsed.predicateIndex + 2)
      ) {
        return { handled: false };
      }
    }
  }

  const lastSubjectEnd = state.lastSubject?.endIndex ?? -1;
  const hasExplicitSubject =
    lastSubjectEnd >= 0 &&
    lastSubjectEnd < parsed.copulaIndex &&
    !ir.tokens
      .slice(lastSubjectEnd + 1, parsed.copulaIndex)
      .some((token) => isStrongPunctuationToken(token));

  const inferredPersons =
    state.lastSubject?.persons ??
    copula.persons ??
    helpers.getSubjectPersons(state.lastVerbSubject) ??
    [];
  const reflexivePossessiveOptions = {
    reflexivePersons: inferredPersons.length > 0 ? inferredPersons : undefined,
    reflexiveSubjectRepeat: true,
  };
  const subjectParts =
    hasExplicitSubject
      ? []
      : parsed.demo
        ? [
            finalizePart(
              {
                type: "pronoun",
                source: parsed.demo.source,
                gup: (parsed.demo.variants?.length
                  ? parsed.demo.variants[0]
                  : parsed.demo.gup),
                output: (parsed.demo.variants?.length
                  ? parsed.demo.variants[0]
                  : parsed.demo.gup),
                explanation: "",
                explanations: [
                  {
                    key: "TOKEN_PASSTHROUGH",
                    data: { token: parsed.demo.source },
                  },
                ],
                alternatives:
                  parsed.demo.variants && parsed.demo.variants.length > 1
                    ? parsed.demo.variants.slice(1).map((gup) => ({ gup }))
                    : undefined,
                globalIndex: index,
              },
              sourceLang
            ),
          ]
        : helpers.buildImpliedSubjectParts(
            inferredPersons.length > 0 ? inferredPersons : null,
            state.lastSubject?.sourceToken
          );

  const locativePhrase = matchLocativePhraseAt(
    ir.tokens,
    parsed.predicateIndex,
    sourceLang,
    reflexivePossessiveOptions
  );
  const locativeMatch = locativePhrase
    ? null
    : matchLocativeMarkerAt(ir.tokens, parsed.predicateIndex, sourceLang);
  const locativeSequences = locativePhrase
    ? locativePhrase.sequences
    : locativeMatch
      ? [[buildLocativePart(locativeMatch, sourceLang)]]
      : null;
  if (locativeSequences) {
    const locativeAltSequences = locativePhrase?.possessiveAltSequences ?? null;
    const baseCombos = state.combinations;
    const subjectProfile = resolveLocativeSubjectProfile({
      hasExplicitSubject,
      lastSubject: state.lastSubject,
      hasDemonstrative: Boolean(parsed.demo),
    });
    let locativeOptions = resolveLocativeCopulaVerbOptions(subjectProfile);
    if (locativeOptions.length === 0) {
      const locativeRole = locativeMatch?.entry.locationRole ?? "stationary";
      const fallbackVerb = getLocativeFallbackVerb(locativeRole);
      if (fallbackVerb) {
        locativeOptions = [{ entry: fallbackVerb }];
      }
    }
    const primaryOption = locativeOptions[0];
    if (primaryOption) {
      const locativeConsumed = locativePhrase
        ? locativePhrase.consumed
        : locativeMatch?.consumed ?? 0;
      const predicateEnd = parsed.predicateIndex + locativeConsumed - 1;
      const tense =
        copula.tense === "unknown" ? "present" : copula.tense;
      const negatorPart = parsed.negated
        ? createParticlePart(
            "yaka",
            sourceLang,
            "VERB_NEGATOR",
            ["bäyŋu"],
            parsed.negatorSource
          )
        : null;
      const useExplicitNegator = false;
      const baseCombos = state.combinations;
      const branchNegatorPart = negatorPart;
      const buildLocativeVerbPart = (
        gups: string[],
        explanationKey: ExplanationPayload["key"]
      ): TranslationPart => {
        const primaryGup = gups[0] ?? primaryOption.entry.gup;
        const explanations: ExplanationPayload[] = [
          {
            key: explanationKey,
            data: { token: copula.source, gup: primaryGup },
          },
        ];
        if (locativeOptions.length > 1 && primaryOption.noteKey) {
          explanations.push({ key: primaryOption.noteKey });
        }
        const alternatives: TranslationPart["alternatives"] = [];
        const seen = new Set<string>([primaryGup]);
        for (let idx = 1; idx < locativeOptions.length; idx += 1) {
          const option = locativeOptions[idx];
          const gup = gups[idx] ?? option.entry.gup;
          if (!gup || seen.has(gup)) continue;
          seen.add(gup);
          alternatives.push({
            gup,
            notePayload: option.noteKey ? { key: option.noteKey } : undefined,
          });
        }
        return finalizePart(
          {
            type: "verb",
            source: copula.source,
            gup: primaryGup,
            output: primaryGup,
            explanation: "",
            explanations,
            alternatives: alternatives.length > 0 ? alternatives : undefined,
            meaningKey: primaryOption.entry.meaningKey,
          },
          sourceLang
        );
      };

      const appendBranchesWithGroup = (
        branchList: TranslationPart[][],
        groupId?: string
      ): TranslationResult["combinations"] => {
        const combos = groupId
          ? baseCombos.map((combo) => ({
              ...combo,
              variantGroup: { scope: "box" as const, id: groupId },
            }))
          : baseCombos;
        if (hasExplicitSubject && parsed.negated && tense === "present") {
          return expandBranchesWithSubject(branchList, {
            append: helpers.appendPartsToCombinations,
            combos,
            hasSubjectInCombos: true,
            subjectInsertMode: "after-first",
          });
        }
        let expanded: TranslationResult["combinations"] = [];
        for (const branch of branchList) {
          expanded = expanded.concat(
            helpers.appendPartsToCombinations(combos, branch, "dropdown")
          );
        }
        return expanded;
      };
      const appendBranches = (
        branchList: TranslationPart[][],
        groupId?: string
      ): void => {
        state.combinations = appendBranchesWithGroup(branchList, groupId);
      };

      if (tense === "past") {
        const timeContext = resolvePastTimeContext(
          ir.tokens,
          parsed.copulaIndex,
          sourceLang,
          state.skipIndices
        );
        const buildPastParts = (
          kind: "same-day" | "yesterday",
          includeMarker: boolean
        ): TranslationPart[] => {
          const parts: TranslationPart[] = [];
          parts.push(...subjectParts);
          if (branchNegatorPart) {
            parts.push(branchNegatorPart);
          }
          const gups = locativeOptions.map((option) => {
            if (kind === "same-day") {
              return option.entry.gupForms[2] ?? option.entry.gup;
            }
            return parsed.negated
              ? option.entry.gupForms[1] ?? option.entry.gup
              : option.entry.gupForms[0] ?? option.entry.gup;
          });
          const explanationKey = parsed.negated
            ? kind === "same-day"
              ? "VERB_PAST_SAME_DAY_NEG"
              : "VERB_PAST_YESTERDAY_NEG"
            : kind === "same-day"
              ? "VERB_PAST_SAME_DAY_POS"
              : "VERB_PAST_YESTERDAY_POS";
          parts.push(buildLocativeVerbPart(gups, explanationKey));
          return parts;
        };
        const sameDayBranches = buildBranches(
          buildPastParts("same-day", false),
          locativeSequences
        );
        const yesterdayBranches = buildBranches(
          buildPastParts("yesterday", false),
          locativeSequences
        );
        const sameDayAltBranches = locativeAltSequences
          ? buildBranches(buildPastParts("same-day", false), locativeAltSequences)
          : null;
        const yesterdayAltBranches = locativeAltSequences
          ? buildBranches(buildPastParts("yesterday", false), locativeAltSequences)
          : null;
        const expandPastBranches = (
          branchList: TranslationPart[][],
          groupId?: string
        ): TranslationResult["combinations"] =>
          expandBranchesWithSubject(branchList, {
            append: helpers.appendPartsToCombinations,
            combos: groupId
              ? baseCombos.map((combo) => ({
                  ...combo,
                  variantGroup: { scope: "box" as const, id: groupId },
                }))
              : baseCombos,
            hasSubjectInCombos: hasExplicitSubject,
            subjectInsertMode: "after-marker",
          });

        if (timeContext === "today") {
          state.combinations = expandPastBranches(sameDayBranches);
          if (sameDayAltBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            const expandedAlt = expandPastBranches(sameDayAltBranches, altGroup);
            state.combinations = [...state.combinations, ...expandedAlt];
            state.hasAmbiguity = true;
          }
        } else if (timeContext === "yesterday") {
          state.combinations = expandPastBranches(yesterdayBranches);
          if (yesterdayAltBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            const expandedAlt = expandPastBranches(yesterdayAltBranches, altGroup);
            state.combinations = [...state.combinations, ...expandedAlt];
            state.hasAmbiguity = true;
          }
        } else {
          const sameDayGroup = helpers.nextVariantGroup("box").id;
          const yesterdayGroup = helpers.nextVariantGroup("box").id;
          const expandedSame = expandPastBranches(sameDayBranches, sameDayGroup);
          const expandedYesterday = expandPastBranches(
            yesterdayBranches,
            yesterdayGroup
          );
          let expandedAlt: TranslationResult["combinations"] = [];
          if (sameDayAltBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            expandedAlt = expandedAlt.concat(
              expandPastBranches(sameDayAltBranches, altGroup)
            );
          }
          if (yesterdayAltBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            expandedAlt = expandedAlt.concat(
              expandPastBranches(yesterdayAltBranches, altGroup)
            );
          }
          state.combinations = [...expandedSame, ...expandedYesterday, ...expandedAlt];
          state.hasAmbiguity = true;
        }
      } else if (tense === "future") {
        const timeContext = resolveFutureTimeContext(
          ir.tokens,
          parsed.copulaIndex,
          sourceLang,
          state.skipIndices
        );
        const buildFutureParts = (kind: "same-day" | "tomorrow") => {
          const parts: TranslationPart[] = [];
          parts.push(...subjectParts);
          parts.push(
            createParticlePart("dhu", sourceLang, "VERB_PARTICLE_FUTURE", [
              "yurru",
            ])
          );
          if (branchNegatorPart) {
            parts.push(branchNegatorPart);
          }
          const gups = locativeOptions.map((option) =>
            kind === "same-day"
              ? option.entry.gupForms[0] ?? option.entry.gup
              : option.entry.gupForms[1] ?? option.entry.gup
          );
          const explanationKey = parsed.negated
            ? kind === "same-day"
              ? "VERB_FUTURE_SAME_DAY_NEG"
              : "VERB_FUTURE_TOMORROW_NEG"
            : kind === "same-day"
              ? "VERB_FUTURE_SAME_DAY_POS"
              : "VERB_FUTURE_TOMORROW_POS";
          parts.push(buildLocativeVerbPart(gups, explanationKey));
          return parts;
        };
        const sameDayBranches = buildBranches(
          buildFutureParts("same-day"),
          locativeSequences
        );
        const tomorrowBranches = buildBranches(
          buildFutureParts("tomorrow"),
          locativeSequences
        );
        const sameDayAltBranches = locativeAltSequences
          ? buildBranches(buildFutureParts("same-day"), locativeAltSequences)
          : null;
        const tomorrowAltBranches = locativeAltSequences
          ? buildBranches(buildFutureParts("tomorrow"), locativeAltSequences)
          : null;
        if (timeContext === "same-day") {
          appendBranches(sameDayBranches);
          if (sameDayAltBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            state.combinations = [
              ...state.combinations,
              ...appendBranchesWithGroup(sameDayAltBranches, altGroup),
            ];
            state.hasAmbiguity = true;
          }
        } else if (timeContext === "tomorrow") {
          appendBranches(tomorrowBranches);
          if (tomorrowAltBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            state.combinations = [
              ...state.combinations,
              ...appendBranchesWithGroup(tomorrowAltBranches, altGroup),
            ];
            state.hasAmbiguity = true;
          }
        } else {
          const sameDayGroup = helpers.nextVariantGroup("box").id;
          const tomorrowGroup = helpers.nextVariantGroup("box").id;
          const expandedSame = appendBranchesWithGroup(
            sameDayBranches,
            sameDayGroup
          );
          const expandedTomorrow = appendBranchesWithGroup(
            tomorrowBranches,
            tomorrowGroup
          );
          let expandedAlt: TranslationResult["combinations"] = [];
          if (sameDayAltBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            expandedAlt = expandedAlt.concat(
              appendBranchesWithGroup(sameDayAltBranches, altGroup)
            );
          }
          if (tomorrowAltBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            expandedAlt = expandedAlt.concat(
              appendBranchesWithGroup(tomorrowAltBranches, altGroup)
            );
          }
          state.combinations = [...expandedSame, ...expandedTomorrow, ...expandedAlt];
          state.hasAmbiguity = true;
        }
      } else {
        const parts: TranslationPart[] = [];
        if (branchNegatorPart) {
          parts.push(branchNegatorPart);
        }
        parts.push(...subjectParts);
        if (parsed.negated) {
          parts.push(createParticlePart("gi", sourceLang, "VERB_PARTICLE_NEG"));
        } else {
          parts.push(
            createParticlePart("ga", sourceLang, "VERB_PARTICLE_POS", [
              "yukurra",
            ])
          );
        }
        const gups = locativeOptions.map((option) =>
          parsed.negated
            ? option.entry.gupForms[1] ?? option.entry.gup
            : option.entry.gupForms[0] ?? option.entry.gup
        );
        const explanationKey = parsed.negated
          ? "VERB_PRESENT_NEG"
          : "VERB_PRESENT_POS";
        parts.push(buildLocativeVerbPart(gups, explanationKey));
        const branches = buildBranches(parts, locativeSequences);
        const altBranches = locativeAltSequences
          ? buildBranches(parts, locativeAltSequences)
          : null;
        if (hasExplicitSubject && parsed.negated) {
          state.combinations = expandBranchesWithSubject(branches, {
            append: helpers.appendPartsToCombinations,
            combos: state.combinations,
            hasSubjectInCombos: true,
            subjectInsertMode: "after-first",
          });
          if (altBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            const expandedAlt = expandBranchesWithSubject(altBranches, {
              append: helpers.appendPartsToCombinations,
              combos: baseCombos.map((combo) => ({
                ...combo,
                variantGroup: { scope: "box" as const, id: altGroup },
              })),
              hasSubjectInCombos: true,
              subjectInsertMode: "after-first",
            });
            state.combinations = [...state.combinations, ...expandedAlt];
            state.hasAmbiguity = true;
          }
        } else {
          let expanded: TranslationResult["combinations"] = [];
          for (const branch of branches) {
            expanded = expanded.concat(
              helpers.appendPartsToCombinations(
                state.combinations,
                branch,
                "dropdown"
              )
            );
          }
          state.combinations = expanded;
          if (altBranches) {
            const altGroup = helpers.nextVariantGroup("box").id;
            let expandedAlt: TranslationResult["combinations"] = [];
            const base = baseCombos.map((combo) => ({
              ...combo,
              variantGroup: { scope: "box" as const, id: altGroup },
            }));
            for (const branch of altBranches) {
              expandedAlt = expandedAlt.concat(
                helpers.appendPartsToCombinations(base, branch, "dropdown")
              );
            }
            state.combinations = [...state.combinations, ...expandedAlt];
            state.hasAmbiguity = true;
          }
        }
      }

      const hasAlternatives = subjectParts.some(
        (part) => part.alternatives && part.alternatives.length > 0
      );
      if (hasAlternatives) {
        state.hasAmbiguity = true;
      }
      if (locativeOptions.length > 1) {
        state.hasAmbiguity = true;
      }
      if (locativePhrase?.hasAmbiguity) {
        state.hasAmbiguity = true;
      }
      if (negatorPart?.alternatives?.length) {
        state.hasAmbiguity = true;
      }
      state.pendingSubjectJoin = false;
      state.lastConnectorAnchor = predicateEnd;
      helpers.updateLastVerbSubject(
        inferredPersons.length > 0 ? inferredPersons : null,
        predicateEnd,
        state.lastSubject?.sourceToken
      );
      return { handled: true, nextIndex: predicateEnd };
    }
  }

  const hasOtherVerb = ir.tokens.some((_, idx) => {
    if (
      idx >= parsed.copulaIndex &&
      idx < parsed.copulaIndex + copula.consumed
    ) {
      return false;
    }
    return matchVerbAt(ir.tokens, idx, sourceLang).length > 0;
  });

  if (!hasOtherVerb) {
    const suppressDefiniteArticleVariants = shouldSuppressDefiniteArticleVariants(
      parsed,
      state.lastSubject?.sourceToken,
      sourceLang
    );
    let originIndex = parsed.predicateIndex;
    let origin = matchOriginPhraseAt(
      ir.tokens,
      originIndex,
      sourceLang,
      reflexivePossessiveOptions
    );
    if (!origin) {
      const prevToken = ir.tokens[parsed.predicateIndex - 1];
      const token = ir.tokens[parsed.predicateIndex];
      if (prevToken && token) {
        const prevNorm = normalizeToken(prevToken.source, sourceLang);
        const prevIsOf =
          (sourceLang === "es" && prevNorm === "de") ||
          (sourceLang === "en" && prevNorm === "of");
        const demoMatch = matchDemonstrativeToken(token.source, sourceLang);
        if (prevIsOf && (demoMatch || isNonHumanDemoPronoun(token.source, sourceLang))) {
          originIndex = parsed.predicateIndex - 1;
          origin = matchOriginPhraseAt(
            ir.tokens,
            originIndex,
            sourceLang,
            reflexivePossessiveOptions
          );
        }
      }
    }
    const possession = matchPossessivePredicate({
      ir,
      index: parsed.predicateIndex,
      sourceLang,
      suppressDefiniteArticleVariants,
    });
    const originPredicate = origin
      ? {
          sequences: origin.sequences,
          consumed: origin.consumed,
          hasAlternatives: origin.hasAmbiguity,
        }
      : null;
    if (possession) {
      const predicateEnd =
        parsed.predicateIndex +
        Math.max(possession.consumed, origin?.consumed ?? 0) -
        1;
      const negatorPart = parsed.negated
        ? createParticlePart(
            "yaka",
            sourceLang,
            "VERB_NEGATOR",
            ["bäyŋu"],
            parsed.negatorSource
          )
        : null;
      const useExplicitNegator = Boolean(
        parsed.negated && hasExplicitSubject && negatorPart
      );
      const combosForBranches = useExplicitNegator && negatorPart
        ? insertNegatorBeforeSubjectCombos(
            state.combinations,
            negatorPart,
            state.lastSubject,
            () => helpers.nextVariantGroup("dropdown").id
          )
        : state.combinations;
      const baseParts: TranslationPart[] = [];
      if (!useExplicitNegator && negatorPart) {
        baseParts.push(negatorPart);
      }
      baseParts.push(...subjectParts);
      const expandPredicate = (
        predicate: PossessionPredicate,
        groupId?: string
      ): { expanded: TranslationResult["combinations"]; branches: TranslationPart[][] } => {
        const branches = buildBranches(baseParts, predicate.sequences);
        const variantGroup =
          predicate.sequences.length > 1
            ? helpers.nextVariantGroup("dropdown")
            : null;
        const combosWithGroup = variantGroup
          ? combosForBranches.map((combo) => ({
              ...combo,
              variantGroup,
            }))
          : combosForBranches;
        const combosWithBox = groupId
          ? combosWithGroup.map((combo) => ({
              ...combo,
              variantGroup: { scope: "box" as const, id: groupId },
            }))
          : combosWithGroup;
        let expanded: TranslationResult["combinations"] = [];
        for (const branch of branches) {
          expanded = expanded.concat(
            helpers.appendPartsToCombinations(combosWithBox, branch, "dropdown")
          );
        }
        return { expanded, branches };
      };

      if (originPredicate) {
        const possessionGroup = helpers.nextVariantGroup("box").id;
        const originGroup = helpers.nextVariantGroup("box").id;
        const expandedPossession = expandPredicate(possession, possessionGroup);
        const expandedOrigin = expandPredicate(originPredicate, originGroup);
        state.combinations = [
          ...expandedPossession.expanded,
          ...expandedOrigin.expanded,
        ];
        state.hasAmbiguity = true;
        if (useExplicitNegator && negatorPart?.alternatives?.length) {
          state.hasAmbiguity = true;
        }
        state.pendingSubjectJoin = false;
        state.lastConnectorAnchor = predicateEnd;
        helpers.updateLastVerbSubject(
          inferredPersons.length > 0 ? inferredPersons : null,
          predicateEnd,
          state.lastSubject?.sourceToken
        );
        return { handled: true, nextIndex: predicateEnd };
      }

      const expandedPossession = expandPredicate(possession);
      state.combinations = expandedPossession.expanded;

      const hasAlternatives = expandedPossession.branches.some((branch) =>
        branch.some((part) => part.alternatives && part.alternatives.length > 0)
      );
      if (hasAlternatives || possession.sequences.length > 1) {
        state.hasAmbiguity = true;
      }
      if (useExplicitNegator && negatorPart?.alternatives?.length) {
        state.hasAmbiguity = true;
      }
      state.pendingSubjectJoin = false;
      state.lastConnectorAnchor = predicateEnd;
      helpers.updateLastVerbSubject(
        inferredPersons.length > 0 ? inferredPersons : null,
        predicateEnd,
        state.lastSubject?.sourceToken
      );
      return { handled: true, nextIndex: predicateEnd };
    }

    if (origin) {
      const predicateEnd = parsed.predicateIndex + origin.consumed - 1;
      const negatorPart = parsed.negated
        ? createParticlePart(
            "yaka",
            sourceLang,
            "VERB_NEGATOR",
            ["bäyŋu"],
            parsed.negatorSource
          )
        : null;
      const useExplicitNegator = Boolean(
        parsed.negated && hasExplicitSubject && negatorPart
      );
      const combosForBranches = useExplicitNegator && negatorPart
        ? insertNegatorBeforeSubjectCombos(
            state.combinations,
            negatorPart,
            state.lastSubject,
            () => helpers.nextVariantGroup("dropdown").id
          )
        : state.combinations;
      const baseParts: TranslationPart[] = [];
      if (!useExplicitNegator && negatorPart) {
        baseParts.push(negatorPart);
      }
      baseParts.push(...subjectParts);
      const branches = buildBranches(baseParts, origin.sequences);
      const variantGroup =
        origin.sequences.length > 1
          ? helpers.nextVariantGroup("dropdown")
          : null;
      const combosWithGroup = variantGroup
        ? combosForBranches.map((combo) => ({
            ...combo,
            variantGroup,
          }))
        : combosForBranches;
      let expanded: TranslationResult["combinations"] = [];
      for (const branch of branches) {
        expanded = expanded.concat(
          helpers.appendPartsToCombinations(combosWithGroup, branch, "dropdown")
        );
      }
      state.combinations = expanded;

      const hasAlternatives = branches.some((branch) =>
        branch.some((part) => part.alternatives && part.alternatives.length > 0)
      );
      if (hasAlternatives || origin.sequences.length > 1) {
        state.hasAmbiguity = true;
      }
      if (useExplicitNegator && negatorPart?.alternatives?.length) {
        state.hasAmbiguity = true;
      }
      state.pendingSubjectJoin = false;
      state.lastConnectorAnchor = predicateEnd;
      helpers.updateLastVerbSubject(
        inferredPersons.length > 0 ? inferredPersons : null,
        predicateEnd,
        state.lastSubject?.sourceToken
      );
      return { handled: true, nextIndex: predicateEnd };
    }
  }

  const comitativePredicate = matchComitativePhraseAt(
    ir.tokens,
    parsed.predicateIndex,
    sourceLang,
    reflexivePossessiveOptions
  );
  if (comitativePredicate) {
    const predicateEnd = parsed.predicateIndex + comitativePredicate.consumed - 1;
    const negatorPart = parsed.negated
      ? createParticlePart(
          "yaka",
          sourceLang,
          "VERB_NEGATOR",
          ["bäyŋu"],
          parsed.negatorSource
        )
      : null;
    const useExplicitNegator = Boolean(
      parsed.negated && hasExplicitSubject && negatorPart
    );
    const combosForBranches = useExplicitNegator && negatorPart
      ? insertNegatorBeforeSubjectCombos(
          state.combinations,
          negatorPart,
          state.lastSubject,
          () => helpers.nextVariantGroup("dropdown").id
        )
      : state.combinations;
    const baseParts: TranslationPart[] = [];
    if (!useExplicitNegator && negatorPart) {
      baseParts.push(negatorPart);
    }
    baseParts.push(...subjectParts);
    const branches = buildBranches(baseParts, comitativePredicate.sequences);
    const variantGroup =
      comitativePredicate.sequences.length > 1
        ? helpers.nextVariantGroup("dropdown")
        : null;
    const combosWithGroup = variantGroup
      ? combosForBranches.map((combo) => ({
          ...combo,
          variantGroup,
        }))
      : combosForBranches;
    let expanded: TranslationResult["combinations"] = [];
    for (const branch of branches) {
      expanded = expanded.concat(
        helpers.appendPartsToCombinations(combosWithGroup, branch, "dropdown")
      );
    }
    state.combinations = expanded;

    const hasAlternatives = branches.some((branch) =>
      branch.some((part) => part.alternatives && part.alternatives.length > 0)
    );
    if (
      hasAlternatives ||
      comitativePredicate.sequences.length > 1 ||
      comitativePredicate.hasAmbiguity
    ) {
      state.hasAmbiguity = true;
    }
    if (useExplicitNegator && negatorPart?.alternatives?.length) {
      state.hasAmbiguity = true;
    }
    state.pendingSubjectJoin = false;
    state.lastConnectorAnchor = predicateEnd;
    helpers.updateLastVerbSubject(
      inferredPersons.length > 0 ? inferredPersons : null,
      predicateEnd,
      state.lastSubject?.sourceToken
    );
    return { handled: true, nextIndex: predicateEnd };
  }

  const predicate = buildPredicatePart(ir, parsed.predicateIndex, sourceLang);
  if (!predicate) return { handled: false };

  const predicateEnd = parsed.predicateIndex + predicate.consumed - 1;
  const negatorPart = parsed.negated
    ? createParticlePart(
        "yaka",
        sourceLang,
        "VERB_NEGATOR",
        ["bäyŋu"],
        parsed.negatorSource
      )
    : null;
  const useExplicitNegator = Boolean(
    parsed.negated && hasExplicitSubject && negatorPart
  );
  const combosForBranches = useExplicitNegator && negatorPart
    ? insertNegatorBeforeSubjectCombos(
        state.combinations,
        negatorPart,
        state.lastSubject,
        () => helpers.nextVariantGroup("dropdown").id
      )
    : state.combinations;
  const parts: TranslationPart[] = [];
  if (!useExplicitNegator && negatorPart) {
    parts.push(negatorPart);
  }
  parts.push(...subjectParts, ...predicate.parts);

  const hasAlternatives = parts.some(
    (part) => part.alternatives && part.alternatives.length > 0
  );

  state.combinations = helpers.appendPartsToCombinations(
    combosForBranches,
    parts,
    "dropdown"
  );

  if (hasAlternatives) {
    state.hasAmbiguity = true;
  }
  if (useExplicitNegator && negatorPart?.alternatives?.length) {
    state.hasAmbiguity = true;
  }
  state.pendingSubjectJoin = false;
  state.lastConnectorAnchor = predicateEnd;
  helpers.updateLastVerbSubject(
    inferredPersons.length > 0 ? inferredPersons : null,
    predicateEnd,
    state.lastSubject?.sourceToken
  );
  return { handled: true, nextIndex: predicateEnd };
}
