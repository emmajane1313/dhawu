const CLAVE_VOZ = "voz-elegida";

const VOZ_DIRECTA = process.env.NEXT_PUBLIC_VOZ_URL?.replace(/\/+$/, "");

const urlVoz = (parametros: URLSearchParams): string =>
  VOZ_DIRECTA
    ? `${VOZ_DIRECTA}/voz?${parametros.toString()}`
    : `/api/voz?${parametros.toString()}`;

const vozElegida = (): string | null => {
  try {
    return localStorage.getItem(CLAVE_VOZ);
  } catch {
    return null;
  }
};

const elegirVoz = (voz: string | null): void => {
  try {
    if (voz) localStorage.setItem(CLAVE_VOZ, voz);
    else localStorage.removeItem(CLAVE_VOZ);
  } catch (error) {
    console.log("[voz elegir]", error);
  }
};

const reproducir = async (texto: string, voz?: string | null): Promise<void> => {
  const limpio = texto.trim();
  if (!limpio) return;
  const elegida = voz === undefined ? vozElegida() : voz;
  try {
    const parametros = new URLSearchParams({ texto: limpio });
    if (elegida) parametros.set("voz", elegida);
    const respuesta = await fetch(urlVoz(parametros));
    const tipo = respuesta.headers.get("Content-Type") ?? "";
    if (!respuesta.ok || !tipo.startsWith("audio/")) {
      console.log("[voz] sin audio", respuesta.status, tipo);
      return;
    }
    const blob = await respuesta.blob();
    const url = URL.createObjectURL(blob);
    await new Promise<void>((terminar) => {
      const audio = new Audio(url);
      const cerrar = () => {
        URL.revokeObjectURL(url);
        terminar();
      };
      audio.onended = cerrar;
      audio.onerror = cerrar;
      audio.play().catch(cerrar);
    });
  } catch (error) {
    console.log("[voz]", error);
  }
};

const useVoz = () => ({ reproducir, vozElegida, elegirVoz });

export { reproducir, vozElegida, elegirVoz, urlVoz };

export default useVoz;
