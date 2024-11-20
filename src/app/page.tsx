"use client";
import useDhawus from "@/components/hooks/useDhawus";
import Marquee from "@/components/modules/Marquee";
import { INFURA_GATEWAY } from "@/constantes";
import Image from "next/legacy/image";
import { useRouter } from "next/navigation";
export default function Home() {
  const { dhawus } = useDhawus();
  const router = useRouter();
  return (
    <div className="bg-black w-full h-screen flex flex-col items-center gap-10">
      <div className="relative w-full pt-8 text-white text-6xl font-estilo flex items-center justify-center">
        <div className="relative w-fit h-fit flex text-center">Dhäwu Mala</div>
      </div>
      <div className="relative w-full flex-grow overflow-y-scroll flex items-start justify-center">
        <div className="relative w-full md:w-3/4 h-fit grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-3 sm:px-10 gap-6">
          {dhawus?.map((dhawu, indice: number) => (
            <div
              key={indice}
              className={`relative w-full h-80 sm:h-72 lg:h-80 xl:h-96 flex items-center justify-center border border-white bg-white ${
                dhawu.envivo ? "cursor-pointer hover:opacity-90" : "opacity-70"
              }`}
              title={dhawu.titulo}
              onClick={() =>
                dhawu.envivo &&
                router.push(`/dhawu/${dhawu.titulo.replaceAll(" ", "-")}`)
              }
            >
              <Image
                draggable={false}
                src={`${INFURA_GATEWAY}/ipfs/${dhawu.portada}`}
                objectFit="cover"
                layout="fill"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="relative w-full">
        <Marquee />
      </div>
    </div>
  );
}
