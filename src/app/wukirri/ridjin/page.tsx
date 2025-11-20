"use client";

import Return from "@/app/components/modules/Return";

export default function Ridjin() {
  return (
    <div className="relative w-full h-full flex flex-col sm:flex-row gap-4 items-start justify-between pt-2 px-2">
      <Return
        image={"QmbzcUtYAWxngWxaYbzo5QKUfAvq7nQvZe393ocav22vPw"}
        path="/wukirri"
      />
      <div className="relative w-full flex items-center justify-between h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-oscuro border border-white text-5xl sm:text-7xl font-estilo text-amarillo">
          Ridjin
        </div>
      </div>
    </div>
  );
}