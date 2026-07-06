"use client";

import Return from "@/app/components/modules/Return";
import { IoMdDownload } from "react-icons/io";

export default function Ai() {
  const downloadLLM = async () => {
    try {
      const res = await fetch("/llm.txt");

      if (!res.ok) throw new Error(`Fallo al cargar el txt: ${res.status}`);

      const txt = await res.text();
      const blob = new Blob([JSON.stringify(txt, null, 2)], {
        type: "application/text",
      });

      const url = URL.createObjectURL(blob);

      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: "LLM",
      });

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading JSON:", error);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2">
      <Return
        image={"QmU7tUyRwWUY4G4eYBQYpEYXWR8SgLsca2weVpc1ByaqVQ"}
        path="/wukirri"
      />
      <div className="relative w-full flex items-center justify-start h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-5xl sm:text-7xl font-estilo text-amarillo">
          AI
        </div>
        <div className="text-white relative w-full h-fit flex flex-row gap-4 justify-between items-center sm:flex-nowrap flex-wrap font-neueL">
          <div className="relative w-fit h-fit flex">LLM.TXT</div>
          <div
            className="relative flex items-center justify-center z-10 w-fit h-fit cursor-point hover:opacity-70 bg-black p-1 border border-white rounded-md items-center justify-center"
            onClick={() => downloadLLM()}
          >
            <IoMdDownload color="white" size={15} />
          </div>
        </div>
        <div className="text-white relative w-full h-fit flex flex-row gap-4 justify-between items-center sm:flex-nowrap flex-wrap font-neueL">
          <div className="relative w-fit h-fit flex">LLAMA4</div>
          <div
            className="relative flex items-center justify-center z-10 w-fit h-fit cursor-point hover:opacity-70 bg-black p-1 border border-white rounded-md items-center justify-center"
            onClick={() => downloadLLM()}
          >
            <IoMdDownload color="white" size={15} />
          </div>
        </div>
      </div>
    </div>
  );
}
