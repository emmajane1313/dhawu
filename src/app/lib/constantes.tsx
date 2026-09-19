import { LanguageMode, Video } from "../components/types/components.type";
import { PasoUso, TextosIa, VozTts } from "../components/types/ia.type";
import { TextosButhuru } from "../components/types/buthuru.type";

export const INFURA_GATEWAY: string = "https://cdn.digitalax.xyz";
export const INTERNAL_INFURA_GATEWAY: string =
  "https://cdn.digitalax.xyz/ipfs/";

export const VIDEOS_GURRUTU: Video[] = [];

export const IDIOMAS = ["es", "en"] as const;

export const CLAVE_TRADUCCION = "dhawu-traduccion";

export const TRADUCCIONES_GUP: Record<string, Record<LanguageMode, string>> = {
  "Buwa!": { es: "¡Ey!", en: "Hey!" },
  "Djartjaryun!": { es: "¡Camina rápido!", en: "Walk quickly!" },
  "Märr-ŋamathirri. Site dhuwala Yolŋukurru mathakurru. Djäl nhe marŋgithinyawuygu?": {
    es: "Bienvenida. Este sitio está en lengua yolŋu. ¿Quieres aprender?",
    en: "Welcome. This site is in Yolŋu language. Do you want to learn?",
  },
  Wukirri: { es: "Escuela", en: "School" },
  Marŋgithinyawuy: { es: "Para aprender", en: "For learning" },
  "Dhäwu Mala": { es: "Historias", en: "Stories" },
  "Dhäwu Bukmak": { es: "Todas las historias", en: "All the stories" },
  Ridjin: { es: "Motor", en: "Engine" },
  "Dhäruk Mala": { es: "Palabras", en: "Words" },
  dhäruk: { es: "palabras", en: "words" },
  "Ḻarruma...": { es: "Buscar...", en: "Search..." },
  "Ḻarruma mala...": { es: "Buscar...", en: "Search..." },
  "Ḻarruma Mala": { es: "Búsqueda", en: "Search" },
  Bulu: { es: "Más", en: "More" },
  bulu: { es: "más", en: "more" },
  "roŋi'ruŋiyi": { es: "volver", en: "back" },
  wäŋa: { es: "inicio", en: "home" },
  "Baba'mirri 404: Dhuwal dhäŋuny buku-gänaŋ'thirri.": {
    es: "Insensato 404: este valle se ha quedado solo.",
    en: "Silly 404: this valley has been left alone.",
  },
  Nhäma: { es: "Ver", en: "See" },
  Djäma: { es: "Trabajo (verbos)", en: "Work (verbs)" },
  djäma: { es: "verbos", en: "verbs" },
  ŋurruk: { es: "grupo", en: "group" },
  Rom: { es: "Costumbre (lecciones)", en: "Custom (lessons)" },
  Dhuwurr: { es: "Lección", en: "Lesson" },
  Gurruṯu: { es: "Parentesco", en: "Kinship" },
  Buthuru: { es: "Oído", en: "Ear" },
  "Djorra'": { es: "Libro", en: "Book" },
  "Matha Mala": { es: "Lenguas", en: "Languages" },
  Djarrma: { es: "Habla (transcripciones)", en: "Talk (transcripts)" },
  "Marrtji →": { es: "Ir →", en: "Go →" },
  "Ŋilimurru ga ŋäthiliŋu matha birrka'yun": {
    es: "Estamos probando la lengua antigua",
    en: "We are trying the old tongue",
  },
  "Ŋarra yäku Emma-Jane MacKinnon-Lee. Nhämirri walala? Ŋarrakuŋu dhuwala djämapuy. Ŋarra djäl marŋgithinyawu djambarrpuyŋuwu ga gupapuyŋuwu. Dhuwala, ŋarra ŋuli ga wukirri. Ŋarrakuŋu wukirriwuy bäna balaŋu ḏuḏupmaraŋu.": {
    es: "Me llamo Emma-Jane MacKinnon-Lee. ¿Cómo están? Esto es obra mía. Quiero aprender djambarrpuyŋu y gupapuyŋu. Aquí escribo habitualmente. Puede que mi escritura aún falle el blanco.",
    en: "My name is Emma-Jane MacKinnon-Lee. How are you all? This is my work. I want to learn Djambarrpuyŋu and Gupapuyŋu. Here, I usually write. My writing may still miss the mark.",
  },
};

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

export const CODIGO_BUTHURU_URL =
  "https://github.com/emmajane1313/dhawu/tree/main/src/app/components/hooks";

export const REPO_BUTHURU_URL = "https://github.com/emmajane1313/dhawu";

export const COMANDOS_LOCAL_BUTHURU: string[] = [
  `git clone ${REPO_BUTHURU_URL}`,
  "cd dhawu",
  "npm install",
  "npm run dev",
];

export const LOCAL_BUTHURU_URL = "http://localhost:3000/wukirri/buthuru";

export const GUIA_LOCAL_BUTHURU_URL: Record<LanguageMode, string> = {
  es: "/buthuru/buthuru-local-es.txt",
  en: "/buthuru/buthuru-local-en.txt",
};

export const TEXTOS_BUTHURU: Record<LanguageMode, TextosButhuru> = {
  es: {
    titulo: "Buthuru",
    lema: "Construye tu propio dataset de voz en gupapuyŋu, sin que nada salga de tu ordenador.",
    intro:
      "Sube grabaciones (o grábate aquí mismo), córtalas en frases, escribe lo que se oye en cada una, aplica la anonimización si quieres, y descarga el zip listo para entrenar en Kaggle con el mismo notebook que usamos para la voz de Dhäwu.",
    privado:
      "Todo ocurre en tu navegador: el audio nunca se sube a ningún servidor. Si cierras la pestaña, el audio se pierde (las etiquetas se guardan en tu navegador); descarga el zip antes.",
    verificar:
      "No te fíes de nosotros, compruébalo. La prueba fuerte: espera a que aparezca «lista para trabajar sin red», desconecta el wifi, y haz todo el proceso hasta descargar el zip: funciona igual, porque no hay nada que enviar. La prueba fina: Inspeccionar → Red (Network) mientras la usas: verás solo los ficheros del propio sitio al cargar, y después nada; ningún POST, ninguna petición con tu audio o tu texto. El código es público:",
    sinRed: "lista para trabajar sin red",
    conRed: "cargando los notebooks…",
    local: "Aún más seguro: hazlo todo en tu ordenador",
    localAyuda:
      "Esta página es solo archivos estáticos (HTML + JavaScript) que Netlify te entrega; no hay ningún backend nuestro detrás. El proceso ya corre entero en tu CPU, así que en local es igual de rápido. La diferencia: el código que ejecutas lo has clonado tú de GitHub y lo sirve tu propio ordenador, no Netlify; puedes leerlo antes de arrancarlo y nadie puede cambiarlo después.",
    localPasos: [
      "Instala Node.js (versión LTS): en nodejs.org descarga el instalador para tu sistema y ejecútalo. En Linux: sudo apt install nodejs npm.",
      "Instala git: en macOS abre una terminal y escribe xcode-select --install; en Windows descarga el instalador de git-scm.com; en Linux: sudo apt install git.",
      "Abre una terminal (macOS: Terminal; Windows: PowerShell; Linux: Terminal) y ejecuta estos comandos uno por uno:",
    ],
    localAbrir: "Cuando la terminal diga «Ready», abre en tu navegador:",
    localGuia: "guía para dar a una IA (txt)",
    localGuiaAyuda: "Si prefieres que una IA te acompañe paso a paso, descárgale esta guía y pégasela.",
    copiar: "copiar",
    copiado: "copiado",
    copiarTodo: "copiar todos",
    aviso: "Si eres hablante de gupapuyŋu, tu propia voz es el mejor dato posible.",
    fuentes: "Audio",
    subir: "subir archivos (mp3, wav, m4a…)",
    grabar: "grabarme (micrófono)",
    grabando: "grabando",
    parar: "parar",
    textoFuente: "texto de esta grabación (opcional)",
    textoFuenteAyuda: "si tienes el texto, pégalo aquí; luego seleccionas con el ratón y pulsas «usar» en cada trozo",
    cortar: "volver a cortar",
    cortando: "cortando…",
    parametrosCorte: "corte por silencios",
    umbral: "umbral (dB)",
    silencio: "silencio mín. (s)",
    minimo: "trozo mín. (s)",
    etiquetar: "Escuchar y escribir",
    etiquetarAyuda: "cada trozo debe llevar exactamente lo que se oye; vacío = se descarta",
    soloIncompletas: "solo sin texto",
    todas: "todos",
    usarSeleccion: "usar selección",
    quitarInicio: "quitar inicio",
    quitarFinal: "quitar final",
    placeholderTrozo: "lo que se oye en este trozo",
    anonimo: "Anonimizar",
    anonimoAyuda:
      "Transformación matemática, sin redes: desplaza los formantes (otro tracto vocal), el tono y el ritmo, con una variación distinta por trozo. La voz del dataset deja de ser la tuya. Pulsa ◈ en cualquier trozo para oírlo.",
    anonimoActivo: "activada: el zip lleva la voz transformada",
    anonimoInactivo: "desactivada: el zip lleva la voz original",
    alfa: "formantes (α)",
    semitonos: "tono (semitonos)",
    ritmo: "ritmo",
    variacion: "variación por trozo",
    descargar: "Descargar",
    descargarAyuda:
      "El zip contiene dataset/metadata.csv + dataset/wavs/ (22 050 Hz, mono), la lengua gup para espeak-ng y los dos notebooks de Kaggle.",
    preparando: "preparando el zip…",
    kaggle: [
      "En kaggle.com → Datasets → New Dataset: sube gup_dataset.zip con el nombre gup-dataset.",
      "Notebooks → New Notebook → File → Import Notebook: train_kaggle.ipynb del zip.",
      "Panel derecho: Accelerator = GPU T4 x2, Internet = ON; Add Input → gup-dataset.",
      "Save Version → Save & Run All. Cada ciclo dura ~5 h; en Output aparecen gup.onnx + gup.onnx.json y gup-checkpoint.tar para continuar.",
    ],
    sinFuentes: "sin audio todavía",
    quitar: "quitar",
    resumen: "resumen",
  },
  en: {
    titulo: "Buthuru",
    lema: "Build your own Gupapuyŋu voice dataset without anything leaving your computer.",
    intro:
      "Upload recordings (or record yourself right here), cut them into sentences, type what is heard in each one, apply anonymisation if you want, and download a zip ready to train on Kaggle with the same notebook we used for the Dhäwu voice.",
    privado:
      "Everything happens in your browser: audio is never uploaded to any server. If you close the tab the audio is gone (labels are kept in your browser); download the zip first.",
    verificar:
      "Don't trust us, check it. The strong test: wait for «ready to work offline», switch off your wifi, and go through the whole process down to the zip: it works exactly the same, because there is nothing to send. The fine test: Inspect → Network while you use it: only the site's own files at load, then nothing; no POST, no request carrying your audio or your text. The code is public:",
    sinRed: "ready to work offline",
    conRed: "loading the notebooks…",
    local: "Even safer: do it all on your own computer",
    localAyuda:
      "This page is just static files (HTML + JavaScript) that Netlify hands to you; there is no backend of ours behind it. The whole process already runs on your CPU, so locally it is just as fast. The difference: the code you run is the one you cloned from GitHub yourself, served by your own computer instead of Netlify; you can read it before starting it and nobody can change it afterwards.",
    localPasos: [
      "Install Node.js (LTS version): on nodejs.org download the installer for your system and run it. On Linux: sudo apt install nodejs npm.",
      "Install git: on macOS open a terminal and type xcode-select --install; on Windows download the installer from git-scm.com; on Linux: sudo apt install git.",
      "Open a terminal (macOS: Terminal; Windows: PowerShell; Linux: Terminal) and run these commands one by one:",
    ],
    localAbrir: "When the terminal says «Ready», open in your browser:",
    localGuia: "guide to hand to an AI (txt)",
    localGuiaAyuda: "If you would rather have an AI walk you through it, download this guide and paste it to it.",
    copiar: "copy",
    copiado: "copied",
    copiarTodo: "copy all",
    aviso: "If you are a Gupapuyŋu speaker, your own voice is the best data there is.",
    fuentes: "Audio",
    subir: "upload files (mp3, wav, m4a…)",
    grabar: "record myself (microphone)",
    grabando: "recording",
    parar: "stop",
    textoFuente: "text of this recording (optional)",
    textoFuenteAyuda: "if you have the text, paste it here; then select with the mouse and press «use» on each chunk",
    cortar: "cut again",
    cortando: "cutting…",
    parametrosCorte: "silence cutting",
    umbral: "threshold (dB)",
    silencio: "min. silence (s)",
    minimo: "min. chunk (s)",
    etiquetar: "Listen and write",
    etiquetarAyuda: "each chunk must carry exactly what is heard; empty = discarded",
    soloIncompletas: "only without text",
    todas: "all",
    usarSeleccion: "use selection",
    quitarInicio: "trim start",
    quitarFinal: "trim end",
    placeholderTrozo: "what is heard in this chunk",
    anonimo: "Anonymise",
    anonimoAyuda:
      "A mathematical transform, no neural nets: shifts the formants (another vocal tract), the pitch and the rhythm, with a different variation per chunk. The dataset voice stops being yours. Press ◈ on any chunk to hear it.",
    anonimoActivo: "on: the zip carries the transformed voice",
    anonimoInactivo: "off: the zip carries the original voice",
    alfa: "formants (α)",
    semitonos: "pitch (semitones)",
    ritmo: "rate",
    variacion: "variation per chunk",
    descargar: "Download",
    descargarAyuda:
      "The zip holds dataset/metadata.csv + dataset/wavs/ (22 050 Hz, mono), the gup language for espeak-ng and the two Kaggle notebooks.",
    preparando: "preparing the zip…",
    kaggle: [
      "On kaggle.com → Datasets → New Dataset: upload gup_dataset.zip under the name gup-dataset.",
      "Notebooks → New Notebook → File → Import Notebook: train_kaggle.ipynb from the zip.",
      "Right panel: Accelerator = GPU T4 x2, Internet = ON; Add Input → gup-dataset.",
      "Save Version → Save & Run All. Each cycle takes ~5 h; Output gives gup.onnx + gup.onnx.json and gup-checkpoint.tar to continue.",
    ],
    sinFuentes: "no audio yet",
    quitar: "remove",
    resumen: "summary",
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
