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
  path: string;
};

export type Video = {
  portada: string;
  url: string;
  url_doblado: string;
  title: string;
  videos: {
    locale: string;
    enlace: string;
  }[];
  transcripciones: {
    locale: string;
    enlace: string;
  }[];
};

export interface DjamaEntry {
  id: string;
  grupo: number;
  primera: string;
  secundaria: string;
  tercera: string;
  quarta: string;
  vtr?: boolean;
  vin?: boolean;
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
}

export interface Larramu {
  contenido:
    | DictionaryEntry
    | DjamaEntry
    | [
        {
          locale: "español";
          texto: string;
        },
        {
          locale: "english";
          texto: string;
        },
        {
          locale: "عربي";
          texto: string;
        },
        {
          locale: "עברית";
          texto: string;
        },
        {
          locale: "فارسی";
          texto: string;
        },
        {
          locale: "יידיש";
          texto: string;
        },
        {
          locale: "português";
          texto: string;
        },
        {
          locale: "français";
          texto: string;
        },
        {
          locale: "türkiye";
          texto: string;
        },
        {
          locale: "日本語";
          texto: string;
        },
        {
          locale: "magyar";
          texto: string;
        },
        {
          locale: "українська";
          texto: string;
        },
        {
          locale: "gàidhlig (albannach)";
          texto: string;
        }
      ];
  pagina: string;
}
