"use client";

import { NotaVozProps } from "../types/ia.type";

export default function NotaVoz({ texto, voz, sonando, sonar }: NotaVozProps) {
  const clave = `${voz}|${texto.trim()}`;
  const activo = sonando === clave;
  return (
    <div
      onClick={() => sonar(texto, voz)}
      className={`relative w-6 h-6 flex items-center justify-center rounded-md border text-xs shrink-0 ${
        activo
          ? "border-amarillo bg-amarillo text-oscuro"
          : sonando
          ? "border-white/20 text-white/30 cursor-art"
          : "border-white/30 text-white/60 cursor-point hover:border-amarillo hover:text-amarillo"
      }`}
    >
      {activo ? (
        <div className="relative w-2/3 h-2/3 rounded-full border border-oscuro border-t-transparent animate-spin"></div>
      ) : (
        "♪"
      )}
    </div>
  );
}
