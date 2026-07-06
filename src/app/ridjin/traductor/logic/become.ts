import { LanguageMode } from "@/app/components/types/components.type";
import { PersonNumber } from "../core/types";
import { VerbMatch, VerbMatchKind } from "../rules/verb";
import { VerbEntry, VerbForms } from "../lexicon/types";
import { matchAdjectiveAt, matchNounAt } from "./lexiconMatch";
import { normalizeToken, stripSpanishDiacritics } from "./tokenUtils";
import { matchVerbAt } from "../rules/verb";
import { isStrongPunctuationToken } from "./tokenUtils";
import { isNegatorToken } from "./negation";

type BecomeMatch = {
  matches: VerbMatch[];
  consumed: number;
};

type BecomeTrigger = {
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

const ES_REFLEXIVE = new Set(["me", "te", "se", "nos", "os"]);

const ES_BECOME_FORMS = new Map<string, BecomeTrigger[]>();
const EN_BECOME_FORMS = new Map<string, BecomeTrigger[]>();

const pushTrigger = (
  map: Map<string, BecomeTrigger[]>,
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
    pushTrigger(
      ES_BECOME_FORMS,
      normalizeEsForm(form),
      kind,
      [PERSONS_BY_INDEX[idx]]
    );
  });
};

const addSpanishImperative = (forms: string[], persons: PersonNumber[]) => {
  forms.forEach((form, idx) => {
    pushTrigger(
      ES_BECOME_FORMS,
      normalizeEsForm(form),
      "imperative",
      [persons[idx]]
    );
  });
};

const addEnglishSet = (
  forms: string[],
  kind: VerbMatchKind,
  persons: PersonNumber[]
) => {
  forms.forEach((form) => {
    pushTrigger(EN_BECOME_FORMS, normalizeEnForm(form), kind, persons);
  });
};

const addEnglishImperative = (forms: string[]) => {
  forms.forEach((form) => {
    pushTrigger(EN_BECOME_FORMS, normalizeEnForm(form), "imperative", []);
  });
};

// Spanish: volverse
addSpanishSet(
  ["vuelvo", "vuelves", "vuelve", "volvemos", "volvéis", "vuelven"],
  "present"
);
addSpanishSet(
  ["volví", "volviste", "volvió", "volvimos", "volvisteis", "volvieron"],
  "past_simple"
);
addSpanishSet(
  ["volvía", "volvías", "volvía", "volvíamos", "volvíais", "volvían"],
  "past_continuous"
);
addSpanishSet(
  ["volveré", "volverás", "volverá", "volveremos", "volveréis", "volverán"],
  "future"
);
addSpanishSet(
  ["volvería", "volverías", "volvería", "volveríamos", "volveríais", "volverían"],
  "past_continuous"
);
addSpanishSet(
  ["vuelva", "vuelvas", "vuelva", "volvamos", "volváis", "vuelvan"],
  "subjunctive"
);
addSpanishImperative(
  ["vuelve", "vuelva", "volvamos", "volved", "vuelvan"],
  ["2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"]
);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("volver"), "infinitive", []);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("volverse"), "infinitive", []);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("volviendo"), "gerund", []);

// Spanish: convertirse
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
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("convertir"), "infinitive", []);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("convertirse"), "infinitive", []);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("convirtiendo"), "gerund", []);

// Spanish: hacerse
addSpanishSet(["hago", "haces", "hace", "hacemos", "hacéis", "hacen"], "present");
addSpanishSet(["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"], "past_simple");
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
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("hacer"), "infinitive", []);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("hacerse"), "infinitive", []);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("haciendo"), "gerund", []);

// Spanish: ponerse
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
addSpanishSet(["ponga", "pongas", "ponga", "pongamos", "pongáis", "pongan"], "subjunctive");
addSpanishImperative(
  ["pon", "ponga", "pongamos", "poned", "pongan"],
  ["2_Sing", "3_Sing", "1+2_Plur", "2_Plur", "3_Plur"]
);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("poner"), "infinitive", []);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("ponerse"), "infinitive", []);
pushTrigger(ES_BECOME_FORMS, normalizeEsForm("poniendo"), "gerund", []);

// English: become/get/turn/grow
addEnglishSet(["become"], "present", [
  "1_Sing",
  "2_Sing",
  "1+2_Plur",
  "2_Plur",
  "3_Plur",
]);
addEnglishSet(["becomes"], "present", ["3_Sing"]);
addEnglishSet(["became"], "past_simple", PERSONS_BY_INDEX);
addEnglishSet(["becoming"], "gerund", []);
addEnglishImperative(["become"]);
addEnglishSet(["get"], "present", [
  "1_Sing",
  "2_Sing",
  "1+2_Plur",
  "2_Plur",
  "3_Plur",
]);
addEnglishSet(["gets"], "present", ["3_Sing"]);
addEnglishSet(["got"], "past_simple", PERSONS_BY_INDEX);
addEnglishSet(["getting"], "gerund", []);
addEnglishImperative(["get"]);
addEnglishSet(["turn"], "present", [
  "1_Sing",
  "2_Sing",
  "1+2_Plur",
  "2_Plur",
  "3_Plur",
]);
addEnglishSet(["turns"], "present", ["3_Sing"]);
addEnglishSet(["turned"], "past_simple", PERSONS_BY_INDEX);
addEnglishSet(["turning"], "gerund", []);
addEnglishImperative(["turn"]);
addEnglishSet(["grow"], "present", [
  "1_Sing",
  "2_Sing",
  "1+2_Plur",
  "2_Plur",
  "3_Plur",
]);
addEnglishSet(["grows"], "present", ["3_Sing"]);
addEnglishSet(["grew"], "past_simple", PERSONS_BY_INDEX);
addEnglishSet(["growing"], "gerund", []);
addEnglishSet(["grown"], "past_simple", PERSONS_BY_INDEX);
addEnglishImperative(["grow"]);

const GOOD_FORMS_ES = new Set(["bueno", "buena", "bien", "buenos", "buenas"]);
const GOOD_FORMS_EN = new Set(["good"]);
const BAD_FORMS_ES = new Set(["malo", "mala", "malos", "malas"]);
const BAD_FORMS_EN = new Set(["bad"]);

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

const buildBecomeEntry = (base: string): VerbEntry => ({
  meaningKey: "verb.become-adj",
  gup: base,
  pos: "verb",
  verbGroup: 3,
  gupForms: [base, base, `${base}na`, `${base}nha`, `${base}nhara`],
  plurals: [],
  isTransitive: false,
  isPlural: false,
  conjugations: { es: [dummyVerbForms], en: [dummyVerbForms] },
});

const normalizeEs = (token: string): string =>
  stripSpanishDiacritics(normalizeToken(token, "es"));

const stripReflexiveSuffix = (normalized: string): string => {
  for (const suffix of ["me", "te", "se", "nos", "os"]) {
    if (normalized.endsWith(suffix) && normalized.length > suffix.length + 1) {
      return normalized.slice(0, -suffix.length);
    }
  }
  return normalized;
};

const resolveBecomeSuffixes = (base: string): string[] => {
  const normalized = base.toLowerCase();
  const endsWith = (value: string): boolean => normalized.endsWith(value);
  if (
    endsWith("m") ||
    endsWith("n") ||
    endsWith("ṉ") ||
    endsWith("ŋ") ||
    endsWith("ny")
  ) {
    return ["dhirri"];
  }
  if (
    endsWith("p") ||
    endsWith("t") ||
    endsWith("ṯ") ||
    endsWith("tj") ||
    endsWith("k") ||
    endsWith("y") ||
    endsWith("w") ||
    endsWith("'")
  ) {
    return ["thirri"];
  }
  if (
    endsWith("l") ||
    endsWith("rr") ||
    endsWith("r") ||
    endsWith("ḻ") ||
    endsWith("a") ||
    endsWith("i") ||
    endsWith("u") ||
    endsWith("a'") ||
    endsWith("i'") ||
    endsWith("u'") ||
    endsWith("l'") ||
    endsWith("ḻ'") ||
    endsWith("r'") ||
    endsWith("rr'")
  ) {
    return ["thirri", "yirri"];
  }
  return ["thirri"];
};

const resolveBecomeForms = (
  gup: string,
  source: string,
  sourceLang: LanguageMode,
  meaningKey?: string
): string[] => {
  const normalized =
    sourceLang === "es" ? normalizeEs(source) : normalizeToken(source, sourceLang);
  if (gup === "manymak") return ["ŋamathirri"];
  if (
    sourceLang === "es" ? GOOD_FORMS_ES.has(normalized) : GOOD_FORMS_EN.has(normalized)
  ) {
    return ["ŋamathirri"];
  }
  if (
    sourceLang === "es" ? BAD_FORMS_ES.has(normalized) : BAD_FORMS_EN.has(normalized)
  ) {
    return ["yätjirri"];
  }
  const suffixes = resolveBecomeSuffixes(gup);
  return suffixes.map((suffix) => `${gup}${suffix}`);
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

const buildBecomeMatch = (args: {
  tokens: { source: string }[];
  startIndex: number;
  verbIndex: number;
  consumedPrefix: number;
  trigger: BecomeTrigger;
  adjective: { gup: string; source: string; consumed: number };
  sourceLang: LanguageMode;
}): BecomeMatch | null => {
  const { tokens, startIndex, verbIndex, consumedPrefix, trigger, adjective, sourceLang } =
    args;
  const forms = resolveBecomeForms(
    adjective.gup,
    adjective.source,
    sourceLang
  );
  if (forms.length === 0) return null;
  const primary = forms[0];
  const alternative = forms.length > 1 ? forms[1] : null;
  const entry = buildBecomeEntry(primary);
  const matchSource = tokens
    .slice(startIndex, verbIndex + 1)
    .map((t) => t.source)
    .join(" ");
  const consumed = consumedPrefix + 1 + adjective.consumed;
  const baseMatch: VerbMatch = {
    entry,
    forms: dummyVerbForms,
    kind: trigger.kind,
    personNumbers: trigger.persons,
    consumed,
    source: matchSource,
    surface: matchSource,
    altGupForms: alternative
      ? [
          alternative,
          alternative,
          `${alternative}na`,
          `${alternative}nha`,
          `${alternative}nhara`,
        ]
      : undefined,
  };
  return { matches: [baseMatch], consumed };
};

export function matchBecomeAt(
  tokens: { source: string }[],
  index: number,
  sourceLang: LanguageMode
): BecomeMatch | null {
  const token = tokens[index];
  if (!token) return null;

  let verbIndex = index;
  let consumedPrefix = 0;
  let normalized = normalizeToken(token.source, sourceLang);
  if (sourceLang === "es") {
    normalized = normalizeEs(token.source);
    if (ES_REFLEXIVE.has(normalized)) {
      const next = tokens[index + 1];
      if (!next) return null;
      verbIndex = index + 1;
      consumedPrefix = 1;
      normalized = normalizeEs(next.source);
    }
    let lookup = normalized;
    const stripped = stripReflexiveSuffix(normalized);
    if (!ES_BECOME_FORMS.has(lookup) && stripped !== normalized) {
      lookup = stripped;
    }
    const triggers = ES_BECOME_FORMS.get(lookup);
    if (!triggers || triggers.length === 0) return null;
    const adjective = parseAdjective(tokens, verbIndex + 1, sourceLang);
    if (!adjective) return null;
    const matches: VerbMatch[] = [];
    let consumed: number | null = null;
    for (const trigger of triggers) {
      const match = buildBecomeMatch({
        tokens,
        startIndex: index,
        verbIndex,
        consumedPrefix,
        trigger,
        adjective,
        sourceLang,
      });
      if (match) {
        matches.push(...match.matches);
        consumed = match.consumed;
      }
    }
    if (!consumed || matches.length === 0) return null;
    return { matches, consumed };
  }

  // English
  if (normalized === "to") {
    const next = tokens[index + 1];
    if (!next) return null;
    const nextNorm = normalizeToken(next.source, sourceLang);
    const toTriggers = EN_BECOME_FORMS.get(nextNorm);
    if (!toTriggers || toTriggers.length === 0) return null;
    verbIndex = index + 1;
    consumedPrefix = 1;
    const adjective = parseAdjective(tokens, verbIndex + 1, sourceLang);
    if (!adjective) return null;
    const matches: VerbMatch[] = [];
    let consumed: number | null = null;
    for (const trigger of toTriggers) {
      const infTrigger: BecomeTrigger = { ...trigger, kind: "infinitive", persons: [] };
      const match = buildBecomeMatch({
        tokens,
        startIndex: index,
        verbIndex,
        consumedPrefix,
        trigger: infTrigger,
        adjective,
        sourceLang,
      });
      if (match) {
        matches.push(...match.matches);
        consumed = match.consumed;
      }
    }
    if (!consumed || matches.length === 0) return null;
    return { matches, consumed };
  }

  const triggers = EN_BECOME_FORMS.get(normalized);
  if (!triggers || triggers.length === 0) return null;
  const adjective = parseAdjective(tokens, verbIndex + 1, sourceLang);
  if (!adjective) return null;
  const matches: VerbMatch[] = [];
  let consumed: number | null = null;
  for (const trigger of triggers) {
    const match = buildBecomeMatch({
      tokens,
      startIndex: index,
      verbIndex,
      consumedPrefix,
      trigger,
      adjective,
      sourceLang,
    });
    if (match) {
      matches.push(...match.matches);
      consumed = match.consumed;
    }
  }
  if (!consumed || matches.length === 0) return null;
  return { matches, consumed };
}
