import { LanguageMode } from "@/app/components/types/components.type";
import { Token } from "../tokenizer";
import { validarFonologia, LANG_CONFIG } from "../constants";

export interface AdjectivePart {
  gup: string;
  baseGup?: string;
  appliedSuffix?: string;
  globalIndex?: number;
  role?: string;
  isPlural?: boolean;
  isDual?: boolean;
}

export interface AdjectiveNounGroup {
  nounIndex: number;
  adjectiveIndices: number[];
  connectorIndices: number[];
}

function isLikelyArticle(word: string): boolean {
  const articles = ["the", "a", "an", "el", "la", "los", "las", "un", "una", "unos", "unas"];
  return articles.includes(word.toLowerCase());
}

export function detectAdjectiveNounGroups(
  tokens: Token[],
  mode: LanguageMode
): AdjectiveNounGroup[] {
  const groups: AdjectiveNounGroup[] = [];
  const usedIndices = new Set<number>();

  let pendingTokensBefore: number[] = [];
  let pendingConnectorsBefore: number[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenType = token.type;

    if (tokenType === "adjective") {
      pendingTokensBefore.push(i);
    } else if (tokenType === "unknown" && !isLikelyArticle(token.original)) {
      pendingTokensBefore.push(i);
    } else if (tokenType === "connector" && pendingTokensBefore.length > 0) {
      pendingConnectorsBefore.push(i);
    } else if (tokenType === "noun") {
      if (pendingTokensBefore.length > 0) {
        groups.push({
          nounIndex: i,
          adjectiveIndices: [...pendingTokensBefore],
          connectorIndices: [...pendingConnectorsBefore],
        });
        for (const idx of pendingTokensBefore) usedIndices.add(idx);
        usedIndices.add(i);
      }
      pendingTokensBefore = [];
      pendingConnectorsBefore = [];
    } else if (tokenType === "verb" || tokenType === "pronoun") {
      pendingTokensBefore = [];
      pendingConnectorsBefore = [];
    }
  }

  if (LANG_CONFIG[mode].adjectiveAfterNoun) {
    let currentNounIndex: number | null = null;
    let adjectivesAfterNoun: number[] = [];
    let connectorsAfterNoun: number[] = [];

    for (let i = 0; i < tokens.length; i++) {
      if (usedIndices.has(i)) continue;

      const token = tokens[i];
      const tokenType = token.type;

      if (tokenType === "noun") {
        if (currentNounIndex !== null && adjectivesAfterNoun.length > 0) {
          groups.push({
            nounIndex: currentNounIndex,
            adjectiveIndices: [...adjectivesAfterNoun],
            connectorIndices: [...connectorsAfterNoun],
          });
        }
        currentNounIndex = i;
        adjectivesAfterNoun = [];
        connectorsAfterNoun = [];
      } else if ((tokenType === "adjective" || tokenType === "unknown") && currentNounIndex !== null && !isLikelyArticle(token.original)) {
        adjectivesAfterNoun.push(i);
      } else if (tokenType === "connector" && currentNounIndex !== null && adjectivesAfterNoun.length > 0) {
        connectorsAfterNoun.push(i);
      } else if (tokenType === "verb") {
        if (currentNounIndex !== null && adjectivesAfterNoun.length > 0) {
          groups.push({
            nounIndex: currentNounIndex,
            adjectiveIndices: [...adjectivesAfterNoun],
            connectorIndices: [...connectorsAfterNoun],
          });
        }
        currentNounIndex = null;
        adjectivesAfterNoun = [];
        connectorsAfterNoun = [];
      }
    }

    if (currentNounIndex !== null && adjectivesAfterNoun.length > 0) {
      groups.push({
        nounIndex: currentNounIndex,
        adjectiveIndices: [...adjectivesAfterNoun],
        connectorIndices: [...connectorsAfterNoun],
      });
    }
  }

  return groups;
}

export function applyAdjectiveSuffixes(
  parts: AdjectivePart[],
  groups: AdjectiveNounGroup[]
): AdjectivePart[] {
  if (groups.length === 0) return parts;

  const possessionRoles = new Set(["possessed", "possessor"]);

  const partByGlobalIndex = new Map<number, AdjectivePart>();
  const excludedIndices = new Set<number>();
  for (const part of parts) {
    if (part.globalIndex !== undefined && part.globalIndex >= 0) {
      partByGlobalIndex.set(part.globalIndex, part);
      if (part.role && possessionRoles.has(part.role)) {
        excludedIndices.add(part.globalIndex);
      }
    }
  }

  for (const group of groups) {
    if (excludedIndices.has(group.nounIndex)) continue;

    const nounPart = partByGlobalIndex.get(group.nounIndex);
    if (!nounPart) continue;

    const suffix = nounPart.appliedSuffix;

    for (const adjIdx of group.adjectiveIndices) {
      if (excludedIndices.has(adjIdx)) continue;

      const adjPart = partByGlobalIndex.get(adjIdx);
      if (adjPart) {
        if (suffix) {
          const baseAdjGup = adjPart.baseGup || adjPart.gup;
          adjPart.baseGup = baseAdjGup;
          adjPart.gup = validarFonologia(baseAdjGup + suffix);
          adjPart.appliedSuffix = suffix;
        }
        if (nounPart.isPlural) {
          adjPart.isPlural = true;
        }
        if (nounPart.isDual) {
          adjPart.isDual = true;
        }
      }
    }
  }

  return parts;
}
