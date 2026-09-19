import { useState } from "react";
import { DictionaryEntry, WordlistEntry } from "../types/components.type";
import { FormaVerbal, LibroVerbos, Vocabulario } from "../types/ridjin.type";
import data from "./../../../../public/dictionary.json";
import lista from "../../marnggithinyawuy/book/wordlist.json";
import traducciones from "../../marnggithinyawuy/book/traducciones.json";
import listaGup from "../../marnggithinyawuy/book/guplist.json";
import tipos from "../../marnggithinyawuy/book/tipos.json";
import verbosLibro from "../../ridjin/traductor/book/verbs.json";
import vocabularioLecciones from "../../ridjin/traductor/book/vocabulario.json";
import {
  CAMPOS,
  Campo,
  Puntero,
  agregar,
  normalizar,
  primeraPalabra,
  resolverPunteros,
  traduccionDeGlosa,
} from "./useGlosas";

const TRADUCCIONES = traducciones as Record<
  string,
  Partial<Record<Campo, string>>
>;

const LIBRO_VERBOS = verbosLibro as unknown as LibroVerbos;
const VOCAB_LECCIONES = vocabularioLecciones as unknown as Vocabulario;
const TIPOS_MANUALES = tipos as Record<string, string>;

const FORMAS_VERBALES: FormaVerbal[] = ["I", "II", "III", "IV"];

const etiquetaValencia = (valencia: string[]): string => {
  if (valencia.some((v) => v.startsWith("Vref"))) return "verbo reflexivo";
  if (valencia.includes("Vtr")) return "verbo transitivo";
  if (valencia.includes("Vin")) return "verbo intransitivo";
  return "verbo";
};

const tipoDeGram = (gram?: string): string | undefined => {
  if (!gram) return undefined;
  if (gram.startsWith("Vpart")) return "partícula verbal";
  if (gram.startsWith("Vref")) return "verbo reflexivo";
  if (gram.startsWith("Vtr")) return "verbo transitivo";
  if (gram.startsWith("Vin")) return "verbo intransitivo";
  if (gram.startsWith("V")) return "verbo";
  return undefined;
};

const construirTipos = (): Map<string, string> => {
  const mapa = new Map<string, string>();
  for (const verbo of LIBRO_VERBOS.verbs) {
    const etiqueta = etiquetaValencia(verbo.valence);
    if (!mapa.has(verbo.lemma)) mapa.set(verbo.lemma, etiqueta);
    for (const forma of FORMAS_VERBALES) {
      for (const palabra of verbo.forms[forma] ?? []) {
        if (!mapa.has(palabra)) mapa.set(palabra, etiqueta);
      }
    }
  }
  for (const palabra of VOCAB_LECCIONES.palabras) {
    mapa.set(palabra.gup, palabra.tipo);
  }
  for (const [gup, tipo] of Object.entries(TIPOS_MANUALES)) {
    mapa.set(gup, tipo);
  }
  return mapa;
};

const TIPOS = construirTipos();

const construir = (): DictionaryEntry[] => {
  const porId = new Map<string, DictionaryEntry>();
  const punteros: Puntero[] = [];

  for (const antigua of data as DictionaryEntry[]) {
    porId.set(antigua.id, {
      ...antigua,
      translations: { ...antigua.translations },
    });
  }

  for (const entrada of lista.entries as unknown as WordlistEntry[]) {
    const significado = entrada.q ? `${entrada.en} (${entrada.q})` : entrada.en;
    const clave = `${entrada.en}|${entrada.q ?? ""}`;
    const extra = TRADUCCIONES[clave];

    for (const palabra of entrada.gup) {
      let entradaDiccionario = porId.get(palabra);

      if (!entradaDiccionario) {
        entradaDiccionario = {
          id: palabra,
          translations: {
            djambarrpuyŋu: "-",
            español: "",
            english: "",
            عربي: "",
            עברית: "",
            فارسی: "",
            יידיש: "",
            português: "",
            français: "",
            türkiye: "",
            日本語: "",
            magyar: "",
            українська: "",
            "gàidhlig (albannach)": "",
          },
        };
        porId.set(palabra, entradaDiccionario);
      }

      entradaDiccionario.translations.english = agregar(
        entradaDiccionario.translations.english,
        significado
      );

      if (extra) {
        for (const campo of CAMPOS) {
          entradaDiccionario.translations[campo] = agregar(
            entradaDiccionario.translations[campo],
            extra[campo] ?? ""
          );
        }
      }
    }
  }

  for (const entrada of listaGup.entries as unknown as {
    gup: string;
    en: string;
    gram?: string;
    page: number;
  }[]) {
    let entradaDiccionario = porId.get(entrada.gup);

    if (!entradaDiccionario) {
      entradaDiccionario = {
        id: entrada.gup,
        translations: {
          djambarrpuyŋu: "-",
          español: "",
          english: "",
          عربي: "",
          עברית: "",
          فارسی: "",
          יידיש: "",
          português: "",
          français: "",
          türkiye: "",
          日本語: "",
          magyar: "",
          українська: "",
          "gàidhlig (albannach)": "",
        },
      };
      porId.set(entrada.gup, entradaDiccionario);
    }

    const significado = entrada.gram
      ? `${entrada.en} (${entrada.gram})`
      : entrada.en;

    entradaDiccionario.translations.english = agregar(
      entradaDiccionario.translations.english,
      significado
    );

    const extra = traduccionDeGlosa(entrada.en);
    if (extra) {
      for (const campo of CAMPOS) {
        entradaDiccionario.translations[campo] = agregar(
          entradaDiccionario.translations[campo],
          extra[campo] ?? ""
        );
      }
    } else {
      punteros.push({
        id: entrada.gup,
        destino: primeraPalabra(entrada.en),
        nota: entrada.gram ?? "",
      });
    }

    const tipoGram = tipoDeGram(entrada.gram);
    if (tipoGram && !TIPOS.has(entrada.gup)) {
      TIPOS.set(entrada.gup, tipoGram);
    }
  }

  resolverPunteros(porId, punteros);

  for (const entrada of porId.values()) {
    const tipo = TIPOS.get(entrada.id);
    if (tipo) entrada.tipo = tipo;
  }

  return Array.from(porId.values()).sort((a, b) => a.id.localeCompare(b.id));
};

const DICCIONARIO = construir();

const INDICE = DICCIONARIO.map((entry) =>
  normalizar(
    [entry.id, entry.tipo ?? "", ...Object.values(entry.translations)].join(
      " "
    )
  )
);

const PASO = 60;

const useMarng = () => {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<DictionaryEntry[]>(DICCIONARIO);
  const [limite, setLimite] = useState(PASO);

  const handleSearch = (value: string) => {
    setSearch(value);
    setLimite(PASO);

    const consulta = normalizar(value.trim());

    if (consulta == "") {
      setFiltered(DICCIONARIO);
      return;
    }

    const resultados: DictionaryEntry[] = [];
    for (let i = 0; i < DICCIONARIO.length; i++) {
      if (INDICE[i].includes(consulta)) {
        resultados.push(DICCIONARIO[i]);
      }
    }

    setFiltered(resultados);
  };

  const mostrarMas = () => setLimite((previo) => previo + PASO);

  const downloadJsonFromUrl = () => {
    try {
      const blob = new Blob([JSON.stringify(DICCIONARIO, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: "dictionary",
      });

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading JSON:", error);
    }
  };

  return {
    search,
    handleSearch,
    filtered,
    limite,
    mostrarMas,
    downloadJsonFromUrl,
  };
};

export { DICCIONARIO };

export default useMarng;
