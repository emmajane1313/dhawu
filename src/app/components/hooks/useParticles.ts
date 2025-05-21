import { useEffect, useRef, useState } from "react";
import dhawusJSON from "../../../../public/dhawus.json";
import { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { Container } from "@tsparticles/engine";

const useParticles = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container | undefined) => {};

  return { init, particlesLoaded };
};

export default useParticles;
