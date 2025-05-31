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
      return Object.values(entry.translations).some((word) =>
        word.toLowerCase().includes(q)
      );
    });

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

export default useDjama;
