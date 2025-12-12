import { LanguageMode } from "@/app/components/types/components.type";
import { LANG_CONFIG } from "./constants";

export interface FixedEntry {
  gup: string;
  type: "phrase" | "word";
  explanationEs: string;
  explanationEn: string;
}

export const FIXED_TRANSLATIONS_ES: Record<string, FixedEntry> = {
  "qué es esto": {
    gup: "nhä dhuwala",
    type: "phrase",
    explanationEs: "Frase fija: ¿qué es esto?",
    explanationEn: "Fixed phrase: what is this?",
  },
  "que es esto": {
    gup: "nhä dhuwala",
    type: "phrase",
    explanationEs: "Frase fija: ¿qué es esto?",
    explanationEn: "Fixed phrase: what is this?",
  },
  "qué es eso": {
    gup: "nhä dhuwali",
    type: "phrase",
    explanationEs: "Frase fija: ¿qué es eso?",
    explanationEn: "Fixed phrase: what is that?",
  },
  "que es eso": {
    gup: "nhä dhuwali",
    type: "phrase",
    explanationEs: "Frase fija: ¿qué es eso?",
    explanationEn: "Fixed phrase: what is that?",
  },
  "esto es": {
    gup: "dhuwala",
    type: "phrase",
    explanationEs: "Frase fija: esto es",
    explanationEn: "Fixed phrase: this is",
  },
  "eso es": {
    gup: "dhuwali",
    type: "phrase",
    explanationEs: "Frase fija: eso es",
    explanationEn: "Fixed phrase: that is",
  },

  embarazada: {
    gup: "yothumirri",
    type: "word",
    explanationEs: "embarazada → yothumirri (tener bebé adentro)",
    explanationEn: "pregnant → yothumirri (having baby inside)",
  },
  embarazado: {
    gup: "yothumirri",
    type: "word",
    explanationEs: "embarazado → yothumirri",
    explanationEn: "pregnant → yothumirri",
  },
  embarazadas: {
    gup: "yothumirri",
    type: "word",
    explanationEs: "embarazadas → yothumirri",
    explanationEn: "pregnant → yothumirri",
  },
  embarazados: {
    gup: "yothumirri",
    type: "word",
    explanationEs: "embarazados → yothumirri",
    explanationEn: "pregnant → yothumirri",
  },

  enfermo: {
    gup: "rerrimirri",
    type: "word",
    explanationEs: "enfermo → rerrimirri",
    explanationEn: "sick → rerrimirri",
  },
  enferma: {
    gup: "rerrimirri",
    type: "word",
    explanationEs: "enferma → rerrimirri",
    explanationEn: "sick → rerrimirri",
  },
  enfermos: {
    gup: "rerrimirri",
    type: "word",
    explanationEs: "enfermos → rerrimirri",
    explanationEn: "sick → rerrimirri",
  },
  enfermas: {
    gup: "rerrimirri",
    type: "word",
    explanationEs: "enfermas → rerrimirri",
    explanationEn: "sick → rerrimirri",
  },

  casado: {
    gup: "miyalkmirri",
    type: "word",
    explanationEs: "casado → miyalkmirri (tener esposa)",
    explanationEn: "married (male) → miyalkmirri (having wife)",
  },
  casada: {
    gup: "wäŋamirri",
    type: "word",
    explanationEs: "casada → wäŋamirri (tener esposo)",
    explanationEn: "married (female) → wäŋamirri (having husband)",
  },
  casados: {
    gup: "miyalkmirri",
    type: "word",
    explanationEs: "casados → miyalkmirri",
    explanationEn: "married (males) → miyalkmirri",
  },
  casadas: {
    gup: "wäŋamirri",
    type: "word",
    explanationEs: "casadas → wäŋamirri",
    explanationEn: "married (females) → wäŋamirri",
  },

  agujereada: {
    gup: "djetjimirri",
    type: "word",
    explanationEs: "agujereada → djetjimirri",
    explanationEn: "holey → djetjimirri",
  },
  agujereado: {
    gup: "djetjimirri",
    type: "word",
    explanationEs: "agujereado → djetjimirri",
    explanationEn: "holey → djetjimirri",
  },

  "ir de nuevo": {
    gup: "bulu marrtji",
    type: "phrase",
    explanationEs: "ir de nuevo → bulu marrtji",
    explanationEn: "go again → bulu marrtji",
  },
  "ir otra vez": {
    gup: "bulu marrtji",
    type: "phrase",
    explanationEs: "ir otra vez → bulu marrtji",
    explanationEn: "go again → bulu marrtji",
  },
  "volver a ir": {
    gup: "bulu marrtji",
    type: "phrase",
    explanationEs: "volver a ir → bulu marrtji",
    explanationEn: "go again → bulu marrtji",
  },
  "ve de nuevo": {
    gup: "bulu marrtji",
    type: "phrase",
    explanationEs: "ve de nuevo → bulu marrtji",
    explanationEn: "go again → bulu marrtji",
  },
  "ve otra vez": {
    gup: "bulu marrtji",
    type: "phrase",
    explanationEs: "ve otra vez → bulu marrtji",
    explanationEn: "go again → bulu marrtji",
  },
  "otra vez": {
    gup: "bulu",
    type: "phrase",
    explanationEs: "otra vez → bulu",
    explanationEn: "again → bulu",
  },
  "de nuevo": {
    gup: "bulu",
    type: "phrase",
    explanationEs: "de nuevo → bulu",
    explanationEn: "again → bulu",
  },

  "son iguales": {
    gup: "maṉḏa rrambaŋi",
    type: "phrase",
    explanationEs: "son iguales → maṉḏa rrambaŋi",
    explanationEn: "they are equal → maṉḏa rrambaŋi",
  },
  "están iguales": {
    gup: "maṉḏa rrambaŋi",
    type: "phrase",
    explanationEs: "están iguales → maṉḏa rrambaŋi",
    explanationEn: "they are equal → maṉḏa rrambaŋi",
  },
  "estan iguales": {
    gup: "maṉḏa rrambaŋi",
    type: "phrase",
    explanationEs: "estan iguales → maṉḏa rrambaŋi",
    explanationEn: "they are equal → maṉḏa rrambaŋi",
  },
};

export const FIXED_TRANSLATIONS_EN: Record<string, FixedEntry> = {
  "what is this": {
    gup: "nhä dhuwala",
    type: "phrase",
    explanationEs: "Fixed phrase: what is this?",
    explanationEn: "Fixed phrase: what is this?",
  },
  "what is that": {
    gup: "nhä dhuwali",
    type: "phrase",
    explanationEs: "Fixed phrase: what is that?",
    explanationEn: "Fixed phrase: what is that?",
  },
  "this is": {
    gup: "dhuwala",
    type: "phrase",
    explanationEs: "Fixed phrase: this is",
    explanationEn: "Fixed phrase: this is",
  },
  "that is": {
    gup: "dhuwali",
    type: "phrase",
    explanationEs: "Fixed phrase: that is",
    explanationEn: "Fixed phrase: that is",
  },

  pregnant: {
    gup: "yothumirri",
    type: "word",
    explanationEs: "pregnant → yothumirri (having baby inside)",
    explanationEn: "pregnant → yothumirri (having baby inside)",
  },

  ill: {
    gup: "rerrimirri",
    type: "word",
    explanationEs: "ill → rerrimirri",
    explanationEn: "ill → rerrimirri",
  },
  sick: {
    gup: "rerrimirri",
    type: "word",
    explanationEs: "sick → rerrimirri",
    explanationEn: "sick → rerrimirri",
  },

  married: {
    gup: "miyalkmirri",
    type: "word",
    explanationEs: "married → miyalkmirri/wäŋamirri (depends on gender)",
    explanationEn: "married → miyalkmirri/wäŋamirri (depends on gender)",
  },

  holey: {
    gup: "djetjimirri",
    type: "word",
    explanationEs: "holey → djetjimirri",
    explanationEn: "holey → djetjimirri",
  },

  "go again": {
    gup: "bulu marrtji",
    type: "phrase",
    explanationEs: "go again → bulu marrtji",
    explanationEn: "go again → bulu marrtji",
  },
  again: {
    gup: "bulu",
    type: "word",
    explanationEs: "again → bulu",
    explanationEn: "again → bulu",
  },

  "they are equal": {
    gup: "maṉḏa rrambaŋi",
    type: "phrase",
    explanationEs: "they are equal → maṉḏa rrambaŋi",
    explanationEn: "they are equal → maṉḏa rrambaŋi",
  },
  "they are sitting together": {
    gup: "maṉḏa ga rrambaŋi nhina",
    type: "phrase",
    explanationEs: "they are sitting together → maṉḏa ga rrambaŋi nhina",
    explanationEn: "they are sitting together → maṉḏa ga rrambaŋi nhina",
  },
};

export interface FixedMatch {
  startIndex: number;
  endIndex: number;
  source: string;
  entry: FixedEntry;
}

export function findAllFixedMatches(
  tokens: string[],
  mode: LanguageMode
): FixedMatch[] {
  const { fixed } = LANG_CONFIG[mode];
  const matches: FixedMatch[] = [];
  const usedIndices = new Set<number>();

  const sortedPhrases = Object.keys(fixed).sort((a, b) => {
    const aWords = a.split(" ").length;
    const bWords = b.split(" ").length;
    return bWords - aWords;
  });

  for (const phrase of sortedPhrases) {
    const phraseWords = phrase.split(" ");
    const phraseLen = phraseWords.length;

    for (let i = 0; i <= tokens.length - phraseLen; i++) {
      let alreadyUsed = false;
      for (let j = i; j < i + phraseLen; j++) {
        if (usedIndices.has(j)) {
          alreadyUsed = true;
          break;
        }
      }
      if (alreadyUsed) continue;

      let match = true;
      for (let j = 0; j < phraseLen; j++) {
        if (tokens[i + j].toLowerCase() !== phraseWords[j]) {
          match = false;
          break;
        }
      }

      if (match) {
        for (let j = i; j < i + phraseLen; j++) {
          usedIndices.add(j);
        }
        matches.push({
          startIndex: i,
          endIndex: i + phraseLen - 1,
          source: tokens.slice(i, i + phraseLen).join(" "),
          entry: fixed[phrase],
        });
      }
    }
  }

  return matches.sort((a, b) => a.startIndex - b.startIndex);
}

export function getFixedIndices(matches: FixedMatch[]): Set<number> {
  const indices = new Set<number>();
  for (const match of matches) {
    for (let i = match.startIndex; i <= match.endIndex; i++) {
      indices.add(i);
    }
  }
  return indices;
}
