import traducciones from "../../marnggithinyawuy/book/traducciones.json";
import traduccionesGlosas from "../../marnggithinyawuy/book/traducciones_glosas.json";

const CAMPOS = [
  "español",
  "português",
  "français",
  "türkiye",
  "magyar",
  "українська",
  "عربي",
  "עברית",
  "فارسی",
  "יידיש",
  "日本語",
  "gàidhlig (albannach)",
] as const;

type Campo = (typeof CAMPOS)[number];

type Traduccion = Partial<Record<Campo, string>>;

const TRADUCCIONES = traducciones as Record<string, Traduccion>;
const TRADUCCIONES_GLOSAS = traduccionesGlosas as Record<string, Traduccion>;

const normalizar = (texto: string): string =>
  texto
    .toLowerCase()
    .replace(/ŋ/g, "ng")
    .replace(/ä/g, "a")
    .replace(/ḏ/g, "d")
    .replace(/ṯ/g, "t")
    .replace(/ḻ/g, "l")
    .replace(/ṉ/g, "n")
    .replace(/['’]/g, "");

const construirPorGlosa = (): Map<string, Traduccion> => {
  const mapa = new Map<string, Traduccion>();
  for (const [clave, valores] of Object.entries(TRADUCCIONES)) {
    const glosa = clave.split("|")[0].trim().toLowerCase();
    if (glosa && !mapa.has(glosa)) mapa.set(glosa, valores);
  }
  for (const [clave, valores] of Object.entries(TRADUCCIONES_GLOSAS)) {
    mapa.set(clave.trim().toLowerCase(), valores);
  }
  return mapa;
};

const POR_GLOSA = construirPorGlosa();

const buscarGlosa = (glosa: string): Traduccion | undefined =>
  TRADUCCIONES_GLOSAS[glosa.trim()] ?? POR_GLOSA.get(glosa.trim().toLowerCase());

const PLURAL = /\b(Vtr|Vin|Vref)-pl\b|\(pl\.?\)|\bpl\.?$/g;
const SUFIJO = /\s*\/\s*-[^\s/]+(\s*\([^)]*\))?\s*$/;
const NOTA_FINAL = /\s*\(([^()]*)\)\s*$/;

const anotar = (traduccion: Traduccion, nota: string): Traduccion => {
  const anotada: Traduccion = {};
  for (const campo of CAMPOS) {
    const base = traduccion[campo];
    if (base) anotada[campo] = `${base} (${nota})`;
  }
  return anotada;
};

const traduccionDeGlosa = (glosa: string): Traduccion | undefined => {
  const directa = buscarGlosa(glosa);
  if (directa) return directa;
  const limpia = glosa.trim();
  if (PLURAL.test(limpia)) {
    PLURAL.lastIndex = 0;
    const sinPlural = limpia.replace(PLURAL, "").replace(/\s{2,}/g, " ").replace(/[,\s]+$/, "").trim();
    PLURAL.lastIndex = 0;
    const base = sinPlural && buscarGlosa(sinPlural);
    if (base) return anotar(base, "pl");
  }
  PLURAL.lastIndex = 0;
  const sufijo = limpia.match(SUFIJO);
  if (sufijo) {
    const raiz = limpia.replace(SUFIJO, "").trim();
    const base = raiz && traduccionDeGlosa(raiz);
    if (base) return anotar(base, sufijo[0].replace(/^\s*\/\s*/, "").trim());
  }
  const nota = limpia.match(NOTA_FINAL);
  if (nota) {
    const raiz = limpia.replace(NOTA_FINAL, "").trim();
    const base = raiz && buscarGlosa(raiz);
    if (base) return anotar(base, nota[1].trim());
  }
  return undefined;
};

const primeraPalabra = (texto: string): string =>
  texto
    .trim()
    .split(/[\s,/(]/)[0]
    .replace(/^['"?!]+|['"?!]+$/g, "");

const agregar = (actual: string, valor: string): string => {
  if (!valor) return actual;
  if (!actual) return valor;
  if (normalizar(actual).includes(normalizar(valor))) return actual;
  return `${actual} / ${valor}`;
};

type Puntero = { id: string; destino: string; nota: string };

const resolverPunteros = <T extends { translations: Record<string, string> }>(
  porId: Map<string, T>,
  punteros: Puntero[]
): void => {
  const candidatos = (destino: string): { id: string; nota: string }[] => {
    const lista = [{ id: destino, nota: "" }];
    if (destino.endsWith("nhamirri")) {
      lista.push({ id: `${destino.slice(0, -8)}ma`, nota: "reflexivo" });
    }
    if (destino.endsWith("mirri")) {
      lista.push({ id: destino.slice(0, -5), nota: "reflexivo" });
    }
    if (destino.endsWith("marama")) {
      lista.push({ id: `${destino.slice(0, -6)}thun`, nota: "causativo" });
    }
    return lista;
  };
  for (let ronda = 0; ronda < 4; ronda++) {
    let cambios = 0;
    for (const puntero of punteros) {
      const origen = porId.get(puntero.id);
      if (!origen || origen.translations["español"]) continue;
      for (const candidato of candidatos(puntero.destino)) {
        const destino = porId.get(candidato.id);
        if (!destino || destino === origen || !destino.translations["español"]) continue;
        const notas = [candidato.id, candidato.nota, puntero.nota].filter(Boolean).join(", ");
        for (const campo of CAMPOS) {
          const base = destino.translations[campo];
          if (!base || origen.translations[campo]) continue;
          origen.translations[campo] = `${base} (${notas})`;
        }
        cambios++;
        break;
      }
    }
    if (!cambios) break;
  }
};

export { CAMPOS, normalizar, traduccionDeGlosa, primeraPalabra, agregar, resolverPunteros };
export type { Campo, Traduccion, Puntero };
