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
    gupapuyngu: string;
    djambarrpuyngu: string;
    spanish: string;
    english: string;
    arabic: string;
    yiddish: string;
    hebrew: string;
    portuguese: string;
    french: string;
  };
};

export type ReturnProps = {
  image: string;
};
