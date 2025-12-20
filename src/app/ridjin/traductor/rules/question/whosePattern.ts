import {
  QuestionPatternResult,
  QuestionContext,
  AnswerInfo,
  AdditionalAnswer,
  QuestionSubjectInfo,
} from "./types";
import {
  LANG_CONFIG,
  QUESTION_GUP,
  POSSESSIVE_PRONOUNS_GUP,
} from "../../constants";
import {
  determinePossessiveSuffix,
  applyPossessiveSuffix,
} from "../possession";
import { findNounInfo, findNounGup } from "./questionHelpers";
import { LanguageMode } from "@/app/components/types/components.type";

function getDemonstrative(
  word: string,
  thisWords: string[],
  thatWords: string[]
): "dhuwala" | "dhuwali" | null {
  const lower = word.toLowerCase();
  if (thisWords.includes(lower)) return "dhuwala";
  if (thatWords.includes(lower)) return "dhuwali";
  return null;
}

function detectWhoseTrigger(
  tokens: string[],
  mode: LanguageMode
): { idx: number; length: number } | null {
  const { whoseTriggers } = LANG_CONFIG[mode];
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  for (const trigger of whoseTriggers) {
    const triggerParts = trigger.split(" ");
    if (triggerParts.length > 1) {
      for (let i = 0; i <= lowerTokens.length - triggerParts.length; i++) {
        let matches = true;
        for (let j = 0; j < triggerParts.length; j++) {
          if (lowerTokens[i + j] !== triggerParts[j]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          return { idx: i, length: triggerParts.length };
        }
      }
    } else {
      const idx = lowerTokens.indexOf(trigger);
      if (idx !== -1) {
        return { idx, length: 1 };
      }
    }
  }
  return null;
}

export function detectWhoseQuestionPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    whoseSkipWords,
    thisWords,
    thatWords,
    connectors,
    definiteArticles,
    pluralArticles,
    questionSkipWords,
    possessiveTriggers,
    dualMarkers,
  } = LANG_CONFIG[mode];
  const whoseTrigger = detectWhoseTrigger(tokens, mode);
  if (!whoseTrigger) return null;

  const consumedIndices: number[] = [];
  for (let i = 0; i < whoseTrigger.length; i++) {
    consumedIndices.push(whoseTrigger.idx + i);
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

  let demonstrative: "dhuwala" | "dhuwali" | null = null;
  let thingGup: string | null = null;
  let thingSource = "";
  let thingNounInfo: { isPlural: boolean; isHuman?: boolean } | null = null;

  const startIdx = whoseTrigger.idx + whoseTrigger.length;
  for (let i = startIdx; i < tokensBeforeQuestion; i++) {
    const word = lowerTokens[i];

    if (word === "?" || word === "¿") continue;
    if (whoseSkipWords.includes(word)) {
      consumedIndices.push(i);
      continue;
    }

    const demo = getDemonstrative(word, thisWords, thatWords);
    if (demo) {
      demonstrative = demo;
      consumedIndices.push(i);
      continue;
    }

    if (!thingGup) {
      const nounInfo = findNounInfo(word, mode);
      if (nounInfo) {
        thingGup = nounInfo.gupKey;
        thingSource = tokens[i];
        thingNounInfo = {
          isPlural: nounInfo.isPlural,
          isHuman: nounInfo.isHuman,
        };
        consumedIndices.push(i);
      } else {
        thingGup = word;
        thingSource = tokens[i];
        thingNounInfo = null;
        consumedIndices.push(i);
      }
    }
  }

  const gupParts = [QUESTION_GUP.whose.gup];
  if (demonstrative) {
    gupParts.push(demonstrative);
  }
  gupParts.push("?");

  const { thisLabelExplanation, thatLabelExplanation } = LANG_CONFIG[mode];
  const whoseWord = QUESTION_GUP.whose[mode];

  let explanation = `${whoseWord} → ${QUESTION_GUP.whose.gup}`;
  if (demonstrative) {
    const demoLabel =
      demonstrative === "dhuwala" ? thisLabelExplanation : thatLabelExplanation;
    explanation += `, ${demoLabel} → ${demonstrative}`;
  }
  if (thingGup && thingSource) {
    explanation += `, ${thingSource} → ${thingGup}`;
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

        const personNumber = possessiveTriggers?.[answerWord];

        let finalGup: string;
        let baseGup: string;
        let suffix: string | null = null;
        let isPronoun = false;
        let allSuffixes: string[] | undefined;
        let allPronounForms: string[] | undefined;

        if (personNumber) {
          const pronounForms = POSSESSIVE_PRONOUNS_GUP[personNumber];
          finalGup = pronounForms[0];
          baseGup = finalGup;
          isPronoun = true;
          if (pronounForms.length > 1) {
            allPronounForms = pronounForms;
          }
        } else {
          const nounGup = findNounGup(answerWord, mode);
          baseGup = nounGup || answerWord;
          const suffixResult = determinePossessiveSuffix(baseGup, mode);
          const suffixes = suffixResult.suffixes;
          finalGup = applyPossessiveSuffix(baseGup, suffixes[0]);
          suffix = suffixes[0];
          if (suffixes.length > 1) {
            allSuffixes = suffixes;
          }
        }

        if (answerInfo) {
          const addExplanation = isPronoun
            ? `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].pronoun})`
            : `${baseGup} + -${suffix} = ${finalGup} (${LANG_CONFIG[mode].possessive})`;
          additionalAnswers.push({
            baseGup: finalGup,
            rawBaseGup: baseGup,
            appliedSuffix: suffix || undefined,
            suffixType: "possessive",
            alternatives:
              isPronoun && allPronounForms && allPronounForms.length > 1
                ? allPronounForms.slice(1)
                : allSuffixes && allSuffixes.length > 1
                ? allSuffixes
                    .slice(1)
                    .map((s) =>
                      applyPossessiveSuffix(
                        baseGup,
                        s as "wa" | "wu" | "ku" | "gu"
                      )
                    )
                : undefined,
            sourceWord: answerWord,
            explanation: addExplanation,
          });
          continue;
        }

        answerExplanation = isPronoun
          ? `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].proPosessive})`
          : suffix
          ? `${baseGup} + -${suffix} = ${finalGup} (${LANG_CONFIG[mode].possessive})`
          : `${baseGup} (${LANG_CONFIG[mode].possessive})`;

        answerInfo = {
          baseGup: finalGup,
          rawBaseGup: baseGup,
          appliedSuffix: suffix || undefined,
          allSuffixes,
          alternatives:
            isPronoun && allPronounForms && allPronounForms.length > 1
              ? allPronounForms.slice(1)
              : allSuffixes && allSuffixes.length > 1
              ? allSuffixes
                  .slice(1)
                  .map((s) =>
                    applyPossessiveSuffix(
                      baseGup,
                      s as "wa" | "wu" | "ku" | "gu"
                    )
                  )
              : undefined,
          hasDefiniteArticle: determinerType !== null,
          determinerType,
          isPlural,
          isDual,
          baseExplanation: answerExplanation,
          answerTokens: answerWords,
          suffixType: "possessive",
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

  let subjectInfo: QuestionSubjectInfo | undefined;
  if (thingGup) {
    subjectInfo = {
      gup: thingGup,
      source: thingSource,
      isPlural: thingNounInfo?.isPlural,
      isHuman: thingNounInfo?.isHuman,
      isKnownNoun: thingNounInfo !== null,
    };
  }

  return {
    detected: true,
    questionType: "whose",
    gupOutput: gupParts.join(" "),
    explanation,
    consumedIndices,
    answerInfo,
    hasExplicitSubject: !!thingGup,
    subjectInfo,
  };
}
