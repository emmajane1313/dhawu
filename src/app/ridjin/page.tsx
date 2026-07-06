"use client";

import { useMemo, useState } from "react";
import Return from "@/app/components/modules/Return";
import { IDIOMAS } from "@/app/lib/constantes";
import { LanguageMode } from "../components/types/components.type";
import { translate,  } from "./traductor";
import { LANG_CONFIG } from "./traductor/lang";
import {
  DEV_SAMPLE_ENABLED,
  DEV_SAMPLE_TRIGGER,
  DevSampleSection,
  buildDevSamplesReportChunks,
  getDevSampleAt,
  getDevSampleCount,
  getDevSampleResetSection,
  isDevSampleTrigger,
} from "./traductor/devSamples";
import { TranslationResult } from "./traductor/core/types";

export default function Ridjin() {
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [idioma, setIdioma] = useState<LanguageMode>("es");
  const [openAlternatives, setOpenAlternatives] = useState<
    Record<number, boolean>
  >({});
  const [openPartAlternatives, setOpenPartAlternatives] = useState<
    Record<string, boolean>
  >({});
  const [devSampleIndex, setDevSampleIndex] = useState<
    Record<LanguageMode, number>
  >({
    es: 0,
    en: 0,
  });
  const [devSampleSection, setDevSampleSection] = useState<
    Record<LanguageMode, DevSampleSection>
  >({
    es: "all",
    en: "all",
  });
  const [devCycleActive, setDevCycleActive] = useState(false);
  const [devCurrentSample, setDevCurrentSample] = useState("");

  const handleTranslate = async () => {
    const trimmed = inputText.trim();
    // eslint-disable-next-line no-console
    console.log("[ridjin-debug] handleTranslate", { trimmed, idioma });
    const resetSection = DEV_SAMPLE_ENABLED
      ? getDevSampleResetSection(trimmed)
      : null;
    if (resetSection) {
      setDevSampleIndex((prev) => ({
        ...prev,
        [idioma]: 0,
      }));
      setDevSampleSection((prev) => ({
        ...prev,
        [idioma]: resetSection,
      }));
      setDevCycleActive(false);
      try {
        let savedPath = "";
        const sectionSuffix =
          resetSection && resetSection !== "all" ? `-${resetSection}` : "";
        const filename = `dev-samples-${idioma}${sectionSuffix}.txt`.replace(
          /[^a-z0-9._-]/gi,
          ""
        );
        await buildDevSamplesReportChunks(
          translate,
          idioma,
          resetSection,
          async (chunk, append) => {
            const response = await fetch("/api/dev-samples", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mode: idioma,
                report: chunk,
                append,
                filename,
              }),
            });
            if (!response.ok) {
              let details = "";
              try {
                const data = await response.json();
                if (data?.error) details = ` ${data.error}`;
              } catch {
                try {
                  const text = await response.text();
                  if (text) details = ` ${text}`;
                } catch {
                  // ignore
                }
              }
              throw new Error(`No se pudo guardar el reporte.${details}`);
            }
            const data = await response.json();
            if (data?.path) {
              savedPath = data.path;
            }
          }
        );
        const path = savedPath ? ` ${savedPath}` : "";
        const sectionLabel =
          resetSection === "all" ? "" : ` (${resetSection})`;
        setError(`Dev samples${sectionLabel}: índice reiniciado. Archivo:${path}`);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(`Dev samples: error al guardar el reporte. ${message}`);
      }
      return;
    }
    if ((isDevSampleTrigger(trimmed) || devCycleActive) && DEV_SAMPLE_ENABLED) {
      const currentIndex = devSampleIndex[idioma] ?? 0;
      const section = devSampleSection[idioma] ?? "all";
      const { sample, nextIndex } = getDevSampleAt(
        idioma,
        currentIndex,
        section
      );
      if (!sample) {
        setError("Dev samples vacias.");
        return;
      }
      setDevCycleActive(true);
      setDevCurrentSample(sample);
      setInputText(sample);
      setResult(translate(sample, idioma));
      setError(
        `Dev sample ${currentIndex + 1}/${getDevSampleCount(idioma, section)}`
      );
      setDevSampleIndex((prev) => ({
        ...prev,
        [idioma]: nextIndex,
      }));
      return;
    }
    if (!trimmed || loading) return;

    setError("");
    setLoading(true);

    try {
      const res = translate(trimmed, idioma);
      setResult(res);
    } catch (e) {
      // Surface runtime errors during translation for debugging.
      // eslint-disable-next-line no-console
      console.error("[ridjin-error]", e);
      setError("Error al traducir");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const groupedCombinations = useMemo(() => {
    if (!result?.combinations) return [];

    const groups = new Map<string, TranslationResult["combinations"]>();

    const makeGroupKey = (
      combo: TranslationResult["combinations"][number]
    ) => {
      if (combo.variantGroup?.scope === "dropdown") {
        return `dropdown:${combo.variantGroup.id}`;
      }
      if (combo.variantGroup?.scope === "box") {
        return `box:${combo.variantGroup.id}`;
      }
      return `output:${combo.output}`;
    };

    for (const combo of result.combinations) {
      const key = makeGroupKey(combo);
      const existing = groups.get(key);
      if (existing) {
        existing.push(combo);
      } else {
        groups.set(key, [combo]);
      }
    }

    return Array.from(groups.values()).map((combos) => {
      const primary = combos[0];
      const alternatives = combos
        .slice(1)
        .map((c) => c.output)
        .filter((value, idx, arr) => arr.indexOf(value) === idx);

      return { primary, alternatives, combos };
    });
  }, [result]);

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
                onChange={(e) => {
                  const value = e.target.value;
                  setInputText(value);
                  if (
                    DEV_SAMPLE_ENABLED &&
                    devCycleActive &&
                    value.trim().toLowerCase() !== DEV_SAMPLE_TRIGGER &&
                    value !== devCurrentSample
                  ) {
                    setDevCycleActive(false);
                  }
                }}
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
              {groupedCombinations.map((group, idx: number) => (
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
                    <div className="relative w-full flex items-center gap-2">
                      <div className="text-white text-xl">
                        {group.primary.output || ""}
                      </div>
                      {group.alternatives.length > 0 && (
                        <button
                          type="button"
                          className="text-amarillo text-xs border border-amarillo/60 px-2 py-0.5 rounded-md hover:bg-amarillo/10 cursor-point"
                          onClick={() =>
                            setOpenAlternatives((prev) => ({
                              ...prev,
                              [idx]: !prev[idx],
                            }))
                          }
                        >
                          {openAlternatives[idx] ? "v" : ">"}
                        </button>
                      )}
                    </div>
                    {group.alternatives.length > 0 &&
                      openAlternatives[idx] && (
                        <div className="relative w-full flex flex-col gap-1 pt-2">
                          {group.alternatives.map((alt, altIdx) => (
                            <div
                              key={altIdx}
                              className="text-white/70 text-sm"
                            >
                              {alt}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                  <div className="relative w-full h-px bg-white/10"></div>
                  <div className="relative w-full flex flex-col gap-1">
                    <div className="text-white/50 text-xs uppercase tracking-wide">
                      {LANG_CONFIG[idioma].desglose}
                    </div>
                    <div className="relative w-full flex flex-col gap-2">
                      {group.primary.parts?.map((part, pIdx: number) => {
                        const slotId =
                          part.slotId ?? `${part.type}:${part.source}:${pIdx}`;
                        const slotGups = new Map<string, string | undefined>();
                        for (const combo of group.combos) {
                          const match = combo.parts?.find(
                            (p) =>
                              (p.slotId ?? `${p.type}:${p.source}:${pIdx}`) ===
                              slotId
                          );
                          if (match) {
                            slotGups.set(match.gup, undefined);
                          }
                        }
                        const altFromPart = (part.alternatives ?? []).map(
                          (alt) => ({
                            gup: alt.gup,
                            note: alt.note,
                          })
                        );
                        for (const alt of altFromPart) {
                          slotGups.set(alt.gup, alt.note);
                        }
                        slotGups.delete(part.gup);
                        const slotAltList = Array.from(slotGups.entries()).map(
                          ([gup, note]) => ({ gup, note })
                        );
                        const altKey = `${idx}-${pIdx}`;
                        return (
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
                            {slotAltList.length > 0 && (
                              <div className="relative w-full flex items-center gap-2">
                                <button
                                  type="button"
                                  className="text-amarillo text-xs border border-amarillo/60 px-2 py-0.5 rounded-md hover:bg-amarillo/10 cursor-point"
                                  onClick={() =>
                                    setOpenPartAlternatives((prev) => ({
                                      ...prev,
                                      [altKey]: !prev[altKey],
                                    }))
                                  }
                                >
                                  {openPartAlternatives[altKey] ? "v" : ">"}
                                </button>
                              </div>
                            )}
                            {slotAltList.length > 0 &&
                              openPartAlternatives[altKey] && (
                                <div className="relative w-full flex flex-col gap-1 pl-2">
                                  {slotAltList.map((alt, altIdx) => (
                                    <div
                                      key={altIdx}
                                      className="text-white/60 text-xs"
                                    >
                                      {alt.gup}
                                      {alt.note ? ` — ${alt.note}` : ""}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        );
                      })}
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
