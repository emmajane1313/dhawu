"use client";

import useDhuwurr from "@/app/components/hooks/useDhuwurr";
import { INTERNAL_INFURA_GATEWAY } from "@/app/lib/constantes";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { IoMdDownload } from "react-icons/io";
import { IoArrowBackCircle } from "react-icons/io5";

export default function Dhuwurr() {
  const router = useRouter();
  const id = useParams();
  const { data, idioma, setIdioma, datosCargando, downloadJsonFromUrl } =
    useDhuwurr(Number(id?.dhuwurr));

  return (
    <div className="relative w-full h-full flex flex-col gap-4 items-start justify-start p-2 overflow-y-scroll text-white">
      <div className="relative w-full h-fit flex flex-row justify-between items-center gap-3">
        <div
          className="relative w-fit h-fit cursor-point hover:opacity-70 text-xs bg-black px-2 py-1 border border-white rounded-md items-center justify-center flex flex-row gap-2"
          onClick={() => router.push("/wukirri/rom")}
        >
          <IoArrowBackCircle color="white" size={15} />
          <div className="relative w-fit h-fit flex">roŋi'ruŋiyi</div>
        </div>
        <div
          className="relative w-fit h-fit cursor-point hover:opacity-70 bg-black p-1 border border-white rounded-md items-center justify-center"
          onClick={() => downloadJsonFromUrl()}
        >
          <IoMdDownload color="white" size={15} />
        </div>
      </div>
      <div className="relative w-full flex items-center justify-start h-full flex-col gap-4 flex-col">
        {datosCargando || data?.length < 1 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative w-fit h-fit flex">
              <div className="relative w-10 h-10 animate-spin rounded-full">
                <Image
                  alt="first nations flag"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full"
                  draggable={false}
                  src={`${INTERNAL_INFURA_GATEWAY}/QmacSZRApuHAQn4xQMSzFMq7qpw1PwyjsAEbnVvuEYYsQo`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full overflow-y-scroll items-start justify-start flex flex-col gap-10">
            <div className="relative w-full h-fit flex flex-wrap gap-3 text-xs justify-center">
              {data?.map((tran, indice) => {
                return (
                  <div
                    key={indice}
                    className={`relative w-fit h-fit flex items-center justify-center text-center cursor-point hover:opacity-70 py-1 px-2 rounded-md ${
                      idioma == tran?.locale
                        ? "border border-amarillo bg-red text-amarillo"
                        : "border border-white text-white"
                    }`}
                    onClick={() => setIdioma(tran?.locale)}
                  >
                    {tran?.locale}
                  </div>
                );
              })}
            </div>
            <div
              className="relative w-full h-fit justify-self-center px-4 overflow-y-scroll leading-8"
              id="break"
              dangerouslySetInnerHTML={{
                __html: data?.find((t) => t.locale === idioma)?.texto || "",
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
