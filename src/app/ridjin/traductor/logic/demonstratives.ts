import { LanguageMode } from "@/app/components/types/components.type";
import { normalizeToken, stripSpanishDiacritics } from "./tokenUtils";

const DEMO_ES_DHUWALA = new Set(
  ["este", "esta", "estos", "estas", "esto"].map((item) =>
    stripSpanishDiacritics(normalizeToken(item, "es"))
  )
);
const DEMO_ES_DHUWALI = new Set(
  ["ese", "esa", "esos", "esas", "eso"].map((item) =>
    stripSpanishDiacritics(normalizeToken(item, "es"))
  )
);
const DEMO_EN_DHUWALA = new Set(["this", "these"]);
const DEMO_EN_DHUWALI = new Set(["that", "those"]);

export type DemonstrativeKind = "this" | "that";
export type DemonstrativeMatch = {
  gup: string;
  source: string;
  kind: DemonstrativeKind;
  variants: string[];
};

export function matchDemonstrativeToken(
  token: string,
  sourceLang: LanguageMode
): DemonstrativeMatch | null {
  if (sourceLang === "es") {
    const stripped = stripSpanishDiacritics(token);
    if (stripped !== token) {
      return null;
    }
  }
  const normalized =
    sourceLang === "es"
      ? stripSpanishDiacritics(normalizeToken(token, sourceLang))
      : normalizeToken(token, sourceLang);
  if (sourceLang === "es") {
    if (DEMO_ES_DHUWALA.has(normalized)) {
      return {
        gup: "dhuwala",
        source: token,
        kind: "this",
        variants: ["dhuwala"],
      };
    }
    if (DEMO_ES_DHUWALI.has(normalized)) {
      return {
        gup: "dhuwali",
        source: token,
        kind: "that",
        variants: ["dhuwali", "ŋunhi", "ŋunha"],
      };
    }
  } else {
    if (DEMO_EN_DHUWALA.has(normalized)) {
      return {
        gup: "dhuwala",
        source: token,
        kind: "this",
        variants: ["dhuwala"],
      };
    }
    if (DEMO_EN_DHUWALI.has(normalized)) {
      return {
        gup: "dhuwali",
        source: token,
        kind: "that",
        variants: ["dhuwali", "ŋunhi", "ŋunha"],
      };
    }
  }
  return null;
}
