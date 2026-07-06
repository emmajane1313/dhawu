import Marquee from "@/app/components/modules/Marquee";
import { usePathname } from "next/navigation";

export default function Footer() {
  const path = usePathname();

  return path?.includes("djorra") ? (
    <></>
  ) : (
    <div className="relative bottom-0 left-0 w-full h-fit flex">
      <Marquee />
    </div>
  );
}
