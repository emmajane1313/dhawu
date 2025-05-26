"use client";
import useCapitulos from "@/app/components/hooks/useCapitulos";
import Capitulos from "@/app/components/modules/Capitulos";
import {
  useParams,
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { IoArrowBackCircle } from "react-icons/io5";

export default function Title() {
  const id = useParams();
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    capituloActual,
    setCapituloActual,
    abrirCapitulo,
    setAbrirCapitulo,
    capitulos,
  } = useCapitulos(id?.title as string, searchParams);

  return (
    <div className="bg-black w-full h-fit flex flex-col items-center justify-start gap-10 overflow-y-hidden pt-2 px-2">
      <div className="relative w-full h-fit flex">
        <div
          className="relative w-fit h-fit cursor-pointer hover:opacity-70 text-white font-neueL text-xs bg-black px-2 py-1 border border-white rounded-md items-center justify-center flex flex-row gap-2"
          onClick={() => router.push("/dhawu-mala")}
        >
          <IoArrowBackCircle color="white" size={15} />
          <div className="relative w-fit h-fit flex">roŋiyirri</div>
        </div>
      </div>
      <div className="relative w-fit h-fit flex items-center justify-center flex-row gap-3 text-white text-xs font-manga z-20 sm:flex-nowrap flex-wrap">
        <div
          className="relative w-24 h-fit border border-white flex items-center justify-center cursor-pointer hover:opacity-70 p-2"
          onClick={() => setAbrirCapitulo(!abrirCapitulo)}
        >
          {`Djorra' ${capituloActual + 1}`}
        </div>
        {abrirCapitulo && (
          <div className="absolute top-8 left-0 flex flex-col items-center justify-center w-24 border-b">
            {capitulos?.map((_, indice: number) => {
              return (
                <div
                  className={`relative w-full h-8 flex items-center justify-center border-x border-white bg-black cursor-pointer hover:opacity-70 p-2 ${
                    indice !== Capitulos.length && "border-b"
                  } ${indice == 0 && "border-t"}`}
                  key={indice}
                  onClick={() => {
                    setAbrirCapitulo(!abrirCapitulo);
                    setCapituloActual(indice);
                    const normalizedPath = path?.endsWith("/")
                      ? path.slice(0, -1)
                      : path;
                    router.push(
                      normalizedPath?.includes("?djorra=")
                        ? normalizedPath.split("?djorra=")?.[0] +
                            Number(indice + 1)
                        : normalizedPath + "?djorra=" + Number(indice + 1)
                    );
                  }}
                >
                  {`Djorra' ${indice + 1}`}
                </div>
              );
            })}
          </div>
        )}
        <div
          className={`relative w-24 h-fit flex border border-white items-center justify-center p-2 ${
            capituloActual + 1 < capitulos?.length
              ? "cursor-pointer hover:opacity-70"
              : "opacity-50"
          }`}
          onClick={() => {
            if (capituloActual + 1 < capitulos?.length) {
              setCapituloActual(capituloActual + 1);
              const normalizedPath = path?.endsWith("/")
                ? path.slice(0, -1)
                : path;

              router.push(
                normalizedPath?.includes("?djorra=")
                  ? normalizedPath.split("?djorra=")?.[0] +
                      "?djorra=" +
                      (capituloActual + 2)
                  : normalizedPath + "?djorra=" + (capituloActual + 2)
              );
            }
          }}
        >
          bulu
        </div>
      </div>
      <Capitulos
        titulo={id?.title as string}
        capitulos={capitulos}
        capituloActual={capituloActual}
      />
    </div>
  );
}
