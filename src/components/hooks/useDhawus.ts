import { useEffect, useRef, useState } from "react";
import dhawusJSON from "./../../../public/dhawus.json";
import { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { Container } from "@tsparticles/engine";

const useDhawus = () => {
  const [init, setInit] = useState(false);

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
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });

    if (dhawus?.length < 1) {
      conseguirDhawus();
    }
  }, []);


  const particlesLoaded = async (container?: Container | undefined) => {
  };

  return { dhawus, init, particlesLoaded,  };
};

export default useDhawus;
