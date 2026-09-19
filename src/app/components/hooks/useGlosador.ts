import vocabulario from "../../ridjin/traductor/book/vocabulario.json";
import {
  GlosaPalabra,
  GlosaParte,
  PersonaIR,
  Vocabulario,
} from "../types/ridjin.type";
import { LIBRO } from "./useVerbos";

const VOCAB = vocabulario as unknown as Vocabulario;

const PERSONAS_GLOSA: Record<PersonaIR, { es: string; en: string }> = {
  "1sg": { es: "yo", en: "I" },
  "2sg": { es: "tú", en: "you" },
  "3sg": { es: "él/ella", en: "he/she" },
  "1dual_incl": { es: "nosotros dos (tú y yo)", en: "we two (you and I)" },
  "1dual_excl": { es: "nosotros dos (sin ti)", en: "we two (not you)" },
  "2dual": { es: "ustedes dos", en: "you two" },
  "3dual": { es: "ellos dos", en: "those two" },
  "1pl_incl": { es: "nosotros (contigo)", en: "we (with you)" },
  "1pl_excl": { es: "nosotros (sin ti)", en: "we (not you)" },
  "2pl": { es: "ustedes/vosotros", en: "you all" },
  "3pl": { es: "ellos/ellas", en: "they" },
} as Record<PersonaIR, { es: string; en: string }>;

const PARTICULAS_GLOSA: Record<string, { es: string; en: string }> = {
  dhu: { es: "(futuro)", en: "(future)" },
  yurru: { es: "(futuro) / pero", en: "(future) / but" },
  ga: { es: "(en curso) / y", en: "(ongoing) / and" },
  yukurra: { es: "(en curso)", en: "(ongoing)" },
  gana: { es: "(en curso, pasado)", en: "(ongoing, past)" },
  ganha: { es: "(en curso, pasado)", en: "(ongoing, past)" },
  gi: { es: "(en curso, con negación/modal)", en: "(ongoing, with negative/modal)" },
  ŋuli: { es: "(habitual) / debería / cuando", en: "(habitual) / should / when" },
  yaka: { es: "no", en: "not / don't" },
  bäyŋu: { es: "no / nada", en: "not / nothing" },
  bili: { es: "ya / mismo / porque", en: "already / same / because" },
  muka: { es: "¿verdad?", en: "isn't it? / right?" },
  ŋunhi: { es: "que / cuando / ese", en: "that / when / that one" },
  ŋanydja: { es: "o / pero", en: "or / but" },
  bala: { es: "y luego / hacia allá", en: "and then / away" },
  räli: { es: "hacia aquí", en: "towards here" },
  maku: { es: "o", en: "or" },
  märr: { es: "para que / porque", en: "so that / because" },
  yäna: { es: "(no más, solo)", en: "(just, only)" },
  warray: { es: "(partícula, sin equivalente)", en: "(particle, no equivalent)" },
  balaŋu: { es: "quizás / debería", en: "might / should" },
  bäna: { es: "(modal del pasado)", en: "(past modal)" },
  bäy: { es: "cuando", en: "when" },
  yanapi: { es: "creía que... (equivocado)", en: "thought... (mistakenly)" },
  yuwalk: { es: "verdad / cierto", en: "true" },
  yurruna: { es: "antes de / y luego", en: "before / and then" },
  dhäŋuru: { es: "después de (del final de)", en: "after (from the end of)" },
  dhurrwaraŋuru: { es: "después de", en: "after" },
  ŋuliŋuru: { es: "de entonces", en: "from then" },
  wanha: { es: "dónde / a ver si", en: "where / how about" },
  nhä: { es: "qué", en: "what" },
  yol: { es: "quién", en: "who" },
  mala: { es: "grupo (plural)", en: "group (plural)" },
  galki: { es: "cerca", en: "near" },
  barrku: { es: "lejos", en: "far" },
  ŋäthili: { es: "primero / antes", en: "first / before" },
  ŋathili: { es: "no más / primero", en: "just / first" },
  nhakuna: { es: "como (comparación)", en: "like / as" },
  balanya: { es: "así, de este tipo", en: "like this, of this kind" },
  wiripu: { es: "otro", en: "other" },
};

type GlosaBase = { es: string; en: string };

const OBLICUO_ES: Partial<Record<PersonaIR, string>> = {
  "1sg": "mí",
  "2sg": "ti",
};

const RAICES_OBLICUAS: Record<string, PersonaIR> = {
  rra: "1sg",
  nho: "2sg",
  nhanu: "3sg",
  nhumala: "2dual",
};

const INTERROGATIVOS_GLOSA: Record<string, GlosaBase> = {
  que: { es: "qué", en: "what" },
  nhaltjan: { es: "cómo", en: "how" },
  yolku: { es: "para quién", en: "for whom" },
  nhaku: { es: "para qué", en: "what for" },
  yolthu: { es: "quién (quien hace)", en: "who (the doer)" },
  yol: { es: "quién", en: "who" },
  wanha: { es: "dónde", en: "where" },
  yolkala: { es: "con quién / a quién", en: "with whom / to whom" },
  nhakurru: { es: "por dónde", en: "which way" },
  nhalili: { es: "hacia dónde", en: "where to" },
  wanhanguru: { es: "de dónde", en: "where from" },
  nhanguru: { es: "de qué", en: "from what" },
  nhaliy: { es: "con qué (instrumento)", en: "with what (instrument)" },
  nhapuy: { es: "acerca de qué", en: "about what" },
  wanhanguwuy: { es: "de qué lugar", en: "belonging to where" },
  nhamunhamirri: { es: "cuántos", en: "how many" },
  wanhami: { es: "dónde", en: "where" },
  wanhala: { es: "en dónde", en: "where at" },
};

const construirLexico = (): Map<string, GlosaBase> => {
  const lexico = new Map<string, GlosaBase>();
  const poner = (gup: string | undefined, glosa: GlosaBase): void => {
    if (!gup) return;
    if (!lexico.has(gup)) lexico.set(gup, glosa);
  };
  for (const [clave, glosa] of Object.entries(PARTICULAS_GLOSA)) {
    poner(clave, glosa);
  }
  for (const [persona, gup] of Object.entries(VOCAB.pronombres)) {
    poner(gup, PERSONAS_GLOSA[persona as PersonaIR]);
  }
  for (const [raiz, persona] of Object.entries(RAICES_OBLICUAS)) {
    poner(raiz, PERSONAS_GLOSA[persona]);
  }
  poner("dhiya", { es: "este", en: "this" });
  poner("ŋuri", { es: "ese", en: "that" });
  for (const [persona, gup] of Object.entries(VOCAB.posesivos)) {
    const base = PERSONAS_GLOSA[persona as PersonaIR];
    const oblicuo = OBLICUO_ES[persona as PersonaIR] ?? base.es;
    poner(gup, { es: `de ${oblicuo}`, en: `${base.en}'s` });
  }
  for (const [persona, gup] of Object.entries(VOCAB.objetos)) {
    const base = PERSONAS_GLOSA[persona as PersonaIR];
    const oblicuo = OBLICUO_ES[persona as PersonaIR] ?? base.es;
    poner(gup, { es: `a ${oblicuo} (objeto)`, en: `${base.en} (object)` });
  }
  for (const [persona, gup] of Object.entries(VOCAB.comitativos)) {
    const base = PERSONAS_GLOSA[persona as PersonaIR];
    const oblicuo = OBLICUO_ES[persona as PersonaIR] ?? base.es;
    poner(gup, { es: `a/con ${oblicuo}`, en: `to/with ${base.en}` });
    poner(`${gup}ŋuŋuru`, { es: `desde ${oblicuo}`, en: `away from ${base.en}` });
    poner(`${gup}ŋuwuy`, {
      es: `perteneciente a ${oblicuo}`,
      en: `belonging to ${base.en}`,
    });
  }
  for (const [persona, gup] of Object.entries(VOCAB.posesivos)) {
    const base = PERSONAS_GLOSA[persona as PersonaIR];
    const oblicuo = OBLICUO_ES[persona as PersonaIR] ?? base.es;
    poner(`${gup}ŋu`, {
      es: `recibido de ${oblicuo}`,
      en: `received from ${base.en}`,
    });
  }
  for (const [persona, gup] of Object.entries(VOCAB.objetosEnfaticos)) {
    const base = PERSONAS_GLOSA[persona as PersonaIR];
    const oblicuo = OBLICUO_ES[persona as PersonaIR] ?? base.es;
    poner(gup, { es: `a ${oblicuo} mismo`, en: `${base.en}self` });
  }
  for (const [clave, gup] of Object.entries(VOCAB.demostrativos ?? {})) {
    poner(gup, { es: clave, en: clave });
  }
  for (const serie of Object.values(VOCAB.demostrativosCasuales ?? {})) {
    for (const gup of Object.values(serie as Record<string, string>)) {
      poner(gup, { es: "este/ese (con caso)", en: "this/that (case form)" });
    }
  }
  for (const serie of Object.values(VOCAB.demostrativosCasualesAlternos ?? {})) {
    for (const lista of Object.values(serie as Record<string, string[]>)) {
      for (const gup of lista) {
        poner(gup, { es: "este/ese (con caso)", en: "this/that (case form)" });
      }
    }
  }
  for (const estado of VOCAB.estados) {
    poner(estado.gup, {
      es: estado.es[0] ?? estado.clave,
      en: estado.en[0] ?? estado.clave,
    });
  }
  for (const cuantificador of VOCAB.cuantificadores) {
    poner(cuantificador.gup, {
      es: cuantificador.es[0] ?? cuantificador.clave,
      en: cuantificador.en[0] ?? cuantificador.clave,
    });
  }
  for (const [clave, gup] of Object.entries(VOCAB.interrogativos)) {
    const glosa = INTERROGATIVOS_GLOSA[clave];
    if (glosa) poner(gup, glosa);
  }
  for (const conjuncion of VOCAB.conjunciones ?? []) {
    poner(conjuncion.gup, {
      es: conjuncion.es[0] ?? conjuncion.clave,
      en: conjuncion.en[0] ?? conjuncion.clave,
    });
  }
  for (const palabra of VOCAB.palabras) {
    poner(palabra.gup, {
      es: palabra.es[0] ?? palabra.clave,
      en: palabra.en[0] ?? palabra.clave,
    });
    for (const base of palabra.basesAlternas ?? []) {
      poner(base, {
        es: palabra.es[0] ?? palabra.clave,
        en: palabra.en[0] ?? palabra.clave,
      });
    }
    for (const base of [palabra.baseSufijos, palabra.baseDireccional]) {
      poner(base, {
        es: palabra.es[0] ?? palabra.clave,
        en: palabra.en[0] ?? palabra.clave,
      });
    }
  }
  const glosaEsPorLema = new Map<string, string>();
  for (const verbo of VOCAB.verbos) {
    if (verbo.lema && verbo.es[0]) glosaEsPorLema.set(verbo.lema, verbo.es[0]);
  }
  const FORMAS_ETIQUETA: Record<string, string> = {
    I: "forma primaria",
    II: "forma secundaria",
    III: "forma terciaria",
    IV: "forma cuaternaria",
  };
  for (const verbo of LIBRO.verbs) {
    const es = glosaEsPorLema.get(verbo.lemma) ?? verbo.gloss;
    for (const [forma, lista] of Object.entries(verbo.forms ?? {})) {
      for (const gup of lista as string[]) {
        poner(gup, {
          es: `${es} (${FORMAS_ETIQUETA[forma] ?? forma})`,
          en: `${verbo.gloss} (${FORMAS_ETIQUETA[forma] ?? forma})`,
        });
      }
    }
    for (const particula of verbo.particle ?? []) {
      poner(particula, {
        es: `${es} (partícula)`,
        en: `${verbo.gloss} (particle)`,
      });
    }
  }
  for (const variante of VOCAB.variantes) {
    const canonica = lexico.get(variante.gup);
    if (!canonica) continue;
    for (const forma of variante.formas) {
      poner(forma.forma, canonica);
    }
  }
  return lexico;
};

const LEXICO = construirLexico();

const SUFIJOS_ORDENADOS = (VOCAB.sufijos ?? [])
  .flatMap((sufijo) =>
    sufijo.formas.map((forma) => ({
      forma,
      es: sufijo.glosa_es,
      en: sufijo.glosa_en,
    }))
  )
  .sort((a, b) => b.forma.length - a.forma.length);

const desglosarSufijos = (resto: string): GlosaParte[] | null => {
  if (resto.length === 0) return [];
  for (const sufijo of SUFIJOS_ORDENADOS) {
    if (!resto.startsWith(sufijo.forma)) continue;
    const cola = desglosarSufijos(resto.slice(sufijo.forma.length));
    if (cola !== null) {
      return [
        {
          texto: `-${sufijo.forma}`,
          es: sufijo.es,
          en: sufijo.en,
          tipo: "sufijo",
        },
        ...cola,
      ];
    }
  }
  return null;
};

const esNombrePropio = (texto: string): boolean =>
  texto.length > 1 && texto.charAt(0) === texto.charAt(0).toUpperCase();

const SUFIJOS_DE_NOMBRE = new Set([
  "y",
  "thu",
  "dhu",
  "yu",
  "nha",
  "ku",
  "gu",
  "wu",
  "lili",
  "ŋura",
  "ŋuru",
  "kala",
  "gala",
  "kalaŋuwuy",
  "galaŋuwuy",
  "kalaŋuŋuru",
  "galaŋuŋuru",
]);

const VOCALES = new Set(["a", "e", "i", "o", "u", "ä"]);

const desglosarSufijosDeNombre = (resto: string): GlosaParte[] | null => {
  const partes = desglosarSufijos(resto);
  if (partes === null || partes.length === 0) return null;
  for (const parte of partes) {
    if (!SUFIJOS_DE_NOMBRE.has(parte.texto.slice(1))) return null;
  }
  return partes;
};

const glosarNucleo = (nucleo: string): GlosaParte[] => {
  const directo =
    LEXICO.get(nucleo) ??
    LEXICO.get(nucleo.toLowerCase()) ??
    LEXICO.get(`${nucleo}'`) ??
    LEXICO.get(`${nucleo.toLowerCase()}'`);
  if (directo) {
    return [{ texto: nucleo, es: directo.es, en: directo.en, tipo: "raiz" }];
  }
  for (let corte = nucleo.length - 1; corte >= 1; corte--) {
    const prefijo = nucleo.slice(0, corte);
    const base =
      LEXICO.get(prefijo) ?? LEXICO.get(prefijo.toLowerCase());
    if (!base) continue;
    const resto = nucleo.slice(corte);
    const sufijos = desglosarSufijos(
      resto.startsWith("'") ? resto.slice(1) : resto
    );
    if (sufijos !== null) {
      return [
        { texto: prefijo, es: base.es, en: base.en, tipo: "raiz" },
        ...sufijos,
      ];
    }
  }
  if (esNombrePropio(nucleo)) {
    for (let corte = nucleo.length - 1; corte >= 3; corte--) {
      const base = nucleo.slice(0, corte);
      if (!VOCALES.has(base.charAt(base.length - 1))) continue;
      const sufijos = desglosarSufijosDeNombre(nucleo.slice(corte));
      if (sufijos !== null) {
        return [
          { texto: base, es: "nombre propio", en: "proper name", tipo: "raiz" },
          ...sufijos,
        ];
      }
    }
    return [
      { texto: nucleo, es: "nombre propio", en: "proper name", tipo: "raiz" },
    ];
  }
  return [{ texto: nucleo, es: "—", en: "—", tipo: "raiz" }];
};

const tieneGlosaReal = (partes: GlosaParte[]): boolean =>
  partes.some((parte) => parte.es !== "—" && parte.es !== "nombre propio");

const glosarToken = (nucleo: string): GlosaParte[] => {
  const entero = glosarNucleo(nucleo);
  if (!nucleo.includes("-") || tieneGlosaReal(entero)) return entero;
  const divididas = nucleo
    .split("-")
    .filter((mitad) => mitad.length > 0)
    .flatMap((mitad) => glosarNucleo(mitad));
  return tieneGlosaReal(divididas) ? divididas : entero;
};

const glosar = (gup: string): GlosaPalabra[] =>
  gup
    .split(" ")
    .filter((token) => token.length > 0)
    .map((token) => {
      const nucleo = token.replace(/[?!,.]+$/, "");
      if (nucleo.length === 0) return { palabra: token, partes: [] };
      return { palabra: token, partes: glosarToken(nucleo) };
    });

const useGlosador = () => ({ glosar });

export { glosar };

export default useGlosador;
