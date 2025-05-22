"use client";

import useMarng from "../components/hooks/useMarng";
import Return from "../components/modules/Return";

export default function Marnggithinyawuy() {
  const { search, handleSearch, filtered } = useMarng();

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between text-white overflow-y-scroll">
      <Return image={"QmVpDrjNF5xo47xfCV8arvJ7p8HfzVCWByvwSeUHQYLTWH"} />
      <div className="relative w-full flex items-center justify-start h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-[#CC0000] border border-white text-2xl sm:text-4xl lg:text-7xl font-estilo text-[#FFFF00]">
          Dhäruk Mala
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
                <div className="relative text-lg underline underline-offset-3 text-[#CC0000]">
                  {entry.id}
                </div>
                {Object.entries(entry.translations).map((item, indice) => {
                  return (
                    <div
                      className="relative w-full h-fit flex flex-row justify-between items-center gap-2 text-xs p-1 border-b border-white/40"
                      key={indice}
                    >
                      <div className="relative w-fit h-fit flex uppercase">
                        {item?.[0]}
                      </div>
                      <div className="relative w-full h-fit flex items-center justify-center">
                        <div className="relative w-fit h-fit text-[#FFFF00]">
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
