"use client";

import { IoMdDownload } from "react-icons/io";
import useMarng from "../components/hooks/useMarng";
import Return from "../components/modules/Return";

export default function Marnggithinyawuy() {
  const { search, handleSearch, filtered, downloadJsonFromUrl } = useMarng();

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between text-white overflow-y-scroll pt-2 px-2 font-neueL">
      <Return
        image={"QmVpDrjNF5xo47xfCV8arvJ7p8HfzVCWByvwSeUHQYLTWH"}
        path="/"
      />
      <div className="relative w-full flex items-center justify-start h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-2xl sm:text-4xl lg:text-7xl font-estilo text-amarillo">
          Dhäruk Mala
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
            placeholder="Ḻarruma..."
            className="w-full p-3 border rounded h-10"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="relative w-full flex overflow-y-scroll">
          <div className="relative w-full h-fit flex flex-col items-start justify-start gap-5">
            {filtered.map((entry) => (
              <div
                className="relative w-full h-fit flex flex-col gap-2"
                key={entry.id}
              >
                <div className="relative text-lg underline underline-offset-3 text-oscuro">
                  {entry.id}
                </div>
                {Object.entries(entry.translations).map((item, indice) => {
                  return (
                    <div
                      className="relative w-full h-fit flex flex-row justify-between items-center gap-2 text-xs p-1 border-b border-white/40 galaxy:flex-nowrap flex-wrap"
                      key={indice}
                    >
                      <div className="relative w-fit h-fit flex uppercase whitespace-nowrap">
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
          </div>
        </div>
      </div>
    </div>
  );
}
