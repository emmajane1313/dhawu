"use client";

import { IDIOMAS } from "@/app/lib/constantes";
import { ContextoTraduccion, useEstadoTraduccion, useTraduccion } from "../hooks/useTraduccion";

export function BotonesTraduccion() {
  const { traduccion, fijar } = useTraduccion();

  return (
    <div className="fixed top-3 right-3 z-30 flex flex-row gap-1 items-center font-neueL text-xs">
      {IDIOMAS.map((id) => (
        <div
          key={id}
          onClick={() => fijar(traduccion === id ? null : id)}
          title={traduccion === id ? "gup" : id}
          className={`relative w-7 h-7 flex items-center justify-center rounded-md cursor-point border ${
            traduccion === id
              ? "text-oscuro bg-amarillo border-white"
              : "text-amarillo bg-black border-amarillo hover:bg-amarillo/20"
          }`}
        >
          {id}
        </div>
      ))}
    </div>
  );
}

export default function Traductor({ children }: { children: React.ReactNode }) {
  const estado = useEstadoTraduccion();

  return (
    <ContextoTraduccion.Provider value={estado}>
      {children}
      <BotonesTraduccion />
    </ContextoTraduccion.Provider>
  );
}
