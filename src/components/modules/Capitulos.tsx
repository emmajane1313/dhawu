import { FunctionComponent } from "react";
import { CapitulosProps } from "../types/components.type";
import { CAPITULOS, INFURA_GATEWAY } from "@/constantes";
import Image from "next/legacy/image";

const Capitulos: FunctionComponent<CapitulosProps> = ({
  capituloActual,
}): JSX.Element => {
  return (
    <div className="relative w-2/3 h-fit flex items-center justify-center flex flex-col">
      {CAPITULOS[capituloActual].map(
        (
          pagina: {
            imagen: string;
            altura: number;
            anchura: number;
          },
          indice: number
        ) => {
          return (
            <div key={indice} className="relative w-full">
              <Image
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
        }
      )}
    </div>
  );
};

export default Capitulos;
