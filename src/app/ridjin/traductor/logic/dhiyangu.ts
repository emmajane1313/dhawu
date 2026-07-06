import { LanguageMode } from "@/app/components/types/components.type";
import type { TranslationPart } from "../core/types";
import { matchDemonstrativeToken } from "./demonstratives";
import { matchArticleAt, isOtherGroupPatternAt } from "./lexiconMatch";
import { buildDefiniteArticlePart } from "./parts";
import type { TokenLike } from "./tokenUtils";

const addThatVisibilityNote = (part: TranslationPart): TranslationPart => ({
  ...part,
  explanations: [
    ...(part.explanations ?? []),
    { key: "DEMONSTRATIVE_THAT_VISIBILITY" },
  ],
});

function buildDhiyaNguPart(
  gup: string,
  source: string,
  sourceLang: LanguageMode,
  alternatives?: string[]
): TranslationPart {
  return {
    ...buildDefiniteArticlePart(gup, source, sourceLang),
    alternatives: alternatives?.map((alt) => ({ gup: alt })),
  };
}

export type DhiyaNguMatch = {
  part: TranslationPart | null;
  consumed: number;
  source: string;
};

export function matchDhiyaNguDeterminerAt(
  tokens: TokenLike[],
  index: number,
  sourceLang: LanguageMode
): DhiyaNguMatch | null {
  const token = tokens[index];
  if (!token) return null;
  const demoMatch = matchDemonstrativeToken(token.source, sourceLang);
  if (demoMatch) {
    if (demoMatch.kind === "that") {
      const part = addThatVisibilityNote(
        buildDhiyaNguPart("dhiyaŋi", token.source, sourceLang, [
          "ŋuriŋi",
          "ŋuruŋu",
        ])
      );
      return {
        part,
        consumed: 1,
        source: token.source,
      };
    }
    return {
      part: buildDhiyaNguPart("dhiyaŋu", token.source, sourceLang),
      consumed: 1,
      source: token.source,
    };
  }
  const articleMatch = matchArticleAt(tokens, index, sourceLang);
  if (articleMatch && !isOtherGroupPatternAt(tokens, index, sourceLang)) {
    if (articleMatch.kind === "definite") {
      return {
        part: buildDefiniteArticlePart(
          "dhiyaŋu",
          articleMatch.source,
          sourceLang
        ),
        consumed: articleMatch.consumed,
        source: articleMatch.source,
      };
    }
    return {
      part: null,
      consumed: articleMatch.consumed,
      source: articleMatch.source,
    };
  }
  return null;
}
