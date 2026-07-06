import { getLanguagePack } from "../lang";
import { IRSentence, IRToken, LanguageId } from "./types";

export function buildIR(
  input: string,
  sourceLang: LanguageId,
  targetLang: LanguageId
): IRSentence {
  const pack = getLanguagePack(sourceLang);
  const rawTokens = pack.tokenize(input);

  const tokens: IRToken[] = rawTokens.map((token, index) => {
    const normalized = pack.normalize(token);
    return {
      id: `${sourceLang}-${index}`,
      source: token,
      normalized,
      pos: "unknown",
    };
  });

  return {
    tokens,
    sourceLang,
    targetLang,
  };
}
