import { ParametrosAnonimo, ParametrosCorte, TrozoButhuru } from "../types/buthuru.type";

const TASA_SALIDA = 22050;

const decodificar = async (
  archivo: Blob
): Promise<{ muestras: Float32Array; tasa: number; duracion: number }> => {
  const contexto = new AudioContext();
  const datos = await archivo.arrayBuffer();
  const buffer = await contexto.decodeAudioData(datos);
  const canales = buffer.numberOfChannels;
  const mono = new Float32Array(buffer.length);
  for (let c = 0; c < canales; c++) {
    const canal = buffer.getChannelData(c);
    for (let i = 0; i < buffer.length; i++) mono[i] += canal[i] / canales;
  }
  await contexto.close();
  return { muestras: mono, tasa: buffer.sampleRate, duracion: buffer.duration };
};

const cortarPorSilencio = (
  muestras: Float32Array,
  tasa: number,
  parametros: ParametrosCorte,
  prefijo: string
): TrozoButhuru[] => {
  const ventana = Math.max(1, Math.round(tasa * 0.02));
  const umbral = Math.pow(10, parametros.umbralDb / 20);
  const total = muestras.length / tasa;
  const cortes: number[] = [0];
  let enSilencio = false;
  let inicioSilencio = 0;
  for (let i = 0; i < muestras.length; i += ventana) {
    let energia = 0;
    const fin = Math.min(muestras.length, i + ventana);
    for (let j = i; j < fin; j++) energia += muestras[j] * muestras[j];
    const rms = Math.sqrt(energia / (fin - i));
    const t = i / tasa;
    if (rms < umbral) {
      if (!enSilencio) {
        enSilencio = true;
        inicioSilencio = t;
      }
    } else if (enSilencio) {
      enSilencio = false;
      if (t - inicioSilencio >= parametros.silencioMin) cortes.push((inicioSilencio + t) / 2);
    }
  }
  cortes.push(total);
  const trozos: TrozoButhuru[] = [];
  for (let k = 0; k < cortes.length - 1; k++) {
    const a = cortes[k];
    const b = cortes[k + 1];
    if (b - a < parametros.trozoMin) continue;
    trozos.push({
      id: `${prefijo}-${trozos.length + 1}`,
      inicio: Math.round(Math.max(0, a - parametros.margen) * 100) / 100,
      fin: Math.round(Math.min(total, b + parametros.margen) * 100) / 100,
    });
  }
  return trozos;
};

const extraer = (muestras: Float32Array, tasa: number, inicio: number, fin: number): Float32Array =>
  muestras.slice(Math.max(0, Math.floor(inicio * tasa)), Math.min(muestras.length, Math.floor(fin * tasa)));

const remuestrear = (entrada: Float32Array, factor: number): Float32Array => {
  const n = Math.max(1, Math.round(entrada.length / factor));
  const salida = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const posicion = i * factor;
    const k = Math.floor(posicion);
    const fraccion = posicion - k;
    const a = entrada[Math.min(k, entrada.length - 1)];
    const b = entrada[Math.min(k + 1, entrada.length - 1)];
    salida[i] = a + (b - a) * fraccion;
  }
  return salida;
};

const estirarTiempo = (entrada: Float32Array, tasa: number, factor: number): Float32Array => {
  if (Math.abs(factor - 1) < 0.001) return entrada;
  const ventana = Math.round(tasa * 0.03);
  const salto = Math.round(ventana / 2);
  const busqueda = Math.round(tasa * 0.008);
  const largoSalida = Math.round(entrada.length * factor);
  const salida = new Float32Array(largoSalida + ventana);
  const hann = new Float32Array(ventana);
  for (let i = 0; i < ventana; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / ventana);
  let posicionSalida = 0;
  let anterior = 0;
  while (posicionSalida + ventana < largoSalida) {
    const objetivo = Math.round(posicionSalida / factor);
    let mejor = objetivo;
    let mejorCorrelacion = -Infinity;
    if (posicionSalida > 0) {
      for (let d = -busqueda; d <= busqueda; d++) {
        const candidato = objetivo + d;
        if (candidato < 0 || candidato + ventana >= entrada.length) continue;
        let correlacion = 0;
        for (let i = 0; i < ventana; i += 4) {
          correlacion += entrada[anterior + i] * entrada[candidato + i];
        }
        if (correlacion > mejorCorrelacion) {
          mejorCorrelacion = correlacion;
          mejor = candidato;
        }
      }
    }
    if (mejor + ventana >= entrada.length) break;
    for (let i = 0; i < ventana; i++) salida[posicionSalida + i] += entrada[mejor + i] * hann[i];
    anterior = mejor + salto;
    posicionSalida += salto;
  }
  return salida.slice(0, largoSalida);
};

const semillaDe = (texto: string): (() => number) => {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
};

const anonimizar = (
  entrada: Float32Array,
  tasa: number,
  parametros: ParametrosAnonimo,
  semilla: string
): Float32Array => {
  const azar = semillaDe(semilla);
  const variar = (base: number) => base * (1 + (azar() * 2 - 1) * parametros.variacion);
  const alfa = variar(parametros.alfa);
  const tono = Math.pow(2, variar(parametros.semitonos) / 12);
  const ritmo = variar(parametros.ritmo);
  const factorMuestreo = alfa * tono;
  const desplazada = remuestrear(entrada, factorMuestreo);
  const factorTiempo = (entrada.length / desplazada.length) * (1 / ritmo);
  return estirarTiempo(desplazada, tasa, factorTiempo);
};

const aTasaSalida = (entrada: Float32Array, tasa: number): Float32Array =>
  tasa === TASA_SALIDA ? entrada : remuestrear(entrada, tasa / TASA_SALIDA);

const codificarWav = (muestras: Float32Array, tasa: number): Uint8Array => {
  const datos = new ArrayBuffer(44 + muestras.length * 2);
  const vista = new DataView(datos);
  const escribir = (posicion: number, texto: string) => {
    for (let i = 0; i < texto.length; i++) vista.setUint8(posicion + i, texto.charCodeAt(i));
  };
  escribir(0, "RIFF");
  vista.setUint32(4, 36 + muestras.length * 2, true);
  escribir(8, "WAVE");
  escribir(12, "fmt ");
  vista.setUint32(16, 16, true);
  vista.setUint16(20, 1, true);
  vista.setUint16(22, 1, true);
  vista.setUint32(24, tasa, true);
  vista.setUint32(28, tasa * 2, true);
  vista.setUint16(32, 2, true);
  vista.setUint16(34, 16, true);
  escribir(36, "data");
  vista.setUint32(40, muestras.length * 2, true);
  let pico = 0;
  for (let i = 0; i < muestras.length; i++) pico = Math.max(pico, Math.abs(muestras[i]));
  const ganancia = pico > 0 ? Math.min(1, 0.95 / pico) : 1;
  for (let i = 0; i < muestras.length; i++) {
    const v = Math.max(-1, Math.min(1, muestras[i] * ganancia));
    vista.setInt16(44 + i * 2, v < 0 ? v * 32768 : v * 32767, true);
  }
  return new Uint8Array(datos);
};

const aBlobWav = (muestras: Float32Array, tasa: number): Blob =>
  new Blob([codificarWav(muestras, tasa).buffer as ArrayBuffer], { type: "audio/wav" });

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

const crc32 = (datos: Uint8Array): number => {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const construirZip = (archivos: { ruta: string; datos: Uint8Array }[]): Blob => {
  const codificador = new TextEncoder();
  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let desplazamiento = 0;
  for (const archivo of archivos) {
    const nombre = codificador.encode(archivo.ruta);
    const crc = crc32(archivo.datos);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, 0, true);
    local.setUint16(12, 0x21, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, archivo.datos.length, true);
    local.setUint32(22, archivo.datos.length, true);
    local.setUint16(26, nombre.length, true);
    local.setUint16(28, 0, true);
    const entrada = new DataView(new ArrayBuffer(46));
    entrada.setUint32(0, 0x02014b50, true);
    entrada.setUint16(4, 20, true);
    entrada.setUint16(6, 20, true);
    entrada.setUint16(8, 0x0800, true);
    entrada.setUint16(10, 0, true);
    entrada.setUint16(12, 0, true);
    entrada.setUint16(14, 0x21, true);
    entrada.setUint32(16, crc, true);
    entrada.setUint32(20, archivo.datos.length, true);
    entrada.setUint32(24, archivo.datos.length, true);
    entrada.setUint16(28, nombre.length, true);
    entrada.setUint16(30, 0, true);
    entrada.setUint16(32, 0, true);
    entrada.setUint16(34, 0, true);
    entrada.setUint16(36, 0, true);
    entrada.setUint32(38, 0, true);
    entrada.setUint32(42, desplazamiento, true);
    partes.push(new Uint8Array(local.buffer), nombre, archivo.datos);
    central.push(new Uint8Array(entrada.buffer), nombre);
    desplazamiento += 30 + nombre.length + archivo.datos.length;
  }
  const tamanoCentral = central.reduce((suma, p) => suma + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(4, 0, true);
  fin.setUint16(6, 0, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamanoCentral, true);
  fin.setUint32(16, desplazamiento, true);
  fin.setUint16(20, 0, true);
  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)] as BlobPart[], {
    type: "application/zip",
  });
};

export {
  TASA_SALIDA,
  decodificar,
  cortarPorSilencio,
  extraer,
  anonimizar,
  aTasaSalida,
  codificarWav,
  aBlobWav,
  construirZip,
};
