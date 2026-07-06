import { LanguageMode } from "@/app/components/types/components.type";
import {
  ExplanationKey,
  ExplanationPayload,
  TranslationPart,
  TranslationResult,
  VariantGroup,
  VariantScope,
} from "../core/types";
import { renderExplanationList } from "../explanations";
import { finalizePart } from "./parts";

export type SubjectInsertMode = "start" | "after-first" | "after-marker";
export type LocativeDeterminerMode = "present" | "non-present";
const LOCATIVE_DETERMINER_SLOT = "locative-determiner";
const LOCATIVE_DETERMINER_THAT_SLOT = "locative-determiner-that";
let activeLocativeDeterminerMode: LocativeDeterminerMode | null = null;

export function setLocativeDeterminerMode(
  mode: LocativeDeterminerMode | null
): void {
  activeLocativeDeterminerMode = mode;
}

type AppendPartsFn = (
  combos: TranslationResult["combinations"],
  parts: TranslationPart[],
  scope?: VariantScope
) => TranslationResult["combinations"];

export function buildBranches(
  parts: TranslationPart[],
  objectSequences: TranslationPart[][],
  options?: { locativeDeterminerMode?: LocativeDeterminerMode }
): TranslationPart[][] {
  const branches = objectSequences.map((objectSeq) => [...parts, ...objectSeq]);
  const mode =
    options?.locativeDeterminerMode ??
    activeLocativeDeterminerMode ??
    inferLocativeDeterminerMode(parts);
  if (!mode) return branches;
  return branches.map((branch) => applyLocativeDeterminerMode(branch, mode));
}

const inferLocativeDeterminerMode = (
  parts: TranslationPart[]
): LocativeDeterminerMode => {
  let hasPresent = false;
  for (const part of parts) {
    const explanations = part.explanations ?? [];
    for (const exp of explanations) {
      const key = exp.key;
      if (
        key.startsWith("VERB_PAST") ||
        key.startsWith("VERB_FUTURE") ||
        key.startsWith("VERB_IMPERATIVE") ||
        key === "VERB_INFINITIVE"
      ) {
        return "non-present";
      }
      if (
        key.startsWith("VERB_PRESENT") ||
        key.startsWith("VERB_GERUND")
      ) {
        hasPresent = true;
      }
    }
  }
  return hasPresent ? "present" : "present";
};

const applyLocativeDeterminerMode = (
  parts: TranslationPart[],
  mode: LocativeDeterminerMode
): TranslationPart[] =>
  parts.map((part) => {
    if (
      part.slotId !== LOCATIVE_DETERMINER_SLOT &&
      part.slotId !== LOCATIVE_DETERMINER_THAT_SLOT
    ) {
      return part;
    }
    const isThat = part.slotId === LOCATIVE_DETERMINER_THAT_SLOT;
    const explanationGup = isThat
      ? mode === "present"
        ? "dhiyali"
        : "dhuwali"
      : mode === "present"
        ? "dhuwala"
        : "dhiyala";
    const nextExplanations: ExplanationPayload[] = [
      ...(part.explanations ?? []).filter((exp) => exp.key !== "ARTICLE_DEFINITE"),
      {
        key: "ARTICLE_DEFINITE" as ExplanationKey,
        data: { token: part.source, gup: explanationGup },
      },
    ];
    const inferredLang: LanguageMode =
      part.explanation?.includes("Artículo") ? "es" : "en";
    const nextExplanation = renderExplanationList(
      nextExplanations as ExplanationPayload[],
      inferredLang
    );
    const finalize = (overrides: Partial<TranslationPart>): TranslationPart =>
      finalizePart(
        {
          ...part,
          ...overrides,
          explanations: nextExplanations,
        },
        inferredLang
      );
    if (isThat) {
      nextExplanations.push({
        key: "DEMONSTRATIVE_THAT_VISIBILITY" as ExplanationKey,
      });
      if (mode === "present") {
        return finalize({
          gup: "dhiyali",
          output: "dhiyali",
          alternatives: [
            { gup: "ŋunhili" },
            { gup: "ŋunhala" },
            { gup: "ŋunhiliŋumi" },
            { gup: "ŋunhilimi" },
          ],
          explanation: nextExplanation,
        });
      }
      return finalize({
        gup: "dhuwali",
        output: "dhuwali",
        alternatives: [{ gup: "ŋunhi" }, { gup: "ŋunha" }],
        explanation: nextExplanation,
      });
    }
    if (mode === "present") {
      return finalize({
        gup: "dhuwala",
        output: "dhuwala",
        alternatives: undefined,
        explanation: nextExplanation,
      });
    }
    return finalize({
      gup: "dhiyala",
      output: "dhiyala",
      alternatives: [{ gup: "dhiyalaŋumi" }],
      explanation: nextExplanation,
    });
  });

const partsMatch = (left: TranslationPart, right: TranslationPart): boolean =>
  left.gup === right.gup &&
  left.type === right.type &&
  left.meaningKey === right.meaningKey;

export function stripTrailingSequences(
  parts: TranslationPart[],
  sequences: TranslationPart[][] | null
): TranslationPart[] {
  if (!sequences || sequences.length === 0) return parts;
  for (const seq of sequences) {
    if (seq.length === 0 || parts.length < seq.length) continue;
    let matches = true;
    for (let idx = 0; idx < seq.length; idx += 1) {
      const part = parts[parts.length - seq.length + idx];
      if (!part || !partsMatch(part, seq[idx])) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return parts.slice(0, parts.length - seq.length);
    }
  }
  return parts;
}

export function insertSubjectIntoBranch(
  branch: TranslationPart[],
  subjectPart: TranslationPart,
  mode: SubjectInsertMode
): TranslationPart[] {
  const partsWithSubject = [...branch];
  if (mode === "after-first") {
    partsWithSubject.splice(1, 0, subjectPart);
    return partsWithSubject;
  }
  if (mode === "after-marker") {
    if (partsWithSubject[0]?.gup === "barpuru") {
      partsWithSubject.splice(1, 0, subjectPart);
    } else {
      partsWithSubject.unshift(subjectPart);
    }
    return partsWithSubject;
  }
  partsWithSubject.unshift(subjectPart);
  return partsWithSubject;
}

export function expandBranchesWithSubject(
  branchList: TranslationPart[][],
  options: {
    append: AppendPartsFn;
    combos: TranslationResult["combinations"];
    hasSubjectInCombos: boolean;
    subjectInsertMode: SubjectInsertMode;
    variantGroup?: VariantGroup | null;
    scope?: VariantScope;
    skipInsertWhen?: (branch: TranslationPart[]) => boolean;
  }
): TranslationResult["combinations"] {
  const scope = options.scope ?? "dropdown";
  let expanded: TranslationResult["combinations"] = [];
  if (options.hasSubjectInCombos) {
    const baseCombos = options.combos.map((combo) => ({
      ...combo,
      parts: combo.parts.slice(0, -1),
      variantGroup: options.variantGroup ?? combo.variantGroup,
    }));
    const subjectPartsFromCombos = options.combos.map(
      (combo) => combo.parts[combo.parts.length - 1]
    );
    for (const branch of branchList) {
      if (options.skipInsertWhen?.(branch)) {
        expanded = expanded.concat(
          options.append(baseCombos, branch, scope)
        );
        continue;
      }
      for (let idx = 0; idx < baseCombos.length; idx += 1) {
        const subjectPart = subjectPartsFromCombos[idx];
        const partsWithSubject = insertSubjectIntoBranch(
          branch,
          subjectPart,
          options.subjectInsertMode
        );
        expanded = expanded.concat(
          options.append([baseCombos[idx]], partsWithSubject, scope)
        );
      }
    }
  } else {
    const baseCombos = options.variantGroup
      ? options.combos.map((combo) => ({
          ...combo,
          variantGroup: options.variantGroup ?? combo.variantGroup,
        }))
      : options.combos;
    for (const branch of branchList) {
      expanded = expanded.concat(options.append(baseCombos, branch, scope));
    }
  }
  return expanded;
}
