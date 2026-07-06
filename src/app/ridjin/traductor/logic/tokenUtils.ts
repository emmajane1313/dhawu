import { LanguageId } from "../core/types";
import { getLanguagePack } from "../lang";

export type TokenLike = { source: string };

const PUNCTUATION_EDGE = /^[¡!¿?.,]+|[¡!¿?.,]+$/g;
export const STRONG_PUNCTUATION = /[.!?;:]/;

export function normalizeToken(token: string, lang: LanguageId): string {
  const pack = getLanguagePack(lang);
  return pack.normalize(token).replace(PUNCTUATION_EDGE, "");
}

export function stripSpanishDiacritics(value: string): string {
  return value
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ü/g, "u");
}

export function splitForm(form: string, lang: LanguageId): string[] {
  return form
    .split(/\s+/)
    .map((part) => normalizeToken(part, lang))
    .filter(Boolean);
}

export function matchSequence(
  tokens: TokenLike[],
  start: number,
  formTokens: string[],
  lang: LanguageId
): { matched: boolean; consumed: number } {
  if (formTokens.length === 0) return { matched: false, consumed: 0 };
  for (let offset = 0; offset < formTokens.length; offset += 1) {
    const token = tokens[start + offset];
    if (!token) return { matched: false, consumed: 0 };
    if (normalizeToken(token.source, lang) !== formTokens[offset]) {
      return { matched: false, consumed: 0 };
    }
  }
  return { matched: true, consumed: formTokens.length };
}

export function isStrongPunctuationToken(token: TokenLike): boolean {
  return STRONG_PUNCTUATION.test(token.source);
}
