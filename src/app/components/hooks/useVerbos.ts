import libro from "../../ridjin/traductor/book/verbs.json";
import {
  FormaVerbal,
  VerboLibro,
  FormaIdentificada,
  LibroVerbos,
} from "../types/ridjin.type";

const LIBRO = libro as unknown as LibroVerbos;

const FORMAS: FormaVerbal[] = ["I", "II", "III", "IV"];

const normalizarGloss = (texto: string): string =>
  texto
    .toLowerCase()
    .replace(/[(),!?".;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const anotar = <T>(mapa: Map<string, T[]>, clave: string, valor: T): void => {
  const lista = mapa.get(clave);
  if (lista) {
    lista.push(valor);
  } else {
    mapa.set(clave, [valor]);
  }
};

const POR_LEMA = new Map<string, VerboLibro[]>();
const POR_FORMA = new Map<string, FormaIdentificada[]>();
const POR_GLOSS_EXACTO = new Map<string, VerboLibro[]>();
const POR_GLOSS_PALABRA = new Map<string, VerboLibro[]>();

for (const verbo of LIBRO.verbs) {
  anotar(POR_LEMA, verbo.lemma, verbo);

  for (const forma of FORMAS) {
    for (const palabra of verbo.forms[forma] ?? []) {
      anotar(POR_FORMA, palabra, { verbo, forma });
    }
  }

  const gloss = normalizarGloss(verbo.gloss);
  anotar(POR_GLOSS_EXACTO, gloss, verbo);

  for (const palabra of gloss.split(" ")) {
    if (palabra) {
      anotar(POR_GLOSS_PALABRA, palabra, verbo);
    }
  }
}

const verbosPorLema = (lema: string): VerboLibro[] => POR_LEMA.get(lema) ?? [];

const identificarForma = (palabra: string): FormaIdentificada[] =>
  POR_FORMA.get(palabra) ?? [];

const verbosPorGloss = (texto: string): VerboLibro[] => {
  const consulta = normalizarGloss(texto);
  const exactos = POR_GLOSS_EXACTO.get(consulta);
  if (exactos) return exactos;
  return POR_GLOSS_PALABRA.get(consulta) ?? [];
};

const formaAtestada = (verbo: VerboLibro, forma: FormaVerbal): string[] =>
  verbo.forms[forma] ?? [];

const pluralesDe = (verbo: VerboLibro): VerboLibro[] =>
  LIBRO.verbs.filter((candidato) => candidato.pluralOf == verbo.lemma);

const singularDe = (verbo: VerboLibro): VerboLibro[] =>
  verbo.pluralOf ? verbosPorLema(verbo.pluralOf) : [];

const particulaAspecto = (forma: FormaVerbal): string =>
  LIBRO.aspectParticle.forms[forma][0];

const useVerbos = () => ({
  LIBRO,
  FORMAS,
  verbosPorLema,
  identificarForma,
  verbosPorGloss,
  formaAtestada,
  pluralesDe,
  singularDe,
  particulaAspecto,
});

export {
  LIBRO,
  FORMAS,
  verbosPorLema,
  identificarForma,
  verbosPorGloss,
  formaAtestada,
  pluralesDe,
  singularDe,
  particulaAspecto,
};

export default useVerbos;
