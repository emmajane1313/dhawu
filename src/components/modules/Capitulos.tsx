import { FunctionComponent } from "react";
import { CapitulosProps } from "../types/components.type";
import { CAPITULOS, INFURA_GATEWAY } from "@/constantes";
import Image from "next/legacy/image";

const Capitulos: FunctionComponent<CapitulosProps> = ({
  capituloActual,
}): JSX.Element => {
  return (
    <div className="relative w-full h-fit flex items-center justify-center flex flex-col">
      {CAPITULOS[capituloActual].map((pagina: string, indice: number) => {
        return (
          <div key={indice} className="relative w-full">
            <Image
              layout="responsive"
              draggable={false}
              src={`${INFURA_GATEWAY}/ipfs/${pagina}`}
              objectFit="contain"
              priority
              width={944}
              height={1360}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Capitulos;
