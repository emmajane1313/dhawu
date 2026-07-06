import { LanguageMode } from "@/app/components/types/components.type";
import type { IRSentence } from "../../core/types";
import { buildConnectorPart, matchConnectorAt } from "../../logic/connectors";
import type { TranslateHelpers, TranslateState } from "../types";

export function handleConnector(args: {
  ir: IRSentence;
  index: number;
  sourceLang: LanguageMode;
  state: TranslateState;
  helpers: TranslateHelpers;
}): { handled: boolean; nextIndex?: number } {
  const { ir, index, sourceLang, state, helpers } = args;
  const connectorMatch = matchConnectorAt(ir.tokens, index, sourceLang);
  if (!connectorMatch) return { handled: false };

  const nextIndex = index + connectorMatch.consumed;
  const hasNext = Boolean(ir.tokens[nextIndex]);
  const anchorOk =
    state.lastConnectorAnchor !== null && state.lastConnectorAnchor >= index - 2;
  if (
    connectorMatch.kind === "comma" ||
    (connectorMatch.kind === "word" && anchorOk && hasNext)
  ) {
    const connectorPart = buildConnectorPart(connectorMatch, sourceLang);
    state.combinations = helpers.appendPartsToCombinations(
      state.combinations,
      [connectorPart],
      "dropdown"
    );
  }
  state.pendingSubjectJoin = Boolean(state.lastSubject);
  return { handled: true, nextIndex: index + connectorMatch.consumed - 1 };
}
