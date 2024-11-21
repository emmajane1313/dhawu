"use client";
import useDhawus from "@/components/hooks/useDhawus";
import Marquee from "@/components/modules/Marquee";
import { INFURA_GATEWAY } from "@/constantes";
import Image from "next/legacy/image";
import { useRouter } from "next/navigation";
import Particles from "@tsparticles/react";

export default function Home() {
  const { dhawus, init, particlesLoaded } = useDhawus();
  const router = useRouter();

  return (
    <div className="bg-black w-full h-screen flex flex-col items-center gap-10">
      <div className="relative w-full">
        <Marquee />
      </div>
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
      <div className="relative w-full h-full flex">
        <div className="relative w-full h-fit flex flex-col gap-6 items-center justify-center">
          <div className="relative w-full pt-8 text-white font-estilo flex items-center justify-center h-fit px-3">
            <div
              className="relative w-fit h-fit flex text-center text-5xl sm:text-9xl"
              id="dhawu"
            >
              Dhäwu Mala
            </div>
          </div>
          <div className="relative w-full flex-grow flex items-center justify-center h-fit">
            <div className="relative w-full items-center justify-center h-fit flex px-3 sm:px-10 gap-6">
              {dhawus?.map((dhawu, indice: number) => (
                <div
                  key={indice}
                  className={`relative w-14 h-20 flex items-center justify-center border border-white bg-white ${
                    dhawu.envivo &&
                    "hover:rotate-1 cursor-pointer hover:opacity-90 hover:scale-300 hover:z-10"
                  }`}
                  title={dhawu.titulo}
                  onClick={() =>
                    dhawu.envivo &&
                    router.push(`/dhawu/${dhawu.titulo.replaceAll(" ", "-")}`)
                  }
                >
                  <Image
                    draggable={false}
                    src={`${INFURA_GATEWAY}/ipfs/${dhawu.portada}`}
                    objectFit="cover"
                    layout="fill"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <Marquee />
      </div>
    </div>
  );
}
