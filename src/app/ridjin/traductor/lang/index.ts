import { LanguageId, LanguagePack, LanguageUiLabels, UiLanguageId } from "../core/types";
import { EN_PACK } from "./en";
import { ES_PACK } from "./es";
import { GUP_PACK } from "./gup";

export const LANG_PACKS: Record<LanguageId, LanguagePack> = {
  es: ES_PACK,
  en: EN_PACK,
  gup: GUP_PACK,
};

const fallbackUi: LanguageUiLabels = {
  option: "Option",
  trad: "Translation",
  desglose: "Breakdown",
  disclaimerNote: "",
};

export const LANG_CONFIG: Record<UiLanguageId, LanguageUiLabels> = {
  es: ES_PACK.ui ?? fallbackUi,
  en: EN_PACK.ui ?? fallbackUi,
};

export function getLanguagePack(id: LanguageId): LanguagePack {
  return LANG_PACKS[id];
}
