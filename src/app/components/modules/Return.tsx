import { INTERNAL_INFURA_GATEWAY } from "@/app/lib/constantes";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoArrowBackCircle } from "react-icons/io5";
import { ReturnProps } from "../types/components.type";

export default function Return({ image, path }: ReturnProps) {
  const router = useRouter();

  return (
    <div className="relative w-full sm:w-fit h-fit sm:h-full flex">
      <div className="relative w-full sm:w-60 h-40 sm:h-full border border-white rounded-md">
        <Image
          alt={`${path} | Dhäwu | Emancipa | Emma-Jane MacKinnon-Lee`}
          layout="fill"
          className="rounded-md"
          draggable={false}
          src={`${INTERNAL_INFURA_GATEWAY}${image}`}
          objectFit="cover"
          priority
        />
        <div
          className="absolute w-fit h-fit left-2 top-3 cursor-point hover:opacity-70 text-white font-neueL text-xs bg-black px-2 py-1 border border-white rounded-md items-center justify-center flex flex-row gap-2"
          onClick={() => router.push(path)}
        >
          <IoArrowBackCircle color="white" size={15} />
          <div className="relative w-fit h-fit flex">roŋi'ruŋiyi</div>
        </div>
      </div>
    </div>
  );
}
