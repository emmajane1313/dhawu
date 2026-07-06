import { ExplanationKey, FeatureValue } from "../core/types";

type ExplanationRenderer = (data?: Record<string, FeatureValue>) => string;

export const EXPLANATIONS_ES: Record<ExplanationKey, ExplanationRenderer> = {
  TOKEN_PASSTHROUGH: (data) =>
    `Sin regla aplicada: ${data?.token ?? ""}`,
  UNKNOWN_TOKEN: (data) =>
    `Palabra desconocida: ${data?.token ?? ""}`,
  PIPELINE_PLACEHOLDER: () => "Andamio base del traductor",
  PRONOUN_SUBJECT_BASE: (data) =>
    `Pronombre sujeto: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_SUBJECT_EMPHATIC: (data) =>
    `Pronombre sujeto enfatico: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_SUBJECT_DUAL: (data) =>
    `Pronombre sujeto dual: ${data?.token ?? ""} + ${data?.marker ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_NOTE_EMPHATIC: () => "enfasis (mismo/misma)",
  PRONOUN_NOTE_NON_EMPHATIC: () => "alternativa sin enfasis",
  PRONOUN_NOTE_EMPHATIC_UNAVAILABLE: () =>
    "no hay forma enfatica; se usa el pronombre normal",
  PRONOUN_NOTE_INCLUSIVE_DUAL: () =>
    "dual inclusivo (tu + yo)",
  PRONOUN_NOTE_EXCLUSIVE_DUAL: () =>
    "dual exclusivo (yo + otro, sin tu)",
  PRONOUN_NOTE_INCLUSIVE_PLUR: () =>
    "plural inclusivo (tu + yo + otros)",
  PRONOUN_NOTE_EXCLUSIVE_PLUR: () =>
    "plural exclusivo (yo + otros, sin tu)",
  PRONOUN_NOTE_DUAL: () => "dual exclusivo (2 personas, sin yo)",
  PRONOUN_NOTE_PLUR: () => "plural exclusivo (3+ personas, sin yo)",
  PRONOUN_NOTE_NONHUMAN: () => "sujeto no humano (demostrativo)",
  PRONOUN_COMITATIVE: (data) =>
    `Pronombre comitativo para compañía/cercanía con persona (“con/junto a”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_ALLATIVE: (data) =>
    `Pronombre alativo para movimiento hacia persona (“a/hacia”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_INSTRUMENTAL: (data) =>
    `Pronombre instrumental para medio/herramienta (“con/mediante”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_CAUSE: (data) =>
    `Pronombre de causa (“por/porque”) para indicar motivo/causa: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_ABLATIVE: (data) =>
    `Pronombre ablativo para movimiento desde una persona (“de/desde/lejos de”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_ORIGIN: (data) =>
    `Pronombre de origen para procedencia/autoría sin movimiento (“de/por”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_OBJECT: (data) =>
    `Pronombre objeto: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_OBJECT_EMPHATIC: (data) =>
    `Pronombre objeto enfatico: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_OBJECT_NONHUMAN_DEMONSTRATIVE: () =>
    "objeto no humano (demostrativo)",
  PARTICIPLE_ADJECTIVE: (data) =>
    `Adjetivo participial (hecho/terminado): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PARTICIPLE_ADJECTIVE_ALT: () =>
    "alternativa de sufijo participial",
  PARTICIPLE_ADJECTIVE_RAW_ALT: () =>
    "alternativa con adjetivo base (no participio)",
  VERBAL_NOUN: (data) =>
    `Sustantivo verbal (derivado): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERBAL_NOUN_ALTERNATIVE: (data) =>
    `Sustantivo verbal (alternativa): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERBAL_NOUN_RAW_ALTERNATIVE: (data) =>
    `Sustantivo base (alternativa): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PARTICIPLE_INSTRUMENT: (data) =>
    `Instrumento del participio: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PARTICIPLE_INSTRUMENT_ALT_SUFFIX: () =>
    "alternativa de sufijo del instrumento",
  PARTICIPLE_INSTRUMENT_ALT_HUMAN: () =>
    "alternativa humana (agente)",
  PARTICIPLE_INSTRUMENT_ALT_NONHUMAN: () =>
    "alternativa no humana",
  SUBJECT_IMPLIED: (data) => {
    const gup = data?.gup ?? "";
    const token = data?.token ? ` (de ${data.token})` : "";
    return `Sujeto implícito: ${gup}${token}`;
  },
  VERB_PRESENT_POS: (data) =>
    `Verbo presente positivo: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PRESENT_NEG: (data) =>
    `Verbo presente negativo: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_SAME_DAY_POS: (data) =>
    `Verbo pasado (hoy/indefinido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_SAME_DAY_NEG: (data) =>
    `Verbo pasado negativo (hoy/indefinido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_SAME_DAY_PROGRESSIVE_POS: (data) =>
    `Verbo pasado progresivo (hoy/indefinido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_SAME_DAY_PROGRESSIVE_NEG: (data) =>
    `Verbo pasado progresivo negativo (hoy/indefinido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_YESTERDAY_POS: (data) =>
    `Verbo pasado (ayer/tiempo definido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_YESTERDAY_NEG: (data) =>
    `Verbo pasado negativo (ayer/tiempo definido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_YESTERDAY_PROGRESSIVE_POS: (data) =>
    `Verbo pasado progresivo (ayer/tiempo definido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_YESTERDAY_PROGRESSIVE_NEG: (data) =>
    `Verbo pasado progresivo negativo (ayer/tiempo definido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_HABITUAL_POS: (data) =>
    `Verbo pasado habitual: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PAST_HABITUAL_NEG: (data) =>
    `Verbo pasado habitual negativo: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_MIGHT_SEC: (data) =>
    `Verbo con posibilidad (forma secundaria): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_MIGHT_PAST: (data) =>
    `Verbo con posibilidad (pasado): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_MIGHT_FUTURE: (data) =>
    `Verbo con posibilidad (futuro): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_SHOULD_SEC: (data) =>
    `Verbo de obligación (forma secundaria): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_SHOULD_HAVE_PAST: (data) =>
    `Verbo de obligación en pasado: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_SAME_DAY_POS: (data) =>
    `Verbo futuro (hoy/indefinido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_SAME_DAY_NEG: (data) =>
    `Verbo futuro negativo (hoy/indefinido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_SAME_DAY_PROGRESSIVE_POS: (data) =>
    `Verbo futuro progresivo (hoy/indefinido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_SAME_DAY_PROGRESSIVE_NEG: (data) =>
    `Verbo futuro progresivo negativo (hoy/indefinido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_TOMORROW_POS: (data) =>
    `Verbo futuro (mañana/tiempo definido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_TOMORROW_NEG: (data) =>
    `Verbo futuro negativo (mañana/tiempo definido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_TOMORROW_PROGRESSIVE_POS: (data) =>
    `Verbo futuro progresivo (mañana/tiempo definido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_FUTURE_TOMORROW_PROGRESSIVE_NEG: (data) =>
    `Verbo futuro progresivo negativo (mañana/tiempo definido): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_IMPERATIVE_POS: (data) =>
    `Verbo imperativo: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_IMPERATIVE_NEG: (data) =>
    `Verbo imperativo negativo: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_IMPERATIVE_NEG_MIRIW: (data) =>
    `Imperativo negativo con -miriw: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_NEAR_FUTURE_POS: (data) =>
    `Acción inmediata en el futuro (estoy por/voy a): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_GERUND_POS: (data) =>
    `Verbo gerundio: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_GERUND_NEG: (data) =>
    `Verbo gerundio negativo: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_INFINITIVE: (data) =>
    `Verbo infinitivo: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_PARTICLE_POS: (data) =>
    `Partícula de presente: ${data?.particle ?? ""}`,
  VERB_PARTICLE_NEG: (data) =>
    `Partícula negativa: ${data?.particle ?? ""}`,
  VERB_PARTICLE_HABITUAL: (data) =>
    `Marcador habitual: ${data?.particle ?? ""}`,
  VERB_PARTICLE_PAST_HABITUAL: (data) =>
    `Marcador habitual en pasado: ${data?.particle ?? ""}`,
  VERB_PARTICLE_PAST_PROGRESSIVE: (data) =>
    `Partícula de pasado progresivo: ${data?.particle ?? ""}`,
  VERB_PARTICLE_MIGHT: (data) =>
    `Partícula de posibilidad: ${data?.particle ?? ""}`,
  VERB_PARTICLE_MIGHT_BANA: (data) =>
    `Partícula de posibilidad (bäna): ${data?.particle ?? ""}`,
  VERB_PARTICLE_MIGHT_CONTINUOUS: (data) =>
    `Partícula de aspecto continuo (gi): ${data?.particle ?? ""}`,
  VERB_PARTICLE_SHOULD: (data) =>
    `Partícula de obligación: ${data?.particle ?? ""}`,
  VERB_PARTICLE_SHOULD_HAVE: (data) =>
    `Partícula de obligación en pasado: ${data?.particle ?? ""}`,
  VERB_PARTICLE_SHOULD_NGULI: (data) =>
    `Partícula de obligación (ŋuli): ${data?.particle ?? ""}`,
  VERB_PARTICLE_SHOULD_CONTINUOUS: (data) =>
    `Partícula de obligación (gi): ${data?.particle ?? ""}`,
  VERB_PARTICLE_FUTURE: (data) =>
    `Partícula de futuro: ${data?.particle ?? ""}`,
  VERB_PARTICLE_FUTURE_PROGRESSIVE: (data) =>
    `Partícula de futuro progresivo: ${data?.particle ?? ""}`,
  VERB_SIMULTANEOUS: (data) =>
    `Simultáneo (“mientras/al/durante”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_ACT: (data) =>
    `En el acto (“en el acto de/mientras/al/durante”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PAST_MARKER_YESTERDAY: (data) =>
    `Marcador de pasado (ayer): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  VERB_NEGATOR: (data) => `Negación: ${data?.particle ?? ""}`,
  CONNECTOR_GA: (data) =>
    `Conector: ${data?.token ?? ""} → ga`,
  CONNECTOR_COMMA: () => "Conector: coma",
  ARTICLE_DEFINITE: (data) =>
    `Artículo definido: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  DEMONSTRATIVE_THAT_VISIBILITY: () =>
    "Demostrativo “eso/esa/ese”: usa la primera forma si se ve o está cerca; las alternativas si no se ve/está lejos.",
  POSSESSION_PRONOUN: (data) =>
    `Pronombre posesivo que marca posesión (mi/tu/su/etc.): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_PRONOUN_EMPHATIC: (data) =>
    `Pronombre posesivo enfático (mi propio/tu propio/etc.): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_SUFFIX: (data) =>
    `Sufijo posesivo que marca al poseedor (X-gu/ku/wu/wa = “de X”/“X de”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_AGENT_COMITATIVE: (data) =>
    `Poseedor con sufijo comitativo para propiedad del agente (“la esposa de Stephen” como sujeto/agente): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  HAVE_POSSESSION: () =>
    "Tener: se expresa con construcción posesiva (poseedor + sufijo + poseído), sin verbo.",
  HAVE_MIRRI: () =>
    "Tener (mirri): añadir -mirri al poseído para “tiene/con”.",
  HAVE_MIRIW: () =>
    "No tener (miriw): añadir -miriw al poseído para “sin/no tener”.",
  OBJECT_HUMAN_SUFFIX: () =>
    "Un objeto directo humano lleva -nha en el sustantivo.",
  OBJECT_NONHUMAN: () =>
    "Un objeto directo no humano va sin -nha.",
  MODAL_DJAL: (data) =>
    `Modal (querer/necesitar/desear): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_MARNGI: (data) =>
    `Modal (saber/experiencia): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_OBJECT_SUFFIX: (data) =>
    `Objeto modal: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_OBJECT_PRONOUN: (data) =>
    `Pronombre modal: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_OBJECT_ONE: () => "Alternativa: waŋgany (+sufijo) = \"uno/eso\"",
  MODAL_POSSESSOR_SUFFIX: (data) =>
    `Poseedor en construcción de djäl/marŋgi con sufijo -ŋuwa: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_POSSESSOR_PRONOUN: (data) =>
    `Pronombre poseedor (comitativo + -ŋuwa) en djäl/marŋgi: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  MODAL_POSSESSOR_NONHUMAN_ALT: () =>
    "Alternativa si el poseedor no es humano: sin -ŋuwa.",
  POSSESSION_COMITATIVE_SUFFIX: (data) =>
    `Poseedor con sufijo comitativo + -ŋuwa (posesión): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_COMITATIVE_PRONOUN: (data) =>
    `Pronombre poseedor (comitativo + -ŋuwa) en posesión: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_COMITATIVE_HUMAN_SUFFIX: (data) =>
    `Poseedor humano con comitativo + -ŋuwala (locativo/alativo/instrumental): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  POSSESSION_COMITATIVE_HUMAN_PRONOUN: (data) =>
    `Pronombre poseedor humano (comitativo + -ŋuwala) en locativo/alativo/instrumental: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  SUBJECT_AGENT_SUFFIX: (data) =>
    `Sufijo de agente que marca un sujeto transitivo no pronominal (quien hace la acción): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  LOCATIVE_SUBJECT_HUMAN: () =>
    "La cópula locativa usa nhina cuando el sujeto es humano (ser/estar + lugar).",
  LOCATIVE_SUBJECT_NONHUMAN_LYING: () =>
    "La cópula locativa usa ŋorra para sujetos no humanos acostados/extendidos.",
  LOCATIVE_SUBJECT_NONHUMAN_STANDING: () =>
    "La cópula locativa usa dhärra para sujetos no humanos de pie/erguidos.",
  LOCATIVE_NO_SUFFIX_NOTE: () =>
    "Nota: nombres de lugar o humanos no llevan -ŋura; se usa el sustantivo sin sufijo.",
  ALLATIVE_SUFFIX: (data) =>
    `Sufijo direccional -lili marca movimiento hacia un lugar/objeto no humano (“a/hacia/para dentro”): ${data?.token ?? ""} → ${data?.gup ?? "lili"}`,
  ABLATIVE_SUFFIX: (data) =>
    `Sufijo ablativo (humano) marca movimiento desde una persona (“de/desde/lejos de”): ${data?.token ?? ""} → ${data?.gup ?? "ŋuru"}`,
  ABLATIVE_NONHUMAN_ALT: () =>
    "Alternativa para no humano/lugar: usar -ŋuru para “de/desde/lejos de”.",
  ORIGIN_SUFFIX: (data) =>
    `Sufijo de origen (humano) marca procedencia/autoría sin movimiento (“de/por” como origen): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  ORIGIN_POSSESSION_HUMAN_SUFFIX: (data) =>
    `Sufijo de origen con posesión humana (“el regalo de la esposa de X”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  ABLATIVE_POSSESSION_HUMAN_SUFFIX: (data) =>
    `Sufijo ablativo con posesión humana (“desde/lejos de la casa de X”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  ABLATIVE_POSSESSION_HUMAN_PRONOUN: (data) =>
    `Pronombre ablativo con posesión humana (“desde/lejos de mi/tu/su …”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  ORIGIN_NONHUMAN_ALT: () =>
    "Alternativa para no humano/lugar: usar -ŋuru para origen/procedencia.",
  COMITATIVE_SUFFIX: (data) =>
    `Sufijo comitativo (humano) marca compañía o cercanía con persona (“con/junto a”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  COMITATIVE_NONHUMAN_ALT: () =>
    "Alternativa no humana/lugar: usar -ŋura para ubicación (“en/sobre”), no comitativo.",
  INSTRUMENTAL_SUFFIX: (data) =>
    `Sufijo instrumental marca el medio o herramienta (“con/mediante”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  INSTRUMENTAL_NONHUMAN_ALT: () =>
    "Alternativa no humana/lugar: mantener el sufijo instrumental; no cambia a comitativo.",
  CAUSE_SUFFIX: (data) =>
    `Sufijo de causa marca motivo/causa (“por/porque”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  CAUSE_NONHUMAN_ALT: () =>
    "Alternativa no humana/lugar para la causa: usar el sufijo no humano.",
  PURPOSE_SUFFIX: (data) =>
    `Sufijo de propósito marca finalidad (“para/con el fin de”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PURPOSE_PRONOUN: (data) =>
    `Pronombre de propósito marca finalidad cuando el objetivo es pronombre: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  PRONOUN_BELONGING: (data) =>
    `Pronombre de pertenencia usado en la alternativa de pertenencia (tener/para/sobre): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  BELONGING_SUFFIX: (data) =>
    `Sufijo de pertenencia (no humano) para la alternativa de pertenencia (tener/para/sobre): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  BELONGING_HUMAN_SUFFIX: (data) =>
    `Sufijo de pertenencia (humano) para la alternativa de pertenencia (tener/para/sobre): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  BELONGING_POSSESSION_HUMAN_SUFFIX: (data) =>
    `Sufijo de pertenencia con posesión humana (“los huevos de X”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  BELONGING_POSSESSION_HUMAN_PRONOUN: (data) =>
    `Pronombre de pertenencia con posesión humana (“los huevos de él/ella”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_SUFFIX: (data) =>
    `Sufijo de trayecto (no humano) marca movimiento “a través de/por/along”: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_HUMAN_SUFFIX: (data) =>
    `Sufijo de trayecto (humano) marca movimiento “a través de/por” una persona: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_HUMAN_PRONOUN: (data) =>
    `Pronombre de trayecto (humano) para “a través de/por mí/ti/él/ella”: ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_POSSESSION_HUMAN_SUFFIX: (data) =>
    `Poseedor humano en trayecto (posesión con -ŋuwurru): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  TRAVERSE_POSSESSION_HUMAN_PRONOUN: (data) =>
    `Pronombre poseedor humano en trayecto (posesión con -ŋuwurru): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  AGENT_NOUN_ALTERNATIVE: (data) =>
    `Alternativa de nombre de agente derivado del verbo (ej. “comedor/trabajador”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  INDIRECT_SUFFIX: (data) =>
    `Sufijo de objeto indirecto marca destinatario/beneficiario (“a/para”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
  INDIRECT_PRONOUN: (data) =>
    `Pronombre de objeto indirecto marca destinatario/beneficiario (“a/para”): ${data?.token ?? ""} → ${data?.gup ?? ""}`,
};
