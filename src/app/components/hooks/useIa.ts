import { useEffect, useState } from "react";
import { LanguageMode } from "../types/components.type";
import { EstadoIa } from "../types/ia.type";
import { elegirVoz, urlVoz, vozElegida } from "./useVoz";

const useIa = (): EstadoIa => {
  const [idioma, setIdioma] = useState<LanguageMode>("es");
  const [vozActiva, setVozActiva] = useState<string | null>(null);
  const [textoLibre, setTextoLibre] = useState("");
  const [sonando, setSonando] = useState<string | null>(null);
  const [sinMotor, setSinMotor] = useState(false);

  useEffect(() => {
    setVozActiva(vozElegida());
  }, []);

  const activar = (id: string) => {
    elegirVoz(id);
    setVozActiva(id);
  };

  const sonar = async (texto: string, voz: string) => {
    const limpio = texto.trim();
    if (!limpio || sonando) return;
    const clave = `${voz}|${limpio}`;
    setSonando(clave);
    try {
      const parametros = new URLSearchParams({ texto: limpio, voz });
      const respuesta = await fetch(urlVoz(parametros));
      const tipo = respuesta.headers.get("Content-Type") ?? "";
      if (
        !respuesta.ok ||
        !tipo.startsWith("audio/") ||
        respuesta.headers.get("X-Voz-Motor") !== "neural"
      ) {
        setSinMotor(true);
        return;
      }
      const url = URL.createObjectURL(await respuesta.blob());
      await new Promise<void>((terminar) => {
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          terminar();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          terminar();
        };
        audio.play().catch(() => terminar());
      });
    } catch (error) {
      console.log("[ia voz]", error);
      setSinMotor(true);
    } finally {
      setSonando(null);
    }
  };

  return {
    idioma,
    setIdioma,
    vozActiva,
    activar,
    textoLibre,
    setTextoLibre,
    sonando,
    sonar,
    sinMotor,
  };
};

export default useIa;
