import { LanguageMode } from "@/app/components/types/components.type";
import { buildIR } from "./core/pipeline";
import {
  ExplanationKey,
  LanguageId,
  TranslationCombination,
  TranslationPart,
  TranslationResult,
} from "./core/types";
import { getLanguagePack } from "./lang";
import { getNegationPatterns } from "./logic/negation";
import type { PendingObject } from "./logic/objects";
import { handleVerbMatches } from "./engine/handlers/verb";
import { handleAuxGerund } from "./engine/handlers/auxGerund";
import { handleNegation } from "./engine/handlers/negation";
import { handleToInfinitive } from "./engine/handlers/toInfinitive";
import { handleSimultaneousVerb } from "./engine/handlers/simultaneous";
import { handleSubjects } from "./engine/handlers/subjects";
import { handleCopula } from "./engine/handlers/copula";
import { handleTimeMarker } from "./engine/handlers/timeMarker";
import {
  collectHabitualMarkerIndices,
  collectPastHabitualMarkerIndices,
} from "./logic/habitual";
import { collectMightMarkerIndices } from "./logic/might";
import { collectShouldMarkerIndices } from "./logic/should";
import { collectShouldHaveMarkerIndices } from "./logic/shouldHave";
import { isNegatorToken } from "./logic/negation";
import { handleSpanishPendingObjects } from "./engine/handlers/spanishPendingObjects";
import { handleArticles } from "./engine/handlers/articles";
import { handleModalStandalone } from "./engine/handlers/modalStandalone";
import { handleConnector } from "./engine/handlers/connectors";
import { handleUnknown } from "./engine/handlers/unknown";
import { handleStandaloneAbout } from "./engine/handlers/aboutStandalone";
import { hasExclamation } from "./engine/shared";
import { createTranslateHelpers } from "./engine/helpers";
import type { SubjectContext, TranslateHelpers, TranslateState } from "./engine/types";
import { debugLog, setDebugEnabled } from "./engine/debug";
import { finalizePart } from "./logic/parts";

const DEFAULT_TARGET_LANG: LanguageId = "gup";
let engineTraceCollector: ((message: string) => void) | null = null;

export function setEngineTraceCollector(
  collector: ((message: string) => void) | null
) {
  engineTraceCollector = collector;
}

export function translate(
  input: string,
  sourceLang: LanguageMode
): TranslationResult {
  setDebugEnabled(true);
  const ir = buildIR(input, sourceLang, DEFAULT_TARGET_LANG);
  debugLog(
    "[ridjin-debug] input",
    input,
    "tokens",
    ir.tokens.map((token, idx) => ({
      idx,
      source: token.source,
      normalized: token.normalized,
    }))
  );
  const pack = getLanguagePack(sourceLang);
  const dualMarkers = (pack.dualMarkers ?? []).map((marker) =>
    pack.normalize(marker)
  );
  const negationPatterns = getNegationPatterns(sourceLang);
  let dropdownCounter = 0;
  let boxCounter = 0;
  const nextDropdownId = () => `dropdown-${dropdownCounter++}`;
  const nextBoxId = () => `box-${boxCounter++}`;

  let combinations: TranslationResult["combinations"] = [
    {
      output: "",
      parts: [],
      score: 0,
    },
  ];
  let hasAmbiguity = false;
  let lastSubject: SubjectContext | null = null;
  let lastVerbSubject: SubjectContext | null = null;
  let pendingObject: PendingObject | null = null;
  let pendingObjectIndex: number | null = null;
  let lastConnectorAnchor: number | null = null;
  let pendingSubjectJoin = false;
  const skipIndices = new Set<number>();
  const state: TranslateState = {
    get combinations() {
      return combinations;
    },
    set combinations(value) {
      combinations = value;
    },
    get hasAmbiguity() {
      return hasAmbiguity;
    },
    set hasAmbiguity(value) {
      hasAmbiguity = value;
    },
    get lastSubject() {
      return lastSubject;
    },
    set lastSubject(value) {
      lastSubject = value;
    },
    get lastVerbSubject() {
      return lastVerbSubject;
    },
    set lastVerbSubject(value) {
      lastVerbSubject = value;
    },
    get pendingObject() {
      return pendingObject;
    },
    set pendingObject(value) {
      pendingObject = value;
    },
    get pendingObjectIndex() {
      return pendingObjectIndex;
    },
    set pendingObjectIndex(value) {
      pendingObjectIndex = value;
    },
    get lastConnectorAnchor() {
      return lastConnectorAnchor;
    },
    set lastConnectorAnchor(value) {
      lastConnectorAnchor = value;
    },
    get pendingSubjectJoin() {
      return pendingSubjectJoin;
    },
    set pendingSubjectJoin(value) {
      pendingSubjectJoin = value;
    },
    skipIndices,
  };

  const helpers: TranslateHelpers = createTranslateHelpers({
    sourceLang,
    state,
    nextDropdownId,
    nextBoxId,
    hasExclamation,
  });
  const habitualMarkerIndices = collectHabitualMarkerIndices(
    ir.tokens,
    sourceLang
  );
  const pastHabitualMarkerIndices = collectPastHabitualMarkerIndices(
    ir.tokens,
    sourceLang
  );
  const mightMarkerIndices = collectMightMarkerIndices(ir.tokens, sourceLang);
  const shouldMarkerIndices = collectShouldMarkerIndices(
    ir.tokens,
    sourceLang
  );
  const shouldHaveMarkerIndices = collectShouldHaveMarkerIndices(
    ir.tokens,
    sourceLang
  );
  const negatorIndices = new Set<number>();
  for (let i = 0; i < ir.tokens.length; i += 1) {
    if (isNegatorToken(ir.tokens[i], sourceLang)) {
      negatorIndices.add(i);
    }
  }
  for (const idx of habitualMarkerIndices) {
    const isNegator = isNegatorToken(ir.tokens[idx], sourceLang);
    if (isNegator && negatorIndices.size <= 1) {
      continue;
    }
    skipIndices.add(idx);
  }
  for (const idx of pastHabitualMarkerIndices) {
    if (!skipIndices.has(idx)) {
      skipIndices.add(idx);
    }
  }
  for (const idx of mightMarkerIndices) {
    if (!skipIndices.has(idx)) {
      skipIndices.add(idx);
    }
  }
  for (const idx of shouldMarkerIndices) {
    if (!skipIndices.has(idx)) {
      skipIndices.add(idx);
    }
  }
  for (const idx of shouldHaveMarkerIndices) {
    const isNegator = isNegatorToken(ir.tokens[idx], sourceLang);
    if (isNegator) {
      continue;
    }
    if (!skipIndices.has(idx)) {
      skipIndices.add(idx);
    }
  }
  const traceEngine = (message: string) => {
    if (engineTraceCollector) {
      engineTraceCollector(message);
    }
  };

  for (let i = 0; i < ir.tokens.length; i += 1) {
    const token = ir.tokens[i];
    const nextToken = ir.tokens[i + 1];
    const nextNormalized = nextToken ? pack.normalize(nextToken.source) : "";
    const hasDualMarker = nextToken && dualMarkers.includes(nextNormalized);
    debugLog("[ridjin-debug] loop", {
      index: i,
      token: token?.source,
    });

    if (skipIndices.has(i)) {
      traceEngine(`skip index=${i} token="${token?.source ?? ""}"`);
      continue;
    }

    const timeMarkerResult = handleTimeMarker({
      ir,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (timeMarkerResult.handled) {
      traceEngine(
        `handler=timeMarker index=${i} token="${token.source}" nextIndex=${timeMarkerResult.nextIndex ?? ""}`
      );
      if (timeMarkerResult.nextIndex !== undefined) {
        i = timeMarkerResult.nextIndex;
      }
      continue;
    }
    // future markers are handled via time markers

    if (pendingObjectIndex !== null && i > pendingObjectIndex) {
      pendingObject = null;
      pendingObjectIndex = null;
    }

    const pendingObjectResult = handleSpanishPendingObjects({
      ir,
      index: i,
      sourceLang,
      state,
    });
    if (pendingObjectResult.handled) {
      traceEngine(
        `handler=spanishPendingObjects index=${i} token="${token.source}" nextIndex=${pendingObjectResult.nextIndex ?? ""}`
      );
      if (pendingObjectResult.nextIndex !== undefined) {
        i = pendingObjectResult.nextIndex;
      }
      continue;
    }

    const articleResult = handleArticles({
      ir,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (articleResult.handled) {
      traceEngine(
        `handler=articles index=${i} token="${token.source}" nextIndex=${articleResult.nextIndex ?? ""}`
      );
      if (articleResult.nextIndex !== undefined) {
        i = articleResult.nextIndex;
      }
      continue;
    }

    const standaloneAboutResult = handleStandaloneAbout({
      ir,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (standaloneAboutResult.handled) {
      traceEngine(
        `handler=aboutStandalone index=${i} token="${token.source}" nextIndex=${standaloneAboutResult.nextIndex ?? ""}`
      );
      if (standaloneAboutResult.nextIndex !== undefined) {
        i = standaloneAboutResult.nextIndex;
      }
      continue;
    }

    const subjectResult = handleSubjects({
      ir,
      index: i,
      sourceLang,
      hasDualMarker,
      nextTokenSource: nextToken?.source,
      state,
      helpers,
    });
    if (subjectResult.handled) {
      debugLog("[ridjin-debug] handled=subjects", {
        index: i,
        token: token?.source,
        nextIndex: subjectResult.nextIndex,
      });
      traceEngine(
        `handler=subjects index=${i} token="${token.source}" nextIndex=${subjectResult.nextIndex ?? ""}`
      );
      if (subjectResult.nextIndex !== undefined) {
        i = subjectResult.nextIndex;
      }
      continue;
    }

    const copulaResult = handleCopula({
      ir,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (copulaResult.handled) {
      debugLog("[ridjin-debug] handled=copula", {
        index: i,
        token: token?.source,
        nextIndex: copulaResult.nextIndex,
      });
      traceEngine(
        `handler=copula index=${i} token="${token.source}" nextIndex=${copulaResult.nextIndex ?? ""}`
      );
      if (copulaResult.nextIndex !== undefined) {
        i = copulaResult.nextIndex;
      }
      continue;
    }

    const negationResult = handleNegation({
      ir,
      index: i,
      sourceLang,
      negationPatterns,
      state,
      helpers,
    });
    if (negationResult.handled) {
      debugLog("[ridjin-debug] handled=negation", {
        index: i,
        token: token?.source,
        nextIndex: negationResult.nextIndex,
      });
      traceEngine(
        `handler=negation index=${i} token="${token.source}" nextIndex=${negationResult.nextIndex ?? ""}`
      );
      if (negationResult.nextIndex !== undefined) {
        i = negationResult.nextIndex;
      }
      continue;
    }

    const modalResult = handleModalStandalone({
      ir,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (modalResult.handled) {
      debugLog("[ridjin-debug] handled=modalStandalone", {
        index: i,
        token: token?.source,
        nextIndex: modalResult.nextIndex,
      });
      traceEngine(
        `handler=modalStandalone index=${i} token="${token.source}" nextIndex=${modalResult.nextIndex ?? ""}`
      );
      if (modalResult.nextIndex !== undefined) {
        i = modalResult.nextIndex;
      }
      continue;
    }

    const toInfResult = handleToInfinitive({
      ir,
      token,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (toInfResult.handled) {
      debugLog("[ridjin-debug] handled=toInfinitive", {
        index: i,
        token: token?.source,
        nextIndex: toInfResult.nextIndex,
      });
      traceEngine(
        `handler=toInfinitive index=${i} token="${token.source}" nextIndex=${toInfResult.nextIndex ?? ""}`
      );
      if (toInfResult.nextIndex !== undefined) {
        i = toInfResult.nextIndex;
      }
      continue;
    }

    const auxResult = handleAuxGerund({
      ir,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (auxResult.handled) {
      debugLog("[ridjin-debug] handled=auxGerund", {
        index: i,
        token: token?.source,
        nextIndex: auxResult.nextIndex,
      });
      traceEngine(
        `handler=auxGerund index=${i} token="${token.source}" nextIndex=${auxResult.nextIndex ?? ""}`
      );
      if (auxResult.nextIndex !== undefined) {
        i = auxResult.nextIndex;
      }
      continue;
    }

    const simultaneousResult = handleSimultaneousVerb({
      ir,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (simultaneousResult.handled) {
      debugLog("[ridjin-debug] handled=simultaneous", {
        index: i,
        token: token?.source,
        nextIndex: simultaneousResult.nextIndex,
      });
      traceEngine(
        `handler=simultaneous index=${i} token="${token.source}" nextIndex=${simultaneousResult.nextIndex ?? ""}`
      );
      if (simultaneousResult.nextIndex !== undefined) {
        i = simultaneousResult.nextIndex;
      }
      continue;
    }

    const verbResult = handleVerbMatches({
      ir,
      token,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (verbResult.handled) {
      debugLog("[ridjin-debug] handled=verb", {
        index: i,
        token: token?.source,
        nextIndex: verbResult.nextIndex,
      });
      traceEngine(
        `handler=verb index=${i} token="${token.source}" nextIndex=${verbResult.nextIndex ?? ""}`
      );
      if (verbResult.nextIndex !== undefined) {
        i = verbResult.nextIndex;
      }
      continue;
    }

    // modalStandalone already handled earlier in the pipeline

    const connectorResult = handleConnector({
      ir,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    if (connectorResult.handled) {
      debugLog("[ridjin-debug] handled=connector", {
        index: i,
        token: token?.source,
        nextIndex: connectorResult.nextIndex,
      });
      traceEngine(
        `handler=connector index=${i} token="${token.source}" nextIndex=${connectorResult.nextIndex ?? ""}`
      );
      if (connectorResult.nextIndex !== undefined) {
        i = connectorResult.nextIndex;
      }
      continue;
    }

    handleUnknown({
      ir,
      index: i,
      sourceLang,
      state,
      helpers,
    });
    debugLog("[ridjin-debug] handled=unknown", {
      index: i,
      token: token?.source,
    });
    traceEngine(
      `handler=unknown index=${i} token="${token.source}"`
    );
    continue;
  }

  const RAW_ALT_KEY: ExplanationKey = "PARTICIPLE_ADJECTIVE_RAW_ALT";
  const expandRawParticipleBoxes = (
    combos: TranslationCombination[]
  ): { combos: TranslationCombination[]; hasAmbiguity: boolean } => {
    let hasRawAmbiguity = false;
    const expanded: TranslationCombination[] = [];
    for (const combo of combos) {
      const baseParts: TranslationPart[] = [];
      const rawOptions: { index: number; part: TranslationPart }[] = [];
      combo.parts.forEach((part, idx) => {
        const alternatives = part.alternatives ?? [];
        const rawAlt = alternatives.find(
          (alt) => alt.notePayload?.key === RAW_ALT_KEY
        );
        const filtered = rawAlt
          ? alternatives.filter((alt) => alt.notePayload?.key !== RAW_ALT_KEY)
          : alternatives;
        const basePart =
          rawAlt && filtered !== alternatives
            ? { ...part, alternatives: filtered.length > 0 ? filtered : undefined }
            : part;
        baseParts[idx] = basePart;
        if (rawAlt) {
          const altExplanations = [{ key: RAW_ALT_KEY as ExplanationKey }];
          const altPart = finalizePart(
            {
              ...basePart,
              gup: rawAlt.gup,
              output: rawAlt.gup,
              explanation: "",
              explanations: altExplanations,
            },
            sourceLang
          );
          rawOptions.push({ index: idx, part: altPart });
        }
      });
      const baseCombo: TranslationCombination = {
        ...combo,
        parts: baseParts,
      };
      expanded.push(baseCombo);
      if (rawOptions.length === 0) continue;
      hasRawAmbiguity = true;
      const groupId = { scope: "box" as const, id: nextBoxId() };
      const buildCombos = (
        pos: number,
        parts: TranslationPart[],
        used: boolean
      ) => {
        if (pos >= rawOptions.length) {
          if (used) {
            expanded.push({
              ...combo,
              parts,
              variantGroup: groupId,
            });
          }
          return;
        }
        const option = rawOptions[pos];
        // keep base part
        buildCombos(pos + 1, parts, used);
        // replace with raw alternative
        const nextParts = parts.slice();
        nextParts[option.index] = option.part;
        buildCombos(pos + 1, nextParts, true);
      };
      buildCombos(0, baseParts.slice(), false);
    }
    return { combos: expanded, hasAmbiguity: hasRawAmbiguity };
  };

  const rawExpanded = expandRawParticipleBoxes(combinations);
  combinations = rawExpanded.combos;
  if (rawExpanded.hasAmbiguity) {
    hasAmbiguity = true;
  }

  const combinationsWithOutput = combinations.map((combo) => ({
    ...combo,
    output: combo.parts.map((part) => part.gup).join(" "),
  }));
  const normalizedCombinations = normalizeVariantGroups(combinationsWithOutput);

  return {
    combinations: normalizedCombinations,
    hasAmbiguity,
  };
}

function normalizeVariantGroups(
  combos: TranslationResult["combinations"]
): TranslationResult["combinations"] {
  const groupOutputs = new Map<
    string,
    { scope: string; outputs: Set<string> }
  >();
  const baseOutputs = new Set<string>();
  for (const combo of combos) {
    if (!combo.variantGroup) continue;
    const key = `${combo.variantGroup.scope}|${combo.variantGroup.id}`;
    const entry = groupOutputs.get(key) ?? {
      scope: combo.variantGroup.scope,
      outputs: new Set<string>(),
    };
    if (combo.output) {
      entry.outputs.add(combo.output);
    }
    groupOutputs.set(key, entry);
  }
  for (const combo of combos) {
    if (combo.variantGroup) continue;
    if (combo.output) baseOutputs.add(combo.output);
  }

  const signatureToCanonical = new Map<string, string>();
  const groupAlias = new Map<string, string>();
  for (const [key, entry] of groupOutputs) {
    const outputs = Array.from(entry.outputs).sort();
    const signature = `${entry.scope}|${outputs.join("||")}`;
    const existing = signatureToCanonical.get(signature);
    if (existing) {
      groupAlias.set(key, existing);
    } else {
      signatureToCanonical.set(signature, key);
    }
  }

  const normalized = groupAlias.size
    ? combos.map((combo) => {
        if (!combo.variantGroup) return combo;
        const key = `${combo.variantGroup.scope}|${combo.variantGroup.id}`;
        const alias = groupAlias.get(key);
        if (!alias) return combo;
        const [, id] = alias.split("|");
        if (id === combo.variantGroup.id) return combo;
        return {
          ...combo,
          variantGroup: { ...combo.variantGroup, id },
        };
      })
    : combos;

  const redundantGroups = new Set<string>();
  if (baseOutputs.size > 0) {
    for (const [key, entry] of groupOutputs) {
      if (entry.outputs.size === 0) continue;
      let isSubset = true;
      for (const output of entry.outputs) {
        if (!baseOutputs.has(output)) {
          isSubset = false;
          break;
        }
      }
      if (isSubset) {
        redundantGroups.add(key);
      }
    }
  }

  const withoutRedundant = redundantGroups.size
    ? normalized.map((combo) => {
        if (!combo.variantGroup) return combo;
        const key = `${combo.variantGroup.scope}|${combo.variantGroup.id}`;
        if (!redundantGroups.has(key)) return combo;
        return { ...combo, variantGroup: undefined };
      })
    : normalized;

  const seen = new Set<string>();
  const deduped: TranslationResult["combinations"] = [];
  for (const combo of withoutRedundant) {
    const groupKey = combo.variantGroup
      ? `${combo.variantGroup.scope}|${combo.variantGroup.id}`
      : "none";
    const key = `${groupKey}|${combo.output ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(combo);
  }
  return deduped;
}
