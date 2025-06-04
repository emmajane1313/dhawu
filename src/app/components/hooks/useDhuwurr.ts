import { useEffect, useState } from "react";

const useDhuwurr = (id: number) => {
  const [idioma, setIdioma] = useState<string>("english");
  const [data, setData] = useState<{ texto: string; locale: string }[]>([]);
  const [datosCargando, setDatosCargando] = useState<boolean>(false);

  const downloadJsonFromUrl = async () => {
    try {
      const res = await fetch(`/dhurru/${id}.json`);

      if (!res.ok) throw new Error(`Fallo al cargar el JSON: ${res.status}`);

      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `dhurru-${id}`,
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
    const fetchData = async () => {
      setDatosCargando(true);
      try {
        const res = await fetch(`/dhurru/${id}.json`);
        if (!res.ok)
          throw new Error(`Error ${res.status} al cargar ${id}.json`);
        const json = await res.json();

        setData(json);
      } catch (err) {
        console.error("Error al cargar el JSON:", err);
      }
      setTimeout(() => {
        setDatosCargando(false);
      }, 1000);
    };

    fetchData();
  }, [id]);

  return {
    idioma,
    setIdioma,
    data,
    datosCargando,
    downloadJsonFromUrl,
  };
};

export default useDhuwurr;
