import { LanguageMode } from "@/app/components/types/components.type";
import { QuestionPatternResult, QuestionContext, AnswerInfo, AdditionalAnswer } from "./types";
import { LANG_CONFIG, QUESTION_GUP, POSSESSIVE_PRONOUNS_GUP, PersonNumber, SUBJECT_PRONOUNS_GUP } from "../../constants";
import { determinePossessiveSuffix, applyPossessiveSuffix } from "../possession";
import { findVerbGupWithPerson, findNounGup, VerbMatchWithPerson } from "./questionHelpers";

function detectWhyTrigger(
  tokens: string[],
  mode: LanguageMode
): { idx: number; length: number } | null {
  const { whyTriggers } = LANG_CONFIG[mode];
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  for (const trigger of whyTriggers) {
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

export function detectWhyQuestionPattern(
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

  const whyTrigger = detectWhyTrigger(tokens, mode);
  if (!whyTrigger) return null;

  const consumedIndices: number[] = [];
  for (let i = 0; i < whyTrigger.length; i++) {
    consumedIndices.push(whyTrigger.idx + i);
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
  let explicitSubjectGup: string | null = null;
  let explicitSubjectSource: string | null = null;
  const { pronounTriggers } = LANG_CONFIG[mode];
  const startIdx = whyTrigger.idx + whyTrigger.length;

  for (let i = startIdx; i < tokensBeforeQuestion; i++) {
    const word = lowerTokens[i];
    if (word === "?" || word === "¿") continue;
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

    const verb = findVerbGupWithPerson(word, mode);
    if (verb) {
      verbMatch = verb;
      consumedIndices.push(i);
      break;
    }

    if (!explicitSubjectGup) {
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

  const whyInfo = QUESTION_GUP.why;
  const gupParts = [whyInfo.gup];
  if (subjectGup) {
    gupParts.push(subjectGup);
  }
  if (verbMatch) {
    gupParts.push(verbMatch.gup);
  }
  gupParts.push("?");

  let explanation = `${tokens[whyTrigger.idx]} → ${whyInfo.gup} (${whyInfo[mode]})`;
  if (subjectSource && subjectSource !== "[implied from verb]") {
    explanation += `, ${subjectSource} → ${subjectGup}`;
  } else if (subjectSource === "[implied from verb]" && impliedPersonNumber) {
    explanation += `, Sujeto implícito por conjugación → ${subjectGup}`;
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
    questionType: "why",
    gupOutput: gupParts.join(" "),
    explanation,
    consumedIndices,
    answerInfo,
    isComplexPattern: true,
  };
}
