import { LanguageMode } from "@/app/components/types/components.type";
import { QuestionPatternResult, QuestionContext, AnswerInfo, AdditionalAnswer, QuestionSubjectInfo } from "./types";
import { LANG_CONFIG, QUESTION_GUP, PersonNumber, SUBJECT_PRONOUNS_GUP, BELONGING_PRONOUNS_GUP } from "../../constants";
import { determineBelongingSuffix, applyBelongingSuffix } from "../belonging";
import { determineHumanAssociativeSuffix, applyHumanAssociativeSuffix } from "../../constants";
import { findNounGup, findNounInfo } from "./questionHelpers";

function detectWhatAboutTrigger(
  tokens: string[],
  mode: LanguageMode
): { idx: number; length: number } | null {
  const { whatAboutTriggers } = LANG_CONFIG[mode];
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  for (const trigger of whatAboutTriggers) {
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

export function detectWhatAboutQuestionPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    connectors,
    definiteArticles,
    pluralArticles,
    questionSkipWords,
    thisWords,
    thatWords,
    dualMarkers,
    belongingPronounTriggers,
  } = LANG_CONFIG[mode];

  const whatAboutTrigger = detectWhatAboutTrigger(tokens, mode);
  if (!whatAboutTrigger) return null;

  const consumedIndices: number[] = [];
  for (let i = 0; i < whatAboutTrigger.length; i++) {
    consumedIndices.push(whatAboutTrigger.idx + i);
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

  let subjectGup: string | null = null;
  let subjectSource: string | null = null;
  let subjectIsHuman = false;
  const { pronounTriggers } = LANG_CONFIG[mode];
  const startIdx = whatAboutTrigger.idx + whatAboutTrigger.length;

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
    if (pronounPersonNumber && !subjectGup) {
      const pronounForms = SUBJECT_PRONOUNS_GUP[pronounPersonNumber];
      subjectGup = pronounForms[0];
      subjectSource = tokens[i];
      subjectIsHuman = true;
      consumedIndices.push(i);
      continue;
    }

    if (!subjectGup) {
      const nounInfo = findNounInfo(word, mode);
      if (nounInfo) {
        subjectGup = nounInfo.gupKey;
        subjectSource = tokens[i];
        subjectIsHuman = nounInfo.isHuman || false;
      } else {
        subjectGup = findNounGup(word, mode) || word;
        subjectSource = tokens[i];
      }
      consumedIndices.push(i);
      break;
    }
  }

  const whatAboutInfo = QUESTION_GUP.what_about;
  const gupParts = [whatAboutInfo.gup];
  if (subjectGup) {
    gupParts.push(subjectGup);
  }
  gupParts.push("?");

  let explanation = `${tokens[whatAboutTrigger.idx]} → ${whatAboutInfo.gup} (${whatAboutInfo[mode]})`;
  if (subjectSource) {
    explanation += `, ${subjectSource} → ${subjectGup}`;
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

        const belongingPersonNumber = belongingPronounTriggers?.[answerWord] as PersonNumber | undefined;
        if (belongingPersonNumber) {
          const pronounForms = BELONGING_PRONOUNS_GUP[belongingPersonNumber];
          const finalGup = pronounForms[0];
          const alternatives = pronounForms.length > 1 ? pronounForms.slice(1) : undefined;

          if (answerInfo) {
            additionalAnswers.push({
              baseGup: finalGup,
              rawBaseGup: finalGup,
              suffixType: "belonging",
              isHuman: true,
              alternatives,
              sourceWord: answerWord,
              explanation: `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].pronounBelonging})`,
            });
            continue;
          }

          answerExplanation = `${answerWord} → ${finalGup} (${LANG_CONFIG[mode].pronounBelonging})`;
          answerInfo = {
            baseGup: finalGup,
            rawBaseGup: finalGup,
            alternatives,
            hasDefiniteArticle: determinerType !== null,
            determinerType,
            isPlural,
            isDual,
            isHuman: true,
            baseExplanation: answerExplanation,
            answerTokens: answerWords,
            suffixType: "belonging",
          };
          continue;
        }

        const nounInfo = findNounInfo(answerWord, mode);

        const baseGup = nounInfo?.gupKey || findNounGup(answerWord, mode) || answerWord;
        const isHuman = nounInfo?.isHuman || false;
        const nounIsPlural = nounInfo?.isPlural || false;

        let finalGup: string;
        let suffix: string;
        let allSuffixes: string[] | undefined;

        if (isHuman) {
          const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
          const humanSuffix = humanSuffixes[0];
          const humanGup = applyHumanAssociativeSuffix(baseGup, humanSuffix);
          const humanGupWithNgu = humanGup + "ŋu";
          const belongingResult = determineBelongingSuffix(humanGupWithNgu, mode);
          const belongingSuffix = belongingResult.suffixes[0];
          finalGup = applyBelongingSuffix(humanGupWithNgu, belongingSuffix);
          suffix = humanSuffix + "ŋu" + belongingSuffix;

          const alternatives: string[] = [];
          for (const hs of humanSuffixes) {
            const hGup = applyHumanAssociativeSuffix(baseGup, hs);
            const hGupNgu = hGup + "ŋu";
            const bResult = determineBelongingSuffix(hGupNgu, mode);
            for (const bs of bResult.suffixes) {
              const altGup = applyBelongingSuffix(hGupNgu, bs);
              if (altGup !== finalGup) {
                alternatives.push(altGup);
              }
            }
          }
          if (alternatives.length > 0) {
            allSuffixes = [suffix, ...alternatives.map((_, i) => `alt${i}`)];
          }
        } else {
          const suffixResult = determineBelongingSuffix(baseGup, mode);
          const suffixes = suffixResult.suffixes;
          finalGup = applyBelongingSuffix(baseGup, suffixes[0]);
          suffix = suffixes[0];
          if (suffixes.length > 1) {
            allSuffixes = suffixes;
          }
        }

        if (answerInfo) {
          const addExplanation = `${baseGup} + -${suffix} = ${finalGup} (${LANG_CONFIG[mode].belongingLabel})`;
          additionalAnswers.push({
            baseGup: finalGup,
            rawBaseGup: baseGup,
            appliedSuffix: suffix,
            suffixType: "belonging",
            isHuman,
            alternatives: allSuffixes && allSuffixes.length > 1
              ? allSuffixes.slice(1).map((s) => applyBelongingSuffix(baseGup, s as "buy" | "puy" | "wuy"))
              : undefined,
            sourceWord: answerWord,
            explanation: addExplanation,
          });
          continue;
        }

        answerExplanation = `${baseGup} + -${suffix} = ${finalGup} (${LANG_CONFIG[mode].belongingLabel})`;

        answerInfo = {
          baseGup: finalGup,
          rawBaseGup: baseGup,
          appliedSuffix: suffix,
          allSuffixes,
          alternatives: allSuffixes && allSuffixes.length > 1
            ? allSuffixes.slice(1).map((s) => applyBelongingSuffix(baseGup, s as "buy" | "puy" | "wuy"))
            : undefined,
          hasDefiniteArticle: determinerType !== null,
          determinerType,
          isPlural: isPlural || nounIsPlural,
          isDual,
          isHuman,
          baseExplanation: answerExplanation,
          answerTokens: answerWords,
          suffixType: "belonging",
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
  if (subjectGup && subjectSource) {
    subjectInfo = {
      gup: subjectGup,
      source: subjectSource,
      isHuman: subjectIsHuman,
    };
  }

  return {
    detected: true,
    questionType: "what_about",
    gupOutput: gupParts.join(" "),
    explanation,
    consumedIndices,
    answerInfo,
    hasExplicitSubject: !!subjectGup,
    subjectInfo,
    isComplexPattern: true,
  };
}
