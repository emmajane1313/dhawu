import { LanguageMode, Video } from "../components/types/components.type";
import { PasoUso, TextosIa, VozTts } from "../components/types/ia.type";

export const INFURA_GATEWAY: string = "https://cdn.digitalax.xyz";
export const INTERNAL_INFURA_GATEWAY: string =
  "https://cdn.digitalax.xyz/ipfs/";

export const VIDEOS_GURRUTU: Video[] = [];

export const IDIOMAS = ["es", "en"] as const;

export const LEMA_IA = "Ŋilimurru ga ŋäthiliŋu matha birrka'yun";
export const LLM_TXT_URL = "/llm.txt";
export const MODELO_TTS_URL = "/modelos/gupapuyngu-tts.zip";
export const PRUEBA_CADENA_URL =
  "https://etherscan.io/tx/0x0ee9f30a239a85c553dbeacf8fddf6081ed8713e74c163c79fda7d7d18c559e9";
export const PRUEBA_CADENA_FECHA = "17.09.2026";

export const VOCES_TTS: VozTts[] = [
  {
    id: "mali.wata",
    f0: 251,
    tono: {
      es: "La más aguda y melódica. Es la voz con más movimiento en la entonación y la señal más limpia; brilla en frases cortas y preguntas.",
      en: "The highest and most melodic. It has the widest intonation range and the cleanest signal; it shines on short sentences and questions.",
    },
    muestras: ["Nhä dhuwala?", "Dhuwala ŋarraku wäŋa.", "Yaka ŋäthi!"],
  },
  {
    id: "mali.walu",
    f0: 246,
    tono: {
      es: "Aguda y estable. Entonación más contenida que la primera, con un timbre claro y regular; la más cómoda para frases largas.",
      en: "High and steady. A more contained intonation than the first, with a clear, even timbre; the most comfortable for long sentences.",
    },
    muestras: [
      "Goḏarr' ŋarra dhu marrtji.",
      "Ŋarra ga djäma.",
      "Dhuwala matha ŋäthiliŋu.",
    ],
  },
  {
    id: "mali.munha",
    f0: 215,
    tono: {
      es: "La más grave y serena. Entonación suave y cálida, con menos brillo en los agudos; la más cercana a una voz de lectura pausada.",
      en: "The lowest and calmest. Soft, warm intonation with less brightness in the highs; the closest to a slow reading voice.",
    },
    muestras: [
      "Ŋäthiliŋu matha ga waŋa.",
      "Dhuwala guya ŋarraku.",
      "Ŋarra manymak.",
    ],
  },
];

export const PASOS_USO_TTS: PasoUso[] = [
  {
    titulo: {
      es: "1. Instala espeak-ng (Linux: apt · macOS: brew · Windows: instalador .msi de espeak-ng) y añade la lengua gup",
      en: "1. Install espeak-ng (Linux: apt · macOS: brew · Windows: the espeak-ng .msi installer) and add the gup language",
    },
    codigo: `# Linux / macOS
DATA=$(espeak-ng --version | sed -n 's/.*Data at: *//p')
mkdir -p "$DATA/lang/aus"
cp espeak-gup/lang-gup "$DATA/lang/aus/gup"
cd espeak-gup && espeak-ng --compile=gup && cd ..

# Windows (PowerShell, como administrador)
$DATA = "C:\\Program Files\\eSpeak NG\\espeak-ng-data"
New-Item -ItemType Directory -Force "$DATA\\lang\\aus" | Out-Null
Copy-Item espeak-gup\\lang-gup "$DATA\\lang\\aus\\gup"
cd espeak-gup; espeak-ng --compile=gup; cd ..`,
  },
  {
    titulo: {
      es: "2. Sintetiza con la voz que quieras (Python 3.10+, igual en los tres sistemas)",
      en: "2. Synthesize with the voice you want (Python 3.10+, same on all three systems)",
    },
    codigo: `pip install onnxruntime "numpy<2"
python sintetizar.py "Dhuwala ŋarraku wäŋa." --modelo gup_multi.onnx --hablante mali.munha --salida hola.wav`,
  },
];

export const TEXTOS_IA: Record<LanguageMode, TextosIa> = {
  es: {
    llmTitulo: "LLM.TXT",
    llmDescripcion:
      "Un resumen de Dhäwu escrito para modelos de lenguaje: qué es el sitio, qué contiene (diccionario, Ridjin, dhuwurr, dhäwu, la voz), cómo se escribe el gupapuyŋu y qué no se debe inventar. Sigue la convención llms.txt.",
    descargar: "descargar",
    ttsTitulo: "Gupapuyŋu TTS",
    ttsDescripcion:
      "La primera voz neuronal abierta en gupapuyŋu. Lee la ortografía estándar (ŋ, ä, ḏ ṯ ṉ ḻ, el apóstrofo glotal, dj tj ny) y produce habla a 22 050 Hz. Es la misma voz que suena en el ♪ del diccionario y de Ridjin.",
    entrenamiento: "Entrenamiento",
    entrenamientoDetalle: [
      "Piper (VITS, calidad media) afinado desde en_US-lessac-medium; los pesos ingleses solo son un punto de partida, el inventario fonético es el del gupapuyŋu, definido en una lengua propia para espeak-ng.",
      "2 336 frases, ~163 minutos. Cada trozo fue transcrito a mano; el alineado automático se probó y se descartó.",
      "Lotes de 8, fp32, ciclos de 5 horas en una T4 de Kaggle.",
      "El modelo es de multi-hablante. Ninguna voz es una persona real.",
      "La descarga incluye los dos notebooks de Kaggle (mono y multi-hablante) tal cual se usaron. Los datos de entrenamiento no se distribuyen: para reproducirlo subes tu propio dataset en formato LJSpeech (metadata.csv id|text + wavs/ a 22 050 Hz). Los próximos modelos se entrenarán con datos totalmente sintéticos para poder publicar también el dataset; el actual se reserva por privacidad.",
    ],
    vocesTitulo: "Las tres voces",
    vocesDescripcion:
      "Cada muestra se genera en el momento; no hay audio guardado. Escribe tu propia frase para probar cualquiera de ellas y elige la que quieras oír en todo el sitio.",
    usoTitulo: "Cómo usarlo",
    configTitulo: "Cómo configurarlo",
    configDetalle: [
      "--hablante mali.wata | mali.walu | mali.munha elige la voz (claves del speaker_id_map del .json).",
      "--duracion 1.1 ralentiza (valores > 1) o acelera (< 1) el habla; por defecto usa length_scale del .json.",
      "noise_scale y noise_w en gup_multi.onnx.json controlan la variación de la entonación; bajarlos da una lectura más plana y estable.",
      "El apóstrofo final de palabra (ŋama') se pronuncia como oclusión glotal gracias a apostrophe 2 en lang-gup; no lo borres al limpiar el texto.",
      "sintetizar.py llama a espeak-ng por su nombre: en Windows añade C:\\Program Files\\eSpeak NG al PATH (o pon la ruta completa en el script). Funciona en Linux, macOS (Intel y Apple Silicon) y Windows.",
    ],
    activa: "activa en el sitio",
    elegir: "usar en todo el sitio",
    probar: "probar",
    probarPlaceholder: "Escribe una frase en gupapuyŋu…",
    sinMotor:
      "La voz se genera en el servidor local con el modelo; aquí no está disponible.",
    cadena: "prueba en cadena · la primera voz sintética de Gupapuyŋu",
  },
  en: {
    llmTitulo: "LLM.TXT",
    llmDescripcion:
      "A summary of Dhäwu written for language models: what the site is, what it holds (dictionary, Ridjin, dhuwurr, dhäwu, the voice), how Gupapuyŋu is written and what must not be invented. Follows the llms.txt convention.",
    descargar: "download",
    ttsTitulo: "Gupapuyŋu TTS",
    ttsDescripcion:
      "The first open neural voice for Gupapuyŋu. It reads the standard orthography (ŋ, ä, ḏ ṯ ṉ ḻ, the glottal apostrophe, dj tj ny) and produces 22 050 Hz speech. It is the same voice behind the ♪ in the dictionary and in Ridjin.",
    entrenamiento: "Training",
    entrenamientoDetalle: [
      "Piper (VITS, medium quality) fine-tuned from en_US-lessac-medium; the English weights are only a starting point, the phoneme inventory is Gupapuyŋu's, defined in a custom espeak-ng language.",
      "2 336 utterances, ~163 minutes. Every chunk was transcribed by hand; forced alignment was tried and rejected.",
      "Batch 8, fp32, 5-hour cycles on a Kaggle T4.",
      "The model is multi-speaker. None of the voices are a real person.",
      "The download includes the two Kaggle notebooks (single and multi-speaker) exactly as used. The training data is not distributed: to reproduce it you upload your own dataset in LJSpeech format (metadata.csv id|text + wavs/ at 22 050 Hz). Future models will be trained on fully synthetic data so the dataset can be published too; the current one is withheld for privacy.",
    ],
    vocesTitulo: "The three voices",
    vocesDescripcion:
      "Every sample is generated on the spot; no audio is stored. Type your own sentence to try any of them and pick the one you want to hear across the site.",
    usoTitulo: "How to use it",
    configTitulo: "How to configure it",
    configDetalle: [
      "--hablante mali.wata | mali.walu | mali.munha picks the voice (keys of speaker_id_map in the .json).",
      "--duracion 1.1 slows down (> 1) or speeds up (< 1) the speech; by default it uses length_scale from the .json.",
      "noise_scale and noise_w in gup_multi.onnx.json control intonation variation; lowering them gives a flatter, steadier reading.",
      "The word-final apostrophe (ŋama') is spoken as a glottal stop thanks to apostrophe 2 in lang-gup; do not strip it when cleaning text.",
      "sintetizar.py calls espeak-ng by name: on Windows add C:\\Program Files\\eSpeak NG to PATH (or put the full path in the script). Works on Linux, macOS (Intel and Apple Silicon) and Windows.",
    ],
    activa: "active on the site",
    elegir: "use across the site",
    probar: "try",
    probarPlaceholder: "Type a sentence in Gupapuyŋu…",
    sinMotor:
      "The voice is generated on the local server with the model; it is not available here.",
    cadena: "on-chain proof · the first synthetic Gupapuyŋu voice",
  },
};

export const VIDEOS: Video[] = [
  {
    title: "Nhe yol?",
    url: "QmbuRxiTjfEe9mnR3CXeBbPh5G1hBfcFMDa9FXWPqLay7U",
    url_doblado: "QmfPeo25NDHqCzRCcuN4rHFwoXS7M8AEMtD8qs7zFCmFFS",
    portada: "QmUDiuBqcSU7j8ftkGbe8BuA9iVEkm4URn6ikpg9UvWWoS",
    transcripciones: [
      {
        locale: "español",
        enlace: "",
      },
      {
        locale: "english",
        enlace: "",
      },
      {
        locale: "عربي",
        enlace: "",
      },
      {
        locale: "עברית",
        enlace: "",
      },
      {
        locale: "فارسی",
        enlace: "",
      },
      {
        locale: "יידיש",
        enlace: "",
      },
      {
        locale: "português",
        enlace: "",
      },
      {
        locale: "français",
        enlace: "",
      },
      {
        locale: "türkiye",
        enlace: "",
      },
      {
        locale: "日本語",
        enlace: "",
      },
      {
        locale: "magyar",
        enlace: "",
      },
      {
        locale: "українська",
        enlace: "",
      },
      {
        locale: "gàidhlig (albannach)",
        enlace: "",
      },
    ],
    videos: [
      {
        locale: "español",
        enlace: "QmfG51PgHrytqQQkVXJTmkKnhpLV4f1PCAHoiqdWfVNeat",
      },
      {
        locale: "english",
        enlace: "QmecB4dmLUg9zUxRQH6HETg2vd8m8ktWXb35neBcXPLrJG",
      },
    ],
  },
  {
    title: "Wulanŋura",
    url: "QmW5Z3nXepZPdNJ2hNN7h4t4BTdHzF5pty7CTWGyTz5dJY",
    url_doblado: "QmZhvgLc1qaBQg9aDARGvaQcY2VSmiQ55GCwZaNYVvd7zc",
    portada: "Qmf4fTke777vLgjsigHu6HWDo9Jr1bGMmv6zyDcLbDwi8x",
    transcripciones: [
      {
        locale: "español",
        enlace: "",
      },
      {
        locale: "english",
        enlace: "",
      },
      {
        locale: "عربي",
        enlace: "",
      },
      {
        locale: "עברית",
        enlace: "",
      },
      {
        locale: "فارسی",
        enlace: "",
      },
      {
        locale: "יידיש",
        enlace: "",
      },
      {
        locale: "português",
        enlace: "",
      },
      {
        locale: "français",
        enlace: "",
      },
      {
        locale: "türkiye",
        enlace: "",
      },
      {
        locale: "日本語",
        enlace: "",
      },
      {
        locale: "magyar",
        enlace: "",
      },
      {
        locale: "українська",
        enlace: "",
      },
      {
        locale: "gàidhlig (albannach)",
        enlace: "",
      },
    ],
    videos: [
      {
        locale: "español",
        enlace: "",
      },
      {
        locale: "english",
        enlace: "",
      },
    ],
  },
];
