import { LanguageMode } from "@/app/components/types/components.type";
import { Token } from "../tokenizer";
import { validarFonologia, LANG_CONFIG, determineHumanAssociativeSuffix, applyHumanAssociativeSuffix, determineHumanAblativeSuffix, applyHumanAblativeSuffix, determinePerlativeSuffix, applyPerlativeSuffix, determineHumanCausativeSuffix, applyHumanCausativeSuffix, SOURCE_ORIGIN_PRONOUNS_GUP, normalizeToken } from "../constants";
import { determineBelongingSuffix, applyBelongingSuffix } from "./belonging";
import { determinePossessiveSuffix, applyPossessiveSuffix } from "./possession";
import { applyErgativeSuffix } from "./subject";
import { LEXICON, VerbEntry } from "../lexicon";

export interface AdjectivePart {
  type?: string;
  source?: string;
  gup: string;
  baseGup?: string;
  appliedSuffix?: string;
  globalIndex?: number;
  role?: string;
  isPlural?: boolean;
  isDual?: boolean;
  explanation?: string;
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

function getAdjectiveGroupBoundaryWords(mode: LanguageMode): Set<string> {
  const config = LANG_CONFIG[mode];
  const triggerLists: string[][] = [
    config.causeTriggers || [],
    config.causativeAgentTriggers || [],
    config.perlativeVerbTriggers || [],
    config.perlativeTimeTriggers || [],
    config.instrumentalVerbTriggers || [],
    config.belongingVerbTriggers || [],
    config.locativeTriggers || [],
    config.locativeVerbTriggers || [],
    config.allativeVerbTriggers || [],
    config.ablativeVerbTriggers || [],
    config.aboutToTriggers || [],
  ];
  const words = new Set<string>();
  for (const list of triggerLists) {
    for (const phrase of list) {
      for (const word of phrase.split(" ")) {
        const norm = normalizeToken(word);
        if (norm) words.add(norm);
      }
    }
  }
  return words;
}

function getVerbForm3(entry: VerbEntry, verbKey: string): string {
  return entry.forms[3] || entry.forms[2] || entry.forms[0] || verbKey;
}

function getVerbFormBases(entry: VerbEntry, verbKey: string): string[] {
  const base3 = getVerbForm3(entry, verbKey);
  const base4 = entry.forms.length > 4 ? entry.forms[4] : undefined;
  const bases = [base3];
  if (base4 && base4 !== base3) bases.push(base4);
  return bases;
}

function findPastParticipleVerbsForAdjective(word: string, mode: LanguageMode): { verbKey: string; entry: VerbEntry }[] {
  const normalized = normalizeToken(word);
  const matches: { verbKey: string; entry: VerbEntry }[] = [];
  for (const [verbKey, entry] of Object.entries(LEXICON.verbs)) {
    const list = entry.pastParticipleAdjectives?.[mode] || [];
    for (const form of list) {
      if (normalizeToken(form) === normalized) {
        matches.push({ verbKey, entry });
        break;
      }
    }
  }
  return matches;
}

function findPureAdjectiveGup(word: string, mode: LanguageMode): string | null {
  const normalized = normalizeToken(word);
  const pluralKey = LANG_CONFIG[mode].pluralKey;

  for (const [gupKey, entry] of Object.entries(LEXICON.adjectives)) {
    if (entry[mode].some((a) => normalizeToken(a) === normalized)) {
      return gupKey;
    }
    const plurals = entry[pluralKey] || [];
    if (plurals.some((a) => normalizeToken(a) === normalized)) {
      return gupKey;
    }
  }

  return null;
}

export function detectAdjectiveNounGroups(
  tokens: Token[],
  mode: LanguageMode
): AdjectiveNounGroup[] {
  const groups: AdjectiveNounGroup[] = [];
  const usedIndices = new Set<number>();
  const boundaryWords = getAdjectiveGroupBoundaryWords(mode);

  let pendingTokensBefore: number[] = [];
  let pendingConnectorsBefore: number[] = [];

  const isPastParticipleAdj = (token: Token) =>
    token.type === "verb" && token.verbMatch?.tense === "pastParticiple";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const tokenType = token.type;

    if (tokenType === "adjective" || isPastParticipleAdj(token)) {
      pendingTokensBefore.push(i);
    } else if (
      tokenType === "unknown" &&
      !isLikelyArticle(token.original) &&
      !boundaryWords.has(normalizeToken(token.original))
    ) {
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
    } else if (
      tokenType === "verb" ||
      tokenType === "pronoun" ||
      (tokenType === "unknown" && boundaryWords.has(normalizeToken(token.original)))
    ) {
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

      if (
        tokenType === "noun" ||
        (tokenType === "unknown" &&
          !isLikelyArticle(token.original) &&
          !boundaryWords.has(normalizeToken(token.original)))
      ) {
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
      } else if (
        tokenType === "unknown" &&
        boundaryWords.has(normalizeToken(token.original))
      ) {
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
      } else if ((tokenType === "adjective" || isPastParticipleAdj(token)) && currentNounIndex !== null) {
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

function isPerlativeSuffix(suffix: string): boolean {
  const perlativeSuffixes = ["gurru", "kurru", "wurru"];
  return perlativeSuffixes.includes(suffix);
}

function isHumanPerlativeSuffix(suffix: string): boolean {
  return /(wala|kala|gala)ŋu(wurru|kurru)$/.test(suffix);
}

function isHumanAblativeSuffix(suffix: string): boolean {
  const humanAblativeSuffixes = ["walaŋuŋuru", "kalaŋuŋuru", "galaŋuŋuru"];
  return humanAblativeSuffixes.some(hs => suffix.includes(hs));
}

export function applyAdjectiveSuffixes(
  parts: AdjectivePart[],
  groups: AdjectiveNounGroup[],
  tokens: Token[],
  mode: LanguageMode,
  allowAgentSuffix: boolean = true
): AdjectivePart[] {
  if (groups.length === 0) return parts;

  const possessionRoles = new Set(["possessed", "possessor"]);
  const processedAgentIndices = new Set<number>();
  const participleVerbCache = new Map<string, { verbKey: string; entry: VerbEntry }[] | null>();
  const pureAdjCache = new Map<string, string | null>();

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
    const adjPartsToMove: AdjectivePart[] = [];
    const maxAdjIndex =
      group.adjectiveIndices.length > 0
        ? Math.max(...group.adjectiveIndices)
        : group.nounIndex;
    const agentSearchStart = Math.max(group.nounIndex, maxAdjIndex) + 1;


    for (const adjIdx of group.adjectiveIndices) {
      if (excludedIndices.has(adjIdx)) {
        continue;
      }

      const adjPart = partByGlobalIndex.get(adjIdx);
   
      if (adjPart) {
        const adjToken = tokens[adjIdx];
        const isPastParticipleToken =
          adjToken?.type === "verb" && adjToken.verbMatch?.tense === "pastParticiple";
        if (adjPart.type === "verb" && !isPastParticipleToken) {
          continue;
        }

        const sourceWord =
          adjToken?.original ||
          (typeof adjPart.source === "string" ? adjPart.source : "");
        if (sourceWord) {
          let verbMatches = participleVerbCache.get(sourceWord);
          if (verbMatches === undefined) {
            const found = findPastParticipleVerbsForAdjective(sourceWord, mode);
            verbMatches = found.length > 0 ? found : null;
            participleVerbCache.set(sourceWord, verbMatches);
          }

          if (verbMatches) {
            const options: { gup: string; suffix: string; explanation: string; base: string }[] = [];
            for (const vm of verbMatches) {
              const bases = getVerbFormBases(vm.entry, vm.verbKey);
              for (const verbForm of bases) {
                const belongingRes = determineBelongingSuffix(verbForm, mode);
                for (const s of belongingRes.suffixes) {
                  const gup = applyBelongingSuffix(verbForm, s);
                  options.push({
                    gup,
                    suffix: s,
                    explanation: `${verbForm} + -${s}`,
                    base: verbForm,
                  });
                }
                options.push({
                  gup: verbForm,
                  suffix: "∅",
                  explanation: `${verbForm} (sin sufijo)`,
                  base: verbForm,
                });
              }
            }

            let pureAdjGup = pureAdjCache.get(sourceWord);
            if (pureAdjGup === undefined) {
              pureAdjGup = findPureAdjectiveGup(sourceWord, mode);
              pureAdjCache.set(sourceWord, pureAdjGup);
            }
            if (pureAdjGup) {
              options.push({
                gup: pureAdjGup,
                suffix: "∅",
                explanation: `${sourceWord} → ${pureAdjGup}`,
                base: pureAdjGup,
              });
            }

            const seen = new Set<string>();
            const uniqueOptions = options.filter((opt) => {
              if (seen.has(opt.gup)) return false;
              seen.add(opt.gup);
              return true;
            });

            if (uniqueOptions.length > 0) {
              const primary = uniqueOptions[0];
              adjPart.type = "adjective";
              adjPart.baseGup = primary.base;
              adjPart.gup = primary.gup;
              adjPart.appliedSuffix = primary.suffix === "∅" ? undefined : primary.suffix;
              adjPart.explanation = `${sourceWord} → ${primary.explanation}`;
              (adjPart as any).verbOptions = undefined;

              const alternatives = uniqueOptions
                .slice(1)
                .map(({ gup, suffix, explanation }) => ({
                  gup,
                  suffix,
                  explanation,
                }));

              adjPart.suffixAlternatives =
                alternatives.length > 0 ? alternatives : undefined;

              if (adjIdx < group.nounIndex) {
                adjPartsToMove.push(adjPart);
              }

              continue;
            }
          }
        }

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
          
          } else if (isHumanPerlativeSuffix(suffix)) {
            if (!adjPart.appliedSuffix || !isPerlativeSuffix(adjPart.appliedSuffix)) {
              const perlativeSuffixes = determinePerlativeSuffix(baseAdjGup);
              const adjSuffix = perlativeSuffixes[0];
              const finalAdjGup = applyPerlativeSuffix(baseAdjGup, adjSuffix);
              adjPart.gup = finalAdjGup;
              adjPart.appliedSuffix = adjSuffix;

              if (perlativeSuffixes.length > 1) {
                const alternatives: { gup: string; suffix: string; explanation: string }[] = [];
                for (let i = 1; i < perlativeSuffixes.length; i++) {
                  const altSuffix = perlativeSuffixes[i];
                  const altGup = applyPerlativeSuffix(baseAdjGup, altSuffix);
                  alternatives.push({
                    gup: altGup,
                    suffix: altSuffix,
                    explanation: `${baseAdjGup} + -${altSuffix} = ${altGup}`,
                  });
                }
                adjPart.suffixAlternatives = alternatives;
              }
            }
         
          } else if (isPerlativeSuffix(suffix)) {
            if (!adjPart.appliedSuffix || !isPerlativeSuffix(adjPart.appliedSuffix)) {
              const perlativeSuffixes = determinePerlativeSuffix(baseAdjGup);
              const adjSuffix = perlativeSuffixes[0];
              const finalAdjGup = applyPerlativeSuffix(baseAdjGup, adjSuffix);
              adjPart.gup = finalAdjGup;
              adjPart.appliedSuffix = adjSuffix;

              if (perlativeSuffixes.length > 1) {
                const alternatives: { gup: string; suffix: string; explanation: string }[] = [];
                for (let i = 1; i < perlativeSuffixes.length; i++) {
                  const altSuffix = perlativeSuffixes[i];
                  const altGup = applyPerlativeSuffix(baseAdjGup, altSuffix);
                  alternatives.push({
                    gup: altGup,
                    suffix: altSuffix,
                    explanation: `${baseAdjGup} + -${altSuffix} = ${altGup}`,
                  });
                }
                adjPart.suffixAlternatives = alternatives;
              }
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

    const agentTriggers = LANG_CONFIG[mode].causativeAgentTriggers || [];
    if (
      allowAgentSuffix &&
      agentTriggers.length > 0 &&
      agentSearchStart < tokens.length
    ) {
      const normalizedTokens = tokens.map((t) => normalizeToken(t.original));
      const sortedTriggers = [...agentTriggers]
        .map((phrase) => ({
          phrase,
          words: phrase.split(" ").map(normalizeToken),
        }))
        .sort((a, b) => b.words.length - a.words.length);

      const isSkippableWord = (word: string) =>
        ["el", "la", "los", "las", "the", "a", "an", "de", "del", "al", "of"].includes(word);

      for (let i = agentSearchStart; i < tokens.length; i++) {
        for (const trigger of sortedTriggers) {
          if (i + trigger.words.length > normalizedTokens.length) continue;
          let matches = true;
          for (let j = 0; j < trigger.words.length; j++) {
            if (normalizedTokens[i + j] !== trigger.words[j]) {
              matches = false;
              break;
            }
          }
          if (!matches) continue;
       

          for (let k = i + trigger.words.length; k < tokens.length; k++) {
            const t = tokens[k];
            const norm = normalizedTokens[k];
            if (isSkippableWord(norm)) continue;
            if (t.type === "connector") continue;

            if (processedAgentIndices.has(k)) break;

            if (t.type === "pronoun") {
              const personNumber = LANG_CONFIG[mode].pronounTriggers[norm];
              const pronounForms = personNumber
                ? SOURCE_ORIGIN_PRONOUNS_GUP[personNumber]
                : undefined;
              const part = partByGlobalIndex.get(k);
              if (part && pronounForms && pronounForms.length > 0) {
                part.gup = pronounForms[0];
                part.explanation = `"${t.original}" → ${pronounForms[0]} (${LANG_CONFIG[mode].causativeAgentLabel})`;
                part.appliedSuffix = undefined;
                part.suffixAlternatives =
                  pronounForms.length > 1
                    ? pronounForms.slice(1).map((g) => ({
                        gup: g,
                        suffix: "",
                        explanation: `${t.original} → ${g}`,
                      }))
                    : undefined;
                processedAgentIndices.add(k);
              
              }
              break;
            }

            if (t.type === "noun" || t.type === "unknown") {
              const part = partByGlobalIndex.get(k);
              if (part) {
                const isHuman = t.type === "noun" ? t.nounMatch?.isHuman === true : false;
                const isUnknown = t.type === "unknown" || t.nounMatch?.isHuman === undefined;
                if (isHuman || isUnknown) {
                  const baseGup = part.baseGup || part.gup;
                  const suffixes = determineHumanCausativeSuffix(baseGup);
                  const primary = suffixes[0];
                  const gup = applyHumanCausativeSuffix(baseGup, primary);
                  const alternatives: { gup: string; suffix: string; explanation: string }[] =
                    suffixes
                      .slice(1)
                      .map((s) => ({
                        gup: applyHumanCausativeSuffix(baseGup, s),
                        suffix: s,
                        explanation: `${baseGup} + -${s}`,
                      }));

                  if (isUnknown) {
                    alternatives.push({
                      gup: baseGup,
                      suffix: "∅",
                      explanation: `${baseGup} (${LANG_CONFIG[mode].alternative})`,
                    });
                  }

                  part.baseGup = baseGup;
                  part.gup = gup;
                  part.appliedSuffix = primary;
                  part.explanation = `${baseGup} + -${primary} = ${gup} (${LANG_CONFIG[mode].causativeAgentLabel})`;
                  part.suffixAlternatives =
                    alternatives.length > 0 ? alternatives : undefined;
                  processedAgentIndices.add(k);
                
                }
              }
              break;
            }

            break;
          }
          break;
        }
      }
    } 

    if (adjPartsToMove.length > 0) {
      const nounPartIndex = parts.findLastIndex(
        (p) => p.globalIndex === group.nounIndex
      );
      if (nounPartIndex >= 0) {
        const orderedMoves = parts.filter((p) => adjPartsToMove.includes(p));
        for (const moving of orderedMoves) {
          const currentIndex = parts.indexOf(moving);
          if (currentIndex >= 0) {
            parts.splice(currentIndex, 1);
          }
        }
        const insertIndex = parts.findLastIndex(
          (p) => p.globalIndex === group.nounIndex
        );
        parts.splice(insertIndex + 1, 0, ...orderedMoves);
      }
    }
  }

  return parts;
}
