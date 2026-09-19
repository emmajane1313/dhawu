export type FormaVerbal = "I" | "II" | "III" | "IV";

export interface VerboLibro {
  lemma: string;
  group: number;
  forms: Partial<Record<FormaVerbal, string[]>>;
  particle: string[] | null;
  gloss: string;
  valence: string[];
  pluralOf: string | null;
  note?: string;
  page: number;
}

export interface AspectoLibro {
  lemma: string;
  forms: Record<FormaVerbal, string[]>;
  gloss: string;
  page: number;
}

export interface LibroVerbos {
  aspectParticle: AspectoLibro;
  verbs: VerboLibro[];
}

export interface FormaIdentificada {
  verbo: VerboLibro;
  forma: FormaVerbal;
}

export type ModoIR = "declarativa" | "imperativa" | "interrogativa";

export type PolaridadIR = "afirmativa" | "negativa";

export type PersonaIR =
  | "1sg"
  | "2sg"
  | "3sg"
  | "1dual_incl"
  | "1dual_excl"
  | "2dual"
  | "3dual"
  | "1pl_incl"
  | "1pl_excl"
  | "2pl"
  | "3pl";

export type DemostrativoIR = "este" | "ese";

export interface SujetoIR {
  persona?: PersonaIR;
  sustantivo?: string;
  nombre?: string;
  parteCuerpo?: string;
  plural?: boolean;
  demostrativo?: DemostrativoIR;
  articuloDefinido?: boolean;
  adjetivo?: string;
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
  enfatico?: boolean;
}

export type TiempoIR =
  | "continuo"
  | "futuro_manana"
  | "futuro_hoy"
  | "pasado_hoy"
  | "pasado_ayer";

export interface PredicadoIR {
  tipo:
    | "adjetivo"
    | "sustantivo"
    | "verbo"
    | "interrogativo"
    | "derivado"
    | "estado"
    | "agente"
    | "lugar"
    | "comitativo"
    | "destino"
    | "origen"
    | "posesion"
    | "pertenencia"
    | "proposito";
  clave: string;
  sufijo?: "mirri" | "miriw";
  posesivo?: PersonaIR;
  posesivoSustantivo?: string;
  posesivoNombre?: string;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
  duenoPosesivo?: PersonaIR;
  duenoNombre?: string;
  duenoSustantivo?: string;
  duenoDemostrativo?: DemostrativoIR;
  demostrativo?: DemostrativoIR;
  dualAlternativo?: boolean;
  estado?: string;
  adjetivo?: string;
  complementos?: ComplementoEstadoIR[];
  casoPregunta?: "lili" | "nura" | "instrumento";
  sustantivoCaso?: string;
  verbo?: string;
  destinoLili?: string;
}

export interface ComplementoEstadoIR {
  posesivo?: PersonaIR;
  posesivoSustantivo?: string;
  posesivoNombre?: string;
  dualAlternativo?: boolean;
  adjetivo?: string;
  verbo?: string;
  destinoLili?: string;
  duenoPosesivo?: PersonaIR;
  duenoNombre?: string;
  duenoSustantivo?: string;
  duenoDemostrativo?: DemostrativoIR;
  demostrativo?: DemostrativoIR;
}

export interface LugarIR {
  adverbio?: string;
  plural?: boolean;
  sustantivo?: string;
  nombre?: string;
  adjetivo?: string;
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
  verbo?: string;
  demostrativo?: DemostrativoIR;
}

export interface ComitativoIR {
  adverbio?: string;
  persona?: PersonaIR;
  sustantivo?: string;
  nombre?: string;
  adjetivo?: string;
  demostrativo?: DemostrativoIR;
}

export interface DestinoIR {
  adverbio?: string;
  plural?: boolean;
  persona?: PersonaIR;
  sustantivo?: string;
  nombre?: string;
  direccion?: "bala" | "rali";
  adjetivo?: string;
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
  paraQuedarse?: boolean;
  demostrativo?: DemostrativoIR;
}

export interface OrigenIR {
  adverbio?: string;
  plural?: boolean;
  persona?: PersonaIR;
  sustantivo?: string;
  nombre?: string;
  alejamiento?: boolean;
  adjetivo?: string;
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
  verbo?: string;
  demostrativo?: DemostrativoIR;
  enfatico?: boolean;
}

export interface PropositoIR {
  persona?: PersonaIR;
  sustantivo?: string;
  nombre?: string;
  adjetivo?: string;
  verbo?: string;
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
  demostrativo?: DemostrativoIR;
}

export interface PerlativoIR {
  sustantivo?: string;
  nombre?: string;
  adjetivo?: string;
  verbo?: string;
  demostrativo?: DemostrativoIR;
}

export interface InstrumentoIR {
  persona?: PersonaIR;
  sustantivo?: string;
  nombre?: string;
  adjetivo?: string;
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
  verbo?: string;
  demostrativo?: DemostrativoIR;
}

export interface PertenenciaIR {
  sustantivo?: string;
  nombre?: string;
  persona?: PersonaIR;
  dativo?: boolean;
  adjetivo?: string;
  cuantificador?: string;
  dualAlternativo?: boolean;
  verbo?: string;
  demostrativo?: DemostrativoIR;
}

export interface CuantificadorVocabulario {
  clave: string;
  gup: string;
  posicion: "antes" | "despues";
  sufijoBuy?: "wuy" | "puy";
  es: string[];
  en: string[];
}

export interface ObjetoIR {
  persona?: PersonaIR;
  sustantivo?: string;
  nombre?: string;
  dualAlternativo?: boolean;
  personaOpcional?: boolean;
  adjetivo?: string;
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
  demostrativo?: DemostrativoIR;
  enActo?: string;
  enfatico?: boolean;
  reflexivo?: boolean;
  parteCuerpo?: string;
  plural?: boolean;
}

export interface FraseIR {
  modo: ModoIR;
  polaridad: PolaridadIR;
  sujeto: SujetoIR | null;
  predicado: PredicadoIR;
  objeto?: ObjetoIR;
  lugar?: LugarIR;
  comitativo?: ComitativoIR;
  destino?: DestinoIR;
  origen?: OrigenIR;
  proposito?: PropositoIR;
  objetoIndirecto?: ObjetoIR;
  instrumento?: InstrumentoIR;
  pertenencia?: PertenenciaIR;
  perlativo?: PerlativoIR;
  veces?: string;
  raliVerbo?: boolean;
  lugarAntesVerbo?: boolean;
  esSerLugar?: boolean;
  tiempo?: TiempoIR;
  tiempoConfirmado?: boolean;
  aspecto?: "continuo";
  personaAlternativa?: PersonaIR;
  adverbio?: string;
  enfasis?: "predicado";
  momento?: "ahora" | "para_ahora" | "entonces";
  accionNuru?: string;
  objetoNuru?: string;
  enfasisDhi?: boolean;
  bili?: boolean;
  comparado?: ObjetoIR;
  balanyaNuru?: boolean;
  muka?: boolean;
  entonacion?: boolean;
  yanapi?: {
    tipo: "creencia" | "pregunta";
    forma?: "II" | "IV";
    sinDem?: boolean;
  };
  regreso?: { otraVez?: boolean };
  idioma?: IdiomaFuente;
  inminente?: boolean;
  habitual?: HabitualIR;
  modal?: "might" | "should" | "must";
  sentimiento?: boolean;
  prohibitivoMiriw?: boolean;
  manera?: string;
}

export interface GlosaParte {
  texto: string;
  es: string;
  en: string;
  tipo: "raiz" | "sufijo";
}

export interface GlosaPalabra {
  palabra: string;
  partes: GlosaParte[];
}

export interface HabitualIR {
  diario?: boolean;
  amenudo?: boolean;
  antes?: boolean;
}

export interface ReglaAplicada {
  leccion: number;
  regla: string;
}

export interface AlternativaGenerada {
  gup: string;
  nota?: string;
  desglose?: GlosaPalabra[];
}

export interface TraduccionGenerada {
  gup: string;
  reglas: ReglaAplicada[];
  atestada: boolean;
  alternativas?: AlternativaGenerada[];
  protegidos?: number[];
  desglose?: GlosaPalabra[];
}

export type IdiomaFuente = "es" | "en";

export interface PalabraVocabulario {
  clave: string;
  gup: string;
  tipo: "adjetivo" | "sustantivo" | "adverbio";
  subtipo?: "lugar" | "duracion" | "movimiento";
  persona?: boolean;
  postura?: string;
  posturaLugar?: string;
  basesAlternas?: string[];
  baseDireccional?: string;
  direccionalWala?: boolean;
  nombrePropio?: boolean;
  vehiculo?: boolean;
  pronunciacionFinal?: string;
  baseSufijos?: string;
  sufijoBuy?: "wuy" | "puy";
  sufijoThirri?: "dhirri" | "thirri" | "yirri";
  sufijoKuma?: "guma" | "kuma" | "yama";
  sentimiento?: boolean;
  parteCuerpo?: boolean;
  plural?: boolean;
  direccion?: "bala" | "rali";
  es: string[];
  en: string[];
  leccion: number;
}

export interface EstadoVocabulario {
  clave: string;
  gup: string;
  es: string[];
  en: string[];
  leccion: number;
}

export interface VerboVocabulario {
  clave: string;
  lema: string;
  movimiento?: boolean;
  transporte?: boolean;
  fuente?: boolean;
  sinonimos?: string[];
  valencia?: "Vtr" | "Vin";
  objetoDativo?: boolean;
  derivaMarama?: boolean;
  lemaTransitivo?: string;
  causaBuy?: boolean;
  llegada?: boolean;
  origenGu?: boolean;
  lugarLili?: boolean;
  subida?: boolean;
  es: string[];
  esPresente?: string[];
  en: string[];
  leccion: number;
}

export interface FormaVariante {
  forma: string;
  leccion: number;
  regla: string;
  nota?: string;
}

export interface DireccionVocabulario {
  gup: string;
  es: string[];
  en: string[];
  verbos: { es: string[]; en: string[] };
}

export interface VarianteVocabulario {
  gup: string;
  formas: FormaVariante[];
}

export type CasoDemostrativo =
  | "base"
  | "dativo"
  | "ergativo"
  | "ngura"
  | "lili"
  | "nguru"
  | "kala"
  | "kungu"
  | "kalangunguru"
  | "buy"
  | "kalanguwuy";

export interface Vocabulario {
  demostrativos: Record<DemostrativoIR, string>;
  demostrativosCasuales?: Partial<
    Record<DemostrativoIR, Partial<Record<CasoDemostrativo, string>>>
  >;
  demostrativosCasualesAlternos?: Partial<
    Record<DemostrativoIR, Partial<Record<CasoDemostrativo, string[]>>>
  >;
  interrogativos: {
    que: string;
    nhaltjan: string;
    yolku: string;
    nhaku: string;
    yolthu: string;
    yol: string;
    wanha: string;
    wanhami: string;
    wanhala: string;
    yolkala: string;
    nhakurru: string;
    nhalili: string;
    wanhanguru: string;
    nhanguru: string;
    nhaliy: string;
    nhapuy: string;
    wanhanguwuy: string;
    nhamunhamirri: string;
  };
  cuantificadores: CuantificadorVocabulario[];
  idiomasInstrumento: {
    es: Record<string, string>;
    en: Record<string, string>;
  };
  conjuncion: { gup: string; es: string[]; en: string[] };
  conjunciones?: {
    clave: string;
    gup: string;
    alternos?: string[];
    gupNegativo?: string;
    es: string[];
    en: string[];
  }[];
  estados: EstadoVocabulario[];
  particulas: {
    futuro: string;
    continuo: string;
    continuoSecundaria: string;
    continuoTerciaria: string;
    continuoCuaternaria: string;
  };
  negacionImperativo: string;
  pronombres: Record<PersonaIR, string>;
  posesivos: Record<PersonaIR, string>;
  objetos: Record<PersonaIR, string>;
  objetosEnfaticos: Partial<Record<PersonaIR, string>>;
  interjecciones?: Record<string, string[]>;
  sufijos?: { glosa_es: string; glosa_en: string; formas: string[] }[];
  comitativos: Record<PersonaIR, string>;
  direcciones: {
    bala: DireccionVocabulario;
    rali: DireccionVocabulario;
  };
  variantes: VarianteVocabulario[];
  palabras: PalabraVocabulario[];
  verbos: VerboVocabulario[];
}

export interface EjemploLeccion {
  gup: string;
  en: string;
}

export interface ReglaLeccion {
  id: string;
  statement: string;
}

export interface LeccionLibro {
  lesson: number;
  title: string;
  page: number;
  rules: ReglaLeccion[];
  examples: EjemploLeccion[];
  notes: string[];
}

export interface LibroLecciones {
  source: string;
  lessons: LeccionLibro[];
}

export interface TrozoAudio {
  nombre: string;
  inicio: number;
  fin: number;
}

export interface HistoriaTrozos {
  texto: string;
  trozos: TrozoAudio[];
}

export type IndiceTrozos = Record<string, HistoriaTrozos>;

export type EtiquetasTrozos = Record<string, Record<string, string>>;

export interface FalloVerificacion {
  en: string;
  esperado: string;
  obtenido: string;
}

export interface ResultadoVerificacion {
  total: number;
  compuestas: number;
  atestadas: number;
  fallos: FalloVerificacion[];
}
