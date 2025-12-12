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
} from "../../constants";
import { LEXICON } from "../../lexicon";
import { LanguageMode } from "@/app/components/types/components.type";

function findVerbGup(word: string, mode: LanguageMode): string | null {
  const normalized = word.toLowerCase();

  for (const [gupKey, entry] of Object.entries(LEXICON.verbs)) {
    const verbFormsList = entry[mode];
    if (!verbFormsList) continue;

    for (const verbForms of verbFormsList) {
      if (verbForms.infinitive.toLowerCase() === normalized) {
        return gupKey;
      }
      if (verbForms.gerund.toLowerCase() === normalized) {
        return gupKey;
      }
      for (const conjugated of verbForms.presentIndicative) {
        if (conjugated.toLowerCase() === normalized) {
          return gupKey;
        }
      }
      for (const conjugated of verbForms.preterite) {
        if (conjugated.toLowerCase() === normalized) {
          return gupKey;
        }
      }
      if (verbForms.future) {
        for (const conjugated of verbForms.future) {
          if (conjugated.toLowerCase() === normalized) {
            return gupKey;
          }
        }
      }
    }
  }
  return null;
}

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

export function detectWhatWillDoPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    whatTriggers,
    connectors,
    questionSkipWords,
    thisWords,
    thatWords,
    definiteArticles,
    pluralArticles,
    pronounTriggers,
  } = LANG_CONFIG[mode];
  const whatIdx = lowerTokens.findIndex((t) => whatTriggers.includes(t));
  if (whatIdx === -1) return null;

  const consumedIndices: number[] = [whatIdx];
  const { detectFutureAction } = LANG_CONFIG[mode];
  const futureResult = detectFutureAction(tokens);
  if (!futureResult) return null;

  const { personNumber } = futureResult;
  consumedIndices.push(...futureResult.indices);

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

  const pronounOptions = getPronounOptions(personNumber);
  const primaryPronoun =
    pronounOptions[0]?.gup || SUBJECT_PRONOUNS_GUP[personNumber][0];

  const gupOutput = `${QUESTION_GUP.how.gup} ${primaryPronoun} dhu?`;

  let explanation = `${tokens[whatIdx]} + ${LANG_CONFIG[mode].willdo} → nhaltjan ${primaryPronoun} dhu (${LANG_CONFIG[mode].hara})`;

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

        const answerPersonNumber = pronounTriggers?.[answerWord];
        const verbGup = findVerbGup(answerWord, mode);

        let finalGup: string;
        let rawBase: string;
        let allPronounForms: string[] | undefined;
        let isPronoun = false;

        if (answerPersonNumber) {
          const pronounForms = SUBJECT_PRONOUNS_GUP[answerPersonNumber];
          finalGup = pronounForms[0];
          rawBase = finalGup;
          isPronoun = true;
          if (pronounForms.length > 1) {
            allPronounForms = pronounForms;
          }
        } else {
          finalGup = verbGup || answerWord;
          rawBase = finalGup;
        }

        if (answerInfo) {
          const addExplanation = isPronoun
            ? `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].pronoun})`
            : `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].verb})`;
          additionalAnswers.push({
            baseGup: finalGup,
            rawBaseGup: rawBase,
            suffixType: "none",
            alternatives: allPronounForms && allPronounForms.length > 1
              ? allPronounForms.slice(1)
              : undefined,
            sourceWord: answerWord,
            explanation: addExplanation,
          });
          continue;
        }

        answerExplanation = isPronoun
          ? `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].pronoun})`
          : verbGup
            ? `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].verb})`
            : `${answerWord} (${LANG_CONFIG[mode].verb})`;

        answerInfo = {
          baseGup: finalGup,
          rawBaseGup: rawBase,
          alternatives: allPronounForms && allPronounForms.length > 1
            ? allPronounForms.slice(1)
            : undefined,
          hasDefiniteArticle: determinerType !== null,
          determinerType,
          isPlural,
          baseExplanation: answerExplanation,
          answerTokens: answerWords,
          suffixType: "none",
        };
      }

      if (answerInfo) {
        if (additionalAnswers.length > 0) {
          answerInfo.additionalAnswers = additionalAnswers;
        }
        if (answerConsumedIndices.length > 0) {
          answerInfo.answerConsumedIndices = answerConsumedIndices;
        }
        explanation += ` | respuesta: ${answerExplanation}`;
      }
    }
  }

  return {
    detected: true,
    questionType: "how",
    gupOutput,
    explanation,
    consumedIndices,
    answerInfo,
    isComplexPattern: true,
    options:
      pronounOptions.length > 1
        ? pronounOptions.map((opt) => ({
            gup: `${QUESTION_GUP.how.gup} ${opt.gup} dhu?`,
            explanation: opt.explanation,
          }))
        : undefined,
  };
}
