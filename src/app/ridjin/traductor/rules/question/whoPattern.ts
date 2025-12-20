import { QuestionPatternResult, QuestionContext, VerbMatch, AnswerInfo, AdditionalAnswer, QuestionSubjectInfo, QuestionPatternOption } from "./types";
import { LANG_CONFIG, QUESTION_GUP, SUBJECT_PRONOUNS_GUP } from "../../constants";
import { applyErgativeSuffix } from "../subject";
import { findNounInfo, findVerbGupWithPerson, applyNha } from "./questionHelpers";

export function detectWhoQuestionPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    skipWordsWho,
    whoTriggers,
    connectors,
    thisWords,
    thatWords,
    definiteArticles,
    pluralArticles,
    questionSkipWords,
    dualMarkers,
  } = LANG_CONFIG[mode];

  const whoIdx = lowerTokens.findIndex((t) => whoTriggers.includes(t));
  if (whoIdx === -1) return null;

  const consumedIndices: number[] = [whoIdx];

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

  let verbMatch: VerbMatch | null = null;
  let objectGup: string | null = null;
  let objectSource = "";
  let objectNounInfo: { isPlural?: boolean; isHuman?: boolean; isKnown: boolean } | null = null;
  let nextNounIsDirectObject = false;

  for (let i = whoIdx + 1; i < tokensBeforeQuestion; i++) {
    const word = lowerTokens[i];

    if (word === "?" || word === "¿") continue;

    if (LANG_CONFIG[mode].contractionWords.includes(word) && !objectGup) {
      nextNounIsDirectObject = true;
      consumedIndices.push(i);
      continue;
    }

    if (skipWordsWho.includes(word)) {
      consumedIndices.push(i);
      continue;
    }

    if (nextNounIsDirectObject && !objectGup) {
      const nounInfo = findNounInfo(word, mode);
      if (nounInfo) {
        objectGup = nounInfo.gupKey;
        objectSource = tokens[i];
        objectNounInfo = { isPlural: nounInfo.isPlural, isHuman: nounInfo.isHuman, isKnown: true };
      } else {
        objectGup = word;
        objectSource = tokens[i];
        objectNounInfo = { isKnown: false };
      }
      consumedIndices.push(i);
      nextNounIsDirectObject = false;
      continue;
    }

    const verb = findVerbGupWithPerson(word, mode);
    if (verb) {
      verbMatch = verb;
      consumedIndices.push(i);
      break;
    }

    if (!objectGup) {
      const nounInfo = findNounInfo(word, mode);
      if (nounInfo) {
        objectGup = nounInfo.gupKey;
        objectSource = tokens[i];
        objectNounInfo = { isPlural: nounInfo.isPlural, isHuman: nounInfo.isHuman, isKnown: true };
        consumedIndices.push(i);
      } else {
        objectGup = word;
        objectSource = tokens[i];
        objectNounInfo = { isKnown: false };
        consumedIndices.push(i);
      }
    }
  }

  if (!verbMatch) {
    return {
      detected: true,
      questionType: "whom",
      gupOutput: `${QUESTION_GUP.whom.gup}?`,
      explanation: `${tokens[whoIdx]} → ${QUESTION_GUP.whom.gup} (${QUESTION_GUP.whom[mode]})`,
      consumedIndices,
    };
  }

  const gupParts = [QUESTION_GUP.whom.gup];

  let objectGupFinal = objectGup;
  let objectOptions: QuestionPatternOption[] | undefined;
  const humanObjectLabel = LANG_CONFIG[mode].humanObject;
  const nonHumanObjectLabel = LANG_CONFIG[mode].nonHumanObject;

  if (objectGup && objectNounInfo && verbMatch.isTransitive) {
    if (objectNounInfo.isKnown) {
      if (objectNounInfo.isHuman) {
        objectGupFinal = applyNha(objectGup);
      }
    } else {
      const withNha = applyNha(objectGup);
      objectGupFinal = withNha;
    }
  }

  if (objectGupFinal) {
    gupParts.push(objectGupFinal);
  }
  gupParts.push(verbMatch.gup);
  gupParts.push("?");

  if (objectGup && objectNounInfo && !objectNounInfo.isKnown && verbMatch.isTransitive) {
    const gupPartsAlt = [QUESTION_GUP.whom.gup];
    gupPartsAlt.push(objectGup);
    gupPartsAlt.push(verbMatch.gup);
    gupPartsAlt.push("?");
    objectOptions = [
      { gup: gupPartsAlt.join(" "), explanation: `${objectGup} (${nonHumanObjectLabel})` },
    ];
  }

  let explanation = `${tokens[whoIdx]} → ${QUESTION_GUP.whom.gup}`;
  if (objectGupFinal && objectSource) {
    if (objectOptions) {
      explanation += `, ${objectSource} → ${objectGupFinal} (${humanObjectLabel}) / ${objectGup} (${nonHumanObjectLabel})`;
    } else if (objectNounInfo?.isHuman) {
      explanation += `, ${objectSource} → ${objectGupFinal} (+nha ${humanObjectLabel})`;
    } else {
      explanation += `, ${objectSource} → ${objectGupFinal}`;
    }
  }
  explanation += `, ${verbMatch.source} → ${verbMatch.gup}`;

  const { transitiveExplanation, intransitiveExplanation } = LANG_CONFIG[mode];
  if (verbMatch.isTransitive) {
    explanation += ` (${transitiveExplanation})`;
  } else {
    explanation += ` (${intransitiveExplanation})`;
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

        const pronounTriggers = LANG_CONFIG[mode].pronounTriggers;
        const personNumber = pronounTriggers?.[answerWord];

        let finalGup: string;
        let baseGup: string;
        let suffix: string | null = null;
        let isPronoun = false;
        let allPronounForms: string[] | undefined;

        if (personNumber) {
          const pronounForms = SUBJECT_PRONOUNS_GUP[personNumber];
          finalGup = pronounForms[0];
          baseGup = finalGup;
          isPronoun = true;
          if (pronounForms.length > 1) {
            allPronounForms = pronounForms;
          }
        } else {
          const nounInfo = findNounInfo(answerWord, mode);
          const isWordUnknown = nounInfo === null;
          baseGup = nounInfo?.gupKey || answerWord;

          if (verbMatch?.isTransitive) {
            if (isWordUnknown) {
              const ergResult = applyErgativeSuffix(baseGup);
              finalGup = ergResult.suffixed;
              suffix = ergResult.suffix;
              allPronounForms = [finalGup, baseGup];
            } else if (nounInfo?.isHuman === true) {
              const ergResult = applyErgativeSuffix(baseGup);
              finalGup = ergResult.suffixed;
              suffix = ergResult.suffix;
            } else {
              finalGup = baseGup;
              suffix = null;
            }
          } else {
            finalGup = baseGup;
            suffix = null;
          }
        }

        if (answerInfo) {
          const addExplanation = isPronoun
            ? `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].pronoun})`
            : suffix
              ? `${baseGup} + -${suffix} = ${finalGup} (${LANG_CONFIG[mode].ergative})`
              : `${baseGup} (${LANG_CONFIG[mode].subjectLabel})`;
          additionalAnswers.push({
            baseGup: finalGup,
            rawBaseGup: baseGup,
            appliedSuffix: suffix || undefined,
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
          : suffix
            ? `${baseGup} + -${suffix} = ${finalGup} (${LANG_CONFIG[mode].ergative})`
            : `${baseGup} (${LANG_CONFIG[mode].subjectLabel})`;

        answerInfo = {
          baseGup: finalGup,
          rawBaseGup: baseGup,
          appliedSuffix: suffix || undefined,
          alternatives: allPronounForms && allPronounForms.length > 1
            ? allPronounForms.slice(1)
            : undefined,
          hasDefiniteArticle: determinerType !== null,
          determinerType,
          isPlural,
          isDual,
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

  let subjectInfo: QuestionSubjectInfo | undefined;
  if (objectGup) {
    subjectInfo = {
      gup: objectGup,
      source: objectSource,
      isPlural: objectNounInfo?.isPlural,
      isHuman: objectNounInfo?.isHuman,
      isKnownNoun: objectNounInfo !== null,
    };
  }

  return {
    detected: true,
    questionType: "whom",
    gupOutput: gupParts.join(" "),
    explanation,
    consumedIndices,
    options: objectOptions,
    answerInfo,
    hasExplicitSubject: !!objectGup,
    subjectInfo,
    isComplexPattern: true,
  };
}
