const CLAVE_VOZ = "voz-elegida";

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
    const respuesta = await fetch(`/api/voz?${parametros.toString()}`);
    if (!respuesta.ok) {
      console.log("[voz] sin audio", respuesta.status);
      return;
    }
    const blob = await respuesta.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    audio.onerror = () => URL.revokeObjectURL(url);
    await audio.play();
  } catch (error) {
    console.log("[voz]", error);
  }
};

const useVoz = () => ({ reproducir, vozElegida, elegirVoz });

export { reproducir, vozElegida, elegirVoz };

export default useVoz;
