"use client";

import { IoMdDownload } from "react-icons/io";
import useMarng from "../components/hooks/useMarng";
import Return from "../components/modules/Return";
import Altavoz from "../components/modules/Altavoz";
import { useTraduccion } from "@/app/components/hooks/useTraduccion";

export default function Marnggithinyawuy() {
  const { search, handleSearch, filtered, limite, mostrarMas, downloadJsonFromUrl } =
    useMarng();
  const { g } = useTraduccion();

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between text-white overflow-y-scroll overflow-x-hidden pt-2 px-2 font-neueL">
      <Return
        image={"QmVpDrjNF5xo47xfCV8arvJ7p8HfzVCWByvwSeUHQYLTWH"}
        path="/"
      />
      <div className="relative w-full min-w-0 flex items-center justify-start h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-2xl sm:text-4xl lg:text-7xl font-estilo text-amarillo">
          {g("Dhäruk Mala")}
          <div
            className="absolute z-10 right-2 top-2 w-fit h-fit cursor-point hover:opacity-70 bg-black p-1 border border-white rounded-md items-center justify-center"
            onClick={() => downloadJsonFromUrl()}
          >
            <IoMdDownload color="white" size={15} />
          </div>
        </div>
        <div className="relative w-full h-fit flex">
          <input
            type="text"
            placeholder={g("Ḻarruma...")}
            className="w-full p-3 border rounded h-10"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="relative w-full min-w-0 flex-1 min-h-0 flex overflow-y-auto overflow-x-auto">
          <div className="relative w-max min-w-full h-fit flex flex-col items-start justify-start gap-5 pb-10">
            <div className="relative w-fit h-fit flex text-xs text-white/40">
              {filtered.length} {g("dhäruk")}
            </div>
            {filtered.slice(0, limite).map((entry) => (
              <div
                className="relative w-full h-fit flex flex-col gap-2"
                key={entry.id}
              >
                <div className="relative w-fit h-fit flex flex-row items-center gap-2">
                  <div className="relative text-lg underline underline-offset-3 text-oscuro">
                    {entry.id}
                  </div>
                  <Altavoz texto={entry.id} />
                  {entry.tipo && (
                    <div className="relative w-fit h-fit flex text-xs text-amarillo/70 lowercase">
                      {entry.tipo}
                    </div>
                  )}
                </div>
                {Object.entries(entry.translations).map((item, indice) => {
                  return (
                    <div
                      className="relative w-full h-fit flex flex-row justify-between items-center gap-2 text-xs p-1 border-b border-white/40 galaxy:flex-nowrap flex-wrap"
                      key={indice}
                    >
                      <div className="relative w-fit h-fit flex uppercase whitespace-nowrap shrink-0">
                        {item?.[0]}
                      </div>
                      <div className="relative w-full h-fit flex items-center justify-center">
                        <div className="relative w-fit h-fit text-amarillo">
                          ☆
                        </div>
                      </div>
                      <div className="relative w-fit h-fit flex whitespace-nowrap">
                        {item?.[1]}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {filtered.length > limite && (
              <div
                className="relative w-full h-fit flex items-center justify-center p-3 border border-amarillo rounded-md text-amarillo cursor-point hover:bg-amarillo/10"
                onClick={() => mostrarMas()}
              >
                {g("Bulu")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
