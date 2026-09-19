import vocabulario from "../../ridjin/traductor/book/vocabulario.json";
import {
  ComitativoIR,
  DemostrativoIR,
  DestinoIR,
  FraseIR,
  HabitualIR,
  IdiomaFuente,
  InstrumentoIR,
  LugarIR,
  ObjetoIR,
  OrigenIR,
  PerlativoIR,
  PertenenciaIR,
  PropositoIR,
  PalabraVocabulario,
  PersonaIR,
  SujetoIR,
  TiempoIR,
  VerboVocabulario,
  Vocabulario,
} from "../types/ridjin.type";
import { formaAtestada, verbosPorLema } from "./useVerbos";

const VOCAB = vocabulario as unknown as Vocabulario;

const SUSTANTIVOS_COMPUESTOS: string[][] = VOCAB.palabras
  .filter((palabra) => palabra.tipo === "sustantivo")
  .flatMap((palabra) => [...palabra.es, ...palabra.en])
  .map((forma) =>
    forma
      .toLowerCase()
      .replace(/[¡!¿?.,;:()]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  )
  .filter((tokens) => tokens.length > 1)
  .sort((a, b) => b.length - a.length);

const unirCompuestos = (tokens: string[]): string[] => {
  if (SUSTANTIVOS_COMPUESTOS.length === 0) return tokens;
  const resultado: string[] = [];
  let indice = 0;
  while (indice < tokens.length) {
    const compuesto = SUSTANTIVOS_COMPUESTOS.find(
      (forma) =>
        indice + forma.length <= tokens.length &&
        tokens.slice(indice, indice + forma.length).join(" ") ===
          forma.join(" ")
    );
    if (compuesto) {
      resultado.push(compuesto.join(" "));
      indice += compuesto.length;
    } else {
      resultado.push(tokens[indice]);
      indice += 1;
    }
  }
  return resultado;
};

const limpiar = (texto: string): string[] =>
  unirCompuestos(
    texto
      .toLowerCase()
      .replace(/[’]/g, "'")
      .replace(/won't/g, "will not")
      .replace(/n't/g, " not")
      .replace(/'ll/g, " will")
      .replace(/'re/g, " are")
      .replace(/'m/g, " am")
      .replace(/\b(it|that|this|what|he|she|there|here|where)'s\b/g, "$1 is")
      .replace(/'s(?=\s|$)/g, "s")
      .replace(/s'(?=\s|$)/g, "s")
      .replace(/\bfreshwater\b/g, "fresh water")
      .replace(/\bdel\b/g, "de el")
      .replace(/\bal\b/g, "a el")
      .replace(/[¡!¿?.,;:()]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );

const construirIndicePalabras = (
  idioma: IdiomaFuente
): Map<string, PalabraVocabulario[]> => {
  const indice = new Map<string, PalabraVocabulario[]>();
  for (const palabra of VOCAB.palabras) {
    for (const forma of palabra[idioma]) {
      const clave = limpiar(forma).join(" ");
      if (!clave) continue;
      const lista = indice.get(clave);
      if (lista) {
        if (!lista.includes(palabra)) lista.push(palabra);
      } else {
        indice.set(clave, [palabra]);
      }
    }
  }
  return indice;
};

const construirIndiceVerbos = (
  idioma: IdiomaFuente
): Map<string, VerboVocabulario> => {
  const indice = new Map<string, VerboVocabulario>();
  for (const verbo of VOCAB.verbos) {
    const formas =
      idioma === "es"
        ? [...verbo.es, ...(verbo.esPresente ?? [])]
        : verbo.en;
    for (const forma of formas) {
      const clave = limpiar(forma).join(" ");
      if (clave && !indice.has(clave)) {
        indice.set(clave, verbo);
      }
    }
  }
  return indice;
};

const FORMAS_PRESENTE_ES = new Set<string>(
  VOCAB.verbos.flatMap((verbo) =>
    (verbo.esPresente ?? []).map((forma) => limpiar(forma).join(" "))
  )
);

const construirAdverbios = (
  idioma: IdiomaFuente
): { tokens: string[]; entrada: PalabraVocabulario }[] => {
  const lista: { tokens: string[]; entrada: PalabraVocabulario }[] = [];
  for (const palabra of VOCAB.palabras) {
    if (palabra.tipo !== "adverbio") continue;
    for (const forma of palabra[idioma]) {
      const tokens = limpiar(forma);
      if (tokens.length > 0) {
        lista.push({ tokens, entrada: palabra });
      }
    }
  }
  return lista.sort((a, b) => b.tokens.length - a.tokens.length);
};

const PALABRAS = {
  es: construirIndicePalabras("es"),
  en: construirIndicePalabras("en"),
};

const VERBOS = {
  es: construirIndiceVerbos("es"),
  en: construirIndiceVerbos("en"),
};

const ADVERBIOS = {
  es: construirAdverbios("es"),
  en: construirAdverbios("en"),
};

const SER = {
  es: new Set([
    "es",
    "eres",
    "soy",
    "somos",
    "son",
    "sois",
    "está",
    "esta",
    "estás",
    "estas",
    "estoy",
    "estamos",
    "están",
    "estan",
    "estáis",
    "estais",
  ]),
  en: new Set(["is", "am", "are"]),
};

const PERSONA_SER_ES: Record<string, PersonaIR> = {
  estoy: "1sg",
  estás: "2sg",
  estas: "2sg",
  está: "3sg",
  esta: "3sg",
  estamos: "1pl_incl",
  están: "3pl",
  estan: "3pl",
  soy: "1sg",
  eres: "2sg",
  es: "3sg",
  somos: "1pl_incl",
  son: "3pl",
  sois: "2pl",
  estáis: "2pl",
  estais: "2pl",
};

const DEMOSTRATIVOS: Record<IdiomaFuente, Record<string, DemostrativoIR>> = {
  es: {
    esto: "este",
    este: "este",
    esta: "este",
    estos: "este",
    estas: "este",
    eso: "ese",
    ese: "ese",
    esa: "ese",
    esos: "ese",
    esas: "ese",
  },
  en: { this: "este", these: "este", that: "ese", those: "ese" },
};

const PRONOMBRES_DOBLES: Record<IdiomaFuente, Record<string, PersonaIR>> = {
  es: {
    "nosotros dos": "1dual_excl",
    "ustedes dos": "2dual",
    "ellos dos": "3dual",
    "ellas dos": "3dual",
  },
  en: {
    "we two": "1dual_excl",
    "you two": "2dual",
    "they two": "3dual",
  },
};

const COORDINACIONES: Record<IdiomaFuente, Record<string, PersonaIR>> = {
  es: {
    "tú y yo": "1dual_incl",
    "tu y yo": "1dual_incl",
    "usted y yo": "1dual_incl",
    "él y yo": "1dual_excl",
    "el y yo": "1dual_excl",
    "ella y yo": "1dual_excl",
    "ustedes y yo": "1pl_incl",
    "vosotros y yo": "1pl_incl",
    "ellos y yo": "1pl_excl",
    "ellas y yo": "1pl_excl",
    "él y ella": "3dual",
    "el y ella": "3dual",
    "ella y él": "3dual",
    "ella y el": "3dual",
  },
  en: {
    "you and i": "1dual_incl",
    "you and me": "1dual_incl",
    "he and i": "1dual_excl",
    "she and i": "1dual_excl",
    "they and i": "1pl_excl",
    "he and she": "3dual",
    "she and he": "3dual",
  },
};

const PRONOMBRES: Record<IdiomaFuente, Record<string, PersonaIR>> = {
  es: {
    yo: "1sg",
    tú: "2sg",
    tu: "2sg",
    usted: "2sg",
    él: "3sg",
    ella: "3sg",
    nosotros: "1pl_incl",
    nosotras: "1pl_incl",
    ustedes: "2pl",
    vosotros: "2pl",
    vosotras: "2pl",
    ellos: "3pl",
    ellas: "3pl",
  },
  en: {
    i: "1sg",
    you: "2sg",
    he: "3sg",
    she: "3sg",
    it: "3sg",
    we: "1pl_incl",
    they: "3pl",
  },
};

const POSESIVOS_DET: Record<IdiomaFuente, Record<string, PersonaIR>> = {
  es: {
    mi: "1sg",
    mis: "1sg",
    tu: "2sg",
    tus: "2sg",
    su: "3sg",
    sus: "3sg",
    nuestro: "1pl_incl",
    nuestra: "1pl_incl",
    nuestros: "1pl_incl",
    nuestras: "1pl_incl",
    vuestro: "2pl",
    vuestra: "2pl",
  },
  en: {
    my: "1sg",
    your: "2sg",
    his: "3sg",
    her: "3sg",
    its: "3sg",
    our: "1pl_incl",
    their: "3pl",
  },
};

const POSESIVOS_PRON: Record<IdiomaFuente, Record<string, PersonaIR>> = {
  es: {
    mío: "1sg",
    mio: "1sg",
    mía: "1sg",
    mia: "1sg",
    tuyo: "2sg",
    tuya: "2sg",
    suyo: "3sg",
    suya: "3sg",
    nuestro: "1pl_incl",
    nuestra: "1pl_incl",
    vuestro: "2pl",
    vuestra: "2pl",
  },
  en: {
    mine: "1sg",
    yours: "2sg",
    his: "3sg",
    hers: "3sg",
    ours: "1pl_incl",
    theirs: "3pl",
  },
};

const ARTICULOS: Record<IdiomaFuente, Set<string>> = {
  es: new Set(["el", "la", "los", "las"]),
  en: new Set(["the"]),
};

const INDEFINIDOS: Record<IdiomaFuente, Set<string>> = {
  es: new Set(["un", "una"]),
  en: new Set(["a", "an"]),
};

const TENER: Record<IdiomaFuente, Set<string>> = {
  es: new Set(["tiene", "tienen", "tengo", "tienes", "tenemos", "tenéis", "teneis"]),
  en: new Set(["has", "have"]),
};

const PERSONA_TENER_ES: Record<string, PersonaIR> = {
  tengo: "1sg",
  tienes: "2sg",
  tiene: "3sg",
  tenemos: "1pl_incl",
  tenéis: "2pl",
  teneis: "2pl",
  tienen: "3pl",
};

const PREPOSICION_DERIVADO: Record<
  IdiomaFuente,
  Record<string, "mirri" | "miriw">
> = {
  es: { con: "mirri", sin: "miriw" },
  en: { with: "mirri", without: "miriw" },
};

const FUTURO_AUX_ES: Record<string, PersonaIR> = {
  voy: "1sg",
  vas: "2sg",
  va: "3sg",
  vamos: "1pl_incl",
  vais: "2pl",
  van: "3pl",
};

const FUTURO_SUFIJOS_ES: [string, PersonaIR][] = [
  ["emos", "1pl_incl"],
  ["éis", "2pl"],
  ["eis", "2pl"],
  ["án", "3pl"],
  ["an", "3pl"],
  ["ás", "2sg"],
  ["as", "2sg"],
  ["é", "1sg"],
  ["e", "1sg"],
  ["á", "3sg"],
  ["a", "3sg"],
];

const verboDevenirAdjetivo = (claveAdjetivo: string): VerboVocabulario => ({
  clave: `devenir:${claveAdjetivo}`,
  lema: `devenir:${claveAdjetivo}`,
  valencia: "Vin",
  es: [],
  en: [],
  leccion: 49,
});

const verboHacerAdjetivo = (claveAdjetivo: string): VerboVocabulario => ({
  clave: `hacer:${claveAdjetivo}`,
  lema: `hacer:${claveAdjetivo}`,
  valencia: "Vtr",
  es: [],
  en: [],
  leccion: 50,
});

const DEVENIR_EN = new Set(["become", "get"]);
const DEVENIR_INFINITIVO_ES = new Set(["volverse", "ponerse", "hacerse"]);

const buscarVerbo = (
  palabras: string[],
  idioma: IdiomaFuente
): VerboVocabulario | null => {
  const clave = palabras.join(" ");
  const exacto = VERBOS[idioma].get(clave);
  if (exacto) return exacto;
  const ultima = palabras[palabras.length - 1];
  if (palabras.length > 1 && idioma === "en" && ultima === "it") {
    const sinObjeto = VERBOS.en.get(palabras.slice(0, -1).join(" "));
    if (sinObjeto) return sinObjeto;
  }
  if (idioma === "es") {
    const base = desacentuar(ultima);
    for (const recorte of sinCliticoFinal(base)) {
      const verbo =
        (palabras.length === 1 ? preferirReflexivo(recorte) : null) ??
        VERBOS.es.get([...palabras.slice(0, -1), recorte].join(" ")) ??
        VERBOS.es.get([...palabras.slice(0, -1), `${recorte}se`].join(" "));
      if (verbo) return verbo;
    }
  }
  if (
    palabras.length === 2 &&
    (idioma === "en"
      ? DEVENIR_EN.has(palabras[0])
      : DEVENIR_INFINITIVO_ES.has(desacentuar(palabras[0])))
  ) {
    const adjetivoDevenir = palabraDeTipo(palabras[1], idioma, "adjetivo");
    if (adjetivoDevenir) {
      return verboDevenirAdjetivo(adjetivoDevenir.clave);
    }
  }
  return null;
};

const candidatosGerundio = (token: string, idioma: IdiomaFuente): string[] => {
  if (idioma === "en") {
    if (!token.endsWith("ing") || token.length < 5) return [];
    const base = token.slice(0, -3);
    const candidatos = [base, `${base}e`];
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      candidatos.push(base.slice(0, -1));
    }
    if (base.endsWith("y")) {
      candidatos.push(`${base.slice(0, -1)}ie`);
    }
    return candidatos;
  }
  if (token === "yendo") return ["ir"];
  if (token.endsWith("yendo")) {
    const base = token.slice(0, -5);
    return [`${base}er`, `${base}ir`];
  }
  if (token.endsWith("ando")) return [`${token.slice(0, -4)}ar`];
  if (token.endsWith("iendo")) {
    const base = token.slice(0, -5);
    const candidatos = [`${base}er`, `${base}ir`];
    const indiceU = base.lastIndexOf("u");
    if (indiceU > 0) {
      const cambioU = `${base.slice(0, indiceU)}o${base.slice(indiceU + 1)}`;
      candidatos.push(`${cambioU}ir`, `${cambioU}er`);
    }
    const indiceI = base.lastIndexOf("i");
    if (indiceI > 0) {
      const cambioI = `${base.slice(0, indiceI)}e${base.slice(indiceI + 1)}`;
      candidatos.push(`${cambioI}ir`, `${cambioI}er`);
    }
    return candidatos;
  }
  return [];
};

const PARTICIPIOS_POSTURA_ES: Record<string, string> = {
  sentado: "sit",
  sentada: "sit",
  sentados: "sit",
  sentadas: "sit",
  parado: "stand up",
  parada: "stand up",
  parados: "stand up",
  paradas: "stand up",
  acostado: "sleep",
  acostada: "sleep",
  acostados: "sleep",
  acostadas: "sleep",
  tumbado: "sleep",
  tumbada: "sleep",
  tumbados: "sleep",
  tumbadas: "sleep",
};

const buscarVerboGerundio = (
  palabras: string[],
  idioma: IdiomaFuente
): VerboVocabulario | null => {
  if (palabras.length === 0) return null;
  if (idioma === "es" && palabras.length === 1) {
    const posturaClave = PARTICIPIOS_POSTURA_ES[desacentuar(palabras[0])];
    if (posturaClave) {
      const verboPostura = VOCAB.verbos.find(
        (candidato) => candidato.clave === posturaClave
      );
      if (verboPostura) return verboPostura;
    }
  }
  const formas = new Set<string>([palabras[0]]);
  if (idioma === "es") {
    const base = desacentuar(palabras[0]);
    formas.add(base);
    for (const recorte of sinCliticoFinal(base)) formas.add(recorte);
  }
  for (const forma of formas) {
    for (const candidato of candidatosGerundio(forma, idioma)) {
      const verbo =
        (idioma === "es" && palabras.length === 1
          ? preferirReflexivo(candidato)
          : null) ??
        buscarVerbo([candidato, ...palabras.slice(1)], idioma) ??
        (idioma === "es"
          ? buscarVerbo([`${candidato}se`, ...palabras.slice(1)], idioma)
          : null);
      if (verbo) return verbo;
    }
  }
  return null;
};

const reversionesDiptongo = (base: string): string[] => {
  const resultados: string[] = [];
  const indiceUe = base.lastIndexOf("ue");
  if (indiceUe > 0) {
    resultados.push(`${base.slice(0, indiceUe)}o${base.slice(indiceUe + 2)}`);
    resultados.push(`${base.slice(0, indiceUe)}u${base.slice(indiceUe + 2)}`);
  }
  const indiceIe = base.lastIndexOf("ie");
  if (indiceIe > 0) {
    resultados.push(`${base.slice(0, indiceIe)}e${base.slice(indiceIe + 2)}`);
  }
  const indiceI = base.lastIndexOf("i");
  if (indiceI > 0) {
    resultados.push(`${base.slice(0, indiceI)}e${base.slice(indiceI + 1)}`);
  }
  const indiceU = base.lastIndexOf("u");
  if (indiceU > 0) {
    resultados.push(`${base.slice(0, indiceU)}o${base.slice(indiceU + 1)}`);
  }
  return resultados;
};

const desacentuar = (token: string): string =>
  token
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u");

const CLITICOS_ES = new Set([
  "me",
  "te",
  "se",
  "nos",
  "os",
  "lo",
  "la",
  "le",
  "los",
  "las",
  "les",
]);

const sinCliticoFinal = (token: string): string[] => {
  const resultados: string[] = [];
  const agregarRecortes = (t: string) => {
    for (const clitico of CLITICOS_ES) {
      if (t.length > clitico.length + 2 && t.endsWith(clitico)) {
        const recorte = t.slice(0, -clitico.length);
        if (!resultados.includes(recorte)) resultados.push(recorte);
      }
    }
  };
  agregarRecortes(token);
  for (const recorte of [...resultados]) agregarRecortes(recorte);
  return resultados;
};

const candidatosImperativoEs = (token: string): string[] => {
  const candidatos: string[] = [];
  const agregar = (base: string, terminaciones: string[]) => {
    for (const b of [base, ...reversionesDiptongo(base)]) {
      for (const terminacion of terminaciones) {
        candidatos.push(`${b}${terminacion}`);
        if (b.endsWith("g")) candidatos.push(`${b}u${terminacion}`);
      }
    }
  };
  for (const sufijo of ["emos", "es", "en", "e"]) {
    if (token.endsWith(sufijo) && token.length > sufijo.length + 1) {
      let base = token.slice(0, -sufijo.length);
      if (base.endsWith("qu")) base = `${base.slice(0, -2)}c`;
      else if (base.endsWith("gu")) base = `${base.slice(0, -2)}g`;
      else if (base.endsWith("c")) base = `${base.slice(0, -1)}z`;
      agregar(base, ["ar"]);
      break;
    }
  }
  for (const sufijo of ["amos", "as", "an", "a"]) {
    if (token.endsWith(sufijo) && token.length > sufijo.length + 1) {
      agregar(token.slice(0, -sufijo.length), ["er", "ir"]);
      break;
    }
  }
  if (token.endsWith("ad")) candidatos.push(`${token.slice(0, -2)}ar`);
  if (token.endsWith("ed")) candidatos.push(`${token.slice(0, -2)}er`);
  if (token.endsWith("id")) candidatos.push(`${token.slice(0, -2)}ir`);
  return candidatos;
};

const OBJETOS_IMPERATIVO_EN = new Set(["it", "him", "her", "them", "me", "us"]);

const buscarVerboImperativo = (
  palabrasIniciales: string[],
  idioma: IdiomaFuente
): VerboVocabulario | null => {
  let palabras = palabrasIniciales;
  if (
    idioma === "en" &&
    palabras.length > 1 &&
    OBJETOS_IMPERATIVO_EN.has(palabras[palabras.length - 1]) &&
    !VERBOS.en.get(palabras.join(" "))
  ) {
    palabras = palabras.slice(0, -1);
  }
  if (idioma === "es" && FORMAS_PRESENTE_ES.has(palabras.join(" "))) {
    return null;
  }
  const directo = buscarVerbo(palabras, idioma);
  if (directo) return directo;
  if (idioma !== "es" || palabras.length === 0) return null;
  if (CLITICOS_ES.has(palabras[0]) && palabras.length > 1) {
    const sinClitico = buscarVerboImperativo(palabras.slice(1), idioma);
    if (sinClitico) return sinClitico;
  }
  const base = desacentuar(palabras[0]);
  const variantes = [palabras[0], base, ...sinCliticoFinal(base)];
  for (const variante of variantes) {
    const directoVariante = buscarVerbo(
      [variante, ...palabras.slice(1)],
      idioma
    );
    if (directoVariante) return directoVariante;
    for (const candidato of candidatosImperativoEs(variante)) {
      const verbo =
        (palabras.length === 1 ? preferirReflexivo(candidato) : null) ??
        buscarVerbo([candidato, ...palabras.slice(1)], idioma) ??
        buscarVerbo([`${candidato}se`, ...palabras.slice(1)], idioma);
      if (verbo) return verbo;
    }
  }
  return null;
};

const FUTUROS_IRREGULARES_ES: Record<string, string> = {
  pondr: "poner",
  saldr: "salir",
  vendr: "venir",
  tendr: "tener",
  obtendr: "obtener",
  sostendr: "sostener",
  dir: "decir",
  har: "hacer",
  sabr: "saber",
  querr: "querer",
  podr: "poder",
  valdr: "valer",
};

const PRETERITOS_IRREGULARES_ES: Record<
  string,
  { infinitivo: string; persona: PersonaIR }
> = {
  fui: { infinitivo: "ir", persona: "1sg" },
  fuiste: { infinitivo: "ir", persona: "2sg" },
  fue: { infinitivo: "ir", persona: "3sg" },
  fuimos: { infinitivo: "ir", persona: "1pl_incl" },
  fueron: { infinitivo: "ir", persona: "3pl" },
  di: { infinitivo: "dar", persona: "1sg" },
  diste: { infinitivo: "dar", persona: "2sg" },
  dio: { infinitivo: "dar", persona: "3sg" },
  dimos: { infinitivo: "dar", persona: "1pl_incl" },
  dieron: { infinitivo: "dar", persona: "3pl" },
  puse: { infinitivo: "poner", persona: "1sg" },
  pusiste: { infinitivo: "poner", persona: "2sg" },
  puso: { infinitivo: "poner", persona: "3sg" },
  pusimos: { infinitivo: "poner", persona: "1pl_incl" },
  pusieron: { infinitivo: "poner", persona: "3pl" },
  dije: { infinitivo: "decir", persona: "1sg" },
  dijiste: { infinitivo: "decir", persona: "2sg" },
  dijo: { infinitivo: "decir", persona: "3sg" },
  dijimos: { infinitivo: "decir", persona: "1pl_incl" },
  dijeron: { infinitivo: "decir", persona: "3pl" },
  vi: { infinitivo: "ver", persona: "1sg" },
  viste: { infinitivo: "ver", persona: "2sg" },
  vio: { infinitivo: "ver", persona: "3sg" },
  vimos: { infinitivo: "ver", persona: "1pl_incl" },
  vieron: { infinitivo: "ver", persona: "3pl" },
  oí: { infinitivo: "oir", persona: "1sg" },
  oi: { infinitivo: "oir", persona: "1sg" },
  oíste: { infinitivo: "oir", persona: "2sg" },
  oiste: { infinitivo: "oir", persona: "2sg" },
  oyó: { infinitivo: "oir", persona: "3sg" },
  oyo: { infinitivo: "oir", persona: "3sg" },
  oyeron: { infinitivo: "oir", persona: "3pl" },
  hice: { infinitivo: "hacer", persona: "1sg" },
  hiciste: { infinitivo: "hacer", persona: "2sg" },
  hizo: { infinitivo: "hacer", persona: "3sg" },
  hicimos: { infinitivo: "hacer", persona: "1pl_incl" },
  hicieron: { infinitivo: "hacer", persona: "3pl" },
  caí: { infinitivo: "caer", persona: "1sg" },
  cai: { infinitivo: "caer", persona: "1sg" },
  caíste: { infinitivo: "caer", persona: "2sg" },
  caiste: { infinitivo: "caer", persona: "2sg" },
  cayó: { infinitivo: "caer", persona: "3sg" },
  cayo: { infinitivo: "caer", persona: "3sg" },
  caímos: { infinitivo: "caer", persona: "1pl_incl" },
  caimos: { infinitivo: "caer", persona: "1pl_incl" },
  cayeron: { infinitivo: "caer", persona: "3pl" },
  vine: { infinitivo: "venir", persona: "1sg" },
  viniste: { infinitivo: "venir", persona: "2sg" },
  vino: { infinitivo: "venir", persona: "3sg" },
  vinimos: { infinitivo: "venir", persona: "1pl_incl" },
  vinieron: { infinitivo: "venir", persona: "3pl" },
  traje: { infinitivo: "traer", persona: "1sg" },
  trajiste: { infinitivo: "traer", persona: "2sg" },
  trajo: { infinitivo: "traer", persona: "3sg" },
  trajimos: { infinitivo: "traer", persona: "1pl_incl" },
  trajeron: { infinitivo: "traer", persona: "3pl" },
  reí: { infinitivo: "reir", persona: "1sg" },
  rei: { infinitivo: "reir", persona: "1sg" },
  rió: { infinitivo: "reir", persona: "3sg" },
  rio: { infinitivo: "reir", persona: "3sg" },
  rieron: { infinitivo: "reir", persona: "3pl" },
};

const SUFIJOS_PRETERITO_ES: [string, PersonaIR, "ar" | "erir"][] = [
  ["asteis", "2pl", "ar"],
  ["isteis", "2pl", "erir"],
  ["aste", "2sg", "ar"],
  ["iste", "2sg", "erir"],
  ["aron", "3pl", "ar"],
  ["ieron", "3pl", "erir"],
  ["imos", "1pl_incl", "erir"],
  ["amos", "1pl_incl", "ar"],
  ["ió", "3sg", "erir"],
  ["ó", "3sg", "ar"],
  ["é", "1sg", "ar"],
  ["í", "1sg", "erir"],
];

const preteritoSintetico = (
  token: string
): { verbo: VerboVocabulario; persona: PersonaIR } | null => {
  const buscarInfinitivo = (candidato: string): VerboVocabulario | null =>
    preferirReflexivo(candidato) ??
    VERBOS.es.get(candidato) ??
    VERBOS.es.get(`${candidato}se`) ??
    null;
  const irregular = PRETERITOS_IRREGULARES_ES[token];
  if (irregular) {
    const verbo = buscarInfinitivo(irregular.infinitivo);
    if (verbo) return { verbo, persona: irregular.persona };
  }
  for (const [sufijo, persona, familia] of SUFIJOS_PRETERITO_ES) {
    if (!token.endsWith(sufijo) || token.length <= sufijo.length + 1) continue;
    const base = token.slice(0, -sufijo.length);
    const basesOrtograficas = [base];
    if (familia === "ar") {
      if (base.endsWith("qu")) basesOrtograficas.push(`${base.slice(0, -2)}c`);
      else if (base.endsWith("gu")) basesOrtograficas.push(`${base.slice(0, -2)}g`);
      else if (base.endsWith("c")) basesOrtograficas.push(`${base.slice(0, -1)}z`);
    }
    const terminaciones = familia === "ar" ? ["ar"] : ["er", "ir"];
    for (const baseOrtografica of basesOrtograficas) {
      for (const b of [baseOrtografica, ...reversionesDiptongo(baseOrtografica)]) {
        for (const terminacion of terminaciones) {
          const verbo =
            buscarInfinitivo(`${b}${terminacion}`) ??
            (b.endsWith("g")
              ? buscarInfinitivo(`${b}u${terminacion}`)
              : null);
          if (verbo) return { verbo, persona };
        }
      }
    }
  }
  return null;
};

const AUXILIARES_PRESENTE_EN = new Set([
  "is",
  "was",
  "has",
  "does",
  "as",
  "its",
  "this",
  "us",
  "his",
  "hers",
  "yes",
]);

const buscarVerboPresenteEn = (tokens: string[]): VerboVocabulario | null => {
  if (tokens.length === 0) return null;
  const token = tokens[0];
  if (token.length < 4 || !token.endsWith("s")) return null;
  if (AUXILIARES_PRESENTE_EN.has(token)) return null;
  const bases: string[] = [token.slice(0, -1)];
  if (token.endsWith("ies")) bases.push(`${token.slice(0, -3)}y`);
  if (token.endsWith("es")) bases.push(token.slice(0, -2));
  for (const base of bases) {
    const verbo = buscarVerbo([base, ...tokens.slice(1)], "en");
    if (verbo) return verbo;
  }
  return null;
};

const CAUSATIVOS_PASADO_ES = new Set([
  "hizo",
  "hicieron",
  "hice",
  "hiciste",
  "dejo",
  "dejaron",
  "deje",
  "dejaste",
]);

const buscarVerboPresenteEs = (tokens: string[]): VerboVocabulario | null => {
  if (tokens.length === 0) return null;
  const base = desacentuar(tokens[0]);
  if (/(ar|er|ir)(se)?$/.test(base)) return null;
  return buscarVerbo(tokens, "es");
};

const PASADO_EN: Record<string, string[]> = {
  went: ["go"],
  came: ["come"],
  fell: ["fall"],
  made: ["make"],
  wrote: ["write"],
  met: ["meet"],
  ate: ["eat"],
  ran: ["run"],
  sat: ["sit"],
  stood: ["stand"],
  lay: ["lie"],
  spoke: ["speak", "talk"],
  stole: ["steal"],
  sent: ["send"],
  became: ["become", "be"],
  was: ["be"],
  were: ["be"],
  had: ["have"],
  got: ["get"],
  gave: ["give"],
  hid: ["hide"],
  bent: ["bend"],
  split: ["split"],
  saw: ["see"],
  forgot: ["forget"],
  thought: ["think"],
  helped: ["help"],
  tried: ["try"],
  started: ["start"],
  arose: ["arise"],
  prayed: ["pray"],
  threw: ["throw"],
  heard: ["hear"],
  held: ["hold"],
  left: ["leave"],
  took: ["take"],
  brought: ["bring"],
  told: ["tell"],
  said: ["tell", "say"],
  dug: ["dig"],
  bit: ["bite"],
  wore: ["wear"],
  put: ["put"],
  broke: ["break"],
  burnt: ["burn"],
  burned: ["burn"],
  grew: ["grow"],
  taught: ["teach"],
  learnt: ["learn"],
  found: ["find"],
  flew: ["fly"],
  shut: ["shut"],
  hit: ["hit"],
  cut: ["cut"],
  beat: ["beat"],
  slept: ["sleep"],
  woke: ["wake"],
  sang: ["sing"],
  drank: ["drink"],
  built: ["build"],
  lit: ["light"],
  lost: ["lose"],
};

const candidatosPasadoEn = (token: string): string[] => {
  const irregulares = PASADO_EN[token];
  if (irregulares) return irregulares;
  if (token.endsWith("ied") && token.length > 4) {
    return [`${token.slice(0, -3)}y`];
  }
  if (token.endsWith("ed") && token.length > 3) {
    const base = token.slice(0, -2);
    const candidatos = [base, `${base}e`];
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      candidatos.push(base.slice(0, -1));
    }
    return candidatos;
  }
  return [];
};

const buscarVerboTerceraEn = (
  palabras: string[]
): VerboVocabulario | null => {
  if (palabras.length === 0) return null;
  const token = palabras[0];
  if (!token.endsWith("s") || token.length < 3) return null;
  const candidatos = token.endsWith("ies")
    ? [`${token.slice(0, -3)}y`]
    : token.endsWith("es")
      ? [token.slice(0, -1), token.slice(0, -2)]
      : [token.slice(0, -1)];
  for (const candidato of candidatos) {
    const verbo = buscarVerbo([candidato, ...palabras.slice(1)], "en");
    if (verbo) return verbo;
  }
  return null;
};

const buscarVerboPasadoEn = (
  palabras: string[]
): VerboVocabulario | null => {
  if (palabras.length === 0) return null;
  for (const candidato of candidatosPasadoEn(palabras[0])) {
    const verbo = buscarVerbo([candidato, ...palabras.slice(1)], "en");
    if (verbo) return verbo;
  }
  return null;
};

const futuroSintetico = (
  token: string
): { verbo: VerboVocabulario; persona: PersonaIR } | null => {
  for (const [sufijo, persona] of FUTURO_SUFIJOS_ES) {
    if (!token.endsWith(sufijo) || token.length <= sufijo.length + 1) continue;
    const base = token.slice(0, -sufijo.length);
    if (!base.endsWith("r")) continue;
    const verbo =
      preferirReflexivo(base) ??
      VERBOS.es.get(base) ??
      VERBOS.es.get(`${base}se`) ??
      (FUTUROS_IRREGULARES_ES[base]
        ? VERBOS.es.get(FUTUROS_IRREGULARES_ES[base])
        : undefined);
    if (verbo) return { verbo, persona };
  }
  return null;
};

const hayAdverbioMasLargo = (
  tokens: string[],
  inicio: number,
  longitud: number,
  idioma: IdiomaFuente
): boolean =>
  ADVERBIOS[idioma].some((otro) => {
    if (otro.tokens.length <= longitud) return false;
    return (
      tokens.slice(inicio, inicio + otro.tokens.length).join(" ") ===
      otro.tokens.join(" ")
    );
  });

const extraerAdverbio = (
  palabras: string[],
  idioma: IdiomaFuente
): { adverbio?: string; resto: string[] } => {
  for (const { tokens, entrada } of ADVERBIOS[idioma]) {
    const n = tokens.length;
    if (palabras.length < n) continue;
    if (palabras.slice(0, n).join(" ") === tokens.join(" ")) {
      return { adverbio: entrada.clave, resto: palabras.slice(n) };
    }
    if (palabras.slice(-n).join(" ") === tokens.join(" ")) {
      return { adverbio: entrada.clave, resto: palabras.slice(0, -n) };
    }
  }
  return { resto: palabras };
};

const esFraseAdverbio = (
  tokens: string[],
  idioma: IdiomaFuente
): boolean => {
  const clave = tokens.join(" ");
  return ADVERBIOS[idioma].some(
    (adverbio) => adverbio.tokens.join(" ") === clave
  );
};

const nombreAgentivo = (
  token: string,
  idioma: IdiomaFuente
): PalabraVocabulario | null => {
  const bases: string[] = [];
  if (idioma === "en") {
    if (token.length > 3 && token.endsWith("er")) {
      bases.push(token.slice(0, -2), token.slice(0, -1));
    }
  } else {
    const sinFemenino = token.endsWith("dora")
      ? token.slice(0, -1)
      : token;
    if (sinFemenino.length > 4 && sinFemenino.endsWith("dor")) {
      const raiz = sinFemenino.slice(0, -3);
      bases.push(raiz, `${raiz}r`);
    }
  }
  for (const base of bases) {
    const verbo = buscarVerbo([base], idioma);
    if (!verbo) continue;
    const candidatos = verbosPorLema(verbo.lema);
    if (candidatos.length === 0) continue;
    const formaIV = formaAtestada(candidatos[0], "IV")[0];
    if (!formaIV) continue;
    return {
      clave: `agente:${verbo.clave}`,
      gup: `${formaIV}mirri`,
      tipo: "sustantivo",
      persona: true,
      es: [],
      en: [],
      leccion: 42,
    };
  }
  return null;
};

const cortaDeVerbo = (verbo: VerboVocabulario): string | null => {
  const candidatos = verbosPorLema(verbo.lema);
  if (candidatos.length === 0) return null;
  const libro = candidatos[0];
  return (
    (libro.group === 1
      ? formaAtestada(libro, "I")[0]
      : formaAtestada(libro, "IV")[0]) ?? null
  );
};

const adjetivoResultado = (
  token: string,
  idioma: IdiomaFuente
): PalabraVocabulario | null => {
  if (idioma === "en" && token.startsWith("un") && token.length > 4) {
    const positivo = token.slice(2);
    if (PARTICIPIOS_ESTATIVOS_EN[positivo] === undefined) {
      const verboNegado = verboParticipioEn([positivo]);
      if (verboNegado) {
        const cortaNegada = cortaDeVerbo(verboNegado);
        if (cortaNegada) {
          return {
            clave: `carencia:${verboNegado.clave}`,
            gup: `${cortaNegada}miriw`,
            tipo: "adjetivo",
            es: [],
            en: [],
            leccion: 73,
          };
        }
      }
    }
  }
  if (idioma === "en" && PARTICIPIOS_ESTATIVOS_EN[token] !== undefined) {
    return null;
  }
  if (idioma === "es" && SENTIMIENTO_ES[desacentuar(token)] !== undefined) {
    return null;
  }
  const verbo =
    idioma === "en" ? verboParticipioEn([token]) : verboParticipioEs(token);
  if (!verbo) return null;
  const corta = cortaDeVerbo(verbo);
  if (!corta) return null;
  return {
    clave: `resultado:${verbo.clave}`,
    gup: `${corta}wuy`,
    tipo: "adjetivo",
    es: [],
    en: [],
    leccion: 68,
  };
};

const NOMBRES_DEVERBALES: Record<IdiomaFuente, Record<string, string>> = {
  en: {
    punishment: "punish",
    thoughts: "think",
    thought: "think",
    prayer: "pray",
    prayers: "pray",
    teachings: "teach",
    teaching: "teach",
    writing: "write",
    writings: "write",
    swearing: "swear",
    lies: "fib",
    creation: "create",
    belief: "believe",
    faith: "believe",
    unbelief: "disbelieve",
  },
  es: {
    castigo: "castigar",
    pensamientos: "pensar",
    pensamiento: "pensar",
    escritura: "escribir",
    mentiras: "mentir",
    mentira: "mentir",
    creencia: "creer",
    fe: "creer",
    creacion: "crear",
  },
};

const sustantivoDeVerbo = (
  token: string,
  idioma: IdiomaFuente
): PalabraVocabulario | null => {
  const base =
    NOMBRES_DEVERBALES[idioma][
      idioma === "es" ? desacentuar(token) : token
    ];
  if (!base) return null;
  const verbo = buscarVerbo([base], idioma);
  if (!verbo) return null;
  const corta = cortaDeVerbo(verbo);
  if (!corta) return null;
  return {
    clave: `accion:${verbo.clave}`,
    gup: `${corta}wuy`,
    tipo: "sustantivo",
    basesAlternas: [`${corta}ra`],
    es: [],
    en: [],
    leccion: 70,
  };
};

const PLURAL_IRREGULAR_EN: Record<string, string> = {
  men: "man",
  women: "woman",
  feet: "foot",
  teeth: "tooth",
};

const PLURAL_TOKENS_EN = new Set(["people", "men", "women", "feet", "teeth"]);

const palabraDeTipo = (
  token: string,
  idioma: IdiomaFuente,
  tipo: PalabraVocabulario["tipo"]
): PalabraVocabulario | null => {
  const buscar = (t: string): PalabraVocabulario | null => {
    for (const palabra of PALABRAS[idioma].get(t) ?? []) {
      if (palabra.tipo === tipo) return palabra;
    }
    return null;
  };
  const directo = buscar(token);
  if (directo) return directo;
  if (idioma === "en" && PLURAL_IRREGULAR_EN[token] !== undefined) {
    const irregular = buscar(PLURAL_IRREGULAR_EN[token]);
    if (irregular) return irregular;
  }
  if (idioma === "en" && token.endsWith("ies") && token.length > 4) {
    const sinIes = buscar(`${token.slice(0, -3)}y`);
    if (sinIes) return sinIes;
  }
  if (token.endsWith("es") && token.length > 3) {
    const sinEs = buscar(token.slice(0, -2));
    if (sinEs) return sinEs;
  }
  if (token.endsWith("s") && token.length > 2) {
    const sinS = buscar(token.slice(0, -1));
    if (sinS) return sinS;
  }
  if (tipo === "sustantivo") {
    const deverbal = sustantivoDeVerbo(token, idioma);
    if (deverbal) return deverbal;
    const agentivo = nombreAgentivo(token, idioma);
    if (agentivo) return agentivo;
    if (idioma === "en" && token.endsWith("s") && token.length > 2) {
      return nombreAgentivo(token.slice(0, -1), idioma);
    }
    if (idioma === "es" && token.endsWith("es") && token.length > 3) {
      return nombreAgentivo(token.slice(0, -2), idioma);
    }
  }
  if (tipo === "adjetivo") {
    const resultado = adjetivoResultado(token, idioma);
    if (resultado) return resultado;
  }
  return null;
};

const esPluralSuperficie = (
  token: string,
  palabra: PalabraVocabulario,
  idioma: IdiomaFuente
): boolean => {
  if (idioma === "en" && PLURAL_TOKENS_EN.has(token)) return true;
  const directo = (PALABRAS[idioma].get(token) ?? []).includes(palabra);
  return !directo && token.length > 2 && token.endsWith("s");
};

const quitarIndefinido = (
  palabras: string[],
  idioma: IdiomaFuente
): string[] =>
  palabras.length > 0 && INDEFINIDOS[idioma].has(palabras[0])
    ? palabras.slice(1)
    : palabras;

const quitarArticulo = (
  palabras: string[],
  idioma: IdiomaFuente
): string[] =>
  palabras.length > 0 &&
  (INDEFINIDOS[idioma].has(palabras[0]) || ARTICULOS[idioma].has(palabras[0]))
    ? palabras.slice(1)
    : palabras;

const tiempoFuturo = (adverbio?: string): TiempoIR =>
  adverbio === "tomorrow" ? "futuro_manana" : "futuro_hoy";

let lugarPendiente: LugarIR | null = null;
let comitativoPendiente: ComitativoIR | null = null;
let destinoPendiente: DestinoIR | null = null;
let origenPendiente: OrigenIR | null = null;
let propositoPendiente: PropositoIR | null = null;
let objetoIndirectoPendiente: ObjetoIR | null = null;
let instrumentoPendiente: InstrumentoIR | null = null;
let pertenenciaPendiente: PertenenciaIR | null = null;
let perlativoPendiente: PerlativoIR | null = null;
let vecesPendiente: string | null = null;
let reflexivoPendiente = false;
let habitualContexto: HabitualIR | null = null;
let maneraContexto = false;

const CLITICOS_REFLEXIVOS_ES = new Set(["me", "te", "se", "nos", "os"]);

const hayReflexivoEs = (tokens: string[]): boolean =>
  tokens.some(
    (token, indice) =>
      (CLITICOS_REFLEXIVOS_ES.has(token) && indice + 1 < tokens.length) ||
      [...CLITICOS_REFLEXIVOS_ES].some(
        (clitico) =>
          token.length > clitico.length + 3 &&
          token.endsWith(clitico) &&
          !VERBOS.es.get(token)
      )
  );

const preferirReflexivo = (base: string): VerboVocabulario | null => {
  if (!reflexivoPendiente) return null;
  return VERBOS.es.get(`${base}se`) ?? null;
};

const fraseVerbal = (
  persona: PersonaIR,
  verbo: VerboVocabulario,
  tiempo: TiempoIR,
  polaridad: FraseIR["polaridad"],
  adverbio?: string,
  aspecto?: "continuo"
): FraseIR => ({
  modo: "declarativa",
  polaridad,
  sujeto: { persona },
  predicado: { tipo: "verbo", clave: verbo.clave },
  tiempo,
  adverbio,
  ...(aspecto ? { aspecto } : {}),
  ...(lugarPendiente ? { lugar: lugarPendiente } : {}),
  ...(comitativoPendiente ? { comitativo: comitativoPendiente } : {}),
  ...(destinoPendiente ? { destino: destinoPendiente } : {}),
  ...(origenPendiente ? { origen: origenPendiente } : {}),
  ...(propositoPendiente ? { proposito: propositoPendiente } : {}),
  ...(objetoIndirectoPendiente
    ? { objetoIndirecto: objetoIndirectoPendiente }
    : {}),
  ...(instrumentoPendiente ? { instrumento: instrumentoPendiente } : {}),
  ...(pertenenciaPendiente ? { pertenencia: pertenenciaPendiente } : {}),
  ...(perlativoPendiente ? { perlativo: perlativoPendiente } : {}),
  ...(vecesPendiente ? { veces: vecesPendiente } : {}),
});

const NO_SON_NOMBRES = new Set([
  "it",
  "them",
  "him",
  "her",
  "us",
  "me",
  "time",
  "first",
  "you",
  "this",
  "that",
  "these",
  "those",
  "there",
  "here",
  "lo",
  "la",
  "le",
  "los",
  "las",
  "les",
  "se",
  "te",
  "nos",
  "esto",
  "eso",
  "esta",
  "ese",
  "aquí",
  "aqui",
  "allí",
  "alli",
  "allá",
  "alla",
  "él",
  "ella",
  "ellos",
  "ellas",
  "yo",
  "tú",
  "tu",
  "qué",
  "que",
  "quién",
  "quien",
  "what",
  "who",
  "whom",
  "where",
  "when",
  "why",
  "how",
  "dónde",
  "donde",
  "adónde",
  "adonde",
  "cuándo",
  "cuando",
  "cómo",
  "como",
  "por",
  "myself",
  "yourself",
  "himself",
  "herself",
  "itself",
  "ourselves",
  "yourselves",
  "themselves",
  "mismo",
  "misma",
  "mismos",
  "mismas",
  "sí",
  "si",
]);

const PRONOMBRE_COMITATIVO_EN: Record<string, PersonaIR> = {
  me: "1sg",
  you: "2sg",
  him: "3sg",
  her: "3sg",
  us: "1pl_incl",
  them: "3pl",
  "them two": "3dual",
  "you two": "2dual",
  "us two": "1dual_excl",
};

type PoseedorNP = {
  resto: string[];
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  demostrativoPoseedor?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
};

const PROPIO_ES = new Set(["propio", "propia", "propios", "propias"]);

const ENFASIS_POSESIVO: Record<IdiomaFuente, Set<string>> = {
  en: new Set(["only"]),
  es: new Set(["solo", "sólo", "solamente"]),
};

const separarPoseedorNP = (
  tokensIniciales: string[],
  idioma: IdiomaFuente
): PoseedorNP => {
  const tokens = [...tokensIniciales];
  if (
    tokens.length > 2 &&
    ENFASIS_POSESIVO[idioma].has(tokens[0]) &&
    POSESIVOS_DET[idioma][tokens[1]] !== undefined
  ) {
    const interno = separarPoseedorNP(tokens.slice(1), idioma);
    if (interno.posesivo !== undefined) {
      return { ...interno, posesivoEnfatico: true };
    }
  }
  if (tokens.length > 2 && DEMOSTRATIVOS[idioma][tokens[0]] !== undefined) {
    const interno = separarPoseedorNP(tokens.slice(1), idioma);
    if (
      interno.posesivoNombre !== undefined ||
      interno.posesivoSustantivo !== undefined
    ) {
      return {
        ...interno,
        demostrativoPoseedor: DEMOSTRATIVOS[idioma][tokens[0]],
      };
    }
  }
  if (tokens.length > 1 && POSESIVOS_DET[idioma][tokens[0]] !== undefined) {
    if (
      tokens.length > 2 &&
      (idioma === "en" ? tokens[1] === "own" : PROPIO_ES.has(tokens[1]))
    ) {
      return {
        resto: tokens.slice(2),
        posesivo: POSESIVOS_DET[idioma][tokens[0]],
        posesivoReflexivo: true,
      };
    }
    return { resto: tokens.slice(1), posesivo: POSESIVOS_DET[idioma][tokens[0]] };
  }
  if (
    idioma === "en" &&
    tokens.length > 1 &&
    tokens[0].endsWith("s") &&
    tokens[0].length > 2 &&
    !OBJETO_PRON_EN[tokens[0]]
  ) {
    const conocido = palabraDeTipo(tokens[0], "en", "sustantivo");
    if (
      conocido &&
      conocido.persona === true &&
      palabraDeTipo(tokens[1], "en", "sustantivo")
    ) {
      return { resto: tokens.slice(1), posesivoSustantivo: conocido.clave };
    }
    if (
      !conocido &&
      !PALABRAS.en.get(tokens[0]) &&
      !VERBOS.en.get(tokens[0])
    ) {
      const basePoseedor = tokens[0].slice(0, -1);
      const sustantivoPoseedor = palabraDeTipo(basePoseedor, "en", "sustantivo");
      if (sustantivoPoseedor) {
        return {
          resto: tokens.slice(1),
          posesivoSustantivo: sustantivoPoseedor.clave,
        };
      }
      if (!NO_SON_NOMBRES.has(basePoseedor)) {
        return {
          resto: tokens.slice(1),
          posesivoNombre:
            basePoseedor.charAt(0).toUpperCase() + basePoseedor.slice(1),
        };
      }
    }
  }
  if (idioma === "es" && tokens.length > 2 && tokens[1] === "de") {
    let inicioPoseedor = 2;
    if (
      tokens.length > 3 &&
      (ARTICULOS.es.has(tokens[inicioPoseedor]) ||
        INDEFINIDOS.es.has(tokens[inicioPoseedor]))
    ) {
      inicioPoseedor += 1;
    }
    let demostrativoDe: DemostrativoIR | undefined;
    if (
      tokens.length > inicioPoseedor + 1 &&
      DEMOSTRATIVOS.es[tokens[inicioPoseedor]] !== undefined
    ) {
      demostrativoDe = DEMOSTRATIVOS.es[tokens[inicioPoseedor]];
      inicioPoseedor += 1;
    }
    const candidato = tokens[inicioPoseedor];
    if (candidato !== undefined) {
      const resto = [tokens[0], ...tokens.slice(inicioPoseedor + 1)];
      const camposDemDe = demostrativoDe
        ? { demostrativoPoseedor: demostrativoDe }
        : {};
      const conocido = palabraDeTipo(candidato, "es", "sustantivo");
      if (conocido && conocido.persona === true) {
        return { resto, posesivoSustantivo: conocido.clave, ...camposDemDe };
      }
      if (
        !conocido &&
        !NO_SON_NOMBRES.has(candidato) &&
        !PALABRAS.es.get(candidato) &&
        !VERBOS.es.get(candidato)
      ) {
        return {
          resto,
          posesivoNombre:
            candidato.charAt(0).toUpperCase() + candidato.slice(1),
          ...camposDemDe,
        };
      }
    }
  }
  return { resto: tokens };
};

const camposPoseedor = (
  poseedor: PoseedorNP
): {
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
} => ({
  ...(poseedor.posesivo ? { posesivo: poseedor.posesivo } : {}),
  ...(poseedor.posesivoNombre
    ? { posesivoNombre: poseedor.posesivoNombre }
    : {}),
  ...(poseedor.posesivoSustantivo
    ? { posesivoSustantivo: poseedor.posesivoSustantivo }
    : {}),
  ...(poseedor.demostrativoPoseedor
    ? { posesivoDemostrativo: poseedor.demostrativoPoseedor }
    : {}),
  ...(poseedor.posesivoEnfatico ? { posesivoEnfatico: true } : {}),
  ...(poseedor.posesivoReflexivo ? { posesivoReflexivo: true } : {}),
});

const separarDemostrativoNP = (
  np: string[],
  idioma: IdiomaFuente
): { demostrativo?: DemostrativoIR; resto: string[] } =>
  np.length > 1 && DEMOSTRATIVOS[idioma][np[0]] !== undefined
    ? { demostrativo: DEMOSTRATIVOS[idioma][np[0]], resto: np.slice(1) }
    : { resto: np };

const tienePoseedor = (poseedor: PoseedorNP): boolean =>
  poseedor.posesivo !== undefined ||
  poseedor.posesivoNombre !== undefined ||
  poseedor.posesivoSustantivo !== undefined;

const extraerComitativo = (
  tokens: string[],
  idioma: IdiomaFuente
): { comitativo: ComitativoIR; resto: string[] } | null => {
  if (idioma === "es" && tokens.length > 0) {
    const ultimo = tokens[tokens.length - 1];
    if (ultimo === "conmigo") {
      return { comitativo: { persona: "1sg" }, resto: tokens.slice(0, -1) };
    }
    if (ultimo === "contigo") {
      return { comitativo: { persona: "2sg" }, resto: tokens.slice(0, -1) };
    }
  }
  const analizarPersonaNP = (
    np: string[],
    requiereDeterminante: boolean
  ): ComitativoIR | null => {
    const clave = np.join(" ");
    const personaPron =
      idioma === "es"
        ? (PRONOMBRES_DOBLES.es[clave] ??
          PRONOMBRES_OBLICUOS_ES[clave] ??
          PRONOMBRES.es[clave])
        : PRONOMBRE_COMITATIVO_EN[clave];
    if (personaPron) return { persona: personaPron };
    let restoNP = [...np];
    let tuvoDeterminante = false;
    if (
      restoNP.length > 1 &&
      (ARTICULOS[idioma].has(restoNP[0]) ||
        INDEFINIDOS[idioma].has(restoNP[0]) ||
        POSESIVOS_DET[idioma][restoNP[0]] !== undefined)
    ) {
      restoNP = restoNP.slice(1);
      tuvoDeterminante = true;
    }
    const demCom = separarDemostrativoNP(restoNP, idioma);
    if (demCom.demostrativo) {
      restoNP = demCom.resto;
      tuvoDeterminante = true;
    }
    const camposDemCom = demCom.demostrativo
      ? { demostrativo: demCom.demostrativo }
      : {};
    let aceptaSustantivo = !requiereDeterminante || tuvoDeterminante;
    const compuesta = (PALABRAS[idioma].get(restoNP.join(" ")) ?? []).find(
      (palabra) => palabra.tipo === "sustantivo"
    );
    if (compuesta) {
      return compuesta.persona && aceptaSustantivo
        ? { sustantivo: compuesta.clave, ...camposDemCom }
        : null;
    }
    const adjCom = separarAdjetivoNP(restoNP, idioma);
    restoNP = adjCom.resto;
    if (adjCom.adjetivo) aceptaSustantivo = true;
    if (restoNP.length !== 1) return null;
    const sustantivo = palabraDeTipo(restoNP[0], idioma, "sustantivo");
    if (sustantivo) {
      return sustantivo.persona && aceptaSustantivo
        ? {
            sustantivo: sustantivo.clave,
            ...(adjCom.adjetivo ? { adjetivo: adjCom.adjetivo } : {}),
            ...camposDemCom,
          }
        : null;
    }
    if (
      !NO_SON_NOMBRES.has(restoNP[0]) &&
      !PALABRAS[idioma].get(restoNP[0]) &&
      !VERBOS[idioma].get(restoNP[0]) &&
      !(idioma === "en" ? ESTADOS_EN[restoNP[0]] : ESTADOS_ES[restoNP[0]])
    ) {
      return {
        nombre: restoNP[0].charAt(0).toUpperCase() + restoNP[0].slice(1),
      };
    }
    return null;
  };
  const restoVerbal = (resto: string[]): boolean => {
    if (resto.length === 0) return false;
    return resto.some(
      (token) =>
        SER[idioma].has(token) ||
        (idioma === "es" && PERSONA_SER_ES[token] !== undefined) ||
        VERBOS[idioma].get(token) !== undefined ||
        buscarVerbo([token], idioma) !== null ||
        buscarVerboGerundio([token], idioma) !== null ||
        (idioma === "en"
          ? buscarVerboPasadoEn([token]) !== null
          : preteritoSintetico(token) !== null ||
            futuroSintetico(token) !== null) ||
        buscarVerboImperativo([token], idioma) !== null
    );
  };
  const PREP = idioma === "es" ? "con" : "with";
  for (let indice = tokens.length - 2; indice >= 0; indice--) {
    if (tokens[indice] !== PREP) continue;
    const resto = tokens.slice(0, indice);
    if (!restoVerbal(resto) && resto.length > 0) return null;
    const comitativoNP = analizarPersonaNP(tokens.slice(indice + 1), true);
    if (comitativoNP) {
      return { comitativo: comitativoNP, resto };
    }
    return null;
  }
  for (const { tokens: formaAdv, entrada } of ADVERBIOS[idioma]) {
    if (entrada.subtipo !== "lugar") continue;
    const n = formaAdv.length;
    for (let inicio = 0; inicio + n < tokens.length; inicio++) {
      if (tokens.slice(inicio, inicio + n).join(" ") !== formaAdv.join(" ")) {
        continue;
      }
      if (hayAdverbioMasLargo(tokens, inicio, n, idioma)) continue;
      let np = tokens.slice(inicio + n);
      if (np[0] === "de" || np[0] === "of") np = np.slice(1);
      const comitativoNP = analizarPersonaNP(np, false);
      if (comitativoNP) {
        return {
          comitativo: { adverbio: entrada.clave, ...comitativoNP },
          resto: tokens.slice(0, inicio),
        };
      }
    }
  }
  return null;
};

const VERBOS_RALI: Record<IdiomaFuente, Set<string>> = {
  es: new Set(VOCAB.direcciones.rali.verbos.es),
  en: new Set(VOCAB.direcciones.rali.verbos.en),
};

const FRASES_DIRECCION: Record<
  IdiomaFuente,
  { tokens: string[]; direccion: "bala" | "rali" }[]
> = {
  es: [
    ...VOCAB.direcciones.bala.es.map((forma) => ({
      tokens: limpiar(forma),
      direccion: "bala" as const,
    })),
    ...VOCAB.direcciones.rali.es.map((forma) => ({
      tokens: limpiar(forma),
      direccion: "rali" as const,
    })),
  ].sort((a, b) => b.tokens.length - a.tokens.length),
  en: [
    ...VOCAB.direcciones.bala.en.map((forma) => ({
      tokens: limpiar(forma),
      direccion: "bala" as const,
    })),
    ...VOCAB.direcciones.rali.en.map((forma) => ({
      tokens: limpiar(forma),
      direccion: "rali" as const,
    })),
  ].sort((a, b) => b.tokens.length - a.tokens.length),
};

const extraerDireccion = (
  tokens: string[],
  idioma: IdiomaFuente
): { direccion: "bala" | "rali"; resto: string[] } | null => {
  for (const { tokens: forma, direccion } of FRASES_DIRECCION[idioma]) {
    const n = forma.length;
    for (let inicio = 0; inicio + n <= tokens.length; inicio++) {
      if (tokens.slice(inicio, inicio + n).join(" ") !== forma.join(" ")) {
        continue;
      }
      return {
        direccion,
        resto: [...tokens.slice(0, inicio), ...tokens.slice(inicio + n)],
      };
    }
  }
  return null;
};

const verboDeMovimiento = (
  tokens: string[],
  idioma: IdiomaFuente
): boolean =>
  tokens.some((token) => {
    const candidatos: (VerboVocabulario | null)[] = [
      buscarVerbo([token], idioma),
      buscarVerboGerundio([token], idioma),
      buscarVerboImperativo([token], idioma),
      idioma === "en" ? buscarVerboPasadoEn([token]) : null,
      idioma === "en" ? buscarVerboPresenteEn([token]) : null,
      idioma === "en" ? verboParticipioEn([token]) : null,
      idioma === "es" ? (preteritoSintetico(token)?.verbo ?? null) : null,
      idioma === "es" ? (futuroSintetico(token)?.verbo ?? null) : null,
    ];
    return candidatos.some(
      (verbo) => verbo?.movimiento === true || verbo?.transporte === true
    );
  });

const CLITICOS_OBJETO_ES = [
  "lo",
  "la",
  "le",
  "los",
  "las",
  "les",
  "me",
  "te",
  "nos",
];

const tieneObjetoEs = (tokens: string[]): boolean =>
  tokens.some(
    (token) =>
      CLITICOS_OBJETO_ES.includes(token) ||
      CLITICOS_OBJETO_ES.some(
        (clitico) => token.length > clitico.length + 2 && token.endsWith(clitico)
      )
  );

const verboPoner = (tokens: string[], idioma: IdiomaFuente): boolean =>
  tokens.some((token) => {
    const candidatos: (VerboVocabulario | null)[] = [
      buscarVerbo([token], idioma),
      buscarVerboImperativo([token], idioma),
      idioma === "en" ? buscarVerboPasadoEn([token]) : null,
      idioma === "es" ? (preteritoSintetico(token)?.verbo ?? null) : null,
      idioma === "es" ? (futuroSintetico(token)?.verbo ?? null) : null,
    ];
    return candidatos.some((verbo) => verbo?.lema === "nhirrpan");
  });

const extraerDestino = (
  tokens: string[],
  idioma: IdiomaFuente
): { destino: DestinoIR; resto: string[] } | null => {
  if (VERBOS[idioma].get(tokens.join(" "))) return null;
  const PREPS_DESTINO =
    idioma === "es"
      ? new Set(["a", "hacia", "hasta"])
      : new Set(["to", "into", "onto"]);
  const PREPS_LUGAR =
    idioma === "es" ? new Set(["en", "sobre"]) : new Set(["in", "on", "at"]);
  const analizarNP = (np: string[]): DestinoIR | null => {
    const clave = np.join(" ");
    const personaPron =
      idioma === "es"
        ? (PRONOMBRES_DOBLES.es[clave] ??
          PRONOMBRES_OBLICUOS_ES[clave] ??
          PRONOMBRES.es[clave])
        : PRONOMBRE_COMITATIVO_EN[clave];
    if (personaPron) return { persona: personaPron };
    let restoNP = [...np];
    if (
      restoNP.length > 1 &&
      (ARTICULOS[idioma].has(restoNP[0]) ||
        INDEFINIDOS[idioma].has(restoNP[0]))
    ) {
      restoNP = restoNP.slice(1);
    }
    const demDestino = separarDemostrativoNP(restoNP, idioma);
    restoNP = demDestino.resto;
    const camposDemDestino = demDestino.demostrativo
      ? { demostrativo: demDestino.demostrativo }
      : {};
    const poseedorDestino = separarPoseedorNP(restoNP, idioma);
    restoNP = poseedorDestino.resto;
    const compuesta = (PALABRAS[idioma].get(restoNP.join(" ")) ?? []).find(
      (palabra) => palabra.tipo === "sustantivo"
    );
    if (compuesta) {
      return {
        sustantivo: compuesta.clave,
        ...camposPoseedor(poseedorDestino),
        ...camposDemDestino,
      };
    }
    const adjDest = separarAdjetivoNP(restoNP, idioma);
    restoNP = adjDest.resto;
    if (restoNP.length !== 1) return null;
    const sustantivo = palabraDeTipo(restoNP[0], idioma, "sustantivo");
    if (sustantivo) {
      return {
        sustantivo: sustantivo.clave,
        ...(adjDest.adjetivo ? { adjetivo: adjDest.adjetivo } : {}),
        ...camposPoseedor(poseedorDestino),
        ...camposDemDestino,
      };
    }
    if (tienePoseedor(poseedorDestino)) return null;
    if (
      !NO_SON_NOMBRES.has(restoNP[0]) &&
      !PALABRAS[idioma].get(restoNP[0]) &&
      !VERBOS[idioma].get(restoNP[0]) &&
      !(idioma === "en" ? ESTADOS_EN[restoNP[0]] : ESTADOS_ES[restoNP[0]])
    ) {
      return {
        nombre: restoNP[0].charAt(0).toUpperCase() + restoNP[0].slice(1),
      };
    }
    return null;
  };
  for (let indice = tokens.length - 2; indice >= 0; indice--) {
    const esDestino = PREPS_DESTINO.has(tokens[indice]);
    const esLugar = PREPS_LUGAR.has(tokens[indice]);
    if (
      (esDestino || esLugar) &&
      esFraseAdverbio(tokens.slice(indice), idioma)
    ) {
      continue;
    }
    const esJuntoA =
      idioma === "es" &&
      tokens[indice] === "a" &&
      indice > 0 &&
      tokens[indice - 1] === "junto";
    const esByPoner = idioma === "en" && tokens[indice] === "by";
    if (esJuntoA || esByPoner) {
      const restoPoner = tokens.slice(0, indice - (esJuntoA ? 1 : 0));
      if (restoPoner.length > 0 && verboPoner(restoPoner, idioma)) {
        const npPoner = analizarNP(tokens.slice(indice + 1));
        if (npPoner && npPoner.persona === undefined) {
          return { destino: npPoner, resto: restoPoner };
        }
      }
      continue;
    }
    if (!esDestino && !esLugar) continue;
    const resto = tokens.slice(0, indice);
    if (resto.length === 0) {
      if (!esDestino) return null;
    } else if (!verboDeMovimiento(resto, idioma)) {
      return null;
    }
    if (
      idioma === "en" &&
      (tokens[indice] === "into" || tokens[indice] === "onto") &&
      resto.length > 0
    ) {
      const colas = [
        [...resto.slice(-2), tokens[indice]],
        [...resto.slice(-1), tokens[indice]],
      ];
      if (colas.some((cola) => VERBOS.en.get(cola.join(" ")))) {
        const destinoConVerbo = analizarNP(tokens.slice(indice + 1));
        if (destinoConVerbo) {
          return {
            destino: destinoConVerbo,
            resto: [...resto, tokens[indice]],
          };
        }
      }
    }
    const CORTE_DESTINO = idioma === "es" ? "con" : "with";
    let finDestino = tokens.length;
    for (let corte = indice + 1; corte < tokens.length; corte++) {
      if (tokens[corte] === CORTE_DESTINO) {
        finDestino = corte;
        break;
      }
    }
    const destinoNP = analizarNP(tokens.slice(indice + 1, finDestino));
    if (!destinoNP) return null;
    if (idioma === "es" && tokens[indice] === "a") {
      const personal =
        destinoNP.persona !== undefined ||
        destinoNP.nombre !== undefined ||
        (destinoNP.sustantivo !== undefined &&
          VOCAB.palabras.find(
            (palabra) =>
              palabra.clave === destinoNP.sustantivo &&
              palabra.tipo === "sustantivo"
          )?.persona === true);
      if (personal && resto.length > 0 && !tieneObjetoEs(resto)) {
        const movimientoPuro = resto.some((token) => {
          const candidatos: (VerboVocabulario | null)[] = [
            buscarVerbo([token], "es"),
            buscarVerboGerundio([token], "es"),
            buscarVerboImperativo([token], "es"),
            preteritoSintetico(token)?.verbo ?? null,
            futuroSintetico(token)?.verbo ?? null,
          ];
          return candidatos.some((verbo) => verbo?.movimiento === true);
        });
        if (!movimientoPuro) return null;
      }
    }
    return {
      destino: destinoNP,
      resto: [...resto, ...tokens.slice(finDestino)],
    };
  }
  for (const { tokens: formaAdv, entrada } of ADVERBIOS[idioma]) {
    if (entrada.subtipo !== "lugar") continue;
    const n = formaAdv.length;
    for (let inicio = 0; inicio + n <= tokens.length; inicio++) {
      if (tokens.slice(inicio, inicio + n).join(" ") !== formaAdv.join(" ")) {
        continue;
      }
      if (hayAdverbioMasLargo(tokens, inicio, n, idioma)) continue;
      const previo = inicio > 0 ? tokens[inicio - 1] : null;
      if (previo === "from" || previo === "de" || previo === "desde") {
        continue;
      }
      const resto = tokens.slice(0, inicio);
      if (resto.length === 0 || !verboDeMovimiento(resto, idioma)) continue;
      if (resto.includes(idioma === "es" ? "de" : "from")) continue;
      let np = tokens.slice(inicio + n);
      if (np[0] === "de" || np[0] === "of") np = np.slice(1);
      if (np.length === 0) {
        return { destino: { adverbio: entrada.clave }, resto };
      }
      const destinoNP = analizarNP(np);
      if (destinoNP && destinoNP.sustantivo !== undefined) {
        return {
          destino: { adverbio: entrada.clave, ...destinoNP },
          resto,
        };
      }
    }
  }
  return null;
};

const COLAS_PREGUNTA = new Set([
  "it",
  "to",
  "on",
  "onto",
  "into",
  "in",
  "them",
  "lo",
  "la",
  "le",
  "los",
  "las",
  "les",
  "se",
]);

const analizarNucleoPregunta = (
  tokensIniciales: string[],
  idioma: IdiomaFuente
): {
  sujeto: SujetoIR | null;
  clave: string;
  tiempo: TiempoIR;
  personaAlternativa?: PersonaIR;
  objeto?: ObjetoIR;
  rali?: boolean;
} | null => {
  let tokens = tokensIniciales.filter((token) => token.length > 0);
  if (tokens.length === 0) return null;
  const rali = tokens.some((token) => VERBOS_RALI[idioma].has(token));
  const sujetoDeTokens = (
    candidatos: string[]
  ): { sujeto: SujetoIR; consumidos: number } | null => {
    const doble = candidatos.slice(0, 2).join(" ");
    if (PRONOMBRES_DOBLES[idioma][doble] !== undefined) {
      return {
        sujeto: { persona: PRONOMBRES_DOBLES[idioma][doble] },
        consumidos: 2,
      };
    }
    const simple = PRONOMBRES[idioma][candidatos[0]];
    if (simple !== undefined) {
      return { sujeto: { persona: simple }, consumidos: 1 };
    }
    const sustantivo = palabraDeTipo(candidatos[0], idioma, "sustantivo");
    if (sustantivo) {
      return { sujeto: { sustantivo: sustantivo.clave }, consumidos: 1 };
    }
    if (
      !PALABRAS[idioma].get(candidatos[0]) &&
      !VERBOS[idioma].get(candidatos[0])
    ) {
      return {
        sujeto: {
          nombre:
            candidatos[0].charAt(0).toUpperCase() + candidatos[0].slice(1),
        },
        consumidos: 1,
      };
    }
    return null;
  };

  if (idioma === "en") {
    let tiempo: TiempoIR | null = null;
    let gerundio = false;
    const aux = tokens[0];
    if (aux === "is" || aux === "are" || aux === "am") {
      tiempo = "continuo";
      gerundio = true;
    } else if (aux === "was" || aux === "were") {
      tiempo = "pasado_ayer";
      gerundio = true;
    } else if (aux === "will") tiempo = "futuro_hoy";
    else if (aux === "did") tiempo = "pasado_hoy";
    else if (aux === "do" || aux === "does") tiempo = "continuo";
    if (tiempo) tokens = tokens.slice(1);
    const sujetoEncontrado = sujetoDeTokens(tokens);
    if (!sujetoEncontrado) return null;
    tokens = tokens.slice(sujetoEncontrado.consumidos);
    if (tokens.length === 0) return null;
    let verbo: VerboVocabulario | null = null;
    let restoObjeto: string[] = [];
    for (let fin = tokens.length; fin >= 1 && !verbo; fin--) {
      const intento = tokens.slice(0, fin);
      if (gerundio) verbo = buscarVerboGerundio(intento, "en");
      if (!verbo) verbo = buscarVerbo(intento, "en");
      if (!verbo) {
        verbo = buscarVerboPasadoEn(intento);
        if (verbo && !tiempo) tiempo = "pasado_hoy";
      }
      if (verbo) restoObjeto = tokens.slice(fin);
    }
    if (!verbo) {
      let recorte = [...tokens];
      while (
        !verbo &&
        recorte.length > 1 &&
        COLAS_PREGUNTA.has(recorte[recorte.length - 1])
      ) {
        recorte = recorte.slice(0, -1);
        if (gerundio) verbo = buscarVerboGerundio(recorte, "en");
        if (!verbo) verbo = buscarVerbo(recorte, "en");
        if (!verbo) {
          verbo = buscarVerboPasadoEn(recorte);
          if (verbo && !tiempo) tiempo = "pasado_hoy";
        }
      }
    }
    if (!verbo) return null;
    const objetoNucleo =
      restoObjeto.length > 0 ? analizarObjeto(restoObjeto, "en") : null;
    return {
      sujeto: sujetoEncontrado.sujeto,
      clave: verbo.clave,
      tiempo: tiempo ?? "continuo",
      ...(objetoNucleo && Object.keys(objetoNucleo).length > 0
        ? { objeto: objetoNucleo }
        : {}),
      ...(rali ? { rali: true } : {}),
    };
  }

  let sujetoEs: SujetoIR | null = null;
  const inicial = sujetoDeTokens(tokens);
  if (inicial && PRONOMBRES.es[tokens[0]] !== undefined) {
    sujetoEs = inicial.sujeto;
    tokens = tokens.slice(inicial.consumidos);
  } else if (
    tokens.length > 1 &&
    PRONOMBRES.es[tokens[tokens.length - 1]] !== undefined
  ) {
    sujetoEs = { persona: PRONOMBRES.es[tokens[tokens.length - 1]] };
    tokens = tokens.slice(0, -1);
  } else if (
    tokens.length > 2 &&
    PRONOMBRES_DOBLES.es[tokens.slice(-2).join(" ")] !== undefined
  ) {
    sujetoEs = { persona: PRONOMBRES_DOBLES.es[tokens.slice(-2).join(" ")] };
    tokens = tokens.slice(0, -2);
  }
  let objetoClitico: ObjetoIR | null = null;
  while (tokens.length > 1 && COLAS_PREGUNTA.has(tokens[0])) {
    if (tokens[0] !== "se" && !objetoClitico) {
      objetoClitico = objetoDeCliticoEs(tokens[0]);
    }
    tokens = tokens.slice(1);
  }
  if (tokens.length === 0) return null;
  const objetoEs =
    tokens.length > 1
      ? analizarObjeto(tokens.slice(1), "es")
      : objetoClitico?.persona
        ? { persona: objetoClitico.persona }
        : null;
  const conObjetoEs =
    objetoEs && Object.keys(objetoEs).length > 0
      ? { objeto: objetoEs }
      : {};
  const preterito = preteritoSintetico(tokens[0]);
  if (preterito) {
    return {
      sujeto: sujetoEs ?? { persona: preterito.persona },
      clave: preterito.verbo.clave,
      tiempo: "pasado_hoy",
      ...conObjetoEs,
      ...(rali ? { rali: true } : {}),
    };
  }
  const futuro = futuroSintetico(tokens[0]);
  if (futuro) {
    return {
      sujeto: sujetoEs ?? { persona: futuro.persona },
      clave: futuro.verbo.clave,
      tiempo: "futuro_hoy",
      ...conObjetoEs,
      ...(rali ? { rali: true } : {}),
    };
  }
  const personaProgresiva = PERSONA_SER_ES[tokens[0]];
  if (personaProgresiva && tokens.length > 1) {
    const gerundioEs = buscarVerboGerundio(tokens.slice(1), "es");
    if (gerundioEs) {
      return {
        sujeto: sujetoEs ?? { persona: personaProgresiva },
        clave: gerundioEs.clave,
        tiempo: "continuo",
      };
    }
  }
  const progresivoPasado = ESTAR_PROGRESIVO_PASADO_ES[tokens[0]];
  if (progresivoPasado && tokens.length > 1) {
    const gerundioEs = buscarVerboGerundio(tokens.slice(1), "es");
    if (gerundioEs) {
      return {
        sujeto: sujetoEs ?? { persona: progresivoPasado.persona },
        clave: gerundioEs.clave,
        tiempo: "pasado_ayer",
      };
    }
  }
  const progresivoFuturo = ESTAR_PROGRESIVO_FUTURO_ES[tokens[0]];
  if (progresivoFuturo && tokens.length > 1) {
    const gerundioEs = buscarVerboGerundio(tokens.slice(1), "es");
    if (gerundioEs) {
      return {
        sujeto: sujetoEs ?? { persona: progresivoFuturo },
        clave: gerundioEs.clave,
        tiempo: "futuro_hoy",
      };
    }
  }
  const presente = buscarVerbo(tokens, "es") ?? buscarVerbo([tokens[0]], "es");
  if (presente) {
    return {
      sujeto: sujetoEs ?? { persona: "2sg" },
      clave: presente.clave,
      tiempo: "continuo",
      ...(sujetoEs ? {} : { personaAlternativa: "3sg" as PersonaIR }),
    };
  }
  return null;
};

const hayVerboEnTokens = (
  tokens: string[],
  idioma: IdiomaFuente
): boolean =>
  tokens.some(
    (token) =>
      SER[idioma].has(token) ||
      (idioma === "es" && PERSONA_SER_ES[token] !== undefined) ||
      (idioma === "es" && ESTAR_PROGRESIVO_PASADO_ES[token] !== undefined) ||
      (idioma === "es" && ESTAR_PROGRESIVO_FUTURO_ES[token] !== undefined) ||
      buscarVerbo([token], idioma) !== null ||
      buscarVerboGerundio([token], idioma) !== null ||
      buscarVerboImperativo([token], idioma) !== null ||
      (idioma === "en"
        ? buscarVerboPasadoEn([token]) !== null
        : preteritoSintetico(token) !== null ||
          futuroSintetico(token) !== null)
  );

const GRADOS: Record<IdiomaFuente, Set<string>> = {
  en: new Set(["too", "enough", "very"]),
  es: new Set([
    "demasiado",
    "demasiada",
    "muy",
    "suficientemente",
    "bastante",
  ]),
};

const analizarComparado = (
  tokensIniciales: string[],
  idioma: IdiomaFuente
): ObjetoIR | null => {
  let tokens = quitarArticulo(tokensIniciales, idioma);
  if (tokens.length === 0) return null;
  const clave = tokens.join(" ");
  const posesivoPron =
    POSESIVOS_PRON[idioma][clave] ?? POSESIVOS_PRON[idioma][tokens[0]];
  if (tokens.length === 1 && posesivoPron !== undefined) {
    return { posesivo: posesivoPron };
  }
  if (
    idioma === "en" &&
    tokens.length === 2 &&
    DEMOSTRATIVOS.en[tokens[0]] !== undefined &&
    tokens[1] === "one"
  ) {
    return { demostrativo: DEMOSTRATIVOS.en[tokens[0]] };
  }
  if (tokens.length === 1 && DEMOSTRATIVOS[idioma][tokens[0]] !== undefined) {
    return { demostrativo: DEMOSTRATIVOS[idioma][tokens[0]] };
  }
  if (tokens.length === 1) {
    const sustantivoComparado = palabraDeTipo(tokens[0], idioma, "sustantivo");
    if (sustantivoComparado) {
      return { sustantivo: sustantivoComparado.clave };
    }
    if (
      !NO_SON_NOMBRES.has(tokens[0]) &&
      !PALABRAS[idioma].get(tokens[0]) &&
      !VERBOS[idioma].get(tokens[0])
    ) {
      return {
        nombre: tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1),
      };
    }
  }
  return null;
};

const esComoComparacion = (
  token: string | undefined,
  idioma: IdiomaFuente
): boolean =>
  token !== undefined &&
  ((idioma === "en" && token === "like") ||
    (idioma === "es" && desacentuar(token) === "como"));

const objetoReflexivoDeNP = (
  tokens: string[],
  idioma: IdiomaFuente
): { persona?: PersonaIR; enfatico: true; reflexivo: true } | null => {
  if (idioma === "en") {
    const SELF_OBJETO_EN: Record<string, PersonaIR> = {
      myself: "1sg",
      yourself: "2sg",
      himself: "3sg",
      herself: "3sg",
      itself: "3sg",
      ourselves: "1pl_incl",
      yourselves: "2pl",
      themselves: "3pl",
    };
    if (tokens.length === 1 && SELF_OBJETO_EN[tokens[0]] !== undefined) {
      return {
        persona: SELF_OBJETO_EN[tokens[0]],
        enfatico: true,
        reflexivo: true,
      };
    }
    const claveReciproco = tokens.join(" ");
    if (claveReciproco === "each other" || claveReciproco === "one another") {
      return { enfatico: true, reflexivo: true };
    }
    return null;
  }
  const MISMO_ES = new Set(["mismo", "misma", "mismos", "mismas"]);
  const SELF_OBJETO_ES: Record<string, PersonaIR | null> = {
    si: null,
    mi: "1sg",
    ti: "2sg",
    nosotros: "1pl_incl",
    nosotras: "1pl_incl",
    ustedes: "2pl",
    vosotros: "2pl",
    ellos: "3pl",
    ellas: "3pl",
  };
  const sinA =
    tokens[0] === "a" && tokens.length === 3 ? tokens.slice(1) : tokens;
  if (
    sinA.length === 2 &&
    MISMO_ES.has(desacentuar(sinA[1])) &&
    SELF_OBJETO_ES[desacentuar(sinA[0])] !== undefined
  ) {
    const personaSelf = SELF_OBJETO_ES[desacentuar(sinA[0])];
    return {
      ...(personaSelf ? { persona: personaSelf } : {}),
      enfatico: true,
      reflexivo: true,
    };
  }
  const claveReciprocoEs = tokens.join(" ");
  if (
    claveReciprocoEs === "el uno al otro" ||
    claveReciprocoEs === "la una a la otra" ||
    claveReciprocoEs === "unos a otros" ||
    claveReciprocoEs === "unas a otras"
  ) {
    return { enfatico: true, reflexivo: true };
  }
  return null;
};

const objetoDeNP = (
  npInicial: string[],
  idioma: IdiomaFuente
): {
  persona?: PersonaIR;
  sustantivo?: string;
  nombre?: string;
  demostrativo?: DemostrativoIR;
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  enfatico?: boolean;
  reflexivo?: boolean;
} | null => {
  const reflexivoNP = objetoReflexivoDeNP(npInicial, idioma);
  if (reflexivoNP) return reflexivoNP;
  const demNP = separarDemostrativoNP(
    quitarArticulo(npInicial, idioma),
    idioma
  );
  let np = quitarArticulo(demNP.resto, idioma);
  if (np.length === 0) return null;
  const claveNP = np.join(" ");
  const pron =
    idioma === "en"
      ? OBJETO_PRON_EN[claveNP]
      : (PRONOMBRES_OBLICUOS_ES[claveNP] ?? PRONOMBRES.es[claveNP]);
  if (pron) return { persona: pron };
  const sustantivoNP = palabraDeTipo(claveNP, idioma, "sustantivo");
  if (sustantivoNP) {
    return {
      sustantivo: sustantivoNP.clave,
      ...(np.length === 1 && esPluralSuperficie(np[0], sustantivoNP, idioma)
        ? { plural: true }
        : {}),
      ...(demNP.demostrativo ? { demostrativo: demNP.demostrativo } : {}),
    };
  }
  const poseedorNP = separarPoseedorNP(np, idioma);
  if (tienePoseedor(poseedorNP) && poseedorNP.resto.length >= 1) {
    const cabezaPoseida = palabraDeTipo(
      poseedorNP.resto.join(" "),
      idioma,
      "sustantivo"
    );
    if (cabezaPoseida) {
      return {
        sustantivo: cabezaPoseida.clave,
        ...camposPoseedor(poseedorNP),
        ...(demNP.demostrativo ? { demostrativo: demNP.demostrativo } : {}),
      };
    }
  }
  if (
    np.length === 1 &&
    !NO_SON_NOMBRES.has(np[0]) &&
    !PALABRAS[idioma].get(np[0]) &&
    !VERBOS[idioma].get(np[0]) &&
    !(idioma === "en"
      ? ESTADOS_EN[np[0]] !== undefined
      : ESTADOS_ES[np[0]] !== undefined)
  ) {
    return { nombre: np[0].charAt(0).toUpperCase() + np[0].slice(1) };
  }
  return null;
};

const PARTICIPIOS_ESTATIVOS_EN: Record<string, string> = {
  sore: "be sick",
  ashamed: "be ashamed",
  frightened: "be frightened",
  afraid: "be frightened",
  scared: "be frightened",
  quiet: "be quiet",
  happy: "be happy",
  tired: "be tired",
  sick: "be sick",
  ill: "be sick",
  ready: "be ready",
  thirsty: "be thirsty",
  sorry: "be sorry",
};

const infinitivoDeNP = (
  np: string[],
  idioma: IdiomaFuente
): PropositoIR | null => {
  if (np.length === 0) return null;
  for (let fin = np.length; fin >= 1; fin--) {
    let verbo: VerboVocabulario | null = null;
    let personaClitico: PersonaIR | undefined;
    if (idioma === "es" && fin === 1) {
      const base = desacentuar(np[0]);
      for (const recorte of sinCliticoFinal(base)) {
        const candidato = buscarVerbo([recorte], "es");
        if (candidato) {
          verbo = candidato;
          const reflexivo = VERBOS.es.get(`${recorte}se`);
          personaClitico =
            reflexivo && reflexivo.clave === candidato.clave
              ? undefined
              : CLITICO_PERSONA_ES[base.slice(recorte.length)];
          break;
        }
      }
    }
    if (!verbo) verbo = buscarVerbo(np.slice(0, fin), idioma);
    if (!verbo && fin === 1 && idioma === "en") {
      verbo = buscarVerboGerundio([np[0]], "en");
    }
    if (!verbo) continue;
    if (idioma === "en" && (verbo.clave === "know" || ESTADOS_EN[np[0]])) {
      return null;
    }
    if (personaClitico) {
      return { verbo: verbo.clave, persona: personaClitico };
    }
    const restoNP = np.slice(fin);
    if (restoNP.length === 0) return { verbo: verbo.clave };
    const objetoNPInicial = quitarArticulo(restoNP, idioma);
    const poseedorInf = separarPoseedorNP(objetoNPInicial, idioma);
    const duenoInf = tienePoseedor(poseedorInf)
      ? camposPoseedor(poseedorInf)
      : null;
    const objetoNP = duenoInf
      ? quitarArticulo(poseedorInf.resto, idioma)
      : objetoNPInicial;
    if (objetoNP.length === 1) {
      if (objetoNP[0] === "it") return { verbo: verbo.clave };
      const pron =
        idioma === "en"
          ? OBJETO_PRON_EN[objetoNP[0]]
          : PRONOMBRES_OBLICUOS_ES[objetoNP[0]];
      if (pron) return { verbo: verbo.clave, persona: pron };
      const cosa = palabraDeTipo(objetoNP[0], idioma, "sustantivo");
      if (cosa) {
        return {
          verbo: verbo.clave,
          sustantivo: cosa.clave,
          ...(duenoInf ?? {}),
        };
      }
      if (
        !NO_SON_NOMBRES.has(objetoNP[0]) &&
        !PALABRAS[idioma].get(objetoNP[0]) &&
        !VERBOS[idioma].get(objetoNP[0])
      ) {
        return {
          verbo: verbo.clave,
          nombre:
            objetoNP[0].charAt(0).toUpperCase() + objetoNP[0].slice(1),
        };
      }
      return null;
    }
    if (objetoNP.length === 2) {
      if (idioma === "en") {
        const adj = palabraDeTipo(objetoNP[0], "en", "adjetivo");
        const cosa = palabraDeTipo(objetoNP[1], "en", "sustantivo");
        if (adj && cosa) {
          return {
            verbo: verbo.clave,
            sustantivo: cosa.clave,
            adjetivo: adj.gup,
          };
        }
      } else {
        const cosa = palabraDeTipo(objetoNP[0], "es", "sustantivo");
        const adj = palabraDeTipo(objetoNP[1], "es", "adjetivo");
        if (cosa && adj) {
          return {
            verbo: verbo.clave,
            sustantivo: cosa.clave,
            adjetivo: adj.gup,
          };
        }
      }
    }
    return null;
  }
  return null;
};

const extraerPropositoVerbal = (
  tokens: string[],
  idioma: IdiomaFuente
): { proposito: PropositoIR; resto: string[] } | null => {
  for (let indice = 0; indice < tokens.length - 1; indice++) {
    let inicioNP = -1;
    if (idioma === "en") {
      if (
        tokens[indice] === "in" &&
        tokens[indice + 1] === "order" &&
        tokens[indice + 2] === "to"
      ) {
        inicioNP = indice + 3;
      } else if (
        tokens[indice] === "for" &&
        tokens[indice + 1] === "the" &&
        tokens[indice + 2] === "purpose" &&
        tokens[indice + 3] === "of"
      ) {
        inicioNP = indice + 4;
      } else if (tokens[indice] === "to") {
        if (tokens[indice - 1] === "about" || tokens[indice - 1] === "used") {
          continue;
        }
        inicioNP = indice + 1;
      } else if (
        tokens[indice] === "for" &&
        buscarVerboGerundio([tokens[indice + 1] ?? ""], "en")
      ) {
        inicioNP = indice + 1;
      }
    } else if (
      tokens[indice] === "a" ||
      tokens[indice] === "para" ||
      tokens[indice] === "de"
    ) {
      if (
        tokens[indice] === "a" &&
        indice > 0 &&
        FUTURO_AUX_ES[tokens[indice - 1]] !== undefined
      ) {
        continue;
      }
      if (tokens[indice] === "de" && indice === 0) continue;
      if (
        tokens[indice] === "de" &&
        verboDeMovimiento(tokens.slice(0, indice), "es")
      ) {
        continue;
      }
      inicioNP = indice + 1;
    }
    if (inicioNP < 0 || inicioNP >= tokens.length) continue;
    const resto = tokens.slice(0, indice);
    const marcoVerbless =
      resto.length >= 1 &&
      resto.some(
        (token) =>
          SER[idioma].has(token) || token === "was" || token === "were"
      );
    if (resto.length > 0 && !hayVerboAccion(resto, idioma) && !marcoVerbless) {
      continue;
    }
    const proposito = infinitivoDeNP(tokens.slice(inicioNP), idioma);
    if (!proposito) continue;
    return { proposito, resto };
  }
  if (idioma === "es" && tokens.length >= 2) {
    const restoFinal = tokens.slice(0, -1);
    if (
      !["a", "para", "de", "que"].includes(restoFinal[restoFinal.length - 1]) &&
      !CAUSATIVOS_PASADO_ES.has(
        desacentuar(restoFinal[restoFinal.length - 1])
      ) &&
      hayVerboAccion(restoFinal, "es")
    ) {
      const proposito = infinitivoDeNP([tokens[tokens.length - 1]], "es");
      if (proposito) return { proposito, resto: restoFinal };
    }
  }
  return null;
};

const extraerProposito = (
  tokens: string[],
  idioma: IdiomaFuente
): { proposito: PropositoIR; resto: string[] } | null => {
  if (VERBOS[idioma].get(tokens.join(" "))) return null;
  const PREPS_PROPOSITO =
    idioma === "es" ? new Set(["por", "para"]) : new Set(["for"]);
  for (let indice = 1; indice < tokens.length - 1; indice++) {
    if (!PREPS_PROPOSITO.has(tokens[indice])) continue;
    if (idioma === "en") {
      const previo = tokens[indice - 1];
      const bases = new Set([
        previo,
        ...candidatosPasadoEn(previo),
        ...candidatosGerundio(previo, "en"),
      ]);
      if ([...bases].some((base) => VERBOS.en.get(`${base} for`))) {
        continue;
      }
    }
    const resto = tokens.slice(0, indice);
    if (!hayVerboEnTokens(resto, idioma)) return null;
    if (
      palabraDeTipo(tokens[indice - 1], idioma, "sustantivo") &&
      (!hayVerboAccion(resto, idioma) ||
        (DEMOSTRATIVOS[idioma][tokens[0]] !== undefined &&
          SER[idioma].has(tokens[1])))
    ) {
      continue;
    }
    let np = tokens.slice(indice + 1);
    const clavePron = np.join(" ");
    const personaPron =
      idioma === "es"
        ? (PRONOMBRES_DOBLES.es[clavePron] ??
          PRONOMBRES_OBLICUOS_ES[clavePron] ??
          PRONOMBRES.es[clavePron])
        : PRONOMBRE_COMITATIVO_EN[clavePron];
    if (personaPron) {
      return { proposito: { persona: personaPron }, resto };
    }
    const compuesta = (PALABRAS[idioma].get(np.join(" ")) ?? []).find(
      (palabra) => palabra.tipo === "sustantivo"
    );
    if (compuesta) {
      return { proposito: { sustantivo: compuesta.clave }, resto };
    }
    const demPro = separarDemostrativoNP(np, idioma);
    np = demPro.resto;
    const poseedorPro = separarPoseedorNP(np, idioma);
    const duenoPro = tienePoseedor(poseedorPro)
      ? camposPoseedor(poseedorPro)
      : null;
    if (duenoPro) np = poseedorPro.resto;
    if (
      np.length > 1 &&
      (ARTICULOS[idioma].has(np[0]) ||
        INDEFINIDOS[idioma].has(np[0]) ||
        POSESIVOS_DET[idioma][np[0]] !== undefined)
    ) {
      np = np.slice(1);
    }
    const compuestaSinDet = (PALABRAS[idioma].get(np.join(" ")) ?? []).find(
      (palabra) => palabra.tipo === "sustantivo"
    );
    if (compuestaSinDet) {
      return {
        proposito: {
          sustantivo: compuestaSinDet.clave,
          ...(demPro.demostrativo
            ? { demostrativo: demPro.demostrativo }
            : {}),
          ...(duenoPro ?? {}),
        },
        resto,
      };
    }
    const adjPro = separarAdjetivoNP(np, idioma);
    np = adjPro.resto;
    if (np.length !== 1) return null;
    const sustantivo = palabraDeTipo(np[0], idioma, "sustantivo");
    if (sustantivo) {
      return {
        proposito: {
          sustantivo: sustantivo.clave,
          ...(adjPro.adjetivo ? { adjetivo: adjPro.adjetivo } : {}),
          ...(demPro.demostrativo
            ? { demostrativo: demPro.demostrativo }
            : {}),
          ...(duenoPro ?? {}),
        },
        resto,
      };
    }
    if (
      !NO_SON_NOMBRES.has(np[0]) &&
      !PALABRAS[idioma].get(np[0]) &&
      !VERBOS[idioma].get(np[0]) &&
      !(idioma === "en" ? ESTADOS_EN[np[0]] : ESTADOS_ES[np[0]])
    ) {
      return {
        proposito: {
          nombre: np[0].charAt(0).toUpperCase() + np[0].slice(1),
        },
        resto,
      };
    }
    return null;
  }
  return null;
};

const adjetivoDeTokens = (
  tokens: string[],
  idioma: IdiomaFuente
): { base: string; consumidos: number } | null => {
  for (let n = Math.min(2, tokens.length); n >= 1; n--) {
    const clave = tokens.slice(0, n).join(" ");
    const adjetivo = (PALABRAS[idioma].get(clave) ?? []).find(
      (palabra) => palabra.tipo === "adjetivo"
    );
    if (adjetivo) {
      return { base: adjetivo.baseSufijos ?? adjetivo.gup, consumidos: n };
    }
    if (n === 1) {
      for (const { tokens: forma, clave: claveCuant } of CUANTIFICADORES[
        idioma
      ]) {
        if (forma.length === 1 && forma[0] === tokens[0]) {
          const cuantificador = VOCAB.cuantificadores.find(
            (candidato) => candidato.clave === claveCuant
          );
          if (cuantificador && !cuantificador.gup.includes(" ")) {
            return { base: cuantificador.gup, consumidos: 1 };
          }
        }
      }
    }
  }
  const resultado = adjetivoResultado(tokens[0], idioma);
  if (resultado) {
    return { base: resultado.gup, consumidos: 1 };
  }
  return null;
};

const separarAdjetivoNP = (
  np: string[],
  idioma: IdiomaFuente
): { resto: string[]; adjetivo: string | null } => {
  if (np.length >= 2) {
    const inicial = adjetivoDeTokens(np, idioma);
    if (inicial && np.length > inicial.consumidos) {
      return { resto: np.slice(inicial.consumidos), adjetivo: inicial.base };
    }
    if (idioma === "es") {
      const final = adjetivoDeTokens([np[np.length - 1]], idioma);
      if (final) {
        return { resto: np.slice(0, -1), adjetivo: final.base };
      }
    }
  }
  return { resto: np, adjetivo: null };
};

const hayVerboAccion = (
  tokens: string[],
  idioma: IdiomaFuente
): boolean =>
  VERBOS[idioma].get(tokens.join(" ")) !== undefined ||
  VERBOS[idioma].get(tokens.slice(1).join(" ")) !== undefined ||
  tokens.some(
    (token) =>
      buscarVerbo([token], idioma) !== null ||
      buscarVerboGerundio([token], idioma) !== null ||
      buscarVerboImperativo([token], idioma) !== null ||
      (idioma === "en"
        ? buscarVerboPasadoEn([token]) !== null ||
          PARTICIPIOS_ESTATIVOS_EN[token] !== undefined ||
          verboParticipioEn([token]) !== null
        : preteritoSintetico(token) !== null ||
          futuroSintetico(token) !== null ||
          SENTIMIENTO_ES[desacentuar(token)] !== undefined)
  );

const extraerInstrumento = (
  tokens: string[],
  idioma: IdiomaFuente
):
  | { instrumento: InstrumentoIR; resto: string[] }
  | { comitativo: ComitativoIR; resto: string[] }
  | null => {
  if (VERBOS[idioma].get(tokens.join(" "))) return null;
  const idiomas = VOCAB.idiomasInstrumento[idioma];
  for (const [forma, clave] of Object.entries(idiomas)) {
    const formaTokens = limpiar(forma);
    const n = formaTokens.length;
    for (let inicio = 0; inicio + n <= tokens.length; inicio++) {
      if (
        tokens.slice(inicio, inicio + n).join(" ") !== formaTokens.join(" ")
      ) {
        continue;
      }
      const resto = [
        ...tokens.slice(0, inicio),
        ...tokens.slice(inicio + n),
      ];
      if (!hayVerboAccion(resto, idioma)) continue;
      return { instrumento: { sustantivo: clave }, resto };
    }
  }
  const PREPS_INSTRUMENTO =
    idioma === "es" ? new Set(["con"]) : new Set(["with", "by"]);
  for (let indice = 1; indice < tokens.length - 1; indice++) {
    const esBy = idioma === "en" && tokens[indice] === "by";
    const esEnVehiculo =
      (idioma === "es" && tokens[indice] === "en") ||
      (idioma === "en" && tokens[indice] === "in");
    if (!PREPS_INSTRUMENTO.has(tokens[indice]) && !esEnVehiculo) continue;
    const resto = tokens.slice(0, indice);
    if (!hayVerboAccion(resto, idioma)) continue;
    if (esBy && verboPoner(resto, idioma)) continue;
    let np = tokens.slice(indice + 1);
    if (
      np.length > 1 &&
      (ARTICULOS[idioma].has(np[0]) || INDEFINIDOS[idioma].has(np[0]))
    ) {
      np = np.slice(1);
    }
    if (esBy && np.length >= 1) {
      const verboGerundioInstr = buscarVerboGerundio([np[0]], "en");
      if (verboGerundioInstr) {
        let objetoNP = np.slice(1);
        if (objetoNP[0] === "it") objetoNP = objetoNP.slice(1);
        objetoNP = quitarArticulo(objetoNP, "en");
        if (objetoNP.length === 0) {
          return {
            instrumento: { verbo: verboGerundioInstr.clave },
            resto,
          };
        }
        const objetoInstr = palabraDeTipo(
          objetoNP.join(" "),
          "en",
          "sustantivo"
        );
        if (objetoInstr && !objetoInstr.persona) {
          return {
            instrumento: {
              verbo: verboGerundioInstr.clave,
              sustantivo: objetoInstr.clave,
            },
            resto,
          };
        }
        continue;
      }
    }
    const demInstr = separarDemostrativoNP(np, idioma);
    np = demInstr.resto;
    const poseedorInstr = separarPoseedorNP(np, idioma);
    np = poseedorInstr.resto;
    const adjInstr = separarAdjetivoNP(np, idioma);
    np = adjInstr.resto;
    if (np.length !== 1) continue;
    const sustantivo = palabraDeTipo(np[0], idioma, "sustantivo");
    if (sustantivo && !sustantivo.persona) {
      if (esEnVehiculo) {
        if (sustantivo.vehiculo !== true) continue;
        const soloMovimiento = resto.some((token) => {
          const candidatos: (VerboVocabulario | null)[] = [
            buscarVerbo([token], idioma),
            buscarVerboGerundio([token], idioma),
            buscarVerboImperativo([token], idioma),
            idioma === "en" ? buscarVerboPasadoEn([token]) : null,
            idioma === "es"
              ? (preteritoSintetico(token)?.verbo ?? null)
              : null,
            idioma === "es"
              ? (futuroSintetico(token)?.verbo ?? null)
              : null,
          ];
          return candidatos.some((verbo) => verbo?.movimiento === true);
        });
        if (!soloMovimiento) continue;
      }
      if (
        !esEnVehiculo &&
        idioma === "es" &&
        sustantivo.vehiculo !== true &&
        tokens[indice] !== "con"
      ) {
        continue;
      }
      return {
        instrumento: {
          sustantivo: sustantivo.clave,
          ...(adjInstr.adjetivo ? { adjetivo: adjInstr.adjetivo } : {}),
          ...camposPoseedor(poseedorInstr),
          ...(demInstr.demostrativo
            ? { demostrativo: demInstr.demostrativo }
            : {}),
        },
        resto,
      };
    }
    if (esBy && sustantivo && sustantivo.persona) {
      return {
        comitativo: {
          sustantivo: sustantivo.clave,
          ...(adjInstr.adjetivo ? { adjetivo: adjInstr.adjetivo } : {}),
          ...(demInstr.demostrativo
            ? { demostrativo: demInstr.demostrativo }
            : {}),
        },
        resto,
      };
    }
    if (esBy && !sustantivo) {
      if (
        !NO_SON_NOMBRES.has(np[0]) &&
        !PALABRAS[idioma].get(np[0]) &&
        !VERBOS[idioma].get(np[0]) &&
        !ESTADOS_EN[np[0]]
      ) {
        return {
          comitativo: {
            nombre: np[0].charAt(0).toUpperCase() + np[0].slice(1),
          },
          resto,
        };
      }
    }
  }
  if (idioma === "es") {
    for (let indice = 2; indice < tokens.length; indice++) {
      if (!/(ando|endo)(se)?$/.test(desacentuar(tokens[indice]))) continue;
      const verboGerundioInstr = buscarVerboGerundio([tokens[indice]], "es");
      if (!verboGerundioInstr) continue;
      const previo = desacentuar(tokens[indice - 1]);
      if (
        SER.es.has(previo) ||
        ESTAR_PROGRESIVO_PASADO_ES[previo] !== undefined ||
        ESTAR_PROGRESIVO_FUTURO_ES[previo] !== undefined
      ) {
        continue;
      }
      const resto = tokens.slice(0, indice);
      if (!hayVerboAccion(resto, "es")) continue;
      const objetoNP = quitarArticulo(tokens.slice(indice + 1), "es");
      if (objetoNP.length === 0) {
        return {
          instrumento: { verbo: verboGerundioInstr.clave },
          resto,
        };
      }
      const objetoInstr = palabraDeTipo(objetoNP.join(" "), "es", "sustantivo");
      if (objetoInstr && !objetoInstr.persona) {
        return {
          instrumento: {
            verbo: verboGerundioInstr.clave,
            sustantivo: objetoInstr.clave,
          },
          resto,
        };
      }
    }
  }
  return null;
};

const pertenenciaDeNP = (
  npInicial: string[],
  idioma: IdiomaFuente
): PertenenciaIR | null => {
  let np = [...npInicial];
  if (
    np.length > 1 &&
    (ARTICULOS[idioma].has(np[0]) ||
      INDEFINIDOS[idioma].has(np[0]) ||
      ["some", "unos", "unas"].includes(np[0]))
  ) {
    np = np.slice(1);
  }
  const demPertenencia = separarDemostrativoNP(np, idioma);
  const conDemostrativoPertenencia = (
    pertenencia: PertenenciaIR | null
  ): PertenenciaIR | null =>
    pertenencia && demPertenencia.demostrativo
      ? { ...pertenencia, demostrativo: demPertenencia.demostrativo }
      : pertenencia;
  if (demPertenencia.demostrativo) {
    np = demPertenencia.resto;
    return conDemostrativoPertenencia(pertenenciaDeNP(np, idioma));
  }
  if (np.length === 0) return null;
  const clave = np.join(" ");
  const personaPron =
    idioma === "es"
      ? (PRONOMBRES_DOBLES.es[clave] ??
        PRONOMBRES_OBLICUOS_ES[clave] ??
        PRONOMBRES.es[clave])
      : PRONOMBRE_COMITATIVO_EN[clave];
  if (personaPron) {
    return {
      persona: personaPron,
      dualAlternativo: personaPron === "3pl" || undefined,
    };
  }
  if (np.length >= 2) {
    const cuantificador = VOCAB.cuantificadores.find((candidato) =>
      (idioma === "es" ? candidato.es : candidato.en).includes(np[0])
    );
    if (cuantificador) {
      const nucleo = palabraDeTipo(np[np.length - 1], idioma, "sustantivo");
      if (nucleo && np.length === 2) {
        return { sustantivo: nucleo.clave, cuantificador: cuantificador.clave };
      }
    }
    if (np.length === 2) {
      const primeraAdj = palabraDeTipo(np[0], idioma, "adjetivo");
      const segundaSust = palabraDeTipo(np[1], idioma, "sustantivo");
      if (idioma === "en" && primeraAdj && segundaSust) {
        return { sustantivo: segundaSust.clave, adjetivo: primeraAdj.gup };
      }
      const primeraSust = palabraDeTipo(np[0], idioma, "sustantivo");
      const segundaAdj = palabraDeTipo(np[1], idioma, "adjetivo");
      if (idioma === "es" && primeraSust && segundaAdj) {
        return { sustantivo: primeraSust.clave, adjetivo: segundaAdj.gup };
      }
    }
    return null;
  }
  const sustantivo = palabraDeTipo(np[0], idioma, "sustantivo");
  if (sustantivo) return { sustantivo: sustantivo.clave };
  if (
    !NO_SON_NOMBRES.has(np[0]) &&
    !PALABRAS[idioma].get(np[0]) &&
    !VERBOS[idioma].get(np[0]) &&
    !buscarVerboGerundio([np[0]], idioma) &&
    !(idioma === "en" ? ESTADOS_EN[np[0]] : ESTADOS_ES[np[0]])
  ) {
    return { nombre: np[0].charAt(0).toUpperCase() + np[0].slice(1) };
  }
  return null;
};

const AQUI_EN: Record<string, DemostrativoIR> = {
  here: "este",
  there: "ese",
};
const AQUI_ES: Record<string, DemostrativoIR> = {
  aqui: "este",
  aca: "este",
  alli: "ese",
  alla: "ese",
  ahi: "ese",
};

const extraerAqui = (
  tokens: string[],
  idioma: IdiomaFuente
): {
  tipo: "lugar" | "destino" | "origen";
  demostrativo: DemostrativoIR;
  resto: string[];
} | null => {
  for (let indice = 0; indice < tokens.length; indice++) {
    const token =
      idioma === "es" ? desacentuar(tokens[indice]) : tokens[indice];
    const demostrativo = idioma === "en" ? AQUI_EN[token] : AQUI_ES[token];
    if (!demostrativo) continue;
    if (idioma === "en" && token === "there" && indice === 0) continue;
    if (SER[idioma].has(tokens[indice + 1] ?? "")) continue;
    const previo =
      idioma === "es"
        ? desacentuar(tokens[indice - 1] ?? "")
        : (tokens[indice - 1] ?? "");
    if (
      (idioma === "en" && (previo === "belongs" || previo === "belong")) ||
      (idioma === "es" && previo === "pertenece")
    ) {
      continue;
    }
    const esOrigen =
      idioma === "en"
        ? previo === "from"
        : previo === "de" || previo === "desde";
    const resto = esOrigen
      ? [...tokens.slice(0, indice - 1), ...tokens.slice(indice + 1)]
      : [...tokens.slice(0, indice), ...tokens.slice(indice + 1)];
    if (resto.length === 0) continue;
    const tipo = esOrigen
      ? "origen"
      : verboDeMovimiento(resto, idioma)
        ? "destino"
        : "lugar";
    return { tipo, demostrativo, resto };
  }
  return null;
};

const extraerPerlativo = (
  tokens: string[],
  idioma: IdiomaFuente
): { perlativo: PerlativoIR; resto: string[] } | null => {
  if (VERBOS[idioma].get(tokens.join(" "))) return null;
  const PREPS_PERLATIVO_EN = new Set([
    "through",
    "along",
    "across",
    "over",
    "past",
  ]);
  for (let indice = 1; indice < tokens.length - 1; indice++) {
    const token = tokens[indice];
    const esDurante =
      (idioma === "en" && (token === "during" || token === "while")) ||
      (idioma === "es" && (token === "durante" || token === "mientras"));
    let finPrepEs = -1;
    if (idioma === "es" && token === "a") {
      const segundo = desacentuar(tokens[indice + 1] ?? "");
      if (segundo === "traves" && indice + 2 < tokens.length) {
        finPrepEs = indice + 2;
      } else if (
        segundo === "lo" &&
        desacentuar(tokens[indice + 2] ?? "") === "largo" &&
        indice + 3 < tokens.length
      ) {
        finPrepEs = indice + 3;
      }
      if (
        finPrepEs >= 0 &&
        tokens[finPrepEs] !== "de" &&
        tokens[finPrepEs] !== "del"
      ) {
        finPrepEs = -1;
      }
    }
    const esTravesia =
      (idioma === "en" && PREPS_PERLATIVO_EN.has(token)) ||
      (idioma === "es" && finPrepEs >= 0);
    if (!esDurante && !esTravesia) continue;
    const resto = tokens.slice(0, indice);
    if (!hayVerboAccion(resto, idioma)) continue;
    const inicioNP = idioma === "es" && esTravesia ? finPrepEs + 1 : indice + 1;
    let np = quitarArticulo(tokens.slice(inicioNP), idioma);
    if (np.length === 0) continue;
    const demPerlativo = separarDemostrativoNP(np, idioma);
    const demostrativoPerlativo = demPerlativo.demostrativo;
    np = demPerlativo.resto;
    if (np.length === 0) continue;
    if (esDurante) {
      if (np.length !== 1) continue;
      const gerundioDurante = buscarVerboGerundio([np[0]], idioma);
      if (gerundioDurante) {
        return { perlativo: { verbo: gerundioDurante.clave }, resto };
      }
      const verboDurante = buscarVerbo([np[0]], idioma);
      if (verboDurante) {
        return { perlativo: { verbo: verboDurante.clave }, resto };
      }
      const cosaDurante = palabraDeTipo(np[0], idioma, "sustantivo");
      if (cosaDurante && !cosaDurante.persona) {
        return { perlativo: { sustantivo: cosaDurante.clave }, resto };
      }
      continue;
    }
    const adjPerlativo =
      np.length === 2
        ? idioma === "en"
          ? palabraDeTipo(np[0], "en", "adjetivo")
          : palabraDeTipo(np[1], "es", "adjetivo")
        : null;
    const nucleoTokens = adjPerlativo
      ? idioma === "en"
        ? np.slice(1)
        : np.slice(0, 1)
      : np;
    if (nucleoTokens.length !== 1) continue;
    const cosa = palabraDeTipo(nucleoTokens[0], idioma, "sustantivo");
    if (cosa && !cosa.persona) {
      return {
        perlativo: {
          sustantivo: cosa.clave,
          ...(demostrativoPerlativo
            ? { demostrativo: demostrativoPerlativo }
            : {}),
          ...(adjPerlativo
            ? { adjetivo: adjPerlativo.baseSufijos ?? adjPerlativo.gup }
            : {}),
        },
        resto,
      };
    }
  }
  return null;
};

const pertenenciaVerbalDeNP = (
  npInicial: string[],
  idioma: IdiomaFuente
): PertenenciaIR | null => {
  const np = quitarArticulo(npInicial, idioma);
  if (np.length === 0) return null;
  if (idioma === "en" && np[0] === "being" && np.length >= 2) {
    const participioSer = verboParticipioEn([np[1]]);
    if (participioSer && np.length === 2) {
      return { verbo: participioSer.clave };
    }
  }
  for (let fin = Math.min(np.length, 3); fin >= 1; fin--) {
    const gerundioInicial = buscarVerboGerundio(np.slice(0, fin), idioma);
    if (!gerundioInicial) continue;
    const restoNP = quitarArticulo(np.slice(fin), idioma);
    if (restoNP.length === 0) return { verbo: gerundioInicial.clave };
    const objeto = pertenenciaDeNP(restoNP, idioma);
    if (!objeto) {
      if (fin === 1) return null;
      continue;
    }
    return { ...objeto, verbo: gerundioInicial.clave };
  }
  const gerundioFinal =
    np.length >= 2 ? buscarVerboGerundio([np[np.length - 1]], idioma) : null;
  if (gerundioFinal) {
    const cabeza = pertenenciaDeNP(np.slice(0, -1), idioma);
    if (!cabeza) return null;
    return { ...cabeza, verbo: gerundioFinal.clave };
  }
  if (idioma === "es") {
    const infinitivo = infinitivoDeNP(np, "es");
    if (infinitivo?.verbo) {
      return {
        verbo: infinitivo.verbo,
        ...(infinitivo.sustantivo ? { sustantivo: infinitivo.sustantivo } : {}),
        ...(infinitivo.nombre ? { nombre: infinitivo.nombre } : {}),
        ...(infinitivo.persona ? { persona: infinitivo.persona } : {}),
        ...(infinitivo.adjetivo ? { adjetivo: infinitivo.adjetivo } : {}),
      };
    }
  }
  return null;
};

const verboContar = (tokens: string[], idioma: IdiomaFuente): boolean =>
  tokens.some((token) => {
    const candidatos: (VerboVocabulario | null)[] = [
      buscarVerbo([token], idioma),
      buscarVerboGerundio([token], idioma),
      buscarVerboImperativo([token], idioma),
      idioma === "en" ? buscarVerboPasadoEn([token]) : null,
      idioma === "es" ? (preteritoSintetico(token)?.verbo ?? null) : null,
      idioma === "es" ? (futuroSintetico(token)?.verbo ?? null) : null,
    ];
    return candidatos.some(
      (verbo) =>
        verbo?.lema === "ḻakarama" ||
        verbo?.lema === "ŋäma" ||
        verbo?.lema === "märrama"
    );
  });

const claveCausaBuy = (
  tokens: string[],
  idioma: IdiomaFuente
): string | null => {
  for (const token of tokens) {
    const candidatos: (VerboVocabulario | null)[] = [
      buscarVerbo([token], idioma),
      buscarVerboGerundio([token], idioma),
      buscarVerboImperativo([token], idioma),
      idioma === "en" ? buscarVerboPasadoEn([token]) : null,
      idioma === "en" ? buscarVerboPresenteEn([token]) : null,
      idioma === "en" ? verboParticipioEn([token]) : null,
      idioma === "en" && PARTICIPIOS_ESTATIVOS_EN[token]
        ? (VOCAB.verbos.find(
            (candidato) => candidato.clave === PARTICIPIOS_ESTATIVOS_EN[token]
          ) ?? null)
        : null,
      idioma === "es" && SENTIMIENTO_ES[desacentuar(token)]
        ? (VOCAB.verbos.find(
            (candidato) =>
              candidato.clave === SENTIMIENTO_ES[desacentuar(token)]
          ) ?? null)
        : null,
      idioma === "es" ? (preteritoSintetico(token)?.verbo ?? null) : null,
      idioma === "es" ? (futuroSintetico(token)?.verbo ?? null) : null,
    ];
    const encontrado = candidatos.find((verbo) => verbo?.causaBuy === true);
    if (encontrado) return encontrado.clave;
  }
  return null;
};

const verboCausaBuy = (tokens: string[], idioma: IdiomaFuente): boolean =>
  claveCausaBuy(tokens, idioma) !== null;

const extraerPertenencia = (
  tokens: string[],
  idioma: IdiomaFuente
): { pertenencia: PertenenciaIR; resto: string[] } | null => {
  for (let indice = 1; indice < tokens.length - 1; indice++) {
    const esAbout = idioma === "en" && tokens[indice] === "about";
    const esSobre = idioma === "es" && tokens[indice] === "sobre";
    const esAcercaDe =
      idioma === "es" &&
      tokens[indice] === "acerca" &&
      tokens[indice + 1] === "de";
    const esOf = idioma === "en" && tokens[indice] === "of";
    const esDe = idioma === "es" && tokens[indice] === "de";
    if (!esAbout && !esSobre && !esAcercaDe && !esOf && !esDe) continue;
    const resto = tokens.slice(0, indice);
    const conCausa = verboCausaBuy(resto, idioma);
    if (!verboContar(resto, idioma) && !conCausa) continue;
    const np = tokens.slice(indice + (esAcercaDe ? 2 : 1));
    if (esOf || esDe) {
      const pertenenciaVerbal =
        pertenenciaVerbalDeNP(np, idioma) ??
        (conCausa ? pertenenciaDeNP(np, idioma) : null);
      if (!pertenenciaVerbal) continue;
      return { pertenencia: pertenenciaVerbal, resto };
    }
    const pertenencia =
      pertenenciaVerbalDeNP(np, idioma) ?? pertenenciaDeNP(np, idioma);
    if (!pertenencia) continue;
    return { pertenencia, resto };
  }
  return null;
};

const baseVecesDeToken = (
  token: string,
  idioma: IdiomaFuente
): string | null => {
  const especiales: Record<IdiomaFuente, Record<string, string>> = {
    en: { one: "waŋgany", few: "ḻurrkun'" },
    es: { una: "waŋgany", un: "waŋgany", pocas: "ḻurrkun'" },
  };
  if (especiales[idioma][token]) return especiales[idioma][token];
  const cuantificador = VOCAB.cuantificadores.find((candidato) =>
    (idioma === "es" ? candidato.es : candidato.en).includes(token)
  );
  if (cuantificador && !cuantificador.gup.includes(" ")) {
    return cuantificador.gup;
  }
  const adjetivo = palabraDeTipo(token, idioma, "adjetivo");
  if (
    adjetivo &&
    (adjetivo.clave === "lots of" || adjetivo.clave === "one-single")
  ) {
    return adjetivo.gup;
  }
  return null;
};

const extraerVeces = (
  tokens: string[],
  idioma: IdiomaFuente
): { veces: string; resto: string[] } | null => {
  if (idioma === "en") {
    for (let indice = 1; indice < tokens.length; indice++) {
      if (tokens[indice] === "once") {
        return {
          veces: "waŋgany",
          resto: [...tokens.slice(0, indice), ...tokens.slice(indice + 1)],
        };
      }
      if (tokens[indice] === "twice") {
        return {
          veces: "märrma'",
          resto: [...tokens.slice(0, indice), ...tokens.slice(indice + 1)],
        };
      }
      if (tokens[indice] === "times" && indice > 0) {
        let inicio = indice - 1;
        if (tokens[inicio - 1] === "how") continue;
        const base = baseVecesDeToken(tokens[inicio], "en");
        if (!base) continue;
        if (inicio > 0 && (tokens[inicio - 1] === "a" || tokens[inicio - 1] === "an")) {
          inicio -= 1;
        }
        return {
          veces: base,
          resto: [...tokens.slice(0, inicio), ...tokens.slice(indice + 1)],
        };
      }
    }
    return null;
  }
  for (let indice = 1; indice < tokens.length; indice++) {
    if (tokens[indice] !== "vez" && tokens[indice] !== "veces") continue;
    const base = baseVecesDeToken(tokens[indice - 1], "es");
    if (!base) continue;
    return {
      veces: base,
      resto: [...tokens.slice(0, indice - 1), ...tokens.slice(indice + 1)],
    };
  }
  return null;
};

const verboFuente = (tokens: string[], idioma: IdiomaFuente): boolean =>
  tokens.some((token) => {
    const candidatos: (VerboVocabulario | null)[] = [
      buscarVerbo([token], idioma),
      buscarVerboGerundio([token], idioma),
      buscarVerboImperativo([token], idioma),
      idioma === "en" ? buscarVerboPasadoEn([token]) : null,
      idioma === "es" ? (preteritoSintetico(token)?.verbo ?? null) : null,
      idioma === "es" ? (futuroSintetico(token)?.verbo ?? null) : null,
    ];
    return candidatos.some((verbo) => verbo?.fuente === true);
  });

const extraerOrigen = (
  tokens: string[],
  idioma: IdiomaFuente
): { origen: OrigenIR; resto: string[] } | null => {
  if (VERBOS[idioma].get(tokens.join(" "))) return null;
  const PREPS_ORIGEN =
    idioma === "es" ? new Set(["de", "desde"]) : new Set(["from"]);
  const PREPS_CORTE =
    idioma === "es"
      ? new Set(["a", "hacia", "hasta"])
      : new Set(["to", "into", "onto"]);
  const analizarNP = (npInicial: string[]): OrigenIR | null => {
    let np = [...npInicial];
    if (np.length === 0) return null;
    const ENFASIS_ORIGEN =
      idioma === "en"
        ? new Set(["only"])
        : new Set(["solo", "sólo", "solamente"]);
    if (np.length > 1 && ENFASIS_ORIGEN.has(np[0])) {
      const enfatizado = analizarNP(np.slice(1));
      if (enfatizado?.persona !== undefined) {
        return { ...enfatizado, enfatico: true };
      }
    }
    const clavePron = np.join(" ");
    const personaPron =
      idioma === "es"
        ? (PRONOMBRES_DOBLES.es[clavePron] ??
          PRONOMBRES_OBLICUOS_ES[clavePron] ??
          PRONOMBRES.es[clavePron])
        : PRONOMBRE_COMITATIVO_EN[clavePron];
    if (personaPron) return { persona: personaPron };
    if (
      np.length > 1 &&
      (ARTICULOS[idioma].has(np[0]) || INDEFINIDOS[idioma].has(np[0]))
    ) {
      np = np.slice(1);
    }
    const demOrigen = separarDemostrativoNP(np, idioma);
    np = demOrigen.resto;
    const camposDemOrigen = demOrigen.demostrativo
      ? { demostrativo: demOrigen.demostrativo }
      : {};
    const poseedorOrigen = separarPoseedorNP(np, idioma);
    np = poseedorOrigen.resto;
    const sustantivoDirecto =
      np.length === 1 ? palabraDeTipo(np[0], idioma, "sustantivo") : null;
    if (np.length <= 3 && !sustantivoDirecto) {
      const infinitivoOrigen = infinitivoDeNP(np, idioma);
      if (
        infinitivoOrigen?.verbo &&
        infinitivoOrigen.persona === undefined &&
        infinitivoOrigen.nombre === undefined
      ) {
        return {
          verbo: infinitivoOrigen.verbo,
          ...(infinitivoOrigen.sustantivo
            ? { sustantivo: infinitivoOrigen.sustantivo }
            : {}),
        };
      }
    }
    const adverbioEn = (candidatos: string[], alInicio: boolean) => {
      for (const { tokens: formaAdv, entrada } of ADVERBIOS[idioma]) {
        if (entrada.subtipo !== "lugar") continue;
        const n = formaAdv.length;
        if (candidatos.length < n) continue;
        const segmento = alInicio
          ? candidatos.slice(0, n)
          : candidatos.slice(-n);
        if (segmento.join(" ") === formaAdv.join(" ")) {
          return { entrada, n };
        }
      }
      return null;
    };
    const inicial = adverbioEn(np, true);
    if (inicial) {
      let restoNP = np.slice(inicial.n);
      if (restoNP[0] === "of" || restoNP[0] === "de") {
        restoNP = restoNP.slice(1);
      }
      if (restoNP.length === 0) return { adverbio: inicial.entrada.clave };
      const nucleo = analizarNP(restoNP);
      if (nucleo && !nucleo.adverbio) {
        return {
          adverbio: inicial.entrada.clave,
          ...nucleo,
          ...camposPoseedor(poseedorOrigen),
        };
      }
      return null;
    }
    const final = adverbioEn(np, false);
    if (final && np.length > final.n) {
      const nucleo = analizarNP(np.slice(0, -final.n));
      if (nucleo && !nucleo.adverbio) {
        return {
          adverbio: final.entrada.clave,
          ...nucleo,
          ...camposPoseedor(poseedorOrigen),
        };
      }
      return null;
    }
    const compuesta = (PALABRAS[idioma].get(np.join(" ")) ?? []).find(
      (palabra) => palabra.tipo === "sustantivo"
    );
    if (compuesta) {
      return {
        sustantivo: compuesta.clave,
        ...camposPoseedor(poseedorOrigen),
        ...camposDemOrigen,
      };
    }
    const adjOri = separarAdjetivoNP(np, idioma);
    np = adjOri.resto;
    if (np.length !== 1) return null;
    const sustantivo = palabraDeTipo(np[0], idioma, "sustantivo");
    if (sustantivo) {
      return {
        sustantivo: sustantivo.clave,
        ...(adjOri.adjetivo ? { adjetivo: adjOri.adjetivo } : {}),
        ...camposPoseedor(poseedorOrigen),
        ...camposDemOrigen,
      };
    }
    if (tienePoseedor(poseedorOrigen)) return null;
    if (
      !NO_SON_NOMBRES.has(np[0]) &&
      !PALABRAS[idioma].get(np[0]) &&
      !VERBOS[idioma].get(np[0]) &&
      !(idioma === "en" ? ESTADOS_EN[np[0]] : ESTADOS_ES[np[0]])
    ) {
      return { nombre: np[0].charAt(0).toUpperCase() + np[0].slice(1) };
    }
    return null;
  };
  const finalesAdverbio = new Set(
    ADVERBIOS[idioma]
      .filter(({ entrada }) => entrada.subtipo === "lugar")
      .map(({ tokens: forma }) => forma[forma.length - 1])
  );
  for (let indice = 0; indice < tokens.length - 1; indice++) {
    const esOutOf =
      idioma === "en" &&
      tokens[indice] === "of" &&
      tokens[indice - 1] === "out";
    if (!PREPS_ORIGEN.has(tokens[indice]) && !esOutOf) continue;
    if (
      idioma === "es" &&
      indice > 0 &&
      finalesAdverbio.has(tokens[indice - 1])
    ) {
      continue;
    }
    if (
      idioma === "es" &&
      tokens[indice] === "de" &&
      tokens[indice + 1] !== "parte" &&
      tokens
        .slice(0, indice)
        .some((token) => token === "en" || token === "sobre")
    ) {
      let indiceCabezaDe = indice + 1;
      if (
        ARTICULOS.es.has(tokens[indiceCabezaDe] ?? "") ||
        INDEFINIDOS.es.has(tokens[indiceCabezaDe] ?? "")
      ) {
        indiceCabezaDe += 1;
      }
      const cabezaDe = tokens[indiceCabezaDe];
      if (cabezaDe !== undefined) {
        const palabraDe = palabraDeTipo(cabezaDe, "es", "sustantivo");
        const esPersonaDe = palabraDe
          ? palabraDe.persona === true
          : !NO_SON_NOMBRES.has(cabezaDe) &&
            !PALABRAS.es.get(cabezaDe) &&
            !VERBOS.es.get(cabezaDe);
        if (esPersonaDe) continue;
      }
    }
    if (tokens.slice(0, indice).some((token) => PREPS_CORTE.has(token))) {
      return null;
    }
    let resto = tokens.slice(0, indice);
    let alejamiento = false;
    if (idioma === "en" && resto[resto.length - 1] === "away") {
      alejamiento = true;
      resto = resto.slice(0, -1);
    }
    let inicioNP = indice + 1;
    let marcadoParte = false;
    if (
      idioma === "es" &&
      tokens[inicioNP] === "parte" &&
      tokens[inicioNP + 1] === "de"
    ) {
      inicioNP += 2;
      marcadoParte = true;
    }
    let fin = tokens.length;
    for (let corte = inicioNP; corte < tokens.length; corte++) {
      if (PREPS_CORTE.has(tokens[corte])) {
        fin = corte;
        break;
      }
    }
    const origenNP = analizarNP(tokens.slice(inicioNP, fin));
    if (!origenNP) return null;
    const esPersonaOrigen =
      origenNP.persona !== undefined ||
      origenNP.nombre !== undefined ||
      (origenNP.sustantivo !== undefined &&
        VOCAB.palabras.find(
          (palabra) =>
            palabra.clave === origenNP.sustantivo &&
            palabra.tipo === "sustantivo"
        )?.persona === true);
    if (resto.length > 0 && !verboDeMovimiento(resto, idioma)) {
      const ultimoResto = resto[resto.length - 1];
      const serFinal =
        (idioma === "en" || marcadoParte) &&
        (SER[idioma].has(ultimoResto) ||
          (idioma === "es" && PERSONA_SER_ES[ultimoResto] !== undefined));
      const fuenteCosaEn =
        idioma === "en" && !esPersonaOrigen && verboFuente(resto, idioma);
      if (
        !fuenteCosaEn &&
        (!esPersonaOrigen || (!verboFuente(resto, idioma) && !serFinal))
      ) {
        return null;
      }
    }
    return {
      origen: { ...origenNP, ...(alejamiento ? { alejamiento: true } : {}) },
      resto: [...resto, ...tokens.slice(fin)],
    };
  }
  return null;
};

const extraerLugar = (
  tokens: string[],
  idioma: IdiomaFuente
): { lugar: LugarIR; resto: string[] } | null => {
  const PREPS =
    idioma === "es" ? new Set(["en", "sobre"]) : new Set(["in", "on", "at"]);
  const analizarNP = (np: string[]): LugarIR | null => {
    let restoNP = [...np];
    if (
      restoNP.length > 1 &&
      (ARTICULOS[idioma].has(restoNP[0]) || INDEFINIDOS[idioma].has(restoNP[0]))
    ) {
      restoNP = restoNP.slice(1);
    }
    const demLugar = separarDemostrativoNP(restoNP, idioma);
    restoNP = demLugar.resto;
    const poseedorLugar = separarPoseedorNP(restoNP, idioma);
    restoNP = poseedorLugar.resto;
    const adjLugar = separarAdjetivoNP(restoNP, idioma);
    restoNP = adjLugar.resto;
    if (restoNP.length !== 1) return null;
    const sustantivo = palabraDeTipo(restoNP[0], idioma, "sustantivo");
    if (sustantivo) {
      return sustantivo.persona
        ? null
        : {
            sustantivo: sustantivo.clave,
            ...(adjLugar.adjetivo ? { adjetivo: adjLugar.adjetivo } : {}),
            ...camposPoseedor(poseedorLugar),
            ...(demLugar.demostrativo
              ? { demostrativo: demLugar.demostrativo }
              : {}),
          };
    }
    if (tienePoseedor(poseedorLugar)) return null;
    if (
      !NO_SON_NOMBRES.has(restoNP[0]) &&
      !PALABRAS[idioma].get(restoNP[0]) &&
      !VERBOS[idioma].get(restoNP[0]) &&
      !(idioma === "en" ? ESTADOS_EN[restoNP[0]] : ESTADOS_ES[restoNP[0]])
    ) {
      return {
        nombre: restoNP[0].charAt(0).toUpperCase() + restoNP[0].slice(1),
      };
    }
    return null;
  };
  const separarColaAdverbio = (
    np: string[]
  ): { np: string[]; cola: string[] } => {
    for (const { tokens: formaAdv, entrada } of ADVERBIOS[idioma]) {
      if (entrada.subtipo === "lugar") continue;
      const n = formaAdv.length;
      if (np.length > n && np.slice(-n).join(" ") === formaAdv.join(" ")) {
        return { np: np.slice(0, -n), cola: np.slice(-n) };
      }
    }
    return { np, cola: [] };
  };
  for (let indice = tokens.length - 2; indice >= 0; indice--) {
    if (!PREPS.has(tokens[indice])) continue;
    if (esFraseAdverbio(tokens.slice(indice), idioma)) continue;
    const lugarNP = analizarNP(tokens.slice(indice + 1));
    if (lugarNP) return { lugar: lugarNP, resto: tokens.slice(0, indice) };
    const sinCola = separarColaAdverbio(tokens.slice(indice + 1));
    if (sinCola.cola.length > 0) {
      const lugarNPCola = analizarNP(sinCola.np);
      if (lugarNPCola) {
        return {
          lugar: lugarNPCola,
          resto: [...tokens.slice(0, indice), ...sinCola.cola],
        };
      }
    }
  }
  for (const { tokens: formaAdv, entrada } of ADVERBIOS[idioma]) {
    if (entrada.subtipo !== "lugar") continue;
    const n = formaAdv.length;
    for (let inicio = 0; inicio + n < tokens.length; inicio++) {
      if (tokens.slice(inicio, inicio + n).join(" ") !== formaAdv.join(" ")) {
        continue;
      }
      if (hayAdverbioMasLargo(tokens, inicio, n, idioma)) continue;
      let np = tokens.slice(inicio + n);
      if (np[0] === "de" || np[0] === "of") np = np.slice(1);
      const lugarNP = analizarNP(np);
      if (lugarNP && lugarNP.sustantivo) {
        return {
          lugar: { adverbio: entrada.clave, ...lugarNP },
          resto: tokens.slice(0, inicio),
        };
      }
    }
  }
  return null;
};

const ESTAR_PROGRESIVO_PASADO_ES: Record<
  string,
  { persona: PersonaIR; alternativa?: PersonaIR }
> = {
  estaba: { persona: "1sg", alternativa: "3sg" },
  estabas: { persona: "2sg" },
  estábamos: { persona: "1pl_incl" },
  estabamos: { persona: "1pl_incl" },
  estabais: { persona: "2pl" },
  estaban: { persona: "3pl" },
  estuve: { persona: "1sg" },
  estuviste: { persona: "2sg" },
  estuvo: { persona: "3sg" },
  estuvimos: { persona: "1pl_incl" },
  estuvieron: { persona: "3pl" },
};

const ESTAR_PROGRESIVO_FUTURO_ES: Record<string, PersonaIR> = {
  estaré: "1sg",
  estare: "1sg",
  estarás: "2sg",
  estaras: "2sg",
  estará: "3sg",
  estara: "3sg",
  estaremos: "1pl_incl",
  estaréis: "2pl",
  estareis: "2pl",
  estarán: "3pl",
  estaran: "3pl",
};

const PRONOMBRES_OBLICUOS_ES: Record<string, PersonaIR> = {
  mí: "1sg",
  ti: "2sg",
};

const ESTADOS_EN: Record<string, string> = {
  want: "want",
  wants: "want",
  need: "want",
  needs: "want",
  know: "know",
  knows: "know",
};

const ESTADOS_ES: Record<string, { clave: string; persona: PersonaIR }> = {
  quiero: { clave: "want", persona: "1sg" },
  quieres: { clave: "want", persona: "2sg" },
  quiere: { clave: "want", persona: "3sg" },
  queremos: { clave: "want", persona: "1pl_incl" },
  queréis: { clave: "want", persona: "2pl" },
  quereis: { clave: "want", persona: "2pl" },
  quieren: { clave: "want", persona: "3pl" },
  necesito: { clave: "want", persona: "1sg" },
  necesitas: { clave: "want", persona: "2sg" },
  necesita: { clave: "want", persona: "3sg" },
  necesitamos: { clave: "want", persona: "1pl_incl" },
  necesitáis: { clave: "want", persona: "2pl" },
  necesitais: { clave: "want", persona: "2pl" },
  necesitan: { clave: "want", persona: "3pl" },
  conozco: { clave: "know", persona: "1sg" },
  conoces: { clave: "know", persona: "2sg" },
  conoce: { clave: "know", persona: "3sg" },
  conocemos: { clave: "know", persona: "1pl_incl" },
  conocéis: { clave: "know", persona: "2pl" },
  conoceis: { clave: "know", persona: "2pl" },
  conocen: { clave: "know", persona: "3pl" },
  sé: { clave: "know", persona: "1sg" },
  sabes: { clave: "know", persona: "2sg" },
  sabe: { clave: "know", persona: "3sg" },
  sabemos: { clave: "know", persona: "1pl_incl" },
  sabéis: { clave: "know", persona: "2pl" },
  sabeis: { clave: "know", persona: "2pl" },
  saben: { clave: "know", persona: "3pl" },
};

const CLITICO_PERSONA_ES: Record<string, PersonaIR> = {
  me: "1sg",
  te: "2sg",
  lo: "3sg",
  la: "3sg",
  le: "3sg",
  nos: "1pl_incl",
  os: "2pl",
  los: "3pl",
  las: "3pl",
  les: "3pl",
};

const OBJETO_PRON_EN: Record<string, PersonaIR> = {
  me: "1sg",
  you: "2sg",
  him: "3sg",
  her: "3sg",
  us: "1pl_incl",
  them: "3pl",
};

type ComplementoEstado = {
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
};

const complementoDeClitico = (clitico: string): ComplementoEstado => ({
  posesivo: CLITICO_PERSONA_ES[clitico],
  dualAlternativo: ["los", "las", "les"].includes(clitico) || undefined,
});

const dividirPorConjuncion = (
  tokens: string[],
  idioma: IdiomaFuente
): string[][] => {
  const conjunciones = new Set(VOCAB.conjuncion[idioma]);
  const grupos: string[][] = [];
  let actual: string[] = [];
  for (const token of tokens) {
    if (conjunciones.has(token)) {
      if (actual.length > 0) grupos.push(actual);
      actual = [];
    } else {
      actual.push(token);
    }
  }
  if (actual.length > 0) grupos.push(actual);
  return grupos;
};

const complementoVerbalEn = (
  tokensIniciales: string[]
): ComplementoEstado | null => {
  let tokens = [...tokensIniciales];
  let posesivoDativo: PersonaIR | undefined;
  if (
    tokens.length > 2 &&
    tokens[1] === "to" &&
    OBJETO_PRON_EN[tokens[0]] !== undefined
  ) {
    posesivoDativo = OBJETO_PRON_EN[tokens[0]];
    tokens = tokens.slice(1);
  }
  if (tokens[0] === "how" && tokens[1] === "to") tokens = tokens.slice(1);
  if (tokens[0] !== "to" || tokens.length < 2) return null;
  const cuerpo = tokens.slice(1);
  for (let fin = cuerpo.length; fin >= 1; fin--) {
    const verbo = buscarVerbo(cuerpo.slice(0, fin), "en");
    if (!verbo) continue;
    if (verbo.clave === "know" || ESTADOS_EN[cuerpo[0]]) return null;
    const base: ComplementoEstado = {
      verbo: verbo.clave,
      ...(posesivoDativo ? { posesivo: posesivoDativo } : {}),
    };
    const restoVerbo = cuerpo.slice(fin);
    if (restoVerbo.length === 0) return base;
    if (restoVerbo[0] === "to") {
      const npDestino = quitarArticulo(restoVerbo.slice(1), "en");
      const lugarDestino =
        npDestino.length === 1
          ? palabraDeTipo(npDestino[0], "en", "sustantivo")
          : null;
      if (lugarDestino) {
        return { ...base, destinoLili: lugarDestino.clave };
      }
      return null;
    }
    const cosa = analizarComplementoUnoEn(restoVerbo);
    if (cosa && !cosa.verbo) return { ...cosa, ...base };
    return null;
  }
  return null;
};

const analizarComplementoUnoEn = (
  tokensIniciales: string[]
): ComplementoEstado | null => {
  let tokens = [...tokensIniciales];
  const verbal = complementoVerbalEn(tokens);
  if (verbal) return verbal;
  if (tokens[0] === "all" && tokens[1] === "about") tokens = tokens.slice(2);
  else if (tokens[0] === "about") tokens = tokens.slice(1);
  if (
    tokens.length > 0 &&
    (INDEFINIDOS.en.has(tokens[0]) ||
      ARTICULOS.en.has(tokens[0]) ||
      tokens[0] === "some")
  ) {
    tokens = tokens.slice(1);
  }
  if (tokens.length === 0) return null;
  const claveDoble = tokens.join(" ");
  const dobles: Record<string, PersonaIR> = {
    "them two": "3dual",
    "you two": "2dual",
    "us two": "1dual_excl",
  };
  if (dobles[claveDoble]) return { posesivo: dobles[claveDoble] };
  const demComp = separarDemostrativoNP(tokens, "en");
  tokens = demComp.resto;
  const poseedorComp = separarPoseedorNP(tokens, "en");
  const duenoComp = tienePoseedor(poseedorComp)
    ? camposPoseedor(poseedorComp)
    : null;
  if (duenoComp) tokens = poseedorComp.resto;
  const adjComp = separarAdjetivoNP(tokens, "en");
  tokens = adjComp.resto;
  if (tokens.length !== 1) return null;
  const pronombre = OBJETO_PRON_EN[tokens[0]];
  if (pronombre && !adjComp.adjetivo && !duenoComp) {
    return {
      posesivo: pronombre,
      dualAlternativo: tokens[0] === "them" || undefined,
    };
  }
  const sustantivo = palabraDeTipo(tokens[0], "en", "sustantivo");
  if (sustantivo) {
    return {
      posesivoSustantivo: sustantivo.clave,
      ...(adjComp.adjetivo ? { adjetivo: adjComp.adjetivo } : {}),
      ...(demComp.demostrativo
        ? { demostrativo: demComp.demostrativo }
        : {}),
      ...(duenoComp
        ? {
            duenoPosesivo: duenoComp.posesivo,
            duenoNombre: duenoComp.posesivoNombre,
            duenoSustantivo: duenoComp.posesivoSustantivo,
            duenoDemostrativo: duenoComp.posesivoDemostrativo,
          }
        : {}),
    };
  }
  if (VERBOS.en.get(tokens[0]) || ESTADOS_EN[tokens[0]]) return null;
  if (adjComp.adjetivo) return null;
  return {
    posesivoNombre: tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1),
  };
};

const analizarComplementoEn = (
  tokensIniciales: string[]
): ComplementoEstado[] | null => {
  const grupos = dividirPorConjuncion(tokensIniciales, "en");
  if (grupos.length === 0) return null;
  const lista: ComplementoEstado[] = [];
  for (const grupo of grupos) {
    const uno = analizarComplementoUnoEn(grupo);
    if (!uno) return null;
    lista.push(uno);
  }
  return lista;
};

const complementoVerbalEs = (
  tokensIniciales: string[]
): ComplementoEstado | null => {
  const tokens = [...tokensIniciales];
  if (tokens[0] === "que" && tokens.length > 1) {
    const forma = tokens[1];
    if (preteritoSintetico(forma) || PRONOMBRES.es[forma] !== undefined) {
      return null;
    }
    const verboSubjuntivo = buscarVerboImperativo([forma], "es");
    if (verboSubjuntivo) {
      const persona: PersonaIR =
        forma.endsWith("emos") || forma.endsWith("amos")
          ? "1pl_incl"
          : forma.endsWith("es") || forma.endsWith("as")
            ? "2sg"
            : forma.endsWith("en") || forma.endsWith("an")
              ? "3pl"
              : "3sg";
      return { posesivo: persona, verbo: verboSubjuntivo.clave };
    }
    return null;
  }
  if (!tokens[0] || !tokens[0].endsWith("r")) return null;
  for (let fin = tokens.length; fin >= 1; fin--) {
    const verbo = buscarVerbo(tokens.slice(0, fin), "es");
    if (!verbo) continue;
    const base: ComplementoEstado = { verbo: verbo.clave };
    const restoVerbo = tokens.slice(fin);
    if (restoVerbo.length === 0) return base;
    if (restoVerbo[0] === "a" && restoVerbo.length > 1) {
      const npDestino = quitarArticulo(restoVerbo.slice(1), "es");
      const lugarDestino =
        npDestino.length === 1
          ? palabraDeTipo(npDestino[0], "es", "sustantivo")
          : null;
      if (lugarDestino && lugarDestino.persona !== true) {
        return { ...base, destinoLili: lugarDestino.clave };
      }
    }
    const cosa = analizarComplementoUnoEs(restoVerbo);
    if (cosa && !cosa.verbo) return { ...cosa, ...base };
    return null;
  }
  return null;
};

const analizarComplementoUnoEs = (
  tokensIniciales: string[]
): ComplementoEstado | null => {
  let tokens = [...tokensIniciales];
  const verbal = complementoVerbalEs(tokens);
  if (verbal) return verbal;
  let aPersonal = false;
  if (tokens[0] === "a" && tokens.length > 1) {
    aPersonal = true;
    tokens = tokens.slice(1);
  } else if (tokens[0] === "de" && tokens.length > 1) {
    tokens = tokens.slice(1);
  }
  if (tokens.length > 1 && (tokens[0] === "unos" || tokens[0] === "unas")) {
    tokens = tokens.slice(1);
  }
  if (
    tokens.length > 1 &&
    (ARTICULOS.es.has(tokens[0]) || INDEFINIDOS.es.has(tokens[0]))
  ) {
    tokens = tokens.slice(1);
  }
  const demCompEs = separarDemostrativoNP(tokens, "es");
  tokens = demCompEs.resto;
  const poseedorCompEs = separarPoseedorNP(tokens, "es");
  const duenoCompEs = tienePoseedor(poseedorCompEs)
    ? camposPoseedor(poseedorCompEs)
    : null;
  if (duenoCompEs) tokens = poseedorCompEs.resto;
  const adjCompEs = separarAdjetivoNP(tokens, "es");
  const conAdjetivoEs = (complemento: ComplementoEstado): ComplementoEstado =>
    adjCompEs.adjetivo && complemento.posesivoSustantivo
      ? { ...complemento, adjetivo: adjCompEs.adjetivo }
      : complemento;
  const conDuenoEs = (complemento: ComplementoEstado): ComplementoEstado => {
    const conDem =
      demCompEs.demostrativo && complemento.posesivoSustantivo
        ? { ...complemento, demostrativo: demCompEs.demostrativo }
        : complemento;
    return duenoCompEs && conDem.posesivoSustantivo
      ? {
          ...conDem,
          duenoPosesivo: duenoCompEs.posesivo,
          duenoNombre: duenoCompEs.posesivoNombre,
          duenoSustantivo: duenoCompEs.posesivoSustantivo,
          duenoDemostrativo: duenoCompEs.posesivoDemostrativo,
        }
      : conDem;
  };
  const resultado = analizarPoseedorEs(
    adjCompEs.adjetivo ? adjCompEs.resto : tokens
  );
  if (!resultado) return null;
  if (resultado.posesivoNombre) {
    const token = tokens[tokens.length - 1];
    if (!aPersonal || adjCompEs.adjetivo) return null;
    if (VERBOS.es.get(token) || ESTADOS_ES[token]) return null;
  }
  if (resultado.posesivo === "3pl") {
    return conDuenoEs(conAdjetivoEs({ ...resultado, dualAlternativo: true }));
  }
  return conDuenoEs(conAdjetivoEs(resultado));
};

const analizarComplementoEs = (
  tokensIniciales: string[]
): ComplementoEstado[] | null => {
  const grupos = dividirPorConjuncion(tokensIniciales, "es");
  if (grupos.length === 0) return null;
  const lista: ComplementoEstado[] = [];
  for (const grupo of grupos) {
    const uno = analizarComplementoUnoEs(grupo);
    if (!uno) return null;
    lista.push(uno);
  }
  return lista;
};

const fraseEstado = (
  clave: string,
  persona: PersonaIR,
  complementosIniciales: ComplementoEstado[] | null,
  polaridad: FraseIR["polaridad"]
): FraseIR => {
  const complementos =
    complementosIniciales && destinoPendiente?.sustantivo
      ? complementosIniciales.map((complemento, indice) =>
          indice === complementosIniciales.length - 1 &&
          complemento.verbo &&
          !complemento.destinoLili
            ? { ...complemento, destinoLili: destinoPendiente!.sustantivo }
            : complemento
        )
      : complementosIniciales;
  return {
    modo: "declarativa",
    polaridad,
    sujeto: { persona },
    predicado: {
      tipo: "estado",
      clave,
      ...(complementos && complementos.length === 1 ? complementos[0] : {}),
      ...(complementos && complementos.length > 1 ? { complementos } : {}),
    },
  };
};

const OBJETO_PRON_ES_CLARO: Record<string, PersonaIR> = {
  me: "1sg",
  te: "2sg",
  nos: "1pl_incl",
  os: "2pl",
};

const OBJETO_PRON_ES_AMBIGUO: Record<string, PersonaIR> = {
  lo: "3sg",
  la: "3sg",
  le: "3sg",
  los: "3pl",
  las: "3pl",
  les: "3pl",
};

const objetoDeCliticoEs = (clitico: string): ObjetoIR | null => {
  const claro = OBJETO_PRON_ES_CLARO[clitico];
  if (claro) return { persona: claro };
  const ambiguo = OBJETO_PRON_ES_AMBIGUO[clitico];
  if (ambiguo) {
    return {
      persona: ambiguo,
      personaOpcional: true,
      dualAlternativo:
        ["los", "las", "les"].includes(clitico) || undefined,
    };
  }
  return null;
};

const conCliticoObjeto = (
  frase: FraseIR,
  clitico: string | null
): FraseIR => {
  if (
    clitico &&
    frase.objeto &&
    frase.objeto.sustantivo !== undefined &&
    !frase.objetoIndirecto
  ) {
    const indirecto = objetoDeCliticoEs(clitico);
    if (indirecto?.persona) {
      frase.objetoIndirecto = {
        persona: indirecto.persona,
        dualAlternativo:
          ["les", "los", "las", "nos"].includes(clitico) || undefined,
      };
      return frase;
    }
  }
  if (!clitico || frase.objeto) return frase;
  const objeto = objetoDeCliticoEs(clitico);
  if (!objeto) return frase;
  const CLITICOS_REFLEXIVOS = new Set(["me", "te", "nos", "os", "se"]);
  const sujetoPersona = frase.sujeto?.persona;
  if (
    CLITICOS_REFLEXIVOS.has(clitico) &&
    objeto.persona &&
    sujetoPersona &&
    (objeto.persona === sujetoPersona ||
      objeto.persona.slice(0, 3) === sujetoPersona.slice(0, 3))
  ) {
    return frase;
  }
  frase.objeto = objeto;
  return frase;
};

const analizarObjeto = (
  tokensIniciales: string[],
  idioma: IdiomaFuente
): ObjetoIR | null => {
  let tokens = [...tokensIniciales];
  const reflexivoObjeto = objetoReflexivoDeNP(tokens, idioma);
  if (reflexivoObjeto) return reflexivoObjeto;
  const ENFASIS_OBJETO =
    idioma === "en"
      ? new Set(["only"])
      : new Set(["solo", "sólo", "solamente"]);
  if (tokens.length > 1 && ENFASIS_OBJETO.has(tokens[0])) {
    const enfatizado = analizarObjeto(tokens.slice(1), idioma);
    if (enfatizado?.persona !== undefined && enfatizado.sustantivo === undefined) {
      return { ...enfatizado, enfatico: true };
    }
  }
  if (tokens.length >= 2) {
    const gerundioActo = buscarVerboGerundio(
      [tokens[tokens.length - 1]],
      idioma
    );
    if (gerundioActo) {
      const objetoBase = analizarObjeto(tokens.slice(0, -1), idioma);
      if (
        objetoBase &&
        (objetoBase.persona !== undefined ||
          objetoBase.sustantivo !== undefined ||
          objetoBase.nombre !== undefined)
      ) {
        return { ...objetoBase, enActo: gerundioActo.clave };
      }
    }
  }
  if (
    idioma === "en" &&
    tokens.length > 1 &&
    OBJETO_PRON_EN[tokens[0]] !== undefined
  ) {
    const directo = analizarObjeto(tokens.slice(1), idioma);
    if (directo && directo.sustantivo !== undefined) {
      objetoIndirectoPendiente = {
        persona: OBJETO_PRON_EN[tokens[0]],
        dualAlternativo: tokens[0] === "them" || undefined,
      };
      return directo;
    }
  }
  let aPersonal = false;
  if (idioma === "es" && tokens[0] === "a" && tokens.length > 1) {
    aPersonal = true;
    tokens = tokens.slice(1);
  }
  if (
    tokens.length > 0 &&
    (INDEFINIDOS[idioma].has(tokens[0]) ||
      ARTICULOS[idioma].has(tokens[0]) ||
      tokens[0] === "some" ||
      tokens[0] === "unos" ||
      tokens[0] === "unas")
  ) {
    tokens = tokens.slice(1);
  }
  const demObjeto = separarDemostrativoNP(tokens, idioma);
  tokens = demObjeto.resto;
  const poseedorObjeto = separarPoseedorNP(tokens, idioma);
  tokens = poseedorObjeto.resto;
  const conPoseedor = (objeto: ObjetoIR): ObjetoIR => ({
    ...objeto,
    ...camposPoseedor(poseedorObjeto),
    ...(demObjeto.demostrativo
      ? { demostrativo: demObjeto.demostrativo }
      : {}),
  });
  if (tokens.length === 0) return null;
  if (
    tokens.length === 1 &&
    poseedorObjeto.posesivo !== undefined &&
    !poseedorObjeto.posesivoEnfatico &&
    !poseedorObjeto.posesivoReflexivo
  ) {
    const parteObjeto = palabraDeTipo(tokens[0], idioma, "sustantivo");
    if (parteObjeto?.parteCuerpo === true) {
      return {
        persona: poseedorObjeto.posesivo,
        parteCuerpo: parteObjeto.clave,
      };
    }
  }
  const claveDoble = tokens.join(" ");
  if (idioma === "en") {
    const dobles: Record<string, PersonaIR> = {
      "them two": "3dual",
      "you two": "2dual",
      "us two": "1dual_excl",
    };
    if (dobles[claveDoble]) return { persona: dobles[claveDoble] };
  } else {
    const personaPron =
      PRONOMBRES_DOBLES.es[claveDoble] ??
      PRONOMBRES_OBLICUOS_ES[claveDoble] ??
      (aPersonal ? PRONOMBRES.es[claveDoble] : undefined);
    if (personaPron) {
      return {
        persona: personaPron,
        dualAlternativo: personaPron === "3pl" || undefined,
      };
    }
  }
  const adjetivoSeparado = separarAdjetivoNP(tokens, idioma);
  const adjetivoObjeto = adjetivoSeparado.adjetivo;
  tokens = adjetivoSeparado.resto;
  const conAdjetivo = (objeto: ObjetoIR): ObjetoIR =>
    adjetivoObjeto ? { ...objeto, adjetivo: adjetivoObjeto } : objeto;
  if (tokens.length !== 1) return null;
  if (idioma === "en") {
    if (tokens[0] === "it") return {};
    const pron = OBJETO_PRON_EN[tokens[0]];
    if (pron) {
      return {
        persona: pron,
        dualAlternativo: tokens[0] === "them" || undefined,
      };
    }
  }
  const sustantivo = palabraDeTipo(tokens[0], idioma, "sustantivo");
  if (sustantivo) {
    return conPoseedor(
      conAdjetivo({
        sustantivo: sustantivo.clave,
        ...(esPluralSuperficie(tokens[0], sustantivo, idioma)
          ? { plural: true }
          : {}),
      })
    );
  }
  if (
    VERBOS[idioma].get(tokens[0]) ||
    (idioma === "en" ? ESTADOS_EN[tokens[0]] : ESTADOS_ES[tokens[0]])
  ) {
    return null;
  }
  if (idioma === "es" && !aPersonal) return null;
  return conPoseedor(
    conAdjetivo({
      nombre: tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1),
    })
  );
};

const PARTICULAS_VERBO_EN = new Set([
  "away",
  "out",
  "up",
  "down",
  "back",
  "around",
  "off",
  "in",
  "on",
]);

const separarObjeto = (
  tokens: string[],
  idioma: IdiomaFuente,
  buscar: (t: string[]) => VerboVocabulario | null
): { verbo: VerboVocabulario; objeto: ObjetoIR | null } | null => {
  for (let corte = tokens.length; corte >= 1; corte--) {
    const verbo = buscar(tokens.slice(0, corte));
    if (!verbo) continue;
    const restoObjeto = tokens.slice(corte);
    if (restoObjeto.length === 0) return { verbo, objeto: null };
    const objeto = analizarObjeto(restoObjeto, idioma);
    if (objeto) return { verbo, objeto };
  }
  if (idioma === "en" && tokens.length >= 3) {
    const particula = tokens[tokens.length - 1];
    if (PARTICULAS_VERBO_EN.has(particula)) {
      for (let corte = tokens.length - 2; corte >= 1; corte--) {
        const verbo = buscar([...tokens.slice(0, corte), particula]);
        if (!verbo) continue;
        const objeto = analizarObjeto(tokens.slice(corte, -1), idioma);
        if (objeto) return { verbo, objeto };
      }
    }
  }
  return null;
};

const analizarEstadoConSujeto = (
  resto: string[],
  idioma: IdiomaFuente,
  sujeto: FraseIR["sujeto"]
): FraseIR | null => {
  if (resto.length === 0) return null;
  const negativa = idioma === "es" && resto[0] === "no";
  const cuerpoEstado = negativa ? resto.slice(1) : resto;
  if (cuerpoEstado.length === 0) return null;
  const clave =
    idioma === "en"
      ? ESTADOS_EN[cuerpoEstado[0]]
      : ESTADOS_ES[cuerpoEstado[0]]?.clave;
  if (!clave) return null;
  const complementos =
    cuerpoEstado.length > 1
      ? idioma === "en"
        ? analizarComplementoEn(cuerpoEstado.slice(1))
        : analizarComplementoEs(cuerpoEstado.slice(1))
      : null;
  if (cuerpoEstado.length > 1 && !complementos) return null;
  return {
    modo: "declarativa",
    polaridad: negativa ? "negativa" : "afirmativa",
    sujeto,
    predicado: {
      tipo: "estado",
      clave,
      ...(complementos && complementos.length === 1 ? complementos[0] : {}),
      ...(complementos && complementos.length > 1 ? { complementos } : {}),
    },
  };
};

const analizarPoseedorEs = (
  tokensIniciales: string[]
): {
  posesivo?: PersonaIR;
  posesivoSustantivo?: string;
  posesivoNombre?: string;
} | null => {
  const tokens = quitarArticulo(tokensIniciales, "es");
  if (tokens.length === 0) return null;
  const clave = tokens.join(" ");
  const persona =
    PRONOMBRES_DOBLES.es[clave] ??
    PRONOMBRES.es[clave] ??
    PRONOMBRES_OBLICUOS_ES[clave];
  if (persona) return { posesivo: persona };
  if (tokens.length !== 1) return null;
  const sustantivo = palabraDeTipo(tokens[0], "es", "sustantivo");
  if (sustantivo) return { posesivoSustantivo: sustantivo.clave };
  return {
    posesivoNombre: tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1),
  };
};

const analizarPredicadoVerbless = (
  resto: string[],
  idioma: IdiomaFuente,
  demostrativo: DemostrativoIR
): FraseIR | null => {
  const sinGrados = resto.filter((token) => !GRADOS[idioma].has(token));
  let sinArticulo = quitarArticulo(
    sinGrados.length > 0 ? sinGrados : resto,
    idioma
  );
  const teniaArticulo = sinArticulo.length !== resto.length;

  const det = POSESIVOS_DET[idioma][sinArticulo[0]];
  if (det && sinArticulo.length === 2) {
    const sustantivo = palabraDeTipo(sinArticulo[1], idioma, "sustantivo");
    if (sustantivo) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: { demostrativo },
        predicado: {
          tipo: "sustantivo",
          clave: sustantivo.clave,
          posesivo: det,
        },
      };
    }
  }
  {
    const poseedorMarcado = separarPoseedorNP(sinArticulo, idioma);
    if (
      poseedorMarcado.posesivo !== undefined &&
      (poseedorMarcado.posesivoEnfatico === true ||
        poseedorMarcado.posesivoReflexivo === true) &&
      poseedorMarcado.resto.length === 1
    ) {
      const sustantivoMarcado = palabraDeTipo(
        poseedorMarcado.resto[0],
        idioma,
        "sustantivo"
      );
      if (sustantivoMarcado) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: { demostrativo },
          predicado: {
            tipo: "sustantivo",
            clave: sustantivoMarcado.clave,
            posesivo: poseedorMarcado.posesivo,
            ...(poseedorMarcado.posesivoEnfatico
              ? { posesivoEnfatico: true }
              : {}),
            ...(poseedorMarcado.posesivoReflexivo
              ? { posesivoReflexivo: true }
              : {}),
          },
        };
      }
    }
  }

  if (idioma === "en") {
    const sinThe =
      sinArticulo[0] === "the" ? sinArticulo.slice(1) : sinArticulo;
    if (sinThe.length === 2 && sinThe[0].endsWith("s")) {
      const sustantivo = palabraDeTipo(sinThe[1], idioma, "sustantivo");
      const base = sinThe[0].slice(0, -1);
      if (sustantivo && !PALABRAS.en.get(sinThe[0])) {
        const poseedor = palabraDeTipo(base, "en", "sustantivo");
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: { demostrativo },
          predicado: poseedor
            ? {
                tipo: "sustantivo",
                clave: sustantivo.clave,
                posesivoSustantivo: poseedor.clave,
              }
            : {
                tipo: "sustantivo",
                clave: sustantivo.clave,
                posesivoNombre:
                  base.charAt(0).toUpperCase() + base.slice(1),
              },
        };
      }
    }
  }

  if (idioma === "es") {
    if (ARTICULOS.es.has(sinArticulo[0])) {
      sinArticulo = sinArticulo.slice(1);
    }
    const indiceDe = sinArticulo.indexOf("de");
    if (indiceDe === 1 && sinArticulo.length >= 3) {
      const sustantivo = palabraDeTipo(sinArticulo[0], "es", "sustantivo");
      const poseedor = analizarPoseedorEs(sinArticulo.slice(2));
      const poseedorCosa =
        poseedor?.posesivoSustantivo !== undefined &&
        VOCAB.palabras.find(
          (palabra) =>
            palabra.clave === poseedor.posesivoSustantivo &&
            palabra.tipo === "sustantivo"
        )?.persona !== true;
      if (sustantivo && poseedor && !poseedorCosa) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: { demostrativo },
          predicado: {
            tipo: "sustantivo",
            clave: sustantivo.clave,
            ...poseedor,
          },
        };
      }
    }
  }

  {
    const np = [...sinArticulo];
    const buscarPrep = (
      preps: string[]
    ): { clave: string; pertenencia: PertenenciaIR } | null => {
      for (const prep of preps) {
        const indicePrep = np.indexOf(prep);
        if (indicePrep <= 0 || indicePrep >= np.length - 1) continue;
        const cabezaTokens = quitarArticulo(np.slice(0, indicePrep), idioma);
        if (cabezaTokens.length !== 1) continue;
        const cabeza = palabraDeTipo(cabezaTokens[0], idioma, "sustantivo");
        if (!cabeza) continue;
        const pertenencia = pertenenciaDeNP(np.slice(indicePrep + 1), idioma);
        if (!pertenencia) continue;
        if (idioma === "es" && prep === "de") {
          if (pertenencia.persona || pertenencia.nombre) continue;
          if (pertenencia.sustantivo) {
            const palabraPertenencia = VOCAB.palabras.find(
              (palabra) =>
                palabra.clave === pertenencia.sustantivo &&
                palabra.tipo === "sustantivo"
            );
            if (palabraPertenencia?.persona === true) continue;
          }
        }
        return { clave: cabeza.clave, pertenencia };
      }
      return null;
    };
    let pertenenciaPredicado =
      idioma === "en"
        ? buscarPrep(["for", "of", "from"])
        : buscarPrep(["para", "de"]);
    const lecturaAdjetivo =
      np.length === 2 &&
      (idioma === "en"
        ? palabraDeTipo(np[0], "en", "adjetivo") !== null &&
          palabraDeTipo(np[1], "en", "sustantivo") !== null
        : palabraDeTipo(np[0], "es", "sustantivo") !== null &&
          palabraDeTipo(np[1], "es", "adjetivo") !== null);
    if (!pertenenciaPredicado && np.length >= 2 && !lecturaAdjetivo) {
      const cabeza = palabraDeTipo(
        np[np.length - 1],
        idioma,
        "sustantivo"
      );
      if (cabeza) {
        const pertenencia = pertenenciaDeNP(np.slice(0, -1), idioma);
        if (pertenencia) {
          pertenenciaPredicado = { clave: cabeza.clave, pertenencia };
        }
      }
    }
    if (pertenenciaPredicado) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: { demostrativo },
        predicado: {
          tipo: "sustantivo",
          clave: pertenenciaPredicado.clave,
        },
        pertenencia: pertenenciaPredicado.pertenencia,
      };
    }
  }

  if (sinArticulo.length === 1) {
    const orden: ("adjetivo" | "sustantivo")[] = teniaArticulo
      ? ["sustantivo", "adjetivo"]
      : ["adjetivo", "sustantivo"];
    for (const tipoPrueba of orden) {
      const palabra = palabraDeTipo(sinArticulo[0], idioma, tipoPrueba);
      if (palabra) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: { demostrativo },
          predicado: { tipo: tipoPrueba, clave: palabra.clave },
        };
      }
    }
    return null;
  }

  if (sinArticulo.length === 2) {
    const primeraAdjetivo = palabraDeTipo(sinArticulo[0], idioma, "adjetivo");
    const segundaSustantivo = palabraDeTipo(sinArticulo[1], idioma, "sustantivo");
    if (primeraAdjetivo && segundaSustantivo) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: { demostrativo, sustantivo: segundaSustantivo.clave },
        predicado: { tipo: "adjetivo", clave: primeraAdjetivo.clave },
      };
    }
    const primeraSustantivo = palabraDeTipo(sinArticulo[0], idioma, "sustantivo");
    const segundaAdjetivo = palabraDeTipo(sinArticulo[1], idioma, "adjetivo");
    if (primeraSustantivo && segundaAdjetivo) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: { demostrativo, sustantivo: primeraSustantivo.clave },
        predicado: { tipo: "adjetivo", clave: segundaAdjetivo.clave },
      };
    }
  }

  return null;
};

const CUANTIFICADORES: Record<
  IdiomaFuente,
  { tokens: string[]; clave: string }[]
> = {
  es: VOCAB.cuantificadores
    .flatMap((cuantificador) =>
      cuantificador.es.map((forma) => ({
        tokens: limpiar(forma),
        clave: cuantificador.clave,
      }))
    )
    .sort((a, b) => b.tokens.length - a.tokens.length),
  en: VOCAB.cuantificadores
    .flatMap((cuantificador) =>
      cuantificador.en.map((forma) => ({
        tokens: limpiar(forma),
        clave: cuantificador.clave,
      }))
    )
    .sort((a, b) => b.tokens.length - a.tokens.length),
};

const analizarPosesionCuantificada = (
  np: string[],
  idioma: IdiomaFuente
): { sustantivo: string; cuantificador: string } | null => {
  for (const { tokens: forma, clave } of CUANTIFICADORES[idioma]) {
    const n = forma.length;
    if (np.length <= n) continue;
    if (np.slice(0, n).join(" ") !== forma.join(" ")) continue;
    let restoNP = np.slice(n);
    if (restoNP[0] === "de") restoNP = restoNP.slice(1);
    if (restoNP.length !== 1) continue;
    const sustantivo = palabraDeTipo(restoNP[0], idioma, "sustantivo");
    if (sustantivo) {
      return { sustantivo: sustantivo.clave, cuantificador: clave };
    }
  }
  return null;
};

const analizarDerivado = (
  resto: string[],
  idioma: IdiomaFuente,
  sujeto: FraseIR["sujeto"]
): FraseIR | null => {
  let tokens = [...resto];
  let sufijo: "mirri" | "miriw" = "mirri";

  const posesion = analizarPosesionCuantificada(tokens, idioma);
  if (posesion && sujeto) {
    return {
      modo: "declarativa",
      polaridad: "afirmativa",
      sujeto,
      predicado: {
        tipo: "posesion",
        clave: posesion.sustantivo,
        estado: posesion.cuantificador,
      },
    };
  }

  if (idioma === "en" && tokens[0] === "no") {
    sufijo = "miriw";
    tokens = tokens.slice(1);
  }

  tokens = quitarIndefinido(tokens, idioma);

  const final = tokens.slice(-2).join(" ");
  if (final === "in it" || final === "on it") {
    tokens = tokens.slice(0, -2);
  }

  if (tokens.length !== 1) return null;
  const sustantivo = palabraDeTipo(tokens[0], idioma, "sustantivo");
  if (!sustantivo) return null;

  return {
    modo: "declarativa",
    polaridad: "afirmativa",
    sujeto,
    predicado: { tipo: "derivado", clave: sustantivo.clave, sufijo },
  };
};

const analizarDerivadoPreposicion = (
  tokens: string[],
  idioma: IdiomaFuente,
  sujeto: FraseIR["sujeto"]
): FraseIR | null => {
  if (tokens.length === 0) return null;
  const sufijo = PREPOSICION_DERIVADO[idioma][tokens[0]];
  if (!sufijo) return null;
  const resto = quitarArticulo(tokens.slice(1), idioma);
  if (resto.length !== 1) return null;
  const sustantivo = palabraDeTipo(resto[0], idioma, "sustantivo");
  if (!sustantivo) return null;
  return {
    modo: "declarativa",
    polaridad: "afirmativa",
    sujeto,
    predicado: { tipo: "derivado", clave: sustantivo.clave, sufijo },
  };
};

const subjuntivoNosotros = (token: string): VerboVocabulario | null => {
  const base = desacentuar(token);
  let candidatos: string[] = [];
  if (base.endsWith("emos") && base.length > 5) {
    const raiz = base.slice(0, -4);
    candidatos = [`${raiz}ar`];
    if (raiz.endsWith("gu")) candidatos.push(`${raiz.slice(0, -1)}ar`);
    if (raiz.endsWith("qu")) candidatos.push(`${raiz.slice(0, -2)}car`);
    if (raiz.endsWith("c")) candidatos.push(`${raiz.slice(0, -1)}zar`);
  } else if (base.endsWith("amos") && base.length > 5) {
    const raiz = base.slice(0, -4);
    candidatos = [`${raiz}er`, `${raiz}ir`];
    if (raiz.includes("u")) {
      candidatos.push(`${raiz.replace("u", "o")}ir`);
    }
    if (raiz.includes("i")) {
      candidatos.push(`${raiz.replace("i", "e")}ir`);
    }
  }
  for (const candidato of candidatos) {
    const verbo =
      preferirReflexivo(candidato) ??
      VERBOS.es.get(candidato) ??
      VERBOS.es.get(`${candidato}se`) ??
      null;
    if (verbo) return verbo;
  }
  return null;
};

const FRECUENCIAS: Record<
  IdiomaFuente,
  { tokens: string[]; diario?: boolean; amenudo?: boolean }[]
> = {
  en: [
    { tokens: ["every", "day"], diario: true },
    { tokens: ["all", "the", "time"], diario: true },
    { tokens: ["always"], diario: true },
    { tokens: ["often"], amenudo: true },
    { tokens: ["sometimes"] },
  ],
  es: [
    { tokens: ["todos", "los", "dias"], diario: true },
    { tokens: ["cada", "dia"], diario: true },
    { tokens: ["todo", "el", "tiempo"], diario: true },
    { tokens: ["siempre"], diario: true },
    { tokens: ["a", "menudo"], amenudo: true },
    { tokens: ["frecuentemente"], amenudo: true },
    { tokens: ["a", "veces"] },
  ],
};

const SOLER_ES: Record<string, PersonaIR> = {
  solia: "1sg",
  solias: "2sg",
  soliamos: "1pl_incl",
  solian: "3pl",
};

const PARTICIPIOS_A_PASADO_EN: Record<string, string> = {
  taken: "took",
  gone: "went",
  eaten: "ate",
  seen: "saw",
  written: "wrote",
  spoken: "spoke",
  broken: "broke",
  forgotten: "forgot",
  come: "came",
  fallen: "fell",
  run: "ran",
  given: "gave",
  stolen: "stole",
  flown: "flew",
  grown: "grew",
  hidden: "hid",
  beaten: "beat",
};

const PARTICIPIOS_IRREGULARES_ES: Record<string, string> = {
  roto: "romper",
  muerto: "morir",
  abierto: "abrir",
  escrito: "escribir",
  hecho: "hacer",
  puesto: "poner",
  vuelto: "volver",
  perdido: "perder",
};

const DEBER_ES: Record<
  string,
  { persona: PersonaIR; modal: "should" | "must" }
> = {
  debo: { persona: "1sg", modal: "must" },
  debes: { persona: "2sg", modal: "must" },
  debe: { persona: "3sg", modal: "must" },
  debemos: { persona: "1pl_incl", modal: "must" },
  deben: { persona: "3pl", modal: "must" },
  deberia: { persona: "1sg", modal: "should" },
  deberias: { persona: "2sg", modal: "should" },
  deberiamos: { persona: "1pl_incl", modal: "should" },
  deberian: { persona: "3pl", modal: "should" },
};

const SENTIMIENTO_ES: Record<string, string> = {
  cansado: "be tired",
  cansada: "be tired",
  enfermo: "be sick",
  enferma: "be sick",
  preparado: "be ready",
  preparada: "be ready",
  contento: "be happy",
  contenta: "be happy",
  feliz: "be happy",
  alegre: "be happy",
  sediento: "be thirsty",
  sedienta: "be thirsty",
  asustado: "be frightened",
  asustada: "be frightened",
  avergonzado: "be ashamed",
  avergonzada: "be ashamed",
};

const TENER_SENTIMIENTO_ES: Record<
  string,
  { adjetivo?: string; verbo?: string }
> = {
  hambre: { adjetivo: "hungry" },
  frio: { adjetivo: "cold" },
  calor: { adjetivo: "hot" },
  sed: { verbo: "be thirsty" },
};

const HABER_ES: Record<string, PersonaIR> = {
  he: "1sg",
  has: "2sg",
  ha: "3sg",
  hemos: "1pl_incl",
  han: "3pl",
};

const verboParticipioEn = (tokens: string[]): VerboVocabulario | null => {
  if (tokens.length === 0) return null;
  const mapeado = PARTICIPIOS_A_PASADO_EN[tokens[0]];
  return buscarVerboPasadoEn(mapeado ? [mapeado, ...tokens.slice(1)] : tokens);
};

const verboParticipioEs = (token: string): VerboVocabulario | null => {
  const base = desacentuar(token);
  let candidatos: string[] = [];
  if (PARTICIPIOS_IRREGULARES_ES[base]) {
    candidatos = [PARTICIPIOS_IRREGULARES_ES[base]];
  } else if (base.endsWith("ado") && base.length > 4) {
    candidatos = [`${base.slice(0, -3)}ar`];
  } else if (base.endsWith("ido") && base.length > 4) {
    const raiz = base.slice(0, -3);
    candidatos = [`${raiz}er`, `${raiz}ir`];
  } else if (base === "venido") {
    candidatos = ["venir"];
  }
  for (const candidato of candidatos) {
    const verbo =
      preferirReflexivo(candidato) ??
      VERBOS.es.get(candidato) ??
      VERBOS.es.get(`${candidato}se`) ??
      null;
    if (verbo) return verbo;
  }
  return null;
};

const extraerHabitual = (
  tokens: string[],
  idioma: IdiomaFuente
): { resto: string[]; habitual: HabitualIR } | null => {
  const norma = (token: string | undefined): string =>
    idioma === "es" ? desacentuar(token ?? "") : (token ?? "");
  let resto = [...tokens];
  let habitual: HabitualIR | null = null;
  busqueda: for (const frecuencia of FRECUENCIAS[idioma]) {
    const n = frecuencia.tokens.length;
    if (resto.length <= n) continue;
    for (let indice = 0; indice + n <= resto.length; indice++) {
      const segmento = resto
        .slice(indice, indice + n)
        .map(norma)
        .join(" ");
      if (segmento !== frecuencia.tokens.join(" ")) continue;
      resto = [...resto.slice(0, indice), ...resto.slice(indice + n)];
      habitual = {
        ...(frecuencia.diario ? { diario: true } : {}),
        ...(frecuencia.amenudo ? { amenudo: true } : {}),
      };
      break busqueda;
    }
  }
  const conUsedTo =
    idioma === "en"
      ? resto.some(
          (token, indice) => token === "used" && resto[indice + 1] === "to"
        )
      : resto.some((token) => SOLER_ES[desacentuar(token)] !== undefined);
  if (conUsedTo) {
    const ANTES =
      idioma === "en"
        ? new Set(["before", "previously"])
        : new Set(["antes", "antiguamente"]);
    const ultimo = norma(resto[resto.length - 1]);
    const primero = norma(resto[0]);
    if (resto.length > 1 && ANTES.has(ultimo)) {
      resto = resto.slice(0, -1);
      habitual = { ...(habitual ?? {}), antes: true };
    } else if (resto.length > 1 && ANTES.has(primero)) {
      resto = resto.slice(1);
      habitual = { ...(habitual ?? {}), antes: true };
    }
  }
  if (!habitual) return null;
  return { resto, habitual };
};

const MANERAS: Record<
  IdiomaFuente,
  { tokens: string[]; manera: string }[]
> = {
  en: [
    { tokens: ["for", "good"], manera: "muŋbunuma" },
    { tokens: ["all", "up"], manera: "dhawar'marama" },
    { tokens: ["loudly"], manera: "mirithirri" },
    { tokens: ["hard"], manera: "mirithirri" },
    { tokens: ["fast"], manera: "mirithirri" },
    { tokens: ["wide"], manera: "mirithirri" },
    { tokens: ["badly"], manera: "yätjama" },
    { tokens: ["quietly"], manera: "mukthun" },
    { tokens: ["cleanly"], manera: "hacer:clean" },
    { tokens: ["truthfully"], manera: "hacer:true" },
    { tokens: ["well"], manera: "hacer:good" },
    { tokens: ["properly"], manera: "hacer:good" },
    { tokens: ["straight"], manera: "hacer:straight" },
    { tokens: ["fully"], manera: "hacer:full" },
    { tokens: ["everything"], manera: "warrpam'thun" },
    { tokens: ["like", "this"], manera: "bitjan" },
    { tokens: ["like", "that"], manera: "bitjan" },
    { tokens: ["thus"], manera: "bitjan" },
  ],
  es: [
    { tokens: ["para", "siempre"], manera: "muŋbunuma" },
    { tokens: ["asi"], manera: "bitjan" },
    { tokens: ["en", "voz", "alta"], manera: "mirithirri" },
    { tokens: ["en", "silencio"], manera: "mukthun" },
    { tokens: ["rapido"], manera: "mirithirri" },
    { tokens: ["mal"], manera: "yätjama" },
    { tokens: ["bien"], manera: "hacer:good" },
    { tokens: ["correctamente"], manera: "hacer:good" },
    { tokens: ["derecho"], manera: "hacer:straight" },
    { tokens: ["limpiamente"], manera: "hacer:clean" },
    { tokens: ["completamente"], manera: "warrpam'thun" },
  ],
};

const LEMAS_TRANSPORTE_BACK = new Set([
  "djuy'yun",
  "yänguma",
  "gäma",
  "nhirrpan",
  "rulwaŋdhun",
]);

const hayVerboDeVuelta = (
  tokens: string[],
  idioma: IdiomaFuente
): boolean =>
  tokens.some((token) => {
    const candidatos: (VerboVocabulario | null)[] = [
      buscarVerbo([token], idioma),
      buscarVerboImperativo([token], idioma),
      idioma === "en" ? buscarVerboPasadoEn([token]) : null,
      idioma === "es" ? (preteritoSintetico(token)?.verbo ?? null) : null,
      idioma === "es" ? (futuroSintetico(token)?.verbo ?? null) : null,
    ];
    return candidatos.some(
      (verbo) => verbo !== null && LEMAS_TRANSPORTE_BACK.has(verbo.lema)
    );
  });

const extraerManera = (
  tokens: string[],
  idioma: IdiomaFuente
): { manera: string; resto: string[]; gradoAdjetivo?: boolean } | null => {
  const norma = (token: string | undefined): string =>
    idioma === "es" ? desacentuar(token ?? "") : (token ?? "");
  for (const candidato of MANERAS[idioma]) {
    const n = candidato.tokens.length;
    if (tokens.length <= n) continue;
    const alFinal = tokens.slice(-n).map(norma).join(" ");
    const alInicio = tokens.slice(0, n).map(norma).join(" ");
    let resto: string[] | null = null;
    if (alFinal === candidato.tokens.join(" ")) {
      resto = tokens.slice(0, -n);
    } else if (alInicio === candidato.tokens.join(" ")) {
      resto = tokens.slice(n);
    }
    if (!resto) continue;
    if (!hayVerboAccion(resto, idioma)) continue;
    if (candidato.manera.startsWith("hacer:")) {
      const CONTEXTO_CAUSATIVO =
        idioma === "en"
          ? new Set(["made", "let", "became"])
          : new Set([
              "hizo",
              "hicieron",
              "hice",
              "hiciste",
              "dejo",
              "dejaron",
              "puso",
              "pusieron",
              "volvio",
              "volvieron",
            ]);
      if (resto.some((token) => CONTEXTO_CAUSATIVO.has(norma(token)))) {
        continue;
      }
    }
    return { manera: candidato.manera, resto };
  }
  if (
    idioma === "en" &&
    tokens.length > 2 &&
    tokens[tokens.length - 1] === "back" &&
    hayVerboDeVuelta(tokens.slice(0, -1), idioma)
  ) {
    return { manera: "roŋanmarama", resto: tokens.slice(0, -1) };
  }
  if (tokens.length >= 2) {
    const CESAR_MANERA = new Set([
      "stopped",
      "ceased",
      "finished",
      "stop",
      "stops",
      "cease",
      "ceases",
      "finish",
      "finishes",
    ]);
    if (!CESAR_MANERA.has(norma(tokens[tokens.length - 2]))) {
      const gerundioManera = buscarVerboGerundio(
        [tokens[tokens.length - 1]],
        idioma
      );
      const previoVerbo =
        idioma === "en"
          ? (buscarVerboPasadoEn([tokens[tokens.length - 2]]) ??
            buscarVerbo([tokens[tokens.length - 2]], "en"))
          : (preteritoSintetico(tokens[tokens.length - 2])?.verbo ??
            buscarVerbo([tokens[tokens.length - 2]], "es"));
      if (gerundioManera && previoVerbo) {
        return { manera: gerundioManera.lema, resto: tokens.slice(0, -1) };
      }
    }
  }
  for (let indice = 0; indice < tokens.length - 1; indice++) {
    const esMuy =
      (idioma === "en" && tokens[indice] === "very") ||
      (idioma === "es" && norma(tokens[indice]) === "muy");
    if (!esMuy) continue;
    const adjetivoMuy = palabraDeTipo(tokens[indice + 1], idioma, "adjetivo");
    if (!adjetivoMuy) continue;
    return {
      manera: "mirithirri",
      resto: [...tokens.slice(0, indice), ...tokens.slice(indice + 1)],
      gradoAdjetivo: true,
    };
  }
  return null;
};

const extraerMomento = (
  tokens: string[],
  idioma: IdiomaFuente
): { momento: NonNullable<FraseIR["momento"]>; resto: string[] } | null => {
  if (tokens.length < 2) return null;
  const norma = (token: string | undefined): string =>
    idioma === "es" ? desacentuar(token ?? "") : (token ?? "");
  const ultimo = norma(tokens[tokens.length - 1]);
  const penultimo = norma(tokens[tokens.length - 2]);
  if (
    tokens.length > 2 &&
    ((idioma === "en" && penultimo === "for" && ultimo === "now") ||
      (idioma === "es" &&
        (penultimo === "por" || penultimo === "para") &&
        ultimo === "ahora"))
  ) {
    return { momento: "para_ahora", resto: tokens.slice(0, -2) };
  }
  if (
    idioma === "es" &&
    tokens.length > 2 &&
    ultimo === "mismo" &&
    penultimo === "ahora"
  ) {
    return { momento: "ahora", resto: tokens.slice(0, -2) };
  }
  if (
    ((idioma === "en" && ultimo === "now") ||
      (idioma === "es" && ultimo === "ahora")) &&
    !(idioma === "en" && penultimo === "just") &&
    !(idioma === "es" && penultimo === "justo")
  ) {
    return { momento: "ahora", resto: tokens.slice(0, -1) };
  }
  let inicio = 0;
  if (
    (idioma === "en" && tokens[0] === "and") ||
    (idioma === "es" && (tokens[0] === "y" || tokens[0] === "e"))
  ) {
    inicio = 1;
  }
  const cabeza = norma(tokens[inicio]);
  if (
    tokens.length > inicio + 1 &&
    ((idioma === "en" && cabeza === "then") ||
      (idioma === "es" &&
        (cabeza === "entonces" || (inicio === 1 && cabeza === "luego"))))
  ) {
    return { momento: "entonces", resto: tokens.slice(inicio + 1) };
  }
  if (
    (idioma === "en" && tokens[0] === "now") ||
    (idioma === "es" && norma(tokens[0]) === "ahora")
  ) {
    return { momento: "ahora", resto: tokens.slice(1) };
  }
  return null;
};

const analizarNucleo = (texto: string, idioma: IdiomaFuente): FraseIR | null => {
  lugarPendiente = null;
  comitativoPendiente = null;
  destinoPendiente = null;
  origenPendiente = null;
  propositoPendiente = null;
  objetoIndirectoPendiente = null;
  instrumentoPendiente = null;
  pertenenciaPendiente = null;
  perlativoPendiente = null;
  vecesPendiente = null;
  let palabras = fusionarMultipalabra(limpiar(texto), idioma);
  if (palabras.length === 0) return null;
  reflexivoPendiente = idioma === "es" && hayReflexivoEs(palabras);

  {
    let posCreencia = 0;
    let posPregunta = 0;
    let restoYanapi: string[] = [];
    if (idioma === "en" && palabras.length >= 3) {
      posCreencia =
        PRONOMBRES.en[palabras[0]] !== undefined && palabras[1] === "thought"
          ? 2
          : 0;
      posPregunta =
        palabras[0] === "is" && palabras[1] === "it" && palabras[2] === "true"
          ? 3
          : 0;
      if (posCreencia > 0 || posPregunta > 0) {
        restoYanapi = palabras.slice(
          posCreencia > 0 ? posCreencia : posPregunta
        );
        if (restoYanapi[0] === "that") restoYanapi = restoYanapi.slice(1);
        if (restoYanapi[0] === "to" || restoYanapi[0] === "about") {
          posCreencia = 0;
          posPregunta = 0;
        }
      }
    } else if (idioma === "es" && palabras.length >= 3) {
      const dYanapi = palabras.map(desacentuar);
      const PENSAR_ES = new Set([
        "crei",
        "creia",
        "creyo",
        "creimos",
        "creiamos",
        "creian",
        "creyeron",
        "pense",
        "penso",
        "pensaba",
        "pensamos",
        "pensabamos",
        "pensaban",
        "pensaron",
      ]);
      const inicioYanapi = [
        "yo",
        "el",
        "ella",
        "ellos",
        "ellas",
        "nosotros",
        "nosotras",
      ].includes(dYanapi[0])
        ? 1
        : 0;
      posCreencia =
        PENSAR_ES.has(dYanapi[inicioYanapi]) &&
        dYanapi[inicioYanapi + 1] === "que"
          ? inicioYanapi + 2
          : 0;
      posPregunta =
        dYanapi[0] === "es" &&
        ["verdad", "cierto"].includes(dYanapi[1]) &&
        dYanapi[2] === "que"
          ? 3
          : 0;
      if (posCreencia > 0 || posPregunta > 0) {
        restoYanapi = palabras.slice(
          posCreencia > 0 ? posCreencia : posPregunta
        );
      }
    }
    if ((posCreencia > 0 || posPregunta > 0) && restoYanapi.length > 0) {
      let formaYanapi: "II" | "IV" | undefined;
      if (posCreencia > 0 && idioma === "en" && restoYanapi.includes("had")) {
        restoYanapi = restoYanapi.map((token) =>
          token === "had" ? "have" : token
        );
        formaYanapi = "IV";
      }
      if (
        posCreencia > 0 &&
        idioma === "es" &&
        restoYanapi.some((token) =>
          ["habia", "habian"].includes(desacentuar(token))
        )
      ) {
        restoYanapi = restoYanapi.map((token) => {
          const da = desacentuar(token);
          return da === "habia" ? "ha" : da === "habian" ? "han" : token;
        });
        formaYanapi = "IV";
      }
      let fraseYanapi = analizarNucleo(restoYanapi.join(" "), idioma);
      let sinDemYanapi = false;
      const npYanapi =
        idioma === "en" &&
        restoYanapi[0] === "it" &&
        (restoYanapi[1] === "was" || restoYanapi[1] === "is") &&
        restoYanapi.length > 2
          ? restoYanapi.slice(2)
          : idioma === "es" &&
              ["era", "es"].includes(desacentuar(restoYanapi[0])) &&
              restoYanapi.length > 1
            ? restoYanapi.slice(1)
            : null;
      if (!fraseYanapi && npYanapi !== null) {
        const posesivoYanapi =
          npYanapi.length === 1
            ? POSESIVOS_PRON[idioma][npYanapi[0]]
            : undefined;
        if (posesivoYanapi !== undefined) {
          fraseYanapi = {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: null,
            predicado: { tipo: "pertenencia", clave: "pertenencia" },
            pertenencia: { persona: posesivoYanapi },
          };
        } else {
          fraseYanapi = analizarNucleo(
            [
              ...(idioma === "en" ? ["this", "is"] : ["esto", "es"]),
              ...npYanapi,
            ].join(" "),
            idioma
          );
          if (fraseYanapi) sinDemYanapi = true;
        }
      }
      if (fraseYanapi && fraseYanapi.yanapi === undefined) {
        if (
          posCreencia > 0 &&
          formaYanapi === undefined &&
          typeof fraseYanapi.tiempo === "string" &&
          fraseYanapi.tiempo.startsWith("pasado")
        ) {
          formaYanapi = "II";
        }
        fraseYanapi.yanapi = {
          tipo: posCreencia > 0 ? "creencia" : "pregunta",
          ...(posCreencia > 0 && formaYanapi ? { forma: formaYanapi } : {}),
          ...(sinDemYanapi ? { sinDem: true } : {}),
        };
        return fraseYanapi;
      }
    }
  }

  {
    const dPos = palabras.map(desacentuar);
    const COPULA_POS =
      idioma === "es" ? new Set(["es", "era"]) : new Set(["is", "was"]);
    const CABEZA_POS =
      idioma === "es"
        ? new Set(["esto", "eso", "aquello", "este", "ese"])
        : new Set(["this", "that", "it"]);
    let demPos: DemostrativoIR | null | undefined;
    let personaPos: PersonaIR | undefined;
    let tokenPos: string | undefined;
    let interrogativaPos = false;
    if (
      palabras.length === 3 &&
      CABEZA_POS.has(dPos[0]) &&
      COPULA_POS.has(dPos[1]) &&
      POSESIVOS_PRON[idioma][palabras[2]] !== undefined
    ) {
      demPos = DEMOSTRATIVOS[idioma][palabras[0]] ?? null;
      personaPos = POSESIVOS_PRON[idioma][palabras[2]];
      tokenPos = palabras[2];
    } else if (
      palabras.length === 3 &&
      COPULA_POS.has(dPos[0]) &&
      CABEZA_POS.has(dPos[1]) &&
      POSESIVOS_PRON[idioma][palabras[2]] !== undefined
    ) {
      demPos = DEMOSTRATIVOS[idioma][palabras[1]] ?? null;
      personaPos = POSESIVOS_PRON[idioma][palabras[2]];
      tokenPos = palabras[2];
      interrogativaPos = true;
    } else if (
      palabras.length === 2 &&
      idioma === "es" &&
      COPULA_POS.has(dPos[0]) &&
      POSESIVOS_PRON.es[palabras[1]] !== undefined
    ) {
      demPos = null;
      personaPos = POSESIVOS_PRON.es[palabras[1]];
      tokenPos = palabras[1];
    } else if (
      palabras.length === 1 &&
      POSESIVOS_PRON[idioma][palabras[0]] !== undefined
    ) {
      demPos = null;
      personaPos = POSESIVOS_PRON[idioma][palabras[0]];
      tokenPos = palabras[0];
    }
    if (personaPos !== undefined && tokenPos !== undefined) {
      return {
        modo: interrogativaPos ? "interrogativa" : "declarativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "pertenencia", clave: "pertenencia" },
        pertenencia: {
          persona: personaPos,
          dativo: true,
          ...(demPos ? { demostrativo: demPos } : {}),
        },
        ...(interrogativaPos ? { entonacion: true } : {}),
      };
    }
  }

  const esQue = new Set(idioma === "es" ? ["qué", "que"] : ["what", "whats"]);
  if (
    (palabras.length === 3 &&
      esQue.has(palabras[0]) &&
      SER[idioma].has(palabras[1]) &&
      DEMOSTRATIVOS[idioma][palabras[2]]) ||
    (palabras.length === 2 &&
      palabras[0] === "whats" &&
      DEMOSTRATIVOS[idioma][palabras[1]])
  ) {
    const objetivo = palabras[palabras.length - 1];
    return {
      modo: "interrogativa",
      polaridad: "afirmativa",
      sujeto: { demostrativo: DEMOSTRATIVOS[idioma][objetivo] },
      predicado: { tipo: "interrogativo", clave: "que" },
    };
  }

  if (
    (idioma === "en" &&
      palabras.length === 4 &&
      palabras[0] === "what" &&
      palabras[1] === "is" &&
      DEMOSTRATIVOS.en[palabras[2]] !== undefined &&
      palabras[3] === "for") ||
    (idioma === "es" &&
      palabras.length === 4 &&
      palabras[0] === "para" &&
      esQue.has(palabras[1]) &&
      SER.es.has(palabras[2]) &&
      DEMOSTRATIVOS.es[palabras[3]] !== undefined)
  ) {
    const objetivoPuy = idioma === "en" ? palabras[2] : palabras[3];
    return {
      modo: "interrogativa",
      polaridad: "afirmativa",
      sujeto: { demostrativo: DEMOSTRATIVOS[idioma][objetivoPuy] },
      predicado: { tipo: "interrogativo", clave: "nhapuy" },
    };
  }

  if (
    (idioma === "en" &&
      palabras.length === 2 &&
      palabras[0] === "what" &&
      palabras[1] === "about") ||
    (idioma === "es" &&
      ((palabras.length === 2 &&
        palabras[0] === "sobre" &&
        esQue.has(palabras[1])) ||
        (palabras.length === 3 &&
          palabras[0] === "acerca" &&
          palabras[1] === "de" &&
          esQue.has(palabras[2]))))
  ) {
    return {
      modo: "interrogativa",
      polaridad: "afirmativa",
      sujeto: null,
      predicado: { tipo: "interrogativo", clave: "nhapuy" },
    };
  }

  if (
    idioma === "es" &&
    palabras[0] === "de" &&
    ["qué", "que"].includes(palabras[1] ?? "") &&
    palabras.length === 3
  ) {
    const preteritoDeQue =
      preteritoSintetico(palabras[2]) ??
      preteritoSintetico(desacentuar(palabras[2]));
    if (preteritoDeQue) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: {
          persona:
            preteritoDeQue.persona === "1sg" ? "3sg" : preteritoDeQue.persona,
        },
        predicado: {
          tipo: "interrogativo",
          clave: "nhapuy-accion",
          estado: preteritoDeQue.verbo.clave,
        },
        tiempo: "pasado_hoy",
      };
    }
  }

  {
    const esPerteneceEn =
      idioma === "en" &&
      palabras.length > 3 &&
      palabras[0] === "where" &&
      (palabras[1] === "does" || palabras[1] === "do") &&
      palabras[palabras.length - 1] === "belong";
    const inicioPerteneceEs =
      idioma === "es"
        ? palabras[0] === "adónde" || palabras[0] === "adonde"
          ? 1
          : palabras[0] === "a" &&
              (palabras[1] === "dónde" || palabras[1] === "donde")
            ? 2
            : -1
        : -1;
    const esPerteneceEs =
      inicioPerteneceEs > 0 &&
      (palabras[inicioPerteneceEs] === "pertenece" ||
        palabras[inicioPerteneceEs] === "perteneces");
    if (esPerteneceEn || esPerteneceEs) {
      let npPertenece = esPerteneceEn
        ? palabras.slice(2, -1)
        : palabras.slice(inicioPerteneceEs + 1);
      const demPertenece = DEMOSTRATIVOS[idioma][npPertenece[0]];
      if (demPertenece !== undefined || ARTICULOS[idioma].has(npPertenece[0])) {
        npPertenece = npPertenece.slice(1);
      }
      if (npPertenece.length === 1) {
        const sustantivoPertenece = palabraDeTipo(
          npPertenece[0],
          idioma,
          "sustantivo"
        );
        if (sustantivoPertenece) {
          return {
            modo: "interrogativa",
            polaridad: "afirmativa",
            sujeto: {
              demostrativo: demPertenece ?? "este",
              sustantivo: sustantivoPertenece.clave,
            },
            predicado: { tipo: "interrogativo", clave: "wanhanguwuy" },
          };
        }
      }
    }
  }

  if (
    palabras.length >= 2 &&
    ((idioma === "en" &&
      (palabras[0] === "about" || palabras[0] === "of")) ||
      (idioma === "es" && palabras[0] === "sobre"))
  ) {
    const fragmentoPertenencia = pertenenciaDeNP(palabras.slice(1), idioma);
    if (fragmentoPertenencia) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "pertenencia", clave: "pertenencia" },
        pertenencia: fragmentoPertenencia,
      };
    }
  }
  if (
    idioma === "es" &&
    palabras.length >= 3 &&
    palabras[0] === "acerca" &&
    palabras[1] === "de"
  ) {
    const fragmentoPertenencia = pertenenciaDeNP(palabras.slice(2), "es");
    if (fragmentoPertenencia) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "pertenencia", clave: "pertenencia" },
        pertenencia: fragmentoPertenencia,
      };
    }
  }

  if (
    palabras.length >= 1 &&
    palabras.length <= 3 &&
    ((idioma === "en" &&
      palabras[0].endsWith("ing") &&
      palabras[0].length > 4) ||
      (idioma === "es" &&
        /(ando|endo)(se)?$/.test(desacentuar(palabras[0]))))
  ) {
    const verboGerundioFragmento = buscarVerboGerundio([palabras[0]], idioma);
    if (verboGerundioFragmento) {
      const restoFragmento = quitarArticulo(palabras.slice(1), idioma);
      const objetoFragmento =
        restoFragmento.length === 1
          ? palabraDeTipo(restoFragmento[0], idioma, "sustantivo")
          : null;
      if (palabras.length === 1 || objetoFragmento) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: null,
          predicado: { tipo: "lugar", clave: "lugar" },
          lugar: {
            verbo: verboGerundioFragmento.clave,
            ...(objetoFragmento ? { sustantivo: objetoFragmento.clave } : {}),
          },
        };
      }
    }
  }

  if (
    idioma === "en" &&
    (palabras[0] === "what" || palabras[0] === "who" || palabras[0] === "whom") &&
    (palabras[1] === "do" || palabras[1] === "does") &&
    palabras.length > 3
  ) {
    const finales = palabras[palabras.length - 1];
    if (ESTADOS_EN[finales] === "want") {
      const pronTokens = palabras.slice(2, -1).join(" ");
      const personaPregunta =
        PRONOMBRES_DOBLES.en[pronTokens] ?? PRONOMBRES.en[pronTokens];
      if (personaPregunta) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: { persona: personaPregunta },
          predicado: {
            tipo: "interrogativo",
            clave: palabras[0] === "what" ? "nhaku" : "yolku-quien",
            estado: "want",
          },
        };
      }
    }
  }

  if (
    idioma === "es" &&
    palabras[0] === "a" &&
    (palabras[1] === "quién" || palabras[1] === "quien") &&
    palabras.length > 2 &&
    ESTADOS_ES[palabras[2]]?.clave === "want"
  ) {
    const restoPron = palabras.slice(3).join(" ");
    const personaPregunta =
      restoPron.length === 0
        ? ESTADOS_ES[palabras[2]].persona
        : (PRONOMBRES_DOBLES.es[restoPron] ?? PRONOMBRES.es[restoPron]);
    if (personaPregunta) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: personaPregunta },
        predicado: {
          tipo: "interrogativo",
          clave: "yolku-quien",
          estado: "want",
        },
      };
    }
  }

  if (idioma === "en" && palabras[0] === "what" && palabras[1] === "will") {
    const medio = palabras.slice(2, -1);
    const personaPregunta =
      PRONOMBRES_DOBLES.en[medio.join(" ")] ?? PRONOMBRES.en[medio.join(" ")];
    if (personaPregunta && palabras[palabras.length - 1] === "do") {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: personaPregunta },
        predicado: { tipo: "interrogativo", clave: "nhaltjan" },
        tiempo: "futuro_hoy",
      };
    }
  }

  if (idioma === "es" && esQue.has(palabras[0])) {
    const HACER_FUTURO: Record<string, PersonaIR> = {
      haré: "1sg",
      hare: "1sg",
      harás: "2sg",
      haras: "2sg",
      hará: "3sg",
      hara: "3sg",
      haremos: "1pl_incl",
      haréis: "2pl",
      hareis: "2pl",
      harán: "3pl",
      haran: "3pl",
    };
    if (palabras.length === 2 && HACER_FUTURO[palabras[1]]) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: HACER_FUTURO[palabras[1]] },
        predicado: { tipo: "interrogativo", clave: "nhaltjan" },
        tiempo: "futuro_hoy",
      };
    }
    if (
      palabras.length === 4 &&
      FUTURO_AUX_ES[palabras[1]] &&
      palabras[2] === "a" &&
      palabras[3] === "hacer"
    ) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: FUTURO_AUX_ES[palabras[1]] },
        predicado: { tipo: "interrogativo", clave: "nhaltjan" },
        tiempo: "futuro_hoy",
      };
    }
    if (ESTADOS_ES[palabras[1]]?.clave === "want") {
      const restoPron = palabras.slice(2).join(" ");
      const personaPregunta =
        restoPron.length === 0
          ? ESTADOS_ES[palabras[1]].persona
          : (PRONOMBRES_DOBLES.es[restoPron] ?? PRONOMBRES.es[restoPron]);
      if (personaPregunta) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: { persona: personaPregunta },
          predicado: {
            tipo: "interrogativo",
            clave: "nhaku",
            estado: "want",
          },
        };
      }
    }
  }

  if (
    idioma === "en" &&
    palabras[0] === "whose" &&
    palabras.length === 4 &&
    SER.en.has(palabras[2]) &&
    DEMOSTRATIVOS.en[palabras[3]]
  ) {
    const sustantivo = palabraDeTipo(palabras[1], "en", "sustantivo");
    if (sustantivo) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: {
          demostrativo: DEMOSTRATIVOS.en[palabras[3]],
          sustantivo: sustantivo.clave,
        },
        predicado: { tipo: "interrogativo", clave: "yolku" },
      };
    }
  }

  if (
    idioma === "es" &&
    palabras[0] === "de" &&
    (palabras[1] === "quién" || palabras[1] === "quien") &&
    palabras.length === 5 &&
    SER.es.has(palabras[2])
  ) {
    const demExplicito = DEMOSTRATIVOS.es[palabras[3]];
    const demPregunta =
      demExplicito ?? (ARTICULOS.es.has(palabras[3]) ? "este" : undefined);
    const sustantivo = palabraDeTipo(palabras[4], "es", "sustantivo");
    if (demPregunta && sustantivo) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: {
          demostrativo: demPregunta,
          sustantivo: sustantivo.clave,
          articuloDefinido: demExplicito ? undefined : true,
        },
        predicado: { tipo: "interrogativo", clave: "yolku" },
      };
    }
  }

  const direccionExtraccion = extraerDireccion(palabras, idioma);
  let direccionExplicita: "bala" | "rali" | null = null;
  let direccionLexica: "bala" | "rali" | null = null;
  if (direccionExtraccion && direccionExtraccion.resto.length > 0) {
    direccionExplicita = direccionExtraccion.direccion;
    palabras = direccionExtraccion.resto;
  } else if (
    palabras.some((token, indice) => {
      if (!VERBOS_RALI[idioma].has(token)) return false;
      if (indice + 1 >= palabras.length) return true;
      const par = palabras.slice(indice, indice + 2);
      const solo =
        buscarVerbo([token], idioma) ?? buscarVerboGerundio([token], idioma);
      const conParticula =
        buscarVerbo(par, idioma) ?? buscarVerboGerundio(par, idioma);
      return !(
        conParticula &&
        (!solo || conParticula.clave !== solo.clave)
      );
    })
  ) {
    direccionLexica = "rali";
  }

  const pertenenciaExtraccion = extraerPertenencia(palabras, idioma);
  if (pertenenciaExtraccion) {
    pertenenciaPendiente = pertenenciaExtraccion.pertenencia;
    palabras = pertenenciaExtraccion.resto;
  }

  const vecesExtraccion = extraerVeces(palabras, idioma);
  if (vecesExtraccion) {
    vecesPendiente = vecesExtraccion.veces;
    palabras = vecesExtraccion.resto;
  }

  const origenExtraccion = extraerOrigen(palabras, idioma);
  if (origenExtraccion) {
    origenPendiente = origenExtraccion.origen;
    palabras = origenExtraccion.resto;
    if (palabras.length === 0 && !direccionExplicita) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "origen", clave: "origen" },
        origen: origenPendiente,
      };
    }
  }

  const propositoVerbalExtraccion = extraerPropositoVerbal(palabras, idioma);
  if (propositoVerbalExtraccion) {
    propositoPendiente = propositoVerbalExtraccion.proposito;
    palabras = propositoVerbalExtraccion.resto;
  }

  if (!propositoPendiente) {
    const propositoExtraccionTemprana = extraerProposito(palabras, idioma);
    if (propositoExtraccionTemprana) {
      propositoPendiente = propositoExtraccionTemprana.proposito;
      palabras = propositoExtraccionTemprana.resto;
    }
  }

  const instrumentoExtraccion = extraerInstrumento(palabras, idioma);
  if (instrumentoExtraccion) {
    if ("instrumento" in instrumentoExtraccion) {
      instrumentoPendiente = instrumentoExtraccion.instrumento;
    } else {
      comitativoPendiente = instrumentoExtraccion.comitativo;
    }
    palabras = instrumentoExtraccion.resto;
  }

  const perlativoExtraccion = extraerPerlativo(palabras, idioma);
  if (perlativoExtraccion) {
    perlativoPendiente = perlativoExtraccion.perlativo;
    palabras = perlativoExtraccion.resto;
  }

  if (palabras.length >= 3 && SER[idioma].has(palabras[1])) {
    const demSerAqui =
      idioma === "en"
        ? palabras[0] === "there"
          ? ("ese" as DemostrativoIR)
          : undefined
        : AQUI_ES[desacentuar(palabras[0])];
    if (demSerAqui === "ese") {
      const npAlli = quitarArticulo(palabras.slice(2), idioma);
      if (
        npAlli.length >= 1 &&
        npAlli.length <= 2 &&
        npAlli.every((token) => !VERBOS[idioma].get(token))
      ) {
        palabras = [
          ...palabras.slice(2),
          palabras[1],
          idioma === "en" ? "there" : "alli",
        ];
      }
    } else if (demSerAqui === "este" && idioma === "es") {
      palabras = ["esto", "es", ...palabras.slice(2)];
    }
  }

  const aquiExtraccion = extraerAqui(palabras, idioma);
  let aquiDestino: DemostrativoIR | null = null;
  let aquiLugar: DemostrativoIR | null = null;
  if (aquiExtraccion) {
    if (aquiExtraccion.tipo === "origen") {
      if (!origenPendiente) {
        origenPendiente = { demostrativo: aquiExtraccion.demostrativo };
      } else if (!origenPendiente.demostrativo) {
        origenPendiente.demostrativo = aquiExtraccion.demostrativo;
      }
    } else if (aquiExtraccion.tipo === "destino") {
      aquiDestino = aquiExtraccion.demostrativo;
    } else {
      aquiLugar = aquiExtraccion.demostrativo;
    }
    palabras = aquiExtraccion.resto;
  }

  const destinoExtraccion = extraerDestino(palabras, idioma);
  if (destinoExtraccion) {
    destinoPendiente = destinoExtraccion.destino;
    palabras = destinoExtraccion.resto;
  }
  if (aquiDestino) {
    if (!destinoPendiente) {
      destinoPendiente = { demostrativo: aquiDestino };
    } else if (!destinoPendiente.demostrativo) {
      destinoPendiente.demostrativo = aquiDestino;
    }
  }
  if (destinoPendiente || direccionExplicita) {
    const destinoBase: DestinoIR = destinoPendiente ?? {};
    const haciaPrimeraPersona =
      destinoBase.persona !== undefined &&
      destinoBase.persona.startsWith("1");
    const direccionFinal =
      direccionExplicita ??
      (destinoPendiente && (direccionLexica === "rali" || haciaPrimeraPersona)
        ? "rali"
        : null);
    destinoPendiente = {
      ...destinoBase,
      ...(direccionFinal ? { direccion: direccionFinal } : {}),
    };
    if (destinoPendiente && palabras.length === 0) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "destino", clave: "destino" },
        destino: destinoPendiente,
      };
    }
  }

  if (propositoPendiente?.verbo && palabras.length === 0) {
    return {
      modo: "declarativa",
      polaridad: "afirmativa",
      sujeto: null,
      predicado: { tipo: "proposito", clave: "proposito" },
      proposito: propositoPendiente,
    };
  }

  if (
    propositoPendiente?.verbo &&
    palabras.length >= 2 &&
    palabras.length <= 3 &&
    SER[idioma].has(palabras[palabras.length - 1])
  ) {
    const npProposito = palabras.slice(0, -1);
    const demProposito = DEMOSTRATIVOS[idioma][npProposito[0]];
    const restoProposito =
      demProposito !== undefined || ARTICULOS[idioma].has(npProposito[0])
        ? npProposito.slice(1)
        : npProposito;
    const sustantivoProposito =
      restoProposito.length === 1
        ? palabraDeTipo(restoProposito[0], idioma, "sustantivo")
        : null;
    if (
      (restoProposito.length === 0 && demProposito !== undefined) ||
      sustantivoProposito
    ) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: {
          ...(demProposito !== undefined
            ? { demostrativo: demProposito }
            : {}),
          ...(sustantivoProposito
            ? { sustantivo: sustantivoProposito.clave }
            : {}),
        },
        predicado: { tipo: "proposito", clave: "proposito" },
        proposito: propositoPendiente,
      };
    }
  }

  if (!propositoPendiente) {
    const propositoExtraccion = extraerProposito(palabras, idioma);
    if (propositoExtraccion) {
      propositoPendiente = propositoExtraccion.proposito;
      palabras = propositoExtraccion.resto;
    }
  }


  if (
    origenPendiente &&
    palabras.length >= 2 &&
    palabras.length <= 3 &&
    SER[idioma].has(palabras[palabras.length - 1])
  ) {
    const npSujeto = palabras.slice(0, -1);
    let demostrativoSujeto = DEMOSTRATIVOS[idioma][npSujeto[0]];
    let articuloSujeto = false;
    let restoSujeto = npSujeto;
    if (demostrativoSujeto) {
      restoSujeto = npSujeto.slice(1);
    } else if (ARTICULOS[idioma].has(npSujeto[0])) {
      articuloSujeto = true;
      demostrativoSujeto = "este";
      restoSujeto = npSujeto.slice(1);
    }
    if (demostrativoSujeto && restoSujeto.length === 1) {
      const sustantivoSujeto = palabraDeTipo(
        restoSujeto[0],
        idioma,
        "sustantivo"
      );
      if (sustantivoSujeto) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: {
            demostrativo: demostrativoSujeto,
            sustantivo: sustantivoSujeto.clave,
            ...(articuloSujeto ? { articuloDefinido: true } : {}),
          },
          predicado: { tipo: "origen", clave: "origen" },
          origen: origenPendiente,
        };
      }
    }
  }

  const lugarExtraccion = extraerLugar(palabras, idioma);
  if (lugarExtraccion) {
    lugarPendiente = lugarExtraccion.lugar;
    palabras = lugarExtraccion.resto;
  }
  if (aquiLugar) {
    if (!lugarPendiente) {
      lugarPendiente = { demostrativo: aquiLugar };
    } else if (!lugarPendiente.demostrativo) {
      lugarPendiente.demostrativo = aquiLugar;
    }
  }
  if (lugarExtraccion && lugarPendiente && palabras.length === 0) {
    return {
      modo: "declarativa",
      polaridad: "afirmativa",
      sujeto: null,
      predicado: { tipo: "lugar", clave: "lugar" },
      lugar: lugarPendiente,
    };
  }

  if (
    palabras.length >= 2 &&
    ((idioma === "en" && palabras[0] === "stop") ||
      (idioma === "es" &&
        ["deja", "dejen", "dejad", "dejemos"].includes(palabras[0]) &&
        palabras[1] === "de" &&
        palabras.length >= 3))
  ) {
    const restoProhibido =
      idioma === "en" ? palabras.slice(1) : palabras.slice(2);
    const verboProhibido =
      idioma === "en"
        ? buscarVerboGerundio(restoProhibido, "en")
        : buscarVerbo(restoProhibido, "es");
    if (verboProhibido) {
      return {
        modo: "imperativa",
        polaridad: "negativa",
        sujeto: null,
        predicado: { tipo: "verbo", clave: verboProhibido.clave },
        prohibitivoMiriw: true,
      };
    }
  }
  if (idioma === "en" && palabras[0] === "lets" && palabras.length > 1) {
    const separadoLets = separarObjeto(palabras.slice(1), "en", (t) =>
      buscarVerbo(t, "en")
    );
    if (separadoLets) {
      const fraseLets = fraseVerbal(
        "1dual_incl",
        separadoLets.verbo,
        "continuo",
        "afirmativa"
      );
      fraseLets.inminente = true;
      if (
        separadoLets.objeto &&
        Object.keys(separadoLets.objeto).length > 0
      ) {
        fraseLets.objeto = separadoLets.objeto;
      }
      return fraseLets;
    }
  }
  if (
    idioma === "en" &&
    palabras[0] === "shall" &&
    PRONOMBRES.en[palabras[1]] !== undefined &&
    palabras.length > 2 &&
    palabras.length <= 4
  ) {
    const separadoShall = separarObjeto(palabras.slice(2), "en", (t) =>
      buscarVerbo(t, "en")
    );
    if (separadoShall) {
      const fraseShall = fraseVerbal(
        PRONOMBRES.en[palabras[1]],
        separadoShall.verbo,
        "continuo",
        "afirmativa"
      );
      fraseShall.modo = "interrogativa";
      fraseShall.inminente = true;
      if (
        separadoShall.objeto &&
        Object.keys(separadoShall.objeto).length > 0
      ) {
        fraseShall.objeto = separadoShall.objeto;
      }
      return fraseShall;
    }
  }
  if (
    idioma === "en" &&
    ["should", "might", "must"].includes(palabras[0]) &&
    PRONOMBRES.en[palabras[1]] !== undefined &&
    palabras.length > 2 &&
    palabras.length <= 5
  ) {
    const separadoModalPregunta = separarObjeto(palabras.slice(2), "en", (t) =>
      buscarVerbo(t, "en")
    );
    if (separadoModalPregunta) {
      const fraseModalPregunta = fraseVerbal(
        PRONOMBRES.en[palabras[1]],
        separadoModalPregunta.verbo,
        "continuo",
        "afirmativa"
      );
      fraseModalPregunta.modo = "interrogativa";
      fraseModalPregunta.modal =
        palabras[0] === "might"
          ? "might"
          : palabras[0] === "must"
            ? "must"
            : "should";
      if (
        separadoModalPregunta.objeto &&
        Object.keys(separadoModalPregunta.objeto).length > 0
      ) {
        fraseModalPregunta.objeto = separadoModalPregunta.objeto;
      }
      return fraseModalPregunta;
    }
  }
  if (idioma === "es" && palabras.length >= 1) {
    const verboNosotros = subjuntivoNosotros(palabras[0]);
    if (verboNosotros) {
      const objetoNosotros =
        palabras.length > 1 ? analizarObjeto(palabras.slice(1), "es") : null;
      if (palabras.length === 1 || objetoNosotros) {
        const fraseNosotros = fraseVerbal(
          "1dual_incl",
          verboNosotros,
          "continuo",
          "afirmativa"
        );
        fraseNosotros.inminente = true;
        if (objetoNosotros && Object.keys(objetoNosotros).length > 0) {
          fraseNosotros.objeto = objetoNosotros;
        }
        return fraseNosotros;
      }
    }
  }

  const comitativoExtraccion = extraerComitativo(palabras, idioma);
  if (comitativoExtraccion) {
    comitativoPendiente = comitativoExtraccion.comitativo;
    palabras = comitativoExtraccion.resto;
    if (palabras.length === 0) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "comitativo", clave: "comitativo" },
        comitativo: comitativoPendiente,
      };
    }
  }

  const extraccion = extraerAdverbio(palabras, idioma);
  const adverbio = extraccion.adverbio;
  palabras = extraccion.resto;
  if (palabras.length === 0) {
    if (adverbio) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "lugar", clave: "lugar" },
        lugar: { adverbio },
      };
    }
    return null;
  }

  const tiempoPasado: TiempoIR =
    adverbio === "yesterday" ? "pasado_ayer" : "pasado_hoy";
  const marcarPasado = (frase: FraseIR): FraseIR => {
    if (adverbio === "today") frase.tiempoConfirmado = true;
    return frase;
  };

  const armarVerbal = (
    verbo: VerboVocabulario,
    tiempo: TiempoIR,
    aspecto: "continuo" | undefined,
    objeto: ObjetoIR | null
  ): FraseIR => ({
    modo: "declarativa",
    polaridad: "afirmativa",
    sujeto: null,
    predicado: { tipo: "verbo", clave: verbo.clave },
    tiempo,
    adverbio,
    ...(aspecto ? { aspecto } : {}),
    ...(objeto && Object.keys(objeto).length > 0 ? { objeto } : {}),
    ...(lugarPendiente ? { lugar: lugarPendiente } : {}),
    ...(comitativoPendiente ? { comitativo: comitativoPendiente } : {}),
    ...(destinoPendiente ? { destino: destinoPendiente } : {}),
    ...(origenPendiente ? { origen: origenPendiente } : {}),
    ...(propositoPendiente ? { proposito: propositoPendiente } : {}),
    ...(objetoIndirectoPendiente
      ? { objetoIndirecto: objetoIndirectoPendiente }
      : {}),
    ...(instrumentoPendiente ? { instrumento: instrumentoPendiente } : {}),
    ...(pertenenciaPendiente ? { pertenencia: pertenenciaPendiente } : {}),
    ...(perlativoPendiente ? { perlativo: perlativoPendiente } : {}),
    ...(vecesPendiente ? { veces: vecesPendiente } : {}),
  });

  const frasePostura = (sujeto: FraseIR["sujeto"]): FraseIR => ({
    modo: "declarativa",
    polaridad: "afirmativa",
    sujeto,
    predicado: { tipo: "verbo", clave: "sit" },
    tiempo: "continuo",
    ...(lugarPendiente ? { lugar: lugarPendiente } : {}),
    ...(comitativoPendiente ? { comitativo: comitativoPendiente } : {}),
    lugarAntesVerbo: true,
    esSerLugar: true,
  });

  const analizarPredicadoVerbal = (resto: string[]): FraseIR | null => {
    if (resto.length === 0) return null;
    if (
      resto.length === 1 &&
      SER[idioma].has(resto[0]) &&
      (lugarPendiente || comitativoPendiente)
    ) {
      return frasePostura(null);
    }
    if (
      idioma === "en" &&
      resto[0] === "did" &&
      resto[1] === "not" &&
      resto.length > 2
    ) {
      const negadoSeparado = separarObjeto(resto.slice(2), "en", (t) =>
        buscarVerbo(t, "en")
      );
      if (negadoSeparado) {
        const fraseNegada = marcarPasado(
          armarVerbal(negadoSeparado.verbo, tiempoPasado, undefined, negadoSeparado.objeto)
        );
        fraseNegada.polaridad = "negativa";
        return fraseNegada;
      }
    }
    {
      const CESAR_EN: Record<string, string> = {
        stopped: "cease",
        ceased: "cease",
        finished: "finish",
      };
      const claveCesar =
        idioma === "en"
          ? (CESAR_EN[resto[0]] ?? null)
          : resto[1] === "de" && resto.length > 2
            ? desacentuar(resto[0]) === "dejo"
              ? "cease"
              : ["termino", "acabo"].includes(desacentuar(resto[0]))
                ? "finish"
                : null
            : null;
      if (claveCesar && resto.length > 1) {
        const restoCesar = idioma === "en" ? resto.slice(1) : resto.slice(2);
        const separadoCesar = separarObjeto(restoCesar, idioma, (t) =>
          idioma === "en"
            ? buscarVerboGerundio(t, "en")
            : buscarVerbo(t, "es")
        );
        if (separadoCesar) {
          const verboCesar = VOCAB.verbos.find(
            (candidato) => candidato.clave === claveCesar
          );
          if (verboCesar) {
            const fraseCesar = marcarPasado(
              armarVerbal(verboCesar, tiempoPasado, undefined, null)
            );
            fraseCesar.accionNuru = separadoCesar.verbo.clave;
            if (separadoCesar.objeto?.sustantivo) {
              fraseCesar.objetoNuru = separadoCesar.objeto.sustantivo;
            }
            return fraseCesar;
          }
        }
      }
    }
    if (
      idioma === "en" &&
      resto[0] === "used" &&
      resto[1] === "to" &&
      resto.length > 2
    ) {
      const usoSeparado = separarObjeto(resto.slice(2), "en", (t) =>
        buscarVerbo(t, "en")
      );
      if (usoSeparado) {
        const fraseUso = armarVerbal(
          usoSeparado.verbo,
          "pasado_ayer",
          undefined,
          usoSeparado.objeto
        );
        fraseUso.habitual = {};
        fraseUso.tiempoConfirmado = true;
        return fraseUso;
      }
    }
    if (
      idioma === "en" &&
      ["might", "should", "would", "must"].includes(resto[0]) &&
      resto.length > 1
    ) {
      const negativaModal = resto[1] === "not";
      let restoModal = resto.slice(negativaModal ? 2 : 1);
      const conHave = restoModal[0] === "have";
      if (conHave) restoModal = restoModal.slice(1);
      if (
        (restoModal[0] === "talk" || restoModal[0] === "speak") &&
        restoModal[1] === "to"
      ) {
        restoModal = [restoModal[0], ...restoModal.slice(2)];
      }
      const separadoModal = separarObjeto(restoModal, "en", (t) =>
        conHave ? verboParticipioEn(t) : buscarVerbo(t, "en")
      );
      if (separadoModal) {
        const fraseModal = armarVerbal(
          separadoModal.verbo,
          conHave ? "pasado_ayer" : "continuo",
          undefined,
          separadoModal.objeto
        );
        fraseModal.modal =
          resto[0] === "might"
            ? "might"
            : resto[0] === "must"
              ? "must"
              : "should";
        if (negativaModal) fraseModal.polaridad = "negativa";
        if (conHave) fraseModal.tiempoConfirmado = true;
        return fraseModal;
      }
    }
    if (
      idioma === "es" &&
      SOLER_ES[desacentuar(resto[0])] !== undefined &&
      resto.length > 1
    ) {
      const soliaSeparado = separarObjeto(resto.slice(1), "es", (t) =>
        buscarVerbo(t, "es")
      );
      if (soliaSeparado) {
        const fraseSolia = armarVerbal(
          soliaSeparado.verbo,
          "pasado_ayer",
          undefined,
          soliaSeparado.objeto
        );
        fraseSolia.habitual = {};
        fraseSolia.tiempoConfirmado = true;
        return fraseSolia;
      }
    }
    if (
      idioma === "en" &&
      (resto[0] === "was" || resto[0] === "were") &&
      resto[1] === "not" &&
      resto.length > 2
    ) {
      const negadoSeparado = separarObjeto(resto.slice(2), "en", (t) =>
        buscarVerboGerundio(t, "en")
      );
      if (negadoSeparado) {
        const fraseNegada = marcarPasado(
          armarVerbal(
            negadoSeparado.verbo,
            tiempoPasado,
            "continuo",
            negadoSeparado.objeto
          )
        );
        fraseNegada.polaridad = "negativa";
        return fraseNegada;
      }
    }
    if (
      idioma === "en" &&
      ["is", "are", "am"].includes(resto[0]) &&
      resto[1] === "not" &&
      resto.length > 2
    ) {
      const negadoContinuo = separarObjeto(resto.slice(2), "en", (t) =>
        buscarVerboGerundio(t, "en")
      );
      if (negadoContinuo) {
        const fraseNegada = armarVerbal(
          negadoContinuo.verbo,
          "continuo",
          undefined,
          negadoContinuo.objeto
        );
        fraseNegada.polaridad = "negativa";
        return fraseNegada;
      }
      if (resto.length === 3 && PARTICIPIOS_ESTATIVOS_EN[resto[2]]) {
        const entradaEstativaNegada = VOCAB.verbos.find(
          (candidato) => candidato.clave === PARTICIPIOS_ESTATIVOS_EN[resto[2]]
        );
        if (entradaEstativaNegada) {
          const fraseNegada = armarVerbal(
            entradaEstativaNegada,
            "continuo",
            undefined,
            null
          );
          fraseNegada.polaridad = "negativa";
          return fraseNegada;
        }
      }
    }
    if (
      idioma === "en" &&
      (resto[0] === "was" || resto[0] === "were") &&
      resto.length >= 2 &&
      PARTICIPIOS_ESTATIVOS_EN[resto[1]] !== undefined &&
      (resto.length === 2 || resto[2] === "of")
    ) {
      const entradaEstativa = VOCAB.verbos.find(
        (candidato) => candidato.clave === PARTICIPIOS_ESTATIVOS_EN[resto[1]]
      );
      const objetoEstativo =
        resto.length > 2 ? objetoDeNP(resto.slice(3), "en") : null;
      if (entradaEstativa && (resto.length === 2 || objetoEstativo)) {
        const fraseEstativa = marcarPasado(
          armarVerbal(entradaEstativa, tiempoPasado, undefined, objetoEstativo)
        );
        return fraseEstativa;
      }
    }
    if (idioma === "es" && resto[0] === "no" && resto.length > 1) {
      let restoNegado = resto.slice(1);
      let cliticoNegado: ObjetoIR | null = null;
      if (restoNegado.length > 1 && CLITICOS_ES.has(restoNegado[0])) {
        if (restoNegado[0] !== "se") {
          cliticoNegado = objetoDeCliticoEs(restoNegado[0]);
        }
        restoNegado = restoNegado.slice(1);
      }
      const preteritoNegado = preteritoSintetico(restoNegado[0]);
      const futuroNegado = futuroSintetico(restoNegado[0]);
      const encontradoNegado = preteritoNegado ?? futuroNegado;
      if (encontradoNegado) {
        const objetoNegado =
          restoNegado.length > 1
            ? analizarObjeto(restoNegado.slice(1), "es")
            : cliticoNegado;
        const fraseNegada = armarVerbal(
          encontradoNegado.verbo,
          preteritoNegado ? tiempoPasado : tiempoFuturo(adverbio),
          undefined,
          objetoNegado
        );
        fraseNegada.polaridad = "negativa";
        return preteritoNegado ? marcarPasado(fraseNegada) : fraseNegada;
      }
      const estarNegadoPasado = ESTAR_PROGRESIVO_PASADO_ES[restoNegado[0]];
      const estarNegadoPresente = PERSONA_SER_ES[restoNegado[0]];
      if (
        (estarNegadoPasado || estarNegadoPresente) &&
        restoNegado.length > 1
      ) {
        const gerundioNegadoEs = separarObjeto(restoNegado.slice(1), "es", (t) =>
          buscarVerboGerundio(t, "es")
        );
        if (gerundioNegadoEs) {
          const fraseNegada = estarNegadoPasado
            ? marcarPasado(
                armarVerbal(
                  gerundioNegadoEs.verbo,
                  tiempoPasado,
                  "continuo",
                  gerundioNegadoEs.objeto
                )
              )
            : armarVerbal(
                gerundioNegadoEs.verbo,
                "continuo",
                undefined,
                gerundioNegadoEs.objeto
              );
          fraseNegada.polaridad = "negativa";
          return fraseNegada;
        }
      }
    }
    if (idioma === "en") {
      if ((resto[0] === "is" || resto[0] === "are") && resto.length > 1) {
        const g = separarObjeto(resto.slice(1), "en", (t) =>
          buscarVerboGerundio(t, "en")
        );
        if (g) return armarVerbal(g.verbo, "continuo", undefined, g.objeto);
      }
      if ((resto[0] === "was" || resto[0] === "were") && resto.length > 1) {
        const g = separarObjeto(resto.slice(1), "en", (t) =>
          buscarVerboGerundio(t, "en")
        );
        if (g) {
          return marcarPasado(
            armarVerbal(g.verbo, tiempoPasado, "continuo", g.objeto)
          );
        }
      }
      if ((resto[0] === "will" || resto[0] === "shall") && resto.length > 1) {
        const s = separarObjeto(resto.slice(1), "en", (t) =>
          buscarVerbo(t, "en")
        );
        if (s) {
          return armarVerbal(s.verbo, tiempoFuturo(adverbio), undefined, s.objeto);
        }
      }
      if ((resto[0] === "became" || resto[0] === "got") && resto.length === 2) {
        const adjetivoDevenir = palabraDeTipo(resto[1], "en", "adjetivo");
        if (adjetivoDevenir) {
          return marcarPasado(
            armarVerbal(
              verboDevenirAdjetivo(adjetivoDevenir.clave),
              tiempoPasado,
              undefined,
              null
            )
          );
        }
      }
      if ((resto[0] === "made" || resto[0] === "let") && resto.length >= 3) {
        for (let corte = 1; corte < resto.length - 1; corte++) {
          const finalCausado = resto.slice(corte + 1);
          const adjetivoHacer =
            finalCausado.length === 1
              ? palabraDeTipo(finalCausado[0], "en", "adjetivo")
              : null;
          const verboCausado =
            buscarVerbo(finalCausado, "en") ??
            (adjetivoHacer ? verboHacerAdjetivo(adjetivoHacer.clave) : null);
          if (!verboCausado) continue;
          const npCausadoEn = resto.slice(1, corte + 1);
          const esItCausado =
            npCausadoEn.length === 1 && npCausadoEn[0] === "it";
          const objetoCausado = esItCausado
            ? null
            : objetoDeNP(npCausadoEn, "en");
          if (!esItCausado && !objetoCausado) continue;
          return marcarPasado(
            armarVerbal(verboCausado, tiempoPasado, undefined, objetoCausado)
          );
        }
      }
      const p = separarObjeto(resto, "en", (t) => buscarVerboPasadoEn(t));
      if (p) {
        return marcarPasado(
          armarVerbal(p.verbo, tiempoPasado, undefined, p.objeto)
        );
      }
      const presenteSeparado = separarObjeto(resto, "en", (t) =>
        buscarVerboPresenteEn(t)
      );
      if (presenteSeparado) {
        return armarVerbal(
          presenteSeparado.verbo,
          "continuo",
          undefined,
          presenteSeparado.objeto
        );
      }
      if (resto.length >= 3 && resto[1] === "to") {
        const verboHablaPasado = buscarVerboPasadoEn([resto[0]]);
        const verboHablaPresente = buscarVerboPresenteEn([resto[0]]);
        const verboHabla = verboHablaPasado ?? verboHablaPresente;
        if (verboHabla && verboHabla.lema === "waŋa") {
          const objetoHabla = objetoDeNP(resto.slice(2), "en");
          const personaHablaOk =
            objetoHabla &&
            (!objetoHabla.sustantivo ||
              palabraDeTipo(
                quitarArticulo(resto.slice(2), "en").join(" "),
                "en",
                "sustantivo"
              )?.persona === true);
          if (objetoHabla && personaHablaOk) {
            return verboHablaPasado
              ? marcarPasado(
                  armarVerbal(verboHabla, tiempoPasado, undefined, objetoHabla)
                )
              : armarVerbal(verboHabla, "continuo", undefined, objetoHabla);
          }
        }
      }
      const verboDitransitivo = buscarVerboPasadoEn([resto[0]]);
      if (
        verboDitransitivo &&
        verboDitransitivo.transporte === true &&
        resto.length >= 3
      ) {
        const npCompleto = resto.slice(1);
        for (let corte = 1; corte < npCompleto.length; corte++) {
          const npPersona = quitarArticulo(npCompleto.slice(0, corte), "en");
          if (npPersona.length !== 1) continue;
          const destinoNP = objetoDeNP(npPersona, "en");
          if (!destinoNP) continue;
          if (destinoNP.sustantivo) {
            const palabraPersona = palabraDeTipo(
              npPersona[0],
              "en",
              "sustantivo"
            );
            if (!palabraPersona?.persona) continue;
          }
          const objetoCosa = analizarObjeto(npCompleto.slice(corte), "en");
          if (!objetoCosa) continue;
          const fraseDitransitiva = marcarPasado(
            armarVerbal(verboDitransitivo, tiempoPasado, undefined, objetoCosa)
          );
          fraseDitransitiva.destino = { ...destinoNP, paraQuedarse: true };
          return fraseDitransitiva;
        }
      }
      return null;
    }
    let tokens = [...resto];
    let clitico: string | null = null;
    if (tokens.length > 1 && CLITICOS_ES.has(tokens[0])) {
      clitico = tokens[0];
      tokens = tokens.slice(1);
    }
    if (tokens.length === 0 || tokens[0] === "no") return null;
    const pret = preteritoSintetico(tokens[0]);
    const fut = futuroSintetico(tokens[0]);
    if (pret || fut) {
      const objeto =
        tokens.length > 1 ? analizarObjeto(tokens.slice(1), "es") : null;
      if (tokens.length === 1 || objeto) {
        const frase = fut
          ? armarVerbal(fut.verbo, tiempoFuturo(adverbio), undefined, objeto)
          : marcarPasado(
              armarVerbal(pret!.verbo, tiempoPasado, undefined, objeto)
            );
        return conCliticoObjeto(frase, clitico);
      }
    }
    const estarPasado = ESTAR_PROGRESIVO_PASADO_ES[tokens[0]];
    const estarFuturo = ESTAR_PROGRESIVO_FUTURO_ES[tokens[0]];
    const estarPresente = PERSONA_SER_ES[tokens[0]];
    if ((estarPasado || estarFuturo || estarPresente) && tokens.length > 1) {
      const g = separarObjeto(tokens.slice(1), "es", (t) =>
        buscarVerboGerundio(t, "es")
      );
      if (g) {
        const frase = estarPasado
          ? marcarPasado(
              armarVerbal(g.verbo, tiempoPasado, "continuo", g.objeto)
            )
          : estarFuturo
            ? armarVerbal(g.verbo, tiempoFuturo(adverbio), "continuo", g.objeto)
            : armarVerbal(g.verbo, "continuo", undefined, g.objeto);
        return conCliticoObjeto(frase, clitico);
      }
    }
    const auxVerbal = FUTURO_AUX_ES[tokens[0]];
    if (auxVerbal && tokens[1] === "a" && tokens.length > 2) {
      const s = separarObjeto(tokens.slice(2), "es", (t) =>
        buscarVerbo(t, "es")
      );
      if (s) {
        return conCliticoObjeto(
          armarVerbal(s.verbo, tiempoFuturo(adverbio), undefined, s.objeto),
          clitico
        );
      }
    }
    const DEVENIR_PASADO_ES = new Set([
      "puso",
      "pusieron",
      "puse",
      "pusiste",
      "volvio",
      "volvieron",
      "volvi",
      "volviste",
    ]);
    if (
      clitico === "se" &&
      tokens.length === 2 &&
      DEVENIR_PASADO_ES.has(desacentuar(tokens[0]))
    ) {
      const adjetivoDevenir = palabraDeTipo(tokens[1], "es", "adjetivo");
      if (adjetivoDevenir) {
        return marcarPasado(
          armarVerbal(
            verboDevenirAdjetivo(adjetivoDevenir.clave),
            tiempoPasado,
            undefined,
            null
          )
        );
      }
    }
    if (
      CAUSATIVOS_PASADO_ES.has(desacentuar(tokens[0])) &&
      tokens.length >= 2 &&
      !/(ar|er|ir)(se)?$/.test(desacentuar(tokens[1]))
    ) {
      const adjetivoHacerEs = palabraDeTipo(tokens[1], "es", "adjetivo");
      if (adjetivoHacerEs) {
        const restoCausadoAdj = tokens.slice(2);
        const npCausadoAdj =
          restoCausadoAdj[0] === "a"
            ? restoCausadoAdj.slice(1)
            : restoCausadoAdj;
        const objetoCausadoAdj =
          npCausadoAdj.length > 0 ? objetoDeNP(npCausadoAdj, "es") : null;
        if (restoCausadoAdj.length === 0 || objetoCausadoAdj) {
          const fraseCausadaAdj = conCliticoObjeto(
            marcarPasado(
              armarVerbal(
                verboHacerAdjetivo(adjetivoHacerEs.clave),
                tiempoPasado,
                undefined,
                objetoCausadoAdj
              )
            ),
            clitico
          );
          if (
            fraseCausadaAdj.objeto?.persona &&
            fraseCausadaAdj.objeto.personaOpcional
          ) {
            fraseCausadaAdj.objeto = { persona: fraseCausadaAdj.objeto.persona };
          }
          return fraseCausadaAdj;
        }
      }
    }
    if (
      CAUSATIVOS_PASADO_ES.has(desacentuar(tokens[0])) &&
      tokens.length >= 2 &&
      /(ar|er|ir)(se)?$/.test(desacentuar(tokens[1]))
    ) {
      const verboCausado =
        buscarVerbo([tokens[1]], "es") ??
        buscarVerbo([desacentuar(tokens[1])], "es");
      if (verboCausado) {
        const restoCausado = tokens.slice(2);
        const npCausado =
          restoCausado[0] === "a" ? restoCausado.slice(1) : restoCausado;
        let objetoCausado =
          npCausado.length > 0 ? objetoDeNP(npCausado, "es") : null;
        if (
          !objetoCausado &&
          restoCausado.length === 0 &&
          destinoPendiente &&
          (destinoPendiente.persona !== undefined ||
            destinoPendiente.nombre !== undefined ||
            destinoPendiente.sustantivo !== undefined)
        ) {
          objetoCausado = {
            ...(destinoPendiente.persona
              ? { persona: destinoPendiente.persona }
              : {}),
            ...(destinoPendiente.nombre
              ? { nombre: destinoPendiente.nombre }
              : {}),
            ...(destinoPendiente.sustantivo
              ? { sustantivo: destinoPendiente.sustantivo }
              : {}),
          };
          destinoPendiente = null;
        }
        if (restoCausado.length === 0 || objetoCausado) {
          const fraseCausada = conCliticoObjeto(
            marcarPasado(
              armarVerbal(verboCausado, tiempoPasado, undefined, objetoCausado)
            ),
            clitico
          );
          if (
            fraseCausada.objeto?.persona &&
            fraseCausada.objeto.personaOpcional
          ) {
            fraseCausada.objeto = { persona: fraseCausada.objeto.persona };
          }
          return fraseCausada;
        }
      }
    }
    const presenteEsSeparado = separarObjeto(tokens, "es", (t) =>
      buscarVerboPresenteEs(t)
    );
    if (presenteEsSeparado) {
      return conCliticoObjeto(
        armarVerbal(
          presenteEsSeparado.verbo,
          "continuo",
          undefined,
          presenteEsSeparado.objeto
        ),
        clitico
      );
    }
    return null;
  };

  if (
    idioma === "en" &&
    (palabras[0] === "who" || palabras[0] === "whom") &&
    palabras.length > 1 &&
    palabras[1] !== "do" &&
    palabras[1] !== "does"
  ) {
    const verbalQuien = analizarPredicadoVerbal(palabras.slice(1));
    if (verbalQuien && verbalQuien.predicado.tipo === "verbo") {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: {
          tipo: "interrogativo",
          clave: "yolthu",
          estado: verbalQuien.predicado.clave,
        },
        tiempo: verbalQuien.tiempo,
        objeto: verbalQuien.objeto,
        adverbio,
      };
    }
  }
  if (
    idioma === "es" &&
    (palabras[0] === "quién" || palabras[0] === "quien") &&
    palabras.length > 1
  ) {
    const verbalQuien = analizarPredicadoVerbal(palabras.slice(1));
    if (verbalQuien && verbalQuien.predicado.tipo === "verbo") {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: {
          tipo: "interrogativo",
          clave: "yolthu",
          estado: verbalQuien.predicado.clave,
        },
        tiempo: verbalQuien.tiempo,
        objeto: verbalQuien.objeto,
        adverbio,
      };
    }
  }

  if (idioma === "es" && palabras.length > 1) {
    const bloqueos = new Set(["a", "de", "y", "e"]);
    const dobleFinal = palabras.slice(-2).join(" ");
    const INTERROGATIVAS_INICIO = new Set([
      "dónde",
      "donde",
      "quién",
      "quien",
      "qué",
      "que",
      "con",
      "a",
      "adónde",
      "adonde",
      "hacia",
      "para",
      "en",
      "sobre",
      "de",
      "desde",
    ]);
    const sujetoInicial =
      PRONOMBRES.es[palabras[0]] !== undefined ||
      PRONOMBRES_DOBLES.es[palabras.slice(0, 2).join(" ")] !== undefined ||
      INTERROGATIVAS_INICIO.has(palabras[0]);
    if (
      !sujetoInicial &&
      palabras.length > 2 &&
      PRONOMBRES_DOBLES.es[dobleFinal] !== undefined &&
      !bloqueos.has(palabras[palabras.length - 3])
    ) {
      palabras = [...palabras.slice(-2), ...palabras.slice(0, -2)];
    } else if (
      !sujetoInicial &&
      PRONOMBRES.es[palabras[palabras.length - 1]] !== undefined &&
      !bloqueos.has(palabras[palabras.length - 2])
    ) {
      palabras = [
        palabras[palabras.length - 1],
        ...palabras.slice(0, -1),
      ];
    }
  }

  if (
    (idioma === "en" &&
      (palabras[0] === "whom" || palabras[0] === "who") &&
      (palabras[1] === "is" || palabras[1] === "are") &&
      palabras[palabras.length - 1] === "with") ||
    (idioma === "es" &&
      palabras[0] === "con" &&
      (palabras[1] === "quién" || palabras[1] === "quien") &&
      palabras.length > 2 &&
      SER.es.has(palabras[2]))
  ) {
    const restoQuien =
      idioma === "en" ? palabras.slice(2, -1) : palabras.slice(3);
    let sujetoQuien: FraseIR["sujeto"] = null;
    if (restoQuien.length === 0) {
      sujetoQuien = { persona: "3sg" };
    } else if (restoQuien.length === 1) {
      const pronQuien = PRONOMBRES[idioma][restoQuien[0]];
      if (pronQuien) sujetoQuien = { persona: pronQuien };
      else {
        const sustQuien = palabraDeTipo(restoQuien[0], idioma, "sustantivo");
        if (sustQuien) sujetoQuien = { sustantivo: sustQuien.clave };
        else if (!VERBOS[idioma].get(restoQuien[0])) {
          sujetoQuien = {
            nombre:
              restoQuien[0].charAt(0).toUpperCase() + restoQuien[0].slice(1),
          };
        }
      }
    }
    if (sujetoQuien) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: sujetoQuien,
        predicado: { tipo: "interrogativo", clave: "yolkala" },
      };
    }
  }

  {
    const DONDE_ES = new Set(["dónde", "donde"]);
    const QUIEN_ES = new Set(["quién", "quien"]);
    const QUE_ES = new Set(["qué", "que"]);
    const preguntaProposito =
      idioma === "en"
        ? (palabras[0] === "what" ||
            palabras[0] === "whom" ||
            palabras[0] === "who") &&
          palabras[palabras.length - 1] === "for"
        : palabras[0] === "para" &&
          (QUE_ES.has(palabras[1]) || QUIEN_ES.has(palabras[1]));
    if (preguntaProposito) {
      const claveProposito =
        idioma === "en"
          ? palabras[0] === "what"
            ? "nhaku-accion"
            : "yolku-accion"
          : QUE_ES.has(palabras[1])
            ? "nhaku-accion"
            : "yolku-accion";
      const nucleoTokens =
        idioma === "en" ? palabras.slice(1, -1) : palabras.slice(2);
      const nucleo = analizarNucleoPregunta(nucleoTokens, idioma);
      if (nucleo) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: nucleo.sujeto,
          predicado: {
            tipo: "interrogativo",
            clave: claveProposito,
            estado: nucleo.clave,
          },
          tiempo: nucleo.tiempo,
          ...(nucleo.objeto ? { objeto: nucleo.objeto } : {}),
          ...(nucleo.rali ? { raliVerbo: true } : {}),
          ...(nucleo.personaAlternativa
            ? { personaAlternativa: nucleo.personaAlternativa }
            : {}),
        };
      }
    }

    const preguntaInstrumento =
      idioma === "en"
        ? (palabras[0] === "with" && palabras[1] === "what") ||
          palabras[0] === "how"
        : (palabras[0] === "con" && QUE_ES.has(palabras[1])) ||
          palabras[0] === "cómo";
    if (preguntaInstrumento) {
      const nucleoTokens =
        (idioma === "en" && palabras[0] === "how") ||
        (idioma === "es" && palabras[0] === "cómo")
          ? palabras.slice(1)
          : palabras.slice(2);
      const nucleo = analizarNucleoPregunta(nucleoTokens, idioma);
      if (nucleo) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: nucleo.sujeto,
          predicado: {
            tipo: "interrogativo",
            clave: "nhaliy",
            estado: nucleo.clave,
          },
          tiempo: nucleo.tiempo,
          ...(nucleo.objeto ? { objeto: nucleo.objeto } : {}),
          ...(nucleo.personaAlternativa
            ? { personaAlternativa: nucleo.personaAlternativa }
            : {}),
        };
      }
    }

    const preguntaPorQuien =
      idioma === "en"
        ? palabras[0] === "by" &&
          (palabras[1] === "whom" || palabras[1] === "who")
        : ["con", "por"].includes(palabras[0]) &&
          QUIEN_ES.has(palabras[1]);
    if (preguntaPorQuien) {
      const nucleo = analizarNucleoPregunta(palabras.slice(2), idioma);
      if (nucleo) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: nucleo.sujeto,
          predicado: {
            tipo: "interrogativo",
            clave: "yolkala",
            estado: nucleo.clave,
          },
          tiempo: nucleo.tiempo,
          ...(nucleo.objeto ? { objeto: nucleo.objeto } : {}),
          ...(nucleo.personaAlternativa
            ? { personaAlternativa: nucleo.personaAlternativa }
            : {}),
        };
      }
    }

    const preguntaOrigen =
      idioma === "en"
        ? (palabras[0] === "where" || palabras[0] === "what") &&
          palabras[palabras.length - 1] === "from"
        : ["de", "desde"].includes(palabras[0]) &&
          (DONDE_ES.has(palabras[1]) || QUE_ES.has(palabras[1]));
    if (preguntaOrigen) {
      const claveOrigen =
        idioma === "en"
          ? palabras[0] === "where"
            ? "wanhanguru"
            : "nhanguru"
          : DONDE_ES.has(palabras[1])
            ? "wanhanguru"
            : "nhanguru";
      const nucleoTokens =
        idioma === "en" ? palabras.slice(1, -1) : palabras.slice(2);
      if (nucleoTokens.length === 0) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: null,
          predicado: { tipo: "interrogativo", clave: claveOrigen },
        };
      }
      const nucleo = analizarNucleoPregunta(nucleoTokens, idioma);
      const entradaNucleo = nucleo
        ? VOCAB.verbos.find((verbo) => verbo.clave === nucleo.clave)
        : null;
      if (
        nucleo &&
        (entradaNucleo?.movimiento === true ||
          entradaNucleo?.transporte === true)
      ) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: nucleo.sujeto,
          predicado: {
            tipo: "interrogativo",
            clave: claveOrigen,
            estado: nucleo.clave,
          },
          tiempo: nucleo.tiempo,
          ...(nucleo.personaAlternativa
            ? { personaAlternativa: nucleo.personaAlternativa }
            : {}),
        };
      }
    }

    const preguntaDestino =
      idioma === "en"
        ? palabras[0] === "where"
        : palabras[0] === "adónde" ||
          palabras[0] === "adonde" ||
          (["a", "hacia", "para"].includes(palabras[0]) &&
            DONDE_ES.has(palabras[1]));
    if (preguntaDestino) {
      const inicioNucleo =
        idioma === "en"
          ? 1
          : palabras[0] === "adónde" || palabras[0] === "adonde"
            ? 1
            : 2;
      let nucleoTokens = palabras.slice(inicioNucleo);
      if (nucleoTokens[nucleoTokens.length - 1] === "to") {
        nucleoTokens = nucleoTokens.slice(0, -1);
      }
      if (nucleoTokens.length === 0) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: null,
          predicado: { tipo: "interrogativo", clave: "nhakurru" },
        };
      }
      const nucleo = analizarNucleoPregunta(nucleoTokens, idioma);
      const entradaNucleo = nucleo
        ? VOCAB.verbos.find((verbo) => verbo.clave === nucleo.clave)
        : null;
      if (
        nucleo &&
        (entradaNucleo?.movimiento === true ||
          entradaNucleo?.transporte === true)
      ) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: nucleo.sujeto,
          predicado: {
            tipo: "interrogativo",
            clave: "nhakurru",
            estado: nucleo.clave,
          },
          tiempo: nucleo.tiempo,
          ...(nucleo.personaAlternativa
            ? { personaAlternativa: nucleo.personaAlternativa }
            : {}),
        };
      }
    }

    const preguntaYolkala =
      idioma === "en"
        ? (palabras[0] === "to" && palabras[1] === "whom") ||
          ((palabras[0] === "who" || palabras[0] === "whom") &&
            palabras[palabras.length - 1] === "to")
        : palabras[0] === "a" && QUIEN_ES.has(palabras[1]);
    if (preguntaYolkala) {
      const nucleoTokens =
        idioma === "en"
          ? palabras[0] === "to"
            ? palabras.slice(2)
            : palabras.slice(1, -1)
          : palabras.slice(2);
      const nucleo = analizarNucleoPregunta(nucleoTokens, idioma);
      if (nucleo) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: nucleo.sujeto,
          predicado: {
            tipo: "interrogativo",
            clave: "yolkala",
            estado: nucleo.clave,
          },
          tiempo: nucleo.tiempo,
          ...(nucleo.personaAlternativa
            ? { personaAlternativa: nucleo.personaAlternativa }
            : {}),
        };
      }
    }

    const preguntaVeces =
      idioma === "en"
        ? palabras[0] === "how" &&
          palabras[1] === "many" &&
          palabras[2] === "times" &&
          palabras.length > 3
        : (palabras[0] === "cuántas" || palabras[0] === "cuantas") &&
          palabras[1] === "veces" &&
          palabras.length > 2;
    if (preguntaVeces) {
      const nucleo = analizarNucleoPregunta(
        palabras.slice(idioma === "en" ? 3 : 2),
        idioma
      );
      if (nucleo) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: nucleo.sujeto,
          predicado: {
            tipo: "interrogativo",
            clave: "nhamunhamirri",
            estado: nucleo.clave,
          },
          tiempo: nucleo.tiempo,
          ...(nucleo.objeto ? { objeto: nucleo.objeto } : {}),
          ...(nucleo.personaAlternativa
            ? { personaAlternativa: nucleo.personaAlternativa }
            : {}),
        };
      }
    }

    const casoYolkala = (() => {
      if (idioma === "en") {
        if (
          ["to", "in", "on", "at"].includes(palabras[0]) &&
          palabras[1] === "whose" &&
          palabras.length > 3
        ) {
          const cabeza = palabraDeTipo(palabras[2], "en", "sustantivo");
          if (cabeza) {
            return {
              cabeza,
              prep: palabras[0],
              nucleoTokens: palabras.slice(3),
            };
          }
        }
        return null;
      }
      if (!["a", "en"].includes(palabras[0])) return null;
      const indiceDe = palabras.findIndex(
        (token, posicion) =>
          posicion > 1 &&
          token === "de" &&
          QUIEN_ES.has(palabras[posicion + 1] ?? "")
      );
      if (indiceDe === -1 || indiceDe + 2 >= palabras.length) return null;
      let npCabeza = palabras.slice(1, indiceDe);
      if (npCabeza.length > 1 && ARTICULOS.es.has(npCabeza[0])) {
        npCabeza = npCabeza.slice(1);
      }
      if (npCabeza.length !== 1) return null;
      const cabeza = palabraDeTipo(npCabeza[0], "es", "sustantivo");
      if (!cabeza) return null;
      return {
        cabeza,
        prep: palabras[0],
        nucleoTokens: palabras.slice(indiceDe + 2),
      };
    })();
    if (casoYolkala) {
      const nucleo = analizarNucleoPregunta(casoYolkala.nucleoTokens, idioma);
      if (nucleo) {
        const entradaCaso = VOCAB.verbos.find(
          (verbo) => verbo.clave === nucleo.clave
        );
        const caso =
          casoYolkala.prep === "to" || casoYolkala.prep === "a"
            ? "lili"
            : casoYolkala.cabeza.vehiculo === true &&
                entradaCaso?.movimiento === true
              ? "instrumento"
              : "nura";
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: nucleo.sujeto,
          predicado: {
            tipo: "interrogativo",
            clave: "yolkala-caso",
            estado: nucleo.clave,
            casoPregunta: caso,
            sustantivoCaso: casoYolkala.cabeza.clave,
          },
          tiempo: nucleo.tiempo,
          ...(nucleo.objeto ? { objeto: nucleo.objeto } : {}),
          ...(nucleo.personaAlternativa
            ? { personaAlternativa: nucleo.personaAlternativa }
            : {}),
        };
      }
    }

    const preguntaNhalili =
      idioma === "en"
        ? palabras[0] === "what" &&
          ["on", "onto", "into", "in"].includes(palabras[palabras.length - 1])
        : ["en", "sobre"].includes(palabras[0]) && QUE_ES.has(palabras[1]);
    if (preguntaNhalili) {
      const nucleoTokens =
        idioma === "en" ? palabras.slice(1) : palabras.slice(2);
      const nucleo = analizarNucleoPregunta(nucleoTokens, idioma);
      const entradaNhalili = nucleo
        ? VOCAB.verbos.find((verbo) => verbo.clave === nucleo.clave)
        : null;
      if (nucleo && entradaNhalili?.transporte === true) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: nucleo.sujeto,
          predicado: {
            tipo: "interrogativo",
            clave: "nhalili",
            estado: nucleo.clave,
          },
          tiempo: nucleo.tiempo,
          ...(nucleo.personaAlternativa
            ? { personaAlternativa: nucleo.personaAlternativa }
            : {}),
        };
      }
    }
  }

  {
    const demAquiSolo =
      palabras.length === 1
        ? idioma === "en"
          ? AQUI_EN[palabras[0]]
          : AQUI_ES[desacentuar(palabras[0])]
        : undefined;
    if (demAquiSolo) {
      return {
        modo: "declarativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "lugar", clave: "lugar" },
        lugar: { demostrativo: demAquiSolo },
      };
    }
    if (palabras.length === 2) {
      const previoAqui =
        idioma === "es" ? desacentuar(palabras[0]) : palabras[0];
      const demAquiFrom =
        idioma === "en"
          ? AQUI_EN[palabras[1]]
          : AQUI_ES[desacentuar(palabras[1])];
      if (
        demAquiFrom &&
        (idioma === "en"
          ? previoAqui === "from"
          : previoAqui === "de" || previoAqui === "desde")
      ) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: null,
          predicado: { tipo: "origen", clave: "origen" },
          origen: { demostrativo: demAquiFrom },
        };
      }
    }
    if (
      idioma === "en" &&
      palabras.length >= 3 &&
      palabras[0] === "here" &&
      SER.en.has(palabras[1])
    ) {
      palabras = ["this", ...palabras.slice(1)];
    }
  }

  {
    const finBelong = palabras.length - 2;
    const tokenBelong =
      idioma === "es"
        ? desacentuar(palabras[finBelong] ?? "")
        : (palabras[finBelong] ?? "");
    const demBelong =
      idioma === "en"
        ? AQUI_EN[palabras[palabras.length - 1] ?? ""]
        : AQUI_ES[desacentuar(palabras[palabras.length - 1] ?? "")];
    if (
      palabras.length >= 2 &&
      demBelong &&
      (idioma === "en"
        ? tokenBelong === "belongs" || tokenBelong === "belong"
        : tokenBelong === "pertenece" || tokenBelong === "pertenezco")
    ) {
      const npSujetoBelong = palabras.slice(0, finBelong);
      if (
        npSujetoBelong.length === 0 ||
        (npSujetoBelong.length === 1 &&
          idioma === "en" &&
          ["it", "this", "that"].includes(npSujetoBelong[0]))
      ) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: null,
          predicado: { tipo: "pertenencia", clave: "pertenencia" },
          pertenencia: { demostrativo: demBelong },
        };
      }
      const poseedorBelong = separarPoseedorNP(npSujetoBelong, idioma);
      const restoBelong = quitarArticulo(poseedorBelong.resto, idioma);
      if (restoBelong.length === 1) {
        const sustBelong = palabraDeTipo(restoBelong[0], idioma, "sustantivo");
        if (sustBelong) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: {
              sustantivo: sustBelong.clave,
              ...camposPoseedor(poseedorBelong),
            },
            predicado: { tipo: "pertenencia", clave: "pertenencia" },
            pertenencia: { demostrativo: demBelong },
          };
        }
      }
    }
  }

  if (
    idioma === "en" &&
    palabras[0] === "what" &&
    palabras[1] === "did" &&
    palabras.length >= 5 &&
    palabras[palabras.length - 1] === "of" &&
    PRONOMBRES.en[palabras[2]] !== undefined
  ) {
    const verboDeQue = buscarVerbo(palabras.slice(3, -1), "en");
    if (verboDeQue) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: PRONOMBRES.en[palabras[2]] },
        predicado: {
          tipo: "interrogativo",
          clave: "nhapuy-accion",
          estado: verboDeQue.clave,
        },
        tiempo: "pasado_hoy",
      };
    }
  }
  if (
    idioma === "en" &&
    palabras[0] === "where" &&
    ["was", "were", "will", "shall", "did"].includes(palabras[1]) &&
    palabras.length >= 4 &&
    palabras[palabras.length - 1] !== "from"
  ) {
    const sujetoDondeAccion = PRONOMBRES.en[palabras[2]];
    const colaDonde = [...palabras.slice(3)];
    if (
      colaDonde.length > 1 &&
      OBJETO_PRON_EN[colaDonde[colaDonde.length - 1]]
    ) {
      colaDonde.pop();
    }
    const esFuturoDonde = palabras[1] === "will" || palabras[1] === "shall";
    const verboDondeAccion =
      esFuturoDonde || palabras[1] === "did"
        ? buscarVerbo(colaDonde, "en")
        : colaDonde.length === 1
          ? buscarVerboGerundio([colaDonde[0]], "en")
          : null;
    if (sujetoDondeAccion && verboDondeAccion) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: sujetoDondeAccion },
        predicado: {
          tipo: "interrogativo",
          clave: "wanhami",
          estado: verboDondeAccion.clave,
        },
        tiempo: esFuturoDonde ? "futuro_hoy" : "pasado_hoy",
      };
    }
  }
  if (
    idioma === "es" &&
    (palabras[0] === "dónde" || palabras[0] === "donde") &&
    palabras.length === 3 &&
    ESTAR_PROGRESIVO_PASADO_ES[desacentuar(palabras[1])] !== undefined
  ) {
    const verboDondeEs = buscarVerboGerundio([palabras[2]], "es");
    if (verboDondeEs) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: {
          persona:
            ESTAR_PROGRESIVO_PASADO_ES[desacentuar(palabras[1])].persona ===
            "1sg"
              ? "3sg"
              : ESTAR_PROGRESIVO_PASADO_ES[desacentuar(palabras[1])].persona,
        },
        predicado: {
          tipo: "interrogativo",
          clave: "wanhami",
          estado: verboDondeEs.clave,
        },
        tiempo: "pasado_hoy",
      };
    }
  }
  if (
    idioma === "es" &&
    (palabras[0] === "dónde" || palabras[0] === "donde") &&
    palabras.length >= 2 &&
    palabras.length <= 3
  ) {
    const tokensVerboDonde = [...palabras.slice(1)];
    if (
      tokensVerboDonde.length === 2 &&
      ["lo", "la", "los", "las", "le", "les", "me", "te", "se", "nos", "os"].includes(
        tokensVerboDonde[0]
      )
    ) {
      tokensVerboDonde.shift();
    }
    if (tokensVerboDonde.length === 1) {
      const tokenDondeEs = desacentuar(tokensVerboDonde[0]);
      const preteritoDonde =
        preteritoSintetico(tokensVerboDonde[0]) ??
        preteritoSintetico(tokenDondeEs);
      const futuroDonde = preteritoDonde
        ? null
        : (futuroSintetico(tokensVerboDonde[0]) ??
          futuroSintetico(tokenDondeEs));
      const nucleoDonde = preteritoDonde ?? futuroDonde;
      if (nucleoDonde) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: { persona: nucleoDonde.persona },
          predicado: {
            tipo: "interrogativo",
            clave: "wanhami",
            estado: nucleoDonde.verbo.clave,
          },
          tiempo: preteritoDonde ? "pasado_hoy" : "futuro_hoy",
        };
      }
    }
  }
  if (
    idioma === "es" &&
    (palabras[0] === "dónde" || palabras[0] === "donde") &&
    palabras.length >= 3
  ) {
    const tokenVerboDonde = palabras[1];
    const preteritoDonde =
      preteritoSintetico(tokenVerboDonde) ??
      preteritoSintetico(desacentuar(tokenVerboDonde));
    const futuroDonde = preteritoDonde
      ? null
      : (futuroSintetico(tokenVerboDonde) ??
        futuroSintetico(desacentuar(tokenVerboDonde)));
    const nucleoDonde = preteritoDonde ?? futuroDonde;
    if (nucleoDonde) {
      const npDonde = quitarArticulo(palabras.slice(2), "es");
      const demDonde = separarDemostrativoNP(npDonde, "es");
      const cabezaDonde = quitarArticulo(demDonde.resto, "es");
      if (cabezaDonde.length === 1) {
        const sustantivoDonde = palabraDeTipo(
          cabezaDonde[0],
          "es",
          "sustantivo"
        );
        const sujetoDonde: FraseIR["sujeto"] = sustantivoDonde
          ? {
              sustantivo: sustantivoDonde.clave,
              ...(demDonde.demostrativo
                ? { demostrativo: demDonde.demostrativo }
                : {}),
            }
          : !demDonde.demostrativo &&
              !NO_SON_NOMBRES.has(cabezaDonde[0]) &&
              !PALABRAS.es.get(cabezaDonde[0]) &&
              !VERBOS.es.get(cabezaDonde[0])
            ? {
                nombre:
                  cabezaDonde[0].charAt(0).toUpperCase() +
                  cabezaDonde[0].slice(1),
              }
            : null;
        if (sujetoDonde) {
          return {
            modo: "interrogativa",
            polaridad: "afirmativa",
            sujeto: sujetoDonde,
            predicado: {
              tipo: "interrogativo",
              clave: "wanhami",
              estado: nucleoDonde.verbo.clave,
            },
            tiempo: preteritoDonde ? "pasado_hoy" : "futuro_hoy",
          };
        }
      }
    }
  }

  if (
    (idioma === "en" &&
      palabras[0] === "where" &&
      (palabras[1] === "is" || palabras[1] === "are")) ||
    (idioma === "es" &&
      (palabras[0] === "dónde" || palabras[0] === "donde") &&
      SER.es.has(palabras[1]))
  ) {
    let restoDonde = palabras.slice(2);
    if (
      restoDonde.length > 1 &&
      (ARTICULOS[idioma].has(restoDonde[0]) ||
        INDEFINIDOS[idioma].has(restoDonde[0]))
    ) {
      restoDonde = restoDonde.slice(1);
    }
    if (restoDonde.length === 1) {
      const token = restoDonde[0];
      const pronDonde = PRONOMBRES[idioma][token];
      const sujetoDonde: FraseIR["sujeto"] = pronDonde
        ? { persona: pronDonde }
        : palabraDeTipo(token, idioma, "sustantivo")
          ? { sustantivo: palabraDeTipo(token, idioma, "sustantivo")!.clave }
          : !VERBOS[idioma].get(token)
            ? { nombre: token.charAt(0).toUpperCase() + token.slice(1) }
            : null;
      if (sujetoDonde) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: sujetoDonde,
          predicado: { tipo: "interrogativo", clave: "wanha" },
        };
      }
    }
  }

  if (idioma === "en") {
    const tokensNombre =
      palabras[0] === "whats"
        ? palabras.slice(1)
        : palabras[0] === "what" && palabras[1] === "is"
          ? palabras.slice(2)
          : null;
    if (
      tokensNombre &&
      tokensNombre.length === 2 &&
      POSESIVOS_DET.en[tokensNombre[0]] !== undefined &&
      tokensNombre[1] === "name"
    ) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: POSESIVOS_DET.en[tokensNombre[0]] },
        predicado: { tipo: "interrogativo", clave: "yolyaku" },
      };
    }
  }
  if (idioma === "es") {
    const claveNombre = desacentuar(palabras.join(" "));
    if (claveNombre === "como te llamas") {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: "2sg" },
        predicado: { tipo: "interrogativo", clave: "yolyaku" },
      };
    }
    if (claveNombre === "como se llama") {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: "3sg" },
        predicado: { tipo: "interrogativo", clave: "yolyaku" },
      };
    }
    if (
      (palabras[0] === "cuál" || palabras[0] === "cual") &&
      palabras[1] === "es" &&
      POSESIVOS_DET.es[palabras[2]] !== undefined &&
      desacentuar(palabras[3] ?? "") === "nombre" &&
      palabras.length === 4
    ) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: POSESIVOS_DET.es[palabras[2]] },
        predicado: { tipo: "interrogativo", clave: "yolyaku" },
      };
    }
  }
  if (
    idioma === "en" &&
    palabras[0] === "which" &&
    palabras[1] === "way" &&
    (palabras[2] === "shall" || palabras[2] === "will") &&
    PRONOMBRES.en[palabras[3]] !== undefined &&
    (palabras.length === 4 ||
      (palabras.length === 5 && palabras[4] === "go"))
  ) {
    return {
      modo: "interrogativa",
      polaridad: "afirmativa",
      sujeto: { persona: PRONOMBRES.en[palabras[3]] },
      predicado: { tipo: "interrogativo", clave: "wanhatjan" },
    };
  }
  if (
    idioma === "es" &&
    desacentuar(palabras[0]) === "por" &&
    ["dónde", "donde"].includes(palabras[1] ?? "") &&
    palabras.length === 3
  ) {
    const futuroDonde = futuroSintetico(palabras[2]);
    if (futuroDonde?.verbo.movimiento === true) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: futuroDonde.persona },
        predicado: { tipo: "interrogativo", clave: "wanhatjan" },
      };
    }
  }
  if (
    idioma === "en" &&
    (palabras[0] === "did" || palabras[0] === "has" || palabras[0] === "have") &&
    PRONOMBRES.en[palabras[1]] !== undefined &&
    (palabras.length === 3 ||
      (palabras.length === 4 && palabras[3] === "it"))
  ) {
    const verboBili =
      palabras[0] === "did"
        ? buscarVerbo([palabras[2]], "en")
        : verboParticipioEn([palabras[2]]);
    if (verboBili) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: PRONOMBRES.en[palabras[1]] },
        predicado: { tipo: "verbo", clave: verboBili.clave },
        tiempo: "pasado_hoy",
        bili: true,
      };
    }
  }
  if (idioma === "en") {
    let restoPeticion: string[] | null = null;
    if (palabras[0] === "why" && palabras[1] === "dont" && palabras[2] === "you") {
      restoPeticion = palabras.slice(3);
    } else if (
      palabras[0] === "why" &&
      palabras[1] === "do" &&
      palabras[2] === "not" &&
      palabras[3] === "you"
    ) {
      restoPeticion = palabras.slice(4);
    }
    let verboPeticion: VerboVocabulario | null =
      restoPeticion && restoPeticion.length >= 1
        ? buscarVerbo([restoPeticion[0]], "en")
        : null;
    let colaPeticion = verboPeticion ? restoPeticion!.slice(1) : null;
    if (
      !verboPeticion &&
      (palabras[0] === "what" || palabras[0] === "how") &&
      palabras[1] === "about" &&
      palabras.length >= 3
    ) {
      verboPeticion = buscarVerboGerundio([palabras[2]], "en");
      colaPeticion = verboPeticion ? palabras.slice(3) : null;
    }
    if (verboPeticion && colaPeticion !== null) {
      const OBJETO_PETICION: Record<string, PersonaIR> = {
        him: "3sg",
        her: "3sg",
        me: "1sg",
        them: "3pl",
        us: "1pl_incl",
      };
      const objetoPeticion =
        colaPeticion.length === 1 &&
        OBJETO_PETICION[colaPeticion[0]] !== undefined
          ? OBJETO_PETICION[colaPeticion[0]]
          : (colaPeticion.length === 0 ||
                (colaPeticion.length === 1 && colaPeticion[0] === "it")) &&
              destinoPendiente?.persona !== undefined
            ? destinoPendiente.persona
            : undefined;
      if (
        colaPeticion.length === 0 ||
        objetoPeticion !== undefined ||
        (colaPeticion.length === 1 && colaPeticion[0] === "it")
      ) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: { persona: "2sg" },
          predicado: {
            tipo: "interrogativo",
            clave: "wanhaPeticion",
            estado: verboPeticion.clave,
          },
          ...(objetoPeticion ? { objeto: { persona: objetoPeticion } } : {}),
        };
      }
    }
  }
  if (
    idioma === "en" &&
    ["what", "how", "why"].includes(palabras[0]) &&
    palabras.length === 4 &&
    PRONOMBRES.en[palabras[2]] !== undefined
  ) {
    const auxNhaltjan = palabras[1];
    const personaNhaltjan = PRONOMBRES.en[palabras[2]];
    const cabezaNhaltjan = palabras[3];
    let verboNhaltjan: VerboVocabulario | null = null;
    let tiempoNhaltjan: TiempoIR | null = null;
    let continuoNhaltjan = false;
    if (auxNhaltjan === "do" || auxNhaltjan === "does") {
      verboNhaltjan = buscarVerbo([cabezaNhaltjan], "en");
      tiempoNhaltjan = "continuo";
    } else if (
      auxNhaltjan === "are" ||
      auxNhaltjan === "is" ||
      auxNhaltjan === "am"
    ) {
      verboNhaltjan = buscarVerboGerundio([cabezaNhaltjan], "en");
      tiempoNhaltjan = "continuo";
    } else if (auxNhaltjan === "did") {
      verboNhaltjan = buscarVerbo([cabezaNhaltjan], "en");
      tiempoNhaltjan = "pasado_hoy";
    } else if (auxNhaltjan === "was" || auxNhaltjan === "were") {
      verboNhaltjan = buscarVerboGerundio([cabezaNhaltjan], "en");
      tiempoNhaltjan = "pasado_hoy";
      continuoNhaltjan = true;
    } else if (auxNhaltjan === "shall" || auxNhaltjan === "will") {
      verboNhaltjan = buscarVerbo([cabezaNhaltjan], "en");
      tiempoNhaltjan = "futuro_hoy";
    }
    if (verboNhaltjan && tiempoNhaltjan) {
      return {
        modo: "interrogativa",
        polaridad: "afirmativa",
        sujeto: { persona: personaNhaltjan },
        predicado: {
          tipo: "interrogativo",
          clave: "nhaltjan",
          estado: verboNhaltjan.clave,
        },
        tiempo: tiempoNhaltjan,
        ...(continuoNhaltjan ? { aspecto: "continuo" } : {}),
      };
    }
  }
  if (
    idioma === "es" &&
    (["qué", "que", "cómo", "como"].includes(palabras[0]) ||
      (desacentuar(palabras[0]) === "por" &&
        desacentuar(palabras[1] ?? "") === "que")) &&
    palabras.length >= 2
  ) {
    const inicioNhaltjanEs = desacentuar(palabras[0]) === "por" ? 2 : 1;
    if (palabras.length === inicioNhaltjanEs + 1) {
      const nucleoNhaltjanEs = preteritoSintetico(
        palabras[inicioNhaltjanEs]
      );
      if (nucleoNhaltjanEs) {
        return {
          modo: "interrogativa",
          polaridad: "afirmativa",
          sujeto: { persona: nucleoNhaltjanEs.persona },
          predicado: {
            tipo: "interrogativo",
            clave: "nhaltjan",
            estado: nucleoNhaltjanEs.verbo.clave,
          },
          tiempo: "pasado_hoy",
        };
      }
    }
  }

  const demInicial = DEMOSTRATIVOS[idioma][palabras[0]];

  if (demInicial) {
    if (palabras.length > 1 && SER[idioma].has(palabras[1])) {
      const frase = analizarPredicadoVerbless(
        palabras.slice(2),
        idioma,
        demInicial
      );
      if (frase) {
        if (
          propositoPendiente?.verbo &&
          (frase.predicado.tipo === "adjetivo" ||
            frase.predicado.tipo === "sustantivo")
        ) {
          frase.proposito = propositoPendiente;
        }
        if (
          comitativoPendiente &&
          !frase.comitativo &&
          frase.predicado.tipo === "adjetivo" &&
          frase.predicado.clave.startsWith("resultado:")
        ) {
          frase.comitativo = comitativoPendiente;
        }
        return frase;
      }
    }
    const sustantivo = palabraDeTipo(palabras[1], idioma, "sustantivo");
    if (sustantivo) {
      if (palabras.length >= 4 && SER[idioma].has(palabras[2])) {
        const restoAdjetivo = palabras
          .slice(3)
          .filter((token) => !GRADOS[idioma].has(token));
        const adjetivo =
          restoAdjetivo.length === 1
            ? palabraDeTipo(restoAdjetivo[0], idioma, "adjetivo")
            : null;
        if (adjetivo) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: { demostrativo: demInicial, sustantivo: sustantivo.clave },
            predicado: { tipo: "adjetivo", clave: adjetivo.clave },
            ...(propositoPendiente?.verbo
              ? { proposito: propositoPendiente }
              : {}),
          };
        }
        if (esComoComparacion(restoAdjetivo[0], idioma)) {
          const comparadoDem = analizarComparado(
            restoAdjetivo.slice(1),
            idioma
          );
          if (comparadoDem) {
            return {
              modo: "declarativa",
              polaridad: "afirmativa",
              sujeto: {
                demostrativo: demInicial,
                sustantivo: sustantivo.clave,
              },
              predicado: { tipo: "adjetivo", clave: "like this" },
              comparado: comparadoDem,
            };
          }
        }
        const adjComoDem = palabraDeTipo(restoAdjetivo[0], idioma, "adjetivo");
        if (adjComoDem && esComoComparacion(restoAdjetivo[1], idioma)) {
          const comparadoAdjDem = analizarComparado(
            restoAdjetivo.slice(2),
            idioma
          );
          if (comparadoAdjDem) {
            return {
              modo: "declarativa",
              polaridad: "afirmativa",
              sujeto: {
                demostrativo: demInicial,
                sustantivo: sustantivo.clave,
              },
              predicado: { tipo: "adjetivo", clave: adjComoDem.clave },
              comparado: comparadoAdjDem,
            };
          }
        }
        const posesivoPredicado = POSESIVOS_PRON[idioma][palabras[3]];
        if (posesivoPredicado) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: { demostrativo: demInicial },
            predicado: {
              tipo: "sustantivo",
              clave: sustantivo.clave,
              posesivo: posesivoPredicado,
            },
          };
        }
      }
      if (
        idioma === "es" &&
        palabras.length > 4 &&
        SER.es.has(palabras[2]) &&
        palabras[3] === "de"
      ) {
        const poseedor = analizarPoseedorEs(palabras.slice(4));
        if (poseedor) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: { demostrativo: demInicial },
            predicado: {
              tipo: "sustantivo",
              clave: sustantivo.clave,
              ...poseedor,
            },
          };
        }
      }
      if (palabras.length > 3 && SER[idioma].has(palabras[2])) {
        const derivadoPrep = analizarDerivadoPreposicion(
          palabras.slice(3),
          idioma,
          { demostrativo: demInicial, sustantivo: sustantivo.clave }
        );
        if (derivadoPrep) return derivadoPrep;
      }
      const estadoDem = analizarEstadoConSujeto(palabras.slice(2), idioma, {
        demostrativo: demInicial,
        sustantivo: sustantivo.clave,
      });
      if (estadoDem) return estadoDem;
      const verbalDem = analizarPredicadoVerbal(palabras.slice(2));
      if (verbalDem) {
        verbalDem.sujeto = {
          demostrativo: demInicial,
          sustantivo: sustantivo.clave,
        };
        return verbalDem;
      }
      if (palabras.length > 2 && TENER[idioma].has(palabras[2])) {
        return analizarDerivado(palabras.slice(3), idioma, {
          demostrativo: demInicial,
          sustantivo: sustantivo.clave,
        });
      }
      if (
        idioma === "es" &&
        palabras[2] === "no" &&
        palabras.length > 3 &&
        TENER.es.has(palabras[3])
      ) {
        const frase = analizarDerivado(palabras.slice(4), "es", {
          demostrativo: demInicial,
          sustantivo: sustantivo.clave,
        });
        if (frase) {
          frase.predicado.sufijo = "miriw";
          return frase;
        }
      }
    }
  }

  if (ARTICULOS[idioma].has(palabras[0]) && palabras.length > 2) {
    const sustantivo = palabraDeTipo(palabras[1], idioma, "sustantivo");
    if (sustantivo) {
      const sujetoArticulo = {
        demostrativo: "este" as DemostrativoIR,
        sustantivo: sustantivo.clave,
        articuloDefinido: true,
      };
      if (palabras.length === 4 && SER[idioma].has(palabras[2])) {
        const adjetivo = palabraDeTipo(palabras[3], idioma, "adjetivo");
        if (adjetivo) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: sujetoArticulo,
            predicado: { tipo: "adjetivo", clave: adjetivo.clave },
          };
        }
        const posesivoPredicado = POSESIVOS_PRON[idioma][palabras[3]];
        if (posesivoPredicado) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: { demostrativo: "este", articuloDefinido: true },
            predicado: {
              tipo: "sustantivo",
              clave: sustantivo.clave,
              posesivo: posesivoPredicado,
            },
          };
        }
      }
      if (
        idioma === "es" &&
        palabras.length > 4 &&
        SER.es.has(palabras[2]) &&
        palabras[3] === "de"
      ) {
        const poseedor = analizarPoseedorEs(palabras.slice(4));
        if (poseedor) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: { demostrativo: "este", articuloDefinido: true },
            predicado: {
              tipo: "sustantivo",
              clave: sustantivo.clave,
              ...poseedor,
            },
          };
        }
      }
      if (palabras.length > 3 && SER[idioma].has(palabras[2])) {
        const derivadoPrep = analizarDerivadoPreposicion(
          palabras.slice(3),
          idioma,
          sujetoArticulo
        );
        if (derivadoPrep) return derivadoPrep;
      }
      const estadoArticulo = analizarEstadoConSujeto(
        palabras.slice(2),
        idioma,
        sujetoArticulo
      );
      if (estadoArticulo) return estadoArticulo;
      const verbalArticulo = analizarPredicadoVerbal(palabras.slice(2));
      if (verbalArticulo) {
        verbalArticulo.sujeto = {
          sustantivo: sustantivo.clave,
          ...(esPluralSuperficie(palabras[1], sustantivo, idioma)
            ? { plural: true }
            : {}),
        };
        return verbalArticulo;
      }
      if (TENER[idioma].has(palabras[2])) {
        const frase = analizarDerivado(palabras.slice(3), idioma, sujetoArticulo);
        if (frase) return frase;
      }
      if (
        idioma === "es" &&
        palabras[2] === "no" &&
        palabras.length > 3 &&
        TENER.es.has(palabras[3])
      ) {
        const frase = analizarDerivado(palabras.slice(4), "es", sujetoArticulo);
        if (frase) {
          frase.predicado.sufijo = "miriw";
          return frase;
        }
      }
    }
  }

  if (
    INDEFINIDOS[idioma].has(palabras[0]) &&
    palabras.length > 2 &&
    palabraDeTipo(palabras[1], idioma, "sustantivo")
  ) {
    palabras = palabras.slice(1);
  }

  {
    let npSujeto = [...palabras];
    let articuloAdj = false;
    if (
      npSujeto.length > 2 &&
      (ARTICULOS[idioma].has(npSujeto[0]) ||
        INDEFINIDOS[idioma].has(npSujeto[0]))
    ) {
      articuloAdj = ARTICULOS[idioma].has(npSujeto[0]);
      npSujeto = npSujeto.slice(1);
    }
    if (idioma === "es" && npSujeto.length > 2) {
      const sustPrimero = palabraDeTipo(npSujeto[0], "es", "sustantivo");
      const adjSegundo = sustPrimero
        ? adjetivoDeTokens([npSujeto[1]], "es")
        : null;
      if (sustPrimero && adjSegundo) {
        const verbalAdjEs = analizarPredicadoVerbal(npSujeto.slice(2));
        if (verbalAdjEs) {
          verbalAdjEs.sujeto = {
            sustantivo: sustPrimero.clave,
            adjetivo: adjSegundo.base,
            ...(articuloAdj ? { articuloDefinido: true } : {}),
          };
          return verbalAdjEs;
        }
      }
    }
    if (npSujeto.length > 2) {
      const poseedorDet = separarPoseedorNP(npSujeto, idioma);
      if (poseedorDet.posesivo !== undefined && poseedorDet.resto.length > 1) {
        const sustantivoPos = palabraDeTipo(
          poseedorDet.resto[0],
          idioma,
          "sustantivo"
        );
        if (
          sustantivoPos &&
          SER[idioma].has(poseedorDet.resto[1] ?? "") &&
          poseedorDet.resto.length > 2
        ) {
          const restoSer = poseedorDet.resto.slice(2);
          const sujetoSer: FraseIR["sujeto"] = {
            sustantivo: sustantivoPos.clave,
            ...camposPoseedor(poseedorDet),
          };
          const palabraAdjSer = palabraDeTipo(
            restoSer.join(" "),
            idioma,
            "adjetivo"
          );
          if (palabraAdjSer) {
            return {
              modo: "declarativa",
              polaridad: "afirmativa",
              sujeto: sujetoSer,
              predicado: { tipo: "adjetivo", clave: palabraAdjSer.clave },
            };
          }
          if (esComoComparacion(restoSer[0], idioma)) {
            const comparadoSer = analizarComparado(restoSer.slice(1), idioma);
            if (comparadoSer) {
              return {
                modo: "declarativa",
                polaridad: "afirmativa",
                sujeto: sujetoSer,
                predicado: { tipo: "adjetivo", clave: "like this" },
                comparado: comparadoSer,
              };
            }
          }
          const adjComparado = palabraDeTipo(restoSer[0], idioma, "adjetivo");
          if (adjComparado && esComoComparacion(restoSer[1], idioma)) {
            const comparadoAdj = analizarComparado(restoSer.slice(2), idioma);
            if (comparadoAdj) {
              return {
                modo: "declarativa",
                polaridad: "afirmativa",
                sujeto: sujetoSer,
                predicado: { tipo: "adjetivo", clave: adjComparado.clave },
                comparado: comparadoAdj,
              };
            }
          }
        }
        if (sustantivoPos) {
          const verbalPos = analizarPredicadoVerbal(
            poseedorDet.resto.slice(1)
          );
          if (verbalPos) {
            verbalPos.sujeto =
              sustantivoPos.parteCuerpo === true &&
              poseedorDet.posesivo !== undefined &&
              !poseedorDet.posesivoEnfatico &&
              !poseedorDet.posesivoReflexivo
                ? {
                    persona: poseedorDet.posesivo,
                    parteCuerpo: sustantivoPos.clave,
                  }
                : {
                    sustantivo: sustantivoPos.clave,
                    ...camposPoseedor(poseedorDet),
                  };
            return verbalPos;
          }
        }
      }
    }
    const poseedorSujeto = separarPoseedorNP(npSujeto, idioma);
    if (
      (poseedorSujeto.posesivoNombre !== undefined ||
        poseedorSujeto.posesivoSustantivo !== undefined) &&
      poseedorSujeto.resto.length > 1
    ) {
      const sustantivoPoseido = palabraDeTipo(
        poseedorSujeto.resto[0],
        idioma,
        "sustantivo"
      );
      if (sustantivoPoseido) {
        const verbalPoseido = analizarPredicadoVerbal(
          poseedorSujeto.resto.slice(1)
        );
        if (verbalPoseido) {
          verbalPoseido.sujeto = {
            sustantivo: sustantivoPoseido.clave,
            ...camposPoseedor(poseedorSujeto),
          };
          return verbalPoseido;
        }
      }
    }
    const adjSujeto = adjetivoDeTokens(npSujeto, idioma);
    if (adjSujeto && npSujeto.length > adjSujeto.consumidos + 1) {
      const nucleoSujeto = npSujeto.slice(adjSujeto.consumidos);
      const sustantivoAdj = palabraDeTipo(
        nucleoSujeto[0],
        idioma,
        "sustantivo"
      );
      if (sustantivoAdj) {
        const verbalAdj = analizarPredicadoVerbal(nucleoSujeto.slice(1));
        if (verbalAdj) {
          verbalAdj.sujeto = {
            sustantivo: sustantivoAdj.clave,
            adjetivo: adjSujeto.base,
            ...(articuloAdj ? { articuloDefinido: true } : {}),
          };
          return verbalAdj;
        }
      }
    }
  }

  const sustantivoInicial = palabraDeTipo(palabras[0], idioma, "sustantivo");
  if (sustantivoInicial && palabras.length > 1) {
    if (palabras.length === 3 && SER[idioma].has(palabras[1])) {
      const adjetivo = palabraDeTipo(palabras[2], idioma, "adjetivo");
      if (adjetivo) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: { sustantivo: sustantivoInicial.clave },
          predicado: { tipo: "adjetivo", clave: adjetivo.clave },
        };
      }
      const posesivoPredicado = POSESIVOS_PRON[idioma][palabras[2]];
      if (posesivoPredicado) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: {},
          predicado: {
            tipo: "sustantivo",
            clave: sustantivoInicial.clave,
            posesivo: posesivoPredicado,
          },
        };
      }
    }
    if (palabras.length > 2 && SER[idioma].has(palabras[1])) {
      const derivadoPrep = analizarDerivadoPreposicion(palabras.slice(2), idioma, {
        sustantivo: sustantivoInicial.clave,
      });
      if (derivadoPrep) return derivadoPrep;
    }
    const estadoSustantivo = analizarEstadoConSujeto(palabras.slice(1), idioma, {
      sustantivo: sustantivoInicial.clave,
    });
    if (estadoSustantivo) return estadoSustantivo;
    const verbalSustantivo = analizarPredicadoVerbal(palabras.slice(1));
    if (verbalSustantivo) {
      verbalSustantivo.sujeto = { sustantivo: sustantivoInicial.clave };
      return verbalSustantivo;
    }
    if (TENER[idioma].has(palabras[1])) {
      const frase = analizarDerivado(palabras.slice(2), idioma, {
        sustantivo: sustantivoInicial.clave,
      });
      if (frase) return frase;
    }
    if (
      idioma === "es" &&
      palabras[1] === "no" &&
      palabras.length > 2 &&
      TENER.es.has(palabras[2])
    ) {
      const frase = analizarDerivado(palabras.slice(3), "es", {
        sustantivo: sustantivoInicial.clave,
      });
      if (frase) {
        frase.predicado.sufijo = "miriw";
        return frase;
      }
    }
  }

  const tresPrimeras = palabras.slice(0, 3).join(" ");
  const personaCoordinada = COORDINACIONES[idioma][tresPrimeras];
  const dosPrimeras = palabras.slice(0, 2).join(" ");
  const personaDoble = PRONOMBRES_DOBLES[idioma][dosPrimeras];
  const persona =
    personaCoordinada ?? personaDoble ?? PRONOMBRES[idioma][palabras[0]];
  let cuerpo = personaCoordinada
    ? palabras.slice(3)
    : personaDoble
      ? palabras.slice(2)
      : palabras.slice(1);
  let cliticoInicial: string | null = null;
  if (
    idioma === "es" &&
    persona &&
    cuerpo.length > 1 &&
    CLITICOS_ES.has(cuerpo[0])
  ) {
    cliticoInicial = cuerpo[0];
    cuerpo = cuerpo.slice(1);
  }

  if (persona && cuerpo.length > 0) {
    if (SER[idioma].has(cuerpo[0])) {
      if (
        idioma === "en" &&
        cuerpo[1] === "about" &&
        cuerpo[2] === "to" &&
        cuerpo.length > 3
      ) {
        const separadoInminente = separarObjeto(cuerpo.slice(3), "en", (t) =>
          buscarVerbo(t, "en")
        );
        if (separadoInminente) {
          const fraseInminente = fraseVerbal(
            persona,
            separadoInminente.verbo,
            "continuo",
            "afirmativa",
            adverbio
          );
          fraseInminente.inminente = true;
          if (
            separadoInminente.objeto &&
            Object.keys(separadoInminente.objeto).length > 0
          ) {
            fraseInminente.objeto = separadoInminente.objeto;
          }
          return fraseInminente;
        }
      }
      if (
        idioma === "es" &&
        cuerpo[1] === "a" &&
        desacentuar(cuerpo[2] ?? "") === "punto" &&
        cuerpo[3] === "de" &&
        cuerpo.length > 4
      ) {
        const verboPunto = buscarVerbo(cuerpo.slice(4), "es");
        if (verboPunto) {
          const frasePunto = fraseVerbal(
            persona,
            verboPunto,
            "continuo",
            "afirmativa",
            adverbio
          );
          frasePunto.inminente = true;
          return frasePunto;
        }
      }
      if (cuerpo.length === 2) {
        const claveSentir =
          idioma === "en"
            ? PARTICIPIOS_ESTATIVOS_EN[cuerpo[1]]
            : SENTIMIENTO_ES[desacentuar(cuerpo[1])];
        const verboSentirSer = claveSentir
          ? VOCAB.verbos.find((v) => v.clave === claveSentir)
          : null;
        const adjetivoSentir = verboSentirSer
          ? null
          : palabraDeTipo(cuerpo[1], idioma, "adjetivo");
        const verboSentirFinal =
          verboSentirSer ??
          (adjetivoSentir?.sentimiento
            ? verboDevenirAdjetivo(adjetivoSentir.clave)
            : null);
        if (verboSentirFinal) {
          const fraseSentirSer = fraseVerbal(
            persona,
            verboSentirFinal,
            "pasado_hoy",
            "afirmativa",
            adverbio
          );
          fraseSentirSer.tiempoConfirmado = true;
          fraseSentirSer.sentimiento = true;
          return fraseSentirSer;
        }
      }
      if (
        idioma === "en" &&
        ["is", "are", "am"].includes(cuerpo[0]) &&
        cuerpo[1] === "not" &&
        cuerpo.length >= 3
      ) {
        const gerundioNegado = separarObjeto(cuerpo.slice(2), "en", (t) =>
          buscarVerboGerundio(t, "en")
        );
        if (gerundioNegado) {
          const fraseContinuaNegada = fraseVerbal(
            persona,
            gerundioNegado.verbo,
            "continuo",
            "negativa",
            adverbio
          );
          if (
            gerundioNegado.objeto &&
            Object.keys(gerundioNegado.objeto).length > 0
          ) {
            fraseContinuaNegada.objeto = gerundioNegado.objeto;
          }
          return fraseContinuaNegada;
        }
        if (cuerpo.length === 3 && PARTICIPIOS_ESTATIVOS_EN[cuerpo[2]]) {
          const verboEstativoNegado = VOCAB.verbos.find(
            (candidato) =>
              candidato.clave === PARTICIPIOS_ESTATIVOS_EN[cuerpo[2]]
          );
          if (verboEstativoNegado) {
            return fraseVerbal(
              persona,
              verboEstativoNegado,
              "continuo",
              "negativa",
              adverbio
            );
          }
        }
      }
      if (cuerpo.length === 1 && (lugarPendiente || comitativoPendiente)) {
        return frasePostura({ persona });
      }
      if (cuerpo.length >= 2 && cuerpo.length <= 3) {
        const adjetivo = palabraDeTipo(
          cuerpo.slice(1).join(" "),
          idioma,
          "adjetivo"
        );
        if (
          adjetivo &&
          !(cuerpo.length === 2 && buscarVerboGerundio([cuerpo[1]], idioma))
        ) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: { persona },
            predicado: { tipo: "adjetivo", clave: adjetivo.clave },
          };
        }
      }
      const restoSer = quitarArticulo(cuerpo.slice(1), idioma);
      if (restoSer.length === 1) {
        const sustantivoSer = palabraDeTipo(restoSer[0], idioma, "sustantivo");
        if (sustantivoSer) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: { persona },
            predicado: { tipo: "sustantivo", clave: sustantivoSer.clave },
          };
        }
      }
      const derivadoPrep = analizarDerivadoPreposicion(cuerpo.slice(1), idioma, {
        persona,
      });
      if (derivadoPrep) return derivadoPrep;
      const gerundioSeparado = separarObjeto(cuerpo.slice(1), idioma, (t) =>
        buscarVerboGerundio(t, idioma)
      );
      if (gerundioSeparado) {
        const fraseContinua = fraseVerbal(
          persona,
          gerundioSeparado.verbo,
          "continuo",
          "afirmativa",
          adverbio
        );
        if (
          gerundioSeparado.objeto &&
          Object.keys(gerundioSeparado.objeto).length > 0
        ) {
          fraseContinua.objeto = gerundioSeparado.objeto;
        }
        return conCliticoObjeto(fraseContinua, cliticoInicial);
      }
    }

    if (idioma === "en" && ESTADOS_EN[cuerpo[0]]) {
      const complemento =
        cuerpo.length > 1 ? analizarComplementoEn(cuerpo.slice(1)) : null;
      if (cuerpo.length === 1 || complemento) {
        return fraseEstado(
          ESTADOS_EN[cuerpo[0]],
          persona,
          complemento,
          "afirmativa"
        );
      }
    }
    if (
      idioma === "en" &&
      (cuerpo[0] === "do" || cuerpo[0] === "does") &&
      cuerpo[1] === "not" &&
      cuerpo.length > 2 &&
      ESTADOS_EN[cuerpo[2]]
    ) {
      const complemento =
        cuerpo.length > 3 ? analizarComplementoEn(cuerpo.slice(3)) : null;
      if (cuerpo.length === 3 || complemento) {
        return fraseEstado(
          ESTADOS_EN[cuerpo[2]],
          persona,
          complemento,
          "negativa"
        );
      }
    }
    if (idioma === "es") {
      const negativaEstado = cuerpo[0] === "no";
      let restoEstado = negativaEstado ? cuerpo.slice(1) : cuerpo;
      let clitico = cliticoInicial;
      if (
        !clitico &&
        restoEstado.length > 1 &&
        CLITICOS_ES.has(restoEstado[0])
      ) {
        clitico = restoEstado[0];
        restoEstado = restoEstado.slice(1);
      }
      const conjugacion = ESTADOS_ES[restoEstado[0]];
      if (conjugacion) {
        const complemento =
          restoEstado.length > 1
            ? analizarComplementoEs(restoEstado.slice(1))
            : clitico
              ? [complementoDeClitico(clitico)]
              : null;
        if (restoEstado.length === 1 || complemento) {
          return fraseEstado(
            conjugacion.clave,
            persona,
            complemento,
            negativaEstado ? "negativa" : "afirmativa"
          );
        }
      }
    }

    {
      const CESAR_EN: Record<string, string> = {
        stopped: "cease",
        ceased: "cease",
        finished: "finish",
      };
      const claveCesar =
        idioma === "en"
          ? (CESAR_EN[cuerpo[0]] ?? null)
          : cuerpo[1] === "de" && cuerpo.length > 2
            ? desacentuar(cuerpo[0]) === "dejo"
              ? "cease"
              : ["termino", "acabo"].includes(desacentuar(cuerpo[0]))
                ? "finish"
                : null
            : null;
      if (claveCesar && cuerpo.length > 1) {
        const restoCesar = idioma === "en" ? cuerpo.slice(1) : cuerpo.slice(2);
        const separadoCesar = separarObjeto(restoCesar, idioma, (t) =>
          idioma === "en"
            ? buscarVerboGerundio(t, "en")
            : buscarVerbo(t, "es")
        );
        if (separadoCesar) {
          const verboCesar = VOCAB.verbos.find(
            (candidato) => candidato.clave === claveCesar
          );
          if (verboCesar) {
            const fraseCesar = marcarPasado(
              fraseVerbal(
                persona,
                verboCesar,
                tiempoPasado,
                "afirmativa",
                adverbio
              )
            );
            fraseCesar.accionNuru = separadoCesar.verbo.clave;
            if (separadoCesar.objeto?.sustantivo) {
              fraseCesar.objetoNuru = separadoCesar.objeto.sustantivo;
            }
            return fraseCesar;
          }
        }
      }
    }
    if (
      idioma === "en" &&
      ["might", "should", "would", "must"].includes(cuerpo[0]) &&
      cuerpo.length > 1
    ) {
      const negativaModal = cuerpo[1] === "not";
      let restoModal = cuerpo.slice(negativaModal ? 2 : 1);
      const conHave = restoModal[0] === "have";
      if (conHave) restoModal = restoModal.slice(1);
      if (
        (restoModal[0] === "talk" || restoModal[0] === "speak") &&
        restoModal[1] === "to"
      ) {
        restoModal = [restoModal[0], ...restoModal.slice(2)];
      }
      const separadoModal = separarObjeto(restoModal, "en", (t) =>
        conHave ? verboParticipioEn(t) : buscarVerbo(t, "en")
      );
      if (separadoModal) {
        const fraseModal = fraseVerbal(
          persona,
          separadoModal.verbo,
          conHave ? "pasado_ayer" : "continuo",
          negativaModal ? "negativa" : "afirmativa",
          adverbio
        );
        fraseModal.modal =
          cuerpo[0] === "might"
            ? "might"
            : cuerpo[0] === "must"
              ? "must"
              : "should";
        if (conHave) fraseModal.tiempoConfirmado = true;
        if (
          separadoModal.objeto &&
          Object.keys(separadoModal.objeto).length > 0
        ) {
          fraseModal.objeto = separadoModal.objeto;
        }
        return fraseModal;
      }
    }
    if (
      idioma === "en" &&
      (cuerpo[0] === "have" || cuerpo[0] === "has") &&
      cuerpo.length > 1
    ) {
      const separadoPerfecto = separarObjeto(cuerpo.slice(1), "en", (t) =>
        verboParticipioEn(t)
      );
      if (separadoPerfecto) {
        const frasePerfecta = fraseVerbal(
          persona,
          separadoPerfecto.verbo,
          "pasado_hoy",
          "afirmativa",
          adverbio
        );
        frasePerfecta.tiempoConfirmado = true;
        frasePerfecta.sentimiento = true;
        if (
          separadoPerfecto.objeto &&
          Object.keys(separadoPerfecto.objeto).length > 0
        ) {
          frasePerfecta.objeto = separadoPerfecto.objeto;
        }
        return frasePerfecta;
      }
    }
    if (
      idioma === "es" &&
      HABER_ES[cuerpo[0]] !== undefined &&
      cuerpo.length > 1
    ) {
      const verboHaber = verboParticipioEs(cuerpo[1]);
      if (verboHaber) {
        const fraseHaber = fraseVerbal(
          persona,
          verboHaber,
          "pasado_hoy",
          "afirmativa",
          adverbio
        );
        fraseHaber.tiempoConfirmado = true;
        fraseHaber.sentimiento = true;
        return fraseHaber;
      }
    }
    if (idioma === "es" && TENER.es.has(cuerpo[0]) && cuerpo.length === 2) {
      const idiomaTener = TENER_SENTIMIENTO_ES[desacentuar(cuerpo[1])];
      if (idiomaTener) {
        const verboSentir = idiomaTener.verbo
          ? VOCAB.verbos.find((v) => v.clave === idiomaTener.verbo)
          : verboDevenirAdjetivo(idiomaTener.adjetivo!);
        if (verboSentir) {
          const fraseSentir = fraseVerbal(
            persona,
            verboSentir,
            "pasado_hoy",
            "afirmativa",
            adverbio
          );
          fraseSentir.tiempoConfirmado = true;
          fraseSentir.sentimiento = true;
          return fraseSentir;
        }
      }
    }
    if (
      idioma === "en" &&
      cuerpo.length === 1 &&
      buscarVerboPasadoEn(cuerpo) === null
    ) {
      const verboHabitualSimple =
        habitualContexto !== null || adverbio !== undefined || maneraContexto
          ? buscarVerbo(cuerpo, "en")
          : null;
      const verboPresente =
        verboHabitualSimple ?? buscarVerboTerceraEn(cuerpo);
      if (verboPresente) {
        return fraseVerbal(
          persona,
          verboPresente,
          "continuo",
          "afirmativa",
          adverbio
        );
      }
    }
    if (
      idioma === "en" &&
      cuerpo[0] === "used" &&
      cuerpo[1] === "to" &&
      cuerpo.length > 2
    ) {
      const separadoUso = separarObjeto(cuerpo.slice(2), "en", (t) =>
        buscarVerbo(t, "en")
      );
      if (separadoUso) {
        const fraseUso = fraseVerbal(
          persona,
          separadoUso.verbo,
          "pasado_ayer",
          "afirmativa",
          adverbio
        );
        fraseUso.habitual = {};
        fraseUso.tiempoConfirmado = true;
        if (separadoUso.objeto && Object.keys(separadoUso.objeto).length > 0) {
          fraseUso.objeto = separadoUso.objeto;
        }
        return fraseUso;
      }
    }
    if (idioma === "es" && SOLER_ES[desacentuar(cuerpo[0])] && cuerpo.length > 1) {
      const separadoSolia = separarObjeto(cuerpo.slice(1), "es", (t) =>
        buscarVerbo(t, "es")
      );
      if (separadoSolia) {
        const fraseSolia = fraseVerbal(
          persona,
          separadoSolia.verbo,
          "pasado_ayer",
          "afirmativa",
          adverbio
        );
        fraseSolia.habitual = {};
        fraseSolia.tiempoConfirmado = true;
        if (
          separadoSolia.objeto &&
          Object.keys(separadoSolia.objeto).length > 0
        ) {
          fraseSolia.objeto = separadoSolia.objeto;
        }
        return fraseSolia;
      }
    }
    if (
      idioma === "en" &&
      (cuerpo[0] === "does" || cuerpo[0] === "do") &&
      cuerpo[1] === "not" &&
      cuerpo.length > 2
    ) {
      const separadoPresenteNo = separarObjeto(cuerpo.slice(2), "en", (t) =>
        buscarVerbo(t, "en")
      );
      if (separadoPresenteNo) {
        const frasePresenteNo = fraseVerbal(
          persona,
          separadoPresenteNo.verbo,
          "continuo",
          "negativa",
          adverbio
        );
        frasePresenteNo.habitual = { ...(frasePresenteNo.habitual ?? {}) };
        if (
          separadoPresenteNo.objeto &&
          Object.keys(separadoPresenteNo.objeto).length > 0
        ) {
          frasePresenteNo.objeto = separadoPresenteNo.objeto;
        }
        return frasePresenteNo;
      }
    }
    if (
      cuerpo.length >= 2 &&
      (idioma === "en"
        ? buscarVerboPasadoEn(cuerpo) === null
        : cliticoInicial !== null)
    ) {
      const verboExacto = VERBOS[idioma].get(cuerpo.join(" "));
      if (verboExacto) {
        const fraseExacta = fraseVerbal(
          persona,
          verboExacto,
          "continuo",
          "afirmativa",
          adverbio
        );
        return fraseExacta;
      }
    }
    if (idioma === "en") {
      const separadoPresente = separarObjeto(cuerpo, "en", (t) =>
        buscarVerboPresenteEn(t)
      );
      if (separadoPresente) {
        const frasePresente = fraseVerbal(
          persona,
          separadoPresente.verbo,
          "continuo",
          "afirmativa",
          adverbio
        );
        if (
          separadoPresente.objeto &&
          Object.keys(separadoPresente.objeto).length > 0
        ) {
          frasePresente.objeto = separadoPresente.objeto;
        }
        return frasePresente;
      }
    }

    if (TENER[idioma].has(cuerpo[0])) {
      const fraseTener = analizarDerivado(cuerpo.slice(1), idioma, { persona });
      if (fraseTener) return fraseTener;
    }

    if (
      idioma === "es" &&
      cuerpo[0] === "no" &&
      cuerpo.length > 1 &&
      TENER.es.has(cuerpo[1])
    ) {
      const fraseTener = analizarDerivado(cuerpo.slice(2), "es", { persona });
      if (fraseTener) {
        fraseTener.predicado.sufijo = "miriw";
        return fraseTener;
      }
    }

    if (
      idioma === "en" &&
      (cuerpo[0] === "do" || cuerpo[0] === "does") &&
      cuerpo[1] === "not" &&
      cuerpo.length > 2 &&
      TENER.en.has(cuerpo[2])
    ) {
      const fraseTener = analizarDerivado(cuerpo.slice(3), "en", { persona });
      if (fraseTener) {
        fraseTener.predicado.sufijo = "miriw";
        return fraseTener;
      }
    }

    if (idioma === "en" && (cuerpo[0] === "will" || cuerpo[0] === "shall")) {
      const negativa = cuerpo[1] === "not";
      const restoVerbo = negativa ? cuerpo.slice(2) : cuerpo.slice(1);
      const verbo = buscarVerbo(restoVerbo, "en");
      if (verbo) {
        return fraseVerbal(
          persona,
          verbo,
          tiempoFuturo(adverbio),
          negativa ? "negativa" : "afirmativa",
          adverbio
        );
      }
      if (!negativa && restoVerbo[0] === "be" && restoVerbo.length > 1) {
        const gerundioFuturoSeparado = separarObjeto(
          restoVerbo.slice(1),
          "en",
          (t) => buscarVerboGerundio(t, "en")
        );
        if (gerundioFuturoSeparado) {
          const fraseFuturaContinua = fraseVerbal(
            persona,
            gerundioFuturoSeparado.verbo,
            tiempoFuturo(adverbio),
            "afirmativa",
            adverbio,
            "continuo"
          );
          if (
            gerundioFuturoSeparado.objeto &&
            Object.keys(gerundioFuturoSeparado.objeto).length > 0
          ) {
            fraseFuturaContinua.objeto = gerundioFuturoSeparado.objeto;
          }
          return fraseFuturaContinua;
        }
      }
      const futuroSeparado = separarObjeto(restoVerbo, "en", (t) =>
        buscarVerbo(t, "en")
      );
      if (futuroSeparado && futuroSeparado.objeto) {
        const fraseFutura = fraseVerbal(
          persona,
          futuroSeparado.verbo,
          tiempoFuturo(adverbio),
          negativa ? "negativa" : "afirmativa",
          adverbio
        );
        if (Object.keys(futuroSeparado.objeto).length > 0) {
          fraseFutura.objeto = futuroSeparado.objeto;
        }
        return fraseFutura;
      }
    }

    if (
      idioma === "en" &&
      cuerpo[0] === "did" &&
      cuerpo[1] === "not" &&
      cuerpo.length > 2
    ) {
      const negadoSeparado = separarObjeto(cuerpo.slice(2), "en", (t) =>
        buscarVerbo(t, "en")
      );
      if (negadoSeparado) {
        const fraseNegada = marcarPasado(
          fraseVerbal(
            persona,
            negadoSeparado.verbo,
            tiempoPasado,
            "negativa",
            adverbio
          )
        );
        if (
          negadoSeparado.objeto &&
          Object.keys(negadoSeparado.objeto).length > 0
        ) {
          fraseNegada.objeto = negadoSeparado.objeto;
        }
        return fraseNegada;
      }
    }

    if (
      idioma === "en" &&
      (cuerpo[0] === "was" || cuerpo[0] === "were") &&
      cuerpo[1] === "not" &&
      cuerpo.length > 2
    ) {
      const negadoSeparado = separarObjeto(cuerpo.slice(2), "en", (t) =>
        buscarVerboGerundio(t, "en")
      );
      if (negadoSeparado) {
        const fraseNegada = marcarPasado(
          fraseVerbal(
            persona,
            negadoSeparado.verbo,
            tiempoPasado,
            "negativa",
            adverbio,
            "continuo"
          )
        );
        if (
          negadoSeparado.objeto &&
          Object.keys(negadoSeparado.objeto).length > 0
        ) {
          fraseNegada.objeto = negadoSeparado.objeto;
        }
        return fraseNegada;
      }
    }

    if (
      idioma === "en" &&
      (cuerpo[0] === "was" || cuerpo[0] === "were") &&
      cuerpo.length >= 2 &&
      PARTICIPIOS_ESTATIVOS_EN[cuerpo[1]] !== undefined &&
      (cuerpo.length === 2 || cuerpo[2] === "of")
    ) {
      const entradaEstativa = VOCAB.verbos.find(
        (candidato) => candidato.clave === PARTICIPIOS_ESTATIVOS_EN[cuerpo[1]]
      );
      const objetoEstativo =
        cuerpo.length > 2 ? objetoDeNP(cuerpo.slice(3), "en") : null;
      if (entradaEstativa && (cuerpo.length === 2 || objetoEstativo)) {
        const fraseEstativa = marcarPasado(
          fraseVerbal(
            persona,
            entradaEstativa,
            tiempoPasado,
            "afirmativa",
            adverbio
          )
        );
        if (objetoEstativo) fraseEstativa.objeto = objetoEstativo;
        return fraseEstativa;
      }
    }

    if (
      idioma === "en" &&
      (cuerpo[0] === "was" || cuerpo[0] === "were") &&
      cuerpo.length > 1
    ) {
      let restoGerundio = cuerpo.slice(1);
      if (
        (restoGerundio[0] === "talking" || restoGerundio[0] === "speaking") &&
        restoGerundio[1] === "to"
      ) {
        restoGerundio = [restoGerundio[0], ...restoGerundio.slice(2)];
      }
      const gerundioPasadoSeparado = separarObjeto(restoGerundio, "en", (t) =>
        buscarVerboGerundio(t, "en")
      );
      if (gerundioPasadoSeparado) {
        const frasePasadaContinua = marcarPasado(
          fraseVerbal(
            persona,
            gerundioPasadoSeparado.verbo,
            tiempoPasado,
            "afirmativa",
            adverbio,
            "continuo"
          )
        );
        if (
          gerundioPasadoSeparado.objeto &&
          Object.keys(gerundioPasadoSeparado.objeto).length > 0
        ) {
          frasePasadaContinua.objeto = gerundioPasadoSeparado.objeto;
        }
        return frasePasadaContinua;
      }
    }

    if (idioma === "en") {
      if ((cuerpo[0] === "became" || cuerpo[0] === "got") && cuerpo.length === 2) {
        const adjetivoDevenir = palabraDeTipo(cuerpo[1], "en", "adjetivo");
        if (adjetivoDevenir) {
          return marcarPasado(
            fraseVerbal(
              persona,
              verboDevenirAdjetivo(adjetivoDevenir.clave),
              tiempoPasado,
              "afirmativa",
              adverbio
            )
          );
        }
      }
      if ((cuerpo[0] === "made" || cuerpo[0] === "let") && cuerpo.length >= 3) {
        for (let corte = 1; corte < cuerpo.length - 1; corte++) {
          const finalCausado = cuerpo.slice(corte + 1);
          const adjetivoHacer =
            finalCausado.length === 1
              ? palabraDeTipo(finalCausado[0], "en", "adjetivo")
              : null;
          const verboCausado =
            buscarVerbo(finalCausado, "en") ??
            (adjetivoHacer ? verboHacerAdjetivo(adjetivoHacer.clave) : null);
          if (!verboCausado) continue;
          const npCausadoEn = cuerpo.slice(1, corte + 1);
          const esItCausado =
            npCausadoEn.length === 1 && npCausadoEn[0] === "it";
          const objetoCausado = esItCausado
            ? null
            : objetoDeNP(npCausadoEn, "en");
          if (!esItCausado && !objetoCausado) continue;
          const fraseCausada = marcarPasado(
            fraseVerbal(
              persona,
              verboCausado,
              tiempoPasado,
              "afirmativa",
              adverbio
            )
          );
          if (objetoCausado) fraseCausada.objeto = objetoCausado;
          return fraseCausada;
        }
      }
      const pasadoSeparado = separarObjeto(cuerpo, "en", (t) =>
        buscarVerboPasadoEn(t)
      );
      if (pasadoSeparado) {
        const frasePasada = marcarPasado(
          fraseVerbal(
            persona,
            pasadoSeparado.verbo,
            tiempoPasado,
            "afirmativa",
            adverbio
          )
        );
        if (
          pasadoSeparado.objeto &&
          Object.keys(pasadoSeparado.objeto).length > 0
        ) {
          frasePasada.objeto = pasadoSeparado.objeto;
        }
        return frasePasada;
      }
    }

    if (idioma === "es") {
      const negativa = cuerpo[0] === "no";
      let restoEs = negativa ? cuerpo.slice(1) : cuerpo;
      if (restoEs.length > 1 && CLITICOS_ES.has(restoEs[0])) {
        restoEs = restoEs.slice(1);
      }
      if (restoEs.length > 0) {
        const aux = FUTURO_AUX_ES[restoEs[0]];
        if (aux && restoEs[1] === "a") {
          const verbo = buscarVerbo(restoEs.slice(2), "es");
          if (verbo) {
            return conCliticoObjeto(
              fraseVerbal(
                persona,
                verbo,
                tiempoFuturo(adverbio),
                negativa ? "negativa" : "afirmativa",
                adverbio
              ),
              cliticoInicial
            );
          }
          if (!negativa && restoEs[2] === "estar" && restoEs.length > 3) {
            const verboGerundioAux = buscarVerboGerundio(restoEs.slice(3), "es");
            if (verboGerundioAux) {
              return conCliticoObjeto(
                fraseVerbal(
                  persona,
                  verboGerundioAux,
                  tiempoFuturo(adverbio),
                  "afirmativa",
                  adverbio,
                  "continuo"
                ),
                cliticoInicial
              );
            }
          }
          const auxSeparado = separarObjeto(restoEs.slice(2), "es", (t) =>
            buscarVerbo(t, "es")
          );
          if (auxSeparado && auxSeparado.objeto) {
            const fraseAux = fraseVerbal(
              persona,
              auxSeparado.verbo,
              tiempoFuturo(adverbio),
              negativa ? "negativa" : "afirmativa",
              adverbio
            );
            if (Object.keys(auxSeparado.objeto).length > 0) {
              fraseAux.objeto = auxSeparado.objeto;
            }
            return fraseAux;
          }
        }
        const progresivoPasado = ESTAR_PROGRESIVO_PASADO_ES[restoEs[0]];
        if (progresivoPasado && restoEs.length > 1) {
          const progresivoSeparado = separarObjeto(restoEs.slice(1), "es", (t) =>
            buscarVerboGerundio(t, "es")
          );
          if (progresivoSeparado) {
            const fraseProgresiva = marcarPasado(
              fraseVerbal(
                persona,
                progresivoSeparado.verbo,
                tiempoPasado,
                negativa ? "negativa" : "afirmativa",
                adverbio,
                "continuo"
              )
            );
            if (
              progresivoSeparado.objeto &&
              Object.keys(progresivoSeparado.objeto).length > 0
            ) {
              fraseProgresiva.objeto = progresivoSeparado.objeto;
            }
            return conCliticoObjeto(fraseProgresiva, cliticoInicial);
          }
        }
        const progresivoFuturo = ESTAR_PROGRESIVO_FUTURO_ES[restoEs[0]];
        if (progresivoFuturo && !negativa && restoEs.length > 1) {
          const progresivoSeparado = separarObjeto(restoEs.slice(1), "es", (t) =>
            buscarVerboGerundio(t, "es")
          );
          if (progresivoSeparado) {
            const fraseProgresiva = fraseVerbal(
              persona,
              progresivoSeparado.verbo,
              tiempoFuturo(adverbio),
              "afirmativa",
              adverbio,
              "continuo"
            );
            if (
              progresivoSeparado.objeto &&
              Object.keys(progresivoSeparado.objeto).length > 0
            ) {
              fraseProgresiva.objeto = progresivoSeparado.objeto;
            }
            return conCliticoObjeto(fraseProgresiva, cliticoInicial);
          }
        }
        const progresivoPresenteNo = PERSONA_SER_ES[restoEs[0]];
        if (progresivoPresenteNo && negativa && restoEs.length > 1) {
          const progresivoSeparado = separarObjeto(restoEs.slice(1), "es", (t) =>
            buscarVerboGerundio(t, "es")
          );
          if (progresivoSeparado) {
            const fraseProgresiva = fraseVerbal(
              persona,
              progresivoSeparado.verbo,
              "continuo",
              "negativa",
              adverbio
            );
            if (
              progresivoSeparado.objeto &&
              Object.keys(progresivoSeparado.objeto).length > 0
            ) {
              fraseProgresiva.objeto = progresivoSeparado.objeto;
            }
            return conCliticoObjeto(fraseProgresiva, cliticoInicial);
          }
        }
        if (restoEs.length === 1) {
          const sintetico = futuroSintetico(restoEs[0]);
          if (sintetico) {
            return conCliticoObjeto(
              fraseVerbal(
                persona,
                sintetico.verbo,
                tiempoFuturo(adverbio),
                negativa ? "negativa" : "afirmativa",
                adverbio
              ),
              cliticoInicial
            );
          }
          {
            const preterito = preteritoSintetico(restoEs[0]);
            if (preterito) {
              return conCliticoObjeto(
                marcarPasado(
                  fraseVerbal(
                    persona,
                    preterito.verbo,
                    tiempoPasado,
                    negativa ? "negativa" : "afirmativa",
                    adverbio
                  )
                ),
                cliticoInicial
              );
            }
          }
        }
        if (restoEs.length > 1) {
          const sinteticoMulti = futuroSintetico(restoEs[0]);
          const preteritoMulti = preteritoSintetico(restoEs[0]);
          const encontrado = sinteticoMulti ?? preteritoMulti;
          if (encontrado) {
            const objeto = analizarObjeto(restoEs.slice(1), "es");
            if (objeto) {
              const fraseObjeto = sinteticoMulti
                ? fraseVerbal(
                    persona,
                    sinteticoMulti.verbo,
                    tiempoFuturo(adverbio),
                    negativa ? "negativa" : "afirmativa",
                    adverbio
                  )
                : marcarPasado(
                    fraseVerbal(
                      persona,
                      preteritoMulti!.verbo,
                      tiempoPasado,
                      negativa ? "negativa" : "afirmativa",
                      adverbio
                    )
                  );
              if (Object.keys(objeto).length > 0) fraseObjeto.objeto = objeto;
              return fraseObjeto;
            }
          }
        }
      }
    }
  }

  if (idioma === "es") {
    const negativa = palabras[0] === "no";
    let restoEs = negativa ? palabras.slice(1) : palabras;
    let cliticoInicialSub: string | null = null;
    if (restoEs.length > 1 && CLITICOS_ES.has(restoEs[0])) {
      cliticoInicialSub = restoEs[0];
      restoEs = restoEs.slice(1);
    }
    if (
      restoEs.length === 1 &&
      PERSONA_SER_ES[restoEs[0]] &&
      (lugarPendiente || comitativoPendiente) &&
      !negativa
    ) {
      return frasePostura({ persona: PERSONA_SER_ES[restoEs[0]] });
    }
    const conjugacionEstado = ESTADOS_ES[restoEs[0]];
    if (conjugacionEstado) {
      const complemento =
        restoEs.length > 1
          ? analizarComplementoEs(restoEs.slice(1))
          : cliticoInicialSub
            ? [complementoDeClitico(cliticoInicialSub)]
            : null;
      if (restoEs.length === 1 || complemento) {
        return fraseEstado(
          conjugacionEstado.clave,
          conjugacionEstado.persona,
          complemento,
          negativa ? "negativa" : "afirmativa"
        );
      }
    }
    if (restoEs.length >= 2 && !negativa && cliticoInicialSub !== null) {
      const verboExactoSub = VERBOS.es.get(restoEs.join(" "));
      if (verboExactoSub) {
        return fraseVerbal(
          CLITICO_PERSONA_ES[cliticoInicialSub] ?? "3sg",
          verboExactoSub,
          "continuo",
          "afirmativa",
          adverbio
        );
      }
    }
    const personaHaber = HABER_ES[restoEs[0]];
    if (personaHaber !== undefined && restoEs.length > 1 && !negativa) {
      const verboHaberSub = verboParticipioEs(restoEs[1]);
      if (verboHaberSub) {
        const fraseHaberSub = fraseVerbal(
          personaHaber,
          verboHaberSub,
          "pasado_hoy",
          "afirmativa",
          adverbio
        );
        fraseHaberSub.tiempoConfirmado = true;
        fraseHaberSub.sentimiento = true;
        return conCliticoObjeto(fraseHaberSub, cliticoInicialSub);
      }
    }
    const personaTenerSentir = PERSONA_TENER_ES[restoEs[0]];
    if (
      personaTenerSentir !== undefined &&
      restoEs.length === 2 &&
      !negativa
    ) {
      const idiomaTenerSub = TENER_SENTIMIENTO_ES[desacentuar(restoEs[1])];
      if (idiomaTenerSub) {
        const verboSentirSub = idiomaTenerSub.verbo
          ? VOCAB.verbos.find((v) => v.clave === idiomaTenerSub.verbo)
          : verboDevenirAdjetivo(idiomaTenerSub.adjetivo!);
        if (verboSentirSub) {
          const fraseSentirSub = fraseVerbal(
            personaTenerSentir,
            verboSentirSub,
            "pasado_hoy",
            "afirmativa",
            adverbio
          );
          fraseSentirSub.tiempoConfirmado = true;
          fraseSentirSub.sentimiento = true;
          return fraseSentirSub;
        }
      }
    }
    const personaSerSentir = PERSONA_SER_ES[restoEs[0]];
    if (personaSerSentir !== undefined && restoEs.length === 2 && !negativa) {
      const claveSentirSub = SENTIMIENTO_ES[desacentuar(restoEs[1])];
      const adjetivoSentirSub = claveSentirSub
        ? null
        : palabraDeTipo(restoEs[1], "es", "adjetivo");
      const verboSentirSubSer = claveSentirSub
        ? VOCAB.verbos.find((v) => v.clave === claveSentirSub)
        : adjetivoSentirSub?.sentimiento
          ? verboDevenirAdjetivo(adjetivoSentirSub.clave)
          : null;
      if (verboSentirSubSer) {
        const fraseSentirSubSer = fraseVerbal(
          personaSerSentir,
          verboSentirSubSer,
          "pasado_hoy",
          "afirmativa",
          adverbio
        );
        fraseSentirSubSer.tiempoConfirmado = true;
        fraseSentirSubSer.sentimiento = true;
        return fraseSentirSubSer;
      }
    }
    const deberSub = DEBER_ES[desacentuar(restoEs[0])];
    if (deberSub !== undefined && restoEs.length > 1) {
      const separadoDeber = separarObjeto(restoEs.slice(1), "es", (t) =>
        buscarVerbo(t, "es")
      );
      if (separadoDeber) {
        const fraseDeber = fraseVerbal(
          deberSub.persona,
          separadoDeber.verbo,
          "continuo",
          negativa ? "negativa" : "afirmativa",
          adverbio
        );
        fraseDeber.modal = deberSub.modal;
        if (deberSub.persona === "1sg") {
          fraseDeber.personaAlternativa = "3sg";
        }
        if (
          separadoDeber.objeto &&
          Object.keys(separadoDeber.objeto).length > 0
        ) {
          fraseDeber.objeto = separadoDeber.objeto;
        }
        return conCliticoObjeto(fraseDeber, cliticoInicialSub);
      }
    }
    const personaSolia = SOLER_ES[desacentuar(restoEs[0])];
    if (personaSolia !== undefined && restoEs.length > 1) {
      const soliaSub = separarObjeto(restoEs.slice(1), "es", (t) =>
        buscarVerbo(t, "es")
      );
      if (soliaSub) {
        const fraseSoliaSub = fraseVerbal(
          personaSolia,
          soliaSub.verbo,
          "pasado_ayer",
          negativa ? "negativa" : "afirmativa",
          adverbio
        );
        fraseSoliaSub.habitual = {};
        fraseSoliaSub.tiempoConfirmado = true;
        if (personaSolia === "1sg") {
          fraseSoliaSub.personaAlternativa = "3sg";
        }
        if (soliaSub.objeto && Object.keys(soliaSub.objeto).length > 0) {
          fraseSoliaSub.objeto = soliaSub.objeto;
        }
        return conCliticoObjeto(fraseSoliaSub, cliticoInicialSub);
      }
    }
    const presenteSubPermitido =
      (habitualContexto !== null && restoEs.length >= 1) ||
      (negativa &&
        restoEs.length > 1 &&
        !cliticoInicialSub &&
        !desacentuar(restoEs[0]).endsWith("s"));
    if (presenteSubPermitido) {
      const presenteSub = separarObjeto(restoEs, "es", (t) =>
        buscarVerboPresenteEs(t)
      );
      if (presenteSub) {
        const frasePresenteSub = fraseVerbal(
          "3sg",
          presenteSub.verbo,
          "continuo",
          negativa ? "negativa" : "afirmativa",
          adverbio
        );
        if (negativa) frasePresenteSub.habitual = {};
        if (
          presenteSub.objeto &&
          Object.keys(presenteSub.objeto).length > 0
        ) {
          frasePresenteSub.objeto = presenteSub.objeto;
        }
        return conCliticoObjeto(frasePresenteSub, cliticoInicialSub);
      }
    }
    if (restoEs.length === 1) {
      const sintetico = futuroSintetico(restoEs[0]);
      if (sintetico) {
        return conCliticoObjeto(
          fraseVerbal(
            sintetico.persona,
            sintetico.verbo,
            tiempoFuturo(adverbio),
            negativa ? "negativa" : "afirmativa",
            adverbio
          ),
          cliticoInicialSub
        );
      }
      {
        const preterito = preteritoSintetico(restoEs[0]);
        if (preterito) {
          return conCliticoObjeto(
            marcarPasado(
              fraseVerbal(
                preterito.persona,
                preterito.verbo,
                tiempoPasado,
                negativa ? "negativa" : "afirmativa",
                adverbio
              )
            ),
            cliticoInicialSub
          );
        }
      }
    }
    if (restoEs.length > 1) {
      const sinteticoMulti = futuroSintetico(restoEs[0]);
      const preteritoMulti = preteritoSintetico(restoEs[0]);
      const encontrado = sinteticoMulti ?? preteritoMulti;
      if (encontrado) {
        const objeto = analizarObjeto(restoEs.slice(1), "es");
        if (objeto) {
          const fraseObjeto = sinteticoMulti
            ? fraseVerbal(
                sinteticoMulti.persona,
                sinteticoMulti.verbo,
                tiempoFuturo(adverbio),
                negativa ? "negativa" : "afirmativa",
                adverbio
              )
            : marcarPasado(
                fraseVerbal(
                  preteritoMulti!.persona,
                  preteritoMulti!.verbo,
                  tiempoPasado,
                  negativa ? "negativa" : "afirmativa",
                  adverbio
                )
              );
          if (Object.keys(objeto).length > 0) fraseObjeto.objeto = objeto;
          return conCliticoObjeto(fraseObjeto, cliticoInicialSub);
        }
      }
    }
    const aux = FUTURO_AUX_ES[restoEs[0]];
    if (aux && restoEs[1] === "a" && restoEs.length > 2) {
      const verboAux = buscarVerbo(restoEs.slice(2), "es");
      if (verboAux) {
        return conCliticoObjeto(
          fraseVerbal(
            aux,
            verboAux,
            tiempoFuturo(adverbio),
            negativa ? "negativa" : "afirmativa",
            adverbio
          ),
          cliticoInicialSub
        );
      }
      if (!negativa && restoEs[2] === "estar" && restoEs.length > 3) {
        const verboGerundioAux = buscarVerboGerundio(restoEs.slice(3), "es");
        if (verboGerundioAux) {
          return conCliticoObjeto(
            fraseVerbal(
              aux,
              verboGerundioAux,
              tiempoFuturo(adverbio),
              "afirmativa",
              adverbio,
              "continuo"
            ),
            cliticoInicialSub
          );
        }
      }
      const auxSeparado = separarObjeto(restoEs.slice(2), "es", (t) =>
        buscarVerbo(t, "es")
      );
      if (auxSeparado && auxSeparado.objeto) {
        const fraseAux = fraseVerbal(
          aux,
          auxSeparado.verbo,
          tiempoFuturo(adverbio),
          negativa ? "negativa" : "afirmativa",
          adverbio
        );
        if (Object.keys(auxSeparado.objeto).length > 0) {
          fraseAux.objeto = auxSeparado.objeto;
        }
        return fraseAux;
      }
    }
    const progresivoPasadoSub = ESTAR_PROGRESIVO_PASADO_ES[restoEs[0]];
    if (progresivoPasadoSub && restoEs.length > 1) {
      const progresivoSeparado = separarObjeto(restoEs.slice(1), "es", (t) =>
        buscarVerboGerundio(t, "es")
      );
      if (progresivoSeparado) {
        const frasePasado = marcarPasado(
          fraseVerbal(
            progresivoPasadoSub.persona,
            progresivoSeparado.verbo,
            tiempoPasado,
            negativa ? "negativa" : "afirmativa",
            adverbio,
            "continuo"
          )
        );
        if (progresivoPasadoSub.alternativa) {
          frasePasado.personaAlternativa = progresivoPasadoSub.alternativa;
        }
        if (
          progresivoSeparado.objeto &&
          Object.keys(progresivoSeparado.objeto).length > 0
        ) {
          frasePasado.objeto = progresivoSeparado.objeto;
        }
        return conCliticoObjeto(frasePasado, cliticoInicialSub);
      }
    }
    const progresivoFuturoSub = ESTAR_PROGRESIVO_FUTURO_ES[restoEs[0]];
    if (progresivoFuturoSub && !negativa && restoEs.length > 1) {
      const progresivoSeparado = separarObjeto(restoEs.slice(1), "es", (t) =>
        buscarVerboGerundio(t, "es")
      );
      if (progresivoSeparado) {
        const fraseFutura = fraseVerbal(
          progresivoFuturoSub,
          progresivoSeparado.verbo,
          tiempoFuturo(adverbio),
          "afirmativa",
          adverbio,
          "continuo"
        );
        if (
          progresivoSeparado.objeto &&
          Object.keys(progresivoSeparado.objeto).length > 0
        ) {
          fraseFutura.objeto = progresivoSeparado.objeto;
        }
        return conCliticoObjeto(fraseFutura, cliticoInicialSub);
      }
    }
    const personaSer = PERSONA_SER_ES[restoEs[0]];
    if (personaSer && restoEs.length > 1) {
      if (!negativa && restoEs.length === 2) {
        const adjetivo = palabraDeTipo(restoEs[1], "es", "adjetivo");
        if (adjetivo) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: { persona: personaSer },
            predicado: { tipo: "adjetivo", clave: adjetivo.clave },
          };
        }
      }
      const restoSer = quitarArticulo(restoEs.slice(1), "es");
      if (!negativa && restoSer.length === 1) {
        const sustantivoSer = palabraDeTipo(restoSer[0], "es", "sustantivo");
        if (sustantivoSer) {
          return {
            modo: "declarativa",
            polaridad: "afirmativa",
            sujeto: { persona: personaSer },
            predicado: { tipo: "sustantivo", clave: sustantivoSer.clave },
          };
        }
      }
      if (!negativa) {
        const derivadoPrep = analizarDerivadoPreposicion(restoEs.slice(1), "es", {
          persona: personaSer,
        });
        if (derivadoPrep) return derivadoPrep;
      }
      const gerundioSeparadoSub = separarObjeto(restoEs.slice(1), "es", (t) =>
        buscarVerboGerundio(t, "es")
      );
      if (gerundioSeparadoSub) {
        const fraseContinua = fraseVerbal(
          personaSer,
          gerundioSeparadoSub.verbo,
          "continuo",
          negativa ? "negativa" : "afirmativa",
          adverbio
        );
        if (
          gerundioSeparadoSub.objeto &&
          Object.keys(gerundioSeparadoSub.objeto).length > 0
        ) {
          fraseContinua.objeto = gerundioSeparadoSub.objeto;
        }
        return conCliticoObjeto(fraseContinua, cliticoInicialSub);
      }
    }
    const personaTener = PERSONA_TENER_ES[restoEs[0]];
    if (personaTener && restoEs.length > 1) {
      const fraseTener = analizarDerivado(restoEs.slice(1), "es", {
        persona: personaTener,
      });
      if (fraseTener) {
        if (negativa) fraseTener.predicado.sufijo = "miriw";
        return fraseTener;
      }
    }
  }

  const capturarObjetoImperativoNominal = (
    tokensImp: string[]
  ): {
    verbo: VerboVocabulario;
    objeto: {
      persona?: PersonaIR;
      sustantivo?: string;
      nombre?: string;
      demostrativo?: DemostrativoIR;
    };
  } | null => {
    for (let corte = tokensImp.length - 1; corte >= 1; corte--) {
      const verboCandidato = buscarVerboImperativo(
        tokensImp.slice(0, corte),
        idioma
      );
      if (!verboCandidato) continue;
      let np = quitarArticulo(tokensImp.slice(corte), idioma);
      if (idioma === "es" && np[0] === "a" && np.length > 1) {
        np = quitarArticulo(np.slice(1), "es");
      }
      if (np.length === 0 || np.length > 4) continue;
      if (["y", "e", "o", "u", "and", "or"].includes(np[0])) continue;
      const objetoNP = objetoDeNP(np, idioma);
      if (!objetoNP) continue;
      return { verbo: verboCandidato, objeto: objetoNP };
    }
    return null;
  };

  const negadores =
    idioma === "en" ? new Set(["dont", "not"]) : new Set(["no"]);
  if (negadores.has(palabras[0]) || (palabras[0] === "do" && palabras[1] === "not")) {
    const resto =
      palabras[0] === "do" ? palabras.slice(2) : palabras.slice(1);
    if (
      idioma === "en" &&
      (resto[0] === "keep" || resto[0] === "stay") &&
      resto.length > 1
    ) {
      const verboGerundioComando = buscarVerboGerundio(resto.slice(1), "en");
      if (verboGerundioComando) {
        return {
          modo: "imperativa",
          polaridad: "negativa",
          sujeto: null,
          predicado: { tipo: "verbo", clave: verboGerundioComando.clave },
          aspecto: "continuo",
        };
      }
    }
    const SEGUIR_NEGATIVO = new Set(["sigas", "siga", "sigan", "sigáis", "sigais"]);
    if (idioma === "es" && SEGUIR_NEGATIVO.has(resto[0]) && resto.length > 1) {
      const verboGerundioComando = buscarVerboGerundio(resto.slice(1), "es");
      if (verboGerundioComando) {
        return {
          modo: "imperativa",
          polaridad: "negativa",
          sujeto: null,
          predicado: { tipo: "verbo", clave: verboGerundioComando.clave },
          aspecto: "continuo",
        };
      }
    }
    let objetoNegativo: PersonaIR | null = null;
    let restoNegativo = resto;
    if (idioma === "en") {
      const OBJETO_CAPTURA_NEGATIVO: Record<string, PersonaIR> = {
        me: "1sg",
        him: "3sg",
        her: "3sg",
        us: "1pl_incl",
        them: "3pl",
      };
      const ultimoNegativo = resto[resto.length - 1];
      if (
        resto.length > 1 &&
        OBJETO_CAPTURA_NEGATIVO[ultimoNegativo] !== undefined &&
        !VERBOS.en.get(resto.join(" "))
      ) {
        objetoNegativo = OBJETO_CAPTURA_NEGATIVO[ultimoNegativo];
        restoNegativo = resto.slice(0, -1);
      }
    }
    const verbo = buscarVerboImperativo(restoNegativo, idioma);
    if (verbo) {
      return {
        modo: "imperativa",
        polaridad: "negativa",
        sujeto: null,
        predicado: { tipo: "verbo", clave: verbo.clave },
        ...(objetoNegativo ? { objeto: { persona: objetoNegativo } } : {}),
        ...(comitativoPendiente ? { comitativo: comitativoPendiente } : {}),
        ...(destinoPendiente ? { destino: destinoPendiente } : {}),
        ...(origenPendiente ? { origen: origenPendiente } : {}),
        ...(propositoPendiente ? { proposito: propositoPendiente } : {}),
        ...(instrumentoPendiente
          ? { instrumento: instrumentoPendiente }
          : {}),
        ...(perlativoPendiente ? { perlativo: perlativoPendiente } : {}),
        ...(vecesPendiente ? { veces: vecesPendiente } : {}),
      };
    }
    const capturaNominalNegativa = capturarObjetoImperativoNominal(restoNegativo);
    if (capturaNominalNegativa) {
      return {
        modo: "imperativa",
        polaridad: "negativa",
        sujeto: null,
        predicado: {
          tipo: "verbo",
          clave: capturaNominalNegativa.verbo.clave,
        },
        objeto: capturaNominalNegativa.objeto,
        ...(comitativoPendiente ? { comitativo: comitativoPendiente } : {}),
        ...(destinoPendiente ? { destino: destinoPendiente } : {}),
        ...(origenPendiente ? { origen: origenPendiente } : {}),
        ...(propositoPendiente ? { proposito: propositoPendiente } : {}),
        ...(instrumentoPendiente
          ? { instrumento: instrumentoPendiente }
          : {}),
        ...(perlativoPendiente ? { perlativo: perlativoPendiente } : {}),
        ...(vecesPendiente ? { veces: vecesPendiente } : {}),
      };
    }
    return null;
  }

  if (idioma === "en" && palabras[palabras.length - 1] === "did") {
    const sujetoTokens =
      ARTICULOS.en.has(palabras[0]) || INDEFINIDOS.en.has(palabras[0])
        ? palabras.slice(1, -1)
        : palabras.slice(0, -1);
    if (sujetoTokens.length === 1) {
      const token = sujetoTokens[0];
      const pron = PRONOMBRES.en[token];
      if (pron) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: { persona: pron },
          predicado: { tipo: "agente", clave: "agente" },
        };
      }
      const sustantivo = palabraDeTipo(token, "en", "sustantivo");
      if (sustantivo) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: { sustantivo: sustantivo.clave },
          predicado: { tipo: "agente", clave: "agente" },
        };
      }
      if (!VERBOS.en.get(token) && !ESTADOS_EN[token]) {
        return {
          modo: "declarativa",
          polaridad: "afirmativa",
          sujeto: {
            nombre: token.charAt(0).toUpperCase() + token.slice(1),
          },
          predicado: { tipo: "agente", clave: "agente" },
        };
      }
    }
  }

  if (
    palabras.length > 1 &&
    !NO_SON_NOMBRES.has(palabras[0]) &&
    !PALABRAS[idioma].get(palabras[0]) &&
    !VERBOS[idioma].get(palabras[0]) &&
    PRONOMBRES[idioma][palabras[0]] === undefined &&
    !(idioma === "en"
      ? ESTADOS_EN[palabras[0]]
      : ESTADOS_ES[palabras[0]] !== undefined)
  ) {
    const verbalNombre = analizarPredicadoVerbal(palabras.slice(1));
    if (verbalNombre) {
      verbalNombre.sujeto = {
        nombre: palabras[0].charAt(0).toUpperCase() + palabras[0].slice(1),
      };
      return verbalNombre;
    }
    if (palabras.length > 2 && TENER[idioma].has(palabras[1])) {
      const derivadoNombre = analizarDerivado(palabras.slice(2), idioma, {
        nombre: palabras[0].charAt(0).toUpperCase() + palabras[0].slice(1),
      });
      if (derivadoNombre) return derivadoNombre;
    }
  }

  if (
    idioma === "en" &&
    (palabras[0] === "keep" || palabras[0] === "stay") &&
    palabras.length > 1
  ) {
    const verboGerundioComando = buscarVerboGerundio(palabras.slice(1), "en");
    if (verboGerundioComando) {
      return {
        modo: "imperativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "verbo", clave: verboGerundioComando.clave },
        aspecto: "continuo",
      };
    }
  }
  const SEGUIR_AFIRMATIVO = new Set([
    "sigue",
    "sigan",
    "seguid",
    "continúa",
    "continua",
    "continúen",
    "continuen",
  ]);
  if (idioma === "es" && SEGUIR_AFIRMATIVO.has(palabras[0]) && palabras.length > 1) {
    const verboGerundioComando = buscarVerboGerundio(palabras.slice(1), "es");
    if (verboGerundioComando) {
      return {
        modo: "imperativa",
        polaridad: "afirmativa",
        sujeto: null,
        predicado: { tipo: "verbo", clave: verboGerundioComando.clave },
        aspecto: "continuo",
      };
    }
  }

  let objetoImperativo: PersonaIR | null = null;
  let palabrasImperativo = palabras;
  if (idioma === "en") {
    const OBJETO_CAPTURA: Record<string, PersonaIR> = {
      me: "1sg",
      him: "3sg",
      her: "3sg",
      us: "1pl_incl",
      them: "3pl",
    };
    const ultimo = palabras[palabras.length - 1];
    if (
      palabras.length > 1 &&
      OBJETO_CAPTURA[ultimo] !== undefined &&
      !VERBOS.en.get(palabras.join(" "))
    ) {
      objetoImperativo = OBJETO_CAPTURA[ultimo];
      palabrasImperativo = palabras.slice(0, -1);
    }
  } else if (palabras.length >= 1) {
    const base = desacentuar(palabras[0]);
    for (const clitico of ["me", "nos", "os"]) {
      if (base.length > clitico.length + 2 && base.endsWith(clitico)) {
        const recorte = base.slice(0, -clitico.length);
        if (buscarVerboImperativo([recorte], "es")) {
          objetoImperativo = CLITICO_PERSONA_ES[clitico];
          palabrasImperativo = [recorte, ...palabras.slice(1)];
        }
        break;
      }
    }
  }
  const verbo = buscarVerboImperativo(palabrasImperativo, idioma);
  if (verbo) {
    return {
      modo: "imperativa",
      polaridad: "afirmativa",
      sujeto: null,
      predicado: { tipo: "verbo", clave: verbo.clave },
      ...(objetoImperativo ? { objeto: { persona: objetoImperativo } } : {}),
      ...(comitativoPendiente ? { comitativo: comitativoPendiente } : {}),
      ...(lugarPendiente ? { lugar: lugarPendiente } : {}),
      ...(destinoPendiente ? { destino: destinoPendiente } : {}),
      ...(origenPendiente ? { origen: origenPendiente } : {}),
      ...(propositoPendiente ? { proposito: propositoPendiente } : {}),
      ...(instrumentoPendiente ? { instrumento: instrumentoPendiente } : {}),
      ...(perlativoPendiente ? { perlativo: perlativoPendiente } : {}),
      ...(vecesPendiente ? { veces: vecesPendiente } : {}),
      ...(adverbio ? { adverbio } : {}),
    };
  }
  const capturaNominal = capturarObjetoImperativoNominal(palabrasImperativo);
  if (capturaNominal) {
    return {
      modo: "imperativa",
      polaridad: "afirmativa",
      sujeto: null,
      predicado: { tipo: "verbo", clave: capturaNominal.verbo.clave },
      objeto: capturaNominal.objeto,
      ...(comitativoPendiente ? { comitativo: comitativoPendiente } : {}),
      ...(lugarPendiente ? { lugar: lugarPendiente } : {}),
      ...(destinoPendiente ? { destino: destinoPendiente } : {}),
      ...(origenPendiente ? { origen: origenPendiente } : {}),
      ...(propositoPendiente ? { proposito: propositoPendiente } : {}),
      ...(instrumentoPendiente ? { instrumento: instrumentoPendiente } : {}),
      ...(perlativoPendiente ? { perlativo: perlativoPendiente } : {}),
      ...(vecesPendiente ? { veces: vecesPendiente } : {}),
      ...(adverbio ? { adverbio } : {}),
    };
  }

  return null;
};

const useAnalizador = () => ({ analizar });

const reescribirCausa = (
  tokens: string[],
  idioma: IdiomaFuente
): string[] => {
  const claveCausa = claveCausaBuy(tokens, idioma);
  const conCausaBuy = claveCausa !== null;
  const contenidoTras = (indice: number): string => {
    let posicion = indice + 1;
    while (
      posicion < tokens.length &&
      (ARTICULOS[idioma].has(tokens[posicion]) ||
        INDEFINIDOS[idioma].has(tokens[posicion]) ||
        POSESIVOS_DET[idioma][tokens[posicion]] !== undefined ||
        tokens[posicion] === "its")
    ) {
      posicion += 1;
    }
    return tokens[posicion] ?? "";
  };
  const forVerbal = (indice: number): boolean => {
    const contenido = contenidoTras(indice);
    if (idioma === "en") {
      return (
        contenido === "being" ||
        buscarVerboGerundio([contenido], "en") !== null
      );
    }
    return /(ar|er|ir)(se)?$/.test(desacentuar(contenido));
  };
  const resultado: string[] = [];
  for (let indice = 0; indice < tokens.length; indice++) {
    const esBecauseOf =
      idioma === "en" &&
      tokens[indice] === "because" &&
      tokens[indice + 1] === "of";
    const esACausaDe =
      idioma === "es" &&
      ((desacentuar(tokens[indice]) === "a" &&
        desacentuar(tokens[indice + 1] ?? "") === "causa" &&
        tokens[indice + 2] === "de") ||
        (tokens[indice] === "por" &&
          desacentuar(tokens[indice + 1] ?? "") === "culpa" &&
          tokens[indice + 2] === "de"));
    if (esBecauseOf) {
      const siguiente = tokens[indice + 2] ?? "";
      resultado.push(
        conCausaBuy
          ? "about"
          : buscarVerboGerundio([siguiente], "en")
            ? "by"
            : "with"
      );
      indice += 1;
      continue;
    }
    if (
      idioma === "en" &&
      conCausaBuy &&
      tokens[indice] === "for" &&
      indice > 0 &&
      tokens.length > indice + 1 &&
      (claveCausa === "forbid" || forVerbal(indice))
    ) {
      resultado.push("about");
      continue;
    }
    if (esACausaDe) {
      resultado.push(conCausaBuy ? "sobre" : "con");
      indice += 2;
      continue;
    }
    if (
      idioma === "es" &&
      conCausaBuy &&
      tokens[indice] === "por" &&
      indice > 0 &&
      tokens.length > indice + 1 &&
      (claveCausa === "forbid" || forVerbal(indice))
    ) {
      resultado.push("sobre");
      continue;
    }
    resultado.push(tokens[indice]);
  }
  return resultado;
};

const extraerQuizas = (
  tokens: string[],
  idioma: IdiomaFuente
): string[] | null => {
  if (idioma === "en") return null;
  for (let indice = 0; indice < tokens.length; indice++) {
    const token = desacentuar(tokens[indice]);
    if ((token === "quizas" || token === "quiza") && tokens.length > 1) {
      return [...tokens.slice(0, indice), ...tokens.slice(indice + 1)];
    }
    if (
      token === "tal" &&
      desacentuar(tokens[indice + 1] ?? "") === "vez" &&
      tokens.length > 2
    ) {
      return [...tokens.slice(0, indice), ...tokens.slice(indice + 2)];
    }
  }
  return null;
};

const SELF_EN: Record<string, PersonaIR | null> = {
  myself: null,
  yourself: null,
  himself: null,
  herself: null,
  itself: null,
  ourselves: null,
  yourselves: "2pl",
  themselves: null,
};

const SELF_ES = new Set(["mismo", "misma", "mismos", "mismas"]);

const extraerEnfasisSujeto = (
  tokens: string[],
  idioma: IdiomaFuente
): { resto: string[]; persona: PersonaIR | null } | null => {
  for (let indice = 0; indice < tokens.length - 1; indice++) {
    if (PRONOMBRES[idioma][tokens[indice]] === undefined) continue;
    const siguiente = tokens[indice + 1];
    if (idioma === "en") {
      if (SELF_EN[siguiente] === undefined) continue;
      return {
        resto: [...tokens.slice(0, indice + 1), ...tokens.slice(indice + 2)],
        persona: SELF_EN[siguiente],
      };
    }
    if (!SELF_ES.has(siguiente)) continue;
    return {
      resto: [...tokens.slice(0, indice + 1), ...tokens.slice(indice + 2)],
      persona: null,
    };
  }
  return null;
};

const extraerEnfasisDhi = (
  tokens: string[],
  idioma: IdiomaFuente
): string[] | null => {
  if (tokens.length < 2) return null;
  if (idioma === "en") {
    if (tokens[tokens.length - 1] === "too") {
      return tokens.slice(0, -1);
    }
    if (
      tokens.length > 2 &&
      tokens[tokens.length - 2] === "as" &&
      tokens[tokens.length - 1] === "well"
    ) {
      return tokens.slice(0, -2);
    }
    return null;
  }
  if (desacentuar(tokens[tokens.length - 1]) === "tambien") {
    return tokens.slice(0, -1);
  }
  return null;
};

const extraerBili = (
  tokens: string[],
  idioma: IdiomaFuente
): string[] | null => {
  const marcador = idioma === "en" ? "already" : "ya";
  const indice = tokens.indexOf(marcador);
  if (indice < 0 || tokens.length < 2) return null;
  return [...tokens.slice(0, indice), ...tokens.slice(indice + 1)];
};

const extraerBalanyaNuru = (
  tokens: string[],
  idioma: IdiomaFuente
): string[] | null => {
  if (idioma === "en") {
    if (tokens[0] === "thats" && tokens[1] === "why" && tokens.length > 2) {
      return tokens.slice(2);
    }
    if (
      tokens[0] === "that" &&
      tokens[1] === "is" &&
      tokens[2] === "why" &&
      tokens.length > 3
    ) {
      return tokens.slice(3);
    }
    return null;
  }
  if (tokens[0] === "por" && tokens[1] === "eso" && tokens.length > 2) {
    return tokens.slice(2);
  }
  return null;
};

const extraerMuka = (
  tokens: string[],
  idioma: IdiomaFuente
): string[] | null => {
  if (tokens.length < 3) return null;
  if (idioma === "en") {
    const AUX_MUKA = new Set([
      "didnt",
      "dont",
      "doesnt",
      "isnt",
      "arent",
      "wasnt",
      "werent",
      "hasnt",
      "havent",
    ]);
    if (
      AUX_MUKA.has(tokens[tokens.length - 2]) &&
      PRONOMBRES.en[tokens[tokens.length - 1]] !== undefined
    ) {
      return tokens.slice(0, -2);
    }
    const AUX_MUKA_BASE = new Set([
      "did",
      "do",
      "does",
      "is",
      "are",
      "was",
      "were",
      "has",
      "have",
    ]);
    if (
      tokens.length >= 4 &&
      AUX_MUKA_BASE.has(tokens[tokens.length - 3]) &&
      tokens[tokens.length - 2] === "not" &&
      PRONOMBRES.en[tokens[tokens.length - 1]] !== undefined
    ) {
      return tokens.slice(0, -3);
    }
    if (tokens[tokens.length - 1] === "right") {
      return tokens.slice(0, -1);
    }
    return null;
  }
  if (["verdad", "cierto"].includes(desacentuar(tokens[tokens.length - 1]))) {
    return tokens.slice(0, -1);
  }
  return null;
};

const extraerRegreso = (
  tokens: string[],
  idioma: IdiomaFuente
): { resto: string[]; otraVez: boolean } | null => {
  if (idioma === "en") {
    let fin = tokens.length;
    let otraVez = false;
    if (tokens[fin - 1] === "again") {
      fin -= 1;
      otraVez = true;
    }
    if (fin >= 4 && tokens[fin - 2] === "came" && tokens[fin - 1] === "back") {
      let inicio = fin - 3;
      if (inicio >= 0 && PRONOMBRES.en[tokens[inicio]] !== undefined) {
        inicio -= 1;
      }
      if (inicio >= 0 && tokens[inicio] === "then") inicio -= 1;
      if (inicio >= 1 && tokens[inicio] === "and") {
        return { resto: tokens.slice(0, inicio), otraVez };
      }
    }
    return null;
  }
  const d = tokens.map(desacentuar);
  let fin = tokens.length;
  let otraVez = false;
  if (fin >= 2 && d[fin - 2] === "otra" && d[fin - 1] === "vez") {
    fin -= 2;
    otraVez = true;
  }
  if (fin >= 3 && ["volvio", "regreso"].includes(d[fin - 1])) {
    let inicio = fin - 2;
    if (inicio >= 0 && d[inicio] === "luego") inicio -= 1;
    if (inicio >= 1 && d[inicio] === "y") {
      return { resto: tokens.slice(0, inicio), otraVez };
    }
  }
  return null;
};

const PRIMERAS_SIN_FUSION = new Set(["like", "as", "como"]);

const fusionarMultipalabra = (
  tokens: string[],
  idioma: IdiomaFuente
): string[] => {
  const salida: string[] = [];
  let indice = 0;
  while (indice < tokens.length) {
    let fusionado = false;
    if (
      !ARTICULOS[idioma].has(tokens[indice]) &&
      !INDEFINIDOS[idioma].has(tokens[indice]) &&
      !PRIMERAS_SIN_FUSION.has(tokens[indice])
    ) {
      for (let n = 3; n >= 2; n--) {
        if (indice + n > tokens.length) continue;
        const clave = tokens.slice(indice, indice + n).join(" ");
        const entradas = PALABRAS[idioma].get(clave) ?? [];
        if (
          entradas.some(
            (palabra) =>
              palabra.tipo === "sustantivo" || palabra.tipo === "adjetivo"
          )
        ) {
          salida.push(clave);
          indice += n;
          fusionado = true;
          break;
        }
      }
    }
    if (!fusionado) {
      salida.push(tokens[indice]);
      indice += 1;
    }
  }
  return salida;
};

const analizar = (texto: string, idioma: IdiomaFuente): FraseIR | null => {
  const tokensMuka = reescribirCausa(
    fusionarMultipalabra(limpiar(texto), idioma),
    idioma
  );
  const restoMuka = extraerMuka(tokensMuka, idioma);
  const tokensTrasMuka = restoMuka ?? tokensMuka;
  const regresoExtraccion = extraerRegreso(tokensTrasMuka, idioma);
  const tokensBase = regresoExtraccion?.resto ?? tokensTrasMuka;
  const restoBalanya = extraerBalanyaNuru(tokensBase, idioma);
  const tokensIniciales = restoBalanya ?? tokensBase;
  const restoBili = extraerBili(tokensIniciales, idioma);
  const tokensPrevios = restoBili ?? tokensIniciales;
  const restoDhi = extraerEnfasisDhi(tokensPrevios, idioma);
  const tokensLimpios = restoDhi ?? tokensPrevios;
  const enfasisSujeto = extraerEnfasisSujeto(tokensLimpios, idioma);
  const tokensCrudos = enfasisSujeto?.resto ?? tokensLimpios;
  const restoQuizas = extraerQuizas(tokensCrudos, idioma);
  const tokensMomento = restoQuizas ?? tokensCrudos;
  const momentoExtraccion = extraerMomento(tokensMomento, idioma);
  const tokensHabitual = momentoExtraccion
    ? momentoExtraccion.resto
    : tokensMomento;
  const maneraExtraccion = extraerManera(tokensHabitual, idioma);
  const tokensTrasManera = maneraExtraccion?.resto ?? tokensHabitual;
  const habitualExtraccion = extraerHabitual(tokensTrasManera, idioma);
  const tokensNucleo = habitualExtraccion?.resto ?? tokensTrasManera;
  const inversionEntonacion =
    idioma === "en" &&
    tokensNucleo.length >= 3 &&
    tokensNucleo[0] === "will" &&
    PRONOMBRES.en[tokensNucleo[1]] !== undefined;
  const tokensEntonacion = inversionEntonacion
    ? [tokensNucleo[1], tokensNucleo[0], ...tokensNucleo.slice(2)]
    : tokensNucleo;
  const textoNucleo = tokensEntonacion.join(" ");
  habitualContexto = habitualExtraccion?.habitual ?? null;
  maneraContexto = maneraExtraccion !== null;
  const frase = analizarNucleo(textoNucleo, idioma);
  if (frase && maneraExtraccion && !frase.manera) {
    if (maneraExtraccion.gradoAdjetivo) {
      if (frase.predicado.tipo === "adjetivo") {
        frase.manera = maneraExtraccion.manera;
      }
    } else if (frase.predicado.tipo === "verbo") {
      frase.manera = maneraExtraccion.manera;
    }
  }
  if (frase && momentoExtraccion) {
    frase.momento = momentoExtraccion.momento;
  }
  if (
    frase &&
    restoQuizas &&
    frase.predicado.tipo === "verbo" &&
    frase.modo === "declarativa" &&
    !frase.modal
  ) {
    frase.modal = "might";
  }
  if (
    frase &&
    habitualExtraccion &&
    frase.predicado.tipo === "verbo" &&
    (frase.modo === "declarativa" ||
      (frase.modo === "imperativa" &&
        habitualExtraccion.habitual.diario === true)) &&
    !frase.inminente
  ) {
    frase.habitual = { ...(frase.habitual ?? {}), ...habitualExtraccion.habitual };
  }
  if (frase && enfasisSujeto && frase.sujeto?.persona !== undefined) {
    frase.sujeto = {
      ...frase.sujeto,
      enfatico: true,
      ...(enfasisSujeto.persona ? { persona: enfasisSujeto.persona } : {}),
    };
  }
  if (frase && restoDhi) {
    frase.enfasisDhi = true;
  }
  if (frase && restoBili && frase.predicado.tipo === "verbo") {
    frase.bili = true;
  }
  if (frase && restoBalanya) {
    frase.balanyaNuru = true;
  }
  if (frase && restoMuka) {
    frase.muka = true;
  }
  if (frase && regresoExtraccion) {
    frase.regreso = regresoExtraccion.otraVez ? { otraVez: true } : {};
  }
  if (
    frase &&
    frase.modo === "declarativa" &&
    !frase.muka &&
    frase.yanapi === undefined &&
    (inversionEntonacion || texto.trim().endsWith("?"))
  ) {
    frase.modo = "interrogativa";
    frase.entonacion = true;
  }
  if (frase) frase.idioma = idioma;
  if (
    frase?.perlativo?.demostrativo !== undefined &&
    frase.predicado.tipo === "verbo" &&
    frase.manera === undefined
  ) {
    frase.manera =
      frase.perlativo.demostrativo === "este"
        ? "dhuwalatjan"
        : "ŋulatjan";
    delete frase.perlativo.demostrativo;
  }
  if (frase?.objeto?.reflexivo && frase.objeto.persona === undefined) {
    frase.objeto.persona = frase.sujeto?.persona ?? "3pl";
  }
  if (
    frase?.objeto?.parteCuerpo !== undefined &&
    frase.objeto.persona !== undefined &&
    frase.sujeto?.persona === frase.objeto.persona &&
    frase.modo === "declarativa"
  ) {
    frase.objeto.reflexivo = true;
  }
  if (
    frase?.predicado.tipo === "verbo" &&
    frase.objeto?.sustantivo !== undefined &&
    frase.destino === undefined &&
    VOCAB.verbos.find(
      (candidato) => candidato.clave === frase.predicado.clave
    )?.subida === true
  ) {
    frase.destino = { sustantivo: frase.objeto.sustantivo };
    delete frase.objeto;
  }
  if (
    frase?.predicado.tipo === "verbo" &&
    (frase.predicado.clave === "finish" || frase.predicado.clave === "cease") &&
    frase.proposito?.verbo !== undefined &&
    frase.accionNuru === undefined
  ) {
    frase.accionNuru = frase.proposito.verbo;
    if (frase.proposito.sustantivo !== undefined) {
      frase.objetoNuru = frase.proposito.sustantivo;
    }
    delete frase.proposito;
  }
  return frase;
};

export { analizar, limpiar };

export default useAnalizador;
