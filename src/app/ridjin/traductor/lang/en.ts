import { LanguagePack } from "../core/types";

const tokenize = (input: string) =>
  input
    .replace(/,/g, " , ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const normalize = (token: string) => {
  const trimmed = token.trim().toLowerCase();
  if (trimmed === ",") return ",";
  return trimmed.replace(/^[,]+|[,]+$/g, "");
};

export const EN_PACK: LanguagePack = {
  id: "en",
  displayName: "English",
  tokenize,
  normalize,
  dualMarkers: ["two", "2", "both"],
  emphasisMarkers: [
    "myself",
    "yourself",
    "himself",
    "herself",
    "itself",
    "ourselves",
    "yourselves",
    "themselves",
    "own",
  ],
  conjunctions: ["and", ","],
  otherGroupPatterns: [
    ["the", "others"],
    ["others"],
    ["the", "rest"],
    ["the", "other", "two"],
    ["the", "two", "others"],
  ],
  pronounTriggers: {
    i: "1_Sing",
    you: "2_Sing",
    he: "3_Sing",
    she: "3_Sing",
    it: "3_Sing",
    we: "1+2_Plur",
    they: "3_Plur",
  },
  ui: {
    option: "Option",
    trad: "Translation",
    desglose: "Breakdown",
    disclaimerNote:
      "Note: This dictionary is still in development. It will continue to improve over time. Spanish entries have been verified. English and other languages will be added gradually. Also note that word order in Gupapuyngu sentences is not fixed, the word you want to emphasize can be placed first.",
  },
};
