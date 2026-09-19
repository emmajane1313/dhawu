"use client";

import { useState } from "react";
import Return from "@/app/components/modules/Return";
import Altavoz from "@/app/components/modules/Altavoz";
import { IDIOMAS } from "@/app/lib/constantes";
import { LanguageMode } from "../components/types/components.type";
import { traducir } from "../components/hooks/useRidjin";
import { reproducir } from "../components/hooks/useVoz";
import {
  GlosaPalabra,
  IdiomaFuente,
  TraduccionGenerada,
} from "../components/types/ridjin.type";

const ETIQUETAS: Record<
  LanguageMode,
  { trad: string; nota: string; sinCobertura: string }
> = {
  es: {
    trad: "Traduccion",
    nota: "Ojo: este traductor se esta reconstruyendo desde el libro de gramatica, leccion por leccion. Solo traduce lo que las reglas ya ensenadas cubren. El orden de las palabras en Gupapuyŋu no es fijo, la palabra que se quiere enfatizar puede ir primero.",
    sinCobertura:
      "Esta frase todavia no esta cubierta por las lecciones del libro.",
  },
  en: {
    trad: "Translation",
    nota: "Note: this translator is being rebuilt from the grammar book, lesson by lesson. It only translates what the rules taught so far cover. Word order in Gupapuyŋu is not fixed, the word you want to emphasize can be placed first.",
    sinCobertura: "This sentence is not covered by the book lessons yet.",
  },
};

function Desglose({
  abierto,
  onToggle,
}: {
  abierto: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`relative w-5 h-5 flex items-center justify-center rounded-md border text-xs cursor-point ${
        abierto
          ? "border-amarillo text-oscuro bg-amarillo"
          : "border-white/30 text-white/50"
      }`}
    >
      {abierto ? "▴" : "▾"}
    </div>
  );
}

function DesglosePanel({
  desglose,
  idioma,
}: {
  desglose: GlosaPalabra[];
  idioma: LanguageMode;
}) {
  return (
    <div className="relative w-full flex flex-row flex-wrap gap-2 pt-1">
      {desglose.map((palabra, pIdx) => (
        <div
          key={pIdx}
          className="relative w-fit flex flex-col gap-1 p-2 border border-white/20 rounded-md bg-oscuro"
        >
          <div
            onClick={() => reproducir(palabra.palabra)}
            className="relative w-fit flex text-amarillo text-sm cursor-point"
          >
            {palabra.palabra}
          </div>
          <div className="relative w-fit flex flex-col gap-px">
            {palabra.partes.map((parte, tIdx) => (
              <div
                key={tIdx}
                className="relative w-fit flex flex-row gap-2 items-baseline"
              >
                <div
                  className={`text-xs ${
                    parte.tipo === "sufijo" ? "text-amarillo/70" : "text-white"
                  }`}
                >
                  {parte.texto}
                </div>
                <div className="text-white/50 text-xs">
                  {idioma === "es" ? parte.es : parte.en}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Ridjin() {
  const [nuevaTraduccion, setNuevaTraduccion] =
    useState<TraduccionGenerada | null>(null);
  const [sinCobertura, setSinCobertura] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [idioma, setIdioma] = useState<LanguageMode>("es");
  const [desglosesAbiertos, setDesglosesAbiertos] = useState<
    Record<number, boolean>
  >({});

  const alternarDesglose = (indice: number) =>
    setDesglosesAbiertos((previos) => ({
      ...previos,
      [indice]: !previos[indice],
    }));

  const handleTranslate = () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;

    setError("");
    setLoading(true);
    setDesglosesAbiertos({});

    try {
      const nueva = traducir(trimmed, idioma as IdiomaFuente);
      setNuevaTraduccion(nueva);
      setSinCobertura(!nueva);
    } catch (e) {
      console.log("[ridjin-error]", e);
      setError("Error al traducir");
      setNuevaTraduccion(null);
      setSinCobertura(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2 overflow-y-scroll">
      <Return
        image={"QmbzcUtYAWxngWxaYbzo5QKUfAvq7nQvZe393ocav22vPw"}
        path="/"
      />
      <div className="relative w-full flex items-center justify-start h-full flex-col gap-4">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-5xl sm:text-7xl font-estilo text-amarillo">
          Ridjin
        </div>
        <div className="relative w-full flex flex-col gap-4 p-4 border border-white rounded-md bg-oscuro overflow-y-scroll">
          <div className="relative w-full flex flex-col gap-3">
            <div className="relative w-full flex flex-col gap-2">
              <div className="text-white text-xs tracking-wide">
                {ETIQUETAS[idioma].nota}
              </div>
              <div className="text-white font-neueL text-xs relative flex flex-row gap-2 w-full h-fit">
                {IDIOMAS.map((id, i) => (
                  <div
                    key={i}
                    className={`relative w-fit items-center justify-center h-fit flex p-px rounded-md cursor-point ${
                      idioma == id
                        ? "text-oscuro bg-amarillo border border-white"
                        : "border border-amarillo"
                    }`}
                    onClick={() => setIdioma(id)}
                  >
                    <div className="relative w-6 h-6 flex items-center justify-center text-center">
                      {id}
                    </div>
                  </div>
                ))}
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTranslate()}
                placeholder="Ej: yo como, I eat..."
                className="relative w-full px-4 py-3 bg-oscuro border border-white/30 rounded-md text-white font-neueL placeholder:text-white/30 focus:border-amarillo outline-none"
              />
              <button
                onClick={handleTranslate}
                disabled={loading}
                className="relative w-full px-4 py-3 bg-white text-oscuro font-neueL rounded-md hover:opacity-80 disabled:opacity-50 cursor-point disabled:cursor-art"
              >
                {loading ? "Traduciendo..." : "Marrtji →"}
              </button>
            </div>
          </div>

          <div className="relative w-full h-px bg-white/20"></div>

          {error && (
            <div className="relative w-full flex flex-col gap-2 p-4 border border-red-500 rounded-md font-neueL bg-oscuro/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {nuevaTraduccion && (
            <div className="relative w-full flex flex-col gap-2 p-4 border border-amarillo rounded-md font-neueL bg-oscuro/50">
              <div className="text-amarillo text-xs uppercase tracking-wide">
                {ETIQUETAS[idioma].trad}
              </div>
              <div className="relative w-full flex flex-row flex-wrap gap-2 items-center">
                <div className="text-white text-2xl">{nuevaTraduccion.gup}</div>
                <Altavoz texto={nuevaTraduccion.gup} />
                {nuevaTraduccion.desglose && (
                  <Desglose
                    abierto={!!desglosesAbiertos[0]}
                    onToggle={() => alternarDesglose(0)}
                  />
                )}
              </div>
              {desglosesAbiertos[0] && nuevaTraduccion.desglose && (
                <DesglosePanel
                  desglose={nuevaTraduccion.desglose}
                  idioma={idioma}
                />
              )}
              {nuevaTraduccion.alternativas?.map((alternativa, aIdx) => (
                <div key={aIdx} className="relative w-full flex flex-col gap-1">
                  <div className="relative w-full flex flex-row flex-wrap gap-2 items-baseline">
                    <div className="text-white/60 text-sm">
                      {alternativa.gup}
                    </div>
                    {alternativa.nota && (
                      <div className="text-amarillo/50 text-xs">
                        {alternativa.nota}
                      </div>
                    )}
                    <Altavoz texto={alternativa.gup} />
                    {alternativa.desglose && (
                      <Desglose
                        abierto={!!desglosesAbiertos[aIdx + 1]}
                        onToggle={() => alternarDesglose(aIdx + 1)}
                      />
                    )}
                  </div>
                  {desglosesAbiertos[aIdx + 1] && alternativa.desglose && (
                    <DesglosePanel
                      desglose={alternativa.desglose}
                      idioma={idioma}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {sinCobertura && !nuevaTraduccion && (
            <div className="relative w-full flex flex-col gap-2 p-4 border border-white/30 rounded-md font-neueL bg-oscuro/50 text-white/60 text-sm">
              {ETIQUETAS[idioma].sinCobertura}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
