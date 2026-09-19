import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Traduccion, TraduccionContexto } from "../types/components.type";
import { CLAVE_TRADUCCION, TRADUCCIONES_GUP } from "@/app/lib/constantes";

export const ContextoTraduccion = createContext<TraduccionContexto>({
  traduccion: null,
  fijar: () => {},
  g: (texto) => texto,
});

export const useTraduccion = (): TraduccionContexto => useContext(ContextoTraduccion);

export const useEstadoTraduccion = (): TraduccionContexto => {
  const [traduccion, setTraduccion] = useState<Traduccion>(null);

  useEffect(() => {
    try {
      const guardada = localStorage.getItem(CLAVE_TRADUCCION);
      if (guardada === "es" || guardada === "en") setTraduccion(guardada);
    } catch (error) {
      console.log("[traduccion local]", error);
    }
  }, []);

  const fijar = useCallback((nueva: Traduccion) => {
    setTraduccion(nueva);
    try {
      if (nueva) localStorage.setItem(CLAVE_TRADUCCION, nueva);
      else localStorage.removeItem(CLAVE_TRADUCCION);
    } catch (error) {
      console.log("[traduccion local]", error);
    }
  }, []);

  const g = useCallback(
    (texto: string): string => (traduccion ? TRADUCCIONES_GUP[texto]?.[traduccion] ?? texto : texto),
    [traduccion]
  );

  return { traduccion, fijar, g };
};
