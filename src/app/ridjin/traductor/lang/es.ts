import { LanguagePack } from "../core/types";

const tokenize = (input: string) =>
  input
    .replace(/,/g, " , ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const normalize = (token: string) => {
  const trimmed = token.trim().toLowerCase();
  if (trimmed === ",") return ",";
  return trimmed.replace(/^[,]+|[,]+$/g, "");
};

export const ES_PACK: LanguagePack = {
  id: "es",
  displayName: "Espanol",
  tokenize,
  normalize,
  dualMarkers: ["dos", "2", "ambos", "ambas"],
  emphasisMarkers: [
    "mismo",
    "misma",
    "mismos",
    "mismas",
    "propio",
    "propia",
    "propios",
    "propias",
  ],
  conjunctions: ["y", "e", ","],
  otherGroupPatterns: [
    ["los", "demás"],
    ["las", "demás"],
    ["los", "demas"],
    ["las", "demas"],
    ["los", "otros"],
    ["las", "otras"],
    ["los", "otros", "dos"],
    ["las", "otras", "dos"],
    ["los", "dos", "otros"],
    ["las", "dos", "otras"],
  ],
  pronounTriggers: {
    yo: "1_Sing",
    tú: "2_Sing",
    él: "3_Sing",
    ella: "3_Sing",
    ello: "3_Sing",
    usted: "3_Sing",
    nosotros: "1+2_Plur",
    nosotras: "1+2_Plur",
    vosotros: "2_Plur",
    vosotras: "2_Plur",
    ellos: "3_Plur",
    ellas: "3_Plur",
    ustedes: "2_Plur",
  },
  ui: {
    option: "Opcion",
    trad: "Traduccion",
    desglose: "Desglose",
    disclaimerNote:
      "Ojo: este diccionario aun esta en desarrollo. Con el tiempo continuara mejorandose. Las entradas en castellano estan verificadas. El ingles y otros idiomas se anadiran gradualmente. Y tambien, nota que el orden de las palabras en una frase de Gupapuyngu no esta fijo, se puede colocar la palabra que se quiere enfatizar primero.",
  },
};
