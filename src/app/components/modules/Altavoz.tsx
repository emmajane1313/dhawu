"use client";

import { useState } from "react";
import { reproducir } from "../hooks/useVoz";
import { AltavozProps } from "../types/components.type";

export default function Altavoz({ texto, tamano = "w-5 h-5" }: AltavozProps) {
  const [cargando, setCargando] = useState(false);

  const sonar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cargando) return;
    setCargando(true);
    try {
      await reproducir(texto);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      onClick={sonar}
      className={`relative ${tamano} flex items-center justify-center rounded-md border text-xs shrink-0 ${
        cargando
          ? "border-amarillo text-amarillo cursor-art"
          : "border-white/30 text-white/50 cursor-point hover:border-amarillo hover:text-amarillo"
      }`}
    >
      {cargando ? (
        <div className="relative w-2/3 h-2/3 rounded-full border border-amarillo border-t-transparent animate-spin"></div>
      ) : (
        "♪"
      )}
    </div>
  );
}
