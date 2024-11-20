import { FunctionComponent } from "react";
import MarqueeText from "react-fast-marquee";

const Marquee: FunctionComponent = (): JSX.Element => {
  return (
    <div className="relative bottom-0 left-0 w-full h-10 border-y border-white flex flex-row z-20">
      <MarqueeText gradient={false} speed={70} direction={"right"}>
        {Array.from({ length: 30 }).map((_, index: number) => {
          return (
            <span
              className="relative text-xs text-white px-5"
              key={index}
            >
              Milkumana dhäwu, wäŋa ga gurruṯu
            </span>
          );
        })}
      </MarqueeText>
    </div>
  );
};

export default Marquee;
