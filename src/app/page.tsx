"use client";

import { INTERNAL_INFURA_GATEWAY } from "@/app/lib/constantes";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2">
      <div className="relative w-full sm:w-fit h-fit sm:h-full flex">
        <div className="relative w-full sm:w-60 h-40 sm:h-full border border-white rounded-md">
          <Image
            alt="Girl walks towards sunset"
            layout="fill"
            className="rounded-md"
            draggable={false}
            src={`${INTERNAL_INFURA_GATEWAY}QmVN7wZsjBG4gmbDzeK1V6XJmY7fSTFKmKX8tFubZZCLgk`}
            objectFit="cover"
            priority
          />
        </div>
      </div>
      <div className="relative w-full flex items-center justify-between h-full flex-col gap-4">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md p-2 bg-[#CC0000] border border-white">
          <div className="text-black relative w-fit h-fit flex text-sm font-manga">
            Buwa!
          </div>
          <div className="relative w-fit h-fit flex text-center text-3xl sm:text-7xl font-estilo text-[#FFFF00] break-all">
            Djartjaryun!
          </div>
          <div className="relative text-white w-fit h-fit flex text-sm font-neueL pt-4">
            Märr-ŋamathirri. Site dhuwala Yolŋukurru mathakurru. Djäl nhe
            marŋgithinyawuygu?
          </div>
        </div>
        <div className="relative w-full h-full flex flex-col items-start justify-between gap-2">
          <div
            className="relative w-full h-full border border-white rounded-md cursor-pointer hover:opacity-80"
            onClick={() => router.push("nhama")}
            title="Nhäma"
          >
            <Image
              alt="Girl walks towards sunset"
              layout="fill"
              className="rounded-md"
              draggable={false}
              src={`${INTERNAL_INFURA_GATEWAY}QmaNHfXQ8i4nHTUDg4WWz7hQcmBqucZz7fRwJGRK2QkzoB`}
              objectFit="cover"
              priority
            />
          </div>
          <div className="relative w-full h-full flex flex-row gap-2">
            <div
              className="relative w-full h-full border border-white rounded-md cursor-pointer hover:opacity-80"
              onClick={() => router.push("marnggithinyawuy")}
              title="Marŋgithinyawuy"
            >
              <Image
                alt="Girl walks towards sunset"
                layout="fill"
                className="rounded-md"
                draggable={false}
                src={`${INTERNAL_INFURA_GATEWAY}QmReGohY52YGeZ42uQB34bPb2NG7f3iZiWJwmtwtqWwrWC`}
                objectFit="cover"
                priority
              />
            </div>
            <div
              className="relative w-full h-full border border-white rounded-md cursor-pointer hover:opacity-80"
              onClick={() => router.push("dhawu-mala")}
              title="Dhäwu Mala"
            >
              <Image
                alt="Girl walks towards sunset"
                layout="fill"
                className="rounded-md"
                draggable={false}
                src={`${INTERNAL_INFURA_GATEWAY}QmQuebJgLKSP9TL5oMWc6bRi3uwpuHzY4wUv4RyreNjset`}
                objectFit="cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
