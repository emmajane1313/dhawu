"use client";

import { useEffect, useRef, useState } from "react";
import { IoMdDownload } from "react-icons/io";
import Return from "@/app/components/modules/Return";
import useButhuru from "@/app/components/hooks/useButhuru";
import { useTraduccion } from "@/app/components/hooks/useTraduccion";
import {
  CODIGO_BUTHURU_URL,
  COMANDOS_LOCAL_BUTHURU,
  GUIA_LOCAL_BUTHURU_URL,
  IDIOMAS,
  LOCAL_BUTHURU_URL,
  TEXTOS_BUTHURU,
} from "@/app/lib/constantes";
import { LanguageMode } from "@/app/components/types/components.type";

const reloj = (segundos: number): string => {
  const total = Math.max(0, Math.floor(segundos));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export default function Buthuru() {
  const { traduccion, g } = useTraduccion();
  const [idioma, setIdioma] = useState<LanguageMode>("es");
  const [copiado, setCopiado] = useState("");
  const t = TEXTOS_BUTHURU[idioma];

  useEffect(() => {
    if (traduccion) setIdioma(traduccion);
  }, [traduccion]);
  const entrada = useRef<HTMLInputElement | null>(null);

  const copiar = async (texto: string, clave: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
      window.setTimeout(() => setCopiado((actual) => (actual === clave ? "" : actual)), 1500);
    } catch (error) {
      console.log("[buthuru copiar]", error);
    }
  };
  const {
    fuentes,
    fuente,
    setFuenteActiva,
    subirArchivos,
    quitarFuente,
    recortarFuente,
    fijarTexto,
    etiquetas,
    guardarEtiqueta,
    recortes,
    guardarRecorte,
    corte,
    setCorte,
    anonimo,
    setAnonimo,
    seleccion,
    setSeleccion,
    capturarSeleccion,
    soloIncompletas,
    setSoloIncompletas,
    sonando,
    reproducir,
    ocupado,
    grabando,
    segundosGrabados,
    empezarGrabacion,
    pararGrabacion,
    resumen,
    descargar,
    adjuntosListos,
  } = useButhuru();

  const etiquetasFuente = fuente ? etiquetas[fuente.id] ?? {} : {};
  const trozosVisibles = fuente
    ? fuente.trozos.filter((tr) => !soloIncompletas || !(etiquetasFuente[tr.id] ?? "").trim())
    : [];
  const hechos = fuente ? fuente.trozos.filter((tr) => (etiquetasFuente[tr.id] ?? "").trim()).length : 0;

  const Parametro = ({
    etiqueta,
    valor,
    paso,
    min,
    max,
    onChange,
  }: {
    etiqueta: string;
    valor: number;
    paso: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
  }) => (
    <div className="relative flex flex-col gap-1 text-xxs uppercase tracking-widest text-white/60 min-w-32">
      <div className="relative flex flex-row justify-between gap-2">
        <div className="relative flex">{etiqueta}</div>
        <div className="relative flex text-amarillo">{valor}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="relative w-full"
      />
    </div>
  );

  const Boton = ({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) => (
    <div
      onClick={onClick}
      className={`relative flex px-2 py-1 rounded-md border cursor-point text-xs ${
        activo ? "border-amarillo bg-amarillo text-oscuro" : "border-white/40 text-white/70"
      }`}
    >
      {children}
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2 overflow-hidden">
      <Return src="/images/buthuru-largo.png" path="/wukirri" />

      <div className="relative w-full flex items-center justify-start h-full min-h-0 flex-col gap-4 text-white font-neueL overflow-y-scroll">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-5xl sm:text-7xl font-estilo text-amarillo">
          {g(t.titulo)}
        </div>

        <div className="relative w-full h-fit flex flex-row flex-wrap gap-2 items-center justify-between text-xs">
          <div className="relative w-fit h-fit flex text-sm sm:text-base text-white">{t.lema}</div>
          <div className="relative w-fit h-fit flex flex-row gap-2 items-center">
            {IDIOMAS.map((id) => (
              <div
                key={id}
                onClick={() => setIdioma(id)}
                className={`relative w-6 h-6 flex items-center justify-center rounded-md cursor-point ${
                  idioma === id ? "text-oscuro bg-amarillo border border-white" : "border border-amarillo"
                }`}
              >
                {id}
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full flex flex-col gap-3 text-sm px-1">
          <div className="relative w-full flex">{t.intro}</div>
          <div className="relative w-full flex">{t.aviso}</div>
          <div className="relative w-full flex text-amarillo">{t.privado}</div>
          <div className="relative w-full flex flex-row flex-wrap gap-x-1 text-xs text-white/70">
            <div className="relative flex">{t.verificar}</div>
            <a href={CODIGO_BUTHURU_URL} target="_blank" rel="noreferrer" className="relative flex text-amarillo underline break-all">
              {CODIGO_BUTHURU_URL.replace("https://", "")}
            </a>
          </div>
          <div className="relative w-fit flex flex-row items-center gap-2 text-xxs uppercase tracking-widest text-white/70">
            <div className={`relative w-2 h-2 rounded-full ${adjuntosListos ? "bg-amarillo" : "bg-white/30 animate-pulse"}`}></div>
            {adjuntosListos ? t.sinRed : t.conRed}
          </div>
          <div className="relative w-full flex flex-col gap-2 pt-2">
            <div className="relative w-fit flex text-amarillo">{t.local}</div>
            <div className="relative w-full flex text-xs text-white/70">{t.localAyuda}</div>
            <div className="relative w-full flex flex-col gap-1">
              {t.localPasos.map((paso, indice) => (
                <div key={indice} className="relative w-full flex flex-row gap-2 items-start text-xs text-white/85">
                  <div className="relative w-fit flex text-amarillo">{indice + 1}.</div>
                  <div className="relative w-full flex">{paso}</div>
                </div>
              ))}
            </div>
            <div className="relative w-full flex flex-col gap-1 pl-6">
              {COMANDOS_LOCAL_BUTHURU.map((comando) => (
                <div
                  key={comando}
                  onClick={() => copiar(comando, comando)}
                  title={t.copiar}
                  className="relative w-fit max-w-full flex flex-row items-center gap-3 font-mono text-xs text-white/85 cursor-point hover:text-amarillo"
                >
                  <span className="text-white/40">$</span>
                  <span className="select-text break-all">{comando}</span>
                  <span className="text-xxs uppercase tracking-widest text-white/40">{copiado === comando ? t.copiado : t.copiar}</span>
                </div>
              ))}
              <div
                onClick={() => copiar(COMANDOS_LOCAL_BUTHURU.join("\n"), "todo")}
                className="relative w-fit flex px-2 py-1 mt-1 rounded-md border border-white/30 text-xxs uppercase tracking-widest text-white/70 cursor-point hover:border-amarillo hover:text-amarillo"
              >
                {copiado === "todo" ? t.copiado : t.copiarTodo}
              </div>
            </div>
            <div className="relative w-full flex flex-row flex-wrap gap-x-2 items-center text-xs text-white/70 pl-6">
              <div className="relative flex">{t.localAbrir}</div>
              <div
                onClick={() => copiar(LOCAL_BUTHURU_URL, "url")}
                title={t.copiar}
                className="relative flex flex-row items-center gap-2 font-mono text-amarillo cursor-point"
              >
                <span className="select-text">{LOCAL_BUTHURU_URL}</span>
                <span className="text-xxs uppercase tracking-widest text-white/40">{copiado === "url" ? t.copiado : t.copiar}</span>
              </div>
            </div>
            <div className="relative w-full flex flex-row flex-wrap gap-x-2 items-center text-xs text-white/70 pt-1">
              <div className="relative flex">{t.localGuiaAyuda}</div>
              <a
                href={GUIA_LOCAL_BUTHURU_URL[idioma]}
                download={`buthuru-local-${idioma}.txt`}
                className="relative flex flex-row gap-1 items-center text-amarillo underline"
              >
                <IoMdDownload size={11} />
                {t.localGuia}
              </a>
            </div>
          </div>
        </div>

        <div className="relative w-full flex flex-row flex-wrap items-center justify-between gap-2 border border-white rounded-md bg-oscuro px-3 py-2">
          <div className="relative flex flex-row flex-wrap items-center gap-2">
            <input
              ref={entrada}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.webm"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) subirArchivos(e.target.files);
                e.target.value = "";
              }}
            />
            <div
              onClick={() => entrada.current?.click()}
              className="relative flex px-2 py-1 rounded-md border border-amarillo text-amarillo text-xs cursor-point hover:bg-amarillo hover:text-oscuro"
            >
              {t.subir}
            </div>
            <div
              onClick={() => (grabando ? pararGrabacion() : empezarGrabacion())}
              className={`relative flex flex-row gap-2 items-center px-2 py-1 rounded-md border text-xs cursor-point ${
                grabando ? "border-red bg-red text-white" : "border-amarillo text-amarillo hover:bg-amarillo hover:text-oscuro"
              }`}
            >
              <div className={`relative w-2 h-2 rounded-full ${grabando ? "bg-white animate-pulse" : "bg-amarillo"}`}></div>
              {grabando ? `${t.grabando} ${reloj(segundosGrabados)} · ${t.parar}` : t.grabar}
            </div>
            {ocupado && ocupado !== "zip" && <div className="relative flex text-xs text-white/60">{t.cortando} {ocupado}</div>}
            {fuentes.map((f) => {
              const listos = f.trozos.filter((tr) => (etiquetas[f.id]?.[tr.id] ?? "").trim()).length;
              const activa = fuente?.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setFuenteActiva(f.id)}
                  className={`relative flex flex-row items-center gap-2 px-2 py-1 rounded-md border text-xs cursor-point ${
                    activa ? "border-amarillo bg-amarillo text-oscuro" : "border-white/30 text-white/80"
                  }`}
                >
                  <div className="relative flex">{f.id}</div>
                  <div className={`relative flex ${activa ? "text-oscuro/70" : "text-white/40"}`}>
                    {reloj(f.duracion)} · {listos}/{f.trozos.length}
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      quitarFuente(f.id);
                    }}
                    className={`relative flex ${activa ? "text-oscuro/70" : "text-white/40"} hover:text-red`}
                    title={t.quitar}
                  >
                    ×
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative flex flex-row flex-wrap items-center gap-3 text-xs">
            <Boton activo={soloIncompletas} onClick={() => setSoloIncompletas(!soloIncompletas)}>
              {soloIncompletas ? t.soloIncompletas : t.todas}
            </Boton>
            <Boton activo={anonimo.activo} onClick={() => setAnonimo({ ...anonimo, activo: !anonimo.activo })}>
              {anonimo.activo ? t.anonimoActivo : t.anonimoInactivo}
            </Boton>
            {fuente && (
              <div className="relative flex">
                {fuente.id}: {hechos} / {fuente.trozos.length}
              </div>
            )}
            <div className="relative flex text-amarillo">
              total: {resumen.etiquetados} / {resumen.trozos}
            </div>
          </div>
        </div>

        {fuente ? (
          <div className="relative w-full flex flex-col lg:flex-row gap-3 h-[75vh] shrink-0 overflow-hidden">
            <div className="relative w-full lg:w-1/2 flex flex-col gap-2 border border-white/40 rounded-md bg-oscuro p-3 overflow-y-scroll">
              <div className="relative flex text-xs text-white/50 uppercase tracking-wide">{t.textoFuente} · Ctrl+Espacio</div>
              <textarea
                value={fuente.texto}
                onChange={(e) => fijarTexto(fuente.id, e.target.value)}
                onMouseUp={capturarSeleccion}
                placeholder={t.textoFuenteAyuda}
                className="relative w-full flex-1 min-h-40 bg-transparent text-base leading-relaxed placeholder:text-white/30 outline-none resize-none select-text"
              />
              {seleccion && (
                <div className="relative w-full flex flex-col gap-1 border border-amarillo rounded-md p-2">
                  <div className="relative flex text-xs text-amarillo">{t.usarSeleccion}:</div>
                  <div className="relative flex text-sm">{seleccion}</div>
                  <div onClick={() => setSeleccion("")} className="relative w-fit flex text-xs text-white/50 cursor-point">
                    ×
                  </div>
                </div>
              )}
              <div className="relative w-full flex flex-col gap-2 pt-2 border-t border-white/20">
                <div className="relative flex text-xs text-white/50 uppercase tracking-wide">{t.parametrosCorte}</div>
                <div className="relative w-full flex flex-row flex-wrap gap-4 items-end">
                  <Parametro etiqueta={t.umbral} valor={corte.umbralDb} paso={1} min={-60} max={-10} onChange={(v) => setCorte({ ...corte, umbralDb: v })} />
                  <Parametro etiqueta={t.silencio} valor={corte.silencioMin} paso={0.02} min={0.1} max={1.5} onChange={(v) => setCorte({ ...corte, silencioMin: v })} />
                  <Parametro etiqueta={t.minimo} valor={corte.trozoMin} paso={0.1} min={0.2} max={3} onChange={(v) => setCorte({ ...corte, trozoMin: v })} />
                  <div
                    onClick={() => recortarFuente(fuente.id)}
                    className="relative w-fit flex px-3 py-1 rounded-md border border-amarillo text-amarillo text-xs cursor-point hover:bg-amarillo hover:text-oscuro"
                  >
                    {t.cortar} · {fuente.trozos.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative w-full lg:w-1/2 flex flex-col gap-2 overflow-y-scroll pr-1">
              <div className="relative flex text-xs text-white/50 uppercase tracking-wide shrink-0">{t.etiquetarAyuda}</div>
              {trozosVisibles.map((trozo, indice) => {
                const texto = etiquetasFuente[trozo.id] ?? "";
                const recorte = recortes[fuente.id]?.[trozo.id] ?? { desde: 0, hasta: 0 };
                const inicioReal = trozo.inicio + recorte.desde;
                const finReal = trozo.fin - recorte.hasta;
                return (
                  <div
                    key={trozo.id}
                    className={`relative w-full shrink-0 flex flex-col gap-2 border rounded-md bg-oscuro p-2 ${
                      texto.trim() ? "border-amarillo/60" : "border-white/30"
                    }`}
                  >
                    <div className="relative w-full flex flex-row flex-wrap items-center justify-between gap-2">
                      <div className="relative flex flex-row items-center gap-3 min-w-0">
                        <div className="relative flex text-amarillo text-sm w-6 justify-end shrink-0">{indice + 1}</div>
                        <div
                          onClick={() => reproducir(fuente, trozo.id, "original")}
                          className={`relative w-10 h-8 flex items-center justify-center rounded-md border cursor-point text-sm ${
                            sonando === `original:${trozo.id}` ? "border-amarillo bg-amarillo text-oscuro" : "border-amarillo text-amarillo"
                          }`}
                        >
                          {sonando === `original:${trozo.id}` ? "■" : "▶"}
                        </div>
                        <div
                          onClick={() => reproducir(fuente, trozo.id, "anonimo")}
                          title={t.anonimo}
                          className={`relative w-10 h-8 flex items-center justify-center rounded-md border cursor-point text-sm ${
                            sonando === `anonimo:${trozo.id}` ? "border-white bg-white text-oscuro" : "border-white/50 text-white/70"
                          }`}
                        >
                          {sonando === `anonimo:${trozo.id}` ? "■" : "◈"}
                        </div>
                        <div className="relative flex flex-col leading-tight">
                          <div className="relative flex text-xs text-white/70 font-mono">
                            {reloj(inicioReal)} – {reloj(finReal)}
                          </div>
                          <div className="relative flex text-xxs text-white/40">{(finReal - inicioReal).toFixed(1)} s</div>
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          if (seleccion) {
                            guardarEtiqueta(fuente.id, trozo.id, seleccion);
                            setSeleccion("");
                          }
                        }}
                        className={`relative flex px-2 py-1 rounded-md text-xs cursor-point border ${
                          seleccion ? "border-amarillo text-oscuro bg-amarillo" : "border-white/20 text-white/30"
                        }`}
                      >
                        {t.usarSeleccion}
                      </div>
                    </div>
                    <div className="relative w-full flex flex-row flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/50">
                      <div className="relative flex whitespace-nowrap shrink-0">{t.quitarInicio}</div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={recorte.desde || ""}
                        placeholder="0"
                        onChange={(e) => guardarRecorte(fuente.id, trozo.id, Number(e.target.value.replace(",", ".")) || 0, recorte.hasta)}
                        className={`relative w-12 shrink-0 bg-black border rounded-md px-1 py-0.5 text-xs text-center text-white outline-none ${
                          recorte.desde ? "border-amarillo text-amarillo" : "border-white/20 focus:border-amarillo"
                        }`}
                      />
                      <div className="relative flex shrink-0">s</div>
                      <div className="relative flex whitespace-nowrap shrink-0 pl-2">{t.quitarFinal}</div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={recorte.hasta || ""}
                        placeholder="0"
                        onChange={(e) => guardarRecorte(fuente.id, trozo.id, recorte.desde, Number(e.target.value.replace(",", ".")) || 0)}
                        className={`relative w-12 shrink-0 bg-black border rounded-md px-1 py-0.5 text-xs text-center text-white outline-none ${
                          recorte.hasta ? "border-amarillo text-amarillo" : "border-white/20 focus:border-amarillo"
                        }`}
                      />
                      <div className="relative flex shrink-0">s</div>
                    </div>
                    <textarea
                      value={texto}
                      onChange={(e) => guardarEtiqueta(fuente.id, trozo.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.ctrlKey && e.key === " ") {
                          e.preventDefault();
                          reproducir(fuente, trozo.id, "original");
                        }
                      }}
                      placeholder={t.placeholderTrozo}
                      rows={2}
                      className="relative w-full flex bg-black border border-white/20 rounded-md px-2 py-1 text-sm text-white placeholder:text-white/30 focus:border-amarillo outline-none resize-y"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="relative w-full flex text-xs text-white/40 px-1">{t.sinFuentes}</div>
        )}

        <div className="relative w-full flex flex-col gap-3 pt-2 px-1 border-t border-white/20">
          <div className="relative w-full flex flex-row flex-wrap items-baseline justify-between gap-2">
            <div className="relative w-fit flex text-amarillo text-sm">{t.anonimo}</div>
            <div className="relative w-full flex text-xs text-white/70">{t.anonimoAyuda}</div>
          </div>
          <div className="relative w-full flex flex-row flex-wrap gap-4">
            <Parametro etiqueta={t.alfa} valor={anonimo.alfa} paso={0.01} min={0.75} max={1.25} onChange={(v) => setAnonimo({ ...anonimo, alfa: v })} />
            <Parametro etiqueta={t.semitonos} valor={anonimo.semitonos} paso={0.5} min={-8} max={8} onChange={(v) => setAnonimo({ ...anonimo, semitonos: v })} />
            <Parametro etiqueta={t.ritmo} valor={anonimo.ritmo} paso={0.02} min={0.8} max={1.2} onChange={(v) => setAnonimo({ ...anonimo, ritmo: v })} />
            <Parametro etiqueta={t.variacion} valor={anonimo.variacion} paso={0.02} min={0} max={0.3} onChange={(v) => setAnonimo({ ...anonimo, variacion: v })} />
          </div>
        </div>

        <div className="relative w-full flex flex-col gap-3 pt-2 px-1 pb-6 border-t border-white/20">
          <div className="relative w-full flex flex-row flex-wrap items-center justify-between gap-2">
            <div className="relative flex flex-row flex-wrap gap-4 text-xs items-center">
              <div className="relative flex text-amarillo text-sm">{t.descargar}</div>
              <div className="relative flex text-white/60">{t.resumen}:</div>
              <div className="relative flex">{resumen.fuentes} audio</div>
              <div className="relative flex">{resumen.trozos} trozos</div>
              <div className="relative flex text-amarillo">{resumen.etiquetados} con texto</div>
              <div className="relative flex text-amarillo">{resumen.minutos.toFixed(1)} min</div>
            </div>
            <div
              onClick={() => {
                if (resumen.etiquetados > 0 && ocupado !== "zip") descargar();
              }}
              className={`relative flex flex-row gap-2 items-center px-3 py-2 rounded-md border text-xs ${
                resumen.etiquetados > 0 && ocupado !== "zip"
                  ? "border-amarillo text-amarillo cursor-point hover:bg-amarillo hover:text-oscuro"
                  : "border-white/20 text-white/30"
              }`}
            >
              <IoMdDownload size={13} />
              {ocupado === "zip" ? t.preparando : "gup_dataset.zip"}
            </div>
          </div>
          <div className="relative w-full flex text-xs text-white/70">{t.descargarAyuda}</div>
          <div className="relative w-full flex flex-col gap-1">
            {t.kaggle.map((paso, indice) => (
              <div key={indice} className="relative w-full flex flex-row gap-2 items-start text-xs text-white/85">
                <div className="relative w-fit flex text-amarillo">{indice + 1}.</div>
                <div className="relative w-full flex">{paso}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
