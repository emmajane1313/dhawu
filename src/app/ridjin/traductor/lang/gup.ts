import { LanguagePack } from "../core/types";

const tokenize = (input: string) =>
  input
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const normalize = (token: string) => token.trim().toLowerCase();

export const GUP_PACK: LanguagePack = {
  id: "gup",
  displayName: "Gupapuyngu",
  tokenize,
  normalize,
};
