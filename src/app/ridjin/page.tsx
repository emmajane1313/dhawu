"use client";

import { useState } from "react";
import Return from "@/app/components/modules/Return";
import { IDIOMAS } from "@/app/lib/constantes";
import { LanguageMode } from "../components/types/components.type";
import { translate, TranslationResult } from "./traductor";
import { LANG_CONFIG } from "./traductor/constants";

export default function Ridjin() {
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [idioma, setIdioma] = useState<LanguageMode>("es");

  const handleTranslate = () => {
    if (!inputText.trim() || loading) return;

    setError("");
    setLoading(true);

    try {
      const res = translate(inputText, idioma);
      setResult(res);
    } catch (e) {
      console.error("Error:", e);
      setError("Error al traducir");
      setResult(null);
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
                {LANG_CONFIG[idioma].disclaimerNote}
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

          {result && (
            <div className="relative w-full flex flex-col gap-4">
              {result.combinations?.map((combo, idx: number) => (
                <div
                  key={idx}
                  className="relative w-full flex flex-col gap-3 p-4 border border-amarillo rounded-md font-neueL bg-oscuro/50"
                >
                  <div className="relative w-full flex flex-col gap-1">
                    <div className="text-amarillo text-xs uppercase tracking-wide">
                      {result.hasAmbiguity
                        ? `${LANG_CONFIG[idioma].option} ${idx + 1}`
                        : LANG_CONFIG[idioma].trad}
                    </div>
                    <div className="text-white text-xl">
                      {combo.output || ""}
                    </div>
                  </div>
                  <div className="relative w-full h-px bg-white/10"></div>
                  <div className="relative w-full flex flex-col gap-1">
                    <div className="text-white/50 text-xs uppercase tracking-wide">
                      {LANG_CONFIG[idioma].desglose}
                    </div>
                    <div className="relative w-full flex flex-col gap-2">
                      {combo.parts?.map((part, pIdx: number) => (
                        <div
                          key={pIdx}
                          className="relative flex flex-row flex-wrap gap-3 gap-0.5 p-2"
                        >
                          <div className="text-white text-sm">{part.gup}</div>
                          <div className="text-white/30 text-xs">
                            {part.source}
                          </div>
                          <div className="text-amarillo/70 text-xs">
                            {part.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
