import { useState } from "react";

const useCapitulos = () => {
  const [capituloActual, setCapituloActual] = useState<number>(0);

  return {
    capituloActual,
    setCapituloActual,
  };
};

export default useCapitulos;
