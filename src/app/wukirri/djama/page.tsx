"use client";

import useDjama from "@/app/components/hooks/useDjama";
import { useRouter } from "next/navigation";
import { IoArrowBackCircle } from "react-icons/io5";

export default function Djama() {
  const router = useRouter();
  const { search, handleSearch, filtered } = useDjama();

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between text-white overflow-y-scroll pt-2 px-2 font-neueL">
      <div
        className="absolute z-10 left-4 top-4 w-fit h-fit cursor-point hover:opacity-70 text-xs bg-black px-2 py-1 border border-white rounded-md items-center justify-center flex flex-row gap-2"
        onClick={() => router.push("/wukirri/")}
      >
        <IoArrowBackCircle color="white" size={15} />
        <div className="relative w-fit h-fit flex">roŋiyirri</div>
      </div>
      <div className="relative w-full flex items-center justify-start h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-2xl sm:text-4xl lg:text-7xl font-estilo text-amarillo">
          Djäma
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
                  {`${entry.id} (ŋurruk ${entry.grupo})`}
                </div>
                <div className="relative w-full h-fit flex gap-2 justify-between items-center text-sm pb-4">
                  {["primera", "secundaria", "tercera", "quarta"].map(
                    (elemento, indice) => {
                      return (
                        <div
                          key={indice}
                          className="relative w-full h-fit flex flex-col gap-2 items-center justify-center text-center"
                        >
                          <div className="relative w-fit h-fit flex">
                            {indice + 1}
                          </div>
                          <div className="relative w-full h-px bg-white/40"></div>
                          <div className="relative w-fit h-fit flex">
                            {entry?.[elemento as "primera"]}
                          </div>
                        </div>
                      );
                    }
                  )}
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
