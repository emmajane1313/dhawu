"use client";

import { useRouter } from "next/navigation";
import { IoArrowBackCircle } from "react-icons/io5";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="relative w-full h-full flex gap-4 items-center justify-center text-center text-xs text-white pt-2 px-2">
      <div
        className="absolute top-2 left-2 w-fit h-fit cursor-point hover:opacity-70 text-xs bg-black px-2 py-1 border border-white rounded-md items-center justify-center flex flex-row gap-2"
        onClick={() => router.push("/")}
      >
        <IoArrowBackCircle color="white" size={15} />
        <div className="relative w-fit h-fit flex">wäŋa</div>
      </div>
      Baba'mirri 404: Dhuwal dhäŋuny buku-gänaŋ'thirri.
    </div>
  );
}
