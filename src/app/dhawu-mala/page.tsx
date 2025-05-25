"use client";

import Image from "next/image";
import { INTERNAL_INFURA_GATEWAY } from "../lib/constantes";
import { useRouter } from "next/navigation";
import useDhawus from "../components/hooks/useDhawus";
import Return from "../components/modules/Return";

export default function Marnggithinyawuy() {
  const router = useRouter();
  const { dhawus } = useDhawus();

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2 overflow-y-scroll">
      <Return image={"QmWXAgnVAc4odhXg1PRcCMjZo4eMUj7oohpsUjaMDxyAwv"} />
      <div className="relative w-full flex items-center justify-between h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-2xl sm:text-4xl lg:text-7xl font-estilo text-amarillo">
          Dhäwu Bukmak
        </div>
        <div className="relative w-full flex overflow-y-scroll items-start sm:items-center justify-center h-full">
          <div className="relative w-full items-center justify-center h-fit sm:flex-row flex-col flex gap-6">
            {dhawus?.map((dhawu, indice: number) => (
              <div
                key={indice}
                className={`relative w-full sm:w-28 h-60 sm:h-40 flex items-center justify-center border border-white rounded-md bg-white ${
                  dhawu.envivo &&
                  "hover:rotate-1 cursor-pointer hover:opacity-90 hover:scale-300 hover:z-10"
                }`}
                title={dhawu.titulo}
                onClick={() =>
                  dhawu.envivo &&
                  router.push(`/dhawu/${dhawu.titulo.replaceAll(" ", "-")}`)
                }
              >
                <Image
                  alt={dhawu.titulo}
                  draggable={false}
                  className="rounded-md"
                  src={`${INTERNAL_INFURA_GATEWAY}${dhawu.portada}`}
                  objectFit="cover"
                  layout="fill"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
