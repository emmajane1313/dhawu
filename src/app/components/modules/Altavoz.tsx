"use client";

import { reproducir } from "../hooks/useVoz";
import { AltavozProps } from "../types/components.type";

export default function Altavoz({ texto, tamano = "w-5 h-5" }: AltavozProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        reproducir(texto);
      }}
      className={`relative ${tamano} flex items-center justify-center rounded-md border border-white/30 text-white/50 text-xs cursor-point hover:border-amarillo hover:text-amarillo shrink-0`}
    >
      ♪
    </div>
  );
}
