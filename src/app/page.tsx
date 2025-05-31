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
            alt="Girl looks out window"
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
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md p-2 bg-oscuro border border-white">
          <div className="text-black relative w-fit h-fit flex text-sm font-manga">
            Buwa!
          </div>
          <div className="relative w-fit h-fit flex text-center text-3xl sm:text-7xl font-estilo text-amarillo break-all">
            Djartjaryun!
          </div>
          <div className="relative text-white w-fit h-fit flex text-sm font-neueL pt-4">
            Märr-ŋamathirri. Site dhuwala Yolŋukurru mathakurru. Djäl nhe
            marŋgithinyawuygu?
          </div>
        </div>
        <div className="relative w-full h-full flex flex-col items-start justify-between gap-2">
          <div
            className="relative w-full h-full border border-white rounded-md cursor-point hover:opacity-80"
            onClick={() => router.push("/wukirri")}
            title="Wukirri"
          >
            <Image
              alt="School bus"
              layout="fill"
              className="rounded-md"
              draggable={false}
              src={`${INTERNAL_INFURA_GATEWAY}QmaNHfXQ8i4nHTUDg4WWz7hQcmBqucZz7fRwJGRK2QkzoB`}
              objectFit="cover"
              priority
            />
            <div className="absolute bottom-2 right-2 flex w-fit h-fit border rounded-md font-neueL border-amarillo text-amarillo bg-red text-xxs px-2 py-1">
              Wukirri
            </div>
          </div>
          <div className="relative w-full h-full flex flex-row gap-2">
            <div
              className="relative w-full h-full border border-white rounded-md cursor-point hover:opacity-80"
              onClick={() => router.push("/marnggithinyawuy")}
              title="Marŋgithinyawuy"
            >
              <Image
                alt="Marŋgithinyawuy"
                layout="fill"
                className="rounded-md"
                draggable={false}
                src={`${INTERNAL_INFURA_GATEWAY}QmReGohY52YGeZ42uQB34bPb2NG7f3iZiWJwmtwtqWwrWC`}
                objectFit="cover"
                priority
              />
              <div className="absolute bottom-2 right-2 flex w-fit h-fit border rounded-md font-neueL border-amarillo text-amarillo bg-red text-xxs px-2 py-1">
                Marŋgithinyawuy
              </div>
            </div>
            <div
              className="relative w-full h-full border border-white rounded-md cursor-point hover:opacity-80"
              onClick={() => router.push("/dhawu-mala")}
              title="Dhäwu Mala"
            >
              <Image
                alt="Dhäwu Mala"
                layout="fill"
                className="rounded-md"
                draggable={false}
                src={`${INTERNAL_INFURA_GATEWAY}QmQuebJgLKSP9TL5oMWc6bRi3uwpuHzY4wUv4RyreNjset`}
                objectFit="cover"
                priority
              />
              <div className="absolute bottom-2 right-2 flex w-fit h-fit border rounded-md font-neueL border-amarillo text-amarillo bg-red text-xxs px-2 py-1">
                Dhäwu Mala
              </div>
            </div>
            <div
              className="relative w-full h-full border border-white rounded-md cursor-point hover:opacity-80"
              onClick={() => router.push("/gurrutu")}
              title="Gurruṯu"
            >
              <Image
                alt="Gurruṯu"
                layout="fill"
                className="rounded-md"
                draggable={false}
                src={`${INTERNAL_INFURA_GATEWAY}QmTripiSA4mhRqvgDDeeGSNtQQi7RW8NSKbfrNjjF9pyfg`}
                objectFit="cover"
                priority
              />
              <div className="absolute bottom-2 right-2 flex w-fit h-fit border rounded-md font-neueL border-amarillo text-amarillo bg-red text-xxs px-2 py-1">
                Gurruṯu
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
