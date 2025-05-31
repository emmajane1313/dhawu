"use client";

import { useParams, useRouter } from "next/navigation";
import { IoArrowBackCircle } from "react-icons/io5";

export default function Dhuwurr() {
  const router = useRouter();
  const id = useParams();

  return (
    <div className="relative w-full h-full flex flex-col gap-4 items-start justify-between p-2 font-neueL text-white overflow-y-scroll">
      <div
        className="relative w-fit h-fit cursor-point hover:opacity-70 text-xs bg-black px-2 py-1 border border-white rounded-md items-center justify-center flex flex-row gap-2"
        onClick={() => router.push("/wukirri/rom")}
      >
        <IoArrowBackCircle color="white" size={15} />
        <div className="relative w-fit h-fit flex">roŋiyirri</div>
      </div>
      <div className="relative w-full flex flex-col gap-2 h-full items-start justify-start"></div>
    </div>
  );
}
