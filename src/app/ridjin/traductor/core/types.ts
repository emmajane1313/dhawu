export type LanguageId = "es" | "en" | "gup";
export type UiLanguageId = "es" | "en";

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

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "particle"
  | "pronoun"
  | "connector"
  | "unknown";

export type FeatureValue = string | number | boolean;
export type FeatureSet = Record<string, FeatureValue>;

export type ExplanationKey =
  | "TOKEN_PASSTHROUGH"
  | "UNKNOWN_TOKEN"
  | "PIPELINE_PLACEHOLDER"
  | "PRONOUN_SUBJECT_BASE"
  | "PRONOUN_SUBJECT_EMPHATIC"
  | "PRONOUN_SUBJECT_DUAL"
  | "PRONOUN_NOTE_EMPHATIC"
  | "PRONOUN_NOTE_NON_EMPHATIC"
  | "PRONOUN_NOTE_EMPHATIC_UNAVAILABLE"
  | "PRONOUN_NOTE_INCLUSIVE_DUAL"
  | "PRONOUN_NOTE_EXCLUSIVE_DUAL"
  | "PRONOUN_NOTE_INCLUSIVE_PLUR"
  | "PRONOUN_NOTE_EXCLUSIVE_PLUR"
  | "PRONOUN_NOTE_DUAL"
  | "PRONOUN_NOTE_PLUR"
  | "PRONOUN_NOTE_NONHUMAN"
  | "PRONOUN_COMITATIVE"
  | "PRONOUN_ALLATIVE"
  | "PRONOUN_INSTRUMENTAL"
  | "PRONOUN_CAUSE"
  | "PRONOUN_ABLATIVE"
  | "PRONOUN_ORIGIN"
  | "PRONOUN_OBJECT"
  | "PRONOUN_OBJECT_EMPHATIC"
  | "PRONOUN_OBJECT_NONHUMAN_DEMONSTRATIVE"
  | "PARTICIPLE_ADJECTIVE"
  | "PARTICIPLE_ADJECTIVE_ALT"
  | "PARTICIPLE_ADJECTIVE_RAW_ALT"
  | "VERBAL_NOUN"
  | "VERBAL_NOUN_ALTERNATIVE"
  | "VERBAL_NOUN_RAW_ALTERNATIVE"
  | "PARTICIPLE_INSTRUMENT"
  | "PARTICIPLE_INSTRUMENT_ALT_SUFFIX"
  | "PARTICIPLE_INSTRUMENT_ALT_HUMAN"
  | "PARTICIPLE_INSTRUMENT_ALT_NONHUMAN"
  | "PRONOUN_BELONGING"
  | "SUBJECT_IMPLIED"
  | "VERB_PRESENT_POS"
  | "VERB_PRESENT_NEG"
  | "VERB_PAST_SAME_DAY_POS"
  | "VERB_PAST_SAME_DAY_NEG"
  | "VERB_PAST_SAME_DAY_PROGRESSIVE_POS"
  | "VERB_PAST_SAME_DAY_PROGRESSIVE_NEG"
  | "VERB_PAST_YESTERDAY_POS"
  | "VERB_PAST_YESTERDAY_NEG"
  | "VERB_PAST_YESTERDAY_PROGRESSIVE_POS"
  | "VERB_PAST_YESTERDAY_PROGRESSIVE_NEG"
  | "VERB_PAST_HABITUAL_POS"
  | "VERB_PAST_HABITUAL_NEG"
  | "VERB_MIGHT_SEC"
  | "VERB_MIGHT_PAST"
  | "VERB_MIGHT_FUTURE"
  | "VERB_SHOULD_SEC"
  | "VERB_SHOULD_HAVE_PAST"
  | "VERB_FUTURE_SAME_DAY_POS"
  | "VERB_FUTURE_SAME_DAY_NEG"
  | "VERB_FUTURE_SAME_DAY_PROGRESSIVE_POS"
  | "VERB_FUTURE_SAME_DAY_PROGRESSIVE_NEG"
  | "VERB_FUTURE_TOMORROW_POS"
  | "VERB_FUTURE_TOMORROW_NEG"
  | "VERB_FUTURE_TOMORROW_PROGRESSIVE_POS"
  | "VERB_FUTURE_TOMORROW_PROGRESSIVE_NEG"
  | "VERB_IMPERATIVE_POS"
  | "VERB_IMPERATIVE_NEG"
  | "VERB_IMPERATIVE_NEG_MIRIW"
  | "VERB_NEAR_FUTURE_POS"
  | "VERB_GERUND_POS"
  | "VERB_GERUND_NEG"
  | "VERB_INFINITIVE"
  | "VERB_PARTICLE_POS"
  | "VERB_PARTICLE_NEG"
  | "VERB_PARTICLE_HABITUAL"
  | "VERB_PARTICLE_PAST_HABITUAL"
  | "VERB_PARTICLE_PAST_PROGRESSIVE"
  | "VERB_PARTICLE_MIGHT"
  | "VERB_PARTICLE_MIGHT_BANA"
  | "VERB_PARTICLE_MIGHT_CONTINUOUS"
  | "VERB_PARTICLE_SHOULD"
  | "VERB_PARTICLE_SHOULD_HAVE"
  | "VERB_PARTICLE_SHOULD_NGULI"
  | "VERB_PARTICLE_SHOULD_CONTINUOUS"
  | "VERB_PARTICLE_FUTURE"
  | "VERB_PARTICLE_FUTURE_PROGRESSIVE"
  | "VERB_SIMULTANEOUS"
  | "VERB_ACT"
  | "PAST_MARKER_YESTERDAY"
  | "VERB_NEGATOR"
  | "OBJECT_HUMAN_SUFFIX"
  | "OBJECT_NONHUMAN"
  | "CONNECTOR_GA"
  | "CONNECTOR_COMMA"
  | "ARTICLE_DEFINITE"
  | "DEMONSTRATIVE_THAT_VISIBILITY"
  | "POSSESSION_PRONOUN"
  | "POSSESSION_PRONOUN_EMPHATIC"
  | "POSSESSION_SUFFIX"
  | "POSSESSION_AGENT_COMITATIVE"
  | "MODAL_DJAL"
  | "MODAL_MARNGI"
  | "MODAL_OBJECT_SUFFIX"
  | "MODAL_OBJECT_PRONOUN"
  | "MODAL_OBJECT_ONE"
  | "MODAL_POSSESSOR_SUFFIX"
  | "MODAL_POSSESSOR_PRONOUN"
  | "MODAL_POSSESSOR_NONHUMAN_ALT"
  | "POSSESSION_COMITATIVE_SUFFIX"
  | "POSSESSION_COMITATIVE_PRONOUN"
  | "POSSESSION_COMITATIVE_HUMAN_SUFFIX"
  | "POSSESSION_COMITATIVE_HUMAN_PRONOUN"
  | "SUBJECT_AGENT_SUFFIX"
  | "LOCATIVE_SUBJECT_HUMAN"
  | "LOCATIVE_SUBJECT_NONHUMAN_LYING"
  | "LOCATIVE_SUBJECT_NONHUMAN_STANDING"
  | "LOCATIVE_NO_SUFFIX_NOTE"
  | "ALLATIVE_SUFFIX"
  | "ABLATIVE_SUFFIX"
  | "ABLATIVE_NONHUMAN_ALT"
  | "ORIGIN_SUFFIX"
  | "ORIGIN_POSSESSION_HUMAN_SUFFIX"
  | "ORIGIN_NONHUMAN_ALT"
  | "ABLATIVE_POSSESSION_HUMAN_SUFFIX"
  | "ABLATIVE_POSSESSION_HUMAN_PRONOUN"
  | "COMITATIVE_SUFFIX"
  | "COMITATIVE_NONHUMAN_ALT"
  | "INSTRUMENTAL_SUFFIX"
  | "INSTRUMENTAL_NONHUMAN_ALT"
  | "CAUSE_SUFFIX"
  | "CAUSE_NONHUMAN_ALT"
  | "PURPOSE_SUFFIX"
  | "PURPOSE_PRONOUN"
  | "BELONGING_SUFFIX"
  | "BELONGING_HUMAN_SUFFIX"
  | "BELONGING_POSSESSION_HUMAN_SUFFIX"
  | "BELONGING_POSSESSION_HUMAN_PRONOUN"
  | "TRAVERSE_SUFFIX"
  | "TRAVERSE_HUMAN_SUFFIX"
  | "TRAVERSE_HUMAN_PRONOUN"
  | "TRAVERSE_POSSESSION_HUMAN_SUFFIX"
  | "TRAVERSE_POSSESSION_HUMAN_PRONOUN"
  | "AGENT_NOUN_ALTERNATIVE"
  | "INDIRECT_SUFFIX"
  | "INDIRECT_PRONOUN"
  | "HAVE_POSSESSION"
  | "HAVE_MIRRI"
  | "HAVE_MIRIW";

export interface ExplanationPayload {
  key: ExplanationKey;
  data?: Record<string, FeatureValue>;
}

export interface TranslationPart {
  type: PartOfSpeech;
  source: string;
  gup: string;
  output: string;
  explanation: string;
  explanations?: ExplanationPayload[];
  alternatives?: TranslationAlternative[];
  meaningKey?: string;
  globalIndex?: number;
  appliedSuffix?: string;
  slotId?: string;
}

export interface TranslationAlternative {
  gup: string;
  note?: string;
  notePayload?: ExplanationPayload;
}

export interface TranslationCombination {
  output: string;
  parts: TranslationPart[];
  score?: number;
  variantGroup?: VariantGroup;
}

export interface TranslationResult {
  combinations: TranslationCombination[];
  hasAmbiguity: boolean;
  errors?: string[];
}

export type VariantScope = "dropdown" | "box";

export interface VariantGroup {
  id: string;
  scope: VariantScope;
}

export interface IRToken {
  id: string;
  source: string;
  normalized: string;
  pos: PartOfSpeech;
  meaningKey?: string;
  features?: FeatureSet;
  role?: string;
}

export interface IRSentence {
  tokens: IRToken[];
  sourceLang: LanguageId;
  targetLang: LanguageId;
}

export interface LanguageUiLabels {
  option: string;
  trad: string;
  desglose: string;
  disclaimerNote: string;
}

export interface LanguageSyntaxConfig {
  adjectiveAfterNoun?: boolean;
}

export interface LanguagePack {
  id: LanguageId;
  displayName: string;
  tokenize: (input: string) => string[];
  normalize: (token: string) => string;
  syntax?: LanguageSyntaxConfig;
  ui?: LanguageUiLabels;
  pronounTriggers?: Record<string, PersonNumber>;
  dualMarkers?: string[];
  conjunctions?: string[];
  otherGroupPatterns?: string[][];
  emphasisMarkers?: string[];
}
