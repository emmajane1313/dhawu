import { LanguageMode } from "@/app/components/types/components.type";
import type { IRSentence, VariantGroup } from "../../core/types";
import { matchArticleAt, isOtherGroupPatternAt } from "../../logic/lexiconMatch";
import { matchDemonstrativeToken } from "../../logic/demonstratives";
import { matchCopulaAt } from "../../logic/copula";
import { matchVerbAt } from "../../rules/verb";
import { buildNounPhraseParts, matchNounPhraseAfterArticle } from "../../logic/objects";
import { buildDefiniteArticlePart, finalizePart } from "../../logic/parts";
import { matchPossessiveOfPronoun } from "../../logic/possession";
import { isStrongPunctuationToken, normalizeToken } from "../../logic/tokenUtils";
import { isNegatorToken } from "../../logic/negation";
import { isClauseConnectorToken } from "../../logic/connectors";
import type { TranslateHelpers, TranslateState } from "../types";
import { debugLog } from "../debug";

export function handleArticles(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, state, helpers } = args;
  debugLog("[ridjin-debug] articles", {
    index,
    token: ir.tokens[index]?.source,
  });

  const findCopulaAfter = (startIndex: number): number | null => {
    const direct = matchCopulaAt(ir.tokens, startIndex, sourceLang);
    if (direct) return startIndex;
    const negatorToken = ir.tokens[startIndex];
    if (negatorToken && isNegatorToken(negatorToken, sourceLang)) {
      const negated = matchCopulaAt(ir.tokens, startIndex + 1, sourceLang);
      if (negated) return startIndex + 1;
    }
    return null;
  };

  const hasVerbBefore = (startIndex: number): boolean => {
    for (let i = startIndex; i >= 0; i -= 1) {
      const token = ir.tokens[i];
      if (!token) break;
      if (isStrongPunctuationToken(token)) break;
      if (isClauseConnectorToken(ir.tokens, i, sourceLang)) break;
      if (matchVerbAt(ir.tokens, i, sourceLang).length > 0) return true;
    }
    return false;
  };

  const findNextVerbMatches = (startIndex: number) => {
    for (let i = startIndex; i < ir.tokens.length; i += 1) {
      const token = ir.tokens[i];
      if (!token) break;
      if (isStrongPunctuationToken(token)) break;
      if (isClauseConnectorToken(ir.tokens, i, sourceLang)) break;
      const matches = matchVerbAt(ir.tokens, i, sourceLang);
      if (matches.length > 0) return matches;
    }
    return null;
  };

  const hasTransitiveVerbBefore = (): boolean => {
    for (let i = index - 1; i >= 0; i -= 1) {
      const token = ir.tokens[i];
      if (!token) break;
      if (isStrongPunctuationToken(token)) break;
      if (isClauseConnectorToken(ir.tokens, i, sourceLang)) break;
      const matches = matchVerbAt(ir.tokens, i, sourceLang);
      if (matches.length > 0) {
        return matches.some((match) => match.entry.isTransitive);
      }
    }
    return false;
  };

  const shouldAllowIntransitiveSubject = (phraseEnd: number): boolean => {
    if (hasVerbBefore(index - 1)) return false;
    const verbMatches = findNextVerbMatches(phraseEnd);
    if (!verbMatches || verbMatches.length === 0) return false;
    const anyTransitive = verbMatches.some((match) => match.entry.isTransitive);
    const anyIntransitive = verbMatches.some((match) => !match.entry.isTransitive);
    return anyIntransitive && !anyTransitive;
  };
  const demoMatch = matchDemonstrativeToken(ir.tokens[index]?.source ?? "", sourceLang);
  if (demoMatch) {
  
    const nextToken = ir.tokens[index + 1];
    if (nextToken) {
      const directCopula = matchCopulaAt(ir.tokens, index + 1, sourceLang);
      if (directCopula) {
    
        return { handled: false };
      }
      if (isNegatorToken(nextToken, sourceLang)) {
        const negatedCopula = matchCopulaAt(ir.tokens, index + 2, sourceLang);
        if (negatedCopula) {
        
          return { handled: false };
        }
      }
    }
    const phrase = matchNounPhraseAfterArticle(ir.tokens, index + 1, sourceLang);
    if (nextToken) {
      if (matchVerbAt(ir.tokens, index + 1, sourceLang).length > 0 && !phrase) {
        return { handled: false };
      }
    }
    const copulaAtToken = matchCopulaAt(ir.tokens, index, sourceLang);
    if (copulaAtToken && !phrase) {
      return { handled: false };
    }
    if (!phrase) {
      return { handled: false };
    }
    if (phrase) {
      const afterPhrase = index + 1 + phrase.consumed;
      const copulaIndex = findCopulaAfter(afterPhrase);
      const allowIntransitive = shouldAllowIntransitiveSubject(afterPhrase);
      const allowTransitiveObject = hasTransitiveVerbBefore();
      const verbMatches = findNextVerbMatches(afterPhrase);
      const allowTransitiveSubject = Boolean(
        !hasVerbBefore(index - 1) &&
          verbMatches?.some((match) => match.entry.isTransitive)
      );
      if (
        !copulaIndex &&
        !allowIntransitive &&
        !allowTransitiveObject &&
        !allowTransitiveSubject
      ) {
        return { handled: true, nextIndex: index };
      }
      const variants = demoMatch.variants?.length
        ? demoMatch.variants
        : [demoMatch.gup];
      const demoPart = finalizePart(
        {
          type: "particle",
          source: demoMatch.source,
          gup: variants[0],
          output: variants[0],
          explanation: "",
          explanations: [
            { key: "TOKEN_PASSTHROUGH", data: { token: demoMatch.source } },
          ],
          alternatives:
            variants.length > 1
              ? variants.slice(1).map((gup) => ({ gup }))
              : undefined,
          meaningKey: "article.demonstrative",
          globalIndex: index,
        },
        sourceLang
      );
      state.combinations = helpers.appendPartsToCombinations(
        state.combinations,
        [demoPart],
        "dropdown"
      );
      return { handled: true, nextIndex: index };
    }
    return { handled: true, nextIndex: index };
  }
  const articleMatch = matchArticleAt(ir.tokens, index, sourceLang);
  if (!articleMatch || isOtherGroupPatternAt(ir.tokens, index, sourceLang)) {
    return { handled: false };
  }
  const phrase = matchNounPhraseAfterArticle(
    ir.tokens,
    index + articleMatch.consumed,
    sourceLang
  );
  if (!phrase) return { handled: false };
  const afterPhrase = index + articleMatch.consumed + phrase.consumed;
  const copulaIndex = findCopulaAfter(afterPhrase);
  const allowIntransitive = shouldAllowIntransitiveSubject(afterPhrase);
  const hasVerbAfter = Boolean(findNextVerbMatches(afterPhrase));
  const connector = ir.tokens[afterPhrase];
  if (connector) {
    const connectorNorm = normalizeToken(connector.source, sourceLang);
    const isOf =
      (sourceLang === "es" && connectorNorm === "de") ||
      (sourceLang === "en" && connectorNorm === "of");
    if (isOf) {
      const possessorToken = ir.tokens[afterPhrase + 1];
      if (
        possessorToken &&
        (matchPossessiveOfPronoun(possessorToken.source, sourceLang) ||
          matchNounPhraseAfterArticle(
            ir.tokens,
            afterPhrase + 1,
            sourceLang
          ) ||
          !isStrongPunctuationToken(possessorToken))
      ) {
        return { handled: false };
      }
    }
  }
  if (!hasVerbBefore(index - 1) && !hasVerbAfter && !copulaIndex) {
    const parts = buildNounPhraseParts(phrase, sourceLang);
    state.combinations = helpers.appendPartsToCombinations(
      state.combinations,
      parts,
      "dropdown"
    );
    return { handled: true, nextIndex: afterPhrase - 1 };
  }

  if (articleMatch.kind === "indefinite") {
    return { handled: true, nextIndex: index + articleMatch.consumed - 1 };
  }
  if (!copulaIndex && !allowIntransitive) {
    return { handled: true, nextIndex: index + articleMatch.consumed - 1 };
  }

  const groupId: VariantGroup = helpers.nextVariantGroup("dropdown");
  const baseCombos = state.combinations.map((combo) => ({
    ...combo,
    variantGroup: groupId,
  }));
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
  const withDhuwala = helpers.appendPartsToCombinations(
    baseCombos,
    [dhuwalaPart],
    "dropdown"
  );
  const withDuwali = helpers.appendPartsToCombinations(
    baseCombos,
    [duwaliPart],
    "dropdown"
  );
  state.combinations = [...baseCombos, ...withDhuwala, ...withDuwali];
  state.hasAmbiguity = true;
  return { handled: true, nextIndex: index + articleMatch.consumed - 1 };
}
