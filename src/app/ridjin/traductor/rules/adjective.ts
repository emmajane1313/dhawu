import { LanguageMode } from "@/app/components/types/components.type";
import { Token } from "../tokenizer";
import { validarFonologia, LANG_CONFIG, determineHumanAssociativeSuffix, applyHumanAssociativeSuffix, determineHumanAblativeSuffix, applyHumanAblativeSuffix } from "../constants";
import { determineBelongingSuffix, applyBelongingSuffix } from "./belonging";
import { determinePossessiveSuffix, applyPossessiveSuffix } from "./possession";
import { applyErgativeSuffix } from "./subject";

export interface AdjectivePart {
  gup: string;
  baseGup?: string;
  appliedSuffix?: string;
  globalIndex?: number;
  role?: string;
  isPlural?: boolean;
  isDual?: boolean;
  suffixAlternatives?: { gup: string; suffix: string; explanation: string }[];
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

      if (tokenType === "noun" || (tokenType === "unknown" && !isLikelyArticle(token.original))) {
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
      } else if (tokenType === "adjective" && currentNounIndex !== null) {
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

function isHumanBelongingSuffix(suffix: string): boolean {
  const humanPrefixes = ["walaŋu", "galaŋu", "kalaŋu"];
  return humanPrefixes.some(prefix => suffix.includes(prefix));
}

function isHumanAssociativeSuffix(suffix: string): boolean {
  return suffix === "wala" || suffix === "kala" || suffix === "gala" ||
         suffix.endsWith("wala") || suffix.endsWith("kala") || suffix.endsWith("gala");
}

function isBelongingSuffix(suffix: string): boolean {
  const belongingSuffixes = ["buy", "puy", "wuy"];
  return belongingSuffixes.some(bs => suffix === bs || suffix.endsWith(bs));
}

function isPossessiveSuffix(suffix: string): boolean {
  const possessiveSuffixes = ["wa", "wu", "ku", "gu"];
  return possessiveSuffixes.includes(suffix);
}

function isErgativeSuffix(suffix: string): boolean {
  const ergativeSuffixes = ["y", "yu", "dhu", "thu"];
  return ergativeSuffixes.includes(suffix);
}

function isHumanAblativeSuffix(suffix: string): boolean {
  const humanAblativeSuffixes = ["walaŋuŋuru", "kalaŋuŋuru", "galaŋuŋuru"];
  return humanAblativeSuffixes.some(hs => suffix.includes(hs));
}

export function applyAdjectiveSuffixes(
  parts: AdjectivePart[],
  groups: AdjectiveNounGroup[],
  mode: LanguageMode
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
    if (excludedIndices.has(group.nounIndex)) {
      continue;
    }

    const nounPart = partByGlobalIndex.get(group.nounIndex);

    if (!nounPart) continue;

    const suffix = nounPart.appliedSuffix;

    for (const adjIdx of group.adjectiveIndices) {
      if (excludedIndices.has(adjIdx)) {
        continue;
      }

      const adjPart = partByGlobalIndex.get(adjIdx);
   
      if (adjPart) {
        if (suffix) {
          const baseAdjGup = adjPart.baseGup || adjPart.gup;
          adjPart.baseGup = baseAdjGup;

          if (isHumanAblativeSuffix(suffix)) {
            const adjHumanAblativeSuffixes = determineHumanAblativeSuffix(baseAdjGup);
            const adjHumanAblativeSuffix = adjHumanAblativeSuffixes[0];
            const finalAdjGup = applyHumanAblativeSuffix(baseAdjGup, adjHumanAblativeSuffix);

            adjPart.gup = finalAdjGup;
            adjPart.appliedSuffix = adjHumanAblativeSuffix;

            if (adjHumanAblativeSuffixes.length > 1) {
              const alternatives: { gup: string; suffix: string; explanation: string }[] = [];
              for (let i = 1; i < adjHumanAblativeSuffixes.length; i++) {
                const altSuffix = adjHumanAblativeSuffixes[i];
                const altGup = applyHumanAblativeSuffix(baseAdjGup, altSuffix);
                alternatives.push({
                  gup: altGup,
                  suffix: altSuffix,
                  explanation: `${baseAdjGup} + -${altSuffix} = ${altGup}`,
                });
              }
              adjPart.suffixAlternatives = alternatives;
            }
          

          } else if (isHumanBelongingSuffix(suffix)) {
            const adjHumanSuffixes = determineHumanAssociativeSuffix(baseAdjGup);
            const adjHumanSuffix = adjHumanSuffixes[0];
            const adjWithHuman = applyHumanAssociativeSuffix(baseAdjGup, adjHumanSuffix);
            const adjWithHumanNgu = adjWithHuman + "ŋu";

            const adjBelongingResult = determineBelongingSuffix(adjWithHumanNgu, mode);
            const adjBelongingSuffix = adjBelongingResult.suffixes[0];
            const finalAdjGup = applyBelongingSuffix(adjWithHumanNgu, adjBelongingSuffix);

            adjPart.gup = finalAdjGup;
            adjPart.appliedSuffix = adjHumanSuffix + "ŋu" + adjBelongingSuffix;

            const alternatives: { gup: string; suffix: string; explanation: string }[] = [];
            for (const hs of adjHumanSuffixes) {
              const withHuman = applyHumanAssociativeSuffix(baseAdjGup, hs);
              const withHumanNgu = withHuman + "ŋu";
              const belongingRes = determineBelongingSuffix(withHumanNgu, mode);
              for (const bs of belongingRes.suffixes) {
                const altGup = applyBelongingSuffix(withHumanNgu, bs);
                const altSuffix = hs + "ŋu" + bs;
                if (altGup !== finalAdjGup) {
                  alternatives.push({
                    gup: altGup,
                    suffix: altSuffix,
                    explanation: `${baseAdjGup} + -${altSuffix} = ${altGup}`,
                  });
                }
              }
            }
            if (alternatives.length > 0) {
              adjPart.suffixAlternatives = alternatives;
            }
         
          } else if (isHumanAssociativeSuffix(suffix)) {
            const adjHumanSuffixes = determineHumanAssociativeSuffix(baseAdjGup);
            const adjHumanSuffix = adjHumanSuffixes[0];
            const finalAdjGup = applyHumanAssociativeSuffix(baseAdjGup, adjHumanSuffix);

            adjPart.gup = finalAdjGup;
            adjPart.appliedSuffix = adjHumanSuffix;

            if (adjHumanSuffixes.length > 1) {
              const alternatives: { gup: string; suffix: string; explanation: string }[] = [];
              for (let i = 1; i < adjHumanSuffixes.length; i++) {
                const altSuffix = adjHumanSuffixes[i];
                const altGup = applyHumanAssociativeSuffix(baseAdjGup, altSuffix);
                alternatives.push({
                  gup: altGup,
                  suffix: altSuffix,
                  explanation: `${baseAdjGup} + -${altSuffix} = ${altGup}`,
                });
              }
              adjPart.suffixAlternatives = alternatives;
            }
         

          } else if (isBelongingSuffix(suffix)) {
            const adjBelongingResult = determineBelongingSuffix(baseAdjGup, mode);
            const adjSuffix = adjBelongingResult.suffixes[0];
            adjPart.gup = applyBelongingSuffix(baseAdjGup, adjSuffix);
            adjPart.appliedSuffix = adjSuffix;

            if (adjBelongingResult.suffixes.length > 1) {
              const alternatives: { gup: string; suffix: string; explanation: string }[] = [];
              for (let si = 1; si < adjBelongingResult.suffixes.length; si++) {
                const altSuffix = adjBelongingResult.suffixes[si];
                const altGup = applyBelongingSuffix(baseAdjGup, altSuffix);
                alternatives.push({
                  gup: altGup,
                  suffix: altSuffix,
                  explanation: `${baseAdjGup} + -${altSuffix} = ${altGup}`,
                });
              }
              adjPart.suffixAlternatives = alternatives;
            }
         
          } else if (isPossessiveSuffix(suffix)) {
            const adjPossessiveResult = determinePossessiveSuffix(baseAdjGup, mode);
            const adjSuffix = adjPossessiveResult.suffixes[0];
            adjPart.gup = applyPossessiveSuffix(baseAdjGup, adjSuffix);
            adjPart.appliedSuffix = adjSuffix;

            if (adjPossessiveResult.suffixes.length > 1) {
              const alternatives: { gup: string; suffix: string; explanation: string }[] = [];
              for (let si = 1; si < adjPossessiveResult.suffixes.length; si++) {
                const altSuffix = adjPossessiveResult.suffixes[si];
                const altGup = applyPossessiveSuffix(baseAdjGup, altSuffix);
                alternatives.push({
                  gup: altGup,
                  suffix: altSuffix,
                  explanation: `${baseAdjGup} + -${altSuffix} = ${altGup}`,
                });
              }
              adjPart.suffixAlternatives = alternatives;
            }
          
          } else if (isErgativeSuffix(suffix)) {
            const ergResult = applyErgativeSuffix(baseAdjGup);
            adjPart.gup = ergResult.suffixed;
            adjPart.appliedSuffix = ergResult.suffix || undefined;
         

          } else {
            adjPart.gup = validarFonologia(baseAdjGup + suffix);
            adjPart.appliedSuffix = suffix;
           
          }
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
