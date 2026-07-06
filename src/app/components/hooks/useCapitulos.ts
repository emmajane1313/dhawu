import { useEffect, useState } from "react";
import dhawus from "../../../../public/dhawus.json";
import { ReadonlyURLSearchParams } from "next/navigation";

const useCapitulos = (
  titulo: string,
  searchParams: ReadonlyURLSearchParams
) => {
  const [capituloActual, setCapituloActual] = useState<number>(0);
  const [abrirCapitulo, setAbrirCapitulo] = useState<boolean>(false);
  const [capitulos, setCapitulos] = useState<
    {
      imagen: string;
      altura: number;
      anchura: number;
    }[][]
  >([]);

  useEffect(() => {
    if (titulo) {
      setCapitulos(
        dhawus?.find(
          (elemento) => elemento?.titulo == titulo?.replaceAll("-", " ")
        )?.capitulos || []
      );

      if (searchParams && searchParams?.get("djorra")) {
        setCapituloActual(Number(searchParams?.get("djorra")) - 1);
      }
    }
  }, [titulo]);

  return {
    capituloActual,
    setCapituloActual,
    abrirCapitulo,
    setAbrirCapitulo,
    capitulos,
  };
};

export default useCapitulos;
