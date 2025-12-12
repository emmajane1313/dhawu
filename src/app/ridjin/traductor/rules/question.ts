import { LanguageMode } from "@/app/components/types/components.type";
import { LANG_CONFIG, QUESTION_GUP } from "../constants";

export type QuestionType =
  | "where"
  | "where_to"
  | "where_from"
  | "what"
  | "what_purpose"
  | "whom"
  | "to_whom"
  | "whose"
  | "whom_for"
  | "how"
  | "with_what"
  | "by_whom"
  | "when"
  | "why"
  | null;

export interface QuestionMatch {
  type: QuestionType;
  questionWordIndex: number;
  gup: string;
  explanation: string;
}
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
