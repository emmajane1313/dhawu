import { LanguageMode } from "@/app/components/types/components.type";
import { PersonNumber } from "../core/types";
import { VerbMatch, VerbMatchKind } from "../rules/verb";
import { VerbEntry, VerbForms } from "../lexicon/types";
import { matchAdjectiveAt, matchNounAt } from "./lexiconMatch";
import { normalizeToken, stripSpanishDiacritics } from "./tokenUtils";
import { matchVerbAt } from "../rules/verb";
import { isStrongPunctuationToken } from "./tokenUtils";
import { isNegatorToken } from "./negation";
import { matchObjectPronoun } from "../rules/objectPronoun";
import type { ObjectPronounMatch } from "../rules/objectPronoun";

type MakeAdjMatch = {
  matches: VerbMatch[];
  consumed: number;
  objectBetween?: ObjectPronounMatch | null;
};

type MakeAdjTrigger = {
  kind: VerbMatchKind;
  persons: PersonNumber[];
};

const PERSONS_BY_INDEX: PersonNumber[] = [
  "1_Sing",
  "2_Sing",
  "3_Sing",
  "1+2_Plur",
  "2_Plur",
  "3_Plur",
];

const GOOD_FORMS_ES = new Set(["bueno", "buena", "bien", "buenos", "buenas"]);
const GOOD_FORMS_EN = new Set(["good"]);
const BAD_FORMS_ES = new Set(["malo", "mala", "malos", "malas", "mal"]);
const BAD_FORMS_EN = new Set(["bad", "poor"]);

const ES_MAKE_FORMS = new Map<string, MakeAdjTrigger[]>();
const EN_MAKE_FORMS = new Map<string, MakeAdjTrigger[]>();

const pushTrigger = (
  map: Map<string, MakeAdjTrigger[]>,
  normalized: string,
  kind: VerbMatchKind,
  persons: PersonNumber[]
) => {
  const existing = map.get(normalized) ?? [];
  const key = `${kind}:${persons.join("|")}`;
  if (!existing.some((item) => `${item.kind}:${item.persons.join("|")}` === key)) {
    existing.push({ kind, persons });
  }
  map.set(normalized, existing);
};

const normalizeEsForm = (form: string): string =>
  stripSpanishDiacritics(normalizeToken(form, "es"));
const normalizeEnForm = (form: string): string => normalizeToken(form, "en");

const addSpanishSet = (forms: string[], kind: VerbMatchKind) => {
  forms.forEach((form, idx) => {
    pushTrigger(ES_MAKE_FORMS, normalizeEsForm(form), kind, [
      PERSONS_BY_INDEX[idx],
    ]);
  });
};

const addSpanishImperative = (forms: string[], persons: PersonNumber[]) => {
  forms.forEach((form, idx) => {
    pushTrigger(ES_MAKE_FORMS, normalizeEsForm(form), "imperative", [
      persons[idx],
    ]);
  });
};

const addEnglishSet = (
  forms: string[],
  kind: VerbMatchKind,
  persons: PersonNumber[]
) => {
  forms.forEach((form) => {
    pushTrigger(EN_MAKE_FORMS, normalizeEnForm(form), kind, persons);
  });
};

// Spanish: hacer
addSpanishSet(["hago", "haces", "hace", "hacemos", "hacéis", "hacen"], "present");
addSpanishSet(
  ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
  "past_simple"
);
addSpanishSet(
  ["hacía", "hacías", "hacía", "hacíamos", "hacíais", "hacían"],
  "past_continuous"
);
addSpanishSet(["haré", "harás", "hará", "haremos", "haréis", "harán"], "future");
addSpanishSet(
  ["haría", "harías", "haría", "haríamos", "haríais", "harían"],
  "past_continuous"
);
addSpanishSet(["haga", "hagas", "haga", "hagamos", "hagáis", "hagan"], "subjunctive");
addSpanishImperative(
  ["haz", "haga", "hagamos", "haced", "hagan"],
  ["2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"]
);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("hacer"), "infinitive", []);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("haciendo"), "gerund", []);

// Spanish: convertir
addSpanishSet(
  [
    "convierto",
    "conviertes",
    "convierte",
    "convertimos",
    "convertís",
    "convierten",
  ],
  "present"
);
addSpanishSet(
  [
    "convertí",
    "convertiste",
    "convirtió",
    "convertimos",
    "convertisteis",
    "convirtieron",
  ],
  "past_simple"
);
addSpanishSet(
  [
    "convertía",
    "convertías",
    "convertía",
    "convertíamos",
    "convertíais",
    "convertían",
  ],
  "past_continuous"
);
addSpanishSet(
  [
    "convertiré",
    "convertirás",
    "convertirá",
    "convertiremos",
    "convertiréis",
    "convertirán",
  ],
  "future"
);
addSpanishSet(
  [
    "convertiría",
    "convertirías",
    "convertiría",
    "convertiríamos",
    "convertiríais",
    "convertirían",
  ],
  "past_continuous"
);
addSpanishSet(
  ["convierta", "conviertas", "convierta", "convirtamos", "convirtáis", "conviertan"],
  "subjunctive"
);
addSpanishImperative(
  ["convierte", "convierta", "convirtamos", "convertid", "conviertan"],
  ["2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"]
);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("convertir"), "infinitive", []);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("convirtiendo"), "gerund", []);

// Spanish: poner
addSpanishSet(
  ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"],
  "present"
);
addSpanishSet(
  ["puse", "pusiste", "puso", "pusimos", "pusisteis", "pusieron"],
  "past_simple"
);
addSpanishSet(
  ["ponía", "ponías", "ponía", "poníamos", "poníais", "ponían"],
  "past_continuous"
);
addSpanishSet(
  ["pondré", "pondrás", "pondrá", "pondremos", "pondréis", "pondrán"],
  "future"
);
addSpanishSet(
  ["pondría", "pondrías", "pondría", "pondríamos", "pondríais", "pondrían"],
  "past_continuous"
);
addSpanishSet(
  ["ponga", "pongas", "ponga", "pongamos", "pongáis", "pongan"],
  "subjunctive"
);
addSpanishImperative(
  ["pon", "ponga", "pongamos", "poned", "pongan"],
  ["2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"]
);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("poner"), "infinitive", []);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("poniendo"), "gerund", []);

// Spanish: dejar
addSpanishSet(
  ["dejo", "dejas", "deja", "dejamos", "dejáis", "dejan"],
  "present"
);
addSpanishSet(
  ["dejé", "dejaste", "dejó", "dejamos", "dejasteis", "dejaron"],
  "past_simple"
);
addSpanishSet(
  ["dejaba", "dejabas", "dejaba", "dejábamos", "dejabais", "dejaban"],
  "past_continuous"
);
addSpanishSet(
  ["dejaré", "dejarás", "dejará", "dejaremos", "dejaréis", "dejarán"],
  "future"
);
addSpanishSet(
  ["dejaría", "dejarías", "dejaría", "dejaríamos", "dejaríais", "dejarían"],
  "past_continuous"
);
addSpanishSet(
  ["deje", "dejes", "deje", "dejemos", "dejéis", "dejen"],
  "subjunctive"
);
addSpanishImperative(
  ["deja", "deje", "dejemos", "dejad", "dejen"],
  ["2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"]
);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("dejar"), "infinitive", []);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("dejando"), "gerund", []);

// Spanish: transformar
addSpanishSet(
  [
    "transformo",
    "transformas",
    "transforma",
    "transformamos",
    "transformáis",
    "transforman",
  ],
  "present"
);
addSpanishSet(
  [
    "transformé",
    "transformaste",
    "transformó",
    "transformamos",
    "transformasteis",
    "transformaron",
  ],
  "past_simple"
);
addSpanishSet(
  [
    "transformaba",
    "transformabas",
    "transformaba",
    "transformábamos",
    "transformabais",
    "transformaban",
  ],
  "past_continuous"
);
addSpanishSet(
  [
    "transformaré",
    "transformarás",
    "transformará",
    "transformaremos",
    "transformaréis",
    "transformarán",
  ],
  "future"
);
addSpanishSet(
  [
    "transformaría",
    "transformarías",
    "transformaría",
    "transformaríamos",
    "transformaríais",
    "transformarían",
  ],
  "past_continuous"
);
addSpanishSet(
  ["transforme", "transformes", "transforme", "transformemos", "transforméis", "transformen"],
  "subjunctive"
);
addSpanishImperative(
  ["transforma", "transforme", "transformemos", "transformad", "transformen"],
  ["2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"]
);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("transformar"), "infinitive", []);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("transformando"), "gerund", []);

// Spanish: tornar
addSpanishSet(
  ["torno", "tornas", "torna", "tornamos", "tornáis", "tornan"],
  "present"
);
addSpanishSet(
  ["torné", "tornaste", "tornó", "tornamos", "tornasteis", "tornaron"],
  "past_simple"
);
addSpanishSet(
  ["tornaba", "tornabas", "tornaba", "tornábamos", "tornabais", "tornaban"],
  "past_continuous"
);
addSpanishSet(
  ["tornaré", "tornarás", "tornará", "tornaremos", "tornaréis", "tornarán"],
  "future"
);
addSpanishSet(
  ["tornaría", "tornarías", "tornaría", "tornaríamos", "tornaríais", "tornarían"],
  "past_continuous"
);
addSpanishSet(
  ["torne", "tornes", "torne", "tornemos", "tornéis", "tornen"],
  "subjunctive"
);
addSpanishImperative(
  ["torna", "torne", "tornemos", "tornad", "tornen"],
  ["2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"]
);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("tornar"), "infinitive", []);
pushTrigger(ES_MAKE_FORMS, normalizeEsForm("tornando"), "gerund", []);

// English: make/turn/cause
addEnglishSet(["make"], "present", ["1_Sing"]);
addEnglishSet(["make"], "present", ["2_Sing"]);
addEnglishSet(["makes"], "present", ["3_Sing"]);
addEnglishSet(["make"], "present", ["1+2_Plur"]);
addEnglishSet(["make"], "present", ["2_Plur"]);
addEnglishSet(["make"], "present", ["3_Plur"]);
addEnglishSet(["made"], "past_simple", PERSONS_BY_INDEX);
addEnglishSet(["making"], "gerund", []);
pushTrigger(EN_MAKE_FORMS, normalizeEnForm("make"), "infinitive", []);

addEnglishSet(["turn"], "present", ["1_Sing"]);
addEnglishSet(["turn"], "present", ["2_Sing"]);
addEnglishSet(["turns"], "present", ["3_Sing"]);
addEnglishSet(["turn"], "present", ["1+2_Plur"]);
addEnglishSet(["turn"], "present", ["2_Plur"]);
addEnglishSet(["turn"], "present", ["3_Plur"]);
addEnglishSet(["turned"], "past_simple", PERSONS_BY_INDEX);
addEnglishSet(["turning"], "gerund", []);
pushTrigger(EN_MAKE_FORMS, normalizeEnForm("turn"), "infinitive", []);

addEnglishSet(["cause"], "present", ["1_Sing"]);
addEnglishSet(["cause"], "present", ["2_Sing"]);
addEnglishSet(["causes"], "present", ["3_Sing"]);
addEnglishSet(["cause"], "present", ["1+2_Plur"]);
addEnglishSet(["cause"], "present", ["2_Plur"]);
addEnglishSet(["cause"], "present", ["3_Plur"]);
addEnglishSet(["caused"], "past_simple", PERSONS_BY_INDEX);
addEnglishSet(["causing"], "gerund", []);
pushTrigger(EN_MAKE_FORMS, normalizeEnForm("cause"), "infinitive", []);

const dummyVerbForms: VerbForms = {
  infinitive: "",
  presentIndicative: ["", "", "", "", "", ""],
  preterite: ["", "", "", "", "", ""],
  imperfect: ["", "", "", "", "", ""],
  future: ["", "", "", "", "", ""],
  conditional: ["", "", "", "", "", ""],
  presentSubjunctive: ["", "", "", "", "", ""],
  imperative: {
    tu: "",
    usted: "",
    nosotros: "",
    vosotros: "",
    ustedes: "",
  },
  gerund: "",
  pastParticiple: "",
};

const buildMakeAdjEntry = (gupForms: string[]): VerbEntry => ({
  meaningKey: "verb.make-adj",
  gup: gupForms[0],
  pos: "verb",
  verbGroup: 7,
  gupForms,
  plurals: [],
  isTransitive: true,
  isPlural: false,
  conjugations: { es: [dummyVerbForms], en: [dummyVerbForms] },
});

const normalizeEs = (token: string): string =>
  stripSpanishDiacritics(normalizeToken(token, "es"));

const resolveMakeAdjSuffixes = (base: string): string[] => {
  const normalized = base.toLowerCase();
  const endsWith = (value: string): boolean => normalized.endsWith(value);
  if (endsWith("m") || endsWith("ṉ") || endsWith("n") || endsWith("ŋ") || endsWith("ny")) {
    return ["guma", "dhama"];
  }
  if (
    endsWith("y") ||
    endsWith("w") ||
    endsWith("l") ||
    endsWith("rr") ||
    endsWith("r") ||
    endsWith("p") ||
    endsWith("t") ||
    endsWith("k") ||
    endsWith("ḻ") ||
    endsWith("tj") ||
    endsWith("ṯ") ||
    endsWith("'")
  ) {
    return ["kuma", "thama"];
  }
  if (
    endsWith("a") ||
    endsWith("i") ||
    endsWith("u") ||
    endsWith("a'") ||
    endsWith("i'") ||
    endsWith("u'")
  ) {
    return ["kuma", "yama"];
  }
  return ["kuma", "thama"];
};

const resolveMakeAdjForms = (
  gup: string,
  source: string,
  sourceLang: LanguageMode
): string[][] => {
  const normalized =
    sourceLang === "es" ? normalizeEs(source) : normalizeToken(source, sourceLang);
  if (gup === "manymak") {
    return [["ŋamathama", "ŋamathuŋu", "ŋamathuŋala", "ŋamathunha"]];
  }
  if (
    sourceLang === "es" ? GOOD_FORMS_ES.has(normalized) : GOOD_FORMS_EN.has(normalized)
  ) {
    return [["ŋamathama", "ŋamathuŋu", "ŋamathuŋala", "ŋamathunha"]];
  }
  if (
    sourceLang === "es" ? BAD_FORMS_ES.has(normalized) : BAD_FORMS_EN.has(normalized)
  ) {
    return [["yätjama", "yätjuŋu", "yätjuŋala", "yätjunha"]];
  }
  const suffixes = resolveMakeAdjSuffixes(gup);
  const map: Record<string, [string, string, string, string]> = {
    guma: ["guma", "guŋu", "guŋala", "gunha"],
    kuma: ["kuma", "kuŋu", "kuŋala", "kunha"],
    yama: ["yama", "yuŋu", "yuŋala", "yunha"],
    dhama: ["dhama", "dhuŋu", "dhuŋala", "dhunha"],
    thama: ["thama", "thuŋu", "thuŋala", "thunha"],
  };
  return suffixes.map((suffix) =>
    map[suffix].map((form) => `${gup}${form}`)
  );
};

const parseAdjective = (
  tokens: { source: string }[],
  startIndex: number,
  sourceLang: LanguageMode
): { gup: string; source: string; consumed: number } | null => {
  const adjMatch = matchAdjectiveAt(tokens, startIndex, sourceLang);
  if (adjMatch) {
    return {
      gup: adjMatch.gup,
      source: adjMatch.source,
      consumed: adjMatch.consumed,
    };
  }
  const token = tokens[startIndex];
  if (!token) return null;
  if (isStrongPunctuationToken(token)) return null;
  if (isNegatorToken(token, sourceLang)) return null;
  if (matchVerbAt(tokens, startIndex, sourceLang).length > 0) return null;
  if (matchNounAt(tokens, startIndex, sourceLang)) return null;
  return { gup: token.source, source: token.source, consumed: 1 };
};

const buildMakeAdjMatch = (args: {
  tokens: { source: string }[];
  startIndex: number;
  verbIndex: number;
  trigger: MakeAdjTrigger;
  adjective: { gup: string; source: string; consumed: number };
  consumedPrefix: number;
  sourceLang: LanguageMode;
}): VerbMatch | null => {
  const {
    tokens,
    startIndex,
    verbIndex,
    trigger,
    adjective,
    consumedPrefix,
    sourceLang,
  } = args;
  const forms = resolveMakeAdjForms(adjective.gup, adjective.source, sourceLang);
  if (forms.length === 0) return null;
  const primary = forms[0];
  const alternative = forms.length > 1 ? forms[1] : null;
  const entry = buildMakeAdjEntry(primary);
  const matchSource = tokens
    .slice(startIndex, verbIndex + 1)
    .map((t) => t.source)
    .join(" ");
  const consumed = consumedPrefix + 1 + adjective.consumed;
  return {
    entry,
    forms: dummyVerbForms,
    kind: trigger.kind,
    personNumbers: trigger.persons,
    consumed,
    source: matchSource,
    surface: matchSource,
    altGupForms: alternative ?? undefined,
  };
};

export function matchMakeAdjAt(
  tokens: { source: string }[],
  index: number,
  sourceLang: LanguageMode
): MakeAdjMatch | null {
  const token = tokens[index];
  if (!token) return null;

  let verbIndex = index;
  let consumedPrefix = 0;
  let normalized = normalizeToken(token.source, sourceLang);
  if (sourceLang === "es") {
    normalized = normalizeEs(token.source);
    const triggers = ES_MAKE_FORMS.get(normalized);
    if (!triggers || triggers.length === 0) return null;
    let adjectiveIndex = verbIndex + 1;
    let objectBetween: ObjectPronounMatch | null = null;
    const objMatch = tokens[adjectiveIndex]
      ? matchObjectPronoun(tokens[adjectiveIndex].source, sourceLang)
      : null;
    if (objMatch) {
      objectBetween = objMatch;
      adjectiveIndex += 1;
      consumedPrefix += 1;
    }
    const adjective = parseAdjective(tokens, adjectiveIndex, sourceLang);
    if (!adjective) return null;
    const matches: VerbMatch[] = [];
    for (const trigger of triggers) {
      const match = buildMakeAdjMatch({
        tokens,
        startIndex: index,
        verbIndex,
        trigger,
        adjective,
        consumedPrefix,
        sourceLang,
      });
      if (match) matches.push(match);
    }
    if (matches.length === 0) return null;
    return { matches, consumed: matches[0].consumed, objectBetween };
  }

  normalized = normalizeToken(token.source, sourceLang);
  const triggers = EN_MAKE_FORMS.get(normalized);
  if (!triggers || triggers.length === 0) return null;
  let adjectiveIndex = verbIndex + 1;
  let objectBetween: ObjectPronounMatch | null = null;
  const objMatch = tokens[adjectiveIndex]
    ? matchObjectPronoun(tokens[adjectiveIndex].source, sourceLang)
    : null;
  if (objMatch) {
    objectBetween = objMatch;
    adjectiveIndex += 1;
    consumedPrefix += 1;
  }
  const adjective = parseAdjective(tokens, adjectiveIndex, sourceLang);
  if (!adjective) return null;
  const matches: VerbMatch[] = [];
  for (const trigger of triggers) {
    const match = buildMakeAdjMatch({
      tokens,
      startIndex: index,
      verbIndex,
      trigger,
      adjective,
      consumedPrefix,
      sourceLang,
    });
    if (match) matches.push(match);
  }
  if (matches.length === 0) return null;
  return { matches, consumed: matches[0].consumed, objectBetween };
}
