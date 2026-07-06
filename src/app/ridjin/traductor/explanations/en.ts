import { ExplanationKey, FeatureValue } from "../core/types";

type ExplanationRenderer = (data?: Record<string, FeatureValue>) => string;

export const EXPLANATIONS_EN: Record<ExplanationKey, ExplanationRenderer> = {
  TOKEN_PASSTHROUGH: (data) =>
    `No rule applied: ${data?.token ?? ""}`,
  UNKNOWN_TOKEN: (data) => `Unknown token: ${data?.token ?? ""}`,
  PIPELINE_PLACEHOLDER: () => "Translator scaffold",
  PRONOUN_SUBJECT_BASE: (data) =>
    `Subject pronoun: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_SUBJECT_EMPHATIC: (data) =>
    `Emphatic subject pronoun: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_SUBJECT_DUAL: (data) =>
    `Dual subject pronoun: ${data?.token ?? ""} + ${data?.marker ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_NOTE_EMPHATIC: () => "emphasis (myself/mismo)",
  PRONOUN_NOTE_NON_EMPHATIC: () => "non-emphatic alternative",
  PRONOUN_NOTE_EMPHATIC_UNAVAILABLE: () =>
    "no emphatic subject form; using standard pronoun",
  PRONOUN_NOTE_INCLUSIVE_DUAL: () =>
    "inclusive dual (you + me)",
  PRONOUN_NOTE_EXCLUSIVE_DUAL: () =>
    "exclusive dual (me + other, not you)",
  PRONOUN_NOTE_INCLUSIVE_PLUR: () =>
    "inclusive plural (you + me + others)",
  PRONOUN_NOTE_EXCLUSIVE_PLUR: () =>
    "exclusive plural (me + others, not you)",
  PRONOUN_NOTE_DUAL: () => "exclusive dual (2 people, not me)",
  PRONOUN_NOTE_PLUR: () => "exclusive plural (3+ people, not me)",
  PRONOUN_NOTE_NONHUMAN: () => "non-human subject (demonstrative)",
  PRONOUN_COMITATIVE: (data) =>
    `Comitative pronoun for accompaniment/proximity with a person (“with/near/by”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_ALLATIVE: (data) =>
    `Allative pronoun for motion towards a person (“to/towards”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_INSTRUMENTAL: (data) =>
    `Instrumental pronoun for tool/means (“with/by means of”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_CAUSE: (data) =>
    `Cause pronoun for reason/motive (“because of”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_ABLATIVE: (data) =>
    `Ablative pronoun for motion away from a person (“from/away from”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_ORIGIN: (data) =>
    `Origin/source pronoun for attribution without motion (“from/by/of” as origin): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_OBJECT: (data) =>
    `Object pronoun: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_OBJECT_EMPHATIC: (data) =>
    `Emphatic object pronoun: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_OBJECT_NONHUMAN_DEMONSTRATIVE: () =>
    "non-human object (demonstrative)",
  PARTICIPLE_ADJECTIVE: (data) =>
    `Participial adjective (done/completed): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PARTICIPLE_ADJECTIVE_ALT: () =>
    "alternative participial suffix",
  PARTICIPLE_ADJECTIVE_RAW_ALT: () =>
    "alternative with base adjective (non-participle)",
  VERBAL_NOUN: (data) =>
    `Verbal noun (derived): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERBAL_NOUN_ALTERNATIVE: (data) =>
    `Verbal noun (alternative): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERBAL_NOUN_RAW_ALTERNATIVE: (data) =>
    `Base noun (alternative): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PARTICIPLE_INSTRUMENT: (data) =>
    `Participial instrument: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PARTICIPLE_INSTRUMENT_ALT_SUFFIX: () =>
    "alternative instrument suffix",
  PARTICIPLE_INSTRUMENT_ALT_HUMAN: () =>
    "human/agent alternative",
  PARTICIPLE_INSTRUMENT_ALT_NONHUMAN: () =>
    "non-human alternative",
  SUBJECT_IMPLIED: (data) => {
    const gup = data?.gup ?? "";
    const token = data?.token ? ` (from ${data.token})` : "";
    return `Implied subject: ${gup}${token}`;
  },
  VERB_PRESENT_POS: (data) =>
    `Positive present verb: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PRESENT_NEG: (data) =>
    `Negative present verb: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_SAME_DAY_POS: (data) =>
    `Past verb (today/indefinite): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_SAME_DAY_NEG: (data) =>
    `Negative past verb (today/indefinite): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_SAME_DAY_PROGRESSIVE_POS: (data) =>
    `Past progressive verb (today/indefinite): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_SAME_DAY_PROGRESSIVE_NEG: (data) =>
    `Negative past progressive verb (today/indefinite): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_YESTERDAY_POS: (data) =>
    `Past verb (yesterday/defined time): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_YESTERDAY_NEG: (data) =>
    `Negative past verb (yesterday/defined time): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_YESTERDAY_PROGRESSIVE_POS: (data) =>
    `Past progressive verb (yesterday/defined time): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_YESTERDAY_PROGRESSIVE_NEG: (data) =>
    `Negative past progressive verb (yesterday/defined time): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_HABITUAL_POS: (data) =>
    `Past habitual verb: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_HABITUAL_NEG: (data) =>
    `Negative past habitual verb: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_MIGHT_SEC: (data) =>
    `Might verb (secondary form): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_MIGHT_PAST: (data) =>
    `Might verb (past): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_MIGHT_FUTURE: (data) =>
    `Might verb (future): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_SHOULD_SEC: (data) =>
    `Obligation verb (secondary form): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_SHOULD_HAVE_PAST: (data) =>
    `Past obligation verb: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_SAME_DAY_POS: (data) =>
    `Future verb (today/unspecified): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_SAME_DAY_NEG: (data) =>
    `Future negative verb (today/unspecified): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_SAME_DAY_PROGRESSIVE_POS: (data) =>
    `Future progressive verb (today/unspecified): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_SAME_DAY_PROGRESSIVE_NEG: (data) =>
    `Future progressive negative verb (today/unspecified): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_TOMORROW_POS: (data) =>
    `Future verb (tomorrow/defined time): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_TOMORROW_NEG: (data) =>
    `Future negative verb (tomorrow/defined time): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_TOMORROW_PROGRESSIVE_POS: (data) =>
    `Future progressive verb (tomorrow/defined time): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_TOMORROW_PROGRESSIVE_NEG: (data) =>
    `Future progressive negative verb (tomorrow/defined time): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_IMPERATIVE_POS: (data) =>
    `Imperative verb: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_IMPERATIVE_NEG: (data) =>
    `Negative imperative verb: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_IMPERATIVE_NEG_MIRIW: (data) =>
    `Negative imperative with -miriw: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_NEAR_FUTURE_POS: (data) =>
    `Immediate future (about to/going to): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_GERUND_POS: (data) =>
    `Gerund verb: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_GERUND_NEG: (data) =>
    `Negative gerund: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_INFINITIVE: (data) =>
    `Infinitive verb: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PARTICLE_POS: (data) =>
    `Present particle: ${data?.particle ?? ""}`,
  VERB_PARTICLE_NEG: (data) =>
    `Negative particle: ${data?.particle ?? ""}`,
  VERB_PARTICLE_HABITUAL: (data) =>
    `Habitual marker: ${data?.particle ?? ""}`,
  VERB_PARTICLE_PAST_HABITUAL: (data) =>
    `Past habitual marker: ${data?.particle ?? ""}`,
  VERB_PARTICLE_PAST_PROGRESSIVE: (data) =>
    `Past progressive particle: ${data?.particle ?? ""}`,
  VERB_PARTICLE_MIGHT: (data) =>
    `Possibility particle: ${data?.particle ?? ""}`,
  VERB_PARTICLE_MIGHT_BANA: (data) =>
    `Possibility particle (bäna): ${data?.particle ?? ""}`,
  VERB_PARTICLE_MIGHT_CONTINUOUS: (data) =>
    `Continuous aspect particle (gi): ${data?.particle ?? ""}`,
  VERB_PARTICLE_SHOULD: (data) =>
    `Obligation particle: ${data?.particle ?? ""}`,
  VERB_PARTICLE_SHOULD_HAVE: (data) =>
    `Past obligation particle: ${data?.particle ?? ""}`,
  VERB_PARTICLE_SHOULD_NGULI: (data) =>
    `Obligation particle (ŋuli): ${data?.particle ?? ""}`,
  VERB_PARTICLE_SHOULD_CONTINUOUS: (data) =>
    `Obligation particle (gi): ${data?.particle ?? ""}`,
  VERB_PARTICLE_FUTURE: (data) =>
    `Future particle: ${data?.particle ?? ""}`,
  VERB_PARTICLE_FUTURE_PROGRESSIVE: (data) =>
    `Future progressive particle: ${data?.particle ?? ""}`,
  VERB_SIMULTANEOUS: (data) =>
    `Simultaneous (“while/when/during”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_ACT: (data) =>
    `In the act (“in the act of/while/during”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PAST_MARKER_YESTERDAY: (data) =>
    `Past marker (yesterday): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_NEGATOR: (data) => `Negator: ${data?.particle ?? ""}`,
  CONNECTOR_GA: (data) =>
    `Connector: ${data?.token ?? ""} → ga`,
  CONNECTOR_COMMA: () => "Connector: comma",
  ARTICLE_DEFINITE: (data) =>
    `Definite article: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  DEMONSTRATIVE_THAT_VISIBILITY: () =>
    "Demonstrative “that/those”: use the first form when the person/thing is visible or near; the alternatives when not visible/far.",
  POSSESSION_PRONOUN: (data) =>
    `Possessive pronoun marks ownership (my/your/his/etc.): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_PRONOUN_EMPHATIC: (data) =>
    `Emphatic possessive pronoun (my own/your own/etc.): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_SUFFIX: (data) =>
    `Possessive suffix marks the possessor (X-gu/ku/wu/wa = “X’s / of X”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_AGENT_COMITATIVE: (data) =>
    `Possessor marked with a comitative suffix to show an agent’s owner (“Stephen’s wife” as subject/agent): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  HAVE_POSSESSION: () =>
    "Have: expressed with a possessive construction (possessor + suffix + possessed), no verb.",
  HAVE_MIRRI: () =>
    "Have (mirri): add -mirri to the possessed noun to mean “has/with”.",
  HAVE_MIRIW: () =>
    "No have (miriw): add -miriw to the possessed noun to mean “without/doesn’t have”.",
  OBJECT_HUMAN_SUFFIX: () =>
    "A human direct object takes -nha on the noun.",
  OBJECT_NONHUMAN: () =>
    "A non-human direct object stays bare (no -nha).",
  MODAL_DJAL: (data) =>
    `Modal (want/need/desire): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_MARNGI: (data) =>
    `Modal (know/experience): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_OBJECT_SUFFIX: (data) =>
    `Modal object: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_OBJECT_PRONOUN: (data) =>
    `Modal object pronoun: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_OBJECT_ONE: () => "Alternative: waŋgany (+suffix) = 'one/it'",
  MODAL_POSSESSOR_SUFFIX: (data) =>
    `Possessor in djäl/marŋgi with -ŋuwa suffix: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_POSSESSOR_PRONOUN: (data) =>
    `Possessor pronoun (comitative + -ŋuwa) in djäl/marŋgi: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_POSSESSOR_NONHUMAN_ALT: () =>
    "Alternative when the possessor is non-human: no -ŋuwa.",
  POSSESSION_COMITATIVE_SUFFIX: (data) =>
    `Possessor with comitative + -ŋuwa (possession): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_COMITATIVE_PRONOUN: (data) =>
    `Possessor pronoun (comitative + -ŋuwa) in possession: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_COMITATIVE_HUMAN_SUFFIX: (data) =>
    `Human possessor with comitative + -ŋuwala (locative/allative/instrumental): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_COMITATIVE_HUMAN_PRONOUN: (data) =>
    `Human possessor pronoun (comitative + -ŋuwala) in locative/allative/instrumental: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  SUBJECT_AGENT_SUFFIX: (data) =>
    `Agent suffix marks a non-pronoun transitive subject (the doer of the action): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  LOCATIVE_SUBJECT_HUMAN: () =>
    "Locative copula uses nhina when the subject is human (to be + location).",
  LOCATIVE_SUBJECT_NONHUMAN_LYING: () =>
    "Locative copula uses ŋorra for non-human subjects lying/laid.",
  LOCATIVE_SUBJECT_NONHUMAN_STANDING: () =>
    "Locative copula uses dhärra for non-human subjects standing/upright.",
  LOCATIVE_NO_SUFFIX_NOTE: () =>
    "Note: place names or human nouns do not take -ŋura; use the bare noun.",
  ALLATIVE_SUFFIX: (data) =>
    `Directional/allative suffix -lili marks motion toward a non-human/place (“to/toward/into”): ${data?.token ?? ""} → ${data?.gup ?? "lili"}`,
  ABLATIVE_SUFFIX: (data) =>
    `Ablative suffix (human) marks motion away from a person (“from/away from”): ${data?.token ?? ""} → ${data?.gup ?? "ŋuru"}`,
  ABLATIVE_NONHUMAN_ALT: () =>
    "Alternative for non-human/place: use -ŋuru to mean “from/away from” a place/thing.",
  ORIGIN_SUFFIX: (data) =>
    `Origin/source suffix (human) marks attribution without motion (“from/by/of” as origin): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  ORIGIN_POSSESSION_HUMAN_SUFFIX: (data) =>
    `Origin suffix with human possession (“the gift of X’s wife”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  ABLATIVE_POSSESSION_HUMAN_SUFFIX: (data) =>
    `Ablative suffix with human possession (“away from X’s house”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  ABLATIVE_POSSESSION_HUMAN_PRONOUN: (data) =>
    `Ablative pronoun with human possession (“away from my/your/their …”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  ORIGIN_NONHUMAN_ALT: () =>
    "Alternative for non-human/place: use -ŋuru to mark origin/source.",
  COMITATIVE_SUFFIX: (data) =>
    `Comitative suffix (human) marks accompaniment/proximity with a person (“with/near/by”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  COMITATIVE_NONHUMAN_ALT: () =>
    "Alternative for non-human/place: use -ŋura to express location (“at/in/on”) instead of a human comitative suffix.",
  INSTRUMENTAL_SUFFIX: (data) =>
    `Instrumental suffix marks the tool/means used to do the action (“with/by means of”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  INSTRUMENTAL_NONHUMAN_ALT: () =>
    "Alternative for non-human/place: keep the instrumental suffix; do not switch to comitative.",
  CAUSE_SUFFIX: (data) =>
    `Cause suffix marks reason/motive (“because of”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  CAUSE_NONHUMAN_ALT: () =>
    "Alternative for non-human/place: use the non-human suffix for cause.",
  PURPOSE_SUFFIX: (data) =>
    `Purpose suffix marks the goal/purpose of the action (“for/in order to”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PURPOSE_PRONOUN: (data) =>
    `Purpose pronoun marks the goal/purpose when the target is a pronoun: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_BELONGING: (data) =>
    `Belonging pronoun used in the BELONGING alternative (have/for/about): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  BELONGING_SUFFIX: (data) =>
    `Belonging suffix (non-human) marks the BELONGING alternative used for have/for/about: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  BELONGING_HUMAN_SUFFIX: (data) =>
    `Belonging suffix (human) marks the BELONGING alternative used for have/for/about: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  BELONGING_POSSESSION_HUMAN_SUFFIX: (data) =>
    `Belonging suffix with human possession (“the eggs of X”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  BELONGING_POSSESSION_HUMAN_PRONOUN: (data) =>
    `Belonging pronoun with human possession (“the eggs of him/her”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_SUFFIX: (data) =>
    `Traversive suffix (non-human) marks motion “through/along/by”: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_HUMAN_SUFFIX: (data) =>
    `Traversive suffix (human) marks motion “through/by” a person: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_HUMAN_PRONOUN: (data) =>
    `Traversive pronoun (human) for “through/by me/you/him/her”: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_POSSESSION_HUMAN_SUFFIX: (data) =>
    `Human possessor in traversive (possession with -ŋuwurru): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_POSSESSION_HUMAN_PRONOUN: (data) =>
    `Human possessor pronoun in traversive (possession with -ŋuwurru): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  AGENT_NOUN_ALTERNATIVE: (data) =>
    `Agent-noun alternative from a verb role (e.g., “worker/eater”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  INDIRECT_SUFFIX: (data) =>
    `Indirect object suffix marks a recipient/beneficiary (“to/for”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  INDIRECT_PRONOUN: (data) =>
    `Indirect object pronoun marks a recipient/beneficiary (“to/for”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
};
