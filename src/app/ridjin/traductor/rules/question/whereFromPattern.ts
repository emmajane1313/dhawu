import { QuestionPatternResult, QuestionContext, AnswerInfo, AdditionalAnswer } from "./types";
import {
  LANG_CONFIG,
  QUESTION_GUP,
  ABLATIVE_SUFFIX,
  applyAblativeSuffix,
  determineHumanAblativeSuffix,
  applyHumanAblativeSuffix,
} from "../../constants";
import { findNounInfo } from "./questionHelpers";

function findMultiWordTrigger(
  tokens: string[],
  triggers: string[]
): { idx: number; wordCount: number } | null {
  for (const trigger of triggers) {
    const triggerWords = trigger.split(" ");
    if (triggerWords.length === 1) continue;

    for (let i = 0; i <= tokens.length - triggerWords.length; i++) {
      const slice = tokens
        .slice(i, i + triggerWords.length)
        .map((t) => t.toLowerCase());
      if (slice.join(" ") === trigger) {
        return { idx: i, wordCount: triggerWords.length };
      }
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i].toLowerCase();
    if (triggers.includes(word)) {
      return { idx: i, wordCount: 1 };
    }
  }

  return null;
}

export function detectWhereFromPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    whereFromTriggers,
    questionSkipWords,
    thisWords,
    thatWords,
    definiteArticles,
    pluralArticles,
    connectors,
  } = LANG_CONFIG[mode];

  const triggerMatch = findMultiWordTrigger(tokens, whereFromTriggers);
  if (!triggerMatch) return null;

  const { idx: whereFromIdx, wordCount } = triggerMatch;
  const consumedIndices: number[] = [];
  for (let i = 0; i < wordCount; i++) {
    consumedIndices.push(whereFromIdx + i);
  }

  const questionMarkPos = originalText.indexOf("?");
  let tokensBeforeQuestion = tokens.length;

  if (questionMarkPos !== -1) {
    const textBeforeQuestion = originalText.slice(0, questionMarkPos);
    const wordsBeforeQuestion = textBeforeQuestion
      .replace(/[!¡¿.;:()"""'']/g, "")
      .split(/[\s,]+/)
      .filter((w) => w.length > 0);
    tokensBeforeQuestion = wordsBeforeQuestion.length;
  }

  let answerInfo: AnswerInfo | undefined;
  let answerExplanation = "";
  const additionalAnswers: AdditionalAnswer[] = [];
  const answerConsumedIndices: number[] = [];
  const usedAnswerIndices = new Set<number>();

  if (questionMarkPos !== -1) {
    const afterQuestion = originalText.slice(questionMarkPos + 1).trim();
    if (afterQuestion) {
      const answerWords = afterQuestion.split(/\s+/);
      let determinerType: "this" | "that" | "definite" | null = null;
      let isPlural = false;

      for (const rawWord of answerWords) {
        const answerWord = rawWord.toLowerCase().replace(/[,.\-;:!¡¿]+$/, "");
        if (!answerWord) continue;

        if (connectors.includes(answerWord)) {
          const connectorIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (connectorIdx !== -1) {
            consumedIndices.push(connectorIdx);
            answerConsumedIndices.push(connectorIdx);
            usedAnswerIndices.add(connectorIdx);
          }
          continue;
        }

        if (thisWords.includes(answerWord)) {
          determinerType = "this";
          const articleIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (articleIdx !== -1) {
            consumedIndices.push(articleIdx);
            usedAnswerIndices.add(articleIdx);
          }
          continue;
        }

        if (thatWords.includes(answerWord)) {
          determinerType = "that";
          const articleIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (articleIdx !== -1) {
            consumedIndices.push(articleIdx);
            usedAnswerIndices.add(articleIdx);
          }
          continue;
        }

        if (definiteArticles.includes(answerWord)) {
          determinerType = "definite";
          if (pluralArticles.includes(answerWord)) isPlural = true;
          const articleIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (articleIdx !== -1) {
            consumedIndices.push(articleIdx);
            usedAnswerIndices.add(articleIdx);
          }
          continue;
        }

        if (questionSkipWords.includes(answerWord)) {
          const skipIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (skipIdx !== -1) {
            consumedIndices.push(skipIdx);
            usedAnswerIndices.add(skipIdx);
          }
          continue;
        }

        const nounInfo = findNounInfo(answerWord, mode);
        const isWordUnknown = nounInfo === null;
        const nounBaseGup = nounInfo ? nounInfo.gupKey : answerWord;
        const nounIsPlural = nounInfo?.isPlural || false;
        const isHumanNoun = nounInfo?.isHuman;
        const isPlaceNoun = nounInfo?.isPlace;

        const answerIdx = lowerTokens.findIndex(
          (t, i) =>
            i >= tokensBeforeQuestion &&
            !usedAnswerIndices.has(i) &&
            t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
        );
        if (answerIdx !== -1) {
          consumedIndices.push(answerIdx);
          usedAnswerIndices.add(answerIdx);
        }

        if (answerInfo) {
          let additionalBaseGup: string;
          let additionalSuffix: string | undefined;
          let additionalAlternatives: string[] | undefined;

          if (isPlaceNoun === true) {
            additionalBaseGup = applyAblativeSuffix(nounBaseGup);
            additionalSuffix = ABLATIVE_SUFFIX;
          } else if (isHumanNoun === true) {
            const suffixes = determineHumanAblativeSuffix(nounBaseGup);
            additionalBaseGup = applyHumanAblativeSuffix(nounBaseGup, suffixes[0]);
            additionalSuffix = suffixes[0];
            if (suffixes.length > 1) {
              additionalAlternatives = suffixes.slice(1).map((s) => applyHumanAblativeSuffix(nounBaseGup, s));
            }
          } else if (isWordUnknown) {
            const humanSuffixes = determineHumanAblativeSuffix(nounBaseGup);
            const humanOptions = humanSuffixes.map((s) => applyHumanAblativeSuffix(nounBaseGup, s));
            additionalBaseGup = applyAblativeSuffix(nounBaseGup);
            additionalSuffix = ABLATIVE_SUFFIX;
            additionalAlternatives = humanOptions;
          } else {
            additionalBaseGup = applyAblativeSuffix(nounBaseGup);
            additionalSuffix = ABLATIVE_SUFFIX;
          }

          additionalAnswers.push({
            baseGup: additionalBaseGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: additionalSuffix,
            isHuman: isHumanNoun,
            isPlace: isPlaceNoun,
            alternatives: additionalAlternatives,
            sourceWord: answerWord,
            explanation: `"${answerWord}" → ${additionalBaseGup}`,
          });
          continue;
        }

        if (isPlaceNoun === true) {
          const suffixedGup = applyAblativeSuffix(nounBaseGup);
          answerExplanation = `${nounBaseGup} + -${ABLATIVE_SUFFIX} = ${suffixedGup}`;
          answerInfo = {
            baseGup: suffixedGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: ABLATIVE_SUFFIX,
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural: isPlural || nounIsPlural,
            isPlace: true,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
          };
        } else if (isHumanNoun === true) {
          const suffixes = determineHumanAblativeSuffix(nounBaseGup);
          const suffixedOptions = suffixes.map((s) => applyHumanAblativeSuffix(nounBaseGup, s));
          const suffixedGup = suffixedOptions[0];
          answerExplanation = `${nounBaseGup} + -${suffixes[0]} = ${suffixedGup}`;
          answerInfo = {
            baseGup: suffixedGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: suffixes[0],
            allSuffixes: suffixes.length > 1 ? suffixes : undefined,
            alternatives: suffixedOptions.length > 1 ? suffixedOptions.slice(1) : undefined,
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural: isPlural || nounIsPlural,
            isHuman: true,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
          };
        } else if (isWordUnknown) {
          const humanSuffixes = determineHumanAblativeSuffix(nounBaseGup);
          const humanOptions = humanSuffixes.map((s) => applyHumanAblativeSuffix(nounBaseGup, s));
          const nonhumanOption = applyAblativeSuffix(nounBaseGup);
          answerExplanation = `${nounBaseGup} + -${ABLATIVE_SUFFIX} = ${nonhumanOption} (palabra desconocida)`;
          answerInfo = {
            baseGup: nonhumanOption,
            rawBaseGup: nounBaseGup,
            appliedSuffix: ABLATIVE_SUFFIX,
            alternatives: humanOptions,
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural: isPlural || nounIsPlural,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
          };
        } else {
          const suffixedGup = applyAblativeSuffix(nounBaseGup);
          answerExplanation = `${nounBaseGup} + -${ABLATIVE_SUFFIX} = ${suffixedGup}`;
          answerInfo = {
            baseGup: suffixedGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: ABLATIVE_SUFFIX,
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural: isPlural || nounIsPlural,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
          };
        }
      }

      if (answerInfo) {
        if (additionalAnswers.length > 0) {
          answerInfo.additionalAnswers = additionalAnswers;
        }
        if (answerConsumedIndices.length > 0) {
          answerInfo.answerConsumedIndices = answerConsumedIndices;
        }
      }
    }
  }

  let explanation = `${tokens
    .slice(whereFromIdx, whereFromIdx + wordCount)
    .join(" ")} → ${QUESTION_GUP.where_from.gup}`;

  if (answerInfo) {
    explanation += ` | respuesta: ${answerExplanation}`;
  }

  const alternatives = QUESTION_GUP.where_from.alternatives || [];
  const options = alternatives.length > 0
    ? [
        { gup: QUESTION_GUP.where_from.gup, explanation: QUESTION_GUP.where_from.gup },
        ...alternatives.map((alt) => ({ gup: alt, explanation: alt })),
      ]
    : undefined;

  return {
    detected: true,
    questionType: "where_from",
    gupOutput: QUESTION_GUP.where_from.gup,
    explanation,
    consumedIndices,
    answerInfo,
    options,
  };
}
