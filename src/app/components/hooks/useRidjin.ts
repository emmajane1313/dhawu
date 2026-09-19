import lecciones from "../../ridjin/traductor/book/lessons.json";
import vocabulario from "../../ridjin/traductor/book/vocabulario.json";
import {
  AlternativaGenerada,
  FraseIR,
  IdiomaFuente,
  LibroLecciones,
  ResultadoVerificacion,
  TraduccionGenerada,
  Vocabulario,
} from "../types/ridjin.type";
import { analizar, limpiar } from "./useAnalizador";
import { generar } from "./useGenerador";
import { glosar } from "./useGlosador";

const LIBRO = lecciones as unknown as LibroLecciones;
const VOCAB = vocabulario as unknown as Vocabulario;

const CONJUNCIONES: Record<IdiomaFuente, Set<string>> = {
  es: new Set(VOCAB.conjuncion.es),
  en: new Set(VOCAB.conjuncion.en),
};

const normalizarClave = (texto: string): string => limpiar(texto).join(" ");

const expandirBarra = (texto: string): string[] => {
  const partes = texto.split(" ");
  const indice = partes.findIndex((parte) => parte.includes("/"));
  if (indice === -1) return [texto];
  return partes[indice]
    .split("/")
    .map((opcion) =>
      [...partes.slice(0, indice), opcion, ...partes.slice(indice + 1)].join(
        " "
      )
    );
};

const variantesDeEjemplo = (en: string): string[] => {
  const variantes = new Set<string>();
  const bases = [en, en.replace(/\([^)]*\)/g, " ")];
  for (const base of bases) {
    const segmentos = base.split(/[!?.]/).filter((s) => s.trim().length > 0);
    const conjunto = segmentos.length > 1 ? [base, ...segmentos] : [base];
    for (const segmento of conjunto) {
      for (const variante of expandirBarra(segmento.trim())) {
        variantes.add(variante);
      }
    }
  }
  return [...variantes];
};

const construirAtestadas = (): Map<string, { gup: string; leccion: number }> => {
  const mapa = new Map<string, { gup: string; leccion: number }>();
  for (const leccion of LIBRO.lessons) {
    for (const ejemplo of leccion.examples) {
      for (const variante of variantesDeEjemplo(ejemplo.en)) {
        const clave = normalizarClave(variante);
        if (clave && !mapa.has(clave)) {
          mapa.set(clave, { gup: ejemplo.gup, leccion: leccion.lesson });
        }
      }
    }
  }
  return mapa;
};

const ATESTADAS = construirAtestadas();

const componer = (
  texto: string,
  idioma: IdiomaFuente
): TraduccionGenerada | null => {
  const frase = analizar(texto, idioma);
  if (!frase) return null;
  return generar(frase);
};

const quitarPuntuacionFinal = (texto: string): string =>
  texto.replace(/[!?]+$/, "");

const minuscularInicial = (texto: string): string =>
  texto.charAt(0).toLowerCase() + texto.slice(1);

const unirSegmento = (gup: string, indice: number, ultimo: boolean): string => {
  let resultado = ultimo ? gup : quitarPuntuacionFinal(gup);
  if (indice > 0) resultado = minuscularInicial(resultado);
  return resultado;
};

const LIMPIAR_BORDE = /[¿?¡!.,;:()]/g;

const PRONOMBRES_BORDE: Record<IdiomaFuente, Set<string>> = {
  es: new Set([
    "yo",
    "tú",
    "tu",
    "usted",
    "él",
    "el",
    "ella",
    "ustedes",
    "vosotros",
    "vosotras",
    "ellos",
    "ellas",
    "nosotros",
    "nosotras",
  ]),
  en: new Set(["i", "me", "you", "he", "she", "they", "we"]),
};

const PRONOMBRES_BORDE_DESPUES: Record<IdiomaFuente, Set<string>> = {
  es: PRONOMBRES_BORDE.es,
  en: new Set(["me", "him", "her", "us", "them", "you"]),
};

type EntradaConjuncion = NonNullable<Vocabulario["conjunciones"]>[number];

const CONJUNCIONES_LIBRO: EntradaConjuncion[] = VOCAB.conjunciones ?? [];

const formasConjuncion = (
  idioma: IdiomaFuente
): { forma: string; entrada: EntradaConjuncion }[] =>
  CONJUNCIONES_LIBRO.flatMap((entrada) =>
    (idioma === "es" ? entrada.es : entrada.en).map((forma) => ({
      forma,
      entrada,
    }))
  ).sort((a, b) => b.forma.length - a.forma.length);

const dividirRegiones = (
  texto: string,
  idioma: IdiomaFuente
): { segmentos: string[]; separadores: (EntradaConjuncion | ",")[] } => {
  const formas = formasConjuncion(idioma);
  const alternacion = formas
    .map((par) => par.forma.replace(/ /g, "\\s+"))
    .join("|");
  const patron = new RegExp(`([,;]|\\s(?:${alternacion})\\s)`, "i");
  const segmentos: string[] = [];
  const separadores: (EntradaConjuncion | ",")[] = [];
  let pendiente: EntradaConjuncion | "," | null = null;
  let restante = texto;
  let desde = 0;
  while (true) {
    const zona = restante.slice(desde);
    const coincidencia = zona.match(patron);
    if (!coincidencia || coincidencia.index === undefined) {
      const limpio = restante.trim();
      if (limpio) {
        if (segmentos.length > 0) separadores.push(pendiente ?? ",");
        segmentos.push(limpio);
      }
      break;
    }
    const posicion = desde + coincidencia.index;
    const separador = coincidencia[0]
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    const entradaSeparador = formas.find(
      (par) => par.forma === separador
    )?.entrada;
    if (entradaSeparador) {
      const palabrasAntes = restante.slice(0, posicion).trim().split(/\s+/);
      const palabrasDespues = restante
        .slice(posicion + coincidencia[0].length)
        .trim()
        .split(/\s+/);
      const bordeAntes = (palabrasAntes[palabrasAntes.length - 1] ?? "")
        .replace(LIMPIAR_BORDE, "")
        .toLowerCase();
      const bordeDespues = (palabrasDespues[0] ?? "")
        .replace(LIMPIAR_BORDE, "")
        .toLowerCase();
      if (
        PRONOMBRES_BORDE[idioma].has(bordeAntes) &&
        PRONOMBRES_BORDE_DESPUES[idioma].has(bordeDespues)
      ) {
        desde = posicion + coincidencia[0].length;
        continue;
      }
    }
    const antes = restante.slice(0, posicion).trim();
    if (antes) {
      if (segmentos.length > 0) separadores.push(pendiente ?? ",");
      segmentos.push(antes);
      pendiente = null;
    }
    const marca: EntradaConjuncion | "," = entradaSeparador ?? ",";
    if (pendiente === null || marca !== ",") pendiente = marca;
    restante = restante.slice(posicion + coincidencia[0].length);
    desde = 0;
  }
  return { segmentos, separadores };
};

const unirPartes = (partes: string[], separadores: string[]): string =>
  partes.reduce(
    (acumulado, parte, indice) =>
      indice === 0 ? parte : `${acumulado}${separadores[indice - 1]}${parte}`,
    ""
  );

const AUXILIARES_PREFIJO_EN = new Set([
  "will",
  "is",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "can",
  "must",
  "should",
]);

const FUNCION_MAKU = new Set([
  "is",
  "are",
  "was",
  "were",
  "do",
  "does",
  "did",
  "will",
  "he",
  "she",
  "it",
  "they",
  "we",
  "you",
  "i",
  "this",
  "that",
  "not",
  "es",
  "son",
  "está",
  "esta",
  "mine",
  "yours",
  "his",
  "hers",
  "ours",
  "theirs",
  "mío",
  "mio",
  "mía",
  "mia",
  "tuyo",
  "tuya",
  "suyo",
  "suya",
  "nuestro",
  "nuestra",
]);

const ARTICULOS_MAKU: Record<IdiomaFuente, Set<string>> = {
  en: new Set(["a", "an", "the", "some"]),
  es: new Set(["un", "una", "unos", "unas", "el", "la", "los", "las"]),
};

const intentarMakuO = (
  texto: string,
  idioma: IdiomaFuente
): TraduccionGenerada | null => {
  const tokens = limpiar(texto);
  const marcadorO = idioma === "es" ? new Set(["o", "u"]) : new Set(["or"]);
  const indice = tokens.findIndex((token) => marcadorO.has(token));
  if (indice <= 0 || indice >= tokens.length - 1) return null;
  let candidatos = tokens.slice(indice + 1);
  if (ARTICULOS_MAKU[idioma].has(candidatos[0]) && candidatos.length > 1) {
    candidatos = candidatos.slice(1);
  }
  for (const largo of [2, 1]) {
    if (candidatos.length < largo) continue;
    const np = candidatos.slice(0, largo).join(" ");
    const restoDespues = candidatos.slice(largo);
    const cuantificador = VOCAB.cuantificadores.find((candidato) =>
      (idioma === "es" ? candidato.es : candidato.en).includes(np)
    );
    const palabra = VOCAB.palabras.find(
      (candidato) =>
        candidato.tipo === "sustantivo" &&
        (idioma === "es" ? candidato.es : candidato.en).includes(np)
    );
    const esVerbo = VOCAB.verbos.some((candidato) =>
      (idioma === "es" ? candidato.es : candidato.en).includes(np)
    );
    const esNombre =
      !cuantificador &&
      !palabra &&
      largo === 1 &&
      !esVerbo &&
      !FUNCION_MAKU.has(np) &&
      /^[a-zŋäḻṉḏṯḏy']+$/.test(np);
    if (!cuantificador && !palabra && !esNombre) continue;
    const base = componer(
      [...tokens.slice(0, indice), ...restoDespues].join(" "),
      idioma
    );
    if (!base) continue;
    const reglasMaku = [...base.reglas, { leccion: 93, regla: "conjunciones" }];
    if (cuantificador) {
      const previo = VOCAB.cuantificadores.find((candidato) =>
        (idioma === "es" ? candidato.es : candidato.en).includes(
          tokens[indice - 1]
        )
      );
      if (!previo) continue;
      const insertar = (gup: string): string => {
        const partes = gup.split(" ");
        const posicionNumero = partes.findIndex(
          (parte) => parte.toLowerCase() === previo.gup.toLowerCase()
        );
        if (posicionNumero < 0) return gup;
        return [
          ...partes.slice(0, posicionNumero + 1),
          "maku",
          cuantificador.gup,
          ...partes.slice(posicionNumero + 1),
        ].join(" ");
      };
      if (insertar(base.gup) === base.gup) continue;
      return {
        ...base,
        gup: insertar(base.gup),
        reglas: reglasMaku,
        alternativas: base.alternativas?.map((alternativa) => ({
          ...alternativa,
          gup: insertar(alternativa.gup),
        })),
      };
    }
    const cola =
      palabra && palabra.persona !== true
        ? ` nhä maku ${palabra.gup}`
        : ` yol maku ${
            palabra
              ? palabra.gup
              : `${np.charAt(0).toUpperCase()}${np.slice(1)}`
          }`;
    const anexar = (gup: string): string => {
      const fin = gup.endsWith("?") || gup.endsWith("!") ? gup.slice(-1) : "";
      const cuerpo = fin ? gup.slice(0, -1) : gup;
      return `${cuerpo}${cola}${fin}`;
    };
    return {
      ...base,
      gup: anexar(base.gup),
      reglas: reglasMaku,
      alternativas: base.alternativas?.map((alternativa) => ({
        ...alternativa,
        gup: anexar(alternativa.gup),
      })),
    };
  }
  return null;
};

const SABER_SUBORDINADA_EN = new Set(["know", "knew", "heard", "hear"]);

const unirSubordinada = (
  principal: TraduccionGenerada,
  subordinada: TraduccionGenerada,
  nexo: string,
  extras: AlternativaGenerada[]
): TraduccionGenerada => {
  const juntar = (izquierda: string, derecha: string, conNexo: string): string =>
    `${quitarPuntuacionFinal(izquierda)}${conNexo}${minuscularInicial(
      derecha
    )}`;
  const gup = juntar(principal.gup, subordinada.gup, nexo);
  const alternativas: AlternativaGenerada[] = [];
  for (const alternativa of principal.alternativas ?? []) {
    const junta = juntar(alternativa.gup, subordinada.gup, nexo);
    if (!alternativas.some((existente) => existente.gup === junta)) {
      alternativas.push({ gup: junta, nota: alternativa.nota });
    }
  }
  for (const alternativa of subordinada.alternativas ?? []) {
    const junta = juntar(principal.gup, alternativa.gup, nexo);
    if (!alternativas.some((existente) => existente.gup === junta)) {
      alternativas.push({ gup: junta, nota: alternativa.nota });
    }
  }
  for (const extra of extras) {
    if (!alternativas.some((existente) => existente.gup === extra.gup)) {
      alternativas.push(extra);
    }
  }
  const reglas: TraduccionGenerada["reglas"] = [];
  for (const resultado of [principal, subordinada]) {
    for (const regla of resultado.reglas) {
      if (
        !reglas.some(
          (existente) =>
            existente.leccion === regla.leccion &&
            existente.regla === regla.regla
        )
      ) {
        reglas.push(regla);
      }
    }
  }
  return {
    gup,
    reglas,
    atestada: false,
    ...(alternativas.length > 0 ? { alternativas } : {}),
  };
};

const reescribirTemporalFuturo = (
  tokens: string[],
  idioma: IdiomaFuente
): string[] | null => {
  if (idioma !== "en" || tokens.includes("will")) return null;
  const ultimo = tokens[tokens.length - 1];
  if (!ultimo || !ultimo.endsWith("s") || ultimo.length < 4) return null;
  const base = ultimo.replace(/e?s$/, "");
  const candidatos = [ultimo.replace(/s$/, ""), base];
  for (const candidato of candidatos) {
    if (
      VOCAB.verbos.some((verbo) => verbo.en.includes(candidato))
    ) {
      return [...tokens.slice(0, -1), "will", candidato];
    }
  }
  return null;
};

const componerTemporal = (
  tokens: string[],
  idioma: IdiomaFuente
): TraduccionGenerada | null => {
  if (tokens.length === 0) return null;
  const reescrito = reescribirTemporalFuturo(tokens, idioma);
  const futuro = reescrito ? componer(reescrito.join(" "), idioma) : null;
  if (futuro) return futuro;
  if (
    idioma === "en" &&
    tokens.length >= 2 &&
    PRONOMBRES_BORDE.en.has(tokens[0]) &&
    !tokens.includes("will")
  ) {
    const conWill = componer(
      [tokens[0], "will", ...tokens.slice(1)].join(" "),
      idioma
    );
    if (conWill) return conWill;
  }
  return componer(tokens.join(" "), idioma);
};

const componerPasada = (
  tokens: string[],
  idioma: IdiomaFuente
): TraduccionGenerada | null => {
  if (tokens.length === 0) return null;
  const directo = componer(tokens.join(" "), idioma);
  if (directo) return directo;
  if (idioma === "en" && tokens.includes("had")) {
    return componer(
      tokens.map((token) => (token === "had" ? "have" : token)).join(" "),
      idioma
    );
  }
  return null;
};

const intentarSubordinada = (
  texto: string,
  idioma: IdiomaFuente
): TraduccionGenerada | null => {
  const tokens = limpiar(texto);
  const marcaCuando = idioma === "es" ? "cuando" : "when";
  const posCuando = tokens.indexOf(marcaCuando);
  if (posCuando > 0 && posCuando < tokens.length - 1) {
    const principal = componer(tokens.slice(0, posCuando).join(" "), idioma);
    const temporal = componerTemporal(tokens.slice(posCuando + 1), idioma);
    if (principal && temporal) {
      const base = unirSubordinada(principal, temporal, " ŋunhi ", []);
      return {
        ...base,
        reglas: [...base.reglas, { leccion: 95, regla: "clausula-cuando" }],
        alternativas: [
          ...(base.alternativas ?? []),
          {
            gup: base.gup.replace(" ŋunhi ", " ŋuli "),
            nota: "ŋuli: otra palabra para cuando",
          },
          {
            gup: base.gup.replace(" ŋunhi ", " bäy "),
            nota: "bäy: otra palabra para cuando",
          },
        ],
      };
    }
  }
  if (posCuando === 0 && tokens.length >= 4) {
    for (let corte = 2; corte <= tokens.length - 1; corte++) {
      const temporal = componerTemporal(tokens.slice(1, corte), idioma);
      if (!temporal) continue;
      const principal = componer(tokens.slice(corte).join(" "), idioma);
      if (!principal) continue;
      const cuerpoTemporal = minuscularInicial(
        quitarPuntuacionFinal(temporal.gup)
      );
      const cuerpoPrincipal = minuscularInicial(principal.gup);
      const gup = `Ŋunhi ${cuerpoTemporal} ${cuerpoPrincipal}`;
      return {
        gup,
        reglas: [
          ...principal.reglas,
          { leccion: 95, regla: "clausula-cuando" },
        ],
        atestada: false,
        alternativas: [
          {
            gup: `Ŋuli ${cuerpoTemporal} ${cuerpoPrincipal}`,
            nota: "ŋuli: otra palabra para cuando",
          },
          {
            gup: `Bäy ${cuerpoTemporal} ${cuerpoPrincipal}`,
            nota: "bäy: otra palabra para cuando",
          },
          {
            gup: `Ŋunhi ${cuerpoTemporal} ga ${cuerpoPrincipal}`,
            nota: "con ga uniendo las dos partes (opcional)",
          },
        ],
      };
    }
  }
  const marcaSi = idioma === "es" ? "si" : "if";
  const posSi = tokens.indexOf(marcaSi);
  if (posSi > 0 && posSi < tokens.length - 1) {
    const principal = componer(tokens.slice(0, posSi).join(" "), idioma);
    const condicional = componerTemporal(tokens.slice(posSi + 1), idioma);
    if (principal && condicional) {
      const base = unirSubordinada(principal, condicional, " ŋuli ", []);
      return {
        ...base,
        reglas: [...base.reglas, { leccion: 96, regla: "clausula-si" }],
        alternativas: [
          ...(base.alternativas ?? []),
          {
            gup: base.gup.replace(" ŋuli ", " ŋunhi "),
            nota: "ŋunhi: otra palabra para introducir el si",
          },
          {
            gup: base.gup.replace(" ŋuli ", " balaŋu "),
            nota: "balaŋu: si acaso (matiz de duda)",
          },
          {
            gup: base.gup.replace(" ŋuli ", " ŋuli balaŋu "),
            nota: "ŋuli balaŋu: si, reforzado",
          },
        ],
      };
    }
  }
  if (posSi === 0 && tokens.length >= 4) {
    for (let corte = 2; corte <= tokens.length - 1; corte++) {
      const condicional = componerTemporal(tokens.slice(1, corte), idioma);
      if (!condicional) continue;
      const principal = componer(tokens.slice(corte).join(" "), idioma);
      if (!principal) continue;
      const cuerpoCondicional = minuscularInicial(
        quitarPuntuacionFinal(condicional.gup)
      );
      const cuerpoPrincipal = minuscularInicial(principal.gup);
      const gup = `Ŋuli ${cuerpoCondicional} ${cuerpoPrincipal}`;
      return {
        gup,
        reglas: [
          ...principal.reglas,
          { leccion: 96, regla: "clausula-si" },
        ],
        atestada: false,
        alternativas: [
          {
            gup: `Ŋunhi ${cuerpoCondicional} ${cuerpoPrincipal}`,
            nota: "ŋunhi: otra palabra para introducir el si",
          },
          {
            gup: `Balaŋu ${cuerpoCondicional} ${cuerpoPrincipal}`,
            nota: "balaŋu: si acaso (matiz de duda)",
          },
          {
            gup: `Ŋuli balaŋu ${cuerpoCondicional} ${cuerpoPrincipal}`,
            nota: "ŋuli balaŋu: si, reforzado",
          },
          {
            gup: `Ŋuli ${cuerpoCondicional} ga ${cuerpoPrincipal}`,
            nota: "con ga uniendo las dos partes (opcional)",
          },
        ],
      };
    }
  }
  const posAsiQue =
    idioma === "en"
      ? tokens.findIndex(
          (token, indice) => token === "so" && tokens[indice + 1] === "that"
        )
      : tokens.findIndex(
          (token, indice) =>
            token === "para" && tokens[indice + 1] === "que"
        );
  if (posAsiQue > 0 && posAsiQue < tokens.length - 2) {
    const principal = componer(tokens.slice(0, posAsiQue).join(" "), idioma);
    const dependiente = componerTemporal(tokens.slice(posAsiQue + 2), idioma);
    if (principal && dependiente) {
      const base = unirSubordinada(principal, dependiente, " märr ga ", [
        {
          gup: `${quitarPuntuacionFinal(principal.gup)} märr ${minuscularInicial(
            dependiente.gup
          )}`,
          nota: "sin ga (así se dice en Yirrkala)",
        },
      ]);
      return {
        ...base,
        reglas: [...base.reglas, { leccion: 99, regla: "clausula-marr" }],
      };
    }
  }
  const marcaHasta =
    idioma === "es"
      ? tokens.findIndex(
          (token, indice) =>
            token === "hasta" && tokens[indice + 1] === "que"
        )
      : tokens.indexOf("until");
  const largoHasta = idioma === "es" ? 2 : 1;
  if (marcaHasta > 0 && marcaHasta < tokens.length - largoHasta) {
    const principal = componer(tokens.slice(0, marcaHasta).join(" "), idioma);
    const dependiente = componerTemporal(
      tokens.slice(marcaHasta + largoHasta),
      idioma
    );
    if (principal && dependiente) {
      const base = unirSubordinada(principal, dependiente, " yäna bili ga ", [
        {
          gup: `${quitarPuntuacionFinal(
            principal.gup
          )} ga yäna bili ${minuscularInicial(dependiente.gup)}`,
          nota: "con el primer ga y sin el segundo (lección 100, nota 2)",
        },
      ]);
      return {
        ...base,
        reglas: [...base.reglas, { leccion: 100, regla: "clausula-hasta" }],
      };
    }
  }
  const marcaAntes =
    idioma === "es"
      ? tokens.findIndex(
          (token, indice) =>
            token === "antes" &&
            (tokens[indice + 1] === "que" ||
              (tokens[indice + 1] === "de" && tokens[indice + 2] === "que"))
        )
      : tokens.indexOf("before");
  const largoAntes =
    idioma === "es"
      ? tokens[marcaAntes + 1] === "de"
        ? 3
        : 2
      : 1;
  if (marcaAntes === 0 && tokens.length >= largoAntes + 3) {
    for (
      let corte = largoAntes + 1;
      corte <= tokens.length - 1;
      corte++
    ) {
      const dependiente = componerTemporal(
        tokens.slice(largoAntes, corte),
        idioma
      );
      if (!dependiente) continue;
      const principal = componer(tokens.slice(corte).join(" "), idioma);
      if (!principal) continue;
      const cuerpoDependiente = minuscularInicial(
        quitarPuntuacionFinal(dependiente.gup)
      );
      const cuerpoPrincipal = minuscularInicial(principal.gup);
      return {
        gup: `Yurruna ${cuerpoDependiente} ${cuerpoPrincipal}`,
        reglas: [
          ...principal.reglas,
          { leccion: 101, regla: "clausula-antes" },
        ],
        atestada: false,
        alternativas: [
          {
            gup: `Yurruna ${cuerpoDependiente} ga ${cuerpoPrincipal}`,
            nota: "con ga uniendo las dos partes (opcional)",
          },
        ],
      };
    }
  }
  if (marcaAntes > 0 && marcaAntes < tokens.length - largoAntes) {
    const principal = componer(tokens.slice(0, marcaAntes).join(" "), idioma);
    const dependiente = componerTemporal(
      tokens.slice(marcaAntes + largoAntes),
      idioma
    );
    if (principal && dependiente) {
      const base = unirSubordinada(principal, dependiente, " yurruna ", []);
      return {
        ...base,
        reglas: [...base.reglas, { leccion: 101, regla: "clausula-antes" }],
      };
    }
  }
  const marcaDespues =
    idioma === "es"
      ? tokens.findIndex(
          (token, indice) =>
            token === "después" || token === "despues"
              ? tokens[indice + 1] === "de" && tokens[indice + 2] === "que"
              : false
        )
      : tokens.indexOf("after");
  const largoDespues = idioma === "es" ? 3 : 1;
  if (marcaDespues === 0 && tokens.length >= largoDespues + 3) {
    const restoDespues = tokens.slice(largoDespues);
    const sinArticuloDespues =
      restoDespues.length >= 2 &&
      ARTICULOS_MAKU[idioma].has(restoDespues[0])
        ? restoDespues.slice(1)
        : restoDespues;
    let palabraDespues:
      | Vocabulario["palabras"][number]
      | undefined;
    let largoNpDespues = 0;
    for (const largo of [2, 1]) {
      if (sinArticuloDespues.length < largo) continue;
      const candidata = VOCAB.palabras.find(
        (palabra) =>
          palabra.tipo === "sustantivo" &&
          (idioma === "es" ? palabra.es : palabra.en).includes(
            sinArticuloDespues.slice(0, largo).join(" ")
          )
      );
      if (candidata) {
        palabraDespues = candidata;
        largoNpDespues = largo;
        break;
      }
    }
    for (
      let corte = largoDespues + 1;
      corte <= tokens.length - 1;
      corte++
    ) {
      const dependiente = componerPasada(
        tokens.slice(largoDespues, corte),
        idioma
      );
      if (!dependiente) continue;
      const principal = componer(tokens.slice(corte).join(" "), idioma);
      if (!principal) continue;
      const cuerpoDependiente = minuscularInicial(
        quitarPuntuacionFinal(dependiente.gup)
      );
      const cuerpoPrincipal = minuscularInicial(principal.gup);
      return {
        gup: `Dhäŋuru ŋuliŋuru ${cuerpoDependiente} ga ${cuerpoPrincipal}`,
        reglas: [
          ...principal.reglas,
          { leccion: 102, regla: "clausula-despues" },
        ],
        atestada: false,
        alternativas: [
          {
            gup: `Dhurrwaraŋuru ŋuliŋuru ${cuerpoDependiente} ga ${cuerpoPrincipal}`,
            nota: "dhurrwaraŋuru: sinónimo de dhäŋuru, después de",
          },
          {
            gup: `Ŋuliŋuru dhäŋuru ${cuerpoDependiente} ga ${cuerpoPrincipal}`,
            nota: "orden invertido de las dos palabras, mismo sentido",
          },
          {
            gup: `Dhäŋuru ŋuliŋuru ${cuerpoDependiente} bala ${cuerpoPrincipal}`,
            nota: "con bala uniendo: ...y entonces...",
          },
        ],
      };
    }
    if (palabraDespues) {
      const posPrincipal =
        largoDespues +
        (sinArticuloDespues === restoDespues ? 0 : 1) +
        largoNpDespues;
      const principal = componer(
        tokens.slice(posPrincipal).join(" "),
        idioma
      );
      if (principal) {
        return {
          gup: `Dhäŋuru ${palabraDespues.gup}ŋuru ${minuscularInicial(
            principal.gup
          )}`,
          reglas: [
            ...principal.reglas,
            { leccion: 102, regla: "clausula-despues" },
          ],
          atestada: false,
          alternativas: [
            {
              gup: `Dhurrwaraŋuru ${palabraDespues.gup}ŋuru ${minuscularInicial(
                principal.gup
              )}`,
              nota: "dhurrwaraŋuru: sinónimo de dhäŋuru, después de",
            },
          ],
        };
      }
    }
  }
  if (marcaDespues > 0 && marcaDespues < tokens.length - largoDespues) {
    const principal = componer(
      tokens.slice(0, marcaDespues).join(" "),
      idioma
    );
    const dependiente = componerPasada(
      tokens.slice(marcaDespues + largoDespues),
      idioma
    );
    if (principal && dependiente) {
      const base = unirSubordinada(
        principal,
        dependiente,
        " dhäŋuru ŋuliŋuru ",
        []
      );
      return {
        ...base,
        reglas: [...base.reglas, { leccion: 102, regla: "clausula-despues" }],
      };
    }
  }
  const marcaPorque = idioma === "es" ? "porque" : "because";
  const posPorque = tokens.indexOf(marcaPorque);
  if (posPorque > 0 && posPorque < tokens.length - 1) {
    const principal = componer(tokens.slice(0, posPorque).join(" "), idioma);
    const causa = componer(tokens.slice(posPorque + 1).join(" "), idioma);
    if (principal && causa) {
      const base = unirSubordinada(principal, causa, " bili ", [
        {
          gup: `${quitarPuntuacionFinal(principal.gup)} märr ga ${minuscularInicial(
            causa.gup
          )}`,
          nota: "märr (ga): otra palabra para porque",
        },
      ]);
      return {
        ...base,
        reglas: [...base.reglas, { leccion: 98, regla: "clausula-bili" }],
      };
    }
  }
  if (idioma === "en") {
    const posWhether = tokens.indexOf("whether");
    if (posWhether > 0 && posWhether < tokens.length - 1) {
      const principal = componer(
        tokens.slice(0, posWhether).join(" "),
        idioma
      );
      const dependiente = componer(
        tokens.slice(posWhether + 1).join(" "),
        idioma
      );
      if (principal && dependiente) {
        const base = unirSubordinada(
          principal,
          dependiente,
          " wanha balaŋu ",
          []
        );
        return {
          ...base,
          reglas: [
            ...base.reglas,
            { leccion: 97, regla: "clausula-whether" },
          ],
        };
      }
    }
  }
  const marcaQue = idioma === "es" ? "que" : "that";
  const posQue = tokens.indexOf(marcaQue);
  if (posQue > 0 && posQue < tokens.length - 1) {
    const principal = componer(tokens.slice(0, posQue).join(" "), idioma);
    const subordinada = componer(tokens.slice(posQue + 1).join(" "), idioma);
    if (principal && subordinada) {
      const base = unirSubordinada(principal, subordinada, " ŋunhi ", [
        {
          gup: `${quitarPuntuacionFinal(principal.gup)} ${minuscularInicial(
            subordinada.gup
          )}`,
          nota: "sin que, las dos frases juntas",
        },
      ]);
      return {
        ...base,
        reglas: [...base.reglas, { leccion: 94, regla: "clausula-nunhi" }],
      };
    }
  }
  if (idioma === "en") {
    const posQuien = tokens.indexOf("who");
    if (posQuien > 1 && posQuien < tokens.length - 1) {
      const izquierda = tokens.slice(0, posQuien).join(" ");
      const fraseIzquierda = analizar(izquierda, idioma);
      const principal = fraseIzquierda ? generar(fraseIzquierda) : null;
      if (principal) {
        const restoQuien = tokens.slice(posQuien + 1);
        let subordinada = componer(restoQuien.join(" "), idioma);
        if (!subordinada) {
          const objetoIzquierda = fraseIzquierda?.objeto;
          let pronombreQuien = "he";
          if (objetoIzquierda?.sustantivo !== undefined) {
            const palabraObjeto = VOCAB.palabras.find(
              (candidata) => candidata.clave === objetoIzquierda.sustantivo
            );
            if (palabraObjeto?.plural === true) pronombreQuien = "they";
          } else if (objetoIzquierda?.persona === "3pl") {
            pronombreQuien = "they";
          }
          subordinada = componer(
            [pronombreQuien, ...restoQuien].join(" "),
            idioma
          );
        }
        if (subordinada) {
          const base = unirSubordinada(principal, subordinada, " ŋunhi ", []);
          return {
            ...base,
            reglas: [...base.reglas, { leccion: 94, regla: "clausula-nunhi" }],
          };
        }
      }
    }
    if (
      tokens.length >= 4 &&
      PRONOMBRES_BORDE.en.has(tokens[0]) &&
      SABER_SUBORDINADA_EN.has(tokens[1])
    ) {
      const principal = componer(tokens.slice(0, 2).join(" "), idioma);
      const subordinada = componer(tokens.slice(2).join(" "), idioma);
      if (principal && subordinada) {
        const base = unirSubordinada(principal, subordinada, " ", [
          {
            gup: `${quitarPuntuacionFinal(principal.gup)} ŋunhi ${minuscularInicial(
              subordinada.gup
            )}`,
            nota: "con ŋunhi: ...que...",
          },
        ]);
        return {
          ...base,
          reglas: [...base.reglas, { leccion: 94, regla: "clausula-nunhi" }],
        };
      }
    }
  }
  return null;
};

const recortarSujetoInyectado = (
  resultado: TraduccionGenerada,
  frase: FraseIR
): TraduccionGenerada => {
  const persona = frase.sujeto?.persona;
  const pronombre = persona ? VOCAB.pronombres[persona] : undefined;
  const recortar = (gup: string): string => {
    let tokens = gup.split(" ");
    if (
      pronombre &&
      tokens[0]?.toLowerCase() === pronombre.toLowerCase()
    ) {
      tokens = tokens.slice(1);
    }
    const posicionFuturo = tokens.findIndex(
      (token) => token === "dhu" || token === "yurru"
    );
    if (posicionFuturo >= 0) {
      tokens = [
        ...tokens.slice(0, posicionFuturo),
        ...tokens.slice(posicionFuturo + 1),
      ];
    }
    const unido = tokens.join(" ");
    return `${unido.charAt(0).toUpperCase()}${unido.slice(1)}`;
  };
  return {
    ...resultado,
    gup: recortar(resultado.gup),
    alternativas: resultado.alternativas?.map((alternativa) => ({
      ...alternativa,
      gup: recortar(alternativa.gup),
    })),
  };
};

const esClausulaNanydja = (frase: FraseIR | null): boolean =>
  frase !== null &&
  (frase.polaridad === "negativa" ||
    frase.yanapi !== undefined ||
    frase.modal !== undefined);

const limpiarNotaLecciones = (nota?: string): string | undefined => {
  if (nota === undefined) return undefined;
  const limpia = nota
    .replace(/(?:[,;]\s*)?notas?\s+\d+[a-zA-Z0-9/-]*/gi, "")
    .replace(/(?:[,;]\s*)?lecci[oó]n(?:es)?\s+[0-9][^,)"]*/gi, "")
    .replace(/\(\s*[:;,y\s]*\)/g, "")
    .replace(/\(\s*[:;,]\s*/g, "(")
    .replace(/[,;]\s*\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/[;,:]+$|—+$/, "")
    .trim();
  return limpia.length > 0 ? limpia : undefined;
};

const limpiarTraduccion = (
  resultado: TraduccionGenerada | null
): TraduccionGenerada | null =>
  resultado === null
    ? null
    : {
        ...resultado,
        desglose: glosar(resultado.gup),
        alternativas: resultado.alternativas?.map((alternativa) => {
          const nota = limpiarNotaLecciones(alternativa.nota);
          const desglose = glosar(alternativa.gup);
          return nota !== undefined
            ? { ...alternativa, nota, desglose }
            : { gup: alternativa.gup, desglose };
        }),
      };

const traducirBase = (
  texto: string,
  idioma: IdiomaFuente
): TraduccionGenerada | null => {
  const { segmentos, separadores } = dividirRegiones(texto, idioma);
  if (segmentos.length <= 1) {
    const entera = componer(texto, idioma);
    if (entera) return entera;
    return (
      intentarSubordinada(texto, idioma) ?? intentarMakuO(texto, idioma)
    );
  }

  const clausulaEntera = componer(texto, idioma);
  if (clausulaEntera) return clausulaEntera;

  const conMaku = intentarMakuO(texto, idioma);
  if (conMaku) return conMaku;

  const conSubordinada = intentarSubordinada(texto, idioma);
  if (conSubordinada) return conSubordinada;

  const resultados: TraduccionGenerada[] = [];
  const frases: (FraseIR | null)[] = [];
  let prefijoInyeccion: string[] | null = null;
  for (let indice = 0; indice < segmentos.length; indice++) {
    const segmento = segmentos[indice];
    let frase = analizar(segmento, idioma);
    let resultado = frase ? generar(frase) : null;
    if (
      idioma === "en" &&
      indice > 0 &&
      prefijoInyeccion !== null &&
      (!resultado || frase?.modo === "imperativa")
    ) {
      const conSujeto = analizar(
        `${prefijoInyeccion.join(" ")} ${segmento}`,
        idioma
      );
      const generado =
        conSujeto && conSujeto.modo !== "imperativa"
          ? generar(conSujeto)
          : null;
      if (conSujeto && generado) {
        frase = conSujeto;
        resultado = recortarSujetoInyectado(generado, conSujeto);
      }
    }
    if (!frase || !resultado) return null;
    if (indice === 0) {
      const tokensPrimero = limpiar(segmento);
      if (PRONOMBRES_BORDE[idioma].has(tokensPrimero[0] ?? "")) {
        prefijoInyeccion = AUXILIARES_PREFIJO_EN.has(tokensPrimero[1] ?? "")
          ? tokensPrimero.slice(0, 2)
          : tokensPrimero.slice(0, 1);
      }
    }
    frases.push(frase);
    resultados.push(resultado);
  }

  const marcas = separadores.map((separador, indice) => {
    if (separador === ",") return ", ";
    const gup =
      separador.gupNegativo !== undefined &&
      esClausulaNanydja(frases[indice])
        ? separador.gupNegativo
        : separador.gup;
    return ` ${gup} `;
  });

  const partes = resultados.map((resultado, indice) =>
    unirSegmento(resultado.gup, indice, indice === resultados.length - 1)
  );

  const reglas: TraduccionGenerada["reglas"] = [];
  for (const resultado of resultados) {
    for (const regla of resultado.reglas) {
      if (
        !reglas.some(
          (existente) =>
            existente.leccion === regla.leccion &&
            existente.regla === regla.regla
        )
      ) {
        reglas.push(regla);
      }
    }
  }
  if (separadores.some((separador) => separador !== ",")) {
    reglas.push({ leccion: 93, regla: "conjunciones" });
  }

  const gupsConjuncion = new Set(
    CONJUNCIONES_LIBRO.flatMap((entrada) => [
      entrada.gup,
      ...(entrada.alternos ?? []),
      ...(entrada.gupNegativo ? [entrada.gupNegativo] : []),
    ])
  );
  const tieneDoble = (fraseGup: string): boolean =>
    [...gupsConjuncion].some((gup) => fraseGup.includes(` ${gup} ${gup} `));

  const alternativas: AlternativaGenerada[] = [];
  resultados.forEach((resultado, indice) => {
    for (const alternativa of resultado.alternativas ?? []) {
      const copia = [...partes];
      copia[indice] = unirSegmento(
        alternativa.gup,
        indice,
        indice === resultados.length - 1
      );
      const fraseAlterna = unirPartes(copia, marcas);
      if (tieneDoble(fraseAlterna)) continue;
      if (!alternativas.some((existente) => existente.gup === fraseAlterna)) {
        alternativas.push({ gup: fraseAlterna, nota: alternativa.nota });
      }
    }
  });
  separadores.forEach((separador, indice) => {
    if (separador === ",") return;
    for (const alterno of separador.alternos ?? []) {
      const copiaMarcas = [...marcas];
      copiaMarcas[indice] = ` ${alterno} `;
      const fraseAlterna = unirPartes(partes, copiaMarcas);
      if (tieneDoble(fraseAlterna)) continue;
      if (!alternativas.some((existente) => existente.gup === fraseAlterna)) {
        alternativas.push({
          gup: fraseAlterna,
          nota: `también con ${alterno} (lección 93)`,
        });
      }
    }
  });
  if (separadores.some((separador) => separador !== ",")) {
    const yuxtapuesta = unirPartes(partes, marcas.map(() => ", "));
    if (!alternativas.some((existente) => existente.gup === yuxtapuesta)) {
      alternativas.push({
        gup: yuxtapuesta,
        nota: "sin palabra de enlace (estilo narrativo), mismo sentido",
      });
    }
  }

  return {
    gup: unirPartes(partes, marcas),
    reglas,
    atestada: false,
    ...(alternativas.length > 0 ? { alternativas } : {}),
  };
};

const normalizarGup = (gup: string): string =>
  gup.toLowerCase().replace(/[!?.]/g, "").trim();

const verificarLecciones = (): ResultadoVerificacion => {
  const resultado: ResultadoVerificacion = {
    total: 0,
    compuestas: 0,
    atestadas: 0,
    fallos: [],
  };
  for (const leccion of LIBRO.lessons) {
    for (const ejemplo of leccion.examples) {
      resultado.total += 1;
      const variante = variantesDeEjemplo(ejemplo.en)[0];
      const compuesta = traducirBase(variante, "en");
      if (
        compuesta &&
        normalizarGup(compuesta.gup) === normalizarGup(ejemplo.gup)
      ) {
        resultado.compuestas += 1;
        continue;
      }
      if (ATESTADAS.has(normalizarClave(variante))) {
        resultado.atestadas += 1;
        continue;
      }
      resultado.fallos.push({
        en: ejemplo.en,
        esperado: ejemplo.gup,
        obtenido: compuesta?.gup ?? "",
      });
    }
  }
  return resultado;
};

const traducir = (
  texto: string,
  idioma: IdiomaFuente
): TraduccionGenerada | null => limpiarTraduccion(traducirBase(texto, idioma));

const useRidjin = () => ({ traducir, verificarLecciones });

export { traducir, verificarLecciones };

export default useRidjin;
