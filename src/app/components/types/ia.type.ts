import { LanguageMode } from "./components.type";

export type Bilingue = Record<LanguageMode, string>;

export type VozTts = {
  id: string;
  f0: number;
  tono: Bilingue;
  muestras: string[];
};

export type PasoUso = {
  titulo: Bilingue;
  codigo: string;
};

export type TextosIa = {
  llmTitulo: string;
  llmDescripcion: string;
  descargar: string;
  ttsTitulo: string;
  ttsDescripcion: string;
  entrenamiento: string;
  entrenamientoDetalle: string[];
  vocesTitulo: string;
  vocesDescripcion: string;
  usoTitulo: string;
  configTitulo: string;
  configDetalle: string[];
  activa: string;
  elegir: string;
  probar: string;
  probarPlaceholder: string;
  sinMotor: string;
  cadena: string;
};

export type NotaVozProps = {
  texto: string;
  voz: string;
  sonando: string | null;
  sonar: (texto: string, voz: string) => Promise<void>;
};

export type EstadoIa = {
  idioma: LanguageMode;
  setIdioma: (idioma: LanguageMode) => void;
  vozActiva: string | null;
  activar: (id: string) => void;
  textoLibre: string;
  setTextoLibre: (texto: string) => void;
  sonando: string | null;
  sonar: (texto: string, voz: string) => Promise<void>;
  sinMotor: boolean;
};
