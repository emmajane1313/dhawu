import { LanguageMode } from "@/app/components/types/components.type";
import { IRToken } from "../core/types";
import { isClauseConnectorToken } from "./connectors";
import { matchMarkerAt, matchTimeMarkerAt } from "./lexiconMatch";
import { isStrongPunctuationToken } from "./tokenUtils";

export function resolvePastTimeContext(
  tokens: IRToken[],
  verbIndex: number,
  sourceLang: LanguageMode,
  skipIndices: Set<number>
): "today" | "yesterday" | "unknown" {
  let foundToday = false;
  let foundYesterday = false;

  const isBoundary = (idx: number): boolean => {
    const token = tokens[idx];
    if (!token) return true;
    const marker = matchMarkerAt(tokens, idx, sourceLang);
    if (marker?.entry.pos === "punctuation") return true;
    if (isStrongPunctuationToken(token)) return true;
    if (isClauseConnectorToken(tokens, idx, sourceLang)) return true;
    return false;
  };

  let idx = verbIndex - 1;
  while (idx >= 0) {
    if (isBoundary(idx)) break;
    const match = matchTimeMarkerAt(tokens, idx, sourceLang);
    if (match) {
      if (match.kind === "yesterday") foundYesterday = true;
      if (match.kind === "today") foundToday = true;
      idx -= match.consumed;
      continue;
    }
    idx -= 1;
  }

  idx = verbIndex + 1;
  while (idx < tokens.length) {
    if (isBoundary(idx)) break;
    const match = matchTimeMarkerAt(tokens, idx, sourceLang);
    if (match) {
      if (match.kind === "yesterday") foundYesterday = true;
      if (match.kind === "today") foundToday = true;
      idx += match.consumed;
      continue;
    }
    idx += 1;
  }

  if (foundYesterday) return "yesterday";
  if (foundToday) return "today";
  return "unknown";
}

export function resolveFutureTimeContext(
  tokens: IRToken[],
  verbIndex: number,
  sourceLang: LanguageMode,
  skipIndices: Set<number>
): "same-day" | "tomorrow" | "unknown" {
  let foundSpecified = false;
  let foundToday = false;

  const isBoundary = (idx: number): boolean => {
    const token = tokens[idx];
    if (!token) return true;
    const marker = matchMarkerAt(tokens, idx, sourceLang);
    if (marker?.entry.pos === "punctuation") return true;
    if (isStrongPunctuationToken(token)) return true;
    if (isClauseConnectorToken(tokens, idx, sourceLang)) return true;
    return false;
  };

  let idx = verbIndex - 1;
  while (idx >= 0) {
    if (isBoundary(idx)) break;
    const time = matchTimeMarkerAt(tokens, idx, sourceLang);
    if (time) {
      if (time.kind === "future") foundSpecified = true;
      if (time.kind === "today") foundToday = true;
      idx -= time.consumed;
      continue;
    }
    idx -= 1;
  }

  idx = verbIndex + 1;
  while (idx < tokens.length) {
    if (isBoundary(idx)) break;
    const time = matchTimeMarkerAt(tokens, idx, sourceLang);
    if (time) {
      if (time.kind === "future") foundSpecified = true;
      if (time.kind === "today") foundToday = true;
      idx += time.consumed;
      continue;
    }
    idx += 1;
  }

  if (foundSpecified) return "tomorrow";
  if (foundToday) return "same-day";
  return "unknown";
}
