import { INTERNAL_INFURA_GATEWAY } from "@/app/lib/constantes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoArrowBackCircle } from "react-icons/io5";
import { ReturnProps } from "../types/components.type";

export default function Return({ image }: ReturnProps) {
  const router = useRouter();

  return (
    <div className="relative w-fit h-full flex">
      <div className="relative w-60 h-full border border-white rounded-md">
        <Image
          alt="Girl walks towards sunset"
          layout="fill"
          className="rounded-md"
          draggable={false}
          src={`${INTERNAL_INFURA_GATEWAY}${image}`}
          objectFit="cover"
          priority
        />
        <div
          className="absolute w-fit h-fit left-2 top-3 cursor-pointer hover:opacity-70 text-white font-nueuL text-xs bg-black px-2 py-1 border border-white rounded-md items-center justify-center flex flex-row gap-2"
          onClick={() => router.push("/")}
        >
          <IoArrowBackCircle color="white" size={15} />
          <div className="relative w-fit h-fit flex">roŋiyirri</div>
        </div>
      </div>
    </div>
  );
}
