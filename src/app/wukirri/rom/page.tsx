"use client";

import Return from "@/app/components/modules/Return";
import { INTERNAL_INFURA_GATEWAY } from "@/app/lib/constantes";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Rom() {
  const router = useRouter();
  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2 overflow-y-scroll">
      <Return
        image={"QmU7tUyRwWUY4G4eYBQYpEYXWR8SgLsca2weVpc1ByaqVQ"}
        path="/wukirri"
      />
      <div className="relative w-full flex items-center justify-between h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-5xl sm:text-7xl font-estilo text-amarillo">
          Rom
        </div>
        <div className="relative w-full h-full items-start justify-start flex overflow-y-scroll">
          <div className="relative w-full grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 items-start justify-start h-fit gap-3 text-white text-sm font-neueL pb-10">
            {[
              "QmbG94uTK5xcgiqVNJ12dEquatjqHqiM5oiUv2JBV3m5CX",
              "QmRyknmRi3oqqkPd7AYqQFs5jsxTV5pWFmftVmbroUAqHy",
              "QmeaTR275wfmkpNzGV9Cp8XZhYmFckLuGkYU6VnWhF2jij",
              "QmVN5rtZvsyCJLWDyWq8oqV5sjAcVbaviey2abX9K3D7Hg",
              "QmRZ6mWkbzEfnu9SaASFmyMmFTSHogbRqSQN4kArbZDjTW",
              "QmVtq3nuZTv7DxZhD7v3B2Y43T78SYz46ZzBAq9cjg2B53",
              "QmdSfHbhaBcpFv6DG2Vc2bMG9h5t5a5mHm8Q8RU9fBung4",
              "QmNembysZibrgaAi5ZMP8E2HrBqf7ETt5BkZrcRV4sE2Sw",
              "QmdFxbSuyxZQyGbw6D4iSZeS23cTAj3dT8jCQZxb3ucRvP",
              "QmYThhhc8FRJzzrix5qY3dwPRkCnGcQ7FNhNg85pMG5k9f",
              "QmU8bN6siyuYhCgoLgdyxRKgqUDVwjc8RKWEBpgLXxFAJV",
              "Qma8BBzXnbJveeYEC6nvZZp4LLYdqMAzGpcupWEx6gUSkP",
              "QmQhCo2rHfK4iCnn8JGtXpqroX4Mqohza8HDDuxjHGnwfn",
              "QmVHvrfT9z9JNXpsb5kGfkGaexDwv9PEvw5ubWzcSqTk8F",
              "QmPa6h21Wen4y25m6ZxiPpaYDUiuvczHFnBDz8tTHvGBD9",
              "QmZKNALcdgrBhruFnitmpXZDsx4WSoms3DYBDt4yqvekkE",
              "QmYrhi2M1CvQkhmBbDoXCfgUVgv7EDqMCP2PG3WGnXyhka",
            ].map((elemento: string, indice: number) => {
              return (
                <div
                  key={indice}
                  className="relative w-full h-fit flex cursor-point"
                  onClick={() => router.push(`/wukirri/rom/${indice}`)}
                  title={`Dhuwurr ${indice}`}
                >
                  <div className="relative w-full h-36 flex border border-white rounded-md hover:opacity-80">
                    <Image
                      alt={`Dhuwurr ${indice}`}
                      layout="fill"
                      className="rounded-md"
                      draggable={false}
                      src={`${INTERNAL_INFURA_GATEWAY}${elemento}`}
                      objectFit="cover"
                      priority
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
