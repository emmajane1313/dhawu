import { useEffect, useState } from "react";
import { DictionaryEntry } from "../types/components.type";
import data from "./../../../../public/dictionary.json";
const useMarng = () => {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<DictionaryEntry[]>([]);

  const fetchEntries = () => {
    try {
      const sortedData = [...data].sort((a, b) => {
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

export default useMarng;
