import { LanguageMode } from "@/app/components/types/components.type";
import { QuestionPatternResult, QuestionContext, AnswerInfo, AdditionalAnswer, QuestionPatternOption } from "./types";
import { LANG_CONFIG, QUESTION_GUP, POSSESSIVE_PRONOUNS_GUP, PersonNumber, SUBJECT_PRONOUNS_GUP } from "../../constants";
import { determinePossessiveSuffix, applyPossessiveSuffix } from "../possession";
import { findVerbGupWithPerson, findNounGup, findNounInfo, VerbMatchWithPerson, applyNha } from "./questionHelpers";

function detectWhomForTrigger(
  tokens: string[],
  mode: LanguageMode
): { idx: number; length: number } | null {
  const { whomForTriggers } = LANG_CONFIG[mode];
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  for (const trigger of whomForTriggers) {
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

export function detectWhomForQuestionPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    connectors,
    definiteArticles,
    pluralArticles,
    questionSkipWords,
    purposePronounTriggers,
    thisWords,
    thatWords,
    dualMarkers,
  } = LANG_CONFIG[mode];

  const whomForTrigger = detectWhomForTrigger(tokens, mode);
  if (!whomForTrigger) return null;

  const consumedIndices: number[] = [];
  for (let i = 0; i < whomForTrigger.length; i++) {
    consumedIndices.push(whomForTrigger.idx + i);
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

  let verbMatch: VerbMatchWithPerson | null = null;
  let objectGup: string | null = null;
  let objectSource = "";
  let objectNounInfo: { isPlural?: boolean; isHuman?: boolean; isKnown: boolean } | null = null;
  let explicitSubjectGup: string | null = null;
  let explicitSubjectSource: string | null = null;
  let nextNounIsDirectObject = false;
  const { pronounTriggers } = LANG_CONFIG[mode];

  const startIdx = whomForTrigger.idx + whomForTrigger.length;
  for (let i = startIdx; i < tokensBeforeQuestion; i++) {
    const word = lowerTokens[i];
    if (word === "?" || word === "¿") continue;

    if (LANG_CONFIG[mode].contractionWords.includes(word) && !objectGup) {
      nextNounIsDirectObject = true;
      consumedIndices.push(i);
      continue;
    }

    if (questionSkipWords.includes(word)) {
      consumedIndices.push(i);
      continue;
    }
    if (definiteArticles.includes(word)) {
      consumedIndices.push(i);
      continue;
    }

    const pronounPersonNumber = pronounTriggers?.[word] as PersonNumber | undefined;
    if (pronounPersonNumber && !explicitSubjectGup) {
      const pronounForms = SUBJECT_PRONOUNS_GUP[pronounPersonNumber];
      explicitSubjectGup = pronounForms[0];
      explicitSubjectSource = tokens[i];
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
      continue;
    }

    if (!explicitSubjectGup && !verbMatch) {
      const nounGup = findNounGup(word, mode);
      if (nounGup) {
        explicitSubjectGup = nounGup;
        explicitSubjectSource = tokens[i];
      } else {
        explicitSubjectGup = word;
        explicitSubjectSource = tokens[i];
      }
      consumedIndices.push(i);
      continue;
    }

    if (verbMatch && verbMatch.isTransitive && !objectGup) {
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
      continue;
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

  let subjectGup: string | null = explicitSubjectGup;
  let subjectSource: string | null = explicitSubjectSource;
  let impliedPersonNumber: PersonNumber | null = null;

  if (!subjectGup && verbMatch?.personNumber) {
    impliedPersonNumber = verbMatch.personNumber;
    const pronounForms = SUBJECT_PRONOUNS_GUP[impliedPersonNumber];
    subjectGup = pronounForms[0];
    subjectSource = "[implied from verb]";
  }

  const whomForInfo = QUESTION_GUP.whom_for;
  const gupParts = [whomForInfo.gup];
  if (subjectGup) {
    gupParts.push(subjectGup);
  }

  let objectGupFinal = objectGup;
  let objectOptions: QuestionPatternOption[] | undefined;
  const humanObjectLabel = LANG_CONFIG[mode].humanObject;
  const nonHumanObjectLabel = LANG_CONFIG[mode].nonHumanObject;

  if (objectGup && objectNounInfo && verbMatch?.isTransitive) {
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
  if (verbMatch) {
    gupParts.push(verbMatch.gup);
  }
  gupParts.push("?");

  if (objectGup && objectNounInfo && !objectNounInfo.isKnown && verbMatch?.isTransitive) {
    const gupPartsAlt = [whomForInfo.gup];
    if (subjectGup) gupPartsAlt.push(subjectGup);
    gupPartsAlt.push(objectGup);
    if (verbMatch) gupPartsAlt.push(verbMatch.gup);
    gupPartsAlt.push("?");
    objectOptions = [
      { gup: gupPartsAlt.join(" "), explanation: `${objectGup} (${nonHumanObjectLabel})` },
    ];
  }

  let explanation = `${tokens[whomForTrigger.idx]} → ${whomForInfo.gup} (${whomForInfo[mode]})`;
  if (subjectSource && subjectSource !== "[implied from verb]") {
    explanation += `, ${subjectSource} → ${subjectGup}`;
  } else if (subjectSource === "[implied from verb]" && impliedPersonNumber) {
    const impliedLabel = LANG_CONFIG[mode].impliedSubject;
    explanation += `, ${impliedLabel} → ${subjectGup}`;
  }
  if (objectGupFinal && objectSource) {
    if (objectOptions) {
      explanation += `, ${objectSource} → ${objectGupFinal} (${humanObjectLabel}) / ${objectGup} (${nonHumanObjectLabel})`;
    } else if (objectNounInfo?.isHuman) {
      explanation += `, ${objectSource} → ${objectGupFinal} (+nha ${humanObjectLabel})`;
    } else {
      explanation += `, ${objectSource} → ${objectGupFinal}`;
    }
  }
  if (verbMatch) {
    explanation += `, ${verbMatch.source} → ${verbMatch.gup}`;
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

        const personNumber = purposePronounTriggers?.[answerWord] as PersonNumber | undefined;

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
            ? `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].pronounPurpose})`
            : `${baseGup} + -${suffix} = ${finalGup} (${LANG_CONFIG[mode].purpose})`;
          additionalAnswers.push({
            baseGup: finalGup,
            rawBaseGup: baseGup,
            appliedSuffix: suffix || undefined,
            suffixType: "purpose",
            alternatives: isPronoun && allPronounForms && allPronounForms.length > 1
              ? allPronounForms.slice(1)
              : allSuffixes && allSuffixes.length > 1
                ? allSuffixes.slice(1).map((s) => applyPossessiveSuffix(baseGup, s as "wa" | "wu" | "ku" | "gu"))
                : undefined,
            sourceWord: answerWord,
            explanation: addExplanation,
          });
          continue;
        }

        answerExplanation = isPronoun
          ? `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].pronounPurpose})`
          : suffix
            ? `${baseGup} + -${suffix} = ${finalGup} (${LANG_CONFIG[mode].purpose})`
            : `${baseGup} (${LANG_CONFIG[mode].purpose})`;

        answerInfo = {
          baseGup: finalGup,
          rawBaseGup: baseGup,
          appliedSuffix: suffix || undefined,
          allSuffixes,
          alternatives: isPronoun && allPronounForms && allPronounForms.length > 1
            ? allPronounForms.slice(1)
            : allSuffixes && allSuffixes.length > 1
              ? allSuffixes.slice(1).map((s) => applyPossessiveSuffix(baseGup, s as "wa" | "wu" | "ku" | "gu"))
              : undefined,
          hasDefiniteArticle: determinerType !== null,
          determinerType,
          isPlural,
          isDual,
          baseExplanation: answerExplanation,
          answerTokens: answerWords,
          suffixType: "purpose",
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
    questionType: "whom_for",
    gupOutput: gupParts.join(" "),
    explanation,
    consumedIndices,
    options: objectOptions,
    answerInfo,
    isComplexPattern: true,
  };
}
