import { useEffect, useState } from "react";
import { DjamaEntry, Larramu } from "../types/components.type";
import palabras from "../../../../public/dictionary.json";
import verbos from "../../../../public/djama.json";

const useLarruma = () => {
  const [entries, setEntries] = useState<Larramu[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<(Larramu & { found: string })[]>([]);

  const fetchEntries = async () => {
    try {
      const allEntries: Larramu[] = [];

      for (const word of palabras) {
        allEntries.push({
          contenido: word,
          pagina: "/marnggithinyawuy",
        });
      }

      for (const word of verbos) {
        allEntries.push({
          contenido: word,
          pagina: "wukirri/djama",
        });
      }

      const res = await fetch("/api/rom");
      const dhurruEntries: Larramu[] = await res.json();

      allEntries.push(...dhurruEntries);

      setEntries(allEntries);
    } catch (err: any) {
      console.error(err?.message);
    }
  };

  const highlightMatch = (
    text: string,
    query: string,
    padding = 100
  ): string => {
    const index = text.toLowerCase().indexOf(query);
    if (index === -1) return "";

    const start = Math.max(0, index - padding);
    const end = Math.min(text.length, index + query.length + padding);

    const before = text.slice(start, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length, end);

    return `${start > 0 ? "..." : ""}${before}<mark>${match}</mark>${after}${
      end < text.length ? "..." : ""
    }`;
  };
  const handleSearch = (value: string) => {
    const q = value.toLowerCase().trim();
    setSearch(q);

    if (q == "") {
      setFiltered([]);
      return;
    }

    const results = entries.reduce<(Larramu & { found: string })[]>(
      (acc, entry) => {
        const match = Object.values(entry.contenido).find(
          (item) => typeof item === "string" && item.toLowerCase().includes(q)
        );

        if (match) {
          acc.push({
            ...entry,
            found: highlightMatch(match, q),
          });
        }

        return acc;
      },
      []
    );

    setFiltered(results);
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
  };
};

export default useLarruma;
