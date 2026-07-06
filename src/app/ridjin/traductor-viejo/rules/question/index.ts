import { LanguageMode } from "@/app/components/types/components.type";
import { LANG_CONFIG, QUESTION_GUP } from "../../constants";
import {
  QuestionType,
  QuestionMatch,
  QuestionPatternResult,
  QuestionContext,
  AnswerInfo,
} from "./types";
import { detectWhereQuestionPattern } from "./wherePattern";
import { detectWhereToPattern, detectToWhomPattern } from "./whereToPattern";
import { detectWhereFromPattern } from "./whereFromPattern";
import { detectWhoseQuestionPattern } from "./whosePattern";
import { detectWhatWillDoPattern } from "./whatWillDoPattern";
import { detectWhoQuestionPattern } from "./whoPattern";
import { detectWantKnowPattern } from "./wantKnowPattern";
import { detectWhyQuestionPattern } from "./whyPattern";
import { detectWhomForQuestionPattern } from "./whomForPattern";
import { detectWithWhatQuestionPattern, detectByWhomQuestionPattern, detectHowTransportQuestionPattern } from "./withWhatPattern";
import { detectWhatAboutQuestionPattern } from "./whatAboutPattern";

export type { QuestionType, QuestionMatch, QuestionPatternResult, QuestionContext, AnswerInfo };
export { detectWhereQuestionPattern } from "./wherePattern";
export { detectWhereToPattern, detectToWhomPattern } from "./whereToPattern";
export { detectWhereFromPattern } from "./whereFromPattern";
export { detectWhoseQuestionPattern } from "./whosePattern";
export { detectWhatWillDoPattern } from "./whatWillDoPattern";
export { detectWhoQuestionPattern } from "./whoPattern";
export { detectWantKnowPattern } from "./wantKnowPattern";
export { detectWhyQuestionPattern } from "./whyPattern";
export { detectWhomForQuestionPattern } from "./whomForPattern";
export { detectWithWhatQuestionPattern, detectByWhomQuestionPattern, detectHowTransportQuestionPattern } from "./withWhatPattern";
export { detectWhatAboutQuestionPattern } from "./whatAboutPattern";

export function detectQuestionWord(
  tokens: string[],
  mode: LanguageMode
): QuestionMatch | null {
  const { questionWordMap } = LANG_CONFIG[mode];
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i].toLowerCase();
    const questionType = questionWordMap[word];

    if (questionType) {
      const info = QUESTION_GUP[questionType];
      return {
        type: questionType,
        questionWordIndex: i,
        gup: info.gup,
        explanation: `${word} → ${info.gup} (${info[mode]})`,
      };
    }
  }

  return null;
}

export function isQuestionSentence(text: string): boolean {
  return text.includes("?") || text.startsWith("¿");
}

export function detectQuestionPattern(
  tokens: string[],
  mode: LanguageMode,
  originalText: string
): QuestionPatternResult | null {
  const ctx: QuestionContext = { tokens, mode, originalText };

  const whereToResult = detectWhereToPattern(ctx);
  if (whereToResult?.detected) return whereToResult;

  const toWhomResult = detectToWhomPattern(ctx);
  if (toWhomResult?.detected) return toWhomResult;

  const whereFromResult = detectWhereFromPattern(ctx);
  if (whereFromResult?.detected) return whereFromResult;

  const whereResult = detectWhereQuestionPattern(ctx);
  if (whereResult?.detected) return whereResult;

  const whoseResult = detectWhoseQuestionPattern(ctx);
  if (whoseResult?.detected) return whoseResult;

  const whatWillDoResult = detectWhatWillDoPattern(ctx);
  if (whatWillDoResult?.detected) return whatWillDoResult;

  const wantKnowResult = detectWantKnowPattern(ctx);
  if (wantKnowResult?.detected) return wantKnowResult;

  const withWhatResult = detectWithWhatQuestionPattern(ctx);
  if (withWhatResult?.detected) return withWhatResult;

  const byWhomResult = detectByWhomQuestionPattern(ctx);
  if (byWhomResult?.detected) return byWhomResult;

  const howTransportResult = detectHowTransportQuestionPattern(ctx);
  if (howTransportResult?.detected) return howTransportResult;

  const whyResult = detectWhyQuestionPattern(ctx);
  if (whyResult?.detected) return whyResult;

  const whatAboutResult = detectWhatAboutQuestionPattern(ctx);
  if (whatAboutResult?.detected) return whatAboutResult;

  const whomForResult = detectWhomForQuestionPattern(ctx);
  if (whomForResult?.detected) return whomForResult;

  const whoResult = detectWhoQuestionPattern(ctx);
  if (whoResult?.detected) return whoResult;

  return null;
}

export function processQuestionSentence(
  text: string,
  mode: LanguageMode
): QuestionPatternResult | null {
  if (!isQuestionSentence(text)) return null;

  const cleanText = text.replace(/[¿?]/g, " ").trim();
  const tokens = cleanText.split(/\s+/).filter(t => t.length > 0);

  const patternResult = detectQuestionPattern(tokens, mode, text);
  if (patternResult) return patternResult;

  const simpleMatch = detectQuestionWord(tokens, mode);
  if (simpleMatch && simpleMatch.type) {
    return {
      detected: true,
      questionType: simpleMatch.type,
      gupOutput: `${simpleMatch.gup}?`,
      explanation: simpleMatch.explanation,
      consumedIndices: [simpleMatch.questionWordIndex],
    };
  }

  return null;
}
