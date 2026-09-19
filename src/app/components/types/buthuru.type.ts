export interface TrozoButhuru {
  id: string;
  inicio: number;
  fin: number;
}

export interface FuenteButhuru {
  id: string;
  nombre: string;
  duracion: number;
  tasa: number;
  muestras: Float32Array;
  texto: string;
  trozos: TrozoButhuru[];
}

export interface RecorteButhuru {
  desde: number;
  hasta: number;
}

export interface ParametrosCorte {
  umbralDb: number;
  silencioMin: number;
  trozoMin: number;
  margen: number;
}

export interface ParametrosAnonimo {
  activo: boolean;
  alfa: number;
  semitonos: number;
  ritmo: number;
  variacion: number;
}

export type EtiquetasButhuru = Record<string, Record<string, string>>;

export type RecortesButhuru = Record<string, Record<string, RecorteButhuru>>;

export interface ResumenButhuru {
  fuentes: number;
  trozos: number;
  etiquetados: number;
  minutos: number;
}

export interface TextosButhuru {
  titulo: string;
  lema: string;
  intro: string;
  privado: string;
  verificar: string;
  sinRed: string;
  conRed: string;
  local: string;
  localAyuda: string;
  localPasos: string[];
  localAbrir: string;
  localGuia: string;
  localGuiaAyuda: string;
  copiar: string;
  copiado: string;
  copiarTodo: string;
  aviso: string;
  fuentes: string;
  subir: string;
  grabar: string;
  grabando: string;
  parar: string;
  textoFuente: string;
  textoFuenteAyuda: string;
  cortar: string;
  cortando: string;
  parametrosCorte: string;
  umbral: string;
  silencio: string;
  minimo: string;
  etiquetar: string;
  etiquetarAyuda: string;
  soloIncompletas: string;
  todas: string;
  usarSeleccion: string;
  quitarInicio: string;
  quitarFinal: string;
  placeholderTrozo: string;
  anonimo: string;
  anonimoAyuda: string;
  anonimoActivo: string;
  anonimoInactivo: string;
  alfa: string;
  semitonos: string;
  ritmo: string;
  variacion: string;
  descargar: string;
  descargarAyuda: string;
  preparando: string;
  kaggle: string[];
  sinFuentes: string;
  quitar: string;
  resumen: string;
}
