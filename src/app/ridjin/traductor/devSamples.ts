import { LanguageMode } from "@/app/components/types/components.type";
import { TranslationResult, VariantScope } from "./core/types";
import { setObjectTraceCollector } from "./logic/objects";
import { setEngineTraceCollector } from "./engine";

export const DEV_SAMPLE_TRIGGER = "marrtji";
export const DEV_SAMPLE_RESET_TRIGGER = "marrtji reset";
export const DEV_SAMPLE_RESET_SUBJECTS_TRIGGER = "marrtji reset subjects";
export const DEV_SAMPLE_RESET_SUBJECT_EMPHASIS_TRIGGER =
  "marrtji reset subject-emphasis";
export const DEV_SAMPLE_RESET_OBJECT_EMPHASIS_TRIGGER =
  "marrtji reset object-emphasis";
export const DEV_SAMPLE_RESET_POSSESSIVE_EMPHASIS_TRIGGER =
  "marrtji reset possessive-emphasis";
export const DEV_SAMPLE_RESET_POSSESSIVE_REFLEXIVE_TRIGGER =
  "marrtji reset possessive-reflexive";
export const DEV_SAMPLE_RESET_COMITATIVE_ALLATIVE_EMPHASIS_TRIGGER =
  "marrtji reset comitative-allative-emphasis";
export const DEV_SAMPLE_RESET_POSSESSIVE_GALA_EMPHASIS_TRIGGER =
  "marrtji reset possessive-gala-emphasis";
export const DEV_SAMPLE_RESET_EXTENDED_PRONOUN_EMPHASIS_TRIGGER =
  "marrtji reset pronoun-emphasis-extended";
export const DEV_SAMPLE_RESET_OBJECTS_TRIGGER = "marrtji reset objects";
export const DEV_SAMPLE_RESET_PAST_TRIGGER = "marrtji reset pasado";
export const DEV_SAMPLE_RESET_PAST_EN_TRIGGER = "marrtji reset past";
export const DEV_SAMPLE_RESET_FUTURE_TRIGGER = "marrtji reset futuro";
export const DEV_SAMPLE_RESET_FUTURE_EN_TRIGGER = "marrtji reset future";
export const DEV_SAMPLE_RESET_PAST_1_TRIGGER = "marrtji reset pasado 1";
export const DEV_SAMPLE_RESET_PAST_2_TRIGGER = "marrtji reset pasado 2";
export const DEV_SAMPLE_RESET_PAST_3_TRIGGER = "marrtji reset pasado 3";
export const DEV_SAMPLE_RESET_PAST_4_TRIGGER = "marrtji reset pasado 4";
export const DEV_SAMPLE_RESET_PAST_5_TRIGGER = "marrtji reset pasado 5";
export const DEV_SAMPLE_RESET_PAST_EN_1_TRIGGER = "marrtji reset past 1";
export const DEV_SAMPLE_RESET_PAST_EN_2_TRIGGER = "marrtji reset past 2";
export const DEV_SAMPLE_RESET_PAST_EN_3_TRIGGER = "marrtji reset past 3";
export const DEV_SAMPLE_RESET_PAST_EN_4_TRIGGER = "marrtji reset past 4";
export const DEV_SAMPLE_RESET_PAST_EN_5_TRIGGER = "marrtji reset past 5";
export const DEV_SAMPLE_RESET_FUTURE_1_TRIGGER = "marrtji reset futuro 1";
export const DEV_SAMPLE_RESET_FUTURE_2_TRIGGER = "marrtji reset futuro 2";
export const DEV_SAMPLE_RESET_FUTURE_3_TRIGGER = "marrtji reset futuro 3";
export const DEV_SAMPLE_RESET_FUTURE_4_TRIGGER = "marrtji reset futuro 4";
export const DEV_SAMPLE_RESET_FUTURE_5_TRIGGER = "marrtji reset futuro 5";
export const DEV_SAMPLE_RESET_FUTURE_EN_1_TRIGGER = "marrtji reset future 1";
export const DEV_SAMPLE_RESET_FUTURE_EN_2_TRIGGER = "marrtji reset future 2";
export const DEV_SAMPLE_RESET_FUTURE_EN_3_TRIGGER = "marrtji reset future 3";
export const DEV_SAMPLE_RESET_FUTURE_EN_4_TRIGGER = "marrtji reset future 4";
export const DEV_SAMPLE_RESET_FUTURE_EN_5_TRIGGER = "marrtji reset future 5";
export const DEV_SAMPLE_RESET_MULTI_OD_TRIGGER = "marrtji reset multi-od";
export const DEV_SAMPLE_RESET_MULTI_OD_1_TRIGGER = "marrtji reset multi-od 1";
export const DEV_SAMPLE_RESET_MULTI_OD_2_TRIGGER = "marrtji reset multi-od 2";
export const DEV_SAMPLE_RESET_MULTI_OD_3_TRIGGER = "marrtji reset multi-od 3";
export const DEV_SAMPLE_RESET_MULTI_OD_4_TRIGGER = "marrtji reset multi-od 4";
export const DEV_SAMPLE_RESET_MULTI_OD_5_TRIGGER = "marrtji reset multi-od 5";
export const DEV_SAMPLE_RESET_MODAL_TRIGGER = "marrtji reset querer";
export const DEV_SAMPLE_RESET_MODAL_EN_TRIGGER = "marrtji reset want";
export const DEV_SAMPLE_RESET_MODAL_1_TRIGGER = "marrtji reset querer 1";
export const DEV_SAMPLE_RESET_MODAL_2_TRIGGER = "marrtji reset querer 2";
export const DEV_SAMPLE_RESET_MODAL_3_TRIGGER = "marrtji reset querer 3";
export const DEV_SAMPLE_RESET_MODAL_4_TRIGGER = "marrtji reset querer 4";
export const DEV_SAMPLE_RESET_MODAL_5_TRIGGER = "marrtji reset querer 5";
export const DEV_SAMPLE_RESET_MODAL_POSSESSIVE_TRIGGER =
  "marrtji reset querer posesion";
export const DEV_SAMPLE_RESET_MODAL_INF_POSSESSIVE_TRIGGER =
  "marrtji reset querer infinitivo posesion";
export const DEV_SAMPLE_RESET_MODAL_EN_1_TRIGGER = "marrtji reset want 1";
export const DEV_SAMPLE_RESET_MODAL_EN_2_TRIGGER = "marrtji reset want 2";
export const DEV_SAMPLE_RESET_MODAL_EN_3_TRIGGER = "marrtji reset want 3";
export const DEV_SAMPLE_RESET_MODAL_EN_4_TRIGGER = "marrtji reset want 4";
export const DEV_SAMPLE_RESET_MODAL_EN_5_TRIGGER = "marrtji reset want 5";
export const DEV_SAMPLE_RESET_MODAL_POSSESSIVE_EN_TRIGGER =
  "marrtji reset want possession";
export const DEV_SAMPLE_RESET_MODAL_INF_POSSESSIVE_EN_TRIGGER =
  "marrtji reset want infinitive possession";
export const DEV_SAMPLE_RESET_BECOME_TRIGGER = "marrtji reset volverse";
export const DEV_SAMPLE_RESET_BECOME_EN_TRIGGER = "marrtji reset become";
export const DEV_SAMPLE_RESET_MAKE_TRIGGER = "marrtji reset hacer";
export const DEV_SAMPLE_RESET_MAKE_EN_TRIGGER = "marrtji reset make";
export const DEV_SAMPLE_RESET_BECOME_1_TRIGGER = "marrtji reset volverse 1";
export const DEV_SAMPLE_RESET_BECOME_2_TRIGGER = "marrtji reset volverse 2";
export const DEV_SAMPLE_RESET_BECOME_3_TRIGGER = "marrtji reset volverse 3";
export const DEV_SAMPLE_RESET_BECOME_4_TRIGGER = "marrtji reset volverse 4";
export const DEV_SAMPLE_RESET_BECOME_5_TRIGGER = "marrtji reset volverse 5";
export const DEV_SAMPLE_RESET_BECOME_EN_1_TRIGGER = "marrtji reset become 1";
export const DEV_SAMPLE_RESET_BECOME_EN_2_TRIGGER = "marrtji reset become 2";
export const DEV_SAMPLE_RESET_BECOME_EN_3_TRIGGER = "marrtji reset become 3";
export const DEV_SAMPLE_RESET_BECOME_EN_4_TRIGGER = "marrtji reset become 4";
export const DEV_SAMPLE_RESET_BECOME_EN_5_TRIGGER = "marrtji reset become 5";
export const DEV_SAMPLE_RESET_MAKE_1_TRIGGER = "marrtji reset hacer 1";
export const DEV_SAMPLE_RESET_MAKE_2_TRIGGER = "marrtji reset hacer 2";
export const DEV_SAMPLE_RESET_MAKE_3_TRIGGER = "marrtji reset hacer 3";
export const DEV_SAMPLE_RESET_MAKE_EN_1_TRIGGER = "marrtji reset make 1";
export const DEV_SAMPLE_RESET_MAKE_EN_2_TRIGGER = "marrtji reset make 2";
export const DEV_SAMPLE_RESET_MAKE_EN_3_TRIGGER = "marrtji reset make 3";
export const DEV_SAMPLE_RESET_HAVE_TRIGGER = "marrtji reset tener";
export const DEV_SAMPLE_RESET_HAVE_EN_TRIGGER = "marrtji reset have";
export const DEV_SAMPLE_RESET_HAVE_1_TRIGGER = "marrtji reset tener 1";
export const DEV_SAMPLE_RESET_HAVE_2_TRIGGER = "marrtji reset tener 2";
export const DEV_SAMPLE_RESET_HAVE_3_TRIGGER = "marrtji reset tener 3";
export const DEV_SAMPLE_RESET_HAVE_EN_1_TRIGGER = "marrtji reset have 1";
export const DEV_SAMPLE_RESET_HAVE_EN_2_TRIGGER = "marrtji reset have 2";
export const DEV_SAMPLE_RESET_HAVE_EN_3_TRIGGER = "marrtji reset have 3";
export const DEV_SAMPLE_RESET_POSSESSION_TRIGGER = "marrtji reset posesion";
export const DEV_SAMPLE_RESET_POSSESSION_EN_TRIGGER =
  "marrtji reset possession";
export const DEV_SAMPLE_RESET_POSSESSION_1_TRIGGER = "marrtji reset posesion 1";
export const DEV_SAMPLE_RESET_POSSESSION_2_TRIGGER = "marrtji reset posesion 2";
export const DEV_SAMPLE_RESET_POSSESSION_3_TRIGGER = "marrtji reset posesion 3";
export const DEV_SAMPLE_RESET_POSSESSION_EN_1_TRIGGER =
  "marrtji reset possession 1";
export const DEV_SAMPLE_RESET_POSSESSION_EN_2_TRIGGER =
  "marrtji reset possession 2";
export const DEV_SAMPLE_RESET_POSSESSION_EN_3_TRIGGER =
  "marrtji reset possession 3";
export const DEV_SAMPLE_RESET_COPULA_TRIGGER = "marrtji reset copula";
export const DEV_SAMPLE_RESET_COPULA_1_TRIGGER = "marrtji reset copula 1";
export const DEV_SAMPLE_RESET_COPULA_2_TRIGGER = "marrtji reset copula 2";
export const DEV_SAMPLE_RESET_COPULA_3_TRIGGER = "marrtji reset copula 3";
export const DEV_SAMPLE_RESET_COPULA_4_TRIGGER = "marrtji reset copula 4";
export const DEV_SAMPLE_RESET_COPULA_5_TRIGGER = "marrtji reset copula 5";
export const DEV_SAMPLE_RESET_LOCATIVE_TRIGGER = "marrtji reset locative";
export const DEV_SAMPLE_RESET_LOCATIVE_ALL_TRIGGER = "marrtji reset locatives";
export const DEV_SAMPLE_RESET_LOCATIVE_1_TRIGGER = "marrtji reset locative 1";
export const DEV_SAMPLE_RESET_LOCATIVE_2_TRIGGER = "marrtji reset locative 2";
export const DEV_SAMPLE_RESET_LOCATIVE_3_TRIGGER = "marrtji reset locative 3";
export const DEV_SAMPLE_RESET_COMITATIVE_TRIGGER = "marrtji reset comitative";
export const DEV_SAMPLE_RESET_COMITATIVE_1_TRIGGER = "marrtji reset comitative 1";
export const DEV_SAMPLE_RESET_COMITATIVE_2_TRIGGER = "marrtji reset comitative 2";
export const DEV_SAMPLE_RESET_COMITATIVE_3_TRIGGER = "marrtji reset comitative 3";
export const DEV_SAMPLE_RESET_COMITATIVE_DEMO_TRIGGER =
  "marrtji reset comitative demo";
export const DEV_SAMPLE_RESET_INSTRUMENTAL_TRIGGER = "marrtji reset instrumental";
export const DEV_SAMPLE_RESET_INSTRUMENTAL_1_TRIGGER =
  "marrtji reset instrumental 1";
export const DEV_SAMPLE_RESET_INSTRUMENTAL_2_TRIGGER =
  "marrtji reset instrumental 2";
export const DEV_SAMPLE_RESET_INSTRUMENTAL_3_TRIGGER =
  "marrtji reset instrumental 3";
export const DEV_SAMPLE_RESET_PURPOSE_TRIGGER = "marrtji reset purpose";
export const DEV_SAMPLE_RESET_PURPOSE_1_TRIGGER = "marrtji reset purpose 1";
export const DEV_SAMPLE_RESET_PURPOSE_2_TRIGGER = "marrtji reset purpose 2";
export const DEV_SAMPLE_RESET_PURPOSE_3_TRIGGER = "marrtji reset purpose 3";
export const DEV_SAMPLE_RESET_ABOUT_TRIGGER = "marrtji reset about";
export const DEV_SAMPLE_RESET_ABOUT_1_TRIGGER = "marrtji reset about 1";
export const DEV_SAMPLE_RESET_ABOUT_2_TRIGGER = "marrtji reset about 2";
export const DEV_SAMPLE_RESET_ABOUT_3_TRIGGER = "marrtji reset about 3";
export const DEV_SAMPLE_RESET_UWUY_DEMO_TRIGGER = "marrtji reset uwuy";
export const DEV_SAMPLE_RESET_CAUSE_VERB_TRIGGER = "marrtji reset cause-verb";
export const DEV_SAMPLE_RESET_ACT_VERB_TRIGGER = "marrtji reset act-verb";
export const DEV_SAMPLE_RESET_CAUSE_AGENT_TRIGGER = "marrtji reset cause-agent";
export const DEV_SAMPLE_RESET_PARTICIPLE_ADJ_TRIGGER =
  "marrtji reset participle-adj";
export const DEV_SAMPLE_RESET_VERBAL_NOUN_TRIGGER =
  "marrtji reset verbal-noun";
export const DEV_SAMPLE_RESET_ORIGIN_TRIGGER = "marrtji reset origin";
export const DEV_SAMPLE_RESET_ORIGIN_1_TRIGGER = "marrtji reset origin 1";
export const DEV_SAMPLE_RESET_ORIGIN_2_TRIGGER = "marrtji reset origin 2";
export const DEV_SAMPLE_RESET_ORIGIN_3_TRIGGER = "marrtji reset origin 3";
export const DEV_SAMPLE_RESET_ALLATIVE_TRIGGER = "marrtji reset allative";
export const DEV_SAMPLE_RESET_ALLATIVE_1_TRIGGER = "marrtji reset allative 1";
export const DEV_SAMPLE_RESET_ALLATIVE_2_TRIGGER = "marrtji reset allative 2";
export const DEV_SAMPLE_RESET_ALLATIVE_3_TRIGGER = "marrtji reset allative 3";
export const DEV_SAMPLE_RESET_ABLATIVE_TRIGGER = "marrtji reset ablative";
export const DEV_SAMPLE_RESET_ABLATIVE_1_TRIGGER = "marrtji reset ablative 1";
export const DEV_SAMPLE_RESET_ABLATIVE_2_TRIGGER = "marrtji reset ablative 2";
export const DEV_SAMPLE_RESET_ABLATIVE_3_TRIGGER = "marrtji reset ablative 3";
export const DEV_SAMPLE_RESET_ABLATIVE_DEMO_TRIGGER =
  "marrtji reset ablative demo";
export const DEV_SAMPLE_RESET_TRAVERSE_TRIGGER = "marrtji reset traversive";
export const DEV_SAMPLE_RESET_TRAVERSE_1_TRIGGER = "marrtji reset traversive 1";
export const DEV_SAMPLE_RESET_TRAVERSE_2_TRIGGER = "marrtji reset traversive 2";
export const DEV_SAMPLE_RESET_TRAVERSE_3_TRIGGER = "marrtji reset traversive 3";
export const DEV_SAMPLE_RESET_TRAVERSE_POSSESSIVE_EMPHATIC_TRIGGER =
  "marrtji reset traversive-possessive-emphatic";
export const DEV_SAMPLE_RESET_REFLEXIVE_OBJECT_TRIGGER =
  "marrtji reset reflexive-object";
export const DEV_SAMPLE_RESET_SIMULTANEOUS_TRIGGER =
  "marrtji reset simultaneous";
export const DEV_SAMPLE_RESET_NEAR_FUTURE_TRIGGER = "marrtji reset porvenir";
export const DEV_SAMPLE_RESET_NEAR_FUTURE_EN_TRIGGER =
  "marrtji reset about-to";
export const DEV_SAMPLE_RESET_DEMO_INTRANSITIVE_TRIGGER =
  "marrtji reset demo-intransitive";
export const DEV_SAMPLE_RESET_DHIYAKI_TRIGGER = "marrtji reset dhiyaki";
export const DEV_SAMPLE_RESET_AGENT_TRIGGER = "marrtji reset agent";
export const DEV_SAMPLE_RESET_LETS_TRIGGER = "marrtji reset vamos";
export const DEV_SAMPLE_RESET_LETS_EN_TRIGGER = "marrtji reset lets";
export const DEV_SAMPLE_RESET_IMPERATIVE_NEG_TRIGGER =
  "marrtji reset imperative-neg";
export const DEV_SAMPLE_RESET_HABITUAL_TRIGGER = "marrtji reset habitual";
export const DEV_SAMPLE_RESET_HABITUAL_EN_TRIGGER = "marrtji reset habitual en";
export const DEV_SAMPLE_RESET_MIGHT_TRIGGER = "marrtji reset quizas";
export const DEV_SAMPLE_RESET_MIGHT_EN_TRIGGER = "marrtji reset might";
export const DEV_SAMPLE_RESET_SHOULD_TRIGGER = "marrtji reset deber";
export const DEV_SAMPLE_RESET_SHOULD_EN_TRIGGER = "marrtji reset should";
export const DEV_SAMPLE_RESET_SHOULD_HAVE_TRIGGER =
  "marrtji reset deber haber";
export const DEV_SAMPLE_RESET_SHOULD_HAVE_EN_TRIGGER =
  "marrtji reset should have";
export const DEV_SAMPLE_RESET_PAST_HABITUAL_TRIGGER =
  "marrtji reset pasado habitual";
export const DEV_SAMPLE_RESET_PAST_HABITUAL_EN_TRIGGER =
  "marrtji reset past habitual";
export const DEV_SAMPLE_ENABLED = true;
const shouldTraceSample = (section: DevSampleSection) =>
  section.startsWith("possession") ||
  section === "modal-possessive" ||
  section === "modal-infinitive-possessive";

export type DevSampleSection =
  | "all"
  | "demo-intransitive"
  | "dhiyaki"
  | "agent"
  | "imperative-lets"
  | "imperative-neg"
  | "subject-emphasis"
  | "object-emphasis"
  | "possessive-emphasis"
  | "possessive-reflexive"
  | "comitative-allative-emphasis"
  | "possessive-gala-emphasis"
  | "pronoun-emphasis-extended"
  | "subjects"
  | "objects"
  | "past"
  | "past-1"
  | "past-2"
  | "past-3"
  | "past-4"
  | "past-5"
  | "future"
  | "future-1"
  | "future-2"
  | "future-3"
  | "future-4"
  | "future-5"
  | "modal"
  | "modal-1"
  | "modal-2"
  | "modal-3"
  | "modal-4"
  | "modal-5"
  | "modal-possessive"
  | "modal-infinitive-possessive"
  | "make"
  | "make-1"
  | "make-2"
  | "make-3"
  | "become"
  | "become-1"
  | "become-2"
  | "become-3"
  | "become-4"
  | "become-5"
  | "have"
  | "have-1"
  | "have-2"
  | "have-3"
  | "possession"
  | "possession-1"
  | "possession-2"
  | "possession-3"
  | "copula"
  | "copula-1"
  | "copula-2"
  | "copula-3"
  | "copula-4"
  | "copula-5"
  | "locative-all"
  | "locative"
  | "locative-1"
  | "locative-2"
  | "locative-3"
  | "allative"
  | "allative-1"
  | "allative-2"
  | "allative-3"
  | "ablative"
  | "ablative-1"
  | "ablative-2"
  | "ablative-3"
  | "ablative-demo"
  | "traversive"
  | "traversive-1"
  | "traversive-2"
  | "traversive-3"
  | "traversive-possessive-emphatic"
  | "reflexive-object"
  | "simultaneous"
  | "near-future"
  | "habitual"
  | "might"
  | "should"
  | "should-have"
  | "past-habitual"
  | "comitative"
  | "comitative-1"
  | "comitative-2"
  | "comitative-3"
  | "comitative-demo"
  | "instrumental"
  | "instrumental-1"
  | "instrumental-2"
  | "instrumental-3"
  | "purpose"
  | "purpose-1"
  | "purpose-2"
  | "purpose-3"
  | "about"
  | "about-1"
  | "about-2"
  | "about-3"
  | "uwuy-demo"
  | "cause-verb"
  | "act-verb"
  | "cause-agent"
  | "verbal-noun"
  | "participle-adj"
  | "origin"
  | "origin-1"
  | "origin-2"
  | "origin-3"
  | "multi-od"
  | "multi-od-1"
  | "multi-od-2"
  | "multi-od-3"
  | "multi-od-4"
  | "multi-od-5";

const DEV_SAMPLE_BASE: Record<LanguageMode, string[]> = {
  es: [
    "yo",
    "tú",
    "él",
    "ella",
    "ello",
    "nosotros",
    "nosotras",
    "ellos",
    "ellas",
    "ustedes",
    "vosotros",
    "vosotras",
    "yo y tú",
    "yo y él",
    "yo y ella",
    "tú y él",
    "tú y ella",
    "él y ella",
    "ellos y ellas",
    "nosotras y ellos",
    "nosotras y ellas",
    "yo y los demás",
    "yo y las demás",
    "yo y los otros",
    "yo y las otras",
    "yo y los otros dos",
    "yo y las otras dos",
    "yo y los dos otros",
    "yo y las dos otras",
    "tú y los demás",
    "tú y las demás",
    "tú y los otros",
    "tú y las otras",
    "él y los demás",
    "ella y las demás",
    "ellos y los demás",
    "ellas y las demás",
    "nosotras y los demás",
    "nosotras y las demás",
    "tú y yo y los demás",
    "yo y tú y los demás",
    "ellos dos",
    "ellas dos",
    "ellos y ellas",
    "nosotros dos",
    "nosotras dos",
    "ustedes dos",
    "vosotros dos",
    "vosotras dos",
    "tú dos",
  ],
  en: [
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "you and i",
    "i and he",
    "i and she",
    "you and he",
    "you and she",
    "he and she",
    "i and the others",
    "i and the rest",
    "i and the other two",
    "i and the two others",
    "you and the others",
    "you and the rest",
    "you and the other two",
    "he and the others",
    "she and the others",
    "they two",
    "we two",
    "you two",
    "they and the others",
    "they and the other two",
    "you and i and the others",
    "i and you and the others",
  ],
};

const EXTRA_SUBJECTS_ES = [
  "alguien",
  "accidente",
  "glorp",
  "alguien y yo",
  "yo y alguien",
  "accidente y yo",
  "alguien y accidente",
  "alguien, accidente",
];

const EXTRA_SUBJECTS_EN = [
  "anyone",
  "accident",
  "glorp",
  "anyone and i",
  "i and anyone",
  "accident and i",
  "anyone and accident",
  "anyone, accident",
];

const COMER_PRESENT_FORMS_ES = [
  "como",
  "comes",
  "come",
  "comemos",
  "coméis",
  "comen",
];
const IR_PRESENT_FORMS_ES = ["voy", "vas", "va", "vamos", "vais", "van"];
const COMER_PRETERITE_FORMS_ES = [
  "comí",
  "comiste",
  "comió",
  "comimos",
  "comisteis",
  "comieron",
];
const COMER_FUTURE_FORMS_ES = [
  "comeré",
  "comerás",
  "comerá",
  "comeremos",
  "comeréis",
  "comerán",
];
const COMER_IMPERFECT_FORMS_ES = [
  "comía",
  "comías",
  "comía",
  "comíamos",
  "comíais",
  "comían",
];

const ESTAR_FUTURE_FORMS_ES = [
  "estaré",
  "estarás",
  "estará",
  "estaremos",
  "estaréis",
  "estarán",
];
const ESTAR_PRESENT_FORMS_ES = [
  "estoy",
  "estás",
  "está",
  "estamos",
  "estáis",
  "están",
];
const SER_PRESENT_FORMS_ES = ["soy", "eres", "es", "somos", "sois", "son"];
const SER_PRETERITE_FORMS_ES = [
  "fui",
  "fuiste",
  "fue",
  "fuimos",
  "fuisteis",
  "fueron",
];
const SER_IMPERFECT_FORMS_ES = [
  "era",
  "eras",
  "era",
  "éramos",
  "erais",
  "eran",
];
const SER_FUTURE_FORMS_ES = [
  "seré",
  "serás",
  "será",
  "seremos",
  "seréis",
  "serán",
];
const TENER_PRESENT_FORMS_ES = [
  "tengo",
  "tienes",
  "tiene",
  "tenemos",
  "tenéis",
  "tienen",
];
const POSEER_PRESENT_FORMS_ES = [
  "poseo",
  "posees",
  "posee",
  "poseemos",
  "poseéis",
  "poseen",
];
const PERTENECER_PRESENT_FORMS_ES = [
  "pertenezco",
  "perteneces",
  "pertenece",
  "pertenecemos",
  "pertenecéis",
  "pertenecen",
];
const CARECER_PRESENT_FORMS_ES = [
  "carezco",
  "careces",
  "carece",
  "carecemos",
  "carecéis",
  "carecen",
];
const ESTAR_PRETERITE_FORMS_ES = [
  "estuve",
  "estuviste",
  "estuvo",
  "estuvimos",
  "estuvisteis",
  "estuvieron",
];
const ESTAR_IMPERFECT_FORMS_ES = [
  "estaba",
  "estabas",
  "estaba",
  "estábamos",
  "estabais",
  "estaban",
];

const ES_MODAL_DJAL_FORMS = [
  ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
  [
    "necesito",
    "necesitas",
    "necesita",
    "necesitamos",
    "necesitáis",
    "necesitan",
  ],
  ["deseo", "deseas", "desea", "deseamos", "deseáis", "desean"],
  ["anhelo", "anhelas", "anhela", "anhelamos", "anheláis", "anhelan"],
];
const ES_MODAL_MARNGI_FORMS = [
  ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
  ["conozco", "conoces", "conoce", "conocemos", "conocéis", "conocen"],
  ["entiendo", "entiendes", "entiende", "entendemos", "entendéis", "entienden"],
  [
    "comprendo",
    "comprendes",
    "comprende",
    "comprendemos",
    "comprendéis",
    "comprenden",
  ],
  [
    "acostumbro",
    "acostumbras",
    "acostumbra",
    "acostumbramos",
    "acostumbráis",
    "acostumbran",
  ],
];

const ES_MODAL_ADJECTIVES = [
  "acostumbrado",
  "acostumbrada",
  "acostumbrados",
  "acostumbradas",
  "habituado",
  "habituada",
  "habituados",
  "habituadas",
  "experimentado",
  "experimentada",
  "experimentados",
  "experimentadas",
];

const EN_MODAL_DJAL_FORMS = [
  ["want", "wants"],
  ["need", "needs"],
  ["desire", "desires"],
];
const EN_MODAL_MARNGI_FORMS = [
  ["know", "knows"],
  ["understand", "understands"],
];

const EN_MODAL_ADJECTIVES = ["accustomed", "experienced"];
const ES_BECOME_FORMS = [
  {
    infinitive: "volver",
    infinitiveReflexive: "volverse",
    gerund: "volviendo",
    present: ["vuelvo", "vuelves", "vuelve", "volvemos", "volvéis", "vuelven"],
    preterite: ["volví", "volviste", "volvió", "volvimos", "volvisteis", "volvieron"],
    imperfect: ["volvía", "volvías", "volvía", "volvíamos", "volvíais", "volvían"],
    future: ["volveré", "volverás", "volverá", "volveremos", "volveréis", "volverán"],
    subjunctive: ["vuelva", "vuelvas", "vuelva", "volvamos", "volváis", "vuelvan"],
    imperative: ["vuelve", "vuelva", "volvamos", "volved", "vuelvan"],
  },
  {
    infinitive: "convertir",
    infinitiveReflexive: "convertirse",
    gerund: "convirtiendo",
    present: [
      "convierto",
      "conviertes",
      "convierte",
      "convertimos",
      "convertís",
      "convierten",
    ],
    preterite: [
      "convertí",
      "convertiste",
      "convirtió",
      "convertimos",
      "convertisteis",
      "convirtieron",
    ],
    imperfect: [
      "convertía",
      "convertías",
      "convertía",
      "convertíamos",
      "convertíais",
      "convertían",
    ],
    future: [
      "convertiré",
      "convertirás",
      "convertirá",
      "convertiremos",
      "convertiréis",
      "convertirán",
    ],
    subjunctive: [
      "convierta",
      "conviertas",
      "convierta",
      "convirtamos",
      "convirtáis",
      "conviertan",
    ],
    imperative: ["convierte", "convierta", "convirtamos", "convertid", "conviertan"],
  },
  {
    infinitive: "hacer",
    infinitiveReflexive: "hacerse",
    gerund: "haciendo",
    present: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
    preterite: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
    imperfect: ["hacía", "hacías", "hacía", "hacíamos", "hacíais", "hacían"],
    future: ["haré", "harás", "hará", "haremos", "haréis", "harán"],
    subjunctive: ["haga", "hagas", "haga", "hagamos", "hagáis", "hagan"],
    imperative: ["haz", "haga", "hagamos", "haced", "hagan"],
  },
  {
    infinitive: "poner",
    infinitiveReflexive: "ponerse",
    gerund: "poniendo",
    present: ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"],
    preterite: ["puse", "pusiste", "puso", "pusimos", "pusisteis", "pusieron"],
    imperfect: ["ponía", "ponías", "ponía", "poníamos", "poníais", "ponían"],
    future: ["pondré", "pondrás", "pondrá", "pondremos", "pondréis", "pondrán"],
    subjunctive: ["ponga", "pongas", "ponga", "pongamos", "pongáis", "pongan"],
    imperative: ["pon", "ponga", "pongamos", "poned", "pongan"],
  },
];
const ES_MAKE_FORMS = [
  ...ES_BECOME_FORMS.filter((form) =>
    ["convertir", "hacer", "poner"].includes(form.infinitive)
  ),
  {
    infinitive: "dejar",
    infinitiveReflexive: "dejarse",
    gerund: "dejando",
    present: ["dejo", "dejas", "deja", "dejamos", "dejáis", "dejan"],
    preterite: ["dejé", "dejaste", "dejó", "dejamos", "dejasteis", "dejaron"],
    imperfect: [
      "dejaba",
      "dejabas",
      "dejaba",
      "dejábamos",
      "dejabais",
      "dejaban",
    ],
    future: [
      "dejaré",
      "dejarás",
      "dejará",
      "dejaremos",
      "dejaréis",
      "dejarán",
    ],
    subjunctive: ["deje", "dejes", "deje", "dejemos", "dejéis", "dejen"],
    imperative: ["deja", "deje", "dejemos", "dejad", "dejen"],
  },
  {
    infinitive: "transformar",
    infinitiveReflexive: "transformarse",
    gerund: "transformando",
    present: [
      "transformo",
      "transformas",
      "transforma",
      "transformamos",
      "transformáis",
      "transforman",
    ],
    preterite: [
      "transformé",
      "transformaste",
      "transformó",
      "transformamos",
      "transformasteis",
      "transformaron",
    ],
    imperfect: [
      "transformaba",
      "transformabas",
      "transformaba",
      "transformábamos",
      "transformabais",
      "transformaban",
    ],
    future: [
      "transformaré",
      "transformarás",
      "transformará",
      "transformaremos",
      "transformaréis",
      "transformarán",
    ],
    subjunctive: [
      "transforme",
      "transformes",
      "transforme",
      "transformemos",
      "transforméis",
      "transformen",
    ],
    imperative: [
      "transforma",
      "transforme",
      "transformemos",
      "transformad",
      "transformen",
    ],
  },
  {
    infinitive: "tornar",
    infinitiveReflexive: "tornarse",
    gerund: "tornando",
    present: ["torno", "tornas", "torna", "tornamos", "tornáis", "tornan"],
    preterite: ["torné", "tornaste", "tornó", "tornamos", "tornasteis", "tornaron"],
    imperfect: [
      "tornaba",
      "tornabas",
      "tornaba",
      "tornábamos",
      "tornabais",
      "tornaban",
    ],
    future: [
      "tornaré",
      "tornarás",
      "tornará",
      "tornaremos",
      "tornaréis",
      "tornarán",
    ],
    subjunctive: ["torne", "tornes", "torne", "tornemos", "tornéis", "tornen"],
    imperative: ["torna", "torne", "tornemos", "tornad", "tornen"],
  },
];
const ES_BECOME_ADJECTIVES = [
  "bueno",
  "malo",
  "borum",
  "gurriri",
  "gatj",
];
const ES_MAKE_ADJECTIVES = ["bueno", "malo", "borum", "gurriri", "gatj"];
const EN_BECOME_FORMS = [
  { present: ["become", "becomes"], past: "became", gerund: "becoming" },
  { present: ["get", "gets"], past: "got", gerund: "getting" },
  { present: ["turn", "turns"], past: "turned", gerund: "turning" },
  { present: ["grow", "grows"], past: "grew", gerund: "growing" },
];
const EN_BECOME_ADJECTIVES = ["good", "bad", "borum", "gurriri", "gatj"];
const EN_MAKE_ADJECTIVES = ["good", "bad", "borum", "gurriri", "gatj"];
const COPULA_ADJECTIVES_ES = [
  "grande",
  "pequeño",
  "bueno",
  "malo",
  "fuerte",
  "débil",
  "listo",
  "lento",
];
const COPULA_ADJECTIVES_EN = [
  "big",
  "small",
  "good",
  "bad",
  "strong",
  "weak",
  "ready",
  "slow",
];
const COPULA_DEMOS_ES_SING = ["este", "esta", "ese", "esa", "esto", "eso"];
const COPULA_DEMOS_ES_PLUR = ["estos", "estas", "esos", "esas"];
const COPULA_DEMOS_EN_SING = ["this", "that"];
const COPULA_DEMOS_EN_PLUR = ["these", "those"];
const COPULA_PRONOUNS_ES = [
  "yo",
  "tú",
  "él",
  "ella",
  "nosotros",
  "nosotras",
  "vosotros",
  "vosotras",
  "ustedes",
  "ellos",
  "ellas",
];
const COPULA_PRONOUNS_EN = ["i", "you", "he", "she", "it", "we", "they"];
const INTRANSITIVE_DEMOS_ES_SING = [
  "esto",
  "eso",
  "este",
  "ese",
  "esta",
  "esa",
];
const INTRANSITIVE_DEMOS_ES_PLUR = ["estos", "esos", "estas", "esas"];
const INTRANSITIVE_DEMOS_EN_SING = ["this", "that"];
const INTRANSITIVE_DEMOS_EN_PLUR = ["these", "those"];
const LOCATIVE_ADVERBS_ES = [
  "adentro",
  "dentro",
  "afuera",
  "fuera",
  "lejos",
  "cerca",
  "arriba",
  "encima",
  "sobre",
];
const LOCATIVE_ADVERBS_EN = [
  "inside",
  "outside",
  "far away",
  "close",
  "near",
  "above",
  "over",
  "on top of",
];
const MOTION_ADVERBS_ES = [
  "por allá",
  "por alla",
  "por ahí",
  "por ahi",
  "para allá",
  "para alla",
  "hacia allá",
  "hacia alla",
  "por aquí",
  "por aqui",
  "por acá",
  "por aca",
  "para aquí",
  "para aqui",
  "para acá",
  "para aca",
  "hacia aquí",
  "hacia aqui",
  "hacia acá",
  "hacia aca",
];
const MOTION_ADVERBS_EN = ["that way", "this way"];
const ORIGIN_SUBJECTS_ES = [
  "el libro",
  "la historia",
  "el regalo",
  "esto",
  "eso",
  "esta historia",
  "ese regalo",
  "el regalo de la esposa de Djäwa",
];
const ORIGIN_SUBJECTS_EN = [
  "the book",
  "the story",
  "the gift",
  "this",
  "that",
  "this story",
  "that gift",
  "the gift of Djawa's wife",
];
const LOCATIVE_PREP_ES = [
  "en la casa",
  "en la casa negra",
  "en la casa de Stephen",
  "en la casa de Maria",
  "en el agua",
  "en Nueva York",
  "en esta casa",
  "en esa casa",
  "en esto",
  "en ello",
  "en alguien",
  "en accidente",
  "en glorp",
  "dentro de la casa",
  "dentro de alguien",
  "dentro de accidente",
  "dentro de glorp",
  "cerca de la casa",
  "cerca de la casa negra",
  "cerca de alguien",
  "cerca de accidente",
  "cerca de glorp",
  "fuera de la casa",
  "fuera de alguien",
  "fuera de accidente",
  "fuera de glorp",
  "encima de la casa",
  "encima de alguien",
  "encima de accidente",
  "encima de glorp",
  "debajo de la casa",
  "debajo de alguien",
  "debajo de accidente",
  "debajo de glorp",
  "al lado de la casa",
  "al lado de alguien",
  "al lado de accidente",
  "al lado de glorp",
  "al lado de la esposa de Djäwa",
  "junto a la casa",
  "junto a alguien",
  "junto a accidente",
  "junto a glorp",
  "junto a la esposa de Djäwa",
];
const COMITATIVE_PREP_ES = [
  "con alguien",
  "con accidente",
  "con glorp",
  "con él",
  "con ellos",
  "con nosotros dos",
  "con Nueva York",
  "por alguien",
  "junto con alguien",
  "en él",
  "con la esposa de Djäwa",
];
const INSTRUMENTAL_PREP_ES = [
  "con el palo",
  "con la piedra",
  "con el palo de Stephen",
  "con la piedra de Maria",
  "con accidente",
  "con glorp",
  "con esto",
  "con ello",
  "con la esposa de Djäwa",
  "por accidente",
  "por el palo",
  "mediante el palo",
  "usando el palo",
  "con él",
  "con ella",
  "con ellos",
  "con nosotras",
];
const ALLATIVE_PREP_ES = [
  "a la casa",
  "a la casa negra",
  "a la casa de Stephen",
  "a la casa de Maria",
  "a accidente",
  "a glorp",
  "a esto",
  "a ello",
  "a alguien",
  "a Nueva York",
  "hacia la casa",
  "hacia la casa negra",
  "hacia la casa de Stephen",
  "hacia accidente",
  "hacia glorp",
  "hacia alguien",
  "hacia Nueva York",
  "hacia la esposa de Djäwa",
  "hasta la casa",
  "rumbo a la casa",
  "dentro de la casa",
  "dentro de la casa negra",
  "dentro de la casa de Stephen",
  "dentro de accidente",
  "dentro de glorp",
  "dentro de alguien",
  "afuera de la casa",
  "afuera de accidente",
  "afuera de glorp",
  "afuera de alguien",
  "encima de la casa",
  "encima de accidente",
  "encima de glorp",
  "encima de alguien",
  "al lado de la casa",
  "al lado de accidente",
  "al lado de glorp",
  "al lado de alguien",
  "al lado de la esposa de Djäwa",
  "junto a la casa",
  "junto a accidente",
  "junto a glorp",
  "junto a alguien",
  "junto a la esposa de Djäwa",
  "cerca de la casa",
  "cerca de accidente",
  "cerca de glorp",
  "cerca de alguien",
  "cerca de la esposa de Djäwa",
];
const ABLATIVE_PREP_ES = [
  "de la casa",
  "de la casa negra",
  "de la casa de Stephen",
  "de la casa de Maria",
  "de mi casa",
  "de mi casa negra",
  "de tu casa",
  "de su casa",
  "del agua",
  "de Nueva York",
  "de alguien",
  "de accidente",
  "de esto",
  "de ello",
  "desde la casa",
  "desde la casa negra",
  "desde la casa de Stephen",
  "desde Nueva York",
  "desde alguien",
  "desde accidente",
  "de dentro de la casa",
  "de dentro de glorp",
  "de dentro de alguien",
  "desde dentro de la casa",
  "desde dentro de glorp",
  "de afuera",
  "de afuera de la casa",
  "de cerca de la casa",
  "de lejos",
];
const TRAVERSE_PREP_ES = [
  "a traves de la casa",
  "a traves de la casa negra",
  "a traves de la casa de Stephen",
  "a traves del bosque",
  "a traves de glorp",
  "por el cesped",
  "por la casa",
  "por la casa negra",
  "por la casa de Stephen",
  "por la casa de mi",
  "por la casa de el",
  "por el sendero de Stephen",
  "por glorp",
  "por alguien",
  "por mi",
  "por él",
  "por ella",
  "por nosotros",
  "por ellos",
];
const TRAVERSE_POSSESSIVE_EMPHATIC_ES = [
  "yo camino por la casa de mi mismo",
  "yo camino a traves de la casa de mi propio",
];
const ORIGIN_PREP_ES = [
  "de alguien",
  "de John",
  "de María",
  "de esto",
  "de ello",
  "de nosotros",
  "de mí",
  "de él",
  "de la esposa de Djäwa",
  "por alguien",
  "por John",
  "por María",
  "por nosotros",
  "por mí",
  "por él",
];
const PURPOSE_PREP_ES = [
  "por",
  "para",
  "a proposito de",
  "por razon de",
  "con el fin de",
  "a fin de",
  "por motivo de",
  "por causa de",
  "con la intencion de",
  "con el objetivo de",
  "con la finalidad de",
];
const TRATARSE_DE_FORMS_ES = [
  "se trata de",
  "se tratan de",
  "se trataba de",
  "se trataban de",
  "se trato de",
  "se trataron de",
  "se tratara de",
  "se trataran de",
  "se tratase de",
  "se tratasen de",
  "se trataria de",
  "se tratarian de",
  "se ha tratado de",
  "se han tratado de",
  "se habia tratado de",
  "se habian tratado de",
  "se habra tratado de",
  "se habran tratado de",
  "se habria tratado de",
  "se habrian tratado de",
  "se haya tratado de",
  "se hayan tratado de",
  "se hubiera tratado de",
  "se hubieran tratado de",
  "se hubiese tratado de",
  "se hubiesen tratado de",
];
const ABOUT_PREP_ES = [
  "sobre",
  "acerca de",
  "respecto a",
  "en cuanto a",
  "en relacion con",
  "relativo a",
  "relacionado con",
  ...TRATARSE_DE_FORMS_ES,
];
const PURPOSE_TARGETS_ES = [
  "comida",
  "leche",
  "agua",
  "alguien",
  "glorp",
  "esta comida",
  "esta leche",
  "esta agua",
  "este glorp",
];
const PURPOSE_PRONOUNS_ES = ["mí", "ti", "él", "ella", "nosotros", "ello", "esto"];
const ABOUT_TARGETS_ES = ["comida", "leche", "agua", "alguien", "glorp"];
const ABOUT_POSSESSORS_ES = ["de la esposa de Djäwa", "de él", "de ella"];
const ABOUT_PRONOUNS_ES = [
  "mí",
  "ti",
  "él",
  "ella",
  "nosotros",
  "ello",
  "esto",
];
const LOCATIVE_PREP_EN = [
  "in the house",
  "in the black house",
  "in Stephen's house",
  "in the house of Stephen",
  "in the water",
  "in New York",
  "in this house",
  "in that house",
  "in this",
  "in it",
  "in anyone",
  "in accident",
  "in glorp",
  "inside the house",
  "inside anyone",
  "inside accident",
  "inside glorp",
  "at the house",
  "near the house",
  "near the black house",
  "near anyone",
  "near accident",
  "near glorp",
  "outside of the house",
  "outside of anyone",
  "outside of accident",
  "outside of glorp",
  "on top of the house",
  "on top of anyone",
  "on top of accident",
  "on top of glorp",
  "under the house",
  "under anyone",
  "under accident",
  "under glorp",
  "beside the house",
  "beside anyone",
  "beside accident",
  "beside glorp",
  "beside Djawa's wife",
  "next to the house",
  "next to anyone",
  "next to accident",
  "next to glorp",
  "next to the wife of Djawa",
];
const COMITATIVE_PREP_EN = [
  "with someone",
  "with anyone",
  "with accident",
  "with glorp",
  "with him",
  "with them",
  "with us two",
  "with New York",
  "by someone",
  "with Djawa's wife",
];
const INSTRUMENTAL_PREP_EN = [
  "with the stick",
  "with the stone",
  "with Stephen's stick",
  "with the stick of Stephen",
  "with accident",
  "with glorp",
  "with this",
  "with it",
  "with Djawa's wife",
  "by accident",
  "by the stick",
  "by means of the stick",
  "using the stick",
  "with him",
  "with them",
  "with us two",
];
const ALLATIVE_PREP_EN = [
  "to the house",
  "to the black house",
  "to Stephen's house",
  "to the house of Stephen",
  "to accident",
  "to glorp",
  "to this",
  "to it",
  "to anyone",
  "to New York",
  "toward the house",
  "toward the black house",
  "towards the house",
  "toward accident",
  "toward glorp",
  "toward anyone",
  "towards New York",
  "toward Djawa's wife",
  "into the house",
  "into the black house",
  "into the house of Stephen",
  "into accident",
  "into glorp",
  "into anyone",
  "onto the house",
  "inside the house",
  "inside the black house",
  "inside accident",
  "inside glorp",
  "inside anyone",
  "outside of the house",
  "outside of accident",
  "outside of glorp",
  "outside of anyone",
  "near the house",
  "near accident",
  "near glorp",
  "near anyone",
  "beside the house",
  "beside accident",
  "beside glorp",
  "beside anyone",
  "beside Djawa's wife",
  "next to the house",
  "next to accident",
  "next to glorp",
  "next to anyone",
  "next to the wife of Djawa",
  "on top of the house",
  "on top of accident",
  "on top of glorp",
  "on top of anyone",
];
const ABLATIVE_PREP_EN = [
  "from the house",
  "from the black house",
  "from Stephen's house",
  "from the house of Stephen",
  "from my house",
  "from your house",
  "from his house",
  "from her house",
  "from the water",
  "from New York",
  "from anyone",
  "from accident",
  "from this",
  "from it",
  "away from the house",
  "away from anyone",
  "away from New York",
  "out of the house",
  "out of anyone",
  "from inside the house",
  "from inside anyone",
  "from inside",
  "from outside",
  "away from outside",
  "from near the house",
];
const TRAVERSE_PREP_EN = [
  "through the house",
  "through the black house",
  "through the house of John",
  "through the house of mine",
  "through John's house",
  "through the forest",
  "through glorp",
  "through anyone",
  "through me",
  "through him",
  "through her",
  "through us",
  "through them",
  "along the house",
  "along glorp",
  "by the house",
  "by glorp",
  "by anyone",
];
const TRAVERSE_POSSESSIVE_EMPHATIC_EN = [
  "i walk through the house of my own",
  "i walk through the house of our own",
];
const REFLEXIVE_OBJECT_ES = [
  "yo me como",
  "yo me comí",
  "yo me comeré",
  "yo como a mí mismo",
  "yo comí a mí mismo",
  "yo comeré a mí mismo",
];
const REFLEXIVE_OBJECT_EN = [
  "i eat me",
  "i ate me",
  "i will eat me",
  "i eat myself",
  "i ate myself",
  "i will eat myself",
];
const ORIGIN_PREP_EN = [
  "of anyone",
  "of John",
  "of Maria",
  "of this",
  "of it",
  "of us",
  "of me",
  "of him",
  "of Djawa's wife",
  "of the wife of Djawa",
  "by anyone",
  "by John",
  "by Maria",
  "by us",
  "by me",
  "by him",
  "from John",
  "from Maria",
];
const PURPOSE_PREP_EN = [
  "for",
  "for the purpose of",
  "for the sake of",
  "because of",
  "in order to",
  "so as to",
];
const BE_ABOUT_FORMS_EN = [
  "am about",
  "is about",
  "are about",
  "was about",
  "were about",
  "be about",
  "been about",
  "being about",
  "will be about",
  "would be about",
  "has been about",
  "have been about",
  "had been about",
  "will have been about",
  "would have been about",
  "am not about",
  "is not about",
  "are not about",
  "was not about",
  "were not about",
  "will not be about",
  "would not be about",
  "has not been about",
  "have not been about",
  "had not been about",
  "won't be about",
  "wouldn't be about",
  "isn't about",
  "aren't about",
  "wasn't about",
  "weren't about",
  "hasn't been about",
  "haven't been about",
  "hadn't been about",
  "it's about",
  "that's about",
  "this is about",
  "that is about",
  "these are about",
  "those are about",
];
const ABOUT_PREP_EN = [
  "about",
  "regarding",
  "concerning",
  "as for",
  "in regard to",
  "in regards to",
  "with regard to",
  "with regards to",
  ...BE_ABOUT_FORMS_EN,
];
const PURPOSE_TARGETS_EN = [
  "food",
  "milk",
  "water",
  "anyone",
  "glorp",
  "this food",
  "this milk",
  "this water",
  "this glorp",
];
const PURPOSE_PRONOUNS_EN = ["me", "you", "him", "her", "us", "it", "this"];
const ABOUT_TARGETS_EN = ["food", "milk", "water", "anyone", "glorp"];
const ABOUT_POSSESSORS_EN = ["of Djawa's wife", "of him", "of her"];
const ABOUT_PRONOUNS_EN = ["me", "you", "him", "her", "us", "it", "this"];

const COMER_IMPERATIVE_ES = ["come", "coma", "comamos", "comed", "coman"];
const COMER_NEGATIVE_IMPERATIVE_ES = [
  "no comas",
  "no coma",
  "no comamos",
  "no comáis",
  "no coman",
];

const EAT_PRESENT_FORMS_EN = ["eat", "eats"];
const EAT_PAST_SIMPLE_EN = "ate";
const EAT_PAST_CONTINUOUS_SING = "was eating";
const EAT_PAST_CONTINUOUS_PLUR = "were eating";
const EAT_PAST_SIMPLE_NEG = "didn't eat";
const EAT_PAST_CONTINUOUS_NEG_SING = "wasn't eating";
const EAT_PAST_CONTINUOUS_NEG_PLUR = "weren't eating";

const EAT_IMPERATIVE_EN = ["eat", "let's eat"];
const EAT_NEGATIVE_IMPERATIVE_EN = ["don't eat", "do not eat", "let's not eat"];

function buildNearFutureSamplesEs(): string[] {
  const base = [
    "voy a comer",
    "voy a beber",
    "vamos a comer",
    "vamos a beber",
    "estoy por comer",
    "estamos por comer",
    "estoy a punto de comer",
    "estamos a punto de comer",
    "voy a comer glorp",
    "vamos a comer glorp",
  ];
  return Array.from(new Set(base));
}

function buildNearFutureSamplesEn(): string[] {
  const base = [
    "i am going to eat",
    "i'm going to eat",
    "we are going to eat",
    "we're going to eat",
    "i am about to eat",
    "i'm about to eat",
    "we are about to eat",
    "we're about to eat",
    "i am going to eat glorp",
    "we are going to eat glorp",
  ];
  return Array.from(new Set(base));
}

function buildHabitualSamplesEs(): string[] {
  const base = [
    "yo como",
    "yo siempre como",
    "yo como siempre",
    "yo a veces como",
    "yo como a veces",
    "todos los dias yo como",
    "yo como todos los dias",
    "esa vez yo como",
    "yo como esa vez",
    "yo no como",
    "yo no como nunca",
    "yo nunca como",
    "yo no como ninguna comida",
  ];
  return Array.from(new Set(base));
}

function buildHabitualSamplesEn(): string[] {
  const base = [
    "i eat",
    "i always eat",
    "i eat always",
    "i often eat",
    "i eat often",
    "i sometimes eat",
    "that time i eat",
    "i eat that time",
    "i don't eat",
    "i never eat",
    "i do not eat never",
  ];
  return Array.from(new Set(base));
}

function buildMightSamplesEs(): string[] {
  const base = [
    "quizá come",
    "quizas come",
    "quizá no come",
    "quizas no come",
    "tal vez come",
    "posiblemente come",
    "probablemente come",
    "quizá comí",
    "quizá no comí",
    "él quizá come",
    "ella quizá come",
  ];
  return Array.from(new Set(base));
}

function buildMightSamplesEn(): string[] {
  const base = [
    "he might eat",
    "he might not eat",
    "maybe he eats",
    "perhaps he eats",
    "possibly he will eat",
    "he might ate",
    "he might not ate",
  ];
  return Array.from(new Set(base));
}

function buildShouldSamplesEs(): string[] {
  const base = [
    "debo comer",
    "debes comer",
    "debe comer",
    "debemos comer",
    "deberás comer",
    "tengo que comer",
    "tienes que comer",
    "tenemos que comer",
    "tendrás que comer",
    "necesito comer",
    "necesitas comer",
    "necesitamos comer",
    "necesitarás comer",
    "es necesario comer",
    "hay que comer",
    "no debes comer",
  ];
  return Array.from(new Set(base));
}

function buildShouldSamplesEn(): string[] {
  const base = [
    "you should eat",
    "he should eat",
    "we should eat",
    "you must eat",
    "he must eat",
    "we have to eat",
    "he has to eat",
    "you need to eat",
    "he needs to eat",
    "you ought to eat",
    "you should not eat",
  ];
  return Array.from(new Set(base));
}

function buildShouldHaveSamplesEs(): string[] {
  const base = [
    "debería haber comido",
    "deberías haber comido",
    "deberíamos haber comido",
    "deberían haber comido",
    "habría comido",
    "habrías comido",
    "habrían comido",
    "hubiera comido",
    "hubieran comido",
    "no debería haber comido",
  ];
  return Array.from(new Set(base));
}

function buildShouldHaveSamplesEn(): string[] {
  const base = [
    "you should have eaten",
    "he should have eaten",
    "they should have gone",
    "we would have eaten",
    "you would have gone",
    "you should not have eaten",
  ];
  return Array.from(new Set(base));
}

function buildPastHabitualSamplesEs(): string[] {
  const base = [
    "yo solía comer",
    "yo solia comer",
    "nosotros solíamos comer",
    "yo solia no comer",
    "yo solía no comer",
    "yo no solía comer",
    "yo no solia comer",
    "yo comía siempre",
    "yo siempre comía",
  ];
  return Array.from(new Set(base));
}

function buildPastHabitualSamplesEn(): string[] {
  const base = [
    "i used to eat",
    "i would eat",
    "i used to not eat",
    "i did not use to eat",
    "we used to eat",
  ];
  return Array.from(new Set(base));
}

function buildLetsImperativeSamplesEs(): string[] {
  const base = [
    "vamos",
    "vámonos",
    "vamonos",
    "comamos",
    "bebamos",
    "consumamos",
    "comamos glorp",
    "comamos el glorp",
    "comamos un glorp",
    "comamos a alguien",
    "bebamos agua",
  ];
  return Array.from(new Set(base));
}

function buildLetsImperativeSamplesEn(): string[] {
  const base = [
    "let's eat",
    "let's eat the glorp",
    "let's eat glorp",
    "let's eat it",
    "let's drink",
    "let's drink water",
    "let's consume",
    "let's go",
    "let's sleep",
    "let's lie down",
  ];
  return Array.from(new Set(base));
}

function buildImperativeNegSamplesEs(): string[] {
  const base = [
    "no camines",
    "no duermas",
    "no comas",
    "no bebas",
    "no consumas",
    "no comas glorp",
    "no comas el glorp",
    "no comas un glorp",
    "no comas a alguien",
    "no bebas agua",
  ];
  return Array.from(new Set(base));
}

function buildImperativeNegSamplesEn(): string[] {
  const base = [
    "don't walk",
    "don't sleep",
    "don't eat",
    "don't drink",
    "don't consume",
    "don't eat glorp",
    "don't eat the glorp",
    "don't eat it",
    "don't drink water",
  ];
  return Array.from(new Set(base));
}

function buildSubjectEmphasisSamplesEs(): string[] {
  const base = [
    "yo mismo voy",
    "yo misma voy",
    "tú mismo vas",
    "tú misma vas",
    "él mismo va",
    "ella misma va",
    "nosotros mismos vamos",
    "nosotras mismas vamos",
    "vosotros mismos vais",
    "ellos mismos van",
    "nosotros dos mismos vamos",
  ];
  return Array.from(new Set(base));
}

function buildSubjectEmphasisSamplesEn(): string[] {
  const base = [
    "i myself go",
    "you yourself go",
    "he himself goes",
    "she herself goes",
    "we ourselves go",
    "they themselves go",
    "we two ourselves go",
  ];
  return Array.from(new Set(base));
}

function buildObjectEmphasisSamplesEs(): string[] {
  const base = [
    "yo como a él mismo",
    "yo como a ella misma",
    "yo como a mí mismo",
    "yo como a ti mismo",
    "yo como a ellos mismos",
    "yo como a nosotros dos mismos",
  ];
  return Array.from(new Set(base));
}

function buildObjectEmphasisSamplesEn(): string[] {
  const base = [
    "i eat him himself",
    "i eat her herself",
    "i eat myself",
    "i eat you yourself",
    "i eat them themselves",
    "i eat us ourselves",
    "i eat you yourselves",
  ];
  return Array.from(new Set(base));
}

function buildPossessiveEmphasisSamplesEs(): string[] {
  const base = [
    "mi propia comida es buena",
    "mi misma comida es buena",
    "la comida es mía misma",
    "la comida es de mí mismo",
    "la comida es de nosotros mismos",
    "yo como mi propia comida",
  ];
  return Array.from(new Set(base));
}

function buildPossessiveEmphasisSamplesEn(): string[] {
  const base = [
    "my own food is good",
    "the food is mine myself",
    "the food is of me myself",
    "i eat my own food",
  ];
  return Array.from(new Set(base));
}

function buildPossessiveReflexiveSamplesEs(): string[] {
  const base = [
    "yo quiero mi propia comida",
    "yo quiero comer mi propia comida",
    "yo conozco mi propia casa",
    "yo voy por mi propia comida",
    "yo voy para mi propia casa",
    "yo no quiero mi propia comida",
  ];
  return Array.from(new Set(base));
}

function buildPossessiveReflexiveSamplesEn(): string[] {
  const base = [
    "i want my own food",
    "i want to eat my own food",
    "i know my own house",
    "i go for my own food",
    "i go for my own house",
    "i don't want my own food",
  ];
  return Array.from(new Set(base));
}

function buildComitativeAllativeEmphasisSamplesEs(): string[] {
  const base = [
    "yo voy conmigo",
    "yo voy conmigo mismo",
    "yo voy contigo",
    "yo voy contigo mismo",
    "yo voy con él",
    "yo voy con él mismo",
    "yo voy con ella",
    "yo voy con ella misma",
    "yo voy con ellos",
    "yo voy con ellos mismos",
    "yo voy hacia mí",
    "yo voy hacia mí mismo",
    "yo voy hacia ti",
    "yo voy hacia ti mismo",
    "yo voy hacia él",
    "yo voy hacia él mismo",
    "yo voy hacia ella",
    "yo voy hacia ella misma",
    "yo voy hacia ellos",
    "yo voy hacia ellos mismos",
  ];
  return Array.from(new Set(base));
}

function buildPossessiveGalaEmphasisSamplesEs(): string[] {
  const base = [
    "alguien de mi mismo come la comida",
    "yo camino hacia la casa de mi mismo",
    "yo camino en la casa de mi mismo",
    "yo camino desde la casa de mi mismo",
    "yo camino con el agua de mi mismo",
  ];
  return Array.from(new Set(base));
}

function buildComitativeAllativeEmphasisSamplesEn(): string[] {
  const base = [
    "i go with me",
    "i go with me myself",
    "i go with you",
    "i go with you yourself",
    "i go with him",
    "i go with him himself",
    "i go with her",
    "i go with her herself",
    "i go with them",
    "i go with them themselves",
    "i go to me",
    "i go to me myself",
    "i go to you",
    "i go to you yourself",
    "i go to him",
    "i go to him himself",
    "i go to her",
    "i go to her herself",
    "i go towards them",
    "i go towards them themselves",
  ];
  return Array.from(new Set(base));
}

function buildPossessiveGalaEmphasisSamplesEn(): string[] {
  const base = [
    "anyone of my own eats the food",
    "i walk towards the house of my own",
    "i walk in the house of my own",
    "i walk from the house of my own",
    "i walk with the water of my own",
  ];
  return Array.from(new Set(base));
}

function buildExtendedPronounEmphasisSamplesEs(): string[] {
  const base = [
    "el regalo es de mí",
    "el regalo es de mí mismo",
    "yo voy por mí",
    "yo voy por mí mismo",
    "una canción sobre mí",
    "una canción sobre mí mismo",
    "yo voy de mi casa",
    "yo voy de mi misma casa",
  ];
  return Array.from(new Set(base));
}

function buildExtendedPronounEmphasisSamplesEn(): string[] {
  const base = [
    "the gift is from me",
    "the gift is from me myself",
    "i go by me",
    "i go by me myself",
    "a song about me",
    "a song about me myself",
    "i go from my house",
    "i go from my myself house",
  ];
  return Array.from(new Set(base));
}

const ES_OBJECT_AMBIG = ["lo", "la", "los", "las"];
const ES_OBJECT_CLEAR = ["me", "te", "nos", "os"];
const ES_OBJECT_PRONOUNS = [...ES_OBJECT_AMBIG, ...ES_OBJECT_CLEAR];
const ES_OBJECT_A_PRONOUNS = [
  "a él",
  "a ella",
  "a ellos",
  "a ellas",
  "a usted",
  "a ustedes",
  "a nosotros",
  "a nosotras",
  "a vosotros",
  "a vosotras",
  "a ti",
  "a mí",
  "a mi",
];
const ES_OBJECT_NOUNS = ["alguien", "accidente", "glorp"];

const EN_OBJECT_PRONOUNS = ["it", "him", "her", "them", "you", "us"];
const EN_OBJECT_NOUNS = ["anyone", "accident", "glorp"];

const ES_FIRST_SING = new Set(["yo"]);
const ES_FIRST_PLUR = new Set(["nosotros", "nosotras"]);
const ES_SECOND_PLURAL = new Set(["vosotros", "vosotras"]);
const ES_THIRD_SING = new Set(["él", "ella", "ello", "usted"]);
const ES_SECOND_SING = new Set(["tú"]);
const ES_THIRD_PLURAL = new Set(["ellos", "ellas", "ustedes"]);
const ES_SUBJECTS = new Set([
  "yo",
  "tú",
  "él",
  "ella",
  "ello",
  "usted",
  "nosotros",
  "nosotras",
  "vosotros",
  "vosotras",
  "ustedes",
  "ellos",
  "ellas",
]);
const ES_GROUP_MARKERS = new Set(["demás", "demas", "otros", "otras"]);

const ES_CHAIN_SUBJECTS = ["yo", "él", "nosotros"];
const ES_CHAIN_AUX = ["estoy", "está", "estamos"];
const ES_CHAIN_GERUND = "comiendo";
const ES_CHAIN_INFINITIVES = ["ir"];

const EN_CHAIN_SUBJECTS = ["i", "he", "we"];
const EN_CHAIN_AUX = ["am", "is", "are"];
const EN_CHAIN_GERUND = "eating";
const EN_CHAIN_INFINITIVES = ["go"];
const ES_LIST_CONNECTORS = [
  "y",
  "e",
  "ni",
  "también",
  "tambien",
  "tampoco",
  "además",
  "ademas",
  "igualmente",
  "asimismo",
];
const EN_LIST_CONNECTORS = ["and", "also", "too", "as well", "neither", "nor"];

function tokenizeSample(sample: string, mode: LanguageMode): string[] {
  return sample
    .replace(/,/g, " ")
    .trim()
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

function buildEsObjectVariants(): string[] {
  const variants = new Set<string>();
  for (const obj of ES_OBJECT_PRONOUNS) variants.add(obj);
  for (const obj of ES_OBJECT_A_PRONOUNS) variants.add(obj);
  for (const noun of ES_OBJECT_NOUNS) variants.add(noun);
  for (const noun of ES_OBJECT_NOUNS) {
    for (const art of ["el", "la", "los", "las"]) {
      variants.add(`${art} ${noun}`);
    }
    for (const art of ["un", "una", "unos", "unas"]) {
      variants.add(`${art} ${noun}`);
    }
    for (const art of ["este", "esta", "estos", "estas"]) {
      variants.add(`${art} ${noun}`);
    }
  }
  variants.add("a alguien");
  return Array.from(variants);
}

function buildEnObjectVariants(): string[] {
  const variants = new Set<string>();
  for (const obj of EN_OBJECT_PRONOUNS) variants.add(obj);
  for (const noun of EN_OBJECT_NOUNS) variants.add(noun);
  for (const noun of EN_OBJECT_NOUNS) {
    variants.add(`the ${noun}`);
    variants.add(`a ${noun}`);
    variants.add(`an ${noun}`);
    variants.add(`this ${noun}`);
    variants.add(`that ${noun}`);
    variants.add(`these ${noun}`);
    variants.add(`those ${noun}`);
  }
  return Array.from(variants);
}

function buildEsVerbChainSamples(): string[] {
  const samples = new Set<string>();
  const objectsFull = buildEsObjectVariants().filter(
    (obj) => !ES_OBJECT_PRONOUNS.includes(obj)
  );
  const objectsPronoun = ES_OBJECT_PRONOUNS;

  for (const subject of ES_CHAIN_SUBJECTS) {
    const verb = pickComerForm(subject);
    for (const inf of ES_CHAIN_INFINITIVES) {
      samples.add(`${subject} ${verb} ${inf}`);
      for (const obj of objectsFull) {
        samples.add(`${subject} ${verb} ${obj} ${inf}`);
      }
    }
  }

  for (const aux of ES_CHAIN_AUX) {
    for (const inf of ES_CHAIN_INFINITIVES) {
      samples.add(`${aux} ${ES_CHAIN_GERUND} ${inf}`);
      for (const obj of objectsFull) {
        samples.add(`${aux} ${ES_CHAIN_GERUND} ${obj} ${inf}`);
      }
      for (const obj of objectsPronoun) {
        samples.add(`${obj} ${aux} ${ES_CHAIN_GERUND} ${inf}`);
        samples.add(`${aux} ${ES_CHAIN_GERUND}${obj} ${inf}`);
      }
    }
  }

  samples.add(`estoy comiéndolo ${ES_CHAIN_INFINITIVES[0]}`);

  return Array.from(samples);
}

function buildModalSamplesEs(
  subjectSamples: string[],
  modalPartIndex: number | null
): string[] {
  const baseSubjects = [
    "yo",
    "tú",
    "él",
    "ella",
    "nosotros",
    "nosotras",
    "ustedes",
    "vosotros",
    "vosotras",
    "ellos",
    "ellas",
  ];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") ||
      sample.includes(",") ||
      /dema?s|otro/.test(sample)
  );
  const modalSubjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 24)])
  );

  const objectVariants = buildEsObjectVariants();
  const experienceObjects = objectVariants.filter(
    (obj) => !obj.startsWith("a ")
  );
  const modalForms = [...ES_MODAL_DJAL_FORMS, ...ES_MODAL_MARNGI_FORMS];
  const sobreForms = new Set([
    ES_MODAL_MARNGI_FORMS[0],
    ES_MODAL_MARNGI_FORMS[1],
    ES_MODAL_MARNGI_FORMS[2],
    ES_MODAL_MARNGI_FORMS[3],
  ]);
  const sobreObjects = objectVariants.filter((obj) => !obj.startsWith("a "));

  const samples: string[] = [];
  const pinnedSamples: string[] = [];
  for (const subject of modalSubjects) {
    for (const forms of modalForms) {
      const verb = pickModalFormEs(subject, forms);
      for (const obj of objectVariants) {
        samples.push(`${subject} ${verb} ${obj}`);
        samples.push(`${subject} no ${verb} ${obj}`);
      }
      if (sobreForms.has(forms)) {
        for (const obj of sobreObjects) {
          samples.push(`${subject} ${verb} sobre ${obj}`);
          samples.push(`${subject} no ${verb} sobre ${obj}`);
        }
      }
    }
  }

  const possessiveObjects = [
    "el glorp de Stephen",
    "el glorp de mí",
    "el glorp de él",
  ];
  const possessiveForms = [ES_MODAL_DJAL_FORMS[0], ES_MODAL_MARNGI_FORMS[0]];
  for (const subject of baseSubjects) {
    for (const forms of possessiveForms) {
      const verb = pickModalFormEs(subject, forms);
      for (const obj of possessiveObjects) {
        samples.push(`${subject} ${verb} ${obj}`);
        samples.push(`${subject} no ${verb} ${obj}`);
        pinnedSamples.push(`${subject} ${verb} ${obj}`);
        pinnedSamples.push(`${subject} no ${verb} ${obj}`);
      }
    }
  }

  const reflexivePronouns = ["me", "te", "se", "nos", "os", "se"];
  const reflexiveSubjects = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];
  const reflexiveForms = ES_MODAL_MARNGI_FORMS[4];
  for (let i = 0; i < reflexiveForms.length; i += 1) {
    const pronoun = reflexivePronouns[i];
    const verb = reflexiveForms[i];
    const subj = reflexiveSubjects[i];
    for (const obj of objectVariants) {
      samples.push(`${pronoun} ${verb} ${obj}`);
      samples.push(`no ${pronoun} ${verb} ${obj}`);
      samples.push(`${subj} ${pronoun} ${verb} ${obj}`);
      samples.push(`${subj} no ${pronoun} ${verb} ${obj}`);
    }
  }

  for (const subject of baseSubjects) {
    const estar = pickEstarPresentForm(subject);
    const ser = pickSerPresentForm(subject);
    for (const adj of ES_MODAL_ADJECTIVES) {
      for (const obj of objectVariants) {
        samples.push(`${subject} ${estar} ${adj} ${obj}`);
        samples.push(`${subject} no ${estar} ${adj} ${obj}`);
        samples.push(`${subject} ${ser} ${adj} ${obj}`);
        samples.push(`${subject} no ${ser} ${adj} ${obj}`);
      }
    }
  }

  for (const subject of baseSubjects) {
    const tener = pickTenerPresentForm(subject);
    for (const obj of experienceObjects) {
      samples.push(`${subject} ${tener} experiencia con ${obj}`);
      samples.push(`${subject} no ${tener} experiencia con ${obj}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (modalPartIndex === null) return unique;
  const filtered = unique.filter((_, idx) => idx % MODAL_PARTS === modalPartIndex);
  return Array.from(new Set([...pinnedSamples, ...filtered]));
}

function buildModalPossessiveSamplesEs(): string[] {
  const subjects = ["yo", "tú", "él", "ella", "nosotros", "ellos"];
  const verbs = [ES_MODAL_DJAL_FORMS[0], ES_MODAL_MARNGI_FORMS[0]];
  const objects = [
    "el glorp de Stephen",
    "el glorp de mí",
    "el glorp de él",
    "glorp de Stephen",
    "glorp de mí",
    "glorp de él",
  ];
  const samples: string[] = [];
  for (const subject of subjects) {
    for (const forms of verbs) {
      const verb = pickModalFormEs(subject, forms);
      for (const obj of objects) {
        samples.push(`${subject} ${verb} ${obj}`);
        samples.push(`${subject} no ${verb} ${obj}`);
      }
    }
  }
  return Array.from(new Set(samples));
}

function buildModalInfinitivePossessiveSamplesEs(): string[] {
  const subjects = ["yo", "tú", "él", "ella", "nosotros", "ellos"];
  const verbs = [ES_MODAL_DJAL_FORMS[0], ES_MODAL_MARNGI_FORMS[0]];
  const infinitives = ["comer", "beber"];
  const objects = [
    "el glorp de Stephen",
    "glorp de Stephen",
    "el glorp de mí",
    "glorp de mí",
    "el glorp de él",
    "glorp de él",
  ];
  const samples: string[] = [];
  for (const subject of subjects) {
    for (const forms of verbs) {
      const verb = pickModalFormEs(subject, forms);
      for (const inf of infinitives) {
        for (const obj of objects) {
          samples.push(`${subject} ${verb} ${inf} ${obj}`);
          samples.push(`${subject} no ${verb} ${inf} ${obj}`);
        }
      }
    }
  }
  return Array.from(new Set(samples));
}

function buildBecomeSamplesEs(
  subjectSamples: string[],
  becomePartIndex: number | null
): string[] {
  const baseSubjects = [
    "yo",
    "tú",
    "él",
    "ella",
    "nosotros",
    "nosotras",
    "ustedes",
    "vosotros",
    "vosotras",
    "ellos",
    "ellas",
  ];
  const reflexivePronouns = ["me", "te", "se", "nos", "os", "se"];
  const reflexiveSubjects = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];

  const samples: string[] = [];

  for (const subject of baseSubjects) {
    for (const forms of ES_BECOME_FORMS) {
      const present = pickModalFormEs(subject, forms.present);
      const preterite = pickModalFormEs(subject, forms.preterite);
      const imperfect = pickModalFormEs(subject, forms.imperfect);
      const future = pickModalFormEs(subject, forms.future);
      const subjunctive = pickModalFormEs(subject, forms.subjunctive);
      for (const adj of ES_BECOME_ADJECTIVES) {
        samples.push(`${subject} ${present} ${adj}`);
        samples.push(`${subject} no ${present} ${adj}`);
        samples.push(`${subject} ${preterite} ${adj}`);
        samples.push(`${subject} no ${preterite} ${adj}`);
        samples.push(`${subject} ${imperfect} ${adj}`);
        samples.push(`${subject} no ${imperfect} ${adj}`);
        samples.push(`${subject} ${future} ${adj}`);
        samples.push(`${subject} no ${future} ${adj}`);
        samples.push(`${subject} ${subjunctive} ${adj}`);
        samples.push(`${subject} no ${subjunctive} ${adj}`);
      }
    }
  }

  for (let i = 0; i < ES_BECOME_FORMS.length; i += 1) {
    const forms = ES_BECOME_FORMS[i];
    for (let idx = 0; idx < reflexivePronouns.length; idx += 1) {
      const pronoun = reflexivePronouns[idx];
      const subj = reflexiveSubjects[idx];
      const verb = forms.present[idx];
      for (const adj of ES_BECOME_ADJECTIVES) {
        samples.push(`${pronoun} ${verb} ${adj}`);
        samples.push(`${subj} ${pronoun} ${verb} ${adj}`);
      }
    }
  }

  for (const forms of ES_BECOME_FORMS) {
    for (const adj of ES_BECOME_ADJECTIVES) {
      samples.push(`${forms.infinitive} ${adj}`);
      samples.push(`${forms.infinitiveReflexive} ${adj}`);
      samples.push(`${forms.gerund} ${adj}`);
    }
    for (const adj of ES_BECOME_ADJECTIVES) {
      const [tu, usted, nosotros, vosotros, ustedes] = forms.imperative;
      samples.push(`${tu} ${adj}`);
      samples.push(`${usted} ${adj}`);
      samples.push(`${nosotros} ${adj}`);
      samples.push(`${vosotros} ${adj}`);
      samples.push(`${ustedes} ${adj}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (becomePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % BECOME_PARTS === becomePartIndex);
}

function buildMakeSamplesEs(
  subjectSamples: string[],
  makePartIndex: number | null
): string[] {
  const baseSubjects = [
    "yo",
    "tú",
    "él",
    "ella",
    "nosotros",
    "nosotras",
    "ustedes",
    "vosotros",
    "vosotras",
    "ellos",
    "ellas",
  ];
  const objectVariants = buildEsObjectVariants().slice(0, 12);
  const objectPronouns = ES_OBJECT_PRONOUNS.slice(0, 4);
  const samples: string[] = [];

  for (const subject of baseSubjects) {
    for (const forms of ES_MAKE_FORMS) {
      const present = pickModalFormEs(subject, forms.present);
      const preterite = pickModalFormEs(subject, forms.preterite);
      const imperfect = pickModalFormEs(subject, forms.imperfect);
      const future = pickModalFormEs(subject, forms.future);
      const subjunctive = pickModalFormEs(subject, forms.subjunctive);
      for (const adj of ES_MAKE_ADJECTIVES) {
        samples.push(`${subject} ${present} ${adj}`);
        samples.push(`${subject} no ${present} ${adj}`);
        samples.push(`${subject} ${preterite} ${adj}`);
        samples.push(`${subject} no ${preterite} ${adj}`);
        samples.push(`${subject} ${imperfect} ${adj}`);
        samples.push(`${subject} no ${imperfect} ${adj}`);
        samples.push(`${subject} ${future} ${adj}`);
        samples.push(`${subject} no ${future} ${adj}`);
        samples.push(`${subject} ${subjunctive} ${adj}`);
        samples.push(`${subject} no ${subjunctive} ${adj}`);
        for (const obj of objectVariants) {
          samples.push(`${subject} ${present} ${obj} ${adj}`);
          samples.push(`${subject} no ${present} ${obj} ${adj}`);
        }
        for (const obj of objectPronouns) {
          samples.push(`${subject} ${obj} ${present} ${adj}`);
          samples.push(`${subject} no ${obj} ${present} ${adj}`);
        }
      }
    }
  }

  for (const forms of ES_MAKE_FORMS) {
    for (const adj of ES_MAKE_ADJECTIVES) {
      for (const obj of objectVariants.slice(0, 6)) {
        samples.push(`${forms.infinitive} ${obj} ${adj}`);
        samples.push(`${forms.gerund} ${obj} ${adj}`);
      }
      const [tu, usted, nosotros, vosotros, ustedes] = forms.imperative;
      for (const obj of objectPronouns) {
        samples.push(`${tu} ${obj} ${adj}`);
        samples.push(`${usted} ${obj} ${adj}`);
        samples.push(`${nosotros} ${obj} ${adj}`);
        samples.push(`${vosotros} ${obj} ${adj}`);
        samples.push(`${ustedes} ${obj} ${adj}`);
      }
    }
  }

  const unique = Array.from(new Set(samples));
  if (makePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % MAKE_PARTS === makePartIndex);
}

function buildHaveSamplesEs(
  subjectSamples: string[],
  havePartIndex: number | null
): string[] {
  const baseSubjects = [
    "yo",
    "tú",
    "él",
    "ella",
    "ello",
    "nosotros",
    "nosotras",
    "ustedes",
    "vosotros",
    "vosotras",
    "ellos",
    "ellas",
  ];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") ||
      sample.includes(",") ||
      /dema?s|otro/.test(sample)
  );
  const haveSubjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 24)])
  );
  const objectVariants = buildEsObjectVariants();
  const connectorObjects = ["dinero", "la esposa", "los hijos"];
  const connectorVariants = buildObjectConnectorVariants(
    connectorObjects,
    "es"
  );
  const haveVerbs = [
    TENER_PRESENT_FORMS_ES,
    POSEER_PRESENT_FORMS_ES,
    PERTENECER_PRESENT_FORMS_ES,
    CARECER_PRESENT_FORMS_ES,
  ];
  const samples: string[] = [];
  for (const subject of haveSubjects) {
    for (const forms of haveVerbs) {
      const verb = pickModalFormEs(subject, forms);
      for (const obj of objectVariants) {
        samples.push(`${subject} ${verb} ${obj}`);
      }
      for (const obj of connectorVariants) {
        samples.push(`${subject} ${verb} ${obj}`);
        samples.push(`${subject} no ${verb} ${obj}`);
      }
    }
  }
  const multiObjects = buildObjectVariants(
    ES_OBJECT_NOUNS.slice(0, 2),
    "es"
  );
  for (const subject of haveSubjects) {
    const verb = pickTenerPresentForm(subject);
    for (const obj of multiObjects) {
      samples.push(`${subject} ${verb} ${obj}`);
    }
  }
  const unique = Array.from(new Set(samples));
  if (havePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % HAVE_PARTS === havePartIndex);
}

function buildDemoIntransitiveSamplesEs(): string[] {
  const samples: string[] = [];
  for (const demo of INTRANSITIVE_DEMOS_ES_SING) {
    samples.push(`${demo} va`);
    samples.push(`${demo} no va`);
  }
  for (const demo of INTRANSITIVE_DEMOS_ES_PLUR) {
    samples.push(`${demo} van`);
    samples.push(`${demo} no van`);
  }
  return Array.from(new Set(samples));
}

function buildDemoIntransitiveSamplesEn(): string[] {
  const samples: string[] = [];
  for (const demo of INTRANSITIVE_DEMOS_EN_SING) {
    samples.push(`${demo} goes`);
    samples.push(`${demo} doesn't go`);
  }
  for (const demo of INTRANSITIVE_DEMOS_EN_PLUR) {
    samples.push(`${demo} go`);
    samples.push(`${demo} don't go`);
  }
  return Array.from(new Set(samples));
}

function buildDhiyakiSamplesEs(): string[] {
  return Array.from(
    new Set([
      "quiero eso",
      "quiero ese pez",
      "quiero esa leche",
      "no conozco a esa persona",
      "yo como por ese niño",
      "yo como por eso",
      "yo como con ese palo",
      "yo como con eso",
      "quiero esto",
      "quiero este pez",
      "no conozco a esta persona",
      "yo como por este niño",
      "yo como por esto",
      "yo como con este palo",
      "yo como con esto",
    ])
  );
}

function buildDhiyakiSamplesEn(): string[] {
  return Array.from(
    new Set([
      "i want that",
      "i want that fish",
      "i want that milk",
      "i don't know that person",
      "i eat for that child",
      "i eat for that",
      "i eat with that stick",
      "i eat with that",
      "i want this",
      "i want this fish",
      "i don't know this person",
      "i eat for this child",
      "i eat for this",
      "i eat with this stick",
      "i eat with this",
    ])
  );
}

function buildModalSamplesEn(
  subjectSamples: string[],
  modalPartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const modalSubjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 24)])
  );
  const objectVariants = buildEnObjectVariants();
  const samples: string[] = [];
  const pinnedSamples: string[] = [];

  const modalForms = [...EN_MODAL_DJAL_FORMS, ...EN_MODAL_MARNGI_FORMS];
  for (const subject of modalSubjects) {
    for (const forms of modalForms) {
      const verb = pickModalFormEn(subject, forms as [string, string]);
      const negator = pickModalNegatorEn(subject);
      for (const obj of objectVariants) {
        samples.push(`${subject} ${verb} ${obj}`);
        samples.push(`${subject} ${negator} ${forms[0]} ${obj}`);
      }
    }
  }

  const possessiveObjects = [
    "the glorp of Stephen",
    "the glorp of me",
    "the glorp of him",
  ];
  const possessiveForms = [EN_MODAL_DJAL_FORMS[0], EN_MODAL_MARNGI_FORMS[0]];
  for (const subject of baseSubjects) {
    for (const forms of possessiveForms) {
      const verb = pickModalFormEn(subject, forms as [string, string]);
      const negator = pickModalNegatorEn(subject);
      for (const obj of possessiveObjects) {
        samples.push(`${subject} ${verb} ${obj}`);
        samples.push(`${subject} ${negator} ${forms[0]} ${obj}`);
        pinnedSamples.push(`${subject} ${verb} ${obj}`);
        pinnedSamples.push(`${subject} ${negator} ${forms[0]} ${obj}`);
      }
    }
  }

  for (const subject of baseSubjects) {
    const copula = pickCopulaEn(subject);
    for (const adj of EN_MODAL_ADJECTIVES) {
      for (const obj of objectVariants) {
        if (adj === "accustomed") {
          samples.push(`${subject} ${copula} ${adj} to ${obj}`);
          samples.push(`${subject} ${copula} not ${adj} to ${obj}`);
        } else {
          samples.push(`${subject} ${copula} ${adj} ${obj}`);
          samples.push(`${subject} ${copula} not ${adj} ${obj}`);
          if (adj === "experienced") {
            samples.push(`${subject} ${copula} ${adj} with ${obj}`);
            samples.push(`${subject} ${copula} not ${adj} with ${obj}`);
          }
        }
      }
    }
  }

  for (const subject of baseSubjects) {
    const have = pickHaveEn(subject);
    const negator = pickModalNegatorEn(subject);
    for (const obj of objectVariants) {
      samples.push(`${subject} ${have} experience with ${obj}`);
      samples.push(`${subject} ${negator} have experience with ${obj}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (modalPartIndex === null) return unique;
  const filtered = unique.filter((_, idx) => idx % MODAL_PARTS === modalPartIndex);
  return Array.from(new Set([...pinnedSamples, ...filtered]));
}

function buildModalPossessiveSamplesEn(): string[] {
  const subjects = ["i", "you", "he", "she", "we", "they"];
  const verbs = [EN_MODAL_DJAL_FORMS[0], EN_MODAL_MARNGI_FORMS[0]];
  const objects = [
    "the glorp of Stephen",
    "the glorp of me",
    "the glorp of him",
    "glorp of Stephen",
    "glorp of me",
    "glorp of him",
  ];
  const samples: string[] = [];
  for (const subject of subjects) {
    for (const forms of verbs) {
      const verb = pickModalFormEn(subject, forms as [string, string]);
      const negator = pickModalNegatorEn(subject);
      for (const obj of objects) {
        samples.push(`${subject} ${verb} ${obj}`);
        samples.push(`${subject} ${negator} ${forms[0]} ${obj}`);
      }
    }
  }
  return Array.from(new Set(samples));
}

function buildModalInfinitivePossessiveSamplesEn(): string[] {
  const subjects = ["i", "you", "he", "she", "we", "they"];
  const verbs = [EN_MODAL_DJAL_FORMS[0], EN_MODAL_MARNGI_FORMS[0]];
  const infinitives = ["eat", "drink"];
  const objects = [
    "the glorp of Stephen",
    "glorp of Stephen",
    "the glorp of me",
    "glorp of me",
    "the glorp of him",
    "glorp of him",
    "Stephen's glorp",
  ];
  const samples: string[] = [];
  for (const subject of subjects) {
    for (const forms of verbs) {
      const verb = pickModalFormEn(subject, forms as [string, string]);
      const negator = pickModalNegatorEn(subject);
      for (const inf of infinitives) {
        for (const obj of objects) {
          samples.push(`${subject} ${verb} to ${inf} ${obj}`);
          samples.push(`${subject} ${negator} ${forms[0]} to ${inf} ${obj}`);
        }
      }
    }
  }
  return Array.from(new Set(samples));
}

function buildBecomeSamplesEn(
  subjectSamples: string[],
  becomePartIndex: number | null
): string[] {
  const baseSubjects = ["I", "you", "he", "she", "we", "they"];
  const samples: string[] = [];

  for (const subject of baseSubjects) {
    for (const forms of EN_BECOME_FORMS) {
      const present = subject.toLowerCase() === "he" || subject.toLowerCase() === "she"
        ? forms.present[1]
        : forms.present[0];
      for (const adj of EN_BECOME_ADJECTIVES) {
        samples.push(`${subject} ${present} ${adj}`);
        samples.push(`${subject} not ${present} ${adj}`);
        samples.push(`${subject} ${forms.past} ${adj}`);
        samples.push(`${subject} not ${forms.past} ${adj}`);
        samples.push(`${subject} ${forms.gerund} ${adj}`);
      }
    }
  }

  for (const forms of EN_BECOME_FORMS) {
    for (const adj of EN_BECOME_ADJECTIVES) {
      samples.push(`${forms.present[0]} ${adj}`);
      samples.push(`to ${forms.present[0]} ${adj}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (becomePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % BECOME_PARTS === becomePartIndex);
}

function buildMakeSamplesEn(
  subjectSamples: string[],
  makePartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "we", "they"];
  const objectVariants = buildEnObjectVariants().slice(0, 12);
  const samples: string[] = [];
  const verbs = [
    { base: "make", third: "makes", past: "made", gerund: "making" },
    { base: "turn", third: "turns", past: "turned", gerund: "turning" },
    { base: "cause", third: "causes", past: "caused", gerund: "causing" },
  ];

  for (const subject of baseSubjects) {
    for (const verb of verbs) {
      const present =
        subject === "he" || subject === "she" ? verb.third : verb.base;
      for (const adj of EN_MAKE_ADJECTIVES) {
        samples.push(`${subject} ${present} ${adj}`);
        samples.push(`${subject} not ${present} ${adj}`);
        samples.push(`${subject} ${verb.past} ${adj}`);
        samples.push(`${subject} not ${verb.past} ${adj}`);
        for (const obj of objectVariants) {
          samples.push(`${subject} ${present} ${obj} ${adj}`);
          samples.push(`${subject} not ${present} ${obj} ${adj}`);
        }
      }
    }
  }

  for (const verb of verbs) {
    for (const adj of EN_MAKE_ADJECTIVES) {
      for (const obj of objectVariants.slice(0, 6)) {
        samples.push(`${verb.base} ${obj} ${adj}`);
        samples.push(`to ${verb.base} ${obj} ${adj}`);
        samples.push(`${verb.gerund} ${obj} ${adj}`);
      }
    }
  }

  const unique = Array.from(new Set(samples));
  if (makePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % MAKE_PARTS === makePartIndex);
}

function buildHaveSamplesEn(
  subjectSamples: string[],
  havePartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "it", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const haveSubjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 24)])
  );
  const objectVariants = buildEnObjectVariants();
  const connectorObjects = ["money", "a wife", "children"];
  const connectorVariants = buildObjectConnectorVariants(
    connectorObjects,
    "en"
  );
  const verbPairs: Array<[string, string]> = [
    ["have", "has"],
    ["have got", "has got"],
    ["possess", "possesses"],
    ["own", "owns"],
    ["belong", "belongs"],
  ];
  const samples: string[] = [];
  for (const subject of haveSubjects) {
    for (const pair of verbPairs) {
      const verb = pickModalFormEn(subject, pair);
      for (const obj of objectVariants) {
        samples.push(`${subject} ${verb} ${obj}`);
      }
      for (const obj of connectorVariants) {
        const negator = pickModalNegatorEn(subject);
        samples.push(`${subject} ${verb} ${obj}`);
        samples.push(`${subject} ${negator} have ${obj}`);
      }
    }
  }
  const multiObjects = buildObjectVariants(
    EN_OBJECT_NOUNS.slice(0, 2),
    "en"
  );
  for (const subject of haveSubjects) {
    const verb = pickHaveEn(subject);
    for (const obj of multiObjects) {
      samples.push(`${subject} ${verb} ${obj}`);
    }
  }
  const unique = Array.from(new Set(samples));
  if (havePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % HAVE_PARTS === havePartIndex);
}

function buildPossessionSamplesEs(possessionPartIndex: number | null): string[] {
  const samples: string[] = [
    "mi padre va",
    "tu padre va",
    "su padre va",
    "nuestro padre va",
    "el padre de Stephen va",
    "el padre de mí va",
    "el padre de nosotros va",
    "la esposa de Stephen come",
    "él come la esposa de Stephen",
    "él come a la esposa de Stephen",
    "él come la gran esposa de Stephen",
    "él come la esposa de Stephen grande",
  ];
  const unique = Array.from(new Set(samples));
  if (possessionPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % POSSESSION_PARTS === possessionPartIndex);
}

function buildPossessionSamplesEn(possessionPartIndex: number | null): string[] {
  const samples: string[] = [
    "my father goes",
    "your father goes",
    "his father goes",
    "its father goes",
    "their father goes",
    "Stephen's wife eats",
    "the wife of Stephen eats",
    "its wife eats",
    "he eats Stephen's wife",
    "he eats the wife of Stephen",
    "he eats the wife of me",
    "he eats the wife of mine",
    "he eats its wife",
    "he eats the big wife of Stephen",
    "he eats the wife of big Stephen",
  ];
  const unique = Array.from(new Set(samples));
  if (possessionPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % POSSESSION_PARTS === possessionPartIndex);
}

function buildCopulaSamplesEs(
  subjectSamples: string[],
  copulaPartIndex: number | null
): string[] {
  const baseSubjects = [
    "yo",
    "tú",
    "él",
    "ella",
    "ello",
    "nosotros",
    "nosotras",
    "ustedes",
    "vosotros",
    "vosotras",
    "ellos",
    "ellas",
  ];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const copulaSubjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 18)])
  );
  const adjectives = COPULA_ADJECTIVES_ES.slice(0, 6);
  const adjectivePairs = ["grande y pequeño", "grande e inteligente"];
  const nouns = ES_OBJECT_NOUNS;
  const pronouns = COPULA_PRONOUNS_ES;

  const samples: string[] = [];

  for (const subject of copulaSubjects) {
    const ser = pickSerPresentForm(subject);
    const estar = pickEstarPresentForm(subject);
    for (const adj of adjectives) {
      samples.push(`${subject} ${ser} ${adj}`);
      samples.push(`${subject} no ${ser} ${adj}`);
      samples.push(`${subject} ${estar} ${adj}`);
      samples.push(`${subject} no ${estar} ${adj}`);
    }
    for (const pair of adjectivePairs) {
      samples.push(`${subject} ${ser} ${pair}`);
      samples.push(`${subject} no ${ser} ${pair}`);
      samples.push(`${subject} ${estar} ${pair}`);
      samples.push(`${subject} no ${estar} ${pair}`);
    }
    for (const noun of nouns) {
      samples.push(`${subject} ${ser} ${noun}`);
      samples.push(`${subject} no ${ser} ${noun}`);
    }
    for (const pronoun of pronouns) {
      samples.push(`${subject} ${ser} ${pronoun}`);
      samples.push(`${subject} no ${ser} ${pronoun}`);
    }
  }

  const pastSubjects = baseSubjects.slice(0, 6);
  for (const subject of pastSubjects) {
    const serPret = pickSerPreteriteForm(subject);
    const serImp = pickSerImperfectForm(subject);
    const serFut = pickSerFutureForm(subject);
    const estarPret = pickEstarPreteriteForm(subject);
    const estarImp = pickEstarImperfectForm(subject);
    for (const adj of adjectives.slice(0, 3)) {
      samples.push(`${subject} ${serPret} ${adj}`);
      samples.push(`${subject} no ${serPret} ${adj}`);
      samples.push(`${subject} ${serImp} ${adj}`);
      samples.push(`${subject} no ${serImp} ${adj}`);
      samples.push(`${subject} ${serFut} ${adj}`);
      samples.push(`${subject} ${estarPret} ${adj}`);
      samples.push(`${subject} no ${estarPret} ${adj}`);
      samples.push(`${subject} ${estarImp} ${adj}`);
      samples.push(`${subject} no ${estarImp} ${adj}`);
    }
  }

  const demoAdj = adjectives[0] ?? "grande";
  const demoPair = adjectivePairs[0] ?? "grande y pequeño";
  const demoNoun = nouns[0] ?? "alguien";
  const demoNounPair = nouns.length >= 2 ? `${nouns[0]} y ${nouns[1]}` : null;
  for (const demo of COPULA_DEMOS_ES_SING) {
    samples.push(`${demo} es ${demoAdj}`);
    samples.push(`${demo} es ${demoPair}`);
    samples.push(`${demo} es ${demoNoun}`);
    if (demoNounPair) samples.push(`${demo} es ${demoNounPair}`);
  }
  for (const demo of COPULA_DEMOS_ES_PLUR) {
    samples.push(`${demo} son ${demoAdj}`);
    samples.push(`${demo} son ${demoPair}`);
    samples.push(`${demo} son ${demoNoun}`);
    if (demoNounPair) samples.push(`${demo} son ${demoNounPair}`);
  }

  const possNoun = nouns[1] ?? nouns[0] ?? "accidente";
  samples.push(`esto es mi ${possNoun}`);
  samples.push(`esto no es mi ${possNoun}`);
  samples.push(`este ${possNoun} es mío`);
  samples.push(`este ${possNoun} no es mío`);
  samples.push(`esto es el ${possNoun} de John`);
  samples.push(`este ${possNoun} es de John`);
  samples.push(`esto es de John`);
  samples.push(`este ${possNoun} es tuyo`);
  samples.push(`esto es el ${possNoun} de mi padre`);
  samples.push(`este ${possNoun} es de mi padre`);
  samples.push(`este ${possNoun} de mi padre es mío`);
  samples.push(`esto es el ${possNoun} de tu padre`);
  samples.push(`esto es el ${possNoun} de su padre`);

  const unique = Array.from(new Set(samples));
  if (copulaPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % COPULA_PARTS === copulaPartIndex);
}

function buildCopulaSamplesEn(
  subjectSamples: string[],
  copulaPartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "it", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const copulaSubjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 18)])
  );
  const adjectives = COPULA_ADJECTIVES_EN.slice(0, 6);
  const adjectivePairs = ["big and small", "strong and weak"];
  const nouns = EN_OBJECT_NOUNS;
  const pronouns = COPULA_PRONOUNS_EN;

  const samples: string[] = [];

  for (const subject of copulaSubjects) {
    const copula = pickCopulaEn(subject);
    for (const adj of adjectives) {
      samples.push(`${subject} ${copula} ${adj}`);
      samples.push(`${subject} ${copula} not ${adj}`);
    }
    for (const pair of adjectivePairs) {
      samples.push(`${subject} ${copula} ${pair}`);
      samples.push(`${subject} ${copula} not ${pair}`);
    }
    for (const noun of nouns) {
      samples.push(`${subject} ${copula} ${noun}`);
      samples.push(`${subject} ${copula} not ${noun}`);
    }
    for (const pronoun of pronouns) {
      samples.push(`${subject} ${copula} ${pronoun}`);
      samples.push(`${subject} ${copula} not ${pronoun}`);
    }
  }

  for (const subject of baseSubjects) {
    const pastCopula = pickCopulaPastEn(subject);
    for (const adj of adjectives.slice(0, 3)) {
      samples.push(`${subject} ${pastCopula} ${adj}`);
      samples.push(`${subject} ${pastCopula} not ${adj}`);
      samples.push(`${subject} will be ${adj}`);
    }
  }

  const demoAdj = adjectives[0] ?? "big";
  const demoPair = adjectivePairs[0] ?? "big and small";
  const demoNoun = nouns[0] ?? "anyone";
  const demoNounPair = nouns.length >= 2 ? `${nouns[0]} and ${nouns[1]}` : null;
  for (const demo of COPULA_DEMOS_EN_SING) {
    samples.push(`${demo} is ${demoAdj}`);
    samples.push(`${demo} is ${demoPair}`);
    samples.push(`${demo} is ${demoNoun}`);
    if (demoNounPair) samples.push(`${demo} is ${demoNounPair}`);
  }
  for (const demo of COPULA_DEMOS_EN_PLUR) {
    samples.push(`${demo} are ${demoAdj}`);
    samples.push(`${demo} are ${demoPair}`);
    samples.push(`${demo} are ${demoNoun}`);
    if (demoNounPair) samples.push(`${demo} are ${demoNounPair}`);
  }

  const possNoun = nouns[1] ?? nouns[0] ?? "accident";
  samples.push(`this is my ${possNoun}`);
  samples.push(`this is not my ${possNoun}`);
  samples.push(`this ${possNoun} is mine`);
  samples.push(`this ${possNoun} is not mine`);
  samples.push(`this is John's ${possNoun}`);
  samples.push(`this ${possNoun} is John's`);
  samples.push(`this ${possNoun} is of John`);
  samples.push(`this is of John`);
  samples.push(`this is ours`);
  samples.push(`this is the ${possNoun} of my father`);
  samples.push(`this ${possNoun} is of my father`);
  samples.push(`this ${possNoun} of my father is mine`);
  samples.push(`this is the ${possNoun} of your father`);
  samples.push(`this is the ${possNoun} of his father`);

  const unique = Array.from(new Set(samples));
  if (copulaPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % COPULA_PARTS === copulaPartIndex);
}

function buildLocativeSamplesEs(
  subjectSamples: string[],
  locativePartIndex: number | null
): string[] {
  const baseSubjects = [
    "yo",
    "tú",
    "él",
    "ella",
    "ello",
    "nosotros",
    "nosotras",
    "ustedes",
    "vosotros",
    "vosotras",
    "ellos",
    "ellas",
  ];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 12)])
  );
  const locatives = LOCATIVE_ADVERBS_ES;
  const locativePreps = LOCATIVE_PREP_ES;
  const samples: string[] = [];

  for (const subject of subjects) {
    const estar = pickEstarPresentForm(subject);
    const ser = pickSerPresentForm(subject);
    for (const loc of locatives) {
      samples.push(`${subject} ${estar} ${loc}`);
      samples.push(`${subject} no ${estar} ${loc}`);
    }
    for (const loc of locatives.slice(0, 3)) {
      samples.push(`${subject} ${ser} ${loc}`);
      samples.push(`${subject} no ${ser} ${loc}`);
    }
    for (const loc of locativePreps) {
      samples.push(`${subject} ${estar} ${loc}`);
      samples.push(`${subject} no ${estar} ${loc}`);
    }
  }

  const timeSubjects = baseSubjects.slice(0, 6);
  for (const subject of timeSubjects) {
    const pret = pickEstarPreteriteForm(subject);
    const imp = pickEstarImperfectForm(subject);
    const fut = pickEstarFutureForm(subject);
    const loc = locatives[timeSubjects.indexOf(subject) % locatives.length];
    samples.push(`ayer ${subject} ${pret} ${loc}`);
    samples.push(`ayer ${subject} no ${pret} ${loc}`);
    samples.push(`hoy ${subject} ${imp} ${loc}`);
    samples.push(`hoy ${subject} no ${imp} ${loc}`);
    samples.push(`mañana ${subject} ${fut} ${loc}`);
    samples.push(`mañana ${subject} no ${fut} ${loc}`);
    for (const prep of ["en esto", "en ello"]) {
      samples.push(`ayer ${subject} ${pret} ${prep}`);
      samples.push(`ayer ${subject} no ${pret} ${prep}`);
      samples.push(`hoy ${subject} ${imp} ${prep}`);
      samples.push(`hoy ${subject} no ${imp} ${prep}`);
      samples.push(`mañana ${subject} ${fut} ${prep}`);
      samples.push(`mañana ${subject} no ${fut} ${prep}`);
    }
  }

  for (const subject of timeSubjects) {
    const ir = pickIrForm(subject);
    for (const loc of locatives.slice(0, 5)) {
      samples.push(`${subject} ${ir} ${loc}`);
      samples.push(`${subject} no ${ir} ${loc}`);
    }
    for (const loc of locativePreps.slice(0, 3)) {
      samples.push(`${subject} ${ir} ${loc}`);
      samples.push(`${subject} no ${ir} ${loc}`);
    }
  }

  for (let idx = 0; idx < ES_CHAIN_SUBJECTS.length; idx += 1) {
    const subject = ES_CHAIN_SUBJECTS[idx];
    const aux = ES_CHAIN_AUX[idx] ?? ES_CHAIN_AUX[0];
    const loc = locatives[idx % locatives.length];
    samples.push(`${subject} ${aux} yendo ${loc}`);
    samples.push(`${subject} no ${aux} yendo ${loc}`);
  }

  for (const demo of COPULA_DEMOS_ES_SING) {
    const loc = locatives[0];
    samples.push(`${demo} está ${loc}`);
    samples.push(`${demo} no está ${loc}`);
  }
  for (const demo of COPULA_DEMOS_ES_PLUR) {
    const loc = locatives[1] ?? locatives[0];
    samples.push(`${demo} están ${loc}`);
    samples.push(`${demo} no están ${loc}`);
  }

  for (const subject of timeSubjects) {
    const verb = pickComerForm(subject);
    const obj = ES_OBJECT_NOUNS[0] ?? "glorp";
    const loc = locatives[2] ?? locatives[0];
    samples.push(`${subject} ${verb} ${obj} ${loc}`);
    samples.push(`${subject} no ${verb} ${obj} ${loc}`);
    const locPrep = locativePreps[1] ?? locativePreps[0];
    samples.push(`${subject} ${verb} ${obj} ${locPrep}`);
    samples.push(`${subject} no ${verb} ${obj} ${locPrep}`);
  }

  const unique = Array.from(new Set(samples));
  if (locativePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % LOCATIVE_PARTS === locativePartIndex);
}

function buildLocativeSamplesEn(
  subjectSamples: string[],
  locativePartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "it", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 12)])
  );
  const locatives = LOCATIVE_ADVERBS_EN;
  const locativePreps = LOCATIVE_PREP_EN;
  const samples: string[] = [];

  for (const subject of subjects) {
    const copula = pickCopulaEn(subject);
    for (const loc of locatives) {
      samples.push(`${subject} ${copula} ${loc}`);
      samples.push(`${subject} ${copula} not ${loc}`);
    }
    for (const loc of locativePreps) {
      samples.push(`${subject} ${copula} ${loc}`);
      samples.push(`${subject} ${copula} not ${loc}`);
    }
  }

  for (const subject of baseSubjects) {
    const pastCopula = pickCopulaPastEn(subject);
    const loc = locatives[baseSubjects.indexOf(subject) % locatives.length];
    samples.push(`${subject} ${pastCopula} ${loc}`);
    samples.push(`${subject} ${pastCopula} not ${loc}`);
    samples.push(`${subject} will be ${loc}`);
    samples.push(`${subject} will not be ${loc}`);
    samples.push(`${subject} won't be ${loc}`);
    samples.push(`${subject} wont be ${loc}`);
    const locPrep = locativePreps[baseSubjects.indexOf(subject) % locativePreps.length];
    samples.push(`${subject} ${pastCopula} ${locPrep}`);
    samples.push(`${subject} ${pastCopula} not ${locPrep}`);
    samples.push(`${subject} will be ${locPrep}`);
    samples.push(`${subject} will not be ${locPrep}`);
    for (const prep of ["in this", "in it"]) {
      samples.push(`${subject} ${pastCopula} ${prep}`);
      samples.push(`${subject} ${pastCopula} not ${prep}`);
      samples.push(`${subject} will be ${prep}`);
      samples.push(`${subject} will not be ${prep}`);
    }
  }

  for (const subject of baseSubjects) {
    const go = pickGoForm(subject);
    const neg = isThirdSingEn(subject) ? "doesn't go" : "don't go";
    for (const loc of locatives.slice(0, 5)) {
      samples.push(`${subject} ${go} ${loc}`);
      samples.push(`${subject} ${neg} ${loc}`);
    }
    const locPrep = locativePreps[0] ?? "in the house";
    samples.push(`${subject} ${go} ${locPrep}`);
    samples.push(`${subject} ${neg} ${locPrep}`);
  }

  const auxPairs: Array<[string, string]> = [
    ["i", "am"],
    ["he", "is"],
    ["we", "are"],
    ["they", "were"],
  ];
  for (let idx = 0; idx < auxPairs.length; idx += 1) {
    const [subject, aux] = auxPairs[idx];
    const loc = locatives[idx % locatives.length];
    samples.push(`${subject} ${aux} going ${loc}`);
    samples.push(`${subject} ${aux} not going ${loc}`);
  }

  for (const demo of COPULA_DEMOS_EN_SING) {
    const loc = locatives[0];
    samples.push(`${demo} is ${loc}`);
    samples.push(`${demo} is not ${loc}`);
  }
  for (const demo of COPULA_DEMOS_EN_PLUR) {
    const loc = locatives[1] ?? locatives[0];
    samples.push(`${demo} are ${loc}`);
    samples.push(`${demo} are not ${loc}`);
  }

  for (const subject of baseSubjects) {
    const verb = pickEatForm(subject);
    const obj = EN_OBJECT_NOUNS[0] ?? "glorp";
    const loc = locatives[2] ?? locatives[0];
    samples.push(`${subject} ${verb} ${obj} ${loc}`);
    samples.push(`${subject} ${verb} the ${obj} ${loc}`);
    const locPrep = locativePreps[1] ?? locativePreps[0];
    samples.push(`${subject} ${verb} ${obj} ${locPrep}`);
    samples.push(`${subject} ${verb} the ${obj} ${locPrep}`);
  }

  const unique = Array.from(new Set(samples));
  if (locativePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % LOCATIVE_PARTS === locativePartIndex);
}

function buildAllativeSamplesEs(
  subjectSamples: string[],
  allativePartIndex: number | null
): string[] {
  const baseSubjects = ["yo", "tú", "él", "ella", "nosotros", "ellos"];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 8)])
  );
  const preps = ALLATIVE_PREP_ES;
  const adverbs = LOCATIVE_ADVERBS_ES;
  const motionAdverbs = MOTION_ADVERBS_ES;
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickIrForm(subject);
    for (const prep of preps) {
      samples.push(`${subject} ${verb} ${prep}`);
      samples.push(`${subject} no ${verb} ${prep}`);
    }
    for (const adv of adverbs) {
      samples.push(`${subject} ${verb} ${adv}`);
      samples.push(`${subject} no ${verb} ${adv}`);
    }
    for (const adv of motionAdverbs) {
      samples.push(`${subject} ${verb} ${adv} a store`);
      samples.push(`${subject} no ${verb} ${adv} a store`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (allativePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % ALLATIVE_PARTS === allativePartIndex);
}

function buildAllativeSamplesEn(
  subjectSamples: string[],
  allativePartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 8)])
  );
  const preps = ALLATIVE_PREP_EN;
  const adverbs = LOCATIVE_ADVERBS_EN;
  const motionAdverbs = MOTION_ADVERBS_EN;
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickGoForm(subject);
    for (const prep of preps) {
      samples.push(`${subject} ${verb} ${prep}`);
      const neg = isThirdSingEn(subject) ? "doesn't go" : "don't go";
      samples.push(`${subject} ${neg} ${prep}`);
    }
    for (const adv of adverbs) {
      samples.push(`${subject} ${verb} ${adv}`);
      const neg = isThirdSingEn(subject) ? "doesn't go" : "don't go";
      samples.push(`${subject} ${neg} ${adv}`);
    }
    for (const adv of motionAdverbs) {
      samples.push(`${subject} ${verb} ${adv} to the store`);
      const neg = isThirdSingEn(subject) ? "doesn't go" : "don't go";
      samples.push(`${subject} ${neg} ${adv} to the store`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (allativePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % ALLATIVE_PARTS === allativePartIndex);
}

function buildAblativeSamplesEs(
  subjectSamples: string[],
  ablativePartIndex: number | null
): string[] {
  const baseSubjects = ["yo", "tú", "él", "ella", "nosotros", "ellos"];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 8)])
  );
  const preps = ABLATIVE_PREP_ES;
  const adverbs = LOCATIVE_ADVERBS_ES;
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickIrForm(subject);
    for (const prep of preps) {
      samples.push(`${subject} ${verb} ${prep}`);
      samples.push(`${subject} no ${verb} ${prep}`);
    }
    for (const adv of adverbs) {
      samples.push(`${subject} ${verb} de ${adv}`);
      samples.push(`${subject} no ${verb} de ${adv}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (ablativePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % ABLATIVE_PARTS === ablativePartIndex);
}

function buildAblativeSamplesEn(
  subjectSamples: string[],
  ablativePartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 8)])
  );
  const preps = ABLATIVE_PREP_EN;
  const adverbs = LOCATIVE_ADVERBS_EN;
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickGoForm(subject);
    for (const prep of preps) {
      samples.push(`${subject} ${verb} ${prep}`);
      const neg = isThirdSingEn(subject) ? "doesn't go" : "don't go";
      samples.push(`${subject} ${neg} ${prep}`);
    }
    for (const adv of adverbs) {
      samples.push(`${subject} ${verb} from ${adv}`);
      const neg = isThirdSingEn(subject) ? "doesn't go" : "don't go";
      samples.push(`${subject} ${neg} from ${adv}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (ablativePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % ABLATIVE_PARTS === ablativePartIndex);
}

function buildAblativeDemoSamplesEs(): string[] {
  return Array.from(
    new Set([
      "yo voy de eso",
      "yo voy de ese glorp",
      "yo voy de ese alguien",
      "yo voy desde ese glorp",
      "yo voy desde ese alguien",
    ])
  );
}

function buildAblativeDemoSamplesEn(): string[] {
  return Array.from(
    new Set([
      "i go from that",
      "i go from that glorp",
      "i go from that person",
      "i go away from that glorp",
      "i go away from that person",
    ])
  );
}

function buildTraversiveSamplesEs(
  subjectSamples: string[],
  traversivePartIndex: number | null
): string[] {
  const baseSubjects = ["yo", "tú", "él", "ella", "nosotros", "ellos"];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 8)])
  );
  const preps = TRAVERSE_PREP_ES;
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickIrForm(subject);
    for (const prep of preps) {
      samples.push(`${subject} ${verb} ${prep}`);
      samples.push(`${subject} no ${verb} ${prep}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (traversivePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % TRAVERSE_PARTS === traversivePartIndex);
}

function buildTraversiveSamplesEn(
  subjectSamples: string[],
  traversivePartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 8)])
  );
  const preps = TRAVERSE_PREP_EN;
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickGoForm(subject);
    for (const prep of preps) {
      samples.push(`${subject} ${verb} ${prep}`);
      const neg = isThirdSingEn(subject) ? "doesn't go" : "don't go";
      samples.push(`${subject} ${neg} ${prep}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (traversivePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % TRAVERSE_PARTS === traversivePartIndex);
}

function buildTraversivePossessiveEmphaticSamplesEs(): string[] {
  return Array.from(new Set(TRAVERSE_POSSESSIVE_EMPHATIC_ES));
}

function buildTraversivePossessiveEmphaticSamplesEn(): string[] {
  return Array.from(new Set(TRAVERSE_POSSESSIVE_EMPHATIC_EN));
}

function buildReflexiveObjectSamplesEs(): string[] {
  return Array.from(new Set(REFLEXIVE_OBJECT_ES));
}

function buildReflexiveObjectSamplesEn(): string[] {
  return Array.from(new Set(REFLEXIVE_OBJECT_EN));
}

function buildSimultaneousSamplesEs(subjectSamples: string[]): string[] {
  const baseSubjects = ["yo", "tú", "él", "ella", "nosotros", "ellos"];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 8)])
  );
  const markers = ["mientras", "al", "durante"];
  const mainVerbs = ["voy", "como"];
  const subVerbs = ["como", "voy"];
  const samples: string[] = [];

  for (const subject of subjects) {
    for (const marker of markers) {
      for (const main of mainVerbs) {
        for (const sub of subVerbs) {
          samples.push(`${subject} ${main} ${marker} ${sub}`);
        }
        samples.push(
          `${subject} ${main} ${marker} ${subVerbs[0]} y ${subVerbs[1]}`
        );
      }
    }
  }
  for (const marker of markers) {
    for (const sub of subVerbs) {
      samples.push(`${marker} ${sub}`);
      samples.push(`${marker} ${sub} y ${subVerbs[0]}`);
    }
  }

  return Array.from(new Set(samples));
}

function buildSimultaneousSamplesEn(subjectSamples: string[]): string[] {
  const baseSubjects = ["i", "you", "he", "she", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const subjects = Array.from(
    new Set([...baseSubjects, ...multiSubjects.slice(0, 8)])
  );
  const markers = ["while", "during"];
  const mainVerbs = ["go", "eat"];
  const subVerbs = ["eat", "go"];
  const samples: string[] = [];

  for (const subject of subjects) {
    for (const marker of markers) {
      for (const main of mainVerbs) {
        for (const sub of subVerbs) {
          samples.push(`${subject} ${main} ${marker} ${sub}`);
        }
        samples.push(
          `${subject} ${main} ${marker} ${subVerbs[0]} and ${subVerbs[1]}`
        );
      }
    }
  }
  for (const marker of markers) {
    for (const sub of subVerbs) {
      samples.push(`${marker} ${sub}`);
      samples.push(`${marker} ${sub} and ${subVerbs[0]}`);
    }
  }

  return Array.from(new Set(samples));
}

function buildOriginSamplesEs(
  _subjectSamples: string[],
  originPartIndex: number | null
): string[] {
  const subjects = ORIGIN_SUBJECTS_ES;
  const preps = ORIGIN_PREP_ES;
  const samples: string[] = [];

  for (const subject of subjects) {
    for (const prep of preps) {
      samples.push(`${subject} es ${prep}`);
      samples.push(`${subject} no es ${prep}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (originPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % ORIGIN_PARTS === originPartIndex);
}

function buildOriginSamplesEn(
  _subjectSamples: string[],
  originPartIndex: number | null
): string[] {
  const subjects = ORIGIN_SUBJECTS_EN;
  const preps = ORIGIN_PREP_EN;
  const samples: string[] = [];

  for (const subject of subjects) {
    for (const prep of preps) {
      samples.push(`${subject} is ${prep}`);
      samples.push(`${subject} is not ${prep}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (originPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % ORIGIN_PARTS === originPartIndex);
}

function buildComitativeSamplesEs(
  subjectSamples: string[],
  comitativePartIndex: number | null
): string[] {
  const baseSubjects = ["yo", "tú", "él", "ella", "nosotros", "nosotras", "ellos", "ellas"];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const subjects = Array.from(new Set([...baseSubjects, ...multiSubjects.slice(0, 8)]));
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickComerForm(subject);
    for (const prep of COMITATIVE_PREP_ES) {
      samples.push(`${subject} ${verb} ${prep}`);
      samples.push(`${subject} no ${verb} ${prep}`);
    }
    const estar = pickEstarPresentForm(subject);
    samples.push(`${subject} ${estar} con él`);
    samples.push(`${subject} no ${estar} con él`);
  }

  const unique = Array.from(new Set(samples));
  if (comitativePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % COMITATIVE_PARTS === comitativePartIndex);
}

function buildComitativeSamplesEn(
  subjectSamples: string[],
  comitativePartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "it", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const subjects = Array.from(new Set([...baseSubjects, ...multiSubjects.slice(0, 8)]));
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickEatForm(subject);
    for (const prep of COMITATIVE_PREP_EN) {
      samples.push(`${subject} ${verb} ${prep}`);
      const neg = isThirdSingEn(subject) ? "doesn't" : "don't";
      samples.push(`${subject} ${neg} ${verb} ${prep}`);
    }
    const copula = pickCopulaEn(subject);
    samples.push(`${subject} ${copula} with him`);
    samples.push(`${subject} ${copula} not with him`);
  }

  const unique = Array.from(new Set(samples));
  if (comitativePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % COMITATIVE_PARTS === comitativePartIndex);
}

function buildComitativeDemoSamplesEs(): string[] {
  return Array.from(
    new Set([
      "yo como con ese alguien",
      "yo como con esa esposa",
      "yo como con ese accidente",
      "yo como con ese glorp",
      "yo como con eso",
      "yo estoy con esa esposa",
      "yo estoy con ese glorp",
      "yo estoy con eso",
    ])
  );
}

function buildComitativeDemoSamplesEn(): string[] {
  return Array.from(
    new Set([
      "i eat with that person",
      "i eat with that accident",
      "i eat with that glorp",
      "i eat with that",
      "i am with that person",
      "i am with that glorp",
      "i am with that",
    ])
  );
}

function buildInstrumentalSamplesEs(
  subjectSamples: string[],
  instrumentalPartIndex: number | null
): string[] {
  const baseSubjects = ["yo", "tú", "él", "ella", "nosotros", "nosotras", "ellos", "ellas"];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const subjects = Array.from(new Set([...baseSubjects, ...multiSubjects.slice(0, 8)]));
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickComerForm(subject);
    for (const prep of INSTRUMENTAL_PREP_ES) {
      samples.push(`${subject} ${verb} ${prep}`);
      samples.push(`${subject} no ${verb} ${prep}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (instrumentalPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % INSTRUMENTAL_PARTS === instrumentalPartIndex);
}

function buildInstrumentalSamplesEn(
  subjectSamples: string[],
  instrumentalPartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "it", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const subjects = Array.from(new Set([...baseSubjects, ...multiSubjects.slice(0, 8)]));
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickEatForm(subject);
    for (const prep of INSTRUMENTAL_PREP_EN) {
      samples.push(`${subject} ${verb} ${prep}`);
      const neg = isThirdSingEn(subject) ? "doesn't" : "don't";
      samples.push(`${subject} ${neg} ${verb} ${prep}`);
    }
  }

  const unique = Array.from(new Set(samples));
  if (instrumentalPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % INSTRUMENTAL_PARTS === instrumentalPartIndex);
}

function buildAgentSamplesEs(): string[] {
  const subjects = [
    "Djäwa",
    "el balam",
    "el gar",
    "el mak",
    "el miri",
    "el buru",
    "este balam",
    "ese balam",
    "esta miri",
    "esa miri",
  ];
  const object = "el pan";
  const samples: string[] = [];
  for (const subject of subjects) {
    const verb = pickComerForm(subject);
    samples.push(`${subject} ${verb} ${object}`);
    samples.push(`${subject} no ${verb} ${object}`);
  }
  return Array.from(new Set(samples));
}

function buildAgentSamplesEn(): string[] {
  const subjects = [
    "Djäwa",
    "the balam",
    "the gar",
    "the mak",
    "the miri",
    "the buru",
    "this balam",
    "that balam",
    "this miri",
    "that miri",
  ];
  const object = "the bread";
  const samples: string[] = [];
  for (const subject of subjects) {
    const verb = pickEatForm(subject);
    const neg = isThirdSingEn(subject) ? "doesn't" : "don't";
    samples.push(`${subject} ${verb} ${object}`);
    samples.push(`${subject} ${neg} ${verb} ${object}`);
  }
  return Array.from(new Set(samples));
}

function buildPurposeSamplesEs(
  subjectSamples: string[],
  purposePartIndex: number | null
): string[] {
  const baseSubjects = ["yo", "tú", "él", "ella", "nosotros", "nosotras", "ellos", "ellas"];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const subjects = Array.from(new Set([...baseSubjects, ...multiSubjects.slice(0, 8)]));
  const targets = PURPOSE_TARGETS_ES;
  const pronouns = PURPOSE_PRONOUNS_ES;
  const objects = ["el pan", "la leche"];
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickComerForm(subject);
    for (const prep of PURPOSE_PREP_ES) {
      for (const target of targets) {
        samples.push(`${subject} ${verb} ${prep} ${target}`);
        samples.push(`${subject} no ${verb} ${prep} ${target}`);
      }
      for (const pronoun of pronouns) {
        samples.push(`${subject} ${verb} ${prep} ${pronoun}`);
        samples.push(`${subject} no ${verb} ${prep} ${pronoun}`);
      }
      for (const object of objects) {
        const target = targets[0];
        samples.push(`${subject} ${verb} ${object} ${prep} ${target}`);
        samples.push(`${subject} no ${verb} ${object} ${prep} ${target}`);
      }
    }
  }

  const unique = Array.from(new Set(samples));
  if (purposePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % PURPOSE_PARTS === purposePartIndex);
}

function buildPurposeSamplesEn(
  subjectSamples: string[],
  purposePartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const subjects = Array.from(new Set([...baseSubjects, ...multiSubjects.slice(0, 8)]));
  const targets = PURPOSE_TARGETS_EN;
  const pronouns = PURPOSE_PRONOUNS_EN;
  const objects = ["the food", "the milk"];
  const samples: string[] = [];

  for (const subject of subjects) {
    const verb = pickEatForm(subject);
    const neg = isThirdSingEn(subject) ? "doesn't" : "don't";
    for (const prep of PURPOSE_PREP_EN) {
      for (const target of targets) {
        samples.push(`${subject} ${verb} ${prep} ${target}`);
        samples.push(`${subject} ${neg} ${verb} ${prep} ${target}`);
      }
      for (const pronoun of pronouns) {
        samples.push(`${subject} ${verb} ${prep} ${pronoun}`);
        samples.push(`${subject} ${neg} ${verb} ${prep} ${pronoun}`);
      }
      for (const object of objects) {
        const target = targets[0];
        samples.push(`${subject} ${verb} ${object} ${prep} ${target}`);
        samples.push(`${subject} ${neg} ${verb} ${object} ${prep} ${target}`);
      }
    }
  }

  const unique = Array.from(new Set(samples));
  if (purposePartIndex === null) return unique;
  return unique.filter((_, idx) => idx % PURPOSE_PARTS === purposePartIndex);
}

function buildAboutSamplesEs(
  subjectSamples: string[],
  aboutPartIndex: number | null
): string[] {
  const baseSubjects = ["yo", "tú", "él", "ella", "nosotros", "nosotras", "ellos", "ellas"];
  const multiSubjects = subjectSamples.filter(
    (sample) =>
      sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
  );
  const subjects = Array.from(new Set([...baseSubjects, ...multiSubjects.slice(0, 8)]));
  const targets = ABOUT_TARGETS_ES;
  const pronouns = ABOUT_PRONOUNS_ES;
  const possessors = ABOUT_POSSESSORS_ES;
  const samples: string[] = [];

  for (const prep of ABOUT_PREP_ES) {
    const isVerbForm = prep.startsWith("se ");
    if (isVerbForm) {
      for (const target of targets) {
        samples.push(`${prep} ${target}`);
        for (const possessor of possessors) {
          samples.push(`${prep} ${target} ${possessor}`);
        }
      }
      for (const pronoun of pronouns) {
        samples.push(`${prep} ${pronoun}`);
      }
      continue;
    }
    for (const subject of subjects) {
      const verb = pickComerForm(subject);
      for (const target of targets) {
        samples.push(`${subject} ${verb} ${prep} ${target}`);
        samples.push(`${subject} no ${verb} ${prep} ${target}`);
        for (const possessor of possessors) {
          samples.push(`${subject} ${verb} ${prep} ${target} ${possessor}`);
          samples.push(`${subject} no ${verb} ${prep} ${target} ${possessor}`);
        }
      }
      for (const pronoun of pronouns) {
        samples.push(`${subject} ${verb} ${prep} ${pronoun}`);
        samples.push(`${subject} no ${verb} ${prep} ${pronoun}`);
      }
    }
  }

  const unique = Array.from(new Set(samples));
  if (aboutPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % ABOUT_PARTS === aboutPartIndex);
}

function buildAboutSamplesEn(
  subjectSamples: string[],
  aboutPartIndex: number | null
): string[] {
  const baseSubjects = ["i", "you", "he", "she", "we", "they"];
  const multiSubjects = subjectSamples.filter(
    (sample) => sample.includes(" and ") || sample.includes(",")
  );
  const subjects = Array.from(new Set([...baseSubjects, ...multiSubjects.slice(0, 8)]));
  const targets = ABOUT_TARGETS_EN;
  const pronouns = ABOUT_PRONOUNS_EN;
  const possessors = ABOUT_POSSESSORS_EN;
  const verbLeads = new Set([
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "will",
    "would",
    "has",
    "have",
    "had",
    "won't",
    "wouldn't",
    "isn't",
    "aren't",
    "wasn't",
    "weren't",
    "hasn't",
    "haven't",
    "hadn't",
    "it's",
    "that's",
    "this",
    "that",
    "these",
    "those",
  ]);
  const samples: string[] = [];

  for (const prep of ABOUT_PREP_EN) {
    const first = prep.split(" ")[0] ?? "";
    const isVerbForm = verbLeads.has(first);
    if (isVerbForm) {
      for (const target of targets) {
        samples.push(`${prep} ${target}`);
        for (const possessor of possessors) {
          samples.push(`${prep} ${target} ${possessor}`);
        }
      }
      for (const pronoun of pronouns) {
        samples.push(`${prep} ${pronoun}`);
      }
      continue;
    }
    for (const subject of subjects) {
      const verb = pickEatForm(subject);
      const neg = isThirdSingEn(subject) ? "doesn't" : "don't";
      for (const target of targets) {
        samples.push(`${subject} ${verb} ${prep} ${target}`);
        samples.push(`${subject} ${neg} ${verb} ${prep} ${target}`);
        for (const possessor of possessors) {
          samples.push(`${subject} ${verb} ${prep} ${target} ${possessor}`);
          samples.push(`${subject} ${neg} ${verb} ${prep} ${target} ${possessor}`);
        }
      }
      for (const pronoun of pronouns) {
        samples.push(`${subject} ${verb} ${prep} ${pronoun}`);
        samples.push(`${subject} ${neg} ${verb} ${prep} ${pronoun}`);
      }
    }
  }

  const unique = Array.from(new Set(samples));
  if (aboutPartIndex === null) return unique;
  return unique.filter((_, idx) => idx % ABOUT_PARTS === aboutPartIndex);
}

function buildUwuyDemoSamplesEs(): string[] {
  return Array.from(
    new Set([
      "se trata de eso",
      "se trata de ese glorp",
      "se trata de ese accidente",
      "yo como sobre eso",
      "yo como sobre ese glorp",
    ])
  );
}

function buildUwuyDemoSamplesEn(): string[] {
  return Array.from(
    new Set([
      "that is about that",
      "it is about that",
      "that is about that glorp",
      "i eat about that",
      "i eat about that glorp",
    ])
  );
}

function buildCauseVerbSamplesEs(): string[] {
  return Array.from(
    new Set([
      "yo fui por comer el pescado",
      "yo fui por comer la mujer",
      "yo fui por comerla",
      "yo fui por ir",
    ])
  );
}

function buildCauseVerbSamplesEn(): string[] {
  return Array.from(
    new Set([
      "i went because of eating the fish",
      "i went because of eating the woman",
      "i went because of eating her",
      "i went because of going",
    ])
  );
}

function buildActVerbSamplesEs(): string[] {
  return Array.from(
    new Set([
      "yo como la comida en el acto de beber",
      "yo bebo agua mientras como el pescado",
      "yo bebo agua al comer",
      "yo bebo agua durante comerla",
    ])
  );
}

function buildActVerbSamplesEn(): string[] {
  return Array.from(
    new Set([
      "i eat the food in the act of drinking",
      "i drink water while eating the fish",
      "i drink water during eating her",
      "i drink water while eating",
    ])
  );
}

function buildCauseAgentSamplesEs(): string[] {
  return Array.from(
    new Set([
      "yo fui por comer por mí",
      "yo fui por comer por stephen",
      "yo fui por comer por ella",
    ])
  );
}

function buildCauseAgentSamplesEn(): string[] {
  return Array.from(
    new Set([
      "i went because of eating by me",
      "i went because of eating by stephen",
      "i went because of eating by her",
    ])
  );
}

function buildVerbalNounSamplesEs(): string[] {
  return Array.from(
    new Set([
      "mi comida",
      "tu comida",
      "la comida de stephen",
      "la comida de ella",
      "mi bebida",
      "el consumo de ellos",
      "el viaje de nosotros",
    ])
  );
}

function buildVerbalNounSamplesEn(): string[] {
  return Array.from(
    new Set([
      "my food",
      "your food",
      "the food of stephen",
      "the food of her",
      "my drink",
      "the consumption of them",
      "the journey of us",
    ])
  );
}

function buildParticipleAdjSamplesEs(): string[] {
  return Array.from(
    new Set([
      "un pez comido",
      "una comida consumida",
      "el pescado comido",
      "la comida comido",
      "comida consumida con agua",
      "comida consumida por ella",
      "comida consumida por glorp",
      "agua bebida por ellos",
    ])
  );
}

function buildParticipleAdjSamplesEn(): string[] {
  return Array.from(
    new Set([
      "an eaten fish",
      "the consumed food",
      "the eaten fish",
      "food consumed with water",
      "food consumed by her",
      "food consumed by glorp",
      "water drunk by them",
    ])
  );
}

function buildEnVerbChainSamples(): string[] {
  const samples = new Set<string>();
  const objectsFull = buildEnObjectVariants();

  for (const subject of EN_CHAIN_SUBJECTS) {
    const verb = pickEatForm(subject);
    for (const inf of EN_CHAIN_INFINITIVES) {
      samples.add(`${subject} ${verb} to ${inf}`);
      for (const obj of objectsFull) {
        samples.add(`${subject} ${verb} ${obj} to ${inf}`);
      }
    }
  }

  for (const aux of EN_CHAIN_AUX) {
    for (const inf of EN_CHAIN_INFINITIVES) {
      samples.add(`${aux} ${EN_CHAIN_GERUND} to ${inf}`);
      for (const obj of objectsFull) {
        samples.add(`${aux} ${EN_CHAIN_GERUND} ${obj} to ${inf}`);
      }
    }
  }

  return Array.from(samples);
}

function buildObjectVariants(
  objects: string[],
  mode: LanguageMode
): string[] {
  const separator = mode === "es" ? " y " : " and ";
  const variants: string[] = [];
  if (objects.length === 0) return variants;
  if (objects.length === 1) return [objects[0]];
  variants.push(objects.join(separator));
  variants.push(objects.join(", "));
  if (objects.length > 2) {
    const last = objects[objects.length - 1];
    const leading = objects.slice(0, -1).join(", ");
    variants.push(`${leading}${separator}${last}`);
  }
  return Array.from(new Set(variants));
}

function buildObjectConnectorVariants(
  objects: string[],
  mode: LanguageMode
): string[] {
  const connectors = mode === "es" ? ES_LIST_CONNECTORS : EN_LIST_CONNECTORS;
  const variants = new Set<string>();
  if (objects.length < 2) return [];
  const [first, second, third] = objects;
  for (const connector of connectors) {
    variants.add(`${first} ${connector} ${second}`);
    if (third) {
      variants.add(`${first}, ${second} ${connector} ${third}`);
      variants.add(`${first} ${connector} ${second} ${connector} ${third}`);
    }
  }
  return Array.from(variants);
}

function pickComerForm(sample: string): string {
  return COMER_PRESENT_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickIrForm(sample: string): string {
  return IR_PRESENT_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickComerPastSimple(sample: string): string {
  return COMER_PRETERITE_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickComerPastContinuous(sample: string): string {
  return COMER_IMPERFECT_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickComerFutureForm(sample: string): string {
  return COMER_FUTURE_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickEstarFutureForm(sample: string): string {
  return ESTAR_FUTURE_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickEstarPresentForm(sample: string): string {
  return ESTAR_PRESENT_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickSerPresentForm(sample: string): string {
  return SER_PRESENT_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickSerPreteriteForm(sample: string): string {
  return SER_PRETERITE_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickSerImperfectForm(sample: string): string {
  return SER_IMPERFECT_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickSerFutureForm(sample: string): string {
  return SER_FUTURE_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickTenerPresentForm(sample: string): string {
  return TENER_PRESENT_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickEstarPreteriteForm(sample: string): string {
  return ESTAR_PRETERITE_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickEstarImperfectForm(sample: string): string {
  return ESTAR_IMPERFECT_FORMS_ES[pickSpanishPersonIndex(sample)];
}

function pickModalFormEs(sample: string, forms: string[]): string {
  return forms[pickSpanishPersonIndex(sample)];
}

function pickSpanishPersonIndex(sample: string): number {
  const tokens = tokenizeSample(sample, "es");
  const hasFirstSing = tokens.some((token) => ES_FIRST_SING.has(token));
  const hasFirstPlural = tokens.some((token) => ES_FIRST_PLUR.has(token));
  const hasSecondPlural = tokens.some((token) => ES_SECOND_PLURAL.has(token));
  const hasSecondSing = tokens.some((token) => ES_SECOND_SING.has(token));
  const hasThirdSing = tokens.some((token) => ES_THIRD_SING.has(token));
  const hasThirdPlural = tokens.some((token) => ES_THIRD_PLURAL.has(token));
  const hasConjunction = tokens.includes("y");
  const nonConjunctionTokens = tokens.filter((token) => token !== "y");
  const pronounCount = tokens.filter((token) => ES_SUBJECTS.has(token)).length;
  const hasGroup = tokens.some((token) => ES_GROUP_MARKERS.has(token));
  const hasNonPronounSubject = tokens.some(
    (token) => token !== "y" && !ES_SUBJECTS.has(token)
  );

  if (hasFirstPlural) return 3;
  if (hasFirstSing) {
    if (
      pronounCount > 1 ||
      hasGroup ||
      hasConjunction ||
      hasNonPronounSubject ||
      nonConjunctionTokens.length > 1
    ) {
      return 3;
    }
    return 0;
  }
  if (hasSecondPlural) return 4;
  if (
    hasSecondSing &&
    (pronounCount > 1 ||
      hasGroup ||
      hasConjunction ||
      hasNonPronounSubject ||
      nonConjunctionTokens.length > 1)
  ) {
    return 4;
  }
  if (!hasConjunction && pronounCount <= 1) {
    if (hasSecondSing) return 1;
    if (hasThirdSing) return 2;
  }
  if (hasNonPronounSubject && nonConjunctionTokens.length === 1) return 2;
  if (
    hasThirdPlural ||
    hasSecondSing ||
    hasThirdSing ||
    hasConjunction ||
    pronounCount > 1 ||
    hasGroup
  ) {
    return 5;
  }
  return 5;
}

function pickEatForm(sample: string): string {
  const tokens = tokenizeSample(sample, "en");
  const isThirdSing =
    tokens.length === 1 &&
    tokens[0] !== "i" &&
    tokens[0] !== "you" &&
    tokens[0] !== "we" &&
    tokens[0] !== "they";
  return isThirdSing ? "eats" : "eat";
}

function pickGoForm(sample: string): string {
  return isThirdSingEn(sample) ? "goes" : "go";
}

function isThirdSingEn(sample: string): boolean {
  const tokens = tokenizeSample(sample, "en");
  return (
    tokens.length === 1 &&
    tokens[0] !== "i" &&
    tokens[0] !== "you" &&
    tokens[0] !== "we" &&
    tokens[0] !== "they"
  );
}

function pickModalFormEn(sample: string, forms: [string, string]): string {
  return isThirdSingEn(sample) ? forms[1] : forms[0];
}

function pickCopulaEn(sample: string): string {
  const tokens = tokenizeSample(sample, "en");
  if (tokens.length === 1 && tokens[0] === "i") return "am";
  if (isThirdSingEn(sample)) return "is";
  return "are";
}

function pickCopulaPastEn(sample: string): string {
  const tokens = tokenizeSample(sample, "en");
  if (tokens.length === 1) {
    const token = tokens[0];
    if (token === "i" || token === "he" || token === "she" || token === "it") {
      return "was";
    }
  }
  return "were";
}

function pickHaveEn(sample: string): string {
  return isThirdSingEn(sample) ? "has" : "have";
}

function pickModalNegatorEn(sample: string): string {
  return isThirdSingEn(sample) ? "doesn't" : "don't";
}

function pickEatPastSimple(): string {
  return EAT_PAST_SIMPLE_EN;
}

function pickEatPastContinuous(sample: string): string {
  const tokens = tokenizeSample(sample, "en");
  if (tokens.length === 1) {
    const token = tokens[0];
    if (token === "i" || token === "he" || token === "she" || token === "it") {
      return EAT_PAST_CONTINUOUS_SING;
    }
  }
  return EAT_PAST_CONTINUOUS_PLUR;
}

function pickEatPastSimpleNegative(): string {
  return EAT_PAST_SIMPLE_NEG;
}

function pickEatPastContinuousNegative(sample: string): string {
  const tokens = tokenizeSample(sample, "en");
  if (tokens.length === 1) {
    const token = tokens[0];
    if (token === "i" || token === "he" || token === "she" || token === "it") {
      return EAT_PAST_CONTINUOUS_NEG_SING;
    }
  }
  return EAT_PAST_CONTINUOUS_NEG_PLUR;
}

function pickEatNegative(sample: string): string {
  const tokens = tokenizeSample(sample, "en");
  const isThirdSing =
    tokens.length === 1 &&
    (tokens[0] === "he" || tokens[0] === "she" || tokens[0] === "it");
  return isThirdSing ? "doesn't eat" : "don't eat";
}

const MULTI_OD_PARTS = 5;
const PAST_PARTS = 5;
const FUTURE_PARTS = 5;
const MODAL_PARTS = 5;
const MAKE_PARTS = 3;
const BECOME_PARTS = 5;
const HAVE_PARTS = 3;
const POSSESSION_PARTS = 3;
const COPULA_PARTS = 5;
const LOCATIVE_PARTS = 3;
const ALLATIVE_PARTS = 3;
const ABLATIVE_PARTS = 3;
const TRAVERSE_PARTS = 3;
const COMITATIVE_PARTS = 3;
const INSTRUMENTAL_PARTS = 3;
const PURPOSE_PARTS = 3;
const ABOUT_PARTS = 3;
const ORIGIN_PARTS = 3;

function getMultiOdPartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^multi-od-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > MULTI_OD_PARTS) return null;
  return value - 1;
}

function getPastPartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^past-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > PAST_PARTS) return null;
  return value - 1;
}

function getFuturePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^future-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > FUTURE_PARTS) return null;
  return value - 1;
}

function getModalPartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^modal-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > MODAL_PARTS) return null;
  return value - 1;
}

function getMakePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^make-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > MAKE_PARTS) return null;
  return value - 1;
}

function getBecomePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^become-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > BECOME_PARTS) return null;
  return value - 1;
}

function getHavePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^have-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > HAVE_PARTS) return null;
  return value - 1;
}

function getPossessionPartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^possession-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > POSSESSION_PARTS) return null;
  return value - 1;
}

function getCopulaPartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^copula-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > COPULA_PARTS) return null;
  return value - 1;
}

function getLocativePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^locative-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > LOCATIVE_PARTS) return null;
  return value - 1;
}

function getAllativePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^allative-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > ALLATIVE_PARTS) return null;
  return value - 1;
}

function getAblativePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^ablative-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > ABLATIVE_PARTS) return null;
  return value - 1;
}

function getTraversivePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^traversive-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > TRAVERSE_PARTS) return null;
  return value - 1;
}

function getComitativePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^comitative-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > COMITATIVE_PARTS) return null;
  return value - 1;
}

function getInstrumentalPartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^instrumental-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > INSTRUMENTAL_PARTS)
    return null;
  return value - 1;
}

function getPurposePartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^purpose-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > PURPOSE_PARTS) return null;
  return value - 1;
}

function getAboutPartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^about-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > ABOUT_PARTS) return null;
  return value - 1;
}

function getOriginPartIndex(section: DevSampleSection): number | null {
  const match = section.match(/^origin-(\d)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 1 || value > ORIGIN_PARTS) return null;
  return value - 1;
}

export function isDevSampleTrigger(input: string): boolean {
  return input.trim().toLowerCase().replace(/\s+/g, " ") === DEV_SAMPLE_TRIGGER;
}

export function getDevSampleList(
  mode: LanguageMode,
  section: DevSampleSection = "all"
): string[] {
  const base = DEV_SAMPLE_BASE[mode] ?? [];
  if (mode === "es") {
  const subjects = [
    "yo",
    "tú",
    "él",
    "ella",
    "ello",
    "nosotros",
    "nosotras",
    "ustedes",
    "vosotros",
    "vosotras",
    "ellos",
    "ellas",
  ];
    const groups = [
      "los demás",
      "las demás",
      "los otros",
      "las otras",
      "los otros dos",
      "las otras dos",
      "los dos otros",
      "las dos otras",
    ];
    const generated = [
      ...generateTripleCombinations(subjects, " y "),
      ...generateGroupCombinations(subjects, groups, " y "),
    ];
    const extraSubjects = section === "subjects" ? EXTRA_SUBJECTS_ES : [];
    const subjectSamples = expandSamples(
      [...base, ...generated, ...extraSubjects],
      mode
    );
    if (section === "modal-possessive") {
      return buildModalPossessiveSamplesEs();
    }
    if (section === "modal-infinitive-possessive") {
      return buildModalInfinitivePossessiveSamplesEs();
    }
    if (section === "modal" || section.startsWith("modal-")) {
      const modalPartIndex = getModalPartIndex(section);
      return buildModalSamplesEs(subjectSamples, modalPartIndex);
    }
    if (section === "make" || section.startsWith("make-")) {
      const makePartIndex = getMakePartIndex(section);
      return buildMakeSamplesEs(subjectSamples, makePartIndex);
    }
    if (section === "become" || section.startsWith("become-")) {
      const becomePartIndex = getBecomePartIndex(section);
      return buildBecomeSamplesEs(subjectSamples, becomePartIndex);
    }
    if (section === "have" || section.startsWith("have-")) {
      const havePartIndex = getHavePartIndex(section);
      return buildHaveSamplesEs(subjectSamples, havePartIndex);
    }
    if (section === "possession" || section.startsWith("possession-")) {
      const possessionPartIndex = getPossessionPartIndex(section);
      return buildPossessionSamplesEs(possessionPartIndex);
    }
    if (section === "demo-intransitive") {
      return buildDemoIntransitiveSamplesEs();
    }
    if (section === "dhiyaki") {
      return buildDhiyakiSamplesEs();
    }
    if (section === "agent") {
      return buildAgentSamplesEs();
    }
    if (section === "imperative-lets") {
      return buildLetsImperativeSamplesEs();
    }
    if (section === "imperative-neg") {
      return buildImperativeNegSamplesEs();
    }
    if (section === "subject-emphasis") {
      return buildSubjectEmphasisSamplesEs();
    }
    if (section === "object-emphasis") {
      return buildObjectEmphasisSamplesEs();
    }
    if (section === "possessive-emphasis") {
      return buildPossessiveEmphasisSamplesEs();
    }
    if (section === "possessive-reflexive") {
      return buildPossessiveReflexiveSamplesEs();
    }
    if (section === "comitative-allative-emphasis") {
      return buildComitativeAllativeEmphasisSamplesEs();
    }
    if (section === "possessive-gala-emphasis") {
      return buildPossessiveGalaEmphasisSamplesEs();
    }
    if (section === "pronoun-emphasis-extended") {
      return buildExtendedPronounEmphasisSamplesEs();
    }
    if (section === "copula" || section.startsWith("copula-")) {
      const copulaPartIndex = getCopulaPartIndex(section);
      return buildCopulaSamplesEs(subjectSamples, copulaPartIndex);
    }
    if (section === "locative-all") {
      return Array.from(
        new Set([
          ...buildLocativeSamplesEs(subjectSamples, null),
          ...buildAllativeSamplesEs(subjectSamples, null),
          ...buildAblativeSamplesEs(subjectSamples, null),
        ])
      );
    }
    if (section === "locative" || section.startsWith("locative-")) {
      const locativePartIndex = getLocativePartIndex(section);
      return buildLocativeSamplesEs(subjectSamples, locativePartIndex);
    }
    if (section === "allative" || section.startsWith("allative-")) {
      const allativePartIndex = getAllativePartIndex(section);
      return buildAllativeSamplesEs(subjectSamples, allativePartIndex);
    }
    if (section === "ablative-demo") {
      return buildAblativeDemoSamplesEs();
    }
    if (section === "ablative" || section.startsWith("ablative-")) {
      const ablativePartIndex = getAblativePartIndex(section);
      return buildAblativeSamplesEs(subjectSamples, ablativePartIndex);
    }
    if (section === "traversive-possessive-emphatic") {
      return buildTraversivePossessiveEmphaticSamplesEs();
    }
    if (section === "reflexive-object") {
      return buildReflexiveObjectSamplesEs();
    }
    if (section === "traversive" || section.startsWith("traversive-")) {
      const traversivePartIndex = getTraversivePartIndex(section);
      return buildTraversiveSamplesEs(subjectSamples, traversivePartIndex);
    }
    if (section === "simultaneous") {
      return buildSimultaneousSamplesEs(subjectSamples);
    }
    if (section === "near-future") {
      return buildNearFutureSamplesEs();
    }
    if (section === "habitual") {
      return buildHabitualSamplesEs();
    }
    if (section === "might") {
      return buildMightSamplesEs();
    }
    if (section === "should") {
      return buildShouldSamplesEs();
    }
    if (section === "should-have") {
      return buildShouldHaveSamplesEs();
    }
    if (section === "past-habitual") {
      return buildPastHabitualSamplesEs();
    }
    if (section === "origin" || section.startsWith("origin-")) {
      const originPartIndex = getOriginPartIndex(section);
      return buildOriginSamplesEs(subjectSamples, originPartIndex);
    }
    if (section === "comitative-demo") {
      return buildComitativeDemoSamplesEs();
    }
    if (section === "comitative" || section.startsWith("comitative-")) {
      const comitativePartIndex = getComitativePartIndex(section);
      return buildComitativeSamplesEs(subjectSamples, comitativePartIndex);
    }
    if (section === "instrumental" || section.startsWith("instrumental-")) {
      const instrumentalPartIndex = getInstrumentalPartIndex(section);
      return buildInstrumentalSamplesEs(subjectSamples, instrumentalPartIndex);
    }
    if (section === "purpose" || section.startsWith("purpose-")) {
      const purposePartIndex = getPurposePartIndex(section);
      return buildPurposeSamplesEs(subjectSamples, purposePartIndex);
    }
    if (section === "about" || section.startsWith("about-")) {
      const aboutPartIndex = getAboutPartIndex(section);
      return buildAboutSamplesEs(subjectSamples, aboutPartIndex);
    }
    if (section === "cause-verb") {
      return buildCauseVerbSamplesEs();
    }
    if (section === "act-verb") {
      return buildActVerbSamplesEs();
    }
    if (section === "cause-agent") {
      return buildCauseAgentSamplesEs();
    }
    if (section === "verbal-noun") {
      return buildVerbalNounSamplesEs();
    }
    if (section === "participle-adj") {
      return buildParticipleAdjSamplesEs();
    }
    if (section === "uwuy-demo") {
      return buildUwuyDemoSamplesEs();
    }
    if (section === "past" || section.startsWith("past-")) {
      const pastPartIndex = getPastPartIndex(section);
      const pastSubjects =
        pastPartIndex === null
          ? subjectSamples
          : subjectSamples.filter(
              (_sample, idx) => idx % PAST_PARTS === pastPartIndex
            );
      const pastSamples: string[] = [];
      const pastSimple = pastSubjects.map(
        (sample) => `${sample} ${pickComerPastSimple(sample)}`
      );
      const pastContinuous = pastSubjects.map(
        (sample) => `${sample} ${pickComerPastContinuous(sample)}`
      );
      const pastSimpleNeg = pastSubjects.map(
        (sample) => `${sample} no ${pickComerPastSimple(sample)}`
      );
      const pastContinuousNeg = pastSubjects.map(
        (sample) => `${sample} no ${pickComerPastContinuous(sample)}`
      );
      const pastSimpleYesterday = pastSubjects.map(
        (sample) => `ayer ${sample} ${pickComerPastSimple(sample)}`
      );
      const pastContinuousYesterday = pastSubjects.map(
        (sample) => `ayer ${sample} ${pickComerPastContinuous(sample)}`
      );
      const pastSimpleYesterdayNeg = pastSubjects.map(
        (sample) => `ayer ${sample} no ${pickComerPastSimple(sample)}`
      );
      const pastContinuousYesterdayNeg = pastSubjects.map(
        (sample) => `ayer ${sample} no ${pickComerPastContinuous(sample)}`
      );
      const pastSimpleToday = pastSubjects.map(
        (sample) => `hoy ${sample} ${pickComerPastSimple(sample)}`
      );
      const pastContinuousToday = pastSubjects.map(
        (sample) => `hoy ${sample} ${pickComerPastContinuous(sample)}`
      );
      const pastSimpleTodayNeg = pastSubjects.map(
        (sample) => `hoy ${sample} no ${pickComerPastSimple(sample)}`
      );
      const pastContinuousTodayNeg = pastSubjects.map(
        (sample) => `hoy ${sample} no ${pickComerPastContinuous(sample)}`
      );
      const pastSimpleYesterdayTail = pastSubjects.map(
        (sample) => `${sample} ${pickComerPastSimple(sample)} ayer`
      );
      const pastContinuousYesterdayTail = pastSubjects.map(
        (sample) => `${sample} ${pickComerPastContinuous(sample)} ayer`
      );
      const pastSimpleYesterdayTailNeg = pastSubjects.map(
        (sample) => `${sample} no ${pickComerPastSimple(sample)} ayer`
      );
      const pastContinuousYesterdayTailNeg = pastSubjects.map(
        (sample) => `${sample} no ${pickComerPastContinuous(sample)} ayer`
      );

      const objectPast: string[] = [];
      const objectPastNeg: string[] = [];
      const objectPastMulti: string[] = [];
      const objectPastMultiNeg: string[] = [];
      for (const subject of subjects) {
        const verbSimple = pickComerPastSimple(subject);
        const verbCont = pickComerPastContinuous(subject);
        for (const obj of ES_OBJECT_PRONOUNS) {
          objectPast.push(`${subject} ${verbSimple} ${obj}`);
          objectPast.push(`${subject} ${verbCont} ${obj}`);
          objectPastNeg.push(`${subject} no ${verbSimple} ${obj}`);
          objectPastNeg.push(`${subject} no ${verbCont} ${obj}`);
        }
        for (const obj of ES_OBJECT_A_PRONOUNS) {
          objectPast.push(`${subject} ${verbSimple} ${obj}`);
          objectPast.push(`${subject} ${verbCont} ${obj}`);
          objectPastNeg.push(`${subject} no ${verbSimple} ${obj}`);
          objectPastNeg.push(`${subject} no ${verbCont} ${obj}`);
        }
        for (const noun of ES_OBJECT_NOUNS) {
          objectPast.push(`${subject} ${verbSimple} ${noun}`);
          objectPast.push(`${subject} ${verbCont} ${noun}`);
          objectPastNeg.push(`${subject} no ${verbSimple} ${noun}`);
          objectPastNeg.push(`${subject} no ${verbCont} ${noun}`);
          for (const art of ["el", "la", "los", "las"]) {
            objectPast.push(`${subject} ${verbSimple} ${art} ${noun}`);
            objectPast.push(`${subject} ${verbCont} ${art} ${noun}`);
            objectPastNeg.push(`${subject} no ${verbSimple} ${art} ${noun}`);
            objectPastNeg.push(`${subject} no ${verbCont} ${art} ${noun}`);
          }
          for (const art of ["un", "una", "unos", "unas"]) {
            objectPast.push(`${subject} ${verbSimple} ${art} ${noun}`);
            objectPast.push(`${subject} ${verbCont} ${art} ${noun}`);
            objectPastNeg.push(`${subject} no ${verbSimple} ${art} ${noun}`);
            objectPastNeg.push(`${subject} no ${verbCont} ${art} ${noun}`);
          }
        }
      }
      for (const subject of subjects) {
        const verbSimple = pickComerPastSimple(subject);
        const verbCont = pickComerPastContinuous(subject);
        for (const def of ["el", "la", "los", "las"]) {
          for (const indef of ["un", "una", "unos", "unas"]) {
            for (const noun of ES_OBJECT_NOUNS) {
              objectPast.push(
                `${subject} ${verbSimple} ${def} ${noun} y ${indef} ${noun}`
              );
              objectPast.push(
                `${subject} ${verbCont} ${def} ${noun} y ${indef} ${noun}`
              );
              objectPast.push(
                `${subject} ${verbSimple} ${indef} ${noun} y ${def} ${noun}`
              );
              objectPast.push(
                `${subject} ${verbCont} ${indef} ${noun} y ${def} ${noun}`
              );
              objectPastNeg.push(
                `${subject} no ${verbSimple} ${def} ${noun} y ${indef} ${noun}`
              );
              objectPastNeg.push(
                `${subject} no ${verbCont} ${def} ${noun} y ${indef} ${noun}`
              );
              objectPastNeg.push(
                `${subject} no ${verbSimple} ${indef} ${noun} y ${def} ${noun}`
              );
              objectPastNeg.push(
                `${subject} no ${verbCont} ${indef} ${noun} y ${def} ${noun}`
              );
            }
          }
        }
      }
      const multiSubjectSamples = pastSubjects.filter(
        (sample) =>
          sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
      );
      const pastMultiSubjects =
        pastPartIndex === null
          ? multiSubjectSamples.slice(0, 24)
          : multiSubjectSamples.filter(
              (_sample, idx) => idx % PAST_PARTS === pastPartIndex
            );
      const sequences2: string[][] = [
        ["lo", "a alguien"],
        ["la", "accidente"],
        ["los", "a alguien"],
        ["las", "glorp"],
        ["me", "a alguien"],
        ["nos", "accidente"],
        ["a él", "a alguien"],
        ["a ella", "accidente"],
        ["a ellos", "glorp"],
        ["a alguien", "accidente"],
        ["glorp", "a alguien"],
        ["glorp", "accidente"],
      ];
      const sequences3: string[][] = [
        ["lo", "a alguien", "accidente"],
        ["la", "glorp", "a alguien"],
      ];
      const pastSequences2 =
        pastPartIndex === null
          ? sequences2
          : sequences2.filter((_seq, idx) => idx % PAST_PARTS === pastPartIndex);
      const pastSequences3 =
        pastPartIndex === null
          ? sequences3
          : sequences3.filter((_seq, idx) => idx % PAST_PARTS === pastPartIndex);
      for (const subject of pastMultiSubjects) {
        const verbSimple = pickComerPastSimple(subject);
        const verbCont = pickComerPastContinuous(subject);
        for (const sequence of pastSequences2) {
          for (const variant of buildObjectVariants(sequence, "es")) {
            objectPastMulti.push(`${subject} ${verbSimple} ${variant}`);
            objectPastMulti.push(`${subject} ${verbCont} ${variant}`);
            objectPastMultiNeg.push(`${subject} no ${verbSimple} ${variant}`);
            objectPastMultiNeg.push(`${subject} no ${verbCont} ${variant}`);
          }
        }
        for (const sequence of pastSequences3) {
          for (const variant of buildObjectVariants(sequence, "es")) {
            objectPastMulti.push(`${subject} ${verbSimple} ${variant}`);
            objectPastMulti.push(`${subject} ${verbCont} ${variant}`);
            objectPastMultiNeg.push(`${subject} no ${verbSimple} ${variant}`);
            objectPastMultiNeg.push(`${subject} no ${verbCont} ${variant}`);
          }
        }
      }

      pastSamples.push(
        ...pastSimple,
        ...pastContinuous,
        ...pastSimpleNeg,
        ...pastContinuousNeg,
        ...pastSimpleYesterday,
        ...pastContinuousYesterday,
        ...pastSimpleYesterdayNeg,
        ...pastContinuousYesterdayNeg,
        ...pastSimpleToday,
        ...pastContinuousToday,
        ...pastSimpleTodayNeg,
        ...pastContinuousTodayNeg,
        ...pastSimpleYesterdayTail,
        ...pastContinuousYesterdayTail,
        ...pastSimpleYesterdayTailNeg,
        ...pastContinuousYesterdayTailNeg,
        ...objectPast,
        ...objectPastNeg,
        ...objectPastMulti,
        ...objectPastMultiNeg
      );

      return Array.from(new Set(pastSamples));
    }
    if (section === "future" || section.startsWith("future-")) {
      const futurePartIndex = getFuturePartIndex(section);
      const futureSubjects =
        futurePartIndex === null
          ? subjectSamples
          : subjectSamples.filter(
              (_sample, idx) => idx % FUTURE_PARTS === futurePartIndex
            );
      const futureSamples: string[] = [];
      const futureSimple = futureSubjects.map(
        (sample) => `${sample} ${pickComerFutureForm(sample)}`
      );
      const futureSimpleNeg = futureSubjects.map(
        (sample) => `${sample} no ${pickComerFutureForm(sample)}`
      );
      const futureSimpleToday = futureSubjects.map(
        (sample) => `hoy ${sample} ${pickComerFutureForm(sample)}`
      );
      const futureSimpleTomorrow = futureSubjects.map(
        (sample) => `mañana ${sample} ${pickComerFutureForm(sample)}`
      );
      const futureSimpleTomorrowTail = futureSubjects.map(
        (sample) => `${sample} ${pickComerFutureForm(sample)} mañana`
      );
      const futureProg = futureSubjects.map(
        (sample) => `${sample} ${pickEstarFutureForm(sample)} ${ES_CHAIN_GERUND}`
      );
      const futureProgNeg = futureSubjects.map(
        (sample) =>
          `${sample} no ${pickEstarFutureForm(sample)} ${ES_CHAIN_GERUND}`
      );
      const futureProgToday = futureSubjects.map(
        (sample) =>
          `hoy ${sample} ${pickEstarFutureForm(sample)} ${ES_CHAIN_GERUND}`
      );
      const futureProgTomorrow = futureSubjects.map(
        (sample) =>
          `mañana ${sample} ${pickEstarFutureForm(sample)} ${ES_CHAIN_GERUND}`
      );

      const objectFuture: string[] = [];
      const objectFutureNeg: string[] = [];
      const objectFutureProg: string[] = [];
      const objectFutureProgNeg: string[] = [];
      for (const subject of subjects) {
        const verb = pickComerFutureForm(subject);
        const aux = pickEstarFutureForm(subject);
        for (const obj of ES_OBJECT_PRONOUNS) {
          objectFuture.push(`${subject} ${verb} ${obj}`);
          objectFutureNeg.push(`${subject} no ${verb} ${obj}`);
          objectFutureProg.push(`${subject} ${aux} ${ES_CHAIN_GERUND} ${obj}`);
          objectFutureProgNeg.push(
            `${subject} no ${aux} ${ES_CHAIN_GERUND} ${obj}`
          );
        }
        for (const obj of ES_OBJECT_A_PRONOUNS) {
          objectFuture.push(`${subject} ${verb} ${obj}`);
          objectFutureNeg.push(`${subject} no ${verb} ${obj}`);
          objectFutureProg.push(`${subject} ${aux} ${ES_CHAIN_GERUND} ${obj}`);
          objectFutureProgNeg.push(
            `${subject} no ${aux} ${ES_CHAIN_GERUND} ${obj}`
          );
        }
        for (const noun of ES_OBJECT_NOUNS) {
          objectFuture.push(`${subject} ${verb} ${noun}`);
          objectFutureNeg.push(`${subject} no ${verb} ${noun}`);
          objectFutureProg.push(`${subject} ${aux} ${ES_CHAIN_GERUND} ${noun}`);
          objectFutureProgNeg.push(
            `${subject} no ${aux} ${ES_CHAIN_GERUND} ${noun}`
          );
          for (const art of ["el", "la", "los", "las"]) {
            objectFuture.push(`${subject} ${verb} ${art} ${noun}`);
            objectFutureNeg.push(`${subject} no ${verb} ${art} ${noun}`);
          }
          for (const art of ["un", "una", "unos", "unas"]) {
            objectFuture.push(`${subject} ${verb} ${art} ${noun}`);
            objectFutureNeg.push(`${subject} no ${verb} ${art} ${noun}`);
          }
        }
      }

      futureSamples.push(
        ...futureSimple,
        ...futureSimpleNeg,
        ...futureSimpleToday,
        ...futureSimpleTomorrow,
        ...futureSimpleTomorrowTail,
        ...futureProg,
        ...futureProgNeg,
        ...futureProgToday,
        ...futureProgTomorrow,
        ...objectFuture,
        ...objectFutureNeg,
        ...objectFutureProg,
        ...objectFutureProgNeg
      );

      return Array.from(new Set(futureSamples));
    }
    const comerPresent = subjectSamples.map(
      (sample) => `${sample} ${pickComerForm(sample)}`
    );
    const comerNegative = subjectSamples.map(
      (sample) => `${sample} no ${pickComerForm(sample)}`
    );
    const objectPresent: string[] = [];
    const objectNegative: string[] = [];
    const objectPresentMulti: string[] = [];
    const objectNegativeMulti: string[] = [];
    const objectImperative: string[] = ES_OBJECT_AMBIG.map(
      (obj) => `come${obj}`
    );
    const objectCliticAttached = [
      "comelo",
      "comela",
      "comelos",
      "comelas",
      "comeme",
      "comete",
      "comenos",
      "comeos",
      "comiendolo",
      "comiendola",
      "comiendolos",
      "comiendolas",
      "comerlo",
      "comerla",
      "comerlos",
      "comerlas",
    ];
    const objectSequences2: string[][] = [
      ["lo", "a alguien"],
      ["la", "accidente"],
      ["los", "a alguien"],
      ["las", "glorp"],
      ["me", "a alguien"],
      ["nos", "accidente"],
      ["a él", "a alguien"],
      ["a ella", "accidente"],
      ["a ellos", "glorp"],
      ["a alguien", "accidente"],
      ["glorp", "a alguien"],
      ["glorp", "accidente"],
    ];
    const objectSequences3: string[][] = [
      ["lo", "a alguien", "accidente"],
      ["la", "glorp", "a alguien"],
    ];
    for (const subject of subjects) {
      const verb = pickComerForm(subject);
      for (const obj of ES_OBJECT_PRONOUNS) {
        objectPresent.push(`${subject} ${obj} ${verb}`);
        objectNegative.push(`${subject} no ${obj} ${verb}`);
      }
      for (const obj of ES_OBJECT_A_PRONOUNS) {
        objectPresent.push(`${subject} ${verb} ${obj}`);
        objectNegative.push(`${subject} no ${verb} ${obj}`);
      }
      for (const noun of ES_OBJECT_NOUNS) {
        objectPresent.push(`${subject} ${verb} ${noun}`);
        objectNegative.push(`${subject} no ${verb} ${noun}`);
        for (const art of ["el", "la", "los", "las"]) {
          objectPresent.push(`${subject} ${verb} ${art} ${noun}`);
          objectNegative.push(`${subject} no ${verb} ${art} ${noun}`);
        }
        for (const art of ["un", "una", "unos", "unas"]) {
          objectPresent.push(`${subject} ${verb} ${art} ${noun}`);
          objectNegative.push(`${subject} no ${verb} ${art} ${noun}`);
        }
      }
    }
    for (const subject of subjects) {
      const verb = pickComerForm(subject);
      for (const def of ["el", "la", "los", "las"]) {
        for (const indef of ["un", "una", "unos", "unas"]) {
          for (const noun of ES_OBJECT_NOUNS) {
            objectPresent.push(
              `${subject} ${verb} ${def} ${noun} y ${indef} ${noun}`
            );
            objectPresent.push(
              `${subject} ${verb} ${indef} ${noun} y ${def} ${noun}`
            );
            objectNegative.push(
              `${subject} no ${verb} ${def} ${noun} y ${indef} ${noun}`
            );
            objectNegative.push(
              `${subject} no ${verb} ${indef} ${noun} y ${def} ${noun}`
            );
          }
          for (let i = 0; i < ES_OBJECT_NOUNS.length; i += 1) {
            for (let j = 0; j < ES_OBJECT_NOUNS.length; j += 1) {
              if (i === j) continue;
              const nounA = ES_OBJECT_NOUNS[i];
              const nounB = ES_OBJECT_NOUNS[j];
              objectPresent.push(
                `${subject} ${verb} ${def} ${nounA} y ${indef} ${nounB}`
              );
              objectPresent.push(
                `${subject} ${verb} ${indef} ${nounA} y ${def} ${nounB}`
              );
              objectNegative.push(
                `${subject} no ${verb} ${def} ${nounA} y ${indef} ${nounB}`
              );
              objectNegative.push(
                `${subject} no ${verb} ${indef} ${nounA} y ${def} ${nounB}`
              );
            }
          }
        }
      }
    }
    const multiSubjectSamples = subjectSamples.filter(
      (sample) =>
        sample.includes(" y ") || sample.includes(",") || /dema?s|otro/.test(sample)
    );
    const multiPartIndex = getMultiOdPartIndex(section);
    const multiSubjects =
      multiPartIndex === null
        ? multiSubjectSamples
        : multiSubjectSamples.filter(
            (_subject, idx) => idx % MULTI_OD_PARTS === multiPartIndex
          );
    const sequences2 =
      multiPartIndex === null
        ? objectSequences2
        : objectSequences2.filter(
            (_sequence, idx) => idx % MULTI_OD_PARTS === multiPartIndex
          );
    const sequences3 =
      multiPartIndex === null
        ? objectSequences3
        : objectSequences3.filter(
            (_sequence, idx) => idx % MULTI_OD_PARTS === multiPartIndex
          );
    for (const subject of multiSubjects) {
      const verb = pickComerForm(subject);
      for (const sequence of sequences2) {
        for (const variant of buildObjectVariants(sequence, "es")) {
          objectPresentMulti.push(`${subject} ${verb} ${variant}`);
          objectNegativeMulti.push(`${subject} no ${verb} ${variant}`);
        }
      }
      for (const sequence of sequences3) {
        for (const variant of buildObjectVariants(sequence, "es")) {
          objectPresentMulti.push(`${subject} ${verb} ${variant}`);
          objectNegativeMulti.push(`${subject} no ${verb} ${variant}`);
        }
      }
    }
    const objectPreVerbMulti = [
      `yo lo ${pickComerForm("yo")} a alguien`,
      `yo no lo ${pickComerForm("yo")} a alguien`,
    ];
    const comerNoSubject = [...COMER_PRESENT_FORMS_ES];
    const comerImperative = [
      ...COMER_IMPERATIVE_ES,
      ...COMER_NEGATIVE_IMPERATIVE_ES,
      ...objectImperative,
    ];
    const buluNoun = ES_OBJECT_NOUNS[1] ?? ES_OBJECT_NOUNS[0] ?? "glorp";
    const buluSamples = [
      "yo como de nuevo",
      "yo no como de nuevo",
      "come de nuevo",
      `más ${buluNoun}`,
      `yo como más ${buluNoun}`,
      `yo no como más ${buluNoun}`,
    ];
    const subjectsSet = [...comerPresent, ...comerNegative];
    const subjectObjectSamples: string[] = [];
    if (section === "subjects") {
      const subjectObjectSubjects = Array.from(
        new Set([...EXTRA_SUBJECTS_ES, ...subjects])
      );
      const baseObjects = [
        ...ES_OBJECT_PRONOUNS.slice(0, 4),
        ...ES_OBJECT_A_PRONOUNS.slice(0, 2),
      ];
      const nounBase = ES_OBJECT_NOUNS[0];
      const extraObjects = [
        ...ES_OBJECT_NOUNS.slice(0, 2),
        `el ${nounBase}`,
        `un ${nounBase}`,
        "glorp",
      ];
      const objectSamples = [...baseObjects, ...extraObjects];
      for (const subject of subjectObjectSubjects) {
        const verb = pickComerForm(subject);
        for (const obj of objectSamples) {
          subjectObjectSamples.push(`${subject} ${verb} ${obj}`);
          subjectObjectSamples.push(`${subject} no ${verb} ${obj}`);
        }
      }
      for (const demo of INTRANSITIVE_DEMOS_ES_SING) {
        subjectObjectSamples.push(`${demo} va`);
        subjectObjectSamples.push(`${demo} no va`);
      }
      for (const demo of INTRANSITIVE_DEMOS_ES_PLUR) {
        subjectObjectSamples.push(`${demo} van`);
        subjectObjectSamples.push(`${demo} no van`);
      }
    }
    const objectsSet = [
      ...objectPresent,
      ...objectNegative,
      ...objectPreVerbMulti,
      ...objectCliticAttached,
      ...buildEsVerbChainSamples(),
      ...buluSamples,
    ];
    const multiOdSet = [...objectPresentMulti, ...objectNegativeMulti];
    const allSet = [
      ...subjectsSet,
      ...subjectObjectSamples,
      ...objectsSet,
      ...multiOdSet,
      ...comerNoSubject,
      ...comerImperative,
    ];
    if (section === "subjects") return [...subjectsSet, ...subjectObjectSamples];
    if (section === "objects") return objectsSet;
    if (section === "multi-od") return multiOdSet;
    if (section.startsWith("multi-od-")) return multiOdSet;
    return allSet;
  }

  const subjects = ["i", "you", "he", "she", "it", "we", "they"];
  const groups = ["the others", "others", "the rest", "the other two", "the two others"];
  const generated = [
    ...generateTripleCombinations(subjects, " and "),
    ...generateGroupCombinations(subjects, groups, " and "),
  ];
  const extraSubjects = section === "subjects" ? EXTRA_SUBJECTS_EN : [];
  const subjectSamples = expandSamples(
    [...base, ...generated, ...extraSubjects],
    mode
  );
    if (section === "modal-possessive") {
      return buildModalPossessiveSamplesEn();
    }
    if (section === "modal-infinitive-possessive") {
      return buildModalInfinitivePossessiveSamplesEn();
    }
    if (section === "modal" || section.startsWith("modal-")) {
      const modalPartIndex = getModalPartIndex(section);
      return buildModalSamplesEn(subjectSamples, modalPartIndex);
    }
  if (section === "make" || section.startsWith("make-")) {
    const makePartIndex = getMakePartIndex(section);
    return buildMakeSamplesEn(subjectSamples, makePartIndex);
  }
  if (section === "become" || section.startsWith("become-")) {
    const becomePartIndex = getBecomePartIndex(section);
    return buildBecomeSamplesEn(subjectSamples, becomePartIndex);
  }
  if (section === "have" || section.startsWith("have-")) {
    const havePartIndex = getHavePartIndex(section);
    return buildHaveSamplesEn(subjectSamples, havePartIndex);
  }
  if (section === "possession" || section.startsWith("possession-")) {
    const possessionPartIndex = getPossessionPartIndex(section);
    return buildPossessionSamplesEn(possessionPartIndex);
  }
  if (section === "demo-intransitive") {
    return buildDemoIntransitiveSamplesEn();
  }
  if (section === "dhiyaki") {
    return buildDhiyakiSamplesEn();
  }
  if (section === "agent") {
    return buildAgentSamplesEn();
  }
  if (section === "imperative-lets") {
    return buildLetsImperativeSamplesEn();
  }
  if (section === "imperative-neg") {
    return buildImperativeNegSamplesEn();
  }
  if (section === "subject-emphasis") {
    return buildSubjectEmphasisSamplesEn();
  }
  if (section === "object-emphasis") {
    return buildObjectEmphasisSamplesEn();
  }
    if (section === "possessive-emphasis") {
      return buildPossessiveEmphasisSamplesEn();
    }
    if (section === "possessive-reflexive") {
      return buildPossessiveReflexiveSamplesEn();
    }
  if (section === "comitative-allative-emphasis") {
    return buildComitativeAllativeEmphasisSamplesEn();
  }
  if (section === "possessive-gala-emphasis") {
    return buildPossessiveGalaEmphasisSamplesEn();
  }
  if (section === "pronoun-emphasis-extended") {
    return buildExtendedPronounEmphasisSamplesEn();
  }
    if (section === "copula" || section.startsWith("copula-")) {
      const copulaPartIndex = getCopulaPartIndex(section);
      return buildCopulaSamplesEn(subjectSamples, copulaPartIndex);
    }
    if (section === "locative-all") {
      return Array.from(
        new Set([
          ...buildLocativeSamplesEn(subjectSamples, null),
          ...buildAllativeSamplesEn(subjectSamples, null),
          ...buildAblativeSamplesEn(subjectSamples, null),
        ])
      );
    }
    if (section === "locative" || section.startsWith("locative-")) {
      const locativePartIndex = getLocativePartIndex(section);
      return buildLocativeSamplesEn(subjectSamples, locativePartIndex);
    }
    if (section === "allative" || section.startsWith("allative-")) {
      const allativePartIndex = getAllativePartIndex(section);
      return buildAllativeSamplesEn(subjectSamples, allativePartIndex);
    }
  if (section === "ablative-demo") {
    return buildAblativeDemoSamplesEn();
  }
  if (section === "ablative" || section.startsWith("ablative-")) {
    const ablativePartIndex = getAblativePartIndex(section);
    return buildAblativeSamplesEn(subjectSamples, ablativePartIndex);
  }
    if (section === "traversive-possessive-emphatic") {
      return buildTraversivePossessiveEmphaticSamplesEn();
    }
    if (section === "reflexive-object") {
      return buildReflexiveObjectSamplesEn();
    }
    if (section === "traversive" || section.startsWith("traversive-")) {
      const traversivePartIndex = getTraversivePartIndex(section);
      return buildTraversiveSamplesEn(subjectSamples, traversivePartIndex);
    }
  if (section === "simultaneous") {
    return buildSimultaneousSamplesEn(subjectSamples);
  }
  if (section === "near-future") {
    return buildNearFutureSamplesEn();
  }
  if (section === "habitual") {
    return buildHabitualSamplesEn();
  }
  if (section === "might") {
    return buildMightSamplesEn();
  }
  if (section === "should") {
    return buildShouldSamplesEn();
  }
  if (section === "should-have") {
    return buildShouldHaveSamplesEn();
  }
  if (section === "past-habitual") {
    return buildPastHabitualSamplesEn();
  }
  if (section === "origin" || section.startsWith("origin-")) {
    const originPartIndex = getOriginPartIndex(section);
    return buildOriginSamplesEn(subjectSamples, originPartIndex);
  }
  if (section === "comitative-demo") {
    return buildComitativeDemoSamplesEn();
  }
  if (section === "comitative" || section.startsWith("comitative-")) {
    const comitativePartIndex = getComitativePartIndex(section);
    return buildComitativeSamplesEn(subjectSamples, comitativePartIndex);
  }
  if (section === "instrumental" || section.startsWith("instrumental-")) {
    const instrumentalPartIndex = getInstrumentalPartIndex(section);
    return buildInstrumentalSamplesEn(subjectSamples, instrumentalPartIndex);
  }
  if (section === "purpose" || section.startsWith("purpose-")) {
    const purposePartIndex = getPurposePartIndex(section);
    return buildPurposeSamplesEn(subjectSamples, purposePartIndex);
  }
  if (section === "about" || section.startsWith("about-")) {
    const aboutPartIndex = getAboutPartIndex(section);
    return buildAboutSamplesEn(subjectSamples, aboutPartIndex);
  }
  if (section === "cause-verb") {
    return buildCauseVerbSamplesEn();
  }
  if (section === "act-verb") {
    return buildActVerbSamplesEn();
  }
  if (section === "cause-agent") {
    return buildCauseAgentSamplesEn();
  }
  if (section === "verbal-noun") {
    return buildVerbalNounSamplesEn();
  }
  if (section === "participle-adj") {
    return buildParticipleAdjSamplesEn();
  }
  if (section === "uwuy-demo") {
    return buildUwuyDemoSamplesEn();
  }
  if (section === "past" || section.startsWith("past-")) {
    const pastPartIndex = getPastPartIndex(section);
    const pastSubjects =
      pastPartIndex === null
        ? subjectSamples
        : subjectSamples.filter(
            (_sample, idx) => idx % PAST_PARTS === pastPartIndex
          );
    const pastSamples: string[] = [];
    const pastSimple = pastSubjects.map(
      (sample) => `${sample} ${pickEatPastSimple()}`
    );
    const pastContinuous = pastSubjects.map(
      (sample) => `${sample} ${pickEatPastContinuous(sample)}`
    );
    const pastSimpleNeg = pastSubjects.map(
      (sample) => `${sample} ${pickEatPastSimpleNegative()}`
    );
    const pastContinuousNeg = pastSubjects.map(
      (sample) => `${sample} ${pickEatPastContinuousNegative(sample)}`
    );
    const pastSimpleYesterday = pastSubjects.map(
      (sample) => `yesterday ${sample} ${pickEatPastSimple()}`
    );
    const pastContinuousYesterday = pastSubjects.map(
      (sample) => `yesterday ${sample} ${pickEatPastContinuous(sample)}`
    );
    const pastSimpleYesterdayNeg = pastSubjects.map(
      (sample) => `yesterday ${sample} ${pickEatPastSimpleNegative()}`
    );
    const pastContinuousYesterdayNeg = pastSubjects.map(
      (sample) => `yesterday ${sample} ${pickEatPastContinuousNegative(sample)}`
    );
    const pastSimpleToday = pastSubjects.map(
      (sample) => `today ${sample} ${pickEatPastSimple()}`
    );
    const pastContinuousToday = pastSubjects.map(
      (sample) => `today ${sample} ${pickEatPastContinuous(sample)}`
    );
    const pastSimpleTodayNeg = pastSubjects.map(
      (sample) => `today ${sample} ${pickEatPastSimpleNegative()}`
    );
    const pastContinuousTodayNeg = pastSubjects.map(
      (sample) => `today ${sample} ${pickEatPastContinuousNegative(sample)}`
    );
    const pastSimpleYesterdayTail = pastSubjects.map(
      (sample) => `${sample} ${pickEatPastSimple()} yesterday`
    );
    const pastContinuousYesterdayTail = pastSubjects.map(
      (sample) => `${sample} ${pickEatPastContinuous(sample)} yesterday`
    );
    const pastSimpleYesterdayTailNeg = pastSubjects.map(
      (sample) => `${sample} ${pickEatPastSimpleNegative()} yesterday`
    );
    const pastContinuousYesterdayTailNeg = pastSubjects.map(
      (sample) => `${sample} ${pickEatPastContinuousNegative(sample)} yesterday`
    );

    const objectPast: string[] = [];
    const objectPastNeg: string[] = [];
    const objectPastMulti: string[] = [];
    const objectPastMultiNeg: string[] = [];
    for (const subject of subjects) {
      const verbSimple = pickEatPastSimple();
      const verbCont = pickEatPastContinuous(subject);
      const verbSimpleNeg = pickEatPastSimpleNegative();
      const verbContNeg = pickEatPastContinuousNegative(subject);
      for (const obj of EN_OBJECT_PRONOUNS) {
        objectPast.push(`${subject} ${verbSimple} ${obj}`);
        objectPast.push(`${subject} ${verbCont} ${obj}`);
        objectPastNeg.push(`${subject} ${verbSimpleNeg} ${obj}`);
        objectPastNeg.push(`${subject} ${verbContNeg} ${obj}`);
      }
      for (const noun of EN_OBJECT_NOUNS) {
        objectPast.push(`${subject} ${verbSimple} ${noun}`);
        objectPast.push(`${subject} ${verbCont} ${noun}`);
        objectPastNeg.push(`${subject} ${verbSimpleNeg} ${noun}`);
        objectPastNeg.push(`${subject} ${verbContNeg} ${noun}`);
        for (const art of ["the"]) {
          objectPast.push(`${subject} ${verbSimple} ${art} ${noun}`);
          objectPast.push(`${subject} ${verbCont} ${art} ${noun}`);
          objectPastNeg.push(`${subject} ${verbSimpleNeg} ${art} ${noun}`);
          objectPastNeg.push(`${subject} ${verbContNeg} ${art} ${noun}`);
        }
        for (const art of ["a", "an"]) {
          objectPast.push(`${subject} ${verbSimple} ${art} ${noun}`);
          objectPast.push(`${subject} ${verbCont} ${art} ${noun}`);
          objectPastNeg.push(`${subject} ${verbSimpleNeg} ${art} ${noun}`);
          objectPastNeg.push(`${subject} ${verbContNeg} ${art} ${noun}`);
        }
      }
    }
    const multiSubjectSamples = pastSubjects.filter(
      (sample) =>
        sample.includes(" and ") ||
        sample.includes(",") ||
        /others|rest|other/.test(sample)
    );
    const pastMultiSubjects =
      pastPartIndex === null
        ? multiSubjectSamples.slice(0, 24)
        : multiSubjectSamples.filter(
            (_sample, idx) => idx % PAST_PARTS === pastPartIndex
          );
    const sequences2: string[][] = [
      ["him", "it"],
      ["it", "him"],
      ["him", "anyone"],
      ["anyone", "accident"],
      ["glorp", "anyone"],
      ["them", "accident"],
      ["you", "it"],
    ];
    const sequences3: string[][] = [
      ["him", "anyone", "accident"],
      ["it", "anyone", "accident"],
    ];
    const pastSequences2 =
      pastPartIndex === null
        ? sequences2
        : sequences2.filter((_seq, idx) => idx % PAST_PARTS === pastPartIndex);
    const pastSequences3 =
      pastPartIndex === null
        ? sequences3
        : sequences3.filter((_seq, idx) => idx % PAST_PARTS === pastPartIndex);
    for (const subject of pastMultiSubjects) {
      const verbSimple = pickEatPastSimple();
      const verbCont = pickEatPastContinuous(subject);
      const verbSimpleNeg = pickEatPastSimpleNegative();
      const verbContNeg = pickEatPastContinuousNegative(subject);
      for (const sequence of pastSequences2) {
        for (const variant of buildObjectVariants(sequence, "en")) {
          objectPastMulti.push(`${subject} ${verbSimple} ${variant}`);
          objectPastMulti.push(`${subject} ${verbCont} ${variant}`);
          objectPastMultiNeg.push(`${subject} ${verbSimpleNeg} ${variant}`);
          objectPastMultiNeg.push(`${subject} ${verbContNeg} ${variant}`);
        }
      }
      for (const sequence of pastSequences3) {
        for (const variant of buildObjectVariants(sequence, "en")) {
          objectPastMulti.push(`${subject} ${verbSimple} ${variant}`);
          objectPastMulti.push(`${subject} ${verbCont} ${variant}`);
          objectPastMultiNeg.push(`${subject} ${verbSimpleNeg} ${variant}`);
          objectPastMultiNeg.push(`${subject} ${verbContNeg} ${variant}`);
        }
      }
    }

    pastSamples.push(
      ...pastSimple,
      ...pastContinuous,
      ...pastSimpleNeg,
      ...pastContinuousNeg,
      ...pastSimpleYesterday,
      ...pastContinuousYesterday,
      ...pastSimpleYesterdayNeg,
      ...pastContinuousYesterdayNeg,
      ...pastSimpleToday,
      ...pastContinuousToday,
      ...pastSimpleTodayNeg,
      ...pastContinuousTodayNeg,
      ...pastSimpleYesterdayTail,
      ...pastContinuousYesterdayTail,
      ...pastSimpleYesterdayTailNeg,
      ...pastContinuousYesterdayTailNeg,
      ...objectPast,
      ...objectPastNeg,
      ...objectPastMulti,
      ...objectPastMultiNeg
    );

    return Array.from(new Set(pastSamples));
  }
  if (section === "future" || section.startsWith("future-")) {
    const futurePartIndex = getFuturePartIndex(section);
    const futureSubjects =
      futurePartIndex === null
        ? subjectSamples
        : subjectSamples.filter(
            (_sample, idx) => idx % FUTURE_PARTS === futurePartIndex
          );
    const futureSamples: string[] = [];
    const futureSimple = futureSubjects.map((sample) => `${sample} will eat`);
    const futureSimpleNeg = futureSubjects.map(
      (sample) => `${sample} will not eat`
    );
    const futureSimpleNegAlt = futureSubjects.map(
      (sample) => `${sample} won't eat`
    );
    const futureSimpleToday = futureSubjects.map(
      (sample) => `today ${sample} will eat`
    );
    const futureSimpleTomorrow = futureSubjects.map(
      (sample) => `tomorrow ${sample} will eat`
    );
    const futureSimpleTomorrowTail = futureSubjects.map(
      (sample) => `${sample} will eat tomorrow`
    );
    const futureProg = futureSubjects.map(
      (sample) => `${sample} will be eating`
    );
    const futureProgNeg = futureSubjects.map(
      (sample) => `${sample} will not be eating`
    );
    const futureProgNegAlt = futureSubjects.map(
      (sample) => `${sample} won't be eating`
    );
    const futureProgToday = futureSubjects.map(
      (sample) => `today ${sample} will be eating`
    );
    const futureProgTomorrow = futureSubjects.map(
      (sample) => `tomorrow ${sample} will be eating`
    );

    const objectFuture: string[] = [];
    const objectFutureNeg: string[] = [];
    const objectFutureProg: string[] = [];
    const objectFutureProgNeg: string[] = [];
    for (const subject of subjects) {
      for (const obj of EN_OBJECT_PRONOUNS) {
        objectFuture.push(`${subject} will eat ${obj}`);
        objectFutureNeg.push(`${subject} will not eat ${obj}`);
        objectFutureProg.push(`${subject} will be eating ${obj}`);
        objectFutureProgNeg.push(`${subject} will not be eating ${obj}`);
      }
      for (const noun of EN_OBJECT_NOUNS) {
        objectFuture.push(`${subject} will eat ${noun}`);
        objectFutureNeg.push(`${subject} will not eat ${noun}`);
        objectFutureProg.push(`${subject} will be eating ${noun}`);
        objectFutureProgNeg.push(`${subject} will not be eating ${noun}`);
        for (const art of ["the"]) {
          objectFuture.push(`${subject} will eat ${art} ${noun}`);
          objectFutureNeg.push(`${subject} will not eat ${art} ${noun}`);
        }
        for (const art of ["a", "an"]) {
          objectFuture.push(`${subject} will eat ${art} ${noun}`);
          objectFutureNeg.push(`${subject} will not eat ${art} ${noun}`);
        }
      }
    }

    futureSamples.push(
      ...futureSimple,
      ...futureSimpleNeg,
      ...futureSimpleNegAlt,
      ...futureSimpleToday,
      ...futureSimpleTomorrow,
      ...futureSimpleTomorrowTail,
      ...futureProg,
      ...futureProgNeg,
      ...futureProgNegAlt,
      ...futureProgToday,
      ...futureProgTomorrow,
      ...objectFuture,
      ...objectFutureNeg,
      ...objectFutureProg,
      ...objectFutureProgNeg
    );

    return Array.from(new Set(futureSamples));
  }
  const eatPresent = subjectSamples.map(
    (sample) => `${sample} ${pickEatForm(sample)}`
  );
  const eatNegative = subjectSamples.map(
    (sample) => `${sample} ${pickEatNegative(sample)}`
  );
  const subjectObjectSamples: string[] = [];
  if (section === "subjects") {
    const subjectObjectSubjects = Array.from(
      new Set([...EXTRA_SUBJECTS_EN, ...subjects])
    );
    const baseObjects = [...EN_OBJECT_PRONOUNS.slice(0, 4)];
    const nounBase = EN_OBJECT_NOUNS[0];
    const extraObjects = [
      ...EN_OBJECT_NOUNS.slice(0, 2),
      `the ${nounBase}`,
      `a ${nounBase}`,
      "glorp",
    ];
    const objectSamples = [...baseObjects, ...extraObjects];
    for (const subject of subjectObjectSubjects) {
      const verb = pickEatForm(subject);
      const negVerb = pickEatNegative(subject);
      for (const obj of objectSamples) {
        subjectObjectSamples.push(`${subject} ${verb} ${obj}`);
        subjectObjectSamples.push(`${subject} ${negVerb} ${obj}`);
      }
    }
    for (const demo of INTRANSITIVE_DEMOS_EN_SING) {
      subjectObjectSamples.push(`${demo} goes`);
      subjectObjectSamples.push(`${demo} doesn't go`);
    }
    for (const demo of INTRANSITIVE_DEMOS_EN_PLUR) {
      subjectObjectSamples.push(`${demo} go`);
      subjectObjectSamples.push(`${demo} don't go`);
    }
  }
  const objectPresent: string[] = [];
  const objectNegative: string[] = [];
  const objectPresentMulti: string[] = [];
  const objectNegativeMulti: string[] = [];
  const objectSequences2: string[][] = [
    ["him", "it"],
    ["it", "him"],
    ["him", "anyone"],
    ["anyone", "accident"],
    ["glorp", "anyone"],
    ["them", "accident"],
    ["you", "it"],
  ];
  const objectSequences3: string[][] = [
    ["him", "anyone", "accident"],
    ["it", "anyone", "accident"],
  ];
  for (const subject of subjects) {
    const verb = pickEatForm(subject);
    const negVerb = pickEatNegative(subject);
    for (const obj of EN_OBJECT_PRONOUNS) {
      objectPresent.push(`${subject} ${verb} ${obj}`);
      objectNegative.push(`${subject} ${negVerb} ${obj}`);
    }
    for (const noun of EN_OBJECT_NOUNS) {
      objectPresent.push(`${subject} ${verb} ${noun}`);
      objectNegative.push(`${subject} ${negVerb} ${noun}`);
      for (const art of ["the"]) {
        objectPresent.push(`${subject} ${verb} ${art} ${noun}`);
        objectNegative.push(`${subject} ${negVerb} ${art} ${noun}`);
      }
      for (const art of ["a", "an"]) {
        objectPresent.push(`${subject} ${verb} ${art} ${noun}`);
        objectNegative.push(`${subject} ${negVerb} ${art} ${noun}`);
      }
    }
  }
  for (const subject of subjects) {
    const verb = pickEatForm(subject);
    const negVerb = pickEatNegative(subject);
    for (const noun of EN_OBJECT_NOUNS) {
      objectPresent.push(`${subject} ${verb} the ${noun} and a ${noun}`);
      objectPresent.push(`${subject} ${verb} a ${noun} and the ${noun}`);
      objectNegative.push(`${subject} ${negVerb} the ${noun} and a ${noun}`);
      objectNegative.push(`${subject} ${negVerb} a ${noun} and the ${noun}`);
    }
    for (let i = 0; i < EN_OBJECT_NOUNS.length; i += 1) {
      for (let j = 0; j < EN_OBJECT_NOUNS.length; j += 1) {
        if (i === j) continue;
        const nounA = EN_OBJECT_NOUNS[i];
        const nounB = EN_OBJECT_NOUNS[j];
        objectPresent.push(
          `${subject} ${verb} the ${nounA} and a ${nounB}`
        );
        objectPresent.push(
          `${subject} ${verb} a ${nounA} and the ${nounB}`
        );
        objectNegative.push(
          `${subject} ${negVerb} the ${nounA} and a ${nounB}`
        );
        objectNegative.push(
          `${subject} ${negVerb} a ${nounA} and the ${nounB}`
        );
      }
    }
  }
  const multiSubjectSamples = subjectSamples.filter(
    (sample) =>
      sample.includes(" and ") ||
      sample.includes(",") ||
      /others|rest|other/.test(sample)
  );
  const multiPartIndex = getMultiOdPartIndex(section);
  const multiSubjects =
    multiPartIndex === null
      ? multiSubjectSamples
      : multiSubjectSamples.filter(
          (_subject, idx) => idx % MULTI_OD_PARTS === multiPartIndex
        );
  const sequences2 =
    multiPartIndex === null
      ? objectSequences2
      : objectSequences2.filter(
          (_sequence, idx) => idx % MULTI_OD_PARTS === multiPartIndex
        );
  const sequences3 =
    multiPartIndex === null
      ? objectSequences3
      : objectSequences3.filter(
          (_sequence, idx) => idx % MULTI_OD_PARTS === multiPartIndex
        );
  for (const subject of multiSubjects) {
    const verb = pickEatForm(subject);
    const negVerb = pickEatNegative(subject);
    for (const sequence of sequences2) {
      for (const variant of buildObjectVariants(sequence, "en")) {
        objectPresentMulti.push(`${subject} ${verb} ${variant}`);
        objectNegativeMulti.push(`${subject} ${negVerb} ${variant}`);
      }
    }
    for (const sequence of sequences3) {
      for (const variant of buildObjectVariants(sequence, "en")) {
        objectPresentMulti.push(`${subject} ${verb} ${variant}`);
        objectNegativeMulti.push(`${subject} ${negVerb} ${variant}`);
      }
    }
  }
  const eatNoSubject = [...EAT_PRESENT_FORMS_EN];
  const eatImperative = [...EAT_IMPERATIVE_EN, ...EAT_NEGATIVE_IMPERATIVE_EN];
  const subjectsSet = [...eatPresent, ...eatNegative];
  const objectsSet = [...objectPresent, ...objectNegative];
  const buluNoun = EN_OBJECT_NOUNS[1] ?? EN_OBJECT_NOUNS[0] ?? "glorp";
  const buluSamples = [
    "i eat again",
    "i don't eat again",
    "eat again",
    `more ${buluNoun}`,
    `i eat more ${buluNoun}`,
    `i don't eat more ${buluNoun}`,
  ];
  objectsSet.push(...buildEnVerbChainSamples());
  objectsSet.push(...buluSamples);
  const multiOdSet = [...objectPresentMulti, ...objectNegativeMulti];
  const allSet = [
    ...subjectsSet,
    ...subjectObjectSamples,
    ...objectsSet,
    ...multiOdSet,
    ...eatNoSubject,
    ...eatImperative,
  ];
  if (section === "subjects") return [...subjectsSet, ...subjectObjectSamples];
  if (section === "objects") return objectsSet;
  if (section === "multi-od") return multiOdSet;
  if (section.startsWith("multi-od-")) return multiOdSet;
  return allSet;
}

export function getDevSampleCount(
  mode: LanguageMode,
  section: DevSampleSection = "all"
): number {
  return getDevSampleList(mode, section).length;
}

function formatVariantGroupLines(
  result: TranslationResult,
  primaryOutput: string
): string[] {
  const grouped = new Map<
    string,
    { scope: VariantScope; id: string; outputs: Set<string> }
  >();
  const ungroupedOutputs = new Set<string>();

  for (const combo of result.combinations) {
    const output = combo.output ?? "";
    if (!output) continue;
    if (combo.variantGroup) {
      const key = `${combo.variantGroup.scope}:${combo.variantGroup.id}`;
      const group = grouped.get(key) ?? {
        scope: combo.variantGroup.scope,
        id: combo.variantGroup.id,
        outputs: new Set<string>(),
      };
      group.outputs.add(output);
      grouped.set(key, group);
    } else {
      ungroupedOutputs.add(output);
    }
  }

  const lines: string[] = [];
  const ungroupedList = Array.from(ungroupedOutputs).filter(
    (output) => output && output !== primaryOutput
  );
  if (ungroupedList.length > 0) {
    lines.push(`alts: ${ungroupedList.join(" | ")}`);
  }

  for (const group of grouped.values()) {
    const outputs = Array.from(group.outputs).filter((output) => output);
    const filtered = outputs.filter((output) => output !== primaryOutput);
    if (filtered.length > 0) {
      lines.push(`${group.scope} ${group.id}: ${filtered.join(" | ")}`);
    } else if (outputs.length > 0) {
      lines.push(
        `${group.scope} ${group.id}: ${primaryOutput} (igual que principal)`
      );
    }
  }

  return lines;
}

export function buildDevSamplesReport(
  translateFn: (input: string, mode: LanguageMode) => TranslationResult,
  mode: LanguageMode,
  section: DevSampleSection = "all"
): string {
  const samples = getDevSampleList(mode, section);
  if (samples.length === 0) return `RIDJIN DEV SAMPLES (${mode})\n\n(no samples)`;

  const lines: string[] = [`RIDJIN DEV SAMPLES (${mode})`];
  for (const sample of samples) {
    let traceEnabled = false;
    const traceLines: string[] = [];
    try {
      traceEnabled = shouldTraceSample(section);
      if (traceEnabled) {
        setObjectTraceCollector((message) => traceLines.push(message));
        setEngineTraceCollector((message) => traceLines.push(message));
      }
      const result = translateFn(sample, mode);
      if (traceEnabled) {
        setObjectTraceCollector(null);
        setEngineTraceCollector(null);
      }
      const primary = result.combinations[0];
      lines.push("", sample);
      lines.push(`output: ${primary?.output ?? ""}`);
      if (result.combinations.length > 1) {
        const primaryOutput = primary?.output ?? "";
        lines.push(...formatVariantGroupLines(result, primaryOutput));
      }
      if (primary?.parts) {
        for (const part of primary.parts) {
          const altList = (part.alternatives ?? [])
            .map((alt) => `${alt.gup}${alt.note ? ` — ${alt.note}` : ""}`)
            .join(" | ");
          lines.push(
            `part: ${part.source} → ${part.gup} | ${part.explanation}${
              altList ? ` | alts: ${altList}` : ""
            }`
          );
        }
      }
      if (traceEnabled) {
        lines.push("trace:");
        lines.push(`trace: sample=${sample}`);
        if (traceLines.length === 0) {
          lines.push("trace: (no object events)");
        } else {
          for (const line of traceLines) {
            lines.push(`trace: ${line}`);
          }
        }
      }
    } catch (error) {
      if (traceEnabled) {
        setObjectTraceCollector(null);
        setEngineTraceCollector(null);
      }
      lines.push("", sample);
      lines.push(`error: ${String(error)}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

export async function buildDevSamplesReportChunks(
  translateFn: (input: string, mode: LanguageMode) => TranslationResult,
  mode: LanguageMode,
  section: DevSampleSection,
  onChunk: (chunk: string, append: boolean) => Promise<void> | void,
  chunkSize = 150_000
): Promise<void> {
  const samples = getDevSampleList(mode, section);
  let buffer = "";
  let append = false;

  const flush = async () => {
    if (!buffer) return;
    await onChunk(buffer, append);
    append = true;
    buffer = "";
  };

  const pushLine = async (line = "") => {
    const next = `${line}\n`;
    if (buffer.length + next.length > chunkSize && buffer.length > 0) {
      await flush();
    }
    buffer += next;
  };

  await pushLine(`RIDJIN DEV SAMPLES (${mode})`);
  if (samples.length === 0) {
    await pushLine("");
    await pushLine("(no samples)");
    await pushLine("");
    await flush();
    return;
  }

  for (const sample of samples) {
    let traceEnabled = false;
    const traceLines: string[] = [];
    try {
      traceEnabled = shouldTraceSample(section);
      if (traceEnabled) {
        setObjectTraceCollector((message) => traceLines.push(message));
        setEngineTraceCollector((message) => traceLines.push(message));
      }
      const result = translateFn(sample, mode);
      if (traceEnabled) {
        setObjectTraceCollector(null);
        setEngineTraceCollector(null);
      }
      const primary = result.combinations[0];
      await pushLine("");
      await pushLine(sample);
      await pushLine(`output: ${primary?.output ?? ""}`);
      if (result.combinations.length > 1) {
        const primaryOutput = primary?.output ?? "";
        const groupLines = formatVariantGroupLines(result, primaryOutput);
        for (const line of groupLines) {
          await pushLine(line);
        }
      }
      if (primary?.parts) {
        for (const part of primary.parts) {
          const altList = (part.alternatives ?? [])
            .map((alt) => `${alt.gup}${alt.note ? ` — ${alt.note}` : ""}`)
            .join(" | ");
          await pushLine(
            `part: ${part.source} → ${part.gup} | ${part.explanation}${
              altList ? ` | alts: ${altList}` : ""
            }`
          );
        }
      }
      if (traceEnabled) {
        await pushLine("trace:");
        await pushLine(`trace: sample=${sample}`);
        if (traceLines.length === 0) {
          await pushLine("trace: (no object events)");
        } else {
          for (const line of traceLines) {
            await pushLine(`trace: ${line}`);
          }
        }
      }
    } catch (error) {
      if (traceEnabled) {
        setObjectTraceCollector(null);
        setEngineTraceCollector(null);
      }
      await pushLine("");
      await pushLine(sample);
      await pushLine(`error: ${String(error)}`);
    }
  }

  await pushLine("");
  await flush();
}

export function getDevSampleAt(
  mode: LanguageMode,
  index: number,
  section: DevSampleSection = "all"
): { sample: string | null; nextIndex: number } {
  const list = getDevSampleList(mode, section);
  if (list.length === 0) return { sample: null, nextIndex: 0 };
  const safeIndex = index % list.length;
  const sample = list[safeIndex];
  return { sample, nextIndex: (safeIndex + 1) % list.length };
}

export function getDevSampleResetSection(
  input: string
): DevSampleSection | null {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (normalized === DEV_SAMPLE_RESET_SUBJECTS_TRIGGER) return "subjects";
  if (normalized === DEV_SAMPLE_RESET_SUBJECT_EMPHASIS_TRIGGER)
    return "subject-emphasis";
  if (normalized === DEV_SAMPLE_RESET_OBJECT_EMPHASIS_TRIGGER)
    return "object-emphasis";
  if (normalized === DEV_SAMPLE_RESET_POSSESSIVE_EMPHASIS_TRIGGER)
    return "possessive-emphasis";
  if (normalized === DEV_SAMPLE_RESET_POSSESSIVE_REFLEXIVE_TRIGGER)
    return "possessive-reflexive";
  if (normalized === DEV_SAMPLE_RESET_COMITATIVE_ALLATIVE_EMPHASIS_TRIGGER)
    return "comitative-allative-emphasis";
  if (normalized === DEV_SAMPLE_RESET_POSSESSIVE_GALA_EMPHASIS_TRIGGER)
    return "possessive-gala-emphasis";
  if (normalized === DEV_SAMPLE_RESET_EXTENDED_PRONOUN_EMPHASIS_TRIGGER)
    return "pronoun-emphasis-extended";
  if (normalized === DEV_SAMPLE_RESET_OBJECTS_TRIGGER) return "objects";
  if (
    normalized === DEV_SAMPLE_RESET_PAST_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_PAST_EN_TRIGGER
  ) {
    return "past-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_FUTURE_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_FUTURE_EN_TRIGGER
  ) {
    return "future-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_PAST_1_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_PAST_EN_1_TRIGGER
  ) {
    return "past-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_PAST_2_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_PAST_EN_2_TRIGGER
  ) {
    return "past-2";
  }
  if (
    normalized === DEV_SAMPLE_RESET_PAST_3_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_PAST_EN_3_TRIGGER
  ) {
    return "past-3";
  }
  if (
    normalized === DEV_SAMPLE_RESET_PAST_4_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_PAST_EN_4_TRIGGER
  ) {
    return "past-4";
  }
  if (
    normalized === DEV_SAMPLE_RESET_PAST_5_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_PAST_EN_5_TRIGGER
  ) {
    return "past-5";
  }
  if (
    normalized === DEV_SAMPLE_RESET_FUTURE_1_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_FUTURE_EN_1_TRIGGER
  ) {
    return "future-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_FUTURE_2_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_FUTURE_EN_2_TRIGGER
  ) {
    return "future-2";
  }
  if (
    normalized === DEV_SAMPLE_RESET_FUTURE_3_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_FUTURE_EN_3_TRIGGER
  ) {
    return "future-3";
  }
  if (
    normalized === DEV_SAMPLE_RESET_FUTURE_4_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_FUTURE_EN_4_TRIGGER
  ) {
    return "future-4";
  }
  if (
    normalized === DEV_SAMPLE_RESET_FUTURE_5_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_FUTURE_EN_5_TRIGGER
  ) {
    return "future-5";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MODAL_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MODAL_EN_TRIGGER
  ) {
    return "modal";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MODAL_POSSESSIVE_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MODAL_POSSESSIVE_EN_TRIGGER
  ) {
    return "modal-possessive";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MODAL_INF_POSSESSIVE_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MODAL_INF_POSSESSIVE_EN_TRIGGER
  ) {
    return "modal-infinitive-possessive";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MODAL_INF_POSSESSIVE_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MODAL_INF_POSSESSIVE_EN_TRIGGER
  ) {
    return "modal-infinitive-possessive";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MAKE_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MAKE_EN_TRIGGER
  ) {
    return "make-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_BECOME_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_BECOME_EN_TRIGGER
  ) {
    return "become";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MODAL_1_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MODAL_EN_1_TRIGGER
  ) {
    return "modal-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MAKE_1_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MAKE_EN_1_TRIGGER
  ) {
    return "make-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_BECOME_1_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_BECOME_EN_1_TRIGGER
  ) {
    return "become-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MODAL_2_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MODAL_EN_2_TRIGGER
  ) {
    return "modal-2";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MAKE_2_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MAKE_EN_2_TRIGGER
  ) {
    return "make-2";
  }
  if (
    normalized === DEV_SAMPLE_RESET_BECOME_2_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_BECOME_EN_2_TRIGGER
  ) {
    return "become-2";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MODAL_3_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MODAL_EN_3_TRIGGER
  ) {
    return "modal-3";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MAKE_3_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MAKE_EN_3_TRIGGER
  ) {
    return "make-3";
  }
  if (
    normalized === DEV_SAMPLE_RESET_BECOME_3_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_BECOME_EN_3_TRIGGER
  ) {
    return "become-3";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MODAL_4_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MODAL_EN_4_TRIGGER
  ) {
    return "modal-4";
  }
  if (
    normalized === DEV_SAMPLE_RESET_BECOME_4_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_BECOME_EN_4_TRIGGER
  ) {
    return "become-4";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MODAL_5_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MODAL_EN_5_TRIGGER
  ) {
    return "modal-5";
  }
  if (
    normalized === DEV_SAMPLE_RESET_BECOME_5_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_BECOME_EN_5_TRIGGER
  ) {
    return "become-5";
  }
  if (
    normalized === DEV_SAMPLE_RESET_HAVE_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_HAVE_EN_TRIGGER
  ) {
    return "have";
  }
  if (
    normalized === DEV_SAMPLE_RESET_HAVE_1_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_HAVE_EN_1_TRIGGER
  ) {
    return "have-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_HAVE_2_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_HAVE_EN_2_TRIGGER
  ) {
    return "have-2";
  }
  if (
    normalized === DEV_SAMPLE_RESET_HAVE_3_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_HAVE_EN_3_TRIGGER
  ) {
    return "have-3";
  }
  if (
    normalized === DEV_SAMPLE_RESET_POSSESSION_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_POSSESSION_EN_TRIGGER
  ) {
    return "possession";
  }
  if (
    normalized === DEV_SAMPLE_RESET_POSSESSION_1_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_POSSESSION_EN_1_TRIGGER
  ) {
    return "possession-1";
  }
  if (
    normalized === DEV_SAMPLE_RESET_POSSESSION_2_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_POSSESSION_EN_2_TRIGGER
  ) {
    return "possession-2";
  }
  if (
    normalized === DEV_SAMPLE_RESET_POSSESSION_3_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_POSSESSION_EN_3_TRIGGER
  ) {
    return "possession-3";
  }
  if (normalized === DEV_SAMPLE_RESET_COPULA_TRIGGER) return "copula-1";
  if (normalized === DEV_SAMPLE_RESET_COPULA_1_TRIGGER) return "copula-1";
  if (normalized === DEV_SAMPLE_RESET_COPULA_2_TRIGGER) return "copula-2";
  if (normalized === DEV_SAMPLE_RESET_COPULA_3_TRIGGER) return "copula-3";
  if (normalized === DEV_SAMPLE_RESET_COPULA_4_TRIGGER) return "copula-4";
  if (normalized === DEV_SAMPLE_RESET_COPULA_5_TRIGGER) return "copula-5";
  if (normalized === DEV_SAMPLE_RESET_LOCATIVE_ALL_TRIGGER) return "locative-all";
  if (normalized === DEV_SAMPLE_RESET_LOCATIVE_TRIGGER) return "locative-1";
  if (normalized === DEV_SAMPLE_RESET_LOCATIVE_1_TRIGGER) return "locative-1";
  if (normalized === DEV_SAMPLE_RESET_LOCATIVE_2_TRIGGER) return "locative-2";
  if (normalized === DEV_SAMPLE_RESET_LOCATIVE_3_TRIGGER) return "locative-3";
  if (normalized === DEV_SAMPLE_RESET_ALLATIVE_TRIGGER) return "allative-1";
  if (normalized === DEV_SAMPLE_RESET_ALLATIVE_1_TRIGGER) return "allative-1";
  if (normalized === DEV_SAMPLE_RESET_ALLATIVE_2_TRIGGER) return "allative-2";
  if (normalized === DEV_SAMPLE_RESET_ALLATIVE_3_TRIGGER) return "allative-3";
  if (normalized === DEV_SAMPLE_RESET_ABLATIVE_TRIGGER) return "ablative-1";
  if (normalized === DEV_SAMPLE_RESET_ABLATIVE_1_TRIGGER) return "ablative-1";
  if (normalized === DEV_SAMPLE_RESET_ABLATIVE_2_TRIGGER) return "ablative-2";
  if (normalized === DEV_SAMPLE_RESET_ABLATIVE_3_TRIGGER) return "ablative-3";
  if (normalized === DEV_SAMPLE_RESET_ABLATIVE_DEMO_TRIGGER)
    return "ablative-demo";
  if (normalized === DEV_SAMPLE_RESET_TRAVERSE_TRIGGER) return "traversive-1";
  if (normalized === DEV_SAMPLE_RESET_TRAVERSE_1_TRIGGER) return "traversive-1";
  if (normalized === DEV_SAMPLE_RESET_TRAVERSE_2_TRIGGER) return "traversive-2";
  if (normalized === DEV_SAMPLE_RESET_TRAVERSE_3_TRIGGER) return "traversive-3";
  if (normalized === DEV_SAMPLE_RESET_TRAVERSE_POSSESSIVE_EMPHATIC_TRIGGER)
    return "traversive-possessive-emphatic";
  if (normalized === DEV_SAMPLE_RESET_REFLEXIVE_OBJECT_TRIGGER)
    return "reflexive-object";
  if (normalized === DEV_SAMPLE_RESET_SIMULTANEOUS_TRIGGER) return "simultaneous";
  if (
    normalized === DEV_SAMPLE_RESET_NEAR_FUTURE_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_NEAR_FUTURE_EN_TRIGGER
  ) {
    return "near-future";
  }
  if (
    normalized === DEV_SAMPLE_RESET_HABITUAL_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_HABITUAL_EN_TRIGGER
  ) {
    return "habitual";
  }
  if (
    normalized === DEV_SAMPLE_RESET_MIGHT_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_MIGHT_EN_TRIGGER
  ) {
    return "might";
  }
  if (
    normalized === DEV_SAMPLE_RESET_SHOULD_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_SHOULD_EN_TRIGGER
  ) {
    return "should";
  }
  if (
    normalized === DEV_SAMPLE_RESET_SHOULD_HAVE_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_SHOULD_HAVE_EN_TRIGGER
  ) {
    return "should-have";
  }
  if (
    normalized === DEV_SAMPLE_RESET_PAST_HABITUAL_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_PAST_HABITUAL_EN_TRIGGER
  ) {
    return "past-habitual";
  }
  if (normalized === DEV_SAMPLE_RESET_ORIGIN_TRIGGER) return "origin-1";
  if (normalized === DEV_SAMPLE_RESET_ORIGIN_1_TRIGGER) return "origin-1";
  if (normalized === DEV_SAMPLE_RESET_ORIGIN_2_TRIGGER) return "origin-2";
  if (normalized === DEV_SAMPLE_RESET_ORIGIN_3_TRIGGER) return "origin-3";
  if (normalized === DEV_SAMPLE_RESET_COMITATIVE_TRIGGER) return "comitative-1";
  if (normalized === DEV_SAMPLE_RESET_COMITATIVE_1_TRIGGER) return "comitative-1";
  if (normalized === DEV_SAMPLE_RESET_COMITATIVE_2_TRIGGER) return "comitative-2";
  if (normalized === DEV_SAMPLE_RESET_COMITATIVE_3_TRIGGER) return "comitative-3";
  if (normalized === DEV_SAMPLE_RESET_COMITATIVE_DEMO_TRIGGER)
    return "comitative-demo";
  if (normalized === DEV_SAMPLE_RESET_INSTRUMENTAL_TRIGGER) return "instrumental-1";
  if (normalized === DEV_SAMPLE_RESET_INSTRUMENTAL_1_TRIGGER) return "instrumental-1";
  if (normalized === DEV_SAMPLE_RESET_INSTRUMENTAL_2_TRIGGER) return "instrumental-2";
  if (normalized === DEV_SAMPLE_RESET_INSTRUMENTAL_3_TRIGGER) return "instrumental-3";
  if (normalized === DEV_SAMPLE_RESET_PURPOSE_TRIGGER) return "purpose-1";
  if (normalized === DEV_SAMPLE_RESET_PURPOSE_1_TRIGGER) return "purpose-1";
  if (normalized === DEV_SAMPLE_RESET_PURPOSE_2_TRIGGER) return "purpose-2";
  if (normalized === DEV_SAMPLE_RESET_PURPOSE_3_TRIGGER) return "purpose-3";
  if (normalized === DEV_SAMPLE_RESET_ABOUT_TRIGGER) return "about-1";
  if (normalized === DEV_SAMPLE_RESET_ABOUT_1_TRIGGER) return "about-1";
  if (normalized === DEV_SAMPLE_RESET_ABOUT_2_TRIGGER) return "about-2";
  if (normalized === DEV_SAMPLE_RESET_ABOUT_3_TRIGGER) return "about-3";
  if (normalized === DEV_SAMPLE_RESET_UWUY_DEMO_TRIGGER) return "uwuy-demo";
  if (normalized === DEV_SAMPLE_RESET_CAUSE_VERB_TRIGGER) return "cause-verb";
  if (normalized === DEV_SAMPLE_RESET_ACT_VERB_TRIGGER) return "act-verb";
  if (normalized === DEV_SAMPLE_RESET_CAUSE_AGENT_TRIGGER) return "cause-agent";
  if (normalized === DEV_SAMPLE_RESET_VERBAL_NOUN_TRIGGER) return "verbal-noun";
  if (normalized === DEV_SAMPLE_RESET_PARTICIPLE_ADJ_TRIGGER)
    return "participle-adj";
  if (normalized === DEV_SAMPLE_RESET_DEMO_INTRANSITIVE_TRIGGER)
    return "demo-intransitive";
  if (normalized === DEV_SAMPLE_RESET_DHIYAKI_TRIGGER) return "dhiyaki";
  if (normalized === DEV_SAMPLE_RESET_AGENT_TRIGGER) return "agent";
  if (
    normalized === DEV_SAMPLE_RESET_LETS_TRIGGER ||
    normalized === DEV_SAMPLE_RESET_LETS_EN_TRIGGER
  ) {
    return "imperative-lets";
  }
  if (normalized === DEV_SAMPLE_RESET_IMPERATIVE_NEG_TRIGGER) {
    return "imperative-neg";
  }
  if (normalized === DEV_SAMPLE_RESET_MULTI_OD_1_TRIGGER) return "multi-od-1";
  if (normalized === DEV_SAMPLE_RESET_MULTI_OD_2_TRIGGER) return "multi-od-2";
  if (normalized === DEV_SAMPLE_RESET_MULTI_OD_3_TRIGGER) return "multi-od-3";
  if (normalized === DEV_SAMPLE_RESET_MULTI_OD_4_TRIGGER) return "multi-od-4";
  if (normalized === DEV_SAMPLE_RESET_MULTI_OD_5_TRIGGER) return "multi-od-5";
  if (normalized === DEV_SAMPLE_RESET_MULTI_OD_TRIGGER) return "multi-od";
  if (normalized === DEV_SAMPLE_RESET_TRIGGER) return "all";
  return null;
}

function expandSamples(samples: string[], mode: LanguageMode): string[] {
  const out = new Set<string>();
  const conjunction = mode === "es" ? " y " : " and ";

  for (const sample of samples) {
    const trimmed = sample.trim();
    if (!trimmed) continue;
    out.add(trimmed);

    if (trimmed.includes(conjunction)) {
      const parts = trimmed.split(conjunction).map((part) => part.trim());
      if (parts.length > 1) {
        const reversed = parts.slice().reverse().join(conjunction);
        out.add(reversed);

        if (parts.length >= 2) {
          out.add(parts.join(", "));
        }
        if (parts.length >= 3) {
          const withCommaAndConj = `${parts
            .slice(0, -1)
            .join(", ")}${conjunction}${parts[parts.length - 1]}`;
          out.add(withCommaAndConj);
        }
      }
    }
  }

  return Array.from(out);
}

function generateTripleCombinations(
  subjects: string[],
  conjunction: string
): string[] {
  const combos: string[] = [];
  for (let i = 0; i < subjects.length; i += 1) {
    for (let j = 0; j < subjects.length; j += 1) {
      if (j === i) continue;
      for (let k = 0; k < subjects.length; k += 1) {
        if (k === i || k === j) continue;
        combos.push(
          `${subjects[i]}${conjunction}${subjects[j]}${conjunction}${subjects[k]}`
        );
      }
    }
  }
  return combos;
}

function generateGroupCombinations(
  subjects: string[],
  groups: string[],
  conjunction: string
): string[] {
  const out = new Set<string>();
  for (const subject of subjects) {
    for (const group of groups) {
      out.add(`${subject}${conjunction}${group}`);
      out.add(`${group}${conjunction}${subject}`);
    }
  }

  for (let i = 0; i < subjects.length; i += 1) {
    for (let j = 0; j < subjects.length; j += 1) {
      if (j === i) continue;
      for (const group of groups) {
        out.add(`${subjects[i]}${conjunction}${subjects[j]}${conjunction}${group}`);
        out.add(`${subjects[i]}${conjunction}${group}${conjunction}${subjects[j]}`);
        out.add(`${group}${conjunction}${subjects[i]}${conjunction}${subjects[j]}`);
      }
    }
  }

  return Array.from(out);
}
