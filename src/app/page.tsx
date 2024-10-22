"use client";
import useCapitulos from "@/components/hooks/useCapitulos";
import Capitulos from "@/components/modules/Capitulos";
import { CAPITULOS } from "@/constantes";

export default function Home() {
  const { capituloActual, setCapituloActual, abrirCapitulo, setAbrirCapitulo } =
    useCapitulos();
  return (
    <div className="bg-black w-full h-fit overflow-y-scroll flex flex-col items-center justify-start gap-10 pt-8">
      <div className="relative w-fit h-fit flex items-center justify-center flex-row gap-3 text-white text-xs font-manga">
        <div
          className="relative w-24 h-fit border border-white flex items-center justify-center cursor-pointer hover:opacity-70 p-2"
          onClick={() => setAbrirCapitulo(!abrirCapitulo)}
        >
          Chapters
        </div>
        {abrirCapitulo && (
          <div className="absolute top-8 left-0 flex flex-col items-center justify-center w-24 border-b">
            {CAPITULOS?.map((_, indice) => {
              return (
                <div
                  className={`relative w-full h-8 flex items-center justify-center border-x border-white cursor-pointer hover:opacity-70 p-2 ${
                    indice + 1 !== Capitulos.length && "border-b"
                  }`}
                  key={indice}
                  onClick={() => {
                    setAbrirCapitulo(!abrirCapitulo);
                    setCapituloActual(indice);
                  }}
                >
                  {`Chapter ${indice + 1}`}
                </div>
              );
            })}
          </div>
        )}
        <div
          className={`relative w-24 h-fit flex border border-white items-center justify-center p-2 ${
            capituloActual + 1 < CAPITULOS.length
              ? "cursor-pointer hover:opacity-70"
              : "opacity-50"
          }`}
          onClick={() =>
            capituloActual + 1 < CAPITULOS.length &&
            setCapituloActual((prev) => prev + 1)
          }
        >
          Next
        </div>
      </div>
      <Capitulos capituloActual={capituloActual} />
    </div>
  );
}
