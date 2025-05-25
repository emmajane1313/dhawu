"use client";

import Image from "next/image";
import Return from "../components/modules/Return";
import { INFURA_GATEWAY, VIDEOS } from "../lib/constantes";
import { useRouter } from "next/navigation";

export default function Marnggithinyawuy() {
  const router = useRouter();
  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2">
      <Return image={"QmU7tUyRwWUY4G4eYBQYpEYXWR8SgLsca2weVpc1ByaqVQ"} />
      <div className="relative w-full flex items-center justify-between h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-5xl sm:text-7xl font-estilo text-amarillo">
          Nhäma
        </div>
        <div className="relative w-full flex items-start justify-start h-full">
          <div className="relative w-full items-start justify-start h-fit grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-white text-sm font-neueL">
            {VIDEOS.map((video, indice) => {
              return (
                <div
                  key={indice}
                  className="relative w-full flex flex-col gap-2 items-start justify-start h-fit cursor-pointer hover:opacity-70"
                  title={video.title}
                  onClick={() => router.push(`nhama-djorra-${indice + 1}`)}
                >
                  <div className="relative w-full h-fit flex border border-white rounded-md">
                    <div className="relative w-full h-36 flex">
                      <Image
                        className="rounded-md"
                        alt={video.title}
                        objectFit="cover"
                        src={`${INFURA_GATEWAY}/ipfs/${video.portada}`}
                        layout="fill"
                        draggable={false}
                      />
                    </div>
                  </div>
                  <div className="relative w-full h-fit flex">
                    {`Djorra' ${indice + 1} | ${video.title}`}{" "}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
