import { LanguageMode } from "@/app/components/types/components.type";
import { ExplanationPayload, LanguageId, TranslationPart } from "../core/types";
import { getLanguagePack } from "../lang";
import { finalizePart } from "./parts";
import { matchMarkerAt } from "./lexiconMatch";
import { TokenLike, normalizeToken } from "./tokenUtils";

export type ConnectorMatch = {
  consumed: number;
  kind: "word" | "comma";
  source: string;
};

const CONNECTOR_PHRASES: Record<LanguageMode, string[][]> = {
  es: [
    ["y"],
    ["e"],
    ["también"],
    ["tambien"],
    ["tampoco"],
    ["además"],
    ["ademas"],
    ["igualmente"],
    ["asimismo"],
    ["ni"],
  ],
  en: [
    ["and"],
    ["also"],
    ["too"],
    ["as", "well"],
    ["neither"],
    ["nor"],
  ],
};

export function matchConnectorAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): ConnectorMatch | null {
  const token = tokens[index];
  if (!token) return null;
  const raw = token.source.trim();
  if (raw === "," || raw === "，") {
    return { consumed: 1, kind: "comma", source: raw };
  }
  const phrases = CONNECTOR_PHRASES[sourceLang] ?? [];
  for (const phrase of phrases) {
    let matches = true;
    for (let offset = 0; offset < phrase.length; offset += 1) {
      const candidate = tokens[index + offset];
      if (!candidate) {
        matches = false;
        break;
      }
      const normalized = normalizeToken(candidate.source, sourceLang);
      if (normalized !== phrase[offset]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return {
        consumed: phrase.length,
        kind: "word",
        source: tokens
          .slice(index, index + phrase.length)
          .map((item) => item.source)
          .join(" "),
      };
    }
  }
  return null;
}

export function isListConnectorToken(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  const connector = matchConnectorAt(tokens, index, sourceLang);
  if (connector) return true;
  const marker = matchMarkerAt(tokens, index, sourceLang);
  if (marker?.entry.pos === "connector" && marker.entry.connectorRole === "list") {
    return true;
  }
  const pack = getLanguagePack(sourceLang);
  const normalized = pack.normalize(tokens[index]?.source ?? "");
  return (pack.conjunctions ?? []).includes(normalized);
}

export function isClauseConnectorToken(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  const marker = matchMarkerAt(tokens, index, sourceLang);
  return marker?.entry.pos === "connector" && marker.entry.connectorRole === "clause";
}

export function isBreakAdverbToken(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): boolean {
  const marker = matchMarkerAt(tokens, index, sourceLang);
  return marker?.entry.pos === "adverb" && marker.entry.breaksObjectWindow === true;
}

export function isConnectorToken(
  token: TokenLike | undefined,
  lang: LanguageId
): boolean {
  if (!token) return false;
  const raw = token.source.trim();
  if (raw === "," || raw === "，") return true;
  const pack = getLanguagePack(lang);
  const normalized = pack.normalize(token.source);
  const conjunctions = (pack.conjunctions ?? []).map((item) =>
    pack.normalize(item)
  );
  return conjunctions.includes(normalized);
}

export function buildConnectorPart(
  match: ConnectorMatch,
  sourceLang: LanguageMode
): TranslationPart {
  if (match.kind === "comma") {
    return finalizePart(
      {
        type: "connector",
        source: match.source,
        gup: ",",
        output: ",",
        explanation: "",
        explanations: [{ key: "CONNECTOR_COMMA", data: { token: match.source } }],
      },
      sourceLang
    );
  }
  const explanations: ExplanationPayload[] = [
    { key: "CONNECTOR_GA", data: { token: match.source } },
  ];
  return finalizePart(
    {
      type: "connector",
      source: match.source,
      gup: "ga",
      output: "ga",
      explanation: "",
      explanations,
      meaningKey: "connector.ga",
    },
    sourceLang
  );
}
