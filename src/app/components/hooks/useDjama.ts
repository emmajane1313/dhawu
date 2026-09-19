import { useState } from "react";
import { DjamaEntry } from "../types/components.type";
import { LibroVerbos, VerboLibro } from "../types/ridjin.type";
import djama from "./../../../../public/djama.json";
import verbosLibro from "../../ridjin/traductor/book/verbs.json";
import {
  CAMPOS,
  Puntero,
  agregar,
  normalizar,
  primeraPalabra,
  resolverPunteros,
  traduccionDeGlosa,
} from "./useGlosas";

const LIBRO_VERBOS = verbosLibro as unknown as LibroVerbos;
const MANUALES = djama as DjamaEntry[];

const vacias = (): DjamaEntry["translations"] => ({
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
});

const formas = (verbo: VerboLibro, forma: "I" | "II" | "III" | "IV"): string =>
  (verbo.forms[forma] ?? []).join(" / ");

const glosaCompleta = (verbo: VerboLibro): string =>
  verbo.particle?.length
    ? `${verbo.gloss} (${verbo.particle.join(", ")})`
    : verbo.gloss;

const construir = (): DjamaEntry[] => {
  const porId = new Map<string, DjamaEntry>();
  const punteros: Puntero[] = [];

  for (const verbo of LIBRO_VERBOS.verbs) {
    const entrada: DjamaEntry = {
      id: verbo.lemma,
      grupo: verbo.group,
      primera: formas(verbo, "I"),
      secundaria: formas(verbo, "II"),
      tercera: formas(verbo, "III"),
      quarta: formas(verbo, "IV"),
      vtr: verbo.valence.includes("Vtr"),
      vin: verbo.valence.includes("Vin"),
      translations: vacias(),
    };
    entrada.translations.english = glosaCompleta(verbo);
    const extra = traduccionDeGlosa(verbo.gloss);
    if (extra) {
      for (const campo of CAMPOS) {
        entrada.translations[campo] = extra[campo] ?? "";
      }
    } else {
      const destino = verbo.pluralOf ?? primeraPalabra(verbo.gloss);
      punteros.push({
        id: verbo.lemma,
        destino,
        nota: verbo.gloss.replace(destino, "").replace(/^[\s,()]+|[\s,()]+$/g, "").trim(),
      });
    }
    const previa = porId.get(verbo.lemma);
    if (previa) {
      for (const campo of ["primera", "secundaria", "tercera", "quarta"] as const) {
        previa[campo] = agregar(previa[campo], entrada[campo]);
      }
      previa.vtr = previa.vtr || entrada.vtr;
      previa.vin = previa.vin || entrada.vin;
      for (const campo of ["english", ...CAMPOS] as const) {
        previa.translations[campo] = agregar(
          previa.translations[campo],
          entrada.translations[campo]
        );
      }
    } else {
      porId.set(verbo.lemma, entrada);
    }
  }

  resolverPunteros(porId, punteros);

  for (const manual of MANUALES) {
    const clave = manual.id.replace(/\s*\(plural\)\s*$/, "").replace(/\?+$/, "").trim();
    const entrada = porId.get(manual.id) ?? porId.get(clave);
    if (!entrada) {
      const nueva: DjamaEntry = { ...manual, translations: { ...manual.translations } };
      const partes = manual.translations.english
        .split(" / ")
        .map((parte) => parte.replace(/^to\s+/, "").trim())
        .filter(Boolean);
      for (const parte of partes) {
        const extra = traduccionDeGlosa(parte);
        if (!extra) continue;
        for (const campo of CAMPOS) {
          nueva.translations[campo] = agregar(nueva.translations[campo], extra[campo] ?? "");
        }
      }
      if (/\(plural\)/.test(manual.id)) {
        for (const campo of CAMPOS) {
          if (nueva.translations[campo] && !/\(pl\)/.test(nueva.translations[campo])) {
            nueva.translations[campo] = `${nueva.translations[campo]} (pl)`;
          }
        }
      }
      porId.set(manual.id, nueva);
      continue;
    }
    for (const campo of ["english", ...CAMPOS] as const) {
      if (manual.translations[campo]) {
        entrada.translations[campo] = agregar(
          manual.translations[campo],
          entrada.translations[campo]
        );
      }
    }
  }

  return Array.from(porId.values()).sort((a, b) => a.id.localeCompare(b.id));
};

const ENTRADAS = construir();

const INDICE = ENTRADAS.map((entrada) =>
  normalizar(
    [
      entrada.id,
      entrada.primera,
      entrada.secundaria,
      entrada.tercera,
      entrada.quarta,
      ...Object.values(entrada.translations),
    ].join(" ")
  )
);

const PASO = 60;

const useDjama = () => {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<DjamaEntry[]>(ENTRADAS);
  const [limite, setLimite] = useState(PASO);

  const mostrarMas = () => setLimite((previo) => previo + PASO);

  const handleSearch = (value: string) => {
    setSearch(value);
    setLimite(PASO);
    const consulta = normalizar(value.trim());
    if (!consulta) {
      setFiltered(ENTRADAS);
      return;
    }
    const resultados: DjamaEntry[] = [];
    for (let i = 0; i < ENTRADAS.length; i++) {
      if (INDICE[i].includes(consulta)) resultados.push(ENTRADAS[i]);
    }
    setFiltered(resultados);
  };

  const downloadJsonFromUrl = () => {
    try {
      const blob = new Blob([JSON.stringify(ENTRADAS, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: "djäma",
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.log("[djama descarga]", error);
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

export { ENTRADAS };

export default useDjama;
