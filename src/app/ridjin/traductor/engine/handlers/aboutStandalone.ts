import { LanguageMode } from "@/app/components/types/components.type";
import type { IRSentence, TranslationPart } from "../../core/types";
import {
  matchBelongingAboutPhraseAt,
  matchLocativePhraseAt,
  matchAblativePhraseAt,
  shouldAllowAboutLocativeAlt,
} from "../../logic/objects";
import type { TranslateHelpers, TranslateState } from "../types";

export function handleStandaloneAbout(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, state, helpers } = args;
  const aboutMatch = matchBelongingAboutPhraseAt(ir.tokens, index, sourceLang);
  if (!aboutMatch) return { handled: false };

  const baseCombos = state.combinations;
  const needsDropdown = aboutMatch.hasAmbiguity || aboutMatch.sequences.length > 1;
  const baseGroup = needsDropdown ? helpers.nextVariantGroup("dropdown") : null;
  const baseWithGroup = baseGroup
    ? baseCombos.map((combo) => ({
        ...combo,
        variantGroup: baseGroup,
      }))
    : baseCombos;

  let expanded: typeof state.combinations = [];
  for (const seq of aboutMatch.sequences) {
    expanded = expanded.concat(
      helpers.appendPartsToCombinations(baseWithGroup, seq, "dropdown")
    );
  }

  const altSequences: TranslationPart[][] = [];
  if (shouldAllowAboutLocativeAlt(aboutMatch.preposition, sourceLang)) {
    const locativeAlt = matchLocativePhraseAt(ir.tokens, index, sourceLang);
    if (locativeAlt) {
      altSequences.push(...locativeAlt.sequences);
    }
    const ablativeAlt = matchAblativePhraseAt(ir.tokens, index, sourceLang);
    if (ablativeAlt) {
      altSequences.push(...ablativeAlt.sequences);
    }
  }

  if (altSequences.length > 0) {
    const altGroup = helpers.nextVariantGroup("box");
    const altBase = baseCombos.map((combo) => ({
      ...combo,
      variantGroup: altGroup,
    }));
    let expandedAlt: typeof state.combinations = [];
    for (const seq of altSequences) {
      expandedAlt = expandedAlt.concat(
        helpers.appendPartsToCombinations(altBase, seq, "dropdown")
      );
    }
    expanded = [...expanded, ...expandedAlt];
  }

  state.combinations = expanded;
  if (aboutMatch.hasAmbiguity || altSequences.length > 0) {
    state.hasAmbiguity = true;
  }
  return { handled: true, nextIndex: index + aboutMatch.consumed - 1 };
}
