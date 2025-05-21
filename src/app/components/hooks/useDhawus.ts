import { useEffect, useRef, useState } from "react";
import dhawusJSON from "../../../../public/dhawus.json";

const useDhawus = () => {
  const [dhawus, setDhawus] = useState<
    {
      titulo: string;
      portada: string;
      envivo: boolean;
      capitulos: {
        imagen: string;
        altura: number;
        anchura: number;
      }[][];
    }[]
  >([]);

  const conseguirDhawus = () => {
    setDhawus(dhawusJSON);
  };

  useEffect(() => {
    if (dhawus?.length < 1) {
      conseguirDhawus();
    }
  }, []);

  return { dhawus };
};

export default useDhawus;
