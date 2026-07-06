import { LanguageMode } from "@/app/components/types/components.type";
import type { IRSentence } from "../../core/types";
import { matchMarkerAt } from "../../logic/lexiconMatch";
import { finalizePart } from "../../logic/parts";
import type { TranslateHelpers, TranslateState } from "../types";

export function handleTimeMarker(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, state, helpers } = args;
  const timeMarker = matchMarkerAt(ir.tokens, index, sourceLang);
  if (!timeMarker) return { handled: false };
  if (!timeMarker.entry.meaningKey?.startsWith("marker.time.")) {
    return { handled: false };
  }
  const source = ir.tokens
    .slice(index, index + timeMarker.consumed)
    .map((token) => token.source)
    .join(" ");
  if (timeMarker.entry.gup) {
    const part = finalizePart(
      {
        type: "adverb",
        source,
        gup: timeMarker.entry.gup,
        output: timeMarker.entry.gup,
        explanation: "",
        explanations: [{ key: "TOKEN_PASSTHROUGH", data: { token: source } }],
        meaningKey: timeMarker.entry.meaningKey,
      },
      sourceLang
    );
    state.combinations = helpers.appendPartsToCombinations(
      state.combinations,
      [part]
    );
  }
  for (let offset = 0; offset < timeMarker.consumed; offset += 1) {
    state.skipIndices.add(index + offset);
  }
  return { handled: true, nextIndex: index + timeMarker.consumed - 1 };
}
