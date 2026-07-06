import { LanguageMode } from "@/app/components/types/components.type";
import {
  ExplanationPayload,
  TranslationAlternative,
  TranslationCombination,
  TranslationPart,
} from "../core/types";
import { finalizePart } from "./parts";
import { matchDemonstrativeToken } from "./demonstratives";

const DHIYANGU_GUP = "dhiyaŋu";
const DHIYANGI_GUP = "dhiyaŋi";
const DHUWALA_FORMS = new Set(["dhuwala", "dhuwali"]);
const DEMO_THAT_ALTS = new Set(["ŋunhi", "ŋunha", "ŋuriŋi", "ŋuruŋu"]);

function toDhiyaNguDeterminer(
  part: TranslationPart,
  sourceLang: LanguageMode
): TranslationPart {
  if (!DHUWALA_FORMS.has(part.gup)) return part;
  const demoMatch = matchDemonstrativeToken(part.source, sourceLang);
  const isThat = demoMatch?.kind === "that";
  const primary = isThat ? DHIYANGI_GUP : DHIYANGU_GUP;
  const explanations =
    part.explanations?.map((payload) => {
      if (payload.key !== "ARTICLE_DEFINITE" || !payload.data) {
        return payload;
      }
      return {
        ...payload,
        data: { ...payload.data, gup: primary },
      };
    }) ?? [];
  const alternatives = (part.alternatives ?? []).filter(
    (alt) => !DHUWALA_FORMS.has(alt.gup) && !DEMO_THAT_ALTS.has(alt.gup)
  );
  if (isThat) {
    const existing = new Set(alternatives.map((alt) => alt.gup));
    for (const alt of ["ŋuriŋi", "ŋuruŋu"]) {
      if (!existing.has(alt)) {
        alternatives.push({ gup: alt });
      }
    }
  }
  return finalizePart(
    {
      ...part,
      gup: primary,
      output: primary,
      explanations,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    },
    sourceLang
  );
}

type SuffixInfo = { primary: string; alternatives: string[] };

function resolveAgentSuffix(word: string): SuffixInfo | null {
  const lower = word.toLowerCase();
  const endsWith = (suffixes: string[]) =>
    suffixes.some((suffix) => lower.endsWith(suffix));
  if (endsWith(["a'", "i'", "u'", "a", "i", "u"])) {
    return { primary: "y", alternatives: ["yu"] };
  }
  if (endsWith(["ny'", "ṉ'", "ŋ'", "m'", "n'", "tj", "ṯ", "t", "p", "k"])) {
    return { primary: "thu", alternatives: [] };
  }
  if (endsWith(["ny", "ṉ", "ŋ", "m", "n"])) {
    return { primary: "dhu", alternatives: [] };
  }
  if (
    endsWith([
      "rr'",
      "r'",
      "ḻ'",
      "l'",
      "y'",
      "w'",
      "rr",
      "r",
      "ḻ",
      "l",
      "y",
      "w",
    ])
  ) {
    return { primary: "yu", alternatives: [] };
  }
  return null;
}

function applyAgentSuffixToWord(word: string, suffix: string): string {
  const lower = word.toLowerCase();
  if (suffix.startsWith("y") && /[aiu]'$/.test(lower)) {
    return `${word.slice(0, -1)}${suffix}'`;
  }
  return `${word}${suffix}`;
}

function applyAgentSuffixToGup(gup: string, suffix: string): string {
  const trimmed = gup.trim();
  if (!trimmed) return gup;
  const parts = trimmed.split(/\s+/);
  const last = parts.pop() ?? "";
  parts.push(applyAgentSuffixToWord(last, suffix));
  return parts.join(" ");
}

function applyAgentSuffixToPart(
  part: TranslationPart,
  sourceLang: LanguageMode
): TranslationPart {
  if (part.type === "pronoun" || part.appliedSuffix) return part;
  const suffixInfo = resolveAgentSuffix(part.gup);
  if (!suffixInfo) return part;
  const newPrimary = applyAgentSuffixToGup(part.gup, suffixInfo.primary);
  const existingAltByGup = new Map(
    (part.alternatives ?? []).map((alt) => [alt.gup, alt])
  );
  const baseVariants = [part.gup, ...existingAltByGup.keys()];
  const altMap = new Map<string, TranslationAlternative>();
  for (const variant of baseVariants) {
    const baseAlt = existingAltByGup.get(variant);
    const primaryApplied = applyAgentSuffixToGup(variant, suffixInfo.primary);
    if (primaryApplied !== newPrimary) {
      altMap.set(primaryApplied, {
        gup: primaryApplied,
        notePayload: baseAlt?.notePayload,
      });
    }
    for (const altSuffix of suffixInfo.alternatives) {
      const altApplied = applyAgentSuffixToGup(variant, altSuffix);
      if (altApplied !== newPrimary && !altMap.has(altApplied)) {
        altMap.set(altApplied, {
          gup: altApplied,
          notePayload: baseAlt?.notePayload,
        });
      }
    }
  }
  const explanations: ExplanationPayload[] = [
    ...(part.explanations ?? []),
    {
      key: "SUBJECT_AGENT_SUFFIX",
      data: { token: part.source, gup: newPrimary },
    },
  ];
  return finalizePart(
    {
      ...part,
      gup: newPrimary,
      output: newPrimary,
      explanations,
      alternatives: Array.from(altMap.values()),
      appliedSuffix: suffixInfo.primary,
    },
    sourceLang
  );
}

export function applyAgentSuffixToCombinations(
  combos: TranslationCombination[],
  nounIndices: number[],
  sourceLang: LanguageMode
): TranslationCombination[] {
  if (nounIndices.length === 0) return combos;
  const indices = new Set(nounIndices);
  return combos.map((combo) => {
    let changed = false;
    const appliedIndices = new Set<number>();
    const parts = combo.parts.map((part) => {
      const idx = part.globalIndex;
      if (idx === undefined || !indices.has(idx)) return part;
      const updated = applyAgentSuffixToPart(part, sourceLang);
      if (updated !== part) {
        changed = true;
        appliedIndices.add(idx);
      }
      return updated;
    });
    if (appliedIndices.size > 0) {
      const updatedParts = [...parts];
      for (const nounIndex of appliedIndices) {
        let candidateIdx = -1;
        let candidateGlobal = -1;
        for (let i = 0; i < updatedParts.length; i += 1) {
          const part = updatedParts[i];
          const partIndex = part.globalIndex;
          if (
            partIndex !== undefined &&
            partIndex < nounIndex &&
            DHUWALA_FORMS.has(part.gup)
          ) {
            if (partIndex > candidateGlobal) {
              candidateGlobal = partIndex;
              candidateIdx = i;
            }
          }
        }
        if (candidateIdx >= 0) {
          const replaced = toDhiyaNguDeterminer(
            updatedParts[candidateIdx],
            sourceLang
          );
          if (replaced !== updatedParts[candidateIdx]) {
            updatedParts[candidateIdx] = replaced;
            changed = true;
          }
        }
      }
      return changed ? { ...combo, parts: updatedParts } : combo;
    }
    return changed ? { ...combo, parts } : combo;
  });
}
