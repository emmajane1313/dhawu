const SUFFIX_VOWEL = /(?:a|i|u)(?:'?)$/;
const SUFFIX_STOP = /(?:tj|p|t|ṯ|k|')$/;
const SUFFIX_NASAL = /(?:m|n|ṉ|ŋ|ny)$/;
const SUFFIX_LIQUID = /(?:rr|r|l|ḻ)$/;
const SUFFIX_SEMIVOWEL = /(?:y|w)$/;
const COMITATIVE_VOWEL = /(?:a|i|u)(?:'?)$/;
const COMITATIVE_NASAL = /(?:m|n|ṉ|ŋ|ny)$/;
const COMITATIVE_NASAL_GLOTTAL = /(?:m'|n'|ṉ'|ŋ'|ny')$/;
const COMITATIVE_STOP = /(?:p|t|ṯ|tj|k)$/;
const COMITATIVE_LIQUID = /(?:l|ḻ|rr|r|y|w)$/;
const COMITATIVE_LIQUID_GLOTTAL = /(?:l'|ḻ'|rr'|r'|y'|w')$/;
const INSTRUMENTAL_VOWEL = /(?:a|i|u)(?:'?)$/;
const INSTRUMENTAL_NASAL = /(?:m|n|ṉ|ŋ|ny)$/;
const INSTRUMENTAL_LIQUID = /(?:rr|r|l|ḻ|y|w)$/;
const BELONGING_VOWEL = /(?:a|i|u)(?:'?)$/;
const BELONGING_NASAL = /(?:m|n|ṉ|ŋ|ny)$/;
const BELONGING_STOP = /(?:p|t|ṯ|tj|k|')$/;
const BELONGING_LIQUID = /(?:rr|r|l|ḻ|y|w)$/;

type InstrumentalSuffixInfo = { primary: string; alternatives: string[] };

export function getPossessiveSuffixes(base: string): string[] {
  const normalized = base
    .trim()
    .toLowerCase()
    .replace(/[ʼ`]/g, "'");
  if (!normalized) return ["gu"];
  const parts = normalized.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const glottal = last.endsWith("'");
  const lastCore = glottal ? last.slice(0, -1) : last;

  if (SUFFIX_VOWEL.test(last)) {
    return ["wa", "wu"];
  }
  if (SUFFIX_STOP.test(lastCore) || (glottal && SUFFIX_STOP.test("'"))) {
    return ["ku"];
  }
  if (SUFFIX_LIQUID.test(lastCore) || SUFFIX_SEMIVOWEL.test(lastCore)) {
    return ["gu", "wu"];
  }
  if (SUFFIX_NASAL.test(lastCore)) {
    return ["gu"];
  }
  return ["gu"];
}

export function applyPossessiveSuffix(base: string, suffix: string): string {
  const trimmed = base.trim();
  if (!trimmed) return base;
  const parts = trimmed.split(/\s+/);
  const last = parts.pop() ?? "";
  parts.push(`${last}${suffix}`);
  return parts.join(" ");
}

export function applySuffixToGup(base: string, suffix: string): string {
  return applyPossessiveSuffix(base, suffix);
}

function resolveInstrumentalSuffix(base: string): InstrumentalSuffixInfo {
  const normalized = base
    .trim()
    .toLowerCase()
    .replace(/[ʼ`]/g, "'");
  if (!normalized) {
    return { primary: "y", alternatives: ["yu"] };
  }
  const parts = normalized.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const endsWith = (suffixes: string[]) =>
    suffixes.some((suffix) => last.endsWith(suffix));

  if (INSTRUMENTAL_VOWEL.test(last)) {
    return { primary: "y", alternatives: ["yu"] };
  }
  if (endsWith(["ny'", "ṉ'", "ŋ'", "m'", "n'", "tj", "ṯ", "t", "p", "k"])) {
    return { primary: "thu", alternatives: [] };
  }
  if (INSTRUMENTAL_NASAL.test(last)) {
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
    ]) ||
    INSTRUMENTAL_LIQUID.test(last)
  ) {
    return { primary: "yu", alternatives: [] };
  }
  return { primary: "y", alternatives: ["yu"] };
}

function applyInstrumentalSuffixToWord(word: string, suffix: string): string {
  const lower = word.toLowerCase().replace(/[ʼ`]/g, "'");
  if (suffix.startsWith("y") && /[aiu]'$/.test(lower)) {
    return `${word.slice(0, -1)}${suffix}'`;
  }
  return `${word}${suffix}`;
}

export function applyInstrumentalSuffixToGup(base: string, suffix: string): string {
  const trimmed = base.trim();
  if (!trimmed) return base;
  const parts = trimmed.split(/\s+/);
  const last = parts.pop() ?? "";
  parts.push(applyInstrumentalSuffixToWord(last, suffix));
  return parts.join(" ");
}

export function getInstrumentalSuffixes(base: string): string[] {
  const resolved = resolveInstrumentalSuffix(base);
  return [resolved.primary, ...resolved.alternatives];
}

export function getComitativeSuffixes(base: string): string[] {
  const normalized = base
    .trim()
    .toLowerCase()
    .replace(/[ʼ`]/g, "'");
  if (!normalized) return ["gala"];
  const parts = normalized.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  if (COMITATIVE_VOWEL.test(last)) {
    return ["wala"];
  }
  if (COMITATIVE_LIQUID_GLOTTAL.test(last)) {
    return ["kala", "wala"];
  }
  if (COMITATIVE_LIQUID.test(last) || SUFFIX_SEMIVOWEL.test(last)) {
    return ["gala", "wala"];
  }
  if (COMITATIVE_NASAL_GLOTTAL.test(last) || COMITATIVE_STOP.test(last)) {
    return ["kala"];
  }
  if (COMITATIVE_NASAL.test(last)) {
    return ["gala"];
  }
  return ["gala"];
}

export function getBelongingSuffixes(base: string): string[] {
  const normalized = base
    .trim()
    .toLowerCase()
    .replace(/[ʼ`]/g, "'");
  if (!normalized) return ["puy", "wuy"];
  const parts = normalized.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const glottal = last.endsWith("'");
  const lastCore = glottal ? last.slice(0, -1) : last;

  if (BELONGING_NASAL.test(lastCore)) {
    return ["buy"];
  }
  if (BELONGING_STOP.test(lastCore) || (glottal && BELONGING_STOP.test("'"))) {
    return ["puy"];
  }
  if (
    BELONGING_VOWEL.test(last) ||
    BELONGING_LIQUID.test(lastCore) ||
    SUFFIX_SEMIVOWEL.test(lastCore)
  ) {
    return ["puy", "wuy"];
  }
  return ["puy", "wuy"];
}

export function getBelongingHumanSuffixes(base: string): string[] {
  const baseSuffixes = getComitativeSuffixes(base);
  const map: Record<string, string> = {
    gala: "galaŋuwuy",
    kala: "kalaŋuwuy",
    wala: "walaŋuwuy",
  };
  const derived = baseSuffixes.map((suffix) => map[suffix] ?? "galaŋuwuy");
  return Array.from(new Set(derived));
}

export function getTraversiveSuffixes(base: string): string[] {
  const normalized = base
    .trim()
    .toLowerCase()
    .replace(/[ʼ`]/g, "'");
  if (!normalized) return ["kurru", "wurru"];
  const parts = normalized.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const glottal = last.endsWith("'");
  const lastCore = glottal ? last.slice(0, -1) : last;

  if (BELONGING_NASAL.test(lastCore)) {
    return ["gurru"];
  }
  if (BELONGING_STOP.test(lastCore) || (glottal && BELONGING_STOP.test("'"))) {
    return ["kurru"];
  }
  if (
    BELONGING_VOWEL.test(last) ||
    BELONGING_LIQUID.test(lastCore) ||
    SUFFIX_SEMIVOWEL.test(lastCore)
  ) {
    return ["kurru", "wurru"];
  }
  return ["kurru", "wurru"];
}

export function getTraversiveHumanSuffixes(base: string): string[] {
  const baseSuffixes = getComitativeSuffixes(base);
  const map: Record<string, string> = {
    gala: "galaŋuwurru",
    kala: "kalaŋuwurru",
    wala: "walaŋuwurru",
  };
  const derived = baseSuffixes.map((suffix) => map[suffix] ?? "galaŋuwurru");
  return Array.from(new Set(derived));
}

export function getTraversivePossessiveHumanSuffixes(base: string): string[] {
  return getTraversiveHumanSuffixes(base);
}

export function getComitativePossessiveSuffixes(base: string): string[] {
  const baseSuffixes = getComitativeSuffixes(base);
  const map: Record<string, string> = {
    gala: "galaŋuwa",
    kala: "kalaŋuwa",
    wala: "walaŋuwa",
  };
  const derived = baseSuffixes.map((suffix) => map[suffix] ?? "galaŋuwa");
  return Array.from(new Set(derived));
}

export function getComitativePossessiveHumanSuffixes(base: string): string[] {
  const baseSuffixes = getComitativeSuffixes(base);
  const map: Record<string, string> = {
    gala: "galaŋuwala",
    kala: "kalaŋuwala",
    wala: "walaŋuwala",
  };
  const derived = baseSuffixes.map((suffix) => map[suffix] ?? "galaŋuwala");
  return Array.from(new Set(derived));
}

export function getHumanAblativeSuffixes(base: string): string[] {
  const baseSuffixes = getComitativeSuffixes(base);
  return Array.from(new Set(baseSuffixes.map((suffix) => `${suffix}ŋuŋuru`)));
}

export function getSourceOriginSuffixes(base: string): string[] {
  const baseSuffixes = getComitativeSuffixes(base);
  const map: Record<string, string> = {
    gala: "guŋu",
    kala: "kuŋu",
    wala: "wuŋu",
  };
  const derived = baseSuffixes.map((suffix) => map[suffix] ?? "guŋu");
  return Array.from(new Set(derived));
}

export function getOriginPossessiveHumanSuffixes(base: string): string[] {
  const baseSuffixes = getComitativeSuffixes(base);
  const map: Record<string, string> = {
    gala: "galaŋuwuŋu",
    kala: "kalaŋuwuŋu",
    wala: "walaŋuwuŋu",
  };
  const derived = baseSuffixes.map((suffix) => map[suffix] ?? "galaŋuwuŋu");
  return Array.from(new Set(derived));
}

export function getAblativePossessiveHumanSuffixes(base: string): string[] {
  const baseSuffixes = getComitativeSuffixes(base);
  const map: Record<string, string> = {
    gala: "galaŋuŋuru",
    kala: "kalaŋuŋuru",
    wala: "walaŋuŋuru",
  };
  const derived = baseSuffixes.map((suffix) => map[suffix] ?? "galaŋuŋuru");
  return Array.from(new Set(derived));
}
