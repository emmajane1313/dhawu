import { LanguageMode } from "@/app/components/types/components.type";
import {
  QuestionPatternResult,
  QuestionContext,
  AnswerInfo,
  AdditionalAnswer,
  QuestionPatternOption,
} from "./types";
import {
  LANG_CONFIG,
  QUESTION_GUP,
  PersonNumber,
  SUBJECT_PRONOUNS_GUP,
  determineHumanAssociativeSuffix,
  applyHumanAssociativeSuffix,
  HumanAssociativeSuffixType,
} from "../../constants";
import { applyErgativeSuffix } from "../subject";
import { findVerbGupWithPerson, findNounGup, VerbMatchWithPerson, findNounInfo, applyNha } from "./questionHelpers";
import {
  determinePossessiveSuffix,
  applyPossessiveSuffix,
  PossessiveSuffixType,
} from "../possession";

function detectWithWhatTrigger(
  tokens: string[],
  mode: LanguageMode
): { idx: number; length: number } | null {
  const { withWhatTriggers } = LANG_CONFIG[mode];
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  for (const trigger of withWhatTriggers) {
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

function detectByWhomTrigger(
  tokens: string[],
  mode: LanguageMode
): { idx: number; length: number } | null {
  const { byWhomTriggers } = LANG_CONFIG[mode];
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  for (const trigger of byWhomTriggers) {
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

export function detectWithWhatQuestionPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    connectors,
    definiteArticles,
    pluralArticles,
    questionSkipWords,
    pronounTriggers,
    instrumentalThing,
    thisWords,
    thatWords,
    dualMarkers,
  } = LANG_CONFIG[mode];

  const withWhatTrigger = detectWithWhatTrigger(tokens, mode);
  if (!withWhatTrigger) return null;

  const consumedIndices: number[] = [];
  for (let i = 0; i < withWhatTrigger.length; i++) {
    consumedIndices.push(withWhatTrigger.idx + i);
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

  const startIdx = withWhatTrigger.idx + withWhatTrigger.length;
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

  const withWhatInfo = QUESTION_GUP.with_what;
  const gupParts = [withWhatInfo.gup];
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
    const gupPartsAlt = [withWhatInfo.gup];
    if (subjectGup) gupPartsAlt.push(subjectGup);
    gupPartsAlt.push(objectGup);
    if (verbMatch) gupPartsAlt.push(verbMatch.gup);
    gupPartsAlt.push("?");
    objectOptions = [
      { gup: gupPartsAlt.join(" "), explanation: `${objectGup} (${nonHumanObjectLabel})` },
    ];
  }

  let explanation = `${tokens[withWhatTrigger.idx]} → ${withWhatInfo.gup} (${withWhatInfo[mode]})`;
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
  let isPossessorNext = false;

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

        const { possessionPreposition } = LANG_CONFIG[mode];
        if (answerWord === possessionPreposition && answerInfo) {
          const deIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (deIdx !== -1) {
            consumedIndices.push(deIdx);
            usedAnswerIndices.add(deIdx);
          }
          isPossessorNext = true;
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

        const nounInfo = findNounInfo(answerWord, mode);
        const baseGup = nounInfo?.gupKey || answerWord;
        const isHuman = nounInfo?.isHuman;
        const nounIsPlural = nounInfo?.isPlural || false;

        if (isPossessorNext && answerInfo) {
          const possessedHasSuffix = answerInfo.appliedSuffix !== undefined && answerInfo.appliedSuffix !== "";
          const forceAssociative =
            possessedHasSuffix && answerInfo.suffixType !== "possessive" && answerInfo.suffixType !== "purpose";

          let possessorWithSuffix: string;
          let appliedSuffix: HumanAssociativeSuffixType | PossessiveSuffixType;
          const possessorAlternatives: string[] = [];

          if (forceAssociative) {
            const humanAssocSuffixes = determineHumanAssociativeSuffix(baseGup);
            appliedSuffix = humanAssocSuffixes[0];
            possessorWithSuffix = applyHumanAssociativeSuffix(baseGup, appliedSuffix);
            if (humanAssocSuffixes.length > 1) {
              for (const assocSuffix of humanAssocSuffixes.slice(1)) {
                possessorAlternatives.push(applyHumanAssociativeSuffix(baseGup, assocSuffix));
              }
            }
          } else {
            const possessiveSuffixResult = determinePossessiveSuffix(baseGup, mode);
            appliedSuffix = possessiveSuffixResult.suffixes[0];
            possessorWithSuffix = applyPossessiveSuffix(baseGup, appliedSuffix);
            if (possessiveSuffixResult.suffixes.length > 1) {
              for (const altSuffix of possessiveSuffixResult.suffixes.slice(1)) {
                possessorAlternatives.push(applyPossessiveSuffix(baseGup, altSuffix));
              }
            }
          }

          additionalAnswers.push({
            baseGup: possessorWithSuffix,
            rawBaseGup: baseGup,
            appliedSuffix,
            isPossessor: true,
            alternatives: possessorAlternatives.length > 0 ? possessorAlternatives : undefined,
            sourceWord: answerWord,
            explanation: `"${answerWord}" (possessor) → ${possessorWithSuffix}`,
          });

          isPossessorNext = false;
          continue;
        }

        let finalGup: string;
        let suffix: string | null = null;
        let alternatives: string[] | undefined;

        if (isHuman === true) {
          const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
          suffix = humanSuffixes[0];
          finalGup = applyHumanAssociativeSuffix(baseGup, humanSuffixes[0]);
          if (humanSuffixes.length > 1) {
            alternatives = humanSuffixes.slice(1).map((s) => applyHumanAssociativeSuffix(baseGup, s));
          }
        } else if (isHuman === false) {
          const { suffixed, suffix: instSuffix } = applyErgativeSuffix(baseGup);
          finalGup = suffixed;
          suffix = instSuffix || "y";
        } else {
          const { suffixed, suffix: instSuffix } = applyErgativeSuffix(baseGup);
          finalGup = suffixed;
          suffix = instSuffix || "y";
          const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
          alternatives = humanSuffixes.map((s) => applyHumanAssociativeSuffix(baseGup, s));
        }

        if (answerInfo) {
          const addExplanation = `${baseGup} + -${suffix} = ${finalGup} (${instrumentalThing})`;
          additionalAnswers.push({
            baseGup: finalGup,
            rawBaseGup: baseGup,
            appliedSuffix: suffix || undefined,
            suffixType: "none",
            isHuman,
            alternatives,
            sourceWord: answerWord,
            explanation: addExplanation,
          });
          continue;
        }

        answerExplanation = suffix
          ? `${baseGup} + -${suffix} = ${finalGup} (${instrumentalThing})`
          : `${baseGup} (${instrumentalThing})`;

        answerInfo = {
          baseGup: finalGup,
          rawBaseGup: baseGup,
          appliedSuffix: suffix || undefined,
          alternatives,
          hasDefiniteArticle: determinerType !== null,
          determinerType,
          isPlural: isPlural || nounIsPlural,
          isDual,
          isHuman,
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
        const respuestaLabel = LANG_CONFIG[mode].answerLabel;
        explanation += ` | ${respuestaLabel}: ${answerExplanation}`;
      }
    }
  }

  return {
    detected: true,
    questionType: "with_what",
    gupOutput: gupParts.join(" "),
    explanation,
    consumedIndices,
    options: objectOptions,
    answerInfo,
    isComplexPattern: true,
  };
}

export function detectByWhomQuestionPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    connectors,
    definiteArticles,
    pluralArticles,
    questionSkipWords,
    pronounTriggers,
    instrumentalPerson,
    thisWords,
    thatWords,
    dualMarkers,
  } = LANG_CONFIG[mode];

  const byWhomTrigger = detectByWhomTrigger(tokens, mode);
  if (!byWhomTrigger) return null;

  const consumedIndices: number[] = [];
  for (let i = 0; i < byWhomTrigger.length; i++) {
    consumedIndices.push(byWhomTrigger.idx + i);
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

  const startIdx = byWhomTrigger.idx + byWhomTrigger.length;
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

  const byWhomInfo = QUESTION_GUP.by_whom;
  const gupParts = [byWhomInfo.gup];
  if (subjectGup) {
    gupParts.push(subjectGup);
  }

  let objectGupFinal = objectGup;
  const humanObjectLabel = LANG_CONFIG[mode].humanObject;
  const nonHumanObjectLabel = LANG_CONFIG[mode].nonHumanObject;
  let hasUnknownObject = false;

  if (objectGup && objectNounInfo && verbMatch?.isTransitive) {
    if (objectNounInfo.isKnown) {
      if (objectNounInfo.isHuman) {
        objectGupFinal = applyNha(objectGup);
      }
    } else {
      const withNha = applyNha(objectGup);
      objectGupFinal = withNha;
      hasUnknownObject = true;
    }
  }

  if (objectGupFinal) {
    gupParts.push(objectGupFinal);
  }
  if (verbMatch) {
    gupParts.push(verbMatch.gup);
  }
  gupParts.push("?");

  const options: QuestionPatternOption[] = [];
  if (byWhomInfo.alternatives) {
    for (const alt of byWhomInfo.alternatives) {
      options.push({
        gup: alt,
        explanation: `${byWhomInfo[mode]} → ${alt}`,
      });
    }
  }
  if (hasUnknownObject && objectGup) {
    const gupPartsAlt = [byWhomInfo.gup];
    if (subjectGup) gupPartsAlt.push(subjectGup);
    gupPartsAlt.push(objectGup);
    if (verbMatch) gupPartsAlt.push(verbMatch.gup);
    gupPartsAlt.push("?");
    options.push({
      gup: gupPartsAlt.join(" "),
      explanation: `${objectGup} (${nonHumanObjectLabel})`,
    });
  }

  let explanation = `${tokens[byWhomTrigger.idx]} → ${byWhomInfo.gup} (${byWhomInfo[mode]})`;
  if (subjectSource && subjectSource !== "[implied from verb]") {
    explanation += `, ${subjectSource} → ${subjectGup}`;
  } else if (subjectSource === "[implied from verb]" && impliedPersonNumber) {
    const impliedLabel = LANG_CONFIG[mode].impliedSubject;
    explanation += `, ${impliedLabel} → ${subjectGup}`;
  }
  if (objectGupFinal && objectSource) {
    if (hasUnknownObject) {
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
  let isPossessorNextByWhom = false;

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

        const { possessionPreposition: byWhomPossPrep } = LANG_CONFIG[mode];
        if (answerWord === byWhomPossPrep && answerInfo) {
          const deIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (deIdx !== -1) {
            consumedIndices.push(deIdx);
            usedAnswerIndices.add(deIdx);
          }
          isPossessorNextByWhom = true;
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

        const nounInfo = findNounInfo(answerWord, mode);
        const baseGup = nounInfo?.gupKey || answerWord;
        const nounIsPlural = nounInfo?.isPlural || false;

        if (isPossessorNextByWhom && answerInfo) {
          const possessedHasSuffix = answerInfo.appliedSuffix !== undefined && answerInfo.appliedSuffix !== "";
          const forceAssociative =
            possessedHasSuffix && answerInfo.suffixType !== "possessive" && answerInfo.suffixType !== "purpose";

          let possessorWithSuffix: string;
          let appliedSuffix: HumanAssociativeSuffixType | PossessiveSuffixType;
          const possessorAlternatives: string[] = [];

          if (forceAssociative) {
            const humanAssocSuffixes = determineHumanAssociativeSuffix(baseGup);
            appliedSuffix = humanAssocSuffixes[0];
            possessorWithSuffix = applyHumanAssociativeSuffix(baseGup, appliedSuffix);
            if (humanAssocSuffixes.length > 1) {
              for (const assocSuffix of humanAssocSuffixes.slice(1)) {
                possessorAlternatives.push(applyHumanAssociativeSuffix(baseGup, assocSuffix));
              }
            }
          } else {
            const possessiveSuffixResult = determinePossessiveSuffix(baseGup, mode);
            appliedSuffix = possessiveSuffixResult.suffixes[0];
            possessorWithSuffix = applyPossessiveSuffix(baseGup, appliedSuffix);
            if (possessiveSuffixResult.suffixes.length > 1) {
              for (const altSuffix of possessiveSuffixResult.suffixes.slice(1)) {
                possessorAlternatives.push(applyPossessiveSuffix(baseGup, altSuffix));
              }
            }
          }

          additionalAnswers.push({
            baseGup: possessorWithSuffix,
            rawBaseGup: baseGup,
            appliedSuffix,
            isPossessor: true,
            alternatives: possessorAlternatives.length > 0 ? possessorAlternatives : undefined,
            sourceWord: answerWord,
            explanation: `"${answerWord}" (possessor) → ${possessorWithSuffix}`,
          });

          isPossessorNextByWhom = false;
          continue;
        }

        const humanSuffixes = determineHumanAssociativeSuffix(baseGup);
        const suffix = humanSuffixes[0];
        const finalGup = applyHumanAssociativeSuffix(baseGup, suffix);
        const alternatives = humanSuffixes.length > 1
          ? humanSuffixes.slice(1).map((s) => applyHumanAssociativeSuffix(baseGup, s))
          : undefined;

        if (answerInfo) {
          const addExplanation = `${baseGup} + -${suffix} = ${finalGup} (${instrumentalPerson})`;
          additionalAnswers.push({
            baseGup: finalGup,
            rawBaseGup: baseGup,
            appliedSuffix: suffix,
            suffixType: "none",
            isHuman: true,
            alternatives,
            sourceWord: answerWord,
            explanation: addExplanation,
          });
          continue;
        }

        answerExplanation = `${baseGup} + -${suffix} = ${finalGup} (${instrumentalPerson})`;

        answerInfo = {
          baseGup: finalGup,
          rawBaseGup: baseGup,
          appliedSuffix: suffix,
          alternatives,
          hasDefiniteArticle: determinerType !== null,
          determinerType,
          isPlural: isPlural || nounIsPlural,
          isDual,
          isHuman: true,
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
        const respuestaLabel = LANG_CONFIG[mode].answerLabel;
        explanation += ` | ${respuestaLabel}: ${answerExplanation}`;
      }
    }
  }

  return {
    detected: true,
    questionType: "by_whom",
    gupOutput: gupParts.join(" "),
    explanation,
    consumedIndices,
    answerInfo,
    options: options.length > 0 ? options : undefined,
    isComplexPattern: true,
  };
}

export function detectHowTransportQuestionPattern(
  ctx: QuestionContext
): QuestionPatternResult | null {
  const { tokens, mode, originalText } = ctx;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const {
    connectors,
    definiteArticles,
    pluralArticles,
    questionSkipWords,
    pronounTriggers,
    instrumentalThing,
    allativeSuffixLabel,
    thisWords,
    thatWords,
    dualMarkers,
  } = LANG_CONFIG[mode];

  const howWords = LANG_CONFIG[mode].howWords;
  let howIdx = -1;
  for (const hw of howWords) {
    const idx = lowerTokens.indexOf(hw);
    if (idx !== -1) {
      howIdx = idx;
      break;
    }
  }
  if (howIdx === -1) return null;

  let hasMotionVerb = false;
  for (let i = 0; i < tokens.length; i++) {
    if (i === howIdx) continue;
    const verb = findVerbGupWithPerson(lowerTokens[i], mode);
    if (verb?.isMotion) {
      hasMotionVerb = true;
      break;
    }
  }
  if (!hasMotionVerb) return null;

  const consumedIndices: number[] = [howIdx];

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

  for (let i = 0; i < tokensBeforeQuestion; i++) {
    if (i === howIdx) continue;
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
      continue;
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

  const withWhatInfo = QUESTION_GUP.with_what;
  const whereToInfo = QUESTION_GUP.where_to;

  const gupParts = [withWhatInfo.gup];
  if (subjectGup) {
    gupParts.push(subjectGup);
  }
  if (verbMatch) {
    gupParts.push(verbMatch.gup);
  }
  gupParts.push("?");

  const altGupParts = [whereToInfo.gup];
  if (subjectGup) {
    altGupParts.push(subjectGup);
  }
  if (verbMatch) {
    altGupParts.push(verbMatch.gup);
  }
  altGupParts.push("?");

  const meansLabel = LANG_CONFIG[mode].meansTransport;
  const destinationLabel = LANG_CONFIG[mode].destinationLabel;

  let explanation = `${tokens[howIdx]} → ${withWhatInfo.gup} (${meansLabel}) / ${whereToInfo.gup} (${destinationLabel})`;
  if (subjectSource && subjectSource !== "[implied from verb]") {
    explanation += `, ${subjectSource} → ${subjectGup}`;
  } else if (subjectSource === "[implied from verb]" && impliedPersonNumber) {
    const impliedLabel = LANG_CONFIG[mode].impliedSubject;
    explanation += `, ${impliedLabel} → ${subjectGup}`;
  }
  if (verbMatch) {
    explanation += `, ${verbMatch.source} → ${verbMatch.gup}`;
  }

  const options: QuestionPatternOption[] = [
    {
      gup: altGupParts.join(" "),
      explanation: `${tokens[howIdx]} → ${whereToInfo.gup} (${destinationLabel})`,
    },
  ];

  let answerInfo: AnswerInfo | undefined;
  let answerExplanation = "";
  const additionalAnswers: AdditionalAnswer[] = [];
  const answerConsumedIndices: number[] = [];
  const usedAnswerIndices = new Set<number>();
  let isPossessorNextHow = false;

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

        const { possessionPreposition: howPossPrep } = LANG_CONFIG[mode];
        if (answerWord === howPossPrep && answerInfo) {
          const deIdx = lowerTokens.findIndex(
            (t, i) =>
              i >= tokensBeforeQuestion &&
              !usedAnswerIndices.has(i) &&
              t.replace(/[,.\-;:!¡¿]+$/, "") === answerWord
          );
          if (deIdx !== -1) {
            consumedIndices.push(deIdx);
            usedAnswerIndices.add(deIdx);
          }
          isPossessorNextHow = true;
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

        const nounInfo = findNounInfo(answerWord, mode);
        const baseGup = nounInfo?.gupKey || answerWord;
        const nounIsPlural = nounInfo?.isPlural || false;

        if (isPossessorNextHow && answerInfo) {
          const possessedHasSuffix = answerInfo.appliedSuffix !== undefined && answerInfo.appliedSuffix !== "";
          const forceAssociative =
            possessedHasSuffix && answerInfo.suffixType !== "possessive" && answerInfo.suffixType !== "purpose";

          let possessorWithSuffix: string;
          let appliedSuffix: HumanAssociativeSuffixType | PossessiveSuffixType;
          const possessorAlternatives: string[] = [];

          if (forceAssociative) {
            const humanAssocSuffixes = determineHumanAssociativeSuffix(baseGup);
            appliedSuffix = humanAssocSuffixes[0];
            possessorWithSuffix = applyHumanAssociativeSuffix(baseGup, appliedSuffix);
            if (humanAssocSuffixes.length > 1) {
              for (const assocSuffix of humanAssocSuffixes.slice(1)) {
                possessorAlternatives.push(applyHumanAssociativeSuffix(baseGup, assocSuffix));
              }
            }
          } else {
            const possessiveSuffixResult = determinePossessiveSuffix(baseGup, mode);
            appliedSuffix = possessiveSuffixResult.suffixes[0];
            possessorWithSuffix = applyPossessiveSuffix(baseGup, appliedSuffix);
            if (possessiveSuffixResult.suffixes.length > 1) {
              for (const altSuffix of possessiveSuffixResult.suffixes.slice(1)) {
                possessorAlternatives.push(applyPossessiveSuffix(baseGup, altSuffix));
              }
            }
          }

          additionalAnswers.push({
            baseGup: possessorWithSuffix,
            rawBaseGup: baseGup,
            appliedSuffix,
            isPossessor: true,
            alternatives: possessorAlternatives.length > 0 ? possessorAlternatives : undefined,
            sourceWord: answerWord,
            explanation: `"${answerWord}" (possessor) → ${possessorWithSuffix}`,
          });

          isPossessorNextHow = false;
          continue;
        }

        const { suffixed, suffix: instSuffix } = applyErgativeSuffix(baseGup);
        const finalGup = suffixed;
        const suffix = instSuffix || "y";

        const liliGup = baseGup + "lili";
        const alternatives = [liliGup];

        if (answerInfo) {
          const addExplanation = `${baseGup} + -${suffix} = ${finalGup} (${instrumentalThing}) / ${baseGup} + -lili = ${liliGup} (${allativeSuffixLabel})`;
          additionalAnswers.push({
            baseGup: finalGup,
            rawBaseGup: baseGup,
            appliedSuffix: suffix,
            suffixType: "none",
            alternatives,
            sourceWord: answerWord,
            explanation: addExplanation,
          });
          continue;
        }

        answerExplanation = `${baseGup} + -${suffix} = ${finalGup} (${instrumentalThing}) / -lili (${allativeSuffixLabel})`;

        answerInfo = {
          baseGup: finalGup,
          rawBaseGup: baseGup,
          appliedSuffix: suffix,
          alternatives,
          hasDefiniteArticle: determinerType !== null,
          determinerType,
          isPlural: isPlural || nounIsPlural,
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
        const respuestaLabel = LANG_CONFIG[mode].answerLabel;
        explanation += ` | ${respuestaLabel}: ${answerExplanation}`;
      }
    }
  }

  return {
    detected: true,
    questionType: "with_what",
    gupOutput: gupParts.join(" "),
    explanation,
    consumedIndices,
    answerInfo,
    options,
    isComplexPattern: true,
  };
}
