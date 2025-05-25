export type CapitulosProps = {
  capituloActual: number;
  capitulos: {
    imagen: string;
    altura: number;
    anchura: number;
  }[][];
  titulo: string;
};

export type DictionaryEntry = {
  id: string;
  translations: {
    djambarrpuyŋu: string;
    español: string;
    english: string;
    عربي: string;
    עברית: string;
    فارسی: string;
    יידיש: string;
    português: string;
    français: string;
    türkiye: string;
    日本語: string;
    magyar: string;
    українська: string;
    "gàidhlig (albannach)": string;
  };
};

export type ReturnProps = {
  image: string;
};

export type Video = {
  portada: string;
  url: string;
  url_doblado: string;
  title: string;
  transcripciones: {
    locale: string;
    enlace: string;
  }[];
};
