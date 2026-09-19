import vocabulario from "../../ridjin/traductor/book/vocabulario.json";
import {
  AlternativaGenerada,
  CasoDemostrativo,
  ComitativoIR,
  DemostrativoIR,
  DestinoIR,
  FraseIR,
  IdiomaFuente,
  OrigenIR,
  PalabraVocabulario,
  PerlativoIR,
  PersonaIR,
  PertenenciaIR,
  PropositoIR,
  ReglaAplicada,
  TraduccionGenerada,
  VerboLibro,
  VerboVocabulario,
  Vocabulario,
} from "../types/ridjin.type";
import {
  formaAtestada,
  identificarForma,
  pluralesDe,
  verbosPorLema,
} from "./useVerbos";

const VOCAB = vocabulario as unknown as Vocabulario;

const capitalizar = (texto: string): string =>
  texto.charAt(0).toUpperCase() + texto.slice(1);

type LecturaPersona = { persona: PersonaIR; nota: string };

const LECTURAS_DUAL_NOSOTROS: LecturaPersona[] = [
  { persona: "1pl_excl", nota: "nosotros sin ti" },
  { persona: "1dual_incl", nota: "nosotros dos (tú y yo)" },
  { persona: "1dual_excl", nota: "nosotros dos (sin ti)" },
];

const LECTURAS_PERSONA: Record<
  IdiomaFuente,
  Record<"pron" | "pos", Partial<Record<PersonaIR, LecturaPersona[]>>>
> = {
  en: {
    pron: {
      "2sg": [{ persona: "2pl", nota: "si son ustedes/vosotros (dos o más)" }],
      "1pl_incl": LECTURAS_DUAL_NOSOTROS,
      "3pl": [{ persona: "3dual", nota: "ellos dos" }],
    },
    pos: {
      "2sg": [
        { persona: "2pl", nota: "si es de ustedes/vosotros (dos o más)" },
      ],
      "1pl_incl": [
        { persona: "1pl_excl", nota: "nuestro, sin ti" },
        { persona: "1dual_incl", nota: "de nosotros dos (tú y yo)" },
        { persona: "1dual_excl", nota: "de nosotros dos (sin ti)" },
      ],
      "3pl": [{ persona: "3dual", nota: "de ellos dos" }],
    },
  },
  es: {
    pron: {
      "1pl_incl": LECTURAS_DUAL_NOSOTROS,
      "3pl": [{ persona: "3dual", nota: "ellos dos" }],
    },
    pos: {
      "3sg": [{ persona: "3pl", nota: "si es de ellos/ellas (su, plural)" }],
      "1pl_incl": [
        { persona: "1pl_excl", nota: "nuestro, sin ti" },
        { persona: "1dual_incl", nota: "de nosotros dos (tú y yo)" },
        { persona: "1dual_excl", nota: "de nosotros dos (sin ti)" },
      ],
      "3pl": [{ persona: "3dual", nota: "de ellos dos" }],
    },
  },
};

const usosDePersona = (
  frase: FraseIR
): { persona: PersonaIR; rol: "pron" | "pos" }[] => {
  const usos: { persona: PersonaIR; rol: "pron" | "pos" }[] = [];
  const agregar = (persona: unknown, rol: "pron" | "pos"): void => {
    if (typeof persona !== "string") return;
    if (!usos.some((uso) => uso.persona === persona && uso.rol === rol)) {
      usos.push({ persona: persona as PersonaIR, rol });
    }
  };
  const visitar = (valor: unknown): void => {
    if (Array.isArray(valor)) {
      valor.forEach(visitar);
      return;
    }
    if (valor === null || typeof valor !== "object") return;
    const objeto = valor as Record<string, unknown>;
    if ("persona" in objeto) {
      agregar(objeto.persona, objeto.dativo === true ? "pos" : "pron");
    }
    if ("posesivo" in objeto) agregar(objeto.posesivo, "pos");
    if ("duenoPosesivo" in objeto) agregar(objeto.duenoPosesivo, "pos");
    for (const hijo of Object.values(objeto)) visitar(hijo);
  };
  visitar(frase);
  return usos;
};

const sustituirTokensDePersona = (
  gup: string,
  original: PersonaIR,
  alterna: PersonaIR
): string | null => {
  const tablas: Partial<Record<PersonaIR, string>>[] = [
    VOCAB.pronombres,
    VOCAB.posesivos,
    VOCAB.objetos,
    VOCAB.comitativos,
    VOCAB.objetosEnfaticos,
  ];
  let cambiado = false;
  const tokens = gup.split(" ").map((token) => {
    const nucleo = token.replace(/[?!,.]+$/, "");
    const resto = token.slice(nucleo.length);
    for (const tabla of tablas) {
      const de = tabla[original];
      const a = tabla[alterna];
      if (de === undefined || a === undefined) continue;
      if (nucleo === de) {
        cambiado = true;
        return `${a}${resto}`;
      }
      if (nucleo === capitalizar(de)) {
        cambiado = true;
        return `${capitalizar(a)}${resto}`;
      }
    }
    return token;
  });
  return cambiado ? tokens.join(" ") : null;
};

const aplicarLecturasDePersona = (
  resultado: TraduccionGenerada,
  frase: FraseIR
): TraduccionGenerada => {
  const idioma = frase.idioma;
  if (idioma === undefined) return resultado;
  const lecturas = LECTURAS_PERSONA[idioma];
  const vistas = new Set<string>([
    resultado.gup,
    ...(resultado.alternativas ?? []).map((alternativa) => alternativa.gup),
  ]);
  const nuevas: AlternativaGenerada[] = [];
  for (const uso of usosDePersona(frase)) {
    for (const lectura of lecturas[uso.rol][uso.persona] ?? []) {
      const gupAlterna = sustituirTokensDePersona(
        resultado.gup,
        uso.persona,
        lectura.persona
      );
      if (gupAlterna !== null && !vistas.has(gupAlterna)) {
        vistas.add(gupAlterna);
        nuevas.push({ gup: gupAlterna, nota: lectura.nota });
      }
    }
  }
  if (nuevas.length === 0) return resultado;
  return {
    ...resultado,
    alternativas: [...nuevas, ...(resultado.alternativas ?? [])],
  };
};

const demostrativoCasual = (
  demostrativo: DemostrativoIR,
  caso: CasoDemostrativo
): string =>
  VOCAB.demostrativosCasuales?.[demostrativo]?.[caso] ??
  VOCAB.demostrativos[demostrativo];

const sustitucionesDemostrativo = (
  demostrativo: DemostrativoIR,
  caso: CasoDemostrativo
): { de: string; a: string; nota: string }[] => {
  const forma = demostrativoCasual(demostrativo, caso);
  return (
    VOCAB.demostrativosCasualesAlternos?.[demostrativo]?.[caso] ?? []
  ).map((alterno) => ({
    de: forma,
    a: alterno,
    nota: "otra serie de 'that' (ŋunhi: no visible, también 'the'; ŋunha: lejano)",
  }));
};

const PERSONAS_AMBIGUAS: Partial<
  Record<string, { persona: keyof Vocabulario["pronombres"]; nota: string }[]>
> = {
  "1pl_incl": [
    { persona: "1pl_excl", nota: "nosotros exclusivo (sin ti)" },
    { persona: "1dual_incl", nota: "nosotros dos (contigo)" },
    { persona: "1dual_excl", nota: "nosotros dos (sin ti)" },
  ],
  "3pl": [{ persona: "3dual", nota: "ellos dos (dual)" }],
  "2sg": [{ persona: "2pl", nota: "ustedes/vosotros (nhuma)" }],
};

const REGLA_GRUPO: Record<number, ReglaAplicada> = {
  1: { leccion: 3, regla: "group1-command" },
  2: { leccion: 3, regla: "group2-command" },
  3: { leccion: 3, regla: "group3-command" },
  4: { leccion: 4, regla: "group4-command" },
  5: { leccion: 4, regla: "group5-command" },
  6: { leccion: 4, regla: "group6-command" },
  7: { leccion: 6, regla: "group7-command" },
  8: { leccion: 6, regla: "group8-command" },
  9: { leccion: 6, regla: "irregular-commands" },
};

const VOCALES = new Set(["a", "i", "u", "ä", "e", "o"]);

const sufijoPosesivo = (base: string): { sufijo: string; regla: ReglaAplicada } => {
  const texto = base.toLowerCase();
  const ultima = texto.charAt(texto.length - 1);
  if (ultima === "'") {
    const previa = texto.charAt(texto.length - 2);
    if (VOCALES.has(previa)) {
      return { sufijo: "wa", regla: { leccion: 13, regla: "possessive-suffix-wa" } };
    }
    return { sufijo: "ku", regla: { leccion: 13, regla: "possessive-suffix-ku" } };
  }
  if (VOCALES.has(ultima)) {
    return { sufijo: "wa", regla: { leccion: 13, regla: "possessive-suffix-wa" } };
  }
  if (texto.endsWith("tj") || ["p", "t", "ṯ", "k"].includes(ultima)) {
    return { sufijo: "ku", regla: { leccion: 13, regla: "possessive-suffix-ku" } };
  }
  return { sufijo: "gu", regla: { leccion: 13, regla: "possessive-suffix-gu" } };
};

const reemplazarEnParte = (parte: string, de: string, a: string): string =>
  parte === de
    ? a
    : parte.includes(" ")
      ? parte
          .split(" ")
          .map((sub) => (sub === de ? a : sub))
          .join(" ")
      : parte;

const sustituirToken = (gup: string, de: string, a: string): string =>
  gup
    .split(" ")
    .map((token) => {
      const limpio = token.replace(/[!?,.]/g, "");
      if (limpio.toLowerCase() !== de.toLowerCase()) return token;
      const empiezaMayuscula = limpio.charAt(0) !== limpio.charAt(0).toLowerCase();
      return token.replace(limpio, empiezaMayuscula ? capitalizar(a) : a);
    })
    .join(" ");

const formasSinonimas = (
  clave: string,
  forma: "I" | "II" | "III"
): { forma: string; clave: string }[] => {
  const entrada = VOCAB.verbos.find((verbo) => verbo.clave === clave);
  if (!entrada?.sinonimos) return [];
  const resultado: { forma: string; clave: string }[] = [];
  for (const sinonimo of entrada.sinonimos) {
    const entradaSinonimo = VOCAB.verbos.find(
      (verbo) => verbo.clave === sinonimo
    );
    if (!entradaSinonimo) continue;
    const candidatos = verbosPorLema(entradaSinonimo.lema);
    if (candidatos.length === 0) continue;
    const formas = formaAtestada(candidatos[0], forma);
    if (formas.length > 0) resultado.push({ forma: formas[0], clave: sinonimo });
  }
  return resultado;
};

const buscarPalabra = (clave: string, tipo: string) => {
  const directo = VOCAB.palabras.find(
    (palabra) => palabra.clave === clave && palabra.tipo === tipo
  );
  if (directo) return directo;
  if (tipo === "sustantivo" && clave.startsWith("agente:")) {
    const claveVerbo = clave.slice("agente:".length);
    const entrada = VOCAB.verbos.find(
      (candidato) => candidato.clave === claveVerbo
    );
    if (entrada) {
      const candidatos = verbosPorLema(entrada.lema);
      const formaIV =
        candidatos.length > 0
          ? formaAtestada(candidatos[0], "IV")[0]
          : undefined;
      if (formaIV) {
        const derivado: PalabraVocabulario = {
          clave,
          gup: `${formaIV}mirri`,
          tipo: "sustantivo",
          persona: true,
          basesAlternas: [`${formaIV}ramirri`],
          es: [],
          en: [],
          leccion: 42,
        };
        return derivado;
      }
    }
  }
  if (tipo === "sustantivo" && clave.startsWith("accion:")) {
    const claveVerbo = clave.slice("accion:".length);
    const libro = verboLibroPorClave(claveVerbo);
    if (libro) {
      const corta =
        libro.group === 1
          ? formaAtestada(libro, "I")[0]
          : formaAtestada(libro, "IV")[0];
      if (corta) {
        const derivadoAccion: PalabraVocabulario = {
          clave,
          gup: `${corta}wuy`,
          tipo: "sustantivo",
          basesAlternas: [`${corta}ra`, `${corta}puy`],
          es: [],
          en: [],
          leccion: 70,
        };
        return derivadoAccion;
      }
    }
  }
  if (tipo === "adjetivo" && clave.startsWith("carencia:")) {
    const claveVerbo = clave.slice("carencia:".length);
    const libro = verboLibroPorClave(claveVerbo);
    if (libro) {
      const corta =
        libro.group === 1
          ? formaAtestada(libro, "I")[0]
          : formaAtestada(libro, "IV")[0];
      if (corta) {
        const derivadoCarencia: PalabraVocabulario = {
          clave,
          gup: `${corta}miriw`,
          tipo: "adjetivo",
          es: [],
          en: [],
          leccion: 73,
        };
        return derivadoCarencia;
      }
    }
  }
  if (tipo === "adjetivo" && clave.startsWith("resultado:")) {
    const claveVerbo = clave.slice("resultado:".length);
    const libro = verboLibroPorClave(claveVerbo);
    if (libro) {
      const corta =
        libro.group === 1
          ? formaAtestada(libro, "I")[0]
          : formaAtestada(libro, "IV")[0];
      if (corta) {
        const derivadoResultado: PalabraVocabulario = {
          clave,
          gup: `${corta}wuy`,
          tipo: "adjetivo",
          basesAlternas: [`${corta}puy`],
          es: [],
          en: [],
          leccion: 68,
        };
        return derivadoResultado;
      }
    }
  }
  return undefined;
};

const sufijoAgente = (
  base: string
): { conSufijo: string; sufijo: string } => {
  const texto = base.toLowerCase();
  const ultima = texto.charAt(texto.length - 1);
  const LIQUIDAS = ["l", "ḻ", "r"];
  const NASALES = ["m", "n", "ṉ", "ŋ"];
  if (ultima === "'") {
    const previa = texto.charAt(texto.length - 2);
    if (VOCALES.has(previa)) {
      return { conSufijo: `${base.slice(0, -1)}y'`, sufijo: "y" };
    }
    if (texto.endsWith("ny'") || NASALES.includes(previa)) {
      return { conSufijo: `${base}thu`, sufijo: "thu" };
    }
    if (LIQUIDAS.includes(previa) || previa === "y" || previa === "w") {
      return { conSufijo: `${base}yu`, sufijo: "yu" };
    }
    return { conSufijo: `${base}thu`, sufijo: "thu" };
  }
  if (texto.endsWith("tj")) return { conSufijo: `${base}thu`, sufijo: "thu" };
  if (texto.endsWith("ny")) return { conSufijo: `${base}dhu`, sufijo: "dhu" };
  if (VOCALES.has(ultima)) return { conSufijo: `${base}y`, sufijo: "y" };
  if (LIQUIDAS.includes(ultima) || ultima === "y" || ultima === "w") {
    return { conSufijo: `${base}yu`, sufijo: "yu" };
  }
  if (NASALES.includes(ultima)) {
    return { conSufijo: `${base}dhu`, sufijo: "dhu" };
  }
  return { conSufijo: `${base}thu`, sufijo: "thu" };
};

const sufijoComitativo = (
  base: string
): { conSufijo: string; alternativo?: string } => {
  const texto = base.toLowerCase();
  const ultima = texto.charAt(texto.length - 1);
  const LIQUIDAS = ["l", "ḻ", "r"];
  const NASALES = ["m", "n", "ṉ", "ŋ"];
  if (ultima === "'") {
    const previa = texto.charAt(texto.length - 2);
    if (VOCALES.has(previa)) return { conSufijo: `${base}wala` };
    if (texto.endsWith("ny'") || NASALES.includes(previa)) {
      return { conSufijo: `${base}kala` };
    }
    return { conSufijo: `${base}kala`, alternativo: `${base}wala` };
  }
  if (texto.endsWith("tj")) return { conSufijo: `${base}kala` };
  if (texto.endsWith("ny")) return { conSufijo: `${base}gala` };
  if (VOCALES.has(ultima)) return { conSufijo: `${base}wala` };
  if (LIQUIDAS.includes(ultima) || ultima === "y" || ultima === "w") {
    return { conSufijo: `${base}gala`, alternativo: `${base}wala` };
  }
  if (NASALES.includes(ultima)) return { conSufijo: `${base}gala` };
  return { conSufijo: `${base}kala` };
};

type PoseedorGenerable = {
  posesivo?: PersonaIR;
  posesivoNombre?: string;
  posesivoSustantivo?: string;
  posesivoDemostrativo?: DemostrativoIR;
  posesivoEnfatico?: boolean;
  posesivoReflexivo?: boolean;
};

const tienePoseedorGenerable = (item: PoseedorGenerable): boolean =>
  item.posesivo !== undefined ||
  item.posesivoNombre !== undefined ||
  item.posesivoSustantivo !== undefined;

const renderPoseedorComitativo = (
  item: PoseedorGenerable
): {
  token: string;
  sustituciones: { de: string; a: string; nota: string }[];
} | null => {
  const conDemostrativo = (resultado: {
    token: string;
    sustituciones: { de: string; a: string; nota: string }[];
  }): {
    token: string;
    sustituciones: { de: string; a: string; nota: string }[];
  } => {
    if (!item.posesivoDemostrativo) return resultado;
    const demPoseedor = demostrativoCasual(item.posesivoDemostrativo, "kala");
    return {
      token: `${demPoseedor} ${resultado.token}`,
      sustituciones: [
        ...resultado.sustituciones,
        ...sustitucionesDemostrativo(item.posesivoDemostrativo, "kala"),
      ],
    };
  };
  if (item.posesivo) {
    if (item.posesivoEnfatico || item.posesivoReflexivo) {
      return conDemostrativo({
        token: enfatizarComitativo(VOCAB.comitativos[item.posesivo]),
        sustituciones: [],
      });
    }
    const token = VOCAB.comitativos[item.posesivo];
    const sustituciones = (PERSONAS_AMBIGUAS[item.posesivo] ?? []).map(
      (ambigua) => ({
        de: token,
        a: VOCAB.comitativos[ambigua.persona],
        nota: ambigua.nota,
      })
    );
    return conDemostrativo({ token, sustituciones });
  }
  let base: string | null = null;
  if (item.posesivoNombre) {
    base = item.posesivoNombre;
  } else if (item.posesivoSustantivo) {
    const palabra = buscarPalabra(item.posesivoSustantivo, "sustantivo");
    if (!palabra) return null;
    base = palabra.gup;
  }
  if (!base) return null;
  const sufijo = sufijoComitativo(base);
  return conDemostrativo({
    token: sufijo.conSufijo,
    sustituciones: sufijo.alternativo
      ? [
          {
            de: sufijo.conSufijo,
            a: sufijo.alternativo,
            nota: "también -wala (en Yirrkala siempre -wala)",
          },
        ]
      : [],
  });
};

const renderPoseedorInfijado = (
  item: PoseedorGenerable,
  sufijo: "wa" | "wala" | "wuŋu" | "wuy" | "ŋuru" | "wurru"
): {
  token: string;
  sustituciones: { de: string; a: string; nota: string }[];
} | null => {
  const poseedor = renderPoseedorComitativo({
    ...item,
    posesivoDemostrativo: undefined,
  });
  if (!poseedor) return null;
  const nucleo = `${poseedor.token}ŋu${sufijo}`;
  const sustituciones = poseedor.sustituciones.map((sustitucion) => ({
    de: nucleo,
    a: `${sustitucion.a}ŋu${sufijo}`,
    nota: sustitucion.nota,
  }));
  sustituciones.push({
    de: nucleo,
    a: poseedor.token,
    nota: "forma abreviada en -gala/-kala/-wala, mismo sentido",
  });
  if (!item.posesivoDemostrativo) {
    return { token: nucleo, sustituciones };
  }
  const demCorto = demostrativoCasual(item.posesivoDemostrativo, "kala");
  const demInfijado = `${demCorto}ŋu${sufijo}`;
  sustituciones.push(
    ...sustitucionesDemostrativo(item.posesivoDemostrativo, "kala").map(
      (sustitucion) => ({
        de: demInfijado,
        a: `${sustitucion.a}ŋu${sufijo}`,
        nota: sustitucion.nota,
      })
    )
  );
  sustituciones.push({
    de: demInfijado,
    a: demCorto,
    nota: "forma abreviada en -gala/-kala/-wala, mismo sentido",
  });
  return { token: `${demInfijado} ${nucleo}`, sustituciones };
};

const sufijoKurru = (
  base: string
): { conSufijo: string; alternativo?: string } => {
  const texto = base.toLowerCase();
  const conGlotal = texto.endsWith("'");
  const ultima = conGlotal
    ? texto.charAt(texto.length - 2)
    : texto.charAt(texto.length - 1);
  const NASALES = ["m", "n", "ṉ", "ŋ"];
  const OCLUSIVAS = ["p", "t", "ṯ", "k"];
  if (!conGlotal && (texto.endsWith("ny") || NASALES.includes(ultima))) {
    return { conSufijo: `${base}gurru` };
  }
  if (texto.endsWith("tj") || OCLUSIVAS.includes(ultima)) {
    return { conSufijo: `${base}kurru` };
  }
  return { conSufijo: `${base}kurru`, alternativo: `${base}wurru` };
};

const sufijoBuy = (
  base: string,
  preferido?: "wuy" | "puy"
): { conSufijo: string; alternativo?: string } => {
  const texto = base.toLowerCase();
  const ultima = texto.charAt(texto.length - 1);
  const NASALES = ["m", "n", "ṉ", "ŋ"];
  const OCLUSIVAS = ["p", "t", "ṯ", "k"];
  const LIQUIDAS = ["l", "ḻ", "r", "y", "w"];
  const doble = (): { conSufijo: string; alternativo: string } => {
    const eleccion = preferido ?? "puy";
    const alterno = eleccion === "puy" ? "wuy" : "puy";
    return {
      conSufijo: `${base}${eleccion}`,
      alternativo: `${base}${alterno}`,
    };
  };
  if (texto.endsWith("ny")) return { conSufijo: `${base}buy` };
  if (texto.endsWith("tj")) return { conSufijo: `${base}puy` };
  if (ultima === "'") {
    const previa = texto.charAt(texto.length - 2);
    if (VOCALES.has(previa) || LIQUIDAS.includes(previa)) return doble();
    return { conSufijo: `${base}puy` };
  }
  if (NASALES.includes(ultima)) return { conSufijo: `${base}buy` };
  if (OCLUSIVAS.includes(ultima)) return { conSufijo: `${base}puy` };
  return doble();
};

const renderPertenencia = (
  pertenencia: PertenenciaIR
): {
  tokens: string[];
  reglas: ReglaAplicada[];
  sustituciones: { de: string; a: string; nota: string }[];
  esPersona: boolean;
} | null => {
  const tokens: string[] = [];
  const reglas: ReglaAplicada[] = [];
  const sustituciones: { de: string; a: string; nota: string }[] = [];
  let esPersona = false;
  const agregarInfijoPersona = (
    formaComitativa: string,
    alternativoComitativo?: string
  ) => {
    const token = `${formaComitativa}ŋuwuy`;
    tokens.push(token);
    esPersona = true;
    reglas.push({ leccion: 39, regla: "buy-person-infix" });
    sustituciones.push({
      de: token,
      a: `${formaComitativa}ŋawuy`,
      nota: "infijo pronunciado -ŋa- (énfasis en la -a- final)",
    });
    if (alternativoComitativo) {
      sustituciones.push({
        de: token,
        a: `${alternativoComitativo}ŋuwuy`,
        nota: "también -walaŋu (en Yirrkala siempre -wala)",
      });
    }
  };
  if (pertenencia.demostrativo) {
    const casoPertenencia =
      pertenencia.persona ||
      (pertenencia.sustantivo &&
        buscarPalabra(pertenencia.sustantivo, "sustantivo")?.persona === true)
        ? "kalanguwuy"
        : "buy";
    tokens.push(demostrativoCasual(pertenencia.demostrativo, casoPertenencia));
    sustituciones.push(
      ...sustitucionesDemostrativo(pertenencia.demostrativo, casoPertenencia)
    );
    reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
  }
  if (pertenencia.persona) {
    agregarInfijoPersona(VOCAB.comitativos[pertenencia.persona]);
    const token = tokens[0];
    for (const ambigua of PERSONAS_AMBIGUAS[pertenencia.persona] ?? []) {
      sustituciones.push({
        de: token,
        a: `${VOCAB.comitativos[ambigua.persona]}ŋuwuy`,
        nota: ambigua.nota,
      });
    }
  } else if (pertenencia.sustantivo) {
    const palabra = buscarPalabra(pertenencia.sustantivo, "sustantivo");
    if (!palabra) return null;
    if (palabra.persona === true) {
      const comitativo = sufijoComitativo(palabra.gup);
      agregarInfijoPersona(comitativo.conSufijo, comitativo.alternativo);
    } else {
      const sufijo = sufijoBuy(palabra.gup, palabra.sufijoBuy);
      tokens.push(sufijo.conSufijo);
      reglas.push({ leccion: 39, regla: "buy-adjective" });
      if (sufijo.alternativo) {
        sustituciones.push({
          de: sufijo.conSufijo,
          a: sufijo.alternativo,
          nota: "-puy y -wuy alternan tras vocal o líquida",
        });
      }
    }
  } else if (pertenencia.nombre) {
    if (pertenencia.verbo) {
      const sufijoNombre = sufijoComitativo(pertenencia.nombre);
      agregarInfijoPersona(sufijoNombre.conSufijo, sufijoNombre.alternativo);
    } else {
      const sufijo = sufijoBuy(pertenencia.nombre);
      tokens.push(sufijo.conSufijo);
      reglas.push({ leccion: 39, regla: "buy-adjective" });
      if (sufijo.alternativo) {
        sustituciones.push({
          de: sufijo.conSufijo,
          a: sufijo.alternativo,
          nota: "-puy y -wuy alternan tras vocal o líquida",
        });
      }
    }
  } else if (!pertenencia.verbo && tokens.length === 0) {
    return null;
  }
  if (pertenencia.adjetivo) {
    const sufijoAdj = sufijoBuy(pertenencia.adjetivo);
    tokens.push(sufijoAdj.conSufijo);
    reglas.push({ leccion: 39, regla: "buy-adjective-agreement" });
    if (sufijoAdj.alternativo) {
      sustituciones.push({
        de: sufijoAdj.conSufijo,
        a: sufijoAdj.alternativo,
        nota: "-puy y -wuy alternan tras vocal o líquida",
      });
    }
  }
  if (pertenencia.cuantificador) {
    const cuantificador = VOCAB.cuantificadores.find(
      (candidato) => candidato.clave === pertenencia.cuantificador
    );
    if (!cuantificador) return null;
    const sufijoCuant = sufijoBuy(cuantificador.gup, cuantificador.sufijoBuy);
    tokens.push(sufijoCuant.conSufijo);
    reglas.push({ leccion: 39, regla: "buy-adjective-agreement" });
    if (sufijoCuant.alternativo) {
      sustituciones.push({
        de: sufijoCuant.conSufijo,
        a: sufijoCuant.alternativo,
        nota: "-puy y -wuy alternan tras vocal o líquida",
      });
    }
  }
  if (pertenencia.verbo) {
    const bases = basesVerbal(pertenencia.verbo);
    if (!bases) return null;
    const sufijoVerbal = sufijoBuy(bases.corta, "wuy");
    tokens.push(sufijoVerbal.conSufijo);
    reglas.push({ leccion: 46, regla: "verb-buy-about" });
    if (sufijoVerbal.alternativo) {
      sustituciones.push({
        de: sufijoVerbal.conSufijo,
        a: sufijoVerbal.alternativo,
        nota: "-wuy y -puy alternan sobre la cuaternaria (nota 2, lección 46)",
      });
    }
    if (bases.larga !== bases.corta) {
      sustituciones.push({
        de: sufijoVerbal.conSufijo,
        a: sufijoBuy(bases.larga, "wuy").conSufijo,
        nota: "Yirrkala: siempre la cuaternaria larga",
      });
    }
  }
  return { tokens, reglas, sustituciones, esPersona };
};

const renderComitativo = (
  comitativo: ComitativoIR
): {
  tokens: string[];
  reglas: ReglaAplicada[];
  alternativo: { de: string; a: string; nota: string } | null;
} | null => {
  const tokens: string[] = [];
  const reglas: ReglaAplicada[] = [];
  let alternativo: { de: string; a: string; nota: string } | null = null;
  if (comitativo.adverbio) {
    const adverbio = buscarPalabra(comitativo.adverbio, "adverbio");
    if (!adverbio) return null;
    tokens.push(adverbio.gup);
    reglas.push({ leccion: 26, regla: "adverb-plus-comitative" });
  }
  if (comitativo.persona) {
    tokens.push(VOCAB.comitativos[comitativo.persona]);
    reglas.push({ leccion: 26, regla: "comitative-pronouns" });
  } else {
    let base: string | null = null;
    if (comitativo.sustantivo) {
      const palabra = buscarPalabra(comitativo.sustantivo, "sustantivo");
      if (!palabra) return null;
      base = palabra.gup;
    } else if (comitativo.nombre) {
      base = comitativo.nombre;
    }
    if (!base) return null;
    const sufijo = sufijoComitativo(base);
    if (comitativo.demostrativo) {
      tokens.push(demostrativoCasual(comitativo.demostrativo, "kala"));
      reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
    }
    tokens.push(sufijo.conSufijo);
    reglas.push({ leccion: 26, regla: "comitative-person" });
    if (comitativo.adjetivo) {
      tokens.push(sufijoComitativo(comitativo.adjetivo).conSufijo);
      reglas.push({ leccion: 34, regla: "adjective-agreement" });
    }
    if (sufijo.alternativo) {
      alternativo = {
        de: sufijo.conSufijo,
        a: sufijo.alternativo,
        nota: "también -wala (en Yirrkala siempre -wala)",
      };
    }
  }
  return { tokens, reglas, alternativo };
};

const renderDestino = (
  destino: DestinoIR,
  destinatarioTransfiere?: boolean,
  llegada?: boolean
): {
  tokens: string[];
  reglas: ReglaAplicada[];
  sustituciones: { de: string; a: string; nota: string }[];
} | null => {
  const tokens: string[] = [];
  const reglas: ReglaAplicada[] = [];
  const sustituciones: { de: string; a: string; nota: string }[] = [];
  if (destino.direccion) {
    tokens.push(VOCAB.direcciones[destino.direccion].gup);
    reglas.push({ leccion: 27, regla: "movement-adverbs" });
  }
  if (destino.adverbio) {
    const adverbio = buscarPalabra(destino.adverbio, "adverbio");
    if (!adverbio) return null;
    const base = adverbio.baseDireccional ?? adverbio.gup;
    tokens.push(`${base}lili`);
    reglas.push({ leccion: 27, regla: "allative-adverbs" });
    if (adverbio.baseDireccional) {
      sustituciones.push({
        de: `${base}lili`,
        a: `${adverbio.gup}lili`,
        nota: "también sin glotal",
      });
    }
    if (adverbio.direccionalWala) {
      sustituciones.push({
        de: `${base}lili`,
        a: `${adverbio.gup}wala`,
        nota: `también ${adverbio.gup}wala`,
      });
    }
  }
  if (
    destino.demostrativo &&
    !destino.persona &&
    !destino.sustantivo &&
    !destino.nombre &&
    !destino.adverbio
  ) {
    const aquiDestino = demostrativoCasual(destino.demostrativo, "lili");
    tokens.push(aquiDestino);
    sustituciones.push(
      ...sustitucionesDemostrativo(destino.demostrativo, "lili")
    );
    reglas.push({ leccion: 55, regla: "here-demonstrative" });
    return { tokens, reglas, sustituciones };
  }
  if (destino.persona) {
    if (llegada) {
      const dativoLlegada = VOCAB.posesivos[destino.persona];
      tokens.push(dativoLlegada);
      reglas.push({ leccion: 82, regla: "verb-behaviour-arrive" });
      sustituciones.push({
        de: dativoLlegada,
        a: VOCAB.comitativos[destino.persona],
        nota: "a veces -gala/-kala/-wala, pero -gu/-ku/-wa/-wu es más usual",
      });
      return { tokens, reglas, sustituciones };
    }
    if (destino.paraQuedarse) {
      const acusativoDestino = VOCAB.objetos[destino.persona];
      tokens.push(acusativoDestino);
      reglas.push({ leccion: 47, regla: "recipient-keeps-nha" });
      sustituciones.push({
        de: acusativoDestino,
        a: VOCAB.posesivos[destino.persona],
        nota: "-gu/-ku/-wa/-wu si lo dado es para quedárselo",
      });
      sustituciones.push({
        de: acusativoDestino,
        a: VOCAB.comitativos[destino.persona],
        nota: "-gala si no es para quedárselo sino para devolver o pasar",
      });
      return { tokens, reglas, sustituciones };
    }
    const comitativoDestino = VOCAB.comitativos[destino.persona];
    tokens.push(comitativoDestino);
    reglas.push({ leccion: 27, regla: "allative-person" });
    sustituciones.push({
      de: comitativoDestino,
      a: VOCAB.posesivos[destino.persona],
      nota: "también dativo -gu/-wa: a/para la persona",
    });
    if (destinatarioTransfiere) {
      sustituciones.push({
        de: comitativoDestino,
        a: VOCAB.objetos[destino.persona],
        nota: "-nha si lo dado es para quedárselo; -gala si es para devolver",
      });
    }
  } else if (destino.sustantivo || destino.nombre) {
    let base: string | null = null;
    let esPersona = false;
    let lecturaAmbigua = false;
    if (destino.sustantivo) {
      const palabra = buscarPalabra(destino.sustantivo, "sustantivo");
      if (!palabra) return null;
      base = palabra.gup;
      esPersona = palabra.persona === true;
    } else if (destino.nombre) {
      base = destino.nombre;
      esPersona = true;
      lecturaAmbigua = true;
    }
    if (!base) return null;
    if (llegada) {
      if (esPersona) {
        const sufijoLlegada = sufijoPosesivo(base);
        const tokenLlegada = `${base}${sufijoLlegada.sufijo}`;
        tokens.push(tokenLlegada);
        reglas.push({ leccion: 82, regla: "verb-behaviour-arrive" });
        sustituciones.push({
          de: tokenLlegada,
          a: sufijoComitativo(base).conSufijo,
          nota: "a veces -gala/-kala/-wala, pero -gu/-ku/-wa/-wu es más usual",
        });
        return { tokens, reglas, sustituciones };
      }
      const propioLlegada =
        destino.sustantivo !== undefined &&
        buscarPalabra(destino.sustantivo, "sustantivo")?.nombrePropio === true;
      tokens.push(propioLlegada ? base : `${base}ŋura`);
      reglas.push({ leccion: 82, regla: "verb-behaviour-arrive" });
      return { tokens, reglas, sustituciones };
    }
    if (esPersona && destino.paraQuedarse) {
      const tokenNha = `${base}nha`;
      tokens.push(tokenNha);
      reglas.push({ leccion: 47, regla: "recipient-keeps-nha" });
      sustituciones.push({
        de: tokenNha,
        a: `${base}${sufijoPosesivo(base).sufijo}`,
        nota: "-gu/-ku/-wa/-wu si lo dado es para quedárselo",
      });
      sustituciones.push({
        de: tokenNha,
        a: sufijoComitativo(base).conSufijo,
        nota: "-gala si no es para quedárselo sino para devolver o pasar",
      });
      return { tokens, reglas, sustituciones };
    }
    if (esPersona) {
      const sufijo = sufijoComitativo(base);
      if (destino.demostrativo) {
        tokens.push(demostrativoCasual(destino.demostrativo, "kala"));
        sustituciones.push(
          ...sustitucionesDemostrativo(destino.demostrativo, "kala")
        );
        reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
      }
      const poseedorPersonaDestino = renderPoseedorInfijado(destino, "wala");
      if (tienePoseedorGenerable(destino) && !poseedorPersonaDestino) {
        return null;
      }
      if (poseedorPersonaDestino) {
        tokens.push(poseedorPersonaDestino.token);
        sustituciones.push(...poseedorPersonaDestino.sustituciones);
        reglas.push({ leccion: 51, regla: "possessive-infix-galangu" });
      }
      if (destino.adjetivo) {
        tokens.push(sufijoComitativo(destino.adjetivo).conSufijo);
        reglas.push({ leccion: 34, regla: "adjective-agreement" });
      }
      tokens.push(sufijo.conSufijo);
      reglas.push({ leccion: 27, regla: "allative-person" });
      if (sufijo.alternativo) {
        sustituciones.push({
          de: sufijo.conSufijo,
          a: sufijo.alternativo,
          nota: "también -wala (en Yirrkala siempre -wala)",
        });
      }
      sustituciones.push({
        de: sufijo.conSufijo,
        a: `${base}${sufijoPosesivo(base).sufijo}`,
        nota: "también dativo -gu/-wa: a/para la persona",
      });
      if (destinatarioTransfiere) {
        sustituciones.push({
          de: sufijo.conSufijo,
          a: `${base}nha`,
          nota: "-nha si lo dado es para quedárselo; -gala si es para devolver",
        });
      }
      if (lecturaAmbigua) {
        sustituciones.push({
          de: sufijo.conSufijo,
          a: `${base}lili`,
          nota: "si es un lugar y no una persona: -lili",
        });
      }
    } else {
      if (destino.demostrativo) {
        tokens.push(demostrativoCasual(destino.demostrativo, "lili"));
        sustituciones.push(
          ...sustitucionesDemostrativo(destino.demostrativo, "lili")
        );
        reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
      }
      const poseedorDestino = renderPoseedorComitativo(destino);
      if (tienePoseedorGenerable(destino) && !poseedorDestino) return null;
      if (poseedorDestino) {
        tokens.push(poseedorDestino.token);
        sustituciones.push(...poseedorDestino.sustituciones);
        reglas.push({ leccion: 36, regla: "possessive-gala-suffixed-head" });
      }
      if (destino.adjetivo) {
        tokens.push(`${destino.adjetivo}lili`);
        reglas.push({ leccion: 34, regla: "adjective-agreement" });
      }
      tokens.push(`${base}lili`);
      reglas.push({ leccion: 27, regla: "allative-lili" });
    }
  }
  if (tokens.length === 0) return null;
  return { tokens, reglas, sustituciones };
};

const formaGunu = (formaComitativa: string): string =>
  formaComitativa.replace(/ala$/, "uŋu");

const formaObjetoEnfatico = (persona: PersonaIR): string =>
  VOCAB.objetosEnfaticos[persona] ?? `${VOCAB.objetos[persona]}wuynha`;

const enfatizarPosesivo = (persona: PersonaIR): string =>
  `${VOCAB.posesivos[persona]}wuy`;

const enfatizarComitativo = (forma: string): string =>
  forma.endsWith("kala")
    ? `${forma.slice(0, -4)}kiyingala`
    : forma.endsWith("gala")
      ? `${forma.slice(0, -4)}giyingala`
      : forma;

const paradigmaDerivado = (lemma: string): VerboLibro | null => {
  const reales = verbosPorLema(lemma);
  if (reales.length > 0) return reales[0];
  if (lemma.endsWith("rri")) {
    const raiz = lemma.slice(0, -3);
    return {
      lemma,
      group: 3,
      forms: {
        I: [lemma],
        II: [raiz],
        III: [`${raiz}na`],
        IV: [`${raiz}nya`],
      },
      particle: null,
      gloss: lemma,
      valence: ["Vin"],
      pluralOf: null,
      page: 67,
    };
  }
  if (lemma.endsWith("ma")) {
    const raiz = lemma.slice(0, -2);
    return {
      lemma,
      group: 7,
      forms: {
        I: [lemma],
        II: [`${raiz}ŋu`],
        III: [`${raiz}ŋala`],
        IV: [`${raiz}nha`],
      },
      particle: null,
      gloss: lemma,
      valence: ["Vtr"],
      pluralOf: null,
      page: 69,
    };
  }
  return null;
};

const derivarDeAdjetivo = (
  adjetivo: PalabraVocabulario,
  tipo: "thirri" | "kuma"
): {
  verbo: VerboLibro;
  raizPrincipal: string;
  raizAlternativa: string | null;
} | null => {
  const base = adjetivo.gup;
  const texto = base.toLowerCase();
  const ultima = texto.endsWith("'")
    ? texto.charAt(texto.length - 2)
    : texto.charAt(texto.length - 1);
  const esNasal =
    texto.endsWith("ny") ||
    (!texto.endsWith("'") && ["m", "n", "ṉ", "ŋ"].includes(ultima)) ||
    (texto.endsWith("'") && ["m", "n", "ṉ", "ŋ"].includes(ultima));
  const esOclusiva =
    texto.endsWith("tj") || ["p", "t", "ṯ", "k"].includes(ultima);
  const esVocal = ["a", "e", "i", "o", "u", "ä"].includes(ultima);
  let sufijo: string;
  let alternativo: string | null = null;
  if (tipo === "thirri") {
    if (adjetivo.sufijoThirri) {
      sufijo = adjetivo.sufijoThirri;
      if (sufijo === "yirri") alternativo = "thirri";
    } else if (esNasal) {
      sufijo = "dhirri";
    } else if (esOclusiva) {
      sufijo = "thirri";
    } else if (esVocal) {
      sufijo = "thirri";
      alternativo = "yirri";
    } else {
      sufijo = "thirri";
      alternativo = "yirri";
    }
  } else {
    if (adjetivo.sufijoKuma) {
      sufijo = adjetivo.sufijoKuma;
      if (sufijo === "yama") alternativo = "kuma";
    } else if (esNasal) {
      sufijo = "guma";
    } else if (esVocal) {
      sufijo = "kuma";
      alternativo = "yama";
    } else {
      sufijo = "kuma";
    }
  }
  const verbo = paradigmaDerivado(`${base}${sufijo}`);
  if (!verbo) return null;
  const recorte = tipo === "thirri" ? 3 : 2;
  return {
    verbo,
    raizPrincipal: `${base}${sufijo.slice(0, -recorte)}`,
    raizAlternativa: alternativo
      ? `${base}${alternativo.slice(0, -recorte)}`
      : null,
  };
};

const resolverDerivadoAdjetivo = (
  clave: string
): {
  entrada: VerboVocabulario;
  verbo: VerboLibro;
  raizPrincipal: string;
  raizAlternativa: string | null;
} | null => {
  const esDevenir = clave.startsWith("devenir:");
  const esHacer = clave.startsWith("hacer:");
  if (!esDevenir && !esHacer) return null;
  const adjetivo = buscarPalabra(
    clave.slice(clave.indexOf(":") + 1),
    "adjetivo"
  );
  if (!adjetivo) return null;
  const derivado = derivarDeAdjetivo(adjetivo, esDevenir ? "thirri" : "kuma");
  if (!derivado) return null;
  return {
    entrada: {
      clave,
      lema: derivado.verbo.lemma,
      valencia: esDevenir ? "Vin" : "Vtr",
      es: [],
      en: [],
      leccion: esDevenir ? 49 : 50,
    },
    verbo: derivado.verbo,
    raizPrincipal: derivado.raizPrincipal,
    raizAlternativa: derivado.raizAlternativa,
  };
};

const derivarMarama = (
  verbo: VerboLibro
): {
  verbo: VerboLibro;
  base: string;
  baseYirrkala: string | null;
} | null => {
  let base: string | null = null;
  let baseYirrkala: string | null = null;
  if (verbo.group === 5) {
    const primaria = formaAtestada(verbo, "I")[0];
    if (!primaria || !primaria.endsWith("thun")) return null;
    base = primaria.slice(0, -4);
    baseYirrkala = primaria;
  } else if (verbo.group === 6) {
    base = formaAtestada(verbo, "I")[0] ?? null;
  } else {
    const cuaternaria = formaAtestada(verbo, "IV")[0];
    if (!cuaternaria) return null;
    base = cuaternaria;
    baseYirrkala = `${cuaternaria}ra`;
  }
  if (!base) return null;
  return {
    verbo: {
      lemma: `${base}marama`,
      group: 7,
      forms: {
        I: [`${base}marama`],
        II: [`${base}maraŋu`],
        III: [`${base}maraŋala`],
        IV: [`${base}maranha`],
      },
      particle: null,
      gloss: verbo.gloss,
      valence: ["Vtr"],
      pluralOf: null,
      page: 65,
    },
    base,
    baseYirrkala,
  };
};

const verboLibroPorClave = (claveVerbo: string): VerboLibro | null => {
  const entrada = VOCAB.verbos.find(
    (candidato) => candidato.clave === claveVerbo
  );
  if (entrada) {
    const candidatos = verbosPorLema(entrada.lema);
    return candidatos.length > 0 ? candidatos[0] : null;
  }
  const derivado = resolverDerivadoAdjetivo(claveVerbo);
  return derivado ? derivado.verbo : null;
};

const basesVerbal = (
  claveVerbo: string
): { corta: string; larga: string } | null => {
  const verbo = verboLibroPorClave(claveVerbo);
  if (!verbo) return null;
  if (verbo.group === 1) {
    const base = formaAtestada(verbo, "I")[0];
    return base ? { corta: base, larga: base } : null;
  }
  const base = formaAtestada(verbo, "IV")[0];
  return base ? { corta: base, larga: `${base}ra` } : null;
};

const nominalCasual = (
  claveVerbo: string,
  sufijo: "ŋura" | "lili" | "ŋuru"
): { principal: string; yirrkala: string | null } | null => {
  const bases = basesVerbal(claveVerbo);
  if (!bases) return null;
  return {
    principal: `${bases.corta}${sufijo}`,
    yirrkala:
      bases.larga !== bases.corta ? `${bases.larga}${sufijo}` : null,
  };
};

const renderOrigen = (
  origen: OrigenIR,
  conMovimiento: boolean,
  origenGu?: boolean
): {
  tokens: string[];
  reglas: ReglaAplicada[];
  sustituciones: { de: string; a: string; nota: string }[];
} | null => {
  const tokens: string[] = [];
  const reglas: ReglaAplicada[] = [];
  const sustituciones: { de: string; a: string; nota: string }[] = [];
  if (
    origen.demostrativo &&
    !origen.persona &&
    !origen.sustantivo &&
    !origen.nombre &&
    !origen.adverbio &&
    !origen.verbo
  ) {
    tokens.push(demostrativoCasual(origen.demostrativo, "nguru"));
    sustituciones.push(
      ...sustitucionesDemostrativo(origen.demostrativo, "nguru")
    );
    reglas.push({ leccion: 55, regla: "here-demonstrative" });
    return { tokens, reglas, sustituciones };
  }
  if (origen.verbo) {
    const nominal = nominalCasual(origen.verbo, "ŋuru");
    if (!nominal) return null;
    if (origen.sustantivo) {
      const palabraObjeto = buscarPalabra(origen.sustantivo, "sustantivo");
      if (!palabraObjeto) return null;
      tokens.push(`${palabraObjeto.gup}ŋuru`);
    }
    tokens.push(nominal.principal);
    reglas.push({ leccion: 46, regla: "verb-nguru" });
    if (nominal.yirrkala) {
      sustituciones.push({
        de: nominal.principal,
        a: nominal.yirrkala,
        nota: "Yirrkala: siempre la cuaternaria larga",
      });
    }
    return { tokens, reglas, sustituciones };
  }
  if (origen.adverbio) {
    const adverbio = buscarPalabra(origen.adverbio, "adverbio");
    if (!adverbio) return null;
    const base = adverbio.baseDireccional ?? adverbio.gup;
    tokens.push(`${base}ŋuru`);
    reglas.push({ leccion: 28, regla: "ablative-adverbs" });
    if (adverbio.baseDireccional) {
      sustituciones.push({
        de: `${base}ŋuru`,
        a: `${adverbio.gup}ŋuru`,
        nota: "también sin glotal",
      });
    }
  }
  const conMovimientoReal = conMovimiento || origen.alejamiento === true;
  const renderPersona = (
    formaComitativa: string,
    alternativoComitativo: string | undefined,
    lugarPosible: string | null
  ) => {
    if (origen.demostrativo) {
      const casoPersonaOrigen = conMovimientoReal ? "kalangunguru" : "kungu";
      tokens.push(demostrativoCasual(origen.demostrativo, casoPersonaOrigen));
      sustituciones.push(
        ...sustitucionesDemostrativo(origen.demostrativo, casoPersonaOrigen)
      );
      reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
    }
    const plena = `${formaComitativa}ŋuŋuru`;
    const fuente = formaGunu(formaComitativa);
    const principal = conMovimientoReal ? plena : fuente;
    let adjForma: string | null = null;
    if (origen.adjetivo) {
      const adjComitativo = sufijoComitativo(origen.adjetivo).conSufijo;
      adjForma = conMovimientoReal
        ? `${adjComitativo}ŋuŋuru`
        : formaGunu(adjComitativo);
      reglas.push({ leccion: 34, regla: "adjective-agreement" });
      if (conMovimientoReal) {
        tokens.push(adjForma);
        sustituciones.push({
          de: adjForma,
          a: adjComitativo,
          nota: "sufijo abreviado en el adjetivo, mismo sentido",
        });
      }
    }
    tokens.push(principal);
    if (adjForma && !conMovimientoReal) {
      tokens.push(adjForma);
    }
    reglas.push(
      conMovimientoReal
        ? { leccion: 29, regla: "ablative-person" }
        : { leccion: 30, regla: "source-gunu" }
    );
    sustituciones.push(
      conMovimientoReal
        ? {
            de: principal,
            a: fuente,
            nota: "sin movimiento del cuerpo: -guŋu/-kuŋu/-wuŋu",
          }
        : {
            de: principal,
            a: plena,
            nota: "con movimiento (alejarse): -galaŋuŋuru",
          }
    );
    if (conMovimientoReal) {
      sustituciones.push({
        de: principal,
        a: formaComitativa,
        nota: "forma abreviada (ambigua con 'con/hacia')",
      });
    }
    if (alternativoComitativo) {
      sustituciones.push({
        de: principal,
        a: conMovimientoReal
          ? `${alternativoComitativo}ŋuŋuru`
          : formaGunu(alternativoComitativo),
        nota: "también -wala (en Yirrkala siempre -wala)",
      });
    }
    if (lugarPosible) {
      sustituciones.push({
        de: principal,
        a: `${lugarPosible}ŋuru`,
        nota: "si es un lugar y no una persona: -ŋuru",
      });
    }
  };
  if (origen.persona) {
    if (origenGu) {
      const tokenGu = origen.enfatico
        ? enfatizarPosesivo(origen.persona)
        : VOCAB.posesivos[origen.persona];
      tokens.push(tokenGu);
      reglas.push({ leccion: 82, regla: "verb-behaviour-origin-gu" });
      return { tokens, reglas, sustituciones };
    }
    renderPersona(
      origen.enfatico
        ? enfatizarComitativo(VOCAB.comitativos[origen.persona])
        : VOCAB.comitativos[origen.persona],
      undefined,
      null
    );
    if (origen.enfatico) {
      reglas.push({ leccion: 75, regla: "emphasised-pronouns-pi" });
    }
    if (!conMovimientoReal) {
      reglas.push({ leccion: 30, regla: "source-gunu-pronouns" });
    }
  } else if (origen.sustantivo) {
    const palabra = buscarPalabra(origen.sustantivo, "sustantivo");
    if (!palabra) return null;
    if (palabra.persona && origenGu) {
      const tokenGuSustantivo = `${palabra.gup}${sufijoPosesivo(palabra.gup).sufijo}`;
      tokens.push(tokenGuSustantivo);
      reglas.push({ leccion: 82, regla: "verb-behaviour-origin-gu" });
      return { tokens, reglas, sustituciones };
    }
    if (palabra.persona) {
      const poseedorPersonaOrigen = renderPoseedorInfijado(
        origen,
        conMovimientoReal ? "ŋuru" : "wuŋu"
      );
      if (tienePoseedorGenerable(origen) && !poseedorPersonaOrigen) {
        return null;
      }
      if (poseedorPersonaOrigen) {
        tokens.push(poseedorPersonaOrigen.token);
        sustituciones.push(...poseedorPersonaOrigen.sustituciones);
        reglas.push({ leccion: 52, regla: "possessive-infix-galangu" });
      }
      const sufijo = sufijoComitativo(palabra.gup);
      renderPersona(sufijo.conSufijo, sufijo.alternativo, null);
    } else {
      if (origen.demostrativo) {
        tokens.push(demostrativoCasual(origen.demostrativo, "nguru"));
        sustituciones.push(
          ...sustitucionesDemostrativo(origen.demostrativo, "nguru")
        );
        reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
      }
      const poseedorOrigen = renderPoseedorInfijado(origen, "ŋuru");
      if (tienePoseedorGenerable(origen) && !poseedorOrigen) return null;
      if (poseedorOrigen) {
        tokens.push(poseedorOrigen.token);
        sustituciones.push(...poseedorOrigen.sustituciones);
        reglas.push({ leccion: 52, regla: "possessive-infix-galangu" });
      }
      if (origen.adjetivo) {
        tokens.push(`${origen.adjetivo}ŋuru`);
        reglas.push({ leccion: 34, regla: "adjective-agreement" });
      }
      tokens.push(`${palabra.gup}ŋuru`);
      reglas.push({ leccion: 28, regla: "ablative-nguru" });
    }
  } else if (origen.nombre) {
    if (origenGu) {
      const tokenGuNombre = `${origen.nombre}${sufijoPosesivo(origen.nombre).sufijo}`;
      tokens.push(tokenGuNombre);
      reglas.push({ leccion: 82, regla: "verb-behaviour-origin-gu" });
      return { tokens, reglas, sustituciones };
    }
    const sufijo = sufijoComitativo(origen.nombre);
    renderPersona(sufijo.conSufijo, sufijo.alternativo, origen.nombre);
  }
  if (tokens.length === 0) return null;
  return { tokens, reglas, sustituciones };
};

const infinitivoWa = (
  claveVerbo: string
): {
  token: string;
  sustituciones: { de: string; a: string; nota: string }[];
} | null => {
  const verbo = verboLibroPorClave(claveVerbo);
  if (!verbo) return null;
  const base =
    verbo.group === 1
      ? formaAtestada(verbo, "I")[0]
      : formaAtestada(verbo, "IV")[0];
  if (!base) return null;
  const token = verbo.group === 1 ? `${base}wa` : `${base}rawa`;
  return {
    token,
    sustituciones: [
      {
        de: token,
        a: verbo.group === 1 ? `${base}wu` : `${base}rawu`,
        nota: "Yirrkala: -wu",
      },
    ],
  };
};

const renderPerlativo = (
  perlativo: PerlativoIR
): {
  tokens: string[];
  reglas: ReglaAplicada[];
  sustituciones: { de: string; a: string; nota: string }[];
} | null => {
  const tokens: string[] = [];
  const reglas: ReglaAplicada[] = [];
  const sustituciones: { de: string; a: string; nota: string }[] = [];
  const notaAlterno = "-kurru y -wurru alternan tras vocal o líquida";
  if (perlativo.verbo) {
    const bases = basesVerbal(perlativo.verbo);
    if (!bases) return null;
    const sufijoVerbo = sufijoKurru(bases.corta);
    tokens.push(sufijoVerbo.conSufijo);
    if (sufijoVerbo.alternativo) {
      sustituciones.push({
        de: sufijoVerbo.conSufijo,
        a: sufijoVerbo.alternativo,
        nota: notaAlterno,
      });
    }
    reglas.push({ leccion: 53, regla: "verb-kurru-while" });
    return { tokens, reglas, sustituciones };
  }
  let base: string | null = null;
  if (perlativo.sustantivo) {
    const palabra = buscarPalabra(perlativo.sustantivo, "sustantivo");
    if (!palabra) return null;
    base = palabra.baseSufijos ?? palabra.gup;
  } else if (perlativo.nombre) {
    base = perlativo.nombre;
  }
  if (!base) return null;
  if (perlativo.adjetivo) {
    const sufijoAdj = sufijoKurru(perlativo.adjetivo);
    tokens.push(sufijoAdj.conSufijo);
    if (sufijoAdj.alternativo) {
      sustituciones.push({
        de: sufijoAdj.conSufijo,
        a: sufijoAdj.alternativo,
        nota: notaAlterno,
      });
    }
    reglas.push({ leccion: 34, regla: "adjective-agreement" });
  }
  const sufijo = sufijoKurru(base);
  tokens.push(sufijo.conSufijo);
  if (sufijo.alternativo) {
    sustituciones.push({
      de: sufijo.conSufijo,
      a: sufijo.alternativo,
      nota: notaAlterno,
    });
  }
  reglas.push({ leccion: 53, regla: "kurru-along-through" });
  return { tokens, reglas, sustituciones };
};

const renderProposito = (
  proposito: PropositoIR,
  modoInfinitivo?: "ra" | "terciaria"
): {
  tokens: string[];
  reglas: ReglaAplicada[];
  sustituciones: { de: string; a: string; nota: string }[];
} | null => {
  const tokens: string[] = [];
  const reglas: ReglaAplicada[] = [];
  const sustituciones: { de: string; a: string; nota: string }[] = [];
  if (proposito.persona) {
    tokens.push(VOCAB.posesivos[proposito.persona]);
    reglas.push({ leccion: 31, regla: "purpose-pronouns" });
  } else if (proposito.sustantivo || proposito.nombre) {
    let base: string | null = null;
    if (proposito.sustantivo) {
      const palabra = buscarPalabra(proposito.sustantivo, "sustantivo");
      if (!palabra) return null;
      base = palabra.gup;
    } else if (proposito.nombre) {
      base = proposito.nombre;
    }
    if (!base) return null;
    const sufijo = sufijoPosesivo(base);
    const conSufijo = `${base}${sufijo.sufijo}`;
    if (proposito.demostrativo) {
      tokens.push(demostrativoCasual(proposito.demostrativo, "dativo"));
      sustituciones.push(
        ...sustitucionesDemostrativo(proposito.demostrativo, "dativo")
      );
      reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
    }
    const poseedorProposito = renderPoseedorInfijado(proposito, "wa");
    if (tienePoseedorGenerable(proposito) && !poseedorProposito) return null;
    if (poseedorProposito) {
      tokens.push(poseedorProposito.token);
      sustituciones.push(...poseedorProposito.sustituciones);
      reglas.push({ leccion: 51, regla: "possessive-infix-galangu" });
    }
    if (proposito.adjetivo) {
      const sufijoAdj = sufijoPosesivo(proposito.adjetivo);
      tokens.push(`${proposito.adjetivo}${sufijoAdj.sufijo}`);
      reglas.push({ leccion: 34, regla: "adjective-agreement" });
    }
    tokens.push(conSufijo);
    reglas.push({ leccion: 31, regla: "purpose-gu" });
    const yirrkala = formaYirrkalaWu(base, sufijo.sufijo);
    if (yirrkala) {
      sustituciones.push({
        de: conSufijo,
        a: yirrkala,
        nota: "Yirrkala: -wu",
      });
    }
  }
  if (proposito.verbo) {
    if (modoInfinitivo) {
      const entradaInfinitivo = VOCAB.verbos.find(
        (candidato) => candidato.clave === proposito.verbo
      );
      if (!entradaInfinitivo) return null;
      const candidatosInfinitivo = verbosPorLema(entradaInfinitivo.lema);
      if (candidatosInfinitivo.length === 0) return null;
      const formaInfinitivo =
        modoInfinitivo === "ra"
          ? formaAtestada(candidatosInfinitivo[0], "IV")[0]
          : formaAtestada(candidatosInfinitivo[0], "III")[0];
      if (!formaInfinitivo) return null;
      tokens.push(
        modoInfinitivo === "ra" ? `${formaInfinitivo}ra` : formaInfinitivo
      );
      reglas.push({ leccion: 45, regla: "try-start-no-wa" });
    } else {
      const infinitivo = infinitivoWa(proposito.verbo);
      if (!infinitivo) return null;
      tokens.push(infinitivo.token);
      sustituciones.push(...infinitivo.sustituciones);
      reglas.push({ leccion: 44, regla: "verb-plus-wa-purpose" });
    }
  }
  if (tokens.length === 0) return null;
  return { tokens, reglas, sustituciones };
};

const formaYirrkalaWu = (base: string, sufijo: string): string | null => {
  if (sufijo === "wa") return `${base}wu`;
  if (sufijo === "gu" && /(rr|[lḻrwy])'?$/.test(base.toLowerCase())) {
    return `${base}wu`;
  }
  return null;
};

const sufijoNydja = (base: string): string => {
  const NASALES_NYDJA = new Set(["m", "n", "ṉ", "ŋ"]);
  const OCLUSIVAS_NYDJA = new Set(["p", "t", "ṯ", "k"]);
  if (base.endsWith("'")) {
    const previa = base.charAt(base.length - 2);
    if (NASALES_NYDJA.has(previa) || base.slice(0, -1).endsWith("ny")) {
      return `${base}tja`;
    }
    return `${base.slice(0, -1)}ny'tja`;
  }
  const ultima = base.charAt(base.length - 1);
  if (base.endsWith("ny") || NASALES_NYDJA.has(ultima)) return `${base}dja`;
  if (base.endsWith("tj") || OCLUSIVAS_NYDJA.has(ultima)) return `${base}tja`;
  return `${base}nydja`;
};

const generarInterrogativa = (frase: FraseIR): TraduccionGenerada | null => {
  if (
    frase.predicado.clave === "nhaltjan" &&
    frase.predicado.estado !== undefined &&
    frase.sujeto?.persona !== undefined
  ) {
    const entradaEstado = VOCAB.verbos.find(
      (candidato) => candidato.clave === frase.predicado.estado
    );
    const libroEstado = entradaEstado
      ? verbosPorLema(entradaEstado.lema)[0]
      : undefined;
    const libroNhaltjan = verbosPorLema("nhaltjan")[0];
    if (libroEstado && libroNhaltjan) {
      const formaVerbal =
        frase.tiempo === "pasado_hoy" || frase.tiempo === "pasado_ayer"
          ? "III"
          : "I";
      const formaVerbo = formaAtestada(libroEstado, formaVerbal)[0];
      const formaPregunta = formaAtestada(libroNhaltjan, formaVerbal)[0];
      if (formaVerbo && formaPregunta) {
        const pronombre = VOCAB.pronombres[frase.sujeto.persona];
        const particulas: string[] = [];
        if (formaVerbal === "I" && frase.tiempo === "futuro_hoy") {
          particulas.push(VOCAB.particulas.futuro);
        } else if (formaVerbal === "I") {
          particulas.push(VOCAB.particulas.continuo);
        } else if (frase.aspecto === "continuo") {
          particulas.push("gana");
        }
        const gup = `${capitalizar(formaPregunta)} ${pronombre} ${[...particulas, formaVerbo].join(" ")}?`;
        return {
          gup,
          reglas: [{ leccion: 86, regla: "bitjan-nhaltjan" }],
          atestada: false,
          alternativas: [
            {
              gup: gup.replace(`${formaVerbo}?`, `${sufijoNydja(formaVerbo)}?`),
              nota: "-nydja muy común al final de una pregunta (nota 3, lección 86; regla de forma de la lección 84-B)",
            },
          ],
        };
      }
    }
  }
  if (frase.predicado.clave === "yolyaku") {
    const personaNombre = frase.sujeto?.persona;
    if (!personaNombre) return null;
    return {
      gup: `Yol ${VOCAB.pronombres[personaNombre]} yäku?`,
      reglas: [{ leccion: 80, regla: "body-parts-one-with-person" }],
      atestada: false,
    };
  }
  if (
    frase.predicado.clave === "wanhaPeticion" &&
    frase.predicado.estado !== undefined
  ) {
    const entradaPeticion = VOCAB.verbos.find(
      (candidato) => candidato.clave === frase.predicado.estado
    );
    const libroPeticion = entradaPeticion
      ? verbosPorLema(entradaPeticion.lema)[0]
      : undefined;
    const segundaPeticion = libroPeticion
      ? formaAtestada(libroPeticion, "II")[0]
      : undefined;
    if (segundaPeticion) {
      const objetoPeticion = frase.objeto?.persona
        ? `${VOCAB.objetos[frase.objeto.persona]} `
        : "";
      const verboNydja = sufijoNydja(segundaPeticion);
      const gupPeticion = `Wanha nhe ${objetoPeticion}${verboNydja}?`;
      return {
        gup: gupPeticion,
        reglas: [{ leccion: 90, regla: "asking-questions" }],
        atestada: false,
        alternativas: [
          {
            gup: `Wanha nhe balaŋu ${objetoPeticion}${verboNydja}?`,
            nota: "con balaŋu: podrías... (más suave)",
          },
          {
            gup: `Wanha nhe ŋuli ${objetoPeticion}${verboNydja}?`,
            nota: "con ŋuli: deberías... (más exhortativo)",
          },
          {
            gup: `Wanha nhe ${objetoPeticion}${segundaPeticion}?`,
            nota: "sin -nydja, más llano",
          },
        ],
      };
    }
  }
  if (frase.predicado.clave === "wanhatjan") {
    const personaCamino = frase.sujeto?.persona;
    if (!personaCamino) return null;
    const pronombreCamino = VOCAB.pronombres[personaCamino];
    const gupCamino = `Wanhatjan ${pronombreCamino} ${VOCAB.particulas.futuro}?`;
    return {
      gup: gupCamino,
      reglas: [{ leccion: 87, regla: "dhuwalatjan-way" }],
      atestada: false,
      alternativas: [
        {
          gup: gupCamino.replace("Wanhatjan", "Wanhawitjan"),
          nota: "el (wi) entre paréntesis puede incluirse (nota 3, lección 87)",
        },
        {
          gup: gupCamino.replace("Wanhatjan", "Wanhaŋuwurru"),
          nota: "a veces wanhaŋuwurru en lugar de wanhawitjan (nota 4, lección 87)",
        },
      ],
    };
  }
  if (frase.predicado.clave === "nhaltjan") {
    const persona = frase.sujeto?.persona;
    if (!persona) return null;
    return {
      gup: `${capitalizar(VOCAB.interrogativos.nhaltjan)} ${VOCAB.pronombres[persona]} ${VOCAB.particulas.futuro}?`,
      reglas: [{ leccion: 11, regla: "question-nhaltjan" }],
      atestada: false,
    };
  }

  if (frase.predicado.clave === "yolku") {
    const demostrativo = frase.sujeto?.demostrativo;
    const sustantivo = frase.sujeto?.sustantivo
      ? buscarPalabra(frase.sujeto.sustantivo, "sustantivo")
      : null;
    if (!demostrativo || !sustantivo) return null;
    const resultado: TraduccionGenerada = {
      gup: `${capitalizar(VOCAB.interrogativos.yolku)} ${VOCAB.demostrativos[demostrativo]} ${sustantivo.gup}?`,
      reglas: [{ leccion: 13, regla: "yolku-question" }],
      atestada: false,
    };
    if (frase.sujeto?.articuloDefinido) {
      const otro =
        VOCAB.demostrativos[demostrativo === "este" ? "ese" : "este"];
      resultado.alternativas = [
        {
          gup: `${capitalizar(VOCAB.interrogativos.yolku)} ${otro} ${sustantivo.gup}?`,
          nota: "el artículo no distingue cerca/lejos",
        },
      ];
    }
    return resultado;
  }

  if (
    frase.predicado.clave === "yolkala" ||
    frase.predicado.clave === "yolkala-caso" ||
    frase.predicado.clave === "nhakurru" ||
    frase.predicado.clave === "nhalili" ||
    frase.predicado.clave === "wanhanguru" ||
    frase.predicado.clave === "nhanguru" ||
    frase.predicado.clave === "nhaku-accion" ||
    frase.predicado.clave === "yolku-accion" ||
    frase.predicado.clave === "nhaliy" ||
    frase.predicado.clave === "nhamunhamirri" ||
    frase.predicado.clave === "wanhami" ||
    frase.predicado.clave === "nhapuy-accion"
  ) {
    const palabraInterrogativa =
      frase.predicado.clave === "yolkala" ||
      frase.predicado.clave === "yolkala-caso"
        ? VOCAB.interrogativos.yolkala
        : frase.predicado.clave === "nhamunhamirri"
          ? VOCAB.interrogativos.nhamunhamirri
          : frase.predicado.clave === "wanhami"
          ? VOCAB.interrogativos.wanhami
          : frase.predicado.clave === "nhapuy-accion"
          ? VOCAB.interrogativos.nhapuy
          : frase.predicado.clave === "nhakurru"
          ? VOCAB.interrogativos.nhakurru
          : frase.predicado.clave === "nhanguru"
            ? VOCAB.interrogativos.nhanguru
            : frase.predicado.clave === "wanhanguru"
              ? VOCAB.interrogativos.wanhanguru
              : frase.predicado.clave === "nhaku-accion"
                ? VOCAB.interrogativos.nhaku
                : frase.predicado.clave === "yolku-accion"
                  ? VOCAB.interrogativos.yolku
                  : frase.predicado.clave === "nhaliy"
                    ? VOCAB.interrogativos.nhaliy
                    : VOCAB.interrogativos.nhalili;
    const partesPregunta: string[] = [capitalizar(palabraInterrogativa)];
    const formasCasoAlternas: string[] = [];
    if (frase.predicado.clave === "yolkala-caso") {
      if (!frase.predicado.sustantivoCaso) return null;
      const palabraCaso = buscarPalabra(
        frase.predicado.sustantivoCaso,
        "sustantivo"
      );
      if (!palabraCaso) return null;
      const formaDeCaso = (base: string, final?: string): string =>
        frase.predicado.casoPregunta === "lili"
          ? `${base}lili`
          : frase.predicado.casoPregunta === "instrumento"
            ? final
              ? `${base}${sufijoAgente(final).sufijo}`
              : sufijoAgente(base).conSufijo
            : `${base}ŋura`;
      partesPregunta.push(
        formaDeCaso(palabraCaso.gup, palabraCaso.pronunciacionFinal)
      );
      for (const baseAlterna of palabraCaso.basesAlternas ?? []) {
        formasCasoAlternas.push(formaDeCaso(baseAlterna));
      }
    }
    const sujeto = frase.sujeto;
    if (sujeto) {
      if (sujeto.persona) partesPregunta.push(VOCAB.pronombres[sujeto.persona]);
      else if (sujeto.sustantivo) {
        const palabraSujeto = buscarPalabra(sujeto.sustantivo, "sustantivo");
        if (!palabraSujeto) return null;
        partesPregunta.push(palabraSujeto.gup);
      } else if (sujeto.nombre) partesPregunta.push(sujeto.nombre);
      else return null;
      const claveVerbo =
        frase.predicado.estado ??
        (frase.predicado.clave === "yolkala"
          ? "sit"
          : frase.predicado.clave === "nhanguru"
            ? "fall"
            : "go");
      const entradaVerbo = VOCAB.verbos.find(
        (candidato) => candidato.clave === claveVerbo
      );
      if (!entradaVerbo) return null;
      const candidatosVerbo = verbosPorLema(entradaVerbo.lema);
      if (candidatosVerbo.length === 0) return null;
      const verboPregunta = candidatosVerbo[0];
      const tiempoPregunta = frase.tiempo ?? "continuo";
      const grupoUnoPasado =
        tiempoPregunta === "pasado_hoy" && verboPregunta.group === 1;
      const formasPregunta = formaAtestada(
        verboPregunta,
        tiempoPregunta === "futuro_manana"
          ? "II"
          : tiempoPregunta === "pasado_hoy" && !grupoUnoPasado
            ? "III"
            : "I"
      );
      if (formasPregunta.length === 0) return null;
      if (frase.objeto?.persona) {
        partesPregunta.push(VOCAB.objetos[frase.objeto.persona]);
      } else if (frase.objeto?.sustantivo) {
        const cosaPregunta = buscarPalabra(
          frase.objeto.sustantivo,
          "sustantivo"
        );
        if (!cosaPregunta) return null;
        partesPregunta.push(
          cosaPregunta.persona ? `${cosaPregunta.gup}nha` : cosaPregunta.gup
        );
      } else if (frase.objeto?.nombre) {
        partesPregunta.push(`${frase.objeto.nombre}nha`);
      }
      if (tiempoPregunta === "continuo") {
        partesPregunta.push(VOCAB.particulas.continuo);
      } else if (
        tiempoPregunta === "futuro_hoy" ||
        tiempoPregunta === "futuro_manana"
      ) {
        partesPregunta.push(VOCAB.particulas.futuro);
      }
      if (frase.raliVerbo) {
        partesPregunta.push(VOCAB.direcciones.rali.gup);
      }
      partesPregunta.push(formasPregunta[0]);
    }
    const indiceSujetoPregunta =
      frase.predicado.clave === "yolkala-caso" ? 2 : 1;
    const resultadoPregunta: TraduccionGenerada = {
      gup: `${partesPregunta.join(" ")}?`,
      reglas: [
        frase.predicado.clave === "yolkala"
          ? { leccion: 26, regla: "question-yolkala" }
          : frase.predicado.clave === "yolkala-caso"
            ? { leccion: 36, regla: "question-yolkala-case" }
            : frase.predicado.clave === "nhamunhamirri"
              ? { leccion: 40, regla: "question-nhamunhamirri" }
              : frase.predicado.clave === "nhaku-accion" ||
                frase.predicado.clave === "yolku-accion"
              ? { leccion: 31, regla: "purpose-questions" }
              : frase.predicado.clave === "nhaliy"
                ? { leccion: 33, regla: "question-nhaliy" }
                : { leccion: 27, regla: "question-nhakurru" },
      ],
      atestada: false,
    };
    if (frase.predicado.clave === "wanhami") {
      resultadoPregunta.alternativas = [
        ...(resultadoPregunta.alternativas ?? []),
        {
          gup: `${[
            capitalizar(VOCAB.interrogativos.wanhala),
            ...partesPregunta.slice(1),
          ].join(" ")}?`,
          nota: "también wanhala",
        },
      ];
    }
    if (frase.personaAlternativa && sujeto?.persona) {
      const copia = [...partesPregunta];
      copia[indiceSujetoPregunta] = VOCAB.pronombres[frase.personaAlternativa];
      resultadoPregunta.alternativas = [
        ...(resultadoPregunta.alternativas ?? []),
        {
          gup: `${copia.join(" ")}?`,
          nota: "otra lectura de persona (él/ella)",
        },
      ];
    }
    if (
      frase.predicado.clave === "yolkala-caso" &&
      partesPregunta.length > 2
    ) {
      const interrogMinuscula =
        palabraInterrogativa.charAt(0).toLowerCase() +
        palabraInterrogativa.slice(1);
      const colaPregunta = partesPregunta.slice(3);
      const formasCaso = [partesPregunta[1], ...formasCasoAlternas];
      const formasSujeto = [partesPregunta[2]];
      if (sujeto?.persona) {
        for (const ambigua of PERSONAS_AMBIGUAS[sujeto.persona] ?? []) {
          formasSujeto.push(VOCAB.pronombres[ambigua.persona]);
        }
      }
      const ordenes: AlternativaGenerada[] = [];
      formasCaso.forEach((formaCaso, indiceCaso) => {
        formasSujeto.forEach((formaSujeto, indiceForma) => {
          const patrones: string[][] = [
            [
              capitalizar(formaSujeto),
              interrogMinuscula,
              formaCaso,
              ...colaPregunta,
            ],
            [
              capitalizar(interrogMinuscula),
              formaSujeto,
              formaCaso,
              ...colaPregunta,
            ],
          ];
          if (indiceForma > 0 || indiceCaso > 0) {
            patrones.unshift([
              capitalizar(interrogMinuscula),
              formaCaso,
              formaSujeto,
              ...colaPregunta,
            ]);
          }
          for (const patron of patrones) {
            ordenes.push({
              gup: `${patron.join(" ")}?`,
              nota:
                indiceForma > 0 || indiceCaso > 0
                  ? "orden libre / otra lectura"
                  : "orden libre",
            });
          }
        });
      });
      resultadoPregunta.alternativas = [
        ...(resultadoPregunta.alternativas ?? []),
        ...ordenes,
      ];
    }
    return resultadoPregunta;
  }

  if (frase.predicado.clave === "nhapuy") {
    const demostrativo = frase.sujeto?.demostrativo;
    const resultado: TraduccionGenerada = {
      gup: demostrativo
        ? `${capitalizar(VOCAB.demostrativos[demostrativo])} ${VOCAB.interrogativos.nhapuy}?`
        : `${capitalizar(VOCAB.interrogativos.nhapuy)}?`,
      reglas: [{ leccion: 39, regla: "question-nhapuy" }],
      atestada: false,
    };
    if (demostrativo) {
      resultado.alternativas = [
        {
          gup: `${capitalizar(VOCAB.interrogativos.nhapuy)} ${VOCAB.demostrativos[demostrativo]}?`,
          nota: "orden libre",
        },
        {
          gup: `${capitalizar(VOCAB.interrogativos.nhaku)} ${VOCAB.demostrativos[demostrativo]}?`,
          nota: "también nhaku: para qué",
        },
      ];
    } else {
      resultado.alternativas = [
        {
          gup: `${capitalizar(VOCAB.interrogativos.nhaku)}?`,
          nota: "también nhaku: para qué",
        },
      ];
    }
    return resultado;
  }

  if (frase.predicado.clave === "wanhanguwuy") {
    const demostrativo = frase.sujeto?.demostrativo ?? "este";
    const sustantivo = frase.sujeto?.sustantivo
      ? buscarPalabra(frase.sujeto.sustantivo, "sustantivo")
      : null;
    if (!sustantivo) return null;
    return {
      gup: `${capitalizar(VOCAB.interrogativos.wanhanguwuy)} ${VOCAB.demostrativos[demostrativo]} ${sustantivo.gup}?`,
      reglas: [{ leccion: 39, regla: "question-wanhanguwuy" }],
      atestada: false,
      alternativas: [
        {
          gup: `${capitalizar(VOCAB.demostrativos[demostrativo])} ${sustantivo.gup} ${VOCAB.interrogativos.wanhanguwuy}?`,
          nota: "orden del libro (lección 57): sujeto primero",
        },
      ],
    };
  }

  if (frase.predicado.clave === "wanha") {
    const sujeto = frase.sujeto;
    let parteSujeto: string | null = null;
    if (sujeto?.persona) parteSujeto = VOCAB.pronombres[sujeto.persona];
    else if (sujeto?.sustantivo) {
      const palabraSujeto = buscarPalabra(sujeto.sustantivo, "sustantivo");
      if (!palabraSujeto) return null;
      parteSujeto = palabraSujeto.gup;
    } else if (sujeto?.nombre) parteSujeto = sujeto.nombre;
    if (!parteSujeto) return null;
    return {
      gup: `${capitalizar(VOCAB.interrogativos.wanha)} ${parteSujeto}?`,
      reglas: [{ leccion: 25, regla: "question-wanha" }],
      atestada: false,
    };
  }

  if (frase.predicado.clave === "yolthu") {
    let entrada = VOCAB.verbos.find(
      (candidato) => candidato.clave === frase.predicado.estado
    );
    let verboSinteticoPregunta: VerboLibro | null = null;
    if (!entrada && frase.predicado.estado) {
      const derivadoPregunta = resolverDerivadoAdjetivo(frase.predicado.estado);
      if (derivadoPregunta) {
        entrada = derivadoPregunta.entrada;
        verboSinteticoPregunta = derivadoPregunta.verbo;
      }
    }
    if (!entrada) return null;
    const candidatos = verboSinteticoPregunta
      ? [verboSinteticoPregunta]
      : verbosPorLema(entrada.lema);
    if (candidatos.length === 0) return null;
    const verbo = candidatos[0];
    const tiempoPregunta = frase.tiempo ?? "pasado_hoy";
    const formas = formaAtestada(
      verbo,
      tiempoPregunta === "pasado_hoy"
        ? "III"
        : tiempoPregunta === "futuro_manana"
          ? "II"
          : "I"
    );
    if (formas.length === 0) return null;
    const transitivoPregunta =
      (entrada.valencia ??
        (verbo.valence?.includes("Vtr") ? "Vtr" : "Vin")) === "Vtr";
    const partesPregunta: string[] = [
      capitalizar(
        transitivoPregunta
          ? VOCAB.interrogativos.yolthu
          : VOCAB.interrogativos.yol
      ),
    ];
    let colaDativaPregunta: string | null = null;
    if (frase.objeto && entrada.objetoDativo) {
      if (frase.objeto.persona) {
        colaDativaPregunta = VOCAB.posesivos[frase.objeto.persona];
      } else {
        let baseDativo: string | null = null;
        if (frase.objeto.sustantivo) {
          const cosaDativo = buscarPalabra(frase.objeto.sustantivo, "sustantivo");
          if (!cosaDativo) return null;
          baseDativo = cosaDativo.gup;
        } else if (frase.objeto.nombre) {
          baseDativo = frase.objeto.nombre;
        }
        if (baseDativo) {
          colaDativaPregunta = `${baseDativo}${sufijoPosesivo(baseDativo).sufijo}`;
        }
      }
    } else if (frase.objeto?.persona) {
      partesPregunta.push(VOCAB.objetos[frase.objeto.persona]);
    } else if (frase.objeto?.sustantivo) {
      const cosa = buscarPalabra(frase.objeto.sustantivo, "sustantivo");
      if (!cosa) return null;
      partesPregunta.push(cosa.persona ? `${cosa.gup}nha` : cosa.gup);
    } else if (frase.objeto?.nombre) {
      partesPregunta.push(`${frase.objeto.nombre}nha`);
    }
    if (tiempoPregunta === "futuro_hoy" || tiempoPregunta === "futuro_manana") {
      partesPregunta.push(VOCAB.particulas.futuro);
    } else if (tiempoPregunta === "continuo") {
      partesPregunta.push(VOCAB.particulas.continuo);
    }
    partesPregunta.push(formas[0]);
    if (colaDativaPregunta) {
      partesPregunta.push(colaDativaPregunta);
    }
    return {
      gup: `${partesPregunta.join(" ")}?`,
      reglas: [
        transitivoPregunta
          ? { leccion: 22, regla: "question-yolthu" }
          : { leccion: 24, regla: "question-yol" },
        ...(colaDativaPregunta
          ? [{ leccion: 47, regla: "dative-object-verbs" } as ReglaAplicada]
          : []),
      ],
      atestada: false,
    };
  }

  if (
    frase.predicado.clave === "nhaku" ||
    frase.predicado.clave === "yolku-quien"
  ) {
    const persona = frase.sujeto?.persona;
    if (!persona) return null;
    const estado = VOCAB.estados.find(
      (candidato) => candidato.clave === (frase.predicado.estado ?? "want")
    );
    if (!estado) return null;
    const palabraInterrogativa =
      frase.predicado.clave === "nhaku"
        ? VOCAB.interrogativos.nhaku
        : VOCAB.interrogativos.yolku;
    return {
      gup: `${capitalizar(palabraInterrogativa)} ${VOCAB.pronombres[persona]} ${estado.gup}?`,
      reglas: [
        {
          leccion: 15,
          regla:
            frase.predicado.clave === "nhaku"
              ? "question-nhaku"
              : "question-yolku-whom",
        },
      ],
      atestada: false,
    };
  }

  const demostrativo = frase.sujeto?.demostrativo;
  if (!demostrativo) return null;
  return {
    gup: `${capitalizar(VOCAB.interrogativos.que)} ${VOCAB.demostrativos[demostrativo]}?`,
    reglas: [{ leccion: 2, regla: "question-nha" }],
    atestada: false,
  };
};

const generarImperativa = (frase: FraseIR): TraduccionGenerada | null => {
  if (frase.prohibitivoMiriw) {
    const basesProhibido = basesVerbal(frase.predicado.clave);
    if (!basesProhibido) return null;
    const alternativasProhibido: AlternativaGenerada[] = [
      {
        gup: `${capitalizar(basesProhibido.larga)}miriw!`,
        nota: "Yirrkala: cuaternaria larga",
      },
    ];
    const clasica = generarImperativa({
      ...frase,
      prohibitivoMiriw: undefined,
    });
    if (clasica) {
      alternativasProhibido.push({
        gup: clasica.gup,
        nota: "también el imperativo negativo con yaka",
      });
    }
    return {
      gup: `${capitalizar(basesProhibido.corta)}miriw!`,
      reglas: [{ leccion: 73, regla: "prohibitive-miriw" }],
      atestada: false,
      alternativas: alternativasProhibido,
    };
  }
  const lugarAquiImperativo =
    frase.lugar?.demostrativo &&
    !frase.lugar.sustantivo &&
    !frase.lugar.nombre &&
    !frase.lugar.adverbio
      ? frase.lugar.demostrativo
      : null;
  if (frase.lugar && !lugarAquiImperativo) return null;
  let entrada = VOCAB.verbos.find(
    (verbo) => verbo.clave === frase.predicado.clave
  );
  let verboSinteticoImperativo: VerboLibro | null = null;
  if (!entrada) {
    const derivadoImperativo = resolverDerivadoAdjetivo(frase.predicado.clave);
    if (derivadoImperativo) {
      entrada = derivadoImperativo.entrada;
      verboSinteticoImperativo = derivadoImperativo.verbo;
    }
  }
  if (!entrada) return null;
  const candidatos = verboSinteticoImperativo
    ? [verboSinteticoImperativo]
    : verbosPorLema(entrada.lema);
  if (candidatos.length === 0) return null;
  let verbo = candidatos[0];
  let conmutadoTransitivo = false;
  if (frase.objeto && !entrada.objetoDativo) {
    if (entrada.derivaMarama) {
      const derivado = derivarMarama(verbo);
      if (derivado) {
        verbo = derivado.verbo;
        conmutadoTransitivo = true;
      }
    } else if (entrada.lemaTransitivo) {
      const candidatosTransitivos = verbosPorLema(entrada.lemaTransitivo);
      if (candidatosTransitivos.length > 0) {
        verbo = candidatosTransitivos[0];
        conmutadoTransitivo = true;
      }
    }
  }
  const formas = formaAtestada(verbo, "II");
  if (formas.length === 0) return null;
  const secundaria = formas[0];

  const reglas: ReglaAplicada[] = [
    { leccion: 3, regla: "secondary-is-command" },
  ];
  if (conmutadoTransitivo) {
    reglas.push({ leccion: 48, regla: "transitive-marama" });
  }
  const reglaGrupo = REGLA_GRUPO[verbo.group];
  if (reglaGrupo) reglas.push(reglaGrupo);

  const colaTokens: string[] = [];
  const sustitucionesCola: { de: string; a: string; nota: string }[] = [];
  if (frase.comitativo) {
    const comitativo = renderComitativo(frase.comitativo);
    if (!comitativo) return null;
    reglas.push(...comitativo.reglas);
    colaTokens.push(...comitativo.tokens);
    if (comitativo.alternativo) sustitucionesCola.push(comitativo.alternativo);
  }

  let destinoImperativo: DestinoIR | null = frase.destino ?? null;
  const verboDeMovimiento =
    entrada.movimiento === true || entrada.transporte === true;
  if (frase.adverbio) {
    const adverbioImperativo = buscarPalabra(frase.adverbio, "adverbio");
    if (!adverbioImperativo) return null;
    if (adverbioImperativo.subtipo === "lugar" && verboDeMovimiento) {
      if (destinoImperativo?.adverbio) return null;
      destinoImperativo = {
        ...(destinoImperativo ?? {}),
        adverbio: adverbioImperativo.clave,
      };
    }
  }

  let tokensDestino: string[] = [];
  if (destinoImperativo) {
    const destino = renderDestino(
      destinoImperativo,
      entrada.transporte === true,
      entrada.llegada === true
    );
    if (!destino) return null;
    reglas.push(...destino.reglas);
    tokensDestino = destino.tokens;
    colaTokens.push(...destino.tokens);
    sustitucionesCola.push(...destino.sustituciones);
  }

  if (frase.origen) {
    const origen = renderOrigen(
      frase.origen,
      entrada.movimiento === true,
      entrada.origenGu === true
    );
    if (!origen) return null;
    reglas.push(...origen.reglas);
    colaTokens.push(...origen.tokens);
    sustitucionesCola.push(...origen.sustituciones);
  }

  if (frase.proposito) {
    const proposito = renderProposito(frase.proposito);
    if (!proposito) return null;
    reglas.push(...proposito.reglas);
    colaTokens.push(...proposito.tokens);
    sustitucionesCola.push(...proposito.sustituciones);
  }

  if (frase.instrumento?.sustantivo) {
    const cosaInstrumento = buscarPalabra(
      frase.instrumento.sustantivo,
      "sustantivo"
    );
    if (!cosaInstrumento) return null;
    const agenteInstrumento = cosaInstrumento.pronunciacionFinal
      ? {
          conSufijo: `${cosaInstrumento.gup}${sufijoAgente(cosaInstrumento.pronunciacionFinal).sufijo}`,
          sufijo: sufijoAgente(cosaInstrumento.pronunciacionFinal).sufijo,
        }
      : sufijoAgente(cosaInstrumento.gup);
    const poseedorInstrumento = renderPoseedorComitativo(frase.instrumento);
    if (tienePoseedorGenerable(frase.instrumento) && !poseedorInstrumento) {
      return null;
    }
    if (poseedorInstrumento) {
      colaTokens.push(poseedorInstrumento.token);
      sustitucionesCola.push(...poseedorInstrumento.sustituciones);
      reglas.push({ leccion: 36, regla: "possessive-gala-suffixed-head" });
    }
    colaTokens.push(agenteInstrumento.conSufijo);
    reglas.push({ leccion: 33, regla: "instrument-thing" });
    if (agenteInstrumento.sufijo === "y") {
      sustitucionesCola.push({
        de: agenteInstrumento.conSufijo,
        a: `${cosaInstrumento.gup}yu`,
        nota: "Yirrkala: -yu",
      });
    }
    for (const baseAlterna of cosaInstrumento.basesAlternas ?? []) {
      sustitucionesCola.push({
        de: agenteInstrumento.conSufijo,
        a: sufijoAgente(baseAlterna).conSufijo,
        nota: `también ${baseAlterna}`,
      });
    }
  }

  if (frase.perlativo) {
    const perlativoRender = renderPerlativo(frase.perlativo);
    if (!perlativoRender) return null;
    reglas.push(...perlativoRender.reglas);
    colaTokens.push(...perlativoRender.tokens);
    sustitucionesCola.push(...perlativoRender.sustituciones);
  }

  if (lugarAquiImperativo) {
    const formaAquiImperativo = demostrativoCasual(
      lugarAquiImperativo,
      "ngura"
    );
    colaTokens.push(formaAquiImperativo);
    sustitucionesCola.push(
      ...sustitucionesDemostrativo(lugarAquiImperativo, "ngura")
    );
    sustitucionesCola.push(
      {
        de: formaAquiImperativo,
        a: `${formaAquiImperativo}dhi`,
        nota: "-dhi de énfasis: ahí MISMO",
      },
      {
        de: formaAquiImperativo,
        a: `${formaAquiImperativo}yi`,
        nota: "-yi de énfasis: ahí MISMO",
      }
    );
    reglas.push({ leccion: 55, regla: "here-demonstrative" });
  }

  if (frase.veces) {
    const tokenVeces = `${frase.veces}mirri`;
    colaTokens.push(tokenVeces);
    reglas.push({ leccion: 40, regla: "mirri-times" });
    sustitucionesCola.push({
      de: tokenVeces,
      a: `buku-${frase.veces}`,
      nota: "también buku- (buku-waŋgany, buku-märrma'...)",
    });
  }

  for (const sinonimo of formasSinonimas(entrada.clave, "II")) {
    sustitucionesCola.push({
      de: secundaria,
      a: sinonimo.forma,
      nota: `también ${sinonimo.forma}`,
    });
  }

  const conCola = (cuerpo: string): TraduccionGenerada => {
    const cola = colaTokens.length > 0 ? ` ${colaTokens.join(" ")}` : "";
    const gup = `${cuerpo}${cola}!`;
    const alternativas: AlternativaGenerada[] = [];
    for (const sustitucion of sustitucionesCola) {
      alternativas.push({
        gup: sustituirToken(gup, sustitucion.de, sustitucion.a),
        nota: sustitucion.nota,
      });
    }
    if (tokensDestino.length > 0 && !destinoImperativo?.direccion) {
      alternativas.push({
        gup: `${cuerpo} ${VOCAB.direcciones.bala.gup} ${colaTokens.join(" ")}!`,
        nota: "bala — movimiento alejándose del hablante",
      });
    }
    if (tokensDestino.length > 0) {
      const gupOrden = `${capitalizar(colaTokens.join(" "))} ${cuerpo.charAt(0).toLowerCase()}${cuerpo.slice(1)}!`;
      alternativas.push({ gup: gupOrden, nota: "orden alternativo" });
      for (const sustitucion of sustitucionesCola) {
        const conSustitucion = sustituirToken(
          gupOrden,
          sustitucion.de,
          sustitucion.a
        );
        if (conSustitucion !== gupOrden) {
          alternativas.push({
            gup: conSustitucion,
            nota: `${sustitucion.nota} (orden alternativo)`,
          });
        }
      }
    }
    const resultado: TraduccionGenerada = { gup, reglas, atestada: false };
    if (alternativas.length > 0) resultado.alternativas = alternativas;
    return resultado;
  };

  let prefijoObjeto = "";
  if (frase.objeto) {
    if (entrada.objetoDativo) {
      if (frase.objeto.demostrativo) {
        colaTokens.push(
          demostrativoCasual(frase.objeto.demostrativo, "dativo")
        );
        sustitucionesCola.push(
          ...sustitucionesDemostrativo(frase.objeto.demostrativo, "dativo")
        );
        reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
      }
      if (tienePoseedorGenerable(frase.objeto)) {
        const poseedorDativoImp = renderPoseedorInfijado(frase.objeto, "wa");
        if (!poseedorDativoImp) return null;
        colaTokens.push(poseedorDativoImp.token);
        sustitucionesCola.push(...poseedorDativoImp.sustituciones);
        reglas.push({ leccion: 51, regla: "possessive-infix-dative" });
      }
      let tokenDativo: string | null = null;
      if (frase.objeto.persona) {
        tokenDativo = VOCAB.posesivos[frase.objeto.persona];
      } else {
        let baseDativo: string | null = null;
        if (frase.objeto.sustantivo) {
          const cosaDativo = buscarPalabra(frase.objeto.sustantivo, "sustantivo");
          if (!cosaDativo) return null;
          baseDativo = cosaDativo.gup;
        } else if (frase.objeto.nombre) {
          baseDativo = frase.objeto.nombre;
        }
        if (baseDativo) {
          const sufijoDativo = sufijoPosesivo(baseDativo);
          tokenDativo = `${baseDativo}${sufijoDativo.sufijo}`;
          const yirrkalaDativo = formaYirrkalaWu(
            baseDativo,
            sufijoDativo.sufijo
          );
          if (yirrkalaDativo) {
            sustitucionesCola.push({
              de: tokenDativo,
              a: yirrkalaDativo,
              nota: "Yirrkala: -wu",
            });
          }
        }
      }
      if (tokenDativo) {
        colaTokens.push(tokenDativo);
        reglas.push({ leccion: 47, regla: "dative-object-verbs" });
      }
    } else if (frase.objeto.persona) {
      prefijoObjeto = `${VOCAB.objetos[frase.objeto.persona]} `;
      reglas.push({ leccion: 20, regla: "nha-pronoun-object" });
    } else {
      let baseObjeto: string | null = null;
      if (frase.objeto.sustantivo) {
        const cosaObjeto = buscarPalabra(frase.objeto.sustantivo, "sustantivo");
        if (!cosaObjeto) return null;
        baseObjeto = cosaObjeto.persona ? `${cosaObjeto.gup}nha` : cosaObjeto.gup;
      } else if (frase.objeto.nombre) {
        baseObjeto = `${frase.objeto.nombre}nha`;
      }
      if (baseObjeto) {
        if (frase.objeto.demostrativo) {
          const demObjetoImperativo = demostrativoCasual(
            frase.objeto.demostrativo,
            "base"
          );
          prefijoObjeto = `${demObjetoImperativo} ${baseObjeto} `;
          sustitucionesCola.push(
            ...sustitucionesDemostrativo(frase.objeto.demostrativo, "base")
          );
          reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
        } else {
          prefijoObjeto = `${baseObjeto} `;
        }
        reglas.push({ leccion: 19, regla: "nha-person-object" });
      }
    }
  }

  if (frase.aspecto === "continuo") {
    const particula = VOCAB.particulas.continuoSecundaria;
    reglas.push({ leccion: 18, regla: "continuous-command" });
    if (frase.polaridad === "negativa") {
      return conCola(
        `${capitalizar(VOCAB.negacionImperativo)} ${VOCAB.pronombres["2sg"]} ${particula} ${secundaria}`
      );
    }
    return conCola(capitalizar(`${prefijoObjeto}${secundaria} ${particula}`));
  }

  if (frase.polaridad === "negativa") {
    reglas.push({ leccion: 3, regla: "negative-command" });
    const resultadoNegativo = conCola(
      `${capitalizar(VOCAB.negacionImperativo)} ${prefijoObjeto}${secundaria}`
    );
    if (resultadoNegativo && !frase.objeto && !frase.aspecto) {
      const basesNegadas = basesVerbal(frase.predicado.clave);
      if (basesNegadas) {
        resultadoNegativo.alternativas = [
          ...(resultadoNegativo.alternativas ?? []),
          {
            gup: `${capitalizar(basesNegadas.corta)}miriw!`,
            nota: "también la cuaternaria + -miriw: sin poder/sin hacer",
          },
        ];
      }
    }
    return resultadoNegativo;
  }

  return conCola(capitalizar(`${prefijoObjeto}${secundaria}`));
};

const elegirPostura = (frase: FraseIR): string => {
  const lugar = frase.lugar;
  if (lugar?.sustantivo) {
    const cosaLugar = buscarPalabra(lugar.sustantivo, "sustantivo");
    if (cosaLugar?.posturaLugar) return cosaLugar.posturaLugar;
  }
  const sujeto = frase.sujeto;
  if (sujeto?.persona || sujeto?.nombre) return "sit";
  if (sujeto?.sustantivo) {
    const cosa = buscarPalabra(sujeto.sustantivo, "sustantivo");
    if (cosa?.persona) return "sit";
    if (cosa?.postura) return cosa.postura;
  }
  return "sleep";
};

const generarVerbal = (frase: FraseIR): TraduccionGenerada | null => {
  const persona = frase.sujeto?.persona;
  const tiempo = frase.tiempo;
  if (!tiempo) return null;
  if (!persona && !frase.sujeto?.sustantivo && !frase.sujeto?.nombre) {
    return null;
  }

  const claveVerbo = frase.esSerLugar
    ? elegirPostura(frase)
    : frase.predicado.clave === "tell" &&
        frase.objeto?.persona &&
        frase.proposito?.verbo
      ? "talk"
      : frase.predicado.clave;
  let entrada = VOCAB.verbos.find(
    (verbo) => verbo.clave === claveVerbo
  );
  let verboSintetico: VerboLibro | null = null;
  let raizDerivada: { principal: string; alternativa: string | null } | null =
    null;
  if (!entrada) {
    const derivadoAdjetivo = resolverDerivadoAdjetivo(claveVerbo);
    if (derivadoAdjetivo) {
      entrada = derivadoAdjetivo.entrada;
      verboSintetico = derivadoAdjetivo.verbo;
      raizDerivada = {
        principal: derivadoAdjetivo.raizPrincipal,
        alternativa: derivadoAdjetivo.raizAlternativa,
      };
    }
  }
  if (!entrada) return null;
  const candidatos = verboSintetico
    ? [verboSintetico]
    : verbosPorLema(entrada.lema);
  if (candidatos.length === 0) return null;
  let verbo = candidatos[0];
  let derivacionMarama: { base: string; baseYirrkala: string | null } | null =
    null;
  let conmutadoTransitivo = false;
  if (frase.objeto) {
    if (entrada.derivaMarama) {
      const derivado = derivarMarama(verbo);
      if (derivado) {
        verbo = derivado.verbo;
        derivacionMarama = derivado;
        conmutadoTransitivo = true;
      }
    } else if (entrada.lemaTransitivo) {
      const candidatosTransitivos = verbosPorLema(entrada.lemaTransitivo);
      if (candidatosTransitivos.length > 0) {
        verbo = candidatosTransitivos[0];
        conmutadoTransitivo = true;
      }
    }
  }
  const continuo = frase.aspecto === "continuo";
  const pasadoHoyGrupoUno =
    tiempo === "pasado_hoy" && verbo.group === 1 && !continuo;
  const formas = formaAtestada(
    verbo,
    continuo
      ? tiempo === "pasado_hoy"
        ? "III"
        : tiempo === "futuro_manana"
          ? "II"
          : "I"
      : tiempo === "futuro_manana"
        ? "II"
        : tiempo === "pasado_hoy" && !pasadoHoyGrupoUno
          ? "III"
          : "I"
  );
  if (formas.length === 0) return null;
  const negativoPasado =
    tiempo === "pasado_hoy" && frase.polaridad === "negativa";
  const negativoAyer =
    tiempo === "pasado_ayer" && frase.polaridad === "negativa";
  if (
    continuo &&
    frase.polaridad === "negativa" &&
    !negativoPasado &&
    !negativoAyer &&
    tiempo !== "continuo"
  ) {
    return null;
  }

  const partes: string[] = [];
  const reglas: ReglaAplicada[] = [];
  let adverbioDuracion: string | null = null;

  let destinoEfectivo: DestinoIR | null = frase.destino ?? null;
  const verboDeMovimiento =
    entrada.movimiento === true || entrada.transporte === true;

  let objetoEfectivo = frase.objeto ?? null;
  if (
    entrada.lema === "waŋa" &&
    !objetoEfectivo &&
    destinoEfectivo &&
    !frase.proposito
  ) {
    const esPersonaDestino =
      destinoEfectivo.persona !== undefined ||
      destinoEfectivo.nombre !== undefined ||
      (destinoEfectivo.sustantivo
        ? buscarPalabra(destinoEfectivo.sustantivo, "sustantivo")?.persona ===
          true
        : false);
    if (esPersonaDestino) {
      objetoEfectivo = {
        ...(destinoEfectivo.persona
          ? { persona: destinoEfectivo.persona }
          : {}),
        ...(destinoEfectivo.nombre ? { nombre: destinoEfectivo.nombre } : {}),
        ...(destinoEfectivo.sustantivo
          ? { sustantivo: destinoEfectivo.sustantivo }
          : {}),
      };
      destinoEfectivo = null;
    }
  }
  const objetoPersonaBase = ((): {
    persona?: PersonaIR;
    base?: string;
  } | null => {
    if (!objetoEfectivo || entrada.objetoDativo) return null;
    if (objetoEfectivo.persona) return { persona: objetoEfectivo.persona };
    if (objetoEfectivo.nombre) return { base: objetoEfectivo.nombre };
    if (objetoEfectivo.sustantivo) {
      const cosaPersona = buscarPalabra(objetoEfectivo.sustantivo, "sustantivo");
      if (cosaPersona?.persona) return { base: cosaPersona.gup };
    }
    return null;
  })();
  const marcoHabla = entrada.lema === "waŋa" && objetoPersonaBase !== null;
  const marcoContar =
    entrada.lema === "ḻakarama" &&
    objetoPersonaBase !== null &&
    !frase.pertenencia &&
    !frase.proposito;

  if (frase.adverbio) {
    const adverbio = buscarPalabra(frase.adverbio, "adverbio");
    if (!adverbio) return null;
    if (adverbio.subtipo === "lugar" && verboDeMovimiento) {
      if (destinoEfectivo?.adverbio) return null;
      destinoEfectivo = { ...(destinoEfectivo ?? {}), adverbio: adverbio.clave };
    } else if (adverbio.subtipo === "duracion") {
      adverbioDuracion = adverbio.gup;
      reglas.push({ leccion: 12, regla: "adjective-or-adverb" });
    } else {
      partes.push(adverbio.gup);
      reglas.push(
        adverbio.subtipo === "lugar"
          ? { leccion: 12, regla: "place-adverbs" }
          : { leccion: 12, regla: "time-adverbs" }
      );
    }
  }

  const sustitucionesVerbal: { de: string; a: string; nota: string }[] = [];
  if (conmutadoTransitivo) {
    reglas.push({ leccion: 48, regla: "transitive-marama" });
  }
  if (derivacionMarama?.baseYirrkala && formas[0]) {
    sustitucionesVerbal.push({
      de: formas[0],
      a: formas[0].replace(
        derivacionMarama.base,
        derivacionMarama.baseYirrkala
      ),
      nota: "Yirrkala: -marama sobre la cuaternaria larga (grupo 5: sobre la primaria)",
    });
  }
  if (raizDerivada) {
    reglas.push(
      entrada.valencia === "Vin"
        ? { leccion: 49, regla: "adjective-thirri" }
        : { leccion: 50, regla: "adjective-kuma" }
    );
    if (raizDerivada.alternativa && formas[0]) {
      sustitucionesVerbal.push({
        de: formas[0],
        a: `${raizDerivada.alternativa}${formas[0].slice(raizDerivada.principal.length)}`,
        nota:
          entrada.valencia === "Vin"
            ? "los dos sufijos alternan tras vocal (-thirri/-yirri)"
            : "los dos sufijos alternan tras vocal (-kuma/-yama)",
      });
    }
  }
  let tokenObjetoCosa: string | null = null;
  let tokenSujetoAgente: string | null = null;
  let tokenSujetoBase: string | null = null;
  let tokenObjetoAcusativo: string | null = null;
  let tokenPoseedorAgente: string | null = null;
  let tokenNegacion: string | null = null;
  let tokensComitativoOrden: string[] = [];
  const indicePronombre = partes.length;
  if (persona) {
    partes.push(VOCAB.pronombres[persona]);
    if (frase.sujeto?.parteCuerpo) {
      const parteSujeto = buscarPalabra(frase.sujeto.parteCuerpo, "sustantivo");
      if (!parteSujeto) return null;
      partes.push(parteSujeto.gup);
      reglas.push({ leccion: 80, regla: "body-parts-one-with-person" });
      sustitucionesVerbal.push({
        de: VOCAB.pronombres[persona],
        a: VOCAB.posesivos[persona],
        nota: "con el posesivo explícito (a veces se dice)",
      });
    }
  } else {
    if (frase.sujeto?.demostrativo) {
      const valenciaDemostrativo = marcoHabla
        ? "Vtr"
        : (entrada.valencia ??
          (verbo.valence?.includes("Vtr") ? "Vtr" : "Vin"));
      const casoSujeto =
        valenciaDemostrativo === "Vtr" ? "ergativo" : "base";
      partes.push(demostrativoCasual(frase.sujeto.demostrativo, casoSujeto));
      sustitucionesVerbal.push(
        ...sustitucionesDemostrativo(frase.sujeto.demostrativo, casoSujeto)
      );
    }
    let baseSujeto: string | null = null;
    if (frase.sujeto?.sustantivo) {
      const sujetoPalabra = buscarPalabra(frase.sujeto.sustantivo, "sustantivo");
      if (!sujetoPalabra) return null;
      baseSujeto = sujetoPalabra.gup;
    } else if (frase.sujeto?.nombre) {
      baseSujeto = frase.sujeto.nombre;
    }
    if (!baseSujeto) return null;
    const valenciaTabla = verbo.valence?.includes("Vtr") ? "Vtr" : "Vin";
    const valencia = marcoHabla ? "Vtr" : (entrada.valencia ?? valenciaTabla);
    if (valencia === "Vtr") {
      const agente = sufijoAgente(baseSujeto);
      const poseedorAgente = frase.sujeto
        ? renderPoseedorComitativo(frase.sujeto)
        : null;
      if (frase.sujeto && tienePoseedorGenerable(frase.sujeto) && !poseedorAgente) {
        return null;
      }
      const poseedorPronominal = frase.sujeto?.posesivo !== undefined;
      if (poseedorAgente && !poseedorPronominal) {
        partes.push(poseedorAgente.token);
      }
      if (frase.sujeto?.adjetivo) {
        partes.push(sufijoAgente(frase.sujeto.adjetivo).conSufijo);
        reglas.push({ leccion: 34, regla: "adjective-agreement" });
      }
      partes.push(agente.conSufijo);
      if (poseedorAgente && poseedorPronominal) {
        partes.push(poseedorAgente.token);
      }
      if (poseedorAgente) {
        tokenPoseedorAgente = poseedorAgente.token;
        sustitucionesVerbal.push(...poseedorAgente.sustituciones);
        reglas.push({ leccion: 36, regla: "possessive-gala-agent" });
      }
      tokenSujetoAgente = agente.conSufijo;
      tokenSujetoBase = baseSujeto;
      reglas.push({ leccion: 22, regla: "agent-transitive" });
      if (agente.sufijo === "y") {
        sustitucionesVerbal.push({
          de: agente.conSufijo,
          a: `${baseSujeto}yu`,
          nota: "Yirrkala: -yu",
        });
      }
    } else {
      if (frase.sujeto?.posesivo) {
        if (
          frase.sujeto.posesivoEnfatico === true ||
          frase.sujeto.posesivoReflexivo === true
        ) {
          partes.push(enfatizarPosesivo(frase.sujeto.posesivo));
          reglas.push(
            frase.sujeto.posesivoReflexivo
              ? { leccion: 77, regla: "reflexive-possessive-wuy" }
              : { leccion: 76, regla: "emphasised-possessive-wuy" }
          );
        } else {
          partes.push(VOCAB.posesivos[frase.sujeto.posesivo]);
          reglas.push({ leccion: 35, regla: "possessive-unsuffixed-head" });
          for (const ambigua of PERSONAS_AMBIGUAS[frase.sujeto.posesivo] ?? []) {
            sustitucionesVerbal.push({
              de: VOCAB.posesivos[frase.sujeto.posesivo],
              a: VOCAB.posesivos[ambigua.persona],
              nota: ambigua.nota,
            });
          }
        }
      } else if (frase.sujeto?.posesivoNombre) {
        if (frase.sujeto.posesivoDemostrativo) {
          partes.push(
            demostrativoCasual(frase.sujeto.posesivoDemostrativo, "dativo")
          );
          sustitucionesVerbal.push(
            ...sustitucionesDemostrativo(
              frase.sujeto.posesivoDemostrativo,
              "dativo"
            )
          );
          reglas.push({ leccion: 58, regla: "demonstrative-with-possessive" });
        }
        const sufijo = sufijoPosesivo(frase.sujeto.posesivoNombre);
        partes.push(`${frase.sujeto.posesivoNombre}${sufijo.sufijo}`);
        reglas.push({ leccion: 35, regla: "possessive-unsuffixed-head" });
      } else if (frase.sujeto?.posesivoSustantivo) {
        const poseedor = buscarPalabra(
          frase.sujeto.posesivoSustantivo,
          "sustantivo"
        );
        if (!poseedor) return null;
        if (frase.sujeto.posesivoDemostrativo) {
          partes.push(
            demostrativoCasual(frase.sujeto.posesivoDemostrativo, "dativo")
          );
          sustitucionesVerbal.push(
            ...sustitucionesDemostrativo(
              frase.sujeto.posesivoDemostrativo,
              "dativo"
            )
          );
          reglas.push({ leccion: 58, regla: "demonstrative-with-possessive" });
        }
        const sufijo = sufijoPosesivo(poseedor.gup);
        partes.push(`${poseedor.gup}${sufijo.sufijo}`);
        reglas.push({ leccion: 35, regla: "possessive-unsuffixed-head" });
      }
      if (frase.sujeto?.adjetivo) {
        partes.push(frase.sujeto.adjetivo);
        reglas.push({ leccion: 34, regla: "adjective-agreement" });
      }
      partes.push(baseSujeto);
      if (valenciaTabla === "Vtr" && entrada.valencia === "Vin") {
        sustitucionesVerbal.push({
          de: baseSujeto,
          a: sufijoAgente(baseSujeto).conSufijo,
          nota: "con sufijo de agente (Vtr en la tabla de verbos)",
        });
      }
    }
  }
  const finSujeto = partes.length;

  let alternativas: AlternativaGenerada[] | undefined;

  if (frase.modal) {
    const esPasadoModal = tiempo === "pasado_hoy" || tiempo === "pasado_ayer";
    if (esPasadoModal) {
      const formasIVM = formaAtestada(verbo, "IV");
      if (formasIVM.length === 0) return null;
      if (frase.modal === "might") {
        partes.push("bäna", "balaŋu");
      } else {
        partes.push("balaŋu");
      }
      partes.push(formasIVM[0]);
      reglas.push({ leccion: 63, regla: "modal-past-balangu" });
      sustitucionesVerbal.push(
        {
          de: formasIVM[0],
          a: `${formasIVM[0]}ra`,
          nota: "forma larga en -ra (lección 63)",
        },
        {
          de: "balaŋu",
          a: "balaŋu ganha",
          nota: "con la partícula continua ganha (a veces; no en Yirrkala)",
        }
      );
      if (frase.modal !== "might") {
        const copiaFrente = [...partes];
        const indiceBalanu = copiaFrente.indexOf("balaŋu");
        if (indiceBalanu > 0) {
          copiaFrente.splice(indiceBalanu, 1);
          alternativas = [
            ...(alternativas ?? []),
            {
              gup: capitalizar(["balaŋu", ...copiaFrente].join(" ")),
              nota: "orden del libro: balaŋu al frente",
            },
          ];
        }
      }
    } else {
      const formasIIM = formaAtestada(verbo, "II");
      if (formasIIM.length === 0) return null;
      if (frase.polaridad === "negativa") {
        partes.push("ŋuli");
        partes.push("yaka");
        tokenNegacion = "yaka";
        partes.push(formasIIM[0]);
        reglas.push({ leccion: 63, regla: "must-not-nguli" });
        sustitucionesVerbal.push({
          de: "ŋuli",
          a: "ŋuli gi",
          nota: "con gi (a menudo; no en Yirrkala)",
        });
      } else {
        partes.push("balaŋu");
        partes.push(formasIIM[0]);
        reglas.push({ leccion: 63, regla: "modal-balangu-secondary" });
        if (frase.modal === "might") {
          const formaPrimariaM = formaAtestada(verbo, "I")[0];
          sustitucionesVerbal.push({
            de: "balaŋu",
            a: "bäna balaŋu",
            nota: "también con bäna",
          });
          if (formaPrimariaM) {
            const copiaFuturoM = partes.map((parte) =>
              parte === formasIIM[0]
                ? formaPrimariaM
                : parte === "balaŋu"
                  ? "balaŋu dhu"
                  : parte
            );
            alternativas = [
              ...(alternativas ?? []),
              {
                gup: capitalizar(copiaFuturoM.join(" ")),
                nota: "balaŋu yurru/dhu con la forma primaria (lección 63)",
              },
            ];
          }
        } else {
          sustitucionesVerbal.push(
            {
              de: "balaŋu",
              a: "gi balaŋu",
              nota: "con gi (a menudo; no en Yirrkala)",
            },
            {
              de: "balaŋu",
              a: "ŋuli",
              nota: "también ŋuli + secundaria: deber/soler",
            },
            {
              de: "balaŋu",
              a: "balaŋu ŋuli",
              nota: "también balaŋu ŋuli + secundaria",
            }
          );
        }
      }
    }
  } else if (frase.inminente) {
    const formaPrimaria = formaAtestada(verbo, "I")[0];
    if (!formaPrimaria) return null;
    partes.push(formaPrimaria);
    reglas.push({ leccion: 61, regla: "lets-about-to" });
    sustitucionesVerbal.push({
      de: formaPrimaria,
      a: `${formaPrimaria}na`,
      nota: "-na final opcional, mismo significado",
    });
    if (persona === "1dual_incl") {
      sustitucionesVerbal.push(
        {
          de: VOCAB.pronombres["1dual_incl"],
          a: VOCAB.pronombres["1pl_incl"],
          nota: "más de dos personas: (ŋi)limurru (lección 61)",
        },
        {
          de: VOCAB.pronombres["1dual_incl"],
          a: "limurru",
          nota: "forma abreviada de ŋilimurru",
        }
      );
    }
    const copiaFuturo = [...partes];
    copiaFuturo.splice(copiaFuturo.length - 1, 0, "yurru");
    alternativas = [
      ...(alternativas ?? []),
      {
        gup: capitalizar(copiaFuturo.join(" ")),
        nota: "con el futuro del mismo día yurru/dhu (nota, lección 61)",
      },
    ];
  } else if (frase.habitual) {
    if (frase.habitual.antes) partes.unshift("ŋäthili");
    if (frase.habitual.amenudo) partes.unshift("dharrwamirri");
    partes.push("ŋuli");
    const esPasadoHabitual =
      tiempo === "pasado_hoy" || tiempo === "pasado_ayer";
    if (esPasadoHabitual) {
      const formasIVH = formaAtestada(verbo, "IV");
      if (formasIVH.length === 0) return null;
      partes.push(formasIVH[0]);
      reglas.push({ leccion: 62, regla: "habitual-past" });
      sustitucionesVerbal.push(
        {
          de: formasIVH[0],
          a: `${formasIVH[0]}ra`,
          nota: "forma larga en -ra (lección 62)",
        },
        {
          de: "ŋuli",
          a: "ŋuli ganha",
          nota: "con la partícula continua ganha (omisible; no en Yirrkala)",
        }
      );
    } else if (frase.polaridad === "negativa") {
      const formasIIH = formaAtestada(verbo, "II");
      if (formasIIH.length === 0) return null;
      partes.push("bäyŋu");
      tokenNegacion = "bäyŋu";
      partes.push(formasIIH[0]);
      reglas.push({ leccion: 62, regla: "habitual-negative" });
      sustitucionesVerbal.push(
        { de: "bäyŋu", a: "yaka", nota: "también yaka" },
        {
          de: "ŋuli",
          a: "ŋuli gi",
          nota: "con gi (omisible; nota 1, lección 62)",
        }
      );
    } else {
      const formaPrimariaH = formaAtestada(verbo, "I")[0];
      if (!formaPrimariaH) return null;
      partes.push(formaPrimariaH);
      reglas.push({ leccion: 62, regla: "habitual-present" });
      sustitucionesVerbal.push({
        de: "ŋuli",
        a: "ŋuli ga",
        nota: "con la partícula continua ga (omisible; no en Yirrkala)",
      });
    }
    sustitucionesVerbal.push({
      de: "ŋuli",
      a: "li",
      nota: "ŋuli a menudo abreviado li (no en Yirrkala)",
    });
  } else if (continuo && tiempo !== "continuo") {
    if (tiempo === "pasado_hoy" && negativoPasado) {
      const formasIV = formaAtestada(verbo, "IV");
      if (formasIV.length === 0) return null;
      partes.push("yaka");
      tokenNegacion = "yaka";
      partes.push(VOCAB.particulas.continuoCuaternaria);
      if (adverbioDuracion) partes.push(adverbioDuracion);
      partes.push(formasIV[0]);
      reglas.push({ leccion: 41, regla: "negative-same-day-past" });
      reglas.push({ leccion: 18, regla: "same-day-past-continuous" });
      sustitucionesVerbal.push(
        {
          de: "yaka",
          a: "bäyŋu",
          nota: "bäyŋu se usa a menudo en vez de yaka",
        },
        {
          de: formasIV[0],
          a: `${formasIV[0]}ra`,
          nota: "forma larga en -ra, mismo sentido",
        },
        {
          de: VOCAB.particulas.continuoCuaternaria,
          a: VOCAB.particulas.continuoTerciaria,
          nota: "gana (el libro imprime ganha, a verificar)",
        }
      );
    } else if (tiempo === "pasado_hoy") {
      partes.push(VOCAB.particulas.continuoTerciaria);
      if (adverbioDuracion) partes.push(adverbioDuracion);
      partes.push(formas[0]);
      reglas.push({ leccion: 18, regla: "same-day-past-continuous" });
      reglas.push({ leccion: 16, regla: "same-day-past" });
    } else if (tiempo === "pasado_ayer") {
      if (negativoAyer) {
        const formasII = formaAtestada(verbo, "II");
        if (formasII.length === 0) return null;
        partes.push(VOCAB.particulas.continuoSecundaria);
        partes.push("yaka");
        tokenNegacion = "yaka";
        if (adverbioDuracion) partes.push(adverbioDuracion);
        partes.push(formasII[0]);
        reglas.push({ leccion: 60, regla: "negative-yesterday-continuous" });
        sustitucionesVerbal.push({
          de: "yaka",
          a: "bäyŋu",
          nota: "bäyŋu se usa a menudo en vez de yaka",
        });
      } else {
        partes.push(VOCAB.particulas.continuo);
        if (adverbioDuracion) partes.push(adverbioDuracion);
        partes.push(formas[0]);
        reglas.push({ leccion: 18, regla: "yesterday-past-continuous" });
        reglas.push({ leccion: 17, regla: "yesterday-past" });
      }
    } else {
      partes.push(VOCAB.particulas.futuro);
      partes.push(
        tiempo === "futuro_manana"
          ? VOCAB.particulas.continuoSecundaria
          : VOCAB.particulas.continuo
      );
      if (adverbioDuracion) partes.push(adverbioDuracion);
      partes.push(formas[0]);
      reglas.push(
        tiempo === "futuro_manana"
          ? { leccion: 18, regla: "tomorrow-future-continuous" }
          : { leccion: 18, regla: "same-day-future-continuous" }
      );
    }
  } else if (tiempo === "continuo") {
    if (frase.polaridad === "negativa") {
      const formasII = formaAtestada(verbo, "II");
      if (formasII.length === 0) return null;
      const sujetoPartes = [...partes];
      partes.push(VOCAB.particulas.continuoSecundaria);
      partes.push("yaka");
      tokenNegacion = "yaka";
      if (adverbioDuracion) partes.push(adverbioDuracion);
      partes.push(formasII[0]);
      reglas.push({ leccion: 60, regla: "negative-present-continuous" });
      sustitucionesVerbal.push({
        de: "yaka",
        a: "bäyŋu",
        nota: "bäyŋu se usa a menudo en vez de yaka",
      });
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar(
            [
              ...sujetoPartes,
              VOCAB.particulas.continuo,
              "yaka",
              formas[0],
            ].join(" ")
          ),
          nota: "Elcho: forma primaria con ga + yaka (gupapuyŋu débil, nota 1, lección 60)",
        },
      ];
    } else {
    partes.push(VOCAB.particulas.continuo);
    if (adverbioDuracion) partes.push(adverbioDuracion);
    partes.push(formas[0]);
    reglas.push({ leccion: 10, regla: "ga-present-continuous" });
    if (persona && !frase.adverbio && !objetoEfectivo) {
      alternativas = [
        {
          gup: capitalizar(
            `${formas[0]} ${VOCAB.pronombres[persona]} ${VOCAB.particulas.continuo}`
          ),
          nota: "orden alternativo (énfasis en el verbo)",
        },
      ];
      reglas.push({ leccion: 10, regla: "word-order-emphasis" });
    }
    }
  } else if (negativoPasado) {
    if (verbo.group === 1) {
      partes.push(VOCAB.particulas.continuoTerciaria, "bäyŋu");
      tokenNegacion = "bäyŋu";
      if (adverbioDuracion) partes.push(adverbioDuracion);
      partes.push(formas[0]);
      reglas.push({ leccion: 41, regla: "negative-same-day-past" });
      sustitucionesVerbal.push({
        de: "bäyŋu",
        a: "yaka",
        nota: "también yaka",
      });
    } else {
      const formasIV = formaAtestada(verbo, "IV");
      if (formasIV.length === 0) return null;
      partes.push("yaka");
      tokenNegacion = "yaka";
      if (adverbioDuracion) partes.push(adverbioDuracion);
      partes.push(formasIV[0]);
      reglas.push({ leccion: 41, regla: "negative-same-day-past" });
      sustitucionesVerbal.push(
        {
          de: "yaka",
          a: "bäyŋu",
          nota: "bäyŋu se usa a menudo en vez de yaka",
        },
        {
          de: formasIV[0],
          a: `${formasIV[0]}ra`,
          nota: "forma larga en -ra, mismo sentido",
        }
      );
      const formaTerciaria = formaAtestada(verbo, "III")[0];
      if (formaTerciaria && formaTerciaria !== formasIV[0]) {
        sustitucionesVerbal.push({
          de: formasIV[0],
          a: formaTerciaria,
          nota: "Yirrkala/Elcho: forma terciaria con yaka/bäyŋu (notas 3-4, lección 41)",
        });
      }
    }
  } else if (negativoAyer) {
    const formasII = formaAtestada(verbo, "II");
    if (formasII.length === 0) return null;
    partes.push("yaka");
    tokenNegacion = "yaka";
    if (adverbioDuracion) partes.push(adverbioDuracion);
    partes.push(formasII[0]);
    reglas.push({ leccion: 60, regla: "negative-yesterday-past" });
    sustitucionesVerbal.push({
      de: "yaka",
      a: "bäyŋu",
      nota: "bäyŋu se usa a menudo en vez de yaka",
    });
    const formasIVAyer = formaAtestada(verbo, "IV");
    if (formasIVAyer.length > 0 && formasIVAyer[0] !== formasII[0]) {
      sustitucionesVerbal.push(
        {
          de: formasII[0],
          a: formasIVAyer[0],
          nota: "cuaternaria con negativo para 'ayer'/pasado reciente (E, lección 60)",
        },
        {
          de: formasII[0],
          a: `${formasIVAyer[0]}ra`,
          nota: "cuaternaria larga en -ra (E, lección 60)",
        }
      );
    }
    if (formas[0] !== formasII[0]) {
      sustitucionesVerbal.push({
        de: formasII[0],
        a: formas[0],
        nota: "Elcho: forma primaria con yaka/bäyŋu (gupapuyŋu débil, nota 1, lección 60)",
      });
    }
    if (frase.adverbio === "yesterday") {
      sustitucionesVerbal.push({
        de: "barpuru",
        a: "yawungu",
        nota: "yawungu: más común en Yirrkala, Milingimbi y Elcho",
      });
    }
  } else if (tiempo === "pasado_hoy" || tiempo === "pasado_ayer") {
    partes.push(formas[0]);
    if (tiempo === "pasado_ayer" || pasadoHoyGrupoUno) {
      reglas.push({ leccion: 17, regla: "yesterday-past" });
    } else {
      reglas.push({ leccion: 16, regla: "same-day-past" });
      if (!frase.tiempoConfirmado) {
        reglas.push({ leccion: 16, regla: "indefinite-past" });
        const formaPrimaria = formaAtestada(verbo, "I")[0];
        if (formaPrimaria && formaPrimaria !== formas[0] && !objetoEfectivo) {
          alternativas = [
            ...(alternativas ?? []),
            {
              gup: capitalizar(
                [...partes.slice(0, -1), formaPrimaria].join(" ")
              ),
              nota: "pasado de ayer/reciente, con tiempo definido (forma I)",
            },
          ];
          reglas.push({ leccion: 17, regla: "yesterday-past" });
        }
      }
    }
    if (frase.adverbio && !objetoEfectivo) {
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar([...partes.slice(1), partes[0]].join(" ")),
          nota: "orden alternativo",
        },
      ];
      reglas.push({ leccion: 12, regla: "word-order-not-fixed" });
    }
  } else {
    partes.push(VOCAB.particulas.futuro);
    if (frase.polaridad === "negativa") {
      partes.push(VOCAB.negacionImperativo);
    }
    partes.push(formas[0]);
    if (tiempo === "futuro_manana") {
      reglas.push({ leccion: 7, regla: "tomorrow-future-dhu" });
      if (frase.polaridad === "negativa") {
        reglas.push({ leccion: 7, regla: "negative-future" });
      }
    } else {
      reglas.push(
        frase.adverbio
          ? { leccion: 11, regla: "same-day-future" }
          : { leccion: 11, regla: "indefinite-future" }
      );
      if (frase.polaridad === "negativa") {
        reglas.push({ leccion: 11, regla: "negative-same-day" });
      }
    }
    if (frase.adverbio && !objetoEfectivo) {
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar([...partes.slice(1), partes[0]].join(" ")),
          nota: "orden alternativo",
        },
      ];
      reglas.push({ leccion: 12, regla: "word-order-not-fixed" });
    }
  }

  if (frase.objetoIndirecto?.persona) {
    const gupIndirecto = VOCAB.posesivos[frase.objetoIndirecto.persona];
    partes.splice(finSujeto, 0, gupIndirecto);
    reglas.push({ leccion: 32, regla: "indirect-object-gu" });
    if (
      frase.objetoIndirecto.dualAlternativo &&
      frase.objetoIndirecto.persona === "3pl"
    ) {
      sustitucionesVerbal.push({
        de: gupIndirecto,
        a: VOCAB.posesivos["3dual"],
        nota: "ellos dos (dual)",
      });
    }
  }

  const renderPoseedorObjeto = (objetoIR: {
    posesivo?: string;
    posesivoNombre?: string;
    posesivoSustantivo?: string;
    posesivoDemostrativo?: DemostrativoIR;
    posesivoEnfatico?: boolean;
    posesivoReflexivo?: boolean;
  }): string | null => {
    const conDemPoseedor = (token: string): string => {
      if (!objetoIR.posesivoDemostrativo) return token;
      sustitucionesVerbal.push(
        ...sustitucionesDemostrativo(objetoIR.posesivoDemostrativo, "dativo")
      );
      reglas.push({ leccion: 58, regla: "demonstrative-with-possessive" });
      return `${demostrativoCasual(objetoIR.posesivoDemostrativo, "dativo")} ${token}`;
    };
    if (objetoIR.posesivo) {
      if (objetoIR.posesivoEnfatico || objetoIR.posesivoReflexivo) {
        reglas.push(
          objetoIR.posesivoReflexivo
            ? { leccion: 77, regla: "reflexive-possessive-wuy" }
            : { leccion: 76, regla: "emphasised-possessive-wuy" }
        );
        return enfatizarPosesivo(objetoIR.posesivo as PersonaIR);
      }
      reglas.push({ leccion: 35, regla: "possessive-with-object" });
      const tokenPoseedor =
        VOCAB.posesivos[objetoIR.posesivo as keyof typeof VOCAB.posesivos];
      for (const ambigua of PERSONAS_AMBIGUAS[objetoIR.posesivo] ?? []) {
        sustitucionesVerbal.push({
          de: tokenPoseedor,
          a: VOCAB.posesivos[ambigua.persona],
          nota: ambigua.nota,
        });
      }
      return tokenPoseedor;
    }
    if (objetoIR.posesivoNombre) {
      reglas.push({ leccion: 35, regla: "possessive-with-object" });
      const sufijo = sufijoPosesivo(objetoIR.posesivoNombre);
      return conDemPoseedor(`${objetoIR.posesivoNombre}${sufijo.sufijo}`);
    }
    if (objetoIR.posesivoSustantivo) {
      const poseedor = buscarPalabra(
        objetoIR.posesivoSustantivo,
        "sustantivo"
      );
      if (!poseedor) return null;
      reglas.push({ leccion: 35, regla: "possessive-with-object" });
      const sufijo = sufijoPosesivo(poseedor.gup);
      return conDemPoseedor(`${poseedor.gup}${sufijo.sufijo}`);
    }
    return null;
  };

  const objeto = objetoEfectivo;
  if (objeto && entrada.objetoDativo) {
    const tokensDativo: string[] = [];
    if (objeto.demostrativo) {
      tokensDativo.push(demostrativoCasual(objeto.demostrativo, "dativo"));
      sustitucionesVerbal.push(
        ...sustitucionesDemostrativo(objeto.demostrativo, "dativo")
      );
    }
    if (objeto.persona) {
      if (objeto.enfatico) {
        const dativoEnfatico = enfatizarPosesivo(objeto.persona);
        tokensDativo.push(dativoEnfatico);
        reglas.push({ leccion: 75, regla: "emphasised-pronouns-pi" });
        sustitucionesVerbal.push({
          de: dativoEnfatico,
          a: `${VOCAB.posesivos[objeto.persona]}way`,
          nota: "Yirrkala: -way en lugar de -wuy (nota 4, lección 75)",
        });
      } else {
        tokensDativo.push(VOCAB.posesivos[objeto.persona]);
        for (const ambigua of PERSONAS_AMBIGUAS[objeto.persona] ?? []) {
          sustitucionesVerbal.push({
            de: VOCAB.posesivos[objeto.persona],
            a: VOCAB.posesivos[ambigua.persona],
            nota: ambigua.nota,
          });
        }
      }
    } else {
      let baseDativo: string | null = null;
      if (objeto.sustantivo) {
        const cosaDativo = buscarPalabra(objeto.sustantivo, "sustantivo");
        if (!cosaDativo) return null;
        baseDativo = cosaDativo.gup;
      } else if (objeto.nombre) {
        baseDativo = objeto.nombre;
      }
      if (!baseDativo) return null;
      if (objeto.adjetivo) {
        const sufijoAdjDativo = sufijoPosesivo(objeto.adjetivo);
        tokensDativo.push(`${objeto.adjetivo}${sufijoAdjDativo.sufijo}`);
        reglas.push({ leccion: 34, regla: "adjective-agreement" });
      }
      const sufijoDativo = sufijoPosesivo(baseDativo);
      const tokenDativo = `${baseDativo}${sufijoDativo.sufijo}`;
      tokensDativo.push(tokenDativo);
      const yirrkalaDativo = formaYirrkalaWu(baseDativo, sufijoDativo.sufijo);
      if (yirrkalaDativo) {
        sustitucionesVerbal.push({
          de: tokenDativo,
          a: yirrkalaDativo,
          nota: "Yirrkala: -wu",
        });
      }
    }
    const poseedorDativo = renderPoseedorInfijado(objeto, "wa");
    if (tienePoseedorGenerable(objeto) && !poseedorDativo) return null;
    if (poseedorDativo) {
      tokensDativo.push(poseedorDativo.token);
      sustitucionesVerbal.push(...poseedorDativo.sustituciones);
      reglas.push({ leccion: 51, regla: "possessive-infix-galangu" });
    }
    partes.push(...tokensDativo);
    reglas.push({ leccion: 47, regla: "dative-object-verbs" });
    if (partes.length > tokensDativo.length + 1) {
      const copiaOrden = partes.slice(0, partes.length - tokensDativo.length);
      copiaOrden.splice(copiaOrden.length - 1, 0, ...tokensDativo);
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar(copiaOrden.join(" ")),
          nota: "orden alternativo: el dativo antes del verbo",
        },
      ];
    }
  } else if (objeto) {
    if (objeto.parteCuerpo) {
      const parteObjeto = buscarPalabra(objeto.parteCuerpo, "sustantivo");
      if (!parteObjeto) return null;
      const tokensParte: string[] = [];
      if (!objeto.reflexivo && objeto.persona) {
        tokensParte.push(VOCAB.objetos[objeto.persona]);
      }
      tokensParte.push(parteObjeto.gup);
      partes.splice(finSujeto, 0, ...tokensParte);
      reglas.push({ leccion: 80, regla: "body-parts-one-with-person" });
      if (!objeto.reflexivo && objeto.persona) {
        const gupPersonaParte = VOCAB.objetos[objeto.persona];
        const copiaPosesiva = partes.map((parte) =>
          parte === gupPersonaParte ? VOCAB.posesivos[objeto.persona!] : parte
        );
        alternativas = [
          ...(alternativas ?? []),
          {
            gup: capitalizar(copiaPosesiva.join(" ")),
            nota: "con el posesivo explícito (a veces se dice)",
          },
        ];
      }
    } else if (objeto.persona) {
      const gupObjeto = objeto.enfatico
        ? formaObjetoEnfatico(objeto.persona)
        : VOCAB.objetos[objeto.persona];
      tokenObjetoAcusativo = gupObjeto;
      reglas.push({ leccion: 20, regla: "nha-pronoun-object" });
      if (objeto.enfatico) {
        reglas.push({ leccion: 75, regla: "emphasised-pronouns-pi" });
      }
      if (objeto.personaOpcional) {
        const copia = [...partes];
        copia.splice(finSujeto, 0, gupObjeto);
        alternativas = [
          ...(alternativas ?? []),
          {
            gup: capitalizar(copia.join(" ")),
            nota: "objeto persona (él/ella/ellos)",
          },
        ];
      } else {
        partes.splice(finSujeto, 0, gupObjeto);
        if (objeto.dualAlternativo && objeto.persona === "3pl") {
          const dualObjeto = objeto.enfatico
            ? formaObjetoEnfatico("3dual")
            : VOCAB.objetos["3dual"];
          const copia = partes.map((parte) =>
            parte === gupObjeto ? dualObjeto : parte
          );
          alternativas = [
            ...(alternativas ?? []),
            {
              gup: capitalizar(copia.join(" ")),
              nota: "ellos dos (dual)",
            },
          ];
        }
        if (objeto.enfatico && VOCAB.objetosEnfaticos[objeto.persona]) {
          const alternoEnfatico =
            objeto.persona === "1sg"
              ? `${VOCAB.objetos[objeto.persona]}wuynha`
              : `${gupObjeto}wuy`;
          const copia = partes.map((parte) =>
            parte === gupObjeto ? alternoEnfatico : parte
          );
          alternativas = [
            ...(alternativas ?? []),
            {
              gup: capitalizar(copia.join(" ")),
              nota: "forma enfática alternativa (nota, lección 75)",
            },
          ];
        }
      }
    } else if (objeto.sustantivo) {
      const cosa = buscarPalabra(objeto.sustantivo, "sustantivo");
      if (!cosa) return null;
      const poseedorObjeto = renderPoseedorObjeto(objeto);
      if (
        (objeto.posesivo || objeto.posesivoNombre ||
          objeto.posesivoSustantivo) &&
        !poseedorObjeto
      ) {
        return null;
      }
      if (cosa.persona) {
        if (objeto.demostrativo) {
          partes.push(demostrativoCasual(objeto.demostrativo, "base"));
          sustitucionesVerbal.push(
            ...sustitucionesDemostrativo(objeto.demostrativo, "base")
          );
          reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
        }
        if (poseedorObjeto) partes.push(poseedorObjeto);
        if (objeto.adjetivo) {
          partes.push(`${objeto.adjetivo}nha`);
          reglas.push({ leccion: 34, regla: "adjective-agreement" });
        }
        partes.push(`${cosa.gup}nha`);
        tokenObjetoAcusativo = `${cosa.gup}nha`;
        reglas.push({ leccion: 19, regla: "nha-person-object" });
      } else {
        const previosObjeto: string[] = [];
        if (objeto.demostrativo) {
          previosObjeto.push(demostrativoCasual(objeto.demostrativo, "base"));
          sustitucionesVerbal.push(
            ...sustitucionesDemostrativo(objeto.demostrativo, "base")
          );
          reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
        }
        if (poseedorObjeto) previosObjeto.push(poseedorObjeto);
        if (objeto.adjetivo) {
          previosObjeto.push(objeto.adjetivo);
          reglas.push({ leccion: 34, regla: "adjective-agreement" });
        }
        partes.splice(partes.length - 1, 0, ...previosObjeto, cosa.gup);
        tokenObjetoCosa = cosa.gup;
        reglas.push({ leccion: 21, regla: "no-suffix-thing-object" });
      }
    } else if (objeto.nombre) {
      partes.push(`${objeto.nombre}nha`);
      tokenObjetoAcusativo = `${objeto.nombre}nha`;
      reglas.push({ leccion: 19, regla: "nha-person-object" });
    }
  }

  if (objeto?.enActo) {
    const basesActo = basesVerbal(objeto.enActo);
    if (basesActo) {
      const tokenActo = `${basesActo.corta}wuy`;
      partes.push(tokenActo);
      reglas.push({ leccion: 69, regla: "object-in-the-act" });
      sustitucionesVerbal.push(
        {
          de: tokenActo,
          a: `${basesActo.corta}ra`,
          nota: "forma cuaternaria sin sufijo (lección 71)",
        },
        {
          de: tokenActo,
          a: `${basesActo.larga}wuy`,
          nota: "Yirrkala: cuaternaria larga",
        }
      );
    }
  }

  if (frase.lugar) {
    const lugarTokens: string[] = [];
    let lugarEsNombrePropio = frase.lugar.nombre !== undefined;
    if (frase.lugar.adverbio) {
      const adverbioLugar = buscarPalabra(frase.lugar.adverbio, "adverbio");
      if (!adverbioLugar) return null;
      lugarTokens.push(adverbioLugar.gup);
      reglas.push({ leccion: 25, regla: "adverb-plus-ngura" });
    }
    if (frase.lugar.sustantivo) {
      const cosaLugar = buscarPalabra(frase.lugar.sustantivo, "sustantivo");
      if (!cosaLugar) return null;
      if (cosaLugar.nombrePropio) {
        lugarEsNombrePropio = true;
        lugarTokens.push(cosaLugar.gup);
        reglas.push({ leccion: 25, regla: "placename-no-ngura" });
      } else {
        if (frase.lugar.demostrativo) {
          const casoLugar = tiempo === "continuo" ? "base" : "ngura";
          lugarTokens.push(
            demostrativoCasual(frase.lugar.demostrativo, casoLugar)
          );
          sustitucionesVerbal.push(
            ...sustitucionesDemostrativo(frase.lugar.demostrativo, casoLugar)
          );
          reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
        }
        const poseedorLugar = renderPoseedorComitativo(frase.lugar);
        if (tienePoseedorGenerable(frase.lugar) && !poseedorLugar) return null;
        if (poseedorLugar) {
          lugarTokens.push(poseedorLugar.token);
          sustitucionesVerbal.push(...poseedorLugar.sustituciones);
          reglas.push({ leccion: 36, regla: "possessive-gala-suffixed-head" });
        }
        const sufijoLugarVerbo = entrada.lugarLili === true ? "lili" : "ŋura";
        if (frase.lugar.adjetivo) {
          lugarTokens.push(`${frase.lugar.adjetivo}${sufijoLugarVerbo}`);
          reglas.push({ leccion: 34, regla: "adjective-agreement" });
        }
        lugarTokens.push(`${cosaLugar.gup}${sufijoLugarVerbo}`);
        reglas.push(
          entrada.lugarLili === true
            ? { leccion: 82, regla: "verb-behaviour-lili" }
            : { leccion: 25, regla: "ngura-place" }
        );
      }
    } else if (frase.lugar.nombre) {
      lugarTokens.push(frase.lugar.nombre);
      reglas.push({ leccion: 25, regla: "placename-no-ngura" });
    }
    if (
      lugarTokens.length === 0 &&
      frase.lugar.demostrativo &&
      !frase.lugar.sustantivo &&
      !frase.lugar.nombre
    ) {
      const casoAqui = tiempo === "continuo" ? "base" : "ngura";
      lugarTokens.push(
        demostrativoCasual(frase.lugar.demostrativo, casoAqui)
      );
      sustitucionesVerbal.push(
        ...sustitucionesDemostrativo(frase.lugar.demostrativo, casoAqui)
      );
      reglas.push({ leccion: 55, regla: "here-demonstrative" });
    }
    if (lugarTokens.length > 0) {
      if (frase.lugarAntesVerbo) {
        if (persona && lugarEsNombrePropio) {
          partes.splice(0, 0, ...lugarTokens);
        } else {
          partes.splice(finSujeto, 0, ...lugarTokens);
        }
      } else {
        partes.push(...lugarTokens);
      }
    }
  }

  if (frase.comitativo) {
    const comitativo = renderComitativo(frase.comitativo);
    if (!comitativo) return null;
    reglas.push(...comitativo.reglas);
    partes.push(...comitativo.tokens);
    tokensComitativoOrden = comitativo.tokens;
    if (alternativas) {
      alternativas = alternativas.map((alternativa) => ({
        ...alternativa,
        gup: `${alternativa.gup} ${comitativo.tokens.join(" ")}`,
      }));
    }
    if (comitativo.alternativo) {
      sustitucionesVerbal.push(comitativo.alternativo);
    }
  }

  if (destinoEfectivo) {
    const destino = renderDestino(
      destinoEfectivo,
      entrada.transporte === true,
      entrada.llegada === true
    );
    if (!destino) return null;
    reglas.push(...destino.reglas);
    partes.push(...destino.tokens);
    if (alternativas) {
      alternativas = alternativas.map((alternativa) => ({
        ...alternativa,
        gup: `${alternativa.gup} ${destino.tokens.join(" ")}`,
      }));
    }
    sustitucionesVerbal.push(...destino.sustituciones);
    if (!destinoEfectivo.direccion) {
      const conBala = [...partes];
      conBala.splice(
        partes.length - destino.tokens.length,
        0,
        VOCAB.direcciones.bala.gup
      );
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar(conBala.join(" ")),
          nota: "bala — movimiento alejándose del hablante",
        },
      ];
    }
  }

  if (frase.origen) {
    const origen = renderOrigen(
      frase.origen,
      entrada.movimiento === true,
      entrada.origenGu === true
    );
    if (!origen) return null;
    reglas.push(...origen.reglas);
    const partesAntesOrigen = [...partes];
    partes.push(...origen.tokens);
    if (alternativas) {
      alternativas = alternativas.map((alternativa) => ({
        ...alternativa,
        gup: `${alternativa.gup} ${origen.tokens.join(" ")}`,
      }));
    }
    sustitucionesVerbal.push(...origen.sustituciones);
    alternativas = [
      ...(alternativas ?? []),
      {
        gup: capitalizar(
          [...origen.tokens, ...partesAntesOrigen].join(" ")
        ),
        nota: "orden alternativo",
      },
    ];
    if (origen.tokens.length === 2) {
      alternativas.push({
        gup: capitalizar(
          [...partesAntesOrigen, origen.tokens[1], origen.tokens[0]].join(" ")
        ),
        nota: "orden alternativo de las partes",
      });
    }
  }

  if (frase.proposito) {
    const proposito = renderProposito(
      frase.proposito,
      entrada.clave === "try" || entrada.clave === "start"
        ? "terciaria"
        : undefined
    );
    if (!proposito) return null;
    reglas.push(...proposito.reglas);
    partes.push(...proposito.tokens);
    if (alternativas) {
      alternativas = alternativas.map((alternativa) => ({
        ...alternativa,
        gup: `${alternativa.gup} ${proposito.tokens.join(" ")}`,
      }));
    }
    sustitucionesVerbal.push(...proposito.sustituciones);
  }

  if (frase.perlativo) {
    const perlativoRender = renderPerlativo(frase.perlativo);
    if (!perlativoRender) return null;
    reglas.push(...perlativoRender.reglas);
    sustitucionesVerbal.push(...perlativoRender.sustituciones);
    if (alternativas) {
      alternativas = alternativas.map((alternativa) => ({
        ...alternativa,
        gup: `${alternativa.gup} ${perlativoRender.tokens.join(" ")}`,
      }));
    }
    const partesSinPerlativo = [...partes];
    partes.push(...perlativoRender.tokens);
    alternativas = [
      ...(alternativas ?? []),
      {
        gup: capitalizar(
          [...perlativoRender.tokens, ...partesSinPerlativo].join(" ")
        ),
        nota: "orden alternativo: el perlativo al frente (lección 53)",
      },
    ];
  }

  if (frase.instrumento?.verbo) {
    const basesInstrumento = basesVerbal(frase.instrumento.verbo);
    if (!basesInstrumento) return null;
    const tokenInstrumentoVerbal = `${basesInstrumento.larga}y`;
    const tokensInstrumentoVerbal: string[] = [];
    if (frase.instrumento.sustantivo) {
      const objetoInstrumento = buscarPalabra(
        frase.instrumento.sustantivo,
        "sustantivo"
      );
      if (!objetoInstrumento) return null;
      tokensInstrumentoVerbal.push(
        sufijoAgente(objetoInstrumento.gup).conSufijo
      );
    }
    tokensInstrumentoVerbal.push(tokenInstrumentoVerbal);
    reglas.push({ leccion: 46, regla: "verb-y-instrument" });
    if (alternativas) {
      alternativas = alternativas.map((alternativa) => ({
        ...alternativa,
        gup: `${alternativa.gup} ${tokensInstrumentoVerbal.join(" ")}`,
      }));
    }
    partes.push(...tokensInstrumentoVerbal);
    sustitucionesVerbal.push({
      de: tokenInstrumentoVerbal,
      a: `${basesInstrumento.larga}yu`,
      nota: "Yirrkala: -yu",
    });
  }

  if (frase.instrumento?.sustantivo && !frase.instrumento.verbo) {
    const cosaInstrumento = buscarPalabra(
      frase.instrumento.sustantivo,
      "sustantivo"
    );
    if (!cosaInstrumento) return null;
    const agenteInstrumento = cosaInstrumento.pronunciacionFinal
      ? {
          conSufijo: `${cosaInstrumento.gup}${sufijoAgente(cosaInstrumento.pronunciacionFinal).sufijo}`,
          sufijo: sufijoAgente(cosaInstrumento.pronunciacionFinal).sufijo,
        }
      : sufijoAgente(cosaInstrumento.gup);
    let gupInstrumento = agenteInstrumento.conSufijo;
    if (frase.instrumento.adjetivo) {
      gupInstrumento = `${gupInstrumento} ${sufijoAgente(frase.instrumento.adjetivo).conSufijo}`;
      reglas.push({ leccion: 34, regla: "adjective-agreement" });
    }
    const poseedorInstrumento = renderPoseedorComitativo(frase.instrumento);
    if (tienePoseedorGenerable(frase.instrumento) && !poseedorInstrumento) {
      return null;
    }
    const poseedorCorreferente =
      frase.instrumento.posesivo !== undefined &&
      persona !== undefined &&
      frase.instrumento.posesivo === persona;
    const tokensInstrumento =
      poseedorInstrumento && !poseedorCorreferente
        ? [poseedorInstrumento.token, gupInstrumento]
        : [gupInstrumento];
    if (frase.instrumento.demostrativo) {
      tokensInstrumento.unshift(
        demostrativoCasual(frase.instrumento.demostrativo, "ergativo")
      );
      sustitucionesVerbal.push(
        ...sustitucionesDemostrativo(frase.instrumento.demostrativo, "ergativo")
      );
      reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
    }
    if (poseedorInstrumento && !poseedorCorreferente) {
      sustitucionesVerbal.push(...poseedorInstrumento.sustituciones);
      reglas.push({ leccion: 36, regla: "possessive-gala-suffixed-head" });
    }
    reglas.push({ leccion: 33, regla: "instrument-thing" });
    if (alternativas) {
      alternativas = alternativas.map((alternativa) => ({
        ...alternativa,
        gup:
          entrada.movimiento === true
            ? `${capitalizar(tokensInstrumento.join(" "))} ${alternativa.gup.charAt(0).toLowerCase()}${alternativa.gup.slice(1)}`
            : `${alternativa.gup} ${tokensInstrumento.join(" ")}`,
      }));
    }
    if (entrada.movimiento === true) {
      partes.unshift(...tokensInstrumento);
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar(
            [
              ...partes.slice(tokensInstrumento.length),
              ...tokensInstrumento,
            ].join(" ")
          ),
          nota: "orden alternativo",
        },
      ];
    } else {
      partes.push(...tokensInstrumento);
    }
    if (poseedorInstrumento && poseedorCorreferente) {
      const indiceInstrumento = partes.indexOf(gupInstrumento);
      if (indiceInstrumento >= 0) {
        const copia = [...partes];
        copia.splice(indiceInstrumento, 0, poseedorInstrumento.token);
        alternativas = [
          ...(alternativas ?? []),
          {
            gup: capitalizar(copia.join(" ")),
            nota: "posesivo explícito (se suele omitir si coincide con el sujeto)",
          },
        ];
        reglas.push({ leccion: 36, regla: "possessive-gala-suffixed-head" });
      }
    }
    if (agenteInstrumento.sufijo === "y") {
      sustitucionesVerbal.push({
        de: gupInstrumento,
        a: `${cosaInstrumento.gup}yu`,
        nota: "Yirrkala: -yu",
      });
    }
    if (!frase.instrumento.adjetivo) {
      for (const baseAlterna of cosaInstrumento.basesAlternas ?? []) {
        sustitucionesVerbal.push({
          de: gupInstrumento,
          a: sufijoAgente(baseAlterna).conSufijo,
          nota: `también ${baseAlterna}`,
        });
      }
    }
    if (cosaInstrumento.vehiculo) {
      sustitucionesVerbal.push({
        de: gupInstrumento,
        a: `${cosaInstrumento.gup}lili`,
        nota: "también -lili (p. ej. enviar por barco)",
      });
    }
    if (
      frase.instrumento.sustantivo === "foot" ||
      frase.instrumento.sustantivo === "foot-djalkiri"
    ) {
      const otroPie = buscarPalabra(
        frase.instrumento.sustantivo === "foot" ? "foot-djalkiri" : "foot",
        "sustantivo"
      );
      if (otroPie) {
        sustitucionesVerbal.push({
          de: gupInstrumento,
          a: sufijoAgente(otroPie.gup).conSufijo,
          nota: `también ${otroPie.gup}`,
        });
      }
    }
  }

  if (frase.pertenencia) {
    const pertenencia = renderPertenencia(frase.pertenencia);
    if (!pertenencia) return null;
    reglas.push(...pertenencia.reglas);
    sustitucionesVerbal.push(...pertenencia.sustituciones);
    const partesAntesPertenencia = [...partes];
    if (pertenencia.esPersona) {
      const indiceObjeto = tokenObjetoCosa
        ? partes.indexOf(tokenObjetoCosa)
        : -1;
      const indiceInsercion =
        indiceObjeto >= 0 ? indiceObjeto : Math.max(partes.length - 1, 0);
      partes.splice(indiceInsercion, 0, ...pertenencia.tokens);
    } else {
      if (alternativas) {
        alternativas = alternativas.map((alternativa) => ({
          ...alternativa,
          gup: `${alternativa.gup} ${pertenencia.tokens.join(" ")}`,
        }));
      }
      partes.push(...pertenencia.tokens);
    }
    alternativas = [
      ...(alternativas ?? []),
      {
        gup: capitalizar(
          [...pertenencia.tokens, ...partesAntesPertenencia].join(" ")
        ),
        nota: "orden alternativo (tema al frente)",
      },
    ];
  }

  if (frase.veces) {
    const tokenVeces = `${frase.veces}mirri`;
    if (alternativas) {
      alternativas = alternativas.map((alternativa) => ({
        ...alternativa,
        gup: `${alternativa.gup} ${tokenVeces}`,
      }));
    }
    const partesAntesVeces = [...partes];
    partes.push(tokenVeces);
    reglas.push({ leccion: 40, regla: "mirri-times" });
    sustitucionesVerbal.push({
      de: tokenVeces,
      a: `buku-${frase.veces}`,
      nota: "también buku- (buku-waŋgany, buku-märrma'...)",
    });
    alternativas = [
      ...(alternativas ?? []),
      {
        gup: capitalizar([tokenVeces, ...partesAntesVeces].join(" ")),
        nota: "orden alternativo",
      },
    ];
  }

  if (frase.esSerLugar) {
    const POSTURAS: [string, string][] = [
      ["sit", "nhina: personas"],
      ["stand up", "dhärra: cosas en pie (lata, mesa, barco)"],
      ["sleep", "ŋorra: cosas tendidas (cuerda)"],
      ["be up", "gorruma: arriba/encaramado (árbol)"],
    ];
    for (const [clavePostura, nota] of POSTURAS) {
      if (clavePostura === claveVerbo) continue;
      const entradaPostura = VOCAB.verbos.find(
        (candidato) => candidato.clave === clavePostura
      );
      if (!entradaPostura) continue;
      const candidatosPostura = verbosPorLema(entradaPostura.lema);
      if (candidatosPostura.length === 0) continue;
      const formaPostura = formaAtestada(candidatosPostura[0], "I")[0];
      if (!formaPostura) continue;
      const copia = partes.map((parte) =>
        parte === formas[0] ? formaPostura : parte
      );
      alternativas = [
        ...(alternativas ?? []),
        { gup: capitalizar(copia.join(" ")), nota },
      ];
    }
    if (
      frase.lugar?.demostrativo &&
      !frase.lugar.sustantivo &&
      !frase.lugar.nombre &&
      !frase.lugar.adverbio
    ) {
      const sinPostura = partes.filter(
        (parte) =>
          parte !== formas[0] && parte !== VOCAB.particulas.continuo
      );
      if (sinPostura.length > 0) {
        alternativas = [
          ...(alternativas ?? []),
          {
            gup: capitalizar(sinPostura.join(" ")),
            nota: "sin verbo, mismo sentido",
          },
        ];
      }
    }
  }

  if (frase.sentimiento && persona) {
    sustitucionesVerbal.push({
      de: VOCAB.pronombres[persona],
      a: `${VOCAB.pronombres[persona]} dhuwala`,
      nota: "con dhuwala discursivo, sin equivalente (lecciones 64-65; dhuwali si se ve, ŋunhi si no)",
    });
    const formaPrimariaSentir = formaAtestada(verbo, "I")[0];
    const formaTerciariaSentir = formaAtestada(verbo, "III")[0];
    if (
      formaPrimariaSentir &&
      formaTerciariaSentir &&
      partes.includes(formaTerciariaSentir)
    ) {
      sustitucionesVerbal.push({
        de: formaTerciariaSentir,
        a: `ga ${formaPrimariaSentir}`,
        nota: "también la forma primaria con ga",
      });
    }
  }

  for (const sinonimo of formasSinonimas(
    entrada.clave,
    continuo
      ? tiempo === "pasado_hoy"
        ? "III"
        : tiempo === "futuro_manana"
          ? "II"
          : "I"
      : tiempo === "futuro_manana"
        ? "II"
        : tiempo === "pasado_hoy" && !pasadoHoyGrupoUno
          ? "III"
          : "I"
  )) {
    sustitucionesVerbal.push({
      de: formas[0],
      a: sinonimo.forma,
      nota: `también ${sinonimo.forma}`,
    });
  }

  for (const sustitucion of sustitucionesVerbal) {
    const copia = partes.map((parte) =>
      reemplazarEnParte(parte, sustitucion.de, sustitucion.a)
    );
    alternativas = [
      ...(alternativas ?? []),
      { gup: capitalizar(copia.join(" ")), nota: sustitucion.nota },
    ];
  }

  if (frase.personaAlternativa && persona) {
    const copia = [...partes];
    copia[indicePronombre] = VOCAB.pronombres[frase.personaAlternativa];
    alternativas = [
      ...(alternativas ?? []),
      {
        gup: capitalizar(copia.join(" ")),
        nota: "otra lectura de persona (él/ella)",
      },
    ];
  }

  if (persona && PERSONAS_AMBIGUAS[persona]) {
    for (const ambigua of PERSONAS_AMBIGUAS[persona] ?? []) {
      const copia = [...partes];
      copia[indicePronombre] = VOCAB.pronombres[ambigua.persona];
      alternativas = [
        ...(alternativas ?? []),
        { gup: capitalizar(copia.join(" ")), nota: ambigua.nota },
      ];
    }
  }

  if (tokenObjetoCosa) {
    const indiceCosa = partes.indexOf(tokenObjetoCosa);
    if (indiceCosa > 0) {
      const copia = [...partes];
      copia.splice(indiceCosa, 1);
      copia.unshift(tokenObjetoCosa);
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar(copia.join(" ")),
          nota: "orden alternativo (objeto al frente)",
        },
      ];
    }
  }

  if (tokenSujetoAgente) {
    const indiceAgente = partes.indexOf(tokenSujetoAgente);
    if (indiceAgente >= 0 && indiceAgente < partes.length - 1) {
      const copia = [...partes];
      copia.splice(indiceAgente, 1);
      copia.push(tokenSujetoAgente);
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar(copia.join(" ")),
          nota: "orden alternativo (agente al final)",
        },
      ];
    }
  }

  if (tokenPoseedorAgente && tokenSujetoAgente) {
    const indicePoseedor = partes.indexOf(tokenPoseedorAgente);
    const indiceAgenteSwap = partes.indexOf(tokenSujetoAgente);
    if (indicePoseedor >= 0 && indiceAgenteSwap >= 0) {
      const copia = [...partes];
      copia[indicePoseedor] = partes[indiceAgenteSwap];
      copia[indiceAgenteSwap] = partes[indicePoseedor];
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar(copia.join(" ")),
          nota: "orden libre del posesivo",
        },
      ];
    }
  }

  if (tokenNegacion) {
    const indiceNegacion = partes.indexOf(tokenNegacion);
    if (indiceNegacion > 0) {
      const sinNegacion = [...partes];
      sinNegacion.splice(indiceNegacion, 1);
      const otraNegacion = tokenNegacion === "yaka" ? "bäyŋu" : "yaka";
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: capitalizar([tokenNegacion, ...sinNegacion].join(" ")),
          nota: "orden alternativo (negación al frente)",
        },
        {
          gup: capitalizar([otraNegacion, ...sinNegacion].join(" ")),
          nota: `negación al frente con ${otraNegacion} (nota 5, lección 41)`,
        },
      ];
    }
  }

  if (tokensComitativoOrden.length > 0 && persona) {
    const indiceSujeto = partes.indexOf(VOCAB.pronombres[persona]);
    const copia = partes.filter(
      (token) => !tokensComitativoOrden.includes(token)
    );
    if (indiceSujeto >= 0 && copia.length < partes.length) {
      copia.splice(indiceSujeto + 1, 0, ...tokensComitativoOrden);
      const gupOrden = capitalizar(copia.join(" "));
      if (gupOrden !== capitalizar(partes.join(" "))) {
        alternativas = [
          ...(alternativas ?? []),
          { gup: gupOrden, nota: "orden alternativo (junto al sujeto)" },
        ];
      }
    }
  }

  if ((marcoHabla || marcoContar) && tokenObjetoAcusativo && objetoPersonaBase) {
    const enfaticoHabla = frase.objeto?.enfatico === true;
    const dativoObjeto = objetoPersonaBase.persona
      ? enfaticoHabla
        ? enfatizarPosesivo(objetoPersonaBase.persona)
        : VOCAB.posesivos[objetoPersonaBase.persona]
      : `${objetoPersonaBase.base}${sufijoPosesivo(objetoPersonaBase.base!).sufijo}`;
    const oblicuoObjeto = objetoPersonaBase.persona
      ? enfaticoHabla
        ? enfatizarComitativo(VOCAB.comitativos[objetoPersonaBase.persona])
        : VOCAB.comitativos[objetoPersonaBase.persona]
      : sufijoComitativo(objetoPersonaBase.base!).conSufijo;
    const variante = (
      tokenObjetoNuevo: string,
      sinAgente: boolean
    ): string =>
      capitalizar(
        partes
          .map((token) => {
            if (token === tokenObjetoAcusativo) return tokenObjetoNuevo;
            if (
              sinAgente &&
              tokenSujetoAgente &&
              tokenSujetoBase &&
              token === tokenSujetoAgente
            ) {
              return tokenSujetoBase;
            }
            return token;
          })
          .join(" ")
      );
    if (marcoHabla && !frase.proposito) {
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: variante(dativoObjeto, true),
          nota: "waŋa intransitivo: -gu/-ku/-wa/-wu en la persona (sin sufijo de agente)",
        },
        {
          gup: variante(oblicuoObjeto, true),
          nota: "waŋa intransitivo: -gala/-kala/-wala en la persona (sin sufijo de agente)",
        },
      ];
      reglas.push({ leccion: 47, regla: "wanga-addressee-frames" });
    }
    if (marcoContar) {
      alternativas = [
        ...(alternativas ?? []),
        {
          gup: variante(dativoObjeto, false),
          nota: "persona a la que se cuenta: -gu/-ku/-wa/-wu (-nha es contar SOBRE ella)",
        },
        {
          gup: variante(oblicuoObjeto, false),
          nota: "persona a la que se cuenta: también -gala/-kala/-wala",
        },
      ];
      reglas.push({ leccion: 47, regla: "lakarama-told-frames" });
    }
  }

  return {
    gup: capitalizar(partes.join(" ")),
    reglas,
    atestada: false,
    alternativas,
  };
};

const generarDeclarativa = (frase: FraseIR): TraduccionGenerada | null => {
  if (frase.predicado.tipo === "verbo") return generarVerbal(frase);

  if (frase.predicado.tipo === "proposito") {
    if (!frase.proposito) return null;
    const proposito = renderProposito(frase.proposito);
    if (!proposito) return null;
    const partesProposito: string[] = [];
    if (frase.sujeto?.demostrativo) {
      partesProposito.push(VOCAB.demostrativos[frase.sujeto.demostrativo]);
    }
    if (frase.sujeto?.sustantivo) {
      const sujetoProposito = buscarPalabra(
        frase.sujeto.sustantivo,
        "sustantivo"
      );
      if (!sujetoProposito) return null;
      partesProposito.push(sujetoProposito.gup);
    }
    partesProposito.push(...proposito.tokens);
    const gup = capitalizar(partesProposito.join(" "));
    const alternativas: AlternativaGenerada[] = [];
    for (const sustitucion of proposito.sustituciones) {
      const conSustitucion = sustituirToken(gup, sustitucion.de, sustitucion.a);
      if (conSustitucion !== gup) {
        alternativas.push({ gup: conSustitucion, nota: sustitucion.nota });
      }
    }
    if (frase.proposito.verbo && !frase.sujeto) {
      const nominalLili = nominalCasual(frase.proposito.verbo, "lili");
      if (nominalLili) {
        const partesLili: string[] = [];
        if (frase.proposito.sustantivo) {
          const palabraObjeto = buscarPalabra(
            frase.proposito.sustantivo,
            "sustantivo"
          );
          if (palabraObjeto) partesLili.push(`${palabraObjeto.gup}lili`);
        }
        partesLili.push(nominalLili.principal);
        alternativas.push({
          gup: capitalizar(partesLili.join(" ")),
          nota: "dirección: al lugar de la acción (-lili, lección 46)",
        });
      }
      const basesWuy = basesVerbal(frase.proposito.verbo);
      if (basesWuy) {
        const partesWuy: string[] = [];
        if (frase.proposito.sustantivo) {
          const palabraObjeto = buscarPalabra(
            frase.proposito.sustantivo,
            "sustantivo"
          );
          if (palabraObjeto) {
            partesWuy.push(
              sufijoBuy(palabraObjeto.gup, palabraObjeto.sufijoBuy).conSufijo
            );
          }
        }
        partesWuy.push(sufijoBuy(basesWuy.corta, "wuy").conSufijo);
        alternativas.push({
          gup: capitalizar(partesWuy.join(" ")),
          nota: "adjetival: 'para (la acción)' con -puy/-wuy (lección 46)",
        });
      }
    }
    return {
      gup,
      reglas: proposito.reglas,
      atestada: false,
      ...(alternativas.length > 0 ? { alternativas } : {}),
    };
  }

  if (frase.predicado.tipo === "pertenencia") {
    if (!frase.pertenencia) return null;
    if (
      frase.pertenencia.dativo === true &&
      frase.pertenencia.persona !== undefined
    ) {
      const posesivoDativo = VOCAB.posesivos[frase.pertenencia.persona];
      const demTexto = frase.pertenencia.demostrativo
        ? VOCAB.demostrativos[frase.pertenencia.demostrativo]
        : null;
      const partesDativo = demTexto
        ? [demTexto, posesivoDativo]
        : [posesivoDativo];
      const renderBelonging = renderPertenencia({
        ...frase.pertenencia,
        dativo: undefined,
      });
      return {
        gup: capitalizar(partesDativo.join(" ")),
        reglas: [{ leccion: 14, regla: "pronoun-possessives" }],
        atestada: false,
        alternativas: [
          ...(demTexto
            ? [
                {
                  gup: capitalizar(
                    [sufijoNydja(demTexto), posesivoDativo].join(" ")
                  ),
                  nota: "con -nydja de énfasis en el tema: ¿y ESTE?",
                },
              ]
            : []),
          ...(renderBelonging
            ? [
                {
                  gup: capitalizar(renderBelonging.tokens.join(" ")),
                  nota: "forma de pertenencia: el/lo que le pertenece",
                },
              ]
            : []),
        ],
      };
    }
    const pertenencia = renderPertenencia(frase.pertenencia);
    if (!pertenencia) return null;
    const partesSujetoPertenencia: string[] = [];
    if (frase.sujeto?.posesivo) {
      partesSujetoPertenencia.push(VOCAB.posesivos[frase.sujeto.posesivo]);
      pertenencia.reglas.push({ leccion: 14, regla: "pronoun-possessives" });
    }
    if (frase.sujeto?.sustantivo) {
      const sujetoPertenencia = buscarPalabra(
        frase.sujeto.sustantivo,
        "sustantivo"
      );
      if (!sujetoPertenencia) return null;
      partesSujetoPertenencia.push(sujetoPertenencia.gup);
    } else if (frase.sujeto?.nombre) {
      partesSujetoPertenencia.push(frase.sujeto.nombre);
    }
    const gup = capitalizar(
      [...partesSujetoPertenencia, ...pertenencia.tokens].join(" ")
    );
    const alternativas: AlternativaGenerada[] = [];
    for (const sustitucion of pertenencia.sustituciones) {
      const conSustitucion = sustituirToken(gup, sustitucion.de, sustitucion.a);
      if (conSustitucion !== gup) {
        alternativas.push({ gup: conSustitucion, nota: sustitucion.nota });
      }
    }
    return {
      gup,
      reglas: pertenencia.reglas,
      atestada: false,
      ...(alternativas.length > 0 ? { alternativas } : {}),
    };
  }

  if (frase.predicado.tipo === "origen") {
    if (!frase.origen) return null;
    if (!frase.sujeto) {
      const origenSolo = renderOrigen(frase.origen, false);
      if (!origenSolo || origenSolo.tokens.length === 0) return null;
      return {
        gup: capitalizar(origenSolo.tokens.join(" ")),
        reglas: origenSolo.reglas,
        atestada: false,
        ...(origenSolo.sustituciones.length > 0
          ? {
              alternativas: origenSolo.sustituciones.map((sustitucion) => ({
                gup: capitalizar(
                  origenSolo.tokens
                    .map((token) =>
                      reemplazarEnParte(token, sustitucion.de, sustitucion.a)
                    )
                    .join(" ")
                ),
                nota: sustitucion.nota,
              })),
            }
          : {}),
      };
    }
    const origen = renderOrigen(frase.origen, false);
    if (!origen) return null;
    const partesOrigen: string[] = [];
    if (frase.sujeto.demostrativo) {
      partesOrigen.push(VOCAB.demostrativos[frase.sujeto.demostrativo]);
    }
    if (frase.sujeto.sustantivo) {
      const sustantivoSujeto = buscarPalabra(
        frase.sujeto.sustantivo,
        "sustantivo"
      );
      if (!sustantivoSujeto) return null;
      partesOrigen.push(sustantivoSujeto.gup);
    } else if (frase.sujeto.nombre) {
      partesOrigen.push(frase.sujeto.nombre);
    }
    if (partesOrigen.length === 0) return null;
    partesOrigen.push(...origen.tokens);
    const alternativasOrigen: AlternativaGenerada[] = origen.sustituciones.map(
      (sustitucion) => ({
        gup: capitalizar(
          partesOrigen
            .map((token) =>
              reemplazarEnParte(token, sustitucion.de, sustitucion.a)
            )
            .join(" ")
        ),
        nota: sustitucion.nota,
      })
    );
    if (frase.sujeto.articuloDefinido && frase.sujeto.demostrativo) {
      const otroDem =
        VOCAB.demostrativos[
          frase.sujeto.demostrativo === "este" ? "ese" : "este"
        ];
      alternativasOrigen.push({
        gup: capitalizar(
          [otroDem, ...partesOrigen.slice(1)].join(" ")
        ),
        nota: "el artículo no distingue cerca/lejos",
      });
    }
    const resultadoOrigen: TraduccionGenerada = {
      gup: capitalizar(partesOrigen.join(" ")),
      reglas: origen.reglas,
      atestada: false,
    };
    if (alternativasOrigen.length > 0) {
      resultadoOrigen.alternativas = alternativasOrigen;
    }
    return resultadoOrigen;
  }

  if (frase.predicado.tipo === "posesion") {
    if (!frase.sujeto) return null;
    const reglasPosesion: ReglaAplicada[] = [
      { leccion: 32, regla: "possession-gu" },
    ];
    let poseedor: string | null = null;
    let poseedorYirrkala: string | null = null;
    if (frase.sujeto.persona) {
      poseedor = VOCAB.posesivos[frase.sujeto.persona];
    } else {
      let basePoseedor: string | null = null;
      if (frase.sujeto.nombre) basePoseedor = frase.sujeto.nombre;
      else if (frase.sujeto.sustantivo) {
        const palabraPoseedor = buscarPalabra(
          frase.sujeto.sustantivo,
          "sustantivo"
        );
        if (!palabraPoseedor) return null;
        basePoseedor = palabraPoseedor.gup;
      }
      if (!basePoseedor) return null;
      const sufijo = sufijoPosesivo(basePoseedor);
      poseedor = `${basePoseedor}${sufijo.sufijo}`;
      poseedorYirrkala = formaYirrkalaWu(basePoseedor, sufijo.sufijo);
    }
    const cosa = buscarPalabra(frase.predicado.clave, "sustantivo");
    const cuantificador = VOCAB.cuantificadores.find(
      (candidato) => candidato.clave === frase.predicado.estado
    );
    if (!cosa || !cuantificador) return null;
    const demPosesion = frase.sujeto.demostrativo
      ? [demostrativoCasual(frase.sujeto.demostrativo, "dativo")]
      : [];
    if (frase.sujeto.demostrativo) {
      reglasPosesion.push({ leccion: 54, regla: "demonstrative-agreement" });
    }
    const partesPosesion =
      cuantificador.posicion === "antes"
        ? [...demPosesion, poseedor, cuantificador.gup, cosa.gup]
        : [...demPosesion, poseedor, cosa.gup, cuantificador.gup];
    const resultadoPosesion: TraduccionGenerada = {
      gup: capitalizar(partesPosesion.join(" ")),
      reglas: reglasPosesion,
      atestada: false,
    };
    if (poseedorYirrkala) {
      resultadoPosesion.alternativas = [
        {
          gup: capitalizar(
            partesPosesion
              .map((token) =>
                token === poseedor ? poseedorYirrkala : token
              )
              .join(" ")
          ),
          nota: "Yirrkala: -wu",
        },
      ];
    }
    return resultadoPosesion;
  }

  const partes: string[] = [];
  const reglas: ReglaAplicada[] = [];
  const sustituciones: { de: string; a: string; nota: string }[] = [];
  const protegidos: number[] = [];
  let ordenNegativo: string | null = null;
  const sujeto = frase.sujeto;
  if (!sujeto) return null;

  if (sujeto.persona) {
    partes.push(VOCAB.pronombres[sujeto.persona]);
    reglas.push({ leccion: 5, regla: "pronoun-numbers" });
    if (sujeto.persona.includes("incl") || sujeto.persona.includes("excl")) {
      reglas.push({ leccion: 5, regla: "inclusive-exclusive" });
    }
  }

  if (sujeto.demostrativo) {
    partes.push(VOCAB.demostrativos[sujeto.demostrativo]);
  }

  if (sujeto.posesivo !== undefined && sujeto.sustantivo) {
    partes.push(VOCAB.posesivos[sujeto.posesivo]);
    reglas.push({ leccion: 14, regla: "pronoun-possessives" });
  }

  if (sujeto.sustantivo) {
    const sustantivo = buscarPalabra(sujeto.sustantivo, "sustantivo");
    if (!sustantivo) return null;
    partes.push(sustantivo.gup);
  }

  if (sujeto.nombre) {
    partes.push(sujeto.nombre);
  }

  if (frase.predicado.tipo === "adjetivo") {
    const adjetivo = buscarPalabra(frase.predicado.clave, "adjetivo");
    if (!adjetivo) return null;
    partes.push(adjetivo.gup);
    reglas.push({ leccion: 1, regla: "verbless-clause" });
    if (sujeto.demostrativo && sujeto.sustantivo) {
      reglas.push({ leccion: 2, regla: "demonstrative-noun-adjective" });
    } else if (sujeto.sustantivo) {
      reglas.push({ leccion: 2, regla: "noun-adjective-clause" });
    }
    if (frase.predicado.clave === "like this") {
      sustituciones.push({
        de: "balanya",
        a: "balanyara",
        nota: "balanyara en Yirrkala (también Elcho y Milingimbi a veces; notas 1-2, lección 88)",
      });
    }
    if (frase.comparado) {
      if (frase.predicado.clave !== "like this") {
        partes.push("balanya");
        sustituciones.push({
          de: "balanya",
          a: "balanyara",
          nota: "balanyara en Yirrkala (nota 1, lección 88)",
        });
      }
      partes.push("nhakuna");
      let tokenComparado: string | null = null;
      if (frase.comparado.posesivo) {
        tokenComparado = VOCAB.posesivos[frase.comparado.posesivo];
      } else if (frase.comparado.demostrativo) {
        tokenComparado = VOCAB.demostrativos[frase.comparado.demostrativo];
      } else if (frase.comparado.sustantivo) {
        const cosaComparada = buscarPalabra(
          frase.comparado.sustantivo,
          "sustantivo"
        );
        if (!cosaComparada) return null;
        tokenComparado = cosaComparada.gup;
      } else if (frase.comparado.nombre) {
        tokenComparado = frase.comparado.nombre;
      }
      if (!tokenComparado) return null;
      partes.push(tokenComparado);
      reglas.push({ leccion: 88, regla: "balanya-nhakuna" });
      sustituciones.push({
        de: tokenComparado,
        a: `${tokenComparado} yäna`,
        nota: "con yäna, lo más cercano a 'just' (nota 1, lección 88-C)",
      });
    }
    if (
      frase.predicado.clave.startsWith("resultado:") &&
      frase.comitativo &&
      !frase.comitativo.demostrativo
    ) {
      let baseAgente: string | null = null;
      let alternoAgente: string | undefined;
      if (frase.comitativo.persona) {
        baseAgente = VOCAB.comitativos[frase.comitativo.persona];
      } else if (frase.comitativo.nombre) {
        const sufijado = sufijoComitativo(frase.comitativo.nombre);
        baseAgente = sufijado.conSufijo;
        alternoAgente = sufijado.alternativo;
      } else if (frase.comitativo.sustantivo) {
        const palabraAgente = buscarPalabra(
          frase.comitativo.sustantivo,
          "sustantivo"
        );
        if (palabraAgente?.persona) {
          const sufijado = sufijoComitativo(palabraAgente.gup);
          baseAgente = sufijado.conSufijo;
          alternoAgente = sufijado.alternativo;
        }
      }
      if (baseAgente) {
        const agenteGunu = formaGunu(baseAgente);
        partes.push(agenteGunu);
        reglas.push({ leccion: 69, regla: "adjectival-expression-buy" });
        if (alternoAgente) {
          sustituciones.push({
            de: agenteGunu,
            a: formaGunu(alternoAgente),
            nota: "también -wuŋu (variante según el sonido final)",
          });
        }
      }
    }
    if (frase.proposito) {
      const proposito = renderProposito(frase.proposito);
      if (!proposito) return null;
      reglas.push(...proposito.reglas);
      partes.push(...proposito.tokens);
      sustituciones.push(...proposito.sustituciones);
    }
  } else if (frase.predicado.tipo === "derivado") {
    const sustantivo = buscarPalabra(frase.predicado.clave, "sustantivo");
    if (!sustantivo || !frase.predicado.sufijo) return null;
    partes.push(`${sustantivo.gup}${frase.predicado.sufijo}`);
    reglas.push(
      frase.predicado.sufijo === "mirri"
        ? { leccion: 8, regla: "mirri-adjective" }
        : { leccion: 9, regla: "miriw-adjective" }
    );
    if (frase.predicado.sufijo === "miriw" && sujeto.persona) {
      sustituciones.push({
        de: capitalizar(
          `${VOCAB.pronombres[sujeto.persona]} ${sustantivo.gup}miriw`
        ),
        a: capitalizar(
          `${VOCAB.posesivos[sujeto.persona]} bäyŋu ${sustantivo.gup}`
        ),
        nota: "posesión con -gu: no tener",
      });
    }
  } else if (frase.predicado.tipo === "sustantivo") {
    const sustantivo = buscarPalabra(frase.predicado.clave, "sustantivo");
    if (!sustantivo) return null;
    if (frase.pertenencia) {
      const pertenencia = renderPertenencia(frase.pertenencia);
      if (!pertenencia) return null;
      reglas.push(...pertenencia.reglas);
      sustituciones.push(...pertenencia.sustituciones);
      partes.push(...pertenencia.tokens);
      if (frase.pertenencia.sustantivo && !pertenencia.esPersona) {
        const cosaPertenencia = buscarPalabra(
          frase.pertenencia.sustantivo,
          "sustantivo"
        );
        if (cosaPertenencia && pertenencia.tokens.length === 1) {
          sustituciones.push({
            de: pertenencia.tokens[0],
            a: `${cosaPertenencia.gup}${sufijoPosesivo(cosaPertenencia.gup).sufijo}`,
            nota: "-gu/-wa si se lee como poseedor: de X",
          });
        }
      }
    }
    partes.push(sustantivo.gup);

    if (frase.predicado.posesivo) {
      if (
        frase.predicado.posesivoEnfatico === true ||
        frase.predicado.posesivoReflexivo === true
      ) {
        const tokenEnfatico = enfatizarPosesivo(frase.predicado.posesivo);
        const indiceCabeza = partes.lastIndexOf(sustantivo.gup);
        partes.splice(
          indiceCabeza >= 0 ? indiceCabeza : partes.length,
          0,
          tokenEnfatico
        );
        reglas.push(
          frase.predicado.posesivoReflexivo
            ? { leccion: 77, regla: "reflexive-possessive-wuy" }
            : { leccion: 76, regla: "emphasised-possessive-wuy" }
        );
      } else {
        partes.push(VOCAB.posesivos[frase.predicado.posesivo]);
        reglas.push({ leccion: 14, regla: "pronoun-possessives" });
      }
    } else if (frase.predicado.posesivoSustantivo) {
      const poseedor = buscarPalabra(
        frase.predicado.posesivoSustantivo,
        "sustantivo"
      );
      if (!poseedor) return null;
      const { sufijo, regla } = sufijoPosesivo(poseedor.gup);
      const conSufijo = `${poseedor.gup}${sufijo}`;
      const parteJuxtapuesta =
        poseedor.persona !== true && sustantivo.parteCuerpo === true;
      if (parteJuxtapuesta) {
        const indiceCabezaParte = partes.lastIndexOf(sustantivo.gup);
        partes.splice(
          indiceCabezaParte >= 0 ? indiceCabezaParte : partes.length,
          0,
          poseedor.gup
        );
        reglas.push({ leccion: 80, regla: "body-parts-one-with-person" });
        sustituciones.push({
          de: poseedor.gup,
          a: conSufijo,
          nota: "con el sufijo posesivo (generalmente no usado con partes, lección 80-F)",
        });
      } else {
        partes.push(conSufijo);
        reglas.push(regla);
      }
      if (!parteJuxtapuesta) {
        const wu = formaYirrkalaWu(poseedor.gup, sufijo);
        if (wu) {
          sustituciones.push({ de: conSufijo, a: wu, nota: "Yirrkala: -wu" });
          reglas.push({ leccion: 13, regla: "yirrkala-wu" });
        }
        for (const baseAlterna of poseedor.basesAlternas ?? []) {
          sustituciones.push({
            de: conSufijo,
            a: `${baseAlterna}${sufijoPosesivo(baseAlterna).sufijo}`,
            nota: "sin oclusión glotal (algunos hablantes)",
          });
        }
      }
    } else if (frase.predicado.posesivoNombre) {
      const nombre = frase.predicado.posesivoNombre;
      const { sufijo, regla } = sufijoPosesivo(nombre);
      const conSufijo = `${nombre}${sufijo}`;
      partes.push(conSufijo);
      reglas.push(regla);
      const wu = formaYirrkalaWu(nombre, sufijo);
      if (wu) {
        sustituciones.push({ de: conSufijo, a: wu, nota: "Yirrkala: -wu" });
        reglas.push({ leccion: 13, regla: "yirrkala-wu" });
      }
    } else {
      reglas.push({ leccion: 1, regla: "verbless-clause" });
      reglas.push({ leccion: 2, regla: "dhuwali-that" });
    }
  } else if (frase.predicado.tipo === "estado") {
    const estado = VOCAB.estados.find(
      (candidato) => candidato.clave === frase.predicado.clave
    );
    if (!estado) return null;
    const complementosIR =
      frase.predicado.complementos ??
      (frase.predicado.posesivo ||
      frase.predicado.posesivoSustantivo ||
      frase.predicado.posesivoNombre ||
      frase.predicado.verbo ||
      frase.predicado.destinoLili
        ? [
            {
              posesivo: frase.predicado.posesivo,
              posesivoSustantivo: frase.predicado.posesivoSustantivo,
              posesivoNombre: frase.predicado.posesivoNombre,
              duenoPosesivo: frase.predicado.duenoPosesivo,
              duenoNombre: frase.predicado.duenoNombre,
              duenoSustantivo: frase.predicado.duenoSustantivo,
              duenoDemostrativo: frase.predicado.duenoDemostrativo,
              demostrativo: frase.predicado.demostrativo,
              dualAlternativo: frase.predicado.dualAlternativo,
              adjetivo: frase.predicado.adjetivo,
              verbo: frase.predicado.verbo,
              destinoLili: frase.predicado.destinoLili,
            },
          ]
        : []);
    const complemento: string[] = [];
    const posicionesConjuncion: number[] = [];
    for (const item of complementosIR) {
      if (complemento.length > 0) {
        posicionesConjuncion.push(complemento.length);
        complemento.push(VOCAB.conjuncion.gup);
      }
      if (item.posesivo) {
        const gupPosesivo = VOCAB.posesivos[item.posesivo];
        complemento.push(gupPosesivo);
        if (item.dualAlternativo && item.posesivo === "3pl") {
          sustituciones.push({
            de: gupPosesivo,
            a: VOCAB.posesivos["3dual"],
            nota: "ellos dos (dual)",
          });
        }
        reglas.push({ leccion: 14, regla: "pronoun-possessives" });
      } else if (item.posesivoSustantivo) {
        const cosa = buscarPalabra(item.posesivoSustantivo, "sustantivo");
        if (!cosa) return null;
        const { sufijo, regla } = sufijoPosesivo(cosa.gup);
        const conSufijo = `${cosa.gup}${sufijo}`;
        if (item.demostrativo) {
          complemento.push(demostrativoCasual(item.demostrativo, "dativo"));
          sustituciones.push(
            ...sustitucionesDemostrativo(item.demostrativo, "dativo")
          );
          reglas.push({ leccion: 54, regla: "demonstrative-agreement" });
        }
        const duenoItem =
          item.duenoPosesivo || item.duenoNombre || item.duenoSustantivo
            ? renderPoseedorInfijado(
                {
                  posesivo: item.duenoPosesivo,
                  posesivoNombre: item.duenoNombre,
                  posesivoSustantivo: item.duenoSustantivo,
                  posesivoDemostrativo: item.duenoDemostrativo,
                },
                "wa"
              )
            : null;
        if (
          (item.duenoPosesivo || item.duenoNombre || item.duenoSustantivo) &&
          !duenoItem
        ) {
          return null;
        }
        if (duenoItem && cosa.persona) {
          complemento.push(duenoItem.token);
        }
        complemento.push(conSufijo);
        if (duenoItem && !cosa.persona) {
          complemento.push(duenoItem.token);
        }
        if (duenoItem) {
          sustituciones.push(...duenoItem.sustituciones);
          reglas.push({ leccion: 51, regla: "possessive-infix-galangu" });
        }
        if (item.adjetivo) {
          const sufijoAdj = sufijoPosesivo(item.adjetivo);
          complemento.push(`${item.adjetivo}${sufijoAdj.sufijo}`);
          reglas.push({ leccion: 34, regla: "adjective-agreement" });
        }
        reglas.push(regla);
        const wu = formaYirrkalaWu(cosa.gup, sufijo);
        if (wu) {
          sustituciones.push({ de: conSufijo, a: wu, nota: "Yirrkala: -wu" });
        }
        for (const baseAlterna of cosa.basesAlternas ?? []) {
          sustituciones.push({
            de: conSufijo,
            a: `${baseAlterna}${sufijoPosesivo(baseAlterna).sufijo}`,
            nota: "sin oclusión glotal (algunos hablantes)",
          });
        }
      } else if (item.posesivoNombre) {
        const nombre = item.posesivoNombre;
        const { sufijo, regla } = sufijoPosesivo(nombre);
        const conSufijo = `${nombre}${sufijo}`;
        complemento.push(conSufijo);
        reglas.push(regla);
        const wu = formaYirrkalaWu(nombre, sufijo);
        if (wu) {
          sustituciones.push({ de: conSufijo, a: wu, nota: "Yirrkala: -wu" });
        }
      }
      if (item.destinoLili) {
        const lugarLili = buscarPalabra(item.destinoLili, "sustantivo");
        if (!lugarLili) return null;
        complemento.push(`${lugarLili.gup}lili`);
        reglas.push({ leccion: 44, regla: "no-change-lili" });
      }
      if (item.verbo) {
        const infinitivo = infinitivoWa(item.verbo);
        if (!infinitivo) return null;
        complemento.push(infinitivo.token);
        sustituciones.push(...infinitivo.sustituciones);
        reglas.push({ leccion: 44, regla: "verb-plus-wa" });
      }
    }
    reglas.push({
      leccion: 15,
      regla:
        frase.predicado.clave === "want" ? "djal-dative" : "marngi-dative",
    });
    if (frase.polaridad === "negativa") {
      const sujetoPartes = [...partes];
      const base = partes.flatMap((parte) => parte.split(" ")).length + 1;
      for (const posicion of posicionesConjuncion) {
        protegidos.push(base + posicion);
      }
      partes.push(VOCAB.negacionImperativo, ...complemento, estado.gup);
      ordenNegativo = capitalizar(
        [
          VOCAB.negacionImperativo,
          ...sujetoPartes,
          ...complemento,
          estado.gup,
        ].join(" ")
      );
      reglas.push({ leccion: 15, regla: "negative-verbless" });
    } else {
      const base = partes.flatMap((parte) => parte.split(" ")).length + 1;
      for (const posicion of posicionesConjuncion) {
        protegidos.push(base + posicion);
      }
      const sujetoPartes = [...partes];
      partes.push(estado.gup, ...complemento);
      if (
        complementosIR.length === 1 &&
        complementosIR[0].posesivo &&
        complementosIR[0].verbo &&
        complemento.length >= 2
      ) {
        ordenNegativo = capitalizar(
          [
            ...sujetoPartes,
            complemento[0],
            estado.gup,
            ...complemento.slice(1),
          ].join(" ")
        );
      }
    }
  } else {
    return null;
  }

  if (partes.length === 0) return null;

  const resultado: TraduccionGenerada = {
    gup: capitalizar(partes.join(" ")),
    reglas,
    atestada: false,
    ...(protegidos.length > 0 ? { protegidos } : {}),
  };

  for (const sustitucion of sustituciones) {
    resultado.alternativas = [
      ...(resultado.alternativas ?? []),
      {
        gup: resultado.gup.replace(sustitucion.de, sustitucion.a),
        nota: sustitucion.nota,
      },
    ];
  }

  if (sujeto.persona && PERSONAS_AMBIGUAS[sujeto.persona]) {
    for (const ambigua of PERSONAS_AMBIGUAS[sujeto.persona] ?? []) {
      const copia = [...partes];
      copia[0] = VOCAB.pronombres[ambigua.persona];
      resultado.alternativas = [
        ...(resultado.alternativas ?? []),
        { gup: capitalizar(copia.join(" ")), nota: ambigua.nota },
      ];
    }
  }

  if (ordenNegativo) {
    resultado.alternativas = [
      ...(resultado.alternativas ?? []),
      { gup: ordenNegativo, nota: "orden alternativo (ambos en el libro)" },
    ];
  }

  if (sujeto.articuloDefinido && sujeto.demostrativo && !sujeto.persona) {
    const otro =
      VOCAB.demostrativos[sujeto.demostrativo === "este" ? "ese" : "este"];
    resultado.alternativas = [
      ...(resultado.alternativas ?? []),
      {
        gup: capitalizar([otro, ...partes.slice(1)].join(" ")),
        nota: "el artículo no distingue cerca/lejos",
      },
    ];
  }

  if (
    partes.length === 2 &&
    sujeto.demostrativo &&
    !sujeto.sustantivo &&
    !sujeto.persona &&
    frase.predicado.tipo === "adjetivo"
  ) {
    resultado.alternativas = [
      ...(resultado.alternativas ?? []),
      {
        gup: capitalizar([partes[1], partes[0]].join(" ")),
        nota: "orden alternativo (énfasis)",
      },
    ];
    reglas.push({ leccion: 1, regla: "word-order-flexible" });
  }

  return resultado;
};

const quitarPuntuacion = (palabra: string): string =>
  palabra.replace(/[!?]/g, "");

const aplicarVariantes = (
  resultado: TraduccionGenerada
): TraduccionGenerada => {
  const palabras = resultado.gup.split(" ");
  const alternativas: AlternativaGenerada[] = resultado.alternativas
    ? [...resultado.alternativas]
    : [];
  const reglas = [...resultado.reglas];

  const protegidos = resultado.protegidos ?? [];
  for (const variante of VOCAB.variantes ?? []) {
    const indice = palabras.findIndex(
      (palabra, posicion) =>
        !protegidos.includes(posicion) &&
        quitarPuntuacion(palabra).toLowerCase() === variante.gup
    );
    if (indice === -1) continue;
    const original = palabras[indice];
    const sufijo = original.endsWith("!")
      ? "!"
      : original.endsWith("?")
        ? "?"
        : "";
    for (const forma of variante.formas) {
      const copia = [...palabras];
      copia[indice] =
        (indice === 0 ? capitalizar(forma.forma) : forma.forma) + sufijo;
      const alternativa = copia.join(" ");
      if (!alternativas.some((existente) => existente.gup === alternativa)) {
        alternativas.push({ gup: alternativa, nota: forma.nota });
      }
      if (
        !reglas.some(
          (regla) =>
            regla.leccion === forma.leccion && regla.regla === forma.regla
        )
      ) {
        reglas.push({ leccion: forma.leccion, regla: forma.regla });
      }
    }
  }

  if (alternativas.length === 0) return resultado;
  return { ...resultado, alternativas, reglas };
};

const generarFragmentoAgente = (
  frase: FraseIR
): TraduccionGenerada | null => {
  const sujeto = frase.sujeto;
  if (!sujeto) return null;
  if (sujeto.persona) {
    return {
      gup: capitalizar(VOCAB.pronombres[sujeto.persona]),
      reglas: [{ leccion: 23, regla: "agent-answer" }],
      atestada: false,
    };
  }
  let base: string | null = null;
  if (sujeto.sustantivo) {
    const palabra = buscarPalabra(sujeto.sustantivo, "sustantivo");
    if (!palabra) return null;
    base = palabra.gup;
  } else if (sujeto.nombre) {
    base = sujeto.nombre;
  }
  if (!base) return null;
  const agente = sufijoAgente(base);
  return {
    gup: capitalizar(agente.conSufijo),
    reglas: [
      { leccion: 22, regla: "agent-transitive" },
      { leccion: 23, regla: "agent-answer" },
    ],
    atestada: false,
    alternativas: [
      {
        gup: capitalizar(base),
        nota: "sujeto de verbo intransitivo (sin sufijo)",
      },
      ...(agente.sufijo === "y"
        ? [{ gup: capitalizar(`${base}yu`), nota: "Yirrkala: -yu" }]
        : []),
    ],
  };
};

const generarFragmentoLugar = (frase: FraseIR): TraduccionGenerada | null => {
  const lugar = frase.lugar;
  if (!lugar) return null;
  const partes: string[] = [];
  const reglas: ReglaAplicada[] = [];
  if (lugar.verbo) {
    const nominal = nominalCasual(lugar.verbo, "ŋura");
    if (!nominal) return null;
    if (lugar.sustantivo) {
      const palabraObjeto = buscarPalabra(lugar.sustantivo, "sustantivo");
      if (!palabraObjeto) return null;
      partes.push(`${palabraObjeto.gup}ŋura`);
    }
    partes.push(nominal.principal);
    reglas.push({ leccion: 46, regla: "verb-ngura" });
    return {
      gup: capitalizar(partes.join(" ")),
      reglas,
      atestada: false,
      ...(nominal.yirrkala
        ? {
            alternativas: [
              {
                gup: capitalizar(
                  [...partes.slice(0, -1), nominal.yirrkala].join(" ")
                ),
                nota: "Yirrkala: siempre la cuaternaria larga",
              },
            ],
          }
        : {}),
    };
  }
  if (
    lugar.demostrativo &&
    !lugar.sustantivo &&
    !lugar.nombre &&
    !lugar.adverbio
  ) {
    const formaAqui = demostrativoCasual(lugar.demostrativo, "base");
    const alternativasAqui: AlternativaGenerada[] = [
      {
        gup: capitalizar(demostrativoCasual(lugar.demostrativo, "ngura")),
        nota: "cuando la persona o cosa NO está presente ahora (dhiyala/dhiyali)",
      },
      ...sustitucionesDemostrativo(lugar.demostrativo, "base").map(
        (sustitucion) => ({ gup: capitalizar(sustitucion.a), nota: sustitucion.nota })
      ),
    ];
    return {
      gup: capitalizar(formaAqui),
      reglas: [{ leccion: 55, regla: "here-demonstrative" }],
      atestada: false,
      alternativas: alternativasAqui,
    };
  }
  if (lugar.adverbio) {
    const adverbioLugar = buscarPalabra(lugar.adverbio, "adverbio");
    if (!adverbioLugar) return null;
    partes.push(adverbioLugar.gup);
    reglas.push({ leccion: 12, regla: "place-adverbs" });
  }
  if (lugar.sustantivo) {
    const cosaLugar = buscarPalabra(lugar.sustantivo, "sustantivo");
    if (!cosaLugar) return null;
    partes.push(
      cosaLugar.nombrePropio ? cosaLugar.gup : `${cosaLugar.gup}ŋura`
    );
    reglas.push(
      cosaLugar.nombrePropio
        ? { leccion: 25, regla: "placename-no-ngura" }
        : { leccion: 25, regla: "ngura-place" }
    );
  } else if (lugar.nombre) {
    partes.push(lugar.nombre);
    reglas.push({ leccion: 25, regla: "placename-no-ngura" });
  }
  if (partes.length === 0) return null;
  const resultadoLugar: TraduccionGenerada = {
    gup: capitalizar(partes.join(" ")),
    reglas,
    atestada: false,
  };
  const destinoEquivalente = generarFragmentoDestino({
    ...frase,
    predicado: { tipo: "destino", clave: "destino" },
    destino: {
      ...(lugar.adverbio ? { adverbio: lugar.adverbio } : {}),
      ...(lugar.sustantivo ? { sustantivo: lugar.sustantivo } : {}),
      ...(lugar.nombre ? { nombre: lugar.nombre } : {}),
    },
  });
  if (destinoEquivalente && destinoEquivalente.gup !== resultadoLugar.gup) {
    resultadoLugar.alternativas = [
      {
        gup: destinoEquivalente.gup,
        nota: "movimiento hacia (leccion 27)",
      },
    ];
  }
  return resultadoLugar;
};

const generarFragmentoComitativo = (
  frase: FraseIR
): TraduccionGenerada | null => {
  if (!frase.comitativo) return null;
  const comitativo = renderComitativo(frase.comitativo);
  if (!comitativo) return null;
  const resultado: TraduccionGenerada = {
    gup: capitalizar(comitativo.tokens.join(" ")),
    reglas: comitativo.reglas,
    atestada: false,
  };
  if (comitativo.alternativo) {
    resultado.alternativas = [
      {
        gup: capitalizar(
          comitativo.tokens
            .map((token) =>
              token === comitativo.alternativo?.de
                ? comitativo.alternativo.a
                : token
            )
            .join(" ")
        ),
        nota: comitativo.alternativo.nota,
      },
    ];
  }
  return resultado;
};

const generarFragmentoDestino = (
  frase: FraseIR
): TraduccionGenerada | null => {
  if (!frase.destino) return null;
  const destino = renderDestino(frase.destino);
  if (!destino) return null;
  const gup = capitalizar(destino.tokens.join(" "));
  const alternativas: AlternativaGenerada[] = destino.sustituciones.map(
    (sustitucion) => ({
      gup: capitalizar(
        destino.tokens
          .map((token) => reemplazarEnParte(token, sustitucion.de, sustitucion.a))
          .join(" ")
      ),
      nota: sustitucion.nota,
    })
  );
  if (!frase.destino.direccion) {
    alternativas.push({
      gup: capitalizar(
        [VOCAB.direcciones.bala.gup, ...destino.tokens].join(" ")
      ),
      nota: "bala — movimiento alejándose del hablante",
    });
  }
  const resultado: TraduccionGenerada = {
    gup,
    reglas: destino.reglas,
    atestada: false,
  };
  if (alternativas.length > 0) resultado.alternativas = alternativas;
  return resultado;
};

const generarFragmentoOrigen = (
  frase: FraseIR
): TraduccionGenerada | null => {
  if (!frase.origen) return null;
  const origen = renderOrigen(frase.origen, false);
  if (!origen) return null;
  const alternativas: AlternativaGenerada[] = origen.sustituciones.map(
    (sustitucion) => ({
      gup: capitalizar(
        origen.tokens
          .map((token) => reemplazarEnParte(token, sustitucion.de, sustitucion.a))
          .join(" ")
      ),
      nota: sustitucion.nota,
    })
  );
  if (origen.tokens.length === 2) {
    alternativas.push({
      gup: capitalizar([origen.tokens[1], origen.tokens[0]].join(" ")),
      nota: "orden alternativo de las partes",
    });
  }
  const resultado: TraduccionGenerada = {
    gup: capitalizar(origen.tokens.join(" ")),
    reglas: origen.reglas,
    atestada: false,
  };
  if (alternativas.length > 0) resultado.alternativas = alternativas;
  return resultado;
};

const moverDemAlPoseedor = (
  item:
    | {
        demostrativo?: DemostrativoIR;
        posesivoDemostrativo?: DemostrativoIR;
        posesivoNombre?: string;
        posesivoSustantivo?: string;
      }
    | null
    | undefined
): void => {
  if (!item) return;
  if (
    item.demostrativo &&
    !item.posesivoDemostrativo &&
    (item.posesivoNombre || item.posesivoSustantivo)
  ) {
    item.posesivoDemostrativo = item.demostrativo;
    item.demostrativo = undefined;
  }
};

const moverDemAlDueno = (
  item:
    | {
        demostrativo?: DemostrativoIR;
        duenoDemostrativo?: DemostrativoIR;
        duenoNombre?: string;
        duenoSustantivo?: string;
      }
    | null
    | undefined
): void => {
  if (!item) return;
  if (
    item.demostrativo &&
    !item.duenoDemostrativo &&
    (item.duenoNombre || item.duenoSustantivo)
  ) {
    item.duenoDemostrativo = item.demostrativo;
    item.demostrativo = undefined;
  }
};

const aplicarMomento = (
  resultado: TraduccionGenerada,
  momento: NonNullable<FraseIR["momento"]>
): TraduccionGenerada => {
  const minuscular = (gup: string): string =>
    gup.charAt(0).toLowerCase() + gup.slice(1);
  if (momento === "para_ahora") {
    const transformar = (gup: string): string => {
      const signo = gup.endsWith("!") || gup.endsWith("?") ? gup.slice(-1) : "";
      const cuerpo = signo ? gup.slice(0, -1) : gup;
      return `${cuerpo} dhiyaku bala${signo}`;
    };
    return {
      ...resultado,
      gup: transformar(resultado.gup),
      alternativas: resultado.alternativas?.map((alternativa) => ({
        ...alternativa,
        gup: transformar(alternativa.gup),
      })),
    };
  }
  const prefijo = momento === "ahora" ? "Dhuwala bala" : "Ga ŋunhi";
  const transformar = (gup: string): string =>
    `${prefijo} ${minuscular(gup)}`;
  const extras: AlternativaGenerada[] =
    momento === "ahora"
      ? [
          {
            gup: `Dhiyaŋu bala ${minuscular(resultado.gup)}`,
            nota: "dhiyaŋu bala: lit. 'en este (día)' (lección 59)",
          },
        ]
      : ["ŋunhiyi", "ŋuliŋuru", "ŋuliŋuruyi", "ŋunhiŋuru", "ŋunhiŋuruyi", "beŋuru", "beŋuruyi"].map(
          (forma) => ({
            gup: `Ga ${forma} ${minuscular(resultado.gup)}`,
            nota: "otra forma de 'entonces' (lección 59)",
          })
        );
  return {
    ...resultado,
    gup: transformar(resultado.gup),
    alternativas: [
      ...extras,
      ...(resultado.alternativas ?? []).map((alternativa) => ({
        ...alternativa,
        gup: transformar(alternativa.gup),
      })),
    ],
  };
};

const aplicarManera = (
  resultado: TraduccionGenerada,
  frase: FraseIR
): TraduccionGenerada => {
  const manera = frase.manera;
  if (!manera) return resultado;
  if (frase.predicado.tipo === "adjetivo") {
    if (manera !== "mirithirri") return resultado;
    return {
      ...resultado,
      gup: `${resultado.gup} mirithirri`,
      reglas: [...resultado.reglas, { leccion: 74, regla: "mirithirri-adjective" }],
      alternativas: resultado.alternativas?.map((alternativa) => ({
        ...alternativa,
        gup: `${alternativa.gup} mirithirri`,
      })),
    };
  }
  const libroManera =
    verbosPorLema(manera)[0] ?? verboLibroPorClave(manera) ?? null;
  const libroPrincipal = verboLibroPorClave(frase.predicado.clave);
  if (!libroManera || !libroPrincipal) return resultado;
  const transformar = (
    gup: string,
    alFrente: boolean
  ): string | null => {
    const signo = /[!?]$/.test(gup) ? gup.slice(-1) : "";
    const cuerpo = signo ? gup.slice(0, -1) : gup;
    const tokens = cuerpo.split(" ").filter(Boolean);
    for (let indice = 0; indice < tokens.length; indice++) {
      const limpio = tokens[indice].toLowerCase();
      const propia = identificarForma(limpio).find(
        (identificada) => identificada.verbo.lemma === libroPrincipal.lemma
      );
      if (!propia) continue;
      const formaElegida =
        frase.modo === "imperativa" && propia.forma === "I"
          ? "II"
          : propia.forma;
      const formaManera = formaAtestada(libroManera, formaElegida)[0];
      if (!formaManera) return null;
      const nuevos = [...tokens];
      if (alFrente) {
        nuevos.splice(indice, 0, formaManera);
        if (indice === 0) {
          nuevos[1] = nuevos[1].charAt(0).toLowerCase() + nuevos[1].slice(1);
          nuevos[0] = capitalizar(nuevos[0]);
        }
      } else {
        nuevos.splice(indice + 1, 0, formaManera);
      }
      return `${nuevos.join(" ")}${signo}`;
    }
    return null;
  };
  const gupNuevo = transformar(resultado.gup, false);
  if (!gupNuevo) return resultado;
  const alternativasNuevas: AlternativaGenerada[] = [];
  const alFrente = transformar(resultado.gup, true);
  if (alFrente) {
    alternativasNuevas.push({
      gup: alFrente,
      nota: "orden alternativo: el adverbio verbal delante (lección 74)",
    });
  }
  if (manera === "warrpam'thun") {
    const libroKuma = verbosPorLema("warrpam'kuma")[0];
    if (libroKuma) {
      const conKuma = resultado.gup;
      const transformadoKuma = ((): string | null => {
        const signo = /[!?]$/.test(conKuma) ? conKuma.slice(-1) : "";
        const cuerpo = signo ? conKuma.slice(0, -1) : conKuma;
        const tokens = cuerpo.split(" ").filter(Boolean);
        for (let indice = 0; indice < tokens.length; indice++) {
          const propia = identificarForma(tokens[indice].toLowerCase()).find(
            (identificada) => identificada.verbo.lemma === libroPrincipal.lemma
          );
          if (!propia) continue;
          const formaKuma = formaAtestada(libroKuma, propia.forma)[0];
          if (!formaKuma) return null;
          const nuevos = [...tokens];
          nuevos.splice(indice + 1, 0, formaKuma);
          return `${nuevos.join(" ")}${signo}`;
        }
        return null;
      })();
      if (transformadoKuma) {
        alternativasNuevas.push({
          gup: transformadoKuma,
          nota: "con warrpam'kuma (transitivo) o bukmakkuma (lección 74)",
        });
      }
    }
  }
  return {
    ...resultado,
    gup: gupNuevo,
    reglas: [...resultado.reglas, { leccion: 74, regla: "verb-as-manner-adverb" }],
    alternativas: [
      ...alternativasNuevas,
      ...(resultado.alternativas ?? []).map((alternativa) => ({
        ...alternativa,
        gup: transformar(alternativa.gup, false) ?? alternativa.gup,
      })),
    ],
  };
};

const formasReflexivas = (
  claveVerbo: string
): { lema: string; formas: Record<"I" | "II" | "III" | "IV", string> } | null => {
  const entrada = VOCAB.verbos.find(
    (candidato) => candidato.clave === claveVerbo
  );
  if (!entrada?.lema) return null;
  const candidatos = verbosPorLema(entrada.lema);
  if (candidatos.length === 0) return null;
  const verbo = candidatos[0];
  if (verbo.group === 1) return null;
  const base =
    verbo.group === 5 || verbo.group === 6
      ? formaAtestada(verbo, "I")[0]
      : formaAtestada(verbo, "IV")[0];
  if (!base) return null;
  const atestado = verbosPorLema(`${base}mirri`);
  if (atestado.length > 0) {
    const primeraAtestada = formaAtestada(atestado[0], "I")[0];
    const segundaAtestada = formaAtestada(atestado[0], "II")[0];
    const terceraAtestada = formaAtestada(atestado[0], "III")[0];
    const cuartaAtestada = formaAtestada(atestado[0], "IV")[0];
    if (
      primeraAtestada &&
      segundaAtestada &&
      terceraAtestada &&
      cuartaAtestada
    ) {
      return {
        lema: entrada.lema,
        formas: {
          I: primeraAtestada,
          II: segundaAtestada,
          III: terceraAtestada,
          IV: cuartaAtestada,
        },
      };
    }
  }
  return {
    lema: entrada.lema,
    formas: {
      I: `${base}mirri`,
      II: `${base}mirri`,
      III: `${base}mina`,
      IV: `${base}minya`,
    },
  };
};

const aplicarReflexivoVerbal = (
  resultado: TraduccionGenerada,
  frase: FraseIR
): TraduccionGenerada => {
  if (
    frase.objeto?.reflexivo !== true ||
    frase.objeto.persona === undefined ||
    frase.predicado.tipo !== "verbo" ||
    frase.modo !== "declarativa"
  ) {
    return resultado;
  }
  const persona = frase.objeto.persona;
  const pronombre = frase.sujeto?.persona
    ? VOCAB.pronombres[frase.sujeto.persona]
    : VOCAB.pronombres[persona];
  const tokenObjeto = formaObjetoEnfatico(persona);
  const conFinal = (texto: string, extra: string): string => {
    const fin =
      texto.endsWith("!") || texto.endsWith("?") ? texto.slice(-1) : "";
    const cuerpo = fin ? texto.slice(0, -1) : texto;
    return `${cuerpo} ${extra}${fin}`;
  };
  const originalGup = resultado.gup;
  const alternativasBase = resultado.alternativas ?? [];
  const conPronombreSolo = (): TraduccionGenerada => ({
    ...resultado,
    alternativas: [
      ...alternativasBase,
      {
        gup: conFinal(originalGup, pronombre),
        nota: "reflexivo + sujeto repetido (más énfasis)",
      },
    ],
  });
  if (frase.sujeto && frase.sujeto.persona === undefined) {
    return conPronombreSolo();
  }
  const reflexivo = formasReflexivas(frase.predicado.clave);
  if (!reflexivo) return conPronombreSolo();
  const transformar = (gup: string): string | null => {
    const fin = gup.endsWith("!") || gup.endsWith("?") ? gup.slice(-1) : "";
    const cuerpo = fin ? gup.slice(0, -1) : gup;
    const tokens = cuerpo.split(" ");
    let indiceVerbo = -1;
    let forma: "I" | "II" | "III" | "IV" | null = null;
    for (let indice = 0; indice < tokens.length; indice++) {
      const identificado = identificarForma(tokens[indice].toLowerCase()).find(
        (identificada) => identificada.verbo.lemma === reflexivo.lema
      );
      if (identificado) {
        indiceVerbo = indice;
        forma = identificado.forma;
        break;
      }
    }
    if (indiceVerbo < 0 || forma === null) return null;
    const nuevos: string[] = [];
    for (let indice = 0; indice < tokens.length; indice++) {
      if (indice === indiceVerbo) {
        nuevos.push(reflexivo.formas[forma]);
      } else if (tokens[indice].toLowerCase() === tokenObjeto.toLowerCase()) {
        continue;
      } else {
        nuevos.push(tokens[indice]);
      }
    }
    return `${nuevos.join(" ")}${fin}`;
  };
  const reflexivoGup = transformar(originalGup);
  if (!reflexivoGup) return conPronombreSolo();
  const alternativas: AlternativaGenerada[] = [];
  for (const alternativa of alternativasBase) {
    const transformada = transformar(alternativa.gup);
    alternativas.push(
      transformada ? { ...alternativa, gup: transformada } : alternativa
    );
  }
  alternativas.push(
    { gup: originalGup, nota: "con el pronombre reflexivo explícito: a sí mismo/a" },
    {
      gup: conFinal(originalGup, pronombre),
      nota: "reflexivo + sujeto repetido (más énfasis)",
    },
    {
      gup: conFinal(reflexivoGup, `${pronombre}pi`),
      nota: "verbo reflexivo + él/ella mismo/a",
    },
    {
      gup: conFinal(reflexivoGup, `${tokenObjeto} ${pronombre}`),
      nota: "verbo reflexivo + a sí mismo (doble marca)",
    }
  );
  return {
    ...resultado,
    gup: reflexivoGup,
    reglas: [
      ...resultado.reglas,
      { leccion: 79, regla: "reflexive-verbs-mirri" },
    ],
    alternativas,
  };
};

const aplicarEnfasisDhi = (
  resultado: TraduccionGenerada,
  frase: FraseIR
): TraduccionGenerada => {
  if (frase.enfasisDhi !== true) return resultado;
  const NASALES_OCLUSIVAS = new Set(["m", "n", "ṉ", "ŋ", "p", "t", "ṯ", "k"]);
  const buscarObjetivo = (tokens: string[]): number => {
    if (frase.adverbio === "again") {
      const indiceBulu = tokens.findIndex(
        (token) => token.toLowerCase() === "bulu"
      );
      if (indiceBulu >= 0) return indiceBulu;
    }
    if (frase.predicado.tipo === "verbo") {
      const entradaVerbo = VOCAB.verbos.find(
        (candidato) => candidato.clave === frase.predicado.clave
      );
      if (entradaVerbo) {
        for (let indice = 0; indice < tokens.length; indice++) {
          const identificado = identificarForma(
            tokens[indice].toLowerCase()
          ).find((candidata) => candidata.verbo.lemma === entradaVerbo.lema);
          if (identificado) return indice;
        }
      }
      return -1;
    }
    const palabraPredicado = buscarPalabra(
      frase.predicado.clave,
      frase.predicado.tipo === "adjetivo" ? "adjetivo" : "sustantivo"
    );
    if (!palabraPredicado) return -1;
    for (let indice = tokens.length - 1; indice >= 0; indice--) {
      if (tokens[indice].toLowerCase() === palabraPredicado.gup.toLowerCase()) {
        return indice;
      }
    }
    return -1;
  };
  const transformar = (
    gup: string
  ): { principal: string; alterna: string } | null => {
    const fin = gup.endsWith("!") || gup.endsWith("?") ? gup.slice(-1) : "";
    const cuerpo = fin ? gup.slice(0, -1) : gup;
    const tokens = cuerpo.split(" ");
    const indice = buscarObjetivo(tokens);
    if (indice < 0) return null;
    const base = tokens[indice];
    const consonanteFinal =
      NASALES_OCLUSIVAS.has(base.charAt(base.length - 1)) ||
      base.endsWith("ny");
    const conSufijo = (sufijo: string): string => {
      const nuevos = [...tokens];
      nuevos[indice] = `${base}${sufijo}`;
      return `${nuevos.join(" ")}${fin}`;
    };
    return consonanteFinal
      ? { principal: conSufijo("dhi"), alterna: conSufijo("yi") }
      : { principal: conSufijo("yi"), alterna: conSufijo("dhi") };
  };
  const transformado = transformar(resultado.gup);
  if (!transformado) return resultado;
  const alternativas = (resultado.alternativas ?? []).map((alternativa) => {
    const alterna = transformar(alternativa.gup);
    return alterna ? { ...alternativa, gup: alterna.principal } : alternativa;
  });
  alternativas.push({
    gup: transformado.alterna,
    nota: "tras nasales y oclusivas se usa -dhi; en Yirrkala solo -yi",
  });
  return {
    ...resultado,
    gup: transformado.principal,
    reglas: [
      ...resultado.reglas,
      { leccion: 84, regla: "emphasis-dhi-yi" },
    ],
    alternativas,
  };
};

const aplicarPlural = (
  resultado: TraduccionGenerada,
  frase: FraseIR
): TraduccionGenerada => {
  const alternativas = [...(resultado.alternativas ?? [])];
  let cambio = false;
  const fin =
    resultado.gup.endsWith("!") || resultado.gup.endsWith("?")
      ? resultado.gup.slice(-1)
      : "";
  const cuerpoGup = fin ? resultado.gup.slice(0, -1) : resultado.gup;
  const tokensGup = cuerpoGup.split(" ");
  const nodos = [
    frase.sujeto,
    frase.objeto,
    frase.destino,
    frase.origen,
    frase.lugar,
  ];
  const OCLUSIVAS_FINALES = new Set(["k", "p", "t", "ṯ"]);
  for (const nodo of nodos) {
    if (!nodo || nodo.plural !== true || nodo.sustantivo === undefined) {
      continue;
    }
    const cosa = buscarPalabra(nodo.sustantivo, "sustantivo");
    if (!cosa || cosa.plural === true) continue;
    const indice = tokensGup.findIndex((token) =>
      token.toLowerCase().startsWith(cosa.gup.toLowerCase())
    );
    if (indice < 0) continue;
    const sufijo = tokensGup[indice].slice(cosa.gup.length);
    const tokenMala = sufijo.length > 0 ? `malaŋu${sufijo}` : "mala";
    const conMala = [...tokensGup];
    conMala.splice(indice + 1, 0, tokenMala);
    alternativas.push({
      gup: `${conMala.join(" ")}${fin}`,
      nota: "mala marca el plural, con el infijo -ŋu- ante sufijo (lección 83-E)",
    });
    cambio = true;
    if (cosa.persona === true && (sufijo === "" || sufijo === "nha")) {
      const ultima = cosa.gup.charAt(cosa.gup.length - 1);
      const baseWurru = OCLUSIVAS_FINALES.has(ultima)
        ? `${cosa.gup}urruwurru`
        : `${cosa.gup}wurru`;
      const conWurru = [...tokensGup];
      const tokenOriginal = tokensGup[indice];
      const nuevoWurru = `${baseWurru}${sufijo}`;
      conWurru[indice] =
        tokenOriginal.charAt(0) === tokenOriginal.charAt(0).toUpperCase()
          ? `${nuevoWurru.charAt(0).toUpperCase()}${nuevoWurru.slice(1)}`
          : nuevoWurru;
      alternativas.push({
        gup: `${conWurru.join(" ")}${fin}`,
        nota: "-wurru marca el plural (lección 83-F)",
      });
    }
  }
  const contextoPlural = (nodo?: {
    plural?: boolean;
    sustantivo?: string;
  }): boolean =>
    nodo?.plural === true ||
    (nodo?.sustantivo !== undefined &&
      buscarPalabra(nodo.sustantivo, "sustantivo")?.plural === true);
  if (
    frase.predicado.tipo === "verbo" &&
    (contextoPlural(frase.sujeto ?? undefined) || contextoPlural(frase.objeto))
  ) {
    const entradaVerbo = VOCAB.verbos.find(
      (candidato) => candidato.clave === frase.predicado.clave
    );
    const verboLibro = entradaVerbo
      ? verbosPorLema(entradaVerbo.lema)[0]
      : undefined;
    const verboPlural = verboLibro ? pluralesDe(verboLibro)[0] : undefined;
    if (verboPlural && entradaVerbo) {
      for (let indice = 0; indice < tokensGup.length; indice++) {
        const identificado = identificarForma(
          tokensGup[indice].toLowerCase()
        ).find(
          (candidata) => candidata.verbo.lemma === entradaVerbo.lema
        );
        if (!identificado) continue;
        const formaPlural = formaAtestada(verboPlural, identificado.forma)[0];
        if (!formaPlural) break;
        const conPlural = [...tokensGup];
        conPlural[indice] = formaPlural;
        alternativas.push({
          gup: `${conPlural.join(" ")}${fin}`,
          nota: `verbo plural ${verboPlural.lemma} (lección 83-A)`,
        });
        cambio = true;
        break;
      }
    }
  }
  if (!cambio) return resultado;
  return {
    ...resultado,
    reglas: [
      ...resultado.reglas,
      { leccion: 83, regla: "plural-formation" },
    ],
    alternativas,
  };
};

const aplicarAccionNuru = (
  resultado: TraduccionGenerada,
  frase: FraseIR
): TraduccionGenerada => {
  if (!frase.accionNuru) return resultado;
  const entradaAccion = VOCAB.verbos.find(
    (candidato) => candidato.clave === frase.accionNuru
  );
  if (!entradaAccion) return resultado;
  const candidatos = verbosPorLema(entradaAccion.lema);
  if (candidatos.length === 0) return resultado;
  const corta = formaAtestada(candidatos[0], "IV")[0];
  if (!corta) return resultado;
  const larga = formaAtestada(candidatos[0], "IV")[1];
  const tokenAccion = `${corta}ŋuru`;
  const tokensCola: string[] = [];
  if (frase.objetoNuru) {
    const cosaNuru = buscarPalabra(frase.objetoNuru, "sustantivo");
    if (cosaNuru) tokensCola.push(`${cosaNuru.gup}ŋuru`);
  }
  tokensCola.push(tokenAccion);
  const cola = tokensCola.join(" ");
  const gup = `${resultado.gup} ${cola}`;
  const alternativas = (resultado.alternativas ?? []).map((alternativa) => ({
    ...alternativa,
    gup: `${alternativa.gup} ${cola}`,
  }));
  if (larga) {
    alternativas.push({
      gup: gup.replace(tokenAccion, `${larga}ŋuru`),
      nota: "Yirrkala: la cuaternaria larga + -ŋuru (nota, lección 82-J)",
    });
  }
  return {
    ...resultado,
    gup,
    reglas: [
      ...resultado.reglas,
      { leccion: 82, regla: "verb-behaviour-nuru" },
    ],
    ...(alternativas.length > 0 ? { alternativas } : {}),
  };
};

const aplicarPosesivoReflexivo = (
  resultado: TraduccionGenerada,
  frase: FraseIR
): TraduccionGenerada => {
  const objetoReflexivo =
    frase.objeto?.posesivoReflexivo === true && frase.objeto.posesivo
      ? frase.objeto.posesivo
      : null;
  const destinoReflexivo =
    frase.destino?.posesivoReflexivo === true && frase.destino.posesivo
      ? frase.destino.posesivo
      : null;
  if (!objetoReflexivo && !destinoReflexivo) return resultado;
  const persona = frase.sujeto?.persona ?? (frase.sujeto ? "3sg" : null);
  const pronombre = persona ? VOCAB.pronombres[persona] : null;
  const conFinal = (texto: string, extra: string): string => {
    const fin =
      texto.endsWith("!") || texto.endsWith("?") ? texto.slice(-1) : "";
    const cuerpo = fin ? texto.slice(0, -1) : texto;
    return `${cuerpo} ${extra}${fin}`;
  };
  let gup = resultado.gup;
  let alternativas = [...(resultado.alternativas ?? [])];
  if (objetoReflexivo) {
    const token = enfatizarPosesivo(objetoReflexivo);
    const mover = (texto: string): string => {
      const fin =
        texto.endsWith("!") || texto.endsWith("?") ? texto.slice(-1) : "";
      const cuerpo = fin ? texto.slice(0, -1) : texto;
      const tokens = cuerpo.split(" ");
      const indice = tokens.findIndex(
        (candidato) => candidato.toLowerCase() === token.toLowerCase()
      );
      if (indice < 0 || indice === tokens.length - 1) return texto;
      tokens.splice(indice, 1);
      return `${tokens.join(" ")} ${token}${fin}`;
    };
    gup = mover(gup);
    alternativas = alternativas.map((alternativa) => ({
      ...alternativa,
      gup: mover(alternativa.gup),
    }));
    if (pronombre) {
      alternativas.push({
        gup: conFinal(gup, pronombre),
        nota: "con el pronombre reflexivo explícito (notas 1 y 3, lección 77)",
      });
      if (objetoReflexivo === "1sg") {
        alternativas.push({
          gup: conFinal(gup.replace(token, "ŋarraku"), "rra"),
          nota: "abreviado ŋarraku rra (nota, lección 77)",
        });
      }
    }
  }
  if (destinoReflexivo && pronombre) {
    const tokenDestino = enfatizarComitativo(
      VOCAB.comitativos[destinoReflexivo]
    );
    if (gup.includes(tokenDestino)) {
      alternativas.push({
        gup: gup.replace(tokenDestino, `${tokenDestino} ${pronombre}`),
        nota: "con el pronombre reflexivo explícito (nota 1, lección 77)",
      });
    }
  }
  return {
    ...resultado,
    gup,
    ...(alternativas.length > 0 ? { alternativas } : {}),
  };
};

const aplicarEnfasisSujeto = (
  resultado: TraduccionGenerada,
  frase: FraseIR
): TraduccionGenerada => {
  if (!frase.sujeto?.persona || frase.sujeto.enfatico !== true) {
    return resultado;
  }
  const base = VOCAB.pronombres[frase.sujeto.persona];
  const reemplazarToken = (
    gup: string,
    de: string,
    a: string
  ): string => {
    const tokens = gup.split(" ");
    const indice = tokens.findIndex(
      (token) => token.toLowerCase() === de.toLowerCase()
    );
    if (indice < 0) return gup;
    const original = tokens[indice];
    tokens[indice] =
      original.charAt(0) === original.charAt(0).toUpperCase() &&
      original.charAt(0) !== original.charAt(0).toLowerCase()
        ? `${a.charAt(0).toUpperCase()}${a.slice(1)}`
        : a;
    return tokens.join(" ");
  };
  const enfatizar = (gup: string): string =>
    reemplazarToken(gup, base, `${base}pi`);
  const gup = enfatizar(resultado.gup);
  if (gup === resultado.gup) return resultado;
  const alternativas = (resultado.alternativas ?? []).map((alternativa) => ({
    ...alternativa,
    gup: enfatizar(alternativa.gup),
  }));
  const variante = VOCAB.variantes.find((candidato) => candidato.gup === base);
  for (const forma of variante?.formas ?? []) {
    const conVariante = reemplazarToken(gup, `${base}pi`, `${forma.forma}pi`);
    if (conVariante !== gup) {
      alternativas.push({ gup: conVariante, nota: forma.nota });
    }
  }
  return {
    ...resultado,
    gup,
    reglas: [
      ...resultado.reglas,
      { leccion: 75, regla: "emphasised-pronouns-pi" },
    ],
    ...(alternativas.length > 0 ? { alternativas } : {}),
  };
};

const generar = (frase: FraseIR): TraduccionGenerada | null => {
  moverDemAlPoseedor(frase.sujeto);
  moverDemAlPoseedor(frase.objeto);
  moverDemAlPoseedor(frase.objetoIndirecto);
  moverDemAlPoseedor(frase.destino);
  moverDemAlPoseedor(frase.origen);
  moverDemAlPoseedor(frase.lugar);
  moverDemAlPoseedor(frase.instrumento);
  moverDemAlPoseedor(frase.proposito);
  moverDemAlDueno(frase.predicado);
  for (const complemento of frase.predicado.complementos ?? []) {
    moverDemAlDueno(complemento);
  }
  const resultado =
    frase.modo === "interrogativa" && !frase.entonacion
      ? (frase.inminente || frase.modal || frase.bili) &&
        frase.predicado.tipo === "verbo"
        ? generarVerbal(frase)
        : generarInterrogativa(frase)
      : frase.modo === "imperativa"
        ? generarImperativa(frase)
        : frase.predicado.tipo === "agente"
          ? generarFragmentoAgente(frase)
          : frase.predicado.tipo === "lugar"
            ? generarFragmentoLugar(frase)
            : frase.predicado.tipo === "comitativo"
              ? generarFragmentoComitativo(frase)
              : frase.predicado.tipo === "destino"
                ? generarFragmentoDestino(frase)
                : frase.predicado.tipo === "origen"
                  ? frase.sujeto
                    ? generarDeclarativa(frase)
                    : generarFragmentoOrigen(frase)
                  : generarDeclarativa(frase);
  if (!resultado) return null;
  let conVariantes = aplicarVariantes(
    aplicarPosesivoReflexivo(
      aplicarEnfasisSujeto(
        aplicarEnfasisDhi(
          aplicarPlural(
            aplicarAccionNuru(aplicarReflexivoVerbal(resultado, frase), frase),
            frase
          ),
          frase
        ),
        frase
      ),
      frase
    )
  );
  if (frase.manera) {
    conVariantes = aplicarManera(conVariantes, frase);
  }
  if (frase.habitual?.diario) {
    let formaBitjan = "bitjan";
    const entradaHabitual =
      frase.predicado.tipo === "verbo"
        ? VOCAB.verbos.find(
            (candidato) => candidato.clave === frase.predicado.clave
          )
        : undefined;
    const libroHabitual = entradaHabitual
      ? verbosPorLema(entradaHabitual.lema)[0]
      : undefined;
    const libroBitjan = verbosPorLema("bitjan")[0];
    if (libroHabitual && libroBitjan) {
      const cuerpoHabitual = conVariantes.gup.replace(/[!?]$/, "");
      for (const token of cuerpoHabitual.split(" ")) {
        const identificado = identificarForma(token.toLowerCase()).find(
          (candidata) => candidata.verbo.lemma === libroHabitual.lemma
        );
        if (!identificado) continue;
        const formaElegida =
          frase.modo === "imperativa" && identificado.forma === "I"
            ? "II"
            : identificado.forma;
        formaBitjan =
          formaAtestada(libroBitjan, formaElegida)[0] ?? "bitjan";
        break;
      }
    }
    const conCola = (gup: string): string => {
      const fin = gup.endsWith("!") || gup.endsWith("?") ? gup.slice(-1) : "";
      const cuerpo = fin ? gup.slice(0, -1) : gup;
      return `${cuerpo} ${formaBitjan} bili${fin}`;
    };
    conVariantes = {
      ...conVariantes,
      gup: conCola(conVariantes.gup),
      alternativas: [
        {
          gup: conCola(`${conVariantes.gup.replace(/[!?]$/, "")} yäna`),
          nota: "con yäna, palabra frecuente sin equivalente (nota 3, lección 62; nota 1, lección 89)",
        },
        {
          gup: (() => {
            const finMunha = /[!?]$/.exec(conVariantes.gup)?.[0] ?? "";
            const cuerpoMunha = finMunha
              ? conVariantes.gup.slice(0, -1)
              : conVariantes.gup;
            return `${cuerpoMunha} munhamandhirri${finMunha}`;
          })(),
          nota: "munha + -mandhirri = cada día (lección 81-F)",
        },
        {
          gup: (() => {
            const finMunha = /[!?]$/.exec(conVariantes.gup)?.[0] ?? "";
            const cuerpoMunha = finMunha
              ? conVariantes.gup.slice(0, -1)
              : conVariantes.gup;
            return `${cuerpoMunha} munhawatjthirri${finMunha}`;
          })(),
          nota: "también -watjthirri",
        },
        ...(conVariantes.alternativas ?? []).map((alternativa) => ({
          ...alternativa,
          gup: conCola(alternativa.gup),
        })),
      ],
    };
  }
  if (
    frase.modo === "interrogativa" &&
    (frase.inminente || frase.modal || frase.bili || frase.entonacion)
  ) {
    const preguntar = (gup: string): string =>
      gup.endsWith("?") ? gup : `${gup}?`;
    conVariantes = {
      ...conVariantes,
      gup: preguntar(conVariantes.gup),
      alternativas: conVariantes.alternativas?.map((alternativa) => ({
        ...alternativa,
        gup: preguntar(alternativa.gup),
      })),
    };
  }
  let conMomento = frase.momento
    ? aplicarMomento(conVariantes, frase.momento)
    : conVariantes;
  if (frase.balanyaNuru === true) {
    const anteponerBalanya = (gup: string): string =>
      `Balanyaŋuru ${gup.charAt(0).toLowerCase()}${gup.slice(1)}`;
    conMomento = {
      ...conMomento,
      gup: anteponerBalanya(conMomento.gup),
      reglas: [
        ...conMomento.reglas,
        { leccion: 88, regla: "balanya-nhakuna" },
      ],
      alternativas: [
        ...(conMomento.alternativas ?? []).map((alternativa) => ({
          ...alternativa,
          gup: anteponerBalanya(alternativa.gup),
        })),
        {
          gup: conMomento.gup.replace(
            /^Balanyaŋuru /,
            ""
          ).length > 0
            ? `Balanyarawadhi ${conMomento.gup.charAt(0).toLowerCase()}${conMomento.gup.slice(1)}`
            : conMomento.gup,
          nota: "balanyarawadhi: por eso, con matiz de propósito",
        },
      ],
    };
  }
  if (frase.muka === true) {
    const conMuka = (gup: string): string => {
      const cuerpoMuka = gup.replace(/[?]$/, "");
      return `${cuerpoMuka} muka?`;
    };
    conMomento = {
      ...conMomento,
      gup: conMuka(conMomento.gup),
      reglas: [
        ...conMomento.reglas,
        { leccion: 90, regla: "asking-questions" },
      ],
      alternativas: [
        ...(conMomento.alternativas ?? []).map((alternativa) => ({
          ...alternativa,
          gup: conMuka(alternativa.gup),
        })),
        {
          gup: `Muka ${conMomento.gup.replace(/[?]$/, "").charAt(0).toLowerCase()}${conMomento.gup.replace(/[?]$/, "").slice(1)}?`,
          nota: "muka al inicio, mismo sentido: ¿verdad que...?",
        },
      ],
    };
  }
  if (frase.bili === true) {
    const anteponerBili = (gup: string): string => {
      const nombrePropio =
        frase.sujeto?.nombre !== undefined &&
        gup.startsWith(frase.sujeto.nombre);
      const cuerpo = nombrePropio
        ? gup
        : `${gup.charAt(0).toLowerCase()}${gup.slice(1)}`;
      return `Bili ${cuerpo}`;
    };
    conMomento = {
      ...conMomento,
      gup: anteponerBili(conMomento.gup),
      reglas: [
        ...conMomento.reglas,
        { leccion: 85, regla: "completive-bili" },
      ],
      alternativas: conMomento.alternativas?.map((alternativa) => ({
        ...alternativa,
        gup: anteponerBili(alternativa.gup),
      })),
    };
  }
  if (frase.yanapi !== undefined) {
    const entradaYanapi =
      frase.predicado.tipo === "verbo"
        ? VOCAB.verbos.find(
            (candidato) => candidato.clave === frase.predicado.clave
          )
        : undefined;
    const libroYanapi = entradaYanapi
      ? verbosPorLema(entradaYanapi.lema)[0]
      : undefined;
    const objetivoYanapi = frase.yanapi.forma;
    const transformarYanapi = (gup: string): string => {
      let cuerpo = gup;
      if (frase.yanapi?.sinDem === true) {
        cuerpo = cuerpo.replace(/^Dhuwala(na)? /, "");
      }
      if (libroYanapi && objetivoYanapi) {
        const tokens = cuerpo.split(" ");
        for (let indice = 0; indice < tokens.length; indice++) {
          const identificado = identificarForma(
            tokens[indice].toLowerCase()
          ).find(
            (identificada) => identificada.verbo.lemma === libroYanapi.lemma
          );
          if (identificado) {
            const nueva = formaAtestada(libroYanapi, objetivoYanapi)[0];
            if (nueva) {
              tokens[indice] =
                objetivoYanapi === "II" ? `bili ${nueva}` : nueva;
            }
            break;
          }
        }
        cuerpo = tokens.join(" ");
      }
      const nombrePropio =
        frase.sujeto?.nombre !== undefined &&
        cuerpo.startsWith(frase.sujeto.nombre);
      const cola = nombrePropio
        ? cuerpo
        : `${cuerpo.charAt(0).toLowerCase()}${cuerpo.slice(1)}`;
      if (frase.yanapi?.tipo === "pregunta") {
        const conPrefijo = `Yuwalk yanapi ${cola}`;
        return conPrefijo.endsWith("?") ? conPrefijo : `${conPrefijo}?`;
      }
      return `Yanapi ${cola}`;
    };
    conMomento = {
      ...conMomento,
      gup: transformarYanapi(conMomento.gup),
      reglas: [...conMomento.reglas, { leccion: 91, regla: "yanapi" }],
      alternativas: [
        ...(conMomento.alternativas ?? []).map((alternativa) => ({
          ...alternativa,
          gup: transformarYanapi(alternativa.gup),
        })),
        ...(frase.yanapi.tipo === "pregunta"
          ? [
              {
                gup: transformarYanapi(conMomento.gup).replace(
                  /^Yuwalk yanapi /,
                  "Yanapi "
                ),
                nota: "sin yuwalk, mismo sentido: ¿es cierto que...?",
              },
            ]
          : []),
      ],
    };
  }
  if (frase.regreso !== undefined) {
    const libroRegreso = verbosPorLema("roŋiyirri")[0];
    const verboRegreso = libroRegreso
      ? formaAtestada(libroRegreso, "III")[0]
      : undefined;
    const colaConVerbo = verboRegreso
      ? ` ga ḏutj ${verboRegreso}`
      : " ga ḏutj";
    const colaSinVerbo = " ga ḏutj";
    const colaPrincipal =
      frase.regreso.otraVez === true ? colaSinVerbo : colaConVerbo;
    const colaSecundaria =
      frase.regreso.otraVez === true ? colaConVerbo : colaSinVerbo;
    const conColaRegreso = (gup: string, cola: string): string => {
      const fin =
        gup.endsWith("!") || gup.endsWith("?") || gup.endsWith(".")
          ? gup.slice(-1)
          : "";
      const cuerpo = fin ? gup.slice(0, -1) : gup;
      return `${cuerpo}${cola}${fin}`;
    };
    conMomento = {
      ...conMomento,
      gup: conColaRegreso(conMomento.gup, colaPrincipal),
      reglas: [...conMomento.reglas, { leccion: 92, regla: "interjecciones" }],
      alternativas: [
        ...(conMomento.alternativas ?? []).map((alternativa) => ({
          ...alternativa,
          gup: conColaRegreso(alternativa.gup, colaPrincipal),
        })),
        {
          gup: conColaRegreso(conMomento.gup, colaSecundaria),
          nota:
            frase.regreso.otraVez === true
              ? "con el verbo regresar explícito"
              : "ḏutj solo — la interjección ya significa regresó",
        },
        {
          gup: conColaRegreso(
            conMomento.gup,
            colaPrincipal.replace("ḏutj", "ḏitj")
          ),
          nota: "ḏitj: variante de ḏutj (de regreso)",
        },
      ],
    };
  }
  conMomento = aplicarLecturasDePersona(conMomento, frase);
  if (
    frase.modo === "imperativa" &&
    frase.predicado.tipo === "verbo" &&
    VOCAB.interjecciones?.[frase.predicado.clave] !== undefined
  ) {
    const interjecciones = VOCAB.interjecciones[frase.predicado.clave];
    const intj = interjecciones[0];
    const conInterjeccion = (gup: string, cual: string): string => {
      const fin = gup.endsWith("!") ? "!" : "";
      const cuerpo = fin ? gup.slice(0, -1) : gup;
      const decap = `${cuerpo.charAt(0).toLowerCase()}${cuerpo.slice(1)}`;
      return `${capitalizar(cual)}nha ${decap}${fin}`;
    };
    const base = conInterjeccion(conMomento.gup, intj);
    const cuerpoBase = base.endsWith("!") ? base.slice(0, -1) : base;
    const terminaVocal = /[aiueoäo]$/.test(cuerpoBase);
    conMomento = {
      ...conMomento,
      reglas: [...conMomento.reglas, { leccion: 92, regla: "interjecciones" }],
      alternativas: [
        ...(conMomento.alternativas ?? []),
        { gup: base, nota: "con la interjección expresiva del verbo (le da fuerza)" },
        ...(terminaVocal
          ? [
              {
                gup: `${cuerpoBase}na${base.endsWith("!") ? "!" : ""}`,
                nota: "interjección + mandato con -na final",
              },
            ]
          : []),
        ...(interjecciones.length > 1
          ? [
              {
                gup: conInterjeccion(conMomento.gup, interjecciones[1]),
                nota: "la otra interjección del mismo verbo",
              },
            ]
          : []),
      ],
    };
  }
  return conMomento;
};

const useGenerador = () => ({ generar });

export { generar, aplicarVariantes };

export default useGenerador;
