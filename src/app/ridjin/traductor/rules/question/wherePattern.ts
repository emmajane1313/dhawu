import { QuestionPatternResult, QuestionContext, AnswerInfo, AdditionalAnswer, QuestionSubjectInfo } from "./types";
import {
  validarFonologia,
  LANG_CONFIG,
  QUESTION_GUP,
  LOCATIVE_SUFFIX,
  determineHumanAssociativeSuffix,
  applyHumanAssociativeSuffix,
} from "../../constants";
import { findNounInfo } from "./questionHelpers";

export { findNounInfo };

function applyLocativeSuffix(word: string): string {
  return validarFonologia(word + LOCATIVE_SUFFIX);
}

export function detectWhereQuestionPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    whereTriggers,
    estarBeForms,
    questionSkipWords,
    thisWords,
    thatWords,
    definiteArticles,
    pluralArticles,
    connectors,
  } = LANG_CONFIG[mode];

  const whereIdx = lowerTokens.findIndex((t) => whereTriggers.includes(t));
  if (whereIdx === -1) return null;

  const beIdx = lowerTokens.findIndex(
    (t, i) => i > whereIdx && estarBeForms.includes(t)
  );

  const consumedIndices: number[] = [whereIdx];
  if (beIdx !== -1) consumedIndices.push(beIdx);

  let subjectGup: string | null = null;
  let subjectSource = "";
  let subjectNounInfo: { isPlural: boolean; isHuman?: boolean } | null = null;

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

  const startIdx = beIdx !== -1 ? beIdx + 1 : whereIdx + 1;
  for (let i = startIdx; i < tokensBeforeQuestion; i++) {
    const word = lowerTokens[i];
    if (questionSkipWords.includes(word)) {
      consumedIndices.push(i);
      continue;
    }

    const cleanWord = word.replace(/[,.\-;:!¡¿?]+$/, "");
    if (!cleanWord) continue;

    const nounInfo = findNounInfo(cleanWord, mode);
    if (nounInfo) {
      subjectGup = nounInfo.gupKey;
      subjectSource = tokens[i];
      subjectNounInfo = { isPlural: nounInfo.isPlural, isHuman: nounInfo.isHuman };
      consumedIndices.push(i);
      break;
    }

    subjectGup = cleanWord;
    subjectSource = tokens[i];
    subjectNounInfo = null;
    consumedIndices.push(i);
    break;
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
        const nounBaseGup = nounInfo?.gupKey || answerWord;
        const nounIsPlural = nounInfo?.isPlural || false;
        const isPlace = nounInfo?.isPlace;
        const isHuman = nounInfo?.isHuman ?? false;

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
          if (isPlace === true) {
            additionalBaseGup = nounBaseGup;
            additionalSuffix = "";
          } else if (isHuman === true) {
            const suffixes = determineHumanAssociativeSuffix(nounBaseGup);
            additionalBaseGup = applyHumanAssociativeSuffix(nounBaseGup, suffixes[0]);
            additionalSuffix = suffixes[0];
            if (suffixes.length > 1) {
              additionalAlternatives = suffixes.slice(1).map((s) => applyHumanAssociativeSuffix(nounBaseGup, s));
            }
          } else if (isWordUnknown) {
            const humanSuffixes = determineHumanAssociativeSuffix(nounBaseGup);
            additionalBaseGup = nounBaseGup;
            additionalSuffix = "";
            additionalAlternatives = [
              ...humanSuffixes.map((s) => applyHumanAssociativeSuffix(nounBaseGup, s)),
              applyLocativeSuffix(nounBaseGup),
            ];
          } else {
            additionalBaseGup = applyLocativeSuffix(nounBaseGup);
            additionalSuffix = LOCATIVE_SUFFIX;
          }
          additionalAnswers.push({
            baseGup: additionalBaseGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: additionalSuffix,
            isHuman,
            isPlace,
            suffixType: "locative",
            alternatives: additionalAlternatives,
            sourceWord: answerWord,
            explanation: `"${answerWord}" → ${additionalBaseGup}`,
          });
          continue;
        }

        if (isPlace === true) {
          answerExplanation = `${nounBaseGup} (lugar - sin sufijo)`;
          answerInfo = {
            baseGup: nounBaseGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: "",
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural: isPlural || nounIsPlural,
            isPlace: true,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
            suffixType: "locative",
          };
        } else if (isHuman === true) {
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
            suffixType: "locative",
          };
        } else if (isWordUnknown) {
          const humanSuffixes = determineHumanAssociativeSuffix(nounBaseGup);
          const humanOptions = humanSuffixes.map((s) => applyHumanAssociativeSuffix(nounBaseGup, s));
          const nonhumanOption = applyLocativeSuffix(nounBaseGup);
          answerExplanation = `${nounBaseGup} (palabra desconocida)`;
          answerInfo = {
            baseGup: nounBaseGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: "",
            alternatives: [...humanOptions, nonhumanOption],
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural: isPlural || nounIsPlural,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
            suffixType: "locative",
          };
        } else {
          const suffixedGup = applyLocativeSuffix(nounBaseGup);
          answerExplanation = `${nounBaseGup} + -${LOCATIVE_SUFFIX} = ${suffixedGup}`;
          answerInfo = {
            baseGup: suffixedGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: LOCATIVE_SUFFIX,
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural: isPlural || nounIsPlural,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
            suffixType: "locative",
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

  const gupParts: string[] = [QUESTION_GUP.where.gup];
  let explanation = `${tokens[whereIdx]} → ${QUESTION_GUP.where.gup}`;

  if (subjectGup) {
    explanation += `, ${subjectSource} → ${subjectGup}`;
  }

  if (answerInfo) {
    explanation += ` | respuesta: ${answerExplanation}`;
  }

  let subjectInfo: QuestionSubjectInfo | undefined;
  if (subjectGup) {
    subjectInfo = {
      gup: subjectGup,
      source: subjectSource,
      isPlural: subjectNounInfo?.isPlural,
      isHuman: subjectNounInfo?.isHuman,
      isKnownNoun: subjectNounInfo !== null,
    };
  }

  return {
    detected: true,
    questionType: "where",
    gupOutput: gupParts.join(" "),
    explanation,
    consumedIndices,
    answerInfo,
    hasExplicitSubject: !!subjectGup,
    subjectInfo,
  };
}
