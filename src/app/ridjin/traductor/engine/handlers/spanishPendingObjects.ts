import { LanguageMode } from "@/app/components/types/components.type";
import type { IRSentence } from "../../core/types";
import { matchObjectPronoun } from "../../rules/objectPronoun";
import { matchVerbAt } from "../../rules/verb";
import {
  matchArticleAt,
  matchNounAt,
  NounMatch,
} from "../../logic/lexiconMatch";
import { matchAuxiliaryGerundAt } from "../../logic/verbAux";
import {
  emitObjectTrace,
  matchNounPhraseAfterArticle,
  matchObjectPronounAfterA,
} from "../../logic/objects";
import { isStrongPunctuationToken, normalizeToken } from "../../logic/tokenUtils";
import type { TranslateState } from "../types";
import { debugLog } from "../debug";

export function handleSpanishPendingObjects(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, state } = args;
  debugLog("[ridjin-debug] spanishPending", {
    index,
    token: ir.tokens[index]?.source,
  });
  if (sourceLang !== "es") return { handled: false };

  const token = ir.tokens[index];
  const normalized = normalizeToken(token.source, sourceLang);
  if (normalized === "a") {
    emitObjectTrace(`spanishPending@${index} saw "a"`);
    const nounStart = index + 1;
    const nounToken = ir.tokens[nounStart];
    if (nounToken && !isStrongPunctuationToken(nounToken)) {
      const pronounAfterA = matchObjectPronounAfterA(
        nounToken.source,
        sourceLang
      );
      if (pronounAfterA) {
        emitObjectTrace(
          `spanishPending pronoun after a: ${nounToken.source}`
        );
        const verbIndex = nounStart + 1;
        const auxMatch = matchAuxiliaryGerundAt(
          ir.tokens,
          verbIndex,
          sourceLang
        );
        const verbMatch = matchVerbAt(ir.tokens, verbIndex, sourceLang);
        const targetIndex = auxMatch
          ? auxMatch.gerundIndex
          : verbMatch.length > 0
            ? verbIndex
            : null;
        if (targetIndex !== null) {
          emitObjectTrace(
            `spanishPending set pronoun at ${index}-${nounStart} -> verbIndex ${targetIndex}`
          );
          state.pendingObject = {
            kind: "pronoun",
            match: pronounAfterA,
            spanStart: index,
            spanEnd: nounStart,
          };
          state.pendingObjectIndex = targetIndex;
          return { handled: true, nextIndex: index + 1 };
        }
      }
      let nounMatch: NounMatch | null = null;
      let consumed = 0;
      const articleMatch = matchArticleAt(ir.tokens, nounStart, sourceLang);
      if (articleMatch) {
        const phrase = matchNounPhraseAfterArticle(
          ir.tokens,
          nounStart + articleMatch.consumed,
          sourceLang
        );
        if (phrase) {
          emitObjectTrace(
            `spanishPending noun phrase after article: consumed=${phrase.consumed}`
          );
          nounMatch = phrase.noun;
          consumed = articleMatch.consumed + phrase.consumed;
        }
      }
      if (!nounMatch && !articleMatch) {
        const directNoun = matchNounAt(ir.tokens, nounStart, sourceLang);
        nounMatch = directNoun
          ? directNoun
          : {
              gup: nounToken.source,
              isHuman: true,
              consumed: 1,
              source: nounToken.source,
            };
        consumed = directNoun?.consumed ?? 1;
      }
      if (nounMatch) {
        emitObjectTrace(
          `spanishPending noun after a: ${nounMatch.source} consumed=${consumed}`
        );
        if (!nounMatch.entry?.isPlace) {
          const verbIndex = nounStart + consumed;
          const auxMatch = matchAuxiliaryGerundAt(
            ir.tokens,
            verbIndex,
            sourceLang
          );
          const verbMatch = matchVerbAt(ir.tokens, verbIndex, sourceLang);
          const targetIndex = auxMatch
            ? auxMatch.gerundIndex
            : verbMatch.length > 0
              ? verbIndex
              : null;
          if (targetIndex !== null) {
            emitObjectTrace(
              `spanishPending set noun at ${index}-${nounStart + consumed - 1} -> verbIndex ${targetIndex}`
            );
            state.pendingObject = {
              kind: "noun",
              match: { ...nounMatch, isHuman: true },
              forceHuman: true,
              allowAlternatives: false,
              spanStart: index,
              spanEnd: nounStart + consumed - 1,
            };
            state.pendingObjectIndex = targetIndex;
            return { handled: true, nextIndex: index + consumed };
          }
        }
      }
    }
  }

  const objectBefore = matchObjectPronoun(token.source, sourceLang);
  if (objectBefore && !state.pendingObject) {
    const verbMatchesNext = ir.tokens[index + 1]
      ? matchVerbAt(ir.tokens, index + 1, sourceLang)
      : [];
    if (verbMatchesNext.length > 0) {
      state.pendingObject = {
        kind: "pronoun",
        match: objectBefore,
        spanStart: index,
        spanEnd: index,
      };
      state.pendingObjectIndex = index + 1;
      return { handled: true };
    }
    const auxMatch = ir.tokens[index + 1]
      ? matchAuxiliaryGerundAt(ir.tokens, index + 1, sourceLang)
      : null;
    if (auxMatch) {
      state.pendingObject = {
        kind: "pronoun",
        match: objectBefore,
        spanStart: index,
        spanEnd: index,
      };
      state.pendingObjectIndex = auxMatch.gerundIndex;
      return { handled: true };
    }
  }

  return { handled: false };
}
