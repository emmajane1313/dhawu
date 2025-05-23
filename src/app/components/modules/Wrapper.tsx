"use client";

import useParticles from "../hooks/useParticles";
import Footer from "./Footer";
import Particles from "@tsparticles/react";

export default function Wrapper({ children }: { children: React.ReactNode }) {
  const { init, particlesLoaded } = useParticles();

  return (
    <div className="bg-black w-full p-2 md:p-10 min-h-[700px] h-screen flex flex-col items-center justify-center">
      {init && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          options={{
            background: {
              color: {
                value: "#000000",
              },
            },
            fpsLimit: 60,
            interactivity: {
              events: {
                onClick: {
                  enable: false,
                },
                onHover: {
                  enable: false,
                },
              },
            },
            particles: {
              number: {
                value: 1000,
                density: {
                  enable: true,
                },
              },
              color: {
                value: ["#ffffff", "#FFFF00", "#CC0000", "#000000"],
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 0.01, max: 1 },
              },
              opacity: {
                value: { min: 0.1, max: 0.5 },
              },
              move: {
                enable: true,
                speed: 2,
                random: true,
                straight: false,
                outModes: {
                  default: "bounce",
                },
              },
              links: {
                enable: false,
              },
            },
            detectRetina: true,
          }}
        />
      )}
      <div className="relative lg:w-[80%] xl:w-[60%] w-full h-full flex flex-col border border-white rounded-md items-start justify-between overflow-y-hidden bg-black gap-3">
        {children}
        <Footer />
      </div>
    </div>
  );
}
