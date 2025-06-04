import { useEffect, useState } from "react";
import { DjamaEntry } from "../types/components.type";
import djama from "./../../../../public/djama.json";

const useDjama = () => {
  const [entries, setEntries] = useState<DjamaEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<DjamaEntry[]>([]);

  const fetchEntries = () => {
    try {
      const sortedData = [...djama].sort((a, b) => {
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
      });

      setEntries(sortedData);
      setFiltered(sortedData);
    } catch (err: any) {
      console.error(err?.message);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);

    const q = value.toLowerCase().trim();
    const results = entries.filter((entry) => {
      return [entry.id, ...Object.values(entry.translations)].some((word) =>
        word.toLowerCase().includes(q)
      );
    });

    setFiltered(results);
  };

  const downloadJsonFromUrl = async () => {
    try {
      const res = await fetch("/djama.json");

      if (!res.ok) throw new Error(`Fallo al cargar el JSON: ${res.status}`);

      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: "djäma",
      });

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading JSON:", error);
    }
  };

  useEffect(() => {
    if (entries?.length < 1) {
      fetchEntries();
    }
  }, []);

  return {
    search,
    handleSearch,
    filtered,
    downloadJsonFromUrl,
  };
};

export default useDjama;
