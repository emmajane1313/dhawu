import { FunctionComponent, JSX } from "react";
import MarqueeText from "react-fast-marquee";
import { useTraduccion } from "../hooks/useTraduccion";

const TEXTO_MARQUEE =
  "Ŋarra yäku Emma-Jane MacKinnon-Lee. Nhämirri walala? Ŋarrakuŋu dhuwala djämapuy. Ŋarra djäl marŋgithinyawu djambarrpuyŋuwu ga gupapuyŋuwu. Dhuwala, ŋarra ŋuli ga wukirri. Ŋarrakuŋu wukirriwuy bäna balaŋu ḏuḏupmaraŋu.";

const Marquee: FunctionComponent = (): JSX.Element => {
  const { g } = useTraduccion();
  return (
    <div className="relative bottom-0 left-0 w-full h-fit flex flex-col z-20">
      <div className="relative w-full bg-azul h-3"></div>
      <div className="relative w-full bg-white h-3"></div>
      <div className="relative w-full bg-red h-3"></div>
      <div className="relative w-full h-10 border-y border-white flex flex-row bg-black">
        <MarqueeText gradient={false} speed={70} direction={"right"}>
          {Array.from({ length: 30 }).map((_, index: number) => {
            return (
              <span className="relative text-xs text-white px-5" key={index}>
                {g(TEXTO_MARQUEE)}
              </span>
            );
          })}
        </MarqueeText>
      </div>
      <div className="relative w-full bg-black h-3"></div>
      <div className="relative w-full bg-amarillo h-3"></div>
      <div className="relative w-full bg-oscuro h-3"></div>
    </div>
  );
};

export default Marquee;
