import { useEffect, useState } from "react";
import dhawus from "./../../../public/dhawus.json";

const useCapitulos = (titulo: string) => {
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
        dhawus?.find((elemento) => elemento?.titulo == titulo?.replaceAll("-", " "))?.capitulos || []
      );
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
