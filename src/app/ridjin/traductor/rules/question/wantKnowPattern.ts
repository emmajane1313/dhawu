import {
  QuestionPatternResult,
  QuestionPatternOption,
  QuestionContext,
  AnswerInfo,
  AdditionalAnswer,
} from "./types";
import {
  LANG_CONFIG,
  PersonNumber,
  SUBJECT_PRONOUNS_GUP,
  QUESTION_GUP,
  determineDjalSuffix,
  applyDjalSuffix,
} from "../../constants";
import { findNounInfo } from "./wherePattern";

function expandPronounForms(
  personNumber: PersonNumber,
  explanation: string
): QuestionPatternOption[] {
  const forms = SUBJECT_PRONOUNS_GUP[personNumber];
  if (forms.length === 1) {
    return [{ gup: forms[0], explanation }];
  }
  return forms.map((f) => ({ gup: f, explanation: `${explanation} (${f})` }));
}

function getPronounOptions(
  personNumber: PersonNumber
): QuestionPatternOption[] {
  const forms = SUBJECT_PRONOUNS_GUP[personNumber];
  if (!forms) return [];

  if (personNumber === "1+2_Plur" || personNumber === "1+3_Plur") {
    return [
      ...expandPronounForms("1+2_Dual", "nosotros dos (inclusivo)"),
      ...expandPronounForms("1+3_Dual", "nosotros dos (exclusivo)"),
      ...expandPronounForms("1+2_Plur", "nosotros 3+ (inclusivo)"),
      ...expandPronounForms("1+3_Plur", "nosotros 3+ (exclusivo)"),
    ];
  }

  if (personNumber === "2_Plur") {
    return [
      ...expandPronounForms("2_Dual", "ustedes dos"),
      ...expandPronounForms("2_Plur", "ustedes 3+"),
    ];
  }

  if (personNumber === "3_Plur") {
    return [
      ...expandPronounForms("3_Dual", "ellos dos"),
      ...expandPronounForms("3_Plur", "ellos 3+"),
    ];
  }

  return forms.map((f) => ({ gup: f, explanation: f }));
}

export function detectWantKnowPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const { whatTriggers } = LANG_CONFIG[mode];
  const whatIdx = lowerTokens.findIndex((t) => whatTriggers.includes(t));
  if (whatIdx === -1) return null;

  const consumedIndices: number[] = [whatIdx];
  const { detectWantKnow } = LANG_CONFIG[mode];
  const wantKnowResult = detectWantKnow(tokens);
  if (!wantKnowResult) return null;

  const { personNumber, verbType } = wantKnowResult;
  consumedIndices.push(...wantKnowResult.indices);

  const pronounOptions = getPronounOptions(personNumber);
  const primaryPronoun =
    pronounOptions[0]?.gup || SUBJECT_PRONOUNS_GUP[personNumber][0];
  const questionWord = QUESTION_GUP.what_purpose.gup;

  const gupOutput = `${questionWord} ${primaryPronoun} ${verbType}?`;

  const { wantLabelExplanation, knowLabelExplanation } = LANG_CONFIG[mode];
  const verbLabel = verbType === "djäl" ? wantLabelExplanation : knowLabelExplanation;
  let explanation = `${tokens[whatIdx]} + ${verbLabel} → ${questionWord} ${primaryPronoun} ${verbType}`;

  let answerInfo: AnswerInfo | undefined;
  const questionMarkPos = originalText.indexOf("?");
  const {
    thisWords,
    thatWords,
    dualMarkers,
    definiteArticles,
    pluralArticles,
    questionSkipWords,
    connectors,
  } = LANG_CONFIG[mode];

  let tokensBeforeQuestion = tokens.length;
  if (questionMarkPos !== -1) {
    const textBeforeQuestion = originalText.slice(0, questionMarkPos);
    const wordsBeforeQuestion = textBeforeQuestion
      .replace(/[!¡¿.;:()"""'']/g, "")
      .split(/[\s,]+/)
      .filter((w) => w.length > 0);
    tokensBeforeQuestion = wordsBeforeQuestion.length;
  }

  const usedAnswerIndices = new Set<number>();
  const additionalAnswers: AdditionalAnswer[] = [];
  const answerConsumedIndices: number[] = [];

  if (questionMarkPos !== -1) {
    const afterQuestion = originalText.slice(questionMarkPos + 1).trim();
    if (afterQuestion) {
      const answerWords = afterQuestion.split(/\s+/);
      let determinerType: "this" | "that" | "definite" | null = null;
      let isPlural = false;
      let isDual = false;

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

        if (dualMarkers.includes(answerWord)) {
          isDual = true;
          const dualIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (dualIdx !== -1) {
            consumedIndices.push(dualIdx);
            usedAnswerIndices.add(dualIdx);
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
        const nounBaseGup = nounInfo?.gupKey || answerWord;
        const nounIsPlural = nounInfo?.isPlural || false;
        const suffixResult = determineDjalSuffix(nounBaseGup);
        const suffix = suffixResult.suffixes[0];
        const suffixedGup = applyDjalSuffix(nounBaseGup, suffix);

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
          additionalAnswers.push({
            baseGup: suffixedGup,
            rawBaseGup: nounBaseGup,
            appliedSuffix: suffix,
            suffixType: "djal",
            alternatives: suffixResult.suffixes.length > 1
              ? suffixResult.suffixes.slice(1).map((s) => applyDjalSuffix(nounBaseGup, s))
              : undefined,
            sourceWord: answerWord,
            explanation: `"${answerWord}" → ${suffixedGup}`,
          });
          continue;
        }

        const answerExplanation = `${nounBaseGup} + -${suffix} = ${suffixedGup}`;
        explanation += ` | respuesta: ${answerExplanation}`;

        answerInfo = {
          baseGup: suffixedGup,
          rawBaseGup: nounBaseGup,
          appliedSuffix: suffix,
          allSuffixes: suffixResult.suffixes.length > 1 ? suffixResult.suffixes : undefined,
          alternatives: suffixResult.suffixes.length > 1
            ? suffixResult.suffixes.map((s) => applyDjalSuffix(nounBaseGup, s))
            : undefined,
          hasDefiniteArticle: determinerType !== null,
          determinerType,
          isPlural: isPlural || nounIsPlural,
          isDual,
          baseExplanation: answerExplanation,
          answerTokens: answerWords,
          suffixType: "djal",
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

  return {
    detected: true,
    questionType: "what_purpose",
    gupOutput,
    explanation,
    consumedIndices,
    answerInfo,
    isComplexPattern: true,
    options:
      pronounOptions.length > 1
        ? pronounOptions.map((opt) => ({
            gup: `${questionWord} ${opt.gup} ${verbType}?`,
            explanation: opt.explanation,
          }))
        : undefined,
  };
}
