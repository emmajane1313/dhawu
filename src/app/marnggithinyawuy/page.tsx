"use client";

import useMarng from "../components/hooks/useMarng";
import Return from "../components/modules/Return";

export default function Marnggithinyawuy() {
  const { search, handleSearch, filtered } = useMarng();

  return (
    <div className="relative w-full h-full flex flex-row gap-4 items-start justify-between text-white">
      <Return image={"QmVpDrjNF5xo47xfCV8arvJ7p8HfzVCWByvwSeUHQYLTWH"} />
      <div className="relative w-full flex items-center justify-between h-full flex-col gap-4 flex-col">
        <div className="relative w-full h-fit flex flex-col gap-2 text-center items-center justify-center rounded-md px-2 pt-2 pb-4 bg-[#CC0000] border border-white text-5xl sm:text-7xl font-estilo text-[#FFFF00]">
          Dhäruk Mala
        </div>
        <div className="relative w-full flex flex-col items-center justify-start h-full gap-2">
          <input
            type="text"
            placeholder="Ḻarruma..."
            className="w-full p-3 border rounded mb-6"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <table className="w-full table-auto border border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2">Gupapuyŋu</th>
                <th className="border px-4 py-2">Djambarrpuyŋu</th>
                <th className="border px-4 py-2">English</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="border px-4 py-2">
                    {entry.translations.gupapuyngu}
                  </td>
                  <td className="border px-4 py-2">
                    {entry.translations.djambarrpuyngu}
                  </td>
                  <td className="border px-4 py-2">
                    {entry.translations.english}
                  </td>

                  {/* <td className="border px-4 py-2">{entry.notes || "—"}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
          <table className="w-full  table-auto border border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2">Spanish</th>
                <th className="border px-4 py-2">Portuguese</th>
                <th className="border px-4 py-2">French</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="border px-4 py-2">
                    {entry.translations.spanish}
                  </td>
                  <td className="border px-4 py-2">
                    {entry.translations.portuguese}
                  </td>
                  <td className="border px-4 py-2">
                    {entry.translations.french}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="w-full  table-auto border border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2">Hebrew</th>
                <th className="border px-4 py-2">Arabic</th>
                <th className="border px-4 py-2">Yiddish</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="border px-4 py-2">
                    {entry.translations.hebrew}
                  </td>
                  <td className="border px-4 py-2">
                    {entry.translations.arabic}
                  </td>
                  <td className="border px-4 py-2">
                    {entry.translations.yiddish}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
