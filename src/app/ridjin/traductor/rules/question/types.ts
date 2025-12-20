import { LanguageMode } from "@/app/components/types/components.type";
import { PersonNumber } from "../../constants";

export type QuestionType =
  | "where"
  | "where_to"
  | "where_from"
  | "what"
  | "what_purpose"
  | "what_about"
  | "where_belong"
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

export type AnswerSuffixType = "locative" | "djal" | "allative" | "possessive" | "purpose" | "belonging" | "none";

export interface AdditionalAnswer {
  baseGup: string;
  rawBaseGup: string;
  appliedSuffix?: string;
  isHuman?: boolean;
  isPlace?: boolean;
  isPossessor?: boolean;
  suffixType?: AnswerSuffixType;
  alternatives?: string[];
  sourceWord?: string;
  explanation?: string;
}

export interface AnswerInfo {
  baseGup: string;
  rawBaseGup?: string;
  appliedSuffix?: string;
  allSuffixes?: string[];
  alternatives?: string[];
  hasDefiniteArticle: boolean;
  determinerType: "this" | "that" | "definite" | null;
  isPlural?: boolean;
  isDual?: boolean;
  isHuman?: boolean;
  isPlace?: boolean;
  baseExplanation: string;
  answerTokens: string[];
  additionalAnswers?: AdditionalAnswer[];
  answerConsumedIndices?: number[];
  suffixType?: AnswerSuffixType;
}

export interface QuestionSubjectInfo {
  gup: string;
  source: string;
  isPlural?: boolean;
  isHuman?: boolean;
  isKnownNoun?: boolean;
}

export interface QuestionPatternResult {
  detected: boolean;
  questionType: NonNullable<QuestionType>;
  gupOutput: string;
  explanation: string;
  consumedIndices: number[];
  options?: QuestionPatternOption[];
  answerGup?: string;
  answerInfo?: AnswerInfo;
  hasExplicitSubject?: boolean;
  subjectInfo?: QuestionSubjectInfo;
  isComplexPattern?: boolean;
}

export interface QuestionPatternOption {
  gup: string;
  explanation: string;
}

export interface WhereQuestionResult extends QuestionPatternResult {
  subjectGup: string;
  locationAnswer?: string;
}

export interface WhoseQuestionResult extends QuestionPatternResult {
  demonstrative: "dhuwala" | "dhuwali";
  thingGup: string;
}

export interface WhatWillDoResult extends QuestionPatternResult {
  pronounGup: string;
  personNumber: PersonNumber;
  options: QuestionPatternOption[];
}

export interface WhoQuestionResult extends QuestionPatternResult {
  verbGup: string;
  objectGup?: string;
  isTransitive: boolean;
}

export interface QuestionContext {
  tokens: string[];
  mode: LanguageMode;
  originalText: string;
}

export interface VerbMatch {
  gup: string;
  isTransitive: boolean;
  source: string;
}

export type VerbType = "djäl" | "marŋgi";
