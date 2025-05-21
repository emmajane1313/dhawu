import { FunctionComponent, JSX } from "react";
import { CapitulosProps } from "../types/components.type";
import { INFURA_GATEWAY } from "@/app/lib/constantes";
import Image from "next/image";

const Capitulos: FunctionComponent<CapitulosProps> = ({
  capituloActual,
  capitulos,
  titulo
}): JSX.Element => {
  return (
    <div className="relative w-2/3 h-fit flex items-center justify-center flex flex-col">
      {capitulos?.[capituloActual]?.map((pagina, indice: number) => {
        return (
          <div key={indice} className="relative w-full">
            <Image
              alt={titulo}
              layout="responsive"
              draggable={false}
              src={`${INFURA_GATEWAY}/ipfs/${pagina?.imagen}`}
              objectFit="contain"
              priority
              width={pagina?.anchura}
              height={pagina?.altura}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Capitulos;
