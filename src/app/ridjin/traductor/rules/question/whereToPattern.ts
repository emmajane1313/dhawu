import { QuestionPatternResult, QuestionContext, AnswerInfo, AdditionalAnswer } from "./types";
import {
  validarFonologia,
  determineHumanAssociativeSuffix,
  applyHumanAssociativeSuffix,
  LANG_CONFIG,
  QUESTION_GUP,
  ALLATIVE_SUFFIX,
} from "../../constants";
import { findNounInfo } from "./questionHelpers";

function applyAllativeSuffix(word: string): string {
  return validarFonologia(word + ALLATIVE_SUFFIX);
}

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

export function detectWhereToPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    whereToTriggers,
    questionSkipWords,
    thisWords,
    thatWords,
    definiteArticles,
    pluralArticles,
    connectors,
  } = LANG_CONFIG[mode];

  const triggerMatch = findMultiWordTrigger(tokens, whereToTriggers);
  if (!triggerMatch) return null;

  const { idx: whereToIdx, wordCount } = triggerMatch;
  const consumedIndices: number[] = [];
  for (let i = 0; i < wordCount; i++) {
    consumedIndices.push(whereToIdx + i);
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
          let additionalBaseGup = nounBaseGup;
          let additionalSuffix: string | undefined;
          let additionalAlternatives: string[] | undefined;
          if (isPlaceNoun === true) {
            additionalBaseGup = applyAllativeSuffix(nounBaseGup);
            additionalSuffix = ALLATIVE_SUFFIX;
          } else if (isHumanNoun === true) {
            const suffixes = determineHumanAssociativeSuffix(nounBaseGup);
            additionalBaseGup = applyHumanAssociativeSuffix(nounBaseGup, suffixes[0]);
            additionalSuffix = suffixes[0];
            if (suffixes.length > 1) {
              additionalAlternatives = suffixes.slice(1).map((s) => applyHumanAssociativeSuffix(nounBaseGup, s));
            }
          } else if (isWordUnknown) {
            const humanSuffixes = determineHumanAssociativeSuffix(nounBaseGup);
            additionalBaseGup = applyAllativeSuffix(nounBaseGup);
            additionalSuffix = ALLATIVE_SUFFIX;
            additionalAlternatives = humanSuffixes.map((s) => applyHumanAssociativeSuffix(nounBaseGup, s));
          } else {
            additionalBaseGup = applyAllativeSuffix(nounBaseGup);
            additionalSuffix = ALLATIVE_SUFFIX;
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
          const suffixedGup = applyAllativeSuffix(nounBaseGup);
          answerExplanation = `${nounBaseGup} + -${ALLATIVE_SUFFIX} = ${suffixedGup}`;
          answerInfo = {
            baseGup: suffixedGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: ALLATIVE_SUFFIX,
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural: isPlural || nounIsPlural,
            isPlace: isPlaceNoun,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
          };
        } else if (isHumanNoun === true) {
          const suffixes = determineHumanAssociativeSuffix(nounBaseGup);
          const suffixedOptions = suffixes.map((s) => applyHumanAssociativeSuffix(nounBaseGup, s));
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
          const humanSuffixes = determineHumanAssociativeSuffix(nounBaseGup);
          const [firstSuffix, ...restSuffixes] = humanSuffixes;
          const firstHumanOption = applyHumanAssociativeSuffix(nounBaseGup, firstSuffix);
          const restHumanOptions = restSuffixes.map((s) => applyHumanAssociativeSuffix(nounBaseGup, s));
          const nonhumanOption = applyAllativeSuffix(nounBaseGup);
          answerExplanation = `${nounBaseGup} + -${firstSuffix} = ${firstHumanOption} (palabra desconocida)`;
          answerInfo = {
            baseGup: firstHumanOption,
            rawBaseGup: nounBaseGup,
            appliedSuffix: firstSuffix,
            alternatives: [...restHumanOptions, nonhumanOption],
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural: isPlural || nounIsPlural,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
          };
        } else {
          const suffixedGup = applyAllativeSuffix(nounBaseGup);
          answerExplanation = `${nounBaseGup} + -${ALLATIVE_SUFFIX} = ${suffixedGup}`;
          answerInfo = {
            baseGup: suffixedGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: ALLATIVE_SUFFIX,
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
    .slice(whereToIdx, whereToIdx + wordCount)
    .join(" ")} → ${QUESTION_GUP.where_to.gup}`;

  if (answerInfo) {
    explanation += ` | respuesta: ${answerExplanation}`;
  }

  const alternatives = QUESTION_GUP.where_to.alternatives || [];
  const options = alternatives.length > 0
    ? [
        { gup: QUESTION_GUP.where_to.gup, explanation: QUESTION_GUP.where_to.gup },
        ...alternatives.map((alt) => ({ gup: alt, explanation: alt })),
      ]
    : undefined;

  return {
    detected: true,
    questionType: "where_to",
    gupOutput: QUESTION_GUP.where_to.gup,
    explanation,
    consumedIndices,
    answerInfo,
    options,
  };
}

export function detectToWhomPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    toWhomTriggers,
    questionSkipWords,
    thisWords,
    thatWords,
    definiteArticles,
    pluralArticles,
    connectors,
  } = LANG_CONFIG[mode];

  const triggerMatch = findMultiWordTrigger(tokens, toWhomTriggers);
  if (!triggerMatch) return null;

  const { idx: toWhomIdx, wordCount } = triggerMatch;
  const consumedIndices: number[] = [];
  for (let i = 0; i < wordCount; i++) {
    consumedIndices.push(toWhomIdx + i);
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
  const usedAnswerIndices2 = new Set<number>();
  const additionalAnswers: AdditionalAnswer[] = [];
  const answerConsumedIndices: number[] = [];

  if (questionMarkPos !== -1) {
    const afterQuestion = originalText.slice(questionMarkPos + 1).trim();
    if (afterQuestion) {
      const answerWords = afterQuestion.split(/\s+/);
      let determinerType: "this" | "that" | "definite" | null = null;
      let isPlural = false;

      for (const rawWord of answerWords) {
        const answerWord = rawWord.toLowerCase().replace(/[,.\-;:!¡¿]+$/, "");
        if (!answerWord) continue;

        if (thisWords.includes(answerWord)) {
          determinerType = "this";
          const articleIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices2.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (articleIdx !== -1) {
            consumedIndices.push(articleIdx);
            usedAnswerIndices2.add(articleIdx);
          }
          continue;
        }

        if (thatWords.includes(answerWord)) {
          determinerType = "that";
          const articleIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices2.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (articleIdx !== -1) {
            consumedIndices.push(articleIdx);
            usedAnswerIndices2.add(articleIdx);
          }
          continue;
        }

        if (connectors.includes(answerWord)) {
          const connectorIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices2.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (connectorIdx !== -1) {
            consumedIndices.push(connectorIdx);
            answerConsumedIndices.push(connectorIdx);
            usedAnswerIndices2.add(connectorIdx);
          }
          continue;
        }

        if (definiteArticles.includes(answerWord)) {
          determinerType = "definite";
          if (pluralArticles.includes(answerWord)) isPlural = true;
          const articleIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices2.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (articleIdx !== -1) {
            consumedIndices.push(articleIdx);
            usedAnswerIndices2.add(articleIdx);
          }
          continue;
        }

        if (questionSkipWords.includes(answerWord)) {
          const skipIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices2.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (skipIdx !== -1) {
            consumedIndices.push(skipIdx);
            usedAnswerIndices2.add(skipIdx);
          }
          continue;
        }

        const nounInfo = findNounInfo(answerWord, mode);
        const nounBaseGup = nounInfo ? nounInfo.gupKey : answerWord;
        const nounIsPlural = nounInfo?.isPlural || false;
        const suffixes = determineHumanAssociativeSuffix(nounBaseGup);
        const suffixedOptions = suffixes.map((s) => applyHumanAssociativeSuffix(nounBaseGup, s));
        const suffixedGup = suffixedOptions[0];

        const answerIdx = lowerTokens.findIndex(
          (t, i) =>
            i >= tokensBeforeQuestion &&
            !usedAnswerIndices2.has(i) &&
            t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
        );
        if (answerIdx !== -1) {
          consumedIndices.push(answerIdx);
          usedAnswerIndices2.add(answerIdx);
        }

        if (answerInfo) {
          additionalAnswers.push({
            baseGup: suffixedGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: suffixes[0],
            isHuman: true,
            alternatives: suffixes.length > 1
              ? suffixes.slice(1).map((s) => applyHumanAssociativeSuffix(nounBaseGup, s))
              : undefined,
            sourceWord: answerWord,
            explanation: `"${answerWord}" → ${suffixedGup}`,
          });
          continue;
        }

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
    .slice(toWhomIdx, toWhomIdx + wordCount)
    .join(" ")} → ${QUESTION_GUP.to_whom.gup}`;

  if (answerInfo) {
    explanation += ` | respuesta: ${answerExplanation}`;
  }

  return {
    detected: true,
    questionType: "to_whom",
    gupOutput: QUESTION_GUP.to_whom.gup,
    explanation,
    consumedIndices,
    answerInfo,
  };
}
