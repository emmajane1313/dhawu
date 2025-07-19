"use client";

import useLarruma from "@/app/components/hooks/useLarruma";
import Return from "../../components/modules/Return";
import { useRouter } from "next/navigation";

export default function LarrumaMala() {
  const { search, handleSearch, filtered } = useLarruma();
  const router = useRouter();
  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between text-white overflow-y-scroll pt-2 px-2 font-neueL">
      <Return
        image={"QmfTwrURLPFwXct3Lh3fYyTRqUrKLfWUhAsZiF9PVLwgG5"}
        path="/wukirri"
      />
      <div className="relative w-full flex items-center justify-start h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-2xl sm:text-4xl lg:text-7xl font-estilo text-amarillo">
          Ḻarruma Mala
        </div>
        <div className="relative w-full h-fit flex">
          <input
            type="text"
            placeholder="Ḻarruma mala..."
            className="w-full p-3 border rounded h-10"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="relative w-full flex overflow-y-scroll">
          <div className="relative w-full h-fit flex flex-col items-start justify-start gap-5">
            {filtered.map((entry, indice) => (
              <div
                className="relative w-full h-fit flex flex-col gap-2 cursor-point hover:opacity-70"
                key={indice}
                onClick={() => router.push(entry.pagina)}
              >
                <div className="relative text-lg underline underline-offset-3 text-oscuro">
                  {entry.pagina}
                </div>
                <div
                  className="relative w-fit h-fit uppercase text-xs break-all"
                  dangerouslySetInnerHTML={{
                    __html: entry.found,
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
