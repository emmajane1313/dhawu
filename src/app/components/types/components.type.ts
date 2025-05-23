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
    spanish: string;
    english: string;
    arabic: string;
    hebrew: string;
    farsi: string;
    yiddish: string;
    portuguese: string;
    french: string;
    türkiye: string;
    japonese: string;
    hungarian: string;
    ukranian: string;
    "gaelic (scot)": string;
  };
};

export type ReturnProps = {
  image: string;
};
