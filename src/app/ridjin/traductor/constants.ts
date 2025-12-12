import { LanguageMode } from "@/app/components/types/components.type";
import {
  FIXED_TRANSLATIONS_EN,
  FIXED_TRANSLATIONS_ES,
  FixedEntry,
} from "./fixedTranslations";
import { VerbPattern } from "./patterns";
export const LOCATIVE_SUFFIX = "ŋura";
export const ALLATIVE_SUFFIX = "lili";

export const VOICELESS_STOPS = ["p", "th", "t", "ṯ", "tj", "k", "'"];
export const VOICED_STOPS = ["b", "dh", "d", "ḏ", "dj", "g"];
export const NASALS = ["m", "nh", "n", "ṉ", "ny", "ŋ"];
export const LIQUIDS = ["l", "ḻ", "r", "rr"];
export const SEMIVOWELS = ["w", "y"];
export const SHORT_VOWELS = ["a", "i", "u"];
export const LONG_VOWELS = ["ä", "e", "o"];
export const ALL_VOWELS = [...SHORT_VOWELS, ...LONG_VOWELS];
export const NON_GLOTTAL_STOPS = VOICELESS_STOPS.filter((s) => s !== "'");

export const VOICELESS_TO_VOICED: Record<string, string> = {
  p: "b",
  th: "dh",
  t: "d",
  ṯ: "ḏ",
  tj: "dj",
  k: "g",
};

export const VOICED_TO_VOICELESS: Record<string, string> = {
  b: "p",
  dh: "th",
  d: "t",
  ḏ: "ṯ",
  dj: "tj",
  g: "k",
};

export const CONNECTOR_WORDS_ES = [
  "y",
  "e",
  ",",
  ".",
  "también",
  "tambien",
  "tampoco",
  "además",
  "ademas",
  "igualmente",
  "asimismo",
  "ni",
];

export const CONNECTOR_WORDS_EN = [
  "and",
  ",",
  ".",
  "also",
  "too",
  "as well",
  "neither",
  "nor",
];

export const PRONOUNS_ES = [
  "yo",
  "tú",
  "tu",
  "él",
  "el",
  "ella",
  "usted",
  "nosotros",
  "nosotras",
  "vosotros",
  "vosotras",
  "ellos",
  "ellas",
  "ustedes",
  "este",
  "esta",
  "esto",
  "ese",
  "esa",
  "eso",
  "aquel",
  "aquella",
  "aquello",
  "estos",
  "estas",
  "esos",
  "esas",
  "aquellos",
  "aquellas",
];

export const PRONOUNS_EN = [
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "this",
  "that",
  "these",
  "those",
];

export const DUAL_MARKERS_ES = ["dos", "2", "ambos", "ambas"];
export const DUAL_MARKERS_EN = ["two", "2", "both"];

export const THIS_WORDS_ES = ["este", "esta", "esto", "estos", "estas"];
export const THIS_WORDS_EN = ["this", "these"];
export const THAT_WORDS_ES = [
  "ese",
  "esa",
  "eso",
  "esos",
  "esas",
  "aquel",
  "aquella",
  "aquello",
  "aquellos",
  "aquellas",
];
export const THAT_WORDS_EN = ["that", "those"];
export const DEFINITE_ARTICLE_ES = ["el", "la", "los", "las", "lo"];
export const DEFINITE_ARTICLE_EN = ["the"];

export const POSSESSIVE_TRIGGERS_ES: Record<string, PersonNumber> = {
  mi: "1_Sing",
  mis: "1_Sing",
  tu: "2_Sing",
  tus: "2_Sing",
  su: "3_Sing",
  sus: "3_Sing",
  nuestro: "1+2_Plur",
  nuestra: "1+2_Plur",
  nuestros: "1+2_Plur",
  nuestras: "1+2_Plur",
  vuestro: "2_Plur",
  vuestra: "2_Plur",
  vuestros: "2_Plur",
  vuestras: "2_Plur",
};

export const POSSESSIVE_DE_TRIGGERS_ES: Record<string, PersonNumber> = {
  mí: "1_Sing",
  mi: "1_Sing",
  ti: "2_Sing",
  él: "3_Sing",
  el: "3_Sing",
  ella: "3_Sing",
  usted: "3_Sing",
  nosotros: "1+2_Plur",
  nosotras: "1+2_Plur",
  vosotros: "2_Plur",
  vosotras: "2_Plur",
  ellos: "3_Plur",
  ellas: "3_Plur",
  ustedes: "2_Plur",
  mío: "1_Sing",
  mio: "1_Sing",
  mía: "1_Sing",
  mia: "1_Sing",
  míos: "1_Sing",
  mios: "1_Sing",
  mías: "1_Sing",
  mias: "1_Sing",
  tuyo: "2_Sing",
  tuya: "2_Sing",
  tuyos: "2_Sing",
  tuyas: "2_Sing",
  suyo: "3_Sing",
  suya: "3_Sing",
  suyos: "3_Plur",
  suyas: "3_Plur",
};

export const POSSESSIVE_TRIGGERS_EN: Record<string, PersonNumber> = {
  my: "1_Sing",
  your: "2_Sing",
  his: "3_Sing",
  her: "3_Sing",
  its: "3_Sing",
  our: "1+2_Plur",
  their: "3_Plur",
};

export const POSSESSIVE_OF_TRIGGERS_EN: Record<string, PersonNumber> = {
  mine: "1_Sing",
  yours: "2_Sing",
  his: "3_Sing",
  hers: "3_Sing",
  ours: "1+2_Plur",
  theirs: "3_Plur",
  me: "1_Sing",
  you: "2_Sing",
  him: "3_Sing",
  her: "3_Sing",
  us: "1+2_Plur",
  them: "3_Plur",
};

export const POSSESSIVE_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["ŋarraku", "rraku"],
  "2_Sing": ["nhuŋu"],
  "3_Sing": ["nhanŋu"],
  "1+2_Dual": ["ŋalitjalaŋgu", "ŋilitjalaŋgu", "litjalaŋgu"],
  "1+3_Dual": ["ŋalinyalaŋgu", "ŋilinyalaŋgu", "linyalaŋgu"],
  "2_Dual": ["nhumalaŋgu"],
  "3_Dual": ["walalaŋgu"],
  "1+2_Plur": ["ŋalimurruŋgu", "ŋilimurruŋgu", "limurruŋgu"],
  "1+3_Plur": ["ŋanapurruŋgu", "napurruŋgu"],
  "2_Plur": ["nhumalaŋgu"],
  "3_Plur": ["walalaŋgu", "maṉḏaŋgu"],
};

export const COMITATIVE_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> = {
  conmigo: "1_Sing",
  contigo: "2_Sing",
  "con él": "3_Sing",
  "con el": "3_Sing",
  "con ella": "3_Sing",
  "con nosotros dos": "1+2_Dual",
  "con nosotras dos": "1+2_Dual",
  "con ustedes dos": "2_Dual",
  "con vosotros dos": "2_Dual",
  "con ellos dos": "3_Dual",
  "con ellas dos": "3_Dual",
  "con nosotros": "1+2_Plur",
  "con nosotras": "1+2_Plur",
  "con vosotros": "2_Plur",
  "con vosotras": "2_Plur",
  "con ustedes": "2_Plur",
  "con ellos": "3_Plur",
  "con ellas": "3_Plur",
};

export const COMITATIVE_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> = {
  "with me": "1_Sing",
  "with you": "2_Sing",
  "with him": "3_Sing",
  "with her": "3_Sing",
  "with it": "3_Sing",
  "with us two": "1+2_Dual",
  "with you two": "2_Dual",
  "with them two": "3_Dual",
  "with both of them": "3_Dual",
  "with us": "1+2_Plur",
  "with them": "3_Plur",
};

export const COMITATIVE_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["rrakala", "ŋarrakala"],
  "2_Sing": ["nhokala"],
  "3_Sing": ["nhanukala"],
  "1+2_Dual": ["litjalaŋgala", "ŋalitjalaŋgala", "ŋilitjalaŋgala"],
  "1+3_Dual": ["linyalaŋgala", "ŋalinyalaŋgala", "ŋilinyalaŋgala"],
  "2_Dual": ["nhumalaŋgala"],
  "3_Dual": ["maṉdaŋgala"],
  "1+2_Plur": ["limurruŋgala", "ŋalimurruŋgala", "ŋilimurruŋgala"],
  "1+3_Plur": ["napurruŋgala", "ŋanapurruŋgala"],
  "2_Plur": ["nhumalaŋgala"],
  "3_Plur": ["walalaŋgala"],
};

export const HUMAN_ABLATIVE_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["rrakalaŋuŋuru", "ŋarrakalaŋuŋuru"],
  "2_Sing": ["nhokalaŋuŋuru"],
  "3_Sing": ["nhanukalaŋuŋuru"],
  "1+2_Dual": [
    "litjalaŋgalaŋuŋuru",
    "ŋalitjalaŋgalaŋuŋuru",
    "ŋilitjalaŋgalaŋuŋuru",
  ],
  "1+3_Dual": [
    "linyalaŋgalaŋuŋuru",
    "ŋalinyalaŋgalaŋuŋuru",
    "ŋilinyalaŋgalaŋuŋuru",
  ],
  "2_Dual": ["nhumalaŋgalaŋuŋuru"],
  "3_Dual": ["maṉdaŋgalaŋuŋuru"],
  "1+2_Plur": [
    "limurruŋgalaŋuŋuru",
    "ŋalimurruŋgalaŋuŋuru",
    "ŋilimurruŋgalaŋuŋuru",
  ],
  "1+3_Plur": ["napurruŋgalaŋuŋuru", "ŋanapurruŋgalaŋuŋuru"],
  "2_Plur": ["nhumalaŋgalaŋuŋuru"],
  "3_Plur": ["walalaŋgalaŋuŋuru"],
};

export const SOURCE_ORIGIN_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["rrakuŋu", "ŋarrakuŋu"],
  "2_Sing": ["nhokuŋu"],
  "3_Sing": ["nhanukuŋu"],
  "1+2_Dual": ["litjalaŋguŋu", "ŋalitjalaŋguŋu", "ŋilitjalaŋguŋu"],
  "1+3_Dual": ["linyalaŋguŋu", "ŋalinyalaŋguŋu", "ŋilinyalaŋguŋu"],
  "2_Dual": ["nhumalaŋguŋu"],
  "3_Dual": ["maṉdaŋguŋu"],
  "1+2_Plur": ["limurruŋguŋu", "ŋalimurruŋguŋu", "ŋilimurruŋguŋu"],
  "1+3_Plur": ["napurruŋguŋu", "ŋanapurruŋguŋu"],
  "2_Plur": ["nhumalaŋguŋu"],
  "3_Plur": ["walalaŋguŋu"],
};

export const HUMAN_ABLATIVE_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> =
  {
    "desde mí": "1_Sing",
    "desde mi": "1_Sing",
    "desde ti": "2_Sing",
    "desde él": "3_Sing",
    "desde el": "3_Sing",
    "desde ella": "3_Sing",
    "desde nosotros": "1+2_Plur",
    "desde nosotras": "1+2_Plur",
    "desde vosotros": "2_Plur",
    "desde vosotras": "2_Plur",
    "desde ustedes": "2_Plur",
    "desde ellos": "3_Plur",
    "desde ellas": "3_Plur",
  };

export const HUMAN_ABLATIVE_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> =
  {
    "away from me": "1_Sing",
    "away from you": "2_Sing",
    "away from him": "3_Sing",
    "away from her": "3_Sing",
    "away from us": "1+2_Plur",
    "away from them": "3_Plur",
  };

export const SOURCE_ORIGIN_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> = {
  "de mí": "1_Sing",
  "de mi": "1_Sing",
  "de ti": "2_Sing",
  "de él": "3_Sing",
  "de el": "3_Sing",
  "de ella": "3_Sing",
  "de nosotros": "1+2_Plur",
  "de nosotras": "1+2_Plur",
  "de vosotros": "2_Plur",
  "de vosotras": "2_Plur",
  "de ustedes": "2_Plur",
  "de ellos": "3_Plur",
  "de ellas": "3_Plur",
};

export const SOURCE_ORIGIN_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> = {
  "from me": "1_Sing",
  "from you": "2_Sing",
  "from him": "3_Sing",
  "from her": "3_Sing",
  "from us": "1+2_Plur",
  "from them": "3_Plur",
};

export const PURPOSE_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> = {
  "por mí": "1_Sing",
  "por mi": "1_Sing",
  "para mí": "1_Sing",
  "para mi": "1_Sing",
  "a causa de mí": "1_Sing",
  "a causa de mi": "1_Sing",
  "por ti": "2_Sing",
  "para ti": "2_Sing",
  "a causa de ti": "2_Sing",
  "por él": "3_Sing",
  "por el": "3_Sing",
  "para él": "3_Sing",
  "para el": "3_Sing",
  "a causa de él": "3_Sing",
  "por ella": "3_Sing",
  "para ella": "3_Sing",
  "a causa de ella": "3_Sing",
  "por nosotros": "1+2_Plur",
  "por nosotras": "1+2_Plur",
  "para nosotros": "1+2_Plur",
  "para nosotras": "1+2_Plur",
  "a causa de nosotros": "1+2_Plur",
  "a causa de nosotras": "1+2_Plur",
  "por vosotros": "2_Plur",
  "por vosotras": "2_Plur",
  "para vosotros": "2_Plur",
  "para vosotras": "2_Plur",
  "por ustedes": "2_Plur",
  "para ustedes": "2_Plur",
  "por ellos": "3_Plur",
  "por ellas": "3_Plur",
  "para ellos": "3_Plur",
  "para ellas": "3_Plur",
  "a causa de ellos": "3_Plur",
  "a causa de ellas": "3_Plur",
};

export const PURPOSE_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> = {
  "because of me": "1_Sing",
  "for me": "1_Sing",
  "due to me": "1_Sing",
  "because of you": "2_Sing",
  "for you": "2_Sing",
  "due to you": "2_Sing",
  "because of him": "3_Sing",
  "for him": "3_Sing",
  "due to him": "3_Sing",
  "because of her": "3_Sing",
  "for her": "3_Sing",
  "due to her": "3_Sing",
  "because of us": "1+2_Plur",
  "for us": "1+2_Plur",
  "due to us": "1+2_Plur",
  "because of them": "3_Plur",
  "for them": "3_Plur",
  "due to them": "3_Plur",
};

export const HUMAN_ALLATIVE_PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> =
  {
    "hacia mí": "1_Sing",
    "hacia mi": "1_Sing",
    "hacia ti": "2_Sing",
    "hacia él": "3_Sing",
    "hacia el": "3_Sing",
    "hacia ella": "3_Sing",
    "hacia nosotros": "1+2_Plur",
    "hacia nosotras": "1+2_Plur",
    "hacia vosotros": "2_Plur",
    "hacia vosotras": "2_Plur",
    "hacia ustedes": "2_Plur",
    "hacia ellos": "3_Plur",
    "hacia ellas": "3_Plur",
  };

export const HUMAN_ALLATIVE_PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> =
  {
    "towards me": "1_Sing",
    "toward me": "1_Sing",
    "to me": "1_Sing",
    "towards you": "2_Sing",
    "toward you": "2_Sing",
    "to you": "2_Sing",
    "towards him": "3_Sing",
    "toward him": "3_Sing",
    "to him": "3_Sing",
    "towards her": "3_Sing",
    "toward her": "3_Sing",
    "to her": "3_Sing",
    "towards us": "1+2_Plur",
    "toward us": "1+2_Plur",
    "to us": "1+2_Plur",
    "towards them": "3_Plur",
    "toward them": "3_Plur",
    "to them": "3_Plur",
  };

export const HUMAN_ALLATIVE_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["rrakala", "ŋarrakala"],
  "2_Sing": ["nhokala"],
  "3_Sing": ["nhanukala"],
  "1+2_Dual": ["litjalaŋgala", "ŋalitjalaŋgala", "ŋilitjalaŋgala"],
  "1+3_Dual": ["linyalaŋgala", "ŋalinyalaŋgala", "ŋilinyalaŋgala"],
  "2_Dual": ["nhumalaŋgala"],
  "3_Dual": ["maṉdaŋgala"],
  "1+2_Plur": ["limurruŋgala", "ŋalimurruŋgala", "ŋilimurruŋgala"],
  "1+3_Plur": ["napurruŋgala", "ŋanapurruŋgala"],
  "2_Plur": ["nhumalaŋgala"],
  "3_Plur": ["walalaŋgala"],
};

export type MirriMiriwType = "mirri" | "miriw";

export type QuestionType =
  | "where"
  | "where_to"
  | "where_from"
  | "what"
  | "what_purpose"
  | "whom"
  | "to_whom"
  | "whose"
  | "whom_for"
  | "how"
  | "with_what"
  | "by_whom"
  | "when"
  | "why"
  | null;

export interface VerbConjugation {
  word: string;
  person: PersonNumber | null;
}

function createConjugations(
  forms: [string, PersonNumber | null][]
): VerbConjugation[] {
  return forms.map(([word, person]) => ({ word, person }));
}

export const TENER_FORMS: [string, PersonNumber | null][] = [
  ["tengo", "1_Sing"],
  ["tienes", "2_Sing"],
  ["tiene", "3_Sing"],
  ["tenemos", "1+2_Plur"],
  ["tenéis", "2_Plur"],
  ["teneis", "2_Plur"],
  ["tienen", "3_Plur"],
  ["tuve", "1_Sing"],
  ["tuviste", "2_Sing"],
  ["tuvo", "3_Sing"],
  ["tuvimos", "1+2_Plur"],
  ["tuvisteis", "2_Plur"],
  ["tuvieron", "3_Plur"],
  ["tenía", "1_Sing"],
  ["tenia", "1_Sing"],
  ["tenía", "3_Sing"],
  ["tenías", "2_Sing"],
  ["tenias", "2_Sing"],
  ["teníamos", "1+2_Plur"],
  ["teniamos", "1+2_Plur"],
  ["teníais", "2_Plur"],
  ["teniais", "2_Plur"],
  ["tenían", "3_Plur"],
  ["tenian", "3_Plur"],
  ["tendré", "1_Sing"],
  ["tendre", "1_Sing"],
  ["tendrás", "2_Sing"],
  ["tendras", "2_Sing"],
  ["tendrá", "3_Sing"],
  ["tendra", "3_Sing"],
  ["tendremos", "1+2_Plur"],
  ["tendréis", "2_Plur"],
  ["tendreis", "2_Plur"],
  ["tendrán", "3_Plur"],
  ["tendran", "3_Plur"],
  ["tendría", "1_Sing"],
  ["tendria", "1_Sing"],
  ["tendría", "3_Sing"],
  ["tendrías", "2_Sing"],
  ["tendrias", "2_Sing"],
  ["tendríamos", "1+2_Plur"],
  ["tendriamos", "1+2_Plur"],
  ["tendríais", "2_Plur"],
  ["tendriais", "2_Plur"],
  ["tendrían", "3_Plur"],
  ["tendrian", "3_Plur"],
  ["tenga", "1_Sing"],
  ["tenga", "3_Sing"],
  ["tengas", "2_Sing"],
  ["tengamos", "1+2_Plur"],
  ["tengáis", "2_Plur"],
  ["tengais", "2_Plur"],
  ["tengan", "3_Plur"],
  ["tuviera", "1_Sing"],
  ["tuviera", "3_Sing"],
  ["tuvieras", "2_Sing"],
  ["tuviéramos", "1+2_Plur"],
  ["tuvieramos", "1+2_Plur"],
  ["tuvierais", "2_Plur"],
  ["tuvieran", "3_Plur"],
  ["tuviese", "1_Sing"],
  ["tuviese", "3_Sing"],
  ["tuvieses", "2_Sing"],
  ["tuviésemos", "1+2_Plur"],
  ["tuviesemos", "1+2_Plur"],
  ["tuvieseis", "2_Plur"],
  ["tuviesen", "3_Plur"],
  ["ten", "2_Sing"],
  ["tened", "2_Plur"],
  ["teniendo", null],
  ["tenido", null],
  ["tener", null],
];

export const HABER_FORMS: [string, PersonNumber | null][] = [
  ["he", "1_Sing"],
  ["has", "2_Sing"],
  ["ha", "3_Sing"],
  ["hemos", "1+2_Plur"],
  ["habéis", "2_Plur"],
  ["habeis", "2_Plur"],
  ["han", "3_Plur"],
  ["hay", "3_Sing"],
  ["había", "1_Sing"],
  ["habia", "1_Sing"],
  ["había", "3_Sing"],
  ["habías", "2_Sing"],
  ["habias", "2_Sing"],
  ["habíamos", "1+2_Plur"],
  ["habiamos", "1+2_Plur"],
  ["habíais", "2_Plur"],
  ["habiais", "2_Plur"],
  ["habían", "3_Plur"],
  ["habian", "3_Plur"],
  ["hubo", "3_Sing"],
  ["habrá", "3_Sing"],
  ["habra", "3_Sing"],
  ["habrán", "3_Plur"],
  ["habran", "3_Plur"],
  ["habría", "3_Sing"],
  ["habria", "3_Sing"],
  ["habrían", "3_Plur"],
  ["habrian", "3_Plur"],
  ["haya", "1_Sing"],
  ["haya", "3_Sing"],
  ["hayas", "2_Sing"],
  ["hayamos", "1+2_Plur"],
  ["hayáis", "2_Plur"],
  ["hayais", "2_Plur"],
  ["hayan", "3_Plur"],
  ["hubiera", "1_Sing"],
  ["hubiera", "3_Sing"],
  ["hubieras", "2_Sing"],
  ["hubiéramos", "1+2_Plur"],
  ["hubieramos", "1+2_Plur"],
  ["hubierais", "2_Plur"],
  ["hubieran", "3_Plur"],
  ["hubiese", "1_Sing"],
  ["hubiese", "3_Sing"],
  ["hubieses", "2_Sing"],
  ["hubiésemos", "1+2_Plur"],
  ["hubiesemos", "1+2_Plur"],
  ["hubieseis", "2_Plur"],
  ["hubiesen", "3_Plur"],
  ["habiendo", null],
  ["habido", null],
  ["haber", null],
];

export const EXISTIR_FORMS: [string, PersonNumber | null][] = [
  ["existo", "1_Sing"],
  ["existes", "2_Sing"],
  ["existe", "3_Sing"],
  ["existimos", "1+2_Plur"],
  ["existís", "2_Plur"],
  ["existis", "2_Plur"],
  ["existen", "3_Plur"],
  ["existía", "1_Sing"],
  ["existia", "1_Sing"],
  ["existía", "3_Sing"],
  ["existías", "2_Sing"],
  ["existias", "2_Sing"],
  ["existíamos", "1+2_Plur"],
  ["existiamos", "1+2_Plur"],
  ["existíais", "2_Plur"],
  ["existiais", "2_Plur"],
  ["existían", "3_Plur"],
  ["existian", "3_Plur"],
  ["existí", "1_Sing"],
  ["existi", "1_Sing"],
  ["exististe", "2_Sing"],
  ["existió", "3_Sing"],
  ["existio", "3_Sing"],
  ["existimos", "1+2_Plur"],
  ["exististeis", "2_Plur"],
  ["existieron", "3_Plur"],
  ["existiré", "1_Sing"],
  ["existire", "1_Sing"],
  ["existirás", "2_Sing"],
  ["existiras", "2_Sing"],
  ["existirá", "3_Sing"],
  ["existira", "3_Sing"],
  ["existiremos", "1+2_Plur"],
  ["existiréis", "2_Plur"],
  ["existireis", "2_Plur"],
  ["existirán", "3_Plur"],
  ["existiran", "3_Plur"],
  ["existiría", "1_Sing"],
  ["existiria", "1_Sing"],
  ["existiría", "3_Sing"],
  ["existirías", "2_Sing"],
  ["existirias", "2_Sing"],
  ["existiríamos", "1+2_Plur"],
  ["existiriamos", "1+2_Plur"],
  ["existiríais", "2_Plur"],
  ["existiriais", "2_Plur"],
  ["existirían", "3_Plur"],
  ["existirian", "3_Plur"],
  ["exista", "1_Sing"],
  ["exista", "3_Sing"],
  ["existas", "2_Sing"],
  ["existamos", "1+2_Plur"],
  ["existáis", "2_Plur"],
  ["existais", "2_Plur"],
  ["existan", "3_Plur"],
  ["existiera", "1_Sing"],
  ["existiera", "3_Sing"],
  ["existieras", "2_Sing"],
  ["existiéramos", "1+2_Plur"],
  ["existieramos", "1+2_Plur"],
  ["existierais", "2_Plur"],
  ["existieran", "3_Plur"],
  ["existiendo", null],
  ["existido", null],
  ["existir", null],
];

export const POSEER_FORMS: [string, PersonNumber | null][] = [
  ["poseo", "1_Sing"],
  ["posees", "2_Sing"],
  ["posee", "3_Sing"],
  ["poseemos", "1+2_Plur"],
  ["poseéis", "2_Plur"],
  ["poseeis", "2_Plur"],
  ["poseen", "3_Plur"],
  ["poseía", "1_Sing"],
  ["poseia", "1_Sing"],
  ["poseía", "3_Sing"],
  ["poseías", "2_Sing"],
  ["poseias", "2_Sing"],
  ["poseíamos", "1+2_Plur"],
  ["poseiamos", "1+2_Plur"],
  ["poseíais", "2_Plur"],
  ["poseiais", "2_Plur"],
  ["poseían", "3_Plur"],
  ["poseian", "3_Plur"],
  ["poseí", "1_Sing"],
  ["posei", "1_Sing"],
  ["poseíste", "2_Sing"],
  ["poseiste", "2_Sing"],
  ["poseyó", "3_Sing"],
  ["poseyo", "3_Sing"],
  ["poseímos", "1+2_Plur"],
  ["poseimos", "1+2_Plur"],
  ["poseísteis", "2_Plur"],
  ["poseisteis", "2_Plur"],
  ["poseyeron", "3_Plur"],
  ["poseeré", "1_Sing"],
  ["poseere", "1_Sing"],
  ["poseerás", "2_Sing"],
  ["poseeras", "2_Sing"],
  ["poseerá", "3_Sing"],
  ["poseera", "3_Sing"],
  ["poseeremos", "1+2_Plur"],
  ["poseeréis", "2_Plur"],
  ["poseereis", "2_Plur"],
  ["poseerán", "3_Plur"],
  ["poseeran", "3_Plur"],
  ["poseería", "1_Sing"],
  ["poseeria", "1_Sing"],
  ["poseería", "3_Sing"],
  ["poseerías", "2_Sing"],
  ["poseerias", "2_Sing"],
  ["poseeríamos", "1+2_Plur"],
  ["poseeriamos", "1+2_Plur"],
  ["poseeríais", "2_Plur"],
  ["poseeriais", "2_Plur"],
  ["poseerían", "3_Plur"],
  ["poseerian", "3_Plur"],
  ["posea", "1_Sing"],
  ["posea", "3_Sing"],
  ["poseas", "2_Sing"],
  ["poseamos", "1+2_Plur"],
  ["poseáis", "2_Plur"],
  ["poseais", "2_Plur"],
  ["posean", "3_Plur"],
  ["poseyera", "1_Sing"],
  ["poseyera", "3_Sing"],
  ["poseyeras", "2_Sing"],
  ["poseyéramos", "1+2_Plur"],
  ["poseyeramos", "1+2_Plur"],
  ["poseyerais", "2_Plur"],
  ["poseyeran", "3_Plur"],
  ["poseyendo", null],
  ["poseído", null],
  ["poseido", null],
  ["poseer", null],
];

export const PERTENECER_FORMS: [string, PersonNumber | null][] = [
  ["pertenezco", "1_Sing"],
  ["perteneces", "2_Sing"],
  ["pertenece", "3_Sing"],
  ["pertenecemos", "1+2_Plur"],
  ["pertenecéis", "2_Plur"],
  ["perteneceis", "2_Plur"],
  ["pertenecen", "3_Plur"],
  ["pertenecía", "1_Sing"],
  ["pertenecia", "1_Sing"],
  ["pertenecía", "3_Sing"],
  ["pertenecías", "2_Sing"],
  ["pertenecias", "2_Sing"],
  ["pertenecíamos", "1+2_Plur"],
  ["perteneciamos", "1+2_Plur"],
  ["pertenecíais", "2_Plur"],
  ["perteneciais", "2_Plur"],
  ["pertenecían", "3_Plur"],
  ["pertenecian", "3_Plur"],
  ["pertenecí", "1_Sing"],
  ["perteneci", "1_Sing"],
  ["perteneciste", "2_Sing"],
  ["perteneció", "3_Sing"],
  ["pertenecio", "3_Sing"],
  ["pertenecimos", "1+2_Plur"],
  ["pertenecisteis", "2_Plur"],
  ["pertenecieron", "3_Plur"],
  ["perteneceré", "1_Sing"],
  ["pertenecere", "1_Sing"],
  ["pertenecerás", "2_Sing"],
  ["perteneceras", "2_Sing"],
  ["pertenecerá", "3_Sing"],
  ["pertenecera", "3_Sing"],
  ["perteneceremos", "1+2_Plur"],
  ["perteneceréis", "2_Plur"],
  ["pertenecereis", "2_Plur"],
  ["pertenecerán", "3_Plur"],
  ["perteneceran", "3_Plur"],
  ["pertenecería", "1_Sing"],
  ["perteneceria", "1_Sing"],
  ["pertenecería", "3_Sing"],
  ["pertenecerías", "2_Sing"],
  ["pertenecerias", "2_Sing"],
  ["perteneceríamos", "1+2_Plur"],
  ["perteneceriamos", "1+2_Plur"],
  ["perteneceríais", "2_Plur"],
  ["perteneceriais", "2_Plur"],
  ["pertenecerían", "3_Plur"],
  ["pertenecerian", "3_Plur"],
  ["pertenezca", "1_Sing"],
  ["pertenezca", "3_Sing"],
  ["pertenezcas", "2_Sing"],
  ["pertenezcamos", "1+2_Plur"],
  ["pertenezcáis", "2_Plur"],
  ["pertenezcais", "2_Plur"],
  ["pertenezcan", "3_Plur"],
  ["perteneciera", "1_Sing"],
  ["perteneciera", "3_Sing"],
  ["pertenecieras", "2_Sing"],
  ["perteneciéramos", "1+2_Plur"],
  ["pertenecieramos", "1+2_Plur"],
  ["pertenecierais", "2_Plur"],
  ["pertenecieran", "3_Plur"],
  ["perteneciendo", null],
  ["pertenecido", null],
  ["pertenecer", null],
];

export const CARECER_FORMS: [string, PersonNumber | null][] = [
  ["carezco", "1_Sing"],
  ["careces", "2_Sing"],
  ["carece", "3_Sing"],
  ["carecemos", "1+2_Plur"],
  ["carecéis", "2_Plur"],
  ["careceis", "2_Plur"],
  ["carecen", "3_Plur"],
  ["carecía", "1_Sing"],
  ["carecia", "1_Sing"],
  ["carecía", "3_Sing"],
  ["carecías", "2_Sing"],
  ["carecias", "2_Sing"],
  ["carecíamos", "1+2_Plur"],
  ["careciamos", "1+2_Plur"],
  ["carecíais", "2_Plur"],
  ["careciais", "2_Plur"],
  ["carecían", "3_Plur"],
  ["carecian", "3_Plur"],
  ["carecí", "1_Sing"],
  ["careci", "1_Sing"],
  ["careciste", "2_Sing"],
  ["careció", "3_Sing"],
  ["carecio", "3_Sing"],
  ["carecimos", "1+2_Plur"],
  ["carecisteis", "2_Plur"],
  ["carecieron", "3_Plur"],
  ["careceré", "1_Sing"],
  ["carecere", "1_Sing"],
  ["carecerás", "2_Sing"],
  ["careceras", "2_Sing"],
  ["carecerá", "3_Sing"],
  ["carecera", "3_Sing"],
  ["careceremos", "1+2_Plur"],
  ["careceréis", "2_Plur"],
  ["carecereis", "2_Plur"],
  ["carecerán", "3_Plur"],
  ["careceran", "3_Plur"],
  ["carecería", "1_Sing"],
  ["careceria", "1_Sing"],
  ["carecería", "3_Sing"],
  ["carecerías", "2_Sing"],
  ["carecerias", "2_Sing"],
  ["careceríamos", "1+2_Plur"],
  ["careceriamos", "1+2_Plur"],
  ["careceríais", "2_Plur"],
  ["careceriais", "2_Plur"],
  ["carecerían", "3_Plur"],
  ["carecerian", "3_Plur"],
  ["carezca", "1_Sing"],
  ["carezca", "3_Sing"],
  ["carezcas", "2_Sing"],
  ["carezcamos", "1+2_Plur"],
  ["carezcáis", "2_Plur"],
  ["carezcais", "2_Plur"],
  ["carezcan", "3_Plur"],
  ["careciera", "1_Sing"],
  ["careciera", "3_Sing"],
  ["carecieras", "2_Sing"],
  ["careciéramos", "1+2_Plur"],
  ["carecieramos", "1+2_Plur"],
  ["carecierais", "2_Plur"],
  ["carecieran", "3_Plur"],
  ["careciendo", null],
  ["carecido", null],
  ["carecer", null],
];

export const FALTAR_FORMS: [string, PersonNumber | null][] = [
  ["falto", "1_Sing"],
  ["faltas", "2_Sing"],
  ["falta", "3_Sing"],
  ["faltamos", "1+2_Plur"],
  ["faltáis", "2_Plur"],
  ["faltais", "2_Plur"],
  ["faltan", "3_Plur"],
  ["faltaba", "1_Sing"],
  ["faltaba", "3_Sing"],
  ["faltabas", "2_Sing"],
  ["faltábamos", "1+2_Plur"],
  ["faltabamos", "1+2_Plur"],
  ["faltabais", "2_Plur"],
  ["faltaban", "3_Plur"],
  ["falté", "1_Sing"],
  ["falte", "1_Sing"],
  ["faltaste", "2_Sing"],
  ["faltó", "3_Sing"],
  ["falto", "3_Sing"],
  ["faltamos", "1+2_Plur"],
  ["faltasteis", "2_Plur"],
  ["faltaron", "3_Plur"],
  ["faltaré", "1_Sing"],
  ["faltare", "1_Sing"],
  ["faltarás", "2_Sing"],
  ["faltaras", "2_Sing"],
  ["faltará", "3_Sing"],
  ["faltara", "3_Sing"],
  ["faltaremos", "1+2_Plur"],
  ["faltaréis", "2_Plur"],
  ["faltareis", "2_Plur"],
  ["faltarán", "3_Plur"],
  ["faltaran", "3_Plur"],
  ["faltaría", "1_Sing"],
  ["faltaria", "1_Sing"],
  ["faltaría", "3_Sing"],
  ["faltarías", "2_Sing"],
  ["faltarias", "2_Sing"],
  ["faltaríamos", "1+2_Plur"],
  ["faltariamos", "1+2_Plur"],
  ["faltaríais", "2_Plur"],
  ["faltariais", "2_Plur"],
  ["faltarían", "3_Plur"],
  ["faltarian", "3_Plur"],
  ["falte", "1_Sing"],
  ["falte", "3_Sing"],
  ["faltes", "2_Sing"],
  ["faltemos", "1+2_Plur"],
  ["faltéis", "2_Plur"],
  ["falteis", "2_Plur"],
  ["falten", "3_Plur"],
  ["faltara", "1_Sing"],
  ["faltara", "3_Sing"],
  ["faltaras", "2_Sing"],
  ["faltáramos", "1+2_Plur"],
  ["faltaramos", "1+2_Plur"],
  ["faltarais", "2_Plur"],
  ["faltaran", "3_Plur"],
  ["faltando", null],
  ["faltado", null],
  ["faltar", null],
];

export const HAVE_FORMS: [string, PersonNumber | null][] = [
  ["have", "1_Sing"],
  ["have", "2_Sing"],
  ["have", "1+2_Plur"],
  ["have", "2_Plur"],
  ["have", "3_Plur"],
  ["has", "3_Sing"],
  ["had", "1_Sing"],
  ["had", "2_Sing"],
  ["had", "3_Sing"],
  ["had", "1+2_Plur"],
  ["had", "2_Plur"],
  ["had", "3_Plur"],
  ["having", null],
  ["'ve", null],
  ["'s got", "3_Sing"],
  ["got", null],
  ["i have", "1_Sing"],
  ["you have", "2_Sing"],
  ["he has", "3_Sing"],
  ["she has", "3_Sing"],
  ["we have", "1+2_Plur"],
  ["they have", "3_Plur"],
  ["i've", "1_Sing"],
  ["you've", "2_Sing"],
  ["we've", "1+2_Plur"],
  ["they've", "3_Plur"],
  ["he's got", "3_Sing"],
  ["she's got", "3_Sing"],
  ["it's got", "3_Sing"],
  ["i had", "1_Sing"],
  ["you had", "2_Sing"],
  ["he had", "3_Sing"],
  ["she had", "3_Sing"],
  ["we had", "1+2_Plur"],
  ["they had", "3_Plur"],
];

export const OWN_FORMS: [string, PersonNumber | null][] = [
  ["own", "1_Sing"],
  ["own", "2_Sing"],
  ["own", "1+2_Plur"],
  ["own", "2_Plur"],
  ["own", "3_Plur"],
  ["owns", "3_Sing"],
  ["owned", null],
  ["owning", null],
  ["i own", "1_Sing"],
  ["you own", "2_Sing"],
  ["he owns", "3_Sing"],
  ["she owns", "3_Sing"],
  ["we own", "1+2_Plur"],
  ["they own", "3_Plur"],
];

export const POSSESS_FORMS: [string, PersonNumber | null][] = [
  ["possess", "1_Sing"],
  ["possess", "2_Sing"],
  ["possess", "1+2_Plur"],
  ["possess", "2_Plur"],
  ["possess", "3_Plur"],
  ["possesses", "3_Sing"],
  ["possessed", null],
  ["possessing", null],
  ["i possess", "1_Sing"],
  ["you possess", "2_Sing"],
  ["he possesses", "3_Sing"],
  ["she possesses", "3_Sing"],
  ["we possess", "1+2_Plur"],
  ["they possess", "3_Plur"],
];

export const BELONG_FORMS: [string, PersonNumber | null][] = [
  ["belong", "1_Sing"],
  ["belong", "2_Sing"],
  ["belong", "1+2_Plur"],
  ["belong", "2_Plur"],
  ["belong", "3_Plur"],
  ["belongs", "3_Sing"],
  ["belonged", null],
  ["belonging", null],
];

export const LACK_FORMS: [string, PersonNumber | null][] = [
  ["lack", "1_Sing"],
  ["lack", "2_Sing"],
  ["lack", "1+2_Plur"],
  ["lack", "2_Plur"],
  ["lack", "3_Plur"],
  ["lacks", "3_Sing"],
  ["lacked", null],
  ["lacking", null],
  ["i lack", "1_Sing"],
  ["you lack", "2_Sing"],
  ["he lacks", "3_Sing"],
  ["she lacks", "3_Sing"],
  ["we lack", "1+2_Plur"],
  ["they lack", "3_Plur"],
];

export const MISS_FORMS: [string, PersonNumber | null][] = [
  ["miss", "1_Sing"],
  ["miss", "2_Sing"],
  ["miss", "1+2_Plur"],
  ["miss", "2_Plur"],
  ["miss", "3_Plur"],
  ["misses", "3_Sing"],
  ["missed", null],
  ["missing", null],
];

export const MIRRI_CONJUGATIONS_ES: VerbConjugation[] = [
  ...createConjugations(TENER_FORMS),
  ...createConjugations(HABER_FORMS),
  ...createConjugations(EXISTIR_FORMS),
  ...createConjugations(POSEER_FORMS),
  ...createConjugations(PERTENECER_FORMS),
];

export const MIRRI_CONJUGATIONS_EN: VerbConjugation[] = [
  ...createConjugations(HAVE_FORMS),
  ...createConjugations(OWN_FORMS),
  ...createConjugations(POSSESS_FORMS),
  ...createConjugations(BELONG_FORMS),
];

export const MIRIW_CONJUGATIONS_ES: VerbConjugation[] = [
  ...createConjugations(CARECER_FORMS),
  ...createConjugations(FALTAR_FORMS),
];

export const MIRIW_CONJUGATIONS_EN: VerbConjugation[] = [
  ...createConjugations(LACK_FORMS),
  ...createConjugations(MISS_FORMS),
];

export const THERE_IS_PHRASES_ES: [string, PersonNumber | null][] = [
  ["hay", "3_Sing"],
  ["había", "3_Sing"],
  ["habia", "3_Sing"],
  ["hubo", "3_Sing"],
  ["habrá", "3_Sing"],
  ["habra", "3_Sing"],
  ["existe", "3_Sing"],
  ["existen", "3_Plur"],
];

export const THERE_IS_PHRASES_EN: [string, PersonNumber | null][] = [
  ["there is", "3_Sing"],
  ["there are", "3_Plur"],
  ["there was", "3_Sing"],
  ["there were", "3_Plur"],
  ["there's", "3_Sing"],
  ["there're", "3_Plur"],
];

export const THERE_IS_NO_PHRASES_ES: [string, PersonNumber | null][] = [
  ["no hay", "3_Sing"],
  ["no había", "3_Sing"],
  ["no habia", "3_Sing"],
  ["no existe", "3_Sing"],
  ["no existen", "3_Plur"],
];

export const THERE_IS_NO_PHRASES_EN: [string, PersonNumber | null][] = [
  ["there is no", "3_Sing"],
  ["there are no", "3_Plur"],
  ["there isn't", "3_Sing"],
  ["there aren't", "3_Plur"],
  ["there was no", "3_Sing"],
  ["there were no", "3_Plur"],
];

export const HAS_NO_PHRASES_ES: [string, PersonNumber | null][] = [
  ["no tengo", "1_Sing"],
  ["no tienes", "2_Sing"],
  ["no tiene", "3_Sing"],
  ["no tenemos", "1+2_Plur"],
  ["no tienen", "3_Plur"],
  ["no tuve", "1_Sing"],
  ["no tuvo", "3_Sing"],
  ["no tenía", "1_Sing"],
  ["no tenía", "3_Sing"],
  ["no poseo", "1_Sing"],
  ["no posee", "3_Sing"],
  ["no poseen", "3_Plur"],
];

export const HAS_NO_PHRASES_EN: [string, PersonNumber | null][] = [
  ["has no", "3_Sing"],
  ["have no", "1_Sing"],
  ["have no", "1+2_Plur"],
  ["had no", null],
  ["doesn't have", "3_Sing"],
  ["don't have", "1_Sing"],
  ["don't have", "1+2_Plur"],
  ["doesnt have", "3_Sing"],
  ["dont have", "1_Sing"],
  ["didn't have", null],
  ["didnt have", null],
  ["i have no", "1_Sing"],
  ["you have no", "2_Sing"],
  ["he has no", "3_Sing"],
  ["she has no", "3_Sing"],
  ["we have no", "1+2_Plur"],
  ["they have no", "3_Plur"],
  ["i don't have", "1_Sing"],
  ["i dont have", "1_Sing"],
  ["you don't have", "2_Sing"],
  ["you dont have", "2_Sing"],
  ["he doesn't have", "3_Sing"],
  ["she doesn't have", "3_Sing"],
  ["we don't have", "1+2_Plur"],
  ["they don't have", "3_Plur"],
];

export const FULL_OF_PHRASES_ES: [string, PersonNumber | null][] = [
  ["lleno de", null],
  ["llena de", null],
  ["llenos de", null],
  ["llenas de", null],
  ["repleto de", null],
  ["repleta de", null],
  ["cargado de", null],
  ["cargada de", null],
  ["cubierto de", null],
  ["cubierta de", null],
  ["rico en", null],
  ["rica en", null],
];

export const FULL_OF_PHRASES_EN: [string, PersonNumber | null][] = [
  ["full of", null],
  ["filled with", null],
];

export const WITH_POSSESSIVE_ES = ["con"];
export const WITH_POSSESSIVE_EN = ["with"];

export const WITHOUT_ES = ["sin"];
export const WITHOUT_EN = ["without"];

export const HABER_AUXILIARY_FORMS_ES = [
  "he",
  "has",
  "ha",
  "hemos",
  "habéis",
  "habeis",
  "han",
  "había",
  "habia",
  "habías",
  "habias",
  "habíamos",
  "habiamos",
  "habían",
  "habian",
  "hube",
  "hubiste",
  "hubo",
  "hubimos",
  "hubieron",
  "habré",
  "habre",
  "habrás",
  "habras",
  "habrá",
  "habra",
  "habremos",
  "habrán",
  "habran",
  "habría",
  "habria",
  "habrías",
  "habrias",
  "habríamos",
  "habriamos",
  "habrían",
  "habrian",
  "haya",
  "hayas",
  "hayamos",
  "hayan",
  "hubiera",
  "hubieras",
  "hubiéramos",
  "hubieramos",
  "hubieran",
];

export const COPULA_VERBS_ES = [
  "ser",
  "estar",
  "soy",
  "eres",
  "es",
  "somos",
  "sois",
  "son",
  "estoy",
  "estás",
  "está",
  "estamos",
  "estáis",
  "estais",
  "están",
  "estan",
  "era",
  "eras",
  "éramos",
  "eramos",
  "erais",
  "eran",
  "estaba",
  "estabas",
  "estábamos",
  "estabamos",
  "estabais",
  "estaban",
  "fui",
  "fuiste",
  "fue",
  "fuimos",
  "fuisteis",
  "fueron",
  "estuve",
  "estuviste",
  "estuvo",
  "estuvimos",
  "estuvisteis",
  "estuvieron",
  "seré",
  "sere",
  "serás",
  "seras",
  "será",
  "sera",
  "seremos",
  "seréis",
  "sereis",
  "serán",
  "seran",
  "estaré",
  "estare",
  "estarás",
  "estaras",
  "estará",
  "estara",
  "estaremos",
  "estaréis",
  "estareis",
  "estarán",
  "estaran",
];
export const COPULA_VERBS_EN = [
  "is",
  "am",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "i'm",
  "you're",
  "he's",
  "she's",
  "it's",
  "we're",
  "they're",
];

export type PersonNumber =
  | "1_Sing"
  | "2_Sing"
  | "3_Sing"
  | "1+2_Dual"
  | "1+3_Dual"
  | "2_Dual"
  | "3_Dual"
  | "1+2_Plur"
  | "1+3_Plur"
  | "2_Plur"
  | "3_Plur";

export const FIRST_PERSON_PLURAL_TRIGGERS = [
  "nosotros",
  "nosotras",
  "we",
  "us",
];

export const COPULA_PERSON_MAP_ES: Record<string, PersonNumber | null> = {
  soy: "1_Sing",
  estoy: "1_Sing",
  era: "1_Sing",
  estaba: "1_Sing",
  fui: "1_Sing",
  estuve: "1_Sing",
  seré: "1_Sing",
  sere: "1_Sing",
  estaré: "1_Sing",
  estare: "1_Sing",
  eres: "2_Sing",
  estás: "2_Sing",
  estas: "2_Sing",
  eras: "2_Sing",
  estabas: "2_Sing",
  fuiste: "2_Sing",
  estuviste: "2_Sing",
  serás: "2_Sing",
  seras: "2_Sing",
  estarás: "2_Sing",
  estaras: "2_Sing",
  es: "3_Sing",
  está: "3_Sing",
  fue: "3_Sing",
  estuvo: "3_Sing",
  será: "3_Sing",
  sera: "3_Sing",
  estará: "3_Sing",
  estara: "3_Sing",
  somos: "1+2_Plur",
  estamos: "1+2_Plur",
  éramos: "1+2_Plur",
  eramos: "1+2_Plur",
  estábamos: "1+2_Plur",
  estabamos: "1+2_Plur",
  fuimos: "1+2_Plur",
  estuvimos: "1+2_Plur",
  seremos: "1+2_Plur",
  estaremos: "1+2_Plur",
  sois: "2_Plur",
  estáis: "2_Plur",
  estais: "2_Plur",
  erais: "2_Plur",
  estabais: "2_Plur",
  fuisteis: "2_Plur",
  estuvisteis: "2_Plur",
  seréis: "2_Plur",
  sereis: "2_Plur",
  estaréis: "2_Plur",
  estareis: "2_Plur",
  son: "3_Plur",
  están: "3_Plur",
  estan: "3_Plur",
  eran: "3_Plur",
  estaban: "3_Plur",
  fueron: "3_Plur",
  estuvieron: "3_Plur",
  serán: "3_Plur",
  seran: "3_Plur",
  estarán: "3_Plur",
  estaran: "3_Plur",
};

export const COPULA_PERSON_MAP_EN: Record<string, PersonNumber | null> = {
  am: "1_Sing",
  "i'm": "1_Sing",
  "'m": "1_Sing",
  is: "3_Sing",
  "he's": "3_Sing",
  "she's": "3_Sing",
  "it's": "3_Sing",
  "'s": "3_Sing",
  are: null,
  "you're": null,
  "we're": null,
  "they're": null,
  "'re": null,
  was: null,
  were: null,
  be: null,
  been: null,
  being: null,
};

export const SUBJECT_PRONOUNS_GUP: Record<PersonNumber, string[]> = {
  "1_Sing": ["ŋarra", "rra"],
  "2_Sing": ["nhe"],
  "3_Sing": ["ŋayi"],
  "1+2_Dual": ["ŋali"],
  "1+3_Dual": ["ŋilinyu", "linyu", "ŋalinyu"],
  "2_Dual": ["nhuma"],
  "3_Dual": ["maṉḏa"],
  "1+2_Plur": ["ŋilimurru", "ŋalimurru"],
  "1+3_Plur": ["ŋanapurru", "napurru"],
  "2_Plur": ["nhuma"],
  "3_Plur": ["walala"],
};

export const PRONOUN_TRIGGERS_ES: Record<string, PersonNumber> = {
  yo: "1_Sing",
  tu: "2_Sing",
  tú: "2_Sing",
  el: "3_Sing",
  él: "3_Sing",
  ella: "3_Sing",
  nosotros: "1+2_Plur",
  nosotras: "1+2_Plur",
  ustedes: "2_Plur",
  vosotros: "2_Plur",
  vosotras: "2_Plur",
  ellos: "3_Plur",
  ellas: "3_Plur",
};

export const DUAL_SUBJECT_PATTERNS_ES: Record<string, PersonNumber> = {
  "los dos": "3_Plur",
  "las dos": "3_Plur",
  "ellos dos": "3_Plur",
  "ellas dos": "3_Plur",
  "estos dos": "3_Plur",
  "estas dos": "3_Plur",
  "esos dos": "3_Plur",
  "esas dos": "3_Plur",
  "aquellos dos": "3_Plur",
  "aquellas dos": "3_Plur",
  dos: "3_Plur",
  "los 2": "3_Plur",
  "las 2": "3_Plur",
  ambos: "3_Plur",
  ambas: "3_Plur",
};

export const DUAL_SUBJECT_PATTERNS_EN: Record<string, PersonNumber> = {
  "the two": "3_Plur",
  "those two": "3_Plur",
  "these two": "3_Plur",
  both: "3_Plur",
  "the 2": "3_Plur",
};

export const PRONOUN_TRIGGERS_EN: Record<string, PersonNumber> = {
  i: "1_Sing",
  you: "2_Sing",
  he: "3_Sing",
  she: "3_Sing",
  it: "3_Sing",
  we: "1+2_Plur",
  they: "3_Plur",
};

export const VERB_PERSON_TO_PERSONNUMBER: Record<number, PersonNumber> = {
  0: "1_Sing",
  1: "2_Sing",
  2: "3_Sing",
  3: "1+2_Plur",
  4: "2_Plur",
  5: "3_Plur",
};

const SKIP_WORDS_WHOSE_ES = ["el", "la", "los", "las", "un", "una", "es"];
const SKIP_WORDS_WHOSE_EN = ["the", "a", "an", "is", "are"];
export const SKIP_WORDS_ES = [
  "lo",
  "la",
  "los",
  "las",
  "le",
  "les",
  "me",
  "te",
  "nos",
  "os",
  "se",
  "el",
  "un",
  "una",
  "unos",
  "unas",
];
export const SKIP_WORDS_EN = ["me", "him", "her", "it", "us", "them", "the", "a", "an"];
export const SKIP_WORDS_WHO_ES = ["el", "la", "los", "las", "un", "una"];
export const SKIP_WORDS_WHO_EN = ["the", "a", "an"];
export const SKIP_WORDS_WHERE_TO_ES = [
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "a",
];
export const SKIP_WORDS_WHERE_TO_EN = ["the", "a", "an", "to"];

export const ESTAR_PRESENT = [
  "estoy",
  "estás",
  "estas",
  "está",
  "esta",
  "estamos",
  "estáis",
  "estais",
  "están",
  "estan",
];
export const ESTAR_PAST = [
  "estaba",
  "estabas",
  "estábamos",
  "estabamos",
  "estabais",
  "estaban",
  "estuve",
  "estuviste",
  "estuvo",
  "estuvimos",
  "estuvisteis",
  "estuvieron",
];
export const ESTAR_FUTURE = [
  "estaré",
  "estare",
  "estarás",
  "estaras",
  "estará",
  "estara",
  "estaremos",
  "estaréis",
  "estareis",
  "estarán",
  "estaran",
];
export const ESTAR_ALL = [
  ...ESTAR_PRESENT,
  ...ESTAR_PAST,
  ...ESTAR_FUTURE,
  "estar",
  "estado",
];

export const IR_PRESENT = ["voy", "vas", "va", "vamos", "vais", "van"];
export const IR_PAST = [
  "iba",
  "ibas",
  "íbamos",
  "ibamos",
  "ibais",
  "iban",
  "fui",
  "fuiste",
  "fue",
  "fuimos",
  "fuisteis",
  "fueron",
];
export const IR_FUTURE = [
  "iré",
  "ire",
  "irás",
  "iras",
  "irá",
  "ira",
  "iremos",
  "iréis",
  "ireis",
  "irán",
  "iran",
];
export const IR_ALL = [...IR_PRESENT, ...IR_PAST, ...IR_FUTURE, "ir", "ido"];

export const SEGUIR_ALL = [
  "seguir",
  "sigo",
  "sigues",
  "sigue",
  "seguimos",
  "seguís",
  "seguis",
  "siguen",
  "seguía",
  "seguia",
  "seguías",
  "seguias",
  "seguíamos",
  "seguiamos",
  "seguíais",
  "seguiais",
  "seguían",
  "seguian",
  "seguí",
  "segui",
  "seguiste",
  "siguió",
  "siguio",
  "seguisteis",
  "siguieron",
  "seguiré",
  "seguire",
  "seguirás",
  "seguiras",
  "seguirá",
  "seguira",
  "seguiremos",
  "seguiréis",
  "seguireis",
  "seguirán",
  "seguiran",
  "seguido",
];

export const CONTINUAR_ALL = [
  "continuar",
  "continúo",
  "continuo",
  "continúas",
  "continuas",
  "continúa",
  "continua",
  "continuamos",
  "continuáis",
  "continuais",
  "continúan",
  "continuan",
  "continuaba",
  "continuabas",
  "continuábamos",
  "continuabamos",
  "continuabais",
  "continuaban",
  "continué",
  "continue",
  "continuaste",
  "continuó",
  "continuasteis",
  "continuaron",
  "continuaré",
  "continuare",
  "continuarás",
  "continuaras",
  "continuará",
  "continuara",
  "continuaremos",
  "continuaréis",
  "continuareis",
  "continuarán",
  "continuaran",
  "continuado",
];

export const HABER_ALL = [
  "haber",
  "he",
  "has",
  "ha",
  "hemos",
  "habéis",
  "habeis",
  "han",
  "había",
  "habia",
  "habías",
  "habias",
  "habíamos",
  "habiamos",
  "habíais",
  "habiais",
  "habían",
  "habian",
  "hube",
  "hubiste",
  "hubo",
  "hubimos",
  "hubisteis",
  "hubieron",
  "habré",
  "habre",
  "habrás",
  "habras",
  "habrá",
  "habra",
  "habremos",
  "habréis",
  "habreis",
  "habrán",
  "habran",
  "habría",
  "habria",
  "habrías",
  "habrias",
  "habríamos",
  "habriamos",
  "habríais",
  "habriais",
  "habrían",
  "habrian",
];

export const BE_PRESENT = ["am", "is", "are"];
export const BE_PAST = ["was", "were", "been"];
export const BE_ALL = [...BE_PRESENT, ...BE_PAST, "be", "being"];

export const KEEP_ALL = ["keep", "keeps", "kept", "keeping"];
export const CONTINUE_EN_ALL = [
  "continue",
  "continues",
  "continued",
  "continuing",
];
export const GO_ALL = ["go", "goes", "went", "going", "gone"];
export const HAVE_EN_ALL = ["have", "has", "had", "having"];

export const NEGATION_ES = ["no", "nunca", "jamás", "jamas"];
export const NEGATION_EN = [
  "not",
  "don't",
  "dont",
  "doesn't",
  "doesnt",
  "didn't",
  "didnt",
  "won't",
  "wont",
  "never",
];

export const SUBJUNCTIVE_TRIGGERS_ES = [
  "que",
  "quiero que",
  "espero que",
  "ojalá",
  "ojala",
  "aunque",
  "para que",
  "cuando",
  "si",
  "como si",
  "antes de que",
  "después de que",
  "sin que",
  "a menos que",
  "con tal de que",
  "en caso de que",
  "es necesario que",
  "es importante que",
  "es posible que",
  "dudo que",
  "no creo que",
];
export const SUBJUNCTIVE_TRIGGERS_EN = [
  "that",
  "wish that",
  "hope that",
  "if",
  "unless",
  "before",
  "after",
  "so that",
  "in order that",
  "as if",
  "even if",
  "whether",
];

export const CONTINUOUS_IMPERATIVE_MARKERS_ES = [
  "sigue",
  "continúa",
  "continua",
  "mantén",
  "manten",
  "seguir",
  "continuar",
  "mantener",
];
export const CONTINUOUS_IMPERATIVE_MARKERS_EN = ["keep", "stay"];

export const FUTURE_MARKERS_ES = [
  "voy a",
  "vas a",
  "va a",
  "vamos a",
  "vais a",
  "van a",
  "iré a",
  "ire a",
  "irás a",
  "iras a",
  "irá a",
  "ira a",
  "iremos a",
  "iréis a",
  "ireis a",
  "irán a",
  "iran a",
  ...ESTAR_FUTURE,
  "seguiré",
  "seguire",
  "seguirás",
  "seguiras",
  "seguirá",
  "seguira",
  "seguiremos",
  "seguiréis",
  "seguireis",
  "seguirán",
  "seguiran",
  "continuaré",
  "continuare",
  "continuarás",
  "continuaras",
  "continuará",
  "continuara",
  "continuaremos",
  "continuaréis",
  "continuareis",
  "continuarán",
  "continuaran",
];
export const FUTURE_MARKERS_EN = [
  "will",
  "shall",
  "going to",
  "gonna",
  "i'll",
  "you'll",
  "he'll",
  "she'll",
  "it'll",
  "we'll",
  "they'll",
  "'ll",
  "will keep",
  "will continue",
  "i'll keep",
  "you'll keep",
  "he'll keep",
  "she'll keep",
  "it'll keep",
  "we'll keep",
  "they'll keep",
  "i'll continue",
  "you'll continue",
  "he'll continue",
  "she'll continue",
  "it'll continue",
  "we'll continue",
  "they'll continue",
];

export const TODAY_MARKERS_ES = ["hoy", "ahora", "esta noche"];
export const TODAY_MARKERS_EN = ["today", "now", "tonight", "this evening"];

export const YESTERDAY_MARKERS_ES = ["ayer", "anoche"];
export const YESTERDAY_MARKERS_EN = ["yesterday", "last night"];

export const PAST_CONTINUOUS_MARKERS_ES = [
  ...ESTAR_PAST,
  "seguía",
  "seguia",
  "seguías",
  "seguias",
  "seguíamos",
  "seguiamos",
  "seguíais",
  "seguiais",
  "seguían",
  "seguian",
  "seguí",
  "segui",
  "seguiste",
  "siguió",
  "siguio",
  "seguimos",
  "seguisteis",
  "siguieron",
  "continuaba",
  "continuabas",
  "continuábamos",
  "continuabamos",
  "continuabais",
  "continuaban",
  "continué",
  "continue",
  "continuaste",
  "continuó",
  "continuamos",
  "continuasteis",
  "continuaron",
  ...IR_PAST,
  "he",
  "has",
  "ha",
  "hemos",
  "habéis",
  "habeis",
  "han",
  "había",
  "habia",
  "habías",
  "habias",
  "habíamos",
  "habiamos",
  "habíais",
  "habiais",
  "habían",
  "habian",
  "hube",
  "hubiste",
  "hubo",
  "hubimos",
  "hubisteis",
  "hubieron",
  "he estado",
  "has estado",
  "ha estado",
  "hemos estado",
  "habéis estado",
  "han estado",
  "había estado",
  "habías estado",
  "habíamos estado",
  "habían estado",
  "he seguido",
  "has seguido",
  "ha seguido",
  "hemos seguido",
  "han seguido",
  "había seguido",
  "habías seguido",
  "habíamos seguido",
  "habían seguido",
  "he continuado",
  "has continuado",
  "ha continuado",
  "hemos continuado",
  "han continuado",
  "había continuado",
  "habías continuado",
  "habíamos continuado",
  "habían continuado",
];
export const PAST_CONTINUOUS_MARKERS_EN = [
  "was",
  "were",
  "kept",
  "continued",
  "had been",
  "have been",
  "has been",
  "had",
  "have",
  "has",
  "'ve",
  "'d",
  "was going",
  "were going",
  "had kept",
  "have kept",
  "has kept",
  "had continued",
  "have continued",
  "has continued",
];

export const SPECIFIED_FUTURE_MARKERS_ES = [
  "mañana",
  "manana",
  "próximo",
  "próxima",
  "proximo",
  "proxima",
  "después",
  "despues",
  "luego",
  "pronto",
  "la próxima semana",
  "la proxima semana",
  "el próximo mes",
  "el proximo mes",
  "el próximo año",
  "el proximo ano",
  "dentro de",
  "en un",
  "en una",
];
export const SPECIFIED_FUTURE_MARKERS_EN = [
  "tomorrow",
  "next",
  "later",
  "soon",
  "next week",
  "next month",
  "next year",
  "in a",
];

export const ALREADY_MARKERS_ES = ["ya", "ahora", "ahora mismo"];
export const ALREADY_MARKERS_EN = ["already", "now", "right now"];

export const CONTINUOUS_TRIGGERS_ES = [
  ...ESTAR_PRESENT,
  ...ESTAR_PAST,
  "sigo",
  "sigues",
  "sigue",
  "seguimos",
  "seguís",
  "seguis",
  "siguen",
  "seguía",
  "seguia",
  "seguías",
  "seguias",
  "seguíamos",
  "seguiamos",
  "seguíais",
  "seguiais",
  "seguían",
  "seguian",
  "seguí",
  "segui",
  "seguiste",
  "siguió",
  "siguio",
  "seguimos",
  "seguisteis",
  "siguieron",
  "continúo",
  "continuo",
  "continúas",
  "continuas",
  "continúa",
  "continua",
  "continuamos",
  "continuáis",
  "continuais",
  "continúan",
  "continuan",
  "continuaba",
  "continuabas",
  "continuábamos",
  "continuabamos",
  "continuabais",
  "continuaban",
  "continué",
  "continue",
  "continuaste",
  "continuó",
  "continuo",
  "continuamos",
  "continuasteis",
  "continuaron",
];
export const CONTINUOUS_TRIGGERS_EN = [
  "keep",
  "keeps",
  "kept",
  "keeping",
  "continue",
  "continues",
  "continued",
  "continuing",
  "go on",
  "goes on",
  "went on",
  "going on",
];

export const CONTINUOUS_VERB_TRIGGERS_ES = [
  ...ESTAR_ALL,
  ...SEGUIR_ALL,
  ...CONTINUAR_ALL,
  ...IR_PAST,
];
export const CONTINUOUS_VERB_TRIGGERS_EN = [
  ...KEEP_ALL,
  ...CONTINUE_EN_ALL,
  "was",
  "were",
  "been",
];

export const AUXILIARY_PERSON_ES: Record<string, number> = {
  estoy: 0,
  estás: 1,
  estas: 1,
  está: 2,
  esta: 2,
  estamos: 3,
  estáis: 4,
  estais: 4,
  están: 5,
  estan: 5,
  estaba: 0,
  estabas: 1,
  estábamos: 3,
  estabamos: 3,
  estabais: 4,
  estaban: 5,
  estuve: 0,
  estuviste: 1,
  estuvo: 2,
  estuvimos: 3,
  estuvisteis: 4,
  estuvieron: 5,
  estaré: 0,
  estare: 0,
  estarás: 1,
  estaras: 1,
  estará: 2,
  estara: 2,
  estaremos: 3,
  estaréis: 4,
  estareis: 4,
  estarán: 5,
  estaran: 5,
  voy: 0,
  vas: 1,
  va: 2,
  vamos: 3,
  vais: 4,
  van: 5,
  iba: 0,
  ibas: 1,
  íbamos: 3,
  ibamos: 3,
  ibais: 4,
  iban: 5,
  fui: 0,
  fuiste: 1,
  fue: 2,
  fuimos: 3,
  fuisteis: 4,
  fueron: 5,
  iré: 0,
  ire: 0,
  irás: 1,
  iras: 1,
  irá: 2,
  ira: 2,
  iremos: 3,
  iréis: 4,
  ireis: 4,
  irán: 5,
  iran: 5,
  sigo: 0,
  sigues: 1,
  sigue: 2,
  seguimos: 3,
  seguís: 4,
  seguis: 4,
  siguen: 5,
  seguía: 0,
  seguia: 0,
  seguías: 1,
  seguias: 1,
  seguíamos: 3,
  seguiamos: 3,
  seguíais: 4,
  seguiais: 4,
  seguían: 5,
  seguian: 5,
  seguí: 0,
  segui: 0,
  seguiste: 1,
  siguió: 2,
  siguio: 2,
  seguisteis: 4,
  siguieron: 5,
  seguiré: 0,
  seguire: 0,
  seguirás: 1,
  seguiras: 1,
  seguirá: 2,
  seguira: 2,
  seguiremos: 3,
  seguiréis: 4,
  seguireis: 4,
  seguirán: 5,
  seguiran: 5,
  continúo: 0,
  continuo: 0,
  continúas: 1,
  continuas: 1,
  continúa: 2,
  continua: 2,
  continuamos: 3,
  continuáis: 4,
  continuais: 4,
  continúan: 5,
  continuan: 5,
  continuaba: 0,
  continuabas: 1,
  continuábamos: 3,
  continuabamos: 3,
  continuabais: 4,
  continuaban: 5,
  continué: 0,
  continue: 0,
  continuaste: 1,
  continuó: 2,
  continuasteis: 4,
  continuaron: 5,
  continuaré: 0,
  continuare: 0,
  continuarás: 1,
  continuaras: 1,
  continuará: 2,
  continuara: 2,
  continuaremos: 3,
  continuaréis: 4,
  continuareis: 4,
  continuarán: 5,
  continuaran: 5,
  he: 0,
  has: 1,
  ha: 2,
  hemos: 3,
  habéis: 4,
  habeis: 4,
  han: 5,
  había: 0,
  habia: 0,
  habías: 1,
  habias: 1,
  habíamos: 3,
  habiamos: 3,
  habíais: 4,
  habiais: 4,
  habían: 5,
  habian: 5,
  hube: 0,
  hubiste: 1,
  hubo: 2,
  hubimos: 3,
  hubisteis: 4,
  hubieron: 5,
  habré: 0,
  habre: 0,
  habrás: 1,
  habras: 1,
  habrá: 2,
  habra: 2,
  habremos: 3,
  habréis: 4,
  habreis: 4,
  habrán: 5,
  habran: 5,
  habría: 0,
  habria: 0,
  habrías: 1,
  habrias: 1,
  habríamos: 3,
  habriamos: 3,
  habríais: 4,
  habriais: 4,
  habrían: 5,
  habrian: 5,
};

export const AUXILIARY_PERSON_EN: Record<string, number> = {
  am: 0,
  is: 2,
  are: 1,
  was: 0,
  were: 1,
  have: 0,
  has: 2,
  had: 0,
  keep: 0,
  keeps: 2,
  kept: 0,
  continue: 0,
  continues: 2,
  continued: 0,
  go: 0,
  goes: 2,
  went: 0,
  going: 0,
};

export function getNegationWords(mode: LanguageMode): string[] {
  const { negation } = LANG_CONFIG[mode];
  return negation;
}

export function getAuxiliaryPerson(
  word: string,
  mode: LanguageMode
): number | null {
  const { auxiliary } = LANG_CONFIG[mode];
  const person = auxiliary[word.toLowerCase()];
  return person !== undefined ? person : null;
}

export function findMultiWordMarker(
  lowerTokens: string[],
  markers: string[]
): string | null {
  for (const marker of markers) {
    if (marker.includes(" ")) {
      const markerParts = marker.split(" ");
      for (let i = 0; i <= lowerTokens.length - markerParts.length; i++) {
        let match = true;
        for (let j = 0; j < markerParts.length; j++) {
          if (lowerTokens[i + j] !== markerParts[j]) {
            match = false;
            break;
          }
        }
        if (match) return marker;
      }
    } else {
      if (lowerTokens.includes(marker)) return marker;
    }
  }
  return null;
}

export function hasMultiWordMarker(
  lowerTokens: string[],
  markers: string[]
): boolean {
  return findMultiWordMarker(lowerTokens, markers) !== null;
}

export function normalizeApostrophes(str: string): string {
  return str.replace(/[''ʼ`]/g, "'");
}

export function normalizeToken(token: string): string {
  return token.toLowerCase().trim();
}

export function normalizeForEnding(word: string): string {
  return word
    .toLowerCase()
    .replace(/['ʼ`']/g, "'")
    .trim();
}

export interface WordEnding {
  char: string;
  hasGlottal: boolean;
  digraph: string | null;
}

const DIGRAPHS = ["tj", "dj", "nh", "ny", "ng", "rr", "rl"];

export function getWordEnding(word: string): WordEnding {
  const normalized = normalizeForEnding(word);
  const hasGlottal = normalized.endsWith("'");
  const withoutGlottal = hasGlottal ? normalized.slice(0, -1) : normalized;

  for (const digraph of DIGRAPHS) {
    if (withoutGlottal.endsWith(digraph)) {
      return { char: digraph, hasGlottal, digraph };
    }
  }

  return { char: withoutGlottal.slice(-1), hasGlottal, digraph: null };
}

export const GUP_WORDS_NO_WURRU = [
  "dhuwala",
  "dhuwali",
  "dhuwal",
  "dhuwurr",
  "ŋarra",
  "nhe",
  "ŋayi",
  "ŋali",
  "ŋalimurru",
  "ŋanapurru",
  "nhuma",
  "walal",
  "djäl",
  "marŋgi",
  "yaka",
  "ga",
  "dhu",
  "yurru",
  "yukurra",
  "gi",
];

function endsWithNasal(text: string): {
  found: boolean;
  nasal: string;
  position: number;
} {
  for (const nasal of [...NASALS].sort((a, b) => b.length - a.length)) {
    if (text.endsWith(nasal)) {
      return { found: true, nasal, position: text.length - nasal.length };
    }
  }
  return { found: false, nasal: "", position: -1 };
}

function startsWithConsonant(text: string): {
  found: boolean;
  consonant: string;
  type: "voiceless" | "voiced" | "other";
} {
  for (const c of [...VOICELESS_STOPS].sort((a, b) => b.length - a.length)) {
    if (text.startsWith(c))
      return { found: true, consonant: c, type: "voiceless" };
  }
  for (const c of [...VOICED_STOPS].sort((a, b) => b.length - a.length)) {
    if (text.startsWith(c))
      return { found: true, consonant: c, type: "voiced" };
  }
  return { found: false, consonant: "", type: "other" };
}

function endsWithVoicelessStop(text: string): {
  found: boolean;
  stop: string;
  position: number;
} {
  for (const stop of [...VOICELESS_STOPS].sort((a, b) => b.length - a.length)) {
    if (text.endsWith(stop)) {
      return { found: true, stop, position: text.length - stop.length };
    }
  }
  return { found: false, stop: "", position: -1 };
}

export function validarFonologia(palabra: string): string {
  let result = palabra;

  for (let i = 0; i < result.length - 1; i++) {
    const nasalCheck = endsWithNasal(result.slice(0, i + 2));
    if (nasalCheck.found) {
      const afterNasal = result.slice(
        nasalCheck.position + nasalCheck.nasal.length
      );

      if (afterNasal.startsWith("'")) {
        const afterGlottal = afterNasal.slice(1);
        const consonantCheck = startsWithConsonant(afterGlottal);
        if (consonantCheck.found && consonantCheck.type === "voiced") {
          const voiceless = VOICED_TO_VOICELESS[consonantCheck.consonant];
          if (voiceless) {
            result =
              result.slice(0, nasalCheck.position + nasalCheck.nasal.length) +
              "'" +
              voiceless +
              afterGlottal.slice(consonantCheck.consonant.length);
          }
        }
        continue;
      }

      const consonantCheck = startsWithConsonant(afterNasal);
      if (
        consonantCheck.found &&
        consonantCheck.type === "voiceless" &&
        consonantCheck.consonant !== "'"
      ) {
        const voiced = VOICELESS_TO_VOICED[consonantCheck.consonant];
        if (voiced) {
          result =
            result.slice(0, nasalCheck.position + nasalCheck.nasal.length) +
            voiced +
            afterNasal.slice(consonantCheck.consonant.length);
        }
      }
    }
  }

  for (let i = 0; i < result.length - 1; i++) {
    const voicelessCheck = endsWithVoicelessStop(result.slice(0, i + 2));
    if (voicelessCheck.found && voicelessCheck.stop !== "'") {
      const afterStop = result.slice(
        voicelessCheck.position + voicelessCheck.stop.length
      );
      const consonantCheck = startsWithConsonant(afterStop);
      if (consonantCheck.found && consonantCheck.type === "voiced") {
        const voiceless = VOICED_TO_VOICELESS[consonantCheck.consonant];
        if (voiceless) {
          result =
            result.slice(
              0,
              voicelessCheck.position + voicelessCheck.stop.length
            ) +
            voiceless +
            afterStop.slice(consonantCheck.consonant.length);
        }
      }
    }
  }

  return result;
}

export function endsInStop(word: string): boolean {
  return VOICELESS_STOPS.some((stop) => word.endsWith(stop));
}

export type ObjectPronounType =
  | "1_Sing"
  | "2_Sing"
  | "3_Sing"
  | "1_Dual_Incl"
  | "1_Dual_Excl"
  | "2_Dual"
  | "3_Dual"
  | "1+2_Plur_Incl"
  | "1+2_Plur_Excl"
  | "2_Plur"
  | "3_Plur";

export interface ObjectPronounOption {
  gup: string;
  alternatives: string[];
  explanation: string;
}

export const OBJECT_PRONOUNS_GUP: Record<
  ObjectPronounType,
  ObjectPronounOption
> = {
  "1_Sing": {
    gup: "ŋarranha",
    alternatives: ["rranha"],
    explanation: "ŋarranha = me",
  },
  "2_Sing": {
    gup: "nhuna",
    alternatives: [],
    explanation: "nhuna = you",
  },
  "3_Sing": {
    gup: "ŋanya",
    alternatives: ["nya"],
    explanation: "ŋanya = him/her/it",
  },
  "1_Dual_Incl": {
    gup: "ŋalitjalanha",
    alternatives: ["ŋilitjalanha", "litjalanha"],
    explanation: "ŋalitjalanha = us (dual inclusive)",
  },
  "1_Dual_Excl": {
    gup: "ŋalinyalanha",
    alternatives: ["linyalanha", "ŋilinyalanha"],
    explanation: "ŋalinyalanha = us (dual exclusive)",
  },
  "2_Dual": {
    gup: "nhumalanha",
    alternatives: [],
    explanation: "nhumalanha = you two",
  },
  "3_Dual": {
    gup: "maṉḏanha",
    alternatives: [],
    explanation: "maṉḏanha = them two",
  },
  "1+2_Plur_Incl": {
    gup: "ŋalimurrunha",
    alternatives: ["ŋilimurrunha", "limurrunha"],
    explanation: "ŋalimurrunha = us (plural inclusive)",
  },
  "1+2_Plur_Excl": {
    gup: "ŋanapurrunha",
    alternatives: ["napurrunha"],
    explanation: "ŋanapurrunha = us (plural exclusive)",
  },
  "2_Plur": {
    gup: "nhumalanha",
    alternatives: [],
    explanation: "nhumalanha = you all",
  },
  "3_Plur": {
    gup: "walalanha",
    alternatives: [],
    explanation: "walalanha = them",
  },
};

export const OBJECT_PRONOUN_TRIGGERS_ES: Record<string, ObjectPronounType[]> = {
  me: ["1_Sing"],
  mi: ["1_Sing"],
  mí: ["1_Sing"],
  "a mí": ["1_Sing"],
  "a mi": ["1_Sing"],
  te: ["2_Sing"],
  ti: ["2_Sing"],
  tu: ["2_Sing"],
  tú: ["2_Sing"],
  "a ti": ["2_Sing"],
  lo: ["3_Sing"],
  la: ["3_Sing"],
  le: ["3_Sing"],
  su: ["3_Sing"],
  "a él": ["3_Sing"],
  "a el": ["3_Sing"],
  "a ella": ["3_Sing"],
  "a usted": ["3_Sing"],
  nos: ["1_Dual_Incl", "1_Dual_Excl", "1+2_Plur_Incl", "1+2_Plur_Excl"],
  "a nosotros": [
    "1_Dual_Incl",
    "1_Dual_Excl",
    "1+2_Plur_Incl",
    "1+2_Plur_Excl",
  ],
  "a nosotras": [
    "1_Dual_Incl",
    "1_Dual_Excl",
    "1+2_Plur_Incl",
    "1+2_Plur_Excl",
  ],
  os: ["2_Dual", "2_Plur"],
  "a ustedes": ["2_Dual", "2_Plur"],
  "a vosotros": ["2_Dual", "2_Plur"],
  "a vosotras": ["2_Dual", "2_Plur"],
  los: ["3_Dual", "3_Plur"],
  las: ["3_Dual", "3_Plur"],
  les: ["3_Dual", "3_Plur"],
  "a ellos": ["3_Dual", "3_Plur"],
  "a ellas": ["3_Dual", "3_Plur"],
};

export const OBJECT_PRONOUN_TRIGGERS_EN: Record<string, ObjectPronounType[]> = {
  me: ["1_Sing"],
  you: ["2_Sing", "2_Dual", "2_Plur"],
  him: ["3_Sing"],
  her: ["3_Sing"],
  us: ["1_Dual_Incl", "1_Dual_Excl", "1+2_Plur_Incl", "1+2_Plur_Excl"],
  them: ["3_Dual", "3_Plur"],
  "you two": ["2_Dual"],
  "you all": ["2_Plur"],
  "them two": ["3_Dual"],
  "both of them": ["3_Dual"],
};

export type DjalSuffixType = "wa" | "wu" | "ku" | "gu";

export interface DjalSuffixResult {
  suffixes: DjalSuffixType[];
  explanationEs: string;
}

export function determineDjalSuffix(gupWord: string): DjalSuffixResult {
  const ending = getWordEnding(gupWord);
  const { char, hasGlottal, digraph } = ending;
  const effectiveEnding = digraph || char;

  if (ALL_VOWELS.includes(effectiveEnding)) {
    return {
      suffixes: ["wa", "wu"],
      explanationEs: `"${gupWord}" ends in vowel → -wa / -wu`,
    };
  }

  if (NON_GLOTTAL_STOPS.includes(effectiveEnding)) {
    return {
      suffixes: ["ku"],
      explanationEs: `"${gupWord}" ends in stop → -ku`,
    };
  }

  if (
    LIQUIDS.includes(effectiveEnding) ||
    (hasGlottal && LIQUIDS.includes(char))
  ) {
    return {
      suffixes: ["gu", "wu"],
      explanationEs: `"${gupWord}" ends in liquid → -gu / -wu`,
    };
  }

  if (
    SEMIVOWELS.includes(effectiveEnding) ||
    (hasGlottal && SEMIVOWELS.includes(char))
  ) {
    return {
      suffixes: ["gu", "wu"],
      explanationEs: `"${gupWord}" ends in semivowel → -gu / -wu`,
    };
  }

  if (NASALS.includes(effectiveEnding)) {
    return {
      suffixes: ["gu"],
      explanationEs: `"${gupWord}" ends in nasal → -gu`,
    };
  }

  return {
    suffixes: ["gu"],
    explanationEs: `"${gupWord}" → default -gu`,
  };
}

export function applyDjalSuffix(
  gupWord: string,
  suffix: DjalSuffixType
): string {
  const normalized = gupWord.replace(/['ʼ`']/g, "'");
  const withoutGlottal = normalized.endsWith("'")
    ? normalized.slice(0, -1)
    : normalized;
  return validarFonologia(withoutGlottal + suffix);
}

export function filterTypesByDual(
  types: ObjectPronounType[],
  hasDualMarker: boolean
): ObjectPronounType[] {
  if (!hasDualMarker) return types;
  const dualTypes = types.filter((t) => t.includes("Dual"));
  return dualTypes.length > 0 ? dualTypes : types;
}

export interface LanguageConfig {
  pronouns: string[];
  connectors: string[];
  dualMarkers: string[];
  manyMarkers: string[];
  allMarkers: string[];
  otherPluralMarkers: string[];
  thisWords: string[];
  thatWords: string[];
  definiteArticles: string[];
  copulaVerbs: string[];
  whoseSkipWords: string[];
  copulaPersonMap: Record<string, PersonNumber | null>;
  pronounTriggers: Record<string, PersonNumber>;
  dualSubjectPatterns: Record<string, PersonNumber>;
  skipWords: string[];
  negation: string[];
  objectPronounTriggers: Record<string, ObjectPronounType[]>;
  subjectPronounsGup: Record<PersonNumber, string[]>;
  possessiveTriggers: Record<string, PersonNumber>;
  possessiveOfDeTriggers: Record<string, PersonNumber>;
  possessivePronounsGup: Record<PersonNumber, string[]>;
  locativeTriggers: string[];
  conWithTriggers: string[];
  comitativePronounTriggers: Record<string, PersonNumber>;
  comitativePronounsGup: Record<PersonNumber, string[]>;
  humanAllativePronounTriggers: Record<string, PersonNumber>;
  humanAllativePronounsGup: Record<PersonNumber, string[]>;
  humanAblativePronounTriggers: Record<string, PersonNumber>;
  humanAblativePronounsGup: Record<PersonNumber, string[]>;
  sourceOriginPronounTriggers: Record<string, PersonNumber>;
  sourceOriginPronounsGup: Record<PersonNumber, string[]>;
  purposePronounTriggers: Record<string, PersonNumber>;
  purposePronounsGup: Record<PersonNumber, string[]>;
  skipWordsWhereTo: string[];
  option: string;
  trad: string;
  desglose: string;
  upPositionTriggers: string[];
  thereIsPhrases: [string, PersonNumber | null][];
  thereIsNoPhrases: [string, PersonNumber | null][];
  hasNoPhrases: [string, PersonNumber | null][];
  fullOfPhrases: [string, PersonNumber | null][];
  without: string[];
  skipWordsWho: string[];
  mirriConjugations: VerbConjugation[];
  miriwConjugations: VerbConjugation[];
  pluralKey: "esPlural" | "enPlural";
  auxiliary: Record<string, number>;
  lyingPositionTriggers: string[];
  fixed: Record<string, FixedEntry>;
  todayMarkers: string[];
  yesterdayMarkers: string[];
  specifiedFutureMarkers: string[];
  alreadyMarkers: string[];
  continuousImperativeMarkers: string[];
  questionWordMap: Record<string, QuestionType>;
  defaultNegationWord: string;
  copulaPastForms: string[];
  copulaFutureForms: string[];
  copulaImperfectForms: string[];
  labelKey: "labelEs" | "labelEn";
  patterns: VerbPattern[];
  djalNeg: string;
  explainKey: "explanationEs" | "explanationEn";
  unknownKey: string;
  nounKey: string;
  hara: string;
  alternative: string;
  noPronounForThings: string;
  objectPronoun: string;
  person: string;
  thing: string;
  nothing: string;
  noun: string;
  nhaPerson: string;
  notPersonNoNha: string;
  ifPerson: string;
  ifNotPerson: string;
  personMarkedWithA: string;
  ifPersonShort: string;
  ifNotShort: string;
  hasPersonalA: boolean;
  impliedSubjectFrom: string;
  copulaVerbless: string;
  withWord: string;
  withoutLacking: string;
  placeNamesNoNgura: string;
  ifPlaceNameNoNgura: string;
  locativeSuffix: string;
  allativeSuffix: string;
  withPerson: string;
  withThing: string;
  instrumentalTriggers: string[];
  instrumentalThing: string;
  instrumentalPerson: string;
  transportTriggers: string[];
  vehicles: string[];
  transportLabel: string;
  transportOption: string;
  possessive: string;
  proPosessive: string;
  possessed: string;
  nonHuman: string;
  humanObject: string;
  nonHumanObject: string;
  impliedSubject: string;
  answerLabel: string;
  meansTransport: string;
  destinationLabel: string;
  howWords: string[];
  adjectiveAfterNoun: boolean;
  contractionWords: string[];
  possessor: string;
  base: string;
  pos: string;
  pronoun: string;
  verbModal: string;
  sustantivo: string;
  objecto: string;
  adjective: string;
  adverb: string;
  purpose: string;
  ergative: string;
  subjectLabel: string;
  verb: string;
  place: string;
  unknownWord: string;
  pronounPurpose: string;
  noNumberMarkerSingular: string;
  dual: string;
  pluralWurru: string;
  irregularPlural: string;
  pluralMala: string;
  pluralMarker3Plus: string;
  pluralHuman: string;
  pluralNonHuman: string;
  pluralMalaHuman: string;
  pluralMalaNonHuman: string;
  dharrwaMany: string;
  pluralDharrwaMany: string;
  bukmakAll: string;
  pluralBukmakAll: string;
  warrpamAll: string;
  pluralWarrpamAll: string;
  detectedDual: string;
  detectedPlural3Plus: string;
  detectedPluralMany: string;
  detectedPluralAll: string;
  gerundEndings: string[];
  particle: string;
  locativePrefixes: string[];
  hasCompoundTense: boolean;
  clitics: string[];
  hasQuestionInversion: boolean;
  whoseCompoundPattern: { preposition: string; words: string[] } | null;
  hasLessFulSuffixes: boolean;
  miriwWithout: string;
  miriwNoHave: string;
  miriwWithoutSimple: string;
  miriwNegationHave: string;
  mirriNegationLack: string;
  miriwLackMiss: string;
  miriwLessSuffix: string;
  mirriFulSuffix: string;
  mirriThereIs: string;
  mirriFullOf: string;
  mirriHavePossess: string;
  locativeExplanation: string;
  conWithExplanation: string;
  copulaPositionalExplanation: string;
  definido: string;
  endsInVowel: string;
  endsInStop: string;
  endsInLiquid: string;
  endsInSemivowel: string;
  endsInNasal: string;
  defaultSuffix: string;
  negContinuousImperative: string;
  continuousImperative: string;
  negImperative: string;
  imperative: string;
  negContinuousFuture: string;
  continuousFuture: string;
  negFuture: string;
  future: string;
  willdo: string;
  todayUnspecified: string;
  tomorrowNext: string;
  notTodaySpecified: string;
  yesterdaySpecified: string;
  continuousPastToday: string;
  pastToday: string;
  continuousPastYesterday: string;
  pastYesterday: string;
  present: string;
  primaryForm: string;
  directionWord: string;
  secondaryForm: string;
  tertiaryForm: string;
  baseFormNoRule: string;
  connector: string;
  weInclusive2: string;
  weExclusive2: string;
  weInclusive3Plus: string;
  weExclusive3Plus: string;
  youTwo: string;
  you3Plus: string;
  theyTwo: string;
  they3Plus: string;
  pronounArrow: string;
  nounArrow: string;
  nounErgative: string;
  nameErgative: string;
  nameNoTranslation: string;
  impliedSubjectConjugation: string;
  dualMarkerLabel: string;
  whereTriggers: string[];
  whereToTriggers: string[];
  whereFromTriggers: string[];
  toWhomTriggers: string[];
  whoseTriggers: string[];
  whomForTriggers: string[];
  whoTriggers: string[];
  whatTriggers: string[];
  whyTriggers: string[];
  withWhatTriggers: string[];
  byWhomTriggers: string[];
  estarBeForms: string[];
  pluralArticles: string[];
  questionSkipWords: string[];
  thisLabelExplanation: string;
  thatLabelExplanation: string;
  wantLabelExplanation: string;
  knowLabelExplanation: string;
  transitiveExplanation: string;
  intransitiveExplanation: string;
  detectFutureAction: (
    tokens: string[]
  ) => { personNumber: PersonNumber; indices: number[] } | null;
  detectWantKnow: (tokens: string[]) => {
    personNumber: PersonNumber;
    verbType: "djäl" | "marŋgi";
    indices: number[];
  } | null;
  directionAwayTriggers: string[];
  directionTowardsTriggers: string[];
  directionAwayVerbs: string[];
  directionTowardsVerbs: string[];
  directionAwayLabel: string;
  directionTowardsLabel: string;
  fromTriggers: string[];
  toTriggers: string[];
  allativeSuffixLabel: string;
  ablativeSuffixLabel: string;
  unknownGoalDirectionLabel: string;
  indirectObjectClitics: Record<string, PersonNumber>;
  indirectObjectPrepositions: string[];
  indirectObjectLabel: string;
  disclaimerNote: string;
}

export const LOCATIVE_TRIGGERS_ES = [
  "dentro de la",
  "dentro de los",
  "dentro de las",
  "dentro de un",
  "dentro de una",
  "dentro del",
  "dentro de",
  "cerca de la",
  "cerca de los",
  "cerca de las",
  "cerca de un",
  "cerca de una",
  "cerca del",
  "cerca de",
  "lejos de la",
  "lejos de los",
  "lejos de las",
  "lejos del",
  "lejos de",
  "fuera de la",
  "fuera de los",
  "fuera de las",
  "fuera del",
  "fuera de",
  "encima de la",
  "encima de los",
  "encima de las",
  "encima del",
  "encima de",
  "debajo de la",
  "debajo de los",
  "debajo de las",
  "debajo del",
  "debajo de",
  "detrás de la",
  "detrás de los",
  "detrás de las",
  "detrás del",
  "detrás de",
  "detras de la",
  "detras de los",
  "detras de las",
  "detras del",
  "detras de",
  "delante de la",
  "delante de los",
  "delante de las",
  "delante del",
  "delante de",
  "al lado de la",
  "al lado de los",
  "al lado de las",
  "al lado de un",
  "al lado de una",
  "al lado del",
  "al lado de",
  "en el",
  "en la",
  "en los",
  "en las",
  "en un",
  "en una",
  "en unos",
  "en unas",
  "está en",
  "esta en",
  "están en",
  "estan en",
  "estaba en",
  "estaban en",
  "estuvo en",
  "estuvieron en",
  "estará en",
  "estaran en",
  "estaré en",
  "estare en",
  "estarás en",
  "estaras en",
  "estaremos en",
  "estarán en",
  "estoy en",
  "estás en",
  "estas en",
  "estamos en",
  "en",
];

export const LOCATIVE_TRIGGERS_EN = [
  "inside the",
  "inside a",
  "inside an",
  "near the",
  "near a",
  "near an",
  "close to the",
  "close to a",
  "close to an",
  "far from the",
  "far from a",
  "far from an",
  "outside the",
  "outside a",
  "outside an",
  "behind the",
  "behind a",
  "behind an",
  "in front of the",
  "in front of a",
  "in front of an",
  "above the",
  "above a",
  "above an",
  "below the",
  "below a",
  "below an",
  "under the",
  "under a",
  "under an",
  "in the",
  "at the",
  "on the",
  "in a",
  "at a",
  "on a",
  "is in",
  "is at",
  "is on",
  "are in",
  "are at",
  "are on",
  "was in",
  "was at",
  "was on",
  "were in",
  "were at",
  "were on",
  "will be in",
  "will be at",
  "will be on",
  "am in",
  "am at",
  "am on",
  "i'm in",
  "i'm at",
  "i'm on",
  "im in",
  "im at",
  "im on",
  "they're in",
  "they're at",
  "they're on",
  "theyre in",
  "theyre at",
  "theyre on",
  "we're in",
  "we're at",
  "we're on",
  "were in",
  "you're in",
  "you're at",
  "you're on",
  "youre in",
  "youre at",
  "youre on",
  "he's in",
  "he's at",
  "he's on",
  "hes in",
  "hes at",
  "hes on",
  "she's in",
  "she's at",
  "she's on",
  "shes in",
  "shes at",
  "shes on",
  "beside the",
  "beside a",
  "beside an",
  "beside my",
  "beside your",
  "beside his",
  "beside her",
  "beside our",
  "beside their",
  "beside",
  "next to the",
  "next to a",
  "next to an",
  "next to my",
  "next to your",
  "next to his",
  "next to her",
  "next to our",
  "next to their",
  "next to",
  "alongside the",
  "alongside a",
  "alongside an",
  "alongside",
  "to the",
  "to a",
  "to an",
  "towards the",
  "towards a",
  "towards an",
  "toward the",
  "toward a",
  "toward an",
  "to",
];

export interface LocativeReinforcerInfo {
  prefix: string;
  gup: string;
  explanationEs: string;
  explanationEn: string;
}

export const LOCATIVE_REINFORCERS: LocativeReinforcerInfo[] = [
  {
    prefix: "dentro",
    gup: "djinaga",
    explanationEs: "djinaga (adentro)",
    explanationEn: "djinaga (inside)",
  },
  {
    prefix: "inside",
    gup: "djinaga",
    explanationEs: "djinaga (adentro)",
    explanationEn: "djinaga (inside)",
  },
  {
    prefix: "cerca",
    gup: "galki",
    explanationEs: "galki (cerca)",
    explanationEn: "galki (near)",
  },
  {
    prefix: "near",
    gup: "galki",
    explanationEs: "galki (cerca)",
    explanationEn: "galki (near)",
  },
  {
    prefix: "close to",
    gup: "galki",
    explanationEs: "galki (cerca)",
    explanationEn: "galki (near)",
  },
  {
    prefix: "al lado",
    gup: "galki",
    explanationEs: "galki (al lado)",
    explanationEn: "galki (beside)",
  },
  {
    prefix: "beside",
    gup: "galki",
    explanationEs: "galki (al lado)",
    explanationEn: "galki (beside)",
  },
  {
    prefix: "next to",
    gup: "galki",
    explanationEs: "galki (al lado)",
    explanationEn: "galki (beside)",
  },
  {
    prefix: "alongside",
    gup: "galki",
    explanationEs: "galki (al lado)",
    explanationEn: "galki (beside)",
  },
  {
    prefix: "lejos",
    gup: "barrku",
    explanationEs: "barrku (lejos)",
    explanationEn: "barrku (far)",
  },
  {
    prefix: "far",
    gup: "barrku",
    explanationEs: "barrku (lejos)",
    explanationEn: "barrku (far)",
  },
  {
    prefix: "fuera",
    gup: "dhärra",
    explanationEs: "dhärra (afuera)",
    explanationEn: "dhärra (outside)",
  },
  {
    prefix: "outside",
    gup: "dhärra",
    explanationEs: "dhärra (afuera)",
    explanationEn: "dhärra (outside)",
  },
  {
    prefix: "encima",
    gup: "gapu",
    explanationEs: "gapu (encima)",
    explanationEn: "gapu (above)",
  },
  {
    prefix: "above",
    gup: "gapu",
    explanationEs: "gapu (encima)",
    explanationEn: "gapu (above)",
  },
  {
    prefix: "debajo",
    gup: "djinaga",
    explanationEs: "djinaga (debajo)",
    explanationEn: "djinaga (below)",
  },
  {
    prefix: "below",
    gup: "djinaga",
    explanationEs: "djinaga (debajo)",
    explanationEn: "djinaga (below)",
  },
  {
    prefix: "under",
    gup: "djinaga",
    explanationEs: "djinaga (debajo)",
    explanationEn: "djinaga (below)",
  },
  {
    prefix: "detrás",
    gup: "ḻikan",
    explanationEs: "ḻikan (detrás)",
    explanationEn: "ḻikan (behind)",
  },
  {
    prefix: "detras",
    gup: "ḻikan",
    explanationEs: "ḻikan (detrás)",
    explanationEn: "ḻikan (behind)",
  },
  {
    prefix: "behind",
    gup: "ḻikan",
    explanationEs: "ḻikan (detrás)",
    explanationEn: "ḻikan (behind)",
  },
  {
    prefix: "delante",
    gup: "ŋunhi",
    explanationEs: "ŋunhi (delante)",
    explanationEn: "ŋunhi (in front)",
  },
  {
    prefix: "in front",
    gup: "ŋunhi",
    explanationEs: "ŋunhi (delante)",
    explanationEn: "ŋunhi (in front)",
  },
];

export function applyLocativeSuffix(gupWord: string): string {
  return validarFonologia(gupWord + "ŋura");
}

export function applyAllativeSuffix(gupWord: string): string {
  return validarFonologia(gupWord + "lili");
}

export const ABLATIVE_SUFFIX = "ŋuru";

export function applyAblativeSuffix(gupWord: string): string {
  return validarFonologia(gupWord + ABLATIVE_SUFFIX);
}

export type MotionGoalDirection = "towards" | "away" | "unknown";

export const FROM_TRIGGERS_ES = [
  "desde",
  "desde el",
  "desde la",
  "desde los",
  "desde las",
  "de",
  "del",
  "de la",
  "de los",
  "de las",
  "de un",
  "de una",
  "saliendo de",
  "viniendo de",
  "afuera de",
  "fuera de",
];

export const FROM_TRIGGERS_EN = [
  "from",
  "from the",
  "from a",
  "from an",
  "out of",
  "away from",
  "coming from",
  "leaving",
];

export const TO_TRIGGERS_ES = [
  "a",
  "al",
  "a la",
  "a los",
  "a las",
  "hacia",
  "hacia el",
  "hacia la",
  "para",
  "para el",
  "para la",
  "entrando a",
  "yendo a",
];

export const TO_TRIGGERS_EN = [
  "to",
  "to the",
  "to a",
  "to an",
  "into",
  "into the",
  "towards",
  "toward",
  "heading to",
  "going to",
];

export const CON_WITH_TRIGGERS_ES = [
  "con el",
  "con la",
  "con los",
  "con las",
  "con un",
  "con una",
  "con unos",
  "con unas",
  "con mi",
  "con tu",
  "con su",
  "con nuestro",
  "con nuestra",
  "junto a",
  "junto al",
  "junto con",
  "con",
];

export const CON_WITH_TRIGGERS_EN = [
  "with the",
  "with a",
  "with an",
  "with my",
  "with your",
  "with his",
  "with her",
  "with our",
  "with their",
  "with",
];

export const INSTRUMENTAL_TRIGGERS_ES = [
  "mediante",
  "usando",
  "a través de",
  "por medio de",
];

export const INSTRUMENTAL_TRIGGERS_EN = [
  "using",
  "by means of",
  "through",
  "via",
];

export const VEHICLES_ES = [
  "avión",
  "avion",
  "carro",
  "coche",
  "auto",
  "bus",
  "autobús",
  "autobus",
  "tren",
  "barco",
  "bote",
  "lancha",
  "bicicleta",
  "bici",
  "moto",
  "taxi",
  "metro",
  "helicóptero",
  "helicoptero",
  "ferry",
  "canoa",
];

export const VEHICLES_EN = [
  "plane",
  "airplane",
  "car",
  "bus",
  "train",
  "boat",
  "ship",
  "bike",
  "bicycle",
  "motorcycle",
  "truck",
  "taxi",
  "cab",
  "subway",
  "metro",
  "helicopter",
  "ferry",
  "canoe",
  "jet",
];

export const TRANSPORT_TRIGGERS_ES = ["en", "por"];

export const TRANSPORT_TRIGGERS_EN = ["by", "in", "on"];

export const DIRECTION_AWAY_TRIGGERS_ES = [
  "hacia allá",
  "hacia alla",
  "por allá",
  "por alla",
  "hacia ese lado",
  "hacia aquel lado",
  "hacia afuera",
  "para allá",
  "para alla",
  "lejos",
];

export const DIRECTION_TOWARDS_TRIGGERS_ES = [
  "hacia acá",
  "hacia aca",
  "por acá",
  "por aca",
  "hacia aquí",
  "hacia aqui",
  "hacia este lado",
  "hacia adentro",
  "para acá",
  "para aca",
];

export const DIRECTION_AWAY_TRIGGERS_EN = [
  "that way",
  "over there",
  "away",
  "outward",
  "outwards",
];

export const DIRECTION_TOWARDS_TRIGGERS_EN = [
  "this way",
  "over here",
  "here",
  "inward",
  "inwards",
  "towards me",
  "toward me",
];

export type MotionDirection = "away" | "towards" | null;

export const MOTION_DIRECTION_GUP = {
  away: "bala",
  towards: "räli",
};

export const DIRECTION_AWAY_VERBS_ES = [
  "ir",
  "voy",
  "vas",
  "va",
  "vamos",
  "vais",
  "van",
  "iba",
  "ibas",
  "íbamos",
  "ibais",
  "iban",
  "fui",
  "fuiste",
  "fue",
  "fuimos",
  "fuisteis",
  "fueron",
  "iré",
  "irás",
  "irá",
  "iremos",
  "iréis",
  "irán",
  "iría",
  "irías",
  "iríamos",
  "iríais",
  "irían",
  "vaya",
  "vayas",
  "vayamos",
  "vayáis",
  "vayan",
  "llevar",
  "llevo",
  "llevas",
  "lleva",
  "llevamos",
  "lleváis",
  "llevan",
  "llevaba",
  "llevabas",
  "llevábamos",
  "llevabais",
  "llevaban",
  "llevé",
  "llevaste",
  "llevó",
  "llevamos",
  "llevasteis",
  "llevaron",
  "llevaré",
  "llevarás",
  "llevará",
  "llevaremos",
  "llevaréis",
  "llevarán",
  "llevaría",
  "llevarías",
  "llevaríamos",
  "llevaríais",
  "llevarían",
  "lleve",
  "lleves",
  "llevemos",
  "llevéis",
  "lleven",
  "yendo",
  "llevando",
];

export const DIRECTION_TOWARDS_VERBS_ES = [
  "venir",
  "vengo",
  "vienes",
  "viene",
  "venimos",
  "venís",
  "vienen",
  "venía",
  "venías",
  "veníamos",
  "veníais",
  "venían",
  "vine",
  "viniste",
  "vino",
  "vinimos",
  "vinisteis",
  "vinieron",
  "vendré",
  "vendrás",
  "vendrá",
  "vendremos",
  "vendréis",
  "vendrán",
  "vendría",
  "vendrías",
  "vendríamos",
  "vendríais",
  "vendrían",
  "venga",
  "vengas",
  "vengamos",
  "vengáis",
  "vengan",
  "traer",
  "traigo",
  "traes",
  "trae",
  "traemos",
  "traéis",
  "traen",
  "traía",
  "traías",
  "traíamos",
  "traíais",
  "traían",
  "traje",
  "trajiste",
  "trajo",
  "trajimos",
  "trajisteis",
  "trajeron",
  "traeré",
  "traerás",
  "traerá",
  "traeremos",
  "traeréis",
  "traerán",
  "traería",
  "traerías",
  "traeríamos",
  "traeríais",
  "traerían",
  "traiga",
  "traigas",
  "traigamos",
  "traigáis",
  "traigan",
  "viniendo",
  "trayendo",
];

export const DIRECTION_AWAY_VERBS_EN = [
  "go",
  "goes",
  "going",
  "went",
  "gone",
  "take",
  "takes",
  "taking",
  "took",
  "taken",
  "leave",
  "leaves",
  "leaving",
  "left",
  "depart",
  "departs",
  "departing",
  "departed",
];

export const DIRECTION_TOWARDS_VERBS_EN = [
  "come",
  "comes",
  "coming",
  "came",
  "bring",
  "brings",
  "bringing",
  "brought",
  "arrive",
  "arrives",
  "arriving",
  "arrived",
  "return",
  "returns",
  "returning",
  "returned",
];

export type HumanAssociativeSuffixType = "wala" | "kala" | "gala";

export function determineHumanAssociativeSuffix(
  gupWord: string
): HumanAssociativeSuffixType[] {
  const word = gupWord.trim();
  const ending = getWordEnding(word);
  const { char, hasGlottal, digraph } = ending;
  const effectiveEnding = digraph || char;

  if (hasGlottal) {
    const charBeforeGlottal = digraph || char;
    if (ALL_VOWELS.includes(charBeforeGlottal)) {
      return ["wala"];
    }
    if (NASALS.includes(charBeforeGlottal)) {
      return ["kala"];
    }
    if (
      LIQUIDS.includes(charBeforeGlottal) ||
      SEMIVOWELS.includes(charBeforeGlottal)
    ) {
      return ["kala", "wala"];
    }
    return ["kala"];
  }

  if (ALL_VOWELS.includes(effectiveEnding)) {
    return ["wala"];
  }

  if (NASALS.includes(effectiveEnding)) {
    return ["gala"];
  }

  if (NON_GLOTTAL_STOPS.includes(effectiveEnding)) {
    return ["kala"];
  }

  if (
    LIQUIDS.includes(effectiveEnding) ||
    SEMIVOWELS.includes(effectiveEnding)
  ) {
    return ["gala", "wala"];
  }

  return ["gala"];
}

export function applyHumanAssociativeSuffix(
  gupWord: string,
  suffix: HumanAssociativeSuffixType
): string {
  const word = gupWord.replace(/['ʼ`']/g, "'").trim();
  const withoutGlottal = word.endsWith("'") ? word.slice(0, -1) : word;
  return validarFonologia(withoutGlottal + suffix);
}

export type HumanAblativeSuffixType =
  | "walaŋuŋuru"
  | "kalaŋuŋuru"
  | "galaŋuŋuru";

export function determineHumanAblativeSuffix(
  gupWord: string
): HumanAblativeSuffixType[] {
  const word = gupWord.trim();
  const ending = getWordEnding(word);
  const { char, hasGlottal, digraph } = ending;
  const effectiveEnding = digraph || char;

  if (hasGlottal) {
    const charBeforeGlottal = digraph || char;
    if (ALL_VOWELS.includes(charBeforeGlottal)) {
      return ["walaŋuŋuru"];
    }
    if (NASALS.includes(charBeforeGlottal)) {
      return ["kalaŋuŋuru"];
    }
    if (
      LIQUIDS.includes(charBeforeGlottal) ||
      SEMIVOWELS.includes(charBeforeGlottal)
    ) {
      return ["kalaŋuŋuru", "walaŋuŋuru"];
    }
    return ["kalaŋuŋuru"];
  }

  if (ALL_VOWELS.includes(effectiveEnding)) {
    return ["walaŋuŋuru"];
  }

  if (NASALS.includes(effectiveEnding)) {
    return ["galaŋuŋuru"];
  }

  if (NON_GLOTTAL_STOPS.includes(effectiveEnding)) {
    return ["kalaŋuŋuru"];
  }

  if (
    LIQUIDS.includes(effectiveEnding) ||
    SEMIVOWELS.includes(effectiveEnding)
  ) {
    return ["galaŋuŋuru", "walaŋuŋuru"];
  }

  return ["galaŋuŋuru"];
}

export function applyHumanAblativeSuffix(
  gupWord: string,
  suffix: HumanAblativeSuffixType
): string {
  const word = gupWord.replace(/['ʼ`']/g, "'").trim();
  const withoutGlottal = word.endsWith("'") ? word.slice(0, -1) : word;
  return validarFonologia(withoutGlottal + suffix);
}

export type LocativeVerbType = "nhina" | "dhärra" | "gorruma" | "ŋorra";

export interface LocativeVerbInfo {
  gupKey: LocativeVerbType;
  forms: [string, string, string, string];
  labelEs: string;
  labelEn: string;
  forHuman: boolean;
  forNonHuman: boolean;
  isDefault: "human" | "nonhuman" | null;
}

export const LOCATIVE_VERBS: LocativeVerbInfo[] = [
  {
    gupKey: "nhina",
    forms: ["nhina", "nhini", "nhinana", "nhinanha"],
    labelEs: "sentado/quedarse",
    labelEn: "sitting/staying",
    forHuman: true,
    forNonHuman: false,
    isDefault: "human",
  },
  {
    gupKey: "dhärra",
    forms: ["dhärra", "dhärri", "dhärrana", "dhärranha"],
    labelEs: "de pie/parado",
    labelEn: "standing/upright",
    forHuman: true,
    forNonHuman: true,
    isDefault: "nonhuman",
  },
  {
    gupKey: "gorruma",
    forms: ["gorruma", "gorrumi", "gorrumana", "gorrumanha"],
    labelEs: "arriba/encima",
    labelEn: "up/above",
    forHuman: true,
    forNonHuman: true,
    isDefault: null,
  },
  {
    gupKey: "ŋorra",
    forms: ["ŋorra", "ŋorri", "ŋorrana", "ŋorranha"],
    labelEs: "acostado/tumbado",
    labelEn: "lying down",
    forHuman: true,
    forNonHuman: true,
    isDefault: null,
  },
];

export const UP_POSITION_TRIGGERS_ES = [
  "arriba",
  "encima",
  "en lo alto",
  "sobre el",
  "sobre la",
  "en el árbol",
  "en el arbol",
  "en la cima",
  "subido",
  "subida",
  "trepado",
  "trepada",
  "en el techo",
  "en la rama",
];

export const UP_POSITION_TRIGGERS_EN = [
  "up",
  "above",
  "on top",
  "atop",
  "up in",
  "in the tree",
  "on the tree",
  "at the top",
  "climbed",
  "perched",
  "on the roof",
  "on the branch",
];

export const LYING_POSITION_TRIGGERS_ES = [
  "acostado",
  "acostada",
  "tumbado",
  "tumbada",
  "echado",
  "echada",
  "tendido",
  "tendida",
  "en la cama",
  "en el suelo",
  "en el piso",
  "durmiendo",
  "descansando",
];

export const LYING_POSITION_TRIGGERS_EN = [
  "lying",
  "lying down",
  "laid",
  "laid down",
  "in bed",
  "on the ground",
  "on the floor",
  "sleeping",
  "resting",
  "reclined",
];

export const MANY_MARKERS_ES = ["muchos", "muchas", "varios", "varias"];
export const MANY_MARKERS_EN = [
  "many",
  "lots of",
  "a lot of",
  "lots",
  "several",
];

export const ALL_MARKERS_ES = ["todos", "todas", "todo", "toda"];
export const ALL_MARKERS_EN = ["all", "all the", "every"];

export const OTHER_PLURAL_MARKERS_ES = [
  "los",
  "las",
  "algunos",
  "algunas",
  "pocos",
  "pocas",
  "la mayoría",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "estos",
  "estas",
  "esos",
  "esas",
  "aquellos",
  "aquellas",
];
export const OTHER_PLURAL_MARKERS_EN = [
  "some",
  "few",
  "most",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "these",
  "those",
];

export const QUESTION_WORDS_ES: Record<string, QuestionType> = {
  donde: "where",
  dónde: "where",
  adonde: "where",
  adónde: "where",
  qué: "what",
  que: "what",
  quién: "whom",
  quien: "whom",
  quiénes: "whom",
  quienes: "whom",
  "de quién": "whose",
  "de quien": "whose",
  cómo: "how",
  cuándo: "when",
  cuando: "when",
  "por qué": "why",
  "por que": "why",
};

export const QUESTION_WORDS_EN: Record<string, QuestionType> = {
  where: "where",
  what: "what",
  who: "whom",
  whom: "whom",
  whose: "whose",
  how: "how",
  when: "when",
  why: "why",
};

export const COPULA_PAST_FORMS_ES = [
  "estaba",
  "estabas",
  "estabamos",
  "estábamos",
  "estabais",
  "estaban",
  "estuve",
  "estuviste",
  "estuvo",
  "estuvimos",
  "estuvisteis",
  "estuvieron",
  "era",
  "eras",
  "eramos",
  "éramos",
  "erais",
  "eran",
  "fui",
  "fuiste",
  "fue",
  "fuimos",
  "fuisteis",
  "fueron",
];

export const COPULA_FUTURE_FORMS_ES = [
  "estare",
  "estaré",
  "estaras",
  "estarás",
  "estara",
  "estará",
  "estaremos",
  "estareis",
  "estaréis",
  "estaran",
  "estarán",
  "sere",
  "seré",
  "seras",
  "serás",
  "sera",
  "será",
  "seremos",
  "sereis",
  "seréis",
  "seran",
  "serán",
];

export const COPULA_IMPERFECT_FORMS_ES = [
  "estaba",
  "estabas",
  "estabamos",
  "estábamos",
  "estabais",
  "estaban",
  "era",
  "eras",
  "eramos",
  "éramos",
  "erais",
  "eran",
];

export const COPULA_PAST_FORMS_EN = ["was", "were"];
export const COPULA_FUTURE_FORMS_EN: string[] = [];
export const COPULA_IMPERFECT_FORMS_EN: string[] = [];

export const PATTERNS_ES: VerbPattern[] = [
  {
    name: "estar_present_gerund",
    match: [
      { type: "wordList", words: ESTAR_PRESENT },
      { type: "verbForm", forms: ["gerund"] },
    ],
    result: { tense: "present", isContinuous: true },
  },
  {
    name: "estar_past_gerund",
    match: [
      { type: "wordList", words: ESTAR_PAST },
      { type: "verbForm", forms: ["gerund"] },
    ],
    result: { tense: "past", isContinuous: true },
  },
  {
    name: "estar_future_gerund",
    match: [
      { type: "wordList", words: ESTAR_FUTURE },
      { type: "verbForm", forms: ["gerund"] },
    ],
    result: { tense: "future", isContinuous: true },
  },
  {
    name: "ir_present_a_infinitive",
    match: [
      { type: "wordList", words: IR_PRESENT },
      { type: "literal", word: "a" },
      { type: "verbForm", forms: ["infinitive"] },
    ],
    result: { tense: "future", isContinuous: false },
  },
  {
    name: "ir_past_a_infinitive",
    match: [
      { type: "wordList", words: IR_PAST },
      { type: "literal", word: "a" },
      { type: "verbForm", forms: ["infinitive"] },
    ],
    result: { tense: "past", isContinuous: false },
  },
  {
    name: "seguir_gerund",
    match: [
      { type: "wordList", words: SEGUIR_ALL },
      { type: "verbForm", forms: ["gerund"] },
    ],
    result: { tense: "present", isContinuous: true },
  },
  {
    name: "seguir_a_infinitive",
    match: [
      { type: "wordList", words: SEGUIR_ALL },
      { type: "literal", word: "a" },
      { type: "verbForm", forms: ["infinitive"] },
    ],
    result: { tense: "present", isContinuous: true },
  },
  {
    name: "continuar_gerund",
    match: [
      { type: "wordList", words: CONTINUAR_ALL },
      { type: "verbForm", forms: ["gerund"] },
    ],
    result: { tense: "present", isContinuous: true },
  },
  {
    name: "continuar_a_infinitive",
    match: [
      { type: "wordList", words: CONTINUAR_ALL },
      { type: "literal", word: "a" },
      { type: "verbForm", forms: ["infinitive"] },
    ],
    result: { tense: "present", isContinuous: true },
  },
  {
    name: "haber_past_participle",
    match: [
      { type: "wordList", words: HABER_ALL },
      { type: "verbForm", forms: ["pastParticiple"] },
    ],
    result: { tense: "past", isContinuous: false },
  },
];

export const PATTERNS_EN: VerbPattern[] = [
  {
    name: "be_present_gerund",
    match: [
      { type: "wordList", words: BE_PRESENT },
      { type: "verbForm", forms: ["gerund"] },
    ],
    result: { tense: "present", isContinuous: true },
  },
  {
    name: "be_past_gerund",
    match: [
      { type: "wordList", words: BE_PAST },
      { type: "verbForm", forms: ["gerund"] },
    ],
    result: { tense: "past", isContinuous: true },
  },
  {
    name: "keep_gerund",
    match: [
      { type: "wordList", words: KEEP_ALL },
      { type: "verbForm", forms: ["gerund"] },
    ],
    result: { tense: "present", isContinuous: true },
  },
  {
    name: "continue_gerund",
    match: [
      { type: "wordList", words: CONTINUE_EN_ALL },
      { type: "verbForm", forms: ["gerund"] },
    ],
    result: { tense: "present", isContinuous: true },
  },
  {
    name: "going_to_infinitive",
    match: [
      { type: "wordList", words: ["going"] },
      { type: "literal", word: "to" },
      { type: "verbForm", forms: ["infinitive"] },
    ],
    result: { tense: "future", isContinuous: false },
  },
  {
    name: "have_past_participle",
    match: [
      { type: "wordList", words: HAVE_EN_ALL },
      { type: "verbForm", forms: ["pastParticiple"] },
    ],
    result: { tense: "past", isContinuous: false },
  },
];

export const WHERE_TRIGGERS_ES = ["donde", "dónde"];
export const WHERE_TRIGGERS_EN = ["where"];

export const WHERE_TO_TRIGGERS_ES = ["adonde", "adónde", "a dónde", "a donde"];
export const WHERE_TO_TRIGGERS_EN = ["where to"];

export const WHERE_FROM_TRIGGERS_ES = [
  "de donde",
  "de dónde",
  "desde donde",
  "desde dónde",
];
export const WHERE_FROM_TRIGGERS_EN = ["where from", "from where"];

export const TO_WHOM_TRIGGERS_ES = ["a quién", "a quien"];
export const TO_WHOM_TRIGGERS_EN = ["to whom"];

export const WHOSE_TRIGGERS_ES = ["de quién", "de quien"];
export const WHOSE_TRIGGERS_EN = ["whose"];

export const WHO_TRIGGERS_ES = ["quién", "quien", "quiénes", "quienes"];
export const WHO_TRIGGERS_EN = ["who", "whom"];

export const WHAT_TRIGGERS_ES = ["qué", "que"];
export const WHAT_TRIGGERS_EN = ["what"];

export const WHY_TRIGGERS_ES = ["por qué", "por que", "para qué", "para que"];
export const WHY_TRIGGERS_EN = ["why", "what for", "for what"];

export const WHOM_FOR_TRIGGERS_ES = ["para quién", "para quien"];
export const WHOM_FOR_TRIGGERS_EN = ["for whom", "whom for"];

export const WITH_WHAT_TRIGGERS_ES = ["con qué", "con que"];
export const WITH_WHAT_TRIGGERS_EN = ["with what"];

export const BY_WHOM_TRIGGERS_ES = ["por quién", "por quien"];
export const BY_WHOM_TRIGGERS_EN = ["by whom", "by who"];

export const ESTAR_FORMS_ES = [
  "está",
  "esta",
  "están",
  "estan",
  "estoy",
  "estás",
  "estamos",
  "estáis",
  "estais",
];
export const BE_FORMS_EN = ["is", "are", "am", "was", "were"];

export const PLURAL_ARTICLES_ES = ["los", "las"];
export const PLURAL_ARTICLES_EN: string[] = [];

export const QUESTION_SKIP_WORDS_ES = [
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "a",
  "del",
  "en",
  "con",
  "de",
  "desde",
];
export const QUESTION_SKIP_WORDS_EN = ["the", "a", "an", "to", "from"];

export const QUESTION_GUP: Record<
  NonNullable<QuestionType>,
  { gup: string; es: string; en: string; alternatives?: string[] }
> = {
  where: { gup: "wanha", es: "dónde", en: "where" },
  where_to: {
    gup: "nhäkurru",
    es: "a dónde / en qué",
    en: "where to / into what",
    alternatives: ["wanhawala", "wanhaŋumala", "nhälili"],
  },
  where_from: {
    gup: "wanhaŋuru",
    es: "de dónde",
    en: "where from",
    alternatives: ["nhäŋuru"],
  },
  what: { gup: "nhä", es: "qué", en: "what" },
  what_purpose: { gup: "nhaku", es: "qué (propósito)", en: "what (purpose)" },
  whom: { gup: "yolthu", es: "quién", en: "who/whom" },
  to_whom: { gup: "yolkala", es: "a quién", en: "to whom" },
  whose: { gup: "yolku", es: "de quién", en: "whose" },
  whom_for: { gup: "yolku", es: "para quién", en: "for whom" },
  how: { gup: "nhaltjan", es: "cómo", en: "how" },
  with_what: { gup: "nhaliy", es: "con qué", en: "with what" },
  by_whom: { gup: "yolkala", es: "por quién", en: "by whom", alternatives: ["yolkuwala", "yolkugala"] },
  when: { gup: "wanhami", es: "cuándo", en: "when" },
  why: { gup: "nhäku", es: "por qué", en: "why", alternatives: ["nhaku"] },
};

export const HACER_FUTURE_ES: Record<string, PersonNumber> = {
  haré: "1_Sing",
  hare: "1_Sing",
  harás: "2_Sing",
  haras: "2_Sing",
  hará: "3_Sing",
  hara: "3_Sing",
  haremos: "1+2_Plur",
  haréis: "2_Plur",
  hareis: "2_Plur",
  harán: "3_Plur",
  haran: "3_Plur",
};

export const IR_A_HACER_ES: Record<string, PersonNumber> = {
  voy: "1_Sing",
  vas: "2_Sing",
  va: "3_Sing",
  vamos: "1+2_Plur",
  vais: "2_Plur",
  van: "3_Plur",
};

export const WILL_DO_EN: Record<string, PersonNumber> = {
  i: "1_Sing",
  you: "2_Sing",
  he: "3_Sing",
  she: "3_Sing",
  it: "3_Sing",
  we: "1+2_Plur",
  they: "3_Plur",
};

export const QUERER_FORMS_ES: Record<string, PersonNumber> = {
  quiero: "1_Sing",
  quieres: "2_Sing",
  quiere: "3_Sing",
  queremos: "1+2_Plur",
  queréis: "2_Plur",
  quereis: "2_Plur",
  quieren: "3_Plur",
};

export const SABER_FORMS_ES: Record<string, PersonNumber> = {
  sé: "1_Sing",
  se: "1_Sing",
  sabes: "2_Sing",
  sabe: "3_Sing",
  sabemos: "1+2_Plur",
  sabéis: "2_Plur",
  sabeis: "2_Plur",
  saben: "3_Plur",
};

export const WANT_FORMS_EN = ["want", "wants"];
export const KNOW_FORMS_EN = ["know", "knows"];

function detectFutureActionES(
  tokens: string[]
): { personNumber: PersonNumber; indices: number[] } | null {
  const lowerTokens = tokens.map((t) => t.toLowerCase());
  for (let i = 0; i < lowerTokens.length; i++) {
    const word = lowerTokens[i];
    if (HACER_FUTURE_ES[word]) {
      return { personNumber: HACER_FUTURE_ES[word], indices: [i] };
    }
  }
  for (let i = 0; i < lowerTokens.length - 2; i++) {
    const word = lowerTokens[i];
    if (IR_A_HACER_ES[word]) {
      if (lowerTokens[i + 1] === "a" && lowerTokens[i + 2] === "hacer") {
        return {
          personNumber: IR_A_HACER_ES[word],
          indices: [i, i + 1, i + 2],
        };
      }
    }
  }
  return null;
}

function detectFutureActionEN(
  tokens: string[]
): { personNumber: PersonNumber; indices: number[] } | null {
  const lowerTokens = tokens.map((t) => t.toLowerCase());
  for (let i = 0; i < lowerTokens.length - 2; i++) {
    const subject = lowerTokens[i];
    if (WILL_DO_EN[subject]) {
      if (lowerTokens[i + 1] === "will" && lowerTokens[i + 2] === "do") {
        return {
          personNumber: WILL_DO_EN[subject],
          indices: [i, i + 1, i + 2],
        };
      }
    }
  }
  return null;
}

function detectWantKnowES(tokens: string[]): {
  personNumber: PersonNumber;
  verbType: "djäl" | "marŋgi";
  indices: number[];
} | null {
  const lowerTokens = tokens.map((t) => t.toLowerCase());
  for (let i = 0; i < lowerTokens.length; i++) {
    const word = lowerTokens[i];
    if (QUERER_FORMS_ES[word]) {
      return {
        personNumber: QUERER_FORMS_ES[word],
        verbType: "djäl",
        indices: [i],
      };
    }
    if (SABER_FORMS_ES[word]) {
      return {
        personNumber: SABER_FORMS_ES[word],
        verbType: "marŋgi",
        indices: [i],
      };
    }
  }
  return null;
}

function detectWantKnowEN(tokens: string[]): {
  personNumber: PersonNumber;
  verbType: "djäl" | "marŋgi";
  indices: number[];
} | null {
  const lowerTokens = tokens.map((t) => t.toLowerCase());
  const subjectMap: Record<string, PersonNumber> = {
    i: "1_Sing",
    you: "2_Sing",
    he: "3_Sing",
    she: "3_Sing",
    it: "3_Sing",
    we: "1+2_Plur",
    they: "3_Plur",
  };
  for (let i = 0; i < lowerTokens.length - 1; i++) {
    const subject = lowerTokens[i];
    const verb = lowerTokens[i + 1];
    if (subjectMap[subject]) {
      if (WANT_FORMS_EN.includes(verb)) {
        return {
          personNumber: subjectMap[subject],
          verbType: "djäl",
          indices: [i, i + 1],
        };
      }
      if (KNOW_FORMS_EN.includes(verb)) {
        return {
          personNumber: subjectMap[subject],
          verbType: "marŋgi",
          indices: [i, i + 1],
        };
      }
    }
  }
  return null;
}

export const LANG_CONFIG: Record<LanguageMode, LanguageConfig> = {
  es: {
    pronouns: PRONOUNS_ES,
    skipWordsWhereTo: SKIP_WORDS_WHERE_TO_ES,
    whoseSkipWords: SKIP_WORDS_WHOSE_ES,
    hara: "qué hará",
    option: "Opción",
    trad: "Traducción",
    directionWord: "a",
    desglose: "Desglose",
    connectors: CONNECTOR_WORDS_ES,
    dualMarkers: DUAL_MARKERS_ES,
    manyMarkers: MANY_MARKERS_ES,
    allMarkers: ALL_MARKERS_ES,
    otherPluralMarkers: OTHER_PLURAL_MARKERS_ES,
    thisWords: THIS_WORDS_ES,
    thatWords: THAT_WORDS_ES,
    definiteArticles: DEFINITE_ARTICLE_ES,
    copulaVerbs: COPULA_VERBS_ES,
    copulaPersonMap: COPULA_PERSON_MAP_ES,
    pronounTriggers: PRONOUN_TRIGGERS_ES,
    dualSubjectPatterns: DUAL_SUBJECT_PATTERNS_ES,
    skipWords: SKIP_WORDS_ES,
    negation: NEGATION_ES,
    objectPronounTriggers: OBJECT_PRONOUN_TRIGGERS_ES,
    subjectPronounsGup: SUBJECT_PRONOUNS_GUP,
    possessiveTriggers: POSSESSIVE_TRIGGERS_ES,
    possessiveOfDeTriggers: POSSESSIVE_DE_TRIGGERS_ES,
    possessivePronounsGup: POSSESSIVE_PRONOUNS_GUP,
    locativeTriggers: LOCATIVE_TRIGGERS_ES,
    conWithTriggers: CON_WITH_TRIGGERS_ES,
    comitativePronounTriggers: COMITATIVE_PRONOUN_TRIGGERS_ES,
    comitativePronounsGup: COMITATIVE_PRONOUNS_GUP,
    humanAllativePronounTriggers: HUMAN_ALLATIVE_PRONOUN_TRIGGERS_ES,
    humanAllativePronounsGup: HUMAN_ALLATIVE_PRONOUNS_GUP,
    humanAblativePronounTriggers: HUMAN_ABLATIVE_PRONOUN_TRIGGERS_ES,
    humanAblativePronounsGup: HUMAN_ABLATIVE_PRONOUNS_GUP,
    sourceOriginPronounTriggers: SOURCE_ORIGIN_PRONOUN_TRIGGERS_ES,
    sourceOriginPronounsGup: SOURCE_ORIGIN_PRONOUNS_GUP,
    purposePronounTriggers: PURPOSE_PRONOUN_TRIGGERS_ES,
    purposePronounsGup: POSSESSIVE_PRONOUNS_GUP,
    upPositionTriggers: UP_POSITION_TRIGGERS_ES,
    thereIsPhrases: THERE_IS_PHRASES_ES,
    thereIsNoPhrases: THERE_IS_NO_PHRASES_ES,
    hasNoPhrases: HAS_NO_PHRASES_ES,
    fullOfPhrases: FULL_OF_PHRASES_ES,
    without: WITHOUT_ES,
    mirriConjugations: MIRRI_CONJUGATIONS_ES,
    miriwConjugations: MIRIW_CONJUGATIONS_ES,
    pluralKey: "esPlural",
    auxiliary: AUXILIARY_PERSON_ES,
    lyingPositionTriggers: LYING_POSITION_TRIGGERS_ES,
    fixed: FIXED_TRANSLATIONS_ES,
    todayMarkers: TODAY_MARKERS_ES,
    yesterdayMarkers: YESTERDAY_MARKERS_ES,
    specifiedFutureMarkers: SPECIFIED_FUTURE_MARKERS_ES,
    alreadyMarkers: ALREADY_MARKERS_ES,
    continuousImperativeMarkers: CONTINUOUS_IMPERATIVE_MARKERS_ES,
    questionWordMap: QUESTION_WORDS_ES,
    defaultNegationWord: "no",
    copulaPastForms: COPULA_PAST_FORMS_ES,
    copulaFutureForms: COPULA_FUTURE_FORMS_ES,
    copulaImperfectForms: COPULA_IMPERFECT_FORMS_ES,
    labelKey: "labelEs",
    patterns: PATTERNS_ES,
    djalNeg: "Negación con djäl/marŋgi",
    explainKey: "explanationEs",
    unknownKey: "Palabra desconocida",
    nounKey: "Sustantivo",
    alternative: "alternativa",
    noPronounForThings: "(sin pronombre - para cosas/animales)",
    objectPronoun: "Pronombre objeto",
    person: "persona",
    thing: "cosa",
    nothing: "nada",
    noun: "Sustantivo",
    nhaPerson: "-nha (persona)",
    notPersonNoNha: "no persona, sin -nha",
    ifPerson: "si es persona",
    ifNotPerson: "si no es persona",
    personMarkedWithA: 'persona marcada con "a"',
    ifPersonShort: "si persona",
    ifNotShort: "si no",
    hasPersonalA: true,
    impliedSubjectFrom: "Sujeto implícito de",
    copulaVerbless: "cópula sin verbo",
    withWord: "con",
    withoutLacking: "sin/carente de",
    placeNamesNoNgura:
      "nombres de lugares no llevan -ŋura (el sufijo locativo solo se usa con sustantivos comunes)",
    ifPlaceNameNoNgura:
      "si es nombre de lugar, no lleva -ŋura (los nombres propios de lugares no toman sufijo locativo)",
    locativeSuffix: "sufijo locativo: en/dentro de",
    allativeSuffix: "sufijo alativo: hacia/a",
    withPerson: "con persona",
    withThing: "con cosa",
    instrumentalTriggers: INSTRUMENTAL_TRIGGERS_ES,
    instrumentalThing: "instrumental (cosa)",
    instrumentalPerson: "instrumental (persona)",
    transportTriggers: TRANSPORT_TRIGGERS_ES,
    vehicles: VEHICLES_ES,
    transportLabel: "transporte (vehículo)",
    transportOption: "si es vehículo",
    possessive: "posesivo",
    possessed: "poseído",
    nonHuman: "no humano",
    humanObject: "objeto humano",
    nonHumanObject: "objeto no-humano",
    impliedSubject: "Sujeto implícito por conjugación",
    answerLabel: "respuesta",
    meansTransport: "medio/transporte",
    destinationLabel: "destino",
    howWords: ["cómo", "como"],
    adjectiveAfterNoun: true,
    contractionWords: ["al"],
    proPosessive: "pronombre posesivo",
    base: "forma base",
    pos: "Verbo posicional",
    possessor: "poseedor",
    pronoun: "Pronombre",
    verbModal: "verbo modal",
    sustantivo: "sustantivo con sufijo posesivo",
    objecto: "objeto con sufijo posesivo",
    adjective: "Adjetivo",
    adverb: "Adverbio",
    purpose: "propósito",
    ergative: "ergativo",
    subjectLabel: "sujeto",
    verb: "verbo",
    place: "lugar",
    unknownWord: "palabra desconocida",
    pronounPurpose: "pronombre propósito",
    noNumberMarkerSingular:
      "No se detectó marcador de número, asumiendo singular",
    dual: "dual",
    pluralWurru: "plural -wurru",
    irregularPlural: "plural irregular",
    pluralMala: "plural mala",
    pluralMarker3Plus: "mala = marcador plural (3+)",
    pluralHuman: "plural, humano",
    pluralNonHuman: "plural, no humano",
    pluralMalaHuman: "plural mala - humano",
    pluralMalaNonHuman: "plural mala - no humano",
    dharrwaMany: "dharrwa = muchos (marcador plural)",
    pluralDharrwaMany: "plural dharrwa - muchos",
    bukmakAll: "bukmak = todos (marcador plural)",
    pluralBukmakAll: "plural bukmak - todos",
    warrpamAll: "warrpam' = todos (marcador plural)",
    pluralWarrpamAll: "plural warrpam' - todos",
    detectedDual: "Detectado → dual (2), usar maṉḏa",
    detectedPlural3Plus: "Detectado → plural (3+), usar mala o -wurru",
    detectedPluralMany: "Detectado → plural (muchos), usar dharrwa o -wurru",
    detectedPluralAll:
      "Detectado → plural (todos), usar bukmak/warrpam' o -wurru",
    gerundEndings: ["ando", "iendo", "endo"],
    particle: "Partícula",
    locativePrefixes: [
      "cerca",
      "lejos",
      "dentro",
      "fuera",
      "encima",
      "debajo",
      "detrás",
      "detras",
      "delante",
      "al lado",
      "en frente",
    ],
    hasCompoundTense: true,
    clitics: [
      "melo",
      "telo",
      "selo",
      "noslo",
      "oslo",
      "mela",
      "tela",
      "sela",
      "nosla",
      "osla",
      "melos",
      "telos",
      "selos",
      "noslos",
      "oslos",
      "melas",
      "telas",
      "selas",
      "noslas",
      "oslas",
      "lo",
      "la",
      "los",
      "las",
      "le",
      "les",
      "me",
      "te",
      "nos",
      "os",
      "se",
    ],
    hasQuestionInversion: true,
    whoseCompoundPattern: {
      preposition: "de",
      words: ["quién", "quien", "quiénes", "quienes"],
    },
    skipWordsWho: SKIP_WORDS_WHO_ES,
    hasLessFulSuffixes: false,
    miriwWithout: "sin/no existe → sufijo -miriw",
    miriwNoHave: "no tener → sufijo -miriw",
    miriwWithoutSimple: "sin → sufijo -miriw",
    miriwNegationHave: "negación + tener → sufijo -miriw",
    mirriNegationLack: "negación + carecer → sufijo -mirri",
    miriwLackMiss: "carecer/faltar → sufijo -miriw",
    miriwLessSuffix: "en → sufijo -miriw",
    mirriFulSuffix: "en → sufijo -mirri",
    mirriThereIs: "hay/existe → sufijo -mirri",
    mirriFullOf: "lleno de → sufijo -mirri",
    mirriHavePossess: "tener/haber → sufijo -mirri",
    locativeExplanation: "locativo → sufijo -ŋura",
    conWithExplanation: "con/with → sufijo según tipo de sustantivo",
    copulaPositionalExplanation: "Copula + locativo → verbo posicional",
    definido: "definido",
    endsInVowel: "termina en vocal → sufijos",
    endsInStop: "termina en oclusiva → sufijo",
    endsInLiquid: "termina en líquida → sufijos",
    endsInSemivowel: "termina en semivocal → sufijos",
    endsInNasal: "termina en nasal → sufijo",
    defaultSuffix: "sufijo por defecto",
    weInclusive2: "nosotros dos inclusivo (tú y yo)",
    weExclusive2: "nosotros dos exclusivo (yo y él/ella)",
    weInclusive3Plus: "nosotros 3+ inclusivo (tú y yo y otros)",
    weExclusive3Plus: "nosotros 3+ exclusivo (yo y ellos)",
    youTwo: "ustedes/vosotros dos",
    you3Plus: "ustedes/vosotros 3+",
    theyTwo: "ellos/ellas dos",
    they3Plus: "ellos/ellas 3+",
    pronounArrow: "Pronombre",
    nounArrow: "Sustantivo",
    nounErgative: "ergativo",
    nameErgative: "ergativo",
    nameNoTranslation: "sin traducción",
    impliedSubjectConjugation: "Sujeto implícito por conjugación",
    dualMarkerLabel: "dual",
    negContinuousImperative:
      "Imperativo negativo continuo: yaka + gi + forma secundaria (¡no sigas haciendo!)",
    continuousImperative:
      "Imperativo continuo: gi + forma secundaria (¡sigue haciendo!)",
    negImperative: "Imperativo negativo: yaka + forma secundaria (¡no hagas!)",
    imperative: "Imperativo: usa forma secundaria",
    negContinuousFuture: "Futuro continuo negativo",
    continuousFuture: "Futuro continuo",
    negFuture: "Futuro negativo",
    future: "Futuro",
    willdo: "hacer (futuro)",
    todayUnspecified: "[HOY/NO ESPECIFICADO]",
    tomorrowNext: "(mañana/próximo)",
    notTodaySpecified: "[NO HOY & ESPECIFICADO]",
    yesterdaySpecified: "[AYER/ESPECIFICADO]",
    continuousPastToday: "Pasado continuo (hoy)",
    pastToday: "Pasado (hoy)",
    continuousPastYesterday: "Pasado continuo (ayer)",
    pastYesterday: "Pasado (ayer)",
    present: "Presente",
    primaryForm: "forma primaria",
    secondaryForm: "forma secundaria",
    tertiaryForm: "forma terciaria",
    baseFormNoRule: "Forma base (sin regla específica)",
    connector: "Conector",
    whereTriggers: WHERE_TRIGGERS_ES,
    whereToTriggers: WHERE_TO_TRIGGERS_ES,
    whereFromTriggers: WHERE_FROM_TRIGGERS_ES,
    toWhomTriggers: TO_WHOM_TRIGGERS_ES,
    whoseTriggers: WHOSE_TRIGGERS_ES,
    whomForTriggers: WHOM_FOR_TRIGGERS_ES,
    whoTriggers: WHO_TRIGGERS_ES,
    whatTriggers: WHAT_TRIGGERS_ES,
    whyTriggers: WHY_TRIGGERS_ES,
    withWhatTriggers: WITH_WHAT_TRIGGERS_ES,
    byWhomTriggers: BY_WHOM_TRIGGERS_ES,
    estarBeForms: ESTAR_FORMS_ES,
    pluralArticles: PLURAL_ARTICLES_ES,
    questionSkipWords: QUESTION_SKIP_WORDS_ES,
    thisLabelExplanation: "esto/este/esta",
    thatLabelExplanation: "eso/ese/esa",
    wantLabelExplanation: "querer",
    knowLabelExplanation: "saber",
    transitiveExplanation: "transitivo: yolthu + objeto + verbo",
    intransitiveExplanation: "intransitivo: yolthu + verbo",
    detectFutureAction: detectFutureActionES,
    detectWantKnow: detectWantKnowES,
    directionAwayTriggers: DIRECTION_AWAY_TRIGGERS_ES,
    directionTowardsTriggers: DIRECTION_TOWARDS_TRIGGERS_ES,
    directionAwayVerbs: DIRECTION_AWAY_VERBS_ES,
    directionTowardsVerbs: DIRECTION_TOWARDS_VERBS_ES,
    directionAwayLabel: "bala = movimiento alejándose del hablante",
    directionTowardsLabel: "räli = movimiento hacia el hablante",
    fromTriggers: FROM_TRIGGERS_ES,
    toTriggers: TO_TRIGGERS_ES,
    allativeSuffixLabel: "-lili = hacia/a (movimiento hacia algo)",
    ablativeSuffixLabel: "-ŋuru = desde/de (movimiento alejándose de algo)",
    unknownGoalDirectionLabel:
      "dirección desconocida: mostrando ambas opciones",
    indirectObjectClitics: {
      me: "1_Sing",
      te: "2_Sing",
      le: "3_Sing",
      les: "3_Plur",
      nos: "1+3_Plur",
      se: "3_Sing",
    } as Record<string, PersonNumber>,
    indirectObjectPrepositions: ["a", "para"],
    indirectObjectLabel: "objeto indirecto",
    disclaimerNote: "Ojo: este diccionario aún está en desarrollo. Con el tiempo continuará mejorándose. Las entradas en castellano están verificadas. El inglés y otros idiomas se añadirán gradualmente. Y también, nota que el orden de las palabras en una frase de Gupapuyŋu no está fijo, se puede colocar la palabra que se quiere enfatizar primero.",
  },
  en: {
    pronouns: PRONOUNS_EN,
    connectors: CONNECTOR_WORDS_EN,
    dualMarkers: DUAL_MARKERS_EN,
    manyMarkers: MANY_MARKERS_EN,
    allMarkers: ALL_MARKERS_EN,
    otherPluralMarkers: OTHER_PLURAL_MARKERS_EN,
    thisWords: THIS_WORDS_EN,
    thatWords: THAT_WORDS_EN,
    definiteArticles: DEFINITE_ARTICLE_EN,
    copulaVerbs: COPULA_VERBS_EN,
    whoseSkipWords: SKIP_WORDS_WHOSE_EN,
    copulaPersonMap: COPULA_PERSON_MAP_EN,
    pronounTriggers: PRONOUN_TRIGGERS_EN,
    dualSubjectPatterns: DUAL_SUBJECT_PATTERNS_EN,
    skipWords: SKIP_WORDS_EN,
    negation: NEGATION_EN,
    objectPronounTriggers: OBJECT_PRONOUN_TRIGGERS_EN,
    subjectPronounsGup: SUBJECT_PRONOUNS_GUP,
    possessiveTriggers: POSSESSIVE_TRIGGERS_EN,
    possessiveOfDeTriggers: POSSESSIVE_OF_TRIGGERS_EN,
    possessivePronounsGup: POSSESSIVE_PRONOUNS_GUP,
    locativeTriggers: LOCATIVE_TRIGGERS_EN,
    conWithTriggers: CON_WITH_TRIGGERS_EN,
    comitativePronounTriggers: COMITATIVE_PRONOUN_TRIGGERS_EN,
    comitativePronounsGup: COMITATIVE_PRONOUNS_GUP,
    humanAllativePronounTriggers: HUMAN_ALLATIVE_PRONOUN_TRIGGERS_EN,
    humanAllativePronounsGup: HUMAN_ALLATIVE_PRONOUNS_GUP,
    humanAblativePronounTriggers: HUMAN_ABLATIVE_PRONOUN_TRIGGERS_EN,
    humanAblativePronounsGup: HUMAN_ABLATIVE_PRONOUNS_GUP,
    sourceOriginPronounTriggers: SOURCE_ORIGIN_PRONOUN_TRIGGERS_EN,
    sourceOriginPronounsGup: SOURCE_ORIGIN_PRONOUNS_GUP,
    purposePronounTriggers: PURPOSE_PRONOUN_TRIGGERS_EN,
    purposePronounsGup: POSSESSIVE_PRONOUNS_GUP,
    skipWordsWhereTo: SKIP_WORDS_WHERE_TO_EN,
    upPositionTriggers: UP_POSITION_TRIGGERS_EN,
    thereIsPhrases: THERE_IS_PHRASES_EN,
    thereIsNoPhrases: THERE_IS_NO_PHRASES_EN,
    hasNoPhrases: HAS_NO_PHRASES_EN,
    fullOfPhrases: FULL_OF_PHRASES_EN,
    without: WITHOUT_EN,
    skipWordsWho: SKIP_WORDS_WHO_EN,
    mirriConjugations: MIRRI_CONJUGATIONS_EN,
    miriwConjugations: MIRIW_CONJUGATIONS_EN,
    pluralKey: "enPlural",
    particle: "Particle",

    auxiliary: AUXILIARY_PERSON_EN,
    lyingPositionTriggers: LYING_POSITION_TRIGGERS_EN,
    fixed: FIXED_TRANSLATIONS_EN,
    todayMarkers: TODAY_MARKERS_EN,
    yesterdayMarkers: YESTERDAY_MARKERS_EN,
    specifiedFutureMarkers: SPECIFIED_FUTURE_MARKERS_EN,
    alreadyMarkers: ALREADY_MARKERS_EN,
    continuousImperativeMarkers: CONTINUOUS_IMPERATIVE_MARKERS_EN,
    questionWordMap: QUESTION_WORDS_EN,
    defaultNegationWord: "not",
    copulaPastForms: COPULA_PAST_FORMS_EN,
    copulaFutureForms: COPULA_FUTURE_FORMS_EN,
    copulaImperfectForms: COPULA_IMPERFECT_FORMS_EN,
    labelKey: "labelEn",
    patterns: PATTERNS_EN,
    djalNeg: "Negation with djäl/marŋgi",
    explainKey: "explanationEn",
    unknownKey: "Unknown word",
    nounKey: "Noun",
    hara: "will do what",
    alternative: "alternative",
    noPronounForThings: "(no pronoun - for things/animals)",
    objectPronoun: "Object pronoun",
    person: "person",
    thing: "thing",
    nothing: "nothing",
    noun: "Noun",
    nhaPerson: "-nha (person)",
    notPersonNoNha: "not a person, no -nha",
    ifPerson: "if person",
    ifNotPerson: "if not person",
    personMarkedWithA: 'person marked with "a"',
    ifPersonShort: "if person",
    ifNotShort: "if not",
    hasPersonalA: false,
    impliedSubjectFrom: "Implied subject from",
    copulaVerbless: "copula, verbless",
    withWord: "with",
    withoutLacking: "without/lacking",
    placeNamesNoNgura:
      "place names don't take -ŋura (locative suffix only used with common nouns)",
    ifPlaceNameNoNgura:
      "if place name, no -ŋura (proper place names don't take locative suffix)",
    locativeSuffix: "locative suffix: in/at",
    allativeSuffix: "allative suffix: to/towards",
    withPerson: "with person",
    withThing: "with thing",
    instrumentalTriggers: INSTRUMENTAL_TRIGGERS_EN,
    instrumentalThing: "instrumental (thing)",
    instrumentalPerson: "instrumental (person)",
    transportTriggers: TRANSPORT_TRIGGERS_EN,
    vehicles: VEHICLES_EN,
    transportLabel: "transport (vehicle)",
    transportOption: "if vehicle",
    possessive: "possessive",
    proPosessive: "Possessive pronoun",
    possessed: "possessed",
    nonHuman: "non-human",
    humanObject: "human object",
    nonHumanObject: "non-human object",
    impliedSubject: "Subject implied from verb",
    answerLabel: "answer",
    meansTransport: "means/transport",
    destinationLabel: "destination",
    howWords: ["how"],
    adjectiveAfterNoun: false,
    contractionWords: [],
    possessor: "possessor",
    base: "base form",
    pos: "Positional verb",
    pronoun: "Pronoun",
    verbModal: "modal verb",
    sustantivo: "noun with possessive suffix",
    objecto: "object with possessive suffix",
    adjective: "Adjective",
    adverb: "Adverb",
    purpose: "purpose",
    ergative: "ergative",
    subjectLabel: "subject",
    verb: "verb",
    place: "place",
    unknownWord: "unknown word",
    pronounPurpose: "purpose pronoun",
    noNumberMarkerSingular: "No number marker detected, assuming singular",
    dual: "dual",
    pluralWurru: "plural -wurru",
    irregularPlural: "irregular plural",
    pluralMala: "plural mala",
    pluralMarker3Plus: "mala = plural marker (3+)",
    pluralHuman: "plural, human",
    pluralNonHuman: "plural, non-human",
    pluralMalaHuman: "plural mala - human",
    pluralMalaNonHuman: "plural mala - non-human",
    dharrwaMany: "dharrwa = many (plural marker)",
    pluralDharrwaMany: "plural dharrwa - many",
    bukmakAll: "bukmak = all (plural marker)",
    pluralBukmakAll: "plural bukmak - all",
    warrpamAll: "warrpam' = all (plural marker)",
    pluralWarrpamAll: "plural warrpam' - all",
    detectedDual: "Detected → dual (2), use maṉḏa",
    detectedPlural3Plus: "Detected → plural (3+), use mala or -wurru",
    detectedPluralMany: "Detected → plural (many), use dharrwa or -wurru",
    detectedPluralAll: "Detected → plural (all), use bukmak/warrpam' or -wurru",
    gerundEndings: ["ing"],
    locativePrefixes: [
      "near",
      "far",
      "inside",
      "outside",
      "above",
      "below",
      "behind",
      "in front of",
      "beside",
      "next to",
      "alongside",
    ],
    option: "Option",
    trad: "Translation",
    desglose: "Breakdown",
    hasCompoundTense: false,
    clitics: ["'s", "'ll", "'ve", "'d", "'re", "'m", "n't"],
    hasQuestionInversion: false,
    whoseCompoundPattern: null,
    hasLessFulSuffixes: true,
    miriwWithout: "without/doesn't exist → suffix -miriw",
    miriwNoHave: "not have → suffix -miriw",
    miriwWithoutSimple: "without → suffix -miriw",
    miriwNegationHave: "negation + have → suffix -miriw",
    mirriNegationLack: "negation + lack → suffix -mirri",
    miriwLackMiss: "lack/miss → suffix -miriw",
    miriwLessSuffix: "in → suffix -miriw",
    mirriFulSuffix: "in → suffix -mirri",
    mirriThereIs: "there is/exists → suffix -mirri",
    mirriFullOf: "full of → suffix -mirri",
    mirriHavePossess: "have/possess → suffix -mirri",
    locativeExplanation: "locative → suffix -ŋura",
    conWithExplanation: "with → suffix depends on noun type",
    copulaPositionalExplanation: "Copula + locative → positional verb",
    definido: "defined",
    endsInVowel: "ends in vowel → suffixes",
    endsInStop: "ends in stop → suffix",
    endsInLiquid: "ends in liquid → suffixes",
    endsInSemivowel: "ends in semivowel → suffixes",
    endsInNasal: "ends in nasal → suffix",
    defaultSuffix: "default suffix",
    willdo: "will do",
    weInclusive2: "we two inclusive (you and me)",
    weExclusive2: "we two exclusive (me and him/her)",
    weInclusive3Plus: "we 3+ inclusive (you and me and others)",
    weExclusive3Plus: "we 3+ exclusive (me and them)",
    youTwo: "you two",
    you3Plus: "you 3+",
    theyTwo: "they two",
    they3Plus: "they 3+",
    pronounArrow: "Pronoun",
    nounArrow: "Noun",
    nounErgative: "ergative",
    nameErgative: "ergative",
    nameNoTranslation: "no translation",
    impliedSubjectConjugation: "Implied subject from conjugation",
    dualMarkerLabel: "dual",
    negContinuousImperative:
      "Negative continuous imperative: yaka + gi + secondary form (don't keep doing!)",
    continuousImperative:
      "Continuous imperative: gi + secondary form (keep doing!)",
    negImperative: "Negative imperative: yaka + secondary form (don't do!)",
    imperative: "Imperative: uses secondary form",
    negContinuousFuture: "Negative continuous future",
    continuousFuture: "Continuous future",
    negFuture: "Negative future",
    future: "Future",
    todayUnspecified: "[TODAY/UNSPECIFIED]",
    tomorrowNext: "(tomorrow/next)",
    notTodaySpecified: "[NOT TODAY & SPECIFIED]",
    yesterdaySpecified: "[YESTERDAY/SPECIFIED]",
    continuousPastToday: "Continuous past (today)",
    pastToday: "Past (today)",
    continuousPastYesterday: "Continuous past (yesterday)",
    pastYesterday: "Past (yesterday)",
    present: "Present",
    primaryForm: "primary form",
    directionWord: "to",
    secondaryForm: "secondary form",
    tertiaryForm: "tertiary form",
    baseFormNoRule: "Base form (no specific rule)",
    connector: "Conector",
    whereTriggers: WHERE_TRIGGERS_EN,
    whereToTriggers: WHERE_TO_TRIGGERS_EN,
    whereFromTriggers: WHERE_FROM_TRIGGERS_EN,
    toWhomTriggers: TO_WHOM_TRIGGERS_EN,
    whoseTriggers: WHOSE_TRIGGERS_EN,
    whomForTriggers: WHOM_FOR_TRIGGERS_EN,
    whoTriggers: WHO_TRIGGERS_EN,
    whatTriggers: WHAT_TRIGGERS_EN,
    whyTriggers: WHY_TRIGGERS_EN,
    withWhatTriggers: WITH_WHAT_TRIGGERS_EN,
    byWhomTriggers: BY_WHOM_TRIGGERS_EN,
    estarBeForms: BE_FORMS_EN,
    pluralArticles: PLURAL_ARTICLES_EN,
    questionSkipWords: QUESTION_SKIP_WORDS_EN,
    thisLabelExplanation: "this",
    thatLabelExplanation: "that",
    wantLabelExplanation: "want",
    knowLabelExplanation: "know",
    transitiveExplanation: "transitive: yolthu + object + verb",
    intransitiveExplanation: "intransitive: yolthu + verb",
    detectFutureAction: detectFutureActionEN,
    detectWantKnow: detectWantKnowEN,
    directionAwayTriggers: DIRECTION_AWAY_TRIGGERS_EN,
    directionTowardsTriggers: DIRECTION_TOWARDS_TRIGGERS_EN,
    directionAwayVerbs: DIRECTION_AWAY_VERBS_EN,
    directionTowardsVerbs: DIRECTION_TOWARDS_VERBS_EN,
    directionAwayLabel: "bala = movement away from the speaker",
    directionTowardsLabel: "räli = movement towards the speaker",
    fromTriggers: FROM_TRIGGERS_EN,
    toTriggers: TO_TRIGGERS_EN,
    allativeSuffixLabel: "-lili = to/towards (movement towards something)",
    ablativeSuffixLabel: "-ŋuru = from (movement away from something)",
    unknownGoalDirectionLabel: "unknown direction: showing both options",
    indirectObjectClitics: {} as Record<string, PersonNumber>,
    indirectObjectPrepositions: ["to", "for"],
    indirectObjectLabel: "indirect object",
    disclaimerNote: "Note: This dictionary is still in development. It will continue to improve over time. Spanish entries have been verified. English and other languages will be added gradually. Also note that word order in Gupapuyŋu sentences is not fixed, the word you want to emphasize can be placed first.",
  },
};
