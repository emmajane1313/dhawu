import type { PersonNumber } from "../core/types";
import type { TokenLike } from "../logic/tokenUtils";

export const DEFAULT_GERUND_PERSONS: PersonNumber[] = ["1_Sing", "3_Sing"];

export function hasExclamation(
  tokens: TokenLike[],
  start: number,
  consumed: number
): boolean {
  return tokens
    .slice(start, start + consumed)
    .some((token) => /[!¡]/.test(token.source));
}
