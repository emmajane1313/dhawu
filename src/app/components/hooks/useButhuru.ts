import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EtiquetasButhuru,
  FuenteButhuru,
  ParametrosAnonimo,
  ParametrosCorte,
  RecortesButhuru,
  ResumenButhuru,
} from "../types/buthuru.type";
import {
  TASA_SALIDA,
  aBlobWav,
  aTasaSalida,
  anonimizar,
  codificarWav,
  construirZip,
  cortarPorSilencio,
  decodificar,
  extraer,
} from "./useAudioDsp";

const CLAVE_ETIQUETAS = "buthuru-etiquetas";
const CLAVE_RECORTES = "buthuru-recortes";
const CLAVE_TEXTOS = "buthuru-textos";

const ADJUNTOS = [
  "espeak-gup/lang-gup",
  "espeak-gup/gup_rules",
  "espeak-gup/gup_list",
  "train_kaggle.ipynb",
  "train_multi_kaggle.ipynb",
  "README.md",
  "buthuru-local-es.txt",
  "buthuru-local-en.txt",
];

const CORTE_INICIAL: ParametrosCorte = { umbralDb: -32, silencioMin: 0.28, trozoMin: 0.4, margen: 0.08 };
const ANONIMO_INICIAL: ParametrosAnonimo = { activo: true, alfa: 0.88, semitonos: 3, ritmo: 1.0, variacion: 0.1 };

const leerLocal = <T,>(clave: string, porDefecto: T): T => {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
};

const guardarLocal = (clave: string, valor: unknown): void => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.log("[buthuru local]", error);
  }
};

const limpiarTexto = (crudo: string): string =>
  crudo
    .replace(/[’‘ʼ`´]/g, "'")
    .replace(/["“”„«»]/g, "")
    .split(/\s+/)
    .join(" ")
    .trim();

const idDe = (nombre: string, existentes: string[]): string => {
  const base = nombre
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "audio";
  let id = base;
  let n = 2;
  while (existentes.includes(id)) id = `${base}-${n++}`;
  return id;
};

const useButhuru = () => {
  const [fuentes, setFuentes] = useState<FuenteButhuru[]>([]);
  const [etiquetas, setEtiquetas] = useState<EtiquetasButhuru>({});
  const [recortes, setRecortes] = useState<RecortesButhuru>({});
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [corte, setCorte] = useState<ParametrosCorte>(CORTE_INICIAL);
  const [anonimo, setAnonimo] = useState<ParametrosAnonimo>(ANONIMO_INICIAL);
  const [fuenteActiva, setFuenteActiva] = useState<string>("");
  const [seleccion, setSeleccion] = useState("");
  const [soloIncompletas, setSoloIncompletas] = useState(false);
  const [sonando, setSonando] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string>("");
  const [grabando, setGrabando] = useState(false);
  const [segundosGrabados, setSegundosGrabados] = useState(0);
  const reproductor = useRef<HTMLAudioElement | null>(null);
  const grabadora = useRef<MediaRecorder | null>(null);
  const trozosGrabacion = useRef<Blob[]>([]);
  const cronometro = useRef<number | null>(null);
  const adjuntos = useRef<Record<string, Uint8Array>>({});
  const [adjuntosListos, setAdjuntosListos] = useState(false);

  useEffect(() => {
    setEtiquetas(leerLocal(CLAVE_ETIQUETAS, {}));
    setRecortes(leerLocal(CLAVE_RECORTES, {}));
    setTextos(leerLocal(CLAVE_TEXTOS, {}));
    let vivo = true;
    Promise.all(
      ADJUNTOS.map(async (ruta) => {
        try {
          const respuesta = await fetch(`/buthuru/${ruta}`);
          if (respuesta.ok) adjuntos.current[ruta] = new Uint8Array(await respuesta.arrayBuffer());
        } catch (error) {
          console.log("[buthuru adjunto]", ruta, error);
        }
      })
    ).then(() => {
      if (vivo) setAdjuntosListos(Object.keys(adjuntos.current).length === ADJUNTOS.length);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const agregarFuente = useCallback(
    async (archivo: Blob, nombre: string) => {
      setOcupado(nombre);
      try {
        const { muestras, tasa, duracion } = await decodificar(archivo);
        setFuentes((previas) => {
          const id = idDe(nombre, previas.map((f) => f.id));
          const nueva: FuenteButhuru = {
            id,
            nombre,
            duracion,
            tasa,
            muestras,
            texto: textos[id] ?? "",
            trozos: cortarPorSilencio(muestras, tasa, corte, id),
          };
          return [...previas, nueva];
        });
      } catch (error) {
        console.log("[buthuru decodificar]", error);
      } finally {
        setOcupado("");
      }
    },
    [corte, textos]
  );

  const subirArchivos = useCallback(
    async (lista: FileList | File[]) => {
      for (const archivo of Array.from(lista)) await agregarFuente(archivo, archivo.name);
    },
    [agregarFuente]
  );

  const quitarFuente = useCallback((id: string) => {
    setFuentes((previas) => previas.filter((f) => f.id !== id));
    setFuenteActiva((actual) => (actual === id ? "" : actual));
  }, []);

  const recortarFuente = useCallback(
    (id: string) => {
      setFuentes((previas) =>
        previas.map((f) =>
          f.id === id ? { ...f, trozos: cortarPorSilencio(f.muestras, f.tasa, corte, f.id) } : f
        )
      );
      setEtiquetas((previas) => {
        const nuevas = { ...previas };
        delete nuevas[id];
        guardarLocal(CLAVE_ETIQUETAS, nuevas);
        return nuevas;
      });
    },
    [corte]
  );

  const fijarTexto = useCallback((id: string, texto: string) => {
    setFuentes((previas) => previas.map((f) => (f.id === id ? { ...f, texto } : f)));
    setTextos((previos) => {
      const nuevos = { ...previos, [id]: texto };
      guardarLocal(CLAVE_TEXTOS, nuevos);
      return nuevos;
    });
  }, []);

  const guardarEtiqueta = useCallback((fuente: string, trozo: string, texto: string) => {
    setEtiquetas((previas) => {
      const nuevas = { ...previas, [fuente]: { ...(previas[fuente] ?? {}), [trozo]: texto } };
      guardarLocal(CLAVE_ETIQUETAS, nuevas);
      return nuevas;
    });
  }, []);

  const guardarRecorte = useCallback((fuente: string, trozo: string, desde: number, hasta: number) => {
    setRecortes((previos) => {
      const historia = { ...(previos[fuente] ?? {}) };
      if (!desde && !hasta) delete historia[trozo];
      else historia[trozo] = { desde: Math.max(0, desde), hasta: Math.max(0, hasta) };
      const nuevos = { ...previos, [fuente]: historia };
      guardarLocal(CLAVE_RECORTES, nuevos);
      return nuevos;
    });
  }, []);

  const muestrasDeTrozo = useCallback(
    (fuente: FuenteButhuru, trozoId: string, aplicarAnonimo: boolean): Float32Array | null => {
      const trozo = fuente.trozos.find((t) => t.id === trozoId);
      if (!trozo) return null;
      const recorte = recortes[fuente.id]?.[trozoId] ?? { desde: 0, hasta: 0 };
      const inicio = trozo.inicio + recorte.desde;
      const fin = trozo.fin - recorte.hasta;
      if (fin - inicio < 0.2) return null;
      const bruto = extraer(fuente.muestras, fuente.tasa, inicio, fin);
      return aplicarAnonimo ? anonimizar(bruto, fuente.tasa, anonimo, trozoId) : bruto;
    },
    [recortes, anonimo]
  );

  const reproducir = useCallback(
    (fuente: FuenteButhuru, trozoId: string, version: "original" | "anonimo") => {
      if (!reproductor.current) {
        reproductor.current = new Audio();
        reproductor.current.onended = () => setSonando(null);
        reproductor.current.onpause = () => setSonando(null);
      }
      const audio = reproductor.current;
      const clave = `${version}:${trozoId}`;
      if (sonando === clave) {
        audio.pause();
        return;
      }
      audio.pause();
      const muestras = muestrasDeTrozo(fuente, trozoId, version === "anonimo");
      if (!muestras) return;
      const url = URL.createObjectURL(aBlobWav(muestras, fuente.tasa));
      audio.src = url;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setSonando(null);
      };
      setSonando(clave);
      audio.play().catch((error) => console.log("[buthuru audio]", error));
    },
    [sonando, muestrasDeTrozo]
  );

  const empezarGrabacion = useCallback(async () => {
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
      const grabador = new MediaRecorder(flujo);
      trozosGrabacion.current = [];
      grabador.ondataavailable = (e) => {
        if (e.data.size > 0) trozosGrabacion.current.push(e.data);
      };
      grabador.onstop = async () => {
        flujo.getTracks().forEach((pista) => pista.stop());
        const blob = new Blob(trozosGrabacion.current, { type: grabador.mimeType || "audio/webm" });
        const marca = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
        await agregarFuente(blob, `grabacion-${marca}.webm`);
      };
      grabador.start(1000);
      grabadora.current = grabador;
      setGrabando(true);
      setSegundosGrabados(0);
      cronometro.current = window.setInterval(() => setSegundosGrabados((s) => s + 1), 1000);
    } catch (error) {
      console.log("[buthuru grabar]", error);
    }
  }, [agregarFuente]);

  const pararGrabacion = useCallback(() => {
    grabadora.current?.stop();
    grabadora.current = null;
    setGrabando(false);
    if (cronometro.current) window.clearInterval(cronometro.current);
    cronometro.current = null;
  }, []);

  const capturarSeleccion = useCallback(() => {
    const texto = window.getSelection()?.toString().trim() ?? "";
    if (texto.length > 0) setSeleccion(texto);
  }, []);

  const fuente = useMemo(
    () => fuentes.find((f) => f.id === fuenteActiva) ?? fuentes[0],
    [fuentes, fuenteActiva]
  );

  const resumen = useMemo<ResumenButhuru>(() => {
    let trozos = 0;
    let etiquetados = 0;
    let segundos = 0;
    for (const f of fuentes) {
      trozos += f.trozos.length;
      for (const t of f.trozos) {
        if ((etiquetas[f.id]?.[t.id] ?? "").trim()) {
          etiquetados++;
          const r = recortes[f.id]?.[t.id] ?? { desde: 0, hasta: 0 };
          segundos += Math.max(0, t.fin - t.inicio - r.desde - r.hasta);
        }
      }
    }
    return { fuentes: fuentes.length, trozos, etiquetados, minutos: segundos / 60 };
  }, [fuentes, etiquetas, recortes]);

  const descargar = useCallback(async () => {
    setOcupado("zip");
    try {
      const archivos: { ruta: string; datos: Uint8Array }[] = [];
      const filas: string[] = [];
      for (const f of fuentes) {
        for (const t of f.trozos) {
          const texto = limpiarTexto(etiquetas[f.id]?.[t.id] ?? "");
          if (!texto) continue;
          const muestras = muestrasDeTrozo(f, t.id, anonimo.activo);
          if (!muestras) continue;
          const salida = aTasaSalida(muestras, f.tasa);
          archivos.push({ ruta: `dataset/wavs/${t.id}.wav`, datos: codificarWav(salida, TASA_SALIDA) });
          filas.push(`${t.id}|${texto}`);
        }
      }
      const codificador = new TextEncoder();
      archivos.push({ ruta: "dataset/metadata.csv", datos: codificador.encode(filas.join("\n") + "\n") });
      for (const ruta of ADJUNTOS) {
        const datos = adjuntos.current[ruta];
        if (datos) archivos.push({ ruta, datos });
      }
      const zip = construirZip(archivos);
      const url = URL.createObjectURL(zip);
      const a = Object.assign(document.createElement("a"), { href: url, download: "gup_dataset.zip" });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.log("[buthuru zip]", error);
    } finally {
      setOcupado("");
    }
  }, [fuentes, etiquetas, anonimo.activo, muestrasDeTrozo]);

  return {
    fuentes,
    fuente,
    fuenteActiva,
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
  };
};

export default useButhuru;
