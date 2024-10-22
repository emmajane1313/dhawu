import { useState } from "react";

const useCapitulos = () => {
  const [capituloActual, setCapituloActual] = useState<number>(0);
  const [abrirCapitulo, setAbrirCapitulo] = useState<boolean>(false);

  return {
    capituloActual,
    setCapituloActual,
    abrirCapitulo,
    setAbrirCapitulo,
  };
};

export default useCapitulos;
