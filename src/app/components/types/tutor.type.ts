import { IdiomaFuente } from "./ridjin.type";

export interface Alcance {
  reglas: string[];
  lexico: string[];
}

export interface LineaTutor {
  fuente: string;
  idioma: IdiomaFuente;
  gup?: string;
  nota?: string;
}

export interface Rama {
  claves: string[];
  lineas: LineaTutor[];
  pregunta: LineaTutor;
  esperado: LineaTutor[];
}

export interface Capa {
  capa: number;
  titulo: string;
  alcance: Alcance;
  cadena: LineaTutor[];
  apertura: LineaTutor[];
  pregunta: LineaTutor;
  ramas: Rama[];
  criterio: { minimo: number; usosPorItem: number };
}

export interface Microapertura {
  id: string;
  grupo: string;
  pregunta: LineaTutor;
  esperado: LineaTutor[];
  seguimiento?: LineaTutor;
}

export interface Ritual {
  orden: string[];
  porSesion: number;
  automatico: { seguidas: number; sesionesDistintas: number };
  frecuenciaAutomatico: number;
  microaperturas: Microapertura[];
}

export interface Escena {
  id: string;
  titulo: string;
  descripcion: string;
  capas: Capa[];
}

export interface SesionPlan {
  sesion: number;
  semana: number;
  escenas: { id: string; capa: number }[];
  minutos: number;
}

export interface PlanPrograma {
  titulo: string;
  nivelMeta: string;
  idiomaAlumno: IdiomaFuente;
  minutosPorSesion: [number, number];
  sesiones: SesionPlan[];
}

export interface EstadoItem {
  vistas: number;
  aciertos: number;
  fallos: number;
  ultimaVez: string;
}

export interface FalloSesion {
  escena: string;
  capa: number;
  respuesta: string;
  esperado: string;
  correccion: string;
}

export interface SesionRegistro {
  fecha: string;
  sesion: number;
  escenas: { id: string; capa: number }[];
  minutos: number;
  aciertos: number;
  total: number;
  fallos: FalloSesion[];
  preguntasVocabulario: string[];
  huecos: string[];
}

export interface ProgresoAlumno {
  alumno: string;
  voz: string | null;
  sesionActual: number;
  capaAbierta: Record<string, number>;
  alcanceExtra: Alcance;
  alcanceBloqueado: Alcance;
  items: Record<string, EstadoItem>;
  sesiones: SesionRegistro[];
}

export interface ResultadoValidacion {
  escena: string;
  capa: number;
  origen: "cadena" | "apertura" | "pregunta" | "rama" | "rama-pregunta" | "esperado";
  indice: string;
  fuente: string;
  estado: "ok" | "sin-cobertura" | "discrepancia" | "excepcion";
  gup?: string;
  esperado?: string;
  reglas: string[];
  detalle?: string;
}
