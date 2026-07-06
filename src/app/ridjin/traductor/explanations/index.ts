import { ExplanationPayload, UiLanguageId } from "../core/types";
import { EXPLANATIONS_EN } from "./en";
import { EXPLANATIONS_ES } from "./es";

const EXPLANATION_MAP = {
  es: EXPLANATIONS_ES,
  en: EXPLANATIONS_EN,
} satisfies Record<UiLanguageId, typeof EXPLANATIONS_ES>;

export function renderExplanation(
  payload: ExplanationPayload,
  language: UiLanguageId
): string {
  const map = EXPLANATION_MAP[language] ?? EXPLANATIONS_EN;
  const renderer = map[payload.key];
  return renderer ? renderer(payload.data) : "";
}

export function renderExplanationList(
  payloads: ExplanationPayload[] | undefined,
  language: UiLanguageId
): string {
  if (!payloads || payloads.length === 0) return "";
  return payloads
    .map((payload) => renderExplanation(payload, language))
    .filter(Boolean)
    .join("; ");
}
