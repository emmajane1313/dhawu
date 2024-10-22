import useCapitulos from "@/components/hooks/useCapitulos";
import Capitulos from "@/components/modules/Capitulos";

export default function Home() {
  const {capituloActual, setCapituloActual} = useCapitulos()
  return (
    <div className="bg-black w-full h-fit overflow-y-scroll flex flex-col items-center justify-start gap-10">
      <div className="relative w-fit h-fit flex items-center justify-center flex-row gap-3">
        <div></div>
        <div></div>
      </div>
      <Capitulos capituloActual={capituloActual}  />
    </div>
  );
}
