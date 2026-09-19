"use client";

import Return from "@/app/components/modules/Return";
import NotaVoz from "@/app/components/modules/NotaVoz";
import useIa from "@/app/components/hooks/useIa";
import {
  IDIOMAS,
  LEMA_IA,
  LLM_TXT_URL,
  MODELO_TTS_URL,
  PASOS_USO_TTS,
  PRUEBA_CADENA_FECHA,
  PRUEBA_CADENA_URL,
  TEXTOS_IA,
  VOCES_TTS,
} from "@/app/lib/constantes";
import { IoMdDownload } from "react-icons/io";

export default function Ai() {
  const {
    idioma,
    setIdioma,
    vozActiva,
    activar,
    textoLibre,
    setTextoLibre,
    sonando,
    sonar,
    sinMotor,
  } = useIa();
  const t = TEXTOS_IA[idioma];

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2 overflow-hidden">
      <Return
        image={"QmU7tUyRwWUY4G4eYBQYpEYXWR8SgLsca2weVpc1ByaqVQ"}
        path="/wukirri"
      />
      <div className="relative w-full flex items-center justify-start h-full min-h-0 flex-col gap-4 text-white font-neueL overflow-y-scroll">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-5xl sm:text-7xl font-estilo text-amarillo">
          AI
        </div>

        <div className="relative w-full h-fit flex flex-row flex-wrap gap-2 items-center justify-between text-xs">
          <div className="relative w-fit h-fit flex text-sm sm:text-base text-white">
            {LEMA_IA}
          </div>
          <div className="relative w-fit h-fit flex flex-row gap-2 items-center">
            {IDIOMAS.map((id) => (
              <div
                key={id}
                onClick={() => setIdioma(id)}
                className={`relative w-6 h-6 flex items-center justify-center rounded-md cursor-point ${
                  idioma === id
                    ? "text-oscuro bg-amarillo border border-white"
                    : "border border-amarillo"
                }`}
              >
                {id}
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full h-fit grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="relative w-full h-full flex flex-col gap-3 p-4 border border-white rounded-md bg-oscuro">
            <div className="relative w-full flex flex-row flex-wrap gap-3 items-center justify-between">
              <div className="relative w-fit flex text-2xl sm:text-3xl font-estilo text-amarillo">
                {t.llmTitulo}
              </div>
              <a
                href={LLM_TXT_URL}
                download="llm.txt"
                className="relative w-fit h-fit flex flex-row gap-2 items-center bg-black px-2 py-1 border border-white rounded-md text-xs cursor-point hover:opacity-70"
              >
                <IoMdDownload color="white" size={13} />
                <div className="relative w-fit h-fit flex">{t.descargar}</div>
              </a>
            </div>
            <div className="relative w-full flex text-sm text-white/90">
              {t.llmDescripcion}
            </div>
          </div>

          <div className="relative w-full h-full flex flex-col gap-3 p-4 border border-white rounded-md bg-oscuro">
            <div className="relative w-full flex flex-row flex-wrap gap-3 items-center justify-between">
              <div className="relative w-fit flex text-2xl sm:text-3xl font-estilo text-amarillo">
                {t.ttsTitulo}
              </div>
              <a
                href={MODELO_TTS_URL}
                download="gupapuyngu-tts.zip"
                className="relative w-fit h-fit flex flex-row gap-2 items-center bg-black px-2 py-1 border border-white rounded-md text-xs cursor-point hover:opacity-70"
              >
                <IoMdDownload color="white" size={13} />
                <div className="relative w-fit h-fit flex">{t.descargar}</div>
              </a>
            </div>
            <div className="relative w-full flex text-sm text-white/90">
              {t.ttsDescripcion}
            </div>
          </div>
        </div>

        <div className="relative w-full h-fit flex flex-col gap-4 p-4 border border-white rounded-md">
          <div className="relative w-full flex flex-row flex-wrap gap-3 items-baseline justify-between">
            <div className="relative w-fit flex text-xl sm:text-2xl font-estilo text-amarillo">
              {t.vocesTitulo}
            </div>
            <div className="relative w-fit flex text-xs text-white/60">
              {t.vocesDescripcion}
            </div>
          </div>
          {sinMotor && (
            <div className="relative w-full flex text-xs text-amarillo/80 border border-amarillo/40 rounded-md px-3 py-2">
              {t.sinMotor}
            </div>
          )}
          <div className="relative w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
            {VOCES_TTS.map((voz) => {
              const activa = vozActiva === voz.id;
              return (
                <div
                  key={voz.id}
                  className={`relative w-full h-full flex flex-col gap-3 p-3 rounded-md border bg-oscuro ${
                    activa ? "border-amarillo" : "border-white/40"
                  }`}
                >
                  <div className="relative w-full flex flex-row items-baseline justify-between gap-2">
                    <div className="relative w-fit flex text-3xl font-estilo text-amarillo">
                      {voz.id}
                    </div>
                    <div className="relative w-fit flex text-xxs uppercase tracking-widest text-white/60">
                      ≈ {voz.f0} Hz
                    </div>
                  </div>
                  <div className="relative w-full flex text-xs text-white/85">
                    {voz.tono[idioma]}
                  </div>
                  <div className="relative w-full h-px bg-white/20"></div>
                  <div className="relative w-full flex flex-col gap-2">
                    {voz.muestras.map((muestra) => (
                      <div
                        key={muestra}
                        className="relative w-full flex flex-row gap-2 items-center justify-between"
                      >
                        <div className="relative w-fit flex text-sm">
                          {muestra}
                        </div>
                        <NotaVoz
                          texto={muestra}
                          voz={voz.id}
                          sonando={sonando}
                          sonar={sonar}
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    onClick={() => activar(voz.id)}
                    className={`relative w-full flex items-center justify-center px-2 py-1 rounded-md text-xxs uppercase tracking-widest border ${
                      activa
                        ? "bg-amarillo text-oscuro border-white"
                        : "border-amarillo text-amarillo cursor-point hover:opacity-70"
                    }`}
                  >
                    {activa ? t.activa : t.elegir}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative w-full flex flex-row flex-wrap sm:flex-nowrap gap-3 items-center">
            <div className="relative w-fit flex text-xxs uppercase tracking-widest text-amarillo/70 shrink-0">
              {t.probar}
            </div>
            <input
              type="text"
              value={textoLibre}
              onChange={(e) => setTextoLibre(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                sonar(textoLibre, vozActiva ?? VOCES_TTS[0].id)
              }
              placeholder={t.probarPlaceholder}
              className="relative w-full px-3 py-2 bg-oscuro border border-white/30 rounded-md text-sm placeholder:text-white/30 focus:border-amarillo outline-none"
            />
            <div className="relative w-fit flex flex-row gap-2 items-center shrink-0">
              {VOCES_TTS.map((voz) => (
                <div
                  key={voz.id}
                  className="relative w-fit flex flex-row gap-1 items-center"
                >
                  <div className="relative w-fit flex text-xxs text-white/60">
                    {voz.id}
                  </div>
                  <NotaVoz
                    texto={textoLibre}
                    voz={voz.id}
                    sonando={sonando}
                    sonar={sonar}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative w-full h-fit grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
          <div className="relative w-full h-full flex flex-col gap-3 p-4 border border-white rounded-md">
            <div className="relative w-fit flex text-xl sm:text-2xl font-estilo text-amarillo">
              {t.entrenamiento}
            </div>
            <div className="relative w-full flex flex-col gap-2">
              {t.entrenamientoDetalle.map((linea, indice) => (
                <div
                  key={indice}
                  className="relative w-full flex flex-row gap-2 items-start text-xs text-white/85"
                >
                  <div className="relative w-fit flex text-amarillo">☆</div>
                  <div className="relative w-full flex">{linea}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full h-full flex flex-col gap-3 p-4 border border-white rounded-md">
            <div className="relative w-fit flex text-xl sm:text-2xl font-estilo text-amarillo">
              {t.usoTitulo}
            </div>
            <div className="relative w-full flex flex-col gap-3">
              {PASOS_USO_TTS.map((paso, indice) => (
                <div
                  key={indice}
                  className="relative w-full flex flex-col gap-1"
                >
                  <div className="relative w-full flex text-xs text-white/85">
                    {paso.titulo[idioma]}
                  </div>
                  <pre className="relative w-full flex bg-black border border-white/20 rounded-md px-3 py-2 text-xxs sm:text-xs font-mono text-amarillo/90 overflow-x-auto whitespace-pre">
                    {paso.codigo}
                  </pre>
                </div>
              ))}
            </div>
            <div className="relative w-fit flex text-base sm:text-lg font-estilo text-amarillo pt-1">
              {t.configTitulo}
            </div>
            <div className="relative w-full flex flex-col gap-2">
              {t.configDetalle.map((linea, indice) => (
                <div
                  key={indice}
                  className="relative w-full flex flex-row gap-2 items-start text-xs text-white/85"
                >
                  <div className="relative w-fit flex text-amarillo">☆</div>
                  <div className="relative w-full flex" id="break">
                    {linea}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <a
          href={PRUEBA_CADENA_URL}
          target="_blank"
          rel="noreferrer"
          className="relative w-full flex flex-row gap-2 items-center justify-end text-xxs text-white/40 hover:text-amarillo cursor-point pb-4"
        >
          <div className="relative w-fit flex">⛓</div>
          <div className="relative w-fit flex">{PRUEBA_CADENA_FECHA}</div>
          <div className="relative w-fit flex">{t.cadena}</div>
        </a>
      </div>
    </div>
  );
}
