"use client";

import Image from "next/image";
import Return from "../components/modules/Return";
import { INTERNAL_INFURA_GATEWAY } from "../lib/constantes";
import { useRouter } from "next/navigation";

export default function Wukirri() {
  const router = useRouter();
  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2 overflow-y-scroll">
      <Return
        image={"QmU7tUyRwWUY4G4eYBQYpEYXWR8SgLsca2weVpc1ByaqVQ"}
        path="/"
      />
      <div className="relative w-full flex items-center justify-start h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-5xl sm:text-7xl font-estilo text-amarillo">
          Wukirri
        </div>
        <div className="relative w-full h-full items-start justify-start flex overflow-y-scroll">
          <div className="relative w-full grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 items-start justify-start h-fit gap-3 text-white text-sm font-neueL">
            <div
              className="relative w-full h-fit flex"
              onClick={() => router.push("/wukirri/nhama")}
              title="Nhäma"
            >
              <div className="relative w-full h-36 flex border border-white rounded-md cursor-point hover:opacity-80">
                <Image
                  alt="Nhäma"
                  layout="fill"
                  className="rounded-md"
                  draggable={false}
                  src={`${INTERNAL_INFURA_GATEWAY}QmdPrZu2oHJyNkDHX4Quv7PFjner26LoUYZMY1pbQhAweT`}
                  objectFit="cover"
                  priority
                />
                <div className="absolute bottom-2 right-2 flex w-fit h-fit border rounded-md font-neueL border-amarillo text-amarillo bg-red text-xxs px-2 py-1">
                  Nhäma
                </div>
              </div>
            </div>
            <div
              className="relative w-full h-fit flex"
              onClick={() => router.push("/wukirri/djama/")}
              title="Djäma"
            >
              <div className="relative w-full h-36 flex border border-white rounded-md cursor-point hover:opacity-80">
                <Image
                  alt="Djäma"
                  layout="fill"
                  className="rounded-md"
                  draggable={false}
                  src={`${INTERNAL_INFURA_GATEWAY}QmeLETvY8dbjKeetXDPtNyc6tuiwRvRw1u2ARqQMziTbLW`}
                  objectFit="cover"
                  priority
                />
                <div className="absolute bottom-2 right-2 flex w-fit h-fit border rounded-md font-neueL border-amarillo text-amarillo bg-red text-xxs px-2 py-1">
                  Djäma
                </div>
              </div>
            </div>
            <div
              className="relative w-full h-fit flex"
              onClick={() => router.push("/wukirri/rom")}
              title="Rom"
            >
              <div className="relative w-full h-36 flex border border-white rounded-md cursor-point hover:opacity-80">
                <Image
                  alt="Rom"
                  layout="fill"
                  className="rounded-md"
                  draggable={false}
                  src={`${INTERNAL_INFURA_GATEWAY}QmSPDcqiAhyX5PiDouGwP3Dj2hdF8Ka8TCEmeSGRV9NG35`}
                  objectFit="cover"
                  priority
                />
                <div className="absolute bottom-2 right-2 flex w-fit h-fit border rounded-md font-neueL border-amarillo text-amarillo bg-red text-xxs px-2 py-1">
                  Rom
                </div>
              </div>
            </div>
            <div
              className="relative w-full h-fit flex"
              onClick={() => router.push("/wukirri/ai")}
              title="AI"
            >
              <div className="relative w-full h-36 flex border border-white rounded-md cursor-point hover:opacity-80">
                <Image
                  alt="AI"
                  layout="fill"
                  className="rounded-md"
                  draggable={false}
                  src={`${INTERNAL_INFURA_GATEWAY}QmPLwkPsNKH1Kbs35vHbax3wE66dKR2BNDJdDTFLLJE9a5`}
                  objectFit="cover"
                  priority
                />
                <div className="absolute bottom-2 right-2 flex w-fit h-fit border rounded-md font-neueL border-amarillo text-amarillo bg-red text-xxs px-2 py-1">
                  AI
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
